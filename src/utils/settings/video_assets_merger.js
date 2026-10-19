// 还原自打包产物 — 原始模块: utils/settings/video_assets_merger.js
import { getConfigImage, saveConfigImage } from "../configDatabase.js";
import { getMobileLayoutBounds } from "../ui_common.js";
import { getVideoAssets, replaceVideoAssetImage } from "../videoAssetsService.js";
import { $activeTitle, $bgColor, $bgSelect, $board, $canvasH, $canvasW, $layerCount, $layersList, $mergerModal, $opacitySlider, $opacityVal, $pickerGrid, $pickerModal2, $presetSize, $propSection, $rotHandle, $rotSlider, $rotVal, $scaleSlider, $scaleVal, $stageWrap, $transformerBox, $viewport, __set_$activeTitle, __set_$bgColor, __set_$bgSelect, __set_$board, __set_$canvasH, __set_$canvasW, __set_$layerCount, __set_$layersList, __set_$mergerModal, __set_$opacitySlider, __set_$opacityVal, __set_$pickerGrid, __set_$pickerModal2, __set_$presetSize, __set_$propSection, __set_$rotHandle, __set_$rotSlider, __set_$rotVal, __set_$scaleSlider, __set_$scaleVal, __set_$stageWrap, __set_$transformerBox, __set_$viewport, __set_activeLayerId, __set_activeTool, __set_canvasBg, __set_canvasHeight, __set_canvasWidth, __set_currentDragMode, __set_currentEditingAsset, __set_currentPickerCategory, __set_dragStartLayer, __set_dragStartPointer, __set_isInitialized2, __set_isPanning, __set_isSpacePressed, __set_layers, __set_mergerMode, __set_mergerResizeHandler, __set_multiTouchState, __set_onAssetOverwrittenCallback, __set_onSaveNewAssetCallback, __set_panStartOffset, __set_panStartPointer, __set_scaleHandleDir, __set_viewportScale, activeLayerId, activeTool, canvasBg, canvasHeight, canvasWidth, currentDragMode, currentEditingAsset, currentPickerCategory, dragStartLayer, dragStartPointer, isInitialized2, isPanning, isSpacePressed, layers, mergerMode, mergerResizeHandler, multiTouchState, onAssetOverwrittenCallback, onSaveNewAssetCallback, panStartOffset, panStartPointer, scaleHandleDir, viewportPan, viewportScale } from "./video_frame_extractor.js";

function setSaveNewAssetCallback(callback) {
  __set_onSaveNewAssetCallback(callback);
}

function setAssetOverwrittenCallback(callback) {
  __set_onAssetOverwrittenCallback(callback);
}

function clearAllLayers() {
  __set_layers([]);
  __set_activeLayerId(null);
  if (isInitialized2) {
    renderLayers();
  }
}

function applyMergerMobileLayout() {
  if (!$mergerModal || !$mergerModal.length || !$mergerModal.is(":visible")) return;
  const $container4 = $mergerModal.find(".va-merger-container");
  if (window.innerWidth <= 768) {
    const { topBound, availableHeight } = getMobileLayoutBounds(document);
    $mergerModal.css({ "align-items": "start" });
    $container4.css({
      "margin-top": `${topBound}px`,
      "height": `${availableHeight}px`
    });
  } else {
    $mergerModal.css({ "align-items": "" });
    $container4.css({
      "margin-top": "",
      "height": ""
    });
  }
}

function ensureMergerResizeListener() {
  if (!mergerResizeHandler) {
    __set_mergerResizeHandler(() => {
      if ($mergerModal && $mergerModal.is(":visible")) {
        applyMergerMobileLayout();
        fitCanvasToViewport();
      }
    });
    window.addEventListener("resize", mergerResizeHandler, { passive: true });
    window.addEventListener("orientationchange", mergerResizeHandler, { passive: true });
  }
}

function openMergerForCreate() {
  if (!isInitialized2) {
    initMergerStudio();
  }
  __set_mergerMode("create");
  __set_currentEditingAsset(null);
  clearAllLayers();
  $("#va-merger-modal .va-merger-title span").text("\u56FE\u7247\u5408\u6210\u753B\u677F (\u65B0\u5EFA)");
  $("#va-merger-btn-save-asset").show();
  $("#va-merger-btn-overwrite-asset").hide();
  $("#va-merger-btn-save-as-new").hide();
  $mergerModal.css("display", "flex").hide().fadeIn(150, () => {
    applyMergerMobileLayout();
    fitCanvasToViewport();
  });
  applyMergerMobileLayout();
  requestAnimationFrame(() => {
    applyMergerMobileLayout();
    fitCanvasToViewport();
  });
  ensureMergerResizeListener();
  renderLayers();
}

function openMergerForAsset(asset, dataUrl) {
  if (!isInitialized2) {
    initMergerStudio();
  }
  __set_mergerMode("edit_asset");
  __set_currentEditingAsset(asset);
  clearAllLayers();
  $("#va-merger-modal .va-merger-title span").text(`\u56FE\u7247\u5408\u6210\u753B\u677F (\u6B63\u5728\u91CD\u5236: ${asset.name || "\u672A\u547D\u540D"})`);
  $("#va-merger-btn-save-asset").hide();
  $("#va-merger-btn-overwrite-asset").show();
  $("#va-merger-btn-save-as-new").show();
  $mergerModal.css("display", "flex").hide().fadeIn(150, () => {
    applyMergerMobileLayout();
    fitCanvasToViewport();
  });
  applyMergerMobileLayout();
  requestAnimationFrame(() => {
    applyMergerMobileLayout();
    fitCanvasToViewport();
  });
  ensureMergerResizeListener();
  addImageLayer(dataUrl, asset.name || "\u8D44\u4EA7\u7D20\u6750", asset.fileid, { autoFitCanvas: true, fullCover: true });
}

function closeMergerStudio() {
  $mergerModal.fadeOut(150);
  $mergerModal.css({ "align-items": "" });
  $mergerModal.find(".va-merger-container").css({
    "margin-top": "",
    "height": ""
  });
  if (mergerResizeHandler) {
    window.removeEventListener("resize", mergerResizeHandler);
    window.removeEventListener("orientationchange", mergerResizeHandler);
    __set_mergerResizeHandler(null);
  }
}

function initMergerStudio() {
  __set_$mergerModal($("#va-merger-modal"));
  __set_$board($("#va-merger-board"));
  __set_$stageWrap($("#va-merger-stage-wrap"));
  __set_$viewport($("#va-merger-viewport"));
  __set_$transformerBox($("#va-transformer-box"));
  __set_$rotHandle($("#va-handle-rot"));
  __set_$canvasW($("#va-merger-canvas-w"));
  __set_$canvasH($("#va-merger-canvas-h"));
  __set_$presetSize($("#va-merger-preset-size"));
  __set_$bgSelect($("#va-merger-bg-select"));
  __set_$bgColor($("#va-merger-bg-color"));
  __set_$layersList($("#va-merger-layer-list"));
  __set_$layerCount($("#va-merger-layer-count"));
  __set_$propSection($("#va-merger-prop-section"));
  __set_$activeTitle($("#va-merger-active-layer-title"));
  __set_$scaleSlider($("#va-merger-scale-slider"));
  __set_$scaleVal($("#va-merger-scale-val"));
  __set_$rotSlider($("#va-merger-rot-slider"));
  __set_$rotVal($("#va-merger-rot-val"));
  __set_$opacitySlider($("#va-merger-opacity-slider"));
  __set_$opacityVal($("#va-merger-opacity-val"));
  __set_$pickerModal2($("#va-merger-picker-modal"));
  __set_$pickerGrid($("#va-picker-grid"));
  bindHeaderEvents();
  bindViewportEvents();
  bindTransformerEvents();
  bindPropertyEvents();
  bindLayerListEvents();
  bindExportEvents();
  bindAssetPickerEvents();
  updateCanvasSize2(1024, 1024);
  __set_isInitialized2(true);
}

function bindHeaderEvents() {
  $("#va-merger-btn-close").on("click", closeMergerStudio);
  $presetSize.on("change", function() {
    const val = $(this).val();
    if (val === "custom") return;
    const [w, h] = val.split("x").map(Number);
    if (w && h) {
      $canvasW.val(w);
      $canvasH.val(h);
      updateCanvasSize2(w, h);
    }
  });
  const handleCustomSize = () => {
    const w = Math.min(4096, Math.max(64, parseInt($canvasW.val(), 10) || 1024));
    const h = Math.min(4096, Math.max(64, parseInt($canvasH.val(), 10) || 1024));
    $canvasW.val(w);
    $canvasH.val(h);
    $presetSize.val("custom");
    updateCanvasSize2(w, h);
  };
  $canvasW.on("change", handleCustomSize);
  $canvasH.on("change", handleCustomSize);
  $bgSelect.on("change", function() {
    const val = $(this).val();
    if (val === "custom") {
      $bgColor.show().click();
    } else {
      $bgColor.hide();
      setCanvasBackground(val);
    }
  });
  $bgColor.on("input change", function() {
    setCanvasBackground($(this).val());
  });
  $("#va-merger-btn-upload").on("click", () => {
    $("#va-merger-file-input").click();
  });
  $("#va-merger-file-input").on("change", handleLocalImageUpload);
  $("#va-merger-btn-pick-asset").on("click", openAssetPicker);
}

function updateCanvasSize2(w, h) {
  __set_canvasWidth(w);
  __set_canvasHeight(h);
  $board.css({
    width: `${w}px`,
    height: `${h}px`
  });
  $stageWrap.css({
    width: `${w}px`,
    height: `${h}px`
  });
  fitCanvasToViewport();
  updateTransformer();
}

function setCanvasBackground(bg) {
  __set_canvasBg(bg);
  if (bg === "transparent") {
    $board.css({
      "background-color": "transparent",
      "background-image": "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)"
    });
  } else {
    $board.css({
      "background-color": bg,
      "background-image": "none"
    });
  }
}

function bindViewportEvents() {
  $("#va-tool-select").on("click", () => setActiveTool("select"));
  $("#va-tool-hand").on("click", () => setActiveTool("hand"));
  $("#va-merger-zoom-in").on("click", () => setViewportScale(viewportScale * 1.15));
  $("#va-merger-zoom-out").on("click", () => setViewportScale(viewportScale / 1.15));
  $("#va-merger-zoom-fit").on("click", fitCanvasToViewport);
  $("#va-merger-zoom-100").on("click", () => {
    viewportPan.x = 0;
    viewportPan.y = 0;
    setViewportScale(1);
  });
  $viewport.on("wheel", (e) => {
    e.preventDefault();
    const delta = e.originalEvent.deltaY;
    const factor = delta > 0 ? 0.92 : 1.08;
    setViewportScale(viewportScale * factor);
  });
  $viewport.on("pointerdown", (e) => {
    if ($(e.target).closest(".va-merger-viewport-tools").length > 0) return;
    if (activeTool === "hand" || isSpacePressed || e.button === 1) {
      e.preventDefault();
      __set_isPanning(true);
      __set_panStartPointer({ x: e.clientX, y: e.clientY });
      __set_panStartOffset({ x: viewportPan.x, y: viewportPan.y });
      updateViewportCursor();
      $(window).on("pointermove.merger_pan", handlePanMove);
      $(window).on("pointerup.merger_pan pointercancel.merger_pan", handlePanUp);
      return;
    }
    if ($(e.target).closest(".va-layer-node, .va-transformer-box").length === 0) {
      setActiveLayer(null);
    }
  });
  $(window).off("keydown.merger_keys keyup.merger_keys").on("keydown.merger_keys", (e) => {
    if (!$mergerModal || !$mergerModal.is(":visible")) return;
    if ($(e.target).is("input, textarea, select")) return;
    if (e.code === "KeyV") {
      setActiveTool("select");
    } else if (e.code === "KeyH") {
      setActiveTool("hand");
    } else if (e.code === "Space" && !isSpacePressed) {
      __set_isSpacePressed(true);
      updateViewportCursor();
    }
  }).on("keyup.merger_keys", (e) => {
    if (e.code === "Space") {
      __set_isSpacePressed(false);
      updateViewportCursor();
    }
  });
  $(window).on("resize", () => {
    if ($mergerModal && $mergerModal.is(":visible")) {
      fitCanvasToViewport();
    }
  });
}

function setActiveTool(tool) {
  __set_activeTool(tool);
  $("#va-tool-select").toggleClass("active", tool === "select");
  $("#va-tool-hand").toggleClass("active", tool === "hand");
  updateViewportCursor();
}

function updateViewportCursor() {
  if (!$viewport) return;
  if (activeTool === "hand" || isSpacePressed) {
    $viewport.addClass("va-hand-mode");
    if (isPanning) {
      $viewport.addClass("va-panning");
    } else {
      $viewport.removeClass("va-panning");
    }
  } else {
    $viewport.removeClass("va-hand-mode va-panning");
  }
}

function handlePanMove(e) {
  if (!isPanning) return;
  const dx = e.clientX - panStartPointer.x;
  const dy = e.clientY - panStartPointer.y;
  viewportPan.x = Math.round(panStartOffset.x + dx);
  viewportPan.y = Math.round(panStartOffset.y + dy);
  updateStageTransform();
}

function handlePanUp() {
  __set_isPanning(false);
  updateViewportCursor();
  $(window).off("pointermove.merger_pan pointerup.merger_pan pointercancel.merger_pan");
}

function updateStageTransform() {
  if (!$stageWrap) return;
  $stageWrap.css("transform", `translate(${viewportPan.x}px, ${viewportPan.y}px) scale(${viewportScale})`);
}

function setViewportScale(scale) {
  __set_viewportScale(Math.min(3, Math.max(0.1, scale)));
  updateStageTransform();
}

function fitCanvasToViewport() {
  if (!$viewport || $viewport.length === 0) return;
  const vpW = $viewport.width() - 48;
  const vpH = $viewport.height() - 48;
  if (vpW <= 0 || vpH <= 0) return;
  const scale = Math.min(vpW / canvasWidth, vpH / canvasHeight, 1);
  viewportPan.x = 0;
  viewportPan.y = 0;
  setViewportScale(scale);
}

function addImageLayer(src, name = "\u56FE\u7247\u56FE\u5C42", fileid = "", options = {}) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const nw = img.naturalWidth || 500;
    const nh = img.naturalHeight || 500;
    if (options.autoFitCanvas) {
      __set_canvasWidth(nw);
      __set_canvasHeight(nh);
      if ($canvasW && $canvasH) {
        $canvasW.val(nw);
        $canvasH.val(nh);
        const sizeStr = `${nw}x${nh}`;
        if ($presetSize.find(`option[value="${sizeStr}"]`).length > 0) {
          $presetSize.val(sizeStr);
        } else {
          $presetSize.val("custom");
        }
      }
      if ($board) {
        $board.css({ width: `${nw}px`, height: `${nh}px` });
      }
      if ($stageWrap) {
        $stageWrap.css({ width: `${nw}px`, height: `${nh}px` });
      }
      fitCanvasToViewport();
    }
    let initW = nw;
    let initH = nh;
    if (options.fullCover || options.autoFitCanvas) {
      initW = canvasWidth;
      initH = canvasHeight;
    } else {
      if (nw > canvasWidth || nh > canvasHeight) {
        const ratio = Math.min(canvasWidth / nw, canvasHeight / nh);
        initW = Math.round(nw * ratio);
        initH = Math.round(nh * ratio);
      } else {
        initW = nw;
        initH = nh;
      }
    }
    const newLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      fileid,
      src,
      img,
      naturalWidth: nw,
      naturalHeight: nh,
      x: Math.round(canvasWidth / 2),
      y: Math.round(canvasHeight / 2),
      width: initW,
      height: initH,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };
    layers.push(newLayer);
    setActiveLayer(newLayer.id);
    renderLayers();
    toastr.success(`\u5DF2\u6DFB\u52A0\u56FE\u5C42\u300C${name}\u300D`);
  };
  img.onerror = (e) => {
    console.error("[VideoAssetsMerger] \u52A0\u8F7D\u56FE\u7247\u5931\u8D25", e);
    toastr.error(`\u52A0\u8F7D\u56FE\u7247\u300C${name}\u300D\u5931\u8D25`);
  };
  img.src = src;
}

function renderLayers() {
  $board.empty();
  layers.forEach((layer, idx) => {
    if (!layer.visible) return;
    const $node = $(`
            <div class="va-layer-node" data-id="${layer.id}" style="
                width: ${layer.width}px;
                height: ${layer.height}px;
                transform: translate(${layer.x - layer.width / 2}px, ${layer.y - layer.height / 2}px) rotate(${layer.rotation}deg) scale(${layer.scaleX}, ${layer.scaleY});
                opacity: ${layer.opacity};
                z-index: ${idx + 1};
            ">
                <img src="${layer.src}" alt="${escapeHtml8(layer.name)}">
            </div>
        `);
    bindLayerNodePointer($node, layer);
    $board.append($node);
  });
  $layersList.empty();
  $layerCount.text(layers.length);
  [...layers].reverse().forEach((layer) => {
    const isActive = layer.id === activeLayerId;
    const $item = $(`
            <div class="va-layer-item ${isActive ? "active" : ""}" data-id="${layer.id}">
                <img class="va-layer-thumb" src="${layer.src}">
                <div class="va-layer-info">
                    <div class="va-layer-name" title="${escapeHtml8(layer.name)}">${escapeHtml8(layer.name)}</div>
                    <div class="va-layer-meta">${Math.round(layer.width * Math.abs(layer.scaleX))}\xD7${Math.round(layer.height * Math.abs(layer.scaleY))}px \xB7 ${Math.round(layer.rotation)}\xB0</div>
                </div>
                <div class="va-layer-actions">
                    <button type="button" class="va-layer-btn va-btn-vis" title="${layer.visible ? "\u9690\u85CF" : "\u663E\u793A"}">
                        <i class="fa-regular ${layer.visible ? "fa-eye" : "fa-eye-slash"}" style="${!layer.visible ? "opacity:0.4" : ""}"></i>
                    </button>
                    <button type="button" class="va-layer-btn va-btn-lock" title="${layer.locked ? "\u89E3\u9501" : "\u9501\u5B9A"}">
                        <i class="fa-solid ${layer.locked ? "fa-lock" : "fa-lock-open"}" style="${layer.locked ? "color:#f59e0b" : ""}"></i>
                    </button>
                    <button type="button" class="va-layer-btn va-btn-layer-up" title="\u4E0A\u79FB\u4E00\u5C42"><i class="fa-solid fa-chevron-up"></i></button>
                    <button type="button" class="va-layer-btn va-btn-layer-down" title="\u4E0B\u79FB\u4E00\u5C42"><i class="fa-solid fa-chevron-down"></i></button>
                    <button type="button" class="va-layer-btn va-btn-copy" title="\u590D\u5236\u56FE\u5C42"><i class="fa-regular fa-copy"></i></button>
                    <button type="button" class="va-layer-btn danger va-btn-del" title="\u5220\u9664\u56FE\u5C42"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `);
    $layersList.append($item);
  });
  updateTransformer();
  updatePropertiesPanel();
}

function setActiveLayer(layerId) {
  __set_activeLayerId(layerId);
  updateTransformer();
  updatePropertiesPanel();
  $layersList.find(".va-layer-item").removeClass("active");
  if (layerId) {
    $layersList.find(`.va-layer-item[data-id="${layerId}"]`).addClass("active");
  }
}

function getActiveLayer() {
  return layers.find((l) => l.id === activeLayerId) || null;
}

function updateTransformer() {
  const layer = getActiveLayer();
  if (!layer || !layer.visible) {
    $transformerBox.hide();
    return;
  }
  const w = layer.width * Math.abs(layer.scaleX);
  const h = layer.height * Math.abs(layer.scaleY);
  const left = layer.x - w / 2;
  const top = layer.y - h / 2;
  $transformerBox.css({
    display: "block",
    width: `${w}px`,
    height: `${h}px`,
    transform: `translate(${left}px, ${top}px) rotate(${layer.rotation}deg)`
  });
}

function updatePropertiesPanel() {
  const layer = getActiveLayer();
  if (!layer) {
    $propSection.css({ opacity: "0.4", "pointer-events": "none" });
    $activeTitle.text("\u672A\u9009\u4E2D");
    return;
  }
  $propSection.css({ opacity: "1", "pointer-events": "auto" });
  $activeTitle.text(layer.name);
  const scalePercent = Math.round(Math.abs(layer.scaleX) * 100);
  $scaleSlider.val(scalePercent);
  $scaleVal.text(`${scalePercent}%`);
  const rotDeg = (Math.round(layer.rotation) % 360 + 360) % 360;
  $rotSlider.val(rotDeg);
  $rotVal.text(`${rotDeg}\xB0`);
  const opacityPercent = Math.round(layer.opacity * 100);
  $opacitySlider.val(opacityPercent);
  $opacityVal.text(`${opacityPercent}%`);
}

function bindLayerNodePointer($node, layer) {
  $node.on("pointerdown", function(e) {
    if (activeTool === "hand" || isSpacePressed || e.button === 1) {
      return;
    }
    if (layer.locked) return;
    e.stopPropagation();
    setActiveLayer(layer.id);
    __set_currentDragMode("move");
    __set_dragStartPointer({ x: e.clientX, y: e.clientY });
    __set_dragStartLayer({
      x: layer.x,
      y: layer.y,
      scaleX: layer.scaleX,
      scaleY: layer.scaleY,
      rotation: layer.rotation,
      width: layer.width,
      height: layer.height
    });
    $(window).on("pointermove.merger_drag", handlePointerMove);
    $(window).on("pointerup.merger_drag pointercancel.merger_drag", handlePointerUp);
  });
}

function bindTransformerEvents() {
  $rotHandle.on("pointerdown", function(e) {
    if (activeTool === "hand" || isSpacePressed || e.button === 1) return;
    const layer = getActiveLayer();
    if (!layer || layer.locked) return;
    e.stopPropagation();
    __set_currentDragMode("rotate");
    const center = getLayerScreenCenter(layer);
    const startAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x) * (180 / Math.PI);
    __set_dragStartLayer({
      rotation: layer.rotation,
      startAngle,
      centerX: center.x,
      centerY: center.y
    });
    $(window).on("pointermove.merger_drag", handlePointerMove);
    $(window).on("pointerup.merger_drag pointercancel.merger_drag", handlePointerUp);
  });
  $transformerBox.find(".va-scale-handle").on("pointerdown", function(e) {
    if (activeTool === "hand" || isSpacePressed || e.button === 1) return;
    const layer = getActiveLayer();
    if (!layer || layer.locked) return;
    e.stopPropagation();
    __set_currentDragMode("scale");
    __set_scaleHandleDir($(this).data("dir"));
    const center = getLayerScreenCenter(layer);
    __set_dragStartPointer({ x: e.clientX, y: e.clientY });
    __set_dragStartLayer({
      x: layer.x,
      y: layer.y,
      scaleX: layer.scaleX,
      scaleY: layer.scaleY,
      width: layer.width,
      height: layer.height,
      rotation: layer.rotation,
      centerX: center.x,
      centerY: center.y,
      initialDistance: Math.hypot(e.clientX - center.x, e.clientY - center.y)
    });
    $(window).on("pointermove.merger_drag", handlePointerMove);
    $(window).on("pointerup.merger_drag pointercancel.merger_drag", handlePointerUp);
  });
  const viewportEl = $viewport[0];
  if (viewportEl) {
    viewportEl.addEventListener("touchstart", handleTouchStart, { passive: false });
    viewportEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    viewportEl.addEventListener("touchend", handleTouchEnd, { passive: false });
  }
}

function getLayerScreenCenter(layer) {
  const stageRect = $board[0].getBoundingClientRect();
  const cx = stageRect.left + layer.x * viewportScale;
  const cy = stageRect.top + layer.y * viewportScale;
  return { x: cx, y: cy };
}

function handlePointerMove(e) {
  const layer = getActiveLayer();
  if (!layer || !currentDragMode) return;
  if (currentDragMode === "move") {
    const dx = (e.clientX - dragStartPointer.x) / viewportScale;
    const dy = (e.clientY - dragStartPointer.y) / viewportScale;
    layer.x = Math.round(dragStartLayer.x + dx);
    layer.y = Math.round(dragStartLayer.y + dy);
    renderLayers();
  } else if (currentDragMode === "rotate") {
    const currentAngle = Math.atan2(e.clientY - dragStartLayer.centerY, e.clientX - dragStartLayer.centerX) * (180 / Math.PI);
    const deltaAngle = currentAngle - dragStartLayer.startAngle;
    let newRot = (dragStartLayer.rotation + deltaAngle) % 360;
    if (newRot < 0) newRot += 360;
    layer.rotation = Math.round(newRot);
    renderLayers();
  } else if (currentDragMode === "scale") {
    const currentDist = Math.hypot(e.clientX - dragStartLayer.centerX, e.clientY - dragStartLayer.centerY);
    if (dragStartLayer.initialDistance > 0) {
      const factor = currentDist / dragStartLayer.initialDistance;
      const signX = Math.sign(dragStartLayer.scaleX) || 1;
      const signY = Math.sign(dragStartLayer.scaleY) || 1;
      const newScale = Math.max(0.05, Math.min(6, Math.abs(dragStartLayer.scaleX) * factor));
      layer.scaleX = Number((newScale * signX).toFixed(3));
      layer.scaleY = Number((newScale * signY).toFixed(3));
      renderLayers();
    }
  }
}

function handlePointerUp() {
  __set_currentDragMode(null);
  __set_scaleHandleDir(null);
  $(window).off("pointermove.merger_drag pointerup.merger_drag pointercancel.merger_drag");
}

function handleTouchStart(e) {
  if (e.touches.length === 2) {
    const layer = getActiveLayer();
    if (!layer || layer.locked) return;
    e.preventDefault();
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
    __set_multiTouchState({
      initialDist: dist,
      initialAngle: angle,
      startScaleX: layer.scaleX,
      startScaleY: layer.scaleY,
      startRotation: layer.rotation
    });
  }
}

function handleTouchMove(e) {
  if (e.touches.length === 2 && multiTouchState) {
    const layer = getActiveLayer();
    if (!layer || layer.locked) return;
    e.preventDefault();
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
    const scaleFactor = currentDist / multiTouchState.initialDist;
    const signX = Math.sign(multiTouchState.startScaleX) || 1;
    const signY = Math.sign(multiTouchState.startScaleY) || 1;
    const newScale = Math.max(0.05, Math.min(6, Math.abs(multiTouchState.startScaleX) * scaleFactor));
    layer.scaleX = Number((newScale * signX).toFixed(3));
    layer.scaleY = Number((newScale * signY).toFixed(3));
    const deltaAngle = currentAngle - multiTouchState.initialAngle;
    let newRot = (multiTouchState.startRotation + deltaAngle) % 360;
    if (newRot < 0) newRot += 360;
    layer.rotation = Math.round(newRot);
    renderLayers();
  }
}

function handleTouchEnd(e) {
  if (e.touches.length < 2) {
    __set_multiTouchState(null);
  }
}

function bindPropertyEvents() {
  $scaleSlider.on("input", function() {
    const layer = getActiveLayer();
    if (!layer) return;
    const val = parseInt($(this).val(), 10) / 100;
    const signX = Math.sign(layer.scaleX) || 1;
    const signY = Math.sign(layer.scaleY) || 1;
    layer.scaleX = val * signX;
    layer.scaleY = val * signY;
    $scaleVal.text(`${Math.round(val * 100)}%`);
    renderLayers();
  });
  $rotSlider.on("input", function() {
    const layer = getActiveLayer();
    if (!layer) return;
    const val = parseInt($(this).val(), 10);
    layer.rotation = val;
    $rotVal.text(`${val}\xB0`);
    renderLayers();
  });
  $opacitySlider.on("input", function() {
    const layer = getActiveLayer();
    if (!layer) return;
    const val = parseInt($(this).val(), 10) / 100;
    layer.opacity = val;
    $opacityVal.text(`${Math.round(val * 100)}%`);
    renderLayers();
  });
  $("#va-btn-align-center").on("click", () => {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.x = Math.round(canvasWidth / 2);
    layer.y = Math.round(canvasHeight / 2);
    renderLayers();
    toastr.info("\u5DF2\u5C45\u4E2D\u5BF9\u9F50");
  });
  $("#va-btn-fit-canvas").on("click", () => {
    const layer = getActiveLayer();
    if (!layer) return;
    const scale = Math.min(canvasWidth / layer.naturalWidth, canvasHeight / layer.naturalHeight);
    layer.width = Math.round(layer.naturalWidth * scale);
    layer.height = Math.round(layer.naturalHeight * scale);
    layer.scaleX = 1;
    layer.scaleY = 1;
    layer.x = Math.round(canvasWidth / 2);
    layer.y = Math.round(canvasHeight / 2);
    renderLayers();
  });
  $("#va-btn-fill-canvas").on("click", () => {
    const layer = getActiveLayer();
    if (!layer) return;
    const scale = Math.max(canvasWidth / layer.naturalWidth, canvasHeight / layer.naturalHeight);
    layer.width = Math.round(layer.naturalWidth * scale);
    layer.height = Math.round(layer.naturalHeight * scale);
    layer.scaleX = 1;
    layer.scaleY = 1;
    layer.x = Math.round(canvasWidth / 2);
    layer.y = Math.round(canvasHeight / 2);
    renderLayers();
  });
  $("#va-btn-reset-transform").on("click", () => {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.scaleX = 1;
    layer.scaleY = 1;
    layer.rotation = 0;
    layer.opacity = 1;
    layer.width = layer.naturalWidth;
    layer.height = layer.naturalHeight;
    renderLayers();
  });
  $("#va-btn-rot-cw").on("click", () => {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.rotation = (layer.rotation + 90) % 360;
    renderLayers();
  });
  $("#va-btn-rot-ccw").on("click", () => {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.rotation = (layer.rotation - 90 + 360) % 360;
    renderLayers();
  });
  $("#va-btn-flip-h").on("click", () => {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.scaleX = -layer.scaleX;
    renderLayers();
  });
  $("#va-btn-flip-v").on("click", () => {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.scaleY = -layer.scaleY;
    renderLayers();
  });
}

function bindLayerListEvents() {
  $("#va-merger-btn-clear-layers").on("click", () => {
    if (layers.length === 0) return;
    if (confirm("\u786E\u5B9A\u8981\u6E05\u7A7A\u753B\u5E03\u4E2D\u7684\u6240\u6709\u56FE\u5C42\u5417\uFF1F")) {
      __set_layers([]);
      setActiveLayer(null);
      renderLayers();
      toastr.info("\u5DF2\u6E05\u7A7A\u6240\u6709\u56FE\u5C42");
    }
  });
  $layersList.on("click", ".va-layer-item", function(e) {
    if ($(e.target).closest(".va-layer-btn").length > 0) return;
    const id = $(this).data("id");
    setActiveLayer(id);
  });
  $layersList.on("click", ".va-btn-vis", function(e) {
    e.stopPropagation();
    const id = $(this).closest(".va-layer-item").data("id");
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      layer.visible = !layer.visible;
      renderLayers();
    }
  });
  $layersList.on("click", ".va-btn-lock", function(e) {
    e.stopPropagation();
    const id = $(this).closest(".va-layer-item").data("id");
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      layer.locked = !layer.locked;
      renderLayers();
    }
  });
  $layersList.on("click", ".va-btn-layer-up", function(e) {
    e.stopPropagation();
    const id = $(this).closest(".va-layer-item").data("id");
    const idx = layers.findIndex((l) => l.id === id);
    if (idx !== -1 && idx < layers.length - 1) {
      const temp = layers[idx];
      layers[idx] = layers[idx + 1];
      layers[idx + 1] = temp;
      renderLayers();
    }
  });
  $layersList.on("click", ".va-btn-layer-down", function(e) {
    e.stopPropagation();
    const id = $(this).closest(".va-layer-item").data("id");
    const idx = layers.findIndex((l) => l.id === id);
    if (idx > 0) {
      const temp = layers[idx];
      layers[idx] = layers[idx - 1];
      layers[idx - 1] = temp;
      renderLayers();
    }
  });
  $layersList.on("click", ".va-btn-copy", function(e) {
    e.stopPropagation();
    const id = $(this).closest(".va-layer-item").data("id");
    const target = layers.find((l) => l.id === id);
    if (!target) return;
    const clone = {
      ...target,
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `${target.name}_\u526F\u672C`,
      x: target.x + 20,
      y: target.y + 20
    };
    layers.push(clone);
    setActiveLayer(clone.id);
    renderLayers();
    toastr.success(`\u5DF2\u590D\u5236\u56FE\u5C42\u300C${clone.name}\u300D`);
  });
  $layersList.on("click", ".va-btn-del", function(e) {
    e.stopPropagation();
    const id = $(this).closest(".va-layer-item").data("id");
    __set_layers(layers.filter((l) => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayer(layers.length > 0 ? layers[layers.length - 1].id : null);
    }
    renderLayers();
    toastr.info("\u56FE\u5C42\u5DF2\u5220\u9664");
  });
}

function handleLocalImageUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const baseName2 = file.name.replace(/\.[^/.]+$/, "");
      addImageLayer(event.target.result, baseName2);
    };
    reader.readAsDataURL(file);
  });
  $("#va-merger-file-input").val("");
}

function openAssetPicker() {
  renderPickerAssets();
  $pickerModal2.fadeIn(150);
}

function renderPickerAssets() {
  $pickerGrid.empty();
  const allAssets = getVideoAssets();
  let filtered = allAssets;
  if (currentPickerCategory !== "all") {
    filtered = filtered.filter((a) => a.category === currentPickerCategory);
  }
  if (filtered.length === 0) {
    $pickerGrid.html('<div style="grid-column: 1/-1; text-align: center; padding: 30px; opacity: 0.6;">\u5F53\u524D\u5206\u7C7B\u4E0B\u6682\u65E0\u7D20\u6750</div>');
    return;
  }
  filtered.forEach((asset) => {
    const $card = $(`
            <div class="va-picker-card va-privacy-blur" data-id="${asset.id}" data-fileid="${asset.fileid || ""}" data-name="${escapeHtml8(asset.name)}" style="position: relative; overflow: hidden;">
                <div style="position: relative; height: 90px; overflow: hidden; background: #000;">
                    <img class="va-picker-img" src="" alt="${escapeHtml8(asset.name)}">
                    <div class="va-privacy-overlay" style="font-size: 10px;">
                        <i class="fa-solid fa-eye-slash"></i>
                    </div>
                </div>
                <div class="va-picker-name" title="${escapeHtml8(asset.name)}">${escapeHtml8(asset.name)}</div>
            </div>
        `);
    if (asset.fileid) {
      getConfigImage(asset.fileid).then((dataUrl) => {
        if (dataUrl) {
          $card.find(".va-picker-img").attr("src", dataUrl);
          $card.data("img-src", dataUrl);
        }
      });
    }
    $pickerGrid.append($card);
  });
}

function bindAssetPickerEvents() {
  $("#va-picker-close").off("click").on("click", () => $pickerModal2.fadeOut(150));
  $("#va-picker-nav").find(".va-sub-nav-pill").off("click").on("click", function(e) {
    e.preventDefault();
    $("#va-picker-nav").find(".va-sub-nav-pill").removeClass("active");
    $(this).addClass("active");
    __set_currentPickerCategory($(this).data("picker-cat") || "all");
    renderPickerAssets();
  });
  $pickerGrid.off("click", ".va-picker-card").on("click", ".va-picker-card", function() {
    const name = $(this).data("name") || "\u8D44\u4EA7\u7D20\u6750";
    const fileid = $(this).data("fileid");
    const src = $(this).data("img-src") || $(this).find("img").attr("src");
    if (src) {
      addImageLayer(src, name, fileid);
      $pickerModal2.fadeOut(150);
    } else if (fileid) {
      getConfigImage(fileid).then((dataUrl) => {
        if (dataUrl) {
          addImageLayer(dataUrl, name, fileid);
          $pickerModal2.fadeOut(150);
        } else {
          toastr.error("\u8BFB\u53D6\u7D20\u6750\u56FE\u7247\u6570\u636E\u5931\u8D25");
        }
      });
    }
  });
}

function renderMergedOffscreenCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (canvasBg && canvasBg !== "transparent") {
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }
  layers.forEach((layer) => {
    if (!layer.visible || !layer.img) return;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.translate(layer.x, layer.y);
    ctx.rotate(layer.rotation * Math.PI / 180);
    ctx.scale(layer.scaleX, layer.scaleY);
    ctx.drawImage(
      layer.img,
      -layer.width / 2,
      -layer.height / 2,
      layer.width,
      layer.height
    );
    ctx.restore();
  });
  return canvas;
}

function bindExportEvents() {
  $("#va-merger-btn-save-asset").on("click", async () => {
    if (layers.length === 0) {
      toastr.warning("\u753B\u5E03\u4E2D\u6682\u65E0\u56FE\u5C42\uFF0C\u8BF7\u5148\u6DFB\u52A0\u56FE\u7247");
      return;
    }
    try {
      toastr.info("\u6B63\u5728\u6E32\u67D3\u751F\u6210\u72EC\u7ACB\u9AD8\u6E05\u56FE\u7247...");
      const canvas = renderMergedOffscreenCanvas();
      const dataUrl = canvas.toDataURL("image/png", 1);
      const fileId = await saveConfigImage(dataUrl, {
        filename: `image_asset_${Date.now()}.png`
      });
      closeMergerStudio();
      clearAllLayers();
      if (typeof onSaveNewAssetCallback === "function") {
        onSaveNewAssetCallback(dataUrl, fileId, `\u5408\u6210\u56FE\u7247_${Date.now().toString().slice(-4)}`);
      } else {
        toastr.success(`\u56FE\u7247\u5DF2\u6210\u529F\u751F\u6210\uFF01FileID: ${fileId}`);
      }
    } catch (err) {
      console.error("[VideoAssetsMerger] \u751F\u6210\u72EC\u7ACB\u56FE\u7247\u5931\u8D25:", err);
      toastr.error(`\u751F\u6210\u5931\u8D25: ${err.message}`);
    }
  });
  $("#va-merger-btn-overwrite-asset").on("click", async () => {
    if (!currentEditingAsset) {
      toastr.warning("\u5F53\u524D\u672A\u5173\u8054\u8981\u8986\u76D6\u7684\u8D44\u4EA7");
      return;
    }
    if (layers.length === 0) {
      toastr.warning("\u753B\u5E03\u4E2D\u6682\u65E0\u56FE\u5C42");
      return;
    }
    const assetName = currentEditingAsset.name || "\u5F53\u524D\u7D20\u6750";
    if (!confirm(`\u786E\u5B9A\u8981\u8986\u76D6\u73B0\u6709\u8D44\u4EA7\u300C${assetName}\u300D\u5417\uFF1F
\u539F\u56FE\u7247\u6570\u636E\u5C06\u88AB\u66FF\u6362\u4E3A\u5F53\u524D\u753B\u677F\u5408\u6210\u56FE\u50CF\uFF0C\u5E76\u81EA\u52A8\u6E05\u7406\u65E7\u5B58\u50A8\u3002`)) {
      return;
    }
    try {
      toastr.info(`\u6B63\u5728\u8986\u76D6\u4FDD\u5B58\u7D20\u6750\u300C${assetName}\u300D...`);
      const canvas = renderMergedOffscreenCanvas();
      const dataUrl = canvas.toDataURL("image/png", 1);
      const newFileId = await saveConfigImage(dataUrl, {
        filename: `image_asset_${Date.now()}.png`
      });
      await replaceVideoAssetImage(currentEditingAsset.id, newFileId);
      toastr.success(`\u5DF2\u6210\u529F\u8986\u76D6\u66F4\u65B0\u7D20\u6750\u300C${assetName}\u300D\uFF01`);
      closeMergerStudio();
      clearAllLayers();
      if (typeof onAssetOverwrittenCallback === "function") {
        onAssetOverwrittenCallback();
      }
    } catch (err) {
      console.error("[VideoAssetsMerger] \u8986\u76D6\u4FDD\u5B58\u8D44\u4EA7\u5931\u8D25:", err);
      toastr.error(`\u8986\u76D6\u4FDD\u5B58\u5931\u8D25: ${err.message}`);
    }
  });
  $("#va-merger-btn-save-as-new").on("click", async () => {
    if (layers.length === 0) {
      toastr.warning("\u753B\u5E03\u4E2D\u6682\u65E0\u56FE\u5C42");
      return;
    }
    try {
      toastr.info("\u6B63\u5728\u53E6\u5B58\u4E3A\u65B0\u56FE\u7247\u7D20\u6750...");
      const canvas = renderMergedOffscreenCanvas();
      const dataUrl = canvas.toDataURL("image/png", 1);
      const fileId = await saveConfigImage(dataUrl, {
        filename: `image_asset_${Date.now()}.png`
      });
      const baseName2 = currentEditingAsset ? currentEditingAsset.name : "\u56FE\u7247\u7D20\u6750";
      closeMergerStudio();
      clearAllLayers();
      if (typeof onSaveNewAssetCallback === "function") {
        onSaveNewAssetCallback(dataUrl, fileId, `${baseName2}_\u526F\u672C`);
      } else {
        toastr.success(`\u56FE\u7247\u5DF2\u6210\u529F\u53E6\u5B58\u4E3A\uFF01FileID: ${fileId}`);
      }
    } catch (err) {
      console.error("[VideoAssetsMerger] \u53E6\u5B58\u4E3A\u65B0\u56FE\u7247\u5931\u8D25:", err);
      toastr.error(`\u53E6\u5B58\u4E3A\u5931\u8D25: ${err.message}`);
    }
  });
  $("#va-merger-btn-download").on("click", () => {
    if (layers.length === 0) {
      toastr.warning("\u753B\u5E03\u4E2D\u6682\u65E0\u56FE\u5C42");
      return;
    }
    const canvas = renderMergedOffscreenCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `merged-asset-${canvasWidth}x${canvasHeight}-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastr.success("\u56FE\u7247\u5DF2\u5F00\u59CB\u4E0B\u8F7D");
  });
  $("#va-merger-btn-copy").on("click", () => {
    if (layers.length === 0) {
      toastr.warning("\u753B\u5E03\u4E2D\u6682\u65E0\u56FE\u5C42");
      return;
    }
    const canvas = renderMergedOffscreenCanvas();
    canvas.toBlob((blob) => {
      if (!blob) {
        toastr.error("\u751F\u6210\u56FE\u7247 Blob \u5931\u8D25");
        return;
      }
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]).then(() => {
          toastr.success("\u5408\u5E76\u56FE\u7247\u5DF2\u6210\u529F\u590D\u5236\u5230\u526A\u8D34\u677F\uFF01");
        }).catch((err) => {
          console.warn("[VideoAssetsMerger] \u526A\u8D34\u677F\u5199\u5165\u5931\u8D25", err);
          toastr.info("\u526A\u8D34\u677F\u590D\u5236\u53D7\u9650\uFF0C\u8BF7\u4F7F\u7528\u300C\u4E0B\u8F7D\u56FE\u7247\u300D");
        });
      } else {
        toastr.info("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u76F4\u63A5\u590D\u5236\u56FE\u7247\uFF0C\u8BF7\u4F7F\u7528\u300C\u4E0B\u8F7D\u56FE\u7247\u300D");
      }
    }, "image/png");
  });
}

function escapeHtml8(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export { addImageLayer, openMergerForAsset, openMergerForCreate, setAssetOverwrittenCallback, setSaveNewAssetCallback };
