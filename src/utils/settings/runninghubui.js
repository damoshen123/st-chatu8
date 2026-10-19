// 还原自打包产物 — 原始模块: utils/settings/runninghubui.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../../script.js";
import { defaultSettings, extensionName } from "../config.js";
import { prepareImageForUpload, removeThinkingTags } from "../utils.js";
import { stylInput, stylishConfirm } from "../ui_common.js";
import { TaskStatus, TaskType, taskQueue } from "../taskQueue.js";
import { mergeAdjacentMessages, replaceAllPlaceholders } from "../promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "./llmService.js";
import { LLM_VIDEO_GEN, LLM_VISUAL_MAT_PREP } from "../llmRequest.js";
import { openVideoAssetPicker } from "./videoAssetPicker.js";
import { parseVideosFromPrompt } from "../videoInserter.js";
import { fetchRunningHubAccountStatus, fetchRunningHubQueueStatus, getGlobalConcurrencyLimit, getKeyConsumptionStats, getKeyLocalLimit, getUsableRunningHubKeyForUpload, invalidateBalanceCache, isKeyPaused, parseRunningHubApiKeys, setGlobalConcurrencyLimit, setKeyLocalLimit, setKeyPaused } from "../runninghubKeyManager.js";
import { executeRunningHubVideoDirectTest } from "../runninghubVideo.js";
import { UPLOAD_CACHE_EXPIRY_MS3, sessionUploadedMedia } from "./comfyuiVideoUi.js";
import { inheritRunningHubWork, isComfyUIFullWorkflow2, isRawComfyUIWorkflow2, visualizeRunningHubWorkflow } from "./runninghubWorker.js";

var RUNNINGHUB_PLACEHOLDER_MAP, isBase64Image, isImageId, setupImageUpload, updateImageUI;

var isImageId = (value) => value && typeof value === "string" && value.startsWith("cfgimg_");

var isBase64Image = (value) => value && typeof value === "string" && value.startsWith("data:image");

var setupImageUpload = (role, index) => {
  const i = index + 1;
  const container = document.getElementById(`st-chatu8-banana-${role}-image-container-${i}`);
  const img = document.getElementById(`st-chatu8-banana-${role}-image-${i}`);
  const placeholder = container.querySelector(".st-chatu8-image-placeholder");
  const removeBtn = document.getElementById(`st-chatu8-banana-${role}-image-remove-${i}`);
  const input = document.getElementById(`st-chatu8-banana-${role}-image-input-${i}`);
  if (!container || !img || !placeholder || !removeBtn || !input) return;
  container.addEventListener("click", (event) => {
    if (event.target !== removeBtn && !removeBtn.contains(event.target)) {
      input.click();
    }
  });
  input.addEventListener("change", () => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.style.display = "block";
        placeholder.style.display = "none";
        removeBtn.style.display = "block";
      };
      reader.readAsDataURL(input.files[0]);
    }
  });
  removeBtn.addEventListener("click", () => {
    img.src = "";
    img.style.display = "none";
    placeholder.style.display = "block";
    removeBtn.style.display = "none";
    input.value = "";
  });
};

var updateImageUI = (role, index, imageData) => {
  const i = index + 1;
  const img = document.getElementById(`st-chatu8-banana-${role}-image-${i}`);
  const container = document.getElementById(`st-chatu8-banana-${role}-image-container-${i}`);
  if (!img || !container) return;
  const placeholder = container.querySelector(".st-chatu8-image-placeholder");
  const removeBtn = document.getElementById(`st-chatu8-banana-${role}-image-remove-${i}`);
  if (imageData) {
    img.src = imageData;
    img.style.display = "block";
    placeholder.style.display = "none";
    removeBtn.style.display = "block";
  } else {
    img.src = "";
    img.style.display = "none";
    placeholder.style.display = "block";
    removeBtn.style.display = "none";
  }
};
var RUNNINGHUB_PLACEHOLDER_MAP = [
  // 1. 标准尺寸与提示词占位符
  { placeholder: "%width%", label: "\u5BBD\u5EA6 (width)", matchKeys: ["width"], type: "number" },
  { placeholder: "%height%", label: "\u9AD8\u5EA6 (height)", matchKeys: ["height"], type: "number" },
  { placeholder: "%prompt%", label: "\u6B63\u9762\u63D0\u793A\u8BCD (prompt)", matchKeys: ["prompt", "text", "positive"], type: "string" },
  { placeholder: "%negative_prompt%", label: "\u8D1F\u9762\u63D0\u793A\u8BCD (negative)", matchKeys: ["negative", "text"], type: "string" },
  // 2. 模型与核心组件占位符
  { placeholder: "%MODEL_NAME%", label: "\u6A21\u578B\u6587\u4EF6 (MODEL_NAME)", matchKeys: ["ckpt_name", "model_name", "unet_name"], type: "string" },
  { placeholder: "%sampler_name%", label: "\u91C7\u6837\u65B9\u6CD5 (sampler_name)", matchKeys: ["sampler_name", "sampler"], type: "string" },
  { placeholder: "%vae%", label: "VAE (vae)", matchKeys: ["vae_name", "vae"], type: "string" },
  { placeholder: "%scheduler%", label: "\u8C03\u5EA6\u5668 (scheduler)", matchKeys: ["scheduler"], type: "string" },
  { placeholder: "%clip%", label: "CLIP (clip)", matchKeys: ["clip_name", "clip"], type: "string" },
  { placeholder: "%cfg_scale%", label: "CFG \u6BD4\u4F8B (cfg_scale)", matchKeys: ["cfg", "cfg_scale"], type: "number" },
  { placeholder: "%steps%", label: "\u751F\u6210\u6B65\u6570 (steps)", matchKeys: ["steps"], type: "number" },
  { placeholder: "%seed%", label: "\u968F\u673A\u79CD\u5B50 (seed)", matchKeys: ["noise_seed", "seed"], type: "number" },
  // 3. 中文别名占位符
  { placeholder: "%\u5BBD\u5EA6%", label: "\u5BBD\u5EA6 (\u4E2D\u6587)", matchKeys: ["width"], type: "number" },
  { placeholder: "%\u9AD8\u5EA6%", label: "\u9AD8\u5EA6 (\u4E2D\u6587)", matchKeys: ["height"], type: "number" },
  { placeholder: "%\u6B63\u9762\u63D0\u793A\u8BCD%", label: "\u6B63\u9762\u63D0\u793A\u8BCD (\u4E2D\u6587)", matchKeys: ["prompt", "positive"], type: "string" },
  { placeholder: "%\u8D1F\u9762\u63D0\u793A\u8BCD%", label: "\u8D1F\u9762\u63D0\u793A\u8BCD (\u4E2D\u6587)", matchKeys: ["negative"], type: "string" },
  { placeholder: "%\u63D0\u793A\u8BCD%", label: "\u63D0\u793A\u8BCD (\u57FA\u7840)", matchKeys: ["prompt", "text"], type: "string" },
  { placeholder: "%\u6A21\u578B%", label: "\u6A21\u578B (\u4E2D\u6587)", matchKeys: ["ckpt_name", "model_name", "unet_name"], type: "string" },
  { placeholder: "%\u91C7\u6837\u65B9\u6CD5%", label: "\u91C7\u6837\u65B9\u6CD5 (\u4E2D\u6587)", matchKeys: ["sampler_name", "sampler"], type: "string" },
  { placeholder: "%\u8C03\u5EA6\u5668%", label: "\u8C03\u5EA6\u5668 (\u4E2D\u6587)", matchKeys: ["scheduler"], type: "string" },
  { placeholder: "%CFG%", label: "CFG (\u4E2D\u6587)", matchKeys: ["cfg", "cfg_scale"], type: "number" },
  // 4. 基础与视频生成参数
  { placeholder: "%\u79CD\u5B50%", label: "\u968F\u673A\u79CD\u5B50 (\u6570\u503C)", matchKeys: ["noise_seed", "seed"], type: "number" },
  { placeholder: "%\u6B65\u6570%", label: "\u6B65\u6570 / \u89C6\u9891\u6B65\u6570 (\u6570\u503C)", matchKeys: ["steps"], type: "number" },
  { placeholder: "%\u89C6\u9891\u6B65\u6570%", label: "\u89C6\u9891\u6B65\u6570 (\u6570\u503C)", matchKeys: ["steps"], type: "number" },
  { placeholder: "%\u50CF\u7D20%", label: "\u5206\u8FA8\u7387/\u50CF\u7D20 (\u6570\u503C)", matchKeys: ["megapixels"], type: "number" },
  { placeholder: "%\u89C6\u9891\u79D2\u6570%", label: "\u89C6\u9891\u79D2\u6570 (\u6570\u503C)", matchKeys: ["duration", "length", "value"], type: "number" },
  // 5. 图片文件名 (9个)
  { placeholder: "%\u56FE\u72471%", label: "\u56FE\u72471 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  { placeholder: "%\u56FE\u72472%", label: "\u56FE\u72472 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  { placeholder: "%\u56FE\u72473%", label: "\u56FE\u72473 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  { placeholder: "%\u56FE\u72474%", label: "\u56FE\u72474 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  { placeholder: "%\u56FE\u72475%", label: "\u56FE\u72475 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  { placeholder: "%\u56FE\u72476%", label: "\u56FE\u72476 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  { placeholder: "%\u56FE\u72477%", label: "\u56FE\u72477 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  { placeholder: "%\u56FE\u72478%", label: "\u56FE\u72478 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  { placeholder: "%\u56FE\u72479%", label: "\u56FE\u72479 \u6587\u4EF6\u540D (LoadImage)", matchKeys: ["image"], type: "string" },
  // 6. 图片控制/模式开关 (9个)
  { placeholder: "%\u56FE\u72471\u63A7\u5236%", label: "\u56FE\u72471 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u56FE\u72472\u63A7\u5236%", label: "\u56FE\u72472 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u56FE\u72473\u63A7\u5236%", label: "\u56FE\u72473 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u56FE\u72474\u63A7\u5236%", label: "\u56FE\u72474 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u56FE\u72475\u63A7\u5236%", label: "\u56FE\u72475 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u56FE\u72476\u63A7\u5236%", label: "\u56FE\u72476 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u56FE\u72477\u63A7\u5236%", label: "\u56FE\u72477 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u56FE\u72478\u63A7\u5236%", label: "\u56FE\u72478 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u56FE\u72479\u63A7\u5236%", label: "\u56FE\u72479 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  // 7. 音频文件名与控制 (6个)
  { placeholder: "%\u97F3\u98911%", label: "\u97F3\u98911 \u6587\u4EF6\u540D (LoadAudio)", matchKeys: ["audio"], type: "string" },
  { placeholder: "%\u97F3\u98912%", label: "\u97F3\u98912 \u6587\u4EF6\u540D (LoadAudio)", matchKeys: ["audio"], type: "string" },
  { placeholder: "%\u97F3\u98913%", label: "\u97F3\u98913 \u6587\u4EF6\u540D (LoadAudio)", matchKeys: ["audio"], type: "string" },
  { placeholder: "%\u97F3\u98911\u63A7\u5236%", label: "\u97F3\u98911 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u97F3\u98912\u63A7\u5236%", label: "\u97F3\u98912 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" },
  { placeholder: "%\u97F3\u98913\u63A7\u5236%", label: "\u97F3\u98913 \u63A7\u5236\u5F00\u5173 (Switch Path)", matchKeys: ["Path"], type: "number" }
];
function getRunningHubApiKeys(apiKeySetting) {
  return parseRunningHubApiKeys(apiKeySetting);
}

function escapeHtml6(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function computeFileHash(file) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const buffer = await file.arrayBuffer();
      const digest = await window.crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(digest));
      return "h_" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {
  }
  const cryptoLib = window.stChatu8CryptoJS || window.CryptoJS;
  if (cryptoLib && cryptoLib.MD5) {
    try {
      const buffer = await file.arrayBuffer();
      const wordArray = cryptoLib.lib.WordArray.create(buffer);
      return "h_" + cryptoLib.MD5(wordArray).toString();
    } catch (e2) {
    }
  }
  return `h_${file.name}_${file.size}_${file.lastModified}`;
}

async function uploadRunningHubMedia(file, type, index, apiKey) {
  let key = apiKey;
  if (key) {
    const parsedKeys = parseRunningHubApiKeys(key);
    key = parsedKeys.length > 0 ? parsedKeys[0] : null;
  }
  if (!key) {
    key = await getUsableRunningHubKeyForUpload();
  }
  if (!key) throw new Error("\u8BF7\u5148\u586B\u5199 RunningHub API Key");
  let uploadFile2 = file;
  if (type === "img" || file && file.type && file.type.startsWith("image/")) {
    try {
      const processed = await prepareImageForUpload(file, {
        fallbackFileName: (file.name || "image.jpg").replace(/\.[^/.]+$/, "") + ".jpg"
      });
      uploadFile2 = new File([processed.blob], processed.fileName, { type: "image/jpeg" });
    } catch (procErr) {
      console.warn("[RunningHubUI] \u56FE\u7247\u9884\u5904\u7406\u5931\u8D25\uFF0C\u4F7F\u7528\u539F\u59CB\u6587\u4EF6:", procErr);
    }
  }
  const settings3 = extension_settings[extensionName] || {};
  if (!settings3.runninghub_upload_cache) {
    settings3.runninghub_upload_cache = {};
  }
  const cache = settings3.runninghub_upload_cache;
  const now = Date.now();
  const fileHash = await computeFileHash(uploadFile2);
  if (cache[fileHash] && cache[fileHash].fileName) {
    const cachedItem = cache[fileHash];
    if (now - (cachedItem.timestamp || 0) <= UPLOAD_CACHE_EXPIRY_MS3) {
      const fileName = cachedItem.fileName;
      if (index !== void 0 && sessionUploadedMedia[type]) {
        sessionUploadedMedia[type][index] = fileName;
      }
      return fileName;
    }
  }
  const formData = new FormData();
  formData.append("file", uploadFile2);
  formData.append("apiKey", key);
  formData.append("fileType", "input");
  const res = await fetch("https://www.runninghub.ai/task/openapi/upload", {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  if (data.code === 0 && data.data && data.data.fileName) {
    const fileName = data.data.fileName;
    cache[fileHash] = {
      fileName,
      timestamp: now
    };
    saveSettingsDebounced();
    if (index !== void 0 && sessionUploadedMedia[type]) {
      sessionUploadedMedia[type][index] = fileName;
    }
    return fileName;
  } else {
    throw new Error(data.msg || "\u4E0A\u4F20\u6587\u4EF6\u5230 RunningHub \u5931\u8D25");
  }
}

function openRunningHubSelectOptionsEditor({ title, settingKey, optionsKey, defaultOptions = [], selectEl }) {
  const settings3 = extension_settings[extensionName] || {};
  let currentOptions = Array.isArray(settings3[optionsKey]) ? [...settings3[optionsKey]] : [...defaultOptions];
  const currentVal = settings3[settingKey] || (selectEl ? selectEl.value : "");
  if (currentVal && !currentOptions.includes(currentVal)) {
    currentOptions.unshift(currentVal);
  }
  const existingModal = document.getElementById("st-chatu8-rh-options-editor-modal");
  if (existingModal) existingModal.remove();
  let isBatchMode = false;
  const modalHtml = `
        <div id="st-chatu8-rh-options-editor-modal" class="st-chatu8-modal-backdrop" style="display: flex; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); z-index: 99999; align-items: center; justify-content: center; backdrop-filter: blur(3px);">
            <div class="st-chatu8-modal-content" style="width: 520px; max-width: 92vw; max-height: 85vh; display: flex; flex-direction: column; background: #1e1e24; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.6); overflow: hidden; color: #e0e0e0;">
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2);">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #60a5fa; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-list-check"></i> <span>${title}</span>
                    </h3>
                    <button type="button" class="rh-modal-close" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #cbd5e1; opacity: 0.8; padding: 0 4px; line-height: 1;" title="\u5173\u95ED">&times;</button>
                </div>

                <!-- Toolbar -->
                <div style="padding: 12px 18px; display: flex; flex-direction: column; gap: 10px; background: rgba(0,0,0,0.25); border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <div id="rh-single-add-row" style="display: flex; gap: 8px;">
                        <input type="text" id="rh-new-option-input" class="st-chatu8-text-input" placeholder="\u8F93\u5165\u65B0\u9009\u9879\u540D\u79F0..." style="flex: 1; padding: 7px 12px; font-size: 13px; border-radius: 6px; background: rgba(0,0,0,0.4); color: #ffffff; border: 1px solid rgba(255,255,255,0.2);">
                        <button type="button" id="rh-add-option-btn" class="st-chatu8-btn" style="padding: 7px 16px; font-size: 13px; white-space: nowrap; background: rgba(255,255,255,0.12); color: #ffffff; border: 1px solid rgba(255,255,255,0.25); border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-plus"></i> \u6DFB\u52A0</button>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                        <div style="color: #94a3b8;">\u5171 <span id="rh-options-count" style="color: #60a5fa; font-weight: bold;">0</span> \u4E2A\u9009\u9879</div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" id="rh-toggle-batch-btn" class="st-chatu8-btn" style="padding: 4px 10px; font-size: 12px; background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-align-left"></i> \u6279\u91CF\u7F16\u8F91</button>
                            <button type="button" id="rh-reset-default-btn" class="st-chatu8-btn" style="padding: 4px 10px; font-size: 12px; background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-rotate-left"></i> \u6062\u590D\u9ED8\u8BA4</button>
                        </div>
                    </div>
                </div>

                <!-- Body -->
                <div style="flex: 1; overflow-y: auto; padding: 12px 18px; min-height: 220px; max-height: 380px;">
                    <div id="rh-list-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
                    <textarea id="rh-batch-textarea" class="st-chatu8-textarea" rows="12" style="display: none; width: 100%; font-family: monospace; font-size: 13px; resize: vertical; background: rgba(0,0,0,0.4); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); padding: 8px 10px; border-radius: 6px;" placeholder="\u6BCF\u884C\u4E00\u4E2A\u9009\u9879..."></textarea>
                </div>

                <!-- Footer -->
                <div style="display: flex; justify-content: flex-end; gap: 10px; padding: 12px 18px; border-top: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.25);">
                    <button type="button" class="st-chatu8-btn rh-modal-close" style="padding: 6px 16px; font-size: 13px; background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; cursor: pointer;">\u53D6\u6D88</button>
                    <button type="button" id="rh-save-options-btn" class="st-chatu8-btn st-chatu8-btn-primary" style="padding: 6px 18px; font-size: 13px; background: #2563eb; color: #ffffff; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-weight: 600; cursor: pointer;"><i class="fa-solid fa-check"></i> \u4FDD\u5B58\u66F4\u6539</button>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const $modal2 = $("#st-chatu8-rh-options-editor-modal");
  function escapeHtml11(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function renderList() {
    const $list = $modal2.find("#rh-list-container");
    $list.empty();
    $modal2.find("#rh-options-count").text(currentOptions.length);
    if (currentOptions.length === 0) {
      $list.append('<div style="text-align: center; color: #94a3b8; padding: 20px 0;">\u6682\u65E0\u9009\u9879\uFF0C\u8BF7\u5728\u4E0A\u65B9\u6DFB\u52A0</div>');
      return;
    }
    currentOptions.forEach((item, idx) => {
      const isSelected = item === currentVal;
      const rowHtml = `
                <div class="rh-option-item" data-index="${idx}" style="display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; gap: 8px;">
                    <div class="rh-option-text" style="flex: 1; word-break: break-all; font-size: 13px; cursor: pointer; ${isSelected ? "font-weight: bold; color: #60a5fa;" : "color: #e2e8f0;"}" title="\u53CC\u51FB\u6216\u70B9\u51FB\u7F16\u8F91\u56FE\u6807\u8FDB\u884C\u4FEE\u6539">
                        ${isSelected ? '<i class="fa-solid fa-check-circle" style="margin-right: 6px; font-size: 12px; color: #60a5fa;"></i>' : ""}${escapeHtml11(item)}
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button type="button" class="st-chatu8-icon-btn rh-opt-up" title="\u4E0A\u79FB" style="padding: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer;" ${idx === 0 ? 'disabled style="padding: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; background: rgba(255,255,255,0.04); color: #64748b; border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; opacity: 0.3; cursor: not-allowed;"' : ""}><i class="fa-solid fa-arrow-up"></i></button>
                        <button type="button" class="st-chatu8-icon-btn rh-opt-down" title="\u4E0B\u79FB" style="padding: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer;" ${idx === currentOptions.length - 1 ? 'disabled style="padding: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; background: rgba(255,255,255,0.04); color: #64748b; border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; opacity: 0.3; cursor: not-allowed;"' : ""}><i class="fa-solid fa-arrow-down"></i></button>
                        <button type="button" class="st-chatu8-icon-btn rh-opt-edit" title="\u7F16\u8F91" style="padding: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="st-chatu8-icon-btn danger rh-opt-del" title="\u5220\u9664" style="padding: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
      $list.append(rowHtml);
    });
  }
  function syncFromBatchText() {
    const text = $modal2.find("#rh-batch-textarea").val();
    currentOptions = text.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
    currentOptions = Array.from(new Set(currentOptions));
  }
  function syncToBatchText() {
    $modal2.find("#rh-batch-textarea").val(currentOptions.join("\n"));
  }
  renderList();
  function addOption() {
    const $input = $modal2.find("#rh-new-option-input");
    const val = $input.val().trim();
    if (!val) return;
    if (currentOptions.includes(val)) {
      if (window.toastr) toastr.warning("\u8BE5\u9009\u9879\u5DF2\u5B58\u5728");
      return;
    }
    currentOptions.push(val);
    $input.val("");
    renderList();
  }
  $modal2.find("#rh-add-option-btn").on("click", addOption);
  $modal2.find("#rh-new-option-input").on("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  });
  $modal2.find("#rh-list-container").on("click", ".rh-opt-up", function() {
    const idx = parseInt($(this).closest(".rh-option-item").data("index"));
    if (idx > 0) {
      const temp = currentOptions[idx];
      currentOptions[idx] = currentOptions[idx - 1];
      currentOptions[idx - 1] = temp;
      renderList();
    }
  });
  $modal2.find("#rh-list-container").on("click", ".rh-opt-down", function() {
    const idx = parseInt($(this).closest(".rh-option-item").data("index"));
    if (idx < currentOptions.length - 1) {
      const temp = currentOptions[idx];
      currentOptions[idx] = currentOptions[idx + 1];
      currentOptions[idx + 1] = temp;
      renderList();
    }
  });
  $modal2.find("#rh-list-container").on("click", ".rh-opt-del", function() {
    const idx = parseInt($(this).closest(".rh-option-item").data("index"));
    currentOptions.splice(idx, 1);
    renderList();
  });
  $modal2.find("#rh-list-container").on("click", ".rh-opt-edit", function() {
    const $item = $(this).closest(".rh-option-item");
    const idx = parseInt($item.data("index"));
    const oldVal = currentOptions[idx];
    const newVal = prompt("\u4FEE\u6539\u9009\u9879\u540D\u79F0:", oldVal);
    if (newVal !== null) {
      const trimmed = newVal.trim();
      if (trimmed && trimmed !== oldVal) {
        currentOptions[idx] = trimmed;
        renderList();
      }
    }
  });
  $modal2.find("#rh-toggle-batch-btn").on("click", function() {
    isBatchMode = !isBatchMode;
    if (isBatchMode) {
      syncToBatchText();
      $modal2.find("#rh-list-container, #rh-single-add-row").hide();
      $modal2.find("#rh-batch-textarea").show().focus();
      $(this).html('<i class="fa-solid fa-list"></i> \u5217\u8868\u89C6\u56FE');
    } else {
      syncFromBatchText();
      $modal2.find("#rh-batch-textarea").hide();
      $modal2.find("#rh-list-container, #rh-single-add-row").show();
      renderList();
      $(this).html('<i class="fa-solid fa-align-left"></i> \u6279\u91CF\u7F16\u8F91');
    }
  });
  $modal2.find("#rh-reset-default-btn").on("click", () => {
    if (confirm("\u786E\u5B9A\u8981\u6062\u590D\u9ED8\u8BA4\u9884\u8BBE\u9009\u9879\u5217\u8868\u5417\uFF1F")) {
      currentOptions = [...defaultOptions];
      if (isBatchMode) {
        syncToBatchText();
      } else {
        renderList();
      }
    }
  });
  $modal2.find("#rh-save-options-btn").on("click", () => {
    if (isBatchMode) {
      syncFromBatchText();
    }
    settings3[optionsKey] = [...currentOptions];
    if (selectEl) {
      const prevVal = selectEl.value || settings3[settingKey];
      $(selectEl).empty();
      currentOptions.forEach((opt) => {
        const optEl = document.createElement("option");
        optEl.value = opt;
        optEl.textContent = opt;
        selectEl.appendChild(optEl);
      });
      if (currentOptions.includes(prevVal)) {
        selectEl.value = prevVal;
        settings3[settingKey] = prevVal;
      } else if (currentOptions.length > 0) {
        selectEl.value = currentOptions[0];
        settings3[settingKey] = currentOptions[0];
      } else {
        settings3[settingKey] = "";
      }
    }
    saveSettingsDebounced();
    if (window.toastr) toastr.success("\u5DF2\u4FDD\u5B58\u9009\u9879\u5217\u8868");
    $modal2.remove();
  });
  $modal2.find(".rh-modal-close").on("click", () => $modal2.remove());
}

function initRunningHubUI(settingsModal) {
  const settings3 = extension_settings[extensionName];
  if (!settings3.runninghub_uploadedMedia) {
    settings3.runninghub_uploadedMedia = { img: {}, aud: {} };
  }
  let pendingRunningHubSwap = { type: null, index: null };
  function swapRunningHubMedia(type, idxA, idxB) {
    if (idxA === idxB) return;
    if (type === "img") {
      const ctrlA = settings3[`runninghub_img_ctrl_${idxA}`] || "bypass";
      settings3[`runninghub_img_ctrl_${idxA}`] = settings3[`runninghub_img_ctrl_${idxB}`] || "bypass";
      settings3[`runninghub_img_ctrl_${idxB}`] = ctrlA;
      const descA = settings3[`runninghub_img_desc_${idxA}`] || "";
      settings3[`runninghub_img_desc_${idxA}`] = settings3[`runninghub_img_desc_${idxB}`] || "";
      settings3[`runninghub_img_desc_${idxB}`] = descA;
      const sessA = sessionUploadedMedia.img?.[idxA];
      const sessB = sessionUploadedMedia.img?.[idxB];
      if (sessB !== void 0) sessionUploadedMedia.img[idxA] = sessB;
      else delete sessionUploadedMedia.img[idxA];
      if (sessA !== void 0) sessionUploadedMedia.img[idxB] = sessA;
      else delete sessionUploadedMedia.img[idxB];
      if (!sessionUploadedMedia.imgFiles) sessionUploadedMedia.imgFiles = {};
      const fileA = sessionUploadedMedia.imgFiles[idxA];
      const fileB = sessionUploadedMedia.imgFiles[idxB];
      if (fileB !== void 0) sessionUploadedMedia.imgFiles[idxA] = fileB;
      else delete sessionUploadedMedia.imgFiles[idxA];
      if (fileA !== void 0) sessionUploadedMedia.imgFiles[idxB] = fileA;
      else delete sessionUploadedMedia.imgFiles[idxB];
      saveSettingsDebounced();
      renderRunningHubImageCards();
      toastr.success(`\u5DF2\u6210\u529F\u4EA4\u6362 <Picture ${idxA}> \u4E0E <Picture ${idxB}> \u7684\u4F4D\u7F6E\u4E0E\u914D\u7F6E\uFF01`);
    } else if (type === "aud") {
      const ctrlA = settings3[`runninghub_aud_ctrl_${idxA}`] || "bypass";
      settings3[`runninghub_aud_ctrl_${idxA}`] = settings3[`runninghub_aud_ctrl_${idxB}`] || "bypass";
      settings3[`runninghub_aud_ctrl_${idxB}`] = ctrlA;
      const descA = settings3[`runninghub_aud_desc_${idxA}`] || "";
      settings3[`runninghub_aud_desc_${idxA}`] = settings3[`runninghub_aud_desc_${idxB}`] || "";
      settings3[`runninghub_aud_desc_${idxB}`] = descA;
      const sessA = sessionUploadedMedia.aud?.[idxA];
      const sessB = sessionUploadedMedia.aud?.[idxB];
      if (sessB !== void 0) sessionUploadedMedia.aud[idxA] = sessB;
      else delete sessionUploadedMedia.aud[idxA];
      if (sessA !== void 0) sessionUploadedMedia.aud[idxB] = sessA;
      else delete sessionUploadedMedia.aud[idxB];
      if (!sessionUploadedMedia.audFiles) sessionUploadedMedia.audFiles = {};
      const fileA = sessionUploadedMedia.audFiles[idxA];
      const fileB = sessionUploadedMedia.audFiles[idxB];
      if (fileB !== void 0) sessionUploadedMedia.audFiles[idxA] = fileB;
      else delete sessionUploadedMedia.audFiles[idxA];
      if (fileA !== void 0) sessionUploadedMedia.audFiles[idxB] = fileA;
      else delete sessionUploadedMedia.audFiles[idxB];
      saveSettingsDebounced();
      renderRunningHubAudioCards();
      toastr.success(`\u5DF2\u6210\u529F\u4EA4\u6362 <Audio ${idxA}> \u4E0E <Audio ${idxB}> \u7684\u4F4D\u7F6E\u4E0E\u914D\u7F6E\uFF01`);
    }
  }
  function renderRunningHubImageCards() {
    const imgContainer = document.getElementById("runninghub_img_container");
    if (!imgContainer) return;
    imgContainer.innerHTML = "";
    const hasPending = pendingRunningHubSwap.type === "img" && pendingRunningHubSwap.index !== null;
    for (let i = 1; i <= 9; i++) {
      const card = document.createElement("div");
      card.className = "st-chatu8-card";
      const savedCtrl = settings3[`runninghub_img_ctrl_${i}`] || "bypass";
      const savedDesc = settings3[`runninghub_img_desc_${i}`] || "";
      const currentSessionFile = sessionUploadedMedia.img?.[i] || "";
      const isCurrentSelected = pendingRunningHubSwap.type === "img" && pendingRunningHubSwap.index === i;
      let borderCss = "border: 1px solid var(--st-chatu8-border-color, rgba(255,255,255,0.1));";
      let bgCss = "background: var(--st-chatu8-bg-secondary, rgba(255,255,255,0.03));";
      if (isCurrentSelected) {
        borderCss = "border: 2px solid #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.45);";
        bgCss = "background: rgba(245, 158, 11, 0.08);";
      } else if (hasPending) {
        borderCss = "border: 1px dashed rgba(96, 165, 250, 0.5);";
      }
      card.style.cssText = `padding: 12px; ${borderCss} border-radius: 8px; ${bgCss} display: flex; flex-direction: column; gap: 10px; transition: all 0.2s ease;`;
      card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                        <i class="fa-solid fa-image" style="color: #60a5fa;"></i> &lt;Picture ${i}&gt;
                    </span>
                    <div class="st-chatu8-media-header-controls">
                        <button type="button" class="st-chatu8-btn runninghub-swap-btn st-chatu8-swap-btn ${isCurrentSelected ? "is-active" : ""}" data-type="img" data-index="${i}" title="${isCurrentSelected ? "\u70B9\u51FB\u53D6\u6D88\u4EA4\u6362" : hasPending ? "\u70B9\u51FB\u4E0E\u9009\u4E2D\u7684\u9879\u4E92\u6362" : "\u70B9\u51FB\u9009\u62E9\u8981\u4EA4\u6362\u7684\u5361\u7247"}">
                            ${isCurrentSelected ? '<i class="fa-solid fa-xmark"></i> \u53D6\u6D88' : hasPending ? '<i class="fa-solid fa-arrow-right-arrow-left"></i> \u4E92\u6362' : '<i class="fa-solid fa-arrow-right-arrow-left"></i> \u4EA4\u6362'}
                        </button>
                        <select id="runninghub_img_ctrl_${i}" class="st-chatu8-select st-chatu8-ctrl-select">
                            <option value="open" ${savedCtrl === "open" ? "selected" : ""}>\u5F00\u542F</option>
                            <option value="bypass" ${savedCtrl === "bypass" ? "selected" : ""}>\u8DF3\u8FC7 (Bypass)</option>
                            <option value="mute" ${savedCtrl === "mute" ? "selected" : ""}>\u505C\u7528 (Mute)</option>
                        </select>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div id="runninghub_stat_img_${i}" style="font-size: 11px; color: ${currentSessionFile ? "#4caf50" : "var(--st-chatu8-text-secondary, #888)"}; word-break: break-all;">
                        ${currentSessionFile ? `<i class="fa-solid fa-check-circle"></i> \u5DF2\u5C31\u7EEA: ${currentSessionFile}` : "\u672A\u4E0A\u4F20\u53C2\u8003\u56FE\uFF08\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u515C\u5E95\uFF09"}
                    </div>
                    <div class="st-chatu8-media-preview-box" id="runninghub_img_preview_box_${i}" style="display: ${currentSessionFile || sessionUploadedMedia.imgFiles?.[i] ? "flex" : "none"};">
                        <img id="runninghub_preview_img_${i}" class="${savedCtrl === "mute" && (currentSessionFile || sessionUploadedMedia.imgFiles?.[i]) ? "st-chatu8-preview-muted" : ""}" style="max-width: 100%; max-height: 120px; border-radius: 4px; object-fit: contain;">
                        <div class="st-chatu8-media-mute-overlay" id="runninghub_img_mute_overlay_${i}" style="display: ${savedCtrl === "mute" && (currentSessionFile || sessionUploadedMedia.imgFiles?.[i]) ? "flex" : "none"};">
                            <div class="st-chatu8-mute-badge">
                                <i class="fa-solid fa-ban" style="color: #ef4444;"></i>
                                <span>\u5DF2\u505C\u7528</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <input type="file" id="runninghub_file_img_${i}" accept="image/*" style="display: none;">
                        <button type="button" class="st-chatu8-btn primary" id="runninghub_upload_btn_img_${i}" style="flex: 1; min-width: 80px; padding: 6px 8px; font-size: 12px;" title="\u4ECE\u7535\u8111\u672C\u5730\u4E0A\u4F20\u56FE\u7247"><i class="fa-solid fa-upload"></i> \u672C\u5730\u4E0A\u4F20</button>
                        <button type="button" class="st-chatu8-btn" id="runninghub_asset_btn_img_${i}" style="flex: 1; min-width: 80px; padding: 6px 8px; font-size: 12px;" title="\u4ECE\u89C6\u9891\u8D44\u4EA7\u5E93\u4E2D\u9009\u53D6\u56FE\u7247\u7D20\u6750"><i class="fa-solid fa-photo-film"></i> \u89C6\u9891\u8D44\u4EA7</button>
                        <button type="button" class="st-chatu8-btn danger" id="runninghub_clear_img_${i}" style="padding: 6px 12px; font-size: 12px; ${currentSessionFile ? "" : "display: none;"}" title="\u6E05\u7A7A"><i class="fa-solid fa-trash"></i> \u6E05\u7A7A</button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label for="runninghub_img_desc_${i}" style="font-size: 11px; color: var(--st-chatu8-text-secondary, #888);"><i class="fa-solid fa-pen-to-square"></i> \u56FE\u7247\u7B80\u4ECB (\u968F\u56FE\u4F20\u7ED9LLM)</label>
                        <textarea id="runninghub_img_desc_${i}" class="st-chatu8-textarea" rows="2" placeholder="\u8F93\u5165\u56FE\u7247 ${i} \u7B80\u4ECB\u6216\u753B\u9762\u8BF4\u660E..." style="font-size: 12px; padding: 4px 8px; resize: vertical; min-height: 38px;">${escapeHtml6(savedDesc)}</textarea>
                    </div>
                </div>
            `;
      imgContainer.appendChild(card);
      if (sessionUploadedMedia.imgFiles?.[i]) {
        const previewEl = document.getElementById(`runninghub_preview_img_${i}`);
        if (previewEl) {
          previewEl.src = URL.createObjectURL(sessionUploadedMedia.imgFiles[i]);
        }
      }
      $(`.runninghub-swap-btn[data-type="img"][data-index="${i}"]`).on("click", (e) => {
        e.stopPropagation();
        if (pendingRunningHubSwap.type === "img" && pendingRunningHubSwap.index === i) {
          pendingRunningHubSwap = { type: null, index: null };
          renderRunningHubImageCards();
          toastr.info("\u5DF2\u53D6\u6D88\u4EA4\u6362");
        } else if (pendingRunningHubSwap.type === "img" && pendingRunningHubSwap.index !== null) {
          const srcIdx = pendingRunningHubSwap.index;
          pendingRunningHubSwap = { type: null, index: null };
          swapRunningHubMedia("img", srcIdx, i);
        } else {
          pendingRunningHubSwap = { type: "img", index: i };
          renderRunningHubImageCards();
          toastr.info(`\u5DF2\u9009\u4E2D <Picture ${i}>\uFF0C\u8BF7\u70B9\u51FB\u53E6\u4E00\u4E2A\u5361\u7247\u7684\u3010\u4E92\u6362\u3011\u6309\u94AE\uFF08\u518D\u6B21\u70B9\u51FB\u81EA\u8EAB\u53EF\u53D6\u6D88\uFF09`);
        }
      });
      $(`#runninghub_img_ctrl_${i}`).on("change", (e) => {
        const val = e.target.value;
        settings3[`runninghub_img_ctrl_${i}`] = val;
        saveSettingsDebounced();
        const hasMedia = Boolean(sessionUploadedMedia.img?.[i] || sessionUploadedMedia.imgFiles?.[i]);
        const $overlay = $(`#runninghub_img_mute_overlay_${i}`);
        const $img = $(`#runninghub_preview_img_${i}`);
        if (val === "mute" && hasMedia) {
          $img.addClass("st-chatu8-preview-muted");
          $overlay.css("display", "flex");
        } else {
          $img.removeClass("st-chatu8-preview-muted");
          $overlay.hide();
        }
      });
      $(`#runninghub_img_desc_${i}`).on("input", (e) => {
        settings3[`runninghub_img_desc_${i}`] = e.target.value;
        saveSettingsDebounced();
      });
      $(`#runninghub_upload_btn_img_${i}`).on("click", () => {
        $(`#runninghub_file_img_${i}`).click();
      });
      $(`#runninghub_asset_btn_img_${i}`).on("click", () => {
        openVideoAssetPicker({
          type: "img",
          title: `<i class="fa-solid fa-photo-film" style="color: #60a5fa;"></i> \u4E3A &lt;Picture ${i}&gt; \u9009\u62E9\u89C6\u9891\u56FE\u7247\u8D44\u4EA7`,
          onSelect: async (asset, imageBlob, dataUrl) => {
            const preview = document.getElementById(`runninghub_preview_img_${i}`);
            if (preview && dataUrl) {
              preview.src = dataUrl;
            }
            $(`#runninghub_img_preview_box_${i}`).css("display", "flex");
            if (settings3[`runninghub_img_ctrl_${i}`] === "mute") {
              $(`#runninghub_preview_img_${i}`).addClass("st-chatu8-preview-muted");
              $(`#runninghub_img_mute_overlay_${i}`).css("display", "flex");
            } else {
              $(`#runninghub_preview_img_${i}`).removeClass("st-chatu8-preview-muted");
              $(`#runninghub_img_mute_overlay_${i}`).hide();
            }
            const stat = document.getElementById(`runninghub_stat_img_${i}`);
            if (stat) {
              stat.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> \u4E0A\u4F20\u4E2D...`;
              stat.style.color = "#ff9800";
            }
            try {
              const assetFileName = `${(asset.name || `asset_${i}`).replace(/[\\/:*?"<>|]/g, "_")}.png`;
              const file = new File([imageBlob], assetFileName, { type: imageBlob.type || "image/png" });
              if (!sessionUploadedMedia.imgFiles) sessionUploadedMedia.imgFiles = {};
              sessionUploadedMedia.imgFiles[i] = file;
              const fileName = await uploadRunningHubMedia(file, "img", i);
              sessionUploadedMedia.img[i] = fileName;
              if (stat) {
                stat.innerHTML = `<i class="fa-solid fa-check-circle"></i> \u5DF2\u5C31\u7EEA: ${fileName}`;
                stat.style.color = "#4caf50";
              }
              $(`#runninghub_clear_img_${i}`).show();
              const currentDescVal = $(`#runninghub_img_desc_${i}`).val() || "";
              if (!currentDescVal.trim() && asset.description && asset.description.trim()) {
                const newDesc = asset.description.trim();
                $(`#runninghub_img_desc_${i}`).val(newDesc);
                settings3[`runninghub_img_desc_${i}`] = newDesc;
              }
              saveSettingsDebounced();
              if (window.toastr) toastr.success(`\u56FE\u7247 ${i} \u5DF2\u4ECE\u89C6\u9891\u8D44\u4EA7\u8F7D\u5165\uFF01`);
            } catch (err) {
              if (stat) {
                stat.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> \u8F7D\u5165\u5931\u8D25: ${err.message}`;
                stat.style.color = "#f44336";
              }
              if (window.toastr) toastr.error(`\u56FE\u7247 ${i} \u8F7D\u5165\u5931\u8D25: ${err.message}`);
            }
          }
        });
      });
      $(`#runninghub_clear_img_${i}`).on("click", () => {
        delete sessionUploadedMedia.img[i];
        if (sessionUploadedMedia.imgFiles) delete sessionUploadedMedia.imgFiles[i];
        $(`#runninghub_file_img_${i}`).val("");
        $(`#runninghub_img_preview_box_${i}`).hide();
        $(`#runninghub_preview_img_${i}`).removeClass("st-chatu8-preview-muted").removeAttr("src");
        $(`#runninghub_img_mute_overlay_${i}`).hide();
        $(`#runninghub_stat_img_${i}`).html("\u672A\u4E0A\u4F20\u53C2\u8003\u56FE\uFF08\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u515C\u5E95\uFF09").css("color", "var(--st-chatu8-text-secondary, #888)");
        $(`#runninghub_clear_img_${i}`).hide();
        if (window.toastr) toastr.info(`\u5DF2\u6E05\u9664\u56FE\u7247 ${i}`);
      });
      $(`#runninghub_file_img_${i}`).on("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!sessionUploadedMedia.imgFiles) sessionUploadedMedia.imgFiles = {};
        sessionUploadedMedia.imgFiles[i] = file;
        const preview = document.getElementById(`runninghub_preview_img_${i}`);
        if (preview) {
          preview.src = URL.createObjectURL(file);
        }
        $(`#runninghub_img_preview_box_${i}`).css("display", "flex");
        if (settings3[`runninghub_img_ctrl_${i}`] === "mute") {
          $(`#runninghub_preview_img_${i}`).addClass("st-chatu8-preview-muted");
          $(`#runninghub_img_mute_overlay_${i}`).css("display", "flex");
        } else {
          $(`#runninghub_preview_img_${i}`).removeClass("st-chatu8-preview-muted");
          $(`#runninghub_img_mute_overlay_${i}`).hide();
        }
        const stat = document.getElementById(`runninghub_stat_img_${i}`);
        if (stat) {
          stat.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> \u4E0A\u4F20\u4E2D...`;
          stat.style.color = "#ff9800";
        }
        try {
          const fileName = await uploadRunningHubMedia(file, "img", i);
          sessionUploadedMedia.img[i] = fileName;
          if (stat) {
            stat.innerHTML = `<i class="fa-solid fa-check-circle"></i> \u5DF2\u5C31\u7EEA: ${fileName}`;
            stat.style.color = "#4caf50";
          }
          $(`#runninghub_clear_img_${i}`).show();
          if (window.toastr) toastr.success(`\u56FE\u7247 ${i} \u4E0A\u4F20\u6210\u529F\uFF01`);
        } catch (err) {
          if (stat) {
            stat.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> \u4E0A\u4F20\u5931\u8D25: ${err.message}`;
            stat.style.color = "#f44336";
          }
          if (window.toastr) toastr.error(`\u56FE\u7247 ${i} \u4E0A\u4F20\u5931\u8D25: ${err.message}`);
        }
      });
    }
  }
  renderRunningHubImageCards();
  function renderRunningHubAudioCards() {
    const audContainer = document.getElementById("runninghub_aud_container");
    if (!audContainer) return;
    audContainer.innerHTML = "";
    const hasPending = pendingRunningHubSwap.type === "aud" && pendingRunningHubSwap.index !== null;
    for (let i = 1; i <= 3; i++) {
      const card = document.createElement("div");
      card.className = "st-chatu8-card";
      const savedCtrl = settings3[`runninghub_aud_ctrl_${i}`] || "bypass";
      const savedDesc = settings3[`runninghub_aud_desc_${i}`] || "";
      const currentSessionFile = sessionUploadedMedia.aud?.[i] || "";
      const isCurrentSelected = pendingRunningHubSwap.type === "aud" && pendingRunningHubSwap.index === i;
      let borderCss = "border: 1px solid var(--st-chatu8-border-color, rgba(255,255,255,0.1));";
      let bgCss = "background: var(--st-chatu8-bg-secondary, rgba(255,255,255,0.03));";
      if (isCurrentSelected) {
        borderCss = "border: 2px solid #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.45);";
        bgCss = "background: rgba(245, 158, 11, 0.08);";
      } else if (hasPending) {
        borderCss = "border: 1px dashed rgba(236, 72, 153, 0.5);";
      }
      card.style.cssText = `padding: 12px; ${borderCss} border-radius: 8px; ${bgCss} display: flex; flex-direction: column; gap: 10px; transition: all 0.2s ease;`;
      card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                        <i class="fa-solid fa-music" style="color: #ec4899;"></i> &lt;Audio ${i}&gt;
                    </span>
                    <div class="st-chatu8-media-header-controls">
                        <button type="button" class="st-chatu8-btn runninghub-swap-btn st-chatu8-swap-btn ${isCurrentSelected ? "is-active" : ""}" data-type="aud" data-index="${i}" title="${isCurrentSelected ? "\u70B9\u51FB\u53D6\u6D88\u4EA4\u6362" : hasPending ? "\u70B9\u51FB\u4E0E\u9009\u4E2D\u7684\u9879\u4E92\u6362" : "\u70B9\u51FB\u9009\u62E9\u8981\u4EA4\u6362\u7684\u5361\u7247"}">
                            ${isCurrentSelected ? '<i class="fa-solid fa-xmark"></i> \u53D6\u6D88' : hasPending ? '<i class="fa-solid fa-arrow-right-arrow-left"></i> \u4E92\u6362' : '<i class="fa-solid fa-arrow-right-arrow-left"></i> \u4EA4\u6362'}
                        </button>
                        <select id="runninghub_aud_ctrl_${i}" class="st-chatu8-select st-chatu8-ctrl-select">
                            <option value="open" ${savedCtrl === "open" ? "selected" : ""}>\u5F00\u542F</option>
                            <option value="bypass" ${savedCtrl === "bypass" ? "selected" : ""}>\u8DF3\u8FC7 (Bypass)</option>
                            <option value="mute" ${savedCtrl === "mute" ? "selected" : ""}>\u505C\u7528 (Mute)</option>
                        </select>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div id="runninghub_stat_aud_${i}" style="font-size: 11px; color: ${currentSessionFile ? "#4caf50" : "var(--st-chatu8-text-secondary, #888)"}; word-break: break-all;">
                        ${currentSessionFile ? `<i class="fa-solid fa-check-circle"></i> \u5DF2\u5C31\u7EEA: ${currentSessionFile}` : "\u672A\u4E0A\u4F20\u53C2\u8003\u97F3\u9891\uFF08\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u515C\u5E95\uFF09"}
                    </div>
                    <div class="st-chatu8-media-preview-box" id="runninghub_aud_preview_box_${i}" style="display: ${currentSessionFile || sessionUploadedMedia.audFiles?.[i] ? "flex" : "none"}; width: 100%;">
                        <audio controls id="runninghub_preview_aud_${i}" class="${savedCtrl === "mute" && (currentSessionFile || sessionUploadedMedia.audFiles?.[i]) ? "st-chatu8-preview-muted" : ""}" style="width: 100%; margin-top: 4px;"></audio>
                        <div class="st-chatu8-media-mute-overlay" id="runninghub_aud_mute_overlay_${i}" style="display: ${savedCtrl === "mute" && (currentSessionFile || sessionUploadedMedia.audFiles?.[i]) ? "flex" : "none"};">
                            <div class="st-chatu8-mute-badge">
                                <i class="fa-solid fa-ban" style="color: #ef4444;"></i>
                                <span>\u5DF2\u505C\u7528</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <input type="file" id="runninghub_file_aud_${i}" accept="audio/*" style="display: none;">
                        <button type="button" class="st-chatu8-btn primary" id="runninghub_upload_btn_aud_${i}" style="flex: 1; min-width: 80px; padding: 6px 8px; font-size: 12px;" title="\u4ECE\u7535\u8111\u672C\u5730\u4E0A\u4F20\u97F3\u9891"><i class="fa-solid fa-upload"></i> \u672C\u5730\u4E0A\u4F20</button>
                        <button type="button" class="st-chatu8-btn" id="runninghub_asset_btn_aud_${i}" style="flex: 1; min-width: 80px; padding: 6px 8px; font-size: 12px;" title="\u4ECE\u89C6\u9891\u8D44\u4EA7\u5E93\u4E2D\u9009\u53D6\u97F3\u9891\u7D20\u6750"><i class="fa-solid fa-music"></i> \u89C6\u9891\u8D44\u4EA7</button>
                        <button type="button" class="st-chatu8-btn danger" id="runninghub_clear_aud_${i}" style="padding: 6px 12px; font-size: 12px; ${currentSessionFile ? "" : "display: none;"}" title="\u6E05\u7A7A"><i class="fa-solid fa-trash"></i> \u6E05\u7A7A</button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label for="runninghub_aud_desc_${i}" style="font-size: 11px; color: var(--st-chatu8-text-secondary, #888);"><i class="fa-solid fa-pen-to-square"></i> \u97F3\u9891\u7B80\u4ECB (\u968F\u97F3\u9891\u4F20\u7ED9LLM)</label>
                        <textarea id="runninghub_aud_desc_${i}" class="st-chatu8-textarea" rows="2" placeholder="\u8F93\u5165\u97F3\u9891 ${i} \u7B80\u4ECB\uFF08\u5982\u914D\u4E50/\u60C5\u7EEA/\u8282\u594F/\u5BF9\u767D\uFF09..." style="font-size: 12px; padding: 4px 8px; resize: vertical; min-height: 38px;">${escapeHtml6(savedDesc)}</textarea>
                    </div>
                </div>
            `;
      audContainer.appendChild(card);
      if (sessionUploadedMedia.audFiles?.[i]) {
        const previewEl = document.getElementById(`runninghub_preview_aud_${i}`);
        if (previewEl) {
          previewEl.src = URL.createObjectURL(sessionUploadedMedia.audFiles[i]);
        }
      }
      $(`.runninghub-swap-btn[data-type="aud"][data-index="${i}"]`).on("click", (e) => {
        e.stopPropagation();
        if (pendingRunningHubSwap.type === "aud" && pendingRunningHubSwap.index === i) {
          pendingRunningHubSwap = { type: null, index: null };
          renderRunningHubAudioCards();
          toastr.info("\u5DF2\u53D6\u6D88\u4EA4\u6362");
        } else if (pendingRunningHubSwap.type === "aud" && pendingRunningHubSwap.index !== null) {
          const srcIdx = pendingRunningHubSwap.index;
          pendingRunningHubSwap = { type: null, index: null };
          swapRunningHubMedia("aud", srcIdx, i);
        } else {
          pendingRunningHubSwap = { type: "aud", index: i };
          renderRunningHubAudioCards();
          toastr.info(`\u5DF2\u9009\u4E2D <Audio ${i}>\uFF0C\u8BF7\u70B9\u51FB\u53E6\u4E00\u4E2A\u5361\u7247\u7684\u3010\u4E92\u6362\u3011\u6309\u94AE\uFF08\u518D\u6B21\u70B9\u51FB\u81EA\u8EAB\u53EF\u53D6\u6D88\uFF09`);
        }
      });
      $(`#runninghub_aud_ctrl_${i}`).on("change", (e) => {
        const val = e.target.value;
        settings3[`runninghub_aud_ctrl_${i}`] = val;
        saveSettingsDebounced();
        const hasMedia = Boolean(sessionUploadedMedia.aud?.[i] || sessionUploadedMedia.audFiles?.[i]);
        const $overlay = $(`#runninghub_aud_mute_overlay_${i}`);
        const $aud = $(`#runninghub_preview_aud_${i}`);
        if (val === "mute" && hasMedia) {
          $aud.addClass("st-chatu8-preview-muted");
          $overlay.css("display", "flex");
        } else {
          $aud.removeClass("st-chatu8-preview-muted");
          $overlay.hide();
        }
      });
      $(`#runninghub_aud_desc_${i}`).on("input", (e) => {
        settings3[`runninghub_aud_desc_${i}`] = e.target.value;
        saveSettingsDebounced();
      });
      $(`#runninghub_upload_btn_aud_${i}`).on("click", () => {
        $(`#runninghub_file_aud_${i}`).click();
      });
      $(`#runninghub_asset_btn_aud_${i}`).on("click", () => {
        openVideoAssetPicker({
          type: "aud",
          title: `<i class="fa-solid fa-music" style="color: #ec4899;"></i> \u4E3A &lt;Audio ${i}&gt; \u9009\u62E9\u89C6\u9891\u97F3\u9891\u8D44\u4EA7`,
          onSelect: async (asset, audioBlob) => {
            const preview = document.getElementById(`runninghub_preview_aud_${i}`);
            if (preview) {
              preview.src = URL.createObjectURL(audioBlob);
            }
            $(`#runninghub_aud_preview_box_${i}`).css("display", "flex");
            if (settings3[`runninghub_aud_ctrl_${i}`] === "mute") {
              $(`#runninghub_preview_aud_${i}`).addClass("st-chatu8-preview-muted");
              $(`#runninghub_aud_mute_overlay_${i}`).css("display", "flex");
            } else {
              $(`#runninghub_preview_aud_${i}`).removeClass("st-chatu8-preview-muted");
              $(`#runninghub_aud_mute_overlay_${i}`).hide();
            }
            const stat = document.getElementById(`runninghub_stat_aud_${i}`);
            if (stat) {
              stat.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> \u4E0A\u4F20\u4E2D...`;
              stat.style.color = "#ff9800";
            }
            try {
              const assetFileName = `${(asset.name || `audio_${i}`).replace(/[\\/:*?"<>|]/g, "_")}.mp3`;
              const file = new File([audioBlob], assetFileName, { type: audioBlob.type || "audio/mpeg" });
              if (!sessionUploadedMedia.audFiles) sessionUploadedMedia.audFiles = {};
              sessionUploadedMedia.audFiles[i] = file;
              const fileName = await uploadRunningHubMedia(file, "aud", i);
              sessionUploadedMedia.aud[i] = fileName;
              if (stat) {
                stat.innerHTML = `<i class="fa-solid fa-check-circle"></i> \u5DF2\u5C31\u7EEA: ${fileName}`;
                stat.style.color = "#4caf50";
              }
              $(`#runninghub_clear_aud_${i}`).show();
              const currentDescVal = $(`#runninghub_aud_desc_${i}`).val() || "";
              if (!currentDescVal.trim() && asset.description && asset.description.trim()) {
                const newDesc = asset.description.trim();
                $(`#runninghub_aud_desc_${i}`).val(newDesc);
                settings3[`runninghub_aud_desc_${i}`] = newDesc;
              }
              saveSettingsDebounced();
              if (window.toastr) toastr.success(`\u97F3\u9891 ${i} \u5DF2\u4ECE\u89C6\u9891\u8D44\u4EA7\u8F7D\u5165\uFF01`);
            } catch (err) {
              if (stat) {
                stat.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> \u8F7D\u5165\u5931\u8D25: ${err.message}`;
                stat.style.color = "#f44336";
              }
              if (window.toastr) toastr.error(`\u97F3\u9891 ${i} \u8F7D\u5165\u5931\u8D25: ${err.message}`);
            }
          }
        });
      });
      $(`#runninghub_clear_aud_${i}`).on("click", () => {
        delete sessionUploadedMedia.aud[i];
        if (sessionUploadedMedia.audFiles) delete sessionUploadedMedia.audFiles[i];
        $(`#runninghub_file_aud_${i}`).val("");
        $(`#runninghub_aud_preview_box_${i}`).hide();
        $(`#runninghub_preview_aud_${i}`).removeClass("st-chatu8-preview-muted");
        $(`#runninghub_aud_mute_overlay_${i}`).hide();
        $(`#runninghub_stat_aud_${i}`).html("\u672A\u4E0A\u4F20\u53C2\u8003\u97F3\u9891\uFF08\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u515C\u5E95\uFF09").css("color", "var(--st-chatu8-text-secondary, #888)");
        $(`#runninghub_clear_aud_${i}`).hide();
        if (window.toastr) toastr.info(`\u5DF2\u6E05\u9664\u97F3\u9891 ${i}`);
      });
      $(`#runninghub_file_aud_${i}`).on("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!sessionUploadedMedia.audFiles) sessionUploadedMedia.audFiles = {};
        sessionUploadedMedia.audFiles[i] = file;
        const preview = document.getElementById(`runninghub_preview_aud_${i}`);
        if (preview) {
          preview.src = URL.createObjectURL(file);
        }
        $(`#runninghub_aud_preview_box_${i}`).css("display", "flex");
        if (settings3[`runninghub_aud_ctrl_${i}`] === "mute") {
          $(`#runninghub_preview_aud_${i}`).addClass("st-chatu8-preview-muted");
          $(`#runninghub_aud_mute_overlay_${i}`).css("display", "flex");
        } else {
          $(`#runninghub_preview_aud_${i}`).removeClass("st-chatu8-preview-muted");
          $(`#runninghub_aud_mute_overlay_${i}`).hide();
        }
        const stat = document.getElementById(`runninghub_stat_aud_${i}`);
        if (stat) {
          stat.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u4E0A\u4F20/\u6821\u9A8C\u7F13\u5B58...';
          stat.style.color = "var(--st-chatu8-accent-color, #667eea)";
        }
        try {
          const fileName = await uploadRunningHubMedia(file, "aud", i);
          sessionUploadedMedia.aud[i] = fileName;
          if (stat) {
            stat.innerHTML = `<i class="fa-solid fa-check-circle"></i> \u5DF2\u5C31\u7EEA: ${fileName}`;
            stat.style.color = "#4caf50";
          }
          $(`#runninghub_clear_aud_${i}`).show();
          if (window.toastr) toastr.success(`\u97F3\u9891 ${i} \u4E0A\u4F20\u6210\u529F\uFF01`);
        } catch (err) {
          if (stat) {
            stat.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> \u4E0A\u4F20\u5931\u8D25: ${err.message}`;
            stat.style.color = "#f44336";
          }
          if (window.toastr) toastr.error(`\u97F3\u9891 ${i} \u4E0A\u4F20\u5931\u8D25: ${err.message}`);
        }
      });
    }
  }
  renderRunningHubAudioCards();
  if (!settings3.runninghub_workflow_ids) {
    settings3.runninghub_workflow_ids = {};
  }
  if (!settings3.runninghub_workers) {
    settings3.runninghub_workers = {};
  }
  const WORKFLOW_CATEGORIES = [
    {
      name: "\u5DE5\u4F5C\u6D41",
      workeridKey: "runninghub_workerid",
      workerKey: "runninghub_worker",
      workflowIdKey: "runninghub_workflowId",
      selectId: "runninghub_workerid",
      textareaId: "runninghub_worker",
      workflowIdInputId: "runninghub_workflowId",
      btnPrefix: "#runninghub_worker",
      inheritBtnId: "#inherit_runninghub_work, #eidt_runninghub_work",
      vizBtnId: "#visualize_runninghub_workflow"
    },
    {
      name: "\u56FE\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41",
      workeridKey: "runninghub_img2vid_workerid",
      workerKey: "runninghub_img2vid_worker",
      workflowIdKey: "runninghub_img2vid_workflowId",
      selectId: "runninghub_img2vid_workerid",
      textareaId: "runninghub_img2vid_worker",
      workflowIdInputId: "runninghub_img2vid_workflowId",
      btnPrefix: "#runninghub_img2vid_worker",
      inheritBtnId: "#inherit_runninghub_img2vid_work",
      vizBtnId: "#visualize_runninghub_img2vid_workflow"
    },
    {
      name: "\u53C2\u8003\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41",
      workeridKey: "runninghub_ref2vid_workerid",
      workerKey: "runninghub_ref2vid_worker",
      workflowIdKey: "runninghub_ref2vid_workflowId",
      selectId: "runninghub_ref2vid_workerid",
      textareaId: "runninghub_ref2vid_worker",
      workflowIdInputId: "runninghub_ref2vid_workflowId",
      btnPrefix: "#runninghub_ref2vid_worker",
      inheritBtnId: "#inherit_runninghub_ref2vid_work",
      vizBtnId: "#visualize_runninghub_ref2vid_workflow"
    }
  ];
  function refreshAllWorkerSelects() {
    const workers = settings3.runninghub_workers || {};
    const presetNames = Object.keys(workers);
    const firstPreset = presetNames[0] || "";
    WORKFLOW_CATEGORIES.forEach((cat) => {
      const selectEl = document.getElementById(cat.selectId);
      const textareaEl = document.getElementById(cat.textareaId);
      const wfInputEl = document.getElementById(cat.workflowIdInputId);
      if (!selectEl) return;
      selectEl.innerHTML = "";
      presetNames.forEach((name) => {
        const opt = new Option(name, name);
        selectEl.add(opt);
      });
      let currentId = settings3[cat.workeridKey];
      if (!currentId || !workers[currentId]) {
        currentId = firstPreset;
        settings3[cat.workeridKey] = currentId;
      }
      if (currentId) {
        selectEl.value = currentId;
        const jsonStr = workers[currentId] || "";
        settings3[cat.workerKey] = jsonStr;
        if (textareaEl) textareaEl.value = jsonStr;
        const boundWfId = settings3.runninghub_workflow_ids?.[currentId] || "";
        settings3[cat.workflowIdKey] = boundWfId;
        if (wfInputEl) wfInputEl.value = boundWfId;
      }
    });
  }
  refreshAllWorkerSelects();
  WORKFLOW_CATEGORIES.forEach((cat) => {
    const selectEl = document.getElementById(cat.selectId);
    const textareaEl = document.getElementById(cat.textareaId);
    const wfInputEl = document.getElementById(cat.workflowIdInputId);
    if (selectEl) {
      $(selectEl).on("change", () => {
        const selected = selectEl.value;
        settings3[cat.workeridKey] = selected;
        const jsonStr = settings3.runninghub_workers[selected] || "";
        settings3[cat.workerKey] = jsonStr;
        if (textareaEl) textareaEl.value = jsonStr;
        const boundWfId = settings3.runninghub_workflow_ids?.[selected] || "";
        if (wfInputEl) wfInputEl.value = boundWfId;
        settings3[cat.workflowIdKey] = boundWfId;
        saveSettingsDebounced();
      });
    }
    if (textareaEl) {
      $(textareaEl).on("input", () => {
        const currentId = settings3[cat.workeridKey];
        if (currentId) {
          settings3.runninghub_workers[currentId] = textareaEl.value;
          settings3[cat.workerKey] = textareaEl.value;
          saveSettingsDebounced();
        }
      });
    }
    if (wfInputEl) {
      $(wfInputEl).on("input change", (e) => {
        const currentId = settings3[cat.workeridKey];
        if (currentId) {
          const val = e.target.value.trim();
          if (!settings3.runninghub_workflow_ids) settings3.runninghub_workflow_ids = {};
          settings3.runninghub_workflow_ids[currentId] = val;
          settings3[cat.workflowIdKey] = val;
          saveSettingsDebounced();
        }
      });
    }
    $(`${cat.btnPrefix}_new`).on("click", async () => {
      const name = await stylInput(`\u8BF7\u8F93\u5165\u65B0\u3010${cat.name}\u3011\u9884\u8BBE\u540D\u79F0\uFF1A`);
      if (name && name.trim()) {
        const trimmed = name.trim();
        if (settings3.runninghub_workers[trimmed]) {
          alert("\u9884\u8BBE\u540D\u79F0\u5DF2\u5B58\u5728");
          return;
        }
        settings3.runninghub_workers[trimmed] = textareaEl?.value || "{}";
        if (!settings3.runninghub_workflow_ids) settings3.runninghub_workflow_ids = {};
        settings3.runninghub_workflow_ids[trimmed] = wfInputEl?.value?.trim() || "";
        settings3[cat.workeridKey] = trimmed;
        settings3[cat.workerKey] = settings3.runninghub_workers[trimmed];
        settings3[cat.workflowIdKey] = settings3.runninghub_workflow_ids[trimmed];
        refreshAllWorkerSelects();
        saveSettingsDebounced();
        toastr.success(`\u5DF2\u521B\u5EFA\u5DE5\u4F5C\u6D41\u9884\u8BBE "${trimmed}"`);
      }
    });
    $(`${cat.btnPrefix}_update_style`).on("click", () => {
      const currentId = settings3[cat.workeridKey];
      if (currentId) {
        settings3.runninghub_workers[currentId] = textareaEl?.value || "";
        settings3[cat.workerKey] = textareaEl?.value || "";
        if (!settings3.runninghub_workflow_ids) settings3.runninghub_workflow_ids = {};
        settings3.runninghub_workflow_ids[currentId] = wfInputEl?.value?.trim() || "";
        settings3[cat.workflowIdKey] = wfInputEl?.value?.trim() || "";
        saveSettingsDebounced();
        toastr.success(`\u3010${cat.name}\u3011\u9884\u8BBE "${currentId}" \u53CA\u7ED1\u5B9A\u7684\u5DE5\u4F5C\u6D41 ID \u5DF2\u4FDD\u5B58`);
      }
    });
    $(`${cat.btnPrefix}_save_style`).on("click", async () => {
      const name = await stylInput(`\u8BF7\u8F93\u5165\u53E6\u5B58\u4E3A\u7684\u9884\u8BBE\u540D\u79F0\uFF1A`);
      if (name && name.trim()) {
        const trimmed = name.trim();
        settings3.runninghub_workers[trimmed] = textareaEl?.value || "{}";
        if (!settings3.runninghub_workflow_ids) settings3.runninghub_workflow_ids = {};
        settings3.runninghub_workflow_ids[trimmed] = wfInputEl?.value?.trim() || "";
        settings3[cat.workeridKey] = trimmed;
        settings3[cat.workerKey] = settings3.runninghub_workers[trimmed];
        settings3[cat.workflowIdKey] = settings3.runninghub_workflow_ids[trimmed];
        refreshAllWorkerSelects();
        saveSettingsDebounced();
        toastr.success(`\u5DF2\u53E6\u5B58\u4E3A "${trimmed}"`);
      }
    });
    $(`${cat.btnPrefix}_rename`).on("click", async () => {
      const current = settings3[cat.workeridKey];
      if (!current) return;
      const name = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u540D\u79F0\uFF1A", current);
      if (name && name.trim() && name.trim() !== current) {
        const trimmed = name.trim();
        settings3.runninghub_workers[trimmed] = settings3.runninghub_workers[current];
        delete settings3.runninghub_workers[current];
        if (!settings3.runninghub_workflow_ids) settings3.runninghub_workflow_ids = {};
        settings3.runninghub_workflow_ids[trimmed] = settings3.runninghub_workflow_ids[current] || "";
        delete settings3.runninghub_workflow_ids[current];
        WORKFLOW_CATEGORIES.forEach((otherCat) => {
          if (settings3[otherCat.workeridKey] === current) {
            settings3[otherCat.workeridKey] = trimmed;
          }
        });
        refreshAllWorkerSelects();
        saveSettingsDebounced();
        toastr.success(`\u5DF2\u91CD\u547D\u540D\u4E3A "${trimmed}"`);
      }
    });
    $(`${cat.btnPrefix}_export_current`).on("click", () => {
      const current = settings3[cat.workeridKey];
      if (!current || !settings3.runninghub_workers[current]) return;
      const data = {
        name: current,
        workflowId: settings3.runninghub_workflow_ids?.[current] || "",
        workflow: settings3.runninghub_workers[current]
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `runninghub-workflow-${current}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    $(`${cat.btnPrefix}_export_all`).on("click", () => {
      const data = {
        workers: settings3.runninghub_workers || {},
        workflowIds: settings3.runninghub_workflow_ids || {}
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `runninghub-workflows-all.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    $(`${cat.btnPrefix}_import`).on("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (re) => {
          try {
            const imported = JSON.parse(re.target.result);
            if (!settings3.runninghub_workflow_ids) settings3.runninghub_workflow_ids = {};
            if (isComfyUIFullWorkflow2(imported)) {
              alert("\u68C0\u6D4B\u5230 ComfyUI \u5B8C\u6574\u5DE5\u4F5C\u6D41\u683C\u5F0F\uFF08\u5305\u542B UI/\u753B\u5E03 \u4FE1\u606F\uFF09\u3002\n\n\u8BF7\u5728 ComfyUI \u4E2D\u6253\u5F00\u6B64\u5DE5\u4F5C\u6D41\uFF0C\u5F00\u542F\u5F00\u53D1\u8005\u6A21\u5F0F\u5E76\u5BFC\u51FA\u4E3A API \u683C\u5F0F\uFF08Save API Format\uFF09\u540E\u518D\u5BFC\u5165\u3002");
              return;
            }
            if (isRawComfyUIWorkflow2(imported)) {
              const defaultName = file.name.replace(/\.json$/i, "") || `\u5BFC\u5165\u7684${cat.name}`;
              const workflowName = await stylInput(`\u68C0\u6D4B\u5230\u539F\u59CB API \u683C\u5F0F\u5DE5\u4F5C\u6D41\uFF0C\u8BF7\u4E3A\u5176\u547D\u540D\u9884\u8BBE\uFF1A`, defaultName);
              if (workflowName && workflowName.trim()) {
                const name = workflowName.trim();
                const workflowData = JSON.stringify(imported, null, 2);
                settings3.runninghub_workers[name] = workflowData;
                settings3[cat.workeridKey] = name;
                settings3[cat.workerKey] = workflowData;
                refreshAllWorkerSelects();
                saveSettingsDebounced();
                toastr.success(`\u5DE5\u4F5C\u6D41\u9884\u8BBE\u3010${name}\u3011\u5BFC\u5165\u6210\u529F\uFF01`);
              }
              return;
            }
            if (imported.workers && typeof imported.workers === "object") {
              for (const k in imported.workers) {
                settings3.runninghub_workers[k] = typeof imported.workers[k] === "string" ? imported.workers[k] : JSON.stringify(imported.workers[k], null, 2);
              }
              if (imported.workflowIds && typeof imported.workflowIds === "object") {
                for (const k in imported.workflowIds) {
                  settings3.runninghub_workflow_ids[k] = String(imported.workflowIds[k]);
                }
              }
              refreshAllWorkerSelects();
              saveSettingsDebounced();
              toastr.success("\u5DE5\u4F5C\u6D41\u914D\u7F6E\u5305\u5BFC\u5165\u6210\u529F\uFF01");
              return;
            }
            if (imported.name && imported.workflow) {
              const name = imported.name;
              settings3.runninghub_workers[name] = typeof imported.workflow === "string" ? imported.workflow : JSON.stringify(imported.workflow, null, 2);
              if (imported.workflowId) {
                settings3.runninghub_workflow_ids[name] = String(imported.workflowId);
              }
              settings3[cat.workeridKey] = name;
              settings3[cat.workerKey] = settings3.runninghub_workers[name];
              refreshAllWorkerSelects();
              saveSettingsDebounced();
              toastr.success(`\u5DE5\u4F5C\u6D41\u9884\u8BBE\u3010${name}\u3011\u5BFC\u5165\u6210\u529F\uFF01`);
              return;
            }
            if (typeof imported === "object" && imported !== null && !Array.isArray(imported)) {
              for (const k in imported) {
                settings3.runninghub_workers[k] = typeof imported[k] === "string" ? imported[k] : JSON.stringify(imported[k], null, 2);
              }
              refreshAllWorkerSelects();
              saveSettingsDebounced();
              toastr.success("\u5DE5\u4F5C\u6D41\u9884\u8BBE\u5B57\u5178\u5BFC\u5165\u6210\u529F\uFF01");
              return;
            }
            alert("\u672A\u8BC6\u522B\u7684\u6587\u4EF6\u683C\u5F0F\uFF0C\u5BFC\u5165\u5931\u8D25\u3002");
          } catch (err) {
            alert("\u5BFC\u5165\u5931\u8D25: " + err.message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
    $(`${cat.btnPrefix}_delete_style`).on("click", async () => {
      const current = settings3[cat.workeridKey];
      if (!current) return;
      if (Object.keys(settings3.runninghub_workers).length <= 1) {
        alert("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u5DE5\u4F5C\u6D41\u9884\u8BBE");
        return;
      }
      const ok = await stylishConfirm(`\u786E\u5B9A\u5220\u9664\u5DE5\u4F5C\u6D41\u9884\u8BBE "${current}" \u5417\uFF1F`);
      if (ok) {
        delete settings3.runninghub_workers[current];
        if (settings3.runninghub_workflow_ids) delete settings3.runninghub_workflow_ids[current];
        const remainingFirst = Object.keys(settings3.runninghub_workers)[0] || "";
        WORKFLOW_CATEGORIES.forEach((otherCat) => {
          if (settings3[otherCat.workeridKey] === current) {
            settings3[otherCat.workeridKey] = remainingFirst;
          }
        });
        refreshAllWorkerSelects();
        saveSettingsDebounced();
        toastr.success(`\u5DF2\u5220\u9664\u9884\u8BBE "${current}"`);
      }
    });
    $(cat.inheritBtnId).on("click", () => {
      inheritRunningHubWork(cat.textareaId, cat.workeridKey, cat.workerKey);
    });
    $(cat.vizBtnId).on("click", () => {
      visualizeRunningHubWorkflow(cat.textareaId, cat.workeridKey, cat.workerKey);
    });
  });
  const otherCustomConfigs = [
    {
      id: "runninghub_model",
      optionsKey: "runninghub_custom_models",
      editBtnId: "#edit_runninghub_model_options",
      title: "\u7F16\u8F91\u300C\u6A21\u578B\u6587\u4EF6\u300D\u4E0B\u62C9\u9009\u9879",
      defaultOptions: defaultSettings.runninghub_custom_models || [
        "v1-5-pruned-emaonly.safetensors",
        "sd_xl_base_1.0.safetensors",
        "flux1-dev.safetensors",
        "flux1-schnell.safetensors",
        "animagine-xl-3.1.safetensors",
        "Illustrious-XL-v0.1.safetensors"
      ]
    },
    {
      id: "runninghub_sampler_name",
      optionsKey: "runninghub_custom_samplers",
      editBtnId: "#edit_runninghub_sampler_name_options",
      title: "\u7F16\u8F91\u300C\u91C7\u6837\u65B9\u6CD5\u300D\u4E0B\u62C9\u9009\u9879",
      defaultOptions: defaultSettings.runninghub_custom_samplers || [
        "euler",
        "euler_ancestral",
        "heun",
        "dpm_2",
        "dpm_2_ancestral",
        "lms",
        "dpm_fast",
        "dpm_adaptive",
        "dpmpp_2s_ancestral",
        "dpmpp_sde",
        "dpmpp_2m",
        "dpmpp_2m_sde",
        "dpmpp_3m_sde",
        "ddim",
        "uni_pc",
        "uni_pc_bh2"
      ]
    },
    {
      id: "runninghub_vae",
      optionsKey: "runninghub_custom_vaes",
      editBtnId: "#edit_runninghub_vae_options",
      title: "\u7F16\u8F91\u300CVAE\u300D\u4E0B\u62C9\u9009\u9879",
      defaultOptions: defaultSettings.runninghub_custom_vaes || [
        "vae-ft-mse-840000-ema-pruned.safetensors",
        "sdxl_vae.safetensors",
        "ae.safetensors",
        "taesd.safetensors"
      ]
    },
    {
      id: "runninghub_scheduler",
      optionsKey: "runninghub_custom_schedulers",
      editBtnId: "#edit_runninghub_scheduler_options",
      title: "\u7F16\u8F91\u300C\u8C03\u5EA6\u5668 / Scheduler\u300D\u4E0B\u62C9\u9009\u9879",
      defaultOptions: defaultSettings.runninghub_custom_schedulers || [
        "normal",
        "karras",
        "exponential",
        "sgm_uniform",
        "simple",
        "ddim_uniform",
        "beta"
      ]
    },
    {
      id: "runninghub_clip_name",
      optionsKey: "runninghub_custom_clips",
      editBtnId: "#edit_runninghub_clip_name_options",
      title: "\u7F16\u8F91\u300CCLIP\u300D\u4E0B\u62C9\u9009\u9879",
      defaultOptions: defaultSettings.runninghub_custom_clips || [
        "clip_l.safetensors",
        "clip_g.safetensors",
        "t5xxl_fp16.safetensors",
        "t5xxl_fp8_e4m3fn.safetensors"
      ]
    }
  ];
  otherCustomConfigs.forEach((cfg) => {
    const selectEl = document.getElementById(cfg.id);
    if (!selectEl) return;
    let opts = Array.isArray(settings3[cfg.optionsKey]) ? [...settings3[cfg.optionsKey]] : [...cfg.defaultOptions];
    const currentVal = settings3[cfg.id] !== void 0 ? settings3[cfg.id] : opts[0] || "";
    if (currentVal && !opts.includes(currentVal)) {
      opts.unshift(currentVal);
    }
    settings3[cfg.optionsKey] = opts;
    $(selectEl).empty();
    opts.forEach((opt) => {
      const optEl = document.createElement("option");
      optEl.value = opt;
      optEl.textContent = opt;
      selectEl.appendChild(optEl);
    });
    if (currentVal) {
      selectEl.value = currentVal;
      settings3[cfg.id] = currentVal;
    }
    $(selectEl).off("change.rh_other").on("change.rh_other", (e) => {
      settings3[cfg.id] = e.target.value;
      saveSettingsDebounced();
    });
    $(cfg.editBtnId).off("click.rh_edit").on("click.rh_edit", () => {
      openRunningHubSelectOptionsEditor({
        title: cfg.title,
        settingKey: cfg.id,
        optionsKey: cfg.optionsKey,
        defaultOptions: cfg.defaultOptions,
        selectEl
      });
    });
  });
  const genParamKeys = [
    { id: "runninghub_width", default: "1024" },
    { id: "runninghub_height", default: "1024" },
    { id: "runninghub_steps", default: "20" },
    { id: "runninghub_seed", default: "-1" },
    { id: "runninghub_cfg", default: "7" }
  ];
  genParamKeys.forEach(({ id, default: defVal }) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = settings3[id] !== void 0 ? settings3[id] : defVal;
      $(el).off("input change.rh_gen").on("input change.rh_gen", (e) => {
        settings3[id] = e.target.value;
        saveSettingsDebounced();
      });
    }
  });
  const sizeEl = document.getElementById("runninghub_size");
  if (sizeEl) {
    if (settings3.runninghub_size) sizeEl.value = settings3.runninghub_size;
    $(sizeEl).off("change.rh_size").on("change.rh_size", (e) => {
      const val = e.target.value;
      settings3.runninghub_size = val;
      const parts = val.split("x");
      if (parts.length === 2) {
        const w = parts[0];
        const h = parts[1];
        settings3.runninghub_width = w;
        settings3.runninghub_height = h;
        const wEl = document.getElementById("runninghub_width");
        const hEl = document.getElementById("runninghub_height");
        if (wEl) wEl.value = w;
        if (hEl) hEl.value = h;
      }
      saveSettingsDebounced();
    });
  }
  const videoParamKeys = [
    { id: "runninghub_val_duration", default: "4" },
    { id: "runninghub_val_steps", default: "6" },
    { id: "runninghub_val_megapixels", default: "0.9" },
    { id: "runninghub_val_seed", default: "-1" },
    { id: "runninghub_val_default_img", default: "" },
    { id: "runninghub_val_default_aud", default: "" }
  ];
  videoParamKeys.forEach(({ id, default: defVal }) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = settings3[id] !== void 0 ? settings3[id] : defVal;
      $(el).off("input change.rh_vid").on("input change.rh_vid", (e) => {
        settings3[id] = e.target.value;
        saveSettingsDebounced();
      });
    }
  });
  const apiKeyEl = document.getElementById("runninghub_apiKey");
  if (apiKeyEl) {
    apiKeyEl.value = settings3.runninghub_apiKey || "";
    $(apiKeyEl).off("input change.rh_api").on("input change.rh_api", (e) => {
      settings3.runninghub_apiKey = e.target.value;
      saveSettingsDebounced();
      invalidateBalanceCache();
      renderRunningHubKeyConsumptionSummary();
    });
  }
  const globalLimitEl = document.getElementById("st_chatu8_runninghub_global_concurrency_limit");
  if (globalLimitEl) {
    const currentGlobalLimit = getGlobalConcurrencyLimit();
    globalLimitEl.value = currentGlobalLimit > 0 ? currentGlobalLimit : "";
    $(globalLimitEl).off("change.rh_global_limit").on("change.rh_global_limit", (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      setGlobalConcurrencyLimit(val);
      toastr.info(`RunningHub \u5168\u5C40\u5E76\u53D1\u4E0A\u9650\u5DF2\u66F4\u65B0\u4E3A: ${val > 0 ? val + " \u8DEF" : "\u4E0D\u9650"}`);
    });
  }
  const instanceTypeEl = document.getElementById("runninghub_instance_type");
  if (instanceTypeEl) {
    const validTypes = ["default", "plus"];
    let curType = settings3.runninghub_instance_type || "default";
    if (!validTypes.includes(curType)) {
      curType = "default";
      settings3.runninghub_instance_type = "default";
      saveSettingsDebounced();
    }
    instanceTypeEl.value = curType;
    $(instanceTypeEl).off("change.rh_inst").on("change.rh_inst", (e) => {
      settings3.runninghub_instance_type = e.target.value;
      saveSettingsDebounced();
    });
  }
  const retainSecEl = document.getElementById("runninghub_retain_seconds");
  if (retainSecEl) {
    retainSecEl.value = settings3.runninghub_retain_seconds ?? "";
    $(retainSecEl).off("input change.rh_retain").on("input change.rh_retain", (e) => {
      settings3.runninghub_retain_seconds = e.target.value;
      saveSettingsDebounced();
    });
  }
  function renderRunningHubKeyConsumptionSummary() {
    const $consumptionContainer = $("#runninghub_key_consumption_container");
    if (!$consumptionContainer.length) return;
    const inputEl = document.getElementById("runninghub_apiKey");
    const rawApiKeyText = inputEl ? inputEl.value : settings3.runninghub_apiKey;
    const keys = getRunningHubApiKeys(rawApiKeyText);
    if (keys.length === 0) {
      $consumptionContainer.hide().empty();
      return;
    }
    let html = `
            <div class="st-chatu8-rh-dashboard">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <span style="font-size: 12px; font-weight: 600; color: var(--st-chatu8-text-primary, #fff); display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-chart-line" style="color: #ff9800;"></i>
                        <span>\u672C\u5730\u4EFB\u52A1 RH \u5E01\u6D88\u8017\u7EDF\u8BA1</span>
                    </span>
                    <span style="font-size: 11px; color: var(--st-chatu8-text-secondary, #94a3b8); opacity: 0.85;">
                        <i class="fa-regular fa-clock" style="margin-right: 4px;"></i>\u5B9E\u65F6\u7D2F\u8BA1 \xB7 \u6C38\u4E45\u8BB0\u5F55
                    </span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
    keys.forEach((key, idx) => {
      const maskedKey = key.length > 12 ? `${key.slice(0, 6)}...${key.slice(-4)}` : key;
      const stats = getKeyConsumptionStats(key);
      const localLimit = getKeyLocalLimit(key);
      html += `
                <div class="st-chatu8-rh-card">
                    <div style="flex: 1; min-width: 0; width: 100%;">
                        <div class="st-chatu8-rh-card-header">
                            <span class="rh-key-title" style="font-family: monospace; font-size: 12px; font-weight: 600; color: var(--st-chatu8-text-primary, #f1f5f9); display: flex; align-items: center; gap: 6px;" title="${escapeHtml6(key)}">
                                <i class="fa-solid fa-key" style="color: #10b981;"></i>Key #${idx + 1}: ${maskedKey}
                            </span>
                            <div class="st-chatu8-rh-limit-group">
                                <span class="st-chatu8-rh-limit-label">
                                    <i class="fa-solid fa-gauge-high" style="color: #60a5fa; margin-right: 3px; font-size: 10px;"></i>\u4E3B\u52A8\u5E76\u53D1\u9650\u5236
                                </span>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <input type="number" min="0" max="100" class="rh-local-limit-input"
                                           data-key="${escapeHtml6(key)}"
                                           value="${localLimit > 0 ? localLimit : ""}"
                                           placeholder="\u4E0D\u9650"
                                           title="\u672C\u5730\u4E3B\u52A8\u5E76\u53D1\u9650\u5236 (\u7559\u7A7A\u62160\u4E3A\u4E0D\u9650\uFF0C\u9075\u5FAA\u5B98\u65B9\u5E76\u53D1\u4E0A\u9650)" />
                                    <span style="font-size: 11px; color: var(--st-chatu8-text-secondary, #94a3b8);">\u8DEF</span>
                                </div>
                            </div>
                        </div>
                        <div class="st-chatu8-rh-badge-grid">
                            <span class="st-chatu8-rh-badge badge-today">
                                \u{1F4C5} \u5F53\u5929: <strong>${stats.today}</strong> RH
                            </span>
                            <span class="st-chatu8-rh-badge badge-7d">
                                \u{1F4C8} 7\u5929: <strong>${stats.sevenDays}</strong> RH
                            </span>
                            <span class="st-chatu8-rh-badge badge-30d">
                                \u{1F4CA} 30\u5929: <strong>${stats.thirtyDays}</strong> RH
                            </span>
                            <span class="st-chatu8-rh-badge badge-total" title="\u8BE5 Key \u672C\u5730\u603B\u8BA1\u6D88\u8017 RH \u5E01">
                                \u{1F4DC} \u5168\u90E8\u5386\u53F2: <strong>${stats.total}</strong> RH
                            </span>
                        </div>
                    </div>
                </div>
            `;
    });
    html += `
                </div>
            </div>
        `;
    $consumptionContainer.show().html(html);
  }
  renderRunningHubKeyConsumptionSummary();
  if (eventSource && typeof eventSource.on === "function") {
    eventSource.on("rh_consumption_updated", () => {
      renderRunningHubKeyConsumptionSummary();
    });
  }
  $(document).off("change.rh_local_limit input.rh_local_limit", ".rh-local-limit-input").on("change.rh_local_limit", ".rh-local-limit-input", function() {
    const key = $(this).data("key");
    const val = $(this).val();
    setKeyLocalLimit(key, val);
    const limitNum = parseInt(val, 10);
    $(`.rh-local-limit-input[data-key="${CSS.escape(key)}"]`).val(limitNum > 0 ? limitNum : "");
    if (limitNum > 0) {
      toastr.success(`\u5DF2\u8BBE\u7F6E Key \u672C\u5730\u4E3B\u52A8\u5E76\u53D1\u9650\u5236\u4E3A: ${limitNum} \u8DEF`);
    } else {
      toastr.info("\u5DF2\u89E3\u9664\u8BE5 Key \u672C\u5730\u4E3B\u52A8\u5E76\u53D1\u9650\u5236 (\u9075\u5FAA\u5B98\u65B9\u4E0A\u9650)");
    }
  });
  $(document).off("change.rh_pause", ".st-chatu8-key-pause-checkbox").on("change.rh_pause", ".st-chatu8-key-pause-checkbox", function() {
    const key = $(this).data("key");
    const checked = $(this).is(":checked");
    setKeyPaused(key, checked);
    const maskedKey = key.length > 12 ? `${key.slice(0, 5)}...${key.slice(-4)}` : key;
    if (checked) {
      toastr.info(`\u5DF2\u6682\u505C Key [${maskedKey}] \u7684\u4EFB\u52A1\u5206\u914D`);
    } else {
      toastr.success(`\u5DF2\u6062\u590D\u542F\u7528 Key [${maskedKey}] \u7684\u4EFB\u52A1\u5206\u914D`);
    }
  });
  $("#runninghub_apiKey_toggle").off("click.rh_toggle").on("click.rh_toggle", function() {
    const textarea = document.getElementById("runninghub_apiKey");
    if (!textarea) return;
    const icon = $(this).find("i");
    const isHidden = textarea.style.webkitTextSecurity === "disc" || textarea.style.webkitTextSecurity === "";
    if (isHidden) {
      textarea.style.webkitTextSecurity = "none";
      icon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
      textarea.style.webkitTextSecurity = "disc";
      icon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
  });
  $("#testRunningHub").off("click.rh_test").on("click.rh_test", async () => {
    const inputEl = document.getElementById("runninghub_apiKey");
    const containerId = "#runninghub_key_status_container";
    const rawApiKeyText = inputEl ? inputEl.value : settings3.runninghub_apiKey;
    const keys = getRunningHubApiKeys(rawApiKeyText);
    if (keys.length === 0) {
      toastr.warning("\u8BF7\u5148\u5728\u4E0A\u65B9\u8F93\u5165\u81F3\u5C11\u4E00\u4E2A RunningHub API Key\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09");
      return;
    }
    const $container4 = $(containerId);
    $container4.show().html(`
                <div style="font-size: 12px; color: var(--st-chatu8-accent-color, #667eea); padding: 8px; background: var(--st-chatu8-bg-secondary, rgba(255,255,255,0.05)); border-radius: 6px;">
                    <i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u67E5\u8BE2 ${keys.length} \u4E2A API Key \u7684\u8D26\u6237\u72B6\u6001\u3001\u4F59\u989D\u4E0E\u5E76\u53D1\u6570\u9650\u5236...
                </div>
            `);
    try {
      const results = await Promise.all(keys.map(async (key, index) => {
        let accountData = null;
        let queueData = null;
        let accountErr = null;
        let queueErr = null;
        try {
          const acc = await fetchRunningHubAccountStatus(key);
          if (acc && acc.code === 0 && acc.data) {
            accountData = acc.data;
          } else {
            accountErr = acc?.msg || "\u8D26\u6237\u67E5\u8BE2\u5931\u8D25";
          }
        } catch (e) {
          accountErr = e.message || "\u7F51\u7EDC\u8FDE\u63A5\u5F02\u5E38";
        }
        try {
          const q = await fetchRunningHubQueueStatus(key);
          if (q && q.code === 0 && q.data) {
            queueData = q.data;
          } else {
            queueErr = q?.msg || "\u5E76\u53D1\u72B6\u6001\u67E5\u8BE2\u5931\u8D25";
          }
        } catch (e) {
          queueErr = e.message || "\u7F51\u7EDC\u8FDE\u63A5\u5F02\u5E38";
        }
        return {
          index: index + 1,
          key,
          accountOk: !!accountData,
          queueOk: !!queueData,
          accountData: accountData || {},
          queueData: queueData || {},
          msg: accountErr || queueErr || "\u67E5\u8BE2\u5931\u8D25"
        };
      }));
      let html = `<div style="display: flex; flex-direction: column; gap: 8px;">`;
      let successCount = 0;
      results.forEach((res) => {
        const maskedKey = res.key.length > 12 ? `${res.key.slice(0, 6)}...${res.key.slice(-4)}` : res.key;
        if (res.accountOk || res.queueOk) {
          successCount++;
          const remainCoins = res.accountData.remainCoins ?? "0";
          const remainMoney = res.accountData.remainMoney ?? "0.00";
          const currency = res.accountData.currency || "CNY";
          const apiType = res.queueData.apiKeyType || res.accountData.apiType || "NORMAL";
          const limit = res.queueOk ? Math.max(1, parseInt(res.queueData.concurrentLimit ?? 1, 10)) : 1;
          const running = res.queueOk ? Math.max(0, parseInt(res.queueData.runningCount ?? 0, 10)) : 0;
          const queued = res.queueOk ? Math.max(0, parseInt(res.queueData.queuedCount ?? 0, 10)) : 0;
          const available = Math.max(0, limit - running);
          const keyStats = getKeyConsumptionStats(res.key);
          const localLimit = getKeyLocalLimit(res.key);
          html += `
                            <div class="st-chatu8-rh-card" style="padding: 12px 14px; border-color: rgba(16, 185, 129, 0.25); background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                                <div style="flex: 1; min-width: 0; width: 100%;">
                                    <div class="st-chatu8-rh-card-header">
                                        <span class="rh-key-title" style="font-family: monospace; font-size: 12px; font-weight: 600; color: var(--st-chatu8-text-primary, #f1f5f9); display: flex; align-items: center; gap: 6px;" title="\u5B8C\u6574Key: ${res.key}">
                                            <i class="fa-solid fa-key" style="color: #10b981;"></i>Key #${res.index}: ${maskedKey}
                                        </span>
                                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                            <span style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 600; border: 1px solid rgba(16, 185, 129, 0.3); white-space: nowrap;">
                                                ${apiType}
                                            </span>
                                            <label class="st-chatu8-key-pause-label" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; color: var(--st-chatu8-text-secondary, #94a3b8); margin-left: 2px;" title="\u52FE\u9009\u540E\u6B64 Key \u5C06\u6682\u505C\u5206\u914D\u65B0\u4EFB\u52A1">
                                                <input type="checkbox" class="st-chatu8-key-pause-checkbox" data-key="${escapeHtml6(res.key)}" ${isKeyPaused(res.key) ? "checked" : ""} style="cursor: pointer;" />
                                                <span>\u6682\u505C\u4EFB\u52A1</span>
                                            </label>
                                            <div class="st-chatu8-rh-limit-group">
                                                <span class="st-chatu8-rh-limit-label">
                                                    <i class="fa-solid fa-gauge-high" style="color: #60a5fa; margin-right: 3px; font-size: 10px;"></i>\u4E3B\u52A8\u5E76\u53D1\u9650\u5236
                                                </span>
                                                <div style="display: flex; align-items: center; gap: 4px;">
                                                    <input type="number" min="0" max="100" class="rh-local-limit-input" 
                                                           data-key="${escapeHtml6(res.key)}" 
                                                           value="${localLimit > 0 ? localLimit : ""}" 
                                                           placeholder="\u4E0D\u9650" 
                                                           title="\u9650\u5236\u672C\u5730\u540C\u65F6\u8FD0\u884C\u7684\u4EFB\u52A1\u6570\uFF08\u7559\u7A7A\u62160\u4E3A\u4E0D\u9650\uFF0C\u9075\u5FAA\u5B98\u65B9\u5E76\u53D1\u4E0A\u9650\uFF09" />
                                                    <span style="font-size: 11px; color: var(--st-chatu8-text-secondary, #94a3b8);">\u8DEF</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px; align-items: center; margin-bottom: 8px;">
                                        <span class="st-chatu8-rh-badge" style="background: rgba(20, 184, 166, 0.15); color: #2dd4bf; border-color: rgba(20, 184, 166, 0.25);">
                                            \u{1F680} \u6700\u5927\u5E76\u53D1: <strong>${limit}</strong>
                                        </span>
                                        <span class="st-chatu8-rh-badge" style="background: ${available >= 1 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}; color: ${available >= 1 ? "#34d399" : "#f87171"}; border-color: ${available >= 1 ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"};">
                                            \u{1F7E2} \u53EF\u7528\u5E76\u53D1: <strong>${available}</strong>
                                        </span>
                                        <span class="st-chatu8-rh-badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border-color: rgba(168, 85, 247, 0.25);">
                                            \u26A1 \u8FDC\u7AEF\u4EFB\u52A1: <strong>\u8FD0\u884C\u4E2D ${running} / \u6392\u961F ${queued}</strong>
                                        </span>
                                        <span class="st-chatu8-rh-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-color: rgba(245, 158, 11, 0.25);">
                                            \u{1FA99} RH\u5E01: <strong>${remainCoins}</strong>
                                        </span>
                                        <span class="st-chatu8-rh-badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.25);">
                                            \u{1F4B5} \u94B1\u5305: <strong>${remainMoney} ${currency}</strong>
                                        </span>
                                    </div>
                                    <div class="st-chatu8-rh-badge-grid" style="padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.08);">
                                        <span class="st-chatu8-rh-badge badge-today">
                                            \u{1F4C5} \u5F53\u5929: <strong>${keyStats.today}</strong> RH
                                        </span>
                                        <span class="st-chatu8-rh-badge badge-7d">
                                            \u{1F4C8} 7\u5929: <strong>${keyStats.sevenDays}</strong> RH
                                        </span>
                                        <span class="st-chatu8-rh-badge badge-30d">
                                            \u{1F4CA} 30\u5929: <strong>${keyStats.thirtyDays}</strong> RH
                                        </span>
                                        <span class="st-chatu8-rh-badge badge-total">
                                            \u{1F4DC} \u5168\u90E8\u5386\u53F2: <strong>${keyStats.total}</strong> RH
                                        </span>
                                    </div>
                                </div>
                            </div>
                        `;
        } else {
          html += `
                            <div style="padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(244, 67, 54, 0.35); background: rgba(244, 67, 54, 0.08);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-family: monospace; font-size: 12px; color: var(--st-chatu8-text-primary, #fff);" title="\u5B8C\u6574Key: ${res.key}">
                                        <i class="fa-solid fa-triangle-exclamation" style="color: #f44336; margin-right: 5px;"></i>Key #${res.index}: ${maskedKey}
                                    </span>
                                    <span style="font-size: 11px; color: #f44336; font-weight: 500;">
                                        \u274C ${res.msg}
                                    </span>
                                </div>
                            </div>
                        `;
        }
      });
      html += `</div>`;
      $container4.html(html);
      if (successCount === keys.length) {
        toastr.success(`\u67E5\u8BE2\u5B8C\u6210\uFF1A\u5168\u90E8 ${keys.length} \u4E2A Key \u5747\u6709\u6548\u5E76\u5DF2\u83B7\u53D6\u5E76\u53D1\u6570\u9650\u5236`);
      } else {
        toastr.info(`\u67E5\u8BE2\u5B8C\u6210\uFF1A${successCount}/${keys.length} \u4E2A Key \u72B6\u6001\u6B63\u5E38`);
      }
    } catch (e) {
      $container4.html(`<div style="color: #f44336; font-size: 12px; padding: 8px;">\u67E5\u8BE2\u5931\u8D25: ${e.message}</div>`);
      toastr.error("\u8FDE\u901A\u6D4B\u8BD5\u5931\u8D25: " + e.message);
    }
  });
  const testDemandEl = document.getElementById("runninghub_video_test_demand");
  if (testDemandEl) {
    testDemandEl.value = settings3.runninghub_video_test_demand || "";
    $(testDemandEl).off("input change.rh_demand").on("input change.rh_demand", (e) => {
      settings3.runninghub_video_test_demand = e.target.value;
      saveSettingsDebounced();
    });
  }
  const testPromptEl = document.getElementById("runninghub_video_test_prompt");
  if (testPromptEl) {
    testPromptEl.value = settings3.runninghub_video_test_prompt || "";
    $(testPromptEl).off("input change.rh_test").on("input change.rh_test", (e) => {
      settings3.runninghub_video_test_prompt = e.target.value;
      saveSettingsDebounced();
    });
  }
  let currentTestAbortController = null;
  let currentTestTaskId = null;
  async function handleRunVideoTest(testType) {
    const isImg2Vid = testType === "img2vid";
    const testModeName = isImg2Vid ? "\u5355\u56FE\u751F\u89C6\u9891" : "\u591A\u56FE\u751F\u89C6\u9891";
    const promptText = (document.getElementById("runninghub_video_test_prompt")?.value || settings3.runninghub_video_test_prompt || "").trim();
    if (!promptText) {
      toastr.warning("\u8BF7\u8F93\u5165\u6D4B\u8BD5\u63D0\u793A\u8BCD (Prompt)");
      document.getElementById("runninghub_video_test_prompt")?.focus();
      return;
    }
    const rawApiKey = (document.getElementById("runninghub_apiKey")?.value || settings3.runninghub_apiKey || "").trim();
    const apiKeys = getRunningHubApiKeys(rawApiKey);
    const apiKey = apiKeys[0] || "";
    if (!apiKey) {
      toastr.warning("\u8BF7\u5148\u5728 RunningHub \u8BBE\u7F6E\u9875\u4E2D\u586B\u5199 API Key");
      return;
    }
    const targetWorkerId = isImg2Vid ? settings3.runninghub_img2vid_workerid || "" : settings3.runninghub_ref2vid_workerid || "";
    const targetWorkflowId = (isImg2Vid ? document.getElementById("runninghub_img2vid_workflowId")?.value || settings3.runninghub_workflow_ids?.[targetWorkerId] || settings3.runninghub_img2vid_workflowId : document.getElementById("runninghub_ref2vid_workflowId")?.value || settings3.runninghub_workflow_ids?.[targetWorkerId] || settings3.runninghub_ref2vid_workflowId) || "";
    const targetWorkerJson = (isImg2Vid ? document.getElementById("runninghub_img2vid_worker")?.value || settings3.runninghub_workers?.[targetWorkerId] || settings3.runninghub_img2vid_worker : document.getElementById("runninghub_ref2vid_worker")?.value || settings3.runninghub_workers?.[targetWorkerId] || settings3.runninghub_ref2vid_worker) || "";
    if (!targetWorkflowId) {
      toastr.error(`\u8BF7\u5148\u5728\u4E0A\u65B9\u3010${isImg2Vid ? "\u56FE\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41" : "\u53C2\u8003\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41"}\u3011\u4E2D\u914D\u7F6E\u8BE5\u9884\u8BBE\u7684 Workflow ID`);
      return;
    }
    const genSettings = {
      duration: document.getElementById("runninghub_val_duration")?.value || settings3.runninghub_val_duration || "4",
      steps: document.getElementById("runninghub_val_steps")?.value || settings3.runninghub_val_steps || "6",
      megapixels: document.getElementById("runninghub_val_megapixels")?.value || settings3.runninghub_val_megapixels || "0.9",
      seed: document.getElementById("runninghub_val_seed")?.value || settings3.runninghub_val_seed || "-1",
      defaultImg: document.getElementById("runninghub_val_default_img")?.value || settings3.runninghub_val_default_img || "",
      defaultAud: document.getElementById("runninghub_val_default_aud")?.value || settings3.runninghub_val_default_aud || ""
    };
    const uploadedImages = {};
    const uploadedAudios = {};
    if (isImg2Vid) {
      const img1 = sessionUploadedMedia.img?.[1];
      if (img1) {
        uploadedImages[1] = img1;
      } else {
        toastr.info("\u63D0\u793A\uFF1A\u56FE\u7247 1 \u672A\u4E0A\u4F20\u53C2\u8003\u56FE\uFF0C\u5C06\u4F7F\u7528\u9ED8\u8BA4\u56FE\u7247\u515C\u5E95\u751F\u6210");
      }
    } else {
      for (let i = 1; i <= 9; i++) {
        const ctrlMode = settings3[`runninghub_img_ctrl_${i}`] || "bypass";
        if (ctrlMode === "open" && sessionUploadedMedia.img?.[i]) {
          uploadedImages[i] = sessionUploadedMedia.img[i];
        }
      }
      for (let i = 1; i <= 3; i++) {
        const ctrlMode = settings3[`runninghub_aud_ctrl_${i}`] || "bypass";
        if (ctrlMode === "open" && sessionUploadedMedia.aud?.[i]) {
          uploadedAudios[i] = sessionUploadedMedia.aud[i];
        }
      }
    }
    const $status = $("#runninghub_video_test_status");
    const $cancelBtn = $("#runninghub_test_cancel_btn");
    const $refBtn = $("#runninghub_test_ref2vid_btn");
    const $imgBtn = $("#runninghub_test_img2vid_btn");
    const $previewContainer = $("#runninghub_video_test_preview_container");
    const videoPlayer = document.getElementById("runninghub_video_test_player");
    if (videoPlayer) {
      try {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        videoPlayer.removeAttribute("src");
        videoPlayer.load();
      } catch (e) {
        console.warn("[RunningHubVideoTest] \u6682\u505C\u65E7\u89C6\u9891\u5931\u8D25:", e);
      }
    }
    const downloadBtn = document.getElementById("runninghub_video_test_download_btn");
    if (downloadBtn) {
      downloadBtn.removeAttribute("href");
    }
    const openBtn = document.getElementById("runninghub_video_test_open_btn");
    if (openBtn) {
      openBtn.removeAttribute("href");
    }
    $status.show().html(`
            <div style="color: var(--st-chatu8-accent-color, #667eea); font-weight: 500;">
                <i class="fa-solid fa-spinner fa-spin"></i> [${testModeName}] \u6B63\u5728\u51C6\u5907\u751F\u6210\u4EFB\u52A1...
            </div>
        `);
    $previewContainer.hide();
    $cancelBtn.show();
    $refBtn.prop("disabled", true);
    $imgBtn.prop("disabled", true);
    currentTestAbortController = new AbortController();
    const taskType = isImg2Vid ? TaskType.RUNNINGHUB_IMG2VID : TaskType.RUNNINGHUB_REF2VID;
    currentTestTaskId = taskQueue.addTask({
      name: `[\u6D4B\u8BD5] ${isImg2Vid ? "RunningHub\u5355\u56FE\u751F\u89C6\u9891" : "RunningHub\u591A\u56FE\u751F\u89C6\u9891"}: ${(promptText || "").slice(0, 24)}...`,
      type: taskType,
      prompt: promptText
    });
    taskQueue.updateStatus(currentTestTaskId, TaskStatus.RUNNING);
    const onStatusUpdate = (msg, isError = false) => {
      const timeStr = (/* @__PURE__ */ new Date()).toLocaleTimeString();
      const color = isError ? "#f44336" : "var(--st-chatu8-text-primary, #fff)";
      const icon = isError ? '<i class="fa-solid fa-circle-exclamation" style="color: #f44336;"></i>' : '<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--st-chatu8-accent-color, #667eea);"></i>';
      $status.html(`
                <div style="color: ${color};">
                    ${icon} <span style="color: #888; font-size: 11px;">[${timeStr}]</span> ${msg}
                </div>
            `);
    };
    try {
      const result = await executeRunningHubVideoDirectTest({
        prompt: promptText,
        workflowJson: targetWorkerJson,
        workflowId: targetWorkflowId,
        uploadedImages,
        uploadedAudios,
        genSettings,
        apiKeys,
        onStatusUpdate,
        abortSignal: currentTestAbortController.signal
      });
      if (result && result.videoUrl) {
        if (currentTestTaskId) {
          taskQueue.completeTask(currentTestTaskId, true);
        }
        const rhCostParts = [];
        if (result.taskCostTime != null) rhCostParts.push(`\u8017\u65F6: ${result.taskCostTime}s`);
        if (result.consumeCoins != null) rhCostParts.push(`\u6D88\u8017: ${result.consumeCoins} \u5E01`);
        const rhCostText = rhCostParts.length > 0 ? ` | ${rhCostParts.join(" | ")}` : "";
        $status.html(`
                    <div style="color: #4caf50; font-weight: 500;">
                        <i class="fa-solid fa-circle-check" style="color: #4caf50;"></i> [${testModeName}] \u89C6\u9891\u751F\u6210\u6210\u529F\uFF01(\u79CD\u5B50: ${result.seedUsed}${rhCostText})
                    </div>
                `);
        if (videoPlayer) {
          videoPlayer.src = result.videoUrl;
          videoPlayer.style.display = "block";
          try {
            videoPlayer.load();
            videoPlayer.pause();
          } catch (e) {
          }
        }
        const downloadBtn2 = document.getElementById("runninghub_video_test_download_btn");
        if (downloadBtn2) {
          downloadBtn2.href = result.videoUrl;
        }
        const openBtn2 = document.getElementById("runninghub_video_test_open_btn");
        if (openBtn2) {
          openBtn2.href = result.originalUrl || result.videoUrl;
        }
        $previewContainer.css("display", "flex");
        toastr.success(`[${testModeName}] \u89C6\u9891\u751F\u6210\u5E76\u9884\u89C8\u5C31\u7EEA\uFF01${rhCostParts.length > 0 ? `(${rhCostParts.join(", ")})` : ""}`);
      }
    } catch (err) {
      const isAborted = err.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88" || currentTestAbortController?.signal?.aborted;
      if (currentTestTaskId) {
        if (isAborted) {
          taskQueue.cancelTask(currentTestTaskId);
        } else {
          taskQueue.completeTask(currentTestTaskId, false);
        }
      }
      if (isAborted) {
        $status.html(`<div style="color: #ff9800;"><i class="fa-solid fa-ban"></i> \u4EFB\u52A1\u5DF2\u88AB\u7528\u6237\u53D6\u6D88</div>`);
        toastr.info("\u5DF2\u53D6\u6D88\u89C6\u9891\u751F\u6210\u4EFB\u52A1");
      } else {
        $status.html(`<div style="color: #f44336;"><i class="fa-solid fa-triangle-exclamation"></i> \u751F\u6210\u5931\u8D25: ${err.message}</div>`);
        toastr.error(`\u89C6\u9891\u751F\u6210\u5931\u8D25: ${err.message}`);
      }
    } finally {
      $cancelBtn.hide();
      $refBtn.prop("disabled", false);
      $imgBtn.prop("disabled", false);
      currentTestAbortController = null;
      currentTestTaskId = null;
    }
  }
  $("#runninghub_test_ref2vid_btn").off("click.rh_ref2vid").on("click.rh_ref2vid", () => {
    handleRunVideoTest("ref2vid");
  });
  $("#runninghub_test_img2vid_btn").off("click.rh_img2vid").on("click.rh_img2vid", () => {
    handleRunVideoTest("img2vid");
  });
  $("#runninghub_test_cancel_btn").off("click.rh_cancel").on("click.rh_cancel", () => {
    if (currentTestTaskId) {
      taskQueue.cancelTask(currentTestTaskId);
    }
    if (currentTestAbortController) {
      currentTestAbortController.abort();
    }
  });
  const handleTaskMgrCancel = ({ taskId } = {}) => {
    if (taskId && taskId === currentTestTaskId) {
      console.log("[RunningHubVideoTest] \u63A5\u6536\u5230\u4EFB\u52A1\u7BA1\u7406\u53D6\u6D88\u4E8B\u4EF6:", taskId);
      if (currentTestAbortController) {
        currentTestAbortController.abort();
      }
    }
  };
  eventSource.on("st_chatu8_cancel_task", handleTaskMgrCancel);
  eventSource.on("st_chatu8_cancel_runninghub_task", handleTaskMgrCancel);
  async function compressImageSource(source, maxDim = 768, quality = 0.8) {
    if (!source) return null;
    const calcFitDimensions = (origWidth, origHeight, maxLimit) => {
      let width = origWidth || 512;
      let height = origHeight || 512;
      if (width > maxLimit || height > maxLimit) {
        if (width >= height) {
          height = Math.round(height * maxLimit / width);
          width = maxLimit;
        } else {
          width = Math.round(width * maxLimit / height);
          height = maxLimit;
        }
      }
      return {
        width: Math.max(1, width),
        height: Math.max(1, height)
      };
    };
    const drawAndExport = (drawable, origWidth, origHeight) => {
      const { width, height } = calcFitDimensions(origWidth, origHeight, maxDim);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(drawable, 0, 0, width, height);
      try {
        return canvas.toDataURL("image/jpeg", quality);
      } catch (err) {
        console.warn("[compressImageSource] canvas.toDataURL \u5BFC\u51FA\u5931\u8D25 (\u53EF\u80FD\u88AB\u6C61\u67D3):", err);
        return null;
      }
    };
    if (source instanceof HTMLImageElement) {
      if (!source.src || source.style.display === "none") return null;
      if (source.complete && source.naturalWidth > 0) {
        try {
          if (typeof createImageBitmap === "function") {
            const bitmap = await createImageBitmap(source);
            const dataUrl = drawAndExport(bitmap, bitmap.width, bitmap.height);
            bitmap.close();
            if (dataUrl) return dataUrl;
          } else {
            const dataUrl = drawAndExport(source, source.naturalWidth, source.naturalHeight);
            if (dataUrl) return dataUrl;
          }
        } catch (e) {
          console.warn("[compressImageSource] HTMLImageElement \u76F4\u63A5\u8BFB\u53D6\u5931\u8D25\uFF0C\u5C1D\u8BD5\u5E38\u89C4\u56DE\u9000:", e);
        }
      }
    }
    if (source instanceof Blob || source instanceof File) {
      if (typeof createImageBitmap === "function") {
        try {
          const bitmap = await createImageBitmap(source);
          const dataUrl = drawAndExport(bitmap, bitmap.width, bitmap.height);
          bitmap.close();
          if (dataUrl) return dataUrl;
        } catch (err) {
          console.warn("[compressImageSource] createImageBitmap \u89E3\u7801 Blob \u5931\u8D25\uFF0C\u5C1D\u8BD5\u56DE\u9000:", err);
        }
      }
    }
    let imgSrc = "";
    let shouldRevoke = false;
    if (typeof source === "string") {
      imgSrc = source;
    } else if (source instanceof HTMLImageElement) {
      imgSrc = source.src;
    } else if (source instanceof Blob || source instanceof File) {
      imgSrc = URL.createObjectURL(source);
      shouldRevoke = true;
    }
    if (!imgSrc) return null;
    return new Promise((resolve) => {
      const img = new Image();
      const isHttpUrl = imgSrc.startsWith("http://") || imgSrc.startsWith("https://");
      if (isHttpUrl) {
        img.crossOrigin = "Anonymous";
      }
      img.onload = () => {
        if (shouldRevoke) {
          try {
            URL.revokeObjectURL(imgSrc);
          } catch (e) {
          }
        }
        const dataUrl = drawAndExport(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        if (shouldRevoke) {
          try {
            URL.revokeObjectURL(imgSrc);
          } catch (e) {
          }
        }
        console.warn("[compressImageSource] \u56FE\u7247\u52A0\u8F7D\u5931\u8D25:", err, imgSrc?.slice?.(0, 100));
        resolve(null);
      };
      img.src = imgSrc;
    });
  }
  async function getAudioMetadata(index) {
    const file = sessionUploadedMedia.audFiles?.[index] || document.getElementById(`runninghub_file_aud_${index}`)?.files?.[0];
    const serverFileName = sessionUploadedMedia.aud?.[index] || "";
    const preview = document.getElementById(`runninghub_preview_aud_${index}`);
    const hasAudio = Boolean(file || serverFileName || preview && preview.src && preview.style.display !== "none");
    if (!hasAudio) {
      return { index, fileName: "", durationStr: "", hasAudio: false };
    }
    const fileName = file?.name || serverFileName || `\u97F3\u9891${index}`;
    let durationSec = 0;
    if (preview && !isNaN(preview.duration) && preview.duration > 0) {
      durationSec = preview.duration;
    } else if (file) {
      try {
        const url = URL.createObjectURL(file);
        const tempAudio = new Audio();
        await new Promise((resolve) => {
          tempAudio.onloadedmetadata = () => {
            durationSec = tempAudio.duration || 0;
            URL.revokeObjectURL(url);
            resolve();
          };
          tempAudio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          tempAudio.src = url;
          setTimeout(() => {
            URL.revokeObjectURL(url);
            resolve();
          }, 300);
        });
      } catch (e) {
        console.warn(`[getAudioMetadata] \u83B7\u53D6\u97F3\u9891${index}\u65F6\u957F\u5931\u8D25:`, e);
      }
    }
    const durationStr = durationSec > 0 ? `${durationSec.toFixed(1)}\u79D2` : "\u5DF2\u4E0A\u4F20";
    return { index, fileName, durationStr, hasAudio: true };
  }
  function attachImagesToMessage9(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
    if (!images || images.length === 0 || messageIndex < 0 || messageIndex >= messages.length) {
      return messages;
    }
    const result = [...messages];
    const targetMsg = result[messageIndex];
    const contentParts = [];
    if (typeof targetMsg.content === "string") {
      contentParts.push({ type: "text", text: targetMsg.content });
    } else if (Array.isArray(targetMsg.content)) {
      contentParts.push(...targetMsg.content);
    }
    images.forEach((imgItem, idx) => {
      const imgBase64 = typeof imgItem === "string" ? imgItem : imgItem.base64;
      const imgName = typeof imgItem === "object" && imgItem.name ? imgItem.name : `${imageLabel}${idx + 1}`;
      const imgDesc = (typeof imgItem === "object" && imgItem.description ? imgItem.description : "").trim();
      let labelText = imgName.startsWith("<") && imgName.endsWith(">") ? `
${imgName}` : `
[${imgName}]`;
      if (imgDesc) {
        labelText += `
\u7B80\u4ECB: ${imgDesc}`;
      }
      contentParts.push({ type: "text", text: labelText });
      let imageUrl = imgBase64;
      if (!imgBase64.startsWith("data:")) {
        imageUrl = `data:image/jpeg;base64,${imgBase64}`;
      }
      contentParts.push({
        type: "image_url",
        image_url: { url: imageUrl, detail: "auto" }
      });
    });
    result[messageIndex] = { ...targetMsg, content: contentParts };
    return result;
  }
  function findUserDemandMessageIndex2(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  }
  function stripAssetManifest(text) {
    if (!text || typeof text !== "string") return "";
    let cleaned = text.trim();
    const manifestJsonRegex = /asset_manifest\s*:\s*\{[\s\S]*?\}/i;
    const matchJson = cleaned.match(manifestJsonRegex);
    if (matchJson) {
      cleaned = cleaned.replace(matchJson[0], "").trim();
    } else {
      const manifestYamlRegex = /^\s*asset_manifest\s*:[\s\S]*?(?=(?:subject_definitions|summary|shot_1|clip_1|prompt|visual_scene|scene_1|主体定义|分镜|镜头)\s*:|$)/im;
      cleaned = cleaned.replace(manifestYamlRegex, "").trim();
    }
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*/i, "").replace(/```$/g, "").trim();
    return cleaned.replace(/^[\r\n]+/, "").trim();
  }
  function extractVideoPromptFromLLMResponse(llmText) {
    if (!llmText || typeof llmText !== "string") return "";
    const cleaned = removeThinkingTags(llmText);
    const parsedVideos = parseVideosFromPrompt(cleaned);
    let promptResult = "";
    if (parsedVideos && parsedVideos.length > 0) {
      const startTag = settings3?.startTag || "image###";
      const endTag = settings3?.endTag || "###";
      const contents = parsedVideos.map((v) => {
        let content = v.tag;
        if (content.startsWith(startTag)) content = content.substring(startTag.length);
        if (content.endsWith(endTag)) content = content.substring(0, content.length - endTag.length);
        return content.trim();
      });
      promptResult = contents.join("\n\n");
    } else {
      promptResult = cleaned.replace(/```(?:json|yaml|xml)?/gi, "").replace(/```/g, "").trim();
    }
    if (promptResult) {
      promptResult = promptResult.replace(/《/g, "<").replace(/》/g, ">");
      promptResult = promptResult.replace(/\\n/g, "\n");
    }
    return promptResult;
  }
  async function handleLlmImg2VidPromptGen() {
    const $btn = $("#runninghub_test_llm_img2vid_btn");
    const origHtml = $btn.html();
    const userDemand = (document.getElementById("runninghub_video_test_demand")?.value || settings3.runninghub_video_test_demand || "").trim();
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u751F\u6210\u4E2D...');
    try {
      const img1Ctrl = document.getElementById("runninghub_img_ctrl_1")?.value || settings3.runninghub_img_ctrl_1 || "bypass";
      const isImg1Muted = img1Ctrl === "mute";
      let compressedImg1 = null;
      let img1Desc = "";
      if (!isImg1Muted) {
        const img1Source = sessionUploadedMedia.imgFiles?.[1] || document.getElementById("runninghub_file_img_1")?.files?.[0] || document.getElementById("runninghub_preview_img_1");
        const hasImg1 = Boolean(
          sessionUploadedMedia.imgFiles?.[1] || document.getElementById("runninghub_file_img_1")?.files?.[0] || document.getElementById("runninghub_preview_img_1")?.getAttribute("src") && !document.getElementById("runninghub_preview_img_1")?.getAttribute("src")?.endsWith("/")
        );
        img1Desc = (document.getElementById("runninghub_img_desc_1")?.value || settings3.runninghub_img_desc_1 || "").trim();
        compressedImg1 = await compressImageSource(img1Source, 768, 0.8);
        if (!compressedImg1) {
          if (hasImg1) {
            toastr.warning("\u8B66\u544A\uFF1A\u56FE\u7247 1 \u8BFB\u53D6\u6216\u538B\u7F29\u5931\u8D25\uFF0C\u5C06\u4EC5\u4EE5\u6587\u5B57\u65B9\u5F0F\u8BF7\u6C42 LLM");
          } else {
            toastr.info("\u63D0\u793A\uFF1A\u56FE\u7247 1 \u672A\u4E0A\u4F20\uFF0C\u5C06\u4EE5\u7EAF\u9700\u6C42\u6587\u672C\u65B9\u5F0F\u751F\u6210\u63D0\u793A\u8BCD");
          }
        }
      } else {
        toastr.info("\u63D0\u793A\uFF1A\u56FE\u7247 1 \u5F53\u524D\u8BBE\u7F6E\u4E3A\u505C\u7528 (Mute)\uFF0C\u5DF2\u8DF3\u8FC7\u4F5C\u4E3A\u53C2\u8003\u9644\u4EF6");
      }
      let prompt2 = buildPromptForRequestType("video_gen", userDemand || "");
      if (!prompt2 || prompt2.length === 0) {
        throw new Error("\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D\u300C\u56FE\u751F\u89C6\u9891\u300D\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E");
      }
      prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("video_gen"));
      const duration = document.getElementById("runninghub_val_duration")?.value || settings3.runninghub_val_duration || "4";
      const contextData = {
        context: "",
        body: "\u5267\u60C5\u548C\u53D1\u5C55\u8BF7\u4F9D\u7167\u7528\u6237\u9700\u6C42",
        userDemand,
        duration,
        variables: /* @__PURE__ */ new Map(),
        characterListText: "",
        outfitEnableListText: "",
        commonCharacterListText: ""
      };
      const { messages: processedMessages } = await replaceAllPlaceholders(prompt2, contextData);
      prompt2 = processedMessages;
      const userMsgIdx = findUserDemandMessageIndex2(prompt2);
      if (userMsgIdx >= 0) {
        if (compressedImg1) {
          prompt2 = attachImagesToMessage9(prompt2, userMsgIdx, [{
            base64: compressedImg1,
            name: "<Picture 1>",
            description: img1Desc
          }], "Picture");
        } else if (img1Desc) {
          const descNote = `
<Picture 1>
\u7B80\u4ECB: ${img1Desc}`;
          const targetMsg = prompt2[userMsgIdx];
          if (typeof targetMsg.content === "string") {
            targetMsg.content += descNote;
          } else if (Array.isArray(targetMsg.content)) {
            targetMsg.content.push({ type: "text", text: descNote });
          }
        }
      }
      toastr.info("\u{1F3AC} \u6B63\u5728\u8BF7\u6C42 LLM \u751F\u6210\u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD...");
      const llmResponse = await LLM_VIDEO_GEN(prompt2, { timeoutMs: 6e5 });
      if (llmResponse.testMode) {
        toastr.info("LLM \u6D4B\u8BD5\u6A21\u5F0F\u54CD\u5E94\u6210\u529F");
        return;
      }
      const finalPrompt = extractVideoPromptFromLLMResponse(llmResponse.result);
      if (!finalPrompt) {
        toastr.warning("\u672A\u80FD\u4ECE LLM \u8FD4\u56DE\u4E2D\u89E3\u6790\u51FA\u6709\u6548\u7684\u89C6\u9891\u63D0\u793A\u8BCD");
        return;
      }
      const promptEl = document.getElementById("runninghub_video_test_prompt");
      if (promptEl) {
        promptEl.value = finalPrompt;
        $(promptEl).trigger("input");
      }
      settings3.runninghub_video_test_prompt = finalPrompt;
      saveSettingsDebounced();
      toastr.success("\u{1F3AC} \u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD\u751F\u6210\u6210\u529F\u5E76\u5DF2\u586B\u5165\u6D4B\u8BD5\u6846\uFF01");
    } catch (err) {
      console.error("[RunningHubVideoTest] \u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25:", err);
      toastr.error("\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25: " + (err.message || err));
    } finally {
      $btn.prop("disabled", false).html(origHtml);
    }
  }
  async function handleLlmRef2VidPromptGen() {
    const $btn = $("#runninghub_test_llm_ref2vid_btn");
    const origHtml = $btn.html();
    const userDemand = (document.getElementById("runninghub_video_test_demand")?.value || settings3.runninghub_video_test_demand || "").trim();
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u751F\u6210\u4E2D...');
    try {
      const collectedImages = [];
      const textOnlyImageDescs = [];
      const failedImageIndices = [];
      for (let i = 1; i <= 9; i++) {
        const ctrlMode = document.getElementById(`runninghub_img_ctrl_${i}`)?.value || settings3[`runninghub_img_ctrl_${i}`] || "bypass";
        if (ctrlMode === "mute") {
          continue;
        }
        const imgSource = sessionUploadedMedia.imgFiles?.[i] || document.getElementById(`runninghub_file_img_${i}`)?.files?.[0] || document.getElementById(`runninghub_preview_img_${i}`);
        const hasImgSource = Boolean(
          sessionUploadedMedia.imgFiles?.[i] || document.getElementById(`runninghub_file_img_${i}`)?.files?.[0] || document.getElementById(`runninghub_preview_img_${i}`)?.getAttribute("src") && !document.getElementById(`runninghub_preview_img_${i}`)?.getAttribute("src")?.endsWith("/")
        );
        const desc = (document.getElementById(`runninghub_img_desc_${i}`)?.value || settings3[`runninghub_img_desc_${i}`] || "").trim();
        const compressed = await compressImageSource(imgSource, 512, 0.8);
        if (compressed) {
          collectedImages.push({
            base64: compressed,
            name: `<Picture ${i}>`,
            description: desc
          });
        } else {
          if (hasImgSource) {
            failedImageIndices.push(i);
          }
          if (desc) {
            textOnlyImageDescs.push({ index: i, description: desc });
          }
        }
      }
      if (failedImageIndices.length > 0) {
        console.warn(`[RunningHub] \u56FE\u7247 ${failedImageIndices.join(", ")} \u8BFB\u53D6\u6216\u538B\u7F29\u5931\u8D25\uFF0C\u672A\u80FD\u4F5C\u4E3A\u591A\u6A21\u6001\u9644\u4EF6\u53D1\u9001`);
        if (window.toastr) {
          toastr.warning(`\u56FE\u7247 ${failedImageIndices.join(", ")} \u8BFB\u53D6\u6216\u538B\u7F29\u5931\u8D25\uFF0C\u5DF2\u8F6C\u4E3A\u4EC5\u6587\u5B57\u8BF4\u660E\u6216\u8DF3\u8FC7`);
        }
      }
      const collectedAudios = [];
      for (let i = 1; i <= 3; i++) {
        const ctrlMode = document.getElementById(`runninghub_aud_ctrl_${i}`)?.value || settings3[`runninghub_aud_ctrl_${i}`] || "bypass";
        if (ctrlMode === "mute") {
          continue;
        }
        const audMeta = await getAudioMetadata(i);
        const desc = (document.getElementById(`runninghub_aud_desc_${i}`)?.value || settings3[`runninghub_aud_desc_${i}`] || "").trim();
        if (audMeta.hasAudio || desc) {
          collectedAudios.push({
            ...audMeta,
            index: i,
            description: desc
          });
        }
      }
      let prompt2 = buildPromptForRequestType("visual_mat_prep", userDemand || "");
      if (!prompt2 || prompt2.length === 0) {
        throw new Error("\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D\u300C\u89C6\u6750\u51C6\u5907\u300D\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E");
      }
      prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("visual_mat_prep"));
      const duration = document.getElementById("runninghub_val_duration")?.value || settings3.runninghub_val_duration || "4";
      const contextData = {
        context: "",
        body: "\u5267\u60C5\u548C\u53D1\u5C55\u8BF7\u4F9D\u7167\u7528\u6237\u9700\u6C42",
        userDemand,
        duration,
        variables: /* @__PURE__ */ new Map(),
        characterListText: "",
        outfitEnableListText: "",
        commonCharacterListText: ""
      };
      const { messages: processedMessages } = await replaceAllPlaceholders(prompt2, contextData);
      prompt2 = processedMessages;
      const userMsgIdx = findUserDemandMessageIndex2(prompt2);
      if (userMsgIdx >= 0) {
        if (collectedImages.length > 0) {
          prompt2 = attachImagesToMessage9(prompt2, userMsgIdx, collectedImages, "Picture");
        }
        if (textOnlyImageDescs.length > 0) {
          const textImgLines = textOnlyImageDescs.map((d) => `- <Picture ${d.index}> \u63CF\u8FF0/\u9700\u6C42: ${d.description}`).join("\n");
          const textImgNote = `
[\u53C2\u8003\u56FE\u7247\u6587\u672C\u8BF4\u660E]
${textImgLines}`;
          const targetMsg = prompt2[userMsgIdx];
          if (typeof targetMsg.content === "string") {
            targetMsg.content += textImgNote;
          } else if (Array.isArray(targetMsg.content)) {
            targetMsg.content.push({ type: "text", text: textImgNote });
          }
        }
        if (collectedAudios.length > 0) {
          const audioDescLines = collectedAudios.map((a) => {
            let line = `- <Audio ${a.index}>: `;
            if (a.hasAudio) {
              line += `${a.fileName} (\u65F6\u957F: ${a.durationStr})`;
            } else {
              line += `(\u672A\u4E0A\u4F20\u97F3\u9891\u6587\u4EF6)`;
            }
            if (a.description) {
              line += ` \u7B80\u4ECB/\u8981\u6C42: ${a.description}`;
            }
            return line;
          }).join("\n");
          const audioNote = `
[\u5DF2\u63D0\u4F9B\u53C2\u8003\u97F3\u9891\u4FE1\u606F]
${audioDescLines}
\u8BF7\u4F9D\u636E\u4E0A\u8FF0\u97F3\u9891\u8282\u594F\u4E0E\u65F6\u957F\u7EA6\u675F\u8BBE\u8BA1\u5206\u955C\u4E0E\u753B\u9762\u52A8\u4F5C\u3002`;
          const targetMsg = prompt2[userMsgIdx];
          if (typeof targetMsg.content === "string") {
            targetMsg.content += audioNote;
          } else if (Array.isArray(targetMsg.content)) {
            targetMsg.content.push({ type: "text", text: audioNote });
          }
        }
      }
      toastr.info(`\u{1F3AC} \u6B63\u5728\u8BF7\u6C42 LLM (\u5DF2\u9644\u5E26 ${collectedImages.length} \u5F20\u56FE\u7247\u53CA ${collectedAudios.length} \u6761\u97F3\u9891\u53C2\u8003)...`);
      const llmResponse = await LLM_VISUAL_MAT_PREP(prompt2, { timeoutMs: 6e5 });
      if (llmResponse.testMode) {
        toastr.info("LLM \u6D4B\u8BD5\u6A21\u5F0F\u54CD\u5E94\u6210\u529F");
        return;
      }
      const finalPrompt = extractVideoPromptFromLLMResponse(llmResponse.result);
      if (!finalPrompt) {
        toastr.warning("\u672A\u80FD\u4ECE LLM \u8FD4\u56DE\u4E2D\u89E3\u6790\u51FA\u6709\u6548\u7684\u89C6\u9891\u63D0\u793A\u8BCD");
        return;
      }
      const promptEl = document.getElementById("runninghub_video_test_prompt");
      if (promptEl) {
        promptEl.value = finalPrompt;
        $(promptEl).trigger("input");
      }
      settings3.runninghub_video_test_prompt = finalPrompt;
      saveSettingsDebounced();
      toastr.success("\u{1F3AC} \u89C6\u6750\u51C6\u5907\u63D0\u793A\u8BCD\u751F\u6210\u6210\u529F\u5E76\u5DF2\u586B\u5165\u6D4B\u8BD5\u6846\uFF01");
    } catch (err) {
      console.error("[RunningHubVideoTest] \u53C2\u8003\u751F\u89C6\u9891\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25:", err);
      toastr.error("\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25: " + (err.message || err));
    } finally {
      $btn.prop("disabled", false).html(origHtml);
    }
  }
  $("#runninghub_test_llm_img2vid_btn").off("click.rh_llm_img2vid").on("click.rh_llm_img2vid", handleLlmImg2VidPromptGen);
  $("#runninghub_test_llm_ref2vid_btn").off("click.rh_llm_ref2vid").on("click.rh_llm_ref2vid", handleLlmRef2VidPromptGen);
}

export { RUNNINGHUB_PLACEHOLDER_MAP, initRunningHubUI, isBase64Image, isImageId, setupImageUpload, updateImageUI };
