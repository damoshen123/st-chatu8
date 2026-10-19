// 还原自打包产物 — 原始模块: utils/settings/llm.js
import { bindUIEvents, cacheDOMElements, loadInitialData, registerEventListeners } from "./llmUi.js";
import { registerCharDataImportListener } from "../characterGen.js";
import "./llmService.js"; // init_llmService



function initLLMSettings() {
  cacheDOMElements();
  bindUIEvents();
  registerEventListeners();
  registerCharDataImportListener();
  loadInitialData();
}

export { initLLMSettings };
