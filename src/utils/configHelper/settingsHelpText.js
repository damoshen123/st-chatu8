// 还原自打包产物 — 原始模块: utils/configHelper/settingsHelpText.js
import { SettingsHelpText } from "./helpTipInjector.js";

var hasPlayedOnce, videoContainer;

var hasPlayedOnce = false;

var videoContainer = null;

function getHelpEntry(id) {
  const raw = SettingsHelpText[id];
  if (!raw) return null;
  if (typeof raw === "string") return { short: raw };
  if (typeof raw === "object" && (raw.short || raw.long)) return raw;
  return null;
}

export function __set_videoContainer(v) { videoContainer = v; }

export function __set_hasPlayedOnce(v) { hasPlayedOnce = v; }

export { getHelpEntry, hasPlayedOnce, videoContainer };
