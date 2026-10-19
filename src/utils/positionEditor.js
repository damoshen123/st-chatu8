// 还原自打包产物 — 原始模块: utils/positionEditor.js
import { extension_settings } from "../../../../../extensions.js";
import { extensionName } from "./config.js";
import { centersToCoordinates, clampPopupToViewport, isMobileDeviceDialog } from "./utils.js";
import { getItemImg } from "./database.js";

var CLASSIC_CHARACTER_THEMES;

CLASSIC_CHARACTER_THEMES = {
      1: { name: "\u89D2\u8272 1", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.2)", border: "#60a5fa", shadow: "rgba(59, 130, 246, 0.5)" },
      2: { name: "\u89D2\u8272 2", color: "#ec4899", bg: "rgba(236, 72, 153, 0.2)", border: "#f472b6", shadow: "rgba(236, 72, 153, 0.5)" },
      3: { name: "\u89D2\u8272 3", color: "#10b981", bg: "rgba(16, 185, 129, 0.2)", border: "#34d399", shadow: "rgba(16, 185, 129, 0.5)" },
      4: { name: "\u89D2\u8272 4", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)", border: "#fbbf24", shadow: "rgba(245, 158, 11, 0.5)" },
      5: { name: "\u89D2\u8272 5", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.2)", border: "#a78bfa", shadow: "rgba(139, 92, 246, 0.5)" },
      6: { name: "\u89D2\u8272 6", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.2)", border: "#22d3ee", shadow: "rgba(6, 182, 212, 0.5)" },
      7: { name: "\u89D2\u8272 7", color: "#f97316", bg: "rgba(249, 115, 22, 0.2)", border: "#fb923c", shadow: "rgba(249, 115, 22, 0.5)" },
      8: { name: "\u89D2\u8272 8", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.2)", border: "#2dd4bf", shadow: "rgba(20, 184, 166, 0.5)" }
    };

function getCharacterTheme(charId) {
  if (CLASSIC_CHARACTER_THEMES[charId]) {
    return CLASSIC_CHARACTER_THEMES[charId];
  }
  const hue = Math.round(charId * 137.508 % 360);
  return {
    name: `\u89D2\u8272 ${charId}`,
    color: `hsl(${hue}, 85%, 60%)`,
    bg: `hsla(${hue}, 85%, 60%, 0.2)`,
    border: `hsl(${hue}, 85%, 72%)`,
    shadow: `hsla(${hue}, 85%, 60%, 0.5)`
  };
}

async function openPositionEditorDialog({ input, button, doc = document, onApply }) {
  if (!input) return;
  const currentText = input.value || "";
  const activeCharacters = [];
  const charRegex = /Character\s+(\d+)\s+Prompt:/gi;
  let charMatch;
  while ((charMatch = charRegex.exec(currentText)) !== null) {
    const id = parseInt(charMatch[1], 10);
    if (!activeCharacters.includes(id)) {
      activeCharacters.push(id);
    }
  }
  activeCharacters.sort((a, b) => a - b);
  if (activeCharacters.length === 0) {
    if (typeof toastr !== "undefined") {
      toastr.info("\u672A\u68C0\u6D4B\u5230\u5206\u89D2\u8272\u63D0\u793A\u8BCD (Character Prompt)\uFF0C\u5982\u9700\u7F16\u8F91\u4F4D\u7F6E\u8BF7\u5148\u5C55\u5F00\u5206\u89D2\u8272\u9884\u8BBE\u3002");
    } else {
      alert("\u672A\u68C0\u6D4B\u5230\u5206\u89D2\u8272\u63D0\u793A\u8BCD\uFF0C\u5982\u9700\u7F16\u8F91\u4F4D\u7F6E\u8BF7\u5148\u5C55\u5F00\u5206\u89D2\u8272\u9884\u8BBE\u3002");
    }
    return;
  }
  const charCoords = {};
  const classicDistribution = {
    1: [0.5],
    2: [0.35, 0.65],
    3: [0.25, 0.5, 0.75],
    4: [0.2, 0.4, 0.6, 0.8]
  };
  const getInitialX = (index, totalCount) => {
    if (classicDistribution[totalCount]) {
      return classicDistribution[totalCount][index] ?? 0.5;
    }
    if (totalCount <= 1) return 0.5;
    const step = 0.72 / (totalCount - 1);
    return Number((0.14 + index * step).toFixed(3));
  };
  activeCharacters.forEach((charId, index) => {
    const match = currentText.match(new RegExp(`Character\\s+${charId}\\s+Prompt:[^;\\n]*?(?:\\|\\s*centers\\s*:\\s*([^;\\n]+?))\\s*(?:;|$)`, "i"));
    if (match && match[1]) {
      const parsed = centersToCoordinates(match[1]);
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        charCoords[charId] = { x: parsed.x, y: parsed.y };
        return;
      }
    }
    charCoords[charId] = {
      x: getInitialX(index, activeCharacters.length),
      y: 0.5
    };
  });
  const initialCoords = JSON.parse(JSON.stringify(charCoords));
  let canvasWidth2 = 832;
  let canvasHeight2 = 1216;
  const sizeMatch = currentText.match(/\b(\d{3,4})\s*[xX*×]\s*(\d{3,4})\b/);
  const settings3 = extension_settings?.[extensionName] || {};
  const aiAutoRes = settings3.aiAutonomousResolution !== false;
  if (sizeMatch && aiAutoRes) {
    canvasWidth2 = parseInt(sizeMatch[1], 10);
    canvasHeight2 = parseInt(sizeMatch[2], 10);
  } else {
    canvasWidth2 = parseInt(settings3.novelai_width || 832, 10);
    canvasHeight2 = parseInt(settings3.novelai_height || 1216, 10);
  }
  const aspectRatio = `${canvasWidth2} / ${canvasHeight2}`;
  const win = doc.defaultView || window.top || window;
  const isMobile3 = isMobileDeviceDialog();
  let topBound = 10;
  let bottomBound = win.innerHeight - 10;
  if (isMobile3) {
    const topSettingsHolder = doc.querySelector("#top-settings-holder");
    if (topSettingsHolder) {
      const rect = topSettingsHolder.getBoundingClientRect();
      topBound = Math.max(10, Math.min(rect.bottom + 10, win.innerHeight * 0.5));
    }
    const sendForm = doc.querySelector("#send_form");
    if (sendForm) {
      const rect = sendForm.getBoundingClientRect();
      bottomBound = Math.max(topBound + 200, Math.min(rect.top - 10, win.innerHeight - 10));
    }
  }
  const availableHeight = Math.max(200, bottomBound - topBound);
  const maxCanvasVh = isMobile3 ? 38 : 52;
  if (!doc.getElementById("st-chatu8-position-editor-style")) {
    const styleEl = doc.createElement("style");
    styleEl.id = "st-chatu8-position-editor-style";
    styleEl.textContent = `
            @keyframes stChatU8FadeIn {
                from { opacity: 0; transform: scale(0.96); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
    (doc.head || doc.body).appendChild(styleEl);
  }
  const overlay2 = doc.createElement("div");
  overlay2.className = "st-chatu8-position-modal-overlay";
  overlay2.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(5, 8, 18, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 99999;
        display: flex;
        align-items: ${isMobile3 ? "flex-start" : "center"};
        justify-content: center;
        padding: ${isMobile3 ? "0" : "16px"};
        box-sizing: border-box;
        animation: stChatU8FadeIn 0.2s ease-out;
    `;
  const dialog = doc.createElement("div");
  dialog.className = "st-chatu8-position-modal-dialog" + (isMobile3 ? " mobile" : "");
  dialog.style.cssText = `
        background: #111526;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        width: 100%;
        max-width: ${isMobile3 ? "min(92vw, 540px)" : "540px"};
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, sans-serif;
        box-sizing: border-box;
    `;
  if (isMobile3) {
    dialog.style.position = "fixed";
    dialog.style.top = `${topBound}px`;
    dialog.style.left = "50%";
    dialog.style.transform = "translateX(-50%)";
    dialog.style.maxHeight = `${availableHeight}px`;
    dialog.style.margin = "0";
  } else {
    dialog.style.maxHeight = "85vh";
    dialog.style.maxHeight = "85dvh";
  }
  const header = doc.createElement("div");
  header.style.cssText = `
        padding: 14px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
        flex-shrink: 0;
    `;
  const headerTitleWrapper = doc.createElement("div");
  headerTitleWrapper.style.cssText = "display: flex; align-items: center; gap: 8px;";
  headerTitleWrapper.innerHTML = `
        <span style="font-size: 18px;">\u{1F4CD}</span>
        <span style="font-weight: 600; font-size: 15px; color: #f8fafc;">\u89D2\u8272\u4F4D\u7F6E\u53EF\u89C6\u5316\u7F16\u8F91</span>
    `;
  const resBadge = doc.createElement("span");
  resBadge.style.cssText = "font-size: 12px; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 99px;";
  resBadge.textContent = `${canvasWidth2}\xD7${canvasHeight2}`;
  headerTitleWrapper.appendChild(resBadge);
  header.appendChild(headerTitleWrapper);
  const closeBtn = doc.createElement("button");
  closeBtn.innerHTML = "\u2715";
  closeBtn.title = "\u5173\u95ED";
  closeBtn.style.cssText = `
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.15s ease;
    `;
  closeBtn.onmouseenter = () => {
    closeBtn.style.color = "#fff";
    closeBtn.style.background = "rgba(255,255,255,0.1)";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.color = "#94a3b8";
    closeBtn.style.background = "transparent";
  };
  header.appendChild(closeBtn);
  const body = doc.createElement("div");
  body.style.cssText = `
        padding: ${isMobile3 ? "12px" : "16px"};
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        box-sizing: border-box;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    `;
  const canvasWrapper = doc.createElement("div");
  canvasWrapper.style.cssText = `
        position: relative;
        width: min(100%, calc(${maxCanvasVh}vh * (${canvasWidth2} / ${canvasHeight2})));
        max-width: 100%;
        max-height: ${maxCanvasVh}vh;
        aspect-ratio: ${canvasWidth2} / ${canvasHeight2};
        margin: 0 auto;
        background: #080b16;
        border: 1px solid rgba(99, 102, 241, 0.25);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.3);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
    `;
  const gridOverlay = doc.createElement("div");
  gridOverlay.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 33.333% 33.333%;
    `;
  const crosshair = doc.createElement("div");
  crosshair.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: 
            linear-gradient(to right, transparent 49.6%, rgba(99, 102, 241, 0.25) 50%, transparent 50.4%),
            linear-gradient(to bottom, transparent 49.6%, rgba(99, 102, 241, 0.25) 50%, transparent 50.4%);
    `;
  canvasWrapper.appendChild(gridOverlay);
  canvasWrapper.appendChild(crosshair);
  const bgImg = doc.createElement("img");
  bgImg.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease;
    `;
  canvasWrapper.appendChild(bgImg);
  const loadBackgroundImage = async () => {
    let foundSrc = null;
    if (button) {
      const container = button.closest(".st-chatu8-container") || button.parentElement;
      const imgEl = container ? container.querySelector("img.st-chatu8-image, img") : null;
      if (imgEl && imgEl.src && !imgEl.src.includes("placeholder") && !imgEl.src.includes("loading")) {
        foundSrc = imgEl.src;
      }
      if (!foundSrc && button.dataset.link) {
        try {
          const [dbSrc, , , isVideo] = await getItemImg(button.dataset.link);
          if (dbSrc && !isVideo) {
            foundSrc = dbSrc;
          }
        } catch (e) {
          console.warn("[PositionEditor] \u83B7\u53D6\u5E95\u56FE\u5931\u8D25:", e);
        }
      }
    }
    if (foundSrc) {
      bgImg.src = foundSrc;
      bgImg.onload = () => {
        bgImg.style.opacity = "0.3";
        if (bgImg.naturalWidth && bgImg.naturalHeight) {
          const nw = bgImg.naturalWidth;
          const nh = bgImg.naturalHeight;
          canvasWrapper.style.width = `min(100%, calc(${maxCanvasVh}vh * (${nw} / ${nh})))`;
          canvasWrapper.style.maxHeight = `${maxCanvasVh}vh`;
          canvasWrapper.style.aspectRatio = `${nw} / ${nh}`;
          if (resBadge) {
            resBadge.textContent = `${nw}\xD7${nh}`;
          }
        }
      };
    }
  };
  loadBackgroundImage();
  const cardsContainer = doc.createElement("div");
  cardsContainer.style.cssText = `
        width: 100%;
        display: grid;
        grid-template-columns: repeat(${activeCharacters.length > 2 ? 2 : activeCharacters.length}, 1fr);
        gap: 8px;
    `;
  const charElements = {};
  const cardElements = {};
  const dotDiameter = activeCharacters.length > 10 ? 26 : activeCharacters.length > 6 ? 30 : 34;
  const dotFontSize = activeCharacters.length > 10 ? 11 : activeCharacters.length > 6 ? 13 : 15;
  activeCharacters.forEach((charId) => {
    const theme = getCharacterTheme(charId);
    const coord = charCoords[charId];
    const dot = doc.createElement("div");
    dot.style.cssText = `
            position: absolute;
            width: ${dotDiameter}px;
            height: ${dotDiameter}px;
            border-radius: 50%;
            background: ${theme.color};
            border: 2px solid #ffffff;
            box-shadow: 0 0 14px ${theme.shadow}, 0 2px 6px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: ${dotFontSize}px;
            color: #ffffff;
            cursor: grab;
            transform: translate(-50%, -50%);
            left: ${coord.x * 100}%;
            top: ${coord.y * 100}%;
            z-index: 10;
            touch-action: none;
            user-select: none;
            transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.12s ease;
        `;
    dot.textContent = `${charId}`;
    canvasWrapper.appendChild(dot);
    charElements[charId] = dot;
    const card = doc.createElement("div");
    card.style.cssText = `
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-left: 3px solid ${theme.color};
            border-radius: 6px;
            padding: 6px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            transition: all 0.2s ease;
        `;
    card.innerHTML = `
            <span style="font-weight: 600; color: ${theme.border}; white-space: nowrap;">${theme.name}</span>
            <span class="coord-display" style="font-family: monospace; color: #f1f5f9; white-space: nowrap; font-variant-numeric: tabular-nums;">{${coord.x.toFixed(3)}, ${coord.y.toFixed(3)}}</span>
        `;
    cardsContainer.appendChild(card);
    cardElements[charId] = card;
    let isDragging = false;
    const updatePosition = (clientX, clientY) => {
      const rect = canvasWrapper.getBoundingClientRect();
      let normX = (clientX - rect.left) / rect.width;
      let normY = (clientY - rect.top) / rect.height;
      normX = Math.min(1, Math.max(0, normX));
      normY = Math.min(1, Math.max(0, normY));
      const fixedX = Number(normX.toFixed(3));
      const fixedY = Number(normY.toFixed(3));
      charCoords[charId] = { x: fixedX, y: fixedY };
      dot.style.left = `${fixedX * 100}%`;
      dot.style.top = `${fixedY * 100}%`;
      const disp = card.querySelector(".coord-display");
      if (disp) {
        disp.textContent = `{${fixedX.toFixed(3)}, ${fixedY.toFixed(3)}}`;
      }
    };
    dot.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      dot.setPointerCapture(e.pointerId);
      dot.style.cursor = "grabbing";
      dot.style.transform = "translate(-50%, -50%) scale(1.22)";
      dot.style.zIndex = "99";
      card.style.background = theme.bg;
      card.style.borderColor = theme.color;
    };
    dot.onpointermove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    };
    const handlePointerUp2 = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        dot.releasePointerCapture(e.pointerId);
      } catch (err) {
      }
      dot.style.cursor = "grab";
      dot.style.transform = "translate(-50%, -50%) scale(1)";
      dot.style.zIndex = "10";
      card.style.background = "rgba(255, 255, 255, 0.04)";
      card.style.borderColor = "rgba(255, 255, 255, 0.08)";
      card.style.borderLeftColor = theme.color;
    };
    dot.onpointerup = handlePointerUp2;
    dot.onpointercancel = handlePointerUp2;
  });
  body.appendChild(canvasWrapper);
  body.appendChild(cardsContainer);
  const footer = doc.createElement("div");
  footer.style.cssText = `
        padding: ${isMobile3 ? "10px 14px" : "12px 18px"};
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
        flex-shrink: 0;
        gap: 8px;
        flex-wrap: wrap;
    `;
  const resetBtn = doc.createElement("button");
  resetBtn.type = "button";
  resetBtn.textContent = "\u91CD\u7F6E\u4F4D\u7F6E";
  resetBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #94a3b8;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.15s ease;
    `;
  resetBtn.onmouseenter = () => {
    resetBtn.style.color = "#fff";
    resetBtn.style.background = "rgba(255,255,255,0.1)";
  };
  resetBtn.onmouseleave = () => {
    resetBtn.style.color = "#94a3b8";
    resetBtn.style.background = "rgba(255,255,255,0.06)";
  };
  resetBtn.onclick = () => {
    activeCharacters.forEach((charId) => {
      const init2 = initialCoords[charId];
      if (init2) {
        charCoords[charId] = { ...init2 };
        const dot = charElements[charId];
        if (dot) {
          dot.style.left = `${init2.x * 100}%`;
          dot.style.top = `${init2.y * 100}%`;
        }
        const card = cardElements[charId];
        if (card) {
          const disp = card.querySelector(".coord-display");
          if (disp) disp.textContent = `{${init2.x.toFixed(3)}, ${init2.y.toFixed(3)}}`;
        }
      }
    });
  };
  const actionGroup = doc.createElement("div");
  actionGroup.style.cssText = "display: flex; gap: 10px;";
  const cancelBtn = doc.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "\u53D6\u6D88";
  cancelBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #cbd5e1;
        padding: 6px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.15s ease;
    `;
  cancelBtn.onmouseenter = () => {
    cancelBtn.style.background = "rgba(255,255,255,0.12)";
  };
  cancelBtn.onmouseleave = () => {
    cancelBtn.style.background = "rgba(255,255,255,0.08)";
  };
  const applyBtn = doc.createElement("button");
  applyBtn.type = "button";
  applyBtn.textContent = "\u786E\u5B9A\u5E94\u7528";
  applyBtn.style.cssText = `
        background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
        border: none;
        color: #ffffff;
        padding: 6px 18px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
        transition: all 0.15s ease;
    `;
  applyBtn.onmouseenter = () => {
    applyBtn.style.filter = "brightness(1.1)";
    applyBtn.style.transform = "translateY(-1px)";
  };
  applyBtn.onmouseleave = () => {
    applyBtn.style.filter = "none";
    applyBtn.style.transform = "none";
  };
  actionGroup.appendChild(cancelBtn);
  actionGroup.appendChild(applyBtn);
  footer.appendChild(resetBtn);
  footer.appendChild(actionGroup);
  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay2.appendChild(dialog);
  let resizeRafId = null;
  const updateLayoutBounds = () => {
    if (!isMobile3 || !dialog || !overlay2.parentNode) return;
    let curTopBound = 10;
    let curBottomBound = win.innerHeight - 10;
    const topSettings = doc.querySelector("#top-settings-holder");
    if (topSettings) {
      const rect = topSettings.getBoundingClientRect();
      curTopBound = Math.max(10, Math.min(rect.bottom + 10, win.innerHeight * 0.5));
    }
    const sendEl = doc.querySelector("#send_form");
    if (sendEl) {
      const rect = sendEl.getBoundingClientRect();
      curBottomBound = Math.max(curTopBound + 200, Math.min(rect.top - 10, win.innerHeight - 10));
    }
    const curAvailHeight = Math.max(200, curBottomBound - curTopBound);
    dialog.style.top = `${curTopBound}px`;
    dialog.style.maxHeight = `${curAvailHeight}px`;
  };
  const handleResize = () => {
    if (resizeRafId) cancelAnimationFrame(resizeRafId);
    resizeRafId = requestAnimationFrame(() => {
      updateLayoutBounds();
    });
  };
  win.addEventListener("resize", handleResize);
  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeModal();
  };
  doc.addEventListener("keydown", handleKeyDown);
  const closeModal = () => {
    doc.removeEventListener("keydown", handleKeyDown);
    win.removeEventListener("resize", handleResize);
    if (resizeRafId) cancelAnimationFrame(resizeRafId);
    if (overlay2.parentNode) {
      overlay2.parentNode.removeChild(overlay2);
    }
  };
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  overlay2.onclick = (e) => {
    if (e.target === overlay2) closeModal();
  };
  applyBtn.onclick = () => {
    let updatedText = input.value || "";
    activeCharacters.forEach((charId) => {
      const coord = charCoords[charId];
      if (!coord) return;
      const coordStr = `{${coord.x.toFixed(3)},${coord.y.toFixed(3)}}`;
      const targetRegex = new RegExp(`(Character\\s+${charId}\\s+Prompt:[^;\\n]*?)(?:\\s*\\|\\s*centers\\s*:[^;\\n]+?)?(\\s*;|\\s*$)`, "i");
      if (targetRegex.test(updatedText)) {
        updatedText = updatedText.replace(targetRegex, (match, prefix, suffix) => {
          const cleanPrefix = prefix.trim();
          const end = suffix ? suffix.trim() : ";";
          return `${cleanPrefix}|centers:${coordStr}${end.startsWith(";") ? end : ";" + end}`;
        });
      }
    });
    input.value = updatedText;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    if (typeof onApply === "function") {
      try {
        onApply({ updatedValue: updatedText });
      } catch (err) {
        console.warn("[PositionEditor] onApply \u56DE\u8C03\u6267\u884C\u5F02\u5E38:", err);
      }
    }
    if (typeof toastr !== "undefined") {
      toastr.success("\u89D2\u8272\u4F4D\u7F6E\u5750\u6807\u5DF2\u6210\u529F\u5E94\u7528\uFF01");
    }
    closeModal();
  };
  doc.body.appendChild(overlay2);
  if (!isMobile3) {
    clampPopupToViewport(dialog, win);
  }
}

export { openPositionEditorDialog };
