// 还原自打包产物 — 原始模块: utils/queueService.js
import { extension_settings } from "../../../../../extensions.js";
import { extensionName } from "./config.js";
import { addLog } from "./utils.js";
import { MAX_POLL_RETRIES, POLL_INTERVAL } from "./novelai.js";

function getUserId() {
  let id = localStorage.getItem("chatu8_uid");
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
    localStorage.setItem("chatu8_uid", id);
  }
  return id;
}

async function hashKey(key) {
  if (crypto && crypto.subtle && typeof crypto.subtle.digest === "function") {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    if (typeof CryptoJS !== "undefined" && CryptoJS.SHA256) {
      const hash = CryptoJS.SHA256(key);
      return hash.toString(CryptoJS.enc.Hex);
    } else {
      console.warn("[queueService] crypto.subtle \u548C CryptoJS \u90FD\u4E0D\u53EF\u7528\uFF0C\u4F7F\u7528\u7B80\u5355 hash");
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).padStart(8, "0");
    }
  }
}

function getQueueBaseUrl() {
  return extension_settings[extensionName].cloudQueueUrl || "";
}

async function joinQueue(keyHash, userId, taskId) {
  const baseUrl = getQueueBaseUrl();
  if (!baseUrl) {
    throw new Error("\u4E91\u7AEF\u961F\u5217\u670D\u52A1\u5730\u5740\u672A\u914D\u7F6E");
  }
  addLog(`[\u961F\u5217] \u6B63\u5728\u52A0\u5165\u961F\u5217... (taskId: ${taskId.substring(0, 8)}...)`);
  const greeting = (extension_settings[extensionName].cloudQueueGreeting || "").substring(0, 15);
  const response = await fetch(`${baseUrl}/join-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key_hash: keyHash, user_id: userId, task_id: taskId, greeting: greeting || null })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`\u52A0\u5165\u961F\u5217\u5931\u8D25: ${response.status} - ${error}`);
  }
  const result = await response.json();
  addLog(`[\u961F\u5217] \u5DF2\u52A0\u5165\u961F\u5217\uFF0C\u4F4D\u7F6E: ${result.position + 1}/${result.queue_size || "?"}`);
  return result;
}

async function checkMyTurn(keyHash, userId, taskId) {
  const baseUrl = getQueueBaseUrl();
  if (!baseUrl) {
    throw new Error("\u4E91\u7AEF\u961F\u5217\u670D\u52A1\u5730\u5740\u672A\u914D\u7F6E");
  }
  const response = await fetch(`${baseUrl}/my-turn?key_hash=${encodeURIComponent(keyHash)}&user_id=${encodeURIComponent(userId)}&task_id=${encodeURIComponent(taskId)}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`\u68C0\u67E5\u961F\u5217\u72B6\u6001\u5931\u8D25: ${response.status} - ${error}`);
  }
  return await response.json();
}

async function completeQueue(keyHash, userId, taskId, lockToken) {
  const baseUrl = getQueueBaseUrl();
  if (!baseUrl) return;
  addLog(`[\u961F\u5217] \u6B63\u5728\u91CA\u653E\u9501...`);
  try {
    const response = await fetch(`${baseUrl}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key_hash: keyHash, user_id: userId, task_id: taskId, lock_token: lockToken })
    });
    if (response.ok) {
      addLog(`[\u961F\u5217] \u9501\u5DF2\u91CA\u653E`);
    } else {
      const error = await response.text();
      addLog(`[\u961F\u5217] \u91CA\u653E\u9501\u5931\u8D25: ${error}`);
    }
  } catch (error) {
    addLog(`[\u961F\u5217] \u91CA\u653E\u9501\u65F6\u51FA\u9519: ${error.message}`);
  }
}

async function leaveQueue(keyHash, userId, taskId, lockToken = null) {
  const baseUrl = getQueueBaseUrl();
  if (!baseUrl) return;
  addLog(`[\u961F\u5217] \u6B63\u5728\u9000\u51FA\u961F\u5217...`);
  try {
    const response = await fetch(`${baseUrl}/leave-queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key_hash: keyHash, user_id: userId, task_id: taskId, lock_token: lockToken })
    });
    if (response.ok) {
      addLog(`[\u961F\u5217] \u5DF2\u9000\u51FA\u961F\u5217`);
    } else {
      const error = await response.text();
      addLog(`[\u961F\u5217] \u9000\u51FA\u961F\u5217\u5931\u8D25: ${error}`);
    }
  } catch (error) {
    addLog(`[\u961F\u5217] \u9000\u51FA\u961F\u5217\u65F6\u51FA\u9519: ${error.message}`);
  }
}

async function waitForTurn(keyHash, userId, taskId, taskQueue2, options = {}) {
  const queueTimeoutMs = Number(options.timeoutMs) || Number(extension_settings[extensionName]?.cloudQueueTimeout) * 1e3 || 18e4;
  const signal = options.signal || null;
  const queueStartTime = Date.now();
  const joinResult = await joinQueue(keyHash, userId, taskId);
  if (joinResult.position === 0 && joinResult.lock_token) {
    addLog(`[\u961F\u5217] \u76F4\u63A5\u83B7\u5F97\u9501\uFF0C\u65E0\u9700\u7B49\u5F85`);
    toastr.success("\u83B7\u5F97\u9501\uFF0C\u5F00\u59CB\u751F\u6210", "\u961F\u5217");
    return { lockToken: joinResult.lock_token };
  }
  const maxSec = Math.round(queueTimeoutMs / 1e3);
  toastr.info(`\u6392\u961F\u4E2D: \u7B2C ${joinResult.position + 1}/${joinResult.queue_size || "?"} \u4F4D (\u8D85\u65F6\u8BBE\u4E3A ${maxSec} \u79D2)`, "\u961F\u5217", { timeOut: 5e3 });
  let retryCount = 0;
  let shownGreeting = false;
  let lastPosition = joinResult.position;
  while (true) {
    if (signal && signal.aborted) {
      addLog(`[\u961F\u5217] \u68C0\u6D4B\u5230\u4EFB\u52A1\u4E2D\u6B62\u4FE1\u53F7\uFF0C\u9000\u51FA\u961F\u5217`);
      await leaveQueue(keyHash, userId, taskId, null);
      throw signal.reason || new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    if (taskQueue2 && !taskQueue2.isTaskInQueue(taskId)) {
      addLog(`[\u961F\u5217] \u4EFB\u52A1\u5DF2\u88AB\u53D6\u6D88\uFF0C\u9000\u51FA\u961F\u5217`);
      await leaveQueue(keyHash, userId, taskId, null);
      throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    const elapsed = Date.now() - queueStartTime;
    if (elapsed > queueTimeoutMs) {
      const timeoutSec = Math.round(queueTimeoutMs / 1e3);
      addLog(`[\u961F\u5217] \u274C \u4E91\u7AEF\u6392\u961F\u7B49\u5F85\u8D85\u65F6\uFF08\u5DF2\u7B49\u5F85 ${Math.round(elapsed / 1e3)} \u79D2 / \u4E0A\u9650 ${timeoutSec} \u79D2\uFF09\uFF0C\u81EA\u52A8\u9000\u51FA\u961F\u5217`);
      toastr.error(`\u4E91\u7AEF\u6392\u961F\u8D85\u65F6\uFF08\u7B49\u5F85\u8D85\u8FC7 ${timeoutSec} \u79D2\uFF09\uFF0C\u5DF2\u81EA\u52A8\u9000\u51FA`, "\u961F\u5217\u8D85\u65F6");
      await leaveQueue(keyHash, userId, taskId, null);
      throw new Error(`\u4E91\u7AEF\u6392\u961F\u7B49\u5F85\u8D85\u65F6\uFF08\u5DF2\u8D85\u8FC7 ${timeoutSec} \u79D2\uFF0C\u524D\u65B9\u7B49\u5F85\u4EBA\u6570\u8FC7\u591A\uFF09`);
    }
    await sleep2(POLL_INTERVAL);
    try {
      const status = await checkMyTurn(keyHash, userId, taskId);
      retryCount = 0;
      if (status.is_my_turn && status.lock_token) {
        const waitSec = Math.round((Date.now() - queueStartTime) / 1e3);
        addLog(`[\u961F\u5217] \u8F6E\u5230\u6211\u4E86\uFF0C\u5F00\u59CB\u751F\u6210 (\u6392\u961F\u8017\u65F6 ${waitSec} \u79D2)`);
        toastr.success(`\u8F6E\u5230\u4F60\u4E86\uFF0C\u5F00\u59CB\u751F\u6210\uFF01(\u6392\u961F\u8017\u65F6 ${waitSec} \u79D2)`, "\u961F\u5217");
        return { lockToken: status.lock_token };
      }
      const curElapsedSec = Math.round((Date.now() - queueStartTime) / 1e3);
      let logMsg = `[\u961F\u5217] \u7B49\u5F85\u4E2D (${curElapsedSec}/${maxSec}s)... \u4F4D\u7F6E: ${status.position + 1}/${status.queue_size || "?"}`;
      if (status.position !== lastPosition) {
        toastr.info(`\u6392\u961F\u4E2D: \u7B2C ${status.position + 1}/${status.queue_size || "?"} \u4F4D (${curElapsedSec}/${maxSec}s)`, "\u961F\u5217", { timeOut: 3e3 });
        lastPosition = status.position;
      }
      if (!shownGreeting && status.current_greeting && extension_settings[extensionName].showQueueGreeting === "true") {
        logMsg += ` | \u524D\u65B9\u7528\u6237: "${status.current_greeting}"`;
        toastr.info(`\u524D\u65B9\u7528\u6237: "${status.current_greeting}"`, "\u961F\u5217", { timeOut: 5e3 });
        shownGreeting = true;
      }
      addLog(logMsg);
    } catch (error) {
      if (error.message?.includes("\u8D85\u65F6") || error.message?.includes("\u5DF2\u53D6\u6D88")) {
        throw error;
      }
      retryCount++;
      addLog(`[\u961F\u5217] \u8F6E\u8BE2\u5931\u8D25 (${retryCount}/${MAX_POLL_RETRIES}): ${error.message}`);
      if (retryCount >= MAX_POLL_RETRIES) {
        toastr.error(`\u961F\u5217\u670D\u52A1\u4E0D\u53EF\u7528: ${error.message}`, "\u961F\u5217");
        await leaveQueue(keyHash, userId, taskId, null);
        throw new Error(`\u961F\u5217\u670D\u52A1\u4E0D\u53EF\u7528: ${error.message}`);
      }
    }
  }
}

function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { completeQueue, getUserId, hashKey, leaveQueue, waitForTurn };
