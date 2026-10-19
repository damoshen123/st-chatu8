// 还原自打包产物 — 原始模块: utils/generation_status.js
import { normalizePromptTag } from "./utils.js";

var currentlyGenerating, statusListeners, taskQueue_exports;

currentlyGenerating = /* @__PURE__ */ new Set();

statusListeners = [];


function notifyListeners() {
  for (const listener of statusListeners) {
    try {
      listener(currentlyGenerating);
    } catch (e) {
      console.error("[generation_status] listener error:", e);
    }
  }
}

function subscribeGenerationStatus(callback) {
  if (typeof callback === "function") {
    statusListeners.push(callback);
    try {
      callback(currentlyGenerating);
    } catch (e) {
      console.error("[generation_status] initial callback error:", e);
    }
  }
  return () => {
    const index = statusListeners.indexOf(callback);
    if (index !== -1) {
      statusListeners.splice(index, 1);
    }
  };
}

function isGenerating(prompt2) {
  if (!prompt2) return false;
  const norm = normalizePromptTag(prompt2);
  return currentlyGenerating.has(norm) || currentlyGenerating.has(prompt2);
}

function startGenerating(prompt2) {
  if (!prompt2) return;
  const norm = normalizePromptTag(prompt2);
  currentlyGenerating.add(norm);
  if (norm !== prompt2) {
    currentlyGenerating.add(prompt2);
  }
  notifyListeners();
}

function stopGenerating(prompt2) {
  if (!prompt2) return;
  const norm = normalizePromptTag(prompt2);
  currentlyGenerating.delete(norm);
  currentlyGenerating.delete(prompt2);
  notifyListeners();
}

function clearAllGenerating() {
  if (currentlyGenerating.size > 0) {
    currentlyGenerating.clear();
    notifyListeners();
  }
}

export { clearAllGenerating, isGenerating, startGenerating, stopGenerating, subscribeGenerationStatus, taskQueue_exports };
