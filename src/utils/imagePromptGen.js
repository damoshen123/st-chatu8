// 还原自打包产物 — 原始模块: utils/imagePromptGen.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../script.js";
import { eventNames, extensionName } from "./config.js";
import { mergeAdjacentMessages, processVariablePlaceholdersInMessages, replacePlaceholder } from "./promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "./settings/llmService.js";
import { updateCombinedPrompt } from "./settings/llmUi.js";
import "./settings/llm.js"; // init_llm
import "./ui_common.js"; // init_ui_common

function getImageTags3() {
  const settings3 = extension_settings[extensionName];
  const startTag = settings3?.startTag || "image###";
  const endTag = settings3?.endTag || "###";
  return { startTag, endTag };
}

function generateRequestId5() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function LLM_CHAR_DISPLAY(prompt2, options = {}) {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId5();
    const timeoutMs = options.timeoutMs || 18e4;
    let timeoutTimer = null;
    console.log(`[imagePromptGen] \u6267\u884C\u89D2\u8272/\u670D\u88C5\u5C55\u793A LLM \u8BF7\u6C42 (ID: ${requestId})`);
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_CHAR_DISPLAY_RESPONSE, handler);
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
    eventSource.on(eventNames.LLM_CHAR_DISPLAY_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_CHAR_DISPLAY_REQUEST, { prompt: prompt2, id: requestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error("\u89D2\u8272/\u670D\u88C5\u5C55\u793A LLM \u8BF7\u6C42\u8D85\u65F6"));
    }, timeoutMs);
  });
}

function getCurrentCharacterPreset2() {
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

function buildCharacterText2(preset) {
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

function buildOutfitsText(preset) {
  const settings3 = extension_settings[extensionName];
  const outfitNames = preset.data.outfits || [];
  if (outfitNames.length === 0) {
    return "<\u670D\u88C5\u5217\u8868>\n(\u65E0\u670D\u88C5)\n</\u670D\u88C5\u5217\u8868>";
  }
  let text = "<\u670D\u88C5\u5217\u8868>\n";
  for (const outfitName of outfitNames) {
    const outfitPreset = settings3.outfitPresets[outfitName];
    if (outfitPreset) {
      text += `<\u670D\u88C5>
`;
      text += `\u670D\u88C5\u540D\u79F0: ${outfitName}
`;
      text += `\u4E2D\u6587\u540D\u79F0: ${outfitPreset.nameCN || ""}
`;
      text += `\u82F1\u6587\u540D\u79F0: ${outfitPreset.nameEN || ""}
`;
      text += `\u4E0A\u534A\u8EAB: ${outfitPreset.upperBody || ""}
`;
      text += `\u4E0A\u534A\u8EAB\u80CC\u9762: ${outfitPreset.upperBodyBack || ""}
`;
      text += `\u4E0B\u534A\u8EAB: ${outfitPreset.fullBody || ""}
`;
      text += `\u4E0B\u534A\u8EAB\u80CC\u9762: ${outfitPreset.fullBodyBack || ""}
`;
      text += `</\u670D\u88C5>
`;
    } else {
      text += `<\u670D\u88C5>
`;
      text += `\u670D\u88C5\u540D\u79F0: ${outfitName}
`;
      text += `(\u627E\u4E0D\u5230\u8BE5\u670D\u88C5\u9884\u8BBE)
`;
      text += `</\u670D\u88C5>
`;
    }
  }
  text += "</\u670D\u88C5\u5217\u8868>";
  return text;
}

function extractImagePrompt2(text) {
  if (!text || typeof text !== "string") {
    return "";
  }
  const { startTag, endTag } = getImageTags3();
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  const imagesBlockRegex = /<images>([\s\S]*?)<\/images>/i;
  const imagesBlockMatch = text.match(imagesBlockRegex);
  if (imagesBlockMatch && imagesBlockMatch[1]) {
    const imagesContent = imagesBlockMatch[1];
    console.log("[imagePromptGen] Found <images> block:", imagesContent.substring(0, 100) + "...");
    const imageTagRegex = /<image>([\s\S]*?)<\/image>/gi;
    const allImageMatches = [...imagesContent.matchAll(imageTagRegex)];
    if (allImageMatches.length > 0) {
      const lastImageContent = allImageMatches[allImageMatches.length - 1][1];
      console.log("[imagePromptGen] Using last <image> tag (index " + (allImageMatches.length - 1) + ")");
      const escapedStart2 = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedEnd2 = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const innerPromptRegex = new RegExp(`${escapedStart2}([\\s\\S]*?)${escapedEnd2}`, "g");
      const innerMatches = [...lastImageContent.matchAll(innerPromptRegex)];
      if (innerMatches && innerMatches.length > 0) {
        const prompt2 = innerMatches[innerMatches.length - 1][1].trim();
        if (prompt2) {
          console.log(`[imagePromptGen] Extracted ${startTag}...${endTag} from last <image> (last match):`, prompt2.substring(0, 50) + "...");
          return prompt2;
        }
      }
      const fallbackPrompt = lastImageContent.trim();
      if (fallbackPrompt) {
        console.log("[imagePromptGen] Using last <image> content directly:", fallbackPrompt.substring(0, 50) + "...");
        return fallbackPrompt;
      }
    }
    const trimmedContent = imagesContent.trim();
    if (trimmedContent) {
      console.log("[imagePromptGen] No <image> tags found, using <images> block content directly");
      return trimmedContent;
    }
  }
  const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const legacyRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`, "g");
  const legacyMatches = [...text.matchAll(legacyRegex)];
  if (legacyMatches && legacyMatches.length > 0) {
    console.log(`[imagePromptGen] Using legacy ${startTag}...${endTag} format (last match)`);
    return legacyMatches[legacyMatches.length - 1][1].trim();
  }
  return "";
}

function readFileAsBase642(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function attachImagesToMessage4(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
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

function findMessageIndexWithPlaceholder4(messages, placeholder) {
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

function showUserRequirementPopup2() {
  return new Promise((resolve) => {
    const uploadedImages = [];
    const parent = document.getElementById("st-chatu8-settings") || document.body;
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-confirm-backdrop";
    const modal = document.createElement("div");
    modal.className = "st-chatu8-confirm-box st-chatu8-popup-modal";
    const title = document.createElement("h3");
    title.className = "st-chatu8-popup-title";
    title.textContent = "\u751F\u6210\u56FE\u7247\u63D0\u793A\u8BCD";
    modal.appendChild(title);
    const description = document.createElement("p");
    description.className = "st-chatu8-popup-description";
    description.textContent = "\u8BF7\u8F93\u5165\u60A8\u7684\u5177\u4F53\u9700\u6C42\uFF0CAI \u5C06\u6839\u636E\u89D2\u8272\u548C\u670D\u88C5\u4FE1\u606F\u751F\u6210\u56FE\u7247\u63D0\u793A\u8BCD\uFF1A";
    modal.appendChild(description);
    const textarea = document.createElement("textarea");
    textarea.className = "st-chatu8-textarea";
    textarea.rows = 4;
    textarea.placeholder = "\u4F8B\u5982\uFF1A\u89D2\u8272\u7AD9\u5728\u82B1\u56ED\u4E2D\u3001\u7A7F\u7740\u6821\u670D\u7684\u65E5\u5E38\u573A\u666F\u3001\u5149\u7EBF\u67D4\u548C\u7684\u5BA4\u5185...";
    modal.appendChild(textarea);
    const imageUploadSection = document.createElement("div");
    imageUploadSection.className = "st-chatu8-popup-upload-section";
    const uploadHeader = document.createElement("div");
    uploadHeader.className = "st-chatu8-popup-upload-header";
    const uploadLabel = document.createElement("span");
    uploadLabel.className = "st-chatu8-popup-upload-label";
    uploadLabel.textContent = "\u{1F4CE} \u53C2\u8003\u56FE\u7247\uFF08\u53EF\u9009\uFF09";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button";
    uploadBtn.innerHTML = '<i class="fa-solid fa-plus"></i> \u6DFB\u52A0\u56FE\u7247';
    uploadBtn.className = "st-chatu8-btn st-chatu8-popup-upload-btn";
    uploadBtn.addEventListener("click", () => fileInput.click());
    uploadHeader.appendChild(uploadLabel);
    uploadHeader.appendChild(uploadBtn);
    const imagePreviewContainer = document.createElement("div");
    imagePreviewContainer.className = "st-chatu8-popup-image-preview";
    const emptyHint = document.createElement("div");
    emptyHint.className = "st-chatu8-popup-empty-hint";
    emptyHint.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
    imagePreviewContainer.appendChild(emptyHint);
    function updateImagePreviews() {
      imagePreviewContainer.innerHTML = "";
      if (uploadedImages.length === 0) {
        const hint = document.createElement("div");
        hint.className = "st-chatu8-popup-empty-hint";
        hint.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
        imagePreviewContainer.appendChild(hint);
        return;
      }
      uploadedImages.forEach((imgObj, index) => {
        const itemContainer = document.createElement("div");
        itemContainer.className = "st-chatu8-popup-image-item";
        const imgWrapper = document.createElement("div");
        imgWrapper.className = "st-chatu8-popup-image-wrapper";
        const img = document.createElement("img");
        img.src = imgObj.base64;
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "st-chatu8-popup-image-delete";
        deleteBtn.innerHTML = "\xD7";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          uploadedImages.splice(index, 1);
          updateImagePreviews();
        });
        imgWrapper.addEventListener("mouseenter", () => {
          deleteBtn.style.opacity = "1";
        });
        imgWrapper.addEventListener("mouseleave", () => {
          deleteBtn.style.opacity = "0";
        });
        imgWrapper.appendChild(img);
        imgWrapper.appendChild(deleteBtn);
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "st-chatu8-popup-image-name";
        nameInput.placeholder = `\u56FE${index + 1}`;
        nameInput.value = imgObj.name || "";
        nameInput.addEventListener("input", (e) => {
          uploadedImages[index].name = e.target.value;
        });
        itemContainer.appendChild(imgWrapper);
        itemContainer.appendChild(nameInput);
        imagePreviewContainer.appendChild(itemContainer);
      });
      const countLabel = document.createElement("div");
      countLabel.className = "st-chatu8-popup-image-count";
      countLabel.textContent = `\u5DF2\u6DFB\u52A0 ${uploadedImages.length} \u5F20\u56FE\u7247`;
      imagePreviewContainer.appendChild(countLabel);
    }
    fileInput.addEventListener("change", async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const base64 = await readFileAsBase642(file);
          uploadedImages.push({
            base64,
            name: ""
          });
        } catch (err) {
          console.error("[imagePromptGen] Failed to read image:", err);
        }
      }
      updateImagePreviews();
      setTimeout(() => {
        if (fileInput) fileInput.value = "";
      }, 100);
    });
    imageUploadSection.appendChild(uploadHeader);
    imageUploadSection.appendChild(fileInput);
    imageUploadSection.appendChild(imagePreviewContainer);
    modal.appendChild(imageUploadSection);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "st-chatu8-confirm-buttons";
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "\u53D6\u6D88";
    cancelButton.className = "st-chatu8-btn";
    buttonContainer.appendChild(cancelButton);
    const confirmButton = document.createElement("button");
    confirmButton.innerHTML = '<i class="fa-solid fa-magic"></i> \u751F\u6210';
    confirmButton.className = "st-chatu8-btn st-chatu8-btn-primary";
    buttonContainer.appendChild(confirmButton);
    modal.appendChild(buttonContainer);
    backdrop.appendChild(modal);
    parent.appendChild(backdrop);
    setTimeout(() => textarea.focus(), 100);
    const closeModal = (result) => {
      if (fileInput) fileInput.remove();
      parent.removeChild(backdrop);
      resolve(result);
    };
    cancelButton.addEventListener("click", () => closeModal(null));
    confirmButton.addEventListener("click", () => {
      const userRequirement = textarea.value.trim();
      closeModal({
        text: userRequirement || "",
        images: [...uploadedImages]
      });
    });
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        closeModal(null);
        document.removeEventListener("keydown", handleKeydown);
      } else if (e.key === "Enter" && e.ctrlKey) {
        closeModal({
          text: textarea.value.trim() || "",
          images: [...uploadedImages]
        });
        document.removeEventListener("keydown", handleKeydown);
      }
    };
    document.addEventListener("keydown", handleKeydown);
  });
}

function showResultConfirmPopup2(generatedPrompt) {
  return new Promise((resolve) => {
    const parent = document.getElementById("st-chatu8-settings") || document.body;
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-confirm-backdrop";
    const modal = document.createElement("div");
    modal.className = "st-chatu8-confirm-box st-chatu8-popup-modal";
    const title = document.createElement("h3");
    title.className = "st-chatu8-popup-title";
    title.textContent = "\u751F\u6210\u7ED3\u679C";
    modal.appendChild(title);
    const description = document.createElement("p");
    description.className = "st-chatu8-popup-description";
    description.textContent = "\u4EE5\u4E0B\u662F\u751F\u6210\u7684\u56FE\u7247\u63D0\u793A\u8BCD\uFF0C\u786E\u8BA4\u540E\u5C06\u4FDD\u5B58\u5230\u89D2\u8272\u9884\u8BBE\u4E2D\uFF1A";
    modal.appendChild(description);
    const promptDisplay = document.createElement("textarea");
    promptDisplay.className = "st-chatu8-textarea";
    promptDisplay.value = generatedPrompt;
    promptDisplay.rows = 8;
    modal.appendChild(promptDisplay);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "st-chatu8-confirm-buttons";
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "\u53D6\u6D88";
    cancelButton.className = "st-chatu8-btn";
    buttonContainer.appendChild(cancelButton);
    const confirmButton = document.createElement("button");
    confirmButton.innerHTML = '<i class="fa-solid fa-check"></i> \u786E\u8BA4\u4FDD\u5B58';
    confirmButton.className = "st-chatu8-btn st-chatu8-btn-success";
    buttonContainer.appendChild(confirmButton);
    modal.appendChild(buttonContainer);
    backdrop.appendChild(modal);
    parent.appendChild(backdrop);
    const closeModal = (result, editedPrompt = null) => {
      parent.removeChild(backdrop);
      resolve({ confirmed: result, prompt: editedPrompt || generatedPrompt });
    };
    cancelButton.addEventListener("click", () => closeModal(false));
    confirmButton.addEventListener("click", () => {
      closeModal(true, promptDisplay.value.trim());
    });
  });
}

async function handleImagePromptGenerate(userRequirement, userImages = []) {
  console.log("[imagePromptGen] Starting image prompt generation...");
  toastr.info("\u6B63\u5728\u751F\u6210\u56FE\u7247\u63D0\u793A\u8BCD...");
  try {
    const settings3 = extension_settings[extensionName];
    const currentPreset = getCurrentCharacterPreset2();
    if (!currentPreset) {
      toastr.error("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u89D2\u8272\u9884\u8BBE");
      return;
    }
    console.log("[imagePromptGen] Current preset:", currentPreset.id);
    const currentCharacterText = buildCharacterText2(currentPreset);
    const currentOutfitsText = buildOutfitsText(currentPreset);
    const triggerText = [userRequirement || "", currentCharacterText, currentOutfitsText].filter(Boolean).join("\n");
    let prompt2 = buildPromptForRequestType("char_display", triggerText);
    if (!prompt2 || prompt2.length === 0) {
      throw new Error('\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"\u89D2\u8272/\u670D\u88C5\u5C55\u793A"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E');
    }
    const replacedVariables = /* @__PURE__ */ new Set();
    prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("char_display"));
    console.log("[imagePromptGen] \u5408\u5E76\u76F8\u90BB\u6D88\u606F\u540E:", prompt2);
    const userRequirementMessageIndex = findMessageIndexWithPlaceholder4(prompt2, "{{\u7528\u6237\u9700\u6C42}}");
    console.log("[imagePromptGen] User requirement message index:", userRequirementMessageIndex);
    prompt2 = replacePlaceholder(prompt2, "{{\u5F53\u524D\u89D2\u8272}}", currentCharacterText, replacedVariables);
    prompt2 = replacePlaceholder(prompt2, "{{\u670D\u88C5\u5217\u8868}}", currentOutfitsText, replacedVariables);
    prompt2 = replacePlaceholder(prompt2, "{{\u7528\u6237\u9700\u6C42}}", userRequirement || "", replacedVariables);
    prompt2 = replacePlaceholder(prompt2, "{{\u5F53\u524D\u670D\u88C5}}", "", replacedVariables);
    prompt2 = replacePlaceholder(prompt2, "{{\u4E0A\u4E0B\u6587}}", "", replacedVariables);
    prompt2 = replacePlaceholder(prompt2, "{{\u4E16\u754C\u4E66\u89E6\u53D1}}", "", replacedVariables);
    prompt2 = replacePlaceholder(prompt2, "{{\u89D2\u8272\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = replacePlaceholder(prompt2, "{{\u901A\u7528\u670D\u88C5\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = replacePlaceholder(prompt2, "{{\u901A\u7528\u89D2\u8272\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = processVariablePlaceholdersInMessages(prompt2, replacedVariables);
    console.log("[imagePromptGen] Final prompt:", prompt2);
    let diagnosticText = "";
    if (replacedVariables.size > 0) {
      diagnosticText = `\u8BCA\u65AD\uFF1A\u68C0\u6D4B\u5230\u4EE5\u4E0B\u53D8\u91CF\u88AB\u4F7F\u7528\uFF1A${[...replacedVariables].join("\u3001")}
`;
    }
    if (userImages && userImages.length > 0 && userRequirementMessageIndex >= 0) {
      prompt2 = attachImagesToMessage4(prompt2, userRequirementMessageIndex, userImages, "\u53C2\u8003\u56FE\u7247");
      console.log("[imagePromptGen] Attached", userImages.length, "images to message at index", userRequirementMessageIndex);
    }
    updateCombinedPrompt(prompt2, diagnosticText);
    const llmOutput = await LLM_CHAR_DISPLAY(prompt2, { timeoutMs: 6e5 });
    console.log("[imagePromptGen] LLM output:", llmOutput);
    if (!llmOutput) {
      toastr.error("LLM \u8FD4\u56DE\u7ED3\u679C\u4E3A\u7A7A");
      return;
    }
    const extractedPrompt = extractImagePrompt2(llmOutput);
    if (!extractedPrompt) {
      const { startTag, endTag } = getImageTags3();
      toastr.warning(`\u672A\u5728 LLM \u8F93\u51FA\u4E2D\u68C0\u6D4B\u5230 ${startTag}...${endTag} \u683C\u5F0F\u7684\u63D0\u793A\u8BCD`);
      console.log("[imagePromptGen] Raw LLM output for debugging:", llmOutput);
      return;
    }
    console.log("[imagePromptGen] Extracted prompt:", extractedPrompt);
    const result = await showResultConfirmPopup2(extractedPrompt);
    if (!result.confirmed) {
      toastr.info("\u5DF2\u53D6\u6D88\u4FDD\u5B58");
      return;
    }
    const preset = settings3.characterPresets[currentPreset.id];
    if (preset) {
      preset.photoPrompt = result.prompt;
      saveSettingsDebounced();
      const photoPromptElement = document.getElementById("char_photo_prompt");
      if (photoPromptElement) {
        photoPromptElement.value = result.prompt;
      }
      toastr.success("\u56FE\u7247\u63D0\u793A\u8BCD\u5DF2\u751F\u6210\u5E76\u4FDD\u5B58\uFF01");
    }
  } catch (error) {
    console.error("[imagePromptGen] Error:", error);
    toastr.error(`\u56FE\u7247\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25: ${error.message}`);
  }
}

async function handlePhotoGeneratePromptClick() {
  const popupResult = await showUserRequirementPopup2();
  if (popupResult === null) {
    return;
  }
  await handleImagePromptGenerate(popupResult.text, popupResult.images);
}

export { handlePhotoGeneratePromptClick };
