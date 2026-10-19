// 还原自打包产物 — 原始模块: utils/settings/stream_generate.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, event_types } from "../../../../../../script.js";
import { extensionName } from "../config.js";
import { normalizePromptTag } from "../utils.js";
import { genEndedEvent, genStartedEvent, genStoppedEvent } from "../../../index.js";
import { add, clear } from "../pregen_manager.js";

var activeTaskCleanups, currentSessionEpoch, pregenDispatched, pregenManager;

var pregenDispatched = /* @__PURE__ */ new Set();

var currentSessionEpoch = 0;

var activeTaskCleanups = /* @__PURE__ */ new Set();

var pregenManager = {
  add,
  clear
};
function stripThinkingForPregen(text) {
  if (!text || typeof text !== "string") return "";
  let cleaned = text;
  cleaned = cleaned.replace(/<\s*(?:think(?:ing)?|thought)(?:\s+[^>]*)?>[\s\S]*?<\/\s*(?:think(?:ing)?|thought)\s*>/gi, "");
  const closeMatch = cleaned.match(/<\/\s*(?:think(?:ing)?|thought)\s*>/i);
  if (closeMatch && closeMatch.index !== void 0) {
    cleaned = cleaned.substring(closeMatch.index + closeMatch[0].length);
  }
  const openMatch = cleaned.match(/<\s*(?:think(?:ing)?|thought)(?:\s+[^>]*)?>/i);
  if (openMatch && openMatch.index !== void 0) {
    cleaned = cleaned.substring(0, openMatch.index);
  }
  const tailDanglingRegex = /(?:<\s*\/?(?:think(?:ing)?|thought)(?:\s+[^>]*)?|<\s*\/?(?:t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?|h?o(?:u(?:g(?:h(?:t)?)?)?)?)?)?)$/i;
  cleaned = cleaned.replace(tailDanglingRegex, "");
  return cleaned;
}

function parsePrompts(text) {
  const settings3 = extension_settings[extensionName];
  if (!settings3.startTag || !settings3.endTag) return [];
  const visibleText = stripThinkingForPregen(text);
  if (!visibleText) return [];
  const escapeRegExp2 = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
  const start = escapeRegExp2(settings3.startTag);
  const end = escapeRegExp2(settings3.endTag);
  const pattern = new RegExp(`${start}([\\s\\S]*?)${end}`, "g");
  const matches = [...visibleText.matchAll(pattern)];
  return matches.map((match) => normalizePromptTag(match[1])).filter(Boolean);
}

eventSource.on(genStartedEvent, () => {
  if (String(extension_settings[extensionName]?.enablePregen) !== "true") return;
  pregenManager.clear();
});

eventSource.on(genStoppedEvent, () => {
  if (String(extension_settings[extensionName]?.enablePregen) !== "true") return;
  pregenManager.clear();
});

eventSource.on(genEndedEvent, () => {
  if (String(extension_settings[extensionName]?.enablePregen) !== "true") return;
  pregenManager.clear();
});

if (event_types.CHAT_CHANGED) {
  eventSource.on(event_types.CHAT_CHANGED, () => {
    pregenManager.clear();
  });
}

eventSource.on(event_types.STREAM_TOKEN_RECEIVED, (text) => {
  if (String(extension_settings[extensionName]?.enablePregen) !== "true" || !text) return;
  const prompts = parsePrompts(text);
  if (prompts.length > 0) {
    pregenManager.add(prompts);
  }
});

export function __set_currentSessionEpoch(v) { currentSessionEpoch = v; }

export { activeTaskCleanups, currentSessionEpoch, pregenDispatched };
