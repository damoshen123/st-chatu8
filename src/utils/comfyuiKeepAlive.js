// 还原自打包产物 — 原始模块: utils/comfyuiKeepAlive.js
import { extension_settings } from "../../../../../extensions.js";
import { extensionName } from "./config.js";
import { getRequestHeaders } from "./utils.js";
import { KEEP_ALIVE_INTERVAL, PING_TIMEOUT, __set_consecutiveErrors, __set_keepAliveSuspended, __set_keepAliveTimer, consecutiveErrors, keepAliveSuspended, keepAliveTimer } from "./settings/api_connections.js";

function shouldKeepAlive() {
  const settings3 = extension_settings[extensionName];
  if (!settings3) return false;
  const isEnabled = settings3.scriptEnabled === true || settings3.scriptEnabled === "true";
  const isComfyUIMode = settings3.mode === "comfyui";
  return isEnabled && isComfyUIMode && !keepAliveSuspended;
}

function pingViaSillyTavern() {
  const comfyUrl = extension_settings[extensionName]?.comfyuiUrl?.trim();
  if (!comfyUrl) {
    return;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);
  fetch("/api/sd/comfy/ping", {
    method: "POST",
    headers: getRequestHeaders(window.token),
    body: JSON.stringify({ url: comfyUrl }),
    signal: controller.signal
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`[ComfyUI KeepAlive] HTTP error! status: ${res.status}`);
    }
    __set_consecutiveErrors(0);
  }).catch((err) => {
    console.warn("[ComfyUI KeepAlive] Ping \u8BF7\u6C42\u5931\u8D25:", err);
    __set_consecutiveErrors(consecutiveErrors + 1);
    checkErrorCountAndSuspend();
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

function pingDirect() {
  const comfyUrl = extension_settings[extensionName]?.comfyuiUrl?.trim();
  if (!comfyUrl) {
    return;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);
  fetch(`${comfyUrl}/system_stats`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`[ComfyUI KeepAlive] HTTP error! status: ${res.status}`);
    }
    __set_consecutiveErrors(0);
  }).catch((err) => {
    console.warn("[ComfyUI KeepAlive] Direct Ping \u8BF7\u6C42\u5931\u8D25:", err);
    __set_consecutiveErrors(consecutiveErrors + 1);
    checkErrorCountAndSuspend();
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

function checkErrorCountAndSuspend() {
  if (consecutiveErrors >= 2) {
    console.log("[ComfyUI KeepAlive] \u8FDE\u7EED 2 \u6B21\u8BF7\u6C42\u5931\u8D25\uFF0C\u5DF2\u81EA\u52A8\u6682\u505C\u4FDD\u6D3B\u68C0\u6D4B\u3002\u5982\u9700\u6062\u590D\u68C0\u6D4B\uFF0C\u8BF7\u4FEE\u6539\u5730\u5740\u6216\u91CD\u65B0\u70B9\u51FB\u6D4B\u8BD5\u3002");
    __set_keepAliveSuspended(true);
    stopKeepAlive();
  }
}

function doPing() {
  if (!shouldKeepAlive()) {
    return;
  }
  const client = extension_settings[extensionName]?.client;
  if (client === "jiuguan") {
    pingViaSillyTavern();
  } else {
    pingDirect();
  }
}

function startKeepAlive() {
  stopKeepAlive();
  if (!shouldKeepAlive()) {
    console.log("[ComfyUI KeepAlive] \u6761\u4EF6\u4E0D\u6EE1\u8DB3\u6216\u5DF2\u6682\u505C\uFF0C\u4E0D\u542F\u52A8\u4FDD\u6D3B");
    return;
  }
  console.log("[ComfyUI KeepAlive] \u542F\u52A8\u4FDD\u6D3B\u5B9A\u65F6\u5668\uFF0C\u95F4\u9694:", KEEP_ALIVE_INTERVAL, "ms");
  doPing();
  __set_keepAliveTimer(setInterval(doPing, KEEP_ALIVE_INTERVAL));
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    console.log("[ComfyUI KeepAlive] \u505C\u6B62\u4FDD\u6D3B\u5B9A\u65F6\u5668");
    clearInterval(keepAliveTimer);
    __set_keepAliveTimer(null);
  }
}

function updateKeepAliveStatus() {
  if (shouldKeepAlive()) {
    if (!keepAliveTimer) {
      startKeepAlive();
    }
  } else {
    stopKeepAlive();
  }
}

function initializeKeepAlive() {
  console.log("[ComfyUI KeepAlive] \u521D\u59CB\u5316\u4FDD\u6D3B\u6A21\u5757");
  updateKeepAliveStatus();
}

function resetKeepAliveState() {
  console.log("[ComfyUI KeepAlive] \u72B6\u6001\u5DF2\u91CD\u7F6E\uFF0C\u91CD\u65B0\u5F00\u59CB\u4FDD\u6D3B\u68C0\u6D4B");
  __set_consecutiveErrors(0);
  __set_keepAliveSuspended(false);
  updateKeepAliveStatus();
}

export { initializeKeepAlive, resetKeepAliveState, updateKeepAliveStatus };
