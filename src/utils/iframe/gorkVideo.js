// 还原自打包产物 — 原始模块: utils/iframe/gorkVideo.js
import { isMobileDeviceDialog } from "../utils.js";
import { createButtonContainer, createUnifiedDialog, createUnifiedInput } from "./dialogs.js";

var _triggerGeneration;

_triggerGeneration = null;

function setGorkTriggerGeneration(fn) {
  _triggerGeneration = fn;
}

function showGorkVideoDialog(originalImgElement, originalButton) {
  const originalImageUrl = originalImgElement.src;
  let currentVideoImage = originalImageUrl;
  const isMobile3 = isMobileDeviceDialog();
  const { backdrop, dialog, closeDialog } = createUnifiedDialog({
    title: "\u{1F3AC} Gork \u751F\u6210\u89C6\u9891",
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
  imagePreview.src = currentVideoImage;
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
    currentVideoImage = originalImageUrl;
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
      currentVideoImage = e.target.result;
      imagePreview.src = currentVideoImage;
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
    placeholder: '\u8F93\u5165\u89C6\u9891\u751F\u6210\u6307\u4EE4\uFF0C\u4F8B\u5982\uFF1A"\u8BA9\u4EBA\u7269\u6325\u624B\u5FAE\u7B11"',
    value: originalButton.dataset.videoPrompt || "",
    rows: 2
  });
  const handleSend2 = () => {
    const videoPrompt = input.value.trim();
    if (!videoPrompt) {
      toastr.warning("\u8BF7\u8F93\u5165\u89C6\u9891\u751F\u6210\u6307\u4EE4\u3002");
      return;
    }
    originalButton.dataset.videoPrompt = videoPrompt;
    originalButton.dataset.videoImage = currentVideoImage;
    if (!originalButton.dataset.change) {
      originalButton.dataset.change = originalButton.dataset.link;
    }
    originalButton.dataset.change = `${originalButton.dataset.change}{\u89C6\u9891}`;
    toastr.info("\u6B63\u5728\u51C6\u5907\u751F\u6210\u89C6\u9891...");
    if (_triggerGeneration) {
      _triggerGeneration(originalButton);
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

export { setGorkTriggerGeneration, showGorkVideoDialog };
