// 还原自打包产物 — 原始模块: utils/ui_common.js
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { defaultSettings, extensionName } from "./config.js";
import { getConfigImage } from "./configDatabase.js";
import { checkWebGLSupport, createVideoPlayer } from "./settings/fabVideoPlayerWebGL.js";
import { initVideoController } from "./settings/fabVideoController.js";

var fabIconLoadToken, globalVideoController, globalVideoPlayer, settingsPanelResizeHandler;

globalVideoPlayer = null;

globalVideoController = null;

fabIconLoadToken = 0;

settingsPanelResizeHandler = null;

function getFabCustomIconElement(fabElement) {
  let img = fabElement.querySelector(".st-chatu8-fab-custom-icon");
  if (!img) {
    img = document.createElement("img");
    img.className = "st-chatu8-fab-custom-icon";
    img.alt = "\u60AC\u6D6E\u7403\u56FE\u6807";
    fabElement.appendChild(img);
  }
  return img;
}

function clearFabCustomIcon(fab, size) {
  fabIconLoadToken++;
  const icon = fab.find("i");
  const img = fab[0]?.querySelector(".st-chatu8-fab-custom-icon");
  if (img) {
    img.removeAttribute("src");
    img.style.display = "none";
  }
  icon.css("font-size", `${Math.round(size * 0.48)}px`);
  icon.show();
}

function showFabCustomIcon(fab, src, onError) {
  const img = getFabCustomIconElement(fab[0]);
  img.onerror = onError || null;
  img.src = src;
  img.style.display = "block";
  fab.find("i").hide();
}

function fallbackLoadFabIcon(fab, settings3, size, imageId, token2) {
  getConfigImage(imageId).then((src) => {
    if (token2 !== fabIconLoadToken) return;
    if (src) {
      showFabCustomIcon(fab, src);
      return;
    }
    settings3.chatu8_fab_icon_image_id = "";
    saveSettingsDebounced();
    clearFabCustomIcon(fab, size);
  }).catch((error) => {
    if (token2 !== fabIconLoadToken) return;
    console.error("[st-chatu8] \u52A0\u8F7D\u60AC\u6D6E\u7403\u81EA\u5B9A\u4E49\u56FE\u6807\u5931\u8D25:", error);
    clearFabCustomIcon(fab, size);
  });
}

function applyFabIconImage(fab, settings3, size) {
  const imageId = settings3.chatu8_fab_icon_image_id;
  if (!imageId) {
    clearFabCustomIcon(fab, size);
    return;
  }
  const serverPath = settings3.configImageStorage?.[imageId]?.path;
  if (serverPath) {
    const token3 = ++fabIconLoadToken;
    showFabCustomIcon(fab, serverPath, () => fallbackLoadFabIcon(fab, settings3, size, imageId, token3));
    return;
  }
  const token2 = ++fabIconLoadToken;
  fallbackLoadFabIcon(fab, settings3, size, imageId, token2);
}

function getGlobalVideoPlayer() {
  return globalVideoPlayer;
}

function getGlobalVideoController() {
  return globalVideoController;
}

function getSuffix(mode) {
  if (mode === "sd") return "";
  return `_${mode}`;
}

function isValidUrl(string) {
  if (!string || string.trim() === "") return true;
  const urlRegex = /^(https?:\/\/)?(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)*$/;
  return urlRegex.test(string);
}

function validateUrlInput(inputElement) {
  if (!inputElement) return;
  const parentGroup = inputElement.closest(".st-chatu8-input-group");
  if (!parentGroup) return;
  const isValid = isValidUrl(inputElement.value);
  parentGroup.classList.toggle("invalid", !isValid);
}

function size_change(prefix) {
  if (prefix == "sd") {
    prefix = "sd_c";
  } else {
    prefix = prefix + "_";
  }
  const width = document.getElementById(`${prefix}width`);
  const height = document.getElementById(`${prefix}height`);
  const selectElement = document.getElementById(`${prefix}size`);
  if (width && height && selectElement) {
    const [selectElementwidth, selectElementheight] = selectElement.value.split("x");
    width.value = selectElementwidth;
    height.value = selectElementheight;
    $(width).trigger("input");
    $(height).trigger("input");
  }
}

function stylInput(message, defaultValue = "") {
  return new Promise((resolve) => {
    const parent = document.getElementById("st-chatu8-settings") || document.body;
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-confirm-backdrop";
    const confirmBox = document.createElement("div");
    confirmBox.className = "st-chatu8-confirm-box";
    const messageText = document.createElement("p");
    messageText.textContent = message;
    messageText.className = "st-chatu8-confirm-message";
    confirmBox.appendChild(messageText);
    const messageinput = document.createElement("input");
    messageinput.className = "st-chatu8-text-input";
    messageinput.value = defaultValue;
    confirmBox.appendChild(messageinput);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "st-chatu8-confirm-buttons";
    confirmBox.appendChild(buttonContainer);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "\u53D6\u6D88";
    cancelButton.className = "st-chatu8-btn";
    buttonContainer.appendChild(cancelButton);
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "\u786E\u5B9A";
    confirmButton.className = "st-chatu8-btn";
    buttonContainer.appendChild(confirmButton);
    backdrop.appendChild(confirmBox);
    parent.appendChild(backdrop);
    const close = (value) => {
      parent.removeChild(backdrop);
      resolve(value);
    };
    cancelButton.addEventListener("click", () => close(false));
    confirmButton.addEventListener("click", () => close(messageinput.value));
    messageinput.focus();
  });
}

function formatListForDialog(items, threshold = 8, itemType = "\u9879") {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return "";
  }
  if (typeof threshold !== "number" || threshold <= 0) {
    threshold = 8;
  }
  if (items.length <= threshold) {
    return ":\n" + items.join("\n");
  } else {
    const previewCount = Math.min(5, items.length);
    const preview = items.slice(0, previewCount).join("\n");
    return `:
${preview}
...\u7B49\u5171 ${items.length} \u4E2A${itemType}`;
  }
}

function stylishConfirm(message) {
  return new Promise((resolve) => {
    const parent = document.getElementById("st-chatu8-settings") || document.body;
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-confirm-backdrop";
    backdrop.style.zIndex = "99999";
    const confirmBox = document.createElement("div");
    confirmBox.className = "st-chatu8-confirm-box";
    const messageText = document.createElement("p");
    messageText.textContent = message;
    messageText.className = "st-chatu8-confirm-message";
    confirmBox.appendChild(messageText);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "st-chatu8-confirm-buttons";
    confirmBox.appendChild(buttonContainer);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "\u53D6\u6D88";
    cancelButton.className = "st-chatu8-btn";
    buttonContainer.appendChild(cancelButton);
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "\u786E\u5B9A";
    confirmButton.className = "st-chatu8-btn";
    buttonContainer.appendChild(confirmButton);
    backdrop.appendChild(confirmBox);
    parent.appendChild(backdrop);
    const close = (value) => {
      parent.removeChild(backdrop);
      resolve(value);
    };
    cancelButton.addEventListener("click", () => close(false));
    confirmButton.addEventListener("click", () => close(true));
    confirmButton.focus();
  });
}

function logJSZipStatus() {
  const jszipScripts = Array.from(document.querySelectorAll("script[src]")).map((script) => script.getAttribute("src")).filter((src) => typeof src === "string" && src.toLowerCase().includes("jszip"));
  const pluginScopedJSZip = window.stChatu8JSZip;
  const globalJSZip = window.JSZip;
  const jszipConstructor = pluginScopedJSZip || globalJSZip;
  const canInstantiate = typeof jszipConstructor === "function";
  console.log("[st-chatu8] JSZip panel check", {
    hasDefine: typeof globalThis.define === "function",
    hasDefineAmd: Boolean(globalThis.define?.amd),
    defineType: typeof globalThis.define,
    hasRequire: typeof globalThis.require === "function",
    requireType: typeof globalThis.require,
    hasModule: typeof globalThis.module !== "undefined",
    moduleType: typeof globalThis.module,
    hasExports: typeof globalThis.exports !== "undefined",
    exportsType: typeof globalThis.exports,
    hasPluginScopedJSZip: typeof pluginScopedJSZip === "function",
    pluginScopedJszipType: typeof pluginScopedJSZip,
    pluginScopedJszipName: pluginScopedJSZip?.name,
    hasWindowJSZip: typeof globalJSZip !== "undefined",
    jszipType: typeof globalJSZip,
    jszipName: globalJSZip?.name,
    canInstantiate,
    hasFileMethod: typeof jszipConstructor?.prototype?.file === "function",
    hasGenerateAsyncMethod: typeof jszipConstructor?.prototype?.generateAsync === "function",
    jszipScriptsCount: jszipScripts.length,
    jszipScripts
  });
  if (!canInstantiate) {
    return;
  }
  try {
    const zip = new jszipConstructor();
    zip.file("st-chatu8-jszip-test.txt", `panel-check-${Date.now()}`);
    zip.generateAsync({ type: "blob" }).then((blob) => {
      console.log("[st-chatu8] JSZip compression test passed", {
        constructorSource: pluginScopedJSZip ? "plugin-scoped" : "window",
        resultType: Object.prototype.toString.call(blob),
        resultSize: blob?.size
      });
    }).catch((error) => {
      console.error("[st-chatu8] JSZip compression test failed", error);
    });
  } catch (error) {
    console.error("[st-chatu8] JSZip instantiation test failed", error);
  }
}

function getMobileLayoutBounds(doc = document) {
  const win = doc.defaultView || window;
  let topBottom = 0;
  const topSettingsHolder = doc.querySelector("#top-settings-holder");
  const topBar = doc.querySelector("#top-bar");
  const aiConfigButton = doc.querySelector("#ai-config-button");
  if (topSettingsHolder) {
    const r = topSettingsHolder.getBoundingClientRect();
    if (r.bottom > 0) topBottom = Math.max(topBottom, r.bottom);
  }
  if (topBar) {
    const r = topBar.getBoundingClientRect();
    if (r.bottom > 0) topBottom = Math.max(topBottom, r.bottom);
  }
  if (aiConfigButton && topBottom <= 0) {
    const r = aiConfigButton.getBoundingClientRect();
    topBottom = Math.max(topBottom, r.bottom || (aiConfigButton.offsetHeight || 0));
  }
  if (topBottom <= 0) {
    topBottom = 40;
  }
  const topBound = Math.max(10, Math.min(topBottom + 8, win.innerHeight * 0.45));
  let bottomTop = win.innerHeight;
  const formSheld = doc.querySelector("#form_sheld");
  const sendForm = doc.querySelector("#send_form");
  const sendTextarea = doc.querySelector("#send_textarea");
  const leftSendForm = doc.querySelector("#leftSendForm");
  const bottomEl = formSheld || sendForm || sendTextarea || leftSendForm;
  if (bottomEl) {
    const r = bottomEl.getBoundingClientRect();
    if (r.top > 0) bottomTop = r.top;
  }
  const bottomBound = Math.max(topBound + 200, Math.min(bottomTop - 8, win.innerHeight - 10));
  const availableHeight = Math.max(200, bottomBound - topBound);
  return { topBound, bottomBound, availableHeight };
}

function applySettingsPanelMobileLayout() {
  const panel = $("#ch-settings-modal");
  if (!panel.length || !panel.is(":visible")) return;
  const content = panel.find(".st-chatu8-modal-content");
  if (window.innerWidth <= 768) {
    const { topBound, availableHeight } = getMobileLayoutBounds(document);
    panel.css({ "align-items": "start" });
    content.css({
      "margin-top": `${topBound}px`,
      "height": `${availableHeight}px`
    });
  } else {
    panel.css({ "align-items": "" });
    content.css({
      "margin-top": "",
      "height": ""
    });
  }
}

function showSettingsPanel() {
  const settings3 = extension_settings[extensionName];
  const panel = $("#ch-settings-modal");
  if (!panel.length) {
    console.error("Settings panel not found!");
    return;
  }
  logJSZipStatus();
  const lastTab = settings3.lastTab || "main";
  const lastTabLink = panel.find(`.st-chatu8-nav-link[data-tab="${lastTab}"]`);
  const lastTabHidden = lastTabLink.length && lastTabLink[0].style.display === "none";
  if (lastTabLink.length && !lastTabHidden) {
    lastTabLink.click();
  } else {
    panel.find('.st-chatu8-nav-link[data-tab="main"]').click();
  }
  panel.css("display", "grid");
  applySettingsPanelMobileLayout();
  if (!settingsPanelResizeHandler) {
    settingsPanelResizeHandler = () => {
      if ($("#ch-settings-modal").is(":visible")) {
        applySettingsPanelMobileLayout();
      }
    };
    window.addEventListener("resize", settingsPanelResizeHandler, { passive: true });
    window.addEventListener("orientationchange", settingsPanelResizeHandler, { passive: true });
  }
  panel.find(".st-chatu8-modal-content").focus();
}

function hideSettingsPanel() {
  const panel = $("#ch-settings-modal");
  panel.hide();
  panel.css({ "align-items": "", "padding-top": "" });
  panel.find(".st-chatu8-modal-content").css({
    "margin-top": "",
    "height": ""
  });
  if (settingsPanelResizeHandler) {
    window.removeEventListener("resize", settingsPanelResizeHandler);
    window.removeEventListener("orientationchange", settingsPanelResizeHandler);
    settingsPanelResizeHandler = null;
  }
}

function showToast(message, type = "info", duration = 3e3) {
  if (typeof toastr === "undefined") {
    console.warn("toastr is not defined, fallback to console.log");
    console.log(`[${type}] ${message}`);
    return;
  }
  toastr.options = {
    ...toastr.options,
    "timeOut": duration,
    "progressBar": true,
    "preventDuplicates": true,
    "newestOnTop": true
  };
  if (toastr[type]) {
    toastr[type](message);
  } else {
    toastr.info(message);
  }
}

function applyFabSettings() {
  const settings3 = extension_settings[extensionName];
  const fab = $("#st-chatu8-fab");
  if (!fab.length) {
    console.error("FAB element not found in DOM");
    return;
  }
  console.log("=== applyFabSettings called ===");
  console.log("enable_chatu8_fab:", settings3.enable_chatu8_fab, "Type:", typeof settings3.enable_chatu8_fab);
  console.log("enable_chatu8_fab_video:", settings3.enable_chatu8_fab_video, "Type:", typeof settings3.enable_chatu8_fab_video);
  console.log("chatu8_fab_video_paths:", settings3.chatu8_fab_video_paths);
  if (String(settings3.enable_chatu8_fab) === "true") {
    fab.show();
    const videoModeEnabled = settings3.enable_chatu8_fab_video === true || settings3.enable_chatu8_fab_video === "true";
    if (videoModeEnabled) {
      fab.addClass("st-chatu8-fab-video-mode");
      fab.css("background-color", "transparent");
      fab.css("opacity", 1);
      fab.find("i").css("display", "none");
      if (!globalVideoPlayer) {
        console.log("Creating video player...");
        console.log("WebGL support:", checkWebGLSupport());
        const staleCanvas = fab[0].querySelector("#st-chatu8-fab-video-canvas");
        if (staleCanvas) {
          staleCanvas.parentNode.removeChild(staleCanvas);
          console.log("[st-chatu8] Cleaned up stale canvas element");
        }
        if (settings3.chatu8_fab_video_paths) {
          let needsSave = false;
          if (settings3.chatu8_fab_video_paths.idle && settings3.chatu8_fab_video_paths.idle.endsWith(".webm")) {
            settings3.chatu8_fab_video_paths.idle = settings3.chatu8_fab_video_paths.idle.replace(".webm", ".mp4");
            needsSave = true;
            console.log("Migrated idle video path to .mp4");
          }
          if (settings3.chatu8_fab_video_paths.dragging && settings3.chatu8_fab_video_paths.dragging.endsWith(".webm")) {
            settings3.chatu8_fab_video_paths.dragging = settings3.chatu8_fab_video_paths.dragging.replace(".webm", ".mp4");
            needsSave = true;
            console.log("Migrated dragging video path to .mp4");
          }
          const defaultPaths = defaultSettings.chatu8_fab_video_paths;
          if (!settings3.chatu8_fab_video_paths.idle || settings3.chatu8_fab_video_paths.idle.trim() === "") {
            settings3.chatu8_fab_video_paths.idle = defaultPaths.idle;
            needsSave = true;
            console.log("Reset idle video path to default");
          }
          if (!settings3.chatu8_fab_video_paths.dragging || settings3.chatu8_fab_video_paths.dragging.trim() === "") {
            settings3.chatu8_fab_video_paths.dragging = defaultPaths.dragging;
            needsSave = true;
            console.log("Reset dragging video path to default");
          }
          if (needsSave) {
            saveSettingsDebounced();
            console.log("Settings saved after migration");
          }
        } else {
          settings3.chatu8_fab_video_paths = JSON.parse(JSON.stringify(defaultSettings.chatu8_fab_video_paths));
          saveSettingsDebounced();
          console.log("Initialized video paths with default values");
        }
        console.log("Video paths:", settings3.chatu8_fab_video_paths);
        if (!checkWebGLSupport()) {
          console.error("WebGL not supported by browser");
          showToast("\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 WebGL", "error");
          return;
        }
        if (!settings3.chatu8_fab_video_paths || !settings3.chatu8_fab_video_paths.idle || !settings3.chatu8_fab_video_paths.dragging) {
          console.error("Video paths not configured");
          showToast("\u89C6\u9891\u8DEF\u5F84\u672A\u914D\u7F6E", "error");
          return;
        }
        try {
          globalVideoPlayer = createVideoPlayer(fab[0], {
            idleVideoSrc: settings3.chatu8_fab_video_paths.idle,
            draggingVideoSrc: settings3.chatu8_fab_video_paths.dragging,
            onError: (errorType, videoSrc) => {
              console.error(`Video load error (${errorType}):`, videoSrc);
              const defaultPaths = defaultSettings.chatu8_fab_video_paths;
              let needsRetry = false;
              if (errorType === "idle" && settings3.chatu8_fab_video_paths.idle !== defaultPaths.idle) {
                console.log("Attempting to use default idle video path");
                settings3.chatu8_fab_video_paths.idle = defaultPaths.idle;
                needsRetry = true;
              }
              if (errorType === "dragging" && settings3.chatu8_fab_video_paths.dragging !== defaultPaths.dragging) {
                console.log("Attempting to use default dragging video path");
                settings3.chatu8_fab_video_paths.dragging = defaultPaths.dragging;
                needsRetry = true;
              }
              if (needsRetry) {
                saveSettingsDebounced();
                showToast("\u89C6\u9891\u8DEF\u5F84\u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u503C\uFF0C\u8BF7\u5237\u65B0\u9875\u9762", "warning");
              }
            }
          });
          globalVideoController = initVideoController(globalVideoPlayer, {
            isLoadingFn: () => {
              const fabEl = document.getElementById("st-chatu8-fab");
              return fabEl && fabEl.dataset.isLoading === "true";
            }
          });
          console.log("Video player created successfully");
          setTimeout(() => {
            const isMobile4 = window.innerWidth <= 768;
            const size2 = isMobile4 ? settings3.chatu8_fab_size?.mobile ?? settings3.chatu8_fab_size ?? 40 : settings3.chatu8_fab_size?.desktop ?? settings3.chatu8_fab_size ?? 50;
            console.log("[st-chatu8] Applying initial size to video player:", size2);
            if (globalVideoPlayer) {
              globalVideoPlayer.updateSize(size2);
            }
          }, 100);
        } catch (error) {
          console.error("Failed to create video player:", error);
          showToast("\u89C6\u9891\u64AD\u653E\u5668\u521B\u5EFA\u5931\u8D25: " + error.message, "error");
        }
      } else {
        console.log("Video player already exists, skipping creation");
      }
    } else {
      fab.removeClass("st-chatu8-fab-video-mode");
      fab.css("background-color", settings3.chatu8_fab_bg_color || "#ADD8E6");
      fab.find("i").css("color", settings3.chatu8_fab_icon_color || "#FFFFFF");
      fab.css("opacity", settings3.chatu8_fab_opacity ?? 1);
      if (globalVideoPlayer) {
        globalVideoPlayer.destroy();
        globalVideoPlayer = null;
      }
      if (globalVideoController) {
        globalVideoController.cleanup();
        globalVideoController = null;
      }
    }
    const isMobile3 = window.innerWidth <= 768;
    const size = isMobile3 ? settings3.chatu8_fab_size?.mobile ?? settings3.chatu8_fab_size ?? 40 : settings3.chatu8_fab_size?.desktop ?? settings3.chatu8_fab_size ?? 50;
    fab.css("width", `${size}px`);
    fab.css("height", `${size}px`);
    if (videoModeEnabled) {
      if (globalVideoPlayer) {
        globalVideoPlayer.updateSize(size);
      }
      fab.find("i").hide();
    } else {
      applyFabIconImage(fab, settings3, size);
    }
    const position = isMobile3 ? settings3.chatu8_fab_position.mobile || defaultSettings.chatu8_fab_position.mobile : settings3.chatu8_fab_position.desktop || defaultSettings.chatu8_fab_position.desktop;
    fab.css("top", position.top);
    fab.css("left", position.left);
  } else {
    fab.hide();
    if (globalVideoPlayer) {
      globalVideoPlayer.pause();
    }
  }
}

function updateFabSize(size) {
  console.log("[updateFabSize] Called with size:", size);
  const settings3 = extension_settings[extensionName];
  const fab = $("#st-chatu8-fab");
  if (!fab.length) {
    console.error("[updateFabSize] FAB element not found!");
    return;
  }
  const videoModeEnabled = settings3.enable_chatu8_fab_video === true || settings3.enable_chatu8_fab_video === "true";
  console.log("[updateFabSize] Video mode enabled:", videoModeEnabled);
  console.log("[updateFabSize] Global video player exists:", !!globalVideoPlayer);
  const originalTransition = fab[0].style.transition;
  fab[0].style.transition = "none";
  fab.css("width", `${size}px`);
  fab.css("height", `${size}px`);
  void fab[0].offsetWidth;
  console.log("[updateFabSize] FAB container size set to:", fab[0].offsetWidth, "x", fab[0].offsetHeight);
  if (videoModeEnabled) {
    if (globalVideoPlayer) {
      console.log("[updateFabSize] Calling videoPlayer.updateSize...");
      globalVideoPlayer.updateSize(size);
    } else {
      console.warn("[updateFabSize] Video player not initialized!");
    }
    fab.find("i").hide();
  } else {
    console.log("[updateFabSize] Icon mode, updating icon display");
    fab.find("i").css("color", settings3.chatu8_fab_icon_color || "#FFFFFF");
    applyFabIconImage(fab, settings3, size);
  }
  requestAnimationFrame(() => {
    fab[0].style.transition = originalTransition;
  });
  console.log("[updateFabSize] Completed");
}

export { applyFabSettings, formatListForDialog, getGlobalVideoController, getGlobalVideoPlayer, getMobileLayoutBounds, getSuffix, hideSettingsPanel, isValidUrl, showSettingsPanel, showToast, size_change, stylInput, stylishConfirm, updateFabSize, validateUrlInput };
