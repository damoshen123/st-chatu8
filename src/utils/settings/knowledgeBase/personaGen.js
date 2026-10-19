// 还原自打包产物 — 原始模块: utils/settings/knowledgeBase/personaGen.js
import { extension_settings } from "../../../../../../../extensions.js";
import { getContext } from "../../../../../../../st-context.js";
import { eventSource } from "../../../../../../../../script.js";
import { eventNames, extensionName } from "../../config.js";
import { clampPopupToViewport, isMobileDeviceDialog } from "../../utils.js";
import { showToast } from "../../ui_common.js";
import { getElContext } from "../../chatDataUtils.js";
import { processWorldBooksWithTrigger } from "../../worldbookProcessor.js";
import { mergeAdjacentMessages, replaceAllPlaceholders } from "../../promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "../llmService.js";
import { updateCombinedPrompt } from "../llmUi.js";
import { generateCharacterListText, generateCommonCharacterListText, generateOutfitEnableListText } from "../worldbook.js";
import { buildFloorContext } from "../../assistant/assistantFloorMessage.js";
import { PERSONA_FIELDS, PERSONA_FIELD_LABELS, createPersonaPreset } from "./personaPreset.js";
import "../../promptReq.js"; // init_promptReq
import "../llm.js"; // init_llm

var managementPageImages, requestIdCounter;

requestIdCounter = 0;

managementPageImages = [];

function generateRequestId8() {
  return `persona-gen-${Date.now()}-${++requestIdCounter}`;
}

function setupPersonaGen() {
  bindPersonaGenButton();
  bindManagementPageImageUpload();
  console.log("[PersonaGen] \u4EBA\u8BBE\u751F\u6210\u6A21\u5757\u5DF2\u521D\u59CB\u5316");
}

async function handlePersonaGenFromClick(el) {
  console.log("[PersonaGen] \u4ECE ClickTrigger \u89E6\u53D1\u4EBA\u8BBE\u751F\u6210");
  let messageText = "";
  try {
    messageText = getVisibleTextContent(el)?.trim() || "";
    if (messageText.length > 500) {
      messageText = messageText.substring(0, 500) + "...";
    }
  } catch (e) {
    console.warn("[PersonaGen] \u63D0\u53D6\u6D88\u606F\u6587\u672C\u5931\u8D25:", e);
  }
  const typeChoice = await showTypeSelectionPopup();
  if (typeChoice === null) {
    console.log("[PersonaGen] \u7528\u6237\u53D6\u6D88\u4E86\u7C7B\u578B\u9009\u62E9");
    return;
  }
  const popupResult = await showPersonaGenDemandPopup(messageText, typeChoice);
  if (popupResult === null) {
    console.log("[PersonaGen] \u7528\u6237\u53D6\u6D88\u4E86\u4EBA\u8BBE\u751F\u6210");
    return;
  }
  const demandText = popupResult.text || "";
  const referenceImages = popupResult.images || [];
  const generationType = popupResult.type || "character";
  console.log("[PersonaGen] \u7528\u6237\u9700\u6C42:", demandText);
  console.log("[PersonaGen] \u53C2\u8003\u56FE\u7247\u6570\u91CF:", referenceImages.length);
  console.log("[PersonaGen] \u751F\u6210\u7C7B\u578B:", generationType);
  await handlePersonaGenRequest(el, "", demandText, referenceImages, generationType);
}

async function handlePersonaGenRequest(el = null, extraContext = "", overrideDemand = void 0, referenceImages = [], generationType = "character") {
  const statusEl = document.getElementById("ch-persona-gen-status");
  const btnEl = document.getElementById("ch-persona-gen-btn");
  try {
    if (btnEl) btnEl.disabled = true;
    setStatus(statusEl, "\u6B63\u5728\u6784\u5EFA\u63D0\u793A\u8BCD...");
    const demandText = overrideDemand !== void 0 ? overrideDemand : document.getElementById("ch-persona-gen-demand")?.value?.trim() || "";
    let contextElements = [];
    let nowtxt = extraContext || "";
    if (el) {
      const historyDepth = (extension_settings[extensionName]?.llm_history_depth ?? 2) + 1;
      contextElements = await getElContext(el, historyDepth) || [];
      if (contextElements.length > 0) {
        nowtxt = contextElements[contextElements.length - 1];
      }
    }
    setStatus(statusEl, "\u6B63\u5728\u5904\u7406\u4E16\u754C\u4E66\u89E6\u53D1...");
    let triggeredContent = "";
    if (contextElements.length > 0) {
      const triggerElements = demandText ? [...contextElements, demandText] : contextElements;
      triggeredContent = await processWorldBooksWithTrigger(triggerElements);
      console.log("[PersonaGen] \u4E16\u754C\u4E66\u89E6\u53D1\u5185\u5BB9:", triggeredContent);
    }
    const contextWithoutBody = contextElements.length > 1 ? contextElements.slice(0, -1) : [];
    const entryTriggerTextParts = [];
    if (demandText) entryTriggerTextParts.push(demandText);
    if (nowtxt) entryTriggerTextParts.push(nowtxt);
    const entryTriggerText = entryTriggerTextParts.join("\n");
    const characterTriggerTextParts = [];
    if (demandText) characterTriggerTextParts.push(demandText);
    if (contextElements.length > 0) characterTriggerTextParts.push(contextElements.join("\n"));
    if (triggeredContent) characterTriggerTextParts.push(triggeredContent);
    const characterTriggerText = characterTriggerTextParts.join("\n");
    setStatus(statusEl, "\u6B63\u5728\u83B7\u53D6\u9884\u8BBE\u63D0\u793A\u8BCD...");
    const requestType = generationType === "user" ? "user_persona_gen" : "persona_gen";
    let prompt2 = buildPromptForRequestType(requestType, entryTriggerText);
    if (!prompt2 || prompt2.length === 0) {
      const typeName = generationType === "user" ? "User \u4EBA\u8BBE\u751F\u6210" : "\u4EBA\u8BBE\u751F\u6210";
      throw new Error(`\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"${typeName}"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E`);
    }
    const characterListText = generateCharacterListText(characterTriggerText);
    const outfitEnableListText = generateOutfitEnableListText();
    const commonCharacterListText = generateCommonCharacterListText();
    const stContext = getContext();
    const variables = stContext.chatMetadata?.variables || {};
    prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("persona_gen"));
    const userDemandParts = [];
    if (demandText) userDemandParts.push(demandText);
    if (!el && extraContext) userDemandParts.push(`\u3010\u53C2\u8003\u6D88\u606F\u3011
${extraContext}`);
    userDemandParts.push(buildOutputFormatText());
    const fullUserDemand = userDemandParts.join("\n\n");
    const floorContext = await buildFloorContext();
    const contextData = {
      context: contextWithoutBody.join("\n"),
      body: nowtxt,
      worldBookContent: triggeredContent,
      variables,
      userDemand: fullUserDemand,
      characterListText,
      outfitEnableListText,
      commonCharacterListText,
      floorContext
      // 添加楼层信息
    };
    const { messages: processedMessages, replacedVariables } = await replaceAllPlaceholders(prompt2, contextData);
    prompt2 = processedMessages;
    console.log("[PersonaGen] \u5360\u4F4D\u7B26\u66FF\u6362\u5B8C\u6210\uFF0C\u5DF2\u66FF\u6362:", [...replacedVariables].join(", "));
    if (referenceImages && referenceImages.length > 0) {
      const userMsgIdx = findLastUserMessageIndex(prompt2);
      if (userMsgIdx >= 0) {
        prompt2 = attachImagesToMessage8(prompt2, userMsgIdx, referenceImages, "\u53C2\u8003\u56FE\u7247");
      }
    }
    let diagnosticText = "";
    if (replacedVariables.size > 0) {
      diagnosticText = `\u8BCA\u65AD\uFF1A\u68C0\u6D4B\u5230\u4EE5\u4E0B\u53D8\u91CF\u88AB\u4F7F\u7528\uFF1A${[...replacedVariables].join("\u3001")}
`;
    }
    updateCombinedPrompt(prompt2, diagnosticText);
    const isRegexTestMode = extension_settings[extensionName]?.regexTestMode ?? false;
    if (isRegexTestMode) {
      setStatus(statusEl, "\u{1F9EA} \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F\uFF1A\u5DF2\u505C\u6B62 LLM \u8BF7\u6C42\uFF0C\u4EC5\u5C55\u793A Prompt");
      console.log("[PersonaGen] \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F - LLM \u8BF7\u6C42\u5DF2\u8DF3\u8FC7");
      extension_settings[extensionName].regexTestMode = false;
      $("#ch-regex-test-mode").prop("checked", false);
      console.log("[PersonaGen] \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F\u5DF2\u81EA\u52A8\u5173\u95ED\uFF08\u4E00\u6B21\u6027\u89E6\u53D1\uFF09");
      if (btnEl) btnEl.disabled = false;
      return;
    }
    setStatus(statusEl, "\u6B63\u5728\u8C03\u7528 LLM \u751F\u6210\u4EBA\u8BBE...");
    const llmResult = generationType === "user" ? await LLM_USER_PERSONA_GEN(prompt2, { timeoutMs: 3e5 }) : await LLM_PERSONA_GEN(prompt2, { timeoutMs: 3e5 });
    const rawOutput = llmResult.result;
    if (!rawOutput) throw new Error("LLM \u8FD4\u56DE\u4E3A\u7A7A");
    setStatus(statusEl, "\u6B63\u5728\u89E3\u6790\u7ED3\u679C...");
    const personaData = parsePersonaGenOutput(rawOutput);
    if (!personaData) {
      console.error("[PersonaGen] \u539F\u59CB\u8F93\u51FA:", rawOutput);
      throw new Error("\u65E0\u6CD5\u4ECE LLM \u8F93\u51FA\u4E2D\u89E3\u6790\u51FA\u6709\u6548\u7684\u4EBA\u8BBE JSON");
    }
    populatePersonaFields(personaData);
    const charName = personaData.name || personaData["\u89D2\u8272\u540D"] || personaData["\u540D\u5B57"] || "\u65B0\u89D2\u8272";
    const typeLabel = generationType === "user" ? "User \u4EBA\u8BBE" : "\u4EBA\u8BBE";
    setStatus(statusEl, `\u2705 ${typeLabel}\u751F\u6210\u5B8C\u6210\uFF01`);
    showToast(`\u2705 ${typeLabel}\u300C${charName}\u300D\u751F\u6210\u5B8C\u6210\uFF0C\u5DF2\u5F55\u5165\u9884\u8BBE`, "success", 5e3);
    setTimeout(() => setStatus(statusEl, ""), 3e3);
  } catch (error) {
    console.error("[PersonaGen] \u751F\u6210\u5931\u8D25:", error);
    setStatus(statusEl, `\u274C \u751F\u6210\u5931\u8D25: ${error.message}`);
    const failLabel = generationType === "user" ? "User \u4EBA\u8BBE" : "\u4EBA\u8BBE";
    showToast(`\u274C ${failLabel}\u751F\u6210\u5931\u8D25: ${error.message}`, "error", 5e3);
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

function LLM_PERSONA_GEN(prompt2, options = {}) {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId8();
    const timeoutMs = options.timeoutMs || 6e4;
    let timeoutTimer = null;
    console.log(`[PersonaGen] Executing LLM request (ID: ${requestId})`);
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_PERSONA_GEN_RESPONSE, handler);
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };
    const handler = (responseData) => {
      if (responseData.id !== requestId) return;
      cleanup();
      if (responseData.success) {
        resolve({ result: responseData.result, testMode: !!responseData.testMode });
      } else {
        reject(new Error(responseData.result || "LLM \u8BF7\u6C42\u5931\u8D25"));
      }
    };
    eventSource.on(eventNames.LLM_PERSONA_GEN_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_PERSONA_GEN_REQUEST, { prompt: prompt2, id: requestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error("\u4EBA\u8BBE\u751F\u6210 LLM \u8BF7\u6C42\u8D85\u65F6"));
    }, timeoutMs);
  });
}

function LLM_USER_PERSONA_GEN(prompt2, options = {}) {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId8();
    const timeoutMs = options.timeoutMs || 6e4;
    let timeoutTimer = null;
    console.log(`[PersonaGen] Executing User LLM request (ID: ${requestId})`);
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_USER_PERSONA_GEN_RESPONSE, handler);
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };
    const handler = (responseData) => {
      if (responseData.id !== requestId) return;
      cleanup();
      if (responseData.success) {
        resolve({ result: responseData.result, testMode: !!responseData.testMode });
      } else {
        reject(new Error(responseData.result || "User \u4EBA\u8BBE\u751F\u6210 LLM \u8BF7\u6C42\u5931\u8D25"));
      }
    };
    eventSource.on(eventNames.LLM_USER_PERSONA_GEN_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_USER_PERSONA_GEN_REQUEST, { prompt: prompt2, id: requestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error("User \u4EBA\u8BBE\u751F\u6210 LLM \u8BF7\u6C42\u8D85\u65F6"));
    }, timeoutMs);
  });
}

function parsePersonaGenOutput(rawOutput) {
  try {
    let jsonStr = rawOutput;
    const codeBlockMatch = rawOutput.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    const parsed = JSON.parse(jsonStr);
    if (parsed.type === "chatu8_persona_profile" && parsed.data) {
      const characterNames = Object.keys(parsed.data);
      if (characterNames.length > 0) {
        const firstCharData = parsed.data[characterNames[0]];
        return { name: characterNames[0], ...firstCharData };
      }
    }
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error("[PersonaGen] JSON \u89E3\u6790\u5931\u8D25:", e);
    try {
      const firstBrace = rawOutput.indexOf("{");
      const lastBrace = rawOutput.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const jsonStr = rawOutput.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === "chatu8_persona_profile" && parsed.data) {
          const characterNames = Object.keys(parsed.data);
          if (characterNames.length > 0) {
            return { name: characterNames[0], ...parsed.data[characterNames[0]] };
          }
        }
        return parsed;
      }
    } catch (e2) {
      console.error("[PersonaGen] \u5BBD\u677E\u89E3\u6790\u4E5F\u5931\u8D25:", e2);
    }
    return null;
  }
}

function populatePersonaFields(personaData) {
  if (!personaData) return;
  console.log("[PersonaGen] \u586B\u5145\u4EBA\u8BBE\u6570\u636E:", personaData);
  const charName = personaData.name || personaData["\u89D2\u8272\u540D"] || personaData["\u540D\u5B57"] || "\u65B0\u89D2\u8272";
  try {
    createPersonaPreset(charName, personaData);
  } catch (e) {
    console.warn("[PersonaGen] \u521B\u5EFA\u9884\u8BBE\u5931\u8D25\uFF0C\u5C1D\u8BD5\u76F4\u63A5\u586B\u5145:", e);
  }
  for (const field of PERSONA_FIELDS) {
    const value = personaData[field];
    if (value !== void 0 && value !== null) {
      const inputEl = document.querySelector(`[data-persona-field="${field}"]`) || document.getElementById(`ch-persona-${field}`);
      if (inputEl) {
        if (inputEl.tagName === "TEXTAREA" || inputEl.tagName === "INPUT") {
          inputEl.value = String(value);
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }
  }
}

function bindPersonaGenButton() {
  const btn = document.getElementById("ch-persona-gen-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    console.log("[PersonaGen] \u7BA1\u7406\u9875\u9762\u89E6\u53D1\u4EBA\u8BBE\u751F\u6210");
    const typeSelect = document.getElementById("ch-persona-gen-type");
    const generationType = typeSelect?.value || "character";
    console.log("[PersonaGen] \u751F\u6210\u7C7B\u578B:", generationType);
    await handlePersonaGenRequest(
      null,
      "",
      void 0,
      [...managementPageImages],
      generationType
    );
  });
}

function bindManagementPageImageUpload() {
  const uploadBtn = document.getElementById("ch-persona-gen-upload-btn");
  const fileInput = document.getElementById("ch-persona-gen-upload-input");
  const previewContainer = document.getElementById("ch-persona-gen-preview");
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const base64 = await readFileAsBase645(file);
          managementPageImages.push({ base64, name: file.name });
        } catch (err) {
          console.error("[PersonaGen] \u8BFB\u53D6\u56FE\u7247\u5931\u8D25:", err);
        }
      }
      updateManagementImagePreview(previewContainer);
      fileInput.value = "";
    });
  }
  const clearBtn = document.getElementById("ch-persona-gen-clear-images");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      managementPageImages = [];
      updateManagementImagePreview(previewContainer);
    });
  }
}

function updateManagementImagePreview(container) {
  if (!container) return;
  container.innerHTML = "";
  if (managementPageImages.length === 0) {
    const emptyHint = document.createElement("div");
    emptyHint.className = "ch-persona-gen-empty-hint";
    emptyHint.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247\uFF0CAI \u5C06\u6839\u636E\u56FE\u7247\u5185\u5BB9\u8F85\u52A9\u751F\u6210\u4EBA\u8BBE";
    container.appendChild(emptyHint);
    return;
  }
  managementPageImages.forEach((imgObj, idx) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:inline-block;margin:4px;position:relative;";
    const img = document.createElement("img");
    img.src = imgObj.base64;
    img.style.cssText = "width:60px;height:60px;object-fit:cover;border-radius:4px;";
    const delBtn = document.createElement("button");
    delBtn.textContent = "\xD7";
    delBtn.style.cssText = "position:absolute;top:-4px;right:-4px;background:red;color:white;border:none;border-radius:50%;width:16px;height:16px;font-size:10px;cursor:pointer;line-height:16px;padding:0;";
    delBtn.addEventListener("click", () => {
      managementPageImages.splice(idx, 1);
      updateManagementImagePreview(container);
    });
    wrapper.appendChild(img);
    wrapper.appendChild(delBtn);
    container.appendChild(wrapper);
  });
}

function showTypeSelectionPopup() {
  return new Promise((resolve) => {
    const isMobile3 = isMobileDeviceDialog();
    let topOffset = 10;
    let maxHeight = "none";
    if (isMobile3) {
      const topSettingsHolder = document.querySelector("#top-settings-holder");
      if (topSettingsHolder) {
        const rect = topSettingsHolder.getBoundingClientRect();
        topOffset = Math.max(10, Math.min(rect.bottom + 10, window.innerHeight * 0.5));
      }
      const availableHeight = Math.max(200, window.innerHeight - topOffset - 20);
      maxHeight = `${availableHeight}px`;
    }
    const overlay2 = document.createElement("div");
    overlay2.className = "st-chatu8-popup-overlay";
    const bubble = document.createElement("div");
    bubble.className = "st-chatu8-popup-bubble";
    bubble.style.maxWidth = "400px";
    if (isMobile3) {
      bubble.classList.add("mobile");
      bubble.style.top = `${topOffset}px`;
      bubble.style.maxHeight = maxHeight;
    } else {
      clampPopupToViewport(bubble);
    }
    const title = document.createElement("div");
    title.className = "st-chatu8-popup-title";
    title.textContent = "\u9009\u62E9\u751F\u6210\u7C7B\u578B";
    bubble.appendChild(title);
    const hint = document.createElement("div");
    hint.className = "st-chatu8-popup-hint";
    hint.textContent = "\u8BF7\u9009\u62E9\u8981\u751F\u6210\u7684\u4EBA\u8BBE\u7C7B\u578B\uFF1A";
    bubble.appendChild(hint);
    const buttons = document.createElement("div");
    buttons.className = "st-chatu8-popup-buttons";
    buttons.style.flexDirection = "column";
    buttons.style.gap = "8px";
    const characterBtn = document.createElement("button");
    characterBtn.className = "st-chatu8-popup-btn-confirm";
    characterBtn.innerHTML = "\u{1F3AD} \u89D2\u8272\u4EBA\u8BBE<br><small>\u5305\u542B\u6B21\u5143\u7A7F\u8D8A\u8BBE\u5B9A</small>";
    characterBtn.style.padding = "12px";
    buttons.appendChild(characterBtn);
    const userBtn = document.createElement("button");
    userBtn.className = "st-chatu8-popup-btn-confirm";
    userBtn.innerHTML = "\u{1F464} User \u4EBA\u8BBE<br><small>\u4E0D\u5305\u542B\u7A7F\u8D8A\u8BBE\u5B9A</small>";
    userBtn.style.padding = "12px";
    buttons.appendChild(userBtn);
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "st-chatu8-popup-btn-cancel";
    cancelBtn.textContent = "\u53D6\u6D88";
    buttons.appendChild(cancelBtn);
    bubble.appendChild(buttons);
    overlay2.appendChild(bubble);
    document.body.appendChild(overlay2);
    function closePopup(result) {
      overlay2.remove();
      resolve(result);
    }
    characterBtn.addEventListener("click", () => closePopup("character"));
    userBtn.addEventListener("click", () => closePopup("user"));
    cancelBtn.addEventListener("click", () => closePopup(null));
    overlay2.addEventListener("click", (e) => {
      if (e.target === overlay2) closePopup(null);
    });
  });
}

function showPersonaGenDemandPopup(messagePreview, generationType = "character") {
  return new Promise((resolve) => {
    const uploadedImages = [];
    const isMobile3 = isMobileDeviceDialog();
    let topOffset = 10;
    let maxHeight = "none";
    if (isMobile3) {
      const topSettingsHolder = document.querySelector("#top-settings-holder");
      if (topSettingsHolder) {
        const rect = topSettingsHolder.getBoundingClientRect();
        topOffset = Math.max(10, Math.min(rect.bottom + 10, window.innerHeight * 0.5));
      }
      const availableHeight = Math.max(200, window.innerHeight - topOffset - 20);
      maxHeight = `${availableHeight}px`;
    }
    const overlay2 = document.createElement("div");
    overlay2.className = "st-chatu8-popup-overlay";
    const bubble = document.createElement("div");
    bubble.className = "st-chatu8-popup-bubble";
    if (isMobile3) {
      bubble.classList.add("mobile");
      bubble.style.top = `${topOffset}px`;
      bubble.style.maxHeight = maxHeight;
    } else {
      clampPopupToViewport(bubble);
    }
    const title = document.createElement("div");
    title.className = "st-chatu8-popup-title";
    title.textContent = generationType === "user" ? "User \u4EBA\u8BBE\u751F\u6210" : "\u89D2\u8272\u4EBA\u8BBE\u751F\u6210";
    bubble.appendChild(title);
    const hint = document.createElement("div");
    hint.className = "st-chatu8-popup-hint";
    hint.textContent = generationType === "user" ? "\u8BF7\u8F93\u5165 User \u4EBA\u8BBE\u751F\u6210\u9700\u6C42\uFF08\u53EF\u9009\uFF09\uFF0C\u7559\u7A7A\u5219\u6839\u636E\u4E0A\u4E0B\u6587\u81EA\u52A8\u751F\u6210" : "\u8BF7\u8F93\u5165\u89D2\u8272\u4EBA\u8BBE\u751F\u6210\u9700\u6C42\uFF08\u53EF\u9009\uFF09\uFF0C\u7559\u7A7A\u5219\u6839\u636E\u89D2\u8272\u5361\u4FE1\u606F\u81EA\u52A8\u751F\u6210";
    bubble.appendChild(hint);
    if (messagePreview) {
      const preview = document.createElement("div");
      preview.className = "st-chatu8-popup-hint";
      preview.style.cssText = "font-size:12px;opacity:0.6;margin-bottom:8px;max-height:60px;overflow:hidden;text-overflow:ellipsis;";
      preview.textContent = `\u{1F4DD} \u53C2\u8003\u6D88\u606F: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? "..." : ""}`;
      bubble.appendChild(preview);
    }
    const textarea = document.createElement("textarea");
    textarea.className = "st-chatu8-popup-textarea";
    textarea.placeholder = "\u4F8B\u5982\uFF1A\u751F\u6210\u4E00\u4E2A\u6E29\u67D4\u7684\u732B\u5A18\u89D2\u8272\u4EBA\u8BBE\uFF0C\u6027\u683C\u5BB3\u7F9E\u4F46\u5185\u5FC3\u5584\u826F...";
    textarea.style.minHeight = "100px";
    bubble.appendChild(textarea);
    const imageSection = document.createElement("div");
    imageSection.className = "st-chatu8-popup-upload-section";
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
        const h = document.createElement("div");
        h.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
        h.className = "st-chatu8-popup-empty-hint";
        imagePreviewContainer.appendChild(h);
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
          const base64 = await readFileAsBase645(file);
          uploadedImages.push({ base64, name: "" });
        } catch (err) {
          console.error("[PersonaGen] \u8BFB\u53D6\u56FE\u7247\u5931\u8D25:", err);
        }
      }
      updateImagePreviews();
      setTimeout(() => {
        if (fileInput) fileInput.value = "";
      }, 100);
    });
    imageSection.appendChild(uploadHeader);
    imageSection.appendChild(fileInput);
    imageSection.appendChild(imagePreviewContainer);
    bubble.appendChild(imageSection);
    const buttons = document.createElement("div");
    buttons.className = "st-chatu8-popup-buttons";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "st-chatu8-popup-btn-cancel";
    cancelBtn.textContent = "\u53D6\u6D88";
    buttons.appendChild(cancelBtn);
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "st-chatu8-popup-btn-confirm";
    confirmBtn.textContent = "\u5F00\u59CB\u751F\u6210";
    buttons.appendChild(confirmBtn);
    bubble.appendChild(buttons);
    overlay2.appendChild(bubble);
    document.body.appendChild(overlay2);
    setTimeout(() => textarea.focus(), 100);
    function closePopup(result) {
      if (fileInput) fileInput.remove();
      overlay2.remove();
      resolve(result);
    }
    cancelBtn.addEventListener("click", () => closePopup(null));
    overlay2.addEventListener("click", (e) => {
      if (e.target === overlay2) closePopup(null);
    });
    confirmBtn.addEventListener("click", () => {
      closePopup({
        text: textarea.value.trim(),
        images: [...uploadedImages],
        type: generationType
      });
    });
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        closePopup({
          text: textarea.value.trim(),
          images: [...uploadedImages],
          type: generationType
        });
      }
      if (e.key === "Escape") closePopup(null);
    });
  });
}

function buildOutputFormatText() {
  const fieldList = PERSONA_FIELDS.map((f) => `- ${f}: ${PERSONA_FIELD_LABELS[f] || f}`).join("\n");
  return `\u3010\u8F93\u51FA\u8981\u6C42\u3011
\u8BF7\u4EE5 JSON \u683C\u5F0F\u8F93\u51FA\u89D2\u8272\u4EBA\u8BBE\u6570\u636E\u3002\u652F\u6301\u4EE5\u4E0B\u5B57\u6BB5\uFF1A
${fieldList}

\u8BF7\u8F93\u51FA\u5982\u4E0B\u683C\u5F0F\uFF1A
\`\`\`json
{
    "type": "chatu8_persona_profile",
    "version": "1.0",
    "data": {
        "\u89D2\u8272\u540D": {
            ${PERSONA_FIELDS.map((f) => `"${f}": "..."`).join(",\n            ")}
        }
    }
}
\`\`\``;
}

function findLastUserMessageIndex(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}

function attachImagesToMessage8(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
  if (!images || images.length === 0 || messageIndex < 0 || messageIndex >= messages.length) return messages;
  const result = [...messages];
  const targetMsg = result[messageIndex];
  const contentParts = [];
  if (typeof targetMsg.content === "string") {
    contentParts.push({ type: "text", text: targetMsg.content });
  } else if (Array.isArray(targetMsg.content)) {
    contentParts.push(...targetMsg.content);
  }
  if (images.length > 0) {
    contentParts.push({ type: "text", text: `
[\u4EE5\u4E0B\u662F\u7528\u6237\u4E0A\u4F20\u7684${images.length}\u5F20${imageLabel}]` });
  }
  images.forEach((imgItem, idx) => {
    const imgBase64 = typeof imgItem === "string" ? imgItem : imgItem.base64;
    const imgName = typeof imgItem === "object" && imgItem.name ? imgItem.name : `${imageLabel}${idx + 1}`;
    contentParts.push({ type: "text", text: `[${imgName}]` });
    let imageUrl = imgBase64;
    if (!imgBase64.startsWith("data:")) imageUrl = `data:image/png;base64,${imgBase64}`;
    contentParts.push({ type: "image_url", image_url: { url: imageUrl, detail: "auto" } });
  });
  result[messageIndex] = { ...targetMsg, content: contentParts };
  return result;
}

function setStatus(el, text) {
  if (el) el.textContent = text;
}

function getVisibleTextContent(el) {
  if (!el) return "";
  const clone = el.cloneNode(true);
  clone.querySelectorAll("style, script").forEach((s) => s.remove());
  return clone.textContent || "";
}

function readFileAsBase645(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export { handlePersonaGenFromClick, setupPersonaGen };
