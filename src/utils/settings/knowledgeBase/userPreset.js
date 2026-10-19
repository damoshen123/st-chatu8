// 还原自打包产物 — 原始模块: utils/settings/knowledgeBase/userPreset.js
import { extension_settings } from "../../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../../script.js";
import { extensionName } from "../../config.js";
import { deleteConfigImage, getConfigImage, saveConfigImage } from "../../configDatabase.js";
import { stylInput, stylishConfirm } from "../../ui_common.js";
import { AVATAR_CONFIG } from "../../avatarConfig.js";
import { PERSONA_FIELDS } from "./personaPreset.js";

var $container3, AUTO_SAVE_DELAY2, _autoSaveTimer2, knowledgeBaseService_exports;

_autoSaveTimer2 = null;

AUTO_SAVE_DELAY2 = 600;

$container3 = null;


function ensureDataStructure2() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.personaProfiles) {
    settings3.personaProfiles = {
      presets: {},
      currentPresetId: "",
      enabled: false,
      injectionMode: "alwaysOn",
      currentUserPresetId: "",
      userEnabled: false,
      userInjectionMode: "alwaysOn"
    };
  }
  if (!settings3.personaProfiles.presets) {
    settings3.personaProfiles.presets = {};
  }
  if (settings3.personaProfiles.currentUserPresetId === void 0) {
    settings3.personaProfiles.currentUserPresetId = "";
  }
  if (settings3.personaProfiles.userEnabled === void 0) {
    settings3.personaProfiles.userEnabled = false;
  }
  if (settings3.personaProfiles.userInjectionMode === void 0) {
    settings3.personaProfiles.userInjectionMode = "alwaysOn";
  }
  return settings3.personaProfiles;
}

function setupUserControls(container) {
  $container3 = container;
  ensureDataStructure2();
  loadUserPresetList();
  container.find("#ch-user-preset-id").on("change", onPresetChange2);
  container.find("#ch-user-new").on("click", onNewPreset2);
  container.find("#ch-user-rename").on("click", onRenamePreset2);
  container.find("#ch-user-save").on("click", onSavePreset2);
  container.find("#ch-user-save-as").on("click", onSaveAsPreset2);
  container.find("#ch-user-export").on("click", onExportPreset2);
  container.find("#ch-user-export-all").on("click", onExportAllPresets2);
  container.find("#ch-user-import").on("click", () => {
    container.find("#ch-user-import-file").click();
  });
  container.find("#ch-user-import-file").on("change", onImportPreset2);
  container.find("#ch-user-delete").on("click", onDeletePreset2);
  container.find("#ch-user-avatar-upload-btn").on("click", () => {
    container.find("#ch-user-avatar-input").click();
  });
  container.find("#ch-user-avatar-input").on("change", onUserAvatarUpload);
  container.find("#ch-user-avatar-remove-btn").on("click", onUserAvatarRemove);
  container.find("#ch-user-avatar-preview").on("click", () => {
    container.find("#ch-user-avatar-input").click();
  });
  container.find("#ch-user-enabled").on("change", onGlobalSettingChange2);
  bindFieldAutoSave2(container);
  loadGlobalSettings2();
  loadUserPresetList();
  loadUserPresetData();
}

function loadUserPresetList() {
  const profiles = ensureDataStructure2();
  const $select = $container3?.find("#ch-user-preset-id");
  if (!$select || !$select.length) return;
  $select.empty();
  $select.append('<option value="">(\u8BF7\u9009\u62E9User\u9884\u8BBE)</option>');
  const sortedNames = Object.keys(profiles.presets).sort(
    (a, b) => a.localeCompare(b, "zh-CN", { sensitivity: "base" })
  );
  for (const presetName of sortedNames) {
    const option = $("<option></option>").val(presetName).text(presetName);
    $select.append(option);
  }
  if (profiles.currentUserPresetId && profiles.presets[profiles.currentUserPresetId]) {
    $select.val(profiles.currentUserPresetId);
  }
}

async function loadUserPresetData() {
  const profiles = ensureDataStructure2();
  const presetId = profiles.currentUserPresetId;
  const preset = presetId ? profiles.presets[presetId] : null;
  PERSONA_FIELDS.forEach((field) => {
    if (field === "avatarId") return;
    const $el = $container3?.find(`#ch-user-${field}`);
    if ($el && $el.length) {
      $el.val(preset ? preset[field] || "" : "");
    }
  });
  if (preset && preset.avatarId) {
    try {
      const base64 = await getConfigImage(preset.avatarId);
      if (base64) {
        displayUserAvatar(base64);
      } else {
        clearUserAvatarDisplay();
      }
    } catch (error) {
      console.error("[UserPreset] \u52A0\u8F7D\u5934\u50CF\u5931\u8D25:", error);
      clearUserAvatarDisplay();
    }
  } else {
    clearUserAvatarDisplay();
  }
}

function loadGlobalSettings2() {
  const profiles = ensureDataStructure2();
  $container3?.find("#ch-user-enabled").prop("checked", profiles.userEnabled || false);
}

async function onPresetChange2() {
  const profiles = ensureDataStructure2();
  const newPresetId = $container3?.find("#ch-user-preset-id").val() || "";
  profiles.currentUserPresetId = newPresetId;
  await loadUserPresetData();
  saveSettingsDebounced();
}

async function onNewPreset2() {
  clearTimeout(_autoSaveTimer2);
  const result = await stylInput("\u8BF7\u8F93\u5165\u65B0User\u9884\u8BBE\u7684\u540D\u79F0", "");
  if (!result || !result.trim()) return;
  const name = result.trim();
  const profiles = ensureDataStructure2();
  if (profiles.presets[name]) {
    toastr.warning(`\u9884\u8BBE\u300C${name}\u300D\u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002`);
    return;
  }
  const emptyPreset = {};
  PERSONA_FIELDS.forEach((field) => {
    emptyPreset[field] = "";
  });
  profiles.presets[name] = emptyPreset;
  profiles.currentUserPresetId = name;
  saveSettingsDebounced();
  loadUserPresetList();
  clearUserFields();
  toastr.success(`User\u9884\u8BBE\u300C${name}\u300D\u5DF2\u521B\u5EFA\u3002`);
}

function onSavePreset2() {
  const profiles = ensureDataStructure2();
  const presetId = profiles.currentUserPresetId;
  if (!presetId || !profiles.presets[presetId]) {
    toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684User\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148\u65B0\u5EFA\u6216\u9009\u62E9\u4E00\u4E2A\u9884\u8BBE\u3002");
    return;
  }
  saveCurrentUserData(presetId);
  toastr.success(`User\u9884\u8BBE\u300C${presetId}\u300D\u5DF2\u4FDD\u5B58\u3002`);
}

async function onSaveAsPreset2() {
  const profiles = ensureDataStructure2();
  const defaultName = profiles.currentUserPresetId || "";
  const result = await stylInput("\u8BF7\u8F93\u5165\u65B0User\u9884\u8BBE\u7684\u540D\u79F0", defaultName);
  if (!result || !result.trim()) return;
  const name = result.trim();
  saveCurrentUserData(name);
  profiles.currentUserPresetId = name;
  saveSettingsDebounced();
  loadUserPresetList();
  toastr.success(`User\u9884\u8BBE\u300C${name}\u300D\u5DF2\u4FDD\u5B58\u3002`);
}

async function onRenamePreset2() {
  const profiles = ensureDataStructure2();
  const currentName = profiles.currentUserPresetId;
  if (!currentName || !profiles.presets[currentName]) {
    toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684User\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4" || currentName === "default") {
    toastr.warning("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  const result = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684User\u9884\u8BBE\u540D\u79F0", currentName);
  if (!result || !result.trim() || result.trim() === currentName) return;
  const newName = result.trim();
  if (profiles.presets[newName]) {
    toastr.error(`\u9884\u8BBE\u300C${newName}\u300D\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002`);
    return;
  }
  profiles.presets[newName] = profiles.presets[currentName];
  delete profiles.presets[currentName];
  profiles.currentUserPresetId = newName;
  if (profiles.currentPresetId === currentName) {
    profiles.currentPresetId = newName;
  }
  saveSettingsDebounced();
  loadUserPresetList();
  toastr.success(`User\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A\u300C${newName}\u300D`);
}

async function onDeletePreset2() {
  const profiles = ensureDataStructure2();
  const presetId = profiles.currentUserPresetId;
  if (!presetId || !profiles.presets[presetId]) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684User\u9884\u8BBE\u53EF\u5220\u9664\u3002");
    return;
  }
  const confirmed = await stylishConfirm(`\u786E\u5B9A\u8981\u5220\u9664\u9884\u8BBE\u300C${presetId}\u300D\u5417\uFF1F
\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\uFF01
\u6CE8\u610F\uFF1A\u5982\u679C\u4EBA\u8BBE\u7BA1\u7406\u4E5F\u5728\u4F7F\u7528\u6B64\u9884\u8BBE\uFF0C\u8BE5\u9884\u8BBE\u4E5F\u4F1A\u88AB\u5220\u9664\u3002`);
  if (!confirmed) return;
  const avatarId = profiles.presets[presetId].avatarId;
  if (avatarId) {
    try {
      await deleteConfigImage(avatarId);
    } catch (error) {
      console.error("[UserPreset] \u5220\u9664\u5934\u50CF\u5931\u8D25:", error);
    }
  }
  delete profiles.presets[presetId];
  profiles.currentUserPresetId = "";
  if (profiles.currentPresetId === presetId) {
    profiles.currentPresetId = "";
  }
  saveSettingsDebounced();
  loadUserPresetList();
  await loadUserPresetData();
  toastr.success(`\u9884\u8BBE\u300C${presetId}\u300D\u5DF2\u5220\u9664\u3002`);
}

async function onExportPreset2() {
  const profiles = ensureDataStructure2();
  const presetId = profiles.currentUserPresetId;
  const preset = presetId ? profiles.presets[presetId] : null;
  if (!preset) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684User\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const exportData = {
    type: "chatu8_persona_profile",
    version: "1.1",
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
      console.error("[UserPreset] \u5BFC\u51FA\u5934\u50CF\u5931\u8D25:", error);
    }
  }
  downloadJson2(exportData, `st-chatu8-user-${presetId}.json`);
  toastr.success(`User\u9884\u8BBE\u300C${presetId}\u300D\u5DF2\u5BFC\u51FA\u3002`);
}

async function onExportAllPresets2() {
  const profiles = ensureDataStructure2();
  if (!profiles.presets || Object.keys(profiles.presets).length === 0) {
    toastr.warning("\u6CA1\u6709\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const exportData = {
    type: "chatu8_persona_profile",
    version: "1.1",
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
        console.error(`[UserPreset] \u5BFC\u51FA\u5934\u50CF\u5931\u8D25 (${presetId}):`, error);
      }
    }
  }
  downloadJson2(exportData, "st-chatu8-user-\u5168\u90E8.json");
  toastr.success(`\u5DF2\u5BFC\u51FA\u5168\u90E8 ${Object.keys(profiles.presets).length} \u4E2A\u9884\u8BBE\u3002`);
}

async function onImportPreset2(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const importedData = JSON.parse(text);
    if (importedData.type !== "chatu8_persona_profile" || !importedData.data) {
      toastr.error("\u65E0\u6548\u7684\u9884\u8BBE\u6587\u4EF6\u683C\u5F0F\uFF01");
      return;
    }
    const profiles = ensureDataStructure2();
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
            filename: `user_avatar_${key}_${Date.now()}`
          });
          presetData.avatarId = avatarId;
        } catch (error) {
          console.error("[UserPreset] \u5BFC\u5165\u5934\u50CF\u5931\u8D25:", error);
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
      profiles.currentUserPresetId = firstKey;
    }
    saveSettingsDebounced();
    loadUserPresetList();
    await loadUserPresetData();
    const total = Object.keys(presetsToImport).length;
    toastr.success(`\u6210\u529F\u5BFC\u5165 ${total} \u4E2A\u9884\u8BBE\uFF08${newCount} \u4E2A\u65B0\u589E\uFF0C${updateCount} \u4E2A\u66F4\u65B0\uFF09\u3002`);
  } catch (e) {
    console.error("[UserPreset] \u5BFC\u5165\u5931\u8D25:", e);
    toastr.error("\u5BFC\u5165\u5931\u8D25\uFF1A" + e.message);
  }
  event.target.value = "";
}

function onGlobalSettingChange2() {
  const profiles = ensureDataStructure2();
  profiles.userEnabled = $container3?.find("#ch-user-enabled").prop("checked") || false;
  saveSettingsDebounced();
}

function bindFieldAutoSave2(container) {
  PERSONA_FIELDS.forEach((field) => {
    container.find(`#ch-user-${field}`).on("input", () => {
      triggerAutoSave2();
    });
  });
}

function triggerAutoSave2() {
  const profiles = ensureDataStructure2();
  if (!profiles.currentUserPresetId) return;
  clearTimeout(_autoSaveTimer2);
  _autoSaveTimer2 = setTimeout(() => {
    if (!profiles.currentUserPresetId) return;
    saveCurrentUserData(profiles.currentUserPresetId);
  }, AUTO_SAVE_DELAY2);
}

function clearUserFields() {
  PERSONA_FIELDS.forEach((field) => {
    const $el = $container3?.find(`#ch-user-${field}`);
    if ($el && $el.length) {
      $el.val("");
    }
    const el = document.getElementById(`ch-user-${field}`);
    if (el) {
      el.value = "";
    }
  });
}

function saveCurrentUserData(presetId) {
  const profiles = ensureDataStructure2();
  const preset = {};
  PERSONA_FIELDS.forEach((field) => {
    const $el = $container3?.find(`#ch-user-${field}`);
    if ($el && $el.length) {
      preset[field] = $el.val() || "";
    }
  });
  profiles.presets[presetId] = preset;
  saveSettingsDebounced();
}

function downloadJson2(data, filename) {
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

async function onUserAvatarUpload(event) {
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
    const base64 = await readFileAsBase646(file);
    const compressedBase64 = await compressImage2(
      base64,
      AVATAR_CONFIG.maxWidth,
      AVATAR_CONFIG.maxHeight,
      AVATAR_CONFIG.quality
    );
    const avatarId = await saveConfigImage(compressedBase64, {
      format: file.type.split("/")[1] || "png",
      filename: `user_avatar_${Date.now()}`
    });
    const profiles = ensureDataStructure2();
    const presetId = profiles.currentUserPresetId;
    if (presetId && profiles.presets[presetId]) {
      const oldAvatarId = profiles.presets[presetId].avatarId;
      if (oldAvatarId) {
        await deleteConfigImage(oldAvatarId);
      }
      profiles.presets[presetId].avatarId = avatarId;
      saveSettingsDebounced();
    }
    displayUserAvatar(compressedBase64);
    toastr.success("\u5934\u50CF\u4E0A\u4F20\u6210\u529F\uFF01");
  } catch (error) {
    console.error("[UserPreset] \u5934\u50CF\u4E0A\u4F20\u5931\u8D25:", error);
    toastr.error("\u5934\u50CF\u4E0A\u4F20\u5931\u8D25\uFF1A" + error.message);
  }
  event.target.value = "";
}

async function onUserAvatarRemove() {
  const profiles = ensureDataStructure2();
  const presetId = profiles.currentUserPresetId;
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
    clearUserAvatarDisplay();
    toastr.success("\u5934\u50CF\u5DF2\u79FB\u9664\u3002");
  } catch (error) {
    console.error("[UserPreset] \u79FB\u9664\u5934\u50CF\u5931\u8D25:", error);
    toastr.error("\u79FB\u9664\u5934\u50CF\u5931\u8D25\uFF1A" + error.message);
  }
}

function displayUserAvatar(base64) {
  const $preview = $container3?.find("#ch-user-avatar-preview");
  const $img = $container3?.find("#ch-user-avatar-img");
  const $removeBtn = $container3?.find("#ch-user-avatar-remove-btn");
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

function clearUserAvatarDisplay() {
  const $preview = $container3?.find("#ch-user-avatar-preview");
  const $img = $container3?.find("#ch-user-avatar-img");
  const $removeBtn = $container3?.find("#ch-user-avatar-remove-btn");
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

function readFileAsBase646(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage2(base64, maxWidth, maxHeight, quality = 0.9) {
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

async function getUserAvatarById(presetId) {
  const profiles = ensureDataStructure2();
  const preset = profiles.presets[presetId];
  if (!preset || !preset.avatarId) return null;
  try {
    return await getConfigImage(preset.avatarId);
  } catch (error) {
    console.error("[UserPreset] \u83B7\u53D6\u5934\u50CF\u5931\u8D25:", error);
    return null;
  }
}

export { getUserAvatarById, knowledgeBaseService_exports, loadUserPresetData, loadUserPresetList, setupUserControls };
