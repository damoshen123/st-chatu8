// 还原自打包产物 — 原始模块: utils/settings/character/index.js
import { extension_settings } from "../../../../../../../extensions.js";
import { extensionName } from "../../config.js";
import { loadOutfitPreset, loadOutfitPresetList, setupOutfitControls } from "./outfitPreset.js";
import { loadCharacterPreset, loadCharacterPresetList, setupCharacterControls } from "./characterPreset.js";
import { defaultCharacterSettings, migrateCharacterSettings } from "../../character_config.js";
import { ensureInjectionTemplatesInit, setupInjectionTemplateControls, updateInjectionTemplateUI } from "./injectionTemplates.js";
import { loadCharacterEnablePreset, loadCharacterEnablePresetList, loadCharacterSelector, setupCharacterEnableControls } from "./characterEnable.js";
import { loadOutfitEnablePreset, loadOutfitEnablePresetList, loadOutfitEnableSelector, setupOutfitEnableControls } from "./outfitEnable.js";
import { loadCharacterCommonPreset, loadCharacterCommonPresetList, loadCharacterCommonSelector, setupCharacterCommonControls } from "./characterCommon.js";
import { loadBananaCharacterPreset, loadBananaCharacterPresetList, setupBananaCharacterControls } from "./bananaCharacter.js";
import { initTagAutocomplete } from "./tagAutocomplete.js";
import { initAllSelectSearch, refreshAllSelectSearch } from "./selectSearch.js";
import "./crypto.js"; // init_crypto

var isCharacterInitialized;

isCharacterInitialized = false;

function initCharacterSettings(container) {
  console.log("[Character] Initializing character settings...");
  ensureCharacterSettings();
  if (!isCharacterInitialized) {
    setupSubNavigation(container);
    setupCharacterControls(container);
    setupOutfitControls(container);
    setupCharacterEnableControls(container);
    setupOutfitEnableControls(container);
    setupCharacterCommonControls(container);
    setupBananaCharacterControls(container);
    setupInjectionTemplateControls(container);
    initTagAutocomplete();
    initAllSelectSearch(container);
    isCharacterInitialized = true;
  }
  console.log("[Character] Character settings initialized");
}

function refreshCharacterSettings(container) {
  console.log("[Character] Refreshing character settings...");
  ensureCharacterSettings();
  loadCharacterPresetList();
  loadCharacterPreset();
  loadOutfitPresetList();
  loadOutfitPreset();
  loadCharacterEnablePresetList();
  loadCharacterEnablePreset();
  loadCharacterSelector();
  loadOutfitEnablePresetList();
  loadOutfitEnablePreset();
  loadOutfitEnableSelector();
  loadCharacterCommonPresetList();
  loadCharacterCommonPreset();
  loadCharacterCommonSelector();
  loadBananaCharacterPresetList();
  loadBananaCharacterPreset();
  updateInjectionTemplateUI(container);
  refreshAllSelectSearch();
  resetSubNavigation(container);
  console.log("[Character] Character settings refreshed");
}

function ensureCharacterSettings() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.characterPresets) {
    settings3.characterPresets = JSON.parse(JSON.stringify(defaultCharacterSettings.characterPresets));
  }
  if (!settings3.characterPresetId) {
    settings3.characterPresetId = defaultCharacterSettings.characterPresetId;
  }
  if (!settings3.outfitPresets) {
    settings3.outfitPresets = JSON.parse(JSON.stringify(defaultCharacterSettings.outfitPresets));
  }
  if (!settings3.outfitPresetId) {
    settings3.outfitPresetId = defaultCharacterSettings.outfitPresetId;
  }
  if (!settings3.characterAI) {
    settings3.characterAI = JSON.parse(JSON.stringify(defaultCharacterSettings.characterAI));
  }
  if (!settings3.outfitAI) {
    settings3.outfitAI = JSON.parse(JSON.stringify(defaultCharacterSettings.outfitAI));
  }
  if (!settings3.characterEnablePresets) {
    settings3.characterEnablePresets = JSON.parse(JSON.stringify(defaultCharacterSettings.characterEnablePresets));
  }
  if (!settings3.characterEnablePresetId) {
    settings3.characterEnablePresetId = defaultCharacterSettings.characterEnablePresetId;
  }
  if (!settings3.outfitEnablePresets) {
    settings3.outfitEnablePresets = JSON.parse(JSON.stringify(defaultCharacterSettings.outfitEnablePresets));
  }
  if (!settings3.outfitEnablePresetId) {
    settings3.outfitEnablePresetId = defaultCharacterSettings.outfitEnablePresetId;
  }
  if (!settings3.characterCommonPresets) {
    settings3.characterCommonPresets = JSON.parse(JSON.stringify(defaultCharacterSettings.characterCommonPresets));
  }
  if (!settings3.characterCommonPresetId) {
    settings3.characterCommonPresetId = defaultCharacterSettings.characterCommonPresetId;
  }
  if (!settings3.bananaCharacterPresets) {
    settings3.bananaCharacterPresets = {
      "\u9ED8\u8BA4": {
        triggers: "\u89E6\u53D1\u8BCD1|\u89E6\u53D1\u8BCD2",
        conversation: {
          user: { text: "", image: "" },
          model: { text: "", image: "" }
        }
      }
    };
  }
  if (!settings3.bananaCharacterPresetId) {
    settings3.bananaCharacterPresetId = "\u9ED8\u8BA4";
  }
  migrateCharacterSettings(settings3);
  ensureInjectionTemplatesInit();
}

function setupSubNavigation(container) {
  const charRoot = container.find("#st-chatu8-tab-character").length ? container.find("#st-chatu8-tab-character") : container;
  charRoot.find(".st-chatu8-sub-nav-link").off("click").on("click", function(e) {
    e.preventDefault();
    const subTabId = $(this).data("sub-tab");
    charRoot.find(".st-chatu8-sub-nav-link").removeClass("active");
    $(this).addClass("active");
    charRoot.find(".st-chatu8-sub-tab-content").css("display", "none");
    charRoot.find(`#${subTabId}`).css("display", "block");
  });
  const allSubNavLinks = charRoot.find(".st-chatu8-sub-nav-link");
  const firstLink = allSubNavLinks.first();
  if (firstLink.length > 0) {
    allSubNavLinks.removeClass("active");
    firstLink.addClass("active");
    const firstSubTabId = firstLink.data("sub-tab");
    charRoot.find(".st-chatu8-sub-tab-content").css("display", "none");
    charRoot.find(`#${firstSubTabId}`).css("display", "block");
  }
}

function resetSubNavigation(container) {
  const charRoot = container.find("#st-chatu8-tab-character").length ? container.find("#st-chatu8-tab-character") : container;
  const allSubNavLinks = charRoot.find(".st-chatu8-sub-nav-link");
  const firstLink = allSubNavLinks.first();
  if (firstLink.length > 0) {
    allSubNavLinks.removeClass("active");
    firstLink.addClass("active");
    const firstSubTabId = firstLink.data("sub-tab");
    charRoot.find(".st-chatu8-sub-tab-content").css("display", "none");
    charRoot.find(`#${firstSubTabId}`).css("display", "block");
  }
}

export { initCharacterSettings, refreshCharacterSettings };
