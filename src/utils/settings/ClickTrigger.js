// 还原自打包产物 — 原始模块: utils/settings/ClickTrigger.js
import { extension_settings } from "../../../../../../extensions.js";
import { getContext } from "../../../../../../st-context.js";
import { extensionName } from "../config.js";
import { deleteImagesForElement, lockAllTagsForElement, unlockAllTagsForElement } from "../imageInserter.js";
import { debugBranch, debugContent, debugElement, debugLog, debugStartSession, debugTimer } from "../debugLogger.js";
import { handleCharacterDesignRequest } from "../characterGen.js";
import { handlePromptRequest, handleVisualMatPrepRequest } from "../promptReq.js";
import { setFloorTargetElement } from "../assistant/assistantFloorMessage.js";
import { handlePersonaGenFromClick } from "./knowledgeBase/personaGen.js";
import { collectAndSetBodyText } from "./videoAssetGenUi.js";
import { __set_boundElements, __set_clickPollingTimer, __set_currentBubble, __set_currentOverlay, boundElements, clickPollingTimer, currentBubble, currentOverlay } from "./regex.js";

var BINDIED_ATTR, GRID_SIZE, LONG_PRESS_THRESHOLD, MOBILE_MOVE_THRESHOLD, MOVE_THRESHOLD, activeDoc, activeElement, boundEventHandlers, gestureCanvas, gestureCtx, gesturePoints, gesturePollingTimer, gestureStartTime, isDrawing, isLongPress, isPending, isRecording, longPressTimer, pendingEvent, recordingResolve, shouldBlockContextMenu, startPoint;

var gesturePollingTimer = null;

var boundEventHandlers = /* @__PURE__ */ new Map();

var BINDIED_ATTR = "data-gesture-bindied";

var isDrawing = false;

var gesturePoints = [];

var gestureStartTime = 0;

var activeDoc = null;

var activeElement = null;

var isPending = false;

var pendingEvent = null;

var startPoint = null;

var MOVE_THRESHOLD = 10;

var MOBILE_MOVE_THRESHOLD = 25;

var longPressTimer = null;

var isLongPress = false;

var LONG_PRESS_THRESHOLD = 450;

var GRID_SIZE = 10;

var isRecording = false;

var recordingResolve = null;

var shouldBlockContextMenu = false;

var gestureCanvas = null;

var gestureCtx = null;
function collectElementInfo(element, label) {
  if (!element) return { label, element: null };
  const mesParent = element.closest?.(".mes");
  const mesId = element.getAttribute?.("mesid") || mesParent?.getAttribute?.("mesid") || "(\u65E0)";
  const charName = mesParent?.getAttribute?.("ch_name") || mesParent?.querySelector?.(".name_text")?.textContent?.trim() || "(\u672A\u77E5\u89D2\u8272)";
  const isUser = mesParent?.getAttribute?.("is_user") === "true" || mesParent?.classList?.contains?.("user_mes") || false;
  const rect = element.getBoundingClientRect?.() || {};
  const textContent = element.textContent || "";
  const textPreview = textContent.substring(0, 80) + (textContent.length > 80 ? "..." : "");
  return {
    label: label || "\u5143\u7D20",
    tagName: element.tagName,
    className: element.className || "(\u65E0)",
    id: element.id || "(\u65E0)",
    mesId,
    \u89D2\u8272\u540D: charName,
    \u662F\u5426\u7528\u6237\u6D88\u606F: isUser,
    \u662F\u5426mes_text: element.classList?.contains?.("mes_text") || false,
    \u5728iframe\u4E2D: element.ownerDocument !== document,
    \u5C3A\u5BF8: {
      width: Math.round(rect.width || 0),
      height: Math.round(rect.height || 0),
      top: Math.round(rect.top || 0),
      left: Math.round(rect.left || 0)
    },
    \u6587\u672C\u957F\u5EA6: textContent.length,
    \u6587\u672C\u9884\u89C8: textPreview,
    \u5B50\u5143\u7D20\u6570\u91CF: element.children?.length || 0,
    \u542B\u56FE\u7247\u6570\u91CF: element.querySelectorAll?.("img")?.length || 0,
    \u542Bst_chatu8\u56FE\u7247: element.querySelectorAll?.(".st-chatu8-image-container, [data-st-chatu8]")?.length || 0
  };
}

function logElementDetails(prefix, element, label, extra) {
  const info = collectElementInfo(element, label);
  console.groupCollapsed(`${prefix} \u{1F4CB} ${label || "\u5143\u7D20\u8BE6\u60C5"} [mesId=${info.mesId}, \u89D2\u8272=${info.\u89D2\u8272\u540D}]`);
  console.log("\u57FA\u7840\u4FE1\u606F:", {
    tagName: info.tagName,
    className: info.className,
    id: info.id,
    mesId: info.mesId
  });
  console.log("\u6D88\u606F\u4FE1\u606F:", {
    \u89D2\u8272\u540D: info.\u89D2\u8272\u540D,
    \u662F\u5426\u7528\u6237\u6D88\u606F: info.\u662F\u5426\u7528\u6237\u6D88\u606F,
    \u662F\u5426mes_text: info.\u662F\u5426mes_text,
    \u5728iframe\u4E2D: info.\u5728iframe\u4E2D
  });
  console.log("\u5E03\u5C40\u4FE1\u606F:", info.\u5C3A\u5BF8);
  console.log("\u5185\u5BB9\u4FE1\u606F:", {
    \u6587\u672C\u957F\u5EA6: info.\u6587\u672C\u957F\u5EA6,
    \u5B50\u5143\u7D20\u6570\u91CF: info.\u5B50\u5143\u7D20\u6570\u91CF,
    \u542B\u56FE\u7247\u6570\u91CF: info.\u542B\u56FE\u7247\u6570\u91CF,
    \u542Bst_chatu8\u56FE\u7247: info.\u542Bst_chatu8\u56FE\u7247,
    \u6587\u672C\u9884\u89C8: info.\u6587\u672C\u9884\u89C8
  });
  if (extra) {
    console.log("\u9644\u52A0\u4FE1\u606F:", extra);
  }
  console.log("DOM \u5143\u7D20\u5F15\u7528:", element);
  console.groupEnd();
}

function isMobile2() {
  const touchSupported = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const screenSmall = window.innerWidth < 768;
  return touchSupported && screenSmall;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function getEventPoint2(e, doc = document) {
  let x, y;
  if (e.touches && e.touches.length > 0) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    x = e.changedTouches[0].clientX;
    y = e.changedTouches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }
  if (doc.defaultView && doc.defaultView.frameElement) {
    const iframe = doc.defaultView.frameElement;
    const iframeRect = iframe.getBoundingClientRect();
    x += iframeRect.left;
    y += iframeRect.top;
    console.log("[\u70B9\u51FB\u89E6\u53D1] iframe \u5750\u6807\u8F6C\u6362:", {
      \u539F\u59CBX: x - iframeRect.left,
      \u539F\u59CBY: y - iframeRect.top,
      iframe\u504F\u79FB: { left: iframeRect.left, top: iframeRect.top },
      \u8F6C\u6362\u540EX: x,
      \u8F6C\u6362\u540EY: y
    });
  }
  return { x, y };
}

function closeActionBubble() {
  if (currentOverlay) {
    currentOverlay.classList.add("closing");
    if (currentBubble) {
      currentBubble.style.opacity = "0";
      currentBubble.style.transform = "scale(0.85)";
    }
    setTimeout(() => {
      if (currentOverlay && currentOverlay.parentNode) {
        currentOverlay.remove();
      }
      if (currentBubble && currentBubble.parentNode) {
        currentBubble.remove();
      }
      __set_currentOverlay(null);
      __set_currentBubble(null);
    }, 150);
  }
}

function showClickActionBubble(point, targetElement) {
  closeActionBubble();
  const overlay2 = document.createElement("div");
  overlay2.className = "st-chatu8-click-trigger-overlay";
  __set_currentOverlay(overlay2);
  const bubble = document.createElement("div");
  bubble.className = "st-chatu8-click-trigger-bubble";
  __set_currentBubble(bubble);
  const title = document.createElement("div");
  title.className = "st-chatu8-click-trigger-title";
  title.textContent = "\u9009\u62E9\u64CD\u4F5C";
  bubble.appendChild(title);
  const allActions = {
    imageGen: {
      text: "\u56FE\u7247\u751F\u6210",
      icon: "fa-solid fa-image",
      description: "\u751F\u6210\u5F53\u524D\u573A\u666F\u76F8\u5173\u7684\u56FE\u7247",
      action: () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u56FE\u7247\u751F\u6210");
        handlePromptRequest(targetElement, "gesture1");
      }
    },
    visualPrep: {
      text: "\u89C6\u6750\u51C6\u5907",
      icon: "fa-solid fa-photo-film",
      description: "\u751F\u6210\u573A\u666F\u5BF9\u5E94\u7684\u89C6\u6750",
      action: () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u89C6\u6750\u51C6\u5907");
        handleVisualMatPrepRequest(targetElement, "gesture1");
      }
    },
    charDesign: {
      text: "\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1",
      icon: "fa-solid fa-user-pen",
      description: "\u751F\u6210\u89D2\u8272\u6216\u670D\u88C5\u8BBE\u8BA1",
      action: () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1");
        handleCharacterDesignRequest(targetElement);
      }
    },
    personaGen: {
      text: "\u4EBA\u8BBE\u751F\u6210",
      icon: "fa-solid fa-id-card",
      description: "\u6839\u636E\u5F53\u524D\u89D2\u8272\u5361\u751F\u6210\u4EBA\u8BBE\u6570\u636E",
      action: () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u4EBA\u8BBE\u751F\u6210");
        handlePersonaGenFromClick(targetElement);
      }
    },
    deleteUnlocked: {
      text: "\u5220\u9664\u975E\u9501\u5B9A\u56FE\u7247",
      icon: "fa-solid fa-trash",
      description: "\u5220\u9664\u5F53\u524D\u5143\u7D20\u7684\u56FE\u7247",
      action: async () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u5220\u9664\u56FE\u7247");
        const result = await deleteImagesForElement(targetElement);
        if (result?.lockedCount > 0) {
          toastr.info(`\u5DF2\u8DF3\u8FC7 ${result.lockedCount} \u4E2A\u9501\u5B9A\u7684\u56FE\u7247`);
        }
      }
    },
    lockAllTags: {
      text: "\u9501\u5B9A\u6240\u6709Tag",
      icon: "fa-solid fa-lock",
      description: "\u9501\u5B9A\u5F53\u524D\u5143\u7D20\u7684\u6240\u6709\u56FE\u7247\u6807\u7B7E",
      action: async () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u9501\u5B9A\u6240\u6709Tag");
        const result = await lockAllTagsForElement(targetElement);
        if (result.success) {
          toastr.success(result.message);
        } else {
          toastr.warning(result.message);
        }
      }
    },
    unlockAllTags: {
      text: "\u89E3\u9501\u6240\u6709Tag",
      icon: "fa-solid fa-unlock",
      description: "\u89E3\u9501\u5F53\u524D\u5143\u7D20\u7684\u6240\u6709\u56FE\u7247\u6807\u7B7E",
      action: async () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u89E3\u9501\u6240\u6709Tag");
        const result = await unlockAllTagsForElement(targetElement);
        if (result.success) {
          toastr.success(result.message);
        } else {
          toastr.warning(result.message);
        }
      }
    },
    collectFloorInfo: {
      text: "\u6536\u96C6\u697C\u5C42\u4FE1\u606F",
      icon: "fa-solid fa-layer-group",
      description: "\u6536\u96C6\u5F53\u524D\u9152\u9986\u697C\u5C42\u6D88\u606F\u7528\u4E8EAI\u63D0\u793A\u8BCD",
      action: () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u6536\u96C6\u697C\u5C42\u4FE1\u606F");
        const result = setFloorTargetElement(targetElement);
        if (result.success) {
          toastr.success(result.message + "\uFF0C\u53EF\u5728AI\u52A9\u624B\u4E2D\u4F7F\u7528 {{\u697C\u5C42\u4FE1\u606F}} \u6A21\u677F\u53D8\u91CF");
        } else if (result.isDuplicate) {
          toastr.info(result.message);
        } else {
          toastr.warning(result.message);
        }
      }
    },
    collectBodyText: {
      text: "\u6B63\u6587\u6536\u96C6",
      icon: "fa-solid fa-file-lines",
      description: "\u6536\u96C6\u5F53\u524D\u697C\u5C42\u6B63\u6587\u5E76\u5168\u8986\u76D6\u586B\u5165\u89C6\u9891\u8D44\u4EA7\u9875\u9762",
      action: async () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u89E6\u53D1\u6B63\u6587\u6536\u96C6");
        await collectAndSetBodyText(targetElement);
      }
    },
    cancelBtn: {
      text: "\u53D6\u6D88",
      icon: "fa-solid fa-xmark",
      isCancel: true,
      action: () => {
        console.log("[\u70B9\u51FB\u89E6\u53D1] \u7528\u6237\u53D6\u6D88");
      }
    }
  };
  const renderPage = (pageNumber) => {
    const existingButtons = bubble.querySelectorAll(".st-chatu8-click-trigger-button");
    existingButtons.forEach((btn) => btn.remove());
    let buttonsToRender = [];
    if (pageNumber === 1) {
      buttonsToRender = [
        allActions.imageGen,
        allActions.visualPrep,
        allActions.charDesign,
        {
          text: "\u4E0B\u4E00\u9875",
          icon: "fa-solid fa-arrow-right",
          keepOpen: true,
          action: () => renderPage(2)
        },
        allActions.cancelBtn
      ];
    } else if (pageNumber === 2) {
      buttonsToRender = [
        allActions.personaGen,
        allActions.deleteUnlocked,
        allActions.lockAllTags,
        allActions.unlockAllTags,
        allActions.collectFloorInfo,
        allActions.collectBodyText,
        {
          text: "\u4E0A\u4E00\u9875",
          icon: "fa-solid fa-arrow-left",
          keepOpen: true,
          action: () => renderPage(1)
        },
        allActions.cancelBtn
      ];
    }
    buttonsToRender.filter(Boolean).forEach((btnInfo) => {
      const button = document.createElement("button");
      button.className = "st-chatu8-click-trigger-button";
      if (btnInfo.isCancel) {
        button.classList.add("cancel");
      }
      button.innerHTML = `<i class="${btnInfo.icon}"></i><span>${btnInfo.text}</span>`;
      button.onclick = () => {
        if (btnInfo.text !== "\u4E0B\u4E00\u9875" && btnInfo.text !== "\u4E0A\u4E00\u9875") {
          console.group(`[\u70B9\u51FB\u89E6\u53D1] \u{1F3AF} \u7528\u6237\u9009\u62E9\u64CD\u4F5C: ${btnInfo.text}`);
          debugLog("ClickTrigger.buttonClick", `\u7528\u6237\u9009\u62E9\u64CD\u4F5C: ${btnInfo.text}`, {
            \u64CD\u4F5C: btnInfo.text,
            \u529F\u80FD\u8BF4\u660E: btnInfo.description || "\u65E0\u63CF\u8FF0"
          });
          logElementDetails("[\u70B9\u51FB\u89E6\u53D1][\u64CD\u4F5C]", targetElement, `\u64CD\u4F5C\u76EE\u6807\u5143\u7D20 (${btnInfo.text})`, {
            \u64CD\u4F5C: btnInfo.text,
            \u529F\u80FD\u8BF4\u660E: btnInfo.description || "\u65E0\u63CF\u8FF0",
            \u662F\u5426\u53D6\u6D88: !!btnInfo.isCancel
          });
          console.groupEnd();
        }
        if (!btnInfo.keepOpen) {
          closeActionBubble();
        }
        if (btnInfo.action) {
          btnInfo.action();
        }
        if (window.getSelection) {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            selection.removeAllRanges();
          }
        }
      };
      bubble.appendChild(button);
    });
  };
  renderPage(1);
  overlay2.appendChild(bubble);
  document.body.appendChild(overlay2);
  bubble.style.position = "absolute";
  bubble.style.margin = "0";
  bubble.style.transform = "none";
  bubble.style.left = "-9999px";
  bubble.style.top = "-9999px";
  bubble.style.visibility = "hidden";
  requestAnimationFrame(() => {
    const bubbleRect = bubble.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 10;
    let targetX = point.x;
    let targetY = point.y;
    console.log("[\u70B9\u51FB\u89E6\u53D1] \u5B9A\u4F4D\u4FE1\u606F(Overlay\u5185\u90E8):", {
      targetX,
      targetY,
      viewportWidth,
      viewportHeight,
      bubbleWidth: bubbleRect.width,
      bubbleHeight: bubbleRect.height
    });
    const isValidCoord = Number.isFinite(targetX) && Number.isFinite(targetY) && targetX >= 0 && targetX <= viewportWidth && targetY >= 0 && targetY <= viewportHeight;
    let newLeft, newTop;
    if (isValidCoord) {
      newLeft = targetX + 5;
      newTop = targetY + 5;
      if (newLeft + bubbleRect.width > viewportWidth - margin) {
        newLeft = targetX - bubbleRect.width - 5;
      }
      if (newTop + bubbleRect.height > viewportHeight - margin) {
        newTop = targetY - bubbleRect.height - 5;
      }
      if (newLeft < margin) {
        newLeft = margin;
      }
      if (newTop < margin) {
        newTop = margin;
      }
    } else {
      console.warn("[\u70B9\u51FB\u89E6\u53D1] \u5750\u6807\u5F02\u5E38\uFF0C\u4F7F\u7528\u5C45\u4E2D\u5B9A\u4F4D", { targetX, targetY });
      newLeft = (viewportWidth - bubbleRect.width) / 2;
      newTop = (viewportHeight - bubbleRect.height) / 2;
    }
    console.log("[\u70B9\u51FB\u89E6\u53D1] \u6700\u7EC8\u5B9A\u4F4D(Overlay\u5185\u90E8):", { newLeft, newTop });
    bubble.style.left = `${newLeft}px`;
    bubble.style.top = `${newTop}px`;
    bubble.style.visibility = "visible";
  });
  const escHandler = (evt) => {
    if (evt.key === "Escape") {
      closeActionBubble();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

function isExcludedTriggerElement(target) {
  if (!target || !(target instanceof Element)) return false;
  const excludedTags = /* @__PURE__ */ new Set(["IMG", "BUTTON", "SELECT", "INPUT", "TEXTAREA", "A", "VIDEO", "AUDIO", "CANVAS", "SVG"]);
  if (excludedTags.has(target.tagName?.toUpperCase())) {
    return true;
  }
  const mediaSelector = [
    ".st-chatu8-image-container",
    ".st-chatu8-video-top-overlay",
    ".st-chatu8-video-bottom-overlay",
    ".st-chatu8-mini-player-controls",
    ".st-chatu8-big-play-btn",
    ".st-chatu8-video-notice",
    ".st-chatu8-collapse-wrapper",
    ".st-chatu8-collapse-header",
    ".st-chatu8-collapse-content",
    ".st-chatu8-preview-backdrop",
    ".st-chatu8-preview-dialog",
    ".st-chatu8-preview-image-container",
    "[data-st-chatu8]",
    "[data-request-id]",
    "[data-is-video]",
    "[data-video]"
  ].join(",");
  if (target.closest?.(mediaSelector)) {
    return true;
  }
  return false;
}

function handleDoubleClick(e, targetElement, clickPoint) {
  debugStartSession("\u70B9\u51FB\u89E6\u53D1\u56FE\u7247\u751F\u6210");
  const timer = debugTimer("ClickTrigger.handleDoubleClick", "\u5904\u7406\u53CC\u51FB\u4E8B\u4EF6 - \u663E\u793A\u64CD\u4F5C\u9009\u62E9\u5F39\u7A97");
  debugLog("ClickTrigger.handleDoubleClick", "\u53CC\u51FB\u4E8B\u4EF6\u89E6\u53D1", {
    \u5750\u6807: clickPoint,
    \u4E8B\u4EF6\u7C7B\u578B: e.type,
    \u529F\u80FD\u8BF4\u660E: "\u68C0\u6D4B\u53CC\u51FB\u4E8B\u4EF6\uFF0C\u9A8C\u8BC1\u6761\u4EF6\u540E\u663E\u793A\u64CD\u4F5C\u9009\u62E9\u5F39\u7A97"
  });
  debugElement("ClickTrigger.handleDoubleClick", "\u89E6\u53D1\u5143\u7D20", targetElement);
  debugElement("ClickTrigger.handleDoubleClick", "\u5B9E\u9645\u70B9\u51FB\u5143\u7D20", e.target);
  if (currentOverlay) {
    debugBranch("handleDoubleClick", "\u5F39\u7A97\u5DF2\u5B58\u5728 - \u5FFD\u7565\u4E8B\u4EF6", true, {
      \u6761\u4EF6: "currentOverlay \u662F\u5426\u5B58\u5728",
      \u503C: !!currentOverlay
    });
    console.log("[\u70B9\u51FB\u89E6\u53D1] \u5F39\u7A97\u5DF2\u663E\u793A\uFF0C\u5FFD\u7565\u53CC\u51FB");
    logElementDetails("[\u70B9\u51FB\u89E6\u53D1][\u5FFD\u7565]", targetElement, "\u88AB\u5FFD\u7565\u7684\u89E6\u53D1\u5143\u7D20(\u5F39\u7A97\u5DF2\u5B58\u5728)", { \u5750\u6807: clickPoint });
    timer.end("\u5DF2\u5FFD\u7565 - \u5F39\u7A97\u5DF2\u5B58\u5728");
    return;
  }
  const clickTriggerEnabled = extension_settings[extensionName]?.clickTriggerEnabled;
  if (!clickTriggerEnabled) {
    debugBranch("handleDoubleClick", "\u70B9\u51FB\u89E6\u53D1\u529F\u80FD\u672A\u542F\u7528", true, {
      \u6761\u4EF6: "clickTriggerEnabled",
      \u8BBE\u7F6E\u503C: clickTriggerEnabled,
      \u63D2\u4EF6\u540D: extensionName
    });
    console.log("[\u70B9\u51FB\u89E6\u53D1] \u529F\u80FD\u672A\u542F\u7528");
    logElementDetails("[\u70B9\u51FB\u89E6\u53D1][\u672A\u542F\u7528]", targetElement, "\u88AB\u5FFD\u7565\u7684\u89E6\u53D1\u5143\u7D20(\u529F\u80FD\u672A\u542F\u7528)", { \u5750\u6807: clickPoint });
    timer.end("\u5DF2\u5FFD\u7565 - \u529F\u80FD\u672A\u542F\u7528");
    return;
  }
  debugBranch("handleDoubleClick", "\u70B9\u51FB\u89E6\u53D1\u529F\u80FD\u5DF2\u542F\u7528", true, {
    \u6761\u4EF6: "clickTriggerEnabled",
    \u8BBE\u7F6E\u503C: clickTriggerEnabled
  });
  const excludedTags = /* @__PURE__ */ new Set(["IMG", "BUTTON", "SELECT", "INPUT", "TEXTAREA", "A", "VIDEO", "AUDIO", "CANVAS", "SVG"]);
  const targetTagName = e.target.tagName?.toUpperCase();
  if (excludedTags.has(targetTagName)) {
    debugBranch("handleDoubleClick", `\u6392\u9664\u5143\u7D20\u7C7B\u578B: ${targetTagName}`, true, {
      \u6761\u4EF6: "\u70B9\u51FB\u5143\u7D20\u662F\u5426\u5728\u6392\u9664\u5217\u8868\u4E2D",
      \u6392\u9664\u5217\u8868: Array.from(excludedTags),
      \u5B9E\u9645\u5143\u7D20: targetTagName
    });
    console.log(`[\u70B9\u51FB\u89E6\u53D1] \u70B9\u51FB\u7684\u662F ${targetTagName} \u5143\u7D20\uFF0C\u5FFD\u7565`);
    logElementDetails("[\u70B9\u51FB\u89E6\u53D1][\u6392\u9664]", e.target, `\u88AB\u6392\u9664\u7684\u70B9\u51FB\u5143\u7D20 (${targetTagName})`, { \u5750\u6807: clickPoint });
    logElementDetails("[\u70B9\u51FB\u89E6\u53D1][\u6392\u9664]", targetElement, "\u539F\u59CB\u76EE\u6807\u5143\u7D20 (mes_text)");
    timer.end(`\u5DF2\u5FFD\u7565 - \u6392\u9664\u7684\u5143\u7D20\u7C7B\u578B: ${targetTagName}`);
    return;
  }
  const elementText = targetElement?.textContent || "";
  debugContent("ClickTrigger.handleDoubleClick", "\u5143\u7D20\u6587\u672C\u9884\u89C8", elementText, 150);
  debugLog("ClickTrigger.handleDoubleClick", "\u6761\u4EF6\u9A8C\u8BC1\u901A\u8FC7\uFF0C\u663E\u793A\u64CD\u4F5C\u5F39\u7A97");
  console.group("[\u70B9\u51FB\u89E6\u53D1] \u2705 \u53CC\u51FB\u89E6\u53D1\u6210\u529F");
  console.log("\u5750\u6807:", clickPoint, "| \u4E8B\u4EF6\u7C7B\u578B:", e.type);
  logElementDetails("[\u70B9\u51FB\u89E6\u53D1]", targetElement, "\u5C06\u5C55\u793A\u5F39\u7A97\u7684\u76EE\u6807\u5143\u7D20");
  const stContext = getContext();
  console.log("[\u70B9\u51FB\u89E6\u53D1] SillyTavern \u4E0A\u4E0B\u6587:", {
    chatLength: stContext?.chat?.length,
    characterName: stContext?.name2,
    userName: stContext?.name1,
    chatId: stContext?.chatId
  });
  console.groupEnd();
  showClickActionBubble(clickPoint, targetElement);
  timer.end("\u5F39\u7A97\u5DF2\u663E\u793A");
}

function bindClickTrigger(element, doc = document) {
  if (boundElements.has(element)) return;
  boundElements.add(element);
  function findTargetElement(e) {
    let targetEl = e.target.closest(".mes_text");
    if (!targetEl && doc.defaultView?.frameElement) {
      let currentEl = e.target;
      if (currentEl.tagName !== "DIV") {
        currentEl = currentEl.closest("div");
      }
      if (currentEl) {
        targetEl = currentEl;
      }
    }
    return targetEl || element;
  }
  element.addEventListener("dblclick", (e) => {
    if (isMobile2() || isIOS()) {
      console.log("[\u70B9\u51FB\u89E6\u53D1] \u79FB\u52A8\u7AEF\u5FFD\u7565 dblclick\uFF0C\u4F7F\u7528\u89E6\u6478\u4E09\u8FDE\u51FB");
      return;
    }
    if (isExcludedTriggerElement(e.target)) {
      console.log(`[\u70B9\u51FB\u89E6\u53D1] \u53CC\u51FB\u7684\u662F\u6392\u9664\u5143\u7D20\u6216\u5A92\u4F53\u5BB9\u5668 (${e.target.tagName} / ${e.target.className || ""})\uFF0C\u8DF3\u8FC7 ClickTrigger \u5904\u7406`);
      return;
    }
    const clickPoint = getEventPoint2(e, doc);
    const targetEl = findTargetElement(e);
    console.group("[\u70B9\u51FB\u89E6\u53D1] \u{1F5B1}\uFE0F \u684C\u9762\u7AEF\u53CC\u51FB\u4E8B\u4EF6");
    console.log("\u4E8B\u4EF6\u7C7B\u578B:", e.type, "| \u5750\u6807:", clickPoint);
    logElementDetails("[\u70B9\u51FB\u89E6\u53D1]", targetEl, "\u76EE\u6807\u5143\u7D20 (mes_text)", {
      \u7ED1\u5B9A\u5143\u7D20tagName: element.tagName,
      \u7ED1\u5B9A\u5143\u7D20className: element.className
    });
    logElementDetails("[\u70B9\u51FB\u89E6\u53D1]", e.target, "\u5B9E\u9645\u70B9\u51FB\u5143\u7D20 (e.target)");
    const context = getContext();
    console.log("[\u70B9\u51FB\u89E6\u53D1] SillyTavern Context:", {
      chatLength: context?.chat?.length,
      characterName: context?.name2,
      userName: context?.name1,
      chatId: context?.chatId
    });
    console.groupEnd();
    handleDoubleClick(e, targetEl, clickPoint);
  }, true);
  let lastTapTime = 0;
  let lastTapPoint = { x: 0, y: 0 };
  let tapCount = 0;
  let touchStartPoint = { x: 0, y: 0 };
  const tapThreshold = isIOS() ? 400 : 350;
  const tapDistance = 30;
  const swipeThreshold = 15;
  element.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      touchStartPoint = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, { capture: true, passive: true });
  element.addEventListener("touchend", (e) => {
    if (e.changedTouches.length !== 1) {
      return;
    }
    if (isExcludedTriggerElement(e.target)) {
      console.log(`[\u70B9\u51FB\u89E6\u53D1] \u89E6\u6478\u7684\u662F\u6392\u9664\u5143\u7D20 (${e.target.tagName} / ${e.target.className || ""})\uFF0C\u8DF3\u8FC7 ClickTrigger \u5904\u7406`);
      return;
    }
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const swipeDistance = Math.sqrt(
      Math.pow(endX - touchStartPoint.x, 2) + Math.pow(endY - touchStartPoint.y, 2)
    );
    if (swipeDistance > swipeThreshold) {
      console.log(`[\u70B9\u51FB\u89E6\u53D1] \u68C0\u6D4B\u5230\u6ED1\u52A8 (\u8DDD\u79BB: ${swipeDistance.toFixed(1)}px)\uFF0C\u5FFD\u7565`);
      tapCount = 0;
      lastTapTime = 0;
      return;
    }
    const currentTime = Date.now();
    const currentPoint = getEventPoint2(e, doc);
    const timeSinceLastTap = currentTime - lastTapTime;
    const distance2 = Math.sqrt(
      Math.pow(currentPoint.x - lastTapPoint.x, 2) + Math.pow(currentPoint.y - lastTapPoint.y, 2)
    );
    if (timeSinceLastTap < tapThreshold && timeSinceLastTap > 0 && distance2 < tapDistance) {
      tapCount++;
      console.log(`[\u70B9\u51FB\u89E6\u53D1] \u79FB\u52A8\u7AEF\u8FDE\u51FB\u8BA1\u6570: ${tapCount}`);
      if (tapCount >= 3) {
        e.preventDefault();
        const targetEl = findTargetElement(e);
        console.group("[\u70B9\u51FB\u89E6\u53D1] \u{1F4F1} \u79FB\u52A8\u7AEF\u4E09\u8FDE\u51FB\u4E8B\u4EF6");
        console.log("\u4E8B\u4EF6\u7C7B\u578B:", e.type, "| \u5750\u6807:", currentPoint);
        logElementDetails("[\u70B9\u51FB\u89E6\u53D1]", targetEl, "\u76EE\u6807\u5143\u7D20 (mes_text)");
        logElementDetails("[\u70B9\u51FB\u89E6\u53D1]", e.target, "\u5B9E\u9645\u89E6\u6478\u5143\u7D20 (e.target)");
        console.groupEnd();
        handleDoubleClick(e, targetEl, currentPoint);
        tapCount = 0;
        lastTapTime = 0;
        lastTapPoint = { x: 0, y: 0 };
      } else {
        lastTapTime = currentTime;
        lastTapPoint = currentPoint;
      }
    } else {
      tapCount = 1;
      lastTapTime = currentTime;
      lastTapPoint = currentPoint;
    }
  }, { capture: true, passive: false });
  console.log("[\u70B9\u51FB\u89E6\u53D1] \u2713 \u5DF2\u7ED1\u5B9A:", element.className || element.tagName);
}

function scanClickTriggerElements() {
  const mesTextElements = document.getElementsByClassName("mes_text");
  let count = 0;
  let alreadyBound = 0;
  for (const element of mesTextElements) {
    if (!boundElements.has(element)) {
      bindClickTrigger(element, document);
      count++;
    } else {
      alreadyBound++;
    }
  }
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    try {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc || !iframeDoc.body) return;
      if (!boundElements.has(iframeDoc.body)) {
        bindClickTrigger(iframeDoc.body, iframeDoc);
        count++;
      }
      const iframeMesTexts = iframeDoc.getElementsByClassName("mes_text");
      for (const element of iframeMesTexts) {
        if (!boundElements.has(element)) {
          bindClickTrigger(element, iframeDoc);
          count++;
        }
      }
    } catch (e) {
    }
  });
  if (count > 0) {
  }
}

function initClickTriggerMonitor() {
  console.log("[\u70B9\u51FB\u89E6\u53D1] ====== \u521D\u59CB\u5316\u70B9\u51FB\u89E6\u53D1\u76D1\u63A7 ======");
  if (clickPollingTimer) {
    console.log("[\u70B9\u51FB\u89E6\u53D1] \u5DF2\u5728\u8FD0\u884C");
    return;
  }
  __set_clickPollingTimer(setInterval(() => {
    try {
      scanClickTriggerElements();
    } catch (e) {
      console.error("[\u70B9\u51FB\u89E6\u53D1] \u626B\u63CF\u51FA\u9519:", e);
    }
  }, 3e3));
  try {
    scanClickTriggerElements();
  } catch (e) {
    console.error("[\u70B9\u51FB\u89E6\u53D1] \u521D\u59CB\u626B\u63CF\u51FA\u9519:", e);
  }
  console.log("[\u70B9\u51FB\u89E6\u53D1] \u2713 \u5DF2\u542F\u52A8");
}

function stopClickTriggerMonitor() {
  console.log("[\u70B9\u51FB\u89E6\u53D1] ====== \u505C\u6B62\u76D1\u63A7 ======");
  if (clickPollingTimer) {
    clearInterval(clickPollingTimer);
    __set_clickPollingTimer(null);
  }
  __set_boundElements(/* @__PURE__ */ new WeakSet());
  closeActionBubble();
  console.log("[\u70B9\u51FB\u89E6\u53D1] \u2713 \u5DF2\u505C\u6B62");
}

function startClickTriggerMonitor() {
  const startWithDelay = () => {
    setTimeout(() => {
      console.log("[\u70B9\u51FB\u89E6\u53D1] \u5EF6\u8FDF\u542F\u52A8...");
      initClickTriggerMonitor();
    }, 3e3);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWithDelay);
  } else {
    startWithDelay();
  }
}

startClickTriggerMonitor();

export function __set_gestureCanvas(v) { gestureCanvas = v; }

export function __set_gestureCtx(v) { gestureCtx = v; }

export function __set_isRecording(v) { isRecording = v; }

export function __set_recordingResolve(v) { recordingResolve = v; }

export function __set_isDrawing(v) { isDrawing = v; }

export function __set_activeDoc(v) { activeDoc = v; }

export function __set_activeElement(v) { activeElement = v; }

export function __set_gesturePoints(v) { gesturePoints = v; }

export function __set_gestureStartTime(v) { gestureStartTime = v; }

export function __set_isPending(v) { isPending = v; }

export function __set_pendingEvent(v) { pendingEvent = v; }

export function __set_startPoint(v) { startPoint = v; }

export function __set_longPressTimer(v) { longPressTimer = v; }

export function __set_isLongPress(v) { isLongPress = v; }

export function __set_shouldBlockContextMenu(v) { shouldBlockContextMenu = v; }

export function __set_gesturePollingTimer(v) { gesturePollingTimer = v; }

export { BINDIED_ATTR, GRID_SIZE, LONG_PRESS_THRESHOLD, MOBILE_MOVE_THRESHOLD, MOVE_THRESHOLD, activeDoc, activeElement, boundEventHandlers, gestureCanvas, gestureCtx, gesturePoints, gesturePollingTimer, gestureStartTime, initClickTriggerMonitor, isDrawing, isLongPress, isPending, isRecording, longPressTimer, pendingEvent, recordingResolve, shouldBlockContextMenu, startPoint, stopClickTriggerMonitor };
