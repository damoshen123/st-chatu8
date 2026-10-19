// 还原自打包产物 — 原始模块: utils/configHelper/configBrowseAPI.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extensionName } from "../config.js";
import { llm_exports } from "../settings/videoAssetPicker.js";
import { theme_exports } from "../iframe/utils.js";
import { ConfigDescriptions } from "./configDescriptions.js";

var UIActionRegistry;

UIActionRegistry = {
      // === 左侧导航栏 - 切换设置标签页 ===
      "switch_tab_main": { selector: '.st-chatu8-nav-link[data-tab="main"]', desc: "\u5207\u6362\u5230\u300C\u4E3B\u8981\u8BBE\u7F6E\u300D\u9875 \u2014 \u540E\u7AEF\u6A21\u5F0F\u9009\u62E9\u3001\u5F00\u5173\u3001\u6807\u8BB0\u3001\u7F13\u5B58\u7BA1\u7406" },
      "switch_tab_sd": { selector: '.st-chatu8-nav-link[data-tab="sd"]', desc: "\u5207\u6362\u5230\u300CSD\u300D\u8BBE\u7F6E\u9875 \u2014 Stable Diffusion WebUI \u7684\u63D0\u793A\u8BCD\u3001API\u5730\u5740\u3001\u6A21\u578B\u3001\u751F\u6210\u53C2\u6570" },
      "switch_tab_novelai": { selector: '.st-chatu8-nav-link[data-tab="novelai"]', desc: "\u5207\u6362\u5230\u300CNovelAI\u300D\u8BBE\u7F6E\u9875 \u2014 NAI API Key\u3001\u6A21\u578B\u3001\u91C7\u6837\u5668\u3001Vibe\u53C2\u8003\u56FE\u7B49" },
      "switch_tab_comfyui": { selector: '.st-chatu8-nav-link[data-tab="comfyui"]', desc: "\u5207\u6362\u5230\u300CComfyUI\u300D\u8BBE\u7F6E\u9875 \u2014 ComfyUI API\u5730\u5740\u3001\u5DE5\u4F5C\u6D41\u3001\u6A21\u578B\u3001\u91C7\u6837\u5668\u3001\u751F\u6210\u53C2\u6570" },
      "switch_tab_runninghub": { selector: '.st-chatu8-nav-link[data-tab="runninghub"]', desc: "\u5207\u6362\u5230\u300CRunningHub\u300D\u8BBE\u7F6E\u9875 \u2014 RunningHub API\u5730\u5740\u3001\u5BC6\u94A5\u6C60\u4E0E\u5DE5\u4F5C\u6D41\u7BA1\u7406" },
      "switch_tab_video_assets": { selector: '.st-chatu8-nav-link[data-tab="video_assets"]', desc: "\u5207\u6362\u5230\u300C\u89C6\u9891\u8D44\u4EA7\u300D\u9875 \u2014 \u89D2\u8272\u3001\u90E8\u4F4D\u3001\u573A\u666F\u3001\u9053\u5177\u3001\u59FF\u52BF\u53CA\u97F3\u9891\u7D20\u6750\u7BA1\u7406" },
      "switch_tab_video_asset_gen": { selector: '.st-chatu8-nav-link[data-tab="video_asset_gen"]', desc: "\u5207\u6362\u5230\u300C\u89C6\u9891\u8D44\u4EA7\u751F\u6210\u300D\u9875 \u2014 \u8F93\u5165\u9700\u6C42\u4E0E\u53C2\u8003\u7D20\u6750\u7B80\u4ECB\u751F\u6210\u89C6\u9891\u8D44\u4EA7\u4E0E\u5206\u955C" },
      "switch_tab_banana": { selector: '.st-chatu8-nav-link[data-tab="banana"]', desc: "\u5207\u6362\u5230\u300CBanana/grok\u300D\u8BBE\u7F6E\u9875 \u2014 Banana API\u914D\u7F6E\u3001\u6A21\u578B\u3001\u591A\u8F6E\u5BF9\u8BDD\u9884\u8BBE" },
      "switch_tab_llm": { selector: '.st-chatu8-nav-link[data-tab="llm"]', desc: "\u5207\u6362\u5230\u300CLLM\u300D\u8BBE\u7F6E\u9875 \u2014 \u5927\u8BED\u8A00\u6A21\u578BAPI\u914D\u7F6E\u3001\u4E0A\u4E0B\u6587\u9884\u8BBE\u3001\u8BF7\u6C42\u7C7B\u578B\u5206\u914D" },
      "switch_tab_vocabulary": { selector: '.st-chatu8-nav-link[data-tab="vocabulary"]', desc: "\u5207\u6362\u5230\u300C\u8BCD\u5E93\u300D\u8BBE\u7F6E\u9875 \u2014 \u81EA\u52A8\u5B8C\u6210\u8BCD\u5E93\u641C\u7D22\u8BBE\u7F6E" },
      "switch_tab_knowledgeBase": { selector: '.st-chatu8-nav-link[data-tab="knowledgeBase"]', desc: "\u5207\u6362\u5230\u300C\u8D44\u6599\u5E93\u300D\u8BBE\u7F6E\u9875 \u2014 \u7528\u6237\u81EA\u5B9A\u4E49\u77E5\u8BC6\u8D44\u6599\u5E93\u7BA1\u7406" },
      "switch_tab_character": { selector: '.st-chatu8-nav-link[data-tab="character"]', desc: "\u5207\u6362\u5230\u300C\u89D2\u8272\u7BA1\u7406\u300D\u8BBE\u7F6E\u9875 \u2014 \u89D2\u8272\u8BBE\u8BA1\u548C\u670D\u88C5\u7BA1\u7406" },
      "switch_tab_theme": { selector: '.st-chatu8-nav-link[data-tab="theme"]', desc: "\u5207\u6362\u5230\u300C\u4E3B\u9898\u8BBE\u7F6E\u300D\u9875 \u2014 UI\u5916\u89C2\u4E3B\u9898\u5207\u6362" },
      "switch_tab_fab": { selector: '.st-chatu8-nav-link[data-tab="fab"]', desc: "\u5207\u6362\u5230\u300C\u60AC\u6D6E\u7403\u300D\u8BBE\u7F6E\u9875 \u2014 \u5FEB\u6377\u64CD\u4F5C\u6D6E\u52A8\u6309\u94AE\u7684\u5916\u89C2\u548C\u884C\u4E3A" },
      "switch_tab_image_cache": { selector: '.st-chatu8-nav-link[data-tab="image-cache"]', desc: "\u5207\u6362\u5230\u300C\u56FE\u7247\u7F13\u5B58\u300D\u8BBE\u7F6E\u9875 \u2014 \u56FE\u7247\u7F13\u5B58\u67E5\u770B\u548C\u7BA1\u7406" },
      "switch_tab_regex": { selector: '.st-chatu8-nav-link[data-tab="regex"]', desc: "\u5207\u6362\u5230\u300C\u6B63\u5219\u300D\u8BBE\u7F6E\u9875 \u2014 \u6B63\u5219\u8868\u8FBE\u5F0F\u66FF\u6362\u89C4\u5219\u7BA1\u7406" },
      "switch_tab_about": { selector: '.st-chatu8-nav-link[data-tab="about"]', desc: "\u5207\u6362\u5230\u300C\u5173\u4E8E\u300D\u9875 \u2014 \u7248\u672C\u4FE1\u606F\u3001\u66F4\u65B0\u68C0\u67E5" },
      "switch_tab_log": { selector: '.st-chatu8-nav-link[data-tab="log"]', desc: "\u5207\u6362\u5230\u300C\u65E5\u5FD7\u300D\u9875 \u2014 \u8FD0\u884C\u65E5\u5FD7\u67E5\u770B" },
      "switch_tab_send_data": { selector: '.st-chatu8-nav-link[data-tab="send_data"]', desc: "\u5207\u6362\u5230\u300C\u53D1\u9001\u6570\u636E\u300D\u9875 \u2014 \u67E5\u770B\u6700\u8FD1\u53D1\u9001\u7684\u8BF7\u6C42\u6570\u636E" },
      // === 后端连接 / 获取数据按钮 ===
      "connect_sd": { selector: "#testSd", desc: "\u8FDE\u63A5 SD WebUI \u5E76\u5237\u65B0\u6A21\u578B/\u91C7\u6837\u5668\u6570\u636E\uFF08\u9700\u5148\u5207\u5230SD\u9875\u9762\uFF09" },
      "connect_comfyui": { selector: "#testComfyui", desc: "\u8FDE\u63A5 ComfyUI \u5E76\u5237\u65B0\u6A21\u578B/\u91C7\u6837\u5668\u6570\u636E\uFF08\u9700\u5148\u5207\u5230ComfyUI\u9875\u9762\uFF09" },
      "llm_fetch_models": { selector: "#ch-llm_fetch_models_button", desc: "\u8FDE\u63A5 LLM API \u5E76\u83B7\u53D6\u53EF\u7528\u6A21\u578B\u5217\u8868\uFF08\u9700\u5148\u5207\u5230LLM\u9875\u9762\uFF09" },
      "ai_fetch_models": { selector: "#chatu8-ai-fetch-models", desc: "\u83B7\u53D6\u667A\u7ED8\u59EC AI \u52A9\u624B\u53EF\u7528\u6A21\u578B\u5217\u8868" },
      "banana_fetch_models": { selector: "#st-chatu8-banana-fetch-models", desc: "\u83B7\u53D6 Banana \u53EF\u7528\u56FE\u50CF\u6A21\u578B\u5217\u8868\uFF08\u9700\u5148\u5207\u5230Banana\u9875\u9762\uFF09" },
      // === 保存按钮 ===
      "llm_save_profile": { selector: "#ch-save_llm_profile_button", desc: "\u4FDD\u5B58\u5F53\u524D LLM \u914D\u7F6E\u9884\u8BBE" },
      "ai_save_settings": { selector: "#st-chatu8-ai-save-settings", desc: "\u4FDD\u5B58\u667A\u7ED8\u59EC AI \u52A9\u624B\u914D\u7F6E" },
      // === 测试按钮 ===
      "ai_test_connection": { selector: "#ai-test-connection", desc: "\u6D4B\u8BD5 AI \u6838\u5FC3\u8BBE\u7F6E\u9875\u9762\u7684 API \u8FDE\u63A5" },
      "llm_test_request": { selector: "#ch-llm_test_button", desc: "\u53D1\u9001 LLM \u6D4B\u8BD5\u8BF7\u6C42" },
      // === 缓存管理按钮 (需先切到主要设置页面) ===
      "clear_image_cache": { selector: "#Clear-Cache", desc: "\u6E05\u9664\u56FE\u7247\u7F13\u5B58\uFF08\u9700\u5148\u5207\u5230\u4E3B\u8981\u8BBE\u7F6E\u9875\u9762,\u5E76\u9009\u62E9\u7F13\u5B58\u6E05\u9664\u8303\u56F4\uFF09" },
      "sync_server_images": { selector: "#sync-server-images-btn", desc: "\u540C\u6B65\u670D\u52A1\u5668\u56FE\u7247\u5230\u672C\u5730\u7F13\u5B58" },
      "migrate_vibe_storage": { selector: "#migrate-vibe-storage-btn", desc: "\u8FC1\u79FB Vibe \u6570\u636E\u5230\u9152\u9986\u5B58\u50A8" },
      "migrate_database": { selector: "#migrate-database-btn", desc: "\u6267\u884C\u6570\u636E\u5E93\u8FC1\u79FB" },
      // === 正则页面操作 ===
      "regex_test_run": { selector: "#ch-test-regex-button", desc: "\u6267\u884C\u6B63\u5219\u6D4B\u8BD5 \u2014\u2014 \u5E94\u7528\u5F53\u524D\u914D\u7F6E\u7684\u6B63\u5219\u5E76\u6D4B\u8BD5\uFF08\u9700\u5148\u5207\u5230\u6B63\u5219\u9875\u9762\uFF09" },
      "regex_add_entry": { selector: "#ch-add-regex-entry-button", desc: "\u65B0\u5EFA\u4E00\u4E2A\u6B63\u5219\u6761\u76EE\uFF08\u9700\u5148\u5207\u5230\u6B63\u5219\u9875\u9762\uFF09" },
      "regex_save_profile": { selector: "#ch-save-regex-profile-button", desc: "\u4FDD\u5B58\u5F53\u524D\u6B63\u5219\u914D\u7F6E\uFF08\u9700\u5148\u5207\u5230\u6B63\u5219\u9875\u9762\uFF09" },
      // === 日志页面操作 ===
      "export_log": { selector: "#ch-export-log", desc: "\u5BFC\u51FA\u8FD0\u884C\u65E5\u5FD7\u5230\u6587\u4EF6\uFF08\u9700\u5148\u5207\u5230\u65E5\u5FD7\u9875\u9762\uFF09" },
      "clear_log": { selector: "#ch-clear-log", desc: "\u6E05\u7A7A\u6240\u6709\u8FD0\u884C\u65E5\u5FD7\uFF08\u9700\u5148\u5207\u5230\u65E5\u5FD7\u9875\u9762\uFF09" },
      "download_debug_log": { selector: "#ch-download-debug-log", desc: "\u4E0B\u8F7D\u8C03\u8BD5\u65E5\u5FD7\u5230\u6587\u4EF6\uFF08\u9700\u5148\u5207\u5230\u65E5\u5FD7\u9875\u9762\uFF09" },
      "clear_debug_log": { selector: "#ch-clear-debug-log", desc: "\u6E05\u7A7A\u8C03\u8BD5\u65E5\u5FD7\uFF08\u9700\u5148\u5207\u5230\u65E5\u5FD7\u9875\u9762\uFF09" },
      // === 全局设置操作 ===
      "export_settings": { selector: "#ch-export-settings", desc: "\u5BFC\u51FA\u5F53\u524D\u6240\u6709\u63D2\u4EF6\u8BBE\u7F6E\u5230\u6587\u4EF6" },
      "import_settings": { selector: "#ch-import-settings", desc: "\u4ECE\u6587\u4EF6\u5BFC\u5165\u63D2\u4EF6\u8BBE\u7F6E" },
      "restore_settings": { selector: "#ch-restore-settings", desc: "\u91CD\u7F6E\u6240\u6709\u63D2\u4EF6\u8BBE\u7F6E\u4E3A\u9ED8\u8BA4\u503C\uFF08\u26A0\uFE0F\u614E\u7528\uFF09" }
    };

function resolveConfigPath(dotPath) {
  const rawSettings = extension_settings[extensionName];
  if (!rawSettings) return { target: null, error: "[\u9519\u8BEF] \u63D2\u4EF6\u914D\u7F6E\u5C1A\u672A\u521D\u59CB\u5316\u3002" };
  if (!dotPath || dotPath === "") {
    return { target: rawSettings, error: null };
  }
  if (dotPath.startsWith("llm.")) {
    const currentProfile = rawSettings.current_llm_profile || "\u9ED8\u8BA4";
    const subPath = dotPath.substring(4);
    if (subPath === "current_profile") {
      dotPath = "current_llm_profile";
    } else if (subPath.startsWith("request_types.")) {
      dotPath = subPath.replace("request_types.", "llm_request_type_configs.");
    } else {
      dotPath = `llm_profiles.${currentProfile}.${subPath}`;
    }
  }
  const parts = dotPath.split(".");
  let current = rawSettings;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (current === null || current === void 0 || typeof current !== "object") {
      return { target: null, error: `[\u9519\u8BEF] \u8DEF\u5F84 "${parts.slice(0, i).join(".")}" \u4E0D\u662F\u5BF9\u8C61\uFF0C\u65E0\u6CD5\u7EE7\u7EED\u8BBF\u95EE "${key}"\u3002` };
    }
    if (!(key in current)) {
      return { target: null, error: `[\u9519\u8BEF] \u5728\u8DEF\u5F84 "${parts.slice(0, i).join(".") || "\u6839"}" \u4E0B\u4E0D\u5B58\u5728\u952E "${key}"\u3002` };
    }
    current = current[key];
  }
  return { target: current, error: null };
}

function getValueSizeDesc(value) {
  if (value === null || value === void 0) return "\u7A7A";
  if (Array.isArray(value)) return `${value.length}\u9879`;
  if (typeof value === "object") return `${Object.keys(value).length}\u4E2A\u5B50\u952E`;
  const str = String(value);
  return `${str.length}\u5B57\u7B26`;
}

function browseConfigPath(dotPath) {
  const originalPath = dotPath;
  const { target, error } = resolveConfigPath(dotPath);
  if (error) return error;
  if (target === null || target === void 0 || typeof target !== "object") {
    const valType = target === null ? "null" : typeof target;
    const strVal = String(target);
    if (strVal.length > 2e3) {
      return `\u8DEF\u5F84 "${originalPath}" \u662F\u4E00\u4E2A ${valType} \u7C7B\u578B\u7684\u53F6\u5B50\u503C (${strVal.length}\u5B57\u7B26)\uFF0C\u5185\u5BB9\u8FC7\u957F\u5DF2\u622A\u65AD\u3002\u524D 2000 \u5B57\u7B26\u9884\u89C8:
${strVal.substring(0, 2e3)}
... [\u5DF2\u622A\u65AD\uFF0C\u8BF7\u4F7F\u7528 read \u6307\u4EE4\u67E5\u770B\u5B8C\u6574\u5185\u5BB9]`;
    }
    return `\u8DEF\u5F84 "${originalPath}" \u662F\u4E00\u4E2A ${valType} \u7C7B\u578B\u7684\u53F6\u5B50\u503C: ${strVal}`;
  }
  const displayPath = originalPath || "(\u6839\u76EE\u5F55)";
  const keys = Array.isArray(target) ? target.map((_, i) => String(i)) : Object.keys(target);
  if (keys.length === 0) {
    return `\u8DEF\u5F84 "${displayPath}" \u662F\u4E00\u4E2A\u7A7A\u7684 ${Array.isArray(target) ? "\u6570\u7EC4" : "\u5BF9\u8C61"}\u3002`;
  }
  let result = `\u{1F4C2} \u8DEF\u5F84: ${displayPath}  |  \u7C7B\u578B: ${Array.isArray(target) ? "\u6570\u7EC4" : "\u5BF9\u8C61"}  |  \u5171 ${keys.length} \u9879
`;
  result += "\u2500".repeat(50) + "\n";
  for (const key of keys) {
    const child = target[key];
    const childType = child === null ? "null" : Array.isArray(child) ? "array" : typeof child;
    const size = getValueSizeDesc(child);
    const fullKey = originalPath ? `${originalPath}.${key}` : key;
    const desc = ConfigDescriptions[key] || ConfigDescriptions[fullKey] || "";
    let preview = "";
    if (childType === "string" || childType === "number" || childType === "boolean") {
      const val = String(child);
      preview = val.length > 80 ? ` = "${val.substring(0, 80)}..."` : ` = "${val}"`;
    }
    const descPart = desc ? `  // ${desc}` : "";
    result += `  ${key}  [${childType}, ${size}]${preview}${descPart}
`;
  }
  return result;
}

function readConfigPath(dotPath) {
  if (!dotPath) return "[\u9519\u8BEF] read \u64CD\u4F5C\u9700\u8981\u6307\u5B9A\u8DEF\u5F84\uFF0C\u4E0D\u80FD\u4E3A\u7A7A\u3002";
  const originalPath = dotPath;
  const { target, error } = resolveConfigPath(dotPath);
  if (error) return error;
  if (target === null || target === void 0) {
    return `\u8DEF\u5F84 "${originalPath}" \u7684\u503C\u4E3A: ${String(target)}`;
  }
  if (typeof target === "object") {
    try {
      const jsonStr = JSON.stringify(target, null, 2);
      if (jsonStr.length > 3e4) {
        return `\u8DEF\u5F84 "${originalPath}" \u7684\u5185\u5BB9\u8FC7\u5927 (${jsonStr.length}\u5B57\u7B26)\uFF0C\u5EFA\u8BAE\u4F7F\u7528 browse \u9010\u5C42\u67E5\u770B\u3002\u4EE5\u4E0B\u662F\u524D 15000 \u5B57\u7B26\u9884\u89C8:
${jsonStr.substring(0, 15e3)}
... [\u5DF2\u622A\u65AD]`;
      }
      return `\u8DEF\u5F84 "${originalPath}" \u7684\u5B8C\u6574\u5185\u5BB9:
${jsonStr}`;
    } catch (e) {
      return `[\u9519\u8BEF] \u65E0\u6CD5\u5E8F\u5217\u5316: ${e.message}`;
    }
  }
  return `\u8DEF\u5F84 "${originalPath}" \u7684\u503C\u4E3A: ${String(target)}`;
}

function writeConfigPath(dotPath, newValue) {
  if (!dotPath) return "[\u9519\u8BEF] write \u64CD\u4F5C\u9700\u8981\u6307\u5B9A\u8DEF\u5F84\u3002";
  const rawSettings = extension_settings[extensionName];
  if (!rawSettings) return "[\u9519\u8BEF] \u63D2\u4EF6\u914D\u7F6E\u5C1A\u672A\u521D\u59CB\u5316\u3002";
  const parts = dotPath.split(".");
  const lastKey = parts.pop();
  const parentPath = parts.join(".");
  const { target: parent, error } = resolveConfigPath(parentPath);
  if (error) return error;
  if (parent === null || parent === void 0 || typeof parent !== "object") {
    return `[\u9519\u8BEF] \u7236\u8DEF\u5F84 "${parentPath || "\u6839"}" \u4E0D\u662F\u5BF9\u8C61\uFF0C\u65E0\u6CD5\u5199\u5165\u952E "${lastKey}"\u3002`;
  }
  const isNewKey = !(lastKey in parent);
  if (isNewKey && !parentPath) {
    return `\u274C \u5199\u5165\u5931\u8D25\uFF1A\u9876\u5C42\u914D\u7F6E\u9879 "${lastKey}" \u4E0D\u5B58\u5728\u3002
\u8BF7\u52FF\u731C\u6D4B\u5C5E\u6027\u540D\uFF01\u8BF7\u5148\u4F7F\u7528 browse \u67E5\u770B\u5B9E\u9645\u5B58\u5728\u7684\u914D\u7F6E\u9879\uFF1A
<SystemQuery>{"type": "browse", "path": ""}</SystemQuery>`;
  }
  if (isNewKey && parentPath) {
    const DYNAMIC_COLLECTION_PATHS = /* @__PURE__ */ new Set([
      "llm_profiles",
      "test_context_profiles",
      "workers",
      "runninghub_workers",
      "yushe",
      "prompt_replace",
      "vibePresets",
      "regex_profiles",
      "themes",
      "fabThemes",
      "worldBookList",
      "bananaCharacterPresets",
      "novelai_profiles",
      "comfyui_profiles",
      "jiuguanStorage",
      "banana.conversationPresets"
    ]);
    let normalizedParent = parentPath;
    if (parentPath.startsWith("llm.")) {
      const sub = parentPath.substring(4);
      if (sub.startsWith("request_types.")) {
        normalizedParent = sub.replace("request_types.", "llm_request_type_configs.");
      }
    }
    if (!DYNAMIC_COLLECTION_PATHS.has(normalizedParent) && !DYNAMIC_COLLECTION_PATHS.has(parentPath)) {
      const existingKeys = Object.keys(parent).join(", ");
      return `\u274C \u5199\u5165\u5931\u8D25\uFF1A\u8DEF\u5F84 "${dotPath}" \u4E2D\u5C5E\u6027 "${lastKey}" \u4E0D\u5B58\u5728\u3002
\u8BE5\u5BF9\u8C61\u5DF2\u6709\u7684\u5C5E\u6027: [${existingKeys}]
\u8BF7\u68C0\u67E5\u5C5E\u6027\u540D\u662F\u5426\u6B63\u786E\uFF01\u4E0D\u8981\u731C\u6D4B\u5C5E\u6027\u540D\uFF0C\u8BF7\u5148\u4F7F\u7528 browse \u67E5\u770B\uFF1A
<SystemQuery>{"type": "browse", "path": "${parentPath}"}</SystemQuery>`;
    }
  }
  const oldValue = isNewKey ? void 0 : parent[lastKey];
  parent[lastKey] = newValue;
  saveSettingsDebounced();
  document.dispatchEvent(new CustomEvent("st-chatu8-config-updated", {
    detail: { changed: { [dotPath]: newValue } }
  }));
  if (typeof window.loadSilterTavernChatu8Settings === "function") {
    try {
      window.loadSilterTavernChatu8Settings();
    } catch (e) {
      console.warn("[AI Config Helper] \u5237\u65B0\u8BBE\u7F6E\u9875\u9762\u5931\u8D25:", e);
    }
  }
  const isLLMConfig = dotPath.startsWith("llm.") || dotPath.startsWith("llm_profiles.") || dotPath === "current_llm_profile" || dotPath.startsWith("request_types.") || dotPath.startsWith("llm_request_type_configs.");
  if (isLLMConfig) {
    try {
      import("../settings/llm.js").then((llmModule) => {
        if (llmModule.loadLLMProfiles) {
          llmModule.loadLLMProfiles();
          console.log("[AI Config Helper] \u5DF2\u5237\u65B0 LLM \u914D\u7F6E\u663E\u793A");
        }
        if ((dotPath.startsWith("request_types.") || dotPath.startsWith("llm_request_type_configs.")) && llmModule.populateRequestTypeSelects) {
          llmModule.populateRequestTypeSelects();
          console.log("[AI Config Helper] \u5DF2\u5237\u65B0\u8BF7\u6C42\u7C7B\u578B\u914D\u7F6E\u663E\u793A");
        }
      }).catch((err) => {
        console.warn("[AI Config Helper] \u65E0\u6CD5\u52A0\u8F7D LLM \u6A21\u5757\u5237\u65B0\u914D\u7F6E:", err);
      });
    } catch (e) {
      console.warn("[AI Config Helper] \u5237\u65B0 LLM \u914D\u7F6E\u65F6\u51FA\u9519:", e);
    }
  }
  const isThemeStyleConfig = dotPath === "generate_btn_style" || dotPath === "image_frame_style" || dotPath === "collapse_style";
  if (isThemeStyleConfig) {
    try {
      import("../settings/theme.js").then((themeModule) => {
        const currentTheme = rawSettings.themes?.[rawSettings.theme_id] || {};
        const isDark = themeModule.isThemeDark ? themeModule.isThemeDark(currentTheme) : true;
        if (dotPath === "generate_btn_style" && themeModule.applyGenerateButtonStyle) {
          themeModule.applyGenerateButtonStyle(newValue, isDark);
          console.log("[AI Config Helper] \u5DF2\u81EA\u52A8\u5E94\u7528\u751F\u6210\u6309\u94AE\u6837\u5F0F:", newValue);
        } else if (dotPath === "image_frame_style" && themeModule.applyImageFrameStyle) {
          themeModule.applyImageFrameStyle(newValue, isDark);
          console.log("[AI Config Helper] \u5DF2\u81EA\u52A8\u5E94\u7528\u56FE\u7247\u8FB9\u6846\u6837\u5F0F:", newValue);
        } else if (dotPath === "collapse_style" && themeModule.applyCollapseStyle) {
          themeModule.applyCollapseStyle(newValue, isDark);
          console.log("[AI Config Helper] \u5DF2\u81EA\u52A8\u5E94\u7528\u6298\u53E0\u6837\u5F0F:", newValue);
        }
        const selectId = dotPath === "generate_btn_style" ? "theme_generate_btn_style" : dotPath === "image_frame_style" ? "theme_image_frame_style" : "theme_collapse_style";
        const selectEl = document.getElementById(selectId);
        if (selectEl) {
          selectEl.value = newValue;
          console.log("[AI Config Helper] \u5DF2\u66F4\u65B0\u4E0B\u62C9\u6846\u663E\u793A:", selectId, "=", newValue);
        }
      }).catch((err) => {
        console.warn("[AI Config Helper] \u65E0\u6CD5\u52A0\u8F7D\u4E3B\u9898\u6A21\u5757\u5E94\u7528\u6837\u5F0F:", err);
      });
    } catch (e) {
      console.warn("[AI Config Helper] \u5E94\u7528\u6837\u5F0F\u65F6\u51FA\u9519:", e);
    }
  }
  const oldStr = isNewKey ? "(\u4E0D\u5B58\u5728)" : typeof oldValue === "object" ? JSON.stringify(oldValue).substring(0, 100) : String(oldValue);
  const newStr = typeof newValue === "object" ? JSON.stringify(newValue).substring(0, 100) : String(newValue);
  const action = isNewKey ? "\u521B\u5EFA" : "\u4FEE\u6539";
  console.log(`[AI Config Helper] \u8DEF\u5F84 [${dotPath}] \u5DF2${action}: ${oldStr} \u2192 ${newStr}`);
  return `\u2705 \u5DF2\u6210\u529F${action}: "${dotPath}"
   \u65E7\u503C: ${oldStr}
   \u65B0\u503C: ${newStr}`;
}

function executeUIAction(actionName) {
  if (!actionName) return "\u274C \u672A\u6307\u5B9A\u64CD\u4F5C\u540D\u79F0\u3002";
  const action = UIActionRegistry[actionName];
  if (!action) {
    const available = Object.keys(UIActionRegistry).join(", ");
    return `\u274C \u672A\u77E5\u64CD\u4F5C: "${actionName}"\u3002\u53EF\u7528: ${available}`;
  }
  try {
    const $el = $(action.selector);
    if (!$el.length) {
      return `\u274C \u672A\u627E\u5230\u5143\u7D20 (${action.desc})\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u5BF9\u5E94\u6807\u7B7E\u9875\u3002`;
    }
    $el.click();
    console.log(`[AI Config] UI\u64CD\u4F5C: ${actionName} \u2192 ${action.desc}`);
    return `\u2705 \u5DF2\u6267\u884C: ${action.desc}`;
  } catch (e) {
    return `\u274C \u6267\u884C\u5931\u8D25: ${e.message}`;
  }
}

function getCurrentUIContext() {
  const tabNameMap = {
    main: "\u4E3B\u8981\u8BBE\u7F6E",
    sd: "SD",
    novelai: "NovelAI",
    comfyui: "ComfyUI",
    runninghub: "RunningHub",
    banana: "Banana/grok",
    llm: "LLM\u8BBE\u7F6E",
    vocabulary: "\u8BCD\u5E93",
    character: "\u89D2\u8272\u7BA1\u7406",
    theme: "\u4E3B\u9898\u8BBE\u7F6E",
    fab: "\u60AC\u6D6E\u7403",
    "image-cache": "\u56FE\u7247\u7F13\u5B58",
    regex: "\u6B63\u5219",
    about: "\u5173\u4E8E",
    log: "\u65E5\u5FD7",
    send_data: "\u53D1\u9001\u6570\u636E"
  };
  const activeTab = $(".st-chatu8-nav-link.active").data("tab") || "\u672A\u77E5";
  const tabLabel = tabNameMap[activeTab] || activeTab;
  const panelOpen = $("#ch-settings-modal").is(":visible");
  let result = `\u5F53\u524D\u6807\u7B7E\u9875: ${tabLabel} (${activeTab})`;
  result += `
\u8BBE\u7F6E\u9762\u677F: ${panelOpen ? "\u5DF2\u6253\u5F00" : "\u672A\u6253\u5F00"}`;
  const actions = Object.entries(UIActionRegistry).map(([k, v]) => `  - ${k}: ${v.desc}`).join("\n");
  result += `

\u53EF\u7528\u7684\u6309\u94AE\u64CD\u4F5C:
${actions}`;
  return result;
}

export { browseConfigPath, executeUIAction, getCurrentUIContext, readConfigPath, writeConfigPath };
