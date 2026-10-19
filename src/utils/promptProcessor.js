// 还原自打包产物 — 原始模块: utils/promptProcessor.js
import { extension_settings } from "../../../../../extensions.js";
import { getContext } from "../../../../../st-context.js";
import { extensionName } from "./config.js";
import { applyWordReplacement } from "./wordReplacementService.js";
import { resolveGlobalVariable, resolveNestedVariable, setNestedVariable, setglobalvar } from "./chatDataUtils.js";
import { promptReq_exports } from "./tagModify.js";
import { formatVideoAssetsForLLM } from "./videoAssetsService.js";
import { getworldvar } from "./worldbookProcessor.js";

function stripPresetComments(text) {
  if (!text || typeof text !== "string") return text;
  return text.replace(/\{\{\/\/[\s\S]*?\}\}/g, "").replace(/^[ \t]*\/\/\*.*?(?:\*+\/+|\*\/)?[ \t]*(?:\r?\n|$)/gm, "").replace(/\/\/\*[\s\S]*?(?:\*+\/+|\*\/)/g, "").replace(/[ \t]+\/\/\*.*?(?:\*+\/+|\*\/)?(?=$|\r?\n)/g, "").replace(/(\r?\n){3,}/g, "$1$1").trim();
}

function sanitizeMessageContent(message) {
  if (!message || typeof message !== "object") {
    return message;
  }
  if (!Array.isArray(message.content)) {
    return { ...message };
  }
  const validParts = message.content.filter((part) => {
    if (!part || typeof part !== "object") return false;
    if (part.type === "text") {
      return typeof part.text === "string" && part.text.trim().length > 0;
    }
    if (part.type === "image_url") {
      return part.image_url && typeof part.image_url.url === "string" && part.image_url.url.trim().length > 0;
    }
    return Boolean(part.type);
  });
  if (validParts.length === 1 && validParts[0].type === "text") {
    return { ...message, content: validParts[0].text };
  }
  if (validParts.length === 0) {
    return { ...message, content: "" };
  }
  return { ...message, content: validParts };
}

function padEmptyToolMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((msg) => {
    if (!msg || typeof msg !== "object") return msg;
    if (msg.role === "tool" || msg.role === "function") {
      const hasContent = typeof msg.content === "string" ? msg.content.trim().length > 0 : Array.isArray(msg.content) ? msg.content.length > 0 : msg.content != null;
      if (!hasContent) {
        return { ...msg, content: "{}" };
      }
    }
    return msg;
  });
}

function messageHasPayload(message) {
  if (!message || typeof message !== "object") return false;
  if (message.role === "tool" || message.role === "function") return true;
  if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) return true;
  if (message.function_call && typeof message.function_call === "object") return true;
  const content = message.content;
  if (content == null) return false;
  if (typeof content === "string") {
    return content.trim().length > 0;
  }
  if (Array.isArray(content)) {
    return content.length > 0;
  }
  return false;
}

function dropKnownEmptyMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const padded = padEmptyToolMessages(messages);
  const sanitized = padded.map((msg) => sanitizeMessageContent(msg));
  return sanitized.filter((msg) => messageHasPayload(msg));
}

function checkTriggerWords(triggerWords, triggerText) {
  if (!triggerWords || !triggerText) {
    return false;
  }
  const words = triggerWords.split(",").map((w) => w.trim()).filter((w) => w);
  if (words.length === 0) {
    return false;
  }
  for (const word of words) {
    if (triggerText.includes(word)) {
      return true;
    }
  }
  return false;
}

function mergeAdjacentMessages(messages, options = {}) {
  if (!messages || messages.length === 0) {
    return [];
  }
  const cleanMessages = dropKnownEmptyMessages(messages);
  if (cleanMessages.length === 0) {
    return [];
  }
  const { mergeSystemUser = false } = options;
  const normalizedMessages = mergeSystemUser ? cleanMessages.map((msg) => {
    const text = typeof msg.content === "string" ? msg.content : "";
    if (text.includes("\u3010ToolCall\u5F15\u5BFC\u3011")) {
      return msg;
    }
    return {
      ...msg,
      role: msg.role === "system" ? "user" : msg.role
    };
  }) : cleanMessages;
  const isToolOrFunction = (m) => {
    if (!m) return false;
    const text = typeof m.content === "string" ? m.content : "";
    if (text.includes("\u3010ToolCall\u5F15\u5BFC\u3011")) return true;
    return m.role === "tool" || m.role === "function" || Array.isArray(m.tool_calls) && m.tool_calls.length > 0 || Boolean(m.function_call);
  };
  const result = [];
  let current = null;
  for (const msg of normalizedMessages) {
    if (!current) {
      current = { ...msg };
    } else if (current.role === msg.role && !isToolOrFunction(current) && !isToolOrFunction(msg)) {
      current.content = mergeContent(current.content, msg.content);
    } else {
      result.push(current);
      current = { ...msg };
    }
  }
  if (current) {
    result.push(current);
  }
  return dropKnownEmptyMessages(result);
}

function mergeContent(content1, content2) {
  if (typeof content1 === "string" && typeof content2 === "string") {
    return content1 + "\n" + content2;
  }
  const parts1 = normalizeToArray(content1);
  const parts2 = normalizeToArray(content2);
  return [...parts1, { type: "text", text: "\n" }, ...parts2];
}

function normalizeToArray(content) {
  if (Array.isArray(content)) {
    return content;
  }
  return [{ type: "text", text: content || "" }];
}

function replacePlaceholder(obj, placeholder, value, replacedSet) {
  if (typeof obj === "string") {
    if (value && obj.includes(placeholder)) {
      if (replacedSet) {
        replacedSet.add(placeholder);
      }
    }
    return obj.replaceAll(placeholder, value || "");
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replacePlaceholder(item, placeholder, value, replacedSet));
  }
  if (obj && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = replacePlaceholder(obj[key], placeholder, value, replacedSet);
    }
    return newObj;
  }
  return obj;
}

async function replaceAllPlaceholders(messages, contextData) {
  const settings3 = extension_settings[extensionName] || {};
  const channel = settings3.videoChannel || "comfyui";
  const defaultDuration = channel === "runninghub" ? settings3.runninghub_val_duration ?? "4" : settings3.comfyui_val_duration ?? "4";
  const {
    context = "",
    body = "",
    worldBookContent = "",
    variables = {},
    userDemand = "",
    characterListText = "",
    outfitEnableListText = "",
    commonCharacterListText = "",
    floorContext = "",
    // 新增：楼层信息上下文
    videoMaterial = "",
    duration = defaultDuration
  } = contextData;
  const durationStr = String(duration ?? defaultDuration);
  const replacedVariables = /* @__PURE__ */ new Set();
  let result = messages;
  const stContext = getContext();
  const username = stContext?.name1 || "";
  let processedWorldBookContent = worldBookContent;
  if (processedWorldBookContent) {
    processedWorldBookContent = processedWorldBookContent.replaceAll("{{user}}", username);
    processedWorldBookContent = processedWorldBookContent.replaceAll("<user>", username);
  }
  let processedFloorContext = "";
  if (floorContext && floorContext.trim()) {
    try {
      const { processWorldBooksWithTrigger: processWorldBooksWithTrigger2 } = await import("./promptReq.js");
      const floorMessages = floorContext.split("\n").filter((line) => line.trim());
      const triggeredWorldBook = await processWorldBooksWithTrigger2(floorMessages);
      if (triggeredWorldBook) {
        processedFloorContext = `<\u9152\u9986\u6545\u4E8B\u80CC\u666F>
${triggeredWorldBook}
</\u9152\u9986\u6545\u4E8B\u80CC\u666F>

${floorContext}`;
        console.log("[PromptProcessor] \u697C\u5C42\u4FE1\u606F\u5DF2\u89E6\u53D1\u4E16\u754C\u4E66\u5185\u5BB9");
      } else {
        processedFloorContext = floorContext;
      }
    } catch (err) {
      console.warn("[PromptProcessor] \u697C\u5C42\u4FE1\u606F\u89E6\u53D1\u4E16\u754C\u4E66\u5931\u8D25:", err);
      processedFloorContext = floorContext;
    }
  }
  const replacedContext = applyWordReplacement(context, "text");
  const replacedWorldBookContent = applyWordReplacement(processedWorldBookContent, "text");
  const replacedBody = applyWordReplacement(body, "text");
  result = replacePlaceholder(result, "{{\u4E0A\u4E0B\u6587}}", replacedContext, replacedVariables);
  result = replacePlaceholder(result, "{{\u4E16\u754C\u4E66\u89E6\u53D1}}", replacedWorldBookContent, replacedVariables);
  result = replacePlaceholder(result, "{{\u6B63\u6587}}", replacedBody, replacedVariables);
  result = replacePlaceholder(result, "{{\u89D2\u8272\u542F\u7528\u5217\u8868}}", characterListText, replacedVariables);
  result = replacePlaceholder(result, "{{\u901A\u7528\u670D\u88C5\u542F\u7528\u5217\u8868}}", outfitEnableListText, replacedVariables);
  result = replacePlaceholder(result, "{{\u901A\u7528\u89D2\u8272\u542F\u7528\u5217\u8868}}", commonCharacterListText, replacedVariables);
  result = replacePlaceholder(result, "{{\u7528\u6237\u9700\u6C42}}", userDemand, replacedVariables);
  result = replacePlaceholder(result, "{{\u89C6\u9891\u7D20\u6750}}", videoMaterial, replacedVariables);
  result = replacePlaceholder(result, "{{\u89C6\u9891\u8D44\u4EA7}}", formatVideoAssetsForLLM(), replacedVariables);
  result = replacePlaceholder(result, "{{\u89D2\u8272\u8D44\u4EA7}}", formatVideoAssetsForLLM("character"), replacedVariables);
  result = replacePlaceholder(result, "{{\u8EAB\u4F53\u90E8\u4F4D}}", formatVideoAssetsForLLM("body_part"), replacedVariables);
  result = replacePlaceholder(result, "{{\u8EAB\u4F53\u90E8\u4F4D\u8D44\u4EA7}}", formatVideoAssetsForLLM("body_part"), replacedVariables);
  result = replacePlaceholder(result, "{{\u573A\u666F\u8D44\u4EA7}}", formatVideoAssetsForLLM("scene"), replacedVariables);
  result = replacePlaceholder(result, "{{\u9053\u5177\u8D44\u4EA7}}", formatVideoAssetsForLLM("prop"), replacedVariables);
  result = replacePlaceholder(result, "{{\u59FF\u52BF\u8D44\u4EA7}}", formatVideoAssetsForLLM("pose"), replacedVariables);
  result = replacePlaceholder(result, "{{\u697C\u5C42\u4FE1\u606F}}", processedFloorContext, replacedVariables);
  result = replacePlaceholder(result, "{{\u79D2\u6570}}", durationStr, replacedVariables);
  result = replacePlaceholder(result, "{{\u89C6\u9891\u79D2\u6570}}", durationStr, replacedVariables);
  result = replacePlaceholder(result, "{{duration}}", durationStr, replacedVariables);
  if (variables && Object.keys(variables).length > 0) {
    const getvarPattern = /\{\{getvar::([^}]+)\}\}/g;
    const promptStr = JSON.stringify(result);
    const matches = [...promptStr.matchAll(getvarPattern)];
    const varsToReplace = /* @__PURE__ */ new Set();
    for (const match of matches) {
      varsToReplace.add(match[1]);
    }
    for (const varName of varsToReplace) {
      const placeholder = `{{getvar::${varName}}}`;
      const value = variables[varName] || "";
      result = replacePlaceholder(result, placeholder, value, replacedVariables);
    }
  }
  result = processVariablePlaceholdersInMessages(result, replacedVariables);
  return { messages: result, replacedVariables };
}

function processVariablePlaceholdersInMessages(messages, replacedVariables = /* @__PURE__ */ new Set()) {
  if (!messages || messages.length === 0) return messages;
  const context = getContext();
  if (!context.chatMetadata) {
    context.chatMetadata = {};
  }
  if (!context.chatMetadata.variables) {
    context.chatMetadata.variables = {};
  }
  return messages.map((msg) => {
    if (!msg || !msg.content) return msg;
    return {
      ...msg,
      content: processContentVariables(msg.content, context, replacedVariables)
    };
  });
}

function processContentVariables(content, context, replacedVariables = null) {
  if (typeof content === "string") {
    return processStringVariables(content, context, replacedVariables);
  }
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part && part.type === "text" && typeof part.text === "string") {
        return {
          ...part,
          text: processStringVariables(part.text, context, replacedVariables)
        };
      }
      return part;
    });
  }
  return content;
}

function processStringVariables(str, context, replacedVariables = null) {
  if (!str || typeof str !== "string") return str;
  let result = str;
  if (!context) context = {};
  if (!context.chatMetadata) context.chatMetadata = {};
  if (!context.chatMetadata.variables) context.chatMetadata.variables = {};
  result = result.replace(/(?:\{@setvar::([^:@]+)::([\s\S]*?)@\}|\{\{setvar::([^:}]+)::([\s\S]*?)\}\})/g, (match, n1, v1, n2, v2) => {
    const name = (n1 || n2 || "").trim();
    const value = v1 !== void 0 ? v1 : v2 !== void 0 ? v2 : "";
    if (name) {
      setNestedVariable(context.chatMetadata.variables, name, value);
      if (replacedVariables) {
        replacedVariables.add(`{@setvar::${name}@}`);
      }
    }
    return "";
  });
  result = result.replace(/(?:\{@setglobalvar::([^:@]+)::([\s\S]*?)@\}|\{\{setglobalvar::([^:}]+)::([\s\S]*?)\}\})/g, (match, n1, v1, n2, v2) => {
    const name = (n1 || n2 || "").trim();
    const value = v1 !== void 0 ? v1 : v2 !== void 0 ? v2 : "";
    if (name) {
      setglobalvar(name, value);
      if (replacedVariables) {
        replacedVariables.add(`{@setglobalvar::${name}@}`);
      }
    }
    return "";
  });
  for (let round = 0; round < 3; round++) {
    const prev = result;
    result = result.replace(/(?:\{@getvar::([^@]+)@\}|\{\{getvar::([^}]+)\}\})/g, (match, n1, n2) => {
      const name = (n1 || n2 || "").trim();
      const value = resolveNestedVariable(context.chatMetadata.variables, name);
      if (replacedVariables) {
        replacedVariables.add(`{@getvar::${name}@}`);
      }
      return value !== void 0 && value !== null ? value : "";
    });
    result = result.replace(/(?:\{@getglobalvar::([^@]+)@\}|\{\{getglobalvar::([^}]+)\}\})/g, (match, n1, n2) => {
      const name = (n1 || n2 || "").trim();
      const value = resolveGlobalVariable(name);
      if (replacedVariables) {
        replacedVariables.add(`{@getglobalvar::${name}@}`);
      }
      return value !== void 0 && value !== null ? value : "";
    });
    result = result.replace(/(?:\{@getworldvar::([^@]+)@\}|\{\{getworldvar::([^}]+)\}\})/g, (match, n1, n2) => {
      const name = (n1 || n2 || "").trim();
      const value = getworldvar(name) || "";
      if (replacedVariables) {
        replacedVariables.add(`{@getworldvar::${name}@}`);
      }
      return value;
    });
    if (result === prev) break;
  }
  return result;
}

export { checkTriggerWords, dropKnownEmptyMessages, mergeAdjacentMessages, processStringVariables, processVariablePlaceholdersInMessages, replaceAllPlaceholders, replacePlaceholder, stripPresetComments };
