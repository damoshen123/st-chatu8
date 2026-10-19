// 还原自打包产物 — 原始模块: utils/settings/fabBubble.js
import { eventSource } from "../../../../../../script.js";
import { EventType } from "../config.js";
import { getGlobalVideoPlayer } from "../ui_common.js";
import { TaskStatus, TaskType, taskQueue } from "../taskQueue.js";
import { subscribeGenerationStatus } from "../generation_status.js";

var currentlyGeneratingCount, hideTimer, inFlightRequests, isInitialized;

hideTimer = null;

isInitialized = false;

inFlightRequests = /* @__PURE__ */ new Set();

currentlyGeneratingCount = 0;

function clearInFlightRequests() {
  if (inFlightRequests.size > 0) {
    inFlightRequests.clear();
  }
}

function cleanupLegacyFabDOM() {
  const fab = document.getElementById("st-chatu8-fab");
  if (!fab) return;
  const selectors = [
    "#st-chatu8-fab-bubble-wrap",
    ".st-chatu8-fab-outer-ring",
    ".st-chatu8-fab-glow-aura",
    ".st-chatu8-fab-ripple-container"
  ];
  selectors.forEach((sel) => {
    const el = fab.querySelector(sel);
    if (el) el.remove();
  });
}

function updateBubbleDirection() {
}

function evaluateActiveState() {
  const allTasks = taskQueue.getAllTasks();
  const runningTasks = allTasks.filter((t) => t.status === TaskStatus.RUNNING && t.type !== TaskType.AUTO_CLICK && t.type !== TaskType.LLM);
  const queuedTasks = allTasks.filter((t) => t.status === TaskStatus.QUEUED && t.type !== TaskType.AUTO_CLICK && t.type !== TaskType.LLM);
  const queueCount = runningTasks.length;
  const pendingTotal = runningTasks.length + queuedTasks.length;
  if (pendingTotal === 0) {
    if (inFlightRequests.size > 0) {
      inFlightRequests.clear();
    }
    if (currentlyGeneratingCount === 0) {
      return {
        isActive: false,
        totalCount: 0,
        hasVideo: false,
        hasImage: false
      };
    }
  }
  let hasVideo = false;
  let hasImage = false;
  for (const t of runningTasks) {
    const type = t.type || "";
    const name = t.name || "";
    if (type === TaskType.COMFYUI_IMG2VID || type === TaskType.COMFYUI_REF2VID || type === TaskType.RUNNINGHUB_IMG2VID || type === TaskType.RUNNINGHUB_REF2VID || /video|视频/i.test(name) || /video|视频/i.test(type)) {
      hasVideo = true;
    } else {
      hasImage = true;
    }
  }
  const inFlightCount = inFlightRequests.size;
  if (inFlightCount > 0 && queueCount === 0) {
    hasImage = true;
  }
  const totalCount = Math.max(queueCount, inFlightCount, currentlyGeneratingCount);
  return {
    isActive: totalCount > 0,
    totalCount,
    hasVideo,
    hasImage
  };
}

function refreshBubbleState() {
  const fab = document.getElementById("st-chatu8-fab");
  if (!fab) return;
  cleanupLegacyFabDOM();
  const state3 = evaluateActiveState();
  const isVideoMode = fab.classList.contains("st-chatu8-fab-video-mode");
  const videoPlayer = getGlobalVideoPlayer();
  if (isVideoMode) {
    fab.classList.remove("st-chatu8-fab-generating");
    fab.classList.remove("is-video-generating");
    if (videoPlayer) {
      const playerState = videoPlayer.getState ? videoPlayer.getState() : null;
      const isPlayingTalk = playerState && playerState.isPlayingTalk;
      if (state3.isActive) {
        if (!isPlayingTalk && videoPlayer.playThinkingVideo) {
          videoPlayer.playThinkingVideo();
        }
      } else {
        const isLlmLoading = fab.dataset.isLoading === "true";
        if (!isLlmLoading && !isPlayingTalk && videoPlayer.stopThinkingVideo) {
          videoPlayer.stopThinkingVideo();
        }
      }
    }
    return;
  }
  if (state3.isActive) {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    fab.classList.add("st-chatu8-fab-generating");
    if (state3.hasVideo && !state3.hasImage) {
      fab.classList.add("is-video-generating");
    } else {
      fab.classList.remove("is-video-generating");
    }
  } else {
    if (!fab.classList.contains("st-chatu8-fab-generating")) return;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    fab.classList.remove("st-chatu8-fab-generating");
    fab.classList.remove("is-video-generating");
  }
}

function initFabBubble() {
  if (isInitialized) return;
  isInitialized = true;
  cleanupLegacyFabDOM();
  taskQueue.subscribe(() => {
    refreshBubbleState();
  });
  subscribeGenerationStatus((generatingSet) => {
    currentlyGeneratingCount = generatingSet && generatingSet.size || 0;
    refreshBubbleState();
  });
  eventSource.on(EventType.GENERATE_IMAGE_REQUEST, (data) => {
    if (data && data.id) {
      inFlightRequests.add(String(data.id));
      refreshBubbleState();
    }
  });
  eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, (data) => {
    if (data && data.id) {
      inFlightRequests.delete(String(data.id));
      inFlightRequests.delete(data.id);
    }
    refreshBubbleState();
  });
}

export { clearInFlightRequests, evaluateActiveState, initFabBubble, refreshBubbleState, updateBubbleDirection };
