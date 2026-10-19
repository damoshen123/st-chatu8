// 还原自打包产物 — 原始模块: utils/llmRequest.js
import { eventSource } from "../../../../../script.js";
import { eventNames } from "./config.js";
import { debugBranch, debugLog, debugTimer } from "./debugLogger.js";

function generateRequestId7() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function LLM_GET_PROMPT() {
  return new Promise((resolve, reject) => {
    const promptRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u83B7\u53D6 LLM \u63D0\u793A\u8BCD (ID: ${promptRequestId})`);
    const handler = (promptData) => {
      if (promptData.id !== promptRequestId) return;
      eventSource.removeListener(eventNames.LLM_GET_PROMPT_RESPONSE, handler);
      const { prompt: prompt2 } = promptData;
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u83B7\u53D6 LLM \u63D0\u793A\u8BCD (ID: ${promptRequestId}):`, prompt2);
      resolve(prompt2);
    };
    eventSource.on(eventNames.LLM_GET_PROMPT_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_GET_PROMPT_REQUEST, { id: promptRequestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_GET_PROMPT_RESPONSE, handler);
      reject(new Error("\u83B7\u53D6 prompt \u8D85\u65F6"));
    }, 1e4);
  });
}

function LLM_IMAGE_GEN_GET_PROMPT() {
  return new Promise((resolve, reject) => {
    const promptRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u83B7\u53D6\u6B63\u6587\u56FE\u7247\u751F\u6210\u63D0\u793A\u8BCD (ID: ${promptRequestId})`);
    const handler = (promptData) => {
      if (promptData.id !== promptRequestId) return;
      eventSource.removeListener(eventNames.LLM_IMAGE_GEN_GET_PROMPT_RESPONSE, handler);
      const { prompt: prompt2 } = promptData;
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u83B7\u53D6\u6B63\u6587\u56FE\u7247\u751F\u6210\u63D0\u793A\u8BCD (ID: ${promptRequestId}):`, prompt2);
      resolve(prompt2);
    };
    eventSource.on(eventNames.LLM_IMAGE_GEN_GET_PROMPT_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_IMAGE_GEN_GET_PROMPT_REQUEST, { id: promptRequestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_IMAGE_GEN_GET_PROMPT_RESPONSE, handler);
      reject(new Error("\u83B7\u53D6\u6B63\u6587\u56FE\u7247\u751F\u6210\u63D0\u793A\u8BCD\u8D85\u65F6"));
    }, 1e4);
  });
}

function LLM_CHAR_DESIGN_GET_PROMPT() {
  return new Promise((resolve, reject) => {
    const promptRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1\u63D0\u793A\u8BCD (ID: ${promptRequestId})`);
    const handler = (promptData) => {
      if (promptData.id !== promptRequestId) return;
      eventSource.removeListener(eventNames.LLM_CHAR_DESIGN_GET_PROMPT_RESPONSE, handler);
      const { prompt: prompt2 } = promptData;
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1\u63D0\u793A\u8BCD (ID: ${promptRequestId}):`, prompt2);
      resolve(prompt2);
    };
    eventSource.on(eventNames.LLM_CHAR_DESIGN_GET_PROMPT_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_CHAR_DESIGN_GET_PROMPT_REQUEST, { id: promptRequestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_CHAR_DESIGN_GET_PROMPT_RESPONSE, handler);
      reject(new Error("\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1\u63D0\u793A\u8BCD\u8D85\u65F6"));
    }, 1e4);
  });
}

function LLM_CHAR_DISPLAY_GET_PROMPT() {
  return new Promise((resolve, reject) => {
    const promptRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u5C55\u793A\u63D0\u793A\u8BCD (ID: ${promptRequestId})`);
    const handler = (promptData) => {
      if (promptData.id !== promptRequestId) return;
      eventSource.removeListener(eventNames.LLM_CHAR_DISPLAY_GET_PROMPT_RESPONSE, handler);
      const { prompt: prompt2 } = promptData;
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u5C55\u793A\u63D0\u793A\u8BCD (ID: ${promptRequestId}):`, prompt2);
      resolve(prompt2);
    };
    eventSource.on(eventNames.LLM_CHAR_DISPLAY_GET_PROMPT_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_CHAR_DISPLAY_GET_PROMPT_REQUEST, { id: promptRequestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_CHAR_DISPLAY_GET_PROMPT_RESPONSE, handler);
      reject(new Error("\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u5C55\u793A\u63D0\u793A\u8BCD\u8D85\u65F6"));
    }, 1e4);
  });
}

function LLM_CHAR_MODIFY_GET_PROMPT() {
  return new Promise((resolve, reject) => {
    const promptRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u4FEE\u6539\u63D0\u793A\u8BCD (ID: ${promptRequestId})`);
    const handler = (promptData) => {
      if (promptData.id !== promptRequestId) return;
      eventSource.removeListener(eventNames.LLM_CHAR_MODIFY_GET_PROMPT_RESPONSE, handler);
      const { prompt: prompt2 } = promptData;
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u4FEE\u6539\u63D0\u793A\u8BCD (ID: ${promptRequestId}):`, prompt2);
      resolve(prompt2);
    };
    eventSource.on(eventNames.LLM_CHAR_MODIFY_GET_PROMPT_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_CHAR_MODIFY_GET_PROMPT_REQUEST, { id: promptRequestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_CHAR_MODIFY_GET_PROMPT_RESPONSE, handler);
      reject(new Error("\u83B7\u53D6\u89D2\u8272/\u670D\u88C5\u4FEE\u6539\u63D0\u793A\u8BCD\u8D85\u65F6"));
    }, 1e4);
  });
}

function LLM_TAG_MODIFY_GET_PROMPT() {
  return new Promise((resolve, reject) => {
    const promptRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u83B7\u53D6Tag\u4FEE\u6539\u63D0\u793A\u8BCD (ID: ${promptRequestId})`);
    const handler = (promptData) => {
      if (promptData.id !== promptRequestId) return;
      eventSource.removeListener(eventNames.LLM_TAG_MODIFY_GET_PROMPT_RESPONSE, handler);
      const { prompt: prompt2 } = promptData;
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u83B7\u53D6Tag\u4FEE\u6539\u63D0\u793A\u8BCD (ID: ${promptRequestId}):`, prompt2);
      resolve(prompt2);
    };
    eventSource.on(eventNames.LLM_TAG_MODIFY_GET_PROMPT_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_TAG_MODIFY_GET_PROMPT_REQUEST, { id: promptRequestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_TAG_MODIFY_GET_PROMPT_RESPONSE, handler);
      reject(new Error("\u83B7\u53D6Tag\u4FEE\u6539\u63D0\u793A\u8BCD\u8D85\u65F6"));
    }, 1e4);
  });
}

function LLM_VIDEO_ASSET_GEN_GET_PROMPT() {
  return new Promise((resolve, reject) => {
    const promptRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u83B7\u53D6\u89C6\u9891\u8D44\u4EA7\u751F\u6210\u63D0\u793A\u8BCD (ID: ${promptRequestId})`);
    const handler = (promptData) => {
      if (promptData.id !== promptRequestId) return;
      eventSource.removeListener(eventNames.LLM_VIDEO_ASSET_GEN_GET_PROMPT_RESPONSE, handler);
      const { prompt: prompt2 } = promptData;
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u83B7\u53D6\u89C6\u9891\u8D44\u4EA7\u751F\u6210\u63D0\u793A\u8BCD (ID: ${promptRequestId}):`, prompt2);
      resolve(prompt2);
    };
    eventSource.on(eventNames.LLM_VIDEO_ASSET_GEN_GET_PROMPT_RESPONSE, handler);
    eventSource.emit(eventNames.LLM_VIDEO_ASSET_GEN_GET_PROMPT_REQUEST, { id: promptRequestId });
    setTimeout(() => {
      eventSource.removeListener(eventNames.LLM_VIDEO_ASSET_GEN_GET_PROMPT_RESPONSE, handler);
      reject(new Error("\u83B7\u53D6\u89C6\u9891\u8D44\u4EA7\u751F\u6210\u63D0\u793A\u8BCD\u8D85\u65F6"));
    }, 1e4);
  });
}

function LLM_EXECUTE(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    console.log(`\u58F0\u4E34\u5176\u5883\uFF1A\u8BF7\u6C42\u6267\u884C LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_EXECUTE_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`\u58F0\u4E34\u5176\u5883\uFF1A\u5DF2\u6536\u5230 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        resolve(executeData.result);
      } else {
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_EXECUTE_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_EXECUTE_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

function LLM_IMAGE_GEN(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    const timer = debugTimer("llmRequest.LLM_IMAGE_GEN", "\u6B63\u6587\u56FE\u7247\u751F\u6210 LLM \u8BF7\u6C42");
    debugLog("llmRequest.LLM_IMAGE_GEN", "LLM\u8BF7\u6C42\u5F00\u59CB", {
      \u8BF7\u6C42ID: executeRequestId,
      \u8D85\u65F6\u8BBE\u7F6E: `${timeoutMs}ms`,
      \u6D88\u606F\u6570\u91CF: prompt2?.length || 0,
      \u529F\u80FD\u8BF4\u660E: "\u901A\u8FC7\u4E8B\u4EF6\u7CFB\u7EDF\u53D1\u9001LLM\u56FE\u7247\u751F\u6210\u8BF7\u6C42"
    });
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u6B63\u6587\u56FE\u7247\u751F\u6210 LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_IMAGE_GEN_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      debugLog("llmRequest.LLM_IMAGE_GEN", "LLM\u54CD\u5E94\u6536\u5230", {
        \u8BF7\u6C42ID: executeRequestId,
        \u6210\u529F: executeData.success,
        \u6D4B\u8BD5\u6A21\u5F0F: executeData.testMode || false,
        \u7ED3\u679C\u957F\u5EA6: executeData.result?.length || 0
      });
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u6536\u5230\u6B63\u6587\u56FE\u7247\u751F\u6210 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        debugBranch("LLM_IMAGE_GEN", "\u6210\u529F\u5206\u652F", true);
        if (executeData.testMode) {
          debugBranch("LLM_IMAGE_GEN", "\u6D4B\u8BD5\u6A21\u5F0F\u54CD\u5E94", true);
          timer.end("\u6D4B\u8BD5\u6A21\u5F0F\u6210\u529F");
          resolve({ result: executeData.result, testMode: true });
        } else {
          timer.end(`\u6210\u529F - \u7ED3\u679C\u957F\u5EA6: ${executeData.result?.length || 0}`);
          resolve({ result: executeData.result, testMode: false });
        }
      } else {
        debugBranch("LLM_IMAGE_GEN", "\u5931\u8D25\u5206\u652F", true);
        debugLog("llmRequest.LLM_IMAGE_GEN", "LLM\u8BF7\u6C42\u5931\u8D25", {
          \u9519\u8BEF\u7C7B\u578B: executeData.error?.name || "Unknown",
          \u9519\u8BEF\u6D88\u606F: executeData.error?.message || executeData.result
        });
        timer.end("\u5931\u8D25");
        if (executeData.error && executeData.error.name === "AbortError") {
          debugBranch("LLM_IMAGE_GEN", "\u8BF7\u6C42\u88AB\u4E2D\u6B62", true);
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_IMAGE_GEN_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_IMAGE_GEN_REQUEST, { prompt: prompt2, id: executeRequestId });
    debugLog("llmRequest.LLM_IMAGE_GEN", "\u5DF2\u53D1\u9001\u8BF7\u6C42\u4E8B\u4EF6\uFF0C\u7B49\u5F85\u54CD\u5E94", {
      \u4E8B\u4EF6\u540D: eventNames.LLM_IMAGE_GEN_REQUEST
    });
    timeoutTimer = setTimeout(() => {
      cleanup();
      debugBranch("LLM_IMAGE_GEN", "\u8D85\u65F6", true);
      debugLog("llmRequest.LLM_IMAGE_GEN", "LLM\u8BF7\u6C42\u8D85\u65F6", {
        \u8D85\u65F6\u65F6\u95F4: `${timeoutMs}ms`
      });
      timer.end("\u8D85\u65F6");
      reject(new Error(`\u6B63\u6587\u56FE\u7247\u751F\u6210 LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

function LLM_VISUAL_MAT_PREP(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    const timer = debugTimer("llmRequest.LLM_VISUAL_MAT_PREP", "\u89C6\u6750\u51C6\u5907 LLM \u8BF7\u6C42");
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u89C6\u6750\u51C6\u5907 LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_VISUAL_MAT_PREP_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u6536\u5230\u89C6\u6750\u51C6\u5907 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        if (executeData.testMode) {
          timer.end("\u6D4B\u8BD5\u6A21\u5F0F\u6210\u529F");
          resolve({ result: executeData.result, testMode: true });
        } else {
          timer.end(`\u6210\u529F - \u7ED3\u679C\u957F\u5EA6: ${executeData.result?.length || 0}`);
          resolve({ result: executeData.result, testMode: false });
        }
      } else {
        timer.end("\u5931\u8D25");
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_VISUAL_MAT_PREP_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_VISUAL_MAT_PREP_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      timer.end("\u8D85\u65F6");
      reject(new Error(`\u89C6\u6750\u51C6\u5907 LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

function LLM_VIDEO_GEN(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    const timer = debugTimer("llmRequest.LLM_VIDEO_GEN", "\u56FE\u751F\u89C6\u9891 LLM \u8BF7\u6C42");
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u56FE\u751F\u89C6\u9891 LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_VIDEO_GEN_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u6536\u5230\u56FE\u751F\u89C6\u9891 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        if (executeData.testMode) {
          timer.end("\u6D4B\u8BD5\u6A21\u5F0F\u6210\u529F");
          resolve({ result: executeData.result, testMode: true });
        } else {
          timer.end(`\u6210\u529F - \u7ED3\u679C\u957F\u5EA6: ${executeData.result?.length || 0}`);
          resolve({ result: executeData.result, testMode: false });
        }
      } else {
        timer.end("\u5931\u8D25");
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_VIDEO_GEN_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_VIDEO_GEN_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      timer.end("\u8D85\u65F6");
      reject(new Error(`\u56FE\u751F\u89C6\u9891 LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

function LLM_VIDEO_ASSET_GEN(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    const timer = debugTimer("llmRequest.LLM_VIDEO_ASSET_GEN", "\u89C6\u9891\u8D44\u4EA7\u751F\u6210 LLM \u8BF7\u6C42");
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u89C6\u9891\u8D44\u4EA7\u751F\u6210 LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_VIDEO_ASSET_GEN_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u6536\u5230\u89C6\u9891\u8D44\u4EA7\u751F\u6210 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        if (executeData.testMode) {
          timer.end("\u6D4B\u8BD5\u6A21\u5F0F\u6210\u529F");
          resolve({ result: executeData.result, testMode: true });
        } else {
          timer.end(`\u6210\u529F - \u7ED3\u679C\u957F\u5EA6: ${executeData.result?.length || 0}`);
          resolve({ result: executeData.result, testMode: false });
        }
      } else {
        timer.end("\u5931\u8D25");
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_VIDEO_ASSET_GEN_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_VIDEO_ASSET_GEN_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      timer.end("\u8D85\u65F6");
      reject(new Error(`\u89C6\u9891\u8D44\u4EA7\u751F\u6210 LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

function LLM_CHAR_DESIGN2(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1 LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_CHAR_DESIGN_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u6536\u5230\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        if (executeData.testMode) {
          resolve({ result: executeData.result, testMode: true });
        } else {
          resolve({ result: executeData.result, testMode: false });
        }
      } else {
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_CHAR_DESIGN_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_CHAR_DESIGN_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1 LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

function LLM_CHAR_DISPLAY2(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u89D2\u8272/\u670D\u88C5\u5C55\u793A LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_CHAR_DISPLAY_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u6536\u5230\u89D2\u8272/\u670D\u88C5\u5C55\u793A LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        if (executeData.testMode) {
          resolve({ result: executeData.result, testMode: true });
        } else {
          resolve({ result: executeData.result, testMode: false });
        }
      } else {
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_CHAR_DISPLAY_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_CHAR_DISPLAY_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`\u89D2\u8272/\u670D\u88C5\u5C55\u793A LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

function LLM_CHAR_MODIFY2(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42\u89D2\u8272/\u670D\u88C5\u4FEE\u6539 LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_CHAR_MODIFY_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u6536\u5230\u89D2\u8272/\u670D\u88C5\u4FEE\u6539 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        if (executeData.testMode) {
          resolve({ result: executeData.result, testMode: true });
        } else {
          resolve({ result: executeData.result, testMode: false });
        }
      } else {
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_CHAR_MODIFY_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_CHAR_MODIFY_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`\u89D2\u8272/\u670D\u88C5\u4FEE\u6539 LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

function LLM_TAG_MODIFY(prompt2, { timeoutMs = 6e5 } = {}) {
  return new Promise((resolve, reject) => {
    const executeRequestId = generateRequestId7();
    console.log(`\u63D2\u56FE\u5427\uFF1A\u8BF7\u6C42Tag\u4FEE\u6539 LLM (ID: ${executeRequestId})`);
    let timeoutTimer = null;
    const cleanup = () => {
      eventSource.removeListener(eventNames.LLM_TAG_MODIFY_RESPONSE, executeResponseHandler);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
    const executeResponseHandler = (executeData) => {
      if (executeData.id !== executeRequestId) return;
      cleanup();
      console.log(`\u63D2\u56FE\u5427\uFF1A\u5DF2\u6536\u5230Tag\u4FEE\u6539 LLM \u6267\u884C\u7ED3\u679C (ID: ${executeRequestId}):`, executeData);
      if (executeData.success) {
        if (executeData.testMode) {
          resolve({ result: executeData.result, testMode: true });
        } else {
          resolve({ result: executeData.result, testMode: false });
        }
      } else {
        if (executeData.error && executeData.error.name === "AbortError") {
          const err = new Error(executeData.error.message);
          err.name = "AbortError";
          reject(err);
        } else {
          reject(new Error(executeData.result));
        }
      }
    };
    eventSource.on(eventNames.LLM_TAG_MODIFY_RESPONSE, executeResponseHandler);
    eventSource.emit(eventNames.LLM_TAG_MODIFY_REQUEST, { prompt: prompt2, id: executeRequestId });
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`Tag\u4FEE\u6539 LLM \u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09`));
    }, timeoutMs);
  });
}

export { LLM_IMAGE_GEN, LLM_TAG_MODIFY, LLM_VIDEO_ASSET_GEN, LLM_VIDEO_ASSET_GEN_GET_PROMPT, LLM_VIDEO_GEN, LLM_VISUAL_MAT_PREP };
