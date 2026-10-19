// 还原自打包产物 — 原始模块: utils/database.js
import { extension_settings } from "../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../script.js";
import { getPerfState, isPerfFeatureEnabled } from "./perf/perfConfig.js";
import { arrayBufferToBase64, base64ByteLength, base64ToArrayBuffer } from "./perf/base64Utils.js";
import { extensionName } from "./config.js";
import { flushSettingsSave, scheduleSettingsSave } from "./perf/settingsSaveScheduler.js";
import { isTailEnabled, tailEnqueue, tailStep } from "./perf/tailQueue.js";
import { getRequestHeaders } from "./utils.js";
import { ImageSteganography } from "./steganography.js";

var STEGO_FILENAME, STEGO_FOLDER, __chatu8T03Cache, __chatu8T03EnabledMemo, __chatu8T03Gen, __chatu8T03Pending, __chatu8T03Stats, __chatu8T03TtlMemo, db, dbName, dbVersion, dbs, metadataId, migrationFlag, objectStoreName, oldDbName, sizeCalcListeners, sizeCalcTask;

objectStoreName = "tupianhuancun";

metadataId = "tupianshuju";

oldDbName = "tupian";

dbName = "chatu8_gallery";

dbVersion = 6;

migrationFlag = "chatu8_gallery_migration_v1_done";

__chatu8T03Cache = null;

__chatu8T03Pending = null;

__chatu8T03Gen = 0;

__chatu8T03Stats = { reads: 0, hits: 0, joins: 0, misses: 0, parses: 0, writes: 0, invalidations: 0, lastReason: "" };

(() => {
      try {
        if (typeof window === "undefined") return;
        const perfState = getPerfState();
        perfState.metadataCache = {
          get enabled() {
            return __chatu8T03Enabled();
          },
          setEnabled: (enabled) => {
            __chatu8T03EnabledMemo = !!enabled;
            __chatu8T03Invalidate("setEnabled");
            return __chatu8T03EnabledMemo;
          },
          setTtl: (ms) => {
            __chatu8T03TtlMemo = typeof ms === "number" && ms >= 0 ? ms : void 0;
            return __chatu8T03Ttl();
          },
          invalidate: __chatu8T03Invalidate,
          resetStats: () => {
            __chatu8T03Stats = { reads: 0, hits: 0, joins: 0, misses: 0, parses: 0, writes: 0, invalidations: 0, lastReason: "" };
          },
          stats: () => ({
            ...__chatu8T03Stats,
            gen: __chatu8T03Gen,
            cached: !!__chatu8T03Cache,
            pending: !!__chatu8T03Pending,
            cacheGen: __chatu8T03Cache ? __chatu8T03Cache.gen : null,
            ttlMs: __chatu8T03Ttl()
          })
        };
      } catch (_) {
      }
    })();

sizeCalcTask = null;

sizeCalcListeners = /* @__PURE__ */ new Set();

STEGO_FOLDER = "chatu8List";

STEGO_FILENAME = "\u56FE\u7247\u7F13\u5B58\u5217\u8868";

dbs = {
      openDB,
      migrateDatabase,
      setItemImg,
      updateItemImgChange,
      updateItemImgVideo,
      updateItemImgActiveMode,
      getItemImg,
      getItemMeta,
      getItemBlob,
      updateImageIndex,
      deleteImage,
      getAllImages,
      getAllImageBlobs,
      getImageByUUID,
      getImageBlobByUUID,
      getImageThumbnailBlobByUUID,
      getAllImageMetadata,
      calculateAllImageSizes,
      subscribeSizeCalcProgress,
      getSizeCalcTask,
      cancelSizeCalc,
      deleteMultipleImages,
      deleteImagesByUuids,
      getMergedAndSortedImages,
      syncServerImagesWithStorage,
      storeReadOnly,
      storeReadWrite,
      storeDelete,
      // 隐写术功能
      initJiuguanStorage,
      updateStegoImage,
      // Vocabulary functions
      installVocabulary,
      uninstallVocabulary,
      getInstalledVocabularies,
      getTagsTreeData,
      searchTags,
      addTag,
      getManualTags,
      deleteTagByName
    };

function formatToMimeType(format, isVideo = false) {
  if (!format || typeof format !== "string") {
    return isVideo ? "video/mp4" : "image/png";
  }
  const fmt = format.toLowerCase();
  if (fmt.includes("webm")) return "video/webm";
  if (fmt.includes("mp4") || fmt.includes("h264")) return "video/mp4";
  if (fmt.includes("jpeg") || fmt.includes("jpg")) return "image/jpeg";
  if (fmt.includes("png")) return "image/png";
  if (fmt.includes("webp")) return "image/webp";
  if (fmt.includes("gif")) return "image/gif";
  if (fmt.startsWith("video/")) return fmt;
  if (fmt.startsWith("image/")) return fmt;
  return isVideo ? "video/mp4" : "image/png";
}

function detectMimeFromBuffer(buffer, isVideo = false) {
  if (!buffer) return isVideo ? "video/mp4" : "image/png";
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 4) return isVideo ? "video/mp4" : "image/png";
  if (bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163) {
    return "video/webm";
  }
  if (bytes.length >= 8 && bytes[4] === 102 && bytes[5] === 116 && bytes[6] === 121 && bytes[7] === 112) {
    return "video/mp4";
  }
  if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) {
    return "image/png";
  }
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if (bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70) {
    return "image/gif";
  }
  if (bytes.length >= 12 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) {
    return "image/webp";
  }
  return isVideo ? "video/mp4" : "image/png";
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function generateUUID() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}

async function getMergedAndSortedImages(md5) {
  const result = {
    images: [],
    currentIndex: 0,
    hasServer: false,
    hasDB: false
  };
  const storage = extension_settings[extensionName].jiuguanStorage || {};
  const serverEntry = storage[md5];
  let serverIndex = 0;
  if (serverEntry && Array.isArray(serverEntry.images) && serverEntry.images.length > 0) {
    result.hasServer = true;
    serverIndex = serverEntry.index || 0;
    serverEntry.images.forEach((img) => {
      result.images.push({
        ...img,
        source: "server",
        date: img.date || 0
      });
    });
  }
  const metadata = await getMetadata();
  const dbEntry = metadata[md5];
  if (dbEntry && Array.isArray(dbEntry.images) && dbEntry.images.length > 0) {
    result.hasDB = true;
    if (!result.hasServer) {
      serverIndex = dbEntry.index || 0;
    } else {
      const isJiuguanStorage = extension_settings[extensionName]?.jiuguanchucun === "true";
      if (!isJiuguanStorage && typeof dbEntry.index === "number") {
        serverIndex = dbEntry.index;
      } else if (isJiuguanStorage && typeof serverEntry.index === "number") {
        serverIndex = serverEntry.index;
      } else {
        serverIndex = typeof serverEntry.index === "number" ? serverEntry.index : dbEntry.index || 0;
      }
    }
    dbEntry.images.forEach((img) => {
      result.images.push({
        ...img,
        source: "db",
        date: img.date || 0
      });
    });
  }
  result.images.sort((a, b) => a.date - b.date);
  if (!Number.isInteger(serverIndex) || serverIndex < 0) {
    serverIndex = 0;
  } else if (serverIndex >= result.images.length) {
    serverIndex = result.images.length - 1;
  }
  result.currentIndex = serverIndex;
  return result;
}

async function syncIndexToStorage(md5, globalIndex, sortedImages, skipStego = false) {
  let correctedIndex = globalIndex;
  if (correctedIndex < 0) correctedIndex = 0;
  if (sortedImages.length === 0) correctedIndex = 0;
  else if (correctedIndex >= sortedImages.length) correctedIndex = sortedImages.length - 1;
  let jiuguanStorageModified = false;
  const storage = extension_settings[extensionName].jiuguanStorage;
  if (storage && storage[md5]) {
    if (storage[md5].index !== correctedIndex) {
      storage[md5].index = correctedIndex;
      scheduleSettingsSave("index");
      jiuguanStorageModified = true;
    }
  }
  const metadata = await getMetadata();
  if (metadata[md5]) {
    if (metadata[md5].index !== correctedIndex) {
      metadata[md5].index = correctedIndex;
      await setMetadata(metadata);
    }
  }
  if (jiuguanStorageModified && !skipStego) {
    await updateStegoImage();
  }
  return correctedIndex;
}

function createThumbnailFromBuffer(buffer, maxWidth = 256, maxHeight = 256) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer]);
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((thumbnailBlob) => {
        if (thumbnailBlob) {
          resolve(thumbnailBlob);
        } else {
          reject(new Error("Canvas to Blob conversion failed for thumbnail."));
        }
      }, "image/jpeg", 0.85);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function createDefaultVideoThumbnail(width = 256, height = 256) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, "#16213e");
    gradient.addColorStop(1, "#0f0f23");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const circleRadius = Math.min(width, height) * 0.3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fill();
    const triangleSize = circleRadius * 0.6;
    ctx.beginPath();
    ctx.moveTo(centerX - triangleSize * 0.4, centerY - triangleSize * 0.6);
    ctx.lineTo(centerX - triangleSize * 0.4, centerY + triangleSize * 0.6);
    ctx.lineTo(centerX + triangleSize * 0.6, centerY);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fill();
    ctx.font = `bold ${Math.floor(width * 0.1)}px Arial`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "center";
    ctx.fillText("VIDEO", centerX, height - 10);
    canvas.toBlob((blob) => {
      if (blob) {
        console.log("[DB] Default video thumbnail created successfully");
        resolve(blob);
      } else {
        reject(new Error("Failed to create default video thumbnail"));
      }
    }, "image/jpeg", 0.85);
  });
}

async function createThumbnailFromVideo(videoDataUrl, maxWidth = 256, maxHeight = 256) {
  try {
    const thumbnailBlob = await extractVideoFrame(videoDataUrl, maxWidth, maxHeight);
    return thumbnailBlob;
  } catch (error) {
    console.warn("[DB] \u65E0\u6CD5\u4ECE\u89C6\u9891\u63D0\u53D6\u7F29\u7565\u56FE\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u5360\u4F4D\u56FE:", error.message);
    return await createDefaultVideoThumbnail(maxWidth, maxHeight);
  }
}

function extractVideoFrame(videoDataUrl, maxWidth, maxHeight) {
  const correctedDataUrl = correctVideoMimeType(videoDataUrl);
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    let resolved = false;
    let timeoutId = null;
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      video.pause();
      video.src = "";
      video.removeAttribute("src");
    };
    const captureFrame = () => {
      if (resolved) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = video.videoWidth || 256;
        let height = video.videoHeight || 256;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob((thumbnailBlob) => {
          cleanup();
          resolved = true;
          if (thumbnailBlob && thumbnailBlob.size > 0) {
            console.log("[DB] Video thumbnail captured successfully");
            resolve(thumbnailBlob);
          } else {
            reject(new Error("Canvas to Blob conversion failed for video thumbnail."));
          }
        }, "image/jpeg", 0.85);
      } catch (err) {
        cleanup();
        resolved = true;
        reject(err);
      }
    };
    video.onloadeddata = () => {
      console.log("[DB] Video loaded, attempting to seek...");
      try {
        const targetTime = Math.min(0.5, video.duration / 4);
        video.currentTime = targetTime;
      } catch (e) {
        console.log("[DB] Cannot seek, capturing current frame");
        captureFrame();
      }
    };
    video.onseeked = () => {
      console.log("[DB] Video seeked, capturing frame...");
      captureFrame();
    };
    video.onerror = (err) => {
      console.error("[DB] Video load error:", err);
      cleanup();
      if (!resolved) {
        resolved = true;
        reject(new Error("Video load failed"));
      }
    };
    timeoutId = setTimeout(() => {
      console.warn("[DB] Video thumbnail extraction timeout");
      if (!resolved) {
        cleanup();
        resolved = true;
        reject(new Error("Video thumbnail extraction timeout."));
      }
    }, 3e3);
    video.src = correctedDataUrl;
    video.load();
  });
}

function correctVideoMimeType(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return dataUrl;
  }
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return dataUrl;
  }
  const header = dataUrl.substring(5, commaIndex);
  const base64Data = dataUrl.substring(commaIndex + 1);
  let correctedMimeType = null;
  if (header.includes("video/h264-mp4") || header.includes("video/h264")) {
    correctedMimeType = "video/mp4";
  } else if (header.includes("video/") && !header.includes("video/mp4") && !header.includes("video/webm") && !header.includes("video/ogg")) {
    if (header.includes("mp4")) {
      correctedMimeType = "video/mp4";
    } else if (header.includes("webm")) {
      correctedMimeType = "video/webm";
    } else {
      correctedMimeType = "video/mp4";
    }
  }
  if (correctedMimeType) {
    const hasBase64 = header.includes(";base64");
    const newHeader = hasBase64 ? `${correctedMimeType};base64` : correctedMimeType;
    console.log(`[DB] \u4FEE\u6B63\u89C6\u9891 MIME \u7C7B\u578B: ${header} -> ${newHeader}`);
    return `data:${newHeader},${base64Data}`;
  }
  return dataUrl;
}

async function migrateOldSettings() {
  if (window.chatu8_old_settings) {
    alert("[Settings Migration] \u68C0\u6D4B\u5230\u65E7\u7248 chatu8 \u8BBE\u7F6E\uFF0C\u5F00\u59CB\u8FC1\u79FB...");
    try {
      const oldSettings = window.chatu8_old_settings;
      const { yushe, novelaiApi, startTag, endTag, workers } = oldSettings;
      const newYushe = {};
      if (yushe && typeof yushe === "object") {
        for (const key in yushe) {
          if (Object.hasOwnProperty.call(yushe, key)) {
            newYushe[`old-${key}`] = yushe[key];
          }
        }
      }
      const newWorkers = {};
      if (workers && typeof workers === "object") {
        for (const key in workers) {
          if (Object.hasOwnProperty.call(workers, key)) {
            newWorkers[`old-${key}`] = workers[key];
          }
        }
      }
      console.log(newWorkers);
      if (Object.keys(newYushe).length > 0) {
        Object.assign(extension_settings[extensionName].yushe, newYushe);
      }
      if (Object.keys(newWorkers).length > 0) {
        Object.assign(extension_settings[extensionName].workers, newWorkers);
      }
      if (novelaiApi) {
        extension_settings[extensionName].novelaiApi = novelaiApi;
      }
      if (startTag) {
        extension_settings[extensionName].startTag = startTag;
      }
      if (endTag) {
        extension_settings[extensionName].endTag = endTag;
      }
      saveSettingsDebounced();
      localStorage.setItem(migrationFlag, "true");
      alert('\u6210\u529F\u4ECE\u65E7\u7248 chatu8 \u811A\u672C\u8FC1\u79FB\u4E86\u8BBE\u7F6E\uFF01\n\u9884\u8BBE\u548C\u5DE5\u4F5C\u6D41\u5DF2\u88AB\u91CD\u547D\u540D\uFF0C\u683C\u5F0F\u4E3A "old-\u540D\u79F0" \u4EE5\u907F\u514D\u51B2\u7A81\u3002');
      console.log("[Settings Migration] \u8BBE\u7F6E\u8FC1\u79FB\u6210\u529F\uFF01", {
        yushe: newYushe,
        workers: newWorkers,
        novelaiApi,
        startTag,
        endTag
      });
    } catch (error) {
      console.error("[Settings Migration] \u8FC1\u79FB\u8BBE\u7F6E\u65F6\u53D1\u751F\u9519\u8BEF:", error);
      alert("\u8FC1\u79FB\u65E7\u7248 chatu8 \u8BBE\u7F6E\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u4E86\u89E3\u8BE6\u60C5\u3002");
      localStorage.setItem(migrationFlag, "true");
    }
  } else {
    localStorage.setItem(migrationFlag, "true");
  }
}

function processMigrationDataForBatch(batchData, oldMetadata, existingMd5s = []) {
  const items = [];
  const metadataFragment = {};
  for (const item of batchData) {
    if (item.id.length === 32 && item.id !== metadataId && item.tupian) {
      const md5 = item.id;
      if (existingMd5s.includes(md5)) {
        continue;
      }
      let imageBuffer;
      if (typeof item.tupian === "string") {
        const base64Data = item.tupian.split(",")[1] || item.tupian;
        imageBuffer = base64ToArrayBuffer(base64Data);
      } else {
        imageBuffer = item.tupian;
      }
      const uuid = generateUUID();
      const date = oldMetadata[md5] && oldMetadata[md5][0] || (/* @__PURE__ */ new Date()).getTime();
      items.push({ id: uuid, data: imageBuffer });
      if (!metadataFragment[md5]) {
        metadataFragment[md5] = {
          images: [],
          index: 0,
          change: ""
        };
      }
      metadataFragment[md5].images.push({
        uuid,
        thumbnail_uuid: null,
        // 缩略图将在之后生成
        date
      });
    }
  }
  return { items, metadataFragment };
}

async function performMigration() {
  console.log("[DB Migration] \u5F00\u59CB\u6570\u636E\u5E93\u8FC1\u79FB (\u5206\u6279\u6A21\u5F0F)...");
  let oldDb;
  const batchSize = 50;
  try {
    const dbs2 = await indexedDB.databases();
    if (!dbs2.some((db2) => db2.name === oldDbName)) {
      console.log("[DB Migration] \u672A\u627E\u5230\u65E7\u6570\u636E\u5E93\u3002\u8DF3\u8FC7\u8FC1\u79FB\u3002");
      alert("\u672A\u627E\u5230\u65E7\u7248\u56FE\u5E93\u6570\u636E\uFF0C\u65E0\u9700\u8FC1\u79FB\u3002");
      localStorage.setItem(migrationFlag, "true");
      return;
    }
    console.log("[DB Migration] \u53D1\u73B0\u65E7\u6570\u636E\u5E93\uFF0C\u6B63\u5728\u51C6\u5907\u8FC1\u79FB...");
    oldDb = await new Promise((resolve, reject) => {
      const request2 = indexedDB.open(oldDbName);
      request2.onsuccess = (e) => resolve(e.target.result);
      request2.onerror = (e) => reject(e.target.error);
    });
    if (!oldDb.objectStoreNames.contains(objectStoreName)) {
      console.log("[DB Migration] \u65E7\u6570\u636E\u5E93\u4E2D\u6CA1\u6709\u6570\u636E\u53EF\u8FC1\u79FB\u3002");
      oldDb.close();
      localStorage.setItem(migrationFlag, "true");
      if (confirm("\u65E7\u6570\u636E\u5E93\u4E3A\u7A7A\uFF0C\u662F\u5426\u5220\u9664\u5B83\u4EE5\u6E05\u7406\u7A7A\u95F4\uFF1F")) {
        await indexedDB.deleteDatabase(oldDbName);
      }
      return;
    }
    const newDb = await openDB();
    const oldTransaction = oldDb.transaction(objectStoreName, "readonly");
    const oldStore = oldTransaction.objectStore(objectStoreName);
    const [oldMetadataRecord, totalCount] = await Promise.all([
      new Promise((resolve, reject) => {
        const getRequest = oldStore.get(metadataId);
        getRequest.onsuccess = (e) => resolve(e.target.result);
        getRequest.onerror = (e) => reject(e.target.error);
      }),
      new Promise((resolve, reject) => {
        const countRequest = oldStore.count();
        countRequest.onsuccess = (e) => resolve(e.target.result);
        countRequest.onerror = (e) => reject(e.target.error);
      })
    ]);
    const oldMetadata = oldMetadataRecord ? JSON.parse(oldMetadataRecord.shuju) : {};
    const existingMetadataRecord = await storeReadOnly(metadataId);
    const finalMetadata = existingMetadataRecord ? JSON.parse(existingMetadataRecord.shuju) : {};
    const existingMd5s = Object.keys(finalMetadata);
    console.log(`[DB Migration] \u5728\u65B0\u6570\u636E\u5E93\u4E2D\u627E\u5230 ${existingMd5s.length} \u4E2A\u5DF2\u5B58\u5728\u7684 MD5\u3002`);
    if (totalCount === 0 || totalCount - 1 <= existingMd5s.length) {
      console.log("[DB Migration] \u65E7\u6570\u636E\u5E93\u4E3A\u7A7A\u6216\u6CA1\u6709\u65B0\u6570\u636E\u3002");
      oldDb.close();
      localStorage.setItem(migrationFlag, "true");
      if (confirm("\u65E7\u6570\u636E\u5E93\u4E3A\u7A7A\u6216\u6CA1\u6709\u65B0\u6570\u636E\uFF0C\u662F\u5426\u5220\u9664\u5B83\uFF1F")) {
        await indexedDB.deleteDatabase(oldDbName);
      }
      return;
    }
    console.log(`[DB Migration] \u65E7\u6570\u636E\u5E93\u603B\u9879\u76EE\u6570: ${totalCount}\u3002\u5F00\u59CB\u8FC1\u79FB...`);
    let processedCount = 0;
    let totalMigratedImages = 0;
    const cursorTransaction = oldDb.transaction(objectStoreName, "readonly");
    const cursorStore = cursorTransaction.objectStore(objectStoreName);
    const request = cursorStore.openCursor();
    let batchData = [];
    const handleBatchAndWrite = async (batch) => {
      if (batch.length === 0) return;
      const { items, metadataFragment } = processMigrationDataForBatch(batch, oldMetadata, existingMd5s);
      if (items.length > 0) {
        const newTransaction = newDb.transaction(objectStoreName, "readwrite");
        const newStore = newTransaction.objectStore(objectStoreName);
        items.forEach((item) => newStore.put(item));
        await new Promise((resolve, reject) => {
          newTransaction.oncomplete = resolve;
          newTransaction.onerror = (e) => reject(e.target.error);
        });
        Object.assign(finalMetadata, metadataFragment);
        totalMigratedImages += items.length;
      }
      processedCount += batch.length;
      console.log(`[DB Migration] \u5DF2\u5904\u7406 ${processedCount}/${totalCount}...`);
    };
    await new Promise((resolve, reject) => {
      request.onerror = (e) => reject(e.target.error);
      request.onsuccess = async (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value && cursor.value.id !== metadataId) {
            batchData.push(cursor.value);
          }
          if (batchData.length >= batchSize) {
            try {
              await handleBatchAndWrite(batchData);
              batchData = [];
            } catch (err) {
              reject(err);
              return;
            }
          }
          cursor.continue();
        } else {
          try {
            if (batchData.length > 0) {
              await handleBatchAndWrite(batchData);
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      };
    });
    oldDb.close();
    if (totalMigratedImages > 0) {
      console.log(`[DB Migration] \u8FC1\u79FB\u5B8C\u6210\uFF01\u603B\u5171\u8FC1\u79FB\u4E86 ${totalMigratedImages} \u5F20\u65B0\u56FE\u7247\u3002\u6B63\u5728\u66F4\u65B0\u6700\u7EC8\u5143\u6570\u636E...`);
      await setMetadata(finalMetadata);
    } else {
      console.log("[DB Migration] \u6CA1\u6709\u53D1\u73B0\u53EF\u8FC1\u79FB\u7684\u65B0\u56FE\u7247\u3002");
    }
    localStorage.setItem(migrationFlag, "true");
    if (confirm(
      `\u6570\u636E\u8FC1\u79FB\u5B8C\u6210\uFF01\u5171\u8FC1\u79FB ${totalMigratedImages} \u5F20\u65B0\u56FE\u7247\u3002

\u662F\u5426\u5220\u9664\u65E7\u7684\u6570\u636E\u5E93\u4EE5\u91CA\u653E\u78C1\u76D8\u7A7A\u95F4\uFF1F

- \u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\u3002
- \u5982\u679C\u4E0D\u786E\u5B9A\uFF0C\u53EF\u4EE5\u9009\u62E9\u201C\u53D6\u6D88\u201D\u3002`
    )) {
      await indexedDB.deleteDatabase(oldDbName);
      console.log("[DB Migration] \u65E7\u6570\u636E\u5E93\u5DF2\u5220\u9664\u3002");
    } else {
      console.log("[DB Migration] \u7528\u6237\u9009\u62E9\u4FDD\u7559\u65E7\u6570\u636E\u5E93\u3002");
    }
    if (totalMigratedImages > 0 && confirm("\u662F\u5426\u4E3A\u65B0\u8FC1\u79FB\u7684\u56FE\u7247\u751F\u6210\u7F29\u7565\u56FE\uFF1F(\u63A8\u8350)")) {
      console.log("[DB Migration] \u5F00\u59CB\u751F\u6210\u7F29\u7565\u56FE...");
      await generateMissingThumbnails();
    }
    console.log("[DB Migration] \u6570\u636E\u5E93\u8FC1\u79FB\u6D41\u7A0B\u5B8C\u6210\u3002");
  } catch (error) {
    console.error("[DB Migration] \u6570\u636E\u5E93\u8FC1\u79FB\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF:", error);
    alert(`\u6570\u636E\u5E93\u8FC1\u79FB\u5931\u8D25: ${error.message}

\u8BF7\u68C0\u67E5\u63A7\u5236\u53F0\u83B7\u53D6\u8BE6\u7EC6\u4FE1\u606F\u3002`);
    if (oldDb) oldDb.close();
    localStorage.setItem(migrationFlag, "true");
  }
}

async function getItemMeta(tag) {
  if (!tag) return { change: "", video: "", activeMode: "" };
  const md5 = CryptoJS.MD5(tag).toString();
  const storage = extension_settings[extensionName].jiuguanStorage || {};
  const serverEntry = storage[md5];
  const metadata = await getMetadata();
  const dbEntry = metadata[md5];
  return {
    change: serverEntry && serverEntry.change || dbEntry && dbEntry.change || "",
    video: serverEntry && serverEntry.video || dbEntry && dbEntry.video || "",
    activeMode: serverEntry && serverEntry.activeMode || dbEntry && dbEntry.activeMode || ""
  };
}

async function ensureCryptoLib() {
  let cryptoLib = window.stChatu8CryptoJS || (typeof CryptoJS !== "undefined" ? CryptoJS : null);
  if (cryptoLib && cryptoLib.MD5) {
    return cryptoLib;
  }
  const start = Date.now();
  while (Date.now() - start < 3e3) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    cryptoLib = window.stChatu8CryptoJS || (typeof CryptoJS !== "undefined" ? CryptoJS : null);
    if (cryptoLib && cryptoLib.MD5) {
      return cryptoLib;
    }
  }
  return cryptoLib;
}

async function getItemImg(tag, index = null) {
  const cryptoLib = await ensureCryptoLib();
  if (!cryptoLib || !cryptoLib.MD5) {
    console.warn("[DB] CryptoJS \u5C1A\u672A\u5C31\u7EEA\uFF0C\u6682\u65E0\u6CD5\u89E3\u6790\u56FE\u7247MD5:", tag);
    return [false, false, false, false, "", "", ""];
  }
  const md5 = cryptoLib.MD5(tag).toString();
  const storage = extension_settings[extensionName].jiuguanStorage || {};
  const serverEntry = storage[md5];
  const metadata = await getMetadata();
  const dbEntry = metadata[md5];
  const change = serverEntry && serverEntry.change || dbEntry && dbEntry.change || "";
  const video = serverEntry && serverEntry.video || dbEntry && dbEntry.video || "";
  const activeMode = serverEntry && serverEntry.activeMode || dbEntry && dbEntry.activeMode || "";
  const merged = await getMergedAndSortedImages(md5);
  if (merged.images.length === 0) {
    return [false, change, false, false, "", video, activeMode];
  }
  console.log(`[DB] \u83B7\u53D6\u56FE\u7247 ${tag}...`, merged.currentIndex);
  let finalIndex = index;
  if (finalIndex === null || finalIndex === void 0) {
    finalIndex = merged.currentIndex;
  }
  if (finalIndex < 0) finalIndex = 0;
  if (finalIndex >= merged.images.length) finalIndex = merged.images.length - 1;
  await syncIndexToStorage(md5, finalIndex, merged.images);
  const imageEntry = merged.images[finalIndex];
  if (!imageEntry) return [false, change, false, false, "", video, activeMode];
  const isVideo = imageEntry.isVideo || false;
  const originalUrl = imageEntry.originalUrl || "";
  if (imageEntry.source === "server" && imageEntry.path) {
    try {
      const response = await fetch(imageEntry.path);
      if (response.ok) {
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        return [base64, change, finalIndex, isVideo, originalUrl, video, activeMode];
      }
    } catch (error) {
      console.error("Failed to fetch image from server:", error);
    }
  } else if (imageEntry.source === "db" && imageEntry.uuid) {
    const imageData = await storeReadOnly(imageEntry.uuid);
    if (imageData && imageData.data) {
      const mimeType = imageEntry.format ? formatToMimeType(imageEntry.format, isVideo) : detectMimeFromBuffer(imageData.data, isVideo);
      const mediaBase64 = `data:${mimeType};base64,` + arrayBufferToBase64(imageData.data);
      return [mediaBase64, change, finalIndex, isVideo, originalUrl, video, activeMode];
    }
  }
  return [false, false, false, false, "", "", ""];
}

async function setItemImg(tag, imgBase64, options = { format: "png" }) {
  if (isTailEnabled() && options && options.__tailRun !== true) {
    const carry = { hasTail: false, imagePath: null };
    const frontPath = await setItemImg(tag, imgBase64, Object.assign({}, options, { __tailRun: true, __tailPhase: "front", __tailCarry: carry }));
    if (!carry.hasTail) return frontPath;
    const jobId = tailEnqueue("setItemImg:tail", function(tailJob) {
      return setItemImg(tag, imgBase64, Object.assign({}, options, {
        __tailRun: true,
        __tailPhase: "tail",
        __tailCarry: carry,
        __tailJob: tailJob,
        __tailSignal: tailJob ? tailJob.signal : null
      }));
    }, {
      onSuccess: typeof options.onTailSuccess === "function" ? options.onTailSuccess : null,
      onError: typeof options.onTailError === "function" ? options.onTailError : null
    });
    return frontPath;
  }
  const { change = "", video = "", activeMode = "", characterName = "chatu8", filename, format, isVideo = false, originalUrl = "", genParams = null } = options;
  if (extension_settings[extensionName].jiuguanchucun === "true") {
    if (options.__tailPhase === "tail") {
      const tailCarry = options.__tailCarry || {};
      const tailMd5 = tailCarry.md5;
      let thumbnailPath = null;
      let thumbnailSize = 0;
      try {
        await tailStep(options);
        let thumbnailBlob;
        if (isVideo) {
          thumbnailBlob = await createThumbnailFromVideo(imgBase64);
        } else {
          thumbnailBlob = await createThumbnailFromBuffer(base64ToArrayBuffer(tailCarry.base64Data));
        }
        const thumbnailBase64 = await blobToBase64(thumbnailBlob);
        const thumbnailData = thumbnailBase64.split(",")[1] || thumbnailBase64;
        const thumbnailUploadBody = {
          image: thumbnailData,
          format: "jpeg"
        };
        if (characterName) {
          thumbnailUploadBody.ch_name = characterName;
        }
        if (filename) {
          thumbnailUploadBody.filename = `thumb_${filename || tailCarry.uuid}`;
        }
        const thumbnailResponse = await fetch("/api/images/upload", {
          method: "POST",
          headers: getRequestHeaders(window.token),
          body: JSON.stringify(thumbnailUploadBody),
          signal: options.__tailSignal || void 0
        });
        if (thumbnailResponse.ok) {
          const thumbnailResult = await thumbnailResponse.json();
          thumbnailPath = thumbnailResult.path;
          thumbnailSize = base64ByteLength(thumbnailData);
        } else {
          console.error("Failed to upload thumbnail:", thumbnailResponse.statusText);
        }
      } catch (thumbnailError) {
        console.error("Failed to create or upload thumbnail:", thumbnailError);
      }
      await tailStep(options);
      if (tailCarry.entry) {
        tailCarry.entry.thumbnail_path = thumbnailPath;
        tailCarry.entry.thumbnail_size = thumbnailSize;
      }
      scheduleSettingsSave("index");
      flushSettingsSave();
      await tailStep(options);
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (!window.imagesid) window.imagesid = {};
      window.imagesid[tailMd5] = tailCarry.newDate;
      try {
        await updateStegoImage({ throwOnError: true });
      } catch (stegoError) {
        const stegoMessage = stegoError?.message ? stegoError.message : String(stegoError);
        const wrapped = new Error("\u9690\u5199\u7D22\u5F15\u5199\u5165\u5931\u8D25\uFF08\u56FE\u7247\u4E0E\u7D22\u5F15\u672C\u8EAB\u5DF2\u4FDD\u5B58\uFF09: " + stegoMessage);
        wrapped.__chatu8TailFailureKind = "stego";
        throw wrapped;
      }
      return tailCarry.imagePath;
    }
    const md5 = CryptoJS.MD5(tag).toString();
    const uuid = generateUUID();
    const thumbnailUUID = generateUUID();
    const newDate = (/* @__PURE__ */ new Date()).getTime();
    await tailStep(options);
    const base64Data = imgBase64.split(",")[1] || imgBase64;
    let uploadFormat = "png";
    if (isVideo) {
      if (format && format.includes("mp4")) {
        uploadFormat = "mp4";
      } else if (format && format.includes("webm")) {
        uploadFormat = "webm";
      } else {
        uploadFormat = "mp4";
      }
    } else if (format && !format.startsWith("video/") && !format.startsWith("image")) {
      uploadFormat = format;
    }
    const uploadBody = {
      image: base64Data,
      format: uploadFormat
    };
    if (characterName) {
      uploadBody.ch_name = characterName;
    }
    if (filename) {
      uploadBody.filename = filename;
    }
    console.log(`[DB] Uploading ${isVideo ? "video" : "image"} to server, format: ${uploadFormat}, size: ${base64Data.length} chars`);
    try {
      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify(uploadBody),
        signal: options.__tailSignal || void 0
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      const result = await response.json();
      const imagePath = result.path;
      let thumbnailPath = null;
      let thumbnailSize = 0;
      if (options.__tailPhase !== "front") {
        try {
          await tailStep(options);
          let thumbnailBlob;
          if (isVideo) {
            thumbnailBlob = await createThumbnailFromVideo(imgBase64);
          } else {
            const imageBuffer = base64ToArrayBuffer(base64Data);
            thumbnailBlob = await createThumbnailFromBuffer(imageBuffer);
          }
          const thumbnailBase64 = await blobToBase64(thumbnailBlob);
          const thumbnailData = thumbnailBase64.split(",")[1] || thumbnailBase64;
          const thumbnailUploadBody = {
            image: thumbnailData,
            format: "jpeg"
          };
          if (characterName) {
            thumbnailUploadBody.ch_name = characterName;
          }
          if (filename) {
            thumbnailUploadBody.filename = `thumb_${filename || uuid}`;
          }
          const thumbnailResponse = await fetch("/api/images/upload", {
            method: "POST",
            headers: getRequestHeaders(window.token),
            body: JSON.stringify(thumbnailUploadBody),
            signal: options.__tailSignal || void 0
          });
          if (thumbnailResponse.ok) {
            const thumbnailResult = await thumbnailResponse.json();
            thumbnailPath = thumbnailResult.path;
            thumbnailSize = base64ByteLength(thumbnailData);
          } else {
            console.error("Failed to upload thumbnail:", thumbnailResponse.statusText);
          }
        } catch (thumbnailError) {
          console.error("Failed to create or upload thumbnail:", thumbnailError);
        }
      }
      if (!extension_settings[extensionName].jiuguanStorage) {
        extension_settings[extensionName].jiuguanStorage = {};
      }
      const storage = extension_settings[extensionName].jiuguanStorage;
      const newImageEntry = {
        uuid,
        path: imagePath,
        thumbnail_uuid: thumbnailUUID,
        thumbnail_path: thumbnailPath,
        date: newDate,
        isVideo,
        format: uploadFormat || format || (isVideo ? "mp4" : "png"),
        originalUrl: originalUrl || "",
        size: base64ByteLength(base64Data),
        thumbnail_size: thumbnailSize,
        ...genParams ? { genParams } : {}
      };
      const entry = storage[md5];
      if (entry) {
        if (!entry.images) entry.images = [];
        entry.images.push(newImageEntry);
        if (change !== void 0 && change !== "") entry.change = change;
        if (video !== void 0 && video !== "") entry.video = video;
        if (activeMode !== void 0 && activeMode !== "") entry.activeMode = activeMode;
      } else {
        storage[md5] = {
          images: [newImageEntry],
          index: 0,
          change: change || "",
          video: video || "",
          activeMode: activeMode || ""
        };
      }
      await tailStep(options);
      if (options.__tailPhase === "front") {
        const frontMerged = await getMergedAndSortedImages(md5);
        let frontIndex = frontMerged.images.findIndex((img) => img.uuid === uuid);
        if (frontIndex === -1) {
          frontIndex = frontMerged.images.length > 0 ? frontMerged.images.length - 1 : 0;
        }
        await syncIndexToStorage(md5, frontIndex, frontMerged.images, true);
        if (options.__tailCarry) {
          options.__tailCarry.hasTail = true;
          options.__tailCarry.imagePath = imagePath;
          options.__tailCarry.md5 = md5;
          options.__tailCarry.uuid = uuid;
          options.__tailCarry.newDate = newDate;
          options.__tailCarry.base64Data = base64Data;
          options.__tailCarry.storage = storage;
          options.__tailCarry.entry = newImageEntry;
        }
        return imagePath;
      }
      const merged = await getMergedAndSortedImages(md5);
      let newIndex = merged.images.findIndex((img) => img.uuid === uuid);
      if (newIndex === -1) {
        newIndex = merged.images.length > 0 ? merged.images.length - 1 : 0;
      }
      await syncIndexToStorage(md5, newIndex, merged.images, true);
      scheduleSettingsSave("index");
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (!window.imagesid) window.imagesid = {};
      window.imagesid[md5] = newDate;
      await tailStep(options);
      await updateStegoImage();
      return imagePath;
    } catch (error) {
      console.error("Failed to upload image to server:", error);
      throw error;
    }
  } else {
    if (options.__tailPhase === "tail") {
      const tailCarry = options.__tailCarry || {};
      const tailMd5 = tailCarry.md5;
      let tailThumbnailSize = 0;
      try {
        await tailStep(options);
        let thumbnailBlob;
        if (isVideo) {
          thumbnailBlob = await createThumbnailFromVideo(imgBase64);
        } else {
          thumbnailBlob = await createThumbnailFromBuffer(base64ToArrayBuffer(tailCarry.base64Data));
        }
        const thumbnailBuffer = await thumbnailBlob.arrayBuffer();
        tailThumbnailSize = thumbnailBuffer.byteLength;
        await storeReadWrite({ id: tailCarry.thumbnailUUID, data: thumbnailBuffer });
      } catch (thumbnailError) {
        console.error("Failed to create or store thumbnail:", thumbnailError);
      }
      await tailStep(options);
      if (tailCarry.entry) tailCarry.entry.thumbnail_size = tailThumbnailSize;
      await setMetadata(tailCarry.metadata);
      if (tailCarry.settingsTouched) {
        scheduleSettingsSave("index");
        flushSettingsSave();
      }
      if (!window.imagesid) window.imagesid = {};
      window.imagesid[tailMd5] = tailCarry.newDate;
      return "indexeddb_saved";
    }
    const md5 = CryptoJS.MD5(tag).toString();
    const imageBuffer = base64ToArrayBuffer(imgBase64.split(",")[1] || imgBase64);
    const uuid = generateUUID();
    const newDate = (/* @__PURE__ */ new Date()).getTime();
    const thumbnailUUID = generateUUID();
    let thumbnailSize = 0;
    if (options.__tailPhase !== "front") {
      try {
        await tailStep(options);
        let thumbnailBlob;
        if (isVideo) {
          thumbnailBlob = await createThumbnailFromVideo(imgBase64);
        } else {
          thumbnailBlob = await createThumbnailFromBuffer(imageBuffer);
        }
        const thumbnailBuffer = await thumbnailBlob.arrayBuffer();
        thumbnailSize = thumbnailBuffer.byteLength;
        await storeReadWrite({ id: thumbnailUUID, data: thumbnailBuffer });
      } catch (error) {
        console.error("Failed to create or store thumbnail:", error);
      }
    }
    await storeReadWrite({ id: uuid, data: imageBuffer });
    const metadata = await getMetadata();
    const entry = metadata[md5];
    const newImageEntry = {
      uuid,
      thumbnail_uuid: thumbnailUUID,
      date: newDate,
      isVideo,
      format: format || (isVideo ? "mp4" : "png"),
      originalUrl: originalUrl || "",
      size: imageBuffer.byteLength,
      thumbnail_size: thumbnailSize,
      ...genParams ? { genParams } : {}
    };
    if (entry) {
      if (!entry.images) entry.images = [];
      entry.images.push(newImageEntry);
      if (change !== void 0 && change !== "") entry.change = change;
      if (video !== void 0 && video !== "") entry.video = video;
      if (activeMode !== void 0 && activeMode !== "") entry.activeMode = activeMode;
    } else {
      metadata[md5] = {
        images: [newImageEntry],
        index: 0,
        change: change || "",
        video: video || "",
        activeMode: activeMode || ""
      };
    }
    await tailStep(options);
    await setMetadata(metadata);
    if (options.__tailPhase === "front") {
      const frontMerged = await getMergedAndSortedImages(md5);
      let frontIndex = frontMerged.images.findIndex((img) => img.uuid === uuid);
      if (frontIndex === -1) {
        frontIndex = frontMerged.images.length > 0 ? frontMerged.images.length - 1 : 0;
      }
      const frontSettingsTouched = !!(extension_settings[extensionName].jiuguanStorage && extension_settings[extensionName].jiuguanStorage[md5]);
      await syncIndexToStorage(md5, frontIndex, frontMerged.images);
      if (options.__tailCarry) {
        options.__tailCarry.hasTail = true;
        options.__tailCarry.imagePath = "indexeddb_saved";
        options.__tailCarry.md5 = md5;
        options.__tailCarry.uuid = uuid;
        options.__tailCarry.thumbnailUUID = thumbnailUUID;
        options.__tailCarry.newDate = newDate;
        options.__tailCarry.base64Data = imgBase64.split(",")[1] || imgBase64;
        options.__tailCarry.metadata = metadata;
        options.__tailCarry.entry = newImageEntry;
        options.__tailCarry.settingsTouched = frontSettingsTouched;
      }
      return "indexeddb_saved";
    }
    const merged = await getMergedAndSortedImages(md5);
    let newIndex = merged.images.findIndex((img) => img.uuid === uuid);
    if (newIndex === -1) {
      newIndex = merged.images.length > 0 ? merged.images.length - 1 : 0;
    }
    await syncIndexToStorage(md5, newIndex, merged.images);
    if (!window.imagesid) window.imagesid = {};
    window.imagesid[md5] = newDate;
    return "indexeddb_saved";
  }
}

function awaitIdbRequest(request, transaction = null, timeoutMs = 3e4) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;
    const cleanup = () => {
      settled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        if (settled) return;
        cleanup();
        try {
          if (transaction && typeof transaction.abort === "function") {
            transaction.abort();
          }
        } catch (_) {
        }
        reject(new Error(`[IDB] \u64CD\u4F5C\u8D85\u65F6\u7194\u65AD (${timeoutMs}ms)`));
      }, timeoutMs);
    }
    request.onsuccess = (event) => {
      if (settled) return;
      cleanup();
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      if (settled) return;
      cleanup();
      reject(event.target.error || new Error("[IDB] Request \u9519\u8BEF"));
    };
    if (transaction) {
      transaction.onabort = (event) => {
        if (settled) return;
        cleanup();
        const err = transaction.error || event && event.target && event.target.error || new Error("[IDB] Transaction \u4E8B\u52A1\u88AB\u4E2D\u6B62 (onabort)");
        reject(err);
      };
      transaction.onerror = (event) => {
        if (settled) return;
        cleanup();
        reject(transaction.error || event && event.target && event.target.error || new Error("[IDB] Transaction \u9519\u8BEF"));
      };
    }
  });
}

async function openDB() {
  if (db) {
    return db;
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const openTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("[DB] \u6253\u5F00\u6570\u636E\u5E93\u8D85\u65F6 (30000ms)\uFF0C\u53EF\u80FD\u88AB\u540E\u53F0\u5347\u7EA7\u6216\u8FDE\u63A5\u6B7B\u9501\u963B\u6B62"));
      }
    }, 3e4);
    const cleanupTimer = () => {
      settled = true;
      clearTimeout(openTimeout);
    };
    const request = indexedDB.open(dbName, dbVersion);
    request.onblocked = (event) => {
      console.warn("[DB] \u6570\u636E\u5E93\u6253\u5F00\u88AB\u963B\u585E (onblocked)\uFF0C\u53EF\u80FD\u5176\u4ED6\u9875\u9762\u6B63\u5728\u4F7F\u7528\u65E7\u7248\u8FDE\u63A5\uFF0C\u7B49\u5F85\u4E2D...", event);
    };
    request.onupgradeneeded = (event) => {
      const tempDb = event.target.result;
      console.log(`[DB] \u6570\u636E\u5E93\u5347\u7EA7: \u65E7\u7248\u672C ${event.oldVersion} -> \u65B0\u7248\u672C ${event.newVersion}`);
      if (!tempDb.objectStoreNames.contains(objectStoreName)) {
        tempDb.createObjectStore(objectStoreName, { keyPath: "id" });
        console.log(`[DB] Object store '${objectStoreName}' created.`);
      }
      if (!tempDb.objectStoreNames.contains("vocabularies")) {
        tempDb.createObjectStore("vocabularies", { keyPath: "fileName" });
        console.log('[DB] Object store "vocabularies" created.');
      }
      if (!tempDb.objectStoreNames.contains("groups")) {
        const groupsStore = tempDb.createObjectStore("groups", { keyPath: "id_index" });
        groupsStore.createIndex("fileName", "fileName", { unique: false });
        console.log('[DB] Object store "groups" created with fileName index.');
      }
      if (!tempDb.objectStoreNames.contains("subgroups")) {
        const subgroupsStore = tempDb.createObjectStore("subgroups", { keyPath: "id_index" });
        subgroupsStore.createIndex("fileName", "fileName", { unique: false });
        console.log('[DB] Object store "subgroups" created with fileName index.');
      }
      if (!tempDb.objectStoreNames.contains("tags")) {
        const tagsStore = tempDb.createObjectStore("tags", { autoIncrement: true });
        tagsStore.createIndex("fileName", "fileName", { unique: false });
        tagsStore.createIndex("hot", "hot", { unique: false });
        console.log('[DB] Object store "tags" created with fileName and hot indexes.');
      }
      if (event.oldVersion < 5) {
        if (tempDb.objectStoreNames.contains("tags")) {
          const tagsStore = event.target.transaction.objectStore("tags");
          if (!tagsStore.indexNames.contains("hot")) {
            tagsStore.createIndex("hot", "hot", { unique: false });
            console.log('[DB] Index "hot" created for "tags" store.');
          }
        }
      }
      if (event.oldVersion < 6) {
        console.log("[DB] Upgrading to v6: Add default hot value to tags.json entries.");
        const tagsStore = event.target.transaction.objectStore("tags");
        const index = tagsStore.index("fileName");
        const request2 = index.openCursor(IDBKeyRange.only("tags.json"));
        request2.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            const record = cursor.value;
            if (record.hot === void 0) {
              record.hot = -1;
            }
            cursor.update(record);
            cursor.continue();
          } else {
            console.log("[DB] v6 upgrade complete for tags.json.");
          }
        };
      }
    };
    request.onerror = (event) => {
      if (settled) return;
      cleanupTimer();
      console.error("[DB] \u6253\u5F00\u6570\u636E\u5E93\u5931\u8D25:", event.target.error);
      reject(event.target.error);
    };
    request.onsuccess = (event) => {
      if (settled) return;
      cleanupTimer();
      db = event.target.result;
      console.log(`[DB] \u6570\u636E\u5E93 '${dbName}' v${dbVersion} \u6253\u5F00\u6210\u529F\u3002`);
      resolve(db);
    };
  });
}

async function storeReadWrite(data) {
  const dbInstance = db || await openDB();
  const transaction = dbInstance.transaction([objectStoreName], "readwrite");
  const objectStore = transaction.objectStore(objectStoreName);
  const request = objectStore.put(data);
  return await awaitIdbRequest(request, transaction, 6e4);
}

async function getManualTags() {
  const db2 = await openDB();
  const transaction = db2.transaction("tags", "readonly");
  const store = transaction.objectStore("tags");
  const index = store.index("fileName");
  const request = index.getAll(IDBKeyRange.only("manual"));
  return await awaitIdbRequest(request, transaction, 3e4);
}

async function deleteTagByName(tagName) {
  const db2 = await openDB();
  const transaction = db2.transaction("tags", "readwrite");
  const store = transaction.objectStore("tags");
  const request = store.openCursor();
  let keyToDelete = null;
  await new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.name === tagName && cursor.value.fileName === "manual") {
          keyToDelete = cursor.primaryKey;
          cursor.delete();
          resolve();
          return;
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = (event) => reject(event.target.error);
    transaction.onabort = () => reject(new Error("[IDB] \u5220\u9664\u6807\u7B7E\u4E8B\u52A1\u88AB\u4E2D\u6B62"));
  });
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      if (keyToDelete !== null) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    transaction.onerror = (event) => reject(event.target.error);
    transaction.onabort = () => reject(new Error("[IDB] \u5220\u9664\u6807\u7B7E\u4E8B\u52A1\u88AB\u4E2D\u6B62"));
  });
}

async function storeReadOnly(id) {
  const dbInstance = db || await openDB();
  const transaction = dbInstance.transaction([objectStoreName], "readonly");
  const objectStore = transaction.objectStore(objectStoreName);
  const request = objectStore.get(id);
  return await awaitIdbRequest(request, transaction, 3e4);
}

async function storeDelete(id) {
  const dbInstance = db || await openDB();
  const transaction = dbInstance.transaction([objectStoreName], "readwrite");
  const objectStore = transaction.objectStore(objectStoreName);
  const request = objectStore.delete(id);
  return await awaitIdbRequest(request, transaction, 3e4);
}

function __chatu8T03Enabled() {
  if (__chatu8T03EnabledMemo === void 0) {
    __chatu8T03EnabledMemo = isPerfFeatureEnabled("metadataCache", true);
  }
  return __chatu8T03EnabledMemo;
}

function __chatu8T03Ttl() {
  if (__chatu8T03TtlMemo === void 0) {
    const cfg = typeof window !== "undefined" ? window.__chatu8perf : null;
    const ttl = cfg?.metadataCacheTtlMs;
    __chatu8T03TtlMemo = typeof ttl === "number" && ttl >= 0 ? ttl : 4e3;
  }
  return __chatu8T03TtlMemo;
}

function __chatu8T03Invalidate(reason) {
  __chatu8T03Gen++;
  __chatu8T03Cache = null;
  __chatu8T03Stats.invalidations++;
  __chatu8T03Stats.lastReason = reason || "";
}

async function __chatu8T03LoadMetadata() {
  for (let attempt = 0; attempt < 2; attempt++) {
    const genAtStart = __chatu8T03Gen;
    const data = await storeReadOnly(metadataId);
    if (!data || !data.shuju) return {};
    let parsed;
    try {
      parsed = JSON.parse(data.shuju);
    } catch (e) {
      console.error("Failed to parse image metadata:", e);
      __chatu8T03Invalidate("parse-error");
      return {};
    }
    __chatu8T03Stats.parses++;
    if (genAtStart === __chatu8T03Gen) {
      __chatu8T03Cache = { data: parsed, gen: __chatu8T03Gen, ts: Date.now() };
      return parsed;
    }
    if (attempt === 1) return parsed;
  }
  return {};
}

async function getMetadata() {
  if (__chatu8T03Enabled()) {
    const cached = __chatu8T03Cache;
    __chatu8T03Stats.reads++;
    if (cached && cached.gen === __chatu8T03Gen && Date.now() - cached.ts <= __chatu8T03Ttl()) {
      __chatu8T03Stats.hits++;
      return cached.data;
    }
    if (__chatu8T03Pending) {
      __chatu8T03Stats.joins++;
      return __chatu8T03Pending;
    }
    __chatu8T03Stats.misses++;
    __chatu8T03Pending = __chatu8T03LoadMetadata();
    try {
      return await __chatu8T03Pending;
    } finally {
      __chatu8T03Pending = null;
    }
  }
  const data = await storeReadOnly(metadataId);
  if (data && data.shuju) {
    try {
      return JSON.parse(data.shuju);
    } catch (e) {
      console.error("Failed to parse image metadata:", e);
    }
  }
  return {};
}

async function setMetadata(metadata) {
  try {
    await storeReadWrite({ id: metadataId, shuju: JSON.stringify(metadata) });
  } catch (e) {
    if (__chatu8T03Enabled()) __chatu8T03Invalidate("write-failed");
    throw e;
  }
  if (__chatu8T03Enabled()) {
    __chatu8T03Stats.writes++;
    __chatu8T03Gen++;
    __chatu8T03Cache = { data: metadata, gen: __chatu8T03Gen, ts: Date.now() };
  }
}

async function generateMissingThumbnails() {
  console.log("Checking for missing thumbnails...");
  const metadata = await getMetadata();
  let updated = false;
  let needsGeneration = false;
  for (const md5 in metadata) {
    const entry = metadata[md5];
    if (entry && entry.images) {
      if (entry.images.some((image) => !image.thumbnail_uuid)) {
        needsGeneration = true;
        break;
      }
    }
  }
  if (!needsGeneration) {
    console.log("No missing thumbnails found. Aborting generation.");
    return;
  }
  for (const md5 in metadata) {
    const entry = metadata[md5];
    if (entry && entry.images) {
      for (const image of entry.images) {
        if (!image.thumbnail_uuid) {
          console.log(`Generating thumbnail for image ${image.uuid}...`);
          try {
            const imageData = await storeReadOnly(image.uuid);
            if (imageData && imageData.data) {
              const thumbnailBlob = await createThumbnailFromBuffer(imageData.data);
              const thumbnailBuffer = await thumbnailBlob.arrayBuffer();
              const thumbnailUUID = generateUUID();
              await storeReadWrite({ id: thumbnailUUID, data: thumbnailBuffer });
              image.thumbnail_uuid = thumbnailUUID;
              updated = true;
              console.log(`Thumbnail ${thumbnailUUID} created for image ${image.uuid}.`);
            }
          } catch (err) {
            console.error(`Failed to generate thumbnail for ${image.uuid}:`, err);
          }
          await new Promise((resolve) => setTimeout(resolve, 2e3));
        }
      }
    }
  }
  if (updated) {
    console.log("Finished generating missing thumbnails. Saving metadata...");
    await setMetadata(metadata);
  }
}

async function getItemBlob(tag, index = null) {
  const md5 = CryptoJS.MD5(tag).toString();
  const storage = extension_settings[extensionName].jiuguanStorage || {};
  const serverEntry = storage[md5];
  if (serverEntry && Array.isArray(serverEntry.images) && serverEntry.images.length > 0) {
    let finalIndex = index;
    if (finalIndex === null || finalIndex === void 0) {
      finalIndex = serverEntry.index || 0;
    }
    if (finalIndex < 0 || finalIndex >= serverEntry.images.length) {
      finalIndex = serverEntry.images.length - 1;
    }
    const imageEntry = serverEntry.images[finalIndex];
    if (imageEntry && imageEntry.path) {
      try {
        const response = await fetch(imageEntry.path);
        if (response.ok) {
          return await response.blob();
        }
      } catch (error) {
        console.error("Failed to fetch image blob from server:", error);
      }
    }
  }
  const metadata = await getMetadata();
  const dbEntry = metadata[md5];
  if (dbEntry && Array.isArray(dbEntry.images) && dbEntry.images.length > 0) {
    let finalIndex = index;
    if (finalIndex === null || finalIndex === void 0) {
      finalIndex = dbEntry.index || 0;
    }
    if (finalIndex < 0 || finalIndex >= dbEntry.images.length) {
      finalIndex = dbEntry.images.length - 1;
    }
    const imageEntry = dbEntry.images[finalIndex];
    if (!imageEntry) return null;
    const uuid = imageEntry.uuid;
    const imageData = await storeReadOnly(uuid);
    if (imageData && imageData.data) {
      const isVideo = imageEntry.isVideo || false;
      const mimeType = imageEntry.format ? formatToMimeType(imageEntry.format, isVideo) : detectMimeFromBuffer(imageData.data, isVideo);
      return new Blob([imageData.data], { type: mimeType });
    }
  }
  return null;
}

async function updateItemImgChange(tag, change) {
  if (!tag) return;
  const md5 = CryptoJS.MD5(tag).toString();
  let updated = false;
  if (!extension_settings[extensionName].jiuguanStorage) {
    extension_settings[extensionName].jiuguanStorage = {};
  }
  const storage = extension_settings[extensionName].jiuguanStorage;
  if (storage[md5]) {
    storage[md5].change = change;
    saveSettingsDebounced();
    updated = true;
  } else {
    storage[md5] = {
      images: [],
      index: 0,
      change,
      video: "",
      activeMode: "image"
    };
    saveSettingsDebounced();
    updated = true;
  }
  const metadata = await getMetadata();
  if (metadata[md5]) {
    metadata[md5].change = change;
    await setMetadata(metadata);
    updated = true;
  } else {
    metadata[md5] = {
      images: [],
      index: 0,
      change,
      video: "",
      activeMode: "image"
    };
    await setMetadata(metadata);
    updated = true;
  }
  if (updated) {
    await updateStegoImage();
    console.log(`[DB] Successfully updated change for tag ${tag}`);
  } else {
    console.warn(`[DB] Could not find storage entry to update change for tag ${tag}`);
  }
}

async function updateItemImgVideo(tag, video) {
  const md5 = CryptoJS.MD5(tag).toString();
  let updated = false;
  if (extension_settings[extensionName].jiuguanStorage) {
    const storage = extension_settings[extensionName].jiuguanStorage;
    if (storage[md5]) {
      storage[md5].video = video;
      saveSettingsDebounced();
      updated = true;
    } else {
      storage[md5] = {
        images: [],
        index: 0,
        change: "",
        video,
        activeMode: "video"
      };
      saveSettingsDebounced();
      updated = true;
    }
  }
  const metadata = await getMetadata();
  if (metadata[md5]) {
    metadata[md5].video = video;
    await setMetadata(metadata);
    updated = true;
  } else {
    metadata[md5] = {
      images: [],
      index: 0,
      change: "",
      video,
      activeMode: "video"
    };
    await setMetadata(metadata);
    updated = true;
  }
  if (updated) {
    await updateStegoImage();
    console.log(`[DB] Successfully updated video for tag ${tag}`);
  } else {
    console.warn(`[DB] Could not find storage entry to update video for tag ${tag}`);
  }
}

async function updateItemImgActiveMode(tag, activeMode) {
  const md5 = CryptoJS.MD5(tag).toString();
  let updated = false;
  if (extension_settings[extensionName].jiuguanStorage) {
    const storage = extension_settings[extensionName].jiuguanStorage;
    if (storage[md5]) {
      storage[md5].activeMode = activeMode;
      saveSettingsDebounced();
      updated = true;
    }
  }
  const metadata = await getMetadata();
  if (metadata[md5]) {
    metadata[md5].activeMode = activeMode;
    await setMetadata(metadata);
    updated = true;
  }
  if (updated) {
    await updateStegoImage();
    console.log(`[DB] Successfully updated activeMode (${activeMode}) for tag ${tag}`);
  }
}

async function updateImageIndex(tag, index) {
  const md5 = CryptoJS.MD5(tag).toString();
  const merged = await getMergedAndSortedImages(md5);
  if (merged.images.length === 0) {
    console.error(`No images found for tag ${tag}`);
    return;
  }
  await syncIndexToStorage(md5, index, merged.images);
  await updateStegoImage();
}

async function deleteImage(tag, index) {
  const md5 = CryptoJS.MD5(tag).toString();
  const merged = await getMergedAndSortedImages(md5);
  if (!merged.images || merged.images.length === 0) {
    console.warn(`No images found for tag: ${tag}`);
    return;
  }
  if (index < 0 || index >= merged.images.length) {
    console.error(`Index ${index} out of bounds for tag ${tag}`);
    return;
  }
  const imageToDelete = merged.images[index];
  const source = imageToDelete.source;
  if (source === "server") {
    const storage = extension_settings[extensionName].jiuguanStorage;
    const serverEntry = storage?.[md5];
    if (serverEntry && Array.isArray(serverEntry.images)) {
      const serverIndex = serverEntry.images.findIndex((img) => img.uuid === imageToDelete.uuid);
      if (serverIndex !== -1) {
        const [deleted] = serverEntry.images.splice(serverIndex, 1);
        const pathsToDelete = [];
        if (deleted.path) pathsToDelete.push(deleted.path);
        if (deleted.thumbnail_path) pathsToDelete.push(deleted.thumbnail_path);
        for (const path of pathsToDelete) {
          try {
            const response = await fetch("/api/images/delete", {
              method: "POST",
              headers: getRequestHeaders(window.token),
              body: JSON.stringify({ path })
            });
            if (!response.ok) {
              console.error(`Failed to delete image from server: ${response.statusText}`);
            }
          } catch (error) {
            console.error("Failed to delete image from server:", error);
          }
        }
        if (serverEntry.images.length === 0) {
          delete storage[md5];
        } else {
          if (serverEntry.index >= serverEntry.images.length) {
            serverEntry.index = serverEntry.images.length - 1;
          }
        }
        saveSettingsDebounced();
        await updateStegoImage();
      }
    }
  } else if (source === "db") {
    const metadata = await getMetadata();
    const dbEntry = metadata[md5];
    if (dbEntry && Array.isArray(dbEntry.images)) {
      const dbIndex = dbEntry.images.findIndex((img) => img.uuid === imageToDelete.uuid);
      if (dbIndex !== -1) {
        const [deleted] = dbEntry.images.splice(dbIndex, 1);
        if (deleted.uuid) {
          await storeDelete(deleted.uuid);
        }
        if (deleted.thumbnail_uuid) {
          await storeDelete(deleted.thumbnail_uuid);
        }
        if (dbEntry.images.length === 0) {
          delete metadata[md5];
        } else {
          if (dbEntry.index >= dbEntry.images.length) {
            dbEntry.index = dbEntry.images.length - 1;
          }
        }
        await setMetadata(metadata);
      }
    }
  }
  if (window.imagesid && window.imagesid[md5]) {
    const updatedMerged = await getMergedAndSortedImages(md5);
    if (updatedMerged.images.length === 0) {
      delete window.imagesid[md5];
    } else {
      const dates = updatedMerged.images.map((img) => img.date).filter((d) => d);
      if (dates.length > 0) {
        window.imagesid[md5] = Math.max(...dates);
      } else {
        delete window.imagesid[md5];
      }
    }
  }
}

async function migrateDatabase() {
  console.log("Manual database migration triggered...");
  try {
    await migrateOldSettings();
    if (confirm("\u662F\u5426\u67E5\u627E\u8FC1\u79FB\u6570\u636E\u5E93(\u7F13\u5B58\u56FE\u7247)\uFF1F")) {
      await performMigration();
    }
    console.log("Database migration check complete.");
  } catch (error) {
    console.error("Error during manual migration trigger:", error);
  }
}

async function getAllImages(md5ORtag) {
  const results = [];
  let md5 = md5ORtag;
  if (md5ORtag.length !== 32) {
    md5 = CryptoJS.MD5(md5ORtag).toString();
  }
  const storage = extension_settings[extensionName].jiuguanStorage || {};
  const serverEntry = storage[md5] || storage[md5ORtag];
  if (serverEntry && Array.isArray(serverEntry.images)) {
    const serverImagePromises = serverEntry.images.map(async (imageEntry) => {
      if (imageEntry.path) {
        try {
          const response = await fetch(imageEntry.path);
          if (response.ok) {
            const blob = await response.blob();
            return await blobToBase64(blob);
          }
        } catch (error) {
          console.error("Failed to fetch image:", error);
        }
      }
      return null;
    });
    const serverImages = await Promise.all(serverImagePromises);
    results.push(...serverImages.filter((img) => img !== null));
  }
  const metadata = await getMetadata();
  const dbEntry = metadata[md5] || metadata[md5ORtag];
  if (dbEntry && Array.isArray(dbEntry.images)) {
    const imagePromises = dbEntry.images.map(async (imageEntry) => {
      const imageData = await storeReadOnly(imageEntry.uuid);
      if (imageData && imageData.data) {
        const isVideo = imageEntry.isVideo || false;
        const mimeType = imageEntry.format ? formatToMimeType(imageEntry.format, isVideo) : detectMimeFromBuffer(imageData.data, isVideo);
        return `data:${mimeType};base64,` + arrayBufferToBase64(imageData.data);
      }
      return null;
    });
    const dbImages = await Promise.all(imagePromises);
    results.push(...dbImages.filter((img) => img !== null));
  }
  return results;
}

async function getAllImageBlobs(md5ORtag) {
  const results = [];
  let md5 = md5ORtag;
  if (md5ORtag.length !== 32) {
    md5 = CryptoJS.MD5(md5ORtag).toString();
  }
  const storage = extension_settings[extensionName].jiuguanStorage || {};
  const serverEntry = storage[md5] || storage[md5ORtag];
  if (serverEntry && Array.isArray(serverEntry.images)) {
    const blobPromises = serverEntry.images.map(async (imageEntry) => {
      if (imageEntry.path) {
        try {
          const response = await fetch(imageEntry.path);
          if (response.ok) {
            return await response.blob();
          }
        } catch (error) {
          console.error("Failed to fetch image blob:", error);
        }
      }
      return null;
    });
    const serverBlobs = await Promise.all(blobPromises);
    results.push(...serverBlobs.filter((b) => b !== null));
  }
  const metadata = await getMetadata();
  const dbEntry = metadata[md5] || metadata[md5ORtag];
  if (dbEntry && Array.isArray(dbEntry.images)) {
    const blobPromises = dbEntry.images.map(async (imageEntry) => {
      const imageData = await storeReadOnly(imageEntry.uuid);
      if (imageData && imageData.data) {
        return new Blob([imageData.data], { type: "image/png" });
      }
      return null;
    });
    const dbBlobs = await Promise.all(blobPromises);
    results.push(...dbBlobs.filter((b) => b !== null));
  }
  return results;
}

async function getImageByUUID(uuid) {
  const imageData = await storeReadOnly(uuid);
  if (imageData && imageData.data) {
    const mimeType = detectMimeFromBuffer(imageData.data);
    return `data:${mimeType};base64,` + arrayBufferToBase64(imageData.data);
  }
  return null;
}

async function getImageBlobByUUID(uuid) {
  const imageData = await storeReadOnly(uuid);
  if (imageData && imageData.data) {
    const mimeType = detectMimeFromBuffer(imageData.data);
    return new Blob([imageData.data], { type: mimeType });
  }
  const serverStorage = extension_settings[extensionName].jiuguanStorage || {};
  for (const md5 in serverStorage) {
    const entry = serverStorage[md5];
    if (entry && Array.isArray(entry.images)) {
      const imageEntry = entry.images.find((img) => img.uuid === uuid);
      if (imageEntry && imageEntry.path) {
        try {
          const response = await fetch(imageEntry.path);
          if (response.ok) {
            return await response.blob();
          } else {
            console.error(`Failed to fetch image from server: ${response.statusText}`);
          }
        } catch (error) {
          console.error(`Failed to fetch image blob from server for uuid ${uuid}:`, error);
        }
      }
    }
  }
  return null;
}

async function getImageThumbnailBlobByUUID(thumbnail_uuid) {
  if (!thumbnail_uuid) return null;
  const imageData = await storeReadOnly(thumbnail_uuid);
  if (imageData && imageData.data) {
    const uint = new Uint8Array(imageData.data);
    let mimeType = "image/png";
    if (uint[0] === 255 && uint[1] === 216 && uint[2] === 255) {
      mimeType = "image/jpeg";
    }
    return new Blob([imageData.data], { type: mimeType });
  }
  return null;
}

async function getAllImageMetadata() {
  const mergedMetadata = {};
  const serverStorage = extension_settings[extensionName].jiuguanStorage || {};
  for (const md5 in serverStorage) {
    const entry = serverStorage[md5];
    if (entry && entry.images) {
      mergedMetadata[md5] = {
        ...entry,
        images: entry.images.map((img) => ({
          ...img,
          source: "server"
          // 标记为服务器来源
        }))
      };
    }
  }
  const dbMetadata = await getMetadata();
  for (const md5 in dbMetadata) {
    const entry = dbMetadata[md5];
    if (entry && entry.images) {
      if (!mergedMetadata[md5]) {
        mergedMetadata[md5] = {
          ...entry,
          images: entry.images.map((img) => ({
            ...img,
            source: "db"
            // 标记为数据库来源
          }))
        };
      } else {
        mergedMetadata[md5].images.push(...entry.images.map((img) => ({
          ...img,
          source: "db"
        })));
      }
    }
  }
  return mergedMetadata;
}

function isRemoteJiuguan() {
  const host = window.location.hostname;
  if (!host) return true;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (host.endsWith(".local")) return false;
  return true;
}

function notifySizeCalcListeners(payload) {
  for (const fn of sizeCalcListeners) {
    try {
      fn(payload);
    } catch (e) {
      console.error("[DB] \u5C3A\u5BF8\u7EDF\u8BA1\u76D1\u542C\u5668\u5F02\u5E38:", e);
    }
  }
}

function subscribeSizeCalcProgress(fn) {
  sizeCalcListeners.add(fn);
  return () => sizeCalcListeners.delete(fn);
}

function getSizeCalcTask() {
  if (!sizeCalcTask) return null;
  return {
    running: sizeCalcTask.running,
    lastProgress: sizeCalcTask.lastProgress,
    startedAt: sizeCalcTask.startedAt
  };
}

function cancelSizeCalc() {
  if (sizeCalcTask && sizeCalcTask.running) {
    sizeCalcTask.controller.abort();
    return true;
  }
  return false;
}

async function calculateAllImageSizes(options = {}) {
  if (sizeCalcTask && sizeCalcTask.running) {
    console.log("[DB] \u5C3A\u5BF8\u7EDF\u8BA1\u5DF2\u5728\u8FDB\u884C\u4E2D\uFF0C\u590D\u7528\u73B0\u6709\u4EFB\u52A1");
    return sizeCalcTask.promise;
  }
  const controller = new AbortController();
  const task = {
    running: true,
    controller,
    startedAt: Date.now(),
    lastProgress: null,
    promise: null
  };
  sizeCalcTask = task;
  const onProgress = (payload) => {
    task.lastProgress = payload;
    notifySizeCalcListeners(payload);
  };
  task.promise = (async () => {
    try {
      const report = await runSizeCalculation({
        ...options,
        signal: controller.signal,
        onProgress
      });
      task.running = false;
      notifySizeCalcListeners({ phase: "finished", report, current: 1, total: 1, detail: "" });
      return report;
    } catch (error) {
      task.running = false;
      notifySizeCalcListeners({ phase: "error", error, current: 0, total: 1, detail: error.message });
      throw error;
    }
  })();
  return task.promise;
}

async function runSizeCalculation(options = {}) {
  const { onProgress = null, signal = null, force = false } = options;
  const BATCH_SIZE = 200;
  const READ_CHUNK = 25;
  const remote = isRemoteJiuguan();
  const HEAD_CONCURRENCY = remote ? 2 : 6;
  const BATCH_DELAY_MS = remote ? 300 : 0;
  const isReservedKey = (key) => key === metadataId || typeof key === "string" && key.startsWith("cache_");
  const report = {
    dbCount: 0,
    dbBytes: 0,
    serverCount: 0,
    serverBytes: 0,
    thumbnailCount: 0,
    thumbnailBytes: 0,
    orphanCount: 0,
    orphanBytes: 0,
    failedCount: 0,
    skippedCount: 0,
    // 断点继续时跳过的已统计项
    cancelled: false,
    remote,
    // 是否走了云酒馆限流
    concurrency: HEAD_CONCURRENCY,
    errors: []
  };
  const checkCancel = () => {
    if (signal && signal.aborted) {
      report.cancelled = true;
      return true;
    }
    return false;
  };
  const emit = (phase, current, total, detail) => {
    if (onProgress) onProgress({ phase, current, total, detail, report });
  };
  const tallyTotals = () => {
    report.dbCount = 0;
    report.dbBytes = 0;
    report.serverCount = 0;
    report.serverBytes = 0;
    report.thumbnailCount = 0;
    report.thumbnailBytes = 0;
    for (const md5 in dbMetadata) {
      const entry = dbMetadata[md5];
      if (!entry || !Array.isArray(entry.images)) continue;
      for (const img of entry.images) {
        if (typeof img.size === "number") {
          report.dbCount++;
          report.dbBytes += img.size;
        }
        if (typeof img.thumbnail_size === "number") {
          report.thumbnailCount++;
          report.thumbnailBytes += img.thumbnail_size;
        }
      }
    }
    for (const md5 in serverStorage) {
      const entry = serverStorage[md5];
      if (!entry || !Array.isArray(entry.images)) continue;
      for (const img of entry.images) {
        if (typeof img.size === "number") {
          report.serverCount++;
          report.serverBytes += img.size;
        }
        if (typeof img.thumbnail_size === "number") {
          report.thumbnailCount++;
          report.thumbnailBytes += img.thumbnail_size;
        }
      }
    }
  };
  const dbMetadata = await getMetadata();
  const serverStorage = extension_settings[extensionName].jiuguanStorage || {};
  const knownDbIds = /* @__PURE__ */ new Set();
  const dbTargets = /* @__PURE__ */ new Map();
  for (const md5 in dbMetadata) {
    const entry = dbMetadata[md5];
    if (!entry || !Array.isArray(entry.images)) continue;
    for (const img of entry.images) {
      if (img.uuid) {
        knownDbIds.add(img.uuid);
        if (force || typeof img.size !== "number") {
          dbTargets.set(img.uuid, { img, field: "size" });
        } else {
          report.skippedCount++;
        }
      }
      if (img.thumbnail_uuid) {
        knownDbIds.add(img.thumbnail_uuid);
        if (force || typeof img.thumbnail_size !== "number") {
          dbTargets.set(img.thumbnail_uuid, { img, field: "thumbnail_size" });
        } else {
          report.skippedCount++;
        }
      }
    }
  }
  const database = await openDB();
  let totalRows = 0;
  try {
    totalRows = await new Promise((resolve, reject) => {
      const tx = database.transaction([objectStoreName], "readonly");
      const req = tx.objectStore(objectStoreName).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    report.errors.push(`\u7EDF\u8BA1\u8BB0\u5F55\u6570\u5931\u8D25: ${e.message}`);
  }
  let lastKey = null;
  let scanned = 0;
  let measuredSinceSave = 0;
  let dbDirty = false;
  emit("db", 0, totalRows, "\u6B63\u5728\u626B\u63CF\u6D4F\u89C8\u5668\u6570\u636E\u5E93...");
  const flushDbMetadata = async () => {
    if (!dbDirty) return;
    await setMetadata(dbMetadata);
    dbDirty = false;
    measuredSinceSave = 0;
  };
  while (true) {
    if (checkCancel()) {
      await flushDbMetadata();
      tallyTotals();
      return report;
    }
    const keys = await new Promise((resolve, reject) => {
      const tx = database.transaction([objectStoreName], "readonly");
      const store = tx.objectStore(objectStoreName);
      const range = lastKey === null ? null : IDBKeyRange.lowerBound(lastKey, true);
      const req = store.openKeyCursor(range);
      const out = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor || out.length >= BATCH_SIZE) {
          resolve(out);
          return;
        }
        out.push(cursor.key);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
    if (keys.length === 0) break;
    lastKey = keys[keys.length - 1];
    const toMeasure = keys.filter((key) => {
      if (isReservedKey(key)) return false;
      return dbTargets.has(key) || !knownDbIds.has(key);
    });
    const measured = [];
    for (let c = 0; c < toMeasure.length; c += READ_CHUNK) {
      if (checkCancel()) {
        await flushDbMetadata();
        tallyTotals();
        return report;
      }
      const chunk = toMeasure.slice(c, c + READ_CHUNK);
      const rows = await new Promise((resolve, reject) => {
        const tx = database.transaction([objectStoreName], "readonly");
        const store = tx.objectStore(objectStoreName);
        const out = [];
        let pending = chunk.length;
        let failed = false;
        for (const key of chunk) {
          const req = store.get(key);
          req.onsuccess = () => {
            if (failed) return;
            const row = req.result;
            const bytes = row && row.data && typeof row.data.byteLength === "number" ? row.data.byteLength : null;
            out.push({ key, bytes });
            if (--pending === 0) resolve(out);
          };
          req.onerror = () => {
            if (failed) return;
            failed = true;
            reject(req.error);
          };
        }
      });
      measured.push(...rows);
    }
    for (const { key, bytes } of measured) {
      if (bytes === null) continue;
      const target = dbTargets.get(key);
      if (target) {
        target.img[target.field] = bytes;
        dbDirty = true;
        measuredSinceSave++;
      } else {
        report.orphanCount++;
        report.orphanBytes += bytes;
      }
    }
    scanned += keys.length;
    if (measuredSinceSave >= BATCH_SIZE) {
      await flushDbMetadata();
    }
    emit("db", scanned, totalRows, `\u6D4F\u89C8\u5668\u6570\u636E\u5E93: ${scanned} / ${totalRows} \u6761`);
    await new Promise((r) => setTimeout(r, 0));
  }
  await flushDbMetadata();
  const serverTargets = [];
  for (const md5 in serverStorage) {
    const entry = serverStorage[md5];
    if (!entry || !Array.isArray(entry.images)) continue;
    for (const img of entry.images) {
      if (img.path) {
        if (force || typeof img.size !== "number") {
          serverTargets.push({ img, path: img.path, field: "size" });
        } else {
          report.skippedCount++;
        }
      }
      if (img.thumbnail_path) {
        if (force || typeof img.thumbnail_size !== "number") {
          serverTargets.push({ img, path: img.thumbnail_path, field: "thumbnail_size" });
        } else {
          report.skippedCount++;
        }
      }
    }
  }
  const probeSize2 = async (path) => {
    try {
      const head = await fetch(path, { method: "HEAD", signal });
      if (head.ok) {
        const len = head.headers.get("Content-Length");
        if (len !== null) return parseInt(len, 10);
      }
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }
    if (remote) {
      throw new Error("HEAD \u4E0D\u53EF\u7528\uFF0C\u4E91\u9152\u9986\u4E0B\u8DF3\u8FC7\uFF08\u907F\u514D\u4E0B\u8F7D\u6574\u56FE\uFF09");
    }
    const res = await fetch(path, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return blob.size;
  };
  let probed = 0;
  let serverDirty = false;
  const flushServerMetadata = async () => {
    if (!serverDirty) return;
    saveSettingsDebounced();
    serverDirty = false;
    try {
      await updateStegoImage();
    } catch (e) {
      report.errors.push(`\u66F4\u65B0\u9690\u5199\u56FE\u7247\u5931\u8D25: ${e.message}`);
    }
  };
  if (serverTargets.length > 0) {
    const modeLabel = remote ? `\u4E91\u9152\u9986\u9650\u6D41\u6A21\u5F0F (\u5E76\u53D1 ${HEAD_CONCURRENCY})` : `\u672C\u5730\u6A21\u5F0F (\u5E76\u53D1 ${HEAD_CONCURRENCY})`;
    emit("server", 0, serverTargets.length, `\u6B63\u5728\u63A2\u6D4B\u9152\u9986\u6587\u4EF6\u5927\u5C0F... ${modeLabel}`);
    for (let i = 0; i < serverTargets.length; i += HEAD_CONCURRENCY) {
      if (checkCancel()) {
        await flushServerMetadata();
        tallyTotals();
        return report;
      }
      const slice = serverTargets.slice(i, i + HEAD_CONCURRENCY);
      await Promise.all(slice.map(async (target) => {
        try {
          const bytes = await probeSize2(target.path);
          if (Number.isFinite(bytes) && bytes >= 0) {
            target.img[target.field] = bytes;
            serverDirty = true;
          } else {
            report.failedCount++;
          }
        } catch (e) {
          if (e.name === "AbortError") return;
          report.failedCount++;
          if (report.errors.length < 20) {
            report.errors.push(`${target.path}: ${e.message}`);
          }
        }
        probed++;
      }));
      emit(
        "server",
        probed,
        serverTargets.length,
        `\u9152\u9986\u5B58\u50A8: ${probed} / ${serverTargets.length} \u4E2A\u6587\u4EF6 \xB7 ${modeLabel}`
      );
      if (BATCH_DELAY_MS > 0 && i + HEAD_CONCURRENCY < serverTargets.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }
    if (serverDirty) {
      saveSettingsDebounced();
      serverDirty = false;
    }
  }
  if (checkCancel()) {
    tallyTotals();
    return report;
  }
  emit("writeback", 0, 1, "\u6B63\u5728\u4FDD\u5B58\u7EDF\u8BA1\u7ED3\u679C...");
  tallyTotals();
  if (serverTargets.length > 0) {
    saveSettingsDebounced();
    try {
      await updateStegoImage();
    } catch (e) {
      report.errors.push(`\u66F4\u65B0\u9690\u5199\u56FE\u7247\u5931\u8D25: ${e.message}`);
    }
  }
  emit("done", 1, 1, "\u7EDF\u8BA1\u5B8C\u6210");
  return report;
}

async function deleteMultipleImages(md5s) {
  if (!Array.isArray(md5s) || md5s.length === 0) {
    return;
  }
  const storage = extension_settings[extensionName].jiuguanStorage;
  if (storage) {
    const pathsToDelete = [];
    md5s.forEach((md5) => {
      const entry = storage[md5];
      if (entry && entry.images) {
        entry.images.forEach((imageEntry) => {
          if (imageEntry.path) {
            pathsToDelete.push(imageEntry.path);
          }
          if (imageEntry.thumbnail_path) {
            pathsToDelete.push(imageEntry.thumbnail_path);
          }
        });
        delete storage[md5];
        if (window.imagesid && window.imagesid[md5]) {
          delete window.imagesid[md5];
        }
      }
    });
    for (const path of pathsToDelete) {
      try {
        const response = await fetch("/api/images/delete", {
          method: "POST",
          headers: getRequestHeaders(window.token),
          body: JSON.stringify({ path })
        });
        if (!response.ok && response.status !== 404) {
          console.error(`Failed to delete image from server: ${path} (status ${response.status})`);
        }
      } catch (error) {
        console.error(`Failed to delete image from server: ${path}`, error);
      }
    }
    saveSettingsDebounced();
    await updateStegoImage();
  }
  const metadata = await getMetadata();
  const allUuidsToDelete = [];
  let metadataUpdated = false;
  md5s.forEach((md5) => {
    const entry = metadata[md5];
    if (entry && entry.images) {
      entry.images.forEach((imageEntry) => {
        if (imageEntry.uuid) allUuidsToDelete.push(imageEntry.uuid);
        if (imageEntry.thumbnail_uuid) allUuidsToDelete.push(imageEntry.thumbnail_uuid);
      });
      delete metadata[md5];
      metadataUpdated = true;
      if (window.imagesid && window.imagesid[md5]) {
        delete window.imagesid[md5];
      }
    }
  });
  if (allUuidsToDelete.length > 0) {
    const db2 = await openDB();
    const transaction = db2.transaction([objectStoreName], "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    const deletePromises = allUuidsToDelete.map((uuid) => {
      if (!uuid) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const request = objectStore.delete(uuid);
        request.onsuccess = resolve;
        request.onerror = reject;
      });
    });
    await Promise.all(deletePromises);
  }
  if (metadataUpdated) {
    await setMetadata(metadata);
  }
}

async function deleteImagesByUuids(uuids) {
  if (!Array.isArray(uuids) || uuids.length === 0) {
    return;
  }
  const storage = extension_settings[extensionName].jiuguanStorage;
  if (storage) {
    const pathsToDelete = [];
    const uuidToMd5Map2 = /* @__PURE__ */ new Map();
    for (const [md5, entry] of Object.entries(storage)) {
      if (entry.images && Array.isArray(entry.images)) {
        entry.images.forEach((img) => {
          uuidToMd5Map2.set(img.uuid, md5);
        });
      }
    }
    uuids.forEach((uuid) => {
      const md5 = uuidToMd5Map2.get(uuid);
      if (md5) {
        const entry = storage[md5];
        if (entry && entry.images) {
          const idx = entry.images.findIndex((img) => img.uuid === uuid);
          if (idx === -1) return;
          const [removed] = entry.images.splice(idx, 1);
          const path = removed && removed.path;
          const thumbnail_path = removed && removed.thumbnail_path;
          if (path) pathsToDelete.push(path);
          if (thumbnail_path) pathsToDelete.push(thumbnail_path);
          if (entry.images.length === 0) {
            delete storage[md5];
            if (window.imagesid && window.imagesid[md5]) {
              delete window.imagesid[md5];
            }
          } else {
            if (entry.index >= entry.images.length) {
              entry.index = entry.images.length - 1;
            }
            if (window.imagesid && window.imagesid[md5]) {
              const dates = entry.images.map((img) => img.date).filter((d) => d);
              if (dates.length > 0) {
                window.imagesid[md5] = Math.max(...dates);
              } else {
                delete window.imagesid[md5];
              }
            }
          }
        }
      }
    });
    for (const path of pathsToDelete) {
      try {
        const response = await fetch("/api/images/delete", {
          method: "POST",
          headers: getRequestHeaders(window.token),
          body: JSON.stringify({ path })
        });
        if (!response.ok && response.status !== 404) {
          console.error(`Failed to delete image from server: ${path} (status ${response.status})`);
        }
      } catch (error) {
        console.error(`Failed to delete image from server: ${path}`, error);
      }
    }
    saveSettingsDebounced();
    if (pathsToDelete.length > 0) {
      try {
        await updateStegoImage();
      } catch (e) {
        console.error("[deleteImagesByUuids] updateStegoImage failed:", e);
      }
    }
  }
  const metadata = await getMetadata();
  let metadataUpdated = false;
  const allUuidsToDelete = /* @__PURE__ */ new Set();
  const uuidToMd5Map = /* @__PURE__ */ new Map();
  for (const [md5, meta] of Object.entries(metadata)) {
    if (meta.images && Array.isArray(meta.images)) {
      meta.images.forEach((imageEntry) => uuidToMd5Map.set(imageEntry.uuid, md5));
    }
  }
  uuids.forEach((uuid) => {
    const md5 = uuidToMd5Map.get(uuid);
    if (md5 && metadata[md5]) {
      const entry = metadata[md5];
      const imageIndex = entry.images.findIndex((img) => img.uuid === uuid);
      if (imageIndex > -1) {
        const [imageToDelete] = entry.images.splice(imageIndex, 1);
        if (imageToDelete.uuid) allUuidsToDelete.add(imageToDelete.uuid);
        if (imageToDelete.thumbnail_uuid) allUuidsToDelete.add(imageToDelete.thumbnail_uuid);
        metadataUpdated = true;
        if (entry.images.length === 0) {
          delete metadata[md5];
          if (window.imagesid && window.imagesid[md5]) {
            delete window.imagesid[md5];
          }
        } else {
          if (entry.index >= entry.images.length) {
            entry.index = entry.images.length - 1;
          }
          if (window.imagesid && window.imagesid[md5]) {
            const dates = entry.images.map((img) => img.date).filter((d) => d);
            if (dates.length > 0) {
              window.imagesid[md5] = Math.max(...dates);
            } else {
              delete window.imagesid[md5];
            }
          }
        }
      }
    }
  });
  if (allUuidsToDelete.size > 0) {
    const db2 = await openDB();
    const transaction = db2.transaction([objectStoreName], "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    const deletePromises = Array.from(allUuidsToDelete).map((uuid) => {
      return new Promise((resolve, reject) => {
        const request = objectStore.delete(uuid);
        request.onsuccess = resolve;
        request.onerror = reject;
      });
    });
    await Promise.all(deletePromises);
  }
  if (metadataUpdated) {
    await setMetadata(metadata);
  }
}

async function installVocabulary(fileName, data) {
  const db2 = await openDB();
  const isHierarchical = data.tag_groups && data.tag_groups.length > 0 || data.tag_tags && data.tag_tags.length > 0;
  const storesToClear = isHierarchical ? ["vocabularies", "groups", "subgroups", "tags"] : ["vocabularies", "tags"];
  const transaction = db2.transaction(storesToClear, "readwrite");
  const vocabStore = transaction.objectStore("vocabularies");
  const tagsStore = transaction.objectStore("tags");
  const groupsStore = isHierarchical ? transaction.objectStore("groups") : null;
  const subgroupsStore = isHierarchical ? transaction.objectStore("subgroups") : null;
  for (const storeName of storesToClear) {
    if (storeName === "vocabularies") {
      await new Promise((resolve, reject) => {
        const req = transaction.objectStore(storeName).delete(fileName);
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    } else {
      const store = transaction.objectStore(storeName);
      const index = store.index("fileName");
      let cursorReq = index.openKeyCursor(IDBKeyRange.only(fileName));
      await new Promise(async (resolve, reject) => {
        const keysToDelete = [];
        cursorReq.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            keysToDelete.push(cursor.primaryKey);
            cursor.continue();
          } else {
            Promise.all(keysToDelete.map((key) => store.delete(key))).then(resolve).catch(reject);
          }
        };
        cursorReq.onerror = (event) => reject(event.target.error);
      });
    }
  }
  let totalTags = 0;
  if (isHierarchical) {
    const { tag_groups, tag_tags } = data;
    if (tag_groups && tag_groups.length === 1 && (!tag_groups[0].subgroups || tag_groups[0].subgroups.length === 0)) {
      const group = tag_groups[0];
      const virtualSubgroup = {
        id_index: group.id_index,
        // 复用 group 的 id_index
        group_id: group.id_index,
        name: group.name,
        // 复用 group 的 name
        fileName
      };
      subgroupsStore.put(virtualSubgroup);
      if (tag_tags) {
        totalTags = tag_tags.length;
        for (const tag of tag_tags) {
          const newTag = {
            name: tag.text,
            translation: tag.desc,
            subgroup_id: virtualSubgroup.id_index,
            // 强制关联
            hot: -1,
            fileName
          };
          tagsStore.put(newTag);
        }
      }
      const { subgroups, ...groupData } = group;
      groupsStore.put({ ...groupData, fileName });
    } else {
      if (tag_groups) {
        for (const group of tag_groups) {
          if (group.subgroups && Array.isArray(group.subgroups)) {
            for (const subgroup of group.subgroups) {
              subgroupsStore.put({ ...subgroup, group_id: group.id_index, fileName });
            }
          }
          const { subgroups, ...groupData } = group;
          groupsStore.put({ ...groupData, fileName });
        }
      }
      if (tag_tags) {
        totalTags = tag_tags.length;
        for (const tag of tag_tags) {
          const newTag = {
            name: tag.text,
            translation: tag.desc,
            subgroup_id: tag.subgroup_id,
            hot: -1,
            fileName
          };
          tagsStore.put(newTag);
        }
      }
    }
  } else {
    let tags = [];
    if (data.danbooru_tag) tags = data.danbooru_tag;
    else if (Array.isArray(data)) tags = data;
    totalTags = tags.length;
    for (const tag of tags) {
      const newTag = {
        name: typeof tag === "object" ? tag.tag || tag.name : tag,
        translation: typeof tag === "object" ? tag.translate || tag.translation : "",
        hot: typeof tag === "object" ? tag.hot || 0 : 0,
        fileName
      };
      tagsStore.put(newTag);
    }
  }
  vocabStore.put({ fileName, tagCount: totalTags, installedDate: /* @__PURE__ */ new Date() });
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
}

async function uninstallVocabulary(fileName) {
  const db2 = await openDB();
  const isHierarchical = fileName === "tags.json";
  const storesToClear = isHierarchical ? ["vocabularies", "groups", "subgroups", "tags"] : ["vocabularies", "tags"];
  const transaction = db2.transaction(storesToClear, "readwrite");
  for (const storeName of storesToClear) {
    if (storeName === "vocabularies") {
      await new Promise((resolve, reject) => {
        const req = transaction.objectStore(storeName).delete(fileName);
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    } else {
      const store = transaction.objectStore(storeName);
      const index = store.index("fileName");
      const request = index.openCursor(IDBKeyRange.only(fileName));
      await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = (event) => reject(event.target.error);
      });
    }
  }
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
}

async function getInstalledVocabularies() {
  const db2 = await openDB();
  const transaction = db2.transaction("vocabularies", "readonly");
  const store = transaction.objectStore("vocabularies");
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function getTagsTreeData() {
  const db2 = await openDB();
  const transaction = db2.transaction(["groups", "subgroups", "tags"], "readonly");
  const groupsStore = transaction.objectStore("groups");
  const subgroupsStore = transaction.objectStore("subgroups");
  const tagsStore = transaction.objectStore("tags");
  const [groups, subgroups, tags] = await Promise.all([
    new Promise((res, rej) => {
      const r = groupsStore.getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = rej;
    }),
    new Promise((res, rej) => {
      const r = subgroupsStore.getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = rej;
    }),
    new Promise((res, rej) => {
      const r = tagsStore.getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = rej;
    })
  ]);
  const subgroupsByGroup = subgroups.reduce((acc, sg) => {
    if (!acc[sg.group_id]) acc[sg.group_id] = [];
    acc[sg.group_id].push(sg);
    return acc;
  }, {});
  const tagsBySubgroup = tags.reduce((acc, tag) => {
    if (!acc[tag.subgroup_id]) acc[tag.subgroup_id] = [];
    acc[tag.subgroup_id].push({ text: tag.name, desc: tag.translation });
    return acc;
  }, {});
  const finalTree = {
    tag_groups: groups.map((g) => ({
      ...g,
      subgroups: (subgroupsByGroup[g.id_index] || []).map((sg) => ({
        ...sg,
        tags: tagsBySubgroup[sg.id_index] || []
      }))
    })),
    tag_tags: tags.map((t) => ({
      text: t.name,
      desc: t.translation,
      subgroup_id: t.subgroup_id
    }))
  };
  return finalTree;
}

async function searchTags(keyword, options = {}) {
  if (!keyword) {
    return [];
  }
  const { startsWith = false, limit = 100, sortBy = "hot_asc" } = options;
  const lowerCaseKeyword = keyword.toLowerCase();
  const db2 = await openDB();
  const transaction = db2.transaction("tags", "readonly");
  const store = transaction.objectStore("tags");
  const allMatches = /* @__PURE__ */ new Map();
  const processCursor = (cursor) => {
    if (cursor) {
      const tag = cursor.value;
      let nameMatch = false;
      let translationMatch = false;
      if (startsWith) {
        nameMatch = tag.name && tag.name.toLowerCase().startsWith(lowerCaseKeyword);
        translationMatch = tag.translation && tag.translation.toLowerCase().startsWith(lowerCaseKeyword);
      } else {
        nameMatch = tag.name && tag.name.toLowerCase().includes(lowerCaseKeyword);
        translationMatch = tag.translation && tag.translation.toLowerCase().includes(lowerCaseKeyword);
      }
      if ((nameMatch || translationMatch) && !allMatches.has(tag.name)) {
        allMatches.set(tag.name, tag);
      }
      cursor.continue();
    }
  };
  await new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        processCursor(cursor);
      } else {
        resolve();
      }
    };
  });
  let results = Array.from(allMatches.values());
  results.sort((a, b) => {
    if (a.hot === -1 && b.hot !== -1) return -1;
    if (a.hot !== -1 && b.hot === -1) return 1;
    if (a.hot === -1 && b.hot === -1) {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "hot_desc") {
      return b.hot - a.hot;
    }
    if (sortBy === "hot_asc") {
      return a.hot - b.hot;
    }
    if (sortBy === "key_asc") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
  return results.slice(0, limit);
}

async function addTag(tag) {
  const db2 = await openDB();
  const transaction = db2.transaction("tags", "readwrite");
  const store = transaction.objectStore("tags");
  const newTag = {
    name: tag.name,
    translation: tag.translation || "",
    hot: tag.hot || 0,
    fileName: tag.fileName || "manual"
    // Default to 'manual' if not provided
  };
  return new Promise((resolve, reject) => {
    const request = store.put(newTag);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function __syncDiagnostics({ folderName, serverImageNames, storedFileNames, nameOrigins, storage, metadata }) {
  try {
    console.groupCollapsed("%c[Sync \u8BCA\u65AD] \u70B9\u5F00\u67E5\u770B\u8BE6\u60C5", "color:#4CAF50;font-weight:bold");
    const imageSet = new Set(serverImageNames);
    console.log("\u3010A. \u670D\u52A1\u5668\u5217\u8868\u3011");
    console.log(`  \u6587\u4EF6\u5939 ${folderName} \u8FD4\u56DE\u6587\u4EF6\u6570: ${serverImageNames.length}\uFF08\u542B\u56FE\u7247/\u89C6\u9891/\u97F3\u9891\uFF09`);
    console.log("  \u2139 list \u63A5\u53E3\u4E0D\u9012\u5F52\u5B50\u76EE\u5F55\uFF0C\u4E5F\u4E0D\u8FD4\u56DE mime \u65E0\u6CD5\u8BC6\u522B\u7684\u6587\u4EF6\uFF08\u5982\u65E0\u6269\u5C55\u540D\uFF09\u3002");
    console.log("    \u82E5\u6587\u4EF6\u7BA1\u7406\u5668\u91CC\u6570\u5230\u7684\u6587\u4EF6\u6570 > \u4E0A\u9762\u7684\u6570\u5B57\uFF0C\u5DEE\u989D\u5C31\u662F\u5B50\u76EE\u5F55\u5185\u6216 mime \u65E0\u6CD5\u8BC6\u522B\u7684\u6587\u4EF6\u3002");
    const extCount2 = {};
    for (const n of serverImageNames) {
      const ext = n.includes(".") ? n.split(".").pop().toLowerCase() : "(\u65E0\u6269\u5C55\u540D)";
      extCount2[ext] = (extCount2[ext] || 0) + 1;
    }
    console.log("\u3010B. \u670D\u52A1\u5668\u6587\u4EF6\u6269\u5C55\u540D\u5206\u5E03\u3011", extCount2);
    const originCount = { "storage.path": 0, "storage.thumb": 0, "metadata.path": 0, "metadata.thumb": 0 };
    for (const origins of nameOrigins.values()) {
      for (const o of origins) originCount[o] = (originCount[o] || 0) + 1;
    }
    console.log("\u3010C. \u672C\u5730\u767D\u540D\u5355\u6587\u4EF6\u540D\u6765\u6E90\u3011", originCount);
    console.log(`  \u767D\u540D\u5355\u603B\u6570(\u53BB\u91CD\u540E): ${storedFileNames.size}`);
    const thumbOnly = [];
    for (const [name, origins] of nameOrigins.entries()) {
      const hasPath = origins.has("storage.path") || origins.has("metadata.path");
      if (!hasPath) thumbOnly.push(name);
    }
    const thumbOnlyOnServer = thumbOnly.filter((n) => imageSet.has(n));
    console.log("\u3010D. \u4EC5\u56E0\u7F29\u7565\u56FE\u800C\u8FDB\u5165\u767D\u540D\u5355\u7684\u6587\u4EF6\u540D\u3011");
    console.log(`  \u5171 ${thumbOnly.length} \u4E2A\uFF0C\u5176\u4E2D ${thumbOnlyOnServer.length} \u4E2A\u786E\u5B9E\u5B58\u5728\u4E8E\u670D\u52A1\u5668\u4E0A`);
    if (thumbOnlyOnServer.length > 0) {
      console.log("  \u8FD9\u4E9B\u6587\u4EF6\u56E0\u88AB\u67D0\u6761\u5B58\u6D3B\u8BB0\u5F55\u7684 thumbnail_path \u5F15\u7528\u800C\u4FDD\u7559\uFF08\u6B63\u5E38\u60C5\u51B5\u4E0B\u5C31\u8BE5\u4FDD\u7559\uFF09:");
      console.log("   ", thumbOnlyOnServer.slice(0, 50));
      if (thumbOnlyOnServer.length > 50) console.log(`    ...\u8FD8\u6709 ${thumbOnlyOnServer.length - 50} \u4E2A`);
    }
    const staleWhitelist = [...storedFileNames].filter((n) => !imageSet.has(n));
    console.log("\u3010E. \u767D\u540D\u5355\u4E2D\u670D\u52A1\u5668\u5DF2\u4E0D\u5B58\u5728\u7684\u540D\u5B57\u3011");
    console.log(`  \u5171 ${staleWhitelist.length} \u4E2A\uFF08\u5E7D\u7075\u5224\u5B9A\u53EA\u770B\u4E3B\u8DEF\u5F84 path/video_path\uFF0C\u4E0D\u770B thumbnail_path\uFF0C\u6545\u6B7B\u7F29\u7565\u56FE\u5F15\u7528\u53EF\u80FD\u6B8B\u7559\uFF09`);
    if (staleWhitelist.length > 0) {
      const staleThumbOnly = staleWhitelist.filter((n) => {
        const o = nameOrigins.get(n);
        return o && !o.has("storage.path") && !o.has("metadata.path");
      });
      console.log(`  \u5176\u4E2D\u4EC5\u6765\u81EA\u7F29\u7565\u56FE\u7684: ${staleThumbOnly.length} \u4E2A`);
      console.log("   ", staleWhitelist.slice(0, 30));
    }
    const toDelete = serverImageNames.filter((n) => !storedFileNames.has(n));
    console.log("\u3010F. \u672C\u6B21\u5224\u5B9A\u4E3A\u5B64\u513F\u3001\u5C06\u88AB\u5220\u9664\u3011");
    console.log(`  \u5171 ${toDelete.length} \u4E2A`);
    if (toDelete.length > 0) console.log("   ", toDelete.slice(0, 50));
    const survivors = serverImageNames.filter((n) => storedFileNames.has(n));
    console.log("\u3010G. \u672A\u88AB\u5220\u9664\u7684\u670D\u52A1\u5668\u6587\u4EF6\u53CA\u4FDD\u62A4\u539F\u56E0\u3011");
    console.log(`  \u5171 ${survivors.length} \u4E2A`);
    const reasonTable = survivors.slice(0, 80).map((n) => ({
      \u6587\u4EF6\u540D: n,
      \u4FDD\u62A4\u6765\u6E90: [...nameOrigins.get(n) || []].join(", ")
    }));
    if (reasonTable.length > 0) console.table(reasonTable);
    if (survivors.length > 80) console.log(`  ...\u8FD8\u6709 ${survivors.length - 80} \u4E2A\u672A\u5217\u51FA`);
    console.log("\u3010H. \u672C\u5730\u6570\u636E\u7ED3\u6784\u6982\u89C8\u3011");
    console.log(`  jiuguanStorage \u6761\u76EE(md5)\u6570: ${Object.keys(storage).length}`);
    console.log(`  IndexedDB metadata \u6761\u76EE(md5)\u6570: ${Object.keys(metadata).length}`);
    console.groupEnd();
  } catch (e) {
    console.error("[Sync \u8BCA\u65AD] \u8BCA\u65AD\u8F93\u51FA\u81EA\u8EAB\u51FA\u9519\uFF08\u4E0D\u5F71\u54CD\u540C\u6B65\uFF09:", e);
  }
}

async function syncServerImagesWithStorage(folderName = "chatu8", onProgress = null) {
  const result = {
    deletedCount: 0,
    removedGhostCount: 0,
    errors: []
  };
  try {
    if (onProgress) onProgress(0, 100, "\u6B63\u5728\u83B7\u53D6\u670D\u52A1\u5668\u5A92\u4F53\u5217\u8868...");
    const response = await fetch("/api/images/list", {
      method: "POST",
      headers: getRequestHeaders(window.token),
      body: JSON.stringify({ folder: folderName, type: 7 })
    });
    if (!response.ok) {
      throw new Error(`\u83B7\u53D6\u670D\u52A1\u5668\u56FE\u7247\u5217\u8868\u5931\u8D25: ${response.statusText}`);
    }
    const serverImageNames = await response.json();
    if (!Array.isArray(serverImageNames)) {
      console.log("[Sync] \u670D\u52A1\u5668\u8FD4\u56DE\u6570\u636E\u683C\u5F0F\u5F02\u5E38\uFF0C\u65E0\u9700\u540C\u6B65");
      if (onProgress) onProgress(100, 100, "\u670D\u52A1\u5668\u8FD4\u56DE\u6570\u636E\u5F02\u5E38");
      return result;
    }
    if (onProgress) onProgress(10, 100, "\u6B63\u5728\u6E05\u7406\u5217\u8868\u4E2D\u5DF2\u4E0D\u5B58\u5728\u4E8E\u670D\u52A1\u5668\u7684\u6761\u76EE...");
    const serverFileSet = new Set(serverImageNames);
    const storage = extension_settings[extensionName].jiuguanStorage || {};
    const metadata = await getMetadata();
    let totalStoragePaths = 0;
    for (const md5 in storage) {
      if (storage[md5]?.images) {
        storage[md5].images.forEach((img) => {
          if (img.path) totalStoragePaths++;
        });
      }
    }
    let totalMetadataPaths = 0;
    for (const md5 in metadata) {
      if (metadata[md5]?.images) {
        metadata[md5].images.forEach((img) => {
          if (img.path) totalMetadataPaths++;
        });
      }
    }
    console.log(`[Sync] \u670D\u52A1\u5668\u5B9E\u9645\u6587\u4EF6\u6570: ${serverImageNames.length}, jiuguanStorage \u4E2D\u5E26path\u6761\u76EE: ${totalStoragePaths}, IndexedDB metadata \u4E2D\u5E26path\u6761\u76EE: ${totalMetadataPaths}`);
    let storageThumbs = 0, metadataThumbs = 0;
    for (const md5 in storage) {
      storage[md5]?.images?.forEach((img) => {
        if (img.thumbnail_path) storageThumbs++;
      });
    }
    for (const md5 in metadata) {
      metadata[md5]?.images?.forEach((img) => {
        if (img.thumbnail_path) metadataThumbs++;
      });
    }
    console.log(`[Sync] \u5E26 thumbnail_path \u6761\u76EE: jiuguanStorage ${storageThumbs} \u4E2A, metadata ${metadataThumbs} \u4E2A\uFF08\u5E7D\u7075\u5224\u5B9A\u4E0D\u68C0\u67E5 thumbnail_path\uFF09`);
    let storageChanged = false;
    let metadataChanged = false;
    const ghostUuidsToDelete = /* @__PURE__ */ new Set();
    const isGhost = (img) => {
      const primary = img && (img.path || img.video_path);
      if (!primary) return false;
      const fileName = String(primary).split("/").pop();
      return !!fileName && !serverFileSet.has(fileName);
    };
    for (const md5 of Object.keys(storage)) {
      const entry = storage[md5];
      if (!entry || !Array.isArray(entry.images)) continue;
      const before = entry.images.length;
      entry.images = entry.images.filter((img) => !isGhost(img));
      const removed = before - entry.images.length;
      if (removed > 0) {
        storageChanged = true;
        result.removedGhostCount += removed;
        if (entry.images.length === 0) {
          delete storage[md5];
          if (window.imagesid && window.imagesid[md5]) {
            delete window.imagesid[md5];
          }
        } else {
          if (entry.index >= entry.images.length) {
            entry.index = entry.images.length - 1;
          }
          if (window.imagesid && window.imagesid[md5]) {
            const dates = entry.images.map((img) => img.date).filter((d) => d);
            if (dates.length > 0) {
              window.imagesid[md5] = Math.max(...dates);
            } else {
              delete window.imagesid[md5];
            }
          }
        }
      }
    }
    for (const md5 of Object.keys(metadata)) {
      const entry = metadata[md5];
      if (!entry || !Array.isArray(entry.images)) continue;
      const before = entry.images.length;
      const removedItems = [];
      entry.images = entry.images.filter((img) => {
        if (isGhost(img)) {
          removedItems.push(img);
          return false;
        }
        return true;
      });
      if (removedItems.length > 0) {
        metadataChanged = true;
        result.removedGhostCount += removedItems.length;
        removedItems.forEach((img) => {
          if (img.uuid) ghostUuidsToDelete.add(img.uuid);
          if (img.thumbnail_uuid) ghostUuidsToDelete.add(img.thumbnail_uuid);
        });
        if (entry.images.length === 0) {
          delete metadata[md5];
          if (window.imagesid && window.imagesid[md5]) {
            delete window.imagesid[md5];
          }
        } else {
          if (entry.index >= entry.images.length) {
            entry.index = entry.images.length - 1;
          }
        }
      }
    }
    if (ghostUuidsToDelete.size > 0) {
      try {
        const db2 = await openDB();
        const tx = db2.transaction([objectStoreName], "readwrite");
        const store = tx.objectStore(objectStoreName);
        await Promise.all(Array.from(ghostUuidsToDelete).map((uuid) => new Promise((resolve) => {
          const req = store.delete(uuid);
          req.onsuccess = resolve;
          req.onerror = resolve;
        })));
      } catch (_) {
      }
    }
    if (storageChanged) {
      saveSettingsDebounced();
      try {
        await updateStegoImage();
      } catch (e) {
        console.error("[Sync] updateStegoImage failed:", e);
      }
    }
    if (metadataChanged) await setMetadata(metadata);
    if (result.removedGhostCount > 0) {
      console.log(`[Sync] \u53CD\u5411\u6E05\u7406\uFF1A\u4ECE\u5217\u8868\u4E2D\u79FB\u9664\u4E86 ${result.removedGhostCount} \u4E2A\u670D\u52A1\u5668\u5DF2\u4E0D\u5B58\u5728\u7684\u5E7D\u7075\u6761\u76EE`);
    }
    if (onProgress) onProgress(20, 100, "\u6B63\u5728\u5206\u6790\u63D2\u4EF6\u5B58\u50A8...");
    const storedFileNames = /* @__PURE__ */ new Set();
    const nameOrigins = /* @__PURE__ */ new Map();
    const addName = (fileName, origin) => {
      if (!fileName) return;
      storedFileNames.add(fileName);
      if (!nameOrigins.has(fileName)) nameOrigins.set(fileName, /* @__PURE__ */ new Set());
      nameOrigins.get(fileName).add(origin);
    };
    const PATH_FIELDS = [
      ["path", "path"],
      ["thumbnail_path", "thumb"],
      ["video_path", "video"]
    ];
    const collectFrom = (source, label) => {
      for (const md5 in source) {
        const entry = source[md5];
        if (!entry || !Array.isArray(entry.images)) continue;
        entry.images.forEach((img) => {
          if (!img) return;
          for (const [field, tag] of PATH_FIELDS) {
            if (img[field]) addName(String(img[field]).split("/").pop(), `${label}.${tag}`);
          }
        });
      }
    };
    collectFrom(storage, "storage");
    collectFrom(metadata, "metadata");
    console.log(`[Sync] \u670D\u52A1\u5668\u5A92\u4F53\u603B\u6570: ${serverImageNames.length}, \u63D2\u4EF6\u5B58\u50A8\u6587\u4EF6\u540D\u6570: ${storedFileNames.size}`);
    await __syncDiagnostics({ folderName, serverImageNames, storedFileNames, nameOrigins, storage, metadata });
    const fileNamesToDelete = serverImageNames.filter((fileName) => !storedFileNames.has(fileName));
    const delExtCount = {};
    for (const n of fileNamesToDelete) {
      const ext = n.includes(".") ? n.split(".").pop().toLowerCase() : "(\u65E0\u6269\u5C55\u540D)";
      delExtCount[ext] = (delExtCount[ext] || 0) + 1;
    }
    console.log(`[Sync] \u627E\u5230 ${fileNamesToDelete.length} \u4E2A\u9700\u8981\u5220\u9664\u7684\u5B64\u513F\u6587\u4EF6`, delExtCount);
    if (fileNamesToDelete.length > 0) {
      console.log("[Sync] \u5F85\u5220\u9664\u6E05\u5355:", fileNamesToDelete);
    }
    if (fileNamesToDelete.length === 0) {
      if (onProgress) onProgress(100, 100, "\u6240\u6709\u5A92\u4F53\u5DF2\u540C\u6B65\uFF0C\u65E0\u9700\u5220\u9664");
      return result;
    }
    const totalToDelete = fileNamesToDelete.length;
    for (let i = 0; i < fileNamesToDelete.length; i++) {
      const fileName = fileNamesToDelete[i];
      const progress = Math.floor(20 + i / totalToDelete * 80);
      if (onProgress) onProgress(progress, 100, `\u6B63\u5728\u5220\u9664 (${i + 1}/${totalToDelete}): ${fileName}`);
      try {
        const fullPath = `user/images/${folderName}/${fileName}`;
        const deleteResponse = await fetch("/api/images/delete", {
          method: "POST",
          headers: getRequestHeaders(window.token),
          body: JSON.stringify({ path: fullPath })
        });
        if (deleteResponse.ok) {
          result.deletedCount++;
          console.log(`[Sync] \u5DF2\u5220\u9664: ${fullPath}`);
        } else if (deleteResponse.status === 404) {
          result.deletedCount++;
          console.log(`[Sync] \u5DF2\u4E0D\u5B58\u5728(\u89C6\u4E3A\u5DF2\u5220\u9664): ${fullPath}`);
        } else {
          const error = `\u5220\u9664\u5931\u8D25 (${deleteResponse.status}): ${fullPath}`;
          result.errors.push(error);
          console.error(`[Sync] ${error}`);
        }
      } catch (error) {
        const errorMsg = `\u5220\u9664\u5F02\u5E38: ${fileName} - ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`[Sync] ${errorMsg}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (onProgress) onProgress(100, 100, "\u540C\u6B65\u5B8C\u6210");
    console.log(`[Sync] \u540C\u6B65\u5B8C\u6210\u3002\u5220\u9664 ${result.deletedCount} \u4E2A\u56FE\u7247\uFF0C\u5931\u8D25 ${result.errors.length} \u4E2A`);
    return result;
  } catch (error) {
    console.error("[Sync] \u540C\u6B65\u8FC7\u7A0B\u53D1\u751F\u9519\u8BEF:", error);
    result.errors.push(error.message);
    return result;
  }
}

async function initJiuguanStorage() {
  try {
    console.log("[Stego] \u5F00\u59CB\u521D\u59CB\u5316 jiuguanStorage...");
    const imagePayload = await fetchStegoImage();
    if (imagePayload) {
      console.log("[Stego] \u627E\u5230\u9690\u5199\u56FE\u7247\uFF0C\u5F00\u59CB\u89E3\u7801...");
      try {
        const data = await decodeStegoPayload(imagePayload);
        if (!extension_settings[extensionName].jiuguanStorage) {
          extension_settings[extensionName].jiuguanStorage = {};
        }
        extension_settings[extensionName].jiuguanStorage = data;
        console.log("[Stego] \u4ECE\u9690\u5199\u56FE\u7247\u52A0\u8F7D\u6570\u636E\u6210\u529F\uFF0C\u5171", Object.keys(data).length, "\u4E2A\u6761\u76EE");
      } catch (decodeError) {
        console.warn("[Stego] \u9690\u5199\u56FE\u7247\u89E3\u7801\u5931\u8D25\uFF08\u53EF\u80FD\u662F\u65E7\u683C\u5F0F\u6216\u5DF2\u635F\u574F\uFF09\uFF0C\u5C06\u4F7F\u7528 extension_settings \u4E2D\u7684\u6570\u636E\u91CD\u5EFA:", decodeError.message);
        if (!extension_settings[extensionName].jiuguanStorage) {
          extension_settings[extensionName].jiuguanStorage = {};
        }
        const currentData = extension_settings[extensionName].jiuguanStorage;
        if (currentData && Object.keys(currentData).length > 0) {
          console.log("[Stego] \u68C0\u6D4B\u5230\u73B0\u6709\u6570\u636E\uFF0C\u5C1D\u8BD5\u91CD\u5EFA\u9690\u5199\u56FE\u7247...");
          try {
            await deleteStegoImage();
            await createStegoImage();
            console.log("[Stego] \u9690\u5199\u56FE\u7247\u91CD\u5EFA\u6210\u529F");
          } catch (rebuildError) {
            console.error("[Stego] \u91CD\u5EFA\u9690\u5199\u56FE\u7247\u5931\u8D25:", rebuildError);
          }
        } else {
          console.log("[Stego] \u65E0\u73B0\u6709\u6570\u636E\u53EF\u7528\u4E8E\u91CD\u5EFA");
          try {
            await deleteStegoImage();
          } catch (delError) {
            console.warn("[Stego] \u5220\u9664\u635F\u574F\u56FE\u7247\u5931\u8D25:", delError);
          }
        }
      }
    } else {
      console.log("[Stego] \u9690\u5199\u56FE\u7247\u4E0D\u5B58\u5728\uFF0C\u68C0\u67E5\u662F\u5426\u9700\u8981\u521B\u5EFA...");
      if (!extension_settings[extensionName].jiuguanStorage) {
        extension_settings[extensionName].jiuguanStorage = {};
      }
      const currentData = extension_settings[extensionName].jiuguanStorage;
      if (currentData && Object.keys(currentData).length > 0) {
        console.log("[Stego] \u53D1\u73B0\u73B0\u6709\u6570\u636E\uFF0C\u521B\u5EFA\u9690\u5199\u56FE\u7247...");
        await createStegoImage();
      } else {
        console.log("[Stego] \u65E0\u9700\u521B\u5EFA\u9690\u5199\u56FE\u7247\uFF08\u6570\u636E\u4E3A\u7A7A\uFF09");
      }
    }
  } catch (error) {
    console.error("[Stego] \u521D\u59CB\u5316\u5931\u8D25:", error);
    if (!extension_settings[extensionName].jiuguanStorage) {
      extension_settings[extensionName].jiuguanStorage = {};
    }
    console.log("[Stego] \u4F7F\u7528\u73B0\u6709\u8BBE\u7F6E\u6570\u636E\u4F5C\u4E3A\u964D\u7EA7\u65B9\u6848");
  }
}

async function decodeStegoPayload(payload) {
  try {
    return JSON.parse(payload);
  } catch (jsonError) {
  }
  return await new ImageSteganography().decode(payload);
}

async function fetchStegoImage() {
  try {
    const imagePath = `user/images/${STEGO_FOLDER}/${STEGO_FILENAME}.png`;
    const response = await fetch(`/${imagePath}`, {
      method: "GET",
      headers: getRequestHeaders(window.token)
    });
    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch (error) {
    console.error("[Stego] \u83B7\u53D6\u56FE\u7247\u5931\u8D25:", error);
    return null;
  }
}

async function createStegoImage() {
  const stego = new ImageSteganography();
  const currentData = extension_settings[extensionName].jiuguanStorage || {};
  try {
    const imageBase64 = await stego.encode(currentData);
    await uploadStegoImage(imageBase64);
    console.log("[Stego] \u65B0\u9690\u5199\u56FE\u7247\u521B\u5EFA\u5E76\u4E0A\u4F20\u6210\u529F");
  } catch (error) {
    console.error("[Stego] \u521B\u5EFA\u9690\u5199\u56FE\u7247\u5931\u8D25:", error);
    throw error;
  }
}

async function updateStegoImage(options = {}) {
  const stego = new ImageSteganography();
  try {
    const currentData = extension_settings[extensionName].jiuguanStorage || {};
    console.log("[Stego] \u51C6\u5907\u66F4\u65B0\u9690\u5199\u56FE\u7247\uFF0C\u6570\u636E\u6761\u76EE\u6570:", Object.keys(currentData).length);
    const imageBase64 = await stego.encode(currentData);
    await deleteStegoImage();
    await uploadStegoImage(imageBase64);
    console.log("[Stego] \u9690\u5199\u56FE\u7247\u66F4\u65B0\u6210\u529F");
  } catch (error) {
    console.error("[Stego] \u66F4\u65B0\u9690\u5199\u56FE\u7247\u5931\u8D25:", error);
    if (options?.throwOnError) throw error;
  }
}

async function uploadStegoImage(imageBase64) {
  const base64Data = imageBase64.split(",")[1] || imageBase64;
  const response = await fetch("/api/images/upload", {
    method: "POST",
    headers: getRequestHeaders(window.token),
    body: JSON.stringify({
      image: base64Data,
      format: "png",
      ch_name: STEGO_FOLDER,
      filename: STEGO_FILENAME
    })
  });
  if (!response.ok) {
    throw new Error(`\u4E0A\u4F20\u5931\u8D25: ${response.statusText}`);
  }
  const result = await response.json();
  console.log("[Stego] \u56FE\u7247\u4E0A\u4F20\u6210\u529F:", result.path);
  return result.path;
}

async function deleteStegoImage() {
  try {
    const response = await fetch("/api/images/delete", {
      method: "POST",
      headers: getRequestHeaders(window.token),
      body: JSON.stringify({
        path: `user/images/${STEGO_FOLDER}/${STEGO_FILENAME}.png`
      })
    });
    if (response.ok) {
      console.log("[Stego] \u65E7\u56FE\u7247\u5220\u9664\u6210\u529F");
    }
  } catch (error) {
    console.warn("[Stego] \u5220\u9664\u65E7\u56FE\u7247\u5931\u8D25\uFF08\u53EF\u80FD\u4E0D\u5B58\u5728\uFF09:", error);
  }
}

export { calculateAllImageSizes, cancelSizeCalc, dbs, deleteImage, deleteImagesByUuids, deleteMultipleImages, generateMissingThumbnails, getAllImageMetadata, getImageBlobByUUID, getImageThumbnailBlobByUUID, getItemBlob, getItemImg, getItemMeta, getSizeCalcTask, initJiuguanStorage, migrateDatabase, setItemImg, subscribeSizeCalcProgress, syncServerImagesWithStorage, updateImageIndex, updateItemImgActiveMode, updateItemImgChange, updateItemImgVideo };
