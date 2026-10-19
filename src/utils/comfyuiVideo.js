// 还原自打包产物 — 原始模块: utils/comfyuiVideo.js
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { runninghubDefaultJson } from "./settings/workers.js";
import { extensionName } from "./config.js";
import { acquireComfyUILock, addLog, cancelComfyUILock, clearLog, prepareImageForUpload, releaseComfyUILock, sleep, stripChineseAnnotations } from "./utils.js";
import { getComfyuiCache, getConfigFile, getConfigImage } from "./configDatabase.js";
import { TaskStatus, TaskType, taskQueue } from "./taskQueue.js";
import { getItemBlob, getItemImg } from "./database.js";
import { detectMultiGpu, fetchHistory, interruptAll } from "./comfyuiAdapter.js";
import { buildGenParams } from "./genParams.js";
import { processSkippedNodes } from "./settings/worker.js";
import { recordImageGeneration } from "./imageGenStats.js";

var UPLOAD_CACHE_EXPIRY_MS2, activeComfyUIVideoTasks, generateComfyUIVideo, handleComfyUIVideoCancel, runninghubVideo_exports;

UPLOAD_CACHE_EXPIRY_MS2 = 24 * 60 * 60 * 1e3;

activeComfyUIVideoTasks = /* @__PURE__ */ new Map();

handleComfyUIVideoCancel = ({ taskId } = {}) => {
      if (taskId && activeComfyUIVideoTasks.has(taskId)) {
        abortComfyUIVideoTask(taskId);
      }
    };

if (typeof eventSource !== "undefined" && eventSource?.on) {
      eventSource.on("st_chatu8_cancel_task", handleComfyUIVideoCancel);
      eventSource.on("st_chatu8_cancel_comfyui_task", handleComfyUIVideoCancel);
    }

generateComfyUIVideo = generateComfyUIRefVideo;




function registerActiveComfyUIVideoTask(taskId, context) {
  if (!taskId) return;
  activeComfyUIVideoTasks.set(taskId, context);
}

function unregisterActiveComfyUIVideoTask(taskId) {
  if (!taskId) return;
  activeComfyUIVideoTasks.delete(taskId);
}

async function abortComfyUIVideoTask(taskId) {
  cancelComfyUILock(taskId);
  const taskCtx = activeComfyUIVideoTasks.get(taskId);
  if (!taskCtx) return;
  console.log(`[ComfyUIVideo] \u89E6\u53D1\u4EFB\u52A1\u4E2D\u65AD: ${taskId}`);
  if (taskCtx.abortController && !taskCtx.abortController.signal.aborted) {
    try {
      taskCtx.abortController.abort();
    } catch (e) {
      console.warn("[ComfyUIVideo] abortController.abort \u5931\u8D25:", e);
    }
  }
  if (taskCtx.promptId && taskCtx.url) {
    fetch(`${taskCtx.url}/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete: [taskCtx.promptId] })
    }).catch(() => {
    });
  }
  if (taskCtx.url) {
    try {
      await interruptAll(taskCtx.url);
      console.log("[ComfyUIVideo] \u5DF2\u5411 ComfyUI \u53D1\u9001\u4E2D\u65AD\u8BF7\u6C42");
    } catch (e) {
      console.warn("[ComfyUIVideo] \u53D1\u9001\u4E2D\u65AD\u8BF7\u6C42\u5931\u8D25:", e);
    }
  }
  activeComfyUIVideoTasks.delete(taskId);
}

function formatComfyUIApiError(errorObj, defaultMsg = "ComfyUI \u8BF7\u6C42\u5931\u8D25") {
  if (!errorObj) return defaultMsg;
  if (typeof errorObj === "string") {
    try {
      errorObj = JSON.parse(errorObj);
    } catch (_) {
      return errorObj;
    }
  }
  if (typeof errorObj !== "object") return String(errorObj);
  if (errorObj.error) {
    const err = errorObj.error;
    const errType = err.type || "";
    const errMsg = err.message || err.details || "";
    const nodeErrors = errorObj.node_errors;
    let nodeErrSummary = "";
    if (nodeErrors && typeof nodeErrors === "object") {
      const parts = [];
      for (const [nodeId, nErr] of Object.entries(nodeErrors)) {
        const nodeType = nErr.class_type || "";
        const nodeMessages = Array.isArray(nErr.errors) ? nErr.errors.map((e) => e.message || e.details).filter(Boolean).join("; ") : "";
        parts.push(`\u8282\u70B9 #${nodeId}${nodeType ? ` (${nodeType})` : ""}: ${nodeMessages || "\u53C2\u6570\u65E0\u6548"}`);
      }
      if (parts.length > 0) {
        nodeErrSummary = `
\u3010\u8282\u70B9\u8BE6\u60C5\u3011${parts.join(" | ")}`;
      }
    }
    return `ComfyUI \u6821\u9A8C\u5931\u8D25 [${errType || "Prompt Error"}]: ${errMsg}${nodeErrSummary}`;
  }
  if (errorObj.messages && Array.isArray(errorObj.messages)) {
    for (const msgItem of errorObj.messages) {
      if (Array.isArray(msgItem) && msgItem[0] === "execution_error") {
        const info = msgItem[1] || {};
        const nodeId = info.node_id ? `\u8282\u70B9 #${info.node_id}` : "";
        const nodeType = info.node_type ? ` [${info.node_type}]` : "";
        const exType = info.exception_type ? ` (${info.exception_type})` : "";
        const exMsg = info.exception_message || "";
        return `ComfyUI \u8282\u70B9\u6267\u884C\u51FA\u9519: ${nodeId}${nodeType}${exType} - ${exMsg}`.trim();
      }
    }
  }
  if (errorObj.status_str === "error" && errorObj.exception_message) {
    return `ComfyUI \u4EFB\u52A1\u6267\u884C\u51FA\u9519: ${errorObj.exception_message}`;
  }
  return errorObj.message || errorObj.errorMessage || defaultMsg;
}

function extractJsonBlock2(text) {
  if (!text) return null;
  const startIdx = text.indexOf("{");
  if (startIdx === -1) return null;
  let depth = 0;
  let inString = false;
  let escape2 = false;
  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];
    if (escape2) {
      escape2 = false;
      continue;
    }
    if (char === "\\") {
      escape2 = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth === 0) {
          return {
            jsonStr: text.substring(startIdx, i + 1),
            start: startIdx,
            end: i + 1
          };
        }
      }
    }
  }
  return null;
}

function isAssetManifestPrompt2(text) {
  if (!text || typeof text !== "string") return false;
  let normalized = text.trim();
  if (normalized.includes("\\n") || normalized.includes("\\r")) {
    normalized = normalized.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
  }
  return /^\s*asset_manifest\s*:/im.test(normalized) || /asset_manifest\s*:\s*\{/i.test(normalized);
}

function isValidMediaFileId2(fileId) {
  if (fileId === null || fileId === void 0) return false;
  if (typeof fileId !== "string") return false;
  const trimmed = fileId.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "none" || lower === "nil" || lower === "false") return false;
  return true;
}

function parseAssetManifest2(rawPrompt) {
  if (!rawPrompt || typeof rawPrompt !== "string") {
    return { manifest: null, promptText: "", pictures: {}, audios: {}, invalidPictures: [], invalidAudios: [] };
  }
  let normalized = rawPrompt.trim();
  if (normalized.includes("\\n") || normalized.includes("\\r")) {
    normalized = normalized.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
  }
  let searchContent = normalized;
  const manifestHeaderMatch = normalized.match(/asset_manifest\s*:/i);
  let afterHeaderIndex = 0;
  if (manifestHeaderMatch && typeof manifestHeaderMatch.index === "number") {
    afterHeaderIndex = manifestHeaderMatch.index + manifestHeaderMatch[0].length;
    searchContent = normalized.substring(afterHeaderIndex);
  }
  const jsonBlock = extractJsonBlock2(searchContent);
  let manifest = null;
  let remainingText = normalized;
  if (jsonBlock) {
    try {
      manifest = JSON.parse(jsonBlock.jsonStr);
    } catch (firstErr) {
      try {
        const cleanedJson = jsonBlock.jsonStr.replace(/\\n/g, "\n").replace(/\\r/g, "\n").replace(/,\s*([\]}])/g, "$1");
        manifest = JSON.parse(cleanedJson);
      } catch (secondErr) {
        console.error("[ComfyUIVideo] asset_manifest JSON \u89E3\u6790\u5931\u8D25:", firstErr, jsonBlock.jsonStr);
        throw new Error(`asset_manifest JSON \u683C\u5F0F\u9519\u8BEF: ${firstErr.message}`);
      }
    }
    const rawJsonEndInFull = afterHeaderIndex + jsonBlock.end;
    let afterJson = normalized.substring(rawJsonEndInFull).trim();
    afterJson = afterJson.replace(/^```[a-zA-Z0-9_-]*\s*/, "").replace(/```$/g, "").trim();
    const subjectIdx = afterJson.search(/subject_definitions\s*:/i);
    if (subjectIdx !== -1) {
      remainingText = afterJson.substring(subjectIdx).trim();
    } else {
      remainingText = afterJson;
    }
  } else {
    const subjectIdx = normalized.search(/subject_definitions\s*:/i);
    if (subjectIdx !== -1) {
      remainingText = normalized.substring(subjectIdx).trim();
    }
  }
  if (remainingText) {
    remainingText = remainingText.replace(/《(Subject\s*\d+)》/gi, "<$1>").replace(/《(Picture\s*\d+)》/gi, "<$1>").replace(/《(Audio\s*\d+)》/gi, "<$1>");
  }
  const pictures = {};
  const audios = {};
  const invalidPictures = [];
  const invalidAudios = [];
  let isFirstFrameRef = false;
  let firstFramePicEntityRef = "";
  if (manifest) {
    if (Array.isArray(manifest.pictures)) {
      for (const pic of manifest.pictures) {
        const label = pic.label || "";
        const match = label.match(/Picture\s*(\d+)/i);
        if (match) {
          const idx = parseInt(match[1], 10);
          const entityRef = (pic.entity_ref || "").trim();
          const usage = String(pic.usage || "").trim();
          const entityType = String(pic.entity_type || "").trim();
          const isKeyframeFlag = pic.is_keyframe === true || String(pic.is_keyframe).trim().toLowerCase() === "true";
          const isFirstFrame = idx === 1 && (/首帧参考/i.test(entityRef) || entityRef === "\u9996\u5E27\u53C2\u8003\u56FE\u7247" || /keyframe(?:\s+completion)?/i.test(usage) || /keyframe/i.test(entityType) || isKeyframeFlag || /keyframe/i.test(entityRef));
          if (isFirstFrame) {
            isFirstFrameRef = true;
            firstFramePicEntityRef = entityRef || "\u9996\u5E27\u53C2\u8003\u56FE\u7247";
          }
          if (isValidMediaFileId2(pic.file_id)) {
            if (idx >= 1 && idx <= 9) {
              pictures[idx] = pic.file_id.trim();
            }
          } else {
            if (isFirstFrame) {
            } else {
              invalidPictures.push(idx);
            }
          }
        }
      }
    }
    if (Array.isArray(manifest.audios)) {
      for (const aud of manifest.audios) {
        const label = aud.label || "";
        const match = label.match(/Audio\s*(\d+)/i);
        if (match) {
          const idx = parseInt(match[1], 10);
          if (isValidMediaFileId2(aud.file_id)) {
            if (idx >= 1 && idx <= 3) {
              audios[idx] = aud.file_id.trim();
            }
          } else {
            invalidAudios.push(idx);
          }
        }
      }
    }
  }
  if (remainingText) {
    for (const idx of invalidAudios) {
      remainingText = remainingText.replace(new RegExp(`(?:voice_anchor|audio_anchor|voice|audio)\\s*[:\uFF1A]\\s*[<\u300A]Audio\\s*${idx}[>\u300B]`, "gi"), "").replace(new RegExp(`[<\u300A]Audio\\s*${idx}[>\u300B]`, "gi"), "");
    }
    for (const idx of invalidPictures) {
      remainingText = remainingText.replace(new RegExp(`(?:visual_anchor|image_anchor|picture_anchor)\\s*[:\uFF1A]\\s*[<\u300A]Picture\\s*${idx}[>\u300B]`, "gi"), "").replace(new RegExp(`[<\u300A]Picture\\s*${idx}[>\u300B]`, "gi"), "");
    }
  }
  return {
    manifest,
    promptText: remainingText || normalized,
    pictures,
    audios,
    invalidPictures,
    invalidAudios,
    isFirstFrameRef,
    firstFramePicEntityRef
  };
}

async function dataToBlob2(data, defaultMime = "image/png") {
  if (data instanceof Blob) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: defaultMime });
  }
  if (typeof data === "string") {
    if (data.startsWith("data:")) {
      const commaIdx = data.indexOf(",");
      const mime = data.substring(5, data.indexOf(";")) || defaultMime;
      const b64 = data.substring(commaIdx + 1);
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    }
  }
  throw new Error("\u65E0\u6CD5\u8BC6\u522B\u7684\u6587\u4EF6\u6570\u636E\u683C\u5F0F");
}

function createBlankPngBlob2(width = 512, height = 512, color = "#000000") {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
      }
      canvas.toBlob((blob) => {
        resolve(blob || new Blob([], { type: "image/png" }));
      }, "image/png");
    } catch (e) {
      console.error("[ComfyUIVideo] \u521B\u5EFA\u7A7A\u767D Canvas \u5931\u8D25\uFF0C\u4F7F\u7528\u7EAF\u6587\u672C Blob \u515C\u5E95:", e);
      resolve(new Blob([], { type: "image/png" }));
    }
  });
}

async function uploadBlankPngToComfyUIWithCache(comfyuiUrl) {
  const fileId = "__st_blank_placeholder_png__";
  const settings3 = extension_settings[extensionName];
  if (!settings3.comfyui_upload_cache) {
    settings3.comfyui_upload_cache = {};
  }
  const cache = settings3.comfyui_upload_cache;
  const now = Date.now();
  if (cache[fileId] && cache[fileId].fileName) {
    const cachedItem = cache[fileId];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS2) {
      addLog(`[ComfyUIVideo] \u547D\u4E2D\u7A7A\u767D\u515C\u5E95\u56FE\u4E0A\u4F20\u7F13\u5B58: ${cachedItem.fileName}`);
      return cachedItem.fileName;
    }
  }
  addLog("[ComfyUIVideo] \u6B63\u5728\u751F\u6210 512x512 \u7A7A\u767D PNG \u515C\u5E95\u56FE\u5E76\u4E0A\u4F20\u81F3 ComfyUI...");
  const blankBlob = await createBlankPngBlob2(512, 512, "#000000");
  const fileName = "blank_placeholder.png";
  const formData = new FormData();
  formData.append("image", blankBlob, fileName);
  formData.append("overwrite", "true");
  const res = await fetch(`${comfyuiUrl}/upload/image`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ComfyUI \u7A7A\u767D\u515C\u5E95\u56FE\u4E0A\u4F20\u5931\u8D25: ${errText}`);
  }
  const resData = await res.json();
  const uploadedFileName = resData.name;
  addLog(`[ComfyUIVideo] \u7A7A\u767D\u515C\u5E95\u56FE\u4E0A\u4F20\u6210\u529F: ${uploadedFileName}`);
  cache[fileId] = {
    fileName: uploadedFileName,
    timestamp: now
  };
  saveSettingsDebounced();
  return uploadedFileName;
}

function createSilentWavBlob2(durationSeconds = 1, sampleRate = 16e3) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  return new Blob([buffer], { type: "audio/wav" });
}

async function uploadBlankAudioToComfyUIWithCache(comfyuiUrl) {
  const fileId = "__st_blank_placeholder_aud__";
  const settings3 = extension_settings[extensionName];
  if (!settings3.comfyui_upload_cache) {
    settings3.comfyui_upload_cache = {};
  }
  const cache = settings3.comfyui_upload_cache;
  const now = Date.now();
  if (cache[fileId] && cache[fileId].fileName) {
    const cachedItem = cache[fileId];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS2) {
      addLog(`[ComfyUIVideo] \u547D\u4E2D\u7A7A\u767D\u515C\u5E95\u97F3\u9891\u4E0A\u4F20\u7F13\u5B58: ${cachedItem.fileName}`);
      return cachedItem.fileName;
    }
  }
  addLog("[ComfyUIVideo] \u6B63\u5728\u751F\u6210 1\u79D2\u9759\u97F3 WAV \u515C\u5E95\u97F3\u9891\u5E76\u4E0A\u4F20\u81F3 ComfyUI...");
  const blankBlob = createSilentWavBlob2(1, 16e3);
  const fileName = "blank_placeholder.wav";
  const formData = new FormData();
  formData.append("image", blankBlob, fileName);
  formData.append("overwrite", "true");
  const res = await fetch(`${comfyuiUrl}/upload/image`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ComfyUI \u7A7A\u767D\u515C\u5E95\u97F3\u9891\u4E0A\u4F20\u5931\u8D25: ${errText}`);
  }
  const resData = await res.json();
  const uploadedFileName = resData.name;
  addLog(`[ComfyUIVideo] \u7A7A\u767D\u515C\u5E95\u97F3\u9891\u4E0A\u4F20\u6210\u529F: ${uploadedFileName}`);
  cache[fileId] = {
    fileName: uploadedFileName,
    timestamp: now
  };
  saveSettingsDebounced();
  return uploadedFileName;
}

async function uploadImageBlobToComfyUIWithCache(imageSource, cacheKey, comfyuiUrl) {
  if (!imageSource) return null;
  const settings3 = extension_settings[extensionName];
  if (!settings3.comfyui_upload_cache) {
    settings3.comfyui_upload_cache = {};
  }
  const cache = settings3.comfyui_upload_cache;
  const now = Date.now();
  const fullCacheKey = `rawimg_${cacheKey}`;
  if (cache[fullCacheKey] && cache[fullCacheKey].fileName) {
    const cachedItem = cache[fullCacheKey];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS2) {
      addLog(`[ComfyUIVideo] \u547D\u4E2D\u9996\u5E27\u53C2\u8003\u56FE\u4E0A\u4F20\u7F13\u5B58: ${cachedItem.fileName}`);
      return cachedItem.fileName;
    }
  }
  const processed = await prepareImageForUpload(imageSource, {
    fallbackFileName: `first_frame_${Date.now()}.jpg`
  });
  const fileBlob = processed.blob;
  const fileName = processed.fileName;
  addLog(`[ComfyUIVideo] \u6B63\u5728\u4E0A\u4F20\u9996\u5E27\u53C2\u8003\u56FE\u7247\u5230 ComfyUI (${fileName}, ${(fileBlob.size / 1024).toFixed(1)} KB)...`);
  const formData = new FormData();
  formData.append("image", fileBlob, fileName);
  formData.append("overwrite", "true");
  const res = await fetch(`${comfyuiUrl}/upload/image`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ComfyUI \u9996\u5E27\u53C2\u8003\u56FE\u7247\u4E0A\u4F20\u5931\u8D25: ${errText}`);
  }
  const resData = await res.json();
  const uploadedFileName = resData.name;
  addLog(`[ComfyUIVideo] \u9996\u5E27\u53C2\u8003\u56FE\u7247\u4E0A\u4F20\u6210\u529F: ${uploadedFileName}`);
  cache[fullCacheKey] = {
    fileName: uploadedFileName,
    timestamp: now
  };
  saveSettingsDebounced();
  return uploadedFileName;
}

async function uploadMediaToComfyUIWithCache(fileId, kind, comfyuiUrl) {
  if (!fileId) return null;
  const settings3 = extension_settings[extensionName];
  if (!settings3.comfyui_upload_cache) {
    settings3.comfyui_upload_cache = {};
  }
  const cache = settings3.comfyui_upload_cache;
  const now = Date.now();
  let cacheChanged = false;
  for (const [key, item] of Object.entries(cache)) {
    if (item && item.timestamp && now - item.timestamp > UPLOAD_CACHE_EXPIRY_MS2) {
      delete cache[key];
      cacheChanged = true;
    }
  }
  if (cache[fileId] && cache[fileId].fileName) {
    const cachedItem = cache[fileId];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS2) {
      addLog(`[ComfyUIVideo] \u547D\u4E2D 24 \u5C0F\u65F6\u4E0A\u4F20\u7F13\u5B58: ${fileId} -> ${cachedItem.fileName}`);
      if (cacheChanged) saveSettingsDebounced();
      return cachedItem.fileName;
    }
  }
  addLog(`[ComfyUIVideo] \u672A\u547D\u4E2D\u7F13\u5B58\u6216\u5DF2\u8FC7\u671F\uFF0C\u4ECE\u672C\u5730\u8BFB\u53D6\u6587\u4EF6: ${fileId}`);
  let fileBlob = null;
  let fileName = `${fileId}.${kind === "aud" ? "mp3" : "png"}`;
  try {
    const configFile = await getConfigFile(fileId);
    if (configFile && configFile.data) {
      fileBlob = await dataToBlob2(configFile.data, configFile.mimeType || (kind === "aud" ? "audio/mpeg" : "image/png"));
      if (configFile.fileName) fileName = configFile.fileName;
    }
  } catch (e) {
    try {
      const base64Img = await getConfigImage(fileId);
      if (base64Img) {
        fileBlob = await dataToBlob2(base64Img, kind === "aud" ? "audio/mpeg" : "image/png");
      }
    } catch (e2) {
      console.error("[ComfyUIVideo] \u8BFB\u53D6\u914D\u7F6E\u6587\u4EF6\u5931\u8D25:", fileId, e, e2);
    }
  }
  if (!fileBlob) {
    throw new Error(`\u627E\u4E0D\u5230\u672C\u5730\u5A92\u4F53\u6587\u4EF6\u6216\u5DF2\u4E22\u5931: ${fileId}`);
  }
  if (kind === "img") {
    try {
      const processed = await prepareImageForUpload(fileBlob, {
        fallbackFileName: fileName.replace(/\.[^/.]+$/, "") + ".jpg"
      });
      fileBlob = processed.blob;
      fileName = processed.fileName;
    } catch (procErr) {
      console.warn("[ComfyUIVideo] \u56FE\u7247\u7D20\u6750\u9884\u5904\u7406\u5931\u8D25\uFF0C\u4F7F\u7528\u539F\u59CB\u6587\u4EF6:", procErr);
    }
  }
  addLog(`[ComfyUIVideo] \u6B63\u5728\u4E0A\u4F20\u5A92\u4F53\u6587\u4EF6\u5230 ComfyUI (${fileName}, ${(fileBlob.size / 1024).toFixed(1)} KB)...`);
  const formData = new FormData();
  formData.append("image", fileBlob, fileName);
  formData.append("overwrite", "true");
  const res = await fetch(`${comfyuiUrl}/upload/image`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ComfyUI \u6587\u4EF6\u4E0A\u4F20\u5931\u8D25: ${errText}`);
  }
  const resData = await res.json();
  const uploadedFileName = resData.name;
  addLog(`[ComfyUIVideo] \u4E0A\u4F20\u6210\u529F: ${fileId} -> ${uploadedFileName}`);
  cache[fileId] = {
    fileName: uploadedFileName,
    timestamp: now
  };
  saveSettingsDebounced();
  return uploadedFileName;
}

function buildComfyUIRefVideoWorkflow(rawJson, promptText, uploadedImages, uploadedAudios, genSettings) {
  let jsonStr = rawJson;
  let seed = parseInt(genSettings.seed);
  if (isNaN(seed) || seed === -1) {
    seed = Math.floor(Math.random() * 9007199254740991);
  }
  jsonStr = jsonStr.replace(/"%种子%"/g, seed).replace(/"%seed%"/g, seed);
  jsonStr = jsonStr.replace(/"%步数%"/g, genSettings.steps || "20").replace(/%步数%/g, genSettings.steps || "20");
  jsonStr = jsonStr.replace(/"%视频步数%"/g, genSettings.steps || "20").replace(/%视频步数%/g, genSettings.steps || "20");
  let megapixels = parseFloat(genSettings.megapixels) || 0.9;
  jsonStr = jsonStr.replace(/"%像素%"/g, megapixels).replace(/"%megapixels%"/g, megapixels);
  jsonStr = jsonStr.replace(/"%视频秒数%"/g, genSettings.duration || "4").replace(/"%duration%"/g, genSettings.duration || "4");
  const modelName = genSettings.modelName || "";
  jsonStr = jsonStr.replace(/"%MODEL_NAME%"/g, JSON.stringify(modelName));
  let escapedPrompt = (promptText || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "");
  jsonStr = jsonStr.replace(/%提示词%/g, escapedPrompt);
  jsonStr = jsonStr.replace(/%prompt%/g, escapedPrompt);
  jsonStr = jsonStr.replace(/%正面提示词%/g, escapedPrompt);
  const fallbackImgName = (genSettings.defaultImg || "").trim() || genSettings.blankImg || uploadedImages[1] || "";
  const fallbackAudName = (genSettings.defaultAud || "").trim() || genSettings.blankAud || uploadedAudios[1] || "";
  for (let i = 1; i <= 9; i++) {
    const isEnabled = Boolean(uploadedImages[i]);
    const switchVal = isEnabled ? 1 : 2;
    const imgName = uploadedImages[i] || fallbackImgName;
    jsonStr = jsonStr.replace(new RegExp(`"%\u56FE\u7247${i}\u63A7\u5236%"`, "g"), switchVal);
    jsonStr = jsonStr.replace(new RegExp(`%\u56FE\u7247${i}%`, "g"), imgName);
  }
  for (let i = 1; i <= 3; i++) {
    const isEnabled = Boolean(uploadedAudios[i]);
    const switchVal = isEnabled ? 1 : 2;
    const audName = uploadedAudios[i] || fallbackAudName;
    jsonStr = jsonStr.replace(new RegExp(`"%\u97F3\u9891${i}\u63A7\u5236%"`, "g"), switchVal);
    jsonStr = jsonStr.replace(new RegExp(`%\u97F3\u9891${i}%`, "g"), audName);
  }
  if (uploadedImages[1]) {
    jsonStr = jsonStr.replace(/"%comfyuicankaotupian%"/g, JSON.stringify(uploadedImages[1]));
  }
  let promptObj;
  try {
    promptObj = JSON.parse(jsonStr);
  } catch (err) {
    console.error("[ComfyUIVideo] \u5DE5\u4F5C\u6D41 JSON \u89E3\u6790\u5931\u8D25:", jsonStr);
    throw new Error("ComfyUI \u89C6\u9891\u5DE5\u4F5C\u6D41 JSON \u6784\u5EFA\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6A21\u677F\u683C\u5F0F");
  }
  let rawTplObj = {};
  try {
    rawTplObj = JSON.parse(rawJson);
  } catch (e) {
  }
  for (let i = 1; i <= 9; i++) {
    const isEnabled = Boolean(uploadedImages[i]);
    const nodeMode = isEnabled ? 0 : 4;
    for (const [nodeId, rawNode] of Object.entries(rawTplObj)) {
      const rawNodeStr = JSON.stringify(rawNode);
      if (rawNodeStr.includes(`%\u56FE\u7247${i}%`) || rawNodeStr.includes(`%\u56FE\u7247${i}\u63A7\u5236%`)) {
        if (promptObj[nodeId]) {
          promptObj[nodeId].mode = nodeMode;
        }
      }
    }
  }
  for (let i = 1; i <= 3; i++) {
    const isEnabled = Boolean(uploadedAudios[i]);
    const nodeMode = isEnabled ? 0 : 4;
    for (const [nodeId, rawNode] of Object.entries(rawTplObj)) {
      const rawNodeStr = JSON.stringify(rawNode);
      if (rawNodeStr.includes(`%\u97F3\u9891${i}%`) || rawNodeStr.includes(`%\u97F3\u9891${i}\u63A7\u5236%`)) {
        if (promptObj[nodeId]) {
          promptObj[nodeId].mode = nodeMode;
        }
      }
    }
  }
  return { promptObj, seedUsed: seed };
}

async function generateComfyUIRefVideo({ prompt: rawPrompt, width: Xwidth, height: Xheight, change }) {
  clearLog();
  const targetPrompt = change || rawPrompt || "";
  addLog("[ComfyUIVideo] \u5F00\u59CB\u89E3\u6790 asset_manifest \u63D0\u793A\u8BCD...");
  const { manifest, promptText, pictures, audios, invalidPictures, invalidAudios, isFirstFrameRef } = parseAssetManifest2(targetPrompt);
  const hasExtraRefImages = Object.keys(pictures).some((k) => String(k) !== "1");
  const isImg2Vid = isFirstFrameRef && !hasExtraRefImages;
  const taskType = isImg2Vid ? TaskType.COMFYUI_IMG2VID : TaskType.COMFYUI_REF2VID;
  const taskTypeName = isImg2Vid ? "ComfyUI \u56FE\u751F\u89C6\u9891" : "ComfyUI \u53C2\u8003\u751F\u89C6\u9891";
  const taskId = taskQueue.addTask({
    name: (targetPrompt || "").substring(0, 30) + (targetPrompt.length > 30 ? "..." : ""),
    type: taskType,
    prompt: targetPrompt
  });
  taskQueue.updateStatus(taskId, TaskStatus.RUNNING);
  const startTime = Date.now();
  toastr.info(`\u{1F3AC} \u5DF2\u53D1\u8D77 ${taskTypeName} \u8BF7\u6C42...`);
  const settings3 = extension_settings[extensionName];
  const url = (settings3.comfyuiUrl || "http://localhost:8188").trim();
  const abortController = new AbortController();
  registerActiveComfyUIVideoTask(taskId, { abortController, url, promptId: null });
  let lockAcquired = false;
  try {
    if (!url) {
      throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 ComfyUI API \u5730\u5740");
    }
    if (invalidPictures && invalidPictures.length > 0) {
      addLog(`[ComfyUIVideo] \u5FFD\u7565\u672A\u7ED1\u5B9A\u6216\u7A7A\u6587\u4EF6\u56FE\u7247\u8D44\u4EA7: ${invalidPictures.map((i) => `Picture ${i}`).join(", ")}`);
    }
    if (invalidAudios && invalidAudios.length > 0) {
      addLog(`[ComfyUIVideo] \u5FFD\u7565\u672A\u7ED1\u5B9A\u6216\u7A7A\u6587\u4EF6\u97F3\u9891\u8D44\u4EA7: ${invalidAudios.map((i) => `Audio ${i}`).join(", ")}`);
    }
    const picKeys = Object.keys(pictures);
    const audKeys = Object.keys(audios);
    addLog(`[ComfyUIVideo] \u89E3\u6790\u5B8C\u6210: \u5305\u542B ${picKeys.length} \u4E2A\u6709\u6548\u56FE\u7247\u53C2\u8003 (${picKeys.map((k) => `Picture ${k}`).join(", ") || "\u65E0"}), ${audKeys.length} \u4E2A\u6709\u6548\u97F3\u9891\u53C2\u8003 (${audKeys.map((k) => `Audio ${k}`).join(", ") || "\u65E0"})`);
    const uploadedImages = {};
    for (const [idx, fileId] of Object.entries(pictures)) {
      addLog(`[ComfyUIVideo] \u5904\u7406 Picture ${idx} (file_id: ${fileId})...`);
      const uploadedName = await uploadMediaToComfyUIWithCache(fileId, "img", url);
      if (uploadedName) {
        uploadedImages[idx] = uploadedName;
      }
    }
    if (isFirstFrameRef) {
      addLog("[ComfyUIVideo] \u68C0\u6D4B\u5230\u9996\u5E27\u53C2\u8003\u56FE\u7247\u9700\u6C42\uFF0C\u6B63\u5728\u63D0\u53D6\u89E6\u53D1\u5904\u56FE\u7247...");
      let triggerImageSource = null;
      const promptTag = rawPrompt || "";
      if (promptTag) {
        try {
          triggerImageSource = await getItemBlob(promptTag);
        } catch (e) {
          console.warn("[ComfyUIVideo] getItemBlob \u83B7\u53D6\u5931\u8D25\uFF0C\u5C1D\u8BD5 getItemImg:", e);
        }
        if (!triggerImageSource) {
          try {
            const [imgData] = await getItemImg(promptTag);
            if (imgData) {
              triggerImageSource = imgData;
            }
          } catch (e2) {
            console.warn("[ComfyUIVideo] getItemImg \u83B7\u53D6\u5931\u8D25:", e2);
          }
        }
      }
      if (triggerImageSource) {
        const cacheKey = typeof CryptoJS !== "undefined" && CryptoJS.MD5 ? CryptoJS.MD5(promptTag || String(Date.now())).toString() : (promptTag || String(Date.now())).replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 32);
        const uploadedFirstFrame = await uploadImageBlobToComfyUIWithCache(triggerImageSource, cacheKey, url);
        if (uploadedFirstFrame) {
          uploadedImages[1] = uploadedFirstFrame;
          addLog(`[ComfyUIVideo] \u6210\u529F\u7ED1\u5B9A\u89E6\u53D1\u5904\u56FE\u7247\u4E3A Picture 1 -> ${uploadedFirstFrame}`);
        }
      } else {
        addLog("[ComfyUIVideo] \u672A\u627E\u5230\u89E6\u53D1\u5904\u5DF2\u6709\u56FE\u7247\uFF0C\u5C06\u5C1D\u8BD5\u4F7F\u7528\u9884\u8BBE\u8D44\u4EA7\u6216\u7A7A\u767D\u515C\u5E95...");
      }
    }
    const uploadedAudios = {};
    for (const [idx, fileId] of Object.entries(audios)) {
      addLog(`[ComfyUIVideo] \u5904\u7406 Audio ${idx} (file_id: ${fileId})...`);
      const uploadedName = await uploadMediaToComfyUIWithCache(fileId, "aud", url);
      if (uploadedName) {
        uploadedAudios[idx] = uploadedName;
      }
    }
    if (Object.keys(uploadedImages).length === 0) {
      addLog("[ComfyUIVideo] \u68C0\u6D4B\u5230\u65E0\u56FE\u7247\u53C2\u8003\u8D44\u4EA7\uFF0C\u6B63\u5728\u751F\u6210\u7A7A\u767D PNG \u4F5C\u4E3A\u7B2C\u4E00\u5F20\u56FE\u7247 (Picture 1) \u515C\u5E95...");
      const blankFileName = await uploadBlankPngToComfyUIWithCache(url);
      if (blankFileName) {
        uploadedImages[1] = blankFileName;
        addLog(`[ComfyUIVideo] \u7A7A\u767D\u56FE\u7247\u515C\u5E95\u5DF2\u5C31\u7EEA: Picture 1 -> ${blankFileName}`);
      }
    }
    if (Object.keys(uploadedAudios).length === 0) {
      addLog("[ComfyUIVideo] \u68C0\u6D4B\u5230\u65E0\u97F3\u9891\u53C2\u8003\u8D44\u4EA7\uFF0C\u6B63\u5728\u751F\u6210\u7A7A\u767D WAV \u4F5C\u4E3A\u7B2C\u4E00\u6BB5\u97F3\u9891 (Audio 1) \u515C\u5E95...");
      const blankAudFileName = await uploadBlankAudioToComfyUIWithCache(url);
      if (blankAudFileName) {
        uploadedAudios[1] = blankAudFileName;
        addLog(`[ComfyUIVideo] \u7A7A\u767D\u97F3\u9891\u515C\u5E95\u5DF2\u5C31\u7EEA: Audio 1 -> ${blankAudFileName}`);
      }
    }
    let blankImgPlaceholder = uploadedImages[1] || "";
    if (!blankImgPlaceholder) {
      blankImgPlaceholder = await uploadBlankPngToComfyUIWithCache(url);
    }
    let blankAudPlaceholder = uploadedAudios[1] || "";
    if (!blankAudPlaceholder) {
      blankAudPlaceholder = await uploadBlankAudioToComfyUIWithCache(url);
    }
    const workerCategoryName = isImg2Vid ? "\u56FE\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41" : "\u53C2\u8003\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41";
    const targetWorkerId = isImg2Vid ? settings3.comfyui_img2vid_workerid || "" : settings3.comfyui_ref2vid_workerid || "";
    let targetWorkerJson = targetWorkerId && settings3.comfyui_video_workers?.[targetWorkerId] || (isImg2Vid ? settings3.comfyui_img2vid_worker : settings3.comfyui_ref2vid_worker) || settings3.worker || runninghubDefaultJson;
    addLog(`[ComfyUIVideo] \u4F7F\u7528\u3010${workerCategoryName}\u3011\u9884\u8BBE: "${targetWorkerId || "\u9ED8\u8BA4"}"`);
    const genSettings = {
      seed: settings3.comfyui_val_seed,
      steps: settings3.comfyui_val_steps,
      megapixels: settings3.comfyui_val_megapixels,
      duration: settings3.comfyui_val_duration,
      defaultImg: settings3.comfyui_val_default_img,
      defaultAud: settings3.comfyui_val_default_aud,
      blankImg: blankImgPlaceholder,
      blankAud: blankAudPlaceholder,
      modelName: settings3.MODEL_NAME
    };
    const cleanPromptText = await stripChineseAnnotations(promptText);
    let { promptObj, seedUsed } = buildComfyUIRefVideoWorkflow(
      targetWorkerJson,
      cleanPromptText,
      uploadedImages,
      uploadedAudios,
      genSettings
    );
    const skippedCount = Object.values(promptObj).filter((n) => n && n._skip).length;
    if (skippedCount > 0) {
      addLog(`[ComfyUIVideo] \u68C0\u6D4B\u5230 ${skippedCount} \u4E2A\u8DF3\u8FC7\u7684\u8282\u70B9\uFF0C\u6B63\u5728\u5904\u7406\u8FDE\u63A5\u91CD\u6620\u5C04...`);
      const objectInfo = await getComfyuiCache("objectinfo") || {};
      promptObj = processSkippedNodes(promptObj, objectInfo);
    }
    const _comfy_gen_params = buildGenParams("ComfyUI-Video", {
      model: settings3.MODEL_NAME || "ComfyUI-Video",
      yushe: workerCategoryName,
      resolvedPrompt: cleanPromptText,
      seed: seedUsed,
      steps: settings3.comfyui_val_steps,
      duration: settings3.comfyui_val_duration
    });
    await acquireComfyUILock(taskId, abortController.signal);
    lockAcquired = true;
    taskQueue.updateStatus(taskId, "running");
    const clientId = "533ef3a3-39c0-4e39-9ced-37d290f371f8";
    const promptPayload = JSON.stringify({ client_id: clientId, prompt: promptObj });
    addLog(`[ComfyUIVideo] \u6B63\u5728\u5411 ComfyUI \u63D0\u4EA4\u4EFB\u52A1...`);
    const submitRes = await fetch(`${url}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: promptPayload,
      signal: abortController.signal
    });
    if (!submitRes.ok) {
      let errJson = null;
      try {
        errJson = await submitRes.json();
      } catch (_) {
      }
      const errText = errJson ? formatComfyUIApiError(errJson) : await submitRes.text();
      throw new Error(`ComfyUI \u63D0\u4EA4\u5931\u8D25 (${submitRes.status}): ${errText}`);
    }
    const submitData = await submitRes.json();
    const runPromptId = submitData.prompt_id;
    detectMultiGpu(url);
    const currentActiveCtx = activeComfyUIVideoTasks.get(taskId);
    if (currentActiveCtx) {
      currentActiveCtx.promptId = runPromptId;
    }
    addLog(`[ComfyUIVideo] \u4EFB\u52A1\u5DF2\u63D0\u4EA4\uFF0CPrompt ID: ${runPromptId}\uFF0C\u8FDB\u5165\u8F6E\u8BE2\u7B49\u5F85...`);
    let attempts = 0;
    let finalMediaData = null;
    let isVideo = true;
    let mediaFormat = "video/mp4";
    let outputUrl = null;
    while (true) {
      await sleep(1e3);
      if (!taskQueue.isTaskInQueue(taskId) || abortController.signal.aborted) {
        addLog("[ComfyUIVideo] \u4EFB\u52A1\u5DF2\u88AB\u53D6\u6D88\uFF0C\u53D1\u9001\u4E2D\u65AD\u8BF7\u6C42...");
        try {
          await interruptAll(url);
        } catch (e) {
        }
        throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
      }
      attempts++;
      if (attempts % 5 === 0) {
        addLog(`[ComfyUIVideo] \u4EFB\u52A1\u8FD0\u884C\u4E2D\uFF0C\u5DF2\u7B49\u5F85\u7EA6 ${attempts} \u79D2...`);
      }
      const histRes = await fetchHistory(url, runPromptId, { signal: abortController.signal });
      if (!histRes.ok) {
        addLog(`[ComfyUIVideo] \u8F6E\u8BE2\u5386\u53F2\u8BB0\u5F55\u5F02\u5E38: ${histRes.status}`);
        continue;
      }
      const histData = await histRes.json();
      if (histData.hasOwnProperty(runPromptId)) {
        const promptHistory = histData[runPromptId];
        if (promptHistory.status && promptHistory.status.status_str === "error") {
          const errMsg = formatComfyUIApiError(promptHistory.status, "ComfyUI \u4EFB\u52A1\u6267\u884C\u51FA\u9519");
          addLog(`[ComfyUIVideo \u9519\u8BEF] ${errMsg}`);
          throw new Error(errMsg);
        }
        const outputs = promptHistory.outputs || {};
        let foundFile = null;
        const isVideoExt = (fn) => typeof fn === "string" && /\.(mp4|webm|mkv|mov|avi)$/i.test(fn);
        for (const key in outputs) {
          const val = outputs[key];
          if (!val) continue;
          if (val.gifs && val.gifs.length > 0) {
            const gif = val.gifs[0];
            foundFile = {
              filename: gif.filename,
              subfolder: gif.subfolder || "",
              isVideo: gif.format ? gif.format.startsWith("video/") : true,
              format: gif.format || "video/mp4"
            };
            break;
          }
          if (val.images && val.images.length > 0) {
            const videoImg = val.images.find((img) => img.type === "output" && isVideoExt(img.filename));
            if (videoImg) {
              foundFile = {
                filename: videoImg.filename,
                subfolder: videoImg.subfolder || "",
                isVideo: true,
                format: videoImg.filename.endsWith(".webm") ? "video/webm" : "video/mp4"
              };
              break;
            }
          }
        }
        if (!foundFile) {
          for (const key in outputs) {
            const val = outputs[key];
            if (!val) continue;
            if (val.images && val.images.length > 0) {
              const outImg = val.images.find((img) => img.type === "output") || val.images[0];
              foundFile = {
                filename: outImg.filename,
                subfolder: outImg.subfolder || "",
                isVideo: false,
                format: "image/png"
              };
              break;
            }
          }
        }
        if (foundFile) {
          addLog(`[ComfyUIVideo] \u4EFB\u52A1\u5B8C\u6210\uFF0C\u6B63\u5728\u83B7\u53D6\u751F\u6210\u6587\u4EF6: ${foundFile.filename}...`);
          outputUrl = `${url}/view?filename=${encodeURIComponent(foundFile.filename)}&subfolder=${encodeURIComponent(foundFile.subfolder)}&type=output`;
          const viewRes = await fetch(outputUrl, { signal: abortController.signal });
          if (!viewRes.ok) {
            throw new Error(`\u83B7\u53D6\u6587\u4EF6\u5931\u8D25: ${viewRes.status}`);
          }
          let fileBlob = await viewRes.blob();
          isVideo = foundFile.isVideo;
          mediaFormat = foundFile.format;
          if (isVideo) {
            let correctedMime = "video/mp4";
            if (mediaFormat.includes("webm")) {
              correctedMime = "video/webm";
            } else if (mediaFormat.includes("mp4") || mediaFormat.includes("h264")) {
              correctedMime = "video/mp4";
            }
            mediaFormat = correctedMime;
            const arrBuf = await fileBlob.arrayBuffer();
            fileBlob = new Blob([arrBuf], { type: correctedMime });
          }
          finalMediaData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(fileBlob);
          });
          break;
        }
      }
      const timeoutMs = (parseInt(settings3.comfyui_timeout, 10) || 1800) * 1e3;
      const elapsed = Date.now() - startTime;
      if (elapsed > timeoutMs || attempts > Math.ceil(timeoutMs / 1e3)) {
        const minutes = Math.round(timeoutMs / 6e4);
        throw new Error(`ComfyUI \u89C6\u9891\u751F\u6210\u8D85\u65F6\uFF08\u5DF2\u8D85\u8FC7 ${minutes} \u5206\u949F\uFF09`);
      }
    }
    const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
    taskQueue.completeTask(taskId, true);
    toastr.success(`\u2705 ${taskTypeName}\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
    addLog(`[ComfyUIVideo] ${taskTypeName}\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
    recordImageGeneration("comfyui", true);
    return {
      mediaData: finalMediaData,
      isVideo,
      format: mediaFormat,
      originalUrl: outputUrl,
      genParams: _comfy_gen_params
    };
  } catch (err) {
    const isAborted = err.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88" || abortController.signal.aborted || !taskQueue.isTaskInQueue(taskId);
    const rawMessage = err instanceof Error ? err.message : String(err);
    if (isAborted) {
      taskQueue.cancelTask(taskId);
      addLog(`[ComfyUIVideo] \u4EFB\u52A1\u5DF2\u88AB\u7528\u6237\u53D6\u6D88: ${taskId}`);
      toastr.info(`\u5DF2\u53D6\u6D88 ${taskTypeName}`);
    } else {
      taskQueue.completeTask(taskId, false);
      recordImageGeneration("comfyui", false);
      addLog(`[ComfyUIVideo \u9519\u8BEF] ${rawMessage}`);
      console.error("[ComfyUIVideo \u9519\u8BEF]", err);
      toastr.error(`${taskTypeName}\u5931\u8D25: ${rawMessage}`);
    }
    throw err;
  } finally {
    unregisterActiveComfyUIVideoTask(taskId);
    if (lockAcquired) {
      releaseComfyUILock(taskId);
    }
  }
}

async function executeComfyUIVideoDirectTest({
  prompt: prompt2,
  workflowJson,
  uploadedImages = {},
  uploadedAudios = {},
  genSettings = {},
  comfyuiUrl,
  onStatusUpdate,
  abortSignal
}) {
  const notify = (msg, isError = false) => {
    addLog(`[ComfyUITest] ${msg}`);
    if (typeof onStatusUpdate === "function") {
      onStatusUpdate(msg, isError);
    }
  };
  const settings3 = extension_settings[extensionName] || {};
  const url = (comfyuiUrl || settings3.comfyuiUrl || "http://localhost:8188").trim();
  if (!url) {
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 ComfyUI API \u5730\u5740");
  }
  notify("\u6B63\u5728\u5904\u7406\u6D4B\u8BD5\u63D0\u793A\u8BCD\u4E0E\u53C2\u6570...");
  let targetPrompt = prompt2 || "";
  if (isAssetManifestPrompt2(targetPrompt)) {
    const parsed = parseAssetManifest2(targetPrompt);
    if (parsed && parsed.promptText) {
      targetPrompt = parsed.promptText;
    }
  }
  const cleanPrompt = await stripChineseAnnotations(targetPrompt);
  let { promptObj, seedUsed } = buildComfyUIRefVideoWorkflow(
    workflowJson,
    cleanPrompt,
    uploadedImages,
    uploadedAudios,
    genSettings
  );
  const skippedCount = Object.values(promptObj).filter((n) => n && n._skip).length;
  if (skippedCount > 0) {
    notify(`\u68C0\u6D4B\u5230 ${skippedCount} \u4E2A\u8DF3\u8FC7\u7684\u8282\u70B9\uFF0C\u6B63\u5728\u5904\u7406\u8FDE\u63A5\u91CD\u6620\u5C04...`);
    const objectInfo = await getComfyuiCache("objectinfo") || {};
    promptObj = processSkippedNodes(promptObj, objectInfo);
  }
  if (abortSignal?.aborted) throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
  notify(`\u6B63\u5728\u5411 ComfyUI \u63D0\u4EA4\u6D4B\u8BD5\u4EFB\u52A1 (\u79CD\u5B50: ${seedUsed})...`);
  const clientId = "533ef3a3-39c0-4e39-9ced-37d290f371f8";
  const promptPayload = JSON.stringify({ client_id: clientId, prompt: promptObj });
  const submitRes = await fetch(`${url}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: promptPayload,
    signal: abortSignal
  });
  if (!submitRes.ok) {
    let errJson = null;
    try {
      errJson = await submitRes.json();
    } catch (_) {
    }
    const errText = errJson ? formatComfyUIApiError(errJson) : await submitRes.text();
    throw new Error(`ComfyUI \u63D0\u4EA4\u5931\u8D25 (${submitRes.status}): ${errText}`);
  }
  const submitData = await submitRes.json();
  const runPromptId = submitData.prompt_id;
  detectMultiGpu(url);
  notify(`\u4EFB\u52A1\u5DF2\u6210\u529F\u63D0\u4EA4 (Prompt ID: ${runPromptId})\uFF0C\u6B63\u5728\u751F\u6210\u4E2D...`);
  let attempts = 0;
  let isVideo = true;
  let mediaFormat = "video/mp4";
  let outputUrl = null;
  let foundFileName = "";
  let consecutiveFetchErrors = 0;
  while (true) {
    if (abortSignal?.aborted) {
      try {
        await interruptAll(url);
      } catch (e) {
      }
      throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    await sleep(1e3);
    if (abortSignal?.aborted) {
      try {
        await interruptAll(url);
      } catch (e) {
      }
      throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    attempts++;
    if (attempts % 5 === 0) {
      notify(`ComfyUI \u89C6\u9891\u751F\u6210\u4E2D\uFF0C\u5DF2\u8017\u65F6\u7EA6 ${attempts} \u79D2...`);
    }
    let histRes;
    try {
      histRes = await fetchHistory(url, runPromptId, { signal: abortSignal });
      consecutiveFetchErrors = 0;
    } catch (fetchErr) {
      if (abortSignal?.aborted) throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
      consecutiveFetchErrors++;
      if (consecutiveFetchErrors > 15) {
        throw new Error(`\u65E0\u6CD5\u8FDE\u63A5\u5230 ComfyUI \u670D\u52A1\u6216\u8FDE\u63A5\u65AD\u5F00: ${fetchErr.message}`);
      }
      continue;
    }
    if (!histRes.ok) {
      continue;
    }
    const histData = await histRes.json();
    if (histData && histData.hasOwnProperty(runPromptId)) {
      const promptHistory = histData[runPromptId];
      if (promptHistory.status && promptHistory.status.status_str === "error") {
        const errMsg = formatComfyUIApiError(promptHistory.status, "ComfyUI \u4EFB\u52A1\u6267\u884C\u51FA\u9519");
        throw new Error(errMsg);
      }
      const outputs = promptHistory.outputs || {};
      let foundFile = null;
      const isVideoExt = (fn) => typeof fn === "string" && /\.(mp4|webm|mkv|mov|avi)$/i.test(fn);
      for (const key in outputs) {
        const val = outputs[key];
        if (!val) continue;
        if (val.gifs && val.gifs.length > 0) {
          const gif = val.gifs[0];
          foundFile = {
            filename: gif.filename,
            subfolder: gif.subfolder || "",
            isVideo: gif.format ? gif.format.startsWith("video/") : true,
            format: gif.format || "video/mp4"
          };
          break;
        }
        if (val.images && val.images.length > 0) {
          const videoImg = val.images.find((img) => img.type === "output" && isVideoExt(img.filename));
          if (videoImg) {
            foundFile = {
              filename: videoImg.filename,
              subfolder: videoImg.subfolder || "",
              isVideo: true,
              format: videoImg.filename.endsWith(".webm") ? "video/webm" : "video/mp4"
            };
            break;
          }
        }
      }
      if (!foundFile) {
        for (const key in outputs) {
          const val = outputs[key];
          if (!val) continue;
          if (val.images && val.images.length > 0) {
            const outImg = val.images.find((img) => img.type === "output") || val.images[0];
            foundFile = {
              filename: outImg.filename,
              subfolder: outImg.subfolder || "",
              isVideo: false,
              format: "image/png"
            };
            break;
          }
        }
      }
      if (foundFile) {
        foundFileName = foundFile.filename;
        notify(`\u751F\u6210\u5B8C\u6210\uFF0C\u6B63\u5728\u62C9\u53D6\u89C6\u9891\u6587\u4EF6: ${foundFile.filename}...`);
        outputUrl = `${url}/view?filename=${encodeURIComponent(foundFile.filename)}&subfolder=${encodeURIComponent(foundFile.subfolder)}&type=output`;
        const viewRes = await fetch(outputUrl, { signal: abortSignal });
        if (!viewRes.ok) {
          throw new Error(`\u83B7\u53D6\u6587\u4EF6\u5931\u8D25: ${viewRes.status}`);
        }
        let fileBlob = await viewRes.blob();
        isVideo = foundFile.isVideo;
        mediaFormat = foundFile.format;
        if (isVideo) {
          let correctedMime = "video/mp4";
          if (mediaFormat.includes("webm")) {
            correctedMime = "video/webm";
          } else if (mediaFormat.includes("mp4") || mediaFormat.includes("h264")) {
            correctedMime = "video/mp4";
          }
          mediaFormat = correctedMime;
          const arrBuf = await fileBlob.arrayBuffer();
          fileBlob = new Blob([arrBuf], { type: correctedMime });
        }
        const localBlobUrl = URL.createObjectURL(fileBlob);
        notify("\u89C6\u9891\u6570\u636E\u5DF2\u52A0\u8F7D\u5C31\u7EEA\uFF01");
        return {
          videoUrl: localBlobUrl,
          originalUrl: outputUrl,
          seedUsed,
          filename: foundFileName,
          format: mediaFormat,
          isVideo
        };
      }
    }
    if (attempts > 900) {
      throw new Error("ComfyUI \u89C6\u9891\u751F\u6210\u8D85\u65F6 (\u5DF2\u7B49\u5F8515\u5206\u949F)");
    }
  }
}

export { executeComfyUIVideoDirectTest, runninghubVideo_exports };
