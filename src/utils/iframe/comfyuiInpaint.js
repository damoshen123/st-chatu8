// 还原自打包产物 — 原始模块: utils/iframe/comfyuiInpaint.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { addLog, stripChineseAnnotations } from "../utils.js";
import { createButtonContainer, createUnifiedDialog } from "./dialogs.js";
import { handleAutocomplete2 } from "./autocomplete.js";

var MaskEditor;

MaskEditor = class {
      constructor(containerEl, imageUrl) {
        this.container = containerEl;
        this.imageUrl = imageUrl;
        this.brushSize = extension_settings[extensionName]?.inpaint_brush_size || 30;
        this.featherRadius = 10;
        this.mode = "draw";
        this.isDrawing = false;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 20;
        this.init();
      }
      async init() {
        this.container.style.cssText = "position: relative; display: flex; flex-direction: column; align-items: center;";
        this.originalImage = new Image();
        this.originalImage.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          this.originalImage.onload = resolve;
          this.originalImage.onerror = reject;
          this.originalImage.src = this.imageUrl;
        });
        const isMobile3 = window.top.innerWidth <= 768;
        const maxWidth = isMobile3 ? Math.min(this.originalImage.width, window.top.innerWidth - 60) : Math.min(this.originalImage.width, 800);
        const scale = maxWidth / this.originalImage.width;
        this.displayWidth = Math.floor(this.originalImage.width * scale);
        this.displayHeight = Math.floor(this.originalImage.height * scale);
        this.canvasContainer = document.createElement("div");
        this.canvasContainer.style.cssText = `position: relative; width: ${this.displayWidth}px; height: ${this.displayHeight}px;`;
        this.imageCanvas = document.createElement("canvas");
        this.imageCanvas.width = this.displayWidth;
        this.imageCanvas.height = this.displayHeight;
        this.imageCanvas.style.cssText = "position: absolute; top: 0; left: 0;";
        const imgCtx = this.imageCanvas.getContext("2d");
        imgCtx.drawImage(this.originalImage, 0, 0, this.displayWidth, this.displayHeight);
        this.maskCanvas = document.createElement("canvas");
        this.maskCanvas.width = this.displayWidth;
        this.maskCanvas.height = this.displayHeight;
        this.maskCanvas.style.cssText = "position: absolute; top: 0; left: 0; cursor: crosshair; opacity: 0.6;";
        this.maskCtx = this.maskCanvas.getContext("2d");
        this.maskCtx.fillStyle = "#000000";
        this.maskCtx.fillRect(0, 0, this.displayWidth, this.displayHeight);
        this.canvasContainer.appendChild(this.imageCanvas);
        this.canvasContainer.appendChild(this.maskCanvas);
        this.container.appendChild(this.canvasContainer);
        this.bindEvents();
        this.saveState();
      }
      bindEvents() {
        const getPos = (e) => {
          const rect = this.maskCanvas.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          return {
            x: clientX - rect.left,
            y: clientY - rect.top
          };
        };
        const startDraw = (e) => {
          e.preventDefault();
          this.isDrawing = true;
          this.lastPos = getPos(e);
          this.draw(this.lastPos);
        };
        const draw = (e) => {
          if (!this.isDrawing) return;
          e.preventDefault();
          const pos = getPos(e);
          this.drawLine(this.lastPos, pos);
          this.lastPos = pos;
        };
        const endDraw = (e) => {
          if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
          }
        };
        this.maskCanvas.addEventListener("mousedown", startDraw);
        this.maskCanvas.addEventListener("mousemove", draw);
        this.maskCanvas.addEventListener("mouseup", endDraw);
        this.maskCanvas.addEventListener("mouseleave", endDraw);
        this.maskCanvas.addEventListener("touchstart", startDraw, { passive: false });
        this.maskCanvas.addEventListener("touchmove", draw, { passive: false });
        this.maskCanvas.addEventListener("touchend", endDraw);
        this.maskCanvas.addEventListener("touchcancel", endDraw);
      }
      draw(pos) {
        this.maskCtx.beginPath();
        this.maskCtx.arc(pos.x, pos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.maskCtx.fillStyle = this.mode === "draw" ? "#FFFFFF" : "#000000";
        this.maskCtx.fill();
      }
      drawLine(from, to) {
        this.maskCtx.beginPath();
        this.maskCtx.moveTo(from.x, from.y);
        this.maskCtx.lineTo(to.x, to.y);
        this.maskCtx.strokeStyle = this.mode === "draw" ? "#FFFFFF" : "#000000";
        this.maskCtx.lineWidth = this.brushSize;
        this.maskCtx.lineCap = "round";
        this.maskCtx.lineJoin = "round";
        this.maskCtx.stroke();
      }
      saveState() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(this.maskCanvas.toDataURL());
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }
        this.historyIndex = this.history.length - 1;
      }
      setBrushSize(size) {
        this.brushSize = Math.max(5, Math.min(100, size));
      }
      /**
       * 设置羽化半径
       * @param {number} radius - 羽化半径（0-50像素）
       */
      setFeatherRadius(radius) {
        this.featherRadius = Math.max(0, Math.min(50, radius));
      }
      setMode(mode) {
        this.mode = mode;
      }
      undo() {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.restoreState(this.history[this.historyIndex]);
        }
      }
      redo() {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.restoreState(this.history[this.historyIndex]);
        }
      }
      restoreState(dataUrl) {
        const img = new Image();
        img.onload = () => {
          this.maskCtx.clearRect(0, 0, this.displayWidth, this.displayHeight);
          this.maskCtx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
      }
      clear() {
        this.maskCtx.fillStyle = "#000000";
        this.maskCtx.fillRect(0, 0, this.displayWidth, this.displayHeight);
        this.saveState();
      }
      /**
       * 获取原图Blob（按原始尺寸）
       */
      async getOriginalBlob() {
        const canvas = document.createElement("canvas");
        canvas.width = this.originalImage.width;
        canvas.height = this.originalImage.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(this.originalImage, 0, 0);
        return new Promise((resolve) => {
          canvas.toBlob(resolve, "image/png");
        });
      }
      /**
       * 对遮罩应用向外羽化（膨胀+渐变）
       * @param {HTMLCanvasElement} sourceCanvas - 源遮罩画布
       * @param {number} radius - 羽化半径
       * @returns {HTMLCanvasElement} 羽化后的画布
       */
      applyGaussianBlur(sourceCanvas, radius) {
        try {
          if (radius === 0) return sourceCanvas;
          const width = sourceCanvas.width;
          const height = sourceCanvas.height;
          const srcCtx = sourceCanvas.getContext("2d");
          const srcData = srcCtx.getImageData(0, 0, width, height);
          const src = srcData.data;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          const dstData = ctx.createImageData(width, height);
          const dst = dstData.data;
          const distanceField = new Float32Array(width * height);
          const maxDist = radius;
          for (let i = 0; i < distanceField.length; i++) {
            distanceField[i] = maxDist + 1;
          }
          const whitePixels = [];
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const brightness = src[idx];
              if (brightness > 128) {
                whitePixels.push({ x, y });
                distanceField[y * width + x] = 0;
              }
            }
          }
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              if (distanceField[idx] === 0) continue;
              let minDist = maxDist + 1;
              const searchRadius = Math.min(maxDist + 1, Math.max(width, height));
              for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                  const nidx = ny * width + nx;
                  if (distanceField[nidx] === 0) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    minDist = Math.min(minDist, dist);
                  }
                }
              }
              distanceField[idx] = minDist;
            }
          }
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const dist = distanceField[y * width + x];
              let alpha;
              if (dist === 0) {
                alpha = 255;
              } else if (dist <= maxDist) {
                alpha = Math.round(255 * (1 - dist / maxDist));
              } else {
                alpha = 0;
              }
              dst[idx] = alpha;
              dst[idx + 1] = alpha;
              dst[idx + 2] = alpha;
              dst[idx + 3] = 255;
            }
          }
          ctx.putImageData(dstData, 0, 0);
          return canvas;
        } catch (err) {
          console.error("[Feathering] \u7FBD\u5316\u5904\u7406\u5931\u8D25:", err);
          addLog("[Feathering] \u7FBD\u5316\u5904\u7406\u5931\u8D25\uFF0C\u4F7F\u7528\u539F\u59CB\u906E\u7F69");
          return sourceCanvas;
        }
      }
      /**
       * 获取羽化后的遮罩Blob（按原始尺寸）
       */
      async getMaskBlobWithFeathering() {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = this.originalImage.width;
        tempCanvas.height = this.originalImage.height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(this.maskCanvas, 0, 0, this.originalImage.width, this.originalImage.height);
        const featheredCanvas = this.applyGaussianBlur(tempCanvas, this.featherRadius);
        return new Promise((resolve) => {
          featheredCanvas.toBlob(resolve, "image/png");
        });
      }
      /**
       * 获取遮罩Blob（按原始尺寸缩放）
       */
      async getMaskBlob() {
        return this.getMaskBlobWithFeathering();
      }
      destroy() {
        this.container.innerHTML = "";
      }
    };

function isMobileDevice2() {
  return window.top.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function createToolbarContainer(isMobile3, toolbar, denoiseGroup) {
  const container = document.createElement("div");
  container.className = "st-chatu8-inpaint-toolbar-container";
  if (isMobile3) {
    container.classList.add("mobile");
  } else {
    container.classList.add("desktop");
  }
  container.appendChild(toolbar);
  container.appendChild(denoiseGroup);
  return container;
}

async function showComfyUIInpaintDialog(img, button) {
  const doc = document;
  const isMobile3 = isMobileDevice2();
  const { backdrop, dialog, closeDialog } = createUnifiedDialog({
    title: "\u{1F3A8} ComfyUI \u5C40\u90E8\u91CD\u7ED8",
    isMobile: isMobile3
  });
  const editorContainer = doc.createElement("div");
  editorContainer.id = "inpaint-editor-container";
  editorContainer.className = "st-chatu8-inpaint-editor-container";
  dialog.appendChild(editorContainer);
  const savedPositive = extension_settings[extensionName]?.inpaint_positive_prompt || "";
  const savedNegative = extension_settings[extensionName]?.inpaint_negative_prompt || "";
  const savedDenoise = extension_settings[extensionName]?.inpaint_denoise || "0.75";
  const savedFeatherRadius = extension_settings[extensionName]?.inpaint_feather_radius || 0;
  const toolbar = doc.createElement("div");
  toolbar.className = "st-chatu8-inpaint-toolbar";
  toolbar.innerHTML = `
        <button id="tool-draw" class="st-chatu8-tool-btn active" title="\u753B\u7B14">\u{1F58C}\uFE0F \u753B\u7B14</button>
        <button id="tool-erase" class="st-chatu8-tool-btn" title="\u6A61\u76AE">\u{1F9FD} \u6A61\u76AE</button>
        <button id="tool-undo" class="st-chatu8-tool-btn" title="\u64A4\u9500">\u293A \u64A4\u9500</button>
        <button id="tool-redo" class="st-chatu8-tool-btn" title="\u91CD\u505A">\u293B \u91CD\u505A</button>
        <button id="tool-clear" class="st-chatu8-tool-btn" title="\u6E05\u7A7A">\u{1F5D1}\uFE0F \u6E05\u7A7A</button>
        <label class="st-chatu8-inpaint-brush-label">
            \u753B\u7B14\u5927\u5C0F: <input type="range" id="brush-size" min="5" max="100" value="30" class="st-chatu8-inpaint-brush-slider">
            <span id="brush-size-value">30</span>px
        </label>
        <label class="st-chatu8-inpaint-brush-label">
            \u7FBD\u5316\u5F3A\u5EA6: <input type="range" id="feather-radius" min="0" max="50" value="${savedFeatherRadius}" class="st-chatu8-inpaint-brush-slider">
            <span id="feather-radius-value">${savedFeatherRadius}</span>px
        </label>
    `;
  const style = doc.createElement("style");
  style.textContent = `
        /* Toolbar container base styles */
        .st-chatu8-inpaint-toolbar-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 10px;
            background-color: var(--st-chatu8-bg-secondary, #2a2a4a);
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        /* Mobile-specific styles - no separate scrollbar */
        .st-chatu8-inpaint-toolbar-container.mobile {
            overflow: visible;
            /* Let the dialog handle scrolling */
        }
        
        /* Desktop-specific styles */
        .st-chatu8-inpaint-toolbar-container.desktop {
            overflow: visible;
            max-height: none;
        }
        
        /* Ensure toolbar items wrap properly */
        .st-chatu8-inpaint-toolbar {
            flex-wrap: wrap;
        }
        
        /* Toolbar styles */
        .st-chatu8-inpaint-toolbar {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .st-chatu8-inpaint-brush-label {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .st-chatu8-inpaint-brush-slider {
            width: 100px;
        }
        
        .st-chatu8-tool-btn {
            padding: 8px 12px;
            border: 1px solid var(--st-chatu8-border-color, #444);
            border-radius: 6px;
            background: var(--st-chatu8-bg-secondary, #2a2a4a);
            color: var(--st-chatu8-text-primary, #fff);
            cursor: pointer;
            transition: all 0.2s;
        }
        .st-chatu8-tool-btn:hover {
            background: var(--st-chatu8-accent-secondary, #3a3a5a);
        }
        .st-chatu8-tool-btn.active {
            background: var(--st-chatu8-accent-primary, #4a4a8a);
            border-color: var(--st-chatu8-accent-primary, #6a6aaa);
        }
        
        /* Autocomplete styles for inpaint dialog */
        .st-chatu8-edit-backdrop .ch-autocomplete-results {
            display: none;
            position: absolute;
            background-color: var(--st-chatu8-dropdown-list-bg, #2a2a4a);
            border: 1px solid var(--st-chatu8-border-color, #444);
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
            color: var(--st-chatu8-dropdown-text, #fff);
            font-size: 0.9em;
        }
        .st-chatu8-edit-backdrop .ch-autocomplete-item:hover {
            background-color: var(--st-chatu8-accent-secondary, #3a3a5a);
            color: var(--st-chatu8-text-highlight, #fff);
        }
        
        /* Prompt section styles */
        .st-chatu8-inpaint-prompt-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: relative;
        }
        
        .st-chatu8-inpaint-prompt-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
            position: relative;
        }
        
        .st-chatu8-inpaint-denoise-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .st-chatu8-inpaint-denoise-label {
            flex-shrink: 0;
        }
        
        .st-chatu8-inpaint-denoise-slider {
            flex: 1;
            min-width: 100px;
        }
        
        .st-chatu8-inpaint-denoise-value {
            min-width: 40px;
            text-align: right;
        }
    `;
  dialog.appendChild(style);
  const denoiseGroupHTML = `
        <div class="st-chatu8-inpaint-denoise-group">
            <label class="st-chatu8-inpaint-denoise-label">\u91CD\u7ED8\u5E45\u5EA6\uFF1A</label>
            <input type="range" id="inpaint-denoise" min="0" max="1" step="0.05" value="${savedDenoise}" 
                class="st-chatu8-inpaint-denoise-slider">
            <span id="denoise-value" class="st-chatu8-inpaint-denoise-value">${savedDenoise}</span>
        </div>
    `;
  const denoiseGroup = doc.createElement("div");
  denoiseGroup.innerHTML = denoiseGroupHTML;
  const toolbarContainer = createToolbarContainer(isMobile3, toolbar, denoiseGroup);
  dialog.appendChild(toolbarContainer);
  const promptSection = doc.createElement("div");
  promptSection.className = "st-chatu8-inpaint-prompt-section";
  promptSection.innerHTML = `
        <div class="st-chatu8-inpaint-prompt-group">
            <label>\u6B63\u9762\u63D0\u793A\u8BCD\uFF08\u53EF\u9009\uFF09\uFF1A</label>
            <textarea id="inpaint-positive-prompt" rows="2" placeholder="\u63CF\u8FF0\u91CD\u7ED8\u533A\u57DF\u60F3\u8981\u7684\u5185\u5BB9..."
                class="st-chatu8-edit-input">${savedPositive}</textarea>
            <div class="ch-autocomplete-results" id="positive-autocomplete"></div>
        </div>
        <div class="st-chatu8-inpaint-prompt-group">
            <label>\u8D1F\u9762\u63D0\u793A\u8BCD\uFF08\u53EF\u9009\uFF09\uFF1A</label>
            <textarea id="inpaint-negative-prompt" rows="2" placeholder="\u63CF\u8FF0\u4E0D\u60F3\u51FA\u73B0\u7684\u5185\u5BB9..."
                class="st-chatu8-edit-input">${savedNegative}</textarea>
            <div class="ch-autocomplete-results" id="negative-autocomplete"></div>
        </div>
    `;
  dialog.appendChild(promptSection);
  const submitHandler = async () => {
    try {
      const positivePrompt = stripChineseAnnotations(dialog.querySelector("#inpaint-positive-prompt").value.trim());
      const negativePrompt = stripChineseAnnotations(dialog.querySelector("#inpaint-negative-prompt").value.trim());
      const denoise = parseFloat(dialog.querySelector("#inpaint-denoise").value);
      const submitBtn = dialog.querySelector("#inpaint-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "\u4E0A\u4F20\u4E2D...";
      const originalBlob = await editor.getOriginalBlob();
      const maskBlob = await editor.getMaskBlob();
      addLog("[Inpaint] \u51C6\u5907\u4E0A\u4F20\u56FE\u7247\u548C\u906E\u7F69\u5230ComfyUI...");
      const comfyuiUrl = extension_settings[extensionName]?.comfyuiUrl?.trim();
      if (!comfyuiUrl) {
        throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6EComfyUI\u5730\u5740");
      }
      const imageName = await uploadToComfyUI(originalBlob, "inpaint_image.png", comfyuiUrl);
      const maskName = await uploadToComfyUI(maskBlob, "inpaint_mask.png", comfyuiUrl);
      addLog(`[Inpaint] \u4E0A\u4F20\u6210\u529F: image=${imageName}, mask=${maskName}`);
      window.comfyuiInpaintImage = imageName;
      window.comfyuiInpaintMask = maskName;
      window.comfyuiInpaintPositivePrompt = positivePrompt;
      window.comfyuiInpaintNegativePrompt = negativePrompt;
      window.comfyuiInpaintDenoise = denoise;
      if (extension_settings[extensionName]) {
        extension_settings[extensionName].inpaint_positive_prompt = positivePrompt;
        extension_settings[extensionName].inpaint_negative_prompt = negativePrompt;
        extension_settings[extensionName].inpaint_denoise = denoise.toString();
      }
      const currentChange = button.dataset.change || "";
      if (!currentChange.includes("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}")) {
        button.dataset.change = currentChange + " {ComfyUI\u5C40\u90E8\u91CD\u7ED8}";
      }
      addLog("[Inpaint] \u51C6\u5907\u89E6\u53D1\u751F\u6210");
      closeDialog();
      button.click();
    } catch (err) {
      console.error("\u53D1\u9001\u91CD\u7ED8\u5931\u8D25:", err);
      addLog(`[Inpaint] \u53D1\u9001\u5931\u8D25: ${err.message}`);
      const submitBtn = dialog.querySelector("#inpaint-submit");
      submitBtn.disabled = false;
      submitBtn.textContent = "\u53D1\u9001\u91CD\u7ED8";
      if (typeof toastr !== "undefined") {
        toastr.error("\u53D1\u9001\u91CD\u7ED8\u5931\u8D25: " + err.message);
      }
    }
  };
  const buttonContainer = createButtonContainer([
    {
      text: "\u53D1\u9001\u91CD\u7ED8",
      className: "send",
      onClick: submitHandler
    },
    {
      text: "\u53D6\u6D88",
      className: "cancel",
      onClick: closeDialog
    }
  ]);
  buttonContainer.querySelector(".st-chatu8-edit-button.send").id = "inpaint-submit";
  dialog.appendChild(buttonContainer);
  backdrop.appendChild(dialog);
  doc.body.appendChild(backdrop);
  let editor = null;
  try {
    editor = new MaskEditor(editorContainer, img.src);
    await new Promise((resolve) => setTimeout(resolve, 100));
    editor.setFeatherRadius(savedFeatherRadius);
    if (!isMobile3 && editor.displayWidth) {
      const dialogWidth = editor.displayWidth + 60;
      dialog.style.width = `${dialogWidth}px`;
      dialog.style.maxWidth = "95vw";
    }
  } catch (err) {
    console.error("\u906E\u7F69\u7F16\u8F91\u5668\u521D\u59CB\u5316\u5931\u8D25:", err);
    addLog(`[Inpaint] \u7F16\u8F91\u5668\u521D\u59CB\u5316\u5931\u8D25: ${err.message}`);
    backdrop.remove();
    if (typeof toastr !== "undefined") {
      toastr.error("\u906E\u7F69\u7F16\u8F91\u5668\u521D\u59CB\u5316\u5931\u8D25");
    }
    return;
  }
  const drawBtn = dialog.querySelector("#tool-draw");
  const eraseBtn = dialog.querySelector("#tool-erase");
  const brushSizeInput = dialog.querySelector("#brush-size");
  const brushSizeValue = dialog.querySelector("#brush-size-value");
  drawBtn.onclick = () => {
    editor.setMode("draw");
    drawBtn.classList.add("active");
    eraseBtn.classList.remove("active");
  };
  eraseBtn.onclick = () => {
    editor.setMode("erase");
    eraseBtn.classList.add("active");
    drawBtn.classList.remove("active");
  };
  dialog.querySelector("#tool-undo").onclick = () => editor.undo();
  dialog.querySelector("#tool-redo").onclick = () => editor.redo();
  dialog.querySelector("#tool-clear").onclick = () => editor.clear();
  brushSizeInput.oninput = (e) => {
    const size = parseInt(e.target.value);
    editor.setBrushSize(size);
    brushSizeValue.textContent = size;
  };
  const featherInput = dialog.querySelector("#feather-radius");
  const featherValue = dialog.querySelector("#feather-radius-value");
  featherInput.oninput = (e) => {
    const radius = parseInt(e.target.value);
    editor.setFeatherRadius(radius);
    featherValue.textContent = radius;
    if (extension_settings[extensionName]) {
      extension_settings[extensionName].inpaint_feather_radius = radius;
    }
  };
  const denoiseInput = dialog.querySelector("#inpaint-denoise");
  const denoiseValue = dialog.querySelector("#denoise-value");
  denoiseInput.oninput = (e) => {
    const value = parseFloat(e.target.value);
    denoiseValue.textContent = value.toFixed(2);
  };
  const positiveInput = dialog.querySelector("#inpaint-positive-prompt");
  const negativeInput = dialog.querySelector("#inpaint-negative-prompt");
  const positiveResults = dialog.querySelector("#positive-autocomplete");
  const negativeResults = dialog.querySelector("#negative-autocomplete");
  const updateAutocompletePosition = (inputEl, resultsEl) => {
    if (resultsEl.style.display === "none") return;
    resultsEl.style.top = `${inputEl.offsetTop + inputEl.offsetHeight + 2}px`;
    resultsEl.style.left = `${inputEl.offsetLeft}px`;
    resultsEl.style.width = `${inputEl.offsetWidth}px`;
  };
  positiveInput.addEventListener("input", () => {
    const originalValue = positiveInput.value;
    let newValue = originalValue.replace(/，/g, ",");
    if (originalValue !== newValue) {
      const selectionStart = positiveInput.selectionStart;
      positiveInput.value = newValue;
      positiveInput.setSelectionRange(selectionStart, selectionStart);
    }
    handleAutocomplete2(positiveInput, positiveResults).then(() => {
      updateAutocompletePosition(positiveInput, positiveResults);
    });
  });
  positiveInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (!positiveResults.matches(":hover")) {
        positiveResults.style.display = "none";
      }
    }, 150);
  });
  negativeInput.addEventListener("input", () => {
    const originalValue = negativeInput.value;
    let newValue = originalValue.replace(/，/g, ",");
    if (originalValue !== newValue) {
      const selectionStart = negativeInput.selectionStart;
      negativeInput.value = newValue;
      negativeInput.setSelectionRange(selectionStart, selectionStart);
    }
    handleAutocomplete2(negativeInput, negativeResults).then(() => {
      updateAutocompletePosition(negativeInput, negativeResults);
    });
  });
  negativeInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (!negativeResults.matches(":hover")) {
        negativeResults.style.display = "none";
      }
    }, 150);
  });
  dialog.querySelector("#inpaint-close").onclick = closeDialog;
  dialog.querySelector("#inpaint-cancel").onclick = closeDialog;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeDialog();
  };
  dialog.querySelector("#inpaint-submit").onclick = async () => {
    try {
      const positivePrompt = stripChineseAnnotations(dialog.querySelector("#inpaint-positive-prompt").value.trim());
      const negativePrompt = stripChineseAnnotations(dialog.querySelector("#inpaint-negative-prompt").value.trim());
      const denoise = parseFloat(dialog.querySelector("#inpaint-denoise").value);
      const submitBtn = dialog.querySelector("#inpaint-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "\u4E0A\u4F20\u4E2D...";
      const originalBlob = await editor.getOriginalBlob();
      const maskBlob = await editor.getMaskBlob();
      addLog("[Inpaint] \u51C6\u5907\u4E0A\u4F20\u56FE\u7247\u548C\u906E\u7F69\u5230ComfyUI...");
      const comfyuiUrl = extension_settings[extensionName]?.comfyuiUrl?.trim();
      if (!comfyuiUrl) {
        throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6EComfyUI\u5730\u5740");
      }
      const imageName = await uploadToComfyUI(originalBlob, "inpaint_image.png", comfyuiUrl);
      const maskName = await uploadToComfyUI(maskBlob, "inpaint_mask.png", comfyuiUrl);
      addLog(`[Inpaint] \u4E0A\u4F20\u6210\u529F: image=${imageName}, mask=${maskName}`);
      window.comfyuiInpaintImage = imageName;
      window.comfyuiInpaintMask = maskName;
      window.comfyuiInpaintPositivePrompt = positivePrompt;
      window.comfyuiInpaintNegativePrompt = negativePrompt;
      window.comfyuiInpaintDenoise = denoise;
      if (extension_settings[extensionName]) {
        extension_settings[extensionName].inpaint_positive_prompt = positivePrompt;
        extension_settings[extensionName].inpaint_negative_prompt = negativePrompt;
        extension_settings[extensionName].inpaint_denoise = denoise.toString();
      }
      const currentChange = button.dataset.change || "";
      if (!currentChange.includes("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}")) {
        button.dataset.change = currentChange + " {ComfyUI\u5C40\u90E8\u91CD\u7ED8}";
      }
      addLog("[Inpaint] \u51C6\u5907\u89E6\u53D1\u751F\u6210");
      closeDialog();
      button.click();
    } catch (err) {
      console.error("\u53D1\u9001\u91CD\u7ED8\u5931\u8D25:", err);
      addLog(`[Inpaint] \u53D1\u9001\u5931\u8D25: ${err.message}`);
      const submitBtn = dialog.querySelector("#inpaint-submit");
      submitBtn.disabled = false;
      submitBtn.textContent = "\u53D1\u9001\u91CD\u7ED8";
      if (typeof toastr !== "undefined") {
        toastr.error("\u53D1\u9001\u91CD\u7ED8\u5931\u8D25: " + err.message);
      }
    }
  };
}

async function uploadToComfyUI(blob, filename, comfyuiUrl) {
  const formData = new FormData();
  formData.append("image", blob, filename);
  const response = await fetch(`${comfyuiUrl}/upload/image`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`\u4E0A\u4F20\u5931\u8D25: ${text}`);
  }
  const result = await response.json();
  return result.name;
}

export { showComfyUIInpaintDialog };
