// 还原自打包产物 — 原始模块: utils/comfyui.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource } from "../../../../../../script.js";
import { EventType, extensionName } from "./config.js";
import { acquireComfyUILock, addLog, cancelComfyUILock, clearLog, comfyuiConcurrencyLock, configDatabase_exports, convertImageToJpeg, deduplicateTags, fixMp4Faststart, fumian, generateRandomSeed, getRandomYusheId, getRequestHeaders, getSortedCharacterIds, isPluginEnabled, isPluginToastDisabled, parsePromptStringWithCoordinates, prompt_replace, prompt_replace_for_character, releaseComfyUILock, sleep, stripChineseAnnotations, zhengmian } from "./utils.js";
import { TaskStatus, TaskType, taskQueue } from "./taskQueue.js";
import { processCharacterPrompt } from "./characterprompt.js";
import { setItemImg } from "./database.js";
import { detectMultiGpu, fetchHistory, interruptAll } from "./comfyuiAdapter.js";
import { buildGenParams } from "./genParams.js";
import { processSkippedNodes } from "./settings/worker.js";
import { bananaGenerate } from "./banana.js";
import { recordImageGeneration } from "./imageGenStats.js";
import { initializeImageProcessing } from "./iframe/index.js";
import "./iframe.js"; // init_iframe2

var activeComfyuiTasks, handleComfyuiCancel;

activeComfyuiTasks = /* @__PURE__ */ new Map();

handleComfyuiCancel = async ({ taskId } = {}) => {
      const url = (extension_settings[extensionName]?.comfyuiUrl || "http://localhost:8188").trim();
      if (taskId) {
        const ctx = activeComfyuiTasks.get(taskId);
        if (ctx) {
          console.log("[ComfyUI] \u6536\u5230\u5355\u4E2A\u4EFB\u52A1\u53D6\u6D88\u4E8B\u4EF6:", taskId);
          ctx.abortController.abort();
          cancelComfyUILock(taskId);
          if (ctx.promptId && url) {
            fetch(`${url}/queue`, {
              method: "POST",
              headers: getComfyUIHeaders("application/json"),
              body: JSON.stringify({ delete: [ctx.promptId] })
            }).catch(() => {
            });
          }
          if (url) {
            try {
              await interruptAll(url);
            } catch (_) {
            }
          }
          activeComfyuiTasks.delete(taskId);
        } else {
          cancelComfyUILock(taskId);
        }
      } else {
        console.log("[ComfyUI] \u6536\u5230\u5168\u5C40\u53D6\u6D88\u4E8B\u4EF6\uFF0C\u6B63\u5728\u4E2D\u6B62\u6240\u6709\u6D3B\u52A8\u4EFB\u52A1");
        for (const [tId, ctx] of activeComfyuiTasks.entries()) {
          ctx.abortController.abort();
          cancelComfyUILock(tId);
          if (ctx.promptId && url) {
            fetch(`${url}/queue`, {
              method: "POST",
              headers: getComfyUIHeaders("application/json"),
              body: JSON.stringify({ delete: [ctx.promptId] })
            }).catch(() => {
            });
          }
        }
        if (url) {
          try {
            await interruptAll(url);
          } catch (_) {
          }
        }
        activeComfyuiTasks.clear();
      }
    };

function isSettingTrue(val) {
  return val === true || val === "true";
}

function getComfyUIHeaders(contentType = null) {
  const headers = {};
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

function stringifyJsonString(value) {
  return JSON.stringify(value == null ? "" : String(value));
}

function stringifyJsonNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? String(numericValue) : String(fallback);
}

function normalizeSettingString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeBackslashPath(value) {
  return normalizeSettingString(value).replace(/\\{2,}/g, "\\");
}

async function replacepro(payload, json4) {
  console.log("payload222", payload);
  json4 = json4.replaceAll('"%seed%"', stringifyJsonNumber(payload.seed));
  json4 = json4.replaceAll('"%steps%"', stringifyJsonNumber(payload.steps));
  json4 = json4.replaceAll('"%cfg_scale%"', stringifyJsonNumber(payload.cfg_scale));
  json4 = json4.replaceAll('"%sampler_name%"', stringifyJsonString(payload.sampler_name));
  json4 = json4.replaceAll('"%width%"', stringifyJsonNumber(payload.width));
  json4 = json4.replaceAll('"%height%"', stringifyJsonNumber(payload.height));
  json4 = json4.replaceAll('"%negative_prompt%"', stringifyJsonString(payload.negative_prompt));
  json4 = json4.replaceAll('"%prompt%"', stringifyJsonString(payload.prompt));
  json4 = json4.replaceAll('"%MODEL_NAME%"', stringifyJsonString(payload.MODEL_NAME));
  json4 = json4.replaceAll('"%c_quanzhong%"', stringifyJsonNumber(payload.c_quanzhong));
  json4 = json4.replaceAll('"%c_idquanzhong%"', stringifyJsonNumber(payload.c_idquanzhong));
  json4 = json4.replaceAll('"%c_xijie%"', stringifyJsonNumber(payload.c_xijie));
  json4 = json4.replaceAll('"%c_fenwei%"', stringifyJsonNumber(payload.c_fenwei));
  json4 = json4.replaceAll('"%comfyuicankaotupian%"', stringifyJsonString(payload.comfyuicankaotupian));
  json4 = json4.replaceAll('"%ipa%"', stringifyJsonString(payload.ipa));
  json4 = json4.replaceAll('"%scheduler%"', stringifyJsonString(payload.scheduler));
  json4 = json4.replaceAll('"%vae%"', stringifyJsonString(payload.vae));
  json4 = json4.replaceAll('"%clip%"', stringifyJsonString(payload.clip));
  console.log(json4);
  if (payload.inpaint_image) {
    json4 = json4.replaceAll('"%inpaint_image%"', stringifyJsonString(payload.inpaint_image));
  } else {
    json4 = json4.replaceAll('"%inpaint_image%"', stringifyJsonString(""));
  }
  if (payload.inpaint_mask) {
    json4 = json4.replaceAll('"%inpaint_mask%"', stringifyJsonString(payload.inpaint_mask));
  } else {
    json4 = json4.replaceAll('"%inpaint_mask%"', stringifyJsonString(""));
  }
  json4 = json4.replaceAll('"%inpaint_denoise%"', stringifyJsonNumber(payload.inpaint_denoise || 0.75, 0.75));
  if (payload.inpaint_positive) {
    json4 = json4.replaceAll('"%inpaint_positive%"', stringifyJsonString(payload.inpaint_positive));
  } else {
    json4 = json4.replaceAll('"%inpaint_positive%"', stringifyJsonString(""));
  }
  if (payload.inpaint_negative) {
    json4 = json4.replaceAll('"%inpaint_negative%"', stringifyJsonString(payload.inpaint_negative));
  } else {
    json4 = json4.replaceAll('"%inpaint_negative%"', stringifyJsonString(""));
  }
  JSON.parse(json4);
  return json4;
}

async function generateComfyUIImage({ prompt: link, width: Xwidth, height: Xheight, change, extraNegativePrompt }) {
  clearLog();
  let taskType = TaskType.COMFYUI_IMG;
  let taskTypeName = "ComfyUI \u666E\u901A\u751F\u56FE";
  let isVideoTask = false;
  if (change && (change.includes("{ComfyUI\u53C2\u8003\u751F\u89C6\u9891}") || change.includes("{\u53C2\u8003\u751F\u89C6\u9891}"))) {
    taskType = TaskType.COMFYUI_REF2VID;
    taskTypeName = "ComfyUI \u53C2\u8003\u751F\u89C6\u9891";
    isVideoTask = true;
  } else if (change && (change.includes("{ComfyUI\u56FE\u751F\u89C6\u9891}") || change.includes("{\u56FE\u751F\u89C6\u9891}") || change.includes("{ComfyUI\u89C6\u9891}"))) {
    taskType = TaskType.COMFYUI_IMG2VID;
    taskTypeName = "ComfyUI \u56FE\u751F\u89C6\u9891";
    isVideoTask = true;
  }
  const taskId = taskQueue.addTask({
    name: (link || "").substring(0, 30) + (link && link.length > 30 ? "..." : ""),
    type: taskType,
    prompt: link
  });
  const abortController = new AbortController();
  const configuredUrl = (extension_settings[extensionName]?.comfyuiUrl || "http://localhost:8188").trim();
  activeComfyuiTasks.set(taskId, {
    abortController,
    url: configuredUrl,
    promptId: null,
    startTime: Date.now()
  });
  const maxConcurrency = Math.max(1, Math.min(10, parseInt(extension_settings[extensionName]?.comfyui_max_concurrency, 10) || 10));
  comfyuiConcurrencyLock.setMaxConcurrency(maxConcurrency);
  let lockAcquired = false;
  await acquireComfyUILock(taskId, abortController.signal);
  lockAcquired = true;
  taskQueue.updateStatus(taskId, TaskStatus.RUNNING);
  const startTime = Date.now();
  if (!isPluginToastDisabled()) {
    toastr.info(`\u{1F3A8} \u5DF2\u53D1\u8D77 ${taskTypeName} \u8BF7\u6C42...`);
  }
  link = typeof link === "string" ? link : "";
  change = typeof change === "string" ? change : "";
  console.log("link", link);
  let change_ = "";
  if (change) {
    change_ = change.replaceAll("{ComfyUI\u53C2\u8003\u751F\u89C6\u9891}", "").replaceAll("{\u53C2\u8003\u751F\u89C6\u9891}", "").replaceAll("{ComfyUI\u56FE\u751F\u89C6\u9891}", "").replaceAll("{\u56FE\u751F\u89C6\u9891}", "").replaceAll("{ComfyUI\u89C6\u9891}", "").replaceAll("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}", "").replaceAll("{\u5C40\u90E8\u91CD\u7ED8}", "");
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
  if (typeof change === "string") {
    const match = change.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        Xwidth = parseInt(match[1], 10);
        Xheight = parseInt(match[2], 10);
      }
    }
    change = change.replace(sizeRegex, "");
  }
  link = processCharacterPrompt(link);
  link = await stripChineseAnnotations(link);
  change = processCharacterPrompt(change);
  change = await stripChineseAnnotations(change);
  addLog(`\u5F00\u59CB ComfyUI \u751F\u56FE\u6D41\u7A0B\u3002\u5BA2\u6237\u7AEF\u4E3A${extension_settings[extensionName].client}`);
  addLog(`\u8BF7\u6C42\u5DE5\u4F5C\u6D41id - ${extension_settings[extensionName].workerid}`);
  addLog(`\u8BF7\u6C42\u5C3A\u5BF8: \u5BBD\u5EA6 - ${Xwidth || "\u9ED8\u8BA4"}, \u9AD8\u5EA6 - ${Xheight || "\u9ED8\u8BA4"}`);
  if (extension_settings[extensionName].MODEL_NAME.trim() === "\u8FDE\u63A5\u540E\u9009\u62E9") {
    addLog("\u8BF7\u586B\u5199ComfyUI\u6A21\u578B\u3002");
    toastr.error("\u8BF7\u586B\u5199ComfyUI\u6A21\u578B\u3002");
    taskQueue.completeTask(taskId, false);
    activeComfyuiTasks.delete(taskId);
    return;
  }
  const url = extension_settings[extensionName].comfyuiUrl.trim();
  const promptForGeneration = change && change.trim() !== "" ? change : link;
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
  const _comfyui_yushe_id = getRandomYusheId("yusheid_comfyui");
  if (!extension_settings[extensionName].yushe || !extension_settings[extensionName].yushe[_comfyui_yushe_id]) {
    toastr.error("\u672A\u80FD\u627E\u5230\u6240\u9009\u7684\u56FA\u5B9A\u63D0\u793A\u8BCD\u9884\u8BBE\u3002\u8BF7\u524D\u5F80\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u65B0\u5EFA\u6216\u9009\u62E9\u4E00\u4E2A\u56FA\u5B9A\u63D0\u793A\u8BCD\u3002", "ComfyUI \u751F\u56FE\u9519\u8BEF");
    taskQueue.completeTask(taskId, false);
    activeComfyuiTasks.delete(taskId);
    throw new Error("\u56FA\u5B9A\u63D0\u793A\u8BCD\u9884\u8BBE\u672A\u914D\u7F6E");
  }
  const _comfyui_preset = extension_settings[extensionName].yushe[_comfyui_yushe_id];
  let prompt2 = await zhengmian(
    _comfyui_preset.fixedPrompt,
    modifiedPrompt,
    _comfyui_preset.fixedPrompt_end,
    extension_settings[extensionName].AQT_comfyui,
    insertions
  );
  prompt2 = replaceLoraTags(prompt2);
  function replaceLoraTags(input, addClipSkip = false) {
    const regex = /<lora:([^:>]+):([^>]+)>/g;
    return input.replace(regex, (match, filename, paramStr) => {
      if (!addClipSkip) {
        return `<lora:${filename}:${paramStr}>`;
      }
      const params = paramStr.split(":");
      if (isSettingTrue(extension_settings[extensionName].weilin_lora_fix)) {
        const p1 = params[0] || "1";
        const p2 = params[1] || "1";
        const p3 = params[2] || "1";
        console.log("\u5F00\u542F\u7684");
        return `<lora:${filename}:${p1}:${p2}:${p3}>`;
      } else {
        const p1 = params[0] || "1";
        const p2 = params[1] || "1";
        return `<lora:${filename}:${p1}:${p2}>`;
      }
    });
  }
  if (extension_settings[extensionName].worker.includes("WeiLin") && !extension_settings[extensionName].worker.includes("WeiLinPromptUI")) {
    prompt2 = replaceLoraTags(prompt2, true);
    prompt2 = prompt2.replace(/<lora:([^:>]+)(\.safetensors)?:([^>]+)>/g, (match, filename, ext, weight) => {
      if (!prompt2.includes(".safetensors")) {
        return `<lora:${filename}.safetensors:${weight}> `;
      }
      return match;
    });
  }
  if (extension_settings[extensionName].worker.includes("WeiLinPromptUI")) {
    prompt2 = replaceLoraTags(prompt2, true);
    prompt2 = prompt2.replaceAll("<lora:", "<wlr:");
    prompt2 = prompt2.replaceAll(".safetensors", "");
  }
  console.log("prompt", prompt2);
  addLog(`\u6B63\u9762\u63D0\u793A\u8BCD: ${prompt2} `);
  let negative_prompt = await fumian(_comfyui_preset.negativePrompt, extension_settings[extensionName].UCP_comfyui);
  if (!Divide_roles && window.collectedCharacterNegatives) {
    const characterNegatives = window.collectedCharacterNegatives.trim();
    if (characterNegatives) {
      negative_prompt = negative_prompt ? `${negative_prompt}, ${characterNegatives} ` : characterNegatives;
      addLog(`[\u89D2\u8272\u8D1F\u9762] \u6DFB\u52A0\u89D2\u8272\u8D1F\u9762\u63D0\u793A\u8BCD: ${characterNegatives} `);
      console.log("[ComfyUI] \u5408\u5E76\u89D2\u8272\u8D1F\u9762\u63D0\u793A\u8BCD:", characterNegatives);
    }
  }
  if (extraNegativePrompt && extraNegativePrompt.trim()) {
    const trimmedExtra = extraNegativePrompt.trim();
    negative_prompt = negative_prompt ? `${negative_prompt}, ${trimmedExtra} ` : trimmedExtra;
    addLog(`[\u667A\u7ED8\u59EC] \u6DFB\u52A0\u989D\u5916\u8D1F\u9762\u63D0\u793A\u8BCD: ${trimmedExtra} `);
    console.log("[ComfyUI] \u5408\u5E76\u667A\u7ED8\u59EC\u989D\u5916\u8D1F\u9762\u63D0\u793A\u8BCD:", trimmedExtra);
  }
  if (extension_settings[extensionName].worker.includes("WeiLinPromptUI")) {
    negative_prompt = replaceLoraTags(negative_prompt, true);
    negative_prompt = negative_prompt.replaceAll("<lora:", "<wlr:");
  } else {
    negative_prompt = replaceLoraTags(negative_prompt);
  }
  addLog(`\u8D1F\u9762\u63D0\u793A\u8BCD: ${negative_prompt} `);
  prompt2 = prompt2.replaceAll("\n", ",").replace(/,{2,}/g, ",");
  negative_prompt = negative_prompt.replaceAll("\n", ",").replace(/,{2,}/g, ",");
  const normalizedModelName = normalizeBackslashPath(extension_settings[extensionName].MODEL_NAME);
  let payload = {
    "prompt": prompt2,
    "negative_prompt": negative_prompt,
    "steps": extension_settings[extensionName].comfyui_steps,
    "sampler_name": extension_settings[extensionName].comfyuisamplerName,
    "width": Xwidth ? Xwidth : extension_settings[extensionName].comfyui_width,
    "height": Xheight ? Xheight : extension_settings[extensionName].comfyui_height,
    "cfg_scale": extension_settings[extensionName].cfg_comfyui,
    "seed": extension_settings[extensionName].comfyui_seed === 0 || extension_settings[extensionName].comfyui_seed === "0" || extension_settings[extensionName].comfyui_seed === "" || extension_settings[extensionName].comfyui_seed === -1 || extension_settings[extensionName].comfyui_seed === "-1" ? generateRandomSeed() : extension_settings[extensionName].comfyui_seed,
    "MODEL_NAME": normalizedModelName,
    "c_quanzhong": extension_settings[extensionName].c_quanzhong,
    "c_idquanzhong": extension_settings[extensionName].c_idquanzhong,
    "c_xijie": extension_settings[extensionName].c_xijie,
    "c_fenwei": extension_settings[extensionName].c_fenwei,
    "comfyuicankaotupian": window.comfyuicankaotupian,
    "ipa": extension_settings[extensionName].ipa,
    "scheduler": normalizeSettingString(extension_settings[extensionName].comfyui_scheduler),
    "vae": normalizeSettingString(extension_settings[extensionName].comfyui_vae),
    "clip": normalizeSettingString(extension_settings[extensionName].comfyuiCLIPName),
    // 局部重绘参数（如果有）
    "inpaint_image": window.comfyuiInpaintImage || null,
    "inpaint_mask": window.comfyuiInpaintMask || null,
    "inpaint_denoise": extension_settings[extensionName].inpaint_denoise || "0.75",
    "inpaint_positive": window.comfyuiInpaintPositivePrompt || "",
    "inpaint_negative": window.comfyuiInpaintNegativePrompt || ""
  };
  if (!payload.MODEL_NAME) {
    throw new Error("ComfyUI \u6A21\u578B\u540D\u4E3A\u7A7A\u6216\u53EA\u5305\u542B\u7A7A\u767D\u5B57\u7B26\u3002");
  }
  const report = `
-- - \u751F\u56FE\u53C2\u6570\u62A5\u544A-- -
\u6B63\u9762\u63D0\u793A\u8BCD: ${payload.prompt} 
\u8D1F\u9762\u63D0\u793A\u8BCD: ${payload.negative_prompt} 
\u6A21\u578B: ${payload.MODEL_NAME} 
\u91C7\u6837\u5668: ${payload.sampler_name} 
\u6B65\u6570: ${payload.steps} 
CFG Scale: ${payload.cfg_scale} 
\u79CD\u5B50: ${payload.seed} 
\u5C3A\u5BF8: ${payload.width}x${payload.height} 
VAE: ${payload.vae} 
Scheduler: ${payload.scheduler} 
--------------------
`;
  addLog(report);
  const _comfy_gen_params = buildGenParams("ComfyUI", {
    model: payload.MODEL_NAME,
    yushe: _comfyui_yushe_id,
    yusheRandom: isSettingTrue(extension_settings[extensionName].randomYushe),
    promptReplaceId: extension_settings[extensionName].prompt_replace_id,
    resolvedPrompt: payload.prompt,
    negativePrompt: payload.negative_prompt,
    width: payload.width,
    height: payload.height,
    seed: payload.seed,
    steps: payload.steps,
    sampler: payload.sampler_name,
    scheduler: payload.scheduler,
    cfgScale: payload.cfg_scale
  });
  const clientId = "533ef3a3-39c0-4e39-9ced-37d290f371f8";
  let workflowToUse = extension_settings[extensionName].worker;
  if (change.includes("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}") || change.includes("{\u5C40\u90E8\u91CD\u7ED8}")) {
    workflowToUse = extension_settings[extensionName].editWorker;
  }
  try {
    const workflowObj = JSON.parse(workflowToUse);
    const skippedCount = Object.values(workflowObj).filter((n) => n && n._skip).length;
    if (skippedCount > 0) {
      addLog(`\u68C0\u6D4B\u5230 ${skippedCount} \u4E2A\u8DF3\u8FC7\u7684\u8282\u70B9\uFF0C\u6B63\u5728\u5904\u7406\u8FDE\u63A5\u91CD\u6620\u5C04...`);
      const { getComfyuiCache: getComfyuiCache2 } = await import("./configDatabase.js");
      const objectInfo = await getComfyuiCache2("objectinfo") || {};
      const processedWorkflow = processSkippedNodes(workflowObj, objectInfo);
      workflowToUse = JSON.stringify(processedWorkflow);
      addLog(`\u8DF3\u8FC7\u8282\u70B9\u5904\u7406\u5B8C\u6210\uFF0C\u5DF2\u91CD\u6620\u5C04\u8FDE\u63A5${Object.keys(objectInfo).length > 0 ? "\uFF08\u542B\u7C7B\u578B\u5339\u914D\uFF09" : ""}`);
    } else {
      workflowToUse = JSON.stringify(workflowObj);
    }
  } catch (e) {
    throw new Error(`ComfyUI \u5DE5\u4F5C\u6D41 JSON \u65E0\u6548: ${e.message}`);
  }
  payload = await replacepro(payload, workflowToUse);
  payload = JSON.stringify({ client_id: clientId, prompt: JSON.parse(payload) });
  addLog(`\u53D1\u9001\u5230 ComfyUI \u7684\u6700\u7EC8 payload: ${payload} `);
  try {
    if (!taskQueue.isTaskInQueue(taskId)) {
      addLog("\u6B63\u5F0F\u8BF7\u6C42\u524D\u68C0\u6D4B\u5230\u4EFB\u52A1\u5DF2\u88AB\u53D6\u6D88\u3002");
      throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    let imageUrl;
    if (extension_settings[extensionName].client === "jiuguan") {
      const response = await fetch("/api/sd/comfy/generate", {
        method: "POST",
        body: JSON.stringify({
          url,
          prompt: payload
        }),
        headers: getRequestHeaders(window.token),
        signal: abortController.signal
      });
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`API \u8BF7\u6C42\u5931\u8D25(jiuguan client): ${errorText} `);
        taskQueue.completeTask(taskId, false);
        throw new Error(`\u8BF7\u6C42\u5931\u8D25, \u72B6\u6001\u7801: ${response.status}, \u8BE6\u60C5: ${errorText} `);
      }
      const responseText = await response.text();
      let format, data;
      try {
        const jsonResponse = JSON.parse(responseText);
        format = jsonResponse.format;
        data = jsonResponse.data;
      } catch (e) {
        addLog("JSON \u89E3\u6790\u5931\u8D25\uFF0C\u5C1D\u8BD5\u4F5C\u4E3A\u539F\u59CB Base64 \u6570\u636E\u5904\u7406\u3002");
        format = "png";
        data = responseText;
      }
      if (!data) {
        addLog("API \u54CD\u5E94\u4E2D\u6CA1\u6709\u56FE\u7247\u6570\u636E (jiuguan client)\u3002");
        taskQueue.completeTask(taskId, false);
        throw new Error("Endpoint did not return image data.");
      }
      const videoFormats = ["mp4", "webm", "gif", "avi", "mov"];
      const isVideo = videoFormats.some((fmt) => format && format.toLowerCase().includes(fmt));
      const mediaType = isVideo ? "\u89C6\u9891" : "\u56FE\u7247";
      addLog(`${mediaType} \u751F\u6210\u6210\u529F(jiuguan client)\u3002`);
      const mimePrefix = isVideo ? "video" : "image";
      let mimeType = format;
      if (isVideo) {
        if (format.includes("mp4") || format.includes("h264")) {
          mimeType = "mp4";
        } else if (format.includes("webm")) {
          mimeType = "webm";
        } else if (format.includes("gif")) {
          mimeType = "gif";
        }
      }
      imageUrl = `data:${mimePrefix}/${mimeType};base64,${data}`;
      const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
      taskQueue.completeTask(taskId, true);
      if (!isPluginToastDisabled()) {
        toastr.success(`\u2705 ComfyUI \u666E\u901A\u751F\u56FE\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
      }
      addLog(`ComfyUI \u666E\u901A\u751F\u56FE\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
      console.log("format", format, "isVideo", isVideo);
      if (String(extension_settings[extensionName].convertToJpegStorage) === "true" && !isVideo) {
        imageUrl = await convertImageToJpeg(imageUrl);
      }
      let finalFormat = format;
      if (isVideo) {
        finalFormat = `video/${mimeType}`;
      }
      return { image: imageUrl, change: change_ || "", isVideo, format: finalFormat, genParams: _comfy_gen_params };
    } else {
      const urlObj = new URL(url + "/prompt");
      const response = await fetch(urlObj.href, {
        method: "POST",
        body: payload,
        headers: getComfyUIHeaders("application/json"),
        signal: abortController.signal
      });
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`API \u8BF7\u6C42\u5931\u8D25 (direct comfyui): ${errorText}`);
        throw new Error(`\u8BF7\u6C42\u5931\u8D25,\u72B6\u6001\u7801: ${response.status}, \u8BE6\u60C5: ${errorText}`);
      }
      const r = await response.json();
      let id = r.prompt_id;
      const taskCtx = activeComfyuiTasks.get(taskId);
      if (taskCtx) {
        taskCtx.promptId = id;
      }
      detectMultiGpu(url);
      let ii = 0;
      let mediaInfo = null;
      const timeoutMs = (parseInt(extension_settings[extensionName]?.comfyui_timeout, 10) || 1800) * 1e3;
      while (true) {
        try {
          if (!taskQueue.isTaskInQueue(taskId) || abortController.signal.aborted) {
            addLog("\u4EFB\u52A1\u5DF2\u88AB\u7528\u6237\u53D6\u6D88\uFF0C\u6B63\u5728\u4E2D\u65AD ComfyUI...");
            try {
              if (id) {
                fetch(`${url}/queue`, {
                  method: "POST",
                  headers: getComfyUIHeaders("application/json"),
                  body: JSON.stringify({ delete: [id] })
                }).catch(() => {
                });
              }
              await interruptAll(url, { headers: getComfyUIHeaders() });
            } catch (e) {
              console.warn("[ComfyUI] \u4E2D\u65AD\u8BF7\u6C42\u5931\u8D25:", e);
            }
            throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
          }
          const response2 = await fetchHistory(url, id, { headers: getComfyUIHeaders(), signal: abortController.signal });
          if (!response2.ok) {
            addLog(`\u8F6E\u8BE2\u5386\u53F2\u8BB0\u5F55\u65F6\u51FA\u9519: ${response2.status}`);
            throw new Error(`History request failed: ${response2.status}`);
          }
          let re = await response2.json();
          console.log("response2", re);
          if (re.hasOwnProperty(id)) {
            const historyData = re[id];
            if (historyData.status && historyData.status.status_str === "error") {
              const errorInfo = historyData.status;
              addLog(`\u274C ComfyUI \u6267\u884C\u5931\u8D25 - \u72B6\u6001: ${errorInfo.status_str}`);
              if (errorInfo.messages && errorInfo.messages.length > 0) {
                errorInfo.messages.forEach((msg, idx) => {
                  addLog(`\u6D88\u606F ${idx + 1}: ${JSON.stringify(msg)}`);
                });
              }
              let errorMessage = "ComfyUI \u6267\u884C\u9519\u8BEF";
              if (errorInfo.exception_message) {
                errorMessage = errorInfo.exception_message;
                addLog(`\u5F02\u5E38\u4FE1\u606F: ${errorInfo.exception_message}`);
              }
              if (errorInfo.exception_type) {
                addLog(`\u5F02\u5E38\u7C7B\u578B: ${errorInfo.exception_type}`);
              }
              throw new Error(errorMessage);
            }
          }
          if (re.hasOwnProperty(id)) {
            let getImageInfoFromOutputs = function(outputs) {
              if (!outputs || typeof outputs !== "object") return null;
              const isVideoExt = (fn) => typeof fn === "string" && /\.(mp4|webm|mkv|mov|avi)$/i.test(fn);
              for (const key in outputs) {
                const value = outputs[key];
                if (!value) continue;
                if (Array.isArray(value.gifs) && value.gifs.length > 0) {
                  const gif = value.gifs[0];
                  const isVideo2 = gif.format && gif.format.startsWith("video/") || isVideoExt(gif.filename);
                  return {
                    filename: gif.filename,
                    subfolder: gif.subfolder || "",
                    isVideo: Boolean(isVideo2),
                    format: gif.format || (isVideo2 ? "video/mp4" : "image/gif")
                  };
                }
                if (Array.isArray(value.images) && value.images.length > 0) {
                  const videoImg = value.images.find((img) => img.type === "output" && isVideoExt(img.filename));
                  if (videoImg) {
                    return {
                      filename: videoImg.filename,
                      subfolder: videoImg.subfolder || "",
                      isVideo: true,
                      format: videoImg.filename.endsWith(".webm") ? "video/webm" : "video/mp4"
                    };
                  }
                }
              }
              for (const key in outputs) {
                const value = outputs[key];
                if (!value) continue;
                if (Array.isArray(value.images) && value.images.length > 0) {
                  const outputImage = value.images.find((img) => img.type === "output") || value.images[0];
                  if (outputImage) {
                    return {
                      filename: outputImage.filename,
                      subfolder: outputImage.subfolder || "",
                      isVideo: false,
                      format: "image"
                    };
                  }
                }
              }
              return null;
            };
            let imageInfo = getImageInfoFromOutputs(re[id]["outputs"]);
            if (!imageInfo) {
              throw new Error("\u672A\u80FD\u4ECEAPI\u54CD\u5E94\u4E2D\u627E\u5230\u6587\u4EF6\u540D\u3002");
            }
            mediaInfo = imageInfo;
            window._lastMediaInfo = imageInfo;
            const mediaType = imageInfo.isVideo ? "\u89C6\u9891" : "\u56FE\u7247";
            addLog(`${mediaType}\u751F\u6210\u6210\u529F (direct comfyui)\u3002`);
            let fileurl = `${url}/view?filename=${imageInfo.filename}&subfolder=${encodeURIComponent(imageInfo.subfolder)}&type=output`;
            const imageResponse = await fetch(fileurl, { headers: getComfyUIHeaders(), signal: abortController.signal });
            if (!imageResponse.ok) {
              throw new Error(`\u83B7\u53D6\u56FE\u7247\u5931\u8D25,\u72B6\u6001\u7801: ${imageResponse.status}`);
            }
            let blob = await imageResponse.blob();
            if (imageInfo.isVideo) {
              let correctedMimeType = "video/mp4";
              if (imageInfo.format) {
                if (imageInfo.format.includes("webm") || imageInfo.filename && imageInfo.filename.toLowerCase().endsWith(".webm")) {
                  correctedMimeType = "video/webm";
                } else if (imageInfo.format.includes("mp4") || imageInfo.format.includes("h264") || imageInfo.filename && imageInfo.filename.toLowerCase().endsWith(".mp4")) {
                  correctedMimeType = "video/mp4";
                }
              } else if (imageInfo.filename && imageInfo.filename.toLowerCase().endsWith(".webm")) {
                correctedMimeType = "video/webm";
              }
              const arrayBuffer = await blob.arrayBuffer();
              blob = new Blob([arrayBuffer], { type: correctedMimeType });
              console.log(`[ComfyUI] \u89C6\u9891 MIME \u7C7B\u578B\u4FEE\u6B63: ${imageInfo.format} -> ${correctedMimeType}`);
              if (correctedMimeType === "video/mp4") {
                try {
                  blob = await fixMp4Faststart(blob);
                  console.log("[ComfyUI] MP4 faststart \u5904\u7406\u5B8C\u6210");
                } catch (err) {
                  console.warn("[ComfyUI] faststart \u5904\u7406\u8DF3\u8FC7/\u5931\u8D25:", err);
                }
              }
              mediaInfo.format = correctedMimeType;
              window._lastMediaInfo.format = correctedMimeType;
            }
            imageUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            if (String(extension_settings[extensionName].convertToJpegStorage) === "true") {
              if (!imageInfo.isVideo) {
                imageUrl = await convertImageToJpeg(imageUrl);
              }
            }
            break;
          }
          await sleep(1e3);
          ii++;
          const elapsed = Date.now() - startTime;
          if (elapsed > timeoutMs || ii > Math.ceil(timeoutMs / 1e3)) {
            const minutes = Math.round(timeoutMs / 6e4);
            addLog(`ComfyUI \u8F6E\u8BE2\u8D85\u65F6\uFF08\u5DF2\u7B49\u5F85 ${(elapsed / 1e3).toFixed(0)} \u79D2 / ${minutes} \u5206\u949F\uFF09\uFF0C\u670D\u52A1\u5668\u53EF\u80FD\u4ECD\u5728\u6392\u961F\u6216\u5DF2\u65AD\u5F00\u8FDE\u63A5\u3002`);
            throw new Error(`ComfyUI \u670D\u52A1\u5668\u8D85\u65F6\uFF08\u5DF2\u8D85\u8FC7 ${minutes} \u5206\u949F\uFF09\u3002`);
          }
        } catch (error) {
          addLog(`\u8F6E\u8BE2\u65F6\u53D1\u751F\u5F02\u5E38: ${error}`);
          throw error;
        }
      }
      if (!imageUrl) {
        throw new Error("\u672A\u80FD\u751F\u6210\u56FE\u7247 URL\u3002");
      }
      const isVideo = mediaInfo?.isVideo ?? (window._lastMediaInfo?.isVideo || false);
      const mediaFormat = mediaInfo?.format || window._lastMediaInfo?.format || "image";
      const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
      addLog(`\u5A92\u4F53 (${isVideo ? "\u89C6\u9891" : "\u56FE\u7247"}) \u5DF2\u6210\u529F\u83B7\u53D6\u5E76\u683C\u5F0F\u5316\u4E3A data URL (\u8017\u65F6 ${duration} \u79D2)\u3002`);
      taskQueue.completeTask(taskId, true);
      if (!isPluginToastDisabled()) {
        toastr.success(`\u2705 ${taskTypeName}\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
      }
      return { image: imageUrl, change: change_ || "", isVideo, format: mediaFormat, genParams: _comfy_gen_params };
    }
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const isAborted = rawMessage === "\u4EFB\u52A1\u5DF2\u53D6\u6D88" || abortController.signal.aborted || !taskQueue.isTaskInQueue(taskId);
    const propagatedMessage = rawMessage === "Failed to fetch" || rawMessage === "Load failed" ? `ComfyUI \u8BF7\u6C42\u5931\u8D25\uFF0C\u53EF\u80FD\u662F\u670D\u52A1\u4E0D\u53EF\u8FBE\u3001\u8DE8\u57DF\u3001\u4EE3\u7406\u5F02\u5E38\u6216\u8FD4\u56DE\u4E86\u65E0\u6548\u54CD\u5E94: ${rawMessage}` : rawMessage;
    if (isAborted) {
      toastr.info(`\u5DF2\u53D6\u6D88 ${taskTypeName}`);
    } else {
      taskQueue.completeTask(taskId, false);
      toastr.error(`${taskTypeName}\u5931\u8D25: ${propagatedMessage}`);
    }
    addLog(`[ComfyUI \u9519\u8BEF] ${propagatedMessage}`);
    console.error("Error generating media in ComfyUI:", error);
    throw new Error(propagatedMessage);
  } finally {
    activeComfyuiTasks.delete(taskId);
    if (lockAcquired) {
      releaseComfyUILock(taskId);
    }
  }
}

async function comfyuigenerate(requestData) {
  let { id, prompt: prompt2, width, height, change, negative_prompt: extraNegativePrompt } = requestData;
  addLog(`\u6536\u5230\u751F\u56FE\u8BF7\u6C42 (ID: ${id}) - Prompt: ${prompt2}${change ? ` - Change: ${change}` : ""}${extraNegativePrompt ? ` - NegativePrompt: ${extraNegativePrompt}` : ""}`);
  if (change && change.includes("{\u4FEE\u56FE}")) {
    bananaGenerate(requestData);
    return;
  }
  if (change && change.includes("{\u89C6\u9891}")) {
    bananaGenerate(requestData);
    return;
  }
  try {
    const { image: imageUrl, change: returnedChange, isVideo, format, genParams } = await generateComfyUIImage({ prompt: prompt2, width, height, change, extraNegativePrompt });
    if (extension_settings[extensionName].cache != "0") {
      await setItemImg(prompt2, imageUrl, {
        change: returnedChange,
        isVideo,
        format,
        genParams,
        onTailSuccess: () => addLog(`${isVideo ? "\u89C6\u9891" : "\u56FE\u50CF"}\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
        onTailError: (e) => {
          const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
          addLog(`\u9519\u8BEF: ${msg}`);
          if (typeof toastr !== "undefined") toastr.error(msg);
        }
      });
    } else {
      addLog(`\u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
    }
    recordImageGeneration("comfyui", true);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: true,
      imageData: imageUrl,
      prompt: prompt2,
      // pass back the original prompt
      change: returnedChange,
      isVideo: isVideo || false,
      format: format || "image"
    });
    addLog(`\u53D1\u9001${isVideo ? "\u89C6\u9891" : "\u56FE\u7247"}\u751F\u6210\u6210\u529F\u54CD\u5E94 (ID: ${id})`);
  } catch (error) {
    const errorMsg = `\u751F\u56FE\u6D41\u7A0B\u6355\u83B7\u5230\u5F02\u5E38 (ID: ${id}): ${error.message}`;
    addLog(`\u9519\u8BEF: ${errorMsg}`);
    console.error("Error generating image:", error);
    recordImageGeneration("comfyui", false);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: false,
      error: error.message,
      prompt: prompt2
    });
    addLog(`\u53D1\u9001\u751F\u56FE\u5931\u8D25\u54CD\u5E94 (ID: ${id})`);
  }
}

function initializeComfyuiListener() {
  eventSource.on(EventType.GENERATE_IMAGE_REQUEST, comfyuigenerate);
  eventSource.on("st_chatu8_cancel_task", handleComfyuiCancel);
  eventSource.on("st_chatu8_cancel_comfyui_task", handleComfyuiCancel);
  addLog("comfyui \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u521D\u59CB\u5316\uFF08\u542B\u65E7\u7248\u517C\u5BB9\uFF09\u3002");
}

async function replaceWithcomfyui() {
  if (isPluginEnabled() && extension_settings[extensionName].mode == "comfyui") {
    if (!window.initializeComfyuiListener) {
      window.initializeComfyuiListener = true;
      initializeComfyuiListener();
    }
    initializeImageProcessing();
  } else {
    if (window.initializeComfyuiListener) {
      eventSource.removeListener(EventType.GENERATE_IMAGE_REQUEST, comfyuigenerate);
      window.initializeComfyuiListener = false;
      addLog("comfyui \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u5173\u95ED\u3002");
    }
  }
}

export { generateComfyUIImage, replaceWithcomfyui };
