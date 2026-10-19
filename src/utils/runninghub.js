// 还原自打包产物 — 原始模块: utils/runninghub.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource } from "../../../../../../script.js";
import { EventType, extensionName } from "./config.js";
import { addLog, clearLog, convertImageToJpeg, deduplicateTags, fixMp4Faststart, fumian, getRandomYusheId, getSortedCharacterIds, isPluginEnabled, isPluginToastDisabled, parsePromptStringWithCoordinates, prompt_replace, prompt_replace_for_character, sleep, stripChineseAnnotations, zhengmian } from "./utils.js";
import { TaskStatus, TaskType, taskQueue } from "./taskQueue.js";
import { processCharacterPrompt } from "./characterprompt.js";
import { setItemImg } from "./database.js";
import { runningHubFetch, runningHubReadWithRetry } from "./runninghubScheduler.js";
import { buildGenParams } from "./genParams.js";
import { bananaGenerate } from "./banana.js";
import { recordImageGeneration } from "./imageGenStats.js";
import { initializeImageProcessing } from "./iframe/index.js";
import { acquireRunningHubKey, invalidateBalanceCache, recordKeyConsumption } from "./runninghubKeyManager.js";
import { formatRunningHubApiError } from "./runninghubVideo.js";
import "./iframe.js"; // init_iframe2

var currentTaskId3;

currentTaskId3 = null;

async function extractLargestMediaFromZip(arrayBuffer) {
  addLog("[RunningHub] \u5F00\u59CB\u89E3\u538B\u8F93\u51FA ZIP \u538B\u7F29\u5305...");
  const JSZipConstructor = window.stChatu8JSZip || window.JSZip;
  if (!JSZipConstructor || typeof JSZipConstructor.loadAsync !== "function") {
    throw new Error("JSZip \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u89E3\u538B ZIP \u6587\u4EF6");
  }
  const zip = await JSZipConstructor.loadAsync(arrayBuffer);
  addLog("[RunningHub] ZIP \u538B\u7F29\u5305\u52A0\u8F7D\u6210\u529F\uFF0C\u5F00\u59CB\u68C0\u7D22 files/ \u76EE\u5F55\u4E0B\u7684\u6587\u4EF6...");
  const fileEntries = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      fileEntries.push(zipEntry);
    }
  });
  if (fileEntries.length === 0) {
    throw new Error("ZIP \u538B\u7F29\u5305\u5185\u672A\u627E\u5230\u4EFB\u4F55\u6709\u6548\u8F93\u51FA\u6587\u4EF6");
  }
  addLog(`[RunningHub] \u53D1\u73B0 ${fileEntries.length} \u4E2A\u5019\u9009\u6587\u4EF6\uFF0C\u6B63\u5728\u5BFB\u627E\u4F53\u79EF\u6700\u5927\u7684\u4E3B\u5A92\u4F53\u6587\u4EF6...`);
  let largestEntry = null;
  let maxSizeBytes = -1;
  let largestBase64 = null;
  for (const entry of fileEntries) {
    try {
      const base64Data = await entry.async("base64");
      const approxSize = base64Data.length * 0.75;
      addLog(`[RunningHub] \u6587\u4EF6 ${entry.name}, \u5927\u5C0F\u7EA6: ${(approxSize / 1024).toFixed(1)} KB`);
      if (approxSize > maxSizeBytes) {
        maxSizeBytes = approxSize;
        largestEntry = entry;
        largestBase64 = base64Data;
      }
    } catch (e) {
      console.warn(`[RunningHub] \u8BFB\u53D6\u6587\u4EF6 ${entry.name} \u5931\u8D25:`, e);
    }
  }
  if (!largestEntry || !largestBase64) {
    throw new Error("\u672A\u80FD\u6210\u529F\u63D0\u53D6 ZIP \u4E2D\u7684\u6587\u4EF6\u6570\u636E");
  }
  const fileName = largestEntry.name.toLowerCase();
  let mimeType = "image/png";
  let isVideo = false;
  if (fileName.endsWith(".mp4")) {
    mimeType = "video/mp4";
    isVideo = true;
  } else if (fileName.endsWith(".webm")) {
    mimeType = "video/webm";
    isVideo = true;
  } else if (fileName.endsWith(".avi")) {
    mimeType = "video/avi";
    isVideo = true;
  } else if (fileName.endsWith(".mov")) {
    mimeType = "video/quicktime";
    isVideo = true;
  } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    mimeType = "image/jpeg";
  } else if (fileName.endsWith(".webp")) {
    mimeType = "image/webp";
  } else if (fileName.endsWith(".gif")) {
    mimeType = "image/gif";
  }
  addLog(`[RunningHub] \u63D0\u53D6\u6700\u5927\u4E3B\u6587\u4EF6: ${largestEntry.name} (${mimeType}, ${(maxSizeBytes / 1024 / 1024).toFixed(2)} MB)`);
  if (isVideo && mimeType === "video/mp4") {
    try {
      const u8 = await largestEntry.async("uint8array");
      const rawBlob = new Blob([u8], { type: "video/mp4" });
      const fixedBlob = await fixMp4Faststart(rawBlob);
      largestBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result || "";
          const comma = result.indexOf(",");
          resolve(comma !== -1 ? result.slice(comma + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fixedBlob);
      });
      addLog("[RunningHub] MP4 faststart \u5904\u7406\u5B8C\u6210");
    } catch (faststartErr) {
      console.warn("[RunningHub] faststart \u5904\u7406\u8DF3\u8FC7/\u5931\u8D25:", faststartErr);
    }
  }
  const dataUrl = `data:${mimeType};base64,${largestBase64}`;
  return { dataUrl, isVideo, fileName: largestEntry.name, mimeType };
}

function buildRunningHubWorkflow(rawJson, promptText, negativeText, genSettings) {
  let jsonStr = rawJson;
  let seed = parseInt(genSettings.seed);
  if (isNaN(seed) || seed === -1) {
    seed = Math.floor(Math.random() * 9007199254740991);
  }
  const width = genSettings.width || 1024;
  const height = genSettings.height || 1024;
  jsonStr = jsonStr.replace(/"%width%"/g, width).replace(/%width%/g, width);
  jsonStr = jsonStr.replace(/"%宽度%"/g, width).replace(/%宽度%/g, width);
  jsonStr = jsonStr.replace(/"%height%"/g, height).replace(/%height%/g, height);
  jsonStr = jsonStr.replace(/"%高度%"/g, height).replace(/%高度%/g, height);
  jsonStr = jsonStr.replace(/"%seed%"/g, seed).replace(/%seed%/g, seed);
  jsonStr = jsonStr.replace(/"%种子%"/g, seed).replace(/%种子%/g, seed);
  jsonStr = jsonStr.replace(/"%steps%"/g, genSettings.steps || "20").replace(/%steps%/g, genSettings.steps || "20");
  jsonStr = jsonStr.replace(/"%步数%"/g, genSettings.steps || "20").replace(/%步数%/g, genSettings.steps || "20");
  jsonStr = jsonStr.replace(/"%视频步数%"/g, genSettings.steps || "20").replace(/%视频步数%/g, genSettings.steps || "20");
  if (genSettings.model) {
    jsonStr = jsonStr.replace(/%MODEL_NAME%/g, genSettings.model).replace(/%模型%/g, genSettings.model);
  }
  if (genSettings.sampler_name) {
    jsonStr = jsonStr.replace(/%sampler_name%/g, genSettings.sampler_name).replace(/%采样方法%/g, genSettings.sampler_name);
  }
  if (genSettings.vae) {
    jsonStr = jsonStr.replace(/%vae%/g, genSettings.vae).replace(/%VAE%/g, genSettings.vae);
  }
  if (genSettings.scheduler) {
    jsonStr = jsonStr.replace(/%scheduler%/g, genSettings.scheduler).replace(/%调度器%/g, genSettings.scheduler);
  }
  if (genSettings.clip) {
    jsonStr = jsonStr.replace(/%clip%/g, genSettings.clip).replace(/%CLIP%/g, genSettings.clip);
  }
  if (genSettings.cfg) {
    jsonStr = jsonStr.replace(/"%cfg_scale%"/g, genSettings.cfg).replace(/%cfg_scale%/g, genSettings.cfg);
    jsonStr = jsonStr.replace(/"%CFG%"/g, genSettings.cfg).replace(/%CFG%/g, genSettings.cfg);
  }
  let megapixels = parseFloat(genSettings.megapixels) || 0.9;
  jsonStr = jsonStr.replace(/"%像素%"/g, megapixels).replace(/%像素%/g, megapixels);
  jsonStr = jsonStr.replace(/"%megapixels%"/g, megapixels).replace(/%megapixels%/g, megapixels);
  jsonStr = jsonStr.replace(/"%视频秒数%"/g, genSettings.duration || "4").replace(/%视频秒数%/g, genSettings.duration || "4");
  jsonStr = jsonStr.replace(/"%duration%"/g, genSettings.duration || "4").replace(/%duration%/g, genSettings.duration || "4");
  let escapedPrompt = (promptText || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "");
  jsonStr = jsonStr.replace(/%prompt%/g, escapedPrompt);
  jsonStr = jsonStr.replace(/%正面提示词%/g, escapedPrompt);
  jsonStr = jsonStr.replace(/%提示词%/g, escapedPrompt);
  let escapedNegative = (negativeText || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "");
  jsonStr = jsonStr.replace(/%negative_prompt%/g, escapedNegative);
  jsonStr = jsonStr.replace(/%负面提示词%/g, escapedNegative);
  const defaultImgName = (genSettings.defaultImg || "").trim() || "09baa6b5a6d1b6afa83aaad55c7261c9a413f9bdfdea045c49efb5f3303165fa.jpg";
  const defaultAudName = (genSettings.defaultAud || "").trim() || "eded6ff68fe3fda18f0f31ecfbb1ff6b7494c2d17ff35b32d3a5ad7ccecf03f4.m4a";
  const uploadedMedia = genSettings.uploadedMedia || { img: {}, aud: {} };
  for (let i = 1; i <= 9; i++) {
    const choice = genSettings[`img_ctrl_${i}`] || "bypass";
    const switchVal = choice === "open" || choice === "1" || choice === "0" ? 1 : 2;
    jsonStr = jsonStr.replace(new RegExp(`"%\u56FE\u7247${i}\u63A7\u5236%"`, "g"), switchVal);
    const imgName = uploadedMedia.img?.[i] || defaultImgName;
    jsonStr = jsonStr.replace(new RegExp(`%\u56FE\u7247${i}%`, "g"), imgName);
  }
  for (let i = 1; i <= 3; i++) {
    const choice = genSettings[`aud_ctrl_${i}`] || "bypass";
    const switchVal = choice === "open" || choice === "1" || choice === "0" ? 1 : 2;
    jsonStr = jsonStr.replace(new RegExp(`"%\u97F3\u9891${i}\u63A7\u5236%"`, "g"), switchVal);
    const audName = uploadedMedia.aud?.[i] || defaultAudName;
    jsonStr = jsonStr.replace(new RegExp(`%\u97F3\u9891${i}%`, "g"), audName);
  }
  let promptObj;
  try {
    promptObj = JSON.parse(jsonStr);
  } catch (err) {
    console.error("[RunningHub] JSON \u89E3\u6790\u5931\u8D25:", jsonStr);
    throw new Error("\u5DE5\u4F5C\u6D41 JSON \u6784\u5EFA\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u63D0\u793A\u8BCD\u6216\u6A21\u677F\u683C\u5F0F\u3002");
  }
  let rawTplObj = {};
  try {
    rawTplObj = JSON.parse(rawJson);
  } catch (e) {
  }
  for (let i = 1; i <= 9; i++) {
    const choice = genSettings[`img_ctrl_${i}`] || "bypass";
    let nodeMode = 0;
    if (choice === "bypass" || choice === "4") nodeMode = 4;
    else if (choice === "mute" || choice === "2") nodeMode = 2;
    for (const [nodeId, rawNode] of Object.entries(rawTplObj)) {
      const rawNodeStr = JSON.stringify(rawNode);
      if (rawNodeStr.includes(`%\u56FE\u7247${i}%`) || rawNodeStr.includes(`%\u56FE\u7247${i}\u63A7\u5236%`)) {
        if (promptObj[nodeId]) {
          promptObj[nodeId].mode = nodeMode;
        }
      }
    }
  }
  for (let i = 1; i <= 3; i++) {
    const choice = genSettings[`aud_ctrl_${i}`] || "bypass";
    let nodeMode = 0;
    if (choice === "bypass" || choice === "4") nodeMode = 4;
    else if (choice === "mute" || choice === "2") nodeMode = 2;
    for (const [nodeId, rawNode] of Object.entries(rawTplObj)) {
      const rawNodeStr = JSON.stringify(rawNode);
      if (rawNodeStr.includes(`%\u97F3\u9891${i}%`) || rawNodeStr.includes(`%\u97F3\u9891${i}\u63A7\u5236%`)) {
        if (promptObj[nodeId]) {
          promptObj[nodeId].mode = nodeMode;
        }
      }
    }
  }
  return { promptObj, seedUsed: seed };
}

function extractNodeInfoListFromWorkflow(rawJson, promptObj) {
  const nodeInfoList = [];
  let rawObj = null;
  try {
    rawObj = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
  } catch (e) {
    console.warn("[RunningHub v2] \u89E3\u6790\u539F\u59CB\u5DE5\u4F5C\u6D41 JSON \u5931\u8D25\uFF0C\u65E0\u6CD5\u8FDB\u884C diff \u6BD4\u5BF9:", e);
  }
  if (rawObj && typeof rawObj === "object" && promptObj && typeof promptObj === "object") {
    for (const [nodeId, modifiedNode] of Object.entries(promptObj)) {
      if (!modifiedNode || typeof modifiedNode !== "object") continue;
      const rawNode = rawObj[nodeId];
      if (!rawNode) {
        console.warn(`[RunningHub v2] \u539F\u59CB\u6A21\u677F\u4E2D\u4E0D\u5B58\u5728\u8282\u70B9 ${nodeId}\uFF0C\u8DF3\u8FC7\u8BE5\u8986\u76D6\u9879\u4EE5\u9632\u4E91\u7AEF 803 \u62A5\u9519`);
        continue;
      }
      const modifiedInputs = modifiedNode.inputs || {};
      const rawInputs = rawNode?.inputs || {};
      for (const [fieldName, modVal] of Object.entries(modifiedInputs)) {
        if (Array.isArray(modVal) && modVal.length === 2 && (typeof modVal[0] === "string" || typeof modVal[0] === "number")) {
          continue;
        }
        const rawVal = rawInputs[fieldName];
        const isPlaceholder = typeof rawVal === "string" && /%[^%]+%/.test(rawVal);
        const isDifferent = JSON.stringify(modVal) !== JSON.stringify(rawVal);
        if (isPlaceholder || isDifferent || rawVal === void 0) {
          nodeInfoList.push({
            nodeId: String(nodeId),
            fieldName,
            fieldValue: modVal
          });
        }
      }
    }
  }
  return nodeInfoList;
}

async function generateRunningHubImage({ prompt: link, width: Xwidth, height: Xheight, change, extraNegativePrompt }) {
  clearLog();
  let taskType = TaskType.RUNNINGHUB_IMG;
  let taskTypeName = "RunningHub \u666E\u901A\u751F\u56FE";
  let isVideoTask = false;
  if (change && (change.includes("{RunningHub\u53C2\u8003\u751F\u89C6\u9891}") || change.includes("{\u53C2\u8003\u751F\u89C6\u9891}"))) {
    taskType = TaskType.RUNNINGHUB_REF2VID;
    taskTypeName = "RunningHub \u53C2\u8003\u751F\u89C6\u9891";
    isVideoTask = true;
  } else if (change && (change.includes("{RunningHub\u56FE\u751F\u89C6\u9891}") || change.includes("{\u56FE\u751F\u89C6\u9891}") || change.includes("{RunningHub\u89C6\u9891}"))) {
    taskType = TaskType.RUNNINGHUB_IMG2VID;
    taskTypeName = "RunningHub \u56FE\u751F\u89C6\u9891";
    isVideoTask = true;
  }
  const taskId = taskQueue.addTask({
    name: (link || "").substring(0, 30) + (link && link.length > 30 ? "..." : ""),
    type: taskType,
    prompt: link
  });
  currentTaskId3 = taskId;
  const startTime = Date.now();
  if (!isPluginToastDisabled()) {
    toastr.info(`\u{1F3A8} \u5DF2\u53D1\u8D77 ${taskTypeName} \u8BF7\u6C42...`);
  }
  link = typeof link === "string" ? link : "";
  change = typeof change === "string" ? change : "";
  let change_ = "";
  if (change) {
    change_ = change.replaceAll("{RunningHub\u53C2\u8003\u751F\u89C6\u9891}", "").replaceAll("{\u53C2\u8003\u751F\u89C6\u9891}", "").replaceAll("{RunningHub\u56FE\u751F\u89C6\u9891}", "").replaceAll("{\u56FE\u751F\u89C6\u9891}", "").replaceAll("{RunningHub\u89C6\u9891}", "").replaceAll("{RunningHub\u5C40\u90E8\u91CD\u7ED8}", "").replaceAll("{\u5C40\u90E8\u91CD\u7ED8}", "");
  } else {
    change_ = link;
  }
  const sizeRegex = /,?\s*(\d{2,4})x(\d{2,4})(?=[;\s]|$)/i;
  if (typeof link === "string") {
    const match = link.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        Xwidth = parseInt(match[1], 10);
        Xheight = parseInt(match[2], 10);
      }
    }
    link = link.replace(sizeRegex, "");
  }
  if (typeof change_ === "string") {
    const match = change_.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        Xwidth = parseInt(match[1], 10);
        Xheight = parseInt(match[2], 10);
      }
    }
    change_ = change_.replace(sizeRegex, "");
  }
  link = processCharacterPrompt(link);
  link = await stripChineseAnnotations(link);
  change_ = processCharacterPrompt(change_);
  change_ = await stripChineseAnnotations(change_);
  const settings3 = extension_settings[extensionName];
  const rawApiKey = settings3.runninghub_apiKey;
  let workflowCategoryName = "\u4E3B\u5DE5\u4F5C\u6D41";
  let targetWorkerid = settings3.runninghub_workerid;
  let targetWorkflowId = settings3.runninghub_workflow_ids?.[targetWorkerid] || settings3.runninghub_workflowId;
  let targetWorkerJson = settings3.runninghub_worker || settings3.runninghub_workers?.[targetWorkerid] || "{}";
  if (taskType === TaskType.RUNNINGHUB_REF2VID) {
    workflowCategoryName = "\u53C2\u8003\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41";
    targetWorkerid = settings3.runninghub_ref2vid_workerid || targetWorkerid;
    targetWorkflowId = settings3.runninghub_workflow_ids?.[targetWorkerid] || settings3.runninghub_ref2vid_workflowId || targetWorkflowId;
    targetWorkerJson = settings3.runninghub_ref2vid_worker || settings3.runninghub_workers?.[targetWorkerid] || targetWorkerJson;
  } else if (taskType === TaskType.RUNNINGHUB_IMG2VID) {
    workflowCategoryName = "\u56FE\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41";
    targetWorkerid = settings3.runninghub_img2vid_workerid || targetWorkerid;
    targetWorkflowId = settings3.runninghub_workflow_ids?.[targetWorkerid] || settings3.runninghub_img2vid_workflowId || targetWorkflowId;
    targetWorkerJson = settings3.runninghub_img2vid_worker || settings3.runninghub_workers?.[targetWorkerid] || targetWorkerJson;
  }
  const workflowId = targetWorkflowId;
  if (!rawApiKey) {
    taskQueue.completeTask(taskId, false);
    currentTaskId3 = null;
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 RunningHub API Key");
  }
  if (!workflowId) {
    taskQueue.completeTask(taskId, false);
    currentTaskId3 = null;
    throw new Error(`\u5F53\u524D\u3010${workflowCategoryName}\u3011\u9009\u4E2D\u7684\u9884\u8BBE "${targetWorkerid}" \u5C1A\u672A\u914D\u7F6E\u5DE5\u4F5C\u6D41 ID\uFF0C\u8BF7\u5728\u5DE5\u4F5C\u6D41\u8BBE\u7F6E\u4E2D\u586B\u5199`);
  }
  addLog(`\u5F00\u59CB RunningHub \u751F\u56FE\u6D41\u7A0B\u3002\u5DE5\u4F5C\u6D41\u5206\u7C7B: \u3010${workflowCategoryName}\u3011\uFF0C\u5DE5\u4F5C\u6D41 ID: ${workflowId}`);
  addLog(`\u8BF7\u6C42\u5DE5\u4F5C\u6D41\u9884\u8BBE: ${targetWorkerid || "\u9ED8\u8BA4"}`);
  addLog(`\u8BF7\u6C42\u5C3A\u5BF8: \u5BBD\u5EA6 - ${Xwidth || "\u9ED8\u8BA4"}, \u9AD8\u5EA6 - ${Xheight || "\u9ED8\u8BA4"}`);
  const promptForGeneration = change_ && change_.trim() !== "" ? change_ : link;
  addLog(`\u7528\u4E8E\u751F\u6210\u7684Tag: ${promptForGeneration}`);
  let Divide_roles = false;
  if (promptForGeneration.includes("Scene Composition")) {
    Divide_roles = true;
  }
  addLog(`\u662F\u5426\u542F\u7528\u5206\u89D2\u8272\u6A21\u5F0F (Divide_roles): ${Divide_roles}`);
  let prompt_data = {};
  let mainPrompt = "";
  let other_prompt = "";
  if (Divide_roles) {
    addLog("\u5206\u89D2\u8272\u6A21\u5F0F: \u89E3\u6790\u5E26\u5750\u6807\u7684\u63D0\u793A\u8BCD\u5B57\u7B26\u4E32\u3002");
    prompt_data = parsePromptStringWithCoordinates(promptForGeneration);
    mainPrompt = prompt_data["Scene Composition"];
    const charIds = getSortedCharacterIds(prompt_data);
    for (const i of charIds) {
      if (prompt_data[`Character ${i} Prompt`]) {
        other_prompt = other_prompt + ", " + prompt_data[`Character ${i} Prompt`];
      }
    }
  } else {
    addLog("\u6807\u51C6\u6A21\u5F0F: \u4F7F\u7528\u8BF7\u6C42\u4E2D\u7684 prompt\u3002");
    mainPrompt = deduplicateTags(promptForGeneration);
  }
  let { modifiedPrompt, insertions } = await prompt_replace(mainPrompt, other_prompt);
  if (Divide_roles) {
    const charIds = getSortedCharacterIds(prompt_data);
    for (const i of charIds) {
      if (prompt_data[`Character ${i} Prompt`]) {
        modifiedPrompt = modifiedPrompt + " | " + prompt_replace_for_character(prompt_data[`Character ${i} Prompt`], (mainPrompt || "") + " " + (other_prompt || ""));
      }
    }
  }
  const _rh_yushe_id = getRandomYusheId("yusheid_runninghub");
  const _rh_preset = settings3.yushe?.[_rh_yushe_id] || { fixedPrompt: "", fixedPrompt_end: "", negativePrompt: "" };
  let prompt2 = await zhengmian(
    _rh_preset.fixedPrompt,
    modifiedPrompt,
    _rh_preset.fixedPrompt_end,
    settings3.AQT_runninghub,
    insertions
  );
  let negative_prompt = await fumian(_rh_preset.negativePrompt, settings3.UCP_runninghub);
  if (!Divide_roles && window.collectedCharacterNegatives) {
    const characterNegatives = window.collectedCharacterNegatives.trim();
    if (characterNegatives) {
      negative_prompt = negative_prompt ? `${negative_prompt}, ${characterNegatives}` : characterNegatives;
      addLog(`[\u89D2\u8272\u8D1F\u9762] \u6DFB\u52A0\u89D2\u8272\u8D1F\u9762\u63D0\u793A\u8BCD: ${characterNegatives}`);
    }
  }
  if (extraNegativePrompt && extraNegativePrompt.trim()) {
    const trimmedExtra = extraNegativePrompt.trim();
    negative_prompt = negative_prompt ? `${negative_prompt}, ${trimmedExtra}` : trimmedExtra;
    addLog(`[\u667A\u7ED8\u59EC] \u6DFB\u52A0\u989D\u5916\u8D1F\u9762\u63D0\u793A\u8BCD: ${trimmedExtra}`);
  }
  prompt2 = prompt2.replaceAll("\n", ",").replace(/,{2,}/g, ",");
  negative_prompt = negative_prompt.replaceAll("\n", ",").replace(/,{2,}/g, ",");
  addLog(`[RunningHub] \u6B63\u9762\u63D0\u793A\u8BCD: ${prompt2}`);
  addLog(`[RunningHub] \u8D1F\u9762\u63D0\u793A\u8BCD: ${negative_prompt}`);
  const reqWidth = Xwidth || (settings3.runninghub_width ? parseInt(settings3.runninghub_width) : null) || (settings3.size ? parseInt(settings3.size.split("x")[0]) : 1024) || 1024;
  const reqHeight = Xheight || (settings3.runninghub_height ? parseInt(settings3.runninghub_height) : null) || (settings3.size ? parseInt(settings3.size.split("x")[1]) : 1024) || 1024;
  const rawJson = targetWorkerJson || settings3.runninghub_worker || settings3.runninghub_workers?.[settings3.runninghub_workerid] || "{}";
  const genSettings = {
    width: reqWidth,
    height: reqHeight,
    seed: isVideoTask ? settings3.runninghub_val_seed : settings3.runninghub_seed ?? settings3.runninghub_val_seed,
    steps: isVideoTask ? settings3.runninghub_val_steps : settings3.runninghub_steps ?? settings3.runninghub_val_steps,
    model: settings3.runninghub_model,
    sampler_name: settings3.runninghub_sampler_name,
    vae: settings3.runninghub_vae,
    scheduler: settings3.runninghub_scheduler,
    clip: settings3.runninghub_clip_name,
    cfg: settings3.runninghub_cfg,
    megapixels: settings3.runninghub_val_megapixels,
    duration: settings3.runninghub_val_duration,
    defaultImg: settings3.runninghub_val_default_img,
    defaultAud: settings3.runninghub_val_default_aud,
    uploadedMedia: settings3.runninghub_uploadedMedia || { img: {}, aud: {} },
    img_ctrl_1: settings3.runninghub_img_ctrl_1,
    img_ctrl_2: settings3.runninghub_img_ctrl_2,
    img_ctrl_3: settings3.runninghub_img_ctrl_3,
    img_ctrl_4: settings3.runninghub_img_ctrl_4,
    img_ctrl_5: settings3.runninghub_img_ctrl_5,
    img_ctrl_6: settings3.runninghub_img_ctrl_6,
    img_ctrl_7: settings3.runninghub_img_ctrl_7,
    img_ctrl_8: settings3.runninghub_img_ctrl_8,
    img_ctrl_9: settings3.runninghub_img_ctrl_9,
    aud_ctrl_1: settings3.runninghub_aud_ctrl_1,
    aud_ctrl_2: settings3.runninghub_aud_ctrl_2,
    aud_ctrl_3: settings3.runninghub_aud_ctrl_3
  };
  const { promptObj, seedUsed } = buildRunningHubWorkflow(rawJson, prompt2, negative_prompt, genSettings);
  const _rh_gen_params = buildGenParams("RunningHub", {
    model: workflowId,
    yushe: _rh_yushe_id,
    yusheRandom: settings3.randomYushe === "true",
    promptReplaceId: settings3.prompt_replace_id,
    resolvedPrompt: prompt2,
    negativePrompt: negative_prompt,
    width: reqWidth,
    height: reqHeight,
    seed: seedUsed,
    steps: genSettings.steps,
    duration: settings3.runninghub_val_duration
  });
  const abortController = new AbortController();
  const onTaskCancelled = (data) => {
    if (data && data.taskId === taskId) {
      abortController.abort(new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88"));
    }
  };
  eventSource.on("st_chatu8_task_cancelled", onTaskCancelled);
  const abortSignal = abortController.signal;
  let keyLease = null;
  let apiKey = null;
  let runTaskId = null;
  let isRetry = false;
  let maxedRetryCount = 0;
  try {
    while (true) {
      if (!taskQueue.isTaskInQueue(taskId) || abortSignal.aborted) {
        addLog("\u6B63\u5F0F\u8BF7\u6C42\u524D\u68C0\u6D4B\u5230\u4EFB\u52A1\u5DF2\u88AB\u53D6\u6D88\u3002");
        throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
      }
      addLog(`[RunningHub] \u6B63\u5728\u4ECE Key \u6C60\u5206\u914D\u7A7A\u95F2\u4E14\u6709\u4F59\u989D\u7684 API Key (\u4F18\u5148\u7EA7: ${isRetry ? "\u9AD8" : "\u666E\u901A"})...`);
      keyLease = await acquireRunningHubKey({
        taskId,
        isTaskCancelled: () => !taskQueue.isTaskInQueue(taskId),
        priority: isRetry ? "high" : "normal",
        abortSignal
      });
      apiKey = keyLease.apiKey;
      taskQueue.updateStatus(taskId, "running");
      const nodeInfoList = extractNodeInfoListFromWorkflow(rawJson, promptObj);
      addLog(`[RunningHub v2] \u63D0\u53D6\u5230 ${nodeInfoList.length} \u4E2A\u8986\u76D6\u53C2\u6570: ${nodeInfoList.map((n) => `${n.nodeId}.${n.fieldName}`).join(", ")}`);
      addLog(`[RunningHub v2] \u6B63\u5728\u53D1\u8D77\u4EFB\u52A1\u8BF7\u6C42 (Workflow ID: ${workflowId})...`);
      const payload = {
        nodeInfoList,
        addMetadata: true,
        usePersonalQueue: false
      };
      if (settings3.runninghub_instance_type && settings3.runninghub_instance_type !== "default") {
        payload.instanceType = settings3.runninghub_instance_type;
      }
      if (settings3.runninghub_retain_seconds) {
        const retain = parseInt(settings3.runninghub_retain_seconds, 10);
        if (!isNaN(retain) && retain >= 10 && retain <= 180) {
          payload.retainSeconds = retain;
        }
      }
      const createRes = await fetch(`https://www.runninghub.ai/openapi/v2/run/workflow/${workflowId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: abortSignal
      });
      const createData = await createRes.json();
      if (createData.taskId) {
        runTaskId = createData.taskId;
        if (keyLease && typeof keyLease.setRemoteTaskId === "function") {
          keyLease.setRemoteTaskId(runTaskId);
        }
        if (keyLease && typeof keyLease.isCancelled === "function" && keyLease.isCancelled() || abortSignal.aborted) {
          throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
        }
        addLog(`[RunningHub v2] \u4EFB\u52A1\u5DF2\u521B\u5EFA\uFF0CID: ${runTaskId}\uFF0C\u8FDB\u5165\u8F6E\u8BE2\u7B49\u5F85...`);
        break;
      }
      const errMsg = formatRunningHubApiError({ ...createData, _workflowId: workflowId }, "\u521B\u5EFA RunningHub \u4EFB\u52A1\u5931\u8D25");
      if (/TASK_QUEUE_MAXED/i.test(errMsg) || /queue.*max/i.test(errMsg) || /并发.*满/i.test(errMsg)) {
        maxedRetryCount++;
        if (maxedRetryCount > 5) {
          throw new Error("RunningHub \u4E91\u7AEF\u5E76\u53D1\u961F\u5217\u6301\u7EED\u6EE1\u8F7D(\u5DF2\u91CD\u8BD55\u6B21)\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5");
        }
        addLog(`[RunningHub] \u5B98\u65B9\u63D0\u793A\u961F\u5217\u5DF2\u6EE1 (${errMsg})\uFF0C\u91CA\u653E\u5F53\u524D Key \u5E76\u8F6C\u5165\u961F\u9996\u7B49\u5F85\u4F18\u5148\u91CD\u8BD5...`);
        if (keyLease && typeof keyLease.markRejected === "function") {
          keyLease.markRejected();
        } else if (keyLease && typeof keyLease.releaseKey === "function") {
          keyLease.releaseKey();
        }
        keyLease = null;
        taskQueue.updateStatus(taskId, TaskStatus.QUEUED);
        isRetry = true;
        continue;
      }
      throw new Error(errMsg);
    }
    let attempts = 0;
    let outputUrl = null;
    let rhTaskCostTime = null;
    let rhConsumeCoins = null;
    while (true) {
      await sleep(2e3);
      if (!taskQueue.isTaskInQueue(taskId) || abortSignal.aborted) {
        addLog("\u8F6E\u8BE2\u671F\u95F4\u4EFB\u52A1\u5DF2\u88AB\u53D6\u6D88\u3002");
        throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
      }
      const statData = await runningHubReadWithRetry(async () => {
        const statRes = await runningHubFetch("https://www.runninghub.ai/openapi/v2/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({ taskId: runTaskId }),
          signal: abortSignal
        }, 15e3);
        return await statRes.json();
      }, { signal: abortSignal });
      const status = statData.status;
      if (status === "SUCCESS") {
        addLog("[RunningHub v2] \u4EFB\u52A1\u6267\u884C\u6210\u529F\uFF0C\u6B63\u5728\u89E3\u6790\u8F93\u51FA\u7ED3\u679C...");
        if (statData.results && statData.results.length > 0) {
          const mainItem = statData.results[0];
          outputUrl = mainItem.url;
          rhTaskCostTime = statData.taskCostTime != null ? String(statData.taskCostTime) : null;
          rhConsumeCoins = statData.consumeCoins != null ? String(statData.consumeCoins) : null;
          const rhDetailParts2 = [];
          if (rhTaskCostTime != null) rhDetailParts2.push(`RH\u6D88\u8017\u65F6\u95F4: ${rhTaskCostTime}\u79D2`);
          if (rhConsumeCoins != null) rhDetailParts2.push(`\u6D88\u8017RH\u70B9\u6570: ${rhConsumeCoins}`);
          const rhDetailText2 = rhDetailParts2.length > 0 ? ` (${rhDetailParts2.join(", ")})` : "";
          addLog(`[RunningHub v2] \u83B7\u53D6\u5230\u8F93\u51FA URL: ${outputUrl}${rhDetailText2} (\u683C\u5F0F: ${mainItem.outputType || "\u672A\u77E5"}, Node: ${mainItem.nodeId})`);
        } else {
          throw new Error("RunningHub \u4EFB\u52A1\u6210\u529F\u4F46\u672A\u8FD4\u56DE\u4EFB\u4F55\u8F93\u51FA\u6587\u4EF6");
        }
        break;
      } else if (status === "FAILED") {
        throw new Error(statData.errorMessage || "RunningHub \u4EFB\u52A1\u6267\u884C\u5931\u8D25");
      } else {
        addLog(`[RunningHub v2] \u4EFB\u52A1\u8FD0\u884C\u4E2D (${status || "QUEUED"})...`);
      }
      attempts++;
      if (attempts > 300) {
        throw new Error("RunningHub \u4EFB\u52A1\u6267\u884C\u8D85\u65F6 (10\u5206\u949F)");
      }
    }
    addLog(`[RunningHub] \u6B63\u5728\u4E0B\u8F7D\u751F\u6210\u7684\u6587\u4EF6...`);
    const fileRes = await fetch(outputUrl);
    const fileBlob = await fileRes.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    let finalImageData = null;
    let isVideo = false;
    let mediaFormat = "image/png";
    const isZip = outputUrl.toLowerCase().includes(".zip") || fileBlob.type.includes("zip") || fileBlob.type.includes("octet-stream");
    if (isZip) {
      const extracted = await extractLargestMediaFromZip(arrayBuffer);
      finalImageData = extracted.dataUrl;
      isVideo = extracted.isVideo;
      mediaFormat = extracted.mimeType || (isVideo ? "video/mp4" : "image/png");
    } else {
      let processedBlob = fileBlob;
      const isMp4 = outputUrl.match(/\.mp4($|\?)/i) || fileBlob.type.includes("mp4");
      if (isMp4) {
        try {
          processedBlob = await fixMp4Faststart(fileBlob);
          addLog("[RunningHub] \u76F4\u8FDE MP4 faststart \u5904\u7406\u5B8C\u6210");
        } catch (faststartErr) {
          console.warn("[RunningHub] \u76F4\u8FDE MP4 faststart \u5904\u7406\u8DF3\u8FC7/\u5931\u8D25:", faststartErr);
        }
      }
      finalImageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(processedBlob);
      });
      if (outputUrl.match(/\.(mp4|webm|avi|mov)$/i) || fileBlob.type.includes("video/")) {
        isVideo = true;
        mediaFormat = "video/mp4";
      }
    }
    if (String(settings3.convertToJpegStorage) === "true" && !isVideo) {
      finalImageData = await convertImageToJpeg(finalImageData);
    }
    const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
    taskQueue.completeTask(taskId, true);
    const rhDetailParts = [];
    if (rhTaskCostTime != null) rhDetailParts.push(`RH\u6D88\u8017\u65F6\u95F4: ${rhTaskCostTime}\u79D2`);
    if (rhConsumeCoins != null) rhDetailParts.push(`\u6D88\u8017RH\u70B9\u6570: ${rhConsumeCoins}`);
    const rhDetailText = rhDetailParts.length > 0 ? ` (${rhDetailParts.join(", ")})` : "";
    if (!isPluginToastDisabled()) {
      toastr.success(`\u2705 ${taskTypeName}\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2${rhDetailText}`);
    }
    addLog(`[RunningHub] ${taskTypeName}\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2${rhDetailText}`);
    if (apiKey) {
      invalidateBalanceCache(apiKey);
      if (rhConsumeCoins != null) {
        recordKeyConsumption(apiKey, rhConsumeCoins);
      }
    }
    currentTaskId3 = null;
    return {
      image: finalImageData,
      change: change_ || "",
      isVideo,
      format: mediaFormat,
      originalUrl: outputUrl,
      genParams: _rh_gen_params,
      taskCostTime: rhTaskCostTime,
      consumeCoins: rhConsumeCoins
    };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    if (rawMessage !== "\u4EFB\u52A1\u5DF2\u53D6\u6D88") {
      taskQueue.completeTask(taskId, false);
      recordImageGeneration("runninghub", false);
      toastr.error(`RunningHub \u751F\u56FE\u5931\u8D25: ${rawMessage}`);
    }
    currentTaskId3 = null;
    addLog(`[RunningHub \u9519\u8BEF] ${rawMessage}`);
    console.error("[RunningHub \u9519\u8BEF]", err);
    throw err;
  } finally {
    if (eventSource && typeof eventSource.off === "function") {
      eventSource.off("st_chatu8_task_cancelled", onTaskCancelled);
    }
    if (keyLease && typeof keyLease.releaseKey === "function") {
      try {
        keyLease.releaseKey();
      } catch (e) {
        console.warn("[RunningHub] \u91CA\u653E Key \u5F02\u5E38:", e);
      }
      keyLease = null;
    }
  }
}

async function runninghubgenerate(requestData) {
  const { id, prompt: prompt2, width, height, change, negative_prompt: extraNegativePrompt } = requestData;
  addLog(`\u6536\u5230 RunningHub \u751F\u56FE\u8BF7\u6C42 (ID: ${id}) - Prompt: ${prompt2}${change ? ` - Change: ${change}` : ""}`);
  if (change && change.includes("{\u4FEE\u56FE}")) {
    bananaGenerate(requestData);
    return;
  }
  if (change && change.includes("{\u89C6\u9891}")) {
    bananaGenerate(requestData);
    return;
  }
  try {
    const { image: imageUrl, change: returnedChange, isVideo, format, originalUrl, genParams, taskCostTime, consumeCoins } = await generateRunningHubImage({
      prompt: prompt2,
      width,
      height,
      change,
      extraNegativePrompt
    });
    if (extension_settings[extensionName].cache != "0") {
      await setItemImg(prompt2, imageUrl, {
        change: returnedChange || "",
        isVideo: isVideo || false,
        format: format || (isVideo ? "mp4" : "png"),
        originalUrl: originalUrl || "",
        genParams,
        taskCostTime: taskCostTime || null,
        consumeCoins: consumeCoins || null,
        onTailSuccess: () => addLog(`[RunningHub] ${isVideo ? "\u89C6\u9891" : "\u56FE\u50CF"}\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
        onTailError: (e) => {
          const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
          addLog(`\u9519\u8BEF: ${msg}`);
          if (typeof toastr !== "undefined") toastr.error(msg);
        }
      });
    } else {
      addLog(`[RunningHub] \u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
    }
    recordImageGeneration("runninghub", true);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: true,
      imageData: imageUrl,
      isVideo: isVideo || false,
      format: format || "image",
      originalUrl: originalUrl || "",
      prompt: prompt2,
      change: returnedChange || "",
      taskCostTime: taskCostTime || null,
      consumeCoins: consumeCoins || null
    });
    addLog(`\u53D1\u9001 RunningHub ${isVideo ? "\u89C6\u9891" : "\u56FE\u7247"}\u751F\u6210\u6210\u529F\u54CD\u5E94 (ID: ${id})`);
  } catch (error) {
    recordImageGeneration("runninghub", false);
    const errorMsg = `RunningHub \u751F\u56FE\u6D41\u7A0B\u6355\u83B7\u5230\u5F02\u5E38 (ID: ${id}): ${error.message}`;
    addLog(`\u9519\u8BEF: ${errorMsg}`);
    console.error("Error generating image via RunningHub:", error);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: false,
      error: error.message,
      prompt: prompt2,
      change
    });
    addLog(`\u53D1\u9001 RunningHub \u751F\u56FE\u5931\u8D25\u54CD\u5E94 (ID: ${id})`);
  }
}

function initializeRunningHubListener() {
  eventSource.on(EventType.GENERATE_IMAGE_REQUEST, runninghubgenerate);
  addLog("RunningHub \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u521D\u59CB\u5316\u3002");
}

async function replaceWithRunningHub() {
  if (isPluginEnabled() && extension_settings[extensionName].mode === "runninghub") {
    if (!window.initializeRunningHubListener) {
      window.initializeRunningHubListener = true;
      initializeRunningHubListener();
    }
    initializeImageProcessing();
  } else {
    if (window.initializeRunningHubListener) {
      eventSource.removeListener(EventType.GENERATE_IMAGE_REQUEST, runninghubgenerate);
      window.initializeRunningHubListener = false;
      addLog("RunningHub \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u5173\u95ED\u3002");
    }
  }
}

export { extractNodeInfoListFromWorkflow, replaceWithRunningHub };
