// 还原自打包产物 — 原始模块: utils/settings/prompt_replace.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { getSuffix, stylInput, stylishConfirm } from "../ui_common.js";
import { generationTabs } from "./log.js";

function syncAllPromptReplaceFields(force = false) {
  const settings3 = extension_settings[extensionName];
  const presetName = settings3.prompt_replace_id;
  const currentPreset = settings3.prompt_replace[presetName] || {};
  generationTabs.forEach((mode) => {
    const suffix = getSuffix(mode);
    const replaceSelect = document.getElementById("prompt_replace_id" + suffix);
    if (replaceSelect) replaceSelect.value = presetName;
    const textarea = document.getElementById("prompt_replace_text" + suffix);
    const warning = textarea.closest(".st-chatu8-field-col").querySelector(".st-chatu8-unsaved-warning");
    let isDirty = textarea.value !== (currentPreset.text ?? "");
    if (force || !isDirty) {
      textarea.value = currentPreset.text ?? "";
      if (warning) $(warning).hide();
    }
  });
}

function prompt_replace_change(mode) {
  const settings3 = extension_settings[extensionName];
  const suffix = getSuffix(mode);
  const selectElement = document.getElementById("prompt_replace_id" + suffix);
  const newPresetId = selectElement.value;
  const currentPresetId = settings3.prompt_replace_id;
  const currentPreset = settings3.prompt_replace[currentPresetId] || {};
  const text = document.getElementById("prompt_replace_text" + suffix).value;
  const isDirty = text !== (currentPreset.text ?? "");
  if (isDirty) {
    stylishConfirm("\u60A8\u6709\u672A\u4FDD\u5B58\u7684\u66FF\u6362\u89C4\u5219\u3002\u8981\u653E\u5F03\u8FD9\u4E9B\u66F4\u6539\u5E76\u5207\u6362\u9884\u8BBE\u5417\uFF1F").then((confirmed) => {
      if (confirmed) {
        settings3.prompt_replace_id = newPresetId;
        saveSettingsDebounced();
        syncAllPromptReplaceFields(true);
      } else {
        selectElement.value = currentPresetId;
      }
    });
  } else {
    settings3.prompt_replace_id = newPresetId;
    saveSettingsDebounced();
    syncAllPromptReplaceFields(true);
  }
}

function prompt_replace_new(mode) {
  const settings3 = extension_settings[extensionName];
  stylInput("\u8BF7\u8F93\u5165\u65B0\u66FF\u6362\u89C4\u5219\u914D\u7F6E\u7684\u540D\u79F0").then((newName) => {
    if (newName && newName.trim() !== "") {
      if (settings3.prompt_replace[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.prompt_replace[newName] = { "text": "" };
      settings3.prompt_replace_id = newName;
      saveSettingsDebounced();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after creating preset:", error);
      }
    }
  });
}

function prompt_replace_rename(mode) {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.prompt_replace_id;
  if (currentName === "\u9ED8\u8BA4" || !settings3.prompt_replace[currentName]) {
    alert("\u9ED8\u8BA4\u914D\u7F6E\u6216\u4E0D\u5B58\u5728\u7684\u914D\u7F6E\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u914D\u7F6E\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.prompt_replace[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.prompt_replace[newName] = settings3.prompt_replace[currentName];
      delete settings3.prompt_replace[currentName];
      settings3.prompt_replace_id = newName;
      saveSettingsDebounced();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
    }
  });
}

function prompt_replace_save(mode) {
  const settings3 = extension_settings[extensionName];
  const suffix = getSuffix(mode);
  stylInput("\u8BF7\u8F93\u5165\u65B0\u66FF\u6362\u89C4\u5219\u914D\u7F6E\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const text = document.getElementById("prompt_replace_text" + suffix).value;
      settings3.prompt_replace[result] = { "text": text };
      settings3.prompt_replace_id = result;
      saveSettingsDebounced();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after saving preset:", error);
      }
      alert(`\u66FF\u6362\u89C4\u5219 "${result}" \u5DF2\u4FDD\u5B58\u3002`);
    }
  });
}

function prompt_replace_update(mode) {
  const settings3 = extension_settings[extensionName];
  const suffix = getSuffix(mode);
  const presetName = settings3.prompt_replace_id;
  if (!presetName || !settings3.prompt_replace[presetName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684\u66FF\u6362\u89C4\u5219\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148\u201C\u53E6\u5B58\u4E3A\u201D\u4E00\u4E2A\u65B0\u89C4\u5219\u3002");
    return;
  }
  stylishConfirm(`\u786E\u5B9A\u8981\u8986\u76D6\u5F53\u524D\u66FF\u6362\u89C4\u5219 "${presetName}" \u5417\uFF1F`).then((confirmed) => {
    if (confirmed) {
      const text = document.getElementById("prompt_replace_text" + suffix).value;
      settings3.prompt_replace[presetName] = { "text": text };
      saveSettingsDebounced();
      const textarea = document.getElementById("prompt_replace_text" + suffix);
      const warning = textarea.closest(".st-chatu8-field-col").querySelector(".st-chatu8-unsaved-warning");
      if (warning) $(warning).hide();
    }
  });
}

function prompt_replace_delete(mode) {
  const settings3 = extension_settings[extensionName];
  const suffix = getSuffix(mode);
  const selectElement = document.getElementById("prompt_replace_id" + suffix);
  const valueToDelete = selectElement.value;
  if (valueToDelete === "\u9ED8\u8BA4") {
    alert("\u9ED8\u8BA4\u914D\u7F6E\u4E0D\u80FD\u5220\u9664");
    return;
  }
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664\u8BE5\u66FF\u6362\u89C4\u5219").then((result) => {
    if (result) {
      Reflect.deleteProperty(settings3.prompt_replace, valueToDelete);
      settings3.prompt_replace_id = "\u9ED8\u8BA4";
      saveSettingsDebounced();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after deleting preset:", error);
      }
    }
  });
}

function prompt_replace_export_current() {
  const settings3 = extension_settings[extensionName];
  const selectedId = settings3.prompt_replace_id;
  if (!selectedId || !settings3.prompt_replace[selectedId]) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u66FF\u6362\u89C4\u5219\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const dataToExport = { [selectedId]: settings3.prompt_replace[selectedId] };
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-prompt-replace-${selectedId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function prompt_replace_export_all() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.prompt_replace || Object.keys(settings3.prompt_replace).length === 0) {
    alert("\u6CA1\u6709\u66FF\u6362\u89C4\u5219\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const dataStr = JSON.stringify(settings3.prompt_replace, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "st-chatu8-prompt-replace-all.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function prompt_replace_import() {
  const settings3 = extension_settings[extensionName];
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      try {
        const importedData = JSON.parse(readerEvent.target.result);
        let newPresetsCount = 0;
        for (const key in importedData) {
          if (importedData.hasOwnProperty(key)) {
            if (!settings3.prompt_replace.hasOwnProperty(key)) {
              newPresetsCount++;
            }
            settings3.prompt_replace[key] = importedData[key];
          }
        }
        saveSettingsDebounced();
        try {
          if (typeof window.loadSilterTavernChatu8Settings === "function") {
            window.loadSilterTavernChatu8Settings();
          }
        } catch (error) {
          console.warn("Failed to refresh UI after importing presets:", error);
        }
        alert(`\u6210\u529F\u5BFC\u5165 ${Object.keys(importedData).length} \u4E2A\u66FF\u6362\u89C4\u5219\uFF0C\u5176\u4E2D ${newPresetsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`);
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002");
        console.error("Error importing prompt replacements:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function initPromptReplaceControls(settingsModal) {
  generationTabs.forEach((mode) => {
    const suffix = getSuffix(mode);
    settingsModal.find(`#prompt_replace_id${suffix}`).on("change", () => prompt_replace_change(mode));
    settingsModal.find(`#prompt_replace_new${suffix}`).on("click", () => prompt_replace_new(mode));
    settingsModal.find(`#prompt_replace_rename${suffix}`).on("click", () => prompt_replace_rename(mode));
    settingsModal.find(`#prompt_replace_save_style${suffix}`).on("click", () => prompt_replace_save(mode));
    settingsModal.find(`#prompt_replace_update_style${suffix}`).on("click", () => prompt_replace_update(mode));
    settingsModal.find(`#prompt_replace_delete_style${suffix}`).on("click", () => prompt_replace_delete(mode));
    settingsModal.find(`#prompt_replace_export_current${suffix}`).on("click", prompt_replace_export_current);
    settingsModal.find(`#prompt_replace_export_all${suffix}`).on("click", prompt_replace_export_all);
    settingsModal.find(`#prompt_replace_import${suffix}`).on("click", prompt_replace_import);
    $(`#prompt_replace_text${suffix}`).on("input", function() {
      const settings3 = extension_settings[extensionName];
      const presetName = settings3.prompt_replace_id;
      const currentPreset = settings3.prompt_replace[presetName] || {};
      const isDirty = $(this).val() !== (currentPreset.text ?? "");
      const warning = $(this).closest(".st-chatu8-field-col").find(".st-chatu8-unsaved-warning");
      if (isDirty) {
        $(warning).show();
      } else {
        $(warning).hide();
      }
    });
  });
}

export { initPromptReplaceControls };
