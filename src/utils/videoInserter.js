// 还原自打包产物 — 原始模块: utils/videoInserter.js
import { extension_settings } from "../../../../../extensions.js";
import { extensionName } from "./config.js";
import { removeThinkingTextOnly } from "./imageInserter.js";
import { debugBranch, debugContent, debugLog, debugTimer } from "./debugLogger.js";
import { applyReverseWordReplacement, applyWordReplacement } from "./wordReplacementService.js";
import "./settings/wordReplacement.js"; // init_wordReplacement

function parseVideosFromDirectManifest(text, startTag = "image###", endTag = "###") {
  if (!text || typeof text !== "string") return [];
  let cleanText = text;
  const codeBlockMatch = cleanText.match(/```(?:yaml|json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    cleanText = codeBlockMatch[1];
  }
  if (!/asset_manifest\s*:/i.test(cleanText)) {
    return [];
  }
  let regexText = "";
  const anchorMatch = cleanText.match(/^\s*(?:source_anchor|sourceAnchor|source-anchor|定位锚点|锚点)\s*[:：]\s*(.+)$/im);
  if (anchorMatch && anchorMatch[1]) {
    regexText = anchorMatch[1].trim().replace(/^["']|["']$/g, "").replace(/[（(](?:从原文|原文提取|定位).*?[)）]$/g, "").trim();
  }
  if (!regexText) {
    const descMatch = cleanText.match(/^\s*(?:大致描述|描述|description|summary)\s*[:：]\s*(.+)$/im);
    if (descMatch && descMatch[1]) {
      regexText = descMatch[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  if (!regexText) return [];
  let promptContent = cleanText.replace(/```[a-zA-Z0-9_-]*/g, "").replace(/```/g, "").trim();
  promptContent = promptContent.replace(/</g, "\u300A").replace(/>/g, "\u300B");
  const formattedContent = promptContent.replace(/\r?\n/g, "\\n");
  const tag = `${startTag}${formattedContent}${endTag}`;
  return [{
    regex: regexText,
    tag
  }];
}

function parseVideosFromNewXml(text, startTag = "image###", endTag = "###") {
  if (!text || typeof text !== "string") return [];
  let searchText = text;
  const containerRegex = /<(?:video_prompt|videos)\b[^>]*>([\s\S]*?)<\/(?:video_prompt|videos)>/gi;
  const allMatches = [...text.matchAll(containerRegex)];
  if (allMatches.length > 0) {
    const lastMatch = allMatches[allMatches.length - 1];
    searchText = lastMatch[1];
    const innerVideosMatch = searchText.match(/<videos\b[^>]*>([\s\S]*?)<\/videos>/i);
    if (innerVideosMatch && innerVideosMatch[1]) {
      searchText = innerVideosMatch[1];
    }
  }
  const videoRegex = /<video\b[^>]*>([\s\S]*?)<\/video>/gi;
  const results = [];
  let match;
  let index = 0;
  while ((match = videoRegex.exec(searchText)) !== null) {
    index++;
    const innerVideo = match[1];
    const thinkMatch = innerVideo.match(/<video_think\b[^>]*>([\s\S]*?)<\/video_think>/i);
    let regexText = "";
    if (thinkMatch && thinkMatch[1]) {
      const thinkContent = thinkMatch[1];
      const anchorMatch = thinkContent.match(/(?:source_anchor|sourceAnchor|source-anchor|定位锚点|锚点)\s*[:：]\s*(.+)$/im);
      if (anchorMatch && anchorMatch[1]) {
        regexText = anchorMatch[1].trim().replace(/^["']|["']$/g, "").replace(/[（(](?:从原文|原文提取|定位).*?[)）]$/g, "").trim();
      }
      if (!regexText) {
        const descMatch = thinkContent.match(/(?:大致描述|描述|description|summary)\s*[:：]\s*(.+)$/im);
        if (descMatch && descMatch[1]) {
          regexText = descMatch[1].trim().replace(/^["']|["']$/g, "");
        }
      }
    }
    let promptContent = innerVideo.replace(/<video_think\b[^>]*>[\s\S]*?<\/video_think>/gi, "").trim();
    promptContent = promptContent.replace(/```[a-zA-Z0-9_-]*/g, "").replace(/```/g, "").trim();
    promptContent = promptContent.replace(/</g, "\u300A").replace(/>/g, "\u300B");
    if (regexText && promptContent) {
      const formattedContent = promptContent.replace(/\r?\n/g, "\\n");
      const tag = `${startTag}${formattedContent}${endTag}`;
      results.push({
        regex: regexText,
        tag
      });
      console.log(`[parseVideosFromNewXml] \u7B2C ${index} \u4E2A video \u89E3\u6790\u6210\u529F, regex: ${regexText}`);
    } else {
      console.warn(`[parseVideosFromNewXml] \u7B2C ${index} \u4E2A video \u89E3\u6790\u672A\u901A\u8FC7: regex="${regexText}", promptContent\u957F\u5EA6=${promptContent?.length || 0}`);
    }
  }
  return results;
}

function parseVideosFromPrompt(text) {
  const timer = debugTimer("videoInserter.parseVideosFromPrompt", "\u89E3\u6790 LLM \u8F93\u51FA\u4E2D\u7684\u89C6\u9891\u89C6\u6750\u6807\u7B7E");
  const videosData = [];
  if (!text || typeof text !== "string") {
    debugBranch("parseVideosFromPrompt", "\u8F93\u5165\u65E0\u6548 - \u8DF3\u8FC7", true, {
      \u8F93\u5165\u7C7B\u578B: typeof text,
      \u662F\u5426\u4E3A\u7A7A: !text
    });
    timer.end("\u8F93\u5165\u65E0\u6548");
    return videosData;
  }
  text = applyWordReplacement(text, "ai");
  text = applyReverseWordReplacement(text, "text");
  text = removeThinkingTextOnly(text);
  debugLog("videoInserter.parseVideosFromPrompt", "\u5F00\u59CB\u89E3\u6790", {
    \u6587\u672C\u957F\u5EA6: text.length
  });
  debugContent("parseVideosFromPrompt", "LLM \u539F\u59CB\u8F93\u51FA (\u5904\u7406\u601D\u8003\u540E)", text, 500);
  const settings3 = extension_settings[extensionName];
  const startTag = settings3?.startTag || "image###";
  const endTag = settings3?.endTag || "###";
  if (/<video\b/i.test(text)) {
    debugBranch("parseVideosFromPrompt", "\u68C0\u6D4B\u5230 XML \u7ED3\u6784\u5316\u89C6\u9891\u914D\u7F6E", true);
    const xmlResults = parseVideosFromNewXml(text, startTag, endTag);
    if (xmlResults.length > 0) {
      debugLog("videoInserter.parseVideosFromPrompt", "XML \u7ED3\u6784\u5316\u89C6\u6750\u89E3\u6790\u5B8C\u6210", {
        \u89E3\u6790\u6570\u91CF: xmlResults.length
      });
      timer.end("XML \u7ED3\u6784\u5316\u89C6\u6750\u89E3\u6790\u5B8C\u6210");
      return xmlResults;
    }
  }
  if (/asset_manifest\s*:/i.test(text)) {
    debugBranch("parseVideosFromPrompt", "\u68C0\u6D4B\u5230\u76F4\u63A5 asset_manifest \u89C6\u6750\u914D\u7F6E", true);
    const directResults = parseVideosFromDirectManifest(text, startTag, endTag);
    if (directResults.length > 0) {
      debugLog("videoInserter.parseVideosFromPrompt", "\u76F4\u63A5 asset_manifest \u89C6\u6750\u89E3\u6790\u5B8C\u6210", {
        \u89E3\u6790\u6570\u91CF: directResults.length
      });
      timer.end("\u76F4\u63A5 asset_manifest \u89C6\u6750\u89E3\u6790\u5B8C\u6210");
      return directResults;
    }
  }
  timer.end("\u89E3\u6790\u5B8C\u6210(\u672A\u5339\u914D\u5230 asset_manifest \u89C6\u6750)");
  return videosData;
}

export { parseVideosFromPrompt };
