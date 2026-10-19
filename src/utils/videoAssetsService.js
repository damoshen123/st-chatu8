// 还原自打包产物 — 原始模块: utils/videoAssetsService.js
import { extension_settings } from "../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { extensionName } from "./config.js";
import { deleteConfigFile, deleteConfigImage, getConfigFile, saveConfigFile } from "./configDatabase.js";

var VIDEO_ASSET_CATEGORIES, worldbookProcessor_exports;

VIDEO_ASSET_CATEGORIES = [
      { key: "character", label: "\u89D2\u8272\u8D44\u4EA7", icon: "fa-user" },
      { key: "body_part", label: "\u8EAB\u4F53\u90E8\u4F4D\u8D44\u4EA7", icon: "fa-hand" },
      { key: "scene", label: "\u573A\u666F\u8D44\u4EA7", icon: "fa-mountain-sun" },
      { key: "prop", label: "\u9053\u5177\u8D44\u4EA7", icon: "fa-wand-magic" },
      { key: "pose", label: "\u59FF\u52BF\u8D44\u4EA7", icon: "fa-person-walking" },
      { key: "audio", label: "\u97F3\u9891\u8D44\u4EA7", icon: "fa-music" }
    ];


function getCategoryLabel(categoryKey) {
  const found = VIDEO_ASSET_CATEGORIES.find((c) => c.key === categoryKey);
  return found ? found.label : "\u5176\u4ED6\u8D44\u4EA7";
}

function getVideoAssets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3) return [];
  if (!Array.isArray(settings3.video_assets)) {
    settings3.video_assets = [];
  }
  let needsSave = false;
  const validKeys = new Set(VIDEO_ASSET_CATEGORIES.map((c) => c.key));
  for (const item of settings3.video_assets) {
    if (!item.category || !validKeys.has(item.category)) {
      item.category = "character";
      needsSave = true;
    }
    if (typeof item.enabled !== "boolean") {
      item.enabled = true;
      needsSave = true;
    }
  }
  if (needsSave) {
    saveSettingsDebounced();
  }
  return settings3.video_assets;
}

function getVideoAssetStats() {
  const assets = getVideoAssets();
  const stats = {
    all: assets.length,
    character: 0,
    body_part: 0,
    scene: 0,
    prop: 0,
    pose: 0,
    audio: 0,
    enabledTotal: 0
  };
  for (const item of assets) {
    const cat = item.category || "character";
    if (stats[cat] !== void 0) {
      stats[cat]++;
    } else {
      stats.character++;
    }
    if (item.enabled) {
      stats.enabledTotal++;
    }
  }
  return stats;
}

function saveVideoAssets(assets) {
  const settings3 = extension_settings[extensionName];
  if (settings3) {
    settings3.video_assets = assets;
    saveSettingsDebounced();
  }
}

function addVideoAsset(assetData) {
  const assets = getVideoAssets();
  const newAsset = {
    id: `v_asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    fileid: assetData.fileid || "",
    name: assetData.name || "\u672A\u547D\u540D\u7D20\u6750",
    category: assetData.category || "character",
    description: assetData.description || "",
    enabled: assetData.enabled !== false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  assets.unshift(newAsset);
  saveVideoAssets(assets);
  return newAsset;
}

function updateVideoAsset(id, patch) {
  const assets = getVideoAssets();
  const index = assets.findIndex((a) => a.id === id);
  if (index === -1) return null;
  assets[index] = {
    ...assets[index],
    ...patch,
    updatedAt: Date.now()
  };
  saveVideoAssets(assets);
  return assets[index];
}

async function replaceVideoAssetImage(assetId, newFileId) {
  const assets = getVideoAssets();
  const index = assets.findIndex((a) => a.id === assetId);
  if (index === -1) return null;
  const oldFileId = assets[index].fileid;
  assets[index].fileid = newFileId;
  assets[index].updatedAt = Date.now();
  saveVideoAssets(assets);
  if (oldFileId && oldFileId !== newFileId && !assets.some((a) => a.fileid === oldFileId)) {
    try {
      await deleteConfigImage(oldFileId);
    } catch (e) {
      console.warn(`[VideoAssets] \u6E05\u7406\u65E7\u56FE\u7247\u5931\u8D25: ${oldFileId}`, e);
    }
  }
  return assets[index];
}

async function deleteVideoAsset(id) {
  const assets = getVideoAssets();
  const index = assets.findIndex((a) => a.id === id);
  if (index === -1) return false;
  const target = assets[index];
  assets.splice(index, 1);
  saveVideoAssets(assets);
  if (target.fileid && !assets.some((a) => a.fileid === target.fileid)) {
    try {
      await deleteConfigImage(target.fileid);
    } catch (e) {
      console.warn(`[VideoAssets] \u5220\u9664\u56FE\u7247\u6570\u636E\u5931\u8D25: ${target.fileid}`, e);
    }
  }
  return true;
}

function formatVideoAssetsForLLM(categoryFilter = null) {
  let assets = getVideoAssets().filter((a) => a.enabled);
  if (assets.length === 0) {
    return "";
  }
  const sections = [];
  const divider = "--------------------------------------------------";
  const targetCats = categoryFilter && categoryFilter !== "all" ? VIDEO_ASSET_CATEGORIES.filter((c) => c.key === categoryFilter) : VIDEO_ASSET_CATEGORIES;
  for (const cat of targetCats) {
    const catAssets = assets.filter((a) => a.category === cat.key);
    if (catAssets.length > 0) {
      const assetBlocks = catAssets.map((item) => {
        const name = item.name || "\u672A\u547D\u540D\u7D20\u6750";
        const fileid = item.fileid || "\u672A\u7ED1\u5B9A";
        const desc = item.description ? item.description.trim() : "\u65E0\u8BE6\u7EC6\u63CF\u8FF0";
        return `\u25A0 \u7D20\u6750\u540D\u79F0: ${name}
\u25A0 FileID: ${fileid}
\u25A0 \u7D20\u6750\u7B80\u4ECB:
${desc}`;
      });
      const blockText = assetBlocks.join(`
${divider}
`);
      sections.push(`### \u3010${cat.label}\u3011
${divider}
${blockText}
${divider}`);
    }
  }
  return sections.join("\n\n");
}

function exportVideoAssetsJSON() {
  const assets = getVideoAssets();
  return JSON.stringify(assets, null, 2);
}

async function prepareVideoAssetsExportPackage(onProgress = null) {
  const assets = getVideoAssets();
  const uniqueFileIds = Array.from(new Set(assets.map((a) => a.fileid).filter(Boolean)));
  const mediaFiles = [];
  const total = uniqueFileIds.length;
  for (let i = 0; i < total; i++) {
    const fileid = uniqueFileIds[i];
    if (typeof onProgress === "function") {
      onProgress(i + 1, total, fileid);
    }
    try {
      const fileInfo = await getConfigFile(fileid);
      if (fileInfo && fileInfo.data) {
        let ext = ".png";
        if (fileInfo.mimeType) {
          if (fileInfo.mimeType.includes("jpeg")) ext = ".jpg";
          else if (fileInfo.mimeType.includes("webp")) ext = ".webp";
          else if (fileInfo.mimeType.includes("gif")) ext = ".gif";
          else if (fileInfo.mimeType.includes("mp3") || fileInfo.mimeType.includes("mpeg")) ext = ".mp3";
          else if (fileInfo.mimeType.includes("wav")) ext = ".wav";
        } else if (fileInfo.fileName && fileInfo.fileName.includes(".")) {
          ext = "." + fileInfo.fileName.split(".").pop().toLowerCase();
        }
        const safeFileName = `${fileid}${ext}`;
        mediaFiles.push({
          fileid,
          blob: fileInfo.data,
          fileName: safeFileName,
          mimeType: fileInfo.mimeType || "image/png"
        });
      }
    } catch (err) {
      console.warn(`[VideoAssets] \u5BFC\u51FA\u65F6\u8BFB\u53D6\u5A92\u4F53 ${fileid} \u5931\u8D25\uFF0C\u5C06\u8DF3\u8FC7\u8BE5\u5A92\u4F53\u6587\u4EF6:`, err);
    }
  }
  const fileIdToSafeName = /* @__PURE__ */ new Map();
  for (const m of mediaFiles) {
    fileIdToSafeName.set(m.fileid, m.fileName);
  }
  const exportAssets = assets.map((a) => {
    const copy = { ...a };
    if (copy.fileid && fileIdToSafeName.has(copy.fileid)) {
      copy.mediaFile = fileIdToSafeName.get(copy.fileid);
    }
    return copy;
  });
  return {
    assets: exportAssets,
    mediaFiles
  };
}

function checkVideoAssetsConflicts(incomingAssets) {
  if (!Array.isArray(incomingAssets)) return { totalIncoming: 0, conflictCount: 0, conflictNames: [] };
  const current = getVideoAssets();
  const existingNames = new Set(current.map((a) => (a.name || "").trim().toLowerCase()).filter(Boolean));
  const existingIds = new Set(current.map((a) => a.id));
  const conflictNames = [];
  for (const item of incomingAssets) {
    if (!item) continue;
    const nameLower = (item.name || "").trim().toLowerCase();
    if (item.id && existingIds.has(item.id) || nameLower && existingNames.has(nameLower)) {
      conflictNames.push(item.name || item.id);
    }
  }
  return {
    totalIncoming: incomingAssets.length,
    conflictCount: conflictNames.length,
    conflictNames
  };
}

async function importVideoAssetsPackage(options) {
  const {
    assets: incomingAssets,
    mediaMap = /* @__PURE__ */ new Map(),
    strategy = "overwrite",
    clearAll: clearAll2 = false,
    onProgress = null
  } = options;
  if (!Array.isArray(incomingAssets)) {
    throw new Error("\u5BFC\u5165\u6570\u636E\u683C\u5F0F\u9519\u8BEF\uFF0C\u5FC5\u987B\u5305\u542B\u8D44\u4EA7\u6570\u7EC4");
  }
  const getMediaData = (key) => {
    if (!key) return null;
    if (mediaMap instanceof Map) {
      return mediaMap.get(key) || null;
    }
    return mediaMap[key] || null;
  };
  const findMediaData = (item) => {
    if (!item) return null;
    const candidates = [
      item.mediaFile,
      item.fileid,
      item.fileid ? `${item.fileid}.png` : null,
      item.fileid ? `${item.fileid}.jpg` : null,
      item.fileid ? `${item.fileid}.webp` : null,
      item.name,
      item.name ? `${item.name}.png` : null,
      item.name ? `${item.name}.jpg` : null,
      item.name ? `${item.name}.webp` : null
    ].filter(Boolean);
    for (const cand of candidates) {
      const data = getMediaData(cand);
      if (data) return data;
    }
    return null;
  };
  let currentList = clearAll2 ? [] : [...getVideoAssets()];
  const stats = {
    total: incomingAssets.length,
    added: 0,
    overwritten: 0,
    skipped: 0,
    mediaSaved: 0
  };
  const importedFileIdMap = /* @__PURE__ */ new Map();
  async function persistMediaSafely(item) {
    if (!item) return "";
    const origKey = item.mediaFile || item.fileid || item.name;
    if (origKey && importedFileIdMap.has(origKey)) {
      return importedFileIdMap.get(origKey);
    }
    const rawData = findMediaData(item);
    if (!rawData) {
      return item.fileid || "";
    }
    try {
      const kind = item.category === "audio" ? "audio" : "image";
      const newFileId = await saveConfigFile(rawData, {
        kind,
        filename: `import_va_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      });
      if (origKey) {
        importedFileIdMap.set(origKey, newFileId);
      }
      if (item.fileid) {
        importedFileIdMap.set(item.fileid, newFileId);
      }
      stats.mediaSaved++;
      return newFileId;
    } catch (e) {
      console.warn(`[VideoAssets] \u5199\u5165\u5BFC\u5165\u5A92\u4F53\u5931\u8D25: ${origKey}`, e);
      return item.fileid || "";
    }
  }
  const totalItems = incomingAssets.length;
  for (let idx = 0; idx < totalItems; idx++) {
    const item = incomingAssets[idx];
    if (!item) continue;
    if (typeof onProgress === "function") {
      onProgress(idx + 1, totalItems, item.name || "\u5904\u7406\u4E2D...");
    }
    const itemName = (item.name || "").trim();
    const itemNameLower = itemName.toLowerCase();
    const matchIndex = currentList.findIndex((a) => {
      if (item.id && a.id === item.id) return true;
      if (itemNameLower && (a.name || "").trim().toLowerCase() === itemNameLower) return true;
      return false;
    });
    if (matchIndex !== -1) {
      if (strategy === "skip") {
        stats.skipped++;
        continue;
      } else if (strategy === "overwrite") {
        const existing = currentList[matchIndex];
        const oldFileId = existing.fileid;
        let finalFileId = oldFileId;
        const mediaData = findMediaData(item);
        if (mediaData) {
          const newStoredId = await persistMediaSafely(item);
          if (newStoredId) {
            finalFileId = newStoredId;
            if (oldFileId && oldFileId !== newStoredId) {
              const stillReferenced = currentList.some((a, i) => i !== matchIndex && a.fileid === oldFileId);
              if (!stillReferenced) {
                try {
                  await deleteConfigFile(oldFileId);
                } catch (err) {
                  console.warn(`[VideoAssets] \u6E05\u7406\u65E7\u5A92\u4F53\u5931\u8D25: ${oldFileId}`, err);
                }
              }
            }
          }
        } else {
          if (!finalFileId && item.fileid) {
            finalFileId = item.fileid;
          }
        }
        currentList[matchIndex] = {
          ...existing,
          name: itemName || existing.name,
          category: item.category || existing.category,
          description: item.description !== void 0 ? item.description : existing.description,
          enabled: typeof item.enabled === "boolean" ? item.enabled : existing.enabled,
          fileid: finalFileId,
          updatedAt: Date.now()
        };
        stats.overwritten++;
      } else if (strategy === "keep_both") {
        const newFileId = await persistMediaSafely(item);
        const uniqueId = `v_asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        currentList.unshift({
          id: uniqueId,
          name: `${itemName || "\u672A\u547D\u540D\u7D20\u6750"} (\u5BFC\u5165)`,
          category: item.category || "character",
          description: item.description || "",
          enabled: item.enabled !== false,
          fileid: newFileId,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        stats.added++;
      }
    } else {
      const newFileId = await persistMediaSafely(item);
      const uniqueId = item.id && !currentList.some((a) => a.id === item.id) ? item.id : `v_asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      currentList.unshift({
        id: uniqueId,
        name: itemName || "\u672A\u547D\u540D\u7D20\u6750",
        category: item.category || "character",
        description: item.description || "",
        enabled: item.enabled !== false,
        fileid: newFileId,
        createdAt: item.createdAt || Date.now(),
        updatedAt: Date.now()
      });
      stats.added++;
    }
  }
  saveVideoAssets(currentList);
  return stats;
}

export { VIDEO_ASSET_CATEGORIES, addVideoAsset, checkVideoAssetsConflicts, deleteVideoAsset, exportVideoAssetsJSON, formatVideoAssetsForLLM, getCategoryLabel, getVideoAssetStats, getVideoAssets, importVideoAssetsPackage, prepareVideoAssetsExportPackage, replaceVideoAssetImage, updateVideoAsset, worldbookProcessor_exports };
