// 还原自打包产物 — 原始模块: utils/characterGen.js
import { eventSource } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { getContext } from "../../../../../st-context.js";
import { eventNames, extensionName } from "./config.js";
import { addLog, clampPopupToViewport, isMobileDeviceDialog, removeThinkingTags } from "./utils.js";
import { getElContext } from "./chatDataUtils.js";
import { processWorldBooksWithTrigger } from "./worldbookProcessor.js";
import { mergeAdjacentMessages, replaceAllPlaceholders } from "./promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "./settings/llmService.js";
import { updateCombinedPrompt } from "./settings/llmUi.js";
import { generateCharacterListText, generateCommonCharacterListText, generateOutfitEnableListText, getCommonCharacterImages, getEnabledCharacterImages, getEnabledOutfitImages } from "./settings/worldbook.js";
import { extractCharacterAndOutfitTags2, handleExtractedData } from "./newline_fix.js";
import "./promptReq.js"; // init_promptReq
import "./settings/llm.js"; // init_llm

function showUserDemandPopup() {
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
    overlay2.id = "user-demand-overlay";
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
    title.textContent = "\u{1F3A8} \u8F93\u5165\u751F\u6210\u9700\u6C42";
    title.className = "st-chatu8-popup-title";
    const hint = document.createElement("div");
    hint.textContent = "\u8BF7\u63CF\u8FF0\u60A8\u5E0C\u671B\u751F\u6210\u7684\u89D2\u8272\u6216\u670D\u88C5\u7684\u5177\u4F53\u9700\u6C42";
    hint.className = "st-chatu8-popup-hint";
    const textarea = document.createElement("textarea");
    textarea.placeholder = "\u4F8B\u5982\uFF1A\u751F\u6210\u4E00\u4E2A\u7A7F\u7740\u53E4\u98CE\u6C49\u670D\u7684\u5C11\u5973\u89D2\u8272\uFF0C\u6E29\u67D4\u53EF\u7231...";
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
          const base64 = await readFileAsBase647(file);
          uploadedImages.push({
            base64,
            name: ""
            // 用户可选填
          });
        } catch (err) {
          console.error("[showUserDemandPopup] Failed to read image:", err);
        }
      }
      updateImagePreviews();
      setTimeout(() => {
        if (fileInput) fileInput.value = "";
      }, 100);
    });
    function readFileAsBase647(file) {
      return new Promise((resolve2, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve2(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    imageUploadSection.appendChild(uploadHeader);
    imageUploadSection.appendChild(fileInput);
    imageUploadSection.appendChild(imagePreviewContainer);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "st-chatu8-popup-buttons";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "\u53D6\u6D88";
    cancelBtn.className = "st-chatu8-popup-btn-cancel";
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "\u786E\u5B9A\u751F\u6210";
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
      text: textarea.value.trim() || null,
      images: [...uploadedImages]
    }));
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        closePopup(null);
        document.removeEventListener("keydown", handleKeydown);
      } else if (e.key === "Enter" && e.ctrlKey) {
        closePopup({
          text: textarea.value.trim() || null,
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

function attachImagesToMessage5(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
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
    const description = typeof imgItem === "object" && imgItem.description ? String(imgItem.description).trim() : "";
    if (description) {
      contentParts.push({
        type: "text",
        text: `[${imgName}\u8BF4\u660E\uFF1A${description}]`
      });
    }
    let imageUrl = imgBase64;
    if (!imgBase64.startsWith("data:")) {
      imageUrl = `data:image/png;base64,${imgBase64}`;
    }
    contentParts.push({
      type: "image_url",
      image_url: {
        url: imageUrl,
        detail: "auto"
        // 可选: 'low', 'high', 'auto'
      }
    });
  });
  result[messageIndex] = {
    ...targetMsg,
    content: contentParts
  };
  return result;
}

function generateRequestId6() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function LLM_CHAR_DESIGN(prompt2, options = {}) {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId6();
    const timeoutMs = options.timeoutMs || 6e4;
    let timeoutTimer = null;
    console.log(`[characterGen] Executing char design LLM request (ID: ${requestId})`);
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_CHAR_DESIGN_RESPONSE, handler);
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };
    const handler = (responseData) => {
      if (responseData.id !== requestId) return;
      cleanup();
      if (responseData.success) {
        if (responseData.testMode) {
          resolve({ result: responseData.result, testMode: true });
        } else {
          resolve({ result: responseData.result, testMode: false });
        }
      } else {
        reject(new Error(responseData.result || "LLM \u8BF7\u6C42\u5931\u8D25"));
      }
    };
    eventSource.on(eventNames.LLM_CHAR_DESIGN_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_CHAR_DESIGN_REQUEST, { prompt: prompt2, id: requestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error("\u89D2\u8272\u8BBE\u8BA1 LLM \u8BF7\u6C42\u8D85\u65F6"));
    }, timeoutMs);
  });
}

async function handleCharacterDesignRequest(el) {
  console.log("[characterGen] Starting character design request...");
  try {
    let findUserDemandMessageIndex2 = function(messages) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          return i;
        }
      }
      return -1;
    };
    const popupResult = await showUserDemandPopup();
    if (popupResult === null) {
      console.log("[characterGen] User cancelled the request");
      toastr.info("\u5DF2\u53D6\u6D88\u89D2\u8272\u751F\u6210");
      return;
    }
    let userDemand = popupResult.text || extension_settings[extensionName]?.defaultCharDemand || "";
    const userUploadedImages = popupResult.images || [];
    console.log("[characterGen] User demand:", userDemand);
    console.log("[characterGen] User uploaded images count:", userUploadedImages.length);
    toastr.info("[characterGen] \u6B63\u5728\u5904\u7406\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1\u8BF7\u6C42...");
    const context = getContext();
    const historyDepth = (extension_settings[extensionName]?.llm_history_depth ?? 2) + 1;
    const contextElements = await getElContext(el, historyDepth);
    if (!contextElements || contextElements.length === 0) {
      toastr.warning("\u672A\u80FD\u83B7\u53D6\u4E0A\u4E0B\u6587\u5185\u5BB9");
      return;
    }
    console.log("[characterGen] Context elements:", contextElements);
    const nowtxt = contextElements[contextElements.length - 1];
    let triggeredContent = "";
    if (contextElements) {
      const triggerElements = userDemand ? [...contextElements, userDemand] : contextElements;
      triggeredContent = await processWorldBooksWithTrigger(triggerElements);
      console.log("[characterGen] Triggered world book content:", triggeredContent);
    }
    const contextWithoutBody = contextElements && contextElements.length > 1 ? contextElements.slice(0, -1) : [];
    const entryTriggerTextParts = [];
    if (userDemand) {
      entryTriggerTextParts.push(userDemand);
    }
    if (nowtxt) {
      entryTriggerTextParts.push(nowtxt);
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
    const characterTriggerText = characterTriggerTextParts.join("\n");
    console.log("[characterGen] Character trigger text:", characterTriggerText);
    let prompt2 = buildPromptForRequestType("char_design", entryTriggerText);
    if (!prompt2 || prompt2.length === 0) {
      throw new Error('\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E');
    }
    const characterListText = generateCharacterListText(characterTriggerText);
    const outfitEnableListText = generateOutfitEnableListText();
    const commonCharacterListText = generateCommonCharacterListText();
    console.log("[characterGen] Character list text (triggered):", characterListText);
    const variables = context.chatMetadata?.variables || {};
    prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("char_design"));
    console.log("[characterGen] \u5408\u5E76\u76F8\u90BB\u6D88\u606F\u540E:", prompt2);
    const contextData = {
      context: contextWithoutBody.join("\n"),
      body: nowtxt,
      worldBookContent: triggeredContent,
      variables,
      userDemand: userDemand || "",
      characterListText,
      outfitEnableListText,
      commonCharacterListText
    };
    const { messages: processedMessages, replacedVariables } = await replaceAllPlaceholders(prompt2, contextData);
    prompt2 = processedMessages;
    const userDemandMessageIndex = findUserDemandMessageIndex2(prompt2);
    console.log("[characterGen] \u627E\u5230\u7528\u6237\u6D88\u606F\u7D22\u5F15\u7528\u4E8E\u9644\u52A0\u56FE\u7247:", userDemandMessageIndex);
    if (userUploadedImages.length > 0 && userDemandMessageIndex >= 0) {
      prompt2 = attachImagesToMessage5(prompt2, userDemandMessageIndex, userUploadedImages, "\u53C2\u8003\u56FE\u7247");
      console.log("[characterGen] \u5DF2\u5C06", userUploadedImages.length, "\u5F20\u56FE\u7247\u9644\u52A0\u5230\u6D88\u606F\u7D22\u5F15", userDemandMessageIndex);
    }
    try {
      const characterImages = await getEnabledCharacterImages(characterTriggerText);
      const outfitImages = await getEnabledOutfitImages();
      const commonCharacterImagesData = await getCommonCharacterImages();
      const allCharacterOutfitImages = [...characterImages, ...outfitImages, ...commonCharacterImagesData];
      if (allCharacterOutfitImages.length > 0 && userDemandMessageIndex >= 0) {
        prompt2 = attachImagesToMessage5(prompt2, userDemandMessageIndex, allCharacterOutfitImages, "\u89D2\u8272\u670D\u88C5\u53C2\u8003\u56FE\u7247");
        console.log("[characterGen] \u5DF2\u5C06", allCharacterOutfitImages.length, "\u5F20\u89D2\u8272/\u670D\u88C5\u56FE\u7247\u9644\u52A0\u5230\u6D88\u606F\u7D22\u5F15", userDemandMessageIndex);
      }
    } catch (err) {
      console.error("[characterGen] \u6536\u96C6\u89D2\u8272/\u670D\u88C5\u56FE\u7247\u5931\u8D25:", err);
    }
    console.log("[characterGen] Final prompt:", prompt2);
    let diagnosticText = "";
    if (replacedVariables.size > 0) {
      diagnosticText = `\u8BCA\u65AD\uFF1A\u68C0\u6D4B\u5230\u4EE5\u4E0B\u53D8\u91CF\u88AB\u4F7F\u7528\uFF1A${[...replacedVariables].join("\u3001")}
`;
    }
    updateCombinedPrompt(prompt2, diagnosticText);
    const isRegexTestMode = extension_settings[extensionName]?.regexTestMode ?? false;
    if (isRegexTestMode) {
      toastr.info("\u{1F9EA} \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F\u5DF2\u542F\u7528\uFF1A\u5DF2\u505C\u6B62\u89D2\u8272\u8BBE\u8BA1 LLM \u8BF7\u6C42\uFF0C\u4EC5\u5C55\u793A\u6700\u7EC8 Prompt");
      console.log("[characterGen] \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F - LLM \u8BF7\u6C42\u5DF2\u8DF3\u8FC7");
      extension_settings[extensionName].regexTestMode = false;
      $("#ch-regex-test-mode").prop("checked", false);
      console.log("[characterGen] \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F\u5DF2\u81EA\u52A8\u5173\u95ED\uFF08\u4E00\u6B21\u6027\u89E6\u53D1\uFF09");
      return;
    }
    const maxRetries = extension_settings[extensionName]?.llm_retry_count ?? 0;
    let attempt = 0;
    let extracted = { characters: [], outfits: [] };
    while (attempt <= maxRetries) {
      if (attempt > 0) {
        const retryMsg = `\u672A\u5728 LLM \u8F93\u51FA\u4E2D\u68C0\u6D4B\u5230\u89D2\u8272\u6216\u670D\u88C5\u6807\u7B7E\uFF0C\u6B63\u5728\u8FDB\u884C\u7B2C ${attempt}/${maxRetries} \u6B21\u91CD\u8BD5...`;
        console.log(`[LLM Parse Retry] \u89D2\u8272\u8BBE\u8BA1 ${retryMsg}`);
        addLog(`\u23F3 ${retryMsg}`);
        toastr.info(`\u{1F504} ${retryMsg}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      const llmResponse = await LLM_CHAR_DESIGN(prompt2, { timeoutMs: 6e5 });
      console.log("[characterGen] LLM response:", llmResponse);
      if (llmResponse.testMode) {
        console.log("[characterGen] \u6D4B\u8BD5\u6A21\u5F0F - \u540E\u7EED\u64CD\u4F5C\u5DF2\u8DF3\u8FC7");
        return;
      }
      const llmOutput = llmResponse.result;
      if (llmOutput) {
        const cleanedOutput = removeThinkingTags(llmOutput);
        extracted = extractCharacterAndOutfitTags2(cleanedOutput);
        if (extracted.characters.length > 0 || extracted.outfits.length > 0) {
          if (attempt > 0) {
            const succMsg = `\u91CD\u8BD5\u6210\u529F\uFF01\u5DF2\u6210\u529F\u89E3\u6790\u51FA ${extracted.characters.length} \u4E2A\u89D2\u8272\u3001${extracted.outfits.length} \u5957\u670D\u88C5`;
            console.log(`[LLM Parse Retry] \u89D2\u8272\u8BBE\u8BA1 ${succMsg}`);
            addLog(`\u2705 ${succMsg}`);
            toastr.success(`\u2705 ${succMsg}`);
          }
          break;
        }
      }
      attempt++;
    }
    if (extracted.characters.length === 0 && extracted.outfits.length === 0) {
      toastr.warning("\u672A\u5728 LLM \u8F93\u51FA\u4E2D\u68C0\u6D4B\u5230\u89D2\u8272\u6216\u670D\u88C5\u6807\u7B7E\uFF08\u5DF2\u8FBE\u5230\u6700\u5927\u91CD\u8BD5\u6B21\u6570\uFF09");
      console.log("[characterGen] No character/outfit tags found in output after retries");
      return;
    }
    console.log("[characterGen] Extracted data:", extracted);
    const usedVariables = {};
    for (const varPlaceholder of replacedVariables) {
      const getvarMatch = varPlaceholder.match(/^\{\{getvar::([^}]+)\}\}$/);
      if (getvarMatch) {
        const varName = getvarMatch[1];
        usedVariables[varName] = variables[varName] || "";
      }
    }
    const metadata = {
      generationContext: contextElements.join("\n"),
      generationWorldBook: triggeredContent,
      generationVariables: usedVariables
    };
    await handleExtractedData(extracted, metadata);
    toastr.success("\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1\u5904\u7406\u5B8C\u6210\uFF01");
  } catch (error) {
    console.error("[characterGen] Error:", error);
    toastr.error(`\u89D2\u8272\u8BBE\u8BA1\u8BF7\u6C42\u5931\u8D25: ${error.message}`);
  }
}

async function onCharDataImportRequest(requestData) {
  const requestId = requestData?.id || "";
  console.log(`[characterGen] \u6536\u5230\u5916\u90E8\u6570\u636E\u5F55\u5165\u8BF7\u6C42 (ID: ${requestId}, mode: ${requestData?.mode})`);
  const emitResponse2 = (success, message, extra = {}) => {
    eventSource.emit(eventNames.CHAR_DATA_IMPORT_RESPONSE, {
      id: requestId,
      success,
      message,
      ...extra
    });
  };
  try {
    if (!requestData || !requestData.mode) {
      emitResponse2(false, '\u7F3A\u5C11\u5FC5\u9700\u53C2\u6570 mode\uFF08\u53EF\u9009\u503C: "text" | "structured"\uFF09');
      return;
    }
    let extracted;
    if (requestData.mode === "text") {
      if (!requestData.text || typeof requestData.text !== "string") {
        emitResponse2(false, 'mode="text" \u65F6\u5FC5\u987B\u63D0\u4F9B text \u5B57\u6BB5\uFF08\u5305\u542B <\u4EBA\u7269>/<\u670D\u88C5> \u6807\u7B7E\u7684\u6587\u672C\uFF09');
        return;
      }
      const cleanedText = removeThinkingTags(requestData.text);
      extracted = extractCharacterAndOutfitTags2(cleanedText);
      if (extracted.characters.length === 0 && extracted.outfits.length === 0) {
        emitResponse2(false, "\u672A\u5728\u6587\u672C\u4E2D\u68C0\u6D4B\u5230\u6709\u6548\u7684 <\u4EBA\u7269> \u6216 <\u670D\u88C5> \u6807\u7B7E");
        return;
      }
    } else if (requestData.mode === "structured") {
      if (!requestData.data || typeof requestData.data !== "object") {
        emitResponse2(false, 'mode="structured" \u65F6\u5FC5\u987B\u63D0\u4F9B data \u5B57\u6BB5\uFF08{ characters, outfits }\uFF09');
        return;
      }
      const characters = requestData.data.characters || [];
      const outfits = requestData.data.outfits || [];
      if (characters.length === 0 && outfits.length === 0) {
        emitResponse2(false, "data \u4E2D characters \u548C outfits \u5747\u4E3A\u7A7A");
        return;
      }
      for (let i = 0; i < characters.length; i++) {
        if (!characters[i].nameCN) {
          emitResponse2(false, `characters[${i}] \u7F3A\u5C11\u5FC5\u9700\u5B57\u6BB5 nameCN`);
          return;
        }
      }
      for (let i = 0; i < outfits.length; i++) {
        if (!outfits[i].nameCN) {
          emitResponse2(false, `outfits[${i}] \u7F3A\u5C11\u5FC5\u9700\u5B57\u6BB5 nameCN`);
          return;
        }
      }
      extracted = { characters, outfits };
    } else {
      emitResponse2(false, `\u4E0D\u652F\u6301\u7684 mode: "${requestData.mode}"\uFF08\u53EF\u9009\u503C: "text" | "structured"\uFF09`);
      return;
    }
    const metadata = requestData.metadata || {};
    await handleExtractedData(extracted, metadata);
    const charCount = extracted.characters?.length || 0;
    const outfitCount = extracted.outfits?.length || 0;
    let matchedOutfitCount = 0;
    if (extracted.characters) {
      for (const char of extracted.characters) {
        matchedOutfitCount += char.matchedOutfits?.length || 0;
      }
    }
    const totalOutfits = outfitCount + matchedOutfitCount;
    emitResponse2(true, `\u5F55\u5165\u5B8C\u6210\uFF1A${charCount} \u4E2A\u89D2\u8272, ${totalOutfits} \u5957\u670D\u88C5`, {
      characterCount: charCount,
      outfitCount: totalOutfits
    });
    console.log(`[characterGen] \u5916\u90E8\u6570\u636E\u5F55\u5165\u5B8C\u6210 (ID: ${requestId}): ${charCount} \u89D2\u8272, ${totalOutfits} \u670D\u88C5`);
  } catch (error) {
    console.error("[characterGen] \u5916\u90E8\u6570\u636E\u5F55\u5165\u5931\u8D25:", error);
    emitResponse2(false, `\u5F55\u5165\u5931\u8D25: ${error.message}`);
  }
}

function registerCharDataImportListener() {
  eventSource.on(eventNames.CHAR_DATA_IMPORT_REQUEST, onCharDataImportRequest);
  console.log("[characterGen] \u5DF2\u6CE8\u518C\u5916\u90E8\u6570\u636E\u5F55\u5165\u4E8B\u4EF6\u76D1\u542C\u5668");
}

export { handleCharacterDesignRequest, registerCharDataImportListener };
