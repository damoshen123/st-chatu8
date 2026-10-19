// 还原自打包产物 — 原始模块: utils/settings/vibeTransferGenerator.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { deleteConfigImage, getConfigImage, getConfigText, saveConfigImage, saveConfigText } from "../configDatabase.js";
import { getNovelAICandidateUrls, postNovelAIWithFallback } from "../novelai.js";
import { getVibeStorageOptions } from "./vibeStorageMigration.js";
import { FIXED_ENCODING_KEY } from "./charRefGroupEditor.js";
import "../utils.js"; // init_utils

var NOVELAI_MODEL_PARAM_KEYS, OFFICIAL_NOVELAI_MODEL_DEFAULTS, lastSelectedNovelaiModel;

var OFFICIAL_NOVELAI_MODEL_DEFAULTS = {
  "nai-diffusion-5-full": {
    novelai_sampler: "k_euler_ancestral",
    Schedule: "karras",
    nai3Scale: 7,
    cfg_rescale: 0,
    novelai_steps: 23,
    novelai_width: 832,
    novelai_height: 1216,
    novelai_size: "832x1216",
    AQT_novelai: "best quality, amazing quality, very aesthetic, absurdres",
    UCP_novelai: "heavy",
    novelai_straight_alpha: false,
    novelai_v5_effort: "high",
    addFurryDataset: "false",
    AI_use_coords: true,
    sm: false,
    dyn: false,
    nai3Variety: false,
    nai3Deceisp: false
  },
  "nai-diffusion-5-curated": {
    novelai_sampler: "k_euler_ancestral",
    Schedule: "karras",
    nai3Scale: 7,
    cfg_rescale: 0,
    novelai_steps: 23,
    novelai_width: 832,
    novelai_height: 1216,
    novelai_size: "832x1216",
    AQT_novelai: "best quality, amazing quality, very aesthetic, absurdres",
    UCP_novelai: "heavy",
    novelai_straight_alpha: false,
    addFurryDataset: "false",
    AI_use_coords: true,
    sm: false,
    dyn: false,
    nai3Variety: false,
    nai3Deceisp: false
  },
  "nai-diffusion-4-5-full": {
    novelai_sampler: "k_euler",
    Schedule: "karras",
    nai3Scale: 5,
    cfg_rescale: 0,
    novelai_steps: 23,
    novelai_width: 832,
    novelai_height: 1216,
    novelai_size: "832x1216",
    AQT_novelai: "best quality, amazing quality, very aesthetic, absurdres",
    UCP_novelai: "Heavy",
    novelai_straight_alpha: false,
    addFurryDataset: "false",
    AI_use_coords: true,
    sm: false,
    dyn: false,
    nai3Variety: false,
    nai3Deceisp: false
  },
  "nai-diffusion-4-5-curated": {
    novelai_sampler: "k_euler",
    Schedule: "karras",
    nai3Scale: 5,
    cfg_rescale: 0,
    novelai_steps: 23,
    novelai_width: 832,
    novelai_height: 1216,
    novelai_size: "832x1216",
    AQT_novelai: "best quality, amazing quality, very aesthetic, absurdres",
    UCP_novelai: "Heavy",
    novelai_straight_alpha: false,
    addFurryDataset: "false",
    AI_use_coords: true,
    sm: false,
    dyn: false,
    nai3Variety: false,
    nai3Deceisp: false
  },
  "nai-diffusion-4-full": {
    novelai_sampler: "k_euler",
    Schedule: "karras",
    nai3Scale: 6,
    cfg_rescale: 0,
    novelai_steps: 23,
    novelai_width: 832,
    novelai_height: 1216,
    novelai_size: "832x1216",
    AQT_novelai: "best quality, amazing quality, very aesthetic, absurdres",
    UCP_novelai: "Heavy",
    novelai_straight_alpha: false,
    addFurryDataset: "false",
    AI_use_coords: true,
    sm: false,
    dyn: false,
    nai3Variety: false,
    nai3Deceisp: false
  },
  "nai-diffusion-4-curated-preview": {
    novelai_sampler: "k_euler",
    Schedule: "karras",
    nai3Scale: 6,
    cfg_rescale: 0,
    novelai_steps: 23,
    novelai_width: 832,
    novelai_height: 1216,
    novelai_size: "832x1216",
    AQT_novelai: "best quality, amazing quality, very aesthetic, absurdres",
    UCP_novelai: "Heavy",
    novelai_straight_alpha: false,
    addFurryDataset: "false",
    AI_use_coords: true,
    sm: false,
    dyn: false,
    nai3Variety: false,
    nai3Deceisp: false
  },
  "nai-diffusion-3": {
    novelai_sampler: "k_euler",
    Schedule: "native",
    nai3Scale: 5,
    cfg_rescale: 0,
    novelai_steps: 28,
    novelai_width: 832,
    novelai_height: 1216,
    novelai_size: "832x1216",
    AQT_novelai: "best quality, amazing quality, very aesthetic, absurdres",
    UCP_novelai: "Heavy",
    novelai_straight_alpha: false,
    addFurryDataset: "false",
    AI_use_coords: true,
    sm: true,
    dyn: false,
    nai3Variety: false,
    nai3Deceisp: false
  }
};

var NOVELAI_MODEL_PARAM_KEYS = [
  "novelai_sampler",
  "Schedule",
  "nai3Scale",
  "cfg_rescale",
  "novelai_steps",
  "novelai_width",
  "novelai_height",
  "novelai_size",
  "AQT_novelai",
  "UCP_novelai",
  "novelai_straight_alpha",
  "novelai_v5_effort",
  "addFurryDataset",
  "AI_use_coords",
  "sm",
  "dyn",
  "nai3Variety",
  "nai3Deceisp"
];

var lastSelectedNovelaiModel = null;
async function sha256(message) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      console.warn("[Vibe] crypto.subtle \u4E0D\u53EF\u7528\uFF0C\u4F7F\u7528\u56DE\u9000\u65B9\u6848:", error);
    }
  }
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2);
  const hashHex = Math.abs(hash).toString(16).padStart(8, "0");
  const combined = (timestamp + random + hashHex + message.substring(0, 20)).replace(/[^0-9a-f]/g, "0");
  return combined.padEnd(64, "0").substring(0, 64);
}

function uint8ArrayToBase643(uint8Array) {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function base64ToUint8Array2(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function generateThumbnail(imageBase64, format = "png") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 256;
      const scale = maxDim / Math.max(img.width, img.height);
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve(thumbnailDataUrl);
    };
    img.onerror = reject;
    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    img.src = imageBase64.startsWith("data:") ? imageBase64 : `data:${mimeType};base64,${imageBase64}`;
  });
}

function getModelKey(modelName) {
  if (modelName.includes("4-5-curated")) return "v4-5curated";
  if (modelName.includes("4-5-full")) return "v4-5full";
  if (modelName.includes("4-curated")) return "v4curated";
  if (modelName.includes("4-full")) return "v4full";
  return modelName;
}

async function buildVibeJson(imageBase64, vibeBase64, model, extractVal, strengthVal, format = "png") {
  const mainId = await sha256(imageBase64);
  const modelKey = getModelKey(model);
  const thumbnailDataUrl = await generateThumbnail(imageBase64, format);
  return {
    "identifier": "novelai-vibe-transfer",
    "version": 1,
    "type": "image",
    "image": imageBase64,
    "id": mainId,
    "encodings": {
      [modelKey]: {
        [FIXED_ENCODING_KEY]: {
          "encoding": vibeBase64,
          "params": {
            "information_extracted": extractVal
          }
        }
      }
    },
    "name": mainId.slice(0, 6) + "-" + mainId.slice(-6),
    "thumbnail": thumbnailDataUrl,
    "createdAt": Date.now(),
    "importInfo": {
      "model": model,
      "information_extracted": extractVal,
      "strength": strengthVal
    }
  };
}

function ensureVibePresets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.vibePresets) {
    settings3.vibePresets = {
      "\u9ED8\u8BA4": {
        model: "nai-diffusion-4-5-full",
        infoExtract: 1,
        strength: 0.6,
        imageId: null,
        vibeDataId: null
      }
    };
  }
  if (!settings3.vibePresetId) {
    settings3.vibePresetId = "\u9ED8\u8BA4";
  }
  return settings3.vibePresets;
}

function showVibeGeneratorDialog() {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const settings3 = extension_settings[extensionName];
  ensureVibePresets();
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-vibe-generator-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>Vibe \u6587\u4EF6\u751F\u6210\u5668 (.naiv4vibe)</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-body" style="padding: 2rem;">
                <div class="st-chatu8-vibe-generator-content">
                    <!-- \u9884\u8BBE\u9009\u62E9\u5668 -->
                    <div class="st-chatu8-field" style="margin-bottom: 1.2rem;">
                        <label for="vibe-preset-select">\u6C1B\u56F4\u8F6C\u79FB\u9884\u8BBE</label>
                        <div class="st-chatu8-profile-controls">
                            <select id="vibe-preset-select" class="st-chatu8-select"></select>
                            <button class="st-chatu8-icon-btn" id="vibe-preset-new" title="\u65B0\u5EFA\u9884\u8BBE">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-preset-save" title="\u4FDD\u5B58\u5F53\u524D\u9884\u8BBE">
                                <i class="fa-solid fa-save"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-preset-export-current" title="\u5BFC\u51FA\u5F53\u524D\u9884\u8BBE">
                                <i class="fa-solid fa-upload"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-preset-export-all" title="\u5BFC\u51FA\u5168\u90E8\u9884\u8BBE">
                                <i class="fa-solid fa-file-export"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-preset-import" title="\u5BFC\u5165\u9884\u8BBE">
                                <i class="fa-solid fa-download"></i>
                            </button>
                            <button class="st-chatu8-icon-btn danger" id="vibe-preset-delete" title="\u5220\u9664\u5F53\u524D\u9884\u8BBE">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- \u56FE\u7247\u9884\u89C8 -->
                    <div class="st-chatu8-field-col" style="margin-bottom: 1.2rem;">
                        <label>\u53C2\u8003\u56FE\u7247\u9884\u89C8</label>
                        <div class="st-chatu8-image-preview-container" id="vibe-image-preview-container">
                            <div class="st-chatu8-image-placeholder">
                                <i class="fa-solid fa-image"></i>
                                <span>\u6CA1\u6709\u9009\u62E9\u56FE\u7247</span>
                            </div>
                            <img id="vibe-preview-image" src="" alt="\u53C2\u8003\u56FE\u9884\u89C8" style="display: none;">
                        </div>
                        <div class="st-chatu8-image-controls" style="margin-top: 0.5rem;">
                            <input type="file" id="vibe-image-input" accept="image/png, image/jpeg, image/webp" style="display:none;">
                            <input type="file" id="vibe-file-input" accept=".naiv4vibe" style="display:none;">
                            <button type="button" class="st-chatu8-btn" id="vibe-select-image-btn">
                                <i class="fa-solid fa-upload"></i> \u9009\u62E9\u56FE\u7247
                            </button>
                            <button type="button" class="st-chatu8-btn" id="vibe-upload-file-btn">
                                <i class="fa-solid fa-file-import"></i> \u4E0A\u4F20 Vibe \u6587\u4EF6
                            </button>
                            <button type="button" class="st-chatu8-btn danger" id="vibe-remove-image-btn" style="display: none;">
                                <i class="fa-solid fa-trash"></i> \u79FB\u9664\u56FE\u7247
                            </button>
                        </div>
                    </div>

                    <div class="st-chatu8-field" style="margin-bottom: 1.2rem;">
                        <label for="vibe-model-select">\u6A21\u578B (Model)</label>
                        <select id="vibe-model-select" class="st-chatu8-select">
                            <option value="nai-diffusion-4-5-full">V4.5 Full</option>
                            <option value="nai-diffusion-4-5-curated">V4.5 Curated</option>
                            <option value="nai-diffusion-4-full">V4 Full</option>
                            <option value="nai-diffusion-4-curated">V4 Curated</option>
                        </select>
                    </div>
                    
                    <div class="st-chatu8-field" style="margin-bottom: 1.5rem;">
                        <label for="vibe-strength-ref">\u9ED8\u8BA4\u53C2\u8003\u5F3A\u5EA6: <span id="vibe-strength-val">0.6</span></label>
                        <div class="st-chatu8-range-container">
                            <input type="range" id="vibe-strength-ref" class="st-chatu8-range-slider" min="0" max="1" step="0.01" value="0.6">
                            <input type="number" id="vibe-strength-ref-num" class="st-chatu8-range-input" min="0" max="1" step="0.01" value="0.6">
                        </div>
                    </div>

                    <button type="button" class="st-chatu8-btn" id="vibe-submit-btn" style="width: 100%; padding: 1rem; font-size: 16px; font-weight: 600;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> \u751F\u6210\u5E76\u4FDD\u5B58\u5230\u9884\u8BBE
                    </button>
                    
                    <button type="button" class="st-chatu8-btn" id="vibe-download-btn" style="width: 100%; padding: 1rem; font-size: 16px; font-weight: 600; margin-top: 0.5rem; background: #000; border: 1px solid #333;" title="\u8BF7\u5148\u751F\u6210\u6216\u4E0A\u4F20 Vibe \u6570\u636E">
                        <i class="fa-solid fa-circle-exclamation"></i> \u8BF7\u5148\u751F\u6210\u6216\u4E0A\u4F20 Vibe \u6570\u636E
                    </button>
                    
                    <div id="vibe-status" style="margin-top: 1.5rem; padding: 1rem; border-radius: 6px; font-size: 0.9rem; display: none; line-height: 1.4;"></div>
                </div>
            </div>
        </div>
    `;
  parent.appendChild(backdrop);
  const closeBtn = backdrop.querySelector(".st-chatu8-workflow-viz-close");
  closeBtn.onclick = () => parent.removeChild(backdrop);
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      parent.removeChild(backdrop);
    }
  };
  const presetSelect = document.getElementById("vibe-preset-select");
  const modelSelect2 = document.getElementById("vibe-model-select");
  const imageInput = document.getElementById("vibe-image-input");
  const previewImage = document.getElementById("vibe-preview-image");
  const previewContainer = document.getElementById("vibe-image-preview-container");
  const selectImageBtn = document.getElementById("vibe-select-image-btn");
  const removeImageBtn = document.getElementById("vibe-remove-image-btn");
  const strengthRange = document.getElementById("vibe-strength-ref");
  const strengthNum = document.getElementById("vibe-strength-ref-num");
  const submitBtn = document.getElementById("vibe-submit-btn");
  const downloadBtn = document.getElementById("vibe-download-btn");
  const statusDiv = document.getElementById("vibe-status");
  const newBtn = document.getElementById("vibe-preset-new");
  const saveBtn = document.getElementById("vibe-preset-save");
  const deleteBtn = document.getElementById("vibe-preset-delete");
  const exportCurrentBtn = document.getElementById("vibe-preset-export-current");
  const exportAllBtn = document.getElementById("vibe-preset-export-all");
  const importBtn = document.getElementById("vibe-preset-import");
  const uploadFileBtn = document.getElementById("vibe-upload-file-btn");
  const vibeFileInput = document.getElementById("vibe-file-input");
  let selectedFile = null;
  let currentImageId = null;
  let currentVibeDataId = null;
  function loadPresetList() {
    presetSelect.innerHTML = "";
    const presets = settings3.vibePresets;
    const sortedKeys = Object.keys(presets).sort((a, b) => a.localeCompare(b, "zh-CN"));
    for (const key of sortedKeys) {
      const option = new Option(key, key);
      presetSelect.add(option);
    }
    presetSelect.value = settings3.vibePresetId;
  }
  function updateDownloadButtonState() {
    if (currentVibeDataId) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> \u4E0B\u8F7D Vibe \u6587\u4EF6 \u2713';
      downloadBtn.title = "\u70B9\u51FB\u4E0B\u8F7D\u5DF2\u4FDD\u5B58\u7684 Vibe \u6587\u4EF6";
      downloadBtn.style.opacity = "1";
      downloadBtn.style.cursor = "pointer";
      downloadBtn.style.background = "";
      downloadBtn.style.border = "";
    } else {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> \u8BF7\u5148\u751F\u6210\u6216\u4E0A\u4F20 Vibe \u6570\u636E';
      downloadBtn.title = '\u8BF7\u5148\u70B9\u51FB"\u751F\u6210\u5E76\u4FDD\u5B58\u5230\u9884\u8BBE"\u751F\u6210 Vibe \u6570\u636E\uFF0C\u6216\u4E0A\u4F20\u73B0\u6709\u7684 Vibe \u6587\u4EF6';
      downloadBtn.style.opacity = "1";
      downloadBtn.style.cursor = "not-allowed";
      downloadBtn.style.background = "#000";
      downloadBtn.style.border = "1px solid #333";
    }
  }
  function showImagePreview2(src, showRemoveButton = true) {
    previewImage.src = src;
    previewImage.style.display = "block";
    previewContainer.querySelector(".st-chatu8-image-placeholder").style.display = "none";
    removeImageBtn.style.display = showRemoveButton ? "inline-block" : "none";
  }
  async function loadCurrentPreset() {
    const presetId = presetSelect.value;
    const preset = settings3.vibePresets[presetId];
    if (!preset) return;
    modelSelect2.value = preset.model || "nai-diffusion-4-5-full";
    strengthRange.value = preset.strength ?? 0.6;
    strengthNum.value = preset.strength ?? 0.6;
    document.getElementById("vibe-strength-val").textContent = preset.strength ?? 0.6;
    currentImageId = preset.imageId;
    currentVibeDataId = preset.vibeDataId || null;
    if (currentImageId) {
      try {
        const imageData = await getConfigImage(currentImageId);
        if (imageData) {
          showImagePreview2(imageData);
        } else if (preset.thumbnail) {
          showImagePreview2(preset.thumbnail, false);
        } else {
          resetImagePreview({ clearVibeData: false });
        }
      } catch (error) {
        console.error("[Vibe] \u52A0\u8F7D\u56FE\u7247\u9884\u89C8\u5931\u8D25:", error);
        if (preset.thumbnail) {
          showImagePreview2(preset.thumbnail, false);
        } else {
          resetImagePreview({ clearVibeData: false });
        }
      }
    } else if (preset.thumbnail) {
      showImagePreview2(preset.thumbnail, false);
    } else {
      resetImagePreview({ clearVibeData: false });
    }
    updateDownloadButtonState();
  }
  function resetImagePreview(options = {}) {
    const { clearVibeData = true } = options;
    selectedFile = null;
    currentImageId = null;
    if (clearVibeData) currentVibeDataId = null;
    imageInput.value = "";
    previewImage.src = "";
    previewImage.style.display = "none";
    previewContainer.querySelector(".st-chatu8-image-placeholder").style.display = "flex";
    removeImageBtn.style.display = "none";
  }
  loadPresetList();
  loadCurrentPreset();
  presetSelect.onchange = () => {
    settings3.vibePresetId = presetSelect.value;
    saveSettingsDebounced();
    loadCurrentPreset();
  };
  strengthRange.oninput = (e) => {
    strengthNum.value = e.target.value;
    document.getElementById("vibe-strength-val").textContent = e.target.value;
  };
  strengthNum.oninput = (e) => {
    strengthRange.value = e.target.value;
    document.getElementById("vibe-strength-val").textContent = e.target.value;
  };
  selectImageBtn.onclick = () => imageInput.click();
  imageInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const presetId = presetSelect.value;
    if (presetId === "\u9ED8\u8BA4") {
      alert('\u8BF7\u5148"\u65B0\u5EFA"\u4E00\u4E2A\u65B0\u9884\u8BBE\uFF0C\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u53EF\u4FEE\u6539\u3002');
      imageInput.value = "";
      return;
    }
    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      if (currentImageId) {
        await deleteConfigImage(currentImageId);
      }
      const newImageId = await saveConfigImage(imageData, {
        format: file.type.split("/")[1] || "png",
        filename: `vibe_${presetId}_preview`,
        ...getVibeStorageOptions()
      });
      currentImageId = newImageId;
      selectedFile = null;
      settings3.vibePresets[presetId].imageId = newImageId;
      settings3.vibePresets[presetId].thumbnail = null;
      saveSettingsDebounced();
      previewImage.src = imageData;
      previewImage.style.display = "block";
      previewContainer.querySelector(".st-chatu8-image-placeholder").style.display = "none";
      removeImageBtn.style.display = "inline-block";
      showStatus3("\u56FE\u7247\u5DF2\u81EA\u52A8\u4FDD\u5B58\uFF01", "success");
    } catch (error) {
      console.error("[Vibe] \u4FDD\u5B58\u56FE\u7247\u5931\u8D25:", error);
      showStatus3("\u4FDD\u5B58\u56FE\u7247\u5931\u8D25: " + error.message, "error");
    }
  };
  removeImageBtn.onclick = async () => {
    if (currentImageId) {
      try {
        await deleteConfigImage(currentImageId);
        const presetId = presetSelect.value;
        settings3.vibePresets[presetId].imageId = null;
        saveSettingsDebounced();
      } catch (error) {
        console.error("[Vibe] \u5220\u9664\u56FE\u7247\u5931\u8D25:", error);
      }
    }
    resetImagePreview();
  };
  saveBtn.onclick = async () => {
    const presetId = presetSelect.value;
    if (!presetId || presetId === "\u9ED8\u8BA4") {
      alert('\u8BF7\u5148"\u65B0\u5EFA"\u4E00\u4E2A\u65B0\u9884\u8BBE\uFF0C\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u53EF\u4FEE\u6539\u3002');
      return;
    }
    try {
      settings3.vibePresets[presetId] = {
        model: modelSelect2.value,
        infoExtract: 1,
        strength: parseFloat(strengthRange.value),
        imageId: currentImageId,
        vibeDataId: currentVibeDataId,
        thumbnail: settings3.vibePresets[presetId]?.thumbnail || null
      };
      saveSettingsDebounced();
      showStatus3("\u9884\u8BBE\u5DF2\u4FDD\u5B58\uFF01", "success");
    } catch (error) {
      console.error("[Vibe] \u4FDD\u5B58\u9884\u8BBE\u5931\u8D25:", error);
      showStatus3("\u4FDD\u5B58\u5931\u8D25: " + error.message, "error");
    }
  };
  newBtn.onclick = async () => {
    const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u9884\u8BBE\u540D\u79F0:");
    if (!newName) return;
    if (settings3.vibePresets[newName]) {
      alert("\u8BE5\u9884\u8BBE\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002");
      return;
    }
    try {
      settings3.vibePresets[newName] = {
        model: "nai-diffusion-4-5-full",
        infoExtract: 1,
        strength: 0.6,
        imageId: null,
        vibeDataId: null,
        thumbnail: null
      };
      settings3.vibePresetId = newName;
      saveSettingsDebounced();
      loadPresetList();
      loadCurrentPreset();
      showStatus3("\u65B0\u9884\u8BBE\u5DF2\u521B\u5EFA\uFF01", "success");
    } catch (error) {
      console.error("[Vibe] \u521B\u5EFA\u9884\u8BBE\u5931\u8D25:", error);
      showStatus3("\u521B\u5EFA\u5931\u8D25: " + error.message, "error");
    }
  };
  deleteBtn.onclick = async () => {
    const presetId = presetSelect.value;
    if (presetId === "\u9ED8\u8BA4") {
      alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u53EF\u5220\u9664\u3002");
      return;
    }
    if (!confirm(`\u786E\u5B9A\u8981\u5220\u9664\u9884\u8BBE "${presetId}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF01`)) return;
    try {
      const preset = settings3.vibePresets[presetId];
      if (preset) {
        if (preset.imageId) await deleteConfigImage(preset.imageId);
        if (preset.vibeDataId) await deleteConfigImage(preset.vibeDataId);
      }
      delete settings3.vibePresets[presetId];
      settings3.vibePresetId = "\u9ED8\u8BA4";
      saveSettingsDebounced();
      loadPresetList();
      loadCurrentPreset();
      showStatus3("\u9884\u8BBE\u5DF2\u5220\u9664\uFF01", "success");
    } catch (error) {
      console.error("[Vibe] \u5220\u9664\u9884\u8BBE\u5931\u8D25:", error);
      showStatus3("\u5220\u9664\u5931\u8D25: " + error.message, "error");
    }
  };
  exportCurrentBtn.onclick = async () => {
    const presetId = presetSelect.value;
    const preset = settings3.vibePresets[presetId];
    if (!preset) {
      alert("\u6CA1\u6709\u9009\u4E2D\u7684\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
      return;
    }
    try {
      const dataToExport = { presets: { [presetId]: preset }, images: {}, vibeData: {} };
      if (preset.imageId) {
        try {
          const imageData = await getConfigImage(preset.imageId);
          if (imageData) dataToExport.images[preset.imageId] = imageData;
        } catch (error) {
          console.error("[Vibe] \u83B7\u53D6\u56FE\u7247\u5931\u8D25:", error);
        }
      }
      if (preset.vibeDataId) {
        try {
          const vibeData = await getConfigText(preset.vibeDataId);
          if (vibeData) dataToExport.vibeData[preset.vibeDataId] = vibeData;
        } catch (error) {
          console.error("[Vibe] \u83B7\u53D6 Vibe \u6570\u636E\u5931\u8D25:", error);
        }
      }
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibe-preset-${presetId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus3("\u9884\u8BBE\u5DF2\u5BFC\u51FA\uFF01", "success");
    } catch (error) {
      console.error("[Vibe] \u5BFC\u51FA\u9884\u8BBE\u5931\u8D25:", error);
      showStatus3("\u5BFC\u51FA\u5931\u8D25: " + error.message, "error");
    }
  };
  exportAllBtn.onclick = async () => {
    if (!settings3.vibePresets || Object.keys(settings3.vibePresets).length === 0) {
      alert("\u6CA1\u6709\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
      return;
    }
    try {
      const dataToExport = { presets: settings3.vibePresets, images: {}, vibeData: {} };
      const imageIdsToExport = /* @__PURE__ */ new Set();
      const vibeDataIdsToExport = /* @__PURE__ */ new Set();
      for (const presetName in settings3.vibePresets) {
        const preset = settings3.vibePresets[presetName];
        if (preset.imageId) imageIdsToExport.add(preset.imageId);
        if (preset.vibeDataId) vibeDataIdsToExport.add(preset.vibeDataId);
      }
      for (const imageId of imageIdsToExport) {
        try {
          const imageData = await getConfigImage(imageId);
          if (imageData) dataToExport.images[imageId] = imageData;
        } catch (error) {
          console.error(`[Vibe] \u83B7\u53D6\u56FE\u7247 ${imageId} \u5931\u8D25:`, error);
        }
      }
      for (const vibeDataId of vibeDataIdsToExport) {
        try {
          const vibeData = await getConfigText(vibeDataId);
          if (vibeData) dataToExport.vibeData[vibeDataId] = vibeData;
        } catch (error) {
          console.error(`[Vibe] \u83B7\u53D6 Vibe \u6570\u636E ${vibeDataId} \u5931\u8D25:`, error);
        }
      }
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vibe-presets-all.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus3(`\u5DF2\u5BFC\u51FA ${Object.keys(settings3.vibePresets).length} \u4E2A\u9884\u8BBE\uFF01`, "success");
    } catch (error) {
      console.error("[Vibe] \u5BFC\u51FA\u5168\u90E8\u9884\u8BBE\u5931\u8D25:", error);
      showStatus3("\u5BFC\u51FA\u5931\u8D25: " + error.message, "error");
    }
  };
  importBtn.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        try {
          const importedData = JSON.parse(readerEvent.target.result);
          let presetsToImport = {};
          let imagesToImport = importedData.images || {};
          let vibeDataToImport = importedData.vibeData || {};
          if (importedData.presets) {
            presetsToImport = importedData.presets;
          } else {
            presetsToImport = importedData;
          }
          let importedCount = 0;
          let skippedCount = 0;
          for (const key in presetsToImport) {
            if (settings3.vibePresets[key]) {
              const overwrite = confirm(`\u9884\u8BBE "${key}" \u5DF2\u5B58\u5728\uFF0C\u662F\u5426\u8986\u76D6\uFF1F`);
              if (!overwrite) {
                skippedCount++;
                continue;
              }
            }
            const presetData = presetsToImport[key];
            if (presetData.imageId && imagesToImport[presetData.imageId]) {
              try {
                const newImageId = await saveConfigImage(imagesToImport[presetData.imageId], {
                  format: "png",
                  filename: `vibe_${key}_preview`,
                  ...getVibeStorageOptions()
                });
                presetData.imageId = newImageId;
              } catch (error) {
                console.error(`[Vibe] \u5BFC\u5165\u56FE\u7247\u5931\u8D25:`, error);
                presetData.imageId = null;
              }
            }
            if (presetData.vibeDataId && vibeDataToImport[presetData.vibeDataId]) {
              try {
                const importedVibeData = vibeDataToImport[presetData.vibeDataId];
                const vibeText = typeof importedVibeData === "string" ? importedVibeData : JSON.stringify(importedVibeData);
                const newVibeDataId = await saveConfigText(vibeText, {
                  filename: `vibe_${key}_data`,
                  ...getVibeStorageOptions()
                });
                presetData.vibeDataId = newVibeDataId;
              } catch (error) {
                console.error(`[Vibe] \u5BFC\u5165 Vibe \u6570\u636E\u5931\u8D25:`, error);
                presetData.vibeDataId = null;
              }
            }
            settings3.vibePresets[key] = presetData;
            importedCount++;
          }
          saveSettingsDebounced();
          loadPresetList();
          loadCurrentPreset();
          showStatus3(`\u6210\u529F\u5BFC\u5165 ${importedCount} \u4E2A\u9884\u8BBE${skippedCount > 0 ? `\uFF0C\u8DF3\u8FC7 ${skippedCount} \u4E2A` : ""}\uFF01`, "success");
        } catch (error) {
          console.error("[Vibe] \u5BFC\u5165\u9884\u8BBE\u5931\u8D25:", error);
          showStatus3("\u5BFC\u5165\u5931\u8D25: " + error.message, "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  uploadFileBtn.onclick = () => vibeFileInput.click();
  vibeFileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const presetId = presetSelect.value;
    if (presetId === "\u9ED8\u8BA4") {
      alert('\u8BF7\u5148"\u65B0\u5EFA"\u4E00\u4E2A\u65B0\u9884\u8BBE\uFF0C\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u53EF\u4FEE\u6539\u3002');
      vibeFileInput.value = "";
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        try {
          const vibeData = JSON.parse(readerEvent.target.result);
          if (vibeData.identifier !== "novelai-vibe-transfer") {
            throw new Error("\u4E0D\u662F\u6709\u6548\u7684 NovelAI Vibe \u6587\u4EF6");
          }
          if (!vibeData.encodings || Object.keys(vibeData.encodings).length === 0) {
            throw new Error("Vibe \u6587\u4EF6\u4E2D\u6CA1\u6709\u7F16\u7801\u6570\u636E");
          }
          const importInfo = vibeData.importInfo || {};
          const model = importInfo.model || "nai-diffusion-4-5-full";
          const strength = importInfo.strength ?? 0.6;
          const imageBase64 = vibeData.image;
          const thumbnailDataUrl = vibeData.thumbnail || null;
          let importedPreviewDataUrl = null;
          let shouldSavePreviewImage = false;
          const warnings = [];
          if (!imageBase64) {
            warnings.push("Vibe \u6587\u4EF6\u4E2D\u7F3A\u5C11\u9884\u89C8\u56FE\u7247\uFF08image \u5B57\u6BB5\uFF09\uFF0C\u5C06\u4EC5\u4FDD\u5B58\u7F16\u7801\u6570\u636E");
          }
          if (!vibeData.importInfo) {
            warnings.push("Vibe \u6587\u4EF6\u4E2D\u7F3A\u5C11 importInfo\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u6A21\u578B\u548C\u5F3A\u5EA6");
          }
          if (thumbnailDataUrl) {
            importedPreviewDataUrl = thumbnailDataUrl;
            showImagePreview2(thumbnailDataUrl, false);
          } else if (imageBase64) {
            importedPreviewDataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`;
            shouldSavePreviewImage = true;
            showImagePreview2(importedPreviewDataUrl);
          }
          modelSelect2.value = model;
          strengthRange.value = strength;
          strengthNum.value = strength;
          document.getElementById("vibe-strength-val").textContent = strength;
          showStatus3("\u6B63\u5728\u4FDD\u5B58 Vibe \u6570\u636E\u5230\u9884\u8BBE...", "loading");
          if (currentVibeDataId) {
            await deleteConfigImage(currentVibeDataId);
          }
          const vibeDataId = await saveConfigText(readerEvent.target.result, {
            filename: `vibe_${presetId}_uploaded`,
            ...getVibeStorageOptions()
          });
          currentVibeDataId = vibeDataId;
          if (currentImageId) {
            await deleteConfigImage(currentImageId);
            currentImageId = null;
          }
          if (shouldSavePreviewImage && importedPreviewDataUrl) {
            const previewFormat = importedPreviewDataUrl.startsWith("data:image/jpeg") ? "jpeg" : "png";
            const newImageId = await saveConfigImage(importedPreviewDataUrl, {
              format: previewFormat,
              filename: `vibe_${presetId}_preview`,
              ...getVibeStorageOptions()
            });
            currentImageId = newImageId;
          }
          selectedFile = null;
          settings3.vibePresets[presetId] = {
            model,
            infoExtract: 1,
            strength,
            imageId: currentImageId,
            vibeDataId,
            thumbnail: thumbnailDataUrl
          };
          saveSettingsDebounced();
          updateDownloadButtonState();
          if (warnings.length > 0) {
            showStatus3(`\u26A0\uFE0F Vibe \u6587\u4EF6\u5DF2\u4FDD\u5B58\uFF0C\u4F46\u5B58\u5728\u4EE5\u4E0B\u95EE\u9898\uFF1A<br>${warnings.map((w) => "\u2022 " + w).join("<br>")}`, "success");
          } else {
            showStatus3('\u2705 Vibe \u6587\u4EF6\u5DF2\u4E0A\u4F20\u5E76\u4FDD\u5B58\u5230\u9884\u8BBE\uFF01\u73B0\u5728\u53EF\u4EE5\u70B9\u51FB"\u4E0B\u8F7D Vibe \u6587\u4EF6"\u91CD\u65B0\u5BFC\u51FA\u3002', "success");
          }
        } catch (error) {
          console.error("[Vibe] \u89E3\u6790 Vibe \u6587\u4EF6\u5931\u8D25:", error);
          showStatus3("\u89E3\u6790\u5931\u8D25: " + error.message, "error");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("[Vibe] \u8BFB\u53D6 Vibe \u6587\u4EF6\u5931\u8D25:", error);
      showStatus3("\u8BFB\u53D6\u5931\u8D25: " + error.message, "error");
    }
  };
  submitBtn.onclick = async () => {
    const apiKey = (settings3.novelaiApi || "").trim();
    if (!apiKey || apiKey === "000000") {
      showStatus3("\u8BF7\u5148\u5728 NovelAI \u8BBE\u7F6E\u4E2D\u586B\u5199 API Key", "error");
      return;
    }
    let imageToProcess = null;
    if (selectedFile) {
      imageToProcess = selectedFile;
    } else if (currentImageId) {
      try {
        const imageData = await getConfigImage(currentImageId);
        if (imageData) {
          const base64Data = imageData.startsWith("data:") ? imageData.split(",")[1] : imageData;
          const byteArray = base64ToUint8Array2(base64Data);
          imageToProcess = new Blob([byteArray], { type: "image/png" });
          imageToProcess.name = "vibe_image.png";
        }
      } catch (error) {
        console.error("[Vibe] \u52A0\u8F7D\u56FE\u7247\u5931\u8D25:", error);
      }
    }
    if (!imageToProcess) {
      showStatus3("\u8BF7\u9009\u62E9\u53C2\u8003\u56FE\u7247", "error");
      return;
    }
    const model = modelSelect2.value;
    const extractVal = 1;
    const strengthVal = parseFloat(strengthRange.value);
    try {
      showStatus3("1/6 \u6B63\u5728\u8BFB\u53D6\u56FE\u7247...", "loading");
      submitBtn.disabled = true;
      const imageDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageToProcess);
      });
      showStatus3("2/6 \u6B63\u5728\u5904\u7406\u56FE\u7247...", "loading");
      const originalSize = imageToProcess.size;
      console.log(`[Vibe] \u539F\u59CB\u56FE\u7247\u5927\u5C0F: ${(originalSize / 1024).toFixed(2)} KB`);
      let processedBase64;
      processedBase64 = imageDataUrl.split(",")[1];
      console.log(`[Vibe] \u4F7F\u7528\u539F\u59CB\u56FE\u7247\uFF08\u672A\u4F18\u5316\uFF09`);
      const imageBase64 = processedBase64;
      showStatus3("3/6 \u6B63\u5728\u8BF7\u6C42 API \u7F16\u7801 Vibe...\uFF08\u9700\u8981\u51E0\u79D2\uFF09", "loading");
      const payload = {
        image: imageBase64,
        information_extracted: extractVal,
        model
      };
      if (settings3.novelaisite && settings3.novelaisite !== "\u5B98\u7F51" && settings3.client === "jiuguan") {
        throw new Error("\u9152\u9986\u7AEF\u4E0D\u652F\u6301\u81EA\u5B9A\u4E49\u7AD9\u70B9\u7684 Vibe \u7F16\u7801\uFF01");
      }
      const { candidates, rawOtherSite } = getNovelAICandidateUrls("/ai/encode-vibe");
      console.log(`[Vibe] \u7F16\u7801\u8BF7\u6C42\u5019\u9009 URLs:`, candidates);
      const response = await postNovelAIWithFallback({
        candidates,
        rawOtherSite,
        endpointPath: "/ai/encode-vibe",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        logPrefix: "[Vibe]"
      });
      const arrayBuffer = await response.arrayBuffer();
      const vibeUint8 = new Uint8Array(arrayBuffer);
      const vibeBase64 = uint8ArrayToBase643(vibeUint8);
      console.log(`[Vibe] encoding \u539F\u59CB\u5B57\u8282: ${vibeUint8.length} bytes, base64 \u957F\u5EA6: ${vibeBase64.length}`);
      if (vibeUint8.length < 100) {
        throw new Error(`encoding \u6570\u636E\u5F02\u5E38 (\u4EC5 ${vibeUint8.length} bytes)\uFF0CAPI \u53EF\u80FD\u8FD4\u56DE\u4E86\u9519\u8BEF\u54CD\u5E94`);
      }
      showStatus3("4/6 \u6B63\u5728\u6784\u5EFA Vibe JSON...", "loading");
      const imageFormat = imageToProcess.type?.split("/")[1] || "png";
      console.log(`[Vibe] \u4F7F\u7528\u56FE\u7247\u683C\u5F0F: ${imageFormat}`);
      const finalJson = await buildVibeJson(imageBase64, vibeBase64, model, extractVal, strengthVal, imageFormat);
      showStatus3("5/6 \u4FDD\u5B58\u56FE\u7247\u5230\u9884\u8BBE...", "loading");
      if (selectedFile) {
        const imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        if (currentImageId) {
          await deleteConfigImage(currentImageId);
        }
        const presetId2 = presetSelect.value;
        const newImageId = await saveConfigImage(imageData, {
          format: selectedFile.type?.split("/")[1] || "png",
          filename: `vibe_${presetId2}_preview`,
          ...getVibeStorageOptions()
        });
        currentImageId = newImageId;
        selectedFile = null;
      }
      showStatus3("6/6 \u4FDD\u5B58 Vibe \u6570\u636E\u5230\u9884\u8BBE...", "loading");
      const jsonString = JSON.stringify(finalJson);
      if (currentVibeDataId) {
        await deleteConfigImage(currentVibeDataId);
      }
      const presetId = presetSelect.value;
      const vibeDataId = await saveConfigText(jsonString, {
        filename: `vibe_${presetId}_data`,
        ...getVibeStorageOptions()
      });
      currentVibeDataId = vibeDataId;
      settings3.vibePresets[presetId] = {
        model,
        infoExtract: 1,
        strength: strengthVal,
        imageId: currentImageId,
        vibeDataId,
        thumbnail: finalJson.thumbnail || null
      };
      saveSettingsDebounced();
      updateDownloadButtonState();
      const filename = `${finalJson.name}.naiv4vibe`;
      showStatus3(`\u2705 \u5B8C\u6210\uFF01Vibe \u6570\u636E\u5DF2\u81EA\u52A8\u4FDD\u5B58\u5230\u9884\u8BBE "${presetId}"<br>\u70B9\u51FB"\u4E0B\u8F7D Vibe \u6587\u4EF6"\u53EF\u5BFC\u51FA ${filename}`, "success");
    } catch (err) {
      console.error("[Vibe] \u751F\u6210\u5931\u8D25:", err);
      showStatus3(`\u5931\u8D25: ${err.message}`, "error");
    } finally {
      submitBtn.disabled = false;
    }
  };
  downloadBtn.onclick = async () => {
    if (!currentVibeDataId) {
      showStatus3("\u6CA1\u6709\u53EF\u4E0B\u8F7D\u7684 Vibe \u6570\u636E\uFF0C\u8BF7\u5148\u751F\u6210\u3002", "error");
      return;
    }
    try {
      downloadBtn.disabled = true;
      showStatus3("\u6B63\u5728\u51C6\u5907\u4E0B\u8F7D...", "loading");
      const jsonString = await getConfigText(currentVibeDataId);
      if (!jsonString) {
        throw new Error("\u65E0\u6CD5\u8BFB\u53D6 Vibe \u6570\u636E");
      }
      const parsed = JSON.parse(jsonString);
      if (parsed.identifier !== "novelai-vibe-transfer") {
        throw new Error("\u5B58\u50A8\u7684\u6570\u636E\u4E0D\u662F\u6709\u6548\u7684 Vibe \u683C\u5F0F");
      }
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const filename = `${parsed.name || "vibe"}.naiv4vibe`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showStatus3(`\u6587\u4EF6 ${filename} \u5DF2\u4E0B\u8F7D\uFF01\u53EF\u4EE5\u76F4\u63A5\u4E0A\u4F20\u5230 NovelAI \u5B98\u7F51\u4F7F\u7528\u3002`, "success");
    } catch (err) {
      console.error("[Vibe] \u4E0B\u8F7D\u5931\u8D25:", err);
      showStatus3(`\u4E0B\u8F7D\u5931\u8D25: ${err.message}`, "error");
    } finally {
      downloadBtn.disabled = false;
    }
  };
  function showStatus3(msg, type) {
    statusDiv.innerHTML = msg;
    statusDiv.style.display = "block";
    statusDiv.className = "";
    statusDiv.style.textAlign = "";
    if (type === "success") {
      statusDiv.style.background = "rgba(27, 94, 32, 0.2)";
      statusDiv.style.color = "#81c784";
      statusDiv.style.border = "1px solid #2e7d32";
    } else if (type === "error") {
      statusDiv.style.background = "rgba(183, 28, 28, 0.2)";
      statusDiv.style.color = "#ef9a9a";
      statusDiv.style.border = "1px solid #c62828";
    } else if (type === "loading") {
      statusDiv.style.background = "#333";
      statusDiv.style.color = "#90caf9";
      statusDiv.style.border = "none";
      statusDiv.style.textAlign = "center";
    }
  }
}

function initVibeGenerator(settingsModal) {
  const vibeGeneratorBtn = settingsModal.find("#novelai-vibe-generator-btn");
  if (vibeGeneratorBtn.length) {
    vibeGeneratorBtn.on("click", () => {
      showVibeGeneratorDialog();
    });
  }
}

export function __set_lastSelectedNovelaiModel(v) { lastSelectedNovelaiModel = v; }

export { NOVELAI_MODEL_PARAM_KEYS, OFFICIAL_NOVELAI_MODEL_DEFAULTS, initVibeGenerator, lastSelectedNovelaiModel };
