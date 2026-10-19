// 还原自打包产物 — 原始模块: index.js
import { event_types, saveSettingsDebounced } from "../../../../script.js";
import { extensionTypes, extension_settings } from "../../../extensions.js";
import { migrateToolAndTailConfigIfOldDefault } from "./src/utils/settings/defaultToolCallConfig.js";
import { defaultSettings, extensionFolderPath, extensionName } from "./src/utils/config.js";
import { checkSendBuClass } from "./src/utils/utils.js";
import { ensureInjectionTemplatesInit } from "./src/utils/settings/character/injectionTemplates.js";
import { initializeNewlineFixer } from "./src/utils/newline_fix.js";
import { replaceWithBanana } from "./src/utils/banana.js";
import { initImageGenStatsListener } from "./src/utils/imageGenStats.js";
import { replaceWithcomfyui } from "./src/utils/comfyui.js";
import { replaceWithRunningHub } from "./src/utils/runninghub.js";
import { initializeTTS } from "./src/utils/tts.js";
import { installGlobalErrorHandler } from "./src/utils/errorCollector.js";
import { initializeASR } from "./src/utils/asr.js";
import { replaceWithnovelai } from "./src/utils/novelai.js";
import { replaceWithSd } from "./src/utils/sd.js";
import { initUI } from "./src/utils/ui.js";

var FAB_ICON_ACCEPTED_TYPES, FAB_ICON_MAX_DIMENSION, FAB_ICON_MAX_FILE_SIZE, FAB_ICON_QUALITY, MODE_NAV_TABS, REINSTALL_GIT_URL, VIDEO_NAV_TABS, cryptoLoadPromise, currentPreviewTheme2, fabIconPreviewToken, genEndedEvent, genStartedEvent, genStoppedEvent, generationTabs3, jszipLoadPromise, msgpackLoadPromise, settings2, tabIds, token;

var currentPreviewTheme2 = {};

var generationTabs3 = ["sd", "novelai", "comfyui", "runninghub"];

var MODE_NAV_TABS = ["sd", "novelai", "comfyui", "runninghub", "banana"];

var VIDEO_NAV_TABS = ["runninghub_video", "comfyui_video", "video_assets", "video_asset_gen"];

var tabIds = ["main", "sd", "novelai", "comfyui", "comfyui_video", "runninghub", "runninghub_video", "video_assets", "video_asset_gen", "banana", "llm", "vocabulary", "knowledgeBase", "character", "theme", "fab", "image-cache", "regex", "send_data", "about", "log"];

var FAB_ICON_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

var FAB_ICON_MAX_FILE_SIZE = 5 * 1024 * 1024;

var FAB_ICON_MAX_DIMENSION = 512;

var FAB_ICON_QUALITY = 0.9;

var fabIconPreviewToken = 0;
var genStartedEvent = event_types.GENERATION_STARTED || "generation_started";

var genStoppedEvent = event_types.GENERATION_STOPPED || "generation_stopped";

var genEndedEvent = event_types.GENERATION_ENDED || "generation_ended";
try {
  const tokenResponse = await fetch("/csrf-token");
  const data = await tokenResponse.json();
  token = data.token;
  window.token = token;
} catch (err) {
  console.error("Initialization failed", err);
  throw new Error("Initialization failed");
}

function getModuleEnvironmentInfo() {
  return {
    hasDefine: typeof globalThis.define === "function",
    hasDefineAmd: Boolean(globalThis.define?.amd),
    defineType: typeof globalThis.define,
    hasRequire: typeof globalThis.require === "function",
    requireType: typeof globalThis.require,
    hasModule: typeof globalThis.module !== "undefined",
    moduleType: typeof globalThis.module,
    hasExports: typeof globalThis.exports !== "undefined",
    exportsType: typeof globalThis.exports
  };
}

async function loadJSZipIsolated(scriptSrc) {
  return loadIsolatedUmdLibrary(scriptSrc, "JSZip");
}

async function loadIsolatedUmdLibrary(scriptSrc, globalName) {
  const absoluteScriptSrc = new URL(scriptSrc, window.location.href).href;
  const response = await fetch(absoluteScriptSrc, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`[st-chatu8] Failed to fetch ${globalName} source: ${response.status} ${response.statusText}`);
  }
  const source = await response.text();
  const isolatedGlobal = {};
  isolatedGlobal.window = isolatedGlobal;
  isolatedGlobal.global = isolatedGlobal;
  isolatedGlobal.self = isolatedGlobal;
  isolatedGlobal.globalThis = isolatedGlobal;
  const isolatedLoader = new Function(
    "window",
    "global",
    "self",
    "globalThis",
    "define",
    "module",
    "exports",
    `${source}
return this[${JSON.stringify(globalName)}] || window[${JSON.stringify(globalName)}] || globalThis[${JSON.stringify(globalName)}] || self[${JSON.stringify(globalName)}] || global[${JSON.stringify(globalName)}];`
  );
  const library = isolatedLoader.call(
    isolatedGlobal,
    isolatedGlobal,
    isolatedGlobal,
    isolatedGlobal,
    isolatedGlobal,
    void 0,
    void 0,
    void 0
  );
  if (typeof library === "undefined") {
    throw new Error(`[st-chatu8] Isolated ${globalName} evaluation completed but no library was returned`);
  }
  return library;
}

function loadJSZip() {
  if (typeof window.stChatu8JSZip === "function") {
    return Promise.resolve(window.stChatu8JSZip);
  }
  if (jszipLoadPromise) {
    return jszipLoadPromise;
  }
  const scriptSrc = `${extensionFolderPath}/jszip.min.js`;
  jszipLoadPromise = loadJSZipIsolated(scriptSrc).then((jszipConstructor) => {
    window.stChatu8JSZip = jszipConstructor;
    if (typeof window.JSZip !== "function") {
      window.JSZip = jszipConstructor;
    }
    return jszipConstructor;
  }).catch((error) => {
    console.error("[st-chatu8] JSZip isolated load failed", {
      error,
      scriptSrc,
      environment: getModuleEnvironmentInfo()
    });
    jszipLoadPromise = void 0;
    throw error;
  });
  return jszipLoadPromise;
}

function loadcrypto() {
  if (typeof window.stChatu8CryptoJS !== "undefined") {
    return Promise.resolve(window.stChatu8CryptoJS);
  }
  if (typeof window.CryptoJS !== "undefined") {
    window.stChatu8CryptoJS = window.CryptoJS;
    return Promise.resolve(window.stChatu8CryptoJS);
  }
  if (cryptoLoadPromise) {
    return cryptoLoadPromise;
  }
  const scriptSrc = `${extensionFolderPath}/crypto-js.min.js`;
  cryptoLoadPromise = loadIsolatedUmdLibrary(scriptSrc, "CryptoJS").then((cryptoJs) => {
    window.stChatu8CryptoJS = cryptoJs;
    if (typeof window.CryptoJS === "undefined") {
      window.CryptoJS = cryptoJs;
    }
    return cryptoJs;
  }).catch((error) => {
    console.error("[st-chatu8] CryptoJS isolated load failed", {
      error,
      scriptSrc,
      environment: getModuleEnvironmentInfo()
    });
    cryptoLoadPromise = void 0;
    throw error;
  });
  return cryptoLoadPromise;
}

function loadmsgpack() {
  if (typeof window.stChatu8MessagePack !== "undefined") {
    return Promise.resolve(window.stChatu8MessagePack);
  }
  if (typeof window.MessagePack !== "undefined") {
    window.stChatu8MessagePack = window.MessagePack;
    return Promise.resolve(window.stChatu8MessagePack);
  }
  if (msgpackLoadPromise) {
    return msgpackLoadPromise;
  }
  const scriptSrc = `${extensionFolderPath}/msgpack.min.js`;
  msgpackLoadPromise = loadIsolatedUmdLibrary(scriptSrc, "MessagePack").then((messagePack) => {
    window.stChatu8MessagePack = messagePack;
    if (typeof window.MessagePack === "undefined") {
      window.MessagePack = messagePack;
    }
    return messagePack;
  }).catch((error) => {
    console.error("[st-chatu8] MessagePack isolated load failed", {
      error,
      scriptSrc,
      environment: getModuleEnvironmentInfo()
    });
    msgpackLoadPromise = void 0;
    throw error;
  });
  return msgpackLoadPromise;
}

window.loadmsgpack = loadmsgpack;

function getRequestHeaders2(token2) {
  return {
    "X-CSRF-Token": token2,
    "Content-Type": "application/json"
  };
}

function getExtensionType(externalId) {
  const id = Object.keys(extensionTypes).find(
    (id2) => id2 === externalId || id2.startsWith("third-party") && id2.endsWith(externalId)
  );
  return id ? extensionTypes[id] : "local";
}

async function update_extension(extensionname, global) {
  let freshToken = window.token || token;
  try {
    const tokenResponse = await fetch("/csrf-token");
    if (tokenResponse.ok) {
      const data = await tokenResponse.json();
      if (data && data.token) {
        freshToken = data.token;
        window.token = freshToken;
      }
    }
  } catch (e) {
  }
  const response = await fetch("/api/extensions/update", {
    method: "POST",
    headers: getRequestHeaders2(freshToken),
    body: JSON.stringify({ extensionName: extensionname, global })
  });
  return response;
}

function compareVersion(a, b) {
  if (!a || !b) return 0;
  const pa = String(a).replace(/^v\.?/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v\.?/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function setUpdateStatus(text, cls) {
  const el = document.getElementById("ch-update-status");
  if (el) {
    el.textContent = text;
    el.className = `st-chatu8-update-status ${cls || ""}`.trim();
  }
}

var REINSTALL_GIT_URL = "https://github.com/damoshen123/st-chatu8.git";

function showReinstallGuide(reason) {
  const existing = document.getElementById("st-chatu8-reinstall-guide");
  if (existing) existing.remove();
  const overlay2 = document.createElement("div");
  overlay2.id = "st-chatu8-reinstall-guide";
  overlay2.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:100000",
    "background:rgba(0,0,0,0.6)",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "font-family:inherit"
  ].join(";");
  const safeReason = reason ? String(reason).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]) : "";
  overlay2.innerHTML = `
        <div style="background:var(--SmartThemeBlurTintColor, #1f2128); color:var(--SmartThemeBodyColor, #eee);
                    border:1px solid var(--SmartThemeBorderColor, #444); border-radius:10px;
                    width:min(560px, 92vw); max-height:85vh; overflow:auto;
                    box-shadow:0 10px 40px rgba(0,0,0,0.5); padding:18px 20px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <h3 style="margin:0; font-size:18px;">\u26A0\uFE0F \u81EA\u52A8\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u91CD\u88C5</h3>
                <button id="st-chatu8-reinstall-close" title="\u5173\u95ED"
                        style="background:transparent; border:none; color:inherit; font-size:20px; cursor:pointer; line-height:1;">\xD7</button>
            </div>
            ${safeReason ? `<div style="opacity:.85; font-size:13px; margin-bottom:10px;">\u539F\u56E0\uFF1A${safeReason}</div>` : ""}
            <div style="font-size:14px; line-height:1.7;">
                <p style="margin:6px 0;">\u8BF7\u6309\u4EE5\u4E0B\u6B65\u9AA4\u624B\u52A8\u91CD\u65B0\u5B89\u88C5\u672C\u63D2\u4EF6\uFF08<b>\u4E0D\u4F1A\u4E22\u5931\u4F60\u7684\u8BBE\u7F6E</b>\uFF09\uFF1A</p>
                <ol style="padding-left:22px; margin:8px 0;">
                    <li>\u70B9\u51FB\u9152\u9986<b>\u53F3\u4E0A\u89D2\u7684\u5C0F\u7BB1\u5B50\u56FE\u6807</b>\uFF08\u6269\u5C55 / Extensions\uFF09\u3002</li>
                    <li>\u70B9\u51FB\u91CC\u9762\u7684\u300C<b>\u7BA1\u7406\u63D2\u4EF6</b>\u300D\uFF08Manage extensions\uFF09\u3002</li>
                    <li>\u627E\u5230 <code>st-chatu8</code>\uFF0C\u70B9\u51FB\u5176\u53F3\u4FA7\u7684<b>\u5220\u9664</b>\u6309\u94AE\u5378\u8F7D\u3002</li>
                    <li>\u56DE\u5230\u6269\u5C55\u9762\u677F\uFF0C\u70B9\u51FB\u300C<b>\u5B89\u88C5\u6269\u5C55</b>\u300D\uFF08Install extension\uFF09\uFF0C\u7C98\u8D34\u4E0B\u9762\u7684\u5B89\u88C5\u5730\u5740\u5E76\u786E\u8BA4\u5B89\u88C5\uFF1A</li>
                </ol>
                <p style="margin:8px 0; padding:8px 10px; border-radius:6px;
                          background:rgba(255, 193, 7, 0.12); border:1px solid rgba(255, 193, 7, 0.45);
                          font-size:13px;">
                    \u23F3 <b>\u5B89\u88C5\u8FC7\u7A0B\u9700\u8981\u7B49\u5F85</b>\uFF0C\u5B8C\u6210\u540E\u4F1A<b>\u81EA\u52A8\u5237\u65B0\u9875\u9762</b>\u3002<br>
                    \u8BF7<b>\u4E0D\u8981\u624B\u52A8\u5237\u65B0\u9875\u9762</b>\uFF0C\u5426\u5219\u4F1A\u5BFC\u81F4\u5B89\u88C5\u5931\u8D25\u3002
                </p>
                <div style="display:flex; gap:8px; align-items:stretch; margin:10px 0;">
                    <input id="st-chatu8-reinstall-url" type="text" readonly
                           value="${REINSTALL_GIT_URL}"
                           style="flex:1; padding:8px 10px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor, #555);
                                  background:rgba(255,255,255,0.06); color:inherit; font-family:monospace; font-size:13px;" />
                    <button id="st-chatu8-reinstall-copy"
                            style="padding:8px 14px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor, #555);
                                   background:var(--SmartThemeQuoteColor, #4a90e2); color:#fff; cursor:pointer; white-space:nowrap;">
                        \u{1F4CB} \u590D\u5236\u5730\u5740
                    </button>
                </div>
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:14px;">
                <button id="st-chatu8-reinstall-ok"
                        style="padding:8px 18px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor, #555);
                               background:transparent; color:inherit; cursor:pointer;">\u6211\u77E5\u9053\u4E86</button>
            </div>
        </div>
    `;
  document.body.appendChild(overlay2);
  const close = () => overlay2.remove();
  overlay2.querySelector("#st-chatu8-reinstall-close").addEventListener("click", close);
  overlay2.querySelector("#st-chatu8-reinstall-ok").addEventListener("click", close);
  const copyBtn = overlay2.querySelector("#st-chatu8-reinstall-copy");
  const urlInput = overlay2.querySelector("#st-chatu8-reinstall-url");
  copyBtn.addEventListener("click", async () => {
    const text = REINSTALL_GIT_URL;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (_) {
    }
    if (!ok) {
      try {
        const isIOS2 = /iP(hone|ad|od)/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
        const prevContentEditable = urlInput.contentEditable;
        const prevReadOnly = urlInput.readOnly;
        urlInput.removeAttribute("readonly");
        if (isIOS2) {
          urlInput.contentEditable = "true";
          urlInput.readOnly = false;
          const range = document.createRange();
          range.selectNodeContents(urlInput);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          urlInput.setSelectionRange(0, text.length);
        } else {
          urlInput.focus();
          urlInput.select();
          urlInput.setSelectionRange(0, text.length);
        }
        ok = document.execCommand("copy");
        urlInput.contentEditable = prevContentEditable;
        urlInput.readOnly = prevReadOnly;
        urlInput.setAttribute("readonly", "readonly");
        window.getSelection()?.removeAllRanges();
      } catch (_) {
        ok = false;
      }
    }
    if (!ok) {
      try {
        urlInput.focus();
        urlInput.setSelectionRange(0, text.length);
      } catch (_) {
      }
    }
    copyBtn.textContent = ok ? "\u2705 \u5DF2\u590D\u5236" : "\u274C \u590D\u5236\u5931\u8D25";
    if (ok && typeof toastr !== "undefined") {
      try {
        toastr.success("\u5B89\u88C5\u5730\u5740\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
      } catch (_) {
      }
    }
    setTimeout(() => {
      copyBtn.textContent = "\u{1F4CB} \u590D\u5236\u5730\u5740";
    }, 2e3);
  });
}

async function check_update() {
  const type = getExtensionType(extensionName);
  const global = type === "global";
  const reload = () => {
    toastr.success(`\u6210\u529F\u66F4\u65B0\u63D2\u4EF6\uFF0C4 \u79D2\u540E\u81EA\u52A8\u5237\u65B0\u9875\u9762`);
    console.log(`\u6210\u529F\u66F4\u65B0\u63D2\u4EF6`);
    setUpdateStatus("\u2705 \u66F4\u65B0\u6210\u529F\uFF0C\u6B63\u5728\u5237\u65B0\u9875\u9762...", "uptodate");
    setTimeout(() => location.reload(), 4e3);
  };
  let update_response;
  try {
    update_response = await update_extension(extensionName, global);
  } catch (err) {
    console.error("\u8C03\u7528\u66F4\u65B0\u63A5\u53E3\u5931\u8D25\uFF1A", err);
    toastr.error(`\u65E0\u6CD5\u8FDE\u63A5\u5230\u9152\u9986\u66F4\u65B0\u63A5\u53E3\uFF1A${err && err.message ? err.message : err}`, "\u66F4\u65B0\u5931\u8D25");
    setUpdateStatus("\u274C \u65E0\u6CD5\u8FDE\u63A5\u5230\u9152\u9986\u66F4\u65B0\u63A5\u53E3", "error");
    showReinstallGuide(`\u65E0\u6CD5\u8FDE\u63A5\u5230\u9152\u9986\u66F4\u65B0\u63A5\u53E3\uFF1A${err && err.message ? err.message : err}`);
    return false;
  }
  if (!update_response.ok) {
    let errText = "";
    try {
      errText = await update_response.text();
    } catch (_) {
    }
    const status = update_response.status;
    console.error(`\u66F4\u65B0\u5931\u8D25 ${status}:`, errText);
    if (status === 403) {
      toastr.error("\u5F53\u524D\u7528\u6237\u6CA1\u6709\u66F4\u65B0\u5168\u5C40\u63D2\u4EF6\u7684\u6743\u9650\uFF0C\u8BF7\u4F7F\u7528\u7BA1\u7406\u5458\u8D26\u53F7\u767B\u5F55\u540E\u518D\u8BD5\u3002", "\u66F4\u65B0\u5931\u8D25");
      setUpdateStatus("\u274C \u6CA1\u6709\u66F4\u65B0\u6743\u9650\uFF08\u9700\u8981\u7BA1\u7406\u5458\uFF09", "error");
      showReinstallGuide("\u5F53\u524D\u7528\u6237\u6CA1\u6709\u66F4\u65B0\u5168\u5C40\u63D2\u4EF6\u7684\u6743\u9650\uFF08\u9700\u8981\u7BA1\u7406\u5458\u8D26\u53F7\uFF09\u3002");
    } else if (status === 404) {
      toastr.error('\u672A\u627E\u5230\u63D2\u4EF6\u76EE\u5F55\u3002\u8BF7\u786E\u8BA4\u63D2\u4EF6\u662F\u901A\u8FC7"\u5B89\u88C5\u6269\u5C55"\u6309\u94AE\uFF08git clone\uFF09\u5B89\u88C5\u7684\uFF0C\u800C\u4E0D\u662F\u624B\u52A8\u590D\u5236\u7C98\u8D34\u6587\u4EF6\u5939\u3002', "\u66F4\u65B0\u5931\u8D25");
      setUpdateStatus("\u274C \u63D2\u4EF6\u76EE\u5F55\u4E0D\u5B58\u5728\u6216\u4E0D\u662F Git \u4ED3\u5E93", "error");
      showReinstallGuide("\u672A\u627E\u5230\u63D2\u4EF6\u76EE\u5F55\uFF0C\u6216\u5F53\u524D\u5B89\u88C5\u65B9\u5F0F\u4E0D\u662F\u901A\u8FC7 git \u514B\u9686\u3002");
    } else if (status === 500) {
      toastr.error(
        '\u9152\u9986\u540E\u7AEF git \u64CD\u4F5C\u5931\u8D25\uFF0C\u53EF\u80FD\u539F\u56E0\uFF1A\n1. \u65E0\u6CD5\u8BBF\u95EE GitHub\uFF08\u8BF7\u68C0\u67E5\u7F51\u7EDC/\u4EE3\u7406\uFF09\n2. \u63D2\u4EF6\u76EE\u5F55\u4E0D\u662F git \u4ED3\u5E93\uFF08\u7528 ZIP \u89E3\u538B\u5B89\u88C5\u4F1A\u51FA\u73B0\uFF09\n3. \u672C\u5730\u6709\u672A\u63D0\u4EA4\u7684\u4FEE\u6539\u5BFC\u81F4\u65E0\u6CD5 pull\n\u5EFA\u8BAE\uFF1A\u624B\u52A8\u5220\u9664\u63D2\u4EF6\u540E\u901A\u8FC7"\u5B89\u88C5\u6269\u5C55"\u91CD\u65B0\u5B89\u88C5\u3002',
        "\u66F4\u65B0\u5931\u8D25",
        { timeOut: 12e3, extendedTimeOut: 6e3 }
      );
      setUpdateStatus("\u274C \u670D\u52A1\u7AEF git \u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u63A7\u5236\u53F0/\u65E5\u5FD7", "error");
      showReinstallGuide("\u9152\u9986\u540E\u7AEF git \u66F4\u65B0\u5931\u8D25\uFF08\u7F51\u7EDC/\u4ED3\u5E93\u72B6\u6001/\u6743\u9650\u95EE\u9898\uFF09\u3002");
    } else {
      toastr.error(`\u66F4\u65B0\u5931\u8D25 (${status}): ${errText || update_response.statusText}`, "\u66F4\u65B0\u5931\u8D25");
      setUpdateStatus(`\u274C \u66F4\u65B0\u5931\u8D25 (${status})`, "error");
      showReinstallGuide(`\u66F4\u65B0\u5931\u8D25 (${status})\uFF1A${errText || update_response.statusText || ""}`);
    }
    return false;
  }
  let result;
  try {
    result = await update_response.json();
  } catch (e) {
    console.error("\u89E3\u6790\u66F4\u65B0\u54CD\u5E94\u5931\u8D25\uFF1A", e);
    toastr.error("\u66F4\u65B0\u54CD\u5E94\u89E3\u6790\u5931\u8D25", "\u66F4\u65B0\u5931\u8D25");
    setUpdateStatus("\u274C \u66F4\u65B0\u54CD\u5E94\u89E3\u6790\u5931\u8D25", "error");
    showReinstallGuide("\u66F4\u65B0\u54CD\u5E94\u89E3\u6790\u5931\u8D25");
    return false;
  }
  if (result.isUpToDate) {
    const local = window.chatu8LocalVersion;
    const remote = window.chatu8RemoteVersion;
    if (local && remote && compareVersion(remote, local) > 0) {
      console.warn(`git \u62A5\u544A\u5DF2\u662F\u6700\u65B0\uFF0C\u4F46 manifest \u7248\u672C\u4E0D\u4E00\u81F4\uFF1A\u672C\u5730 v${local}\uFF0C\u8FDC\u7AEF v${remote}`);
      toastr.warning(
        `\u68C0\u6D4B\u5230\u65B0\u7248\u672C v${remote}\uFF08\u5F53\u524D v${local}\uFF09\uFF0C\u4F46\u9152\u9986 git \u66F4\u65B0\u672A\u751F\u6548\u3002
\u5E38\u89C1\u539F\u56E0\uFF1A
\xB7 \u7F51\u7EDC\u65E0\u6CD5\u8BBF\u95EE GitHub\uFF08\u8BF7\u4F7F\u7528\u4EE3\u7406\u540E\u91CD\u8BD5\uFF09
\xB7 \u5F53\u524D\u63D2\u4EF6\u4E0D\u662F\u7528"\u5B89\u88C5\u6269\u5C55"\u6309\u94AE\u5B89\u88C5\u7684\uFF0Cgit \u62C9\u53D6\u65E0\u6548
\xB7 \u672C\u5730\u4ED3\u5E93 origin \u6307\u5411\u4E86\u65E7\u7684 fork
\u5EFA\u8BAE\uFF1A\u5220\u9664\u63D2\u4EF6\u540E\u901A\u8FC7"\u5B89\u88C5\u6269\u5C55"\u91CD\u65B0\u5B89\u88C5\u6700\u65B0\u7248\u672C\u3002`,
        "\u66F4\u65B0\u672A\u751F\u6548",
        { timeOut: 15e3, extendedTimeOut: 8e3 }
      );
      setUpdateStatus(`\u26A0\uFE0F \u68C0\u6D4B\u5230\u65B0\u7248\u672C v${remote}\uFF0C\u4F46\u66F4\u65B0\u672A\u751F\u6548\uFF0C\u8BF7\u624B\u52A8\u91CD\u88C5`, "error");
      showReinstallGuide(`\u68C0\u6D4B\u5230\u65B0\u7248\u672C v${remote}\uFF0C\u4F46 git \u66F4\u65B0\u672A\u751F\u6548\uFF08\u5F53\u524D\u4ECD\u4E3A v${local}\uFF09\u3002`);
      return false;
    }
    toastr.success("\u63D2\u4EF6\u662F\u6700\u65B0\u7248\u672C");
    console.log("\u63D2\u4EF6\u662F\u6700\u65B0\u7248\u672C");
    setUpdateStatus(`\u2705 \u5DF2\u662F\u6700\u65B0\u7248\u672C v${local || ""}`.trim(), "uptodate");
    return true;
  }
  reload();
  return true;
}

async function chenk() {
  if (checkSendBuClass()) {
    return;
  }
  replaceWithcomfyui();
  replaceWithBanana();
  replaceWithRunningHub();
  replaceWithnovelai();
  replaceWithSd();
}

await loadJSZip().then(() => {
  console.log("Initializing..JSZip.");
});

await loadcrypto().then(() => {
  console.log("Initializing..CryptoJS.");
});

if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
  window.requestIdleCallback(() => {
    loadmsgpack().catch(() => {
    });
  });
} else {
  setTimeout(() => {
    loadmsgpack().catch(() => {
    });
  }, 2e3);
}

window.imagesid = "";

window.xiancheng = true;

async function checkForUpdates2() {
  try {
    const localManifestResponse = await fetch(`${extensionFolderPath}/manifest.json?t=${(/* @__PURE__ */ new Date()).getTime()}`, { cache: "no-cache" });
    if (localManifestResponse.ok) {
      const localManifest = await localManifestResponse.json();
      const localVersion = localManifest.version;
      window.chatu8LocalVersion = localVersion;
    } else {
      console.error("Failed to fetch local manifest for version check.");
    }
  } catch (error) {
    console.error("Error fetching local manifest:", error);
  }
  const updateNotesElement = document.getElementById("ch-update-notes");
  console.log("Checking for updates...", updateNotesElement);
  try {
    const remoteManifestUrl = `https://raw.githubusercontent.com/damoshen123/st-chatu8/master/manifest.json?t=${(/* @__PURE__ */ new Date()).getTime()}`;
    const response = await fetch(remoteManifestUrl, { cache: "no-cache" });
    if (!response.ok) {
      console.error("Failed to fetch remote manifest for update check.");
      if (updateNotesElement) {
        updateNotesElement.textContent = "\u65E0\u6CD5\u83B7\u53D6\u6700\u65B0\u66F4\u65B0\uFF0C\u5C1D\u8BD5\u70B9\u51FB\u66F4\u65B0\u6309\u94AE\uFF0C\u68C0\u67E5\u66F4\u65B0\u3002";
      }
      window.chatu8UpdateAvailable = false;
      return;
    }
    const remoteManifest = await response.json();
    const remoteVersion = remoteManifest.version;
    window.chatu8RemoteVersion = remoteVersion;
    if (updateNotesElement && remoteManifest.updata) {
      updateNotesElement.textContent = remoteManifest.updata;
      updateNotesElement.dispatchEvent(new CustomEvent("chatu8-changelog-update", {
        detail: { rawText: remoteManifest.updata, currentVersion: window.chatu8LocalVersion }
      }));
    }
    if (window.chatu8LocalVersion) {
      if (remoteVersion.localeCompare(window.chatu8LocalVersion, void 0, { numeric: true, sensitivity: "base" }) > 0) {
        console.log(`New version available: ${remoteVersion} (current: ${window.chatu8LocalVersion})`);
        window.chatu8UpdateAvailable = true;
      } else {
        console.log("Extension is up to date.");
        window.chatu8UpdateAvailable = false;
      }
    } else {
      window.chatu8UpdateAvailable = false;
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
    if (updateNotesElement) {
      updateNotesElement.textContent = "\u65E0\u6CD5\u83B7\u53D6\u6700\u65B0\u66F4\u65B0\uFF0C\u5C1D\u8BD5\u70B9\u51FB\u66F4\u65B0\u6309\u94AE\uFF0C\u68C0\u67E5\u66F4\u65B0\u3002";
    }
    window.chatu8UpdateAvailable = false;
  }
}

main();

function loadCSS(url) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${extensionFolderPath}/${url}?t=${(/* @__PURE__ */ new Date()).getTime()}`;
  document.head.appendChild(link);
}

async function main() {
  const cssFiles = [
    "styles/main.css",
    "styles/about.css",
    "styles/forms.css",
    "styles/cache.css",
    "styles/image_cache.css",
    "styles/modals.css",
    "styles/fab.css",
    "styles/responsive.css",
    "styles/click-trigger.css",
    "styles/ai-assistant.css",
    "styles/summary-manager.css"
  ];
  cssFiles.forEach(loadCSS);
  const mergedSettings = { ...JSON.parse(JSON.stringify(defaultSettings)), ...extension_settings[extensionName] };
  if (mergedSettings.chatu8_fab_video_paths) {
    let pathsChanged = false;
    if (mergedSettings.chatu8_fab_video_paths.idle && mergedSettings.chatu8_fab_video_paths.idle.includes(".mp4")) {
      mergedSettings.chatu8_fab_video_paths.idle = mergedSettings.chatu8_fab_video_paths.idle.replace("\u9759\u606F\u753B\u9762.mp4", "idle.chatu8").replace(/\.mp4$/, ".chatu8");
      pathsChanged = true;
    }
    if (mergedSettings.chatu8_fab_video_paths.dragging && mergedSettings.chatu8_fab_video_paths.dragging.includes(".mp4")) {
      mergedSettings.chatu8_fab_video_paths.dragging = mergedSettings.chatu8_fab_video_paths.dragging.replace("\u62D6\u52A8.mp4", "dragging.chatu8").replace(/\.mp4$/, ".chatu8");
      pathsChanged = true;
    }
    if (pathsChanged) {
      console.log("[st-chatu8] \u81EA\u52A8\u8FC1\u79FB\u65E7\u7248\u89C6\u9891\u914D\u7F6E\u8DEF\u5F84 -> .chatu8");
    }
  }
  const configMigrated = migrateToolAndTailConfigIfOldDefault(mergedSettings);
  if (configMigrated) {
    console.log("[st-chatu8] \u81EA\u52A8\u66F4\u65B0\u5168\u5C40 Tool Call / Tail \u9ED8\u8BA4\u914D\u7F6E");
    saveSettingsDebounced();
  }
  extension_settings[extensionName] = mergedSettings;
  ensureInjectionTemplatesInit();
  installGlobalErrorHandler();
  initImageGenStatsListener();
  await initUI({ check_update });
  initializeNewlineFixer();
  initializeTTS();
  initializeASR();
  setTimeout(addNewElement, 2e3);
  setInterval(chenk, 4e3);
  await checkForUpdates2();
}

function addNewElement() {
  const targetElement = document.querySelector("#option_toggle_AN");
  if (targetElement) {
    if (!document.getElementById("option_toggle_AN88")) {
      const newElement = document.createElement("a");
      newElement.id = "option_toggle_AN88";
      const icon = document.createElement("i");
      icon.className = "fa-lg fa-solid fa-note-sticky";
      newElement.appendChild(icon);
      const span = document.createElement("span");
      span.setAttribute("data-i18n", "\u6253\u5F00\u8BBE\u7F6E");
      span.textContent = "\u6253\u5F00\u6587\u751F\u56FE\u8BBE\u7F6E";
      newElement.appendChild(span);
      targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
      console.log("chatu settings button added.");
      document.getElementById("option_toggle_AN88").addEventListener("click", window.showChatuSettingsPanel);
    }
  }
}

export function __set_fabIconPreviewToken(v) { fabIconPreviewToken = v; }

export function __set_settings2(v) { settings2 = v; }

export { FAB_ICON_ACCEPTED_TYPES, FAB_ICON_MAX_DIMENSION, FAB_ICON_MAX_FILE_SIZE, FAB_ICON_QUALITY, MODE_NAV_TABS, VIDEO_NAV_TABS, currentPreviewTheme2, fabIconPreviewToken, genEndedEvent, genStartedEvent, genStoppedEvent, generationTabs3, settings2, tabIds };
