// 还原自打包产物 — 原始模块: utils/perf/perfConfig.js
function getPerfConfig() {
  try {
    if (typeof window !== "undefined" && window.__chatu8perf && typeof window.__chatu8perf === "object") {
      return window.__chatu8perf;
    }
  } catch (_) {
  }
  return null;
}

function isPerfFeatureEnabled(flagName, defaultEnabled = true) {
  const config = getPerfConfig();
  if (!config) return defaultEnabled;
  if (config[flagName] === false) return false;
  return defaultEnabled;
}

function getPerfState() {
  if (typeof window === "undefined") return {};
  if (!window.__chatu8perfState || typeof window.__chatu8perfState !== "object") {
    window.__chatu8perfState = {};
  }
  return window.__chatu8perfState;
}

export { getPerfState, isPerfFeatureEnabled };
