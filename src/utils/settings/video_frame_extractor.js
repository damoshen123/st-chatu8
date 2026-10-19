// 还原自打包产物 — 原始模块: utils/settings/video_frame_extractor.js
import { saveConfigImage } from "../configDatabase.js";
import { getMobileLayoutBounds } from "../ui_common.js";
import { addVideoAsset } from "../videoAssetsService.js";
import { $btnCapture, $btnCopy, $btnDownload, $btnFirst, $btnLast, $btnNext1, $btnNext10, $btnPlay, $btnPrev1, $btnPrev10, $btnSaveAsset, $btnToMerger, $changeVideoBtn, $closeBtn, $curFrameText, $curTimeText, $dropzone, $fileInput, $fpsSelect, $inputCategory, $inputDesc, $inputName, $jumpFrameInput, $metaBadge, $metaText, $modal, $monitorFps, $monitorInfo, $monitorRes, $previewCard, $previewEmpty, $previewImg, $shutterFlash, $slider, $specBar, $totalFramesText, $totalTimeText, $uploadEmpty, $video, __set_$btnCapture, __set_$btnCopy, __set_$btnDownload, __set_$btnFirst, __set_$btnLast, __set_$btnNext1, __set_$btnNext10, __set_$btnPlay, __set_$btnPrev1, __set_$btnPrev10, __set_$btnSaveAsset, __set_$btnToMerger, __set_$changeVideoBtn, __set_$closeBtn, __set_$curFrameText, __set_$curTimeText, __set_$dropzone, __set_$fileInput, __set_$fpsSelect, __set_$inputCategory, __set_$inputDesc, __set_$inputName, __set_$jumpFrameInput, __set_$metaBadge, __set_$metaText, __set_$modal, __set_$monitorFps, __set_$monitorInfo, __set_$monitorRes, __set_$previewCard, __set_$previewEmpty, __set_$previewImg, __set_$shutterFlash, __set_$slider, __set_$specBar, __set_$totalFramesText, __set_$totalTimeText, __set_$uploadEmpty, __set_$video, __set_currentCapturedBlob, __set_currentCapturedDataUrl, __set_currentVideoFile, __set_currentVideoObjectUrl, __set_extractorResizeHandler, __set_fps, __set_isInitialized3, __set_isPlaying, __set_isSliderDragging, __set_totalFrames, __set_videoDuration, __set_videoEl, __set_videoHeight, __set_videoWidth, currentCapturedBlob, currentCapturedDataUrl, currentVideoFile, currentVideoObjectUrl, extractorResizeHandler, fps, isInitialized3, isPlaying, isSliderDragging, renderAssetsList, totalFrames, videoDuration, videoEl, videoHeight, videoWidth } from "./video_assets.js";
import { addImageLayer, openMergerForCreate } from "./video_assets_merger.js";
import { detectVideoFps } from "./video_fps_detector.js";

var $activeTitle, $bgColor, $bgSelect, $board, $canvasH, $canvasW, $layerCount, $layersList, $mergerModal, $opacitySlider, $opacityVal, $pickerGrid, $pickerModal2, $presetSize, $propSection, $rotHandle, $rotSlider, $rotVal, $scaleSlider, $scaleVal, $stageWrap, $transformerBox, $viewport, activeLayerId, activeTool, canvasBg, canvasHeight, canvasWidth, currentDragMode, currentEditingAsset, currentPickerCategory, dragStartLayer, dragStartPointer, isInitialized2, isPanning, isSpacePressed, layers, mergerMode, mergerResizeHandler, multiTouchState, onAssetOverwrittenCallback, onSaveNewAssetCallback, panStartOffset, panStartPointer, scaleHandleDir, viewportPan, viewportScale;

var canvasWidth = 1024;

var canvasHeight = 1024;

var canvasBg = "transparent";

var layers = [];

var activeLayerId = null;

var viewportScale = 1;

var viewportPan = { x: 0, y: 0 };

var activeTool = "select";

var isPanning = false;

var isSpacePressed = false;

var panStartPointer = { x: 0, y: 0 };

var panStartOffset = { x: 0, y: 0 };

var isInitialized2 = false;

var mergerResizeHandler = null;

var mergerMode = "create";

var currentEditingAsset = null;

var currentDragMode = null;

var scaleHandleDir = null;

var dragStartPointer = { x: 0, y: 0 };

var dragStartLayer = null;

var multiTouchState = null;

var onSaveNewAssetCallback = null;

var onAssetOverwrittenCallback = null;

var currentPickerCategory = "all";
function applyExtractorMobileLayout() {
  if (!$modal || !$modal.length || !$modal.is(":visible")) return;
  const $container4 = $modal.find(".va-extractor-container");
  if (window.innerWidth <= 768) {
    const { topBound, availableHeight } = getMobileLayoutBounds(document);
    $modal.css({ "align-items": "start" });
    $container4.css({
      "margin-top": `${topBound}px`,
      "height": `${availableHeight}px`
    });
  } else {
    $modal.css({ "align-items": "" });
    $container4.css({
      "margin-top": "",
      "height": ""
    });
  }
}

function initVideoFrameExtractor() {
  __set_$modal($("#va-extractor-modal"));
  if ($modal.length === 0) return;
  __set_$video($("#va-extractor-video"));
  __set_videoEl($video[0]);
  __set_$uploadEmpty($("#va-extractor-upload-empty"));
  __set_$dropzone($("#va-extractor-dropzone"));
  __set_$fileInput($("#va-extractor-video-file-input"));
  __set_$changeVideoBtn($("#va-extractor-btn-change-video"));
  __set_$closeBtn($("#va-extractor-btn-close"));
  __set_$shutterFlash($("#va-extractor-shutter-flash"));
  __set_$metaBadge($("#va-extractor-meta-badge"));
  __set_$metaText($("#va-extractor-meta-text"));
  __set_$monitorInfo($("#va-extractor-monitor-info"));
  __set_$monitorRes($("#va-extractor-monitor-res"));
  __set_$monitorFps($("#va-extractor-monitor-fps"));
  __set_$slider($("#va-extractor-slider"));
  __set_$curTimeText($("#va-extractor-cur-time"));
  __set_$totalTimeText($("#va-extractor-total-time"));
  __set_$curFrameText($("#va-extractor-cur-frame"));
  __set_$totalFramesText($("#va-extractor-total-frames"));
  __set_$btnPlay($("#va-extractor-btn-play"));
  __set_$btnFirst($("#va-extractor-btn-first"));
  __set_$btnLast($("#va-extractor-btn-last"));
  __set_$btnPrev10($("#va-extractor-btn-prev-10"));
  __set_$btnPrev1($("#va-extractor-btn-prev-1"));
  __set_$btnNext1($("#va-extractor-btn-next-1"));
  __set_$btnNext10($("#va-extractor-btn-next-10"));
  __set_$fpsSelect($("#va-extractor-fps-select"));
  __set_$jumpFrameInput($("#va-extractor-jump-frame"));
  __set_$btnCapture($("#va-extractor-btn-capture"));
  __set_$previewCard($("#va-extractor-preview-card"));
  __set_$previewImg($("#va-extractor-preview-img"));
  __set_$previewEmpty($("#va-extractor-preview-empty"));
  __set_$specBar($("#va-extractor-spec-bar"));
  __set_$inputName($("#va-extractor-input-name"));
  __set_$inputCategory($("#va-extractor-input-category"));
  __set_$inputDesc($("#va-extractor-input-desc"));
  __set_$btnSaveAsset($("#va-extractor-btn-save-asset"));
  __set_$btnDownload($("#va-extractor-btn-download"));
  __set_$btnCopy($("#va-extractor-btn-copy"));
  __set_$btnToMerger($("#va-extractor-btn-to-merger"));
  bindUploadEvents();
  bindVideoPlaybackEvents();
  bindFrameControlEvents();
  bindCaptureEvents();
  bindExportEvents2();
  bindKeyboardShortcuts();
  __set_isInitialized3(true);
}

function openVideoFrameExtractor() {
  if (!isInitialized3) {
    initVideoFrameExtractor();
  }
  $modal.css("display", "flex").hide().fadeIn(150, () => {
    applyExtractorMobileLayout();
  });
  applyExtractorMobileLayout();
  if (!extractorResizeHandler) {
    __set_extractorResizeHandler(() => {
      if ($modal && $modal.is(":visible")) {
        applyExtractorMobileLayout();
      }
    });
    window.addEventListener("resize", extractorResizeHandler, { passive: true });
    window.addEventListener("orientationchange", extractorResizeHandler, { passive: true });
  }
}

function closeVideoFrameExtractor() {
  if (videoEl) {
    videoEl.pause();
  }
  __set_isPlaying(false);
  updatePlayButtonUI();
  $modal.fadeOut(150);
  $modal.css({ "align-items": "" });
  $modal.find(".va-extractor-container").css({
    "margin-top": "",
    "height": ""
  });
  if (extractorResizeHandler) {
    window.removeEventListener("resize", extractorResizeHandler);
    window.removeEventListener("orientationchange", extractorResizeHandler);
    __set_extractorResizeHandler(null);
  }
}

function bindUploadEvents() {
  $closeBtn.off("click").on("click", closeVideoFrameExtractor);
  $changeVideoBtn.off("click").on("click", () => {
    $fileInput.val("").click();
  });
  $dropzone.off("click").on("click", () => {
    $fileInput.val("").click();
  });
  $dropzone.off("dragover dragleave drop");
  $dropzone.on("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $dropzone.addClass("dragover");
  });
  $dropzone.on("dragleave drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $dropzone.removeClass("dragover");
  });
  $dropzone.on("drop", (e) => {
    const files = e.originalEvent.dataTransfer?.files;
    if (files && files.length > 0) {
      handleVideoFile(files[0]);
    }
  });
  $fileInput.off("change").on("change", (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleVideoFile(files[0]);
    }
  });
}

function handleVideoFile(file) {
  if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
    toastr.warning("\u8BF7\u4E0A\u4F20\u6709\u6548\u7684\u89C6\u9891\u683C\u5F0F\u6587\u4EF6 (\u5982 MP4, WebM, MOV, MKV \u7B49)");
    return;
  }
  if (currentVideoObjectUrl) {
    URL.revokeObjectURL(currentVideoObjectUrl);
    __set_currentVideoObjectUrl(null);
  }
  __set_currentVideoFile(file);
  __set_currentVideoObjectUrl(URL.createObjectURL(file));
  videoEl.src = currentVideoObjectUrl;
  videoEl.load();
  toastr.info(`\u6B63\u5728\u89E3\u6790\u89C6\u9891: ${file.name}...`);
}

function bindVideoPlaybackEvents() {
  $video.off("loadedmetadata").on("loadedmetadata", async () => {
    __set_videoDuration(videoEl.duration || 0);
    __set_videoWidth(videoEl.videoWidth || 0);
    __set_videoHeight(videoEl.videoHeight || 0);
    let isAutoDetected = false;
    try {
      const detectResult = await detectVideoFps(currentVideoFile, videoEl);
      if (detectResult && detectResult.fps) {
        __set_fps(detectResult.fps);
        isAutoDetected = true;
        console.log(`[VideoFrameExtractor] \u667A\u80FD\u8BC6\u522B\u5230\u89C6\u9891\u5E27\u7387: ${fps} FPS, \u65B9\u5F0F: ${detectResult.method}`);
      }
    } catch (e) {
      console.warn("[VideoFrameExtractor] \u667A\u80FD\u8BC6\u522B\u5E27\u7387\u5F02\u5E38, \u4F7F\u7528\u9ED8\u8BA4\u503C", e);
      __set_fps(parseFloat($fpsSelect.val()) || 30);
    }
    $("#va-fps-detected-opt").remove();
    if (isAutoDetected) {
      $fpsSelect.prepend(`<option value="${fps}" id="va-fps-detected-opt" selected>\u26A1 \u667A\u80FD\u8BC6\u522B: ${fps} FPS</option>`);
      $fpsSelect.val(String(fps));
    } else {
      $fpsSelect.val("30");
      __set_fps(30);
    }
    __set_totalFrames(Math.max(1, Math.floor(videoDuration * fps)));
    $slider.attr({
      min: 0,
      max: totalFrames,
      step: 1
    }).val(0);
    $totalTimeText.text(formatTimeWithMs(videoDuration));
    $curTimeText.text(formatTimeWithMs(0));
    $totalFramesText.text(totalFrames);
    $curFrameText.text(0);
    $jumpFrameInput.attr("max", totalFrames).val("");
    $metaText.text(`${currentVideoFile.name} (${videoWidth}\xD7${videoHeight})`);
    $metaBadge.show();
    $changeVideoBtn.show();
    $monitorRes.html(`<i class="fa-solid fa-expand"></i> ${videoWidth} \xD7 ${videoHeight}`);
    if (isAutoDetected) {
      $monitorFps.html(`<i class="fa-solid fa-wand-magic-sparkles" style="color: #a78bfa;"></i> ${fps} FPS (\u667A\u80FD\u8BC6\u522B)`);
    } else {
      $monitorFps.html(`<i class="fa-solid fa-gauge-high"></i> ${fps} FPS`);
    }
    $monitorInfo.show();
    $uploadEmpty.fadeOut(200);
    resetCapturePane();
    toastr.success(`\u89C6\u9891\u8F7D\u5165\u5B8C\u6210: ${videoWidth}\xD7${videoHeight} \xB7 \u5E27\u7387: ${fps} FPS (\u5171 ${totalFrames} \u5E27)`);
  });
  $video.off("timeupdate").on("timeupdate", () => {
    if (!videoEl) return;
    const curSec = videoEl.currentTime || 0;
    const curFrame = Math.min(totalFrames, Math.round(curSec * fps));
    $curTimeText.text(formatTimeWithMs(curSec));
    $curFrameText.text(curFrame);
    if (!isSliderDragging) {
      $slider.val(curFrame);
    }
  });
  $video.off("ended").on("ended", () => {
    __set_isPlaying(false);
    updatePlayButtonUI();
  });
  $video.off("play pause").on("play pause", () => {
    __set_isPlaying(!videoEl.paused);
    updatePlayButtonUI();
  });
  $btnPlay.off("click").on("click", togglePlayPause);
  $video.off("click").on("click", (e) => {
    e.stopPropagation();
    togglePlayPause();
  });
}

function bindFrameControlEvents() {
  $slider.off("mousedown touchstart").on("mousedown touchstart", () => {
    __set_isSliderDragging(true);
    if (isPlaying) {
      videoEl.pause();
    }
  });
  $slider.off("input").on("input", function() {
    const frame = parseInt($(this).val(), 10) || 0;
    seekToFrame(frame);
  });
  $slider.off("mouseup touchend change").on("mouseup touchend change", () => {
    __set_isSliderDragging(false);
  });
  $btnFirst.off("click").on("click", () => {
    pauseVideo();
    seekToFrame(0);
  });
  $btnLast.off("click").on("click", () => {
    pauseVideo();
    seekToFrame(totalFrames);
  });
  $btnPrev1.off("click").on("click", () => {
    stepFrame(-1);
  });
  $btnNext1.off("click").on("click", () => {
    stepFrame(1);
  });
  $btnPrev10.off("click").on("click", () => {
    stepFrame(-10);
  });
  $btnNext10.off("click").on("click", () => {
    stepFrame(10);
  });
  $fpsSelect.off("change").on("change", function() {
    const newFps = parseFloat($(this).val()) || 30;
    __set_fps(newFps);
    if (videoDuration > 0) {
      __set_totalFrames(Math.max(1, Math.floor(videoDuration * fps)));
      $slider.attr("max", totalFrames);
      $totalFramesText.text(totalFrames);
      $jumpFrameInput.attr("max", totalFrames);
      $monitorFps.html(`<i class="fa-solid fa-gauge-high"></i> ${fps} FPS`);
      const curSec = videoEl.currentTime || 0;
      const curFrame = Math.min(totalFrames, Math.round(curSec * fps));
      $curFrameText.text(curFrame);
      $slider.val(curFrame);
    }
  });
  $jumpFrameInput.off("keydown").on("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const targetFrame = parseInt($(this).val(), 10);
      if (!isNaN(targetFrame)) {
        pauseVideo();
        seekToFrame(targetFrame);
      }
    }
  });
}

function togglePlayPause() {
  if (!videoEl || !videoEl.src) return;
  if (videoEl.paused) {
    videoEl.play();
  } else {
    videoEl.pause();
  }
}

function pauseVideo() {
  if (videoEl && !videoEl.paused) {
    videoEl.pause();
  }
}

function updatePlayButtonUI() {
  if (isPlaying) {
    $btnPlay.html('<i class="fa-solid fa-pause"></i>').attr("title", "\u6682\u505C (\u7A7A\u683C Space)");
  } else {
    $btnPlay.html('<i class="fa-solid fa-play"></i>').attr("title", "\u64AD\u653E (\u7A7A\u683C Space)");
  }
}

function stepFrame(delta) {
  if (!videoEl || videoDuration <= 0) return;
  pauseVideo();
  const curSec = videoEl.currentTime || 0;
  const curFrame = Math.round(curSec * fps);
  const targetFrame = Math.max(0, Math.min(totalFrames, curFrame + delta));
  seekToFrame(targetFrame);
}

function seekToFrame(frame) {
  if (!videoEl || videoDuration <= 0) return;
  const clampedFrame = Math.max(0, Math.min(totalFrames, frame));
  const targetSec = Math.min(videoDuration, clampedFrame / fps);
  videoEl.currentTime = targetSec;
  $curTimeText.text(formatTimeWithMs(targetSec));
  $curFrameText.text(clampedFrame);
  $slider.val(clampedFrame);
}

function bindCaptureEvents() {
  $btnCapture.off("click").on("click", captureCurrentFrame);
}

function captureCurrentFrame() {
  if (!videoEl || !videoEl.src || videoDuration <= 0) {
    toastr.warning("\u8BF7\u5148\u8F7D\u5165\u89C6\u9891\u518D\u8FDB\u884C\u622A\u5E27");
    return;
  }
  pauseVideo();
  $shutterFlash.addClass("flash-active");
  setTimeout(() => {
    $shutterFlash.removeClass("flash-active");
  }, 80);
  const w = videoEl.videoWidth;
  const h = videoEl.videoHeight;
  if (!w || !h) {
    toastr.error("\u65E0\u6CD5\u8BFB\u53D6\u89C6\u9891\u6709\u6548\u753B\u9762\u5C3A\u5BF8");
    return;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(videoEl, 0, 0, w, h);
    __set_currentCapturedDataUrl(canvas.toDataURL("image/png"));
    canvas.toBlob((blob) => {
      __set_currentCapturedBlob(blob);
    }, "image/png");
    $previewImg.attr("src", currentCapturedDataUrl).show();
    $previewEmpty.hide();
    const curSec = videoEl.currentTime || 0;
    const curFrame = Math.round(curSec * fps);
    $specBar.removeClass("muted").html(`
            <span><i class="fa-solid fa-gem" style="color: #10b981;"></i> <b>${w} \xD7 ${h}</b> (\u65E0\u635FPNG)</span>
            <span>\u7B2C ${curFrame} \u5E27 \xB7 ${formatTimeWithMs(curSec)}</span>
        `);
    $inputName.prop("disabled", false);
    $inputCategory.prop("disabled", false);
    $inputDesc.prop("disabled", false);
    $btnSaveAsset.prop("disabled", false);
    $btnDownload.prop("disabled", false);
    $btnCopy.prop("disabled", false);
    $btnToMerger.prop("disabled", false);
    const rawFileName = currentVideoFile?.name || "video";
    const baseName2 = rawFileName.substring(0, rawFileName.lastIndexOf(".")) || rawFileName;
    const safeTimeTag = formatTimeWithMs(curSec).replace(":", "m").replace(".", "s");
    $inputName.val(`[\u622A\u5E27] ${baseName2}_F${curFrame}`);
    $inputDesc.val(`\u622A\u53D6\u81EA\u89C6\u9891\u300A${rawFileName}\u300B\u7B2C ${curFrame} \u5E27 (\u65F6\u95F4\u70B9 ${formatTimeWithMs(curSec)})\uFF0C\u539F\u751F\u6E05\u6670\u5EA6: ${w}\xD7${h}\u3002\u7528\u4E8E\u89C6\u9891\u751F\u6210\u53C2\u8003\u5E27\u3002`);
    toastr.success(`\u5DF2\u7CBE\u51C6\u6355\u6349\u7B2C ${curFrame} \u5E27\u9AD8\u6E05\u753B\u9762 (${w}\xD7${h})`);
  } catch (err) {
    console.error("[VideoFrameExtractor] \u622A\u5E27\u53D1\u751F\u5F02\u5E38:", err);
    toastr.error("\u622A\u5E27\u5931\u8D25\uFF0C\u53EF\u80FD\u662F\u8DE8\u57DF\u6216\u6D4F\u89C8\u5668\u89E3\u7801\u9650\u5236");
  }
}

function resetCapturePane() {
  __set_currentCapturedDataUrl(null);
  __set_currentCapturedBlob(null);
  $previewImg.attr("src", "").hide();
  $previewEmpty.show();
  $specBar.addClass("muted").html(`
        <span><i class="fa-solid fa-circle-info"></i> \u7B49\u5F85\u622A\u5E27</span>
        <span>-</span>
    `);
  $inputName.val("").prop("disabled", true);
  $inputCategory.val("character").prop("disabled", true);
  $inputDesc.val("").prop("disabled", true);
  $btnSaveAsset.prop("disabled", true);
  $btnDownload.prop("disabled", true);
  $btnCopy.prop("disabled", true);
  $btnToMerger.prop("disabled", true);
}

function bindExportEvents2() {
  $btnSaveAsset.off("click").on("click", async () => {
    if (!currentCapturedDataUrl) {
      toastr.warning("\u8BF7\u5148\u6355\u6349\u753B\u9762\u518D\u4FDD\u5B58");
      return;
    }
    const name = $inputName.val().trim() || "\u672A\u547D\u540D\u89C6\u9891\u622A\u5E27";
    const category = $inputCategory.val() || "character";
    const description = $inputDesc.val().trim() || "";
    try {
      $btnSaveAsset.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u5B58\u5165\u89C6\u9891\u8D44\u4EA7\u5E93...');
      const fileId = await saveConfigImage(currentCapturedDataUrl, {
        filename: `${name}.png`
      });
      addVideoAsset({
        name,
        category,
        description,
        fileid: fileId,
        enabled: true
      });
      renderAssetsList();
      toastr.success(`\u89C6\u9891\u8D44\u4EA7\u300C${name}\u300D\u5DF2\u6210\u529F\u4FDD\u5B58\uFF01\u5DF2\u81EA\u52A8\u542F\u7528\u5E76\u5173\u8054\u5230 {{\u89C6\u9891\u8D44\u4EA7}}`);
      $btnSaveAsset.prop("disabled", false).html('<i class="fa-solid fa-check"></i> \u4FDD\u5B58\u6210\u529F (\u53EF\u7EE7\u7EED\u4FDD\u5B58\u5176\u4ED6\u5E27)');
    } catch (err) {
      console.error("[VideoFrameExtractor] \u4FDD\u5B58\u8D44\u4EA7\u5931\u8D25:", err);
      toastr.error(`\u4FDD\u5B58\u8D44\u4EA7\u5931\u8D25: ${err.message || err}`);
      $btnSaveAsset.prop("disabled", false).html('<i class="fa-solid fa-floppy-disk"></i> \u4FDD\u5B58\u4E3A\u89C6\u9891\u8D44\u4EA7');
    }
  });
  $btnDownload.off("click").on("click", () => {
    if (!currentCapturedDataUrl) return;
    const name = ($inputName.val().trim() || "video_frame").replace(/[\\/:*?"<>|]/g, "_");
    const link = document.createElement("a");
    link.href = currentCapturedDataUrl;
    link.download = `${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastr.success("\u5DF2\u5F00\u59CB\u4E0B\u8F7D\u65E0\u635F PNG \u56FE\u7247");
  });
  $btnCopy.off("click").on("click", async () => {
    if (!currentCapturedBlob && currentCapturedDataUrl) {
      const res = await fetch(currentCapturedDataUrl);
      __set_currentCapturedBlob(await res.blob());
    }
    if (currentCapturedBlob && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": currentCapturedBlob })
        ]);
        toastr.success("\u9AD8\u6E05\u622A\u56FE\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u53EF\u76F4\u63A5\u5728\u5916\u90E8\u8F6F\u4EF6\u7C98\u8D34");
      } catch (err) {
        console.warn("[VideoFrameExtractor] Clipboard write \u5931\u8D25, \u5C1D\u8BD5\u540E\u5907\u65B9\u6848:", err);
        toastr.warning("\u526A\u8D34\u677F\u76F4\u63A5\u5199\u5165\u53D7\u9650\uFF0C\u8BF7\u4F7F\u7528\u300C\u4E0B\u8F7D\u56FE\u7247\u300D\u6216\u300C\u4FDD\u5B58\u8D44\u4EA7\u300D");
      }
    } else {
      toastr.warning("\u5F53\u524D\u6D4F\u89C8\u5668\u73AF\u5883\u4E0D\u652F\u6301\u56FE\u7247\u526A\u8D34\u677F\u5199\u5165");
    }
  });
  $btnToMerger.off("click").on("click", () => {
    if (!currentCapturedDataUrl) return;
    const name = $inputName.val().trim() || "\u622A\u5E27\u7D20\u6750";
    openMergerForCreate();
    addImageLayer(currentCapturedDataUrl, name, "", { autoFitCanvas: true });
    closeVideoFrameExtractor();
    toastr.success(`\u5DF2\u5C06\u622A\u5E27\u753B\u9762\u5E26\u5165\u56FE\u7247\u5408\u6210\u753B\u677F\uFF0C\u753B\u5E03\u5DF2\u81EA\u52A8\u5339\u914D\u539F\u89C6\u9891\u6E05\u6670\u5EA6`);
  });
}

function bindKeyboardShortcuts() {
  $(window).off("keydown.va_extractor").on("keydown.va_extractor", (e) => {
    if (!$modal || !$modal.is(":visible")) return;
    if ($(e.target).is("input, textarea, select")) {
      if (e.code === "Escape") {
        closeVideoFrameExtractor();
      }
      return;
    }
    switch (e.code) {
      case "Space":
        e.preventDefault();
        togglePlayPause();
        break;
      case "ArrowLeft":
        e.preventDefault();
        stepFrame(e.shiftKey ? -10 : -1);
        break;
      case "ArrowRight":
        e.preventDefault();
        stepFrame(e.shiftKey ? 10 : 1);
        break;
      case "Home":
        e.preventDefault();
        seekToFrame(0);
        break;
      case "End":
        e.preventDefault();
        seekToFrame(totalFrames);
        break;
      case "KeyC":
      case "Enter":
        e.preventDefault();
        captureCurrentFrame();
        break;
      case "Escape":
        e.preventDefault();
        closeVideoFrameExtractor();
        break;
    }
  });
}

function formatTimeWithMs(totalSec) {
  if (isNaN(totalSec) || totalSec < 0) totalSec = 0;
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  const ms = Math.floor(totalSec % 1 * 1e3);
  const mStr = String(mins).padStart(2, "0");
  const sStr = String(secs).padStart(2, "0");
  const msStr = String(ms).padStart(3, "0");
  return `${mStr}:${sStr}.${msStr}`;
}

export function __set_onSaveNewAssetCallback(v) { onSaveNewAssetCallback = v; }

export function __set_onAssetOverwrittenCallback(v) { onAssetOverwrittenCallback = v; }

export function __set_layers(v) { layers = v; }

export function __set_activeLayerId(v) { activeLayerId = v; }

export function __set_mergerResizeHandler(v) { mergerResizeHandler = v; }

export function __set_mergerMode(v) { mergerMode = v; }

export function __set_currentEditingAsset(v) { currentEditingAsset = v; }

export function __set_$mergerModal(v) { $mergerModal = v; }

export function __set_$board(v) { $board = v; }

export function __set_$stageWrap(v) { $stageWrap = v; }

export function __set_$viewport(v) { $viewport = v; }

export function __set_$transformerBox(v) { $transformerBox = v; }

export function __set_$rotHandle(v) { $rotHandle = v; }

export function __set_$canvasW(v) { $canvasW = v; }

export function __set_$canvasH(v) { $canvasH = v; }

export function __set_$presetSize(v) { $presetSize = v; }

export function __set_$bgSelect(v) { $bgSelect = v; }

export function __set_$bgColor(v) { $bgColor = v; }

export function __set_$layersList(v) { $layersList = v; }

export function __set_$layerCount(v) { $layerCount = v; }

export function __set_$propSection(v) { $propSection = v; }

export function __set_$activeTitle(v) { $activeTitle = v; }

export function __set_$scaleSlider(v) { $scaleSlider = v; }

export function __set_$scaleVal(v) { $scaleVal = v; }

export function __set_$rotSlider(v) { $rotSlider = v; }

export function __set_$rotVal(v) { $rotVal = v; }

export function __set_$opacitySlider(v) { $opacitySlider = v; }

export function __set_$opacityVal(v) { $opacityVal = v; }

export function __set_$pickerModal2(v) { $pickerModal2 = v; }

export function __set_$pickerGrid(v) { $pickerGrid = v; }

export function __set_isInitialized2(v) { isInitialized2 = v; }

export function __set_canvasWidth(v) { canvasWidth = v; }

export function __set_canvasHeight(v) { canvasHeight = v; }

export function __set_canvasBg(v) { canvasBg = v; }

export function __set_isPanning(v) { isPanning = v; }

export function __set_panStartPointer(v) { panStartPointer = v; }

export function __set_panStartOffset(v) { panStartOffset = v; }

export function __set_isSpacePressed(v) { isSpacePressed = v; }

export function __set_activeTool(v) { activeTool = v; }

export function __set_viewportScale(v) { viewportScale = v; }

export function __set_currentDragMode(v) { currentDragMode = v; }

export function __set_dragStartPointer(v) { dragStartPointer = v; }

export function __set_dragStartLayer(v) { dragStartLayer = v; }

export function __set_scaleHandleDir(v) { scaleHandleDir = v; }

export function __set_multiTouchState(v) { multiTouchState = v; }

export function __set_currentPickerCategory(v) { currentPickerCategory = v; }

export { $activeTitle, $bgColor, $bgSelect, $board, $canvasH, $canvasW, $layerCount, $layersList, $mergerModal, $opacitySlider, $opacityVal, $pickerGrid, $pickerModal2, $presetSize, $propSection, $rotHandle, $rotSlider, $rotVal, $scaleSlider, $scaleVal, $stageWrap, $transformerBox, $viewport, activeLayerId, activeTool, canvasBg, canvasHeight, canvasWidth, currentDragMode, currentEditingAsset, currentPickerCategory, dragStartLayer, dragStartPointer, initVideoFrameExtractor, isInitialized2, isPanning, isSpacePressed, layers, mergerMode, mergerResizeHandler, multiTouchState, onAssetOverwrittenCallback, onSaveNewAssetCallback, openVideoFrameExtractor, panStartOffset, panStartPointer, scaleHandleDir, viewportPan, viewportScale };
