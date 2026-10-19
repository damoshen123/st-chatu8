// 还原自打包产物 — 原始模块: utils/perf/settingsSaveScheduler.js
import { saveSettingsDebounced } from "../../../../../../script.js";
import { getPerfState, isPerfFeatureEnabled } from "./perfConfig.js";

var _dirtyKind, _inFlightPromise, _isDirty, _lastStartedAt, _stats, getBurstGuardMs, isMergeEnabled;

isMergeEnabled = () => isPerfFeatureEnabled("settingsSaveMerge", true);

getBurstGuardMs = () => {
      try {
        const cfg = typeof window !== "undefined" ? window.__chatu8perf : null;
        const v = cfg?.settingsSaveBurstGuardMs;
        return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 300;
      } catch (_) {
        return 300;
      }
    };

_isDirty = false;

_dirtyKind = "";

_inFlightPromise = null;

_lastStartedAt = 0;

_stats = {
      requests: 0,
      coalesced: 0,
      saves: 0,
      modes: {},
      confirmations: 0,
      dirty: false,
      inFlight: false,
      lastStartedAt: 0,
      lastCompletedAt: 0
    };

(() => {
      try {
        if (typeof window === "undefined") return;
        const state3 = getPerfState();
        state3.scheduleSettingsSave = scheduleSettingsSave;
        state3.flushSettingsSave = lifecycleFlushSettingsSave;
        state3.settingsSaveStats = _stats;
        state3.settingsSaveMergeEnabled = isMergeEnabled();
        state3.settings = {
          flush: (opts) => flushSettingsSave(opts),
          stats: () => ({ ..._stats }),
          burstGuardMs: getBurstGuardMs(),
          contract: "flush(options?) -> Promise<{saved,mode,dirty}>"
        };
        if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
          document.addEventListener("visibilitychange", () => {
            if (document.hidden && _isDirty) {
              lifecycleFlushSettingsSave();
            }
          });
        }
        if (typeof window.addEventListener === "function") {
          window.addEventListener("pagehide", () => {
            lifecycleFlushSettingsSave();
          });
          window.addEventListener("beforeunload", () => {
            lifecycleFlushSettingsSave();
          });
        }
      } catch (err) {
        console.warn("[SettingsScheduler] \u751F\u547D\u5468\u671F\u76D1\u542C\u6CE8\u518C\u5931\u8D25:", err);
      }
    })();

function executeSave(reason, force = false) {
  if (_inFlightPromise) {
    _stats.coalesced++;
    return _inFlightPromise;
  }
  const now = Date.now();
  const burstGuard = getBurstGuardMs();
  if (!force && _lastStartedAt && now - _lastStartedAt < burstGuard) {
    _stats.coalesced++;
    return Promise.resolve({
      saved: false,
      mode: "coalesced",
      reason,
      dirty: _isDirty,
      sinceLastSaveMs: now - _lastStartedAt,
      burstGuardMs: burstGuard
    });
  }
  _isDirty = false;
  _dirtyKind = "";
  _lastStartedAt = now;
  _stats.saves++;
  _stats.lastStartedAt = now;
  _stats.inFlight = true;
  const mode = "debounced";
  _stats.modes[mode] = (_stats.modes[mode] || 0) + 1;
  let callPromise;
  try {
    callPromise = saveSettingsDebounced();
  } catch (error) {
    _stats.inFlight = false;
    _isDirty = true;
    _stats.dirty = true;
    console.error("[SettingsScheduler] saveSettingsDebounced \u8C03\u7528\u629B\u51FA\u5F02\u5E38:", error);
    return Promise.resolve({
      saved: false,
      mode: "error",
      reason,
      error: String(error?.message || error),
      dirty: true
    });
  }
  const finish = Promise.resolve(callPromise).then(() => {
    _stats.lastCompletedAt = Date.now();
    return { saved: true, mode, reason, dirty: _isDirty };
  }, (error) => {
    _isDirty = true;
    _stats.dirty = true;
    console.error("[SettingsScheduler] settings \u4FDD\u5B58\u5931\u8D25:", error);
    return { saved: false, mode: "error", reason, error: String(error?.message || error), dirty: true };
  }).then((result) => {
    _stats.inFlight = false;
    _stats.dirty = _isDirty;
    if (_inFlightPromise === finish) _inFlightPromise = null;
    return result;
  }, (error) => {
    _stats.inFlight = false;
    if (_inFlightPromise === finish) _inFlightPromise = null;
    throw error;
  });
  _inFlightPromise = finish;
  return finish;
}

function scheduleSettingsSave(reason = "index") {
  _stats.requests++;
  if (!isMergeEnabled()) {
    try {
      saveSettingsDebounced();
    } catch (error) {
      console.error("[SettingsScheduler] saveSettingsDebounced \u6267\u884C\u5931\u8D25:", error);
    }
    return;
  }
  if (reason === "registry") {
    _isDirty = true;
    if (_dirtyKind !== "index" && _dirtyKind !== "index-coalesced") {
      _dirtyKind = "registry";
    }
    _stats.dirty = true;
    return;
  }
  if (_inFlightPromise) {
    _isDirty = true;
    _dirtyKind = "index-coalesced";
    _stats.dirty = true;
    _stats.coalesced++;
    return;
  }
  const now = Date.now();
  const burstGuard = getBurstGuardMs();
  if (_lastStartedAt && now - _lastStartedAt < burstGuard) {
    _isDirty = true;
    _dirtyKind = "index-coalesced";
    _stats.dirty = true;
    _stats.coalesced++;
    return;
  }
  _isDirty = true;
  _dirtyKind = "index";
  _stats.dirty = true;
  const started = executeSave("index", false);
  if (started && typeof started.then === "function") {
    started.catch((err) => console.error("[SettingsScheduler] index settings \u4FDD\u5B58\u5F02\u5E38:", err));
  }
}

function flushSettingsSave(options = {}) {
  const force = !!options?.force;
  if (!isMergeEnabled()) {
    return Promise.resolve({ saved: false, mode: "disabled", reason: "flush", dirty: false });
  }
  if (_inFlightPromise) {
    _stats.coalesced++;
    return _inFlightPromise;
  }
  if (!_isDirty && !force) {
    return Promise.resolve({ saved: false, mode: "noop", reason: "flush", dirty: false });
  }
  if (!force && _dirtyKind === "index-coalesced") {
    return Promise.resolve({
      saved: false,
      mode: "coalesced",
      reason: "flush",
      dirty: true,
      sinceLastSaveMs: _lastStartedAt ? Date.now() - _lastStartedAt : null
    });
  }
  return executeSave(force ? "flush-force" : "flush", force);
}

function lifecycleFlushSettingsSave() {
  if (!isMergeEnabled()) {
    try {
      saveSettingsDebounced();
    } catch (e) {
      console.error("[SettingsScheduler] lifecycle settings save failed:", e);
    }
    return false;
  }
  const result = flushSettingsSave({ force: true });
  if (result && typeof result.then === "function") {
    result.then(() => {
    }, () => {
    });
  }
  return true;
}

export { flushSettingsSave, scheduleSettingsSave };
