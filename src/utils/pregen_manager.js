// 还原自打包产物 — 原始模块: utils/pregen_manager.js
import { eventSource } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { EventType, extensionName } from "./config.js";
import { addLog, normalizePromptTag } from "./utils.js";
import { clearAllGenerating, isGenerating, startGenerating, stopGenerating } from "./generation_status.js";
import { getItemImg } from "./database.js";
import { registerAutoClickHandled } from "./iframe/placeholder.js";
import { __set_currentSessionEpoch, activeTaskCleanups, currentSessionEpoch, pregenDispatched } from "./settings/stream_generate.js";

function generateStableId3(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "chatu8-id-" + Math.abs(hash).toString(36);
}

async function dispatchPregenTask(normPrompt) {
  const taskEpoch = currentSessionEpoch;
  let cleanup = null;
  const onTaskFinish = () => {
    if (cleanup) {
      cleanup();
      activeTaskCleanups.delete(cleanup);
      cleanup = null;
    }
    if (taskEpoch !== currentSessionEpoch) {
      addLog(`[Pregen] \u4EFB\u52A1\u6240\u5C5E\u4F1A\u8BDD\u5DF2\u8FC7\u671F (epoch: ${taskEpoch} vs ${currentSessionEpoch})\uFF0C\u5FFD\u7565\u4EFB\u52A1\u7ED3\u675F\u56DE\u8C03`);
      return;
    }
  };
  try {
    const [imageUrl] = await getItemImg(normPrompt);
    if (taskEpoch !== currentSessionEpoch) return;
    if (imageUrl) {
      registerAutoClickHandled(normPrompt);
      addLog(`[Pregen] \u672C\u5730/\u8FDC\u7AEF\u5DF2\u5B58\u5728\u8BE5\u56FE\u7247\uFF0C\u8DF3\u8FC7\u9884\u751F\u6210: ${normPrompt}`);
      onTaskFinish();
      return;
    }
    if (isGenerating(normPrompt)) {
      addLog(`[Pregen] \u56FE\u50CF\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u8DF3\u8FC7\u91CD\u590D\u6D3E\u53D1: ${normPrompt}`);
      onTaskFinish();
      return;
    }
    const requestId = generateStableId3(normPrompt);
    registerAutoClickHandled(normPrompt, requestId);
    startGenerating(normPrompt);
    let timeoutTimer = null;
    let isCompleted = false;
    const imageResponseHandler = (responseData) => {
      if (responseData.id !== requestId) return;
      if (isCompleted) return;
      isCompleted = true;
      const { success, error, prompt: responsePrompt } = responseData;
      addLog(`[Pregen] \u6536\u5230\u751F\u6210\u54CD\u5E94 (ID: ${requestId}, \u72B6\u6001: ${success ? "\u6210\u529F" : "\u5931\u8D25"}${error ? ", \u9519\u8BEF: " + error : ""})`);
      onTaskFinish();
    };
    cleanup = () => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, imageResponseHandler);
      stopGenerating(normPrompt);
    };
    activeTaskCleanups.add(cleanup);
    timeoutTimer = setTimeout(() => {
      if (isCompleted) return;
      isCompleted = true;
      addLog(`[Pregen] \u4EFB\u52A1\u8D85\u65F6\u672A\u54CD\u5E94 (ID: ${requestId})\uFF0C\u5DF2\u81EA\u52A8\u89E3\u9664\u72B6\u6001`);
      onTaskFinish();
    }, 18e4);
    eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, imageResponseHandler);
    let finalWidth = null;
    let finalHeight = null;
    const sizeRegex = /,?\s*(\d{2,4})x(\d{2,4})(?=[;\s]|$)/i;
    const linkMatch = normPrompt.match(sizeRegex);
    if (linkMatch && String(extension_settings[extensionName]?.aiAutonomousResolution) !== "false") {
      finalWidth = linkMatch[1];
      finalHeight = linkMatch[2];
    }
    const requestData = {
      id: requestId,
      prompt: normPrompt,
      width: finalWidth,
      height: finalHeight
    };
    eventSource.emit(EventType.GENERATE_IMAGE_REQUEST, requestData);
    addLog(`[Pregen] \u5DF2\u5E76\u53D1\u6D3E\u53D1\u751F\u56FE\u8BF7\u6C42 (ID: ${requestId}): ${normPrompt}`);
  } catch (err) {
    console.error(`[Pregen] \u6D3E\u53D1\u9884\u751F\u6210\u4EFB\u52A1\u5F02\u5E38: ${normPrompt}`, err);
    onTaskFinish();
  }
}

function schedulePregenTask(normPrompt) {
  dispatchPregenTask(normPrompt);
}

function add(prompts) {
  if (!Array.isArray(prompts)) return;
  prompts.forEach((prompt2) => {
    const norm = normalizePromptTag(prompt2);
    if (!norm) return;
    if (pregenDispatched.has(norm)) return;
    pregenDispatched.add(norm);
    schedulePregenTask(norm);
  });
}

function clear() {
  __set_currentSessionEpoch(currentSessionEpoch + 1);
  pregenDispatched.clear();
  for (const cleanup of activeTaskCleanups) {
    try {
      cleanup();
    } catch (e) {
      console.error("[Pregen] \u6E05\u7406\u5728\u9014\u4EFB\u52A1\u5931\u8D25:", e);
    }
  }
  activeTaskCleanups.clear();
  clearAllGenerating();
  addLog(`[Pregen] \u9884\u751F\u6210\u72B6\u6001\u5DF2\u5B8C\u5168\u91CD\u7F6E (epoch: ${currentSessionEpoch})\uFF0C\u9632\u91CD\u8868\u5DF2\u6E05\u7A7A\u3002`);
}

export { add, clear };
