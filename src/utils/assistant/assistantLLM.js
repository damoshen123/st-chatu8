// 还原自打包产物 — 原始模块: utils/assistant/assistantLLM.js
import { extension_settings } from "../../../../../../extensions.js";
import { getContext } from "../../../../../../st-context.js";
import { assistantDefaultTailMessagesConfig, assistantDefaultToolCallConfig } from "../settings/defaultToolCallConfig.js";
import { LLMRequestTypes, extensionName } from "../config.js";
import { getChatImagesBatch, getChatImagesMetadataBatch, saveChatImage } from "../configDatabase.js";
import { applyWordReplacement, applyWordReplacementToMessages } from "../wordReplacementService.js";
import { promptReq_exports } from "../tagModify.js";
import { dropKnownEmptyMessages } from "../promptProcessor.js";
import { abortLLMChannelRequest, executeDefaultLLMRequest, getEffectiveConfigForRequestType, processImagesInMessages } from "../settings/llmService.js";
import { getResultTextareaUpdater, updateCombinedPrompt } from "../settings/llmUi.js";
import { activeChat, currentSystemMsgContent, currentSystemMsgElement, dom, isAiGenerating, pendingImageGenerations, selectedImages2, setCurrentSystemMsgContent, setCurrentSystemMsgElement, setIsAiGenerating, setPendingCommand } from "./assistantContext.js";
import { buildFloorContext } from "./assistantFloorMessage.js";
import { PERSONA_FIELDS } from "../settings/knowledgeBase/personaPreset.js";
import { getModuleSummaries } from "../aiModules/index.js";
import { buildKnowledgeBasePromptContent } from "../knowledgeBaseService.js";
import { buildTailReminder, getSettingsContextPrompt, hasSystemCommand, parseAndApplySettings, parseQuerySettings, removeThinkBlocks } from "../aiSettingsBridge.js";
import { escapeHTML } from "./assistantUtils.js";
import { injectTTSStyleInstruction, speakNotification, tryPlayTTS } from "./assistantTTS.js";
import { updateScrollStateAfterEdit } from "./assistantScrollManager.js";
import { clearImageSelection } from "./assistantImage.js";
import { startNewChat, switchChat, syncAndSave } from "./assistantSession.js";
import { adjustInputHeight, appendSystemEmptyMessage, createThrottledUIUpdater2, dismissAskChoices, finalizeAssistantMessage, updateSendButtonState } from "./assistantMessage.js";
import { getSummaryManager } from "./assistantSummary.js";
import { defaultSystemPromptKey, systemPrompts } from "../aiPrompts.js";
import { buildPersonaPromptContent, getPersonaFieldValue } from "../settings/knowledgeBase/personaService.js";
import { buildUserPromptContent, getUserFieldValue } from "../settings/knowledgeBase/userService.js";
import { DEFAULT_ASSISTANT_PREFILL } from "./assistantPrefill.js";
import { clearPendingCommand, createPendingCommand, executePendingCommand, getAutoExecuteMode, renderExecuteButton } from "./assistantCommand.js";
import { isConversationMode, notifyAiGenerating, notifyAiGenerationDone } from "../asr.js";
import { captureForMessage } from "./assistantScreenCapture.js";
import "../settings/llm.js"; // init_llm
import "../aiPromptModules.js"; // init_aiPromptModules
import "../settings/knowledgeBase/index.js"; // init_knowledgeBase

var AUTO_EXECUTE_NO_CALLBACK_TYPES;

AUTO_EXECUTE_NO_CALLBACK_TYPES = /* @__PURE__ */ new Set([
      "generate_image",
      "tavern_input",
      "tavern_read_input",
      // 任务管理写操作（不需要 AI 回调）
      "task_create",
      "task_update",
      "task_add_steps",
      "step_update",
      "task_complete",
      // UI/功能开关操作（不需要 AI 回调）
      "ui_action",
      "regex_test_mode",
      "click_trigger_enabled",
      "gesture_enabled"
    ]);



function isCustomMode() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  return (aiConfig.system_prompt_key || defaultSystemPromptKey) === "custom";
}

function buildProfileData() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  const useLlmApi = !!aiConfig.use_llm_api;
  let effectiveCfg = null;
  try {
    effectiveCfg = getEffectiveConfigForRequestType(LLMRequestTypes.AI_ASSISTANT);
  } catch (_e) {
    effectiveCfg = null;
  }
  let sendImages;
  if (useLlmApi || isCustomMode()) {
    sendImages = effectiveCfg?.send_images ?? aiConfig.send_images !== false;
  } else {
    sendImages = aiConfig.send_images !== false;
  }
  let toolCallConfig = { enabled: false };
  let tailMessagesConfig = { enabled: false };
  if (aiConfig.use_tool_call !== false) {
    toolCallConfig = {
      ...assistantDefaultToolCallConfig,
      enabled: true
    };
    tailMessagesConfig = {
      ...assistantDefaultTailMessagesConfig,
      enabled: assistantDefaultTailMessagesConfig?.enabled !== false
    };
  }
  if (useLlmApi && effectiveCfg) {
    const isVertex = effectiveCfg.channel_type === "vertex" || !!(effectiveCfg.vertex_credentials && effectiveCfg.vertex_credentials.project_id);
    const resolvedModel = isVertex ? effectiveCfg.vertex_model || "gemini-2.5-flash" : (effectiveCfg.model || "").trim();
    return {
      api_url: (effectiveCfg.api_url || "").trim(),
      api_key: (effectiveCfg.api_key || "").trim(),
      model: resolvedModel,
      bypass_proxy: effectiveCfg.bypass_proxy ?? false,
      stream: effectiveCfg.stream ?? aiConfig.stream ?? false,
      temperature: effectiveCfg.enable_temperature !== false ? effectiveCfg.temperature ?? 0.8 : typeof aiConfig.temperature === "number" ? aiConfig.temperature : 0.8,
      top_p: effectiveCfg.enable_top_p !== false ? effectiveCfg.top_p ?? 1 : typeof aiConfig.top_p === "number" ? aiConfig.top_p : 1,
      max_tokens: effectiveCfg.enable_max_tokens !== false ? effectiveCfg.max_tokens ?? 4e4 : typeof aiConfig.max_tokens === "number" ? aiConfig.max_tokens : 4e4,
      enable_temperature: effectiveCfg.enable_temperature ?? true,
      enable_top_p: effectiveCfg.enable_top_p ?? true,
      enable_max_tokens: effectiveCfg.enable_max_tokens ?? true,
      custom_headers: effectiveCfg.custom_headers || "",
      enable_custom_headers: effectiveCfg.enable_custom_headers ?? false,
      custom_body_params: effectiveCfg.custom_body_params || "",
      enable_custom_body_params: effectiveCfg.enable_custom_body_params ?? false,
      // Vertex 专属字段全量透传
      channel_type: effectiveCfg.channel_type || "openai",
      vertex_credentials: effectiveCfg.vertex_credentials || null,
      vertex_location: (effectiveCfg.vertex_location || "us-central1").trim(),
      vertex_model: (effectiveCfg.vertex_model || "gemini-2.5-flash").trim(),
      // 透传发送图片开关
      send_images: sendImages,
      // 透传专属 Tool Call 与 Tail Messages 配置
      tool_call_config: toolCallConfig,
      tail_messages_config: tailMessagesConfig
    };
  }
  return {
    api_url: (aiConfig.api_url || "").trim(),
    api_key: (aiConfig.api_key || "").trim(),
    model: (aiConfig.model || "").trim(),
    bypass_proxy: aiConfig.bypass_proxy,
    stream: aiConfig.stream,
    temperature: typeof aiConfig.temperature === "number" ? aiConfig.temperature : 0.8,
    top_p: typeof aiConfig.top_p === "number" ? aiConfig.top_p : 1,
    max_tokens: typeof aiConfig.max_tokens === "number" ? aiConfig.max_tokens : 4e4,
    // 透传「发送图片」开关，否则 executeDefaultLLMRequest 会因 undefined → 默认 false 而剥离图片
    send_images: sendImages,
    // 透传自定义 Tool 与 Tail Messages 配置
    tool_call_config: toolCallConfig,
    tail_messages_config: tailMessagesConfig
  };
}

async function buildSystemPrompt(kbTriggerText = "") {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  const promptKey = aiConfig.system_prompt_key || defaultSystemPromptKey;
  if (promptKey === "custom") {
    return null;
  }
  let systemPromptStr = systemPrompts[promptKey]?.prompt || systemPrompts[defaultSystemPromptKey].prompt;
  if (systemPromptStr.includes("{modules}")) {
    const moduleSummaries = getModuleSummaries();
    systemPromptStr = systemPromptStr.replace("{modules}", "\n" + moduleSummaries + "\n");
  }
  if (systemPromptStr.includes("{settings}")) {
    const contextStr = getSettingsContextPrompt();
    systemPromptStr = systemPromptStr.replace("{settings}", "\n" + contextStr + "\n");
  }
  if (systemPromptStr.includes("{chatu8_code}")) {
    const settings3 = extension_settings[extensionName];
    const chatu8Code = settings3?.chatu8_code || "\u672A\u5206\u914D";
    systemPromptStr = systemPromptStr.replace(/{chatu8_code}/g, chatu8Code);
  }
  if (systemPromptStr.includes("{knowledgeBase}")) {
    const knowledgeContent = await buildKnowledgeBasePromptContent(kbTriggerText);
    systemPromptStr = systemPromptStr.replace("{knowledgeBase}", "\n" + knowledgeContent + "\n");
  }
  systemPromptStr = injectTTSStyleInstruction(systemPromptStr);
  return systemPromptStr;
}

async function substituteTemplateVariables(content, extraVars = {}) {
  if (!content) return content;
  let result = content;
  if (result.includes("{{\u4EBA\u8BBE}}")) {
    const personaContent = buildPersonaPromptContent();
    result = result.replace(/\{\{人设\}\}/g, personaContent || "\u6682\u65E0\u4EBA\u8BBE\u8D44\u6599");
  }
  if (result.includes("{{userpersona}}")) {
    const userContent = buildUserPromptContent();
    result = result.replace(/\{\{userpersona\}\}/g, userContent || "\u6682\u65E0User\u4EBA\u8BBE\u8D44\u6599");
  }
  if (result.includes("{{\u77E5\u8BC6\u5E93}}")) {
    const triggerText = extraVars.kbTriggerText ?? extraVars.lastUserText ?? "";
    const knowledgeContent = await buildKnowledgeBasePromptContent(triggerText);
    result = result.replace(/\{\{知识库\}\}/g, knowledgeContent || "");
  }
  if (result.includes("{{\u7528\u6237\u9700\u6C42}}")) {
    const lastUserText = extraVars.lastUserText ?? "";
    result = result.replace(/\{\{用户需求\}\}/g, lastUserText);
  }
  if (result.includes("{{\u622A\u56FE\u4FE1\u606F}}")) {
    const captureInfo = extraVars.captureInfo ?? "";
    result = result.replace(/\{\{截图信息\}\}/g, captureInfo);
  }
  if (result.includes("{{\u697C\u5C42\u4FE1\u606F}}")) {
    const floorContext = await buildFloorContext();
    let finalFloorContent = "";
    if (floorContext && floorContext.trim()) {
      try {
        const { processWorldBooksWithTrigger: processWorldBooksWithTrigger2 } = await import("../promptReq.js");
        const floorMessages = floorContext.split("\n").filter((line) => line.trim());
        let triggeredWorldBook = await processWorldBooksWithTrigger2(floorMessages);
        if (triggeredWorldBook) {
          const username = getContext()?.name1 || "";
          triggeredWorldBook = triggeredWorldBook.replaceAll("{{user}}", username);
          triggeredWorldBook = triggeredWorldBook.replaceAll("<user>", username);
        }
        if (triggeredWorldBook) {
          finalFloorContent = `<\u9152\u9986\u6545\u4E8B\u80CC\u666F>
${triggeredWorldBook}
</\u9152\u9986\u6545\u4E8B\u80CC\u666F>

${floorContext}`;
          console.log("[AI Assistant] \u697C\u5C42\u4FE1\u606F\u5DF2\u89E6\u53D1\u4E16\u754C\u4E66\u5185\u5BB9");
        } else {
          finalFloorContent = floorContext;
        }
      } catch (err) {
        console.warn("[AI Assistant] \u697C\u5C42\u4FE1\u606F\u89E6\u53D1\u4E16\u754C\u4E66\u5931\u8D25:", err);
        finalFloorContent = floorContext;
      }
    }
    result = result.replace(/\{\{楼层信息\}\}/g, finalFloorContent);
  }
  for (const field of PERSONA_FIELDS) {
    const placeholder = `{{\u4EBA\u8BBE.${field}}}`;
    if (result.includes(placeholder)) {
      const value = getPersonaFieldValue(field);
      result = result.replace(
        new RegExp(`\\{\\{\u4EBA\u8BBE\\.${field}\\}\\}`, "g"),
        value || ""
      );
    }
  }
  for (const field of PERSONA_FIELDS) {
    const placeholder = `{{\u7528\u6237.${field}}}`;
    if (result.includes(placeholder)) {
      const value = getUserFieldValue(field);
      result = result.replace(
        new RegExp(`\\{\\{\u7528\u6237\\.${field}\\}\\}`, "g"),
        value || ""
      );
    }
  }
  result = result.replace(/^[^\n]*[：:]\s*$/gm, "");
  result = result.replace(/\n{3,}/g, "\n\n");
  result = evaluateRollMacros(result);
  return result;
}

function evaluateRollMacros(text) {
  if (!text || typeof text !== "string") return text;
  if (!text.includes("{{roll")) return text;
  return text.replace(/\{\{roll(?:::|:|\s+)([^}]+)\}\}/gi, (match, formula) => {
    try {
      formula = (formula || "").trim();
      if (/^\d+$/.test(formula)) {
        formula = `1d${formula}`;
      }
      const diceMatch = formula.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i);
      if (diceMatch) {
        const count = Math.min(parseInt(diceMatch[1], 10) || 1, 100);
        const sides = parseInt(diceMatch[2], 10) || 6;
        const sign = diceMatch[3];
        const mod = parseInt(diceMatch[4], 10) || 0;
        let total = 0;
        for (let i = 0; i < count; i++) {
          total += Math.floor(Math.random() * sides) + 1;
        }
        if (sign === "+") total += mod;
        if (sign === "-") total -= mod;
        return String(total);
      }
      return String(Math.floor(Math.random() * 1e5) + 1);
    } catch {
      return String(Math.floor(Math.random() * 1e5) + 1);
    }
  });
}

function applyRollMacrosToMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages.map((msg) => {
    if (!msg || typeof msg !== "object") return msg;
    if (typeof msg.content === "string") {
      return { ...msg, content: evaluateRollMacros(msg.content) };
    }
    if (Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map((part) => {
          if (part && part.type === "text" && typeof part.text === "string") {
            return { ...part, text: evaluateRollMacros(part.text) };
          }
          return part;
        })
      };
    }
    return msg;
  });
}

async function buildCustomPrefillMessages(extraVars = {}) {
  const effectiveConfig = getEffectiveConfigForRequestType(LLMRequestTypes.AI_ASSISTANT);
  const contextProfile = effectiveConfig.context || {};
  const messages = [];
  let contextInsertIndex = -1;
  if (contextProfile.entries && Array.isArray(contextProfile.entries)) {
    const hasImages = extraVars.lastUserImages && Object.keys(extraVars.lastUserImages).length > 0;
    let imageTargetEntryIdx = -1;
    if (hasImages) {
      for (let i = 0; i < contextProfile.entries.length; i++) {
        const e = contextProfile.entries[i];
        if (!e || !e.enabled || !e.content || e.content.trim() === "") continue;
        if (e.content.trim() === "{{\u4E0A\u4E0B\u6587}}" || e.content.includes("{{\u4E0A\u4E0B\u6587}}")) continue;
        if (e.id === "entry_user_input" || e.content.includes("{{\u7528\u6237\u9700\u6C42}}")) {
          imageTargetEntryIdx = i;
        }
      }
      console.log(
        "[AI Assistant] \u56FE\u7247\u9644\u52A0\u76EE\u6807\u6761\u76EE\u7D22\u5F15:",
        imageTargetEntryIdx,
        imageTargetEntryIdx >= 0 ? `(id=${contextProfile.entries[imageTargetEntryIdx].id})` : "(\u672A\u627E\u5230\uFF0C\u5C06\u4E0D\u9644\u52A0)"
      );
    }
    for (let i = 0; i < contextProfile.entries.length; i++) {
      const entry = contextProfile.entries[i];
      if (!entry.enabled) continue;
      if (!entry.content || entry.content.trim() === "") continue;
      if (entry.content.trim() === "{{\u4E0A\u4E0B\u6587}}" || entry.content.includes("{{\u4E0A\u4E0B\u6587}}")) {
        contextInsertIndex = messages.length;
        continue;
      }
      const substitutedContent = await substituteTemplateVariables(entry.content, extraVars);
      if (i === imageTargetEntryIdx) {
        console.log("[AI Assistant] \u5728\u6761\u76EE id=" + entry.id + " \u4E0A\u9644\u52A0\u56FE\u7247\u6570\u636E:", Object.keys(extraVars.lastUserImages).length, "\u5F20");
        const parts = [{ type: "text", text: substitutedContent }];
        for (const [imageId, base64Url] of Object.entries(extraVars.lastUserImages)) {
          console.log("[AI Assistant] \u9644\u52A0\u56FE\u7247:", imageId, "\u957F\u5EA6:", base64Url?.length);
          parts.push({
            type: "image_url",
            image_url: { url: base64Url }
          });
        }
        messages.push({ role: entry.role || "system", content: parts });
        console.log("[AI Assistant] \u5DF2\u8F6C\u6362\u4E3A\u591A\u6A21\u6001\u683C\u5F0F\uFF0Cparts \u6570\u91CF:", parts.length);
      } else {
        messages.push({ role: entry.role || "system", content: substitutedContent });
      }
    }
  }
  return { messages, contextInsertIndex };
}

function isAutoExecuteNoCallbackOnly(text) {
  if (!text) return false;
  const cleaned = removeThinkBlocks(text);
  const queryMatches = [...cleaned.matchAll(/<SystemQuery>([\s\S]*?)<\/SystemQuery>/gi)];
  if (queryMatches.length === 0) return false;
  for (const match of queryMatches) {
    try {
      const data = JSON.parse(match[1].trim());
      if (!AUTO_EXECUTE_NO_CALLBACK_TYPES.has(data.type)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

async function parseQueryWithProgress2(accumulatedReply) {
  const hasImageGeneration = accumulatedReply.includes('"type": "generate_image"') || accumulatedReply.includes('"type":"generate_image"');
  if (hasImageGeneration && currentSystemMsgContent) {
    const loadingHtml = `
            <div class="st-chatu8-ai-image-generating" style="margin-top: 10px; padding: 10px; background: rgba(100, 150, 255, 0.1); border-left: 3px solid #6496ff; border-radius: 4px;">
                <i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u751F\u6210\u56FE\u7247\uFF0C\u8BF7\u7A0D\u5019...
            </div>
        `;
    currentSystemMsgContent.append(loadingHtml);
    dom.chatBody.scrollTop(dom.chatBody[0].scrollHeight);
    console.log("[AI Assistant] \u5DF2\u663E\u793A\u751F\u56FE\u8FDB\u5EA6\u63D0\u793A");
  }
  try {
    const queryResult = await parseQuerySettings(accumulatedReply);
    return queryResult;
  } finally {
    if (hasImageGeneration && currentSystemMsgContent) {
      currentSystemMsgContent.find(".st-chatu8-ai-image-generating").remove();
      console.log("[AI Assistant] \u5DF2\u79FB\u9664\u751F\u56FE\u8FDB\u5EA6\u63D0\u793A");
    }
  }
}

function detectImageGenerationRequest(messageElement, aiReply) {
  const idMatch = aiReply.match(/生图请求已提交，ID: (ai_gen_\d+_\d+)/);
  if (idMatch && idMatch[1]) {
    const generationId = idMatch[1];
    pendingImageGenerations.set(generationId, messageElement);
    const loadingHtml = `
            <div class="st-chatu8-ai-image-loading" data-gen-id="${generationId}" style="margin-top: 10px; text-align: center; color: var(--st-chatu8-text-secondary);">
                <i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u751F\u6210\u56FE\u7247...
            </div>
        `;
    messageElement.append(loadingHtml);
  }
}

async function _saveImagesAndGetRefs(images, chatId) {
  if (!images || images.length === 0) return [];
  const refs = [];
  for (const img of images) {
    try {
      const mimeMatch = img.data.match(/^data:(image\/[^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const imageId = await saveChatImage(img.data, {
        mimeType,
        name: img.name || "",
        chatId
      });
      refs.push(imageId);
    } catch (err) {
      console.error("[AI Assistant] \u4FDD\u5B58\u56FE\u7247\u5230\u56FE\u7247\u5C42\u5931\u8D25:", err);
    }
  }
  return refs;
}

function limitImagesInHistory(messages, maxImages = 5) {
  let totalImages = 0;
  for (const msg of messages) {
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "image_url") {
          totalImages++;
        }
      }
    }
  }
  if (totalImages <= maxImages) {
    return messages;
  }
  console.log(`[AI Assistant] \u5BF9\u8BDD\u5386\u53F2\u4E2D\u5171\u6709 ${totalImages} \u5F20\u56FE\u7247\uFF0C\u8D85\u8FC7\u4E0A\u9650 ${maxImages}\uFF0C\u5C06\u4ECE\u540E\u5F80\u524D\u4FDD\u7559\u6700\u65B0\u7684 ${maxImages} \u5F20`);
  let kept = 0;
  const keepSet = /* @__PURE__ */ new Set();
  for (let i = messages.length - 1; i >= 0 && kept < maxImages; i--) {
    const msg = messages[i];
    if (!Array.isArray(msg.content)) continue;
    for (let j = msg.content.length - 1; j >= 0 && kept < maxImages; j--) {
      if (msg.content[j].type === "image_url") {
        keepSet.add(`${i}-${j}`);
        kept++;
      }
    }
  }
  return messages.map((msg, i) => {
    if (!Array.isArray(msg.content)) {
      return msg;
    }
    const newContent = [];
    let removedCount = 0;
    for (let j = 0; j < msg.content.length; j++) {
      const part = msg.content[j];
      if (part.type === "image_url") {
        if (keepSet.has(`${i}-${j}`)) {
          newContent.push(part);
        } else {
          removedCount++;
        }
      } else {
        newContent.push(part);
      }
    }
    if (removedCount > 0) {
      newContent.push({ type: "text", text: `[\u5DF2\u7701\u7565 ${removedCount} \u5F20\u8F83\u65E9\u7684\u56FE\u7247\u4EE5\u8282\u7701\u8BF7\u6C42\u4F53\u79EF]` });
    }
    if (newContent.length === 1 && newContent[0].type === "text") {
      return { role: msg.role, content: newContent[0].text };
    }
    return { role: msg.role, content: newContent };
  });
}

function stripImagesFromMessages2(messages) {
  if (!Array.isArray(messages)) return [];
  const stripped = messages.map((msg) => {
    if (!Array.isArray(msg.content)) return msg;
    const filtered = msg.content.filter((part) => part.type !== "image_url");
    if (filtered.length === 0) {
      return { role: msg.role, content: "" };
    }
    if (filtered.length === 1 && filtered[0].type === "text") {
      return { role: msg.role, content: filtered[0].text };
    }
    return { role: msg.role, content: filtered };
  });
  return dropKnownEmptyMessages(stripped);
}

function mergeAdjacentMessages2(messages) {
  if (!messages || messages.length === 0) return [];
  const cleanMessages = dropKnownEmptyMessages(messages);
  if (cleanMessages.length === 0) return [];
  const toArray = (content) => {
    if (Array.isArray(content)) return content;
    return [{ type: "text", text: String(content ?? "") }];
  };
  const mergeContent2 = (a, b) => {
    const isAStr = typeof a === "string";
    const isBStr = typeof b === "string";
    if (isAStr && isBStr) return a + "\n\n" + b;
    return [...toArray(a), ...toArray(b)];
  };
  const converted = cleanMessages.map((msg) => ({
    ...msg,
    role: msg.role === "system" ? "user" : msg.role
  }));
  const merged = [];
  for (const msg of converted) {
    const last = merged.length > 0 ? merged[merged.length - 1] : null;
    if (last && last.role === msg.role) {
      last.content = mergeContent2(last.content, msg.content);
    } else {
      merged.push({ role: msg.role, content: Array.isArray(msg.content) ? [...msg.content] : msg.content });
    }
  }
  return dropKnownEmptyMessages(merged);
}

function stripThinkingContent(content) {
  if (typeof content !== "string") return content;
  return content.replace(/^[\s\S]*<\/think(?:ing)?>\s*/g, "");
}

function _buildConversationHistory(rawMessages, imageCache) {
  return rawMessages.filter((msg) => msg && typeof msg === "object").map((msg) => {
    const role = msg.role === "assistant" || msg.role === "system" ? "assistant" : msg.role;
    if (msg.imageRefs && msg.imageRefs.length > 0) {
      const textContent = String(msg.content || "");
      const text = role === "assistant" ? stripThinkingContent(textContent) : textContent;
      const parts = [{ type: "text", text }];
      for (const refId of msg.imageRefs) {
        if (imageCache[refId]) {
          parts.push({
            type: "image_url",
            image_url: { url: imageCache[refId] }
          });
        }
      }
      if (parts.length === 1) {
        return { role, content: parts[0].text };
      }
      return { role, content: parts };
    }
    if (Array.isArray(msg.content)) {
      if (role === "assistant") {
        const cleaned = msg.content.map(
          (part) => part.type === "text" ? { ...part, text: stripThinkingContent(part.text) } : part
        );
        return { role, content: cleaned };
      }
      return { role, content: msg.content };
    }
    if (role === "assistant") {
      return { role, content: stripThinkingContent(msg.content) };
    }
    return { role, content: msg.content };
  });
}

async function runLlmChain(activeChatRef, profileData, requestId, iterState, handleSendFn, handleRegenerateFn, boundAppendMessage) {
  const chatMessages = Array.isArray(activeChatRef.messages) ? activeChatRef.messages.filter((msg) => msg && typeof msg === "object") : [];
  const kbConfig = extension_settings[extensionName]?.knowledgeBaseConfig || {};
  const kbTriggerDepth = typeof kbConfig.triggerDepth === "number" ? kbConfig.triggerDepth : 1;
  const kbTriggerMessages = chatMessages.slice(-(kbTriggerDepth + 1));
  const kbTriggerText = kbTriggerMessages.map((m) => Array.isArray(m.content) ? m.content.find((c) => c.type === "text")?.text || "" : String(m.content || "")).filter((t) => t.trim()).join("\n");
  const systemPromptStr = await buildSystemPrompt(kbTriggerText);
  const allImageRefs = [];
  for (const msg of chatMessages) {
    if (msg.imageRefs && msg.imageRefs.length > 0) {
      allImageRefs.push(...msg.imageRefs);
    }
  }
  let imageCache = {};
  if (allImageRefs.length > 0) {
    try {
      imageCache = await getChatImagesBatch(allImageRefs);
    } catch (err) {
      console.error("[AI Assistant] \u6279\u91CF\u83B7\u53D6\u804A\u5929\u56FE\u7247\u5931\u8D25:", err);
    }
  }
  const conversationHistory = _buildConversationHistory(chatMessages, imageCache);
  const limitedHistory = limitImagesInHistory(conversationHistory, 5);
  const sendImages = profileData?.send_images !== false;
  try {
    let _imgCount = 0;
    if (Array.isArray(limitedHistory)) {
      for (const m of limitedHistory) {
        if (m && Array.isArray(m.content)) {
          for (const p of m.content) if (p && p.type === "image_url") _imgCount++;
        }
      }
    }
    console.warn(
      `[\u53D1\u9001\u56FE\u7247\u8BCA\u65AD/AI\u52A9\u624B] send_images=${sendImages} | history \u4E2D\u56FE\u7247\u6570=${_imgCount} | \u5C06${sendImages ? "\u4FDD\u7559" : "\u5265\u79BB"}\u56FE\u7247`
    );
  } catch (_e) {
  }
  let processedHistory = sendImages ? await processImagesInMessages(limitedHistory) : stripImagesFromMessages2(limitedHistory);
  let summaryBlock = "";
  const summaryMgr = getSummaryManager();
  if (summaryMgr && summaryMgr.summaries.some((s) => s.enabled)) {
    const result = summaryMgr.buildSummaryContextBlock(chatMessages);
    summaryBlock = result.summaryBlock;
    if (result.excludedRanges.length > 0) {
      processedHistory = summaryMgr.filterHistoryMessages(processedHistory, result.excludedRanges);
      console.log("[AI Assistant] \u603B\u7ED3\u4E0A\u4E0B\u6587\uFF1A\u5DF2\u6392\u9664", result.excludedRanges.length, "\u4E2A\u6D88\u606F\u8303\u56F4\uFF0C\u6CE8\u5165\u603B\u7ED3\u5757");
    }
  }
  const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUserMsg ? Array.isArray(lastUserMsg.content) ? lastUserMsg.content.find((c) => c.type === "text")?.text || "" : String(lastUserMsg.content) : "";
  let captureInfo = "";
  let lastUserImages = {};
  if (lastUserMsg && lastUserMsg.imageRefs && lastUserMsg.imageRefs.length > 0) {
    console.log("[AI Assistant] \u6700\u540E\u4E00\u6761\u7528\u6237\u6D88\u606F\u5305\u542B imageRefs:", lastUserMsg.imageRefs.length, "\u4E2A");
    try {
      const metadataBatch = await getChatImagesMetadataBatch(lastUserMsg.imageRefs);
      const imageDescriptions = [];
      for (const refId of lastUserMsg.imageRefs) {
        const metadata = metadataBatch[refId];
        if (metadata && metadata.name) {
          if (metadata.name.includes("\u5C4F\u5E55\u622A\u56FE")) {
            imageDescriptions.push("\u7535\u8111\u5C4F\u5E55\u622A\u56FE");
          } else if (metadata.name.includes("\u6D4F\u89C8\u5668\u622A\u56FE")) {
            imageDescriptions.push("\u6D4F\u89C8\u5668\u754C\u9762\u622A\u56FE");
          } else {
            imageDescriptions.push("\u56FE\u7247");
          }
        } else {
          imageDescriptions.push("\u56FE\u7247");
        }
        if (imageCache[refId]) {
          lastUserImages[refId] = imageCache[refId];
          console.log("[AI Assistant] \u6536\u96C6\u56FE\u7247\u6570\u636E:", refId, "\u957F\u5EA6:", imageCache[refId]?.length);
        } else {
          console.warn("[AI Assistant] imageCache \u4E2D\u672A\u627E\u5230\u56FE\u7247:", refId);
        }
      }
      if (imageDescriptions.length > 0) {
        captureInfo = `
[\u672C\u6B21\u9644\u5E26\u4E86 ${imageDescriptions.length} \u5F20\u56FE\u7247: ${imageDescriptions.join("\u3001")}]`;
      }
      console.log("[AI Assistant] lastUserImages \u6784\u5EFA\u5B8C\u6210\uFF0C\u5171", Object.keys(lastUserImages).length, "\u5F20\u56FE\u7247");
    } catch (err) {
      console.error("[AI Assistant] \u83B7\u53D6\u56FE\u7247\u5143\u6570\u636E\u5931\u8D25:", err);
    }
  } else {
    console.log("[AI Assistant] \u6700\u540E\u4E00\u6761\u7528\u6237\u6D88\u606F\u65E0 imageRefs");
  }
  let finalPrompt;
  if (systemPromptStr === null) {
    const { messages: prefillMessages, contextInsertIndex } = await buildCustomPrefillMessages({
      lastUserText,
      captureInfo,
      kbTriggerText,
      lastUserImages: sendImages ? lastUserImages : {}
    });
    if (contextInsertIndex >= 0) {
      const hasUserInputEntry = prefillMessages.some(
        (msg) => msg.content && (typeof msg.content === "string" && msg.content.includes("<\u672C\u6B21\u8F93\u5165>") || Array.isArray(msg.content) && msg.content.some(
          (part) => part.type === "text" && part.text.includes("<\u672C\u6B21\u8F93\u5165>")
        ))
      );
      let historyToInsert = processedHistory;
      if (hasUserInputEntry && processedHistory.length > 0) {
        const lastMsg = processedHistory[processedHistory.length - 1];
        if (lastMsg.role === "user") {
          historyToInsert = processedHistory.slice(0, -1);
          console.log("[AI Assistant] \u81EA\u5B9A\u4E49\u9884\u8BBE\uFF1A\u5BF9\u8BDD\u5386\u53F2\u6392\u9664\u6700\u540E\u4E00\u6761\u7528\u6237\u6D88\u606F\uFF08\u5DF2\u5728 entry_user_input \u4E2D\uFF09");
        }
      }
      const beforeContext = prefillMessages.slice(0, contextInsertIndex);
      const afterContext = prefillMessages.slice(contextInsertIndex);
      const summaryMessages = summaryBlock ? [{ role: "system", content: summaryBlock }] : [];
      finalPrompt = [
        ...beforeContext,
        ...summaryMessages,
        // 总结块插入到对话历史之前
        ...historyToInsert,
        // 对话历史插入到标记位置
        ...afterContext
      ];
    } else {
      console.warn("[AI Assistant] \u81EA\u5B9A\u4E49\u9884\u8BBE\u4E2D\u672A\u627E\u5230 {{\u4E0A\u4E0B\u6587}} \u6807\u8BB0\uFF0C\u5BF9\u8BDD\u5386\u53F2\u5C06\u4E0D\u4F1A\u88AB\u6CE8\u5165");
      finalPrompt = [
        ...prefillMessages
      ];
    }
  } else {
    const systemPromptMessages = [
      { role: "user", content: systemPromptStr },
      ...summaryBlock ? [{ role: "user", content: summaryBlock }] : []
    ];
    let priorHistory = [];
    let currentUserContent = buildTailReminder(lastUserText);
    if (processedHistory.length > 0) {
      const lastHistoryMsg = processedHistory[processedHistory.length - 1];
      if (lastHistoryMsg.role === "user") {
        priorHistory = processedHistory.slice(0, -1);
        if (Array.isArray(lastHistoryMsg.content)) {
          const imageParts = lastHistoryMsg.content.filter((part) => part && part.type === "image_url");
          if (imageParts.length > 0) {
            currentUserContent = [
              { type: "text", text: buildTailReminder(lastUserText) },
              ...imageParts
            ];
          }
        }
      } else {
        priorHistory = processedHistory;
      }
    }
    finalPrompt = [
      ...systemPromptMessages,
      { role: "assistant", content: evaluateRollMacros(DEFAULT_ASSISTANT_PREFILL) },
      ...priorHistory,
      { role: "user", content: currentUserContent }
    ];
  }
  finalPrompt = applyWordReplacementToMessages(finalPrompt, "ai");
  finalPrompt = applyRollMacrosToMessages(finalPrompt);
  const uiUpdater = createThrottledUIUpdater2(handleSendFn);
  finalPrompt = mergeAdjacentMessages2(finalPrompt);
  finalPrompt = dropKnownEmptyMessages(finalPrompt);
  console.log("[DEBUG-LLM] \u25B6 runLlmChain: \u5373\u5C06\u8C03\u7528 executeDefaultLLMRequest");
  console.log("[DEBUG-LLM]   currentSystemMsgContent \u5B58\u5728:", !!currentSystemMsgContent);
  console.log("[DEBUG-LLM]   currentSystemMsgContent \u5728DOM\u4E2D:", currentSystemMsgContent ? $.contains(document, currentSystemMsgContent[0]) : "N/A");
  console.log("[DEBUG-LLM]   \u81EA\u5B9A\u4E49\u6A21\u5F0F:", systemPromptStr === null);
  console.log("[DEBUG-LLM]   finalPrompt \u6D88\u606F\u6570:", finalPrompt.length);
  updateCombinedPrompt(finalPrompt, "[\u667A\u7ED8\u59EC\u52A9\u624B] ");
  const resultUpdater = getResultTextareaUpdater();
  let assistantFullText = "";
  const wrappedCallback = (chunk) => {
    uiUpdater.callback(chunk);
    assistantFullText += chunk;
    if (resultUpdater) resultUpdater(assistantFullText);
  };
  const execResult = await executeDefaultLLMRequest(
    { prompt: finalPrompt, id: requestId },
    profileData,
    wrappedCallback,
    "assistant"
  );
  console.log("[DEBUG-LLM] \u25C0 executeDefaultLLMRequest \u5B8C\u6210");
  console.log("[DEBUG-LLM]   currentSystemMsgContent \u5B58\u5728:", !!currentSystemMsgContent);
  console.log("[DEBUG-LLM]   currentSystemMsgContent \u5728DOM\u4E2D:", currentSystemMsgContent ? $.contains(document, currentSystemMsgContent[0]) : "N/A");
  uiUpdater.flush();
  const accumulatedReply = applyWordReplacement(uiUpdater.getReply(), "ai");
  if (execResult?.aborted || !accumulatedReply) {
    console.warn("[AI Assistant] \u8BF7\u6C42\u88AB\u62E6\u622A\u6216\u56DE\u590D\u4E3A\u7A7A\uFF0C\u5B89\u5168\u6E05\u7406\u5360\u4F4D\u6C14\u6CE1\u3002execResult:", execResult);
    if (currentSystemMsgContent) {
      const tip = execResult?.reason ? `(\u5DF2\u53D6\u6D88\uFF1A${escapeHTML(execResult.reason)})` : "(\u5DF2\u53D6\u6D88\uFF1A\u8F93\u5165\u5185\u5BB9\u4E3A\u7A7A\u6216\u5DF2\u88AB\u5B89\u5168\u8FC7\u6EE4)";
      currentSystemMsgContent.html(`<i><span style="color:var(--st-chatu8-text-secondary);">${tip}</span></i>`);
    }
    setCurrentSystemMsgElement(null);
    setCurrentSystemMsgContent(null);
    return;
  }
  uiUpdater.callback(accumulatedReply);
  uiUpdater.flush();
  if (resultUpdater) resultUpdater(accumulatedReply);
  console.log(
    "[DEBUG] accumulatedReply length:",
    accumulatedReply.length,
    "hasCommand:",
    hasSystemCommand(accumulatedReply),
    "first 200 chars:",
    accumulatedReply.substring(0, 200)
  );
  console.log("[DEBUG-LLM] flush \u5B8C\u6210, accumulatedReply \u957F\u5EA6:", accumulatedReply?.length);
  if (accumulatedReply) {
    const hasCommand = hasSystemCommand(accumulatedReply);
    const autoExecute = getAutoExecuteMode();
    const isAutoNoCallback = isAutoExecuteNoCallbackOnly(accumulatedReply);
    if (hasCommand && !autoExecute && !isAutoNoCallback) {
      activeChatRef.messages.push({ role: "assistant", content: accumulatedReply });
      activeChatRef.updatedAt = Date.now();
      await syncAndSave(activeChatRef);
      finalizeAssistantMessage(activeChatRef.messages.length - 1, handleRegenerateFn);
      const cmd = createPendingCommand(currentSystemMsgElement, accumulatedReply);
      setPendingCommand(cmd);
      const buttonElement = renderExecuteButton(currentSystemMsgElement);
      cmd.buttonElement = buttonElement;
      setPendingCommand(cmd);
      buttonElement.find("button").on("click", async function() {
        await executePendingCommand(cmd, boundAppendMessage, handleRegenerateFn);
      });
      setCurrentSystemMsgElement(null);
      setCurrentSystemMsgContent(null);
      tryPlayTTS(accumulatedReply, activeChatRef.messages.length - 1);
      return;
    }
    parseAndApplySettings(accumulatedReply);
    const queryResult = await parseQueryWithProgress2(accumulatedReply);
    if (queryResult !== null) {
      if (isAutoNoCallback) {
        console.log("[AI Assistant] \u81EA\u52A8\u6267\u884C\u7C7B\u547D\u4EE4\u5DF2\u6267\u884C\uFF0C\u8DF3\u8FC7 AI \u53CD\u9988");
      } else {
        iterState.currentIteration++;
        if (iterState.currentIteration <= iterState.maxIterations) {
          activeChatRef.messages.push({ role: "assistant", content: accumulatedReply });
          const assistantIndex = activeChatRef.messages.length - 1;
          if (currentSystemMsgElement) {
            currentSystemMsgElement.attr("data-msg-index", assistantIndex);
          }
          activeChatRef.messages.push({ role: "user", content: queryResult });
          const userMsgIndex = activeChatRef.messages.length - 1;
          await boundAppendMessage("user", queryResult, null, userMsgIndex);
          setCurrentSystemMsgElement(null);
          setCurrentSystemMsgContent(null);
          await appendSystemEmptyMessage();
          if (currentSystemMsgContent) {
            currentSystemMsgContent.html('<i><span style="color:var(--st-chatu8-text-secondary);">\u5DF2\u83B7\u53D6\u6700\u65B0\u7CFB\u7EDF\u53C2\u6570\uFF0C\u601D\u8003\u4E2D...</span></i>');
          }
          console.log("[AI Assistant] \u53D1\u751F\u5185\u90E8\u7CFB\u7EDF\u8C03\u7528, \u91CD\u5B9A\u5411\u4E8C\u6B21\u67E5\u8BE2...", queryResult);
          tryPlayTTS(accumulatedReply, activeChatRef.messages.length - 2);
          await runLlmChain(activeChatRef, profileData, requestId, iterState, handleSendFn, handleRegenerateFn, boundAppendMessage);
          return;
        } else {
          if (currentSystemMsgContent) {
            currentSystemMsgContent.html(escapeHTML(accumulatedReply + "\n\n(\u62B1\u6B49\uFF0C\u8C03\u7528\u7CFB\u7EDF\u5DE5\u5177\u6B21\u6570\u5DF2\u8FBE\u4E0A\u9650\uFF0C\u8BF7\u6362\u4E2A\u63D0\u95EE\u65B9\u5F0F)").replace(/\n/g, "<br>"));
          }
        }
      }
    }
    activeChatRef.messages.push({ role: "assistant", content: accumulatedReply });
    activeChatRef.updatedAt = Date.now();
    console.log("[DEBUG-LLM] \u25B6 \u5373\u5C06\u8C03\u7528 syncAndSave()");
    console.log("[DEBUG-LLM]   currentSystemMsgContent \u5728DOM\u4E2D:", currentSystemMsgContent ? $.contains(document, currentSystemMsgContent[0]) : "N/A");
    await syncAndSave(activeChatRef);
    console.log("[DEBUG-LLM] \u25C0 syncAndSave() \u5B8C\u6210");
    console.log("[DEBUG-LLM]   syncAndSave\u540E currentSystemMsgContent \u5728DOM\u4E2D:", currentSystemMsgContent ? $.contains(document, currentSystemMsgContent[0]) : "N/A");
    console.log("[DEBUG-LLM] \u25B6 \u5373\u5C06\u8C03\u7528 finalizeAssistantMessage()");
    finalizeAssistantMessage(activeChatRef.messages.length - 1, handleRegenerateFn);
    console.log("[DEBUG-LLM] \u25C0 finalizeAssistantMessage() \u5B8C\u6210");
    tryPlayTTS(accumulatedReply, activeChatRef.messages.length - 1);
    if (currentSystemMsgElement) {
      detectImageGenerationRequest(currentSystemMsgElement, accumulatedReply);
    }
  }
}

async function generateAiResponse(handleSendFn, handleRegenerateFn, boundAppendMessage) {
  if (!activeChat) return;
  const requestId = "ai-assistant-" + Date.now().toString();
  const profileData = buildProfileData();
  const iterState = { currentIteration: 0, maxIterations: 10 };
  try {
    setIsAiGenerating(true);
    updateSendButtonState();
    notifyAiGenerating();
    await runLlmChain(activeChat, profileData, requestId, iterState, handleSendFn, handleRegenerateFn, boundAppendMessage);
  } catch (error) {
    const errorMsg = error.message || "\u672A\u77E5\u9519\u8BEF";
    if (currentSystemMsgContent) {
      currentSystemMsgContent.html(`<span style="color:red">\u8BF7\u6C42\u51FA\u9519: ${escapeHTML(errorMsg)}</span>`);
    }
    if (isConversationMode()) {
      speakNotification(`\u8BF7\u6C42\u51FA\u9519\uFF1A${errorMsg}`);
    }
  } finally {
    setCurrentSystemMsgElement(null);
    setCurrentSystemMsgContent(null);
    setIsAiGenerating(false);
    updateSendButtonState();
    notifyAiGenerationDone();
  }
}

async function handleRegenerateMessage(messageIndex, handleSendFn, handleRegenerateFn, boundAppendMessage, switchChatFn) {
  if (!activeChat) return;
  if (!Number.isInteger(messageIndex) || messageIndex < 0 || messageIndex >= activeChat.messages.length) return;
  const targetMessage = activeChat.messages[messageIndex];
  if (!targetMessage || targetMessage.role !== "assistant") {
    console.warn("[AI Assistant] handleRegenerateMessage \u76EE\u6807\u6D88\u606F\u4E0D\u662F assistant\uFF0C\u5DF2\u8DF3\u8FC7:", messageIndex, targetMessage);
    return;
  }
  activeChat.messages = activeChat.messages.slice(0, messageIndex);
  activeChat.updatedAt = Date.now();
  await syncAndSave(activeChat);
  await switchChat(activeChat.id, boundAppendMessage);
  await appendSystemEmptyMessage();
  await generateAiResponse(handleSendFn, handleRegenerateFn, boundAppendMessage);
}

async function handleSend(handleSendFn, handleRegenerateFn, boundAppendMessage, switchChatFn) {
  clearPendingCommand();
  dismissAskChoices();
  const text = dom.inputArea.val().trim();
  if (!text && selectedImages2.length === 0) return;
  const editingIndex = dom.inputArea.data("editing-index");
  const isEditing = editingIndex !== void 0 && editingIndex !== null;
  if (isEditing) {
    if (!activeChat || !Number.isInteger(editingIndex) || editingIndex < 0 || editingIndex >= (activeChat.messages?.length || 0)) {
      console.warn("[AI Assistant] \u68C0\u6D4B\u5230\u5931\u6548\u7684 editing-index\uFF0C\u5DF2\u964D\u7EA7\u4E3A\u666E\u901A\u53D1\u9001:", editingIndex);
      dom.inputArea.removeData("editing-index");
      dom.chatBody.find(".st-chatu8-ai-msg").removeClass("editing");
    } else {
      dom.inputArea.removeData("editing-index");
      dom.chatBody.find(".st-chatu8-ai-msg").removeClass("editing");
      await handleEditAndRegenerate(editingIndex, text, handleSendFn, handleRegenerateFn, boundAppendMessage, switchChatFn);
      return;
    }
  }
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  const apiKey = (aiConfig.api_key || "").trim();
  if (!apiKey) {
    toastr?.error("\u672A\u914D\u7F6E\u667A\u7ED8\u59EC API Key\uFF0C\u8BF7\u70B9\u51FB\u9F7F\u8F6E\u56FE\u6807\u8BBE\u7F6E\u3002");
    return;
  }
  if (!activeChat) {
    await startNewChat(boundAppendMessage);
  }
  const currentChat = activeChat;
  let screenCaptures = [];
  try {
    screenCaptures = await captureForMessage();
    if (screenCaptures.length > 0) {
      console.log(`[AI Assistant] \u81EA\u52A8\u9644\u52A0 ${screenCaptures.length} \u5F20\u622A\u56FE`);
    }
  } catch (err) {
    console.warn("[AI Assistant] \u81EA\u52A8\u622A\u56FE\u5931\u8D25:", err.message);
  }
  const allImages = [...selectedImages2, ...screenCaptures];
  let imageRefs = [];
  if (allImages.length > 0) {
    imageRefs = await _saveImagesAndGetRefs(allImages, currentChat.id);
  }
  const messageContent = text || (allImages.length > 0 ? "\u8BF7\u5206\u6790\u8FD9\u4E9B\u56FE\u7247" : "");
  if (currentChat.messages.length === 0) {
    const titleText = text || "\u56FE\u7247\u5BF9\u8BDD";
    currentChat.title = titleText.substring(0, 15) + (titleText.length > 15 ? "..." : "");
  }
  const newMessage = {
    role: "user",
    content: messageContent
  };
  if (imageRefs.length > 0) {
    newMessage.imageRefs = imageRefs;
  }
  currentChat.messages.push(newMessage);
  const currentMessageIndex = currentChat.messages.length - 1;
  await boundAppendMessage("user", text, allImages.length > 0 ? [...allImages] : null, currentMessageIndex);
  dom.inputArea.val("");
  adjustInputHeight();
  currentChat.updatedAt = Date.now();
  await syncAndSave(currentChat);
  clearImageSelection();
  appendSystemEmptyMessage();
  const requestId = "ai-assistant-" + Date.now().toString();
  const profileData = buildProfileData();
  const iterState = { currentIteration: 0, maxIterations: 10 };
  try {
    setIsAiGenerating(true);
    updateSendButtonState();
    notifyAiGenerating();
    await runLlmChain(currentChat, profileData, requestId, iterState, handleSendFn, handleRegenerateFn, boundAppendMessage);
  } catch (error) {
    const errorMsg = error.message || "\u672A\u77E5\u9519\u8BEF";
    if (currentSystemMsgContent) {
      currentSystemMsgContent.html(`<span style="color:red">\u8BF7\u6C42\u51FA\u9519: ${escapeHTML(errorMsg)}</span>`);
    }
    if (isConversationMode()) {
      speakNotification(`\u8BF7\u6C42\u51FA\u9519\uFF1A${errorMsg}`);
    }
  } finally {
    setCurrentSystemMsgElement(null);
    setCurrentSystemMsgContent(null);
    setIsAiGenerating(false);
    updateSendButtonState();
    notifyAiGenerationDone();
  }
}

async function handleEditAndRegenerate(editingIndex, newText, handleSendFn, handleRegenerateFn, boundAppendMessage, switchChatFn) {
  if (!activeChat) return;
  const currentChat = activeChat;
  if (!Number.isInteger(editingIndex) || editingIndex < 0 || editingIndex >= (currentChat.messages?.length || 0)) {
    console.warn("[AI Assistant] handleEditAndRegenerate \u6536\u5230\u65E0\u6548 editingIndex\uFF0C\u5DF2\u53D6\u6D88\u7F16\u8F91\u91CD\u53D1:", editingIndex);
    return;
  }
  let editScreenCaptures = [];
  try {
    editScreenCaptures = await captureForMessage();
    if (editScreenCaptures.length > 0) {
      console.log(`[AI Assistant] \u7F16\u8F91\u91CD\u53D1\uFF1A\u81EA\u52A8\u9644\u52A0 ${editScreenCaptures.length} \u5F20\u622A\u56FE`);
    }
  } catch (err) {
    console.warn("[AI Assistant] \u7F16\u8F91\u91CD\u53D1\uFF1A\u81EA\u52A8\u622A\u56FE\u5931\u8D25:", err.message);
  }
  const allEditImages = [...selectedImages2, ...editScreenCaptures];
  let imageRefs = [];
  if (allEditImages.length > 0) {
    imageRefs = await _saveImagesAndGetRefs(allEditImages, currentChat.id);
  }
  const messageContent = newText || (allEditImages.length > 0 ? "\u8BF7\u5206\u6790\u8FD9\u4E9B\u56FE\u7247" : "");
  const newMessage = {
    role: "user",
    content: messageContent
  };
  if (imageRefs.length > 0) {
    newMessage.imageRefs = imageRefs;
  }
  currentChat.messages[editingIndex] = newMessage;
  currentChat.messages = currentChat.messages.slice(0, editingIndex + 1);
  currentChat.updatedAt = Date.now();
  await syncAndSave(currentChat);
  const editingEl = dom.chatBody.find(`.st-chatu8-ai-msg[data-msg-index="${editingIndex}"]`);
  if (editingEl.length > 0) {
    editingEl.nextAll(".st-chatu8-ai-msg").remove();
    editingEl.remove();
  } else {
    dom.chatBody.find(".st-chatu8-ai-msg").filter(function() {
      const idx = parseInt($(this).attr("data-msg-index"));
      return isNaN(idx) || idx >= editingIndex;
    }).remove();
  }
  const newTotal = currentChat.messages.length;
  updateScrollStateAfterEdit(newTotal);
  const editedImages = allEditImages.length > 0 ? allEditImages : null;
  await boundAppendMessage(newMessage.role, newMessage.content, editedImages, editingIndex, false);
  dom.chatBody.scrollTop(dom.chatBody[0].scrollHeight);
  dom.inputArea.val("");
  adjustInputHeight();
  clearImageSelection();
  appendSystemEmptyMessage();
  const requestId = "ai-assistant-" + Date.now().toString();
  const profileData = buildProfileData();
  const iterState = { currentIteration: 0, maxIterations: 10 };
  try {
    setIsAiGenerating(true);
    updateSendButtonState();
    notifyAiGenerating();
    await runLlmChain(currentChat, profileData, requestId, iterState, handleSendFn, handleRegenerateFn, boundAppendMessage);
  } catch (error) {
    const errorMsg = error.message || "\u672A\u77E5\u9519\u8BEF";
    if (currentSystemMsgContent) {
      currentSystemMsgContent.html(`<span style="color:red">\u8BF7\u6C42\u51FA\u9519: ${escapeHTML(errorMsg)}</span>`);
    }
    if (isConversationMode()) {
      speakNotification(`\u8BF7\u6C42\u51FA\u9519\uFF1A${errorMsg}`);
    }
  } finally {
    setCurrentSystemMsgElement(null);
    setCurrentSystemMsgContent(null);
    setIsAiGenerating(false);
    updateSendButtonState();
    notifyAiGenerationDone();
  }
}

function initInputEvents(handleSendFn) {
  dom.inputArea.on("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendFn();
    }
  });
  dom.inputArea.on("input", adjustInputHeight);
  dom.sendBtn.on("click", function() {
    if (isAiGenerating) {
      abortLLMChannelRequest("assistant");
    } else {
      handleSendFn();
    }
  });
}

export { buildCustomPrefillMessages, handleRegenerateMessage, handleSend, initInputEvents, substituteTemplateVariables };
