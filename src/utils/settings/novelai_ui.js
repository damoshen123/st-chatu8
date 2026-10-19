// 还原自打包产物 — 原始模块: utils/settings/novelai_ui.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extensionName } from "../config.js";
import { clearNovelAIUrlCache } from "../novelai.js";
import { NOVELAI_MODEL_PARAM_KEYS, OFFICIAL_NOVELAI_MODEL_DEFAULTS, __set_lastSelectedNovelaiModel, lastSelectedNovelaiModel } from "./vibeTransferGenerator.js";

var RECALC_PHASE_LABELS, allCachedImages, imageCacheCurrentPage, imageCacheItemsPerPage, imageObserver, isMultiSelectMode, recalcPanelDismissed, recalcStartedAt, selectedImages;

var allCachedImages = [];

var imageCacheCurrentPage = 1;

var imageCacheItemsPerPage = 15;

var selectedImages = /* @__PURE__ */ new Set();

var isMultiSelectMode = false;

var recalcStartedAt = 0;

var recalcPanelDismissed = false;

var RECALC_PHASE_LABELS = {
  db: "\u6D4F\u89C8\u5668\u6570\u636E\u5E93",
  server: "\u9152\u9986\u5B58\u50A8",
  writeback: "\u4FDD\u5B58\u7ED3\u679C",
  done: "\u5B8C\u6210",
  finished: "\u7EDF\u8BA1\u5B8C\u6210",
  error: "\u7EDF\u8BA1\u5931\u8D25"
};
function getEffectiveModelConfig(modelName) {
  const settings3 = extension_settings[extensionName] || {};
  const modelConfigs = settings3.novelai_model_configs || {};
  const officialDefault = OFFICIAL_NOVELAI_MODEL_DEFAULTS[modelName] || OFFICIAL_NOVELAI_MODEL_DEFAULTS["nai-diffusion-4-5-full"] || {};
  const userModelConfig = modelConfigs[modelName] || {};
  const merged = {};
  for (const key of NOVELAI_MODEL_PARAM_KEYS) {
    if (userModelConfig[key] !== void 0 && userModelConfig[key] !== null) {
      merged[key] = userModelConfig[key];
    } else if (officialDefault[key] !== void 0) {
      merged[key] = officialDefault[key];
    } else if (settings3[key] !== void 0) {
      merged[key] = settings3[key];
    }
  }
  return merged;
}

function saveModelConfigFromUI(modelName) {
  if (!modelName) return;
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  settings3.novelai_model_configs = settings3.novelai_model_configs || {};
  const currentConfig = settings3.novelai_model_configs[modelName] || {};
  NOVELAI_MODEL_PARAM_KEYS.forEach((key) => {
    const el = document.getElementById(key);
    if (el) {
      let val;
      if (el.type === "checkbox") {
        val = el.checked;
      } else if (el.type === "number") {
        val = el.value === "" ? "" : Number(el.value);
      } else {
        val = el.value;
      }
      currentConfig[key] = val;
      settings3[key] = val;
    }
  });
  settings3.novelai_model_configs[modelName] = currentConfig;
}

function loadModelConfigIntoUI(modelName) {
  if (!modelName) return;
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  const config = getEffectiveModelConfig(modelName);
  NOVELAI_MODEL_PARAM_KEYS.forEach((key) => {
    if (config[key] === void 0) return;
    const val = config[key];
    settings3[key] = val;
    const el = document.getElementById(key);
    if (el) {
      if (el.type === "checkbox") {
        el.checked = String(val) === "true" || val === true;
      } else {
        el.value = val;
      }
    }
  });
  const sizeSelect = document.getElementById("novelai_size");
  const widthInput = document.getElementById("novelai_width");
  const heightInput = document.getElementById("novelai_height");
  if (sizeSelect && widthInput && heightInput) {
    const currentDim = `${widthInput.value}x${heightInput.value}`;
    const hasOption = [...sizeSelect.options].some((opt) => opt.value === currentDim);
    if (hasOption) {
      sizeSelect.value = currentDim;
      settings3.novelai_size = currentDim;
    }
  }
  updateNovelaiReferenceSectionsVisibility(modelName);
  updateNovelaiEffortUIState(modelName);
}

function updateNovelaiEffortUIState(targetModel = null) {
  const novelaiModeSelect = document.getElementById("novelaimode");
  const selectedModel = targetModel || (novelaiModeSelect ? novelaiModeSelect.value : "");
  const effortContainer = document.getElementById("novelai_v5_effort_container");
  const effortInput = document.getElementById("novelai_v5_effort");
  const stepsInput = document.getElementById("novelai_steps");
  const samplerSelect = document.getElementById("novelai_sampler");
  const cfgRescaleInput = document.getElementById("cfg_rescale");
  const btnHigh = document.getElementById("st_chatu8_effort_high");
  const btnMedium = document.getElementById("st_chatu8_effort_medium");
  const isV5Full = selectedModel === "nai-diffusion-5-full";
  if (effortContainer) {
    effortContainer.style.display = isV5Full ? "flex" : "none";
  }
  if (!isV5Full) {
    if (stepsInput) {
      stepsInput.disabled = false;
      stepsInput.title = "";
    }
    if (samplerSelect) {
      samplerSelect.disabled = false;
      samplerSelect.title = "";
    }
    if (cfgRescaleInput) {
      cfgRescaleInput.disabled = false;
      cfgRescaleInput.title = "";
    }
    return;
  }
  const currentEffort = effortInput ? effortInput.value || "high" : "high";
  if (btnHigh && btnMedium) {
    if (currentEffort === "medium") {
      btnHigh.classList.remove("active");
      btnMedium.classList.add("active");
    } else {
      btnHigh.classList.add("active");
      btnMedium.classList.remove("active");
    }
  }
  if (currentEffort === "medium") {
    if (stepsInput) {
      stepsInput.value = 14;
      stepsInput.disabled = true;
      stepsInput.title = "Medium \u6863\u4F4D\u5DF2\u9501\u5B9A\u4E3A 14 \u6B65\uFF08\u84B8\u998F\u9AD8\u6548\u6A21\u578B\uFF09";
    }
    if (samplerSelect) {
      samplerSelect.value = "k_euler_ancestral";
      samplerSelect.disabled = true;
      samplerSelect.title = "Medium \u6863\u4F4D\u5DF2\u9501\u5B9A\u4F7F\u7528 Euler Ancestral \u91C7\u6837\u5668";
    }
    if (cfgRescaleInput) {
      cfgRescaleInput.disabled = true;
      cfgRescaleInput.title = "Medium \u6863\u4F4D\u4E0D\u652F\u6301 Prompt Guidance Rescale";
    }
  } else {
    if (stepsInput) {
      stepsInput.disabled = false;
      stepsInput.title = "";
    }
    if (samplerSelect) {
      samplerSelect.disabled = false;
      samplerSelect.title = "";
    }
    if (cfgRescaleInput) {
      cfgRescaleInput.disabled = false;
      cfgRescaleInput.title = "";
    }
  }
}

function resetCurrentModelToOfficialDefault() {
  const novelaiModeSelect = document.getElementById("novelaimode");
  if (!novelaiModeSelect) return;
  const currentModel = novelaiModeSelect.value;
  const officialDefault = OFFICIAL_NOVELAI_MODEL_DEFAULTS[currentModel];
  if (!officialDefault) {
    if (typeof toastr !== "undefined") {
      toastr.warning(`\u672A\u627E\u5230\u6A21\u578B ${currentModel} \u7684\u5B98\u65B9\u9ED8\u8BA4\u914D\u7F6E`);
    }
    return;
  }
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  settings3.novelai_model_configs = settings3.novelai_model_configs || {};
  settings3.novelai_model_configs[currentModel] = JSON.parse(JSON.stringify(officialDefault));
  loadModelConfigIntoUI(currentModel);
  updateNovelaiModelSchedule();
  saveSettingsDebounced();
  if (typeof toastr !== "undefined") {
    toastr.success(`\u5DF2\u5C06\u6A21\u578B\u3010${currentModel}\u3011\u7684\u5168\u90E8\u53C2\u6570\u91CD\u7F6E\u4E3A\u5B98\u7F51\u9ED8\u8BA4\u503C`, "NovelAI \u53C2\u6570\u91CD\u7F6E");
  }
}

function updateNai3OptionsVisibility() {
  const novelaiModeSelect = document.getElementById("novelaimode");
  const smField = document.getElementById("st-chatu8-nai3-sm-field");
  const dynField = document.getElementById("st-chatu8-nai3-dyn-field");
  const deceispField = document.getElementById("st-chatu8-nai3-deceisp-field");
  const straightAlphaContainer = document.getElementById("novelai_straight_alpha_container");
  if (!novelaiModeSelect || !smField || !dynField || !deceispField) return;
  const selectedModel = novelaiModeSelect.value;
  const isNai3 = selectedModel === "nai-diffusion-3";
  const isNai5 = selectedModel.includes("nai-diffusion-5");
  smField.style.display = isNai3 ? "flex" : "none";
  dynField.style.display = isNai3 ? "flex" : "none";
  deceispField.style.display = isNai3 ? "flex" : "none";
  if (straightAlphaContainer) {
    straightAlphaContainer.style.display = isNai5 ? "flex" : "none";
  }
}

function updateNovelaiReferenceSectionsVisibility(targetModel = null) {
  const settings3 = extension_settings[extensionName] || {};
  const novelaiModeSelect = document.getElementById("novelaimode");
  const vibeSection = document.getElementById("nai-vibe-transfer-section");
  const charRefSection = document.getElementById("nai-char-ref-section");
  const vibeGroupSection = document.getElementById("nai-vibe-group-section");
  const selectedModel = targetModel || (novelaiModeSelect ? novelaiModeSelect.value : null) || settings3.novelaimode;
  if (!selectedModel) return;
  if (vibeSection) {
    vibeSection.style.display = selectedModel === "nai-diffusion-3" ? "block" : "none";
  }
  if (charRefSection) {
    const isCharRefVisible = selectedModel === "nai-diffusion-4-5-curated" || selectedModel === "nai-diffusion-4-5-full";
    charRefSection.style.display = isCharRefVisible ? "block" : "none";
  }
  if (vibeGroupSection) {
    const isVibeGroupVisible = selectedModel.includes("nai-diffusion-4");
    vibeGroupSection.style.display = isVibeGroupVisible ? "block" : "none";
  }
}

function updateNovelaiUcpOptions() {
  const settings3 = extension_settings[extensionName];
  const novelaiModeSelect = document.getElementById("novelaimode");
  const ucpSelect = document.getElementById("UCP_novelai");
  if (!novelaiModeSelect || !ucpSelect) return;
  const selectedModel = novelaiModeSelect.value;
  const isV5Model = selectedModel.includes("nai-diffusion-5");
  let currentValue = settings3.UCP_novelai;
  ucpSelect.innerHTML = "";
  let options = {};
  if (isV5Model) {
    options = {
      "\u65E0": "none",
      "Heavy": "heavy",
      "Light": "light",
      "Furry Focus": "furryFocus",
      "Human Focus": "humanFocus"
    };
    if (currentValue === "Heavy") currentValue = "heavy";
    if (currentValue === "Light") currentValue = "light";
    if (currentValue === "Furry Focus") currentValue = "furryFocus";
    if (currentValue === "Human Focus") currentValue = "humanFocus";
    if (currentValue === "") currentValue = "none";
  } else {
    options = {
      "\u65E0": "",
      "Heavy": "Heavy",
      "Light": "Light"
    };
    if (selectedModel === "nai-diffusion-3" || selectedModel === "nai-diffusion-4-5-full") {
      options["Human Focus"] = "Human Focus";
    }
    if (selectedModel === "nai-diffusion-4-5-full") {
      options["Furry Focus"] = "Furry Focus";
    }
    options["\u4F5C\u8005\u9884\u8BBE"] = "bad proportions, out of focus, username, text, bad anatomy, lowres, worstquality, watermark, cropped, bad body, deformed, mutated, disfigured, poorly drawn face, malformed hands, extra arms, extra limb, missing limb, too many fingers, extra legs, bad feet, missing fingers, fused fingers, acnes, floating limbs, disconnected limbs, long neck, long body, mutation, ugly, blurry, low quality, sketches, normal quality, monochrome, grayscale, signature, logo, jpeg artifacts, unfinished, displeasing, chromatic aberration, extra digits, artistic error, scan, abstract, photo, realism, screencap";
    options["\u4F5C\u8005\u9884set 2"] = "negativeXL_D, negativeXL, source_furry, extra limbs, deformations, long fingers, fused fingers, inaccurate_anatomy, bad proportions, poorly drawn hands, bad hands, extra_fingers, extra_hand, extra_arm, distorted fingers, ugly hands, creepy hands, six fingers, malformed fingers, long_fingers, interlocked fingers:1.2, ugly, deformed, uneven, asymmetrical, unnatural, missing fingers, extra digit, fewer digits, opaque eyes, small eyes, ugly eyes, blurred eyes, bad face, (bad anatomy, ugly face:1.2), (worst quality, low quality, not detailed, low resolution:1.2), motion_blur, blur, blur_censor, blurry, simple_background, text, error, cropped, normal quality, jpeg artifacts, watermark, logo, signature, username, artist name";
    if (currentValue === "heavy") currentValue = "Heavy";
    if (currentValue === "light") currentValue = "Light";
    if (currentValue === "furryFocus") currentValue = "Furry Focus";
    if (currentValue === "humanFocus") currentValue = "Human Focus";
    if (currentValue === "none") currentValue = "";
  }
  for (const [text, value] of Object.entries(options)) {
    const option = new Option(text, value);
    ucpSelect.add(option);
  }
  ucpSelect.value = currentValue;
  if (ucpSelect.selectedIndex === -1) {
    const defaultVal = isV5Model ? "heavy" : "Heavy";
    ucpSelect.value = defaultVal;
    settings3.UCP_novelai = defaultVal;
    saveSettingsDebounced();
  }
}

function updateNovelaiModelSchedule(isInitial = false) {
  const settings3 = extension_settings[extensionName];
  const novelaiModeSelect = document.getElementById("novelaimode");
  const scheduleSelect = document.getElementById("Schedule");
  const samplerSelect = document.getElementById("novelai_sampler");
  if (!novelaiModeSelect) return;
  const selectedModel = novelaiModeSelect.value;
  updateNovelaiReferenceSectionsVisibility(selectedModel);
  if (!scheduleSelect || !samplerSelect) return;
  if (!isInitial && lastSelectedNovelaiModel && lastSelectedNovelaiModel !== selectedModel) {
    saveModelConfigFromUI(lastSelectedNovelaiModel);
  }
  loadModelConfigIntoUI(selectedModel);
  __set_lastSelectedNovelaiModel(selectedModel);
  updateNai3OptionsVisibility();
  updateNovelaiUcpOptions();
  const isV5 = selectedModel.includes("nai-diffusion-5");
  const straightAlphaField = document.getElementById("novelai_straight_alpha_container");
  if (straightAlphaField) {
    straightAlphaField.style.display = isV5 ? "flex" : "none";
  }
  const varietyField = document.querySelector("#nai3Variety")?.closest(".st-chatu8-field");
  if (varietyField) {
    varietyField.style.display = isV5 ? "none" : "flex";
  }
  const nativeOption = [...scheduleSelect.options].find((opt) => opt.value === "native");
  const ddimOption = [...samplerSelect.options].find((opt) => opt.value === "ddim_v3");
  if (selectedModel === "nai-diffusion-3") {
    if (ddimOption) ddimOption.style.display = "";
    if (!nativeOption) {
      const option = new Option("native", "native");
      scheduleSelect.insertBefore(option, scheduleSelect.firstChild);
      if (settings3.Schedule === "native") {
        scheduleSelect.value = "native";
      }
    }
  } else {
    if (ddimOption) {
      ddimOption.style.display = "none";
      if (samplerSelect.value === "ddim_v3") {
        samplerSelect.value = isV5 ? "k_euler_ancestral" : "k_euler";
        $(samplerSelect).trigger("change");
      }
    }
    if (nativeOption) {
      if (scheduleSelect.value === "native") {
        scheduleSelect.value = "karras";
        $(scheduleSelect).trigger("change");
      }
      nativeOption.remove();
    }
  }
  updateNovelaiScheduleVisibility();
  saveSettingsDebounced();
  const fixedPromptEl = document.getElementById("fixedPrompt_novelai");
  if (fixedPromptEl) {
    $(fixedPromptEl).trigger("input");
  }
}

function refreshNovelaiUIFromSettings(targetModel = null) {
  const settings3 = extension_settings[extensionName] || {};
  const novelaiModeSelect = document.getElementById("novelaimode");
  const model = targetModel || settings3.novelaimode || (novelaiModeSelect ? novelaiModeSelect.value : "nai-diffusion-4-5-full");
  if (novelaiModeSelect && novelaiModeSelect.value !== model) {
    novelaiModeSelect.value = model;
  }
  __set_lastSelectedNovelaiModel(model);
  updateNovelaiModelSchedule(true);
}

function updateNovelaiOtherSiteVisibility() {
  const novelaiSiteSelect = document.getElementById("novelaisite");
  const otherSiteField = document.getElementById("novelai-other-site-field");
  if (!novelaiSiteSelect || !otherSiteField) return;
  const shouldShow = novelaiSiteSelect.value !== "\u5B98\u7F51";
  otherSiteField.style.display = shouldShow ? "flex" : "none";
}

function updateNovelaiScheduleVisibility() {
  const novelaiModeSelect = document.getElementById("novelaimode");
  const isV5 = novelaiModeSelect && novelaiModeSelect.value.includes("nai-diffusion-5");
  const sampler = document.getElementById("novelai_sampler");
  const scheduleField = document.querySelector("#Schedule")?.closest(".st-chatu8-field");
  const scheduleSelect = document.getElementById("Schedule");
  if (!sampler || !scheduleField || !scheduleSelect) return;
  const selectedSampler = sampler.value;
  if (isV5 || selectedSampler === "ddim_v3") {
    scheduleField.style.display = "none";
  } else {
    scheduleField.style.display = "flex";
  }
}

function initNovelaiUI(settingsModal) {
  const settings3 = extension_settings[extensionName];
  const novelaiModeSelect = document.getElementById("novelaimode");
  if (novelaiModeSelect) {
    __set_lastSelectedNovelaiModel(novelaiModeSelect.value);
  }
  settingsModal.find("#st_chatu8_reset_model_default").on("click", function() {
    resetCurrentModelToOfficialDefault();
  });
  NOVELAI_MODEL_PARAM_KEYS.forEach((key) => {
    settingsModal.find(`#${key}`).on("change input", function() {
      const modeSelect = document.getElementById("novelaimode");
      const currentModel = modeSelect ? modeSelect.value : null;
      if (currentModel) {
        saveModelConfigFromUI(currentModel);
        saveSettingsDebounced();
      }
    });
  });
  settingsModal.find("#novelai_sampler").on("change", updateNovelaiScheduleVisibility);
  settingsModal.find("#novelaimode").on("change", () => updateNovelaiModelSchedule(false));
  settingsModal.find("#client").on("change", function() {
    const clientVal = $(this).val();
    const novelaiSiteSelect = document.getElementById("novelaisite");
    if (novelaiSiteSelect && novelaiSiteSelect.value !== "\u5B98\u7F51" && clientVal === "jiuguan") {
      if (typeof toastr !== "undefined") {
        toastr.warning("\u7B2C\u4E09\u65B9 NovelAI \u7AD9\u70B9\u4E0D\u652F\u6301\u9152\u9986\u7AEF\u4EE3\u7406\uFF0C\u5EFA\u8BAE\u5C06\u5BA2\u6237\u7AEF\u5207\u6362\u4E3A\u6D4F\u89C8\u5668", "\u63D0\u793A");
      }
    }
    updateNovelaiOtherSiteVisibility();
  });
  settingsModal.find("#novelaisite").on("change", function() {
    const novelaiSite = $(this).val();
    if (novelaiSite !== "\u5B98\u7F51") {
      const clientSelect = document.getElementById("client");
      if (clientSelect && clientSelect.value !== "browser") {
        clientSelect.value = "browser";
        if (settings3) {
          settings3.client = "browser";
        }
        $(clientSelect).trigger("change");
        if (typeof toastr !== "undefined") {
          toastr.info("\u5DF2\u81EA\u52A8\u4E3A\u60A8\u5207\u6362\u5BA2\u6237\u7AEF\u4E3A\uFF1A\u6D4F\u89C8\u5668\uFF08\u7B2C\u4E09\u65B9 NovelAI \u7AD9\u70B9\u4EC5\u652F\u6301\u6D4F\u89C8\u5668\u7AEF\u8BF7\u6C42\uFF09");
        }
        saveSettingsDebounced();
      }
    }
    clearNovelAIUrlCache();
    updateNovelaiOtherSiteVisibility();
  });
  settingsModal.find("#novelaiOtherSite").on("change input", function() {
    clearNovelAIUrlCache();
  });
  settingsModal.find("#novelaiApiToggle").on("click", function() {
    const input = settingsModal.find("#novelaiApi")[0];
    const icon = $(this).find("i");
    if (input.type === "password") {
      input.type = "text";
      icon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
      input.type = "password";
      icon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
  });
  settingsModal.find(".st-chatu8-effort-btn").on("click", function() {
    const effort = $(this).data("effort");
    const effortInput = document.getElementById("novelai_v5_effort");
    if (effortInput) {
      effortInput.value = effort;
      $(effortInput).trigger("change");
    }
    updateNovelaiEffortUIState();
    const modeSelect = document.getElementById("novelaimode");
    const currentModel = modeSelect ? modeSelect.value : null;
    if (currentModel) {
      saveModelConfigFromUI(currentModel);
      saveSettingsDebounced();
    }
  });
  updateNovelaiScheduleVisibility();
  updateNovelaiModelSchedule(true);
  updateNovelaiOtherSiteVisibility();
  updateNovelaiEffortUIState();
}

export function __set_imageObserver(v) { imageObserver = v; }

export function __set_imageCacheCurrentPage(v) { imageCacheCurrentPage = v; }

export function __set_allCachedImages(v) { allCachedImages = v; }

export function __set_recalcPanelDismissed(v) { recalcPanelDismissed = v; }

export function __set_recalcStartedAt(v) { recalcStartedAt = v; }

export function __set_isMultiSelectMode(v) { isMultiSelectMode = v; }

export { RECALC_PHASE_LABELS, allCachedImages, imageCacheCurrentPage, imageCacheItemsPerPage, imageObserver, initNovelaiUI, isMultiSelectMode, loadModelConfigIntoUI, recalcPanelDismissed, recalcStartedAt, refreshNovelaiUIFromSettings, saveModelConfigFromUI, selectedImages, updateNovelaiOtherSiteVisibility, updateNovelaiReferenceSectionsVisibility };
