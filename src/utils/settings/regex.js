// 还原自打包产物 — 原始模块: utils/settings/regex.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../../script.js";
import { eventNames, extensionName } from "../config.js";
import { addLog, clearLog } from "../utils.js";
import { stylInput } from "../ui_common.js";
import { debugBranch, debugContent, debugLog, debugTimer } from "../debugLogger.js";
import { applyWordReplacement } from "../wordReplacementService.js";
import { DANGEROUS_REGEX_PATTERNS, DEFAULT_REGEX_ENTRY, REGEX_TIMEOUT_MS, REGEX_WORKER_CODE, __set_beforeAfterEditor, __set_clickTriggerEnabledSwitch, __set_currentEditingRegexEntry, __set_defaultCharDemandTextarea, __set_defaultImageDemandTextarea, __set_defaultVisualPrepDemandTextarea, __set_demandProfileSelect, __set_gestureEnabledSwitch, __set_gestureMatchThresholdSlider, __set_gestureMatchThresholdValue, __set_gestureShowRecognitionSwitch, __set_gestureShowTrailSwitch, __set_gestureTrailColorPicker, __set_imageGenDemandEnabledSwitch, __set_originalText, __set_profileSelect2, __set_regexEntriesContainer, __set_regexEntryIdCounter, __set_regexRequestIdCounter, __set_regexTestModeSwitch, __set_resultText, __set_sharedRegexWorker, __set_sharedRegexWorkerUrl, __set_textEditor, __set_visualPrepDemandEnabledSwitch, beforeAfterEditor, clickTriggerEnabledSwitch, currentEditingRegexEntry, defaultCharDemandTextarea, defaultImageDemandTextarea, defaultVisualPrepDemandTextarea, demandProfileSelect, gestureEnabledSwitch, gestureMatchThresholdSlider, gestureMatchThresholdValue, gestureShowRecognitionSwitch, gestureShowTrailSwitch, gestureTrailColorPicker, imageGenDemandEnabledSwitch, originalText, pendingRegexRequests, profileSelect2, regexEntriesContainer, regexEntryIdCounter, regexRequestIdCounter, regexTestModeSwitch, resultText, sharedRegexWorker, sharedRegexWorkerUrl, textEditor, visualPrepDemandEnabledSwitch } from "../ui.js";
import { initGestureMonitor, recordGesture, stopGestureMonitor } from "./Drawing.js";
import { initClickTriggerMonitor, stopClickTriggerMonitor } from "./ClickTrigger.js";
import { initWordReplacementSettings } from "./wordReplacement.js";

var $container, activeImageListener, activeImageRequestId, activeInspectingWorldName, activeMobileTab, allAvailableWorldsList, boundElements, cachedWorldEntriesMap, clickPollingTimer, currentBubble, currentEntryDisplayedCount, currentEntryFilter, currentEntryPageSize, currentEntrySearchKeyword, currentImg2ImgRefImage, currentImg2ImgRefName, currentOverlay, currentWorldFilter, currentWorldSearchKeyword, isGenerating2, isGeneratingImage, latestGeneratedAsset, latestGeneratedImageData;

var $container = null;

var isGenerating2 = false;

var allAvailableWorldsList = [];

var cachedWorldEntriesMap = {};

var activeInspectingWorldName = null;

var currentWorldSearchKeyword = "";

var currentEntrySearchKeyword = "";

var currentWorldFilter = "all";

var currentEntryFilter = "all";

var activeMobileTab = "worlds";

var currentEntryPageSize = 40;

var currentEntryDisplayedCount = 40;

var isGeneratingImage = false;

var activeImageRequestId = null;

var activeImageListener = null;

var latestGeneratedImageData = null;

var latestGeneratedAsset = null;

var currentImg2ImgRefImage = "";

var currentImg2ImgRefName = "";
var clickPollingTimer = null;

var boundElements = /* @__PURE__ */ new WeakSet();

var currentOverlay = null;

var currentBubble = null;
function getSharedRegexWorker() {
  if (!sharedRegexWorker) {
    const blob = new Blob([REGEX_WORKER_CODE], { type: "application/javascript" });
    __set_sharedRegexWorkerUrl(URL.createObjectURL(blob));
    __set_sharedRegexWorker(new Worker(sharedRegexWorkerUrl));
    sharedRegexWorker.onmessage = (e) => {
      const { requestId, ready, success, result, error } = e.data;
      const pending = pendingRegexRequests.get(requestId);
      if (!pending) {
        return;
      }
      if (ready) {
        const timeoutId = setTimeout(() => {
          const pendingReq = pendingRegexRequests.get(requestId);
          if (pendingReq) {
            pendingRegexRequests.delete(requestId);
            pendingReq.resolve({
              success: false,
              error: `\u6B63\u5219\u6267\u884C\u8D85\u65F6 (>${REGEX_TIMEOUT_MS}ms)`,
              timeout: true
            });
          }
          destroySharedRegexWorker();
        }, REGEX_TIMEOUT_MS);
        pending.timeoutId = timeoutId;
        return;
      }
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      pendingRegexRequests.delete(requestId);
      pending.resolve({ success, result, error });
    };
    sharedRegexWorker.onerror = (e) => {
      for (const [reqId, pending] of pendingRegexRequests) {
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        pending.resolve({ success: false, error: e.message || "Worker error" });
      }
      pendingRegexRequests.clear();
      destroySharedRegexWorker();
    };
  }
  return sharedRegexWorker;
}

function destroySharedRegexWorker() {
  if (sharedRegexWorker) {
    sharedRegexWorker.terminate();
    __set_sharedRegexWorker(null);
  }
  if (sharedRegexWorkerUrl) {
    URL.revokeObjectURL(sharedRegexWorkerUrl);
    __set_sharedRegexWorkerUrl(null);
  }
}

function executeRegexWithTimeout(operation, text, pattern, flags, replacement = "") {
  return new Promise((resolve) => {
    const requestId = __set_regexRequestIdCounter(regexRequestIdCounter + 1);
    const worker = getSharedRegexWorker();
    pendingRegexRequests.set(requestId, { resolve, timeoutId: null });
    worker.postMessage({ requestId, operation, text, pattern, flags, replacement });
  });
}

function executeRegexWithWarning(regexFn, regexDesc = "\u672A\u77E5\u6B63\u5219") {
  const startTime = performance.now();
  try {
    const result = regexFn();
    const elapsed = performance.now() - startTime;
    if (elapsed > REGEX_TIMEOUT_MS) {
      console.warn(`[st-chatu8] \u6B63\u5219\u6267\u884C\u65F6\u95F4\u8FC7\u957F (${elapsed.toFixed(2)}ms): ${regexDesc}`);
      debugLog("regex.timeout", `\u6B63\u5219\u6267\u884C\u6162: ${regexDesc}`, { \u8017\u65F6: elapsed.toFixed(2) + "ms" });
    }
    return result;
  } catch (e) {
    throw e;
  }
}

function generateRegexEntryId() {
  return `regex_entry_${Date.now()}_${__set_regexEntryIdCounter(regexEntryIdCounter + 1)}`;
}

function createNewRegexEntry() {
  return {
    ...DEFAULT_REGEX_ENTRY,
    id: generateRegexEntryId()
  };
}

function parseSTRegexFormat(json4) {
  if (!json4 || typeof json4 !== "object") {
    return null;
  }
  if (typeof json4.findRegex !== "string") {
    return null;
  }
  return {
    id: json4.id || generateRegexEntryId(),
    scriptName: json4.scriptName || "\u5BFC\u5165\u7684\u6B63\u5219",
    disabled: json4.disabled === true,
    runOnEdit: json4.runOnEdit !== false,
    findRegex: json4.findRegex || "",
    replaceString: json4.replaceString || "",
    trimStrings: Array.isArray(json4.trimStrings) ? json4.trimStrings : [],
    placement: Array.isArray(json4.placement) ? json4.placement : [2],
    substituteRegex: typeof json4.substituteRegex === "number" ? json4.substituteRegex : 0,
    minDepth: json4.minDepth ?? null,
    maxDepth: json4.maxDepth ?? null,
    markdownOnly: json4.markdownOnly !== false,
    promptOnly: json4.promptOnly === true
  };
}

function exportToSTRegexFormat(entry) {
  return {
    id: entry.id || generateRegexEntryId(),
    scriptName: entry.scriptName || "\u672A\u547D\u540D\u6B63\u5219",
    disabled: entry.disabled === true,
    runOnEdit: entry.runOnEdit !== false,
    findRegex: entry.findRegex || "",
    replaceString: entry.replaceString || "",
    trimStrings: Array.isArray(entry.trimStrings) ? entry.trimStrings : [],
    placement: Array.isArray(entry.placement) ? entry.placement : [2],
    substituteRegex: typeof entry.substituteRegex === "number" ? entry.substituteRegex : 0,
    minDepth: entry.minDepth ?? null,
    maxDepth: entry.maxDepth ?? null,
    markdownOnly: entry.markdownOnly !== false,
    promptOnly: entry.promptOnly === true
  };
}

function validateRegexEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return false;
  }
  if (typeof entry.findRegex !== "string") {
    return false;
  }
  if (typeof entry.scriptName !== "string") {
    return false;
  }
  return true;
}

function getRegexEntryEditModalHTML() {
  return `
        <div class="st-chatu8-entry-edit-modal-backdrop" id="ch-regex-entry-edit-modal">
            <div class="st-chatu8-entry-edit-modal">
                <div class="st-chatu8-entry-edit-modal-header">
                    <h4>\u7F16\u8F91\u6B63\u5219\u6761\u76EE</h4>
                    <span class="st-chatu8-entry-edit-modal-close">&times;</span>
                </div>
                <div class="st-chatu8-entry-edit-modal-body">
                    <div class="st-chatu8-modal-field">
                        <label>\u811A\u672C\u540D\u79F0</label>
                        <input type="text" id="ch-regex-modal-script-name" class="st-chatu8-text-input" placeholder="\u811A\u672C\u540D\u79F0" />
                    </div>
                    <div class="st-chatu8-modal-field st-chatu8-modal-toggle-field">
                        <label>\u542F\u7528</label>
                        <div class="st-chatu8-toggle">
                            <input id="ch-regex-modal-enabled" type="checkbox" checked />
                            <span class="st-chatu8-slider"></span>
                        </div>
                    </div>
                    <div class="st-chatu8-modal-field">
                        <label>\u67E5\u627E\u6B63\u5219 (findRegex)</label>
                        <textarea id="ch-regex-modal-find-regex" class="st-chatu8-textarea" rows="4" placeholder="\u8F93\u5165\u6B63\u5219\u8868\u8FBE\u5F0F..."></textarea>
                    </div>
                    <div class="st-chatu8-modal-field">
                        <label>\u66FF\u6362\u5B57\u7B26\u4E32 (replaceString)</label>
                        <textarea id="ch-regex-modal-replace-string" class="st-chatu8-textarea" rows="4" placeholder="\u8F93\u5165\u66FF\u6362\u5B57\u7B26\u4E32..."></textarea>
                    </div>
                </div>
                <div class="st-chatu8-entry-edit-modal-footer">
                    <button class="st-chatu8-btn st-chatu8-modal-cancel-btn">\u53D6\u6D88</button>
                    <button class="st-chatu8-btn st-chatu8-btn-primary st-chatu8-modal-save-btn">\u4FDD\u5B58</button>
                </div>
            </div>
        </div>
    `;
}

function escapeHtmlForRegex(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.replace(/"/g, "&quot;");
}

function renderRegexEntries(entriesData = []) {
  const containerInDocument = regexEntriesContainer && $.contains(document, regexEntriesContainer[0]);
  if (!containerInDocument) {
    __set_regexEntriesContainer($("#ch-regex-entries-container"));
    console.log("[st-chatu8] renderRegexEntries: \u5237\u65B0\u5BB9\u5668\u5F15\u7528");
  }
  if (!regexEntriesContainer || regexEntriesContainer.length === 0) {
    console.warn("[st-chatu8] renderRegexEntries: \u5BB9\u5668\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u6E32\u67D3");
    return;
  }
  regexEntriesContainer.empty();
  if (entriesData.length === 0) {
    regexEntriesContainer.html(`
            <div class="st-chatu8-entries-empty">
                <i class="fa-solid fa-inbox"></i>
                <p>\u6682\u65E0\u6B63\u5219\u6761\u76EE\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0</p>
            </div>
        `);
    return;
  }
  entriesData.forEach((entry, index) => {
    addRegexEntryDOM(entry, index);
  });
  console.log("[st-chatu8] \u6E32\u67D3\u6B63\u5219\u6761\u76EE:", {
    \u5BB9\u5668ID: regexEntriesContainer.attr("id"),
    \u6761\u76EE\u6570: entriesData.length,
    \u6761\u76EE\u540D\u79F0: entriesData.map((e) => e.scriptName || "(\u65E0\u540D\u79F0)")
  });
}

function addRegexEntryDOM(entry, index = -1) {
  const containerInDocument = regexEntriesContainer && $.contains(document, regexEntriesContainer[0]);
  if (!containerInDocument) {
    __set_regexEntriesContainer($("#ch-regex-entries-container"));
    console.log("[st-chatu8] addRegexEntryDOM: \u5237\u65B0\u5BB9\u5668\u5F15\u7528");
  }
  if (!regexEntriesContainer || regexEntriesContainer.length === 0) {
    console.warn("[st-chatu8] addRegexEntryDOM: \u5BB9\u5668\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u6DFB\u52A0\u6761\u76EE");
    return false;
  }
  const entryId = entry.id || generateRegexEntryId();
  const scriptName = entry.scriptName || `\u6B63\u5219 ${index + 1}`;
  const findRegex = entry.findRegex || "";
  const replaceString = entry.replaceString || "";
  const entryDisabled = entry.disabled === true;
  const disabledClass = entryDisabled ? "disabled" : "";
  const regexPreview = findRegex.length > 40 ? findRegex.substring(0, 40) + "..." : findRegex || "(\u7A7A)";
  const hasLongReplaceString = replaceString.length > 100;
  const warningHtml = hasLongReplaceString ? `<span class="st-chatu8-entry-warning" title="\u66FF\u6362\u5B57\u7B26\u4E32\u8D85\u8FC7100\u5B57\u7B26 (${replaceString.length}\u5B57\u7B26)"><i class="fa-solid fa-triangle-exclamation"></i></span>` : "";
  const dangerResult = detectDangerousRegex(findRegex);
  const dangerHtml = generateDangerousRegexWarningHTML(dangerResult.warnings);
  const entryElement = $(`
        <div class="st-chatu8-preset-entry st-chatu8-preset-entry-collapsed ${disabledClass}" 
             data-entry-id="${entryId}" 
             data-find-regex="${escapeHtmlForRegex(findRegex)}"
             data-replace-string="${escapeHtmlForRegex(replaceString)}"
             draggable="true">
            <div class="st-chatu8-entry-header">
                <span class="st-chatu8-entry-drag-handle" title="\u62D6\u62FD\u6392\u5E8F">
                    <i class="fa-solid fa-grip-vertical"></i>
                </span>
                <span class="st-chatu8-entry-role-badge" data-role="regex">REG</span>
                <input type="text" class="st-chatu8-entry-name" value="${escapeHtmlForRegex(scriptName)}" placeholder="\u811A\u672C\u540D\u79F0" readonly />
                ${dangerHtml}
                ${warningHtml}
                <span class="st-chatu8-entry-preview">${escapeHtmlForRegex(regexPreview)}</span>
                <div class="st-chatu8-entry-actions">
                    <div class="st-chatu8-entry-toggle" title="\u542F\u7528/\u7981\u7528">
                        <input type="checkbox" ${!entryDisabled ? "checked" : ""} />
                        <span class="st-chatu8-slider"></span>
                    </div>
                    <button class="st-chatu8-icon-btn st-chatu8-entry-edit" title="\u7F16\u8F91">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="st-chatu8-icon-btn st-chatu8-entry-export" title="\u5BFC\u51FA">
                        <i class="fa-solid fa-file-export"></i>
                    </button>
                    <button class="st-chatu8-icon-btn danger st-chatu8-entry-delete" title="\u5220\u9664\u6761\u76EE">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `);
  entryElement.data("entryData", entry);
  regexEntriesContainer.append(entryElement);
}

function showRegexEntryEditModal($entryElement) {
  __set_currentEditingRegexEntry($entryElement);
  let $modal2 = $("#ch-regex-entry-edit-modal");
  if (!$modal2.length) {
    $("body").append(getRegexEntryEditModalHTML());
    $modal2 = $("#ch-regex-entry-edit-modal");
    $modal2.find(".st-chatu8-entry-edit-modal-close").on("click", closeRegexEntryEditModal);
    $modal2.find(".st-chatu8-modal-cancel-btn").on("click", closeRegexEntryEditModal);
    $modal2.find(".st-chatu8-modal-save-btn").on("click", saveRegexEntryFromModal);
  }
  const entryData = $entryElement.data("entryData") || {};
  $modal2.find("#ch-regex-modal-script-name").val(entryData.scriptName || $entryElement.find(".st-chatu8-entry-name").val());
  $modal2.find("#ch-regex-modal-enabled").prop("checked", !$entryElement.hasClass("disabled"));
  $modal2.find("#ch-regex-modal-find-regex").val(entryData.findRegex || "");
  $modal2.find("#ch-regex-modal-replace-string").val(entryData.replaceString || "");
  $modal2.fadeIn(200);
}

function closeRegexEntryEditModal() {
  const $modal2 = $("#ch-regex-entry-edit-modal");
  $modal2.fadeOut(200);
  __set_currentEditingRegexEntry(null);
}

function saveRegexEntryFromModal() {
  if (!currentEditingRegexEntry) {
    closeRegexEntryEditModal();
    return;
  }
  const $modal2 = $("#ch-regex-entry-edit-modal");
  const $entry = currentEditingRegexEntry;
  const scriptName = $modal2.find("#ch-regex-modal-script-name").val() || "\u672A\u547D\u540D\u6B63\u5219";
  const enabled = $modal2.find("#ch-regex-modal-enabled").is(":checked");
  const findRegex = $modal2.find("#ch-regex-modal-find-regex").val() || "";
  const replaceString = $modal2.find("#ch-regex-modal-replace-string").val() || "";
  const entryData = $entry.data("entryData") || {};
  entryData.scriptName = scriptName;
  entryData.disabled = !enabled;
  entryData.findRegex = findRegex;
  entryData.replaceString = replaceString;
  $entry.find(".st-chatu8-entry-name").val(scriptName);
  $entry.attr("data-find-regex", findRegex);
  $entry.attr("data-replace-string", replaceString);
  $entry.find(".st-chatu8-entry-toggle input").prop("checked", enabled);
  if (enabled) {
    $entry.removeClass("disabled");
  } else {
    $entry.addClass("disabled");
  }
  const regexPreview = findRegex.length > 40 ? findRegex.substring(0, 40) + "..." : findRegex || "(\u7A7A)";
  $entry.find(".st-chatu8-entry-preview").text(regexPreview);
  const hasLongReplaceString = replaceString.length > 100;
  $entry.find(".st-chatu8-entry-warning").remove();
  $entry.find(".st-chatu8-entry-danger-warning").remove();
  const dangerResult = detectDangerousRegex(findRegex);
  if (dangerResult.isDangerous) {
    const dangerHtml = generateDangerousRegexWarningHTML(dangerResult.warnings);
    $entry.find(".st-chatu8-entry-name").after(dangerHtml);
  }
  if (hasLongReplaceString) {
    const warningHtml = `<span class="st-chatu8-entry-warning" title="\u66FF\u6362\u5B57\u7B26\u4E32\u8D85\u8FC7100\u5B57\u7B26 (${replaceString.length}\u5B57\u7B26)"><i class="fa-solid fa-triangle-exclamation"></i></span>`;
    const $dangerWarning = $entry.find(".st-chatu8-entry-danger-warning");
    if ($dangerWarning.length) {
      $dangerWarning.after(warningHtml);
    } else {
      $entry.find(".st-chatu8-entry-name").after(warningHtml);
    }
  }
  $entry.data("entryData", entryData);
  if (dangerResult.isDangerous) {
    const warningText = dangerResult.warnings.map((w) => `<b>${w.name}</b>: ${w.description}`).join("<br>");
    toastr.error(warningText, "\u26A0\uFE0F \u5371\u9669\u6B63\u5219\u8B66\u544A - \u53EF\u80FD\u5BFC\u81F4\u6D4F\u89C8\u5668\u5361\u987F", {
      timeOut: 1e4,
      extendedTimeOut: 5e3,
      escapeHtml: false,
      closeButton: true
    });
    toastr.info("\u6B63\u5219\u6761\u76EE\u5DF2\u4FDD\u5B58\uFF0C\u4F46\u8BF7\u6CE8\u610F\u6027\u80FD\u98CE\u9669");
  } else {
    toastr.success("\u6B63\u5219\u6761\u76EE\u5DF2\u66F4\u65B0");
  }
  closeRegexEntryEditModal();
  saveRegexEntriesToProfile();
}

function addNewRegexEntry() {
  const containerInDocument = regexEntriesContainer && $.contains(document, regexEntriesContainer[0]);
  if (!containerInDocument) {
    __set_regexEntriesContainer($("#ch-regex-entries-container"));
  }
  if (regexEntriesContainer && regexEntriesContainer.length > 0) {
    regexEntriesContainer.find(".st-chatu8-entries-empty").remove();
  }
  const newEntry = createNewRegexEntry();
  addRegexEntryDOM(newEntry);
  if (regexEntriesContainer && regexEntriesContainer[0]) {
    const container = regexEntriesContainer[0];
    container.scrollTop = container.scrollHeight;
  }
  const $newEntry = regexEntriesContainer.find(".st-chatu8-preset-entry").last();
  showRegexEntryEditModal($newEntry);
}

function deleteRegexEntry($entryElement) {
  $entryElement.remove();
  toastr.info("\u5DF2\u5220\u9664\u6B63\u5219\u6761\u76EE");
  const containerInDocument = regexEntriesContainer && $.contains(document, regexEntriesContainer[0]);
  if (!containerInDocument) {
    __set_regexEntriesContainer($("#ch-regex-entries-container"));
  }
  if (!regexEntriesContainer || regexEntriesContainer.length === 0) {
    return;
  }
  const $entries = regexEntriesContainer.find(".st-chatu8-preset-entry");
  if ($entries.length === 0) {
    regexEntriesContainer.html(`
            <div class="st-chatu8-entries-empty">
                <i class="fa-solid fa-inbox"></i>
                <p>\u6682\u65E0\u6B63\u5219\u6761\u76EE\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0</p>
            </div>
        `);
  }
  saveRegexEntriesToProfile();
}

function toggleRegexEntry($entryElement, enabled) {
  const entryData = $entryElement.data("entryData") || {};
  entryData.disabled = !enabled;
  $entryElement.data("entryData", entryData);
  if (enabled) {
    $entryElement.removeClass("disabled");
  } else {
    $entryElement.addClass("disabled");
  }
  saveRegexEntriesToProfile();
}

function exportRegexEntry($entryElement) {
  const entryData = $entryElement.data("entryData");
  if (!entryData) {
    toastr.warning("\u65E0\u6CD5\u5BFC\u51FA\uFF1A\u6761\u76EE\u6570\u636E\u4E0D\u5B58\u5728");
    return;
  }
  const exportData = exportToSTRegexFormat(entryData);
  const scriptName = entryData.scriptName || "\u672A\u547D\u540D\u6B63\u5219";
  const safeFileName = scriptName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
  const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st_regex_${safeFileName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastr.success(`\u5DF2\u5BFC\u51FA\u6B63\u5219\u6761\u76EE: ${scriptName}`);
}

function importRegexEntries() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.multiple = true;
  input.onchange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    let importedCount = 0;
    const readPromises = [];
    for (const file of files) {
      const promise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            const entry = parseSTRegexFormat(data);
            if (entry && validateRegexEntry(entry)) {
              regexEntriesContainer.find(".st-chatu8-entries-empty").remove();
              addRegexEntryDOM(entry);
              importedCount++;
            }
          } catch (error) {
            console.warn(`\u89E3\u6790\u6587\u4EF6 ${file.name} \u5931\u8D25:`, error);
          }
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsText(file);
      });
      readPromises.push(promise);
    }
    await Promise.all(readPromises);
    if (importedCount > 0) {
      saveRegexEntriesToProfile();
      toastr.success(`\u6210\u529F\u5BFC\u5165 ${importedCount} \u4E2A\u6B63\u5219\u6761\u76EE`);
    } else {
      toastr.warning("\u6CA1\u6709\u6709\u6548\u7684\u6B63\u5219\u6761\u76EE\u53EF\u5BFC\u5165");
    }
  };
  input.click();
}

async function importRegexEntriesFromEngine() {
  let regexEngine;
  try {
    regexEngine = await import("../../regex/engine.js");
  } catch (importError) {
    console.error("\u65E0\u6CD5\u52A0\u8F7D\u6B63\u5219\u5F15\u64CE\u6A21\u5757:", importError);
    toastr.error("\u65E0\u6CD5\u52A0\u8F7DST\u6B63\u5219\u5F15\u64CE\u6A21\u5757\uFF0C\u8BF7\u786E\u4FDD\u6B63\u5219\u6269\u5C55\u5DF2\u542F\u7528");
    return;
  }
  try {
    if (typeof regexEngine.getScriptsByType !== "function") {
      toastr.error("ST\u6B63\u5219\u5F15\u64CE\u7248\u672C\u8FC7\u65E7\uFF0C\u7F3A\u5C11 getScriptsByType \u51FD\u6570\u3002\n\u8BF7\u66F4\u65B0 SillyTavern \u5230\u6700\u65B0\u7248\u672C\u3002");
      console.warn("regexEngine \u5BF9\u8C61\u7F3A\u5C11 getScriptsByType \u51FD\u6570\u3002\u53EF\u7528\u7684\u5BFC\u51FA:", Object.keys(regexEngine));
      return;
    }
    if (!regexEngine.SCRIPT_TYPES) {
      toastr.error("ST\u6B63\u5219\u5F15\u64CE\u7248\u672C\u8FC7\u65E7\uFF0C\u7F3A\u5C11 SCRIPT_TYPES \u5E38\u91CF\u3002\n\u8BF7\u66F4\u65B0 SillyTavern \u5230\u6700\u65B0\u7248\u672C\u3002");
      console.warn("regexEngine \u5BF9\u8C61\u7F3A\u5C11 SCRIPT_TYPES \u5E38\u91CF\u3002\u53EF\u7528\u7684\u5BFC\u51FA:", Object.keys(regexEngine));
      return;
    }
    const globalScripts = regexEngine.getScriptsByType(regexEngine.SCRIPT_TYPES.GLOBAL) || [];
    const scopedScripts = regexEngine.getScriptsByType(regexEngine.SCRIPT_TYPES.SCOPED) || [];
    const presetScripts = regexEngine.getScriptsByType(regexEngine.SCRIPT_TYPES.PRESET) || [];
    const filterScripts = (scripts) => scripts.filter((script) => {
      if (script.disabled) return false;
      if (!script.findRegex) return false;
      const minDepthValid = script.minDepth === 0 || script.minDepth === null || script.minDepth === void 0;
      const markdownOnlyValid = script.markdownOnly === true;
      const placementValid = Array.isArray(script.placement) && script.placement.includes(2);
      return minDepthValid && markdownOnlyValid && placementValid;
    });
    const scriptsByType = {
      global: filterScripts(globalScripts),
      scoped: filterScripts(scopedScripts),
      preset: filterScripts(presetScripts)
    };
    const totalCount = scriptsByType.global.length + scriptsByType.scoped.length + scriptsByType.preset.length;
    if (totalCount === 0) {
      toastr.warning("\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u6B63\u5219\u811A\u672C\u53EF\u5BFC\u5165\u3002\n\u6761\u4EF6: \u672A\u7981\u7528, minDepth=0\u6216null, markdownOnly=true, placement\u5305\u542B2");
      return;
    }
    const selectedScripts = await showRegexEntrySelectionDialog(scriptsByType);
    if (selectedScripts.length > 0) {
      regexEntriesContainer.find(".st-chatu8-entries-empty").remove();
      selectedScripts.forEach((script) => {
        const entry = parseSTRegexFormat(script);
        if (entry) {
          addRegexEntryDOM(entry);
        }
      });
      saveRegexEntriesToProfile();
      toastr.success(`\u6210\u529F\u5BFC\u5165 ${selectedScripts.length} \u4E2A\u6B63\u5219\u6761\u76EE`);
    } else {
      toastr.info("\u672A\u9009\u62E9\u4EFB\u4F55\u6B63\u5219\u811A\u672C");
    }
  } catch (error) {
    console.error("\u52A0\u8F7D\u6B63\u5219\u5F15\u64CE\u6A21\u5757\u5931\u8D25:", error);
    toastr.error("\u52A0\u8F7DST\u6B63\u5219\u5F15\u64CE\u6A21\u5757\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6B63\u5219\u6269\u5C55\u5DF2\u542F\u7528");
  }
}

function getRegexEntryImportModalHTML(listHtml) {
  return `
        <div class="st-chatu8-entry-edit-modal-backdrop" id="ch-regex-entry-import-modal">
            <div class="st-chatu8-entry-edit-modal">
                <div class="st-chatu8-entry-edit-modal-header">
                    <h4>\u9009\u62E9\u8981\u5BFC\u5165\u7684\u6B63\u5219\u6761\u76EE</h4>
                    <span class="st-chatu8-entry-edit-modal-close">&times;</span>
                </div>
                <div class="st-chatu8-entry-edit-modal-body">
                    <div class="st-chatu8-modal-field st-chatu8-import-toolbar">
                        <button type="button" class="st-chatu8-btn" id="st-regex-entry-select-all">
                            <i class="fa-solid fa-check-double"></i> \u5168\u9009
                        </button>
                        <button type="button" class="st-chatu8-btn" id="st-regex-entry-deselect-all">
                            <i class="fa-solid fa-xmark"></i> \u53D6\u6D88\u5168\u9009
                        </button>
                    </div>
                    <div class="st-chatu8-modal-field st-chatu8-import-list">
                        ${listHtml}
                    </div>
                </div>
                <div class="st-chatu8-entry-edit-modal-footer">
                    <button class="st-chatu8-btn st-chatu8-modal-cancel-btn">\u53D6\u6D88</button>
                    <button class="st-chatu8-btn st-chatu8-btn-primary st-chatu8-modal-save-btn">
                        <i class="fa-solid fa-file-import"></i> \u5BFC\u5165\u9009\u4E2D
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showRegexEntrySelectionDialog(scriptsByType) {
  return new Promise((resolve) => {
    const typeLabels = {
      global: "\u5168\u5C40\u6B63\u5219",
      scoped: "\u89D2\u8272\u6B63\u5219",
      preset: "\u9884\u8BBE\u6B63\u5219"
    };
    let listHtml = "";
    for (const [type, scripts] of Object.entries(scriptsByType)) {
      if (scripts.length === 0) continue;
      listHtml += `
                <div class="st-chatu8-import-type-group">
                    <h5 class="st-chatu8-import-type-header">${typeLabels[type] || type} <span class="st-chatu8-import-count">(${scripts.length})</span></h5>
            `;
      scripts.forEach((script, index) => {
        const scriptId = `st-regex-entry-${type}-${index}`;
        const scriptName = script.scriptName || `\u672A\u547D\u540D\u6B63\u5219 ${index + 1}`;
        listHtml += `
                    <div class="st-chatu8-import-item">
                        <label class="st-chatu8-import-label">
                            <input type="checkbox" class="st-chatu8-import-checkbox" id="${scriptId}" 
                                   data-type="${type}" data-index="${index}" checked>
                            <span class="st-chatu8-import-name">${escapeHtmlForRegex(scriptName)}</span>
                        </label>
                    </div>
                `;
      });
      listHtml += `</div>`;
    }
    $("#ch-regex-entry-import-modal").remove();
    $("body").append(getRegexEntryImportModalHTML(listHtml));
    const $modal2 = $("#ch-regex-entry-import-modal");
    $modal2.find("#st-regex-entry-select-all").on("click", () => {
      $modal2.find(".st-chatu8-import-checkbox").prop("checked", true);
    });
    $modal2.find("#st-regex-entry-deselect-all").on("click", () => {
      $modal2.find(".st-chatu8-import-checkbox").prop("checked", false);
    });
    $modal2.find(".st-chatu8-modal-save-btn").on("click", () => {
      const selectedScripts = [];
      $modal2.find(".st-chatu8-import-checkbox:checked").each(function() {
        const type = $(this).data("type");
        const index = $(this).data("index");
        const script = scriptsByType[type][index];
        if (script) {
          selectedScripts.push(script);
        }
      });
      $modal2.fadeOut(200, () => $modal2.remove());
      resolve(selectedScripts);
    });
    $modal2.find(".st-chatu8-modal-cancel-btn, .st-chatu8-entry-edit-modal-close").on("click", () => {
      $modal2.fadeOut(200, () => $modal2.remove());
      resolve([]);
    });
    $modal2.on("click", (e) => {
      if ($(e.target).hasClass("st-chatu8-entry-edit-modal-backdrop")) {
        $modal2.fadeOut(200, () => $modal2.remove());
        resolve([]);
      }
    });
    $modal2.fadeIn(200);
  });
}

function collectRegexEntriesFromUI() {
  const entries = [];
  const containerInDocument = regexEntriesContainer && $.contains(document, regexEntriesContainer[0]);
  const freshContainer = $("#ch-regex-entries-container");
  const freshEntryCount = freshContainer.find(".st-chatu8-preset-entry").length;
  console.log("[st-chatu8] collectRegexEntriesFromUI \u8C03\u8BD5:", {
    \u7F13\u5B58\u5BB9\u5668\u5B58\u5728: !!regexEntriesContainer,
    \u7F13\u5B58\u5BB9\u5668\u5728\u6587\u6863\u4E2D: containerInDocument,
    \u65B0\u9009\u62E9\u5668\u627E\u5230\u7684\u5BB9\u5668: freshContainer.length > 0,
    \u65B0\u9009\u62E9\u5668\u627E\u5230\u7684\u6761\u76EE\u6570: freshEntryCount,
    \u7F13\u5B58\u5BB9\u5668\u627E\u5230\u7684\u6761\u76EE\u6570: regexEntriesContainer ? regexEntriesContainer.find(".st-chatu8-preset-entry").length : 0
  });
  const activeContainer = containerInDocument ? regexEntriesContainer : freshContainer;
  if (!activeContainer || activeContainer.length === 0) {
    console.warn("[st-chatu8] \u6B63\u5219\u6761\u76EE\u5BB9\u5668\u4E0D\u5B58\u5728\uFF01");
    return entries;
  }
  activeContainer.find(".st-chatu8-preset-entry").each(function() {
    const $entry = $(this);
    const entryData = $entry.data("entryData");
    if (entryData) {
      entries.push(entryData);
    }
  });
  return entries;
}

function saveRegexEntriesToProfile() {
  const profileName = profileSelect2.val();
  if (!profileName) return;
  const profiles = extension_settings[extensionName].regex_profiles;
  if (!profiles[profileName]) {
    profiles[profileName] = {};
  }
  profiles[profileName].regexEntries = collectRegexEntriesFromUI();
  saveSettingsDebounced();
}

function loadRegexEntriesFromProfile() {
  const profileName = profileSelect2.val();
  if (!profileName) return;
  const profiles = extension_settings[extensionName].regex_profiles;
  const profile = profiles[profileName];
  console.log("[st-chatu8] \u52A0\u8F7D\u6B63\u5219\u914D\u7F6E:", {
    \u914D\u7F6E\u540D\u79F0: profileName,
    \u914D\u7F6E\u662F\u5426\u5B58\u5728: !!profile,
    \u6761\u76EE\u6570\u91CF: profile?.regexEntries?.length || 0
  });
  if (profile && Array.isArray(profile.regexEntries)) {
    renderRegexEntries(profile.regexEntries);
  } else {
    renderRegexEntries([]);
  }
}

function bindRegexEntryDragEvents() {
  if (!regexEntriesContainer) return;
  let draggedEntry2 = null;
  let autoScrollInterval = null;
  const SCROLL_SPEED2 = 8;
  const SCROLL_ZONE = 50;
  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }
  function handleAutoScroll(clientY) {
    const container = regexEntriesContainer[0];
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const topEdge = rect.top;
    const bottomEdge = rect.bottom;
    stopAutoScroll();
    if (clientY < topEdge + SCROLL_ZONE && clientY >= topEdge) {
      autoScrollInterval = setInterval(() => {
        container.scrollTop -= SCROLL_SPEED2;
      }, 16);
    } else if (clientY > bottomEdge - SCROLL_ZONE && clientY <= bottomEdge) {
      autoScrollInterval = setInterval(() => {
        container.scrollTop += SCROLL_SPEED2;
      }, 16);
    }
  }
  regexEntriesContainer.on("dragstart", ".st-chatu8-preset-entry", function(e) {
    draggedEntry2 = this;
    $(this).addClass("dragging");
    e.originalEvent.dataTransfer.effectAllowed = "move";
  });
  regexEntriesContainer.on("dragend", ".st-chatu8-preset-entry", function() {
    $(this).removeClass("dragging");
    regexEntriesContainer.find(".st-chatu8-preset-entry").removeClass("drag-over");
    draggedEntry2 = null;
    stopAutoScroll();
  });
  regexEntriesContainer.on("dragover", ".st-chatu8-preset-entry", function(e) {
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = "move";
    if (this !== draggedEntry2) {
      regexEntriesContainer.find(".st-chatu8-preset-entry").removeClass("drag-over");
      $(this).addClass("drag-over");
    }
    handleAutoScroll(e.originalEvent.clientY);
  });
  regexEntriesContainer.on("dragover", function(e) {
    if (draggedEntry2) {
      e.preventDefault();
      handleAutoScroll(e.originalEvent.clientY);
    }
  });
  regexEntriesContainer.on("drop", ".st-chatu8-preset-entry", function(e) {
    e.preventDefault();
    stopAutoScroll();
    if (this !== draggedEntry2 && draggedEntry2) {
      const $target = $(this);
      const $dragged = $(draggedEntry2);
      const targetRect = this.getBoundingClientRect();
      const mouseY = e.originalEvent.clientY;
      const insertAfter = mouseY > targetRect.top + targetRect.height / 2;
      if (insertAfter) {
        $target.after($dragged);
      } else {
        $target.before($dragged);
      }
      saveRegexEntriesToProfile();
    }
    regexEntriesContainer.find(".st-chatu8-preset-entry").removeClass("drag-over");
  });
  regexEntriesContainer.on("dragleave", function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.originalEvent.clientX;
    const y = e.originalEvent.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      stopAutoScroll();
    }
  });
}

function bindRegexEntryEvents() {
  if (!regexEntriesContainer) return;
  regexEntriesContainer.on("click", ".st-chatu8-entry-edit", function(e) {
    e.stopPropagation();
    const $entry = $(this).closest(".st-chatu8-preset-entry");
    showRegexEntryEditModal($entry);
  });
  regexEntriesContainer.on("change", ".st-chatu8-entry-toggle input", function() {
    const $entry = $(this).closest(".st-chatu8-preset-entry");
    toggleRegexEntry($entry, $(this).is(":checked"));
  });
  regexEntriesContainer.on("click", ".st-chatu8-entry-export", function(e) {
    e.stopPropagation();
    const $entry = $(this).closest(".st-chatu8-preset-entry");
    exportRegexEntry($entry);
  });
  regexEntriesContainer.on("click", ".st-chatu8-entry-delete", function(e) {
    e.stopPropagation();
    const $entry = $(this).closest(".st-chatu8-preset-entry");
    deleteRegexEntry($entry);
  });
  regexEntriesContainer.on("dblclick", ".st-chatu8-preset-entry", function(e) {
    if ($(e.target).closest(".st-chatu8-entry-actions, .st-chatu8-entry-drag-handle").length) {
      return;
    }
    showRegexEntryEditModal($(this));
  });
  regexEntriesContainer.on("click", ".st-chatu8-entry-danger-warning", function(e) {
    e.stopPropagation();
    const warningText = $(this).attr("title");
    if (warningText) {
      toastr.error(warningText.replace(/\n/g, "<br>"), "\u26A0\uFE0F \u5371\u9669\u6B63\u5219\u8B66\u544A", {
        timeOut: 8e3,
        extendedTimeOut: 3e3,
        escapeHtml: false
      });
    }
  });
  regexEntriesContainer.on("click", ".st-chatu8-entry-warning", function(e) {
    e.stopPropagation();
    const warningText = $(this).attr("title");
    if (warningText) {
      toastr.warning(warningText, "\u66FF\u6362\u5B57\u7B26\u4E32\u8B66\u544A");
    }
  });
}

function loadRegexProfiles() {
  const profiles = extension_settings[extensionName].regex_profiles || {};
  const currentProfileName = extension_settings[extensionName].current_regex_profile;
  profileSelect2.empty();
  Object.keys(profiles).forEach((name) => {
    const option = new Option(name, name, name === currentProfileName, name === currentProfileName);
    profileSelect2.append(option);
  });
  if (profileSelect2.val()) {
    profileSelect2.trigger("change");
  }
}

function onProfileSelectChange2() {
  const profileName = $(this).val();
  if (!profileName) return;
  const profiles = extension_settings[extensionName].regex_profiles;
  const profile = profiles[profileName];
  if (profile) {
    beforeAfterEditor.val(profile.beforeAfterRegex || "");
    textEditor.val(profile.textRegex || "");
    extension_settings[extensionName].current_regex_profile = profileName;
    saveSettingsDebounced();
    loadRegexEntriesFromProfile();
  }
}

function onSaveProfileClick2() {
  const profileName = profileSelect2.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u3002");
    return;
  }
  const profiles = extension_settings[extensionName].regex_profiles;
  const existingEntries = profiles[profileName]?.regexEntries || [];
  profiles[profileName] = {
    beforeAfterRegex: beforeAfterEditor.val(),
    textRegex: textEditor.val(),
    regexEntries: existingEntries
  };
  saveSettingsDebounced();
  toastr.success(`\u914D\u7F6E "${profileName}" \u5DF2\u4FDD\u5B58\u3002`);
}

function onNewProfileClick2() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u6B63\u5219\u914D\u7F6E\u540D\u79F0").then((newName) => {
    if (!newName || newName.trim() === "") return;
    const profiles = extension_settings[extensionName].regex_profiles;
    if (profiles[newName]) {
      toastr.error(`\u914D\u7F6E "${newName}" \u5DF2\u5B58\u5728\u3002`);
      return;
    }
    profiles[newName] = {
      beforeAfterRegex: "",
      textRegex: "",
      regexEntries: []
    };
    extension_settings[extensionName].current_regex_profile = newName;
    saveSettingsDebounced();
    loadRegexProfiles();
    toastr.success(`\u7A7A\u914D\u7F6E "${newName}" \u5DF2\u521B\u5EFA\u5E76\u9009\u4E2D\u3002`);
  });
}

function onSaveAsProfileClick() {
  stylInput("\u8BF7\u8F93\u5165\u53E6\u5B58\u4E3A\u7684\u914D\u7F6E\u540D\u79F0").then((newName) => {
    if (!newName || newName.trim() === "") return;
    const profiles = extension_settings[extensionName].regex_profiles;
    if (profiles[newName]) {
      toastr.error(`\u914D\u7F6E "${newName}" \u5DF2\u5B58\u5728\u3002`);
      return;
    }
    const currentName = profileSelect2.val();
    const currentProfile = profiles[currentName] || {};
    profiles[newName] = {
      beforeAfterRegex: currentProfile.beforeAfterRegex || "",
      textRegex: currentProfile.textRegex || "",
      regexEntries: JSON.parse(JSON.stringify(currentProfile.regexEntries || []))
    };
    extension_settings[extensionName].current_regex_profile = newName;
    saveSettingsDebounced();
    loadRegexProfiles();
    toastr.success(`\u914D\u7F6E\u5DF2\u53E6\u5B58\u4E3A "${newName}"\u3002`);
  });
}

function onRenameProfileClick() {
  const currentName = profileSelect2.val();
  if (!currentName) {
    toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684\u914D\u7F6E\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4" || currentName === "default") {
    toastr.warning("\u9ED8\u8BA4\u914D\u7F6E\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u914D\u7F6E\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      const profiles = extension_settings[extensionName].regex_profiles;
      if (profiles[newName]) {
        toastr.error(`\u914D\u7F6E "${newName}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002`);
        return;
      }
      profiles[newName] = profiles[currentName];
      delete profiles[currentName];
      extension_settings[extensionName].current_regex_profile = newName;
      saveSettingsDebounced();
      loadRegexProfiles();
      toastr.success(`\u914D\u7F6E\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function onDeleteProfileClick2() {
  const profileName = profileSelect2.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u3002");
    return;
  }
  if (Object.keys(extension_settings[extensionName].regex_profiles).length <= 1) {
    toastr.error("\u4E0D\u80FD\u5220\u9664\u6700\u540E\u4E00\u4E2A\u914D\u7F6E\u3002");
    return;
  }
  if (confirm(`\u4F60\u786E\u5B9A\u8981\u5220\u9664\u914D\u7F6E "${profileName}" \u5417\uFF1F`)) {
    delete extension_settings[extensionName].regex_profiles[profileName];
    extension_settings[extensionName].current_regex_profile = Object.keys(extension_settings[extensionName].regex_profiles)[0];
    saveSettingsDebounced();
    loadRegexProfiles();
    toastr.success(`\u914D\u7F6E "${profileName}" \u5DF2\u5220\u9664\u3002`);
  }
}

function onExportProfileClick2() {
  const profileName = profileSelect2.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const profile = extension_settings[extensionName].regex_profiles[profileName];
  const exportData = { [profileName]: profile };
  const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st_is_regex_profile_${profileName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function onImportProfileClick2() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProfiles = JSON.parse(e.target.result);
          let importedCount = 0;
          for (const name in importedProfiles) {
            if (Object.prototype.hasOwnProperty.call(importedProfiles, name)) {
              extension_settings[extensionName].regex_profiles[name] = importedProfiles[name];
              importedCount++;
            }
          }
          saveSettingsDebounced();
          loadRegexProfiles();
          toastr.success(`\u6210\u529F\u5BFC\u5165 ${importedCount} \u4E2A\u914D\u7F6E\u3002`);
        } catch (error) {
          toastr.error("\u5BFC\u5165\u5931\u8D25\uFF0C\u6587\u4EF6\u683C\u5F0F\u65E0\u6548\u3002");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function detectDangerousRegex(regexStr) {
  if (!regexStr || typeof regexStr !== "string") {
    return { isDangerous: false, warnings: [] };
  }
  const warnings = [];
  for (const rule of DANGEROUS_REGEX_PATTERNS) {
    if (rule.pattern.test(regexStr)) {
      warnings.push({
        name: rule.name,
        description: rule.description
      });
    }
  }
  if (regexStr.length > 500) {
    warnings.push({
      name: "\u8FC7\u957F\u6B63\u5219",
      description: `\u6B63\u5219\u957F\u5EA6 ${regexStr.length} \u5B57\u7B26\uFF0C\u53EF\u80FD\u5F71\u54CD\u6027\u80FD`
    });
  }
  const quantifierCount = (regexStr.match(/[+*?]|\{\d+,?\d*\}/g) || []).length;
  if (quantifierCount > 10) {
    warnings.push({
      name: "\u8FC7\u591A\u91CF\u8BCD",
      description: `\u5305\u542B ${quantifierCount} \u4E2A\u91CF\u8BCD\uFF0C\u53EF\u80FD\u5F71\u54CD\u6027\u80FD`
    });
  }
  return {
    isDangerous: warnings.length > 0,
    warnings
  };
}

function generateDangerousRegexWarningHTML(warnings) {
  if (!warnings || warnings.length === 0) return "";
  const warningText = warnings.map((w) => `${w.name}: ${w.description}`).join("\n");
  return `<span class="st-chatu8-entry-danger-warning" title="${warningText}"><i class="fa-solid fa-skull-crossbones"></i></span>`;
}

function escapeRegex2(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRegexLiteral(str) {
  const regexLiteralPattern = /^\/(.+)\/([gimsuy]*)$/;
  return regexLiteralPattern.test(str);
}

function mergeRanges(ranges) {
  if (ranges.length < 2) return ranges;
  ranges.sort((a, b) => a.start - b.start);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    const current = ranges[i];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }
  return merged;
}

async function onTestRegexClick(requestId, options = {}) {
  const timer = debugTimer("regex.onTestRegexClick", "\u6B63\u5219\u5904\u7406\u6D41\u7A0B");
  const keepImageTag = options.keepImageTag === true;
  const sourceText = originalText.val();
  const beforeAfterRegexStr = beforeAfterEditor.val().trim();
  const textRegexStr = textEditor.val();
  let allRemovedRanges = [];
  debugLog("regex.onTestRegexClick", "\u5F00\u59CB\u6B63\u5219\u5904\u7406", {
    \u8BF7\u6C42ID: requestId || "(\u624B\u52A8\u6D4B\u8BD5)",
    \u539F\u6587\u957F\u5EA6: sourceText?.length || 0,
    \u4FDD\u62A4image\u6807\u7B7E: keepImageTag
  });
  debugContent("regex.onTestRegexClick", "\u539F\u59CB\u6587\u672C", sourceText, 300);
  try {
    let textToProcess = sourceText || "";
    let baseOffset = 0;
    const imgPlaceholders = [];
    const imgProtectPrefix = `@@CHATU8_IMG_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_`;
    if (keepImageTag) {
      textToProcess = textToProcess.replace(
        /<image\b[^>]*>[\s\S]*?<\/image>/gi,
        (match) => {
          const token2 = `${imgProtectPrefix}${imgPlaceholders.length}@@`;
          imgPlaceholders.push({ token: token2, original: match });
          return token2;
        }
      );
      if (imgPlaceholders.length > 0) {
        debugLog("regex.onTestRegexClick", "\u{1F6E1}\uFE0F \u5DF2\u4FDD\u62A4 <image> \u6807\u7B7E", {
          \u6570\u91CF: imgPlaceholders.length
        });
      }
    }
    const regexEntries = collectRegexEntriesFromUI();
    const currentProfileName = profileSelect2 ? profileSelect2.val() : "(\u672A\u77E5)";
    debugLog("regex.onTestRegexClick", "\u6B63\u5219\u6761\u76EE\u5217\u8868", {
      \u5F53\u524D\u914D\u7F6E: currentProfileName,
      \u603B\u6761\u76EE\u6570: regexEntries.length,
      \u542F\u7528\u6761\u76EE\u6570: regexEntries.filter((e) => !e.disabled).length,
      \u6761\u76EE\u540D\u79F0\u5217\u8868: regexEntries.map((e, i) => `${i + 1}. ${e.scriptName || "(\u65E0\u540D\u79F0)"}${e.disabled ? " [\u7981\u7528]" : ""}`).join("\n")
    });
    for (let index = 0; index < regexEntries.length; index++) {
      const entry = regexEntries[index];
      if (entry.disabled) {
        debugBranch("onTestRegexClick", `\u6761\u76EE ${index + 1} "${entry.scriptName}" \u5DF2\u7981\u7528`, true, {
          \u7D22\u5F15: index,
          \u540D\u79F0: entry.scriptName
        });
        continue;
      }
      if (!entry.findRegex) {
        debugBranch("onTestRegexClick", `\u6761\u76EE ${index + 1} "${entry.scriptName}" \u65E0findRegex`, true);
        continue;
      }
      const dangerCheck = detectDangerousRegex(entry.findRegex);
      const hasCriticalDanger = dangerCheck.warnings.some(
        (w) => w.name === "\u5D4C\u5957\u91CF\u8BCD" || w.name === "\u6DF1\u5C42\u5D4C\u5957\u91CF\u8BCD" || w.name === "\u7A7A\u5339\u914D\u5FAA\u73AF"
      );
      if (hasCriticalDanger) {
        const warningNames = dangerCheck.warnings.map((w) => w.name).join(", ");
        debugLog("regex.onTestRegexClick", `\u26A0\uFE0F \u8DF3\u8FC7\u5371\u9669\u6B63\u5219: ${entry.scriptName}`, {
          \u5371\u9669\u7C7B\u578B: warningNames,
          \u6B63\u5219: entry.findRegex.substring(0, 50)
        });
        console.warn(`[st-chatu8] \u8DF3\u8FC7\u5371\u9669\u6B63\u5219 "${entry.scriptName}": ${warningNames}`);
        toastr.warning(`\u8DF3\u8FC7\u5371\u9669\u6B63\u5219 "${entry.scriptName}"<br>\u539F\u56E0: ${warningNames}`, "\u6B63\u5219\u5B89\u5168\u68C0\u67E5", {
          timeOut: 5e3,
          escapeHtml: false
        });
        continue;
      }
      const beforeLength = textToProcess.length;
      try {
        const findRegexStr = entry.findRegex.trim();
        let pattern, flags;
        if (isRegexLiteral(findRegexStr)) {
          const regexLiteralPattern = /^\/(.+)\/([gimsuy]*)$/;
          const match = findRegexStr.match(regexLiteralPattern);
          if (!match) {
            debugLog("regex.onTestRegexClick", `\u6761\u76EE "${entry.scriptName}" \u6B63\u5219\u89E3\u6790\u5931\u8D25`, {
              findRegex: findRegexStr
            });
            console.warn(`\u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u7684 findRegex \u89E3\u6790\u5931\u8D25: ${findRegexStr}`);
            continue;
          }
          pattern = match[1];
          flags = match[2] || "";
          if (!flags.includes("g")) {
            flags += "g";
          }
        } else {
          pattern = findRegexStr;
          flags = "g";
        }
        const replaceString = entry.replaceString || "";
        const matchResult = await executeRegexWithTimeout("match", textToProcess, pattern, flags);
        if (!matchResult.success) {
          if (matchResult.timeout) {
            debugLog("regex.onTestRegexClick", `\u23F1\uFE0F \u6B63\u5219\u8D85\u65F6: ${entry.scriptName}`, {
              \u6B63\u5219: findRegexStr.substring(0, 50)
            });
            console.warn(`[st-chatu8] \u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u5339\u914D\u8D85\u65F6`);
            toastr.warning(`\u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u6267\u884C\u8D85\u65F6 (>1000ms)\uFF0C\u5DF2\u8DF3\u8FC7`, "\u6B63\u5219\u8D85\u65F6", {
              timeOut: 5e3
            });
          } else {
            console.warn(`\u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u5339\u914D\u5931\u8D25:`, matchResult.error);
          }
          continue;
        }
        const matchCount = matchResult.result?.matches?.length || 0;
        const replaceResult = await executeRegexWithTimeout("replace", textToProcess, pattern, flags, replaceString);
        if (!replaceResult.success) {
          if (replaceResult.timeout) {
            debugLog("regex.onTestRegexClick", `\u23F1\uFE0F \u6B63\u5219\u66FF\u6362\u8D85\u65F6: ${entry.scriptName}`, {
              \u6B63\u5219: findRegexStr.substring(0, 50)
            });
            console.warn(`[st-chatu8] \u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u66FF\u6362\u8D85\u65F6`);
            toastr.warning(`\u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u66FF\u6362\u8D85\u65F6 (>1000ms)\uFF0C\u5DF2\u8DF3\u8FC7`, "\u6B63\u5219\u8D85\u65F6", {
              timeOut: 5e3
            });
          } else {
            console.warn(`\u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u66FF\u6362\u5931\u8D25:`, replaceResult.error);
          }
          continue;
        }
        if (replaceResult.result == null) {
          console.warn(`\u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u66FF\u6362\u7ED3\u679C\u4E3A\u7A7A`);
          continue;
        }
        textToProcess = replaceResult.result;
        const afterLength = textToProcess.length;
        const lengthDiff = afterLength - beforeLength;
        if (matchCount > 0 || lengthDiff !== 0) {
          debugLog("regex.onTestRegexClick", `\u6B63\u5219\u6761\u76EE\u5904\u7406: ${entry.scriptName}`, {
            \u7D22\u5F15: index + 1,
            \u540D\u79F0: entry.scriptName,
            \u6B63\u5219: findRegexStr.substring(0, 50) + (findRegexStr.length > 50 ? "..." : ""),
            \u66FF\u6362\u4E3A: replaceString.substring(0, 30) + (replaceString.length > 30 ? "..." : ""),
            \u5339\u914D\u6570: matchCount,
            \u957F\u5EA6\u53D8\u5316: lengthDiff,
            \u5904\u7406\u524D\u957F\u5EA6: beforeLength,
            \u5904\u7406\u540E\u957F\u5EA6: afterLength
          });
        }
      } catch (e) {
        debugLog("regex.onTestRegexClick", `\u6761\u76EE "${entry.scriptName}" \u6267\u884C\u5931\u8D25`, {
          \u9519\u8BEF: e.message
        });
        console.warn(`\u6B63\u5219\u6761\u76EE "${entry.scriptName}" \u6267\u884C\u5931\u8D25:`, e);
      }
    }
    debugLog("regex.onTestRegexClick", "\u524D\u540E\u6B63\u5219\u5904\u7406\u5F00\u59CB", {
      \u8F93\u5165\u503C: beforeAfterRegexStr,
      \u8F93\u5165\u957F\u5EA6: beforeAfterRegexStr.length,
      \u5305\u542B\u5206\u9694\u7B26: beforeAfterRegexStr.includes("|")
    });
    if (beforeAfterRegexStr.includes("|")) {
      const parts = beforeAfterRegexStr.split("|");
      debugLog("regex.onTestRegexClick", "\u524D\u540E\u6B63\u5219\u5206\u5272\u7ED3\u679C", {
        \u5206\u5272\u6570\u91CF: parts.length,
        \u524D\u8FB9\u754C: parts[0] || "(\u7A7A)",
        \u540E\u8FB9\u754C: parts[1] || "(\u7A7A)",
        \u5B8C\u6574\u5206\u5272: parts
      });
      if (parts.length === 2) {
        const before = parts[0] === "^" ? "^" : escapeRegex2(parts[0]);
        const after = parts[1] === "$" ? "$" : escapeRegex2(parts[1]);
        const contextPattern = `${before}([\\s\\S]*?)${after}`;
        const containsBefore = parts[0] === "^" ? true : textToProcess.includes(parts[0]);
        const containsAfter = parts[1] === "$" ? true : textToProcess.includes(parts[1]);
        debugLog("regex.onTestRegexClick", "\u{1F50D} \u524D\u540E\u6B63\u5219\u5339\u914D\u524D\u68C0\u67E5", {
          \u5F85\u5904\u7406\u6587\u672C\u957F\u5EA6: textToProcess.length,
          \u6587\u672C\u9884\u89C8\u524D200\u5B57\u7B26: textToProcess.substring(0, 200),
          \u6587\u672C\u9884\u89C8\u540E200\u5B57\u7B26: textToProcess.substring(Math.max(0, textToProcess.length - 200)),
          \u524D\u8FB9\u754C\u539F\u503C: parts[0],
          \u540E\u8FB9\u754C\u539F\u503C: parts[1],
          \u6587\u672C\u5305\u542B\u524D\u8FB9\u754C: containsBefore,
          \u6587\u672C\u5305\u542B\u540E\u8FB9\u754C: containsAfter
        });
        console.log("[st-chatu8] \u524D\u540E\u6B63\u5219\u5339\u914D\u524D\u6587\u672C\u9884\u89C8:", textToProcess.substring(0, 300));
        debugLog("regex.onTestRegexClick", "\u524D\u540E\u6B63\u5219\u6A21\u5F0F\u751F\u6210", {
          \u524D\u8FB9\u754C\u8F6C\u4E49: before,
          \u540E\u8FB9\u754C\u8F6C\u4E49: after,
          \u5B8C\u6574\u6A21\u5F0F: contextPattern,
          \u5F85\u5339\u914D\u6587\u672C\u957F\u5EA6: textToProcess.length
        });
        const matchResult = await executeRegexWithTimeout("match", textToProcess, contextPattern, "i");
        debugLog("regex.onTestRegexClick", "\u524D\u540E\u6B63\u5219\u5339\u914D\u7ED3\u679C", {
          \u6210\u529F: matchResult.success,
          \u8D85\u65F6: matchResult.timeout || false,
          \u9519\u8BEF: matchResult.error || null,
          \u6709\u7ED3\u679C: !!matchResult.result,
          \u7ED3\u679C\u7C7B\u578B: matchResult.result ? typeof matchResult.result : "undefined",
          \u5339\u914D\u6570\u7EC4\u957F\u5EA6: matchResult.result?.matches ? matchResult.result.matches.length : 0,
          \u5339\u914D\u6570\u7EC4\u5185\u5BB9: matchResult.result?.matches ? JSON.stringify(matchResult.result.matches) : "N/A",
          matches0\u7C7B\u578B: matchResult.result?.matches ? typeof matchResult.result.matches[0] : "N/A",
          matches1\u7C7B\u578B: matchResult.result?.matches ? typeof matchResult.result.matches[1] : "N/A",
          matches1\u503C: matchResult.result?.matches?.[1] !== void 0 ? String(matchResult.result.matches[1]).substring(0, 50) : "undefined"
        });
        console.log("[st-chatu8] \u5B8C\u6574 matchResult:", JSON.stringify(matchResult, null, 2));
        if (matchResult.success && matchResult.result && matchResult.result.matches && typeof matchResult.result.matches[1] === "string") {
          const match = matchResult.result;
          const content = match.matches[1];
          const contentStart = match.index + match.matches[0].indexOf(content);
          const contentEnd = contentStart + content.length;
          debugLog("regex.onTestRegexClick", "\u524D\u540E\u6B63\u5219\u5339\u914D\u6210\u529F", {
            \u5339\u914D\u5F00\u59CB\u4F4D\u7F6E: match.index,
            \u63D0\u53D6\u5185\u5BB9\u957F\u5EA6: content.length,
            \u5185\u5BB9\u5F00\u59CB: contentStart,
            \u5185\u5BB9\u7ED3\u675F: contentEnd,
            \u539F\u6587\u957F\u5EA6: textToProcess.length
          });
          debugContent("regex.onTestRegexClick", "\u524D\u540E\u6B63\u5219\u63D0\u53D6\u5185\u5BB9", content, 200);
          if (contentStart > 0) {
            allRemovedRanges.push({ start: 0, end: contentStart });
          }
          if (contentEnd < textToProcess.length) {
            allRemovedRanges.push({ start: contentEnd, end: textToProcess.length });
          }
          textToProcess = content;
          baseOffset = contentStart;
        } else if (matchResult.timeout) {
          console.warn("[st-chatu8] \u524D\u540E\u6B63\u5219\u5339\u914D\u8D85\u65F6");
          toastr.warning("\u524D\u540E\u6B63\u5219\u5339\u914D\u8D85\u65F6 (>1000ms)\uFF0C\u5DF2\u8DF3\u8FC7", "\u6B63\u5219\u8D85\u65F6", { timeOut: 5e3 });
        } else {
          debugLog("regex.onTestRegexClick", "\u26A0\uFE0F \u524D\u540E\u6B63\u5219\u672A\u80FD\u5339\u914D", {
            \u539F\u56E0: !matchResult.success ? "\u6267\u884C\u5931\u8D25" : !matchResult.result ? "\u7ED3\u679C\u4E3A\u7A7A" : !matchResult.result.matches ? "\u65E0\u5339\u914D\u6570\u7EC4" : typeof matchResult.result.matches[1] !== "string" ? "\u6355\u83B7\u7EC4\u4E0D\u662F\u5B57\u7B26\u4E32" : "\u672A\u77E5",
            \u9519\u8BEF\u4FE1\u606F: matchResult.error || null,
            \u6B63\u5219\u6A21\u5F0F: contextPattern,
            \u6587\u672C\u9884\u89C8: textToProcess.substring(0, 100) + (textToProcess.length > 100 ? "..." : "")
          });
          console.warn("[st-chatu8] \u524D\u540E\u6B63\u5219\u672A\u80FD\u5339\u914D\u6587\u672C\u3002\u6A21\u5F0F:", contextPattern);
        }
      } else {
        debugLog("regex.onTestRegexClick", "\u26A0\uFE0F \u524D\u540E\u6B63\u5219\u683C\u5F0F\u9519\u8BEF", {
          \u539F\u56E0: `\u5206\u5272\u540E\u90E8\u5206\u6570\u91CF\u4E3A ${parts.length}\uFF0C\u671F\u671B\u4E3A 2`,
          \u63D0\u793A: "\u683C\u5F0F\u5E94\u4E3A: \u524D\u8FB9\u754C|\u540E\u8FB9\u754C"
        });
        console.warn("[st-chatu8] \u524D\u540E\u6B63\u5219\u683C\u5F0F\u9519\u8BEF: \u671F\u671B 1 \u4E2A\u5206\u9694\u7B26 |\uFF0C\u5B9E\u9645\u5206\u5272\u4E3A", parts.length, "\u90E8\u5206");
      }
    } else if (beforeAfterRegexStr.trim()) {
      debugLog("regex.onTestRegexClick", "\u26A0\uFE0F \u524D\u540E\u6B63\u5219\u7F3A\u5C11\u5206\u9694\u7B26", {
        \u8F93\u5165: beforeAfterRegexStr,
        \u63D0\u793A: "\u683C\u5F0F\u5E94\u4E3A: \u524D\u8FB9\u754C|\u540E\u8FB9\u754C\uFF0C\u4F7F\u7528 | \u4F5C\u4E3A\u5206\u9694\u7B26"
      });
      console.warn("[st-chatu8] \u524D\u540E\u6B63\u5219\u7F3A\u5C11\u5206\u9694\u7B26 |\uFF0C\u683C\u5F0F\u5E94\u4E3A: \u524D\u8FB9\u754C|\u540E\u8FB9\u754C");
    } else {
      debugBranch("onTestRegexClick", "\u524D\u540E\u6B63\u5219\u4E3A\u7A7A\uFF0C\u8DF3\u8FC7", true);
    }
    const settings3 = extension_settings[extensionName];
    const startTag = settings3?.startTag || "image###";
    const endTag = settings3?.endTag || "###";
    const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const builtInFilters = [
      // ★ 保护模式下跳过内置的 <image> 过滤器
      ...keepImageTag ? [] : [{ pattern: /<image>[\s\S]*?<\/image>/g, desc: "\u8FC7\u6EE4 <image> \u6807\u7B7E" }],
      { pattern: new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "g"), desc: `\u8FC7\u6EE4 ${startTag} \u6807\u8BB0` },
      { pattern: /<!--[\s\S]*?-->/g, desc: "\u8FC7\u6EE4 HTML \u6CE8\u91CA <!-- -->" }
    ];
    if (startTag !== "image###") {
      builtInFilters.push({ pattern: /image###[\s\S]*?###/g, desc: "\u8FC7\u6EE4\u65E7\u7684 image### \u6807\u8BB0" });
    }
    for (const filter of builtInFilters) {
      textToProcess = executeRegexWithWarning(
        () => textToProcess.replace(filter.pattern, ""),
        filter.desc
      );
    }
    textToProcess = applyWordReplacement(textToProcess, "text");
    let relativeRanges = [];
    if (textRegexStr.trim()) {
      const lines = textRegexStr.split("\n");
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        let pattern, flags;
        if (isRegexLiteral(trimmedLine)) {
          const regexLiteralPattern = /^\/(.+)\/([gimsuy]*)$/;
          const literalMatch = trimmedLine.match(regexLiteralPattern);
          if (!literalMatch) {
            console.warn(`Failed to parse regex literal: ${trimmedLine}`);
            continue;
          }
          pattern = literalMatch[1];
          flags = literalMatch[2] || "";
          if (!flags.includes("g")) {
            flags += "g";
          }
        } else if (trimmedLine.includes("|")) {
          const parts = trimmedLine.split("|");
          if (parts.length === 2) {
            const start = parts[0] === "^" ? "^" : escapeRegex2(parts[0]);
            const end = parts[1] === "$" ? "$" : escapeRegex2(parts[1]);
            pattern = `${start}[\\s\\S]*?${end}`;
            flags = "g";
          } else {
            continue;
          }
        } else {
          pattern = escapeRegex2(trimmedLine);
          flags = "g";
        }
        const matchAllResult = await executeRegexWithTimeout("matchAll", textToProcess, pattern, flags);
        if (matchAllResult.success && matchAllResult.result) {
          for (const matchItem of matchAllResult.result) {
            if (matchItem && matchItem.match != null) {
              relativeRanges.push({
                start: matchItem.index,
                end: matchItem.index + matchItem.match.length
              });
            }
          }
        } else if (matchAllResult.timeout) {
          console.warn(`[st-chatu8] \u6587\u5B57\u6B63\u5219\u5339\u914D\u8D85\u65F6: ${trimmedLine.substring(0, 30)}`);
          toastr.warning(`\u6587\u5B57\u6B63\u5219\u5339\u914D\u8D85\u65F6 (>1000ms)\uFF0C\u5DF2\u8DF3\u8FC7: ${trimmedLine.substring(0, 30)}...`, "\u6B63\u5219\u8D85\u65F6", {
            timeOut: 5e3
          });
        }
      }
    }
    const mergedRelativeRanges = mergeRanges(relativeRanges);
    let final_text = "";
    let lastIndex = 0;
    mergedRelativeRanges.forEach((range) => {
      final_text += textToProcess.substring(lastIndex, range.start);
      lastIndex = range.end;
    });
    final_text += textToProcess.substring(lastIndex);
    const absoluteTextRanges = mergedRelativeRanges.map((range) => ({
      start: range.start + baseOffset,
      end: range.end + baseOffset
    }));
    allRemovedRanges.push(...absoluteTextRanges);
    const finalRemovedRanges = mergeRanges(allRemovedRanges);
    if (keepImageTag && imgPlaceholders.length > 0) {
      for (const { token: token2, original } of imgPlaceholders) {
        final_text = final_text.split(token2).join(original);
      }
      debugLog("regex.onTestRegexClick", "\u{1F6E1}\uFE0F \u5DF2\u8FD8\u539F <image> \u6807\u7B7E", {
        \u6570\u91CF: imgPlaceholders.length
      });
    }
    if (!keepImageTag) {
      final_text = final_text.replace(/<image>[\s\S]*?<\/image>/g, "");
    }
    final_text = final_text.trim();
    resultText.val(final_text);
    debugLog("regex.onTestRegexClick", "\u6B63\u5219\u5904\u7406\u5B8C\u6210", {
      \u539F\u59CB\u957F\u5EA6: sourceText?.length || 0,
      \u6700\u7EC8\u957F\u5EA6: final_text?.length || 0,
      \u957F\u5EA6\u53D8\u5316: (final_text?.length || 0) - (sourceText?.length || 0),
      \u79FB\u9664\u8303\u56F4\u6570: finalRemovedRanges.length
    });
    debugContent("regex.onTestRegexClick", "\u5904\u7406\u540E\u6587\u672C", final_text, 300);
    addLog(`[Regex \u5904\u7406\u540E\u6587\u672C]
${final_text}`);
    const isAutomatedCall = !!requestId;
    const isTestMode = extension_settings[extensionName].regexTestMode;
    if (isAutomatedCall || !isTestMode) {
      debugBranch("onTestRegexClick", "\u53D1\u9001\u6B63\u5219\u5904\u7406\u7ED3\u679C", true, {
        \u662F\u81EA\u52A8\u8C03\u7528: isAutomatedCall,
        \u6D4B\u8BD5\u6A21\u5F0F: isTestMode
      });
      eventSource.emit(eventNames.REGEX_RESULT_MESSAGE, {
        message: final_text,
        removedRanges: finalRemovedRanges,
        // Include the ranges
        id: requestId
      });
    }
    timer.end(`\u5904\u7406\u5B8C\u6210 - \u539F\u6587${sourceText?.length || 0}\u5B57 \u2192 \u6700\u7EC8${final_text?.length || 0}\u5B57`);
  } catch (e) {
    debugLog("regex.onTestRegexClick", "\u6B63\u5219\u5904\u7406\u5931\u8D25", {
      \u9519\u8BEF: e.message
    });
    timer.end(`\u5904\u7406\u5931\u8D25: ${e.message}`);
    toastr.error(`\u6B63\u5219\u8868\u8FBE\u5F0F\u9519\u8BEF: ${e.message}`);
    resultText.val(`\u9519\u8BEF: ${e.message}`);
  }
}

function onRegexTestModeChange() {
  extension_settings[extensionName].regexTestMode = $(this).is(":checked");
  saveSettingsDebounced();
}

function onGestureEnabledChange() {
  const enabled = $(this).is(":checked");
  extension_settings[extensionName].gestureEnabled = enabled;
  saveSettingsDebounced();
  if (enabled) {
    initGestureMonitor();
  } else {
    stopGestureMonitor();
  }
}

function onClickTriggerEnabledChange() {
  const enabled = $(this).is(":checked");
  extension_settings[extensionName].clickTriggerEnabled = enabled;
  saveSettingsDebounced();
  if (enabled) {
    initClickTriggerMonitor();
  } else {
    stopClickTriggerMonitor();
  }
}

function onGestureShowRecognitionChange() {
  extension_settings[extensionName].gestureShowRecognition = $(this).is(":checked");
  saveSettingsDebounced();
}

function onGestureShowTrailChange() {
  extension_settings[extensionName].gestureShowTrail = $(this).is(":checked");
  saveSettingsDebounced();
}

function onGestureTrailColorChange() {
  extension_settings[extensionName].gestureTrailColor = $(this).val();
  saveSettingsDebounced();
}

function onImageGenDemandEnabledChange() {
  extension_settings[extensionName].imageGenDemandEnabled = $(this).is(":checked");
  saveSettingsDebounced();
}

function onVisualPrepDemandEnabledChange() {
  extension_settings[extensionName].visualPrepDemandEnabled = $(this).is(":checked");
  saveSettingsDebounced();
}

function onGestureMatchThresholdChange() {
  const value = $(this).val();
  gestureMatchThresholdValue.text(`${value}%`);
  extension_settings[extensionName].gestureMatchThreshold = parseInt(value, 10);
  saveSettingsDebounced();
}

function ensureDemandProfiles() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.demand_profiles || typeof settings3.demand_profiles !== "object") {
    settings3.demand_profiles = {
      "\u9ED8\u8BA4": {
        defaultCharDemand: settings3.defaultCharDemand ?? "",
        defaultImageDemand: settings3.defaultImageDemand ?? "",
        defaultVisualPrepDemand: settings3.defaultVisualPrepDemand ?? ""
      }
    };
  }
  if (!settings3.current_demand_profile || !settings3.demand_profiles[settings3.current_demand_profile]) {
    const profileNames = Object.keys(settings3.demand_profiles);
    settings3.current_demand_profile = profileNames.length > 0 ? profileNames[0] : "\u9ED8\u8BA4";
    if (!settings3.demand_profiles[settings3.current_demand_profile]) {
      settings3.demand_profiles[settings3.current_demand_profile] = {
        defaultCharDemand: settings3.defaultCharDemand ?? "",
        defaultImageDemand: settings3.defaultImageDemand ?? "",
        defaultVisualPrepDemand: settings3.defaultVisualPrepDemand ?? ""
      };
    }
  }
}

function applyCurrentDemandProfileToUI() {
  ensureDemandProfiles();
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.current_demand_profile;
  const profile = settings3.demand_profiles[currentName] || {
    defaultCharDemand: "",
    defaultImageDemand: "",
    defaultVisualPrepDemand: ""
  };
  settings3.defaultCharDemand = profile.defaultCharDemand ?? "";
  settings3.defaultImageDemand = profile.defaultImageDemand ?? "";
  settings3.defaultVisualPrepDemand = profile.defaultVisualPrepDemand ?? "";
  if (defaultCharDemandTextarea) defaultCharDemandTextarea.val(settings3.defaultCharDemand);
  if (defaultImageDemandTextarea) defaultImageDemandTextarea.val(settings3.defaultImageDemand);
  if (defaultVisualPrepDemandTextarea) defaultVisualPrepDemandTextarea.val(settings3.defaultVisualPrepDemand);
}

function loadDemandProfiles(selectTargetProfile = null) {
  ensureDemandProfiles();
  const settings3 = extension_settings[extensionName];
  const profiles = settings3.demand_profiles;
  let currentName = selectTargetProfile || settings3.current_demand_profile;
  if (!profiles[currentName]) {
    currentName = Object.keys(profiles)[0] || "\u9ED8\u8BA4";
  }
  settings3.current_demand_profile = currentName;
  if (!demandProfileSelect) return;
  demandProfileSelect.empty();
  Object.keys(profiles).forEach((name) => {
    const option = new Option(name, name, name === currentName, name === currentName);
    demandProfileSelect.append(option);
  });
  demandProfileSelect.val(currentName);
  applyCurrentDemandProfileToUI();
}

function onDemandProfileSelectChange() {
  const profileName = $(this).val();
  if (!profileName) return;
  const settings3 = extension_settings[extensionName];
  if (settings3.demand_profiles?.[profileName]) {
    settings3.current_demand_profile = profileName;
    applyCurrentDemandProfileToUI();
    saveSettingsDebounced();
  }
}

function onNewDemandProfileClick() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u9700\u6C42\u9884\u8BBE\u540D\u79F0").then((newName) => {
    if (!newName || !newName.trim()) return;
    const name = newName.trim();
    ensureDemandProfiles();
    const settings3 = extension_settings[extensionName];
    if (settings3.demand_profiles[name]) {
      toastr.error(`\u9884\u8BBE "${name}" \u5DF2\u5B58\u5728\u3002`);
      return;
    }
    settings3.demand_profiles[name] = {
      defaultCharDemand: defaultCharDemandTextarea?.val() ?? "",
      defaultImageDemand: defaultImageDemandTextarea?.val() ?? "",
      defaultVisualPrepDemand: defaultVisualPrepDemandTextarea?.val() ?? ""
    };
    settings3.current_demand_profile = name;
    saveSettingsDebounced();
    loadDemandProfiles(name);
    toastr.success(`\u9700\u6C42\u9884\u8BBE "${name}" \u5DF2\u521B\u5EFA\u5E76\u9009\u4E2D\u3002`);
  });
}

function onRenameDemandProfileClick() {
  ensureDemandProfiles();
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.current_demand_profile;
  stylInput(`\u8BF7\u8F93\u5165\u65B0\u7684\u9884\u8BBE\u540D\u79F0\uFF08\u539F\u540D\u79F0\uFF1A${currentName}\uFF09`, currentName).then((newName) => {
    if (!newName || !newName.trim()) return;
    const name = newName.trim();
    if (name === currentName) return;
    if (settings3.demand_profiles[name]) {
      toastr.error(`\u9884\u8BBE "${name}" \u5DF2\u5B58\u5728\u3002`);
      return;
    }
    settings3.demand_profiles[name] = settings3.demand_profiles[currentName];
    delete settings3.demand_profiles[currentName];
    settings3.current_demand_profile = name;
    saveSettingsDebounced();
    loadDemandProfiles(name);
    toastr.success(`\u9884\u8BBE "${currentName}" \u5DF2\u91CD\u547D\u540D\u4E3A "${name}"\u3002`);
  });
}

function onSaveDemandProfileClick() {
  ensureDemandProfiles();
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.current_demand_profile;
  settings3.demand_profiles[currentName] = {
    defaultCharDemand: defaultCharDemandTextarea?.val() ?? "",
    defaultImageDemand: defaultImageDemandTextarea?.val() ?? "",
    defaultVisualPrepDemand: defaultVisualPrepDemandTextarea?.val() ?? ""
  };
  settings3.defaultCharDemand = settings3.demand_profiles[currentName].defaultCharDemand;
  settings3.defaultImageDemand = settings3.demand_profiles[currentName].defaultImageDemand;
  settings3.defaultVisualPrepDemand = settings3.demand_profiles[currentName].defaultVisualPrepDemand;
  saveSettingsDebounced();
  toastr.success(`\u9700\u6C42\u9884\u8BBE "${currentName}" \u5DF2\u4FDD\u5B58\u3002`);
}

function onDeleteDemandProfileClick() {
  ensureDemandProfiles();
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.current_demand_profile;
  const profileNames = Object.keys(settings3.demand_profiles);
  if (profileNames.length <= 1) {
    toastr.warning("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u9700\u6C42\u9884\u8BBE\uFF0C\u65E0\u6CD5\u5220\u9664\u3002");
    return;
  }
  if (!confirm(`\u786E\u5B9A\u8981\u5220\u9664\u9700\u6C42\u9884\u8BBE "${currentName}" \u5417\uFF1F`)) {
    return;
  }
  delete settings3.demand_profiles[currentName];
  const remainingProfiles = Object.keys(settings3.demand_profiles);
  const nextProfile = remainingProfiles[0];
  settings3.current_demand_profile = nextProfile;
  saveSettingsDebounced();
  loadDemandProfiles(nextProfile);
  toastr.success(`\u9700\u6C42\u9884\u8BBE "${currentName}" \u5DF2\u5220\u9664\uFF0C\u5DF2\u5207\u6362\u81F3 "${nextProfile}"\u3002`);
}

function onDefaultCharDemandChange() {
  const val = $(this).val();
  const settings3 = extension_settings[extensionName];
  settings3.defaultCharDemand = val;
  ensureDemandProfiles();
  const currentName = settings3.current_demand_profile;
  if (settings3.demand_profiles?.[currentName]) {
    settings3.demand_profiles[currentName].defaultCharDemand = val;
  }
  saveSettingsDebounced();
}

function onDefaultImageDemandChange() {
  const val = $(this).val();
  const settings3 = extension_settings[extensionName];
  settings3.defaultImageDemand = val;
  ensureDemandProfiles();
  const currentName = settings3.current_demand_profile;
  if (settings3.demand_profiles?.[currentName]) {
    settings3.demand_profiles[currentName].defaultImageDemand = val;
  }
  saveSettingsDebounced();
}

function onDefaultVisualPrepDemandChange() {
  const val = $(this).val();
  const settings3 = extension_settings[extensionName];
  settings3.defaultVisualPrepDemand = val;
  ensureDemandProfiles();
  const currentName = settings3.current_demand_profile;
  if (settings3.demand_profiles?.[currentName]) {
    settings3.demand_profiles[currentName].defaultVisualPrepDemand = val;
  }
  saveSettingsDebounced();
}

function initRegexSettings() {
  __set_profileSelect2($("#ch-regex-profile-select"));
  __set_beforeAfterEditor($("#ch-regex-before-after-editor"));
  __set_textEditor($("#ch-regex-text-editor"));
  __set_originalText($("#ch-regex-test-original-text"));
  __set_resultText($("#ch-regex-test-result-text"));
  __set_regexTestModeSwitch($("#ch-regex-test-mode"));
  __set_gestureEnabledSwitch($("#ch-gesture-enabled"));
  __set_clickTriggerEnabledSwitch($("#ch-click-trigger-enabled"));
  __set_gestureShowRecognitionSwitch($("#ch-gesture-show-recognition"));
  __set_gestureShowTrailSwitch($("#ch-gesture-show-trail"));
  __set_gestureTrailColorPicker($("#ch-gesture-trail-color"));
  __set_gestureMatchThresholdSlider($("#ch-gesture-match-threshold"));
  __set_gestureMatchThresholdValue($("#ch-gesture-match-threshold-value"));
  __set_imageGenDemandEnabledSwitch($("#ch-image-gen-demand-enabled"));
  __set_visualPrepDemandEnabledSwitch($("#ch-visual-prep-demand-enabled"));
  __set_demandProfileSelect($("#ch-demand-profile-select"));
  __set_defaultCharDemandTextarea($("#ch-default-char-demand"));
  __set_defaultImageDemandTextarea($("#ch-default-image-demand"));
  __set_defaultVisualPrepDemandTextarea($("#ch-default-visual-prep-demand"));
  regexTestModeSwitch.prop("checked", extension_settings[extensionName].regexTestMode ?? false);
  gestureEnabledSwitch.prop("checked", extension_settings[extensionName].gestureEnabled ?? false);
  clickTriggerEnabledSwitch.prop("checked", extension_settings[extensionName].clickTriggerEnabled ?? true);
  gestureShowRecognitionSwitch.prop("checked", extension_settings[extensionName].gestureShowRecognition ?? true);
  gestureShowTrailSwitch.prop("checked", extension_settings[extensionName].gestureShowTrail ?? true);
  gestureTrailColorPicker.val(extension_settings[extensionName].gestureTrailColor ?? "#00ff00");
  const threshold = extension_settings[extensionName].gestureMatchThreshold ?? 60;
  gestureMatchThresholdSlider.val(threshold);
  gestureMatchThresholdValue.text(`${threshold}%`);
  imageGenDemandEnabledSwitch.prop("checked", extension_settings[extensionName].imageGenDemandEnabled ?? false);
  visualPrepDemandEnabledSwitch.prop("checked", extension_settings[extensionName].visualPrepDemandEnabled ?? false);
  defaultCharDemandTextarea.val(extension_settings[extensionName].defaultCharDemand ?? "");
  defaultImageDemandTextarea.val(extension_settings[extensionName].defaultImageDemand ?? "");
  defaultVisualPrepDemandTextarea.val(extension_settings[extensionName].defaultVisualPrepDemand ?? "");
  $("#ch-new-regex-profile-button").on("click", onNewProfileClick2);
  $("#ch-rename-regex-profile-button").on("click", onRenameProfileClick);
  $("#ch-save-regex-profile-button").on("click", onSaveProfileClick2);
  $("#ch-save-as-regex-profile-button").on("click", onSaveAsProfileClick);
  $("#ch-delete-regex-profile-button").on("click", onDeleteProfileClick2);
  $("#ch-import-regex-profile-button").on("click", onImportProfileClick2);
  $("#ch-export-regex-profile-button").on("click", onExportProfileClick2);
  $("#ch-test-regex-button").on("click", () => onTestRegexClick());
  profileSelect2.on("change", onProfileSelectChange2);
  regexTestModeSwitch.on("change", onRegexTestModeChange);
  gestureEnabledSwitch.on("change", onGestureEnabledChange);
  clickTriggerEnabledSwitch.on("change", onClickTriggerEnabledChange);
  gestureShowRecognitionSwitch.on("change", onGestureShowRecognitionChange);
  gestureShowTrailSwitch.on("change", onGestureShowTrailChange);
  gestureTrailColorPicker.on("input", onGestureTrailColorChange);
  gestureMatchThresholdSlider.on("input", onGestureMatchThresholdChange);
  imageGenDemandEnabledSwitch.on("change", onImageGenDemandEnabledChange);
  visualPrepDemandEnabledSwitch.on("change", onVisualPrepDemandEnabledChange);
  defaultCharDemandTextarea.on("input", onDefaultCharDemandChange);
  defaultImageDemandTextarea.on("input", onDefaultImageDemandChange);
  defaultVisualPrepDemandTextarea.on("input", onDefaultVisualPrepDemandChange);
  $("#ch-new-demand-profile-button").on("click", onNewDemandProfileClick);
  $("#ch-rename-demand-profile-button").on("click", onRenameDemandProfileClick);
  $("#ch-save-demand-profile-button").on("click", onSaveDemandProfileClick);
  $("#ch-delete-demand-profile-button").on("click", onDeleteDemandProfileClick);
  demandProfileSelect.on("change", onDemandProfileSelectChange);
  loadDemandProfiles();
  $("#ch-gesture-1-button").on("click", () => onRecordGestureClick("gesture1"));
  $("#ch-gesture-2-button").on("click", () => onRecordGestureClick("gesture2"));
  eventSource.on(eventNames.REGEX_TEST_MESSAGE, (data) => {
    const { message, id, keepImageTag } = data;
    if (originalText && message) {
      clearLog();
      addLog(`[Regex \u539F\u59CB\u6587\u672C]
${message}`);
      originalText.val(message);
      onTestRegexClick(id, { keepImageTag: keepImageTag === true });
    }
  });
  __set_regexEntriesContainer($("#ch-regex-entries-container"));
  $("#ch-add-regex-entry-button").on("click", addNewRegexEntry);
  $("#ch-import-regex-entry-button").on("click", importRegexEntries);
  $("#ch-import-regex-entry-engine-button").on("click", importRegexEntriesFromEngine);
  bindRegexEntryDragEvents();
  bindRegexEntryEvents();
  loadRegexProfiles();
  initWordReplacementSettings();
}

async function onRecordGestureClick(gestureKey) {
  try {
    const newPattern = await recordGesture();
    if (newPattern) {
      extension_settings[extensionName][gestureKey] = newPattern;
      saveSettingsDebounced();
      toastr.success(`\u624B\u52BF "${gestureKey === "gesture1" ? "\u4E00" : "\u4E8C"}" \u5DF2\u66F4\u65B0\u3002`);
    }
  } catch (error) {
    toastr.error("\u5F55\u5236\u624B\u52BF\u5931\u8D25\u3002");
    console.error("Gesture recording failed:", error);
  }
}

function getRegexTestStatus() {
  const testMode = extension_settings[extensionName].regexTestMode ?? false;
  const live = (cached, selector) => {
    if (cached && cached.length && cached[0] && $.contains(document, cached[0])) {
      return cached;
    }
    return $(selector);
  };
  const $profile = live(profileSelect2, "#ch-regex-profile-select");
  const $orig = live(originalText, "#ch-regex-test-original-text");
  const $res = live(resultText, "#ch-regex-test-result-text");
  const $ba = live(beforeAfterEditor, "#ch-regex-before-after-editor");
  const $te = live(textEditor, "#ch-regex-text-editor");
  const currentProfile = $profile.length ? $profile.val() : "";
  const origText = $orig.length ? $orig.val() : "";
  const resText = $res.length ? $res.val() : "";
  const baEditor = $ba.length ? $ba.val() : "";
  const tEditor = $te.length ? $te.val() : "";
  const entries = collectRegexEntriesFromUI();
  const entrySummary = entries.map((e, i) => ({
    index: i + 1,
    name: e.scriptName || "(\u65E0\u540D\u79F0)",
    disabled: !!e.disabled,
    findRegex: (e.findRegex || "").substring(0, 60),
    replaceString: (e.replaceString || "").substring(0, 60)
  }));
  const gestureEnabled = extension_settings[extensionName].gestureEnabled ?? false;
  const clickTriggerEnabled = extension_settings[extensionName].clickTriggerEnabled ?? false;
  return {
    testMode,
    currentProfile,
    originalText: origText ? origText.substring(0, 3e4) : "(\u7A7A)",
    resultText: resText ? resText.substring(0, 3e4) : "(\u7A7A)",
    beforeAfterRegex: baEditor || "(\u7A7A)",
    textRegex: tEditor || "(\u7A7A)",
    regexEntries: entrySummary,
    entryCount: entries.length,
    gestureEnabled,
    clickTriggerEnabled
  };
}

function setRegexOriginalText(text) {
  if (!originalText || originalText.length === 0) {
    return "\u274C \u539F\u6587\u6846\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u6B63\u5219\u9875\u9762\u3002";
  }
  originalText.val(text || "");
  return `\u2705 \u5DF2\u8BBE\u7F6E\u539F\u6587 (${(text || "").length} \u5B57\u7B26)`;
}

function setRegexEditors(beforeAfter, textRegex) {
  const results = [];
  if (beforeAfter !== void 0 && beforeAfter !== null) {
    if (!beforeAfterEditor || beforeAfterEditor.length === 0) {
      results.push("\u274C \u524D\u540E\u6B63\u5219\u7F16\u8F91\u5668\u4E0D\u5B58\u5728");
    } else {
      beforeAfterEditor.val(beforeAfter);
      results.push(`\u2705 \u524D\u540E\u6B63\u5219\u5DF2\u8BBE\u7F6E`);
    }
  }
  if (textRegex !== void 0 && textRegex !== null) {
    if (!textEditor || textEditor.length === 0) {
      results.push("\u274C \u6587\u5B57\u6B63\u5219\u7F16\u8F91\u5668\u4E0D\u5B58\u5728");
    } else {
      textEditor.val(textRegex);
      results.push(`\u2705 \u6587\u5B57\u6B63\u5219\u5DF2\u8BBE\u7F6E`);
    }
  }
  return results.join("\n");
}

function createRegexEntryByAI(data) {
  if (!data || !data.findRegex) {
    return "\u274C \u5FC5\u987B\u63D0\u4F9B findRegex \u5B57\u6BB5\u3002";
  }
  const containerInDocument = regexEntriesContainer && $.contains(document, regexEntriesContainer[0]);
  if (!containerInDocument) {
    __set_regexEntriesContainer($("#ch-regex-entries-container"));
  }
  if (!regexEntriesContainer || regexEntriesContainer.length === 0) {
    return "\u274C \u6B63\u5219\u6761\u76EE\u5BB9\u5668\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u6B63\u5219\u9875\u9762\u3002";
  }
  regexEntriesContainer.find(".st-chatu8-entries-empty").remove();
  const newEntry = {
    ...DEFAULT_REGEX_ENTRY,
    id: generateRegexEntryId(),
    scriptName: data.scriptName || "AI\u521B\u5EFA\u7684\u6B63\u5219",
    findRegex: data.findRegex,
    replaceString: data.replaceString || "",
    disabled: data.disabled === true
  };
  addRegexEntryDOM(newEntry);
  saveRegexEntriesToProfile();
  return `\u2705 \u5DF2\u521B\u5EFA\u6B63\u5219\u6761\u76EE: "${newEntry.scriptName}"
   \u67E5\u627E: ${newEntry.findRegex.substring(0, 80)}
   \u66FF\u6362: ${(newEntry.replaceString || "(\u7A7A)").substring(0, 80)}`;
}

async function triggerRegexTest() {
  try {
    await onTestRegexClick();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const resText = resultText ? resultText.val() : "";
    return `\u2705 \u6B63\u5219\u6D4B\u8BD5\u5B8C\u6210\u3002
\u7ED3\u679C\u6587\u672C:
${resText ? resText.substring(0, 3e4) : "(\u7A7A)"}`;
  } catch (e) {
    return `\u274C \u6B63\u5219\u6D4B\u8BD5\u5931\u8D25: ${e.message}`;
  }
}

function setRegexTestMode(enabled) {
  if (!regexTestModeSwitch || regexTestModeSwitch.length === 0) {
    return "\u274C \u6D4B\u8BD5\u6A21\u5F0F\u5F00\u5173\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u6B63\u5219\u9875\u9762\u3002";
  }
  regexTestModeSwitch.prop("checked", !!enabled).trigger("change");
  return `\u2705 \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F\u5DF2${enabled ? "\u5F00\u542F" : "\u5173\u95ED"}`;
}

function getRegexResultText() {
  const resText = resultText ? resultText.val() : "";
  return resText || "(\u7A7A)";
}

function setGestureEnabled(enabled) {
  if (!gestureEnabledSwitch || gestureEnabledSwitch.length === 0) {
    return "\u274C \u624B\u52BF\u529F\u80FD\u5F00\u5173\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u6B63\u5219\u9875\u9762\u3002";
  }
  gestureEnabledSwitch.prop("checked", !!enabled).trigger("change");
  return `\u2705 \u624B\u52BF\u529F\u80FD\u5DF2${enabled ? "\u5F00\u542F" : "\u5173\u95ED"}`;
}

function setClickTriggerEnabled(enabled) {
  if (!clickTriggerEnabledSwitch || clickTriggerEnabledSwitch.length === 0) {
    return "\u274C \u70B9\u51FB\u89E6\u53D1\u5F00\u5173\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u6B63\u5219\u9875\u9762\u3002";
  }
  clickTriggerEnabledSwitch.prop("checked", !!enabled).trigger("change");
  return `\u2705 \u70B9\u51FB\u89E6\u53D1\u5DF2${enabled ? "\u5F00\u542F" : "\u5173\u95ED"}`;
}

function clearAllRegexEntries() {
  const containerInDocument = regexEntriesContainer && $.contains(document, regexEntriesContainer[0]);
  if (!containerInDocument) {
    __set_regexEntriesContainer($("#ch-regex-entries-container"));
  }
  if (!regexEntriesContainer || regexEntriesContainer.length === 0) {
    return "\u274C \u6B63\u5219\u6761\u76EE\u5BB9\u5668\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u6B63\u5219\u9875\u9762\u3002";
  }
  const count = regexEntriesContainer.find(".st-chatu8-preset-entry").length;
  regexEntriesContainer.empty();
  regexEntriesContainer.html(`
        <div class="st-chatu8-entries-empty">
            <i class="fa-solid fa-inbox"></i>
            <p>\u6682\u65E0\u6B63\u5219\u6761\u76EE\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0</p>
        </div>
    `);
  saveRegexEntriesToProfile();
  return `\u2705 \u5DF2\u6E05\u9664\u5168\u90E8 ${count} \u4E2A\u6B63\u5219\u6761\u76EE`;
}

window.regexAIBridge = {
  getStatus: getRegexTestStatus,
  setOriginalText: setRegexOriginalText,
  setEditors: setRegexEditors,
  createEntry: createRegexEntryByAI,
  triggerTest: triggerRegexTest,
  setTestMode: setRegexTestMode,
  getResultText: getRegexResultText,
  setGestureEnabled,
  setClickTriggerEnabled,
  clearAllEntries: clearAllRegexEntries
};

export function __set_currentImg2ImgRefImage(v) { currentImg2ImgRefImage = v; }

export function __set_currentImg2ImgRefName(v) { currentImg2ImgRefName = v; }

export function __set_activeMobileTab(v) { activeMobileTab = v; }

export function __set_allAvailableWorldsList(v) { allAvailableWorldsList = v; }

export function __set_activeInspectingWorldName(v) { activeInspectingWorldName = v; }

export function __set_currentEntryDisplayedCount(v) { currentEntryDisplayedCount = v; }

export function __set_isGenerating2(v) { isGenerating2 = v; }

export function __set_isGeneratingImage(v) { isGeneratingImage = v; }

export function __set_activeImageRequestId(v) { activeImageRequestId = v; }

export function __set_activeImageListener(v) { activeImageListener = v; }

export function __set_latestGeneratedAsset(v) { latestGeneratedAsset = v; }

export function __set_latestGeneratedImageData(v) { latestGeneratedImageData = v; }

export function __set_$container(v) { $container = v; }

export function __set_currentWorldFilter(v) { currentWorldFilter = v; }

export function __set_currentEntryFilter(v) { currentEntryFilter = v; }

export function __set_currentWorldSearchKeyword(v) { currentWorldSearchKeyword = v; }

export function __set_currentEntrySearchKeyword(v) { currentEntrySearchKeyword = v; }

export function __set_currentOverlay(v) { currentOverlay = v; }

export function __set_currentBubble(v) { currentBubble = v; }

export function __set_clickPollingTimer(v) { clickPollingTimer = v; }

export function __set_boundElements(v) { boundElements = v; }

export { $container, activeImageListener, activeImageRequestId, activeInspectingWorldName, activeMobileTab, allAvailableWorldsList, boundElements, cachedWorldEntriesMap, clickPollingTimer, currentBubble, currentEntryDisplayedCount, currentEntryFilter, currentEntryPageSize, currentEntrySearchKeyword, currentImg2ImgRefImage, currentImg2ImgRefName, currentOverlay, currentWorldFilter, currentWorldSearchKeyword, initRegexSettings, isGenerating2, isGeneratingImage, latestGeneratedAsset, latestGeneratedImageData };
