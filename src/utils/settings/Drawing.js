// 还原自打包产物 — 原始模块: utils/settings/Drawing.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { handleCharacterDesignRequest } from "../characterGen.js";
import { handlePromptRequest } from "../promptReq.js";
import { BINDIED_ATTR, GRID_SIZE, LONG_PRESS_THRESHOLD, MOBILE_MOVE_THRESHOLD, MOVE_THRESHOLD, __set_activeDoc, __set_activeElement, __set_gestureCanvas, __set_gestureCtx, __set_gesturePoints, __set_gesturePollingTimer, __set_gestureStartTime, __set_isDrawing, __set_isLongPress, __set_isPending, __set_isRecording, __set_longPressTimer, __set_pendingEvent, __set_recordingResolve, __set_shouldBlockContextMenu, __set_startPoint, activeDoc, activeElement, boundEventHandlers, gestureCanvas, gestureCtx, gesturePoints, gesturePollingTimer, gestureStartTime, isDrawing, isLongPress, isPending, isRecording, longPressTimer, pendingEvent, recordingResolve, shouldBlockContextMenu, startPoint } from "./ClickTrigger.js";

function isMobile() {
  const touchSupported = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const screenSmall = window.innerWidth < 768;
  return touchSupported && screenSmall;
}

function parseTemplate(pattern) {
  return pattern.map((row) => row.split("").map((c) => c === "1" ? 1 : 0));
}

function createGestureCanvas(doc) {
  if (isMobile() && !extension_settings[extensionName].gestureShowTrail) return;
  const existing = doc.getElementById("gesture-canvas");
  if (existing) existing.remove();
  __set_gestureCanvas(doc.createElement("canvas"));
  gestureCanvas.id = "gesture-canvas";
  gestureCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 99999;
    `;
  const width = doc.documentElement.clientWidth || doc.body.clientWidth || window.innerWidth;
  const height = doc.documentElement.clientHeight || doc.body.clientHeight || window.innerHeight;
  gestureCanvas.width = width;
  gestureCanvas.height = height;
  doc.body.appendChild(gestureCanvas);
  __set_gestureCtx(gestureCanvas.getContext("2d"));
}

function removeGestureCanvas() {
  if (isMobile() && !extension_settings[extensionName].gestureShowTrail) return;
  if (gestureCanvas && gestureCanvas.parentNode) {
    gestureCanvas.remove();
  }
  __set_gestureCanvas(null);
  __set_gestureCtx(null);
}

function drawGestureTrail() {
  if (isMobile() && !extension_settings[extensionName].gestureShowTrail) return;
  if (!gestureCtx || gesturePoints.length < 2 || !extension_settings[extensionName].gestureShowTrail) return;
  gestureCtx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
  gestureCtx.beginPath();
  gestureCtx.moveTo(gesturePoints[0].x, gesturePoints[0].y);
  for (let i = 1; i < gesturePoints.length; i++) {
    gestureCtx.lineTo(gesturePoints[i].x, gesturePoints[i].y);
  }
  const trailColor = extension_settings[extensionName].gestureTrailColor ?? "#00ff00";
  gestureCtx.strokeStyle = trailColor;
  gestureCtx.lineWidth = 4;
  gestureCtx.lineCap = "round";
  gestureCtx.lineJoin = "round";
  gestureCtx.shadowColor = trailColor;
  gestureCtx.shadowBlur = 10;
  gestureCtx.stroke();
}

function distance(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function getBoundingBox(points) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function pointsToGrid(points) {
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  if (points.length < 2) return grid;
  const bbox = getBoundingBox(points);
  if (bbox.width < 5 && bbox.height < 5) {
    const gridX = Math.floor(GRID_SIZE / 2);
    const gridY = Math.floor(GRID_SIZE / 2);
    grid[gridY][gridX] = 1;
    return grid;
  }
  const maxDim = Math.max(bbox.width, bbox.height);
  const centerX = bbox.minX + bbox.width / 2;
  const centerY = bbox.minY + bbox.height / 2;
  const squareBbox = {
    minX: centerX - maxDim / 2,
    minY: centerY - maxDim / 2,
    size: maxDim
  };
  const scale = squareBbox.size > 0 ? GRID_SIZE / squareBbox.size : 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const gridX = Math.floor((p.x - squareBbox.minX) * scale);
    const gridY = Math.floor((p.y - squareBbox.minY) * scale);
    const clampedX = Math.min(Math.max(gridX, 0), GRID_SIZE - 1);
    const clampedY = Math.min(Math.max(gridY, 0), GRID_SIZE - 1);
    grid[clampedY][clampedX] = 1;
    if (i > 0) {
      const p1 = points[i - 1];
      const dist = distance(p1, p);
      const steps = Math.max(Math.ceil(dist / 3), 1);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const x = p1.x + (p.x - p1.x) * t;
        const y = p1.y + (p.y - p1.y) * t;
        const gx = Math.floor((x - squareBbox.minX) * scale);
        const gy = Math.floor((y - squareBbox.minY) * scale);
        const c_gx = Math.min(Math.max(gx, 0), GRID_SIZE - 1);
        const c_gy = Math.min(Math.max(gy, 0), GRID_SIZE - 1);
        grid[c_gy][c_gx] = 1;
      }
    }
  }
  return grid;
}

function dilateGrid(grid, radius = 1) {
  const result = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === 1) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
              result[ny][nx] = 1;
            }
          }
        }
      }
    }
  }
  return result;
}

function calculateSimilarityMetrics(userGrid, templateGrid) {
  let intersection = 0;
  let userSize = 0;
  let templateSize = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const userPixel = userGrid[y][x];
      const templatePixel = templateGrid[y][x];
      if (userPixel === 1) userSize++;
      if (templatePixel === 1) templateSize++;
      if (userPixel === 1 && templatePixel === 1) intersection++;
    }
  }
  const precision = userSize === 0 ? 0 : intersection / userSize;
  const recall = templateSize === 0 ? 0 : intersection / templateSize;
  const union = userSize + templateSize - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;
  return { precision, recall, jaccard };
}

function getMainDirection(points) {
  if (points.length < 2) return null;
  const start = points[0];
  const end = points[points.length - 1];
  return {
    dx: end.x - start.x,
    dy: end.y - start.y
  };
}

function matchGesture(points) {
  const userGrid = pointsToGrid(points);
  const dilatedUserGrid = dilateGrid(userGrid, 1);
  const gestureTemplates = {
    "gesture1": {
      name: "\u624B\u52BF\u4E00",
      pattern: extension_settings[extensionName].gesture1
    },
    "gesture2": {
      name: "\u624B\u52BF\u4E8C",
      pattern: extension_settings[extensionName].gesture2
    }
  };
  const results = [];
  for (const [key, template] of Object.entries(gestureTemplates)) {
    if (!template.pattern || !Array.isArray(template.pattern)) continue;
    const templateGrid = parseTemplate(template.pattern);
    const dilatedTemplateGrid = dilateGrid(templateGrid, 1);
    const metrics = calculateSimilarityMetrics(dilatedUserGrid, dilatedTemplateGrid);
    const { precision, recall } = metrics;
    const score = precision + recall === 0 ? 0 : 2 * (precision * recall) / (precision + recall);
    results.push({
      key,
      name: template.name,
      score,
      // F1 score is already between 0 and 1
      jaccard: metrics.jaccard,
      // 保留用于调试
      precision,
      // 保留用于调试
      recall
      // 保留用于调试
    });
  }
  results.sort((a, b) => b.score - a.score);
  const best = results[0];
  best.allResults = results.slice(0, 5);
  const threshold = (extension_settings[extensionName].gestureMatchThreshold ?? 60) / 100;
  if (best.score < threshold) {
    return {
      key: "unknown",
      name: "\u672A\u8BC6\u522B",
      score: best.score,
      allResults: results.slice(0, 5)
    };
  }
  return best;
}

function gridToString(grid) {
  return grid.map((row) => row.map((c) => c ? "\u2588" : "\xB7").join("")).join("\n");
}

function getGestureEmoji(key) {
  const emojis = {
    "gesture1": "1\uFE0F\u20E3",
    "gesture2": "2\uFE0F\u20E3",
    "unknown": "\u2753"
  };
  return emojis[key] || "\u2753";
}

function showGestureResult(doc, result, userGrid, targetElement) {
  if (isMobile() && !extension_settings[extensionName].gestureShowTrail) return;
  if (!extension_settings[extensionName].gestureShowRecognition) {
    console.log("[\u624B\u52BF] \u5DF2\u7981\u7528\u8BC6\u522B\u7ED3\u679C\u5C55\u793A\u3002");
    return;
  }
  const targetDoc = doc || document;
  const existing = targetDoc.getElementById("gesture-result");
  if (existing) existing.remove();
  const resultDiv = targetDoc.createElement("div");
  resultDiv.id = "gesture-result";
  const isSuccess = result.key !== "unknown";
  const score = Math.round(result.score * 100);
  let topStyle = "50%";
  let transformStyle = "translate(-50%, -50%)";
  if (isMobile()) {
    const topSettingsHolder = targetDoc.querySelector("#top-settings-holder");
    if (topSettingsHolder) {
      const rect = topSettingsHolder.getBoundingClientRect();
      topStyle = `${rect.bottom + 10}px`;
      transformStyle = "translateX(-50%)";
    }
  }
  resultDiv.style.cssText = `
        position: fixed;
        top: ${topStyle};
        left: 50%;
        transform: ${transformStyle};
        background: rgba(0, 0, 0, 0.95);
        color: #fff;
        padding: 20px;
        border-radius: 16px;
        font-size: 14px;
        z-index: 100000;
        text-align: center;
        width: min(90vw, 340px);
        box-sizing: border-box;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        border: 2px solid ${isSuccess ? "#00ff00" : "#ff6600"};
        font-family: monospace;
    `;
  const topResults = result.allResults.map(
    (r, i) => `<span style="color: ${i === 0 ? "#0f0" : "#666"}">${i + 1}. ${r.name} (${Math.round(r.score * 100)}%)</span>`
  ).join("<br>");
  const gestureTemplates = {
    "gesture1": { pattern: extension_settings[extensionName].gesture1 },
    "gesture2": { pattern: extension_settings[extensionName].gesture2 }
  };
  resultDiv.innerHTML = `
        <div style="font-size: 40px; margin-bottom: 10px;">
            ${getGestureEmoji(result.key)}
        </div>
        
        <div style="font-size: 22px; font-weight: bold; margin-bottom: 6px; color: ${isSuccess ? "#00ff00" : "#ff6600"};">
            ${result.name}
        </div>
        
        <div style="color: #888; font-size: 13px; margin-bottom: 14px;">
            \u5339\u914D\u5EA6: ${score}%
        </div>
        
        <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 14px;">
            <div>
                <div style="color: #666; font-size: 10px; margin-bottom: 4px;">\u4F60\u753B\u7684 (\u6B63\u65B9\u5F62\u5316)</div>
                <div style="font-size: 10px; line-height: 1.1; color: #0f0; background: #111; padding: 6px; border-radius: 4px;">
                    <pre style="margin: 0;">${gridToString(userGrid)}</pre>
                </div>
            </div>
            ${isSuccess && gestureTemplates[result.key].pattern ? `
            <div>
                <div style="color: #666; font-size: 10px; margin-bottom: 4px;">\u6A21\u677F</div>
                <div style="font-size: 10px; line-height: 1.1; color: #0ff; background: #111; padding: 6px; border-radius: 4px;">
                    <pre style="margin: 0;">${gridToString(parseTemplate(gestureTemplates[result.key].pattern))}</pre>
                </div>
            </div>
            ` : ""}
        </div>
        
        <div style="border-top: 1px solid #333; padding-top: 10px; font-size: 11px; text-align: left;">
            <div style="color: #888; margin-bottom: 6px;">\u5019\u9009\u7ED3\u679C:</div>
            ${topResults}
        </div>
    `;
  targetDoc.body.appendChild(resultDiv);
  setTimeout(() => {
    resultDiv.style.transition = "opacity 0.3s";
    resultDiv.style.opacity = "0";
    setTimeout(() => resultDiv.remove(), 300);
  }, 3500);
}

function showGestureHint(doc, text = "\u{1F3AF} \u7ED8\u5236\u624B\u52BF...") {
  if (isMobile() && !extension_settings[extensionName].gestureShowTrail) return;
  if (!extension_settings[extensionName].gestureShowTrail) return;
  const existing = doc.getElementById("gesture-hint");
  if (existing) existing.remove();
  const hint = doc.createElement("div");
  hint.id = "gesture-hint";
  hint.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 128, 0, 0.9);
        color: #fff;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 100000;
        pointer-events: none;
    `;
  hint.textContent = text;
  doc.body.appendChild(hint);
  if (!isRecording) {
    setTimeout(() => {
      hint.style.transition = "opacity 0.3s";
      hint.style.opacity = "0";
      setTimeout(() => hint.remove(), 300);
    }, 1500);
  }
}

function getEventPoint(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if (e.changedTouches && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function handleGestureComplete(doc, targetElement) {
  if (isMobile()) {
    const bbox = getBoundingBox(gesturePoints);
    const mainDir = getMainDirection(gesturePoints);
    if (Math.abs(mainDir.dy) > Math.abs(mainDir.dx) * 2.5 && bbox.height > 80) {
      console.log("[\u624B\u52BF] \u68C0\u6D4B\u4E3A\u6EDA\u52A8\u64CD\u4F5C\uFF0C\u5DF2\u5FFD\u7565\u3002");
      return;
    }
  }
  const userGrid = pointsToGrid(gesturePoints);
  const userPattern = userGrid.map((row) => row.join(""));
  if (isRecording && recordingResolve) {
    console.log("[\u624B\u52BF] \u5F55\u5236\u5B8C\u6210");
    __set_isRecording(false);
    recordingResolve(userPattern);
    __set_recordingResolve(null);
    const hint = doc.getElementById("gesture-hint");
    if (hint) hint.remove();
    toastr.success("\u624B\u52BF\u5DF2\u5F55\u5236\uFF01");
    return;
  }
  console.log("[\u624B\u52BF] ================ \u5F00\u59CB\u8BC6\u522B ================");
  console.log("[\u624B\u52BF] \u91C7\u96C6\u70B9\u6570:", gesturePoints.length);
  console.log("[\u624B\u52BF] \u7528\u6237\u7F51\u683C (10x10 \u6B63\u65B9\u5F62\u5316):\n" + gridToString(userGrid));
  const result = matchGesture(gesturePoints);
  console.log("[\u624B\u52BF] \u8BC6\u522B\u7ED3\u679C:", result.name);
  console.log("[\u624B\u52BF] \u5339\u914D\u5EA6:", Math.round(result.score * 100) + "%");
  console.log("[\u624B\u52BF] \u524D2\u5019\u9009:", result.allResults.map((r) => `${r.name}(${Math.round(r.score * 100)}%)`).join(", "));
  console.log("[\u624B\u52BF] ================================================");
  if (result.key !== "unknown") {
    if (result.key === "gesture1") {
      console.log("[\u624B\u52BF] \u68C0\u6D4B\u5230\u624B\u52BF\u4E00 - \u89E6\u53D1\u56FE\u7247\u751F\u6210");
      handlePromptRequest(targetElement, result.key);
    } else if (result.key === "gesture2") {
      console.log("[\u624B\u52BF] \u68C0\u6D4B\u5230\u624B\u52BF\u4E8C - \u89E6\u53D1\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1");
      handleCharacterDesignRequest(targetElement);
    }
  }
  const event = new CustomEvent("gesture-complete", {
    detail: {
      gesture: result.key,
      gestureName: result.name,
      score: result.score,
      grid: userGrid,
      targetElement,
      points: gesturePoints.slice(),
      allResults: result.allResults
    }
  });
  document.dispatchEvent(event);
  showGestureResult(doc, result, userGrid, targetElement);
}

function createGestureHandlers(doc, targetElement = null) {
  function onGestureStart(e) {
    if (isRecording) {
      e.preventDefault();
      e.stopPropagation();
    }
    __set_isDrawing(true);
    __set_activeDoc(doc);
    __set_activeElement(targetElement);
    __set_gesturePoints([getEventPoint(e)]);
    __set_gestureStartTime(Date.now());
    createGestureCanvas(doc);
    if (isRecording) {
      showGestureHint(doc, "\u5F55\u5236\u4E2D... \u8BF7\u5728\u5C4F\u5E55\u4E0A\u7ED8\u5236\u624B\u52BF");
    } else {
      showGestureHint(doc);
    }
  }
  function onGestureMove(e) {
    if (!isDrawing) return;
    const point = getEventPoint(e);
    const last = gesturePoints[gesturePoints.length - 1];
    if (distance(last, point) >= 2) {
      gesturePoints.push(point);
      drawGestureTrail();
    }
  }
  function onGestureEnd(e) {
    if (!isDrawing) return;
    __set_isDrawing(false);
    if (gesturePoints.length < 10) {
      removeGestureCanvas();
      __set_gesturePoints([]);
      return;
    }
    handleGestureComplete(doc, activeElement);
    setTimeout(removeGestureCanvas, 500);
    __set_gesturePoints([]);
    __set_activeDoc(null);
    __set_activeElement(null);
  }
  return { onGestureStart, onGestureMove, onGestureEnd };
}

function clearPendingState() {
  __set_isPending(false);
  __set_pendingEvent(null);
  __set_startPoint(null);
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    __set_longPressTimer(null);
  }
  __set_isLongPress(false);
}

function bindGestureToMesText(element) {
  if (element.hasAttribute(BINDIED_ATTR)) return false;
  element.setAttribute(BINDIED_ATTR, "true");
  return true;
}

function initDocumentGestureEvents(doc = document) {
  if (doc._gestureEventsInitialized) return;
  doc._gestureEventsInitialized = true;
  const handlers = {
    mousedown: (e) => {
      if (!extension_settings[extensionName].gestureEnabled) return;
      if (isMobile() || !isRecording && e.button !== 2) return;
      const mesText = e.target.closest('.mes_text[data-gesture-bindied="true"]');
      let targetEl = mesText;
      if (!targetEl && doc.defaultView.frameElement && doc.body.hasAttribute(BINDIED_ATTR)) {
        let currentEl = e.target;
        if (currentEl.tagName !== "DIV") {
          currentEl = currentEl.closest("div");
        }
        if (currentEl) {
          targetEl = currentEl;
        }
      }
      if (!isRecording && !targetEl) return;
      __set_isPending(true);
      __set_startPoint(getEventPoint(e));
      __set_pendingEvent({ target: targetEl || e.target, originalEvent: e });
    },
    mousemove: (e) => {
      if (isMobile()) return;
      if (isPending && pendingEvent && !isDrawing) {
        const point = getEventPoint(e);
        if (distance(startPoint, point) >= MOVE_THRESHOLD) {
          __set_isPending(false);
          __set_shouldBlockContextMenu(true);
          const gestureHandlers = createGestureHandlers(doc, pendingEvent.target);
          doc._currentGestureHandlers = gestureHandlers;
          gestureHandlers.onGestureStart(pendingEvent.originalEvent);
          gesturePoints.push(point);
          drawGestureTrail();
        }
      }
      if (doc._currentGestureHandlers && isDrawing) {
        doc._currentGestureHandlers.onGestureMove(e);
      }
    },
    mouseup: (e) => {
      if (isMobile() || !isDrawing && !isPending) return;
      if (!isRecording && e.button !== 2) return;
      if (isPending && !isDrawing) {
        clearPendingState();
        return;
      }
      if (isDrawing && doc._currentGestureHandlers) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        doc._currentGestureHandlers.onGestureEnd(e);
        doc._currentGestureHandlers = null;
        clearPendingState();
        setTimeout(() => {
          __set_shouldBlockContextMenu(false);
        }, 100);
      }
    },
    contextmenu: (e) => {
      if (isMobile() || shouldBlockContextMenu || isDrawing) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    },
    touchstart: (e) => {
      if (!extension_settings[extensionName].gestureEnabled) return;
      if (!isMobile() || e.touches.length !== 1) return;
      const mesText = e.target.closest('.mes_text[data-gesture-bindied="true"]');
      let targetEl = mesText;
      if (!targetEl && doc.defaultView.frameElement && doc.body.hasAttribute(BINDIED_ATTR)) {
        let currentEl = e.target;
        if (currentEl.tagName !== "DIV") {
          currentEl = currentEl.closest("div");
        }
        if (currentEl) {
          targetEl = currentEl;
        }
      }
      if (!isRecording && !targetEl) return;
      __set_isLongPress(false);
      __set_isPending(false);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        __set_longPressTimer(null);
      }
      __set_startPoint(getEventPoint(e));
      __set_pendingEvent({ target: targetEl || e.target, originalEvent: e });
      __set_longPressTimer(setTimeout(() => {
        if (!isDrawing) {
          __set_isLongPress(true);
          __set_pendingEvent(null);
          __set_startPoint(null);
          console.log("[\u624B\u52BF] \u68C0\u6D4B\u5230\u957F\u6309\uFF0C\u653E\u884C\u7ED9\u7CFB\u7EDF\u5904\u7406\u590D\u5236");
        }
      }, LONG_PRESS_THRESHOLD));
    },
    touchmove: (e) => {
      if (!isMobile()) return;
      if (isLongPress) return;
      if (!startPoint || !pendingEvent) return;
      if (isDrawing && doc._currentGestureHandlers) {
        doc._currentGestureHandlers.onGestureMove(e);
        return;
      }
      const point = getEventPoint(e);
      if (distance(startPoint, point) >= MOBILE_MOVE_THRESHOLD) {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          __set_longPressTimer(null);
        }
        __set_isPending(false);
        const gestureHandlers = createGestureHandlers(doc, pendingEvent.target);
        doc._currentGestureHandlers = gestureHandlers;
        gestureHandlers.onGestureStart(pendingEvent.originalEvent);
        gesturePoints.push(point);
        drawGestureTrail();
      }
    },
    touchend: (e) => {
      if (!isMobile()) return;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        __set_longPressTimer(null);
      }
      if (isLongPress) {
        setTimeout(() => {
          __set_isLongPress(false);
          __set_startPoint(null);
          __set_pendingEvent(null);
        }, 1e3);
        return;
      }
      if (!isDrawing) {
        __set_startPoint(null);
        __set_pendingEvent(null);
        __set_isPending(false);
        return;
      }
      if (doc._currentGestureHandlers) {
        doc._currentGestureHandlers.onGestureEnd(e);
        doc._currentGestureHandlers = null;
      }
      clearPendingState();
    },
    touchcancel: (e) => {
      if (!isMobile()) return;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        __set_longPressTimer(null);
      }
      if (isLongPress) {
        setTimeout(() => {
          __set_isLongPress(false);
          __set_startPoint(null);
          __set_pendingEvent(null);
        }, 1e3);
        return;
      }
      clearPendingState();
      __set_startPoint(null);
      __set_pendingEvent(null);
      if (doc._currentGestureHandlers && isDrawing) {
        __set_isDrawing(false);
        removeGestureCanvas();
        doc._currentGestureHandlers = null;
      }
    }
  };
  boundEventHandlers.set(doc, handlers);
  doc.addEventListener("mousedown", handlers.mousedown, true);
  doc.addEventListener("mousemove", handlers.mousemove, true);
  doc.addEventListener("mouseup", handlers.mouseup, true);
  doc.addEventListener("contextmenu", handlers.contextmenu, true);
  doc.addEventListener("touchstart", handlers.touchstart, { passive: true });
  doc.addEventListener("touchmove", handlers.touchmove, { passive: true });
  doc.addEventListener("touchend", handlers.touchend, { passive: true });
  doc.addEventListener("touchcancel", handlers.touchcancel, { passive: true });
}

function removeDocumentGestureEvents(doc = document) {
  if (!doc._gestureEventsInitialized) return;
  const handlers = boundEventHandlers.get(doc);
  if (handlers) {
    doc.removeEventListener("mousedown", handlers.mousedown, true);
    doc.removeEventListener("mousemove", handlers.mousemove, true);
    doc.removeEventListener("mouseup", handlers.mouseup, true);
    doc.removeEventListener("contextmenu", handlers.contextmenu, true);
    doc.removeEventListener("touchstart", handlers.touchstart, { passive: true });
    doc.removeEventListener("touchmove", handlers.touchmove, { passive: true });
    doc.removeEventListener("touchend", handlers.touchend, { passive: true });
    doc.removeEventListener("touchcancel", handlers.touchcancel, { passive: true });
    boundEventHandlers.delete(doc);
  }
  doc._gestureEventsInitialized = false;
}

function scanGestureElements() {
  initDocumentGestureEvents(document);
  const mesTextElements = document.getElementsByClassName("mes_text");
  for (const element of mesTextElements) {
    bindGestureToMesText(element);
  }
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    try {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc || !iframeDoc.body) return;
      initDocumentGestureEvents(iframeDoc);
      if (!iframeDoc.body.hasAttribute(BINDIED_ATTR)) {
        iframeDoc.body.setAttribute(BINDIED_ATTR, "true");
      }
      const iframeMesTexts = iframeDoc.getElementsByClassName("mes_text");
      for (const element of iframeMesTexts) {
        bindGestureToMesText(element);
      }
    } catch (e) {
    }
  });
}

function initGestureMonitor() {
  console.log("[\u624B\u52BF\u76D1\u63A7] ====== \u521D\u59CB\u5316 (10x10 \u6B63\u65B9\u5F62\u5316\u7F51\u683C) ======");
  console.log("[\u624B\u52BF\u76D1\u63A7] \u7279\u6027: \u5F3A\u5236\u62C9\u4F38\u4E3A\u6B63\u65B9\u5F62 + \u81A8\u80C0\u5BB9\u9519 + \u52A8\u6001\u6A21\u677F");
  if (gesturePollingTimer) return;
  scanGestureElements();
  __set_gesturePollingTimer(setInterval(scanGestureElements, 3e3));
  console.log("[\u624B\u52BF\u76D1\u63A7] \u2713 \u5DF2\u542F\u52A8");
}

function stopGestureMonitor() {
  console.log("[\u624B\u52BF\u76D1\u63A7] ====== \u505C\u6B62\u76D1\u63A7 ======");
  if (gesturePollingTimer) {
    clearInterval(gesturePollingTimer);
    __set_gesturePollingTimer(null);
  }
  removeDocumentGestureEvents(document);
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    try {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        removeDocumentGestureEvents(iframeDoc);
      }
    } catch (e) {
    }
  });
  const mesTextElements = document.getElementsByClassName("mes_text");
  for (const element of mesTextElements) {
    element.removeAttribute(BINDIED_ATTR);
  }
  console.log("[\u624B\u52BF\u76D1\u63A7] \u2713 \u5DF2\u505C\u6B62");
}

async function recordGesture() {
  return new Promise((resolve) => {
    __set_isRecording(true);
    __set_recordingResolve(resolve);
    showGestureHint(document, "\u51C6\u5907\u5F55\u5236... \u8BF7\u6309\u4F4F\u9F20\u6807/\u89E6\u6478\u5C4F\u5E55\u5F00\u59CB\u7ED8\u5236");
  });
}

export { initGestureMonitor, recordGesture, stopGestureMonitor };
