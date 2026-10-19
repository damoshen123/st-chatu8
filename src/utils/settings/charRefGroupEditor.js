// 还原自打包产物 — 原始模块: utils/settings/charRefGroupEditor.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { deleteConfigImage, getConfigImage, saveConfigImage } from "../configDatabase.js";

var FIXED_ENCODING_KEY;

var FIXED_ENCODING_KEY = "b36a8472fe418d9f80d6bb1c54e3a6e62c62936aa7bf31dae2bcf7e929f6430f";
function ensureCharRefGroups() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.charRefGroups || typeof settings3.charRefGroups !== "object" || Array.isArray(settings3.charRefGroups)) {
    if (settings3.charRefGroups) {
      console.error("[CharRef] Corrupted charRefGroups data detected, resetting to default:", settings3.charRefGroups);
    }
    settings3.charRefGroups = {
      "\u9ED8\u8BA4\u7EC4": {
        references: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
    console.log("[CharRef] Initialized charRefGroups with default group");
  }
  for (const groupName in settings3.charRefGroups) {
    const group = settings3.charRefGroups[groupName];
    if (!group || typeof group !== "object") {
      console.error("[CharRef] Corrupted group data for:", groupName, "- removing");
      delete settings3.charRefGroups[groupName];
      continue;
    }
    if (!Array.isArray(group.references)) {
      console.warn("[CharRef] Group missing references array:", groupName, "- initializing");
      group.references = [];
    }
    if (typeof group.createdAt !== "number") {
      group.createdAt = Date.now();
    }
    if (typeof group.updatedAt !== "number") {
      group.updatedAt = Date.now();
    }
  }
  if (Object.keys(settings3.charRefGroups).length === 0) {
    console.warn("[CharRef] No valid groups found, creating default group");
    settings3.charRefGroups["\u9ED8\u8BA4\u7EC4"] = {
      references: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  if (!settings3.charRefGroupId || !settings3.charRefGroups[settings3.charRefGroupId]) {
    const firstGroupName = Object.keys(settings3.charRefGroups)[0];
    settings3.charRefGroupId = firstGroupName || "\u9ED8\u8BA4\u7EC4";
    console.log("[CharRef] Set charRefGroupId to:", settings3.charRefGroupId);
  }
  return settings3.charRefGroups;
}

function showCharRefStatus(statusDiv, message, type = "info") {
  statusDiv.textContent = message;
  statusDiv.style.display = "block";
  if (type === "success") {
    statusDiv.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
    statusDiv.style.color = "#4caf50";
    statusDiv.style.border = "1px solid rgba(76, 175, 80, 0.3)";
  } else if (type === "error") {
    statusDiv.style.backgroundColor = "rgba(244, 67, 54, 0.1)";
    statusDiv.style.color = "#f44336";
    statusDiv.style.border = "1px solid rgba(244, 67, 54, 0.3)";
  } else {
    statusDiv.style.backgroundColor = "rgba(33, 150, 243, 0.1)";
    statusDiv.style.color = "#2196f3";
    statusDiv.style.border = "1px solid rgba(33, 150, 243, 0.3)";
  }
  setTimeout(() => {
    statusDiv.style.display = "none";
  }, 5e3);
}

function ensureCharRefPresets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.charRefPresets || typeof settings3.charRefPresets !== "object" || Array.isArray(settings3.charRefPresets)) {
    if (settings3.charRefPresets) {
      console.error("[CharRef] Corrupted charRefPresets data detected, resetting to default:", settings3.charRefPresets);
    }
    settings3.charRefPresets = {
      "\u9ED8\u8BA4": {
        imageId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
    console.log("[CharRef] Initialized charRefPresets with default preset");
  }
  if (Object.keys(settings3.charRefPresets).length === 0) {
    console.warn("[CharRef] No valid presets found, creating default preset");
    settings3.charRefPresets["\u9ED8\u8BA4"] = {
      imageId: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  if (!settings3.charRefPresetId || !settings3.charRefPresets[settings3.charRefPresetId]) {
    const firstPresetName = Object.keys(settings3.charRefPresets)[0];
    settings3.charRefPresetId = firstPresetName || "\u9ED8\u8BA4";
    console.log("[CharRef] Set charRefPresetId to:", settings3.charRefPresetId);
  }
  return settings3.charRefPresets;
}

function showCharRefUploadDialog() {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const settings3 = extension_settings[extensionName];
  ensureCharRefPresets();
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-char-ref-upload-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u89D2\u8272\u53C2\u8003\u56FE\u9884\u8BBE</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-body" style="padding: 2rem;">
                <div class="st-chatu8-char-ref-upload-content">
                    <!-- Preset Selector -->
                    <div class="st-chatu8-field" style="margin-bottom: 1.2rem;">
                        <label for="char-ref-preset-select">\u53C2\u8003\u56FE\u9884\u8BBE</label>
                        <div class="st-chatu8-profile-controls">
                            <select id="char-ref-preset-select" class="st-chatu8-select"></select>
                            <button class="st-chatu8-icon-btn" id="char-ref-preset-new" title="\u65B0\u5EFA\u9884\u8BBE">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="char-ref-preset-export-current" title="\u5BFC\u51FA\u5F53\u524D\u9884\u8BBE">
                                <i class="fa-solid fa-upload"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="char-ref-preset-export-all" title="\u5BFC\u51FA\u5168\u90E8\u9884\u8BBE">
                                <i class="fa-solid fa-file-export"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="char-ref-preset-import" title="\u5BFC\u5165\u9884\u8BBE">
                                <i class="fa-solid fa-download"></i>
                            </button>
                            <button class="st-chatu8-icon-btn danger" id="char-ref-preset-delete" title="\u5220\u9664\u5F53\u524D\u9884\u8BBE">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Image Preview -->
                    <div class="st-chatu8-field-col" style="margin-bottom: 1.2rem;">
                        <label>\u53C2\u8003\u56FE\u7247\u9884\u89C8</label>
                        <div class="st-chatu8-image-preview-container" id="char-ref-upload-preview-container">
                            <div class="st-chatu8-image-placeholder">
                                <i class="fa-solid fa-image"></i>
                                <span>\u6CA1\u6709\u9009\u62E9\u56FE\u7247</span>
                            </div>
                            <img id="char-ref-upload-preview" src="" alt="\u53C2\u8003\u56FE\u9884\u89C8" style="display: none;">
                        </div>
                        <div class="st-chatu8-image-controls" style="margin-top: 0.5rem;">
                            <input type="file" id="char-ref-upload-input" accept="image/png, image/jpeg, image/webp" style="display:none;">
                            <button type="button" class="st-chatu8-btn" id="char-ref-select-btn">
                                <i class="fa-solid fa-upload"></i> \u9009\u62E9\u56FE\u7247
                            </button>
                            <button type="button" class="st-chatu8-btn danger" id="char-ref-remove-preview-btn" style="display: none;">
                                <i class="fa-solid fa-trash"></i> \u79FB\u9664\u56FE\u7247
                            </button>
                        </div>
                    </div>
                    
                    <div id="char-ref-upload-status" style="margin-top: 1.5rem; padding: 1rem; border-radius: 6px; font-size: 0.9rem; display: none; line-height: 1.4;"></div>
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
  const presetSelect = document.getElementById("char-ref-preset-select");
  const newBtn = document.getElementById("char-ref-preset-new");
  const deleteBtn = document.getElementById("char-ref-preset-delete");
  const exportCurrentBtn = document.getElementById("char-ref-preset-export-current");
  const exportAllBtn = document.getElementById("char-ref-preset-export-all");
  const importBtn = document.getElementById("char-ref-preset-import");
  const imageInput = document.getElementById("char-ref-upload-input");
  const previewImage = document.getElementById("char-ref-upload-preview");
  const previewContainer = document.getElementById("char-ref-upload-preview-container");
  const selectBtn = document.getElementById("char-ref-select-btn");
  const removePreviewBtn = document.getElementById("char-ref-remove-preview-btn");
  const statusDiv = document.getElementById("char-ref-upload-status");
  let currentImageId = null;
  function loadPresetList() {
    presetSelect.innerHTML = "";
    const presets = settings3.charRefPresets;
    const sortedKeys = Object.keys(presets).sort((a, b) => {
      if (a === "\u9ED8\u8BA4") return -1;
      if (b === "\u9ED8\u8BA4") return 1;
      return a.localeCompare(b, "zh-CN");
    });
    for (const key of sortedKeys) {
      const option = new Option(key, key);
      presetSelect.add(option);
    }
    presetSelect.value = settings3.charRefPresetId;
  }
  async function loadCurrentPreset() {
    const presetId = presetSelect.value;
    const preset = settings3.charRefPresets[presetId];
    if (!preset) return;
    currentImageId = preset.imageId;
    if (currentImageId) {
      try {
        const imageData = await getConfigImage(currentImageId);
        if (imageData) {
          previewImage.src = imageData;
          previewImage.style.display = "block";
          previewContainer.querySelector(".st-chatu8-image-placeholder").style.display = "none";
          removePreviewBtn.style.display = "inline-block";
        } else {
          resetImagePreview();
        }
      } catch (error) {
        console.error("[CharRef] \u52A0\u8F7D\u56FE\u7247\u9884\u89C8\u5931\u8D25:", error);
        resetImagePreview();
      }
    } else {
      resetImagePreview();
    }
  }
  function resetImagePreview() {
    currentImageId = null;
    imageInput.value = "";
    previewImage.src = "";
    previewImage.style.display = "none";
    previewContainer.querySelector(".st-chatu8-image-placeholder").style.display = "flex";
    removePreviewBtn.style.display = "none";
  }
  loadPresetList();
  loadCurrentPreset();
  presetSelect.onchange = () => {
    settings3.charRefPresetId = presetSelect.value;
    saveSettingsDebounced();
    loadCurrentPreset();
  };
  selectBtn.onclick = () => imageInput.click();
  imageInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showCharRefStatus(statusDiv, "\u4E0D\u652F\u6301\u7684\u56FE\u7247\u683C\u5F0F\u3002\u8BF7\u9009\u62E9 PNG\u3001JPEG \u6216 WebP \u683C\u5F0F\u7684\u56FE\u7247\u3002", "error");
      return;
    }
    try {
      showCharRefStatus(statusDiv, "\u6B63\u5728\u4FDD\u5B58\u56FE\u7247...", "info");
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e2) => resolve(e2.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      if (currentImageId) {
        try {
          await deleteConfigImage(currentImageId);
        } catch (error) {
          console.error("[CharRef] \u5220\u9664\u65E7\u56FE\u7247\u5931\u8D25:", error);
        }
      }
      const presetId = presetSelect.value;
      const newImageId = await saveConfigImage(imageData, {
        format: file.type.split("/")[1] || "png",
        filename: `char_ref_${presetId}_${Date.now()}`
      });
      currentImageId = newImageId;
      settings3.charRefPresets[presetId] = {
        imageId: currentImageId,
        createdAt: settings3.charRefPresets[presetId]?.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      saveSettingsDebounced();
      previewImage.src = imageData;
      previewImage.style.display = "block";
      previewContainer.querySelector(".st-chatu8-image-placeholder").style.display = "none";
      removePreviewBtn.style.display = "inline-block";
      showCharRefStatus(statusDiv, "\u56FE\u7247\u5DF2\u4FDD\u5B58\uFF01", "success");
      console.log("[CharRef] Image saved with ID:", newImageId);
    } catch (error) {
      console.error("[CharRef] \u4FDD\u5B58\u56FE\u7247\u5931\u8D25:", error);
      if (error.name === "QuotaExceededError") {
        showCharRefStatus(statusDiv, "\u5B58\u50A8\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u8BF7\u5220\u9664\u4E00\u4E9B\u65E7\u56FE\u7247", "error");
      } else {
        showCharRefStatus(statusDiv, `\u4FDD\u5B58\u5931\u8D25: ${error.message || "\u672A\u77E5\u9519\u8BEF"}`, "error");
      }
    }
  };
  removePreviewBtn.onclick = async () => {
    if (currentImageId) {
      try {
        await deleteConfigImage(currentImageId);
        const presetId = presetSelect.value;
        settings3.charRefPresets[presetId].imageId = null;
        saveSettingsDebounced();
      } catch (error) {
        console.error("[CharRef] \u5220\u9664\u56FE\u7247\u5931\u8D25:", error);
      }
    }
    resetImagePreview();
  };
  newBtn.onclick = async () => {
    const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u9884\u8BBE\u540D\u79F0:");
    if (!newName) return;
    if (settings3.charRefPresets[newName]) {
      alert("\u8BE5\u9884\u8BBE\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002");
      return;
    }
    try {
      settings3.charRefPresets[newName] = {
        imageId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      settings3.charRefPresetId = newName;
      saveSettingsDebounced();
      loadPresetList();
      loadCurrentPreset();
      showCharRefStatus(statusDiv, "\u65B0\u9884\u8BBE\u5DF2\u521B\u5EFA\uFF01", "success");
    } catch (error) {
      console.error("[CharRef] \u521B\u5EFA\u9884\u8BBE\u5931\u8D25:", error);
      showCharRefStatus(statusDiv, "\u521B\u5EFA\u5931\u8D25: " + error.message, "error");
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
      const preset = settings3.charRefPresets[presetId];
      if (preset && preset.imageId) {
        await deleteConfigImage(preset.imageId);
      }
      delete settings3.charRefPresets[presetId];
      settings3.charRefPresetId = "\u9ED8\u8BA4";
      saveSettingsDebounced();
      loadPresetList();
      loadCurrentPreset();
      showCharRefStatus(statusDiv, "\u9884\u8BBE\u5DF2\u5220\u9664\uFF01", "success");
    } catch (error) {
      console.error("[CharRef] \u5220\u9664\u9884\u8BBE\u5931\u8D25:", error);
      showCharRefStatus(statusDiv, "\u5220\u9664\u5931\u8D25: " + error.message, "error");
    }
  };
  exportCurrentBtn.onclick = async () => {
    const presetId = presetSelect.value;
    const preset = settings3.charRefPresets[presetId];
    if (!preset) {
      alert("\u6CA1\u6709\u9009\u4E2D\u7684\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
      return;
    }
    try {
      const dataToExport = { presets: { [presetId]: preset }, images: {} };
      if (preset.imageId) {
        try {
          const imageData = await getConfigImage(preset.imageId);
          if (imageData) dataToExport.images[preset.imageId] = imageData;
        } catch (error) {
          console.error("[CharRef] \u83B7\u53D6\u56FE\u7247\u5931\u8D25:", error);
        }
      }
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `char-ref-preset-${presetId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showCharRefStatus(statusDiv, "\u9884\u8BBE\u5DF2\u5BFC\u51FA\uFF01", "success");
    } catch (error) {
      console.error("[CharRef] \u5BFC\u51FA\u9884\u8BBE\u5931\u8D25:", error);
      showCharRefStatus(statusDiv, "\u5BFC\u51FA\u5931\u8D25: " + error.message, "error");
    }
  };
  exportAllBtn.onclick = async () => {
    if (!settings3.charRefPresets || Object.keys(settings3.charRefPresets).length === 0) {
      alert("\u6CA1\u6709\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
      return;
    }
    try {
      const dataToExport = { presets: settings3.charRefPresets, images: {} };
      const imageIdsToExport = /* @__PURE__ */ new Set();
      for (const presetName in settings3.charRefPresets) {
        const preset = settings3.charRefPresets[presetName];
        if (preset.imageId) imageIdsToExport.add(preset.imageId);
      }
      for (const imageId of imageIdsToExport) {
        try {
          const imageData = await getConfigImage(imageId);
          if (imageData) dataToExport.images[imageId] = imageData;
        } catch (error) {
          console.error(`[CharRef] \u83B7\u53D6\u56FE\u7247 ${imageId} \u5931\u8D25:`, error);
        }
      }
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "char-ref-presets-all.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showCharRefStatus(statusDiv, `\u5DF2\u5BFC\u51FA ${Object.keys(settings3.charRefPresets).length} \u4E2A\u9884\u8BBE\uFF01`, "success");
    } catch (error) {
      console.error("[CharRef] \u5BFC\u51FA\u5168\u90E8\u9884\u8BBE\u5931\u8D25:", error);
      showCharRefStatus(statusDiv, "\u5BFC\u51FA\u5931\u8D25: " + error.message, "error");
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
          if (importedData.presets) {
            presetsToImport = importedData.presets;
          } else {
            presetsToImport = importedData;
          }
          let importedCount = 0;
          let skippedCount = 0;
          for (const key in presetsToImport) {
            if (settings3.charRefPresets[key]) {
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
                  filename: `char_ref_${key}_${Date.now()}`
                });
                presetData.imageId = newImageId;
              } catch (error) {
                console.error(`[CharRef] \u5BFC\u5165\u56FE\u7247\u5931\u8D25:`, error);
                presetData.imageId = null;
              }
            }
            settings3.charRefPresets[key] = presetData;
            importedCount++;
          }
          saveSettingsDebounced();
          loadPresetList();
          loadCurrentPreset();
          showCharRefStatus(statusDiv, `\u6210\u529F\u5BFC\u5165 ${importedCount} \u4E2A\u9884\u8BBE${skippedCount > 0 ? `\uFF0C\u8DF3\u8FC7 ${skippedCount} \u4E2A` : ""}\uFF01`, "success");
        } catch (error) {
          console.error("[CharRef] \u5BFC\u5165\u9884\u8BBE\u5931\u8D25:", error);
          showCharRefStatus(statusDiv, "\u5BFC\u5165\u5931\u8D25: " + error.message, "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  console.log("[CharRef] Upload dialog opened");
}

function loadCharRefGroupList(selectElement) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const currentGroupId = settings3.charRefGroupId || "\u9ED8\u8BA4\u7EC4";
  selectElement.innerHTML = "";
  const groupNames = Object.keys(charRefGroups).sort((a, b) => {
    if (a === "\u9ED8\u8BA4\u7EC4") return -1;
    if (b === "\u9ED8\u8BA4\u7EC4") return 1;
    return a.localeCompare(b, "zh-CN");
  });
  groupNames.forEach((groupName) => {
    const option = document.createElement("option");
    option.value = groupName;
    option.textContent = groupName;
    if (groupName === currentGroupId) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
  console.log("[CharRef] Loaded preset list:", groupNames.length, "groups");
}

function createNewCharRefGroup(selectElement, statusDiv) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const groupName = prompt("\u8BF7\u8F93\u5165\u65B0\u7EC4\u540D\u79F0:");
  if (!groupName) {
    return;
  }
  const trimmedName = groupName.trim();
  if (!trimmedName) {
    showCharRefStatus(statusDiv, "\u7EC4\u540D\u4E0D\u80FD\u4E3A\u7A7A", "error");
    return;
  }
  if (charRefGroups[trimmedName]) {
    showCharRefStatus(statusDiv, `\u7EC4\u540D "${trimmedName}" \u5DF2\u5B58\u5728`, "error");
    return;
  }
  charRefGroups[trimmedName] = {
    references: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  settings3.charRefGroupId = trimmedName;
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[CharRef] Failed to save settings after creating new group:", {
      groupName: trimmedName,
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
    showCharRefStatus(statusDiv, `\u521B\u5EFA\u6210\u529F\u4F46\u4FDD\u5B58\u5931\u8D25: ${error.message}`, "error");
    return;
  }
  loadCharRefGroupList(selectElement);
  showCharRefStatus(statusDiv, `\u5DF2\u521B\u5EFA\u65B0\u7EC4 "${trimmedName}"`, "success");
  console.log("[CharRef] Created new group:", trimmedName);
}

function saveCurrentCharRefGroup(selectElement, statusDiv) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const currentGroupId = selectElement.value;
  if (!currentGroupId) {
    showCharRefStatus(statusDiv, "\u672A\u9009\u62E9\u7EC4", "error");
    return;
  }
  const currentGroup = charRefGroups[currentGroupId];
  if (!currentGroup) {
    showCharRefStatus(statusDiv, "\u5F53\u524D\u7EC4\u4E0D\u5B58\u5728", "error");
    return;
  }
  currentGroup.updatedAt = Date.now();
  settings3.charRefGroupId = currentGroupId;
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[CharRef] Failed to save settings after saving group:", {
      groupId: currentGroupId,
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
    showCharRefStatus(statusDiv, `\u4FDD\u5B58\u5931\u8D25: ${error.message}`, "error");
    return;
  }
  showCharRefStatus(statusDiv, `\u5DF2\u4FDD\u5B58\u7EC4 "${currentGroupId}"`, "success");
  console.log("[CharRef] Saved group:", currentGroupId);
}

async function deleteCharRefGroup(selectElement, statusDiv) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const currentGroupId = selectElement.value;
  if (!currentGroupId) {
    showCharRefStatus(statusDiv, "\u672A\u9009\u62E9\u7EC4", "error");
    return;
  }
  if (currentGroupId === "\u9ED8\u8BA4\u7EC4" && Object.keys(charRefGroups).length === 1) {
    showCharRefStatus(statusDiv, "\u4E0D\u80FD\u5220\u9664\u552F\u4E00\u7684\u7EC4", "error");
    return;
  }
  const confirmed = confirm(`\u786E\u5B9A\u8981\u5220\u9664\u7EC4 "${currentGroupId}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002`);
  if (!confirmed) {
    return;
  }
  const group = charRefGroups[currentGroupId];
  if (group && Array.isArray(group.references)) {
    for (const ref of group.references) {
      try {
        await deleteConfigImage(ref.imageId);
      } catch (error) {
        console.error("[CharRef] Failed to delete image:", ref.imageId, error);
      }
    }
  }
  delete charRefGroups[currentGroupId];
  if (charRefGroups["\u9ED8\u8BA4\u7EC4"]) {
    settings3.charRefGroupId = "\u9ED8\u8BA4\u7EC4";
  } else {
    const remainingGroups = Object.keys(charRefGroups);
    settings3.charRefGroupId = remainingGroups.length > 0 ? remainingGroups[0] : "\u9ED8\u8BA4\u7EC4";
    if (remainingGroups.length === 0) {
      charRefGroups["\u9ED8\u8BA4\u7EC4"] = {
        references: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      settings3.charRefGroupId = "\u9ED8\u8BA4\u7EC4";
    }
  }
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[CharRef] Failed to save settings after deleting group:", {
      groupId: currentGroupId,
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
    showCharRefStatus(statusDiv, `\u5220\u9664\u6210\u529F\u4F46\u4FDD\u5B58\u5931\u8D25: ${error.message}`, "error");
  }
  loadCharRefGroupList(selectElement);
  showCharRefStatus(statusDiv, `\u5DF2\u5220\u9664\u7EC4 "${currentGroupId}"`, "success");
  console.log("[CharRef] Deleted group:", currentGroupId);
}

function showCharRefGroupEditorDialog() {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const settings3 = extension_settings[extensionName];
  ensureCharRefGroups();
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-char-ref-group-editor-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u89D2\u8272\u7EC4\u7F16\u8F91\u5668</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-body" style="padding: 2rem;">
                <div class="st-chatu8-char-ref-group-editor-content">
                    <!-- Group Preset Selector -->
                    <div class="st-chatu8-field" style="margin-bottom: 1.2rem;">
                        <label for="char-ref-group-select">\u89D2\u8272\u7EC4\u9884\u8BBE</label>
                        <div class="st-chatu8-profile-controls">
                            <select id="char-ref-group-select" class="st-chatu8-select"></select>
                            <button class="st-chatu8-icon-btn" id="char-ref-group-new" title="\u65B0\u5EFA\u7EC4">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="char-ref-group-save" title="\u4FDD\u5B58\u5F53\u524D\u7EC4">
                                <i class="fa-solid fa-save"></i>
                            </button>
                            <button class="st-chatu8-icon-btn danger" id="char-ref-group-delete" title="\u5220\u9664\u5F53\u524D\u7EC4">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Add Reference Button -->
                    <button type="button" class="st-chatu8-btn" id="char-ref-group-add-ref" style="width: 100%; padding: 1rem; font-size: 16px; font-weight: 600; margin-bottom: 1.5rem;">
                        <i class="fa-solid fa-plus"></i> \u6DFB\u52A0\u89D2\u8272\u53C2\u8003 (0/4)
                    </button>

                    <!-- Reference Slots Container -->
                    <div id="char-ref-slots-container" class="st-chatu8-char-ref-slots">
                        <!-- Dynamically rendered slots (0-4) -->
                    </div>

                    <!-- Status Message Area -->
                    <div id="char-ref-group-status" style="margin-top: 1.5rem; padding: 1rem; border-radius: 6px; font-size: 0.9rem; display: none; line-height: 1.4;"></div>
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
  const groupSelect = document.getElementById("char-ref-group-select");
  const newBtn = document.getElementById("char-ref-group-new");
  const saveBtn = document.getElementById("char-ref-group-save");
  const deleteBtn = document.getElementById("char-ref-group-delete");
  const addRefBtn = document.getElementById("char-ref-group-add-ref");
  const slotsContainer = document.getElementById("char-ref-slots-container");
  const statusDiv = document.getElementById("char-ref-group-status");
  loadCharRefGroupList(groupSelect);
  newBtn.onclick = () => createNewCharRefGroup(groupSelect, statusDiv);
  saveBtn.onclick = () => saveCurrentCharRefGroup(groupSelect, statusDiv);
  deleteBtn.onclick = () => deleteCharRefGroup(groupSelect, statusDiv);
  addRefBtn.onclick = () => addCharRefToGroup(groupSelect, slotsContainer, addRefBtn, statusDiv);
  renderCharRefSlots(slotsContainer, groupSelect, addRefBtn);
  groupSelect.onchange = () => {
    settings3.charRefGroupId = groupSelect.value;
    renderCharRefSlots(slotsContainer, groupSelect, addRefBtn);
  };
  console.log("[CharRef] Group editor dialog opened");
}

async function renderCharRefSlots(slotsContainer, groupSelect, addRefBtn) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const currentGroupId = groupSelect.value;
  const currentGroup = charRefGroups[currentGroupId];
  slotsContainer.innerHTML = "";
  if (!currentGroup) {
    console.warn("[CharRef] Current group not found:", currentGroupId);
    slotsContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: rgba(255, 255, 255, 0.5);">
                <i class="fa-solid fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>\u65E0\u6CD5\u52A0\u8F7D\u7EC4\u6570\u636E</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">\u8BF7\u5C1D\u8BD5\u9009\u62E9\u5176\u4ED6\u7EC4\u6216\u521B\u5EFA\u65B0\u7EC4</p>
            </div>
        `;
    addRefBtn.disabled = true;
    addRefBtn.style.opacity = "0.5";
    return;
  }
  if (!Array.isArray(currentGroup.references)) {
    console.error("[CharRef] Corrupted group data - references is not an array:", currentGroupId, currentGroup);
    currentGroup.references = [];
    currentGroup.updatedAt = Date.now();
    saveSettingsDebounced();
    console.log("[CharRef] Fixed corrupted group data");
  }
  const references = currentGroup.references;
  const refCount = references.length;
  addRefBtn.innerHTML = `<i class="fa-solid fa-plus"></i> \u6DFB\u52A0\u89D2\u8272\u53C2\u8003 (${refCount}/4)`;
  addRefBtn.disabled = refCount >= 4;
  addRefBtn.style.opacity = refCount >= 4 ? "0.5" : "1";
  if (refCount === 0) {
    slotsContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: rgba(255, 255, 255, 0.5);">
                <i class="fa-solid fa-image" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>\u6B64\u7EC4\u8FD8\u6CA1\u6709\u89D2\u8272\u53C2\u8003</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u89D2\u8272\u53C2\u8003\u56FE</p>
            </div>
        `;
    return;
  }
  for (let i = 0; i < references.length; i++) {
    const ref = references[i];
    const slotDiv = document.createElement("div");
    slotDiv.className = "st-chatu8-char-ref-slot";
    slotDiv.style.cssText = "border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: rgba(0, 0, 0, 0.2);";
    let imageDataUrl = "";
    try {
      imageDataUrl = await getConfigImage(ref.imageId);
    } catch (error) {
      console.error("[CharRef] Failed to load image:", ref.imageId, error);
    }
    slotDiv.innerHTML = `
            <div style="display: flex; gap: 1rem; align-items: flex-start;">
                <!-- Image Thumbnail -->
                <div style="flex-shrink: 0;">
                    <img src="${imageDataUrl || ""}" alt="\u53C2\u8003\u56FE ${i + 1}" 
                         style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px; background: rgba(255, 255, 255, 0.05);"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="width: 120px; height: 120px; display: ${imageDataUrl ? "none" : "flex"}; align-items: center; justify-content: center; border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.3);">
                        <i class="fa-solid fa-image" style="font-size: 2rem;"></i>
                    </div>
                </div>

                <!-- Controls -->
                <div style="flex: 1; display: flex; flex-direction: column; gap: 1rem;">
                    <!-- Reference Type -->
                    <div class="st-chatu8-field">
                        <label for="char-ref-type-${i}">\u53C2\u8003\u7C7B\u578B</label>
                        <select id="char-ref-type-${i}" class="st-chatu8-select char-ref-type-select" data-index="${i}">
                            <option value="character" ${ref.type === "character" ? "selected" : ""}>Character</option>
                            <option value="character_style" ${ref.type === "character_style" ? "selected" : ""}>Character & Style</option>
                            <option value="style" ${ref.type === "style" ? "selected" : ""}>Style</option>
                        </select>
                    </div>

                    <!-- Strength Slider -->
                    <div class="st-chatu8-field">
                        <label for="char-ref-strength-${i}">Strength: <span id="char-ref-strength-val-${i}">${ref.strength ?? 0.6}</span></label>
                        <div class="st-chatu8-range-container">
                            <input type="range" id="char-ref-strength-range-${i}" class="st-chatu8-range-slider char-ref-strength-range" 
                                   data-index="${i}" min="0" max="2" step="0.01" value="${ref.strength ?? 0.6}">
                            <input type="number" id="char-ref-strength-${i}" class="st-chatu8-range-input char-ref-strength-input" 
                                   data-index="${i}" min="0" step="0.01" value="${ref.strength ?? 0.6}">
                        </div>
                    </div>

                    <!-- Fidelity Slider -->
                    <div class="st-chatu8-field">
                        <label for="char-ref-fidelity-${i}">Fidelity: <span id="char-ref-fidelity-val-${i}">${ref.fidelity ?? 0.6}</span></label>
                        <div class="st-chatu8-range-container">
                            <input type="range" id="char-ref-fidelity-range-${i}" class="st-chatu8-range-slider char-ref-fidelity-range" 
                                   data-index="${i}" min="0" max="2" step="0.01" value="${ref.fidelity ?? 0.6}">
                            <input type="number" id="char-ref-fidelity-${i}" class="st-chatu8-range-input char-ref-fidelity-input" 
                                   data-index="${i}" min="0" step="0.01" value="${ref.fidelity ?? 0.6}">
                        </div>
                    </div>

                    <!-- Remove Button -->
                    <button type="button" class="st-chatu8-btn danger char-ref-remove-btn" data-index="${i}" 
                            style="align-self: flex-start;">
                        <i class="fa-solid fa-trash"></i> \u79FB\u9664
                    </button>
                </div>
            </div>
        `;
    slotsContainer.appendChild(slotDiv);
  }
  bindCharRefSlotEvents(slotsContainer, groupSelect, addRefBtn);
  console.log("[CharRef] Rendered", refCount, "reference slots");
}

async function showCharRefImageLibrary(onSelect) {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const settings3 = extension_settings[extensionName];
  ensureCharRefPresets();
  const charRefPresets = settings3.charRefPresets || {};
  let currentPage = 1;
  let pageSize = 12;
  let filteredPresets = [];
  let searchQuery = "";
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-vibe-visual-selector-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u9009\u62E9\u89D2\u8272\u53C2\u8003\u56FE</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-toolbar" style="justify-content: space-between; align-items: center; gap: 15px; padding: 12px 20px; background: rgba(30, 30, 46, 0.6); border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div class="st-chatu8-viz-search-container" style="position: relative; flex-grow: 1; max-width: 300px;">
                    <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #aaa; pointer-events: none;"></i>
                    <input type="text" class="st-chatu8-viz-search-input" placeholder="\u641C\u7D22\u53C2\u8003\u56FE..." style="width: 100%; padding: 8px 12px 8px 36px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: white; outline: none; transition: all 0.3s;">
                </div>
            </div>
            <div class="st-chatu8-pagination-container">
                <button class="st-chatu8-pagination-btn st-chatu8-pagination-prev" title="\u4E0A\u4E00\u9875">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="st-chatu8-pagination-info">
                    <span class="st-chatu8-pagination-current">1</span>
                    <span>/</span>
                    <span class="st-chatu8-pagination-total">1</span>
                    <span style="margin-left: 8px; color: #666;">|</span>
                    <span style="margin-left: 8px;">\u5171 <span class="st-chatu8-pagination-count">0</span> \u4E2A</span>
                </div>
                <button class="st-chatu8-pagination-btn st-chatu8-pagination-next" title="\u4E0B\u4E00\u9875">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div class="st-chatu8-pagination-size-container">
                    <span class="st-chatu8-pagination-size-label">\u6BCF\u9875</span>
                    <select class="st-chatu8-pagination-size">
                        <option value="8">8</option>
                        <option value="12" selected>12</option>
                        <option value="16">16</option>
                        <option value="24">24</option>
                    </select>
                </div>
            </div>
            <div class="st-chatu8-workflow-viz-body">
                <div class="st-chatu8-vibe-visual-selector-grid">
                    <!-- Character reference cards will be inserted here -->
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
  const gridContainer = backdrop.querySelector(".st-chatu8-vibe-visual-selector-grid");
  const searchInput = backdrop.querySelector(".st-chatu8-viz-search-input");
  const paginationPrev = backdrop.querySelector(".st-chatu8-pagination-prev");
  const paginationNext = backdrop.querySelector(".st-chatu8-pagination-next");
  const paginationCurrent = backdrop.querySelector(".st-chatu8-pagination-current");
  const paginationTotal = backdrop.querySelector(".st-chatu8-pagination-total");
  const paginationCount = backdrop.querySelector(".st-chatu8-pagination-count");
  const paginationSizeSelect = backdrop.querySelector(".st-chatu8-pagination-size");
  const allPresetNames = Object.keys(charRefPresets).filter((name) => charRefPresets[name].imageId).sort((a, b) => {
    if (a === "\u9ED8\u8BA4") return -1;
    if (b === "\u9ED8\u8BA4") return 1;
    return a.localeCompare(b, "zh-CN");
  });
  function updateFilteredPresets() {
    if (searchQuery) {
      filteredPresets = allPresetNames.filter(
        (name) => name.toLowerCase().includes(searchQuery)
      );
    } else {
      filteredPresets = [...allPresetNames];
    }
  }
  function updatePaginationUI() {
    const totalPages = Math.ceil(filteredPresets.length / pageSize) || 1;
    paginationCurrent.textContent = currentPage;
    paginationTotal.textContent = totalPages;
    paginationCount.textContent = filteredPresets.length;
    paginationPrev.disabled = currentPage <= 1;
    paginationPrev.style.opacity = currentPage <= 1 ? "0.5" : "1";
    paginationPrev.style.cursor = currentPage <= 1 ? "not-allowed" : "pointer";
    paginationNext.disabled = currentPage >= totalPages;
    paginationNext.style.opacity = currentPage >= totalPages ? "0.5" : "1";
    paginationNext.style.cursor = currentPage >= totalPages ? "not-allowed" : "pointer";
  }
  async function renderCurrentPage() {
    gridContainer.style.opacity = "0";
    gridContainer.style.transform = "translateY(10px)";
    await new Promise((resolve) => setTimeout(resolve, 150));
    gridContainer.innerHTML = "";
    if (filteredPresets.length === 0) {
      gridContainer.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 3rem;
                    color: rgba(255, 255, 255, 0.5);
                ">
                    <i class="fa-solid fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <p>${searchQuery ? "\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u53C2\u8003\u56FE" : "\u56FE\u7247\u5E93\u4E3A\u7A7A"}</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">${searchQuery ? "\u8BF7\u5C1D\u8BD5\u5176\u4ED6\u641C\u7D22\u8BCD" : "\u8BF7\u5148\u4E0A\u4F20\u4E00\u4E9B\u89D2\u8272\u53C2\u8003\u56FE"}</p>
                </div>
            `;
      updatePaginationUI();
      gridContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      gridContainer.style.opacity = "1";
      gridContainer.style.transform = "translateY(0)";
      return;
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagePresets = filteredPresets.slice(startIndex, endIndex);
    for (const presetName of pagePresets) {
      const preset = charRefPresets[presetName];
      const card = document.createElement("div");
      card.className = "st-chatu8-vibe-card";
      const thumbnailDiv = document.createElement("div");
      thumbnailDiv.className = "st-chatu8-vibe-card-thumbnail";
      try {
        const imageData = await getConfigImage(preset.imageId);
        if (imageData) {
          const img = document.createElement("img");
          img.src = imageData;
          img.alt = presetName;
          thumbnailDiv.appendChild(img);
        } else {
          thumbnailDiv.innerHTML = `
                        <div class="st-chatu8-vibe-card-placeholder">
                            <i class="fa-solid fa-image"></i>
                            <div>\u65E0\u56FE\u50CF</div>
                        </div>
                    `;
        }
      } catch (error) {
        thumbnailDiv.innerHTML = `
                    <div class="st-chatu8-vibe-card-error">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <div>\u52A0\u8F7D\u5931\u8D25</div>
                    </div>
                `;
        thumbnailDiv.title = `\u52A0\u8F7D\u5931\u8D25: ${error.message}`;
        console.error("[CharRef] Failed to load image:", preset.imageId, error);
      }
      const infoDiv = document.createElement("div");
      infoDiv.className = "st-chatu8-vibe-card-info";
      const nameDiv = document.createElement("div");
      nameDiv.className = "st-chatu8-vibe-card-name";
      nameDiv.textContent = presetName;
      infoDiv.appendChild(nameDiv);
      card.appendChild(thumbnailDiv);
      card.appendChild(infoDiv);
      card.onclick = () => {
        onSelect(preset.imageId);
        parent.removeChild(backdrop);
        console.log("[CharRef] Selected image:", presetName, preset.imageId);
      };
      gridContainer.appendChild(card);
    }
    gridContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    gridContainer.style.opacity = "1";
    gridContainer.style.transform = "translateY(0)";
    updatePaginationUI();
  }
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    currentPage = 1;
    updateFilteredPresets();
    renderCurrentPage();
  });
  paginationPrev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  };
  paginationNext.onclick = () => {
    const totalPages = Math.ceil(filteredPresets.length / pageSize) || 1;
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  };
  paginationSizeSelect.onchange = (e) => {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderCurrentPage();
  };
  updateFilteredPresets();
  renderCurrentPage();
}

function addCharRefToGroup(groupSelect, slotsContainer, addRefBtn, statusDiv) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const currentGroupId = groupSelect.value;
  const currentGroup = charRefGroups[currentGroupId];
  if (!currentGroup) {
    showCharRefStatus(statusDiv, "\u9519\u8BEF: \u672A\u9009\u62E9\u7EC4\u3002\u8BF7\u5148\u9009\u62E9\u6216\u521B\u5EFA\u4E00\u4E2A\u7EC4\u3002", "error");
    console.error("[CharRef] No group selected when attempting to add reference");
    return;
  }
  const references = currentGroup.references || [];
  if (references.length >= 4) {
    showCharRefStatus(statusDiv, "\u5DF2\u8FBE\u5230\u6700\u5927\u6570\u91CF (4\u4E2A)\u3002\u6BCF\u4E2A\u7EC4\u6700\u591A\u53EF\u5305\u542B 4 \u4E2A\u89D2\u8272\u53C2\u8003\u3002", "error");
    console.warn("[CharRef] Maximum reference limit reached for group:", currentGroupId);
    return;
  }
  try {
    showCharRefImageLibrary((imageId) => {
      try {
        if (!imageId || typeof imageId !== "string") {
          showCharRefStatus(statusDiv, "\u9519\u8BEF: \u65E0\u6548\u7684\u56FE\u7247 ID", "error");
          console.error("[CharRef] Invalid imageId received:", imageId);
          return;
        }
        currentGroup.references.push({
          imageId,
          type: "character",
          strength: 0.6,
          fidelity: 0.6
        });
        currentGroup.updatedAt = Date.now();
        try {
          saveSettingsDebounced();
        } catch (error) {
          console.error("[CharRef] Failed to save settings after adding reference:", {
            imageId: imageId.substring(0, 12) + "...",
            error: error.message,
            errorName: error.name,
            groupId: currentGroupId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            stack: error.stack
          });
          showCharRefStatus(statusDiv, `\u9519\u8BEF: \u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25 - ${error.message}`, "error");
          return;
        }
        renderCharRefSlots(slotsContainer, groupSelect, addRefBtn);
        showCharRefStatus(statusDiv, "\u89D2\u8272\u53C2\u8003\u5DF2\u6210\u529F\u6DFB\u52A0\u5230\u7EC4", "success");
        console.log("[CharRef] Successfully added reference to group:", currentGroupId, imageId);
      } catch (error) {
        console.error("[CharRef] Error adding reference to group:", {
          error: error.message,
          errorName: error.name,
          groupId: currentGroupId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          stack: error.stack
        });
        showCharRefStatus(statusDiv, `\u9519\u8BEF: \u6DFB\u52A0\u89D2\u8272\u53C2\u8003\u5931\u8D25 - ${error.message}`, "error");
      }
    });
  } catch (error) {
    console.error("[CharRef] Error opening image library:", {
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
    showCharRefStatus(statusDiv, `\u9519\u8BEF: \u65E0\u6CD5\u6253\u5F00\u56FE\u7247\u5E93 - ${error.message}`, "error");
  }
}

async function removeCharRefFromGroup(index, groupSelect, slotsContainer, addRefBtn, statusDiv) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const currentGroupId = groupSelect.value;
  const currentGroup = charRefGroups[currentGroupId];
  if (!currentGroup || !Array.isArray(currentGroup.references)) {
    showCharRefStatus(statusDiv, "\u9519\u8BEF: \u7EC4\u6570\u636E\u65E0\u6548", "error");
    return;
  }
  if (index < 0 || index >= currentGroup.references.length) {
    showCharRefStatus(statusDiv, "\u9519\u8BEF: \u65E0\u6548\u7684\u7D22\u5F15", "error");
    return;
  }
  const confirmed = confirm("\u786E\u5B9A\u8981\u79FB\u9664\u8FD9\u4E2A\u89D2\u8272\u53C2\u8003\u5417\uFF1F");
  if (!confirmed) {
    return;
  }
  const ref = currentGroup.references[index];
  currentGroup.references.splice(index, 1);
  currentGroup.updatedAt = Date.now();
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[CharRef] Failed to save settings after removing reference:", error);
    showCharRefStatus(statusDiv, `\u9519\u8BEF: \u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25 - ${error.message}`, "error");
    return;
  }
  await renderCharRefSlots(slotsContainer, groupSelect, addRefBtn);
  showCharRefStatus(statusDiv, "\u89D2\u8272\u53C2\u8003\u5DF2\u79FB\u9664", "success");
  console.log("[CharRef] Removed reference at index:", index);
}

function bindCharRefSlotEvents(slotsContainer, groupSelect, addRefBtn) {
  const settings3 = extension_settings[extensionName];
  const charRefGroups = settings3.charRefGroups || {};
  const currentGroupId = groupSelect.value;
  const currentGroup = charRefGroups[currentGroupId];
  const statusDiv = document.getElementById("char-ref-group-status");
  if (!currentGroup) return;
  const typeSelects = slotsContainer.querySelectorAll(".char-ref-type-select");
  typeSelects.forEach((select) => {
    select.onchange = (e) => {
      const index = parseInt(e.target.dataset.index);
      const newType = e.target.value;
      if (currentGroup.references[index]) {
        currentGroup.references[index].type = newType;
        currentGroup.updatedAt = Date.now();
        try {
          saveSettingsDebounced();
          console.log("[CharRef] Updated reference type:", index, newType);
        } catch (error) {
          console.error("[CharRef] Failed to save after type change:", error);
          showCharRefStatus(statusDiv, `\u4FDD\u5B58\u5931\u8D25: ${error.message}`, "error");
        }
      }
    };
  });
  const strengthRanges = slotsContainer.querySelectorAll(".char-ref-strength-range");
  const strengthInputs = slotsContainer.querySelectorAll(".char-ref-strength-input");
  strengthRanges.forEach((range) => {
    range.oninput = (e) => {
      const index = parseInt(e.target.dataset.index);
      const value = parseFloat(e.target.value);
      const valueSpan = document.getElementById(`char-ref-strength-val-${index}`);
      if (valueSpan) valueSpan.textContent = value.toFixed(2);
      const numberInput = document.getElementById(`char-ref-strength-${index}`);
      if (numberInput) numberInput.value = value;
      if (currentGroup.references[index]) {
        currentGroup.references[index].strength = value;
        currentGroup.updatedAt = Date.now();
        try {
          saveSettingsDebounced();
        } catch (error) {
          console.error("[CharRef] Failed to save after strength change:", error);
        }
      }
    };
  });
  strengthInputs.forEach((input) => {
    input.oninput = (e) => {
      const index = parseInt(e.target.dataset.index);
      const value = parseFloat(e.target.value);
      const clampedValue = Math.max(0, value);
      const valueSpan = document.getElementById(`char-ref-strength-val-${index}`);
      if (valueSpan) valueSpan.textContent = clampedValue.toFixed(2);
      const rangeInput = document.getElementById(`char-ref-strength-range-${index}`);
      if (rangeInput) rangeInput.value = clampedValue;
      if (currentGroup.references[index]) {
        currentGroup.references[index].strength = clampedValue;
        currentGroup.updatedAt = Date.now();
        try {
          saveSettingsDebounced();
        } catch (error) {
          console.error("[CharRef] Failed to save after strength change:", error);
        }
      }
    };
  });
  const fidelityRanges = slotsContainer.querySelectorAll(".char-ref-fidelity-range");
  const fidelityInputs = slotsContainer.querySelectorAll(".char-ref-fidelity-input");
  fidelityRanges.forEach((range) => {
    range.oninput = (e) => {
      const index = parseInt(e.target.dataset.index);
      const value = parseFloat(e.target.value);
      const valueSpan = document.getElementById(`char-ref-fidelity-val-${index}`);
      if (valueSpan) valueSpan.textContent = value.toFixed(2);
      const numberInput = document.getElementById(`char-ref-fidelity-${index}`);
      if (numberInput) numberInput.value = value;
      if (currentGroup.references[index]) {
        currentGroup.references[index].fidelity = value;
        currentGroup.updatedAt = Date.now();
        try {
          saveSettingsDebounced();
        } catch (error) {
          console.error("[CharRef] Failed to save after fidelity change:", error);
        }
      }
    };
  });
  fidelityInputs.forEach((input) => {
    input.oninput = (e) => {
      const index = parseInt(e.target.dataset.index);
      const value = parseFloat(e.target.value);
      const clampedValue = Math.max(0, value);
      const valueSpan = document.getElementById(`char-ref-fidelity-val-${index}`);
      if (valueSpan) valueSpan.textContent = clampedValue.toFixed(2);
      const rangeInput = document.getElementById(`char-ref-fidelity-range-${index}`);
      if (rangeInput) rangeInput.value = clampedValue;
      if (currentGroup.references[index]) {
        currentGroup.references[index].fidelity = clampedValue;
        currentGroup.updatedAt = Date.now();
        try {
          saveSettingsDebounced();
        } catch (error) {
          console.error("[CharRef] Failed to save after fidelity change:", error);
        }
      }
    };
  });
  const removeButtons = slotsContainer.querySelectorAll(".char-ref-remove-btn");
  removeButtons.forEach((button) => {
    button.onclick = (e) => {
      const index = parseInt(e.target.closest(".char-ref-remove-btn").dataset.index);
      removeCharRefFromGroup(index, groupSelect, slotsContainer, addRefBtn, statusDiv);
    };
  });
}

function initCharRefGroupEditor(settingsModal) {
  ensureCharRefGroups();
  ensureCharRefPresets();
  const charRefUploadBtn = settingsModal.find("#novelai-char-ref-upload-btn");
  if (charRefUploadBtn.length) {
    charRefUploadBtn.on("click", () => {
      showCharRefUploadDialog();
    });
  }
  const charRefGroupEditorBtn = settingsModal.find("#novelai-char-ref-group-editor-btn");
  if (charRefGroupEditorBtn.length) {
    charRefGroupEditorBtn.on("click", () => {
      showCharRefGroupEditorDialog();
    });
  }
}

export { FIXED_ENCODING_KEY, initCharRefGroupEditor };
