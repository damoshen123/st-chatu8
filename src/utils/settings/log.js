// 还原自打包产物 — 原始模块: utils/settings/log.js
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionFolderPath } from "../config.js";
import { clearAllLogs, exportLogsWithHistory, getLog, initializeLogPersistence } from "../utils.js";
import { stylishConfirm } from "../ui_common.js";
import { TaskStatus, TaskType } from "../taskQueue.js";
import { clearDebugLog, exportDebugLog, getDebugLogCount, isDebugEnabled, toggleDebug } from "../debugLogger.js";
import { getImageGenStats, resetImageGenStats } from "../imageGenStats.js";
import { clearErrors, exportErrors, getAllErrors, getErrorStats } from "../errorCollector.js";
import { BACKEND_LABELS, __set__chartResizeObserver, __set__currentPeriod, _chartResizeObserver, _currentPeriod } from "../ui.js";
import { initTaskManager, updateTaskManagerView } from "./taskManager.js";

var generationTabs, statusIcons, statusTexts, typeTexts;

var generationTabs = ["sd", "novelai", "comfyui", "runninghub"];
var statusIcons = {
  [TaskStatus.QUEUED]: "\u23F3",
  [TaskStatus.RUNNING]: "\u{1F504}",
  [TaskStatus.COMPLETED]: "\u2705",
  [TaskStatus.CANCELLED]: "\u274C",
  [TaskStatus.FAILED]: "\u26A0\uFE0F"
};

var statusTexts = {
  [TaskStatus.QUEUED]: "\u6392\u961F\u4E2D",
  [TaskStatus.RUNNING]: "\u8FD0\u884C\u4E2D",
  [TaskStatus.COMPLETED]: "\u5DF2\u5B8C\u6210",
  [TaskStatus.CANCELLED]: "\u5DF2\u53D6\u6D88",
  [TaskStatus.FAILED]: "\u5931\u8D25"
};

var typeTexts = {
  [TaskType.BUTTON]: "\u6309\u94AE",
  [TaskType.NOVELAI]: "novelai \u751F\u56FE",
  [TaskType.COMFYUI]: "comfyui\u666E\u901A\u751F\u56FE",
  [TaskType.COMFYUI_IMG]: "comfyui\u666E\u901A\u751F\u56FE",
  [TaskType.COMFYUI_IMG2VID]: "comfyui\u56FE\u751F\u89C6\u9891",
  [TaskType.COMFYUI_REF2VID]: "comfyui\u53C2\u8003\u751F\u89C6\u9891",
  [TaskType.RUNNINGHUB]: "runninghub\u666E\u901A\u751F\u56FE",
  [TaskType.RUNNINGHUB_IMG]: "runninghub\u666E\u901A\u751F\u56FE",
  [TaskType.RUNNINGHUB_IMG2VID]: "runninghub\u56FE\u751F\u89C6\u9891",
  [TaskType.RUNNINGHUB_REF2VID]: "runninghub\u53C2\u8003\u751F\u89C6\u9891",
  [TaskType.AUTO_CLICK]: "\u81EA\u52A8\u70B9\u51FB",
  [TaskType.LLM]: "LLM \u8BF7\u6C42",
  [TaskType.BANANA]: "Banana \u751F\u56FE",
  [TaskType.SD]: "SD \u751F\u56FE"
};
function updateLogView() {
  const logTextarea = document.getElementById("ch-log-textarea");
  if (logTextarea) {
    let displayLog = getLog();
    const MAX_LOG_LENGTH = 45e3;
    const TRIM_TARGET_LENGTH = 38e3;
    if (displayLog.length > MAX_LOG_LENGTH) {
      let trimmedVal = displayLog.substring(displayLog.length - TRIM_TARGET_LENGTH);
      const newlineIdx = trimmedVal.indexOf("\n");
      if (newlineIdx !== -1) trimmedVal = trimmedVal.substring(newlineIdx + 1);
      logTextarea.value = "\uFF08\u524D\u9762\u7684\u65E5\u5FD7\u5DF2\u6298\u53E0\uFF0C\u8BF7\u5BFC\u51FA\u67E5\u770B\u5B8C\u6574\u65E5\u5FD7\uFF09\n" + trimmedVal;
    } else {
      logTextarea.value = displayLog;
    }
    logTextarea.scrollTop = 0;
  }
  updateTaskManagerView();
  updateDebugStatus();
}

async function getLocalExtensionVersion() {
  if (window.chatu8LocalVersion) {
    return window.chatu8LocalVersion;
  }
  try {
    const response = await fetch(`${extensionFolderPath}/manifest.json?t=${Date.now()}`, { cache: "no-cache" });
    if (response.ok) {
      const manifest = await response.json();
      if (manifest?.version) {
        window.chatu8LocalVersion = manifest.version;
        return manifest.version;
      }
    }
  } catch (error) {
    console.warn("[Chatu8] \u83B7\u53D6\u672C\u5730 manifest.json \u7248\u672C\u5931\u8D25:", error);
  }
  return "\u672A\u77E5";
}

function isSettingTrue4(val) {
  return val === true || val === "true";
}

async function handleExportLog() {
  const logContent = await exportLogsWithHistory();
  if (!logContent || logContent.trim() === "") {
    alert("\u65E5\u5FD7\u4E3A\u7A7A\u3002");
    return;
  }
  const { extension_settings: extension_settings117 } = await import("../../../../../../extensions.js");
  const settings3 = extension_settings117["st-chatu8"] || {};
  let settingsInfo = "========== st-chatu8 \u63D2\u4EF6\u8BBE\u7F6E\u4FE1\u606F ==========\n";
  const extensionVersion = await getLocalExtensionVersion();
  settingsInfo += `1. \u667A\u7ED8\u59EC\u7684\u7248\u672C: ${extensionVersion} (\u6839\u636Emanifest.json)

`;
  const currentLLMProfileName = settings3.current_llm_profile || "\u65E0";
  const currentLLMProfile = settings3.llm_profiles && settings3.llm_profiles[currentLLMProfileName] ? settings3.llm_profiles[currentLLMProfileName] : {};
  settingsInfo += `2. \u4E3B\u8981\u8BBE\u7F6E
`;
  settingsInfo += `- \u542F\u7528\u63D2\u4EF6: ${isSettingTrue4(settings3.scriptEnabled) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u8BBE\u7F6E\u9879\u7B54\u7591\u63D0\u793A: ${isSettingTrue4(settings3.helpTipsEnabled) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u63D2\u4EF6\u63D0\u793A\u5173\u95ED: ${isSettingTrue4(settings3.disablePluginToast) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u6A21\u5F0F: ${settings3.mode || "\u65E0"}
`;
  settingsInfo += `- \u5BA2\u6237\u7AEF: ${settings3.client || "\u65E0"}
`;
  settingsInfo += `- \u9690\u85CF\u6309\u94AE\uFF08\u53CC\u51FB\u56FE\u7247\u89E6\u53D1\uFF09: ${isSettingTrue4(settings3.dbclike) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u6298\u53E0\u56FE\u7247: ${isSettingTrue4(settings3.collapseImage) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u81EA\u52A8\u70B9\u51FB\u751F\u6210: ${isSettingTrue4(settings3.zidongdianji) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u81EA\u52A8\u70B9\u51FB(\u6CA1\u4E8B\u522B\u5F00): ${isSettingTrue4(settings3.zidongdianji2) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u957F\u6309\u56FE\u7247\u4FEE\u6539tag: ${isSettingTrue4(settings3.longPressToEdit) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u5355\u51FB\u56FE\u7247\u9884\u89C8: ${isSettingTrue4(settings3.clickToPreview) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u6362\u884C\u4FEE\u590D: ${isSettingTrue4(settings3.newlineFixEnabled) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u542F\u7528\u6D41\u5F0F\u9884\u751F\u6210: ${isSettingTrue4(settings3.enablePregen) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u81EA\u52A8LLM\u8BF7\u6C42\u751F\u56FE(\u975E\u540C\u5C42): ${isSettingTrue4(settings3.autoLLMImageGen) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u968F\u673A\u63D0\u793A\u8BCD\u9884\u8BBE: ${isSettingTrue4(settings3.randomYushe) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u968F\u673A Vibe \u7EC4: ${isSettingTrue4(settings3.randomVibeGroup) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- AI\u81EA\u4E3B\u5206\u8FA8\u7387: ${isSettingTrue4(settings3.aiAutonomousResolution) ? "\u662F" : "\u5426"}
`;
  const displayChannel = settings3.videoChannel === "none" ? "\u65E0 (none)" : settings3.videoChannel || "comfyui";
  settingsInfo += `- \u89C6\u9891\u6E20\u9053: ${displayChannel}
`;
  settingsInfo += `- \u751F\u56FE\u95F4\u9694\u65F6\u95F4\uFF08\u6BEB\u79D2\uFF09: ${settings3.imageGenInterval || "0"}
`;
  settingsInfo += `- \u56FE\u7247\u5BF9\u9F50\u65B9\u5F0F: ${settings3.imageAlignment || "\u65E0"}
`;
  settingsInfo += `- \u56FE\u7247\u663E\u793A\u5927\u5C0F: ${settings3.imageSizeScale || "100"}%
`;
  settingsInfo += `- \u5F00\u59CB\u6807\u8BB0: ${settings3.startTag || "\u65E0"}
`;
  settingsInfo += `- \u7ED3\u675F\u6807\u8BB0: ${settings3.endTag || "\u65E0"}
`;
  settingsInfo += `- \u63D2\u5165\u539F\u6587(\u975E\u540C\u5C42): ${isSettingTrue4(settings3.insertOriginalText) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u7F13\u5B58\u56FE\u7247\u5230\u9152\u9986: ${isSettingTrue4(settings3.jiuguanchucun) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u7F13\u5B58 Vibe \u5230\u9152\u9986: ${isSettingTrue4(settings3.vibeJiuguanchucun) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u8F6CJPEG\u50A8\u5B58: ${isSettingTrue4(settings3.convertToJpegStorage) ? "\u662F" : "\u5426"}

`;
  settingsInfo += `3. \u4E3B\u8981\u5927\u6A21\u578B (LLM) \u8BBE\u7F6E
`;
  settingsInfo += `- LLM \u914D\u7F6E\u7684\u9884\u8BBE\u540D\u79F0: ${currentLLMProfileName}
`;
  settingsInfo += `- \u6A21\u578B\u9009\u62E9: ${currentLLMProfile.model || "\u65E0"}
`;
  settingsInfo += `- \u6D41\u5F0F\u751F\u6210: ${isSettingTrue4(currentLLMProfile.stream) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u4E0D\u901A\u8FC7\u9152\u9986\u4EE3\u7406: ${isSettingTrue4(currentLLMProfile.bypass_proxy ?? currentLLMProfile.bypassProxy) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u5408\u5E76 System \u548C User: ${isSettingTrue4(currentLLMProfile.merge_system_user ?? currentLLMProfile.mergeSystemUser) ? "\u662F" : "\u5426"}
`;
  const tempStr = currentLLMProfile.enable_temperature === false ? "\u5DF2\u7981\u7528" : currentLLMProfile.temperature ?? "\u65E0";
  const topPStr = currentLLMProfile.enable_top_p === false ? "\u5DF2\u7981\u7528" : currentLLMProfile.top_p ?? "\u65E0";
  const maxTokensStr = currentLLMProfile.enable_max_tokens === false ? "\u5DF2\u7981\u7528" : currentLLMProfile.max_tokens ?? "\u65E0";
  settingsInfo += `- \u6A21\u578B\u53C2\u6570 (Temperature: ${tempStr}, Top P: ${topPStr}, Max Tokens: ${maxTokensStr})
`;
  settingsInfo += `- \u81EA\u5B9A\u4E49\u8BF7\u6C42\u6807\u5934: ${currentLLMProfile.enable_custom_headers ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}
`;
  settingsInfo += `- \u9644\u52A0\u8BF7\u6C42\u53C2\u6570: ${currentLLMProfile.enable_custom_body_params ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}
`;
  settingsInfo += `- \u53D1\u9001\u5386\u53F2\u5C42\u6570: ${settings3.llm_history_depth ?? 0}
`;
  settingsInfo += `- Tagthink\u56DE\u663E: ${isSettingTrue4(settings3.tagthinkEcho) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- \u5386\u53F2\u6B63\u6587\u4FDD\u7559 <image> \u6807\u7B7E: ${isSettingTrue4(settings3.historyKeepImageTag) ? "\u662F" : "\u5426"}
`;
  settingsInfo += `- LLM \u9519\u8BEF\u91CD\u8BD5\u6B21\u6570: ${settings3.llm_retry_count ?? 0}
`;
  const reqProfileName = settings3.current_llm_request_type_profile || "\u65E0";
  settingsInfo += `- \u8BF7\u6C42\u7C7B\u578B\u914D\u7F6E\u6863\u6848: ${reqProfileName}
`;
  const reqConfigs = settings3.llm_request_type_configs || {};
  const typeNames = {
    "image_gen": "\u6B63\u6587\u56FE\u7247\u751F\u6210",
    "char_design": "\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1",
    "char_display": "\u89D2\u8272/\u670D\u88C5\u5C55\u793A",
    "char_modify": "\u89D2\u8272/\u670D\u88C5\u4FEE\u6539",
    "translation": "\u7FFB\u8BD1",
    "tag_modify": "Tag\u4FEE\u6539",
    "ai_assistant": "\u667A\u7ED8\u59EC\u52A9\u624B",
    "persona_gen": "\u4EBA\u8BBE\u751F\u6210",
    "user_persona_gen": "User\u4EBA\u8BBE\u751F\u6210",
    "chat_summary": "\u804A\u5929\u603B\u7ED3",
    "visual_mat_prep": "\u89C6\u6750\u51C6\u5907",
    "video_gen": "\u56FE\u751F\u89C6\u9891",
    "video_asset_gen": "\u89C6\u9891\u8D44\u4EA7\u751F\u6210"
  };
  for (const [key, name] of Object.entries(typeNames)) {
    const conf = reqConfigs[key] || {};
    settingsInfo += `  * ${name}: API\u9884\u8BBE [${conf.api_profile || "\u9ED8\u8BA4"}], \u4E0A\u4E0B\u6587\u9884\u8BBE [${conf.context_profile || "\u9ED8\u8BA4"}]
`;
  }
  settingsInfo += `
`;
  const mode = settings3.mode || "novelai";
  settingsInfo += `4. \u5F53\u524D\u751F\u56FE\u540E\u7AEF (${mode}) \u76F8\u5173\u8BBE\u7F6E
`;
  if (mode === "novelai") {
    settingsInfo += `\u3010NovelAI \u8BBE\u7F6E\u3011
`;
    settingsInfo += `- \u63D0\u793A\u8BCD\u9884\u8BBE: ${settings3.yusheid_novelai || "\u65E0"}
`;
    settingsInfo += `- \u63D0\u793A\u8BCD\u66FF\u6362: ${settings3.prompt_replace_id_novelai || "\u65E0"}
`;
    settingsInfo += `- \u6DFB\u52A0\u798F\u745E\u6570\u636E\u96C6: ${settings3.addFurryDataset}
`;
    settingsInfo += `- \u6B63\u9762\u8D28\u91CF\u9884\u8BBE: ${settings3.AQT_novelai || "\u65E0"}
`;
    settingsInfo += `- \u8D1F\u9762\u8D28\u91CF\u9884\u8BBE: ${settings3.UCP_novelai || "\u65E0"}
`;
    settingsInfo += `- \u7AD9\u70B9: ${settings3.novelaisite || "\u5B98\u7F51"}
`;
    settingsInfo += `- \u542F\u7528\u4E91\u7AEF\u961F\u5217: ${isSettingTrue4(settings3.enableCloudQueue) ? "\u662F" : "\u5426"}
`;
    settingsInfo += `- \u961F\u5217\u670D\u52A1\u5730\u5740: ${settings3.cloudQueueUrl || "\u65E0"}
`;
    settingsInfo += `- \u6392\u961F\u4E2A\u6027\u8BED: ${settings3.cloudQueueGreeting || "\u65E0"}
`;
    settingsInfo += `- \u663E\u793A\u4ED6\u4EBA\u4E2A\u6027\u8BED: ${isSettingTrue4(settings3.showQueueGreeting) ? "\u662F" : "\u5426"}
`;
    settingsInfo += `- \u6A21\u578B: ${settings3.novelaimode || "\u65E0"}
`;
    settingsInfo += `- \u91C7\u6837\u65B9\u6CD5: ${settings3.novelai_sampler || "\u65E0"}
`;
    settingsInfo += `- \u566A\u70B9\u8868: ${settings3.Schedule || "\u65E0"}
`;
    settingsInfo += `- Prompt Guidance: ${settings3.nai3Scale || "\u65E0"}
`;
    settingsInfo += `- Prompt Guidance Rescale: ${settings3.cfg_rescale || "\u65E0"}
`;
    settingsInfo += `- AI \u9ED8\u8BA4\u89D2\u8272\u4F4D\u7F6E: ${isSettingTrue4(settings3.AI_use_coords) ? "\u662F" : "\u5426"}
`;
    settingsInfo += `- \u591A\u6837\u6027 (Variety): ${isSettingTrue4(settings3.nai3Variety) ? "\u662F" : "\u5426"}
`;
    settingsInfo += `- \u751F\u6210\u53C2\u6570 (\u9884\u8BBE\u5C3A\u5BF8: ${settings3.novelai_size || "\u65E0"}, Width: ${settings3.novelai_width}, Height: ${settings3.novelai_height}, Steps: ${settings3.novelai_steps}, Seed: ${settings3.novelai_seed})
`;
  } else if (mode === "sd") {
    settingsInfo += `\u3010Stable Diffusion \u8BBE\u7F6E\u3011
`;
    settingsInfo += `- \u63D0\u793A\u8BCD\u9884\u8BBE: ${settings3.yusheid || "\u65E0"}
`;
    settingsInfo += `- \u63D0\u793A\u8BCD\u66FF\u6362: ${settings3.prompt_replace_id || "\u65E0"}
`;
    settingsInfo += `- \u6B63\u9762\u8D28\u91CF\u9884\u8BBE: ${settings3.AQT_sd || "\u65E0"}
`;
    settingsInfo += `- \u8D1F\u9762\u8D28\u91CF\u9884\u8BBE: ${settings3.UCP_sd || "\u65E0"}
`;
    settingsInfo += `- API \u5730\u5740: ${settings3.sdUrl || "\u65E0"}
`;
    settingsInfo += `- \u6A21\u578B: ${settings3.sd_cchatu_8_model || "\u65E0"}
`;
    settingsInfo += `- VAE: ${settings3.sd_cchatu_8_vae || "\u65E0"}
`;
    settingsInfo += `- \u91C7\u6837\u65B9\u6CD5: ${settings3.sd_cchatu_8_samplerName || "\u65E0"}
`;
    settingsInfo += `- \u8C03\u5EA6\u5668: ${settings3.sd_cchatu_8_scheduler || "\u65E0"}
`;
    settingsInfo += `- \u751F\u6210\u53C2\u6570 (\u9884\u8BBE\u5C3A\u5BF8: ${settings3.sd_csize || "\u65E0"}, Width: ${settings3.sd_cwidth}, Height: ${settings3.sd_cheight}, Steps: ${settings3.sd_csteps}, Seed: ${settings3.sd_cseed})
`;
    settingsInfo += `- CFG\u7F29\u653E: ${settings3.sdCfgScale || "\u65E0"}
`;
    settingsInfo += `- \u7247\u6BB5\u8DF3\u8FC7 (Clip Skip): ${settings3.sd_cclip_skip || "\u65E0"}
`;
    settingsInfo += `- \u9AD8\u6E05\u4FEE\u590D: ${isSettingTrue4(settings3.sd_chires_fix) ? "\u662F" : "\u5426"}
`;
    settingsInfo += `- \u9AD8\u6E05\u4FEE\u590D\u6B65\u6570: ${settings3.sd_chires_steps || "\u65E0"}
`;
    settingsInfo += `- \u56FE\u50CF\u6269\u5927\u5668: ${settings3.sd_cchatu_8_upscaler || "\u65E0"}
`;
    settingsInfo += `- \u6269\u5927\u500D\u6570: ${settings3.sd_cupscale_factor || "\u65E0"}
`;
    settingsInfo += `- \u53BB\u566A\u5F3A\u5EA6: ${settings3.sd_cdenoising_strength || "\u65E0"}
`;
    settingsInfo += `- \u9762\u90E8\u4FEE\u590D: ${isSettingTrue4(settings3.restoreFaces) ? "\u662F" : "\u5426"}
`;
    settingsInfo += `- \u4F7F\u7528 ADetailer: ${isSettingTrue4(settings3.sd_cadetailer) ? "\u662F" : "\u5426"}
`;
  } else if (mode === "comfyui") {
    settingsInfo += `\u3010ComfyUI \u8BBE\u7F6E\u3011
`;
    settingsInfo += `- \u63D0\u793A\u8BCD\u9884\u8BBE: ${settings3.yusheid_comfyui || "\u65E0"}
`;
    settingsInfo += `- \u63D0\u793A\u8BCD\u66FF\u6362: ${settings3.prompt_replace_id_comfyui || "\u65E0"}
`;
    settingsInfo += `- \u6B63\u9762\u8D28\u91CF\u9884\u8BBE: ${settings3.AQT_comfyui || "\u65E0"}
`;
    settingsInfo += `- \u8D1F\u9762\u8D28\u91CF\u9884\u8BBE: ${settings3.UCP_comfyui || "\u65E0"}
`;
    settingsInfo += `- \u914D\u7F6E\u6863\u6848: ${settings3.comfyui_profile_id || "\u65E0"}
`;
    settingsInfo += `- \u5DE5\u4F5C\u6D41\u9884\u8BBE: ${settings3.workerid || "\u65E0"}
`;
    settingsInfo += `- \u4FEE\u56FE\u5DE5\u4F5C\u6D41\u9884\u8BBE: ${settings3.editWorkerid || "\u65E0"}
`;
    settingsInfo += `- API \u5730\u5740: ${settings3.comfyuiUrl || "\u65E0"}
`;
    settingsInfo += `- \u6A21\u578B\u6587\u4EF6: ${settings3.MODEL_NAME || "\u65E0"}
`;
    settingsInfo += `- \u91C7\u6837\u65B9\u6CD5: ${settings3.comfyuisamplerName || "\u65E0"}
`;
    settingsInfo += `- VAE: ${settings3.comfyui_vae || "\u65E0"}
`;
    settingsInfo += `- \u8C03\u5EA6\u5668: ${settings3.comfyui_scheduler || "\u65E0"}
`;
    settingsInfo += `- CLIP: ${settings3.comfyuiCLIPName || "\u65E0"}
`;
    settingsInfo += `- \u751F\u6210\u53C2\u6570 (\u9884\u8BBE\u5C3A\u5BF8: ${settings3.comfyui_size || "\u65E0"}, Width: ${settings3.comfyui_width}, Height: ${settings3.comfyui_height}, Steps: ${settings3.comfyui_steps}, Seed: ${settings3.comfyui_seed})
`;
    settingsInfo += `- CFG: ${settings3.cfg_comfyui || "\u65E0"}
`;
    settingsInfo += `- IPA \u7C7B\u578B: ${settings3.ipa || "\u65E0"}
`;
    settingsInfo += `- \u6C1B\u56F4\u5F3A\u5EA6: ${settings3.c_fenwei || "\u65E0"}
`;
    settingsInfo += `- \u7EC6\u8282\u5F3A\u5EA6: ${settings3.c_xijie || "\u65E0"}
`;
    settingsInfo += `- \u6743\u91CD: ${settings3.c_quanzhong || "\u65E0"}
`;
    settingsInfo += `- FaceID \u6743\u91CD: ${settings3.c_idquanzhong || "\u65E0"}
`;
    settingsInfo += `- weilin lora\u62A5\u9519\u4FEE\u590D: ${settings3.weilin_lora_fix || "\u65E0"}
`;
  } else if (mode === "banana") {
    const banana = settings3.banana || {};
    settingsInfo += `\u3010Banana / Grok \u8BBE\u7F6E\u3011
`;
    settingsInfo += `- API \u8FDE\u63A5\u5730\u5740: ${banana.apiUrl || "\u65E0"}
`;
    settingsInfo += `- \u56FE\u50CF\u6A21\u578B: ${banana.model || "\u65E0"}
`;
    settingsInfo += `- \u4FEE\u56FE\u6A21\u578B: ${banana.editModel || "\u65E0"}
`;
    settingsInfo += `- \u89C6\u9891\u6A21\u578B: ${banana.videoModel || "\u65E0"}
`;
    settingsInfo += `- \u957F\u5BBD\u6BD4: ${banana.aspectRatio || "\u65E0"}
`;
    settingsInfo += `- Grok / \u539F\u751F\u751F\u56FE\u63A5\u53E3: ${isSettingTrue4(banana.useGrokFormat) ? `\u5F00\u542F (\u7AEF\u70B9\u7B56\u7565: ${banana.grokEndpointType || "auto"}, \u53C2\u8003\u56FE\u683C\u5F0F: ${banana.grokRefImageParam || "auto"})` : "\u5173\u95ED"}
`;
    settingsInfo += `- \u4FEE\u56FE\u9884\u8BBE\u9009\u62E9: ${banana.editPresetId || "\u65E0"}
`;
    settingsInfo += `- \u89C6\u9891\u9884\u8BBE\u9009\u62E9: ${banana.videoPresetId || "\u65E0"}
`;
    settingsInfo += `- \u66FF\u6362\u89C4\u5219\u9884\u8BBE: ${banana.promptReplaceId || "\u65E0"}
`;
    settingsInfo += `- \u5BF9\u8BDD\u9884\u8BBE: ${banana.conversationPresetId || "\u65E0"}
`;
  }
  settingsInfo += "============================================\n\n";
  const finalLogContent = settingsInfo + logContent;
  const blob = new Blob([finalLogContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-log-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleClearLog() {
  stylishConfirm("\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u65E5\u5FD7\u5417\uFF1F\u6B64\u64CD\u4F5C\u5C06\u5F7B\u5E95\u5220\u9664\u6240\u6709\u5386\u53F2\u65E5\u5FD7\uFF0C\u4E0D\u53EF\u64A4\u9500\u3002").then((confirmed) => {
    if (confirmed) {
      clearAllLogs();
      saveSettingsDebounced();
      updateLogView();
      toastr.success("\u65E5\u5FD7\u5DF2\u5168\u90E8\u6E05\u7A7A\u3002");
    }
  });
}

function getISOWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 864e5 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function aggregateBuckets(stats, period) {
  const daily = stats.daily || {};
  if (period === "day") {
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, bucketKey: key, data: { ...daily[key] || {} } });
    }
    return result;
  }
  if (period === "week") {
    const weekMap = /* @__PURE__ */ new Map();
    for (let i = 83; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      const wk = getISOWeekKey(d);
      if (!weekMap.has(wk)) {
        const mon = new Date(d);
        mon.setDate(d.getDate() - ((d.getDay() || 7) - 1));
        weekMap.set(wk, { label: `${mon.getMonth() + 1}/${mon.getDate()}`, bucketKey: wk, data: {} });
      }
      for (const [b, c] of Object.entries(daily[dayKey] || {})) {
        const e = weekMap.get(wk);
        e.data[b] = (e.data[b] || 0) + c;
      }
    }
    return [...weekMap.values()].slice(-12);
  }
  if (period === "month") {
    const monthMap = /* @__PURE__ */ new Map();
    const now = /* @__PURE__ */ new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      monthMap.set(key, { label: `${d.getMonth() + 1}\u6708`, bucketKey: key, data: {} });
    }
    for (const [dayKey, dayData] of Object.entries(daily)) {
      const mk = dayKey.slice(0, 7);
      if (!monthMap.has(mk)) continue;
      const e = monthMap.get(mk);
      for (const [b, c] of Object.entries(dayData)) e.data[b] = (e.data[b] || 0) + c;
    }
    return [...monthMap.values()];
  }
  if (period === "year") {
    const yearMap = /* @__PURE__ */ new Map();
    for (const [dayKey, dayData] of Object.entries(daily)) {
      const yr = dayKey.slice(0, 4);
      if (!yearMap.has(yr)) yearMap.set(yr, { label: `${yr}\u5E74`, bucketKey: yr, data: {} });
      const e = yearMap.get(yr);
      for (const [b, c] of Object.entries(dayData)) e.data[b] = (e.data[b] || 0) + c;
    }
    return [...yearMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }
  return [];
}

function renderSummary(stats) {
  const el = document.getElementById("ch-gen-summary");
  if (!el) return;
  const totalGen = stats.total.success + stats.total.fail;
  if (totalGen === 0) {
    el.innerHTML = '<span style="opacity:0.5;">\u6682\u65E0\u751F\u56FE\u8BB0\u5F55\uFF0C\u5F00\u59CB\u4F60\u7684\u521B\u4F5C\u4E4B\u65C5\u5427\uFF01</span>';
    return;
  }
  const successRate = (stats.total.success / totalGen * 100).toFixed(1);
  const rateColor = Number(successRate) >= 90 ? "#4CAF50" : Number(successRate) >= 70 ? "#FFA726" : "#f44336";
  const items = [
    { val: stats.total.success, unit: "\u5F20", label: "\u7D2F\u8BA1\u751F\u6210", color: "#4CAF50" },
    { val: `${successRate}%`, label: "\u6210\u529F\u7387", color: rateColor }
  ];
  if (stats.firstGenTime) {
    const days = Math.max(1, Math.ceil((Date.now() - stats.firstGenTime) / 864e5));
    items.push({ val: days, unit: "\u5929", label: "\u521B\u4F5C\u5929\u6570", color: "#64B5F6" });
    items.push({ val: (stats.total.success / days).toFixed(1), label: "\u65E5\u5747\u5F20\u6570", color: "#FFB74D" });
  }
  if (stats.total.fail > 0) {
    items.push({ val: stats.total.fail, label: "\u5931\u8D25\u6B21\u6570", color: "#ef5350" });
  }
  let html = '<div class="ch-gen-summary-grid">';
  for (const item of items) {
    html += `<div class="ch-stat-card">`;
    html += `<div class="ch-stat-card-val" style="color:${item.color};">${item.val}`;
    if (item.unit) html += `<span class="ch-stat-card-unit">${item.unit}</span>`;
    html += `</div><div class="ch-stat-card-lbl">${item.label}</div></div>`;
  }
  html += "</div>";
  el.innerHTML = html;
}

function renderLegend() {
  const el = document.getElementById("ch-gen-legend");
  if (!el) return;
  let html = '<div class="ch-gen-legend-container">';
  html += `<span class="ch-gen-legend-item">`;
  html += `<svg width="16" height="8" style="flex-shrink:0;"><line x1="0" y1="4" x2="16" y2="4" stroke="rgba(255,255,255,0.85)" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  html += `\u603B\u8BA1</span>`;
  for (const [, meta] of Object.entries(BACKEND_LABELS)) {
    html += `<span class="ch-gen-legend-item">`;
    html += `<svg width="16" height="8" style="flex-shrink:0;"><line x1="0" y1="4" x2="16" y2="4" stroke="${meta.color}" stroke-width="2" stroke-linecap="round"/></svg>`;
    html += `${meta.icon} ${meta.name}</span>`;
  }
  html += "</div>";
  el.innerHTML = html;
}

function buildLinePath(values, xOf, yOf) {
  if (values.length === 0) return "";
  const pts = values.map((v, i) => [xOf(i), yOf(v)]);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const t = 0.38;
    d += ` C ${(pts[i][0] + dx * t).toFixed(1)} ${pts[i][1].toFixed(1)} ${(pts[i + 1][0] - dx * t).toFixed(1)} ${pts[i + 1][1].toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

function renderChart(period) {
  const el = document.getElementById("ch-gen-chart");
  if (!el) return;
  if (!_chartResizeObserver && typeof ResizeObserver !== "undefined") {
    let resizeTimer = null;
    let lastWidth = el.clientWidth;
    __set__chartResizeObserver(new ResizeObserver((entries) => {
      for (const entry of entries) {
        const currentWidth = entry.contentRect.width;
        if (currentWidth > 0 && Math.abs(currentWidth - lastWidth) > 15) {
          lastWidth = currentWidth;
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            renderChart(_currentPeriod);
          }, 120);
        }
      }
    }));
    if (el.parentElement) {
      _chartResizeObserver.observe(el.parentElement);
    }
  }
  document.querySelectorAll(".ch-period-btn").forEach((btn) => {
    const active = btn.dataset.period === period;
    btn.style.background = active ? "rgba(79,195,247,0.18)" : "transparent";
    btn.style.color = active ? "#4FC3F7" : "inherit";
    btn.style.borderColor = active ? "rgba(79,195,247,0.6)" : "currentColor";
    btn.style.fontWeight = active ? "bold" : "normal";
    btn.style.opacity = active ? "1" : "0.5";
  });
  const stats = getImageGenStats();
  const buckets = aggregateBuckets(stats, period);
  const totals = buckets.map((b) => Object.values(b.data).reduce((s, v) => s + v, 0));
  if (buckets.length === 0 || totals.every((t) => t === 0)) {
    el.innerHTML = '<div style="text-align:center; opacity:0.5; padding:28px 0; font-size:13px;">\u6682\u65E0\u6570\u636E</div>';
    return;
  }
  const maxVal = Math.max(...totals, 1);
  const n = buckets.length;
  const containerWidth = el.clientWidth > 50 ? el.clientWidth : window.innerWidth < 768 ? Math.max(300, window.innerWidth - 40) : 560;
  const isMobile3 = containerWidth <= 520 || window.innerWidth <= 768;
  const SW = Math.max(300, Math.round(containerWidth));
  const SH = isMobile3 ? 210 : 180;
  const PL = isMobile3 ? 36 : 40;
  const PR = isMobile3 ? 26 : 32;
  const PT = isMobile3 ? 20 : 16;
  const PB = isMobile3 ? 32 : 30;
  const pw = SW - PL - PR;
  const ph = SH - PT - PB;
  const xOf = (i) => PL + (n <= 1 ? pw / 2 : i / (n - 1) * pw);
  const yOf = (v) => PT + ph - v / maxVal * ph;
  const baseY = (PT + ph).toFixed(1);
  const fSizeY = isMobile3 ? 11 : 10;
  const fSizeX = isMobile3 ? 11 : 10;
  const fSizePeak = isMobile3 ? 12 : 11;
  const fSizeRight = isMobile3 ? 11 : 10;
  const totalLineWidth = isMobile3 ? 2.8 : 2.4;
  const backendLineWidth = isMobile3 ? 2 : 1.6;
  const totalDotR = isMobile3 ? 3.8 : 3;
  const backendDotR = isMobile3 ? 3 : 2.4;
  const TOTAL_COLOR = "rgba(255,255,255,0.9)";
  const series = [
    { key: "total", name: "\u603B\u8BA1", color: TOTAL_COLOR, values: totals, width: totalLineWidth, isTotal: true }
  ];
  for (const [backend, meta] of Object.entries(BACKEND_LABELS)) {
    const values = buckets.map((b) => b.data[backend] || 0);
    if (values.some((v) => v > 0)) {
      series.push({ key: backend, name: meta.name, color: meta.color, values, width: backendLineWidth, isTotal: false });
    }
  }
  const GRID_COUNT = 4;
  let gridSvg = "";
  for (let g = 0; g <= GRID_COUNT; g++) {
    const y = PT + g / GRID_COUNT * ph;
    const val = Math.round(maxVal * (1 - g / GRID_COUNT));
    gridSvg += `<line x1="${PL}" y1="${y.toFixed(1)}" x2="${SW - PR}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity="${g === GRID_COUNT ? "0.2" : "0.08"}" stroke-width="1" stroke-dasharray="${g === GRID_COUNT ? "none" : "3,3"}"/>`;
    if (val >= 0) {
      gridSvg += `<text x="${PL - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" style="fill:currentColor; opacity:0.6;" font-size="${fSizeY}" font-weight="500">${val}</text>`;
    }
  }
  const showEvery = isMobile3 ? n > 15 ? Math.ceil(n / 6) : n > 7 ? 2 : 1 : n > 20 ? Math.ceil(n / 10) : n > 10 ? 2 : 1;
  let xLabelsSvg = "";
  for (let i = 0; i < n; i++) {
    if (i % showEvery !== 0 && i !== n - 1) continue;
    xLabelsSvg += `<text x="${xOf(i).toFixed(1)}" y="${SH - 6}" text-anchor="middle" style="fill:currentColor; opacity:0.6;" font-size="${fSizeX}">${buckets[i].label}</text>`;
  }
  const totalLinePath = buildLinePath(totals, xOf, yOf);
  const totalAreaPath = `${totalLinePath} L ${xOf(n - 1).toFixed(1)} ${baseY} L ${xOf(0).toFixed(1)} ${baseY} Z`;
  const GRAD_ID = "chGenGrad";
  const gradDef = `<linearGradient id="${GRAD_ID}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${TOTAL_COLOR}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${TOTAL_COLOR}" stop-opacity="0.01"/>
    </linearGradient>`;
  const backendSeriesSvg = series.filter((s) => !s.isTotal).map((s) => {
    const lp = buildLinePath(s.values, xOf, yOf);
    if (!lp) return "";
    return `<path d="${lp}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.9"/>`;
  }).join("\n  ");
  let dotsSvg = "";
  const maxVisibleDots = isMobile3 ? 20 : 31;
  if (n <= maxVisibleDots) {
    for (const s of series) {
      for (let i = 0; i < n; i++) {
        const v = s.values[i];
        if (v === 0) continue;
        const tip = `${s.name} | ${buckets[i].bucketKey}: ${v}\u5F20`;
        const r = s.isTotal ? totalDotR : backendDotR;
        dotsSvg += `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="${r}" fill="${s.color}" stroke="rgba(0,0,0,0.4)" stroke-width="1.2"><title>${tip}</title></circle>`;
      }
    }
  }
  const maxIdx = totals.indexOf(Math.max(...totals));
  let peakSvg = "";
  if (totals[maxIdx] > 0) {
    const px = xOf(maxIdx), py = yOf(totals[maxIdx]);
    const lblX = Math.min(Math.max(px, PL + 16), SW - PR - 16);
    peakSvg = `<text x="${lblX.toFixed(1)}" y="${(py - 8).toFixed(1)}" text-anchor="middle" fill="${TOTAL_COLOR}" font-size="${fSizePeak}" font-weight="bold" opacity="0.95">${totals[maxIdx]}</text>`;
  }
  let rightLabelsSvg = "";
  const labeledSeries = [...series].reverse();
  const usedY = [];
  for (const s of labeledSeries) {
    const lastVal = s.values[n - 1];
    if (lastVal === 0) continue;
    let ly = yOf(lastVal) + 4;
    for (const uy of usedY) {
      if (Math.abs(ly - uy) < 13) ly = uy + 13;
    }
    usedY.push(ly);
    rightLabelsSvg += `<text x="${(SW - PR + 4).toFixed(1)}" y="${ly.toFixed(1)}" fill="${s.color}" font-size="${fSizeRight}" font-weight="bold" opacity="0.95">${lastVal}</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}" style="width:100%; height:auto; display:block; overflow:visible;">
  <defs>${gradDef}</defs>
  ${gridSvg}
  <path d="${totalAreaPath}" fill="url(#${GRAD_ID})"/>
  ${backendSeriesSvg}
  <path d="${totalLinePath}" fill="none" stroke="${TOTAL_COLOR}" stroke-width="${totalLineWidth}" stroke-linecap="round" stroke-linejoin="round"/>
  ${peakSvg}
  ${dotsSvg}
  ${xLabelsSvg}
  ${rightLabelsSvg}
</svg>`;
  el.innerHTML = svg;
}

function renderBackends(stats) {
  const el = document.getElementById("ch-gen-backends");
  if (!el) return;
  let maxSuccess = 0;
  for (const [, data] of Object.entries(stats.backends)) {
    if (data.success > maxSuccess) maxSuccess = data.success;
  }
  let html = '<div class="ch-backend-list">';
  for (const [backend, meta] of Object.entries(BACKEND_LABELS)) {
    const data = stats.backends[backend] || { success: 0, fail: 0 };
    if (data.success + data.fail === 0) continue;
    const pct = maxSuccess > 0 ? data.success / maxSuccess * 100 : 0;
    html += `<div class="ch-backend-item">`;
    html += `<div class="ch-backend-header">`;
    html += `<span class="ch-backend-title">${meta.icon} ${meta.name}</span>`;
    html += `<span class="ch-backend-value"><strong>${data.success}</strong>`;
    if (data.fail > 0) html += ` <span style="color:#ef5350; font-size:12px;">(${data.fail}\u2717)</span>`;
    html += `</span></div>`;
    html += `<div class="ch-backend-bar-container">`;
    html += `<div class="ch-backend-bar" style="width:${pct}%; background:${meta.color};"></div></div>`;
    html += `</div>`;
  }
  for (const [backend, data] of Object.entries(stats.backends)) {
    if (BACKEND_LABELS[backend] || data.success + data.fail === 0) continue;
    html += `<div style="font-size:13px; opacity:0.75; padding:4px 2px;">\u{1F539} ${backend}: <strong>${data.success}</strong> \u6210\u529F / <span style="color:#ef5350;">${data.fail} \u5931\u8D25</span></div>`;
  }
  html += "</div>";
  el.innerHTML = html;
}

function updateImageGenStats() {
  const stats = getImageGenStats();
  renderSummary(stats);
  renderLegend();
  renderChart(_currentPeriod);
  renderBackends(stats);
}

function handlePeriodChange(period) {
  __set__currentPeriod(period);
  renderChart(period);
}

function handleResetGenStats() {
  stylishConfirm("\u786E\u5B9A\u8981\u91CD\u7F6E\u6240\u6709\u751F\u56FE\u7EDF\u8BA1\u6570\u636E\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002").then((confirmed) => {
    if (confirmed) {
      resetImageGenStats();
      __set__currentPeriod("day");
      updateImageGenStats();
      toastr.info("\u751F\u56FE\u7EDF\u8BA1\u5DF2\u91CD\u7F6E\u3002");
    }
  });
}

function updateDebugStatus() {
  const enabled = isDebugEnabled();
  const logCount = getDebugLogCount();
  const toggle = document.getElementById("ch-debug-mode-toggle");
  const status = document.getElementById("ch-debug-status");
  const downloadBtn = document.getElementById("ch-download-debug-log");
  const clearBtn = document.getElementById("ch-clear-debug-log");
  if (toggle) {
    toggle.checked = enabled;
  }
  if (status) {
    if (enabled) {
      status.textContent = `\u5DF2\u542F\u7528 (${logCount} \u6761\u8BB0\u5F55)`;
      status.style.color = "#4CAF50";
    } else {
      status.textContent = logCount > 0 ? `\u5DF2\u7981\u7528 (${logCount} \u6761\u8BB0\u5F55)` : "\u5DF2\u7981\u7528";
      status.style.color = "#999";
    }
  }
  if (downloadBtn) {
    downloadBtn.disabled = logCount === 0;
  }
  if (clearBtn) {
    clearBtn.disabled = logCount === 0;
  }
}

function updateErrorStats() {
  const stats = getErrorStats();
  const statsElement = document.getElementById("ch-error-stats");
  const downloadBtn = document.getElementById("ch-download-errors");
  const clearBtn = document.getElementById("ch-clear-errors");
  if (statsElement) {
    if (stats.total === 0) {
      statsElement.innerHTML = '<span style="color: #4CAF50;">\u2713 \u6682\u65E0\u9519\u8BEF\u8BB0\u5F55</span>';
    } else {
      let html = `<div>\u603B\u9519\u8BEF\u6570: <strong>${stats.total}</strong> <span style="opacity:0.65;">\uFF08\u53BB\u91CD\u540E ${stats.unique} \u6761\uFF09</span></div>`;
      html += `<div>\u6700\u8FD1 1 \u5C0F\u65F6: <strong style="color: ${stats.recentHour > 0 ? "#f44336" : "#4CAF50"}">${stats.recentHour}</strong></div>`;
      html += `<div>\u6700\u8FD1 24 \u5C0F\u65F6: <strong>${stats.recent24h}</strong></div>`;
      if (Object.keys(stats.byType).length > 0) {
        html += '<div style="margin-top: 5px;">\u6309\u7C7B\u578B\u5206\u5E03:</div>';
        html += '<div style="margin-left: 10px;">';
        for (const [type, count] of Object.entries(stats.byType)) {
          html += `<div>\u2022 ${type}: ${count}</div>`;
        }
        html += "</div>";
      }
      if (Object.keys(stats.byScope || {}).length > 0) {
        html += '<div style="margin-top: 5px;">\u6309\u6765\u6E90\u5206\u5E03:</div>';
        html += '<div style="margin-left: 10px;">';
        for (const [scope, count] of Object.entries(stats.byScope)) {
          const scopeLabel = scope === "plugin" ? "\u672C\u63D2\u4EF6\u76F8\u5173" : scope === "external" ? "\u5916\u90E8\u6765\u6E90" : "\u672A\u77E5\u6765\u6E90";
          html += `<div>\u2022 ${scopeLabel}: ${count}</div>`;
        }
        html += "</div>";
      }
      statsElement.innerHTML = html;
    }
  }
  if (downloadBtn) {
    downloadBtn.disabled = stats.total === 0;
  }
  if (clearBtn) {
    clearBtn.disabled = stats.total === 0;
  }
}

function handleDebugToggle(event) {
  const enabled = event.target.checked;
  toggleDebug(enabled);
  updateDebugStatus();
  if (enabled) {
    toastr.info("\u{1F527} \u8C03\u8BD5\u6A21\u5F0F\u5DF2\u542F\u7528\uFF0C\u5F00\u59CB\u8BB0\u5F55\u8BE6\u7EC6\u65E5\u5FD7");
  } else {
    toastr.info("\u8C03\u8BD5\u6A21\u5F0F\u5DF2\u7981\u7528");
  }
}

function handleDownloadDebugLog() {
  const logContent = exportDebugLog();
  if (!logContent || logContent === "\u8C03\u8BD5\u65E5\u5FD7\u4E3A\u7A7A\u3002") {
    alert("\u8C03\u8BD5\u65E5\u5FD7\u4E3A\u7A7A\u3002");
    return;
  }
  const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-debug-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastr.success("\u8C03\u8BD5\u65E5\u5FD7\u5DF2\u4E0B\u8F7D");
}

function handleClearDebugLog() {
  stylishConfirm("\u786E\u5B9A\u8981\u6E05\u7A7A\u8C03\u8BD5\u65E5\u5FD7\u5417\uFF1F").then((confirmed) => {
    if (confirmed) {
      clearDebugLog();
      updateDebugStatus();
      toastr.info("\u8C03\u8BD5\u65E5\u5FD7\u5DF2\u6E05\u7A7A\u3002");
    }
  });
}

function handleViewErrors() {
  const errors = getAllErrors();
  if (errors.length === 0) {
    alert("\u6682\u65E0\u9519\u8BEF\u8BB0\u5F55\u3002");
    return;
  }
  const overlay2 = document.createElement("div");
  overlay2.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;";
  const modal = document.createElement("div");
  modal.style.cssText = "background: white; border-radius: 8px; padding: 20px; max-width: 800px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);";
  let html = '<h3 style="margin-top: 0;">\u9519\u8BEF\u8BE6\u60C5</h3>';
  html += '<div style="font-family: monospace; font-size: 12px; line-height: 1.6;">';
  const recentErrors = errors.slice(-20).reverse();
  for (const error of recentErrors) {
    const time = new Date(error.lastSeen || error.timestamp).toLocaleString();
    const firstSeen = new Date(error.firstSeen || error.timestamp).toLocaleString();
    const scopeLabel = error.sourceScope === "plugin" ? "\u672C\u63D2\u4EF6\u76F8\u5173" : error.sourceScope === "external" ? "\u5916\u90E8\u6765\u6E90" : "\u672A\u77E5\u6765\u6E90";
    html += `<div style="border-bottom: 1px solid #eee; padding: 10px 0;">`;
    html += `<div style="color: #f44336; font-weight: bold;">[${time}] ${error.type.toUpperCase()} <span style="color:#666; font-weight:normal;">(${scopeLabel})</span></div>`;
    html += `<div style="margin: 5px 0;"><strong>\u7C7B\u578B:</strong> ${escapeHtml4(error.message)}</div>`;
    html += `<div style="margin: 5px 0;"><strong>\u6B21\u6570:</strong> ${error.count || 1}</div>`;
    html += `<div style="margin: 5px 0;"><strong>\u9996\u6B21\u51FA\u73B0:</strong> ${escapeHtml4(firstSeen)}</div>`;
    if (error.source) {
      html += `<div style="margin: 5px 0;"><strong>\u6587\u4EF6:</strong> ${escapeHtml4(error.source)}</div>`;
    }
    if (error.lineno != null || error.colno != null) {
      html += `<div style="margin: 5px 0;"><strong>\u4F4D\u7F6E:</strong> ${escapeHtml4(`${error.lineno ?? "?"}:${error.colno ?? "?"}`)}</div>`;
    }
    if (error.context && error.context.message) {
      html += `<div style="margin: 5px 0;"><strong>\u5185\u5BB9:</strong> ${escapeHtml4(error.context.message)}</div>`;
    }
    if (error.context && error.context.title) {
      html += `<div style="margin: 5px 0;"><strong>\u6807\u9898:</strong> ${escapeHtml4(error.context.title)}</div>`;
    }
    if (error.errorMessage) {
      html += `<div style="margin: 5px 0;"><strong>\u8BE6\u60C5:</strong> ${escapeHtml4(error.errorMessage)}</div>`;
    }
    if (error.errorName) {
      html += `<div style="margin: 5px 0;"><strong>\u9519\u8BEF\u540D:</strong> ${escapeHtml4(error.errorName)}</div>`;
    }
    if (error.stack) {
      const stackLines = error.stack.split("\n").slice(0, 3);
      html += `<div style="margin: 5px 0;"><strong>\u5806\u6808:</strong></div>`;
      html += `<pre style="background: #f5f5f5; padding: 5px; overflow-x: auto; font-size: 11px;">${escapeHtml4(stackLines.join("\n"))}</pre>`;
    }
    html += "</div>";
  }
  html += "</div>";
  html += '<div style="text-align: right; margin-top: 15px;"><button id="close-error-modal" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">\u5173\u95ED</button></div>';
  modal.innerHTML = html;
  overlay2.appendChild(modal);
  document.body.appendChild(overlay2);
  document.getElementById("close-error-modal").addEventListener("click", () => {
    document.body.removeChild(overlay2);
  });
  overlay2.addEventListener("click", (e) => {
    if (e.target === overlay2) {
      document.body.removeChild(overlay2);
    }
  });
}

async function handleDownloadErrors() {
  const logContent = await exportErrors();
  if (!logContent || logContent === "\u6682\u65E0\u9519\u8BEF\u8BB0\u5F55\u3002") {
    alert("\u9519\u8BEF\u8BB0\u5F55\u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u5BFC\u51FA\u8BCA\u65AD\u5305\u3002");
    return;
  }
  const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-diagnostics-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastr.success("\u8BCA\u65AD\u5305\u5DF2\u4E0B\u8F7D\uFF08\u5305\u542B\u9519\u8BEF\u8BB0\u5F55\u548C\u6700\u8FD1 12 \u5C0F\u65F6\u65E5\u5FD7\uFF09");
}

function handleClearErrors() {
  stylishConfirm("\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u9519\u8BEF\u8BB0\u5F55\u5417\uFF1F").then((confirmed) => {
    if (confirmed) {
      clearErrors();
      updateErrorStats();
      toastr.info("\u9519\u8BEF\u8BB0\u5F55\u5DF2\u6E05\u7A7A\u3002");
    }
  });
}

function escapeHtml4(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function initLogSettings(settingsModal) {
  initializeLogPersistence().then(() => {
    updateLogView();
  }).catch((error) => {
    console.error("[LogSettings] \u521D\u59CB\u5316\u65E5\u5FD7\u6301\u4E45\u5316\u5931\u8D25:", error);
  });
  settingsModal.find("#ch-export-log").on("click", handleExportLog);
  settingsModal.find("#ch-clear-log").on("click", handleClearLog);
  settingsModal.find("#ch-debug-mode-toggle").on("change", handleDebugToggle);
  settingsModal.find("#ch-download-debug-log").on("click", handleDownloadDebugLog);
  settingsModal.find("#ch-clear-debug-log").on("click", handleClearDebugLog);
  settingsModal.find("#ch-view-errors").on("click", handleViewErrors);
  settingsModal.find("#ch-download-errors").on("click", handleDownloadErrors);
  settingsModal.find("#ch-clear-errors").on("click", handleClearErrors);
  settingsModal.find(".ch-period-btn").on("click", function() {
    handlePeriodChange(this.dataset.period);
  });
  settingsModal.find("#ch-refresh-gen-stats").on("click", () => {
    updateImageGenStats();
    toastr.info("\u7EDF\u8BA1\u5DF2\u5237\u65B0");
  });
  settingsModal.find("#ch-reset-gen-stats").on("click", handleResetGenStats);
  initTaskManager(settingsModal);
  updateDebugStatus();
  updateErrorStats();
  updateImageGenStats();
}

export { generationTabs, initLogSettings, statusIcons, statusTexts, typeTexts, updateErrorStats, updateImageGenStats, updateLogView };
