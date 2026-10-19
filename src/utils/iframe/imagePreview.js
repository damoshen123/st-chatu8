// 还原自打包产物 — 原始模块: utils/iframe/imagePreview.js
import { fixMp4Faststart, safeDataUrlToBlob } from "../utils.js";
import { dbs, deleteImage, getItemBlob, getItemImg, updateImageIndex } from "../database.js";
import { createParamsPanel } from "../genParams.js";
import { createAndShowImage } from "./generation.js";
import "./dialogs.js"; // init_dialogs

var chatProcessor_exports;


async function applyVideoSrc(videoEl2, dataUrl, originalUrl = "") {
  if (videoEl2.src && videoEl2.src.startsWith("blob:")) {
    try {
      (window.top?.URL || URL).revokeObjectURL(videoEl2.src);
    } catch (_) {
    }
  }
  try {
    const rawBlob = await safeDataUrlToBlob(dataUrl);
    const blob = await fixMp4Faststart(rawBlob);
    const blobUrl = (window.top?.URL || URL).createObjectURL(blob);
    videoEl2.dataset.blobUrl = blobUrl;
    videoEl2.src = blobUrl;
    if (originalUrl) {
      const onErr = function() {
        videoEl2.removeEventListener("error", onErr);
        if (originalUrl && videoEl2.src !== originalUrl) {
          console.log("[imagePreview] BlobURL \u5931\u8D25\uFF0C\u56DE\u9000\u5230\u539F\u59CB URL:", originalUrl);
          videoEl2.src = originalUrl;
          try {
            videoEl2.load();
          } catch (_) {
          }
        }
      };
      videoEl2.addEventListener("error", onErr);
    }
  } catch (e) {
    console.warn("[imagePreview] applyVideoSrc \u5931\u8D25\uFF0C\u56DE\u9000:", e);
    videoEl2.src = originalUrl || dataUrl;
  }
}

async function downloadBlob(blob, filename) {
  const topDoc = window.top.document;
  const topURL = window.top["URL"];
  if (!topURL) {
    console.error("window.top.URL is not available.");
    toastr.error("\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u4E0B\u8F7D\u529F\u80FD\u3002");
    return;
  }
  const url = topURL.createObjectURL(blob);
  const link = topDoc.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  topDoc.body.appendChild(link);
  link.click();
  topDoc.body.removeChild(link);
  setTimeout(() => {
    topURL.revokeObjectURL(url);
  }, 150);
}

function showImagePreview(img, button, autoFullscreen = false) {
  const doc = window.top.document;
  const currentTag = button.dataset.link;
  const verifiedInitialSrc = img && img.tagName === "VIDEO" ? img.dataset.blobUrl || img.src || "" : "";
  const savedChatEl = doc.querySelector("#chat") || doc.querySelector("#chat-body") || doc.querySelector(".chat-log");
  const savedChatScrollTop = savedChatEl ? savedChatEl.scrollTop : 0;
  const savedWindowScrollY = window.top.scrollY || 0;
  function restoreChatScroll() {
    setTimeout(() => {
      try {
        if (savedChatEl) savedChatEl.scrollTop = savedChatScrollTop;
        if (window.top && window.top.scrollTo) window.top.scrollTo(0, savedWindowScrollY);
      } catch (_) {
      }
    }, 50);
    setTimeout(() => {
      try {
        if (savedChatEl) savedChatEl.scrollTop = savedChatScrollTop;
      } catch (_) {
      }
    }, 200);
  }
  function requestSystemFullscreen() {
    try {
      const el = backdrop;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs) {
        const p = rfs.call(el);
        if (p && p.catch) p.catch(() => {
        });
      }
    } catch (_) {
    }
  }
  function exitSystemFullscreen() {
    try {
      const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (efs && (doc.fullscreenElement || doc.webkitFullscreenElement)) {
        const p = efs.call(doc);
        if (p && p.catch) p.catch(() => {
        });
      }
    } catch (_) {
    }
  }
  if (img && img.tagName === "VIDEO") {
    try {
      img.pause();
    } catch (_) {
    }
  }
  try {
    const allDocs = [document];
    document.querySelectorAll("iframe").forEach((f) => {
      try {
        if (f.contentDocument) allDocs.push(f.contentDocument);
      } catch (_) {
      }
    });
    if (window.top && window.top.document && !allDocs.includes(window.top.document)) {
      allDocs.push(window.top.document);
    }
    allDocs.forEach((d) => {
      d.querySelectorAll("video").forEach((v) => {
        try {
          v.pause();
        } catch (_) {
        }
      });
    });
  } catch (_) {
  }
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
  function syncPreviewSelectionToChat(newIndex) {
    if (!images || images.length === 0 || !(newIndex >= 0 && newIndex < images.length)) {
      return;
    }
    updateImageIndex(currentTag, newIndex);
    const selectedIsVideo = mediaInfos[newIndex]?.isVideo || false;
    const originalIsVideo = img && img.tagName === "VIDEO";
    getItemImg(currentTag, newIndex).then(([newSrc, change, , isVideo, origUrl]) => {
      if (!newSrc || !img) return;
      if (selectedIsVideo !== originalIsVideo) {
        const collapseWrapper = img.closest(".st-chatu8-collapse-wrapper");
        const imageContainer2 = img.closest(".st-chatu8-image-container");
        const spanContainer = collapseWrapper ? collapseWrapper.parentElement : imageContainer2?.parentElement;
        if (spanContainer) {
          createAndShowImage(spanContainer, newSrc, "Generated Image", button, change, isVideo, origUrl || "");
        }
      } else {
        if (img.tagName === "VIDEO" && newSrc.startsWith("data:")) {
          applyVideoSrc(img, newSrc, origUrl || "");
        } else {
          img.src = newSrc;
        }
      }
    }).catch((err) => {
      console.warn("[imagePreview] \u540C\u6B65\u56FE\u7247\u81F3\u804A\u5929\u754C\u9762\u51FA\u9519:", err);
    });
  }
  const closeButton = doc.createElement("div");
  closeButton.className = "st-chatu8-preview-close";
  closeButton.innerHTML = "&times;";
  closeButton.onclick = () => {
    if (images && images.length > 0 && (currentIndex >= 0 && currentIndex < images.length)) {
      syncPreviewSelectionToChat(currentIndex);
    }
    dialog.querySelectorAll("img").forEach((imageEl) => {
      if (imageEl.src && imageEl.src.startsWith("blob:")) {
        window.top["URL"].revokeObjectURL(imageEl.src);
      }
    });
    dialog.querySelectorAll("video").forEach((videoEl2) => {
      if (videoEl2.src && videoEl2.src.startsWith("blob:")) {
        window.top["URL"].revokeObjectURL(videoEl2.src);
      }
    });
    exitSystemFullscreen();
    restoreChatScroll();
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
  let largeMedia = null;
  const largeMediaWrapper = doc.createElement("div");
  largeMediaWrapper.className = "st-chatu8-preview-large-wrapper";
  largeMediaWrapper.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    `;
  const track = doc.createElement("div");
  track.className = "st-chatu8-preview-track";
  track.style.cssText = `
        display: flex;
        width: 300%;
        height: 100%;
        will-change: transform;
        transform: translate3d(-33.3333%, 0, 0);
    `;
  largeMediaWrapper.appendChild(track);
  imageContainer.appendChild(largeMediaWrapper);
  const imageCounter = doc.createElement("div");
  imageCounter.className = "st-chatu8-preview-counter";
  imageCounter.style.cssText = `
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
  imageCounter.textContent = "0 / 0";
  imageContainer.appendChild(imageCounter);
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
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        user-select: none;
    `;
  const prevButton = doc.createElement("div");
  prevButton.className = "st-chatu8-preview-nav prev";
  prevButton.innerHTML = "&#10094;";
  prevButton.style.cssText = navButtonStyle + "left: 10px;";
  prevButton.onmouseenter = () => {
    prevButton.style.transform = "translateY(-50%) scale(1.1)";
  };
  prevButton.onmouseleave = () => {
    prevButton.style.transform = "translateY(-50%)";
  };
  prevButton.onclick = () => {
    if (images.length <= 1) return;
    updateLargeImage((currentIndex - 1 + images.length) % images.length);
  };
  const nextButton = doc.createElement("div");
  nextButton.className = "st-chatu8-preview-nav next";
  nextButton.innerHTML = "&#10095;";
  nextButton.style.cssText = navButtonStyle + "right: 10px;";
  nextButton.onmouseenter = () => {
    nextButton.style.transform = "translateY(-50%) scale(1.1)";
  };
  nextButton.onmouseleave = () => {
    nextButton.style.transform = "translateY(-50%)";
  };
  nextButton.onclick = () => {
    if (images.length <= 1) return;
    updateLargeImage((currentIndex + 1) % images.length);
  };
  imageContainer.appendChild(prevButton);
  imageContainer.appendChild(nextButton);
  const TRANSITION = "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)";
  const CENTER = "translate3d(-33.3333%, 0, 0)";
  let slotWidth = 0;
  let dragging = false;
  let animating = false;
  let startX = 0;
  let startY = 0;
  let startT = 0;
  let dragDx = 0;
  let horizontal = null;
  function navigate(dir) {
    if (animating || images.length <= 1) return;
    animating = true;
    const n = images.length;
    const newIndex = (currentIndex + dir + n) % n;
    currentIndex = newIndex;
    track.style.transition = TRANSITION;
    track.style.transform = dir > 0 ? "translate3d(-66.6666%, 0, 0)" : "translate3d(0, 0, 0)";
    const onEnd = () => {
      track.removeEventListener("transitionend", onEnd);
      if (dir > 0) {
        const toRemove = track.children[0];
        const newNextSlot = buildSlot((newIndex + 1) % n, false);
        track.style.transition = "none";
        track.appendChild(newNextSlot);
        toRemove.remove();
        track.style.transform = CENTER;
        revokeSlotBlobUrls(toRemove);
      } else {
        const toRemove = track.children[track.children.length - 1];
        const newPrevSlot = buildSlot((newIndex - 1 + n) % n, false);
        track.style.transition = "none";
        track.insertBefore(newPrevSlot, track.firstChild);
        toRemove.remove();
        track.style.transform = CENTER;
        revokeSlotBlobUrls(toRemove);
      }
      currentIndex = newIndex;
      imageCounter.textContent = `${currentIndex + 1} / ${images.length}`;
      renderCurrentParams();
      const currentSlot = track.children[1];
      largeMedia = currentSlot.querySelector("img, video");
      if (typeof imageContainer.__resetZoom === "function") {
        imageContainer.__resetZoom();
      }
      if (largeMedia && largeMedia.tagName === "VIDEO") {
        if (largeMedia.getAttribute("preload") === "none") {
          largeMedia.setAttribute("preload", "metadata");
        }
        largeMedia.muted = false;
        largeMedia.defaultMuted = false;
        largeMedia.removeAttribute("muted");
      }
      const thumbnails = thumbnailContainer.querySelectorAll(".st-chatu8-preview-thumbnail");
      thumbnails.forEach((t, i) => t.classList.toggle("active", i === currentIndex));
      if (thumbnails[currentIndex]) {
        thumbnails[currentIndex].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
      syncPreviewSelectionToChat(currentIndex);
      animating = false;
    };
    track.addEventListener("transitionend", onEnd);
  }
  function revokeSlotBlobUrls(slotEl) {
    if (!slotEl) return;
    slotEl.querySelectorAll("img, video").forEach((el) => {
      if (el.src && el.src.startsWith("blob:") && el.src !== verifiedInitialSrc) {
        try {
          (window.top["URL"] || URL).revokeObjectURL(el.src);
        } catch (_) {
        }
      }
      if (el.tagName === "VIDEO") {
        try {
          el.pause();
          el.src = "";
          el.load();
        } catch (_) {
        }
      }
    });
  }
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 8;
  let zoomScale = 1;
  let zoomTx = 0;
  let zoomTy = 0;
  let panning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartTx = 0;
  let panStartTy = 0;
  let pinching = false;
  let pinchStartDist = 0;
  let pinchCenter = { x: 0, y: 0 };
  function applyZoomTransform(smooth = false) {
    if (!largeMedia || largeMedia.tagName === "VIDEO") return;
    largeMedia.style.transform = `translate3d(${zoomTx}px, ${zoomTy}px, 0) scale(${zoomScale})`;
    largeMedia.style.cursor = zoomScale > 1 ? panning ? "grabbing" : "grab" : "";
    largeMedia.style.transition = smooth ? "transform 0.18s ease-out" : "none";
  }
  function resetZoom() {
    zoomScale = 1;
    zoomTx = 0;
    zoomTy = 0;
    panning = false;
    pinching = false;
    if (largeMedia) {
      largeMedia.style.transform = "";
      largeMedia.style.cursor = "";
      largeMedia.style.transition = "";
    }
  }
  imageContainer.__resetZoom = resetZoom;
  imageContainer.addEventListener("touchstart", (e) => {
    if (animating || e.touches.length > 2) return;
    if (e.touches.length === 2) {
      dragging = false;
      panning = false;
      pinching = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist = Math.sqrt(dx * dx + dy * dy);
      pinchCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      if (e.cancelable) e.preventDefault();
      return;
    }
    if (zoomScale > 1) {
      panning = true;
      panStartX = e.touches[0].clientX;
      panStartY = e.touches[0].clientY;
      panStartTx = zoomTx;
      panStartTy = zoomTy;
      return;
    }
    if (images.length <= 1) return;
    dragging = true;
    horizontal = null;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startT = Date.now();
    dragDx = 0;
    slotWidth = imageContainer.offsetWidth || 1;
    track.style.transition = "none";
  }, { passive: false });
  imageContainer.addEventListener("touchmove", (e) => {
    if (pinching && e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (pinchStartDist > 0) {
        const scaleChange = dist / pinchStartDist;
        let newScale = zoomScale * scaleChange;
        newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
        if (newScale !== zoomScale && largeMedia && largeMedia.tagName !== "VIDEO") {
          const rect = largeMedia.getBoundingClientRect();
          const cx = pinchCenter.x - (rect.left + rect.width / 2);
          const cy = pinchCenter.y - (rect.top + rect.height / 2);
          const ratio = newScale / zoomScale;
          zoomTx = zoomTx + cx * (1 - ratio);
          zoomTy = zoomTy + cy * (1 - ratio);
          zoomScale = newScale;
          if (zoomScale <= 1.001) {
            zoomScale = 1;
            zoomTx = 0;
            zoomTy = 0;
          }
          applyZoomTransform();
        }
      }
      pinchStartDist = dist;
      pinchCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      return;
    }
    if (panning && e.touches.length === 1) {
      if (e.cancelable) e.preventDefault();
      zoomTx = panStartTx + (e.touches[0].clientX - panStartX);
      zoomTy = panStartTy + (e.touches[0].clientY - panStartY);
      applyZoomTransform();
      return;
    }
    if (!dragging) return;
    const t = e.touches[0];
    const rawDx = t.clientX - startX;
    const rawDy = t.clientY - startY;
    if (horizontal === null) {
      if (Math.abs(rawDx) < 6 && Math.abs(rawDy) < 6) return;
      horizontal = Math.abs(rawDx) > Math.abs(rawDy);
      if (!horizontal) {
        dragging = false;
        track.style.transition = TRANSITION;
        track.style.transform = CENTER;
        return;
      }
    }
    dragDx = rawDx;
    if (e.cancelable) e.preventDefault();
    const pct = -33.3333 + dragDx / slotWidth * 33.3333;
    track.style.transform = `translate3d(${pct}%, 0, 0)`;
  }, { passive: false });
  imageContainer.addEventListener("touchend", (e) => {
    if (pinching && e.touches.length < 2) {
      pinching = false;
      if (e.touches.length === 1) {
        panning = true;
        panStartX = e.touches[0].clientX;
        panStartY = e.touches[0].clientY;
        panStartTx = zoomTx;
        panStartTy = zoomTy;
      }
      return;
    }
    if (panning && e.touches.length === 0) {
      panning = false;
      return;
    }
    if (!dragging) return;
    dragging = false;
    if (!horizontal) return;
    const dt = Math.max(1, Date.now() - startT);
    const velocity = dragDx / dt;
    const distThreshold = slotWidth * 0.2;
    const velThreshold = 0.4;
    if (dragDx <= -distThreshold || velocity <= -velThreshold) {
      navigate(1);
    } else if (dragDx >= distThreshold || velocity >= velThreshold) {
      navigate(-1);
    } else {
      track.style.transition = TRANSITION;
      track.style.transform = CENTER;
    }
  });
  imageContainer.addEventListener("touchcancel", (e) => {
    pinching = false;
    panning = false;
    if (!dragging) return;
    dragging = false;
    track.style.transition = TRANSITION;
    track.style.transform = CENTER;
  });
  imageContainer.addEventListener("wheel", (e) => {
    if (!largeMedia || largeMedia.tagName === "VIDEO") return;
    e.preventDefault();
    const rect = largeMedia.getBoundingClientRect();
    const cx = e.clientX - (rect.left + rect.width / 2);
    const cy = e.clientY - (rect.top + rect.height / 2);
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    let newScale = zoomScale * factor;
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
    if (newScale === zoomScale) return;
    const ratio = newScale / zoomScale;
    zoomTx = zoomTx + cx * (1 - ratio);
    zoomTy = zoomTy + cy * (1 - ratio);
    zoomScale = newScale;
    if (zoomScale <= 1.001) {
      zoomScale = 1;
      zoomTx = 0;
      zoomTy = 0;
    }
    applyZoomTransform();
  }, { passive: false });
  imageContainer.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (zoomScale <= 1) return;
    if (e.target.closest(".st-chatu8-preview-nav")) return;
    e.preventDefault();
    panning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartTx = zoomTx;
    panStartTy = zoomTy;
    try {
      imageContainer.setPointerCapture(e.pointerId);
    } catch (_) {
    }
    applyZoomTransform();
  });
  imageContainer.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || !panning) return;
    zoomTx = panStartTx + (e.clientX - panStartX);
    zoomTy = panStartTy + (e.clientY - panStartY);
    applyZoomTransform();
  });
  const endPan = (e) => {
    if (e.pointerType !== "mouse" || !panning) return;
    panning = false;
    applyZoomTransform();
  };
  imageContainer.addEventListener("pointerup", endPan);
  imageContainer.addEventListener("pointercancel", endPan);
  imageContainer.addEventListener("dblclick", (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (e.target.closest(".st-chatu8-preview-nav")) return;
    if (!largeMedia) return;
    if (largeMedia.tagName === "VIDEO") {
      if (typeof largeMedia.paused === "boolean") {
        if (largeMedia.paused) {
          largeMedia.play().catch(() => {
          });
        } else {
          largeMedia.pause();
        }
      }
      return;
    }
    if (zoomScale > 1) {
      resetZoom();
    } else {
      const rect = largeMedia.getBoundingClientRect();
      const cx = e.clientX - (rect.left + rect.width / 2);
      const cy = e.clientY - (rect.top + rect.height / 2);
      zoomScale = 2;
      zoomTx = -cx;
      zoomTy = -cy;
      applyZoomTransform(true);
    }
  });
  const keyHandler = (e) => {
    if (!doc.body.contains(backdrop)) return;
    if (e.key === "ArrowLeft" && images.length > 1) {
      e.preventDefault();
      updateLargeImage((currentIndex - 1 + images.length) % images.length);
    } else if (e.key === "ArrowRight" && images.length > 1) {
      e.preventDefault();
      updateLargeImage((currentIndex + 1) % images.length);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (isImmersive) {
        toggleImmersive(false);
      } else if (isLandscape) {
        toggleLandscape(false);
      } else {
        closeButton.click();
      }
    }
  };
  doc.addEventListener("keydown", keyHandler);
  const mo = new MutationObserver(() => {
    if (!doc.body.contains(backdrop)) {
      doc.removeEventListener("keydown", keyHandler);
      mo.disconnect();
    }
  });
  mo.observe(doc.body, { childList: true });
  const thumbnailContainer = doc.createElement("div");
  thumbnailContainer.className = "st-chatu8-preview-thumbnail-container";
  let isImmersive = false;
  let isLandscape = false;
  const floatingTools = doc.createElement("div");
  floatingTools.className = "st-chatu8-preview-floating-tools";
  floatingTools.style.cssText = `
        position: absolute;
        top: 14px;
        right: 14px;
        display: none;
        gap: 10px;
        align-items: center;
        z-index: 99;
    `;
  const floatingRotateBtn = doc.createElement("div");
  floatingRotateBtn.innerHTML = '<i class="fa-solid fa-rotate"></i>';
  floatingRotateBtn.title = "\u65CB\u8F6C\u6A2A\u5C4F/\u7AD6\u5C4F";
  floatingRotateBtn.style.cssText = `
        width: 36px;
        height: 36px;
        background: rgba(0, 0, 0, 0.65);
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.25);
        user-select: none;
    `;
  floatingRotateBtn.onclick = (e) => {
    e.stopPropagation();
    toggleLandscape();
  };
  const exitImmersiveBtn = doc.createElement("div");
  exitImmersiveBtn.className = "st-chatu8-exit-immersive";
  exitImmersiveBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
  exitImmersiveBtn.title = "\u9000\u51FA\u6C89\u6D78\u5168\u5C4F";
  exitImmersiveBtn.style.cssText = `
        width: 36px;
        height: 36px;
        background: rgba(0, 0, 0, 0.65);
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.25);
        user-select: none;
    `;
  exitImmersiveBtn.onclick = (e) => {
    e.stopPropagation();
    toggleImmersive(false);
  };
  floatingTools.appendChild(floatingRotateBtn);
  floatingTools.appendChild(exitImmersiveBtn);
  imageContainer.appendChild(floatingTools);
  function applyLandscapeTransform() {
    if (isLandscape) {
      dialog.style.setProperty("width", "100dvh", "important");
      dialog.style.setProperty("height", "100vw", "important");
      dialog.style.setProperty("max-width", "none", "important");
      dialog.style.setProperty("max-height", "none", "important");
      dialog.style.setProperty("flex-shrink", "0", "important");
      dialog.style.setProperty("position", "relative", "important");
      dialog.style.setProperty("top", "", "");
      dialog.style.setProperty("left", "", "");
      dialog.style.setProperty("margin", "0 auto", "important");
      dialog.style.setProperty("transform", "rotate(90deg)", "important");
      dialog.style.setProperty("transform-origin", "center center", "important");
      if (landscapeButton) {
        landscapeButton.innerHTML = '<i class="fa-solid fa-mobile-screen-button"></i><span>\u7AD6\u5C4F\u6A21\u5F0F</span>';
      }
    } else {
      dialog.style.setProperty("width", "100vw", "");
      dialog.style.setProperty("height", "100dvh", "");
      dialog.style.setProperty("max-width", "100vw", "");
      dialog.style.setProperty("max-height", "100dvh", "");
      dialog.style.setProperty("flex-shrink", "", "");
      dialog.style.setProperty("position", "", "");
      dialog.style.setProperty("top", "", "");
      dialog.style.setProperty("left", "", "");
      dialog.style.setProperty("margin", "", "");
      dialog.style.setProperty("transform", "", "");
      dialog.style.setProperty("transform-origin", "", "");
      if (landscapeButton) {
        landscapeButton.innerHTML = '<i class="fa-solid fa-rotate"></i><span>\u6A2A\u5C4F\u5168\u5C4F</span>';
      }
    }
  }
  const onFullscreenChange = () => {
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      restoreChatScroll();
    }
  };
  doc.addEventListener("fullscreenchange", onFullscreenChange);
  doc.addEventListener("webkitfullscreenchange", onFullscreenChange);
  function toggleLandscape(force) {
    isLandscape = typeof force === "boolean" ? force : !isLandscape;
    applyLandscapeTransform();
    if (isLandscape || isImmersive) {
      requestSystemFullscreen();
    } else {
      exitSystemFullscreen();
    }
  }
  function toggleImmersive(force) {
    isImmersive = typeof force === "boolean" ? force : !isImmersive;
    if (isImmersive) {
      dialog.style.backgroundColor = "#000";
      dialog.style.padding = "0";
      closeButton.style.display = "none";
      imageCounter.style.display = "none";
      actionContainer.style.display = "none";
      prevButton.style.display = "none";
      nextButton.style.display = "none";
      if (paramsPanel.isVisible()) paramsPanel.toggle();
      floatingTools.style.display = "flex";
      requestSystemFullscreen();
    } else {
      dialog.style.backgroundColor = "#1a1a2e";
      dialog.style.padding = "5px";
      closeButton.style.display = "";
      imageCounter.style.display = "";
      actionContainer.style.display = "flex";
      floatingTools.style.display = "none";
      const showNav = images.length > 1;
      prevButton.style.display = showNav ? "flex" : "none";
      nextButton.style.display = showNav ? "flex" : "none";
      if (!isLandscape) {
        exitSystemFullscreen();
      }
    }
  }
  const actionContainer = doc.createElement("div");
  actionContainer.className = "st-chatu8-preview-actions";
  const landscapeButton = doc.createElement("button");
  landscapeButton.innerHTML = '<i class="fa-solid fa-rotate"></i><span>\u6A2A\u5C4F\u5168\u5C4F</span>';
  landscapeButton.className = "st-chatu8-preview-action-button";
  landscapeButton.title = "\u4E00\u952E\u65CB\u8F6C90\u5EA6\u6A2A\u5C4F\uFF08\u5145\u6EE1\u624B\u673A\u89C6\u53E3\uFF0C\u4E0D\u5F71\u54CD\u804A\u5929\u8BB0\u5F55\uFF09";
  landscapeButton.onclick = () => {
    toggleLandscape();
    if (!isImmersive) {
      toggleImmersive(true);
    }
  };
  const fullscreenButton = doc.createElement("button");
  fullscreenButton.innerHTML = '<i class="fa-solid fa-expand"></i><span>\u6C89\u6D78\u5168\u5C4F</span>';
  fullscreenButton.className = "st-chatu8-preview-action-button";
  fullscreenButton.title = "\u8FDB\u5165\u7EAF\u51C0\u6C89\u6D78\u5168\u5C4F\uFF08\u4E0D\u5F71\u54CD\u804A\u5929\u6EDA\u52A8\u6761\u4F4D\u7F6E\uFF09";
  fullscreenButton.onclick = () => toggleImmersive(true);
  const downloadButton = doc.createElement("button");
  downloadButton.innerHTML = '<i class="fa-solid fa-download"></i><span>\u4E0B\u8F7D\u5F53\u524D\u5A92\u4F53</span>';
  downloadButton.className = "st-chatu8-preview-action-button";
  downloadButton.title = "\u4E0B\u8F7D\u5F53\u524D\u5A92\u4F53";
  downloadButton.onclick = async () => {
    try {
      toastr.info("\u6B63\u5728\u51C6\u5907\u4E0B\u8F7D...");
      const blob = await getItemBlob(currentTag, currentIndex);
      if (blob) {
        const mediaInfo = mediaInfos[currentIndex];
        const ext = mediaInfo && mediaInfo.isVideo ? "mp4" : "png";
        const filename = `${currentTag.replace(/[^a-z0-9]/gi, "_").substring(0, 50)}-${currentIndex}.${ext}`;
        await downloadBlob(blob, filename);
      } else {
        toastr.error("\u65E0\u6CD5\u52A0\u8F7D\u56FE\u7247\u6570\u636E\u8FDB\u884C\u4E0B\u8F7D\u3002");
        console.error("Failed to get image blob for download.");
      }
    } catch (error) {
      toastr.error("\u4E0B\u8F7D\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF\u3002");
      console.error("Error during download:", error);
    }
  };
  const paramsPanel = createParamsPanel(doc);
  const paramsButton = doc.createElement("button");
  paramsButton.innerHTML = '<i class="fa-solid fa-circle-info"></i><span>\u67E5\u770B\u751F\u6210\u53C2\u6570</span>';
  paramsButton.className = "st-chatu8-preview-action-button";
  paramsButton.title = "\u67E5\u770B\u8FD9\u5F20\u56FE\u7684\u751F\u6210\u53C2\u6570";
  paramsButton.onclick = () => {
    const shown = paramsPanel.toggle();
    if (shown) {
      renderCurrentParams();
    }
  };
  const deleteButton = doc.createElement("button");
  deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i><span>\u5220\u9664\u5F53\u524D\u5A92\u4F53</span>';
  deleteButton.className = "st-chatu8-preview-action-button danger";
  deleteButton.title = "\u5220\u9664\u5F53\u524D\u5A92\u4F53";
  actionContainer.appendChild(landscapeButton);
  actionContainer.appendChild(fullscreenButton);
  actionContainer.appendChild(downloadButton);
  actionContainer.appendChild(paramsButton);
  actionContainer.appendChild(deleteButton);
  dialog.appendChild(closeButton);
  dialog.appendChild(imageContainer);
  dialog.appendChild(actionContainer);
  dialog.appendChild(paramsPanel.panel);
  backdrop.appendChild(dialog);
  doc.body.appendChild(backdrop);
  if (autoFullscreen) {
    toggleImmersive(true);
  }
  let images = [];
  let mediaInfos = [];
  let currentIndex = 0;
  function renderCurrentParams() {
    if (!paramsPanel.isVisible()) return;
    const info = mediaInfos[currentIndex] || {};
    paramsPanel.render(info.genParams, currentTag, info.date);
  }
  deleteButton.onclick = async () => {
    if (!window.top.confirm("\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u5F20\u56FE\u7247\u5417\uFF1F")) {
      return;
    }
    const tag = currentTag;
    const indexToDelete = currentIndex;
    await deleteImage(tag, indexToDelete);
    toastr.success("\u56FE\u7247\u5DF2\u5220\u9664");
    const md5 = CryptoJS.MD5(tag).toString();
    const merged = await dbs.getMergedAndSortedImages(md5);
    if (merged.images.length === 0) {
      const collapseWrapper = img.closest(".st-chatu8-collapse-wrapper");
      const parentContainer = img.closest(".st-chatu8-image-container");
      if (collapseWrapper) {
        collapseWrapper.remove();
      } else if (parentContainer) {
        parentContainer.remove();
      }
      if (button) {
        button.style.display = "inline-block";
        button.textContent = "\u751F\u6210\u56FE\u7247";
        button.disabled = false;
      }
      backdrop.remove();
      return;
    }
    mediaInfos = merged.images.map((entry) => ({
      isVideo: entry.isVideo || false,
      genParams: entry.genParams || null,
      date: entry.date || 0,
      originalUrl: entry.originalUrl || "",
      path: entry.path || "",
      thumbnail_path: entry.thumbnail_path || "",
      thumbnail_uuid: entry.thumbnail_uuid || "",
      source: entry.source || "",
      uuid: entry.uuid || ""
    }));
    images = new Array(merged.images.length).fill(null);
    let newIndex = currentIndex;
    if (newIndex >= images.length) {
      newIndex = Math.max(0, images.length - 1);
    }
    updateLargeImage(newIndex);
    (async () => {
      const thumbnailPromises = merged.images.map(async (imageEntry, index) => {
        const isVideo = imageEntry.isVideo || false;
        if (isVideo) {
          if (imageEntry.source === "server" && imageEntry.thumbnail_path) {
            try {
              const response = await fetch(imageEntry.thumbnail_path);
              if (response.ok) return await response.blob();
            } catch (_) {
            }
          }
          if (imageEntry.thumbnail_uuid) {
            try {
              const tb = await dbs.getImageThumbnailBlobByUUID(imageEntry.thumbnail_uuid);
              if (tb) return tb;
            } catch (_) {
            }
          }
          return null;
        }
        if (imageEntry.source === "server" && imageEntry.path) {
          return imageEntry.path;
        }
        return null;
      });
      const thumbnailResults = await Promise.all(thumbnailPromises);
      thumbnailContainer.innerHTML = "";
      thumbnailResults.forEach((res, index) => {
        const thumb = doc.createElement("img");
        if (res instanceof Blob) {
          thumb.src = (window.top["URL"] || URL).createObjectURL(res);
        } else if (typeof res === "string" && res) {
          thumb.src = res;
        } else {
          thumb.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiMxYTFhMmUiLz48cG9seWdvbiBwb2ludHM9IjUwLDQwIDUwLDg4IDkwLDY0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNSkiLz48dGV4dCB4PSI2NCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC41KSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VklERU88L3RleHQ+PC9zdmc+";
          thumb.alt = "Media";
        }
        thumb.className = "st-chatu8-preview-thumbnail";
        thumb.dataset.index = String(index);
        thumb.onclick = () => updateLargeImage(index);
        thumbnailContainer.appendChild(thumb);
      });
      const thumbs = thumbnailContainer.querySelectorAll(".st-chatu8-preview-thumbnail");
      thumbs.forEach((t, i) => t.classList.toggle("active", i === currentIndex));
    })();
    if (images.length > 0) {
      let newIndex2 = currentIndex;
      if (newIndex2 >= images.length) {
        newIndex2 = images.length - 1;
      }
      updateLargeImage(newIndex2);
      const [newImgSrc, change, , isVideoNew, origUrl] = await getItemImg(tag, newIndex2);
      if (newImgSrc) {
        const newIsVideo = isVideoNew || false;
        const originalIsVideo = img.tagName === "VIDEO";
        if (newIsVideo !== originalIsVideo) {
          const collapseWrapper = img.closest(".st-chatu8-collapse-wrapper");
          const imageContainer2 = img.closest(".st-chatu8-image-container");
          const spanContainer = collapseWrapper ? collapseWrapper.parentElement : imageContainer2?.parentElement;
          if (spanContainer) {
            createAndShowImage(spanContainer, newImgSrc, "Generated Image", button, change, newIsVideo, origUrl || "");
          }
        } else {
          if (img.tagName === "VIDEO" && newImgSrc.startsWith("data:")) {
            applyVideoSrc(img, newImgSrc, origUrl || "");
          } else {
            img.src = newImgSrc;
          }
        }
      }
    }
  };
  function buildSlot(index, isCurrent = false) {
    const slot = doc.createElement("div");
    slot.className = "st-chatu8-preview-slot";
    slot.style.cssText = `
            flex: 0 0 33.3333%;
            width: 33.3333%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-sizing: border-box;
        `;
    if (index === null || index < 0 || index >= mediaInfos.length) return slot;
    const isVideo = !!(mediaInfos[index] && mediaInfos[index].isVideo);
    const info = mediaInfos[index] || {};
    const blob = images[index];
    let blobUrl = "";
    if (blob) {
      try {
        blobUrl = (window.top["URL"] || URL).createObjectURL(blob);
      } catch (_) {
        blobUrl = URL.createObjectURL(blob);
      }
    }
    let el;
    if (isVideo) {
      el = doc.createElement("video");
      el.controls = true;
      el.loop = true;
      el.autoplay = false;
      el.playsInline = true;
      if (!isCurrent) {
        el.muted = true;
        el.defaultMuted = true;
        el.setAttribute("muted", "");
      } else {
        el.muted = false;
        el.defaultMuted = false;
        el.removeAttribute("muted");
      }
      el.setAttribute("controlslist", "nodownload");
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "true");
      el.setAttribute("x5-playsinline", "true");
      el.setAttribute("x5-video-player-type", "h5");
      el.setAttribute("preload", isCurrent ? "auto" : "none");
      el.onended = () => {
        if (el.loop) {
          el.currentTime = 0;
          el.play().catch(() => {
          });
        }
      };
      if (info.verifiedSrc) {
        el.src = info.verifiedSrc;
        el.dataset.blobUrl = info.verifiedSrc;
      } else if (info.path) {
        el.src = info.path;
      } else if (info.originalUrl) {
        el.src = info.originalUrl;
      } else if (blobUrl) {
        el.src = blobUrl;
        el.dataset.blobUrl = blobUrl;
      } else if (info.source === "db" && info.uuid) {
        dbs.storeReadOnly(info.uuid).then((imageData) => {
          if (imageData && imageData.data) {
            const rawBlob = new Blob([imageData.data], { type: "video/mp4" });
            fixMp4Faststart(rawBlob).then((fixedBlob) => {
              images[index] = fixedBlob;
              const bUrl = (window.top["URL"] || URL).createObjectURL(fixedBlob);
              el.dataset.blobUrl = bUrl;
              el.src = bUrl;
            }).catch(() => {
              const bUrl = (window.top["URL"] || URL).createObjectURL(rawBlob);
              el.dataset.blobUrl = bUrl;
              el.src = bUrl;
            });
          }
        }).catch((e) => console.warn("[imagePreview] \u8BFB\u53D6 DB \u89C6\u9891\u5931\u8D25:", e));
      } else {
        getItemImg(currentTag, index).then(([dataUrl, , , , origUrl]) => {
          if (dataUrl) {
            applyVideoSrc(el, dataUrl, origUrl || info.originalUrl || "");
          } else if (blobUrl) {
            el.src = blobUrl;
          }
        }).catch((e) => {
          console.warn("[imagePreview] \u83B7\u53D6\u5386\u53F2\u89C6\u9891\u6570\u636E\u5931\u8D25\uFF0C\u4F7F\u7528\u5907\u7528 Blob:", e);
          if (blobUrl) el.src = blobUrl;
        });
      }
      el.onerror = function() {
        if (!el.src || el.src === "about:blank" || el.src === location.href) return;
        const errCode = el.error ? el.error.code : "unknown";
        const errMsg = el.error ? el.error.message : "";
        console.warn(`[iframe] \u9884\u89C8\u89C6\u9891 (${el.src}) \u52A0\u8F7D\u5931\u8D25: code=${errCode}, msg=${errMsg}`);
        if (info.originalUrl && el.src !== info.originalUrl) {
          console.log("[iframe] \u5C1D\u8BD5\u56DE\u9000\u81F3\u8FDC\u7A0B\u6D41\u5A92\u4F53 URL:", info.originalUrl);
          el.src = info.originalUrl;
          try {
            el.load();
          } catch (_) {
          }
          return;
        }
        if (info.path && el.src !== info.path) {
          console.log("[iframe] \u5C1D\u8BD5\u56DE\u9000\u81F3\u670D\u52A1\u7AEF\u76F4\u94FE\u8DEF\u5F84:", info.path);
          el.src = info.path;
          try {
            el.load();
          } catch (_) {
          }
          return;
        }
        if (blobUrl && el.src !== blobUrl) {
          console.log("[iframe] \u5C1D\u8BD5\u56DE\u9000\u81F3\u672C\u5730 BlobURL:", blobUrl);
          el.src = blobUrl;
          try {
            el.load();
          } catch (_) {
          }
          return;
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
        const dlUrl = el.dataset.blobUrl || blobUrl || info.path || info.originalUrl || "";
        fallback.innerHTML = `
                    <div style="font-size: 64px; margin-bottom: 15px;">\u{1F3AC}</div>
                    <div style="margin-bottom: 15px; opacity: 0.8;">\u89C6\u9891\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u4E2D\u65E0\u6CD5\u76F4\u63A5\u89E3\u7801</div>
                    <a href="${dlUrl}" download="video.mp4"
                       style="background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 4px; color: #fff; text-decoration: none;"
                       onclick="event.stopPropagation()">
                        \u{1F4E5} \u4E0B\u8F7D\u89C6\u9891
                    </a>
                `;
        fallback.className = "st-chatu8-preview-large-image";
        fallback.dataset.index = String(index);
        if (el.parentNode) el.parentNode.replaceChild(fallback, el);
      };
    } else {
      el = doc.createElement("img");
      el.draggable = false;
      if (blobUrl) {
        el.src = blobUrl;
      } else if (info.path) {
        el.src = info.path;
      } else if (info.source === "db" && info.uuid) {
        dbs.storeReadOnly(info.uuid).then((imageData) => {
          if (imageData && imageData.data) {
            const imgBlob = new Blob([imageData.data], { type: "image/png" });
            images[index] = imgBlob;
            el.src = (window.top["URL"] || URL).createObjectURL(imgBlob);
          }
        }).catch((e) => console.warn("[imagePreview] \u8BFB\u53D6 DB \u56FE\u7247\u5931\u8D25:", e));
      } else {
        getItemImg(currentTag, index).then(([dataUrl]) => {
          if (dataUrl) el.src = dataUrl;
        }).catch((e) => console.warn("[imagePreview] \u83B7\u53D6\u56FE\u7247\u6570\u636E\u5931\u8D25:", e));
      }
    }
    el.className = "st-chatu8-preview-large-image";
    el.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 8px;
            user-select: none;
            -webkit-user-drag: none;
        `;
    el.dataset.index = String(index);
    slot.appendChild(el);
    if (isVideo) {
      const soundBtn = doc.createElement("button");
      soundBtn.className = "st-chatu8-video-sound-toggle";
      soundBtn.style.cssText = `
                position: absolute;
                bottom: 24px;
                right: 24px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.65);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: #fff;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 30;
                backdrop-filter: blur(8px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                transition: transform 0.2s ease, background 0.2s ease;
            `;
      const updateSoundBtn = () => {
        soundBtn.innerHTML = el.muted ? "\u{1F507}" : "\u{1F50A}";
        soundBtn.title = el.muted ? "\u70B9\u51FB\u5F00\u542F\u58F0\u97F3" : "\u70B9\u51FB\u9759\u97F3";
      };
      updateSoundBtn();
      soundBtn.onclick = (e) => {
        e.stopPropagation();
        el.muted = !el.muted;
        if (!el.muted) {
          el.removeAttribute("muted");
          if (el.paused) el.play().catch(() => {
          });
        } else {
          el.setAttribute("muted", "");
        }
        updateSoundBtn();
      };
      el.addEventListener("volumechange", updateSoundBtn);
      slot.appendChild(soundBtn);
    }
    return slot;
  }
  function revokeTrackBlobUrls() {
    track.querySelectorAll("img, video").forEach((el) => {
      if (el.src && el.src.startsWith("blob:") && el.src !== verifiedInitialSrc) {
        try {
          (window.top["URL"] || URL).revokeObjectURL(el.src);
        } catch (_) {
        }
      }
      if (el.tagName === "VIDEO") {
        try {
          el.pause();
          el.src = "";
          el.load();
        } catch (_) {
        }
      }
    });
  }
  let updateToken = 0;
  async function updateLargeImage(index) {
    if (!(index >= 0 && index < images.length)) return;
    const myToken = ++updateToken;
    track.querySelectorAll("video").forEach((v) => {
      try {
        if (!v.paused) v.pause();
      } catch (_) {
      }
    });
    currentIndex = index;
    const n = images.length;
    const prevIdx = n > 1 ? (index - 1 + n) % n : null;
    const nextIdx = n > 1 ? (index + 1) % n : null;
    const currentSlot = buildSlot(index, true);
    const centerMedia = currentSlot.querySelector("img, video");
    if (centerMedia && centerMedia.tagName === "IMG") {
      try {
        if (typeof centerMedia.decode === "function") {
          await centerMedia.decode();
        } else if (!centerMedia.complete) {
          await new Promise((resolve) => {
            centerMedia.onload = resolve;
            centerMedia.onerror = resolve;
          });
        }
      } catch (_) {
      }
    }
    if (myToken !== updateToken) {
      revokeSlotBlobUrls(currentSlot);
      return;
    }
    currentIndex = index;
    imageCounter.textContent = `${currentIndex + 1} / ${images.length}`;
    renderCurrentParams();
    const showNav = images.length > 1;
    prevButton.style.display = showNav ? "flex" : "none";
    nextButton.style.display = showNav ? "flex" : "none";
    revokeTrackBlobUrls();
    track.innerHTML = "";
    track.appendChild(buildSlot(prevIdx, false));
    track.appendChild(currentSlot);
    track.appendChild(buildSlot(nextIdx, false));
    track.style.transition = "none";
    track.style.transform = CENTER;
    void track.offsetWidth;
    largeMedia = centerMedia;
    if (typeof imageContainer.__resetZoom === "function") {
      imageContainer.__resetZoom();
    }
    if (largeMedia && largeMedia.tagName === "VIDEO") {
      if (largeMedia.getAttribute("preload") === "none") {
        largeMedia.setAttribute("preload", "metadata");
      }
    }
    const thumbnails = thumbnailContainer.querySelectorAll(".st-chatu8-preview-thumbnail");
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });
    if (thumbnails[index]) {
      thumbnails[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    syncPreviewSelectionToChat(index);
  }
  (async () => {
    const md5 = CryptoJS.MD5(currentTag).toString();
    const merged = await dbs.getMergedAndSortedImages(md5);
    if (merged.images.length === 0) {
      return;
    }
    mediaInfos = merged.images.map((entry, idx) => ({
      isVideo: entry.isVideo || false,
      genParams: entry.genParams || null,
      date: entry.date || 0,
      originalUrl: entry.originalUrl || "",
      path: entry.path || "",
      thumbnail_path: entry.thumbnail_path || "",
      thumbnail_uuid: entry.thumbnail_uuid || "",
      source: entry.source || "",
      uuid: entry.uuid || "",
      verifiedSrc: idx === merged.currentIndex && verifiedInitialSrc ? verifiedInitialSrc : ""
    }));
    images = new Array(merged.images.length).fill(null);
    const targetIndex = merged.currentIndex >= 0 && merged.currentIndex < merged.images.length ? merged.currentIndex : 0;
    updateLargeImage(targetIndex);
    (async () => {
      const thumbnailPromises = merged.images.map(async (imageEntry, index) => {
        const isVideo = imageEntry.isVideo || false;
        if (isVideo) {
          if (imageEntry.source === "server" && imageEntry.thumbnail_path) {
            try {
              const response = await fetch(imageEntry.thumbnail_path);
              if (response.ok) return await response.blob();
            } catch (_) {
            }
          }
          if (imageEntry.thumbnail_uuid) {
            try {
              const tb = await dbs.getImageThumbnailBlobByUUID(imageEntry.thumbnail_uuid);
              if (tb) return tb;
            } catch (_) {
            }
          }
          return null;
        }
        if (imageEntry.source === "server" && imageEntry.path) {
          return imageEntry.path;
        }
        return null;
      });
      const thumbnailResults = await Promise.all(thumbnailPromises);
      thumbnailContainer.innerHTML = "";
      thumbnailResults.forEach((res, index) => {
        const thumb = doc.createElement("img");
        if (res instanceof Blob) {
          thumb.src = (window.top["URL"] || URL).createObjectURL(res);
        } else if (typeof res === "string" && res) {
          thumb.src = res;
        } else {
          thumb.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiMxYTFhMmUiLz48cG9seWdvbiBwb2ludHM9IjUwLDQwIDUwLDg4IDkwLDY0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNSkiLz48dGV4dCB4PSI2NCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC41KSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VklERU88L3RleHQ+PC9zdmc+";
          thumb.alt = "Media";
        }
        thumb.className = "st-chatu8-preview-thumbnail";
        thumb.dataset.index = String(index);
        thumb.onclick = () => updateLargeImage(index);
        thumbnailContainer.appendChild(thumb);
      });
      const thumbs = thumbnailContainer.querySelectorAll(".st-chatu8-preview-thumbnail");
      thumbs.forEach((t, i) => t.classList.toggle("active", i === currentIndex));
    })();
  })();
}

export { chatProcessor_exports, showImagePreview };
