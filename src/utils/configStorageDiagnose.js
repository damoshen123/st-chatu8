// 还原自打包产物 — 原始模块: utils/configStorageDiagnose.js
import { extension_settings } from "../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { extensionName } from "./config.js";
import { getRequestHeaders } from "./utils.js";
import { deleteConfigImage } from "./configDatabase.js";
import { CONFIG_DB_NAME2, CONFIG_FOLDER, CONFIG_STORE_NAME2 } from "./configStorageCleanupModal.js";

function baseName(p) {
  return String(p || "").split("/").pop();
}

function extCount(names) {
  const c = {};
  for (const n of names) {
    const ext = n.includes(".") ? n.split(".").pop().toLowerCase() : "(\u65E0\u6269\u5C55\u540D)";
    c[ext] = (c[ext] || 0) + 1;
  }
  return c;
}

function classifyKey(key) {
  if (key.startsWith("cfgimg_")) return "\u914D\u7F6E\u56FE\u7247";
  if (key.startsWith("ai_chat_data_")) return "AI\u804A\u5929\u6570\u636E";
  if (key.startsWith("kb_content_")) return "\u77E5\u8BC6\u5E93\u5185\u5BB9";
  if (key.startsWith("log_session_")) return "\u65E5\u5FD7\u4F1A\u8BDD";
  if (key === "ai_chat_history" || key === "ai_chat_index") return "AI\u804A\u5929\u7D22\u5F15";
  if (key === "log_index") return "\u65E5\u5FD7\u7D22\u5F15";
  return "\u5176\u4ED6JSON\u6570\u636E";
}

function collectActiveConfigReferences(settings3) {
  const activeIds = /* @__PURE__ */ new Set();
  const refDetails = /* @__PURE__ */ new Map();
  if (!settings3 || typeof settings3 !== "object") {
    return { activeIds, activeFiles: /* @__PURE__ */ new Set(), refDetails };
  }
  const addRef = (id, reason) => {
    if (!id || typeof id !== "string") return;
    const trimmed = id.trim();
    if (!trimmed) return;
    activeIds.add(trimmed);
    if (!refDetails.has(trimmed)) {
      refDetails.set(trimmed, []);
    }
    refDetails.get(trimmed).push(reason);
  };
  const charPresets = settings3.characterPresets || {};
  for (const [name, preset] of Object.entries(charPresets)) {
    if (!preset) continue;
    if (Array.isArray(preset.photoMedia)) {
      preset.photoMedia.forEach((m, idx) => m?.id && addRef(m.id, `\u89D2\u8272\u9884\u8BBE\u300C${name}\u300D\u7B2C${idx + 1}\u5F20\u7167\u7247`));
    }
    if (preset.selectedPhotoId) addRef(preset.selectedPhotoId, `\u89D2\u8272\u9884\u8BBE\u300C${name}\u300D\u5F53\u524D\u7167\u7247`);
    if (preset.avatarId) addRef(preset.avatarId, `\u89D2\u8272\u9884\u8BBE\u300C${name}\u300D\u5934\u50CF`);
    if (Array.isArray(preset.audioMedia)) {
      preset.audioMedia.forEach((m, idx) => m?.id && addRef(m.id, `\u89D2\u8272\u9884\u8BBE\u300C${name}\u300D\u97F3\u9891${idx + 1}`));
    }
    if (preset.selectedAudioId) addRef(preset.selectedAudioId, `\u89D2\u8272\u9884\u8BBE\u300C${name}\u300D\u5F53\u524D\u97F3\u9891`);
  }
  const outfitPresets = settings3.outfitPresets || {};
  for (const [name, preset] of Object.entries(outfitPresets)) {
    if (!preset) continue;
    if (Array.isArray(preset.photoMedia)) {
      preset.photoMedia.forEach((m, idx) => m?.id && addRef(m.id, `\u670D\u88C5\u9884\u8BBE\u300C${name}\u300D\u7B2C${idx + 1}\u5F20\u7167\u7247`));
    }
    if (preset.selectedPhotoId) addRef(preset.selectedPhotoId, `\u670D\u88C5\u9884\u8BBE\u300C${name}\u300D\u5F53\u524D\u7167\u7247`);
    if (preset.imageId) addRef(preset.imageId, `\u670D\u88C5\u9884\u8BBE\u300C${name}\u300D\u56FE\u7247`);
  }
  const bananaPresets = settings3.bananaCharacterPresets || {};
  for (const [name, preset] of Object.entries(bananaPresets)) {
    if (!preset) continue;
    if (Array.isArray(preset.photoMedia)) {
      preset.photoMedia.forEach((m, idx) => m?.id && addRef(m.id, `\u9999\u8549\u89D2\u8272\u300C${name}\u300D\u7167\u7247`));
    }
    if (preset.selectedPhotoId) addRef(preset.selectedPhotoId, `\u9999\u8549\u89D2\u8272\u300C${name}\u300D\u5F53\u524D\u7167\u7247`);
    if (preset.avatarId) addRef(preset.avatarId, `\u9999\u8549\u89D2\u8272\u300C${name}\u300D\u5934\u50CF`);
    if (preset.conversation?.user?.imageId) addRef(preset.conversation.user.imageId, `\u9999\u8549\u89D2\u8272\u300C${name}\u300D\u5BF9\u8BDD\u7528\u6237\u56FE`);
    if (preset.conversation?.model?.imageId) addRef(preset.conversation.model.imageId, `\u9999\u8549\u89D2\u8272\u300C${name}\u300D\u5BF9\u8BDD\u6A21\u578B\u56FE`);
  }
  const vibePresets = settings3.vibePresets || {};
  for (const [name, preset] of Object.entries(vibePresets)) {
    if (!preset) continue;
    if (preset.imageId) addRef(preset.imageId, `Vibe\u9884\u8BBE\u300C${name}\u300D\u56FE\u7247`);
    if (preset.coverImageId) addRef(preset.coverImageId, `Vibe\u9884\u8BBE\u300C${name}\u300D\u5C01\u9762`);
    if (preset.vibeDataId) addRef(preset.vibeDataId, `Vibe\u9884\u8BBE\u300C${name}\u300D\u7279\u5F81\u6570\u636E`);
  }
  const vibeGroups = settings3.vibeGroups || {};
  for (const [gName, group] of Object.entries(vibeGroups)) {
    if (group && typeof group === "object") {
      if (group.coverImageId) addRef(group.coverImageId, `Vibe\u7EC4\u300C${gName}\u300D\u5C01\u9762`);
      if (Array.isArray(group.presets)) {
        group.presets.forEach((p) => {
          if (p?.imageId) addRef(p.imageId, `Vibe\u7EC4\u300C${gName}\u300D\u6210\u5458\u56FE\u7247`);
          if (p?.vibeDataId) addRef(p.vibeDataId, `Vibe\u7EC4\u300C${gName}\u300D\u6210\u5458\u6570\u636E`);
        });
      }
    }
  }
  const yushe = settings3.yushe || {};
  for (const [name, preset] of Object.entries(yushe)) {
    if (preset?.previewImageId) addRef(preset.previewImageId, `\u63D0\u793A\u8BCD\u9884\u8BBE\u300C${name}\u300D\u9884\u89C8\u56FE`);
  }
  if (settings3.fabCustomIcon) {
    addRef(settings3.fabCustomIcon, "\u60AC\u6D6E\u7403\u81EA\u5B9A\u4E49\u56FE\u6807");
  }
  const kbUsers = settings3.knowledgeBaseUserPresets || {};
  for (const [name, preset] of Object.entries(kbUsers)) {
    if (preset?.avatarId) addRef(preset.avatarId, `\u77E5\u8BC6\u5E93\u7528\u6237\u300C${name}\u300D\u5934\u50CF`);
  }
  const kbPersonas = settings3.knowledgeBasePersonaPresets || {};
  for (const [name, preset] of Object.entries(kbPersonas)) {
    if (preset?.avatarId) addRef(preset.avatarId, `\u77E5\u8BC6\u5E93Persona\u300C${name}\u300D\u5934\u50CF`);
  }
  const videoAssets = settings3.video_assets || [];
  if (Array.isArray(videoAssets)) {
    videoAssets.forEach((asset, idx) => {
      if (asset?.fileid) {
        const catLabel = asset.category ? `[${asset.category}]` : "";
        addRef(asset.fileid, `\u89C6\u9891\u8D44\u4EA7${catLabel}\u300C${asset.name || `\u672A\u547D\u540D${idx + 1}`}\u300D`);
      }
    });
  }
  const scanned = /* @__PURE__ */ new Set();
  const idRegex = /^cfg(img|file)_[0-9a-zA-Z_-]+$/;
  function walk(val, path) {
    if (!val || typeof val !== "object") {
      if (typeof val === "string" && idRegex.test(val)) {
        addRef(val, `\u914D\u7F6E\u9879 ${path}`);
      }
      return;
    }
    if (scanned.has(val)) return;
    scanned.add(val);
    for (const [k, v] of Object.entries(val)) {
      if (k === "configImageStorage" || k === "comfyuiCache" || k === "sdCache") continue;
      walk(v, path ? `${path}.${k}` : k);
    }
  }
  walk(settings3, "settings");
  const activeFiles = /* @__PURE__ */ new Set();
  const registry = settings3.configImageStorage || {};
  for (const id of activeIds) {
    const p = registry[id]?.path;
    if (p) activeFiles.add(baseName(p));
  }
  return { activeIds, activeFiles, refDetails };
}

async function getIndexedDbIds() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(CONFIG_DB_NAME2);
      req.onsuccess = () => {
        const db2 = req.result;
        if (!db2.objectStoreNames.contains(CONFIG_STORE_NAME2)) {
          db2.close();
          return resolve([]);
        }
        const tx = db2.transaction([CONFIG_STORE_NAME2], "readonly");
        const store = tx.objectStore(CONFIG_STORE_NAME2);
        const kreq = store.getAllKeys();
        kreq.onsuccess = () => {
          resolve(kreq.result || []);
          db2.close();
        };
        kreq.onerror = () => {
          resolve([]);
          db2.close();
        };
      };
      req.onerror = () => resolve([]);
    } catch (_) {
      resolve([]);
    }
  });
}

async function probeSize(path) {
  try {
    const url = path.startsWith("/") ? path : `/${path}`;
    const resp = await fetch(url, { method: "HEAD" });
    if (!resp.ok) return null;
    const len = resp.headers.get("content-length");
    return len ? Number(len) : null;
  } catch (_) {
    return null;
  }
}

function fmtMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function diagnoseConfigStorage(options = {}) {
  const { probeSizes = true } = options;
  const out = { folder: CONFIG_FOLDER };
  console.group(`%c[ConfigDB \u8BCA\u65AD] ${CONFIG_FOLDER} \u6587\u4EF6\u5939\uFF08\u53EA\u8BFB\uFF0C\u4E0D\u4F1A\u5220\u9664\u4EFB\u4F55\u4E1C\u897F\uFF09`, "color:#2196F3;font-weight:bold");
  try {
    const resp = await fetch("/api/images/list", {
      method: "POST",
      headers: getRequestHeaders(window.token),
      body: JSON.stringify({ folder: CONFIG_FOLDER, type: 7 })
    });
    if (!resp.ok) throw new Error(`\u5217\u8868\u8BF7\u6C42\u5931\u8D25: ${resp.status} ${resp.statusText}`);
    const serverFiles = await resp.json();
    if (!Array.isArray(serverFiles)) throw new Error("\u670D\u52A1\u5668\u8FD4\u56DE\u683C\u5F0F\u5F02\u5E38");
    out.serverFileCount = serverFiles.length;
    console.log("\u30101. \u670D\u52A1\u5668\u5B9E\u9645\u6587\u4EF6\u3011");
    console.log(`  \u603B\u6570: ${serverFiles.length}`, extCount(serverFiles));
    const registry = extension_settings[extensionName]?.configImageStorage || {};
    const registryKeys = Object.keys(registry);
    const kindCount = {};
    const referencedFiles = /* @__PURE__ */ new Set();
    const registryNoPath = [];
    for (const key of registryKeys) {
      const kind = classifyKey(key);
      kindCount[kind] = (kindCount[kind] || 0) + 1;
      const p = registry[key]?.path;
      if (p) referencedFiles.add(baseName(p));
      else registryNoPath.push(key);
    }
    out.registryCount = registryKeys.length;
    out.registryKinds = kindCount;
    console.log("\u30102. \u6CE8\u518C\u8868 configImageStorage\u3011");
    console.log(`  \u6761\u76EE\u603B\u6570: ${registryKeys.length}`);
    console.log("  \u6309\u7528\u9014\u5206\u7C7B:", kindCount);
    console.log(`  \u5F15\u7528\u7684\u552F\u4E00\u6587\u4EF6\u540D\u6570: ${referencedFiles.size}`);
    if (registryNoPath.length) {
      console.log(`  \u26A0 \u6709 ${registryNoPath.length} \u6761\u6CA1\u6709 path\uFF08\u5B58\u5728 IndexedDB \u800C\u975E\u670D\u52A1\u5668\uFF09`);
    }
    const dbIds = await getIndexedDbIds();
    out.indexedDbCount = dbIds.length;
    console.log("\u30103. \u6D4F\u89C8\u5668 IndexedDB \u6761\u76EE\u3011");
    console.log(`  \u6761\u76EE\u6570: ${dbIds.length}`);
    const activeRefs = collectActiveConfigReferences(extension_settings[extensionName] || {});
    out.activeRefCount = activeRefs.activeIds.size;
    console.log("\u30104. \u4E1A\u52A1\u6D3B\u8DC3\u5F15\u7528\u9006\u5411\u6BD4\u5BF9\u3011");
    console.log(`  \u771F\u6B63\u88AB\u89D2\u8272\u3001\u670D\u88C5\u3001\u9884\u8BBE\u5F15\u7528\u7684\u56FE\u7247/\u5A92\u4F53 ID: ${activeRefs.activeIds.size} \u4E2A`);
    const serverSet = new Set(serverFiles);
    const orphans = serverFiles.filter((f) => !referencedFiles.has(f));
    const missing = [...referencedFiles].filter((f) => !serverSet.has(f));
    out.orphans = orphans;
    out.missing = missing;
    out.orphanTotalBytes = 0;
    const missingSet = new Set(missing);
    out.missingEntries = registryKeys.filter((k) => registry[k]?.path && missingSet.has(baseName(registry[k].path))).map((k) => ({ key: k, path: registry[k].path, kind: classifyKey(k) }));
    const unreferencedImages = [];
    const seenUnrefKeys = /* @__PURE__ */ new Set();
    for (const key of registryKeys) {
      if ((key.startsWith("cfgimg_") || key.startsWith("cfgfile_")) && !activeRefs.activeIds.has(key)) {
        const p = registry[key]?.path;
        const fileName = p ? baseName(p) : "";
        unreferencedImages.push({
          key,
          id: key,
          storage: "server",
          path: p,
          fileName,
          kind: classifyKey(key),
          size: registry[key]?.size || null
        });
        seenUnrefKeys.add(key);
      }
    }
    for (const dbId of dbIds) {
      if (typeof dbId === "string" && (dbId.startsWith("cfgimg_") || dbId.startsWith("cfgfile_"))) {
        if (!activeRefs.activeIds.has(dbId) && !seenUnrefKeys.has(dbId)) {
          unreferencedImages.push({
            key: dbId,
            id: dbId,
            storage: "indexeddb",
            kind: classifyKey(dbId),
            size: null
          });
          seenUnrefKeys.add(dbId);
        }
      }
    }
    out.unreferencedImages = unreferencedImages;
    out.unreferencedTotalBytes = 0;
    console.log(`  \u26A0 \u65E0\u4EFB\u4F55\u89D2\u8272/\u670D\u88C5\u5F15\u7528\u7684\u5E9F\u5F03\u914D\u7F6E\u56FE\u7247: ${unreferencedImages.length} \u4E2A`);
    console.log("\u3010\u6BD4\u5BF9\u7ED3\u679C\u6C47\u603B\u3011");
    console.log(`  \u2713 \u6D3B\u8DC3\u5F15\u7528\u7684\u6587\u4EF6: ${serverFiles.length - orphans.length}`);
    console.log(`  \u26A0 \u5B64\u513F\u6587\u4EF6\uFF08\u670D\u52A1\u5668\u6709\u3001\u6CE8\u518C\u8868\u65E0\u5F15\u7528\uFF09: ${orphans.length}`, extCount(orphans));
    console.log(`  \u26A0 \u5E9F\u5F03\u65E0\u4E3B\u56FE\u7247\uFF08\u6CE8\u518C\u8868\u6216\u672C\u5730\u6709\u3001\u4F46\u65E0\u89D2\u8272\u4F7F\u7528\uFF09: ${unreferencedImages.length}`);
    console.log(`  \u26A0 \u5931\u6548\u5F15\u7528\uFF08\u6CE8\u518C\u8868\u6709\u3001\u670D\u52A1\u5668\u5DF2\u65E0\u6587\u4EF6\uFF09: ${missing.length} \u4E2A\u6587\u4EF6\u540D / ${out.missingEntries.length} \u6761\u6CE8\u518C\u8868\u952E`);
    let settingsBlob = "";
    try {
      settingsBlob = JSON.stringify(extension_settings[extensionName] || {});
    } catch (_) {
    }
    const orphanSafe = [];
    const orphanRisky = [];
    for (const f of orphans) {
      if (settingsBlob.includes(f)) orphanRisky.push(f);
      else orphanSafe.push(f);
    }
    out.orphanSafe = orphanSafe;
    out.orphanRisky = orphanRisky;
    console.log("\u30105. \u5B64\u513F\u6587\u4EF6\u4E8C\u6B21\u6821\u9A8C\u3011");
    console.log(`  \u5728\u63D2\u4EF6\u8BBE\u7F6E\u5168\u6587\u4E2D\u627E\u4E0D\u5230 \u2192 \u53EF\u5B89\u5168\u5220\u9664: ${orphanSafe.length}`);
    console.log(`  \u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u4ECD\u88AB\u63D0\u53CA \u2192 \u9700\u4EBA\u5DE5\u786E\u8BA4: ${orphanRisky.length}`);
    if (orphanRisky.length) {
      console.warn("  \u26A0 \u4EE5\u4E0B\u5B64\u513F\u867D\u65E0\u6CE8\u518C\u8868\u5F15\u7528\uFF0C\u4F46\u8BBE\u7F6E\u91CC\u4ECD\u51FA\u73B0\uFF0C\u6682\u4E0D\u5EFA\u8BAE\u5220\u9664:");
      console.log("   ", orphanRisky);
    }
    const orphanSizes = {};
    out.orphanSizes = orphanSizes;
    if (probeSizes && orphans.length) {
      console.log("\u30106. \u5B64\u513F\u6587\u4EF6\u4F53\u79EF\u63A2\u6D4B\u4E2D...\u3011");
      const rows = [];
      let totalBytes = 0;
      for (const f of orphans) {
        const size = await probeSize(`/user/images/${CONFIG_FOLDER}/${f}`);
        if (typeof size === "number") {
          totalBytes += size;
          orphanSizes[f] = size;
        }
        rows.push({
          \u6587\u4EF6\u540D: f,
          \u4F53\u79EF: typeof size === "number" ? `${(size / 1024).toFixed(0)} KB` : "(\u63A2\u6D4B\u5931\u8D25)",
          \u5224\u5B9A: orphanSafe.includes(f) ? "\u53EF\u5B89\u5168\u5220\u9664" : "\u9700\u4EBA\u5DE5\u786E\u8BA4"
        });
      }
      out.orphanTotalBytes = totalBytes;
      console.log(`  \u5B64\u513F\u6587\u4EF6\u5408\u8BA1\u7EA6 ${fmtMB(totalBytes)}`);
      console.table(rows);
    } else if (orphans.length) {
      console.log("\u30106. \u5B64\u513F\u6587\u4EF6\u6E05\u5355\u3011");
      console.table(orphans.map((f) => ({
        \u6587\u4EF6\u540D: f,
        \u5224\u5B9A: orphanSafe.includes(f) ? "\u53EF\u5B89\u5168\u5220\u9664" : "\u9700\u4EBA\u5DE5\u786E\u8BA4"
      })));
    }
    console.log("\u30107. \u6C47\u603B\u3011");
    console.log(`  \u670D\u52A1\u5668\u6587\u4EF6 ${serverFiles.length} \u4E2A`);
    console.log(`  \u5176\u4E2D\u88AB\u5F15\u7528 ${serverFiles.length - orphans.length} \u4E2A\uFF0C\u5B64\u513F ${orphans.length} \u4E2A`);
    if (typeof out.orphanTotalBytes === "number") {
      console.log(`  \u5B64\u513F\u53EF\u56DE\u6536\u7A7A\u95F4: ${fmtMB(out.orphanTotalBytes)}`);
    }
    console.log(`  \u6CE8\u518C\u8868\u5931\u6548\u5F15\u7528 ${missing.length} \u4E2A`);
    console.log("  \u2139 \u672C\u6B21\u4E3A\u53EA\u8BFB\u8BCA\u65AD\uFF0C\u672A\u5220\u9664\u4EFB\u4F55\u6587\u4EF6\u3002");
    console.log("  \u2139 \u5B8C\u6574\u7ED3\u679C\u5BF9\u8C61\u5DF2\u8FD4\u56DE\uFF0C\u53EF\u5C55\u5F00\u4E0B\u65B9\u67E5\u770B\uFF1A");
    console.log(out);
  } catch (error) {
    console.error("[ConfigDB \u8BCA\u65AD] \u5931\u8D25:", error);
    out.error = error.message;
  } finally {
    console.groupEnd();
  }
  return out;
}

async function cleanupConfigStorage(options = {}) {
  const { orphanFiles = [], deadKeys = [], unreferencedIds = [], onProgress = null } = options;
  const result = { deletedFiles: [], deletedKeys: [], deletedUnreferenced: [], skipped: [], errors: [] };
  const latestSettings = extension_settings[extensionName] || {};
  const latestRefs = collectActiveConfigReferences(latestSettings);
  const total = orphanFiles.length + unreferencedIds.length;
  let step = 0;
  for (const id of unreferencedIds) {
    step++;
    if (onProgress) onProgress(step, total, id);
    if (latestRefs.activeIds.has(id)) {
      result.skipped.push(id);
      console.warn(`[ConfigDB \u6E05\u7406] \u8DF3\u8FC7\uFF08\u5DF2\u91CD\u65B0\u88AB\u914D\u7F6E\u5F15\u7528\uFF09: ${id}`);
      continue;
    }
    try {
      const ok = await deleteConfigImage(id);
      if (ok) {
        result.deletedUnreferenced.push(id);
      } else {
        result.deletedUnreferenced.push(id);
      }
    } catch (e) {
      result.errors.push(`\u6E05\u7406\u5E9F\u5F03\u56FE\u7247\u5931\u8D25: ${id} - ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  let settingsBlob = "";
  try {
    settingsBlob = JSON.stringify(latestSettings);
  } catch (_) {
  }
  for (let i = 0; i < orphanFiles.length; i++) {
    step++;
    const fileName = orphanFiles[i];
    if (onProgress) onProgress(step, total, fileName);
    if (settingsBlob && settingsBlob.includes(fileName)) {
      result.skipped.push(fileName);
      console.warn(`[ConfigDB \u6E05\u7406] \u8DF3\u8FC7\uFF08\u8BBE\u7F6E\u4E2D\u4ECD\u88AB\u5F15\u7528\uFF09: ${fileName}`);
      continue;
    }
    try {
      const resp = await fetch("/api/images/delete", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify({ path: `user/images/${CONFIG_FOLDER}/${fileName}` })
      });
      if (resp.ok || resp.status === 404) {
        result.deletedFiles.push(fileName);
      } else {
        result.errors.push(`\u5220\u9664\u5931\u8D25 (${resp.status}): ${fileName}`);
      }
    } catch (e) {
      result.errors.push(`\u5220\u9664\u5F02\u5E38: ${fileName} - ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  if (onProgress && total) onProgress(total, total, "");
  if (deadKeys.length) {
    const registry = latestSettings.configImageStorage;
    if (registry) {
      for (const key of deadKeys) {
        if (key in registry) {
          delete registry[key];
          result.deletedKeys.push(key);
        }
      }
      if (result.deletedKeys.length) saveSettingsDebounced();
    }
  }
  console.log(`[ConfigDB \u6E05\u7406] \u5B8C\u6210\uFF1A\u6E05\u7406\u65E0\u4E3B\u56FE\u7247 ${result.deletedUnreferenced.length} \u4E2A\uFF0C\u5220\u9664\u5B64\u513F\u6587\u4EF6 ${result.deletedFiles.length} \u4E2A\uFF0C\u79FB\u9664\u6CE8\u518C\u8868\u6761\u76EE ${result.deletedKeys.length} \u6761\uFF0C\u8DF3\u8FC7 ${result.skipped.length} \u4E2A\uFF0C\u5931\u8D25 ${result.errors.length} \u4E2A`);
  if (result.errors.length) console.warn("[ConfigDB \u6E05\u7406] \u5931\u8D25\u8BE6\u60C5:", result.errors);
  return result;
}

if (typeof window !== "undefined") {
  window.chatu8DiagnoseConfigStorage = diagnoseConfigStorage;
  window.chatu8CleanupConfigStorage = cleanupConfigStorage;
}

export { cleanupConfigStorage, diagnoseConfigStorage };
