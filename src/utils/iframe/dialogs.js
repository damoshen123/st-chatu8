// 还原自打包产物 — 原始模块: utils/iframe/dialogs.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { clampPopupToViewport, deduplicateTags, getSortedCharacterIds, isMobileDeviceDialog, parsePromptStringWithCoordinates, stripChineseAnnotations } from "../utils.js";
import { deleteTagForElement, isTagLocked, lockTagForElement, unlockTagForElement } from "../imageInserter.js";
import { handleTagModifyRequest } from "../tagModify.js";
import { calculateNovelAITokens, getNovelAIMaxTokens, getNovelAIQualityPresetsText } from "../novelaiTokenCalculator.js";
import { callTranslation, parseTranslationResult, tagsToJsonString } from "../ai.js";
import { processCharacterPrompt } from "../characterprompt.js";
import { getItemMeta, updateItemImgActiveMode, updateItemImgChange, updateItemImgVideo } from "../database.js";
import { handleAutocomplete2 } from "./autocomplete.js";
import { openPositionEditorDialog } from "../positionEditor.js";
import { showGorkVideoDialog } from "./gorkVideo.js";
import { showComfyUIInpaintDialog } from "./comfyuiInpaint.js";
import { showNovelAIInpaintDialog } from "./novelaiInpaint.js";
import { handleImageToVideoGen, showUserDemandPopup2 } from "../promptReq.js";

var _triggerGeneration2;

_triggerGeneration2 = null;

function setTriggerGeneration(fn) {
  _triggerGeneration2 = fn;
}

function getImageSizeConfigKeys(mode) {
  const configMap = {
    "sd": { widthKey: "sd_cwidth", heightKey: "sd_cheight", modeName: "SD" },
    "novelai": { widthKey: "novelai_width", heightKey: "novelai_height", modeName: "NovelAI" },
    "comfyui": { widthKey: "comfyui_width", heightKey: "comfyui_height", modeName: "ComfyUI" },
    "banana": { widthKey: null, heightKey: null, modeName: "Banana" }
  };
  return configMap[mode] || configMap["comfyui"];
}

function showImageSizePopup(button, inputEl, onConfirm) {
  return new Promise((resolve) => {
    const doc = window.top.document;
    const isMobile3 = isMobileDeviceDialog();
    const settings3 = extension_settings[extensionName];
    const mode = settings3.mode || "comfyui";
    const { widthKey, heightKey, modeName } = getImageSizeConfigKeys(mode);
    let currentWidth, currentHeight;
    if (mode === "banana") {
      const aspectRatio = button.dataset.aspectRatio || settings3.banana?.aspectRatio || "1:1";
      currentWidth = aspectRatio;
      currentHeight = "";
    } else {
      currentWidth = button.dataset.width;
      currentHeight = button.dataset.height;
      if (!currentWidth || !currentHeight) {
        const sizeRegex = /,?\s*(\d{2,4})x(\d{2,4})(?=[;\s]|$)/i;
        const currentActiveMode = button.dataset.activeMode || "image";
        const tagToMatch = (currentActiveMode === "video" ? button.dataset.video : button.dataset.change) || button.dataset.link || "";
        const match = tagToMatch.match(sizeRegex);
        if (match) {
          if (String(settings3.aiAutonomousResolution) !== "false") {
            currentWidth = match[1];
            currentHeight = match[2];
          }
        }
      }
      currentWidth = currentWidth || settings3[widthKey] || "1024";
      currentHeight = currentHeight || settings3[heightKey] || "1024";
      console.log("[showImageSizePopup] \u8BFB\u53D6\u914D\u7F6E:", {
        mode,
        widthKey,
        heightKey,
        buttonWidth: button.dataset.width,
        buttonHeight: button.dataset.height,
        configWidth: settings3[widthKey],
        configHeight: settings3[heightKey],
        currentWidth,
        currentHeight
      });
    }
    const viewportHeight = window.top.innerHeight;
    let topBound = 10;
    let bottomBound = viewportHeight - 10;
    if (isMobile3) {
      const topSettingsHolder = doc.querySelector("#top-settings-holder");
      if (topSettingsHolder) {
        const rect = topSettingsHolder.getBoundingClientRect();
        topBound = Math.max(10, Math.min(rect.bottom + 10, viewportHeight * 0.5));
      }
      const sendForm = doc.querySelector("#send_form");
      if (sendForm) {
        const rect = sendForm.getBoundingClientRect();
        bottomBound = Math.max(topBound + 200, Math.min(rect.top - 10, viewportHeight - 10));
      }
    }
    const availableHeight = Math.max(200, bottomBound - topBound);
    const overlay2 = doc.createElement("div");
    overlay2.id = "image-size-overlay";
    overlay2.className = "st-chatu8-popup-overlay";
    const bubble = doc.createElement("div");
    bubble.className = "st-chatu8-popup-bubble";
    if (isMobile3) {
      bubble.classList.add("mobile");
      bubble.style.top = `${topBound}px`;
      bubble.style.maxHeight = `${availableHeight}px`;
    } else {
      clampPopupToViewport(bubble, window.top);
    }
    const title = doc.createElement("div");
    title.textContent = `\u{1F4D0} \u56FE\u7247\u5927\u5C0F\u8BBE\u7F6E (${modeName})`;
    title.className = "st-chatu8-popup-title";
    const hint = doc.createElement("div");
    hint.textContent = mode === "banana" ? "\u8BBE\u7F6E\u751F\u6210\u56FE\u7247\u7684\u7EB5\u6A2A\u6BD4" : "\u8BBE\u7F6E\u751F\u6210\u56FE\u7247\u7684\u5BBD\u5EA6\u548C\u9AD8\u5EA6";
    hint.className = "st-chatu8-popup-hint";
    const formSection = doc.createElement("div");
    formSection.className = "st-chatu8-popup-size-form";
    let widthInput, heightInput;
    if (mode === "banana") {
      const ratioRow = doc.createElement("div");
      ratioRow.className = "st-chatu8-popup-size-row";
      const ratioLabel = doc.createElement("label");
      ratioLabel.textContent = "\u7EB5\u6A2A\u6BD4";
      ratioLabel.className = "st-chatu8-popup-size-label";
      const ratioSelect = doc.createElement("select");
      ratioSelect.className = "st-chatu8-popup-size-input";
      ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"].forEach((ratio) => {
        const option = doc.createElement("option");
        option.value = ratio;
        option.textContent = ratio;
        if (ratio === currentWidth) option.selected = true;
        ratioSelect.appendChild(option);
      });
      ratioRow.appendChild(ratioLabel);
      ratioRow.appendChild(ratioSelect);
      formSection.appendChild(ratioRow);
      widthInput = ratioSelect;
    } else {
      const widthRow = doc.createElement("div");
      widthRow.className = "st-chatu8-popup-size-row";
      const widthLabel = doc.createElement("label");
      widthLabel.textContent = "\u5BBD\u5EA6";
      widthLabel.className = "st-chatu8-popup-size-label";
      widthInput = doc.createElement("input");
      widthInput.type = "number";
      widthInput.value = currentWidth;
      widthInput.min = "64";
      widthInput.max = "4096";
      widthInput.step = "64";
      widthInput.className = "st-chatu8-popup-size-input";
      widthRow.appendChild(widthLabel);
      widthRow.appendChild(widthInput);
      const heightRow = doc.createElement("div");
      heightRow.className = "st-chatu8-popup-size-row";
      const heightLabel = doc.createElement("label");
      heightLabel.textContent = "\u9AD8\u5EA6";
      heightLabel.className = "st-chatu8-popup-size-label";
      heightInput = doc.createElement("input");
      heightInput.type = "number";
      heightInput.value = currentHeight;
      heightInput.min = "64";
      heightInput.max = "4096";
      heightInput.step = "64";
      heightInput.className = "st-chatu8-popup-size-input";
      heightRow.appendChild(heightLabel);
      heightRow.appendChild(heightInput);
      const swapRow = doc.createElement("div");
      swapRow.className = "st-chatu8-popup-size-row swap-row";
      const swapBtn = doc.createElement("button");
      swapBtn.type = "button";
      swapBtn.innerHTML = "\u21C5 \u5BF9\u8C03\u5BBD\u9AD8";
      swapBtn.className = "st-chatu8-popup-swap-btn";
      swapBtn.onclick = () => {
        const temp = widthInput.value;
        widthInput.value = heightInput.value;
        heightInput.value = temp;
      };
      swapRow.appendChild(swapBtn);
      formSection.appendChild(widthRow);
      formSection.appendChild(heightRow);
      formSection.appendChild(swapRow);
    }
    const buttonContainer = doc.createElement("div");
    buttonContainer.className = "st-chatu8-popup-buttons";
    const cancelBtn = doc.createElement("button");
    cancelBtn.textContent = "\u53D6\u6D88";
    cancelBtn.className = "st-chatu8-popup-btn-cancel";
    const confirmBtn = doc.createElement("button");
    confirmBtn.textContent = "\u786E\u5B9A\u5E76\u751F\u6210";
    confirmBtn.className = "st-chatu8-popup-btn-confirm";
    const closePopup = (result) => {
      overlay2.classList.add("closing");
      setTimeout(() => {
        overlay2.remove();
        resolve(result);
      }, 150);
    };
    cancelBtn.addEventListener("click", () => closePopup(null));
    confirmBtn.addEventListener("click", () => {
      if (mode === "banana") {
        button.dataset.aspectRatio = widthInput.value;
        closePopup({ aspectRatio: widthInput.value });
      } else {
        const newWidth = widthInput.value.trim();
        const newHeight = heightInput.value.trim();
        button.dataset.width = newWidth;
        button.dataset.height = newHeight;
        closePopup({ width: newWidth, height: newHeight });
      }
    });
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        closePopup(null);
        doc.removeEventListener("keydown", handleKeydown);
      } else if (e.key === "Enter") {
        confirmBtn.click();
        doc.removeEventListener("keydown", handleKeydown);
      }
    };
    doc.addEventListener("keydown", handleKeydown);
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    bubble.appendChild(title);
    bubble.appendChild(hint);
    bubble.appendChild(formSection);
    bubble.appendChild(buttonContainer);
    overlay2.appendChild(bubble);
    doc.body.appendChild(overlay2);
    setTimeout(() => widthInput?.focus(), 100);
  });
}

function showBananaRetouchDialog(originalImgElement, originalButton) {
  const originalImageUrl = originalImgElement.src;
  let currentRetouchImage = originalImageUrl;
  const isMobile3 = isMobileDeviceDialog();
  const { backdrop, dialog, closeDialog } = createUnifiedDialog({
    title: "Banana \u4FEE\u56FE",
    isMobile: isMobile3
  });
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  const imageContainer = document.createElement("div");
  imageContainer.style.position = "relative";
  imageContainer.style.display = "flex";
  imageContainer.style.justifyContent = "center";
  imageContainer.style.alignItems = "center";
  imageContainer.style.margin = "0 auto 15px auto";
  imageContainer.style.cursor = "pointer";
  imageContainer.style.borderRadius = "8px";
  imageContainer.style.overflow = "hidden";
  imageContainer.style.maxWidth = "100%";
  imageContainer.title = "\u70B9\u51FB\u6216\u5C06\u56FE\u7247\u62D6\u62FD\u81F3\u6B64\uFF0C\u53EF\u66F4\u6362\u4E3A\u672C\u5730\u56FE\u7247";
  const imagePreview = document.createElement("img");
  imagePreview.src = currentRetouchImage;
  imagePreview.style.display = "block";
  imagePreview.style.maxWidth = "100%";
  imagePreview.style.maxHeight = "30vh";
  imagePreview.style.objectFit = "contain";
  imagePreview.style.borderRadius = "8px";
  imagePreview.style.transition = "filter 0.2s ease";
  const hoverOverlay = document.createElement("div");
  hoverOverlay.style.position = "absolute";
  hoverOverlay.style.inset = "0";
  hoverOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.45)";
  hoverOverlay.style.display = "flex";
  hoverOverlay.style.flexDirection = "column";
  hoverOverlay.style.justifyContent = "center";
  hoverOverlay.style.alignItems = "center";
  hoverOverlay.style.color = "#fff";
  hoverOverlay.style.fontSize = "14px";
  hoverOverlay.style.fontWeight = "bold";
  hoverOverlay.style.opacity = "0";
  hoverOverlay.style.transition = "opacity 0.2s ease";
  hoverOverlay.style.pointerEvents = "none";
  hoverOverlay.innerHTML = `
        <i class="fa-solid fa-camera-retro" style="font-size: 24px; margin-bottom: 6px;"></i>
        <span>\u70B9\u51FB\u66F4\u6362\u672C\u5730\u56FE\u7247</span>
    `;
  const resetButton = document.createElement("button");
  resetButton.innerHTML = '<i class="fa-solid fa-rotate-left"></i> \u6062\u590D\u539F\u56FE';
  resetButton.style.position = "absolute";
  resetButton.style.top = "8px";
  resetButton.style.right = "8px";
  resetButton.style.backgroundColor = "rgba(0,0,0,0.65)";
  resetButton.style.color = "#fff";
  resetButton.style.border = "1px solid rgba(255,255,255,0.3)";
  resetButton.style.borderRadius = "4px";
  resetButton.style.padding = "4px 8px";
  resetButton.style.fontSize = "12px";
  resetButton.style.cursor = "pointer";
  resetButton.style.display = "none";
  resetButton.style.zIndex = "5";
  resetButton.addEventListener("click", (e) => {
    e.stopPropagation();
    currentRetouchImage = originalImageUrl;
    imagePreview.src = originalImageUrl;
    resetButton.style.display = "none";
    toastr.info("\u5DF2\u6062\u590D\u4E3A\u539F\u59CB\u56FE\u7247");
  });
  imageContainer.addEventListener("mouseenter", () => {
    hoverOverlay.style.opacity = "1";
    imagePreview.style.filter = "brightness(0.8)";
  });
  imageContainer.addEventListener("mouseleave", () => {
    hoverOverlay.style.opacity = "0";
    imagePreview.style.filter = "none";
  });
  imageContainer.addEventListener("click", () => {
    fileInput.click();
  });
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toastr.warning("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u56FE\u7247\u6587\u4EF6\uFF01");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentRetouchImage = e.target.result;
      imagePreview.src = currentRetouchImage;
      resetButton.style.display = "block";
      toastr.success("\u5DF2\u66F4\u6362\u4E3A\u672C\u5730\u56FE\u7247");
    };
    reader.onerror = () => {
      toastr.error("\u8BFB\u53D6\u672C\u5730\u56FE\u7247\u5931\u8D25");
    };
    reader.readAsDataURL(file);
  };
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    fileInput.value = "";
  });
  imageContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hoverOverlay.style.opacity = "1";
  });
  imageContainer.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hoverOverlay.style.opacity = "0";
  });
  imageContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hoverOverlay.style.opacity = "0";
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  });
  imageContainer.appendChild(imagePreview);
  imageContainer.appendChild(hoverOverlay);
  imageContainer.appendChild(resetButton);
  const input = createUnifiedInput({
    placeholder: '\u8F93\u5165\u4FEE\u56FE\u6307\u4EE4\uFF0C\u4F8B\u5982\uFF1A"\u7ED9\u4EBA\u7269\u6362\u4E0A\u7EA2\u8272\u7684\u8FDE\u8863\u88D9"',
    value: originalButton.dataset.retouchPrompt || "",
    rows: 2
  });
  const handleSend2 = () => {
    const retouchPrompt = input.value.trim();
    if (!retouchPrompt) {
      toastr.warning("\u8BF7\u8F93\u5165\u4FEE\u56FE\u6307\u4EE4\u3002");
      return;
    }
    originalButton.dataset.retouchPrompt = retouchPrompt;
    originalButton.dataset.retouchImage = currentRetouchImage;
    if (!originalButton.dataset.change) {
      originalButton.dataset.change = originalButton.dataset.link;
    }
    originalButton.dataset.change = `${originalButton.dataset.change}{\u4FEE\u56FE}`;
    toastr.info("\u6B63\u5728\u51C6\u5907\u4FEE\u56FE\u751F\u6210...");
    if (_triggerGeneration2) {
      _triggerGeneration2(originalButton);
    }
    closeDialog();
  };
  const buttonContainer = createButtonContainer([
    {
      text: "\u53D1\u9001",
      className: "send",
      onClick: handleSend2
    },
    {
      text: "\u53D6\u6D88",
      className: "cancel",
      onClick: closeDialog
    }
  ]);
  dialog.appendChild(fileInput);
  dialog.appendChild(imageContainer);
  dialog.appendChild(input);
  dialog.appendChild(buttonContainer);
  input.focus();
}

function showEditDialog(img, button) {
  const doc = window.top.document;
  const imageTag = button.dataset.change !== void 0 && button.dataset.change !== null && button.dataset.change !== "" ? button.dataset.change : button.dataset.link || "";
  const videoTag = button.dataset.video || "";
  let currentMode2 = button.dataset.activeMode || (videoTag && !button.dataset.change ? "video" : "image");
  let imageText = imageTag.replace(/\\n/g, "\n");
  let videoText = videoTag ? videoTag.replace(/\\n/g, "\n") : "";
  if (currentMode2 === "video" && !videoText && /asset_manifest\s*:/i.test(imageText)) {
    videoText = imageText;
  }
  const styleId = "st-chatu8-autocomplete-styles";
  if (!doc.getElementById(styleId)) {
    const style = doc.createElement("style");
    style.id = styleId;
    style.innerHTML = `
            /* Dialog Styles - scoped to edit backdrop */
            .st-chatu8-edit-backdrop .st-chatu8-edit-dialog {
                background-color: var(--st-chatu8-bg-primary);
                color: var(--st-chatu8-text-primary);
                border: 1px solid var(--st-chatu8-border-color);
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                border-radius: 12px;
                padding: 20px;
                resize: both;
                overflow-x: hidden;
                overflow-y: auto;
                min-width: 300px;
                min-height: 200px;
                max-width: 90vw;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
            }
            
            /* \u79FB\u52A8\u7AEF\u589E\u5927\u6EDA\u52A8\u6761\u5BBD\u5EA6 */
            @media (max-width: 768px) {
                .st-chatu8-edit-backdrop .st-chatu8-edit-dialog::-webkit-scrollbar {
                    width: 16px;
                    height: 16px;
                }
                .st-chatu8-edit-backdrop .st-chatu8-edit-dialog::-webkit-scrollbar-track {
                    background: var(--st-chatu8-bg-secondary, #1a1a2a);
                    border-radius: 8px;
                }
                .st-chatu8-edit-backdrop .st-chatu8-edit-dialog::-webkit-scrollbar-thumb {
                    background: var(--st-chatu8-accent-primary, #4a4a8a);
                    border-radius: 8px;
                    border: 2px solid var(--st-chatu8-bg-secondary, #1a1a2a);
                }
                .st-chatu8-edit-backdrop .st-chatu8-edit-dialog::-webkit-scrollbar-thumb:hover {
                    background: var(--st-chatu8-accent-secondary, #6a6aaa);
                }
            }
            
            .st-chatu8-edit-backdrop .st-chatu8-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                flex-wrap: wrap;
                gap: 8px;
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-title {
                color: var(--st-chatu8-text-primary);
                font-size: 1.2em;
                font-weight: bold;
                margin: 0;
            }
            .st-chatu8-edit-backdrop .st-chatu8-mode-switch {
                display: inline-flex;
                background: var(--st-chatu8-bg-secondary, #1e1e2e);
                border: 1px solid var(--st-chatu8-border-color, #444);
                border-radius: 20px;
                padding: 3px;
                gap: 4px;
            }
            .st-chatu8-edit-backdrop .st-chatu8-mode-tab {
                background: transparent;
                color: var(--st-chatu8-text-secondary, #aaa);
                border: none;
                border-radius: 16px;
                padding: 4px 12px;
                font-size: 0.85em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .st-chatu8-edit-backdrop .st-chatu8-mode-tab:hover {
                color: var(--st-chatu8-text-primary, #fff);
                background: rgba(255, 255, 255, 0.05);
            }
            .st-chatu8-edit-backdrop .st-chatu8-mode-tab.active {
                background: var(--st-chatu8-accent-primary, #4a4a8a);
                color: #ffffff;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
            }
            .st-chatu8-edit-backdrop .st-chatu8-mode-tab-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #4ade80;
                display: inline-block;
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-input {
                background-color: var(--st-chatu8-input-bg);
                color: var(--st-chatu8-input-text);
                border: 1px solid var(--st-chatu8-input-border);
                border-radius: 6px;
                padding: 10px;
                width: 100%;
                box-sizing: border-box;
                min-height: 100px;
                flex: 1 1 auto;
                resize: both;
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-buttons {
                margin-top: 14px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                width: 100%;
                box-sizing: border-box;
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-button-row {
                display: flex;
                justify-content: center;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
                width: 100%;
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-button {
                border-radius: 6px;
                padding: 5px 11px;
                font-weight: bold;
                cursor: pointer;
                border: none;
                font-size: 0.88em;
                line-height: 1.4;
                white-space: nowrap;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-button:active {
                transform: translateY(0);
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-button.send {
                background-color: var(--st-chatu8-accent-primary);
                color: white;
            }
            .st-chatu8-edit-backdrop .st-chatu8-edit-button.cancel {
                background-color: var(--st-chatu8-bg-secondary);
                color: var(--st-chatu8-text-secondary);
            }

            /* Autocomplete Styles - scoped to edit backdrop only */
            .st-chatu8-edit-backdrop .ch-autocomplete-results {
                display: none;
                position: absolute;
                background-color: var(--st-chatu8-dropdown-list-bg);
                border: 1px solid var(--st-chatu8-border-color);
                border-radius: 6px;
                max-height: 150px;
                overflow-y: auto;
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                max-width: 100%;
            }
            .st-chatu8-edit-backdrop .ch-autocomplete-item {
                padding: 8px 12px;
                cursor: pointer;
                color: var(--st-chatu8-dropdown-text);
                font-size: 0.9em;
            }
            .st-chatu8-edit-backdrop .ch-autocomplete-item:hover {
                background-color: var(--st-chatu8-accent-secondary);
                color: var(--st-chatu8-text-highlight);
            }
        `;
    doc.head.appendChild(style);
  }
  doc.querySelector(".st-chatu8-edit-backdrop")?.remove();
  const resultsEl = doc.createElement("div");
  resultsEl.className = "ch-autocomplete-results";
  let originalDialogHeight = null;
  const expandDialogForAutocomplete = () => {
    return;
  };
  const restoreDialogSize = () => {
    return;
  };
  resultsEl.restoreDialogSize = restoreDialogSize;
  const updateResultsPosition = () => {
    if (resultsEl.style.display === "none") {
      restoreDialogSize();
      return;
    }
    resultsEl.style.top = `${input.offsetTop + input.offsetHeight + 2}px`;
    resultsEl.style.left = `${input.offsetLeft}px`;
    resultsEl.style.width = `${input.offsetWidth}px`;
    expandDialogForAutocomplete();
  };
  const syncCurrentInputToDataset = () => {
    if (!input) return;
    const formatted = input.value.trim().replace(/\n/g, "\\n");
    if (currentMode2 === "image") {
      imageText = input.value;
      button.dataset.change = formatted;
      if (button.dataset.link) {
        updateItemImgChange(button.dataset.link, formatted);
      }
    } else {
      videoText = input.value;
      button.dataset.video = formatted;
      if (button.dataset.link) {
        updateItemImgVideo(button.dataset.link, formatted);
      }
    }
    button.dataset.activeMode = currentMode2;
    button.textContent = currentMode2 === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
    if (button.dataset.link) {
      updateItemImgActiveMode(button.dataset.link, currentMode2);
    }
  };
  const closeDialog = () => {
    try {
      syncCurrentInputToDataset();
    } catch (e) {
      console.warn("[closeDialog] \u540C\u6B65\u8F93\u5165\u6846\u5185\u5BB9\u5931\u8D25:", e);
    }
    backdrop.remove();
  };
  const backdrop = doc.createElement("div");
  backdrop.className = "st-chatu8-edit-backdrop";
  const dialog = doc.createElement("div");
  dialog.className = "st-chatu8-edit-dialog";
  dialog.style.position = "relative";
  dialog.addEventListener("click", (e) => e.stopPropagation());
  const isMobile3 = window.top.innerWidth <= 768;
  let topMargin = 10;
  if (isMobile3) {
    const topSettingsHolder = doc.querySelector("#top-settings-holder");
    const topBar = doc.querySelector("#top-bar");
    const topButton = (
      /** @type {HTMLElement | null} */
      window.top.document.querySelector("#ai-config-button")
    );
    let topBottom = 0;
    if (topSettingsHolder) {
      const r = topSettingsHolder.getBoundingClientRect();
      if (r.bottom > 0) topBottom = Math.max(topBottom, r.bottom);
    }
    if (topBar) {
      const r = topBar.getBoundingClientRect();
      if (r.bottom > 0) topBottom = Math.max(topBottom, r.bottom);
    }
    if (topButton && topBottom <= 0) {
      topBottom = topButton.offsetHeight || 0;
    }
    topMargin = (topBottom || 40) + 10;
    backdrop.style.alignItems = "flex-start";
    dialog.style.marginTop = `${topMargin}px`;
  }
  const bottomEl = doc.querySelector("#form_sheld") || doc.querySelector("#send_form") || doc.querySelector("#send_textarea");
  if (bottomEl) {
    const rect = bottomEl.getBoundingClientRect();
    const maxHeight = Math.max(200, rect.top - topMargin - 20);
    dialog.style.maxHeight = `${maxHeight}px`;
    dialog.style.overflowY = "auto";
    if (isMobile3) {
      dialog.style.height = `${maxHeight}px`;
    }
  }
  const headerContainer = doc.createElement("div");
  headerContainer.className = "st-chatu8-dialog-header";
  const title = doc.createElement("div");
  title.className = "st-chatu8-edit-title";
  title.textContent = currentMode2 === "video" ? "\u7F16\u8F91\u89C6\u9891\u6807\u7B7E" : "\u7F16\u8F91\u56FE\u7247\u6807\u7B7E";
  const modeSwitch = doc.createElement("div");
  modeSwitch.className = "st-chatu8-mode-switch";
  const imageTab = doc.createElement("button");
  imageTab.type = "button";
  imageTab.className = `st-chatu8-mode-tab image-tab ${currentMode2 === "image" ? "active" : ""}`;
  imageTab.innerHTML = "\u{1F5BC}\uFE0F \u56FE\u7247\u6807\u7B7E";
  const videoTab = doc.createElement("button");
  videoTab.type = "button";
  videoTab.className = `st-chatu8-mode-tab video-tab ${currentMode2 === "video" ? "active" : ""}`;
  videoTab.innerHTML = "\u{1F3AC} \u89C6\u9891\u6807\u7B7E";
  const updateTabIndicators = () => {
    const hasImageContent = !!(imageText && imageText.trim() && imageText !== button.dataset.link);
    const hasVideoContent = !!(videoText && videoText.trim());
    imageTab.innerHTML = `\u{1F5BC}\uFE0F \u56FE\u7247\u6807\u7B7E${hasImageContent ? '<span class="st-chatu8-mode-tab-dot"></span>' : ""}`;
    videoTab.innerHTML = `\u{1F3AC} \u89C6\u9891\u6807\u7B7E${hasVideoContent ? '<span class="st-chatu8-mode-tab-dot"></span>' : ""}`;
  };
  updateTabIndicators();
  modeSwitch.appendChild(imageTab);
  modeSwitch.appendChild(videoTab);
  headerContainer.appendChild(title);
  headerContainer.appendChild(modeSwitch);
  const inputContainer = doc.createElement("div");
  inputContainer.style.position = "relative";
  inputContainer.style.width = "100%";
  const inputBackdrop = doc.createElement("div");
  inputBackdrop.className = "st-chatu8-edit-input st-chatu8-edit-input-backdrop";
  inputBackdrop.style.position = "absolute";
  inputBackdrop.style.top = "0";
  inputBackdrop.style.left = "0";
  inputBackdrop.style.width = "100%";
  inputBackdrop.style.height = "100%";
  inputBackdrop.style.color = "var(--st-chatu8-input-text, #f0f0f0)";
  inputBackdrop.style.pointerEvents = "none";
  inputBackdrop.style.zIndex = "1";
  inputBackdrop.style.margin = "0";
  inputBackdrop.style.setProperty("font-family", "inherit", "important");
  inputBackdrop.style.setProperty("font-size", "inherit", "important");
  inputBackdrop.style.setProperty("line-height", "1.5", "important");
  inputBackdrop.style.setProperty("letter-spacing", "normal", "important");
  inputBackdrop.style.setProperty("word-spacing", "normal", "important");
  inputBackdrop.style.setProperty("white-space", "pre-wrap", "important");
  inputBackdrop.style.setProperty("word-break", "break-word", "important");
  const input = doc.createElement("textarea");
  input.id = "st-chatu8-edit-input";
  input.className = "st-chatu8-edit-input";
  input.value = currentMode2 === "video" ? videoText : imageText;
  input.style.position = "relative";
  input.style.zIndex = "2";
  input.style.setProperty("margin", "0", "important");
  input.style.setProperty("font-family", "inherit", "important");
  input.style.setProperty("font-size", "inherit", "important");
  input.style.setProperty("line-height", "1.5", "important");
  input.style.setProperty("letter-spacing", "normal", "important");
  input.style.setProperty("word-spacing", "normal", "important");
  input.style.setProperty("white-space", "pre-wrap", "important");
  input.style.setProperty("word-break", "break-word", "important");
  input.style.setProperty("background-color", "transparent", "important");
  input.style.setProperty("color", "transparent", "important");
  input.style.setProperty("-webkit-text-fill-color", "transparent", "important");
  input.style.setProperty("text-shadow", "none", "important");
  input.style.caretColor = "var(--st-chatu8-input-text, #f0f0f0)";
  const escapeHTML3 = (str) => str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);
  const updateBackdrop = () => {
    let rawText = input.value;
    let htmlText = "";
    let lastIndex = 0;
    const regex = /\$([^$]+)\$/g;
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      const fullMatch = match[0];
      htmlText += escapeHTML3(rawText.substring(lastIndex, match.index));
      const processed = processCharacterPrompt(fullMatch);
      if (typeof processed === "string" && processed !== fullMatch) {
        htmlText += `<span class="st-chatu8-highlight-match">${escapeHTML3(fullMatch)}</span>`;
      } else {
        htmlText += `<span class="st-chatu8-highlight-error">${escapeHTML3(fullMatch)}</span>`;
      }
      lastIndex = regex.lastIndex;
    }
    htmlText += escapeHTML3(rawText.substring(lastIndex));
    if (rawText.endsWith("\n")) {
      htmlText += "\u200B";
    }
    inputBackdrop.innerHTML = htmlText;
    inputBackdrop.scrollTop = input.scrollTop;
    inputBackdrop.scrollLeft = input.scrollLeft;
  };
  input.addEventListener("input", updateBackdrop);
  input.addEventListener("scroll", () => {
    inputBackdrop.scrollTop = input.scrollTop;
    inputBackdrop.scrollLeft = input.scrollLeft;
  });
  updateBackdrop();
  inputContainer.appendChild(inputBackdrop);
  inputContainer.appendChild(input);
  const switchMode = async (targetMode, options = {}) => {
    const { skipCurrentSync = false, newContent = null } = options;
    if (currentMode2 === targetMode && newContent === null) return;
    if (!skipCurrentSync && currentMode2 !== targetMode) {
      if (currentMode2 === "image") {
        imageText = input.value;
        const formatted = input.value.trim().replace(/\n/g, "\\n");
        button.dataset.change = formatted;
        if (button.dataset.link) {
          updateItemImgChange(button.dataset.link, formatted);
        }
      } else {
        videoText = input.value;
        const formatted = input.value.trim().replace(/\n/g, "\\n");
        button.dataset.video = formatted;
        if (button.dataset.link) {
          updateItemImgVideo(button.dataset.link, formatted);
        }
      }
    }
    if (newContent !== null && typeof newContent === "string") {
      const displayContent = newContent.replace(/\\n/g, "\n");
      const formatted = displayContent.trim().replace(/\n/g, "\\n");
      if (targetMode === "video") {
        videoText = displayContent;
        button.dataset.video = formatted;
        if (button.dataset.link) {
          updateItemImgVideo(button.dataset.link, formatted);
        }
      } else {
        imageText = displayContent;
        button.dataset.change = formatted;
        if (button.dataset.link) {
          updateItemImgChange(button.dataset.link, formatted);
        }
      }
    } else if (targetMode === "video" && !videoText && /asset_manifest\s*:/i.test(imageText)) {
      videoText = imageText;
      const formatted = videoText.trim().replace(/\n/g, "\\n");
      button.dataset.video = formatted;
      if (button.dataset.link) {
        updateItemImgVideo(button.dataset.link, formatted);
      }
    }
    currentMode2 = targetMode;
    button.dataset.activeMode = targetMode;
    if (button.dataset.link) {
      updateItemImgActiveMode(button.dataset.link, targetMode);
    }
    imageTab.classList.toggle("active", currentMode2 === "image");
    videoTab.classList.toggle("active", currentMode2 === "video");
    title.textContent = currentMode2 === "video" ? "\u7F16\u8F91\u89C6\u9891\u6807\u7B7E" : "\u7F16\u8F91\u56FE\u7247\u6807\u7B7E";
    if (typeof sendButton !== "undefined" && sendButton) {
      sendButton.textContent = currentMode2 === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
    }
    if (typeof renderActionButtons !== "undefined") {
      renderActionButtons();
    }
    button.textContent = currentMode2 === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
    input.value = currentMode2 === "video" ? videoText : imageText;
    updateTabIndicators();
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight + 5}px`;
    input.scrollTop = 0;
    input.scrollLeft = 0;
    inputBackdrop.scrollTop = 0;
    inputBackdrop.scrollLeft = 0;
    if (dialog) {
      dialog.scrollTop = 0;
      dialog.scrollLeft = 0;
    }
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(0, 0);
    }
    updateBackdrop();
    if (typeof debouncedUpdateDialogTokens === "function") debouncedUpdateDialogTokens();
  };
  const setVideoContentSafe = async (videoContent) => {
    if (currentMode2 === "image") {
      imageText = input.value;
      const formatted = input.value.trim().replace(/\n/g, "\\n");
      button.dataset.change = formatted;
      if (button.dataset.link) {
        updateItemImgChange(button.dataset.link, formatted);
      }
    }
    await switchMode("video", { skipCurrentSync: true, newContent: videoContent });
  };
  imageTab.onclick = () => switchMode("image");
  videoTab.onclick = () => switchMode("video");
  if (button.dataset.link) {
    getItemMeta(button.dataset.link).then((meta) => {
      if (meta) {
        let updated = false;
        if (meta.video && !button.dataset.video) {
          button.dataset.video = meta.video;
          videoText = meta.video.replace(/\\n/g, "\n");
          updated = true;
        }
        if (meta.change && !button.dataset.change) {
          button.dataset.change = meta.change;
          imageText = meta.change.replace(/\\n/g, "\n");
          updated = true;
        }
        if (meta.activeMode && !button.dataset.activeMode) {
          button.dataset.activeMode = meta.activeMode;
          currentMode2 = meta.activeMode;
          updated = true;
        }
        if (updated) {
          updateTabIndicators();
          if (currentMode2 === "video") {
            imageTab.classList.remove("active");
            videoTab.classList.add("active");
            title.textContent = "\u7F16\u8F91\u89C6\u9891\u6807\u7B7E";
            if (typeof sendButton !== "undefined" && sendButton) {
              sendButton.textContent = "\u751F\u6210\u89C6\u9891";
            }
            button.textContent = "\u751F\u6210\u89C6\u9891";
            input.value = videoText;
          } else {
            input.value = imageText;
          }
          updateBackdrop();
          if (typeof debouncedUpdateDialogTokens === "function") debouncedUpdateDialogTokens();
        }
      }
    }).catch((e) => console.warn("[showEditDialog] \u5F02\u6B65\u56DE\u586B\u5143\u6570\u636E\u5931\u8D25:", e));
  }
  const buttonContainer = doc.createElement("div");
  buttonContainer.className = "st-chatu8-edit-buttons";
  const primaryButtonRow = doc.createElement("div");
  primaryButtonRow.className = "st-chatu8-edit-button-row primary";
  const secondaryButtonRow = doc.createElement("div");
  secondaryButtonRow.className = "st-chatu8-edit-button-row secondary";
  const tagActionsContainer = doc.createElement("div");
  tagActionsContainer.className = "st-chatu8-tag-actions-container";
  tagActionsContainer.style.cssText = "position: relative; display: inline-block;";
  const tagActionsButton = doc.createElement("button");
  tagActionsButton.className = "st-chatu8-edit-button send";
  tagActionsButton.textContent = "Tag\u64CD\u4F5C \u25BC";
  tagActionsButton.type = "button";
  const tagActionsMenu = doc.createElement("div");
  tagActionsMenu.className = "st-chatu8-tag-actions-menu";
  tagActionsMenu.style.cssText = `
        display: none;
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 8px;
        background-color: var(--st-chatu8-bg-primary, #2a2a2a);
        border: 1px solid var(--st-chatu8-border-color, #444);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        padding: 8px;
        z-index: 100;
        min-width: 120px;
        flex-direction: column;
        gap: 6px;
    `;
  const resetButton = doc.createElement("button");
  resetButton.className = "st-chatu8-tag-action-item";
  resetButton.innerHTML = "\u{1F504} \u91CD\u7F6Etag";
  resetButton.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--st-chatu8-text-primary, #fff);
        cursor: pointer;
        font-size: 0.9em;
        text-align: left;
        transition: background-color 0.2s ease;
    `;
  resetButton.onmouseenter = () => {
    resetButton.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  resetButton.onmouseleave = () => {
    resetButton.style.backgroundColor = "transparent";
  };
  resetButton.onclick = () => {
    const originalLink = button.dataset.link || "";
    imageText = originalLink.replace(/\\n/g, "\n");
    button.dataset.change = originalLink;
    if (button.dataset.link) {
      updateItemImgChange(button.dataset.link, originalLink);
    }
    if (currentMode2 === "image") {
      input.value = imageText;
    }
    toastr.success("\u56FE\u7247Tag\u5DF2\u91CD\u7F6E");
    updateTabIndicators();
    updateBackdrop();
    tagActionsMenu.style.display = "none";
    if (typeof debouncedUpdateDialogTokens === "function") debouncedUpdateDialogTokens();
  };
  const lockTagButton = doc.createElement("button");
  lockTagButton.className = "st-chatu8-tag-action-item";
  lockTagButton.innerHTML = "\u{1F512} \u9501\u5B9Atag";
  lockTagButton.style.cssText = resetButton.style.cssText;
  lockTagButton.onmouseenter = () => {
    lockTagButton.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  lockTagButton.onmouseleave = () => {
    lockTagButton.style.backgroundColor = "transparent";
  };
  (async () => {
    const tagToCheck = button.dataset.link;
    if (tagToCheck) {
      let contextEl = button;
      while (contextEl && contextEl.tagName !== "DIV") {
        contextEl = contextEl.parentElement;
      }
      const mesText = contextEl?.closest(".mes_text") || contextEl;
      const isLocked = await isTagLocked(mesText, tagToCheck);
      if (isLocked) {
        lockTagButton.innerHTML = "\u{1F513} \u89E3\u9501tag";
      }
    }
  })();
  lockTagButton.onclick = async () => {
    tagActionsMenu.style.display = "none";
    const currentTag = button.dataset.link;
    if (!currentTag) {
      toastr.warning("\u672A\u627E\u5230 tag");
      return;
    }
    let contextEl = button;
    while (contextEl && contextEl.tagName !== "DIV") {
      contextEl = contextEl.parentElement;
    }
    const mesText = contextEl?.closest(".mes_text") || contextEl;
    const isLocked = await isTagLocked(mesText, currentTag);
    if (isLocked) {
      const result = await unlockTagForElement(mesText, currentTag);
      if (result.success) {
        toastr.success("Tag \u5DF2\u89E3\u9501");
        lockTagButton.innerHTML = "\u{1F512} \u9501\u5B9Atag";
      } else {
        toastr.warning(result.message);
      }
    } else {
      const result = await lockTagForElement(mesText, currentTag);
      if (result.success) {
        toastr.success("Tag \u5DF2\u9501\u5B9A\uFF0C\u5C06\u4E0D\u4F1A\u88AB\u8986\u76D6\u6216\u5220\u9664");
        lockTagButton.innerHTML = "\u{1F513} \u89E3\u9501tag";
      } else {
        toastr.warning(result.message);
      }
    }
  };
  const deleteTagButton = doc.createElement("button");
  deleteTagButton.className = "st-chatu8-tag-action-item";
  deleteTagButton.innerHTML = "\u{1F5D1}\uFE0F \u5220\u9664tag";
  deleteTagButton.style.cssText = resetButton.style.cssText;
  deleteTagButton.style.color = "#ff6b6b";
  deleteTagButton.onmouseenter = () => {
    deleteTagButton.style.backgroundColor = "rgba(255, 107, 107, 0.15)";
  };
  deleteTagButton.onmouseleave = () => {
    deleteTagButton.style.backgroundColor = "transparent";
  };
  deleteTagButton.onclick = async () => {
    tagActionsMenu.style.display = "none";
    const currentTag = button.dataset.link;
    if (!currentTag) {
      toastr.warning("\u672A\u627E\u5230 tag");
      return;
    }
    let contextEl = button;
    while (contextEl && contextEl.tagName !== "DIV") {
      contextEl = contextEl.parentElement;
    }
    const mesText = contextEl?.closest(".mes_text") || contextEl;
    const result = await deleteTagForElement(mesText, currentTag);
    if (result.success) {
      let containerToRemove = button.closest(".st-chatu8-collapse-wrapper");
      if (!containerToRemove) {
        containerToRemove = button.closest(".st-chatu8-image-span");
      }
      if (!containerToRemove) {
        containerToRemove = button.closest(".st-chatu8-image-container");
      }
      if (containerToRemove) {
        containerToRemove.remove();
        console.log("[dialogs] Removed DOM container for deleted tag");
      } else {
        button.remove();
        console.log("[dialogs] Removed button for deleted tag");
      }
      toastr.success(result.message);
      closeDialog();
    } else {
      toastr.warning(result.message);
    }
  };
  const positionEditButton = doc.createElement("button");
  positionEditButton.className = "st-chatu8-tag-action-item";
  positionEditButton.innerHTML = "\u{1F4CD} \u4F4D\u7F6E\u7F16\u8F91";
  positionEditButton.style.cssText = resetButton.style.cssText;
  positionEditButton.onmouseenter = () => {
    positionEditButton.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  positionEditButton.onmouseleave = () => {
    positionEditButton.style.backgroundColor = "transparent";
  };
  positionEditButton.onclick = () => {
    tagActionsMenu.style.display = "none";
    openPositionEditorDialog({
      input,
      button,
      doc,
      onApply: ({ updatedValue }) => {
        if (currentMode2 === "image") {
          imageText = updatedValue;
        } else {
          videoText = updatedValue;
        }
        updateBackdrop();
        if (typeof debouncedUpdateDialogTokens === "function") debouncedUpdateDialogTokens();
      }
    });
  };
  tagActionsMenu.appendChild(resetButton);
  tagActionsMenu.appendChild(positionEditButton);
  tagActionsMenu.appendChild(lockTagButton);
  tagActionsMenu.appendChild(deleteTagButton);
  tagActionsButton.onclick = (e) => {
    e.stopPropagation();
    const isVisible = tagActionsMenu.style.display === "flex";
    tagActionsMenu.style.display = isVisible ? "none" : "flex";
  };
  doc.addEventListener("click", (e) => {
    if (!tagActionsContainer.contains(e.target)) {
      tagActionsMenu.style.display = "none";
    }
  }, { once: false });
  tagActionsContainer.appendChild(tagActionsButton);
  tagActionsContainer.appendChild(tagActionsMenu);
  const translateButton = doc.createElement("button");
  translateButton.className = "st-chatu8-edit-button send";
  translateButton.textContent = "\u7FFB\u8BD1";
  translateButton.onclick = async () => {
    try {
      translateButton.disabled = true;
      const originalVal = input.value || "";
      const cleaned = stripChineseAnnotations(originalVal).replace(/，/g, ",").replace(/[\r\n]+/g, ",");
      const smartSplitForTranslation = (text) => {
        const result = [];
        let current = "";
        let insideDollar = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === "$") {
            insideDollar = !insideDollar;
            current += char;
          } else if ((char === "," || char === "\uFF0C") && !insideDollar) {
            const trimmed = current.trim();
            if (trimmed) result.push(trimmed);
            current = "";
          } else {
            current += char;
          }
        }
        if (current.trim()) result.push(current.trim());
        return result;
      };
      const shouldSkipTag = (tag) => {
        return tag.startsWith("$") && tag.endsWith("$");
      };
      let tokens = [];
      if (cleaned.includes("Scene Composition")) {
        const parsed = parsePromptStringWithCoordinates(cleaned);
        const charIds = getSortedCharacterIds(parsed);
        const keys = ["Scene Composition"];
        charIds.forEach((id) => {
          keys.push(`Character ${id} Prompt`, `Character ${id} UC`);
        });
        keys.forEach((k) => {
          const v = parsed?.[k];
          if (typeof v === "string" && v.trim()) {
            smartSplitForTranslation(v).forEach((t) => {
              if (t && !shouldSkipTag(t)) {
                tokens.push(t);
              }
            });
          }
        });
      } else {
        tokens = [];
        let currentToken = "";
        let insideDollar = false;
        for (let i = 0; i < cleaned.length; i++) {
          const char = cleaned[i];
          if (char === "$") {
            insideDollar = !insideDollar;
            currentToken += char;
          } else if (char === "," && !insideDollar) {
            const trimmed = currentToken.trim();
            if (trimmed) tokens.push(trimmed);
            currentToken = "";
          } else {
            currentToken += char;
          }
        }
        const lastToken = currentToken.trim();
        if (lastToken) tokens.push(lastToken);
        tokens = tokens.filter((t) => !t.startsWith("$") || !t.endsWith("$"));
      }
      tokens = Array.from(new Set(tokens));
      if (tokens.length === 0) {
        toastr.info("\u6CA1\u6709\u53EF\u7FFB\u8BD1\u7684\u6807\u7B7E\u3002");
        translateButton.disabled = false;
        return;
      }
      const cleanTagForTranslation3 = (tag) => {
        return tag.replace(/^[\{\[\(\<]+|[\}\]\)\>]+$/g, "").replace(/^\{+|\}+$/g, "").replace(/:[\d.]+$/, "").trim();
      };
      const cleanedTokensForAI = [];
      for (const t of tokens) {
        const cleanedTag = cleanTagForTranslation3(t);
        if (cleanedTag) {
          cleanedTokensForAI.push(cleanedTag);
        }
      }
      const textToTranslate = tagsToJsonString(Array.from(new Set(cleanedTokensForAI)));
      const resp = await callTranslation(textToTranslate);
      const map = parseTranslationResult(resp);
      console.log("[\u7FFB\u8BD1\u8C03\u8BD5] \u89E3\u6790\u540E\u7684 map:", map);
      const smartSplit = (text) => {
        const result = [];
        let current = "";
        let insideDollar = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === "$") {
            insideDollar = !insideDollar;
            current += char;
          } else if ((char === "," || char === ";") && !insideDollar) {
            result.push({ token: current.trim(), sep: char });
            current = "";
          } else {
            current += char;
          }
        }
        if (current.trim()) result.push({ token: current.trim(), sep: "" });
        return result;
      };
      const originalTokens = smartSplit(cleaned);
      console.log("[\u7FFB\u8BD1\u8C03\u8BD5] originalTokens:", originalTokens);
      let annotated = "";
      const localCleanTagForMatching = (tag) => {
        let clean = tag.replace(/^[\{\[\(\<]+|[\}\]\)\>]+$/g, "").replace(/^\{+|\}+$/g, "").replace(/:[\d.]+$/, "").trim();
        clean = clean.replace(/^(?:Scene Composition:|Character\s+\d+\s+(?:Prompt|UC|coordinates):)\s*/i, "").trim();
        clean = clean.replace(/\|centers\s*:[^;]+(?=\s*;|\s*$)/i, "").trim();
        return clean;
      };
      originalTokens.forEach((item) => {
        let t = item.token;
        let mapped = t;
        if (t.startsWith("$") && t.endsWith("$")) {
        } else if (t) {
          let coordinateSuffix = "";
          const coordMatch = t.match(/(\s*\|centers\s*:[^;]+(?=\s*;|\s*$))/i);
          if (coordMatch) {
            coordinateSuffix = coordMatch[1];
            t = t.slice(0, -coordinateSuffix.length);
          }
          const cleanedKey = localCleanTagForMatching(t);
          if (map[cleanedKey]) {
            console.log("[\u7FFB\u8BD1\u8C03\u8BD5] \u5339\u914D\u6210\u529F:", t, "(\u6E05\u7406\u540E:", cleanedKey, ") ->", map[cleanedKey]);
            mapped = `${t}\uFF08${map[cleanedKey]}\uFF09${coordinateSuffix}`;
          } else if (map[t]) {
            console.log("[\u7FFB\u8BD1\u8C03\u8BD5] \u76F4\u63A5\u5339\u914D\u6210\u529F:", t, "->", map[t]);
            mapped = `${t}\uFF08${map[t]}\uFF09${coordinateSuffix}`;
          } else {
            console.log("[\u7FFB\u8BD1\u8C03\u8BD5] \u672A\u5339\u914D:", t, "(\u6E05\u7406\u540E:", cleanedKey, ")");
            mapped = `${t}${coordinateSuffix}`;
          }
        }
        annotated += mapped + (item.sep === "," ? ", " : item.sep);
      });
      console.log("[\u7FFB\u8BD1\u8C03\u8BD5] annotated:", annotated);
      const rolePattern = /(?:Scene Composition:|Character\s+\d+\s+(?:Prompt|UC|coordinates):)/i;
      if (rolePattern.test(annotated)) {
        annotated = annotated.replace(/(?:[ \t\r\n]*)(Scene Composition:|Character\s+\d+\s+(?:Prompt|UC|coordinates):)/gi, (match, p1, offset) => {
          return offset === 0 ? p1 : `

${p1}`;
        });
        annotated = annotated.replace(/^\s+/, "").replace(/\n{3,}/g, "\n\n");
      }
      input.value = annotated;
      updateBackdrop();
      toastr.success("\u7FFB\u8BD1\u5B8C\u6210");
      if (typeof debouncedUpdateDialogTokens === "function") debouncedUpdateDialogTokens();
    } catch (e) {
      console.error("\u7F16\u8F91\u6807\u7B7E\u7FFB\u8BD1\u5931\u8D25:", e);
      alert(`\u7FFB\u8BD1\u5931\u8D25\uFF1A${e.message || e}`);
    } finally {
      translateButton.disabled = false;
    }
  };
  const sendButton = doc.createElement("button");
  sendButton.className = "st-chatu8-edit-button send";
  sendButton.textContent = currentMode2 === "video" ? "\u751F\u6210\u89C6\u9891" : "\u53D1\u9001";
  let sendPressTimer = null;
  let sendIsLongPress = false;
  const LONG_PRESS_DURATION = 500;
  const doSend = () => {
    const assetManifestRegex = /asset_manifest\s*:/i;
    const stripAssetManifest = (value) => String(value || "").replace(/asset_manifest\s*:/gi, "").trim();
    if (currentMode2 === "video") {
      const currentVideoVal = input.value.trim();
      if (!assetManifestRegex.test(currentVideoVal)) {
        toastr.warning("\u8BF7\u5148\u751F\u6210\u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD");
        return;
      }
      const formattedVideo = currentVideoVal.replace(/\n/g, "\\n");
      button.dataset.video = formattedVideo;
      button.dataset.activeMode = "video";
      button.textContent = "\u751F\u6210\u89C6\u9891";
      if (button.dataset.link) {
        updateItemImgVideo(button.dataset.link, formattedVideo);
        updateItemImgActiveMode(button.dataset.link, "video");
      }
      toastr.info("\u6B63\u5728\u53D1\u8D77\u89C6\u9891\u751F\u6210...");
      if (_triggerGeneration2) {
        _triggerGeneration2(button);
      }
      closeDialog();
      return;
    }
    toastr.info("\u6B63\u5728\u751F\u6210\u56FE\u50CF...");
    const cleanedImageValue = stripAssetManifest(input.value);
    input.value = cleanedImageValue;
    updateBackdrop();
    const newTag = cleanedImageValue.replace(/\n/g, "\\n");
    button.dataset.change = newTag;
    button.dataset.activeMode = "image";
    button.textContent = "\u751F\u6210\u56FE\u7247";
    if (button.dataset.link) {
      updateItemImgChange(button.dataset.link, newTag);
      updateItemImgActiveMode(button.dataset.link, "image");
    }
    if (_triggerGeneration2) {
      const routingSnapshot = {
        link: button.dataset.link,
        video: button.dataset.video
      };
      try {
        if (routingSnapshot.link !== void 0) button.dataset.link = stripAssetManifest(routingSnapshot.link);
        if (routingSnapshot.video !== void 0) button.dataset.video = stripAssetManifest(routingSnapshot.video);
        _triggerGeneration2(button);
      } finally {
        if (routingSnapshot.link === void 0) {
          delete button.dataset.link;
        } else {
          button.dataset.link = routingSnapshot.link;
        }
        if (routingSnapshot.video === void 0) {
          delete button.dataset.video;
        } else {
          button.dataset.video = routingSnapshot.video;
        }
      }
    }
    closeDialog();
  };
  const handleLongPress = async () => {
    sendIsLongPress = true;
    const result = await showImageSizePopup(button, input);
    if (result) {
      doSend();
    }
  };
  sendButton.addEventListener("mousedown", (e) => {
    sendIsLongPress = false;
    sendPressTimer = setTimeout(handleLongPress, LONG_PRESS_DURATION);
  });
  sendButton.addEventListener("mouseup", () => {
    clearTimeout(sendPressTimer);
    if (!sendIsLongPress) {
      doSend();
    }
  });
  sendButton.addEventListener("mouseleave", () => {
    clearTimeout(sendPressTimer);
  });
  sendButton.addEventListener("touchstart", (e) => {
    sendIsLongPress = false;
    sendPressTimer = setTimeout(handleLongPress, LONG_PRESS_DURATION);
  }, { passive: true });
  sendButton.addEventListener("touchend", (e) => {
    clearTimeout(sendPressTimer);
    if (!sendIsLongPress) {
      e.preventDefault();
      doSend();
    }
  });
  sendButton.addEventListener("touchcancel", () => {
    clearTimeout(sendPressTimer);
  });
  const cancelButton = doc.createElement("button");
  cancelButton.className = "st-chatu8-edit-button cancel";
  cancelButton.textContent = "\u53D6\u6D88";
  cancelButton.onclick = closeDialog;
  const imageProcessContainer = doc.createElement("div");
  imageProcessContainer.className = "st-chatu8-image-process-container";
  imageProcessContainer.style.cssText = "position: relative; display: inline-block;";
  const imageProcessButton = doc.createElement("button");
  imageProcessButton.className = "st-chatu8-edit-button send";
  imageProcessButton.textContent = "\u56FE\u50CF\u5904\u7406 \u25BC";
  imageProcessButton.type = "button";
  const imageProcessMenu = doc.createElement("div");
  imageProcessMenu.className = "st-chatu8-image-process-menu";
  imageProcessMenu.style.cssText = `
        display: none;
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 8px;
        background-color: var(--st-chatu8-bg-primary, #2a2a2a);
        border: 1px solid var(--st-chatu8-border-color, #444);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        padding: 8px;
        z-index: 100;
        min-width: 140px;
        flex-direction: column;
        gap: 6px;
    `;
  const menuItemStyle = `
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--st-chatu8-text-primary, #fff);
        cursor: pointer;
        font-size: 0.9em;
        text-align: left;
        transition: background-color 0.2s ease;
        white-space: nowrap;
    `;
  const bananaRetouchItem = doc.createElement("button");
  bananaRetouchItem.className = "st-chatu8-image-process-item";
  bananaRetouchItem.innerHTML = "\u{1F34C} Banana\u4FEE\u56FE";
  bananaRetouchItem.style.cssText = menuItemStyle;
  bananaRetouchItem.onmouseenter = () => {
    bananaRetouchItem.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  bananaRetouchItem.onmouseleave = () => {
    bananaRetouchItem.style.backgroundColor = "transparent";
  };
  bananaRetouchItem.onclick = () => {
    imageProcessMenu.style.display = "none";
    showBananaRetouchDialog(img, button);
    closeDialog();
  };
  const gorkVideoItem = doc.createElement("button");
  gorkVideoItem.className = "st-chatu8-image-process-item";
  gorkVideoItem.innerHTML = "\u{1F3AC} Gork\u751F\u6210\u89C6\u9891";
  gorkVideoItem.style.cssText = menuItemStyle;
  gorkVideoItem.onmouseenter = () => {
    gorkVideoItem.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  gorkVideoItem.onmouseleave = () => {
    gorkVideoItem.style.backgroundColor = "transparent";
  };
  gorkVideoItem.onclick = () => {
    imageProcessMenu.style.display = "none";
    showGorkVideoDialog(img, button);
    closeDialog();
  };
  const comfyuiInpaintItem = doc.createElement("button");
  comfyuiInpaintItem.className = "st-chatu8-image-process-item";
  comfyuiInpaintItem.innerHTML = "\u{1F3A8} ComfyUI\u5C40\u90E8\u91CD\u7ED8";
  comfyuiInpaintItem.style.cssText = menuItemStyle;
  comfyuiInpaintItem.onmouseenter = () => {
    comfyuiInpaintItem.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  comfyuiInpaintItem.onmouseleave = () => {
    comfyuiInpaintItem.style.backgroundColor = "transparent";
  };
  comfyuiInpaintItem.onclick = () => {
    imageProcessMenu.style.display = "none";
    showComfyUIInpaintDialog(img, button);
    closeDialog();
  };
  const novelaiInpaintItem = doc.createElement("button");
  novelaiInpaintItem.className = "st-chatu8-image-process-item";
  novelaiInpaintItem.innerHTML = "\u{1F3A8} NovelAI\u5C40\u90E8\u91CD\u7ED8";
  novelaiInpaintItem.style.cssText = menuItemStyle;
  novelaiInpaintItem.onmouseenter = () => {
    novelaiInpaintItem.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  novelaiInpaintItem.onmouseleave = () => {
    novelaiInpaintItem.style.backgroundColor = "transparent";
  };
  novelaiInpaintItem.onclick = () => {
    imageProcessMenu.style.display = "none";
    showNovelAIInpaintDialog(img, button);
    closeDialog();
  };
  const img2VideoItem = doc.createElement("button");
  img2VideoItem.className = "st-chatu8-image-process-item";
  img2VideoItem.innerHTML = "\u{1F3AC} \u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD";
  img2VideoItem.title = "\u70B9\u51FB\u76F4\u63A5\u53D1\u8D77\u56FE\u751F\u89C6\u9891\uFF0C\u957F\u6309\u53EF\u5F39\u51FA\u7528\u6237\u9700\u6C42\u8F93\u5165\u5F39\u7A97";
  img2VideoItem.style.cssText = menuItemStyle;
  img2VideoItem.onmouseenter = () => {
    img2VideoItem.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  img2VideoItem.onmouseleave = () => {
    img2VideoItem.style.backgroundColor = "transparent";
  };
  const triggerImg2Video = async (demandData = null) => {
    imageProcessMenu.style.display = "none";
    let targetEl = button;
    while (targetEl && targetEl.tagName !== "DIV") {
      targetEl = targetEl.parentElement;
    }
    if (targetEl) {
      const mesText = targetEl.closest(".mes_text") || targetEl.closest(".mes");
      if (mesText) targetEl = mesText;
    }
    const dialogContext = {
      input,
      updateBackdrop,
      updateTabIndicators,
      switchMode: async (targetMode, options = {}) => {
        if (targetMode === "video" && typeof options.newContent === "string") {
          await setVideoContentSafe(options.newContent);
        }
      },
      setVideoContentSafe
    };
    if (demandData) {
      dialogContext.userDemand = demandData.text || "";
      dialogContext.userUploadedImages = demandData.images || [];
    }
    await handleImageToVideoGen(targetEl, img, button, dialogContext);
  };
  let img2VideoPressTimer = null;
  let img2VideoIsLongPress = false;
  const IMG2VIDEO_LONG_PRESS_DURATION = 500;
  const handleImg2VideoLongPress = async () => {
    img2VideoIsLongPress = true;
    imageProcessMenu.style.display = "none";
    const demandResult = await showUserDemandPopup2({
      title: "\u{1F3AC} \u8F93\u5165\u89C6\u9891\u751F\u6210\u9700\u6C42",
      hint: "\u8BF7\u63CF\u8FF0\u60A8\u5E0C\u671B\u751F\u6210\u7684\u89C6\u9891\u7684\u5177\u4F53\u9700\u6C42\uFF08\u53EF\u9009\uFF09",
      placeholder: "\u4F8B\u5982\uFF1A\u6307\u5B9A\u8FD0\u955C\u673A\u4F4D\u3001\u89D2\u8272\u52A8\u4F5C\u52A8\u6001\u3001\u5149\u5F71\u7EC6\u8282\u4E0E\u6C1B\u56F4...",
      defaultText: "",
      videoAssetMode: true,
      firstFrameSrc: img?.src || ""
    });
    if (demandResult === null) {
      return;
    }
    await triggerImg2Video(demandResult);
  };
  img2VideoItem.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    img2VideoIsLongPress = false;
    img2VideoPressTimer = setTimeout(handleImg2VideoLongPress, IMG2VIDEO_LONG_PRESS_DURATION);
  });
  img2VideoItem.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return;
    clearTimeout(img2VideoPressTimer);
    if (!img2VideoIsLongPress) {
      triggerImg2Video();
    }
  });
  img2VideoItem.addEventListener("mouseleave", () => {
    clearTimeout(img2VideoPressTimer);
  });
  img2VideoItem.addEventListener("touchstart", (e) => {
    img2VideoIsLongPress = false;
    img2VideoPressTimer = setTimeout(handleImg2VideoLongPress, IMG2VIDEO_LONG_PRESS_DURATION);
  }, { passive: true });
  img2VideoItem.addEventListener("touchend", (e) => {
    clearTimeout(img2VideoPressTimer);
    if (!img2VideoIsLongPress) {
      e.preventDefault();
      triggerImg2Video();
    }
  });
  img2VideoItem.addEventListener("touchcancel", () => {
    clearTimeout(img2VideoPressTimer);
  });
  img2VideoItem.addEventListener("click", (e) => {
    e.preventDefault();
  });
  const menuGrokVideoItem = doc.createElement("button");
  menuGrokVideoItem.className = "st-chatu8-image-process-item";
  menuGrokVideoItem.innerHTML = "\u{1F3AC} Grok\u89C6\u9891";
  menuGrokVideoItem.style.cssText = menuItemStyle;
  menuGrokVideoItem.onmouseenter = () => {
    menuGrokVideoItem.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  menuGrokVideoItem.onmouseleave = () => {
    menuGrokVideoItem.style.backgroundColor = "transparent";
  };
  menuGrokVideoItem.onclick = () => {
    imageProcessMenu.style.display = "none";
    showGorkVideoDialog(img, button);
    closeDialog();
  };
  const menuImg2VideoItem = doc.createElement("button");
  menuImg2VideoItem.className = "st-chatu8-image-process-item";
  menuImg2VideoItem.innerHTML = "\u{1F3AC} \u56FE\u751F\u89C6\u9891";
  menuImg2VideoItem.title = "\u70B9\u51FB\u76F4\u63A5\u53D1\u8D77\u56FE\u751F\u89C6\u9891\uFF0C\u957F\u6309\u53EF\u5F39\u51FA\u7528\u6237\u9700\u6C42\u8F93\u5165\u5F39\u7A97";
  menuImg2VideoItem.style.cssText = menuItemStyle;
  menuImg2VideoItem.onmouseenter = () => {
    menuImg2VideoItem.style.backgroundColor = "var(--st-chatu8-accent-secondary, #3a3a3a)";
  };
  menuImg2VideoItem.onmouseleave = () => {
    menuImg2VideoItem.style.backgroundColor = "transparent";
  };
  let menuImg2VideoPressTimer = null;
  let menuImg2VideoIsLongPress = false;
  menuImg2VideoItem.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    menuImg2VideoIsLongPress = false;
    menuImg2VideoPressTimer = setTimeout(handleImg2VideoLongPress, IMG2VIDEO_LONG_PRESS_DURATION);
  });
  menuImg2VideoItem.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return;
    clearTimeout(menuImg2VideoPressTimer);
    if (!menuImg2VideoIsLongPress) {
      triggerImg2Video();
    }
  });
  menuImg2VideoItem.addEventListener("mouseleave", () => {
    clearTimeout(menuImg2VideoPressTimer);
  });
  menuImg2VideoItem.addEventListener("touchstart", (e) => {
    menuImg2VideoIsLongPress = false;
    menuImg2VideoPressTimer = setTimeout(handleImg2VideoLongPress, IMG2VIDEO_LONG_PRESS_DURATION);
  }, { passive: true });
  menuImg2VideoItem.addEventListener("touchend", (e) => {
    clearTimeout(menuImg2VideoPressTimer);
    if (!menuImg2VideoIsLongPress) {
      e.preventDefault();
      triggerImg2Video();
    }
  });
  menuImg2VideoItem.addEventListener("touchcancel", () => {
    clearTimeout(menuImg2VideoPressTimer);
  });
  menuImg2VideoItem.addEventListener("click", (e) => {
    e.preventDefault();
  });
  imageProcessMenu.appendChild(bananaRetouchItem);
  imageProcessMenu.appendChild(menuGrokVideoItem);
  imageProcessMenu.appendChild(menuImg2VideoItem);
  imageProcessMenu.appendChild(comfyuiInpaintItem);
  imageProcessMenu.appendChild(novelaiInpaintItem);
  imageProcessButton.onclick = (e) => {
    e.stopPropagation();
    const isVisible = imageProcessMenu.style.display === "flex";
    imageProcessMenu.style.display = isVisible ? "none" : "flex";
  };
  doc.addEventListener("click", (e) => {
    if (!imageProcessContainer.contains(e.target)) {
      imageProcessMenu.style.display = "none";
    }
  }, { once: false });
  imageProcessContainer.appendChild(imageProcessButton);
  imageProcessContainer.appendChild(imageProcessMenu);
  const modifyTagButton = doc.createElement("button");
  modifyTagButton.className = "st-chatu8-edit-button send";
  modifyTagButton.textContent = "\u4FEE\u6539tag";
  modifyTagButton.onclick = async () => {
    let targetEl = button;
    while (targetEl && targetEl.tagName !== "DIV") {
      targetEl = targetEl.parentElement;
    }
    if (targetEl) {
      const mesText = targetEl.closest(".mes_text");
      if (mesText) {
        targetEl = mesText;
      }
    }
    if (targetEl) {
      await handleTagModifyRequest(targetEl, input.value, input, button.dataset.link, button);
    } else {
      toastr.warning("\u65E0\u6CD5\u627E\u5230\u4E0A\u4E0B\u6587\u5143\u7D20");
    }
  };
  const expandPresetButton = doc.createElement("button");
  expandPresetButton.className = "st-chatu8-edit-button send";
  expandPresetButton.textContent = "\u5C55\u5F00\u9884\u8BBE";
  expandPresetButton.onclick = () => {
    const originalValue = input.value;
    let expandedValue = processCharacterPrompt(originalValue);
    let processedValue = expandedValue;
    const rolePattern = /(?:Scene Composition:|Character\s+\d+\s+(?:Prompt|UC|coordinates):)/i;
    if (rolePattern.test(processedValue)) {
      processedValue = processedValue.replace(/;\s*/g, ";\n");
      processedValue = processedValue.replace(/(?:[ \t\r\n]*)(Scene Composition:|Character\s+\d+\s+(?:Prompt|UC|coordinates):)/gi, (match, p1, offset) => {
        return offset === 0 ? p1 : `

${p1}`;
      });
      processedValue = processedValue.replace(/^\s+/, "").replace(/\n{3,}/g, "\n\n");
    }
    if (processedValue !== originalValue) {
      input.value = processedValue;
      updateBackdrop();
      if (expandedValue !== originalValue) {
        toastr.success("\u9884\u8BBE\u5DF2\u5C55\u5F00\u5E76\u4F18\u5316\u6392\u7248");
      } else {
        toastr.success("\u5DF2\u4F18\u5316\u6392\u7248");
      }
      if (typeof debouncedUpdateDialogTokens === "function") debouncedUpdateDialogTokens();
      setTimeout(() => {
        input.style.height = "auto";
        input.style.height = `${input.scrollHeight + 5}px`;
      }, 0);
    } else {
      toastr.info("\u672A\u53D1\u73B0\u53EF\u5C55\u5F00\u7684\u9884\u8BBE\u6807\u8BB0\u6216\u65E0\u9700\u6392\u7248");
    }
  };
  const tokenDisplayContainer = doc.createElement("div");
  tokenDisplayContainer.className = "st-chatu8-token-display-panel";
  tokenDisplayContainer.style.cssText = "font-size: 0.85em; color: inherit; opacity: 0.8; font-weight: 600; padding: 4px; display: flex; justify-content: space-between; margin-top: 4px; display: none;";
  const positiveTokensSpan = doc.createElement("span");
  positiveTokensSpan.id = "dialog-positive-tokens";
  positiveTokensSpan.textContent = "\u6B63\u9762\u603B\u5360\u7528: \u8BA1\u7B97\u4E2D...";
  const negativeTokensSpan = doc.createElement("span");
  negativeTokensSpan.id = "dialog-negative-tokens";
  negativeTokensSpan.textContent = "\u8D1F\u9762\u603B\u5360\u7528: \u8BA1\u7B97\u4E2D...";
  tokenDisplayContainer.appendChild(positiveTokensSpan);
  tokenDisplayContainer.appendChild(negativeTokensSpan);
  gorkVideoItem.className = "st-chatu8-edit-button send";
  gorkVideoItem.style.cssText = "";
  gorkVideoItem.onmouseenter = null;
  gorkVideoItem.onmouseleave = null;
  img2VideoItem.className = "st-chatu8-edit-button send";
  img2VideoItem.style.cssText = "";
  img2VideoItem.onmouseenter = null;
  img2VideoItem.onmouseleave = null;
  const renderActionButtons = () => {
    buttonContainer.classList.toggle("video-layout", currentMode2 === "video");
    buttonContainer.classList.toggle("image-layout", currentMode2 === "image");
    primaryButtonRow.replaceChildren();
    secondaryButtonRow.replaceChildren();
    primaryButtonRow.append(tagActionsContainer, translateButton, expandPresetButton, modifyTagButton);
    if (currentMode2 === "video") {
      secondaryButtonRow.style.display = "flex";
      secondaryButtonRow.append(img2VideoItem, gorkVideoItem, sendButton, cancelButton);
    } else {
      primaryButtonRow.append(imageProcessContainer, sendButton, cancelButton);
      secondaryButtonRow.style.display = "none";
    }
    sendButton.textContent = currentMode2 === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
  };
  buttonContainer.append(primaryButtonRow, secondaryButtonRow);
  renderActionButtons();
  dialog.appendChild(headerContainer);
  dialog.appendChild(inputContainer);
  dialog.appendChild(tokenDisplayContainer);
  dialog.appendChild(buttonContainer);
  dialog.appendChild(resultsEl);
  backdrop.appendChild(dialog);
  doc.body.appendChild(backdrop);
  if (typeof input.setSelectionRange === "function") {
    input.setSelectionRange(0, 0);
  }
  try {
    input.focus({ preventScroll: true });
  } catch (_) {
    input.focus();
  }
  dialog.scrollTop = 0;
  dialog.scrollLeft = 0;
  input.scrollTop = 0;
  input.scrollLeft = 0;
  inputBackdrop.scrollTop = 0;
  inputBackdrop.scrollLeft = 0;
  if (button && button.dataset.link) {
    getItemMeta(button.dataset.link).then((meta) => {
      let needsUpdate = false;
      if (meta.change && meta.change !== button.dataset.change) {
        button.dataset.change = meta.change;
        imageText = meta.change.replace(/\\n/g, "\n");
        needsUpdate = true;
      }
      if (meta.video && meta.video !== button.dataset.video) {
        button.dataset.video = meta.video;
        videoText = meta.video.replace(/\\n/g, "\n");
        needsUpdate = true;
      }
      if (meta.activeMode && meta.activeMode !== button.dataset.activeMode) {
        button.dataset.activeMode = meta.activeMode;
        currentMode2 = meta.activeMode;
        needsUpdate = true;
      }
      if (needsUpdate || currentMode2 === "video" && !input.value && videoText) {
        imageTab.classList.toggle("active", currentMode2 === "image");
        videoTab.classList.toggle("active", currentMode2 === "video");
        title.textContent = currentMode2 === "video" ? "\u7F16\u8F91\u89C6\u9891\u6807\u7B7E" : "\u7F16\u8F91\u56FE\u7247\u6807\u7B7E";
        sendButton.textContent = currentMode2 === "video" ? "\u751F\u6210\u89C6\u9891" : "\u53D1\u9001";
        button.textContent = currentMode2 === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
        input.value = currentMode2 === "video" ? videoText : imageText;
        updateTabIndicators();
        updateBackdrop();
        dialog.scrollTop = 0;
        input.scrollTop = 0;
        inputBackdrop.scrollTop = 0;
        if (typeof debouncedUpdateDialogTokens === "function") debouncedUpdateDialogTokens();
      }
    }).catch((err) => {
      console.warn("[showEditDialog] \u5F02\u6B65\u83B7\u53D6\u5143\u6570\u636E\u5931\u8D25:", err);
    });
  }
  setTimeout(() => {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight + 5}px`;
    updateBackdrop();
    dialog.scrollTop = 0;
    input.scrollTop = 0;
    inputBackdrop.scrollTop = 0;
  }, 0);
  input.addEventListener("input", () => {
    const originalValue = input.value;
    const newValue = originalValue.replace(/，/g, ",");
    if (originalValue !== newValue) {
      const selectionStart = input.selectionStart;
      input.value = newValue;
      input.setSelectionRange(selectionStart, selectionStart);
      updateBackdrop();
    }
    handleAutocomplete2(input, resultsEl).then(() => {
      updateResultsPosition();
    });
    debouncedUpdateDialogTokens();
  });
  async function updateDialogTokens() {
    if (extension_settings[extensionName].mode !== "novelai") {
      tokenDisplayContainer.style.display = "none";
      return;
    }
    tokenDisplayContainer.style.display = "flex";
    let processedValue = processCharacterPrompt(input.value);
    processedValue = stripChineseAnnotations(processedValue).replace(/，/g, ",");
    processedValue = processedValue.replace(/\|centers\s*:[^;]+?(?=\s*;|\s*$)/gi, "").replace(/\|[^\s,;]+/g, "");
    let positiveText = "";
    let negativeText = "";
    let charTokens = 0;
    let charNegTokens = 0;
    if (processedValue.includes("Scene Composition")) {
      const parsed = parsePromptStringWithCoordinates(processedValue);
      if (parsed) {
        positiveText = parsed["Scene Composition"] || "";
        negativeText = "";
        const charIds = getSortedCharacterIds(parsed);
        for (const id of charIds) {
          const promptVal = parsed[`Character ${id} Prompt`];
          if (promptVal && promptVal.trim()) {
            charTokens += await calculateNovelAITokens(promptVal);
          }
          const ucVal = parsed[`Character ${id} UC`];
          if (ucVal && ucVal.trim()) {
            charNegTokens += await calculateNovelAITokens(ucVal);
          }
        }
      }
    } else {
      positiveText = processedValue;
    }
    const presetId = extension_settings[extensionName].yusheid_novelai || "\u9ED8\u8BA4";
    const preset = extension_settings[extensionName].yushe && extension_settings[extensionName].yushe[presetId] || {};
    const fixedPositive = preset.fixedPrompt || "";
    const fixedPositiveEnd = preset.fixedPrompt_end || "";
    const fixedNegative = preset.negativePrompt || "";
    const presetsText = getNovelAIQualityPresetsText(extension_settings[extensionName]);
    const pos2 = await calculateNovelAITokens(positiveText) + charTokens;
    const combinedPositive = [fixedPositive, positiveText, fixedPositiveEnd, presetsText.aqt].filter((p) => p && p.trim()).join(", ");
    const deduplicatedPositive = deduplicateTags(combinedPositive);
    const basePositiveTokens = await calculateNovelAITokens(deduplicatedPositive);
    const totalPositive = basePositiveTokens + charTokens;
    const neg2 = await calculateNovelAITokens(negativeText) + charNegTokens;
    const combinedNegative = [fixedNegative, negativeText, presetsText.ucp].filter((p) => p && p.trim()).join(", ");
    const deduplicatedNegative = deduplicateTags(combinedNegative);
    const baseNegativeTokens = await calculateNovelAITokens(deduplicatedNegative);
    const totalNegative = baseNegativeTokens + charNegTokens;
    const maxTokens = getNovelAIMaxTokens(extension_settings[extensionName]);
    positiveTokensSpan.textContent = `\u6B63\u9762: \u5F53\u524D ${pos2} + \u53BB\u91CD\u5408\u5E76\u9884\u8BBE = \u771F\u5B9E\u603B\u8BA1 ${totalPositive} / ${maxTokens}`;
    negativeTokensSpan.textContent = `\u8D1F\u9762: \u5F53\u524D ${neg2} + \u53BB\u91CD\u5408\u5E76\u9884\u8BBE = \u771F\u5B9E\u603B\u8BA1 ${totalNegative} / ${maxTokens}`;
    positiveTokensSpan.style.color = totalPositive > maxTokens ? "#ff6b6b" : "inherit";
    negativeTokensSpan.style.color = totalNegative > maxTokens ? "#ff6b6b" : "inherit";
  }
  ;
  let tokenUpdateTimer;
  function debouncedUpdateDialogTokens() {
    clearTimeout(tokenUpdateTimer);
    tokenUpdateTimer = setTimeout(updateDialogTokens, 300);
  }
  setTimeout(debouncedUpdateDialogTokens, 100);
  input.addEventListener("click", (event) => event.stopPropagation());
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!resultsEl.matches(":hover")) {
        resultsEl.style.display = "none";
        updateResultsPosition();
      }
    }, 150);
  });
}

function calculateDialogDimensions(isMobile3) {
  if (!isMobile3) {
    return {
      topMargin: 0,
      maxHeight: "85vh",
      shouldUseFullHeight: false
    };
  }
  const doc = window.top.document;
  let topBound = 10;
  let bottomBound = window.innerHeight - 10;
  const topSettingsHolder = doc.querySelector("#top-settings-holder");
  const topBar = doc.querySelector("#top-bar");
  const aiConfigButton = doc.querySelector("#ai-config-button");
  let topBottom = 0;
  if (topSettingsHolder) {
    const rect = topSettingsHolder.getBoundingClientRect();
    if (rect.bottom > 0) topBottom = Math.max(topBottom, rect.bottom);
  }
  if (topBar) {
    const rect = topBar.getBoundingClientRect();
    if (rect.bottom > 0) topBottom = Math.max(topBottom, rect.bottom);
  }
  if (aiConfigButton && topBottom <= 0) {
    topBottom = aiConfigButton.offsetHeight || 0;
  }
  topBound = (topBottom || 40) + 10;
  const formSheld = doc.querySelector("#form_sheld");
  const sendForm = doc.querySelector("#send_form");
  const sendTextarea = doc.querySelector("#send_textarea");
  const bottomEl = formSheld || sendForm || sendTextarea;
  if (bottomEl) {
    const rect = bottomEl.getBoundingClientRect();
    if (rect.top > 0) bottomBound = rect.top - 10;
  }
  const availableHeight = Math.max(200, bottomBound - topBound);
  return {
    topMargin: topBound,
    maxHeight: `${availableHeight}px`,
    shouldUseFullHeight: true
  };
}

function createUnifiedDialog(options) {
  const doc = window.top.document;
  const { title, isMobile: isMobile3 } = options;
  doc.querySelector(".st-chatu8-edit-backdrop")?.remove();
  const backdrop = doc.createElement("div");
  backdrop.className = "st-chatu8-edit-backdrop";
  const dialog = doc.createElement("div");
  dialog.className = "st-chatu8-edit-dialog";
  dialog.style.position = "relative";
  dialog.style.display = "flex";
  dialog.style.flexDirection = "column";
  dialog.addEventListener("click", (e) => e.stopPropagation());
  const dimensions = calculateDialogDimensions(isMobile3);
  if (isMobile3) {
    backdrop.style.alignItems = "flex-start";
    dialog.style.marginTop = `${dimensions.topMargin}px`;
    dialog.style.maxHeight = dimensions.maxHeight;
    dialog.style.overflowX = "hidden";
    dialog.style.overflowY = "auto";
    if (dimensions.shouldUseFullHeight) {
      dialog.style.height = dimensions.maxHeight;
    }
  } else {
    dialog.style.maxHeight = dimensions.maxHeight;
    dialog.style.overflowX = "hidden";
    dialog.style.overflowY = "auto";
  }
  const titleEl = doc.createElement("div");
  titleEl.className = "st-chatu8-edit-title";
  titleEl.textContent = title;
  dialog.appendChild(titleEl);
  const closeDialog = () => backdrop.remove();
  backdrop.appendChild(dialog);
  doc.body.appendChild(backdrop);
  return { backdrop, dialog, closeDialog };
}

function createUnifiedInput(options) {
  const { placeholder = "", value = "", rows = 2 } = options;
  const input = document.createElement("textarea");
  input.className = "st-chatu8-edit-input";
  input.placeholder = placeholder;
  input.value = value;
  input.rows = rows;
  return input;
}

function createButtonContainer(buttons) {
  const container = document.createElement("div");
  container.className = "st-chatu8-edit-buttons";
  buttons.forEach((btnConfig) => {
    const button = document.createElement("button");
    button.className = `st-chatu8-edit-button ${btnConfig.className}`;
    button.textContent = btnConfig.text;
    button.onclick = btnConfig.onClick;
    container.appendChild(button);
  });
  return container;
}

export { createButtonContainer, createUnifiedDialog, createUnifiedInput, setTriggerGeneration, showEditDialog };
