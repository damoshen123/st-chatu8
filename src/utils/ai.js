// 还原自打包产物 — 原始模块: utils/ai.js
import { eventSource } from "../../../../../script.js";
import { eventNames } from "./config.js";
import { addLog } from "./utils.js";
import { mergeAdjacentMessages } from "./promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "./settings/llmService.js";
import { updateCombinedPrompt } from "./settings/llmUi.js";
import "./settings/llm.js"; // init_llm

var SD_SYMBOL_PATTERN, SKIP_PATTERNS;

SD_SYMBOL_PATTERN = /^([\(\[\{<]+)?(.*?)([\)\]\}>]+)?(:[\d.]+)?$/;

SKIP_PATTERNS = [
      /^<lora:/i,
      // LoRA
      /^<lyco:/i,
      // LyCORIS
      /^<hypernet:/i,
      // Hypernetwork
      /^[\d.:]+$/,
      // 纯数字/权重
      /^$/,
      // 空字符串
      /^\$.*\$$/
      // $...$ 角色/服装预设标记
    ];

function shouldSkipTranslation(tag) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(tag.trim()));
}

function tagsToJsonString(tags) {
  if (!Array.isArray(tags)) return "[]";
  return JSON.stringify(tags.filter((t) => t && typeof t === "string"));
}

function preprocessPromptForTranslation(promptText) {
  if (!promptText || typeof promptText !== "string") {
    return {
      originalTags: [],
      cleanedTags: [],
      cleanedText: "",
      tagMap: /* @__PURE__ */ new Map()
    };
  }
  const smartSplit = (text) => {
    const result = [];
    let current = "";
    let insideDollar = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === "$") {
        insideDollar = !insideDollar;
        current += char;
      } else if ((char === "," || char === "\uFF0C") && !insideDollar) {
        const trimmed = current.trim();
        if (trimmed) result.push(trimmed);
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) result.push(current.trim());
    return result;
  };
  const rawTags = smartSplit(promptText);
  const originalTags = [];
  const cleanedTags = [];
  const tagMap = /* @__PURE__ */ new Map();
  for (const tag of rawTags) {
    const match = tag.match(SD_SYMBOL_PATTERN);
    if (match) {
      const prefix = match[1] || "";
      const content = (match[2] || "").trim();
      const suffix = match[3] || "";
      const weight = match[4] || "";
      const tagInfo = {
        original: tag,
        cleaned: content,
        prefix,
        suffix,
        weight,
        skip: shouldSkipTranslation(tag) || shouldSkipTranslation(content)
      };
      originalTags.push(tagInfo);
      if (!tagInfo.skip && content) {
        cleanedTags.push(content);
        tagMap.set(content.toLowerCase(), tagInfo);
      }
    } else {
      const tagInfo = {
        original: tag,
        cleaned: tag,
        prefix: "",
        suffix: "",
        weight: "",
        skip: shouldSkipTranslation(tag)
      };
      originalTags.push(tagInfo);
      if (!tagInfo.skip && tag) {
        cleanedTags.push(tag);
        tagMap.set(tag.toLowerCase(), tagInfo);
      }
    }
  }
  return {
    originalTags,
    // 完整的标签信息数组
    cleanedTags,
    // 清理后用于翻译的标签数组
    cleanedText: tagsToJsonString(cleanedTags),
    // 翻译用的 JSON 数组字符串
    tagMap
    // 用于快速查找的映射
  };
}

function combineTranslationResult(originalTags, translationMap) {
  if (!originalTags || !Array.isArray(originalTags)) {
    return [];
  }
  const lowerCaseMap = {};
  if (translationMap && typeof translationMap === "object") {
    for (const [key, value] of Object.entries(translationMap)) {
      lowerCaseMap[key.toLowerCase()] = value;
    }
  }
  return originalTags.map((tagInfo) => {
    const { original, cleaned, skip } = tagInfo;
    if (skip) {
      return {
        original,
        translation: "",
        cleaned,
        skipped: true
      };
    }
    const translation = lowerCaseMap[cleaned.toLowerCase()] || "";
    return {
      original,
      // 带符号的原始 tag，如 "((1girl))"
      translation,
      // 翻译结果，如 "一个女孩"
      cleaned,
      // 清理后的 tag，如 "1girl"
      skipped: false
    };
  });
}

function formatTranslationDisplay(combinedResults, options = {}) {
  const {
    separator = ", ",
    showOriginal = true,
    showTranslation = true
  } = options;
  if (!combinedResults || !Array.isArray(combinedResults)) {
    return "";
  }
  return combinedResults.map((item) => {
    if (item.skipped) {
      return showOriginal ? item.original : "";
    }
    const parts = [];
    if (showOriginal) parts.push(item.original);
    if (showTranslation && item.translation) {
      parts.push(`(${item.translation})`);
    }
    return parts.join(" ");
  }).filter(Boolean).join(separator);
}

async function translatePromptTags(promptText) {
  const { originalTags, cleanedText } = preprocessPromptForTranslation(promptText);
  if (!cleanedText) {
    return {
      results: [],
      displayText: "",
      originalTags: []
    };
  }
  try {
    const translationResult = await callTranslation(cleanedText);
    const translationMap = parseTranslationResult(translationResult);
    const results = combineTranslationResult(originalTags, translationMap);
    const displayText = formatTranslationDisplay(results);
    return {
      results,
      displayText,
      originalTags
    };
  } catch (error) {
    console.error("st-chatu8: \u7FFB\u8BD1\u63D0\u793A\u8BCD\u6807\u7B7E\u5931\u8D25:", error);
    throw error;
  }
}

function parseTranslationResult(text) {
  if (!text) return {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("st-chatu8: JSON\u89E3\u6790\u5931\u8D25\uFF0C\u5C1D\u8BD5\u65E7\u683C\u5F0F:", e.message);
  }
  const cleaned = String(text).replace(/[\r\n]+/g, " ").replace(/^[\s"'`]+|[\s"'`]+$/g, "").trim();
  const pairs = cleaned.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  const map = {};
  for (const p of pairs) {
    const idx = p.indexOf("\\");
    if (idx > 0) {
      const en = p.slice(0, idx).trim();
      const zh = p.slice(idx + 1).trim();
      if (en) map[en] = zh;
    }
  }
  return map;
}

function generateRequestId() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function LLM_TRANSLATION(prompt2, { timeoutMs = 6e4 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId();
    console.log(`st-chatu8: \u8BF7\u6C42\u7FFB\u8BD1 LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_TRANSLATION_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`st-chatu8: \u5DF2\u6536\u5230\u7FFB\u8BD1 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        resolve(executeData.result);
      } else {
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_TRANSLATION_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_TRANSLATION_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`\u7FFB\u8BD1 LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

async function callTranslation(inputText) {
  try {
    let basePrompt = buildPromptForRequestType("translation", inputText || "");
    if (!basePrompt || basePrompt.length === 0) {
      throw new Error('\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"\u7FFB\u8BD1"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E');
    }
    basePrompt = mergeAdjacentMessages(basePrompt, getMergeOptionsForRequestType("translation"));
    const fullPrompt = [...basePrompt, { role: "user", content: inputText || "" }];
    updateCombinedPrompt(fullPrompt);
    const result = await LLM_TRANSLATION(fullPrompt);
    return result;
  } catch (error) {
    addLog(`\u7FFB\u8BD1\u5931\u8D25: ${error.message}`);
    console.error("\u7FFB\u8BD1\u5931\u8D25:", error);
    throw error;
  }
}

export { callTranslation, parseTranslationResult, tagsToJsonString, translatePromptTags };
