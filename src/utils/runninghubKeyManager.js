// 还原自打包产物 — 原始模块: utils/runninghubKeyManager.js
import { eventSource, saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { extensionName } from "./config.js";
import { addLog } from "./utils.js";
import { RunningHubScheduler } from "./runninghubScheduler.js";

var BALANCE_CACHE_TTL_MS, balanceCache, keyReleaseEventTarget, runningHubScheduler;

balanceCache = /* @__PURE__ */ new Map();

BALANCE_CACHE_TTL_MS = 30 * 1e3;

keyReleaseEventTarget = new EventTarget();

runningHubScheduler = new RunningHubScheduler({
      keys: () => getAllRunningHubApiKeys(),
      limit: (key) => getKeyLocalLimit(key),
      globalLimit: () => getGlobalConcurrencyLimit(),
      pausedKey: (key) => isKeyPaused(key),
      probe: async (key) => {
        const queue = await checkKeyQueueAvailability(key);
        const balance = await checkKeyHasBalance(key, true);
        return { queue, balance };
      },
      log: addLog
    });

try {
      if (eventSource && typeof eventSource.on === "function") {
        eventSource.on("st_chatu8_task_cancelled", (data) => {
          if (data && data.taskId) {
            releaseTaskKeyLeases(data.taskId);
          }
        });
      }
    } catch (e) {
      console.warn("[RunningHub Key\u6C60] \u6CE8\u518C\u4EFB\u52A1\u53D6\u6D88\u4E8B\u4EF6\u76D1\u542C\u5931\u8D25:", e);
    }

if (typeof window !== "undefined") {
      window.resetRunningHubKeyActiveCounts = resetAllKeyActiveCounts;
    }

function getGlobalConcurrencyLimit() {
  const settings3 = extension_settings[extensionName] || {};
  const val = parseInt(settings3.runninghub_global_concurrency_limit, 10);
  return isNaN(val) || val <= 0 ? 0 : val;
}

function setGlobalConcurrencyLimit(limit) {
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  const num = parseInt(limit, 10);
  if (isNaN(num) || num <= 0) {
    delete settings3.runninghub_global_concurrency_limit;
  } else {
    settings3.runninghub_global_concurrency_limit = num;
  }
  saveSettingsDebounced();
  if (runningHubScheduler) runningHubScheduler.pump();
}

function isKeyPaused(apiKey) {
  if (!apiKey) return false;
  const settings3 = extension_settings[extensionName] || {};
  return !!settings3.runninghub_key_paused?.[apiKey];
}

function setKeyPaused(apiKey, paused) {
  if (!apiKey) return;
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  if (!settings3.runninghub_key_paused) {
    settings3.runninghub_key_paused = {};
  }
  if (paused) {
    settings3.runninghub_key_paused[apiKey] = true;
  } else {
    delete settings3.runninghub_key_paused[apiKey];
  }
  saveSettingsDebounced();
  if (runningHubScheduler) runningHubScheduler.pump();
}

function getLocalDateString(date = /* @__PURE__ */ new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function recordKeyConsumption(apiKey, coins) {
  if (!apiKey) return;
  const numCoins = parseFloat(coins);
  if (isNaN(numCoins) || numCoins <= 0) return;
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  if (!settings3.runninghub_key_consumption) {
    settings3.runninghub_key_consumption = {};
  }
  if (!settings3.runninghub_key_consumption[apiKey]) {
    settings3.runninghub_key_consumption[apiKey] = {};
  }
  const todayStr = getLocalDateString();
  const current = parseFloat(settings3.runninghub_key_consumption[apiKey][todayStr] || 0);
  const updated = Math.round((current + numCoins) * 100) / 100;
  settings3.runninghub_key_consumption[apiKey][todayStr] = updated;
  saveSettingsDebounced();
  if (eventSource && typeof eventSource.emit === "function") {
    eventSource.emit("rh_consumption_updated", { apiKey, coins: numCoins, date: todayStr });
  }
  keyReleaseEventTarget.dispatchEvent(new CustomEvent("consumptionUpdated", { detail: { apiKey, coins: numCoins } }));
  addLog(`[RunningHub \u6D88\u8017] Key (${apiKey.slice(0, 5)}...${apiKey.slice(-4)}) \u672C\u6B21\u6D88\u8017 ${numCoins} RH\u5E01\uFF0C\u4ECA\u65E5\u7D2F\u8BA1: ${updated} RH\u5E01`);
}

function getKeyConsumptionStats(apiKey) {
  const defaultStats = { today: 0, sevenDays: 0, thirtyDays: 0, total: 0 };
  if (!apiKey) return defaultStats;
  const settings3 = extension_settings[extensionName] || {};
  const records = settings3.runninghub_key_consumption?.[apiKey];
  if (!records || typeof records !== "object") {
    return defaultStats;
  }
  const now = /* @__PURE__ */ new Date();
  const todayStr = getLocalDateString(now);
  const sevenDaysSet = /* @__PURE__ */ new Set();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    sevenDaysSet.add(getLocalDateString(d));
  }
  const thirtyDaysSet = /* @__PURE__ */ new Set();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    thirtyDaysSet.add(getLocalDateString(d));
  }
  let today = 0;
  let sevenDays = 0;
  let thirtyDays = 0;
  let total = 0;
  for (const [dateStr, val] of Object.entries(records)) {
    const amt = parseFloat(val);
    if (isNaN(amt)) continue;
    total += amt;
    if (dateStr === todayStr) {
      today += amt;
    }
    if (sevenDaysSet.has(dateStr)) {
      sevenDays += amt;
    }
    if (thirtyDaysSet.has(dateStr)) {
      thirtyDays += amt;
    }
  }
  return {
    today: Math.round(today * 100) / 100,
    sevenDays: Math.round(sevenDays * 100) / 100,
    thirtyDays: Math.round(thirtyDays * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

function releaseTaskKeyLeases(taskId) {
  if (!taskId) return;
  runningHubScheduler.cancel(taskId);
}

function resetAllKeyActiveCounts() {
  runningHubScheduler.resetAllKeyActiveCounts();
  keyReleaseEventTarget.dispatchEvent(new Event("keyReleased"));
}

function getKeyLocalLimit(apiKey) {
  if (!apiKey) return 0;
  const settings3 = extension_settings[extensionName] || {};
  const val = settings3.runninghub_key_local_limits?.[apiKey];
  const num = parseInt(val, 10);
  return isNaN(num) || num <= 0 ? 0 : num;
}

function setKeyLocalLimit(apiKey, limit) {
  if (!apiKey) return;
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  if (!settings3.runninghub_key_local_limits) {
    settings3.runninghub_key_local_limits = {};
  }
  const num = parseInt(limit, 10);
  if (isNaN(num) || num <= 0) {
    delete settings3.runninghub_key_local_limits[apiKey];
  } else {
    settings3.runninghub_key_local_limits[apiKey] = num;
  }
  saveSettingsDebounced();
  runningHubScheduler.pump();
}

function parseRunningHubApiKeys(apiKeySetting) {
  if (!apiKeySetting) return [];
  let list = [];
  if (Array.isArray(apiKeySetting)) {
    list = apiKeySetting.map((k) => String(k).trim()).filter(Boolean);
  } else {
    list = String(apiKeySetting).split(/[\r\n,;]+/).map((k) => k.trim()).filter((k) => k.length > 0);
  }
  return Array.from(new Set(list));
}

function getAllRunningHubApiKeys() {
  const settings3 = extension_settings[extensionName] || {};
  const rawKey = settings3.runninghub_apiKey || document.getElementById("runninghub_apiKey")?.value;
  return parseRunningHubApiKeys(rawKey);
}

async function fetchRunningHubAccountStatus(apiKey) {
  if (!apiKey) throw new Error("API Key \u4E0D\u80FD\u4E3A\u7A7A");
  const res = await fetch("https://www.runninghub.ai/uc/openapi/accountStatus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      apikey: apiKey
    })
  });
  const data = await res.json();
  return data;
}

async function fetchRunningHubQueueStatus(apiKey) {
  if (!apiKey) throw new Error("API Key \u4E0D\u80FD\u4E3A\u7A7A");
  const res = await fetch("https://www.runninghub.ai/openapi/v2/queue/status", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });
  const data = await res.json();
  return data;
}

async function checkKeyQueueAvailability(apiKey) {
  try {
    const data = await fetchRunningHubQueueStatus(apiKey);
    if (data && data.code === 0 && data.data) {
      const limit = Math.max(1, parseInt(data.data.concurrentLimit ?? 1, 10));
      const runningCount = Math.max(0, parseInt(data.data.runningCount ?? 0, 10));
      const queuedCount = Math.max(0, parseInt(data.data.queuedCount ?? 0, 10));
      const available = limit - runningCount;
      return {
        isValid: true,
        isAvailable: available >= 1,
        available,
        limit,
        runningCount,
        queuedCount,
        apiKeyType: data.data.apiKeyType || "NORMAL",
        raw: data.data
      };
    } else {
      return {
        isValid: false,
        isAvailable: false,
        available: 0,
        limit: 1,
        runningCount: 0,
        queuedCount: 0,
        apiKeyType: "UNKNOWN",
        raw: data,
        errorCode: data?.code ?? data?.errorCode ?? null,
        error: data?.msg || data?.errorMessage || "\u67E5\u8BE2\u961F\u5217\u72B6\u6001\u5931\u8D25"
      };
    }
  } catch (err) {
    return {
      isValid: false,
      isAvailable: false,
      available: 0,
      limit: 1,
      runningCount: 0,
      queuedCount: 0,
      apiKeyType: "UNKNOWN",
      raw: null,
      errorCode: -1,
      error: err.message || "\u7F51\u7EDC\u8FDE\u63A5\u5F02\u5E38"
    };
  }
}

async function checkKeyHasBalance(apiKey, forceRefresh = false) {
  const now = Date.now();
  const cached = balanceCache.get(apiKey);
  if (!forceRefresh && cached && now - cached.timestamp < BALANCE_CACHE_TTL_MS) {
    return cached;
  }
  try {
    const data = await fetchRunningHubAccountStatus(apiKey);
    if (data && data.code === 0 && data.data) {
      const remainCoins = parseFloat(data.data.remainCoins ?? 0);
      const remainMoney = parseFloat(data.data.remainMoney ?? 0);
      const hasBalance = remainCoins > 0 || remainMoney > 0;
      const result = {
        isValid: true,
        hasBalance,
        remainCoins,
        remainMoney,
        raw: data.data,
        timestamp: now
      };
      balanceCache.set(apiKey, result);
      return result;
    } else {
      const result = {
        isValid: false,
        hasBalance: false,
        remainCoins: 0,
        remainMoney: 0,
        raw: data,
        errorCode: data?.code ?? data?.errorCode ?? null,
        timestamp: now,
        error: data?.msg || data?.errorMessage || "\u67E5\u8BE2\u8D26\u6237\u72B6\u6001\u5931\u8D25"
      };
      balanceCache.set(apiKey, result);
      return result;
    }
  } catch (err) {
    return {
      isValid: false,
      hasBalance: false,
      remainCoins: 0,
      remainMoney: 0,
      errorCode: -1,
      error: err.message || "\u7F51\u7EDC\u8FDE\u63A5\u5F02\u5E38",
      timestamp: now
    };
  }
}

function invalidateBalanceCache(apiKey) {
  if (apiKey) {
    balanceCache.delete(apiKey);
  } else {
    balanceCache.clear();
  }
  if (runningHubScheduler) {
    runningHubScheduler.invalidateKey(apiKey);
    runningHubScheduler.pump();
  }
}

async function acquireRunningHubKey(options = {}) {
  return await runningHubScheduler.acquire(options);
}

async function getUsableRunningHubKeyForUpload() {
  const keys = getAllRunningHubApiKeys();
  if (keys.length === 0) {
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 RunningHub API Key");
  }
  for (const key of keys) {
    const bal = await checkKeyHasBalance(key);
    if (bal.isValid && bal.hasBalance) {
      return key;
    }
  }
  return keys[0];
}

export { acquireRunningHubKey, fetchRunningHubAccountStatus, fetchRunningHubQueueStatus, getGlobalConcurrencyLimit, getKeyConsumptionStats, getKeyLocalLimit, getUsableRunningHubKeyForUpload, invalidateBalanceCache, isKeyPaused, parseRunningHubApiKeys, recordKeyConsumption, setGlobalConcurrencyLimit, setKeyLocalLimit, setKeyPaused };
