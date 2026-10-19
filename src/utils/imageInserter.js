// 还原自打包产物 — 原始模块: utils/imageInserter.js
import { extension_settings } from "../../../../../extensions.js";
import { chat, eventSource, event_types, messageFormatting, saveChatConditional } from "../../../../../script.js";
import { getContext } from "../../../../../st-context.js";
import { extensionName } from "./config.js";
import { debugBranch, debugContent, debugElement, debugLog, debugTimer } from "./debugLogger.js";
import { applyWordReplacement } from "./wordReplacementService.js";
import { getcharData, setcharData } from "./chatDataUtils.js";
import "./settings/wordReplacement.js"; // init_wordReplacement

var IMAGES_CLOSE_RE, IMAGES_OPEN_RE, IMAGE_CLOSE_RE, IMAGE_PROMPT_MARKER_RE, PROMPT_CLOSE_RE, REGEX_MARKER_GLOBAL_RE, REGEX_MARKER_RE, wrAiEditor, wrProfileSelect, wrTextEditor;

IMAGES_OPEN_RE = /<images>/i;

IMAGES_CLOSE_RE = /<\/images>|<\\images>/i;

IMAGE_CLOSE_RE = /<\/image>|<\\image>/gi;

REGEX_MARKER_RE = /regex\s*:/i;

REGEX_MARKER_GLOBAL_RE = /regex\s*:/gi;

IMAGE_PROMPT_MARKER_RE = /image###/i;

PROMPT_CLOSE_RE = /###/g;

function removeThinkingText(text) {
  if (!text || typeof text !== "string") return text;
  let result = text;
  const thinkTagRegex = /<think(?:ing)?[\s\S]*?<\/think(?:ing)?>/gi;
  result = result.replace(thinkTagRegex, "");
  const thinkingRegex = /^[\s\S]*?<\/think(?:ing)?>/i;
  const beforeThinking = result;
  result = result.replace(thinkingRegex, "");
  if (result !== beforeThinking) {
    console.log("[imageInserter] Removed thinking text, length:", beforeThinking.length, "-> new length:", result.length);
  }
  const beforeCommentRemoval = result;
  result = result.replace(/<!--[\s\S]*?-->/g, "");
  if (result !== beforeCommentRemoval) {
    console.log("[imageInserter] Removed HTML comments, length:", beforeCommentRemoval.length, "-> new length:", result.length);
  }
  const beforeContentRemoval = result;
  result = result.replace(/^[\s\S]*?<content>\s*/i, "");
  if (result !== beforeContentRemoval) {
    console.log("[imageInserter] Removed text before <content>, length:", beforeContentRemoval.length, "-> new length:", result.length);
  }
  const beforeOuterRemoval = result;
  result = result.replace(
    /(?:<font[^>]*>\[[^\]]*\]<\/font>\s*)?(?:<Tag_think>[\s\S]*?<\/Tag_think>\s*)?<image>[\s\S]*?<\/image>/g,
    ""
  );
  if (result !== beforeOuterRemoval) {
    console.log("[imageInserter] Removed <image> blocks (with font/Tag_think), length:", beforeOuterRemoval.length, "-> new length:", result.length);
  }
  const { startTag, endTag } = getImageTags();
  const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const imageTagRegex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "g");
  const beforeImageRemoval = result;
  result = result.replace(imageTagRegex, "");
  if (result !== beforeImageRemoval) {
    console.log("[imageInserter] Removed existing image### tags, length:", beforeImageRemoval.length, "-> new length:", result.length);
  }
  return result;
}

function removeThinkingTextOnly(text) {
  if (!text || typeof text !== "string") return text;
  let result = text;
  const thinkTagRegex = /<(?:think(?:ing)?|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)\b[^>]*>[\s\S]*?<\/(?:think(?:ing)?|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)>/gi;
  result = result.replace(thinkTagRegex, "");
  const thinkingRegex = /^[\s\S]*?<\/(?:think(?:ing)?|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)>/i;
  const beforeThinking = result;
  result = result.replace(thinkingRegex, "");
  if (result !== beforeThinking) {
    console.log("[imageInserter] Removed thinking text only, length:", beforeThinking.length, "-> new length:", result.length);
  }
  const beforeCommentRemoval = result;
  result = result.replace(/<!--[\s\S]*?-->/g, "");
  if (result !== beforeCommentRemoval) {
    console.log("[imageInserter] Removed HTML comments, length:", beforeCommentRemoval.length, "-> new length:", result.length);
  }
  const beforeContentRemoval = result;
  result = result.replace(/^[\s\S]*?<content>\s*/i, "");
  if (result !== beforeContentRemoval) {
    console.log("[imageInserter] Removed text before <content> only, length:", beforeContentRemoval.length, "-> new length:", result.length);
  }
  return result;
}

function getImageTags() {
  const settings3 = extension_settings[extensionName];
  const startTag = settings3?.startTag || "image###";
  const endTag = settings3?.endTag || "###";
  return { startTag, endTag };
}

function fuzzyMatchLine(logicalText, targetSnippet, minSimilarity = 0.5) {
  const lines = logicalText.split("\n");
  const normalizedTarget = targetSnippet.trim();
  if (!normalizedTarget) return null;
  let bestMatch = null;
  let bestScore = 0;
  let currentIndex = 0;
  const topCandidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineEnd = currentIndex + line.length;
    const score = calculateLineSimilarity(line, normalizedTarget);
    if (score > 0) {
      topCandidates.push({
        lineIndex: i,
        score,
        preview: line.substring(0, 50) + (line.length > 50 ? "..." : "")
      });
      topCandidates.sort((a, b) => b.score - a.score);
      if (topCandidates.length > 5) topCandidates.pop();
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        lineIndex: i,
        endIndex: lineEnd,
        // 行末位置（换行符之前）
        similarity: score,
        matchedLine: line
      };
    }
    currentIndex = lineEnd + 1;
  }
  if (topCandidates.length > 0) {
    console.log("[fuzzyMatchLine] Target:", normalizedTarget.substring(0, 40) + (normalizedTarget.length > 40 ? "..." : ""));
    console.log("[fuzzyMatchLine] Top 5 candidates:");
    topCandidates.forEach((c, idx) => {
      const isSelected = bestMatch && c.lineIndex === bestMatch.lineIndex;
      console.log(`  ${idx + 1}. [Line ${c.lineIndex}] Score: ${(c.score * 100).toFixed(1)}% ${isSelected ? "\u2713 SELECTED" : ""}`);
      console.log(`     "${c.preview}"`);
    });
  }
  if (bestMatch) {
    return bestMatch;
  }
  return null;
}

function calculateLineSimilarity(line, target) {
  const normLine = line.trim().toLowerCase();
  const normTarget = target.trim().toLowerCase();
  if (!normLine || !normTarget) return 0;
  if (normLine.includes(normTarget)) {
    const lengthRatio = normTarget.length / normLine.length;
    return 0.9 + lengthRatio * 0.1;
  }
  if (normTarget.includes(normLine) && normLine.length > 10) return 0.95;
  const charOverlap = calculateCharOverlapWithFrequency(normLine, normTarget);
  const ngramScore = calculateNgramSimilarity(normLine, normTarget, 3);
  return charOverlap * 0.5 + ngramScore * 0.5;
}

function calculateCharOverlapWithFrequency(line, target) {
  const lineChars = line.split("").filter((c) => c.trim());
  const targetChars = target.split("").filter((c) => c.trim());
  if (targetChars.length === 0) return 0;
  const lineFreq = {};
  for (const char of lineChars) {
    lineFreq[char] = (lineFreq[char] || 0) + 1;
  }
  let matched = 0;
  for (const char of targetChars) {
    if (lineFreq[char] > 0) {
      matched++;
      lineFreq[char]--;
    }
  }
  return matched / targetChars.length;
}

function calculateNgramSimilarity(str1, str2, n = 3) {
  const minLen = Math.min(str1.length, str2.length);
  const actualN = Math.max(1, Math.min(n, minLen));
  const getNgrams = (str) => {
    const ngrams = /* @__PURE__ */ new Set();
    for (let i = 0; i <= str.length - actualN; i++) {
      ngrams.add(str.substring(i, i + actualN));
    }
    return ngrams;
  };
  const ngrams1 = getNgrams(str1);
  const ngrams2 = getNgrams(str2);
  if (ngrams1.size === 0 || ngrams2.size === 0) return 0;
  let intersection = 0;
  for (const ng of ngrams1) {
    if (ngrams2.has(ng)) intersection++;
  }
  const union = ngrams1.size + ngrams2.size - intersection;
  return intersection / union;
}

function normalizeImagesReply(input) {
  const source = typeof input === "string" ? input : "";
  const extracted = extractImagesSection(source);
  if (!extracted.found) {
    return {
      changed: false,
      foundImagesBlock: false,
      keptEntries: 0,
      droppedEntries: 0,
      warnings: ["No <images> block found."],
      output: source
    };
  }
  const normalizedBlock = normalizeImagesBlock(extracted.block);
  const output = source.slice(0, extracted.start) + normalizedBlock.block + source.slice(extracted.end);
  const result = {
    changed: output !== source,
    foundImagesBlock: true,
    keptEntries: normalizedBlock.keptEntries,
    droppedEntries: normalizedBlock.droppedEntries,
    warnings: normalizedBlock.warnings,
    output
  };
  if (result.changed) {
    console.log(
      "[imageBlockNormalizer] repaired image block:",
      `kept=${result.keptEntries}`,
      `dropped=${result.droppedEntries}`,
      result.warnings.length ? `warnings=${JSON.stringify(result.warnings)}` : ""
    );
  }
  return result;
}

function extractImagesSection(input) {
  const openMatch = IMAGES_OPEN_RE.exec(input);
  if (!openMatch) {
    return { found: false, start: -1, end: -1, block: "" };
  }
  const start = openMatch.index;
  const bodyStart = start + openMatch[0].length;
  const rest = input.slice(bodyStart);
  const closeMatch = IMAGES_CLOSE_RE.exec(rest);
  const end = closeMatch ? bodyStart + closeMatch.index + closeMatch[0].length : input.length;
  const block = input.slice(start, end);
  return { found: true, start, end, block };
}

function normalizeImagesBlock(block) {
  const warnings = [];
  const openMatch = IMAGES_OPEN_RE.exec(block);
  if (!openMatch) {
    return {
      block,
      keptEntries: 0,
      droppedEntries: 0,
      warnings: ["Malformed images block: missing <images>."]
    };
  }
  const openEnd = openMatch.index + openMatch[0].length;
  const rest = block.slice(openEnd);
  const closeMatch = IMAGES_CLOSE_RE.exec(rest);
  const rawBody = closeMatch ? rest.slice(0, closeMatch.index) : rest;
  if (!closeMatch) {
    warnings.push("Missing </images>; auto-closed block.");
  }
  const entries = _splitEntries(rawBody);
  const normalizedEntries = [];
  let droppedEntries = 0;
  for (const entry of entries) {
    const normalizedEntry = _normalizeEntry(entry);
    if (!normalizedEntry) {
      droppedEntries += 1;
      continue;
    }
    normalizedEntries.push(normalizedEntry);
  }
  if (entries.length === 0) {
    warnings.push("No candidate image entries found inside <images>.");
  }
  if (droppedEntries > 0) {
    warnings.push(`Dropped ${droppedEntries} malformed image entr${droppedEntries === 1 ? "y" : "ies"}.`);
  }
  const body = normalizedEntries.join("\n");
  const normalizedBlock = body ? `<images>
${body}
</images>` : "<images>\n</images>";
  return {
    block: normalizedBlock,
    keptEntries: normalizedEntries.length,
    droppedEntries,
    warnings
  };
}

function _splitEntries(rawBody) {
  const body = rawBody.replace(/<\\images>/gi, "").replace(/<image>/gi, "").replace(/<\\image>/gi, "</image>").replace(/<\/image>/gi, "").trim();
  if (!body) {
    return [];
  }
  const regexPositions = _collectMatchIndexes(body, REGEX_MARKER_GLOBAL_RE);
  if (regexPositions.length > 0) {
    const chunks = [];
    const firstRegexIndex = regexPositions[0];
    const leadingChunk = body.slice(0, firstRegexIndex).trim();
    if (leadingChunk) {
      chunks.push(leadingChunk);
    }
    return chunks.concat(_sliceByPositions(body, regexPositions));
  }
  return [body];
}

function _normalizeEntry(entry) {
  const cleaned = entry.replace(IMAGE_CLOSE_RE, "").replace(/<\/images>|<\\images>/gi, "").replace(/<\/?tr>/gi, "").replace(/<\/?table>/gi, "").trim();
  if (!cleaned) {
    return null;
  }
  const regexIndex = cleaned.search(REGEX_MARKER_RE);
  const imagePromptIndex = cleaned.search(IMAGE_PROMPT_MARKER_RE);
  if (regexIndex === -1 || imagePromptIndex === -1) {
    return null;
  }
  const regexPart = _extractRegexPart(cleaned.slice(regexIndex, imagePromptIndex));
  const middlePart = cleaned.slice(regexIndex + regexPart.length, imagePromptIndex).trim();
  const imagePromptPart = _normalizeImagePromptPart(cleaned.slice(imagePromptIndex));
  if (!REGEX_MARKER_RE.test(regexPart) || !IMAGE_PROMPT_MARKER_RE.test(imagePromptPart)) {
    return null;
  }
  const inner = [regexPart, middlePart, imagePromptPart].filter(Boolean).join("\n");
  return `<image>
${inner}
</image>`;
}

function _extractRegexPart(text) {
  const trimmed = text.trim();
  const firstLine = trimmed.split("\n").map((line) => line.trim()).find((line) => REGEX_MARKER_RE.test(line));
  return firstLine || trimmed;
}

function _normalizeImagePromptPart(text) {
  const trimmed = text.trim();
  const markerIndex = trimmed.search(IMAGE_PROMPT_MARKER_RE);
  if (markerIndex === -1) {
    return "";
  }
  const fromMarker = trimmed.slice(markerIndex).trim();
  const afterMarker = fromMarker.slice("image###".length);
  const closeMatch = PROMPT_CLOSE_RE.exec(afterMarker);
  PROMPT_CLOSE_RE.lastIndex = 0;
  if (closeMatch) {
    const content2 = afterMarker.slice(0, closeMatch.index).trim();
    return `image### ${content2} ###`;
  }
  const content = afterMarker.trim();
  return `image### ${content} ###`;
}

function _collectMatchIndexes(text, regex) {
  const indexes = [];
  regex.lastIndex = 0;
  let match = regex.exec(text);
  while (match) {
    indexes.push(match.index);
    match = regex.exec(text);
  }
  regex.lastIndex = 0;
  return indexes;
}

function _sliceByPositions(text, positions) {
  const chunks = [];
  for (let i = 0; i < positions.length; i += 1) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : text.length;
    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
  }
  return chunks;
}

function convertNewXmlFormatToOld(text) {
  if (!text || typeof text !== "string") return text;
  const imagesMatches = [...text.matchAll(/<images>([\s\S]*?)<\/images>/gi)];
  if (imagesMatches.length === 0) return text;
  const lastMatch = imagesMatches[imagesMatches.length - 1];
  const rawImagesInner = lastMatch[1];
  if (!/<prompts>|<title_styled>/i.test(rawImagesInner)) {
    return text;
  }
  const newInner = rawImagesInner.replace(/<image>([\s\S]*?)<\/image>/gi, (match, imageInner) => {
    const regexMatch = imageInner.match(/<regex>([\s\S]*?)<\/regex>/i);
    const regexStr = regexMatch ? `regex:${regexMatch[1].trim()}` : "";
    const titleMatch = imageInner.match(/<title_styled>([\s\S]*?)<\/title_styled>/i);
    const titleStr = titleMatch ? `<font color="steelblue">[${titleMatch[1].trim()}]</font>` : "";
    const tagThinkMatch = imageInner.match(/<Tag_think>([\s\S]*?)<\/Tag_think>/i);
    const tagThinkStr = tagThinkMatch ? `<Tag_think>
${tagThinkMatch[1].trim()}
</Tag_think>` : "";
    const sizeMatch = imageInner.match(/<size>([\s\S]*?)<\/size>/i);
    let sizeResolution = "";
    if (sizeMatch) {
      const sizeParts = sizeMatch[1].trim().replace(/，/g, ",").split(",");
      if (sizeParts.length > 0) {
        sizeResolution = sizeParts[sizeParts.length - 1].trim();
      }
    }
    const promptsMatch = imageInner.match(/<prompts>([\s\S]*?)<\/prompts>/i);
    let promptStr = "";
    if (promptsMatch) {
      const promptsInner = promptsMatch[1];
      const sceneMatch = promptsInner.match(/<scene_composition>([\s\S]*?)<\/scene_composition>/i);
      const charRegex = /<character_(\d+)>([\s\S]*?)<\/character_\1>/gi;
      const charMatches = [...promptsInner.matchAll(charRegex)];
      if (sceneMatch || charMatches.length > 0) {
        let sceneContent = sceneMatch ? sceneMatch[1].trim() : "";
        if (sizeResolution) {
          if (sceneContent && !sceneContent.endsWith(",")) {
            sceneContent += ",";
          }
          sceneContent += sizeResolution;
        }
        const sceneStr = sceneContent ? `Scene Composition:${sceneContent};` : "";
        let charactersStr = "";
        for (const charMatch of charMatches) {
          const charIndex = charMatch[1];
          const charInner = charMatch[2];
          const cPromptMatch = charInner.match(/<prompt>([\s\S]*?)<\/prompt>/i);
          const cPrompt = cPromptMatch ? cPromptMatch[1].trim() : "";
          const centersMatch = charInner.match(/<centers>([\s\S]*?)<\/centers>/i);
          const centers = centersMatch ? centersMatch[1].trim() : "";
          const ucMatch = charInner.match(/<uc>([\s\S]*?)<\/uc>/i);
          const uc = ucMatch ? ucMatch[1].trim() : "";
          if (cPrompt || centers) {
            charactersStr += `Character ${charIndex} Prompt:${cPrompt}|centers:${centers};
`;
          }
          if (uc) {
            charactersStr += `Character ${charIndex} UC:${uc};
`;
          }
        }
        const combinedPrompts = [sceneStr, charactersStr].filter((s) => s.trim()).join("\n").trim();
        if (combinedPrompts) {
          promptStr = `image###${combinedPrompts}###`;
        }
      } else {
        let rawPrompts = promptsInner.trim();
        if (sizeResolution) {
          if (rawPrompts && !rawPrompts.endsWith(",")) {
            rawPrompts += ",";
          }
          rawPrompts += sizeResolution;
        }
        if (rawPrompts) {
          promptStr = `image###${rawPrompts}###`;
        }
      }
    }
    const finalImageInner = [regexStr, titleStr, tagThinkStr, promptStr].filter((s) => s.trim()).join("\n");
    return `<image>
${finalImageInner}
</image>`;
  });
  const newImagesBlock = `<images>
${newInner}
</images>`;
  const beforeLast = text.substring(0, lastMatch.index);
  const afterLast = text.substring(lastMatch.index + lastMatch[0].length);
  return beforeLast + newImagesBlock + afterLast;
}

function parseImagesFromPrompt(text) {
  const timer = debugTimer("imageInserter.parseImagesFromPrompt", "\u89E3\u6790 LLM \u8F93\u51FA\u4E2D\u7684\u56FE\u7247\u6807\u7B7E");
  const images = [];
  if (!text || typeof text !== "string") {
    debugBranch("parseImagesFromPrompt", "\u8F93\u5165\u65E0\u6548 - \u8DF3\u8FC7", true, {
      \u8F93\u5165\u7C7B\u578B: typeof text,
      \u662F\u5426\u4E3A\u7A7A: !text
    });
    timer.end("\u8F93\u5165\u65E0\u6548");
    return images;
  }
  text = applyWordReplacement(text, "ai");
  text = removeThinkingTextOnly(text);
  debugLog("imageInserter.parseImagesFromPrompt", "\u5F00\u59CB\u89E3\u6790", {
    \u6587\u672C\u957F\u5EA6: text.length
  });
  debugContent("parseImagesFromPrompt", "LLM \u539F\u59CB\u8F93\u51FA", text, 500);
  console.log("[parseImagesFromPrompt] \u5F00\u59CB\u89E3\u6790\uFF0C\u6587\u672C\u957F\u5EA6:", text.length);
  const convertedText = convertNewXmlFormatToOld(text);
  if (convertedText !== text) {
    text = convertedText;
    console.log("[parseImagesFromPrompt] \u68C0\u6D4B\u5230\u65B0\u7248 XML \u683C\u5F0F\u5E76\u8F6C\u6362\u4E3A\u65E7\u7248\u517C\u5BB9\u683C\u5F0F\uFF0C\u65B0\u957F\u5EA6:", text.length);
    debugBranch("parseImagesFromPrompt", "\u683C\u5F0F\u8F6C\u6362", true, {
      \u5907\u6CE8: "\u5C06\u65B0\u7248 XML \u56FE\u7247\u683C\u5F0F\u8F6C\u6362\u4E3A\u517C\u5BB9\u683C\u5F0F"
    });
  }
  const _normResult = normalizeImagesReply(text);
  if (_normResult.changed) {
    text = _normResult.output;
    console.log(
      "[parseImagesFromPrompt] images \u5757\u5DF2\u89C4\u8303\u5316\uFF0C\u65B0\u957F\u5EA6:",
      text.length,
      _normResult.warnings.length ? `warnings=${JSON.stringify(_normResult.warnings)}` : ""
    );
  }
  let searchText = text;
  const imagesContainerRegex = /<images>([\s\S]*?)<\/images>/g;
  const allImagesMatches = [...text.matchAll(imagesContainerRegex)];
  if (allImagesMatches.length > 0) {
    searchText = allImagesMatches.map((match) => match[1]).join("\n");
    debugBranch("parseImagesFromPrompt", "\u627E\u5230 <images> \u5BB9\u5668", true, {
      \u5BB9\u5668\u6570\u91CF: allImagesMatches.length,
      \u5408\u5E76\u540E\u957F\u5EA6: searchText.length
    });
    console.log("[parseImagesFromPrompt] \u627E\u5230", allImagesMatches.length, "\u4E2A <images> \u5BB9\u5668\uFF0C\u5DF2\u5408\u5E76\u6240\u6709\u5185\u5BB9\uFF08\u603B\u957F\u5EA6:", searchText.length, "\uFF09");
  } else {
    debugBranch("parseImagesFromPrompt", "\u672A\u627E\u5230 <images> \u5BB9\u5668 - \u4F7F\u7528\u5B8C\u6574\u6587\u672C", true);
    console.log("[parseImagesFromPrompt] \u672A\u627E\u5230 <images> \u5BB9\u5668\uFF0C\u4F7F\u7528\u5B8C\u6574\u6587\u672C");
  }
  const imageRegex = /<image>([\s\S]*?)<\/image>/g;
  const imageBlocks = [];
  let imageMatch;
  while ((imageMatch = imageRegex.exec(searchText)) !== null) {
    imageBlocks.push({
      fullMatch: imageMatch[0],
      content: imageMatch[1],
      startIndex: imageMatch.index
    });
  }
  debugLog("imageInserter.parseImagesFromPrompt", "\u627E\u5230 <image> \u5757", {
    \u5757\u6570\u91CF: imageBlocks.length
  });
  console.log("[parseImagesFromPrompt] \u627E\u5230", imageBlocks.length, "\u4E2A <image> \u5757");
  for (let i = 0; i < imageBlocks.length; i++) {
    const block = imageBlocks[i];
    const imageContent = block.content;
    console.log(`[parseImagesFromPrompt] \u89E3\u6790\u7B2C ${i + 1} \u4E2A <image> \u5757\uFF0C\u5185\u5BB9\u957F\u5EA6: ${imageContent.length}`);
    let regexText = "";
    const imgthinkRegex = /<imgthink>([\s\S]*?)<\/imgthink>/;
    const imgthinkMatch = imageContent.match(imgthinkRegex);
    if (imgthinkMatch) {
      const imgthinkContent = imgthinkMatch[1];
      const regexLineMatch = imgthinkContent.match(/regex:(.*?)(?:\n|$)/);
      if (regexLineMatch) {
        regexText = regexLineMatch[1].trim();
      }
    }
    if (!regexText) {
      const directRegexMatch = imageContent.match(/regex:(.*?)(?:\n|$)/);
      if (directRegexMatch) {
        regexText = directRegexMatch[1].trim();
      }
    }
    const tagthinkEchoEnabled = String(extension_settings[extensionName]?.tagthinkEcho) === "true";
    const { startTag, endTag } = getImageTags();
    let tag;
    if (!tagthinkEchoEnabled) {
      const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pureTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
      const pureTagMatch = imageContent.match(pureTagRegex);
      const pureContent = pureTagMatch ? pureTagMatch[1].trim() : "";
      tag = pureContent ? `${startTag}${pureContent}${endTag}` : "";
      console.log(`[parseImagesFromPrompt] tagthinkEcho=false, \u4EC5\u63D0\u53D6\u7EAF tag: "${tag.substring(0, 50)}..."`);
    } else {
      tag = imageContent.replace(/regex:.*?(?:\n|$)/g, "").trim();
      console.log(`[parseImagesFromPrompt] tagthinkEcho=true, \u4FDD\u7559\u5B8C\u6574\u5185\u5BB9: "${tag.substring(0, 50)}..."`);
    }
    console.log(`[parseImagesFromPrompt] \u5757 ${i + 1} \u7ED3\u679C: regex="${regexText.substring(0, 30)}...", tag="${tag.substring(0, 50)}..."`);
    debugLog("imageInserter.parseImagesFromPrompt", `\u5757 ${i + 1} \u89E3\u6790\u7ED3\u679C`, {
      \u7D22\u5F15: i + 1,
      \u6709regex: !!regexText,
      regex\u9884\u89C8: regexText ? regexText.substring(0, 40) : "(\u65E0)",
      \u6709tag: !!tag,
      tag\u957F\u5EA6: tag.length
    });
    if (regexText && tag) {
      tag = tag.replace(/，/g, ",").replace(/；/g, ";").replace(/：/g, ":");
      tag = tag.replace(/,\s*/g, ", ");
      images.push({
        regex: regexText,
        tag
      });
      debugBranch("parseImagesFromPrompt", `\u5757 ${i + 1} \u6709\u6548 - \u5DF2\u6DFB\u52A0`, true);
    } else {
      debugBranch("parseImagesFromPrompt", `\u5757 ${i + 1} \u65E0\u6548 - \u8DF3\u8FC7`, true, {
        \u539F\u56E0: !regexText ? "\u7F3A\u5C11regex" : "\u7F3A\u5C11tag"
      });
    }
  }
  console.log("[parseImagesFromPrompt] \u89E3\u6790\u5B8C\u6210\uFF0C\u5171", images.length, "\u4E2A\u6709\u6548\u56FE\u7247");
  console.group("[parseImagesFromPrompt] \u89E3\u6790\u7ED3\u679C\u8BE6\u60C5");
  for (let i = 0; i < images.length; i++) {
    console.group(`\u56FE\u7247 ${i + 1}`);
    console.log("regex:", images[i].regex);
    console.log("tag \u5B8C\u6574\u5185\u5BB9:");
    console.log(images[i].tag);
    console.groupEnd();
  }
  console.groupEnd();
  debugLog("imageInserter.parseImagesFromPrompt", "\u89E3\u6790\u5B8C\u6210", {
    \u603B\u5757\u6570: imageBlocks.length,
    \u6709\u6548\u56FE\u7247\u6570: images.length
  });
  timer.end(`\u89E3\u6790\u5230 ${images.length} \u4E2A\u6709\u6548\u56FE\u7247`);
  if (imageBlocks.length > 0 && images.length === 0) {
    toastr.warning(`LLM \u8F93\u51FA\u89E3\u6790\u5931\u8D25\uFF1A\u68C0\u6D4B\u5230 <image> \u6807\u7B7E\u4F46\u672A\u80FD\u89E3\u6790\u51FA\u6709\u6548\u6570\u636E\u3002\u8BF7\u68C0\u67E5 LLM \u8F93\u51FA\u683C\u5F0F\u662F\u5426\u5305\u542B regex: \u884C\u3002`);
  }
  return images;
}

async function insertImagesIntoElement(rootElement, images) {
  const timer = debugTimer("imageInserter.insertImagesIntoElement", "\u5C06\u56FE\u7247\u6807\u7B7E\u63D2\u5165\u5230 DOM");
  if (!rootElement || !images || images.length === 0) {
    debugBranch("insertImagesIntoElement", "\u8F93\u5165\u65E0\u6548 - \u8DF3\u8FC7", true, {
      \u6709rootElement: !!rootElement,
      \u6709images: !!images,
      images\u6570\u91CF: images?.length || 0
    });
    timer.end("\u8F93\u5165\u65E0\u6548");
    return;
  }
  debugLog("imageInserter.insertImagesIntoElement", "\u5F00\u59CB\u63D2\u5165\u56FE\u7247\u6807\u7B7E", {
    \u5F85\u63D2\u5165\u6570\u91CF: images.length
  });
  debugElement("insertImagesIntoElement", "\u76EE\u6807\u6839\u5143\u7D20", rootElement);
  const doc = rootElement.ownerDocument || document;
  const existingButtons = rootElement.querySelectorAll(".image-tag-button, .st-chatu8-image-button");
  existingButtons.forEach((btn) => btn.remove());
  const existingSpans = rootElement.querySelectorAll(".st-chatu8-image-span");
  existingSpans.forEach((span) => span.remove());
  const existingContainers = rootElement.querySelectorAll(".st-chatu8-image-container");
  existingContainers.forEach((container) => container.remove());
  const existingCollapseWrappers = rootElement.querySelectorAll(".st-chatu8-collapse-wrapper");
  existingCollapseWrappers.forEach((wrapper) => wrapper.remove());
  if (rootElement.dataset) {
    delete rootElement.dataset.chatu8Processed;
    delete rootElement.dataset.chatu8ContentLength;
  }
  if (rootElement.attributes) {
    const attrsToRemove = [];
    for (let i = 0; i < rootElement.attributes.length; i++) {
      const attrName = rootElement.attributes[i].name;
      if (attrName.startsWith("data-tag-inserted-")) {
        attrsToRemove.push(attrName);
      }
    }
    attrsToRemove.forEach((name) => rootElement.removeAttribute(name));
  }
  debugLog("imageInserter.insertImagesIntoElement", "\u6E05\u7406\u65E7\u5143\u7D20\u5B8C\u6210", {
    \u6E05\u7406\u6309\u94AE\u6570: existingButtons.length,
    \u6E05\u7406\u5BB9\u5668\u6570: existingContainers.length + existingSpans.length + existingCollapseWrappers.length
  });
  console.log("[insertImagesIntoElement] Cleaned up existing image elements and container markers");
  const insertOriginalTextEnabled = String(extension_settings[extensionName]?.insertOriginalText) === "true";
  if (insertOriginalTextEnabled) {
    const mesText = findMesTextFromElement(rootElement);
    if (mesText) {
      const mesBlock = mesText.closest(".mes");
      const mesId = parseInt(mesBlock?.getAttribute("mesid"), 10);
      if (!isNaN(mesId) && chat[mesId] && chat[mesId].mes && chat[mesId].mes.length >= 100) {
        console.log("[insertImagesIntoElement] insertOriginalText \u5FEB\u901F\u8DEF\u5F84 - \u76F4\u63A5\u7528\u539F\u6587\u5339\u914D");
        debugLog("imageInserter.insertImagesIntoElement", "insertOriginalText \u5FEB\u901F\u8DEF\u5F84", {
          mesId,
          mes\u957F\u5EA6: chat[mesId].mes.length
        });
        await saveImageGroup(images, "", rootElement);
        timer.end("insertOriginalText \u5FEB\u901F\u8DEF\u5F84\u5B8C\u6210");
        return;
      } else {
        console.log("[insertImagesIntoElement] insertOriginalText \u6761\u4EF6\u4E0D\u6EE1\u8DB3\uFF0C\u9000\u56DE DOM \u903B\u8F91");
      }
    }
  }
  const firstDirectDiv = !insertOriginalTextEnabled ? rootElement.querySelector(":scope > div") : null;
  if (firstDirectDiv) {
    console.log("[insertImagesIntoElement] Will exclude first direct <div> from matching:", firstDirectDiv.textContent?.substring(0, 50));
  }
  const nodeInfos = [];
  let logicalText = "";
  let firstDivStartOffset = -1;
  let firstDivEndOffset = -1;
  const walker = doc.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: function(node) {
      const parentTag = node.parentElement?.tagName;
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
        return NodeFilter.FILTER_SKIP;
      }
      if (parentTag === "SCRIPT" || parentTag === "STYLE" || parentTag === "BUTTON" || node.parentElement?.classList.contains("image-tag-button") || node.parentElement?.classList.contains("st-chatu8-image-span")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let n;
  while (n = walker.nextNode()) {
    const start = logicalText.length;
    let text = "";
    if (n.nodeType === Node.TEXT_NODE) {
      text = n.textContent;
    } else if (n.tagName === "BR") {
      text = "\n";
    }
    if (firstDirectDiv && text.length > 0) {
      const isInFirstDiv = n === firstDirectDiv || firstDirectDiv.contains(n);
      if (isInFirstDiv) {
        if (firstDivStartOffset === -1) {
          firstDivStartOffset = start;
        }
        firstDivEndOffset = start + text.length;
      }
    }
    logicalText += text;
    nodeInfos.push({ node: n, start, end: logicalText.length });
  }
  if (logicalText.length === 0) return;
  if (firstDirectDiv && firstDivStartOffset !== -1) {
    console.log(`[insertImagesIntoElement] First <div> text range in logicalText: [${firstDivStartOffset}, ${firstDivEndOffset})`);
  }
  let logicalTextForMatch = logicalText;
  if (firstDirectDiv && firstDivStartOffset !== -1 && firstDivEndOffset > firstDivStartOffset) {
    const beforeDiv = logicalTextForMatch.substring(0, firstDivStartOffset);
    const afterDiv = logicalTextForMatch.substring(firstDivEndOffset);
    logicalTextForMatch = beforeDiv + afterDiv;
    console.log(`[insertImagesIntoElement] Excluded first <div> text from matching (removed ${firstDivEndOffset - firstDivStartOffset} chars)`);
  }
  logicalTextForMatch = removeThinkingTextOnly(logicalTextForMatch);
  let thinkingEndOffsetDOM = 0;
  {
    let tempText = logicalText;
    tempText = tempText.replace(/<think(?:ing)?[\s\S]*?<\/think(?:ing)?>/gi, "");
    const thinkEndMatch = tempText.match(/^[\s\S]*<\/think(?:ing)?>/i);
    if (thinkEndMatch) {
      thinkingEndOffsetDOM = thinkEndMatch[0].length;
    }
    if (thinkingEndOffsetDOM === 0) {
      const originalThinkMatch = logicalText.match(/^[\s\S]*<\/think(?:ing)?>/i);
      if (originalThinkMatch) {
        thinkingEndOffsetDOM = originalThinkMatch[0].length;
      }
    }
  }
  const elKey = generateElKey2(logicalText);
  if (elKey) {
    try {
      const imageGroups = await getcharData("image_groups") || {};
      const existingImages = imageGroups[elKey] || [];
      const lockedImages = existingImages.filter((img) => img.locked === true);
      if (lockedImages.length > 0) {
        console.log("[insertImagesIntoElement] Found", lockedImages.length, "locked images in image_groups, merging...");
        const newTags = new Set(images.map((img) => img.tag?.trim()));
        const lockedToAdd = lockedImages.filter((img) => !newTags.has(img.tag?.trim()));
        images = [...lockedToAdd, ...images];
        console.log("[insertImagesIntoElement] After merging locked images:", images.length, "total");
      }
    } catch (e) {
      console.warn("[insertImagesIntoElement] Error getting locked images from image_groups:", e);
    }
  }
  const matches = [];
  for (const image of images) {
    if (!image.regex || !image.tag) {
      debugBranch("insertImagesIntoElement", `\u8DF3\u8FC7\u65E0\u6548 image (\u7F3A\u5C11regex\u6216tag)`, true);
      continue;
    }
    const matchResult = fuzzyMatchLine(logicalTextForMatch, image.regex, 0.5);
    if (matchResult) {
      let correctEndIndex = matchResult.endIndex;
      const matchedLine = matchResult.matchedLine;
      let baseOffsetDOM = thinkingEndOffsetDOM;
      const textAfterThinkingDOM = logicalText.substring(thinkingEndOffsetDOM);
      const contentMatchDOM = textAfterThinkingDOM.match(/^[\s\S]*?<content>\s*/i);
      if (contentMatchDOM) {
        baseOffsetDOM = thinkingEndOffsetDOM + contentMatchDOM[0].length;
      }
      const searchStartOffset = Math.max(baseOffsetDOM, firstDivEndOffset > 0 ? firstDivEndOffset : 0);
      let lineIndexInOriginal = logicalText.indexOf(matchedLine, searchStartOffset);
      if (lineIndexInOriginal === -1) {
        lineIndexInOriginal = logicalText.indexOf(matchedLine);
      }
      if (lineIndexInOriginal !== -1) {
        correctEndIndex = lineIndexInOriginal + matchedLine.length;
        console.log(`[insertImagesIntoElement] Remapped endIndex: ${matchResult.endIndex} -> ${correctEndIndex}`);
      } else {
        console.warn(`[insertImagesIntoElement] Could not find matched line in original logicalText, using original endIndex`);
      }
      matches.push({
        endIndex: correctEndIndex,
        tag: image.tag,
        matchText: matchResult.matchedLine,
        // 使用实际匹配到的行（正确的文本）
        similarity: matchResult.similarity,
        aiRegex: image.regex
        // 保留 AI 原始的 regex 用于调试
      });
      debugLog("imageInserter.insertImagesIntoElement", "\u6A21\u7CCA\u5339\u914D\u6210\u529F", {
        \u76F8\u4F3C\u5EA6: `${(matchResult.similarity * 100).toFixed(1)}%`,
        AI_regex: image.regex.substring(0, 40),
        \u5339\u914D\u884C: matchResult.matchedLine.substring(0, 40),
        \u4F4D\u7F6E: correctEndIndex
      });
      console.log(`[insertImagesIntoElement] Fuzzy matched with ${(matchResult.similarity * 100).toFixed(1)}% similarity`);
      console.log(`  AI regex: "${image.regex}"`);
      console.log(`  Matched line: "${matchResult.matchedLine}"`);
    } else {
      debugBranch("insertImagesIntoElement", `\u6A21\u7CCA\u5339\u914D\u5931\u8D25`, true, {
        AI_regex: image.regex
      });
      console.warn("[insertImagesIntoElement] No fuzzy match found for:", image.regex);
      console.group("[insertImagesIntoElement] \u6A21\u7CCA\u5339\u914D\u8C03\u8BD5\u4FE1\u606F");
      console.log("\u76EE\u6807 regex:", image.regex);
      console.log("logicalTextForMatch \u603B\u957F\u5EA6:", logicalTextForMatch.length);
      console.log("logicalTextForMatch \u5B8C\u6574\u5185\u5BB9:", logicalTextForMatch);
      const debugLines = logicalTextForMatch.split("\n");
      console.log("\u5206\u5272\u540E\u884C\u6570:", debugLines.length);
      console.log("\u6BCF\u884C\u5185\u5BB9:");
      debugLines.forEach((line, idx) => {
        const contains = line.includes(image.regex) || image.regex.includes(line);
        console.log(`  [${idx}]${contains ? " \u2605" : ""}: "${line}"`);
      });
      console.groupEnd();
    }
  }
  if (matches.length === 0) {
    debugBranch("insertImagesIntoElement", "\u6CA1\u6709\u4EFB\u4F55\u5339\u914D - \u7ED3\u675F", true);
    timer.end("\u6CA1\u6709\u5339\u914D");
    console.log("[insertImagesIntoElement] No matches found for any image regex");
    toastr.warning("\u56FE\u7247\u6807\u7B7E\u5168\u90E8\u65E0\u6CD5\u63D2\u5165\uFF1A\u6240\u6709 regex \u90FD\u672A\u80FD\u5728\u539F\u6587\u4E2D\u627E\u5230\u5339\u914D\u4F4D\u7F6E\u3002\u8BF7\u68C0\u67E5 LLM \u751F\u6210\u7684\u5B9A\u4F4D\u6587\u672C\u662F\u5426\u5B58\u5728\u4E8E\u5F53\u524D\u6D88\u606F\u4E2D\u3002");
    return;
  }
  const seenRegex = /* @__PURE__ */ new Set();
  const seenTags = /* @__PURE__ */ new Set();
  const uniqueMatches = [];
  for (const match of matches) {
    const regexKey = match.aiRegex?.trim().toLowerCase();
    const tagKey = match.tag?.trim().toLowerCase();
    if (regexKey && seenRegex.has(regexKey) || tagKey && seenTags.has(tagKey)) {
      console.log(`[insertImagesIntoElement] Skipping duplicate - regex: "${match.aiRegex}", tag: "${match.tag}"`);
      continue;
    }
    if (regexKey) seenRegex.add(regexKey);
    if (tagKey) seenTags.add(tagKey);
    uniqueMatches.push(match);
  }
  debugLog("imageInserter.insertImagesIntoElement", "\u53BB\u91CD\u5B8C\u6210", {
    \u53BB\u91CD\u524D: matches.length,
    \u53BB\u91CD\u540E: uniqueMatches.length
  });
  console.log(`[insertImagesIntoElement] After deduplication: ${uniqueMatches.length} unique matches (from ${matches.length})`);
  matches.length = 0;
  matches.push(...uniqueMatches);
  const positionedImages = matches.map((m) => {
    const maxRegexLen = 40;
    const regexToSave = m.matchText.length > maxRegexLen ? m.matchText.slice(-maxRegexLen) : m.matchText;
    return {
      endIndex: m.endIndex,
      regex: regexToSave,
      // 使用截取后的字符串作为 regex
      tag: m.tag
    };
  });
  matches.sort((a, b) => b.endIndex - a.endIndex);
  console.log("[insertImagesIntoElement] Found matches:", matches);
  if (!insertOriginalTextEnabled) {
    debugLog("imageInserter.insertImagesIntoElement", "\u975E insertOriginalText \u6A21\u5F0F - \u53EA\u4FDD\u5B58\u6570\u636E\uFF0C\u8DF3\u8FC7 DOM \u63D2\u5165", {
      \u5339\u914D\u6570\u91CF: matches.length
    });
    console.log("[insertImagesIntoElement] Non-insertOriginalText mode - saving data only, skipping DOM insertion");
    await saveImageGroup(positionedImages, logicalText, rootElement);
    timer.end(`\u4FDD\u5B58 ${positionedImages.length} \u4E2A\u56FE\u7247\u6570\u636E\uFF08\u8DF3\u8FC7 DOM \u63D2\u5165\uFF09`);
    console.log("[insertImagesIntoElement] Saved image group with", positionedImages.length, "images (DOM insertion skipped)");
    return;
  }
  let insertedCount = 0;
  let skippedCount = 0;
  for (const matchInfo of matches) {
    let targetNodeInfo = null;
    for (const info of nodeInfos) {
      if (matchInfo.endIndex > info.start && matchInfo.endIndex <= info.end) {
        targetNodeInfo = info;
        break;
      }
    }
    if (!targetNodeInfo) {
      for (const info of nodeInfos) {
        if (matchInfo.endIndex === info.end) {
          targetNodeInfo = info;
          break;
        }
      }
    }
    if (!targetNodeInfo) {
      debugBranch("insertImagesIntoElement", `\u627E\u4E0D\u5230\u76EE\u6807\u8282\u70B9 - \u8DF3\u8FC7`, true, {
        endIndex: matchInfo.endIndex
      });
      skippedCount++;
      console.warn("[insertImagesIntoElement] Could not find target node for match:", matchInfo);
      continue;
    }
    const tag = matchInfo.tag;
    const { startTag, endTag } = getImageTags();
    const alreadyWrapped = tag.includes(startTag) && tag.includes(endTag);
    const imageTagText = alreadyWrapped ? tag : `${startTag}${tag}${endTag}`;
    console.group(`[insertImagesIntoElement] \u51C6\u5907\u63D2\u5165\u7B2C ${insertedCount + 1} \u4E2A\u6807\u7B7E`);
    console.log("\u5339\u914D\u4F4D\u7F6E endIndex:", matchInfo.endIndex);
    console.log("\u5339\u914D\u7684\u539F\u6587:", matchInfo.matchText);
    console.log("AI regex:", matchInfo.aiRegex);
    console.log("tag \u5B8C\u6574\u5185\u5BB9:");
    console.log(tag);
    console.log("\u5C06\u8981\u63D2\u5165\u7684\u5B8C\u6574\u6587\u672C:");
    console.log(imageTagText);
    console.groupEnd();
    if (logicalText.includes(imageTagText)) {
      debugBranch("insertImagesIntoElement", `\u6807\u7B7E\u5DF2\u5B58\u5728 - \u8DF3\u8FC7`, true, {
        tag\u9884\u89C8: tag.substring(0, 30)
      });
      skippedCount++;
      console.log("[insertImagesIntoElement] Tag already exists in text:", tag);
      continue;
    }
    const range = doc.createRange();
    try {
      const targetNode = targetNodeInfo.node;
      const offsetInNode = matchInfo.endIndex - targetNodeInfo.start;
      if (targetNode.nodeType === Node.TEXT_NODE) {
        range.setStart(targetNode, offsetInNode);
        range.setEnd(targetNode, offsetInNode);
      } else {
        range.setStartAfter(targetNode);
        range.setEndAfter(targetNode);
      }
    } catch (e) {
      debugLog("imageInserter.insertImagesIntoElement", "Range \u8BBE\u7F6E\u5931\u8D25", {
        \u9519\u8BEF: e.message
      });
      skippedCount++;
      console.error("[insertImagesIntoElement] Error setting range:", e, matchInfo);
      continue;
    }
    const textNode = doc.createTextNode(imageTagText);
    range.insertNode(textNode);
    insertedCount++;
    debugLog("imageInserter.insertImagesIntoElement", "\u63D2\u5165\u6807\u7B7E\u6210\u529F", {
      tag\u9884\u89C8: tag.substring(0, 40),
      \u4F4D\u7F6E: matchInfo.endIndex
    });
    console.log("[insertImagesIntoElement] Inserted image tag for:", tag);
  }
  debugLog("imageInserter.insertImagesIntoElement", "\u63D2\u5165\u5B8C\u6210", {
    \u6210\u529F\u63D2\u5165: insertedCount,
    \u8DF3\u8FC7: skippedCount,
    \u603B\u8BA1: matches.length
  });
  await saveImageGroup(positionedImages, logicalText, rootElement);
  timer.end(`\u63D2\u5165 ${insertedCount} \u4E2A\u6807\u7B7E`);
  console.log("[insertImagesIntoElement] Saved image group with", positionedImages.length, "images");
}

function generateElKey2(text) {
  if (!text || text.length === 0) return "";
  const len = text.length;
  const keyLen = 20;
  const start = Math.max(0, Math.floor(len / 2) - Math.floor(keyLen / 2));
  return text.substring(start, start + keyLen);
}

function getCleanLogicalText(el) {
  if (!el) return "";
  const clone = el.cloneNode(true);
  const selectorsToRemove = [
    ".st-chatu8-image-button",
    ".image-tag-button",
    ".st-chatu8-image-span",
    ".st-chatu8-image-container",
    ".st-chatu8-collapse-wrapper"
  ];
  for (const selector of selectorsToRemove) {
    const elements = clone.querySelectorAll(selector);
    elements.forEach((elem) => elem.remove());
  }
  return clone.textContent || "";
}

async function findTagInImageGroups(tagToFind) {
  if (!tagToFind) return null;
  const imageGroups = await getcharData("image_groups") || {};
  for (const [elKey, images] of Object.entries(imageGroups)) {
    if (!Array.isArray(images)) continue;
    for (let i = 0; i < images.length; i++) {
      if (images[i].tag === tagToFind) {
        return { elKey, images, index: i };
      }
    }
  }
  return null;
}

function findMesTextFromElement(el) {
  if (el && el.classList && el.classList.contains("mes_text")) {
    return el;
  }
  const elDoc = el?.ownerDocument;
  if (elDoc && elDoc !== document) {
    for (const iframe of document.querySelectorAll("iframe")) {
      if (iframe.contentDocument === elDoc) {
        return iframe.closest(".mes_text");
      }
    }
  }
  return el?.closest?.(".mes_text");
}

function insertAt(str, index, insertion) {
  return str.slice(0, index) + insertion + str.slice(index);
}

async function renderMessage(messageId) {
  console.log("[imageInserter] Rendering message:", messageId);
  const mesHtml = document.querySelector(`div.mes[mesid="${messageId}"]`);
  if (!mesHtml) {
    return;
  }
  const chatMessage = chat[messageId];
  if (!chatMessage) {
    return;
  }
  if (chatMessage.swipes) {
    const swipesCounter = mesHtml.querySelector(".swipes-counter");
    if (swipesCounter) {
      swipesCounter.textContent = `${chatMessage.swipe_id + 1}\u200B/\u200B${chatMessage.swipes.length}`;
    }
  }
  const mesText = mesHtml.querySelector(".mes_text");
  if (mesText) {
    mesText.innerHTML = messageFormatting(
      chatMessage.mes,
      chatMessage.name,
      chatMessage.is_system,
      chatMessage.is_user,
      messageId
    );
  }
  await eventSource.emit(
    chatMessage.is_user ? event_types.USER_MESSAGE_RENDERED : event_types.CHARACTER_MESSAGE_RENDERED,
    messageId
  );
}

async function saveImageGroup(images, logicalText, el) {
  const timer = debugTimer("imageInserter.saveImageGroup", "\u4FDD\u5B58\u56FE\u7247\u7EC4\u4F4D\u7F6E\u4FE1\u606F");
  if (!images || images.length === 0) {
    debugBranch("saveImageGroup", "\u65E0\u56FE\u7247 - \u8DF3\u8FC7\u4FDD\u5B58", true);
    timer.end("\u65E0\u56FE\u7247");
    return;
  }
  debugLog("imageInserter.saveImageGroup", "\u5F00\u59CB\u4FDD\u5B58", {
    \u56FE\u7247\u6570\u91CF: images.length
  });
  debugElement("saveImageGroup", "\u76EE\u6807\u5143\u7D20", el);
  console.group("[imageInserter] saveImageGroup - el \u8BE6\u7EC6\u4FE1\u606F");
  console.log("el \u5BF9\u8C61:", el);
  console.log("el.tagName:", el?.tagName);
  console.log("el.className:", el?.className);
  console.log("el.id:", el?.id);
  console.log("el \u662F\u5426\u5728 document \u4E2D:", el?.isConnected);
  console.log("el.ownerDocument:", el?.ownerDocument === document ? "\u4E3B\u6587\u6863" : "iframe \u6587\u6863");
  const parentChain = [];
  let parent = el?.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    parentChain.push(`${parent.tagName}${parent.id ? "#" + parent.id : ""}${parent.className ? "." + parent.className.split(" ")[0] : ""}`);
    parent = parent.parentElement;
  }
  console.log("\u7236\u5143\u7D20\u94FE:", parentChain.join(" \u2192 "));
  const textLen = el?.textContent?.length || 0;
  const midPos = Math.floor(textLen / 2);
  const startPos = Math.max(0, midPos - 10);
  const textSignature = el?.textContent?.substring(startPos, startPos + 20) || "";
  console.log("textContent \u957F\u5EA6:", textLen);
  console.log("textContent \u4E2D\u95F4 20 \u5B57\u7279\u5F81:", JSON.stringify(textSignature));
  if (el?.ownerDocument !== document) {
    const iframeDoc = el?.ownerDocument;
    console.log("iframe document.URL:", iframeDoc?.URL);
    console.log("iframe body \u5B50 div \u6570\u91CF:", iframeDoc?.body?.querySelectorAll(":scope > div").length);
  }
  console.log("\u662F mes_text:", el?.classList?.contains("mes_text"));
  console.log("data-mesid:", el?.getAttribute?.("data-mesid"));
  console.groupEnd();
  const insertOriginalTextEnabled = String(extension_settings[extensionName]?.insertOriginalText) === "true";
  debugLog("imageInserter.saveImageGroup", "\u68C0\u67E5\u50A8\u5B58\u6A21\u5F0F", {
    insertOriginalText\u8BBE\u7F6E: extension_settings[extensionName]?.insertOriginalText,
    \u662F\u5426\u542F\u7528: insertOriginalTextEnabled
  });
  if (insertOriginalTextEnabled) {
    debugBranch("saveImageGroup", "insertOriginalText \u6A21\u5F0F\u5DF2\u542F\u7528", true);
    const mesText = findMesTextFromElement(el);
    if (mesText) {
      const mesBlock = mesText.closest(".mes");
      const mesId = parseInt(mesBlock?.getAttribute("mesid"), 10);
      debugLog("imageInserter.saveImageGroup", "insertOriginalText \u5B9A\u4F4D\u7ED3\u679C", {
        \u627E\u5230mes_text: true,
        mesId,
        mesId\u6709\u6548: !isNaN(mesId)
      });
      if (!isNaN(mesId) && chat[mesId]) {
        let mes = chat[mesId].mes;
        if (mes && mes.length >= 100) {
          debugBranch("saveImageGroup", "insertOriginalText \u6A21\u5F0F\u6267\u884C", true, {
            mesId,
            mes\u957F\u5EA6: mes.length,
            \u50A8\u5B58\u4F4D\u7F6E: "chat[mesId].mes"
          });
          console.log("[imageInserter] insertOriginalText mode - mesId:", mesId, "mes.length:", mes.length);
          const lockedTags = new Set(chat[mesId].extra?.lockedTags || []);
          console.log("[imageInserter] Locked tags:", Array.from(lockedTags));
          const { startTag, endTag } = getImageTags();
          const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pureTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
          if (lockedTags.size === 0) {
            mes = mes.replace(/<image>[\s\S]*?<\/image>/g, "");
          } else {
            mes = mes.replace(/<image>([\s\S]*?)<\/image>/g, (match, content) => {
              const pureTagMatch = content.match(pureTagRegex);
              console.log("[imageInserter] <image> content preview:", content.substring(0, 150));
              console.log("[imageInserter] pureTagRegex:", pureTagRegex);
              console.log("[imageInserter] pureTagMatch:", pureTagMatch ? "found" : "null");
              if (pureTagMatch) {
                const pureTag = pureTagMatch[1].trim();
                const pureTagNormalized = pureTag.replaceAll("\u300A", "<").replaceAll("\u300B", ">").replaceAll("\n", "");
                console.log("[imageInserter] Extracted pureTag:", pureTagNormalized.substring(0, 150));
                const pureTagPrefix = pureTagNormalized.substring(0, 100);
                for (const lockedTag of lockedTags) {
                  const lockedTagPrefix = lockedTag.substring(0, 100);
                  console.log("[imageInserter] Comparing pureTagPrefix:", pureTagPrefix.substring(0, 80));
                  console.log("[imageInserter] With lockedTagPrefix:", lockedTagPrefix.substring(0, 80));
                  if (pureTagPrefix === lockedTagPrefix || pureTagNormalized.startsWith(lockedTagPrefix) || lockedTag.startsWith(pureTagPrefix)) {
                    console.log("[imageInserter] Keeping locked <image>, matched pureTag with:", lockedTag.substring(0, 50));
                    return match;
                  }
                }
                console.log("[imageInserter] No match for pureTag:", pureTagNormalized.substring(0, 80));
              } else {
                console.log("[imageInserter] No pureTag found in <image>, content preview:", content.substring(0, 100));
              }
              return "";
            });
          }
          const lockedImages = [];
          const imageBlockRegex = /<image>([\s\S]*?)<\/image>/g;
          let blockMatch;
          while ((blockMatch = imageBlockRegex.exec(mes)) !== null) {
            const content = blockMatch[1];
            const imageStartIndex = blockMatch.index;
            const textBefore = mes.substring(0, imageStartIndex);
            const lines = textBefore.split("\n");
            let lastLine = "";
            for (let i = lines.length - 1; i >= 0; i--) {
              const trimmed = lines[i].trim();
              if (trimmed) {
                lastLine = trimmed;
                break;
              }
            }
            const regex = lastLine.slice(-50);
            const tag = content.replace(/regex:.*?(?:\n|$)/g, "").trim();
            console.log("[imageInserter] Step 2 extraction: regex=", regex.substring(0, 30), ", tag preview=", tag.substring(0, 50));
            if (regex && tag) {
              lockedImages.push({ regex, tag });
              console.log("[imageInserter] Extracted locked image, regex:", regex.substring(0, 30));
            } else if (tag) {
              const fallbackRegex = tag.substring(0, 50);
              lockedImages.push({ regex: fallbackRegex, tag });
              console.log("[imageInserter] Extracted locked image with fallback regex:", fallbackRegex.substring(0, 30));
            } else {
              console.warn("[imageInserter] Skipped locked image: tag is empty");
            }
          }
          mes = mes.replace(/<image>[\s\S]*?<\/image>/g, "");
          mes = mes.replace(new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "g"), "");
          const htmlComments = [];
          mes = mes.replace(/<!--[\s\S]*?-->/g, (match) => {
            const placeholder = `___HTML_COMMENT_${htmlComments.length}___`;
            htmlComments.push(match);
            return placeholder;
          });
          mes = mes.replace(/\n{3,}/g, "\n\n");
          const allImages = [...lockedImages, ...images];
          console.log("[imageInserter] Total images to insert:", allImages.length, "(locked:", lockedImages.length, ", new:", images.length, ")");
          const mesForMatch = removeThinkingText(mes);
          let thinkingEndOffset = 0;
          {
            let tempText = mes;
            tempText = tempText.replace(/<think(?:ing)?[\s\S]*?<\/think(?:ing)?>/gi, "");
            const thinkingEndMatch = tempText.match(/^[\s\S]*<\/think(?:ing)?>/i);
            if (thinkingEndMatch) {
              thinkingEndOffset = thinkingEndMatch[0].length;
            }
            if (thinkingEndOffset === 0) {
              const originalThinkMatch = mes.match(/^[\s\S]*<\/think(?:ing)?>/i);
              if (originalThinkMatch) {
                thinkingEndOffset = originalThinkMatch[0].length;
              }
            }
            console.log("[imageInserter] insertOriginalText: thinkingEndOffset =", thinkingEndOffset);
          }
          let searchStartOffset = thinkingEndOffset;
          const textAfterThinking = mes.substring(thinkingEndOffset);
          const contentMatch = textAfterThinking.match(/^[\s\S]*?<content>\s*/i);
          if (contentMatch) {
            searchStartOffset = thinkingEndOffset + contentMatch[0].length;
            console.log("[imageInserter] insertOriginalText: searchStartOffset (with <content>) =", searchStartOffset);
          }
          const matchResults = [];
          for (const img of allImages) {
            const matchResult = fuzzyMatchLine(mesForMatch, img.regex, 0.5);
            if (matchResult) {
              let correctEndIndex = matchResult.endIndex;
              const matchedLine = matchResult.matchedLine;
              const lineIndexInOriginal = mes.indexOf(matchedLine, searchStartOffset);
              if (lineIndexInOriginal !== -1) {
                correctEndIndex = lineIndexInOriginal + matchedLine.length;
                console.log(`[imageInserter] insertOriginalText: Remapped endIndex: ${matchResult.endIndex} -> ${correctEndIndex} (searchFrom: ${searchStartOffset})`);
              } else {
                const fallbackIndex = mes.indexOf(matchedLine);
                if (fallbackIndex !== -1) {
                  correctEndIndex = fallbackIndex + matchedLine.length;
                  console.warn(`[imageInserter] insertOriginalText: Fallback full search, endIndex: ${correctEndIndex}`);
                } else {
                  console.warn(`[imageInserter] insertOriginalText: Could not find matched line in original mes, using original endIndex`);
                }
              }
              matchResults.push({
                endIndex: correctEndIndex,
                tag: img.tag,
                regex: img.regex
              });
            } else {
              console.warn("[imageInserter] No match found for regex:", img.regex.substring(0, 50));
            }
          }
          matchResults.sort((a, b) => b.endIndex - a.endIndex);
          let insertedCount = 0;
          for (const match of matchResults) {
            const insertTag = `

<image>${match.tag}</image>`;
            mes = insertAt(mes, match.endIndex, insertTag);
            insertedCount++;
            console.log("[imageInserter] Inserted tag at position", match.endIndex, "for regex:", match.regex.substring(0, 30));
          }
          if (htmlComments.length > 0) {
            mes = mes.replace(/___HTML_COMMENT_(\d+)___/g, (match, index) => {
              return htmlComments[index] || match;
            });
          }
          chat[mesId].mes = mes;
          const context = getContext();
          if (context.chat[mesId]?.extra?.images) {
            const swipeKey = context.chat[mesId].swipe_id ?? 0;
            if (context.chat[mesId].extra.images[swipeKey]) {
              console.log("[imageInserter] insertOriginalText: clearing old extra.images[" + swipeKey + "] to avoid conflict");
              delete context.chat[mesId].extra.images[swipeKey];
            }
          }
          await saveChatConditional();
          await renderMessage(mesId);
          debugLog("imageInserter.saveImageGroup", "insertOriginalText \u4FDD\u5B58\u5B8C\u6210", {
            mesId,
            \u63D2\u5165\u6570\u91CF: insertedCount,
            \u50A8\u5B58\u4F4D\u7F6E: "chat[mesId].mes"
          });
          timer.end(`insertOriginalText \u6A21\u5F0F - \u63D2\u5165 ${insertedCount} \u4E2A\u6807\u7B7E`);
          console.log("[imageInserter] Saved to chat[" + mesId + "].mes (insertOriginalText mode)");
          return;
        } else {
          debugBranch("saveImageGroup", "mes \u957F\u5EA6\u4E0D\u8DB3 - \u9000\u56DE\u539F\u6709\u903B\u8F91", true, {
            mes\u957F\u5EA6: mes?.length || 0,
            \u9608\u503C: 100
          });
          console.log("[imageInserter] mes.length < 100, falling back to original storage");
        }
      } else {
        debugBranch("saveImageGroup", "mesId \u65E0\u6548\u6216 chat \u4E0D\u5B58\u5728", true, {
          mesId,
          chat\u5B58\u5728: !!chat[mesId]
        });
      }
    } else {
      debugBranch("saveImageGroup", "\u672A\u627E\u5230 mes_text \u5143\u7D20", true);
    }
  } else {
    debugBranch("saveImageGroup", "insertOriginalText \u6A21\u5F0F\u672A\u542F\u7528", true);
  }
  const isMesText = el && el.classList && el.classList.contains("mes_text");
  debugLog("imageInserter.saveImageGroup", "\u8FDB\u5165\u539F\u6709\u4FDD\u5B58\u903B\u8F91", {
    \u662Fmes_text: isMesText
  });
  if (isMesText) {
    debugBranch("saveImageGroup", "\u4FDD\u5B58\u5230 chat[id].extra.images", true);
    const grandParent = el.parentElement?.parentElement;
    const idStr = grandParent?.getAttribute("mesid");
    if (!idStr) {
      debugBranch("saveImageGroup", "mesid \u672A\u627E\u5230 - \u9000\u56DE metadata", true);
      console.warn("[imageInserter] mes_text element but mesid not found, falling back to chatMetadata");
      await saveToMetadata(images, logicalText);
      timer.end("\u4FDD\u5B58\u5230 metadata (mesid\u672A\u627E\u5230)");
      return;
    }
    const id = parseInt(idStr, 10);
    const context = getContext();
    if (!context.chat || !context.chat[id]) {
      debugBranch("saveImageGroup", "chat \u6D88\u606F\u4E0D\u5B58\u5728 - \u9000\u56DE metadata", true, {
        id
      });
      console.warn("[imageInserter] chat message not found for id:", id, ", falling back to chatMetadata");
      await saveToMetadata(images, logicalText);
      timer.end("\u4FDD\u5B58\u5230 metadata (chat\u4E0D\u5B58\u5728)");
      return;
    }
    if (!context.chat[id].extra) {
      context.chat[id].extra = {};
    }
    if (!context.chat[id].extra.images) {
      context.chat[id].extra.images = {};
    }
    const key = context.chat[id].swipe_id ?? 0;
    const oldImages = context.chat[id].extra.images[key] || [];
    const lockedImages = oldImages.filter((img) => img.locked === true);
    const lockedTags = new Set(lockedImages.map((img) => img.tag));
    const newImagesFiltered = images.filter((img) => !lockedTags.has(img.tag));
    const mergedImages = [...lockedImages, ...newImagesFiltered];
    const isOverride = !!context.chat[id].extra.images[key];
    context.chat[id].extra.images[key] = mergedImages;
    saveChatConditional();
    debugLog("imageInserter.saveImageGroup", "\u4FDD\u5B58\u5230 extra.images \u5B8C\u6210", {
      mesId: id,
      swipeId: key,
      \u4FDD\u5B58\u6570\u91CF: mergedImages.length,
      \u9501\u5B9A\u6570\u91CF: lockedImages.length,
      \u65B0\u589E\u6570\u91CF: newImagesFiltered.length,
      \u662F\u5426\u8986\u76D6: isOverride,
      \u50A8\u5B58\u4F4D\u7F6E: `chat[${id}].extra.images[${key}]`
    });
    timer.end(`extra.images - ${mergedImages.length} \u4E2A`);
    console.log(
      "[imageInserter] Saved to chat[" + id + "].extra.images[" + key + "]:",
      mergedImages,
      isOverride ? "(overridden)" : "(new)",
      lockedImages.length > 0 ? `(preserved ${lockedImages.length} locked)` : ""
    );
    if (context.chat[id].mes && context.chat[id].mes.length > 100 && lockedImages.length > 0) {
      console.log("[imageInserter] Forcing re-render to display locked tags in mes");
      await renderMessage(id);
    }
  } else {
    debugBranch("saveImageGroup", "\u4FDD\u5B58\u5230 chatMetadata (\u975E mes_text)", true);
    await saveToMetadata(images, logicalText);
    timer.end("\u4FDD\u5B58\u5230 metadata");
  }
}

async function saveToMetadata(images, logicalText) {
  const imageGroups = await getcharData("image_groups") || {};
  const elKey = generateElKey2(logicalText);
  if (!elKey) {
    console.warn("[imageInserter] Cannot generate elKey, logicalText too short");
    toastr.warning("\u56FE\u7247\u7EC4\u65E0\u6CD5\u5B58\u50A8\uFF1A\u6587\u672C\u5185\u5BB9\u8FC7\u77ED\uFF0C\u65E0\u6CD5\u751F\u6210\u552F\u4E00\u6807\u8BC6\u3002");
    return;
  }
  const oldImages = imageGroups[elKey] || [];
  const lockedImages = oldImages.filter((img) => img.locked === true);
  const lockedTags = new Set(lockedImages.map((img) => img.tag));
  const newImagesFiltered = images.filter((img) => !lockedTags.has(img.tag));
  const mergedImages = [...lockedImages, ...newImagesFiltered];
  const isOverride = !!imageGroups[elKey];
  imageGroups[elKey] = mergedImages;
  await setcharData("image_groups", imageGroups);
  console.log(
    "[imageInserter] Saved to chatMetadata:",
    elKey,
    mergedImages,
    isOverride ? "(overridden)" : "(new)",
    lockedImages.length > 0 ? `(preserved ${lockedImages.length} locked)` : ""
  );
}

function generateStableId2(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "chatu8-id-" + Math.abs(hash).toString(36);
}

async function deleteImagesForElement(el) {
  if (!el) {
    console.warn("[imageInserter] deleteImagesForElement: el is null");
    return;
  }
  console.log("[imageInserter] deleteImagesForElement called for:", el.tagName, el.className);
  const isInIframe = el.ownerDocument !== document;
  const mesText = findMesTextFromElement(el);
  let searchRoot = el;
  if (mesText && !isInIframe) {
    searchRoot = mesText;
  }
  const imageSelectors = [
    ".image-tag-button",
    ".st-chatu8-image-button",
    ".st-chatu8-image-span",
    ".st-chatu8-image-container",
    ".st-chatu8-collapse-wrapper"
  ];
  let removedCount = 0;
  let lockedCount = 0;
  let lockedTagSet = /* @__PURE__ */ new Set();
  if (mesText) {
    const mesBlock = mesText.closest(".mes");
    const id = parseInt(mesBlock?.getAttribute("mesid"), 10);
    const context = getContext();
    if (!isNaN(id) && context.chat[id]) {
      if (context.chat[id].extra?.images) {
        const key = context.chat[id].swipe_id ?? 0;
        const existingImages = context.chat[id].extra.images[key] || [];
        existingImages.filter((img) => img.locked === true).forEach((img) => {
          lockedTagSet.add(img.tag);
        });
      }
      const lockedTagsArray = context.chat[id].extra?.lockedTags || [];
      lockedTagsArray.forEach((tag) => lockedTagSet.add(tag));
      if (context.chat[id].mes) {
        const { startTag, endTag } = getImageTags();
        const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const mesTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`, "g");
        let match;
        while ((match = mesTagRegex.exec(context.chat[id].mes)) !== null) {
          const tagInMes = match[1].trim();
          if (lockedTagsArray.includes(tagInMes)) {
            lockedTagSet.add(tagInMes);
            console.log("[imageInserter] Found locked tag in mes (old format):", tagInMes.substring(0, 30));
          }
        }
        const imageBlockRegex = /<image>([\s\S]*?)<\/image>/g;
        let imgMatch;
        while ((imgMatch = imageBlockRegex.exec(context.chat[id].mes)) !== null) {
          let tagInMes = imgMatch[1];
          const tagMatch = tagInMes.match(new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`));
          tagInMes = (tagMatch ? tagMatch[1] : tagInMes).trim();
          if (lockedTagsArray.includes(tagInMes)) {
            lockedTagSet.add(tagInMes);
            console.log("[imageInserter] Found locked tag in mes (<image> format):", tagInMes.substring(0, 30));
          }
        }
      }
      console.log(
        "[imageInserter] Total locked tags:",
        lockedTagSet.size,
        "from extra.lockedTags:",
        lockedTagsArray.length
      );
    }
  }
  lockedCount = lockedTagSet.size;
  console.log("[imageInserter] Locked tags for deletion check:", Array.from(lockedTagSet));
  const isElementLocked = (elem) => {
    const isTagLocked2 = (tag) => {
      if (!tag) return false;
      const tagTrimmed = tag.trim();
      if (lockedTagSet.has(tagTrimmed)) return true;
      for (const lockedTag of lockedTagSet) {
        if (lockedTag.trim() === tagTrimmed || tagTrimmed.includes(lockedTag.trim()) || lockedTag.trim().includes(tagTrimmed)) {
          return true;
        }
      }
      return false;
    };
    const link = elem.dataset?.link || elem.getAttribute?.("data-link");
    if (isTagLocked2(link)) {
      console.log("[imageInserter] Element locked (self):", link?.substring(0, 30));
      return true;
    }
    const parentButton = elem.closest?.(".st-chatu8-image-button, .image-tag-button");
    if (parentButton && parentButton !== elem) {
      const parentLink = parentButton.dataset?.link || parentButton.getAttribute?.("data-link");
      if (isTagLocked2(parentLink)) {
        console.log("[imageInserter] Element locked via parent:", parentLink?.substring(0, 30));
        return true;
      }
    }
    const parent = elem.parentElement;
    if (parent) {
      const siblingButtons = parent.querySelectorAll(".st-chatu8-image-button, .image-tag-button");
      for (const sibBtn of siblingButtons) {
        const sibLink = sibBtn.dataset?.link || sibBtn.getAttribute?.("data-link");
        if (isTagLocked2(sibLink)) {
          console.log("[imageInserter] Element locked via sibling:", sibLink?.substring(0, 30));
          return true;
        }
      }
    }
    const prevSibling = elem.previousElementSibling;
    if (prevSibling?.classList?.contains("st-chatu8-image-button") || prevSibling?.classList?.contains("image-tag-button")) {
      const prevLink = prevSibling.dataset?.link || prevSibling.getAttribute?.("data-link");
      if (isTagLocked2(prevLink)) {
        console.log("[imageInserter] Element locked via prev sibling:", prevLink?.substring(0, 30));
        return true;
      }
    }
    return false;
  };
  const deletedTags = /* @__PURE__ */ new Set();
  const collectTagsFromElement = (elem) => {
    const link = elem.dataset?.link || elem.getAttribute?.("data-link");
    if (link && !isElementLocked(elem)) {
      deletedTags.add(link.trim());
    }
  };
  try {
    const allButtons = searchRoot.querySelectorAll(".st-chatu8-image-button, .image-tag-button");
    allButtons.forEach((btn) => collectTagsFromElement(btn));
    console.log("[imageInserter] Tags to delete from storage:", Array.from(deletedTags));
  } catch (e) {
    console.warn("[imageInserter] Error collecting tags:", e);
  }
  const elKeyForImageGroups = generateElKey2(getCleanLogicalText(el));
  console.log("[imageInserter] Pre-computed elKey for image_groups:", elKeyForImageGroups);
  try {
    const collapseWrappers = searchRoot.querySelectorAll(".st-chatu8-collapse-wrapper");
    collapseWrappers.forEach((wrapper) => {
      const buttons = wrapper.querySelectorAll(".st-chatu8-image-button, .image-tag-button");
      const hasAnyLocked = Array.from(buttons).some((btn) => isElementLocked(btn));
      if (hasAnyLocked) {
        console.log("[imageInserter] Collapse wrapper has locked buttons, keeping wrapper");
        buttons.forEach((btn) => {
          if (!isElementLocked(btn)) {
            btn.remove();
            removedCount++;
            console.log("[imageInserter] Removed unlocked button inside wrapper");
          }
        });
      } else if (buttons.length === 0) {
        wrapper.remove();
        removedCount++;
        console.log("[imageInserter] Removed empty collapse wrapper");
      } else {
        wrapper.remove();
        removedCount++;
        console.log("[imageInserter] Removed collapse wrapper (no locked buttons)");
      }
    });
  } catch (e) {
    console.warn("[imageInserter] Error removing collapse wrappers:", e);
  }
  for (const selector of imageSelectors) {
    if (selector === ".st-chatu8-collapse-wrapper") {
      continue;
    }
    try {
      const elements = searchRoot.querySelectorAll(selector);
      elements.forEach((elem) => {
        if (isElementLocked(elem)) {
          console.log("[imageInserter] Skipped locked element:", selector);
          return;
        }
        const innerButtons = elem.querySelectorAll?.(".st-chatu8-image-button, .image-tag-button");
        if (innerButtons && innerButtons.length > 0) {
          const hasLockedInside = Array.from(innerButtons).some((btn) => isElementLocked(btn));
          if (hasLockedInside) {
            console.log("[imageInserter] Skipped container with locked buttons inside:", selector);
            return;
          }
        }
        if (elem.classList?.contains("image-tag-button") || elem.classList?.contains("st-chatu8-image-button")) {
          const prevSib = elem.previousElementSibling;
          if (prevSib && prevSib.tagName === "P" && prevSib.querySelector("image")) {
            prevSib.remove();
            console.log("[imageInserter] Removed tagthink <p> element above button");
          }
          const parentP = elem.parentElement;
          if (parentP && parentP.tagName === "P") {
            const hasImageTag = parentP.querySelector("image") || parentP.querySelector("img");
            const hasFontTag = parentP.querySelector("font");
            const hasGeneratedImage = parentP.querySelector(".st-chatu8-image-container img, .st-chatu8-image-container video");
            if ((hasImageTag || hasFontTag) && !hasGeneratedImage) {
              parentP.remove();
              removedCount++;
              console.log("[imageInserter] Removed parent <p> element containing button (no generated image)");
              return;
            }
          }
        }
        elem.remove();
        removedCount++;
      });
    } catch (e) {
      console.warn("[imageInserter] Error removing elements with selector:", selector, e);
    }
  }
  console.log("[imageInserter] Removed", removedCount, "image-related DOM elements, skipped", lockedCount, "locked");
  if (mesText) {
    const mesBlock = mesText.closest(".mes");
    const id = parseInt(mesBlock?.getAttribute("mesid"), 10);
    const context = getContext();
    if (!isNaN(id) && context.chat[id]) {
      if (context.chat[id].extra?.images) {
        const key = context.chat[id].swipe_id ?? 0;
        const existingImages = context.chat[id].extra.images[key] || [];
        const lockedImages = existingImages.filter((img) => img.locked === true);
        lockedCount = lockedImages.length;
        if (lockedImages.length > 0) {
          context.chat[id].extra.images[key] = lockedImages;
          console.log("[imageInserter] Preserved", lockedCount, "locked images, deleted others");
        } else {
          delete context.chat[id].extra.images[key];
          console.log("[imageInserter] Deleted chat[" + id + "].extra.images[" + key + "]");
        }
      }
      console.log("[imageInserter] Deleting from image_groups BEFORE renderMessage...");
      const elKey = elKeyForImageGroups;
      if (elKey && deletedTags.size > 0) {
        const imageGroups = await getcharData("image_groups") || {};
        if (imageGroups[elKey]) {
          const existingImages = imageGroups[elKey] || [];
          const remainingImages = existingImages.filter((img) => {
            if (img.locked === true) return true;
            if (!deletedTags.has(img.tag?.trim())) return true;
            console.log("[imageInserter] Deleting tag from image_groups:", img.tag?.substring(0, 30));
            return false;
          });
          const deletedCount = existingImages.length - remainingImages.length;
          if (deletedCount > 0) {
            if (remainingImages.length > 0) {
              imageGroups[elKey] = remainingImages;
              await setcharData("image_groups", imageGroups);
              console.log("[imageInserter] image_groups: deleted", deletedCount, ", remaining", remainingImages.length);
            } else {
              delete imageGroups[elKey];
              await setcharData("image_groups", imageGroups);
              console.log("[imageInserter] image_groups: deleted all, removed key:", elKey);
            }
          } else {
            console.log("[imageInserter] image_groups: no matching tags to delete");
          }
        } else {
          console.log("[imageInserter] image_groups: no data found for key:", elKey);
        }
      }
      const { startTag, endTag } = getImageTags();
      const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (context.chat[id].mes) {
        let mes = context.chat[id].mes;
        const oldLen = mes.length;
        const fullBlockRegex = new RegExp(
          `(?:<font[^>]*>\\[[^\\]]*\\]<\\/font>\\s*)?(?:<Tag_think>[\\s\\S]*?<\\/Tag_think>\\s*)?<image>([\\s\\S]*?)<\\/image>`,
          "g"
        );
        mes = mes.replace(fullBlockRegex, (match, imageContent) => {
          const tagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
          const tagMatch = imageContent.match(tagRegex);
          const tag = tagMatch ? tagMatch[1].trim() : imageContent.trim();
          if (tag && lockedTagSet.size > 0) {
            let isLocked = lockedTagSet.has(tag);
            if (!isLocked) {
              for (const lockedTag of lockedTagSet) {
                if (lockedTag.trim() === tag || tag.includes(lockedTag.trim()) || lockedTag.trim().includes(tag)) {
                  isLocked = true;
                  break;
                }
              }
            }
            if (isLocked) {
              console.log("[imageInserter] Keeping locked <image> block, tag:", tag.substring(0, 50));
              return match;
            }
          }
          console.log("[imageInserter] Deleting unlocked <image> block with associated content, tag:", tag.substring(0, 50));
          return "";
        });
        mes = mes.replace(new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`, "g"), (match, tag) => {
          if (lockedTagSet.size > 0) {
            const tagTrimmed = tag.trim();
            let isLocked = lockedTagSet.has(tagTrimmed);
            if (!isLocked) {
              for (const lockedTag of lockedTagSet) {
                if (lockedTag.trim() === tagTrimmed || tagTrimmed.includes(lockedTag.trim()) || lockedTag.trim().includes(tagTrimmed)) {
                  isLocked = true;
                  break;
                }
              }
            }
            if (isLocked) return match;
          }
          return "";
        });
        mes = mes.replace(/\n{3,}/g, "\n\n");
        context.chat[id].mes = mes;
        const newLen = mes.length;
        console.log(
          "[imageInserter] Cleaned mes content, removed",
          oldLen - newLen,
          "chars",
          lockedTagSet.size > 0 ? `(preserved ${lockedTagSet.size} locked tags)` : "(no locked tags)"
        );
        if (oldLen !== newLen || removedCount > 0) {
          if (lockedTagSet.size > 0 && mes.length > 100) {
            console.log("[imageInserter] Forcing re-render to restore locked elements");
          }
          console.log("[imageInserter] Calling renderMessage to refresh page elements, mesChanged:", oldLen !== newLen, ", domRemoved:", removedCount);
          await renderMessage(id);
        }
      }
      await saveChatConditional();
      console.log("[imageInserter] Saved chat after deletion");
    }
  }
  if (!mesText && elKeyForImageGroups) {
    console.log("[imageInserter] Non-mesText scenario: deleting from image_groups...");
    const imageGroups = await getcharData("image_groups") || {};
    if (imageGroups[elKeyForImageGroups]) {
      const existingImages = imageGroups[elKeyForImageGroups] || [];
      let remainingImages;
      if (deletedTags.size > 0) {
        remainingImages = existingImages.filter((img) => {
          if (img.locked === true) return true;
          if (!deletedTags.has(img.tag?.trim())) return true;
          console.log("[imageInserter] Deleting tag from image_groups:", img.tag?.substring(0, 30));
          return false;
        });
      } else {
        console.log("[imageInserter] Fallback mode: deleting all unlocked images from image_groups");
        remainingImages = existingImages.filter((img) => {
          if (img.locked === true) {
            console.log("[imageInserter] Keeping locked image:", img.tag?.substring(0, 30));
            return true;
          }
          console.log("[imageInserter] Deleting unlocked image from image_groups:", img.tag?.substring(0, 30));
          return false;
        });
      }
      const deletedCount = existingImages.length - remainingImages.length;
      if (deletedCount > 0) {
        if (remainingImages.length > 0) {
          imageGroups[elKeyForImageGroups] = remainingImages;
          await setcharData("image_groups", imageGroups);
          console.log("[imageInserter] image_groups: deleted", deletedCount, ", remaining", remainingImages.length);
        } else {
          delete imageGroups[elKeyForImageGroups];
          await setcharData("image_groups", imageGroups);
          console.log("[imageInserter] image_groups: deleted all, removed key:", elKeyForImageGroups);
        }
      } else {
        console.log("[imageInserter] image_groups: no images to delete (all locked or empty)");
      }
    } else {
      console.log("[imageInserter] image_groups: no data found for key:", elKeyForImageGroups);
    }
  }
  console.log("[imageInserter] deleteImagesForElement completed, locked count:", lockedCount);
  return { lockedCount };
}

async function lockTagForElement(el, tagToLock) {
  if (!el || !tagToLock) {
    return { success: false, message: "\u53C2\u6570\u65E0\u6548" };
  }
  const mesText = findMesTextFromElement(el);
  if (mesText) {
    const mesBlock = mesText.closest(".mes");
    const id = parseInt(mesBlock?.getAttribute("mesid"), 10);
    const context = getContext();
    if (!isNaN(id) && context.chat[id]) {
      if (!context.chat[id].extra) {
        context.chat[id].extra = {};
      }
      if (context.chat[id].extra.images) {
        const key = context.chat[id].swipe_id ?? 0;
        const images = context.chat[id].extra.images[key] || [];
        let found = false;
        for (const img of images) {
          if (img.tag === tagToLock) {
            img.locked = true;
            found = true;
          }
        }
        if (found) {
          await saveChatConditional();
          console.log("[imageInserter] Locked tag in extra.images:", tagToLock);
          return { success: true, message: "Tag \u5DF2\u9501\u5B9A" };
        }
      }
      const mes = context.chat[id].mes || "";
      const { startTag, endTag } = getImageTags();
      const tagNormalized = tagToLock.replaceAll("\n", "");
      const mesNormalized = mes.replaceAll("\n", "");
      const hasTag = mesNormalized.includes(tagNormalized) || mes.includes(`${startTag}${tagToLock}${endTag}`) || mes.includes(`<image>${tagToLock}</image>`);
      if (hasTag) {
        if (!context.chat[id].extra.lockedTags) {
          context.chat[id].extra.lockedTags = [];
        }
        if (!context.chat[id].extra.lockedTags.includes(tagToLock)) {
          context.chat[id].extra.lockedTags.push(tagToLock);
        }
        await saveChatConditional();
        console.log("[imageInserter] Locked tag in extra.lockedTags:", tagToLock);
        return { success: true, message: "Tag \u5DF2\u9501\u5B9A" };
      }
      const searchResult = await findTagInImageGroups(tagToLock);
      if (searchResult) {
        const imageGroups = await getcharData("image_groups") || {};
        const images = imageGroups[searchResult.elKey];
        if (images && images[searchResult.index]) {
          images[searchResult.index].locked = true;
          await setcharData("image_groups", imageGroups);
          console.log("[imageInserter] Locked tag in image_groups (fallback from mesText):", tagToLock);
          return { success: true, message: "Tag \u5DF2\u9501\u5B9A" };
        }
      }
      return { success: false, message: "\u672A\u627E\u5230\u5339\u914D\u7684 tag" };
    }
  } else {
    const logicalText = getCleanLogicalText(el);
    const elKey = generateElKey2(logicalText);
    if (elKey) {
      const imageGroups = await getcharData("image_groups") || {};
      const images = imageGroups[elKey] || [];
      let found = false;
      for (const img of images) {
        if (img.tag === tagToLock) {
          img.locked = true;
          found = true;
        }
      }
      if (found) {
        imageGroups[elKey] = images;
        await setcharData("image_groups", imageGroups);
        console.log("[imageInserter] Locked tag in metadata:", tagToLock);
        return { success: true, message: "Tag \u5DF2\u9501\u5B9A" };
      }
    }
    const searchResult = await findTagInImageGroups(tagToLock);
    if (searchResult) {
      const imageGroups = await getcharData("image_groups") || {};
      const images = imageGroups[searchResult.elKey];
      if (images && images[searchResult.index]) {
        images[searchResult.index].locked = true;
        await setcharData("image_groups", imageGroups);
        console.log("[imageInserter] Locked tag in metadata (global search):", tagToLock);
        return { success: true, message: "Tag \u5DF2\u9501\u5B9A" };
      }
    }
  }
  return { success: false, message: "\u672A\u627E\u5230\u5339\u914D\u7684 tag" };
}

async function unlockTagForElement(el, tagToUnlock) {
  if (!el || !tagToUnlock) {
    return { success: false, message: "\u53C2\u6570\u65E0\u6548" };
  }
  const mesText = findMesTextFromElement(el);
  if (mesText) {
    const mesBlock = mesText.closest(".mes");
    const id = parseInt(mesBlock?.getAttribute("mesid"), 10);
    const context = getContext();
    if (!isNaN(id) && context.chat[id]) {
      if (context.chat[id].extra?.images) {
        const key = context.chat[id].swipe_id ?? 0;
        const images = context.chat[id].extra.images[key] || [];
        let found = false;
        for (const img of images) {
          if (img.tag === tagToUnlock) {
            img.locked = false;
            found = true;
          }
        }
        if (found) {
          await saveChatConditional();
          console.log("[imageInserter] Unlocked tag in extra.images:", tagToUnlock);
          return { success: true, message: "Tag \u5DF2\u89E3\u9501" };
        }
      }
      if (context.chat[id].extra?.lockedTags) {
        const { startTag, endTag } = getImageTags();
        const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pureTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
        const pureTagMatch = tagToUnlock.match(pureTagRegex);
        let tagNormalized;
        if (pureTagMatch) {
          tagNormalized = pureTagMatch[1].trim().replaceAll("\u300A", "<").replaceAll("\u300B", ">").replaceAll("\n", "");
        } else {
          tagNormalized = tagToUnlock.replaceAll("\u300A", "<").replaceAll("\u300B", ">").replaceAll("\n", "");
        }
        const tagPrefix = tagNormalized.substring(0, 100);
        let foundIdx = -1;
        for (let i = 0; i < context.chat[id].extra.lockedTags.length; i++) {
          const lockedTag = context.chat[id].extra.lockedTags[i];
          const lockedTagPrefix = lockedTag.substring(0, 100);
          if (tagPrefix === lockedTagPrefix || tagNormalized.startsWith(lockedTagPrefix) || lockedTag.startsWith(tagPrefix)) {
            foundIdx = i;
            break;
          }
        }
        if (foundIdx !== -1) {
          const removedTag = context.chat[id].extra.lockedTags.splice(foundIdx, 1)[0];
          await saveChatConditional();
          console.log("[imageInserter] Unlocked tag from extra.lockedTags:", removedTag);
          return { success: true, message: "Tag \u5DF2\u89E3\u9501" };
        }
      }
      const searchResult = await findTagInImageGroups(tagToUnlock);
      if (searchResult) {
        const imageGroups = await getcharData("image_groups") || {};
        const images = imageGroups[searchResult.elKey];
        if (images && images[searchResult.index]) {
          images[searchResult.index].locked = false;
          await setcharData("image_groups", imageGroups);
          console.log("[imageInserter] Unlocked tag in image_groups (fallback from mesText):", tagToUnlock);
          return { success: true, message: "Tag \u5DF2\u89E3\u9501" };
        }
      }
      return { success: false, message: "\u672A\u627E\u5230\u5339\u914D\u7684 tag" };
    }
  } else {
    const logicalText = getCleanLogicalText(el);
    const elKey = generateElKey2(logicalText);
    if (elKey) {
      const imageGroups = await getcharData("image_groups") || {};
      const images = imageGroups[elKey] || [];
      let found = false;
      for (const img of images) {
        if (img.tag === tagToUnlock) {
          img.locked = false;
          found = true;
        }
      }
      if (found) {
        imageGroups[elKey] = images;
        await setcharData("image_groups", imageGroups);
        console.log("[imageInserter] Unlocked tag in metadata:", tagToUnlock);
        return { success: true, message: "Tag \u5DF2\u89E3\u9501" };
      }
    }
    const searchResult = await findTagInImageGroups(tagToUnlock);
    if (searchResult) {
      const imageGroups = await getcharData("image_groups") || {};
      const images = imageGroups[searchResult.elKey];
      if (images && images[searchResult.index]) {
        images[searchResult.index].locked = false;
        await setcharData("image_groups", imageGroups);
        console.log("[imageInserter] Unlocked tag in metadata (global search):", tagToUnlock);
        return { success: true, message: "Tag \u5DF2\u89E3\u9501" };
      }
    }
  }
  return { success: false, message: "\u672A\u627E\u5230\u5339\u914D\u7684 tag" };
}

async function isTagLocked(el, tagToCheck) {
  if (!el || !tagToCheck) {
    return false;
  }
  const mesText = findMesTextFromElement(el);
  if (mesText) {
    const mesBlock = mesText.closest(".mes");
    const id = parseInt(mesBlock?.getAttribute("mesid"), 10);
    const context = getContext();
    if (!isNaN(id) && context.chat[id]) {
      if (context.chat[id].extra?.images) {
        const key = context.chat[id].swipe_id ?? 0;
        const images = context.chat[id].extra.images[key] || [];
        for (const img of images) {
          if (img.tag === tagToCheck) {
            return img.locked === true;
          }
        }
      }
      if (context.chat[id].extra?.lockedTags) {
        const { startTag, endTag } = getImageTags();
        const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pureTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
        const pureTagMatch = tagToCheck.match(pureTagRegex);
        let tagNormalized;
        if (pureTagMatch) {
          tagNormalized = pureTagMatch[1].trim().replaceAll("\u300A", "<").replaceAll("\u300B", ">").replaceAll("\n", "");
        } else {
          tagNormalized = tagToCheck.replaceAll("\u300A", "<").replaceAll("\u300B", ">").replaceAll("\n", "");
        }
        const tagPrefix = tagNormalized.substring(0, 100);
        for (const lockedTag of context.chat[id].extra.lockedTags) {
          const lockedTagPrefix = lockedTag.substring(0, 100);
          if (tagPrefix === lockedTagPrefix || tagNormalized.startsWith(lockedTagPrefix) || lockedTag.startsWith(tagPrefix)) {
            return true;
          }
        }
      }
      const searchResult = await findTagInImageGroups(tagToCheck);
      if (searchResult) {
        return searchResult.images[searchResult.index]?.locked === true;
      }
    }
  } else {
    const logicalText = getCleanLogicalText(el);
    const elKey = generateElKey2(logicalText);
    if (elKey) {
      const imageGroups = await getcharData("image_groups") || {};
      const images = imageGroups[elKey] || [];
      for (const img of images) {
        if (img.tag === tagToCheck) {
          return img.locked === true;
        }
      }
    }
    const searchResult = await findTagInImageGroups(tagToCheck);
    if (searchResult) {
      return searchResult.images[searchResult.index]?.locked === true;
    }
  }
  return false;
}

async function lockAllTagsForElement(el) {
  if (!el) {
    return { success: false, message: "\u53C2\u6570\u65E0\u6548", count: 0 };
  }
  const mesText = findMesTextFromElement(el);
  let lockedCount = 0;
  if (mesText) {
    const mesBlock = mesText.closest(".mes");
    const id = parseInt(mesBlock?.getAttribute("mesid"), 10);
    const context = getContext();
    if (!isNaN(id) && context.chat[id]) {
      if (context.chat[id].extra?.images) {
        const key = context.chat[id].swipe_id ?? 0;
        const images = context.chat[id].extra.images[key] || [];
        for (const img of images) {
          if (!img.locked) {
            img.locked = true;
            lockedCount++;
          }
        }
      }
      if (!context.chat[id].extra) {
        context.chat[id].extra = {};
      }
      if (!Array.isArray(context.chat[id].extra.lockedTags)) {
        context.chat[id].extra.lockedTags = [];
      }
      if (context.chat[id].mes) {
        const { startTag, endTag } = getImageTags();
        const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const mesTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`, "g");
        let match;
        while ((match = mesTagRegex.exec(context.chat[id].mes)) !== null) {
          const tagInMes = match[1].trim();
          if (!context.chat[id].extra.lockedTags.includes(tagInMes)) {
            context.chat[id].extra.lockedTags.push(tagInMes);
            lockedCount++;
          }
        }
        const imageBlockRegex = /<image>([\s\S]*?)<\/image>/g;
        let imgMatch;
        while ((imgMatch = imageBlockRegex.exec(context.chat[id].mes)) !== null) {
          let tagInMes = imgMatch[1];
          const tagMatch = tagInMes.match(new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`));
          tagInMes = (tagMatch ? tagMatch[1] : tagInMes).trim();
          if (!context.chat[id].extra.lockedTags.includes(tagInMes)) {
            context.chat[id].extra.lockedTags.push(tagInMes);
            lockedCount++;
          }
        }
      }
      const logicalText = getCleanLogicalText(el);
      const elKey = generateElKey2(logicalText);
      if (elKey) {
        const imageGroups = await getcharData("image_groups") || {};
        const imagesInGroups = imageGroups[elKey] || [];
        for (const img of imagesInGroups) {
          if (!img.locked) {
            img.locked = true;
            lockedCount++;
          }
          if (img.tag && !context.chat[id].extra.lockedTags.includes(img.tag)) {
            context.chat[id].extra.lockedTags.push(img.tag);
          }
        }
        if (imagesInGroups.length > 0) {
          imageGroups[elKey] = imagesInGroups;
          await setcharData("image_groups", imageGroups);
          console.log("[imageInserter] Also locked tags in image_groups, elKey:", elKey);
        }
      }
      if (lockedCount > 0) {
        await saveChatConditional();
        console.log("[imageInserter] Locked all tags for element, count:", lockedCount);
        return { success: true, message: `\u5DF2\u9501\u5B9A ${lockedCount} \u4E2A Tag`, count: lockedCount };
      }
      return { success: false, message: "\u6CA1\u6709\u627E\u5230\u53EF\u9501\u5B9A\u7684 Tag", count: 0 };
    }
  } else {
    const logicalText = getCleanLogicalText(el);
    const elKey = generateElKey2(logicalText);
    if (elKey) {
      const imageGroups = await getcharData("image_groups") || {};
      const images = imageGroups[elKey] || [];
      for (const img of images) {
        if (!img.locked) {
          img.locked = true;
          lockedCount++;
        }
      }
      if (lockedCount > 0) {
        imageGroups[elKey] = images;
        await setcharData("image_groups", imageGroups);
        console.log("[imageInserter] Locked all tags in metadata, count:", lockedCount);
        return { success: true, message: `\u5DF2\u9501\u5B9A ${lockedCount} \u4E2A Tag`, count: lockedCount };
      }
    }
  }
  return { success: false, message: "\u6CA1\u6709\u627E\u5230\u53EF\u9501\u5B9A\u7684 Tag", count: 0 };
}

async function unlockAllTagsForElement(el) {
  if (!el) {
    return { success: false, message: "\u53C2\u6570\u65E0\u6548", count: 0 };
  }
  const mesText = findMesTextFromElement(el);
  let unlockedCount = 0;
  if (mesText) {
    const mesBlock = mesText.closest(".mes");
    const id = parseInt(mesBlock?.getAttribute("mesid"), 10);
    const context = getContext();
    if (!isNaN(id) && context.chat[id]) {
      if (context.chat[id].extra?.images) {
        const key = context.chat[id].swipe_id ?? 0;
        const images = context.chat[id].extra.images[key] || [];
        for (const img of images) {
          if (img.locked) {
            img.locked = false;
            unlockedCount++;
          }
        }
      }
      if (context.chat[id].extra?.lockedTags && context.chat[id].extra.lockedTags.length > 0) {
        unlockedCount += context.chat[id].extra.lockedTags.length;
        context.chat[id].extra.lockedTags = [];
      }
      const logicalText = getCleanLogicalText(el);
      const elKey = generateElKey2(logicalText);
      if (elKey) {
        const imageGroups = await getcharData("image_groups") || {};
        const imagesInGroups = imageGroups[elKey] || [];
        for (const img of imagesInGroups) {
          if (img.locked) {
            img.locked = false;
            unlockedCount++;
          }
        }
        if (imagesInGroups.length > 0) {
          imageGroups[elKey] = imagesInGroups;
          await setcharData("image_groups", imageGroups);
          console.log("[imageInserter] Also unlocked tags in image_groups, elKey:", elKey);
        }
      }
      if (unlockedCount > 0) {
        await saveChatConditional();
        console.log("[imageInserter] Unlocked all tags for element, count:", unlockedCount);
        return { success: true, message: `\u5DF2\u89E3\u9501 ${unlockedCount} \u4E2A Tag`, count: unlockedCount };
      }
      return { success: false, message: "\u6CA1\u6709\u627E\u5230\u5DF2\u9501\u5B9A\u7684 Tag", count: 0 };
    }
  } else {
    const logicalText = getCleanLogicalText(el);
    const elKey = generateElKey2(logicalText);
    if (elKey) {
      const imageGroups = await getcharData("image_groups") || {};
      const images = imageGroups[elKey] || [];
      for (const img of images) {
        if (img.locked) {
          img.locked = false;
          unlockedCount++;
        }
      }
      if (unlockedCount > 0) {
        imageGroups[elKey] = images;
        await setcharData("image_groups", imageGroups);
        console.log("[imageInserter] Unlocked all tags in metadata, count:", unlockedCount);
        return { success: true, message: `\u5DF2\u89E3\u9501 ${unlockedCount} \u4E2A Tag`, count: unlockedCount };
      }
    }
  }
  return { success: false, message: "\u6CA1\u6709\u627E\u5230\u5DF2\u9501\u5B9A\u7684 Tag", count: 0 };
}

async function deleteTagForElement(el, tag) {
  if (!el || !tag) {
    return { success: false, message: "\u53C2\u6570\u65E0\u6548" };
  }
  const tagToDelete = tag.trim();
  let deletedFromAny = false;
  const mesText = findMesTextFromElement(el);
  if (mesText) {
    const mesBlock = mesText.closest(".mes");
    const id = parseInt(mesBlock?.getAttribute("mesid"), 10);
    const context = getContext();
    if (!isNaN(id) && context.chat[id]) {
      if (context.chat[id].extra?.images) {
        const key = context.chat[id].swipe_id ?? 0;
        const images = context.chat[id].extra.images[key] || [];
        const originalLength = images.length;
        context.chat[id].extra.images[key] = images.filter((img) => img.tag?.trim() !== tagToDelete);
        if (context.chat[id].extra.images[key].length < originalLength) {
          deletedFromAny = true;
          console.log("[imageInserter] Deleted tag from extra.images");
        }
      }
      if (context.chat[id].extra?.lockedTags) {
        const originalLength = context.chat[id].extra.lockedTags.length;
        context.chat[id].extra.lockedTags = context.chat[id].extra.lockedTags.filter((t) => t.trim() !== tagToDelete);
        if (context.chat[id].extra.lockedTags.length < originalLength) {
          deletedFromAny = true;
          console.log("[imageInserter] Deleted tag from extra.lockedTags");
        }
      }
      if (context.chat[id].mes) {
        const { startTag, endTag } = getImageTags();
        const escapedStart = escapeRegExp(startTag);
        const escapedEnd = escapeRegExp(endTag);
        const tagPattern = new RegExp(`\\n*<image>${escapedStart}${escapeRegExp(tagToDelete)}${escapedEnd}<\\/image>`, "g");
        const tagPattern2 = new RegExp(`\\n*${escapedStart}${escapeRegExp(tagToDelete)}${escapedEnd}`, "g");
        const originalMes = context.chat[id].mes;
        let newMes = originalMes.replace(tagPattern, "");
        newMes = newMes.replace(tagPattern2, "");
        if (newMes !== originalMes) {
          context.chat[id].mes = newMes;
          deletedFromAny = true;
          console.log("[imageInserter] Deleted tag from mes content");
        }
      }
      if (deletedFromAny) {
        await saveChatConditional();
        await renderMessage(id);
      }
      if (!deletedFromAny) {
        const searchResult = await findTagInImageGroups(tagToDelete);
        if (searchResult) {
          const imageGroups = await getcharData("image_groups") || {};
          const images = imageGroups[searchResult.elKey];
          if (images && images[searchResult.index]) {
            images.splice(searchResult.index, 1);
            if (images.length > 0) {
              imageGroups[searchResult.elKey] = images;
            } else {
              delete imageGroups[searchResult.elKey];
            }
            await setcharData("image_groups", imageGroups);
            deletedFromAny = true;
            console.log("[imageInserter] Deleted tag from image_groups (fallback from mesText):", tagToDelete.substring(0, 30));
          }
        }
      }
      if (!deletedFromAny) {
        return { success: false, message: "\u672A\u627E\u5230\u5339\u914D\u7684 tag" };
      }
    }
  }
  const logicalText = getCleanLogicalText(el);
  const elKey = generateElKey2(logicalText);
  if (elKey) {
    const imageGroups = await getcharData("image_groups") || {};
    const images = imageGroups[elKey] || [];
    const originalLength = images.length;
    const filteredImages = images.filter((img) => img.tag?.trim() !== tagToDelete);
    if (filteredImages.length < originalLength) {
      imageGroups[elKey] = filteredImages;
      await setcharData("image_groups", imageGroups);
      deletedFromAny = true;
      console.log("[imageInserter] Deleted tag from image_groups");
    }
  }
  if (!deletedFromAny) {
    const searchResult = await findTagInImageGroups(tagToDelete);
    if (searchResult) {
      const imageGroups = await getcharData("image_groups") || {};
      const images = imageGroups[searchResult.elKey];
      if (images && images[searchResult.index]) {
        images.splice(searchResult.index, 1);
        if (images.length > 0) {
          imageGroups[searchResult.elKey] = images;
        } else {
          delete imageGroups[searchResult.elKey];
        }
        await setcharData("image_groups", imageGroups);
        deletedFromAny = true;
        console.log("[imageInserter] Deleted tag from image_groups (global search fallback):", tagToDelete.substring(0, 30));
      }
    }
  }
  if (deletedFromAny) {
    return { success: true, message: "Tag \u5DF2\u5220\u9664" };
  }
  return { success: false, message: "\u672A\u627E\u5230\u8BE5 Tag" };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function __set_wrProfileSelect(v) { wrProfileSelect = v; }

export function __set_wrTextEditor(v) { wrTextEditor = v; }

export function __set_wrAiEditor(v) { wrAiEditor = v; }

export { deleteImagesForElement, deleteTagForElement, fuzzyMatchLine, getCleanLogicalText, insertImagesIntoElement, isTagLocked, lockAllTagsForElement, lockTagForElement, parseImagesFromPrompt, removeThinkingTextOnly, unlockAllTagsForElement, unlockTagForElement, wrAiEditor, wrProfileSelect, wrTextEditor };
