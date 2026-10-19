// 还原自打包产物 — 原始模块: utils/settings/profile.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../script.js";
import { defaultSettings, extensionName } from "../config.js";
import { stylishConfirm } from "../ui_common.js";
import { COMFYUI_PROFILE_KEYS, NOVELAI_PROFILE_KEYS, RUNNINGHUB_PROFILE_KEYS } from "../ui.js";
import { refreshNovelaiUIFromSettings, saveModelConfigFromUI, updateNovelaiOtherSiteVisibility } from "./novelai_ui.js";
import { NOVELAI_MODEL_PARAM_KEYS } from "./vibeTransferGenerator.js";

var DISCLAIMER_CONTENT;

var DISCLAIMER_CONTENT = `
    <div class="st-chatu8-settings-section">
        <h3>\u2696\uFE0F \u6B63\u5F53\u4F7F\u7528\u58F0\u660E</h3>
        <div class="st-chatu8-disclaimer">
            <p><strong>\u672C\u63D2\u4EF6\u4EC5\u4F9B\u4EE5\u4E0B\u7528\u9014\uFF1A</strong></p>
            <ul>
                <li>\u{1F3A8} \u4E2A\u4EBA\u521B\u4F5C\u4E0E\u827A\u672F\u63A2\u7D22</li>
                <li>\u{1F4DA} \u5B66\u4E60\u7814\u7A76\u4E0E\u6280\u672F\u6D4B\u8BD5</li>
                <li>\u{1F3AE} \u89D2\u8272\u626E\u6F14\u4E0E\u5A31\u4E50\u4E92\u52A8</li>
            </ul>
            <p>\u7528\u6237\u5E94\u5F53\u9075\u5B88\u6240\u5728\u5730\u533A\u7684\u76F8\u5173\u6CD5\u5F8B\u6CD5\u89C4\uFF0C\u5408\u7406\u3001\u5408\u6CD5\u5730\u4F7F\u7528\u672C\u63D2\u4EF6\u3002</p>
        </div>
    </div>
    <div class="st-chatu8-settings-section">
        <h3>\u26A0\uFE0F \u514D\u8D23\u58F0\u660E</h3>
        <div class="st-chatu8-disclaimer">
            <p><strong>\u5173\u4E8E\u5185\u5BB9\u8D23\u4EFB\uFF1A</strong></p>
            <ul>
                <li>\u672C\u63D2\u4EF6\u4EC5\u4F5C\u4E3A\u56FE\u50CF\u751F\u6210\u7684\u6865\u63A5\u5DE5\u5177\uFF0C\u4E0D\u76F4\u63A5\u751F\u6210\u4EFB\u4F55\u56FE\u50CF\u5185\u5BB9</li>
                <li>\u6240\u6709\u751F\u6210\u7684\u56FE\u50CF\u5747\u7531\u7528\u6237\u9009\u62E9\u7684\u7B2C\u4E09\u65B9AI\u670D\u52A1\u63D0\u4F9B</li>
                <li>\u7528\u6237\u751F\u6210\u7684\u6240\u6709\u5185\u5BB9\u7531\u7528\u6237\u81EA\u884C\u8D1F\u8D23\uFF0C\u4E0E\u63D2\u4EF6\u4F5C\u8005\u65E0\u5173</li>
            </ul>
            <p><strong>\u5173\u4E8E\u4F7F\u7528\u98CE\u9669\uFF1A</strong></p>
            <ul>
                <li>\u7528\u6237\u5E94\u786E\u4FDD\u751F\u6210\u5185\u5BB9\u7B26\u5408\u6240\u5728\u5730\u533A\u6CD5\u5F8B\u6CD5\u89C4</li>
                <li>\u7981\u6B62\u4F7F\u7528\u672C\u63D2\u4EF6\u751F\u6210\u4EFB\u4F55\u8FDD\u6CD5\u8FDD\u89C4\u5185\u5BB9</li>
                <li>\u7981\u6B62\u5C06\u751F\u6210\u5185\u5BB9\u7528\u4E8E\u4EFB\u4F55\u975E\u6CD5\u7528\u9014\u6216\u672A\u7ECF\u6388\u6743\u7684\u5546\u4E1A\u7528\u9014</li>
                <li>\u56E0\u4F7F\u7528\u672C\u63D2\u4EF6\u4EA7\u751F\u7684\u4EFB\u4F55\u6CD5\u5F8B\u8D23\u4EFB\u6216\u540E\u679C\uFF0C\u7531\u7528\u6237\u81EA\u884C\u627F\u62C5</li>
            </ul>
            <p style="color: var(--SmartThemeQuoteColor); font-style: italic; margin-top: 10px;">
                \u4F7F\u7528\u672C\u63D2\u4EF6\u5373\u8868\u793A\u60A8\u5DF2\u9605\u8BFB\u5E76\u540C\u610F\u4E0A\u8FF0\u58F0\u660E\u3002
            </p>
        </div>
    </div>
    <div class="st-chatu8-settings-section">
        <h3>\u{1F4B0} \u5173\u4E8E\u6536\u8D39</h3>
        <div class="st-chatu8-disclaimer">
            <p><strong>\u672C\u63D2\u4EF6\u5B8C\u5168\u514D\u8D39\uFF01</strong></p>
            <ul>
                <li>\u{1F193} \u672C\u63D2\u4EF6\u4E3A\u514D\u8D39\u8F6F\u4EF6\uFF0C\u4EFB\u4F55\u4EBA\u90FD\u53EF\u4EE5\u514D\u8D39\u4F7F\u7528</li>
                <li>\u{1F6AB} \u5982\u679C\u60A8\u662F\u901A\u8FC7\u4ED8\u8D39\u6E20\u9053\u83B7\u5F97\u672C\u63D2\u4EF6\uFF0C\u60A8\u5DF2\u88AB\u9A97</li>
                <li>\u26A0\uFE0F \u8BF7\u52FF\u5C06\u672C\u63D2\u4EF6\u7528\u4E8E\u4EFB\u4F55\u5F62\u5F0F\u7684\u5012\u5356\u6216\u6536\u8D39\u5206\u53D1</li>
                <li>\u{1F49D} \u5982\u679C\u89C9\u5F97\u597D\u7528\uFF0C\u6B22\u8FCE\u901A\u8FC7"\u652F\u6301\u4F5C\u8005"\u94FE\u63A5\u81EA\u613F\u6253\u8D4F</li>
            </ul>
        </div>
    </div>
`;
function getSettings3() {
  return extension_settings[extensionName];
}

function refreshNovelaiProfileSelect() {
  const settings3 = getSettings3();
  const select = document.getElementById("novelai_profile_id");
  if (!select) return;
  if (!settings3.novelai_profiles) {
    settings3.novelai_profiles = JSON.parse(JSON.stringify(defaultSettings.novelai_profiles));
  }
  if (!settings3.novelai_profile_id) {
    settings3.novelai_profile_id = "\u9ED8\u8BA4";
  }
  for (const profileId in settings3.novelai_profiles) {
    const profile = settings3.novelai_profiles[profileId];
    if (profile.enableVibeGroupTransfer === void 0) {
      profile.enableVibeGroupTransfer = "false";
    }
    if (profile.normalizeRefStrength === void 0) {
      profile.normalizeRefStrength = "false";
    }
    if (profile.randomVibeGroup === void 0) {
      profile.randomVibeGroup = "false";
    }
  }
  select.innerHTML = "";
  const sortedKeys = Object.keys(settings3.novelai_profiles).sort((a, b) => a.localeCompare(b, "zh-CN"));
  for (const key of sortedKeys) {
    const option = new Option(key, key);
    option.title = key;
    select.add(option);
  }
  select.value = settings3.novelai_profile_id;
}

function refreshComfyuiProfileSelect() {
  const settings3 = getSettings3();
  const select = document.getElementById("comfyui_profile_id");
  if (!select) return;
  if (!settings3.comfyui_profiles) {
    settings3.comfyui_profiles = JSON.parse(JSON.stringify(defaultSettings.comfyui_profiles));
  }
  if (!settings3.comfyui_profile_id) {
    settings3.comfyui_profile_id = "\u9ED8\u8BA4";
  }
  select.innerHTML = "";
  const sortedKeys = Object.keys(settings3.comfyui_profiles).sort((a, b) => a.localeCompare(b, "zh-CN"));
  for (const key of sortedKeys) {
    const option = new Option(key, key);
    option.title = key;
    select.add(option);
  }
  select.value = settings3.comfyui_profile_id;
}

function collectNovelaiProfile() {
  const settings3 = getSettings3();
  const modeSelect = document.getElementById("novelaimode");
  const currentModel = modeSelect ? modeSelect.value : settings3.novelaimode || "nai-diffusion-4-5-full";
  if (currentModel) {
    saveModelConfigFromUI(currentModel);
  }
  const profile = {};
  for (const key of NOVELAI_PROFILE_KEYS) {
    let val = settings3[key];
    if (key === "novelaiApi" && typeof val === "string") {
      val = val.trim();
    }
    profile[key] = val;
  }
  if (settings3.novelai_model_configs) {
    profile.novelai_model_configs = JSON.parse(JSON.stringify(settings3.novelai_model_configs));
  } else {
    profile.novelai_model_configs = {};
  }
  return profile;
}

function collectComfyuiProfile() {
  const settings3 = getSettings3();
  const profile = {};
  for (const key of COMFYUI_PROFILE_KEYS) {
    profile[key] = settings3[key];
  }
  return profile;
}

function applyNovelaiProfile(profile) {
  const settings3 = getSettings3();
  if (!profile) return;
  if (profile.enableVibeGroupTransfer === void 0) {
    profile.enableVibeGroupTransfer = "false";
  }
  if (profile.normalizeRefStrength === void 0) {
    profile.normalizeRefStrength = "false";
  }
  if (profile.randomVibeGroup === void 0) {
    profile.randomVibeGroup = "false";
  }
  const targetModel = profile.novelaimode || settings3.novelaimode || "nai-diffusion-4-5-full";
  if (profile.novelai_model_configs && typeof profile.novelai_model_configs === "object" && Object.keys(profile.novelai_model_configs).length > 0) {
    settings3.novelai_model_configs = JSON.parse(JSON.stringify(profile.novelai_model_configs));
  } else {
    settings3.novelai_model_configs = settings3.novelai_model_configs || {};
    const legacyConfig = {};
    NOVELAI_MODEL_PARAM_KEYS.forEach((key) => {
      if (profile[key] !== void 0) {
        legacyConfig[key] = profile[key];
      }
    });
    if (Object.keys(legacyConfig).length > 0) {
      settings3.novelai_model_configs[targetModel] = legacyConfig;
    }
  }
  for (const key of NOVELAI_PROFILE_KEYS) {
    if (profile[key] !== void 0) {
      let val = profile[key];
      if (key === "novelaiApi" && typeof val === "string") {
        val = val.trim();
      }
      settings3[key] = val;
      const element = document.getElementById(key);
      if (element) {
        if (element.type === "checkbox") {
          element.checked = String(val) === "true" || val === true;
        } else {
          element.value = val;
        }
      }
    }
  }
  refreshNovelaiUIFromSettings(targetModel);
  syncSliders();
  updateNovelaiOtherSiteVisibility();
  if (settings3.novelaisite && settings3.novelaisite !== "\u5B98\u7F51") {
    const clientSelect = document.getElementById("client");
    if (clientSelect && clientSelect.value !== "browser") {
      clientSelect.value = "browser";
      settings3.client = "browser";
      $(clientSelect).trigger("change");
      if (typeof toastr !== "undefined") {
        toastr.info("\u5DF2\u81EA\u52A8\u4E3A\u60A8\u5207\u6362\u5BA2\u6237\u7AEF\u4E3A\uFF1A\u6D4F\u89C8\u5668\uFF08\u7B2C\u4E09\u65B9 NovelAI \u7AD9\u70B9\u4EC5\u652F\u6301\u6D4F\u89C8\u5668\u7AEF\u8BF7\u6C42\uFF09");
      }
    }
  }
}

function applyComfyuiProfile(profile) {
  const settings3 = getSettings3();
  for (const key of COMFYUI_PROFILE_KEYS) {
    if (profile[key] !== void 0) {
      settings3[key] = profile[key];
      const element = document.getElementById(key);
      if (element) {
        if (element.type === "checkbox") {
          element.checked = String(profile[key]) === "true";
        } else {
          element.value = profile[key];
        }
      }
    }
  }
  const workerSelect = document.getElementById("workerid");
  if (workerSelect && profile.workerid) {
    workerSelect.value = profile.workerid;
  }
  const workerTextarea = document.getElementById("worker");
  if (workerTextarea && profile.worker) {
    workerTextarea.value = typeof profile.worker === "string" ? profile.worker : JSON.stringify(profile.worker, null, 2);
  }
  const editWorkerSelect = document.getElementById("editWorkerid");
  if (editWorkerSelect && profile.editWorkerid) {
    editWorkerSelect.value = profile.editWorkerid;
  }
  const editWorkerTextarea = document.getElementById("editWorker");
  if (editWorkerTextarea) {
    if (profile.editWorker) {
      editWorkerTextarea.value = typeof profile.editWorker === "string" ? profile.editWorker : JSON.stringify(profile.editWorker, null, 2);
    } else if (profile.editWorkerid && settings3.workers[profile.editWorkerid]) {
      editWorkerTextarea.value = settings3.workers[profile.editWorkerid];
    }
  }
}

function refreshRunninghubProfileSelect() {
  const settings3 = getSettings3();
  const select = document.getElementById("runninghub_profile_id");
  if (!select) return;
  if (!settings3.runninghub_profiles) {
    settings3.runninghub_profiles = JSON.parse(JSON.stringify(defaultSettings.runninghub_profiles || { "\u9ED8\u8BA4": {} }));
  }
  if (!settings3.runninghub_profile_id) {
    settings3.runninghub_profile_id = "\u9ED8\u8BA4";
  }
  select.innerHTML = "";
  const sortedKeys = Object.keys(settings3.runninghub_profiles).sort((a, b) => a.localeCompare(b, "zh-CN"));
  for (const key of sortedKeys) {
    const option = new Option(key, key);
    option.title = key;
    select.add(option);
  }
  select.value = settings3.runninghub_profile_id;
}

function collectRunninghubProfile() {
  const settings3 = getSettings3();
  const profile = {};
  for (const key of RUNNINGHUB_PROFILE_KEYS) {
    profile[key] = settings3[key];
  }
  return profile;
}

function applyRunninghubProfile(profile) {
  const settings3 = getSettings3();
  for (const key of RUNNINGHUB_PROFILE_KEYS) {
    if (profile[key] !== void 0) {
      settings3[key] = profile[key];
      const element = document.getElementById(key);
      if (element) {
        if (element.type === "checkbox") {
          element.checked = String(profile[key]) === "true";
        } else {
          element.value = profile[key];
        }
      }
    }
  }
  const workerSelect = document.getElementById("runninghub_workerid");
  if (workerSelect && profile.runninghub_workerid) {
    workerSelect.value = profile.runninghub_workerid;
  }
  const workerTextarea = document.getElementById("runninghub_worker");
  if (workerTextarea && profile.runninghub_worker) {
    workerTextarea.value = typeof profile.runninghub_worker === "string" ? profile.runninghub_worker : JSON.stringify(profile.runninghub_worker, null, 2);
  }
  const wfIdInput = document.getElementById("runninghub_workflowId");
  if (wfIdInput && profile.runninghub_workflowId !== void 0) {
    wfIdInput.value = profile.runninghub_workflowId;
  }
  const img2vidSelect = document.getElementById("runninghub_img2vid_workerid");
  if (img2vidSelect && profile.runninghub_img2vid_workerid) {
    img2vidSelect.value = profile.runninghub_img2vid_workerid;
  }
  const img2vidTextarea = document.getElementById("runninghub_img2vid_worker");
  if (img2vidTextarea && profile.runninghub_img2vid_worker) {
    img2vidTextarea.value = typeof profile.runninghub_img2vid_worker === "string" ? profile.runninghub_img2vid_worker : JSON.stringify(profile.runninghub_img2vid_worker, null, 2);
  }
  const img2vidWfIdInput = document.getElementById("runninghub_img2vid_workflowId");
  if (img2vidWfIdInput && profile.runninghub_img2vid_workflowId !== void 0) {
    img2vidWfIdInput.value = profile.runninghub_img2vid_workflowId;
  }
  const ref2vidSelect = document.getElementById("runninghub_ref2vid_workerid");
  if (ref2vidSelect && profile.runninghub_ref2vid_workerid) {
    ref2vidSelect.value = profile.runninghub_ref2vid_workerid;
  }
  const ref2vidTextarea = document.getElementById("runninghub_ref2vid_worker");
  if (ref2vidTextarea && profile.runninghub_ref2vid_worker) {
    ref2vidTextarea.value = typeof profile.runninghub_ref2vid_worker === "string" ? profile.runninghub_ref2vid_worker : JSON.stringify(profile.runninghub_ref2vid_worker, null, 2);
  }
  const ref2vidWfIdInput = document.getElementById("runninghub_ref2vid_workflowId");
  if (ref2vidWfIdInput && profile.runninghub_ref2vid_workflowId !== void 0) {
    ref2vidWfIdInput.value = profile.runninghub_ref2vid_workflowId;
  }
  const otherSelectMappings = [
    { id: "runninghub_model", optionsKey: "runninghub_custom_models" },
    { id: "runninghub_sampler_name", optionsKey: "runninghub_custom_samplers" },
    { id: "runninghub_vae", optionsKey: "runninghub_custom_vaes" },
    { id: "runninghub_scheduler", optionsKey: "runninghub_custom_schedulers" },
    { id: "runninghub_clip_name", optionsKey: "runninghub_custom_clips" }
  ];
  otherSelectMappings.forEach(({ id, optionsKey }) => {
    const selectEl = document.getElementById(id);
    if (!selectEl) return;
    const opts = settings3[optionsKey];
    if (Array.isArray(opts)) {
      $(selectEl).empty();
      opts.forEach((opt) => {
        const optEl = document.createElement("option");
        optEl.value = opt;
        optEl.textContent = opt;
        selectEl.appendChild(optEl);
      });
    }
    if (settings3[id] !== void 0) {
      selectEl.value = settings3[id];
    }
  });
}

function syncSliders() {
  const pairs = [
    ["InformationExtracted", "InformationExtracted_range"],
    ["ReferenceStrength", "ReferenceStrength_range"]
  ];
  for (const [numId, rangeId] of pairs) {
    const numInput = document.getElementById(numId);
    const rangeInput = document.getElementById(rangeId);
    if (numInput && rangeInput) {
      rangeInput.value = numInput.value;
    }
  }
}

function initProfileControls(settingsModal) {
  const settings3 = getSettings3();
  if (!settings3.novelai_profiles) {
    settings3.novelai_profiles = JSON.parse(JSON.stringify(defaultSettings.novelai_profiles));
  }
  if (!settings3.comfyui_profiles) {
    settings3.comfyui_profiles = JSON.parse(JSON.stringify(defaultSettings.comfyui_profiles));
  }
  settingsModal.find("#novelai_profile_load").on("click", function() {
    const select = document.getElementById("novelai_profile_id");
    if (!select) return;
    const profileId = select.value;
    const profile = settings3.novelai_profiles[profileId];
    if (profile) {
      applyNovelaiProfile(profile);
      settings3.novelai_profile_id = profileId;
      saveSettingsDebounced();
      toastr.success(`\u5DF2\u52A0\u8F7D\u914D\u7F6E: ${profileId}`);
    }
  });
  settingsModal.find("#novelai_profile_new").on("click", async function() {
    const name = prompt("\u8BF7\u8F93\u5165\u65B0\u914D\u7F6E\u540D\u79F0:");
    if (!name || name.trim() === "") return;
    const trimmedName = name.trim();
    if (settings3.novelai_profiles[trimmedName]) {
      const overwrite = await stylishConfirm("\u786E\u8BA4\u8986\u76D6", `\u914D\u7F6E "${trimmedName}" \u5DF2\u5B58\u5728\uFF0C\u662F\u5426\u8986\u76D6\uFF1F`);
      if (!overwrite) return;
    }
    settings3.novelai_profiles[trimmedName] = collectNovelaiProfile();
    settings3.novelai_profile_id = trimmedName;
    refreshNovelaiProfileSelect();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u521B\u5EFA\u914D\u7F6E: ${trimmedName}`);
  });
  settingsModal.find("#novelai_profile_save").on("click", async function() {
    const select = document.getElementById("novelai_profile_id");
    if (!select) return;
    const profileId = select.value;
    if (!profileId) return;
    const confirmed = await stylishConfirm("\u786E\u8BA4\u4FDD\u5B58", `\u786E\u5B9A\u8981\u5C06\u5F53\u524D\u6240\u6709\u8BBE\u7F6E\u4FDD\u5B58\u5E76\u8986\u76D6\u5230\u914D\u7F6E "${profileId}" \u4E2D\u5417\uFF1F`);
    if (!confirmed) return;
    settings3.novelai_profiles[profileId] = collectNovelaiProfile();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u4FDD\u5B58\u5F53\u524D\u914D\u7F6E: ${profileId}`);
  });
  settingsModal.find("#novelai_profile_delete").on("click", async function() {
    const select = document.getElementById("novelai_profile_id");
    if (!select) return;
    const profileId = select.value;
    if (profileId === "\u9ED8\u8BA4") {
      toastr.warning("\u4E0D\u80FD\u5220\u9664\u9ED8\u8BA4\u914D\u7F6E");
      return;
    }
    const confirmed = await stylishConfirm("\u786E\u8BA4\u5220\u9664", `\u786E\u5B9A\u8981\u5220\u9664\u914D\u7F6E "${profileId}" \u5417\uFF1F`);
    if (!confirmed) return;
    delete settings3.novelai_profiles[profileId];
    settings3.novelai_profile_id = "\u9ED8\u8BA4";
    refreshNovelaiProfileSelect();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u5220\u9664\u914D\u7F6E: ${profileId}`);
  });
  settingsModal.find("#novelai_profile_id").on("change", function() {
    const profileId = this.value;
    const profile = settings3.novelai_profiles[profileId];
    if (profile) {
      applyNovelaiProfile(profile);
      settings3.novelai_profile_id = profileId;
      saveSettingsDebounced();
    }
  });
  settingsModal.find("#comfyui_profile_load").on("click", function() {
    const select = document.getElementById("comfyui_profile_id");
    if (!select) return;
    const profileId = select.value;
    const profile = settings3.comfyui_profiles[profileId];
    if (profile) {
      applyComfyuiProfile(profile);
      settings3.comfyui_profile_id = profileId;
      saveSettingsDebounced();
      toastr.success(`\u5DF2\u52A0\u8F7D\u914D\u7F6E: ${profileId}`);
    }
  });
  settingsModal.find("#comfyui_profile_new").on("click", async function() {
    const name = prompt("\u8BF7\u8F93\u5165\u65B0\u914D\u7F6E\u540D\u79F0:");
    if (!name || name.trim() === "") return;
    const trimmedName = name.trim();
    if (settings3.comfyui_profiles[trimmedName]) {
      const overwrite = await stylishConfirm("\u786E\u8BA4\u8986\u76D6", `\u914D\u7F6E "${trimmedName}" \u5DF2\u5B58\u5728\uFF0C\u662F\u5426\u8986\u76D6\uFF1F`);
      if (!overwrite) return;
    }
    settings3.comfyui_profiles[trimmedName] = collectComfyuiProfile();
    settings3.comfyui_profile_id = trimmedName;
    refreshComfyuiProfileSelect();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u521B\u5EFA\u914D\u7F6E: ${trimmedName}`);
  });
  settingsModal.find("#comfyui_profile_save").on("click", async function() {
    const select = document.getElementById("comfyui_profile_id");
    if (!select) return;
    const profileId = select.value;
    if (!profileId) return;
    const confirmed = await stylishConfirm("\u786E\u8BA4\u4FDD\u5B58", `\u786E\u5B9A\u8981\u5C06\u5F53\u524D\u6240\u6709\u8BBE\u7F6E\u4FDD\u5B58\u5E76\u8986\u76D6\u5230\u914D\u7F6E "${profileId}" \u4E2D\u5417\uFF1F`);
    if (!confirmed) return;
    settings3.comfyui_profiles[profileId] = collectComfyuiProfile();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u4FDD\u5B58\u5F53\u524D\u914D\u7F6E: ${profileId}`);
  });
  settingsModal.find("#comfyui_profile_delete").on("click", async function() {
    const select = document.getElementById("comfyui_profile_id");
    if (!select) return;
    const profileId = select.value;
    if (profileId === "\u9ED8\u8BA4") {
      toastr.warning("\u4E0D\u80FD\u5220\u9664\u9ED8\u8BA4\u914D\u7F6E");
      return;
    }
    const confirmed = await stylishConfirm("\u786E\u8BA4\u5220\u9664", `\u786E\u5B9A\u8981\u5220\u9664\u914D\u7F6E "${profileId}" \u5417\uFF1F`);
    if (!confirmed) return;
    delete settings3.comfyui_profiles[profileId];
    settings3.comfyui_profile_id = "\u9ED8\u8BA4";
    refreshComfyuiProfileSelect();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u5220\u9664\u914D\u7F6E: ${profileId}`);
  });
  settingsModal.find("#comfyui_profile_id").on("change", function() {
    const profileId = this.value;
    const profile = settings3.comfyui_profiles[profileId];
    if (profile) {
      applyComfyuiProfile(profile);
      settings3.comfyui_profile_id = profileId;
      saveSettingsDebounced();
    }
  });
  settingsModal.find("#runninghub_profile_load").on("click", function() {
    const select = document.getElementById("runninghub_profile_id");
    if (!select) return;
    const profileId = select.value;
    const profile = settings3.runninghub_profiles?.[profileId];
    if (profile) {
      applyRunninghubProfile(profile);
      settings3.runninghub_profile_id = profileId;
      saveSettingsDebounced();
      toastr.success(`\u5DF2\u52A0\u8F7D\u914D\u7F6E: ${profileId}`);
    }
  });
  settingsModal.find("#runninghub_profile_new").on("click", async function() {
    const name = prompt("\u8BF7\u8F93\u5165\u65B0\u914D\u7F6E\u540D\u79F0:");
    if (!name || name.trim() === "") return;
    const trimmedName = name.trim();
    if (!settings3.runninghub_profiles) settings3.runninghub_profiles = {};
    if (settings3.runninghub_profiles[trimmedName]) {
      const overwrite = await stylishConfirm("\u786E\u8BA4\u8986\u76D6", `\u914D\u7F6E "${trimmedName}" \u5DF2\u5B58\u5728\uFF0C\u662F\u5426\u8986\u76D6\uFF1F`);
      if (!overwrite) return;
    }
    settings3.runninghub_profiles[trimmedName] = collectRunninghubProfile();
    settings3.runninghub_profile_id = trimmedName;
    refreshRunninghubProfileSelect();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u521B\u5EFA\u914D\u7F6E: ${trimmedName}`);
  });
  settingsModal.find("#runninghub_profile_save").on("click", async function() {
    const select = document.getElementById("runninghub_profile_id");
    if (!select) return;
    const profileId = select.value;
    if (!profileId) return;
    const confirmed = await stylishConfirm("\u786E\u8BA4\u4FDD\u5B58", `\u786E\u5B9A\u8981\u5C06\u5F53\u524D\u6240\u6709\u8BBE\u7F6E\u4FDD\u5B58\u5E76\u8986\u76D6\u5230\u914D\u7F6E "${profileId}" \u4E2D\u5417\uFF1F`);
    if (!confirmed) return;
    if (!settings3.runninghub_profiles) settings3.runninghub_profiles = {};
    settings3.runninghub_profiles[profileId] = collectRunninghubProfile();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u4FDD\u5B58\u5F53\u524D\u914D\u7F6E: ${profileId}`);
  });
  settingsModal.find("#runninghub_profile_delete").on("click", async function() {
    const select = document.getElementById("runninghub_profile_id");
    if (!select) return;
    const profileId = select.value;
    if (profileId === "\u9ED8\u8BA4") {
      toastr.warning("\u4E0D\u80FD\u5220\u9664\u9ED8\u8BA4\u914D\u7F6E");
      return;
    }
    const confirmed = await stylishConfirm("\u786E\u8BA4\u5220\u9664", `\u786E\u5B9A\u8981\u5220\u9664\u914D\u7F6E "${profileId}" \u5417\uFF1F`);
    if (!confirmed) return;
    delete settings3.runninghub_profiles[profileId];
    settings3.runninghub_profile_id = "\u9ED8\u8BA4";
    refreshRunninghubProfileSelect();
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u5220\u9664\u914D\u7F6E: ${profileId}`);
  });
  settingsModal.find("#runninghub_profile_id").on("change", function() {
    const profileId = this.value;
    const profile = settings3.runninghub_profiles?.[profileId];
    if (profile) {
      applyRunninghubProfile(profile);
      settings3.runninghub_profile_id = profileId;
      saveSettingsDebounced();
    }
  });
  refreshNovelaiProfileSelect();
  refreshComfyuiProfileSelect();
  refreshRunninghubProfileSelect();
}

export { DISCLAIMER_CONTENT, initProfileControls, refreshComfyuiProfileSelect, refreshNovelaiProfileSelect, refreshRunninghubProfileSelect };
