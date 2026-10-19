// 还原自打包产物 — 原始模块: utils/aiModules/index.js
import { regexModule } from "./regexModule.js";
import { mainSettingsModule } from "./mainSettingsModule.js";
import { comfyuiWorkflowModule } from "./comfyuiWorkflowModule.js";
import { sdSettingsModule } from "./sdSettingsModule.js";
import { novelaiSettingsModule } from "./novelaiSettingsModule.js";
import { comfyuiSettingsModule } from "./comfyuiSettingsModule.js";
import { bananaSettingsModule } from "./bananaSettingsModule.js";
import { llmSettingsModule } from "./llmSettingsModule.js";
import { vocabularySettingsModule } from "./vocabularySettingsModule.js";
import { charRefSettingsModule } from "./charRefSettingsModule.js";
import { themeSettingsModule } from "./themeSettingsModule.js";
import { fabSettingsModule } from "./fabSettingsModule.js";
import { imageCacheSettingsModule } from "./imageCacheSettingsModule.js";
import { settingsPageModule } from "./settingsPageModule.js";
import { aboutSettingsModule } from "./aboutSettingsModule.js";
import { logSettingsModule } from "./logSettingsModule.js";
import { troubleshootingModule } from "./troubleshootingModule.js";
import { diagnosticsModule } from "./diagnosticsModule.js";
import { installationGuideModule } from "./installationGuideModule.js";
import { promptReplacementModule } from "./promptReplacementModule.js";
import { sendDataSettingsModule } from "./sendDataSettingsModule.js";

var promptModules;

promptModules = {
      regex: regexModule,
      main_settings: mainSettingsModule,
      workflow: comfyuiWorkflowModule,
      comfyui_workflow: comfyuiWorkflowModule,
      sd_settings: sdSettingsModule,
      novelai_settings: novelaiSettingsModule,
      comfyui_settings: comfyuiSettingsModule,
      banana_settings: bananaSettingsModule,
      llm_settings: llmSettingsModule,
      vocabulary_settings: vocabularySettingsModule,
      char_ref_settings: charRefSettingsModule,
      theme_settings: themeSettingsModule,
      fab_settings: fabSettingsModule,
      image_cache_settings: imageCacheSettingsModule,
      settings_page: settingsPageModule,
      about_settings: aboutSettingsModule,
      log_settings: logSettingsModule,
      troubleshooting: troubleshootingModule,
      diagnostics: diagnosticsModule,
      installation_guide: installationGuideModule,
      prompt_replacement: promptReplacementModule,
      send_data_settings: sendDataSettingsModule
    };

function getModuleSummaries() {
  const lines = ["\u3010\u53EF\u52A0\u8F7D\u7684\u77E5\u8BC6\u6A21\u5757\u3011\uFF08\u4F7F\u7528 load_module \u6309\u9700\u83B7\u53D6\u8BE6\u7EC6\u4FE1\u606F\uFF09"];
  for (const [key, mod] of Object.entries(promptModules)) {
    lines.push(`- ${key}: ${mod.name} \u2014 ${mod.summary}`);
  }
  lines.push("");
  lines.push("\u5F53\u4F60\u9700\u8981\u64CD\u4F5C\u67D0\u4E2A\u6A21\u5757\u7684\u529F\u80FD\u65F6\uFF0C\u8BF7\u5148\u52A0\u8F7D\u5BF9\u5E94\u6A21\u5757\u83B7\u53D6\u8BE6\u7EC6\u547D\u4EE4\u548C\u77E5\u8BC6\uFF1A");
  lines.push('<SystemQuery>{"type": "load_module", "module": "\u6A21\u5757\u540D"}</SystemQuery>');
  return lines.join("\n");
}

function getModulePrompt(moduleName) {
  const mod = promptModules[moduleName];
  if (!mod) return null;
  const sections = [];
  sections.push(`===== ${mod.name} \u6A21\u5757\u8BE6\u7EC6\u77E5\u8BC6 =====`);
  sections.push("");
  if (mod.commands) {
    sections.push(mod.commands);
    sections.push("");
  }
  if (mod.knowledge) {
    sections.push(mod.knowledge);
    sections.push("");
  }
  if (mod.workflow) {
    sections.push(mod.workflow);
    sections.push("");
  }
  if (mod.errorGuide) {
    sections.push(mod.errorGuide);
    sections.push("");
  }
  sections.push(`===== ${mod.name} \u6A21\u5757\u7ED3\u675F =====`);
  return sections.join("\n");
}

function getAvailableModuleKeys() {
  return Object.keys(promptModules);
}

export { getAvailableModuleKeys, getModulePrompt, getModuleSummaries };
