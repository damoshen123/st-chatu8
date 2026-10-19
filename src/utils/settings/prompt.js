// 还原自打包产物 — 原始模块: utils/settings/prompt.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { getSortedCharacterIds, parsePromptStringWithCoordinates } from "../utils.js";
import { getConfigImage, saveConfigImage } from "../configDatabase.js";
import { getSuffix, stylInput, stylishConfirm } from "../ui_common.js";
import { calculateNovelAITokens, getNovelAIMaxTokens, getNovelAIQualityPresetsText } from "../novelaiTokenCalculator.js";
import { callTranslation, parseTranslationResult, tagsToJsonString } from "../ai.js";
import { dbs } from "../database.js";
import { generationTabs2 } from "./collapsibleSection.js";
import { setupPresetBoxes } from "./presetBox.js";
import { showPresetVisualSelector } from "./presetVisualSelector.js";

var GROUP_SCOPE, isGlobalListenerBound;

var GROUP_SCOPE = "yushe";
var isGlobalListenerBound = false;

function stripChineseAnnotations2(text) {
  if (!text) return "";
  return text.replace(/（[^）]*）/g, "");
}

async function translateAndAnnotateField(fieldBase, suffix) {
  const textarea = document.getElementById(fieldBase + suffix);
  if (!textarea) return;
  const button = document.getElementById(`translate_${fieldBase}${suffix}`);
  try {
    if (button) {
      button.disabled = true;
      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-language");
        icon.classList.add("fa-spinner", "fa-spin");
      }
    }
    const originalVal = textarea.value || "";
    const cleaned = stripChineseAnnotations2(originalVal).replace(/，/g, ",").replace(/[\r\n]+/g, ",");
    const smartSplitForTranslation = (text) => {
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
    const shouldSkipTag = (tag) => {
      return tag.startsWith("$") && tag.endsWith("$");
    };
    const cleanTagForTranslation3 = (tag) => {
      return tag.replace(/^[\{\[\(\<]+|[\}\]\)\>]+$/g, "").replace(/^\{+|\}+$/g, "").replace(/:[\d.]+$/, "").trim();
    };
    let tokens = [];
    if (cleaned.includes("Scene Composition")) {
      const parsed = parsePromptStringWithCoordinates(cleaned);
      const charIds = getSortedCharacterIds(parsed);
      const keys = ["Scene Composition"];
      charIds.forEach((id) => {
        keys.push(`Character ${id} Prompt`, `Character ${id} UC`);
      });
      keys.forEach((k) => {
        const v = parsed?.[k];
        if (typeof v === "string" && v.trim()) {
          smartSplitForTranslation(v).forEach((t) => {
            if (t && !shouldSkipTag(t)) {
              tokens.push(t);
            }
          });
        }
      });
    } else {
      tokens = smartSplitForTranslation(cleaned).filter((t) => !shouldSkipTag(t));
    }
    tokens = Array.from(new Set(tokens));
    if (tokens.length === 0) {
      toastr.info("\u6CA1\u6709\u53EF\u7FFB\u8BD1\u7684\u6807\u7B7E\u3002");
      return;
    }
    const cleanedTokensForAI = [];
    for (const t of tokens) {
      const cleanedTag = cleanTagForTranslation3(t);
      if (cleanedTag) {
        cleanedTokensForAI.push(cleanedTag);
      }
    }
    const textToTranslate = tagsToJsonString(Array.from(new Set(cleanedTokensForAI)));
    const response = await callTranslation(textToTranslate);
    const map = parseTranslationResult(response);
    const originalTokens = smartSplitForTranslation(cleaned);
    const annotatedTokens = originalTokens.map((t) => {
      if (t.startsWith("$") && t.endsWith("$")) {
        return t;
      }
      const cleanedKey = cleanTagForTranslation3(t);
      if (map[cleanedKey]) {
        return `${t}\uFF08${map[cleanedKey]}\uFF09`;
      }
      if (map[t]) {
        return `${t}\uFF08${map[t]}\uFF09`;
      }
      return t;
    });
    let annotated = annotatedTokens.join(", ");
    const rolePattern = /(?:Scene Composition:|Character\s+\d+\s+(?:Prompt|UC|coordinates):)/i;
    if (rolePattern.test(annotated)) {
      annotated = annotated.replace(/(?:[ \t\r\n]*)(Scene Composition:|Character\s+\d+\s+(?:Prompt|UC|coordinates):)/gi, (match, p1, offset) => {
        return offset === 0 ? p1 : `

${p1}`;
      });
      annotated = annotated.replace(/^\s+/, "").replace(/\n{3,}/g, "\n\n");
    }
    textarea.value = annotated;
    $(textarea).trigger("input");
    toastr.success("\u7FFB\u8BD1\u5B8C\u6210");
  } catch (e) {
    console.error("Tag translation failed:", e);
    alert(`\u7FFB\u8BD1\u5931\u8D25\uFF1A${e.message || e}`);
  } finally {
    if (button) {
      button.disabled = false;
      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-spinner", "fa-spin");
        icon.classList.add("fa-language");
      }
    }
  }
}

async function handleAutocomplete3(inputEl, resultsEl) {
  const text = inputEl.value;
  const cursorPosition = inputEl.selectionStart;
  const textBeforeCursor = text.substring(0, cursorPosition);
  const textAfterCursor = text.substring(cursorPosition);
  const lastCommaBefore = Math.max(textBeforeCursor.lastIndexOf(","), textBeforeCursor.lastIndexOf("\uFF0C"));
  const nextCommaAfter = textAfterCursor.search(/[,，]/);
  const startIndex = lastCommaBefore + 1;
  const endIndex = nextCommaAfter !== -1 ? cursorPosition + nextCommaAfter : text.length;
  const query = text.substring(startIndex, endIndex).trim();
  if (query.length < 1) {
    resultsEl.style.display = "none";
    return;
  }
  try {
    const settings3 = extension_settings[extensionName];
    const startsWith = String(settings3.vocabulary_search_startswith) === "true";
    const limit = parseInt(settings3.vocabulary_search_limit, 10);
    const sortBy = settings3.vocabulary_search_sort;
    const results = await dbs.searchTags(query, { startsWith, limit, sortBy });
    resultsEl.innerHTML = "";
    if (results.length > 0) {
      results.forEach((tag) => {
        const item = document.createElement("div");
        item.className = "ch-autocomplete-item";
        item.textContent = `${tag.name} (${tag.translation})`;
        item.addEventListener("click", () => handleResultClick3(inputEl, resultsEl, tag));
        resultsEl.appendChild(item);
      });
      resultsEl.style.display = "block";
    } else {
      resultsEl.style.display = "none";
    }
  } catch (error) {
    console.error("Tag search failed:", error);
    resultsEl.style.display = "none";
  }
}

function handleResultClick3(inputEl, resultsEl, tag) {
  const text = inputEl.value;
  const cursorPosition = inputEl.selectionStart;
  const textBeforeCursor = text.substring(0, cursorPosition);
  const textAfterCursor = text.substring(cursorPosition);
  const lastCommaBefore = Math.max(textBeforeCursor.lastIndexOf(","), textBeforeCursor.lastIndexOf("\uFF0C"));
  const nextCommaAfter = textAfterCursor.search(/[,，]/);
  const startIndex = lastCommaBefore + 1;
  const endIndex = nextCommaAfter !== -1 ? cursorPosition + nextCommaAfter : text.length;
  const newTagText = `${tag.name}\uFF08${tag.translation}\uFF09`;
  const textBefore = text.substring(0, startIndex);
  const textAfter = text.substring(endIndex);
  const leadingSpace = text.substring(startIndex, startIndex + 1) === " " ? " " : "";
  const trimmedTextAfter = textAfter.trim();
  const trailingComma = trimmedTextAfter.length > 0 && !trimmedTextAfter.startsWith(",") ? ", " : "";
  const newText = `${textBefore.trim() ? textBefore : ""}${leadingSpace}${newTagText}${trailingComma}${textAfter.trim() ? textAfter : ""}`;
  inputEl.value = newText.replace(/，/g, ",");
  resultsEl.style.display = "none";
  inputEl.focus();
  const newCursorPosition = (textBefore + leadingSpace + newTagText + trailingComma).length;
  setTimeout(() => inputEl.setSelectionRange(newCursorPosition, newCursorPosition), 0);
}

function initPromptSettings(settingsModal, settings3) {
  setupPresetBoxes(settingsModal);
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".st-chatu8-field-col")) {
      $(".ch-autocomplete-results").hide();
    }
  });
  generationTabs2.forEach((mode) => {
    const suffix = getSuffix(mode);
    settingsModal.find(`#yusheid${suffix}`).on("change", () => st_chatu8_tishici_change(mode, settings3));
    settingsModal.find(`#st_chatu8_tishici_new${suffix}`).on("click", () => st_chatu8_tishici_new(mode, settings3));
    settingsModal.find(`#st_chatu8_tishici_rename${suffix}`).on("click", () => st_chatu8_tishici_rename(mode, settings3));
    settingsModal.find(`#st_chatu8_tishici_save_style${suffix}`).on("click", () => st_chatu8_tishici_save(mode, settings3));
    settingsModal.find(`#st_chatu8_tishici_update_style${suffix}`).on("click", () => st_chatu8_tishici_update(mode, settings3));
    settingsModal.find(`#st_chatu8_tishici_delete_style${suffix}`).on("click", () => st_chatu8_tishici_delete(mode, settings3));
    settingsModal.find(`#st_chatu8_tishici_export_current${suffix}`).on("click", () => st_chatu8_tishici_export_current(mode, settings3));
    settingsModal.find(`#st_chatu8_tishici_export_all${suffix}`).on("click", () => st_chatu8_tishici_export_all(settings3));
    settingsModal.find(`#st_chatu8_tishici_import${suffix}`).on("click", () => st_chatu8_tishici_import(settings3));
    settingsModal.find(`#st_chatu8_tishici_visual_select${suffix}`).on("click", () => {
      showPresetVisualSelector(mode, settings3, (presetName) => {
        const selectElement = document.getElementById("yusheid" + suffix);
        if (selectElement) {
          selectElement.value = presetName;
          $(selectElement).trigger("change");
        }
      });
    });
    const promptTextareas = [`#fixedPrompt${suffix}`, `#fixedPrompt_end${suffix}`, `#negativePrompt${suffix}`];
    promptTextareas.forEach((selector) => {
      const textarea = $(selector)[0];
      const resultsContainer = $(`${selector}-results`)[0];
      if (textarea && resultsContainer) {
        $(textarea).on("input", () => handleAutocomplete3(textarea, resultsContainer));
        $(textarea).on("click", (event) => event.stopPropagation());
      }
    });
    $(`#fixedPrompt${suffix}, #fixedPrompt_end${suffix}, #negativePrompt${suffix}`).on("input", function() {
      const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
      const presetName = settings3[yusheIdKey];
      const field = $(this).attr("id").replace(suffix, "");
      const warning = $(this).closest(".st-chatu8-field-col").find(".st-chatu8-unsaved-warning");
      $(warning).hide();
      if (presetName && settings3.yushe[presetName]) {
        settings3.yushe[presetName][field] = $(this).val();
        saveSettingsDebounced();
      }
    });
    settingsModal.find(`#translate_fixedPrompt${suffix}`).on("click", () => translateAndAnnotateField("fixedPrompt", suffix));
    settingsModal.find(`#translate_fixedPrompt_end${suffix}`).on("click", () => translateAndAnnotateField("fixedPrompt_end", suffix));
    if (mode === "novelai") {
      const updateTokens = async () => {
        const fixedPromptEl = document.getElementById(`fixedPrompt${suffix}`);
        const fixedPromptEndEl = document.getElementById(`fixedPrompt_end${suffix}`);
        const negativePromptEl = document.getElementById(`negativePrompt${suffix}`);
        const presetsText = getNovelAIQualityPresetsText(extension_settings[extensionName]);
        const maxTokens = getNovelAIMaxTokens(extension_settings[extensionName]);
        if (fixedPromptEl && fixedPromptEndEl) {
          const t1 = await calculateNovelAITokens(fixedPromptEl.value);
          const t2 = await calculateNovelAITokens(fixedPromptEndEl.value);
          const tPresetAQT = await calculateNovelAITokens(presetsText.aqt);
          const totalTokens = t1 + t2 + tPresetAQT;
          const fixedTokensDisplay = document.getElementById("novelai_fixedPrompt_tokens");
          if (fixedTokensDisplay) {
            fixedTokensDisplay.textContent = `\u5F53\u524D\u5360\u7528: ${t1} | \u603B\u5360\u7528: ${totalTokens} / ${maxTokens}`;
            fixedTokensDisplay.style.color = totalTokens > maxTokens ? "#ff6b6b" : "";
          }
          const fixedEndTokensDisplay = document.getElementById("novelai_fixedPrompt_end_tokens");
          if (fixedEndTokensDisplay) {
            fixedEndTokensDisplay.textContent = `\u5F53\u524D\u5360\u7528: ${t2} | \u603B\u5360\u7528: ${totalTokens} / ${maxTokens}`;
            fixedEndTokensDisplay.style.color = totalTokens > maxTokens ? "#ff6b6b" : "";
          }
        }
        if (negativePromptEl) {
          const negTokens = await calculateNovelAITokens(negativePromptEl.value);
          const tPresetUCP = await calculateNovelAITokens(presetsText.ucp);
          const totalNegTokens = negTokens + tPresetUCP;
          const negativeTokensDisplay = document.getElementById("novelai_negativePrompt_tokens");
          if (negativeTokensDisplay) {
            negativeTokensDisplay.textContent = `\u5F53\u524D\u5360\u7528: ${negTokens} | \u603B\u5360\u7528: ${totalNegTokens} / ${maxTokens}`;
            negativeTokensDisplay.style.color = totalNegTokens > maxTokens ? "#ff6b6b" : "";
          }
        }
      };
      let tokenCalcTimeout2;
      const debouncedUpdateTokens = () => {
        clearTimeout(tokenCalcTimeout2);
        tokenCalcTimeout2 = setTimeout(updateTokens, 300);
      };
      $(`#fixedPrompt${suffix}, #fixedPrompt_end${suffix}, #negativePrompt${suffix}`).on("input", debouncedUpdateTokens);
      $(`#AQT_novelai, #UCP_novelai, #novelaimode`).on("change", debouncedUpdateTokens);
      setTimeout(debouncedUpdateTokens, 200);
      setTimeout(debouncedUpdateTokens, 1e3);
      setTimeout(debouncedUpdateTokens, 2e3);
    }
  });
}

function st_chatu8_tishici_change(mode, settings3) {
  const suffix = getSuffix(mode);
  const selectElement = document.getElementById("yusheid" + suffix);
  const newPresetId = selectElement.value;
  const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
  const currentPresetId = settings3[yusheIdKey];
  if (newPresetId === currentPresetId) return;
  const currentPreset = settings3.yushe[currentPresetId] || {};
  const fixedPrompt = document.getElementById("fixedPrompt" + suffix).value;
  const fixedPrompt_end = document.getElementById("fixedPrompt_end" + suffix).value;
  const negativePrompt = document.getElementById("negativePrompt" + suffix).value;
  const isDirty = fixedPrompt !== (currentPreset.fixedPrompt ?? "") || fixedPrompt_end !== (currentPreset.fixedPrompt_end ?? "") || negativePrompt !== (currentPreset.negativePrompt ?? "");
  const switchPreset = () => {
    settings3[yusheIdKey] = newPresetId;
    saveSettingsDebounced();
    const newPreset = settings3.yushe[newPresetId] || {};
    document.getElementById("fixedPrompt" + suffix).value = newPreset.fixedPrompt ?? "";
    document.getElementById("fixedPrompt_end" + suffix).value = newPreset.fixedPrompt_end ?? "";
    document.getElementById("negativePrompt" + suffix).value = newPreset.negativePrompt ?? "";
    const fields = ["fixedPrompt", "fixedPrompt_end", "negativePrompt"];
    fields.forEach((field) => {
      const textarea = document.getElementById(field + suffix);
      const warning = textarea.closest(".st-chatu8-field-col").querySelector(".st-chatu8-unsaved-warning");
      if (warning) $(warning).hide();
    });
    if (mode === "novelai") {
      $(`#fixedPrompt${suffix}`).trigger("input");
    }
  };
  if (isDirty) {
    stylishConfirm("\u60A8\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539\u3002\u8981\u653E\u5F03\u8FD9\u4E9B\u66F4\u6539\u5E76\u5207\u6362\u9884\u8BBE\u5417\uFF1F").then((confirmed) => {
      if (confirmed) {
        switchPreset();
      } else {
        selectElement.value = currentPresetId;
      }
    });
  } else {
    switchPreset();
  }
}

function st_chatu8_tishici_new(mode, settings3) {
  const suffix = getSuffix(mode);
  const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
  stylInput("\u8BF7\u8F93\u5165\u65B0\u9884\u8BBE\u7684\u540D\u79F0").then((newName) => {
    if (newName && newName.trim() !== "") {
      if (settings3.yushe[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.yushe[newName] = { fixedPrompt: "", fixedPrompt_end: "", negativePrompt: "" };
      settings3[yusheIdKey] = newName;
      saveSettingsDebounced();
      window.loadSilterTavernChatu8Settings();
      toastr.success(`\u5DF2\u521B\u5EFA\u7A7A\u9884\u8BBE "${newName}"`);
    }
  });
}

function st_chatu8_tishici_rename(mode, settings3) {
  const suffix = getSuffix(mode);
  const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
  const currentName = settings3[yusheIdKey];
  if (currentName === "\u9ED8\u8BA4" || !settings3.yushe[currentName]) {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u6216\u4E0D\u5B58\u5728\u7684\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.yushe[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.yushe[newName] = settings3.yushe[currentName];
      delete settings3.yushe[currentName];
      settings3[yusheIdKey] = newName;
      saveSettingsDebounced();
      window.loadSilterTavernChatu8Settings();
      toastr.success(`\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function st_chatu8_tishici_save(mode, settings3) {
  const suffix = getSuffix(mode);
  stylInput("\u8BF7\u8F93\u5165\u65B0\u914D\u7F6E\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const fixedPrompt = document.getElementById("fixedPrompt" + suffix).value;
      const fixedPrompt_end = document.getElementById("fixedPrompt_end" + suffix).value;
      const negativePrompt = document.getElementById("negativePrompt" + suffix).value;
      const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
      settings3.yushe[result] = { ...settings3.yushe[result] || {}, "fixedPrompt": fixedPrompt, "fixedPrompt_end": fixedPrompt_end, "negativePrompt": negativePrompt };
      settings3[yusheIdKey] = result;
      saveSettingsDebounced();
      window.loadSilterTavernChatu8Settings();
      alert(`\u9884\u8BBE "${result}" \u5DF2\u4FDD\u5B58\u3002`);
    }
  });
}

function st_chatu8_tishici_update(mode, settings3) {
  const suffix = getSuffix(mode);
  const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
  const presetName = settings3[yusheIdKey];
  if (!presetName || !settings3.yushe[presetName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148\u201C\u53E6\u5B58\u4E3A\u201D\u4E00\u4E2A\u65B0\u9884\u8BBE\u3002");
    return;
  }
  stylishConfirm(`\u786E\u5B9A\u8981\u8986\u76D6\u5F53\u524D\u9884\u8BBE "${presetName}" \u5417\uFF1F`).then((confirmed) => {
    if (confirmed) {
      const fixedPrompt = document.getElementById("fixedPrompt" + suffix).value;
      const fixedPrompt_end = document.getElementById("fixedPrompt_end" + suffix).value;
      const negativePrompt = document.getElementById("negativePrompt" + suffix).value;
      settings3.yushe[presetName] = { ...settings3.yushe[presetName], "fixedPrompt": fixedPrompt, "fixedPrompt_end": fixedPrompt_end, "negativePrompt": negativePrompt };
      saveSettingsDebounced();
      const fields = ["fixedPrompt", "fixedPrompt_end", "negativePrompt"];
      fields.forEach((field) => {
        const textarea = document.getElementById(field + suffix);
        const warning = textarea.closest(".st-chatu8-field-col").querySelector(".st-chatu8-unsaved-warning");
        if (warning) $(warning).hide();
      });
    }
  });
}

function st_chatu8_tishici_delete(mode, settings3) {
  const suffix = getSuffix(mode);
  const selectElement = document.getElementById("yusheid" + suffix);
  const valueToDelete = selectElement.value;
  const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
  if (valueToDelete === "\u9ED8\u8BA4") {
    alert("\u9ED8\u8BA4\u914D\u7F6E\u4E0D\u80FD\u5220\u9664");
    return;
  }
  const modesUsingPreset = [];
  const allModes = {
    sd: { key: "yusheid_sd", name: "SD" },
    novelai: { key: "yusheid_novelai", name: "NovelAI" },
    comfyui: { key: "yusheid_comfyui", name: "ComfyUI" },
    runninghub: { key: "yusheid_runninghub", name: "RunningHub" }
  };
  for (const modeKey in allModes) {
    if (modeKey === mode) continue;
    const modeInfo = allModes[modeKey];
    if (settings3[modeInfo.key] === valueToDelete) {
      modesUsingPreset.push(modeInfo.name);
    }
  }
  if (modesUsingPreset.length > 0) {
    alert(`\u65E0\u6CD5\u5220\u9664\u9884\u8BBE "${valueToDelete}"\uFF0C\u56E0\u4E3A\u5B83\u6B63\u5728\u88AB\u4EE5\u4E0B\u6A21\u5F0F\u4F7F\u7528\uFF1A${modesUsingPreset.join("\u3001 ")}\u3002
\u8BF7\u5148\u5728\u8FD9\u4E9B\u6A21\u5F0F\u4E2D\u5207\u6362\u5230\u5176\u4ED6\u9884\u8BBE\u3002`);
    return;
  }
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664").then((result) => {
    if (result) {
      Reflect.deleteProperty(settings3.yushe, valueToDelete);
      settings3[yusheIdKey] = "\u9ED8\u8BA4";
      saveSettingsDebounced();
      window.loadSilterTavernChatu8Settings();
    }
  });
}

async function st_chatu8_tishici_export_current(mode, settings3) {
  if (typeof mode === "object" && !settings3) {
    settings3 = mode;
    mode = null;
  }
  if (!settings3) {
    settings3 = extension_settings[extensionName];
  }
  if (!mode) {
    const activeTabEl = document.querySelector(".st-chatu8-tab-content.active") || document.querySelector(".st-chatu8-nav-link.active");
    if (activeTabEl) {
      mode = activeTabEl.getAttribute("data-tab-id") || activeTabEl.getAttribute("data-tab") || activeTabEl.id.replace(/^st-chatu8-tab-/, "").replace(/^ch-tab-/, "");
    }
    if (!mode || !generationTabs2.includes(mode)) {
      mode = "sd";
    }
  }
  const suffix = getSuffix(mode);
  const selectElement = document.getElementById("yusheid" + suffix);
  const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
  const selectedId = selectElement?.value || settings3[yusheIdKey];
  if (!selectedId || !settings3.yushe || !settings3.yushe[selectedId]) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const preset = settings3.yushe[selectedId];
  const dataToExport = {
    presets: { [selectedId]: preset },
    images: {}
  };
  if (preset.previewImageId) {
    try {
      const imageData = await getConfigImage(preset.previewImageId);
      if (imageData) {
        dataToExport.images[preset.previewImageId] = imageData;
      }
    } catch (error) {
      console.error(`[Prompt] \u83B7\u53D6\u56FE\u7247 ${preset.previewImageId} \u5931\u8D25:`, error);
    }
  }
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-prompt-preset-${selectedId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function st_chatu8_tishici_export_all(settings3) {
  if (!settings3.yushe || Object.keys(settings3.yushe).length === 0) {
    alert("\u6CA1\u6709\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const dataToExport = {
    presets: settings3.yushe,
    images: {}
  };
  const imageIdsToExport = /* @__PURE__ */ new Set();
  for (const presetName in settings3.yushe) {
    const preset = settings3.yushe[presetName];
    if (preset.previewImageId) {
      imageIdsToExport.add(preset.previewImageId);
    }
  }
  if (imageIdsToExport.size > 0) {
    for (const imageId of imageIdsToExport) {
      try {
        const imageData = await getConfigImage(imageId);
        if (imageData) {
          dataToExport.images[imageId] = imageData;
        }
      } catch (error) {
        console.error(`[Prompt] \u83B7\u53D6\u56FE\u7247 ${imageId} \u5931\u8D25:`, error);
      }
    }
    console.log(`[Prompt] \u5BFC\u51FA ${Object.keys(dataToExport.images).length} \u5F20\u56FE\u7247`);
  }
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "st-chatu8-prompt-presets-all.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function st_chatu8_tishici_import(settings3) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        const importedData = JSON.parse(readerEvent.target.result);
        let presetsToImport = {};
        let imagesToImport = importedData.images || {};
        if (importedData.presets) {
          presetsToImport = importedData.presets;
        } else {
          presetsToImport = importedData;
        }
        let importedImagesCount = 0;
        const imageIdMapping = {};
        if (Object.keys(imagesToImport).length > 0) {
          console.log(`[Prompt] \u6B63\u5728\u5BFC\u5165 ${Object.keys(imagesToImport).length} \u5F20\u56FE\u7247...`);
          for (const oldImageId in imagesToImport) {
            try {
              const imageData = imagesToImport[oldImageId];
              const newImageId = await saveConfigImage(imageData);
              imageIdMapping[oldImageId] = newImageId;
              importedImagesCount++;
            } catch (error) {
              console.error(`[Prompt] \u5BFC\u5165\u56FE\u7247 ${oldImageId} \u5931\u8D25:`, error);
            }
          }
          console.log(`[Prompt] \u6210\u529F\u5BFC\u5165 ${importedImagesCount} \u5F20\u56FE\u7247`);
          for (const presetName in presetsToImport) {
            const preset = presetsToImport[presetName];
            if (preset.previewImageId && imageIdMapping[preset.previewImageId]) {
              preset.previewImageId = imageIdMapping[preset.previewImageId];
            }
          }
        }
        let newPresetsCount = 0;
        for (const key in presetsToImport) {
          if (presetsToImport.hasOwnProperty(key)) {
            if (!settings3.yushe.hasOwnProperty(key)) {
              newPresetsCount++;
            }
            settings3.yushe[key] = presetsToImport[key];
          }
        }
        saveSettingsDebounced();
        window.loadSilterTavernChatu8Settings();
        let message = `\u6210\u529F\u5BFC\u5165 ${Object.keys(presetsToImport).length} \u4E2A\u9884\u8BBE\uFF0C\u5176\u4E2D ${newPresetsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`;
        if (importedImagesCount > 0) {
          message += `
\u540C\u65F6\u5BFC\u5165 ${importedImagesCount} \u5F20\u56FE\u7247\u3002`;
        }
        alert(message);
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002");
        console.error("Error importing presets:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

export function __set_isGlobalListenerBound(v) { isGlobalListenerBound = v; }

export { GROUP_SCOPE, initPromptSettings, isGlobalListenerBound };
