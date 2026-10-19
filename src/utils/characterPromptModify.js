// 还原自打包产物 — 原始模块: utils/characterPromptModify.js
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { getContext } from "../../../../../st-context.js";
import { eventNames, extensionName } from "./config.js";
import { stylishConfirm } from "./ui_common.js";
import { mergeAdjacentMessages, replaceAllPlaceholders, replacePlaceholder } from "./promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "./settings/llmService.js";
import { updateCombinedPrompt } from "./settings/llmUi.js";
import { generateCharacterListText, generateCommonCharacterListText, generateOutfitEnableListText } from "./settings/worldbook.js";
import { refreshCharacterSettings } from "./settings/character/index.js";
import "./settings/llm.js"; // init_llm

function attachImagesToMessage3(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
  if (!images || images.length === 0 || messageIndex < 0 || messageIndex >= messages.length) {
    return messages;
  }
  const result = [...messages];
  const targetMsg = result[messageIndex];
  const contentParts = [];
  if (typeof targetMsg.content === "string") {
    contentParts.push({
      type: "text",
      text: targetMsg.content
    });
  } else if (Array.isArray(targetMsg.content)) {
    contentParts.push(...targetMsg.content);
  }
  if (images.length > 0) {
    contentParts.push({
      type: "text",
      text: `
[\u4EE5\u4E0B\u662F\u7528\u6237\u4E0A\u4F20\u7684${images.length}\u5F20${imageLabel}]`
    });
  }
  images.forEach((imgItem, idx) => {
    const imgBase64 = typeof imgItem === "string" ? imgItem : imgItem.base64;
    const imgName = typeof imgItem === "object" && imgItem.name ? imgItem.name : `${imageLabel}${idx + 1}`;
    contentParts.push({
      type: "text",
      text: `[${imgName}]`
    });
    let imageUrl = imgBase64;
    if (!imgBase64.startsWith("data:")) {
      imageUrl = `data:image/png;base64,${imgBase64}`;
    }
    contentParts.push({
      type: "image_url",
      image_url: {
        url: imageUrl,
        detail: "auto"
      }
    });
  });
  result[messageIndex] = {
    ...targetMsg,
    content: contentParts
  };
  return result;
}

function findMessageIndexWithPlaceholder3(messages, placeholder) {
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (typeof msg.content === "string" && msg.content.includes(placeholder)) {
      return i;
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text" && part.text.includes(placeholder)) {
          return i;
        }
      }
    }
  }
  return -1;
}

function generateRequestId4() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function LLM_CHAR_MODIFY(prompt2, options = {}) {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId4();
    const timeoutMs = options.timeoutMs || 6e4;
    let timeoutTimer = null;
    console.log(`[characterPromptModify] Executing char modify LLM request (ID: ${requestId})`);
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_CHAR_MODIFY_RESPONSE, handler);
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };
    const handler = (responseData) => {
      if (responseData.id !== requestId) return;
      cleanup();
      if (responseData.success) {
        resolve(responseData.result);
      } else {
        reject(new Error(responseData.result || "LLM \u8BF7\u6C42\u5931\u8D25"));
      }
    };
    eventSource.on(eventNames.LLM_CHAR_MODIFY_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_CHAR_MODIFY_REQUEST, { prompt: prompt2, id: requestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error("\u89D2\u8272\u4FEE\u6539 LLM \u8BF7\u6C42\u8D85\u65F6"));
    }, timeoutMs);
  });
}

function preprocessTagContent2(content) {
  let processed = content.replace(/:/g, ":").replace(/,/g, ",");
  processed = processed.replace(/下半身NSWebcam:/g, "\u4E0B\u534A\u8EABNSFW\u80CC\u9762:");
  processed = processed.replace(/下半身NSFW_背面:/g, "\u4E0B\u534A\u8EABNSFW\u80CC\u9762:");
  processed = processed.replace(/上半身NSFW_背面:/g, "\u4E0A\u534A\u8EABNSFW\u80CC\u9762:");
  return processed;
}

function parseCharacterData(content) {
  const lines = content.split("\n").map((line) => line.trim()).filter((line) => line);
  const data = {
    nameCN: "",
    nameEN: "",
    characterTraits: "",
    facialFeatures: "",
    facialFeaturesBack: "",
    upperBodySFW: "",
    upperBodySFWBack: "",
    fullBodySFW: "",
    fullBodySFWBack: "",
    upperBodyNSFW: "",
    upperBodyNSFWBack: "",
    fullBodyNSFW: "",
    fullBodyNSFWBack: ""
  };
  const fieldMap = {
    "\u4E2D\u6587\u540D\u79F0": "nameCN",
    "\u82F1\u6587\u540D\u79F0": "nameEN",
    "\u89D2\u8272\u7279\u5F81": "characterTraits",
    "\u4E94\u5B98\u5916\u8C8C": "facialFeatures",
    "\u4E94\u5B98\u5916\u8C8C\u80CC\u9762": "facialFeaturesBack",
    "\u4E0A\u534A\u8EABSFW": "upperBodySFW",
    "\u4E0A\u534A\u8EABSFW\u80CC\u9762": "upperBodySFWBack",
    "\u4E0B\u534A\u8EABSFW": "fullBodySFW",
    "\u4E0B\u534A\u8EABSFW\u80CC\u9762": "fullBodySFWBack",
    "\u4E0A\u534A\u8EABNSFW": "upperBodyNSFW",
    "\u4E0A\u534A\u8EABNSFW\u80CC\u9762": "upperBodyNSFWBack",
    "\u4E0B\u534A\u8EABNSFW": "fullBodyNSFW",
    "\u4E0B\u534A\u8EABNSFW\u80CC\u9762": "fullBodyNSFWBack"
  };
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    if (fieldMap[key]) {
      data[fieldMap[key]] = value;
    } else if (key && value) {
      console.log(`[characterPromptModify] \u672A\u8BC6\u522B\u7684\u4EBA\u7269\u5B57\u6BB5 "${key}"`);
    }
  }
  if (!data.nameCN) {
    return null;
  }
  console.log("[characterPromptModify] \u89E3\u6790\u5230\u7684\u4EBA\u7269\u6570\u636E:", data);
  return data;
}

function parseOutfitData2(content) {
  const lines = content.split("\n").map((line) => line.trim()).filter((line) => line);
  const data = {
    nameCN: "",
    nameEN: "",
    owner: "",
    // 归属人（英文名称）
    upperBody: "",
    upperBodyBack: "",
    fullBody: "",
    fullBodyBack: ""
  };
  const fieldMap = {
    "\u5F52\u5C5E\u4EBA": "owner",
    "\u4E2D\u6587\u540D\u79F0": "nameCN",
    "\u82F1\u6587\u540D\u79F0": "nameEN",
    "\u4E0A\u534A\u8EAB": "upperBody",
    "\u4E0A\u534A\u8EAB\u80CC\u9762": "upperBodyBack",
    "\u4E0B\u534A\u8EAB": "fullBody",
    "\u4E0B\u534A\u8EAB\u80CC\u9762": "fullBodyBack"
  };
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    if (fieldMap[key]) {
      data[fieldMap[key]] = value;
    } else if (key && value) {
      console.log(`[characterPromptModify] \u672A\u8BC6\u522B\u7684\u670D\u88C5\u5B57\u6BB5 "${key}"`);
    }
  }
  if (!data.nameCN) {
    return null;
  }
  console.log("[characterPromptModify] \u89E3\u6790\u5230\u7684\u670D\u88C5\u6570\u636E:", data);
  return data;
}

function extractCharacterAndOutfitTags(message) {
  const items = [];
  message = message.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  const combinedRegex = /<(人物|服装)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = combinedRegex.exec(message)) !== null) {
    const type = match[1];
    const content = preprocessTagContent2(match[2]);
    const position = match.index;
    if (type === "\u4EBA\u7269") {
      const parsed = parseCharacterData(content);
      if (parsed) {
        items.push({ type: "character", data: parsed, position, matchedOutfits: [] });
      }
    } else if (type === "\u670D\u88C5") {
      const parsed = parseOutfitData2(content);
      if (parsed) {
        items.push({ type: "outfit", data: parsed, position });
      }
    }
  }
  items.sort((a, b) => a.position - b.position);
  let currentCharacter = null;
  const characters = [];
  const orphanOutfits = [];
  for (const item of items) {
    if (item.type === "character") {
      currentCharacter = item;
      characters.push(item);
    } else if (item.type === "outfit") {
      if (currentCharacter) {
        currentCharacter.matchedOutfits.push(item.data);
      } else {
        orphanOutfits.push(item.data);
      }
    }
  }
  return {
    characters: characters.map((c) => ({ ...c.data, matchedOutfits: c.matchedOutfits })),
    outfits: orphanOutfits
  };
}

function getCurrentCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterPresetId;
  if (!presetId || !settings3.characterPresets[presetId]) {
    return null;
  }
  return {
    id: presetId,
    data: settings3.characterPresets[presetId]
  };
}

function buildCharacterText(preset) {
  const data = preset.data;
  let text = "<\u4EBA\u7269>\n";
  text += `\u4E2D\u6587\u540D\u79F0: ${data.nameCN || ""}
`;
  text += `\u82F1\u6587\u540D\u79F0: ${data.nameEN || ""}
`;
  text += `\u89D2\u8272\u7279\u5F81: ${data.characterTraits || ""}
`;
  text += `\u4E94\u5B98\u5916\u8C8C: ${data.facialFeatures || ""}
`;
  text += `\u4E94\u5B98\u5916\u8C8C\u80CC\u9762: ${data.facialFeaturesBack || ""}
`;
  text += `\u4E0A\u534A\u8EABSFW: ${data.upperBodySFW || ""}
`;
  text += `\u4E0A\u534A\u8EABSFW\u80CC\u9762: ${data.upperBodySFWBack || ""}
`;
  text += `\u4E0B\u534A\u8EABSFW: ${data.fullBodySFW || ""}
`;
  text += `\u4E0B\u534A\u8EABSFW\u80CC\u9762: ${data.fullBodySFWBack || ""}
`;
  text += `\u4E0A\u534A\u8EABNSFW: ${data.upperBodyNSFW || ""}
`;
  text += `\u4E0A\u534A\u8EABNSFW\u80CC\u9762: ${data.upperBodyNSFWBack || ""}
`;
  text += `\u4E0B\u534A\u8EABNSFW: ${data.fullBodyNSFW || ""}
`;
  text += `\u4E0B\u534A\u8EABNSFW\u80CC\u9762: ${data.fullBodyNSFWBack || ""}
`;
  text += "</\u4EBA\u7269>";
  return text;
}

async function handleCharacterPromptModify(userRequirement, userImages = []) {
  console.log("[characterPromptModify] Starting character prompt modify request...");
  toastr.info("[characterPromptModify] \u6B63\u5728\u5904\u7406\u89D2\u8272\u63D0\u793A\u8BCD\u4FEE\u6539\u8BF7\u6C42...");
  try {
    const context = getContext();
    const settings3 = extension_settings[extensionName];
    const currentPreset = getCurrentCharacterPreset();
    if (!currentPreset) {
      toastr.error("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u89D2\u8272\u9884\u8BBE");
      return;
    }
    console.log("[characterPromptModify] Current preset:", currentPreset.id);
    const savedContext = currentPreset.data.generationContext || "";
    const savedWorldBook = currentPreset.data.generationWorldBook || "";
    const savedVariables = currentPreset.data.generationVariables || {};
    console.log("[characterPromptModify] Saved context:", savedContext);
    console.log("[characterPromptModify] Saved world book:", savedWorldBook);
    console.log("[characterPromptModify] Saved variables:", savedVariables);
    const entryTriggerText = userRequirement || "";
    const characterTriggerTextParts = [];
    if (userRequirement) {
      characterTriggerTextParts.push(userRequirement);
    }
    if (savedContext) {
      characterTriggerTextParts.push(savedContext);
    }
    if (savedWorldBook) {
      characterTriggerTextParts.push(savedWorldBook);
    }
    const characterTriggerText = characterTriggerTextParts.join("\n");
    console.log("[characterPromptModify] Character trigger text:", characterTriggerText);
    let prompt2 = buildPromptForRequestType("char_modify", entryTriggerText);
    if (!prompt2 || prompt2.length === 0) {
      throw new Error('\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"\u89D2\u8272/\u670D\u88C5\u4FEE\u6539"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E');
    }
    const characterListText = generateCharacterListText(characterTriggerText);
    const outfitEnableListText = generateOutfitEnableListText();
    const commonCharacterListText = generateCommonCharacterListText();
    console.log("[characterPromptModify] Character list text (triggered):", characterListText);
    const currentVariables = context.chatMetadata?.variables || {};
    const currentCharacterText = buildCharacterText(currentPreset);
    prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("char_modify"));
    console.log("[characterPromptModify] \u5408\u5E76\u76F8\u90BB\u6D88\u606F\u540E:", prompt2);
    const userRequirementMessageIndex = findMessageIndexWithPlaceholder3(prompt2, "{{\u7528\u6237\u9700\u6C42}}");
    console.log("[characterPromptModify] User requirement message index:", userRequirementMessageIndex);
    const contextData = {
      context: savedContext,
      worldBookContent: savedWorldBook,
      variables: { ...savedVariables, ...currentVariables },
      userDemand: userRequirement || "",
      characterListText,
      outfitEnableListText,
      commonCharacterListText
    };
    const { messages: processedMessages, replacedVariables } = await replaceAllPlaceholders(prompt2, contextData);
    prompt2 = processedMessages;
    prompt2 = replacePlaceholder(prompt2, "{{\u5F53\u524D\u89D2\u8272}}", currentCharacterText, replacedVariables);
    console.log("[characterPromptModify] Final prompt:", prompt2);
    let diagnosticText = "";
    if (replacedVariables.size > 0) {
      diagnosticText = `\u8BCA\u65AD\uFF1A\u68C0\u6D4B\u5230\u4EE5\u4E0B\u53D8\u91CF\u88AB\u4F7F\u7528\uFF1A${[...replacedVariables].join("\u3001")}
`;
    }
    if (userImages && userImages.length > 0 && userRequirementMessageIndex >= 0) {
      prompt2 = attachImagesToMessage3(prompt2, userRequirementMessageIndex, userImages, "\u53C2\u8003\u56FE\u7247");
      console.log("[characterPromptModify] Attached", userImages.length, "images to message at index", userRequirementMessageIndex);
    }
    updateCombinedPrompt(prompt2, diagnosticText);
    const llmOutput = await LLM_CHAR_MODIFY(prompt2, { timeoutMs: 6e5 });
    console.log("[characterPromptModify] LLM output:", llmOutput);
    if (!llmOutput) {
      toastr.error("LLM \u8FD4\u56DE\u7ED3\u679C\u4E3A\u7A7A");
      return;
    }
    const extracted = extractCharacterAndOutfitTags(llmOutput);
    if (extracted.characters.length === 0 && extracted.outfits.length === 0) {
      toastr.warning("\u672A\u5728 LLM \u8F93\u51FA\u4E2D\u68C0\u6D4B\u5230\u89D2\u8272\u6216\u670D\u88C5\u6807\u7B7E");
      console.log("[characterPromptModify] No character/outfit tags found in output");
      console.log("[characterPromptModify] Raw LLM output for debugging:", llmOutput);
      return;
    }
    console.log("[characterPromptModify] Extracted data:", extracted);
    if (extracted.characters.length > 0) {
      const newCharData = extracted.characters[0];
      await updateCharacterPresetFromLLM(currentPreset.id, newCharData);
    }
    const allOutfits = [...extracted.outfits];
    for (const char of extracted.characters) {
      if (char.matchedOutfits && char.matchedOutfits.length > 0) {
        allOutfits.push(...char.matchedOutfits);
      }
    }
    if (allOutfits.length > 0) {
      await updateOutfitPresetsFromLLM(allOutfits);
    }
    toastr.success("\u89D2\u8272/\u670D\u88C5\u63D0\u793A\u8BCD\u4FEE\u6539\u5B8C\u6210\uFF01");
  } catch (error) {
    console.error("[characterPromptModify] Error:", error);
    toastr.error(`\u89D2\u8272\u63D0\u793A\u8BCD\u4FEE\u6539\u5931\u8D25: ${error.message}`);
  }
}

async function updateCharacterPresetFromLLM(presetId, newData) {
  const settings3 = extension_settings[extensionName];
  const preset = settings3.characterPresets[presetId];
  if (!preset) {
    toastr.error("\u627E\u4E0D\u5230\u6307\u5B9A\u7684\u89D2\u8272\u9884\u8BBE");
    return;
  }
  const fieldLabels = {
    "nameCN": "\u4E2D\u6587\u540D\u79F0",
    "nameEN": "\u82F1\u6587\u540D\u79F0",
    "characterTraits": "\u89D2\u8272\u7279\u5F81",
    "facialFeatures": "\u4E94\u5B98\u5916\u8C8C",
    "facialFeaturesBack": "\u4E94\u5B98\u5916\u8C8C\u80CC\u9762",
    "upperBodySFW": "\u4E0A\u534A\u8EABSFW",
    "upperBodySFWBack": "\u4E0A\u534A\u8EABSFW\u80CC\u9762",
    "fullBodySFW": "\u4E0B\u534A\u8EABSFW",
    "fullBodySFWBack": "\u4E0B\u534A\u8EABSFW\u80CC\u9762",
    "upperBodyNSFW": "\u4E0A\u534A\u8EABNSFW",
    "upperBodyNSFWBack": "\u4E0A\u534A\u8EABNSFW\u80CC\u9762",
    "fullBodyNSFW": "\u4E0B\u534A\u8EABNSFW",
    "fullBodyNSFWBack": "\u4E0B\u534A\u8EABNSFW\u80CC\u9762"
  };
  let changesCount = 0;
  for (const field in fieldLabels) {
    if (newData[field] && newData[field] !== preset[field]) {
      changesCount++;
    }
  }
  if (changesCount === 0) {
    toastr.info("\u6CA1\u6709\u68C0\u6D4B\u5230\u9700\u8981\u66F4\u65B0\u7684\u5185\u5BB9");
    return;
  }
  const message = `\u68C0\u6D4B\u5230\u89D2\u8272 "${presetId}" \u6709 ${changesCount} \u9879\u66F4\u6539,\u662F\u5426\u5E94\u7528?`;
  const confirmed = await stylishConfirm(message);
  if (!confirmed) {
    toastr.info("\u5DF2\u53D6\u6D88\u66F4\u65B0");
    return;
  }
  for (const field in fieldLabels) {
    if (newData[field]) {
      preset[field] = newData[field];
    }
  }
  saveSettingsDebounced();
  const characterTab = $("#st-chatu8-tab-character");
  if (characterTab.length) {
    refreshCharacterSettings(characterTab);
  }
  updateFormFields(newData);
  console.log(`[characterPromptModify] \u5DF2\u66F4\u65B0\u89D2\u8272\u9884\u8BBE "${presetId}"`);
}

async function updateOutfitPresetsFromLLM(outfitsData) {
  const settings3 = extension_settings[extensionName];
  const stContext = getContext();
  const cardPrefix = stContext?.name2 ? `[${stContext.name2}]` : "";
  const outfitFieldLabels = {
    "nameCN": "\u4E2D\u6587\u540D\u79F0",
    "nameEN": "\u82F1\u6587\u540D\u79F0",
    "owner": "\u5F52\u5C5E\u4EBA",
    "upperBody": "\u4E0A\u534A\u8EAB",
    "upperBodyBack": "\u4E0A\u534A\u8EAB\u80CC\u9762",
    "fullBody": "\u4E0B\u534A\u8EAB",
    "fullBodyBack": "\u4E0B\u534A\u8EAB\u80CC\u9762"
  };
  for (const outfitData of outfitsData) {
    const rawOutfitName = outfitData.nameCN;
    if (!rawOutfitName) continue;
    const outfitName = cardPrefix ? `${cardPrefix}${rawOutfitName}` : rawOutfitName;
    const existingOutfit = settings3.outfitPresets?.[outfitName];
    if (existingOutfit) {
      let changesCount = 0;
      for (const field in outfitFieldLabels) {
        if (outfitData[field] && outfitData[field] !== existingOutfit[field]) {
          changesCount++;
        }
      }
      if (changesCount === 0) {
        console.log(`[characterPromptModify] \u670D\u88C5 "${outfitName}" \u6CA1\u6709\u53D8\u66F4`);
        continue;
      }
      const message = `\u68C0\u6D4B\u5230\u670D\u88C5 "${outfitName}" \u6709 ${changesCount} \u9879\u66F4\u6539,\u662F\u5426\u5E94\u7528?`;
      const confirmed = await stylishConfirm(message);
      if (!confirmed) {
        continue;
      }
      for (const field in outfitFieldLabels) {
        if (outfitData[field]) {
          existingOutfit[field] = outfitData[field];
        }
      }
      console.log(`[characterPromptModify] \u5DF2\u66F4\u65B0\u670D\u88C5\u9884\u8BBE "${outfitName}"`);
    } else {
      const message = `\u68C0\u6D4B\u5230\u65B0\u670D\u88C5 "${outfitName}",\u662F\u5426\u5F55\u5165?`;
      const confirmed = await stylishConfirm(message);
      if (!confirmed) {
        continue;
      }
      if (!settings3.outfitPresets) {
        settings3.outfitPresets = {};
      }
      settings3.outfitPresets[outfitName] = {
        nameCN: outfitData.nameCN,
        nameEN: outfitData.nameEN || "",
        owner: outfitData.owner || "",
        upperBody: outfitData.upperBody || "",
        upperBodyBack: outfitData.upperBodyBack || "",
        fullBody: outfitData.fullBody || "",
        fullBodyBack: outfitData.fullBodyBack || ""
      };
      console.log(`[characterPromptModify] \u5DF2\u521B\u5EFA\u670D\u88C5\u9884\u8BBE "${outfitName}"`);
      if (outfitData.owner && outfitData.owner.trim()) {
        const normalizedOwner = outfitData.owner.trim().toLowerCase().replace(/\s+/g, "");
        let matchCount = 0;
        for (const [charName, charPreset] of Object.entries(settings3.characterPresets || {})) {
          if (charPreset.nameEN && charPreset.nameEN.toLowerCase().replace(/\s+/g, "") === normalizedOwner) {
            if (!charPreset.outfits) {
              charPreset.outfits = [];
            }
            if (!charPreset.outfits.includes(outfitName)) {
              charPreset.outfits.push(outfitName);
              matchCount++;
              console.log(`[characterPromptModify] \u670D\u88C5 "${outfitName}" \u5DF2\u5F52\u5C5E\u5230\u89D2\u8272 "${charName}"`);
            }
          }
        }
        if (matchCount === 0) {
          console.warn(`[characterPromptModify] \u65E0\u6CD5\u627E\u5230\u5F52\u5C5E\u4EBA "${outfitData.owner}" \u5BF9\u5E94\u7684\u89D2\u8272,\u670D\u88C5 "${outfitName}" \u672A\u5F52\u5C5E`);
        } else if (matchCount > 1) {
          console.log(`[characterPromptModify] \u670D\u88C5 "${outfitName}" \u5DF2\u5F52\u5C5E\u5230 ${matchCount} \u4E2A\u540C\u540D\u89D2\u8272`);
        }
      }
    }
  }
  saveSettingsDebounced();
  const characterTab = $("#st-chatu8-tab-character");
  if (characterTab.length) {
    refreshCharacterSettings(characterTab);
  }
}

function updateFormFields(data) {
  const fields = ["nameCN", "nameEN", "characterTraits", "facialFeatures", "facialFeaturesBack", "upperBodySFW", "upperBodySFWBack", "fullBodySFW", "fullBodySFWBack", "upperBodyNSFW", "upperBodyNSFWBack", "fullBodyNSFW", "fullBodyNSFWBack"];
  fields.forEach((field) => {
    if (data[field]) {
      const element = document.getElementById(`char_${field}`);
      if (element) {
        element.value = data[field];
        $(element).trigger("input");
      }
    }
  });
}

export { handleCharacterPromptModify };
