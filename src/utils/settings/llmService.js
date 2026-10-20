// 还原自打包产物 — 原始模块: utils/settings/llmService.js
import { eventSource } from "../../../../../../../script.js";
import { extension_settings } from "../../../../../../extensions.js";
import { LLMRequestTypes, eventNames, extensionName } from "../config.js";
import { addLog, getRequestHeaders, prepareImageForUpload } from "../utils.js";
import { TaskStatus, TaskType, taskQueue } from "../taskQueue.js";
import { applyWordReplacement } from "../wordReplacementService.js";
import { checkTriggerWords, dropKnownEmptyMessages, mergeAdjacentMessages, processVariablePlaceholdersInMessages, stripPresetComments } from "../promptProcessor.js";
import { startFabLoading, stopFabLoading } from "./fab.js";
import { getGlobalTailMessagesConfig, getGlobalToolCallConfig, transformToolCallRequest } from "./toolCallService.js";
import { processRollPlaceholders } from "./rollProcessor.js";
import { buildVertexEndpoint, convertOpenAIToVertexGemini, convertVertexSSEToOpenAIChunk, convertVertexToOpenAIResponse, getVertexAccessToken } from "./vertexService.js";
import { StreamToolCallParser, normalizeNonStreamingToolCall } from "./toolCallDecoder.js";

var AI_REPLACEMENT_REQUEST_TYPES, REQUEST_TYPE_NAMES, _reqSeq, activeRequests, fabLoadingRefCount, llmTaskControllers;

activeRequests = /* @__PURE__ */ new Map();

llmTaskControllers = /* @__PURE__ */ new Map();

fabLoadingRefCount = 0;

_reqSeq = 0;

eventSource.on("st_chatu8_cancel_llm_task", ({ taskId }) => {
      const controller = llmTaskControllers.get(taskId);
      if (controller) {
        controller.abort();
        llmTaskControllers.delete(taskId);
        console.log(`[LLM] \u4EFB\u52A1\u5DF2\u53D6\u6D88: ${taskId}`);
      }
    });

REQUEST_TYPE_NAMES = {
      "image_gen": "\u6B63\u6587\u56FE\u7247\u751F\u6210",
      "char_design": "\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1",
      "char_display": "\u89D2\u8272/\u670D\u88C5\u5C55\u793A",
      "char_modify": "\u89D2\u8272/\u670D\u88C5\u4FEE\u6539",
      "translation": "\u7FFB\u8BD1",
      "tag_modify": "Tag\u4FEE\u6539",
      "ai_assistant": "\u667A\u7ED8\u59EC\u52A9\u624B",
      "persona_gen": "\u4EBA\u8BBE\u751F\u6210",
      "user_persona_gen": "User\u4EBA\u8BBE\u751F\u6210",
      "visual_mat_prep": "\u89C6\u6750\u51C6\u5907",
      "video_gen": "\u56FE\u751F\u89C6\u9891",
      "video_asset_gen": "\u89C6\u9891\u8D44\u4EA7\u751F\u6210"
    };

AI_REPLACEMENT_REQUEST_TYPES = /* @__PURE__ */ new Set([
      LLMRequestTypes.CHAR_DESIGN,
      LLMRequestTypes.CHAR_DISPLAY,
      LLMRequestTypes.CHAR_MODIFY,
      LLMRequestTypes.TRANSLATION,
      LLMRequestTypes.TAG_MODIFY,
      LLMRequestTypes.PERSONA_GEN,
      LLMRequestTypes.USER_PERSONA_GEN
    ]);

function createThrottledUIUpdater(updateResultUI, intervalMs = 120) {
  if (typeof updateResultUI !== "function") {
    return { update: () => {
    }, flush: () => {
    } };
  }
  let lastTime = 0;
  let timer = null;
  let lastContent = "";
  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastTime = Date.now();
    updateResultUI(lastContent);
  };
  const update = (content) => {
    lastContent = content;
    const now = Date.now();
    if (now - lastTime >= intervalMs) {
      flush();
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        lastTime = Date.now();
        updateResultUI(lastContent);
      }, intervalMs - (now - lastTime));
    }
  };
  return { update, flush };
}

function generateRequestKey(prefix) {
  return `${prefix}_${Date.now()}_${++_reqSeq}`;
}

function acquireFabLoading() {
  fabLoadingRefCount++;
  if (fabLoadingRefCount === 1) {
    startFabLoading();
  }
}

function releaseFabLoading() {
  fabLoadingRefCount--;
  if (fabLoadingRefCount <= 0) {
    fabLoadingRefCount = 0;
    stopFabLoading();
  }
}

function getLLMRequestController() {
  for (const entry of activeRequests.values()) {
    if (entry.controller) return entry.controller;
  }
  return null;
}

function setLLMRequestController(controller) {
}

function isLLMRequestActive() {
  return activeRequests.size > 0;
}

function getActiveLLMRequestCount() {
  return activeRequests.size;
}

function abortLLMRequest() {
  if (activeRequests.size === 0) return;
  for (const [key, entry] of activeRequests) {
    entry.controller.abort();
  }
  activeRequests.clear();
  toastr.info("\u6240\u6709 LLM \u8BF7\u6C42\u5DF2\u4E2D\u6B62\u3002");
}

function abortLLMChannelRequest(channel) {
  let aborted = false;
  for (const [key, entry] of activeRequests) {
    if (entry.channel === channel || entry.requestType === channel) {
      entry.controller.abort();
      activeRequests.delete(key);
      aborted = true;
    }
  }
  return aborted;
}

function isNonRetryableError(error) {
  if (!error) return false;
  if (error.name === "AbortError" || error.message?.includes("aborted") || error.message?.includes("Request aborted")) {
    return true;
  }
  const errorMsg = error.message || String(error);
  const lower = errorMsg.toLowerCase();
  if (errorMsg.includes("\u672A\u914D\u7F6E")) {
    return true;
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden") || lower.includes("invalid_api_key") || lower.includes("invalid api key")) {
    return true;
  }
  if (lower.includes("insufficient_quota") || lower.includes("quota") || lower.includes("balance") || lower.includes("credit") || lower.includes("\u6B20\u8D39") || lower.includes("\u989D\u5EA6\u4E0D\u8DB3")) {
    return true;
  }
  return false;
}

function shouldRetryError(error, attempt, maxRetries) {
  if (attempt >= maxRetries) return false;
  if (isNonRetryableError(error)) return false;
  return true;
}

function isEmptyResponse(reply) {
  return !reply || reply.trim() === "";
}

function extractApiErrorMessage(response, raw) {
  let errorDetail = "";
  let parsedJson = null;
  let isSillyTavernProxyError = false;
  if (typeof raw === "object" && raw !== null) {
    parsedJson = raw;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        parsedJson = JSON.parse(trimmed);
      } catch (_e) {
      }
    }
  }
  if (parsedJson) {
    if (parsedJson.error) {
      if (typeof parsedJson.error === "object" && parsedJson.error !== null) {
        errorDetail = parsedJson.error.message || JSON.stringify(parsedJson.error);
        const meta = [];
        if (parsedJson.error.type) meta.push(`\u7C7B\u578B: ${parsedJson.error.type}`);
        if (parsedJson.error.code) meta.push(`\u4EE3\u7801: ${parsedJson.error.code}`);
        if (meta.length > 0) errorDetail += ` (${meta.join(", ")})`;
      } else if (parsedJson.error === true) {
        isSillyTavernProxyError = true;
        errorDetail = "\u9152\u9986\u540E\u7AEF\u4EE3\u7406\u8FDE\u63A5\u5931\u8D25\uFF1AAPI Key \u9519\u8BEF/\u65E0\u6548\uFF0C\u6216 API \u5730\u5740\u65E0\u6CD5\u8FDE\u63A5 (401/404)";
      } else {
        errorDetail = String(parsedJson.error);
      }
    } else if (parsedJson.detail) {
      if (Array.isArray(parsedJson.detail)) {
        errorDetail = parsedJson.detail.map((d) => typeof d === "object" ? d.msg || JSON.stringify(d) : String(d)).join("; ");
      } else if (typeof parsedJson.detail === "object") {
        errorDetail = JSON.stringify(parsedJson.detail);
      } else {
        errorDetail = String(parsedJson.detail);
      }
    } else if (parsedJson.message) {
      errorDetail = String(parsedJson.message);
    } else if (parsedJson.msg) {
      errorDetail = String(parsedJson.msg);
    } else if (parsedJson.error_msg) {
      errorDetail = String(parsedJson.error_msg);
    } else if (Array.isArray(parsedJson.errors) && parsedJson.errors.length > 0) {
      errorDetail = parsedJson.errors.map((e) => typeof e === "object" ? e.message || JSON.stringify(e) : String(e)).join("; ");
    }
  }
  if (!errorDetail && typeof raw === "string" && raw.trim()) {
    const text = raw.trim();
    if (/<[a-z][\s\S]*>/i.test(text)) {
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      const h1Match = text.match(/<h1>([^<]+)<\/h1>/i);
      if (titleMatch && titleMatch[1]) {
        errorDetail = `[\u7F51\u9875\u8FD4\u56DE] ${titleMatch[1].trim()}`;
      } else if (h1Match && h1Match[1]) {
        errorDetail = `[\u7F51\u9875\u8FD4\u56DE] ${h1Match[1].trim()}`;
      } else {
        const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        errorDetail = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
      }
    } else {
      errorDetail = text.length > 300 ? text.substring(0, 300) + "..." : text;
    }
  }
  const isOkWithProxyErr = response && response.status === 200 && isSillyTavernProxyError;
  const statusText = response && !isOkWithProxyErr ? `${response.status} ${response.statusText || ""}`.trim() : "";
  let finalMsg = errorDetail ? statusText ? `[${statusText}] ${errorDetail}` : errorDetail : `\u8BF7\u6C42\u5931\u8D25: ${statusText || "\u672A\u77E5\u9519\u8BEF"}`;
  const lower = finalMsg.toLowerCase();
  const suggestions = [];
  if (isSillyTavernProxyError) {
    suggestions.push("\u8BF7\u68C0\u67E5\u586B\u5199\u7684 API Key \u662F\u5426\u6709\u8BEF\uFF0CAPI \u57FA\u7840\u5730\u5740\u662F\u5426\u6B63\u786E\uFF08\u5982\u7F3A\u5C11 /v1\uFF09\uFF0C\u6216\u5C1D\u8BD5\u52FE\u9009\u300C\u76F4\u63A5\u8BF7\u6C42 (\u4E0D\u901A\u8FC7\u9152\u9986\u4EE3\u7406)\u300D");
  }
  if (lower.includes("context_length") || lower.includes("maximum context") || lower.includes("token") && (lower.includes("limit") || lower.includes("exceed") || lower.includes("too large") || lower.includes("greater than"))) {
    suggestions.push("\u4E0A\u4E0B\u6587\u8D85\u51FA\u6A21\u578B\u4E0A\u9650\uFF0C\u5EFA\u8BAE\u8C03\u5C0F max_tokens\u3001\u51CF\u5C11\u9644\u52A0\u4FE1\u606F\u6216\u5207\u6362\u5927\u4E0A\u4E0B\u6587\u6A21\u578B");
  }
  if (lower.includes("image") || lower.includes("vision") || lower.includes("multimodal") || lower.includes("image_url")) {
    suggestions.push("\u5F53\u524D\u6A21\u578B\u53EF\u80FD\u4E0D\u652F\u6301\u56FE\u7247\u8F93\u5165\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u5173\u95ED\u300C\u53D1\u9001\u56FE\u7247\u300D\u6216\u66F4\u6362\u89C6\u89C9\u591A\u6A21\u6001\u6A21\u578B");
  }
  if (lower.includes("role") || lower.includes("system") || lower.includes("consecutive") || lower.includes("alternate") || lower.includes("must alternate")) {
    suggestions.push("\u6D88\u606F\u683C\u5F0F\u6216\u89D2\u8272\u987A\u5E8F\u4E0D\u517C\u5BB9\uFF0C\u8BF7\u5C1D\u8BD5\u5F00\u542F\u300C\u5408\u5E76\u76F8\u90BB\u6D88\u606F\u300D\u6216\u300C\u5408\u5E76 System \u5230 User\u300D");
  }
  if (lower.includes("quota") || lower.includes("balance") || lower.includes("credit") || lower.includes("insufficient") || lower.includes("\u6B20\u8D39") || lower.includes("\u989D\u5EA6")) {
    suggestions.push("API \u8D26\u6237\u989D\u5EA6\u4E0D\u8DB3\u6216\u5DF2\u6B20\u8D39");
  }
  if (lower.includes("model") && (lower.includes("not found") || lower.includes("does not exist") || lower.includes("invalid_model"))) {
    suggestions.push("\u6A21\u578B\u540D\u79F0\u4E0D\u5B58\u5728\u6216\u4E2D\u8F6C\u7F51\u5173\u672A\u6620\u5C04\u8BE5\u6A21\u578B");
  }
  if (suggestions.length > 0) {
    finalMsg += `
\u{1F4A1} \u5EFA\u8BAE: ${suggestions.join("\uFF1B")}`;
  }
  return finalMsg;
}

function countImageParts(messages) {
  if (!Array.isArray(messages)) return 0;
  let count = 0;
  for (const msg of messages) {
    if (msg && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part && part.type === "image_url") count++;
      }
    }
  }
  return count;
}

function stripImagesFromMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  const stripped = messages.map((msg) => {
    if (!msg || !Array.isArray(msg.content)) return msg;
    const filtered = msg.content.filter((part) => part && part.type !== "image_url");
    if (filtered.length === 1 && filtered[0].type === "text") {
      return { ...msg, content: filtered[0].text || "" };
    }
    if (filtered.length === 0) {
      return { ...msg, content: "" };
    }
    return { ...msg, content: filtered };
  });
  return dropKnownEmptyMessages(stripped);
}

async function processImagesInMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  const processedMessages = [];
  for (const msg of messages) {
    if (!msg || !Array.isArray(msg.content)) {
      processedMessages.push(msg);
      continue;
    }
    const newContent = [];
    for (const part of msg.content) {
      if (part && part.type === "image_url" && part.image_url?.url) {
        try {
          const origUrl = part.image_url.url;
          const processed = await prepareImageForUpload(origUrl);
          newContent.push({
            ...part,
            image_url: {
              ...part.image_url,
              url: processed.dataUrl
            }
          });
        } catch (err) {
          console.warn("[LLMService] \u9884\u5904\u7406\u6D88\u606F\u4E2D\u7684\u56FE\u7247\u5931\u8D25\uFF0C\u4FDD\u7559\u539F\u56FE:", err);
          newContent.push(part);
        }
      } else {
        newContent.push(part);
      }
    }
    processedMessages.push({ ...msg, content: newContent });
  }
  return processedMessages;
}

function formatPromptForDisplay(prompt2) {
  if (typeof prompt2 === "string") {
    return prompt2;
  }
  if (Array.isArray(prompt2)) {
    const formattedLines = [];
    prompt2.forEach((message, index) => {
      const role = message.role || "unknown";
      const roleLabel = getRoleLabel(role);
      formattedLines.push(`${"\u2550".repeat(50)}`);
      formattedLines.push(`\u3010${roleLabel}\u3011`);
      formattedLines.push(`${"\u2500".repeat(50)}`);
      const content = message.content;
      if (typeof content === "string") {
        formattedLines.push(content);
      } else if (Array.isArray(content)) {
        content.forEach((part) => {
          if (part.type === "text") {
            formattedLines.push(part.text || "");
          } else if (part.type === "image_url") {
            const imageUrl = part.image_url?.url || "";
            if (imageUrl.startsWith("data:")) {
              const mimeMatch = imageUrl.match(/^data:([^;]+);/);
              const mimeType = mimeMatch ? mimeMatch[1] : "unknown";
              const base64Part = imageUrl.split(",")[1] || "";
              const sizeKB = Math.round(base64Part.length * 3 / 4 / 1024);
              formattedLines.push(`\u{1F4F7} [\u7528\u6237\u4E0A\u4F20\u7684\u56FE\u7247: ${mimeType}, \u7EA6 ${sizeKB}KB]`);
            } else {
              formattedLines.push(`\u{1F4F7} [\u56FE\u7247\u94FE\u63A5: ${imageUrl}]`);
            }
          }
        });
      }
      formattedLines.push("");
    });
    return formattedLines.join("\n");
  }
  if (typeof prompt2 === "object" && prompt2 !== null) {
    return JSON.stringify(prompt2, null, 2);
  }
  return String(prompt2);
}

function getRoleLabel(role) {
  const roleMap = {
    "system": "\u7CFB\u7EDF\u63D0\u793A\u8BCD",
    "user": "\u7528\u6237",
    "assistant": "AI\u52A9\u624B",
    "function": "\u51FD\u6570\u8C03\u7528",
    "tool": "\u5DE5\u5177"
  };
  return roleMap[role] || role;
}

function getCurrentLLMProfile() {
  const profiles = extension_settings[extensionName].llm_profiles || {};
  const currentProfileName = extension_settings[extensionName].current_llm_profile;
  return profiles[currentProfileName] || profiles[Object.keys(profiles)[0]] || {};
}

function getCurrentTestContext() {
  const contexts = extension_settings[extensionName].test_context_profiles || {};
  const currentContextName = extension_settings[extensionName].current_test_context_profile;
  return contexts[currentContextName] || contexts[Object.keys(contexts)[0]] || {};
}

function getMergeOptionsForRequestType(requestType) {
  const configs = extension_settings[extensionName].llm_request_type_configs || {};
  const typeConfig = configs[requestType] || { api_profile: "\u9ED8\u8BA4" };
  const apiProfileName = typeConfig.api_profile || "\u9ED8\u8BA4";
  const llmProfiles = extension_settings[extensionName].llm_profiles || {};
  const apiProfile = llmProfiles[apiProfileName] || llmProfiles[Object.keys(llmProfiles)[0]] || {};
  return {
    mergeSystemUser: apiProfile.merge_system_user ?? false
  };
}

function parseCustomHeaders(text) {
  if (!text || typeof text !== "string") return {};
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const result = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (k && v !== void 0 && v !== null) {
            result[String(k).trim()] = String(v).trim();
          }
        }
        return result;
      }
    } catch (_e) {
    }
  }
  const lines = trimmed.split(/\r?\n/);
  const headers = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1);
      }
      if (key) {
        headers[key] = val;
      }
    }
  }
  return headers;
}

function buildProxyIncludeHeaders(apiKey, customHeaders = {}) {
  const headerMap = {};
  const cleanApiKey = typeof apiKey === "string" ? apiKey.trim() : apiKey ? String(apiKey).trim() : "";
  if (cleanApiKey) {
    headerMap["Authorization"] = `Bearer ${cleanApiKey}`;
  }
  if (customHeaders && typeof customHeaders === "object") {
    for (const [k, v] of Object.entries(customHeaders)) {
      if (k && v !== void 0 && v !== null) {
        headerMap[k] = String(v);
      }
    }
  }
  return Object.entries(headerMap).map(([k, v]) => `${k}: "${String(v).replace(/"/g, '\\"')}"`).join("\n");
}

function parseCustomBody(text) {
  if (!text || typeof text !== "string") return {};
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    console.warn("st-chatu8 [\u9644\u52A0\u53C2\u6570\u89E3\u6790\u5931\u8D25]:", e);
    return {};
  }
}

function getEffectiveConfigForRequestType(requestType) {
  const configs = extension_settings[extensionName].llm_request_type_configs || {};
  const typeConfig = configs[requestType] || { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" };
  const llmProfiles = extension_settings[extensionName].llm_profiles || {};
  const contextProfiles = extension_settings[extensionName].test_context_profiles || {};
  const apiProfileName = typeConfig.api_profile || "\u9ED8\u8BA4";
  const apiProfile = llmProfiles[apiProfileName] || llmProfiles[Object.keys(llmProfiles)[0]] || {};
  const contextProfileName = typeConfig.context_profile || "\u9ED8\u8BA4";
  const contextProfile = contextProfiles[contextProfileName] || contextProfiles[Object.keys(contextProfiles)[0]] || {};
  return {
    apiProfileName,
    // LLM API 配置
    api_url: (apiProfile.api_url || "").trim(),
    api_key: (apiProfile.api_key || "").trim(),
    model: (apiProfile.model || "").trim(),
    temperature: apiProfile.temperature ?? 0.7,
    enable_temperature: apiProfile.enable_temperature ?? true,
    top_p: apiProfile.top_p ?? 1,
    enable_top_p: apiProfile.enable_top_p ?? true,
    max_tokens: apiProfile.max_tokens ?? 512,
    enable_max_tokens: apiProfile.enable_max_tokens ?? true,
    reasoning_effort: typeof apiProfile.reasoning_effort === "string" ? apiProfile.reasoning_effort.trim() : "",
    stream: apiProfile.stream ?? false,
    bypass_proxy: apiProfile.bypass_proxy ?? false,
    send_images: apiProfile.send_images ?? false,
    custom_headers: apiProfile.custom_headers || "",
    enable_custom_headers: apiProfile.enable_custom_headers ?? false,
    custom_body_params: apiProfile.custom_body_params || "",
    enable_custom_body_params: apiProfile.enable_custom_body_params ?? false,
    // Vertex 专属字段
    channel_type: apiProfile.channel_type || "openai",
    vertex_credentials: apiProfile.vertex_credentials || null,
    vertex_location: (apiProfile.vertex_location || "us-central1").trim(),
    vertex_model: (apiProfile.vertex_model || "gemini-2.5-flash").trim(),
    // 统一使用插件全局自定义 Tool 工具配置与末尾多 Role 消息配置
    tool_call_config: getGlobalToolCallConfig(),
    tail_messages_config: getGlobalTailMessagesConfig(),
    // 上下文配置
    context: contextProfile
  };
}

function buildPromptForRequestType(requestType, triggerText = "") {
  const configs = extension_settings[extensionName].llm_request_type_configs || {};
  const typeConfig = configs[requestType] || { context_profile: "\u9ED8\u8BA4" };
  const contextProfileName = typeConfig.context_profile || "\u9ED8\u8BA4";
  const contextProfiles = extension_settings[extensionName].test_context_profiles || {};
  const contextProfile = contextProfiles[contextProfileName] || contextProfiles[Object.keys(contextProfiles)[0]] || {};
  const messages = [];
  if (contextProfile.entries && Array.isArray(contextProfile.entries)) {
    contextProfile.entries.forEach((entry) => {
      if (!entry.enabled) return;
      const cleanContent = stripPresetComments(entry.content);
      if (!cleanContent) return;
      if (entry.triggerMode === "trigger") {
        if (!triggerText || !checkTriggerWords(entry.triggerWords, triggerText)) {
          return;
        }
        if (entry.andTriggerWords && entry.andTriggerWords.trim() !== "") {
          if (!checkTriggerWords(entry.andTriggerWords, triggerText)) {
            return;
          }
        }
      }
      messages.push({ role: entry.role || "user", content: cleanContent });
    });
  } else if (contextProfile.history && Array.isArray(contextProfile.history)) {
    contextProfile.history.forEach((h) => {
      const cleanUser = stripPresetComments(h.user);
      if (cleanUser) {
        messages.push({ role: "user", content: cleanUser });
      }
      const cleanAssistant = stripPresetComments(h.assistant);
      if (cleanAssistant) {
        messages.push({ role: "assistant", content: cleanAssistant });
      }
    });
  }
  const mergeOptions = getMergeOptionsForRequestType(requestType);
  const mergedMessages = mergeAdjacentMessages(messages, mergeOptions);
  const processedMessages = processRollPlaceholders(mergedMessages);
  const finalMessages = processVariablePlaceholdersInMessages(processedMessages);
  return finalMessages;
}

function shouldApplyAiReplacement(requestType) {
  return AI_REPLACEMENT_REQUEST_TYPES.has(requestType);
}

async function executeTypedLLMRequest(data, requestType, responseEventName, updateResultUI = null) {
  const { prompt: prompt2, id } = data;
  if (!id || !prompt2) return;
  const typeName = REQUEST_TYPE_NAMES[requestType] || requestType;
  const maxRetries = extension_settings[extensionName].llm_retry_count ?? 0;
  let attempt = 0;
  let lastError = null;
  let taskId = null;
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const signal = controller.signal;
    const requestKey = generateRequestKey(`typed_${requestType}`);
    activeRequests.set(requestKey, {
      controller,
      kind: "typed",
      requestType,
      id
    });
    if (attempt === 0) {
      taskId = taskQueue.addTask({
        name: `LLM: ${typeName}`,
        type: TaskType.LLM,
        prompt: id
      });
      llmTaskControllers.set(taskId, controller);
      taskQueue.updateStatus(taskId, TaskStatus.RUNNING);
      acquireFabLoading();
    } else {
      if (taskId) {
        llmTaskControllers.set(taskId, controller);
      }
    }
    const isAiAssistantRequest = String(id).startsWith("ai-assistant-") || String(id).length === 13;
    if (!isAiAssistantRequest && attempt === 0) {
      addLog(`===== LLM \u8BF7\u6C42\u5F00\u59CB (${typeName}) [${requestKey}] =====`);
      addLog(`\u8BF7\u6C42 ID: ${id}`);
      addLog(`\u53D1\u9001\u7684 Prompt:`);
      addLog(formatPromptForDisplay(prompt2));
    }
    if (attempt > 0) {
      const retryMsg = `\u7B2C ${attempt} \u6B21\u91CD\u8BD5\uFF08\u5171 ${maxRetries} \u6B21\uFF09...`;
      console.log(`[LLM Retry] ${typeName} ${retryMsg}`);
      if (!isAiAssistantRequest) {
        addLog(`\u23F3 ${retryMsg}`);
      }
      if (updateResultUI) {
        updateResultUI(`${retryMsg}
\u6B63\u5728\u5904\u7406 ${typeName} \u8BF7\u6C42\uFF0C\u8BF7\u7A0D\u5019...`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    }
    const config = getEffectiveConfigForRequestType(requestType);
    const { api_url, api_key, model, temperature, top_p, max_tokens, stream, bypass_proxy, send_images } = config;
    try {
      const _typeCfg = (extension_settings[extensionName].llm_request_type_configs || {})[requestType] || {};
      const _apiProfileName = _typeCfg.api_profile || "\u9ED8\u8BA4";
      const _imgCount = countImageParts(prompt2);
      console.warn(
        `[\u53D1\u9001\u56FE\u7247\u8BCA\u65AD] requestType=${requestType} | api_profile="${_apiProfileName}" | send_images=${send_images} | prompt \u4E2D\u56FE\u7247\u6570=${_imgCount} | \u5C06${send_images ? "\u4FDD\u7559" : "\u5265\u79BB"}\u56FE\u7247`
      );
    } catch (_e) {
    }
    const outboundMessages = send_images ? await processImagesInMessages(prompt2) : stripImagesFromMessages(prompt2);
    let cleanedMessages = dropKnownEmptyMessages(outboundMessages);
    cleanedMessages = mergeAdjacentMessages(cleanedMessages);
    cleanedMessages = processVariablePlaceholdersInMessages(cleanedMessages);
    cleanedMessages = dropKnownEmptyMessages(cleanedMessages);
    cleanedMessages = mergeAdjacentMessages(cleanedMessages);
    const firstRole = cleanedMessages[0]?.role;
    const isFirstRoleInvalid = firstRole === "assistant" || firstRole === "tool" || firstRole === "function";
    if (!cleanedMessages || cleanedMessages.length === 0 || isFirstRoleInvalid) {
      const emptyErr = isFirstRoleInvalid ? `${typeName}: \u8D77\u59CB\u6D88\u606F\u9000\u5316\u4E3A\u975E\u6CD5\u7684 ${firstRole} \u89D2\u8272\uFF08\u524D\u7F6E\u8F93\u5165\u5DF2\u88AB\u5B89\u5168\u8FC7\u6EE4\uFF09\uFF0C\u5DF2\u963B\u6B62\u53D1\u9001\u975E\u6CD5\u8BF7\u6C42\u3002` : `${typeName}: \u5904\u7406\u540E\u6240\u6709\u6D88\u606F\u5747\u4E3A\u7A7A\uFF08\u4F8B\u5982\u7EAF\u56FE\u7247\u88AB\u8FC7\u6EE4\uFF09\uFF0C\u5DF2\u963B\u6B62\u53D1\u9001\u7A7A\u8BF7\u6C42\u3002`;
      toastr.warning(emptyErr);
      if (updateResultUI) {
        updateResultUI(emptyErr);
      }
      activeRequests.delete(requestKey);
      if (taskId) {
        taskQueue.completeTask(taskId, false);
        llmTaskControllers.delete(taskId);
      }
      releaseFabLoading();
      eventSource.emit(responseEventName, { success: false, result: emptyErr, id });
      return;
    }
    const isVertexChannel = config.channel_type === "vertex";
    const targetModel = isVertexChannel ? config.vertex_model || "gemini-2.5-flash" : model;
    if (isVertexChannel) {
      if (!config.vertex_credentials || !config.vertex_credentials.client_email) {
        const errorMsg = `${typeName}: Vertex \u6E20\u9053\u672A\u914D\u7F6E\u6709\u6548\u7684 GCP Service Account JSON \u51ED\u636E\u3002`;
        toastr.error(errorMsg);
        activeRequests.delete(requestKey);
        if (taskId) {
          taskQueue.completeTask(taskId, false);
          llmTaskControllers.delete(taskId);
        }
        releaseFabLoading();
        eventSource.emit(responseEventName, { success: false, result: errorMsg, id });
        return;
      }
    } else {
      if (!api_url || !api_key || !model) {
        const errorMsg = `${typeName}: API URL, API Key, \u6216 Model \u672A\u914D\u7F6E\u3002`;
        toastr.error(errorMsg);
        activeRequests.delete(requestKey);
        if (taskId) {
          taskQueue.completeTask(taskId, false);
          llmTaskControllers.delete(taskId);
        }
        releaseFabLoading();
        eventSource.emit(responseEventName, { success: false, result: errorMsg, id });
        return;
      }
    }
    const customApiUrl = api_url ? api_url.replace(/\/$/, "") : "";
    let requestUrl, requestHeaders, requestBody;
    const baseRequestBody = {
      model: targetModel,
      messages: cleanedMessages,
      stream
    };
    if (config.enable_temperature !== false) {
      baseRequestBody.temperature = temperature;
    }
    if (config.enable_top_p !== false) {
      baseRequestBody.top_p = top_p;
    }
    if (config.enable_max_tokens !== false) {
      baseRequestBody.max_tokens = max_tokens;
    }
    // 思考等级：选中档位时随请求发送（空 = 跟随服务端默认）。仅 OpenAI 兼容直连路径真正生效；
    // 酒馆代理路径 /api/backends/chat-completions/generate 会丢弃该字段。
    if (config.reasoning_effort && !isVertexChannel) {
      baseRequestBody.reasoning_effort = config.reasoning_effort;
    }
    if (config.enable_custom_body_params && config.custom_body_params) {
      const extraBody = parseCustomBody(config.custom_body_params);
      Object.assign(baseRequestBody, extraBody);
    }
    const { toolName: syntheticToolName, transformedBody, isToolCallEnabled, toolFields } = transformToolCallRequest(baseRequestBody, config);
    if (transformedBody && Array.isArray(transformedBody.messages)) {
      transformedBody.messages = mergeAdjacentMessages(dropKnownEmptyMessages(transformedBody.messages));
    }
    const isPresetGuide = toolFields?.some((f) => f.name === "display_stream");
    const finalImgCount = countImageParts(transformedBody?.messages);
    console.log(`st-chatu8 [LLM\u8BF7\u6C42] \u7C7B\u578B: ${requestType} (${typeName}), \u6E20\u9053: ${isVertexChannel ? "Vertex" : "OpenAI"}, \u9884\u8BBE: ${config.apiProfileName || "\u9ED8\u8BA4"}, \u6A21\u578B: ${targetModel}, ToolCall: ${isToolCallEnabled ? "\u5DF2\u542F\u7528 (" + syntheticToolName + (isPresetGuide ? " - \u9884\u8BBE\u5185\u5D4C\u5F15\u5BFC" : "") + ")" : "\u5DF2\u5173\u95ED"}, \u56FE\u7247\u6570: ${finalImgCount}, tool_choice: ${transformedBody.tool_choice ? JSON.stringify(transformedBody.tool_choice) : "\u65E0"}`);
    const customHeadersMap = config.enable_custom_headers ? parseCustomHeaders(config.custom_headers) : {};
    if (isVertexChannel) {
      const vertexToken = await getVertexAccessToken(config.vertex_credentials, bypass_proxy);
      requestUrl = buildVertexEndpoint(config.vertex_location, config.vertex_credentials.project_id, targetModel, stream);
      requestHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${vertexToken}`,
        ...customHeadersMap
      };
      requestBody = convertOpenAIToVertexGemini(transformedBody);
    } else if (bypass_proxy) {
      requestUrl = `${customApiUrl}/chat/completions`;
      requestHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${api_key}`,
        ...customHeadersMap
      };
      requestBody = transformedBody;
    } else {
      let proxyBaseUrl = customApiUrl;
      requestUrl = "/api/backends/chat-completions/generate";
      requestHeaders = getRequestHeaders(window.token);
      requestBody = {
        chat_completion_source: "custom",
        custom_url: proxyBaseUrl,
        custom_include_headers: buildProxyIncludeHeaders(api_key, customHeadersMap),
        ...transformedBody
      };
    }
    if (updateResultUI && attempt === 0) {
      updateResultUI(`\u6B63\u5728\u5904\u7406 ${typeName} \u8BF7\u6C42${isToolCallEnabled ? " [Tool Call \u6A21\u5F0F]" : ""}\uFF0C\u8BF7\u7A0D\u5019...`);
    }
    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal
      });
      if (!response.ok) {
        let errorBodyText = "";
        try {
          errorBodyText = await response.text();
        } catch (_readErr) {
        }
        const formattedError = extractApiErrorMessage(response, errorBodyText);
        throw new Error(formattedError);
      }
      let reply = "";
      if (stream) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let hasReasoning = false;
        let reasoningEnded = false;
        const streamToolCallParser = new StreamToolCallParser(syntheticToolName, toolFields);
        const throttledUI = createThrottledUIUpdater(updateResultUI, 120);
        const streamRespId = `chatcmpl-${Date.now()}`;
        const streamCreated = Math.floor(Date.now() / 1e3);
        const handleParsedChunk = (chunk) => {
          const deltaReasoning = chunk.choices?.[0]?.delta?.reasoning_content;
          if (deltaReasoning) {
            hasReasoning = true;
            reply += deltaReasoning;
            throttledUI.update(reply);
          }
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            if (hasReasoning && !reasoningEnded) {
              reply += "\n\n";
              reasoningEnded = true;
            }
            reply += delta;
            throttledUI.update(reply);
          }
          const toolCalls = chunk.choices?.[0]?.delta?.tool_calls;
          if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            const parsedTool = streamToolCallParser.processDeltaToolCalls(toolCalls);
            if (parsedTool.deltaReasoning) {
              hasReasoning = true;
              reply += parsedTool.deltaReasoning;
              throttledUI.update(reply);
            }
            if (parsedTool.deltaContent) {
              if (hasReasoning && !reasoningEnded) {
                reply += "\n\n";
                reasoningEnded = true;
              }
              reply += parsedTool.deltaContent;
              throttledUI.update(reply);
            }
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === "data: [DONE]") continue;
            if (trimmedLine.startsWith("data: ")) {
              try {
                const jsonStr = trimmedLine.slice(6);
                const chunk = isVertexChannel ? convertVertexSSEToOpenAIChunk(jsonStr, targetModel, streamRespId, streamCreated) : JSON.parse(jsonStr);
                if (chunk) {
                  handleParsedChunk(chunk);
                }
              } catch (e) {
                console.warn("\u6D41\u5F0F\u89E3\u6790\u8B66\u544A:", e.message);
              }
            }
          }
        }
        if (buffer.trim() && buffer.trim() !== "data: [DONE]" && buffer.trim().startsWith("data: ")) {
          try {
            const jsonStr = buffer.trim().slice(6);
            const chunk = isVertexChannel ? convertVertexSSEToOpenAIChunk(jsonStr, targetModel, streamRespId, streamCreated) : JSON.parse(jsonStr);
            if (chunk) {
              handleParsedChunk(chunk);
            }
          } catch (e) {
            console.warn("\u6D41\u5F0F\u89E3\u6790\u8B66\u544A (\u6700\u540Ebuffer):", e.message);
          }
        }
        if (hasReasoning && !reasoningEnded) {
          reply += "\n\n";
          reasoningEnded = true;
        }
        if (isToolCallEnabled && isEmptyResponse(reply)) {
          const fallback = streamToolCallParser.getFinalFallback();
          if (fallback.content || fallback.reasoning) {
            reply = fallback.reasoning ? fallback.reasoning + "\n\n" + fallback.content : fallback.content;
          }
        }
        throttledUI.flush();
        if (isEmptyResponse(reply)) {
          if (attempt < maxRetries) {
            lastError = new Error("\u672A\u6536\u5230\u6709\u6548\u56DE\u590D");
            activeRequests.delete(requestKey);
            attempt++;
            continue;
          } else {
            reply = "\u672A\u6536\u5230\u6709\u6548\u56DE\u590D\u3002";
            toastr.warning(`${typeName}: LLM \u8BF7\u6C42\u8FD4\u56DE\u4E3A\u7A7A\uFF08\u5DF2\u91CD\u8BD5 ${maxRetries} \u6B21\uFF09\uFF0C\u53EF\u80FD\u662F\u8BF7\u6C42\u88AB\u622A\u65AD\u3001max_tokens \u8BBE\u7F6E\u8FC7\u5C0F\u3001\u6216 API \u8FDE\u63A5\u95EE\u9898\u3002`);
          }
        }
      } else {
        let rawData = await response.json();
        const responseData = isVertexChannel ? convertVertexToOpenAIResponse(rawData, targetModel) : rawData;
        if (responseData.error || !responseData.choices && (responseData.detail || responseData.message || responseData.msg)) {
          const formattedError = extractApiErrorMessage(response, responseData);
          throw new Error(formattedError);
        }
        if (isToolCallEnabled || responseData.choices?.[0]?.message?.tool_calls) {
          const normResult = normalizeNonStreamingToolCall(responseData, syntheticToolName, toolFields);
          if (normResult.matched || normResult.content) {
            reply = normResult.content;
          } else {
            const reasoning = responseData.choices?.[0]?.message?.reasoning_content || "";
            reply = responseData.choices?.[0]?.message?.content || "";
            if (reasoning) {
              reply = reasoning + "\n\n" + reply;
            }
          }
        } else {
          let reasoning = responseData.choices?.[0]?.message?.reasoning_content || "";
          reply = responseData.choices?.[0]?.message?.content || "";
          if (reasoning) {
            reply = reasoning + "\n\n" + reply;
          }
        }
        if (isEmptyResponse(reply)) {
          if (attempt < maxRetries) {
            lastError = new Error("\u672A\u6536\u5230\u6709\u6548\u56DE\u590D");
            activeRequests.delete(requestKey);
            attempt++;
            continue;
          } else {
            reply = "\u672A\u6536\u5230\u6709\u6548\u56DE\u590D\u3002";
            toastr.warning(`${typeName}: LLM \u8BF7\u6C42\u8FD4\u56DE\u4E3A\u7A7A\uFF08\u5DF2\u91CD\u8BD5 ${maxRetries} \u6B21\uFF09\uFF0C\u53EF\u80FD\u662F\u8BF7\u6C42\u88AB\u622A\u65AD\u3001max_tokens \u8BBE\u7F6E\u8FC7\u5C0F\u3001\u6216 API \u8FDE\u63A5\u95EE\u9898\u3002`);
          }
        }
        if (updateResultUI) {
          updateResultUI(reply);
        }
      }
      if (shouldApplyAiReplacement(requestType)) {
        reply = applyWordReplacement(reply, "ai");
        if (updateResultUI) {
          updateResultUI(reply);
        }
      }
      if (!isAiAssistantRequest) {
        addLog(`
----- LLM \u56DE\u590D -----`);
        addLog(reply);
        if (attempt > 0) {
          addLog(`\u2705 \u91CD\u8BD5\u6210\u529F\uFF08\u7B2C ${attempt} \u6B21\u91CD\u8BD5\uFF09`);
        }
        addLog(`===== LLM \u8BF7\u6C42\u5B8C\u6210 =====`);
      }
      taskQueue.completeTask(taskId, true);
      llmTaskControllers.delete(taskId);
      eventSource.emit(responseEventName, { success: true, result: reply, id, testMode: false });
      activeRequests.delete(requestKey);
      releaseFabLoading();
      return;
    } catch (error) {
      activeRequests.delete(requestKey);
      if (error.name === "AbortError") {
        if (taskId) {
          taskQueue.updateStatus(taskId, TaskStatus.CANCELLED);
          llmTaskControllers.delete(taskId);
        }
        releaseFabLoading();
        eventSource.emit(responseEventName, {
          success: false,
          result: null,
          id,
          error: { name: "AbortError", message: "Request aborted" }
        });
        return;
      }
      if (!isNonRetryableError(error) && shouldRetryError(error, attempt, maxRetries)) {
        lastError = error;
        attempt++;
        console.warn(`[LLM Retry] ${typeName} \u5931\u8D25: ${error.message}\uFF0C\u5C06\u5728 2 \u79D2\u540E\u91CD\u8BD5 (${attempt}/${maxRetries})`);
        if (!isAiAssistantRequest) {
          addLog(`\u26A0\uFE0F \u8BF7\u6C42\u5931\u8D25: ${error.message}`);
        }
        continue;
      }
      console.error(`${typeName} Error:`, error);
      const errorMessage = attempt > 0 ? `\u8BF7\u6C42\u9519\u8BEF\uFF08\u5DF2\u91CD\u8BD5 ${attempt} \u6B21\uFF09: ${error.message}` : `\u8BF7\u6C42\u9519\u8BEF: ${error.message}`;
      if (updateResultUI) {
        updateResultUI(errorMessage);
      }
      toastr.error(errorMessage);
      if (taskId) {
        taskQueue.completeTask(taskId, false);
        llmTaskControllers.delete(taskId);
      }
      releaseFabLoading();
      eventSource.emit(responseEventName, { success: false, result: errorMessage, id });
      return;
    }
  }
  if (taskId) {
    taskQueue.completeTask(taskId, false);
    llmTaskControllers.delete(taskId);
    releaseFabLoading();
  }
}

async function executeDefaultLLMRequest(data, profileData, updateResultUI = null, channel = "default") {
  console.log("[DEBUG-SVC] \u25B6 executeDefaultLLMRequest() \u5F00\u59CB");
  console.log("[DEBUG-SVC]   channel:", channel, ", id:", data?.id);
  console.log("[DEBUG-SVC]   updateResultUI \u662F\u5426\u5B58\u5728:", !!updateResultUI);
  console.log("[DEBUG-SVC]   profileData.bypass_proxy:", profileData?.bypass_proxy);
  console.log("[DEBUG-SVC]   profileData.stream:", profileData?.stream);
  const { prompt: prompt2, id } = data;
  if (!id || !prompt2) {
    console.warn("[DEBUG-SVC] \u26A0 id \u6216 prompt \u4E3A\u7A7A\uFF0C\u76F4\u63A5\u8FD4\u56DE");
    return;
  }
  const maxRetries = extension_settings[extensionName].llm_retry_count ?? 0;
  let attempt = 0;
  let lastError = null;
  let taskId = null;
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const signal = controller.signal;
    const requestKey = generateRequestKey(`default_${channel}`);
    activeRequests.set(requestKey, {
      controller,
      kind: "default",
      channel,
      id
    });
    if (attempt === 0) {
      taskId = taskQueue.addTask({
        name: "LLM: \u5916\u90E8\u8BF7\u6C42",
        type: TaskType.LLM,
        prompt: id
      });
      llmTaskControllers.set(taskId, controller);
      taskQueue.updateStatus(taskId, TaskStatus.RUNNING);
      acquireFabLoading();
    } else {
      if (taskId) {
        llmTaskControllers.set(taskId, controller);
      }
    }
    const isAiAssistantRequest = String(id).startsWith("ai-assistant-") || String(id).length === 13;
    if (!isAiAssistantRequest && attempt === 0) {
      addLog(`===== LLM \u9ED8\u8BA4\u8BF7\u6C42\u5F00\u59CB [${requestKey}] =====`);
      addLog(`\u8BF7\u6C42 ID: ${id}`);
      addLog(`\u53D1\u9001\u7684 Prompt:`);
      addLog(formatPromptForDisplay(prompt2));
    }
    if (attempt > 0) {
      const retryMsg = `\u7B2C ${attempt} \u6B21\u91CD\u8BD5\uFF08\u5171 ${maxRetries} \u6B21\uFF09...`;
      console.log(`[LLM Retry] \u5916\u90E8\u8BF7\u6C42 ${retryMsg}`);
      if (!isAiAssistantRequest) {
        addLog(`\u23F3 ${retryMsg}`);
      }
      if (updateResultUI) {
        updateResultUI(`${retryMsg}
\u6B63\u5728\u5904\u7406\u5916\u90E8\u8BF7\u6C42\uFF0C\u8BF7\u7A0D\u5019...`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    }
    const api_url = (profileData.api_url || "").trim();
    const api_key = (profileData.api_key || "").trim();
    const model = (profileData.model || "").trim();
    const { temperature, top_p, max_tokens, stream, bypass_proxy } = profileData;
    const send_images = profileData.send_images ?? false;
    try {
      const _profileName = extension_settings[extensionName].current_llm_profile || "\u9ED8\u8BA4";
      const _imgCount = countImageParts(prompt2);
      console.warn(
        `[\u53D1\u9001\u56FE\u7247\u8BCA\u65AD/\u9ED8\u8BA4\u8BF7\u6C42] profile="${_profileName}" | send_images=${send_images} | prompt \u4E2D\u56FE\u7247\u6570=${_imgCount} | \u5C06${send_images ? "\u4FDD\u7559" : "\u5265\u79BB"}\u56FE\u7247`
      );
    } catch (_e) {
    }
    const outboundMessages = send_images ? await processImagesInMessages(prompt2) : stripImagesFromMessages(prompt2);
    let cleanedMessages = dropKnownEmptyMessages(outboundMessages);
    cleanedMessages = mergeAdjacentMessages(cleanedMessages);
    cleanedMessages = processVariablePlaceholdersInMessages(cleanedMessages);
    cleanedMessages = dropKnownEmptyMessages(cleanedMessages);
    cleanedMessages = mergeAdjacentMessages(cleanedMessages);
    const firstRole = cleanedMessages[0]?.role;
    const isFirstRoleInvalid = firstRole === "assistant" || firstRole === "tool" || firstRole === "function";
    if (!cleanedMessages || cleanedMessages.length === 0 || isFirstRoleInvalid) {
      const emptyErr = isFirstRoleInvalid ? `\u8D77\u59CB\u6D88\u606F\u9000\u5316\u4E3A\u975E\u6CD5\u7684 ${firstRole} \u89D2\u8272\uFF08\u524D\u7F6E\u8F93\u5165\u5DF2\u88AB\u5B89\u5168\u8FC7\u6EE4\uFF09\uFF0C\u5DF2\u963B\u6B62\u53D1\u9001\u975E\u6CD5\u8BF7\u6C42\u3002` : "\u5904\u7406\u540E\u6240\u6709\u6D88\u606F\u5747\u4E3A\u7A7A\uFF08\u4F8B\u5982\u7EAF\u56FE\u7247\u88AB\u8FC7\u6EE4\uFF09\uFF0C\u5DF2\u963B\u6B62\u53D1\u9001\u7A7A\u8BF7\u6C42\u3002";
      toastr.warning(emptyErr);
      if (updateResultUI) {
        updateResultUI(emptyErr);
      }
      activeRequests.delete(requestKey);
      if (taskId) {
        taskQueue.completeTask(taskId, false);
        llmTaskControllers.delete(taskId);
      }
      releaseFabLoading();
      eventSource.emit(eventNames.LLM_EXECUTE_RESPONSE, { success: false, result: emptyErr, id });
      return { aborted: true, reason: emptyErr };
    }
    const isVertexChannel = profileData.channel_type === "vertex";
    const targetModel = isVertexChannel ? profileData.vertex_model || "gemini-2.5-flash" : model;
    if (isVertexChannel) {
      if (!profileData.vertex_credentials || !profileData.vertex_credentials.client_email) {
        const errorMsg = "Vertex \u6E20\u9053\u672A\u914D\u7F6E\u6709\u6548\u7684 GCP Service Account JSON \u51ED\u636E\u3002";
        toastr.error(errorMsg);
        activeRequests.delete(requestKey);
        if (taskId) {
          taskQueue.completeTask(taskId, false);
          llmTaskControllers.delete(taskId);
        }
        releaseFabLoading();
        eventSource.emit(eventNames.LLM_EXECUTE_RESPONSE, { success: false, result: errorMsg, id });
        return;
      }
    } else {
      if (!api_url || !api_key || !model) {
        const errorMsg = "API URL, API Key, \u6216 Model \u672A\u914D\u7F6E\u3002";
        toastr.error(errorMsg);
        activeRequests.delete(requestKey);
        if (taskId) {
          taskQueue.completeTask(taskId, false);
          llmTaskControllers.delete(taskId);
        }
        releaseFabLoading();
        eventSource.emit(eventNames.LLM_EXECUTE_RESPONSE, { success: false, result: errorMsg, id });
        return;
      }
    }
    const customApiUrl = api_url ? api_url.replace(/\/$/, "") : "";
    let requestUrl, requestHeaders, requestBody;
    const baseRequestBody = {
      model: targetModel,
      messages: cleanedMessages,
      stream: stream ?? false
    };
    if (profileData.enable_temperature !== false) {
      baseRequestBody.temperature = temperature;
    }
    if (profileData.enable_top_p !== false) {
      baseRequestBody.top_p = top_p;
    }
    if (profileData.enable_max_tokens !== false) {
      baseRequestBody.max_tokens = max_tokens;
    }
    // 思考等级：同上，仅 OpenAI 兼容直连路径真正生效。
    if (profileData.reasoning_effort && !isVertexChannel) {
      baseRequestBody.reasoning_effort = profileData.reasoning_effort;
    }
    if (profileData.enable_custom_body_params && profileData.custom_body_params) {
      const extraBody = parseCustomBody(profileData.custom_body_params);
      Object.assign(baseRequestBody, extraBody);
    }
    const { toolName: syntheticToolName, transformedBody, isToolCallEnabled, toolFields } = transformToolCallRequest(baseRequestBody, profileData);
    if (transformedBody && Array.isArray(transformedBody.messages)) {
      transformedBody.messages = mergeAdjacentMessages(dropKnownEmptyMessages(transformedBody.messages));
    }
    const isPresetGuide = toolFields?.some((f) => f.name === "display_stream");
    console.log(`st-chatu8 [LLM\u5916\u90E8\u8BF7\u6C42] Channel: ${channel}, \u6E20\u9053\u7C7B\u578B: ${isVertexChannel ? "Vertex" : "OpenAI"}, \u6A21\u578B: ${targetModel}, ToolCall: ${isToolCallEnabled ? "\u5DF2\u542F\u7528 (" + syntheticToolName + (isPresetGuide ? " - \u9884\u8BBE\u5185\u5D4C\u5F15\u5BFC" : "") + ")" : "\u5DF2\u5173\u95ED"}, tool_choice: ${transformedBody.tool_choice ? JSON.stringify(transformedBody.tool_choice) : "\u65E0"}`);
    const customHeadersMap = profileData.enable_custom_headers ? parseCustomHeaders(profileData.custom_headers) : {};
    if (isVertexChannel) {
      const vertexToken = await getVertexAccessToken(profileData.vertex_credentials, bypass_proxy);
      requestUrl = buildVertexEndpoint(profileData.vertex_location, profileData.vertex_credentials.project_id, targetModel, stream ?? false);
      requestHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${vertexToken}`,
        ...customHeadersMap
      };
      requestBody = convertOpenAIToVertexGemini(transformedBody);
    } else if (bypass_proxy) {
      requestUrl = `${customApiUrl}/chat/completions`;
      requestHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${api_key}`,
        ...customHeadersMap
      };
      requestBody = transformedBody;
    } else {
      let proxyBaseUrl = customApiUrl;
      requestUrl = "/api/backends/chat-completions/generate";
      requestHeaders = getRequestHeaders(window.token);
      requestBody = {
        chat_completion_source: "custom",
        custom_url: proxyBaseUrl,
        custom_include_headers: buildProxyIncludeHeaders(api_key, customHeadersMap),
        ...transformedBody
      };
    }
    if (updateResultUI && attempt === 0) {
      console.log('[DEBUG-SVC] \u2709 \u8C03\u7528 updateResultUI("\u6B63\u5728\u5904\u7406\u5916\u90E8\u8BF7\u6C42\uFF0C\u8BF7\u7A0D\u5019...")');
      updateResultUI(`\u6B63\u5728\u5904\u7406\u5916\u90E8\u8BF7\u6C42${isToolCallEnabled ? " [Tool Call \u6A21\u5F0F]" : ""}\uFF0C\u8BF7\u7A0D\u5019...`);
      console.log("[DEBUG-SVC]   updateResultUI \u7B2C1\u6B21\u8C03\u7528\u5B8C\u6210");
    }
    try {
      console.log("[DEBUG-SVC] \u{1F310} \u53D1\u8D77 fetch \u8BF7\u6C42...");
      console.log("[DEBUG-SVC]   requestUrl:", requestUrl);
      console.log("[DEBUG-SVC]   bypass_proxy:", bypass_proxy);
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal
      });
      console.log("[DEBUG-SVC] \u2705 fetch \u54CD\u5E94\u5DF2\u6536\u5230, status:", response.status, response.statusText);
      if (!response.ok) {
        let errorBodyText = "";
        try {
          errorBodyText = await response.text();
        } catch (_readErr) {
        }
        const formattedError = extractApiErrorMessage(response, errorBodyText);
        throw new Error(formattedError);
      }
      const rawResponseData = await response.json();
      const responseData = isVertexChannel ? convertVertexToOpenAIResponse(rawResponseData, targetModel) : rawResponseData;
      console.log("[DEBUG-SVC]   responseData \u5DF2\u89E3\u6790, choices \u6570\u91CF:", responseData.choices?.length);
      if (responseData.error || !responseData.choices && (responseData.detail || responseData.message || responseData.msg)) {
        const formattedError = extractApiErrorMessage(response, responseData);
        throw new Error(formattedError);
      }
      let reply = "";
      if (isToolCallEnabled || responseData.choices?.[0]?.message?.tool_calls) {
        const normResult = normalizeNonStreamingToolCall(responseData, syntheticToolName, toolFields);
        if (normResult.matched || normResult.content) {
          reply = normResult.content;
        } else {
          let reasoning = responseData.choices?.[0]?.message?.reasoning_content || "";
          reply = responseData.choices?.[0]?.message?.content || "";
          if (reasoning) {
            reply = reasoning + "\n\n" + reply;
          }
        }
      } else {
        let reasoning = responseData.choices?.[0]?.message?.reasoning_content || "";
        reply = responseData.choices?.[0]?.message?.content || "";
        if (reasoning) {
          reply = reasoning + "\n\n" + reply;
        }
      }
      console.log("[DEBUG-SVC] \u{1F4DD} reply \u957F\u5EA6:", reply.length, ", \u524D50\u5B57\u7B26:", reply.substring(0, 50));
      if (isEmptyResponse(reply)) {
        if (attempt < maxRetries) {
          console.warn("[DEBUG-SVC] \u26A0 reply \u4E3A\u7A7A\uFF0C\u5C06\u91CD\u8BD5");
          lastError = new Error("\u672A\u6536\u5230\u6709\u6548\u56DE\u590D");
          activeRequests.delete(requestKey);
          attempt++;
          continue;
        } else {
          console.warn("[DEBUG-SVC] \u26A0 reply \u4E3A\u7A7A\uFF08\u5DF2\u8FBE\u6700\u5927\u91CD\u8BD5\u6B21\u6570\uFF09");
          toastr.warning(`LLM \u8BF7\u6C42\u8FD4\u56DE\u4E3A\u7A7A\uFF08\u5DF2\u91CD\u8BD5 ${maxRetries} \u6B21\uFF09\uFF0C\u53EF\u80FD\u662F\u8BF7\u6C42\u88AB\u622A\u65AD\u3001max_tokens \u8BBE\u7F6E\u8FC7\u5C0F\u3001\u6216 API \u8FDE\u63A5\u95EE\u9898\u3002`);
        }
      }
      if (updateResultUI) {
        console.log("[DEBUG-SVC] \u2709 \u8C03\u7528 updateResultUI(reply)\uFF0Creply\u957F\u5EA6:", reply.length);
        updateResultUI(reply);
        console.log("[DEBUG-SVC]   updateResultUI \u7B2C2\u6B21\u8C03\u7528\u5B8C\u6210\uFF08\u5B9E\u9645\u56DE\u590D\uFF09");
      } else {
        console.warn("[DEBUG-SVC] \u26A0 updateResultUI \u4E3A null\uFF0C\u65E0\u6CD5\u66F4\u65B0\u5B9E\u9645\u56DE\u590D\u5230 UI");
      }
      if (!isAiAssistantRequest) {
        addLog(`
----- LLM \u56DE\u590D -----`);
        addLog(reply);
        if (attempt > 0) {
          addLog(`\u2705 \u91CD\u8BD5\u6210\u529F\uFF08\u7B2C ${attempt} \u6B21\u91CD\u8BD5\uFF09`);
        }
        addLog(`===== LLM \u8BF7\u6C42\u5B8C\u6210 =====`);
      }
      taskQueue.completeTask(taskId, true);
      llmTaskControllers.delete(taskId);
      console.log("[DEBUG-SVC] \u{1F4E4} \u5373\u5C06 emit LLM_EXECUTE_RESPONSE, success: true, reply\u957F\u5EA6:", reply.length);
      eventSource.emit(eventNames.LLM_EXECUTE_RESPONSE, { success: true, result: reply, id });
      console.log("[DEBUG-SVC] \u25C0 executeDefaultLLMRequest() \u6B63\u5E38\u5B8C\u6210");
      activeRequests.delete(requestKey);
      releaseFabLoading();
      return;
    } catch (error) {
      activeRequests.delete(requestKey);
      if (error.name === "AbortError") {
        console.log("LLM execute request aborted.");
        if (taskId) {
          taskQueue.updateStatus(taskId, TaskStatus.CANCELLED);
          llmTaskControllers.delete(taskId);
        }
        releaseFabLoading();
        eventSource.emit(eventNames.LLM_EXECUTE_RESPONSE, {
          success: false,
          result: null,
          id,
          error: { name: "AbortError", message: "Request aborted" }
        });
        return;
      }
      if (!isNonRetryableError(error) && shouldRetryError(error, attempt, maxRetries)) {
        lastError = error;
        attempt++;
        console.warn(`[LLM Retry] \u5916\u90E8\u8BF7\u6C42\u5931\u8D25: ${error.message}\uFF0C\u5C06\u5728 2 \u79D2\u540E\u91CD\u8BD5 (${attempt}/${maxRetries})`);
        if (!isAiAssistantRequest) {
          addLog(`\u26A0\uFE0F \u8BF7\u6C42\u5931\u8D25: ${error.message}`);
        }
        continue;
      }
      console.error("LLM Execute Error:", error);
      const errorMessage = attempt > 0 ? `\u8BF7\u6C42\u9519\u8BEF\uFF08\u5DF2\u91CD\u8BD5 ${attempt} \u6B21\uFF09: ${error.message}` : `\u8BF7\u6C42\u9519\u8BEF: ${error.message}`;
      if (updateResultUI) {
        updateResultUI(errorMessage);
      }
      toastr.error(errorMessage);
      if (taskId) {
        taskQueue.completeTask(taskId, false);
        llmTaskControllers.delete(taskId);
      }
      releaseFabLoading();
      eventSource.emit(eventNames.LLM_EXECUTE_RESPONSE, { success: false, result: errorMessage, id });
      return;
    }
  }
  if (taskId) {
    taskQueue.completeTask(taskId, false);
    llmTaskControllers.delete(taskId);
    releaseFabLoading();
  }
}

function createGetPromptHandler(requestType, responseEventName) {
  return function(data) {
    const { id } = data;
    if (!id) return;
    const typeName = REQUEST_TYPE_NAMES[requestType] || requestType;
    console.log(`st-chatu8: \u6536\u5230${typeName}\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
    const prompt2 = buildPromptForRequestType(requestType);
    eventSource.emit(responseEventName, { prompt: prompt2, id });
  };
}

function createExecuteHandler(requestType, responseEventName, getUpdateResultUI = null) {
  return async function(data) {
    const updateResultUI = getUpdateResultUI ? getUpdateResultUI() : null;
    await executeTypedLLMRequest(data, requestType, responseEventName, updateResultUI);
  };
}

export { abortLLMChannelRequest, buildPromptForRequestType, buildProxyIncludeHeaders, executeDefaultLLMRequest, executeTypedLLMRequest, extractApiErrorMessage, formatPromptForDisplay, getEffectiveConfigForRequestType, getLLMRequestController, getMergeOptionsForRequestType, parseCustomBody, parseCustomHeaders, processImagesInMessages, setLLMRequestController };
