// 还原自打包产物 — 原始模块: utils/sd.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { EventType, extensionName } from "./config.js";
import { acquireSerialLock, addLog, clearLog, convertImageToJpeg, deduplicateTags, deepMerge, fumian, getRandomYusheId, getRequestHeaders, getSDMode, getSortedCharacterIds, getsdAuth, isPluginEnabled, isPluginToastDisabled, parsePromptStringWithCoordinates, prompt_replace, prompt_replace_for_character, releaseSerialLock, setSDMode, stripChineseAnnotations, zhengmian } from "./utils.js";
import { TaskStatus, TaskType, taskQueue } from "./taskQueue.js";
import { processCharacterPrompt } from "./characterprompt.js";
import { setItemImg } from "./database.js";
import { buildGenParams } from "./genParams.js";
import { bananaGenerate } from "./banana.js";
import { recordImageGeneration } from "./imageGenStats.js";
import { initializeImageProcessing } from "./iframe/index.js";
import { generateComfyUIImage } from "./comfyui.js";
import { __set_currentTaskId4, currentTaskId4 } from "./novelai.js";
import "./iframe.js"; // init_iframe2

function isSettingTrue2(val) {
  return val === true || val === "true";
}

function getDirectHeaders2(contentType = null, auth = null) {
  const headers = {
    "Accept": "*/*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  if (auth) {
    headers["Authorization"] = auth;
  }
  return headers;
}

async function generateSDImage({ prompt: link, width: Xwidth, height: Xheight, change, extraNegativePrompt }) {
  clearLog();
  const taskId = taskQueue.addTask({
    name: (link || "").substring(0, 30) + (link && link.length > 30 ? "..." : ""),
    type: TaskType.SD,
    prompt: link
  });
  __set_currentTaskId4(taskId);
  let lockAcquired = false;
  await acquireSerialLock(taskId);
  lockAcquired = true;
  taskQueue.updateStatus(taskId, TaskStatus.RUNNING);
  const startTime = Date.now();
  if (!isPluginToastDisabled()) {
    toastr.info("\u{1F3A8} \u5DF2\u53D1\u8D77 SD \u751F\u56FE\u8BF7\u6C42...");
  }
  let change_ = change;
  if (change) {
    change_ = change;
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
  change = processCharacterPrompt(change);
  link = await stripChineseAnnotations(link);
  change = await stripChineseAnnotations(change);
  const url = extension_settings[extensionName].sdUrl.trim();
  const extension_settingss = extension_settings[extensionName];
  addLog(`\u6B63\u5728\u901A\u8FC7sdwebui\u751F\u6210\u56FE\u7247...\u5BA2\u6237\u7AEF\u4E3A${extension_settingss.client},\u6A21\u578B\u4E3A${extension_settingss.sd_cchatu_8_model}`);
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
        modifiedPrompt = modifiedPrompt + ", " + prompt_replace_for_character(prompt_data[`Character ${i} Prompt`], (mainPrompt || "") + " " + (other_prompt || ""));
      }
    }
  }
  const _sd_yushe_id = getRandomYusheId("yusheid_sd");
  if (!extension_settings[extensionName].yushe || !extension_settings[extensionName].yushe[_sd_yushe_id]) {
    toastr.error("\u672A\u80FD\u627E\u5230\u6240\u9009\u7684\u56FA\u5B9A\u63D0\u793A\u8BCD\u9884\u8BBE\u3002\u8BF7\u524D\u5F80\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u65B0\u5EFA\u6216\u9009\u62E9\u4E00\u4E2A\u56FA\u5B9A\u63D0\u793A\u8BCD\u3002", "SD \u751F\u56FE\u9519\u8BEF");
    taskQueue.completeTask(taskId, false);
    __set_currentTaskId4(null);
    throw new Error("\u56FA\u5B9A\u63D0\u793A\u8BCD\u9884\u8BBE\u672A\u914D\u7F6E");
  }
  const _sd_preset = extension_settings[extensionName].yushe[_sd_yushe_id];
  let prompt2 = await zhengmian(
    _sd_preset.fixedPrompt,
    modifiedPrompt,
    _sd_preset.fixedPrompt_end,
    extension_settings[extensionName].AQT_sd,
    insertions
  );
  let negative_prompt = await fumian(_sd_preset.negativePrompt, extension_settings[extensionName].UCP_sd);
  if (!Divide_roles && window.collectedCharacterNegatives) {
    const characterNegatives = window.collectedCharacterNegatives.trim();
    if (characterNegatives) {
      negative_prompt = negative_prompt ? `${negative_prompt}, ${characterNegatives}` : characterNegatives;
      addLog(`[\u89D2\u8272\u8D1F\u9762] \u6DFB\u52A0\u89D2\u8272\u8D1F\u9762\u63D0\u793A\u8BCD: ${characterNegatives}`);
      console.log("[SD] \u5408\u5E76\u89D2\u8272\u8D1F\u9762\u63D0\u793A\u8BCD:", characterNegatives);
    }
  }
  if (extraNegativePrompt && extraNegativePrompt.trim()) {
    const trimmedExtra = extraNegativePrompt.trim();
    negative_prompt = negative_prompt ? `${negative_prompt}, ${trimmedExtra}` : trimmedExtra;
    addLog(`[\u667A\u7ED8\u59EC] \u6DFB\u52A0\u989D\u5916\u8D1F\u9762\u63D0\u793A\u8BCD: ${trimmedExtra}`);
    console.log("[SD] \u5408\u5E76\u667A\u7ED8\u59EC\u989D\u5916\u8D1F\u9762\u63D0\u793A\u8BCD:", trimmedExtra);
  }
  addLog(`\u8D1F\u9762\u4E3A: ${negative_prompt}`);
  extension_settings["sd"]["auto_url"] = url;
  await saveSettingsDebounced();
  try {
    if (extension_settingss.client === "jiuguan") {
      const readmodel = await fetch("/api/sd/get-model", {
        method: "POST",
        body: JSON.stringify({
          auth: extension_settingss.st_chatu8_sd_auth ? extension_settingss.st_chatu8_sd_auth : "",
          url
        }),
        headers: getRequestHeaders(window.token)
      });
      if (!readmodel.ok) {
        addLog(`\u83B7\u53D6\u6A21\u578B\u5931\u8D25: ${readmodel.status} ${readmodel.statusText}`);
        throw new Error(`\u83B7\u53D6\u6A21\u578B\u5931\u8D25: ${readmodel.status} ${readmodel.statusText}`);
      }
      let cmodel = await readmodel.text();
      let cleanCmodel = cmodel.trim();
      if (cleanCmodel.startsWith('"') && cleanCmodel.endsWith('"')) {
        cleanCmodel = cleanCmodel.slice(1, -1);
      }
      console.log("cmodel22222222", cmodel);
      console.log("extension_settingss.sd_cchatu_8_model", extension_settingss.sd_cchatu_8_model);
      if (cleanCmodel != extension_settingss.sd_cchatu_8_model) {
        addLog(`\u6B63\u5728\u8BBE\u7F6E\u6A21\u578B\u4E3A${extension_settingss.sd_cchatu_8_model}...`);
        toastr.info(`\u6B63\u5728\u8BBE\u7F6E\u6A21\u578B...\u4E3A${extension_settingss.sd_cchatu_8_model}`);
        const response = await fetch("/api/sd/set-model", {
          method: "POST",
          body: JSON.stringify({
            auth: extension_settingss.st_chatu8_sd_auth ? extension_settingss.st_chatu8_sd_auth : "",
            url,
            model: extension_settingss.sd_cchatu_8_model
          }),
          headers: getRequestHeaders(window.token)
        });
        if (!response.ok) {
          addLog(`\u5207\u6362\u6A21\u578B\u5931\u8D25: ${response.status} ${response.statusText}`);
          throw new Error(`\u5207\u6362\u6A21\u578B\u5931\u8D25: ${response.status} ${response.statusText}`);
        }
        toastr.info(`\u8BBE\u7F6E\u6A21\u578B...\u4E3A${extension_settingss.sd_cchatu_8_model}\u6210\u529F`);
      }
    } else {
      let nowmode = await getSDMode(url);
      if (nowmode != extension_settingss.sd_cchatu_8_model) {
        addLog(`\u6B63\u5728\u5207\u6362\u6A21\u578B\u4E3A${extension_settingss.sd_cchatu_8_model}...`);
        await setSDMode(url, extension_settingss.sd_cchatu_8_model);
      }
    }
  } catch (error) {
    addLog(`\u83B7\u53D6\u6216\u8005\u5207\u6362\u6A21\u578B\u5931\u8D25: ${error.message}\u3002\u8BF7\u68C0\u67E5sdwebui\u662F\u5426\u6B63\u5E38\u542F\u52A8\uFF0C\u5E76\u68C0\u67E5\u6A21\u578B\u662F\u5426\u6B63\u786E\u3002`);
    taskQueue.completeTask(taskId, false);
    __set_currentTaskId4(null);
    throw new Error(`\u83B7\u53D6\u6216\u8005\u5207\u6362\u6A21\u578B\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5sdwebui\u662F\u5426\u6B63\u5E38\u542F\u52A8\uFF0C\u5E76\u68C0\u67E5\u6A21\u578B\u662F\u5426\u6B63\u786E\u3002`);
  }
  let seed = -1;
  const seedSetting = extension_settingss.sd_cseed;
  if (seedSetting !== "" && seedSetting !== null && !isNaN(Number(seedSetting)) && Number(seedSetting) >= 0) {
    seed = Number(seedSetting);
  }
  let payload = {
    prompt: prompt2,
    negative_prompt,
    sampler_name: extension_settingss.sd_cchatu_8_samplerName,
    scheduler: extension_settingss.sd_cchatu_8_scheduler,
    steps: extension_settingss.sd_csteps,
    cfg_scale: extension_settingss.sdCfgScale,
    width: Xwidth ? Xwidth : extension_settingss.sd_cwidth,
    height: Xheight ? Xheight : extension_settingss.sd_cheight,
    restore_faces: isSettingTrue2(extension_settingss.restoreFaces),
    enable_hr: isSettingTrue2(extension_settingss.sd_chires_fix),
    hr_upscaler: extension_settingss.sd_cchatu_8_upscaler,
    hr_scale: extension_settingss.sd_cupscale_factor,
    hr_additional_modules: [],
    denoising_strength: extension_settingss.sd_cdenoising_strength,
    hr_second_pass_steps: extension_settingss.sd_chires_steps,
    seed,
    override_settings: {
      CLIP_stop_at_last_layers: Number(extension_settingss.sd_cclip_skip),
      sd_vae: extension_settingss.sd_cchatu_8_vae
    },
    override_settings_restore_afterwards: true,
    save_images: true,
    send_images: true,
    do_not_save_grid: false,
    do_not_save_samples: false
  };
  addLog(`restore_faces \u8138\u90E8\u4FEE\u590D \u4E3A${payload.restore_faces}`);
  addLog(`enable_hr \u9AD8\u6E05\u4FEE\u590D \u4E3A${payload.enable_hr}`);
  if (isSettingTrue2(extension_settingss.sd_cadetailer)) {
    addLog("adetailer_face \u4E3A\u5F00\u542F");
    payload = deepMerge(payload, {
      alwayson_scripts: {
        ADetailer: {
          args: [
            true,
            true,
            {
              "ad_model": "face_yolov8n.pt"
            }
          ]
        }
      }
    });
  }
  const _sd_gen_params = buildGenParams("Stable Diffusion", {
    model: extension_settingss.sd_cchatu_8_model,
    yushe: _sd_yushe_id,
    yusheRandom: isSettingTrue2(extension_settings[extensionName].randomYushe),
    promptReplaceId: extension_settings[extensionName].prompt_replace_id,
    resolvedPrompt: prompt2,
    negativePrompt: negative_prompt,
    width: payload.width,
    height: payload.height,
    seed: payload.seed,
    steps: payload.steps,
    sampler: payload.sampler_name,
    scheduler: payload.scheduler,
    cfgScale: payload.cfg_scale
  });
  const report = `
---
### \u751F\u56FE\u53C2\u6570\u62A5\u544A
- **\u6B63\u9762\u63D0\u793A (Prompt):** ${prompt2}
- **\u8D1F\u9762\u63D0\u793A (Negative Prompt):** ${negative_prompt}
- **\u91C7\u6837\u65B9\u6CD5 (Sampler):** ${payload.sampler_name}
- **\u6B65\u6570 (Steps):** ${payload.steps}
- **CFG Scale:** ${payload.cfg_scale}
- **\u5C3A\u5BF8 (Size):** ${payload.width}x${payload.height}
- **\u79CD\u5B50 (Seed):** ${payload.seed === -1 ? "\u968F\u673A(-1)" : payload.seed}
- **\u6A21\u578B (Model):** ${extension_settingss.sd_cchatu_8_model}
- **VAE:** ${payload.override_settings.sd_vae}
- **Clip Skip:** ${payload.override_settings.CLIP_stop_at_last_layers}
- **\u9AD8\u6E05\u4FEE\u590D (Hires Fix):** ${payload.enable_hr}
- **\u653E\u5927\u500D\u7387 (Upscale Factor):** ${payload.hr_scale}
- **\u91CD\u7ED8\u5E45\u5EA6 (Denoising Strength):** ${payload.denoising_strength}
- **\u8138\u90E8\u4FEE\u590D (Restore Faces):** ${payload.restore_faces}
- **ADetailer:** ${isSettingTrue2(extension_settingss.sd_cadetailer)}
---
    `;
  addLog(report);
  addLog(`sdwebui\u751F\u56FE\u53C2\u6570\u4E3A${JSON.stringify(payload)}`);
  console.log("payload", payload);
  try {
    if (!taskQueue.isTaskInQueue(taskId)) {
      addLog("\u4EFB\u52A1\u5DF2\u88AB\u7528\u6237\u53D6\u6D88\u3002");
      throw new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    }
    if (extension_settingss.client === "jiuguan") {
      payload.url = url;
      console.log("payst_chatu8_sd_authload", extension_settingss.st_chatu8_sd_auth);
      payload.auth = extension_settingss.st_chatu8_sd_auth ? extension_settingss.st_chatu8_sd_auth : "";
      const result = await fetch("/api/sd/generate", {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify(payload)
      });
      if (!result.ok) {
        const errorText = await result.text();
        addLog(`\u9152\u9986 \u8FD4\u56DE\u9519\u8BEF\u3002\u72B6\u6001\u7801: ${result.status}\u3002\u54CD\u5E94\u5185\u5BB9: ${errorText}`);
        console.log("\u54CD\u5E94\u5185\u5BB9:", errorText);
        throw new Error(`\u8BF7\u6C42\u5931\u8D25,\u72B6\u6001\u7801: ${result.status}, \u8BE6\u60C5: ${errorText}`);
      }
      const data = await result.text();
      let base64Image = "";
      try {
        const jsonResponse = JSON.parse(data);
        base64Image = jsonResponse.images[0];
      } catch (e) {
        addLog("JSON \u89E3\u6790\u5931\u8D25\uFF0C\u5C1D\u8BD5\u4F5C\u4E3A\u539F\u59CB Base64 \u6570\u636E\u5904\u7406\u3002");
        base64Image = data;
      }
      let imageUrl = "data:image/png;base64," + base64Image;
      const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
      addLog(`\u56FE\u50CF\u5DF2\u6210\u529F\u83B7\u53D6\u5E76\u683C\u5F0F\u5316\u4E3A data URL (\u8017\u65F6 ${duration} \u79D2)\u3002`);
      taskQueue.completeTask(taskId, true);
      if (!isPluginToastDisabled()) {
        toastr.success(`\u2705 SD \u751F\u56FE\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
      }
      __set_currentTaskId4(null);
      if (String(extension_settings[extensionName].convertToJpegStorage) === "true") {
        imageUrl = await convertImageToJpeg(imageUrl);
      }
      return { image: imageUrl, change: change || "", genParams: _sd_gen_params };
    } else {
      const urlObj = new URL(url + "/sdapi/v1/txt2img");
      const response = await fetch(urlObj.href, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: getDirectHeaders2("application/json", getsdAuth())
      });
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`SD API \u8FD4\u56DE\u9519\u8BEF\u3002\u72B6\u6001\u7801: ${response.status}\u3002\u54CD\u5E94\u5185\u5BB9: ${errorText}`);
        console.log("\u54CD\u5E94\u5185\u5BB9:", errorText);
        throw new Error(`\u8BF7\u6C42\u5931\u8D25,\u72B6\u6001\u7801: ${response.status}, \u8BE6\u60C5: ${errorText}`);
      }
      const r = await response.json();
      if (!r.images || r.images.length === 0) {
        throw new Error("API\u54CD\u5E94\u4E2D\u672A\u627E\u5230\u56FE\u50CF\u6570\u636E\u3002");
      }
      const base64Image = r.images[0];
      let imageUrl = "data:image/png;base64," + base64Image;
      const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
      addLog(`\u56FE\u50CF\u5DF2\u6210\u529F\u83B7\u53D6\u5E76\u683C\u5F0F\u5316\u4E3A data URL (\u8017\u65F6 ${duration} \u79D2)\u3002`);
      taskQueue.completeTask(taskId, true);
      if (!isPluginToastDisabled()) {
        toastr.success(`\u2705 SD \u751F\u56FE\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
      }
      __set_currentTaskId4(null);
      if (String(extension_settings[extensionName].convertToJpegStorage) === "true") {
        imageUrl = await convertImageToJpeg(imageUrl);
      }
      return { image: imageUrl, change: change_ || "", genParams: _sd_gen_params };
    }
  } catch (error) {
    if (error.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88") {
    } else {
      taskQueue.completeTask(taskId, false);
    }
    __set_currentTaskId4(null);
    addLog(`sd\u8BF7\u6C42\u751F\u56FE\u9519\u8BEF: ${error.message}`);
    console.error("Error generating image:", error);
    throw error;
  } finally {
    if (lockAcquired) {
      const interval = Math.max(0, parseInt(extension_settings[extensionName]?.imageGenInterval, 10) || 0);
      releaseSerialLock(taskId, interval);
    }
  }
}

async function sdGenerate(requestData) {
  const { id, prompt: prompt2, width, height, change, negative_prompt: extraNegativePrompt } = requestData;
  addLog(`\u6536\u5230SD\u751F\u56FE\u8BF7\u6C42 (ID: ${id}) - Prompt: ${prompt2}${change ? ` - Change: ${change}` : ""}${extraNegativePrompt ? ` - NegativePrompt: ${extraNegativePrompt}` : ""}`);
  if (change && change.includes("{\u4FEE\u56FE}")) {
    bananaGenerate(requestData);
    return;
  }
  if (change && change.includes("{\u89C6\u9891}")) {
    bananaGenerate(requestData);
    return;
  }
  if (change && change.includes("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}")) {
    try {
      const { image: imageUrl, change: returnedChange, isVideo, format, genParams } = await generateComfyUIImage({ prompt: prompt2, width, height, change, extraNegativePrompt });
      const cleanedChange = returnedChange.replaceAll("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}", "");
      if (extension_settings[extensionName].cache != "0") {
        await setItemImg(prompt2, imageUrl, {
          change: cleanedChange,
          genParams,
          onTailSuccess: () => addLog(`\u56FE\u50CF\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
          onTailError: (e) => {
            const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
            addLog(`\u9519\u8BEF: ${msg}`);
            if (typeof toastr !== "undefined") toastr.error(msg);
          }
        });
      } else {
        addLog(`\u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
      }
      recordImageGeneration("sd", true);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
        id,
        success: true,
        imageData: imageUrl,
        prompt: prompt2,
        change: cleanedChange,
        isVideo: isVideo || false,
        format: format || "image"
      });
      addLog(`\u53D1\u9001ComfyUI\u5C40\u90E8\u91CD\u7ED8\u6210\u529F\u54CD\u5E94 (ID: ${id})`);
    } catch (error) {
      const errorMsg = `ComfyUI\u5C40\u90E8\u91CD\u7ED8\u6D41\u7A0B\u6355\u83B7\u5230\u5F02\u5E38 (ID: ${id}): ${error.message}`;
      addLog(`\u9519\u8BEF: ${errorMsg}`);
      console.error("Error generating ComfyUI inpaint image:", error);
      recordImageGeneration("sd", false);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
        id,
        success: false,
        error: error.message,
        prompt: prompt2
      });
      addLog(`\u53D1\u9001ComfyUI\u5C40\u90E8\u91CD\u7ED8\u5931\u8D25\u54CD\u5E94 (ID: ${id})`);
    }
    return;
  }
  try {
    const { image: imageUrl, change: returnedChange, genParams } = await generateSDImage({ prompt: prompt2, width, height, change, extraNegativePrompt });
    if (extension_settings[extensionName].cache != "0") {
      await setItemImg(prompt2, imageUrl, {
        change: returnedChange,
        genParams,
        onTailSuccess: () => addLog(`\u56FE\u50CF\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
        onTailError: (e) => {
          const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
          addLog(`\u9519\u8BEF: ${msg}`);
          if (typeof toastr !== "undefined") toastr.error(msg);
        }
      });
    } else {
      addLog(`\u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
    }
    recordImageGeneration("sd", true);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: true,
      imageData: imageUrl,
      prompt: prompt2,
      change: returnedChange
    });
    addLog(`\u53D1\u9001SD\u751F\u56FE\u6210\u529F\u54CD\u5E94 (ID: ${id})`);
  } catch (error) {
    const errorMsg = `SD\u751F\u56FE\u6D41\u7A0B\u6355\u83B7\u5230\u5F02\u5E38 (ID: ${id}): ${error.message}`;
    addLog(`\u9519\u8BEF: ${errorMsg}`);
    console.error("Error generating SD image:", error);
    recordImageGeneration("sd", false);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: false,
      error: error.message,
      prompt: prompt2
    });
    addLog(`\u53D1\u9001SD\u751F\u56FE\u5931\u8D25\u54CD\u5E94 (ID: ${id})`);
  }
}

function initializeSDListener() {
  eventSource.on(EventType.GENERATE_IMAGE_REQUEST, sdGenerate);
  addLog("SD \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u521D\u59CB\u5316\u3002");
}

async function replaceWithSd() {
  if (isPluginEnabled() && extension_settings[extensionName].mode == "sd") {
    if (!window.initializeSDListener) {
      window.initializeSDListener = true;
      initializeSDListener();
    }
    initializeImageProcessing();
  } else {
    if (window.initializeSDListener) {
      eventSource.removeListener(EventType.GENERATE_IMAGE_REQUEST, sdGenerate);
      window.initializeSDListener = false;
      addLog("SD \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u5173\u95ED\u3002");
    }
  }
}

export { replaceWithSd };
