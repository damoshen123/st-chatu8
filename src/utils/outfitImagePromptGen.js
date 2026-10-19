// 还原自打包产物 — 原始模块: utils/outfitImagePromptGen.js
import { eventSource, saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { eventNames, extensionName } from "./config.js";
import { processVariablePlaceholdersInMessages } from "./promptProcessor.js";
import { buildPromptForRequestType } from "./settings/llmService.js";
import { updateCombinedPrompt } from "./settings/llmUi.js";
import "./settings/llm.js"; // init_llm
import "./ui_common.js"; // init_ui_common

function generateRequestId2() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function LLM_OUTFIT_DISPLAY(prompt2, options = {}) {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId2();
    const timeoutMs = options.timeoutMs || 18e4;
    console.log(`[outfitImagePromptGen] \u6267\u884C\u670D\u88C5\u5C55\u793A LLM \u8BF7\u6C42 (ID: ${requestId})`);
    const handler = (responseData) => {
      if (responseData.id !== requestId) return;
      eventSource.removeListener(eventNames.LLM_CHAR_DISPLAY_RESPONSE, handler);
      if (responseData.success) {
        resolve(responseData.result);
      } else {
        reject(new Error(responseData.result || "LLM \u8BF7\u6C42\u5931\u8D25"));
      }
    };
    eventSource.on(eventNames.LLM_CHAR_DISPLAY_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_CHAR_DISPLAY_REQUEST, { prompt: prompt2, id: requestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_CHAR_DISPLAY_RESPONSE, handler);
      reject(new Error("\u670D\u88C5\u5C55\u793A LLM \u8BF7\u6C42\u8D85\u65F6"));
    }, timeoutMs);
  });
}

function replacePlaceholder2(obj, placeholder, value, replacedSet) {
  if (typeof obj === "string") {
    if (value && obj.includes(placeholder)) {
      if (replacedSet) {
        replacedSet.add(placeholder);
      }
    }
    return obj.replaceAll(placeholder, value);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replacePlaceholder2(item, placeholder, value, replacedSet));
  }
  if (obj && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = replacePlaceholder2(obj[key], placeholder, value, replacedSet);
    }
    return newObj;
  }
  return obj;
}

function getCurrentOutfitPreset() {
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

function buildOutfitText(preset) {
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

function getImageTags2() {
  const settings3 = extension_settings[extensionName];
  const startTag = settings3?.startTag || "image###";
  const endTag = settings3?.endTag || "###";
  return { startTag, endTag };
}

function extractImagePrompt(text) {
  if (!text || typeof text !== "string") {
    return "";
  }
  const { startTag, endTag } = getImageTags2();
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  const imagesBlockRegex = /<images>([\s\S]*?)<\/images>/i;
  const imagesBlockMatch = text.match(imagesBlockRegex);
  if (imagesBlockMatch && imagesBlockMatch[1]) {
    const imagesContent = imagesBlockMatch[1];
    console.log("[outfitImagePromptGen] Found <images> block:", imagesContent.substring(0, 100) + "...");
    const imageTagRegex = /<image>([\s\S]*?)<\/image>/gi;
    const allImageMatches = [...imagesContent.matchAll(imageTagRegex)];
    if (allImageMatches.length > 0) {
      const lastImageContent = allImageMatches[allImageMatches.length - 1][1];
      console.log("[outfitImagePromptGen] Using last <image> tag (index " + (allImageMatches.length - 1) + ")");
      const escapedStart2 = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedEnd2 = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const innerPromptRegex = new RegExp(`${escapedStart2}([\\s\\S]*?)${escapedEnd2}`, "g");
      const innerMatches = [...lastImageContent.matchAll(innerPromptRegex)];
      if (innerMatches && innerMatches.length > 0) {
        const prompt2 = innerMatches[innerMatches.length - 1][1].trim();
        if (prompt2) {
          console.log(`[outfitImagePromptGen] Extracted ${startTag}...${endTag} from last <image> (last match):`, prompt2.substring(0, 50) + "...");
          return prompt2;
        }
      }
      const fallbackPrompt = lastImageContent.trim();
      if (fallbackPrompt) {
        console.log("[outfitImagePromptGen] Using last <image> content directly:", fallbackPrompt.substring(0, 50) + "...");
        return fallbackPrompt;
      }
    }
    const trimmedContent = imagesContent.trim();
    if (trimmedContent) {
      console.log("[outfitImagePromptGen] No <image> tags found, using <images> block content directly");
      return trimmedContent;
    }
  }
  const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const legacyRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`, "g");
  const legacyMatches = [...text.matchAll(legacyRegex)];
  if (legacyMatches && legacyMatches.length > 0) {
    console.log(`[outfitImagePromptGen] Using legacy ${startTag}...${endTag} format (last match)`);
    return legacyMatches[legacyMatches.length - 1][1].trim();
  }
  return "";
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function attachImagesToMessage(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
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

function findMessageIndexWithPlaceholder(messages, placeholder) {
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

function showUserRequirementPopup() {
  return new Promise((resolve) => {
    const uploadedImages = [];
    const parent = document.getElementById("st-chatu8-settings") || document.body;
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-confirm-backdrop";
    const modal = document.createElement("div");
    modal.className = "st-chatu8-confirm-box st-chatu8-popup-modal";
    const title = document.createElement("h3");
    title.className = "st-chatu8-popup-title";
    title.textContent = "\u751F\u6210\u670D\u88C5\u56FE\u7247\u63D0\u793A\u8BCD";
    modal.appendChild(title);
    const description = document.createElement("p");
    description.className = "st-chatu8-popup-description";
    description.textContent = "\u8BF7\u8F93\u5165\u60A8\u7684\u5177\u4F53\u9700\u6C42\uFF0CAI \u5C06\u6839\u636E\u670D\u88C5\u4FE1\u606F\u751F\u6210\u56FE\u7247\u63D0\u793A\u8BCD\uFF1A";
    modal.appendChild(description);
    const textarea = document.createElement("textarea");
    textarea.className = "st-chatu8-textarea";
    textarea.rows = 4;
    textarea.placeholder = "\u4F8B\u5982\uFF1A\u5C55\u793A\u670D\u88C5\u5168\u8C8C\u3001\u7279\u5199\u7EC6\u8282\u3001\u6A21\u7279\u7A7F\u7740\u6548\u679C...";
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
          const base64 = await readFileAsBase64(file);
          uploadedImages.push({
            base64,
            name: ""
          });
        } catch (err) {
          console.error("[outfitImagePromptGen] Failed to read image:", err);
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

function showResultConfirmPopup(generatedPrompt) {
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
    description.textContent = "\u4EE5\u4E0B\u662F\u751F\u6210\u7684\u56FE\u7247\u63D0\u793A\u8BCD\uFF0C\u786E\u8BA4\u540E\u5C06\u4FDD\u5B58\u5230\u670D\u88C5\u9884\u8BBE\u4E2D\uFF1A";
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

async function handleOutfitImagePromptGenerate(userRequirement, userImages = []) {
  console.log("[outfitImagePromptGen] Starting outfit image prompt generation...");
  toastr.info("\u6B63\u5728\u751F\u6210\u670D\u88C5\u56FE\u7247\u63D0\u793A\u8BCD...");
  try {
    const settings3 = extension_settings[extensionName];
    const currentPreset = getCurrentOutfitPreset();
    if (!currentPreset) {
      toastr.error("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u670D\u88C5\u9884\u8BBE");
      return;
    }
    console.log("[outfitImagePromptGen] Current preset:", currentPreset.id);
    const currentOutfitText = buildOutfitText(currentPreset);
    const triggerText = [userRequirement || "", currentOutfitText].filter(Boolean).join("\n");
    let prompt2 = buildPromptForRequestType("char_display", triggerText);
    if (!prompt2 || prompt2.length === 0) {
      throw new Error('\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"\u89D2\u8272/\u670D\u88C5\u5C55\u793A"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E');
    }
    const replacedVariables = /* @__PURE__ */ new Set();
    const userRequirementMessageIndex = findMessageIndexWithPlaceholder(prompt2, "{{\u7528\u6237\u9700\u6C42}}");
    console.log("[outfitImagePromptGen] User requirement message index:", userRequirementMessageIndex);
    prompt2 = replacePlaceholder2(prompt2, "{{\u5F53\u524D\u670D\u88C5}}", currentOutfitText, replacedVariables);
    prompt2 = replacePlaceholder2(prompt2, "{{\u670D\u88C5\u5217\u8868}}", currentOutfitText, replacedVariables);
    prompt2 = replacePlaceholder2(prompt2, "{{\u7528\u6237\u9700\u6C42}}", userRequirement || "", replacedVariables);
    prompt2 = replacePlaceholder2(prompt2, "{{\u5F53\u524D\u89D2\u8272}}", "", replacedVariables);
    prompt2 = replacePlaceholder2(prompt2, "{{\u4E0A\u4E0B\u6587}}", "", replacedVariables);
    prompt2 = replacePlaceholder2(prompt2, "{{\u4E16\u754C\u4E66\u89E6\u53D1}}", "", replacedVariables);
    prompt2 = replacePlaceholder2(prompt2, "{{\u89D2\u8272\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = replacePlaceholder2(prompt2, "{{\u901A\u7528\u670D\u88C5\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = replacePlaceholder2(prompt2, "{{\u901A\u7528\u89D2\u8272\u542F\u7528\u5217\u8868}}", "", replacedVariables);
    prompt2 = processVariablePlaceholdersInMessages(prompt2, replacedVariables);
    console.log("[outfitImagePromptGen] Final prompt:", prompt2);
    let diagnosticText = "";
    if (replacedVariables.size > 0) {
      diagnosticText = `\u8BCA\u65AD\uFF1A\u68C0\u6D4B\u5230\u4EE5\u4E0B\u53D8\u91CF\u88AB\u4F7F\u7528\uFF1A${[...replacedVariables].join("\u3001")}
`;
    }
    if (userImages && userImages.length > 0 && userRequirementMessageIndex >= 0) {
      prompt2 = attachImagesToMessage(prompt2, userRequirementMessageIndex, userImages, "\u53C2\u8003\u56FE\u7247");
      console.log("[outfitImagePromptGen] Attached", userImages.length, "images to message at index", userRequirementMessageIndex);
    }
    updateCombinedPrompt(prompt2, diagnosticText);
    const llmOutput = await LLM_OUTFIT_DISPLAY(prompt2, { timeoutMs: 6e5 });
    console.log("[outfitImagePromptGen] LLM output:", llmOutput);
    if (!llmOutput) {
      toastr.error("LLM \u8FD4\u56DE\u7ED3\u679C\u4E3A\u7A7A");
      return;
    }
    const extractedPrompt = extractImagePrompt(llmOutput);
    if (!extractedPrompt) {
      const { startTag, endTag } = getImageTags2();
      toastr.warning(`\u672A\u5728 LLM \u8F93\u51FA\u4E2D\u68C0\u6D4B\u5230 ${startTag}...${endTag} \u683C\u5F0F\u7684\u63D0\u793A\u8BCD`);
      console.log("[outfitImagePromptGen] Raw LLM output for debugging:", llmOutput);
      return;
    }
    console.log("[outfitImagePromptGen] Extracted prompt:", extractedPrompt);
    const result = await showResultConfirmPopup(extractedPrompt);
    if (!result.confirmed) {
      toastr.info("\u5DF2\u53D6\u6D88\u4FDD\u5B58");
      return;
    }
    const preset = settings3.outfitPresets[currentPreset.id];
    if (preset) {
      preset.photoPrompt = result.prompt;
      saveSettingsDebounced();
      const photoPromptElement = document.getElementById("outfit_photo_prompt");
      if (photoPromptElement) {
        photoPromptElement.value = result.prompt;
      }
      toastr.success("\u670D\u88C5\u56FE\u7247\u63D0\u793A\u8BCD\u5DF2\u751F\u6210\u5E76\u4FDD\u5B58\uFF01");
    }
  } catch (error) {
    console.error("[outfitImagePromptGen] Error:", error);
    toastr.error(`\u670D\u88C5\u56FE\u7247\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25: ${error.message}`);
  }
}

async function handleOutfitPhotoGeneratePromptClick() {
  const popupResult = await showUserRequirementPopup();
  if (popupResult === null) {
    return;
  }
  await handleOutfitImagePromptGenerate(popupResult.text, popupResult.images);
}

export { handleOutfitPhotoGeneratePromptClick };
