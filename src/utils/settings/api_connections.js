// 还原自打包产物 — 原始模块: utils/settings/api_connections.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { addLog, getRequestHeaders, getsdAuth, removeTrailingSlash } from "../utils.js";
import { saveFullComfyuiCache, saveFullSdCache } from "../configDatabase.js";
import { isValidUrl } from "../ui_common.js";
import { resetKeepAliveState } from "../comfyuiKeepAlive.js";

var COMFYUI_REF_CACHE_KEY, KEEP_ALIVE_INTERVAL, NAI_CHAR_REF_CACHE_KEY, NAI_VIBE_CACHE_KEY, PING_TIMEOUT, comfyuiImageObjectURL, consecutiveErrors, keepAliveSuspended, keepAliveTimer, nai3CharRefImageMimeType, nai3VibeTransferImageMimeType;

var NAI_VIBE_CACHE_KEY = "cache_novelai_vibe_transfer_image";

var NAI_CHAR_REF_CACHE_KEY = "cache_novelai_char_ref_image";

var COMFYUI_REF_CACHE_KEY = "cache_comfyui_ref_image";

var nai3VibeTransferImageMimeType = "image/png";

var nai3CharRefImageMimeType = "image/png";

var comfyuiImageObjectURL = null;
var keepAliveTimer = null;

var KEEP_ALIVE_INTERVAL = 3e4;

var PING_TIMEOUT = 5e3;

var consecutiveErrors = 0;

var keepAliveSuspended = false;
async function testComfyui() {
  const settings3 = extension_settings[extensionName];
  let el = document.getElementById("comfyuiUrl");
  let testurl1 = removeTrailingSlash(el.value);
  let testurl = testurl1 + "/object_info";
  try {
    if (settings3.client === "jiuguan") {
      const response = await fetch("/api/sd/comfy/models", {
        method: "POST",
        body: JSON.stringify({ url: testurl1 }),
        headers: getRequestHeaders(window.token)
      });
      if (!response.ok) {
        const errorText = await response.text();
        alert("\u8FD4\u56DE\u9519\u8BEF\u53EF\u80FD\u662F\u4F60\u8F93\u5165\u7F51\u5740\u6709\u8BEF" + errorText);
        addLog(`"\u6D4B\u8BD5\u94FE\u63A5\u5931\u8D25\u7F51\u5740:${testurl1} \u9519\u8BEF\u8BE6\u60C5:"${JSON.stringify(errorText)},\u8BF7\u6C42\u5931\u8D25,\u72B6\u6001\u7801: ${response.status}`);
        throw new Error(`\u8BF7\u6C42\u5931\u8D25,\u72B6\u6001\u7801: ${response.status}`);
      }
      const response2 = await fetch("/api/sd/comfy/samplers", { method: "POST", body: JSON.stringify({ url: testurl1 }), headers: getRequestHeaders(window.token) });
      const response3 = await fetch("/api/sd/comfy/vaes", { method: "POST", body: JSON.stringify({ url: testurl1 }), headers: getRequestHeaders(window.token) });
      const response4 = await fetch("/api/sd/comfy/schedulers", { method: "POST", body: JSON.stringify({ url: testurl1 }), headers: getRequestHeaders(window.token) });
      if (!response2.ok || !response3.ok || !response4.ok) throw new Error("One or more API calls failed");
      alert("\u8FDE\u63A5\u6210\u529F");
      const model = await response.json();
      const samplers = await response2.json();
      const vaes = await response3.json();
      const schedulers = await response4.json();
      const cacheData = {
        models: model,
        samplers,
        vaes,
        schedulers,
        loras: []
      };
      await saveFullComfyuiCache(cacheData);
      window.dispatchEvent(new CustomEvent("comfyui-cache-updated", { detail: cacheData }));
    } else {
      const response = await fetch(testurl);
      if (response.ok) {
        alert("\u8FDE\u63A5\u6210\u529F");
        const responseData = await response.json();
        const loralist = responseData["LoraLoader"]["input"]["required"]["lora_name"][0];
        const ckpts = responseData.CheckpointLoaderSimple.input.required.ckpt_name[0].map((it) => ({ value: it, text: it })) || [];
        const unets = responseData.UNETLoader.input.required.unet_name[0].map((it) => ({ value: it, text: `UNet: ${it}` })) || [];
        const ggufs = responseData.UnetLoaderGGUF?.input.required.unet_name[0].map((it) => ({ value: it, text: `GGUF: ${it}` })) || [];
        const ModelList = [...ckpts, ...unets, ...ggufs];
        const samplerList = responseData["KSampler"]["input"]["required"]["sampler_name"][0];
        const schedulerList = responseData["KSampler"]["input"]["required"]["scheduler"][0];
        const vaeList = responseData["VAELoader"]["input"]["required"]["vae_name"][0];
        const CLIPLoaderList = responseData["CLIPLoader"]["input"]["required"]["clip_name"][0];
        const CLIPLoaderGGUFList = responseData["CLIPLoaderGGUF"]?.input?.required?.clip_name?.[0]?.map((it) => `GGUF: ${it}`) || [];
        const AllCLIPs = [...CLIPLoaderList, ...CLIPLoaderGGUFList];
        const cacheData = {
          loras: loralist,
          models: ModelList,
          samplers: samplerList,
          schedulers: schedulerList,
          vaes: vaeList,
          CLIPs: AllCLIPs,
          objectInfo: responseData
          // 缓存完整的节点类型定义
        };
        await saveFullComfyuiCache(cacheData);
        window.dispatchEvent(new CustomEvent("comfyui-cache-updated", { detail: cacheData }));
      } else {
        alert("\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5730\u5740\u662F\u5426\u6B63\u786E");
      }
    }
    window.loadSilterTavernChatu8Settings();
    resetKeepAliveState();
  } catch (error) {
    alert("\u8BF7\u6C42\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u5730\u5740\u662F\u5426\u6B63\u786E\u6216\u7F51\u7EDC\u8FDE\u63A5");
    addLog(`"cpmfyui\u6D4B\u8BD5\u94FE\u63A5\u5931\u8D25\u7F51\u5740:${testurl} ,\u8BF7\u6C42\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u5730\u5740\u662F\u5426\u6B63\u786E\u6216\u7F51\u7EDC\u8FDE\u63A5"`);
    console.error("\u8FDE\u63A5\u6D4B\u8BD5\u5931\u8D25:", error);
  }
}

async function testSd() {
  const settings3 = extension_settings[extensionName];
  const el = document.getElementById("sdUrl");
  const baseUrl = removeTrailingSlash(el.value);
  if (!isValidUrl(baseUrl)) {
    alert("\u8BF7\u8F93\u5165\u6709\u6548\u7684 Stable Diffusion API \u5730\u5740\u3002");
    return;
  }
  if (settings3.client == "jiuguan") {
    const endpoints = {
      samplers: "/api/sd/samplers",
      models: "/api/sd/models",
      vaes: "/api/sd/vaes",
      schedulers: "/api/sd/schedulers",
      upscalers: "/api/sd/upscalers"
    };
    try {
      const responses = await Promise.all(Object.values(endpoints).map((endpoint) => fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ url: baseUrl, auth: settings3.st_chatu8_sd_auth || "" }),
        headers: getRequestHeaders(window.token)
      })));
      for (const response of responses) {
        if (!response.ok) throw new Error(`API \u8BF7\u6C42\u5931\u8D25: ${response.status} ${response.statusText} for ${response.url}`);
      }
      const [samplers, models, vaes, schedulers, upscalers] = await Promise.all(responses.map((res) => res.json()));
      const cacheData = {
        samplers,
        models: models.map((x) => x.value),
        vaes,
        schedulers,
        upscalers,
        loras: []
      };
      await saveFullSdCache(cacheData);
      window.dispatchEvent(new CustomEvent("sd-cache-updated", { detail: cacheData }));
      alert("\u8FDE\u63A5\u6210\u529F");
      addLog(`sd\u6D4B\u8BD5\u94FE\u63A5\u6210\u529F\u7F51\u5740:${baseUrl}`);
    } catch (error) {
      alert("sd\u6D4B\u8BD5\u94FE\u63A5\u5931\u8D25\u8BF7\u68C0\u67E5\u7F51\u5740\u6216\u8005\u7F51\u7EDC\u8FDE\u63A5" + error);
      addLog(`sd\u6D4B\u8BD5\u94FE\u63A5\u5931\u8D25\u7F51\u5740:${baseUrl} \u9519\u8BEF\u8BE6\u60C5:"${JSON.stringify(error)}`);
    }
  } else {
    const endpoints = {
      samplers: "/sdapi/v1/samplers",
      models: "/sdapi/v1/sd-models",
      vaes: "/sdapi/v1/sd-vae",
      schedulers: "/sdapi/v1/schedulers",
      upscalers: "/sdapi/v1/upscalers",
      latentUpscalers: "/sdapi/v1/latent-upscale-modes",
      loras: "/sdapi/v1/loras"
    };
    try {
      const results = await Promise.allSettled(Object.values(endpoints).map((endpoint) => fetch(baseUrl + endpoint, { headers: { "Authorization": getsdAuth() } })));
      const fulfilledResponses = results.map((result) => result.status === "fulfilled" && result.value.ok ? result.value : null);
      if (fulfilledResponses.every((r) => r === null)) {
        const firstError = results.find((r) => r.status === "rejected")?.reason?.message || results.find((r) => r.status === "fulfilled" && !r.value.ok)?.value?.statusText || "\u672A\u77E5\u9519\u8BEF";
        throw new Error(`\u6240\u6709API\u8BF7\u6C42\u5747\u5931\u8D25. \u7B2C\u4E00\u4E2A\u9519\u8BEF: ${firstError}`);
      }
      const dataPromises = fulfilledResponses.map((response) => response ? response.json() : Promise.resolve(null));
      const [samplers, models, vaes, schedulers, upscalers, latentUpscalers, loras] = await Promise.all(dataPromises);
      let upscalers2 = upscalers ? upscalers.map((x) => x.name) : [];
      let latentUpscalers2 = latentUpscalers ? latentUpscalers.map((x) => x.name) : [];
      upscalers2.splice(1, 0, ...latentUpscalers2);
      const cacheData = {
        samplers: samplers ? samplers.map((x) => x.name) : [],
        models: models ? models.map((x) => x.title) : [],
        vaes: vaes ? vaes.map((x) => x.model_name) : [],
        schedulers: schedulers ? schedulers.map((x) => x.name) : [],
        upscalers: upscalers2,
        loras: loras ? loras.map((x) => x.name) : []
      };
      await saveFullSdCache(cacheData);
      window.dispatchEvent(new CustomEvent("sd-cache-updated", { detail: cacheData }));
      alert("\u8FDE\u63A5\u6210\u529F");
    } catch (error) {
      alert("SD\u8FDE\u63A5\u6D4B\u8BD5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5API\u5730\u5740\u548C\u7F51\u7EDC\u8FDE\u63A5\u3002\n\u9519\u8BEF: " + error.message);
      addLog(`"\u6D4B\u8BD5SD\u94FE\u63A5\u5931\u8D25\u7F51\u5740:${baseUrl} \u9519\u8BEF\u8BE6\u60C5:"${JSON.stringify(error)}`);
    }
  }
  window.loadSilterTavernChatu8Settings();
}

function initApiConnectionTests(settingsModal) {
  settingsModal.find("#testSd").on("click", testSd);
  settingsModal.find("#testComfyui").on("click", testComfyui);
  const comfyUrlInput = settingsModal.find("#comfyuiUrl");
  if (comfyUrlInput.length) {
    comfyUrlInput.on("change", function() {
      resetKeepAliveState();
    });
  }
}

export function __set_nai3VibeTransferImageMimeType(v) { nai3VibeTransferImageMimeType = v; }

export function __set_nai3CharRefImageMimeType(v) { nai3CharRefImageMimeType = v; }

export function __set_comfyuiImageObjectURL(v) { comfyuiImageObjectURL = v; }

export function __set_consecutiveErrors(v) { consecutiveErrors = v; }

export function __set_keepAliveSuspended(v) { keepAliveSuspended = v; }

export function __set_keepAliveTimer(v) { keepAliveTimer = v; }

export { COMFYUI_REF_CACHE_KEY, KEEP_ALIVE_INTERVAL, NAI_CHAR_REF_CACHE_KEY, NAI_VIBE_CACHE_KEY, PING_TIMEOUT, comfyuiImageObjectURL, consecutiveErrors, initApiConnectionTests, keepAliveSuspended, keepAliveTimer, nai3CharRefImageMimeType, nai3VibeTransferImageMimeType };
