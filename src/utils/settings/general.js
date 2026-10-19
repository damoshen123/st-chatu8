// 还原自打包产物 — 原始模块: utils/settings/general.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { defaultSettings, extensionName } from "../config.js";
import { stylishConfirm } from "../ui_common.js";
import { initJiuguanStorage } from "../database.js";

function onRestoreDefaultSettingsClick() {
  stylishConfirm("\u4F60\u786E\u5B9A\u8981\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\u5417\uFF1F\u63D0\u793A\u8BCD\u9884\u8BBE\u548C\u5DE5\u4F5C\u6D41\u4F1A\u6D88\u5931\u54E6\uFF01\u8BF7\u63D0\u524D\u5907\u4EFD\uFF01").then((result) => {
    if (result) {
      stylishConfirm("\u4F60\u771F\u7684\u786E\u5B9A\u5417\uFF1F").then(async (result2) => {
        if (result2) {
          const defaults = JSON.parse(JSON.stringify(defaultSettings));
          const settings3 = extension_settings[extensionName];
          Object.keys(settings3).forEach((key) => {
            delete settings3[key];
          });
          Object.assign(settings3, defaults);
          saveSettingsDebounced();
          try {
            await initJiuguanStorage();
            console.log("[Settings] \u5DF2\u4ECE\u9690\u5199\u56FE\u7247\u91CD\u65B0\u52A0\u8F7D\u56FE\u7247\u7F13\u5B58");
          } catch (error) {
            console.error("[Settings] \u91CD\u65B0\u52A0\u8F7D\u56FE\u7247\u7F13\u5B58\u5931\u8D25:", error);
          }
          window.loadSilterTavernChatu8Settings();
          alert("\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\u3002");
        }
      });
    }
  });
}

function onExportSettingsClick() {
  const settingsString = JSON.stringify(extension_settings[extensionName], null, 4);
  const blob = new Blob([settingsString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${extensionName}_settings.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("\u8BBE\u7F6E\u5DF2\u5BFC\u51FA\u3002");
}

function onImportSettingsClick() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          Object.assign(extension_settings[extensionName], importedSettings);
          saveSettingsDebounced();
          try {
            await initJiuguanStorage();
            console.log("[Settings] \u5DF2\u4ECE\u9690\u5199\u56FE\u7247\u91CD\u65B0\u52A0\u8F7D\u56FE\u7247\u7F13\u5B58");
          } catch (error) {
            console.error("[Settings] \u91CD\u65B0\u52A0\u8F7D\u56FE\u7247\u7F13\u5B58\u5931\u8D25:", error);
          }
          window.loadSilterTavernChatu8Settings();
          alert("\u8BBE\u7F6E\u5DF2\u5BFC\u5165\u3002");
        } catch (error) {
          alert("\u5BFC\u5165\u8BBE\u7F6E\u5931\u8D25\uFF0C\u6587\u4EF6\u683C\u5F0F\u65E0\u6548\u3002");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function initGeneralSettings(settingsModal) {
  settingsModal.find("#ch-restore-settings").on("click", onRestoreDefaultSettingsClick);
  settingsModal.find("#ch-export-settings").on("click", onExportSettingsClick);
  settingsModal.find("#ch-import-settings").on("click", onImportSettingsClick);
}

export { initGeneralSettings };
