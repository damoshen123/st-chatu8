// 还原自打包产物 — 原始模块: utils/settings/vibeStorageMigration.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { getConfigImage, getConfigText, saveConfigImage, saveConfigText } from "../configDatabase.js";

function getSettings() {
  return extension_settings[extensionName];
}

function shouldStoreVibeInServer() {
  return getSettings().vibeJiuguanchucun !== "false";
}

function getVibeStorageOptions() {
  const useServer = shouldStoreVibeInServer();
  return {
    forceServer: useServer,
    forceIndexedDB: !useServer
  };
}

async function ensureVibeDataStoredByPreference(vibeDataId) {
  if (!vibeDataId || !shouldStoreVibeInServer()) {
    return false;
  }
  const serverStorage = getSettings().configImageStorage || {};
  if (serverStorage[vibeDataId]?.path) {
    return true;
  }
  const text = await getConfigText(vibeDataId);
  if (!text) {
    return false;
  }
  await saveConfigText(text, {
    id: vibeDataId,
    forceServer: true,
    filename: `vibe_data_${vibeDataId}`
  });
  return true;
}

function setServerStorageEnabled() {
  const settings3 = getSettings();
  settings3.vibeJiuguanchucun = "true";
  const checkbox = document.getElementById("vibeJiuguanchucun");
  if (checkbox) {
    checkbox.checked = true;
  }
  saveSettingsDebounced();
}

function addStringId(targetSet, value) {
  if (typeof value === "string" && value.trim()) {
    targetSet.add(value);
  }
}

function collectVibeStorageIds() {
  const settings3 = getSettings();
  const vibeDataIds = /* @__PURE__ */ new Set();
  const imageIds = /* @__PURE__ */ new Set();
  const vibePresets = settings3.vibePresets || {};
  for (const preset of Object.values(vibePresets)) {
    if (!preset || typeof preset !== "object") continue;
    addStringId(vibeDataIds, preset.vibeDataId);
    addStringId(imageIds, preset.imageId);
  }
  const vibeGroups = settings3.vibeGroups || {};
  for (const group of Object.values(vibeGroups)) {
    if (!group || typeof group !== "object") continue;
    addStringId(imageIds, group.coverImageId);
    if (Array.isArray(group.vibes)) {
      for (const vibe of group.vibes) {
        addStringId(vibeDataIds, vibe?.vibeDataId);
      }
    }
  }
  return {
    vibeDataIds: Array.from(vibeDataIds),
    imageIds: Array.from(imageIds)
  };
}

function getServerStorage() {
  const settings3 = getSettings();
  if (!settings3.configImageStorage) {
    settings3.configImageStorage = {};
  }
  return settings3.configImageStorage;
}

function getImageFormatFromDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return "png";
  const match = dataUrl.match(/^data:image\/([^;,]+)/i);
  if (!match) return "png";
  const format = match[1].toLowerCase();
  return format === "jpeg" ? "jpg" : format;
}

function createEmptyResult() {
  return {
    success: true,
    cancelled: false,
    totalVibeData: 0,
    totalImages: 0,
    migratedVibeData: 0,
    migratedImages: 0,
    skippedAlreadyServer: 0,
    missing: 0,
    errors: []
  };
}

function reportProgress(onProgress, current, total, message) {
  if (typeof onProgress === "function") {
    onProgress(current, total, message);
  }
}

function formatVibeStorageMigrationResult(result) {
  if (result.cancelled) {
    return "\u5DF2\u53D6\u6D88 Vibe \u9152\u9986\u5B58\u50A8\u8FC1\u79FB\u3002";
  }
  const lines = [
    "Vibe \u9152\u9986\u5B58\u50A8\u8FC1\u79FB\u5B8C\u6210\u3002",
    `Vibe \u6570\u636E: ${result.migratedVibeData}/${result.totalVibeData} \u4E2A\u5DF2\u8FC1\u79FB`,
    `\u56FE\u7247/\u5C01\u9762: ${result.migratedImages}/${result.totalImages} \u4E2A\u5DF2\u8FC1\u79FB`
  ];
  if (result.skippedAlreadyServer > 0) {
    lines.push(`\u5DF2\u5728\u9152\u9986\u5B58\u50A8\u4E2D\uFF0C\u8DF3\u8FC7 ${result.skippedAlreadyServer} \u4E2A`);
  }
  if (result.missing > 0) {
    lines.push(`\u672C\u5730\u672A\u627E\u5230 ${result.missing} \u4E2A\u5F15\u7528\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u5DF2\u6E05\u7406\u6D4F\u89C8\u5668\u7F13\u5B58`);
  }
  if (result.errors.length > 0) {
    lines.push(`\u5931\u8D25 ${result.errors.length} \u4E2A\uFF0C\u8BE6\u60C5\u89C1\u63A7\u5236\u53F0\u3002`);
  }
  return lines.join("\n");
}

async function migrateVibeStorageToServer(options = {}) {
  const { promptEnable = false, onProgress = null } = options;
  const result = createEmptyResult();
  if (!shouldStoreVibeInServer()) {
    if (promptEnable) {
      const shouldEnable = confirm(
        "\u5F53\u524D\u6CA1\u6709\u5F00\u542F\u201C\u7F13\u5B58 Vibe \u5230\u9152\u9986\u201D\u3002\n\n\u8FC1\u79FB Vibe \u9700\u8981\u5148\u5F00\u542F\u5B83\u3002\u5F00\u542F\u540E\uFF0CVibe \u6570\u636E\u4F1A\u4E0A\u4F20\u5230\u9152\u9986\u670D\u52A1\u5668\uFF1B\u666E\u901A\u751F\u6210\u56FE\u7F13\u5B58\u4E0D\u53D7\u5F71\u54CD\uFF1B\u672C\u5730 IndexedDB \u4F1A\u4FDD\u7559\u4E3A\u56DE\u9000\u3002\n\n\u662F\u5426\u73B0\u5728\u5F00\u542F\u5E76\u7EE7\u7EED\u8FC1\u79FB\uFF1F"
      );
      if (!shouldEnable) {
        result.success = false;
        result.cancelled = true;
        return result;
      }
    }
    setServerStorageEnabled();
  }
  const { vibeDataIds, imageIds } = collectVibeStorageIds();
  result.totalVibeData = vibeDataIds.length;
  result.totalImages = imageIds.length;
  const total = vibeDataIds.length + imageIds.length;
  let current = 0;
  const serverStorage = getServerStorage();
  for (const vibeDataId of vibeDataIds) {
    current++;
    reportProgress(onProgress, current, total, `\u6B63\u5728\u8FC1\u79FB Vibe \u6570\u636E ${current}/${total}`);
    if (serverStorage[vibeDataId]?.path) {
      result.skippedAlreadyServer++;
      continue;
    }
    try {
      const text = await getConfigText(vibeDataId);
      if (!text) {
        result.missing++;
        result.errors.push({ id: vibeDataId, type: "vibeData", error: "\u672C\u5730\u672A\u627E\u5230 Vibe \u6570\u636E" });
        continue;
      }
      await saveConfigText(text, {
        id: vibeDataId,
        forceServer: true,
        filename: `vibe_data_${vibeDataId}`
      });
      result.migratedVibeData++;
    } catch (error) {
      result.errors.push({ id: vibeDataId, type: "vibeData", error: error.message });
      console.error("[VibeStorage] \u8FC1\u79FB Vibe \u6570\u636E\u5931\u8D25:", vibeDataId, error);
    }
  }
  for (const imageId of imageIds) {
    current++;
    reportProgress(onProgress, current, total, `\u6B63\u5728\u8FC1\u79FB Vibe \u56FE\u7247 ${current}/${total}`);
    if (serverStorage[imageId]?.path) {
      result.skippedAlreadyServer++;
      continue;
    }
    try {
      const imageData = await getConfigImage(imageId);
      if (!imageData) {
        result.missing++;
        result.errors.push({ id: imageId, type: "image", error: "\u672C\u5730\u672A\u627E\u5230\u56FE\u7247" });
        continue;
      }
      await saveConfigImage(imageData, {
        id: imageId,
        forceServer: true,
        format: getImageFormatFromDataUrl(imageData),
        filename: `vibe_image_${imageId}`
      });
      result.migratedImages++;
    } catch (error) {
      result.errors.push({ id: imageId, type: "image", error: error.message });
      console.error("[VibeStorage] \u8FC1\u79FB Vibe \u56FE\u7247\u5931\u8D25:", imageId, error);
    }
  }
  saveSettingsDebounced();
  result.success = result.errors.length === 0;
  reportProgress(onProgress, total || 1, total || 1, "Vibe \u9152\u9986\u5B58\u50A8\u8FC1\u79FB\u5B8C\u6210");
  return result;
}

export { ensureVibeDataStoredByPreference, formatVibeStorageMigrationResult, getVibeStorageOptions, migrateVibeStorageToServer };
