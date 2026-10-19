// 还原自打包产物 — 原始模块: utils/novelai.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../script.js";
import { EventType, extensionName } from "./config.js";
import { acquireSerialLock, addLog, calculateSkipCfgAboveSigma, clearLog, convertImageToJpeg, deduplicateTags, fumian, generateRandomSeed, getRandomVibeGroupId, getRandomYusheId, getRequestHeaders, getSortedCharacterIds, isPluginEnabled, isPluginToastDisabled, parsePromptStringWithCoordinates, processReferenceImage, prompt_replace, prompt_replace_for_character, releaseSerialLock, sleep, stripChineseAnnotations, zhengmian } from "./utils.js";
import { getConfigImage } from "./configDatabase.js";
import { TaskStatus, TaskType, taskQueue } from "./taskQueue.js";
import { processCharacterPrompt } from "./characterprompt.js";
import { setItemImg } from "./database.js";
import { buildGenParams } from "./genParams.js";
import { bananaGenerate } from "./banana.js";
import { recordImageGeneration } from "./imageGenStats.js";
import { initializeImageProcessing } from "./iframe/index.js";
import { generateComfyUIImage } from "./comfyui.js";
import { NOVELAI_TIMEOUT_SECONDS, __set_currentCloudQueueInfo, activeAbortControllers, currentCloudQueueInfo, workingNovelAIUrlCache } from "./ui.js";
import { resolveVibeData } from "./settings/vibeGroupEditor.js";
import { completeQueue, getUserId, hashKey, leaveQueue, waitForTurn } from "./queueService.js";
import "./iframe.js"; // init_iframe2

var MAX_POLL_RETRIES, POLL_INTERVAL, currentTaskId4, vibeDataCache, vibeThumbnailCache, vibeThumbnailPending, vibeThumbnailWarmupPromise;

var currentTaskId4 = null;
var POLL_INTERVAL = 1e3;

var MAX_POLL_RETRIES = 3;
var vibeThumbnailCache = /* @__PURE__ */ new Map();

var vibeThumbnailPending = /* @__PURE__ */ new Map();

var vibeThumbnailWarmupPromise = null;

var vibeDataCache = /* @__PURE__ */ new Map();
function isSettingTrue3(val) {
  return val === true || val === "true";
}

function isSettingFalse(val) {
  return val === false || val === "false";
}

function normalizeNovelAIOtherSiteUrl(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\/+$/, "");
}

function getDirectHeaders3(contentType = null, auth = null) {
  const headers = {
    "Accept": "*/*"
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  if (auth) {
    headers["Authorization"] = auth;
  }
  return headers;
}

function clearNovelAIUrlCache() {
  workingNovelAIUrlCache.clear();
}

function evictNovelAIUrlCache(rawOtherSite, endpointPath = "/ai/generate-image") {
  if (!rawOtherSite) return;
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  workingNovelAIUrlCache.delete(`${rawOtherSite}|${normalizedPath}`);
}

function getNovelAICandidateUrls(endpointPath = "/ai/generate-image") {
  const settings3 = extension_settings[extensionName];
  if (settings3.novelaisite === "\u5B98\u7F51") {
    return {
      candidates: [`https://image.novelai.net${endpointPath}`],
      rawOtherSite: ""
    };
  }
  const otherSite = normalizeNovelAIOtherSiteUrl(settings3.novelaiOtherSite);
  if (!otherSite) {
    throw new Error("\u5DF2\u9009\u62E9\u7B2C\u4E09\u65B9\u7AD9\u70B9\uFF0C\u4F46\u672A\u586B\u5199 novelaiOtherSite \u5730\u5740");
  }
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  const pathKeyword = endpointPath.replace(/^\/+/, "");
  const cacheKey = `${otherSite}|${normalizedPath}`;
  const cachedUrl = workingNovelAIUrlCache.get(cacheKey);
  const candidates = [];
  if (otherSite.includes(pathKeyword) || otherSite.endsWith(normalizedPath)) {
    candidates.push(otherSite);
  } else {
    const joinedUrl = `${otherSite}${normalizedPath}`;
    candidates.push(joinedUrl);
    if (otherSite !== joinedUrl) {
      candidates.push(otherSite);
    }
  }
  if (cachedUrl && candidates.includes(cachedUrl)) {
    return {
      candidates: [cachedUrl, ...candidates.filter((u) => u !== cachedUrl)],
      rawOtherSite: otherSite
    };
  }
  return {
    candidates,
    rawOtherSite: otherSite
  };
}

async function postNovelAIWithFallback({
  candidates,
  rawOtherSite = "",
  endpointPath = "/ai/generate-image",
  headers,
  body,
  signal,
  logPrefix = "[NovelAI]"
}) {
  let lastError = null;
  let lastResponse = null;
  let lastErrorText = "";
  for (let i = 0; i < candidates.length; i++) {
    const currentUrl = candidates[i];
    const isLast = i === candidates.length - 1;
    const nextUrl = !isLast ? candidates[i + 1] : null;
    addLog(`${logPrefix} \u5C1D\u8BD5\u8BF7\u6C42\u7AEF\u70B9: ${currentUrl}`);
    let response = null;
    try {
      response = await fetch(currentUrl, {
        method: "POST",
        headers,
        body,
        signal
      });
    } catch (networkError) {
      if (signal && signal.aborted) {
        throw networkError;
      }
      if (isLast) {
        addLog(`${logPrefix} \u7F51\u7EDC\u9519\u8BEF: ${networkError.message}\u3002\u5C06\u57281\u79D2\u540E\u91CD\u8BD5...`);
        await sleep(1e3);
        try {
          response = await fetch(currentUrl, {
            method: "POST",
            headers,
            body,
            signal
          });
        } catch (retryError) {
          lastError = retryError;
          continue;
        }
      } else {
        addLog(`${logPrefix} \u7AEF\u70B9\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25 (${networkError.message})\uFF0C\u56DE\u9000\u5C1D\u8BD5\u5019\u9009\u7AEF\u70B9: ${nextUrl}`);
        lastError = networkError;
        continue;
      }
    }
    if (response && response.ok) {
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (contentType.includes("text/html") && !isLast) {
        addLog(`${logPrefix} \u7AEF\u70B9 ${currentUrl} \u8FD4\u56DE\u4E86 HTML (HTTP 200)\uFF0C\u7591\u4F3C\u672A\u5339\u914D\u7684\u8DEF\u7531\u9875\u9762\uFF0C\u56DE\u9000\u5C1D\u8BD5\u5019\u9009\u7AEF\u70B9: ${nextUrl}`);
        continue;
      }
      response._verifiedCandidateUrl = currentUrl;
      return response;
    }
    if (response) {
      lastResponse = response;
      try {
        lastErrorText = await response.text();
      } catch (e) {
        lastErrorText = "";
      }
      if (!isLast) {
        addLog(`${logPrefix} \u7AEF\u70B9 ${currentUrl} \u8FD4\u56DE HTTP ${response.status}\uFF0C\u56DE\u9000\u5C1D\u8BD5\u5019\u9009\u7AEF\u70B9: ${nextUrl}`);
        continue;
      }
    }
  }
  if (lastResponse) {
    let userFriendlyError = `\u8BF7\u6C42\u5931\u8D25, \u72B6\u6001\u7801: ${lastResponse.status}, \u9519\u8BEF\u4FE1\u606F: ${lastErrorText}`;
    switch (lastResponse.status) {
      case 400:
        try {
          const errorJson = JSON.parse(lastErrorText);
          if (errorJson.message) {
            userFriendlyError = `\u8BF7\u6C42\u9A8C\u8BC1\u5931\u8D25: ${errorJson.message}`;
            addLog(`${logPrefix} [API \u9519\u8BEF] 400 \u9A8C\u8BC1\u9519\u8BEF: ${errorJson.message}`);
          }
        } catch (e) {
          userFriendlyError = `\u8BF7\u6C42\u9A8C\u8BC1\u5931\u8D25: ${lastErrorText}`;
          addLog(`${logPrefix} [API \u9519\u8BEF] 400 \u9A8C\u8BC1\u9519\u8BEF: ${lastErrorText}`);
        }
        break;
      case 401:
        userFriendlyError = "API Key \u9519\u8BEF\u6216\u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5 API Key\u3002";
        addLog(`${logPrefix} [API \u9519\u8BEF] 401 \u8BA4\u8BC1\u5931\u8D25`);
        break;
      case 402:
        userFriendlyError = "\u9700\u8981\u6709\u6548\u8BA2\u9605\u624D\u80FD\u8BBF\u95EE\u6B64\u7AEF\u70B9\u3002";
        addLog(`${logPrefix} [API \u9519\u8BEF] 402 \u9700\u8981\u8BA2\u9605`);
        break;
      case 405:
        userFriendlyError = `\u7AEF\u70B9\u4E0D\u652F\u6301 POST \u8BF7\u6C42 (405 Method Not Allowed): ${lastErrorText || "\u8BF7\u68C0\u67E5\u662F\u5426\u4E3A\u5355 Endpoint \u6216\u8DEF\u5F84\u914D\u7F6E"}`;
        addLog(`${logPrefix} [API \u9519\u8BEF] 405 Method Not Allowed`);
        break;
      default:
        addLog(`${logPrefix} [API \u9519\u8BEF] ${lastResponse.status}: ${lastErrorText}`);
    }
    throw new Error(userFriendlyError);
  }
  if (lastError) {
    throw lastError;
  }
  throw new Error(`${logPrefix} \u672A\u80FD\u83B7\u5F97\u6709\u6548\u54CD\u5E94`);
}

function cleanNovelAIPayload(payload, modelVersion) {
  const isNAI3 = modelVersion === "nai-diffusion-3";
  const isNAI4or45 = modelVersion.includes("nai-diffusion-4");
  const cleanedPayload = { ...payload };
  if (isNAI3) {
    delete cleanedPayload.reference_image_multiple_cached;
    delete cleanedPayload.director_reference_images_cached;
    delete cleanedPayload.director_reference_descriptions;
    delete cleanedPayload.director_reference_information_extracted;
    delete cleanedPayload.director_reference_strength_values;
    delete cleanedPayload.director_reference_secondary_strength_values;
    addLog("[PayloadClean] \u5DF2\u79FB\u9664 NAI4/4.5 \u6570\u7EC4\uFF08\u4F7F\u7528 NAI3 \u6A21\u578B\uFF09");
  } else if (isNAI4or45) {
    delete cleanedPayload.reference_image_multiple;
    delete cleanedPayload.reference_information_extracted_multiple;
    addLog("[PayloadClean] \u5DF2\u79FB\u9664 NAI3 \u6570\u7EC4\uFF08\u4F7F\u7528 NAI4/4.5 \u6A21\u578B\uFF09");
  } else if (modelVersion.includes("nai-diffusion-5")) {
    delete cleanedPayload.reference_image_multiple;
    delete cleanedPayload.reference_information_extracted_multiple;
    delete cleanedPayload.skip_cfg_above_sigma;
    delete cleanedPayload.noise_schedule;
    if (Array.isArray(cleanedPayload.reference_strength_multiple) && cleanedPayload.reference_strength_multiple.length === 0) {
      delete cleanedPayload.reference_strength_multiple;
    }
    if (Array.isArray(cleanedPayload.reference_image_multiple_cached) && cleanedPayload.reference_image_multiple_cached.length === 0) {
      delete cleanedPayload.reference_image_multiple_cached;
    }
    if (cleanedPayload.sampler === "ddim_v3") {
      cleanedPayload.sampler = "k_euler_ancestral";
    }
    if (modelVersion.includes("medium")) {
      delete cleanedPayload.cfg_rescale;
      cleanedPayload.steps = 14;
      cleanedPayload.sampler = "k_euler_ancestral";
      addLog("[PayloadClean] \u5DF2\u9488\u5BF9 NAI5 Medium \u6863\u4F4D\u6E05\u7406 cfg_rescale \u5E76\u9501\u5B9A\u6B65\u6570 14\u3001\u91C7\u6837\u5668 Euler Ancestral");
    }
    addLog("[PayloadClean] \u5DF2\u9488\u5BF9 NAI5 \u6A21\u578B\u6E05\u7406\u7279\u5B9A\u4E0D\u652F\u6301\u7684\u53C2\u6570 (\u5305\u542B noise_schedule)");
  }
  return cleanedPayload;
}

function validateNovelAIPayload(payload, modelVersion) {
  const requiredFields = ["width", "height", "scale", "sampler", "steps", "seed"];
  for (const field of requiredFields) {
    if (payload[field] === void 0 || payload[field] === null) {
      throw new Error(`\u7F3A\u5C11\u5FC5\u9700\u5B57\u6BB5: ${field}`);
    }
  }
  if (modelVersion === "nai-diffusion-3") {
    const refImageLen = payload.reference_image_multiple?.length || 0;
    const refInfoLen = payload.reference_information_extracted_multiple?.length || 0;
    const refStrengthLen = payload.reference_strength_multiple?.length || 0;
    if (refImageLen > 0 || refInfoLen > 0 || refStrengthLen > 0) {
      if (refImageLen !== refInfoLen || refImageLen !== refStrengthLen) {
        const errorMsg = `NAI3 \u53C2\u8003\u6570\u7EC4\u957F\u5EA6\u4E0D\u5339\u914D: reference_image_multiple=${refImageLen}, reference_information_extracted_multiple=${refInfoLen}, reference_strength_multiple=${refStrengthLen}`;
        addLog(`[\u9A8C\u8BC1\u9519\u8BEF] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      addLog(`[\u9A8C\u8BC1] NAI3 \u53C2\u8003\u6570\u7EC4\u957F\u5EA6\u4E00\u81F4: ${refImageLen} \u4E2A\u53C2\u8003`);
    }
  }
  if (modelVersion.includes("nai-diffusion-4")) {
    const refCachedLen = payload.reference_image_multiple_cached?.length || 0;
    const refStrengthLen = payload.reference_strength_multiple?.length || 0;
    if (refCachedLen > 0 && refCachedLen !== refStrengthLen) {
      const errorMsg = `NAI4/4.5 Vibe Transfer \u6570\u7EC4\u957F\u5EA6\u4E0D\u5339\u914D: reference_image_multiple_cached=${refCachedLen}, reference_strength_multiple=${refStrengthLen}`;
      addLog(`[\u9A8C\u8BC1\u9519\u8BEF] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    if (refCachedLen > 0) {
      addLog(`[\u9A8C\u8BC1] NAI4/4.5 Vibe Transfer \u6570\u7EC4\u957F\u5EA6\u4E00\u81F4: ${refCachedLen} \u4E2A Vibe`);
    }
  }
  if (modelVersion.includes("4-5")) {
    const directorImages = payload.director_reference_images_cached?.length || 0;
    const directorDescriptions = payload.director_reference_descriptions?.length || 0;
    const directorInfo = payload.director_reference_information_extracted?.length || 0;
    const directorStrength = payload.director_reference_strength_values?.length || 0;
    const directorSecondary = payload.director_reference_secondary_strength_values?.length || 0;
    if (directorImages > 0) {
      if (directorImages !== directorDescriptions || directorImages !== directorInfo || directorImages !== directorStrength || directorImages !== directorSecondary) {
        const errorMsg = `\u89D2\u8272\u53C2\u8003\u6570\u7EC4\u957F\u5EA6\u4E0D\u5339\u914D: images=${directorImages}, descriptions=${directorDescriptions}, info=${directorInfo}, strength=${directorStrength}, secondary=${directorSecondary}`;
        addLog(`[\u9A8C\u8BC1\u9519\u8BEF] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      addLog(`[\u9A8C\u8BC1] \u89D2\u8272\u53C2\u8003\u6570\u7EC4\u957F\u5EA6\u4E00\u81F4: ${directorImages} \u4E2A\u53C2\u8003`);
    }
  }
  addLog("[\u9A8C\u8BC1] Payload \u9A8C\u8BC1\u901A\u8FC7");
}

async function applySingleVibeTransfer(preset_data) {
  if (!window.nai3VibeTransferImage || window.nai3VibeTransferImage === "") {
    addLog("[SingleVibe] \u672A\u8BBE\u7F6E Vibe Transfer \u56FE\u50CF\uFF0C\u8DF3\u8FC7");
    return;
  }
  try {
    addLog("[SingleVibe] \u5904\u7406 NAI3 \u5355\u4E2A Vibe Transfer");
    const processedImage = await processReferenceImage(window.nai3VibeTransferImage);
    const infoExtracted = Number(extension_settings[extensionName].InformationExtracted);
    const strength = Number(extension_settings[extensionName].ReferenceStrength);
    if (isNaN(infoExtracted) || infoExtracted < 0 || infoExtracted > 1) {
      throw new Error(`InformationExtracted \u503C\u65E0\u6548: ${infoExtracted}\u3002\u5FC5\u987B\u5728 0 \u5230 1 \u4E4B\u95F4\u3002`);
    }
    if (isNaN(strength) || strength < 0 || strength > 1) {
      throw new Error(`ReferenceStrength \u503C\u65E0\u6548: ${strength}\u3002\u5FC5\u987B\u5728 0 \u5230 1 \u4E4B\u95F4\u3002`);
    }
    preset_data.reference_image_multiple.push(processedImage);
    preset_data.reference_information_extracted_multiple.push(infoExtracted);
    preset_data.reference_strength_multiple.push(strength);
    addLog(`[SingleVibe] \u5DF2\u6DFB\u52A0 Vibe Transfer: info=${infoExtracted}, strength=${strength}`);
    addLog(`[SingleVibe] \u6570\u7EC4\u957F\u5EA6: images=${preset_data.reference_image_multiple.length}, info=${preset_data.reference_information_extracted_multiple.length}, strength=${preset_data.reference_strength_multiple.length}`);
  } catch (error) {
    addLog(`[SingleVibe] \u9519\u8BEF: ${error.message}`);
    throw error;
  }
}

function getEncodingKeyForModel(model) {
  if (model.includes("4-5-curated")) return "v4-5curated";
  if (model.includes("4-5-full")) return "v4-5full";
  if (model.includes("4-curated")) return "v4curated";
  if (model.includes("4-full")) return "v4full";
  if (model.includes("diffusion-3")) return "v3";
  console.warn("[VibeGroup] Unknown model:", model, "- defaulting to v4-5curated");
  return "v4-5curated";
}

function generateRandomUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}

function createLoggableNovelAIPayload(payload) {
  const loggablePayload = { ...payload };
  if (Array.isArray(payload.reference_image_multiple) && payload.reference_image_multiple.length > 0) {
    loggablePayload.reference_image_multiple = payload.reference_image_multiple.map(
      (image, index) => `...image data truncated (${image?.length || 0} chars)...`
    );
  }
  if (Array.isArray(payload.reference_image_multiple_cached) && payload.reference_image_multiple_cached.length > 0) {
    loggablePayload.reference_image_multiple_cached = payload.reference_image_multiple_cached.map((item) => ({
      cache_secret_key: item.cache_secret_key,
      data: `...vibe data truncated (${item.data?.length || 0} chars)...`
    }));
  }
  if (Array.isArray(payload.director_reference_images) && payload.director_reference_images.length > 0) {
    loggablePayload.director_reference_images = payload.director_reference_images.map(
      (image) => `...image data truncated (${image?.length || 0} chars)...`
    );
  }
  if (Array.isArray(payload.director_reference_images_cached) && payload.director_reference_images_cached.length > 0) {
    loggablePayload.director_reference_images_cached = payload.director_reference_images_cached.map((item) => ({
      cache_secret_key: item.cache_secret_key,
      data: `...char ref data truncated (${item.data?.length || 0} chars)...`
    }));
  }
  return loggablePayload;
}

async function applyVibeGroupTransfer(preset_data) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const currentGroupId = getRandomVibeGroupId();
  if (!vibeGroups || Object.keys(vibeGroups).length === 0) {
    const warningMsg = "\u8B66\u544A: \u672A\u627E\u5230 Vibe \u7EC4\u3002\u8BF7\u5148\u521B\u5EFA\u81F3\u5C11\u4E00\u4E2A Vibe \u7EC4\u3002";
    console.warn("[VibeGroup] No Vibe groups exist");
    addLog(`[VibeGroup] ${warningMsg}`);
    toastr.warning(warningMsg, "Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB");
    return;
  }
  if (!currentGroupId || !vibeGroups[currentGroupId]) {
    const warningMsg = "\u8B66\u544A: \u672A\u9009\u62E9\u6709\u6548\u7684 Vibe \u7EC4\u3002\u8BF7\u5728 Vibe \u7EC4\u7F16\u8F91\u5668\u4E2D\u9009\u62E9\u4E00\u4E2A\u7EC4\u3002";
    console.warn("[VibeGroup] No valid Vibe group selected for transfer");
    addLog(`[VibeGroup] ${warningMsg}`);
    toastr.warning(warningMsg, "Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB");
    return;
  }
  const currentGroup = vibeGroups[currentGroupId];
  const vibes = currentGroup.vibes || [];
  if (vibes.length === 0) {
    const errorMsg = "\u9519\u8BEF: \u9009\u4E2D\u7684 Vibe \u7EC4\u4E3A\u7A7A\u3002\u8BF7\u6DFB\u52A0\u81F3\u5C11\u4E00\u4E2A Vibe \u5230\u7EC4\u4E2D\u3002";
    console.warn("[VibeGroup] Selected Vibe group is empty");
    addLog(`[VibeGroup] ${errorMsg}`);
    toastr.error(errorMsg, "Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB");
    return;
  }
  console.log(`[VibeGroup] Applying Vibe group transfer: ${currentGroup.name || currentGroupId} (${vibes.length} Vibes)`);
  addLog(`[VibeGroup] \u5E94\u7528 Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB: ${currentGroup.name || currentGroupId} (${vibes.length} \u4E2A Vibe)`);
  let successCount = 0;
  let failureCount = 0;
  const vibeDataArray = [];
  for (const vibe of vibes) {
    try {
      const vibeJson = await resolveVibeData(vibe.vibeDataId);
      if (!vibeJson) {
        failureCount++;
        console.warn("[VibeGroup] Vibe data not found:", vibe.vibeDataId);
        addLog(`[VibeGroup] \u8B66\u544A: \u672A\u627E\u5230 Vibe \u6570\u636E: ${vibe.vibeDataId.substring(0, 12)}...`);
        continue;
      }
      const model = settings3.novelaimode;
      const encodingKey = getEncodingKeyForModel(model);
      console.log("[VibeGroup] Model mapping:", {
        originalModel: model,
        encodingKey,
        availableEncodings: Object.keys(vibeJson.encodings || {})
      });
      const modelEncodings = vibeJson.encodings?.[encodingKey];
      if (!modelEncodings) {
        failureCount++;
        console.warn("[VibeGroup] No encoding found for model:", model, "encodingKey:", encodingKey, "in Vibe:", vibe.vibeDataId);
        console.warn("[VibeGroup] Available encodings:", Object.keys(vibeJson.encodings || {}));
        addLog(`[VibeGroup] \u8B66\u544A: \u672A\u627E\u5230\u6A21\u578B ${model} (${encodingKey}) \u7684\u7F16\u7801`);
        continue;
      }
      const encodingKeys = Object.keys(modelEncodings);
      if (encodingKeys.length === 0) {
        failureCount++;
        console.warn("[VibeGroup] No encoding keys found for model:", model, "in Vibe:", vibe.vibeDataId);
        addLog(`[VibeGroup] \u8B66\u544A: \u672A\u627E\u5230\u6A21\u578B ${model} \u7684\u7F16\u7801\u952E`);
        continue;
      }
      const firstEncodingKey = encodingKeys[0];
      const encodingData = modelEncodings[firstEncodingKey];
      if (!encodingData || !encodingData.encoding) {
        failureCount++;
        console.warn("[VibeGroup] Invalid encoding structure for model:", model, "in Vibe:", vibe.vibeDataId);
        addLog(`[VibeGroup] \u8B66\u544A: \u7F16\u7801\u7ED3\u6784\u65E0\u6548`);
        continue;
      }
      const encoding = encodingData.encoding;
      const data = typeof encoding === "string" ? encoding : encoding.data || encoding;
      const infoExtracted = encodingData.params?.information_extracted || 1;
      vibeDataArray.push({
        data,
        infoExtracted,
        strength: vibe.strength
      });
      successCount++;
      console.log("[VibeGroup] Collected Vibe data:", {
        vibeDataId: vibe.vibeDataId.substring(0, 12) + "...",
        strength: vibe.strength,
        infoExtracted
      });
      addLog(`[VibeGroup] \u5DF2\u6536\u96C6 Vibe: \u5F3A\u5EA6=${vibe.strength}, \u4FE1\u606F\u63D0\u53D6=${infoExtracted}`);
    } catch (error) {
      failureCount++;
      console.error("[VibeGroup] Error processing Vibe:", {
        vibeDataId: vibe.vibeDataId,
        error: error.message,
        errorName: error.name,
        stack: error.stack
      });
      addLog(`[VibeGroup] \u9519\u8BEF: \u5904\u7406 Vibe \u5931\u8D25: ${error.message}`);
    }
  }
  if (vibeDataArray.length === 0) {
    console.warn("[VibeGroup] No vibes were successfully processed");
    addLog("[VibeGroup] \u8B66\u544A: \u6CA1\u6709\u6210\u529F\u5904\u7406\u4EFB\u4F55 Vibe");
    if (failureCount > 0) {
      toastr.error("\u6240\u6709 Vibe \u5904\u7406\u5931\u8D25\uFF0C\u5C06\u4E0D\u4F7F\u7528\u6C1B\u56F4\u8F6C\u79FB", "Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB");
    }
    return;
  }
  const totalStrength = vibeDataArray.reduce((sum, v) => sum + v.strength, 0);
  const shouldNormalize = extension_settings[extensionName].normalizeRefStrength === "true";
  const isNAI45Model = ["nai-diffusion-4-5-full", "nai-diffusion-4-5-curated"].includes(extension_settings[extensionName].novelaimode);
  let normalizedStrength;
  if (shouldNormalize && isNAI45Model) {
    normalizedStrength = vibeDataArray.map((v) => v.strength);
    console.log(`[VibeGroup] NAI 4.5 \u81EA\u52A8\u5F52\u4E00\u5316\u5DF2\u542F\u7528\uFF0C\u8DF3\u8FC7\u624B\u52A8\u8C03\u6574 (\u603B\u548C: ${totalStrength.toFixed(3)})`);
    addLog(`[VibeGroup] NAI 4.5 \u81EA\u52A8\u5F52\u4E00\u5316\u5DF2\u542F\u7528\uFF0C\u8DF3\u8FC7\u624B\u52A8\u8C03\u6574 (\u603B\u548C: ${totalStrength.toFixed(3)})`);
  } else if (totalStrength > 1) {
    normalizedStrength = vibeDataArray.map((v) => v.strength / totalStrength);
    console.log(`[VibeGroup] \u5F3A\u5EA6\u503C\u5DF2\u5F52\u4E00\u5316 (\u603B\u548C\u8D85\u8FC7 1.0: ${totalStrength.toFixed(3)})`);
    addLog(`[VibeGroup] \u5F3A\u5EA6\u503C\u5DF2\u5F52\u4E00\u5316 (\u603B\u548C\u8D85\u8FC7 1.0: ${totalStrength.toFixed(3)})`);
    normalizedStrength.forEach((s, i) => {
      console.log(`[VibeGroup]   Vibe ${i}: ${vibeDataArray[i].strength.toFixed(2)} \u2192 ${s.toFixed(3)}`);
    });
  } else {
    normalizedStrength = vibeDataArray.map((v) => v.strength);
    console.log(`[VibeGroup] \u4F7F\u7528\u539F\u59CB\u5F3A\u5EA6\u503C (\u603B\u548C: ${totalStrength.toFixed(3)})`);
    addLog(`[VibeGroup] \u4F7F\u7528\u539F\u59CB\u5F3A\u5EA6\u503C (\u603B\u548C: ${totalStrength.toFixed(3)})`);
  }
  for (let i = 0; i < vibeDataArray.length; i++) {
    const vibeData = vibeDataArray[i];
    const cacheSecretKey = generateRandomUUID();
    preset_data.reference_image_multiple_cached.push({
      cache_secret_key: cacheSecretKey,
      data: vibeData.data
    });
    preset_data.reference_strength_multiple.push(normalizedStrength[i]);
  }
  console.log(`[VibeGroup] Transfer complete: ${successCount} succeeded, ${failureCount} failed`);
  addLog(`[VibeGroup] \u6C1B\u56F4\u8F6C\u79FB\u5B8C\u6210: ${successCount} \u4E2A\u6210\u529F, ${failureCount} \u4E2A\u5931\u8D25`);
  console.log(`[VibeGroup] Added ${vibeDataArray.length} vibes to request parameters`);
  addLog(`[VibeGroup] \u5DF2\u6DFB\u52A0 ${vibeDataArray.length} \u4E2A Vibe \u5230\u8BF7\u6C42\u53C2\u6570`);
  if (failureCount > 0 && successCount > 0) {
    toastr.warning(`\u90E8\u5206 Vibe \u5904\u7406\u5931\u8D25 (${failureCount}/${vibes.length})\uFF0C\u4F46\u751F\u6210\u5C06\u7EE7\u7EED\u8FDB\u884C`, "Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB");
  }
  return currentGroup.name || currentGroupId;
}

async function applyCharacterReferenceGroup(preset_data) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const currentGroupId = settings3.charRefGroupId;
  if (!charRefGroups || Object.keys(charRefGroups).length === 0) {
    const warningMsg = "\u8B66\u544A: \u672A\u627E\u5230\u89D2\u8272\u53C2\u8003\u7EC4\u3002\u8BF7\u5148\u521B\u5EFA\u81F3\u5C11\u4E00\u4E2A\u89D2\u8272\u53C2\u8003\u7EC4\u3002";
    console.warn("[CharRef] No character reference groups exist");
    addLog(`[CharRef] ${warningMsg}`);
    toastr.warning(warningMsg, "\u89D2\u8272\u53C2\u8003");
    return;
  }
  if (!currentGroupId || !charRefGroups[currentGroupId]) {
    const warningMsg = "\u8B66\u544A: \u672A\u9009\u62E9\u6709\u6548\u7684\u89D2\u8272\u53C2\u8003\u7EC4\u3002\u8BF7\u5728\u89D2\u8272\u7EC4\u7F16\u8F91\u5668\u4E2D\u9009\u62E9\u4E00\u4E2A\u7EC4\u3002";
    console.warn("[CharRef] No valid character reference group selected");
    addLog(`[CharRef] ${warningMsg}`);
    toastr.warning(warningMsg, "\u89D2\u8272\u53C2\u8003");
    return;
  }
  const currentGroup = charRefGroups[currentGroupId];
  const references = currentGroup.references || [];
  if (references.length === 0) {
    const errorMsg = "\u9519\u8BEF: \u9009\u4E2D\u7684\u89D2\u8272\u53C2\u8003\u7EC4\u4E3A\u7A7A\u3002\u8BF7\u6DFB\u52A0\u81F3\u5C11\u4E00\u4E2A\u89D2\u8272\u53C2\u8003\u5230\u7EC4\u4E2D\u3002";
    console.warn("[CharRef] Selected character reference group is empty");
    addLog(`[CharRef] ${errorMsg}`);
    toastr.error(errorMsg, "\u89D2\u8272\u53C2\u8003");
    return;
  }
  console.log(`[CharRef] Applying character reference group: ${currentGroup.name || currentGroupId} (${references.length} references)`);
  addLog(`[CharRef] \u5E94\u7528\u89D2\u8272\u53C2\u8003\u7EC4: ${currentGroup.name || currentGroupId} (${references.length} \u4E2A\u53C2\u8003)`);
  let successCount = 0;
  let failureCount = 0;
  preset_data.director_reference_images_cached = [];
  preset_data.director_reference_descriptions = [];
  preset_data.director_reference_information_extracted = [];
  preset_data.director_reference_strength_values = [];
  preset_data.director_reference_secondary_strength_values = [];
  for (const ref of references) {
    try {
      const imageDataUrl = await getConfigImage(ref.imageId);
      if (!imageDataUrl) {
        failureCount++;
        console.warn("[CharRef] Reference image not found:", ref.imageId);
        addLog(`[CharRef] \u8B66\u544A: \u672A\u627E\u5230\u89D2\u8272\u53C2\u8003\u56FE\u50CF: ${ref.imageId.substring(0, 12)}...`);
        continue;
      }
      const processedImage = await processReferenceImage(imageDataUrl);
      const cacheSecretKey = generateRandomUUID();
      preset_data.director_reference_images_cached.push({
        cache_secret_key: cacheSecretKey,
        data: processedImage
      });
      let baseCaption = "character";
      if (ref.type === "character_style") {
        baseCaption = "character&style";
      } else if (ref.type === "style") {
        baseCaption = "style";
      }
      preset_data.director_reference_descriptions.push({
        caption: {
          base_caption: baseCaption,
          char_captions: []
        },
        legacy_uc: false
      });
      preset_data.director_reference_information_extracted.push(1);
      preset_data.director_reference_strength_values.push(ref.strength);
      preset_data.director_reference_secondary_strength_values.push(1 - ref.strength);
      successCount++;
      console.log("[CharRef] Added reference:", {
        imageId: ref.imageId.substring(0, 12) + "...",
        type: ref.type,
        strength: ref.strength,
        secondaryStrength: (1 - ref.strength).toFixed(3),
        fidelity: ref.fidelity,
        information_extracted: 1
      });
      addLog(`[CharRef] \u5DF2\u6DFB\u52A0\u53C2\u8003: \u7C7B\u578B=${ref.type}, \u5F3A\u5EA6=${ref.strength}, \u6B21\u8981\u5F3A\u5EA6=${(1 - ref.strength).toFixed(3)}, \u4FDD\u771F\u5EA6=${ref.fidelity}, information_extracted=1.0`);
    } catch (error) {
      failureCount++;
      console.error("[CharRef] Error processing reference:", {
        imageId: ref.imageId,
        error: error.message,
        errorName: error.name,
        stack: error.stack
      });
      addLog(`[CharRef] \u9519\u8BEF: \u5904\u7406\u89D2\u8272\u53C2\u8003\u5931\u8D25: ${error.message}`);
    }
  }
  console.log(`[CharRef] Application complete: ${successCount} succeeded, ${failureCount} failed`);
  addLog(`[CharRef] \u89D2\u8272\u53C2\u8003\u5E94\u7528\u5B8C\u6210: ${successCount} \u4E2A\u6210\u529F, ${failureCount} \u4E2A\u5931\u8D25`);
  if (failureCount > 0 && successCount > 0) {
    toastr.warning(`\u90E8\u5206\u89D2\u8272\u53C2\u8003\u5904\u7406\u5931\u8D25 (${failureCount}/${references.length})\uFF0C\u4F46\u751F\u6210\u5C06\u7EE7\u7EED\u8FDB\u884C`, "\u89D2\u8272\u53C2\u8003");
  }
  if (successCount === 0) {
    toastr.error("\u6240\u6709\u89D2\u8272\u53C2\u8003\u5904\u7406\u5931\u8D25\uFF0C\u5C06\u4E0D\u4F7F\u7528\u89D2\u8272\u53C2\u8003", "\u89D2\u8272\u53C2\u8003");
  }
}

async function unzipFile(inputData) {
  addLog("\u5F00\u59CB\u89E3\u538B ZIP \u6587\u4EF6...");
  const JSZipConstructor = window.stChatu8JSZip || window.JSZip;
  if (!JSZipConstructor || typeof JSZipConstructor.loadAsync !== "function") {
    const error = new Error("JSZip \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u89E3\u538B ZIP \u6587\u4EF6");
    addLog(error.message);
    throw error;
  }
  if (!inputData) {
    throw new Error("\u89E3\u538B\u6570\u636E\u4E3A\u7A7A");
  }
  const extractJsonError = (parsed, rawText) => {
    const errMsg = parsed.message || parsed.error?.message || parsed.error || parsed.msg || parsed.detail;
    if (errMsg) {
      return `API\u8FD4\u56DE\u9519\u8BEF: ${typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg}`;
    }
    return `API\u54CD\u5E94\u4E3AJSON\u4F46\u672A\u5305\u542B\u6709\u6548\u56FE\u50CF\u6570\u636E: ${rawText.substring(0, 150)}`;
  };
  if (typeof inputData === "string") {
    const trimmed = inputData.trim();
    if (trimmed.startsWith("data:image/")) {
      const commaIdx = trimmed.indexOf(",");
      return commaIdx !== -1 ? trimmed.substring(commaIdx + 1) : trimmed;
    }
    if (trimmed.startsWith("iVBORw0KGgo")) {
      return trimmed;
    }
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.images && parsed.images[0]) return parsed.images[0];
        if (parsed.image) return parsed.image;
        throw new Error(extractJsonError(parsed, trimmed));
      } catch (jsonErr) {
        if (jsonErr.message.startsWith("API")) throw jsonErr;
      }
    }
    if (trimmed.startsWith("<") && (trimmed.toLowerCase().includes("<!doctype") || trimmed.toLowerCase().includes("<html"))) {
      const titleMatch = trimmed.match(/<title[^>]*>([^<]+)<\/title>/i);
      const htmlHint = titleMatch ? ` (\u9875\u9762\u6807\u9898: ${titleMatch[1].trim()})` : "";
      throw new Error(`\u7AEF\u70B9\u8FD4\u56DE\u4E86HTML\u9875\u9762\u800C\u975E\u56FE\u50CF\u538B\u7F29\u5305${htmlHint}\u3002\u8BF7\u68C0\u67E5API\u5730\u5740\u3001\u53CD\u4EE3\u8DEF\u7531\u914D\u7F6E\u6216\u662F\u5426\u88AB\u62E6\u622A\u3002`);
    }
  }
  let uint8Data = null;
  if (inputData instanceof Uint8Array) {
    uint8Data = new Uint8Array(inputData.buffer, inputData.byteOffset, inputData.byteLength);
  } else if (inputData instanceof ArrayBuffer || Object.prototype.toString.call(inputData) === "[object ArrayBuffer]") {
    uint8Data = new Uint8Array(inputData);
  } else if (typeof Blob !== "undefined" && inputData instanceof Blob) {
    const ab = await inputData.arrayBuffer();
    uint8Data = new Uint8Array(ab);
  }
  let zipPayload = inputData;
  let loadOptions = {};
  if (uint8Data) {
    const isZipBinary = uint8Data.length >= 2 && uint8Data[0] === 80 && uint8Data[1] === 75;
    const isPngBinary = uint8Data.length >= 4 && uint8Data[0] === 137 && uint8Data[1] === 80 && uint8Data[2] === 78 && uint8Data[3] === 71;
    if (isPngBinary) {
      addLog("\u68C0\u6D4B\u5230\u8FD4\u56DE\u5185\u5BB9\u4E3A\u539F\u59CB PNG \u4E8C\u8FDB\u5236\uFF0C\u76F4\u63A5\u8F6C\u6362\u4E3A Base64");
      return uint8ArrayToBase642(uint8Data);
    }
    if (isZipBinary) {
      zipPayload = uint8Data;
    } else {
      let text = "";
      try {
        text = new TextDecoder().decode(uint8Data).trim();
      } catch (_) {
        text = "";
      }
      if (text.startsWith("UEsDB")) {
        zipPayload = text;
        loadOptions = { base64: true };
      } else if (text.startsWith("iVBORw0KGgo") || text.startsWith("data:image/")) {
        const commaIdx = text.indexOf(",");
        return commaIdx !== -1 ? text.substring(commaIdx + 1) : text;
      } else if (text.startsWith("{")) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.images && parsed.images[0]) return parsed.images[0];
          if (parsed.image) return parsed.image;
          throw new Error(extractJsonError(parsed, text));
        } catch (parseErr) {
          if (parseErr.message.startsWith("API")) throw parseErr;
          throw new Error(`API\u8FD4\u56DE\u65E0\u6548JSON\u54CD\u5E94: ${text.substring(0, 150)}`);
        }
      } else if (text.startsWith("<") && (text.toLowerCase().includes("<!doctype") || text.toLowerCase().includes("<html"))) {
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        const htmlHint = titleMatch ? ` (\u9875\u9762\u6807\u9898: ${titleMatch[1].trim()})` : "";
        throw new Error(`\u7AEF\u70B9\u8FD4\u56DE\u4E86HTML\u9875\u9762\u800C\u975E\u56FE\u50CF\u538B\u7F29\u5305${htmlHint}\u3002\u8BF7\u68C0\u67E5API\u5730\u5740\u3001\u53CD\u4EE3\u8DEF\u7531\u914D\u7F6E\u6216\u662F\u5426\u88AB\u62E6\u622A\u3002`);
      } else if (text.length > 0 && text.length < 500) {
        throw new Error(`\u7AEF\u70B9\u8FD4\u56DE\u975E\u9884\u671F\u6587\u672C\u54CD\u5E94: ${text}`);
      } else {
        const magicBytes = Array.from(uint8Data.slice(0, 4)).map((b) => "0x" + b.toString(16).padStart(2, "0")).join(", ");
        throw new Error(`\u8FD4\u56DE\u6570\u636E\u4E0D\u662F\u5408\u6CD5\u7684ZIP\u538B\u7F29\u5305\u6216\u56FE\u7247\u6587\u4EF6\uFF08\u524D\u5BFC\u5B57\u8282: [${magicBytes}]\uFF09`);
      }
    }
  } else if (typeof inputData === "string") {
    const trimmed = inputData.trim();
    if (trimmed.startsWith("UEsDB")) {
      zipPayload = trimmed;
      loadOptions = { base64: true };
    } else {
      throw new Error(`\u8F93\u5165\u5B57\u7B26\u4E32\u4E0D\u662F\u5408\u6CD5\u7684 Base64 ZIP \u6570\u636E`);
    }
  }
  try {
    const zip = await JSZipConstructor.loadAsync(zipPayload, loadOptions);
    addLog("ZIP \u6587\u4EF6\u52A0\u8F7D\u6210\u529F");
    let targetEntry = null;
    const allFileNames = Object.keys(zip.files);
    for (const fname of allFileNames) {
      const entry = zip.files[fname];
      if (entry && !entry.dir) {
        const lower = fname.toLowerCase();
        if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
          targetEntry = entry;
          break;
        }
      }
    }
    if (!targetEntry) {
      for (const fname of allFileNames) {
        const entry = zip.files[fname];
        if (entry && !entry.dir) {
          targetEntry = entry;
          break;
        }
      }
    }
    if (!targetEntry) {
      throw new Error("ZIP \u538B\u7F29\u5305\u4E2D\u672A\u627E\u5230\u4EFB\u4F55\u6709\u6548\u56FE\u50CF\u6587\u4EF6");
    }
    addLog(`\u5728 ZIP \u4E2D\u63D0\u53D6\u6587\u4EF6: ${targetEntry.name}`);
    const base64String = await targetEntry.async("base64");
    addLog(`\u6587\u4EF6 ${targetEntry.name} \u89E3\u538B\u4E3A Base64\uFF0C\u5927\u5C0F: ${base64String.length}`);
    return base64String;
  } catch (err) {
    addLog(`\u52A0\u8F7D/\u89E3\u538B ZIP \u6587\u4EF6\u5931\u8D25: ${err.message}`);
    throw err;
  }
}

function uint8ArrayToBase642(uint8Array) {
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

async function generateNovelAIImage({ prompt: link, width: Xwidth, height: Xheight, change, extraNegativePrompt }) {
  clearLog();
  const taskId = taskQueue.addTask({
    name: (link || "").substring(0, 30) + (link && link.length > 30 ? "..." : ""),
    type: TaskType.NOVELAI,
    prompt: link
  });
  const abortController = new AbortController();
  activeAbortControllers.set(taskId, abortController);
  let timeoutId = null;
  const resetGenerationTimeout = (sec = NOVELAI_TIMEOUT_SECONDS) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        abortController.abort(new Error(`NovelAI \u8BF7\u6C42\u8D85\u65F6\uFF08${sec}\u79D2\u65E0\u54CD\u5E94\uFF09`));
      } catch (_) {
      }
    }, sec * 1e3);
  };
  let lockAcquired = false;
  let isTaskAborted = false;
  await acquireSerialLock(taskId, abortController.signal);
  lockAcquired = true;
  taskQueue.updateStatus(taskId, TaskStatus.RUNNING);
  resetGenerationTimeout(NOVELAI_TIMEOUT_SECONDS);
  const startTime = Date.now();
  if (!isPluginToastDisabled()) {
    toastr.info("\u{1F3A8} \u5DF2\u53D1\u8D77 NovelAI \u751F\u56FE\u8BF7\u6C42...");
  }
  addLog(`\u5F00\u59CB NovelAI \u751F\u56FE\u6D41\u7A0B...\u5BA2\u6237\u7AEF\u4E3A${extension_settings[extensionName].client}`);
  addLog(`\u8BF7\u6C42\u5C3A\u5BF8: \u5BBD\u5EA6 - ${Xwidth || "\u9ED8\u8BA4"}, \u9AD8\u5EA6 - ${Xheight || "\u9ED8\u8BA4"}`);
  let _nai_vibe_group_name;
  let _nai_gen_params = null;
  console.log("\u6B63\u5728\u5904\u7406\u4E2D\u6587\u6CE8\u91CA...", link);
  let change_ = change;
  if (change) {
    change_ = change;
  } else {
    change_ = link;
  }
  const sizeRegex = /,?\s*(\d{2,4})x(\d{2,4})(?=[;\s]|$)/i;
  if (typeof link === "string") {
    const match = link.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        Xwidth = parseInt(match[1], 10);
        Xheight = parseInt(match[2], 10);
      }
    }
    link = link.replace(sizeRegex, "");
  }
  if (typeof change === "string") {
    const match = change.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        Xwidth = parseInt(match[1], 10);
        Xheight = parseInt(match[2], 10);
      }
    }
    change = change.replace(sizeRegex, "");
  }
  link = processCharacterPrompt(link);
  change = processCharacterPrompt(change);
  console.log("11111122" + JSON.stringify(link));
  link = await stripChineseAnnotations(link);
  change = await stripChineseAnnotations(change);
  console.log("\u6B63\u5728\u5904\u7406\u4E2D\u6587\u6CE8\u91CA\u5B8C\u6210...", link);
  if (extension_settings[extensionName].novelaiApi == "000000") {
    addLog("\u8BF7\u586B\u5199 NovelAI API Key");
    toastr.error("\u8BF7\u586B\u5199 NovelAI API Key");
    taskQueue.completeTask(taskId, false);
    currentTaskId = null;
    throw new Error("\u8BF7\u586B\u5199 NovelAI API Key");
  }
  const promptForGeneration = change && change.trim() !== "" ? change : link;
  addLog(`\u7528\u4E8E\u751F\u6210\u7684Tag: ${promptForGeneration}`);
  let Divide_roles = false;
  const modelMode = extension_settings[extensionName].novelaimode || "";
  if (promptForGeneration.includes("Scene Composition") && (modelMode.includes("nai-diffusion-4") || modelMode.includes("nai-diffusion-5"))) {
    Divide_roles = true;
  }
  addLog(`\u662F\u5426\u542F\u7528\u5206\u89D2\u8272\u6A21\u5F0F (Divide_roles): ${Divide_roles}`);
  let access_token = (extension_settings[extensionName].novelaiApi || "").trim();
  let aqt = "";
  if (extension_settings[extensionName].AQT_novelai != "" && extension_settings[extensionName].novelaimode == "nai-diffusion-4-curated-preview") {
    aqt = "rating:general, best quality, very aesthetic, absurdres";
  } else if (extension_settings[extensionName].AQT_novelai != "" && extension_settings[extensionName].novelaimode == "nai-diffusion-4-full") {
    aqt = "no text, best quality, very aesthetic, absurdres";
  } else if (extension_settings[extensionName].AQT_novelai != "" && extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-full") {
    aqt = "very aesthetic, masterpiece, no text";
  } else if (extension_settings[extensionName].AQT_novelai != "" && extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-curated") {
    aqt = "very aesthetic, masterpiece, no text, -0.8::feet::, rating:general";
  } else if (extension_settings[extensionName].AQT_novelai != "" && extension_settings[extensionName].novelaimode == "nai-diffusion-5-full") {
    aqt = "very aesthetic, masterpiece, no text";
  } else if (extension_settings[extensionName].AQT_novelai != "" && extension_settings[extensionName].novelaimode == "nai-diffusion-5-curated") {
    aqt = "very aesthetic, masterpiece, no text";
  } else if (extension_settings[extensionName].AQT_novelai != "" && extension_settings[extensionName].novelaimode == "nai-diffusion-3") {
    aqt = "best quality, amazing quality, very aesthetic, absurdres";
  }
  addLog(`AQT (\u8D28\u91CF\u6807\u7B7E) \u8BBE\u7F6E: ${aqt || "\u65E0"}`);
  let prompt2 = "";
  let prompt_data = {};
  let mainPrompt = "";
  let other_prompt = "";
  if (Divide_roles) {
    addLog("\u5206\u89D2\u8272\u6A21\u5F0F: \u89E3\u6790\u5E26\u5750\u6807\u7684\u63D0\u793A\u8BCD\u5B57\u7B26\u4E32\u3002");
    prompt_data = parsePromptStringWithCoordinates(promptForGeneration);
    mainPrompt = prompt_data["Scene Composition"];
    const charIds = getSortedCharacterIds(prompt_data);
    for (const i of charIds) {
      if (prompt_data[`Character ${i} coordinates`]) {
        const isAiDefaultCoords2 = extension_settings[extensionName].AI_use_coords === true || extension_settings[extensionName].AI_use_coords === "true";
        if (isAiDefaultCoords2) {
          prompt_data[`Character ${i} coordinates`] = {};
        }
      }
      if (prompt_data[`Character ${i} Prompt`]) {
        other_prompt = other_prompt + ", " + prompt_data[`Character ${i} Prompt`];
      }
    }
  } else {
    addLog("\u6807\u51C6\u6A21\u5F0F: \u4F7F\u7528\u8BF7\u6C42\u4E2D\u7684 prompt\u3002");
    mainPrompt = deduplicateTags(promptForGeneration);
  }
  let { modifiedPrompt, insertions } = await prompt_replace(mainPrompt, other_prompt);
  if (Divide_roles && extension_settings[extensionName].client == "jiuguan") {
    const charIds = getSortedCharacterIds(prompt_data);
    for (const i of charIds) {
      if (prompt_data[`Character ${i} Prompt`]) {
        modifiedPrompt = modifiedPrompt + " | " + prompt_replace_for_character(prompt_data[`Character ${i} Prompt`], (mainPrompt || "") + " " + (other_prompt || ""));
      }
    }
  }
  const _nai_yushe_id = getRandomYusheId("yusheid_novelai");
  if (!extension_settings[extensionName].yushe || !extension_settings[extensionName].yushe[_nai_yushe_id]) {
    toastr.error("\u672A\u80FD\u627E\u5230\u6240\u9009\u7684\u56FA\u5B9A\u63D0\u793A\u8BCD\u9884\u8BBE\u3002\u8BF7\u524D\u5F80\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u65B0\u5EFA\u6216\u9009\u62E9\u4E00\u4E2A\u56FA\u5B9A\u63D0\u793A\u8BCD\u3002", "NovelAI \u751F\u56FE\u9519\u8BEF");
    taskQueue.completeTask(taskId, false);
    currentTaskId = null;
    throw new Error("\u56FA\u5B9A\u63D0\u793A\u8BCD\u9884\u8BBE\u672A\u914D\u7F6E");
  }
  const _nai_preset = extension_settings[extensionName].yushe[_nai_yushe_id];
  prompt2 = await zhengmian(
    _nai_preset.fixedPrompt,
    modifiedPrompt,
    _nai_preset.fixedPrompt_end,
    aqt,
    insertions
  );
  if (isSettingTrue3(extension_settings[extensionName].addFurryDataset)) {
    prompt2 = "fur dataset, " + prompt2;
    addLog("\u6DFB\u52A0\u4E86 'fur dataset' \u5230\u63D0\u793A\u8BCD\u3002");
  }
  let UCP_novelai = "";
  addLog(`\u6B63\u5728\u6839\u636E\u6A21\u578B (${extension_settings[extensionName].novelaimode}) \u548C UCP \u9884\u8BBE (${extension_settings[extensionName].UCP_novelai}) \u9009\u62E9\u8D1F\u9762\u63D0\u793A\u8BCD...`);
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-3" && extension_settings[extensionName].UCP_novelai == "Heavy") {
    UCP_novelai = "lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-3" && extension_settings[extensionName].UCP_novelai == "Light") {
    UCP_novelai = "lowres, jpeg artifacts, worst quality, watermark, blurry, very displeasing";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-3" && extension_settings[extensionName].UCP_novelai == "Human Focus") {
    UCP_novelai = "lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract], bad anatomy, bad hands, @_@, mismatched pupils, heart-shaped pupils, glowing eyes";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-full" && extension_settings[extensionName].UCP_novelai == "Human Focus") {
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-full" && extension_settings[extensionName].UCP_novelai == "Heavy") {
    UCP_novelai = "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks, white blank page, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-full" && extension_settings[extensionName].UCP_novelai == "Light") {
    UCP_novelai = "blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, white blank page, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-curated-preview" && extension_settings[extensionName].UCP_novelai == "Human Focus") {
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-curated-preview" && extension_settings[extensionName].UCP_novelai == "Heavy") {
    UCP_novelai = "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, logo, dated, signature, multiple views, gigantic breasts, white blank page, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-curated-preview" && extension_settings[extensionName].UCP_novelai == "Light") {
    UCP_novelai = "blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, logo, dated, signature, white blank page, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-curated" && extension_settings[extensionName].UCP_novelai == "Human Focus") {
    UCP_novelai = "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-curated" && extension_settings[extensionName].UCP_novelai == "Heavy") {
    UCP_novelai = "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-curated" && extension_settings[extensionName].UCP_novelai == "Light") {
    UCP_novelai = "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-full" && extension_settings[extensionName].UCP_novelai == "Human Focus") {
    UCP_novelai = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-full" && extension_settings[extensionName].UCP_novelai == "Heavy") {
    UCP_novelai = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-full" && extension_settings[extensionName].UCP_novelai == "Light") {
    UCP_novelai = "lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page";
  }
  if (extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-full" && extension_settings[extensionName].UCP_novelai == "Furry Focus") {
    UCP_novelai = "{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic";
  }
  const isV5ModelUcp = extension_settings[extensionName].novelaimode.includes("nai-diffusion-5");
  if (isV5ModelUcp) {
    const ucpKey = String(extension_settings[extensionName].UCP_novelai || "").toLowerCase().replace(/[\s_-]+/g, "");
    if (ucpKey === "humanfocus") {
      UCP_novelai = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy";
    } else if (ucpKey === "heavy") {
      UCP_novelai = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page";
    } else if (ucpKey === "light") {
      UCP_novelai = "lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::";
    } else if (ucpKey === "furryfocus") {
      UCP_novelai = "{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic";
    } else if (ucpKey === "none") {
      UCP_novelai = "";
    }
  }
  let negative_prompt = await fumian(_nai_preset.negativePrompt, UCP_novelai);
  if (!Divide_roles && window.collectedCharacterNegatives) {
    const characterNegatives = window.collectedCharacterNegatives.trim();
    if (characterNegatives) {
      negative_prompt = negative_prompt ? `${negative_prompt}, ${characterNegatives}` : characterNegatives;
      addLog(`[\u89D2\u8272\u8D1F\u9762] \u6DFB\u52A0\u89D2\u8272\u8D1F\u9762\u63D0\u793A\u8BCD: ${characterNegatives}`);
      console.log("[NovelAI] \u5408\u5E76\u89D2\u8272\u8D1F\u9762\u63D0\u793A\u8BCD:", characterNegatives);
    }
  }
  if (extraNegativePrompt && extraNegativePrompt.trim()) {
    const trimmedExtra = extraNegativePrompt.trim();
    negative_prompt = negative_prompt ? `${negative_prompt}, ${trimmedExtra}` : trimmedExtra;
    addLog(`[\u667A\u7ED8\u59EC] \u6DFB\u52A0\u989D\u5916\u8D1F\u9762\u63D0\u793A\u8BCD: ${trimmedExtra}`);
    console.log("[NovelAI] \u5408\u5E76\u667A\u7ED8\u59EC\u989D\u5916\u8D1F\u9762\u63D0\u793A\u8BCD:", trimmedExtra);
  }
  const isAiDefaultCoords = extension_settings[extensionName].AI_use_coords === true || extension_settings[extensionName].AI_use_coords === "true";
  let use_coords = !isAiDefaultCoords;
  let preset_data = {
    "params_version": extension_settings[extensionName].novelaimode.includes("nai-diffusion-5") ? 4 : 3,
    "width": Number(Xwidth ? Xwidth : extension_settings[extensionName].novelai_width),
    "height": Number(Xheight ? Xheight : extension_settings[extensionName].novelai_height),
    "scale": Number(extension_settings[extensionName].nai3Scale),
    //提示词关联性
    "sampler": extension_settings[extensionName].novelai_sampler,
    //"k_euler",//使用的采样器   "k_dpm_2"   "k_dpmpp_2m"    "ddim_v3"  "k_dpmpp_2s_ancestral"
    "steps": Number(extension_settings[extensionName].novelai_steps),
    //生成的步数
    "n_samples": 1,
    "ucPreset": 3,
    //预设
    "qualityToggle": true,
    "sm": isSettingFalse(extension_settings[extensionName].sm) ? false : true,
    "sm_dyn": isSettingFalse(extension_settings[extensionName].dyn) || isSettingFalse(extension_settings[extensionName].sm) ? false : true,
    "dynamic_thresholding": isSettingFalse(extension_settings[extensionName].nai3Deceisp) ? false : true,
    "controlnet_strength": 1,
    "legacy": false,
    "legacy_uc": false,
    "add_original_image": true,
    "cfg_rescale": Number(extension_settings[extensionName].cfg_rescale),
    //关联性调整
    "noise_schedule": extension_settings[extensionName].Schedule,
    "skip_cfg_above_sigma": isSettingFalse(extension_settings[extensionName].nai3Variety) ? null : 19,
    "legacy_v3_extend": false,
    "stream": "msgpack",
    "params_version": extension_settings[extensionName].novelaimode.includes("nai-diffusion-5") ? 4 : 3,
    "seed": extension_settings[extensionName].novelai_seed === "0" || extension_settings[extensionName].novelai_seed === "" || extension_settings[extensionName].novelai_seed === "-1" ? generateRandomSeed() : Number(extension_settings[extensionName].novelai_seed),
    //生成的种子，下面是固定的负面提示词
    "negative_prompt": negative_prompt,
    "reference_image_multiple": [],
    "reference_information_extracted_multiple": [],
    "reference_strength_multiple": [],
    "reference_image_multiple_cached": [],
    "normalize_reference_strength_multiple": isSettingTrue3(extension_settings[extensionName].normalizeRefStrength),
    "use_coords": use_coords
  };
  if (extension_settings[extensionName].novelaimode !== "nai-diffusion-3") {
    if (Divide_roles) {
      const charIds = getSortedCharacterIds(prompt_data);
      for (const i of charIds) {
        if (prompt_data[`Character ${i} Prompt`]) {
          prompt_data[`Character ${i} Prompt`] = await prompt_replace_for_character(prompt_data[`Character ${i} Prompt`], (mainPrompt || "") + " " + (other_prompt || ""));
          prompt_data[`Character ${i} Prompt`] = prompt_data[`Character ${i} Prompt`].replace(/1boy/gi, "boy").replace(/1girl/gi, "girl");
        }
      }
      let characterPrompts = [];
      for (const i of charIds) {
        if (prompt_data[`Character ${i} Prompt`]) {
          characterPrompts.push({ enabled: true, prompt: prompt_data[`Character ${i} Prompt`], center: prompt_data[`Character ${i} coordinates`], uc: prompt_data[`Character ${i} UC`] ? prompt_data[`Character ${i} UC`] : "" });
        }
      }
      let v4_negative_prompt = { caption: { base_caption: negative_prompt, char_captions: [] }, legacy_uc: false };
      for (const i of charIds) {
        if (prompt_data[`Character ${i} Prompt`]) {
          v4_negative_prompt.caption.char_captions.push({ char_caption: prompt_data[`Character ${i} UC`] ? prompt_data[`Character ${i} UC`] : "", centers: [prompt_data[`Character ${i} coordinates`]] });
        }
      }
      let v4_prompt = { caption: { base_caption: prompt2, char_captions: [] }, use_coords, use_order: true };
      for (const i of charIds) {
        if (prompt_data[`Character ${i} Prompt`]) {
          v4_prompt.caption.char_captions.push({ char_caption: prompt_data[`Character ${i} Prompt`], centers: [prompt_data[`Character ${i} coordinates`]] });
        }
      }
      preset_data = { ...preset_data, characterPrompts, v4_prompt, v4_negative_prompt, add_original_image: true, skip_cfg_above_sigma: isSettingFalse(extension_settings[extensionName].nai3Variety) ? null : 19.343056794463642 };
      if (!isSettingFalse(extension_settings[extensionName].nai3Variety) && extension_settings[extensionName].novelaimode == "nai-diffusion-4-full") {
        preset_data["skip_cfg_above_sigma"] = 19;
      }
      if (!isSettingFalse(extension_settings[extensionName].nai3Variety) && (extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-curated" || extension_settings[extensionName].novelaimode == "nai-diffusion-4-5-full")) {
        preset_data["skip_cfg_above_sigma"] = 59.04722600415217;
      }
      preset_data = {
        "autoSmea": false,
        "normalize_reference_strength_multiple": isSettingTrue3(extension_settings[extensionName].normalizeRefStrength),
        "inpaintImg2ImgStrength": 1,
        "params_version": extension_settings[extensionName].novelaimode.includes("nai-diffusion-5") ? 4 : 3,
        "width": Number(Xwidth ? Xwidth : extension_settings[extensionName].novelai_width),
        "height": Number(Xheight ? Xheight : extension_settings[extensionName].novelai_height),
        "scale": Number(extension_settings[extensionName].nai3Scale),
        //提示词关联性
        "sampler": extension_settings[extensionName].novelai_sampler,
        //"k_euler",//使用的采样器   "k_dpm_2"   "k_dpmpp_2m"    "ddim_v3"  "k_dpmpp_2s_ancestral"
        "steps": Number(extension_settings[extensionName].novelai_steps),
        //生成的步数
        "n_samples": 1,
        "ucPreset": 3,
        //预设
        "qualityToggle": true,
        "dynamic_thresholding": false,
        "controlnet_strength": 1,
        "legacy": false,
        "legacy_uc": false,
        "add_original_image": true,
        "cfg_rescale": Number(extension_settings[extensionName].cfg_rescale),
        //关联性调整
        "noise_schedule": extension_settings[extensionName].Schedule,
        "skip_cfg_above_sigma": isSettingFalse(extension_settings[extensionName].nai3Variety) ? null : 19.343056794463642,
        "legacy_v3_extend": false,
        "seed": extension_settings[extensionName].novelai_seed === "0" || extension_settings[extensionName].novelai_seed === "" || extension_settings[extensionName].novelai_seed === "-1" ? generateRandomSeed() : Number(extension_settings[extensionName].novelai_seed),
        //生成的种子，下面是固定的负面提示词
        "negative_prompt": negative_prompt,
        "reference_image_multiple": [],
        "reference_information_extracted_multiple": [],
        "reference_strength_multiple": [],
        "reference_image_multiple_cached": [],
        "use_coords": use_coords,
        "stream": "msgpack",
        "characterPrompts": characterPrompts,
        "v4_prompt": v4_prompt,
        "v4_negative_prompt": v4_negative_prompt
      };
    } else {
      preset_data = {
        "autoSmea": false,
        "normalize_reference_strength_multiple": isSettingTrue3(extension_settings[extensionName].normalizeRefStrength),
        "inpaintImg2ImgStrength": 1,
        "params_version": extension_settings[extensionName].novelaimode.includes("nai-diffusion-5") ? 4 : 3,
        "width": Number(Xwidth ? Xwidth : extension_settings[extensionName].novelai_width),
        "height": Number(Xheight ? Xheight : extension_settings[extensionName].novelai_height),
        "scale": Number(extension_settings[extensionName].nai3Scale),
        //提示词关联性
        "sampler": extension_settings[extensionName].novelai_sampler,
        //"k_euler",//使用的采样器   "k_dpm_2"   "k_dpmpp_2m"    "ddim_v3"  "k_dpmpp_2s_ancestral"
        "steps": Number(extension_settings[extensionName].novelai_steps),
        //生成的步数
        "n_samples": 1,
        "ucPreset": 3,
        //预设
        "qualityToggle": false,
        "dynamic_thresholding": false,
        "controlnet_strength": 1,
        "legacy": false,
        "legacy_uc": false,
        "add_original_image": true,
        "cfg_rescale": Number(extension_settings[extensionName].cfg_rescale),
        //关联性调整
        "noise_schedule": extension_settings[extensionName].Schedule,
        "skip_cfg_above_sigma": isSettingFalse(extension_settings[extensionName].nai3Variety) ? null : 19.343056794463642,
        "legacy_v3_extend": false,
        "seed": extension_settings[extensionName].novelai_seed === "0" || extension_settings[extensionName].novelai_seed === "" || extension_settings[extensionName].novelai_seed === "-1" ? generateRandomSeed() : Number(extension_settings[extensionName].novelai_seed),
        //生成的种子，下面是固定的负面提示词
        "negative_prompt": negative_prompt,
        "reference_image_multiple": [],
        "reference_information_extracted_multiple": [],
        "reference_strength_multiple": [],
        "reference_image_multiple_cached": [],
        "use_coords": use_coords,
        "characterPrompts": [],
        "stream": "msgpack",
        "v4_prompt": {
          "caption": {
            "base_caption": prompt2,
            "char_captions": []
          },
          "use_coords": use_coords,
          "use_order": true
        },
        "v4_negative_prompt": {
          "caption": {
            "base_caption": negative_prompt,
            "char_captions": []
          },
          legacy_uc: false
        }
      };
    }
  }
  if (extension_settings[extensionName].novelaimode.includes("nai-diffusion-5")) {
    let ucPresetInt = 0;
    const ucpVal = String(extension_settings[extensionName].UCP_novelai || "").toLowerCase().replace(/[\s_-]+/g, "");
    if (ucpVal === "heavy") ucPresetInt = 1;
    else if (ucpVal === "furryfocus") ucPresetInt = 2;
    else if (ucpVal === "light") ucPresetInt = 3;
    else if (ucpVal === "humanfocus") ucPresetInt = 4;
    preset_data.tag_hint_uc_preset = ucPresetInt;
    preset_data.tag_hint_qt = 1;
    preset_data.straight_alpha = extension_settings[extensionName].novelai_straight_alpha === true;
    if (extension_settings[extensionName].novelai_straight_alpha === true) {
      preset_data.tag_hint_transparent_background = true;
    }
  }
  if (extension_settings[extensionName].novelai_sampler == "k_euler_ancestral") {
    preset_data["deliberate_euler_ancestral_bug"] = false;
    preset_data["prefer_brownian"] = true;
  }
  if (!isSettingFalse(extension_settings[extensionName].nai3Variety)) {
    preset_data["skip_cfg_above_sigma"] = calculateSkipCfgAboveSigma(preset_data.width, preset_data.height, extension_settings[extensionName].novelaimode);
  }
  const isNAI3 = extension_settings[extensionName].novelaimode === "nai-diffusion-3";
  const isNAI45 = ["nai-diffusion-4-5-full", "nai-diffusion-4-5-curated"].includes(extension_settings[extensionName].novelaimode);
  const isNAI4or45 = [
    "nai-diffusion-4-full",
    "nai-diffusion-4-curated-preview",
    "nai-diffusion-4-5-full",
    "nai-diffusion-4-5-curated"
  ].includes(extension_settings[extensionName].novelaimode);
  const isBrowserClient = extension_settings[extensionName].client !== "jiuguan";
  if (isSettingTrue3(extension_settings[extensionName].nai3CharRef) && isNAI45 && isBrowserClient) {
    try {
      await applyCharacterReferenceGroup(preset_data);
    } catch (error) {
      console.error("[CharRef] Unexpected error in Character Reference:", error);
      addLog(`[CharRef] \u9519\u8BEF: \u89D2\u8272\u53C2\u8003\u5E94\u7528\u5931\u8D25: ${error.message}`);
      toastr.error("\u89D2\u8272\u53C2\u8003\u5E94\u7528\u5931\u8D25\uFF0C\u5C06\u7EE7\u7EED\u8FDB\u884C\u56FE\u50CF\u751F\u6210", "\u89D2\u8272\u53C2\u8003");
    }
  } else if (isSettingTrue3(extension_settings[extensionName].nai3CharRef)) {
    if (!isNAI45) {
      addLog("[CharRef] \u8DF3\u8FC7: \u5F53\u524D\u6A21\u578B\u4E0D\u652F\u6301\u89D2\u8272\u53C2\u8003 (\u4EC5\u652F\u6301 NAI4.5)");
      console.warn("[CharRef] Skipped: Current model does not support Character Reference (NAI4.5 only)");
    }
    if (!isBrowserClient) {
      addLog("[CharRef] \u8DF3\u8FC7: \u9152\u9986\u7AEF\u4E0D\u652F\u6301\u89D2\u8272\u53C2\u8003");
      console.warn("[CharRef] Skipped: Tavern client does not support Character Reference");
    }
  } else if (isSettingTrue3(extension_settings[extensionName].enableVibeGroupTransfer) && isNAI4or45 && isBrowserClient) {
    try {
      _nai_vibe_group_name = await applyVibeGroupTransfer(preset_data);
    } catch (error) {
      console.error("[VibeGroup] Unexpected error in Vibe Group Transfer:", error);
      addLog(`[VibeGroup] \u9519\u8BEF: Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB\u5931\u8D25: ${error.message}`);
      toastr.error("Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB\u5931\u8D25\uFF0C\u5C06\u7EE7\u7EED\u8FDB\u884C\u56FE\u50CF\u751F\u6210", "Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB");
    }
  } else if (isSettingTrue3(extension_settings[extensionName].enableVibeGroupTransfer)) {
    if (!isNAI4or45) {
      addLog("[VibeGroup] \u8DF3\u8FC7: \u5F53\u524D\u6A21\u578B\u4E0D\u652F\u6301 Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB (\u4EC5\u652F\u6301 NAI4/4.5)");
      console.warn("[VibeGroup] Skipped: Current model does not support Vibe Group Transfer (NAI4/4.5 only)");
    }
    if (!isBrowserClient) {
      addLog("[VibeGroup] \u8DF3\u8FC7: \u9152\u9986\u7AEF\u4E0D\u652F\u6301 Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB");
      console.warn("[VibeGroup] Skipped: Tavern client does not support Vibe Group Transfer");
    }
  } else if (isSettingTrue3(extension_settings[extensionName].nai3VibeTransfer) && isNAI3) {
    try {
      await applySingleVibeTransfer(preset_data);
    } catch (error) {
      console.error("[SingleVibe] Unexpected error in Single Vibe Transfer:", error);
      addLog(`[SingleVibe] \u9519\u8BEF: \u5355\u4E2A Vibe \u8F6C\u79FB\u5931\u8D25: ${error.message}`);
      toastr.error("Vibe \u8F6C\u79FB\u5931\u8D25\uFF0C\u5C06\u7EE7\u7EED\u8FDB\u884C\u56FE\u50CF\u751F\u6210", "Vibe \u8F6C\u79FB");
    }
  } else if (isSettingTrue3(extension_settings[extensionName].nai3VibeTransfer)) {
    if (!isNAI3) {
      addLog("[SingleVibe] \u8DF3\u8FC7: \u5F53\u524D\u6A21\u578B\u4E0D\u652F\u6301\u5355\u4E2A Vibe \u8F6C\u79FB (\u4EC5\u652F\u6301 NAI3)");
      console.warn("[SingleVibe] Skipped: Current model does not support Single Vibe Transfer (NAI3 only)");
    }
  }
  addLog("[Payload] \u5F00\u59CB\u6E05\u7406\u548C\u9A8C\u8BC1 payload...");
  const baseModel = extension_settings[extensionName].novelaimode;
  const isMediumEffort = baseModel === "nai-diffusion-5-full" && extension_settings[extensionName].novelai_v5_effort === "medium";
  const actualModel = isMediumEffort ? "nai-diffusion-5-full-medium" : baseModel;
  if (isMediumEffort) {
    addLog("[NovelAI] \u68C0\u6D4B\u5230\u542F\u7528 V5 Full Medium \u8D28\u91CF/\u7B97\u529B\u6863\u4F4D\uFF0C\u5207\u6362\u4E3A nai-diffusion-5-full-medium\uFF08\u9501\u5B9A 14 \u6B65\uFF09");
  }
  preset_data = cleanNovelAIPayload(preset_data, actualModel);
  try {
    validateNovelAIPayload(preset_data, actualModel);
  } catch (validationError) {
    addLog(`[\u9A8C\u8BC1\u5931\u8D25] ${validationError.message}`);
    toastr.error(`Payload \u9A8C\u8BC1\u5931\u8D25: ${validationError.message}`, "NovelAI \u751F\u6210\u9519\u8BEF");
    taskQueue.completeTask(taskId, false);
    currentTaskId = null;
    throw validationError;
  }
  const payload = preset_data;
  _nai_gen_params = buildGenParams("NovelAI", {
    model: actualModel,
    effort: isMediumEffort ? "medium" : "high",
    yushe: _nai_yushe_id,
    yusheRandom: isSettingTrue3(extension_settings[extensionName].randomYushe),
    promptReplaceId: extension_settings[extensionName].prompt_replace_id,
    vibeGroup: _nai_vibe_group_name,
    vibeGroupRandom: isSettingTrue3(extension_settings[extensionName].randomVibeGroup),
    charRefGroup: isSettingTrue3(extension_settings[extensionName].nai3CharRef) ? extension_settings[extensionName].charRefGroupId : void 0,
    resolvedPrompt: prompt2,
    negativePrompt: payload.negative_prompt,
    width: payload.width,
    height: payload.height,
    seed: payload.seed,
    steps: payload.steps,
    sampler: payload.sampler,
    scheduler: payload.noise_schedule,
    cfgScale: payload.scale
  });
  const loggablePayload = createLoggableNovelAIPayload(payload);
  if (extension_settings[extensionName].client != "jiuguan") {
    addLog(`\u6700\u7EC8\u751F\u56FE\u53C2\u6570 (payload): ${JSON.stringify(loggablePayload, null, 2)}`);
  }
  if (extension_settings[extensionName].novelaisite != "\u5B98\u7F51") {
    if (extension_settings[extensionName].client == "jiuguan") {
      taskQueue.completeTask(taskId, false);
      throw new Error("\u9152\u9986\u7AEF\u4E0D\u652F\u6301\u81EA\u5B9A\u4E49\u7AD9\u70B9\uFF01");
    }
    let otherSite = normalizeNovelAIOtherSiteUrl(extension_settings[extensionName].novelaiOtherSite);
    if (!otherSite) {
      taskQueue.completeTask(taskId, false);
      throw new Error("\u5DF2\u9009\u62E9\u7B2C\u4E09\u65B9\u7AD9\u70B9\uFF0C\u4F46\u672A\u586B\u5199 novelaiOtherSite \u5730\u5740");
    }
  }
  try {
    let re = "";
    if (!taskQueue.isTaskInQueue(taskId)) {
      addLog("\u6B63\u5F0F\u8BF7\u6C42\u524D\u68C0\u6D4B\u5230\u4EFB\u52A1\u5DF2\u88AB\u53D6\u6D88\u3002");
      throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    if (isSettingTrue3(extension_settings[extensionName].enableCloudQueue)) {
      const keyHash = await hashKey(access_token);
      const userId = getUserId();
      try {
        addLog("[\u4E91\u7AEF\u961F\u5217] \u5F00\u59CB\u7B49\u5F85...");
        const result = await waitForTurn(keyHash, userId, taskId, taskQueue, {
          signal: abortController.signal
        });
        __set_currentCloudQueueInfo({ keyHash, userId, taskId, lockToken: result.lockToken });
        addLog("[\u4E91\u7AEF\u961F\u5217] \u5DF2\u83B7\u5F97\u9501\uFF0C\u7B49\u5F851\u79D2\u540E\u5F00\u59CB\u751F\u6210");
        await sleep(1e3);
      } catch (error) {
        __set_currentCloudQueueInfo(null);
        throw error;
      }
    }
    resetGenerationTimeout(NOVELAI_TIMEOUT_SECONDS);
    if (extension_settings[extensionName].client == "jiuguan") {
      const read = await fetch("/api/secrets/read", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify({})
      });
      if (read.ok) {
        if (extension_settings[extensionName].novelaiApi_id != "") {
          await fetch("/api/secrets/delete", {
            method: "POST",
            headers: getRequestHeaders(window.token),
            body: JSON.stringify({ id: extension_settings[extensionName].novelaiApi_id, key: "api_key_novel" })
          });
        }
        const reSecret = await fetch("/api/secrets/write", {
          method: "POST",
          headers: getRequestHeaders(window.token),
          body: JSON.stringify({ key: "api_key_novel", value: extension_settings[extensionName].novelaiApi, label: "\u63D2\u4EF6\u8BBE\u7F6E\u7684api_key_novel" })
        });
        if (!reSecret.ok) {
          const errorText = await reSecret.text();
          throw new Error(`Failed to write secret: ${errorText}`);
        }
        const responseText = await reSecret.text();
        try {
          const novelid = JSON.parse(responseText);
          if (novelid && novelid.id) {
            extension_settings[extensionName].novelaiApi_id = novelid.id;
            saveSettingsDebounced();
            await fetch("/api/secrets/rotate", {
              method: "POST",
              headers: getRequestHeaders(window.token),
              body: JSON.stringify({ id: novelid.id, key: "api_key_novel" })
            });
          }
        } catch (e) {
          addLog(`Could not parse JSON from /api/secrets/write. Response was: "${responseText}". Continuing without rotating key.`);
          console.warn(`Could not parse JSON from /api/secrets/write. Response was: "${responseText}". Continuing without rotating key.`);
        }
      }
      const tavernAIPayload = { prompt: prompt2, model: actualModel, sampler: preset_data.sampler, scheduler: preset_data.noise_schedule, steps: preset_data.steps, scale: preset_data.scale, width: preset_data.width, height: preset_data.height, negative_prompt: preset_data.negative_prompt, decrisper: preset_data.dynamic_thresholding, variety_boost: preset_data.skip_cfg_above_sigma, sm: preset_data.sm, sm_dyn: preset_data.sm_dyn, seed: preset_data.seed };
      if (actualModel.includes("nai-diffusion-5")) {
        tavernAIPayload.tag_hint_uc_preset = preset_data.tag_hint_uc_preset;
        tavernAIPayload.tag_hint_qt = preset_data.tag_hint_qt;
        tavernAIPayload.straight_alpha = preset_data.straight_alpha;
        tavernAIPayload.use_new_shared_trial = true;
      }
      addLog(`\u6700\u7EC8\u751F\u56FE\u53C2\u6570 (payload): ${JSON.stringify(tavernAIPayload, null, 2)}`);
      const result = await fetch("/api/novelai/generate-image", { method: "POST", headers: getRequestHeaders(window.token), body: JSON.stringify(tavernAIPayload), signal: abortController.signal });
      if (!result.ok) {
        const text = await result.text();
        throw new Error(`\u751F\u6210\u56FE\u7247\u5931\u8D25\uFF0C\u8BE6\u60C5\u67E5\u770B\u9152\u9986\u63A7\u5236\u53F0: ${text}`);
      }
      let data = await result.text();
      try {
        const jsonResponse = JSON.parse(data);
        re = jsonResponse.images[0];
      } catch (e) {
        addLog("JSON \u89E3\u6790\u5931\u8D25\uFF0C\u5C1D\u8BD5\u4F5C\u4E3A\u539F\u59CB Base64 \u6570\u636E\u5904\u7406\u3002");
        re = data;
      }
    } else {
      const Authorization = "Bearer " + access_token;
      let data11 = { "input": prompt2, "model": actualModel, "action": "generate", "parameters": payload, "use_new_shared_trial": true };
      console.log("data11:", data11);
      const { candidates, rawOtherSite } = getNovelAICandidateUrls("/ai/generate-image");
      const response = await postNovelAIWithFallback({
        candidates,
        rawOtherSite,
        endpointPath: "/ai/generate-image",
        headers: getDirectHeaders3("application/json", Authorization),
        body: JSON.stringify(data11),
        signal: abortController.signal,
        logPrefix: "[NovelAI]"
      });
      const data123 = await response.arrayBuffer();
      try {
        re = await unzipFile(data123);
      } catch (unzipErr) {
        if (rawOtherSite) {
          evictNovelAIUrlCache(rawOtherSite, "/ai/generate-image");
        }
        throw unzipErr;
      }
      if (rawOtherSite && response._verifiedCandidateUrl) {
        workingNovelAIUrlCache.set(`${rawOtherSite}|/ai/generate-image`, response._verifiedCandidateUrl);
      }
    }
    if (!re) {
      throw new Error("\u672A\u80FD\u4ECEAPI\u54CD\u5E94\u4E2D\u63D0\u53D6\u56FE\u50CF\u6570\u636E\u3002");
    }
    let imageUrl = "data:image/png;base64," + re;
    const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
    addLog(`\u56FE\u50CF\u5DF2\u6210\u529F\u83B7\u53D6\u5E76\u683C\u5F0F\u5316\u4E3A data URL (\u8017\u65F6 ${duration} \u79D2)\u3002`);
    taskQueue.completeTask(taskId, true);
    if (!isPluginToastDisabled()) {
      toastr.success(`\u2705 NovelAI \u751F\u56FE\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
    }
    if (String(extension_settings[extensionName].convertToJpegStorage) === "true") {
      imageUrl = await convertImageToJpeg(imageUrl);
    }
    return { image: imageUrl, change: change_ || "", genParams: _nai_gen_params };
  } catch (error) {
    if (extension_settings[extensionName].novelaisite !== "\u5B98\u7F51") {
      const otherSite = normalizeNovelAIOtherSiteUrl(extension_settings[extensionName].novelaiOtherSite);
      evictNovelAIUrlCache(otherSite, "/ai/generate-image");
    }
    isTaskAborted = error.name === "AbortError" || error.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88" || abortController.signal.aborted || error.message?.includes("\u8D85\u65F6");
    if (isTaskAborted) {
      addLog(`[NovelAI] \u4EFB\u52A1\u5DF2\u88AB\u7528\u6237\u53D6\u6D88\u6216\u8D85\u65F6: ${error.message}`);
    } else {
      taskQueue.completeTask(taskId, false);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    activeAbortControllers.delete(taskId);
    if (currentCloudQueueInfo) {
      try {
        if (isTaskAborted) {
          await leaveQueue(currentCloudQueueInfo.keyHash, currentCloudQueueInfo.userId, currentCloudQueueInfo.taskId, currentCloudQueueInfo.lockToken);
        } else {
          await completeQueue(currentCloudQueueInfo.keyHash, currentCloudQueueInfo.userId, currentCloudQueueInfo.taskId, currentCloudQueueInfo.lockToken);
        }
      } catch (qErr) {
        console.warn("[NovelAI] \u91CA\u653E\u4E91\u7AEF\u9501\u5F02\u5E38:", qErr);
      }
      __set_currentCloudQueueInfo(null);
    }
    if (lockAcquired) {
      const interval = Math.max(0, parseInt(extension_settings[extensionName]?.imageGenInterval, 10) || 0);
      releaseSerialLock(taskId, interval);
    }
  }
}

async function generateNovelAIInpaint({ prompt: link, width: Xwidth, height: Xheight, change }) {
  clearLog();
  let _inpaint_gen_params = null;
  const sizeRegex = /,?\s*(\d{2,4})x(\d{2,4})(?=[;\s]*$)/i;
  if (typeof link === "string") {
    const match = link.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        Xwidth = parseInt(match[1], 10);
        Xheight = parseInt(match[2], 10);
      }
    }
    link = link.replace(sizeRegex, "");
  }
  if (typeof change === "string") {
    const match = change.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        Xwidth = parseInt(match[1], 10);
        Xheight = parseInt(match[2], 10);
      }
    }
    change = change.replace(sizeRegex, "");
  }
  addLog("[NovelAI Inpaint] \u5F00\u59CB\u5C40\u90E8\u91CD\u7ED8\u6D41\u7A0B...");
  if (!window.novelaiInpaintImage) {
    const error = "\u7F3A\u5C11\u539F\u59CB\u56FE\u50CF\u6570\u636E\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u91CD\u7ED8\u5BF9\u8BDD\u6846";
    addLog(`[NovelAI Inpaint] \u9519\u8BEF: ${error}`);
    throw new Error(error);
  }
  if (!window.novelaiInpaintMask) {
    const error = "\u7F3A\u5C11\u906E\u7F69\u6570\u636E\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u91CD\u7ED8\u5BF9\u8BDD\u6846";
    addLog(`[NovelAI Inpaint] \u9519\u8BEF: ${error}`);
    throw new Error(error);
  }
  if (!window.novelaiInpaintPrompt) {
    const error = "\u7F3A\u5C11\u63D0\u793A\u8BCD\uFF0C\u8BF7\u5728\u91CD\u7ED8\u5BF9\u8BDD\u6846\u4E2D\u8F93\u5165\u63D0\u793A\u8BCD";
    addLog(`[NovelAI Inpaint] \u9519\u8BEF: ${error}`);
    throw new Error(error);
  }
  const taskId = taskQueue.addTask({
    name: "\u5C40\u90E8\u91CD\u7ED8: " + (window.novelaiInpaintPrompt || "").substring(0, 20) + "...",
    type: TaskType.NOVELAI,
    prompt: window.novelaiInpaintPrompt
  });
  const abortController = new AbortController();
  activeAbortControllers.set(taskId, abortController);
  let timeoutId = null;
  const resetInpaintTimeout = (sec = NOVELAI_TIMEOUT_SECONDS) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        abortController.abort(new Error(`NovelAI \u5C40\u90E8\u91CD\u7ED8\u8BF7\u6C42\u8D85\u65F6\uFF08${sec}\u79D2\u65E0\u54CD\u5E94\uFF09`));
      } catch (_) {
      }
    }, sec * 1e3);
  };
  let lockAcquired = false;
  let isTaskAborted = false;
  await acquireSerialLock(taskId, abortController.signal);
  lockAcquired = true;
  taskQueue.updateStatus(taskId, TaskStatus.RUNNING);
  resetInpaintTimeout(NOVELAI_TIMEOUT_SECONDS);
  const inpaintStartTime = Date.now();
  if (!isPluginToastDisabled()) {
    toastr.info("\u{1F3A8} \u5DF2\u53D1\u8D77 NovelAI \u5C40\u90E8\u91CD\u7ED8\u8BF7\u6C42...");
  }
  try {
    const imageBase64 = window.novelaiInpaintImage.split(",")[1];
    const maskBase64 = window.novelaiInpaintMask.split(",")[1];
    const inpaintPrompt = window.novelaiInpaintPrompt;
    const negativePrompt = window.novelaiInpaintNegativePrompt || "blurry, lowres, bad quality";
    const strength = window.novelaiInpaintStrength || 0.54;
    addLog(`[NovelAI Inpaint] \u63D0\u793A\u8BCD: ${inpaintPrompt}`);
    addLog(`[NovelAI Inpaint] \u8D1F\u9762\u63D0\u793A\u8BCD: ${negativePrompt}`);
    addLog(`[NovelAI Inpaint] \u5F3A\u5EA6: ${strength}`);
    const access_token = (extension_settings[extensionName].novelaiApi || "").trim();
    if (!access_token || access_token === "000000") {
      throw new Error("\u8BF7\u586B\u5199 NovelAI API Key");
    }
    const imgWidth = Number(window.novelaiInpaintWidth) || Number(Xwidth) || Number(extension_settings[extensionName].novelai_width) || 1024;
    const imgHeight = Number(window.novelaiInpaintHeight) || Number(Xheight) || Number(extension_settings[extensionName].novelai_height) || 1024;
    addLog(`[NovelAI Inpaint] \u56FE\u50CF\u5C3A\u5BF8: ${imgWidth}x${imgHeight}`);
    const seed = extension_settings[extensionName].novelai_seed === "0" || extension_settings[extensionName].novelai_seed === "" || extension_settings[extensionName].novelai_seed === "-1" ? generateRandomSeed() : Number(extension_settings[extensionName].novelai_seed);
    const baseMode = extension_settings[extensionName].novelaimode || "";
    let inpaintModel = "nai-diffusion-4-5-curated-inpainting";
    let inpaintSteps = Number(extension_settings[extensionName].novelai_steps) || 28;
    let inpaintSampler = extension_settings[extensionName].novelai_sampler || "k_euler_ancestral";
    if (baseMode === "nai-diffusion-5-full") {
      if (extension_settings[extensionName].novelai_v5_effort === "medium") {
        inpaintModel = "nai-diffusion-5-full-medium-inpainting";
        inpaintSteps = 14;
        inpaintSampler = "k_euler_ancestral";
      } else {
        inpaintModel = "nai-diffusion-5-full-inpainting";
      }
    }
    const payload = {
      "action": "infill",
      "input": inpaintPrompt,
      "model": inpaintModel,
      "parameters": {
        "width": imgWidth,
        "height": imgHeight,
        "scale": Number(extension_settings[extensionName].nai3Scale) || 5,
        "sampler": inpaintSampler,
        "steps": inpaintSteps,
        "seed": seed,
        "n_samples": 1,
        "image": imageBase64,
        "mask": maskBase64,
        "params_version": extension_settings[extensionName].novelaimode.includes("nai-diffusion-5") ? 4 : 3,
        "prefer_brownian": true,
        "autoSmea": false,
        "strength": 0.7,
        "noise": 0,
        "extra_noise_seed": seed,
        "add_original_image": false,
        "cfg_rescale": 0,
        //Number(extension_settings[extensionName].cfg_rescale) || 0,
        "controlnet_strength": 1,
        "deliberate_euler_ancestral_bug": false,
        "dynamic_thresholding": false,
        "legacy": false,
        "legacy_uc": false,
        "legacy_v3_extend": false,
        "normalize_reference_strength_multiple": isSettingTrue3(extension_settings[extensionName].normalizeRefStrength),
        "noise_schedule": extension_settings[extensionName].Schedule || "karras",
        "qualityToggle": true,
        "skip_cfg_above_sigma": 19,
        "ucPreset": 0,
        "use_coords": false,
        "image_format": "png",
        "img2img": {
          "strength": strength,
          "color_correct": true
        },
        "inpaintImg2ImgStrength": strength,
        "v4_prompt": {
          "caption": {
            "base_caption": inpaintPrompt,
            "char_captions": []
          },
          "use_coords": false,
          "use_order": true
        },
        "v4_negative_prompt": {
          "caption": {
            "base_caption": negativePrompt,
            "char_captions": []
          },
          "use_coords": false,
          "use_order": true
        }
      }
    };
    addLog(`[NovelAI Inpaint] \u8BF7\u6C42\u53C2\u6570\u5DF2\u6784\u5EFA\u5B8C\u6210`);
    _inpaint_gen_params = buildGenParams("NovelAI \u5C40\u90E8\u91CD\u7ED8", {
      model: payload.model,
      promptReplaceId: extension_settings[extensionName].prompt_replace_id,
      resolvedPrompt: inpaintPrompt,
      negativePrompt,
      width: payload.parameters.width,
      height: payload.parameters.height,
      seed: payload.parameters.seed,
      steps: payload.parameters.steps,
      sampler: payload.parameters.sampler,
      scheduler: payload.parameters.noise_schedule,
      cfgScale: payload.parameters.scale
    });
    if (!taskQueue.isTaskInQueue(taskId)) {
      addLog("[NovelAI Inpaint] \u6B63\u5F0F\u5F00\u59CB\u524D\u4EFB\u52A1\u5DF2\u88AB\u53D6\u6D88");
      throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    if (isSettingTrue3(extension_settings[extensionName].enableCloudQueue)) {
      const keyHash = await hashKey(access_token);
      const userId = getUserId();
      try {
        addLog("[NovelAI Inpaint] [\u4E91\u7AEF\u961F\u5217] \u5F00\u59CB\u7B49\u5F85...");
        const result = await waitForTurn(keyHash, userId, taskId, taskQueue, {
          signal: abortController.signal
        });
        __set_currentCloudQueueInfo({ keyHash, userId, taskId, lockToken: result.lockToken });
        addLog("[NovelAI Inpaint] [\u4E91\u7AEF\u961F\u5217] \u5DF2\u83B7\u5F97\u9501\uFF0C\u7B49\u5F851\u79D2\u540E\u5F00\u59CB\u751F\u6210");
        await sleep(1e3);
      } catch (error) {
        __set_currentCloudQueueInfo(null);
        throw error;
      }
    }
    resetInpaintTimeout(NOVELAI_TIMEOUT_SECONDS);
    if (extension_settings[extensionName].novelaisite != "\u5B98\u7F51" && extension_settings[extensionName].client == "jiuguan") {
      throw new Error("\u9152\u9986\u7AEF\u4E0D\u652F\u6301\u81EA\u5B9A\u4E49\u7AD9\u70B9\u7684\u5C40\u90E8\u91CD\u7ED8\uFF01");
    }
    const Authorization = "Bearer " + access_token;
    const { candidates, rawOtherSite } = getNovelAICandidateUrls("/ai/generate-image");
    addLog("[NovelAI Inpaint] \u6B63\u5728\u53D1\u9001\u8BF7\u6C42\u5230 NovelAI API...");
    const response = await postNovelAIWithFallback({
      candidates,
      rawOtherSite,
      endpointPath: "/ai/generate-image",
      headers: getDirectHeaders3("application/json", Authorization),
      body: JSON.stringify(payload),
      signal: abortController.signal,
      logPrefix: "[NovelAI Inpaint]"
    });
    addLog("[NovelAI Inpaint] \u6B63\u5728\u89E3\u538B\u8FD4\u56DE\u7684 ZIP \u6587\u4EF6...");
    const arrayBuffer = await response.arrayBuffer();
    let imageBase64Result;
    try {
      imageBase64Result = await unzipFile(arrayBuffer);
    } catch (unzipErr) {
      if (rawOtherSite) {
        evictNovelAIUrlCache(rawOtherSite, "/ai/generate-image");
      }
      throw unzipErr;
    }
    if (rawOtherSite && response._verifiedCandidateUrl) {
      workingNovelAIUrlCache.set(`${rawOtherSite}|/ai/generate-image`, response._verifiedCandidateUrl);
    }
    if (!imageBase64Result) {
      throw new Error("\u672A\u80FD\u4ECEAPI\u54CD\u5E94\u4E2D\u63D0\u53D6\u56FE\u50CF\u6570\u636E");
    }
    let imageUrl = "data:image/png;base64," + imageBase64Result;
    addLog("[NovelAI Inpaint] \u56FE\u50CF\u5DF2\u6210\u529F\u83B7\u53D6\u5E76\u683C\u5F0F\u5316\u4E3A data URL");
    const inpaintDuration = ((Date.now() - inpaintStartTime) / 1e3).toFixed(1);
    taskQueue.completeTask(taskId, true);
    if (!isPluginToastDisabled()) {
      toastr.success(`\u2705 NovelAI \u5C40\u90E8\u91CD\u7ED8\u5B8C\u6210\uFF0C\u8017\u65F6 ${inpaintDuration} \u79D2`);
    }
    if (String(extension_settings[extensionName].convertToJpegStorage) === "true") {
      imageUrl = await convertImageToJpeg(imageUrl);
    }
    addLog(`[NovelAI Inpaint] \u5C40\u90E8\u91CD\u7ED8\u5B8C\u6210 (\u8017\u65F6 ${inpaintDuration} \u79D2)\uFF01`);
    return { image: imageUrl, change: change || "", genParams: _inpaint_gen_params };
  } catch (error) {
    if (extension_settings[extensionName].novelaisite !== "\u5B98\u7F51") {
      const otherSite = normalizeNovelAIOtherSiteUrl(extension_settings[extensionName].novelaiOtherSite);
      evictNovelAIUrlCache(otherSite, "/ai/generate-image");
    }
    isTaskAborted = error.name === "AbortError" || error.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88" || abortController.signal.aborted || error.message?.includes("\u8D85\u65F6");
    if (isTaskAborted) {
      addLog(`[NovelAI Inpaint] \u8BF7\u6C42\u5DF2\u88AB\u7528\u6237\u53D6\u6D88\u6216\u8D85\u65F6: ${error.message}`);
    } else {
      taskQueue.completeTask(taskId, false);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    activeAbortControllers.delete(taskId);
    if (currentCloudQueueInfo) {
      try {
        if (isTaskAborted) {
          await leaveQueue(currentCloudQueueInfo.keyHash, currentCloudQueueInfo.userId, currentCloudQueueInfo.taskId, currentCloudQueueInfo.lockToken);
        } else {
          await completeQueue(currentCloudQueueInfo.keyHash, currentCloudQueueInfo.userId, currentCloudQueueInfo.taskId, currentCloudQueueInfo.lockToken);
        }
      } catch (qErr) {
        console.warn("[NovelAI Inpaint] \u91CA\u653E\u4E91\u7AEF\u9501\u5F02\u5E38:", qErr);
      }
      __set_currentCloudQueueInfo(null);
    }
    if (lockAcquired) {
      const interval = Math.max(0, parseInt(extension_settings[extensionName]?.imageGenInterval, 10) || 0);
      releaseSerialLock(taskId, interval);
    }
    delete window.novelaiInpaintImage;
    delete window.novelaiInpaintMask;
    delete window.novelaiInpaintPrompt;
    delete window.novelaiInpaintNegativePrompt;
    delete window.novelaiInpaintStrength;
    delete window.novelaiInpaintWidth;
    delete window.novelaiInpaintHeight;
  }
}

async function novelaigenerate(requestData) {
  const { id, prompt: prompt2, width, height, change, negative_prompt: extraNegativePrompt } = requestData;
  addLog(`\u6536\u5230\u751F\u56FE\u8BF7\u6C42 (ID: ${id}) - Prompt: ${prompt2}${change ? ` - Change: ${change}` : ""}${extraNegativePrompt ? ` - NegativePrompt: ${extraNegativePrompt}` : ""}`);
  if (change && change.includes("{\u4FEE\u56FE}")) {
    bananaGenerate(requestData);
    return;
  }
  if (change && change.includes("{\u89C6\u9891}")) {
    bananaGenerate(requestData);
    return;
  }
  if (change && change.includes("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}")) {
    try {
      const { image: imageUrl, change: returnedChange, isVideo, format, genParams } = await generateComfyUIImage({ prompt: prompt2, width, height, change, extraNegativePrompt });
      const cleanedChange = returnedChange.replaceAll("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}", "");
      try {
        if (extension_settings[extensionName].cache != "0") {
          await setItemImg(prompt2, imageUrl, {
            change: cleanedChange,
            isVideo,
            format,
            genParams,
            onTailSuccess: () => addLog(`\u56FE\u50CF\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
            onTailError: (e) => {
              const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
              addLog(`\u9519\u8BEF: ${msg}`);
              if (typeof toastr !== "undefined") toastr.error(msg);
            }
          });
        } else {
          addLog(`\u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
        }
      } catch (dbError) {
        addLog(`\u8B66\u544A: \u65E0\u6CD5\u5C06\u56FE\u50CF\u5B58\u5165\u7F13\u5B58\u6570\u636E\u5E93 (ID: ${id}): ${dbError.message}`);
      }
      recordImageGeneration("novelai", true);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
        id,
        success: true,
        imageData: imageUrl,
        prompt: prompt2,
        change: cleanedChange,
        isVideo: isVideo || false,
        format: format || "image"
      });
      addLog(`[ComfyUI\u8F6C\u53D1] \u53D1\u9001ComfyUI\u5C40\u90E8\u91CD\u7ED8\u6210\u529F\u54CD\u5E94 (ID: ${id})`);
    } catch (error) {
      addLog(`[ComfyUI\u8F6C\u53D1] \u9519\u8BEF: ${error.message}`);
      recordImageGeneration("novelai", false);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, { id, success: false, error: error.message, prompt: prompt2 });
    }
    return;
  }
  if (change && change.includes("{NovelAI\u5C40\u90E8\u91CD\u7ED8}")) {
    try {
      const { image: imageUrl, change: returnedChange, genParams } = await generateNovelAIInpaint({ prompt: prompt2, width, height, change });
      const cleanedChange = returnedChange.replaceAll("{NovelAI\u5C40\u90E8\u91CD\u7ED8}", "");
      try {
        if (extension_settings[extensionName].cache != "0") {
          await setItemImg(prompt2, imageUrl, {
            change: cleanedChange,
            genParams,
            onTailSuccess: () => addLog(`\u56FE\u50CF\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
            onTailError: (e) => {
              const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
              addLog(`\u9519\u8BEF: ${msg}`);
              if (typeof toastr !== "undefined") toastr.error(msg);
            }
          });
        } else {
          addLog(`\u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
        }
      } catch (dbError) {
        const dbErrorMsg = `\u65E0\u6CD5\u5C06\u56FE\u50CF\u5B58\u5165\u7F13\u5B58\u6570\u636E\u5E93 (ID: ${id}): ${dbError.message}`;
        addLog(`\u8B66\u544A: ${dbErrorMsg}`);
        console.warn("Could not save image to DB cache:", dbError);
      }
      recordImageGeneration("novelai", true);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
        id,
        success: true,
        imageData: imageUrl,
        prompt: prompt2,
        // pass back the original prompt
        change: cleanedChange
      });
      addLog(`\u53D1\u9001\u751F\u56FE\u6210\u529F\u54CD\u5E94 (ID: ${id})`);
    } catch (error) {
      const isAborted = error.name === "AbortError" || error.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88";
      if (isAborted) {
        addLog(`\u4EFB\u52A1\u5DF2\u53D6\u6D88 (ID: ${id})`);
        recordImageGeneration("novelai", false);
        eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
          id,
          success: false,
          cancelled: true,
          error: "\u4EFB\u52A1\u5DF2\u53D6\u6D88",
          prompt: prompt2
        });
      } else {
        const errorMsg = `\u751F\u56FE\u6D41\u7A0B\u6355\u83B7\u5230\u5F02\u5E38 (ID: ${id}): ${error.message}`;
        addLog(`\u9519\u8BEF: ${errorMsg}`);
        console.error("Error generating image:", error);
        recordImageGeneration("novelai", false);
        eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
          id,
          success: false,
          error: error.message,
          prompt: prompt2
        });
        addLog(`\u53D1\u9001\u751F\u56FE\u5931\u8D25\u54CD\u5E94 (ID: ${id})`);
      }
    }
    return;
  }
  try {
    const { image: imageUrl, change: returnedChange, genParams } = await generateNovelAIImage({ prompt: prompt2, width, height, change, extraNegativePrompt });
    try {
      if (extension_settings[extensionName].cache != "0") {
        await setItemImg(prompt2, imageUrl, {
          change: returnedChange,
          genParams,
          onTailSuccess: () => addLog(`\u56FE\u50CF\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
          onTailError: (e) => {
            const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
            addLog(`\u9519\u8BEF: ${msg}`);
            if (typeof toastr !== "undefined") toastr.error(msg);
          }
        });
      } else {
        addLog(`\u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
      }
    } catch (dbError) {
      const dbErrorMsg = `\u65E0\u6CD5\u5C06\u56FE\u50CF\u5B58\u5165\u7F13\u5B58\u6570\u636E\u5E93 (ID: ${id}): ${dbError.message}`;
      addLog(`\u8B66\u544A: ${dbErrorMsg}`);
      console.warn("Could not save image to DB cache:", dbError);
    }
    recordImageGeneration("novelai", true);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: true,
      imageData: imageUrl,
      prompt: prompt2,
      // pass back the original prompt
      change: returnedChange
    });
    addLog(`\u53D1\u9001\u751F\u56FE\u6210\u529F\u54CD\u5E94 (ID: ${id})`);
  } catch (error) {
    const isAborted = error.name === "AbortError" || error.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88";
    if (isAborted) {
      addLog(`\u4EFB\u52A1\u5DF2\u53D6\u6D88 (ID: ${id})`);
      recordImageGeneration("novelai", false);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
        id,
        success: false,
        cancelled: true,
        error: "\u4EFB\u52A1\u5DF2\u53D6\u6D88",
        prompt: prompt2
      });
    } else {
      const errorMsg = `\u751F\u56FE\u6D41\u7A0B\u6355\u83B7\u5230\u5F02\u5E38 (ID: ${id}): ${error.message}`;
      addLog(`\u9519\u8BEF: ${errorMsg}`);
      console.error("Error generating image:", error);
      recordImageGeneration("novelai", false);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
        id,
        success: false,
        error: error.message,
        prompt: prompt2
      });
      addLog(`\u53D1\u9001\u751F\u56FE\u5931\u8D25\u54CD\u5E94 (ID: ${id})`);
    }
  }
}

function initializeNovelAIListener() {
  eventSource.on(EventType.GENERATE_IMAGE_REQUEST, novelaigenerate);
  eventSource.on("st_chatu8_cancel_novelai_task", ({ taskId } = {}) => {
    if (taskId) {
      const controller = activeAbortControllers.get(taskId);
      if (controller) {
        addLog(`\u6536\u5230\u53D6\u6D88\u8BF7\u6C42\uFF0C\u6B63\u5728\u4E2D\u65AD NovelAI \u4EFB\u52A1: ${taskId}`);
        try {
          controller.abort();
        } catch (_) {
        }
      }
    } else {
      if (activeAbortControllers.size > 0) {
        addLog(`\u6536\u5230\u5168\u5C40\u53D6\u6D88\u8BF7\u6C42\uFF0C\u6B63\u5728\u4E2D\u65AD\u6240\u6709 (${activeAbortControllers.size} \u4E2A) \u6D3B\u8DC3\u7684 NovelAI \u4EFB\u52A1...`);
        for (const [, ctrl] of activeAbortControllers) {
          try {
            ctrl.abort();
          } catch (_) {
          }
        }
      }
    }
  });
  addLog("NovelAI \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u521D\u59CB\u5316\u3002");
}

async function replaceWithnovelai() {
  if (isPluginEnabled() && extension_settings[extensionName].mode == "novelai") {
    if (!window.initializeNovelAIListener) {
      window.initializeNovelAIListener = true;
      initializeNovelAIListener();
    }
    initializeImageProcessing();
  } else {
    if (window.initializeNovelAIListener) {
      eventSource.removeListener(EventType.GENERATE_IMAGE_REQUEST, novelaigenerate);
      window.initializeNovelAIListener = false;
      addLog("NovelAI \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u5173\u95ED\u3002");
    }
  }
}

export function __set_currentTaskId4(v) { currentTaskId4 = v; }

export function __set_vibeThumbnailWarmupPromise(v) { vibeThumbnailWarmupPromise = v; }

export { MAX_POLL_RETRIES, POLL_INTERVAL, clearNovelAIUrlCache, currentTaskId4, getNovelAICandidateUrls, postNovelAIWithFallback, replaceWithnovelai, vibeDataCache, vibeThumbnailCache, vibeThumbnailPending, vibeThumbnailWarmupPromise };
