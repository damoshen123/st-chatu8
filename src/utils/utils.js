// 还原自打包产物 — 原始模块: utils/utils.js
import { eventSource, substituteParams } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { extensionName } from "./config.js";
import { deleteLogSessionData, getLogIndex, getLogSessionData, saveLogIndex, saveLogSessionData } from "./configDatabase.js";
import "./database.js"; // init_database

var ComfyUIConcurrencyManager, LOG_PERSIST_DEBOUNCE_MS, LOG_PERSIST_MAX_WAIT_MS, LOG_RETENTION_MS, LOG_ROLLING_TRIM_TARGET, MAX_LOG_STORE_CHARS, MAX_MACRO_CACHE_ENTRIES, MAX_PERSISTED_LOG_SESSIONS, REFERENCE_PIXEL_COUNT, SIGMA_MAGIC_NUMBER, SIGMA_MAGIC_NUMBER_V4_5, SerialLockManager, _expiredLogCleanupBudgetRemaining, _expiredLogCleanupRunning, _logDomLastUpdate, _logDomUpdateTimer, _logInitialized, _pendingLogBuffer, _persistDebounceTimer, _persistFirstRequestTime, comfyuiConcurrencyLock, configDatabase_exports, logPersistenceStatePromise, logWriteQueue, macroSubstitutionCache, serialLock;

REFERENCE_PIXEL_COUNT = 1011712;

SIGMA_MAGIC_NUMBER = 19;

SIGMA_MAGIC_NUMBER_V4_5 = 58;

LOG_RETENTION_MS = 12 * 60 * 60 * 1e3;

MAX_PERSISTED_LOG_SESSIONS = 10;

MAX_LOG_STORE_CHARS = 5e4;

LOG_ROLLING_TRIM_TARGET = 42e3;

logPersistenceStatePromise = null;

logWriteQueue = Promise.resolve();

_logInitialized = false;

_pendingLogBuffer = [];

_persistDebounceTimer = null;

LOG_PERSIST_DEBOUNCE_MS = 5e3;

LOG_PERSIST_MAX_WAIT_MS = 15e3;

_persistFirstRequestTime = 0;

_expiredLogCleanupRunning = false;

_expiredLogCleanupBudgetRemaining = 2e3;

SerialLockManager = class {
      constructor() {
        this.queue = [];
        this.activeTaskId = null;
        this.coolingTimer = null;
      }
      /**
       * 请求获取串行锁（按 FIFO 顺序排队）
       * @param {string} taskId 任务ID
       * @param {AbortSignal} [signal] 可选的中断信号
       * @returns {Promise<void>} 当轮到该任务且获得锁时 resolve
       */
      acquire(taskId, signal = null) {
        return new Promise((resolve, reject) => {
          if (signal?.aborted) {
            const reasonErr = signal.reason instanceof Error ? signal.reason : signal.reason ? new Error(String(signal.reason)) : new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
            return reject(reasonErr);
          }
          const queueItem = {
            taskId,
            resolve,
            reject,
            signal,
            isAborted: false
          };
          if (signal) {
            const abortHandler = () => {
              queueItem.isAborted = true;
              this.remove(taskId);
              const reasonErr = signal.reason instanceof Error ? signal.reason : signal.reason ? new Error(String(signal.reason)) : new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
              reject(reasonErr);
            };
            signal.addEventListener("abort", abortHandler, { once: true });
          }
          if (!this.activeTaskId && !this.coolingTimer && this.queue.length === 0) {
            this.activeTaskId = taskId;
            window.xiancheng = false;
            resolve();
            return;
          }
          this.queue.push(queueItem);
          window.xiancheng = false;
        });
      }
      /**
       * 释放当前任务的串行锁，并在冷却 intervalMs 毫秒后唤醒队列中的下一个任务
       * @param {string} taskId 任务ID
       * @param {number} [intervalMs=0] 生图间隔时间（毫秒）
       */
      release(taskId, intervalMs = 0) {
        if (this.activeTaskId !== taskId) {
          return;
        }
        this.activeTaskId = null;
        const safeInterval = Math.max(0, parseInt(intervalMs, 10) || 0);
        if (this.coolingTimer) {
          clearTimeout(this.coolingTimer);
          this.coolingTimer = null;
        }
        const proceedNext = () => {
          this.coolingTimer = null;
          while (this.queue.length > 0) {
            const nextItem = this.queue.shift();
            if (nextItem.isAborted || nextItem.signal && nextItem.signal.aborted) {
              continue;
            }
            this.activeTaskId = nextItem.taskId;
            window.xiancheng = false;
            nextItem.resolve();
            return;
          }
          this.activeTaskId = null;
          window.xiancheng = true;
          window.dispatchEvent(new Event("xianchengReleased"));
        };
        if (safeInterval > 0 && this.queue.length > 0) {
          this.coolingTimer = setTimeout(proceedNext, safeInterval);
        } else {
          proceedNext();
        }
      }
      /**
       * 从等待队列中移除指定任务（取消）
       * @param {string} taskId 任务ID
       */
      remove(taskId) {
        const index = this.queue.findIndex((item) => item.taskId === taskId);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        if (this.activeTaskId === taskId) {
          this.release(taskId, 0);
        }
      }
      /**
       * 全局重置（清空所有排队并复位锁）
       */
      reset() {
        if (this.coolingTimer) {
          clearTimeout(this.coolingTimer);
          this.coolingTimer = null;
        }
        while (this.queue.length > 0) {
          const item = this.queue.shift();
          try {
            item.reject(new Error("\u4EFB\u52A1\u961F\u5217\u5DF2\u91CD\u7F6E"));
          } catch (_) {
          }
        }
        this.activeTaskId = null;
        window.xiancheng = true;
        window.dispatchEvent(new Event("xianchengReleased"));
      }
    };

serialLock = new SerialLockManager();

ComfyUIConcurrencyManager = class {
      constructor(maxConcurrency = 10) {
        this.maxConcurrency = maxConcurrency;
        this.runningTasks = /* @__PURE__ */ new Set();
        this.queue = [];
      }
      setMaxConcurrency(limit) {
        const num = parseInt(limit, 10);
        if (Number.isFinite(num) && num >= 1 && num <= 10) {
          this.maxConcurrency = num;
          this._dispatchNext();
        }
      }
      getMaxConcurrency() {
        return this.maxConcurrency;
      }
      acquire(taskId, signal = null) {
        return new Promise((resolve, reject) => {
          if (signal?.aborted) {
            const err = signal.reason instanceof Error ? signal.reason : signal.reason ? new Error(String(signal.reason)) : new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
            reject(err);
            return;
          }
          const queueItem = {
            taskId,
            resolve,
            reject,
            signal,
            isAborted: false
          };
          if (signal) {
            const abortHandler = () => {
              queueItem.isAborted = true;
              this.remove(taskId);
              const reasonErr = signal.reason instanceof Error ? signal.reason : signal.reason ? new Error(String(signal.reason)) : new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
              reject(reasonErr);
            };
            signal.addEventListener("abort", abortHandler, { once: true });
          }
          if (this.runningTasks.size < this.maxConcurrency && this.queue.length === 0) {
            this.runningTasks.add(taskId);
            this._syncGlobalXiancheng();
            resolve();
            return;
          }
          this.queue.push(queueItem);
          this._syncGlobalXiancheng();
        });
      }
      release(taskId) {
        this.runningTasks.delete(taskId);
        this._dispatchNext();
        this._syncGlobalXiancheng();
      }
      remove(taskId) {
        const index = this.queue.findIndex((item) => item.taskId === taskId);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        if (this.runningTasks.has(taskId)) {
          this.release(taskId);
        } else {
          this._syncGlobalXiancheng();
        }
      }
      reset() {
        while (this.queue.length > 0) {
          const item = this.queue.shift();
          try {
            item.reject(new Error("ComfyUI \u4EFB\u52A1\u961F\u5217\u5DF2\u91CD\u7F6E"));
          } catch (_) {
          }
        }
        this.runningTasks.clear();
        this._syncGlobalXiancheng();
      }
      _dispatchNext() {
        while (this.runningTasks.size < this.maxConcurrency && this.queue.length > 0) {
          const nextItem = this.queue.shift();
          if (nextItem.isAborted || nextItem.signal && nextItem.signal.aborted) {
            continue;
          }
          this.runningTasks.add(nextItem.taskId);
          nextItem.resolve();
          return;
        }
      }
      _syncGlobalXiancheng() {
        const hasAvailableSlot = this.runningTasks.size < this.maxConcurrency;
        window.xiancheng = hasAvailableSlot;
        if (hasAvailableSlot) {
          window.dispatchEvent(new Event("xianchengReleased"));
        }
      }
      getActiveCount() {
        return this.runningTasks.size;
      }
      getQueueLength() {
        return this.queue.length;
      }
    };

comfyuiConcurrencyLock = new ComfyUIConcurrencyManager(10);

_logDomUpdateTimer = null;

_logDomLastUpdate = 0;

MAX_MACRO_CACHE_ENTRIES = 200;

macroSubstitutionCache = /* @__PURE__ */ new Map();

if (typeof eventSource !== "undefined" && eventSource.on) {
      try {
        eventSource.on("chat_changed", clearMacroSubstitutionCache);
        eventSource.on("generation_started", clearMacroSubstitutionCache);
      } catch (_) {
      }
    }


function generateLogSessionId() {
  if (crypto && crypto.randomUUID) {
    return `log_${crypto.randomUUID()}`;
  }
  return `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getNow() {
  return Date.now();
}

function getDefaultLogIndex() {
  return {
    version: 1,
    activeSessionId: "",
    sessions: []
  };
}

function ensureLogStateContainer() {
  if (!extension_settings[extensionName].logState || typeof extension_settings[extensionName].logState !== "object") {
    extension_settings[extensionName].logState = getDefaultLogIndex();
  }
  if (!Array.isArray(extension_settings[extensionName].logState.sessions)) {
    extension_settings[extensionName].logState.sessions = [];
  }
  return extension_settings[extensionName].logState;
}

function cleanupExpiredSessionMeta(indexData, now = getNow()) {
  const cutoff = now - LOG_RETENTION_MS;
  const activeId = indexData.activeSessionId || "";
  indexData.sessions = (indexData.sessions || []).filter((session) => {
    if (session.id === activeId) return true;
    const isNotExpired = (session.updatedAt || session.createdAt || 0) >= cutoff;
    const hasEntries = (session.entryCount || 0) > 0;
    return isNotExpired && hasEntries;
  });
  if (indexData.sessions.length > MAX_PERSISTED_LOG_SESSIONS) {
    indexData.sessions = indexData.sessions.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)).slice(0, MAX_PERSISTED_LOG_SESSIONS);
  }
  return indexData;
}

function getSessionMeta(sessionId) {
  const state3 = ensureLogStateContainer();
  return (state3.sessions || []).find((session) => session.id === sessionId) || null;
}

function updateSessionMeta(sessionId, updater) {
  const state3 = ensureLogStateContainer();
  const sessions = state3.sessions || [];
  let session = sessions.find((item) => item.id === sessionId);
  if (!session) {
    session = { id: sessionId, createdAt: getNow(), updatedAt: getNow(), entryCount: 0 };
    sessions.push(session);
  }
  updater(session);
  state3.sessions = sessions;
  return session;
}

function createSessionMeta() {
  const now = getNow();
  return {
    id: generateLogSessionId(),
    createdAt: now,
    updatedAt: now,
    entryCount: 0
  };
}

function queueLogPersistence(task) {
  logWriteQueue = logWriteQueue.then(task).catch((error) => {
    console.error("[LogPersistence] \u65E5\u5FD7\u6301\u4E45\u5316\u5931\u8D25:", error);
  });
  return logWriteQueue;
}

function schedulePersist() {
  const now = Date.now();
  if (_persistFirstRequestTime === 0) {
    _persistFirstRequestTime = now;
  }
  const elapsedSinceFirst = now - _persistFirstRequestTime;
  if (elapsedSinceFirst >= LOG_PERSIST_MAX_WAIT_MS) {
    if (_persistDebounceTimer !== null) {
      clearTimeout(_persistDebounceTimer);
      _persistDebounceTimer = null;
    }
    _persistFirstRequestTime = 0;
    queueLogPersistence(() => persistActiveLogSession());
    return;
  }
  if (_persistDebounceTimer !== null) {
    clearTimeout(_persistDebounceTimer);
  }
  const remainingToMax = Math.max(50, LOG_PERSIST_MAX_WAIT_MS - elapsedSinceFirst);
  const delay2 = Math.min(LOG_PERSIST_DEBOUNCE_MS, remainingToMax);
  _persistDebounceTimer = setTimeout(() => {
    _persistDebounceTimer = null;
    _persistFirstRequestTime = 0;
    queueLogPersistence(() => persistActiveLogSession());
  }, delay2);
}

async function removeExpiredLogSessions(indexData, previousSessions = null) {
  if (_expiredLogCleanupRunning || _expiredLogCleanupBudgetRemaining <= 0) return;
  const existingIds = new Set((indexData?.sessions || []).map((session) => session.id));
  const candidateList = Array.isArray(previousSessions) ? previousSessions : extension_settings[extensionName].logState?.sessions || [];
  const staleIds = candidateList.map((item) => item?.id).filter((id) => id && !existingIds.has(id));
  if (staleIds.length === 0) return;
  _expiredLogCleanupRunning = true;
  try {
    const toDelete = staleIds.slice(0, Math.min(staleIds.length, _expiredLogCleanupBudgetRemaining));
    _expiredLogCleanupBudgetRemaining -= toDelete.length;
    for (let i = 0; i < toDelete.length; i += 5) {
      const batch = toDelete.slice(i, i + 5);
      await Promise.all(batch.map(async (sessionId) => {
        try {
          if (typeof sessionId === "string" && sessionId.trim()) {
            await deleteLogSessionData(sessionId);
          }
        } catch (error) {
          console.warn("[LogPersistence] \u5220\u9664\u8FC7\u671F\u65E5\u5FD7\u4F1A\u8BDD\u5931\u8D25:", sessionId, error);
        }
      }));
      await new Promise((r) => setTimeout(r, 16));
    }
  } finally {
    _expiredLogCleanupRunning = false;
  }
}

async function persistLogIndex() {
  const state3 = ensureLogStateContainer();
  const previousSessions = [...state3.sessions || []];
  const normalized = cleanupExpiredSessionMeta({
    version: 1,
    activeSessionId: state3.activeSessionId || "",
    sessions: previousSessions
  });
  state3.activeSessionId = normalized.activeSessionId;
  state3.sessions = normalized.sessions;
  await removeExpiredLogSessions(normalized, previousSessions);
  await saveLogIndex(normalized);
}

async function persistActiveLogSession() {
  const state3 = ensureLogStateContainer();
  const activeSessionId = state3.activeSessionId;
  if (!activeSessionId) return;
  const meta = getSessionMeta(activeSessionId);
  if (!meta) return;
  await saveLogSessionData(activeSessionId, {
    id: activeSessionId,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    entryCount: meta.entryCount || 0,
    content: extension_settings[extensionName].log || ""
  });
  await persistLogIndex();
}

async function ensureActiveLogSession() {
  const state3 = ensureLogStateContainer();
  if (state3.activeSessionId && getSessionMeta(state3.activeSessionId)) {
    return state3.activeSessionId;
  }
  const meta = createSessionMeta();
  state3.activeSessionId = meta.id;
  state3.sessions.push(meta);
  if (typeof extension_settings[extensionName].log !== "string") {
    extension_settings[extensionName].log = "";
  }
  await persistActiveLogSession();
  return meta.id;
}

async function initializeLogPersistence() {
  if (!logPersistenceStatePromise) {
    logPersistenceStatePromise = (async () => {
      const storedIndex = await getLogIndex();
      const rawStoredSessions = storedIndex && Array.isArray(storedIndex.sessions) ? [...storedIndex.sessions] : [];
      const merged = cleanupExpiredSessionMeta(storedIndex && typeof storedIndex === "object" ? {
        version: storedIndex.version || 1,
        activeSessionId: storedIndex.activeSessionId || "",
        sessions: rawStoredSessions
      } : getDefaultLogIndex());
      extension_settings[extensionName].logState = merged;
      await removeExpiredLogSessions(merged, rawStoredSessions);
      if (merged.activeSessionId) {
        const activeData = await getLogSessionData(merged.activeSessionId);
        extension_settings[extensionName].log = activeData?.content || extension_settings[extensionName].log || "";
        if (activeData) {
          updateSessionMeta(merged.activeSessionId, (session) => {
            session.createdAt = activeData.createdAt || session.createdAt;
            session.updatedAt = activeData.updatedAt || session.updatedAt;
            session.entryCount = activeData.entryCount || session.entryCount || 0;
          });
        }
      } else if (typeof extension_settings[extensionName].log === "string" && extension_settings[extensionName].log.trim() !== "") {
        const initialMeta = createSessionMeta();
        initialMeta.entryCount = extension_settings[extensionName].log.split("\n").filter(Boolean).length;
        merged.activeSessionId = initialMeta.id;
        merged.sessions.push(initialMeta);
        await persistActiveLogSession();
      } else {
        extension_settings[extensionName].log = "";
        await ensureActiveLogSession();
      }
      await persistLogIndex();
      _logInitialized = true;
      if (_pendingLogBuffer.length > 0) {
        const buffered = _pendingLogBuffer.join("");
        _pendingLogBuffer = [];
        extension_settings[extensionName].log = (extension_settings[extensionName].log || "") + buffered;
        const state3 = ensureLogStateContainer();
        const lineCount = buffered.split("\n").filter(Boolean).length;
        if (state3.activeSessionId) {
          updateSessionMeta(state3.activeSessionId, (session) => {
            session.updatedAt = getNow();
            session.entryCount = (session.entryCount || 0) + lineCount;
          });
        }
        const logTextarea = document.getElementById("ch-log-textarea");
        if (logTextarea) {
          logTextarea.value = extension_settings[extensionName].log || "";
          logTextarea.scrollTop = 0;
        }
      }
      window.addEventListener("beforeunload", () => {
        if (_persistDebounceTimer !== null) {
          clearTimeout(_persistDebounceTimer);
          _persistDebounceTimer = null;
        }
        queueLogPersistence(() => persistActiveLogSession());
      }, { once: true });
      schedulePersist();
    })().catch((error) => {
      logPersistenceStatePromise = null;
      console.error("[LogPersistence] \u521D\u59CB\u5316\u5931\u8D25:", error);
    });
  }
  return logPersistenceStatePromise;
}

async function getRecentPersistedLogSessions() {
  await initializeLogPersistence();
  const state3 = ensureLogStateContainer();
  const cutoff = getNow() - LOG_RETENTION_MS;
  const sessions = [...state3.sessions || []].filter((session) => (session.updatedAt || session.createdAt || 0) >= cutoff).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const result = [];
  for (const session of sessions) {
    if (session.id === state3.activeSessionId) {
      result.push({
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        entryCount: session.entryCount || 0,
        content: extension_settings[extensionName].log || ""
      });
      continue;
    }
    const sessionData = await getLogSessionData(session.id);
    if (sessionData && sessionData.content) {
      result.push({
        id: session.id,
        createdAt: sessionData.createdAt || session.createdAt,
        updatedAt: sessionData.updatedAt || session.updatedAt,
        entryCount: sessionData.entryCount || session.entryCount || 0,
        content: sessionData.content
      });
    }
  }
  return result;
}

function formatLogSessionTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

async function exportLogsWithHistory() {
  const sessions = await getRecentPersistedLogSessions();
  const validSessions = sessions.filter((session) => typeof session.content === "string" && session.content.trim() !== "");
  if (validSessions.length === 0) {
    return "";
  }
  const lines = [];
  lines.push("========================================");
  lines.push("\u{1F4CB} st-chatu8 \u65E5\u5FD7\u5BFC\u51FA");
  lines.push(`\u751F\u6210\u65F6\u95F4: ${formatLogSessionTimestamp(getNow())}`);
  lines.push(`\u5305\u542B\u65E5\u5FD7\u4F1A\u8BDD: ${validSessions.length}`);
  lines.push("\u8303\u56F4: \u5F53\u524D\u4F1A\u8BDD + \u6700\u8FD1 12 \u5C0F\u65F6\u5386\u53F2\u4F1A\u8BDD\uFF08\u6700\u591A\u4FDD\u7559 10 \u4E2A\u6709\u6548\u4F1A\u8BDD\uFF09");
  lines.push("========================================");
  lines.push("");
  validSessions.forEach((session, index) => {
    const isActive = ensureLogStateContainer().activeSessionId === session.id;
    lines.push(`\u3010\u65E5\u5FD7\u4F1A\u8BDD ${index + 1}\u3011${isActive ? "\uFF08\u5F53\u524D\u4F1A\u8BDD\uFF09" : "\uFF08\u5386\u53F2\u4F1A\u8BDD\uFF09"}`);
    lines.push(`\u4F1A\u8BDD ID: ${session.id}`);
    lines.push(`\u5F00\u59CB\u65F6\u95F4: ${formatLogSessionTimestamp(session.createdAt)}`);
    lines.push(`\u6700\u540E\u66F4\u65B0: ${formatLogSessionTimestamp(session.updatedAt)}`);
    lines.push(`\u6761\u76EE\u6570: ${session.entryCount || 0}`);
    lines.push("----------------------------------------");
    lines.push(session.content.trimEnd());
    lines.push("");
  });
  lines.push("========================================");
  lines.push("\u65E5\u5FD7\u5BFC\u51FA\u7ED3\u675F");
  lines.push("========================================");
  return lines.join("\n");
}

function checkSendBuClass() {
  const sendButton = document.getElementById("send_but");
  const stopButton = document.getElementById("mes_stop");
  const isSendHidden = !sendButton || getComputedStyle(sendButton).display === "none";
  const isStopVisible = stopButton && getComputedStyle(stopButton).display !== "none";
  return isSendHidden || isStopVisible;
}

function isPluginEnabled() {
  const scriptEnabled = extension_settings[extensionName]?.scriptEnabled;
  return scriptEnabled === true || scriptEnabled === "true";
}

function stringToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(
    bytes,
    (byte) => String.fromCodePoint(byte)
  ).join("");
  return btoa(binString);
}

function getsdAuth() {
  return `Basic ${stringToBase64(extension_settings[extensionName].st_chatu8_sd_auth)}`;
}

async function getSDMode(sdurl) {
  try {
    const url = new URL(sdurl);
    url.pathname = "/sdapi/v1/options";
    const result = await fetch(url, {
      method: "GET",
      headers: { "Authorization": getsdAuth() }
    });
    if (!result.ok) {
      const errorText = await result.text();
      throw new Error(`\u83B7\u53D6 SD \u9009\u9879\u5931\u8D25\uFF0C\u72B6\u6001\u7801: ${result.status}, \u54CD\u5E94: ${errorText}`);
    }
    const data = await result.json();
    const model = data["sd_model_checkpoint"];
    addLog(`\u5F53\u524D SD \u6A21\u578B: ${model}`);
    return model;
  } catch (error) {
    addLog(`\u83B7\u53D6 SD \u6A21\u578B\u5931\u8D25: ${error.message}`);
    throw error;
  }
}

async function setSDMode(sdurl, model) {
  try {
    async function getProgress(sdurl2) {
      const url2 = new URL(sdurl2);
      url2.pathname = "/sdapi/v1/progress";
      const result2 = await fetch(url2, {
        method: "GET",
        headers: { "Authorization": getsdAuth() }
      });
      return await result2.json();
    }
    toastr.info(`\u6B63\u5728\u5207\u6362\u6A21\u578B...\u4E3A${model}`);
    addLog(`\u5F00\u59CB\u5207\u6362 SD \u6A21\u578B\u4E3A: ${model}`);
    const url = new URL(sdurl);
    url.pathname = "/sdapi/v1/options";
    const options = {
      sd_model_checkpoint: model
    };
    const result = await fetch(url, {
      method: "POST",
      body: JSON.stringify(options),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!result.ok) {
      const errorText = await result.text();
      addLog(`\u5207\u6362 SD \u6A21\u578B API \u8BF7\u6C42\u5931\u8D25\u3002\u72B6\u6001\u7801: ${result.status}, \u54CD\u5E94: ${errorText}`);
      throw new Error(`SD WebUI returned an error. Status: ${result.status}`);
    }
    const MAX_ATTEMPTS = 10;
    const CHECK_INTERVAL = 2e3;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const progressState = await getProgress(sdurl);
      const progress = progressState["progress"];
      const jobCount = progressState["state"]["job_count"];
      if (progress === 0 && jobCount === 0) {
        break;
      }
      console.info(`Waiting for SD WebUI to finish model loading... Progress: ${progress}; Job count: ${jobCount}`);
      await delay(CHECK_INTERVAL);
    }
    toastr.info(`\u5207\u6362\u6A21\u578B\u6210\u529F...\u4E3A${model}`);
    addLog(`SD model switched to: ${model}`);
  } catch (error) {
    addLog(`\u5207\u6362 SD \u6A21\u578B\u5931\u8D25: ${error.message}`);
    toastr.error(`\u5207\u6362\u6A21\u578B\u5931\u8D25: ${error.message}`);
    throw error;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function deepMerge(target, source) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

async function processReferenceImage(inputBase64) {
  addLog("\u5F00\u59CB\u5904\u7406\u53C2\u8003\u56FE...");
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function() {
      const originalWidth = img.width;
      const originalHeight = img.height;
      const aspectRatio = originalWidth / originalHeight;
      addLog(`\u53C2\u8003\u56FE\u539F\u59CB\u5C3A\u5BF8: ${originalWidth}x${originalHeight}, \u5BBD\u9AD8\u6BD4: ${aspectRatio.toFixed(2)}`);
      const targetSizes = [
        { width: 1024, height: 1536, ratio: 1024 / 1536 },
        // 竖图
        { width: 1472, height: 1472, ratio: 1 },
        // 方图
        { width: 1536, height: 1024, ratio: 1536 / 1024 }
        // 横图
      ];
      let selectedSize = targetSizes[0];
      let minDiff = Math.abs(aspectRatio - targetSizes[0].ratio);
      for (let i = 1; i < targetSizes.length; i++) {
        const diff = Math.abs(aspectRatio - targetSizes[i].ratio);
        if (diff < minDiff) {
          minDiff = diff;
          selectedSize = targetSizes[i];
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = selectedSize.width;
      canvas.height = selectedSize.height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, selectedSize.width, selectedSize.height);
      addLog(`\u6B63\u5728\u7F29\u653E\u53C2\u8003\u56FE...`);
      let processedBase64;
      if (isMobileDevice()) {
        processedBase64 = canvas.toDataURL("image/jpeg", 0.3).replace(/^data:image\/jpeg;base64,/, "");
      } else {
        processedBase64 = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      }
      resolve(processedBase64);
    };
    img.onerror = (err) => {
      const errorMessage = err instanceof Error ? err.message : "\u672A\u77E5\u9519\u8BEF";
      addLog(`\u53C2\u8003\u56FE\u52A0\u8F7D\u5931\u8D25: ${errorMessage}`);
      reject(new Error("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25"));
    };
    let imgSrc = inputBase64;
    if (inputBase64 && !inputBase64.startsWith("data:image")) {
      addLog("\u8F93\u5165\u4E3A\u539F\u59CBbase64\uFF0C\u6B63\u5728\u6DFB\u52A0Data URL\u524D\u7F00...");
      imgSrc = "data:image/png;base64," + inputBase64;
    }
    img.src = imgSrc;
  });
}

function calculateSkipCfgAboveSigma(width, height, modelName) {
  addLog(`\u8BA1\u7B97 skip_cfg_above_sigma... \u5BBD\u5EA6: ${width}, \u9AD8\u5EA6: ${height}, \u6A21\u578B: ${modelName}`);
  const magicConstant = modelName?.includes("nai-diffusion-4-5") ? SIGMA_MAGIC_NUMBER_V4_5 : SIGMA_MAGIC_NUMBER;
  addLog(`\u4F7F\u7528\u7684 magicConstant: ${magicConstant}`);
  const pixelCount = width * height;
  const ratio = pixelCount / REFERENCE_PIXEL_COUNT;
  addLog(`\u50CF\u7D20: ${pixelCount}, \u6BD4\u4F8B: ${ratio.toFixed(4)}`);
  const result = Math.pow(ratio, 0.5) * magicConstant;
  addLog(`\u8BA1\u7B97\u7ED3\u679C skip_cfg_above_sigma: ${result}`);
  return result;
}

function getBaseTag(tag) {
  let base = tag.toLowerCase();
  let prev;
  do {
    prev = base;
    base = base.replace(/^[([{<]+/, "");
    base = base.replace(/[)\]}>]+$/, "");
    base = base.replace(/^[\d.]+::/, "");
    base = base.replace(/::$/, "");
    base = base.replace(/:(?:\d*\.\d+|\d+)$/, "");
    base = base.trim();
  } while (base !== prev);
  return base;
}

function hasWeight(tag) {
  return tag.toLowerCase() !== getBaseTag(tag);
}

function deduplicateTags(tagString) {
  if (!tagString || typeof tagString !== "string") {
    return "";
  }
  const placeholders = [];
  let tempString = tagString.replace(/\$([^$]+)\$/g, (match) => {
    placeholders.push(match);
    return `__ST_JSON_TAG_${placeholders.length - 1}__`;
  });
  const tags = tempString.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  if (tags.length === 0) {
    return "";
  }
  const uniqueTags = /* @__PURE__ */ new Map();
  for (let tag of tags) {
    tag = tag.replace(/__ST_JSON_TAG_(\d+)__/g, (m, idx) => placeholders[parseInt(idx)]);
    const baseTag = getBaseTag(tag);
    if (!uniqueTags.has(baseTag)) {
      uniqueTags.set(baseTag, tag);
    } else {
      const existingTag = uniqueTags.get(baseTag);
      const isNewWeighted = hasWeight(tag);
      const isExistingWeighted = hasWeight(existingTag);
      if (!isExistingWeighted && isNewWeighted) {
        uniqueTags.set(baseTag, tag);
      }
    }
  }
  const result = Array.from(uniqueTags.values()).join(", ");
  if (tags.length !== uniqueTags.size) {
    addLog(`[\u53BB\u91CD] ${tags.length} \u4E2A\u6807\u7B7E \u2192 ${uniqueTags.size} \u4E2A\u6807\u7B7E (\u79FB\u9664 ${tags.length - uniqueTags.size} \u4E2A\u91CD\u590D)`);
  }
  return result;
}

function getSortedCharacterIds(promptData) {
  if (!promptData || typeof promptData !== "object") return [];
  const ids = Object.keys(promptData).map((k) => {
    const m = k.match(/^Character\s+(\d+)\s+Prompt$/i);
    return m ? parseInt(m[1], 10) : null;
  }).filter((id) => id !== null && promptData[`Character ${id} Prompt`]);
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

function parsePromptStringWithCoordinates(promptString) {
  addLog(`\u89E3\u6790\u573A\u666F\u6784\u56FE\u5B57\u7B26\u4E32: ${promptString}`);
  const result = {
    "Scene Composition": ""
  };
  if (!promptString || typeof promptString !== "string") {
    return result;
  }
  const sceneMatch = promptString.match(/Scene Composition:([\s\S]*?);/i);
  if (sceneMatch) {
    result["Scene Composition"] = deduplicateTags(sceneMatch[1].trim());
  }
  const promptRegex = /Character\s+(\d+)\s+Prompt:([\s\S]*?)(?:\s*\|\s*centers\s*:\s*([^;]+?))?\s*;/gi;
  let match;
  while ((match = promptRegex.exec(promptString)) !== null) {
    const charId = parseInt(match[1], 10);
    const promptContent = match[2] ? deduplicateTags(match[2].trim()) : "";
    result[`Character ${charId} Prompt`] = promptContent;
    if (match[3]) {
      const centersStr = match[3].trim();
      result[`Character ${charId} centers`] = centersStr;
      result[`Character ${charId} coordinates`] = centersToCoordinates(centersStr);
    } else if (!result[`Character ${charId} coordinates`]) {
      result[`Character ${charId} coordinates`] = {};
    }
  }
  const ucRegex = /Character\s+(\d+)\s+UC:([\s\S]*?);/gi;
  let ucMatch;
  while ((ucMatch = ucRegex.exec(promptString)) !== null) {
    const charId = parseInt(ucMatch[1], 10);
    result[`Character ${charId} UC`] = ucMatch[2] ? ucMatch[2].trim() : "";
  }
  addLog(`\u89E3\u6790\u7ED3\u679C: ${JSON.stringify(result, null, 2)}`);
  return result;
}

function centersToCoordinates(centers) {
  if (!centers || typeof centers !== "string") return {};
  const trimmed = centers.trim();
  try {
    if (trimmed.startsWith("[") && trimmed.endsWith("]") || trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsedJson = JSON.parse(trimmed);
      if (Array.isArray(parsedJson) && parsedJson.length >= 2) {
        const x = parseFloat(parsedJson[0]);
        const y = parseFloat(parsedJson[1]);
        if (!isNaN(x) && !isNaN(y)) {
          return {
            x: Number(Math.min(1, Math.max(0, x)).toFixed(3)),
            y: Number(Math.min(1, Math.max(0, y)).toFixed(3))
          };
        }
      } else if (parsedJson && typeof parsedJson === "object") {
        const x = parseFloat(parsedJson.x ?? parsedJson.X);
        const y = parseFloat(parsedJson.y ?? parsedJson.Y);
        if (!isNaN(x) && !isNaN(y)) {
          return {
            x: Number(Math.min(1, Math.max(0, x)).toFixed(3)),
            y: Number(Math.min(1, Math.max(0, y)).toFixed(3))
          };
        }
      }
    }
  } catch (_) {
  }
  const coordMatch = trimmed.match(/^[\[\{\(\s]*(?:['"]?x['"]?\s*[:=]\s*)?([-+]?[0-9.]+)\s*[,，\s]\s*(?:['"]?y['"]?\s*[:=]\s*)?([-+]?[0-9.]+)[\]\}\)\s]*$/i);
  if (coordMatch) {
    const x = parseFloat(coordMatch[1]);
    const y = parseFloat(coordMatch[2]);
    if (!isNaN(x) && !isNaN(y)) {
      const clampedX = Math.min(1, Math.max(0, x));
      const clampedY = Math.min(1, Math.max(0, y));
      return {
        x: Number(clampedX.toFixed(3)),
        y: Number(clampedY.toFixed(3))
      };
    }
  }
  const match = trimmed.match(/([a-e])([1-5])/i);
  if (!match) return {};
  const column = match[1].toLowerCase();
  const row = parseInt(match[2], 10);
  const columnMap = {
    "a": 0.1,
    "b": 0.3,
    "c": 0.5,
    "d": 0.7,
    "e": 0.9
  };
  const rowMap = {
    1: 0.1,
    2: 0.3,
    3: 0.5,
    4: 0.7,
    5: 0.9
  };
  return {
    x: columnMap[column] || 0.5,
    y: rowMap[row] || 0.5
  };
}

function removeTrailingSlash(str) {
  return str.endsWith("/") ? str.slice(0, -1) : str;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function acquireSerialLock(taskId, signal = null) {
  return serialLock.acquire(taskId, signal);
}

function releaseSerialLock(taskId, intervalMs = 0) {
  serialLock.release(taskId, intervalMs);
}

function cancelSerialLock(taskId) {
  serialLock.remove(taskId);
}

function resetSerialLock() {
  serialLock.reset();
}

function acquireComfyUILock(taskId, signal = null) {
  return comfyuiConcurrencyLock.acquire(taskId, signal);
}

function releaseComfyUILock(taskId) {
  comfyuiConcurrencyLock.release(taskId);
}

function cancelComfyUILock(taskId) {
  comfyuiConcurrencyLock.remove(taskId);
}

function addSmoothShakeEffect(imgElement) {
  if (getComputedStyle(imgElement).position === "static") {
    imgElement.style.position = "relative";
  }
  const startTime = Date.now();
  const duration = 300;
  const amplitude = 3;
  function shake() {
    const elapsed = Date.now() - startTime;
    if (elapsed < duration) {
      const offset = amplitude * Math.sin(elapsed / duration * Math.PI * 10);
      imgElement.style.left = `${offset}px`;
      requestAnimationFrame(shake);
    } else {
      imgElement.style.left = "0px";
    }
  }
  requestAnimationFrame(shake);
}

function generateRandomSeed() {
  return Math.floor(Math.random() * 1e10);
}

function isPluginToastDisabled() {
  const settings3 = extension_settings?.[extensionName];
  return settings3?.disablePluginToast === "true" || settings3?.disablePluginToast === true;
}

function getRandomYusheId(modeKey) {
  const settings3 = extension_settings[extensionName];
  if (settings3.randomYushe !== "true") {
    return settings3[modeKey];
  }
  const yushe = settings3.yushe;
  if (!yushe || typeof yushe !== "object") {
    return settings3[modeKey];
  }
  const keys = Object.keys(yushe);
  if (keys.length === 0) {
    return settings3[modeKey];
  }
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  addLog(`[\u968F\u673A\u9884\u8BBE] \u4ECE ${keys.length} \u4E2A\u9884\u8BBE\u4E2D\u968F\u673A\u9009\u4E2D: "${randomKey}" (\u539F\u9884\u8BBE: "${settings3[modeKey]}")`);
  if (!isPluginToastDisabled()) {
    toastr.info(`\u968F\u673A\u9009\u4E2D\u9884\u8BBE: "${randomKey}"`, "\u968F\u673A\u63D0\u793A\u8BCD\u9884\u8BBE");
  }
  return randomKey;
}

function getRandomVibeGroupId() {
  const settings3 = extension_settings[extensionName];
  const currentId = settings3.vibeGroupId;
  if (settings3.randomVibeGroup !== "true") {
    return currentId;
  }
  const vibeGroups = settings3.vibeGroups;
  if (!vibeGroups || typeof vibeGroups !== "object") {
    return currentId;
  }
  const keys = Object.keys(vibeGroups).filter(
    (key) => Array.isArray(vibeGroups[key]?.vibes) && vibeGroups[key].vibes.length > 0
  );
  if (keys.length === 0) {
    addLog("[\u968F\u673AVibe\u7EC4] \u6CA1\u6709\u53EF\u7528\u7684\u975E\u7A7A Vibe \u7EC4\uFF0C\u56DE\u9000\u5230\u5F53\u524D\u9009\u4E2D\u7684\u7EC4");
    return currentId;
  }
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  addLog(`[\u968F\u673AVibe\u7EC4] \u4ECE ${keys.length} \u4E2A\u975E\u7A7A\u7EC4\u4E2D\u968F\u673A\u9009\u4E2D: "${randomKey}" (\u539F\u7EC4: "${currentId}")`);
  if (!isPluginToastDisabled()) {
    toastr.info(`\u968F\u673A\u9009\u4E2D Vibe \u7EC4: "${randomKey}"`, "\u968F\u673A Vibe \u7EC4");
  }
  return randomKey;
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isMobileDeviceDialog() {
  return window.top.innerWidth <= 768 || isMobileDevice();
}

function clampPopupToViewport(bubble, win = window) {
  requestAnimationFrame(() => {
    try {
      const viewportHeight = win.visualViewport?.height || win.innerHeight;
      const rect = bubble.getBoundingClientRect();
      if (rect.top >= 8 && rect.bottom <= viewportHeight + 8) return;
      bubble.style.position = "fixed";
      bubble.style.top = "8px";
      bubble.style.left = "50%";
      bubble.style.transform = "translateX(-50%)";
      bubble.style.margin = "0";
      bubble.style.maxHeight = `${Math.max(200, viewportHeight - 24)}px`;
      bubble.style.overflowY = "auto";
    } catch (e) {
      console.warn("[st-chatu8] \u5F39\u7A97\u89C6\u53E3\u94B3\u5236\u5931\u8D25:", e);
    }
  });
}

async function zhengmian(fixedPrompt, mainPrompt, fixedPrompt_end, aqt, insertions) {
  fixedPrompt = await stripChineseAnnotations(fixedPrompt);
  mainPrompt = await stripChineseAnnotations(mainPrompt);
  fixedPrompt_end = await stripChineseAnnotations(fixedPrompt_end);
  aqt = await stripChineseAnnotations(aqt);
  addLog(`\u7EC4\u5408\u6B63\u9762\u63D0\u793A\u8BCD (\u590D\u6742\u89C4\u5219):`);
  addLog(`  - \u524D\u7F6E\u524D: ${insertions["\u524D\u7F6E\u524D"]}`);
  addLog(`  - \u56FA\u5B9A\u63D0\u793A\u8BCD (\u524D): ${fixedPrompt}`);
  addLog(`  - \u524D\u7F6E\u540E: ${insertions["\u524D\u7F6E\u540E"]}`);
  addLog(`  - \u4E3B\u8981\u63D0\u793A\u8BCD: ${mainPrompt}`);
  addLog(`  - \u540E\u7F6E\u524D: ${insertions["\u540E\u7F6E\u524D"]}`);
  addLog(`  - \u56FA\u5B9A\u63D0\u793A\u8BCD (\u540E): ${fixedPrompt_end}`);
  addLog(`  - \u540E\u7F6E\u540E: ${insertions["\u540E\u7F6E\u540E"]}`);
  addLog(`  - \u8D28\u91CF\u6807\u7B7E (AQT): ${aqt}`);
  addLog(`  - \u6700\u540E\u7F6E: ${insertions["\u6700\u540E\u7F6E"]}`);
  const parts = [
    insertions["\u524D\u7F6E\u524D"],
    fixedPrompt,
    insertions["\u524D\u7F6E\u540E"],
    mainPrompt,
    insertions["\u540E\u7F6E\u524D"],
    fixedPrompt_end,
    insertions["\u540E\u7F6E\u540E"],
    aqt,
    insertions["\u6700\u540E\u7F6E"]
  ];
  const finalPrompt = parts.filter((p) => p && p.trim()).join(", ");
  addLog(`\u7EC4\u5408\u540E\u7684\u6B63\u9762\u63D0\u793A\u8BCD: ${finalPrompt}`);
  return finalPrompt;
}

async function fumian(text, UCP) {
  text = await stripChineseAnnotations(text);
  addLog(`\u7EC4\u5408\u8D1F\u9762\u63D0\u793A\u8BCD:`);
  addLog(`  - \u56FA\u5B9A\u8D1F\u9762\u63D0\u793A\u8BCD: ${text}`);
  addLog(`  - UCP \u8D1F\u9762\u63D0\u793A\u8BCD: ${UCP}`);
  let finalNegativePrompt;
  if (text === "") {
    finalNegativePrompt = UCP;
  } else if (UCP === "") {
    finalNegativePrompt = text;
  } else {
    finalNegativePrompt = UCP + ", " + text;
  }
  if (finalNegativePrompt) {
    let tags = finalNegativePrompt.split(",").map((t) => t.trim()).filter(Boolean);
    const nsfwIndex = tags.findIndex((t) => t.toLowerCase() === "nsfw");
    if (nsfwIndex !== -1) {
      tags = tags.filter((t) => t.toLowerCase() !== "nsfw");
      tags.unshift("nsfw");
      finalNegativePrompt = tags.join(", ");
    }
  }
  addLog(`\u7EC4\u5408\u540E\u7684\u8D1F\u9762\u63D0\u793A\u8BCD: ${finalNegativePrompt}`);
  return finalNegativePrompt;
}

function extractIfCondition(rawValue) {
  if (typeof rawValue !== "string") return { value: rawValue, condition: null };
  const trimmedRight = rawValue.replace(/\s+$/, "");
  if (!trimmedRight.endsWith(")")) return { value: rawValue, condition: null };
  let depth = 0;
  let openIdx = -1;
  for (let i = trimmedRight.length - 1; i >= 0; i--) {
    const ch = trimmedRight[i];
    if (ch === ")") depth++;
    else if (ch === "(") {
      depth--;
      if (depth === 0) {
        openIdx = i;
        break;
      }
    }
  }
  if (openIdx <= 0) return { value: rawValue, condition: null };
  const head = trimmedRight.substring(0, openIdx);
  const m = head.match(/@if\s*$/i);
  if (!m) return { value: rawValue, condition: null };
  const condition = trimmedRight.substring(openIdx + 1, trimmedRight.length - 1).trim();
  if (!condition) return { value: rawValue, condition: null };
  const valuePart = head.substring(0, head.length - m[0].length).replace(/\s+$/, "");
  return { value: valuePart, condition };
}

function evaluateCondition(expr, haystack) {
  const src = String(expr);
  const hay = String(haystack).toLowerCase();
  let pos = 0;
  const skipWs = () => {
    while (pos < src.length && /\s/.test(src[pos])) pos++;
  };
  const parseOr = () => {
    let left = parseAnd();
    skipWs();
    while (src.startsWith("||", pos)) {
      pos += 2;
      const right = parseAnd();
      left = left || right;
      skipWs();
    }
    return left;
  };
  const parseAnd = () => {
    let left = parseUnary();
    skipWs();
    while (src.startsWith("&&", pos)) {
      pos += 2;
      const right = parseUnary();
      left = left && right;
      skipWs();
    }
    return left;
  };
  const parseUnary = () => {
    skipWs();
    if (src[pos] === "!") {
      pos++;
      return !parseUnary();
    }
    return parsePrimary();
  };
  const parsePrimary = () => {
    skipWs();
    if (src[pos] === "(") {
      pos++;
      const v = parseOr();
      skipWs();
      if (src[pos] === ")") pos++;
      else throw new Error("@if \u8868\u8FBE\u5F0F\u7F3A\u5C11\u53F3\u62EC\u53F7");
      return v;
    }
    if (src[pos] === '"') {
      pos++;
      let buf = "";
      while (pos < src.length && src[pos] !== '"') {
        if (src[pos] === "\\" && pos + 1 < src.length) {
          buf += src[pos + 1];
          pos += 2;
        } else buf += src[pos++];
      }
      if (src[pos] !== '"') throw new Error("@if \u8868\u8FBE\u5F0F\u7F3A\u5C11\u53F3\u5F15\u53F7");
      pos++;
      return hay.includes(buf.toLowerCase());
    }
    let start = pos;
    while (pos < src.length) {
      const ch = src[pos];
      if (ch === "(" || ch === ")" || ch === "!" || /\s/.test(ch)) break;
      if (ch === "&" && src[pos + 1] === "&" || ch === "|" && src[pos + 1] === "|") break;
      pos++;
    }
    const word = src.substring(start, pos).trim();
    if (!word) throw new Error("@if \u8868\u8FBE\u5F0F\u5B58\u5728\u7A7A\u7684\u89E6\u53D1\u8BCD");
    return hay.includes(word.toLowerCase());
  };
  const result = parseOr();
  skipWs();
  if (pos < src.length) throw new Error(`@if \u8868\u8FBE\u5F0F\u5B58\u5728\u672A\u89E3\u6790\u7247\u6BB5: "${src.substring(pos)}"`);
  return result;
}

function safeEvaluateIf(condition, haystack, ctxLabel = "") {
  try {
    return evaluateCondition(condition, haystack);
  } catch (e) {
    addLog(`${ctxLabel}@if \u6761\u4EF6\u89E3\u6790\u5931\u8D25\uFF0C\u8DF3\u8FC7\u8BE5\u89C4\u5219\u3002\u8868\u8FBE\u5F0F: "${condition}"\uFF0C\u9519\u8BEF: ${e.message}`);
    return false;
  }
}

function parseReWrapper(str) {
  if (typeof str !== "string") return { isRe: false, content: str };
  const trimmed = str.trim();
  const match = trimmed.match(/^re\s*\(([\s\S]*)\)$/i);
  if (!match) return { isRe: false, content: str };
  return { isRe: true, content: match[1] };
}

function splitRuleLine(line) {
  if (!line || typeof line !== "string") return null;
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (/^re\s*\(/i.test(trimmed)) {
    let parenDepth = 0;
    let inBracket = false;
    let reEndIndex = -1;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === "\\") {
        i++;
        continue;
      }
      if (inBracket) {
        if (ch === "]") inBracket = false;
        continue;
      }
      if (ch === "[") {
        inBracket = true;
      } else if (ch === "(") {
        parenDepth++;
      } else if (ch === ")") {
        parenDepth--;
        if (parenDepth === 0) {
          reEndIndex = i;
          break;
        }
      }
    }
    if (reEndIndex !== -1) {
      const equalIndex = trimmed.indexOf("=", reEndIndex + 1);
      if (equalIndex !== -1) {
        const trigger2 = trimmed.substring(0, equalIndex).trim();
        const ruleContent2 = trimmed.substring(equalIndex + 1).trim();
        return [trigger2, ruleContent2];
      }
    }
  }
  const firstEqual = trimmed.indexOf("=");
  if (firstEqual === -1) return null;
  const trigger = trimmed.substring(0, firstEqual).trim();
  const ruleContent = trimmed.substring(firstEqual + 1).trim();
  return [trigger, ruleContent];
}

function applyPromptReplaceRules(originalPrompt, secondArg, rulesText, isBanana, isCharacterMode = false) {
  const logPrefix = isBanana ? isCharacterMode ? "[Banana] \u5206\u89D2\u8272 " : "[Banana] " : isCharacterMode ? "\u5206\u89D2\u8272 " : "";
  addLog(`${logPrefix}\u539F\u59CB Prompt: ${originalPrompt}`);
  if (!rulesText || rulesText.trim() === "") {
    addLog(`${logPrefix}\u65E0\u6709\u6548\u66FF\u6362\u89C4\u5219\uFF0C\u8FD4\u56DE\u539F\u59CB Prompt\u3002`);
    if (isCharacterMode) {
      return originalPrompt;
    }
    return {
      modifiedPrompt: originalPrompt,
      insertions: { "\u524D\u7F6E\u524D": "", "\u524D\u7F6E\u540E": "", "\u540E\u7F6E\u524D": "", "\u540E\u7F6E\u540E": "", "\u6700\u540E\u7F6E": "" }
    };
  }
  if (isCharacterMode && !originalPrompt) {
    return originalPrompt;
  }
  addLog(`${logPrefix}\u4F7F\u7528\u7684\u66FF\u6362\u89C4\u5219\u5185\u5BB9:
${rulesText}`);
  const insertions = { "\u524D\u7F6E\u524D": [], "\u524D\u7F6E\u540E": [], "\u540E\u7F6E\u524D": [], "\u540E\u7F6E\u540E": [], "\u6700\u540E\u7F6E": [] };
  let modifiedPrompt = originalPrompt;
  const fullContext = isCharacterMode ? typeof secondArg === "string" && secondArg.length > 0 ? secondArg : originalPrompt : "";
  const allPrompts = isCharacterMode ? "" : originalPrompt + (typeof secondArg === "string" ? secondArg : "");
  const lines = rulesText.split("\n");
  for (const line of lines) {
    const splitRes = splitRuleLine(line);
    if (!splitRes) continue;
    const [triggerPart, ruleContent] = splitRes;
    if (!triggerPart || !ruleContent || !ruleContent.includes("|")) continue;
    const pipeIndex = ruleContent.indexOf("|");
    const type = ruleContent.substring(0, pipeIndex).trim();
    const rawValue = ruleContent.substring(pipeIndex + 1);
    const { value: realValue, condition } = extractIfCondition(rawValue);
    const triggerRe = parseReWrapper(triggerPart);
    const valRe = parseReWrapper(realValue);
    if (triggerRe.isRe) {
      let regex = null;
      try {
        regex = new RegExp(triggerRe.content, "gi");
      } catch (e) {
        console.warn(`${logPrefix}\u975E\u6CD5\u6B63\u5219\u8868\u8FBE\u5F0F "${triggerRe.content}"\uFF0C\u964D\u7EA7\u4E3A\u5B57\u9762\u91CF\u5339\u914D:`, e);
        regex = new RegExp(triggerRe.content.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      }
      regex.lastIndex = 0;
      if (isCharacterMode) {
        if ((type === "\u66FF\u6362" || type === "\u66FF\u6362\u5206\u89D2\u8272") && regex.test(modifiedPrompt)) {
          regex.lastIndex = 0;
          if (condition && !safeEvaluateIf(condition, fullContext, logPrefix)) {
            addLog(`${logPrefix}@if \u672A\u901A\u8FC7\uFF0C\u8DF3\u8FC7\u89C4\u5219: "${triggerPart}" \u6761\u4EF6="${condition}"`);
            continue;
          }
          if (condition) addLog(`${logPrefix}@if \u901A\u8FC7: "${triggerPart}" \u6761\u4EF6="${condition}"`);
          addLog(`${logPrefix}Prompt \u66FF\u6362 (\u6B63\u5219): "${triggerPart}" -> "${realValue}"`);
          if (valRe.isRe) {
            modifiedPrompt = modifiedPrompt.replace(regex, valRe.content);
          } else {
            modifiedPrompt = modifiedPrompt.replace(regex, () => valRe.content);
          }
          regex.lastIndex = 0;
        }
      } else {
        if (regex.test(allPrompts)) {
          regex.lastIndex = 0;
          if (condition && !safeEvaluateIf(condition, allPrompts, logPrefix)) {
            addLog(`${logPrefix}@if \u672A\u901A\u8FC7\uFF0C\u8DF3\u8FC7\u89C4\u5219: "${triggerPart}" \u6761\u4EF6="${condition}"`);
            continue;
          }
          if (condition) addLog(`${logPrefix}@if \u901A\u8FC7: "${triggerPart}" \u6761\u4EF6="${condition}"`);
          if (type === "\u66FF\u6362") {
            addLog(`${logPrefix}Prompt \u66FF\u6362 (\u6B63\u5219): "${triggerPart}" -> "${realValue}"`);
            if (valRe.isRe) {
              modifiedPrompt = modifiedPrompt.replace(regex, valRe.content);
            } else {
              modifiedPrompt = modifiedPrompt.replace(regex, () => valRe.content);
            }
            regex.lastIndex = 0;
          } else if (insertions.hasOwnProperty(type)) {
            regex.lastIndex = 0;
            const matches = [...allPrompts.matchAll(regex)];
            regex.lastIndex = 0;
            for (const match of matches) {
              let itemContent = valRe.content;
              if (valRe.isRe) {
                itemContent = valRe.content.replace(/\$([0-9]+|&)/g, (full, g) => {
                  if (g === "&" || g === "0") return match[0] || "";
                  const idx = parseInt(g, 10);
                  return match[idx] !== void 0 ? match[idx] : full;
                });
              }
              addLog(`${logPrefix}\u53D1\u73B0\u63D2\u5165 (\u6B63\u5219\u5C55\u5F00): \u7C7B\u578B="${type}", \u5339\u914D="${match[0]}", \u5185\u5BB9="${itemContent}"`);
              insertions[type].push(itemContent);
            }
          }
        }
      }
      regex.lastIndex = 0;
    } else {
      const triggers = triggerPart.split("|").map((t) => t.trim()).filter(Boolean);
      for (const t of triggers) {
        if (isCharacterMode) {
          if ((type === "\u66FF\u6362" || type === "\u66FF\u6362\u5206\u89D2\u8272") && modifiedPrompt.toLowerCase().includes(t.toLowerCase())) {
            if (condition && !safeEvaluateIf(condition, fullContext, logPrefix)) {
              addLog(`${logPrefix}@if \u672A\u901A\u8FC7\uFF0C\u8DF3\u8FC7\u89C4\u5219: "${t}" \u6761\u4EF6="${condition}"`);
              continue;
            }
            if (condition) addLog(`${logPrefix}@if \u901A\u8FC7: "${t}" \u6761\u4EF6="${condition}"`);
            addLog(`${logPrefix}Prompt \u66FF\u6362: "${t}" -> "${realValue}"`);
            const regex = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
            if (valRe.isRe) {
              modifiedPrompt = modifiedPrompt.replace(regex, valRe.content);
            } else {
              modifiedPrompt = modifiedPrompt.replace(regex, () => valRe.content);
            }
          }
        } else {
          if (allPrompts.toLowerCase().includes(t.toLowerCase())) {
            if (condition && !safeEvaluateIf(condition, allPrompts, logPrefix)) {
              addLog(`${logPrefix}@if \u672A\u901A\u8FC7\uFF0C\u8DF3\u8FC7\u89C4\u5219: "${t}" \u6761\u4EF6="${condition}"`);
              continue;
            }
            if (condition) addLog(`${logPrefix}@if \u901A\u8FC7: "${t}" \u6761\u4EF6="${condition}"`);
            if (type === "\u66FF\u6362") {
              addLog(`${logPrefix}Prompt \u66FF\u6362: "${t}" -> "${realValue}"`);
              const regex = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
              if (valRe.isRe) {
                modifiedPrompt = modifiedPrompt.replace(regex, valRe.content);
              } else {
                modifiedPrompt = modifiedPrompt.replace(regex, () => valRe.content);
              }
            } else if (insertions.hasOwnProperty(type)) {
              addLog(`${logPrefix}\u53D1\u73B0\u63D2\u5165: \u7C7B\u578B="${type}", \u89E6\u53D1\u8BCD="${t}", \u5185\u5BB9="${realValue}"`);
              insertions[type].push(realValue);
            }
          }
        }
      }
    }
  }
  if (isCharacterMode) {
    addLog(`${logPrefix}\u66FF\u6362\u540E\u7684 Prompt: ${modifiedPrompt}`);
    return modifiedPrompt;
  }
  const finalInsertions = {};
  for (const key in insertions) {
    finalInsertions[key] = insertions[key].join(", ");
  }
  addLog(`${logPrefix}\u66FF\u6362/\u5220\u9664\u540E\u7684 Prompt: ${modifiedPrompt}`);
  addLog(`${logPrefix}\u89E3\u6790\u51FA\u7684\u63D2\u5165\u5185\u5BB9: ${JSON.stringify(finalInsertions)}`);
  return { modifiedPrompt, insertions: finalInsertions };
}

async function prompt_replace(originalPrompt, other_prompt = "") {
  const prompt_replace_id = extension_settings[extensionName].prompt_replace_id;
  const prompt_replace_texts = extension_settings[extensionName].prompt_replace;
  const rulesText = prompt_replace_texts?.[prompt_replace_id]?.text ?? "";
  return applyPromptReplaceRules(originalPrompt, other_prompt, rulesText, false, false);
}

async function prompt_replace_banana(originalPrompt, other_prompt = "") {
  const bananaSettings = extension_settings[extensionName].banana || {};
  const prompt_replace_id = bananaSettings.prompt_replace_id || "\u9ED8\u8BA4";
  const prompt_replace_texts = bananaSettings.prompt_replace || {};
  const rulesText = prompt_replace_texts?.[prompt_replace_id]?.text ?? "";
  return applyPromptReplaceRules(originalPrompt, other_prompt, rulesText, true, false);
}

function prompt_replace_for_character(originalPrompt, fullContext) {
  const prompt_replace_id = extension_settings[extensionName].prompt_replace_id;
  const prompt_replace_texts = extension_settings[extensionName].prompt_replace;
  const rulesText = prompt_replace_texts?.[prompt_replace_id]?.text ?? "";
  return applyPromptReplaceRules(originalPrompt, fullContext, rulesText, false, true);
}

function prompt_replace_banana_for_character(originalPrompt, fullContext) {
  const bananaSettings = extension_settings[extensionName].banana || {};
  const prompt_replace_id = bananaSettings.prompt_replace_id || "\u9ED8\u8BA4";
  const prompt_replace_texts = bananaSettings.prompt_replace || {};
  const rulesText = prompt_replace_texts?.[prompt_replace_id]?.text ?? "";
  return applyPromptReplaceRules(originalPrompt, fullContext, rulesText, true, true);
}

function getRequestHeaders(token2) {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": token2
  };
}

async function countTokens(messages, model) {
  try {
    if (!model) {
      const { extension_settings: es } = await import("../../../../../extensions.js");
      const settings3 = es?.["st-chatu8"];
      const profileName = settings3?.current_llm_profile || "\u9ED8\u8BA4";
      model = settings3?.llm_profiles?.[profileName]?.model || "gpt-4";
    }
    const url = `/api/tokenizers/openai/count?model=${encodeURIComponent(model)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: getRequestHeaders(window.token),
      body: JSON.stringify(messages)
    });
    if (!response.ok) {
      console.error(`[countTokens] \u8BF7\u6C42\u5931\u8D25: ${response.status} ${response.statusText}`);
      return -1;
    }
    const data = await response.json();
    return data.token_count ?? -1;
  } catch (err) {
    console.error("[countTokens] \u7EDF\u8BA1 token \u5931\u8D25:", err);
    return -1;
  }
}

function _flushLogDomUpdate() {
  _logDomLastUpdate = Date.now();
  const logTextarea = document.getElementById("ch-log-textarea");
  if (!logTextarea) return;
  const MAX_LOG_LENGTH = 45e3;
  const TRIM_TARGET_LENGTH = 38e3;
  let displayLog = getLog();
  if (!_logInitialized && _pendingLogBuffer.length > 0) {
    displayLog = (displayLog || "") + _pendingLogBuffer.join("");
  }
  if (displayLog.length > MAX_LOG_LENGTH) {
    let trimmedVal = displayLog.substring(displayLog.length - TRIM_TARGET_LENGTH);
    const newlineIdx = trimmedVal.indexOf("\n");
    if (newlineIdx !== -1) trimmedVal = trimmedVal.substring(newlineIdx + 1);
    logTextarea.value = "\uFF08\u524D\u9762\u7684\u65E5\u5FD7\u5DF2\u6298\u53E0\uFF0C\u8BF7\u5BFC\u51FA\u67E5\u770B\u5B8C\u6574\u65E5\u5FD7\uFF09\n" + trimmedVal;
  } else {
    logTextarea.value = displayLog;
  }
  logTextarea.scrollTop = logTextarea.scrollHeight;
}

function scheduleLogDomUpdate(immediate = false) {
  if (immediate) {
    if (_logDomUpdateTimer !== null) {
      clearTimeout(_logDomUpdateTimer);
      _logDomUpdateTimer = null;
    }
    _flushLogDomUpdate();
    return;
  }
  const now = Date.now();
  const elapsed = now - _logDomLastUpdate;
  if (elapsed > 200) {
    if (_logDomUpdateTimer !== null) {
      clearTimeout(_logDomUpdateTimer);
      _logDomUpdateTimer = null;
    }
    _flushLogDomUpdate();
    return;
  }
  if (_logDomUpdateTimer === null) {
    _logDomUpdateTimer = setTimeout(() => {
      _logDomUpdateTimer = null;
      _flushLogDomUpdate();
    }, Math.max(20, 200 - elapsed));
  }
}

function addLog(message) {
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleString();
  const logEntry = `[${timestamp}] ${message}
`;
  if (!_logInitialized) {
    _pendingLogBuffer.push(logEntry);
    if (_pendingLogBuffer.length > 1e3) {
      _pendingLogBuffer = _pendingLogBuffer.slice(-800);
    }
    scheduleLogDomUpdate();
    return;
  }
  if (!extension_settings[extensionName].log) {
    extension_settings[extensionName].log = "";
  }
  extension_settings[extensionName].log += logEntry;
  if (extension_settings[extensionName].log.length > MAX_LOG_STORE_CHARS) {
    let trimmed = extension_settings[extensionName].log.substring(extension_settings[extensionName].log.length - LOG_ROLLING_TRIM_TARGET);
    const newlineIdx = trimmed.indexOf("\n");
    if (newlineIdx !== -1) {
      trimmed = trimmed.substring(newlineIdx + 1);
    }
    extension_settings[extensionName].log = "\uFF08...\u65E9\u671F\u65E5\u5FD7\u5DF2\u81EA\u52A8\u6EDA\u52A8\u622A\u65AD\uFF0C\u4FDD\u7559\u6700\u65B0\u8BE6\u7EC6\u8BCA\u65AD\u8BB0\u5F55...\uFF09\n" + trimmed;
  }
  const state3 = ensureLogStateContainer();
  if (state3.activeSessionId) {
    updateSessionMeta(state3.activeSessionId, (session) => {
      session.updatedAt = getNow();
      session.entryCount = extension_settings[extensionName].log.split("\n").filter(Boolean).length;
    });
  }
  scheduleLogDomUpdate();
  schedulePersist();
}

function clearLog() {
  const oldLog = extension_settings[extensionName].log || "";
  const hasContent = oldLog.trim() !== "";
  const state3 = _logInitialized ? ensureLogStateContainer() : null;
  const oldSessionId = state3?.activeSessionId || null;
  if (_logInitialized && state3 && hasContent) {
    const nextMeta = createSessionMeta();
    state3.activeSessionId = nextMeta.id;
    state3.sessions.push(nextMeta);
  }
  extension_settings[extensionName].log = "";
  if (_logDomUpdateTimer !== null) {
    clearTimeout(_logDomUpdateTimer);
    _logDomUpdateTimer = null;
  }
  const logTextarea = document.getElementById("ch-log-textarea");
  if (logTextarea) {
    logTextarea.value = "";
  }
  if (hasContent && oldSessionId) {
    queueLogPersistence(async () => {
      await initializeLogPersistence();
      const curState = ensureLogStateContainer();
      const oldMeta = (curState.sessions || []).find((s) => s.id === oldSessionId);
      if (oldMeta) {
        await saveLogSessionData(oldSessionId, {
          id: oldSessionId,
          createdAt: oldMeta.createdAt,
          updatedAt: oldMeta.updatedAt,
          entryCount: oldMeta.entryCount || 0,
          content: oldLog
        });
      }
      await persistLogIndex();
    });
  }
}

function clearAllLogs() {
  const state3 = _logInitialized ? ensureLogStateContainer() : null;
  const oldSessionIds = state3 ? [...(state3.sessions || []).map((s) => s.id)] : [];
  if (_logInitialized && state3) {
    const nextMeta = createSessionMeta();
    state3.activeSessionId = nextMeta.id;
    state3.sessions = [nextMeta];
  }
  extension_settings[extensionName].log = "";
  if (_logDomUpdateTimer !== null) {
    clearTimeout(_logDomUpdateTimer);
    _logDomUpdateTimer = null;
  }
  const logTextarea = document.getElementById("ch-log-textarea");
  if (logTextarea) {
    logTextarea.value = "";
  }
  queueLogPersistence(async () => {
    await initializeLogPersistence();
    const curState = ensureLogStateContainer();
    for (const sessionId of oldSessionIds) {
      if (sessionId === curState.activeSessionId) continue;
      try {
        await deleteLogSessionData(sessionId);
      } catch (e) {
        console.warn("[clearAllLogs] \u5220\u9664\u65E7\u4F1A\u8BDD\u5931\u8D25:", sessionId, e);
      }
    }
    await persistLogIndex();
  });
}

function getLog() {
  return extension_settings[extensionName].log || "";
}

async function prepareImageForUpload(input, options = {}) {
  const {
    maxDimension = 1024,
    alignMultiple = 32,
    initialQuality = 0.9,
    maxSizeBytes = 2 * 1024 * 1024,
    fallbackFileName = "reference_image.jpg"
  } = options;
  const img = await loadImage(input);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  if (!origW || !origH) {
    throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u56FE\u7247\u5C3A\u5BF8");
  }
  let targetW = origW;
  let targetH = origH;
  const maxSide = Math.max(origW, origH);
  if (maxSide > maxDimension) {
    if (origW >= origH) {
      targetW = maxDimension;
      targetH = Math.max(alignMultiple, Math.round(origH * (maxDimension / origW) / alignMultiple) * alignMultiple);
    } else {
      targetH = maxDimension;
      targetW = Math.max(alignMultiple, Math.round(origW * (maxDimension / origH) / alignMultiple) * alignMultiple);
    }
  } else {
    targetW = Math.max(alignMultiple, Math.round(origW / alignMultiple) * alignMultiple);
    targetH = Math.max(alignMultiple, Math.round(origH / alignMultiple) * alignMultiple);
  }
  if (targetW > maxDimension) targetW = maxDimension;
  if (targetH > maxDimension) targetH = maxDimension;
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);
  let quality = initialQuality;
  let blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("Canvas \u5BFC\u51FA JPEG \u56FE\u7247\u5931\u8D25");
  }
  while (blob.size > maxSizeBytes && quality > 0.65) {
    quality -= 0.1;
    blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
  }
  let origName = "";
  if (input instanceof File && input.name) {
    origName = input.name;
  } else if (typeof input === "string" && !input.startsWith("data:")) {
    const lastPart = input.split("/").pop()?.split("?")[0];
    if (lastPart) origName = lastPart;
  }
  let outFileName = fallbackFileName;
  if (origName) {
    outFileName = origName.replace(/\.[^/.]+$/, "") + ".jpg";
  }
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  addLog(`[\u56FE\u7247\u9884\u5904\u7406] \u539F\u59CB: ${origW}x${origH} -> \u7F29\u653E: ${targetW}x${targetH} (32\u5BF9\u9F50), \u8D28\u91CF: ${quality.toFixed(2)}, \u4F53\u79EF: ${(blob.size / 1024).toFixed(1)} KB, \u6587\u4EF6: ${outFileName}`);
  return {
    blob,
    fileName: outFileName,
    width: targetW,
    height: targetH,
    dataUrl
  };
}

async function processUploadedImage(file, is = false) {
  try {
    const processed = await prepareImageForUpload(file);
    return processed.dataUrl;
  } catch (e) {
    console.warn("prepareImageForUpload \u5931\u8D25\uFF0C\u56DE\u9000\u5230\u539F\u683C\u5F0F\u8BFB\u53D6:", e);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => resolve(evt.target.result);
      reader.onerror = (err) => reject(new Error("\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25."));
      if (file instanceof Blob || file instanceof File) {
        reader.readAsDataURL(file);
      } else if (typeof file === "string") {
        resolve(file);
      } else {
        reject(new Error("\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B"));
      }
    });
  }
}

async function processUploadedImageToBlob(file) {
  const processed = await prepareImageForUpload(file);
  return processed.blob;
}

function removeThinkingTags(text) {
  if (!text || typeof text !== "string") return text || "";
  let result = text.replace(/<(?:thinking|think|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)\b[^>]*>[\s\S]*?<\/(?:thinking|think|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)>/gi, "");
  result = result.replace(/^[\s\S]*?<\/(?:thinking|think|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)>/i, "");
  return result.trim();
}

function stripChineseAnnotations(text) {
  if (!text) return "";
  let result = text;
  let prevResult;
  do {
    prevResult = result;
    result = result.replace(/（[^（）]*）/g, "");
  } while (result !== prevResult);
  return result;
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function convertImageToJpeg(input) {
  const img = await loadImage(input);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: 0.98
    // 无损
  });
  return blobToDataURL(blob);
}

function loadImage(input) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25"));
    if (input instanceof File || input instanceof Blob) {
      img.src = URL.createObjectURL(input);
    } else if (typeof input === "string") {
      img.src = input;
    } else {
      reject(new Error("\u4E0D\u652F\u6301\u7684\u56FE\u7247\u8F93\u5165\u7C7B\u578B"));
    }
  });
}

function _addToStcoOffsets(data, start, end, delta) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let pos = start;
  while (pos + 8 <= end) {
    const size = view.getUint32(pos);
    if (size < 8 || pos + size > end) break;
    const type = String.fromCharCode(data[pos + 4], data[pos + 5], data[pos + 6], data[pos + 7]);
    if (type === "stco") {
      const count = view.getUint32(pos + 12);
      for (let i = 0; i < count; i++) {
        const p = pos + 16 + i * 4;
        view.setUint32(p, view.getUint32(p) + delta);
      }
    } else if (type === "co64") {
      const count = view.getUint32(pos + 12);
      for (let i = 0; i < count; i++) {
        const p = pos + 16 + i * 8;
        const hi = view.getUint32(p);
        const lo = view.getUint32(p + 4);
        const val = BigInt(hi) << 32n | BigInt(lo >>> 0);
        const nv = val + BigInt(delta);
        view.setUint32(p, Number(nv >> 32n));
        view.setUint32(p + 4, Number(nv & 0xFFFFFFFFn));
      }
    } else if (["trak", "mdia", "minf", "stbl", "edts", "dinf", "udta"].includes(type)) {
      _addToStcoOffsets(data, pos + 8, pos + size, delta);
    }
    pos += size;
  }
}

function _normalizeMp4AudioSampleEntry(moovBytes) {
  let moovView = new DataView(moovBytes.buffer, moovBytes.byteOffset, moovBytes.byteLength);
  let mp4aPos = -1;
  for (let i = 0; i < moovBytes.length - 8; i++) {
    if (moovBytes[i + 4] === 109 && moovBytes[i + 5] === 112 && moovBytes[i + 6] === 52 && moovBytes[i + 7] === 97) {
      mp4aPos = i;
      break;
    }
  }
  if (mp4aPos === -1) return { moovBytes, delta: 0 };
  const mp4aSize = moovView.getUint32(mp4aPos);
  if (mp4aPos + 18 > moovBytes.length) return { moovBytes, delta: 0 };
  const version = moovView.getUint16(mp4aPos + 16);
  if (version !== 1) return { moovBytes, delta: 0 };
  let esdsPos = -1;
  let esdsSize = 0;
  const searchEnd = Math.min(mp4aPos + mp4aSize - 8, moovBytes.length - 8);
  for (let i = mp4aPos; i < searchEnd; i++) {
    if (moovBytes[i + 4] === 101 && moovBytes[i + 5] === 115 && moovBytes[i + 6] === 100 && moovBytes[i + 7] === 115) {
      esdsPos = i;
      esdsSize = moovView.getUint32(i);
      break;
    }
  }
  if (esdsPos === -1 || esdsSize <= 0) return { moovBytes, delta: 0 };
  const newMp4aSize = 36 + esdsSize;
  const newMp4aBytes = new Uint8Array(newMp4aSize);
  newMp4aBytes.set(moovBytes.subarray(mp4aPos, mp4aPos + 36), 0);
  const newMp4aView = new DataView(newMp4aBytes.buffer);
  newMp4aView.setUint32(0, newMp4aSize);
  newMp4aView.setUint16(16, 0);
  newMp4aView.setUint16(18, 0);
  newMp4aView.setUint32(20, 0);
  newMp4aBytes.set(moovBytes.subarray(esdsPos, esdsPos + esdsSize), 36);
  const delta = newMp4aSize - mp4aSize;
  const combined = new Uint8Array(moovBytes.length + delta);
  combined.set(moovBytes.subarray(0, mp4aPos), 0);
  combined.set(newMp4aBytes, mp4aPos);
  combined.set(moovBytes.subarray(mp4aPos + mp4aSize), mp4aPos + newMp4aSize);
  const updatedMoovBytes = combined;
  const updatedView = new DataView(updatedMoovBytes.buffer, updatedMoovBytes.byteOffset, updatedMoovBytes.byteLength);
  const parentTags = ["stsd", "stbl", "minf", "mdia", "trak"];
  for (let i = 0; i < mp4aPos; i++) {
    const tag = String.fromCharCode(updatedMoovBytes[i + 4], updatedMoovBytes[i + 5], updatedMoovBytes[i + 6], updatedMoovBytes[i + 7]);
    if (parentTags.includes(tag)) {
      const curBoxSize = updatedView.getUint32(i);
      if (i + curBoxSize > mp4aPos) {
        updatedView.setUint32(i, curBoxSize + delta);
      }
    }
  }
  updatedView.setUint32(0, updatedMoovBytes.length);
  console.log("[mp4fix] \u5DF2\u6210\u529F\u5C06 QuickTime mp4a version 1 \u89C4\u8303\u5316\u4E3A ISO \u6807\u51C6 version 0\uFF0C\u91CA\u653E\u6DF1\u5C42 esds");
  return { moovBytes: updatedMoovBytes, delta };
}

async function fixMp4Faststart(blob) {
  if (!blob) return blob;
  if (blob.type && !blob.type.includes("mp4") && !blob.type.includes("quicktime") && blob.type.includes("video/")) {
    return blob;
  }
  try {
    if (blob.size && blob.size > 16) {
      const headerBuf = await blob.slice(0, Math.min(8192, blob.size)).arrayBuffer();
      const headerBytes = new Uint8Array(headerBuf);
      const headerView = new DataView(headerBuf);
      let hPos = 0;
      let firstBoxType = "";
      let secondBoxType = "";
      if (hPos + 8 <= headerBytes.length) {
        const b1Size = headerView.getUint32(hPos);
        firstBoxType = String.fromCharCode(headerBytes[hPos + 4], headerBytes[hPos + 5], headerBytes[hPos + 6], headerBytes[hPos + 7]);
        if (b1Size >= 8 && hPos + b1Size + 8 <= headerBytes.length) {
          hPos += b1Size;
          secondBoxType = String.fromCharCode(headerBytes[hPos + 4], headerBytes[hPos + 5], headerBytes[hPos + 6], headerBytes[hPos + 7]);
        }
      }
      if (firstBoxType === "ftyp" && secondBoxType === "moov") {
        let hasMp4aV1 = false;
        for (let i = 0; i < headerBytes.length - 18; i++) {
          if (headerBytes[i + 4] === 109 && headerBytes[i + 5] === 112 && headerBytes[i + 6] === 52 && headerBytes[i + 7] === 97) {
            const v = headerView.getUint16(i + 16);
            if (v === 1) hasMp4aV1 = true;
            break;
          }
        }
        if (!hasMp4aV1) {
          return blob;
        }
      }
    }
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const boxes = [];
    let pos = 0;
    while (pos + 8 <= bytes.length) {
      let size = view.getUint32(pos);
      const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      if (size === 0) {
        size = bytes.length - pos;
      }
      boxes.push({ type, pos, size, data: bytes.subarray(pos, pos + size) });
      pos += size;
    }
    const moovIdx = boxes.findIndex((b) => b.type === "moov");
    const mdatIdx = boxes.findIndex((b) => b.type === "mdat");
    if (moovIdx === -1 || mdatIdx === -1) {
      return blob;
    }
    const originalMoov = boxes[moovIdx].data.slice();
    const normResult = _normalizeMp4AudioSampleEntry(originalMoov);
    let moovData = normResult.moovBytes;
    const delta = normResult.delta;
    const isFaststartNeeded = moovIdx > mdatIdx;
    if (!isFaststartNeeded && delta === 0) {
      return blob;
    }
    if (isFaststartNeeded) {
      console.log("[mp4fix] moov \u5728 mdat \u4E4B\u540E\uFF0C\u6267\u884C faststart \u91CD\u6392\u7F6E\u9876...");
      _addToStcoOffsets(moovData, 8, moovData.length, moovData.length);
    } else if (delta !== 0) {
      console.log("[mp4fix] moov \u89C4\u8303\u5316\u5FAE\u8C03 stco \u504F\u79FB...");
      _addToStcoOffsets(moovData, 8, moovData.length, delta);
    }
    const parts = [];
    for (let i = 0; i < boxes.length; i++) {
      if (i === moovIdx) {
        if (!isFaststartNeeded) {
          parts.push(moovData);
        }
        continue;
      }
      if (i === mdatIdx && isFaststartNeeded) {
        parts.push(moovData);
      }
      parts.push(boxes[i].data);
    }
    console.log("[mp4fix] MP4 \u89C4\u8303\u5316\u4E0E faststart \u4F18\u5316\u5B8C\u6210");
    return new Blob(parts, { type: "video/mp4" });
  } catch (e) {
    console.warn("[mp4fix] MP4 \u89C4\u8303\u5316\u4FEE\u590D\u5F02\u5E38\uFF0C\u56DE\u9000\u4F7F\u7528\u539F\u59CB Blob:", e);
    return blob;
  }
}

async function safeDataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("safeDataUrlToBlob: \u65E0\u6548\u7684 dataUrl \u8F93\u5165");
  }
  if (!dataUrl.startsWith("data:")) {
    const res = await fetch(dataUrl);
    return await res.blob();
  }
  try {
    const response = await fetch(dataUrl);
    if (response.ok) {
      return await response.blob();
    }
  } catch (_) {
  }
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) {
    throw new Error("safeDataUrlToBlob: \u975E\u6CD5\u7684 DataURL \u7ED3\u6784");
  }
  const meta = dataUrl.slice(0, commaIdx);
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : "video/mp4";
  const cleanBase64 = dataUrl.slice(commaIdx + 1).replace(/\s+/g, "");
  const CHUNK = 512 * 1024;
  const parts = [];
  for (let i = 0; i < cleanBase64.length; i += CHUNK) {
    const chunk = cleanBase64.slice(i, i + CHUNK);
    const binaryStr = atob(chunk);
    const bytes = new Uint8Array(binaryStr.length);
    for (let j = 0; j < binaryStr.length; j++) {
      bytes[j] = binaryStr.charCodeAt(j);
    }
    parts.push(bytes);
    if (parts.length % 5 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  return new Blob(parts, { type: mimeType });
}

function clearMacroSubstitutionCache() {
  macroSubstitutionCache.clear();
}

function safeSubstituteParams(text) {
  if (!text || typeof text !== "string") return "";
  if (!text.includes("{{")) return text;
  if (macroSubstitutionCache.has(text)) {
    return macroSubstitutionCache.get(text);
  }
  let substituted = text;
  try {
    if (typeof substituteParams === "function") {
      substituted = substituteParams(text);
    }
  } catch (e) {
    console.warn("[Macro] \u5B8F\u5C55\u5F00\u6267\u884C\u5F02\u5E38\uFF0C\u56DE\u9000\u4F7F\u7528\u539F\u59CB\u6587\u672C:", e);
    substituted = text;
  }
  if (macroSubstitutionCache.size >= MAX_MACRO_CACHE_ENTRIES) {
    const firstKey = macroSubstitutionCache.keys().next().value;
    macroSubstitutionCache.delete(firstKey);
  }
  macroSubstitutionCache.set(text, substituted);
  return substituted;
}

function normalizePromptTag(tag) {
  if (!tag || typeof tag !== "string") return "";
  const substituted = safeSubstituteParams(tag);
  return substituted.trim().replaceAll("\r", "").replaceAll("\n", "").replaceAll("\u300A", "<").replaceAll("\u300B", ">").replace(/，/g, ",").replace(/；/g, ";").replace(/：/g, ":");
}

export { acquireComfyUILock, acquireSerialLock, addLog, addSmoothShakeEffect, calculateSkipCfgAboveSigma, cancelComfyUILock, cancelSerialLock, centersToCoordinates, checkSendBuClass, clampPopupToViewport, clearAllLogs, clearLog, comfyuiConcurrencyLock, configDatabase_exports, convertImageToJpeg, countTokens, deduplicateTags, deepMerge, exportLogsWithHistory, fixMp4Faststart, fumian, generateRandomSeed, getLog, getRandomVibeGroupId, getRandomYusheId, getRequestHeaders, getSDMode, getSortedCharacterIds, getsdAuth, initializeLogPersistence, isMobileDevice, isMobileDeviceDialog, isPluginEnabled, isPluginToastDisabled, normalizePromptTag, parsePromptStringWithCoordinates, prepareImageForUpload, processReferenceImage, processUploadedImage, processUploadedImageToBlob, prompt_replace, prompt_replace_banana, prompt_replace_banana_for_character, prompt_replace_for_character, releaseComfyUILock, releaseSerialLock, removeThinkingTags, removeTrailingSlash, resetSerialLock, safeDataUrlToBlob, setSDMode, sleep, stripChineseAnnotations, zhengmian };
