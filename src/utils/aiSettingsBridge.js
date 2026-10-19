// 还原自打包产物 — 原始模块: utils/aiSettingsBridge.js
import { getLog } from "./utils.js";
import { getDebugLog, toggleDebug } from "./debugLogger.js";
import { ConfigDescriptions } from "./configHelper/configDescriptions.js";
import { checkRequiredConfigs, getDetailedConfigKeys, getExposedSettings, getSpecificConfigData, updateSettingSafely } from "./configHelper/configValidation.js";
import { browseConfigPath, executeUIAction, getCurrentUIContext, readConfigPath, writeConfigPath } from "./configHelper/configBrowseAPI.js";
import { addSteps, completeTask, createTask, getCurrentTask, getTaskInfo, getTaskStatusPrompt, updateStep, updateTask } from "./aiTaskManager.js";
import { refreshAiAssistantSettings } from "./aiAssistant.js";
import { getAvailableModuleKeys, getModulePrompt } from "./aiModules/index.js";
import { clearAllRegexEntries2, createRegexEntry, getRegexResultText2, getRegexStatus, setClickTriggerEnabled2, setGestureEnabled2, setRegexEditors2, setRegexOriginalText2, setRegexTestMode2, triggerRegexTest2 } from "./configHelper/configRegexBridge.js";
import { addWorkflowNode, analyzeWorkflow, batchUpdateWorkflowNodes, deleteWorkflowNode, getWorkflowList, listWorkflowNodes, readWorkflow, readWorkflowNode, replaceWorkflowVariable, saveWorkflow, scanWorkflowVariables, updateWorkflowNodeInput } from "./configHelper/configWorkflowBridge.js";
import { getImageGenerationStatus, requestImageGeneration } from "./aiImageGeneration.js";
import { getErrorStats, getRecentErrors } from "./errorCollector.js";
import { listOnDemandKnowledgeBases, readKnowledgeBase, readKnowledgeEntry, searchKnowledge } from "./knowledgeBaseService.js";
import "./aiConfigHelper.js"; // init_aiConfigHelper
import "./aiPromptModules.js"; // init_aiPromptModules

function getSettingsContextPrompt() {
  const settings3 = getExposedSettings();
  const criticalKeys = [
    "mode",
    "scriptEnabled",
    "sdUrl",
    "comfyuiUrl",
    "current_llm_profile",
    "workerid",
    "novelaimode"
  ];
  let contextStr = "\u3010\u5F53\u524D\u63D2\u4EF6\u5173\u952E\u914D\u7F6E\u6458\u8981\u3011\n";
  for (const key of criticalKeys) {
    if (!(key in settings3)) continue;
    const value = settings3[key];
    if (typeof value === "object" || typeof value === "function") continue;
    const desc = ConfigDescriptions[key] || "";
    const descPart = desc ? ` (${desc})` : "";
    contextStr += `- ${key}: ${String(value)}${descPart}
`;
  }
  const mode = settings3.mode || "comfyui";
  if (mode === "novelai") {
    contextStr += `- novelaiApi: ${settings3.novelaiApi ? "(\u5DF2\u914D\u7F6E)" : "(\u672A\u586B)"}
`;
  } else if (mode === "banana") {
    const b = settings3.banana || {};
    contextStr += `- banana.apiUrl: ${b.apiUrl || "(\u672A\u586B)"}
`;
    contextStr += `- banana.apiKey: ${b.apiKey ? "(\u5DF2\u914D\u7F6E)" : "(\u672A\u586B)"}
`;
    contextStr += `- banana.model: ${b.model || "(\u672A\u9009\u62E9)"}
`;
  }
  const llmProfileName = settings3.current_llm_profile || "\u9ED8\u8BA4";
  const llmProfile = settings3.llm_profiles?.[llmProfileName];
  if (llmProfile) {
    contextStr += `
\u3010\u5F53\u524DLLM\u9884\u8BBE: ${llmProfileName}\u3011
`;
    contextStr += `- api_url: ${llmProfile.api_url || "(\u672A\u586B)"}
`;
    contextStr += `- api_key: ${llmProfile.api_key ? "(\u5DF2\u914D\u7F6E)" : "(\u672A\u586B)"}
`;
    contextStr += `- model: ${llmProfile.model || "(\u672A\u9009\u62E9)"}
`;
  }
  contextStr += "\n" + checkRequiredConfigs() + "\n";
  try {
    const uiCtx = getCurrentUIContext();
    contextStr += "\n\u3010\u5F53\u524DUI\u72B6\u6001\u3011\n" + uiCtx + "\n";
  } catch (e) {
  }
  contextStr += "\n\u63D0\u793A\uFF1A\u4EE5\u4E0A\u4EC5\u4E3A\u5173\u952E\u6458\u8981\u3002\u4F60\u53EF\u4EE5\u4F7F\u7528 browse/read/write \u6307\u4EE4\u9010\u5C42\u6D4F\u89C8\u548C\u4FEE\u6539\u914D\u7F6E\uFF0C\u4F7F\u7528 ui_action \u64CD\u4F5C\u6309\u94AE\uFF0C\u4F7F\u7528 check_config \u68C0\u67E5\u914D\u7F6E\u72B6\u6001\u3002\n";
  const taskStatus = getTaskStatusPrompt();
  if (taskStatus) {
    contextStr += "\n" + taskStatus + "\n";
  }
  return contextStr;
}

function buildTailReminder(lastUserText) {
  const task = getCurrentTask();
  const safeUserText = lastUserText || "";
  if (!task) {
    return `\u63D0\u793A:\u667A\u7ED8\u59EC\uFF0C\u4F60\u4F7F\u7528\u4E2D\u6587\u4E3A\u4E3B\u8981\u8BED\u8A00\uFF0C\u4F60\u53EF\u4EE5\u64CD\u4F5C\u548C\u4FEE\u6539\u63D2\u4EF6\u5185\u7684\u4EFB\u610F\u5185\u5BB9\uFF0C\u53EA\u662F\u8FD8\u6CA1\u8BFB\u53D6\u5230\u76F8\u5173\u6A21\u5757\uFF01\u6BD4\u5982\u548Ccomfyui\u76F8\u5173\u5219\u5FC5\u987B\u8F7D\u5165comfyui\u8BBE\u7F6E\u6A21\u5757\uFF01\u6700\u4F18\u5148\u7684\u5E94\u8BE5\u662F\u8F7D\u5165\u76F8\u5173\u63D0\u793A\u8BCD\u6A21\u5757\uFF01\u800C\u4E0D\u662F\u6025\u7740\u56DE\u7B54\u76F8\u5173\u7591\u95EE\u548C\u56DE\u7B54\u6211\u4E0D\u884C\u3002\u4E0A\u9762\u662F\u5BF9\u8BDD\u5386\u53F2\uFF0C\u667A\u7ED8\u59EC\uFF0C\u4F60\u5FC5\u987B\u4F7F\u7528<thinking>\u6807\u7B7E\u8FDB\u884C\u601D\u8003\uFF0C\u5224\u65AD\u7528\u6237\u7684\u884C\u4E3A\u9700\u6C42\uFF0C\u52A0\u8F7D\u76F8\u5E94\u6A21\u5757\u8FDB\u884C\u56DE\u590D\u548C\u64CD\u4F5C\uFF0C\u4F60\u7684\u77E5\u8BC6\u5728\u63D0\u793A\u8BCD\u6A21\u5757\u5F53\u4E2D\u3002\u7ED3\u675F\u601D\u8003\u5FC5\u987B\u4F7F\u7528</thinking>\u6765\u7ED3\u675F\u601D\u8003\uFF01\u7EE7\u7EED\u4E4B\u524D\u7684\u5BF9\u8BDD\u5427\uFF01

\u{1F4A1} \u5982\u679C\u7528\u6237\u7684\u8BF7\u6C42\u6D89\u53CA 3 \u4E2A\u4EE5\u4E0A\u6B65\u9AA4\u7684\u590D\u6742\u64CD\u4F5C\uFF08\u5982"\u4ECE\u5934\u914D\u7F6EComfyUI"\u3001"\u5E2E\u6211\u6392\u67E5\u6240\u6709\u95EE\u9898"\uFF09\uFF0C\u5EFA\u8BAE\u4F7F\u7528 task_create \u521B\u5EFA\u7ED3\u6784\u5316\u4EFB\u52A1\u6765\u8DDF\u8E2A\u8FDB\u5EA6\u3002

\u7528\u6237\u6784\u7B51\u5E08\u6700\u65B0\u7684\u6D88\u606F\uFF08\u9700\u6C42\uFF09\u662F\uFF1A***<\u6784\u7B51\u5E08\u7528\u6237\u9700\u6C42>${safeUserText}</\u6784\u7B51\u5E08\u7528\u6237\u9700\u6C42>***
\u8FD9\u662F\u6700\u65B0\u9700\u6C42\uFF01\u4E0D\u662F\u5386\u53F2\u8BB0\u5F55\u554A\uFF01
\u4F18\u5148\u56DE\u7B54\u548C\u601D\u8003\u8FD9\u4E2A\u95EE\u9898\uFF01
`;
  }
  const taskPrompt = getTaskStatusPrompt();
  const currentStep = task.steps.find((s) => s.status === "in_progress");
  const nextStepHint = currentStep ? `\u5F53\u524D\u5E94\u6267\u884C\uFF1A\u6B65\u9AA4 ${currentStep.order}\u300C${currentStep.title}\u300D` : "\u6240\u6709\u6B65\u9AA4\u5DF2\u5904\u7406\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u53EF\u4EE5 task_complete \u5B8C\u6210\u4EFB\u52A1\u3002";
  return `\u63D0\u793A:\u667A\u7ED8\u59EC\uFF0C\u4F60\u4F7F\u7528\u4E2D\u6587\u4E3A\u4E3B\u8981\u8BED\u8A00\u3002\u4E0A\u9762\u662F\u5BF9\u8BDD\u5386\u53F2\u3002\u4F60\u5FC5\u987B\u4F7F\u7528<thinking>\u6807\u7B7E\u8FDB\u884C\u601D\u8003\uFF0C\u7ED3\u675F\u601D\u8003\u5FC5\u987B\u4F7F\u7528</thinking>\u6765\u7ED3\u675F\u601D\u8003\uFF01

${taskPrompt}
${nextStepHint}

\u3010\u7ED3\u6784\u5316\u601D\u8003\u6307\u5F15\u3011\u5728 <thinking> \u4E2D\u6309\u4EE5\u4E0B\u6D41\u7A0B\u601D\u8003\uFF1A
1. \u56DE\u987E\u76EE\u6807\uFF1A\u5F53\u524D\u4EFB\u52A1\u662F\u300C${task.title}\u300D
2. \u68C0\u67E5\u8FDB\u5EA6\uFF1A${nextStepHint}
3. \u6267\u884C\u51B3\u7B56\uFF1A\u8FD9\u4E00\u6B65\u9700\u8981\u4EC0\u4E48\u64CD\u4F5C\uFF1F\u9700\u8981\u52A0\u8F7D\u54EA\u4E2A\u6A21\u5757\uFF1F
4. \u5B8C\u6210\u540E\u66F4\u65B0\uFF1A\u6267\u884C\u5B8C\u6BD5\u540E\u7528 step_update \u66F4\u65B0\u6B65\u9AA4\u72B6\u6001

\u7528\u6237\u6784\u7B51\u5E08\u6700\u65B0\u7684\u6D88\u606F\uFF08\u9700\u6C42\uFF09\u662F\uFF1A
***<\u6784\u7B51\u5E08\u7528\u6237\u9700\u6C42>${safeUserText}</\u6784\u7B51\u5E08\u7528\u6237\u9700\u6C42>***
\u8FD9\u662F\u6700\u65B0\u9700\u6C42\uFF01\u4E0D\u662F\u5386\u53F2\u8BB0\u5F55\u554A\uFF01
\u4F18\u5148\u56DE\u7B54\u548C\u601D\u8003\u8FD9\u4E2A\u95EE\u9898\uFF01
\u7ACB\u5373\u6267\u884C\u8FD9\u4E2A\u9700\u6C42\uFF0C\u8C03\u7528<system_prompt>\u6A21\u5757\u8FDB\u884C\u56DE\u590D\uFF01
`;
}

function removeThinkBlocks(text) {
  if (!text || typeof text !== "string") return "";
  let cleaned = text;
  let loopGuard = 0;
  while (loopGuard < 10) {
    loopGuard++;
    const prevLen = cleaned.length;
    cleaned = cleaned.replace(/^\s*```(?:bash|sh|console|linux|terminal)?\s*[\r\n][\s\S]*?```(?:\s*[\r\n]*|$)/i, "");
    cleaned = cleaned.replace(/^\s*<(think(?:ing)?|assistant_trace|trace|pipeline_trace|video_asset_think|Tag_think)>[\s\S]*?<\/\1>(?:\s*[\r\n]*|$)/i, "");
    cleaned = cleaned.replace(/^\s*[\s\S]*?<\/(think(?:ing)?|assistant_trace|trace|pipeline_trace)>(?:\s*[\r\n]*|$)/i, "");
    if (cleaned.length === prevLen) break;
  }
  cleaned = cleaned.replace(/<(think(?:ing)?|assistant_trace|trace|pipeline_trace|video_asset_think|Tag_think)>[\s\S]*?<\/\1>/gi, "");
  cleaned = cleaned.replace(/^\s*<(think(?:ing)?|assistant_trace|trace|pipeline_trace|video_asset_think|Tag_think)>[\s\S]*$/i, "");
  cleaned = cleaned.replace(/^\s*```(?:bash|sh|console|linux|terminal)?\s*[\r\n][\s\S]*$/i, "");
  return cleaned.trim();
}

function hasSystemCommand(text) {
  if (!text) return false;
  let cleanedText = removeThinkBlocks(text);
  const queryMatch = cleanedText.match(/<SystemQuery>([\s\S]*?)<\/SystemQuery>/gi);
  const updateMatch = cleanedText.match(/<UpdateSettings>([\s\S]*?)<\/UpdateSettings>/gi);
  return !!(queryMatch || updateMatch);
}

function parseAndApplySettings(aiReply) {
  if (!aiReply) return;
  let cleanedReply = removeThinkBlocks(aiReply);
  const regex = /<UpdateSettings>([\s\S]*?)<\/UpdateSettings>/gi;
  let match;
  while ((match = regex.exec(cleanedReply)) !== null) {
    let jsonStr = match[1].trim();
    try {
      const newSettings = JSON.parse(jsonStr);
      if ("debugMode" in newSettings) {
        const enabled = newSettings.debugMode;
        toggleDebug(enabled);
        delete newSettings.debugMode;
        if (typeof toastr !== "undefined") {
          toastr.success(enabled ? "\u8C03\u8BD5\u6A21\u5F0F\u5DF2\u5F00\u542F" : "\u8C03\u8BD5\u6A21\u5F0F\u5DF2\u5173\u95ED");
        }
      }
      if (Object.keys(newSettings).length > 0) {
        const success = updateSettingSafely(newSettings);
        if (success) {
          if (typeof toastr !== "undefined") {
            toastr.success("\u667A\u7ED8\u59EC\u5DF2\u5E2E\u4F60\u81EA\u52A8\u66F4\u65B0\u4E86\u8BBE\u7F6E\u9879\uFF01");
          }
          try {
            refreshAiAssistantSettings();
          } catch (e) {
            console.debug("[AI Settings Bridge] AI \u52A9\u624B\u8BBE\u7F6E\u9762\u677F\u5237\u65B0\u8DF3\u8FC7\uFF08\u53EF\u80FD\u672A\u521D\u59CB\u5316\uFF09");
          }
        }
      }
    } catch (e) {
      console.error("[AI Settings Bridge] AI \u5C1D\u89E3\u6790/\u4FEE\u6539\u914D\u7F6E JSON \u65F6\u53D1\u751F\u9519\u8BEF\uFF1A", e, "\u539F\u59CB\u5185\u5BB9:", jsonStr);
    }
  }
}

function wrapSystemResponse(type, content) {
  const typeAttr = type ? ` type="${type}"` : "";
  return `<SystemResponse${typeAttr}>
${content}
</SystemResponse>`;
}

async function parseQuerySettings(aiReply) {
  if (!aiReply) return null;
  console.log("[AI Settings Bridge] parseQuerySettings called, reply length:", aiReply.length);
  let cleanedReply = removeThinkBlocks(aiReply);
  console.log("[AI Settings Bridge] cleanedReply length:", cleanedReply.length);
  const regex = /<SystemQuery>([\s\S]*?)<\/SystemQuery>/gi;
  const allMatches = [...cleanedReply.matchAll(regex)];
  if (allMatches.length === 0) return null;
  console.log("[AI Settings Bridge] \u68C0\u6D4B\u5230", allMatches.length, "\u4E2A SystemQuery \u6307\u4EE4");
  const results = [];
  for (const match of allMatches) {
    let jsonStr = match[1].trim();
    console.log("[AI Settings Bridge] \u89E3\u6790 SystemQuery:", jsonStr.substring(0, 200));
    try {
      const queryData = JSON.parse(jsonStr);
      console.log("[AI Settings Bridge] JSON \u89E3\u6790\u6210\u529F:", queryData.type);
      const result = await executeSingleQuery(queryData);
      results.push(wrapSystemResponse(queryData.type, result));
    } catch (e) {
      console.error("[AI Settings Bridge] SystemQuery JSON \u89E3\u6790\u5931\u8D25:", e.message);
      console.error("[AI Settings Bridge] \u539F\u59CB\u5185\u5BB9:", jsonStr);
      const errorMsg = "\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D\u68C0\u7D22\u3011 \u67E5\u8BE2\u6307\u4EE4\u4F20\u5165\u4E86\u65E0\u6548 JSON \u683C\u5F0F\uFF0C\u8BF7\u68C0\u67E5\u3002\u539F\u59CB\u5185\u5BB9: " + jsonStr.substring(0, 100);
      results.push(wrapSystemResponse("error", errorMsg));
    }
  }
  return results.join("\n\n");
}

async function executeSingleQuery(queryData) {
  if (queryData.type === "browse") {
    const result = browseConfigPath(queryData.path || "");
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u914D\u7F6E\u6D4F\u89C8\u3011
${result}`;
  }
  if (queryData.type === "read" && queryData.path) {
    const result = readConfigPath(queryData.path);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u914D\u7F6E\u8BFB\u53D6\u3011
${result}`;
  }
  if (queryData.type === "write" && queryData.path) {
    const result = writeConfigPath(queryData.path, queryData.value);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u914D\u7F6E\u4FEE\u6539\u3011
${result}`;
  }
  if (queryData.type === "ui_action" && queryData.action) {
    const result = executeUIAction(queryData.action);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - UI\u64CD\u4F5C\u3011
${result}`;
  }
  if (queryData.type === "ui_context") {
    const result = getCurrentUIContext();
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u5F53\u524D\u754C\u9762\u3011
${result}`;
  }
  if (queryData.type === "check_config") {
    const result = checkRequiredConfigs();
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u914D\u7F6E\u68C0\u67E5\u3011
${result}`;
  }
  if (queryData.type === "load_module" && queryData.module) {
    const moduleContent = getModulePrompt(queryData.module);
    if (moduleContent) {
      let extra = "";
      if (queryData.module === "regex") {
        let switchMsg = "";
        try {
          switchMsg = executeUIAction("switch_tab_regex");
        } catch (e) {
          switchMsg = `\u5207\u6362\u5931\u8D25: ${e && e.message ? e.message : e}`;
        }
        let statusMsg = "";
        try {
          statusMsg = getRegexStatus();
        } catch (e) {
          statusMsg = `\u83B7\u53D6\u72B6\u6001\u5931\u8D25: ${e && e.message ? e.message : e}`;
        }
        extra = `

\u3010\u7CFB\u7EDF\u9644\u52A0 - \u5DF2\u81EA\u52A8\u5207\u6362\u5230\u6B63\u5219\u9875\u9762\u3011
${switchMsg}

\u3010\u7CFB\u7EDF\u9644\u52A0 - \u5F53\u524D\u6B63\u5219\u72B6\u6001\u3011
${statusMsg}`;
      }
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u52A0\u8F7D\u6A21\u5757: ${queryData.module}\u3011
${moduleContent}${extra}`;
    } else {
      const available = getAvailableModuleKeys().join(", ");
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6A21\u5757\u4E0D\u5B58\u5728\u3011 \u672A\u627E\u5230\u6A21\u5757 "${queryData.module}"\u3002\u5F53\u524D\u53EF\u7528\u6A21\u5757: ${available}`;
    }
  }
  if (queryData.type === "regex_status") {
    const result = getRegexStatus();
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6B63\u5219\u72B6\u6001\u3011
${result}`;
  }
  if (queryData.type === "regex_set_original" && queryData.text !== void 0) {
    const result = setRegexOriginalText2(queryData.text);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8BBE\u7F6E\u539F\u6587\u3011
${result}`;
  }
  if (queryData.type === "regex_set_editors") {
    const result = setRegexEditors2(queryData.beforeAfter, queryData.textRegex);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8BBE\u7F6E\u6B63\u5219\u7F16\u8F91\u5668\u3011
${result}`;
  }
  if (queryData.type === "regex_create_entry" && queryData.data) {
    const result = createRegexEntry(queryData.data);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u521B\u5EFA\u6B63\u5219\u6761\u76EE\u3011
${result}`;
  }
  if (queryData.type === "regex_test") {
    const result = await triggerRegexTest2();
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6B63\u5219\u6D4B\u8BD5\u3011
${result}`;
  }
  if (queryData.type === "regex_test_mode") {
    const result = setRegexTestMode2(queryData.enabled !== false);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6D4B\u8BD5\u6A21\u5F0F\u3011
${result}`;
  }
  if (queryData.type === "regex_result") {
    const result = getRegexResultText2();
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6B63\u5219\u7ED3\u679C\u3011
${result}`;
  }
  if (queryData.type === "gesture_enabled") {
    const result = setGestureEnabled2(queryData.enabled !== false);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u624B\u52BF\u529F\u80FD\u3011
${result}`;
  }
  if (queryData.type === "click_trigger_enabled") {
    const result = setClickTriggerEnabled2(queryData.enabled !== false);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u70B9\u51FB\u89E6\u53D1\u3011
${result}`;
  }
  if (queryData.type === "regex_clear_entries") {
    const result = clearAllRegexEntries2();
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6E05\u9664\u6B63\u5219\u6761\u76EE\u3011
${result}`;
  }
  if (queryData.type === "workflow_list") {
    const result = getWorkflowList(queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u5DE5\u4F5C\u6D41\u5217\u8868\u3011
${result}`;
  }
  if (queryData.type === "workflow_read" && queryData.name) {
    const result = readWorkflow(queryData.name, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8BFB\u53D6\u5DE5\u4F5C\u6D41\u3011
${result}`;
  }
  if (queryData.type === "workflow_variables" && queryData.name) {
    const result = scanWorkflowVariables(queryData.name, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u5DE5\u4F5C\u6D41\u53D8\u91CF\u3011
${result}`;
  }
  if (queryData.type === "workflow_replace_var" && queryData.name && queryData.variable) {
    const result = replaceWorkflowVariable(queryData.name, queryData.variable, queryData.value, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u66FF\u6362\u5DE5\u4F5C\u6D41\u53D8\u91CF\u3011
${result}`;
  }
  if (queryData.type === "workflow_save" && queryData.name && queryData.content) {
    const result = saveWorkflow(queryData.name, queryData.content, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u4FDD\u5B58\u5DE5\u4F5C\u6D41\u3011
${result}`;
  }
  if (queryData.type === "workflow_analyze" && (queryData.name || queryData.content)) {
    const result = analyzeWorkflow(queryData.content || queryData.name, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u5DE5\u4F5C\u6D41\u667A\u80FD\u5206\u6790\u3011
${result}`;
  }
  if (queryData.type === "generate_image" && queryData.prompt) {
    try {
      console.log("[AI Settings Bridge] \u5F00\u59CB\u751F\u56FE\u8BF7\u6C42...");
      const imageData = await requestImageGeneration(queryData.prompt, queryData.negative_prompt, queryData.options);
      console.log("[AI Settings Bridge] \u751F\u56FE\u5B8C\u6210\uFF0C\u51C6\u5907\u663E\u793A\u56FE\u7247:", { imageUrlLength: imageData.imageUrl?.length });
      const event = new CustomEvent("ai-show-generated-image", {
        detail: {
          imageUrl: imageData.imageUrl,
          prompt: queryData.prompt
        }
      });
      window.dispatchEvent(event);
      console.log("[AI Settings Bridge] \u5DF2\u89E6\u53D1\u663E\u793A\u56FE\u7247\u4E8B\u4EF6");
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u751F\u56FE\u5B8C\u6210\u3011
\u2705 \u56FE\u7247\u751F\u6210\u6210\u529F\uFF01\u63D0\u793A\u8BCD: ${queryData.prompt}`;
    } catch (error) {
      console.error("[AI Settings Bridge] \u751F\u56FE\u5931\u8D25:", error);
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u751F\u56FE\u5931\u8D25\u3011
\u274C ${error.message}`;
    }
  }
  if (queryData.type === "image_status" && queryData.generationId) {
    const result = getImageGenerationStatus(queryData.generationId);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u751F\u56FE\u72B6\u6001\u3011
${result}`;
  }
  if (queryData.type === "workflow_list_nodes" && queryData.name) {
    const result = listWorkflowNodes(queryData.name, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u5DE5\u4F5C\u6D41\u8282\u70B9\u5217\u8868\u3011
${result}`;
  }
  if (queryData.type === "workflow_read_node" && queryData.name && queryData.nodeId) {
    const result = readWorkflowNode(queryData.name, queryData.nodeId, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8BFB\u53D6\u8282\u70B9\u3011
${result}`;
  }
  if (queryData.type === "workflow_update_node" && queryData.name && queryData.nodeId && queryData.inputKey) {
    const result = updateWorkflowNodeInput(queryData.name, queryData.nodeId, queryData.inputKey, queryData.value, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u4FEE\u6539\u8282\u70B9\u53C2\u6570\u3011
${result}`;
  }
  if (queryData.type === "workflow_batch_update" && queryData.name && queryData.updates) {
    const result = batchUpdateWorkflowNodes(queryData.name, queryData.updates, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6279\u91CF\u4FEE\u6539\u8282\u70B9\u3011
${result}`;
  }
  if (queryData.type === "workflow_delete_node" && queryData.name && queryData.nodeId) {
    const result = deleteWorkflowNode(queryData.name, queryData.nodeId, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u5220\u9664\u8282\u70B9\u3011
${result}`;
  }
  if (queryData.type === "workflow_add_node" && queryData.name && queryData.nodeId && queryData.nodeData) {
    const result = addWorkflowNode(queryData.name, queryData.nodeId, queryData.nodeData, queryData.target);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6DFB\u52A0\u8282\u70B9\u3011
${result}`;
  }
  if (queryData.type === "get_logs") {
    const lines = queryData.lines || 50;
    const fullLog = getLog();
    if (!fullLog || fullLog.trim() === "") {
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8FD0\u884C\u65E5\u5FD7\u3011
\u6682\u65E0\u65E5\u5FD7\u8BB0\u5F55\u3002`;
    }
    const logLines = fullLog.split("\n").filter((line) => line.trim());
    const recentLines = logLines.slice(-lines);
    const result = recentLines.join("\n");
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8FD0\u884C\u65E5\u5FD7\u3011\uFF08\u6700\u8FD1 ${recentLines.length} \u884C\uFF09
${result}`;
  }
  if (queryData.type === "get_errors") {
    const count = queryData.count || 10;
    const errors = getRecentErrors(count);
    if (errors.length === 0) {
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u9519\u8BEF\u8BB0\u5F55\u3011
\u6682\u65E0\u9519\u8BEF\u8BB0\u5F55\u3002`;
    }
    let result = `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u9519\u8BEF\u8BB0\u5F55\u3011\uFF08\u6700\u8FD1 ${errors.length} \u6761\uFF09

`;
    for (const error of errors) {
      const time = new Date(error.timestamp).toLocaleString();
      result += `[${time}] ${error.type.toUpperCase()}
`;
      result += `  \u7C7B\u578B: ${error.message}
`;
      if (error.context && error.context.message) {
        result += `  \u5185\u5BB9: ${error.context.message}
`;
      }
      if (error.errorMessage) {
        result += `  \u8BE6\u60C5: ${error.errorMessage}
`;
      }
      if (error.errorName) {
        result += `  \u9519\u8BEF\u540D: ${error.errorName}
`;
      }
      if (error.stack) {
        const stackLines = error.stack.split("\n").slice(0, 3);
        result += `  \u5806\u6808: ${stackLines.join(" | ")}
`;
      }
      result += "\n";
    }
    return result;
  }
  if (queryData.type === "get_error_stats") {
    const stats = getErrorStats();
    let result = `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u9519\u8BEF\u7EDF\u8BA1\u3011

`;
    result += `\u603B\u9519\u8BEF\u6570: ${stats.total}
`;
    result += `\u6700\u8FD1 1 \u5C0F\u65F6: ${stats.recentHour} \u4E2A\u9519\u8BEF
`;
    result += `\u6700\u8FD1 24 \u5C0F\u65F6: ${stats.recent24h} \u4E2A\u9519\u8BEF

`;
    if (Object.keys(stats.byType).length > 0) {
      result += `\u6309\u7C7B\u578B\u5206\u5E03:
`;
      for (const [type, count] of Object.entries(stats.byType)) {
        result += `  - ${type}: ${count}
`;
      }
    }
    return result;
  }
  if (queryData.type === "get_debug_log") {
    const lines = queryData.lines || 30;
    const debugLog2 = getDebugLog();
    if (debugLog2.length === 0) {
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8C03\u8BD5\u65E5\u5FD7\u3011
\u8C03\u8BD5\u65E5\u5FD7\u4E3A\u7A7A\u3002\u53EF\u80FD\u8C03\u8BD5\u6A21\u5F0F\u672A\u542F\u7528\u3002`;
    }
    const recentEntries = debugLog2.slice(-lines);
    let result = `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8C03\u8BD5\u65E5\u5FD7\u3011\uFF08\u6700\u8FD1 ${recentEntries.length} \u6761\uFF09

`;
    for (const entry of recentEntries) {
      const time = new Date(entry.timestamp).toLocaleString();
      const elapsed = entry.elapsed !== void 0 ? ` [+${entry.elapsed}ms]` : "";
      result += `[${time}]${elapsed} ${entry.type} - ${entry.functionName}
`;
      result += `  ${entry.message}
`;
      if (entry.duration !== void 0) {
        result += `  \u8017\u65F6: ${entry.duration}ms
`;
      }
      result += "\n";
    }
    return result;
  }
  if (queryData.type === "get_system_status") {
    const fullLog = getLog();
    const logLineCount = fullLog ? fullLog.split("\n").filter((l) => l.trim()).length : 0;
    const errorStats = getErrorStats();
    const debugLog2 = getDebugLog();
    let result = `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u7CFB\u7EDF\u72B6\u6001\u3011

`;
    result += `\u8FD0\u884C\u65E5\u5FD7: ${logLineCount} \u884C
`;
    result += `\u9519\u8BEF\u8BB0\u5F55: ${errorStats.total} \u6761\uFF08\u6700\u8FD11\u5C0F\u65F6: ${errorStats.recentHour}\uFF09
`;
    result += `\u8C03\u8BD5\u65E5\u5FD7: ${debugLog2.length} \u6761
`;
    result += `\u8C03\u8BD5\u6A21\u5F0F: ${debugLog2.length > 0 ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}
`;
    return result;
  }
  if (queryData.type === "task_create" && queryData.title) {
    const steps = Array.isArray(queryData.steps) ? queryData.steps : [];
    const result = createTask(queryData.title, steps);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u521B\u5EFA\u4EFB\u52A1\u3011
${result}`;
  }
  if (queryData.type === "task_update") {
    const result = updateTask({ title: queryData.title, status: queryData.status });
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u66F4\u65B0\u4EFB\u52A1\u3011
${result}`;
  }
  if (queryData.type === "task_add_steps" && Array.isArray(queryData.steps)) {
    const result = addSteps(queryData.steps);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8FFD\u52A0\u6B65\u9AA4\u3011
${result}`;
  }
  if (queryData.type === "step_update" && queryData.stepId) {
    const result = updateStep(queryData.stepId, { status: queryData.status, result: queryData.result });
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u66F4\u65B0\u6B65\u9AA4\u3011
${result}`;
  }
  if (queryData.type === "task_complete") {
    const result = completeTask(queryData.summary || "");
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u5B8C\u6210\u4EFB\u52A1\u3011
${result}`;
  }
  if (queryData.type === "task_info") {
    const result = getTaskInfo();
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u4EFB\u52A1\u4FE1\u606F\u3011
${result}`;
  }
  if (queryData.type === "list_knowledge") {
    const result = await listOnDemandKnowledgeBases();
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8D44\u6599\u5E93\u5217\u8868\u3011
${result}`;
  }
  if (queryData.type === "read_knowledge" && queryData.worldName) {
    const result = await readKnowledgeBase(queryData.worldName);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8D44\u6599\u5E93\u5185\u5BB9\u3011
${result}`;
  }
  if (queryData.type === "search_knowledge" && queryData.keyword) {
    const result = await searchKnowledge(queryData.keyword);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8D44\u6599\u5E93\u641C\u7D22\u3011
${result}`;
  }
  if (queryData.type === "read_entry" && queryData.worldName && queryData.uid) {
    const result = await readKnowledgeEntry(queryData.worldName, queryData.uid);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u6761\u76EE\u5185\u5BB9\u3011
${result}`;
  }
  if (queryData.type === "tavern_input") {
    const text = queryData.text;
    if (text === void 0 || text === null) {
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u9152\u9986\u8F93\u5165\u3011
\u274C \u7F3A\u5C11 text \u53C2\u6570`;
    }
    const mode = queryData.mode || "overwrite";
    try {
      const textarea = document.querySelector("#send_textarea");
      if (!textarea) {
        return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u9152\u9986\u8F93\u5165\u3011
\u274C \u672A\u627E\u5230\u9152\u9986\u8F93\u5165\u6846 #send_textarea\uFF0C\u8BF7\u786E\u8BA4\u9152\u9986\u9875\u9762\u5DF2\u52A0\u8F7D`;
      }
      if (mode === "append") {
        const currentText = textarea.value || "";
        if (currentText.trim()) {
          textarea.value = currentText.trimEnd() + "\n" + text;
        } else {
          textarea.value = text;
        }
      } else {
        textarea.value = text;
      }
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.focus();
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
      const modeLabel = mode === "append" ? "\u8FFD\u52A0" : "\u8986\u76D6";
      const preview = textarea.value.length > 100 ? textarea.value.substring(0, 100) + "..." : textarea.value;
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u9152\u9986\u8F93\u5165\u3011
\u2705 \u5DF2${modeLabel}\u8F93\u5165\u6587\u5B57\u5230\u9152\u9986\u8F93\u5165\u6846\u3002
\u5F53\u524D\u8F93\u5165\u6846\u5185\u5BB9\u9884\u89C8: ${preview}`;
    } catch (error) {
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u9152\u9986\u8F93\u5165\u3011
\u274C \u64CD\u4F5C\u5931\u8D25: ${error.message}`;
    }
  }
  if (queryData.type === "tavern_read_input") {
    try {
      const textarea = document.querySelector("#send_textarea");
      if (!textarea) {
        return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8BFB\u53D6\u9152\u9986\u8F93\u5165\u3011
\u274C \u672A\u627E\u5230\u9152\u9986\u8F93\u5165\u6846 #send_textarea`;
      }
      const currentText = textarea.value || "";
      if (!currentText.trim()) {
        return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8BFB\u53D6\u9152\u9986\u8F93\u5165\u3011
\u8F93\u5165\u6846\u5F53\u524D\u4E3A\u7A7A\u3002`;
      }
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8BFB\u53D6\u9152\u9986\u8F93\u5165\u3011
\u5F53\u524D\u8F93\u5165\u6846\u5185\u5BB9:
${currentText}`;
    } catch (error) {
      return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D - \u8BFB\u53D6\u9152\u9986\u8F93\u5165\u3011
\u274C \u8BFB\u53D6\u5931\u8D25: ${error.message}`;
    }
  }
  if (queryData.type === "keys_list") {
    const keys = getDetailedConfigKeys();
    return "\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D\u68C0\u7D22\u3011\n\u6570\u636E\u5E93\u5185\u5B58\u5728\u4EE5\u4E0B\u6570\u636E\u540D\u5217\u8868\u53EF\u4EE5\u7EE7\u7EED\u6DF1\u5165\u67E5\u8BE2\uFF1A\n" + JSON.stringify(keys);
  }
  if (queryData.type === "query_key" && queryData.key) {
    const details = getSpecificConfigData(queryData.key);
    return `\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D\u68C0\u7D22\u3011
\u9488\u5BF9\u6570\u636E\u9879 "${queryData.key}" \u7684\u5185\u5BB9\u5982\u4E0B\uFF1A
` + details;
  }
  return "\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D\u68C0\u7D22\u3011 \u672A\u77E5\u7684\u67E5\u8BE2\u7C7B\u578B: " + (queryData.type || "\u7A7A");
}

export { buildTailReminder, getSettingsContextPrompt, hasSystemCommand, parseAndApplySettings, parseQuerySettings, removeThinkBlocks };
