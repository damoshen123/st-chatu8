// 还原自打包产物 — 原始模块: utils/tagModify.js
import { extension_settings } from "../../../../../extensions.js";
import { getContext } from "../../../../../st-context.js";
import { extensionName } from "./config.js";
import { clampPopupToViewport, isMobileDeviceDialog, prepareImageForUpload, removeThinkingTags } from "./utils.js";
import { getElContext } from "./chatDataUtils.js";
import { processWorldBooksWithTrigger } from "./worldbookProcessor.js";
import { mergeAdjacentMessages, replaceAllPlaceholders, replacePlaceholder } from "./promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "./settings/llmService.js";
import { updateCombinedPrompt } from "./settings/llmUi.js";
import { generateCharacterListText, generateCommonCharacterListText, generateOutfitEnableListText } from "./settings/worldbook.js";
import { updateItemImgChange } from "./database.js";
import { LLM_TAG_MODIFY } from "./llmRequest.js";
import "./promptReq.js"; // init_promptReq
import "./settings/llm.js"; // init_llm

var promptReq_exports;


function readFileAsBase643(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showTagModifyDemandPopup() {
  return new Promise((resolve) => {
    const isMobile3 = isMobileDeviceDialog();
    const uploadedImages = [];
    let topBound = 10;
    let bottomBound = window.innerHeight - 10;
    if (isMobile3) {
      const topSettingsHolder = document.querySelector("#top-settings-holder");
      if (topSettingsHolder) {
        const rect = topSettingsHolder.getBoundingClientRect();
        topBound = Math.max(10, Math.min(rect.bottom + 10, window.innerHeight * 0.5));
      }
      const sendForm = document.querySelector("#send_form");
      if (sendForm) {
        const rect = sendForm.getBoundingClientRect();
        bottomBound = Math.max(topBound + 200, Math.min(rect.top - 10, window.innerHeight - 10));
      }
    }
    const availableHeight = Math.max(200, bottomBound - topBound);
    const overlay2 = document.createElement("div");
    overlay2.id = "tag-modify-overlay";
    overlay2.className = "st-chatu8-popup-overlay";
    const bubble = document.createElement("div");
    bubble.className = "st-chatu8-popup-bubble";
    if (isMobile3) {
      bubble.classList.add("mobile");
      bubble.style.top = `${topBound}px`;
      bubble.style.maxHeight = `${availableHeight}px`;
    } else {
      clampPopupToViewport(bubble);
    }
    const title = document.createElement("div");
    title.textContent = "\u{1F3F7}\uFE0F \u4FEE\u6539 Tag";
    title.className = "st-chatu8-popup-title";
    const hint = document.createElement("div");
    hint.textContent = "\u8BF7\u63CF\u8FF0\u60A8\u5E0C\u671B\u5982\u4F55\u4FEE\u6539\u5F53\u524D\u7684\u56FE\u7247\u6807\u7B7E";
    hint.className = "st-chatu8-popup-hint";
    const textarea = document.createElement("textarea");
    textarea.placeholder = "\u4F8B\u5982\uFF1A\u628A\u80CC\u666F\u6539\u6210\u591C\u665A\u3001\u7ED9\u4EBA\u7269\u6DFB\u52A0\u7FC5\u8180\u3001\u589E\u52A0\u66F4\u591A\u7EC6\u8282...";
    textarea.className = "st-chatu8-popup-textarea";
    const imageUploadSection = document.createElement("div");
    imageUploadSection.className = "st-chatu8-popup-upload-section";
    const uploadHeader = document.createElement("div");
    uploadHeader.className = "st-chatu8-popup-upload-header";
    const uploadLabel = document.createElement("span");
    uploadLabel.textContent = "\u{1F4CE} \u53C2\u8003\u56FE\u7247\uFF08\u53EF\u9009\uFF09";
    uploadLabel.className = "st-chatu8-popup-upload-label";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button";
    uploadBtn.innerHTML = '<i class="fa-solid fa-plus"></i> \u6DFB\u52A0\u56FE\u7247';
    uploadBtn.className = "st-chatu8-popup-upload-btn";
    uploadBtn.addEventListener("click", () => fileInput.click());
    uploadHeader.appendChild(uploadLabel);
    uploadHeader.appendChild(uploadBtn);
    const imagePreviewContainer = document.createElement("div");
    imagePreviewContainer.className = "st-chatu8-popup-preview-container";
    const emptyHint = document.createElement("div");
    emptyHint.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
    emptyHint.className = "st-chatu8-popup-empty-hint";
    imagePreviewContainer.appendChild(emptyHint);
    function updateImagePreviews() {
      imagePreviewContainer.innerHTML = "";
      if (uploadedImages.length === 0) {
        const hint2 = document.createElement("div");
        hint2.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
        hint2.className = "st-chatu8-popup-empty-hint";
        imagePreviewContainer.appendChild(hint2);
        return;
      }
      uploadedImages.forEach((imgObj, index) => {
        const itemContainer = document.createElement("div");
        itemContainer.className = "st-chatu8-popup-img-item";
        const imgWrapper = document.createElement("div");
        imgWrapper.className = "st-chatu8-popup-img-wrapper";
        const img = document.createElement("img");
        img.src = imgObj.base64;
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.innerHTML = "\xD7";
        deleteBtn.className = "st-chatu8-popup-img-delete";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          uploadedImages.splice(index, 1);
          updateImagePreviews();
        });
        imgWrapper.appendChild(img);
        imgWrapper.appendChild(deleteBtn);
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = `\u56FE${index + 1}`;
        nameInput.value = imgObj.name || "";
        nameInput.className = "st-chatu8-popup-img-name";
        nameInput.addEventListener("input", (e) => {
          uploadedImages[index].name = e.target.value;
        });
        itemContainer.appendChild(imgWrapper);
        itemContainer.appendChild(nameInput);
        imagePreviewContainer.appendChild(itemContainer);
      });
      const countLabel = document.createElement("div");
      countLabel.textContent = `\u5DF2\u6DFB\u52A0 ${uploadedImages.length} \u5F20\u56FE\u7247`;
      countLabel.className = "st-chatu8-popup-img-count";
      imagePreviewContainer.appendChild(countLabel);
    }
    fileInput.addEventListener("change", async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        try {
          let base64 = "";
          try {
            const processed = await prepareImageForUpload(file);
            base64 = processed.dataUrl;
          } catch (pErr) {
            base64 = await readFileAsBase643(file);
          }
          uploadedImages.push({
            base64,
            name: ""
            // 用户可选填
          });
        } catch (err) {
          console.error("[showTagModifyDemandPopup] Failed to read image:", err);
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
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "st-chatu8-popup-buttons";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "\u53D6\u6D88";
    cancelBtn.className = "st-chatu8-popup-btn-cancel";
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "\u786E\u5B9A\u4FEE\u6539";
    confirmBtn.className = "st-chatu8-popup-btn-confirm";
    const closePopup = (result) => {
      overlay2.classList.add("closing");
      setTimeout(() => {
        if (fileInput) fileInput.remove();
        overlay2.remove();
        resolve(result);
      }, 150);
    };
    cancelBtn.addEventListener("click", () => closePopup(null));
    confirmBtn.addEventListener("click", () => closePopup({
      text: textarea.value.trim() || "",
      images: [...uploadedImages]
    }));
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        closePopup(null);
        document.removeEventListener("keydown", handleKeydown);
      } else if (e.key === "Enter" && e.ctrlKey) {
        closePopup({
          text: textarea.value.trim() || "",
          images: [...uploadedImages]
        });
        document.removeEventListener("keydown", handleKeydown);
      }
    };
    document.addEventListener("keydown", handleKeydown);
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    bubble.appendChild(title);
    bubble.appendChild(hint);
    bubble.appendChild(textarea);
    bubble.appendChild(imageUploadSection);
    bubble.appendChild(buttonContainer);
    overlay2.appendChild(bubble);
    document.body.appendChild(overlay2);
    setTimeout(() => textarea.focus(), 100);
  });
}

function parsePromptsContent(xmlText) {
  if (!xmlText || typeof xmlText !== "string") return null;
  const sizeMatch = xmlText.match(/<size>([\s\S]*?)<\/size>/i);
  let sizeResolution = "";
  if (sizeMatch) {
    const sizeParts = sizeMatch[1].trim().replace(/，/g, ",").split(",");
    if (sizeParts.length > 0) {
      sizeResolution = sizeParts[sizeParts.length - 1].trim();
    }
  }
  let promptsInner = "";
  const promptsMatch = xmlText.match(/<prompts>([\s\S]*?)<\/prompts>/i);
  if (promptsMatch) {
    promptsInner = promptsMatch[1].trim();
  } else if (/<scene_composition>|<character_\d+>/i.test(xmlText)) {
    promptsInner = xmlText.trim();
  }
  if (promptsInner) {
    const sceneMatch = promptsInner.match(/<scene_composition>([\s\S]*?)<\/scene_composition>/i);
    const charRegex = /<character_(\d+)>([\s\S]*?)<\/character_\1>/gi;
    const charMatches = [...promptsInner.matchAll(charRegex)];
    if (sceneMatch || charMatches.length > 0) {
      let sceneContent = sceneMatch ? sceneMatch[1].trim() : "";
      if (sizeResolution && !sceneContent.includes(sizeResolution)) {
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
      const combined = [sceneStr, charactersStr].filter((s) => s.trim()).join("\n").trim();
      if (combined) return combined;
    } else {
      let rawPrompts = promptsInner.replace(/<[^>]+>/g, "").trim();
      if (sizeResolution && !rawPrompts.includes(sizeResolution)) {
        if (rawPrompts && !rawPrompts.endsWith(",")) {
          rawPrompts += ",";
        }
        rawPrompts += sizeResolution;
      }
      if (rawPrompts) return rawPrompts;
    }
  }
  return null;
}

function stripNonPromptXmlTags(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/<regex>[\s\S]*?<\/regex>/gi, "").replace(/<title_styled>[\s\S]*?<\/title_styled>/gi, "").replace(/<Tag_think>[\s\S]*?<\/Tag_think>/gi, "").replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "").replace(/<size>[\s\S]*?<\/size>/gi, "").replace(/<[^>]+>/g, "").trim();
}

function parseImageTagFromResponse(text) {
  if (!text || typeof text !== "string") return null;
  let normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const settings3 = extension_settings[extensionName];
  const startTag = settings3?.startTag || "image###";
  const endTag = settings3?.endTag || "###";
  const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const imagesBlockRegex = /<images>([\s\S]*?)<\/images>/i;
  const imagesBlockMatch = normalizedText.match(imagesBlockRegex);
  if (imagesBlockMatch && imagesBlockMatch[1]) {
    const imagesContent = imagesBlockMatch[1];
    const imageTagRegex2 = /<image>([\s\S]*?)<\/image>/gi;
    const allImageMatches2 = [...imagesContent.matchAll(imageTagRegex2)];
    if (allImageMatches2.length > 0) {
      const lastImageContent = allImageMatches2[allImageMatches2.length - 1][1];
      console.log("[parseImageTagFromResponse] Found last <image> in <images> block");
      const xmlParsed = parsePromptsContent(lastImageContent);
      if (xmlParsed) {
        console.log("[parseImageTagFromResponse] Successfully parsed XML prompts from <image> block");
        return xmlParsed;
      }
      const innerRegex = new RegExp(`(?:${escapedStart}|image\\s*###)\\s*([\\s\\S]*?)\\s*(?:${escapedEnd}|###)`, "gi");
      const innerMatches = [...lastImageContent.matchAll(innerRegex)];
      if (innerMatches.length > 0) {
        return innerMatches[innerMatches.length - 1][1].trim();
      }
      const cleanFallback = stripNonPromptXmlTags(lastImageContent);
      if (cleanFallback) return cleanFallback;
    }
  }
  const imageTagRegex = /<image>([\s\S]*?)<\/image>/gi;
  const allImageMatches = [...normalizedText.matchAll(imageTagRegex)];
  if (allImageMatches.length > 0) {
    const lastImageContent = allImageMatches[allImageMatches.length - 1][1];
    console.log("[parseImageTagFromResponse] Found last standalone <image> tag");
    const xmlParsed = parsePromptsContent(lastImageContent);
    if (xmlParsed) {
      console.log("[parseImageTagFromResponse] Successfully parsed XML prompts from standalone <image>");
      return xmlParsed;
    }
    const innerRegex = new RegExp(`(?:${escapedStart}|image\\s*###)\\s*([\\s\\S]*?)\\s*(?:${escapedEnd}|###)`, "gi");
    const innerMatches = [...lastImageContent.matchAll(innerRegex)];
    if (innerMatches.length > 0) {
      return innerMatches[innerMatches.length - 1][1].trim();
    }
    const cleanFallback = stripNonPromptXmlTags(lastImageContent);
    if (cleanFallback) return cleanFallback;
  }
  const directXmlParsed = parsePromptsContent(normalizedText);
  if (directXmlParsed) {
    console.log("[parseImageTagFromResponse] Successfully parsed direct XML prompts from text");
    return directXmlParsed;
  }
  const regex = new RegExp(`(?:${escapedStart}|image\\s*###)\\s*([\\s\\S]*?)\\s*(?:${escapedEnd}|###)`, "gi");
  const matches = [...normalizedText.matchAll(regex)];
  if (matches.length > 0) {
    console.log("[parseImageTagFromResponse] Using last image### in full text");
    return matches[matches.length - 1][1].trim();
  }
  const fallbackRegex = /image\s*#{2,}\s*([\s\S]*?)\s*#{2,}/gi;
  const fallbackMatches = [...normalizedText.matchAll(fallbackRegex)];
  if (fallbackMatches.length > 0) {
    return fallbackMatches[fallbackMatches.length - 1][1].trim();
  }
  console.warn("[parseImageTagFromResponse] No match found in text:", normalizedText.substring(0, 300));
  return null;
}

function attachImagesToMessage6(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
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

function findMessageIndexWithPlaceholder5(messages, placeholder) {
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

async function handleTagModifyRequest(el, currentTag, inputEl, originalTag = null, button = null) {
  const popupResult = await showTagModifyDemandPopup();
  if (popupResult === null) {
    toastr.info("\u5DF2\u53D6\u6D88\u4FEE\u6539");
    return;
  }
  const userDemand = popupResult.text || "";
  const userUploadedImages = popupResult.images || [];
  if (!userDemand) {
    toastr.warning("\u8BF7\u8F93\u5165\u4FEE\u6539\u9700\u6C42");
    return;
  }
  toastr.info("\u6B63\u5728\u5904\u7406\u4FEE\u6539\u8BF7\u6C42...");
  try {
    let contextElements = [];
    let nowtxt = "";
    if (el) {
      contextElements = await getElContext(el) || [];
      nowtxt = contextElements[contextElements.length - 1] || "";
    }
    const triggerElements = userDemand ? [...contextElements, userDemand, currentTag] : [...contextElements, currentTag];
    const triggeredContent = await processWorldBooksWithTrigger(triggerElements);
    const context = getContext();
    const entryTriggerTextParts = [];
    if (userDemand) {
      entryTriggerTextParts.push(userDemand);
    }
    if (nowtxt) {
      entryTriggerTextParts.push(nowtxt);
    }
    if (currentTag) {
      entryTriggerTextParts.push(currentTag);
    }
    const entryTriggerText = entryTriggerTextParts.join("\n");
    const characterTriggerTextParts = [];
    if (userDemand) {
      characterTriggerTextParts.push(userDemand);
    }
    if (contextElements && contextElements.length > 0) {
      characterTriggerTextParts.push(contextElements.join("\n"));
    }
    if (triggeredContent) {
      characterTriggerTextParts.push(triggeredContent);
    }
    if (currentTag) {
      characterTriggerTextParts.push(currentTag);
    }
    const characterTriggerText = characterTriggerTextParts.join("\n");
    let prompt2 = buildPromptForRequestType("tag_modify", entryTriggerText);
    if (!prompt2 || prompt2.length === 0) {
      throw new Error('\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"Tag\u4FEE\u6539"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E');
    }
    const characterListText = generateCharacterListText(characterTriggerText);
    const outfitEnableListText = generateOutfitEnableListText();
    const commonCharacterListText = generateCommonCharacterListText();
    const variables = context.chatMetadata?.variables || {};
    prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("tag_modify"));
    const userDemandMsgIndex = findMessageIndexWithPlaceholder5(prompt2, "{{\u7528\u6237\u9700\u6C42}}");
    const contextData = {
      context: contextElements.join("\n"),
      body: nowtxt,
      worldBookContent: triggeredContent,
      variables,
      userDemand,
      characterListText,
      outfitEnableListText,
      commonCharacterListText
    };
    const { messages: processedMessages } = await replaceAllPlaceholders(prompt2, contextData);
    prompt2 = processedMessages;
    prompt2 = replacePlaceholder(prompt2, "{{\u5F53\u524Dtag}}", currentTag);
    if (userUploadedImages.length > 0 && userDemandMsgIndex !== -1) {
      prompt2 = attachImagesToMessage6(prompt2, userDemandMsgIndex, userUploadedImages, "\u53C2\u8003\u56FE\u7247");
    }
    const diagnosticText = `[Tag\u4FEE\u6539] \u7528\u6237\u9700\u6C42: ${userDemand}${userUploadedImages.length > 0 ? `
\u5DF2\u9644\u52A0 ${userUploadedImages.length} \u5F20\u53C2\u8003\u56FE\u7247` : ""}`;
    updateCombinedPrompt(prompt2, diagnosticText);
    const maxRetries = extension_settings[extensionName]?.llm_retry_count ?? 0;
    let attempt = 0;
    let newTag = null;
    while (attempt <= maxRetries) {
      if (attempt > 0) {
        const retryMsg = `\u672A\u80FD\u4ECE\u54CD\u5E94\u4E2D\u89E3\u6790\u51FA\u6709\u6548 tag\uFF0C\u6B63\u5728\u8FDB\u884C\u7B2C ${attempt}/${maxRetries} \u6B21\u91CD\u8BD5...`;
        console.log(`[LLM Parse Retry] Tag\u4FEE\u6539 ${retryMsg}`);
        toastr.info(`\u{1F504} ${retryMsg}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      const response = await LLM_TAG_MODIFY(prompt2, { timeoutMs: 6e5 });
      if (response?.testMode) {
        return;
      }
      const responseText = response?.result || response;
      const cleanedResponseText = removeThinkingTags(responseText);
      newTag = parseImageTagFromResponse(cleanedResponseText);
      if (newTag) {
        if (attempt > 0) {
          toastr.success("\u2705 \u91CD\u8BD5\u6210\u529F\uFF1ATag \u4FEE\u6539\u89E3\u6790\u6210\u529F\uFF01");
        }
        break;
      }
      attempt++;
    }
    if (newTag) {
      const formatted = newTag.trim().replace(/\n/g, "\\n");
      const targetOriginalTag = originalTag || button && button.dataset?.link || currentTag;
      if (targetOriginalTag) {
        try {
          await updateItemImgChange(targetOriginalTag, formatted);
          console.log("[tagModify] \u5DF2\u6839\u636E\u539F\u59CBTag MD5\u50A8\u5B58\u5230\u6570\u636E\u5E93:", targetOriginalTag);
        } catch (dbErr) {
          console.warn("[tagModify] \u81EA\u52A8\u50A8\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25:", dbErr);
        }
      }
      if (button) {
        button.dataset.change = formatted;
      }
      if (inputEl) {
        inputEl.value = newTag;
        try {
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        } catch (_) {
        }
      }
      toastr.success("Tag \u4FEE\u6539\u6210\u529F\u5E76\u5DF2\u50A8\u5B58\uFF01");
    } else {
      toastr.warning("\u672A\u80FD\u4ECE\u54CD\u5E94\u4E2D\u89E3\u6790\u51FA\u6709\u6548\u7684 tag\uFF08\u5DF2\u8FBE\u5230\u6700\u5927\u91CD\u8BD5\u6B21\u6570\uFF09");
      console.warn("[tagModify] Could not parse tag from response after retries");
    }
  } catch (error) {
    console.error("[tagModify] Error:", error);
    toastr.error(`\u4FEE\u6539\u5931\u8D25: ${error.message}`);
  }
}

export { handleTagModifyRequest, promptReq_exports };
