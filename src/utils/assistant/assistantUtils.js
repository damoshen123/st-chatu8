// 还原自打包产物 — 原始模块: utils/assistant/assistantUtils.js
import { markedLoadPromise, markedLoaded, setMarkedLoadPromise, setMarkedLoaded } from "./assistantContext.js";
import { getAssistantDisplayName } from "./assistantAvatar.js";

function getMarkedInstance() {
  return window.stChatu8Marked || window.marked;
}

async function loadMarkedIsolated(scriptSrc) {
  const response = await fetch(scriptSrc, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`[AI Assistant] Failed to fetch marked.js: ${response.status} ${response.statusText}`);
  }
  const source = await response.text();
  const isolatedGlobal = {};
  isolatedGlobal.window = isolatedGlobal;
  isolatedGlobal.global = isolatedGlobal;
  isolatedGlobal.self = isolatedGlobal;
  isolatedGlobal.globalThis = isolatedGlobal;
  const isolatedLoader = new Function(
    "window",
    "global",
    "self",
    "globalThis",
    "define",
    "module",
    "exports",
    `${source}
return this.marked || window.marked || globalThis.marked || self.marked || global.marked;`
  );
  const markedInstance = isolatedLoader.call(
    isolatedGlobal,
    isolatedGlobal,
    isolatedGlobal,
    isolatedGlobal,
    isolatedGlobal,
    void 0,
    void 0,
    void 0
  );
  if (!markedInstance) {
    throw new Error("[AI Assistant] Isolated marked.js evaluation completed but no library was returned");
  }
  return markedInstance;
}

function loadMarked() {
  if (markedLoaded && getMarkedInstance()) return Promise.resolve();
  if (markedLoadPromise) return markedLoadPromise;
  const existingMarked = getMarkedInstance();
  if (existingMarked) {
    existingMarked.setOptions?.({
      breaks: true,
      gfm: true
    });
    setMarkedLoaded(true);
    return Promise.resolve();
  }
  const promise = loadMarkedIsolated("https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js").then((markedInstance) => {
    window.stChatu8Marked = markedInstance;
    if (!window.marked) {
      window.marked = markedInstance;
    }
    markedInstance.setOptions?.({
      breaks: true,
      gfm: true
    });
    setMarkedLoaded(true);
  }).catch((error) => {
    setMarkedLoaded(false);
    setMarkedLoadPromise(null);
    console.warn("[AI Assistant] \u52A0\u8F7D marked.js \u5931\u8D25\uFF0C\u5C06\u4F7F\u7528\u7EAF\u6587\u672C\u663E\u793A");
    console.warn("[AI Assistant] marked.js isolated load error", error);
    throw error;
  });
  setMarkedLoadPromise(promise);
  return promise;
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function renderMarkdown(text) {
  if (!text) return "";
  const markedInstance = getMarkedInstance();
  if (markedLoaded && markedInstance) {
    try {
      const html = markedInstance.parse(text);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const links = tempDiv.querySelectorAll("a");
      links.forEach((link) => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      });
      return tempDiv.innerHTML;
    } catch (error) {
      console.warn("[AI Assistant] Markdown \u89E3\u6790\u5931\u8D25\uFF0C\u4F7F\u7528\u7EAF\u6587\u672C\u663E\u793A", error);
      return escapeHTML(text).replace(/\n/g, "<br>");
    }
  }
  return escapeHTML(text).replace(/\n/g, "<br>");
}

function renderThinkingPanel(contentOrBlock, optType = null) {
  let content = "";
  let type = optType;
  if (contentOrBlock && typeof contentOrBlock === "object") {
    content = contentOrBlock.content || "";
    type = type || contentOrBlock.type;
  } else {
    content = String(contentOrBlock || "");
  }
  const isTerminalOrTrace = type === "terminal" || type === "assistant_trace" || content.includes("```bash") || content.includes("```sh") || content.includes("assistant_trace") || content.includes("user@linux");
  const icon = isTerminalOrTrace ? "\u{1F5A5}\uFE0F" : "\u{1F4AD}";
  const label = isTerminalOrTrace ? `${getAssistantDisplayName()}\u7684\u7CFB\u7EDF\u63A8\u6F14\u4E0E\u601D\u8003\u5206\u6790` : `${getAssistantDisplayName()}\u7684\u601D\u8003\u8FC7\u7A0B`;
  const escapedContent = escapeHTML(content);
  return `
        <details class="st-chatu8-ai-thinking-panel">
            <summary class="st-chatu8-ai-thinking-summary">
                <span class="thinking-icon">${icon}</span>
                <span class="thinking-label">${label}</span>
                <span class="thinking-toggle">\u25BC</span>
            </summary>
            <div class="st-chatu8-ai-thinking-content">
                ${escapedContent}
            </div>
        </details>
    `;
}

export { escapeHTML, loadMarked, renderMarkdown, renderThinkingPanel };
