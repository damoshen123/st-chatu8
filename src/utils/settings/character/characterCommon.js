// 还原自打包产物 — 原始模块: utils/settings/character/characterCommon.js
import { extension_settings } from "../../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../../config.js";
import { formatListForDialog, stylInput, stylishConfirm } from "../../ui_common.js";
import { loadOutfitPresetList } from "./outfitPreset.js";
import { loadCharacterPresetList } from "./characterPreset.js";
import { decryptImportData, encryptExportData } from "./crypto.js";

function setupCharacterCommonControls(container) {
  loadCharacterCommonPresetList();
  container.find("#character_common_preset_id").on("change", loadCharacterCommonPreset);
  container.find("#character_common_new").on("click", createNewCharacterCommonPreset);
  container.find("#character_common_rename").on("click", renameCharacterCommonPreset);
  container.find("#character_common_update").on("click", updateCharacterCommonPreset);
  container.find("#character_common_save_as").on("click", saveCharacterCommonPresetAs);
  container.find("#character_common_export").on("click", exportCharacterCommonPreset);
  container.find("#character_common_export_all").on("click", exportAllCharacterCommonPresets);
  container.find("#character_common_import").on("click", importCharacterCommonPreset);
  container.find("#character_common_delete").on("click", deleteCharacterCommonPreset);
  container.find("#character_common_check").on("click", checkCharacterCommonList);
  container.find("#character_common_add").on("click", addCharacterFromCommonSelector);
  container.find("#character_common_refresh").on("click", loadCharacterCommonSelector);
  loadCharacterCommonPreset();
  loadCharacterCommonSelector();
}

function loadCharacterCommonPresetList() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("character_common_preset_id");
  if (!select) return;
  select.innerHTML = "";
  for (const presetName in settings3.characterCommonPresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
  select.value = settings3.characterCommonPresetId;
}

function loadCharacterCommonPreset() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("character_common_preset_id");
  if (!select) return;
  const presetId = select.value;
  settings3.characterCommonPresetId = presetId;
  const preset = settings3.characterCommonPresets[presetId];
  const textarea = document.getElementById("character_common_list");
  if (textarea && preset) {
    textarea.value = (preset.characters || []).join("\n");
  }
  saveSettingsDebounced();
}

function updateCharacterCommonPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterCommonPresetId;
  if (!presetId || !settings3.characterCommonPresets[presetId]) {
    toastr.warning('\u6CA1\u6709\u6D3B\u52A8\u7684\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148"\u53E6\u5B58\u4E3A"\u4E00\u4E2A\u65B0\u9884\u8BBE\u3002');
    return;
  }
  saveCurrentCharacterCommonData(presetId);
  toastr.success(`\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE "${presetId}" \u5DF2\u4FDD\u5B58`);
}

function saveCharacterCommonPresetAs() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      saveCurrentCharacterCommonData(result);
      settings3.characterCommonPresetId = result;
      loadCharacterCommonPresetList();
      alert(`\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE "${result}" \u5DF2\u4FDD\u5B58\u3002`);
    }
  });
}

function createNewCharacterCommonPreset() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      if (settings3.characterCommonPresets[result]) {
        alert(`\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE "${result}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002`);
        return;
      }
      settings3.characterCommonPresets[result] = {
        characters: []
      };
      settings3.characterCommonPresetId = result;
      saveSettingsDebounced();
      loadCharacterCommonPresetList();
      loadCharacterCommonPreset();
      toastr.success(`\u7A7A\u767D\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE "${result}" \u5DF2\u521B\u5EFA\u3002`);
    }
  });
}

function renameCharacterCommonPreset() {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.characterCommonPresetId;
  if (!currentName || !settings3.characterCommonPresets[currentName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4\u901A\u7528\u89D2\u8272\u5217\u8868") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.characterCommonPresets[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.characterCommonPresets[newName] = settings3.characterCommonPresets[currentName];
      delete settings3.characterCommonPresets[currentName];
      settings3.characterCommonPresetId = newName;
      saveSettingsDebounced();
      loadCharacterCommonPresetList();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
      toastr.success(`\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function saveCurrentCharacterCommonData(presetId) {
  const settings3 = extension_settings[extensionName];
  const textarea = document.getElementById("character_common_list");
  if (!textarea) return;
  const characters = textarea.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  settings3.characterCommonPresets[presetId] = {
    characters
  };
  saveSettingsDebounced();
}

function deleteCharacterCommonPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = document.getElementById("character_common_preset_id")?.value;
  if (presetId === "\u9ED8\u8BA4\u901A\u7528\u89D2\u8272\u5217\u8868") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u5220\u9664");
    return;
  }
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664\u8BE5\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE").then((result) => {
    if (result) {
      delete settings3.characterCommonPresets[presetId];
      settings3.characterCommonPresetId = "\u9ED8\u8BA4\u901A\u7528\u89D2\u8272\u5217\u8868";
      loadCharacterCommonPresetList();
      loadCharacterCommonPreset();
      saveSettingsDebounced();
    }
  });
}

async function exportCharacterCommonPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterCommonPresetId;
  const preset = settings3.characterCommonPresets[presetId];
  if (!preset) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const relatedCharacters = preset.characters || [];
  let dataToExport = {
    characterCommonPresets: { [presetId]: preset }
  };
  if (relatedCharacters.length > 0) {
    const charDisplay = formatListForDialog(relatedCharacters, 8, "\u89D2\u8272");
    const confirmMessage = `\u68C0\u6D4B\u5230\u8BE5\u5217\u8868\u5305\u542B ${relatedCharacters.length} \u4E2A\u89D2\u8272${charDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u51FA\u76F8\u5173\u89D2\u8272?`;
    const includeCharacters = await stylishConfirm(confirmMessage);
    if (includeCharacters) {
      dataToExport.characters = {};
      relatedCharacters.forEach((charName) => {
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
  dataToExport = await encryptExportData(dataToExport);
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-\u901A\u7528\u89D2\u8272\u5217\u8868-${presetId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportAllCharacterCommonPresets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.characterCommonPresets || Object.keys(settings3.characterCommonPresets).length === 0) {
    alert("\u6CA1\u6709\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const allCharacters = /* @__PURE__ */ new Set();
  const allOutfits = /* @__PURE__ */ new Set();
  for (const presetName in settings3.characterCommonPresets) {
    const preset = settings3.characterCommonPresets[presetName];
    const characters = preset.characters || [];
    characters.forEach((charName) => {
      allCharacters.add(charName);
      if (settings3.characterPresets[charName]) {
        const charOutfits = settings3.characterPresets[charName].outfits || [];
        charOutfits.forEach((outfitName) => allOutfits.add(outfitName));
      }
    });
  }
  let dataToExport = {
    characterCommonPresets: settings3.characterCommonPresets
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
  dataToExport = await encryptExportData(dataToExport);
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "st-chatu8-\u901A\u7528\u89D2\u8272\u5217\u8868-\u5168\u90E8.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importCharacterCommonPreset() {
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
        let commonPresetsToImport = {};
        let charactersToImport = {};
        let outfitsToImport = {};
        if (importedData.characterCommonPresets) {
          commonPresetsToImport = importedData.characterCommonPresets;
          charactersToImport = importedData.characters || {};
          outfitsToImport = importedData.outfits || {};
        } else {
          commonPresetsToImport = importedData;
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
        let newCommonPresetsCount = 0;
        for (const key in commonPresetsToImport) {
          if (commonPresetsToImport.hasOwnProperty(key)) {
            if (!settings3.characterCommonPresets.hasOwnProperty(key)) {
              newCommonPresetsCount++;
            }
            settings3.characterCommonPresets[key] = commonPresetsToImport[key];
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
        loadCharacterCommonPresetList();
        if (importCharacters) {
          loadCharacterPresetList();
          loadOutfitPresetList();
        }
        const firstImportedKey = Object.keys(commonPresetsToImport)[0];
        if (firstImportedKey) {
          settings3.characterCommonPresetId = firstImportedKey;
          const select = document.getElementById("character_common_preset_id");
          if (select) select.value = firstImportedKey;
          loadCharacterCommonPreset();
        }
        let message = `\u6210\u529F\u5BFC\u5165 ${Object.keys(commonPresetsToImport).length} \u4E2A\u901A\u7528\u89D2\u8272\u5217\u8868\u9884\u8BBE\uFF0C\u5176\u4E2D ${newCommonPresetsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`;
        if (importCharacters) {
          message += `
\u540C\u65F6\u5BFC\u5165 ${Object.keys(charactersToImport).length} \u4E2A\u89D2\u8272\u9884\u8BBE(${newCharactersCount} \u4E2A\u5168\u65B0)`;
          message += `\u548C ${Object.keys(outfitsToImport).length} \u4E2A\u670D\u88C5\u9884\u8BBE(${newOutfitsCount} \u4E2A\u5168\u65B0)\u3002`;
        }
        alert(message);
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002\n\u9519\u8BEF\u4FE1\u606F: " + err.message);
        console.error("Error importing character common presets:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function loadCharacterCommonSelector() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("character_common_selector");
  if (!select) return;
  select.innerHTML = '<option value="">-- \u9009\u62E9\u89D2\u8272 --</option>';
  for (const presetName in settings3.characterPresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
}

function addCharacterFromCommonSelector() {
  const select = document.getElementById("character_common_selector");
  const textarea = document.getElementById("character_common_list");
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

function checkCharacterCommonList() {
  const settings3 = extension_settings[extensionName];
  const textarea = document.getElementById("character_common_list");
  const resultDiv = document.getElementById("character_common_check_result");
  const contentDiv = document.getElementById("character_common_check_content");
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
  const results = { found: [], notFound: [] };
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

export { loadCharacterCommonPreset, loadCharacterCommonPresetList, loadCharacterCommonSelector, setupCharacterCommonControls };
