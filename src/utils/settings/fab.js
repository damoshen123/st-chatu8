// 还原自打包产物 — 原始模块: utils/settings/fab.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extensionName } from "../config.js";
import { applyFabSettings, getGlobalVideoController, getGlobalVideoPlayer, showSettingsPanel } from "../ui_common.js";
import { evaluateActiveState, initFabBubble, updateBubbleDirection } from "./fabBubble.js";
import "./fabVideoPlayerWebGL.js"; // init_fabVideoPlayerWebGL
import "./fabVideoController.js"; // init_fabVideoController

var fabGlobalLoadingCount;

fabGlobalLoadingCount = 0;

function ensureFabCenterInViewport() {
  const fab = document.getElementById("st-chatu8-fab");
  if (!fab) return;
  const settings3 = extension_settings[extensionName];
  if (!settings3 || String(settings3.enable_chatu8_fab) !== "true") return;
  const rect = fab.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const tolerance = 2;
  const fullyInside = rect.left >= -tolerance && rect.top >= -tolerance && rect.right <= screenWidth + tolerance && rect.bottom <= screenHeight + tolerance;
  if (fullyInside) return;
  console.warn("[FAB] \u68C0\u6D4B\u5230 FAB \u90E8\u5206\u8D85\u51FA\u89C6\u53E3\uFF0C\u91CD\u7F6E\u5230\u5C4F\u5E55\u4E2D\u5FC3", {
    rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
    viewport: { w: screenWidth, h: screenHeight }
  });
  const newLeft = Math.max(0, (screenWidth - rect.width) / 2);
  const newTop = Math.max(0, (screenHeight - rect.height) / 2);
  fab.style.left = `${newLeft}px`;
  fab.style.top = `${newTop}px`;
  if (!settings3.chatu8_fab_position) {
    settings3.chatu8_fab_position = { desktop: {}, mobile: {} };
  }
  const isMobile3 = window.innerWidth <= 768;
  const target = isMobile3 ? settings3.chatu8_fab_position.mobile : settings3.chatu8_fab_position.desktop;
  if (target) {
    target.top = fab.style.top;
    target.left = fab.style.left;
    saveSettingsDebounced();
  }
}

function initFab() {
  let fab = document.getElementById("st-chatu8-fab");
  if (!fab) return;
  let isDragging = false;
  let hasMoved = false;
  let offsetX, offsetY;
  let longPressTimeout = null;
  let isLongPress2 = false;
  let startX = 0, startY = 0;
  let startFabLeft = 0, startFabTop = 0;
  let cachedFabWidth = 50, cachedFabHeight = 50;
  let cachedScreenWidth = window.innerWidth, cachedScreenHeight = window.innerHeight;
  let currentDeltaX = 0, currentDeltaY = 0;
  let rafId = null;
  const isPointInFabRect = (clientX, clientY) => {
    const rect = fab.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  };
  const isFabOverlappingDialog = () => {
    const aiDialog = document.getElementById("st-chatu8-ai-dialog");
    if (!aiDialog || !aiDialog.classList.contains("active")) {
      return false;
    }
    const fabRect = fab.getBoundingClientRect();
    const dialogRect = aiDialog.getBoundingClientRect();
    return !(fabRect.right < dialogRect.left || fabRect.left > dialogRect.right || fabRect.bottom < dialogRect.top || fabRect.top > dialogRect.bottom);
  };
  const isVideoMode = () => {
    return fab.classList.contains("st-chatu8-fab-video-mode");
  };
  const isEventFromSettingsPanel = (e) => {
    const target = e.target;
    if (!target || typeof target.closest !== "function") return false;
    return !!target.closest("#ch-settings-modal, #st-chatu8-settings");
  };
  const dragStart = (e) => {
    if (isFabOverlappingDialog()) {
      return;
    }
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    const videoPlayer = getGlobalVideoPlayer();
    if (videoPlayer) {
      if (!isPointInFabRect(clientX, clientY)) {
        return;
      }
      const isHit = videoPlayer.hitTest(clientX, clientY);
      if (!isHit) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    }
    const rect = fab.getBoundingClientRect();
    isDragging = true;
    hasMoved = false;
    isLongPress2 = false;
    fab.style.cursor = "grabbing";
    fab.classList.add("st-chatu8-fab-dragging");
    startX = clientX;
    startY = clientY;
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    startFabLeft = rect.left;
    startFabTop = rect.top;
    cachedFabWidth = rect.width || 50;
    cachedFabHeight = rect.height || 50;
    cachedScreenWidth = window.innerWidth;
    cachedScreenHeight = window.innerHeight;
    currentDeltaX = 0;
    currentDeltaY = 0;
    longPressTimeout = setTimeout(() => {
      if (!hasMoved) {
        isLongPress2 = true;
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        const triggerBtn = document.getElementById("st-chatu8-ai-trigger");
        if (triggerBtn) {
          triggerBtn.click();
        } else {
          const dialog = document.getElementById("st-chatu8-ai-dialog");
          if (dialog && !dialog.classList.contains("active")) {
            const dialogWidth = dialog.offsetWidth;
            const dialogHeight = dialog.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const centerLeft = (viewportWidth - dialogWidth) / 2;
            const centerTop = (viewportHeight - dialogHeight) / 2;
            dialog.style.left = Math.max(0, centerLeft) + "px";
            dialog.style.top = Math.max(0, centerTop) + "px";
            dialog.classList.add("active");
            setTimeout(() => {
              const inputArea = document.getElementById("st-chatu8-ai-input");
              if (inputArea) inputArea.focus();
            }, 300);
          }
        }
      }
    }, 500);
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("touchmove", dragMove, { passive: false });
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchend", dragEnd);
  };
  const dragMove = (e) => {
    if (!isDragging) return;
    if (e.type === "touchmove") e.preventDefault();
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    const rawDeltaX = clientX - startX;
    const rawDeltaY = clientY - startY;
    if (!hasMoved) {
      const moveDistance = Math.hypot(rawDeltaX, rawDeltaY);
      if (moveDistance > 5) {
        hasMoved = true;
        if (longPressTimeout) {
          clearTimeout(longPressTimeout);
          longPressTimeout = null;
        }
        const videoController = getGlobalVideoController();
        if (videoController) {
          videoController.onDragStart();
        }
      }
    }
    if (hasMoved) {
      let targetLeft = startFabLeft + rawDeltaX;
      let targetTop = startFabTop + rawDeltaY;
      const minVisibleSize = 20;
      const maxLeft = cachedScreenWidth - minVisibleSize;
      const maxTop = cachedScreenHeight - minVisibleSize;
      const minLeft = -(cachedFabWidth - minVisibleSize);
      const minTop = -(cachedFabHeight - minVisibleSize);
      if (targetLeft < minLeft) targetLeft = minLeft;
      if (targetTop < minTop) targetTop = minTop;
      if (targetLeft > maxLeft) targetLeft = maxLeft;
      if (targetTop > maxTop) targetTop = maxTop;
      currentDeltaX = targetLeft - startFabLeft;
      currentDeltaY = targetTop - startFabTop;
      if (!rafId) {
        rafId = requestAnimationFrame(updateFabPosition);
      }
    }
  };
  const updateFabPosition = () => {
    fab.style.transform = `translate3d(${currentDeltaX}px, ${currentDeltaY}px, 0)`;
    rafId = null;
  };
  const dragEnd = (e) => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      longPressTimeout = null;
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (!isDragging) return;
    isDragging = false;
    fab.style.cursor = "grab";
    fab.classList.remove("st-chatu8-fab-dragging");
    if (hasMoved) {
      const finalLeft = Math.round(startFabLeft + currentDeltaX);
      const finalTop = Math.round(startFabTop + currentDeltaY);
      fab.style.transform = "";
      fab.style.left = `${finalLeft}px`;
      fab.style.top = `${finalTop}px`;
      const videoController = getGlobalVideoController();
      if (videoController) {
        videoController.onDragEnd();
      }
      updateBubbleDirection();
      const settings3 = extension_settings[extensionName];
      if (settings3) {
        if (!settings3.chatu8_fab_position) {
          settings3.chatu8_fab_position = { desktop: {}, mobile: {} };
        }
        const isMobile3 = window.innerWidth <= 768;
        const target = isMobile3 ? settings3.chatu8_fab_position.mobile : settings3.chatu8_fab_position.desktop;
        if (target) {
          target.top = `${finalTop}px`;
          target.left = `${finalLeft}px`;
          saveSettingsDebounced();
        }
      }
    } else {
      fab.style.transform = "";
    }
    if (isVideoMode() && !hasMoved && !isLongPress2) {
      const clientX = e.type === "touchend" ? e.changedTouches?.[0]?.clientX ?? startX : e.clientX;
      const clientY = e.type === "touchend" ? e.changedTouches?.[0]?.clientY ?? startY : e.clientY;
      handleFabClick(clientX, clientY);
    }
    document.removeEventListener("mousemove", dragMove);
    document.removeEventListener("touchmove", dragMove);
    document.removeEventListener("mouseup", dragEnd);
    document.removeEventListener("touchend", dragEnd);
  };
  const handleFabClick = (clientX, clientY) => {
    const videoPlayer = getGlobalVideoPlayer();
    if (videoPlayer) {
      const isHit = videoPlayer.hitTest(clientX, clientY);
      if (!isHit) {
        return;
      }
      const rect = fab.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const headHeight = rect.height / 3;
      if (relativeY <= headHeight) {
        if (videoPlayer.playHeadPatVideo) {
          videoPlayer.playHeadPatVideo();
          return;
        }
      }
    }
    if (window.showChatuSettingsPanel) {
      window.showChatuSettingsPanel();
    } else {
      showSettingsPanel();
    }
  };
  fab.addEventListener("mousedown", dragStart);
  fab.addEventListener("touchstart", dragStart, { passive: false });
  fab.addEventListener("click", (e) => {
    if (isFabOverlappingDialog()) {
      return;
    }
    if (isVideoMode()) return;
    if (!hasMoved && !isLongPress2) {
      handleFabClick(e.clientX, e.clientY);
    }
  });
  document.addEventListener("mousedown", (e) => {
    if (!isVideoMode()) return;
    if (isEventFromSettingsPanel(e)) {
      return;
    }
    if (isFabOverlappingDialog()) {
      return;
    }
    dragStart(e);
  });
  document.addEventListener("touchstart", (e) => {
    if (!isVideoMode()) return;
    if (isEventFromSettingsPanel(e)) {
      return;
    }
    if (isFabOverlappingDialog()) {
      return;
    }
    dragStart(e);
  }, { passive: false });
  let cursorUpdateRafId = null;
  let lastCursorX = 0;
  let lastCursorY = 0;
  document.addEventListener("mousemove", (e) => {
    const videoPlayer = getGlobalVideoPlayer();
    if (isDragging || !videoPlayer || !isVideoMode()) return;
    if (isFabOverlappingDialog()) {
      if (document.body.style.cursor === "grab" || document.body.style.cursor === "grabbing") {
        document.body.style.cursor = "";
      }
      return;
    }
    if (!isPointInFabRect(e.clientX, e.clientY)) {
      return;
    }
    lastCursorX = e.clientX;
    lastCursorY = e.clientY;
    if (!cursorUpdateRafId) {
      cursorUpdateRafId = requestAnimationFrame(() => {
        document.body.style.cursor = videoPlayer.hitTest(lastCursorX, lastCursorY) ? "grab" : "";
        cursorUpdateRafId = null;
      });
    }
  });
  document.addEventListener("mousemove", (e) => {
    if (!isVideoMode()) return;
    if (!isPointInFabRect(e.clientX, e.clientY)) {
      if (document.body.style.cursor === "grab" || document.body.style.cursor === "grabbing") {
        document.body.style.cursor = "";
      }
    }
  });
  fab.addEventListener("mousemove", (e) => {
    const videoPlayer = getGlobalVideoPlayer();
    if (isDragging || !videoPlayer || isVideoMode()) return;
    if (isFabOverlappingDialog()) {
      return;
    }
    lastCursorX = e.clientX;
    lastCursorY = e.clientY;
    if (!cursorUpdateRafId) {
      cursorUpdateRafId = requestAnimationFrame(() => {
        fab.style.cursor = videoPlayer.hitTest(lastCursorX, lastCursorY) ? "grab" : "default";
        cursorUpdateRafId = null;
      });
    }
  });
  applyFabSettings();
  setTimeout(() => {
    ensureFabCenterInViewport();
  }, 50);
  let resizeTimeout = null;
  let lastIsMobile = window.innerWidth <= 768;
  window.addEventListener("resize", () => {
    if (String(extension_settings[extensionName].enable_chatu8_fab) === "true") {
      const rect = fab.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const currentIsMobile = screenWidth <= 768;
      let newLeft = rect.left;
      let newTop = rect.top;
      const minVisibleSize = 20;
      const maxLeft = screenWidth - minVisibleSize;
      const maxTop = screenHeight - minVisibleSize;
      const minLeft = -(rect.width - minVisibleSize);
      const minTop = -(rect.height - minVisibleSize);
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop > maxTop) newTop = maxTop;
      if (newLeft < minLeft) newLeft = minLeft;
      if (newTop < minTop) newTop = minTop;
      fab.style.left = `${newLeft}px`;
      fab.style.top = `${newTop}px`;
      if (currentIsMobile !== lastIsMobile) {
        lastIsMobile = currentIsMobile;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          applyFabSettings();
          const settingsPanel = document.getElementById("st-chatu8-settings-panel");
          if (settingsPanel && settingsPanel.classList.contains("active")) {
            const settings3 = extension_settings[extensionName];
            if (typeof settings3.chatu8_fab_size === "object") {
              const newSize = currentIsMobile ? settings3.chatu8_fab_size.mobile ?? 40 : settings3.chatu8_fab_size.desktop ?? 50;
              const sizeSlider = document.getElementById("chatu8_fab_size");
              const sizeInput = document.getElementById("chatu8_fab_size_value");
              if (sizeSlider) sizeSlider.value = newSize;
              if (sizeInput) sizeInput.value = newSize;
              const videoPlayer = getGlobalVideoPlayer();
              if (videoPlayer) {
                videoPlayer.updateSize(newSize);
              }
            }
          }
        }, 300);
      }
    }
  });
  window.cleanupFabVideo = () => {
    const videoController = getGlobalVideoController();
    const videoPlayer = getGlobalVideoPlayer();
    if (videoController) {
      videoController.cleanup();
    }
    if (videoPlayer) {
      videoPlayer.destroy();
    }
  };
  initFabBubble();
}

function isFabVideoModeEnabled() {
  const fab = document.getElementById("st-chatu8-fab");
  if (fab && fab.classList.contains("st-chatu8-fab-video-mode")) {
    return true;
  }
  const settings3 = extension_settings[extensionName];
  return settings3?.enable_chatu8_fab_video === true || settings3?.enable_chatu8_fab_video === "true";
}

function startFabLoading() {
  const fab = document.getElementById("st-chatu8-fab");
  if (!fab) return;
  fabGlobalLoadingCount++;
  fab.dataset.isLoading = "true";
  const isVideoMode = isFabVideoModeEnabled();
  const videoPlayer = getGlobalVideoPlayer();
  if (isVideoMode) {
    fab.classList.remove("st-chatu8-fab-loading");
    if (videoPlayer) {
      const state3 = videoPlayer.getState();
      if (state3 && state3.isPlayingTalk) {
        return;
      }
      if (videoPlayer.playThinkingVideo) {
        videoPlayer.playThinkingVideo();
      }
    }
  } else {
    fab.classList.add("st-chatu8-fab-loading");
  }
}

function stopFabLoading(force = false) {
  const fab = document.getElementById("st-chatu8-fab");
  if (!fab) return;
  if (force) {
    fabGlobalLoadingCount = 0;
  } else {
    fabGlobalLoadingCount = Math.max(0, fabGlobalLoadingCount - 1);
  }
  if (fabGlobalLoadingCount > 0) {
    return;
  }
  fab.dataset.isLoading = "false";
  const isVideoMode = isFabVideoModeEnabled();
  const videoPlayer = getGlobalVideoPlayer();
  fab.classList.remove("st-chatu8-fab-loading");
  if (isVideoMode && videoPlayer) {
    const state3 = videoPlayer.getState();
    if (state3 && state3.isPlayingTalk) {
      return;
    }
    const activeTasks = evaluateActiveState();
    if (activeTasks && activeTasks.isActive) {
      return;
    }
    if (videoPlayer.stopThinkingVideo) {
      videoPlayer.stopThinkingVideo();
    }
  }
}

export { initFab, startFabLoading, stopFabLoading };
