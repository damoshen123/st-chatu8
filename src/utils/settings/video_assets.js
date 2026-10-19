// 还原自打包产物 — 原始模块: utils/settings/video_assets.js
import { getConfigFile, getConfigImage, saveConfigAudio, saveConfigImage } from "../configDatabase.js";
import { VIDEO_ASSET_CATEGORIES, addVideoAsset, checkVideoAssetsConflicts, deleteVideoAsset, exportVideoAssetsJSON, getCategoryLabel, getVideoAssetStats, getVideoAssets, importVideoAssetsPackage, prepareVideoAssetsExportPackage, updateVideoAsset } from "../videoAssetsService.js";
import { $displayFileid, $editModal, $emptyHint, $fileInput2, $grid, $imagePreview, $inputCategory2, $inputDesc2, $inputEnabled, $inputFileid, $inputId, $inputName2, $modalTitle, $previewWrapper, $privacyToggleBtn, $uploadPlaceholder, __set_$displayFileid, __set_$editModal, __set_$emptyHint, __set_$fileInput2, __set_$grid, __set_$imagePreview, __set_$inputCategory2, __set_$inputDesc2, __set_$inputEnabled, __set_$inputFileid, __set_$inputId, __set_$inputName2, __set_$modalTitle, __set_$previewWrapper, __set_$privacyToggleBtn, __set_$uploadPlaceholder, __set_currentCategoryFilter2, __set_currentSearchQuery2, __set_isInitialized4, __set_isPrivacyMode, __set_pendingImportPackage, currentCategoryFilter2, currentSearchQuery2, isInitialized4, isPrivacyMode, pendingImportPackage } from "./videoAssetGenUi.js";
import { openMergerForAsset, openMergerForCreate, setAssetOverwrittenCallback, setSaveNewAssetCallback } from "./video_assets_merger.js";
import { initVideoFrameExtractor, openVideoFrameExtractor } from "./video_frame_extractor.js";
import "../ui_common.js"; // init_ui_common

var $btnCapture, $btnCopy, $btnDownload, $btnFirst, $btnLast, $btnNext1, $btnNext10, $btnPlay, $btnPrev1, $btnPrev10, $btnSaveAsset, $btnToMerger, $changeVideoBtn, $closeBtn, $curFrameText, $curTimeText, $dropzone, $fileInput, $fpsSelect, $inputCategory, $inputDesc, $inputName, $jumpFrameInput, $metaBadge, $metaText, $modal, $monitorFps, $monitorInfo, $monitorRes, $previewCard, $previewEmpty, $previewImg, $shutterFlash, $slider, $specBar, $totalFramesText, $totalTimeText, $uploadEmpty, $video, currentCapturedBlob, currentCapturedDataUrl, currentVideoFile, currentVideoObjectUrl, extractorResizeHandler, fps, isInitialized3, isPlaying, isSliderDragging, sessionUploadedMedia2, totalFrames, videoDuration, videoEl, videoHeight, videoWidth;

var sessionUploadedMedia2 = {
  img: {},
  aud: {},
  imgFiles: {},
  audFiles: {}
};
var isInitialized3 = false;

var currentVideoFile = null;

var currentVideoObjectUrl = null;

var videoDuration = 0;

var videoWidth = 0;

var videoHeight = 0;

var fps = 30;

var totalFrames = 0;

var isPlaying = false;

var currentCapturedDataUrl = null;

var currentCapturedBlob = null;

var extractorResizeHandler = null;

var isSliderDragging = false;

function initVideoAssets() {
  const $container4 = $("#ch-tab-video_assets");
  if ($container4.length === 0) return;
  __set_$grid($("#va-asset-grid"));
  __set_$emptyHint($("#va-empty-hint"));
  __set_$editModal($("#va-edit-modal"));
  __set_$fileInput2($("#va-file-input"));
  __set_$imagePreview($("#va-image-preview"));
  __set_$previewWrapper($("#va-preview-wrapper"));
  __set_$uploadPlaceholder($("#va-upload-placeholder"));
  __set_$inputCategory2($("#va-input-category"));
  __set_$inputName2($("#va-input-name"));
  __set_$displayFileid($("#va-display-fileid"));
  __set_$inputFileid($("#va-input-fileid"));
  __set_$inputDesc2($("#va-input-desc"));
  __set_$inputEnabled($("#va-input-enabled"));
  __set_$inputId($("#va-input-id"));
  __set_$modalTitle($("#va-modal-title"));
  __set_$privacyToggleBtn($("#va-btn-privacy-toggle"));
  $(document).off("click", "#ch-tab-video_assets .va-sub-nav-pill").on("click", "#ch-tab-video_assets .va-sub-nav-pill", function(e) {
    e.preventDefault();
    $("#ch-tab-video_assets .va-sub-nav-pill").removeClass("active");
    $(this).addClass("active");
    __set_currentCategoryFilter2($(this).attr("data-asset-cat") || "all");
    renderAssetsList();
  });
  const $searchInput = $("#va-search-input");
  const $searchClear = $("#va-search-clear");
  $searchInput.off("input").on("input", function() {
    __set_currentSearchQuery2($(this).val().trim().toLowerCase());
    $searchClear.toggle(currentSearchQuery2.length > 0);
    renderAssetsList();
  });
  $searchClear.off("click").on("click", function() {
    $searchInput.val("");
    __set_currentSearchQuery2("");
    $(this).hide();
    renderAssetsList();
  });
  updatePrivacyModeUI();
  $privacyToggleBtn.off("click").on("click", function() {
    __set_isPrivacyMode(!isPrivacyMode);
    localStorage.setItem("st_chatu8_video_assets_privacy_mode", isPrivacyMode ? "true" : "false");
    updatePrivacyModeUI();
    toastr.info(isPrivacyMode ? "\u5DF2\u5F00\u542F\u78E8\u7802\u9690\u79C1\u4FDD\u62A4\uFF08\u60AC\u505C\u53EF\u67E5\u770B\u539F\u56FE\uFF09" : "\u5DF2\u5173\u95ED\u9690\u79C1\u4FDD\u62A4\uFF08\u76F4\u663E\u9AD8\u6E05\u539F\u56FE\uFF09");
  });
  $("#va-btn-merge").off("click").on("click", () => {
    openMergerForCreate();
  });
  $("#va-btn-extract-frame").off("click").on("click", () => {
    openVideoFrameExtractor();
  });
  initVideoFrameExtractor();
  setSaveNewAssetCallback((dataUrl, fileId, defaultName) => {
    openEditModalWithMergedAsset(dataUrl, fileId, defaultName);
  });
  setAssetOverwrittenCallback(() => {
    renderAssetsList();
  });
  $("#va-btn-new, #va-btn-empty-add").off("click").on("click", () => {
    openEditModal(null);
  });
  $("#va-btn-export").off("click").on("click", handleExport);
  $("#va-btn-import").off("click").on("click", () => {
    $("#va-import-file-input").click();
  });
  $("#va-import-file-input").off("change").on("change", handleImport);
  $("#va-import-modal-close, #va-import-modal-cancel").off("click").on("click", () => {
    $("#va-import-modal").fadeOut(150);
    __set_pendingImportPackage(null);
  });
  $(document).off("change", 'input[name="va-import-strategy"]').on("change", 'input[name="va-import-strategy"]', function() {
    $(".va-import-radio-card").removeClass("active");
    $(this).closest(".va-import-radio-card").addClass("active");
  });
  $("#va-import-modal-confirm").off("click").on("click", handleExecuteImport);
  $("#va-modal-close, #va-modal-cancel").off("click").on("click", () => {
    $editModal.fadeOut(150);
  });
  $("#va-modal-save").off("click").on("click", handleSaveAsset);
  $("#va-btn-copy-fileid").off("click").on("click", function() {
    const fid = $displayFileid.val();
    if (!fid) {
      toastr.warning("\u5F53\u524D\u6682\u65E0 FileID");
      return;
    }
    navigator.clipboard.writeText(fid).then(() => {
      toastr.success("FileID \u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
    }).catch(() => {
      toastr.info(`FileID: ${fid}`);
    });
  });
  const $dropzone2 = $("#va-upload-dropzone");
  $dropzone2.off("click").on("click", () => {
    $fileInput2.click();
  });
  $("#va-btn-change-image").off("click").on("click", (e) => {
    e.stopPropagation();
    $fileInput2.click();
  });
  $fileInput2.off("change").on("change", handleImageFileSelected);
  $dropzone2.off("dragover dragleave drop");
  $dropzone2.on("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $dropzone2.css("border-color", "var(--st-chatu8-accent-color, #8b5cf6)");
  });
  $dropzone2.on("dragleave drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $dropzone2.css("border-color", "var(--SmartThemeBorderColor, #555)");
  });
  $dropzone2.on("drop", (e) => {
    const files = e.originalEvent.dataTransfer?.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  });
  renderAssetsList();
  __set_isInitialized4(true);
}

function updatePrivacyModeUI() {
  const $tabContainer = $("#ch-tab-video_assets");
  if (!$privacyToggleBtn || $privacyToggleBtn.length === 0) return;
  if (isPrivacyMode) {
    $privacyToggleBtn.addClass("active").html('<i class="fa-solid fa-eye-slash"></i> <span>\u9690\u79C1\u6A21\u5F0F: \u5DF2\u5F00\u542F</span>');
    $tabContainer.removeClass("va-privacy-off");
  } else {
    $privacyToggleBtn.removeClass("active").html('<i class="fa-solid fa-eye"></i> <span>\u9690\u79C1\u6A21\u5F0F: \u5DF2\u5173\u95ED</span>');
    $tabContainer.addClass("va-privacy-off");
  }
}

function updateCategoryBadges() {
  const stats = getVideoAssetStats();
  $("#va-badge-all").text(stats.all || 0);
  $("#va-badge-character").text(stats.character || 0);
  $("#va-badge-body_part").text(stats.body_part || 0);
  $("#va-badge-scene").text(stats.scene || 0);
  $("#va-badge-prop").text(stats.prop || 0);
  $("#va-badge-pose").text(stats.pose || 0);
  $("#va-badge-audio").text(stats.audio || 0);
}

async function renderAssetsList() {
  if (!$grid || $grid.length === 0) return;
  updateCategoryBadges();
  $("#ch-tab-video_assets .va-sub-nav-pill").removeClass("active");
  $(`#ch-tab-video_assets .va-sub-nav-pill[data-asset-cat="${currentCategoryFilter2}"]`).addClass("active");
  const allAssets = getVideoAssets();
  let filtered = allAssets;
  if (currentCategoryFilter2 !== "all") {
    filtered = filtered.filter((a) => a.category === currentCategoryFilter2);
  }
  if (currentSearchQuery2) {
    filtered = filtered.filter((a) => {
      const name = (a.name || "").toLowerCase();
      const fid = (a.fileid || "").toLowerCase();
      const desc = (a.description || "").toLowerCase();
      return name.includes(currentSearchQuery2) || fid.includes(currentSearchQuery2) || desc.includes(currentSearchQuery2);
    });
  }
  $grid.empty();
  if (filtered.length === 0) {
    const catName = getCategoryLabel(currentCategoryFilter2);
    if (currentCategoryFilter2 !== "all") {
      $("#va-empty-title").text(`\u5F53\u524D\u3010${catName}\u3011\u5206\u7C7B\u4E0B\u6682\u65E0\u89C6\u9891\u7D20\u6750`);
      $("#va-empty-subtitle").text(`\u60A8\u53EF\u4EE5\u70B9\u51FB\u4E0B\u65B9\u65B0\u589E\u7D20\u6750\uFF0C\u6216\u5728\u5361\u7247\u5DE6\u4E0A\u89D2\u5C06\u5DF2\u6709\u7D20\u6750\u7684\u5206\u7C7B\u5207\u6362\u4E3A\u3010${catName}\u3011\u3002`);
    } else {
      $("#va-empty-title").text("\u5F53\u524D\u6682\u65E0\u4EFB\u4F55\u89C6\u9891\u7D20\u6750");
      $("#va-empty-subtitle").text("\u70B9\u51FB\u4E0B\u65B9\u300C\u7ACB\u5373\u65B0\u589E\u7D20\u6750\u300D\u6216\u300C\u5408\u5E76\u8D44\u4EA7\u300D\u5F00\u59CB\u6DFB\u52A0\u60A8\u7684\u7B2C\u4E00\u4EFD\u7D20\u6750\u5427\uFF01");
    }
    $emptyHint.show();
    return;
  }
  $emptyHint.hide();
  for (const asset of filtered) {
    const catKey = asset.category || "character";
    const catOptions = VIDEO_ASSET_CATEGORIES.map((c) => `
            <option value="${c.key}" ${catKey === c.key ? "selected" : ""}>${c.label}</option>
        `).join("");
    const isAudio = catKey === "audio";
    const mediaHtml = isAudio ? `
            <div class="va-card-media" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(99, 102, 241, 0.2)); display: flex; align-items: center; justify-content: center; position: relative; min-height: 120px;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px;">
                    <i class="fa-solid fa-music" style="font-size: 30px; color: #ec4899; opacity: 0.9;"></i>
                    <audio controls class="va-card-audio" style="max-width: 95%; height: 32px; border-radius: 16px; outline: none;"></audio>
                </div>
                <div class="va-media-badge-group">
                    <select class="va-card-cat-select" data-id="${asset.id}" title="\u70B9\u51FB\u76F4\u63A5\u4FEE\u6539\u6B64\u7D20\u6750\u5206\u7C7B">
                        ${catOptions}
                    </select>
                </div>
                <div class="va-media-ctrl-group">
                    <label class="va-mini-switch" title="${asset.enabled ? "\u5DF2\u542F\u7528 (\u81EA\u52A8\u6CE8\u5165\u63D0\u793A\u8BCD)" : "\u5DF2\u505C\u7528"}">
                        <input type="checkbox" class="va-toggle-enable" ${asset.enabled ? "checked" : ""}>
                        <span class="va-mini-slider"></span>
                    </label>
                </div>
            </div>
        ` : `
            <div class="va-card-media va-privacy-blur">
                <img class="va-card-img" alt="${escapeHtml9(asset.name)}">
                <div class="va-privacy-overlay">
                    <i class="fa-solid fa-eye-slash" style="font-size: 20px;"></i>
                    <span>\u60AC\u505C\u67E5\u770B</span>
                </div>
                <div class="va-card-img-placeholder" style="font-size: 28px; opacity: 0.35;">
                    <i class="fa-solid fa-image"></i>
                </div>
                <div class="va-media-badge-group">
                    <select class="va-card-cat-select" data-id="${asset.id}" title="\u70B9\u51FB\u76F4\u63A5\u4FEE\u6539\u6B64\u7D20\u6750\u5206\u7C7B">
                        ${catOptions}
                    </select>
                </div>
                <div class="va-media-ctrl-group">
                    <button type="button" class="va-btn-peek" title="\u89E3\u9664/\u9501\u5B9A\u5F53\u524D\u5361\u7247\u78E8\u7802">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <label class="va-mini-switch" title="${asset.enabled ? "\u5DF2\u542F\u7528 (\u81EA\u52A8\u6CE8\u5165\u63D0\u793A\u8BCD)" : "\u5DF2\u505C\u7528"}">
                        <input type="checkbox" class="va-toggle-enable" ${asset.enabled ? "checked" : ""}>
                        <span class="va-mini-slider"></span>
                    </label>
                </div>
            </div>
        `;
    const $card = $(`
            <div class="va-modern-card" data-id="${asset.id}" data-category="${catKey}">
                ${mediaHtml}
                <div class="va-card-body">
                    <div class="va-card-title-row">
                        <div class="va-card-title" title="${escapeHtml9(asset.name)}">
                            ${escapeHtml9(asset.name || "\u672A\u547D\u540D\u7D20\u6750")}
                        </div>
                    </div>
                    <div>
                        <div class="va-fileid-pill va-btn-copy-id" data-fileid="${escapeHtml9(asset.fileid || "")}" title="\u70B9\u51FB\u590D\u5236\u5B8C\u6574 FileID">
                            <i class="fa-regular fa-copy va-copy-icon"></i>
                            <span class="va-fileid-text">ID: ${escapeHtml9(asset.fileid || "\u672A\u7ED1\u5B9A")}</span>
                        </div>
                    </div>
                    <div class="va-card-desc ${asset.description ? "" : "empty"}" title="${escapeHtml9(asset.description || "")}">
                        ${escapeHtml9(asset.description || "\u6682\u65E0\u8BE6\u7EC6\u63CF\u8FF0...")}
                    </div>
                    <div class="va-card-footer">
                        ${isAudio ? `
                            <span style="font-size: 11px; color: #ec4899; display: flex; align-items: center; gap: 4px;">
                                <i class="fa-solid fa-headphones"></i> \u97F3\u9891\u7D20\u6750
                            </span>
                        ` : `
                            <button type="button" class="va-card-btn merger-btn va-btn-send-merger" data-id="${asset.id}" title="\u5C06\u6B64\u7D20\u6750\u5BFC\u5165\u5230\u753B\u5E03\u7F16\u6392\u5DE5\u4F5C\u5BA4">
                                <i class="fa-solid fa-object-group"></i> \u753B\u5E03
                            </button>
                        `}
                        <div style="display: flex; gap: 6px;">
                            <button type="button" class="va-card-btn va-btn-edit" data-id="${asset.id}">
                                <i class="fa-solid fa-pen-to-square"></i> \u7F16\u8F91
                            </button>
                            <button type="button" class="va-card-btn danger va-btn-delete" data-id="${asset.id}" title="\u5220\u9664\u7D20\u6750">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    $grid.append($card);
    if (asset.fileid) {
      if (isAudio) {
        getConfigFile(asset.fileid, { kind: "audio" }).then((fileEntry) => {
          if (fileEntry && fileEntry.data) {
            const blob = fileEntry.data instanceof Blob ? fileEntry.data : new Blob([fileEntry.data], { type: fileEntry.mimeType || "audio/mpeg" });
            $card.find(".va-card-audio").attr("src", URL.createObjectURL(blob));
          }
        }).catch((e) => {
          console.warn(`[VideoAssets] \u5361\u7247 [${asset.name}] \u8BFB\u53D6\u97F3\u9891\u5F02\u5E38: ${asset.fileid}`, e);
        });
      } else {
        getConfigImage(asset.fileid).then((dataUrl) => {
          if (dataUrl) {
            $card.find(".va-card-img").attr("src", dataUrl).show();
            $card.find(".va-card-img-placeholder").hide();
            $card.data("img-src", dataUrl);
          }
        }).catch((e) => {
          console.warn(`[VideoAssets] \u5361\u7247 [${asset.name}] \u8BFB\u53D6\u56FE\u7247\u5F02\u5E38: ${asset.fileid}`, e);
        });
      }
    }
  }
  $grid.find(".va-card-cat-select").off("change").on("change", function(e) {
    e.stopPropagation();
    const id = $(this).data("id");
    const newCat = $(this).val();
    updateVideoAsset(id, { category: newCat });
    toastr.success(`\u5DF2\u5C06\u7D20\u6750\u5206\u7C7B\u4FEE\u6539\u4E3A\u300C${getCategoryLabel(newCat)}\u300D`);
    renderAssetsList();
  });
  $grid.find(".va-toggle-enable").off("change").on("change", function() {
    const id = $(this).closest(".va-modern-card").data("id");
    const enabled = $(this).prop("checked");
    updateVideoAsset(id, { enabled });
    updateCategoryBadges();
  });
  $grid.find(".va-btn-peek").off("click").on("click", function(e) {
    e.stopPropagation();
    const $media = $(this).closest(".va-card-media");
    $media.toggleClass("va-revealed");
    const isRevealed = $media.hasClass("va-revealed");
    $(this).html(isRevealed ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>');
  });
  $grid.find(".va-btn-copy-id").off("click").on("click", function(e) {
    e.stopPropagation();
    const fid = $(this).data("fileid");
    if (!fid) {
      toastr.warning("\u8BE5\u7D20\u6750\u6682\u65E0 FileID");
      return;
    }
    const $icon = $(this).find(".va-copy-icon");
    navigator.clipboard.writeText(fid).then(() => {
      toastr.success("FileID \u5DF2\u590D\u5236");
      $icon.removeClass("fa-regular fa-copy").addClass("fa-solid fa-check text-green");
      setTimeout(() => {
        $icon.removeClass("fa-solid fa-check text-green").addClass("fa-regular fa-copy");
      }, 1500);
    });
  });
  $grid.find(".va-btn-send-merger").off("click").on("click", function() {
    const id = $(this).data("id");
    const asset = allAssets.find((a) => a.id === id);
    if (!asset) return;
    if (asset.fileid) {
      getConfigImage(asset.fileid).then((dataUrl) => {
        if (dataUrl) {
          openMergerForAsset(asset, dataUrl);
          toastr.info(`\u5DF2\u8F7D\u5165\u7D20\u6750\u300C${asset.name}\u300D\uFF0C\u53EF\u8FDB\u884C\u8C03\u6574\u5E76\u8986\u76D6\u4FDD\u5B58\u539F\u8D44\u4EA7`);
        } else {
          toastr.error("\u65E0\u6CD5\u8BFB\u53D6\u8BE5\u7D20\u6750\u7684\u56FE\u7247\u6570\u636E");
        }
      });
    } else {
      toastr.warning("\u8BE5\u7D20\u6750\u5C1A\u672A\u5173\u8054\u56FE\u7247\u6570\u636E");
    }
  });
  $grid.find(".va-btn-edit").off("click").on("click", function() {
    const id = $(this).data("id");
    const asset = allAssets.find((a) => a.id === id);
    if (asset) {
      openEditModal(asset);
    }
  });
  $grid.find(".va-btn-delete").off("click").on("click", async function() {
    const id = $(this).data("id");
    const asset = allAssets.find((a) => a.id === id);
    if (!asset) return;
    if (confirm(`\u786E\u5B9A\u8981\u5220\u9664\u89C6\u9891\u7D20\u6750\u300C${asset.name}\u300D\u5417\uFF1F`)) {
      await deleteVideoAsset(id);
      toastr.success("\u7D20\u6750\u5DF2\u5220\u9664");
      renderAssetsList();
    }
  });
}

async function openEditModal(asset) {
  $fileInput2.val("");
  const $previewLoading = $("#va-preview-loading");
  const $audioWrap = $("#va-audio-preview-wrap");
  const $audioPreview = $("#va-audio-preview");
  $audioWrap.hide();
  if ($audioPreview.length) {
    $audioPreview.attr("src", "");
  }
  if (asset) {
    $modalTitle.html('<i class="fa-solid fa-pen-to-square"></i> \u7F16\u8F91\u89C6\u9891\u7D20\u6750');
    $inputId.val(asset.id);
    $inputFileid.val(asset.fileid || "");
    $displayFileid.val(asset.fileid || "");
    $inputCategory2.val(asset.category || "character");
    $inputName2.val(asset.name || "");
    $inputDesc2.val(asset.description || "");
    $inputEnabled.prop("checked", asset.enabled !== false);
    const isAudio = asset.category === "audio";
    if (asset.fileid) {
      $uploadPlaceholder.hide();
      $previewWrapper.show();
      $imagePreview.hide().attr("src", "");
      $previewLoading.show();
      try {
        if (isAudio) {
          const fileEntry = await getConfigFile(asset.fileid, { kind: "audio" });
          $previewLoading.hide();
          if (fileEntry && fileEntry.data) {
            const blob = fileEntry.data instanceof Blob ? fileEntry.data : new Blob([fileEntry.data], { type: fileEntry.mimeType || "audio/mpeg" });
            $audioPreview.attr("src", URL.createObjectURL(blob));
            $audioWrap.show();
          } else {
            $previewWrapper.hide();
            $uploadPlaceholder.show();
          }
        } else {
          const dataUrl = await getConfigImage(asset.fileid);
          $previewLoading.hide();
          if (dataUrl) {
            $imagePreview.attr("src", dataUrl).show();
          } else {
            $previewWrapper.hide();
            $uploadPlaceholder.show();
          }
        }
      } catch (err) {
        console.error(`[VideoAssets] \u8BFB\u53D6\u5A92\u4F53\u53D1\u751F\u5F02\u5E38: ${asset.fileid}`, err);
        $previewLoading.hide();
        $previewWrapper.hide();
        $uploadPlaceholder.show();
      }
    } else {
      $previewLoading.hide();
      $previewWrapper.hide();
      $imagePreview.hide().attr("src", "");
      $uploadPlaceholder.show();
    }
  } else {
    $modalTitle.html('<i class="fa-solid fa-plus"></i> \u65B0\u589E\u89C6\u9891\u7D20\u6750');
    $inputId.val("");
    $inputFileid.val("");
    $displayFileid.val("");
    $inputCategory2.val(currentCategoryFilter2 !== "all" ? currentCategoryFilter2 : "character");
    $inputName2.val("");
    $inputDesc2.val("");
    $inputEnabled.prop("checked", true);
    $previewLoading.hide();
    $previewWrapper.hide();
    $imagePreview.hide().attr("src", "");
    $uploadPlaceholder.show();
  }
  $editModal.fadeIn(150);
}

function openEditModalWithMergedAsset(dataUrl, fileId, defaultName) {
  $fileInput2.val("");
  $("#va-preview-loading").hide();
  $("#va-audio-preview-wrap").hide();
  $modalTitle.html('<i class="fa-solid fa-image"></i> \u4FDD\u5B58\u56FE\u7247\u7D20\u6750');
  $inputId.val("");
  $inputFileid.val(fileId || "");
  $displayFileid.val(fileId || "");
  $inputCategory2.val(currentCategoryFilter2 !== "all" ? currentCategoryFilter2 : "character");
  $inputName2.val(defaultName || `\u56FE\u7247\u7D20\u6750_${Date.now().toString().slice(-4)}`);
  $inputDesc2.val("");
  $inputEnabled.prop("checked", true);
  $uploadPlaceholder.hide();
  $previewWrapper.show();
  $imagePreview.attr("src", dataUrl).show();
  $editModal.fadeIn(150);
  toastr.success("\u72EC\u7ACB\u56FE\u7247\u5DF2\u751F\u6210\uFF0C\u8BF7\u6838\u5BF9\u4FE1\u606F\u5E76\u4FDD\u5B58");
}

function handleImageFileSelected(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    processMediaFile(files[0]);
  }
}

async function processMediaFile(file) {
  const isAudio = file.type.startsWith("audio/") || $inputCategory2.val() === "audio";
  const isImage = file.type.startsWith("image/");
  if (!isAudio && !isImage) {
    toastr.error("\u8BF7\u4E0A\u4F20\u56FE\u7247 (PNG, JPG, WebP) \u6216\u97F3\u9891 (MP3, WAV, M4A, OGG) \u6587\u4EF6");
    return;
  }
  console.log(`[VideoAssets] \u5F00\u59CB\u5904\u7406\u4E0A\u4F20\u5A92\u4F53\u6587\u4EF6: ${file.name}, \u5927\u5C0F: ${file.size} \u5B57\u8282, \u7C7B\u578B: ${file.type}`);
  const $audioWrap = $("#va-audio-preview-wrap");
  const $audioPreview = $("#va-audio-preview");
  if (isAudio) {
    try {
      toastr.info("\u6B63\u5728\u4FDD\u5B58\u97F3\u9891\u6570\u636E...");
      const fileId = await saveConfigAudio(file, {
        filename: file.name,
        mimeType: file.type || "audio/mpeg"
      });
      $inputCategory2.val("audio");
      $inputFileid.val(fileId);
      $displayFileid.val(fileId);
      $("#va-preview-loading").hide();
      $imagePreview.hide().attr("src", "");
      if ($audioPreview.length) {
        $audioPreview.attr("src", URL.createObjectURL(file));
      }
      $audioWrap.show();
      $uploadPlaceholder.hide();
      $previewWrapper.show();
      if (!$inputName2.val().trim()) {
        const baseName2 = file.name.replace(/\.[^/.]+$/, "");
        $inputName2.val(baseName2);
      }
      toastr.success(`\u97F3\u9891\u5DF2\u4E0A\u4F20\uFF0C\u751F\u6210 FileID: ${fileId}`);
    } catch (err) {
      console.error("[VideoAssets] \u4E0A\u4F20\u97F3\u9891\u5931\u8D25:", err);
      toastr.error(`\u97F3\u9891\u5B58\u50A8\u5931\u8D25: ${err.message}`);
    }
  } else {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      try {
        toastr.info("\u6B63\u5728\u4FDD\u5B58\u56FE\u7247\u6570\u636E...");
        const fileId = await saveConfigImage(base64Data, {
          filename: file.name
        });
        $inputFileid.val(fileId);
        $displayFileid.val(fileId);
        $("#va-preview-loading").hide();
        $audioWrap.hide();
        $imagePreview.attr("src", base64Data).show();
        $uploadPlaceholder.hide();
        $previewWrapper.show();
        if (!$inputName2.val().trim()) {
          const baseName2 = file.name.replace(/\.[^/.]+$/, "");
          $inputName2.val(baseName2);
        }
        toastr.success(`\u56FE\u7247\u5DF2\u4E0A\u4F20\uFF0C\u751F\u6210 FileID: ${fileId}`);
      } catch (err) {
        console.error("[VideoAssets] \u4E0A\u4F20\u56FE\u7247\u5931\u8D25:", err);
        toastr.error(`\u56FE\u7247\u5B58\u50A8\u5931\u8D25: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  }
}

function handleSaveAsset() {
  const id = $inputId.val();
  const fileid = $inputFileid.val().trim();
  const category = $inputCategory2.val();
  const name = $inputName2.val().trim() || "\u672A\u547D\u540D\u7D20\u6750";
  const description = $inputDesc2.val().trim();
  const enabled = $inputEnabled.prop("checked");
  if (!description && !fileid) {
    toastr.warning("\u8BF7\u81F3\u5C11\u4E0A\u4F20\u56FE\u7247\u6216\u586B\u5199\u7B80\u4ECB\u8BF4\u660E");
    return;
  }
  if (id) {
    updateVideoAsset(id, {
      fileid,
      category,
      name,
      description,
      enabled
    });
    toastr.success("\u89C6\u9891\u7D20\u6750\u5DF2\u66F4\u65B0");
  } else {
    addVideoAsset({
      fileid,
      category,
      name,
      description,
      enabled
    });
    toastr.success("\u89C6\u9891\u7D20\u6750\u5DF2\u6DFB\u52A0");
  }
  $editModal.fadeOut(150);
  renderAssetsList();
}

async function handleExport() {
  const assets = getVideoAssets();
  if (!assets || assets.length === 0) {
    toastr.warning("\u5F53\u524D\u6682\u65E0\u89C6\u9891\u7D20\u6750\u53EF\u4F9B\u5BFC\u51FA");
    return;
  }
  const JSZipConstructor = window.stChatu8JSZip || window.JSZip;
  const toastId = toastr.info("\u6B63\u5728\u8BFB\u53D6\u7D20\u6750\u5E76\u6253\u5305\u56FE\u7247\uFF0C\u8BF7\u7A0D\u5019...", "", { timeOut: 0, extendedTimeOut: 0 });
  try {
    const { assets: exportAssets, mediaFiles } = await prepareVideoAssetsExportPackage((curr, total, fid) => {
      if (curr % 3 === 0 || curr === total) {
        toastr.clear(toastId);
        toastr.info(`\u6B63\u5728\u6253\u5305\u7D20\u6750\u5A92\u4F53 (${curr}/${total})...`, "", { timeOut: 1200 });
      }
    });
    if (typeof JSZipConstructor === "function") {
      const zip = new JSZipConstructor();
      zip.file("assets.json", JSON.stringify(exportAssets, null, 2));
      if (mediaFiles.length > 0) {
        const mediaFolder = zip.folder("media");
        for (const item of mediaFiles) {
          const safeName = item.fileName || `${item.fileid}.png`;
          mediaFolder.file(safeName, item.blob);
        }
      }
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `st-chatu8-video-assets-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastr.clear(toastId);
      toastr.success(`\u5BFC\u51FA\u6210\u529F\uFF01\u5305\u542B ${exportAssets.length} \u4E2A\u7D20\u6750\uFF0C${mediaFiles.length} \u4E2A\u5A92\u4F53\u6587\u4EF6\u3002`);
    } else {
      const jsonStr = exportVideoAssetsJSON();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `st-chatu8-video-assets-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastr.clear(toastId);
      toastr.info("\u7531\u4E8E\u672A\u68C0\u6D4B\u5230 ZIP \u538B\u7F29\u7EC4\u4EF6\uFF0C\u5DF2\u4E3A\u60A8\u5BFC\u51FA JSON \u914D\u7F6E\uFF08\u672A\u5305\u542B\u56FE\u7247\u4E8C\u8FDB\u5236\u6570\u636E\uFF09\u3002");
    }
  } catch (err) {
    console.error("[VideoAssets] \u5BFC\u51FA\u5931\u8D25:", err);
    toastr.clear(toastId);
    toastr.error(`\u5BFC\u51FA\u5931\u8D25: ${err.message}`);
  }
}

async function handleImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const fileName = file.name || "";
  const isZip = fileName.toLowerCase().endsWith(".zip") || file.type && file.type.includes("zip");
  const toastId = toastr.info("\u6B63\u5728\u89E3\u6790\u5BFC\u5165\u6587\u4EF6...", "", { timeOut: 0, extendedTimeOut: 0 });
  try {
    let importedAssets = [];
    const mediaMap = /* @__PURE__ */ new Map();
    if (isZip) {
      const JSZipConstructor = window.stChatu8JSZip || window.JSZip;
      if (typeof JSZipConstructor !== "function") {
        throw new Error("ZIP \u89E3\u6790\u7EC4\u4EF6\u672A\u5C31\u7EEA\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5");
      }
      const zip = await JSZipConstructor.loadAsync(file);
      let jsonEntry = zip.file("assets.json");
      if (!jsonEntry) {
        const jsonFiles = Object.keys(zip.files).filter((k) => !zip.files[k].dir && k.toLowerCase().endsWith(".json"));
        if (jsonFiles.length > 0) {
          jsonEntry = zip.file(jsonFiles[0]);
        }
      }
      if (!jsonEntry) {
        throw new Error("\u538B\u7F29\u5305\u5185\u672A\u627E\u5230\u8D44\u4EA7\u914D\u7F6E\u6E05\u5355 assets.json");
      }
      const jsonText = await jsonEntry.async("text");
      const parsed = JSON.parse(jsonText);
      importedAssets = Array.isArray(parsed) ? parsed : parsed.assets || [];
      const mediaEntries = [];
      for (const path of Object.keys(zip.files)) {
        const entry = zip.files[path];
        if (entry.dir || path.toLowerCase().endsWith(".json")) continue;
        const blob = await entry.async("blob");
        const baseName2 = path.split("/").pop();
        const dotIdx = baseName2.lastIndexOf(".");
        const nameWithoutExt = dotIdx !== -1 ? baseName2.substring(0, dotIdx) : baseName2;
        mediaMap.set(path, blob);
        mediaMap.set(baseName2, blob);
        mediaMap.set(nameWithoutExt, blob);
        mediaMap.set(path.toLowerCase(), blob);
        mediaMap.set(baseName2.toLowerCase(), blob);
        mediaMap.set(nameWithoutExt.toLowerCase(), blob);
        mediaEntries.push({ path, baseName: baseName2, nameWithoutExt, blob });
      }
      if (mediaEntries.length === importedAssets.length && importedAssets.length > 0) {
        for (let i = 0; i < importedAssets.length; i++) {
          const item = importedAssets[i];
          const entry = mediaEntries[i];
          if (item.fileid && !mediaMap.has(item.fileid)) {
            mediaMap.set(item.fileid, entry.blob);
          }
          if (item.name && !mediaMap.has(item.name)) {
            mediaMap.set(item.name, entry.blob);
          }
        }
      }
    } else {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        importedAssets = parsed;
      } else if (parsed && typeof parsed === "object") {
        importedAssets = Array.isArray(parsed.assets) ? parsed.assets : [];
        if (parsed.images && typeof parsed.images === "object") {
          for (const [k, v] of Object.entries(parsed.images)) {
            mediaMap.set(k, v);
          }
        }
      }
    }
    if (!Array.isArray(importedAssets) || importedAssets.length === 0) {
      throw new Error("\u6587\u4EF6\u4E2D\u672A\u68C0\u6D4B\u5230\u6709\u6548\u7684\u89C6\u9891\u7D20\u6750\u6570\u636E");
    }
    const conflicts = checkVideoAssetsConflicts(importedAssets);
    __set_pendingImportPackage({
      assets: importedAssets,
      mediaMap,
      conflicts
    });
    $("#va-import-stat-assets").text(importedAssets.length);
    $("#va-import-stat-media").text(mediaMap.size);
    $("#va-import-stat-conflicts").text(conflicts.conflictCount);
    if (conflicts.conflictCount > 0) {
      const previewNames = conflicts.conflictNames.slice(0, 3).join("\u3001") + (conflicts.conflictNames.length > 3 ? " \u7B49" : "");
      $("#va-import-conflict-text").text(`\u68C0\u6D4B\u5230 ${conflicts.conflictCount} \u4E2A\u7D20\u6750\u4E0E\u672C\u5730\u540C\u540D\uFF08\u5982\uFF1A${previewNames}\uFF09\uFF0C\u8BF7\u786E\u8BA4\u8986\u76D6\u7B56\u7565\u3002`);
      $("#va-import-conflict-alert").show();
    } else {
      $("#va-import-conflict-alert").hide();
    }
    $('input[name="va-import-strategy"][value="overwrite"]').prop("checked", true).trigger("change");
    $("#va-import-clear-all").prop("checked", false);
    $("#va-import-progress-wrap").hide();
    $("#va-import-progress-bar").css("width", "0%");
    $("#va-import-modal-confirm").prop("disabled", false).html('<i class="fa-solid fa-check"></i> \u5F00\u59CB\u5BFC\u5165');
    toastr.clear(toastId);
    $("#va-import-modal").fadeIn(150);
  } catch (err) {
    console.error("[VideoAssets] \u89E3\u6790\u5BFC\u5165\u6587\u4EF6\u5931\u8D25:", err);
    toastr.clear(toastId);
    toastr.error(`\u89E3\u6790\u5BFC\u5165\u6587\u4EF6\u5931\u8D25: ${err.message}`);
  } finally {
    $("#va-import-file-input").val("");
  }
}

async function handleExecuteImport() {
  if (!pendingImportPackage) return;
  const { assets, mediaMap } = pendingImportPackage;
  const strategy = $('input[name="va-import-strategy"]:checked').val() || "overwrite";
  const clearAll2 = $("#va-import-clear-all").prop("checked");
  if (clearAll2) {
    const confirmed = confirm("\u26A0\uFE0F \u8B66\u544A\uFF1A\u60A8\u52FE\u9009\u4E86\u300C\u5BFC\u5165\u524D\u6E05\u7A7A\u5F53\u524D\u6240\u6709\u89C6\u9891\u7D20\u6750\u300D\uFF0C\u6B64\u64CD\u4F5C\u5C06\u5220\u9664\u5F53\u524D\u5168\u90E8\u7D20\u6750\uFF01\u786E\u5B9A\u7EE7\u7EED\u5417\uFF1F");
    if (!confirmed) return;
  }
  const $btnConfirm = $("#va-import-modal-confirm");
  const $btnCancel = $("#va-import-modal-cancel");
  const $progressWrap = $("#va-import-progress-wrap");
  const $progressBar = $("#va-import-progress-bar");
  const $progressStatus = $("#va-import-progress-status");
  const $progressPct = $("#va-import-progress-pct");
  $btnConfirm.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u5BFC\u5165\u4E2D...');
  $btnCancel.prop("disabled", true);
  $progressWrap.show();
  try {
    const stats = await importVideoAssetsPackage({
      assets,
      mediaMap,
      strategy,
      clearAll: clearAll2,
      onProgress: (curr, total, name) => {
        const pct = Math.round(curr / total * 100);
        $progressBar.css("width", `${pct}%`);
        $progressPct.text(`${pct}%`);
        $progressStatus.text(`\u6B63\u5728\u5904\u7406 (${curr}/${total}): ${name}`);
      }
    });
    $("#va-import-modal").fadeOut(150);
    __set_pendingImportPackage(null);
    renderAssetsList();
    toastr.success(`\u5BFC\u5165\u6210\u529F\uFF01\u65B0\u589E ${stats.added} \u4E2A\uFF0C\u8986\u76D6\u66F4\u65B0 ${stats.overwritten} \u4E2A\uFF0C\u8DF3\u8FC7 ${stats.skipped} \u4E2A\uFF0C\u6210\u529F\u5B58\u5165\u56FE\u7247 ${stats.mediaSaved} \u5F20\u3002`, "\u8D44\u4EA7\u5BFC\u5165\u5B8C\u6210", { timeOut: 5e3 });
  } catch (err) {
    console.error("[VideoAssets] \u6267\u884C\u5BFC\u5165\u5931\u8D25:", err);
    toastr.error(`\u5BFC\u5165\u5931\u8D25: ${err.message}`);
  } finally {
    $btnConfirm.prop("disabled", false).html('<i class="fa-solid fa-check"></i> \u5F00\u59CB\u5BFC\u5165');
    $btnCancel.prop("disabled", false);
  }
}

function escapeHtml9(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function __set_$modal(v) { $modal = v; }

export function __set_$video(v) { $video = v; }

export function __set_videoEl(v) { videoEl = v; }

export function __set_$uploadEmpty(v) { $uploadEmpty = v; }

export function __set_$dropzone(v) { $dropzone = v; }

export function __set_$fileInput(v) { $fileInput = v; }

export function __set_$changeVideoBtn(v) { $changeVideoBtn = v; }

export function __set_$closeBtn(v) { $closeBtn = v; }

export function __set_$shutterFlash(v) { $shutterFlash = v; }

export function __set_$metaBadge(v) { $metaBadge = v; }

export function __set_$metaText(v) { $metaText = v; }

export function __set_$monitorInfo(v) { $monitorInfo = v; }

export function __set_$monitorRes(v) { $monitorRes = v; }

export function __set_$monitorFps(v) { $monitorFps = v; }

export function __set_$slider(v) { $slider = v; }

export function __set_$curTimeText(v) { $curTimeText = v; }

export function __set_$totalTimeText(v) { $totalTimeText = v; }

export function __set_$curFrameText(v) { $curFrameText = v; }

export function __set_$totalFramesText(v) { $totalFramesText = v; }

export function __set_$btnPlay(v) { $btnPlay = v; }

export function __set_$btnFirst(v) { $btnFirst = v; }

export function __set_$btnLast(v) { $btnLast = v; }

export function __set_$btnPrev10(v) { $btnPrev10 = v; }

export function __set_$btnPrev1(v) { $btnPrev1 = v; }

export function __set_$btnNext1(v) { $btnNext1 = v; }

export function __set_$btnNext10(v) { $btnNext10 = v; }

export function __set_$fpsSelect(v) { $fpsSelect = v; }

export function __set_$jumpFrameInput(v) { $jumpFrameInput = v; }

export function __set_$btnCapture(v) { $btnCapture = v; }

export function __set_$previewCard(v) { $previewCard = v; }

export function __set_$previewImg(v) { $previewImg = v; }

export function __set_$previewEmpty(v) { $previewEmpty = v; }

export function __set_$specBar(v) { $specBar = v; }

export function __set_$inputName(v) { $inputName = v; }

export function __set_$inputCategory(v) { $inputCategory = v; }

export function __set_$inputDesc(v) { $inputDesc = v; }

export function __set_$btnSaveAsset(v) { $btnSaveAsset = v; }

export function __set_$btnDownload(v) { $btnDownload = v; }

export function __set_$btnCopy(v) { $btnCopy = v; }

export function __set_$btnToMerger(v) { $btnToMerger = v; }

export function __set_isInitialized3(v) { isInitialized3 = v; }

export function __set_extractorResizeHandler(v) { extractorResizeHandler = v; }

export function __set_isPlaying(v) { isPlaying = v; }

export function __set_currentVideoObjectUrl(v) { currentVideoObjectUrl = v; }

export function __set_currentVideoFile(v) { currentVideoFile = v; }

export function __set_videoDuration(v) { videoDuration = v; }

export function __set_videoWidth(v) { videoWidth = v; }

export function __set_videoHeight(v) { videoHeight = v; }

export function __set_fps(v) { fps = v; }

export function __set_totalFrames(v) { totalFrames = v; }

export function __set_isSliderDragging(v) { isSliderDragging = v; }

export function __set_currentCapturedDataUrl(v) { currentCapturedDataUrl = v; }

export function __set_currentCapturedBlob(v) { currentCapturedBlob = v; }

export { $btnCapture, $btnCopy, $btnDownload, $btnFirst, $btnLast, $btnNext1, $btnNext10, $btnPlay, $btnPrev1, $btnPrev10, $btnSaveAsset, $btnToMerger, $changeVideoBtn, $closeBtn, $curFrameText, $curTimeText, $dropzone, $fileInput, $fpsSelect, $inputCategory, $inputDesc, $inputName, $jumpFrameInput, $metaBadge, $metaText, $modal, $monitorFps, $monitorInfo, $monitorRes, $previewCard, $previewEmpty, $previewImg, $shutterFlash, $slider, $specBar, $totalFramesText, $totalTimeText, $uploadEmpty, $video, currentCapturedBlob, currentCapturedDataUrl, currentVideoFile, currentVideoObjectUrl, extractorResizeHandler, fps, initVideoAssets, isInitialized3, isPlaying, isSliderDragging, renderAssetsList, sessionUploadedMedia2, totalFrames, videoDuration, videoEl, videoHeight, videoWidth };
