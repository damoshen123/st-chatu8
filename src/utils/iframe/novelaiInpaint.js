// 还原自打包产物 — 原始模块: utils/iframe/novelaiInpaint.js
import { stripChineseAnnotations } from "../utils.js";
import { createButtonContainer, createUnifiedDialog } from "./dialogs.js";
import { handleAutocomplete2 } from "./autocomplete.js";

var MaskEditorState;

MaskEditorState = class {
      constructor() {
        this.originalImage = null;
        this.displayWidth = 0;
        this.displayHeight = 0;
        this.brushSize = 32;
        this.mode = "draw";
        this.isDrawing = false;
        this.lastPos = null;
        this.imageCanvas = null;
        this.displayMaskCanvas = null;
        this.dataMaskCanvas = null;
        this.displayMaskCtx = null;
        this.dataMaskCtx = null;
        this.prompt = "blue eyes, highly detailed, masterpiece";
        this.negativePrompt = "";
        this.strength = 0.54;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 20;
        this.onHistoryChange = null;
      }
    };

async function handleGenerate(state3, button, closeDialog, statusDiv) {
  try {
    if (!state3.originalImage || !state3.imageCanvas) {
      showError(statusDiv, "\u65E0\u6548\u7684\u56FE\u7247\u5143\u7D20");
      return;
    }
    if (!state3.prompt || state3.prompt.trim() === "") {
      showError(statusDiv, "\u8BF7\u8F93\u5165\u751F\u6210\u63D0\u793A\u8BCD");
      return;
    }
    if (state3.strength < 0 || state3.strength > 1) {
      showError(statusDiv, "\u5F3A\u5EA6\u5FC5\u987B\u5728 0 \u5230 1 \u4E4B\u95F4");
      return;
    }
    const alignedImageData = applyGridAlignment(state3.dataMaskCanvas);
    if (!alignedImageData) {
      console.error("[NovelAI Inpaint] Failed to generate aligned mask");
      showError(statusDiv, "Mask \u751F\u6210\u5931\u8D25");
      return;
    }
    const alignedCanvas = document.createElement("canvas");
    alignedCanvas.width = state3.dataMaskCanvas.width;
    alignedCanvas.height = state3.dataMaskCanvas.height;
    const alignedCtx = alignedCanvas.getContext("2d");
    alignedCtx.putImageData(alignedImageData, 0, 0);
    const imageBase64 = await canvasToBase64(state3.imageCanvas);
    const maskBase64 = await canvasToBase64(alignedCanvas);
    const processedPrompt = stripChineseAnnotations(state3.prompt.trim());
    const processedNegativePrompt = stripChineseAnnotations(state3.negativePrompt.trim());
    window.novelaiInpaintImage = imageBase64;
    window.novelaiInpaintMask = maskBase64;
    window.novelaiInpaintPrompt = processedPrompt;
    window.novelaiInpaintNegativePrompt = processedNegativePrompt;
    window.novelaiInpaintStrength = state3.strength;
    window.novelaiInpaintWidth = state3.originalImage.width;
    window.novelaiInpaintHeight = state3.originalImage.height;
    console.log("[NovelAI Inpaint] \u5B58\u50A8\u53C2\u6570:", {
      imageSize: `${state3.originalImage.width}x${state3.originalImage.height}`,
      maskSize: `${alignedCanvas.width}x${alignedCanvas.height}`,
      prompt: processedPrompt,
      negativePrompt: processedNegativePrompt,
      strength: state3.strength
    });
    const currentChange = button.dataset.change || "";
    if (!currentChange.includes("{NovelAI\u5C40\u90E8\u91CD\u7ED8}")) {
      button.dataset.change = currentChange + " {NovelAI\u5C40\u90E8\u91CD\u7ED8}";
    }
    button.click();
    closeDialog();
  } catch (error) {
    console.error("[NovelAI Inpaint] Error during generation:", error);
    showError(statusDiv, "\u751F\u6210\u5931\u8D25: " + error.message);
  }
}

async function showNovelAIInpaintDialog(img, button) {
  if (!img || !img.src) {
    console.error("[NovelAI Inpaint] Invalid image element");
    if (typeof toastr !== "undefined") {
      toastr.error("\u65E0\u6548\u7684\u56FE\u7247\u5143\u7D20");
    }
    return;
  }
  try {
    const testImage = new Image();
    testImage.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      testImage.onload = resolve;
      testImage.onerror = () => reject(new Error("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25"));
      testImage.src = img.src;
    });
  } catch (error) {
    console.error("[NovelAI Inpaint] Image validation failed:", error);
    if (typeof toastr !== "undefined") {
      toastr.error("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u56FE\u7247\u6E90");
    }
    return;
  }
  const isMobile3 = isMobileDevice3();
  const { backdrop, dialog, closeDialog } = createUnifiedDialog({
    title: "\u{1F3A8} NovelAI \u5C40\u90E8\u91CD\u7ED8",
    isMobile: isMobile3
  });
  const canvasContainer = await createCanvasContainer(img, isMobile3);
  dialog.appendChild(canvasContainer);
  if (!isMobile3) {
    const displayWidth = parseInt(canvasContainer.dataset.displayWidth);
    if (displayWidth) {
      const dialogWidth = displayWidth + 60;
      dialog.style.width = `${dialogWidth}px`;
      dialog.style.maxWidth = "95vw";
    }
  }
  const style = document.createElement("style");
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
        
        /* Denoise/Strength slider styles (matching ComfyUI) */
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
    `;
  dialog.appendChild(style);
  const state3 = new MaskEditorState();
  state3.displayWidth = parseInt(canvasContainer.dataset.displayWidth);
  state3.displayHeight = parseInt(canvasContainer.dataset.displayHeight);
  state3.imageCanvas = canvasContainer._imageCanvas;
  state3.displayMaskCanvas = canvasContainer._displayMaskCanvas;
  state3.dataMaskCanvas = canvasContainer._dataMaskCanvas;
  state3.displayMaskCtx = state3.displayMaskCanvas.getContext("2d", { willReadFrequently: true });
  state3.dataMaskCtx = state3.dataMaskCanvas.getContext("2d", { willReadFrequently: true });
  const originalImage = new Image();
  originalImage.crossOrigin = "anonymous";
  await new Promise((resolve) => {
    originalImage.onload = resolve;
    originalImage.src = img.src;
  });
  state3.originalImage = originalImage;
  state3.brushSize = 32;
  state3.mode = "draw";
  setupDrawingEvents(state3);
  setTimeout(() => {
    saveState(state3);
  }, 0);
  const toolbar = createToolbar(state3);
  const parameterInputs = createParameterInputs(state3);
  const toolbarContainer = createToolbarContainer2(isMobile3, toolbar, parameterInputs);
  dialog.appendChild(toolbarContainer);
  const statusDiv = createStatusDiv();
  dialog.appendChild(statusDiv);
  const generateButton = {
    text: "\u751F\u6210",
    className: "send",
    onClick: async () => {
      hideError(statusDiv);
      const btnElement = buttonContainer.querySelector(".send");
      if (btnElement) {
        btnElement.disabled = true;
        btnElement.style.opacity = "0.6";
        btnElement.style.cursor = "not-allowed";
      }
      try {
        await handleGenerate(state3, button, closeDialog, statusDiv);
      } finally {
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.style.opacity = "1";
          btnElement.style.cursor = "pointer";
        }
      }
    }
  };
  const buttonContainer = createButtonContainer([
    generateButton,
    {
      text: "\u5173\u95ED",
      className: "cancel",
      onClick: closeDialog
    }
  ]);
  dialog.appendChild(buttonContainer);
}

function setupDrawingEvents(state3) {
  const canvas = state3.displayMaskCanvas;
  function getCanvasCoords(event) {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }
  function startDrawing(event) {
    event.preventDefault();
    state3.isDrawing = true;
    const coords = event.touches ? getCanvasCoords(event.touches[0]) : getCanvasCoords(event);
    state3.lastPos = coords;
    drawBrush(state3, coords.x, coords.y);
  }
  function continueDrawing(event) {
    if (!state3.isDrawing) return;
    event.preventDefault();
    const coords = event.touches ? getCanvasCoords(event.touches[0]) : getCanvasCoords(event);
    if (state3.lastPos) {
      drawLine(state3, state3.lastPos.x, state3.lastPos.y, coords.x, coords.y);
    } else {
      drawBrush(state3, coords.x, coords.y);
    }
    state3.lastPos = coords;
  }
  function stopDrawing(event) {
    if (state3.isDrawing) {
      event.preventDefault();
      saveState(state3);
    }
    state3.isDrawing = false;
    state3.lastPos = null;
  }
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", continueDrawing);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);
  canvas.addEventListener("touchstart", startDrawing, { passive: false });
  canvas.addEventListener("touchmove", continueDrawing, { passive: false });
  canvas.addEventListener("touchend", stopDrawing, { passive: false });
  canvas.addEventListener("touchcancel", stopDrawing, { passive: false });
}

function applyGridAlignment(maskCanvas, gridSize = 8) {
  const width = maskCanvas.width;
  const height = maskCanvas.height;
  const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const aligned = new ImageData(width, height);
  const alignedData = aligned.data;
  for (let blockY = 0; blockY < height; blockY += gridSize) {
    for (let blockX = 0; blockX < width; blockX += gridSize) {
      let hasWhite = false;
      for (let dy = 0; dy < gridSize && blockY + dy < height; dy++) {
        for (let dx = 0; dx < gridSize && blockX + dx < width; dx++) {
          const px = blockX + dx;
          const py = blockY + dy;
          const i = (py * width + px) * 4;
          if (data[i] > 128 || data[i + 1] > 128 || data[i + 2] > 128) {
            hasWhite = true;
            break;
          }
        }
        if (hasWhite) break;
      }
      const color = hasWhite ? 255 : 0;
      for (let dy = 0; dy < gridSize && blockY + dy < height; dy++) {
        for (let dx = 0; dx < gridSize && blockX + dx < width; dx++) {
          const px = blockX + dx;
          const py = blockY + dy;
          const i = (py * width + px) * 4;
          alignedData[i] = color;
          alignedData[i + 1] = color;
          alignedData[i + 2] = color;
          alignedData[i + 3] = 255;
        }
      }
    }
  }
  return aligned;
}

function drawBrush(state3, x, y) {
  state3.displayMaskCtx.fillStyle = state3.mode === "draw" ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 0, 0, 1)";
  state3.displayMaskCtx.beginPath();
  state3.displayMaskCtx.arc(x, y, state3.brushSize / 2, 0, Math.PI * 2);
  state3.displayMaskCtx.fill();
  state3.dataMaskCtx.fillStyle = state3.mode === "draw" ? "#FFFFFF" : "#000000";
  state3.dataMaskCtx.beginPath();
  state3.dataMaskCtx.arc(x, y, state3.brushSize / 2, 0, Math.PI * 2);
  state3.dataMaskCtx.fill();
}

function drawLine(state3, x0, y0, x1, y1) {
  const distance2 = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
  const steps = Math.max(1, Math.ceil(distance2 / (state3.brushSize / 4)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    drawBrush(state3, x, y);
  }
}

function saveState(state3) {
  state3.history = state3.history.slice(0, state3.historyIndex + 1);
  const base64Data = state3.dataMaskCanvas.toDataURL("image/png");
  state3.history.push(base64Data);
  if (state3.history.length > state3.maxHistory) {
    state3.history.shift();
    state3.historyIndex = state3.history.length - 1;
  } else {
    state3.historyIndex++;
  }
  console.log("[NovelAI Inpaint] State saved. History length:", state3.history.length, "Index:", state3.historyIndex);
  if (state3.onHistoryChange) {
    state3.onHistoryChange();
  }
}

function restoreState(state3, base64Data) {
  const img = new Image();
  img.onload = () => {
    state3.displayMaskCtx.clearRect(0, 0, state3.displayMaskCanvas.width, state3.displayMaskCanvas.height);
    state3.displayMaskCtx.globalCompositeOperation = "source-over";
    state3.displayMaskCtx.drawImage(img, 0, 0);
    const imageData = state3.displayMaskCtx.getImageData(0, 0, state3.displayMaskCanvas.width, state3.displayMaskCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 128) {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 128;
      }
    }
    state3.displayMaskCtx.putImageData(imageData, 0, 0);
    state3.dataMaskCtx.clearRect(0, 0, state3.dataMaskCanvas.width, state3.dataMaskCanvas.height);
    state3.dataMaskCtx.drawImage(img, 0, 0);
  };
  img.src = base64Data;
}

function undo(state3) {
  console.log("[NovelAI Inpaint] Undo called. Current index:", state3.historyIndex, "History length:", state3.history.length);
  if (state3.historyIndex > 0) {
    state3.historyIndex--;
    restoreState(state3, state3.history[state3.historyIndex]);
    console.log("[NovelAI Inpaint] Undo executed. New index:", state3.historyIndex);
    if (state3.onHistoryChange) {
      state3.onHistoryChange();
    }
  } else {
    console.log("[NovelAI Inpaint] Cannot undo - at beginning of history");
  }
}

function redo(state3) {
  if (state3.historyIndex < state3.history.length - 1) {
    state3.historyIndex++;
    restoreState(state3, state3.history[state3.historyIndex]);
    if (state3.onHistoryChange) {
      state3.onHistoryChange();
    }
  }
}

function canvasToBase64(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}

function createToolbarContainer2(isMobile3, toolbar, parameterInputs) {
  const container = document.createElement("div");
  container.className = "st-chatu8-inpaint-toolbar-container";
  container.style.position = "relative";
  container.style.zIndex = "1";
  if (isMobile3) {
    container.classList.add("mobile");
  } else {
    container.classList.add("desktop");
  }
  container.appendChild(toolbar);
  container.appendChild(parameterInputs);
  return container;
}

function createToolbar(state3) {
  const toolbar = document.createElement("div");
  toolbar.className = "st-chatu8-inpaint-toolbar";
  toolbar.innerHTML = `
        <button id="tool-draw" class="st-chatu8-tool-btn active" title="\u753B\u7B14">\u{1F58C}\uFE0F \u753B\u7B14</button>
        <button id="tool-erase" class="st-chatu8-tool-btn" title="\u6A61\u76AE">\u{1F9FD} \u6A61\u76AE</button>
        <button id="tool-undo" class="st-chatu8-tool-btn" title="\u64A4\u9500">\u293A \u64A4\u9500</button>
        <button id="tool-redo" class="st-chatu8-tool-btn" title="\u91CD\u505A">\u293B \u91CD\u505A</button>
        <button id="tool-clear" class="st-chatu8-tool-btn" title="\u6E05\u7A7A">\u{1F5D1}\uFE0F \u6E05\u7A7A</button>
        <button id="tool-preview" class="st-chatu8-tool-btn" title="\u9884\u89C8\u8499\u7248">\u{1F441}\uFE0F \u9884\u89C8</button>
        <label class="st-chatu8-inpaint-brush-label">
            \u753B\u7B14: <input type="range" id="brush-size" min="8" max="150" step="8" value="${state3.brushSize}" class="st-chatu8-inpaint-brush-slider">
            <span id="brush-size-value">${state3.brushSize}</span>px
        </label>
    `;
  setTimeout(() => {
    const drawBtn = toolbar.querySelector("#tool-draw");
    const eraseBtn = toolbar.querySelector("#tool-erase");
    const undoBtn = toolbar.querySelector("#tool-undo");
    const redoBtn = toolbar.querySelector("#tool-redo");
    const clearBtn = toolbar.querySelector("#tool-clear");
    const previewBtn = toolbar.querySelector("#tool-preview");
    const brushSizeInput = toolbar.querySelector("#brush-size");
    const brushSizeValue = toolbar.querySelector("#brush-size-value");
    let maskVisible = true;
    function updateUndoRedoButtons() {
      undoBtn.disabled = state3.historyIndex <= 0;
      redoBtn.disabled = state3.historyIndex >= state3.history.length - 1;
      undoBtn.style.opacity = undoBtn.disabled ? "0.5" : "1";
      undoBtn.style.cursor = undoBtn.disabled ? "not-allowed" : "pointer";
      redoBtn.style.opacity = redoBtn.disabled ? "0.5" : "1";
      redoBtn.style.cursor = redoBtn.disabled ? "not-allowed" : "pointer";
    }
    state3.onHistoryChange = updateUndoRedoButtons;
    drawBtn.onclick = () => {
      state3.mode = "draw";
      drawBtn.classList.add("active");
      eraseBtn.classList.remove("active");
    };
    eraseBtn.onclick = () => {
      state3.mode = "erase";
      eraseBtn.classList.add("active");
      drawBtn.classList.remove("active");
    };
    undoBtn.onclick = () => {
      undo(state3);
    };
    redoBtn.onclick = () => {
      redo(state3);
    };
    clearBtn.onclick = () => {
      state3.displayMaskCtx.fillStyle = "#000000";
      state3.displayMaskCtx.fillRect(0, 0, state3.displayMaskCanvas.width, state3.displayMaskCanvas.height);
      state3.dataMaskCtx.fillStyle = "#000000";
      state3.dataMaskCtx.fillRect(0, 0, state3.dataMaskCanvas.width, state3.dataMaskCanvas.height);
      saveState(state3);
    };
    previewBtn.onclick = () => {
      maskVisible = !maskVisible;
      state3.displayMaskCanvas.style.opacity = maskVisible ? "0.6" : "0";
      previewBtn.textContent = maskVisible ? "\u{1F441}\uFE0F \u9884\u89C8\u8499\u7248" : "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F \u663E\u793A\u8499\u7248";
    };
    brushSizeInput.oninput = (e) => {
      state3.brushSize = parseInt(e.target.value);
      brushSizeValue.textContent = state3.brushSize;
    };
    updateUndoRedoButtons();
  }, 0);
  return toolbar;
}

function createParameterInputs(state3) {
  const container = document.createElement("div");
  container.className = "st-chatu8-inpaint-prompt-section";
  container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        position: relative;
    `;
  const positivePromptContainer = document.createElement("div");
  positivePromptContainer.className = "st-chatu8-inpaint-prompt-group";
  positivePromptContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
        position: relative;
    `;
  positivePromptContainer.innerHTML = `
        <label style="display: block;">\u6B63\u9762\u63D0\u793A\u8BCD:</label>
        <textarea id="novelai-prompt" rows="2" placeholder="\u8F93\u5165\u751F\u6210\u63D0\u793A\u8BCD\uFF0C\u4F8B\u5982: blue eyes, highly detailed, masterpiece" 
            class="st-chatu8-edit-input" style="resize: vertical; box-sizing: border-box;">${state3.prompt}</textarea>
        <div class="ch-autocomplete-results" id="positive-autocomplete"></div>
    `;
  const negativePromptContainer = document.createElement("div");
  negativePromptContainer.className = "st-chatu8-inpaint-prompt-group";
  negativePromptContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
        position: relative;
    `;
  negativePromptContainer.innerHTML = `
        <label style="display: block;">\u8D1F\u9762\u63D0\u793A\u8BCD:</label>
        <textarea id="novelai-negative-prompt" rows="2" placeholder="\u63CF\u8FF0\u4E0D\u60F3\u51FA\u73B0\u7684\u5185\u5BB9..." 
            class="st-chatu8-edit-input" style="resize: vertical; box-sizing: border-box;">${state3.negativePrompt || ""}</textarea>
        <div class="ch-autocomplete-results" id="negative-autocomplete"></div>
    `;
  const strengthContainer = document.createElement("div");
  strengthContainer.className = "st-chatu8-inpaint-denoise-group";
  strengthContainer.innerHTML = `
        <label class="st-chatu8-inpaint-denoise-label">\u5F3A\u5EA6\uFF1A</label>
        <input type="range" id="novelai-strength" min="0" max="1" step="0.01" value="${state3.strength}" 
            class="st-chatu8-inpaint-denoise-slider">
        <span id="strength-value" class="st-chatu8-inpaint-denoise-value">${state3.strength.toFixed(2)}</span>
    `;
  container.appendChild(positivePromptContainer);
  container.appendChild(negativePromptContainer);
  container.appendChild(strengthContainer);
  setTimeout(() => {
    const promptTextarea = container.querySelector("#novelai-prompt");
    const negativePromptTextarea = container.querySelector("#novelai-negative-prompt");
    const strengthSlider = container.querySelector("#novelai-strength");
    const strengthValue = container.querySelector("#strength-value");
    const positiveResults = container.querySelector("#positive-autocomplete");
    const negativeResults = container.querySelector("#negative-autocomplete");
    const updateAutocompletePosition = (inputEl, resultsEl) => {
      if (resultsEl.style.display === "none") return;
      resultsEl.style.top = `${inputEl.offsetTop + inputEl.offsetHeight + 2}px`;
      resultsEl.style.left = `${inputEl.offsetLeft}px`;
      resultsEl.style.width = `${inputEl.offsetWidth}px`;
    };
    promptTextarea.addEventListener("input", (e) => {
      state3.prompt = e.target.value;
      const originalValue = promptTextarea.value;
      let newValue = originalValue.replace(/，/g, ",");
      if (originalValue !== newValue) {
        const selectionStart = promptTextarea.selectionStart;
        promptTextarea.value = newValue;
        promptTextarea.setSelectionRange(selectionStart, selectionStart);
        state3.prompt = newValue;
      }
      handleAutocomplete2(promptTextarea, positiveResults).then(() => {
        updateAutocompletePosition(promptTextarea, positiveResults);
      });
    });
    promptTextarea.addEventListener("blur", () => {
      setTimeout(() => {
        if (!positiveResults.matches(":hover")) {
          positiveResults.style.display = "none";
        }
      }, 150);
    });
    negativePromptTextarea.addEventListener("input", (e) => {
      state3.negativePrompt = e.target.value;
      const originalValue = negativePromptTextarea.value;
      let newValue = originalValue.replace(/，/g, ",");
      if (originalValue !== newValue) {
        const selectionStart = negativePromptTextarea.selectionStart;
        negativePromptTextarea.value = newValue;
        negativePromptTextarea.setSelectionRange(selectionStart, selectionStart);
        state3.negativePrompt = newValue;
      }
      handleAutocomplete2(negativePromptTextarea, negativeResults).then(() => {
        updateAutocompletePosition(negativePromptTextarea, negativeResults);
      });
    });
    negativePromptTextarea.addEventListener("blur", () => {
      setTimeout(() => {
        if (!negativeResults.matches(":hover")) {
          negativeResults.style.display = "none";
        }
      }, 150);
    });
    strengthSlider.addEventListener("input", (e) => {
      state3.strength = parseFloat(e.target.value);
      strengthValue.textContent = state3.strength.toFixed(2);
    });
  }, 0);
  return container;
}

function createStatusDiv() {
  const statusDiv = document.createElement("div");
  statusDiv.style.cssText = `
        margin: 0 auto 15px auto;
        padding: 10px;
        background: #ef9a9a;
        color: #c62828;
        border-radius: 4px;
        font-weight: bold;
        text-align: center;
        display: none;
    `;
  return statusDiv;
}

function showError(statusDiv, message) {
  statusDiv.textContent = message;
  statusDiv.style.display = "block";
}

function hideError(statusDiv) {
  statusDiv.style.display = "none";
  statusDiv.textContent = "";
}

function isMobileDevice3() {
  return window.innerWidth <= 768;
}

async function createCanvasContainer(img, isMobile3) {
  const originalImage = new Image();
  originalImage.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    originalImage.onload = resolve;
    originalImage.onerror = () => reject(new Error("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25"));
    originalImage.src = img.src;
  });
  const originalWidth = originalImage.width;
  const originalHeight = originalImage.height;
  const maxWidth = isMobile3 ? Math.min(originalWidth, window.innerWidth - 60) : Math.min(originalWidth, 800);
  const scale = maxWidth / originalWidth;
  const displayWidth = Math.floor(originalWidth * scale);
  const displayHeight = Math.floor(originalHeight * scale);
  console.log("[NovelAI Inpaint] Canvas setup:", {
    original: `${originalWidth}x${originalHeight}`,
    display: `${displayWidth}x${displayHeight}`,
    scale
  });
  const container = document.createElement("div");
  container.style.cssText = `
        position: relative;
        width: ${displayWidth}px;
        height: ${displayHeight}px;
        flex-shrink: 0;
        align-self: center;
        z-index: 0;
        overflow: hidden;
        box-sizing: content-box;
    `;
  container.className = "st-chatu8-inpaint-editor-container";
  const imageCanvas = document.createElement("canvas");
  imageCanvas.width = originalWidth;
  imageCanvas.height = originalHeight;
  imageCanvas.style.cssText = `
        position: absolute; 
        top: 0; 
        left: 0;
        width: ${displayWidth}px;    
        height: ${displayHeight}px;
    `;
  const imgCtx = imageCanvas.getContext("2d");
  imgCtx.drawImage(originalImage, 0, 0);
  const displayMaskCanvas = document.createElement("canvas");
  displayMaskCanvas.width = originalWidth;
  displayMaskCanvas.height = originalHeight;
  displayMaskCanvas.style.cssText = `
        position: absolute; 
        top: 0; 
        left: 0;
        width: ${displayWidth}px;    
        height: ${displayHeight}px;
        cursor: crosshair; 
        opacity: 0.6;
    `;
  const displayMaskCtx = displayMaskCanvas.getContext("2d", { willReadFrequently: true });
  displayMaskCtx.fillStyle = "#000000";
  displayMaskCtx.fillRect(0, 0, originalWidth, originalHeight);
  const dataMaskCanvas = document.createElement("canvas");
  dataMaskCanvas.width = originalWidth;
  dataMaskCanvas.height = originalHeight;
  const dataMaskCtx = dataMaskCanvas.getContext("2d", { willReadFrequently: true });
  dataMaskCtx.fillStyle = "#000000";
  dataMaskCtx.fillRect(0, 0, originalWidth, originalHeight);
  container.appendChild(imageCanvas);
  container.appendChild(displayMaskCanvas);
  container.dataset.displayWidth = displayWidth;
  container.dataset.displayHeight = displayHeight;
  container.dataset.originalWidth = originalWidth;
  container.dataset.originalHeight = originalHeight;
  container._imageCanvas = imageCanvas;
  container._displayMaskCanvas = displayMaskCanvas;
  container._dataMaskCanvas = dataMaskCanvas;
  return container;
}

export { showNovelAIInpaintDialog };
