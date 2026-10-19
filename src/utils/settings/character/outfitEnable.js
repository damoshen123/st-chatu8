// 还原自打包产物 — 原始模块: utils/settings/character/outfitEnable.js
import { extension_settings } from "../../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../../config.js";
import { formatListForDialog, stylInput, stylishConfirm } from "../../ui_common.js";
import { loadOutfitPresetList } from "./outfitPreset.js";
import { decryptImportData, encryptExportData } from "./crypto.js";

function setupOutfitEnableControls(container) {
  loadOutfitEnablePresetList();
  container.find("#outfit_enable_preset_id").on("change", loadOutfitEnablePreset);
  container.find("#outfit_enable_new").on("click", createNewOutfitEnablePreset);
  container.find("#outfit_enable_rename").on("click", renameOutfitEnablePreset);
  container.find("#outfit_enable_update").on("click", updateOutfitEnablePreset);
  container.find("#outfit_enable_save_as").on("click", saveOutfitEnablePresetAs);
  container.find("#outfit_enable_export").on("click", exportOutfitEnablePreset);
  container.find("#outfit_enable_export_all").on("click", exportAllOutfitEnablePresets);
  container.find("#outfit_enable_import").on("click", importOutfitEnablePreset);
  container.find("#outfit_enable_delete").on("click", deleteOutfitEnablePreset);
  container.find("#outfit_enable_check").on("click", checkOutfitEnableList);
  container.find("#outfit_enable_add").on("click", addOutfitFromEnableSelector);
  container.find("#outfit_enable_refresh").on("click", loadOutfitEnableSelector);
  loadOutfitEnablePreset();
  loadOutfitEnableSelector();
}

function loadOutfitEnablePresetList() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("outfit_enable_preset_id");
  if (!select) return;
  select.innerHTML = "";
  for (const presetName in settings3.outfitEnablePresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
  select.value = settings3.outfitEnablePresetId;
}

function loadOutfitEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("outfit_enable_preset_id");
  if (!select) return;
  const presetId = select.value;
  settings3.outfitEnablePresetId = presetId;
  const preset = settings3.outfitEnablePresets[presetId];
  const textarea = document.getElementById("outfit_enable_list");
  if (textarea && preset) {
    textarea.value = (preset.outfits || []).join("\n");
  }
  saveSettingsDebounced();
}

function updateOutfitEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.outfitEnablePresetId;
  if (!presetId || !settings3.outfitEnablePresets[presetId]) {
    toastr.warning('\u6CA1\u6709\u6D3B\u52A8\u7684\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148"\u53E6\u5B58\u4E3A"\u4E00\u4E2A\u65B0\u9884\u8BBE\u3002');
    return;
  }
  saveCurrentOutfitEnableData(presetId);
  toastr.success(`\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE "${presetId}" \u5DF2\u4FDD\u5B58`);
}

function saveOutfitEnablePresetAs() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      saveCurrentOutfitEnableData(result);
      settings3.outfitEnablePresetId = result;
      loadOutfitEnablePresetList();
      alert(`\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE "${result}" \u5DF2\u4FDD\u5B58\u3002`);
    }
  });
}

function createNewOutfitEnablePreset() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      if (settings3.outfitEnablePresets[result]) {
        alert(`\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE "${result}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002`);
        return;
      }
      settings3.outfitEnablePresets[result] = {
        outfits: []
      };
      settings3.outfitEnablePresetId = result;
      saveSettingsDebounced();
      loadOutfitEnablePresetList();
      loadOutfitEnablePreset();
      toastr.success(`\u7A7A\u767D\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE "${result}" \u5DF2\u521B\u5EFA\u3002`);
    }
  });
}

function renameOutfitEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.outfitEnablePresetId;
  if (!currentName || !settings3.outfitEnablePresets[currentName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4\u670D\u88C5\u5217\u8868") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.outfitEnablePresets[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.outfitEnablePresets[newName] = settings3.outfitEnablePresets[currentName];
      delete settings3.outfitEnablePresets[currentName];
      settings3.outfitEnablePresetId = newName;
      saveSettingsDebounced();
      loadOutfitEnablePresetList();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
      toastr.success(`\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function saveCurrentOutfitEnableData(presetId) {
  const settings3 = extension_settings[extensionName];
  const textarea = document.getElementById("outfit_enable_list");
  if (!textarea) return;
  const outfits = textarea.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  settings3.outfitEnablePresets[presetId] = {
    outfits
  };
  saveSettingsDebounced();
}

function deleteOutfitEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = document.getElementById("outfit_enable_preset_id")?.value;
  if (presetId === "\u9ED8\u8BA4\u670D\u88C5\u5217\u8868") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u5220\u9664");
    return;
  }
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664\u8BE5\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE").then((result) => {
    if (result) {
      delete settings3.outfitEnablePresets[presetId];
      settings3.outfitEnablePresetId = "\u9ED8\u8BA4\u670D\u88C5\u5217\u8868";
      loadOutfitEnablePresetList();
      loadOutfitEnablePreset();
      saveSettingsDebounced();
    }
  });
}

async function exportOutfitEnablePreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.outfitEnablePresetId;
  const preset = settings3.outfitEnablePresets[presetId];
  if (!preset) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const relatedOutfits = preset.outfits || [];
  let dataToExport = {
    outfitEnablePresets: { [presetId]: preset }
  };
  if (relatedOutfits.length > 0) {
    const outfitDisplay = formatListForDialog(relatedOutfits, 8, "\u670D\u88C5");
    const confirmMessage = `\u68C0\u6D4B\u5230\u8BE5\u5217\u8868\u5305\u542B ${relatedOutfits.length} \u4E2A\u670D\u88C5${outfitDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u51FA\u76F8\u5173\u670D\u88C5?`;
    const includeOutfits = await stylishConfirm(confirmMessage);
    if (includeOutfits) {
      dataToExport.outfits = {};
      relatedOutfits.forEach((outfitName) => {
        if (settings3.outfitPresets[outfitName]) {
          dataToExport.outfits[outfitName] = settings3.outfitPresets[outfitName];
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
  a.download = `st-chatu8-\u901A\u7528\u670D\u88C5\u5217\u8868-${presetId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportAllOutfitEnablePresets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.outfitEnablePresets || Object.keys(settings3.outfitEnablePresets).length === 0) {
    alert("\u6CA1\u6709\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const allOutfits = /* @__PURE__ */ new Set();
  for (const presetName in settings3.outfitEnablePresets) {
    const preset = settings3.outfitEnablePresets[presetName];
    const outfits = preset.outfits || [];
    outfits.forEach((outfitName) => allOutfits.add(outfitName));
  }
  let dataToExport = {
    outfitEnablePresets: settings3.outfitEnablePresets
  };
  if (allOutfits.size > 0) {
    const outfitArray = Array.from(allOutfits);
    const outfitDisplay = formatListForDialog(outfitArray, 8, "\u670D\u88C5");
    const confirmMessage = `\u68C0\u6D4B\u5230\u6240\u6709\u5217\u8868\u5171\u5305\u542B ${allOutfits.size} \u4E2A\u4E0D\u540C\u7684\u670D\u88C5${outfitDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u51FA\u76F8\u5173\u670D\u88C5?`;
    const includeOutfits = await stylishConfirm(confirmMessage);
    if (includeOutfits) {
      dataToExport.outfits = {};
      allOutfits.forEach((outfitName) => {
        if (settings3.outfitPresets[outfitName]) {
          dataToExport.outfits[outfitName] = settings3.outfitPresets[outfitName];
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
  a.download = "st-chatu8-\u901A\u7528\u670D\u88C5\u5217\u8868-\u5168\u90E8.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importOutfitEnablePreset() {
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
        let outfitsToImport = {};
        if (importedData.outfitEnablePresets) {
          enablePresetsToImport = importedData.outfitEnablePresets;
          outfitsToImport = importedData.outfits || {};
        } else {
          enablePresetsToImport = importedData;
        }
        let importOutfits = false;
        if (Object.keys(outfitsToImport).length > 0) {
          const outfitNames = Object.keys(outfitsToImport);
          const outfitDisplay = formatListForDialog(outfitNames, 8, "\u670D\u88C5");
          const confirmMessage = `\u68C0\u6D4B\u5230 ${outfitNames.length} \u4E2A\u76F8\u5173\u670D\u88C5${outfitDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u5165?`;
          importOutfits = await stylishConfirm(confirmMessage);
        }
        let newEnablePresetsCount = 0;
        for (const key in enablePresetsToImport) {
          if (enablePresetsToImport.hasOwnProperty(key)) {
            if (!settings3.outfitEnablePresets.hasOwnProperty(key)) {
              newEnablePresetsCount++;
            }
            settings3.outfitEnablePresets[key] = enablePresetsToImport[key];
          }
        }
        let newOutfitsCount = 0;
        if (importOutfits) {
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
        loadOutfitEnablePresetList();
        if (importOutfits) {
          loadOutfitPresetList();
        }
        const firstImportedKey = Object.keys(enablePresetsToImport)[0];
        if (firstImportedKey) {
          settings3.outfitEnablePresetId = firstImportedKey;
          const select = document.getElementById("outfit_enable_preset_id");
          if (select) select.value = firstImportedKey;
          loadOutfitEnablePreset();
        }
        let message = `\u6210\u529F\u5BFC\u5165 ${Object.keys(enablePresetsToImport).length} \u4E2A\u901A\u7528\u670D\u88C5\u5217\u8868\u9884\u8BBE\uFF0C\u5176\u4E2D ${newEnablePresetsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`;
        if (importOutfits) {
          message += `
\u540C\u65F6\u5BFC\u5165 ${Object.keys(outfitsToImport).length} \u4E2A\u670D\u88C5\u9884\u8BBE\uFF0C\u5176\u4E2D ${newOutfitsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`;
        }
        alert(message);
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002\n\u9519\u8BEF\u4FE1\u606F: " + err.message);
        console.error("Error importing outfit enable presets:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function loadOutfitEnableSelector() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("outfit_enable_selector");
  if (!select) return;
  select.innerHTML = '<option value="">-- \u9009\u62E9\u670D\u88C5 --</option>';
  for (const presetName in settings3.outfitPresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
}

function addOutfitFromEnableSelector() {
  const select = document.getElementById("outfit_enable_selector");
  const textarea = document.getElementById("outfit_enable_list");
  if (!select || !textarea) return;
  const selectedOutfit = select.value;
  if (!selectedOutfit) {
    alert("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u670D\u88C5");
    return;
  }
  const currentText = textarea.value.trim();
  const lines = currentText ? currentText.split("\n") : [];
  if (lines.includes(selectedOutfit)) {
    alert("\u8BE5\u670D\u88C5\u5DF2\u5728\u5217\u8868\u4E2D");
    return;
  }
  lines.push(selectedOutfit);
  textarea.value = lines.join("\n");
}

function checkOutfitEnableList() {
  const settings3 = extension_settings[extensionName];
  const textarea = document.getElementById("outfit_enable_list");
  const resultDiv = document.getElementById("outfit_enable_check_result");
  const contentDiv = document.getElementById("outfit_enable_check_content");
  if (!textarea || !resultDiv || !contentDiv) return;
  const inputOutfits = textarea.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (inputOutfits.length === 0) {
    alert("\u8BF7\u5148\u8F93\u5165\u670D\u88C5\u540D\u79F0");
    return;
  }
  const availableOutfits = /* @__PURE__ */ new Set();
  for (const presetName in settings3.outfitPresets) {
    availableOutfits.add(presetName);
  }
  const results = { found: [], notFound: [] };
  inputOutfits.forEach((outfit) => {
    if (availableOutfits.has(outfit)) {
      results.found.push(outfit);
    } else {
      results.notFound.push(outfit);
    }
  });
  let html = '<div style="margin-bottom: 10px;">';
  html += `<strong>\u603B\u8BA1\uFF1A</strong>${inputOutfits.length} \u4E2A\u670D\u88C5`;
  html += `<br><strong>\u627E\u5230\uFF1A</strong>${results.found.length} \u4E2A`;
  html += `<br><strong>\u672A\u627E\u5230\uFF1A</strong>${results.notFound.length} \u4E2A`;
  html += "</div>";
  if (results.found.length > 0) {
    html += '<div style="margin-bottom: 10px;">';
    html += '<strong style="color: #28a745;">\u2713 \u5DF2\u5B58\u5728\u7684\u670D\u88C5\uFF1A</strong>';
    html += '<ul style="margin: 5px 0; padding-left: 20px;">';
    results.found.forEach((outfit) => {
      html += `<li>${outfit}</li>`;
    });
    html += "</ul></div>";
  }
  if (results.notFound.length > 0) {
    html += "<div>";
    html += '<strong style="color: #dc3545;">\u2717 \u672A\u627E\u5230\u7684\u670D\u88C5\uFF1A</strong>';
    html += '<ul style="margin: 5px 0; padding-left: 20px;">';
    results.notFound.forEach((outfit) => {
      html += `<li>${outfit}</li>`;
    });
    html += "</ul></div>";
  }
  contentDiv.innerHTML = html;
  $(resultDiv).show();
}

export { loadOutfitEnablePreset, loadOutfitEnablePresetList, loadOutfitEnableSelector, setupOutfitEnableControls };
