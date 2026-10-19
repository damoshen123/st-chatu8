// 还原自打包产物 — 原始模块: utils/settings/character/characterEnable.js
import { getContext } from "../../../../../../../st-context.js";
import { extension_settings } from "../../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../../script.js";
import { extensionName } from "../../config.js";
import { getConfigAudio, getConfigImage, saveConfigAudio, saveConfigImage } from "../../configDatabase.js";
import { formatListForDialog, stylInput, stylishConfirm } from "../../ui_common.js";
import { loadOutfitPresetList } from "./outfitPreset.js";
import { loadCharacterPresetList } from "./characterPreset.js";
import { decryptImportData, encryptExportData } from "./crypto.js";
import { normalizeCharacterEnableEntry, normalizeCharacterEnablePreset, normalizeCharacterPreset } from "../../character_config.js";
import { inspectCharacterListTrigger } from "../worldbook.js";
import { inspectCharacterPromptTrigger, inspectCharacterPromptTriggers } from "../../characterprompt.js";

function setupCharacterEnableControls(container) {
  loadCharacterEnablePresetList();
  container.find("#character_enable_preset_id").on("change", loadCharacterEnablePreset);
  container.find("#character_enable_new").on("click", createNewCharacterEnablePreset);
  container.find("#character_enable_rename").on("click", renameCharacterEnablePreset);
  container.find("#character_enable_update").on("click", updateCharacterEnablePreset);
  container.find("#character_enable_save_as").on("click", saveCharacterEnablePresetAs);
  container.find("#character_enable_export").on("click", exportCharacterEnablePreset);
  container.find("#character_enable_export_all").on("click", exportAllCharacterEnablePresets);
  container.find("#character_enable_import").on("click", importCharacterEnablePreset);
  container.find("#character_enable_delete").on("click", deleteCharacterEnablePreset);
  container.find("#character_enable_check").on("click", checkCharacterList);
  container.find("#character_enable_test").on("click", testCharacterTrigger);
  container.find("#character_list_test").on("click", testCharacterListTrigger);
  container.find("#character_enable_add").on("click", addCharacterFromSelector);
  container.find("#character_enable_refresh").on("click", loadCharacterSelector);
  container.find("#character_enable_bind_current_btn").on("click", () => {
    const conet = getContext();
    if (conet && conet.name2) {
      $("#character_enable_bind_card").val(conet.name2);
      updateCharacterEnablePreset();
    } else {
      toastr.warning("\u672A\u80FD\u83B7\u53D6\u5F53\u524D\u89D2\u8272\u5361\u540D\u79F0\uFF0C\u8BF7\u786E\u4FDD\u5DF2\u6253\u5F00\u67D0\u4E2A\u89D2\u8272\u7684\u804A\u5929\u3002");
    }
  });
  container.find("#character_enable_bind_current_chat_btn").on("click", () => {
    const conet = getContext();
    if (conet && conet.chatId) {
      $("#character_enable_bind_chat").val(conet.chatId);
      updateCharacterEnablePreset();
    } else {
      toastr.warning("\u672A\u80FD\u83B7\u53D6\u5F53\u524D\u804A\u5929\u8BB0\u5F55ID\uFF0C\u8BF7\u786E\u4FDD\u5DF2\u6253\u5F00\u67D0\u4E2A\u89D2\u8272\u7684\u804A\u5929\u3002");
    }
  });
  loadCharacterEnablePreset();
  loadCharacterSelector();
}

function loadCharacterEnablePresetList() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("character_enable_preset_id");
  if (!select) return;
  select.innerHTML = "";
  for (const presetName in settings3.characterEnablePresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
  select.value = settings3.characterEnablePresetId;
}

function loadCharacterEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("character_enable_preset_id");
  if (!select) return;
  const presetId = select.value;
  settings3.characterEnablePresetId = presetId;
  const preset = settings3.characterEnablePresets[presetId];
  if (preset) normalizeCharacterEnablePreset(preset);
  const textarea = document.getElementById("character_enable_list");
  const bindCardInput = document.getElementById("character_enable_bind_card");
  const bindChatInput = document.getElementById("character_enable_bind_chat");
  if (textarea && preset) {
    textarea.value = (preset.characters || []).map((entry) => entry.characterPresetName).join("\n");
  }
  if (bindCardInput && preset) {
    bindCardInput.value = preset.bindCharacterCard || "";
  }
  if (bindChatInput && preset) {
    bindChatInput.value = preset.bindChatId || "";
  }
  saveSettingsDebounced();
}

function updateCharacterEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterEnablePresetId;
  if (!presetId || !settings3.characterEnablePresets[presetId]) {
    toastr.warning('\u6CA1\u6709\u6D3B\u52A8\u7684\u89D2\u8272\u542F\u7528\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148"\u53E6\u5B58\u4E3A"\u4E00\u4E2A\u65B0\u9884\u8BBE\u3002');
    return;
  }
  saveCurrentCharacterEnableData(presetId);
  toastr.success(`\u89D2\u8272\u542F\u7528\u9884\u8BBE "${presetId}" \u5DF2\u4FDD\u5B58`);
}

function saveCharacterEnablePresetAs() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u89D2\u8272\u542F\u7528\u9884\u8BBE\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      saveCurrentCharacterEnableData(result);
      settings3.characterEnablePresetId = result;
      loadCharacterEnablePresetList();
      alert(`\u89D2\u8272\u542F\u7528\u9884\u8BBE "${result}" \u5DF2\u4FDD\u5B58\u3002`);
    }
  });
}

function createNewCharacterEnablePreset() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u89D2\u8272\u542F\u7528\u9884\u8BBE\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      if (settings3.characterEnablePresets[result]) {
        alert(`\u89D2\u8272\u542F\u7528\u9884\u8BBE "${result}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002`);
        return;
      }
      settings3.characterEnablePresets[result] = {
        characters: [],
        bindCharacterCard: "",
        bindChatId: ""
      };
      settings3.characterEnablePresetId = result;
      saveSettingsDebounced();
      loadCharacterEnablePresetList();
      loadCharacterEnablePreset();
      toastr.success(`\u7A7A\u767D\u89D2\u8272\u542F\u7528\u9884\u8BBE "${result}" \u5DF2\u521B\u5EFA\u3002`);
    }
  });
}

function renameCharacterEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.characterEnablePresetId;
  if (!currentName || !settings3.characterEnablePresets[currentName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684\u89D2\u8272\u542F\u7528\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4\u542F\u7528\u5217\u8868") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u89D2\u8272\u542F\u7528\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.characterEnablePresets[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.characterEnablePresets[newName] = settings3.characterEnablePresets[currentName];
      delete settings3.characterEnablePresets[currentName];
      settings3.characterEnablePresetId = newName;
      saveSettingsDebounced();
      loadCharacterEnablePresetList();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
      toastr.success(`\u89D2\u8272\u542F\u7528\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function saveCurrentCharacterEnableData(presetId) {
  const settings3 = extension_settings[extensionName];
  const textarea = document.getElementById("character_enable_list");
  if (!textarea) return;
  const characterNames = textarea.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  const previousEntries = Array.isArray(settings3.characterEnablePresets[presetId]?.characters) ? settings3.characterEnablePresets[presetId].characters.map(normalizeCharacterEnableEntry) : [];
  const previousByName = new Map(previousEntries.map((entry) => [entry.characterPresetName, entry]));
  const characters = characterNames.map((characterPresetName) => {
    const oldEntry = previousByName.get(characterPresetName) || normalizeCharacterEnableEntry(characterPresetName);
    const character = settings3.characterPresets?.[characterPresetName];
    if (!character) return oldEntry;
    normalizeCharacterPreset(character);
    const imageMedia = character.photoMedia.find((item) => item.id === oldEntry.imageFileId);
    const audioMedia = character.audioMedia.find((item) => item.id === oldEntry.audioFileId);
    const hasImageReference = Boolean(oldEntry.imageFileId);
    const hasAudioReference = Boolean(oldEntry.audioFileId);
    return {
      ...oldEntry,
      characterPresetName,
      imageFileId: hasImageReference ? oldEntry.imageFileId : character.photoMedia.find((item) => item.id === character.selectedPhotoId)?.id || null,
      audioFileId: hasAudioReference ? oldEntry.audioFileId : character.audioMedia.find((item) => item.id === character.selectedAudioId)?.id || null,
      imageDescription: oldEntry.imageDescription || imageMedia?.description || "",
      audioDescription: oldEntry.audioDescription || audioMedia?.description || ""
    };
  });
  const bindCardInput = document.getElementById("character_enable_bind_card");
  const bindCharacterCard = bindCardInput ? bindCardInput.value.trim() : "";
  const bindChatInput = document.getElementById("character_enable_bind_chat");
  const bindChatId = bindChatInput ? bindChatInput.value.trim() : "";
  settings3.characterEnablePresets[presetId] = normalizeCharacterEnablePreset({
    ...settings3.characterEnablePresets[presetId] || {},
    characters,
    bindCharacterCard,
    bindChatId
  });
  saveSettingsDebounced();
}

function getCharacterEnableInputCharacters() {
  const textarea = document.getElementById("character_enable_list");
  if (!textarea) return [];
  return textarea.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
}

function escapeTestHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function testCharacterTrigger() {
  const settings3 = extension_settings[extensionName];
  const input = document.getElementById("character_enable_test_input");
  const resultDiv = document.getElementById("character_enable_test_result");
  const contentDiv = document.getElementById("character_enable_test_content");
  if (!input || !resultDiv || !contentDiv) return;
  const rawInput = input.value.trim();
  if (!rawInput) {
    alert("\u8BF7\u5148\u8F93\u5165\u8981\u6D4B\u8BD5\u7684\u89E6\u53D1\u8BCD");
    return;
  }
  const testCharacters = getCharacterEnableInputCharacters();
  const select = document.getElementById("character_enable_preset_id");
  const currentPresetId = select?.value || settings3.characterEnablePresetId || "\u9ED8\u8BA4\u542F\u7528\u5217\u8868";
  const originalPresetId = settings3.characterEnablePresetId;
  const hadPreset = Object.prototype.hasOwnProperty.call(settings3.characterEnablePresets, currentPresetId);
  const originalPreset = hadPreset ? JSON.parse(JSON.stringify(settings3.characterEnablePresets[currentPresetId])) : null;
  const formatLabelMap = {
    "plain": "\u7EAF\u540D\u5B57",
    "legacy-character": "\u65E7\u683C\u5F0F\u89D2\u8272\u6807\u8BB0",
    "json": "JSON \u540D\u5B57",
    "json-character": "JSON \u89D2\u8272\u6807\u8BB0",
    "invalid": "\u65E0\u6548\u8F93\u5165"
  };
  const renderMatchSource = (r) => {
    if (!r.matched) return '<span style="color: #dc3545;">\u672A\u547D\u4E2D</span>';
    switch (r.matchSource) {
      case "enabled":
        return '<span style="color: #28a745;">\u542F\u7528\u5217\u8868</span>';
      case "common":
        return '<span style="color: #f0ad4e;">\u901A\u7528\u5217\u8868 <strong>\uFF08\u672A\u542F\u7528\uFF09</strong></span>';
      case "fallback-all":
        return '<span style="color: #dc3545;"><strong>\u672A\u542F\u7528</strong>\uFF08\u5168\u5C40\u515C\u5E95\u547D\u4E2D\uFF09</span>';
      default:
        return '<span style="color: #dc3545;">\u672A\u77E5</span>';
    }
  };
  const hasMultipleSegments = /\$[^$]+\$[\s\S]*\$[^$]+\$/.test(rawInput);
  let segmentResults = [];
  let singleResult = null;
  let errorMessage = "";
  try {
    settings3.characterEnablePresetId = currentPresetId;
    settings3.characterEnablePresets[currentPresetId] = {
      ...hadPreset ? settings3.characterEnablePresets[currentPresetId] : {},
      characters: testCharacters
    };
    if (hasMultipleSegments) {
      segmentResults = inspectCharacterPromptTriggers(rawInput);
    } else {
      singleResult = inspectCharacterPromptTrigger(rawInput);
    }
  } catch (error) {
    errorMessage = error?.message || String(error);
    console.error("[CharacterEnable] Trigger test failed:", error);
  } finally {
    if (hadPreset) {
      settings3.characterEnablePresets[currentPresetId] = originalPreset;
    } else {
      delete settings3.characterEnablePresets[currentPresetId];
    }
    settings3.characterEnablePresetId = originalPresetId;
  }
  let html = "";
  if (errorMessage) {
    html += `<div style="color: #dc3545;"><strong>\u6267\u884C\u9519\u8BEF\uFF1A</strong>${escapeTestHtml(errorMessage)}</div>`;
  } else if (hasMultipleSegments) {
    const hitCount = segmentResults.filter((item) => item.result.matched).length;
    html += '<div style="margin-bottom: 10px;">';
    html += `<strong>\u68C0\u6D4B\u5230\u7247\u6BB5\uFF1A</strong>${segmentResults.length} \u6BB5`;
    html += `<br><strong>\u547D\u4E2D\uFF1A</strong>${hitCount} / ${segmentResults.length}`;
    html += `<br><strong>\u5F53\u524D\u542F\u7528\u5217\u8868\uFF1A</strong>${testCharacters.length} \u4E2A\u89D2\u8272`;
    html += "</div>";
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">';
    html += '<thead><tr><th style="text-align: left; border-bottom: 1px solid var(--SmartThemeBorderColor); padding: 4px;">#</th><th style="text-align: left; border-bottom: 1px solid var(--SmartThemeBorderColor); padding: 4px;">\u539F\u6587</th><th style="text-align: left; border-bottom: 1px solid var(--SmartThemeBorderColor); padding: 4px;">\u683C\u5F0F</th><th style="text-align: left; border-bottom: 1px solid var(--SmartThemeBorderColor); padding: 4px;">\u63D0\u53D6\u540D\u79F0</th><th style="text-align: left; border-bottom: 1px solid var(--SmartThemeBorderColor); padding: 4px;">\u547D\u4E2D</th><th style="text-align: left; border-bottom: 1px solid var(--SmartThemeBorderColor); padding: 4px;">\u547D\u4E2D\u89D2\u8272</th><th style="text-align: left; border-bottom: 1px solid var(--SmartThemeBorderColor); padding: 4px;">\u547D\u4E2D\u9884\u8BBE</th><th style="text-align: left; border-bottom: 1px solid var(--SmartThemeBorderColor); padding: 4px;">\u547D\u4E2D\u6765\u6E90</th></tr></thead><tbody>';
    segmentResults.forEach((item, index) => {
      const r = item.result;
      const formatLabel = formatLabelMap[r.format] || "\u672A\u77E5";
      const hitHtml = r.matched ? '<span style="color: #28a745;">\u2713</span>' : '<span style="color: #dc3545;">\u2717</span>';
      html += `<tr><td style="padding: 4px; vertical-align: top;">${index + 1}</td><td style="padding: 4px; vertical-align: top; word-break: break-all;">${escapeTestHtml(item.segment)}</td><td style="padding: 4px; vertical-align: top;">${escapeTestHtml(formatLabel)}</td><td style="padding: 4px; vertical-align: top; word-break: break-all;">${escapeTestHtml(r.extractedName || "\uFF08\u65E0\uFF09")}</td><td style="padding: 4px; vertical-align: top;">${hitHtml}</td><td style="padding: 4px; vertical-align: top;">${escapeTestHtml(r.matchedDisplayName || "\uFF08\u65E0\uFF09")}</td><td style="padding: 4px; vertical-align: top; word-break: break-all;">${escapeTestHtml(r.matchedPresetId || "\uFF08\u65E0\uFF09")}</td><td style="padding: 4px; vertical-align: top;">${renderMatchSource(r)}</td></tr>`;
    });
    html += "</tbody></table>";
    html += '<div style="margin-top: 10px; color: var(--SmartThemeEmColor);">\u8FD9\u91CC\u53EA\u505A\u540D\u5B57\u5339\u914D\u8BC6\u522B\uFF0C\u4E0D\u4F1A\u6267\u884C\u5B8C\u6574\u7684\u66FF\u6362\u6D41\u7A0B\u3002</div>';
  } else {
    const inspectResult = singleResult || {
      matched: false,
      extractedName: "",
      normalizedName: "",
      matchedDisplayName: "",
      format: "invalid"
    };
    const formatLabel = formatLabelMap[inspectResult.format] || "\u672A\u77E5";
    html += '<div style="margin-bottom: 10px;">';
    html += `<strong>\u540D\u5B57\u5339\u914D\uFF1A</strong>${inspectResult.matched ? '<span style="color: #28a745;">\u5DF2\u547D\u4E2D\u89D2\u8272\u9884\u8BBE</span>' : '<span style="color: #dc3545;">\u672A\u547D\u4E2D\u89D2\u8272\u9884\u8BBE</span>'}`;
    html += `<br><strong>\u5F53\u524D\u542F\u7528\u5217\u8868\uFF1A</strong>${testCharacters.length} \u4E2A\u89D2\u8272`;
    html += "</div>";
    html += `<div style="margin-bottom: 10px;"><strong>\u63D0\u53D6\u540D\u79F0\uFF1A</strong>${escapeTestHtml(inspectResult.extractedName || "\uFF08\u672A\u63D0\u53D6\u5230\uFF09")}</div>`;
    html += `<div style="margin-bottom: 10px;"><strong>\u6807\u51C6\u5316\u540D\u79F0\uFF1A</strong>${escapeTestHtml(inspectResult.normalizedName || "\uFF08\u65E0\uFF09")}</div>`;
    html += `<div style="margin-bottom: 10px;"><strong>\u8F93\u5165\u683C\u5F0F\uFF1A</strong>${escapeTestHtml(formatLabel)}</div>`;
    html += `<div style="margin-bottom: 10px;"><strong>\u547D\u4E2D\u7684\u89D2\u8272\uFF1A</strong>${escapeTestHtml(inspectResult.matchedDisplayName || "\uFF08\u65E0\uFF09")}</div>`;
    html += `<div style="margin-bottom: 10px;"><strong>\u547D\u4E2D\u7684\u9884\u8BBE\uFF1A</strong>${escapeTestHtml(inspectResult.matchedPresetId || "\uFF08\u65E0\uFF09")}</div>`;
    html += `<div style="margin-bottom: 10px;"><strong>\u547D\u4E2D\u6765\u6E90\uFF1A</strong>${renderMatchSource(inspectResult)}</div>`;
    html += `<div style="margin-bottom: 10px;"><strong>\u6D4B\u8BD5\u8F93\u5165\uFF1A</strong><div style="margin-top: 5px; white-space: pre-wrap; word-break: break-word;">${escapeTestHtml(rawInput)}</div></div>`;
    html += '<div style="color: var(--SmartThemeEmColor);">\u63D0\u793A\uFF1A\u82E5\u547D\u4E2D\u6765\u6E90\u4E0D\u662F\u300C\u542F\u7528\u5217\u8868\u300D\uFF0C\u8BF4\u660E\u5F53\u524D\u542F\u7528\u5217\u8868\u5E76\u6CA1\u6709\u8BE5\u89D2\u8272\uFF0C\u662F\u7ECF\u7531\u901A\u7528\u5217\u8868\u6216\u5168\u5C40\u9884\u8BBE\u515C\u5E95\u5339\u914D\u5230\u7684\u3002</div>';
  }
  contentDiv.innerHTML = html;
  $(resultDiv).show();
}

function testCharacterListTrigger() {
  const settings3 = extension_settings[extensionName];
  const input = document.getElementById("character_list_test_input");
  const resultDiv = document.getElementById("character_list_test_result");
  const contentDiv = document.getElementById("character_list_test_content");
  if (!input || !resultDiv || !contentDiv) return;
  const rawInput = input.value;
  if (!rawInput.trim()) {
    alert("\u8BF7\u5148\u7C98\u8D34\u8981\u6D4B\u8BD5\u7684\u89E6\u53D1\u6587\u672C");
    return;
  }
  const testCharacters = getCharacterEnableInputCharacters();
  const select = document.getElementById("character_enable_preset_id");
  const currentPresetId = select?.value || settings3.characterEnablePresetId || "\u9ED8\u8BA4\u542F\u7528\u5217\u8868";
  const originalPresetId = settings3.characterEnablePresetId;
  const hadPreset = Object.prototype.hasOwnProperty.call(settings3.characterEnablePresets, currentPresetId);
  const originalPreset = hadPreset ? JSON.parse(JSON.stringify(settings3.characterEnablePresets[currentPresetId])) : null;
  let inspectResult = null;
  let errorMessage = "";
  try {
    settings3.characterEnablePresetId = currentPresetId;
    settings3.characterEnablePresets[currentPresetId] = {
      ...hadPreset ? settings3.characterEnablePresets[currentPresetId] : {},
      characters: testCharacters
    };
    inspectResult = inspectCharacterListTrigger(rawInput);
  } catch (error) {
    errorMessage = error?.message || String(error);
    console.error("[CharacterEnable] List trigger test failed:", error);
  } finally {
    if (hadPreset) {
      settings3.characterEnablePresets[currentPresetId] = originalPreset;
    } else {
      delete settings3.characterEnablePresets[currentPresetId];
    }
    settings3.characterEnablePresetId = originalPresetId;
  }
  let html = "";
  if (errorMessage) {
    html += `<div style="color: #dc3545;"><strong>\u6267\u884C\u9519\u8BEF\uFF1A</strong>${escapeTestHtml(errorMessage)}</div>`;
  } else if (!inspectResult) {
    html += '<div style="color: #dc3545;">\u672A\u8FD4\u56DE\u7ED3\u679C\u3002</div>';
  } else {
    const { presetId, enabledCount, triggered, notTriggered, missing } = inspectResult;
    html += '<div style="margin-bottom: 10px;">';
    html += `<strong>\u5F53\u524D\u542F\u7528\u9884\u8BBE\uFF1A</strong>${escapeTestHtml(presetId || "\uFF08\u65E0\uFF09")}`;
    html += `<br><strong>\u542F\u7528\u89D2\u8272\u603B\u6570\uFF1A</strong>${enabledCount}`;
    html += `<br><strong>\u547D\u4E2D\uFF1A</strong><span style="color: #28a745;">${triggered.length}</span> &nbsp;/&nbsp; <strong>\u672A\u547D\u4E2D\uFF1A</strong><span style="color: #dc3545;">${notTriggered.length}</span>`;
    if (missing.length > 0) {
      html += ` &nbsp;/&nbsp; <strong>\u7F3A\u5931\u9884\u8BBE\uFF1A</strong><span style="color: #f0ad4e;">${missing.length}</span>`;
    }
    html += "</div>";
    const renderList = (title, items, color) => {
      if (!items || items.length === 0) return "";
      let block = `<div style="margin-top: 10px;"><strong style="color: ${color};">${title}\uFF08${items.length}\uFF09</strong>`;
      block += '<ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 0.9em; line-height: 1.5;">';
      for (const it of items) {
        const nameCN = it.nameCN ? `\u4E2D\u6587\uFF1A${it.nameCN}` : "";
        const nameEN = it.nameEN ? `\u82F1\u6587\uFF1A${it.nameEN}` : "";
        const triggeredBy = it.triggeredBy ? ` <span style="color: #28a745;">\uFF08\u547D\u4E2D\u540D\u5B57\uFF1A${escapeTestHtml(it.triggeredBy)}\uFF09</span>` : "";
        const nameParts = [nameCN, nameEN].filter(Boolean).join("\u3001");
        block += `<li><code>${escapeTestHtml(it.presetId || "")}</code>${nameParts ? " \xB7 " + escapeTestHtml(nameParts) : ""}${triggeredBy}</li>`;
      }
      block += "</ul></div>";
      return block;
    };
    html += renderList("\u2713 \u88AB\u89E6\u53D1\u7684\u89D2\u8272", triggered, "#28a745");
    html += renderList("\u2717 \u672A\u88AB\u89E6\u53D1\u7684\u89D2\u8272", notTriggered, "#dc3545");
    if (missing.length > 0) {
      html += '<div style="margin-top: 10px;"><strong style="color: #f0ad4e;">\u26A0 \u5217\u8868\u4E2D\u4E0D\u5B58\u5728\u7684\u89D2\u8272\u9884\u8BBE ID\uFF08' + missing.length + "\uFF09</strong>";
      html += '<ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 0.9em; line-height: 1.5;">';
      for (const id of missing) {
        html += `<li><code>${escapeTestHtml(id)}</code></li>`;
      }
      html += "</ul></div>";
    }
    html += '<div style="margin-top: 10px; color: var(--SmartThemeEmColor); font-size: 0.85em;">\u8BE5\u6D4B\u8BD5\u4EC5\u53CD\u6620 <code>{{\u89D2\u8272\u542F\u7528\u5217\u8868}}</code> \u7684\u89E6\u53D1\u884C\u4E3A\uFF1A\u5927\u5C0F\u5199 / \u7A7A\u683C\u5DF2\u5FFD\u7565\uFF0C\u4EC5\u626B\u63CF\u542F\u7528\u5217\u8868\u4E2D\u7684\u89D2\u8272\u3002</div>';
  }
  contentDiv.innerHTML = html;
  $(resultDiv).show();
}

function deleteCharacterEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = document.getElementById("character_enable_preset_id")?.value;
  if (presetId === "\u9ED8\u8BA4\u542F\u7528\u5217\u8868") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u5220\u9664");
    return;
  }
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664\u8BE5\u89D2\u8272\u542F\u7528\u9884\u8BBE").then((result) => {
    if (result) {
      delete settings3.characterEnablePresets[presetId];
      settings3.characterEnablePresetId = "\u9ED8\u8BA4\u542F\u7528\u5217\u8868";
      loadCharacterEnablePresetList();
      loadCharacterEnablePreset();
      saveSettingsDebounced();
    }
  });
}

async function appendCharacterMediaToExport(dataToExport) {
  const imageIds = /* @__PURE__ */ new Set();
  const audioIds = /* @__PURE__ */ new Set();
  for (const preset of Object.values(dataToExport.characterEnablePresets || {})) {
    normalizeCharacterEnablePreset(preset);
    for (const entry of preset.characters || []) {
      if (entry.imageFileId) imageIds.add(entry.imageFileId);
      if (entry.audioFileId) audioIds.add(entry.audioFileId);
    }
  }
  for (const character of Object.values(dataToExport.characters || {})) {
    normalizeCharacterPreset(character);
    (character.photoMedia || []).forEach((item) => imageIds.add(item.id));
    (character.photoImageIds || []).forEach((id) => imageIds.add(id));
    (character.audioMedia || []).forEach((item) => audioIds.add(item.id));
  }
  for (const outfit of Object.values(dataToExport.outfits || {})) {
    (outfit.photoImageIds || []).forEach((id) => imageIds.add(id));
    if (outfit.photoImageId) imageIds.add(outfit.photoImageId);
  }
  if (imageIds.size > 0) {
    dataToExport.images = {};
    for (const imageId of imageIds) {
      try {
        const imageData = await getConfigImage(imageId);
        if (imageData) dataToExport.images[imageId] = imageData;
      } catch (error) {
        console.error(`[CharacterEnable] \u83B7\u53D6\u56FE\u7247 ${imageId} \u5931\u8D25:`, error);
      }
    }
  }
  if (audioIds.size > 0) {
    dataToExport.audio = {};
    for (const audioId of audioIds) {
      try {
        const file = await getConfigAudio(audioId);
        const reader = new FileReader();
        dataToExport.audio[audioId] = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file.data);
        });
      } catch (error) {
        console.error(`[CharacterEnable] \u83B7\u53D6\u97F3\u9891 ${audioId} \u5931\u8D25:`, error);
      }
    }
  }
}

function collectCharacterMediaAttachmentIds(enablePresets, characters = {}, outfits = {}) {
  const imageIds = /* @__PURE__ */ new Set();
  const audioIds = /* @__PURE__ */ new Set();
  for (const preset of Object.values(enablePresets || {})) {
    for (const rawEntry of preset?.characters || []) {
      const entry = normalizeCharacterEnableEntry(rawEntry);
      if (entry.imageFileId) imageIds.add(entry.imageFileId);
      if (entry.audioFileId) audioIds.add(entry.audioFileId);
    }
  }
  for (const character of Object.values(characters || {})) {
    for (const item of character?.photoMedia || []) {
      if (item?.id) imageIds.add(item.id);
    }
    for (const id of character?.photoImageIds || []) {
      if (id) imageIds.add(id);
    }
    for (const item of character?.audioMedia || []) {
      if (item?.id) audioIds.add(item.id);
    }
  }
  for (const outfit of Object.values(outfits || {})) {
    for (const id of outfit?.photoImageIds || []) {
      if (id) imageIds.add(id);
    }
    if (outfit?.photoImageId) imageIds.add(outfit.photoImageId);
  }
  return { imageIds, audioIds };
}

async function importCharacterMediaAttachments(importedData, enablePresets, characters, outfits) {
  const imageIdMapping = {};
  const audioIdMapping = {};
  let importedImagesCount = 0;
  let importedAudioCount = 0;
  const { imageIds, audioIds } = collectCharacterMediaAttachmentIds(enablePresets, characters, outfits);
  for (const [oldId, imageData] of Object.entries(importedData.images || {})) {
    if (!imageIds.has(oldId)) continue;
    try {
      imageIdMapping[oldId] = await saveConfigImage(imageData);
      importedImagesCount++;
    } catch (error) {
      console.error(`[CharacterEnable] \u5BFC\u5165\u56FE\u7247 ${oldId} \u5931\u8D25:`, error);
    }
  }
  for (const [oldId, audioData] of Object.entries(importedData.audio || {})) {
    if (!audioIds.has(oldId)) continue;
    try {
      audioIdMapping[oldId] = await saveConfigAudio(audioData);
      importedAudioCount++;
    } catch (error) {
      console.error(`[CharacterEnable] \u5BFC\u5165\u97F3\u9891 ${oldId} \u5931\u8D25:`, error);
    }
  }
  return { imageIdMapping, audioIdMapping, importedImagesCount, importedAudioCount };
}

function remapImportedCharacterMedia(enablePresets, characters, outfits, imageIdMapping, audioIdMapping) {
  for (const preset of Object.values(enablePresets || {})) {
    normalizeCharacterEnablePreset(preset);
    preset.characters = preset.characters.map((entry) => ({
      ...entry,
      imageFileId: entry.imageFileId ? imageIdMapping[entry.imageFileId] || entry.imageFileId : null,
      audioFileId: entry.audioFileId ? audioIdMapping[entry.audioFileId] || entry.audioFileId : null
    }));
  }
  for (const character of Object.values(characters || {})) {
    normalizeCharacterPreset(character);
    character.photoImageIds = (character.photoImageIds || []).map((id) => imageIdMapping[id] || id);
    character.photoMedia = (character.photoMedia || []).map((item) => ({
      ...item,
      id: imageIdMapping[item.id] || item.id
    }));
    character.audioMedia = (character.audioMedia || []).map((item) => ({
      ...item,
      id: audioIdMapping[item.id] || item.id
    }));
    if (character.selectedPhotoId) character.selectedPhotoId = imageIdMapping[character.selectedPhotoId] || character.selectedPhotoId;
    if (character.selectedAudioId) character.selectedAudioId = audioIdMapping[character.selectedAudioId] || character.selectedAudioId;
  }
  for (const outfit of Object.values(outfits || {})) {
    outfit.photoImageIds = (outfit.photoImageIds || []).map((id) => imageIdMapping[id] || id);
    if (outfit.photoImageId) outfit.photoImageId = imageIdMapping[outfit.photoImageId] || outfit.photoImageId;
  }
}

async function exportCharacterEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterEnablePresetId;
  const preset = settings3.characterEnablePresets[presetId];
  if (!preset) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u89D2\u8272\u542F\u7528\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const relatedCharacters = (preset.characters || []).map((entry) => normalizeCharacterEnableEntry(entry));
  let dataToExport = {
    characterEnablePresets: { [presetId]: preset }
  };
  if (relatedCharacters.length > 0) {
    const charNames = relatedCharacters.map((entry) => entry.characterPresetName);
    const charDisplay = formatListForDialog(charNames, 8, "\u89D2\u8272");
    const confirmMessage = `\u68C0\u6D4B\u5230\u8BE5\u5217\u8868\u5305\u542B ${relatedCharacters.length} \u4E2A\u89D2\u8272${charDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u51FA\u76F8\u5173\u89D2\u8272?`;
    const includeCharacters = await stylishConfirm(confirmMessage);
    if (includeCharacters) {
      dataToExport.characters = {};
      relatedCharacters.forEach((entry) => {
        const charName = entry.characterPresetName;
        if (settings3.characterPresets[charName]) {
          const charPreset = settings3.characterPresets[charName];
          dataToExport.characters[charName] = charPreset;
          const charOutfits = charPreset.outfits || [];
          if (charOutfits.length > 0) {
            if (!dataToExport.outfits) {
              dataToExport.outfits = {};
            }
            charOutfits.forEach((outfitName) => {
              if (settings3.outfitPresets[outfitName]) {
                dataToExport.outfits[outfitName] = settings3.outfitPresets[outfitName];
              }
            });
          }
        }
      });
    }
  }
  await appendCharacterMediaToExport(dataToExport);
  dataToExport = await encryptExportData(dataToExport);
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-\u89D2\u8272\u542F\u7528\u5217\u8868-${presetId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportAllCharacterEnablePresets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.characterEnablePresets || Object.keys(settings3.characterEnablePresets).length === 0) {
    alert("\u6CA1\u6709\u89D2\u8272\u542F\u7528\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const allCharacters = /* @__PURE__ */ new Set();
  const allOutfits = /* @__PURE__ */ new Set();
  for (const presetName in settings3.characterEnablePresets) {
    const preset = settings3.characterEnablePresets[presetName];
    const characters = (preset.characters || []).map((entry) => normalizeCharacterEnableEntry(entry));
    characters.forEach((entry) => {
      const charName = entry.characterPresetName;
      allCharacters.add(charName);
      if (settings3.characterPresets[charName]) {
        const charOutfits = settings3.characterPresets[charName].outfits || [];
        charOutfits.forEach((outfitName) => allOutfits.add(outfitName));
      }
    });
  }
  let dataToExport = {
    characterEnablePresets: settings3.characterEnablePresets
  };
  if (allCharacters.size > 0) {
    const charArray = Array.from(allCharacters);
    const charDisplay = formatListForDialog(charArray, 8, "\u89D2\u8272");
    const confirmMessage = `\u68C0\u6D4B\u5230\u6240\u6709\u5217\u8868\u5171\u5305\u542B ${allCharacters.size} \u4E2A\u4E0D\u540C\u7684\u89D2\u8272${charDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u51FA\u76F8\u5173\u89D2\u8272?`;
    const includeCharacters = await stylishConfirm(confirmMessage);
    if (includeCharacters) {
      dataToExport.characters = {};
      allCharacters.forEach((charName) => {
        if (settings3.characterPresets[charName]) {
          dataToExport.characters[charName] = settings3.characterPresets[charName];
        }
      });
      if (allOutfits.size > 0) {
        const outfitArray = Array.from(allOutfits);
        const outfitDisplay = formatListForDialog(outfitArray, 8, "\u670D\u88C5");
        const confirmOutfits = `\u540C\u65F6\u68C0\u6D4B\u5230\u8FD9\u4E9B\u89D2\u8272\u5305\u542B ${allOutfits.size} \u4E2A\u4E0D\u540C\u7684\u670D\u88C5${outfitDisplay}

\u662F\u5426\u4E5F\u4E00\u8D77\u5BFC\u51FA?`;
        const includeOutfits = await stylishConfirm(confirmOutfits);
        if (includeOutfits) {
          dataToExport.outfits = {};
          allOutfits.forEach((outfitName) => {
            if (settings3.outfitPresets[outfitName]) {
              dataToExport.outfits[outfitName] = settings3.outfitPresets[outfitName];
            }
          });
        }
      }
    }
  }
  await appendCharacterMediaToExport(dataToExport);
  dataToExport = await encryptExportData(dataToExport);
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "st-chatu8-\u89D2\u8272\u542F\u7528\u5217\u8868-\u5168\u90E8.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importCharacterEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        let importedData = JSON.parse(readerEvent.target.result);
        importedData = decryptImportData(importedData);
        let enablePresetsToImport = {};
        let charactersToImport = {};
        let outfitsToImport = {};
        if (importedData.characterEnablePresets) {
          enablePresetsToImport = importedData.characterEnablePresets;
          charactersToImport = importedData.characters || {};
          outfitsToImport = importedData.outfits || {};
        } else {
          enablePresetsToImport = importedData;
        }
        if (Array.isArray(charactersToImport)) {
          const temp = {};
          charactersToImport.forEach((item, idx) => {
            if (typeof item === "string" && item.trim()) {
              temp[item.trim()] = { nameCN: item.trim() };
            } else if (item && typeof item === "object") {
              const name = item.nameCN || item.nameEN || `\u89D2\u8272_${idx + 1}`;
              temp[name] = item;
            }
          });
          charactersToImport = temp;
        } else if (charactersToImport && typeof charactersToImport === "object") {
          const temp = {};
          for (const [k, v] of Object.entries(charactersToImport)) {
            if (typeof v === "string" && v.trim()) {
              temp[v.trim()] = { nameCN: v.trim() };
            } else if (v && typeof v === "object") {
              temp[k] = v;
            }
          }
          charactersToImport = temp;
        } else {
          charactersToImport = {};
        }
        let importCharacters = false;
        if (Object.keys(charactersToImport).length > 0) {
          const characterNames = Object.keys(charactersToImport);
          const characterDisplay = formatListForDialog(characterNames, 8, "\u89D2\u8272");
          const confirmMessage = `\u68C0\u6D4B\u5230 ${characterNames.length} \u4E2A\u76F8\u5173\u89D2\u8272${characterDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u5165?`;
          importCharacters = await stylishConfirm(confirmMessage);
        }
        const mediaCharacters = importCharacters ? charactersToImport : {};
        const mediaOutfits = importCharacters ? outfitsToImport : {};
        const {
          imageIdMapping,
          audioIdMapping,
          importedImagesCount,
          importedAudioCount
        } = await importCharacterMediaAttachments(
          importedData,
          enablePresetsToImport,
          mediaCharacters,
          mediaOutfits
        );
        remapImportedCharacterMedia(
          enablePresetsToImport,
          charactersToImport,
          outfitsToImport,
          imageIdMapping,
          audioIdMapping
        );
        let newEnablePresetsCount = 0;
        for (const key in enablePresetsToImport) {
          if (enablePresetsToImport.hasOwnProperty(key)) {
            if (!settings3.characterEnablePresets.hasOwnProperty(key)) {
              newEnablePresetsCount++;
            }
            settings3.characterEnablePresets[key] = enablePresetsToImport[key];
          }
        }
        let newCharactersCount = 0;
        let newOutfitsCount = 0;
        if (importCharacters) {
          for (const key in charactersToImport) {
            if (charactersToImport.hasOwnProperty(key)) {
              if (!settings3.characterPresets.hasOwnProperty(key)) {
                newCharactersCount++;
              }
              settings3.characterPresets[key] = charactersToImport[key];
            }
          }
          for (const key in outfitsToImport) {
            if (outfitsToImport.hasOwnProperty(key)) {
              if (!settings3.outfitPresets.hasOwnProperty(key)) {
                newOutfitsCount++;
              }
              settings3.outfitPresets[key] = outfitsToImport[key];
            }
          }
        }
        saveSettingsDebounced();
        loadCharacterEnablePresetList();
        if (importCharacters) {
          loadCharacterPresetList();
          loadOutfitPresetList();
        }
        const firstImportedKey = Object.keys(enablePresetsToImport)[0];
        if (firstImportedKey) {
          settings3.characterEnablePresetId = firstImportedKey;
          const select = document.getElementById("character_enable_preset_id");
          if (select) select.value = firstImportedKey;
          loadCharacterEnablePreset();
        }
        let message = `\u6210\u529F\u5BFC\u5165 ${Object.keys(enablePresetsToImport).length} \u4E2A\u89D2\u8272\u542F\u7528\u9884\u8BBE\uFF0C\u5176\u4E2D ${newEnablePresetsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`;
        if (importCharacters) {
          message += `
\u540C\u65F6\u5BFC\u5165 ${Object.keys(charactersToImport).length} \u4E2A\u89D2\u8272\u9884\u8BBE(${newCharactersCount} \u4E2A\u5168\u65B0)`;
          message += `\u548C ${Object.keys(outfitsToImport).length} \u4E2A\u670D\u88C5\u9884\u8BBE(${newOutfitsCount} \u4E2A\u5168\u65B0)\u3002`;
        }
        if (importedImagesCount > 0) message += `
\u540C\u65F6\u5BFC\u5165 ${importedImagesCount} \u5F20\u56FE\u7247\u3002`;
        if (importedAudioCount > 0) message += `
\u540C\u65F6\u5BFC\u5165 ${importedAudioCount} \u6761\u97F3\u9891\u3002`;
        alert(message);
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002\n\u9519\u8BEF\u4FE1\u606F: " + err.message);
        console.error("Error importing character enable presets:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function loadCharacterSelector() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("character_enable_selector");
  if (!select) return;
  select.innerHTML = '<option value="">-- \u9009\u62E9\u89D2\u8272 --</option>';
  for (const presetName in settings3.characterPresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
}

function addCharacterFromSelector() {
  const select = document.getElementById("character_enable_selector");
  const textarea = document.getElementById("character_enable_list");
  if (!select || !textarea) return;
  const selectedCharacter = select.value;
  if (!selectedCharacter) {
    alert("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u89D2\u8272");
    return;
  }
  const currentText = textarea.value.trim();
  const lines = currentText ? currentText.split("\n") : [];
  if (lines.includes(selectedCharacter)) {
    alert("\u8BE5\u89D2\u8272\u5DF2\u5728\u5217\u8868\u4E2D");
    return;
  }
  lines.push(selectedCharacter);
  textarea.value = lines.join("\n");
}

function checkCharacterList() {
  const settings3 = extension_settings[extensionName];
  const textarea = document.getElementById("character_enable_list");
  const resultDiv = document.getElementById("character_enable_check_result");
  const contentDiv = document.getElementById("character_enable_check_content");
  if (!textarea || !resultDiv || !contentDiv) return;
  const inputCharacters = textarea.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (inputCharacters.length === 0) {
    alert("\u8BF7\u5148\u8F93\u5165\u89D2\u8272\u540D\u79F0");
    return;
  }
  const availableCharacters = /* @__PURE__ */ new Set();
  for (const presetName in settings3.characterPresets) {
    availableCharacters.add(presetName);
  }
  const results = {
    found: [],
    notFound: []
  };
  inputCharacters.forEach((char) => {
    if (availableCharacters.has(char)) {
      results.found.push(char);
    } else {
      results.notFound.push(char);
    }
  });
  let html = '<div style="margin-bottom: 10px;">';
  html += `<strong>\u603B\u8BA1\uFF1A</strong>${inputCharacters.length} \u4E2A\u89D2\u8272`;
  html += `<br><strong>\u627E\u5230\uFF1A</strong>${results.found.length} \u4E2A`;
  html += `<br><strong>\u672A\u627E\u5230\uFF1A</strong>${results.notFound.length} \u4E2A`;
  html += "</div>";
  if (results.found.length > 0) {
    html += '<div style="margin-bottom: 10px;">';
    html += '<strong style="color: #28a745;">\u2713 \u5DF2\u5B58\u5728\u7684\u89D2\u8272\uFF1A</strong>';
    html += '<ul style="margin: 5px 0; padding-left: 20px;">';
    results.found.forEach((char) => {
      html += `<li>${char}</li>`;
    });
    html += "</ul></div>";
  }
  if (results.notFound.length > 0) {
    html += "<div>";
    html += '<strong style="color: #dc3545;">\u2717 \u672A\u627E\u5230\u7684\u89D2\u8272\uFF1A</strong>';
    html += '<ul style="margin: 5px 0; padding-left: 20px;">';
    results.notFound.forEach((char) => {
      html += `<li>${char}</li>`;
    });
    html += "</ul></div>";
  }
  contentDiv.innerHTML = html;
  $(resultDiv).show();
}

export { loadCharacterEnablePreset, loadCharacterEnablePresetList, loadCharacterSelector, setupCharacterEnableControls };
