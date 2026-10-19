// 还原自打包产物 — 原始模块: utils/configHelper/configUIRefresh.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { configDatabase_exports } from "../utils.js";



async function refreshAffectedUI(changedSettings) {
  try {
    const settings3 = extension_settings[extensionName];
    if (changedSettings.workers || changedSettings.workerid || changedSettings.editWorkerid) {
      refreshWorkflowSelectors(settings3);
    }
    if (changedSettings.yushe || changedSettings.yusheid_sd || changedSettings.yusheid_novelai || changedSettings.yusheid_comfyui) {
      refreshPromptPresetSelectors(settings3);
    }
    if (changedSettings.prompt_replace || changedSettings.prompt_replace_id) {
      refreshPromptReplaceSelectors(settings3);
    }
    if (changedSettings.regex_profiles || changedSettings.current_regex_profile) {
      refreshRegexProfileSelector(settings3);
    }
    if (changedSettings.themes || changedSettings.theme_id) {
      refreshThemeSelector(settings3);
    }
    if (changedSettings.worldBookList || changedSettings.worldBookList_id) {
      refreshWorldBookSelector(settings3);
    }
    if (changedSettings.vibePresets || changedSettings.vibePresetId) {
      refreshVibePresetSelector(settings3);
    }
    if (changedSettings.bananaCharacterPresets || changedSettings.bananaCharacterPresetId) {
      refreshBananaCharacterPresetSelector(settings3);
    }
    if (changedSettings.novelai_profiles || changedSettings.novelai_profile_id) {
      refreshNovelaiProfileSelector(settings3);
    }
    if (changedSettings.comfyui_profiles || changedSettings.comfyui_profile_id) {
      refreshComfyuiProfileSelector(settings3);
    }
    if (changedSettings.runninghub_profiles || changedSettings.runninghub_profile_id) {
      refreshRunninghubProfileSelector(settings3);
    }
    if (changedSettings.llm_profiles || changedSettings.current_llm_profile) {
      refreshLlmProfileSelector(settings3);
      refreshRequestTypeApiSelects(settings3);
    }
    if (changedSettings.test_context_profiles || changedSettings.current_test_context_profile) {
      refreshTestContextSelector(settings3);
      refreshRequestTypeContextSelects(settings3);
    }
    if (changedSettings.llm_request_type_configs) {
      refreshRequestTypeApiSelects(settings3);
      refreshRequestTypeContextSelects(settings3);
    }
    if (changedSettings.translation_model) {
      refreshTranslationModelSelector(settings3);
    }
    if (changedSettings.sdCache) {
      await refreshSdCacheSelectors(settings3);
    }
    if (changedSettings.comfyuiCache) {
      await refreshComfyuiCacheSelectors(settings3);
    }
    if (changedSettings.characterPresets || changedSettings.character_preset_id) {
      refreshCharacterPresetSelectors(settings3);
    }
    if (changedSettings.outfitPresets || changedSettings.outfit_preset_id) {
      refreshOutfitPresetSelectors(settings3);
    }
    if (changedSettings.characterEnablePresets || changedSettings.character_enable_preset_id) {
      refreshCharacterEnablePresetSelector(settings3);
    }
    if (changedSettings.outfitEnablePresets || changedSettings.outfit_enable_preset_id) {
      refreshOutfitEnablePresetSelector(settings3);
    }
    if (changedSettings.characterCommonPresets || changedSettings.character_common_preset_id) {
      refreshCharacterCommonPresetSelector(settings3);
    }
    if (changedSettings.banana?.conversationPresets || changedSettings.banana?.conversationPresetId) {
      refreshBananaConversationPresetSelector(settings3);
    }
    if (changedSettings.fabThemes || changedSettings.chatu8_fab_theme) {
      refreshFabThemeSelector(settings3);
    }
    refreshInputFields(changedSettings, settings3);
    console.log("[AI Config Helper] UI \u5DF2\u667A\u80FD\u5237\u65B0");
  } catch (error) {
    console.error("[AI Config Helper] UI \u5237\u65B0\u5931\u8D25:", error);
  }
}

function refreshRequestTypeApiSelects(settings3) {
  if (!settings3.llm_profiles) return;
  const requestTypes = ["image_gen", "char_design", "char_display", "char_modify", "translation", "tag_modify", "visual_mat_prep", "video_gen", "video_asset_gen"];
  const profileNames = Object.keys(settings3.llm_profiles);
  requestTypes.forEach((type) => {
    const selectId = `ch-llm_${type}_api_select`;
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = "";
    profileNames.forEach((name) => {
      const option = new Option(name, name);
      option.title = name;
      select.add(option);
    });
    const savedValue = settings3.llm_request_type_configs?.[type]?.api_profile;
    if (savedValue && profileNames.includes(savedValue)) {
      select.value = savedValue;
    } else if (profileNames.includes(currentValue)) {
      select.value = currentValue;
    } else if (profileNames.length > 0) {
      select.value = profileNames[0];
    }
  });
  console.log("[AI Config Helper] \u8BF7\u6C42\u7C7B\u578B API \u914D\u7F6E\u4E0B\u62C9\u6846\u5DF2\u5237\u65B0");
}

function refreshRequestTypeContextSelects(settings3) {
  if (!settings3.test_context_profiles) return;
  const requestTypes = ["image_gen", "char_design", "char_display", "char_modify", "translation", "tag_modify", "visual_mat_prep", "video_gen", "video_asset_gen"];
  const contextNames = Object.keys(settings3.test_context_profiles);
  requestTypes.forEach((type) => {
    const selectId = `ch-llm_${type}_context_select`;
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = "";
    contextNames.forEach((name) => {
      const option = new Option(name, name);
      option.title = name;
      select.add(option);
    });
    const savedValue = settings3.llm_request_type_configs?.[type]?.context_preset;
    if (savedValue && contextNames.includes(savedValue)) {
      select.value = savedValue;
    } else if (contextNames.includes(currentValue)) {
      select.value = currentValue;
    } else if (contextNames.length > 0) {
      select.value = contextNames[0];
    }
  });
  console.log("[AI Config Helper] \u8BF7\u6C42\u7C7B\u578B\u4E0A\u4E0B\u6587\u9884\u8BBE\u4E0B\u62C9\u6846\u5DF2\u5237\u65B0");
}

function refreshWorkflowSelectors(settings3) {
  if (!settings3) return;
  const updateWorkerSelectGroup = ({ selectId, textareaId, wfIdInputId, storage, idKey, contentKey, wfIdMapKey }) => {
    const selectEl = document.getElementById(selectId);
    const textareaEl = textareaId ? document.getElementById(textareaId) : null;
    const wfInputEl = wfIdInputId ? document.getElementById(wfIdInputId) : null;
    if (!selectEl || !storage) return;
    const presetNames = Object.keys(storage);
    const prevValue = selectEl.value;
    selectEl.innerHTML = "";
    for (const name of presetNames) {
      const opt = new Option(name, name);
      opt.title = name;
      selectEl.add(opt);
    }
    let targetId = "";
    if (prevValue && storage[prevValue]) {
      targetId = prevValue;
    } else if (idKey && settings3[idKey] && storage[settings3[idKey]]) {
      targetId = settings3[idKey];
    } else if (presetNames.length > 0) {
      targetId = presetNames[0];
    }
    if (targetId) {
      selectEl.value = targetId;
      if (idKey) settings3[idKey] = targetId;
      const jsonStr = storage[targetId] || "";
      if (contentKey) settings3[contentKey] = jsonStr;
      if (textareaEl) {
        textareaEl.value = jsonStr;
        try {
          textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
        } catch (_e) {
        }
      }
      if (wfInputEl && wfIdMapKey && settings3[wfIdMapKey]) {
        const boundWfId = settings3[wfIdMapKey][targetId] || "";
        wfInputEl.value = boundWfId;
      }
    }
  };
  if (settings3.workers) {
    updateWorkerSelectGroup({
      selectId: "workerid",
      textareaId: "worker",
      storage: settings3.workers,
      idKey: "workerid",
      contentKey: "worker"
    });
    updateWorkerSelectGroup({
      selectId: "editWorkerid",
      textareaId: "editWorker",
      storage: settings3.workers,
      idKey: "editWorkerid",
      contentKey: "editWorker"
    });
  }
  const comfyVideoStorage = settings3.comfyui_video_workers || settings3.workers;
  if (comfyVideoStorage) {
    updateWorkerSelectGroup({
      selectId: "comfyui_img2vid_workerid",
      textareaId: "comfyui_img2vid_worker",
      storage: comfyVideoStorage,
      idKey: "comfyui_img2vid_workerid",
      contentKey: "comfyui_img2vid_worker"
    });
    updateWorkerSelectGroup({
      selectId: "comfyui_ref2vid_workerid",
      textareaId: "comfyui_ref2vid_worker",
      storage: comfyVideoStorage,
      idKey: "comfyui_ref2vid_workerid",
      contentKey: "comfyui_ref2vid_worker"
    });
  }
  if (settings3.runninghub_workers) {
    updateWorkerSelectGroup({
      selectId: "runninghub_workerid",
      textareaId: "runninghub_worker",
      wfIdInputId: "runninghub_workflowId",
      storage: settings3.runninghub_workers,
      idKey: "runninghub_workerid",
      contentKey: "runninghub_worker",
      wfIdMapKey: "runninghub_workflow_ids"
    });
    updateWorkerSelectGroup({
      selectId: "runninghub_img2vid_workerid",
      textareaId: "runninghub_img2vid_worker",
      wfIdInputId: "runninghub_img2vid_workflowId",
      storage: settings3.runninghub_workers,
      idKey: "runninghub_img2vid_workerid",
      contentKey: "runninghub_img2vid_worker",
      wfIdMapKey: "runninghub_workflow_ids"
    });
    updateWorkerSelectGroup({
      selectId: "runninghub_ref2vid_workerid",
      textareaId: "runninghub_ref2vid_worker",
      wfIdInputId: "runninghub_ref2vid_workflowId",
      storage: settings3.runninghub_workers,
      idKey: "runninghub_ref2vid_workerid",
      contentKey: "runninghub_ref2vid_worker",
      wfIdMapKey: "runninghub_workflow_ids"
    });
  }
  console.log("[AI Config Helper] ComfyUI \u4E0E RunningHub \u5DE5\u4F5C\u6D41\u9009\u62E9\u5668\u53CA JSON \u6587\u672C\u6846\u5DF2\u5168\u9762\u5237\u65B0");
}

function refreshPromptPresetSelectors(settings3) {
  if (!settings3.yushe) return;
  const modes = [
    { id: "yusheid", key: "yusheid_sd" },
    { id: "yusheid_novelai", key: "yusheid_novelai" },
    { id: "yusheid_comfyui", key: "yusheid_comfyui" }
  ];
  modes.forEach(({ id, key }) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = "";
    for (const presetName in settings3.yushe) {
      const option = new Option(presetName, presetName);
      option.title = presetName;
      select.add(option);
    }
    const savedValue = settings3[key];
    if (savedValue && settings3.yushe[savedValue]) {
      select.value = savedValue;
    } else if (settings3.yushe[currentValue]) {
      select.value = currentValue;
    }
  });
  console.log("[AI Config Helper] \u63D0\u793A\u8BCD\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshPromptReplaceSelectors(settings3) {
  if (!settings3.prompt_replace) return;
  const selectors = [
    { id: "prompt_replace_id", key: "prompt_replace_id" },
    { id: "prompt_replace_id_novelai", key: "prompt_replace_id" },
    { id: "prompt_replace_id_comfyui", key: "prompt_replace_id" }
  ];
  selectors.forEach(({ id, key }) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = "";
    for (const replaceName in settings3.prompt_replace) {
      const option = new Option(replaceName, replaceName);
      option.title = replaceName;
      select.add(option);
    }
    const savedValue = settings3[key];
    if (savedValue && settings3.prompt_replace[savedValue]) {
      select.value = savedValue;
    } else if (settings3.prompt_replace[currentValue]) {
      select.value = currentValue;
    }
  });
  console.log("[AI Config Helper] \u63D0\u793A\u8BCD\u66FF\u6362\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshRegexProfileSelector(settings3) {
  if (!settings3.regex_profiles) return;
  const select = document.getElementById("ch-regex-profile-select");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const profileName in settings3.regex_profiles) {
    const option = new Option(profileName, profileName);
    option.title = profileName;
    select.add(option);
  }
  if (settings3.regex_profiles[currentValue]) {
    select.value = currentValue;
  } else if (settings3.current_regex_profile && settings3.regex_profiles[settings3.current_regex_profile]) {
    select.value = settings3.current_regex_profile;
  }
  console.log("[AI Config Helper] \u6B63\u5219\u914D\u7F6E\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshThemeSelector(settings3) {
  if (!settings3.themes) return;
  const select = document.getElementById("theme_id");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const themeName in settings3.themes) {
    const option = new Option(themeName, themeName);
    option.title = themeName;
    select.add(option);
  }
  if (settings3.themes[currentValue]) {
    select.value = currentValue;
  } else if (settings3.theme_id && settings3.themes[settings3.theme_id]) {
    select.value = settings3.theme_id;
  }
  console.log("[AI Config Helper] \u4E3B\u9898\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshWorldBookSelector(settings3) {
  if (!settings3.worldBookList) return;
  const select = document.getElementById("worldBookList_id");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const bookName in settings3.worldBookList) {
    const option = new Option(bookName, bookName);
    option.title = bookName;
    select.add(option);
  }
  if (settings3.worldBookList[currentValue]) {
    select.value = currentValue;
  } else if (settings3.worldBookList_id && settings3.worldBookList[settings3.worldBookList_id]) {
    select.value = settings3.worldBookList_id;
  }
  console.log("[AI Config Helper] \u4E16\u754C\u4E66\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshVibePresetSelector(settings3) {
  if (!settings3.vibePresets) return;
  const select = document.getElementById("vibePresetId");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const presetName in settings3.vibePresets) {
    const option = new Option(presetName, presetName);
    option.title = presetName;
    select.add(option);
  }
  if (settings3.vibePresets[currentValue]) {
    select.value = currentValue;
  } else if (settings3.vibePresetId && settings3.vibePresets[settings3.vibePresetId]) {
    select.value = settings3.vibePresetId;
  }
  console.log("[AI Config Helper] Vibe \u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshBananaCharacterPresetSelector(settings3) {
  if (!settings3.bananaCharacterPresets) return;
  const select = document.getElementById("bananaCharacterPresetId");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const presetName in settings3.bananaCharacterPresets) {
    const option = new Option(presetName, presetName);
    option.title = presetName;
    select.add(option);
  }
  if (settings3.bananaCharacterPresets[currentValue]) {
    select.value = currentValue;
  } else if (settings3.bananaCharacterPresetId && settings3.bananaCharacterPresets[settings3.bananaCharacterPresetId]) {
    select.value = settings3.bananaCharacterPresetId;
  }
  console.log("[AI Config Helper] Banana \u89D2\u8272\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshNovelaiProfileSelector(settings3) {
  if (!settings3.novelai_profiles) return;
  const select = document.getElementById("novelai_profile_id");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const profileName in settings3.novelai_profiles) {
    const option = new Option(profileName, profileName);
    option.title = profileName;
    select.add(option);
  }
  if (settings3.novelai_profiles[currentValue]) {
    select.value = currentValue;
  } else if (settings3.novelai_profile_id && settings3.novelai_profiles[settings3.novelai_profile_id]) {
    select.value = settings3.novelai_profile_id;
  }
  console.log("[AI Config Helper] NovelAI \u914D\u7F6E\u6863\u6848\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshComfyuiProfileSelector(settings3) {
  if (!settings3.comfyui_profiles) return;
  const select = document.getElementById("comfyui_profile_id");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const profileName in settings3.comfyui_profiles) {
    const option = new Option(profileName, profileName);
    option.title = profileName;
    select.add(option);
  }
  if (settings3.comfyui_profiles[currentValue]) {
    select.value = currentValue;
  } else if (settings3.comfyui_profile_id && settings3.comfyui_profiles[settings3.comfyui_profile_id]) {
    select.value = settings3.comfyui_profile_id;
  }
  console.log("[AI Config Helper] ComfyUI \u914D\u7F6E\u6863\u6848\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshRunninghubProfileSelector(settings3) {
  if (!settings3.runninghub_profiles) return;
  const select = document.getElementById("runninghub_profile_id");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const profileName in settings3.runninghub_profiles) {
    const option = new Option(profileName, profileName);
    option.title = profileName;
    select.add(option);
  }
  if (settings3.runninghub_profiles[currentValue]) {
    select.value = currentValue;
  } else if (settings3.runninghub_profile_id && settings3.runninghub_profiles[settings3.runninghub_profile_id]) {
    select.value = settings3.runninghub_profile_id;
  }
  console.log("[AI Config Helper] RunningHub \u914D\u7F6E\u6863\u6848\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshLlmProfileSelector(settings3) {
  if (!settings3.llm_profiles) return;
  const select = document.getElementById("ch-llm_profile_select");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const profileName in settings3.llm_profiles) {
    const option = new Option(profileName, profileName);
    option.title = profileName;
    select.add(option);
  }
  if (settings3.llm_profiles[currentValue]) {
    select.value = currentValue;
  } else if (settings3.current_llm_profile && settings3.llm_profiles[settings3.current_llm_profile]) {
    select.value = settings3.current_llm_profile;
  }
  console.log("[AI Config Helper] LLM \u914D\u7F6E\u6863\u6848\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshTestContextSelector(settings3) {
  if (!settings3.test_context_profiles) return;
  const select = document.getElementById("ch-test_context_select");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const contextName in settings3.test_context_profiles) {
    const option = new Option(contextName, contextName);
    option.title = contextName;
    select.add(option);
  }
  if (settings3.test_context_profiles[currentValue]) {
    select.value = currentValue;
  } else if (settings3.current_test_context_profile && settings3.test_context_profiles[settings3.current_test_context_profile]) {
    select.value = settings3.current_test_context_profile;
  }
  console.log("[AI Config Helper] \u4E0A\u4E0B\u6587\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshTranslationModelSelector(settings3) {
  if (!settings3.llm_profiles) return;
  const select = document.getElementById("translation_model");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  for (const profileName in settings3.llm_profiles) {
    const option = new Option(profileName, profileName);
    option.title = profileName;
    select.add(option);
  }
  if (settings3.llm_profiles[currentValue]) {
    select.value = currentValue;
  } else if (settings3.translation_model && settings3.llm_profiles[settings3.translation_model]) {
    select.value = settings3.translation_model;
  }
  console.log("[AI Config Helper] \u7FFB\u8BD1\u6A21\u578B\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function toStr(item) {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) return item.value || item.name || item.text || String(item);
  return String(item);
}

async function refreshSdCacheSelectors(settings3) {
  const { getFullSdCache: getFullSdCache2 } = await import("../configDatabase.js");
  const cache = await getFullSdCache2();
  if (!cache || Object.keys(cache).length === 0) return;
  if (cache.models) {
    const modelSelect2 = document.getElementById("sd_cchatu_8_model");
    if (modelSelect2) {
      const currentValue = modelSelect2.value;
      modelSelect2.innerHTML = "";
      const modelStrs = cache.models.map(toStr);
      modelStrs.forEach((model) => modelSelect2.add(new Option(model, model)));
      if (modelStrs.includes(currentValue)) {
        modelSelect2.value = currentValue;
      } else if (settings3.sd_cchatu_8_model && modelStrs.includes(settings3.sd_cchatu_8_model)) {
        modelSelect2.value = settings3.sd_cchatu_8_model;
      }
    }
  }
  if (cache.vaes) {
    const vaeSelect = document.getElementById("sd_cchatu_8_vae");
    if (vaeSelect) {
      const currentValue = vaeSelect.value;
      vaeSelect.innerHTML = "";
      const vaeStrs = cache.vaes.map(toStr);
      vaeStrs.forEach((vae) => vaeSelect.add(new Option(vae, vae)));
      if (vaeStrs.includes(currentValue)) {
        vaeSelect.value = currentValue;
      } else if (settings3.sd_cchatu_8_vae && vaeStrs.includes(settings3.sd_cchatu_8_vae)) {
        vaeSelect.value = settings3.sd_cchatu_8_vae;
      }
    }
  }
  if (cache.samplers) {
    const samplerSelect = document.getElementById("sd_cchatu_8_samplerName");
    if (samplerSelect) {
      const currentValue = samplerSelect.value;
      samplerSelect.innerHTML = "";
      const samplerStrs = cache.samplers.map(toStr);
      samplerStrs.forEach((sampler) => samplerSelect.add(new Option(sampler, sampler)));
      if (samplerStrs.includes(currentValue)) {
        samplerSelect.value = currentValue;
      } else if (settings3.sd_cchatu_8_samplerName && samplerStrs.includes(settings3.sd_cchatu_8_samplerName)) {
        samplerSelect.value = settings3.sd_cchatu_8_samplerName;
      }
    }
  }
  if (cache.schedulers) {
    const schedulerSelect = document.getElementById("sd_cchatu_8_scheduler");
    if (schedulerSelect) {
      const currentValue = schedulerSelect.value;
      schedulerSelect.innerHTML = "";
      const schedulerStrs = cache.schedulers.map(toStr);
      schedulerStrs.forEach((scheduler) => schedulerSelect.add(new Option(scheduler, scheduler)));
      if (schedulerStrs.includes(currentValue)) {
        schedulerSelect.value = currentValue;
      } else if (settings3.sd_cchatu_8_scheduler && schedulerStrs.includes(settings3.sd_cchatu_8_scheduler)) {
        schedulerSelect.value = settings3.sd_cchatu_8_scheduler;
      }
    }
  }
  if (cache.upscalers) {
    const upscalerSelect = document.getElementById("sd_cchatu_8_upscaler");
    if (upscalerSelect) {
      const currentValue = upscalerSelect.value;
      upscalerSelect.innerHTML = "";
      const upscalerStrs = cache.upscalers.map(toStr);
      upscalerStrs.forEach((upscaler) => upscalerSelect.add(new Option(upscaler, upscaler)));
      if (upscalerStrs.includes(currentValue)) {
        upscalerSelect.value = currentValue;
      } else if (settings3.sd_cchatu_8_upscaler && upscalerStrs.includes(settings3.sd_cchatu_8_upscaler)) {
        upscalerSelect.value = settings3.sd_cchatu_8_upscaler;
      }
    }
  }
  if (cache.loras) {
    const loraSelect = document.getElementById("sd_cchatu_8_lora");
    if (loraSelect) {
      const currentValue = loraSelect.value;
      loraSelect.innerHTML = "";
      const loraStrs = cache.loras.map(toStr);
      loraStrs.forEach((lora) => loraSelect.add(new Option(lora, lora)));
      if (loraStrs.includes(currentValue)) {
        loraSelect.value = currentValue;
      }
    }
  }
  console.log("[AI Config Helper] SD \u7F13\u5B58\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function normalizeBackslashPath2(value) {
  return value == null ? "" : String(value).trim().replace(/\\{2,}/g, "\\");
}

async function refreshComfyuiCacheSelectors(settings3) {
  const { getFullComfyuiCache: getFullComfyuiCache2 } = await import("../configDatabase.js");
  const cache = await getFullComfyuiCache2();
  if (!cache || Object.keys(cache).length === 0) return;
  if (cache.models) {
    const modelSelect2 = document.getElementById("MODEL_NAME");
    if (modelSelect2) {
      const currentValue = normalizeBackslashPath2(modelSelect2.value);
      modelSelect2.innerHTML = "";
      cache.models.forEach((model) => {
        const text = typeof model === "object" && model !== null ? model.text || model.value || String(model) : String(model);
        const value = normalizeBackslashPath2(typeof model === "object" && model !== null ? model.value || String(model) : String(model));
        const opt = new Option(text, value);
        opt.title = text;
        modelSelect2.add(opt);
      });
      const modelValues = Array.from(modelSelect2.options).map((o) => o.value);
      if (modelValues.includes(currentValue)) {
        modelSelect2.value = currentValue;
      } else if (settings3.MODEL_NAME && modelValues.includes(normalizeBackslashPath2(settings3.MODEL_NAME))) {
        modelSelect2.value = normalizeBackslashPath2(settings3.MODEL_NAME);
      }
    }
  }
  if (cache.samplers) {
    const samplerSelect = document.getElementById("comfyuisamplerName");
    if (samplerSelect) {
      const currentValue = samplerSelect.value;
      samplerSelect.innerHTML = "";
      const samplerStrs = cache.samplers.map(toStr);
      samplerStrs.forEach((sampler) => samplerSelect.add(new Option(sampler, sampler)));
      if (samplerStrs.includes(currentValue)) {
        samplerSelect.value = currentValue;
      } else if (settings3.comfyuisamplerName && samplerStrs.includes(settings3.comfyuisamplerName)) {
        samplerSelect.value = settings3.comfyuisamplerName;
      }
    }
  }
  if (cache.vaes) {
    const vaeSelect = document.getElementById("comfyui_vae");
    if (vaeSelect) {
      const currentValue = vaeSelect.value;
      vaeSelect.innerHTML = "";
      const vaeStrs = cache.vaes.map(toStr);
      vaeStrs.forEach((vae) => vaeSelect.add(new Option(vae, vae)));
      if (vaeStrs.includes(currentValue)) {
        vaeSelect.value = currentValue;
      } else if (settings3.comfyui_vae && vaeStrs.includes(settings3.comfyui_vae)) {
        vaeSelect.value = settings3.comfyui_vae;
      }
    }
  }
  if (cache.schedulers) {
    const schedulerSelect = document.getElementById("comfyui_scheduler");
    if (schedulerSelect) {
      const currentValue = schedulerSelect.value;
      schedulerSelect.innerHTML = "";
      const schedulerStrs = cache.schedulers.map(toStr);
      schedulerStrs.forEach((scheduler) => schedulerSelect.add(new Option(scheduler, scheduler)));
      if (schedulerStrs.includes(currentValue)) {
        schedulerSelect.value = currentValue;
      } else if (settings3.comfyui_scheduler && schedulerStrs.includes(settings3.comfyui_scheduler)) {
        schedulerSelect.value = settings3.comfyui_scheduler;
      }
    }
  }
  if (cache.clips) {
    const clipSelect = document.getElementById("comfyuiCLIPName");
    if (clipSelect) {
      const currentValue = clipSelect.value;
      clipSelect.innerHTML = "";
      const clipStrs = cache.clips.map(toStr);
      clipStrs.forEach((clip) => clipSelect.add(new Option(clip, clip)));
      if (clipStrs.includes(currentValue)) {
        clipSelect.value = currentValue;
      } else if (settings3.comfyuiCLIPName && clipStrs.includes(settings3.comfyuiCLIPName)) {
        clipSelect.value = settings3.comfyuiCLIPName;
      }
    }
  }
  if (cache.loras) {
    const loraSelect = document.getElementById("ComfyuiLORA");
    if (loraSelect) {
      const currentValue = loraSelect.value;
      loraSelect.innerHTML = "";
      const loraStrs = cache.loras.map(toStr);
      loraStrs.forEach((lora) => loraSelect.add(new Option(lora, lora)));
      if (loraStrs.includes(currentValue)) {
        loraSelect.value = currentValue;
      }
    }
  }
  console.log("[AI Config Helper] ComfyUI \u7F13\u5B58\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshCharacterPresetSelectors(settings3) {
  if (!settings3.characterPresets) return;
  const select = document.getElementById("character_preset_id");
  if (select) {
    const currentValue = select.value;
    select.innerHTML = "";
    for (const name in settings3.characterPresets) {
      select.add(new Option(name, name));
    }
    if (settings3.characterPresets[currentValue]) {
      select.value = currentValue;
    } else if (settings3.character_preset_id && settings3.characterPresets[settings3.character_preset_id]) {
      select.value = settings3.character_preset_id;
    }
  }
  console.log("[AI Config Helper] \u89D2\u8272\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshOutfitPresetSelectors(settings3) {
  if (!settings3.outfitPresets) return;
  const select = document.getElementById("outfit_preset_id");
  if (select) {
    const currentValue = select.value;
    select.innerHTML = "";
    for (const name in settings3.outfitPresets) {
      select.add(new Option(name, name));
    }
    if (settings3.outfitPresets[currentValue]) {
      select.value = currentValue;
    } else if (settings3.outfit_preset_id && settings3.outfitPresets[settings3.outfit_preset_id]) {
      select.value = settings3.outfit_preset_id;
    }
  }
  console.log("[AI Config Helper] \u670D\u88C5\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshCharacterEnablePresetSelector(settings3) {
  if (!settings3.characterEnablePresets) return;
  const select = document.getElementById("character_enable_preset_id");
  if (select) {
    const currentValue = select.value;
    select.innerHTML = "";
    for (const name in settings3.characterEnablePresets) select.add(new Option(name, name));
    if (settings3.characterEnablePresets[currentValue]) {
      select.value = currentValue;
    } else if (settings3.character_enable_preset_id && settings3.characterEnablePresets[settings3.character_enable_preset_id]) {
      select.value = settings3.character_enable_preset_id;
    }
  }
  console.log("[AI Config Helper] \u89D2\u8272\u542F\u7528\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshOutfitEnablePresetSelector(settings3) {
  if (!settings3.outfitEnablePresets) return;
  const select = document.getElementById("outfit_enable_preset_id");
  if (select) {
    const currentValue = select.value;
    select.innerHTML = "";
    for (const name in settings3.outfitEnablePresets) select.add(new Option(name, name));
    if (settings3.outfitEnablePresets[currentValue]) {
      select.value = currentValue;
    } else if (settings3.outfit_enable_preset_id && settings3.outfitEnablePresets[settings3.outfit_enable_preset_id]) {
      select.value = settings3.outfit_enable_preset_id;
    }
  }
  console.log("[AI Config Helper] \u670D\u88C5\u542F\u7528\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshCharacterCommonPresetSelector(settings3) {
  if (!settings3.characterCommonPresets) return;
  const select = document.getElementById("character_common_preset_id");
  if (select) {
    const currentValue = select.value;
    select.innerHTML = "";
    for (const name in settings3.characterCommonPresets) select.add(new Option(name, name));
    if (settings3.characterCommonPresets[currentValue]) {
      select.value = currentValue;
    } else if (settings3.character_common_preset_id && settings3.characterCommonPresets[settings3.character_common_preset_id]) {
      select.value = settings3.character_common_preset_id;
    }
  }
  console.log("[AI Config Helper] \u901A\u7528\u89D2\u8272\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshBananaConversationPresetSelector(settings3) {
  if (!settings3.banana?.conversationPresets) return;
  const select = document.getElementById("st-chatu8-banana-conversation-preset-id");
  if (select) {
    const currentValue = select.value;
    select.innerHTML = "";
    for (const name in settings3.banana.conversationPresets) {
      select.add(new Option(name, name));
    }
    if (settings3.banana.conversationPresets[currentValue]) {
      select.value = currentValue;
    } else if (settings3.banana.conversationPresetId && settings3.banana.conversationPresets[settings3.banana.conversationPresetId]) {
      select.value = settings3.banana.conversationPresetId;
    }
  }
  console.log("[AI Config Helper] Banana \u5BF9\u8BDD\u9884\u8BBE\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshFabThemeSelector(settings3) {
  if (!settings3.fabThemes) return;
  const select = document.getElementById("chatu8_fab_theme");
  if (select) {
    const currentValue = select.value;
    select.innerHTML = "";
    for (const name in settings3.fabThemes) {
      select.add(new Option(name, name));
    }
    if (settings3.fabThemes[currentValue]) {
      select.value = currentValue;
    } else if (settings3.chatu8_fab_theme && settings3.fabThemes[settings3.chatu8_fab_theme]) {
      select.value = settings3.chatu8_fab_theme;
    }
  }
  console.log("[AI Config Helper] \u60AC\u6D6E\u7403\u4E3B\u9898\u9009\u62E9\u5668\u5DF2\u5237\u65B0");
}

function refreshInputFields(changedSettings, settings3) {
  const fieldToElementMap = {
    // 主要设置页面
    "startTag": "startTag",
    "endTag": "endTag",
    "imageGenInterval": "imageGenInterval",
    // SD 设置页面
    "sdUrl": "sdUrl",
    "st_chatu8_sd_auth": "st_chatu8_sd_auth",
    "AQT_sd": "fixedPrompt",
    "fixedPrompt_end_sd": "fixedPrompt_end",
    "UCP_sd": "negativePrompt",
    "sd_cwidth": "sd_cwidth",
    "sd_cheight": "sd_cheight",
    "sd_csteps": "sd_csteps",
    "sd_cseed": "sd_cseed",
    "sdCfgScale": "sdCfgScale",
    "sd_cclip_skip": "sd_cclip_skip",
    "sd_chires_steps": "sd_chires_steps",
    "sd_cupscale_factor": "sd_cupscale_factor",
    "sd_cdenoising_strength": "sd_cdenoising_strength",
    // NovelAI 设置页面
    "novelaiApi": "novelaiApi",
    "novelaiOtherSite": "novelaiOtherSite",
    "cloudQueueUrl": "cloudQueueUrl",
    "cloudQueueGreeting": "cloudQueueGreeting",
    "AQT_novelai": "fixedPrompt_novelai",
    "fixedPrompt_end_novelai": "fixedPrompt_end_novelai",
    "UCP_novelai": "negativePrompt_novelai",
    "nai3Scale": "nai3Scale",
    "cfg_rescale": "cfg_rescale",
    "novelai_width": "novelai_width",
    "novelai_height": "novelai_height",
    "novelai_steps": "novelai_steps",
    "novelai_seed": "novelai_seed",
    "InformationExtracted": "InformationExtracted",
    "ReferenceStrength": "ReferenceStrength",
    // ComfyUI 设置页面
    "comfyuiUrl": "comfyuiUrl",
    "AQT_comfyui": "fixedPrompt_comfyui",
    "fixedPrompt_end_comfyui": "fixedPrompt_end_comfyui",
    "UCP_comfyui": "negativePrompt_comfyui",
    "comfyui_width": "comfyui_width",
    "comfyui_height": "comfyui_height",
    "comfyui_steps": "comfyui_steps",
    "comfyui_seed": "comfyui_seed",
    "cfg_comfyui": "cfg_comfyui",
    "c_fenwei": "c_fenwei",
    "c_xijie": "c_xijie",
    "c_quanzhong": "c_quanzhong",
    "c_idquanzhong": "c_idquanzhong",
    "inpaint_denoise": "inpaint_denoise",
    "inpaint_positive_prompt": "inpaint_positive_prompt",
    "inpaint_negative_prompt": "inpaint_negative_prompt",
    // Banana 设置页面
    "banana.apiUrl": "st-chatu8-banana-api-url",
    "banana.apiKey": "st-chatu8-banana-api-key",
    // LLM 设置页面
    "translation_system_prompt": "translation_system_prompt",
    "ai_temperature": "ch-llm_temperature_value",
    "ai_top_p": "ch-llm_top_p_value",
    "llm_history_depth": "ch-llm_history_depth_value",
    // 世界书页面
    "worldbook_content": "worldbook_content",
    // 正则页面
    "defaultCharDemand": "ch-default-char-demand",
    "defaultImageDemand": "ch-default-image-demand",
    "defaultVisualPrepDemand": "ch-default-visual-prep-demand",
    "current_demand_profile": "ch-demand-profile-select",
    // 词库页面
    "vocabulary_search_limit": "vocabulary_search_limit",
    // 悬浮球页面
    "chatu8_fab_opacity": "chatu8_fab_opacity_value",
    "chatu8_fab_size": "chatu8_fab_size_value",
    // 角色管理页面
    "char_nameCN": "char_nameCN",
    "char_nameEN": "char_nameEN",
    "outfit_nameCN": "outfit_nameCN",
    "outfit_nameEN": "outfit_nameEN"
  };
  const llmProfileFields = {
    "api_url": "ch-llm_api_url",
    "api_key": "ch-llm_api_key",
    "model": "ch-llm_model_input",
    "temperature": "ch-llm_temperature_value",
    "top_p": "ch-llm_top_p_value",
    "max_tokens": "ch-llm_max_tokens_value"
  };
  let refreshCount = 0;
  for (const [key, value] of Object.entries(changedSettings)) {
    if (fieldToElementMap[key]) {
      const elementId = fieldToElementMap[key];
      const element = document.getElementById(elementId);
      if (element) {
        if (document.activeElement !== element) {
          if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
            element.value = value ?? "";
            refreshCount++;
          }
        }
      }
    }
    if (key === "llm_profiles" && settings3.current_llm_profile) {
      const currentProfile = settings3.llm_profiles[settings3.current_llm_profile];
      if (currentProfile) {
        for (const [profileKey, elementId] of Object.entries(llmProfileFields)) {
          const element = document.getElementById(elementId);
          if (element && document.activeElement !== element) {
            const profileValue = currentProfile[profileKey];
            if (profileValue !== void 0) {
              element.value = profileValue ?? "";
              refreshCount++;
            }
          }
        }
      }
    }
    if (key === "banana" && typeof value === "object") {
      if (value.apiUrl !== void 0) {
        const element = document.getElementById("st-chatu8-banana-api-url");
        if (element && document.activeElement !== element) {
          element.value = value.apiUrl ?? "";
          refreshCount++;
        }
      }
      if (value.apiKey !== void 0) {
        const element = document.getElementById("st-chatu8-banana-api-key");
        if (element && document.activeElement !== element) {
          element.value = value.apiKey ?? "";
          refreshCount++;
        }
      }
    }
    if (key === "worldBookList" && settings3.worldBookList_id) {
      const currentBook = settings3.worldBookList[settings3.worldBookList_id];
      if (currentBook !== void 0) {
        const element = document.getElementById("worldbook_content");
        if (element && document.activeElement !== element) {
          element.value = currentBook ?? "";
          refreshCount++;
        }
      }
    }
    if (key === "prompt_replace" && settings3.prompt_replace_id) {
      const currentReplace = settings3.prompt_replace[settings3.prompt_replace_id];
      if (currentReplace !== void 0) {
        const sdElement = document.getElementById("prompt_replace_text");
        if (sdElement && document.activeElement !== sdElement) {
          sdElement.value = currentReplace ?? "";
          refreshCount++;
        }
        const naiElement = document.getElementById("prompt_replace_text_novelai");
        if (naiElement && document.activeElement !== naiElement) {
          naiElement.value = currentReplace ?? "";
          refreshCount++;
        }
        const comfyElement = document.getElementById("prompt_replace_text_comfyui");
        if (comfyElement && document.activeElement !== comfyElement) {
          comfyElement.value = currentReplace ?? "";
          refreshCount++;
        }
      }
    }
    syncRangeInputs(key, value);
  }
  if (refreshCount > 0) {
    console.log(`[AI Config Helper] \u5DF2\u5237\u65B0 ${refreshCount} \u4E2A\u8F93\u5165\u6846`);
  }
}

function syncRangeInputs(key, value) {
  const rangeMap = {
    "ai_temperature": { slider: "ch-llm_temperature", input: "ch-llm_temperature_value" },
    "ai_top_p": { slider: "ch-llm_top_p", input: "ch-llm_top_p_value" },
    "llm_history_depth": { slider: "ch-llm_history_depth", input: "ch-llm_history_depth_value" },
    "InformationExtracted": { slider: "InformationExtracted_range", input: "InformationExtracted" },
    "ReferenceStrength": { slider: "ReferenceStrength_range", input: "ReferenceStrength" },
    "chatu8_fab_opacity": { slider: "chatu8_fab_opacity", input: "chatu8_fab_opacity_value" },
    "chatu8_fab_size": { slider: "chatu8_fab_size", input: "chatu8_fab_size_value" }
  };
  if (rangeMap[key]) {
    const { slider, input } = rangeMap[key];
    const sliderElement = document.getElementById(slider);
    const inputElement = document.getElementById(input);
    if (sliderElement && document.activeElement !== sliderElement) {
      sliderElement.value = value ?? "";
    }
    if (inputElement && document.activeElement !== inputElement) {
      inputElement.value = value ?? "";
    }
  }
  if (key === "llm_profiles") {
    const maxTokensSlider2 = document.getElementById("ch-llm_max_tokens");
    const maxTokensInput = document.getElementById("ch-llm_max_tokens_value");
    if (maxTokensSlider2 && maxTokensInput) {
      const settings3 = extension_settings[extensionName];
      const currentProfile = settings3.llm_profiles?.[settings3.current_llm_profile];
      if (currentProfile?.max_tokens !== void 0) {
        if (document.activeElement !== maxTokensSlider2) {
          maxTokensSlider2.value = currentProfile.max_tokens;
        }
        if (document.activeElement !== maxTokensInput) {
          maxTokensInput.value = currentProfile.max_tokens;
        }
      }
    }
  }
}

export { refreshAffectedUI, refreshWorkflowSelectors };
