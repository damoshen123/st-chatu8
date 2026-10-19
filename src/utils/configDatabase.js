// 还原自打包产物 — 原始模块: utils/configDatabase.js
import { extension_settings } from "../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { extensionName } from "./config.js";
import { scheduleSettingsSave } from "./perf/settingsSaveScheduler.js";
import { getRequestHeaders } from "./utils.js";

var CANDIDATE_DIRS_CACHE_TTL, CONFIG_DB_NAME, CONFIG_DB_VERSION, CONFIG_STORE_NAME, _candidateDirsCache, _candidateDirsCacheTimestamp, configDb;

CONFIG_DB_NAME = "chatu8_config_images";

CONFIG_DB_VERSION = 2;

CONFIG_STORE_NAME = "config_images";

configDb = null;

_candidateDirsCache = null;

_candidateDirsCacheTimestamp = 0;

CANDIDATE_DIRS_CACHE_TTL = 3e5;



function generateUUID2() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}

function generateConfigImageId() {
  return `cfgimg_${generateUUID2()}`;
}

function base64ToArrayBuffer2(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase642(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768;
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return window.btoa(binary);
}

function blobToBase642(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function openConfigDB() {
  if (configDb) {
    return configDb;
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONFIG_DB_NAME, CONFIG_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db2 = event.target.result;
      if (!db2.objectStoreNames.contains(CONFIG_STORE_NAME)) {
        db2.createObjectStore(CONFIG_STORE_NAME, { keyPath: "id" });
        console.log(`[ConfigDB] Object store '${CONFIG_STORE_NAME}' created.`);
      }
    };
    request.onerror = (event) => {
      console.error("[ConfigDB] \u6253\u5F00\u6570\u636E\u5E93\u5931\u8D25:", event.target.error);
      reject(event.target.error);
    };
    request.onsuccess = (event) => {
      configDb = event.target.result;
      console.log(`[ConfigDB] \u6570\u636E\u5E93 '${CONFIG_DB_NAME}' \u6253\u5F00\u6210\u529F\u3002`);
      resolve(configDb);
    };
  });
}

async function dbWriteConfigImage(id, imageBuffer) {
  const db2 = await openConfigDB();
  const transaction = db2.transaction([CONFIG_STORE_NAME], "readwrite");
  const store = transaction.objectStore(CONFIG_STORE_NAME);
  return new Promise((resolve, reject) => {
    let record;
    if (imageBuffer && typeof imageBuffer === "object" && "data" in imageBuffer && !(imageBuffer instanceof Blob) && !(imageBuffer instanceof ArrayBuffer) && !ArrayBuffer.isView(imageBuffer)) {
      record = { ...imageBuffer, id, date: imageBuffer.date || Date.now() };
    } else {
      record = { id, data: imageBuffer, date: Date.now() };
    }
    const request = store.put(record);
    request.onsuccess = () => {
      console.log(`[ConfigDB] \u6210\u529F\u5199\u5165 IndexedDB: ${id}`);
      resolve();
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

async function dbReadConfigImage(id) {
  const db2 = await openConfigDB();
  const transaction = db2.transaction([CONFIG_STORE_NAME], "readonly");
  const store = transaction.objectStore(CONFIG_STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function dbDeleteConfigImage(id) {
  const db2 = await openConfigDB();
  const transaction = db2.transaction([CONFIG_STORE_NAME], "readwrite");
  const store = transaction.objectStore(CONFIG_STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

function ensureServerStorage() {
  if (!extension_settings[extensionName].configImageStorage) {
    extension_settings[extensionName].configImageStorage = {};
  }
  return extension_settings[extensionName].configImageStorage;
}

function getStorageMode(options = {}) {
  return !options.forceIndexedDB && (options.forceServer || extension_settings[extensionName]?.jiuguanchucun === "true") ? "server" : "indexeddb";
}

function inferKindFromId(id, mimeType = "") {
  if (String(id || "").startsWith("cfgfile_") || String(mimeType).startsWith("audio/")) return "audio";
  return "image";
}

async function toFilePayload(data, options = {}) {
  const mimeType = options.mimeType || (options.kind === "audio" ? "audio/mpeg" : "image/png");
  let blob;
  if (data instanceof Blob) {
    blob = data.type === mimeType ? data : data.slice(0, data.size, mimeType);
  } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    const buffer = data instanceof ArrayBuffer ? data : data.buffer;
    blob = new Blob([buffer], { type: mimeType });
  } else if (typeof data === "string") {
    const commaIndex = data.indexOf(",");
    const sourceMime = commaIndex > 0 && data.startsWith("data:") ? data.slice(5, data.indexOf(";", 5) > -1 ? data.indexOf(";", 5) : commaIndex) : mimeType;
    const base64 = commaIndex > -1 && data.startsWith("data:") ? data.slice(commaIndex + 1) : data;
    blob = new Blob([base64ToArrayBuffer2(base64)], { type: sourceMime || mimeType });
  } else {
    throw new TypeError("\u914D\u7F6E\u6587\u4EF6\u6570\u636E\u5FC5\u987B\u662F Blob\u3001ArrayBuffer \u6216 Base64 \u5B57\u7B26\u4E32");
  }
  return { blob, mimeType: blob.type || mimeType, size: blob.size };
}

async function saveConfigFile(data, options = {}) {
  const { kind = "image", fileName = options.filename || "", id: providedId, forceServer = false, forceIndexedDB = false } = options;
  const payload = await toFilePayload(data, { ...options, kind });
  const id = providedId || (kind === "audio" ? `cfgfile_${generateUUID2()}` : generateConfigImageId());
  const format = (payload.mimeType.split("/")[1] || (kind === "audio" ? "mpeg" : "png")).split(";")[0];
  console.log(`[ConfigDB] \u5F00\u59CB\u4FDD\u5B58\u6587\u4EF6: ${id}, \u7C7B\u578B: ${kind}, \u5927\u5C0F: ${payload.size} \u5B57\u8282, \u5B58\u50A8\u6A21\u5F0F: ${getStorageMode({ forceServer, forceIndexedDB })}`);
  if (getStorageMode({ forceServer, forceIndexedDB }) === "server") {
    const response = await fetch("/api/images/upload", {
      method: "POST",
      headers: getRequestHeaders(window.token),
      body: JSON.stringify({
        image: await blobToBase642(payload.blob).then((value) => value.split(",")[1] || value),
        format: kind === "audio" ? "png" : format,
        filename: kind === "audio" ? `${id}.png` : fileName || void 0,
        ch_name: "chatu8_config"
      })
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
    const result = await response.json();
    ensureServerStorage()[id] = {
      path: result.path,
      date: Date.now(),
      kind,
      mimeType: payload.mimeType,
      fileName: fileName || `${id}.${kind === "audio" ? "png" : format}`,
      size: payload.size,
      storageFormat: kind === "audio" ? "disguised-png" : format
    };
    scheduleSettingsSave("registry");
  } else {
    await dbWriteConfigImage(id, {
      id,
      data: await payload.blob.arrayBuffer(),
      kind,
      mimeType: payload.mimeType,
      fileName: fileName || `${id}.${format}`,
      size: payload.size,
      date: Date.now()
    });
  }
  console.log(`[ConfigDB] \u6587\u4EF6\u4FDD\u5B58\u6210\u529F: ${id}`);
  return id;
}

async function getConfigFile(id, options = {}) {
  if (!id) throw Object.assign(new Error("\u914D\u7F6E\u6587\u4EF6 ID \u4E3A\u7A7A"), { code: "INVALID_ID" });
  const expectedKind = options.kind;
  const serverEntry = extension_settings[extensionName]?.configImageStorage?.[id];
  if (serverEntry?.path) {
    const response = await fetch(serverEntry.path);
    if (!response.ok) throw Object.assign(new Error(`\u914D\u7F6E\u6587\u4EF6\u4E0D\u5B58\u5728: ${id}`), { code: "NOT_FOUND" });
    const blob = await response.blob();
    const kind2 = serverEntry.kind || inferKindFromId(id, serverEntry.mimeType || blob.type);
    if (expectedKind && kind2 !== expectedKind) throw Object.assign(new Error(`\u914D\u7F6E\u6587\u4EF6\u7C7B\u578B\u4E0D\u5339\u914D: ${id}`), { code: "TYPE_MISMATCH" });
    let data = blob;
    if (kind2 === "audio") {
      data = new Blob([await blob.arrayBuffer()], { type: serverEntry.mimeType || "audio/mpeg" });
    }
    console.log(`[ConfigDB] \u4ECE\u670D\u52A1\u5668\u6210\u529F\u8BFB\u53D6: ${id}, \u5927\u5C0F: ${data.size} \u5B57\u8282`);
    return { id, data, kind: kind2, mimeType: serverEntry.mimeType || data.type || "application/octet-stream", fileName: serverEntry.fileName || id, size: serverEntry.size ?? data.size };
  }
  const entry = await dbReadConfigImage(id);
  if (!entry) throw Object.assign(new Error(`\u914D\u7F6E\u6587\u4EF6\u4E0D\u5B58\u5728: ${id}`), { code: "NOT_FOUND" });
  let target = entry;
  if (entry.data && typeof entry.data === "object" && !(entry.data instanceof Blob) && !(entry.data instanceof ArrayBuffer) && !ArrayBuffer.isView(entry.data) && "data" in entry.data) {
    target = entry.data;
  }
  const kind = target.kind || entry.kind || inferKindFromId(id, target.mimeType || entry.mimeType);
  if (expectedKind && kind !== expectedKind) throw Object.assign(new Error(`\u914D\u7F6E\u6587\u4EF6\u7C7B\u578B\u4E0D\u5339\u914D: ${id}`), { code: "TYPE_MISMATCH" });
  const mimeType = target.mimeType || entry.mimeType || (kind === "audio" ? "audio/mpeg" : "image/png");
  let raw;
  const rawData = target.data !== void 0 ? target.data : entry.data;
  if (rawData instanceof Blob) {
    raw = rawData;
  } else if (rawData instanceof ArrayBuffer || ArrayBuffer.isView(rawData)) {
    const buffer = rawData instanceof ArrayBuffer ? rawData : rawData.buffer;
    raw = new Blob([buffer], { type: mimeType });
  } else if (typeof rawData === "string") {
    const commaIndex = rawData.indexOf(",");
    const base64 = commaIndex > -1 && rawData.startsWith("data:") ? rawData.slice(commaIndex + 1) : rawData;
    raw = new Blob([base64ToArrayBuffer2(base64)], { type: mimeType });
  } else {
    raw = new Blob([], { type: mimeType });
  }
  console.log(`[ConfigDB] \u4ECE IndexedDB \u6210\u529F\u8BFB\u53D6: ${id}, \u7C7B\u578B: ${kind}, \u5927\u5C0F: ${raw.size} \u5B57\u8282`);
  return { id, data: raw, kind, mimeType, fileName: target.fileName || entry.fileName || id, size: target.size ?? entry.size ?? raw.size };
}

async function hasConfigFile(id, options = {}) {
  try {
    await getConfigFile(id, options);
    return true;
  } catch {
    return false;
  }
}

async function deleteConfigFile(id) {
  return deleteConfigImage(id);
}

async function saveConfigImage(imageBase64, options = {}) {
  return saveConfigFile(imageBase64, { ...options, kind: "image", mimeType: options.mimeType || `image/${options.format || "png"}`, fileName: options.fileName || options.filename });
}

async function saveConfigText(text, options = {}) {
  const { filename, id: providedId, forceServer = false, forceIndexedDB = false } = options;
  const id = providedId || generateConfigImageId();
  if (!forceIndexedDB && (forceServer || extension_settings[extensionName].jiuguanchucun === "true")) {
    try {
      const uploadBody = {
        image: utf8ToBase64(text),
        format: "png",
        ch_name: "chatu8_config"
      };
      if (filename) {
        uploadBody.filename = filename;
      }
      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify(uploadBody)
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      const result = await response.json();
      const storage = ensureServerStorage();
      storage[id] = {
        path: result.path,
        date: Date.now(),
        type: "text"
      };
      scheduleSettingsSave("registry");
      console.log(`[ConfigDB] \u914D\u7F6E\u6587\u672C\u5DF2\u4FDD\u5B58\u5230\u670D\u52A1\u5668: ${id}`);
      return id;
    } catch (error) {
      console.error("[ConfigDB] \u4E0A\u4F20\u914D\u7F6E\u6587\u672C\u5230\u670D\u52A1\u5668\u5931\u8D25:", error);
      throw error;
    }
  }
  await dbWriteConfigImage(id, text);
  console.log(`[ConfigDB] \u914D\u7F6E\u6587\u672C\u5DF2\u4FDD\u5B58\u5230 IndexedDB: ${id}`);
  return id;
}

function decodeDataUrlText(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return "";
  const header = dataUrl.substring(0, commaIndex);
  const data = dataUrl.substring(commaIndex + 1);
  if (header.includes(";base64")) {
    return base64ToUtf8(data);
  }
  return decodeURIComponent(data);
}

async function getConfigText(id) {
  if (!id) return null;
  const serverStorage = extension_settings[extensionName].configImageStorage || {};
  const serverEntry = serverStorage[id];
  if (serverEntry && serverEntry.path) {
    try {
      const response = await fetch(serverEntry.path);
      if (response.ok) {
        const text = await response.text();
        if (text.startsWith("data:")) {
          return decodeDataUrlText(text);
        }
        const trimmed = text.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          return text;
        }
        try {
          return base64ToUtf8(trimmed);
        } catch {
          return text;
        }
      }
    } catch (error) {
      console.error("[ConfigDB] \u4ECE\u670D\u52A1\u5668\u83B7\u53D6\u914D\u7F6E\u6587\u672C\u5931\u8D25:", error);
    }
  }
  try {
    const dbEntry = await dbReadConfigImage(id);
    if (dbEntry && dbEntry.data) {
      if (typeof dbEntry.data === "string") {
        return dbEntry.data.startsWith("data:") ? decodeDataUrlText(dbEntry.data) : dbEntry.data;
      }
      if (dbEntry.data instanceof ArrayBuffer) {
        return new TextDecoder().decode(new Uint8Array(dbEntry.data));
      }
    }
  } catch (error) {
    console.error("[ConfigDB] \u4ECE IndexedDB \u83B7\u53D6\u914D\u7F6E\u6587\u672C\u5931\u8D25:", error);
  }
  return null;
}

async function getConfigImage(id) {
  try {
    const file = await getConfigFile(id, { kind: "image" });
    return await blobToBase642(file.data);
  } catch (error) {
    if (error?.code !== "NOT_FOUND" && error?.code !== "TYPE_MISMATCH") console.error("[ConfigDB] \u83B7\u53D6\u914D\u7F6E\u56FE\u7247\u5931\u8D25:", error);
    return null;
  }
}

async function getConfigAudio(id) {
  return getConfigFile(id, { kind: "audio" });
}

async function saveConfigAudio(data, options = {}) {
  return saveConfigFile(data, { ...options, kind: "audio", mimeType: options.mimeType || "audio/mpeg" });
}

async function deleteConfigImage(id) {
  if (!id) return false;
  let deleted = false;
  const serverStorage = extension_settings[extensionName].configImageStorage || {};
  const serverEntry = serverStorage[id];
  if (serverEntry) {
    if (serverEntry.path && typeof serverEntry.path === "string") {
      const isSafePath = serverEntry.path.endsWith(`${id}.png`) || serverEntry.path.includes(`/${id}.`);
      if (isSafePath) {
        try {
          const response = await fetch("/api/images/delete", {
            method: "POST",
            headers: getRequestHeaders(window.token),
            body: JSON.stringify({ path: serverEntry.path })
          });
          if (!response.ok) {
            console.error("[ConfigDB] \u5220\u9664\u670D\u52A1\u5668\u56FE\u7247\u5931\u8D25:", response.statusText);
          }
        } catch (error) {
          console.error("[ConfigDB] \u5220\u9664\u670D\u52A1\u5668\u56FE\u7247\u5931\u8D25:", error);
        }
      } else {
        console.warn(`[ConfigDB] \u62D2\u7EDD\u7269\u7406\u5220\u9664\u4E0D\u7B26\u5408\u767D\u540D\u5355\u7684\u670D\u52A1\u5668\u8DEF\u5F84: ${serverEntry.path} (id: ${id})`);
      }
    }
    delete serverStorage[id];
    scheduleSettingsSave("registry");
    deleted = true;
    console.log(`[ConfigDB] \u914D\u7F6E\u56FE\u7247\u5DF2\u4ECE\u670D\u52A1\u5668\u5220\u9664: ${id}`);
  }
  try {
    const dbEntry = await dbReadConfigImage(id);
    if (dbEntry) {
      await dbDeleteConfigImage(id);
      deleted = true;
      console.log(`[ConfigDB] \u914D\u7F6E\u56FE\u7247\u5DF2\u4ECE IndexedDB \u5220\u9664: ${id}`);
    }
  } catch (error) {
    console.error("[ConfigDB] \u4ECE IndexedDB \u5220\u9664\u914D\u7F6E\u56FE\u7247\u5931\u8D25:", error);
  }
  return deleted;
}

async function hasConfigImage(id) {
  if (!id) return false;
  const serverStorage = extension_settings[extensionName].configImageStorage || {};
  if (serverStorage[id]) {
    return true;
  }
  try {
    const dbEntry = await dbReadConfigImage(id);
    return !!dbEntry;
  } catch (error) {
    return false;
  }
}

async function listConfigImageIds() {
  const ids = /* @__PURE__ */ new Set();
  const serverStorage = extension_settings[extensionName].configImageStorage || {};
  Object.keys(serverStorage).forEach((id) => ids.add(id));
  try {
    const db2 = await openConfigDB();
    const transaction = db2.transaction([CONFIG_STORE_NAME], "readonly");
    const store = transaction.objectStore(CONFIG_STORE_NAME);
    const dbIds = await new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
    dbIds.forEach((id) => ids.add(id));
  } catch (error) {
    console.error("[ConfigDB] \u83B7\u53D6 IndexedDB ID \u5217\u8868\u5931\u8D25:", error);
  }
  return Array.from(ids);
}

function utf8ToBase64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
}

async function saveAiChatHistory(historyArray) {
  const id = "ai_chat_history";
  const jsonString = JSON.stringify(historyArray);
  const base64Data = utf8ToBase64(jsonString);
  if (extension_settings[extensionName].jiuguanchucun === "true") {
    try {
      const uploadBody = {
        image: base64Data,
        format: "png",
        ch_name: "chatu8_config",
        filename: "ai_chat_history.png"
      };
      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify(uploadBody)
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      const result = await response.json();
      const storage = ensureServerStorage();
      storage[id] = {
        path: result.path,
        date: Date.now()
      };
      saveSettingsDebounced();
      console.log(`[ConfigDB] \u804A\u5929\u8BB0\u5F55\u5DF2\u4FDD\u5B58\u5230\u670D\u52A1\u5668: ${id}`);
    } catch (error) {
      console.error("[ConfigDB] \u4E0A\u4F20\u804A\u5929\u8BB0\u5F55\u5230\u670D\u52A1\u5668\u5931\u8D25:", error);
    }
  } else {
    try {
      const imageBuffer = base64ToArrayBuffer2(base64Data);
      await dbWriteConfigImage(id, imageBuffer);
      console.log(`[ConfigDB] \u804A\u5929\u8BB0\u5F55\u5DF2\u4FDD\u5B58\u5230 IndexedDB: ${id}`);
    } catch (e) {
      console.error("[ConfigDB] \u804A\u5929\u8BB0\u5F55\u5B58\u5165 IndexedDB \u5931\u8D25:", e);
    }
  }
}

async function getAiChatHistory() {
  const id = "ai_chat_history";
  const serverStorage = extension_settings[extensionName].configImageStorage || {};
  const serverEntry = serverStorage[id];
  if (serverEntry && serverEntry.path) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5e3);
      const response = await fetch(serverEntry.path, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const text = await response.text();
        try {
          return JSON.parse(text) || [];
        } catch (e) {
          try {
            const decodedStr = base64ToUtf8(text.trim());
            return JSON.parse(decodedStr) || [];
          } catch (err2) {
            console.warn("[ConfigDB] \u670D\u52A1\u5668\u7AEF\u8BB0\u5F55JSON\u89E3\u6790\u53CABase64\u89E3\u7801\u5747\u5931\u8D25:", err2);
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("[ConfigDB] \u4ECE\u670D\u52A1\u5668\u83B7\u53D6\u804A\u5929\u5386\u53F2\u8D85\u65F6\uFF0C\u56DE\u9000\u5230 IndexedDB");
      } else {
        console.error("[ConfigDB] \u4ECE\u670D\u52A1\u5668\u83B7\u53D6\u804A\u5929\u5386\u53F2\u5931\u8D25:", error);
      }
    }
  }
  try {
    const dbEntry = await dbReadConfigImage(id);
    if (dbEntry && dbEntry.data) {
      const base64Data = arrayBufferToBase642(dbEntry.data);
      const jsonString = base64ToUtf8(base64Data);
      return JSON.parse(jsonString) || [];
    }
  } catch (e) {
    console.error("[ConfigDB] \u83B7\u53D6 IndexedDB \u804A\u5929\u5386\u53F2\u5931\u8D25:", e);
  }
  return [];
}

async function clearAiChatHistory() {
  await deleteConfigImage("ai_chat_history");
}

async function saveKnowledgeBaseContent(baseId, contentObj) {
  const id = `kb_content_${baseId}`;
  const jsonString = JSON.stringify(contentObj);
  const base64Data = utf8ToBase64(jsonString);
  if (extension_settings[extensionName].jiuguanchucun === "true") {
    try {
      const uploadBody = {
        image: base64Data,
        format: "png",
        ch_name: "chatu8_config",
        filename: `${id}.png`
      };
      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify(uploadBody)
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
      const result = await response.json();
      const storage = ensureServerStorage();
      const isNewPath = !storage[id] || storage[id].path !== result.path;
      storage[id] = { path: result.path, date: Date.now() };
      if (isNewPath) scheduleSettingsSave("registry");
      console.log(`[ConfigDB] \u8D44\u6599\u5E93\u5185\u5BB9\u5DF2\u4FDD\u5B58\u5230\u670D\u52A1\u5668: ${id}`);
    } catch (error) {
      console.error("[ConfigDB] \u4E0A\u4F20\u8D44\u6599\u5E93\u5185\u5BB9\u5230\u670D\u52A1\u5668\u5931\u8D25:", error);
    }
  } else {
    try {
      const imageBuffer = base64ToArrayBuffer2(base64Data);
      await dbWriteConfigImage(id, imageBuffer);
      console.log(`[ConfigDB] \u8D44\u6599\u5E93\u5185\u5BB9\u5DF2\u4FDD\u5B58\u5230 IndexedDB: ${id}`);
    } catch (e) {
      console.error("[ConfigDB] \u8D44\u6599\u5E93\u5185\u5BB9\u5B58\u5165 IndexedDB \u5931\u8D25:", e);
    }
  }
}

async function getKnowledgeBaseContent(baseId) {
  const id = `kb_content_${baseId}`;
  const serverStorage = extension_settings[extensionName].configImageStorage || {};
  const serverEntry = serverStorage[id];
  if (serverEntry && serverEntry.path) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5e3);
      const response = await fetch(serverEntry.path, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const text = await response.text();
        try {
          return JSON.parse(text) || null;
        } catch (e) {
          try {
            const decodedStr = base64ToUtf8(text.trim());
            return JSON.parse(decodedStr) || null;
          } catch (err2) {
            console.warn("[ConfigDB] \u8D44\u6599\u5E93\u5185\u5BB9\u89E3\u6790\u5931\u8D25:", err2);
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("[ConfigDB] \u4ECE\u670D\u52A1\u5668\u83B7\u53D6\u8D44\u6599\u5E93\u5185\u5BB9\u8D85\u65F6\uFF0C\u56DE\u9000\u5230 IndexedDB");
      } else {
        console.error("[ConfigDB] \u4ECE\u670D\u52A1\u5668\u83B7\u53D6\u8D44\u6599\u5E93\u5185\u5BB9\u5931\u8D25:", error);
      }
    }
  }
  try {
    const dbEntry = await dbReadConfigImage(id);
    if (dbEntry && dbEntry.data) {
      const base64Data = arrayBufferToBase642(dbEntry.data);
      const jsonString = base64ToUtf8(base64Data);
      return JSON.parse(jsonString) || null;
    }
  } catch (e) {
    console.error("[ConfigDB] \u83B7\u53D6 IndexedDB \u8D44\u6599\u5E93\u5185\u5BB9\u5931\u8D25:", e);
  }
  return null;
}

async function deleteKnowledgeBaseContent(baseId) {
  await deleteConfigImage(`kb_content_${baseId}`);
}

function generateChatImageId() {
  return `chatimg_${generateUUID2()}`;
}

async function _saveJsonData(storageKey, data) {
  const jsonString = JSON.stringify(data);
  const base64Data = utf8ToBase64(jsonString);
  const imageBuffer = base64ToArrayBuffer2(base64Data);
  if (extension_settings[extensionName].jiuguanchucun === "true") {
    try {
      const uploadBody = {
        image: base64Data,
        format: "png",
        ch_name: "chatu8_config",
        filename: `${storageKey}.png`
      };
      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify(uploadBody)
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      const result = await response.json();
      const storage = ensureServerStorage();
      storage[storageKey] = {
        path: result.path,
        date: Date.now()
      };
      scheduleSettingsSave("registry");
      console.log(`[ConfigDB] JSON \u6570\u636E\u5DF2\u4FDD\u5B58\u5230\u670D\u52A1\u5668: ${storageKey}`);
      try {
        await dbWriteConfigImage(storageKey, imageBuffer);
      } catch (dbErr) {
        console.warn(`[ConfigDB] \u672C\u5730\u53CC\u5199\u955C\u50CF\u5931\u8D25\uFF08\u975E\u81F4\u547D\uFF09(${storageKey}):`, dbErr);
      }
    } catch (error) {
      console.error(`[ConfigDB] \u4E0A\u4F20 JSON \u6570\u636E\u5230\u670D\u52A1\u5668\u5931\u8D25 (${storageKey}):`, error);
      try {
        await dbWriteConfigImage(storageKey, imageBuffer);
        console.log(`[ConfigDB] \u670D\u52A1\u5668\u4E0A\u4F20\u5931\u8D25\uFF0C\u5DF2\u56DE\u9000\u4FDD\u5B58\u81F3\u672C\u5730 IndexedDB: ${storageKey}`);
      } catch (fallbackErr) {
        console.error(`[ConfigDB] \u672C\u5730\u56DE\u9000\u5199\u5165\u4E5F\u5931\u8D25 (${storageKey}):`, fallbackErr);
      }
      throw error;
    }
  } else {
    try {
      await dbWriteConfigImage(storageKey, imageBuffer);
      console.log(`[ConfigDB] JSON \u6570\u636E\u5DF2\u4FDD\u5B58\u5230 IndexedDB: ${storageKey}`);
    } catch (e) {
      console.error(`[ConfigDB] JSON \u6570\u636E\u5B58\u5165 IndexedDB \u5931\u8D25 (${storageKey}):`, e);
      throw e;
    }
  }
}

async function _tryFetchJsonFromPath(url, storageKey) {
  if (!url || typeof url !== "string") return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4e3);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const text = await response.text();
    if (!text || !text.trim()) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      try {
        const decodedStr = base64ToUtf8(text.trim());
        return JSON.parse(decodedStr);
      } catch (err2) {
        console.warn(`[ConfigDB] \u8DEF\u5F84 ${url} \u5185\u5BB9\u65E0\u6CD5\u89E3\u6790\u4E3A JSON:`, err2);
      }
    }
  } catch (_) {
  }
  return null;
}

function _getCandidateDirs() {
  const now = Date.now();
  if (_candidateDirsCache && now - _candidateDirsCacheTimestamp < CANDIDATE_DIRS_CACHE_TTL) {
    return _candidateDirsCache;
  }
  const dirs = /* @__PURE__ */ new Set();
  const serverStorage = extension_settings[extensionName]?.configImageStorage || {};
  const knownKeys = ["ai_chat_index", "ai_chat_history", "log_session_index"];
  for (const k of knownKeys) {
    const p = serverStorage[k]?.path;
    if (p && typeof p === "string" && p.includes("/")) {
      dirs.add(p.substring(0, p.lastIndexOf("/") + 1));
    }
  }
  for (const entry of Object.values(serverStorage)) {
    const p = entry?.path;
    if (p && typeof p === "string" && p.includes("chatu8_config") && p.includes("/")) {
      dirs.add(p.substring(0, p.lastIndexOf("/") + 1));
    }
  }
  const defaultDirs = [
    "/characters/chatu8_config/",
    "characters/chatu8_config/",
    "/user/images/chatu8_config/",
    "user/images/chatu8_config/"
  ];
  defaultDirs.forEach((dir) => dirs.add(dir));
  _candidateDirsCache = Array.from(dirs);
  _candidateDirsCacheTimestamp = now;
  return _candidateDirsCache;
}

function _getCandidateServerPaths(storageKey) {
  const candidates = /* @__PURE__ */ new Set();
  const serverStorage = extension_settings[extensionName]?.configImageStorage || {};
  const fileName = `${storageKey}.png`;
  if (serverStorage[storageKey]?.path) {
    candidates.add(serverStorage[storageKey].path);
  }
  const dirs = _getCandidateDirs();
  dirs.forEach((dir) => candidates.add(`${dir}${fileName}`));
  return Array.from(candidates);
}

async function _getJsonData(storageKey) {
  const candidatePaths = _getCandidateServerPaths(storageKey);
  for (const path of candidatePaths) {
    const data = await _tryFetchJsonFromPath(path, storageKey);
    if (data) {
      const serverStorage = ensureServerStorage();
      if (!serverStorage[storageKey] || serverStorage[storageKey].path !== path) {
        console.log(`[ConfigDB] \u6210\u529F\u901A\u8FC7\u63A8\u5BFC\u8DEF\u5F84\u81EA\u6108\u5B9A\u4F4D\u5E76\u6062\u590D: ${storageKey} -> ${path}`);
        serverStorage[storageKey] = {
          path,
          date: Date.now()
        };
        scheduleSettingsSave("registry");
      }
      return data;
    }
  }
  try {
    const dbEntry = await dbReadConfigImage(storageKey);
    if (dbEntry && dbEntry.data) {
      const base64Data = arrayBufferToBase642(dbEntry.data);
      const jsonString = base64ToUtf8(base64Data);
      const parsed = JSON.parse(jsonString);
      if (parsed) {
        console.log(`[ConfigDB] \u4ECE\u672C\u5730 IndexedDB \u6210\u529F\u52A0\u8F7D: ${storageKey}`);
        return parsed;
      }
    }
  } catch (e) {
    console.error(`[ConfigDB] \u83B7\u53D6 IndexedDB \u6570\u636E\u5931\u8D25 (${storageKey}):`, e);
  }
  return null;
}

async function _deleteStorageData(storageKey) {
  return deleteConfigImage(storageKey);
}

async function saveChatIndex(indexData) {
  if (!indexData.version) {
    indexData.version = 2;
  }
  await _saveJsonData("ai_chat_index", indexData);
}

async function getChatIndex() {
  return await _getJsonData("ai_chat_index");
}

async function saveChatData(chatId, chatData) {
  if (!chatId) {
    throw new Error("[ConfigDB] saveChatData: chatId \u4E0D\u80FD\u4E3A\u7A7A");
  }
  const storageKey = `ai_chat_data_${chatId}`;
  await _saveJsonData(storageKey, chatData);
}

async function getChatData(chatId) {
  if (!chatId) return null;
  const storageKey = `ai_chat_data_${chatId}`;
  let data = await _getJsonData(storageKey);
  if (data) return data;
  try {
    const oldHistory = await getAiChatHistory();
    if (oldHistory) {
      if (oldHistory.chats && oldHistory.chats[chatId]) {
        const legacyChat = oldHistory.chats[chatId];
        console.log(`[ConfigDB] \u4ECE\u65E7\u7248\u5386\u53F2\u6570\u636E\u4E2D\u6210\u529F\u81EA\u6108\u6062\u590D\u4F1A\u8BDD: ${chatId}`);
        await saveChatData(chatId, legacyChat);
        return legacyChat;
      }
      if (Array.isArray(oldHistory) && oldHistory.length > 0) {
        const legacyChat = {
          id: chatId,
          title: "\u6062\u590D\u7684\u5BF9\u8BDD\u8BB0\u5F55",
          updatedAt: Date.now(),
          taskData: null,
          messages: oldHistory
        };
        console.log(`[ConfigDB] \u4ECE\u65E7\u5355\u4F1A\u8BDD\u8BB0\u5F55\u4E2D\u81EA\u6108\u6062\u590D\u4F1A\u8BDD: ${chatId}`);
        await saveChatData(chatId, legacyChat);
        return legacyChat;
      }
    }
  } catch (e) {
    console.warn(`[ConfigDB] \u65E7\u6570\u636E\u6062\u590D\u515C\u5E95\u5931\u8D25 (${chatId}):`, e);
  }
  return null;
}

async function deleteChatData(chatId) {
  if (!chatId) return false;
  const storageKey = `ai_chat_data_${chatId}`;
  return await _deleteStorageData(storageKey);
}

async function saveLogIndex(indexData) {
  if (!indexData.version) {
    indexData.version = 1;
  }
  await _saveJsonData("log_session_index", indexData);
}

async function getLogIndex() {
  return await _getJsonData("log_session_index");
}

async function saveLogSessionData(sessionId, sessionData) {
  if (!sessionId) {
    throw new Error("[ConfigDB] saveLogSessionData: sessionId \u4E0D\u80FD\u4E3A\u7A7A");
  }
  const storageKey = `log_session_data_${sessionId}`;
  await _saveJsonData(storageKey, sessionData);
}

async function getLogSessionData(sessionId) {
  if (!sessionId) return null;
  const storageKey = `log_session_data_${sessionId}`;
  return await _getJsonData(storageKey);
}

async function deleteLogSessionData(sessionId) {
  if (!sessionId) return false;
  const storageKey = `log_session_data_${sessionId}`;
  return await _deleteStorageData(storageKey);
}

async function saveChatImage(imageBase64, opts = {}) {
  const { mimeType = "image/png", name = "", chatId = "" } = opts;
  const id = generateChatImageId();
  const base64Data = imageBase64.split(",")[1] || imageBase64;
  const format = mimeType.split("/")[1] || "png";
  if (extension_settings[extensionName].jiuguanchucun === "true") {
    try {
      const uploadBody = {
        image: base64Data,
        format,
        ch_name: "chatu8_config"
      };
      if (name) {
        uploadBody.filename = name;
      }
      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify(uploadBody)
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      const result = await response.json();
      const imagePath = result.path;
      const storage = ensureServerStorage();
      storage[id] = {
        path: imagePath,
        mimeType,
        name,
        chatId,
        date: Date.now()
      };
      saveSettingsDebounced();
      console.log(`[ConfigDB] \u804A\u5929\u56FE\u7247\u5DF2\u4FDD\u5B58\u5230\u670D\u52A1\u5668: ${id}`);
      return id;
    } catch (error) {
      console.error("[ConfigDB] \u4E0A\u4F20\u804A\u5929\u56FE\u7247\u5230\u670D\u52A1\u5668\u5931\u8D25:", error);
      throw error;
    }
  } else {
    const imageBuffer = base64ToArrayBuffer2(base64Data);
    const record = {
      imageData: imageBuffer,
      mimeType,
      name,
      chatId,
      createdAt: Date.now()
    };
    await dbWriteConfigImage(id, record);
    console.log(`[ConfigDB] \u804A\u5929\u56FE\u7247\u5DF2\u4FDD\u5B58\u5230 IndexedDB: ${id}`);
    return id;
  }
}

async function getChatImage(imageId) {
  if (!imageId) return null;
  const serverStorage = extension_settings[extensionName].configImageStorage || {};
  const serverEntry = serverStorage[imageId];
  if (serverEntry && serverEntry.path) {
    try {
      const response = await fetch(serverEntry.path);
      if (response.ok) {
        const blob = await response.blob();
        const base64 = await blobToBase642(blob);
        return base64;
      }
    } catch (error) {
      console.error(`[ConfigDB] \u4ECE\u670D\u52A1\u5668\u83B7\u53D6\u804A\u5929\u56FE\u7247\u5931\u8D25 (${imageId}):`, error);
    }
  }
  try {
    const dbEntry = await dbReadConfigImage(imageId);
    if (dbEntry && dbEntry.data) {
      const innerData = dbEntry.data;
      if (innerData instanceof ArrayBuffer) {
        return `data:image/png;base64,${arrayBufferToBase642(innerData)}`;
      } else if (innerData && innerData.imageData instanceof ArrayBuffer) {
        const mimeType = innerData.mimeType || "image/png";
        return `data:${mimeType};base64,${arrayBufferToBase642(innerData.imageData)}`;
      }
    }
  } catch (error) {
    console.error(`[ConfigDB] \u4ECE IndexedDB \u83B7\u53D6\u804A\u5929\u56FE\u7247\u5931\u8D25 (${imageId}):`, error);
  }
  return null;
}

async function deleteChatImage(imageId) {
  if (!imageId) return false;
  return await _deleteStorageData(imageId);
}

async function deleteChatImagesByChatId(chatId) {
  if (!chatId) return 0;
  let deletedCount = 0;
  const serverStorage = extension_settings[extensionName].configImageStorage || {};
  const serverIdsToDelete = [];
  for (const [id, entry] of Object.entries(serverStorage)) {
    if (id.startsWith("chatimg_") && entry.chatId === chatId) {
      serverIdsToDelete.push(id);
    }
  }
  for (const id of serverIdsToDelete) {
    try {
      const entry = serverStorage[id];
      if (entry && entry.path) {
        await fetch("/api/images/delete", {
          method: "POST",
          headers: getRequestHeaders(window.token),
          body: JSON.stringify({ path: entry.path })
        });
      }
      delete serverStorage[id];
      deletedCount++;
    } catch (error) {
      console.error(`[ConfigDB] \u5220\u9664\u670D\u52A1\u5668\u804A\u5929\u56FE\u7247\u5931\u8D25 (${id}):`, error);
    }
  }
  if (serverIdsToDelete.length > 0) {
    saveSettingsDebounced();
  }
  try {
    const db2 = await openConfigDB();
    const transaction = db2.transaction([CONFIG_STORE_NAME], "readonly");
    const store = transaction.objectStore(CONFIG_STORE_NAME);
    const allKeys = await new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
    const chatImgKeys = allKeys.filter((key) => typeof key === "string" && key.startsWith("chatimg_"));
    for (const key of chatImgKeys) {
      try {
        const entry = await new Promise((resolve, reject) => {
          const tx = db2.transaction([CONFIG_STORE_NAME], "readonly");
          const s = tx.objectStore(CONFIG_STORE_NAME);
          const req = s.get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = (event) => reject(event.target.error);
        });
        const innerData = entry && entry.data;
        const entryChatId = innerData && innerData.chatId;
        if (entryChatId === chatId) {
          await new Promise((resolve, reject) => {
            const tx = db2.transaction([CONFIG_STORE_NAME], "readwrite");
            const s = tx.objectStore(CONFIG_STORE_NAME);
            const req = s.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = (event) => reject(event.target.error);
          });
          deletedCount++;
        }
      } catch (error) {
        console.error(`[ConfigDB] \u5220\u9664 IndexedDB \u804A\u5929\u56FE\u7247\u5931\u8D25 (${key}):`, error);
      }
    }
  } catch (error) {
    console.error(`[ConfigDB] \u6279\u91CF\u5220\u9664 IndexedDB \u804A\u5929\u56FE\u7247\u5931\u8D25 (chatId=${chatId}):`, error);
  }
  console.log(`[ConfigDB] \u5DF2\u5220\u9664\u4F1A\u8BDD ${chatId} \u7684 ${deletedCount} \u5F20\u804A\u5929\u56FE\u7247`);
  return deletedCount;
}

async function getChatImagesBatch(imageIds) {
  if (!imageIds || imageIds.length === 0) return {};
  const results = {};
  const promises = imageIds.map(async (imageId) => {
    try {
      const base64 = await getChatImage(imageId);
      if (base64) {
        results[imageId] = base64;
      }
    } catch (error) {
      console.error(`[ConfigDB] \u6279\u91CF\u83B7\u53D6\u56FE\u7247\u5931\u8D25 (${imageId}):`, error);
    }
  });
  await Promise.all(promises);
  return results;
}

async function getChatImagesMetadataBatch(imageIds) {
  if (!imageIds || imageIds.length === 0) return {};
  const results = {};
  const promises = imageIds.map(async (imageId) => {
    try {
      const serverStorage = extension_settings[extensionName].configImageStorage || {};
      const serverEntry = serverStorage[imageId];
      if (serverEntry) {
        results[imageId] = {
          name: serverEntry.name || "",
          mimeType: serverEntry.mimeType || "image/png",
          chatId: serverEntry.chatId || "",
          createdAt: serverEntry.date || 0
        };
        return;
      }
      const dbEntry = await dbReadConfigImage(imageId);
      if (dbEntry && dbEntry.data) {
        const innerData = dbEntry.data;
        if (innerData && typeof innerData === "object" && innerData.imageData) {
          results[imageId] = {
            name: innerData.name || "",
            mimeType: innerData.mimeType || "image/png",
            chatId: innerData.chatId || "",
            createdAt: innerData.createdAt || dbEntry.date || 0
          };
        }
      }
    } catch (error) {
      console.error(`[ConfigDB] \u6279\u91CF\u83B7\u53D6\u56FE\u7247\u5143\u6570\u636E\u5931\u8D25 (${imageId}):`, error);
    }
  });
  await Promise.all(promises);
  return results;
}

async function migrateV1ToV2() {
  console.log("[ConfigDB] \u5F00\u59CB V1 \u2192 V2 \u8FC1\u79FB...");
  try {
    const oldData = await getAiChatHistory();
    if (!oldData || Array.isArray(oldData) && oldData.length === 0) {
      console.log("[ConfigDB] \u65E0\u65E7\u6570\u636E\u9700\u8981\u8FC1\u79FB");
      return { success: true, migratedChats: 0, migratedImages: 0 };
    }
    let chatSessions2;
    if (Array.isArray(oldData)) {
      const chatId = `chat_${generateUUID2()}`;
      chatSessions2 = {
        activeChatId: chatId,
        chats: {
          [chatId]: {
            id: chatId,
            title: "\u5BF9\u8BDD\u8BB0\u5F55",
            updatedAt: Date.now(),
            messages: oldData,
            taskData: null
          }
        }
      };
    } else if (oldData && oldData.chats) {
      chatSessions2 = oldData;
    } else {
      console.warn("[ConfigDB] \u65E7\u6570\u636E\u683C\u5F0F\u65E0\u6CD5\u8BC6\u522B\uFF0C\u8DF3\u8FC7\u8FC1\u79FB");
      return { success: false, migratedChats: 0, migratedImages: 0, error: "\u65E7\u6570\u636E\u683C\u5F0F\u65E0\u6CD5\u8BC6\u522B" };
    }
    let migratedChats = 0;
    let migratedImages = 0;
    const chatList = [];
    for (const [chatId, chat4] of Object.entries(chatSessions2.chats || {})) {
      try {
        const newMessages = [];
        for (const msg of chat4.messages || []) {
          const newMsg = {
            role: msg.role,
            content: "",
            timestamp: msg.timestamp || void 0
          };
          const imageRefs = [];
          const processedBase64Set = /* @__PURE__ */ new Set();
          if (Array.isArray(msg.content)) {
            const textParts = [];
            for (const part of msg.content) {
              if (part.type === "text") {
                textParts.push(part.text || "");
              } else if (part.type === "image_url" && part.image_url && part.image_url.url) {
                const imgUrl = part.image_url.url;
                if (imgUrl.startsWith("data:")) {
                  const base64Body = imgUrl.split(",")[1] || "";
                  const fingerprint = base64Body.substring(0, 100);
                  if (base64Body && !processedBase64Set.has(fingerprint)) {
                    processedBase64Set.add(fingerprint);
                    const mimeMatch = imgUrl.match(/^data:([^;]+);/);
                    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                    try {
                      const imageId = await saveChatImage(imgUrl, {
                        mimeType,
                        name: `migrated_${migratedImages}`,
                        chatId
                      });
                      imageRefs.push(imageId);
                      migratedImages++;
                    } catch (imgErr) {
                      console.error(`[ConfigDB] \u8FC1\u79FB\u56FE\u7247\u5931\u8D25:`, imgErr);
                    }
                  }
                }
              }
            }
            newMsg.content = textParts.join("\n");
          } else {
            newMsg.content = msg.content || "";
          }
          if (Array.isArray(msg.images) && msg.images.length > 0) {
            for (const img of msg.images) {
              const imgData = img.data || img.url || "";
              if (imgData && imgData.startsWith("data:")) {
                const base64Body = imgData.split(",")[1] || "";
                const fingerprint = base64Body.substring(0, 100);
                if (base64Body && !processedBase64Set.has(fingerprint)) {
                  processedBase64Set.add(fingerprint);
                  const mimeMatch = imgData.match(/^data:([^;]+);/);
                  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                  try {
                    const imageId = await saveChatImage(imgData, {
                      mimeType,
                      name: img.name || `migrated_img_${migratedImages}`,
                      chatId
                    });
                    imageRefs.push(imageId);
                    migratedImages++;
                  } catch (imgErr) {
                    console.error(`[ConfigDB] \u8FC1\u79FB images[] \u56FE\u7247\u5931\u8D25:`, imgErr);
                  }
                }
              }
            }
          }
          if (imageRefs.length > 0) {
            newMsg.imageRefs = imageRefs;
          }
          newMessages.push(newMsg);
        }
        const chatData = {
          id: chatId,
          title: chat4.title || "\u672A\u547D\u540D\u5BF9\u8BDD",
          updatedAt: chat4.updatedAt || Date.now(),
          taskData: chat4.taskData || null,
          messages: newMessages
        };
        await saveChatData(chatId, chatData);
        migratedChats++;
        chatList.push({
          id: chatId,
          title: chatData.title,
          updatedAt: chatData.updatedAt,
          messageCount: newMessages.length
        });
      } catch (chatErr) {
        console.error(`[ConfigDB] \u8FC1\u79FB\u4F1A\u8BDD ${chatId} \u5931\u8D25:`, chatErr);
      }
    }
    chatList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const indexData = {
      version: 2,
      activeChatId: chatSessions2.activeChatId || (chatList.length > 0 ? chatList[0].id : null),
      chatList
    };
    await saveChatIndex(indexData);
    try {
      await clearAiChatHistory();
      console.log("[ConfigDB] \u65E7\u6570\u636E ai_chat_history \u5DF2\u6E05\u9664");
    } catch (delErr) {
      console.warn("[ConfigDB] \u6E05\u9664\u65E7\u6570\u636E\u5931\u8D25\uFF08\u975E\u81F4\u547D\uFF09:", delErr);
    }
    console.log(`[ConfigDB] V1 \u2192 V2 \u8FC1\u79FB\u5B8C\u6210: ${migratedChats} \u4E2A\u4F1A\u8BDD, ${migratedImages} \u5F20\u56FE\u7247`);
    return { success: true, migratedChats, migratedImages };
  } catch (error) {
    console.error("[ConfigDB] V1 \u2192 V2 \u8FC1\u79FB\u5931\u8D25:", error);
    return { success: false, migratedChats: 0, migratedImages: 0, error: error.message };
  }
}

async function saveComfyuiCache(cacheKey, data) {
  const storageKey = `comfyui_cache_${cacheKey}`;
  await _saveJsonData(storageKey, data);
}

async function getComfyuiCache(cacheKey) {
  const storageKey = `comfyui_cache_${cacheKey}`;
  return await _getJsonData(storageKey);
}

async function saveSdCache(cacheKey, data) {
  const storageKey = `sd_cache_${cacheKey}`;
  await _saveJsonData(storageKey, data);
}

async function getSdCache(cacheKey) {
  const storageKey = `sd_cache_${cacheKey}`;
  return await _getJsonData(storageKey);
}

async function getFullComfyuiCache() {
  const keys = ["models", "samplers", "vaes", "schedulers", "loras", "clips", "objectinfo"];
  const cache = {};
  await Promise.all(keys.map(async (key) => {
    const data = await getComfyuiCache(key);
    if (data !== null) {
      const settingsKey = key === "clips" ? "CLIPs" : key;
      const finalKey = key === "objectinfo" ? "objectInfo" : settingsKey;
      cache[finalKey] = data;
    }
  }));
  return cache;
}

async function getFullSdCache() {
  const keys = ["models", "samplers", "vaes", "schedulers", "upscalers", "loras"];
  const cache = {};
  await Promise.all(keys.map(async (key) => {
    const data = await getSdCache(key);
    if (data !== null) {
      cache[key] = data;
    }
  }));
  return cache;
}

async function saveFullComfyuiCache(cacheObj) {
  const keyMap = {
    "models": "models",
    "samplers": "samplers",
    "vaes": "vaes",
    "schedulers": "schedulers",
    "loras": "loras",
    "CLIPs": "clips",
    "objectInfo": "objectinfo"
  };
  await Promise.all(Object.entries(keyMap).map(async ([settingsKey, storageKey]) => {
    if (cacheObj[settingsKey] !== void 0) {
      await saveComfyuiCache(storageKey, cacheObj[settingsKey]);
    }
  }));
}

async function saveFullSdCache(cacheObj) {
  const keys = ["models", "samplers", "vaes", "schedulers", "upscalers", "loras"];
  await Promise.all(keys.map(async (key) => {
    if (cacheObj[key] !== void 0) {
      await saveSdCache(key, cacheObj[key]);
    }
  }));
}

async function migrateCacheToDatabase() {
  console.log("[ConfigDB] \u5F00\u59CB Cache \u8FC1\u79FB...");
  const settings3 = extension_settings[extensionName];
  let migratedComfyui = false;
  let migratedSd = false;
  try {
    if (settings3.comfyuiCache && Object.keys(settings3.comfyuiCache).length > 0) {
      console.log("[ConfigDB] \u68C0\u6D4B\u5230 comfyuiCache\uFF0C\u5F00\u59CB\u8FC1\u79FB...");
      await saveFullComfyuiCache(settings3.comfyuiCache);
      delete settings3.comfyuiCache;
      migratedComfyui = true;
      console.log("[ConfigDB] comfyuiCache \u8FC1\u79FB\u5B8C\u6210");
    }
    if (settings3.sdCache && Object.keys(settings3.sdCache).length > 0) {
      console.log("[ConfigDB] \u68C0\u6D4B\u5230 sdCache\uFF0C\u5F00\u59CB\u8FC1\u79FB...");
      await saveFullSdCache(settings3.sdCache);
      delete settings3.sdCache;
      migratedSd = true;
      console.log("[ConfigDB] sdCache \u8FC1\u79FB\u5B8C\u6210");
    }
    if (migratedComfyui || migratedSd) {
      settings3.cacheStorageMigrated = true;
      saveSettingsDebounced();
      console.log("[ConfigDB] Cache \u8FC1\u79FB\u5B8C\u6210");
    }
    return { success: true, migratedComfyui, migratedSd };
  } catch (error) {
    console.error("[ConfigDB] Cache \u8FC1\u79FB\u5931\u8D25:", error);
    return { success: false, migratedComfyui: false, migratedSd: false };
  }
}

export { deleteChatData, deleteChatImagesByChatId, deleteConfigFile, deleteConfigImage, deleteLogSessionData, getAiChatHistory, getChatData, getChatImagesBatch, getChatImagesMetadataBatch, getChatIndex, getComfyuiCache, getConfigAudio, getConfigFile, getConfigImage, getConfigText, getFullComfyuiCache, getFullSdCache, getLogIndex, getLogSessionData, migrateCacheToDatabase, migrateV1ToV2, saveChatData, saveChatImage, saveChatIndex, saveConfigAudio, saveConfigFile, saveConfigImage, saveConfigText, saveFullComfyuiCache, saveFullSdCache, saveLogIndex, saveLogSessionData };
