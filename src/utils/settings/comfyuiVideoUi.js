// 还原自打包产物 — 原始模块: utils/settings/comfyuiVideoUi.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { defaultSettings, extensionName } from "../config.js";
import { prepareImageForUpload, processUploadedImageToBlob, removeThinkingTags } from "../utils.js";
import { stylInput, stylishConfirm } from "../ui_common.js";
import { TaskStatus, TaskType, taskQueue } from "../taskQueue.js";
import { mergeAdjacentMessages, replaceAllPlaceholders } from "../promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "./llmService.js";
import { LLM_VIDEO_GEN, LLM_VISUAL_MAT_PREP } from "../llmRequest.js";
import { openVideoAssetPicker } from "./videoAssetPicker.js";
import { parseVideosFromPrompt } from "../videoInserter.js";
import { interruptAll } from "../comfyuiAdapter.js";
import { executeComfyUIVideoDirectTest } from "../comfyuiVideo.js";
import { sessionUploadedMedia2 } from "./video_assets.js";
import { inheritRunningHubWork, visualizeRunningHubWorkflow } from "./runninghubWorker.js";

var UPLOAD_CACHE_EXPIRY_MS3, sessionUploadedMedia;

var sessionUploadedMedia = { img: {}, aud: {}, imgFiles: {}, audFiles: {} };

var UPLOAD_CACHE_EXPIRY_MS3 = 24 * 60 * 60 * 1e3;
function escapeHtml7(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function uploadComfyUIImageDirect(imageBlob, fileName) {
  const settings3 = extension_settings[extensionName];
  const url = (settings3?.comfyuiUrl || "http://localhost:8188").trim();
  if (!url) {
    throw new Error("\u8BF7\u5148\u5728 ComfyUI \u8BBE\u7F6E\u4E2D\u914D\u7F6E API \u5730\u5740");
  }
  let finalBlob = imageBlob;
  let finalFileName = fileName || "upload.jpg";
  try {
    const processed = await prepareImageForUpload(imageBlob, {
      fallbackFileName: (fileName || "upload.jpg").replace(/\.[^/.]+$/, "") + ".jpg"
    });
    finalBlob = processed.blob;
    finalFileName = processed.fileName;
  } catch (procErr) {
    console.warn("[ComfyUIVideoUI] \u56FE\u7247\u9884\u5904\u7406\u5931\u8D25\uFF0C\u4F7F\u7528\u539F\u59CB\u6570\u636E:", procErr);
  }
  const formData = new FormData();
  formData.append("image", finalBlob, finalFileName);
  formData.append("overwrite", "true");
  const res = await fetch(`${url}/upload/image`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ComfyUI \u56FE\u7247\u4E0A\u4F20\u5931\u8D25: ${errText}`);
  }
  const result = await res.json();
  return result.name;
}

function initComfyUIVideoUI() {
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  if (!settings3.comfyui_video_workers) {
    settings3.comfyui_video_workers = { ...defaultSettings.comfyui_video_workers };
  }
  const WORKFLOW_CATEGORIES = [
    {
      name: "\u56FE\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41",
      workeridKey: "comfyui_img2vid_workerid",
      workerKey: "comfyui_img2vid_worker",
      selectId: "comfyui_img2vid_workerid",
      textareaId: "comfyui_img2vid_worker",
      btnPrefix: "#comfyui_img2vid_worker",
      inheritBtnId: "#inherit_comfyui_img2vid_work",
      vizBtnId: "#visualize_comfyui_img2vid_workflow"
    },
    {
      name: "\u53C2\u8003\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41",
      workeridKey: "comfyui_ref2vid_workerid",
      workerKey: "comfyui_ref2vid_worker",
      selectId: "comfyui_ref2vid_workerid",
      textareaId: "comfyui_ref2vid_worker",
      btnPrefix: "#comfyui_ref2vid_worker",
      inheritBtnId: "#inherit_comfyui_ref2vid_work",
      vizBtnId: "#visualize_comfyui_ref2vid_workflow"
    }
  ];
  function refreshAllWorkerSelects() {
    const workers = settings3.comfyui_video_workers || {};
    const presetNames = Object.keys(workers);
    const firstPreset = presetNames[0] || "";
    WORKFLOW_CATEGORIES.forEach((cat) => {
      const selectEl = document.getElementById(cat.selectId);
      const textareaEl = document.getElementById(cat.textareaId);
      if (!selectEl) return;
      selectEl.innerHTML = "";
      presetNames.forEach((name) => {
        const opt = new Option(name, name);
        selectEl.add(opt);
      });
      let currentId = settings3[cat.workeridKey];
      if (!currentId || !workers[currentId]) {
        currentId = firstPreset;
        settings3[cat.workeridKey] = currentId;
      }
      if (currentId) {
        selectEl.value = currentId;
        const jsonStr = workers[currentId] || "";
        settings3[cat.workerKey] = jsonStr;
        if (textareaEl) textareaEl.value = jsonStr;
      }
    });
  }
  refreshAllWorkerSelects();
  WORKFLOW_CATEGORIES.forEach((cat) => {
    const selectEl = document.getElementById(cat.selectId);
    const textareaEl = document.getElementById(cat.textareaId);
    if (selectEl) {
      $(selectEl).off("change.comfy_vid").on("change.comfy_vid", () => {
        const selected = selectEl.value;
        settings3[cat.workeridKey] = selected;
        const jsonStr = settings3.comfyui_video_workers[selected] || "";
        settings3[cat.workerKey] = jsonStr;
        if (textareaEl) textareaEl.value = jsonStr;
        saveSettingsDebounced();
      });
    }
    if (textareaEl) {
      $(textareaEl).off("input.comfy_vid").on("input.comfy_vid", () => {
        const currentId = settings3[cat.workeridKey];
        if (currentId) {
          settings3.comfyui_video_workers[currentId] = textareaEl.value;
          settings3[cat.workerKey] = textareaEl.value;
          saveSettingsDebounced();
        }
      });
    }
    $(`${cat.btnPrefix}_new`).off("click.comfy_vid").on("click.comfy_vid", async () => {
      const name = await stylInput(`\u8BF7\u8F93\u5165\u65B0\u3010${cat.name}\u3011\u9884\u8BBE\u540D\u79F0\uFF1A`);
      if (name && name.trim()) {
        const trimmed = name.trim();
        if (settings3.comfyui_video_workers[trimmed]) {
          alert("\u9884\u8BBE\u540D\u79F0\u5DF2\u5B58\u5728");
          return;
        }
        settings3.comfyui_video_workers[trimmed] = textareaEl?.value || "{}";
        settings3[cat.workeridKey] = trimmed;
        settings3[cat.workerKey] = settings3.comfyui_video_workers[trimmed];
        refreshAllWorkerSelects();
        saveSettingsDebounced();
        toastr.success(`\u5DF2\u521B\u5EFA\u5DE5\u4F5C\u6D41\u9884\u8BBE "${trimmed}"`);
      }
    });
    $(`${cat.btnPrefix}_update_style`).off("click.comfy_vid").on("click.comfy_vid", () => {
      const currentId = settings3[cat.workeridKey];
      if (currentId) {
        settings3.comfyui_video_workers[currentId] = textareaEl?.value || "";
        settings3[cat.workerKey] = textareaEl?.value || "";
        saveSettingsDebounced();
        toastr.success(`\u3010${cat.name}\u3011\u9884\u8BBE "${currentId}" \u5DF2\u4FDD\u5B58`);
      }
    });
    $(`${cat.btnPrefix}_save_style`).off("click.comfy_vid").on("click.comfy_vid", async () => {
      const name = await stylInput(`\u53E6\u5B58\u4E3A\u65B0\u3010${cat.name}\u3011\u9884\u8BBE\u540D\u79F0\uFF1A`);
      if (name && name.trim()) {
        const trimmed = name.trim();
        if (settings3.comfyui_video_workers[trimmed]) {
          alert("\u9884\u8BBE\u540D\u79F0\u5DF2\u5B58\u5728");
          return;
        }
        settings3.comfyui_video_workers[trimmed] = textareaEl?.value || "{}";
        settings3[cat.workeridKey] = trimmed;
        settings3[cat.workerKey] = settings3.comfyui_video_workers[trimmed];
        refreshAllWorkerSelects();
        saveSettingsDebounced();
        toastr.success(`\u5DF2\u53E6\u5B58\u4E3A\u5DE5\u4F5C\u6D41\u9884\u8BBE "${trimmed}"`);
      }
    });
    $(`${cat.btnPrefix}_rename`).off("click.comfy_vid").on("click.comfy_vid", async () => {
      const currentId = settings3[cat.workeridKey];
      if (!currentId) return;
      const newName = await stylInput(`\u91CD\u547D\u540D\u3010${cat.name}\u3011\u9884\u8BBE "${currentId}" \u4E3A\uFF1A`);
      if (newName && newName.trim() && newName.trim() !== currentId) {
        const trimmed = newName.trim();
        if (settings3.comfyui_video_workers[trimmed]) {
          alert("\u9884\u8BBE\u540D\u79F0\u5DF2\u5B58\u5728");
          return;
        }
        const oldContent = settings3.comfyui_video_workers[currentId];
        delete settings3.comfyui_video_workers[currentId];
        settings3.comfyui_video_workers[trimmed] = oldContent;
        WORKFLOW_CATEGORIES.forEach((otherCat) => {
          if (settings3[otherCat.workeridKey] === currentId) {
            settings3[otherCat.workeridKey] = trimmed;
          }
        });
        refreshAllWorkerSelects();
        saveSettingsDebounced();
        toastr.success(`\u5DF2\u91CD\u547D\u540D\u4E3A "${trimmed}"`);
      }
    });
    $(`${cat.btnPrefix}_export_current`).off("click.comfy_vid").on("click.comfy_vid", () => {
      const currentId = settings3[cat.workeridKey];
      if (!currentId) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(settings3.comfyui_video_workers[currentId] || "{}");
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `comfyui_video_workflow_${currentId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
    $(`${cat.btnPrefix}_export_all`).off("click.comfy_vid").on("click.comfy_vid", () => {
      const exportData = {
        version: 1,
        type: "st-chatu8-comfyui-video-workers-all",
        workers: settings3.comfyui_video_workers || {}
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `comfyui_video_workers_all_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
    $(`${cat.btnPrefix}_import`).off("click.comfy_vid").on("click.comfy_vid", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (parsed.type === "st-chatu8-comfyui-video-workers-all" && parsed.workers) {
            const count = Object.keys(parsed.workers).length;
            if (confirm(`\u5373\u5C06\u5BFC\u5165\u5168\u90E8 ${count} \u4E2A\u5DE5\u4F5C\u6D41\u9884\u8BBE\uFF0C\u662F\u5426\u5408\u5E76\uFF1F`)) {
              Object.assign(settings3.comfyui_video_workers, parsed.workers);
              refreshAllWorkerSelects();
              saveSettingsDebounced();
              toastr.success(`\u6210\u529F\u5BFC\u5165 ${count} \u4E2A\u5DE5\u4F5C\u6D41\u9884\u8BBE`);
            }
          } else {
            const defaultName = file.name.replace(/\.json$/i, "");
            const name = await stylInput(`\u8BF7\u8F93\u5165\u5BFC\u5165\u7684\u5DE5\u4F5C\u6D41\u9884\u8BBE\u540D\u79F0\uFF1A`, defaultName);
            if (name && name.trim()) {
              const trimmed = name.trim();
              settings3.comfyui_video_workers[trimmed] = text;
              settings3[cat.workeridKey] = trimmed;
              settings3[cat.workerKey] = text;
              refreshAllWorkerSelects();
              saveSettingsDebounced();
              toastr.success(`\u5DF2\u5BFC\u5165\u5DE5\u4F5C\u6D41\u9884\u8BBE "${trimmed}"`);
            }
          }
        } catch (err) {
          alert("\u5BFC\u5165\u5931\u8D25: " + err.message);
        }
      };
      input.click();
    });
    $(`${cat.btnPrefix}_delete_style`).off("click.comfy_vid").on("click.comfy_vid", async () => {
      const currentId = settings3[cat.workeridKey];
      if (!currentId) return;
      if (Object.keys(settings3.comfyui_video_workers).length <= 1) {
        alert("\u81F3\u5C11\u9700\u8981\u4FDD\u7559\u4E00\u4E2A\u5DE5\u4F5C\u6D41\u9884\u8BBE");
        return;
      }
      const confirmed = await stylishConfirm(`\u786E\u5B9A\u8981\u5220\u9664\u3010${cat.name}\u3011\u9884\u8BBE "${currentId}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u9006\uFF01`);
      if (confirmed) {
        delete settings3.comfyui_video_workers[currentId];
        const remaining = Object.keys(settings3.comfyui_video_workers)[0];
        WORKFLOW_CATEGORIES.forEach((otherCat) => {
          if (settings3[otherCat.workeridKey] === currentId) {
            settings3[otherCat.workeridKey] = remaining;
            settings3[otherCat.workerKey] = settings3.comfyui_video_workers[remaining];
          }
        });
        refreshAllWorkerSelects();
        saveSettingsDebounced();
        toastr.success(`\u5DF2\u5220\u9664\u9884\u8BBE "${currentId}"`);
      }
    });
    $(cat.inheritBtnId).off("click.comfy_vid").on("click.comfy_vid", () => {
      inheritRunningHubWork(cat.textareaId, cat.workeridKey, cat.workerKey, settings3.comfyui_video_workers);
    });
    $(cat.vizBtnId).off("click.comfy_vid").on("click.comfy_vid", () => {
      visualizeRunningHubWorkflow(cat.textareaId, cat.workeridKey, cat.workerKey);
    });
  });
  const videoParamKeys = [
    { id: "comfyui_val_duration", default: "4" },
    { id: "comfyui_val_steps", default: "20" },
    { id: "comfyui_val_megapixels", default: "0.9" },
    { id: "comfyui_val_seed", default: "-1" },
    { id: "comfyui_val_default_img", default: "" },
    { id: "comfyui_val_default_aud", default: "" }
  ];
  videoParamKeys.forEach(({ id, default: defVal }) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = settings3[id] !== void 0 ? settings3[id] : defVal;
      $(el).off("input change.comfy_vid").on("input change.comfy_vid", (e) => {
        settings3[id] = e.target.value;
        saveSettingsDebounced();
      });
    }
  });
  let pendingComfyUISwap = { type: null, index: null };
  function swapComfyUIMedia(type, idxA, idxB) {
    if (idxA === idxB) return;
    if (type === "img") {
      const ctrlA = settings3[`comfyui_img_ctrl_${idxA}`] || "bypass";
      settings3[`comfyui_img_ctrl_${idxA}`] = settings3[`comfyui_img_ctrl_${idxB}`] || "bypass";
      settings3[`comfyui_img_ctrl_${idxB}`] = ctrlA;
      const descA = settings3[`comfyui_img_desc_${idxA}`] || "";
      settings3[`comfyui_img_desc_${idxA}`] = settings3[`comfyui_img_desc_${idxB}`] || "";
      settings3[`comfyui_img_desc_${idxB}`] = descA;
      if (!settings3.runninghub_uploadedMedia) settings3.runninghub_uploadedMedia = { img: {}, aud: {} };
      if (!settings3.runninghub_uploadedMedia.img) settings3.runninghub_uploadedMedia.img = {};
      const mediaA = settings3.runninghub_uploadedMedia.img[idxA];
      const mediaB = settings3.runninghub_uploadedMedia.img[idxB];
      if (mediaB !== void 0) settings3.runninghub_uploadedMedia.img[idxA] = mediaB;
      else delete settings3.runninghub_uploadedMedia.img[idxA];
      if (mediaA !== void 0) settings3.runninghub_uploadedMedia.img[idxB] = mediaA;
      else delete settings3.runninghub_uploadedMedia.img[idxB];
      const sessA = sessionUploadedMedia2.img?.[idxA];
      const sessB = sessionUploadedMedia2.img?.[idxB];
      if (sessB !== void 0) sessionUploadedMedia2.img[idxA] = sessB;
      else delete sessionUploadedMedia2.img[idxA];
      if (sessA !== void 0) sessionUploadedMedia2.img[idxB] = sessA;
      else delete sessionUploadedMedia2.img[idxB];
      if (!sessionUploadedMedia2.imgFiles) sessionUploadedMedia2.imgFiles = {};
      const fileA = sessionUploadedMedia2.imgFiles[idxA];
      const fileB = sessionUploadedMedia2.imgFiles[idxB];
      if (fileB !== void 0) sessionUploadedMedia2.imgFiles[idxA] = fileB;
      else delete sessionUploadedMedia2.imgFiles[idxA];
      if (fileA !== void 0) sessionUploadedMedia2.imgFiles[idxB] = fileA;
      else delete sessionUploadedMedia2.imgFiles[idxB];
      saveSettingsDebounced();
      renderComfyUIImageCards();
      toastr.success(`\u5DF2\u6210\u529F\u4EA4\u6362 <Picture ${idxA}> \u4E0E <Picture ${idxB}> \u7684\u4F4D\u7F6E\u4E0E\u914D\u7F6E\uFF01`);
    } else if (type === "aud") {
      const ctrlA = settings3[`comfyui_aud_ctrl_${idxA}`] || "bypass";
      settings3[`comfyui_aud_ctrl_${idxA}`] = settings3[`comfyui_aud_ctrl_${idxB}`] || "bypass";
      settings3[`comfyui_aud_ctrl_${idxB}`] = ctrlA;
      const descA = settings3[`comfyui_aud_desc_${idxA}`] || "";
      settings3[`comfyui_aud_desc_${idxA}`] = settings3[`comfyui_aud_desc_${idxB}`] || "";
      settings3[`comfyui_aud_desc_${idxB}`] = descA;
      if (!settings3.runninghub_uploadedMedia) settings3.runninghub_uploadedMedia = { img: {}, aud: {} };
      if (!settings3.runninghub_uploadedMedia.aud) settings3.runninghub_uploadedMedia.aud = {};
      const mediaA = settings3.runninghub_uploadedMedia.aud[idxA];
      const mediaB = settings3.runninghub_uploadedMedia.aud[idxB];
      if (mediaB !== void 0) settings3.runninghub_uploadedMedia.aud[idxA] = mediaB;
      else delete settings3.runninghub_uploadedMedia.aud[idxA];
      if (mediaA !== void 0) settings3.runninghub_uploadedMedia.aud[idxB] = mediaA;
      else delete settings3.runninghub_uploadedMedia.aud[idxB];
      const sessA = sessionUploadedMedia2.aud?.[idxA];
      const sessB = sessionUploadedMedia2.aud?.[idxB];
      if (sessB !== void 0) sessionUploadedMedia2.aud[idxA] = sessB;
      else delete sessionUploadedMedia2.aud[idxA];
      if (sessA !== void 0) sessionUploadedMedia2.aud[idxB] = sessA;
      else delete sessionUploadedMedia2.aud[idxB];
      if (!sessionUploadedMedia2.audFiles) sessionUploadedMedia2.audFiles = {};
      const fileA = sessionUploadedMedia2.audFiles[idxA];
      const fileB = sessionUploadedMedia2.audFiles[idxB];
      if (fileB !== void 0) sessionUploadedMedia2.audFiles[idxA] = fileB;
      else delete sessionUploadedMedia2.audFiles[idxA];
      if (fileA !== void 0) sessionUploadedMedia2.audFiles[idxB] = fileA;
      else delete sessionUploadedMedia2.audFiles[idxB];
      saveSettingsDebounced();
      renderComfyUIAudioCards();
      toastr.success(`\u5DF2\u6210\u529F\u4EA4\u6362 <Audio ${idxA}> \u4E0E <Audio ${idxB}> \u7684\u4F4D\u7F6E\u4E0E\u914D\u7F6E\uFF01`);
    }
  }
  function renderComfyUIImageCards() {
    const $imgContainer = $("#comfyui_img_container");
    if (!$imgContainer.length) return;
    $imgContainer.empty();
    const comfyUrl = (settings3.comfyuiUrl || "http://localhost:8188").trim();
    const hasPending = pendingComfyUISwap.type === "img" && pendingComfyUISwap.index !== null;
    for (let i = 1; i <= 9; i++) {
      const ctrlKey = `comfyui_img_ctrl_${i}`;
      const descKey = `comfyui_img_desc_${i}`;
      const currentMode2 = settings3[ctrlKey] || "bypass";
      const currentDesc = settings3[descKey] || "";
      const uploadedName = settings3.runninghub_uploadedMedia?.img?.[i] || "";
      const isCurrentSelected = pendingComfyUISwap.type === "img" && pendingComfyUISwap.index === i;
      let borderStyle = "border: 1px solid var(--st-chatu8-border-color, rgba(255,255,255,0.1));";
      let bgStyle = "background: var(--st-chatu8-bg-secondary, rgba(255,255,255,0.03));";
      if (isCurrentSelected) {
        borderStyle = "border: 2px solid #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.45);";
        bgStyle = "background: rgba(245, 158, 11, 0.08);";
      } else if (hasPending) {
        borderStyle = "border: 1px dashed rgba(96, 165, 250, 0.5);";
      }
      const cardHtml = `
                <div class="st-chatu8-card" style="padding: 12px; ${borderStyle} border-radius: 8px; ${bgStyle} display: flex; flex-direction: column; gap: 10px; transition: all 0.2s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <span style="font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                            <i class="fa-solid fa-image" style="color: #60a5fa;"></i> &lt;Picture ${i}&gt;
                        </span>
                        <div class="st-chatu8-media-header-controls">
                            <button type="button" class="st-chatu8-btn comfyui-swap-btn st-chatu8-swap-btn ${isCurrentSelected ? "is-active" : ""}" data-type="img" data-index="${i}" title="${isCurrentSelected ? "\u70B9\u51FB\u53D6\u6D88\u4EA4\u6362" : hasPending ? "\u70B9\u51FB\u4E0E\u9009\u4E2D\u7684\u9879\u4E92\u6362" : "\u70B9\u51FB\u9009\u62E9\u8981\u4EA4\u6362\u7684\u5361\u7247"}">
                                ${isCurrentSelected ? '<i class="fa-solid fa-xmark"></i> \u53D6\u6D88' : hasPending ? '<i class="fa-solid fa-arrow-right-arrow-left"></i> \u4E92\u6362' : '<i class="fa-solid fa-arrow-right-arrow-left"></i> \u4EA4\u6362'}
                            </button>
                            <select id="${ctrlKey}" class="st-chatu8-select st-chatu8-ctrl-select">
                                <option value="enable" ${currentMode2 === "enable" ? "selected" : ""}>\u5F00\u542F</option>
                                <option value="bypass" ${currentMode2 === "bypass" ? "selected" : ""}>\u8DF3\u8FC7 (Bypass)</option>
                                <option value="mute" ${currentMode2 === "mute" ? "selected" : ""}>\u505C\u7528 (Mute)</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div id="comfyui_img_status_${i}" style="font-size: 11px; color: ${uploadedName ? "#4caf50" : "var(--st-chatu8-text-secondary, #888)"}; word-break: break-all;">
                            ${uploadedName ? `<i class="fa-solid fa-check-circle"></i> \u5DF2\u8F7D\u5165: ${uploadedName}` : "\u672A\u6307\u5B9A\u672C\u5730\u56FE\u7247\uFF08\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u6216\u63D0\u793A\u8BCD\u89C6\u6750\uFF09"}
                        </div>
                        <div class="st-chatu8-media-preview-box" id="comfyui_img_preview_box_${i}" style="display: ${uploadedName ? "flex" : "none"};">
                            <img id="comfyui_preview_img_${i}" class="${currentMode2 === "mute" && uploadedName ? "st-chatu8-preview-muted" : ""}" style="max-width: 100%; max-height: 120px; border-radius: 4px; object-fit: contain;" ${uploadedName ? `src="${comfyUrl}/view?filename=${encodeURIComponent(uploadedName)}&type=input"` : ""}>
                            <div class="st-chatu8-media-mute-overlay" id="comfyui_img_mute_overlay_${i}" style="display: ${currentMode2 === "mute" && uploadedName ? "flex" : "none"};">
                                <div class="st-chatu8-mute-badge">
                                    <i class="fa-solid fa-ban" style="color: #ef4444;"></i>
                                    <span>\u5DF2\u505C\u7528</span>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <input type="file" id="comfyui_img_file_${i}" accept="image/*" style="display: none;">
                            <button type="button" class="st-chatu8-btn" id="comfyui_img_upload_btn_${i}" style="flex: 1; min-width: 80px; padding: 4px 8px; font-size: 12px;" title="\u4ECE\u7535\u8111\u672C\u5730\u4E0A\u4F20\u56FE\u7247"><i class="fa-solid fa-upload"></i> \u672C\u5730\u4E0A\u4F20</button>
                            <button type="button" class="st-chatu8-btn" id="comfyui_img_asset_btn_${i}" style="flex: 1; min-width: 80px; padding: 4px 8px; font-size: 12px;" title="\u4ECE\u89C6\u9891\u8D44\u4EA7\u5E93\u4E2D\u9009\u53D6\u56FE\u7247\u7D20\u6750"><i class="fa-solid fa-photo-film"></i> \u89C6\u9891\u8D44\u4EA7</button>
                            <button type="button" class="st-chatu8-btn danger" id="comfyui_img_clear_btn_${i}" style="padding: 4px 8px; font-size: 12px; ${uploadedName ? "" : "display: none;"}" title="\u6E05\u9664"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <label for="${descKey}" style="font-size: 11px; color: var(--st-chatu8-text-secondary, #888);"><i class="fa-solid fa-pen-to-square"></i> \u56FE\u7247\u7B80\u4ECB (\u968F\u56FE\u4F20\u7ED9LLM)</label>
                            <textarea id="${descKey}" class="st-chatu8-textarea" rows="2" placeholder="\u8F93\u5165\u56FE\u7247 ${i} \u7B80\u4ECB\u6216\u753B\u9762\u8BF4\u660E..." style="font-size: 12px; padding: 4px 8px; resize: vertical; min-height: 38px;">${escapeHtml7(currentDesc)}</textarea>
                        </div>
                    </div>
                </div>
            `;
      $imgContainer.append(cardHtml);
      $(`.comfyui-swap-btn[data-type="img"][data-index="${i}"]`).on("click", (e) => {
        e.stopPropagation();
        if (pendingComfyUISwap.type === "img" && pendingComfyUISwap.index === i) {
          pendingComfyUISwap = { type: null, index: null };
          renderComfyUIImageCards();
          toastr.info("\u5DF2\u53D6\u6D88\u4EA4\u6362");
        } else if (pendingComfyUISwap.type === "img" && pendingComfyUISwap.index !== null) {
          const srcIdx = pendingComfyUISwap.index;
          pendingComfyUISwap = { type: null, index: null };
          swapComfyUIMedia("img", srcIdx, i);
        } else {
          pendingComfyUISwap = { type: "img", index: i };
          renderComfyUIImageCards();
          toastr.info(`\u5DF2\u9009\u4E2D <Picture ${i}>\uFF0C\u8BF7\u70B9\u51FB\u53E6\u4E00\u4E2A\u5361\u7247\u7684\u3010\u4E92\u6362\u3011\u6309\u94AE\uFF08\u518D\u6B21\u70B9\u51FB\u81EA\u8EAB\u53EF\u53D6\u6D88\uFF09`);
        }
      });
      $(`#${ctrlKey}`).on("change", (e) => {
        const val = e.target.value;
        settings3[ctrlKey] = val;
        saveSettingsDebounced();
        const hasMedia = Boolean(settings3.runninghub_uploadedMedia?.img?.[i] || sessionUploadedMedia2.imgFiles?.[i]);
        const $overlay = $(`#comfyui_img_mute_overlay_${i}`);
        const $img = $(`#comfyui_preview_img_${i}`);
        if (val === "mute" && hasMedia) {
          $img.addClass("st-chatu8-preview-muted");
          $overlay.css("display", "flex");
        } else {
          $img.removeClass("st-chatu8-preview-muted");
          $overlay.hide();
        }
      });
      $(`#${descKey}`).on("input", (e) => {
        settings3[descKey] = e.target.value;
        saveSettingsDebounced();
      });
      $(`#comfyui_img_upload_btn_${i}`).on("click", () => {
        $(`#comfyui_img_file_${i}`).click();
      });
      $(`#comfyui_img_asset_btn_${i}`).on("click", () => {
        openVideoAssetPicker({
          type: "img",
          title: `<i class="fa-solid fa-photo-film" style="color: #60a5fa;"></i> \u4E3A &lt;Picture ${i}&gt; \u9009\u62E9\u89C6\u9891\u56FE\u7247\u8D44\u4EA7`,
          onSelect: async (asset, imageBlob, dataUrl) => {
            const preview = document.getElementById(`comfyui_preview_img_${i}`);
            if (preview && dataUrl) {
              preview.src = dataUrl;
            }
            $(`#comfyui_img_preview_box_${i}`).css("display", "flex");
            if (settings3[ctrlKey] === "mute") {
              $(`#comfyui_preview_img_${i}`).addClass("st-chatu8-preview-muted");
              $(`#comfyui_img_mute_overlay_${i}`).css("display", "flex");
            } else {
              $(`#comfyui_preview_img_${i}`).removeClass("st-chatu8-preview-muted");
              $(`#comfyui_img_mute_overlay_${i}`).hide();
            }
            try {
              toastr.info(`\u6B63\u5728\u4E0A\u4F20\u8D44\u4EA7\u56FE\u7247 [${asset.name || "asset"}] \u5230 ComfyUI...`);
              const assetFileName = `${(asset.name || `asset_${i}`).replace(/[\\/:*?"<>|]/g, "_")}.png`;
              const fileObj = new File([imageBlob], assetFileName, { type: imageBlob.type || "image/png" });
              sessionUploadedMedia2.imgFiles[i] = fileObj;
              const serverFileName = await uploadComfyUIImageDirect(imageBlob, assetFileName);
              if (!settings3.runninghub_uploadedMedia) settings3.runninghub_uploadedMedia = { img: {}, aud: {} };
              if (!settings3.runninghub_uploadedMedia.img) settings3.runninghub_uploadedMedia.img = {};
              settings3.runninghub_uploadedMedia.img[i] = serverFileName;
              sessionUploadedMedia2.img[i] = serverFileName;
              $(`#comfyui_img_status_${i}`).html(`<i class="fa-solid fa-check-circle"></i> \u5DF2\u4E0A\u4F20: ${serverFileName}`).css("color", "#4caf50");
              $(`#comfyui_img_clear_btn_${i}`).show();
              const currentDescVal = $(`#${descKey}`).val() || "";
              if (!currentDescVal.trim() && asset.description && asset.description.trim()) {
                const newDesc = asset.description.trim();
                $(`#${descKey}`).val(newDesc);
                settings3[descKey] = newDesc;
              }
              saveSettingsDebounced();
              toastr.success(`\u56FE\u7247 ${i} \u5DF2\u4ECE\u89C6\u9891\u8D44\u4EA7\u8F7D\u5165: ${serverFileName}`);
            } catch (err) {
              alert("\u4ECE\u89C6\u9891\u8D44\u4EA7\u8F7D\u5165\u5931\u8D25: " + err.message);
            }
          }
        });
      });
      $(`#comfyui_img_file_${i}`).on("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = document.getElementById(`comfyui_preview_img_${i}`);
        if (preview) {
          preview.src = URL.createObjectURL(file);
        }
        $(`#comfyui_img_preview_box_${i}`).css("display", "flex");
        if (settings3[ctrlKey] === "mute") {
          $(`#comfyui_preview_img_${i}`).addClass("st-chatu8-preview-muted");
          $(`#comfyui_img_mute_overlay_${i}`).css("display", "flex");
        } else {
          $(`#comfyui_preview_img_${i}`).removeClass("st-chatu8-preview-muted");
          $(`#comfyui_img_mute_overlay_${i}`).hide();
        }
        try {
          toastr.info(`\u6B63\u5728\u4E0A\u4F20\u56FE\u7247 ${i} \u5230 ComfyUI...`);
          sessionUploadedMedia2.imgFiles[i] = file;
          const imageBlob = await processUploadedImageToBlob(file);
          const serverFileName = await uploadComfyUIImageDirect(imageBlob, file.name);
          if (!settings3.runninghub_uploadedMedia) settings3.runninghub_uploadedMedia = { img: {}, aud: {} };
          if (!settings3.runninghub_uploadedMedia.img) settings3.runninghub_uploadedMedia.img = {};
          settings3.runninghub_uploadedMedia.img[i] = serverFileName;
          sessionUploadedMedia2.img[i] = serverFileName;
          $(`#comfyui_img_status_${i}`).html(`<i class="fa-solid fa-check-circle"></i> \u5DF2\u4E0A\u4F20: ${serverFileName}`).css("color", "#4caf50");
          $(`#comfyui_img_clear_btn_${i}`).show();
          saveSettingsDebounced();
          toastr.success(`\u56FE\u7247 ${i} \u4E0A\u4F20\u6210\u529F: ${serverFileName}`);
        } catch (err) {
          alert("\u4E0A\u4F20\u5931\u8D25: " + err.message);
        }
      });
      $(`#comfyui_img_clear_btn_${i}`).on("click", () => {
        if (settings3.runninghub_uploadedMedia?.img) {
          delete settings3.runninghub_uploadedMedia.img[i];
        }
        delete sessionUploadedMedia2.img[i];
        delete sessionUploadedMedia2.imgFiles[i];
        const fileInput = document.getElementById(`comfyui_img_file_${i}`);
        if (fileInput) fileInput.value = "";
        $(`#comfyui_img_preview_box_${i}`).hide();
        $(`#comfyui_preview_img_${i}`).removeClass("st-chatu8-preview-muted").removeAttr("src");
        $(`#comfyui_img_mute_overlay_${i}`).hide();
        $(`#comfyui_img_status_${i}`).text("\u672A\u6307\u5B9A\u672C\u5730\u56FE\u7247\uFF08\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u6216\u63D0\u793A\u8BCD\u89C6\u6750\uFF09").css("color", "var(--st-chatu8-text-secondary, #888)");
        $(`#comfyui_img_clear_btn_${i}`).hide();
        saveSettingsDebounced();
        toastr.info(`\u5DF2\u6E05\u9664\u56FE\u7247 ${i}`);
      });
    }
  }
  renderComfyUIImageCards();
  function renderComfyUIAudioCards() {
    const $audContainer = $("#comfyui_aud_container");
    if (!$audContainer.length) return;
    $audContainer.empty();
    const comfyUrl = (settings3.comfyuiUrl || "http://localhost:8188").trim();
    const hasPending = pendingComfyUISwap.type === "aud" && pendingComfyUISwap.index !== null;
    for (let i = 1; i <= 3; i++) {
      const ctrlKey = `comfyui_aud_ctrl_${i}`;
      const descKey = `comfyui_aud_desc_${i}`;
      const currentMode2 = settings3[ctrlKey] || "bypass";
      const currentDesc = settings3[descKey] || "";
      const uploadedName = settings3.runninghub_uploadedMedia?.aud?.[i] || "";
      const isCurrentSelected = pendingComfyUISwap.type === "aud" && pendingComfyUISwap.index === i;
      let borderStyle = "border: 1px solid var(--st-chatu8-border-color, rgba(255,255,255,0.1));";
      let bgStyle = "background: var(--st-chatu8-bg-secondary, rgba(255,255,255,0.03));";
      if (isCurrentSelected) {
        borderStyle = "border: 2px solid #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.45);";
        bgStyle = "background: rgba(245, 158, 11, 0.08);";
      } else if (hasPending) {
        borderStyle = "border: 1px dashed rgba(236, 72, 153, 0.5);";
      }
      const cardHtml = `
                <div class="st-chatu8-card" style="padding: 12px; ${borderStyle} border-radius: 8px; ${bgStyle} display: flex; flex-direction: column; gap: 10px; transition: all 0.2s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <span style="font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                            <i class="fa-solid fa-music" style="color: #ec4899;"></i> &lt;Audio ${i}&gt;
                        </span>
                        <div class="st-chatu8-media-header-controls">
                            <button type="button" class="st-chatu8-btn comfyui-swap-btn st-chatu8-swap-btn ${isCurrentSelected ? "is-active" : ""}" data-type="aud" data-index="${i}" title="${isCurrentSelected ? "\u70B9\u51FB\u53D6\u6D88\u4EA4\u6362" : hasPending ? "\u70B9\u51FB\u4E0E\u9009\u4E2D\u7684\u9879\u4E92\u6362" : "\u70B9\u51FB\u9009\u62E9\u8981\u4EA4\u6362\u7684\u5361\u7247"}">
                                ${isCurrentSelected ? '<i class="fa-solid fa-xmark"></i> \u53D6\u6D88' : hasPending ? '<i class="fa-solid fa-arrow-right-arrow-left"></i> \u4E92\u6362' : '<i class="fa-solid fa-arrow-right-arrow-left"></i> \u4EA4\u6362'}
                            </button>
                            <select id="${ctrlKey}" class="st-chatu8-select st-chatu8-ctrl-select">
                                <option value="enable" ${currentMode2 === "enable" ? "selected" : ""}>\u5F00\u542F</option>
                                <option value="bypass" ${currentMode2 === "bypass" ? "selected" : ""}>\u8DF3\u8FC7 (Bypass)</option>
                                <option value="mute" ${currentMode2 === "mute" ? "selected" : ""}>\u505C\u7528 (Mute)</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div id="comfyui_aud_status_${i}" style="font-size: 11px; color: ${uploadedName ? "#4caf50" : "var(--st-chatu8-text-secondary, #888)"}; word-break: break-all;">
                            ${uploadedName ? `<i class="fa-solid fa-check-circle"></i> \u5DF2\u8F7D\u5165: ${uploadedName}` : "\u672A\u6307\u5B9A\u672C\u5730\u97F3\u9891\uFF08\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u6216\u63D0\u793A\u8BCD\u89C6\u6750\uFF09"}
                        </div>
                        <div class="st-chatu8-media-preview-box" id="comfyui_aud_preview_box_${i}" style="display: ${uploadedName ? "flex" : "none"}; width: 100%;">
                            <audio controls id="comfyui_preview_aud_${i}" class="${currentMode2 === "mute" && uploadedName ? "st-chatu8-preview-muted" : ""}" style="width: 100%; margin-top: 4px;" ${uploadedName ? `src="${comfyUrl}/view?filename=${encodeURIComponent(uploadedName)}&type=input"` : ""}></audio>
                            <div class="st-chatu8-media-mute-overlay" id="comfyui_aud_mute_overlay_${i}" style="display: ${currentMode2 === "mute" && uploadedName ? "flex" : "none"};">
                                <div class="st-chatu8-mute-badge">
                                    <i class="fa-solid fa-ban" style="color: #ef4444;"></i>
                                    <span>\u5DF2\u505C\u7528</span>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <input type="file" id="comfyui_aud_file_${i}" accept="audio/*" style="display: none;">
                            <button type="button" class="st-chatu8-btn" id="comfyui_aud_upload_btn_${i}" style="flex: 1; min-width: 80px; padding: 4px 8px; font-size: 12px;" title="\u4ECE\u7535\u8111\u672C\u5730\u4E0A\u4F20\u97F3\u9891"><i class="fa-solid fa-upload"></i> \u672C\u5730\u4E0A\u4F20</button>
                            <button type="button" class="st-chatu8-btn" id="comfyui_aud_asset_btn_${i}" style="flex: 1; min-width: 80px; padding: 4px 8px; font-size: 12px;" title="\u4ECE\u89C6\u9891\u8D44\u4EA7\u5E93\u4E2D\u9009\u53D6\u97F3\u9891\u7D20\u6750"><i class="fa-solid fa-music"></i> \u89C6\u9891\u8D44\u4EA7</button>
                            <button type="button" class="st-chatu8-btn danger" id="comfyui_aud_clear_btn_${i}" style="padding: 4px 8px; font-size: 12px; ${uploadedName ? "" : "display: none;"}" title="\u6E05\u9664"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <label for="${descKey}" style="font-size: 11px; color: var(--st-chatu8-text-secondary, #888);"><i class="fa-solid fa-pen-to-square"></i> \u97F3\u9891\u7B80\u4ECB (\u968F\u97F3\u9891\u4F20\u7ED9LLM)</label>
                            <textarea id="${descKey}" class="st-chatu8-textarea" rows="2" placeholder="\u8F93\u5165\u97F3\u9891 ${i} \u7B80\u4ECB\uFF08\u5982\u914D\u4E50/\u60C5\u7EEA/\u8282\u594F/\u5BF9\u767D\uFF09..." style="font-size: 12px; padding: 4px 8px; resize: vertical; min-height: 38px;">${escapeHtml7(currentDesc)}</textarea>
                        </div>
                    </div>
                </div>
            `;
      $audContainer.append(cardHtml);
      $(`.comfyui-swap-btn[data-type="aud"][data-index="${i}"]`).on("click", (e) => {
        e.stopPropagation();
        if (pendingComfyUISwap.type === "aud" && pendingComfyUISwap.index === i) {
          pendingComfyUISwap = { type: null, index: null };
          renderComfyUIAudioCards();
          toastr.info("\u5DF2\u53D6\u6D88\u4EA4\u6362");
        } else if (pendingComfyUISwap.type === "aud" && pendingComfyUISwap.index !== null) {
          const srcIdx = pendingComfyUISwap.index;
          pendingComfyUISwap = { type: null, index: null };
          swapComfyUIMedia("aud", srcIdx, i);
        } else {
          pendingComfyUISwap = { type: "aud", index: i };
          renderComfyUIAudioCards();
          toastr.info(`\u5DF2\u9009\u4E2D <Audio ${i}>\uFF0C\u8BF7\u70B9\u51FB\u53E6\u4E00\u4E2A\u5361\u7247\u7684\u3010\u4E92\u6362\u3011\u6309\u94AE\uFF08\u518D\u6B21\u70B9\u51FB\u81EA\u8EAB\u53EF\u53D6\u6D88\uFF09`);
        }
      });
      $(`#${ctrlKey}`).on("change", (e) => {
        const val = e.target.value;
        settings3[ctrlKey] = val;
        saveSettingsDebounced();
        const hasMedia = Boolean(settings3.runninghub_uploadedMedia?.aud?.[i] || sessionUploadedMedia2.audFiles?.[i]);
        const $overlay = $(`#comfyui_aud_mute_overlay_${i}`);
        const $aud = $(`#comfyui_preview_aud_${i}`);
        if (val === "mute" && hasMedia) {
          $aud.addClass("st-chatu8-preview-muted");
          $overlay.css("display", "flex");
        } else {
          $aud.removeClass("st-chatu8-preview-muted");
          $overlay.hide();
        }
      });
      $(`#${descKey}`).on("input", (e) => {
        settings3[descKey] = e.target.value;
        saveSettingsDebounced();
      });
      $(`#comfyui_aud_upload_btn_${i}`).on("click", () => {
        $(`#comfyui_aud_file_${i}`).click();
      });
      $(`#comfyui_aud_asset_btn_${i}`).on("click", () => {
        openVideoAssetPicker({
          type: "aud",
          title: `<i class="fa-solid fa-music" style="color: #ec4899;"></i> \u4E3A &lt;Audio ${i}&gt; \u9009\u62E9\u89C6\u9891\u97F3\u9891\u8D44\u4EA7`,
          onSelect: async (asset, audioBlob) => {
            const preview = document.getElementById(`comfyui_preview_aud_${i}`);
            if (preview) {
              preview.src = URL.createObjectURL(audioBlob);
            }
            $(`#comfyui_aud_preview_box_${i}`).css("display", "flex");
            if (settings3[ctrlKey] === "mute") {
              $(`#comfyui_preview_aud_${i}`).addClass("st-chatu8-preview-muted");
              $(`#comfyui_aud_mute_overlay_${i}`).css("display", "flex");
            } else {
              $(`#comfyui_preview_aud_${i}`).removeClass("st-chatu8-preview-muted");
              $(`#comfyui_aud_mute_overlay_${i}`).hide();
            }
            try {
              toastr.info(`\u6B63\u5728\u4E0A\u4F20\u8D44\u4EA7\u97F3\u9891 [${asset.name || "audio"}] \u5230 ComfyUI...`);
              const assetFileName = `${(asset.name || `audio_${i}`).replace(/[\\/:*?"<>|]/g, "_")}.mp3`;
              const fileObj = new File([audioBlob], assetFileName, { type: audioBlob.type || "audio/mpeg" });
              sessionUploadedMedia2.audFiles[i] = fileObj;
              const serverFileName = await uploadComfyUIImageDirect(audioBlob, assetFileName);
              if (!settings3.runninghub_uploadedMedia) settings3.runninghub_uploadedMedia = { img: {}, aud: {} };
              if (!settings3.runninghub_uploadedMedia.aud) settings3.runninghub_uploadedMedia.aud = {};
              settings3.runninghub_uploadedMedia.aud[i] = serverFileName;
              sessionUploadedMedia2.aud[i] = serverFileName;
              $(`#comfyui_aud_status_${i}`).html(`<i class="fa-solid fa-check-circle"></i> \u5DF2\u4E0A\u4F20: ${serverFileName}`).css("color", "#4caf50");
              $(`#comfyui_aud_clear_btn_${i}`).show();
              const currentDescVal = $(`#${descKey}`).val() || "";
              if (!currentDescVal.trim() && asset.description && asset.description.trim()) {
                const newDesc = asset.description.trim();
                $(`#${descKey}`).val(newDesc);
                settings3[descKey] = newDesc;
              }
              saveSettingsDebounced();
              toastr.success(`\u97F3\u9891 ${i} \u5DF2\u4ECE\u89C6\u9891\u8D44\u4EA7\u8F7D\u5165: ${serverFileName}`);
            } catch (err) {
              alert("\u97F3\u9891\u8F7D\u5165\u5931\u8D25: " + err.message);
            }
          }
        });
      });
      $(`#comfyui_aud_file_${i}`).on("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = document.getElementById(`comfyui_preview_aud_${i}`);
        if (preview) {
          preview.src = URL.createObjectURL(file);
        }
        $(`#comfyui_aud_preview_box_${i}`).css("display", "flex");
        if (settings3[ctrlKey] === "mute") {
          $(`#comfyui_preview_aud_${i}`).addClass("st-chatu8-preview-muted");
          $(`#comfyui_aud_mute_overlay_${i}`).css("display", "flex");
        } else {
          $(`#comfyui_preview_aud_${i}`).removeClass("st-chatu8-preview-muted");
          $(`#comfyui_aud_mute_overlay_${i}`).hide();
        }
        try {
          toastr.info(`\u6B63\u5728\u4E0A\u4F20\u97F3\u9891 ${i} \u5230 ComfyUI...`);
          sessionUploadedMedia2.audFiles[i] = file;
          const audioBlob = file;
          const serverFileName = await uploadComfyUIImageDirect(audioBlob, file.name);
          if (!settings3.runninghub_uploadedMedia) settings3.runninghub_uploadedMedia = { img: {}, aud: {} };
          if (!settings3.runninghub_uploadedMedia.aud) settings3.runninghub_uploadedMedia.aud = {};
          settings3.runninghub_uploadedMedia.aud[i] = serverFileName;
          sessionUploadedMedia2.aud[i] = serverFileName;
          $(`#comfyui_aud_status_${i}`).html(`<i class="fa-solid fa-check-circle"></i> \u5DF2\u4E0A\u4F20: ${serverFileName}`).css("color", "#4caf50");
          $(`#comfyui_aud_clear_btn_${i}`).show();
          saveSettingsDebounced();
          toastr.success(`\u97F3\u9891 ${i} \u4E0A\u4F20\u6210\u529F: ${serverFileName}`);
        } catch (err) {
          alert("\u97F3\u9891\u4E0A\u4F20\u5931\u8D25: " + err.message);
        }
      });
      $(`#comfyui_aud_clear_btn_${i}`).on("click", () => {
        if (settings3.runninghub_uploadedMedia?.aud) {
          delete settings3.runninghub_uploadedMedia.aud[i];
        }
        delete sessionUploadedMedia2.aud[i];
        delete sessionUploadedMedia2.audFiles[i];
        const fileInput = document.getElementById(`comfyui_aud_file_${i}`);
        if (fileInput) fileInput.value = "";
        $(`#comfyui_aud_preview_box_${i}`).hide();
        $(`#comfyui_preview_aud_${i}`).removeClass("st-chatu8-preview-muted").removeAttr("src");
        $(`#comfyui_aud_mute_overlay_${i}`).hide();
        $(`#comfyui_aud_status_${i}`).text("\u672A\u6307\u5B9A\u672C\u5730\u97F3\u9891\uFF08\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u6216\u63D0\u793A\u8BCD\u89C6\u6750\uFF09").css("color", "var(--st-chatu8-text-secondary, #888)");
        $(`#comfyui_aud_clear_btn_${i}`).hide();
        saveSettingsDebounced();
        toastr.info(`\u5DF2\u6E05\u9664\u97F3\u9891 ${i}`);
      });
    }
  }
  renderComfyUIAudioCards();
  const testDemandEl = document.getElementById("comfyui_video_test_demand");
  if (testDemandEl) {
    testDemandEl.value = settings3.comfyui_video_test_demand || "";
    $(testDemandEl).off("input change.comfy_demand").on("input change.comfy_demand", (e) => {
      settings3.comfyui_video_test_demand = e.target.value;
      saveSettingsDebounced();
    });
  }
  const testPromptEl = document.getElementById("comfyui_video_test_prompt");
  if (testPromptEl) {
    testPromptEl.value = settings3.comfyui_video_test_prompt || "";
    $(testPromptEl).off("input change.comfy_test").on("input change.comfy_test", (e) => {
      settings3.comfyui_video_test_prompt = e.target.value;
      saveSettingsDebounced();
    });
  }
  let currentTestAbortController = null;
  let currentTestTaskId = null;
  async function handleRunVideoTest(testType) {
    const isImg2Vid = testType === "img2vid";
    const testModeName = isImg2Vid ? "\u5355\u56FE\u751F\u89C6\u9891" : "\u591A\u56FE\u751F\u89C6\u9891";
    const $status = $("#comfyui_video_test_status");
    const $previewContainer = $("#comfyui_video_test_preview_container");
    const $cancelBtn = $("#comfyui_test_cancel_btn");
    const $refBtn = $("#comfyui_test_ref2vid_btn");
    const $imgBtn = $("#comfyui_test_img2vid_btn");
    const videoPlayer = document.getElementById("comfyui_video_test_player");
    const promptText = (document.getElementById("comfyui_video_test_prompt")?.value || settings3.comfyui_video_test_prompt || "").trim();
    if (!promptText) {
      toastr.warning("\u8BF7\u5148\u8F93\u5165\u6D4B\u8BD5\u63D0\u793A\u8BCD (Prompt)");
      return;
    }
    const targetWorkerId = isImg2Vid ? settings3.comfyui_img2vid_workerid || "" : settings3.comfyui_ref2vid_workerid || "";
    let targetWorkerJson = targetWorkerId && settings3.comfyui_video_workers?.[targetWorkerId] || (isImg2Vid ? settings3.comfyui_img2vid_worker : settings3.comfyui_ref2vid_worker) || settings3.worker || defaultSettings.comfyui_video_workers?.["\u9ED8\u8BA4-\u89C6\u9891\u5DE5\u4F5C\u6D41"] || "";
    if (!targetWorkerJson) {
      toastr.warning(`\u672A\u627E\u5230\u3010${testModeName}\u3011\u5BF9\u5E94\u7684\u5DE5\u4F5C\u6D41 JSON \u914D\u7F6E`);
      return;
    }
    const uploadedImages = {};
    if (isImg2Vid) {
      const img1 = settings3.runninghub_uploadedMedia?.img?.[1] || sessionUploadedMedia2.img?.[1] || "";
      if (img1) {
        uploadedImages[1] = img1;
      }
    } else {
      for (let i = 1; i <= 9; i++) {
        const ctrlMode = settings3[`comfyui_img_ctrl_${i}`] || "bypass";
        if (ctrlMode !== "mute") {
          const imgName = settings3.runninghub_uploadedMedia?.img?.[i] || sessionUploadedMedia2.img?.[i] || "";
          if (imgName) {
            uploadedImages[i] = imgName;
          }
        }
      }
    }
    const uploadedAudios = {};
    for (let i = 1; i <= 3; i++) {
      const ctrlMode = settings3[`comfyui_aud_ctrl_${i}`] || "bypass";
      if (ctrlMode !== "mute") {
        const audName = settings3.runninghub_uploadedMedia?.aud?.[i] || sessionUploadedMedia2.aud?.[i] || "";
        if (audName) {
          uploadedAudios[i] = audName;
        }
      }
    }
    const genSettings = {
      seed: document.getElementById("comfyui_val_seed")?.value || settings3.comfyui_val_seed || "-1",
      steps: document.getElementById("comfyui_val_steps")?.value || settings3.comfyui_val_steps || "20",
      megapixels: document.getElementById("comfyui_val_megapixels")?.value || settings3.comfyui_val_megapixels || "0.9",
      duration: document.getElementById("comfyui_val_duration")?.value || settings3.comfyui_val_duration || "4",
      defaultImg: document.getElementById("comfyui_val_default_img")?.value || settings3.comfyui_val_default_img || "",
      defaultAud: document.getElementById("comfyui_val_default_aud")?.value || settings3.comfyui_val_default_aud || "",
      modelName: settings3.MODEL_NAME
    };
    if (videoPlayer) {
      try {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        videoPlayer.removeAttribute("src");
        videoPlayer.load();
      } catch (e) {
        console.warn("[ComfyUIVideoUI] \u6682\u505C\u65E7\u89C6\u9891\u5931\u8D25:", e);
      }
    }
    const downloadBtn = document.getElementById("comfyui_video_test_download_btn");
    if (downloadBtn) {
      downloadBtn.removeAttribute("href");
    }
    const openBtn = document.getElementById("comfyui_video_test_open_btn");
    if (openBtn) {
      openBtn.removeAttribute("href");
    }
    $status.show().html('<div style="color: var(--st-chatu8-accent-color, #667eea);"><i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u521D\u59CB\u5316 ComfyUI \u6D4B\u8BD5\u4EFB\u52A1...</div>');
    $previewContainer.hide();
    $cancelBtn.show();
    $refBtn.prop("disabled", true);
    $imgBtn.prop("disabled", true);
    currentTestAbortController = new AbortController();
    const taskType = isImg2Vid ? TaskType.COMFYUI_IMG2VID : TaskType.COMFYUI_REF2VID;
    currentTestTaskId = taskQueue.addTask({
      name: `[\u6D4B\u8BD5] ${isImg2Vid ? "ComfyUI\u5355\u56FE\u751F\u89C6\u9891" : "ComfyUI\u591A\u56FE\u751F\u89C6\u9891"}: ${(promptText || "").slice(0, 24)}...`,
      type: taskType,
      prompt: promptText
    });
    taskQueue.updateStatus(currentTestTaskId, TaskStatus.RUNNING);
    const onStatusUpdate = (msg, isError = false) => {
      const timeStr = (/* @__PURE__ */ new Date()).toLocaleTimeString();
      const color = isError ? "#f44336" : "var(--st-chatu8-text-primary, #fff)";
      const icon = isError ? '<i class="fa-solid fa-circle-exclamation" style="color: #f44336;"></i>' : '<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--st-chatu8-accent-color, #667eea);"></i>';
      $status.html(`
                <div style="color: ${color};">
                    ${icon} <span style="color: #888; font-size: 11px;">[${timeStr}]</span> ${msg}
                </div>
            `);
    };
    try {
      const result = await executeComfyUIVideoDirectTest({
        prompt: promptText,
        workflowJson: targetWorkerJson,
        uploadedImages,
        uploadedAudios,
        genSettings,
        onStatusUpdate,
        abortSignal: currentTestAbortController.signal
      });
      if (result && result.videoUrl) {
        if (currentTestTaskId) {
          taskQueue.completeTask(currentTestTaskId, true);
        }
        $status.html(`
                    <div style="color: #4caf50; font-weight: 500;">
                        <i class="fa-solid fa-circle-check" style="color: #4caf50;"></i> [${testModeName}] \u89C6\u9891\u751F\u6210\u6210\u529F\uFF01(\u79CD\u5B50: ${result.seedUsed})
                    </div>
                `);
        if (videoPlayer) {
          videoPlayer.src = result.videoUrl;
          videoPlayer.style.display = "block";
          try {
            videoPlayer.load();
            videoPlayer.pause();
          } catch (e) {
          }
        }
        const downloadBtn2 = document.getElementById("comfyui_video_test_download_btn");
        if (downloadBtn2) {
          downloadBtn2.href = result.videoUrl;
          downloadBtn2.download = result.filename || "comfyui_generated_video.mp4";
        }
        const openBtn2 = document.getElementById("comfyui_video_test_open_btn");
        if (openBtn2) {
          openBtn2.href = result.originalUrl || result.videoUrl;
        }
        $previewContainer.css("display", "flex");
        toastr.success(`\u{1F389} ${testModeName} \u6210\u529F\uFF01`);
      } else {
        throw new Error("\u672A\u80FD\u83B7\u53D6\u5230\u751F\u6210\u89C6\u9891\u7684\u6709\u6548\u94FE\u63A5");
      }
    } catch (err) {
      console.error("[ComfyUIVideoTest \u5931\u8D25]", err);
      const isAborted = currentTestAbortController?.signal?.aborted || err.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88";
      if (currentTestTaskId) {
        if (isAborted) {
          taskQueue.cancelTask(currentTestTaskId);
        } else {
          taskQueue.completeTask(currentTestTaskId, false);
        }
      }
      const msg = isAborted ? "\u4EFB\u52A1\u5DF2\u88AB\u7528\u6237\u53D6\u6D88" : err.message || String(err);
      $status.html(`
                <div style="color: ${isAborted ? "#ff9800" : "#f44336"};">
                    <i class="fa-solid ${isAborted ? "fa-ban" : "fa-circle-xmark"}" style="color: ${isAborted ? "#ff9800" : "#f44336"};"></i> ${isAborted ? msg : `\u6D4B\u8BD5\u5931\u8D25: ${msg}`}
                </div>
            `);
      if (isAborted) {
        toastr.info("\u5DF2\u53D6\u6D88\u89C6\u9891\u751F\u6210\u6D4B\u8BD5\u4EFB\u52A1");
      } else {
        toastr.error(`\u6D4B\u8BD5\u5931\u8D25: ${msg}`);
      }
    } finally {
      $cancelBtn.hide();
      $refBtn.prop("disabled", false);
      $imgBtn.prop("disabled", false);
      currentTestAbortController = null;
      currentTestTaskId = null;
    }
  }
  $("#comfyui_test_ref2vid_btn").off("click.comfy_ref2vid").on("click.comfy_ref2vid", () => {
    handleRunVideoTest("ref2vid");
  });
  $("#comfyui_test_img2vid_btn").off("click.comfy_img2vid").on("click.comfy_img2vid", () => {
    handleRunVideoTest("img2vid");
  });
  $("#comfyui_test_cancel_btn").off("click.comfy_cancel").on("click.comfy_cancel", () => {
    if (currentTestTaskId) {
      taskQueue.cancelTask(currentTestTaskId);
    }
    if (currentTestAbortController) {
      currentTestAbortController.abort();
    }
  });
  const handleTaskMgrCancel = async ({ taskId } = {}) => {
    if (taskId && taskId === currentTestTaskId) {
      console.log("[ComfyUIVideoUI] \u63A5\u6536\u5230\u4EFB\u52A1\u7BA1\u7406\u53D6\u6D88\u4E8B\u4EF6:", taskId);
      if (currentTestAbortController) {
        currentTestAbortController.abort();
      }
      const settings4 = extension_settings[extensionName];
      const url = (settings4?.comfyuiUrl || "http://localhost:8188").trim();
      if (url) {
        try {
          await interruptAll(url);
        } catch (_) {
        }
      }
    }
  };
  eventSource.on("st_chatu8_cancel_task", handleTaskMgrCancel);
  eventSource.on("st_chatu8_cancel_comfyui_task", handleTaskMgrCancel);
  async function compressImageSource(source, maxDim = 768, quality = 0.8) {
    if (!source) return null;
    const calcFitDimensions = (origWidth, origHeight, maxLimit) => {
      let width = origWidth || 512;
      let height = origHeight || 512;
      if (width > maxLimit || height > maxLimit) {
        if (width >= height) {
          height = Math.round(height * maxLimit / width);
          width = maxLimit;
        } else {
          width = Math.round(width * maxLimit / height);
          height = maxLimit;
        }
      }
      return {
        width: Math.max(1, width),
        height: Math.max(1, height)
      };
    };
    const drawAndExport = (drawable, origWidth, origHeight) => {
      const { width, height } = calcFitDimensions(origWidth, origHeight, maxDim);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(drawable, 0, 0, width, height);
      try {
        return canvas.toDataURL("image/jpeg", quality);
      } catch (err) {
        console.warn("[compressImageSource] canvas.toDataURL \u5BFC\u51FA\u5931\u8D25 (\u53EF\u80FD\u88AB\u6C61\u67D3):", err);
        return null;
      }
    };
    if (source instanceof HTMLImageElement) {
      if (!source.src || source.style.display === "none") return null;
      if (source.complete && source.naturalWidth > 0) {
        try {
          if (typeof createImageBitmap === "function") {
            const bitmap = await createImageBitmap(source);
            const dataUrl = drawAndExport(bitmap, bitmap.width, bitmap.height);
            bitmap.close();
            if (dataUrl) return dataUrl;
          } else {
            const dataUrl = drawAndExport(source, source.naturalWidth, source.naturalHeight);
            if (dataUrl) return dataUrl;
          }
        } catch (e) {
          console.warn("[compressImageSource] HTMLImageElement \u76F4\u63A5\u8BFB\u53D6\u5931\u8D25\uFF0C\u5C1D\u8BD5\u5E38\u89C4\u56DE\u9000:", e);
        }
      }
    }
    if (source instanceof Blob || source instanceof File) {
      if (typeof createImageBitmap === "function") {
        try {
          const bitmap = await createImageBitmap(source);
          const dataUrl = drawAndExport(bitmap, bitmap.width, bitmap.height);
          bitmap.close();
          if (dataUrl) return dataUrl;
        } catch (err) {
          console.warn("[compressImageSource] createImageBitmap \u89E3\u7801 Blob \u5931\u8D25\uFF0C\u5C1D\u8BD5\u56DE\u9000:", err);
        }
      }
    }
    let imgSrc = "";
    let shouldRevoke = false;
    if (typeof source === "string") {
      imgSrc = source;
    } else if (source instanceof HTMLImageElement) {
      imgSrc = source.src;
    } else if (source instanceof Blob || source instanceof File) {
      imgSrc = URL.createObjectURL(source);
      shouldRevoke = true;
    }
    if (!imgSrc) return null;
    return new Promise((resolve) => {
      const img = new Image();
      const isHttpUrl = imgSrc.startsWith("http://") || imgSrc.startsWith("https://");
      if (isHttpUrl) {
        img.crossOrigin = "Anonymous";
      }
      img.onload = () => {
        if (shouldRevoke) {
          try {
            URL.revokeObjectURL(imgSrc);
          } catch (e) {
          }
        }
        const dataUrl = drawAndExport(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        if (shouldRevoke) {
          try {
            URL.revokeObjectURL(imgSrc);
          } catch (e) {
          }
        }
        console.warn("[compressImageSource] \u56FE\u7247\u52A0\u8F7D\u5931\u8D25:", err, imgSrc?.slice?.(0, 100));
        resolve(null);
      };
      img.src = imgSrc;
    });
  }
  async function getAudioMetadata(index) {
    const file = sessionUploadedMedia2.audFiles?.[index] || document.getElementById(`comfyui_aud_file_${index}`)?.files?.[0];
    const serverFileName = settings3.runninghub_uploadedMedia?.aud?.[index] || sessionUploadedMedia2.aud?.[index] || "";
    const preview = document.getElementById(`comfyui_preview_aud_${index}`);
    const hasAudio = Boolean(file || serverFileName || preview && preview.src && preview.style.display !== "none");
    if (!hasAudio) {
      return { index, fileName: "", durationStr: "", hasAudio: false };
    }
    const fileName = file?.name || serverFileName || `\u97F3\u9891${index}`;
    let durationSec = 0;
    if (preview && !isNaN(preview.duration) && preview.duration > 0) {
      durationSec = preview.duration;
    } else if (file) {
      try {
        const url = URL.createObjectURL(file);
        const tempAudio = new Audio();
        await new Promise((resolve) => {
          tempAudio.onloadedmetadata = () => {
            durationSec = tempAudio.duration || 0;
            URL.revokeObjectURL(url);
            resolve();
          };
          tempAudio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          tempAudio.src = url;
          setTimeout(() => {
            URL.revokeObjectURL(url);
            resolve();
          }, 300);
        });
      } catch (e) {
        console.warn(`[getAudioMetadata] \u83B7\u53D6\u97F3\u9891${index}\u65F6\u957F\u5931\u8D25:`, e);
      }
    }
    const durationStr = durationSec > 0 ? `${durationSec.toFixed(1)}\u79D2` : "\u5DF2\u4E0A\u4F20";
    return { index, fileName, durationStr, hasAudio: true };
  }
  function attachImagesToMessage9(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
    if (!images || images.length === 0 || messageIndex < 0 || messageIndex >= messages.length) {
      return messages;
    }
    const result = [...messages];
    const targetMsg = result[messageIndex];
    const contentParts = [];
    if (typeof targetMsg.content === "string") {
      contentParts.push({ type: "text", text: targetMsg.content });
    } else if (Array.isArray(targetMsg.content)) {
      contentParts.push(...targetMsg.content);
    }
    images.forEach((imgItem, idx) => {
      const imgBase64 = typeof imgItem === "string" ? imgItem : imgItem.base64;
      const imgName = typeof imgItem === "object" && imgItem.name ? imgItem.name : `${imageLabel}${idx + 1}`;
      const imgDesc = (typeof imgItem === "object" && imgItem.description ? imgItem.description : "").trim();
      let labelText = imgName.startsWith("<") && imgName.endsWith(">") ? `
${imgName}` : `
[${imgName}]`;
      if (imgDesc) {
        labelText += `
\u7B80\u4ECB: ${imgDesc}`;
      }
      contentParts.push({ type: "text", text: labelText });
      let imageUrl = imgBase64;
      if (!imgBase64.startsWith("data:")) {
        imageUrl = `data:image/jpeg;base64,${imgBase64}`;
      }
      contentParts.push({
        type: "image_url",
        image_url: { url: imageUrl, detail: "auto" }
      });
    });
    result[messageIndex] = { ...targetMsg, content: contentParts };
    return result;
  }
  function findUserDemandMessageIndex2(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  }
  function stripAssetManifest(text) {
    if (!text || typeof text !== "string") return "";
    let cleaned = text.trim();
    const manifestJsonRegex = /asset_manifest\s*:\s*\{[\s\S]*?\}/i;
    const matchJson = cleaned.match(manifestJsonRegex);
    if (matchJson) {
      cleaned = cleaned.replace(matchJson[0], "").trim();
    } else {
      const manifestYamlRegex = /^\s*asset_manifest\s*:[\s\S]*?(?=(?:subject_definitions|summary|shot_1|clip_1|prompt|visual_scene|scene_1|主体定义|分镜|镜头)\s*:|$)/im;
      cleaned = cleaned.replace(manifestYamlRegex, "").trim();
    }
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*/i, "").replace(/```$/g, "").trim();
    return cleaned.replace(/^[\r\n]+/, "").trim();
  }
  function extractVideoPromptFromLLMResponse(llmText) {
    if (!llmText || typeof llmText !== "string") return "";
    const cleaned = removeThinkingTags(llmText);
    const parsedVideos = parseVideosFromPrompt(cleaned);
    let promptResult = "";
    if (parsedVideos && parsedVideos.length > 0) {
      const startTag = settings3?.startTag || "image###";
      const endTag = settings3?.endTag || "###";
      const contents = parsedVideos.map((v) => {
        let content = v.tag;
        if (content.startsWith(startTag)) content = content.substring(startTag.length);
        if (content.endsWith(endTag)) content = content.substring(0, content.length - endTag.length);
        return content.trim();
      });
      promptResult = contents.join("\n\n");
    } else {
      promptResult = cleaned.replace(/```(?:json|yaml|xml)?/gi, "").replace(/```/g, "").trim();
    }
    if (promptResult) {
      promptResult = promptResult.replace(/《/g, "<").replace(/》/g, ">");
      promptResult = promptResult.replace(/\\n/g, "\n");
    }
    return promptResult;
  }
  async function handleLlmImg2VidPromptGen() {
    const $btn = $("#comfyui_test_llm_img2vid_btn");
    const origHtml = $btn.html();
    const userDemand = (document.getElementById("comfyui_video_test_demand")?.value || settings3.comfyui_video_test_demand || "").trim();
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u751F\u6210\u4E2D...');
    try {
      const img1Ctrl = document.getElementById("comfyui_img_ctrl_1")?.value || settings3.comfyui_img_ctrl_1 || "bypass";
      const isImg1Muted = img1Ctrl === "mute";
      let compressedImg1 = null;
      let img1Desc = "";
      if (!isImg1Muted) {
        const img1Source = sessionUploadedMedia2.imgFiles?.[1] || document.getElementById("comfyui_img_file_1")?.files?.[0] || document.getElementById("comfyui_preview_img_1");
        const hasImg1 = Boolean(
          sessionUploadedMedia2.imgFiles?.[1] || document.getElementById("comfyui_img_file_1")?.files?.[0] || document.getElementById("comfyui_preview_img_1")?.getAttribute("src") && !document.getElementById("comfyui_preview_img_1")?.getAttribute("src")?.endsWith("/")
        );
        img1Desc = (document.getElementById("comfyui_img_desc_1")?.value || settings3.comfyui_img_desc_1 || "").trim();
        compressedImg1 = await compressImageSource(img1Source, 768, 0.8);
        if (!compressedImg1) {
          if (hasImg1) {
            toastr.warning("\u8B66\u544A\uFF1A\u56FE\u7247 1 \u8BFB\u53D6\u6216\u538B\u7F29\u5931\u8D25\uFF0C\u5C06\u4EC5\u4EE5\u6587\u5B57\u65B9\u5F0F\u8BF7\u6C42 LLM");
          } else {
            toastr.info("\u63D0\u793A\uFF1A\u56FE\u7247 1 \u672A\u4E0A\u4F20\uFF0C\u5C06\u4EE5\u7EAF\u9700\u6C42\u6587\u672C\u65B9\u5F0F\u751F\u6210\u63D0\u793A\u8BCD");
          }
        }
      } else {
        toastr.info("\u63D0\u793A\uFF1A\u56FE\u7247 1 \u5F53\u524D\u8BBE\u7F6E\u4E3A\u505C\u7528 (Mute)\uFF0C\u5DF2\u8DF3\u8FC7\u4F5C\u4E3A\u53C2\u8003\u9644\u4EF6");
      }
      let prompt2 = buildPromptForRequestType("video_gen", userDemand || "");
      if (!prompt2 || prompt2.length === 0) {
        throw new Error("\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D\u300C\u56FE\u751F\u89C6\u9891\u300D\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E");
      }
      prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("video_gen"));
      const duration = document.getElementById("comfyui_val_duration")?.value || settings3.comfyui_val_duration || "4";
      const contextData = {
        context: "",
        body: "\u5267\u60C5\u548C\u53D1\u5C55\u8BF7\u4F9D\u7167\u7528\u6237\u9700\u6C42",
        userDemand,
        duration,
        variables: /* @__PURE__ */ new Map(),
        characterListText: "",
        outfitEnableListText: "",
        commonCharacterListText: ""
      };
      const { messages: processedMessages } = await replaceAllPlaceholders(prompt2, contextData);
      prompt2 = processedMessages;
      const userMsgIdx = findUserDemandMessageIndex2(prompt2);
      if (userMsgIdx >= 0) {
        if (compressedImg1) {
          prompt2 = attachImagesToMessage9(prompt2, userMsgIdx, [{
            base64: compressedImg1,
            name: "<Picture 1>",
            description: img1Desc
          }], "Picture");
        } else if (img1Desc) {
          const descNote = `
<Picture 1>
\u7B80\u4ECB: ${img1Desc}`;
          const targetMsg = prompt2[userMsgIdx];
          if (typeof targetMsg.content === "string") {
            targetMsg.content += descNote;
          } else if (Array.isArray(targetMsg.content)) {
            targetMsg.content.push({ type: "text", text: descNote });
          }
        }
      }
      toastr.info("\u{1F3AC} \u6B63\u5728\u8BF7\u6C42 LLM \u751F\u6210\u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD...");
      const llmResponse = await LLM_VIDEO_GEN(prompt2, { timeoutMs: 6e5 });
      if (llmResponse.testMode) {
        toastr.info("LLM \u6D4B\u8BD5\u6A21\u5F0F\u54CD\u5E94\u6210\u529F");
        return;
      }
      const finalPrompt = extractVideoPromptFromLLMResponse(llmResponse.result);
      if (!finalPrompt) {
        toastr.warning("\u672A\u80FD\u4ECE LLM \u8FD4\u56DE\u4E2D\u89E3\u6790\u51FA\u6709\u6548\u7684\u89C6\u9891\u63D0\u793A\u8BCD");
        return;
      }
      const promptEl = document.getElementById("comfyui_video_test_prompt");
      if (promptEl) {
        promptEl.value = finalPrompt;
        $(promptEl).trigger("input");
      }
      settings3.comfyui_video_test_prompt = finalPrompt;
      saveSettingsDebounced();
      toastr.success("\u{1F3AC} \u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD\u751F\u6210\u6210\u529F\u5E76\u5DF2\u586B\u5165\u6D4B\u8BD5\u6846\uFF01");
    } catch (err) {
      console.error("[ComfyUIVideoTest] \u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25:", err);
      toastr.error("\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25: " + (err.message || err));
    } finally {
      $btn.prop("disabled", false).html(origHtml);
    }
  }
  async function handleLlmRef2VidPromptGen() {
    const $btn = $("#comfyui_test_llm_ref2vid_btn");
    const origHtml = $btn.html();
    const userDemand = (document.getElementById("comfyui_video_test_demand")?.value || settings3.comfyui_video_test_demand || "").trim();
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u751F\u6210\u4E2D...');
    try {
      const collectedImages = [];
      const textOnlyImageDescs = [];
      const failedImageIndices = [];
      for (let i = 1; i <= 9; i++) {
        const ctrlMode = document.getElementById(`comfyui_img_ctrl_${i}`)?.value || settings3[`comfyui_img_ctrl_${i}`] || "bypass";
        if (ctrlMode === "mute") {
          continue;
        }
        const imgSource = sessionUploadedMedia2.imgFiles?.[i] || document.getElementById(`comfyui_img_file_${i}`)?.files?.[0] || document.getElementById(`comfyui_preview_img_${i}`);
        const hasImgSource = Boolean(
          sessionUploadedMedia2.imgFiles?.[i] || document.getElementById(`comfyui_img_file_${i}`)?.files?.[0] || document.getElementById(`comfyui_preview_img_${i}`)?.getAttribute("src") && !document.getElementById(`comfyui_preview_img_${i}`)?.getAttribute("src")?.endsWith("/")
        );
        const desc = (document.getElementById(`comfyui_img_desc_${i}`)?.value || settings3[`comfyui_img_desc_${i}`] || "").trim();
        const compressed = await compressImageSource(imgSource, 512, 0.8);
        if (compressed) {
          collectedImages.push({
            base64: compressed,
            name: `<Picture ${i}>`,
            description: desc
          });
        } else {
          if (hasImgSource) {
            failedImageIndices.push(i);
          }
          if (desc) {
            textOnlyImageDescs.push({ index: i, description: desc });
          }
        }
      }
      if (failedImageIndices.length > 0) {
        console.warn(`[ComfyUI] \u56FE\u7247 ${failedImageIndices.join(", ")} \u8BFB\u53D6\u6216\u538B\u7F29\u5931\u8D25\uFF0C\u672A\u80FD\u4F5C\u4E3A\u591A\u6A21\u6001\u9644\u4EF6\u53D1\u9001`);
        if (window.toastr) {
          toastr.warning(`\u56FE\u7247 ${failedImageIndices.join(", ")} \u8BFB\u53D6\u6216\u538B\u7F29\u5931\u8D25\uFF0C\u5DF2\u8F6C\u4E3A\u4EC5\u6587\u5B57\u8BF4\u660E\u6216\u8DF3\u8FC7`);
        }
      }
      const collectedAudios = [];
      for (let i = 1; i <= 3; i++) {
        const ctrlMode = document.getElementById(`comfyui_aud_ctrl_${i}`)?.value || settings3[`comfyui_aud_ctrl_${i}`] || "bypass";
        if (ctrlMode === "mute") {
          continue;
        }
        const audMeta = await getAudioMetadata(i);
        const desc = (document.getElementById(`comfyui_aud_desc_${i}`)?.value || settings3[`comfyui_aud_desc_${i}`] || "").trim();
        if (audMeta.hasAudio || desc) {
          collectedAudios.push({
            ...audMeta,
            index: i,
            description: desc
          });
        }
      }
      let prompt2 = buildPromptForRequestType("visual_mat_prep", userDemand || "");
      if (!prompt2 || prompt2.length === 0) {
        throw new Error("\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D\u300C\u89C6\u6750\u51C6\u5907\u300D\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E");
      }
      prompt2 = mergeAdjacentMessages(prompt2, getMergeOptionsForRequestType("visual_mat_prep"));
      const duration = document.getElementById("comfyui_val_duration")?.value || settings3.comfyui_val_duration || "4";
      const contextData = {
        context: "",
        body: "\u5267\u60C5\u548C\u53D1\u5C55\u8BF7\u4F9D\u7167\u7528\u6237\u9700\u6C42",
        userDemand,
        duration,
        variables: /* @__PURE__ */ new Map(),
        characterListText: "",
        outfitEnableListText: "",
        commonCharacterListText: ""
      };
      const { messages: processedMessages } = await replaceAllPlaceholders(prompt2, contextData);
      prompt2 = processedMessages;
      const userMsgIdx = findUserDemandMessageIndex2(prompt2);
      if (userMsgIdx >= 0) {
        if (collectedImages.length > 0) {
          prompt2 = attachImagesToMessage9(prompt2, userMsgIdx, collectedImages, "Picture");
        }
        if (textOnlyImageDescs.length > 0) {
          const textImgLines = textOnlyImageDescs.map((d) => `- <Picture ${d.index}> \u63CF\u8FF0/\u9700\u6C42: ${d.description}`).join("\n");
          const textImgNote = `
[\u53C2\u8003\u56FE\u7247\u6587\u672C\u8BF4\u660E]
${textImgLines}`;
          const targetMsg = prompt2[userMsgIdx];
          if (typeof targetMsg.content === "string") {
            targetMsg.content += textImgNote;
          } else if (Array.isArray(targetMsg.content)) {
            targetMsg.content.push({ type: "text", text: textImgNote });
          }
        }
        if (collectedAudios.length > 0) {
          const audioDescLines = collectedAudios.map((a) => {
            let line = `- <Audio ${a.index}>: `;
            if (a.hasAudio) {
              line += `${a.fileName} (\u65F6\u957F: ${a.durationStr})`;
            } else {
              line += `(\u672A\u4E0A\u4F20\u97F3\u9891\u6587\u4EF6)`;
            }
            if (a.description) {
              line += ` \u7B80\u4ECB/\u8981\u6C42: ${a.description}`;
            }
            return line;
          }).join("\n");
          const audioNote = `
[\u5DF2\u63D0\u4F9B\u53C2\u8003\u97F3\u9891\u4FE1\u606F]
${audioDescLines}
\u8BF7\u4F9D\u636E\u4E0A\u8FF0\u97F3\u9891\u8282\u594F\u4E0E\u65F6\u957F\u7EA6\u675F\u8BBE\u8BA1\u5206\u955C\u4E0E\u753B\u9762\u52A8\u4F5C\u3002`;
          const targetMsg = prompt2[userMsgIdx];
          if (typeof targetMsg.content === "string") {
            targetMsg.content += audioNote;
          } else if (Array.isArray(targetMsg.content)) {
            targetMsg.content.push({ type: "text", text: audioNote });
          }
        }
      }
      toastr.info(`\u{1F3AC} \u6B63\u5728\u8BF7\u6C42 LLM (\u5DF2\u9644\u5E26 ${collectedImages.length} \u5F20\u56FE\u7247\u53CA ${collectedAudios.length} \u6761\u97F3\u9891\u53C2\u8003)...`);
      const llmResponse = await LLM_VISUAL_MAT_PREP(prompt2, { timeoutMs: 6e5 });
      if (llmResponse.testMode) {
        toastr.info("LLM \u6D4B\u8BD5\u6A21\u5F0F\u54CD\u5E94\u6210\u529F");
        return;
      }
      const finalPrompt = extractVideoPromptFromLLMResponse(llmResponse.result);
      if (!finalPrompt) {
        toastr.warning("\u672A\u80FD\u4ECE LLM \u8FD4\u56DE\u4E2D\u89E3\u6790\u51FA\u6709\u6548\u7684\u89C6\u9891\u63D0\u793A\u8BCD");
        return;
      }
      const promptEl = document.getElementById("comfyui_video_test_prompt");
      if (promptEl) {
        promptEl.value = finalPrompt;
        $(promptEl).trigger("input");
      }
      settings3.comfyui_video_test_prompt = finalPrompt;
      saveSettingsDebounced();
      toastr.success("\u{1F3AC} \u89C6\u6750\u51C6\u5907\u63D0\u793A\u8BCD\u751F\u6210\u6210\u529F\u5E76\u5DF2\u586B\u5165\u6D4B\u8BD5\u6846\uFF01");
    } catch (err) {
      console.error("[ComfyUIVideoTest] \u53C2\u8003\u751F\u89C6\u9891\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25:", err);
      toastr.error("\u63D0\u793A\u8BCD\u751F\u6210\u5931\u8D25: " + (err.message || err));
    } finally {
      $btn.prop("disabled", false).html(origHtml);
    }
  }
  $("#comfyui_test_llm_img2vid_btn").off("click.comfy_llm_img2vid").on("click.comfy_llm_img2vid", handleLlmImg2VidPromptGen);
  $("#comfyui_test_llm_ref2vid_btn").off("click.comfy_llm_ref2vid").on("click.comfy_llm_ref2vid", handleLlmRef2VidPromptGen);
}

export { UPLOAD_CACHE_EXPIRY_MS3, initComfyUIVideoUI, sessionUploadedMedia };
