// 还原自打包产物 — 原始模块: utils/runninghubVideo.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { runninghubDefaultJson } from "./settings/workers.js";
import { extensionName } from "./config.js";
import { addLog, clearLog, fixMp4Faststart, isPluginToastDisabled, prepareImageForUpload, sleep, stripChineseAnnotations } from "./utils.js";
import { getConfigFile, getConfigImage } from "./configDatabase.js";
import { TaskStatus, TaskType, taskQueue } from "./taskQueue.js";
import { getItemBlob, getItemImg } from "./database.js";
import { runningHubFetch, runningHubReadWithRetry } from "./runninghubScheduler.js";
import { buildGenParams } from "./genParams.js";
import { recordImageGeneration } from "./imageGenStats.js";
import { acquireRunningHubKey, getUsableRunningHubKeyForUpload, invalidateBalanceCache, parseRunningHubApiKeys, recordKeyConsumption } from "./runninghubKeyManager.js";
import { extractNodeInfoListFromWorkflow } from "./runninghub.js";

var UPLOAD_CACHE_EXPIRY_MS;

UPLOAD_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1e3;



async function resolveUploadApiKey(apiKey) {
  let key = apiKey;
  if (key) {
    const keys = parseRunningHubApiKeys(key);
    key = keys[0] || null;
  }
  if (!key) {
    key = await getUsableRunningHubKeyForUpload();
  }
  return key;
}

function formatRunningHubApiError(data, defaultMsg = "\u8BF7\u6C42 RunningHub \u5931\u8D25") {
  if (!data || typeof data !== "object") {
    return defaultMsg;
  }
  const errCode = data.errorCode || data.code;
  let errMsg = data.errorMessage || data.msg || defaultMsg;
  if (String(errCode) === "803" || /NODE_INFO_MISMATCH/i.test(errMsg)) {
    return `\u5DE5\u4F5C\u6D41\u8282\u70B9\u4E0D\u5339\u914D (\u9519\u8BEF\u7801: 803): ${errMsg}\u3002
\u3010\u6392\u67E5\u63D0\u793A\u3011\u5F53\u524D\u9884\u8BBE\u914D\u7F6E\u7684\u8986\u76D6\u8282\u70B9\u5728\u4E91\u7AEF\u5DE5\u4F5C\u6D41\u4E2D\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u4FEE\u6539\u3002\u8BF7\u68C0\u67E5\u5F53\u524D\u9884\u8BBE\u7ED1\u5B9A\u7684\u5DE5\u4F5C\u6D41 ID (${data._workflowId || "\u76EE\u6807\u5DE5\u4F5C\u6D41"}) \u4E0E\u5BF9\u5E94\u7684 ComfyUI \u5DE5\u4F5C\u6D41 JSON \u6A21\u677F\u4E2D\u7684\u8282\u70B9 ID \u662F\u5426\u4E00\u81F4\uFF01`;
  }
  if (errCode) {
    return `RunningHub \u62A5\u9519 [\u4EE3\u7801 ${errCode}]: ${errMsg}`;
  }
  return errMsg;
}

async function extractLargestMediaFromZip2(arrayBuffer) {
  addLog("[RunningHubRefVideo] \u5F00\u59CB\u89E3\u538B\u8F93\u51FA ZIP \u538B\u7F29\u5305...");
  const JSZipConstructor = window.stChatu8JSZip || window.JSZip;
  if (!JSZipConstructor || typeof JSZipConstructor.loadAsync !== "function") {
    throw new Error("JSZip \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u89E3\u538B ZIP \u6587\u4EF6");
  }
  const zip = await JSZipConstructor.loadAsync(arrayBuffer);
  const fileEntries = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      fileEntries.push(zipEntry);
    }
  });
  if (fileEntries.length === 0) {
    throw new Error("ZIP \u538B\u7F29\u5305\u5185\u672A\u627E\u5230\u4EFB\u4F55\u6709\u6548\u8F93\u51FA\u6587\u4EF6");
  }
  let largestEntry = null;
  let maxSizeBytes = -1;
  let largestBase64 = null;
  for (const entry of fileEntries) {
    try {
      const base64Data = await entry.async("base64");
      const approxSize = base64Data.length * 0.75;
      if (approxSize > maxSizeBytes) {
        maxSizeBytes = approxSize;
        largestEntry = entry;
        largestBase64 = base64Data;
      }
    } catch (e) {
      console.warn(`[RunningHubRefVideo] \u8BFB\u53D6 ZIP \u6587\u4EF6 ${entry.name} \u5931\u8D25:`, e);
    }
  }
  if (!largestEntry || !largestBase64) {
    throw new Error("\u672A\u80FD\u6210\u529F\u63D0\u53D6 ZIP \u4E2D\u7684\u6587\u4EF6\u6570\u636E");
  }
  const fileName = largestEntry.name.toLowerCase();
  let mimeType = "video/mp4";
  let isVideo = true;
  if (fileName.endsWith(".mp4")) {
    mimeType = "video/mp4";
    isVideo = true;
  } else if (fileName.endsWith(".webm")) {
    mimeType = "video/webm";
    isVideo = true;
  } else if (fileName.endsWith(".avi")) {
    mimeType = "video/avi";
    isVideo = true;
  } else if (fileName.endsWith(".mov")) {
    mimeType = "video/quicktime";
    isVideo = true;
  } else if (fileName.endsWith(".png")) {
    mimeType = "image/png";
    isVideo = false;
  } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    mimeType = "image/jpeg";
    isVideo = false;
  } else if (fileName.endsWith(".webp")) {
    mimeType = "image/webp";
    isVideo = false;
  }
  addLog(`[RunningHubRefVideo] \u63D0\u53D6\u4E3B\u6587\u4EF6: ${largestEntry.name} (${mimeType}, ${(maxSizeBytes / 1024 / 1024).toFixed(2)} MB)`);
  if (isVideo && mimeType === "video/mp4") {
    try {
      const u8 = await largestEntry.async("uint8array");
      const rawBlob = new Blob([u8], { type: "video/mp4" });
      const fixedBlob = await fixMp4Faststart(rawBlob);
      largestBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result || "";
          const comma = result.indexOf(",");
          resolve(comma !== -1 ? result.slice(comma + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fixedBlob);
      });
      addLog("[RunningHubRefVideo] MP4 faststart \u5904\u7406\u5B8C\u6210");
    } catch (faststartErr) {
      console.warn("[RunningHubRefVideo] faststart \u5904\u7406\u8DF3\u8FC7/\u5931\u8D25:", faststartErr);
    }
  }
  return {
    dataUrl: `data:${mimeType};base64,${largestBase64}`,
    isVideo,
    fileName: largestEntry.name,
    mimeType
  };
}

function extractJsonBlock(text) {
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

function isAssetManifestPrompt(text) {
  if (!text || typeof text !== "string") return false;
  let normalized = text.trim();
  if (normalized.includes("\\n") || normalized.includes("\\r")) {
    normalized = normalized.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
  }
  return /^\s*asset_manifest\s*:/im.test(normalized) || /asset_manifest\s*:\s*\{/i.test(normalized);
}

function isValidMediaFileId(fileId) {
  if (fileId === null || fileId === void 0) return false;
  if (typeof fileId !== "string") return false;
  const trimmed = fileId.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "none" || lower === "nil" || lower === "false") return false;
  return true;
}

function parseAssetManifest(rawPrompt) {
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
  const jsonBlock = extractJsonBlock(searchContent);
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
        console.error("[RunningHubRefVideo] asset_manifest JSON \u89E3\u6790\u5931\u8D25:", firstErr, jsonBlock.jsonStr);
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
          if (isValidMediaFileId(pic.file_id)) {
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
          if (isValidMediaFileId(aud.file_id)) {
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

async function dataToBlob(data, defaultMime = "image/png") {
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

function createBlankPngBlob(width = 512, height = 512, color = "#000000") {
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
      console.error("[RunningHubRefVideo] \u521B\u5EFA\u7A7A\u767D Canvas \u5931\u8D25\uFF0C\u4F7F\u7528\u7EAF\u6587\u672C Blob \u515C\u5E95:", e);
      resolve(new Blob([], { type: "image/png" }));
    }
  });
}

async function uploadBlankPngWithCache(apiKey) {
  const validApiKey = await resolveUploadApiKey(apiKey);
  if (!validApiKey) {
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 RunningHub API Key");
  }
  const fileId = "__st_blank_placeholder_png__";
  const settings3 = extension_settings[extensionName];
  if (!settings3.runninghub_upload_cache) {
    settings3.runninghub_upload_cache = {};
  }
  const cache = settings3.runninghub_upload_cache;
  const now = Date.now();
  if (cache[fileId] && cache[fileId].fileName) {
    const cachedItem = cache[fileId];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS) {
      addLog(`[RunningHubRefVideo] \u547D\u4E2D\u7A7A\u767D\u515C\u5E95\u56FE\u4E0A\u4F20\u7F13\u5B58: ${cachedItem.fileName}`);
      return cachedItem.fileName;
    }
  }
  addLog("[RunningHubRefVideo] \u6B63\u5728\u751F\u6210 512x512 \u7A7A\u767D PNG \u515C\u5E95\u56FE\u5E76\u4E0A\u4F20\u81F3 RunningHub...");
  const blankBlob = await createBlankPngBlob(512, 512, "#000000");
  const fileName = "blank_placeholder.png";
  const formData = new FormData();
  formData.append("file", blankBlob, fileName);
  formData.append("apiKey", validApiKey);
  formData.append("fileType", "input");
  const res = await fetch("https://www.runninghub.ai/task/openapi/upload", {
    method: "POST",
    body: formData
  });
  const resData = await res.json();
  if (resData.code !== 0 || !resData.data || !resData.data.fileName) {
    throw new Error(`RunningHub \u7A7A\u767D\u515C\u5E95\u56FE\u4E0A\u4F20\u5931\u8D25: ${resData.msg || "\u672A\u77E5\u9519\u8BEF"}`);
  }
  const uploadedFileName = resData.data.fileName;
  addLog(`[RunningHubRefVideo] \u7A7A\u767D\u515C\u5E95\u56FE\u4E0A\u4F20\u6210\u529F: ${uploadedFileName}`);
  cache[fileId] = {
    fileName: uploadedFileName,
    timestamp: now
  };
  saveSettingsDebounced();
  return uploadedFileName;
}

function createSilentWavBlob(durationSeconds = 1, sampleRate = 16e3) {
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

async function uploadBlankAudioWithCache(apiKey) {
  const validApiKey = await resolveUploadApiKey(apiKey);
  if (!validApiKey) {
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 RunningHub API Key");
  }
  const fileId = "__st_blank_placeholder_aud__";
  const settings3 = extension_settings[extensionName];
  if (!settings3.runninghub_upload_cache) {
    settings3.runninghub_upload_cache = {};
  }
  const cache = settings3.runninghub_upload_cache;
  const now = Date.now();
  if (cache[fileId] && cache[fileId].fileName) {
    const cachedItem = cache[fileId];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS) {
      addLog(`[RunningHubRefVideo] \u547D\u4E2D\u7A7A\u767D\u515C\u5E95\u97F3\u9891\u4E0A\u4F20\u7F13\u5B58: ${cachedItem.fileName}`);
      return cachedItem.fileName;
    }
  }
  addLog("[RunningHubRefVideo] \u6B63\u5728\u751F\u6210 1\u79D2\u9759\u97F3 WAV \u515C\u5E95\u97F3\u9891\u5E76\u4E0A\u4F20\u81F3 RunningHub...");
  const blankBlob = createSilentWavBlob(1, 16e3);
  const fileName = "blank_placeholder.wav";
  const formData = new FormData();
  formData.append("file", blankBlob, fileName);
  formData.append("apiKey", validApiKey);
  formData.append("fileType", "input");
  const res = await fetch("https://www.runninghub.ai/task/openapi/upload", {
    method: "POST",
    body: formData
  });
  const resData = await res.json();
  if (resData.code !== 0 || !resData.data || !resData.data.fileName) {
    throw new Error(`RunningHub \u7A7A\u767D\u515C\u5E95\u97F3\u9891\u4E0A\u4F20\u5931\u8D25: ${resData.msg || "\u672A\u77E5\u9519\u8BEF"}`);
  }
  const uploadedFileName = resData.data.fileName;
  addLog(`[RunningHubRefVideo] \u7A7A\u767D\u515C\u5E95\u97F3\u9891\u4E0A\u4F20\u6210\u529F: ${uploadedFileName}`);
  cache[fileId] = {
    fileName: uploadedFileName,
    timestamp: now
  };
  saveSettingsDebounced();
  return uploadedFileName;
}

async function uploadImageBlobWithCache(imageSource, cacheKey, apiKey) {
  if (!imageSource) return null;
  const validApiKey = await resolveUploadApiKey(apiKey);
  if (!validApiKey) {
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 RunningHub API Key");
  }
  const settings3 = extension_settings[extensionName];
  if (!settings3.runninghub_upload_cache) {
    settings3.runninghub_upload_cache = {};
  }
  const cache = settings3.runninghub_upload_cache;
  const now = Date.now();
  const fullCacheKey = `rawimg_${cacheKey}`;
  if (cache[fullCacheKey] && cache[fullCacheKey].fileName) {
    const cachedItem = cache[fullCacheKey];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS) {
      addLog(`[RunningHubVideo] \u547D\u4E2D\u9996\u5E27\u53C2\u8003\u56FE\u4E0A\u4F20\u7F13\u5B58: ${cachedItem.fileName}`);
      return cachedItem.fileName;
    }
  }
  const processed = await prepareImageForUpload(imageSource, {
    fallbackFileName: `first_frame_${Date.now()}.jpg`
  });
  const fileBlob = processed.blob;
  const fileName = processed.fileName;
  addLog(`[RunningHubVideo] \u6B63\u5728\u4E0A\u4F20\u9996\u5E27\u53C2\u8003\u56FE\u7247\u5230 RunningHub (${fileName}, ${(fileBlob.size / 1024).toFixed(1)} KB)...`);
  const formData = new FormData();
  formData.append("file", fileBlob, fileName);
  formData.append("apiKey", validApiKey);
  formData.append("fileType", "input");
  const res = await fetch("https://www.runninghub.ai/task/openapi/upload", {
    method: "POST",
    body: formData
  });
  const resData = await res.json();
  if (resData.code !== 0 || !resData.data || !resData.data.fileName) {
    throw new Error(`RunningHub \u9996\u5E27\u53C2\u8003\u56FE\u7247\u4E0A\u4F20\u5931\u8D25: ${resData.msg || "\u672A\u77E5\u9519\u8BEF"}`);
  }
  const uploadedFileName = resData.data.fileName;
  addLog(`[RunningHubVideo] \u9996\u5E27\u53C2\u8003\u56FE\u7247\u4E0A\u4F20\u6210\u529F: ${uploadedFileName}`);
  cache[fullCacheKey] = {
    fileName: uploadedFileName,
    timestamp: now
  };
  saveSettingsDebounced();
  return uploadedFileName;
}

async function uploadMediaWithCache(fileId, kind, apiKey) {
  if (!fileId) return null;
  const validApiKey = await resolveUploadApiKey(apiKey);
  if (!validApiKey) {
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 RunningHub API Key");
  }
  const settings3 = extension_settings[extensionName];
  if (!settings3.runninghub_upload_cache) {
    settings3.runninghub_upload_cache = {};
  }
  const cache = settings3.runninghub_upload_cache;
  const now = Date.now();
  let cacheChanged = false;
  for (const [key, item] of Object.entries(cache)) {
    if (item && item.timestamp && now - item.timestamp > UPLOAD_CACHE_EXPIRY_MS) {
      delete cache[key];
      cacheChanged = true;
    }
  }
  if (cache[fileId] && cache[fileId].fileName) {
    const cachedItem = cache[fileId];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS) {
      addLog(`[RunningHubRefVideo] \u547D\u4E2D 24 \u5C0F\u65F6\u4E0A\u4F20\u7F13\u5B58: ${fileId} -> ${cachedItem.fileName}`);
      if (cacheChanged) saveSettingsDebounced();
      return cachedItem.fileName;
    }
  }
  addLog(`[RunningHubRefVideo] \u672A\u547D\u4E2D\u7F13\u5B58\u6216\u5DF2\u8FC7\u671F\uFF0C\u4ECE\u672C\u5730\u8BFB\u53D6\u6587\u4EF6: ${fileId}`);
  let fileBlob = null;
  let fileName = `${fileId}.${kind === "aud" ? "mp3" : "png"}`;
  try {
    const configFile = await getConfigFile(fileId);
    if (configFile && configFile.data) {
      fileBlob = await dataToBlob(configFile.data, configFile.mimeType || (kind === "aud" ? "audio/mpeg" : "image/png"));
      if (configFile.fileName) fileName = configFile.fileName;
    }
  } catch (e) {
    try {
      const base64Img = await getConfigImage(fileId);
      if (base64Img) {
        fileBlob = await dataToBlob(base64Img, "image/png");
      }
    } catch (e2) {
      console.error("[RunningHubRefVideo] \u8BFB\u53D6\u914D\u7F6E\u6587\u4EF6\u5931\u8D25:", fileId, e, e2);
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
      console.warn("[RunningHubRefVideo] \u56FE\u7247\u7D20\u6750\u9884\u5904\u7406\u5931\u8D25\uFF0C\u4F7F\u7528\u539F\u59CB\u6587\u4EF6:", procErr);
    }
  }
  addLog(`[RunningHubRefVideo] \u6B63\u5728\u4E0A\u4F20\u6587\u4EF6\u5230 RunningHub (${fileName}, ${(fileBlob.size / 1024).toFixed(1)} KB)...`);
  const formData = new FormData();
  formData.append("file", fileBlob, fileName);
  formData.append("apiKey", validApiKey);
  formData.append("fileType", "input");
  const res = await fetch("https://www.runninghub.ai/task/openapi/upload", {
    method: "POST",
    body: formData
  });
  const resData = await res.json();
  if (resData.code !== 0 || !resData.data || !resData.data.fileName) {
    throw new Error(`RunningHub \u6587\u4EF6\u4E0A\u4F20\u5931\u8D25: ${resData.msg || "\u672A\u77E5\u9519\u8BEF"}`);
  }
  const uploadedFileName = resData.data.fileName;
  addLog(`[RunningHubRefVideo] \u4E0A\u4F20\u6210\u529F: ${fileId} -> ${uploadedFileName}`);
  cache[fileId] = {
    fileName: uploadedFileName,
    timestamp: now
  };
  saveSettingsDebounced();
  return uploadedFileName;
}

function buildRunningHubRefVideoWorkflow(rawJson, promptText, uploadedImages, uploadedAudios, genSettings) {
  let jsonStr = rawJson;
  let seed = parseInt(genSettings.seed);
  if (isNaN(seed) || seed === -1) {
    seed = Math.floor(Math.random() * 9007199254740991);
  }
  jsonStr = jsonStr.replace(/"%种子%"/g, seed).replace(/"%seed%"/g, seed);
  jsonStr = jsonStr.replace(/"%步数%"/g, genSettings.steps || "6").replace(/%步数%/g, genSettings.steps || "6");
  jsonStr = jsonStr.replace(/"%视频步数%"/g, genSettings.steps || "6").replace(/%视频步数%/g, genSettings.steps || "6");
  let megapixels = parseFloat(genSettings.megapixels) || 0.9;
  jsonStr = jsonStr.replace(/"%像素%"/g, megapixels).replace(/"%megapixels%"/g, megapixels);
  jsonStr = jsonStr.replace(/"%视频秒数%"/g, genSettings.duration || "4").replace(/"%duration%"/g, genSettings.duration || "4");
  let escapedPrompt = (promptText || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "");
  jsonStr = jsonStr.replace(/%提示词%/g, escapedPrompt);
  jsonStr = jsonStr.replace(/%prompt%/g, escapedPrompt);
  jsonStr = jsonStr.replace(/%正面提示词%/g, escapedPrompt);
  const fallbackImgName = (genSettings.defaultImg || "").trim() || genSettings.blankImg || uploadedImages[1] || "09baa6b5a6d1b6afa83aaad55c7261c9a413f9bdfdea045c49efb5f3303165fa.jpg";
  const fallbackAudName = (genSettings.defaultAud || "").trim() || genSettings.blankAud || uploadedAudios[1] || "eded6ff68fe3fda18f0f31ecfbb1ff6b7494c2d17ff35b32d3a5ad7ccecf03f4.m4a";
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
  let promptObj;
  try {
    promptObj = JSON.parse(jsonStr);
  } catch (err) {
    console.error("[RunningHubRefVideo] \u5DE5\u4F5C\u6D41 JSON \u89E3\u6790\u5931\u8D25:", jsonStr);
    throw new Error("\u53C2\u8003\u89C6\u9891\u5DE5\u4F5C\u6D41 JSON \u6784\u5EFA\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6A21\u677F\u683C\u5F0F");
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

async function generateRunningHubRefVideo({ prompt: rawPrompt, width: Xwidth, height: Xheight, change }) {
  clearLog();
  const targetPrompt = change || rawPrompt || "";
  addLog("[RunningHubVideo] \u5F00\u59CB\u89E3\u6790 asset_manifest \u63D0\u793A\u8BCD...");
  const { manifest, promptText, pictures, audios, invalidPictures, invalidAudios, isFirstFrameRef } = parseAssetManifest(targetPrompt);
  const hasExtraRefImages = Object.keys(pictures).some((k) => String(k) !== "1");
  const isImg2Vid = isFirstFrameRef && !hasExtraRefImages;
  const taskType = isImg2Vid ? TaskType.RUNNINGHUB_IMG2VID : TaskType.RUNNINGHUB_REF2VID;
  const taskTypeName = isImg2Vid ? "RunningHub \u56FE\u751F\u89C6\u9891" : "RunningHub \u53C2\u8003\u751F\u89C6\u9891";
  const taskId = taskQueue.addTask({
    name: (targetPrompt || "").substring(0, 30) + (targetPrompt.length > 30 ? "..." : ""),
    type: taskType,
    prompt: targetPrompt
  });
  const startTime = Date.now();
  if (!isPluginToastDisabled()) {
    toastr.info(`\u{1F3AC} \u5DF2\u53D1\u8D77 ${taskTypeName} \u8BF7\u6C42...`);
  }
  const settings3 = extension_settings[extensionName];
  const rawApiKey = settings3.runninghub_apiKey;
  if (!rawApiKey) {
    taskQueue.completeTask(taskId, false);
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 RunningHub API Key");
  }
  const uploadApiKey = await getUsableRunningHubKeyForUpload();
  if (invalidPictures && invalidPictures.length > 0) {
    addLog(`[RunningHubVideo] \u5FFD\u7565\u672A\u7ED1\u5B9A\u6216\u7A7A\u6587\u4EF6\u56FE\u7247\u8D44\u4EA7: ${invalidPictures.map((i) => `Picture ${i}`).join(", ")}`);
  }
  if (invalidAudios && invalidAudios.length > 0) {
    addLog(`[RunningHubVideo] \u5FFD\u7565\u672A\u7ED1\u5B9A\u6216\u7A7A\u6587\u4EF6\u97F3\u9891\u8D44\u4EA7: ${invalidAudios.map((i) => `Audio ${i}`).join(", ")}`);
  }
  const picKeys = Object.keys(pictures);
  const audKeys = Object.keys(audios);
  addLog(`[RunningHubVideo] \u89E3\u6790\u5B8C\u6210: \u5305\u542B ${picKeys.length} \u4E2A\u6709\u6548\u56FE\u7247\u53C2\u8003 (${picKeys.map((k) => `Picture ${k}`).join(", ") || "\u65E0"}), ${audKeys.length} \u4E2A\u6709\u6548\u97F3\u9891\u53C2\u8003 (${audKeys.map((k) => `Audio ${k}`).join(", ") || "\u65E0"})`);
  const uploadedImages = {};
  for (const [idx, fileId] of Object.entries(pictures)) {
    addLog(`[RunningHubVideo] \u5904\u7406 Picture ${idx} (file_id: ${fileId})...`);
    const uploadedName = await uploadMediaWithCache(fileId, "img", uploadApiKey);
    if (uploadedName) {
      uploadedImages[idx] = uploadedName;
    }
  }
  if (isFirstFrameRef) {
    addLog("[RunningHubVideo] \u68C0\u6D4B\u5230\u9996\u5E27\u53C2\u8003\u56FE\u7247\u9700\u6C42\uFF0C\u6B63\u5728\u63D0\u53D6\u89E6\u53D1\u5904\u56FE\u7247...");
    let triggerImageSource = null;
    const promptTag = rawPrompt || "";
    if (promptTag) {
      try {
        triggerImageSource = await getItemBlob(promptTag);
      } catch (e) {
        console.warn("[RunningHubVideo] getItemBlob \u83B7\u53D6\u5931\u8D25\uFF0C\u5C1D\u8BD5 getItemImg:", e);
      }
      if (!triggerImageSource) {
        try {
          const [imgData] = await getItemImg(promptTag);
          if (imgData) {
            triggerImageSource = imgData;
          }
        } catch (e2) {
          console.warn("[RunningHubVideo] getItemImg \u83B7\u53D6\u5931\u8D25:", e2);
        }
      }
    }
    if (triggerImageSource) {
      const cacheKey = typeof CryptoJS !== "undefined" && CryptoJS.MD5 ? CryptoJS.MD5(promptTag || String(Date.now())).toString() : (promptTag || String(Date.now())).replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 32);
      const uploadedFirstFrame = await uploadImageBlobWithCache(triggerImageSource, cacheKey, uploadApiKey);
      if (uploadedFirstFrame) {
        uploadedImages[1] = uploadedFirstFrame;
        addLog(`[RunningHubVideo] \u6210\u529F\u7ED1\u5B9A\u89E6\u53D1\u5904\u56FE\u7247\u4E3A Picture 1 -> ${uploadedFirstFrame}`);
      }
    } else {
      addLog("[RunningHubVideo] \u672A\u627E\u5230\u89E6\u53D1\u5904\u5DF2\u6709\u56FE\u7247\uFF0C\u5C06\u5C1D\u8BD5\u4F7F\u7528\u9884\u8BBE\u8D44\u4EA7\u6216\u7A7A\u767D\u515C\u5E95...");
    }
  }
  const uploadedAudios = {};
  for (const [idx, fileId] of Object.entries(audios)) {
    addLog(`[RunningHubVideo] \u5904\u7406 Audio ${idx} (file_id: ${fileId})...`);
    const uploadedName = await uploadMediaWithCache(fileId, "aud", uploadApiKey);
    if (uploadedName) {
      uploadedAudios[idx] = uploadedName;
    }
  }
  if (Object.keys(uploadedImages).length === 0) {
    addLog("[RunningHubVideo] \u68C0\u6D4B\u5230\u65E0\u56FE\u7247\u53C2\u8003\u8D44\u4EA7\uFF0C\u6B63\u5728\u751F\u6210\u7A7A\u767D PNG \u4F5C\u4E3A\u7B2C\u4E00\u5F20\u56FE\u7247 (Picture 1) \u515C\u5E95...");
    const blankFileName = await uploadBlankPngWithCache(uploadApiKey);
    if (blankFileName) {
      uploadedImages[1] = blankFileName;
      addLog(`[RunningHubVideo] \u7A7A\u767D\u56FE\u7247\u515C\u5E95\u5DF2\u5C31\u7EEA: Picture 1 -> ${blankFileName}`);
    }
  }
  if (Object.keys(uploadedAudios).length === 0) {
    addLog("[RunningHubVideo] \u68C0\u6D4B\u5230\u65E0\u97F3\u9891\u53C2\u8003\u8D44\u4EA7\uFF0C\u6B63\u5728\u751F\u6210\u7A7A\u767D WAV \u4F5C\u4E3A\u7B2C\u4E00\u6BB5\u97F3\u9891 (Audio 1) \u515C\u5E95...");
    const blankAudFileName = await uploadBlankAudioWithCache(uploadApiKey);
    if (blankAudFileName) {
      uploadedAudios[1] = blankAudFileName;
      addLog(`[RunningHubVideo] \u7A7A\u767D\u97F3\u9891\u515C\u5E95\u5DF2\u5C31\u7EEA: Audio 1 -> ${blankAudFileName}`);
    }
  }
  let blankImgPlaceholder = uploadedImages[1] || "";
  if (!blankImgPlaceholder) {
    blankImgPlaceholder = await uploadBlankPngWithCache(uploadApiKey);
  }
  let blankAudPlaceholder = uploadedAudios[1] || "";
  if (!blankAudPlaceholder) {
    blankAudPlaceholder = await uploadBlankAudioWithCache(uploadApiKey);
  }
  const workerCategoryName = isImg2Vid ? "\u56FE\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41" : "\u53C2\u8003\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41";
  const targetWorkerId = isImg2Vid ? settings3.runninghub_img2vid_workerid || "" : settings3.runninghub_ref2vid_workerid || "";
  let targetWorkflowId = targetWorkerId && settings3.runninghub_workflow_ids?.[targetWorkerId] || (isImg2Vid ? settings3.runninghub_img2vid_workflowId : settings3.runninghub_ref2vid_workflowId) || settings3.runninghub_workflow_ids && settings3.runninghub_workflow_ids[settings3.runninghub_workerid] || settings3.runninghub_workflowId || "";
  let targetWorkerJson = targetWorkerId && settings3.runninghub_workers?.[targetWorkerId] || (isImg2Vid ? settings3.runninghub_img2vid_worker : settings3.runninghub_ref2vid_worker) || settings3.runninghub_workers?.[settings3.runninghub_workerid] || settings3.runninghub_worker || runninghubDefaultJson;
  if (!targetWorkflowId) {
    taskQueue.completeTask(taskId, false);
    throw new Error(`\u5F53\u524D\u3010${workerCategoryName}\u3011\u9009\u4E2D\u7684\u9884\u8BBE "${targetWorkerId || "\u9ED8\u8BA4"}" \u5C1A\u672A\u914D\u7F6E\u5DE5\u4F5C\u6D41 ID\uFF0C\u8BF7\u5728 RunningHub \u8BBE\u7F6E\u7684\u3010${workerCategoryName}\u3011\u4E2D\u586B\u5199\u5BF9\u5E94\u7684 Workflow ID`);
  }
  addLog(`[RunningHubVideo] \u4F7F\u7528\u3010${workerCategoryName}\u3011\u9884\u8BBE: "${targetWorkerId || "\u9ED8\u8BA4"}", \u5DE5\u4F5C\u6D41 ID: ${targetWorkflowId}`);
  const genSettings = {
    seed: settings3.runninghub_val_seed,
    steps: settings3.runninghub_val_steps,
    megapixels: settings3.runninghub_val_megapixels,
    duration: settings3.runninghub_val_duration,
    defaultImg: settings3.runninghub_val_default_img,
    defaultAud: settings3.runninghub_val_default_aud,
    blankImg: blankImgPlaceholder,
    blankAud: blankAudPlaceholder
  };
  const cleanPromptText = await stripChineseAnnotations(promptText);
  const { promptObj, seedUsed } = buildRunningHubRefVideoWorkflow(
    targetWorkerJson,
    cleanPromptText,
    uploadedImages,
    uploadedAudios,
    genSettings
  );
  const _rh_gen_params = buildGenParams("RunningHub-Video", {
    model: targetWorkflowId,
    yushe: workerCategoryName,
    resolvedPrompt: cleanPromptText,
    seed: seedUsed,
    steps: settings3.runninghub_val_steps,
    duration: settings3.runninghub_val_duration
  });
  const abortController = new AbortController();
  const onTaskCancelled = (data) => {
    if (data && data.taskId === taskId) abortController.abort(new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88"));
  };
  eventSource.on("st_chatu8_task_cancelled", onTaskCancelled);
  const abortSignal = abortController.signal;
  let keyLease = null;
  let apiKey = null;
  let runTaskId = null;
  let isRetry = false;
  let maxedRetryCount = 0;
  try {
    while (true) {
      if (!taskQueue.isTaskInQueue(taskId) || abortSignal.aborted) {
        throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
      }
      addLog(`[RunningHubVideo] \u6B63\u5728\u4ECE Key \u6C60\u5206\u914D\u7A7A\u95F2\u4E14\u6709\u4F59\u989D\u7684 API Key (\u4F18\u5148\u7EA7: ${isRetry ? "\u9AD8" : "\u666E\u901A"})...`);
      keyLease = await acquireRunningHubKey({
        taskId,
        isTaskCancelled: () => !taskQueue.isTaskInQueue(taskId),
        priority: isRetry ? "high" : "normal",
        abortSignal
      });
      apiKey = keyLease.apiKey;
      taskQueue.updateStatus(taskId, "running");
      const nodeInfoList = extractNodeInfoListFromWorkflow(targetWorkerJson, promptObj);
      addLog(`[RunningHubRefVideo v2] \u63D0\u53D6\u5230 ${nodeInfoList.length} \u4E2A\u8986\u76D6\u53C2\u6570: ${nodeInfoList.map((n) => `${n.nodeId}.${n.fieldName}`).join(", ")}`);
      addLog(`[RunningHubRefVideo v2] \u53D1\u8D77\u4EFB\u52A1\u8BF7\u6C42 (Workflow ID: ${targetWorkflowId})...`);
      const payload = {
        nodeInfoList,
        addMetadata: true,
        usePersonalQueue: false
      };
      if (settings3.runninghub_instance_type && settings3.runninghub_instance_type !== "default") {
        payload.instanceType = settings3.runninghub_instance_type;
      }
      if (settings3.runninghub_retain_seconds) {
        const retain = parseInt(settings3.runninghub_retain_seconds, 10);
        if (!isNaN(retain) && retain >= 10 && retain <= 180) {
          payload.retainSeconds = retain;
        }
      }
      const createRes = await fetch(`https://www.runninghub.ai/openapi/v2/run/workflow/${targetWorkflowId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: abortSignal
      });
      const createData = await createRes.json();
      if (createData.taskId) {
        runTaskId = createData.taskId;
        if (keyLease && typeof keyLease.setRemoteTaskId === "function") {
          keyLease.setRemoteTaskId(runTaskId);
        }
        if (keyLease && typeof keyLease.isCancelled === "function" && keyLease.isCancelled() || abortSignal.aborted) {
          throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
        }
        addLog(`[RunningHubRefVideo v2] \u4EFB\u52A1\u5DF2\u521B\u5EFA\uFF0CID: ${runTaskId}\uFF0C\u8FDB\u5165\u8F6E\u8BE2\u7B49\u5F85...`);
        break;
      }
      const errMsg = formatRunningHubApiError({ ...createData, _workflowId: targetWorkflowId }, "\u521B\u5EFA RunningHub \u89C6\u9891\u751F\u6210\u4EFB\u52A1\u5931\u8D25");
      if (/TASK_QUEUE_MAXED/i.test(errMsg) || /queue.*max/i.test(errMsg) || /并发.*满/i.test(errMsg)) {
        maxedRetryCount++;
        if (maxedRetryCount > 5) {
          throw new Error("RunningHub \u89C6\u9891\u4E91\u7AEF\u961F\u5217\u6301\u7EED\u6EE1\u8F7D(\u5DF2\u91CD\u8BD55\u6B21)\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5");
        }
        addLog(`[RunningHubRefVideo] \u5B98\u65B9\u63D0\u793A\u961F\u5217\u5DF2\u6EE1 (${errMsg})\uFF0C\u91CA\u653E\u5F53\u524D Key \u5E76\u8F6C\u5165\u961F\u9996\u7B49\u5F85\u4F18\u5148\u91CD\u8BD5...`);
        if (keyLease && typeof keyLease.markRejected === "function") {
          keyLease.markRejected();
        } else if (keyLease && typeof keyLease.releaseKey === "function") {
          keyLease.releaseKey();
        }
        keyLease = null;
        taskQueue.updateStatus(taskId, TaskStatus.QUEUED);
        isRetry = true;
        continue;
      }
      throw new Error(errMsg);
    }
    let attempts = 0;
    let outputUrl = null;
    let rhTaskCostTime = null;
    let rhConsumeCoins = null;
    while (true) {
      await sleep(3e3);
      if (!taskQueue.isTaskInQueue(taskId) || abortSignal.aborted) {
        throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
      }
      const statData = await runningHubReadWithRetry(async () => {
        const statRes = await runningHubFetch("https://www.runninghub.ai/openapi/v2/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({ taskId: runTaskId }),
          signal: abortSignal
        }, 15e3);
        return await statRes.json();
      }, { signal: abortSignal });
      const status = statData.status;
      if (status === "SUCCESS") {
        addLog("[RunningHubRefVideo v2] \u4EFB\u52A1\u6267\u884C\u6210\u529F\uFF0C\u6B63\u5728\u83B7\u53D6\u8F93\u51FA...");
        if (statData.results && statData.results.length > 0) {
          const mainItem = statData.results[0];
          outputUrl = mainItem.url;
          rhTaskCostTime = statData.taskCostTime != null ? String(statData.taskCostTime) : null;
          rhConsumeCoins = statData.consumeCoins != null ? String(statData.consumeCoins) : null;
          const rhDetailParts2 = [];
          if (rhTaskCostTime != null) rhDetailParts2.push(`RH\u6D88\u8017\u65F6\u95F4: ${rhTaskCostTime}\u79D2`);
          if (rhConsumeCoins != null) rhDetailParts2.push(`\u6D88\u8017RH\u70B9\u6570: ${rhConsumeCoins}`);
          const rhDetailText2 = rhDetailParts2.length > 0 ? ` (${rhDetailParts2.join(", ")})` : "";
          addLog(`[RunningHubRefVideo v2] \u83B7\u53D6\u5230\u8F93\u51FA URL: ${outputUrl}${rhDetailText2} (\u683C\u5F0F: ${mainItem.outputType || "\u672A\u77E5"}, Node: ${mainItem.nodeId})`);
        } else {
          throw new Error("RunningHub \u4EFB\u52A1\u6210\u529F\u4F46\u672A\u8FD4\u56DE\u4EFB\u4F55\u8F93\u51FA\u6587\u4EF6");
        }
        break;
      } else if (status === "FAILED") {
        throw new Error(statData.errorMessage || "RunningHub \u4EFB\u52A1\u6267\u884C\u5931\u8D25");
      } else {
        addLog(`[RunningHubRefVideo v2] \u4EFB\u52A1\u8FD0\u884C\u4E2D (${status || "QUEUED"})...`);
      }
      attempts++;
      if (attempts > 300) {
        throw new Error("RunningHub \u89C6\u9891\u751F\u6210\u8D85\u65F6 (15\u5206\u949F)");
      }
    }
    addLog(`[RunningHubRefVideo] \u6B63\u5728\u4E0B\u8F7D\u751F\u6210\u7684\u6587\u4EF6...`);
    const fileRes = await fetch(outputUrl);
    const fileBlob = await fileRes.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    let finalMediaData = null;
    let isVideo = true;
    let mediaFormat = "video/mp4";
    const isZip = outputUrl.toLowerCase().includes(".zip") || fileBlob.type.includes("zip") || fileBlob.type.includes("octet-stream");
    if (isZip) {
      const extracted = await extractLargestMediaFromZip2(arrayBuffer);
      finalMediaData = extracted.dataUrl;
      isVideo = extracted.isVideo;
      mediaFormat = extracted.mimeType || "video/mp4";
    } else {
      let processedBlob = fileBlob;
      if (mediaFormat === "video/mp4" || outputUrl.match(/\.mp4($|\?)/i)) {
        try {
          processedBlob = await fixMp4Faststart(fileBlob);
          addLog("[RunningHubVideo] \u76F4\u8FDE MP4 faststart \u5904\u7406\u5B8C\u6210");
        } catch (faststartErr) {
          console.warn("[RunningHubVideo] \u76F4\u8FDE MP4 faststart \u5904\u7406\u8DF3\u8FC7/\u5931\u8D25:", faststartErr);
        }
      }
      finalMediaData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(processedBlob);
      });
    }
    const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
    taskQueue.completeTask(taskId, true);
    const rhDetailParts = [];
    if (rhTaskCostTime != null) rhDetailParts.push(`RH\u6D88\u8017\u65F6\u95F4: ${rhTaskCostTime}\u79D2`);
    if (rhConsumeCoins != null) rhDetailParts.push(`\u6D88\u8017RH\u70B9\u6570: ${rhConsumeCoins}`);
    const rhDetailText = rhDetailParts.length > 0 ? ` (${rhDetailParts.join(", ")})` : "";
    if (!isPluginToastDisabled()) {
      toastr.success(`\u2705 ${taskTypeName}\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2${rhDetailText}`);
    }
    addLog(`[RunningHubVideo] ${taskTypeName}\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2${rhDetailText}`);
    if (apiKey) {
      invalidateBalanceCache(apiKey);
      if (rhConsumeCoins != null) {
        recordKeyConsumption(apiKey, rhConsumeCoins);
      }
    }
    recordImageGeneration("runninghub", true);
    return {
      mediaData: finalMediaData,
      isVideo,
      format: mediaFormat,
      originalUrl: outputUrl,
      genParams: _rh_gen_params,
      taskCostTime: rhTaskCostTime,
      consumeCoins: rhConsumeCoins
    };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    if (rawMessage !== "\u4EFB\u52A1\u5DF2\u53D6\u6D88") {
      taskQueue.completeTask(taskId, false);
      recordImageGeneration("runninghub", false);
      toastr.error(`RunningHub \u89C6\u9891\u751F\u6210\u5931\u8D25: ${rawMessage}`);
    }
    addLog(`[RunningHubRefVideo \u9519\u8BEF] ${rawMessage}`);
    console.error("[RunningHubRefVideo \u9519\u8BEF]", err);
    throw err;
  } finally {
    if (eventSource && typeof eventSource.off === "function") {
      eventSource.off("st_chatu8_task_cancelled", onTaskCancelled);
    }
    if (keyLease && typeof keyLease.releaseKey === "function") {
      try {
        keyLease.releaseKey();
      } catch (e) {
        console.warn("[RunningHubRefVideo] \u91CA\u653E Key \u5F02\u5E38:", e);
      }
      keyLease = null;
    }
  }
}

async function executeRunningHubVideoDirectTest({
  prompt: prompt2,
  workflowJson,
  workflowId,
  uploadedImages = {},
  uploadedAudios = {},
  genSettings = {},
  apiKey: specifiedApiKey,
  apiKeys: specifiedApiKeys,
  onStatusUpdate,
  abortSignal
}) {
  const notify = (msg, isError = false) => {
    addLog(`[RunningHubTest] ${msg}`);
    if (typeof onStatusUpdate === "function") {
      onStatusUpdate(msg, isError);
    }
  };
  if (!workflowId) {
    throw new Error("\u8BF7\u5148\u914D\u7F6E\u8BE5\u9884\u8BBE\u5BF9\u5E94\u7684 RunningHub Workflow ID");
  }
  const settings3 = extension_settings[extensionName] || {};
  notify("\u6B63\u5728\u4ECE Key \u6C60\u5206\u914D\u7A7A\u95F2\u4E14\u6709\u4F59\u989D\u7684 API Key...");
  const candidateKeys = specifiedApiKey ? [specifiedApiKey] : specifiedApiKeys;
  const testTaskId = "test_" + Date.now();
  const keyLease = await acquireRunningHubKey({
    taskId: testTaskId,
    apiKeys: candidateKeys,
    abortSignal
  });
  const apiKey = keyLease.apiKey;
  try {
    notify(`\u5DF2\u5206\u914D Key (RH\u5E01: ${keyLease.remainCoins})\uFF0C\u6B63\u5728\u5904\u7406\u63D0\u793A\u8BCD\u4E0E\u53C2\u6570...`);
    let targetPrompt = prompt2 || "";
    if (isAssetManifestPrompt(targetPrompt)) {
      const parsed = parseAssetManifest(targetPrompt);
      if (parsed && parsed.promptText) {
        targetPrompt = parsed.promptText;
      }
    }
    const cleanPrompt = await stripChineseAnnotations(targetPrompt);
    const { promptObj, seedUsed } = buildRunningHubRefVideoWorkflow(
      workflowJson,
      cleanPrompt,
      uploadedImages,
      uploadedAudios,
      genSettings
    );
    if (abortSignal?.aborted) throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    const nodeInfoList = extractNodeInfoListFromWorkflow(workflowJson, promptObj);
    notify(`\u6B63\u5728\u5411 RunningHub \u63D0\u4EA4\u4EFB\u52A1 (Workflow ID: ${workflowId}, \u79CD\u5B50: ${seedUsed}, \u8986\u76D6\u8282\u70B9\u6570: ${nodeInfoList.length})...`);
    const payload = {
      nodeInfoList,
      addMetadata: true,
      usePersonalQueue: false
    };
    if (settings3.runninghub_instance_type && settings3.runninghub_instance_type !== "default") {
      payload.instanceType = settings3.runninghub_instance_type;
    }
    if (settings3.runninghub_retain_seconds) {
      const retain = parseInt(settings3.runninghub_retain_seconds, 10);
      if (!isNaN(retain) && retain >= 10 && retain <= 180) {
        payload.retainSeconds = retain;
      }
    }
    const createRes = await fetch(`https://www.runninghub.ai/openapi/v2/run/workflow/${workflowId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: abortSignal
    });
    const createData = await createRes.json();
    if (!createData.taskId) {
      const errDetail = formatRunningHubApiError({ ...createData, _workflowId: workflowId }, "\u521B\u5EFA RunningHub \u751F\u6210\u4EFB\u52A1\u5931\u8D25");
      throw new Error(errDetail);
    }
    const taskId = createData.taskId;
    if (keyLease && typeof keyLease.setRemoteTaskId === "function") {
      keyLease.setRemoteTaskId(taskId);
    }
    if (keyLease && typeof keyLease.isCancelled === "function" && keyLease.isCancelled() || abortSignal?.aborted) {
      throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    notify(`\u4EFB\u52A1\u5DF2\u6210\u529F\u521B\u5EFA (Task ID: ${taskId})\uFF0C\u6B63\u5728\u6392\u961F/\u751F\u6210\u4E2D...`);
    let attempts = 0;
    let outputUrl = null;
    let rhTaskCostTime = null;
    let rhConsumeCoins = null;
    while (true) {
      if (abortSignal?.aborted) throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
      await sleep(3e3);
      if (abortSignal?.aborted) throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
      const statData = await runningHubReadWithRetry(async () => {
        const statRes = await runningHubFetch("https://www.runninghub.ai/openapi/v2/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({ taskId }),
          signal: abortSignal
        }, 15e3);
        return await statRes.json();
      }, { signal: abortSignal });
      const status = statData.status;
      if (status === "SUCCESS") {
        notify("\u4E91\u7AEF\u751F\u6210\u6210\u529F\uFF01\u6B63\u5728\u83B7\u53D6\u8F93\u51FA\u89C6\u9891\u94FE\u63A5...");
        if (statData.results && statData.results.length > 0) {
          const mainItem = statData.results[0];
          outputUrl = mainItem.url;
          rhTaskCostTime = statData.taskCostTime != null ? String(statData.taskCostTime) : null;
          rhConsumeCoins = statData.consumeCoins != null ? String(statData.consumeCoins) : null;
          const rhDetailParts = [];
          if (rhTaskCostTime != null) rhDetailParts.push(`RH\u6D88\u8017\u65F6\u95F4: ${rhTaskCostTime}\u79D2`);
          if (rhConsumeCoins != null) rhDetailParts.push(`\u6D88\u8017RH\u70B9\u6570: ${rhConsumeCoins}`);
          const rhDetailText = rhDetailParts.length > 0 ? ` (${rhDetailParts.join(", ")})` : "";
          notify(`[RunningHubVideo v2] \u83B7\u53D6\u5230\u8F93\u51FA URL: ${outputUrl}${rhDetailText} (\u683C\u5F0F: ${mainItem.outputType || "\u672A\u77E5"}, Node: ${mainItem.nodeId})`);
        } else {
          throw new Error("RunningHub \u4EFB\u52A1\u6210\u529F\u4F46\u672A\u8FD4\u56DE\u4EFB\u4F55\u8F93\u51FA\u6587\u4EF6");
        }
        break;
      } else if (status === "FAILED") {
        throw new Error(statData.errorMessage || "RunningHub \u4EFB\u52A1\u6267\u884C\u5931\u8D25");
      } else {
        attempts++;
        notify(`\u4EFB\u52A1\u8FD0\u884C\u4E2D (${status || "QUEUED"})\uFF0C\u5DF2\u8017\u65F6\u7EA6 ${attempts * 3} \u79D2...`);
      }
      if (attempts > 300) {
        throw new Error("\u89C6\u9891\u751F\u6210\u8D85\u65F6 (\u5DF2\u7B49\u5F8515\u5206\u949F)");
      }
    }
    const fileRes = await fetch(outputUrl, { signal: abortSignal });
    const fileBlob = await fileRes.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    let finalMediaData = null;
    let isVideo = true;
    let mediaFormat = "video/mp4";
    const isZip = outputUrl.toLowerCase().includes(".zip") || fileBlob.type.includes("zip") || fileBlob.type.includes("octet-stream");
    if (isZip) {
      notify("\u6B63\u5728\u89E3\u538B ZIP \u538B\u7F29\u5305\u63D0\u53D6\u4E3B\u89C6\u9891...");
      const extracted = await extractLargestMediaFromZip2(arrayBuffer);
      finalMediaData = extracted.dataUrl;
      isVideo = extracted.isVideo;
      mediaFormat = extracted.mimeType || "video/mp4";
    } else {
      let processedBlob = fileBlob;
      if (mediaFormat === "video/mp4" || outputUrl.match(/\.mp4($|\?)/i)) {
        try {
          processedBlob = await fixMp4Faststart(fileBlob);
        } catch (faststartErr) {
          console.warn("[RunningHubVideo] \u6D4B\u8BD5\u76F4\u8FDE MP4 faststart \u5904\u7406\u8DF3\u8FC7/\u5931\u8D25:", faststartErr);
        }
      }
      finalMediaData = URL.createObjectURL(processedBlob);
    }
    const rhSuccessParts = [];
    if (rhTaskCostTime != null) rhSuccessParts.push(`RH\u8017\u65F6: ${rhTaskCostTime}s`);
    if (rhConsumeCoins != null) rhSuccessParts.push(`\u6D88\u8017\u70B9\u6570: ${rhConsumeCoins}`);
    const rhSuccessText = rhSuccessParts.length > 0 ? ` [${rhSuccessParts.join(", ")}]` : "";
    notify(`\u89C6\u9891\u6D4B\u8BD5\u751F\u6210\u6210\u529F\uFF01${rhSuccessText}`, false);
    if (apiKey) {
      invalidateBalanceCache(apiKey);
      if (rhConsumeCoins != null) {
        recordKeyConsumption(apiKey, rhConsumeCoins);
      }
    }
    return {
      videoUrl: finalMediaData,
      originalUrl: outputUrl,
      isVideo,
      format: mediaFormat,
      seedUsed,
      taskCostTime: rhTaskCostTime,
      consumeCoins: rhConsumeCoins
    };
  } finally {
    if (keyLease && typeof keyLease.releaseKey === "function") {
      keyLease.releaseKey();
    }
  }
}

export { executeRunningHubVideoDirectTest, formatRunningHubApiError };
