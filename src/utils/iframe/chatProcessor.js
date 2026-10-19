// 还原自打包产物 — 原始模块: utils/iframe/chatProcessor.js
import { checkSendBuClass, isPluginEnabled } from "../utils.js";
import { injectButtonStyleToDocument } from "../settings/buttonstyle.js";
import { injectFrameStyleToDocument } from "../settings/framestyle.js";
import { injectCollapseStyleToDocument } from "../settings/collapsestyle.js";
import { isElementVisible, isIframeVisible } from "./utils.js";
import { findAndReplaceInElement } from "./placeholder.js";
import "../config.js"; // init_config
import "../database.js"; // init_database
import "./generation.js"; // init_generation
import "./dialogs.js"; // init_dialogs
import "../taskQueue.js"; // init_taskQueue



function processMesTextElements() {
  if (!isPluginEnabled() || checkSendBuClass()) {
    return;
  }
  const elements = document.getElementsByClassName("mes_text");
  const total = elements.length;
  for (let i = 0; i < total; i++) {
    const element = elements[i];
    const isLatestMessage = i >= total - 2;
    if (!isLatestMessage && !isElementVisible(element, 0)) {
      continue;
    }
    findAndReplaceInElement(element);
  }
}

function processIframes() {
  if (!isPluginEnabled() || checkSendBuClass()) {
    return;
  }
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    if (!isIframeVisible(iframe, 0)) {
      return;
    }
    const processContent = () => {
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc && iframeDoc.body) {
          injectButtonStyleToDocument(iframeDoc);
          injectFrameStyleToDocument(iframeDoc);
          injectCollapseStyleToDocument(iframeDoc);
          const iframeWindow = iframeDoc.defaultView;
          const viewportHeight = iframeWindow?.innerHeight || 800;
          const viewportWidth = iframeWindow?.innerWidth || 600;
          const stats = {
            totalVisited: 0,
            // 遍历的总元素数
            visibleElements: 0,
            // 可见元素数
            skippedHidden: 0,
            // 跳过的不可见元素数（display:none 等）
            skippedOutOfView: 0,
            // 跳过的视口外元素数
            stoppedAtContent: 0,
            // 因包含足够内容而停止递归的元素数
            leafProcessed: 0,
            // 处理的叶子元素数
            startTime: performance.now()
          };
          const TEXT_CONTENT_THRESHOLD = 50;
          const VIEWPORT_MARGIN = 0;
          const isInViewport = (el) => {
            if (!el || !el.getBoundingClientRect) return false;
            const rect = el.getBoundingClientRect();
            const verticalVisible = rect.bottom >= -VIEWPORT_MARGIN && rect.top <= viewportHeight + VIEWPORT_MARGIN;
            const horizontalVisible = rect.right >= -VIEWPORT_MARGIN && rect.left <= viewportWidth + VIEWPORT_MARGIN;
            return verticalVisible && horizontalVisible;
          };
          const isVisibleInIframe = (el) => {
            if (!el || !el.getBoundingClientRect) return false;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return false;
            const style = iframeDoc.defaultView?.getComputedStyle(el);
            if (style && (style.display === "none" || style.visibility === "hidden")) return false;
            return true;
          };
          const getDirectTextLength = (el) => {
            let textLength = 0;
            for (const node of el.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) {
                textLength += node.textContent.trim().length;
              }
            }
            return textLength;
          };
          const processDiv = (element) => {
            stats.totalVisited++;
            if (!isVisibleInIframe(element)) {
              stats.skippedHidden++;
              return;
            }
            if (!isInViewport(element)) {
              stats.skippedOutOfView++;
              return;
            }
            stats.visibleElements++;
            const totalTextLength = element.textContent?.length || 0;
            const MIN_TEXT_LENGTH = 100;
            const MAX_TEXT_LENGTH = 4e4;
            if (totalTextLength < MIN_TEXT_LENGTH || totalTextLength > MAX_TEXT_LENGTH) {
              const childDivs2 = element.querySelectorAll(":scope > div");
              if (childDivs2.length > 0) {
                stats.skippedBySize = (stats.skippedBySize || 0) + 1;
                childDivs2.forEach((childDiv) => {
                  processDiv(childDiv);
                });
                return;
              }
              if (totalTextLength < MIN_TEXT_LENGTH) {
                stats.skippedTooSmall = (stats.skippedTooSmall || 0) + 1;
                return;
              }
            }
            const directTextLength = getDirectTextLength(element);
            if (directTextLength >= TEXT_CONTENT_THRESHOLD) {
              stats.stoppedAtContent++;
              stats.leafProcessed++;
              findAndReplaceInElement(element);
              return;
            }
            const childDivs = element.querySelectorAll(":scope > div");
            stats.leafProcessed++;
            findAndReplaceInElement(element);
            if (childDivs.length > 0) {
              childDivs.forEach((childDiv) => {
                processDiv(childDiv);
              });
            }
          };
          const topLevelDivs = iframeDoc.body.querySelectorAll(":scope > div");
          if (topLevelDivs.length > 0) {
            topLevelDivs.forEach((div) => processDiv(div));
          } else {
            findAndReplaceInElement(iframeDoc.body);
          }
          const elapsed = (performance.now() - stats.startTime).toFixed(2);
        }
      } catch (e) {
        console.warn(`\u65E0\u6CD5\u8BBF\u95EE iframe \u5185\u5BB9:`, e.message);
      }
    };
    try {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc && iframeDoc.readyState === "complete") {
        processContent();
      } else {
        iframe.addEventListener("load", processContent);
      }
    } catch (e) {
      console.warn(`\u65E0\u6CD5\u8BBF\u95EE iframe:`, e.message);
    }
  });
}

export { processIframes, processMesTextElements };
