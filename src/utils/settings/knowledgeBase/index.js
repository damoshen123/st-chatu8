// 还原自打包产物 — 原始模块: utils/settings/knowledgeBase/index.js
import { loadPersonaPresetData, loadPersonaPresetList, setupPersonaControls } from "./personaPreset.js";
import { setupPersonaGen } from "./personaGen.js";
import { loadUserPresetData, loadUserPresetList, setupUserControls } from "./userPreset.js";
import "./personaService.js"; // init_personaService
import "./userService.js"; // init_userService

var _initialized, _userInitialized;

_initialized = false;

_userInitialized = false;

function initPersonaSettings(container) {
  if (_initialized) return;
  _initialized = true;
  setupPersonaControls(container);
  setupPersonaGen();
  console.log("[KnowledgeBase/Persona] \u4EBA\u8BBE\u6A21\u5757\u5DF2\u521D\u59CB\u5316");
}

function refreshPersonaSettings() {
  if (!_initialized) return;
  loadPersonaPresetList();
  loadPersonaPresetData();
}

function initUserSettings(container) {
  if (_userInitialized) return;
  _userInitialized = true;
  setupUserControls(container);
  console.log("[KnowledgeBase/User] User\u4EBA\u8BBE\u6A21\u5757\u5DF2\u521D\u59CB\u5316");
}

function refreshUserSettings() {
  if (!_userInitialized) return;
  loadUserPresetList();
  loadUserPresetData();
}

export { initPersonaSettings, initUserSettings, refreshPersonaSettings, refreshUserSettings };
