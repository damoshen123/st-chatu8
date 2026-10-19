// 还原自打包产物 — 原始模块: utils/iframe/utils.js
var theme_exports;


function findNodeAtPosition(nodeInfos, position) {
  if (!nodeInfos || nodeInfos.length === 0) return null;
  let left = 0;
  let right = nodeInfos.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const info = nodeInfos[mid];
    if (position > info.start && position <= info.end || position === info.end) {
      return info;
    } else if (position <= info.start) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  return null;
}

function isElementVisible(element, margin = 200) {
  if (!element || !element.getBoundingClientRect) return false;
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  const verticalVisible = rect.bottom >= -margin && rect.top <= windowHeight + margin;
  const horizontalVisible = rect.right >= -margin && rect.left <= windowWidth + margin;
  return verticalVisible && horizontalVisible;
}

function isIframeVisible(iframe, margin = 200) {
  return isElementVisible(iframe, margin);
}

function debounce(fn, delay2 = 150) {
  let timeoutId = null;
  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay2);
  };
}

function generateStableId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "chatu8-id-" + Math.abs(hash).toString(36);
}

function generateElKey(text) {
  if (!text || text.length === 0) return "";
  const len = text.length;
  const keyLen = 20;
  const start = Math.max(0, Math.floor(len / 2) - Math.floor(keyLen / 2));
  return text.substring(start, start + keyLen);
}

export { debounce, findNodeAtPosition, generateElKey, generateStableId, isElementVisible, isIframeVisible, theme_exports };
