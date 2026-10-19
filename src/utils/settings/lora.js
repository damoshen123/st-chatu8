// 还原自打包产物 — 原始模块: utils/settings/lora.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import "../ui_common.js"; // init_ui_common

function ComfyuiaddLORA() {
  const activeTab = $(".st-chatu8-tab-content.active");
  const fixedPrompt = activeTab.find("#fixedPrompt_comfyui");
  const loraSelect = document.getElementById("ComfyuiLORA");
  if (!loraSelect.value || loraSelect.value.trim() === "" || loraSelect.disabled) {
    if (extension_settings[extensionName].client == "jiuguan") {
      alert("\u62B1\u6B49\u9152\u9986\u5BA2\u6237\u7AEF\u65E0\u6CD5\u652F\u6301lora\u83B7\u53D6,\u8BF7\u53C2\u8003\u6587\u6863\u5C1D\u8BD5\u4F7F\u7528\u6D4F\u89C8\u5668\u5BA2\u6237\u7AEF");
    } else {
      alert("\u8BF7\u5148\u8FDE\u63A5ComfyUI\u83B7\u53D6lora");
    }
    return;
  }
  const currentVal = fixedPrompt.val();
  const separator = currentVal.trim() === "" ? "" : ", ";
  fixedPrompt.val(currentVal + separator + `<lora:${loraSelect.value}:1>`);
  fixedPrompt.trigger("input");
}

function sd_add_lora() {
  const activeTab = $(".st-chatu8-tab-content.active");
  const fixedPrompt = activeTab.find("#fixedPrompt");
  const loraSelect = document.getElementById("sd_cchatu_8_lora");
  if (!loraSelect.value || loraSelect.value.trim() === "" || loraSelect.disabled) {
    if (extension_settings[extensionName].client == "jiuguan") {
      alert("\u62B1\u6B49\u9152\u9986\u5BA2\u6237\u7AEF\u65E0\u6CD5\u652F\u6301lora\u83B7\u53D6,\u8BF7\u53C2\u8003\u6587\u6863\u5C1D\u8BD5\u4F7F\u7528\u6D4F\u89C8\u5668\u5BA2\u6237\u7AEF");
    } else {
      alert("\u8BF7\u5148\u8FDE\u63A5SD\u83B7\u53D6lora");
    }
    return;
  }
  const currentVal = fixedPrompt.val();
  const separator = currentVal.trim() === "" ? "" : ", ";
  fixedPrompt.val(currentVal + separator + `<lora:${loraSelect.value}:1>`);
  fixedPrompt.trigger("input");
}

function initLoraControls(settingsModal) {
  settingsModal.find("#ComfyuiaddLORA").on("click", ComfyuiaddLORA);
  settingsModal.find("#sd_add_lora").on("click", sd_add_lora);
}

export { initLoraControls };
