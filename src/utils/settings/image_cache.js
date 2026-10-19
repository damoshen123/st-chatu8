// 还原自打包产物 — 原始模块: utils/settings/image_cache.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { stylishConfirm } from "../ui_common.js";
import { calculateAllImageSizes, cancelSizeCalc, deleteImagesByUuids, deleteMultipleImages, getAllImageMetadata, getImageBlobByUUID, getImageThumbnailBlobByUUID, getSizeCalcTask, subscribeSizeCalcProgress, syncServerImagesWithStorage } from "../database.js";
import { createParamsPanel } from "../genParams.js";
import { RECALC_PHASE_LABELS, __set_allCachedImages, __set_imageCacheCurrentPage, __set_imageObserver, __set_isMultiSelectMode, __set_recalcPanelDismissed, __set_recalcStartedAt, allCachedImages, imageCacheCurrentPage, imageCacheItemsPerPage, imageObserver, isMultiSelectMode, recalcPanelDismissed, recalcStartedAt, selectedImages } from "./novelai_ui.js";

function formatMB(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function showCacheImagePreview(initialUUID) {
  const doc = document;
  let currentIndex = allCachedImages.findIndex((img) => img.uuid === initialUUID);
  if (currentIndex === -1) currentIndex = 0;
  const backdrop = doc.createElement("div");
  backdrop.className = "st-chatu8-preview-backdrop";
  backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        height: 100dvh;
        background-color: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
  const dialog = doc.createElement("div");
  dialog.className = "st-chatu8-preview-dialog";
  dialog.addEventListener("click", (e) => e.stopPropagation());
  dialog.style.cssText = `
        display: flex;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        max-width: 100vw;
        max-height: 100vh;
        max-height: 100dvh;
        padding: 5px;
        box-sizing: border-box;
        border-radius: 0;
        background-color: #1a1a2e;
        overflow: hidden;
    `;
  const closeButton = doc.createElement("div");
  closeButton.className = "st-chatu8-preview-close";
  closeButton.innerHTML = "&times;";
  closeButton.onclick = () => {
    doc.removeEventListener("keydown", handleKeyDown);
    if (largeMedia && largeMedia.src && largeMedia.src.startsWith("blob:")) {
      URL.revokeObjectURL(largeMedia.src);
    }
    backdrop.remove();
  };
  const imageContainer = doc.createElement("div");
  imageContainer.className = "st-chatu8-preview-image-container";
  imageContainer.style.cssText = `
        position: relative;
        flex: 1;
        min-height: 0;
        overflow: hidden;
    `;
  const navButtonStyle = `
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, rgba(74, 144, 226, 0.8) 0%, rgba(123, 97, 255, 0.8) 100%);
        color: white;
        font-size: 14px;
        font-weight: bold;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        user-select: none;
    `;
  const prevButton = doc.createElement("div");
  prevButton.className = "st-chatu8-preview-nav prev";
  prevButton.innerHTML = "&#10094;";
  prevButton.style.cssText = navButtonStyle + "left: 10px;";
  prevButton.title = "\u4E0A\u4E00\u5F20 (\u2190)";
  prevButton.onmouseenter = () => {
    prevButton.style.transform = "translateY(-50%) scale(1.1)";
  };
  prevButton.onmouseleave = () => {
    prevButton.style.transform = "translateY(-50%)";
  };
  prevButton.onclick = () => navigateTo(currentIndex - 1);
  const nextButton = doc.createElement("div");
  nextButton.className = "st-chatu8-preview-nav next";
  nextButton.innerHTML = "&#10095;";
  nextButton.style.cssText = navButtonStyle + "right: 10px;";
  nextButton.title = "\u4E0B\u4E00\u5F20 (\u2192)";
  nextButton.onmouseenter = () => {
    nextButton.style.transform = "translateY(-50%) scale(1.1)";
  };
  nextButton.onmouseleave = () => {
    nextButton.style.transform = "translateY(-50%)";
  };
  nextButton.onclick = () => navigateTo(currentIndex + 1);
  const largeMediaWrapper = doc.createElement("div");
  largeMediaWrapper.className = "st-chatu8-preview-large-wrapper";
  largeMediaWrapper.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        min-height: 200px;
        overflow: hidden;
    `;
  let largeMedia = null;
  const indexIndicator = doc.createElement("div");
  indexIndicator.className = "st-chatu8-preview-counter";
  indexIndicator.style.cssText = `
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        padding: 5px 14px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
  imageContainer.appendChild(prevButton);
  imageContainer.appendChild(largeMediaWrapper);
  imageContainer.appendChild(nextButton);
  imageContainer.appendChild(indexIndicator);
  const actionContainer = doc.createElement("div");
  actionContainer.className = "st-chatu8-preview-actions";
  actionContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 6px 0;
        flex-shrink: 0;
    `;
  const downloadButton = doc.createElement("button");
  downloadButton.textContent = "\u4E0B\u8F7D\u5F53\u524D\u5A92\u4F53";
  downloadButton.className = "st-chatu8-preview-action-button";
  downloadButton.onclick = async () => {
    const uuid = largeMedia?.dataset.uuid;
    const source = largeMedia?.dataset.source;
    const path = largeMedia?.dataset.path;
    const isVideo = largeMedia?.dataset.isVideo === "true";
    let blob;
    if (source === "server" && path) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          blob = await response.blob();
        }
      } catch (error) {
        console.error("Failed to fetch media from server:", error);
      }
    } else {
      blob = await getImageBlobByUUID(uuid);
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = doc.createElement("a");
      link.href = url;
      const ext = isVideo ? "mp4" : "png";
      link.download = `${uuid}.${ext}`;
      doc.body.appendChild(link);
      link.click();
      doc.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert("\u65E0\u6CD5\u52A0\u8F7D\u5A92\u4F53\u6570\u636E\u8FDB\u884C\u4E0B\u8F7D\u3002");
    }
  };
  const paramsPanel = createParamsPanel(doc);
  function renderCurrentParams() {
    if (!paramsPanel.isVisible()) return;
    const info = allCachedImages[currentIndex] || {};
    paramsPanel.render(info.genParams, void 0, info.timestamp);
  }
  const paramsButton = doc.createElement("button");
  paramsButton.textContent = "\u67E5\u770B\u751F\u6210\u53C2\u6570";
  paramsButton.className = "st-chatu8-preview-action-button";
  paramsButton.title = "\u67E5\u770B\u8FD9\u5F20\u56FE\u7684\u751F\u6210\u53C2\u6570";
  paramsButton.onclick = () => {
    if (paramsPanel.toggle()) {
      renderCurrentParams();
    }
  };
  const deleteButton = doc.createElement("button");
  deleteButton.textContent = "\u5220\u9664\u5F53\u524D\u5A92\u4F53";
  deleteButton.className = "st-chatu8-preview-action-button danger";
  actionContainer.appendChild(downloadButton);
  actionContainer.appendChild(paramsButton);
  actionContainer.appendChild(deleteButton);
  dialog.appendChild(closeButton);
  dialog.appendChild(imageContainer);
  dialog.appendChild(actionContainer);
  dialog.appendChild(paramsPanel.panel);
  backdrop.appendChild(dialog);
  doc.body.appendChild(backdrop);
  function updateNavButtons() {
    prevButton.style.visibility = currentIndex > 0 ? "visible" : "hidden";
    nextButton.style.visibility = currentIndex < allCachedImages.length - 1 ? "visible" : "hidden";
    indexIndicator.textContent = `${currentIndex + 1} / ${allCachedImages.length}`;
  }
  function navigateTo(newIndex) {
    if (newIndex < 0 || newIndex >= allCachedImages.length) return;
    currentIndex = newIndex;
    const targetUUID = allCachedImages[currentIndex].uuid;
    loadImage2(targetUUID);
    updateNavButtons();
    renderCurrentParams();
  }
  function handleKeyDown(e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigateTo(currentIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      navigateTo(currentIndex + 1);
    } else if (e.key === "Escape") {
      closeButton.onclick();
    }
  }
  doc.addEventListener("keydown", handleKeyDown);
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartT = 0;
  let touchTracking = false;
  let touchHorizontal = null;
  imageContainer.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1 || allCachedImages.length <= 1) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartT = Date.now();
    touchTracking = true;
    touchHorizontal = null;
  }, { passive: true });
  imageContainer.addEventListener("touchmove", (e) => {
    if (!touchTracking) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (touchHorizontal === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      touchHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (touchHorizontal && e.cancelable) {
      e.preventDefault();
    }
  }, { passive: false });
  imageContainer.addEventListener("touchend", (e) => {
    if (!touchTracking) return;
    touchTracking = false;
    if (!touchHorizontal) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dt = Math.max(1, Date.now() - touchStartT);
    const velocity = dx / dt;
    const slotWidth = imageContainer.offsetWidth || 1;
    const distThreshold = slotWidth * 0.2;
    const velThreshold = 0.4;
    if (dx <= -distThreshold || velocity <= -velThreshold) {
      navigateTo(currentIndex + 1);
    } else if (dx >= distThreshold || velocity >= velThreshold) {
      navigateTo(currentIndex - 1);
    }
  });
  imageContainer.addEventListener("touchcancel", () => {
    touchTracking = false;
    touchHorizontal = null;
  });
  deleteButton.onclick = async () => {
    if (!confirm("\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u5A92\u4F53\u5417\uFF1F")) {
      return;
    }
    const uuidToDelete = largeMedia?.dataset.uuid;
    if (!uuidToDelete) return;
    await deleteImagesByUuids([uuidToDelete]);
    toastr.success("\u5A92\u4F53\u5DF2\u5220\u9664");
    const itemInGrid = doc.querySelector(`.st-chatu8-image-cache-item[data-uuid="${uuidToDelete}"]`);
    if (itemInGrid) itemInGrid.remove();
    const indexInAll = allCachedImages.findIndex((img) => img.uuid === uuidToDelete);
    if (indexInAll > -1) {
      allCachedImages.splice(indexInAll, 1);
    }
    if (allCachedImages.length > 0) {
      if (currentIndex >= allCachedImages.length) {
        currentIndex = allCachedImages.length - 1;
      }
      navigateTo(currentIndex);
      updateImageCacheInfo();
    } else {
      doc.removeEventListener("keydown", handleKeyDown);
      backdrop.remove();
      updateImageCacheInfo();
    }
  };
  async function loadImage2(uuid) {
    try {
      const imageInfo = allCachedImages.find((img) => img.uuid === uuid);
      const isVideo = imageInfo?.isVideo || false;
      let blob;
      if (imageInfo && imageInfo.source === "server" && imageInfo.path) {
        try {
          const response = await fetch(imageInfo.path);
          if (response.ok) {
            blob = await response.blob();
          }
        } catch (error) {
          console.error("Failed to fetch media from server:", error);
        }
      } else {
        blob = await getImageBlobByUUID(uuid);
      }
      if (largeMedia) {
        if (largeMedia.src && largeMedia.src.startsWith("blob:")) {
          URL.revokeObjectURL(largeMedia.src);
        }
        largeMedia.remove();
      }
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        if (isVideo) {
          largeMedia = doc.createElement("video");
          largeMedia.src = blobUrl;
          largeMedia.controls = true;
          largeMedia.loop = true;
          largeMedia.muted = false;
          largeMedia.defaultMuted = false;
          largeMedia.removeAttribute("muted");
          largeMedia.playsInline = true;
          largeMedia.setAttribute("playsinline", "");
          largeMedia.setAttribute("webkit-playsinline", "true");
          largeMedia.setAttribute("x5-playsinline", "true");
          largeMedia.setAttribute("x5-video-player-type", "h5");
          largeMedia.autoplay = true;
          largeMedia.style.cssText = `
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                        border-radius: 8px;
                    `;
          largeMedia.onerror = function() {
            console.warn("[image_cache] Video cannot be played");
            const fallback = doc.createElement("div");
            fallback.style.cssText = `
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                            border-radius: 8px;
                            padding: 40px;
                            min-height: 200px;
                            color: #fff;
                            text-align: center;
                        `;
            fallback.innerHTML = `
                            <div style="font-size: 64px; margin-bottom: 15px;">\u{1F3AC}</div>
                            <div style="margin-bottom: 15px; opacity: 0.8;">\u89C6\u9891\u683C\u5F0F\u4E0D\u652F\u6301\u6D4F\u89C8\u5668\u64AD\u653E</div>
                            <a href="${blobUrl}" download="video.mp4" 
                               style="background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 4px; color: #fff; text-decoration: none;">
                                \u{1F4E5} \u4E0B\u8F7D\u89C6\u9891
                            </a>
                        `;
            fallback.className = "st-chatu8-preview-large-image";
            fallback.dataset.uuid = uuid;
            fallback.dataset.isVideo = "true";
            if (imageInfo) {
              fallback.dataset.source = imageInfo.source;
              if (imageInfo.path) {
                fallback.dataset.path = imageInfo.path;
              }
            }
            if (largeMedia.parentNode) {
              largeMedia.parentNode.replaceChild(fallback, largeMedia);
              largeMedia = fallback;
            }
          };
        } else {
          largeMedia = doc.createElement("img");
          largeMedia.src = blobUrl;
          largeMedia.style.cssText = `
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                        border-radius: 8px;
                    `;
        }
        largeMedia.className = "st-chatu8-preview-large-image";
        largeMedia.dataset.uuid = uuid;
        largeMedia.dataset.isVideo = isVideo ? "true" : "false";
        if (imageInfo) {
          largeMedia.dataset.source = imageInfo.source;
          if (imageInfo.path) {
            largeMedia.dataset.path = imageInfo.path;
          }
        }
        largeMediaWrapper.appendChild(largeMedia);
      } else {
        const errorMsg = doc.createElement("div");
        errorMsg.textContent = "\u52A0\u8F7D\u5931\u8D25";
        errorMsg.dataset.uuid = uuid;
        largeMedia = errorMsg;
        largeMediaWrapper.appendChild(errorMsg);
      }
    } catch (error) {
      console.error("[image_cache] loadImage error:", error);
      if (largeMedia) {
        if (largeMedia.src && largeMedia.src.startsWith("blob:")) {
          URL.revokeObjectURL(largeMedia.src);
        }
        largeMedia.remove();
      }
      const fallback = doc.createElement("div");
      fallback.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 8px;
                padding: 40px;
                min-height: 200px;
                color: #fff;
                text-align: center;
            `;
      fallback.innerHTML = `
                <div style="font-size: 64px; margin-bottom: 15px;">\u26A0\uFE0F</div>
                <div style="margin-bottom: 15px; opacity: 0.8;">\u5A92\u4F53\u6570\u636E\u5DF2\u635F\u574F\uFF0C\u65E0\u6CD5\u52A0\u8F7D</div>
                <div style="font-size: 12px; opacity: 0.5;">\u53EF\u70B9\u51FB\u4E0B\u65B9"\u5220\u9664\u5F53\u524D\u5A92\u4F53"\u6309\u94AE\u6E05\u7406\u6B64\u6761\u76EE</div>
            `;
      fallback.className = "st-chatu8-preview-large-image";
      fallback.dataset.uuid = uuid;
      fallback.dataset.isVideo = "false";
      largeMedia = fallback;
      largeMediaWrapper.appendChild(fallback);
    }
  }
  loadImage2(initialUUID);
  updateNavButtons();
}

function displayCachePage(page) {
  const grid = document.getElementById("image-cache-grid");
  if (!grid) return;
  grid.querySelectorAll("img").forEach((img) => {
    if (img.src.startsWith("blob:")) {
      URL.revokeObjectURL(img.src);
    }
  });
  grid.innerHTML = "";
  const startIndex = (page - 1) * imageCacheItemsPerPage;
  const endIndex = startIndex + imageCacheItemsPerPage;
  const pageItems = allCachedImages.slice(startIndex, endIndex);
  if (imageObserver) {
    imageObserver.disconnect();
  }
  __set_imageObserver(new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const item = entry.target;
        const uuid = item.dataset.uuid;
        const thumbnailUuid = item.dataset.thumbnailUuid;
        const thumbnailPath = item.dataset.thumbnailPath;
        const source = item.dataset.source;
        const img = item.querySelector("img");
        let promise;
        if (source === "server" && thumbnailPath) {
          promise = fetch(thumbnailPath).then((response) => response.ok ? response.blob() : null).catch(() => null);
        } else if (thumbnailUuid) {
          promise = getImageThumbnailBlobByUUID(thumbnailUuid);
        } else {
          promise = getImageBlobByUUID(uuid);
        }
        promise.then((blob) => {
          if (blob) {
            img.src = URL.createObjectURL(blob);
          } else {
            img.alt = "\u52A0\u8F7D\u5931\u8D25";
          }
        }).catch(() => {
          img.alt = "\u52A0\u8F7D\u5931\u8D25";
        });
        observer.unobserve(item);
      }
    });
  }, { rootMargin: "200px" }));
  pageItems.forEach((imageMeta) => {
    const item = document.createElement("div");
    item.className = "st-chatu8-image-cache-item";
    item.dataset.uuid = imageMeta.uuid;
    item.dataset.md5 = imageMeta.md5;
    item.dataset.source = imageMeta.source;
    item.dataset.isVideo = imageMeta.isVideo ? "true" : "false";
    if (imageMeta.thumbnail_uuid) {
      item.dataset.thumbnailUuid = imageMeta.thumbnail_uuid;
    }
    if (imageMeta.thumbnail_path) {
      item.dataset.thumbnailPath = imageMeta.thumbnail_path;
    }
    if (selectedImages.has(imageMeta.uuid)) {
      item.classList.add("selected");
    }
    const img = document.createElement("img");
    img.dataset.src = "placeholder";
    if (imageMeta.isVideo) {
      const videoIcon = document.createElement("div");
      videoIcon.className = "st-chatu8-video-icon";
      videoIcon.innerHTML = '<i class="fa-solid fa-video"></i>';
      videoIcon.style.cssText = "position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 4px 6px; border-radius: 4px; font-size: 12px;";
      item.style.position = "relative";
      item.appendChild(videoIcon);
    }
    const info = document.createElement("div");
    info.className = "st-chatu8-image-info";
    info.textContent = new Date(imageMeta.timestamp).toLocaleString();
    item.appendChild(img);
    item.appendChild(info);
    grid.appendChild(item);
    imageObserver.observe(item);
    item.addEventListener("click", () => {
      if (isMultiSelectMode) {
        if (selectedImages.has(imageMeta.uuid)) {
          selectedImages.delete(imageMeta.uuid);
          item.classList.remove("selected");
        } else {
          selectedImages.add(imageMeta.uuid);
          item.classList.add("selected");
        }
        updateImageCacheInfo();
      } else {
        showCacheImagePreview(imageMeta.uuid);
      }
    });
  });
  updateImageCachePagination();
}

function updateImageCachePagination() {
  const pagination = document.getElementById("image-cache-pagination");
  const jumpContainer = document.getElementById("image-cache-jump-container");
  const jumpInput = document.getElementById("image-cache-jump-input");
  if (!pagination || !jumpContainer || !jumpInput) return;
  Array.from(pagination.childNodes).forEach((child) => {
    if (child.id !== "image-cache-jump-container") {
      pagination.removeChild(child);
    }
  });
  const totalPages = Math.ceil(allCachedImages.length / imageCacheItemsPerPage);
  if (totalPages <= 1) {
    jumpContainer.style.display = "none";
    return;
  }
  jumpContainer.style.display = "inline-block";
  jumpInput.max = totalPages;
  jumpInput.value = imageCacheCurrentPage;
  const prevButton = document.createElement("button");
  prevButton.className = "st-chatu8-btn";
  prevButton.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
  prevButton.disabled = imageCacheCurrentPage === 1;
  prevButton.addEventListener("click", () => {
    if (imageCacheCurrentPage > 1) {
      __set_imageCacheCurrentPage(imageCacheCurrentPage - 1);
      displayCachePage(imageCacheCurrentPage);
    }
  });
  const nextButton = document.createElement("button");
  nextButton.className = "st-chatu8-btn";
  nextButton.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
  nextButton.disabled = imageCacheCurrentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (imageCacheCurrentPage < totalPages) {
      __set_imageCacheCurrentPage(imageCacheCurrentPage + 1);
      displayCachePage(imageCacheCurrentPage);
    }
  });
  const pageInfo = document.createElement("span");
  pageInfo.textContent = `\u7B2C ${imageCacheCurrentPage} / ${totalPages} \u9875`;
  pageInfo.style.margin = "0 10px";
  pagination.insertBefore(prevButton, jumpContainer);
  pagination.insertBefore(pageInfo, jumpContainer);
  pagination.insertBefore(nextButton, jumpContainer);
}

function updateImageCacheInfo() {
  const info = document.getElementById("image-cache-info");
  if (!info) return;
  const total = allCachedImages.length;
  const selected = selectedImages.size;
  const videoCount = allCachedImages.filter((img) => img.isVideo).length;
  const imageCount = total - videoCount;
  let serverBytes = 0, serverCounted = 0, serverTotal = 0;
  let dbBytes = 0, dbCounted = 0, dbTotal = 0;
  for (const img of allCachedImages) {
    const bytes = (typeof img.size === "number" ? img.size : 0) + (typeof img.thumbnail_size === "number" ? img.thumbnail_size : 0);
    const counted = typeof img.size === "number";
    if (img.source === "server") {
      serverTotal++;
      if (counted) {
        serverCounted++;
        serverBytes += bytes;
      }
    } else {
      dbTotal++;
      if (counted) {
        dbCounted++;
        dbBytes += bytes;
      }
    }
  }
  const unCounted = serverTotal - serverCounted + (dbTotal - dbCounted);
  info.innerHTML = "";
  const line1 = document.createElement("div");
  line1.textContent = `\u603B\u8BA1 ${total} \u4E2A\u5A92\u4F53 (\u56FE\u7247: ${imageCount}, \u89C6\u9891: ${videoCount}) | \u9009\u4E2D ${selected} \u4E2A`;
  info.appendChild(line1);
  const line2 = document.createElement("div");
  line2.className = "st-chatu8-cache-size-line";
  const parts = [
    `\u9152\u9986\u670D\u52A1\u5668 ${formatMB(serverBytes)} (${serverCounted}/${serverTotal} \u9879)`,
    `\u6D4F\u89C8\u5668\u6570\u636E\u5E93 ${formatMB(dbBytes)} (${dbCounted}/${dbTotal} \u9879)`,
    `\u5408\u8BA1 ${formatMB(serverBytes + dbBytes)}`
  ];
  if (unCounted > 0) parts.push(`\u672A\u7EDF\u8BA1 ${unCounted} \u9879`);
  line2.textContent = parts.join(" \xB7 ");
  info.appendChild(line2);
  const line3 = document.createElement("div");
  line3.className = "st-chatu8-cache-quota-line";
  line3.id = "image-cache-quota-line";
  info.appendChild(line3);
  updateStorageQuotaLine();
}

async function updateStorageQuotaLine() {
  const line = document.getElementById("image-cache-quota-line");
  if (!line) return;
  if (!navigator.storage || typeof navigator.storage.estimate !== "function") {
    line.textContent = "\u6D4F\u89C8\u5668\u914D\u989D: \u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u67E5\u8BE2";
    return;
  }
  try {
    const { usage, quota } = await navigator.storage.estimate();
    line.textContent = `\u6D4F\u89C8\u5668\u5B58\u50A8\u914D\u989D: \u5DF2\u7528 ${formatMB(usage)} / \u4E0A\u9650 ${formatMB(quota)}\uFF08\u6D4F\u89C8\u5668\u672C\u5730\u5168\u90E8\u6570\u636E\uFF0C\u542B\u804A\u5929\u8BB0\u5F55\u4E0E\u5176\u4ED6\u6269\u5C55\uFF0C\u4E0E\u4E0A\u65B9\u9152\u9986\u670D\u52A1\u5668\u6570\u5B57\u65E0\u5173\uFF09`;
  } catch (e) {
    line.textContent = "\u6D4F\u89C8\u5668\u914D\u989D: \u67E5\u8BE2\u5931\u8D25";
  }
}

async function loadImageCache(options = {}) {
  const { preservePage = false } = options;
  const previousPage = imageCacheCurrentPage;
  const grid = document.getElementById("image-cache-grid");
  const info = document.getElementById("image-cache-info");
  if (!grid || !info) return;
  grid.innerHTML = "\u6B63\u5728\u52A0\u8F7D\u56FE\u7247...";
  const metadata = await getAllImageMetadata();
  __set_allCachedImages([]);
  for (const [md5, meta] of Object.entries(metadata)) {
    if (meta.images && Array.isArray(meta.images)) {
      meta.images.forEach((imageEntry) => {
        if (imageEntry.date) {
          const imageData = {
            uuid: imageEntry.uuid,
            thumbnail_uuid: imageEntry.thumbnail_uuid,
            md5,
            timestamp: imageEntry.date,
            source: imageEntry.source || "db",
            // 'server' 或 'db'
            path: imageEntry.path || null,
            // 服务器路径（如果有）
            thumbnail_path: imageEntry.thumbnail_path || null,
            isVideo: imageEntry.isVideo || false,
            // 添加视频标识
            // 尺寸字段：旧数据没有，保持 undefined 以区分「0 字节」和「未统计」
            size: typeof imageEntry.size === "number" ? imageEntry.size : void 0,
            thumbnail_size: typeof imageEntry.thumbnail_size === "number" ? imageEntry.thumbnail_size : void 0,
            // 生成参数快照：老图没有，为 null
            genParams: imageEntry.genParams || null
          };
          allCachedImages.push(imageData);
        }
      });
    }
  }
  allCachedImages.sort((a, b) => b.timestamp - a.timestamp);
  if (preservePage) {
    const totalPages = Math.max(1, Math.ceil(allCachedImages.length / imageCacheItemsPerPage));
    __set_imageCacheCurrentPage(Math.min(Math.max(1, previousPage), totalPages));
  } else {
    __set_imageCacheCurrentPage(1);
  }
  selectedImages.clear();
  if (allCachedImages.length === 0) {
    grid.innerHTML = "\u6CA1\u6709\u627E\u5230\u7F13\u5B58\u7684\u56FE\u7247\u3002";
    info.textContent = "\u603B\u8BA1 0 \u5F20\u56FE\u7247\u3002";
    updateImageCachePagination();
  } else {
    displayCachePage(imageCacheCurrentPage);
    updateImageCacheInfo();
  }
}

async function clearCache() {
  const settings3 = extension_settings[extensionName];
  stylishConfirm(`\u4F60\u786E\u5B9A\u8981\u6E05\u9664\u6240\u6709\u8FC7\u671F\u7684\u56FE\u7247\u7F13\u5B58\u5417\uFF1F (\u8FC7\u671F\u65F6\u95F4: ${settings3.cache} \u5929)`).then(async (confirmed) => {
    if (confirmed) {
      try {
        const metadata = await getAllImageMetadata();
        if (!metadata || Object.keys(metadata).length === 0) {
          alert("\u56FE\u7247\u5E93\u4E3A\u7A7A\uFF0C\u65E0\u9700\u6E05\u7406\u3002");
          return;
        }
        const md5sToDelete = [];
        const now = (/* @__PURE__ */ new Date()).getTime();
        const cacheDays = Number(settings3.cache);
        for (const [md5, meta] of Object.entries(metadata)) {
          if (meta && meta.images && meta.images.length > 0) {
            const latestDate = Math.max(...meta.images.map((img) => img.date).filter(Boolean));
            if (latestDate) {
              const timeDiff = now - latestDate;
              const daysDiff = Math.ceil(timeDiff / (1e3 * 3600 * 24));
              if (daysDiff > cacheDays) {
                md5sToDelete.push(md5);
              }
            }
          }
        }
        if (md5sToDelete.length > 0) {
          await deleteMultipleImages(md5sToDelete);
          alert(`\u6E05\u9664\u4E86 ${md5sToDelete.length} \u4E2A\u8FC7\u671F\u56FE\u7247\u6761\u76EE\u3002`);
          if (settings3.jiuguanchucun === "true") {
            console.log("[Cache] \u6B63\u5728\u540C\u6B65\u670D\u52A1\u5668\u56FE\u7247...");
            const syncResult = await syncServerImagesWithStorage();
            if (syncResult.deletedCount > 0) {
              console.log(`[Cache] \u540C\u6B65\u5B8C\u6210\uFF0C\u5220\u9664\u4E86 ${syncResult.deletedCount} \u4E2A\u4E0D\u540C\u6B65\u7684\u670D\u52A1\u5668\u56FE\u7247`);
            }
            if (syncResult.errors.length > 0) {
              console.warn("[Cache] \u540C\u6B65\u8FC7\u7A0B\u4E2D\u51FA\u73B0\u9519\u8BEF:", syncResult.errors);
            }
          }
          await loadImageCache();
        } else {
          alert("\u6CA1\u6709\u627E\u5230\u8FC7\u671F\u7684\u56FE\u7247\u7F13\u5B58\u3002");
        }
      } catch (error) {
        console.error("\u6E05\u9664\u7F13\u5B58\u5931\u8D25:", error);
        alert("\u6E05\u9664\u7F13\u5B58\u65F6\u53D1\u751F\u9519\u8BEF\uFF0C\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u3002");
      }
    }
  });
}

function renderRecalcProgress(payload) {
  const panel = document.getElementById("image-cache-recalc-progress");
  const bar = document.getElementById("image-cache-recalc-bar");
  const title = document.getElementById("image-cache-recalc-title");
  const detail = document.getElementById("image-cache-recalc-detail");
  if (!panel || !bar || !title || !detail || !payload) return;
  if (recalcPanelDismissed) return;
  panel.style.display = "";
  const { phase, current, total: phaseTotal, detail: msg, report: r, error } = payload;
  if (phase === "error") {
    title.textContent = "\u7EDF\u8BA1\u5931\u8D25";
    detail.textContent = `\u53D1\u751F\u9519\u8BEF: ${error ? error.message : msg}\uFF0C\u8BE6\u60C5\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u3002`;
    return;
  }
  if (phase === "finished") {
    bar.style.width = "100%";
    renderRecalcSummary(r);
    return;
  }
  const pct = phaseTotal > 0 ? Math.min(100, Math.round(current / phaseTotal * 100)) : 0;
  bar.style.width = `${pct}%`;
  title.textContent = `${RECALC_PHASE_LABELS[phase] || phase} \u2014 ${pct}%`;
  const lines = [msg || ""];
  if (recalcStartedAt) {
    lines.push(`\u5DF2\u7528\u65F6 ${((Date.now() - recalcStartedAt) / 1e3).toFixed(1)}s`);
  }
  if (r) {
    if (r.skippedCount > 0) lines.push(`\u5DF2\u8DF3\u8FC7 ${r.skippedCount} \u9879\uFF08\u4E4B\u524D\u5DF2\u7EDF\u8BA1\uFF09`);
    if (r.orphanCount > 0) lines.push(`\u53D1\u73B0\u5B64\u513F\u6570\u636E ${r.orphanCount} \u6761 (${formatMB(r.orphanBytes)})`);
    if (r.failedCount > 0) lines.push(`\u63A2\u6D4B\u5931\u8D25 ${r.failedCount} \u4E2A`);
  }
  detail.textContent = lines.filter(Boolean).join("\n");
}

function renderRecalcSummary(report) {
  if (recalcPanelDismissed) return;
  const title = document.getElementById("image-cache-recalc-title");
  const detail = document.getElementById("image-cache-recalc-detail");
  if (!title || !detail || !report) return;
  const elapsed = recalcStartedAt ? ((Date.now() - recalcStartedAt) / 1e3).toFixed(1) : "?";
  if (report.cancelled) {
    title.textContent = "\u5DF2\u53D6\u6D88";
    detail.textContent = [
      `\u7EDF\u8BA1\u88AB\u4E2D\u65AD\uFF0C\u5DF2\u5B8C\u6210\u7684\u90E8\u5206\u5DF2\u4FDD\u5B58\uFF0C\u4E0B\u6B21\u70B9\u51FB\u300C\u7EE7\u7EED\u7EDF\u8BA1\u300D\u53EF\u63A5\u7740\u7B97\u3002`,
      `\u7528\u65F6 ${elapsed}s`
    ].join("\n");
    return;
  }
  title.textContent = "\u7EDF\u8BA1\u5B8C\u6210";
  const summary = [
    `\u9152\u9986\u5B58\u50A8\u539F\u56FE: ${formatMB(report.serverBytes)} (${report.serverCount} \u9879)`,
    `\u6D4F\u89C8\u5668\u5B58\u50A8\u539F\u56FE: ${formatMB(report.dbBytes)} (${report.dbCount} \u9879)`,
    `\u7F29\u7565\u56FE\u5408\u8BA1: ${formatMB(report.thumbnailBytes)} (${report.thumbnailCount} \u9879)`,
    `\u5408\u8BA1: ${formatMB(report.serverBytes + report.dbBytes + report.thumbnailBytes)}`,
    `\u7528\u65F6 ${elapsed}s`
  ];
  if (report.skippedCount > 0) {
    summary.push(`\u8DF3\u8FC7 ${report.skippedCount} \u9879\uFF08\u4E4B\u524D\u5DF2\u7EDF\u8BA1\uFF09`);
  }
  if (report.remote) {
    summary.push(`\u5DF2\u542F\u7528\u4E91\u9152\u9986\u9650\u6D41\uFF08\u5E76\u53D1 ${report.concurrency}\uFF09\uFF0C\u907F\u514D\u5360\u7528\u516C\u5171\u8D44\u6E90`);
  }
  if (report.orphanCount > 0) {
    summary.push(`\u5B64\u513F\u6570\u636E: ${report.orphanCount} \u6761 (${formatMB(report.orphanBytes)})\uFF0C\u5143\u6570\u636E\u672A\u5F15\u7528\uFF0C\u53EF\u8003\u8651\u6E05\u7406`);
  }
  if (report.failedCount > 0) {
    summary.push(`\u63A2\u6D4B\u5931\u8D25: ${report.failedCount} \u4E2A\u6587\u4EF6\uFF08\u53EF\u80FD\u5DF2\u88AB\u5220\u9664\uFF09`);
  }
  if (report.errors && report.errors.length > 0) {
    summary.push(`\u9519\u8BEF\u793A\u4F8B: ${report.errors.slice(0, 3).join("; ")}`);
    console.warn("[ImageCache] \u5C3A\u5BF8\u7EDF\u8BA1\u9519\u8BEF:", report.errors);
  }
  detail.textContent = summary.join("\n");
}

function syncRecalcButtons() {
  const task = getSizeCalcTask();
  const running = !!(task && task.running);
  const startBtn = document.getElementById("image-cache-recalc-size");
  const cancelBtn = document.getElementById("image-cache-recalc-cancel");
  if (startBtn) {
    startBtn.disabled = running;
    startBtn.innerHTML = running ? '<i class="fa-solid fa-spinner fa-spin"></i> \u7EDF\u8BA1\u4E2D...' : '<i class="fa-solid fa-calculator"></i> \u8BA1\u7B97\u5927\u5C0F';
  }
  if (cancelBtn) {
    cancelBtn.disabled = false;
    cancelBtn.textContent = running ? "\u53D6\u6D88" : "\u5173\u95ED";
    cancelBtn.classList.toggle("danger", running);
  }
}

function hideRecalcPanel() {
  const panel = document.getElementById("image-cache-recalc-progress");
  if (panel) panel.style.display = "none";
  __set_recalcPanelDismissed(true);
}

async function recalcImageSizes(options = {}) {
  const { force = false } = options;
  const existing = getSizeCalcTask();
  if (existing && existing.running) {
    renderRecalcProgress(existing.lastProgress);
    syncRecalcButtons();
    return;
  }
  const total = allCachedImages.length;
  if (total === 0) {
    alert("\u56FE\u7247\u5E93\u4E3A\u7A7A\uFF0C\u65E0\u9700\u7EDF\u8BA1\u3002");
    return;
  }
  let pending = 0;
  for (const img of allCachedImages) {
    if (typeof img.size !== "number") pending++;
    if (typeof img.thumbnail_size !== "number") pending++;
  }
  const workload = force ? total * 2 : pending;
  if (workload === 0) {
    alert("\u6240\u6709\u9879\u76EE\u90FD\u5DF2\u7EDF\u8BA1\u5B8C\u6210\u3002\u5982\u9700\u91CD\u65B0\u6838\u5BF9\uFF0C\u8BF7\u4F7F\u7528\u300C\u5168\u90E8\u91CD\u7B97\u300D\u3002");
    return;
  }
  if (workload > 3e3) {
    const ok = await stylishConfirm(
      `\u672C\u6B21\u9700\u8981\u7EDF\u8BA1 ${workload} \u4E2A\u9879\u76EE\uFF0C\u9884\u8BA1\u9700\u8981\u6570\u5206\u949F\u3002\u7EDF\u8BA1\u4F1A\u5728\u540E\u53F0\u8FDB\u884C\uFF0C\u53EF\u4EE5\u5173\u95ED\u8BBE\u7F6E\u9762\u677F\u3002\u662F\u5426\u7EE7\u7EED\uFF1F`
    );
    if (!ok) return;
  }
  __set_recalcStartedAt(Date.now());
  __set_recalcPanelDismissed(false);
  renderRecalcProgress({ phase: "db", current: 0, total: 1, detail: "\u51C6\u5907\u4E2D..." });
  syncRecalcButtons();
  try {
    const report = await calculateAllImageSizes({ force });
    renderRecalcSummary(report);
    if (!report.cancelled) {
      await loadImageCache({ preservePage: true });
    } else {
      await loadImageCache({ preservePage: true });
    }
  } catch (error) {
    console.error("[ImageCache] \u91CD\u65B0\u8BA1\u7B97\u5927\u5C0F\u5931\u8D25:", error);
    const title = document.getElementById("image-cache-recalc-title");
    const detail = document.getElementById("image-cache-recalc-detail");
    if (title) title.textContent = "\u7EDF\u8BA1\u5931\u8D25";
    if (detail) detail.textContent = `\u53D1\u751F\u9519\u8BEF: ${error.message}\uFF0C\u8BE6\u60C5\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u3002`;
  } finally {
    syncRecalcButtons();
  }
}

function initImageCache(settingsModal) {
  settingsModal.find('a[data-tab="image-cache"]').on("click", async () => {
    await loadImageCache();
    const task = getSizeCalcTask();
    if (task && task.running) {
      renderRecalcProgress(task.lastProgress);
    }
    syncRecalcButtons();
  });
  settingsModal.find("#Clear-Cache").on("click", clearCache);
  const jumpInput = document.getElementById("image-cache-jump-input");
  const jumpButton = document.getElementById("image-cache-jump-button");
  if (jumpInput && jumpButton) {
    const handleJump = () => {
      const totalPages = Math.ceil(allCachedImages.length / imageCacheItemsPerPage);
      const targetPage = parseInt(jumpInput.value);
      if (targetPage >= 1 && targetPage <= totalPages && targetPage !== imageCacheCurrentPage) {
        __set_imageCacheCurrentPage(targetPage);
        displayCachePage(imageCacheCurrentPage);
      }
    };
    jumpButton.addEventListener("click", handleJump);
    jumpInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleJump();
      }
    });
    jumpInput.addEventListener("input", () => {
      const totalPages = Math.ceil(allCachedImages.length / imageCacheItemsPerPage);
      const value = parseInt(jumpInput.value);
      if (value < 1) {
        jumpInput.value = 1;
      } else if (value > totalPages) {
        jumpInput.value = totalPages;
      }
    });
  }
  $("#image-cache-toggle-multiselect").on("click", function() {
    __set_isMultiSelectMode(!isMultiSelectMode);
    const grid = document.getElementById("image-cache-grid");
    const button = $(this);
    if (isMultiSelectMode) {
      button.text("\u53D6\u6D88\u591A\u9009");
      button.addClass("active");
      grid.classList.add("multi-select-mode");
    } else {
      button.text("\u591A\u9009");
      button.removeClass("active");
      grid.classList.remove("multi-select-mode");
      selectedImages.clear();
      grid.querySelectorAll(".st-chatu8-image-cache-item.selected").forEach((item) => item.classList.remove("selected"));
      updateImageCacheInfo();
    }
  });
  $("#image-cache-select-all").on("click", () => {
    const grid = document.getElementById("image-cache-grid");
    grid.querySelectorAll(".st-chatu8-image-cache-item").forEach((item) => {
      selectedImages.add(item.dataset.uuid);
      item.classList.add("selected");
    });
    updateImageCacheInfo();
  });
  $("#image-cache-deselect-all").on("click", () => {
    const grid = document.getElementById("image-cache-grid");
    selectedImages.clear();
    grid.querySelectorAll(".st-chatu8-image-cache-item").forEach((item) => item.classList.remove("selected"));
    updateImageCacheInfo();
  });
  $("#image-cache-recalc-size").on("click", () => recalcImageSizes({ force: false }));
  $("#image-cache-recalc-all").on("click", async () => {
    const existing = getSizeCalcTask();
    if (existing && existing.running) {
      alert("\u5DF2\u6709\u7EDF\u8BA1\u4EFB\u52A1\u5728\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u6216\u5148\u53D6\u6D88\u3002");
      return;
    }
    const ok = await stylishConfirm("\u5C06\u5FFD\u7565\u5DF2\u6709\u8BB0\u5F55\uFF0C\u91CD\u65B0\u7EDF\u8BA1\u5168\u90E8\u9879\u76EE\u3002\u786E\u5B9A\u7EE7\u7EED\uFF1F");
    if (ok) recalcImageSizes({ force: true });
  });
  $("#image-cache-recalc-cancel").on("click", () => {
    if (!cancelSizeCalc()) {
      hideRecalcPanel();
    }
    syncRecalcButtons();
  });
  subscribeSizeCalcProgress((payload) => {
    renderRecalcProgress(payload);
    if (payload.phase === "finished" || payload.phase === "error") {
      syncRecalcButtons();
    }
  });
  syncRecalcButtons();
  $("#image-cache-delete-selected").on("click", async () => {
    if (selectedImages.size === 0) {
      alert("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u56FE\u7247\u3002");
      return;
    }
    const confirmed = await stylishConfirm(`\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${selectedImages.size} \u5F20\u56FE\u7247\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`);
    if (confirmed) {
      await deleteImagesByUuids(Array.from(selectedImages));
      alert("\u9009\u4E2D\u7684\u56FE\u7247\u5DF2\u5220\u9664\u3002");
      loadImageCache({ preservePage: true });
    }
  });
  $("#image-cache-download-selected").on("click", async () => {
    if (selectedImages.size === 0) {
      alert("\u8BF7\u5148\u9009\u62E9\u8981\u4E0B\u8F7D\u7684\u5A92\u4F53\u3002");
      return;
    }
    const totalCount = selectedImages.size;
    const batchSize = 10;
    const uuids = Array.from(selectedImages);
    const JSZipConstructor = window.stChatu8JSZip || window.JSZip;
    if (typeof JSZipConstructor !== "function") {
      console.error("[st-chatu8] JSZip is unavailable when downloading selected media", {
        hasPluginScopedJSZip: typeof window.stChatu8JSZip === "function",
        hasWindowJSZip: typeof window.JSZip === "function"
      });
      toastr.error("ZIP \u7EC4\u4EF6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002");
      return;
    }
    const zip = new JSZipConstructor();
    let successCount = 0;
    let failCount = 0;
    toastr.info(`\u6B63\u5728\u51C6\u5907\u4E0B\u8F7D ${totalCount} \u4E2A\u5A92\u4F53\u6587\u4EF6...`);
    for (let i = 0; i < uuids.length; i += batchSize) {
      const batch = uuids.slice(i, i + batchSize);
      const batchPromises = batch.map(async (uuid) => {
        try {
          const mediaInfo = allCachedImages.find((img) => img.uuid === uuid);
          const isVideo = mediaInfo?.isVideo || false;
          const ext = isVideo ? "mp4" : "png";
          let blob;
          if (mediaInfo?.source === "server" && mediaInfo?.path) {
            const response = await fetch(mediaInfo.path);
            if (response.ok) {
              blob = await response.blob();
            }
          } else {
            blob = await getImageBlobByUUID(uuid);
          }
          if (blob && blob.size > 0) {
            zip.file(`${uuid}.${ext}`, blob);
            successCount++;
          } else {
            failCount++;
            console.warn(`\u65E0\u6CD5\u83B7\u53D6\u5A92\u4F53: ${uuid}`);
          }
        } catch (error) {
          failCount++;
          console.error(`\u4E0B\u8F7D\u5A92\u4F53\u5931\u8D25 ${uuid}:`, error);
        }
      });
      await Promise.all(batchPromises);
      const processed = Math.min(i + batchSize, uuids.length);
      if (processed < uuids.length) {
        toastr.info(`\u5904\u7406\u8FDB\u5EA6: ${processed}/${totalCount}`, "", { timeOut: 1e3 });
      }
    }
    if (successCount === 0) {
      toastr.error("\u6CA1\u6709\u6210\u529F\u83B7\u53D6\u4EFB\u4F55\u5A92\u4F53\u6587\u4EF6\uFF0C\u4E0B\u8F7D\u5DF2\u53D6\u6D88\u3002");
      return;
    }
    if (failCount > 0) {
      toastr.warning(`${failCount} \u4E2A\u6587\u4EF6\u83B7\u53D6\u5931\u8D25\uFF0C\u5C06\u4E0B\u8F7D ${successCount} \u4E2A\u6210\u529F\u7684\u6587\u4EF6\u3002`);
    }
    toastr.info("\u6B63\u5728\u751F\u6210\u538B\u7F29\u5305...");
    try {
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      if (content.size === 0) {
        toastr.error("\u751F\u6210\u7684\u538B\u7F29\u5305\u4E3A\u7A7A\uFF0C\u8BF7\u91CD\u8BD5\u3002");
        return;
      }
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `st-chatu8-media-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastr.success(`\u6210\u529F\u4E0B\u8F7D ${successCount} \u4E2A\u5A92\u4F53\u6587\u4EF6\uFF01`);
    } catch (error) {
      console.error("\u751F\u6210\u538B\u7F29\u5305\u5931\u8D25:", error);
      toastr.error("\u751F\u6210\u538B\u7F29\u5305\u5931\u8D25\uFF0C\u53EF\u80FD\u6587\u4EF6\u8FC7\u5927\u3002\u8BF7\u5C1D\u8BD5\u51CF\u5C11\u9009\u62E9\u7684\u6570\u91CF\u3002");
    }
  });
}

export { initImageCache };
