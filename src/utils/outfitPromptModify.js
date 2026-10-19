// 还原自打包产物 — 原始模块: utils/outfitPromptModify.js
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { eventNames, extensionName } from "./config.js";
import { stylishConfirm } from "./ui_common.js";
import { processVariablePlaceholdersInMessages } from "./promptProcessor.js";
import { buildPromptForRequestType } from "./settings/llmService.js";
import { updateCombinedPrompt } from "./settings/llmUi.js";
import { loadOutfitPreset } from "./settings/character/outfitPreset.js";
import "./settings/llm.js"; // init_llm
import "./settings/character/index.js"; // init_character

function replacePlaceholder3(obj, placeholder, value, replacedSet) {
  if (typeof obj === "string") {
    if (value && obj.includes(placeholder)) {
      if (replacedSet) {
        replacedSet.add(placeholder);
      }
    }
    return obj.replaceAll(placeholder, value);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replacePlaceholder3(item, placeholder, value, replacedSet));
  }
  if (obj && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = replacePlaceholder3(obj[key], placeholder, value, replacedSet);
    }
    return newObj;
  }
  return obj;
}

function attachImagesToMessage2(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
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

function findMessageIndexWithPlaceholder2(messages, placeholder) {
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

function generateRequestId3() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function LLM_OUTFIT_MODIFY(prompt2, options = {}) {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId3();
    const timeoutMs = options.timeoutMs || 6e4;
    console.log(`[outfitPromptModify] Executing outfit modify LLM request (ID: ${requestId})`);
    const handler = (responseData) => {
      if (responseData.id !== requestId) return;
      eventSource.removeListener(eventNames.LLM_CHAR_MODIFY_RESPONSE, handler);
      if (responseData.success) {
        resolve(responseData.result);
      } else {
        reject(new Error(responseData.result || "LLM \u8BF7\u6C42\u5931\u8D25"));
      }
    };
    eventSource.on(eventNames.LLM_CHAR_MODIFY_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_CHAR_MODIFY_REQUEST, { prompt: prompt2, id: requestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_CHAR_MODIFY_RESPONSE, handler);
      reject(new Error("\u670D\u88C5\u4FEE\u6539 LLM \u8BF7\u6C42\u8D85\u65F6"));
    }, timeoutMs);
  });
}

function preprocessTagContent(content) {
  let processed = content.replace(/:/g, ":").replace(/\(/g, "\uFF08").replace(/\)/g, "\uFF09").replace(/,/g, ",");
  return processed;
}

function parseOutfitData(content) {
  const lines = content.split("\n").map((line) => line.trim()).filter((line) => line);
  const data = {
    nameCN: "",
    nameEN: "",
    upperBody: "",
    upperBodyBack: "",
    fullBody: "",
    fullBodyBack: ""
  };
  const fieldMap = {
    "\u4E2D\u6587\u540D\u79F0": "nameCN",
    "\u82F1\u6587\u540D\u79F0": "nameEN",
    "\u4E0A\u534A\u8EAB": "upperBody",
    "\u4E0A\u534A\u8EAB\u80CC\u9762": "upperBodyBack",
    "\u4E0B\u534A\u8EAB": "fullBody",
    "\u4E0B\u534A\u8EAB\u670D\u88C5": "fullBody",
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
      console.log(`[outfitPromptModify] \u672A\u8BC6\u522B\u7684\u670D\u88C5\u5B57\u6BB5 "${key}"`);
    }
  }
  if (!data.nameCN) {
    return null;
  }
  console.log("[outfitPromptModify] \u89E3\u6790\u5230\u7684\u670D\u88C5\u6570\u636E:", data);
  return data;
}

function extractOutfitTags(message) {
  const result = {
    outfits: []
  };
  message = message.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  const outfitRegex = /<服装>([\s\S]*?)<\/服装>/g;
  let match;
  while ((match = outfitRegex.exec(message)) !== null) {
    const content = preprocessTagContent(match[1]);
    const parsed = parseOutfitData(content);
    if (parsed) {
      result.outfits.push(parsed);
    }
  }
  return result;
}

function getCurrentOutfitPreset2() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.outfitPresetId;
  if (!presetId || !settings3.outfitPresets[presetId]) {
    return null;
  }
  return {
    id: presetId,
    data: settings3.outfitPresets[presetId]
  };
}

function buildOutfitText2(preset) {
  const data = preset.data;
  let text = "<\u670D\u88C5>\n";
  text += `\u4E2D\u6587\u540D\u79F0: ${data.nameCN || ""}
`;
  text += `\u82F1\u6587\u540D\u79F0: ${data.nameEN || ""}
`;
  text += `\u4E0A\u534A\u8EAB: ${data.upperBody || ""}
`;
  text += `\u4E0A\u534A\u8EAB\u80CC\u9762: ${data.upperBodyBack || ""}
`;
  text += `\u4E0B\u534A\u8EAB: ${data.fullBody || ""}
`;
  text += `\u4E0B\u534A\u8EAB\u80CC\u9762: ${data.fullBodyBack || ""}
`;
  text += "</\u670D\u88C5>";
  return text;
}

async function handleOutfitPromptModify(userRequirement, userImages = []) {
  console.log("[outfitPromptModify] Starting outfit prompt modify request...");
  toastr.info("\u6B63\u5728\u5904\u7406\u670D\u88C5\u63D0\u793A\u8BCD\u4FEE\u6539\u8BF7\u6C42...");
  try {
    const settings3 = extension_settings[extensionName];
    const currentPreset = getCurrentOutfitPreset2();
    if (!currentPreset) {
      toastr.error("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u670D\u88C5\u9884\u8BBE");
      return;
    }
    console.log("[outfitPromptModify] Current preset:", currentPreset.id);
    const currentOutfitText = buildOutfitText2(currentPreset);
    const triggerText = [userRequirement || "", currentOutfitText].filter(Boolean).join("\n");
    let prompt2 = buildPromptForRequestType("char_modify", triggerText);
    if (!prompt2 || prompt2.length === 0) {
      throw new Error('\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"\u89D2\u8272/\u670D\u88C5\u4FEE\u6539"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E');
    }
    const replacedVariables = /* @__PURE__ */ new Set();
    const userRequirementMessageIndex = findMessageIndexWithPlaceholder2(prompt2, "{{\u7528\u6237\u9700\u6C42}}");
    console.log("[outfitPromptModify] User requirement message index:", userRequirementMessageIndex);
    prompt2 = replacePlaceholder3(prompt2, "{{\u5F53\u524D\u670D\u88C5}}", currentOutfitText, replacedVariables);
    prompt2 = replacePlaceholder3(prompt2, "{{\u670D\u88C5\u5217\u8868}}", currentOutfitText, replacedVariables);
    prompt2 = replacePlaceholder3(prompt2, "{{\u7528\u6237\u9700\u6C42}}", userRequirement || "", replacedVariables);
    prompt2 = replacePlaceholder3(prompt2, "{{\u5F53\u524D\u89D2\u8272}}", "", replacedVariables);
    prompt2 = replacePlaceholder3(prompt2, "{{\u4E0A\u4E0B\u6587}}", "", replacedVariables);
    prompt2 = replacePlaceholder3(prompt2, "{{\u4E16\u754C\u4E66\u89E6\u53D1}}", "", replacedVariables);
    prompt2 = replacePlaceholder3(prompt2, "{{\u89D2\u8272\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = replacePlaceholder3(prompt2, "{{\u901A\u7528\u670D\u88C5\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = replacePlaceholder3(prompt2, "{{\u901A\u7528\u89D2\u8272\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = processVariablePlaceholdersInMessages(prompt2, replacedVariables);
    console.log("[outfitPromptModify] Final prompt:", prompt2);
    let diagnosticText = "";
    if (replacedVariables.size > 0) {
      diagnosticText = `\u8BCA\u65AD\uFF1A\u68C0\u6D4B\u5230\u4EE5\u4E0B\u53D8\u91CF\u88AB\u4F7F\u7528\uFF1A${[...replacedVariables].join("\u3001")}
`;
    }
    if (userImages && userImages.length > 0 && userRequirementMessageIndex >= 0) {
      prompt2 = attachImagesToMessage2(prompt2, userRequirementMessageIndex, userImages, "\u53C2\u8003\u56FE\u7247");
      console.log("[outfitPromptModify] Attached", userImages.length, "images to message at index", userRequirementMessageIndex);
    }
    updateCombinedPrompt(prompt2, diagnosticText);
    const llmOutput = await LLM_OUTFIT_MODIFY(prompt2, { timeoutMs: 6e5 });
    console.log("[outfitPromptModify] LLM output:", llmOutput);
    if (!llmOutput) {
      toastr.error("LLM \u8FD4\u56DE\u7ED3\u679C\u4E3A\u7A7A");
      return;
    }
    const extracted = extractOutfitTags(llmOutput);
    if (extracted.outfits.length === 0) {
      toastr.warning("\u672A\u5728 LLM \u8F93\u51FA\u4E2D\u68C0\u6D4B\u5230\u670D\u88C5\u6807\u7B7E");
      console.log("[outfitPromptModify] Raw LLM output for debugging:", llmOutput);
      return;
    }
    console.log("[outfitPromptModify] Extracted data:", extracted);
    const newOutfitData = extracted.outfits[0];
    await updateOutfitPresetFromLLM(currentPreset.id, newOutfitData);
    toastr.success("\u670D\u88C5\u63D0\u793A\u8BCD\u4FEE\u6539\u5B8C\u6210\uFF01");
  } catch (error) {
    console.error("[outfitPromptModify] Error:", error);
    toastr.error(`\u670D\u88C5\u63D0\u793A\u8BCD\u4FEE\u6539\u5931\u8D25: ${error.message}`);
  }
}

async function updateOutfitPresetFromLLM(presetId, newData) {
  const settings3 = extension_settings[extensionName];
  const preset = settings3.outfitPresets[presetId];
  if (!preset) {
    toastr.error("\u627E\u4E0D\u5230\u6307\u5B9A\u7684\u670D\u88C5\u9884\u8BBE");
    return;
  }
  let message = `\u51C6\u5907\u66F4\u65B0\u670D\u88C5 "${presetId}" \u7684\u4EE5\u4E0B\u6570\u636E:

`;
  const fieldLabels = {
    "nameCN": "\u4E2D\u6587\u540D\u79F0",
    "nameEN": "\u82F1\u6587\u540D\u79F0",
    "upperBody": "\u4E0A\u534A\u8EAB",
    "upperBodyBack": "\u4E0A\u534A\u8EAB\u80CC\u9762",
    "fullBody": "\u4E0B\u534A\u8EAB",
    "fullBodyBack": "\u4E0B\u534A\u8EAB\u80CC\u9762"
  };
  let changesCount = 0;
  for (const field in fieldLabels) {
    if (newData[field] && newData[field] !== preset[field]) {
      const oldValue = preset[field] || "(\u7A7A)";
      const newValue = newData[field];
      message += `\u2022 ${fieldLabels[field]}:
`;
      message += `  \u65E7: ${oldValue.substring(0, 50)}${oldValue.length > 50 ? "..." : ""}
`;
      message += `  \u65B0: ${newValue.substring(0, 50)}${newValue.length > 50 ? "..." : ""}

`;
      changesCount++;
    }
  }
  if (changesCount === 0) {
    toastr.info("\u6CA1\u6709\u68C0\u6D4B\u5230\u9700\u8981\u66F4\u65B0\u7684\u5185\u5BB9");
    return;
  }
  message += `\u5171 ${changesCount} \u9879\u66F4\u6539,\u662F\u5426\u5E94\u7528?`;
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
  const outfitTab = $("#st-chatu8-tab-character");
  if (outfitTab.length) {
    loadOutfitPreset();
  }
  updateOutfitFormFields(newData);
  console.log(`[outfitPromptModify] \u5DF2\u66F4\u65B0\u670D\u88C5\u9884\u8BBE "${presetId}"`);
}

function updateOutfitFormFields(data) {
  const fields = ["nameCN", "nameEN", "upperBody", "upperBodyBack", "fullBody", "fullBodyBack"];
  fields.forEach((field) => {
    if (data[field]) {
      const element = document.getElementById(`outfit_${field}`);
      if (element) {
        element.value = data[field];
        $(element).trigger("input");
      }
    }
  });
}

export { handleOutfitPromptModify };
