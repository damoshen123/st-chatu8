// 还原自打包产物 — 原始模块: utils/imageGenStats.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../script.js";
import { EventType, extensionName } from "./config.js";
import { scheduleSettingsSave } from "./perf/settingsSaveScheduler.js";

var KNOWN_BACKENDS;

KNOWN_BACKENDS = ["sd", "comfyui", "banana", "novelai"];

function createDefaultStats() {
  const backends = {};
  for (const b of KNOWN_BACKENDS) {
    backends[b] = { success: 0, fail: 0 };
  }
  return {
    backends,
    total: { success: 0, fail: 0 },
    firstGenTime: null,
    lastGenTime: null,
    daily: {}
    // { "2025-04-13": { sd: 2, comfyui: 1, ... } }
  };
}

function getStats() {
  if (!extension_settings[extensionName]) return createDefaultStats();
  if (!extension_settings[extensionName].imageGenStats) {
    extension_settings[extensionName].imageGenStats = createDefaultStats();
  }
  const stats = extension_settings[extensionName].imageGenStats;
  if (!stats.backends) stats.backends = {};
  if (!stats.total) stats.total = { success: 0, fail: 0 };
  if (!stats.daily) stats.daily = {};
  for (const b of KNOWN_BACKENDS) {
    if (!stats.backends[b]) stats.backends[b] = { success: 0, fail: 0 };
  }
  return stats;
}

function recordGeneration(backend, success) {
  const stats = getStats();
  if (!stats.backends[backend]) {
    stats.backends[backend] = { success: 0, fail: 0 };
  }
  if (success) {
    stats.backends[backend].success++;
    stats.total.success++;
  } else {
    stats.backends[backend].fail++;
    stats.total.fail++;
  }
  const now = Date.now();
  stats.lastGenTime = now;
  if (!stats.firstGenTime) {
    stats.firstGenTime = now;
  }
  if (success) {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (!stats.daily[today]) stats.daily[today] = {};
    stats.daily[today][backend] = (stats.daily[today][backend] || 0) + 1;
  }
  scheduleSettingsSave("stats");
}

function handleImageResponse(_responseData) {
}

function recordImageGeneration(backend, success) {
  recordGeneration(backend, success);
}

function getImageGenStats() {
  return getStats();
}

function resetImageGenStats() {
  extension_settings[extensionName].imageGenStats = createDefaultStats();
  saveSettingsDebounced();
}

function initImageGenStatsListener() {
  eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, handleImageResponse);
  console.log(`[${extensionName}] \u751F\u56FE\u751F\u6DAF\u7EDF\u8BA1\u76D1\u542C\u5668\u5DF2\u521D\u59CB\u5316`);
}

export { getImageGenStats, initImageGenStatsListener, recordImageGeneration, resetImageGenStats };
