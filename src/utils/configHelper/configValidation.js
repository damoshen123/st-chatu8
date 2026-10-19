// 还原自打包产物 — 原始模块: utils/configHelper/configValidation.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { refreshAffectedUI } from "./configUIRefresh.js";
import "../utils.js"; // init_utils

var configUIRefresh_exports;


function getExposedSettings() {
  const rawSettings = extension_settings[extensionName];
  if (!rawSettings) return {};
  const safeSettings = JSON.parse(JSON.stringify(rawSettings));
  delete safeSettings.themes;
  delete safeSettings.fabThemes;
  return safeSettings;
}

function updateSettingSafely(newSettings) {
  if (!newSettings || typeof newSettings !== "object") return false;
  const currentSettings = extension_settings[extensionName];
  if (!currentSettings) return false;
  let isModified = false;
  for (const [key, value] of Object.entries(newSettings)) {
    if (Object.prototype.hasOwnProperty.call(currentSettings, key)) {
      currentSettings[key] = value;
      isModified = true;
      console.log(`[AI Config Helper] \u5DF2\u5C06\u914D\u7F6E [${key}] \u4FEE\u6539\u4E3A:`, value);
    } else {
      console.warn(`[AI Config Helper] \u8B66\u544A\uFF1AAI \u5C1D\u8BD5\u4FEE\u6539\u672A\u77E5\u6216\u4E0D\u5B58\u5728\u7684\u5B57\u6BB5 [${key}]\uFF0C\u5DF2\u5FFD\u7565\u3002`);
    }
  }
  if (isModified) {
    saveSettingsDebounced();
    document.dispatchEvent(new CustomEvent("st-chatu8-config-updated", { detail: { changed: newSettings } }));
    refreshAffectedUI(newSettings);
    return true;
  }
  return false;
}

function getDetailedConfigKeys() {
  const rawSettings = extension_settings[extensionName];
  if (!rawSettings) return [];
  return Object.keys(rawSettings);
}

function getSpecificConfigData(key) {
  const rawSettings = extension_settings[extensionName];
  if (!rawSettings || !(key in rawSettings)) {
    return `[\u83B7\u53D6\u5931\u8D25] \u6240\u6709\u7684\u8BBE\u7F6E\u4E2D\u4E0D\u5B58\u5728\u952E\u540D\u4E3A: ${key} \u7684\u6570\u636E\u3002`;
  }
  const data = rawSettings[key];
  if (typeof data === "object" && data !== null) {
    try {
      return JSON.stringify(data);
    } catch (e) {
      return `[\u83B7\u53D6\u5931\u8D25] \u8BE5\u6570\u636E\u65E0\u6CD5\u8F6C\u6362\u4E3A JSON: ${e.message}`;
    }
  }
  return String(data);
}

function checkRequiredConfigs() {
  const s = extension_settings[extensionName];
  if (!s) return "\u274C \u63D2\u4EF6\u914D\u7F6E\u5C1A\u672A\u521D\u59CB\u5316\u3002";
  const results = [];
  const mode = s.mode || "comfyui";
  results.push({
    name: "\u751F\u56FE\u540E\u7AEF (mode)",
    ok: ["comfyui", "novelai", "sd", "banana"].includes(mode),
    value: mode
  });
  results.push({
    name: "\u63D2\u4EF6\u5DF2\u542F\u7528 (scriptEnabled)",
    ok: s.scriptEnabled === true || s.scriptEnabled === "true",
    value: String(s.scriptEnabled)
  });
  if (mode === "comfyui") {
    results.push({
      name: "ComfyUI \u5730\u5740",
      ok: !!s.comfyuiUrl && s.comfyuiUrl !== "",
      value: s.comfyuiUrl || "(\u672A\u586B)"
    });
  } else if (mode === "sd") {
    results.push({
      name: "SD WebUI \u5730\u5740",
      ok: !!s.sdUrl && s.sdUrl !== "",
      value: s.sdUrl || "(\u672A\u586B)"
    });
  } else if (mode === "novelai") {
    results.push({
      name: "NovelAI API Key",
      ok: !!s.novelaiApi && s.novelaiApi !== "000000",
      value: s.novelaiApi ? "(\u5DF2\u914D\u7F6E)" : "(\u672A\u586B)"
    });
  } else if (mode === "banana") {
    const b = s.banana || {};
    results.push({
      name: "Banana API \u5730\u5740",
      ok: !!b.apiUrl,
      value: b.apiUrl || "(\u672A\u586B)"
    });
    results.push({
      name: "Banana API Key",
      ok: !!b.apiKey && b.apiKey !== "123456",
      value: b.apiKey ? "(\u5DF2\u914D\u7F6E)" : "(\u672A\u586B)"
    });
  }
  const llmProfile = s.llm_profiles?.[s.current_llm_profile || "\u9ED8\u8BA4"];
  if (llmProfile) {
    results.push({
      name: "LLM API \u5730\u5740",
      ok: !!llmProfile.api_url,
      value: llmProfile.api_url || "(\u672A\u586B)"
    });
    results.push({
      name: "LLM API Key",
      ok: !!llmProfile.api_key,
      value: llmProfile.api_key ? "(\u5DF2\u914D\u7F6E)" : "(\u672A\u586B)"
    });
    results.push({
      name: "LLM \u6A21\u578B",
      ok: !!llmProfile.model,
      value: llmProfile.model || "(\u672A\u9009\u62E9)"
    });
  }
  let report = "\u{1F4CB} \u5FC5\u8981\u914D\u7F6E\u68C0\u67E5\u62A5\u544A:\n";
  for (const r of results) {
    const icon = r.ok ? "\u2705" : "\u274C";
    report += `${icon} ${r.name}: ${r.value}
`;
  }
  const allOk = results.every((r) => r.ok);
  if (allOk) {
    report += "\n\u{1F389} \u6240\u6709\u5FC5\u8981\u914D\u7F6E\u5DF2\u5B8C\u6210\uFF01";
  } else {
    const missing = results.filter((r) => !r.ok).map((r) => r.name).join(", ");
    report += `
\u26A0\uFE0F \u4ECD\u9700\u914D\u7F6E: ${missing}`;
  }
  return report;
}

export { checkRequiredConfigs, configUIRefresh_exports, getDetailedConfigKeys, getExposedSettings, getSpecificConfigData, updateSettingSafely };
