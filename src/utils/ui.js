// 还原自打包产物 — 原始模块: utils/ui.js
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { getContext } from "../../../../../st-context.js";
import { editwk } from "./settings/workers.js";
import { defaultSettings, defaultThemes, extensionFolderPath, extensionName } from "./config.js";
import { addLog, comfyuiConcurrencyLock, removeTrailingSlash } from "./utils.js";
import { deleteConfigImage, getConfigImage, getFullComfyuiCache, getFullSdCache, migrateCacheToDatabase, saveConfigImage } from "./configDatabase.js";
import { applyImageFrameStyle } from "./settings/framestyle.js";
import { applyFabSettings, getGlobalVideoPlayer, getSuffix, hideSettingsPanel, showSettingsPanel, showToast, size_change, stylishConfirm, updateFabSize, validateUrlInput } from "./ui_common.js";
import { initFab } from "./settings/fab.js";
import { setupWorldBookEventListener } from "./settings/worldbook.js";
import { initCharacterSettings, refreshCharacterSettings } from "./settings/character/index.js";
import { generateMissingThumbnails, initJiuguanStorage, migrateDatabase, syncServerImagesWithStorage } from "./database.js";
import { eidtwork, initWorkerControls } from "./settings/worker.js";
import { replaceWithBanana } from "./banana.js";
import { replaceWithcomfyui } from "./comfyui.js";
import { replaceWithRunningHub } from "./runninghub.js";
import { applyTheme, initThemeSettings, isThemeDark } from "./settings/theme.js";
import { configUIRefresh_exports } from "./configHelper/configValidation.js";
import { initAiAssistant } from "./aiAssistant.js";
import { isKnowledgeBaseEnabled } from "./knowledgeBaseService.js";
import { replaceWithnovelai } from "./novelai.js";
import { replaceWithSd } from "./sd.js";
import { initVibeGroupEditor } from "./settings/vibeGroupEditor.js";
import { formatVibeStorageMigrationResult, migrateVibeStorageToServer } from "./settings/vibeStorageMigration.js";
import { FAB_ICON_ACCEPTED_TYPES, FAB_ICON_MAX_DIMENSION, FAB_ICON_MAX_FILE_SIZE, FAB_ICON_QUALITY, MODE_NAV_TABS, VIDEO_NAV_TABS, __set_fabIconPreviewToken, __set_settings2, currentPreviewTheme2, fabIconPreviewToken, generationTabs3, settings2, tabIds } from "../../index.js";
import { getAboutPageContent, initAboutProtection } from "./settings/about.js";
import { initHelpTipInteractions, injectHelpTips, removeHelpTips } from "./configHelper/helpTipInjector.js";
import { initCollapsibleSections } from "./settings/collapsibleSection.js";
import { initNovelaiUI, loadModelConfigIntoUI, updateNovelaiOtherSiteVisibility, updateNovelaiReferenceSectionsVisibility } from "./settings/novelai_ui.js";
import { initImageUpload, updateComfyUIImagePreview, updateNovelaiCharRefImagePreview, updateNovelaiImagePreview } from "./settings/image_upload.js";
import { comfyuiImageObjectURL, initApiConnectionTests, nai3CharRefImageMimeType, nai3VibeTransferImageMimeType } from "./settings/api_connections.js";
import { initUpdateCheck } from "./settings/update.js";
import { playOpeningVideo } from "./settings/openingVideo.js";
import { initProfileControls, refreshComfyuiProfileSelect, refreshNovelaiProfileSelect, refreshRunninghubProfileSelect } from "./settings/profile.js";
import { initVibeGenerator } from "./settings/vibeTransferGenerator.js";
import { initCharRefGroupEditor } from "./settings/charRefGroupEditor.js";
import { initGestureMonitor } from "./settings/Drawing.js";
import { initAutoLLMClick } from "./iframe/autoLLMClick.js";
import { initializeKeepAlive, updateKeepAliveStatus } from "./comfyuiKeepAlive.js";
import { initGeneralSettings } from "./settings/general.js";
import { initLogSettings, updateErrorStats, updateImageGenStats, updateLogView } from "./settings/log.js";
import { initPromptSettings } from "./settings/prompt.js";
import { setupPresetBoxes } from "./settings/presetBox.js";
import { initVideoAssets, renderAssetsList } from "./settings/video_assets.js";
import { initVideoAssetGenUI, refreshVideoAssetGenUI } from "./settings/videoAssetGenUi.js";
import { initKnowledgeBaseSettings, refreshKnowledgeBaseSettings } from "./settings/knowledgeBase.js";
import { initPromptReplaceControls } from "./settings/prompt_replace.js";
import { initLoraControls } from "./settings/lora.js";
import { initImageCache } from "./settings/image_cache.js";
import { init } from "./settings/vocabulary.js";
import { initBananaUI } from "./settings/bananaui.js";
import { initRunningHubUI } from "./settings/runninghubui.js";
import { initComfyUIVideoUI } from "./settings/comfyuiVideoUi.js";
import { initRegexSettings } from "./settings/regex.js";
import { initLLMSettings } from "./settings/llm.js";
import { initSendData } from "./settings/send_data.js";
import { showConfigStorageCleanupModal } from "./configStorageCleanupModal.js";

var BACKEND_LABELS, COMFYUI_PROFILE_KEYS, CONFIG_FOLDER2, DANGEROUS_REGEX_PATTERNS, DEFAULT_REGEX_ENTRY, INJECTED_FLAG, MODAL_ID, NOVELAI_PROFILE_KEYS, NOVELAI_TIMEOUT_SECONDS, REGEX_TIMEOUT_MS, REGEX_WORKER_CODE, RUNNINGHUB_PROFILE_KEYS, TAG_DATA_PATH, VOCABULARY_FILE_LIST, VOCABULARY_INSTALL_ALL_BTN, VOCABULARY_MANUAL_TAGS_EXPORT_BTN, VOCABULARY_MANUAL_TAGS_FILTER_INPUT, VOCABULARY_MANUAL_TAGS_IMPORT_BTN, VOCABULARY_MANUAL_TAGS_IMPORT_INPUT, VOCABULARY_MANUAL_TAGS_LIST, VOCABULARY_MANUAL_TAGS_REFRESH_BTN, VOCABULARY_MANUAL_TAG_ADD_BTN, VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT, VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT, VOCABULARY_SEARCH_BTN, VOCABULARY_SEARCH_INPUT, VOCABULARY_SEARCH_LIMIT, VOCABULARY_SEARCH_RESULTS, VOCABULARY_SEARCH_SORT, VOCABULARY_SEARCH_STARTSWITH, VOCABULARY_SELECTED_TAGS, VOCABULARY_TAG_BACKSPACE, VOCABULARY_TAG_CLEAR, VOCABULARY_TAG_COPY, VOCABULARY_TREE_CONTAINER, VOCABULARY_UNINSTALL_ALL_BTN, _chartResizeObserver, _currentPeriod, activeAbortControllers, beforeAfterEditor, bubbleEl, cachedTagTreeData, clickTriggerEnabledSwitch, currentCloudQueueInfo, currentEditingRegexEntry, defaultCharDemandTextarea, defaultImageDemandTextarea, defaultVisualPrepDemandTextarea, demandProfileSelect, encryptionKey, generationStartChatLength, generationStartSwipesLength, gestureEnabledSwitch, gestureMatchThresholdSlider, gestureMatchThresholdValue, gestureShowRecognitionSwitch, gestureShowTrailSwitch, gestureTrailColorPicker, globalsInitialized, imageGenDemandEnabledSwitch, kbActiveWorld, kbWorldList, markedLoadingTriggered, originalText, overlayEl, pendingRegexRequests, processedAutoLLMMessageIds, profileSelect2, regexEntriesContainer, regexEntryIdCounter, regexRequestIdCounter, regexTestModeSwitch, reloadWorldsFn, resultText, sharedRegexWorker, sharedRegexWorkerUrl, textEditor, tooltipEl, tooltipSticky, visualPrepDemandEnabledSwitch, workingNovelAIUrlCache;

var NOVELAI_TIMEOUT_SECONDS = 300;

var workingNovelAIUrlCache = /* @__PURE__ */ new Map();

var activeAbortControllers = /* @__PURE__ */ new Map();

var currentCloudQueueInfo = null;
var CONFIG_FOLDER2 = "chatu8_config";

var MODAL_ID = "st-chatu8-cfgclean-modal";
var BACKEND_LABELS = {
  sd: { name: "SD WebUI", icon: "\u{1F5BC}\uFE0F", color: "#42A5F5" },
  comfyui: { name: "ComfyUI", icon: "\u{1F527}", color: "#AB47BC" },
  banana: { name: "Banana / Grok", icon: "\u{1F34C}", color: "#FFA726" },
  novelai: { name: "NovelAI", icon: "\u2728", color: "#66BB6A" }
};

var _currentPeriod = "day";

var _chartResizeObserver = null;
var cachedTagTreeData = null;

var TAG_DATA_PATH = `${extensionFolderPath}/tagData/`;

var encryptionKey = "a-very-secret-key-that-is-not-so-secret";
var REGEX_TIMEOUT_MS = 1e3;

var sharedRegexWorker = null;

var sharedRegexWorkerUrl = null;

var regexRequestIdCounter = 0;

var pendingRegexRequests = /* @__PURE__ */ new Map();

var REGEX_WORKER_CODE = `
    self.onmessage = function(e) {
        const { requestId, operation, text, pattern, flags, replacement } = e.data;
        // \u53D1\u9001 ready \u4FE1\u53F7\uFF0C\u901A\u77E5\u4E3B\u7EBF\u7A0B\u5F00\u59CB\u8BA1\u65F6
        self.postMessage({ requestId, ready: true });
        try {
            const regex = new RegExp(pattern, flags);
            let result;
            switch(operation) {
                case 'test':
                    result = regex.test(text);
                    break;
                case 'match':
                    // \u4FDD\u7559 index \u548C input \u5C5E\u6027\uFF0C\u907F\u514D\u5E8F\u5217\u5316\u4E22\u5931
                    const m = text.match(regex);
                    if (m) {
                        result = {
                            matches: Array.from(m),
                            index: m.index,
                            input: m.input
                        };
                    } else {
                        result = null;
                    }
                    break;
                case 'replace':
                    result = text.replace(regex, replacement);
                    break;
                case 'matchAll':
                    result = [...text.matchAll(regex)].map(m => ({
                        match: m[0],
                        index: m.index,
                        groups: m.groups || null
                    }));
                    break;
                default:
                    throw new Error('Unknown operation: ' + operation);
            }
            self.postMessage({ requestId, success: true, result });
        } catch (err) {
            self.postMessage({ requestId, success: false, error: err.message });
        }
    };
`;

var regexEntryIdCounter = 0;

var currentEditingRegexEntry = null;

var DEFAULT_REGEX_ENTRY = {
  id: "",
  scriptName: "\u65B0\u5EFA\u6B63\u5219",
  disabled: false,
  runOnEdit: true,
  findRegex: "",
  replaceString: "",
  trimStrings: [],
  placement: [2],
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null,
  markdownOnly: true,
  promptOnly: false
};

var DANGEROUS_REGEX_PATTERNS = [
  {
    // 嵌套量词: (a+)+, (a*)+, (a+)*, (.+)+, (.*)+, etc.
    pattern: /\([^)]*[+*][^)]*\)[+*]/,
    name: "\u5D4C\u5957\u91CF\u8BCD",
    description: "\u5982 (a+)+, (.+)+ \u4F1A\u5BFC\u81F4\u6307\u6570\u7EA7\u56DE\u6EAF"
  },
  {
    // 连续通配量词: .*.*,  .+.+, .*?.+, etc.
    pattern: /\.\*\.\*|\.\+\.\+|\.\*\?\.\+|\.\+\?\.\*/,
    name: "\u8FDE\u7EED\u901A\u914D\u7B26",
    description: "\u5982 .*.*, .+.+ \u4F1A\u5BFC\u81F4\u5927\u91CF\u56DE\u6EAF"
  },
  {
    // 贪婪匹配后跟随相似模式: .*\w, .+\w, .*\S, .+\S
    pattern: /\.\+[^?].*\.\+|\.\*[^?].*\.\*/,
    name: "\u591A\u91CD\u8D2A\u5A6A\u5339\u914D",
    description: "\u591A\u4E2A\u8D2A\u5A6A\u5339\u914D\u53EF\u80FD\u5BFC\u81F4\u6027\u80FD\u95EE\u9898"
  },
  {
    // 空匹配循环: ()*, ()+, ()?+
    pattern: /\(\s*\)[+*]/,
    name: "\u7A7A\u5339\u914D\u5FAA\u73AF",
    description: "\u7A7A\u62EC\u53F7\u52A0\u91CF\u8BCD\u4F1A\u5BFC\u81F4\u65E0\u9650\u5FAA\u73AF"
  },
  {
    // 复杂嵌套组合: ((a+)+)+, (((.*)+)+)+
    pattern: /\(\([^)]*[+*][^)]*\)[+*]\)/,
    name: "\u6DF1\u5C42\u5D4C\u5957\u91CF\u8BCD",
    description: "\u591A\u5C42\u5D4C\u5957\u91CF\u8BCD\u98CE\u9669\u6781\u9AD8"
  },
  {
    // 交替匹配与量词组合: (a|b+)+, (a*|b)+
    pattern: /\([^)]*\|[^)]*[+*][^)]*\)[+*]|\([^)]*[+*][^)]*\|[^)]*\)[+*]/,
    name: "\u4EA4\u66FF\u91CF\u8BCD\u7EC4\u5408",
    description: "\u5982 (a|b+)+ \u53EF\u80FD\u5BFC\u81F4\u56DE\u6EAF"
  }
];
var kbWorldList = [];

var kbActiveWorld = null;

var reloadWorldsFn = null;
var NOVELAI_PROFILE_KEYS = [
  // NovelAI 设置
  "novelaiApi",
  "novelaisite",
  "novelaiOtherSite",
  "enableCloudQueue",
  "cloudQueueUrl",
  "cloudQueueGreeting",
  "showQueueGreeting",
  "cloudQueueTimeout",
  "novelaimode",
  "novelai_v5_effort",
  "novelai_straight_alpha",
  "novelai_sampler",
  "Schedule",
  "nai3Scale",
  "cfg_rescale",
  "AI_use_coords",
  "sm",
  "dyn",
  "nai3Variety",
  "nai3Deceisp",
  "AQT_novelai",
  "UCP_novelai",
  "addFurryDataset",
  // Vibe Transfer 与参考图
  "nai3VibeTransfer",
  "nai3CharRef",
  "enableVibeGroupTransfer",
  "randomVibeGroup",
  "normalizeRefStrength",
  // 生成参数
  "novelai_size",
  "novelai_width",
  "novelai_height",
  "novelai_steps",
  "novelai_seed"
];

var COMFYUI_PROFILE_KEYS = [
  // 工作流
  "workerid",
  "worker",
  // 修图预设
  "editWorkerid",
  "editWorker",
  // ComfyUI 设置
  "comfyuiUrl",
  // 其他设置
  "MODEL_NAME",
  "comfyuisamplerName",
  "comfyui_vae",
  "comfyui_scheduler",
  "comfyuiCLIPName",
  // 生成参数
  "comfyui_width",
  "comfyui_height",
  "comfyui_steps",
  "comfyui_seed",
  "cfg_comfyui",
  // 视频工作流与参数
  "comfyui_img2vid_workerid",
  "comfyui_img2vid_worker",
  "comfyui_ref2vid_workerid",
  "comfyui_ref2vid_worker",
  "comfyui_val_duration",
  "comfyui_val_steps",
  "comfyui_val_megapixels",
  "comfyui_val_seed",
  "comfyui_val_default_img",
  "comfyui_val_default_aud",
  "comfyui_img_ctrl_1",
  "comfyui_img_ctrl_2",
  "comfyui_img_ctrl_3",
  "comfyui_img_ctrl_4",
  "comfyui_img_ctrl_5",
  "comfyui_img_ctrl_6",
  "comfyui_img_ctrl_7",
  "comfyui_img_ctrl_8",
  "comfyui_img_ctrl_9",
  "comfyui_aud_ctrl_1",
  "comfyui_aud_ctrl_2",
  "comfyui_aud_ctrl_3",
  "comfyui_img_desc_1",
  "comfyui_img_desc_2",
  "comfyui_img_desc_3",
  "comfyui_img_desc_4",
  "comfyui_img_desc_5",
  "comfyui_img_desc_6",
  "comfyui_img_desc_7",
  "comfyui_img_desc_8",
  "comfyui_img_desc_9",
  "comfyui_aud_desc_1",
  "comfyui_aud_desc_2",
  "comfyui_aud_desc_3"
];

var RUNNINGHUB_PROFILE_KEYS = [
  "runninghub_workerid",
  "runninghub_worker",
  "runninghub_workflowId",
  "runninghub_img2vid_workerid",
  "runninghub_img2vid_worker",
  "runninghub_img2vid_workflowId",
  "runninghub_ref2vid_workerid",
  "runninghub_ref2vid_worker",
  "runninghub_ref2vid_workflowId",
  "runninghub_val_duration",
  "runninghub_val_steps",
  "runninghub_val_megapixels",
  "runninghub_val_seed",
  "runninghub_val_default_img",
  "runninghub_val_default_aud",
  "runninghub_img_ctrl_1",
  "runninghub_img_ctrl_2",
  "runninghub_img_ctrl_3",
  "runninghub_img_ctrl_4",
  "runninghub_img_ctrl_5",
  "runninghub_img_ctrl_6",
  "runninghub_img_ctrl_7",
  "runninghub_img_ctrl_8",
  "runninghub_img_ctrl_9",
  "runninghub_aud_ctrl_1",
  "runninghub_aud_ctrl_2",
  "runninghub_aud_ctrl_3",
  "runninghub_img_desc_1",
  "runninghub_img_desc_2",
  "runninghub_img_desc_3",
  "runninghub_img_desc_4",
  "runninghub_img_desc_5",
  "runninghub_img_desc_6",
  "runninghub_img_desc_7",
  "runninghub_img_desc_8",
  "runninghub_img_desc_9",
  "runninghub_aud_desc_1",
  "runninghub_aud_desc_2",
  "runninghub_aud_desc_3",
  "runninghub_model",
  "runninghub_sampler_name",
  "runninghub_vae",
  "runninghub_scheduler",
  "runninghub_clip_name",
  "runninghub_size",
  "runninghub_width",
  "runninghub_height",
  "runninghub_steps",
  "runninghub_seed",
  "runninghub_cfg",
  "runninghub_custom_models",
  "runninghub_custom_samplers",
  "runninghub_custom_vaes",
  "runninghub_custom_schedulers",
  "runninghub_custom_clips",
  "AQT_runninghub",
  "UCP_runninghub"
];
var INJECTED_FLAG = "chatu8HelpTipInjected";

var globalsInitialized = false;

var markedLoadingTriggered = false;

var tooltipEl = null;

var tooltipSticky = false;

var overlayEl = null;

var bubbleEl = null;
var processedAutoLLMMessageIds = /* @__PURE__ */ new Set();

var generationStartChatLength = 0;

var generationStartSwipesLength = 0;

function normalizeBackslashPath3(value) {
  return value == null ? "" : String(value).trim().replace(/\\{2,}/g, "\\");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("\u8BFB\u53D6\u56FE\u7247\u5931\u8D25"));
    reader.readAsDataURL(file);
  });
}

function getFabIconFormat(file) {
  return file.type.split("/")[1] || "png";
}

function compressFabIconImage(dataUrl, file) {
  if (file.type === "image/gif") {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > FAB_ICON_MAX_DIMENSION || height > FAB_ICON_MAX_DIMENSION) {
        const ratio = Math.min(FAB_ICON_MAX_DIMENSION / width, FAB_ICON_MAX_DIMENSION / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("\u65E0\u6CD5\u5904\u7406\u56FE\u7247"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(file.type, FAB_ICON_QUALITY));
    };
    img.onerror = () => reject(new Error("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25"));
    img.src = dataUrl;
  });
}

function setFabIconPreview(src) {
  const preview = document.getElementById("chatu8_fab_icon_preview");
  const img = document.getElementById("chatu8_fab_icon_preview_img");
  const removeBtn = document.getElementById("chatu8_fab_icon_remove_btn");
  if (!preview || !img || !removeBtn) return;
  if (src) {
    img.src = src;
    preview.classList.add("has-image");
    removeBtn.style.display = "";
  } else {
    img.removeAttribute("src");
    preview.classList.remove("has-image");
    removeBtn.style.display = "none";
  }
}

async function refreshFabIconPreview(src) {
  const token2 = __set_fabIconPreviewToken(fabIconPreviewToken + 1);
  const imageId = settings2?.chatu8_fab_icon_image_id;
  if (src) {
    setFabIconPreview(src);
    return;
  }
  if (!imageId) {
    setFabIconPreview("");
    return;
  }
  const serverPath = settings2.configImageStorage?.[imageId]?.path;
  if (serverPath) {
    setFabIconPreview(serverPath);
    return;
  }
  try {
    const imageData = await getConfigImage(imageId);
    if (token2 !== fabIconPreviewToken) return;
    setFabIconPreview(imageData || "");
  } catch (error) {
    if (token2 !== fabIconPreviewToken) return;
    console.error("[st-chatu8] \u52A0\u8F7D\u60AC\u6D6E\u7403\u56FE\u6807\u9884\u89C8\u5931\u8D25:", error);
    setFabIconPreview("");
  }
}

async function handleFabIconUpload(event) {
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;
  if (!FAB_ICON_ACCEPTED_TYPES.includes(file.type)) {
    toastr.error("\u8BF7\u9009\u62E9 JPG\u3001PNG\u3001WebP \u6216 GIF \u56FE\u7247\u3002");
    input.value = "";
    return;
  }
  if (file.size > FAB_ICON_MAX_FILE_SIZE) {
    toastr.error("\u56FE\u7247\u6587\u4EF6\u8FC7\u5927\uFF0C\u8BF7\u9009\u62E9\u5C0F\u4E8E 5MB \u7684\u56FE\u7247\u3002");
    input.value = "";
    return;
  }
  const uploadBtn = document.getElementById("chatu8_fab_icon_upload_btn");
  if (uploadBtn) uploadBtn.disabled = true;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const iconData = await compressFabIconImage(dataUrl, file);
    const oldImageId = settings2.chatu8_fab_icon_image_id;
    const imageId = await saveConfigImage(iconData, {
      format: getFabIconFormat(file),
      filename: `fab_icon_${Date.now()}`,
      forceServer: true
    });
    settings2.chatu8_fab_icon_image_id = imageId;
    saveSettingsDebounced();
    await refreshFabIconPreview(iconData);
    applyFabSettings();
    if (oldImageId && oldImageId !== imageId) {
      deleteConfigImage(oldImageId).catch((error) => {
        console.warn("[st-chatu8] \u5220\u9664\u65E7\u60AC\u6D6E\u7403\u56FE\u6807\u5931\u8D25:", error);
      });
    }
    toastr.success("\u60AC\u6D6E\u7403\u56FE\u6807\u4E0A\u4F20\u6210\u529F\uFF0C\u5DF2\u4FDD\u5B58\u5230\u9152\u9986\u3002");
  } catch (error) {
    console.error("[st-chatu8] \u4E0A\u4F20\u60AC\u6D6E\u7403\u56FE\u6807\u5931\u8D25:", error);
    toastr.error("\u60AC\u6D6E\u7403\u56FE\u6807\u4E0A\u4F20\u5931\u8D25\uFF1A" + error.message);
  } finally {
    if (uploadBtn) uploadBtn.disabled = false;
    input.value = "";
  }
}

async function removeFabIconImage() {
  const imageId = settings2?.chatu8_fab_icon_image_id;
  if (!imageId) {
    setFabIconPreview("");
    applyFabSettings();
    return;
  }
  try {
    await deleteConfigImage(imageId);
  } catch (error) {
    console.warn("[st-chatu8] \u5220\u9664\u60AC\u6D6E\u7403\u56FE\u6807\u5931\u8D25:", error);
  }
  settings2.chatu8_fab_icon_image_id = "";
  saveSettingsDebounced();
  await refreshFabIconPreview("");
  applyFabSettings();
  toastr.success("\u5DF2\u6062\u590D\u9ED8\u8BA4\u60AC\u6D6E\u7403\u56FE\u6807\u3002");
}

async function loadAllTabsContent(container) {
  if (!container) {
    console.error("Chatu8 UI Error: Tab content container not found.");
    return false;
  }
  try {
    const fetchPromises = tabIds.map((tabId) => {
      if (tabId === "about") {
        const aboutContent = getAboutPageContent();
        const requiredBlocks = [
          // 作者信息块（完整HTML）
          `<div class="st-chatu8-settings-section">
        <h3>\u5173\u4E8E \u667A\u7ED8\u59EC \u{1F5BC}\uFE0F</h3>
        <p>\u63D2\u4EF6\u4F5C\u8005: \u4ECE\u524D\u8DDF\u4F60\u4E00\u6837</p>
        <div class="st-chatu8-about-links">
            <a href="https://afdian.com/a/cqgnyy" target="_blank" class="st-chatu8-about-link support">
                <i class="fa-solid fa-heart"></i>
                <span>\u652F\u6301\u4F5C\u8005</span>
                <span class="st-chatu8-cute-emoji">\u{1F496}</span>
            </a>
            <a href="https://gxcgf4l6b2y.feishu.cn/wiki/UXtHw83pmiHnx1k4WpwcIn79nec?from=from_copylink" target="_blank" class="st-chatu8-about-link help">
                <i class="fa-solid fa-circle-question"></i>
                <span>\u67E5\u770B\u5E2E\u52A9</span>
                <span class="st-chatu8-cute-emoji">\u2753</span>
            </a>
        </div>
    </div>`,
          // 关键免责声明句子
          "\u514D\u8D23\u58F0\u660E",
          "\u672C\u63D2\u4EF6\u4EC5\u4F5C\u4E3A\u56FE\u50CF\u751F\u6210\u7684\u6865\u63A5\u5DE5\u5177",
          "\u7528\u6237\u751F\u6210\u7684\u6240\u6709\u5185\u5BB9\u7531\u7528\u6237\u81EA\u884C\u8D1F\u8D23",
          "\u7981\u6B62\u4F7F\u7528\u672C\u63D2\u4EF6\u751F\u6210\u4EFB\u4F55\u8FDD\u6CD5\u8FDD\u89C4\u5185\u5BB9",
          "\u56E0\u4F7F\u7528\u672C\u63D2\u4EF6\u4EA7\u751F\u7684\u4EFB\u4F55\u6CD5\u5F8B\u8D23\u4EFB\u6216\u540E\u679C",
          // 免费声明关键句子
          "\u672C\u63D2\u4EF6\u5B8C\u5168\u514D\u8D39",
          "\u672C\u63D2\u4EF6\u4E3A\u514D\u8D39\u8F6F\u4EF6",
          "\u5982\u679C\u60A8\u662F\u901A\u8FC7\u4ED8\u8D39\u6E20\u9053\u83B7\u5F97\u672C\u63D2\u4EF6\uFF0C\u60A8\u5DF2\u88AB\u9A97"
        ];
        const missingBlocks = requiredBlocks.filter((block) => !aboutContent.includes(block));
        if (missingBlocks.length > 0) {
          console.error("[Chatu8] \u5173\u952E\u58F0\u660E\u5185\u5BB9\u7F3A\u5931\uFF0C\u63D2\u4EF6\u65E0\u6CD5\u52A0\u8F7D");
          alert("\u26A0\uFE0F \u6587\u751F\u56FE\u63D2\u4EF6\u68C0\u6D4B\u5230\u5173\u952E\u6587\u4EF6\u88AB\u7BE1\u6539\uFF0C\u65E0\u6CD5\u52A0\u8F7D\u3002\n\n\u8BF7\u91CD\u65B0\u5B89\u88C5\u539F\u7248\u63D2\u4EF6\u3002");
          throw new Error("\u58F0\u660E\u5185\u5BB9\u6821\u9A8C\u5931\u8D25");
        }
        return Promise.resolve(aboutContent);
      }
      return fetch(`${extensionFolderPath}/html/settings/${tabId}.html`).then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${tabId}.html`);
        return res.text();
      });
    });
    const htmlContents = await Promise.all(fetchPromises);
    const finalHtml = htmlContents.map((html, index) => {
      const tabId = tabIds[index];
      return `<div id="st-chatu8-tab-${tabId}" class="st-chatu8-tab-content" data-tab-id="${tabId}">${html}</div>`;
    }).join("");
    container.innerHTML = finalHtml;
    try {
      initHelpTipInteractions();
      injectHelpTips(container);
    } catch (e) {
      console.warn("[Chatu8] injectHelpTips failed:", e);
    }
    try {
      initCollapsibleSections(container);
    } catch (e) {
      console.warn("[Chatu8] initCollapsibleSections failed:", e);
    }
    return true;
  } catch (error) {
    console.error("Chatu8 UI Error: Could not load all tab contents.", error);
    container.innerHTML = `<p class="error" style="color:red; text-align:center; margin-top: 20px;">\u9519\u8BEF\uFF1A\u65E0\u6CD5\u52A0\u8F7D\u8BBE\u7F6E\u9875\u9762\u3002\u8BF7\u68C0\u67E5\u6D4F\u89C8\u5668\u63A7\u5236\u53F0\u83B7\u53D6\u8BE6\u7EC6\u4FE1\u606F\u3002</p>`;
    return false;
  }
}

function updateModeNavVisibility(settingsModal) {
  const currentMode2 = settings2.mode || "comfyui";
  const videoChannel = settings2.videoChannel || "comfyui";
  let activeTabHidden = false;
  MODE_NAV_TABS.forEach((tab) => {
    const $link = settingsModal.find(`.st-chatu8-nav-link[data-tab="${tab}"]`);
    if (!$link.length) return;
    const visible = tab === currentMode2;
    $link.toggle(visible);
    if (!visible && $link.hasClass("active")) {
      activeTabHidden = true;
    }
  });
  VIDEO_NAV_TABS.forEach((tab) => {
    const $link = settingsModal.find(`.st-chatu8-nav-link[data-tab="${tab}"]`);
    if (!$link.length) return;
    let visible = false;
    if (videoChannel === "none") {
      visible = false;
    } else if (videoChannel === "runninghub") {
      visible = tab === "runninghub_video" || tab === "video_assets" || tab === "video_asset_gen";
    } else {
      visible = tab === "comfyui_video" || tab === "video_assets" || tab === "video_asset_gen";
    }
    $link.toggle(visible);
    if (!visible && $link.hasClass("active")) {
      activeTabHidden = true;
    }
  });
  if (activeTabHidden) {
    settingsModal.find('.st-chatu8-nav-link[data-tab="main"]').trigger("click");
  }
}

function updateGenerationModeHandlers() {
  replaceWithSd();
  replaceWithnovelai();
  replaceWithcomfyui();
  replaceWithBanana();
  replaceWithRunningHub();
  addLog("[UI] Generation mode handlers updated for mode: " + extension_settings[extensionName].mode);
}

async function initUI({ check_update: check_update2 }) {
  const existingPanel = document.getElementById("st-chatu8-settings");
  if (existingPanel) {
    existingPanel.remove();
  }
  __set_settings2(extension_settings[extensionName]);
  try {
    await initJiuguanStorage();
  } catch (error) {
    console.error("[UI] \u521D\u59CB\u5316 jiuguanStorage \u5931\u8D25:", error);
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = `${extensionFolderPath}/style.css`;
  document.head.appendChild(link);
  try {
    const response = await fetch(`${extensionFolderPath}/settings.html`);
    if (!response.ok) throw new Error("Failed to fetch settings.html");
    const settingsHtml = await response.text();
    document.body.insertAdjacentHTML("beforeend", settingsHtml);
  } catch (error) {
    console.error("Chatu8 UI Error: Could not load main settings panel.", error);
    return;
  }
  const tabContentContainer = document.querySelector("#ch-settings-modal .st-chatu8-content");
  if (!await loadAllTabsContent(tabContentContainer)) {
    return;
  }
  async function loadSettingsIntoUI() {
    __set_settings2(extension_settings[extensionName]);
    if (settings2.vibeJiuguanchucun === void 0) {
      settings2.vibeJiuguanchucun = defaultSettings.vibeJiuguanchucun;
      saveSettingsDebounced();
    }
    if (!settings2.cacheStorageMigrated) {
      console.log("[UI] \u68C0\u6D4B\u5230\u672A\u8FC1\u79FB\u7684 cache \u6570\u636E\uFF0C\u5F00\u59CB\u8FC1\u79FB...");
      const result = await migrateCacheToDatabase();
      if (result.success) {
        console.log("[UI] Cache \u8FC1\u79FB\u5B8C\u6210:", result);
        if (result.migratedComfyui || result.migratedSd) {
          toastr.success("\u7F13\u5B58\u6570\u636E\u5DF2\u4F18\u5316\u5B58\u50A8\uFF0Csettings.json \u6587\u4EF6\u4F53\u79EF\u5DF2\u51CF\u5C0F", "Cache \u8FC1\u79FB\u5B8C\u6210");
        }
      }
    }
    if (settings2.nai3CharRef === "true" && settings2.enableVibeGroupTransfer === "true") {
      settings2.enableVibeGroupTransfer = "false";
      addLog("[CharRef] Conflict resolved on load: Character Reference takes priority over Vibe Transfer");
      console.warn("[CharRef] Conflict detected: Both Character Reference and Vibe Transfer were enabled. Disabling Vibe Transfer (Character Reference takes priority).");
      toastr.warning("\u68C0\u6D4B\u5230\u51B2\u7A81\uFF1A\u89D2\u8272\u53C2\u8003\u4F18\u5148\uFF0CVibe Transfer \u5DF2\u7981\u7528", "\u529F\u80FD\u51B2\u7A81");
      saveSettingsDebounced();
    }
    if (String(settings2.enablePregen) === "true" && (String(settings2.zidongdianji) === "true" || String(settings2.zidongdianji2) === "true")) {
      settings2.enablePregen = "false";
      addLog("[Pregen] \u68C0\u6D4B\u5230\u5386\u53F2\u914D\u7F6E\u53CC\u5F00\u51B2\u7A81\uFF0C\u5DF2\u81EA\u52A8\u5173\u95ED\u6D41\u5F0F\u9884\u751F\u6210\uFF08\u4FDD\u7559\u81EA\u52A8\u70B9\u51FB\uFF09");
      console.warn("[Pregen] \u5386\u53F2\u914D\u7F6E\u51B2\u7A81\uFF1A\u6D41\u5F0F\u9884\u751F\u6210\u4E0E\u81EA\u52A8\u70B9\u51FB\u540C\u65F6\u5F00\u542F\uFF0C\u5DF2\u81EA\u52A8\u5173\u95ED\u6D41\u5F0F\u9884\u751F\u6210\u3002");
      toastr.info("\u68C0\u6D4B\u5230\u5386\u53F2\u914D\u7F6E\u51B2\u7A81\uFF1A\u5DF2\u81EA\u52A8\u5173\u95ED\u300C\u542F\u7528\u6D41\u5F0F\u9884\u751F\u6210\u300D\uFF0C\u4FDD\u7559\u300C\u81EA\u52A8\u70B9\u51FB\u751F\u6210\u300D", "\u529F\u80FD\u4E92\u65A5\u63D0\u793A");
      saveSettingsDebounced();
    }
    if (!settings2.themes) {
      settings2.themes = JSON.parse(JSON.stringify(defaultThemes));
    }
    if (!settings2.theme_id || !settings2.themes[settings2.theme_id]) {
      settings2.theme_id = "\u9ED8\u8BA4-\u767D\u5929";
    }
    applyTheme(settings2.themes[settings2.theme_id]);
    const mainKeys = ["scriptEnabled", "helpTipsEnabled", "disablePluginToast", "newlineFixEnabled", "mode", "client", "displayMode", "heavyFrontendMode", "insertOriginalText", "dbclike", "collapseImage", "zidongdianji", "zidongdianji2", "longPressToEdit", "clickToPreview", "startTag", "endTag", "cache", "sdUrl", "st_chatu8_sd_auth", "comfyuiUrl", "comfyui_max_concurrency", "comfyui_timeout", "novelaiApi", "novelaisite", "novelaiOtherSite", "enableCloudQueue", "cloudQueueUrl", "cloudQueueGreeting", "showQueueGreeting", "novelaimode", "novelai_v5_effort", "novelai_sampler", "Schedule", "nai3Scale", "cfg_rescale", "AI_use_coords", "sm", "dyn", "nai3Variety", "nai3Deceisp", "sd_cwidth", "sd_cheight", "sd_csteps", "sd_cseed", "sdCfgScale", "restoreFaces", "novelai_width", "novelai_height", "novelai_steps", "novelai_seed", "nai3VibeTransfer", "enableVibeGroupTransfer", "randomVibeGroup", "normalizeRefStrength", "InformationExtracted", "ReferenceStrength", "nai3CharRef", "nai3StylePerception", "comfyui_width", "comfyui_height", "comfyui_steps", "comfyui_seed", "cfg_comfyui", "worker", "ipa", "c_fenwei", "c_xijie", "c_quanzhong", "c_idquanzhong", "AQT_sd", "UCP_sd", "AQT_novelai", "UCP_novelai", "AQT_comfyui", "UCP_comfyui", "addFurryDataset", "sd_cupscale_factor", "sd_chires_fix", "sd_chires_steps", "sd_cdenoising_strength", "sd_cclip_skip", "sd_cadetailer", "worldBookEnabled", "ai_temperature", "ai_top_p", "ai_presence_penalty", "ai_frequency_penalty", "ai_stream", "ai_private", "ai_token", "vocabulary_search_startswith", "vocabulary_search_limit", "vocabulary_search_sort", "enablePregen", "autoLLMImageGen", "randomYushe", "aiAutonomousResolution", "videoChannel", "imageAlignment", "imageSizeScale", "imageGenInterval", "translation_system_prompt", "ai_test_system", "ai_test_user", "ai_test_output", "jiuguanchucun", "vibeJiuguanchucun", "convertToJpegStorage", "weilin_lora_fix"];
    mainKeys.forEach((key) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === "checkbox") {
          element.checked = String(settings2[key]) === "true";
        } else {
          element.value = settings2[key];
        }
      }
    });
    if (settings2.comfyui_max_concurrency) {
      comfyuiConcurrencyLock.setMaxConcurrency(settings2.comfyui_max_concurrency);
    }
    if (settings2.novelaimode) {
      loadModelConfigIntoUI(settings2.novelaimode);
    }
    const videoModeCheckbox = document.getElementById("enable_chatu8_fab_video");
    if (videoModeCheckbox) {
      const videoEnabled = settings2.enable_chatu8_fab_video === true || settings2.enable_chatu8_fab_video === "true";
      videoModeCheckbox.checked = videoEnabled;
      const traditionalSettings = document.getElementById("fab-traditional-settings");
      if (traditionalSettings) {
        traditionalSettings.style.display = videoEnabled ? "none" : "";
      }
    }
    const desktopPetCheckbox = document.getElementById("enable_chatu8_desktop_pet");
    if (desktopPetCheckbox) {
      const desktopPetEnabled = settings2.enable_chatu8_desktop_pet === true || settings2.enable_chatu8_desktop_pet === "true";
      desktopPetCheckbox.checked = desktopPetEnabled;
      const desktopPetSettings = document.getElementById("fab-desktop-pet-settings");
      if (desktopPetSettings) {
        const videoEnabled = settings2.enable_chatu8_fab_video === true || settings2.enable_chatu8_fab_video === "true";
        desktopPetSettings.style.display = videoEnabled ? "" : "none";
      }
    }
    const infoExtracted = document.getElementById("InformationExtracted");
    const infoExtractedRange = document.getElementById("InformationExtracted_range");
    if (infoExtracted && infoExtractedRange) {
      infoExtractedRange.value = infoExtracted.value;
    }
    const refStrength = document.getElementById("ReferenceStrength");
    const refStrengthRange = document.getElementById("ReferenceStrength_range");
    if (refStrength && refStrengthRange) {
      refStrengthRange.value = refStrength.value;
    }
    if (window.nai3VibeTransferImage) {
      updateNovelaiImagePreview(`data:${nai3VibeTransferImageMimeType};base64,${window.nai3VibeTransferImage}`);
    } else {
      updateNovelaiImagePreview(null);
    }
    if (window.nai3CharRefImage) {
      updateNovelaiCharRefImagePreview(`data:${nai3CharRefImageMimeType};base64,${window.nai3CharRefImage}`);
    } else {
      updateNovelaiCharRefImagePreview(null);
    }
    updateComfyUIImagePreview(comfyuiImageObjectURL);
    validateUrlInput(document.getElementById("sdUrl"));
    validateUrlInput(document.getElementById("comfyuiUrl"));
    const sdCache = await getFullSdCache();
    const hasSdCache = sdCache && sdCache.models && sdCache.models.length > 0;
    const sdSelects = [
      { id: "sd_cchatu_8_model", cacheKey: "models", settingKey: "sd_cchatu_8_model", nameField: "model_name" },
      { id: "sd_cchatu_8_vae", cacheKey: "vaes", settingKey: "sd_cchatu_8_vae", nameField: "model_name" },
      { id: "sd_cchatu_8_samplerName", cacheKey: "samplers", settingKey: "sd_cchatu_8_samplerName", nameField: "name" },
      { id: "sd_cchatu_8_scheduler", cacheKey: "schedulers", settingKey: "sd_cchatu_8_scheduler", nameField: "name" },
      { id: "sd_cchatu_8_upscaler", cacheKey: "upscalers", settingKey: "sd_cchatu_8_upscaler", nameField: "name" },
      { id: "sd_cchatu_8_lora", cacheKey: "loras", settingKey: "sd_cchatu_8_lora", nameField: "name" }
    ];
    if (hasSdCache) {
      sdSelects.forEach(({ id, cacheKey, settingKey, nameField }) => {
        const selectEl = document.getElementById(id);
        if (selectEl) {
          selectEl.innerHTML = "";
          selectEl.disabled = false;
          if (id === "sd_cchatu_8_vae") {
            selectEl.add(new Option("NONE", "NONE"));
          }
          if (sdCache[cacheKey]) {
            sdCache[cacheKey].forEach((item) => {
              const name = item;
              const option = new Option(name, name);
              option.title = name;
              selectEl.add(option);
            });
          }
          selectEl.value = settings2[settingKey];
          if (selectEl.selectedIndex === -1 && selectEl.options.length > 0) {
            selectEl.selectedIndex = 0;
            settings2[settingKey] = selectEl.value;
          }
        }
      });
    } else {
      sdSelects.forEach(({ id, settingKey }) => {
        const selectEl = document.getElementById(id);
        if (selectEl) {
          selectEl.innerHTML = `<option value="${settings2[settingKey]}">${settings2[settingKey]}</option>`;
          selectEl.disabled = true;
        }
      });
    }
    const comfyCache = await getFullComfyuiCache();
    const hasCache = comfyCache && comfyCache.models && comfyCache.models.length > 0;
    const modelSelect2 = document.getElementById("MODEL_NAME");
    const vaeSelect = document.getElementById("comfyui_vae");
    const schedulerSelect = document.getElementById("comfyui_scheduler");
    const samplerSelect = document.getElementById("comfyuisamplerName");
    const loraSelect = document.getElementById("ComfyuiLORA");
    const CLIPSelect = document.getElementById("comfyuiCLIPName");
    if (hasCache) {
      [modelSelect2, vaeSelect, schedulerSelect, samplerSelect, loraSelect, CLIPSelect].forEach((el) => {
        if (el) {
          el.innerHTML = "";
          el.disabled = false;
        }
      });
      comfyCache.models.forEach((model) => {
        const text = typeof model === "object" && model !== null ? model.text || model.value || String(model) : String(model);
        const value = typeof model === "object" && model !== null ? model.value || String(model) : String(model);
        const option = new Option(text, normalizeBackslashPath3(value));
        option.title = text;
        if (modelSelect2) modelSelect2.add(option);
      });
      comfyCache.vaes.forEach((vaeName) => {
        const name = typeof vaeName === "object" ? vaeName.value : vaeName;
        const option = new Option(name, name);
        option.title = name;
        if (vaeSelect) vaeSelect.add(option);
      });
      comfyCache.schedulers.forEach((schedulerName) => {
        const name = typeof schedulerName === "object" ? schedulerName.value || schedulerName.name || String(schedulerName) : String(schedulerName);
        const option = new Option(name, name);
        option.title = name;
        if (schedulerSelect) schedulerSelect.add(option);
      });
      comfyCache.samplers.forEach((samplerName) => {
        const name = typeof samplerName === "object" ? samplerName.value || samplerName.name || String(samplerName) : String(samplerName);
        const option = new Option(name, name);
        option.title = name;
        if (samplerSelect) samplerSelect.add(option);
      });
      if (comfyCache.CLIPs) {
        comfyCache.CLIPs.forEach((CLIPName) => {
          const name = typeof CLIPName === "object" ? CLIPName.value || CLIPName.name || String(CLIPName) : String(CLIPName);
          const option = new Option(name, name);
          option.title = name;
          if (CLIPSelect) CLIPSelect.add(option);
        });
      }
      if (loraSelect && comfyCache.loras && comfyCache.loras.length > 0) {
        comfyCache.loras.forEach((loraName) => {
          const name = typeof loraName === "object" ? loraName.value || loraName.name || String(loraName) : String(loraName);
          const option = new Option(name.replace(".safetensors", ""), name.replace(".safetensors", ""));
          option.title = name;
          loraSelect.add(option);
        });
      } else if (loraSelect) {
        loraSelect.innerHTML = "<option>\u65E0</option>";
        loraSelect.disabled = true;
      }
      if (modelSelect2) {
        settings2.MODEL_NAME = normalizeBackslashPath3(settings2.MODEL_NAME);
        modelSelect2.value = settings2.MODEL_NAME;
        if (modelSelect2.selectedIndex === -1 && modelSelect2.options.length > 0) {
          modelSelect2.selectedIndex = 0;
          settings2.MODEL_NAME = normalizeBackslashPath3(modelSelect2.value);
        }
      }
      if (vaeSelect) {
        vaeSelect.value = settings2.comfyui_vae;
        if (vaeSelect.selectedIndex === -1 && vaeSelect.options.length > 0) {
          vaeSelect.selectedIndex = 0;
          settings2.comfyui_vae = vaeSelect.value;
        }
      }
      if (schedulerSelect) {
        schedulerSelect.value = settings2.comfyui_scheduler;
        if (schedulerSelect.selectedIndex === -1 && schedulerSelect.options.length > 0) {
          schedulerSelect.selectedIndex = 0;
          settings2.comfyui_scheduler = schedulerSelect.value;
        }
      }
      if (samplerSelect) {
        samplerSelect.value = settings2.comfyuisamplerName;
        if (samplerSelect.selectedIndex === -1 && samplerSelect.options.length > 0) {
          samplerSelect.selectedIndex = 0;
          settings2.comfyuisamplerName = samplerSelect.value;
        }
      }
      if (CLIPSelect) {
        CLIPSelect.value = settings2.comfyuiCLIPName;
        if (CLIPSelect.selectedIndex === -1 && CLIPSelect.options.length > 0) {
          CLIPSelect.selectedIndex = 0;
          settings2.comfyuiCLIPName = CLIPSelect.value;
        }
      }
    } else {
      const selects = [
        { el: modelSelect2, setting: "MODEL_NAME" },
        { el: vaeSelect, setting: "comfyui_vae" },
        { el: schedulerSelect, setting: "comfyui_scheduler" },
        { el: samplerSelect, setting: "comfyuisamplerName" },
        { el: CLIPSelect, setting: "comfyuiCLIPName" }
      ];
      selects.forEach(({ el, setting }) => {
        if (el) {
          el.innerHTML = "";
          const option = new Option(settings2[setting] || "\u672A\u8FDE\u63A5", settings2[setting]);
          option.title = settings2[setting];
          el.add(option);
          el.value = settings2[setting];
          el.disabled = true;
        }
      });
      if (loraSelect) {
        loraSelect.innerHTML = "<option>\u672A\u8FDE\u63A5</option>";
        loraSelect.disabled = true;
      }
    }
    generationTabs3.forEach((mode) => {
      const suffix = getSuffix(mode);
      const yusheSelect = document.getElementById("yusheid" + suffix);
      const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
      if (yusheSelect) {
        yusheSelect.innerHTML = "";
        const sortedKeys = Object.keys(settings2.yushe).sort((a, b) => a.localeCompare(b, "zh-CN"));
        for (const key of sortedKeys) {
          const option = new Option(key, key);
          option.title = key;
          yusheSelect.add(option);
        }
        yusheSelect.value = settings2[yusheIdKey];
      }
      const currentPresetId = settings2[yusheIdKey] || "\u9ED8\u8BA4";
      const currentPreset = settings2.yushe[currentPresetId] || {};
      const fields = ["fixedPrompt", "fixedPrompt_end", "negativePrompt"];
      fields.forEach((field) => {
        const textarea = document.getElementById(field + suffix);
        if (textarea) {
          textarea.value = currentPreset[field] ?? "";
          const warning = textarea.closest(".st-chatu8-field-col").querySelector(".st-chatu8-unsaved-warning");
          if (warning) $(warning).hide();
        }
      });
    });
    if (!settings2.prompt_replace) {
      settings2.prompt_replace = { "\u9ED8\u8BA4": { "text": "" } };
    }
    if (!settings2.prompt_replace_id) {
      settings2.prompt_replace_id = "\u9ED8\u8BA4";
    }
    generationTabs3.forEach((mode) => {
      const suffix = getSuffix(mode);
      const replaceSelect = document.getElementById("prompt_replace_id" + suffix);
      if (replaceSelect) {
        replaceSelect.innerHTML = "";
        for (const key in settings2.prompt_replace) {
          const option = new Option(key, key);
          option.title = key;
          replaceSelect.add(option);
        }
        replaceSelect.value = settings2.prompt_replace_id;
      }
      const currentPreset = settings2.prompt_replace[settings2.prompt_replace_id] || {};
      const textarea = document.getElementById("prompt_replace_text" + suffix);
      if (textarea) {
        textarea.value = currentPreset.text ?? "";
        const warning = textarea.closest(".st-chatu8-field-col").querySelector(".st-chatu8-unsaved-warning");
        if (warning) $(warning).hide();
      }
    });
    if (!settings2.workers) {
      settings2.workers = {};
    }
    if (!settings2.workers["\u56FE\u50CF\u7F16\u8F91"]) {
      settings2.workers["\u56FE\u50CF\u7F16\u8F91"] = editwk;
      console.log('[Chatu8] \u5DF2\u81EA\u52A8\u6DFB\u52A0 "\u56FE\u50CF\u7F16\u8F91" \u5DE5\u4F5C\u6D41\u9884\u8BBE');
      saveSettingsDebounced();
    }
    if (!settings2.editWorkerid) {
      settings2.editWorkerid = "\u56FE\u50CF\u7F16\u8F91";
      saveSettingsDebounced();
    }
    if (!settings2.editWorker && settings2.workers[settings2.editWorkerid]) {
      settings2.editWorker = settings2.workers[settings2.editWorkerid];
      saveSettingsDebounced();
    }
    if (!settings2.worldBookList) {
      settings2.worldBookList = { "\u9ED8\u8BA4": { "content": "" } };
    }
    if (!settings2.worldBookList_id) {
      settings2.worldBookList_id = "\u9ED8\u8BA4";
    }
    const worldBookSelect = document.getElementById("worldBookList_id");
    if (worldBookSelect) {
      worldBookSelect.innerHTML = "";
      for (const key in settings2.worldBookList) {
        const option = new Option(key, key);
        option.title = key;
        worldBookSelect.add(option);
      }
      worldBookSelect.value = settings2.worldBookList_id;
    }
    const currentWorldBookPreset = settings2.worldBookList[settings2.worldBookList_id] || {};
    const worldBookTextarea = document.getElementById("worldbook_content");
    if (worldBookTextarea) {
      worldBookTextarea.value = currentWorldBookPreset.content ?? "";
      const warning = worldBookTextarea.closest(".st-chatu8-field-col").querySelector(".st-chatu8-unsaved-warning");
      if (warning) $(warning).hide();
    }
    const workerSelect = document.getElementById("workerid");
    if (workerSelect) {
      workerSelect.innerHTML = "";
      for (const key in settings2.workers) {
        const option = new Option(key, key);
        option.title = key;
        workerSelect.add(option);
      }
      workerSelect.value = settings2.workerid;
    }
    const editWorkerSelect = document.getElementById("editWorkerid");
    if (editWorkerSelect) {
      editWorkerSelect.innerHTML = "";
      for (const key in settings2.workers) {
        const option = new Option(key, key);
        option.title = key;
        editWorkerSelect.add(option);
      }
      editWorkerSelect.value = settings2.editWorkerid;
    }
    const editWorkerTextarea = document.getElementById("editWorker");
    if (editWorkerTextarea) {
      editWorkerTextarea.value = settings2.editWorker || settings2.workers[settings2.editWorkerid] || "";
    }
    if (!settings2.chatu8_fab_position) {
      settings2.chatu8_fab_position = {
        desktop: { top: settings2.chatu8_fab_top || "65vh", left: settings2.chatu8_fab_left || "20px" },
        mobile: { top: "80vh", left: "10px" }
      };
      delete settings2.chatu8_fab_top;
      delete settings2.chatu8_fab_left;
    }
    if (!settings2.chatu8_fab_position.desktop) {
      settings2.chatu8_fab_position.desktop = { top: "65vh", left: "20px" };
    }
    if (!settings2.chatu8_fab_position.mobile) {
      settings2.chatu8_fab_position.mobile = { top: "80vh", left: "10px" };
    }
    $("#enable_chatu8_fab").prop("checked", String(settings2.enable_chatu8_fab) === "true");
    if (!settings2.fabThemes) {
      settings2.fabThemes = JSON.parse(JSON.stringify(defaultSettings.fabThemes));
    }
    if (!settings2.chatu8_fab_theme) {
      settings2.chatu8_fab_theme = "\u81EA\u5B9A\u4E49";
    }
    const fabThemeSelect = $("#chatu8_fab_theme");
    if (fabThemeSelect.length) {
      fabThemeSelect.empty();
      for (const themeName in settings2.fabThemes) {
        const option = new Option(themeName, themeName);
        option.title = themeName;
        fabThemeSelect.append(option);
      }
      fabThemeSelect.val(settings2.chatu8_fab_theme);
    }
    $("#chatu8_fab_bg_color").val(settings2.chatu8_fab_bg_color || "#ADD8E6");
    $("#chatu8_fab_icon_color").val(settings2.chatu8_fab_icon_color || "#FFFFFF");
    if (typeof settings2.chatu8_fab_icon_image_id !== "string") {
      settings2.chatu8_fab_icon_image_id = "";
    }
    refreshFabIconPreview();
    $("#chatu8_fab_opacity").val(settings2.chatu8_fab_opacity ?? 1);
    $("#chatu8_fab_opacity_value").val(settings2.chatu8_fab_opacity ?? 1);
    if (typeof settings2.chatu8_fab_size === "number" || typeof settings2.chatu8_fab_size === "string") {
      const numValue = typeof settings2.chatu8_fab_size === "string" ? parseInt(settings2.chatu8_fab_size, 10) : settings2.chatu8_fab_size;
      settings2.chatu8_fab_size = {
        desktop: numValue,
        mobile: numValue
      };
    }
    const isMobile3 = window.innerWidth <= 768;
    const floatBallSize = isMobile3 ? settings2.chatu8_fab_size?.mobile ?? 40 : settings2.chatu8_fab_size?.desktop ?? 50;
    $("#chatu8_fab_size").val(floatBallSize);
    $("#chatu8_fab_size_value").val(floatBallSize);
    if (!settings2.chatu8_fab_video_paths) {
      settings2.chatu8_fab_video_paths = JSON.parse(JSON.stringify(defaultSettings.chatu8_fab_video_paths));
    }
    applyFabSettings();
    const activeTabId = $(".st-chatu8-nav-link.active").data("tab");
    if (activeTabId === "character") {
      const characterTab = $("#st-chatu8-tab-character");
      if (characterTab.length) {
        refreshCharacterSettings(characterTab);
      }
    }
    updateNovelaiOtherSiteVisibility();
    updateNovelaiReferenceSectionsVisibility(settings2.novelaimode);
  }
  loadSettingsIntoUI();
  updateGenerationModeHandlers();
  initFab();
  const settingsModal = $("#ch-settings-modal");
  initUpdateCheck(settingsModal, check_update2);
  setTimeout(() => generateMissingThumbnails(), 5e3);
  const originalShowSettingsPanel = showSettingsPanel;
  const wrappedShowSettingsPanel = function() {
    playOpeningVideo();
    setTimeout(() => {
      originalShowSettingsPanel();
    }, 100);
  };
  window.showChatuSettingsPanel = wrappedShowSettingsPanel;
  window.loadSilterTavernChatu8Settings = loadSettingsIntoUI;
  window.refreshNovelaiProfileSelect = refreshNovelaiProfileSelect;
  window.refreshComfyuiProfileSelect = refreshComfyuiProfileSelect;
  window.refreshRunninghubProfileSelect = refreshRunninghubProfileSelect;
  initNovelaiUI(settingsModal);
  initVibeGenerator(settingsModal);
  initVibeGroupEditor(settingsModal);
  initCharRefGroupEditor(settingsModal);
  settingsModal.find("#ch-settings-modal-close").on("click", hideSettingsPanel);
  const scrollTopBtn = settingsModal.find("#ch-scroll-top");
  const scrollBottomBtn = settingsModal.find("#ch-scroll-bottom");
  let scrollTimeout;
  let lastScrollTop = 0;
  settingsModal.find(".st-chatu8-content").on("scroll", function() {
    const content = $(this);
    const currentScrollTop = content.scrollTop();
    const scrollHeight = content[0].scrollHeight;
    const clientHeight = content[0].clientHeight;
    clearTimeout(scrollTimeout);
    if (currentScrollTop > lastScrollTop) {
      scrollTopBtn.removeClass("show");
      if (currentScrollTop + clientHeight < scrollHeight - 10) {
        scrollBottomBtn.addClass("show");
      }
    } else if (currentScrollTop < lastScrollTop) {
      scrollBottomBtn.removeClass("show");
      if (currentScrollTop > 10) {
        scrollTopBtn.addClass("show");
      }
    }
    lastScrollTop = currentScrollTop;
    scrollTimeout = setTimeout(() => {
      scrollTopBtn.removeClass("show");
      scrollBottomBtn.removeClass("show");
    }, 1500);
  });
  scrollTopBtn.on("click", () => {
    settingsModal.find(".st-chatu8-content").animate({ scrollTop: 0 }, 300);
  });
  scrollBottomBtn.on("click", () => {
    const content = settingsModal.find(".st-chatu8-content");
    content.animate({ scrollTop: content[0].scrollHeight }, 300);
  });
  if (extension_settings[extensionName].gestureEnabled == true || extension_settings[extensionName].gestureEnabled === "true") {
    initGestureMonitor();
  }
  initAutoLLMClick();
  initializeKeepAlive();
  initGeneralSettings(settingsModal);
  initLogSettings(settingsModal);
  initThemeSettings(settingsModal, settings2, currentPreviewTheme2);
  initPromptSettings(settingsModal, settings2);
  setupPresetBoxes(settingsModal);
  initCollapsibleSections(settingsModal);
  settingsModal.on("click", ".st-chatu8-toggle", function() {
    const checkbox = $(this).find('input[type="checkbox"]');
    if (checkbox.length) {
      checkbox.prop("checked", !checkbox.prop("checked")).trigger("change");
    }
  });
  settingsModal.find(".st-chatu8-nav-link").on("click", function(e) {
    e.preventDefault();
    const tabId = $(this).data("tab");
    if ($(this).hasClass("active")) {
      return;
    }
    settingsModal.find(".st-chatu8-nav-link").removeClass("active");
    $(this).addClass("active");
    const tabContents = settingsModal.find(".st-chatu8-content > .st-chatu8-tab-content");
    tabContents.removeClass("active");
    const targetTab = settingsModal.find(`#st-chatu8-tab-${tabId}`);
    if (targetTab.length) {
      targetTab.addClass("active");
      if (tabId === "log") {
        updateLogView();
        updateErrorStats();
        updateImageGenStats();
      } else if (tabId === "novelai") {
        updateNovelaiReferenceSectionsVisibility();
        updateNovelaiOtherSiteVisibility();
      } else if (tabId === "character") {
        refreshCharacterSettings(targetTab);
      } else if (tabId === "video_assets") {
        renderAssetsList();
      } else if (tabId === "video_asset_gen") {
        refreshVideoAssetGenUI();
      } else if (tabId === "knowledgeBase") {
        refreshKnowledgeBaseSettings(targetTab);
      }
    }
    settings2.lastTab = tabId;
  });
  const lastTabId = settings2.lastTab || "main";
  const initialTabLink = settingsModal.find(`.st-chatu8-nav-link[data-tab="${lastTabId}"]`);
  if (initialTabLink.length && !initialTabLink.hasClass("active")) {
    settingsModal.find(".st-chatu8-nav-link").removeClass("active");
    initialTabLink.addClass("active");
    settingsModal.find(".st-chatu8-content > .st-chatu8-tab-content").removeClass("active");
    const initialTabContent = settingsModal.find(`#st-chatu8-tab-${lastTabId}`);
    initialTabContent.addClass("active");
    if (lastTabId === "log") {
      updateLogView();
      updateErrorStats();
      updateImageGenStats();
    } else if (lastTabId === "knowledgeBase") {
      refreshKnowledgeBaseSettings(initialTabContent);
    }
  } else if (settingsModal.find(".st-chatu8-nav-link.active").length === 0) {
    const firstLink = settingsModal.find(".st-chatu8-nav-link").first();
    firstLink.addClass("active");
    const firstTabId = firstLink.data("tab");
    settingsModal.find(`#st-chatu8-tab-${firstTabId}`).addClass("active");
  }
  initPromptReplaceControls(settingsModal);
  setupWorldBookEventListener();
  initCharacterSettings(settingsModal);
  initWorkerControls(settingsModal);
  initProfileControls(settingsModal);
  initApiConnectionTests(settingsModal);
  initLoraControls(settingsModal);
  settingsModal.find("#eidtwork").on("click", eidtwork);
  initImageUpload(settingsModal);
  initImageCache(settingsModal);
  init(settingsModal);
  initBananaUI(settingsModal);
  initRunningHubUI(settingsModal);
  initComfyUIVideoUI(settingsModal);
  initVideoAssets(settingsModal);
  initVideoAssetGenUI(settingsModal);
  initRegexSettings(settingsModal);
  initLLMSettings(settingsModal);
  initSendData(settingsModal);
  initKnowledgeBaseSettings(settingsModal);
  const $kbNavLink = settingsModal.find('.st-chatu8-nav-link[data-tab="knowledgeBase"]');
  if ($kbNavLink.length) {
    $kbNavLink.toggle(isKnowledgeBaseEnabled());
  }
  updateModeNavVisibility(settingsModal);
  initAboutProtection(settingsModal[0]);
  initAiAssistant(settingsModal);
  settingsModal.find("#migrate-database-btn").on("click", migrateDatabase);
  settingsModal.find("#diagnose-config-storage-btn").on("click", async function() {
    const button = $(this);
    const originalText2 = button.text();
    button.prop("disabled", true).text("\u626B\u63CF\u4E2D...");
    try {
      await showConfigStorageCleanupModal();
    } catch (e) {
      console.error("[ConfigDB \u6E05\u7406] \u6253\u5F00\u5931\u8D25:", e);
      showToast(`\u6253\u5F00\u6E05\u7406\u9762\u677F\u5931\u8D25: ${e.message}`, "error");
    } finally {
      button.prop("disabled", false).text(originalText2);
    }
  });
  settingsModal.find("#migrate-vibe-storage-btn").on("click", async function() {
    const button = $(this);
    const originalText2 = button.text();
    button.prop("disabled", true).text("\u51C6\u5907\u8FC1\u79FB...");
    try {
      const result = await migrateVibeStorageToServer({
        promptEnable: true,
        onProgress: (current, total, message) => {
          button.text(`${message} (${current}/${total})`);
        }
      });
      alert(formatVibeStorageMigrationResult(result));
    } catch (error) {
      console.error("[VibeStorage] \u8FC1\u79FB\u5931\u8D25:", error);
      alert(`Vibe \u9152\u9986\u5B58\u50A8\u8FC1\u79FB\u5931\u8D25: ${error.message}`);
    } finally {
      button.prop("disabled", false).text(originalText2);
    }
  });
  settingsModal.find("#sync-server-images-btn").on("click", async function() {
    const button = $(this);
    const originalText2 = button.text();
    const progressModal = $(`
            <div class="st-chatu8-progress-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            ">
                <div class="st-chatu8-progress-container" style="
                    background: white;
                    border-radius: 8px;
                    padding: 24px;
                    min-width: 400px;
                    max-width: 500px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                ">
                    <h3 style="margin: 0 0 16px 0; color: #333;">\u540C\u6B65\u670D\u52A1\u5668\u56FE\u7247</h3>
                    <div class="st-chatu8-progress-bar" style="
                        width: 100%;
                        height: 24px;
                        background: #f0f0f0;
                        border-radius: 12px;
                        overflow: hidden;
                        margin-bottom: 12px;
                    ">
                        <div class="st-chatu8-progress-fill" style="
                            height: 100%;
                            background: linear-gradient(90deg, #4CAF50, #45a049);
                            width: 0%;
                            transition: width 0.3s ease;
                            border-radius: 12px;
                        "></div>
                    </div>
                    <div class="st-chatu8-progress-text" style="
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                        min-height: 20px;
                    ">\u51C6\u5907\u5F00\u59CB...</div>
                    <div class="st-chatu8-progress-percentage" style="
                        text-align: center;
                        color: #333;
                        font-weight: bold;
                        margin-top: 8px;
                    ">0%</div>
                </div>
            </div>
        `);
    $("body").append(progressModal);
    button.prop("disabled", true).text("\u540C\u6B65\u4E2D...");
    try {
      const result = await syncServerImagesWithStorage("chatu8", (current, total, message) => {
        const percentage = Math.floor(current / total * 100);
        progressModal.find(".st-chatu8-progress-fill").css("width", `${percentage}%`);
        progressModal.find(".st-chatu8-progress-text").text(message);
        progressModal.find(".st-chatu8-progress-percentage").text(`${percentage}%`);
      });
      progressModal.remove();
      const ghost = result.removedGhostCount || 0;
      if (result.deletedCount > 0 || ghost > 0 || result.errors.length > 0) {
        const lines = ["\u540C\u6B65\u5B8C\u6210\uFF01"];
        if (result.deletedCount > 0) lines.push(`\u5220\u9664\u4E86 ${result.deletedCount} \u4E2A\u670D\u52A1\u5668\u5B64\u513F\u56FE\u7247`);
        if (ghost > 0) lines.push(`\u4ECE\u5217\u8868\u6E05\u7406\u4E86 ${ghost} \u4E2A\u670D\u52A1\u5668\u5DF2\u4E0D\u5B58\u5728\u7684\u5E7D\u7075\u6761\u76EE`);
        if (result.errors.length > 0) lines.push(`\u5931\u8D25 ${result.errors.length} \u4E2A`);
        alert(lines.join("\n"));
      } else {
        alert("\u540C\u6B65\u5B8C\u6210\uFF01\u6240\u6709\u56FE\u7247\u90FD\u5DF2\u540C\u6B65\uFF0C\u65E0\u9700\u6E05\u7406\u3002");
      }
    } catch (error) {
      console.error("[Sync] \u540C\u6B65\u5931\u8D25:", error);
      progressModal.remove();
      alert(`\u540C\u6B65\u5931\u8D25: ${error.message}`);
    } finally {
      button.prop("disabled", false).text(originalText2);
    }
  });
  settingsModal.find("#sd_csize").on("change", () => size_change("sd"));
  settingsModal.find("#novelai_size").on("change", () => size_change("novelai"));
  settingsModal.find("#comfyui_size").on("change", () => size_change("comfyui"));
  const allIDs = Object.keys(defaultSettings);
  const ignoreIDs = ["yushe", "yusheid", "fixedPrompt", "fixedPrompt_end", "negativePrompt", "workers", "workerid", "worker", "themes", "theme_id", "prompt_replace", "prompt_replace_id", "prompt_replace_text", "UCP", "AQT", "nai3CharRef", "worldBookList", "worldBookList_id", "worldbook_content", "insertOriginalText", "convertToJpegStorage", "randomYushe", "randomVibeGroup", "enablePregen", "zidongdianji", "zidongdianji2"];
  $("#InformationExtracted, #InformationExtracted_range").on("input", (event) => {
    const value = $(event.target).val();
    $("#InformationExtracted").val(value);
    $("#InformationExtracted_range").val(value);
    settings2.InformationExtracted = value;
    saveSettingsDebounced();
  });
  $("#ReferenceStrength, #ReferenceStrength_range").on("input", (event) => {
    const value = $(event.target).val();
    $("#ReferenceStrength").val(value);
    $("#ReferenceStrength_range").val(value);
    settings2.ReferenceStrength = value;
    saveSettingsDebounced();
  });
  const CHATU8_IMAGE_REGEX_SCRIPT_NAME = "st-chatu8-\u4E0D\u53D1\u9001image\u6807\u7B7E";
  const CHATU8_IMAGE_REGEX_SCRIPT = {
    scriptName: CHATU8_IMAGE_REGEX_SCRIPT_NAME,
    findRegex: "/<image>[\\s\\S]*?<\\/image>/g",
    replaceString: "",
    trimStrings: [],
    placement: [1, 2],
    disabled: false,
    markdownOnly: false,
    promptOnly: true,
    runOnEdit: true,
    substituteRegex: 0,
    minDepth: null,
    maxDepth: null
  };
  const CHATU8_IMGTHINK_REGEX_SCRIPT_NAME = "st-chatu8-\u9690\u85CFimgthink";
  const CHATU8_IMGTHINK_REGEX_SCRIPT = {
    scriptName: CHATU8_IMGTHINK_REGEX_SCRIPT_NAME,
    findRegex: "/<imgthink>[\\s\\S]*?<\\/imgthink>/g",
    replaceString: "",
    trimStrings: [],
    placement: [2],
    disabled: false,
    markdownOnly: true,
    promptOnly: true,
    runOnEdit: true,
    substituteRegex: 0,
    minDepth: null,
    maxDepth: null
  };
  async function handleInsertOriginalTextRegex(enable) {
    if (!enable) return;
    try {
      const regexEngine = await import("../../regex/engine.js");
      if (!regexEngine.getScriptsByType || !regexEngine.SCRIPT_TYPES) {
        console.warn("[Chatu8] ST \u6B63\u5219\u5F15\u64CE\u7248\u672C\u8FC7\u65E7\uFF0C\u65E0\u6CD5\u81EA\u52A8\u7BA1\u7406\u6B63\u5219\u811A\u672C");
        return;
      }
      const globalScripts = regexEngine.getScriptsByType(regexEngine.SCRIPT_TYPES.GLOBAL) || [];
      const existingImageScript = globalScripts.find((s) => s.scriptName === CHATU8_IMAGE_REGEX_SCRIPT_NAME);
      const existingImgthinkScript = globalScripts.find((s) => s.scriptName === CHATU8_IMGTHINK_REGEX_SCRIPT_NAME);
      let needsSave = false;
      const createdScripts = [];
      if (!existingImageScript) {
        const newScript = {
          ...CHATU8_IMAGE_REGEX_SCRIPT,
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2)
        };
        globalScripts.push(newScript);
        needsSave = true;
        createdScripts.push(CHATU8_IMAGE_REGEX_SCRIPT_NAME);
        console.log("[Chatu8] \u5DF2\u521B\u5EFA\u5168\u5C40\u6B63\u5219\u811A\u672C:", CHATU8_IMAGE_REGEX_SCRIPT_NAME);
      }
      if (!existingImgthinkScript) {
        const newScript = {
          ...CHATU8_IMGTHINK_REGEX_SCRIPT,
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2)
        };
        globalScripts.push(newScript);
        needsSave = true;
        createdScripts.push(CHATU8_IMGTHINK_REGEX_SCRIPT_NAME);
        console.log("[Chatu8] \u5DF2\u521B\u5EFA\u5168\u5C40\u6B63\u5219\u811A\u672C:", CHATU8_IMGTHINK_REGEX_SCRIPT_NAME);
      }
      if (needsSave) {
        await regexEngine.saveScriptsByType(globalScripts, regexEngine.SCRIPT_TYPES.GLOBAL);
        const { saveSettingsDebounced: stSaveSettings } = await import("../../../../../../script.js");
        stSaveSettings();
        let countdown = 6;
        const toastId = `chatu8-refresh-${Date.now()}`;
        const toastHtml = `
                    <div id="${toastId}" style="text-align: center; padding: 10px 5px; line-height: 1.6;">
                        <div style="margin-bottom: 15px; word-break: break-word;">
                            <b>\u5DF2\u521B\u5EFA\u5168\u5C40\u6B63\u5219\uFF1A</b><br/>
                            ${createdScripts.join("<br/>")}
                        </div>
                        <div style="margin-bottom: 20px;">
                            \u5C06\u5728 <span id="${toastId}-timer" style="font-weight:bold; font-size:1.4em; color: var(--SmartThemeAlertColor, #ff9999);">${countdown}</span> \u79D2\u540E\u81EA\u52A8\u5237\u65B0\u9875\u9762\u4EE5\u751F\u6548
                        </div>
                        <button id="${toastId}-cancel" class="menu_button" style="white-space: nowrap; width: fit-content; margin: 0 auto; padding: 8px 24px; display: block; border-radius: 5px; font-weight: bold;">\u53D6\u6D88\u81EA\u52A8\u5237\u65B0</button>
                    </div>
                `;
        const toastrOpts = { timeOut: 0, extendedTimeOut: 0, tapToDismiss: false, escapeHtml: false };
        const $toast = toastr.success(toastHtml, "\u81EA\u52A8\u8BBE\u7F6E\u6B63\u5219", toastrOpts);
        const intervalId = setInterval(() => {
          countdown--;
          const timerEl = document.getElementById(`${toastId}-timer`);
          if (timerEl) timerEl.innerText = countdown;
          if (countdown <= 0) {
            clearInterval(intervalId);
            location.reload();
          }
        }, 1e3);
        $(document).one("click", `#${toastId}-cancel`, function(e) {
          e.preventDefault();
          e.stopPropagation();
          clearInterval(intervalId);
          $(this).closest(".toast").remove();
          if ($toast && $toast.length) {
            toastr.clear($toast);
          }
          toastr.info("\u5DF2\u53D6\u6D88\u81EA\u52A8\u5237\u65B0\uFF0C\u9700\u624B\u52A8\u5237\u65B0\u9875\u9762\u540E\u751F\u6548\u3002");
        });
      } else {
        toastr.info("\u5168\u5C40\u6B63\u5219\u5DF2\u5B58\u5728");
      }
    } catch (error) {
      console.error("[Chatu8] \u521B\u5EFA ST \u6B63\u5219\u811A\u672C\u5931\u8D25:", error);
    }
  }
  settingsModal.on("change", "#helpTipsEnabled", function() {
    const isEnabled = $(this).prop("checked");
    settings2.helpTipsEnabled = isEnabled ? "true" : "false";
    saveSettingsDebounced();
    const container = settingsModal[0]?.querySelector(".st-chatu8-content");
    if (!container) return;
    if (isEnabled) {
      injectHelpTips(container);
    } else {
      removeHelpTips(container);
    }
  });
  settingsModal.find("#insertOriginalText").on("change", async function() {
    const isEnabled = $(this).prop("checked");
    settings2.insertOriginalText = isEnabled.toString();
    saveSettingsDebounced();
    await handleInsertOriginalTextRegex(isEnabled);
  });
  settingsModal.find("#convertToJpegStorage").on("change", function() {
    const isEnabled = $(this).prop("checked");
    settings2.convertToJpegStorage = isEnabled.toString();
    saveSettingsDebounced();
    if (isEnabled) {
      toastr.info("\u65B0\u56FE\u7247\u5C06\u4EE5JPEG\u683C\u5F0F\u50A8\u5B58\uFF0C\u53EF\u8282\u7701\u7EA670%\u7A7A\u95F4", "JPEG\u50A8\u5B58\u5DF2\u542F\u7528");
      addLog("[\u7F13\u5B58] JPEG\u50A8\u5B58\u5DF2\u542F\u7528\uFF0C\u8D28\u91CF: 0.78");
    } else {
      addLog("[\u7F13\u5B58] JPEG\u50A8\u5B58\u5DF2\u5173\u95ED");
    }
  });
  settingsModal.find("#autoLLMImageGen").on("change", async function() {
    const isEnabled = $(this).prop("checked");
    settings2.autoLLMImageGen = isEnabled.toString();
    saveSettingsDebounced();
    if (isEnabled) {
      const changes = [];
      const insertTextSwitch = settingsModal.find("#insertOriginalText");
      if (insertTextSwitch.length && !insertTextSwitch.prop("checked")) {
        insertTextSwitch.prop("checked", true);
        settings2.insertOriginalText = "true";
        saveSettingsDebounced();
        await handleInsertOriginalTextRegex(true);
        changes.push('\u5DF2\u5F00\u542F"\u63D2\u5165\u539F\u6587(\u975E\u540C\u5C42)"');
      }
      if (changes.length > 0) {
        toastr.info(changes.join("\uFF0C"), "\u81EA\u52A8LLM\u8BF7\u6C42\u751F\u56FE\u5DF2\u542F\u7528");
      }
    }
  });
  settingsModal.find("#randomYushe").on("change", function() {
    const isEnabled = $(this).prop("checked");
    settings2.randomYushe = isEnabled.toString();
    saveSettingsDebounced();
    if (isEnabled) {
      const yusheKeys = Object.keys(settings2.yushe || {});
      toastr.info(`\u5F53\u524D\u5171\u6709 ${yusheKeys.length} \u4E2A\u63D0\u793A\u8BCD\u9884\u8BBE\uFF0C\u6BCF\u6B21\u751F\u56FE\u5C06\u968F\u673A\u9009\u62E9`, "\u968F\u673A\u9884\u8BBE\u5DF2\u542F\u7528");
      addLog("[\u968F\u673A\u9884\u8BBE] \u5DF2\u542F\u7528\uFF0C\u6BCF\u6B21\u751F\u56FE\u5C06\u4ECE\u9884\u8BBE\u4E2D\u968F\u673A\u9009\u62E9");
    } else {
      addLog("[\u968F\u673A\u9884\u8BBE] \u5DF2\u5173\u95ED\uFF0C\u5C06\u4F7F\u7528\u56FA\u5B9A\u9884\u8BBE");
    }
  });
  settingsModal.find("#enablePregen").on("change", function() {
    const isEnabled = $(this).prop("checked");
    settings2.enablePregen = isEnabled.toString();
    saveSettingsDebounced();
    if (isEnabled) {
      let hasAutoClickTurnedOff = false;
      if (String(settings2.zidongdianji) === "true" || String(settings2.zidongdianji2) === "true") {
        settings2.zidongdianji = "false";
        settings2.zidongdianji2 = "false";
        const $zd1 = settingsModal.find("#zidongdianji");
        const $zd2 = settingsModal.find("#zidongdianji2");
        if ($zd1.length) $zd1.prop("checked", false);
        if ($zd2.length) $zd2.prop("checked", false);
        hasAutoClickTurnedOff = true;
        saveSettingsDebounced();
      }
      if (hasAutoClickTurnedOff) {
        toastr.info("\u5DF2\u5F00\u542F\u300C\u542F\u7528\u6D41\u5F0F\u9884\u751F\u6210\u300D\uFF0C\u5DF2\u81EA\u52A8\u5173\u95ED\u300C\u81EA\u52A8\u70B9\u51FB\u751F\u6210\u300D\u4EE5\u907F\u514D\u529F\u80FD\u91CD\u590D", "\u529F\u80FD\u4E92\u65A5\u63D0\u793A");
        addLog("[\u8BBE\u7F6E] \u5F00\u542F\u6D41\u5F0F\u9884\u751F\u6210\uFF0C\u5DF2\u81EA\u52A8\u5173\u95ED\u81EA\u52A8\u70B9\u51FB");
      } else {
        addLog("[\u8BBE\u7F6E] \u5F00\u542F\u6D41\u5F0F\u9884\u751F\u6210");
      }
    } else {
      addLog("[\u8BBE\u7F6E] \u5173\u95ED\u6D41\u5F0F\u9884\u751F\u6210");
    }
  });
  settingsModal.find("#zidongdianji").on("change", function() {
    const isEnabled = $(this).prop("checked");
    settings2.zidongdianji = isEnabled.toString();
    saveSettingsDebounced();
    if (isEnabled) {
      let hasPregenTurnedOff = false;
      if (String(settings2.enablePregen) === "true") {
        settings2.enablePregen = "false";
        const $pregen = settingsModal.find("#enablePregen");
        if ($pregen.length) $pregen.prop("checked", false);
        hasPregenTurnedOff = true;
        saveSettingsDebounced();
      }
      if (hasPregenTurnedOff) {
        toastr.info("\u5DF2\u5F00\u542F\u300C\u81EA\u52A8\u70B9\u51FB\u751F\u6210\u300D\uFF0C\u5DF2\u81EA\u52A8\u5173\u95ED\u300C\u542F\u7528\u6D41\u5F0F\u9884\u751F\u6210\u300D\u4EE5\u907F\u514D\u529F\u80FD\u91CD\u590D", "\u529F\u80FD\u4E92\u65A5\u63D0\u793A");
        addLog("[\u8BBE\u7F6E] \u5F00\u542F\u81EA\u52A8\u70B9\u51FB\u751F\u6210\uFF0C\u5DF2\u81EA\u52A8\u5173\u95ED\u6D41\u5F0F\u9884\u751F\u6210");
      } else {
        addLog("[\u8BBE\u7F6E] \u5F00\u542F\u81EA\u52A8\u70B9\u51FB\u751F\u6210");
      }
    } else {
      addLog("[\u8BBE\u7F6E] \u5173\u95ED\u81EA\u52A8\u70B9\u51FB\u751F\u6210");
    }
  });
  settingsModal.find("#zidongdianji2").on("change", function() {
    const isEnabled = $(this).prop("checked");
    settings2.zidongdianji2 = isEnabled.toString();
    saveSettingsDebounced();
    if (isEnabled) {
      let hasPregenTurnedOff = false;
      if (String(settings2.enablePregen) === "true") {
        settings2.enablePregen = "false";
        const $pregen = settingsModal.find("#enablePregen");
        if ($pregen.length) $pregen.prop("checked", false);
        hasPregenTurnedOff = true;
        saveSettingsDebounced();
      }
      if (hasPregenTurnedOff) {
        toastr.info("\u5DF2\u5F00\u542F\u300C\u81EA\u52A8\u70B9\u51FB(\u6CA1\u4E8B\u522B\u5F00)\u300D\uFF0C\u5DF2\u81EA\u52A8\u5173\u95ED\u300C\u542F\u7528\u6D41\u5F0F\u9884\u751F\u6210\u300D\u4EE5\u907F\u514D\u529F\u80FD\u91CD\u590D", "\u529F\u80FD\u4E92\u65A5\u63D0\u793A");
        addLog("[\u8BBE\u7F6E] \u5F00\u542F\u9AD8\u7EA7\u81EA\u52A8\u70B9\u51FB\uFF0C\u5DF2\u81EA\u52A8\u5173\u95ED\u6D41\u5F0F\u9884\u751F\u6210");
      } else {
        addLog("[\u8BBE\u7F6E] \u5F00\u542F\u9AD8\u7EA7\u81EA\u52A8\u70B9\u51FB");
      }
    } else {
      addLog("[\u8BBE\u7F6E] \u5173\u95ED\u9AD8\u7EA7\u81EA\u52A8\u70B9\u51FB");
    }
  });
  $("#enable_chatu8_fab").on("change", (event) => {
    settings2.enable_chatu8_fab = $(event.target).prop("checked").toString();
    saveSettingsDebounced();
    applyFabSettings();
  });
  $("#enable_chatu8_fab_video").on("change", (event) => {
    settings2.enable_chatu8_fab_video = $(event.target).prop("checked");
    saveSettingsDebounced();
    toggleTraditionalFabSettings();
    applyFabSettings();
  });
  let pipVideoElement = null;
  $("#enable_chatu8_desktop_pet").on("change", async (event) => {
    const checked = $(event.target).prop("checked");
    settings2.enable_chatu8_desktop_pet = checked;
    saveSettingsDebounced();
    if (checked) {
      try {
        const videoPlayer = getGlobalVideoPlayer();
        if (!videoPlayer || !videoPlayer.setPipBackground) {
          toastr.error("\u672A\u627E\u5230\u89C6\u9891\u64AD\u653E\u5668\uFF0C\u8BF7\u5148\u542F\u7528\u89C6\u9891\u5F62\u8C61", "\u72EC\u7ACB\u7A97\u53E3");
          $(event.target).prop("checked", false);
          settings2.enable_chatu8_desktop_pet = false;
          saveSettingsDebounced();
          return;
        }
        const glCanvas = document.getElementById("st-chatu8-fab-video-canvas");
        if (!glCanvas) {
          toastr.error("\u672A\u627E\u5230\u89C6\u9891\u753B\u5E03\u5143\u7D20\uFF0C\u8BF7\u5148\u542F\u7528\u89C6\u9891\u5F62\u8C61", "\u72EC\u7ACB\u7A97\u53E3");
          $(event.target).prop("checked", false);
          settings2.enable_chatu8_desktop_pet = false;
          saveSettingsDebounced();
          return;
        }
        videoPlayer.setPipBackground(true);
        const stream = glCanvas.captureStream(30);
        pipVideoElement = document.createElement("video");
        pipVideoElement.id = "st-chatu8-pip-video";
        pipVideoElement.srcObject = stream;
        pipVideoElement.muted = true;
        pipVideoElement.autoplay = true;
        pipVideoElement.playsInline = true;
        pipVideoElement.style.display = "none";
        pipVideoElement.style.position = "fixed";
        pipVideoElement.style.opacity = "0";
        pipVideoElement.style.pointerEvents = "none";
        pipVideoElement.width = glCanvas.width || 200;
        pipVideoElement.height = glCanvas.height || 200;
        document.body.appendChild(pipVideoElement);
        await pipVideoElement.play();
        await pipVideoElement.requestPictureInPicture();
        pipVideoElement.addEventListener("leavepictureinpicture", () => {
          const vp = getGlobalVideoPlayer();
          if (vp && vp.setPipBackground) {
            vp.setPipBackground(false);
          }
          if (pipVideoElement) {
            pipVideoElement.srcObject = null;
            pipVideoElement.remove();
            pipVideoElement = null;
          }
          settings2.enable_chatu8_desktop_pet = false;
          $("#enable_chatu8_desktop_pet").prop("checked", false);
          saveSettingsDebounced();
          toastr.info("\u753B\u4E2D\u753B\u5DF2\u5173\u95ED\uFF0C\u667A\u7ED8\u59EC\u56DE\u5230\u6D4F\u89C8\u5668\u5185", "\u72EC\u7ACB\u7A97\u53E3");
        });
        toastr.success("\u667A\u7ED8\u59EC\u5DF2\u5F39\u51FA\u5230\u753B\u4E2D\u753B\u7A97\u53E3\uFF0C\u53EF\u7F6E\u9876\u663E\u793A\u5728\u5176\u4ED6\u5E94\u7528\u4E0A\u65B9", "\u72EC\u7ACB\u7A97\u53E3");
      } catch (err) {
        console.error("[st-chatu8] \u521B\u5EFA\u753B\u4E2D\u753B\u5931\u8D25:", err);
        const vp = getGlobalVideoPlayer();
        if (vp && vp.setPipBackground) {
          vp.setPipBackground(false);
        }
        if (pipVideoElement) {
          pipVideoElement.srcObject = null;
          pipVideoElement.remove();
          pipVideoElement = null;
        }
        $(event.target).prop("checked", false);
        settings2.enable_chatu8_desktop_pet = false;
        saveSettingsDebounced();
        if (err.name === "NotAllowedError") {
          toastr.warning(
            "\u753B\u4E2D\u753B\u8BF7\u6C42\u88AB\u62D2\u7EDD\u3002\u8BF7\u786E\u4FDD\u901A\u8FC7\u7528\u6237\u64CD\u4F5C\uFF08\u5982\u70B9\u51FB\uFF09\u89E6\u53D1\uFF0C\u4E14\u6D4F\u89C8\u5668\u5141\u8BB8\u753B\u4E2D\u753B\u3002",
            "\u72EC\u7ACB\u7A97\u53E3",
            { timeOut: 5e3 }
          );
        } else {
          toastr.error(
            "\u521B\u5EFA\u753B\u4E2D\u753B\u5931\u8D25\uFF1A" + err.message,
            "\u72EC\u7ACB\u7A97\u53E3",
            { timeOut: 5e3 }
          );
        }
      }
    } else {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture().catch(() => {
        });
      }
      const vp = getGlobalVideoPlayer();
      if (vp && vp.setPipBackground) {
        vp.setPipBackground(false);
      }
      if (pipVideoElement) {
        pipVideoElement.srcObject = null;
        pipVideoElement.remove();
        pipVideoElement = null;
      }
      toastr.info("\u667A\u7ED8\u59EC\u753B\u4E2D\u753B\u5DF2\u5173\u95ED", "\u72EC\u7ACB\u7A97\u53E3");
    }
  });
  function toggleTraditionalFabSettings() {
    const videoEnabled = settings2.enable_chatu8_fab_video === true;
    const traditionalSettings = $("#fab-traditional-settings");
    const desktopPetSettings = $("#fab-desktop-pet-settings");
    if (videoEnabled) {
      traditionalSettings.hide();
      desktopPetSettings.show();
    } else {
      traditionalSettings.show();
      desktopPetSettings.hide();
      if (settings2.enable_chatu8_desktop_pet) {
        settings2.enable_chatu8_desktop_pet = false;
        $("#enable_chatu8_desktop_pet").prop("checked", false);
        saveSettingsDebounced();
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(() => {
          });
        }
        if (pipVideoElement && pipVideoElement._compositeRafId) {
          cancelAnimationFrame(pipVideoElement._compositeRafId);
        }
        if (pipVideoElement && pipVideoElement._compositeCanvas) {
          pipVideoElement._compositeCanvas.remove();
        }
        if (pipVideoElement) {
          pipVideoElement.srcObject = null;
          pipVideoElement.remove();
          pipVideoElement = null;
        }
      }
    }
  }
  $("#chatu8_fab_theme").on("change", (event) => {
    const themeName = $(event.target).val();
    settings2.chatu8_fab_theme = themeName;
    if (themeName !== "\u81EA\u5B9A\u4E49" && settings2.fabThemes && settings2.fabThemes[themeName]) {
      const theme = settings2.fabThemes[themeName];
      settings2.chatu8_fab_bg_color = theme.bgColor;
      settings2.chatu8_fab_icon_color = theme.iconColor;
      settings2.chatu8_fab_opacity = theme.opacity;
      $("#chatu8_fab_bg_color").val(theme.bgColor);
      $("#chatu8_fab_icon_color").val(theme.iconColor);
      $("#chatu8_fab_opacity").val(theme.opacity);
      $("#chatu8_fab_opacity_value").val(theme.opacity);
    }
    saveSettingsDebounced();
    applyFabSettings();
  });
  $("#chatu8_fab_bg_color").on("change", (event) => {
    settings2.chatu8_fab_bg_color = $(event.target).val();
    if (settings2.chatu8_fab_theme !== "\u81EA\u5B9A\u4E49") {
      settings2.chatu8_fab_theme = "\u81EA\u5B9A\u4E49";
      if (settings2.fabThemes && settings2.fabThemes["\u81EA\u5B9A\u4E49"]) {
        settings2.fabThemes["\u81EA\u5B9A\u4E49"].bgColor = settings2.chatu8_fab_bg_color;
      }
      $("#chatu8_fab_theme").val("\u81EA\u5B9A\u4E49");
    }
    saveSettingsDebounced();
    applyFabSettings();
  });
  $("#chatu8_fab_icon_color").on("change", (event) => {
    settings2.chatu8_fab_icon_color = $(event.target).val();
    if (settings2.chatu8_fab_theme !== "\u81EA\u5B9A\u4E49") {
      settings2.chatu8_fab_theme = "\u81EA\u5B9A\u4E49";
      if (settings2.fabThemes && settings2.fabThemes["\u81EA\u5B9A\u4E49"]) {
        settings2.fabThemes["\u81EA\u5B9A\u4E49"].iconColor = settings2.chatu8_fab_icon_color;
      }
      $("#chatu8_fab_theme").val("\u81EA\u5B9A\u4E49");
    }
    saveSettingsDebounced();
    applyFabSettings();
  });
  $("#chatu8_fab_icon_upload_btn").on("click", () => {
    document.getElementById("chatu8_fab_icon_upload_input")?.click();
  });
  $("#chatu8_fab_icon_upload_input").on("change", handleFabIconUpload);
  $("#chatu8_fab_icon_remove_btn").on("click", removeFabIconImage);
  $("#chatu8_fab_opacity, #chatu8_fab_opacity_value").on("input", (event) => {
    const value = parseFloat($(event.target).val());
    $("#chatu8_fab_opacity").val(value);
    $("#chatu8_fab_opacity_value").val(value);
    settings2.chatu8_fab_opacity = value;
    if (settings2.chatu8_fab_theme !== "\u81EA\u5B9A\u4E49") {
      settings2.chatu8_fab_theme = "\u81EA\u5B9A\u4E49";
      if (settings2.fabThemes && settings2.fabThemes["\u81EA\u5B9A\u4E49"]) {
        settings2.fabThemes["\u81EA\u5B9A\u4E49"].opacity = value;
      }
      $("#chatu8_fab_theme").val("\u81EA\u5B9A\u4E49");
    }
    saveSettingsDebounced();
    applyFabSettings();
  });
  function centerFabPosition() {
    const fab = document.getElementById("st-chatu8-fab");
    if (!fab) return;
    const fabWidth = fab.offsetWidth;
    const fabHeight = fab.offsetHeight;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const centerLeft = (screenWidth - fabWidth) / 2;
    const centerTop = (screenHeight - fabHeight) / 2;
    fab.style.left = `${centerLeft}px`;
    fab.style.top = `${centerTop}px`;
    const isMobile3 = window.innerWidth <= 768;
    if (isMobile3) {
      settings2.chatu8_fab_position.mobile.top = fab.style.top;
      settings2.chatu8_fab_position.mobile.left = fab.style.left;
    } else {
      settings2.chatu8_fab_position.desktop.top = fab.style.top;
      settings2.chatu8_fab_position.desktop.left = fab.style.left;
    }
    saveSettingsDebounced();
  }
  $("#chatu8_fab_size, #chatu8_fab_size_value").on("input", (event) => {
    const value = parseInt($(event.target).val(), 10);
    $("#chatu8_fab_size").val(value);
    $("#chatu8_fab_size_value").val(value);
    if (typeof settings2.chatu8_fab_size === "number" || typeof settings2.chatu8_fab_size === "string") {
      const numValue = typeof settings2.chatu8_fab_size === "string" ? parseInt(settings2.chatu8_fab_size, 10) : settings2.chatu8_fab_size;
      settings2.chatu8_fab_size = {
        desktop: numValue,
        mobile: numValue
      };
    }
    const isMobile3 = window.innerWidth <= 768;
    if (isMobile3) {
      settings2.chatu8_fab_size.mobile = value;
    } else {
      settings2.chatu8_fab_size.desktop = value;
    }
    saveSettingsDebounced();
    updateFabSize(value);
    setTimeout(() => {
      centerFabPosition();
    }, 50);
  });
  $("#chatu8_fab_reset_position").on("click", () => {
    centerFabPosition();
    showToast("\u667A\u7ED8\u59EC\u4F4D\u7F6E\u5DF2\u91CD\u7F6E\u5230\u5C4F\u5E55\u4E2D\u592E", "success");
  });
  allIDs.forEach((key) => {
    if (ignoreIDs.includes(key)) return;
    const selector = generationTabs3.reduce((acc, mode) => {
      const suffix = getSuffix(mode);
      if (document.getElementById(key + suffix)) {
        acc.push(`#${key}${suffix}`);
      }
      return acc;
    }, [`#${key}`]).join(", ");
    const element = $(selector);
    if (element.length) {
      const elType = element.prop("type");
      const event = elType === "text" || elType === "number" || element.is("textarea") ? "input" : "change";
      element.on(event, function() {
        let value;
        if (elType === "checkbox") {
          value = $(this).prop("checked").toString();
        } else {
          value = $(this).val();
        }
        if (key === "sdUrl" || key === "comfyuiUrl") {
          value = removeTrailingSlash(value);
          validateUrlInput(this);
        }
        if (key === "MODEL_NAME") {
          value = normalizeBackslashPath3(value);
          $(this).val(value);
        }
        const settingKey = key;
        settings2[settingKey] = value;
        if (settingKey == "scriptEnabled") {
          let conet = getContext();
          const settings3 = extension_settings[extensionName];
          if (conet && conet.chatId) {
            if (!conet.chatMetadata) conet.chatMetadata = {};
            if (!conet.chatMetadata.variables) conet.chatMetadata.variables = {};
            conet.chatMetadata.variables.zhihuiji = settings3.scriptEnabled;
          }
          updateGenerationModeHandlers();
        }
        saveSettingsDebounced();
        if (settingKey === "mode") {
          updateGenerationModeHandlers();
          updateKeepAliveStatus();
          updateModeNavVisibility(settingsModal);
        }
        if (settingKey === "videoChannel") {
          updateModeNavVisibility(settingsModal);
        }
        if (settingKey === "comfyui_max_concurrency") {
          const parsedMax = parseInt(value, 10);
          if (!isNaN(parsedMax) && parsedMax > 0) {
            comfyuiConcurrencyLock.setMaxConcurrency(parsedMax);
          }
        }
        if (settingKey === "imageAlignment" || settingKey === "imageSizeScale") {
          const currentTheme = settings2.themes?.[settings2.theme_id] || {};
          applyImageFrameStyle(settings2.image_frame_style || "\u65E0\u6837\u5F0F", isThemeDark(currentTheme));
        }
        if (element.length > 1) {
          element.not(this).val(value);
        }
      });
    }
  });
  settingsModal.find("#nai3CharRef").on("change", function() {
    const checkbox = $(this);
    if (checkbox.prop("checked")) {
      stylishConfirm("\u4E0D\u5EFA\u8BAE\u4F7F\u7528\uFF0C\u6BCF\u591A\u4E00\u5F20\u53C2\u8003\u56FE\u7247\u5C31\u591A\u6536\u8D395\u70B9\uFF0C\u6BCF\u6B21\u751F\u56FE\u6536\u8D39\u4E00\u6B21\uFF01").then((confirmed) => {
        if (confirmed) {
          settings2.nai3CharRef = "true";
          if (settings2.enableVibeGroupTransfer === "true") {
            settings2.enableVibeGroupTransfer = "false";
            const vibeToggle = settingsModal.find("#enableVibeGroupTransfer");
            if (vibeToggle.length) {
              vibeToggle.prop("checked", false);
            }
            toastr.info("Vibe Transfer \u5DF2\u81EA\u52A8\u5173\u95ED\uFF0C\u56E0\u4E3A\u89D2\u8272\u53C2\u8003\u5DF2\u542F\u7528", "\u89D2\u8272\u53C2\u8003");
            addLog("[CharRef] Vibe Transfer disabled due to Character Reference activation");
          }
          saveSettingsDebounced();
        } else {
          checkbox.prop("checked", false);
        }
      });
    } else {
      settings2.nai3CharRef = "false";
      saveSettingsDebounced();
    }
  });
  settingsModal.find("#enableVibeGroupTransfer").on("change", function() {
    const isEnabled = $(this).prop("checked");
    settings2.enableVibeGroupTransfer = isEnabled ? "true" : "false";
    if (isEnabled && settings2.nai3VibeTransfer === "true") {
      settings2.nai3VibeTransfer = "false";
      const singleVibeToggle = settingsModal.find("#nai3VibeTransfer");
      if (singleVibeToggle.length) {
        singleVibeToggle.prop("checked", false);
      }
      console.log("[VibeGroup] Disabled single Vibe transfer (mutual exclusivity)");
    }
    if (isEnabled && settings2.nai3CharRef === "true") {
      settings2.nai3CharRef = "false";
      const charRefToggle = settingsModal.find("#nai3CharRef");
      if (charRefToggle.length) {
        charRefToggle.prop("checked", false);
      }
      toastr.info("\u89D2\u8272\u53C2\u8003\u5DF2\u81EA\u52A8\u5173\u95ED\uFF0C\u56E0\u4E3A Vibe Transfer \u5DF2\u542F\u7528", "Vibe Transfer");
      addLog("[VibeTransfer] Character Reference disabled due to Vibe Transfer activation");
    }
    saveSettingsDebounced();
    console.log("[VibeGroup] Vibe group transfer:", settings2.enableVibeGroupTransfer);
  });
  settingsModal.find("#randomVibeGroup").on("change", function() {
    const isEnabled = $(this).prop("checked");
    settings2.randomVibeGroup = isEnabled ? "true" : "false";
    saveSettingsDebounced();
    if (isEnabled) {
      const vibeGroups = settings2.vibeGroups || {};
      const usableCount = Object.keys(vibeGroups).filter(
        (key) => Array.isArray(vibeGroups[key]?.vibes) && vibeGroups[key].vibes.length > 0
      ).length;
      if (usableCount === 0) {
        toastr.warning("\u5F53\u524D\u6CA1\u6709\u5305\u542B Vibe \u7684\u7EC4\uFF0C\u8BF7\u5148\u5728 Vibe \u7EC4\u7F16\u8F91\u5668\u4E2D\u6DFB\u52A0", "\u968F\u673A Vibe \u7EC4");
      } else {
        toastr.info(`\u5F53\u524D\u5171\u6709 ${usableCount} \u4E2A\u975E\u7A7A Vibe \u7EC4\uFF0C\u6BCF\u6B21\u751F\u56FE\u5C06\u968F\u673A\u9009\u62E9`, "\u968F\u673A Vibe \u7EC4\u5DF2\u542F\u7528");
      }
      addLog(`[\u968F\u673AVibe\u7EC4] \u5DF2\u542F\u7528\uFF0C\u6BCF\u6B21\u751F\u56FE\u5C06\u4ECE ${usableCount} \u4E2A\u975E\u7A7A\u7EC4\u4E2D\u968F\u673A\u9009\u62E9`);
      if (settings2.enableVibeGroupTransfer !== "true") {
        toastr.warning('\u8BF7\u540C\u65F6\u542F\u7528"Vibe \u7EC4\u6C1B\u56F4\u8F6C\u79FB"\uFF0C\u5426\u5219\u968F\u673A\u7EC4\u4E0D\u4F1A\u751F\u6548', "\u968F\u673A Vibe \u7EC4");
      }
    } else {
      addLog("[\u968F\u673AVibe\u7EC4] \u5DF2\u5173\u95ED\uFF0C\u5C06\u4F7F\u7528\u56FA\u5B9A\u9009\u4E2D\u7684\u7EC4");
    }
  });
  settingsModal.find("#nai3VibeTransfer").on("change", function() {
    const isEnabled = $(this).prop("checked");
    settings2.nai3VibeTransfer = isEnabled ? "true" : "false";
    if (isEnabled && settings2.enableVibeGroupTransfer === "true") {
      settings2.enableVibeGroupTransfer = "false";
      const groupVibeToggle = settingsModal.find("#enableVibeGroupTransfer");
      if (groupVibeToggle.length) {
        groupVibeToggle.prop("checked", false);
      }
      console.log("[VibeGroup] Disabled Vibe group transfer (mutual exclusivity)");
    }
    saveSettingsDebounced();
    console.log("[NovelAI] Single Vibe transfer:", settings2.nai3VibeTransfer);
  });
  window.addEventListener("comfyui-cache-updated", async (event) => {
    const cacheData = event.detail;
    const changedSettings = { comfyuiCache: cacheData };
    const { refreshAffectedUI: refreshAffectedUI2 } = await import("./configHelper/configUIRefresh.js");
    refreshAffectedUI2(changedSettings);
    console.log("[UI] ComfyUI cache \u5DF2\u66F4\u65B0\u5E76\u5237\u65B0 UI");
  });
  window.addEventListener("sd-cache-updated", async (event) => {
    const cacheData = event.detail;
    const changedSettings = { sdCache: cacheData };
    const { refreshAffectedUI: refreshAffectedUI2 } = await import("./configHelper/configUIRefresh.js");
    refreshAffectedUI2(changedSettings);
    console.log("[UI] SD cache \u5DF2\u66F4\u65B0\u5E76\u5237\u65B0 UI");
  });
}

export function __set_currentCloudQueueInfo(v) { currentCloudQueueInfo = v; }

export function __set__chartResizeObserver(v) { _chartResizeObserver = v; }

export function __set__currentPeriod(v) { _currentPeriod = v; }

export function __set_cachedTagTreeData(v) { cachedTagTreeData = v; }

export function __set_VOCABULARY_FILE_LIST(v) { VOCABULARY_FILE_LIST = v; }

export function __set_VOCABULARY_INSTALL_ALL_BTN(v) { VOCABULARY_INSTALL_ALL_BTN = v; }

export function __set_VOCABULARY_UNINSTALL_ALL_BTN(v) { VOCABULARY_UNINSTALL_ALL_BTN = v; }

export function __set_VOCABULARY_SEARCH_INPUT(v) { VOCABULARY_SEARCH_INPUT = v; }

export function __set_VOCABULARY_SEARCH_BTN(v) { VOCABULARY_SEARCH_BTN = v; }

export function __set_VOCABULARY_SEARCH_RESULTS(v) { VOCABULARY_SEARCH_RESULTS = v; }

export function __set_VOCABULARY_TREE_CONTAINER(v) { VOCABULARY_TREE_CONTAINER = v; }

export function __set_VOCABULARY_SEARCH_STARTSWITH(v) { VOCABULARY_SEARCH_STARTSWITH = v; }

export function __set_VOCABULARY_SEARCH_LIMIT(v) { VOCABULARY_SEARCH_LIMIT = v; }

export function __set_VOCABULARY_SEARCH_SORT(v) { VOCABULARY_SEARCH_SORT = v; }

export function __set_VOCABULARY_SELECTED_TAGS(v) { VOCABULARY_SELECTED_TAGS = v; }

export function __set_VOCABULARY_TAG_BACKSPACE(v) { VOCABULARY_TAG_BACKSPACE = v; }

export function __set_VOCABULARY_TAG_CLEAR(v) { VOCABULARY_TAG_CLEAR = v; }

export function __set_VOCABULARY_TAG_COPY(v) { VOCABULARY_TAG_COPY = v; }

export function __set_VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT(v) { VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT = v; }

export function __set_VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT(v) { VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT = v; }

export function __set_VOCABULARY_MANUAL_TAG_ADD_BTN(v) { VOCABULARY_MANUAL_TAG_ADD_BTN = v; }

export function __set_VOCABULARY_MANUAL_TAGS_LIST(v) { VOCABULARY_MANUAL_TAGS_LIST = v; }

export function __set_VOCABULARY_MANUAL_TAGS_REFRESH_BTN(v) { VOCABULARY_MANUAL_TAGS_REFRESH_BTN = v; }

export function __set_VOCABULARY_MANUAL_TAGS_EXPORT_BTN(v) { VOCABULARY_MANUAL_TAGS_EXPORT_BTN = v; }

export function __set_VOCABULARY_MANUAL_TAGS_IMPORT_BTN(v) { VOCABULARY_MANUAL_TAGS_IMPORT_BTN = v; }

export function __set_VOCABULARY_MANUAL_TAGS_IMPORT_INPUT(v) { VOCABULARY_MANUAL_TAGS_IMPORT_INPUT = v; }

export function __set_VOCABULARY_MANUAL_TAGS_FILTER_INPUT(v) { VOCABULARY_MANUAL_TAGS_FILTER_INPUT = v; }

export function __set_sharedRegexWorkerUrl(v) { sharedRegexWorkerUrl = v; }

export function __set_sharedRegexWorker(v) { sharedRegexWorker = v; }

export function __set_regexRequestIdCounter(v) { regexRequestIdCounter = v; }

export function __set_regexEntryIdCounter(v) { regexEntryIdCounter = v; }

export function __set_regexEntriesContainer(v) { regexEntriesContainer = v; }

export function __set_currentEditingRegexEntry(v) { currentEditingRegexEntry = v; }

export function __set_profileSelect2(v) { profileSelect2 = v; }

export function __set_beforeAfterEditor(v) { beforeAfterEditor = v; }

export function __set_textEditor(v) { textEditor = v; }

export function __set_originalText(v) { originalText = v; }

export function __set_resultText(v) { resultText = v; }

export function __set_regexTestModeSwitch(v) { regexTestModeSwitch = v; }

export function __set_gestureEnabledSwitch(v) { gestureEnabledSwitch = v; }

export function __set_clickTriggerEnabledSwitch(v) { clickTriggerEnabledSwitch = v; }

export function __set_gestureShowRecognitionSwitch(v) { gestureShowRecognitionSwitch = v; }

export function __set_gestureShowTrailSwitch(v) { gestureShowTrailSwitch = v; }

export function __set_gestureTrailColorPicker(v) { gestureTrailColorPicker = v; }

export function __set_gestureMatchThresholdSlider(v) { gestureMatchThresholdSlider = v; }

export function __set_gestureMatchThresholdValue(v) { gestureMatchThresholdValue = v; }

export function __set_imageGenDemandEnabledSwitch(v) { imageGenDemandEnabledSwitch = v; }

export function __set_visualPrepDemandEnabledSwitch(v) { visualPrepDemandEnabledSwitch = v; }

export function __set_demandProfileSelect(v) { demandProfileSelect = v; }

export function __set_defaultCharDemandTextarea(v) { defaultCharDemandTextarea = v; }

export function __set_defaultImageDemandTextarea(v) { defaultImageDemandTextarea = v; }

export function __set_defaultVisualPrepDemandTextarea(v) { defaultVisualPrepDemandTextarea = v; }

export function __set_kbWorldList(v) { kbWorldList = v; }

export function __set_kbActiveWorld(v) { kbActiveWorld = v; }

export function __set_reloadWorldsFn(v) { reloadWorldsFn = v; }

export function __set_markedLoadingTriggered(v) { markedLoadingTriggered = v; }

export function __set_globalsInitialized(v) { globalsInitialized = v; }

export function __set_tooltipEl(v) { tooltipEl = v; }

export function __set_tooltipSticky(v) { tooltipSticky = v; }

export function __set_generationStartChatLength(v) { generationStartChatLength = v; }

export function __set_generationStartSwipesLength(v) { generationStartSwipesLength = v; }

export { BACKEND_LABELS, COMFYUI_PROFILE_KEYS, CONFIG_FOLDER2, DANGEROUS_REGEX_PATTERNS, DEFAULT_REGEX_ENTRY, INJECTED_FLAG, MODAL_ID, NOVELAI_PROFILE_KEYS, NOVELAI_TIMEOUT_SECONDS, REGEX_TIMEOUT_MS, REGEX_WORKER_CODE, RUNNINGHUB_PROFILE_KEYS, TAG_DATA_PATH, VOCABULARY_FILE_LIST, VOCABULARY_INSTALL_ALL_BTN, VOCABULARY_MANUAL_TAGS_EXPORT_BTN, VOCABULARY_MANUAL_TAGS_FILTER_INPUT, VOCABULARY_MANUAL_TAGS_IMPORT_BTN, VOCABULARY_MANUAL_TAGS_IMPORT_INPUT, VOCABULARY_MANUAL_TAGS_LIST, VOCABULARY_MANUAL_TAGS_REFRESH_BTN, VOCABULARY_MANUAL_TAG_ADD_BTN, VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT, VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT, VOCABULARY_SEARCH_BTN, VOCABULARY_SEARCH_INPUT, VOCABULARY_SEARCH_LIMIT, VOCABULARY_SEARCH_RESULTS, VOCABULARY_SEARCH_SORT, VOCABULARY_SEARCH_STARTSWITH, VOCABULARY_SELECTED_TAGS, VOCABULARY_TAG_BACKSPACE, VOCABULARY_TAG_CLEAR, VOCABULARY_TAG_COPY, VOCABULARY_TREE_CONTAINER, VOCABULARY_UNINSTALL_ALL_BTN, _chartResizeObserver, _currentPeriod, activeAbortControllers, beforeAfterEditor, bubbleEl, cachedTagTreeData, clickTriggerEnabledSwitch, currentCloudQueueInfo, currentEditingRegexEntry, defaultCharDemandTextarea, defaultImageDemandTextarea, defaultVisualPrepDemandTextarea, demandProfileSelect, encryptionKey, generationStartChatLength, generationStartSwipesLength, gestureEnabledSwitch, gestureMatchThresholdSlider, gestureMatchThresholdValue, gestureShowRecognitionSwitch, gestureShowTrailSwitch, gestureTrailColorPicker, globalsInitialized, imageGenDemandEnabledSwitch, initUI, kbActiveWorld, kbWorldList, markedLoadingTriggered, originalText, overlayEl, pendingRegexRequests, processedAutoLLMMessageIds, profileSelect2, regexEntriesContainer, regexEntryIdCounter, regexRequestIdCounter, regexTestModeSwitch, reloadWorldsFn, resultText, sharedRegexWorker, sharedRegexWorkerUrl, textEditor, tooltipEl, tooltipSticky, visualPrepDemandEnabledSwitch, workingNovelAIUrlCache };
