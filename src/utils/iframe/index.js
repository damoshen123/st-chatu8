// 还原自打包产物 — 原始模块: utils/iframe/index.js
import { eventSource, event_types } from "../../../../../../../script.js";
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { applyGenerateButtonStyle } from "../settings/buttonstyle.js";
import { applyImageFrameStyle } from "../settings/framestyle.js";
import { setTriggerGeneration } from "./dialogs.js";
import { setGorkTriggerGeneration } from "./gorkVideo.js";
import { debounce } from "./utils.js";
import { showImagePreview } from "./imagePreview.js";
import { setShowImagePreview, triggerGeneration } from "./generation.js";
import { clearHandledAutoClickCache, findAndReplaceInElement } from "./placeholder.js";
import { processIframes, processMesTextElements } from "./chatProcessor.js";
import { isThemeDark } from "../settings/theme.js";

var PLUGIN_MANAGED_SELECTOR, autoClickTimer, debouncedProcessVisible, iframeObserverState, mainDocumentObserver;

autoClickTimer = null;

window.zidongdianji = false;

window.zidongdianjiStartTime = 0;

iframeObserverState = /* @__PURE__ */ new Map();

mainDocumentObserver = null;

PLUGIN_MANAGED_SELECTOR = ".image-tag-button, .st-chatu8-image-button, .st-chatu8-image-span, .st-chatu8-image-container, .st-chatu8-collapse-wrapper";

setTriggerGeneration(triggerGeneration);

setGorkTriggerGeneration(triggerGeneration);

setShowImagePreview(showImagePreview);

debouncedProcessVisible = debounce(() => {
      processMesTextElements();
      processIframes();
    }, 200);

eventSource.on(event_types.GENERATION_ENDED, async (data) => {
      activateAutoClickWindow();
      processLatestMessagesNow();
      setTimeout(processLatestMessagesNow, 80);
    });

eventSource.on(event_types.MESSAGE_SWIPED, async (data) => {
      if (String(extension_settings[extensionName]?.zidongdianji2) !== "true") {
        deactivateAutoClickWindow();
      }
      setTimeout(() => {
        processMesTextElements();
        processIframes();
      }, 60);
    });

eventSource.on("js_generation_ended", async (data) => {
      activateAutoClickWindow();
      processLatestMessagesNow();
      setTimeout(processLatestMessagesNow, 80);
    });

eventSource.on(event_types.MESSAGE_EDITED, async (data) => {
      if (String(extension_settings[extensionName]?.zidongdianji2) !== "true") {
        deactivateAutoClickWindow();
      }
    });

eventSource.on(event_types.CHAT_CHANGED, async (data) => {
      deactivateAutoClickWindow();
      clearHandledAutoClickCache();
    });



function deactivateAutoClickWindow() {
  if (autoClickTimer) {
    clearTimeout(autoClickTimer);
    autoClickTimer = null;
  }
  window.zidongdianji = false;
  window.zidongdianjiStartTime = 0;
}

function activateAutoClickWindow() {
  if (String(extension_settings[extensionName]?.zidongdianji) !== "true") {
    deactivateAutoClickWindow();
    return;
  }
  window.zidongdianji = true;
  window.zidongdianjiStartTime = Date.now();
  if (autoClickTimer) {
    clearTimeout(autoClickTimer);
  }
  if (String(extension_settings[extensionName]?.zidongdianji2) !== "true") {
    autoClickTimer = setTimeout(() => {
      deactivateAutoClickWindow();
    }, 1e4);
  }
}

function isPluginManagedNode(node) {
  if (!node) {
    return false;
  }
  let targetNode = node;
  if (targetNode.nodeType === Node.TEXT_NODE) {
    targetNode = targetNode.parentElement;
  }
  if (!targetNode || targetNode.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }
  return Boolean(targetNode.matches?.(PLUGIN_MANAGED_SELECTOR) || targetNode.closest?.(PLUGIN_MANAGED_SELECTOR));
}

function shouldIgnoreIframeMutations(mutations) {
  if (!Array.isArray(mutations) || mutations.length === 0) {
    return true;
  }
  return mutations.every((mutation) => {
    if (mutation.type === "characterData" || mutation.type === "attributes") {
      return isPluginManagedNode(mutation.target);
    }
    const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
    if (changedNodes.length === 0) {
      return isPluginManagedNode(mutation.target);
    }
    return changedNodes.every(isPluginManagedNode) && isPluginManagedNode(mutation.target);
  });
}

function cleanupDetachedIframeObservers() {
  for (const [iframe, state3] of iframeObserverState.entries()) {
    if (!document.contains(iframe)) {
      state3.observer?.disconnect();
      iframeObserverState.delete(iframe);
    }
  }
}

function observeIframeContent(iframe) {
  if (!iframe) {
    return;
  }
  const attachObserver = () => {
    try {
      const iframeDoc = iframe.contentDocument;
      const iframeBody = iframeDoc?.body;
      if (!iframeBody) {
        return;
      }
      const existingState = iframeObserverState.get(iframe);
      if (existingState?.doc === iframeDoc) {
        return;
      }
      existingState?.observer?.disconnect();
      const scheduleReprocess = debounce(() => {
        if (!document.contains(iframe)) {
          return;
        }
        try {
          const latestDoc = iframe.contentDocument;
          if (!latestDoc?.body) {
            return;
          }
          processIframes();
        } catch (error) {
          console.warn("[iframe] Failed to re-process observed iframe:", error?.message || error);
        }
      }, 180);
      const observer = new MutationObserver((mutations) => {
        if (shouldIgnoreIframeMutations(mutations)) {
          return;
        }
        scheduleReprocess();
      });
      observer.observe(iframeBody, {
        childList: true,
        subtree: true,
        characterData: true
      });
      iframeObserverState.set(iframe, {
        observer,
        doc: iframeDoc
      });
    } catch (error) {
      console.warn("[iframe] Failed to observe iframe content:", error?.message || error);
    }
  };
  try {
    const iframeDoc = iframe.contentDocument;
    if (iframeDoc?.readyState === "complete" && iframeDoc.body) {
      attachObserver();
      return;
    }
  } catch (error) {
    console.warn("[iframe] Failed to access iframe during observer setup:", error?.message || error);
  }
  iframe.addEventListener("load", attachObserver, { once: true });
}

function observeAllIframes() {
  cleanupDetachedIframeObservers();
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => observeIframeContent(iframe));
}

function initializeMainDocumentObserver() {
  if (mainDocumentObserver) {
    return;
  }
  const startObserving = () => {
    if (mainDocumentObserver) {
      return;
    }
    const root = document.body || document.documentElement;
    if (!root) {
      return;
    }
    mainDocumentObserver = new MutationObserver((mutations) => {
      const hasIframeMutation = mutations.some((mutation) => {
        const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
        return changedNodes.some((node) => {
          if (!node || node.nodeType !== Node.ELEMENT_NODE) {
            return false;
          }
          return node.tagName === "IFRAME" || Boolean(node.querySelector?.("iframe"));
        });
      });
      if (!hasIframeMutation) {
        return;
      }
      observeAllIframes();
      debouncedProcessVisible();
    });
    mainDocumentObserver.observe(root, {
      childList: true,
      subtree: true
    });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserving, { once: true });
  } else {
    startObserving();
  }
}

function processLatestMessagesNow() {
  processMesTextElements();
  const mesElements = document.getElementsByClassName("mes_text");
  if (mesElements.length > 0) {
    findAndReplaceInElement(mesElements[mesElements.length - 1]);
  }
  processIframes();
}

function processAllImagePlaceholders() {
  processMesTextElements();
  processIframes();
  observeAllIframes();
}

function processImagePlaceholdersForElement(targetElement, taskId = null) {
  if (!targetElement) {
    return Promise.resolve();
  }
  return findAndReplaceInElement(targetElement, "Generated Image", taskId);
}

function initializeImageProcessing() {
  if (extension_settings[extensionName]) {
    const currentTheme = extension_settings[extensionName].themes?.[extension_settings[extensionName].theme_id] || {};
    applyGenerateButtonStyle(extension_settings[extensionName].generate_btn_style || "\u9ED8\u8BA4", isThemeDark(currentTheme));
    applyImageFrameStyle(extension_settings[extensionName].image_frame_style || "\u65E0\u6837\u5F0F", isThemeDark(currentTheme));
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", processAllImagePlaceholders);
  } else {
    processAllImagePlaceholders();
  }
  initializeMainDocumentObserver();
}

export { deactivateAutoClickWindow, initializeImageProcessing };
