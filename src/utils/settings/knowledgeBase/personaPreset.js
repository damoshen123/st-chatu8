// 还原自打包产物 — 原始模块: utils/settings/knowledgeBase/personaPreset.js
import { extension_settings } from "../../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../../script.js";
import { extensionName } from "../../config.js";
import { deleteConfigImage, getConfigImage, saveConfigImage } from "../../configDatabase.js";
import { stylInput, stylishConfirm } from "../../ui_common.js";
import { AVATAR_CONFIG } from "../../avatarConfig.js";

var $container2, AUTO_SAVE_DELAY, PERSONA_FIELDS, PERSONA_FIELD_LABELS, _autoSaveTimer;

PERSONA_FIELDS = [
      "name",
      "age",
      "gender",
      "race",
      "personality",
      "background",
      "bodyType",
      "appearance",
      "hobbies",
      "abilities",
      "speechStyle",
      "relationships",
      // ★ 次元穿越相关字段
      "isekai_origin",
      "isekai_method",
      "isekai_reaction",
      "isekai_goal",
      "notes",
      "avatarId"
      // 头像图片ID
    ];

PERSONA_FIELD_LABELS = {
      name: "\u89D2\u8272\u540D\u79F0",
      age: "\u5E74\u9F84",
      gender: "\u6027\u522B",
      race: "\u79CD\u65CF/\u7269\u79CD",
      personality: "\u6027\u683C",
      background: "\u80CC\u666F",
      bodyType: "\u8EAB\u6750",
      appearance: "\u5916\u8C8C\u7279\u5F81",
      hobbies: "\u7231\u597D",
      abilities: "\u7279\u6B8A\u80FD\u529B",
      speechStyle: "\u53E3\u7656/\u8BF4\u8BDD\u65B9\u5F0F",
      relationships: "\u4EBA\u9645\u5173\u7CFB",
      // ★ 次元穿越相关字段
      isekai_origin: "\u7A7F\u8D8A\u6765\u6E90",
      isekai_method: "\u7A7F\u8D8A\u65B9\u5F0F",
      isekai_reaction: "\u7A7F\u8D8A\u540E\u53CD\u5E94",
      isekai_goal: "\u7A7F\u8D8A\u671F\u95F4\u76EE\u6807",
      notes: "\u5176\u4ED6\u5907\u6CE8",
      avatarId: "\u5934\u50CF"
    };

_autoSaveTimer = null;

AUTO_SAVE_DELAY = 600;

$container2 = null;

function ensureDataStructure() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.personaProfiles) {
    settings3.personaProfiles = {
      presets: {},
      currentPresetId: "",
      enabled: false,
      injectionMode: "alwaysOn"
    };
  }
  if (!settings3.personaProfiles.presets) {
    settings3.personaProfiles.presets = {};
  }
  return settings3.personaProfiles;
}

function setupPersonaControls(container) {
  $container2 = container;
  ensureDataStructure();
  loadPersonaPresetList();
  container.find("#ch-persona-preset-id").on("change", onPresetChange);
  container.find("#ch-persona-new").on("click", onNewPreset);
  container.find("#ch-persona-rename").on("click", onRenamePreset);
  container.find("#ch-persona-save").on("click", onSavePreset);
  container.find("#ch-persona-save-as").on("click", onSaveAsPreset);
  container.find("#ch-persona-export").on("click", onExportPreset);
  container.find("#ch-persona-export-all").on("click", onExportAllPresets);
  container.find("#ch-persona-import").on("click", () => {
    container.find("#ch-persona-import-file").click();
  });
  container.find("#ch-persona-import-file").on("change", onImportPreset);
  container.find("#ch-persona-delete").on("click", onDeletePreset);
  container.find("#ch-persona-avatar-upload-btn").on("click", () => {
    container.find("#ch-persona-avatar-input").click();
  });
  container.find("#ch-persona-avatar-input").on("change", onPersonaAvatarUpload);
  container.find("#ch-persona-avatar-remove-btn").on("click", onPersonaAvatarRemove);
  container.find("#ch-persona-avatar-preview").on("click", () => {
    container.find("#ch-persona-avatar-input").click();
  });
  container.find("#ch-persona-enabled").on("change", onGlobalSettingChange);
  bindFieldAutoSave(container);
  loadGlobalSettings();
  loadPersonaPresetList();
  loadPersonaPresetData();
}

function loadPersonaPresetList() {
  const profiles = ensureDataStructure();
  const $select = $container2?.find("#ch-persona-preset-id");
  if (!$select || !$select.length) return;
  $select.empty();
  $select.append('<option value="">(\u8BF7\u9009\u62E9\u4EBA\u8BBE\u9884\u8BBE)</option>');
  const sortedNames = Object.keys(profiles.presets).sort(
    (a, b) => a.localeCompare(b, "zh-CN", { sensitivity: "base" })
  );
  for (const presetName of sortedNames) {
    const option = $("<option></option>").val(presetName).text(presetName);
    $select.append(option);
  }
  if (profiles.currentPresetId && profiles.presets[profiles.currentPresetId]) {
    $select.val(profiles.currentPresetId);
  }
}

async function loadPersonaPresetData() {
  const profiles = ensureDataStructure();
  const presetId = profiles.currentPresetId;
  const preset = presetId ? profiles.presets[presetId] : null;
  PERSONA_FIELDS.forEach((field) => {
    if (field === "avatarId") return;
    const $el = $container2?.find(`#ch-persona-${field}`);
    if ($el && $el.length) {
      $el.val(preset ? preset[field] || "" : "");
    }
  });
  if (preset && preset.avatarId) {
    try {
      const base64 = await getConfigImage(preset.avatarId);
      if (base64) {
        displayPersonaAvatar(base64);
      } else {
        clearPersonaAvatarDisplay();
      }
    } catch (error) {
      console.error("[PersonaPreset] \u52A0\u8F7D\u5934\u50CF\u5931\u8D25:", error);
      clearPersonaAvatarDisplay();
    }
  } else {
    clearPersonaAvatarDisplay();
  }
}

function loadGlobalSettings() {
  const profiles = ensureDataStructure();
  $container2?.find("#ch-persona-enabled").prop("checked", profiles.enabled || false);
}

async function onPresetChange() {
  const profiles = ensureDataStructure();
  const newPresetId = $container2?.find("#ch-persona-preset-id").val() || "";
  profiles.currentPresetId = newPresetId;
  await loadPersonaPresetData();
  saveSettingsDebounced();
}

async function onNewPreset() {
  clearTimeout(_autoSaveTimer);
  const result = await stylInput("\u8BF7\u8F93\u5165\u65B0\u4EBA\u8BBE\u9884\u8BBE\u7684\u540D\u79F0", "");
  if (!result || !result.trim()) return;
  const name = result.trim();
  const profiles = ensureDataStructure();
  if (profiles.presets[name]) {
    toastr.warning(`\u4EBA\u8BBE\u9884\u8BBE\u300C${name}\u300D\u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002`);
    return;
  }
  const emptyPreset = {};
  PERSONA_FIELDS.forEach((field) => {
    emptyPreset[field] = "";
  });
  profiles.presets[name] = emptyPreset;
  profiles.currentPresetId = name;
  saveSettingsDebounced();
  loadPersonaPresetList();
  clearPersonaFields();
  toastr.success(`\u4EBA\u8BBE\u9884\u8BBE\u300C${name}\u300D\u5DF2\u521B\u5EFA\u3002`);
}

function onSavePreset() {
  const profiles = ensureDataStructure();
  const presetId = profiles.currentPresetId;
  if (!presetId || !profiles.presets[presetId]) {
    toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684\u4EBA\u8BBE\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148\u65B0\u5EFA\u6216\u9009\u62E9\u4E00\u4E2A\u9884\u8BBE\u3002");
    return;
  }
  saveCurrentPersonaData(presetId);
  toastr.success(`\u4EBA\u8BBE\u9884\u8BBE\u300C${presetId}\u300D\u5DF2\u4FDD\u5B58\u3002`);
}

async function onSaveAsPreset() {
  const profiles = ensureDataStructure();
  const defaultName = profiles.currentPresetId || "";
  const result = await stylInput("\u8BF7\u8F93\u5165\u65B0\u4EBA\u8BBE\u9884\u8BBE\u7684\u540D\u79F0", defaultName);
  if (!result || !result.trim()) return;
  const name = result.trim();
  saveCurrentPersonaData(name);
  profiles.currentPresetId = name;
  saveSettingsDebounced();
  loadPersonaPresetList();
  toastr.success(`\u4EBA\u8BBE\u9884\u8BBE\u300C${name}\u300D\u5DF2\u4FDD\u5B58\u3002`);
}

async function onRenamePreset() {
  const profiles = ensureDataStructure();
  const currentName = profiles.currentPresetId;
  if (!currentName || !profiles.presets[currentName]) {
    toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684\u4EBA\u8BBE\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4" || currentName === "default") {
    toastr.warning("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  const result = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u4EBA\u8BBE\u9884\u8BBE\u540D\u79F0", currentName);
  if (!result || !result.trim() || result.trim() === currentName) return;
  const newName = result.trim();
  if (profiles.presets[newName]) {
    toastr.error(`\u9884\u8BBE\u300C${newName}\u300D\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002`);
    return;
  }
  profiles.presets[newName] = profiles.presets[currentName];
  delete profiles.presets[currentName];
  profiles.currentPresetId = newName;
  if (profiles.currentUserPresetId === currentName) {
    profiles.currentUserPresetId = newName;
  }
  saveSettingsDebounced();
  loadPersonaPresetList();
  toastr.success(`\u4EBA\u8BBE\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A\u300C${newName}\u300D`);
}

async function onDeletePreset() {
  const profiles = ensureDataStructure();
  const presetId = profiles.currentPresetId;
  if (!presetId || !profiles.presets[presetId]) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u4EBA\u8BBE\u9884\u8BBE\u53EF\u5220\u9664\u3002");
    return;
  }
  const confirmed = await stylishConfirm(`\u786E\u5B9A\u8981\u5220\u9664\u4EBA\u8BBE\u9884\u8BBE\u300C${presetId}\u300D\u5417\uFF1F
\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\uFF01`);
  if (!confirmed) return;
  const avatarId = profiles.presets[presetId].avatarId;
  if (avatarId) {
    try {
      await deleteConfigImage(avatarId);
    } catch (error) {
      console.error("[PersonaPreset] \u5220\u9664\u5934\u50CF\u5931\u8D25:", error);
    }
  }
  delete profiles.presets[presetId];
  const remaining = Object.keys(profiles.presets);
  profiles.currentPresetId = remaining.length > 0 ? remaining[0] : "";
  saveSettingsDebounced();
  loadPersonaPresetList();
  await loadPersonaPresetData();
  toastr.success(`\u4EBA\u8BBE\u9884\u8BBE\u300C${presetId}\u300D\u5DF2\u5220\u9664\u3002`);
}

async function onExportPreset() {
  const profiles = ensureDataStructure();
  const presetId = profiles.currentPresetId;
  const preset = presetId ? profiles.presets[presetId] : null;
  if (!preset) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u4EBA\u8BBE\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const exportData = {
    type: "chatu8_persona_profile",
    version: "1.1",
    // 版本号升级
    data: {
      [presetId]: { ...preset }
    }
  };
  if (preset.avatarId) {
    try {
      const avatarBase64 = await getConfigImage(preset.avatarId);
      if (avatarBase64) {
        exportData.avatars = {
          [presetId]: avatarBase64
        };
      }
    } catch (error) {
      console.error("[PersonaPreset] \u5BFC\u51FA\u5934\u50CF\u5931\u8D25:", error);
    }
  }
  downloadJson(exportData, `st-chatu8-\u4EBA\u8BBE-${presetId}.json`);
  toastr.success(`\u4EBA\u8BBE\u9884\u8BBE\u300C${presetId}\u300D\u5DF2\u5BFC\u51FA\u3002`);
}

async function onExportAllPresets() {
  const profiles = ensureDataStructure();
  if (!profiles.presets || Object.keys(profiles.presets).length === 0) {
    toastr.warning("\u6CA1\u6709\u4EBA\u8BBE\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const exportData = {
    type: "chatu8_persona_profile",
    version: "1.1",
    // 版本号升级
    data: { ...profiles.presets },
    avatars: {}
  };
  for (const [presetId, preset] of Object.entries(profiles.presets)) {
    if (preset.avatarId) {
      try {
        const avatarBase64 = await getConfigImage(preset.avatarId);
        if (avatarBase64) {
          exportData.avatars[presetId] = avatarBase64;
        }
      } catch (error) {
        console.error(`[PersonaPreset] \u5BFC\u51FA\u5934\u50CF\u5931\u8D25 (${presetId}):`, error);
      }
    }
  }
  downloadJson(exportData, "st-chatu8-\u4EBA\u8BBE-\u5168\u90E8.json");
  toastr.success(`\u5DF2\u5BFC\u51FA\u5168\u90E8 ${Object.keys(profiles.presets).length} \u4E2A\u4EBA\u8BBE\u9884\u8BBE\u3002`);
}

async function onImportPreset(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const importedData = JSON.parse(text);
    if (importedData.type !== "chatu8_persona_profile" || !importedData.data) {
      toastr.error("\u65E0\u6548\u7684\u4EBA\u8BBE\u9884\u8BBE\u6587\u4EF6\u683C\u5F0F\uFF01");
      return;
    }
    const profiles = ensureDataStructure();
    const presetsToImport = importedData.data;
    const avatarsToImport = importedData.avatars || {};
    let newCount = 0;
    let updateCount = 0;
    for (const key in presetsToImport) {
      if (!presetsToImport.hasOwnProperty(key)) continue;
      const presetData = presetsToImport[key];
      if (avatarsToImport[key]) {
        try {
          const avatarId = await saveConfigImage(avatarsToImport[key], {
            format: "png",
            filename: `persona_avatar_${key}_${Date.now()}`
          });
          presetData.avatarId = avatarId;
        } catch (error) {
          console.error("[PersonaPreset] \u5BFC\u5165\u5934\u50CF\u5931\u8D25:", error);
          presetData.avatarId = "";
        }
      }
      if (profiles.presets.hasOwnProperty(key)) {
        const oldAvatarId = profiles.presets[key].avatarId;
        if (oldAvatarId) {
          await deleteConfigImage(oldAvatarId);
        }
        updateCount++;
      } else {
        newCount++;
      }
      profiles.presets[key] = presetData;
    }
    const firstKey = Object.keys(presetsToImport)[0];
    if (firstKey) {
      profiles.currentPresetId = firstKey;
    }
    saveSettingsDebounced();
    loadPersonaPresetList();
    await loadPersonaPresetData();
    const total = Object.keys(presetsToImport).length;
    toastr.success(`\u6210\u529F\u5BFC\u5165 ${total} \u4E2A\u4EBA\u8BBE\u9884\u8BBE\uFF08${newCount} \u4E2A\u65B0\u589E\uFF0C${updateCount} \u4E2A\u66F4\u65B0\uFF09\u3002`);
  } catch (e) {
    console.error("[PersonaPreset] \u5BFC\u5165\u5931\u8D25:", e);
    toastr.error("\u5BFC\u5165\u5931\u8D25\uFF1A" + e.message);
  }
  event.target.value = "";
}

function onGlobalSettingChange() {
  const profiles = ensureDataStructure();
  profiles.enabled = $container2?.find("#ch-persona-enabled").prop("checked") || false;
  saveSettingsDebounced();
}

function bindFieldAutoSave(container) {
  PERSONA_FIELDS.forEach((field) => {
    container.find(`#ch-persona-${field}`).on("input", () => {
      triggerAutoSave();
    });
  });
}

function triggerAutoSave() {
  const profiles = ensureDataStructure();
  if (!profiles.currentPresetId) return;
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => {
    if (!profiles.currentPresetId) return;
    saveCurrentPersonaData(profiles.currentPresetId);
  }, AUTO_SAVE_DELAY);
}

function clearPersonaFields() {
  PERSONA_FIELDS.forEach((field) => {
    const $el = $container2?.find(`#ch-persona-${field}`);
    if ($el && $el.length) {
      $el.val("");
    }
    const el = document.getElementById(`ch-persona-${field}`);
    if (el) {
      el.value = "";
    }
  });
}

function createPersonaPreset(name, data = {}) {
  clearTimeout(_autoSaveTimer);
  const profiles = ensureDataStructure();
  let finalName = name;
  let counter = 1;
  while (profiles.presets[finalName]) {
    finalName = `${name}_${counter++}`;
  }
  const preset = {};
  PERSONA_FIELDS.forEach((field) => {
    preset[field] = data[field] !== void 0 && data[field] !== null ? String(data[field]) : "";
  });
  profiles.presets[finalName] = preset;
  profiles.currentPresetId = finalName;
  saveSettingsDebounced();
  loadPersonaPresetList();
  loadPersonaPresetData();
  return finalName;
}

function saveCurrentPersonaData(presetId) {
  const profiles = ensureDataStructure();
  const preset = {};
  PERSONA_FIELDS.forEach((field) => {
    const $el = $container2?.find(`#ch-persona-${field}`);
    if ($el && $el.length) {
      preset[field] = $el.val() || "";
    }
  });
  profiles.presets[presetId] = preset;
  saveSettingsDebounced();
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function onPersonaAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!AVATAR_CONFIG.acceptedFormats.includes(file.type)) {
    toastr.error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u56FE\u7247\u6587\u4EF6\uFF08JPG\u3001PNG\u3001WebP\u3001GIF\uFF09\uFF01");
    return;
  }
  if (file.size > AVATAR_CONFIG.maxFileSize) {
    toastr.error("\u56FE\u7247\u6587\u4EF6\u8FC7\u5927\uFF0C\u8BF7\u9009\u62E9\u5C0F\u4E8E 5MB \u7684\u56FE\u7247\uFF01");
    return;
  }
  try {
    const base64 = await readFileAsBase644(file);
    const compressedBase64 = await compressImage(
      base64,
      AVATAR_CONFIG.maxWidth,
      AVATAR_CONFIG.maxHeight,
      AVATAR_CONFIG.quality
    );
    const avatarId = await saveConfigImage(compressedBase64, {
      format: file.type.split("/")[1] || "png",
      filename: `persona_avatar_${Date.now()}`
    });
    const profiles = ensureDataStructure();
    const presetId = profiles.currentPresetId;
    if (presetId && profiles.presets[presetId]) {
      const oldAvatarId = profiles.presets[presetId].avatarId;
      if (oldAvatarId) {
        await deleteConfigImage(oldAvatarId);
      }
      profiles.presets[presetId].avatarId = avatarId;
      saveSettingsDebounced();
    }
    displayPersonaAvatar(compressedBase64);
    toastr.success("\u5934\u50CF\u4E0A\u4F20\u6210\u529F\uFF01");
  } catch (error) {
    console.error("[PersonaPreset] \u5934\u50CF\u4E0A\u4F20\u5931\u8D25:", error);
    toastr.error("\u5934\u50CF\u4E0A\u4F20\u5931\u8D25\uFF1A" + error.message);
  }
  event.target.value = "";
}

async function onPersonaAvatarRemove() {
  const profiles = ensureDataStructure();
  const presetId = profiles.currentPresetId;
  if (!presetId || !profiles.presets[presetId]) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u9884\u8BBE\u3002");
    return;
  }
  const avatarId = profiles.presets[presetId].avatarId;
  if (!avatarId) {
    toastr.info("\u5F53\u524D\u9884\u8BBE\u6CA1\u6709\u8BBE\u7F6E\u5934\u50CF\u3002");
    return;
  }
  try {
    await deleteConfigImage(avatarId);
    profiles.presets[presetId].avatarId = "";
    saveSettingsDebounced();
    clearPersonaAvatarDisplay();
    toastr.success("\u5934\u50CF\u5DF2\u79FB\u9664\u3002");
  } catch (error) {
    console.error("[PersonaPreset] \u79FB\u9664\u5934\u50CF\u5931\u8D25:", error);
    toastr.error("\u79FB\u9664\u5934\u50CF\u5931\u8D25\uFF1A" + error.message);
  }
}

function displayPersonaAvatar(base64) {
  const $preview = $container2?.find("#ch-persona-avatar-preview");
  const $img = $container2?.find("#ch-persona-avatar-img");
  const $removeBtn = $container2?.find("#ch-persona-avatar-remove-btn");
  if ($img && $img.length) {
    $img.attr("src", base64);
    $img.addClass("loaded");
  }
  if ($preview && $preview.length) {
    $preview.addClass("has-image");
  }
  if ($removeBtn && $removeBtn.length) {
    $removeBtn.show();
  }
}

function clearPersonaAvatarDisplay() {
  const $preview = $container2?.find("#ch-persona-avatar-preview");
  const $img = $container2?.find("#ch-persona-avatar-img");
  const $removeBtn = $container2?.find("#ch-persona-avatar-remove-btn");
  if ($img && $img.length) {
    $img.attr("src", "");
    $img.removeClass("loaded");
  }
  if ($preview && $preview.length) {
    $preview.removeClass("has-image");
  }
  if ($removeBtn && $removeBtn.length) {
    $removeBtn.hide();
  }
}

function readFileAsBase644(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(base64, maxWidth, maxHeight, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png", quality));
    };
    img.onerror = reject;
    img.src = base64;
  });
}

async function getPersonaAvatarById(presetId) {
  const profiles = ensureDataStructure();
  const preset = profiles.presets[presetId];
  if (!preset || !preset.avatarId) return null;
  try {
    return await getConfigImage(preset.avatarId);
  } catch (error) {
    console.error("[PersonaPreset] \u83B7\u53D6\u5934\u50CF\u5931\u8D25:", error);
    return null;
  }
}

export { PERSONA_FIELDS, PERSONA_FIELD_LABELS, createPersonaPreset, getPersonaAvatarById, loadPersonaPresetData, loadPersonaPresetList, setupPersonaControls };
