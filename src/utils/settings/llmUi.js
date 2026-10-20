// 还原自打包产物 — 原始模块: utils/settings/llmUi.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../../script.js";
import { defaultTailMessagesConfig, defaultToolCallConfig } from "./defaultToolCallConfig.js";
import { LLMRequestTypes, eventNames, extensionName } from "../config.js";
import { getRequestHeaders } from "../utils.js";
import { parseBoolean } from "./toolCallService.js";
import { buildVertexEndpoint, convertOpenAIToVertexGemini, convertVertexToOpenAIResponse, getVertexAccessToken } from "./vertexService.js";
import { buildPromptForRequestType, buildProxyIncludeHeaders, executeDefaultLLMRequest, executeTypedLLMRequest, extractApiErrorMessage, formatPromptForDisplay, getLLMRequestController, parseCustomBody, parseCustomHeaders, setLLMRequestController } from "./llmService.js";

var SCROLL_SPEED, SCROLL_THRESHOLD, VIRTUAL_BUFFER, VIRTUAL_ITEM_HEIGHT, activeMoveSourceEntry, addTailMsgBtn, addToolFieldBtn, aiAssistantApiSelect, aiAssistantContextSelect, apiKeyInput, apiUrlInput, bypassProxyToggle, channelOpenAiBtn, channelVertexBtn, charDesignApiSelect, charDesignContextSelect, charDisplayApiSelect, charDisplayContextSelect, charModifyApiSelect, charModifyContextSelect, combinedPromptTextarea, currentChannelType, currentEditingEntry, currentVertexCredentials, customBodyParamsContainer, customBodyParamsTextarea, customHeadersContainer, customHeadersTextarea, customTailDetailsArea, customTailEnabledCheckbox, customToolDetailsArea, customToolEnabledCheckbox, deleteRequestTypeProfileBtn, dragScrollInterval, draggedEntry, enableCustomBodyParamsToggle, enableCustomHeadersToggle, enableMaxTokensCheckbox, enableTemperatureCheckbox, enableTopPCheckbox, entryIdCounter, exportAllRequestTypeProfilesBtn, exportRequestTypeProfileBtn, exportTailConfigBtn, exportToolConfigBtn, fetchModelsButton, historyDepthSlider, historyDepthValue, imageGenApiSelect, imageGenContextSelect, importRequestTypeProfileBtn, importTailConfigBtn, importToolConfigBtn, lastRenderedRange, loadRequestTypeProfileBtn, maxTokensContainer, maxTokensSlider, maxTokensValue, mergeSystemUserToggle, modelInput, modelSelect, newRequestTypeProfileBtn, openaiConfigContainer, personaGenApiSelect, personaGenContextSelect, presetEntriesContainer, profileSelect, renameRequestTypeProfileBtn, requestTypeProfileSelect, resultTextarea, retryCountSlider, retryCountValue, saveRequestTypeProfileBtn, sendImagesToggle, streamToggle, summaryApiSelect, summaryContextSelect, tagModifyApiSelect, tagModifyContextSelect, tailConfigFileInput, tailMessagesContainer, temperatureContainer, temperatureSlider, temperatureValue, testButton, testContextSelect, toolConfigFileInput, toolDescTextarea, toolFieldsContainer, toolFixedNameInput, toolFixedNameRow, toolNameModeSelect, topPContainer, topPSlider, topPValue, translationApiSelect, translationContextSelect, userPersonaGenApiSelect, userPersonaGenContextSelect, vertexClearBtn, vertexClientEmailText, vertexConfigContainer, vertexCredInfo, vertexFileInput, vertexImportBtn, vertexLocationInput, vertexLocationSelect, vertexModelInput, vertexModelSelect, vertexProjectIdText, vertexStatusText, reasoningEffortSelect, queryCapsButton, capsResultSpan, videoAssetGenApiSelect, videoAssetGenContextSelect, videoGenApiSelect, videoGenContextSelect, virtualEntriesData, virtualScrollContainer, virtualScrollEnabled, virtualScrollSpacer, visualMatPrepApiSelect, visualMatPrepContextSelect;

currentChannelType = "openai";

currentVertexCredentials = null;

entryIdCounter = 0;

currentEditingEntry = null;

virtualEntriesData = [];

virtualScrollEnabled = true;

VIRTUAL_ITEM_HEIGHT = 78;

VIRTUAL_BUFFER = 30;

lastRenderedRange = { start: -1, end: -1 };

virtualScrollContainer = null;

virtualScrollSpacer = null;

draggedEntry = null;

dragScrollInterval = null;

SCROLL_THRESHOLD = 50;

SCROLL_SPEED = 8;

activeMoveSourceEntry = null;

function updateCombinedPrompt(promptOrText, diagnosticText = "") {
  if (combinedPromptTextarea) {
    let displayText = diagnosticText;
    displayText += formatPromptForDisplay(promptOrText);
    combinedPromptTextarea.val(displayText);
  }
}

function getResultTextareaUpdater() {
  return (text) => {
    if (resultTextarea) {
      resultTextarea.val(text);
    }
  };
}

function getEntryEditModalHTML() {
  return `
        <div class="st-chatu8-entry-edit-modal-backdrop" id="ch-entry-edit-modal">
            <div class="st-chatu8-entry-edit-modal">
                <div class="st-chatu8-entry-edit-modal-header">
                    <h4>\u7F16\u8F91\u6761\u76EE</h4>
                    <span class="st-chatu8-entry-edit-modal-close">&times;</span>
                </div>
                <div class="st-chatu8-entry-edit-modal-body">
                    <div class="st-chatu8-modal-field">
                        <label>\u6761\u76EE\u540D\u79F0</label>
                        <input type="text" id="ch-modal-entry-name" class="st-chatu8-text-input" placeholder="\u6761\u76EE\u540D\u79F0" />
                    </div>
                    <div class="st-chatu8-modal-field-row">
                        <div class="st-chatu8-modal-field">
                            <label>\u89D2\u8272</label>
                            <select id="ch-modal-entry-role" class="st-chatu8-select">
                                <option value="system">System</option>
                                <option value="user">User</option>
                                <option value="assistant">Assistant</option>
                            </select>
                        </div>
                        <div class="st-chatu8-modal-field">
                            <label>\u89E6\u53D1\u6A21\u5F0F</label>
                            <select id="ch-modal-trigger-mode" class="st-chatu8-select">
                                <option value="always">\u5E38\u5F00</option>
                                <option value="trigger">\u89E6\u53D1</option>
                            </select>
                        </div>
                        <div class="st-chatu8-modal-field st-chatu8-modal-toggle-field">
                            <label>\u542F\u7528</label>
                            <div class="st-chatu8-toggle">
                                <input id="ch-modal-entry-enabled" type="checkbox" checked />
                                <span class="st-chatu8-slider"></span>
                            </div>
                        </div>
                    </div>
                    <div class="st-chatu8-modal-field" id="ch-modal-trigger-words-container" style="display: none;">
                        <label>\u89E6\u53D1\u8BCD\uFF08\u9017\u53F7\u5206\u9694\uFF09</label>
                        <input type="text" id="ch-modal-trigger-words" class="st-chatu8-text-input" placeholder="\u89E6\u53D1\u8BCD1, \u89E6\u53D1\u8BCD2" />
                        <label style="margin-top: 10px;">\u5E76\u5217\u89E6\u53D1\u8BCD\uFF08\u540C\u65F6\u6EE1\u8DB3\uFF0C\u9017\u53F7\u5206\u9694\uFF0C\u53EF\u9009\uFF09</label>
                        <input type="text" id="ch-modal-and-trigger-words" class="st-chatu8-text-input" placeholder="\u5E76\u5217\u89E6\u53D1\u8BCD1, \u5E76\u5217\u89E6\u53D1\u8BCD2" />
                    </div>
                    <div class="st-chatu8-modal-field">
                        <label>\u5185\u5BB9</label>
                        <textarea id="ch-modal-entry-content" class="st-chatu8-textarea" rows="10" placeholder="\u8F93\u5165\u5185\u5BB9..."></textarea>
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

function showEntryEditModal($entryElement) {
  currentEditingEntry = $entryElement;
  let $modal2 = $("#ch-entry-edit-modal");
  if (!$modal2.length) {
    $("body").append(getEntryEditModalHTML());
    $modal2 = $("#ch-entry-edit-modal");
    $modal2.find(".st-chatu8-entry-edit-modal-close").on("click", closeEntryEditModal);
    $modal2.find(".st-chatu8-modal-cancel-btn").on("click", closeEntryEditModal);
    $modal2.find(".st-chatu8-modal-save-btn").on("click", saveEntryFromModal);
    $modal2.find("#ch-modal-trigger-mode").on("change", function() {
      const $container4 = $modal2.find("#ch-modal-trigger-words-container");
      if ($(this).val() === "trigger") {
        $container4.show();
      } else {
        $container4.hide();
      }
    });
  }
  $modal2.find("#ch-modal-entry-name").val($entryElement.find(".st-chatu8-entry-name").val());
  $modal2.find("#ch-modal-entry-role").val($entryElement.attr("data-role") || "user");
  $modal2.find("#ch-modal-entry-enabled").prop("checked", !$entryElement.hasClass("disabled"));
  $modal2.find("#ch-modal-trigger-mode").val($entryElement.attr("data-trigger-mode") || "always").trigger("change");
  $modal2.find("#ch-modal-trigger-words").val($entryElement.attr("data-trigger-words") || "");
  $modal2.find("#ch-modal-and-trigger-words").val($entryElement.attr("data-and-trigger-words") || "");
  $modal2.find("#ch-modal-entry-content").val($entryElement.find(".st-chatu8-entry-content").val());
  $modal2.fadeIn(200);
}

function closeEntryEditModal() {
  const $modal2 = $("#ch-entry-edit-modal");
  $modal2.fadeOut(200);
  currentEditingEntry = null;
}

function saveEntryFromModal() {
  if (!currentEditingEntry) {
    closeEntryEditModal();
    return;
  }
  const $modal2 = $("#ch-entry-edit-modal");
  const $entry = currentEditingEntry;
  const name = $modal2.find("#ch-modal-entry-name").val();
  const role = $modal2.find("#ch-modal-entry-role").val();
  const enabled = $modal2.find("#ch-modal-entry-enabled").is(":checked");
  const triggerMode = $modal2.find("#ch-modal-trigger-mode").val();
  const triggerWords = $modal2.find("#ch-modal-trigger-words").val();
  const andTriggerWords = $modal2.find("#ch-modal-and-trigger-words").val();
  const content = $modal2.find("#ch-modal-entry-content").val();
  $entry.find(".st-chatu8-entry-name").val(name);
  $entry.attr("data-role", role);
  $entry.find(".st-chatu8-entry-role-badge").text(getRoleBadgeText(role)).attr("data-role", role);
  $entry.attr("data-trigger-mode", triggerMode);
  $entry.attr("data-trigger-words", triggerWords);
  $entry.attr("data-and-trigger-words", andTriggerWords);
  $entry.find(".st-chatu8-entry-content").val(content);
  $entry.find(".st-chatu8-entry-toggle input").prop("checked", enabled);
  if (enabled) {
    $entry.removeClass("disabled");
  } else {
    $entry.addClass("disabled");
  }
  const preview = content.length > 50 ? content.substring(0, 50) + "..." : content;
  $entry.find(".st-chatu8-entry-preview").text(preview || "(\u7A7A)");
  if (virtualScrollEnabled) {
    const entryIndex = parseInt($entry.attr("data-entry-index"), 10);
    if (!isNaN(entryIndex) && virtualEntriesData[entryIndex]) {
      virtualEntriesData[entryIndex] = {
        ...virtualEntriesData[entryIndex],
        name,
        role,
        enabled,
        triggerMode,
        triggerWords,
        andTriggerWords,
        content
      };
    }
  }
  const contextName = testContextSelect.val();
  if (contextName) {
    extension_settings[extensionName].test_context_profiles[contextName] = collectTestContextDataFromUI();
    saveSettingsDebounced();
  }
  toastr.success("\u6761\u76EE\u5DF2\u66F4\u65B0\u5E76\u4FDD\u5B58");
  closeEntryEditModal();
}

function getRoleBadgeText(role) {
  const roleLabels = {
    "system": "SYS",
    "user": "USR",
    "assistant": "AI"
  };
  return roleLabels[role] || "USR";
}

function generateEntryId() {
  return `entry_${Date.now()}_${++entryIdCounter}`;
}

function migrateOldContextData(contextData) {
  if (contextData.entries && Array.isArray(contextData.entries)) {
    return contextData;
  }
  if (contextData.history && Array.isArray(contextData.history)) {
    const entries = [];
    contextData.history.forEach((h, index) => {
      if (h.user && h.user.trim()) {
        entries.push({
          id: generateEntryId(),
          name: `\u7528\u6237\u6D88\u606F ${index + 1}`,
          role: "user",
          content: h.user,
          enabled: true,
          triggerMode: "always",
          triggerWords: "",
          andTriggerWords: ""
        });
      }
      if (h.assistant && h.assistant.trim()) {
        entries.push({
          id: generateEntryId(),
          name: `AI\u56DE\u590D ${index + 1}`,
          role: "assistant",
          content: h.assistant,
          enabled: true,
          triggerMode: "always",
          triggerWords: "",
          andTriggerWords: ""
        });
      }
    });
    if (entries.length === 0) {
      entries.push({
        id: generateEntryId(),
        name: "\u7CFB\u7EDF\u63D0\u793A",
        role: "system",
        content: "",
        enabled: true,
        triggerMode: "always",
        triggerWords: "",
        andTriggerWords: ""
      });
    }
    return { entries };
  }
  return {
    entries: [{
      id: generateEntryId(),
      name: "\u7CFB\u7EDF\u63D0\u793A",
      role: "system",
      content: "",
      enabled: true,
      triggerMode: "always",
      triggerWords: "",
      andTriggerWords: ""
    }]
  };
}

function renderPresetEntries(entriesData = []) {
  virtualEntriesData = entriesData.map((entry, index) => ({
    ...entry,
    _index: index
  }));
  presetEntriesContainer.empty();
  lastRenderedRange = { start: -1, end: -1 };
  if (entriesData.length === 0) {
    presetEntriesContainer.html(`
            <div class="st-chatu8-entries-empty">
                <i class="fa-solid fa-inbox"></i>
                <p>\u6682\u65E0\u6761\u76EE\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0</p>
            </div>
        `);
    return;
  }
  if (entriesData.length < 50) {
    virtualScrollEnabled = false;
    entriesData.forEach((entry, index) => {
      addPresetEntryDOM(entry, index);
    });
    return;
  }
  virtualScrollEnabled = true;
  const totalHeight = entriesData.length * VIRTUAL_ITEM_HEIGHT;
  presetEntriesContainer.html(`
        <div class="st-chatu8-virtual-spacer" style="height: ${totalHeight}px; position: relative;">
            <div class="st-chatu8-virtual-content" style="position: absolute; left: 0; right: 0; top: 0;"></div>
        </div>
    `);
  virtualScrollSpacer = presetEntriesContainer.find(".st-chatu8-virtual-spacer");
  virtualScrollContainer = presetEntriesContainer.find(".st-chatu8-virtual-content");
  presetEntriesContainer.off("scroll.virtual").on("scroll.virtual", onVirtualScroll);
  updateVirtualScroll();
}

function onVirtualScroll() {
  requestAnimationFrame(updateVirtualScroll);
}

function updateVirtualScroll() {
  if (!virtualScrollEnabled || !virtualScrollContainer || virtualEntriesData.length === 0) return;
  const container = presetEntriesContainer[0];
  const scrollTop = container.scrollTop;
  const viewportHeight = container.clientHeight;
  let startIndex = Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_BUFFER;
  let endIndex = Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ITEM_HEIGHT) + VIRTUAL_BUFFER;
  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(virtualEntriesData.length - 1, endIndex);
  if (startIndex === lastRenderedRange.start && endIndex === lastRenderedRange.end) {
    return;
  }
  const oldStart = lastRenderedRange.start;
  const oldEnd = lastRenderedRange.end;
  lastRenderedRange = { start: startIndex, end: endIndex };
  if (oldStart === -1 || endIndex < oldStart || startIndex > oldEnd) {
    virtualScrollContainer.empty();
    for (let i = startIndex; i <= endIndex; i++) {
      const entry = virtualEntriesData[i];
      if (entry) {
        addPresetEntryDOMToContainerAbsolute(entry, i, virtualScrollContainer);
      }
    }
    return;
  }
  if (startIndex > oldStart) {
    virtualScrollContainer.children().each(function() {
      const idx = parseInt($(this).attr("data-entry-index"), 10);
      if (idx < startIndex) {
        $(this).remove();
      }
    });
  }
  if (endIndex < oldEnd) {
    virtualScrollContainer.children().each(function() {
      const idx = parseInt($(this).attr("data-entry-index"), 10);
      if (idx > endIndex) {
        $(this).remove();
      }
    });
  }
  if (startIndex < oldStart) {
    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < oldStart && i <= endIndex; i++) {
      const entry = virtualEntriesData[i];
      if (entry) {
        const elem = createEntryElementAbsolute(entry, i);
        fragment.appendChild(elem);
      }
    }
    virtualScrollContainer.prepend(fragment);
  }
  if (endIndex > oldEnd) {
    const fragment = document.createDocumentFragment();
    for (let i = Math.max(oldEnd + 1, startIndex); i <= endIndex; i++) {
      const entry = virtualEntriesData[i];
      if (entry) {
        const elem = createEntryElementAbsolute(entry, i);
        fragment.appendChild(elem);
      }
    }
    virtualScrollContainer.append(fragment);
  }
}

function createEntryElementAbsolute(entry, index) {
  const entryId = entry.id || generateEntryId();
  const entryName = entry.name || `\u6761\u76EE ${index + 1}`;
  const entryRole = entry.role || "user";
  const entryContent = entry.content || "";
  const entryEnabled = entry.enabled !== false;
  const triggerMode = entry.triggerMode || "always";
  const triggerWords = entry.triggerWords || "";
  const andTriggerWords = entry.andTriggerWords || "";
  const disabledClass = entryEnabled ? "" : "disabled";
  const contentPreview = entryContent.length > 50 ? entryContent.substring(0, 50) + "..." : entryContent || "(\u7A7A)";
  const topPosition = index * VIRTUAL_ITEM_HEIGHT;
  const div = document.createElement("div");
  div.className = `st-chatu8-preset-entry st-chatu8-preset-entry-collapsed ${disabledClass}`;
  div.setAttribute("data-entry-id", entryId);
  div.setAttribute("data-entry-index", String(index));
  div.setAttribute("data-role", entryRole);
  div.setAttribute("data-trigger-mode", triggerMode);
  div.setAttribute("data-trigger-words", triggerWords);
  div.setAttribute("data-and-trigger-words", andTriggerWords);
  div.setAttribute("draggable", "true");
  div.style.cssText = `position: absolute; left: 0; right: 0; min-height: ${VIRTUAL_ITEM_HEIGHT}px; transform: translateY(${topPosition}px); will-change: transform; overflow: visible;`;
  div.innerHTML = `
        <div class="st-chatu8-entry-header">
            <span class="st-chatu8-entry-drag-handle" title="\u62D6\u62FD\u6392\u5E8F">
                <i class="fa-solid fa-grip-vertical"></i>
            </span>
            <span class="st-chatu8-entry-role-badge" data-role="${entryRole}">${getRoleBadgeText(entryRole)}</span>
            <input type="text" class="st-chatu8-entry-name" value="${escapeHtml(entryName)}" placeholder="\u6761\u76EE\u540D\u79F0" readonly />
            <span class="st-chatu8-entry-preview">${escapeHtml(contentPreview)}</span>
            <div class="st-chatu8-entry-actions">
                <div class="st-chatu8-entry-toggle" title="\u542F\u7528/\u7981\u7528">
                    <input type="checkbox" ${entryEnabled ? "checked" : ""} />
                    <span class="st-chatu8-slider"></span>
                </div>
                <button class="st-chatu8-icon-btn st-chatu8-entry-move-btn" title="\u70B9\u51FB\u79FB\u52A8\u6B64\u6761\u76EE">
                    <i class="fa-solid fa-arrows-up-down"></i>
                </button>
                <button class="st-chatu8-icon-btn st-chatu8-entry-edit" title="\u7F16\u8F91">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="st-chatu8-icon-btn danger st-chatu8-entry-delete" title="\u5220\u9664\u6761\u76EE">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        <textarea class="st-chatu8-entry-content" style="display:none;">${escapeHtml(entryContent)}</textarea>
    `;
  return div;
}

function addPresetEntryDOMToContainerAbsolute(entry, index, container) {
  const elem = createEntryElementAbsolute(entry, index);
  container.append(elem);
}

function addPresetEntryDOM(entry, index = -1) {
  const entryId = entry.id || generateEntryId();
  const entryName = entry.name || `\u6761\u76EE ${index + 1}`;
  const entryRole = entry.role || "user";
  const entryContent = entry.content || "";
  const entryEnabled = entry.enabled !== false;
  const triggerMode = entry.triggerMode || "always";
  const triggerWords = entry.triggerWords || "";
  const andTriggerWords = entry.andTriggerWords || "";
  const disabledClass = entryEnabled ? "" : "disabled";
  const contentPreview = entryContent.length > 50 ? entryContent.substring(0, 50) + "..." : entryContent || "(\u7A7A)";
  const entryElement = $(`
        <div class="st-chatu8-preset-entry st-chatu8-preset-entry-collapsed ${disabledClass}" 
             data-entry-id="${entryId}" 
             data-role="${entryRole}" 
             data-trigger-mode="${triggerMode}"
             data-trigger-words="${escapeHtml(triggerWords)}"
             data-and-trigger-words="${escapeHtml(andTriggerWords)}"
             draggable="true">
            <div class="st-chatu8-entry-header">
                <span class="st-chatu8-entry-drag-handle" title="\u62D6\u62FD\u6392\u5E8F">
                    <i class="fa-solid fa-grip-vertical"></i>
                </span>
                <span class="st-chatu8-entry-role-badge" data-role="${entryRole}">${getRoleBadgeText(entryRole)}</span>
                <input type="text" class="st-chatu8-entry-name" value="${escapeHtml(entryName)}" placeholder="\u6761\u76EE\u540D\u79F0" readonly />
                <span class="st-chatu8-entry-preview">${escapeHtml(contentPreview)}</span>
                <div class="st-chatu8-entry-actions">
                    <div class="st-chatu8-entry-toggle" title="\u542F\u7528/\u7981\u7528">
                        <input type="checkbox" ${entryEnabled ? "checked" : ""} />
                        <span class="st-chatu8-slider"></span>
                    </div>
                    <button class="st-chatu8-icon-btn st-chatu8-entry-move-btn" title="\u70B9\u51FB\u79FB\u52A8\u6B64\u6761\u76EE">
                        <i class="fa-solid fa-arrows-up-down"></i>
                    </button>
                    <button class="st-chatu8-icon-btn st-chatu8-entry-edit" title="\u7F16\u8F91">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="st-chatu8-icon-btn danger st-chatu8-entry-delete" title="\u5220\u9664\u6761\u76EE">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <!-- \u9690\u85CF\u7684\u6570\u636E\u5B58\u50A8 -->
            <textarea class="st-chatu8-entry-content" style="display:none;">${escapeHtml(entryContent)}</textarea>
        </div>
    `);
  presetEntriesContainer.append(entryElement);
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function addNewPresetEntry() {
  presetEntriesContainer.find(".st-chatu8-entries-empty").remove();
  const currentCount = virtualScrollEnabled ? virtualEntriesData.length : presetEntriesContainer.find(".st-chatu8-preset-entry").length;
  const newEntry = {
    id: generateEntryId(),
    name: `\u6761\u76EE ${currentCount + 1}`,
    role: "user",
    content: "",
    enabled: true,
    triggerMode: "always",
    triggerWords: "",
    andTriggerWords: ""
  };
  if (virtualScrollEnabled) {
    newEntry._index = virtualEntriesData.length;
    virtualEntriesData.push(newEntry);
    const totalHeight = virtualEntriesData.length * VIRTUAL_ITEM_HEIGHT;
    virtualScrollSpacer.css("height", totalHeight + "px");
    const container = presetEntriesContainer[0];
    container.scrollTop = container.scrollHeight;
    lastRenderedRange = { start: -1, end: -1 };
    updateVirtualScroll();
  } else {
    addPresetEntryDOM(newEntry);
    const container = presetEntriesContainer[0];
    container.scrollTop = container.scrollHeight;
  }
  toastr.success("\u5DF2\u6DFB\u52A0\u65B0\u6761\u76EE");
}

function collectTestContextDataFromUI() {
  if (virtualScrollEnabled && virtualEntriesData.length > 0) {
    return {
      entries: virtualEntriesData.map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        content: e.content,
        enabled: e.enabled,
        triggerMode: e.triggerMode,
        triggerWords: e.triggerWords,
        andTriggerWords: e.andTriggerWords
      }))
    };
  }
  const entries = [];
  presetEntriesContainer.find(".st-chatu8-preset-entry").each(function() {
    const $entry = $(this);
    const entry = {
      id: $entry.attr("data-entry-id"),
      name: $entry.find(".st-chatu8-entry-name").val() || "",
      role: $entry.attr("data-role") || "user",
      content: $entry.find(".st-chatu8-entry-content").val() || "",
      enabled: $entry.find(".st-chatu8-entry-toggle input").is(":checked"),
      triggerMode: $entry.attr("data-trigger-mode") || "always",
      triggerWords: $entry.attr("data-trigger-words") || "",
      andTriggerWords: $entry.attr("data-and-trigger-words") || ""
    };
    entries.push(entry);
  });
  return { entries };
}

function bindDragEvents() {
  presetEntriesContainer.on("dragstart", ".st-chatu8-preset-entry", function(e) {
    draggedEntry = this;
    $(this).addClass("dragging");
    e.originalEvent.dataTransfer.effectAllowed = "move";
  });
  presetEntriesContainer.on("dragend", ".st-chatu8-preset-entry", function() {
    $(this).removeClass("dragging");
    presetEntriesContainer.find(".st-chatu8-preset-entry").removeClass("drag-over");
    draggedEntry = null;
    if (dragScrollInterval) {
      clearInterval(dragScrollInterval);
      dragScrollInterval = null;
    }
  });
  presetEntriesContainer.on("dragover", ".st-chatu8-preset-entry", function(e) {
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = "move";
    if (this !== draggedEntry) {
      presetEntriesContainer.find(".st-chatu8-preset-entry").removeClass("drag-over");
      $(this).addClass("drag-over");
    }
  });
  presetEntriesContainer.on("dragover", function(e) {
    e.preventDefault();
    if (!draggedEntry) return;
    const container = presetEntriesContainer[0];
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const mouseY = e.originalEvent.clientY;
    const distanceFromTop = mouseY - containerRect.top;
    const distanceFromBottom = containerRect.bottom - mouseY;
    if (dragScrollInterval) {
      clearInterval(dragScrollInterval);
      dragScrollInterval = null;
    }
    if (distanceFromTop < SCROLL_THRESHOLD && container.scrollTop > 0) {
      dragScrollInterval = setInterval(() => {
        container.scrollTop -= SCROLL_SPEED;
        if (container.scrollTop <= 0) {
          clearInterval(dragScrollInterval);
          dragScrollInterval = null;
        }
      }, 16);
    } else if (distanceFromBottom < SCROLL_THRESHOLD && container.scrollTop < container.scrollHeight - container.clientHeight) {
      dragScrollInterval = setInterval(() => {
        container.scrollTop += SCROLL_SPEED;
        if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
          clearInterval(dragScrollInterval);
          dragScrollInterval = null;
        }
      }, 16);
    }
  });
  presetEntriesContainer.on("drop", ".st-chatu8-preset-entry", function(e) {
    e.preventDefault();
    if (dragScrollInterval) {
      clearInterval(dragScrollInterval);
      dragScrollInterval = null;
    }
    if (this !== draggedEntry && draggedEntry) {
      const $target = $(this);
      const $dragged = $(draggedEntry);
      const targetRect = this.getBoundingClientRect();
      const mouseY = e.originalEvent.clientY;
      const insertAfter = mouseY > targetRect.top + targetRect.height / 2;
      if (virtualScrollEnabled) {
        const draggedIndex = parseInt($dragged.attr("data-entry-index"), 10);
        const targetIndex = parseInt($target.attr("data-entry-index"), 10);
        if (!isNaN(draggedIndex) && !isNaN(targetIndex) && draggedIndex !== targetIndex) {
          const [movedItem] = virtualEntriesData.splice(draggedIndex, 1);
          let newIndex = targetIndex;
          if (draggedIndex < targetIndex) {
            newIndex = insertAfter ? targetIndex : targetIndex - 1;
          } else {
            newIndex = insertAfter ? targetIndex + 1 : targetIndex;
          }
          virtualEntriesData.splice(newIndex, 0, movedItem);
          virtualEntriesData.forEach((entry, i) => {
            entry._index = i;
          });
          lastRenderedRange = { start: -1, end: -1 };
          updateVirtualScroll();
        }
      } else {
        if (insertAfter) {
          $target.after($dragged);
        } else {
          $target.before($dragged);
        }
      }
    }
    presetEntriesContainer.find(".st-chatu8-preset-entry").removeClass("drag-over");
  });
  presetEntriesContainer.on("dragleave", function(e) {
    const container = presetEntriesContainer[0];
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.originalEvent.clientX;
    const mouseY = e.originalEvent.clientY;
    if (mouseX < containerRect.left || mouseX > containerRect.right || mouseY < containerRect.top || mouseY > containerRect.bottom) {
      if (dragScrollInterval) {
        clearInterval(dragScrollInterval);
        dragScrollInterval = null;
      }
    }
  });
}

function cancelMoveMode() {
  if (activeMoveSourceEntry) {
    activeMoveSourceEntry.removeClass("moving-source");
    activeMoveSourceEntry.find(".st-chatu8-entry-move-btn").removeClass("active");
    activeMoveSourceEntry = null;
    presetEntriesContainer.removeClass("move-mode");
  }
}

function bindEntryEvents() {
  $(document).on("click", function(e) {
    if (activeMoveSourceEntry && !$(e.target).closest(".st-chatu8-entry-move-btn").length) {
      cancelMoveMode();
    }
  });
  presetEntriesContainer.on("click", ".st-chatu8-entry-move-btn", function(e) {
    e.stopPropagation();
    const $entry = $(this).closest(".st-chatu8-preset-entry");
    if (!activeMoveSourceEntry) {
      activeMoveSourceEntry = $entry;
      $entry.addClass("moving-source");
      $(this).addClass("active");
      presetEntriesContainer.addClass("move-mode");
      toastr.info("\u8BF7\u70B9\u51FB\u8981\u79FB\u52A8\u5230\u7684\u76EE\u6807\u6761\u76EE\u7684\u79FB\u52A8\u6309\u94AE");
    } else {
      if (activeMoveSourceEntry[0] === $entry[0]) {
        cancelMoveMode();
        return;
      }
      const $source = activeMoveSourceEntry;
      const $target = $entry;
      if (virtualScrollEnabled) {
        const sourceIndex = parseInt($source.attr("data-entry-index"), 10);
        const targetIndex = parseInt($target.attr("data-entry-index"), 10);
        if (!isNaN(sourceIndex) && !isNaN(targetIndex)) {
          const [movedItem] = virtualEntriesData.splice(sourceIndex, 1);
          let newIndex = targetIndex;
          if (sourceIndex < targetIndex) {
            newIndex = targetIndex;
          } else {
            newIndex = targetIndex + 1;
          }
          virtualEntriesData.splice(newIndex, 0, movedItem);
          virtualEntriesData.forEach((item, i) => item._index = i);
          lastRenderedRange = { start: -1, end: -1 };
          updateVirtualScroll();
        }
      } else {
        $target.after($source);
      }
      cancelMoveMode();
    }
  });
  presetEntriesContainer.on("click", ".st-chatu8-entry-edit", function(e) {
    e.stopPropagation();
    const $entry = $(this).closest(".st-chatu8-preset-entry");
    if (virtualScrollEnabled) {
      const entryIndex = parseInt($entry.attr("data-entry-index"), 10);
      if (!isNaN(entryIndex) && virtualEntriesData[entryIndex]) {
        const data = virtualEntriesData[entryIndex];
        $entry.find(".st-chatu8-entry-content").val(data.content || "");
      }
    }
    showEntryEditModal($entry);
  });
  presetEntriesContainer.on("change", ".st-chatu8-entry-toggle input", function() {
    const $entry = $(this).closest(".st-chatu8-preset-entry");
    const enabled = $(this).is(":checked");
    if (enabled) {
      $entry.removeClass("disabled");
    } else {
      $entry.addClass("disabled");
    }
    if (virtualScrollEnabled) {
      const entryIndex = parseInt($entry.attr("data-entry-index"), 10);
      if (!isNaN(entryIndex) && virtualEntriesData[entryIndex]) {
        virtualEntriesData[entryIndex].enabled = enabled;
      }
    }
  });
  presetEntriesContainer.on("click", ".st-chatu8-entry-delete", function(e) {
    e.stopPropagation();
    const totalCount = virtualScrollEnabled ? virtualEntriesData.length : presetEntriesContainer.find(".st-chatu8-preset-entry").length;
    if (totalCount <= 1) {
      toastr.warning("\u81F3\u5C11\u9700\u8981\u4FDD\u7559\u4E00\u4E2A\u6761\u76EE");
      return;
    }
    const $entry = $(this).closest(".st-chatu8-preset-entry");
    if (virtualScrollEnabled) {
      const entryIndex = parseInt($entry.attr("data-entry-index"), 10);
      if (!isNaN(entryIndex)) {
        virtualEntriesData.splice(entryIndex, 1);
        virtualEntriesData.forEach((e2, i) => e2._index = i);
        const totalHeight = virtualEntriesData.length * VIRTUAL_ITEM_HEIGHT;
        virtualScrollSpacer.css("height", totalHeight + "px");
        lastRenderedRange = { start: -1, end: -1 };
        updateVirtualScroll();
      }
    } else {
      $entry.remove();
    }
    toastr.info("\u5DF2\u5220\u9664\u6761\u76EE");
  });
  presetEntriesContainer.on("dblclick", ".st-chatu8-preset-entry", function(e) {
    if ($(e.target).closest(".st-chatu8-entry-actions, .st-chatu8-entry-drag-handle").length) {
      return;
    }
    if (virtualScrollEnabled) {
      const entryIndex = parseInt($(this).attr("data-entry-index"), 10);
      if (!isNaN(entryIndex) && virtualEntriesData[entryIndex]) {
        const data = virtualEntriesData[entryIndex];
        $(this).find(".st-chatu8-entry-content").val(data.content || "");
      }
    }
    showEntryEditModal($(this));
  });
}

function loadLLMProfiles() {
  const profiles = extension_settings[extensionName].llm_profiles || {};
  const currentProfileName = extension_settings[extensionName].current_llm_profile;
  profileSelect.empty();
  Object.keys(profiles).forEach((name) => {
    const option = new Option(name, name, name === currentProfileName, name === currentProfileName);
    profileSelect.append(option);
  });
  if (profileSelect.val()) {
    profileSelect.trigger("change");
  }
}

function loadTestContextProfiles() {
  const profiles = extension_settings[extensionName].test_context_profiles || {};
  const currentProfileName = extension_settings[extensionName].current_test_context_profile;
  testContextSelect.empty();
  Object.keys(profiles).forEach((name) => {
    const option = new Option(name, name, name === currentProfileName, name === currentProfileName);
    testContextSelect.append(option);
  });
  if (testContextSelect.val()) {
    testContextSelect.trigger("change");
  }
}

function setChannelTypeUI(channel) {
  currentChannelType = channel === "vertex" ? "vertex" : "openai";
  if (currentChannelType === "vertex") {
    channelVertexBtn?.addClass("active").css("opacity", "1");
    channelOpenAiBtn?.removeClass("active").css("opacity", "0.7");
    openaiConfigContainer?.hide();
    vertexConfigContainer?.show();
  } else {
    channelOpenAiBtn?.addClass("active").css("opacity", "1");
    channelVertexBtn?.removeClass("active").css("opacity", "0.7");
    vertexConfigContainer?.hide();
    openaiConfigContainer?.show();
  }
}

function updateVertexCredentialsUI() {
  if (currentVertexCredentials && currentVertexCredentials.client_email) {
    vertexStatusText?.text("\u51ED\u636E\u5DF2\u5C31\u7EEA").css("color", "var(--st-chatu8-success, #28a745)");
    vertexCredInfo?.show();
    vertexProjectIdText?.text(currentVertexCredentials.project_id || "-");
    vertexClientEmailText?.text(currentVertexCredentials.client_email || "-");
    vertexClearBtn?.show();
  } else {
    vertexStatusText?.text("\u5C1A\u672A\u5BFC\u5165\u51ED\u636E\u6587\u4EF6").css("color", "var(--st-chatu8-text-secondary)");
    vertexCredInfo?.hide();
    vertexClearBtn?.hide();
  }
}

function onProfileSelectChange() {
  const profileName = $(this).val();
  if (!profileName) return;
  const profiles = extension_settings[extensionName].llm_profiles;
  const profile = profiles[profileName];
  if (profile) {
    const channel = profile.channel_type || "openai";
    setChannelTypeUI(channel);
    currentVertexCredentials = profile.vertex_credentials || null;
    updateVertexCredentialsUI();
    const vLoc = profile.vertex_location || "us-central1";
    vertexLocationInput?.val(vLoc);
    if (vertexLocationSelect && vertexLocationSelect.find(`option[value="${vLoc}"]`).length > 0) {
      vertexLocationSelect.val(vLoc);
    } else if (vertexLocationSelect) {
      vertexLocationSelect.val("custom");
    }
    const vModel = profile.vertex_model || "gemini-2.5-flash";
    vertexModelInput?.val(vModel);
    if (vertexModelSelect && vertexModelSelect.find(`option[value="${vModel}"]`).length > 0) {
      vertexModelSelect.val(vModel);
    } else if (vertexModelSelect) {
      vertexModelSelect.val("custom");
    }
    apiUrlInput.val(profile.api_url || "");
    apiKeyInput.val(profile.api_key || "");
    modelSelect.empty();
    const savedModel = profile.model || "";
    if (savedModel) {
      modelSelect.append(new Option(savedModel, savedModel, true, true));
    }
    modelInput.val(savedModel);
    const temp = profile.temperature ?? 0.7;
    temperatureSlider.val(temp);
    temperatureValue.val(temp);
    const topP = profile.top_p ?? 1;
    topPSlider.val(topP);
    topPValue.val(topP);
    const maxTokens = profile.max_tokens ?? 512;
    maxTokensSlider.val(maxTokens);
    maxTokensValue.val(maxTokens);
    const enableTemp = profile.enable_temperature ?? true;
    if (enableTemperatureCheckbox && enableTemperatureCheckbox.length > 0) {
      enableTemperatureCheckbox.prop("checked", enableTemp);
    }
    const enableTopP = profile.enable_top_p ?? true;
    if (enableTopPCheckbox && enableTopPCheckbox.length > 0) {
      enableTopPCheckbox.prop("checked", enableTopP);
    }
    const enableMaxTokens = profile.enable_max_tokens ?? true;
    if (enableMaxTokensCheckbox && enableMaxTokensCheckbox.length > 0) {
      enableMaxTokensCheckbox.prop("checked", enableMaxTokens);
    }
    updateModelParamControlsState();
    if (reasoningEffortSelect && reasoningEffortSelect.length > 0) {
      reasoningEffortSelect.val(typeof profile.reasoning_effort === "string" ? profile.reasoning_effort.trim() : "");
    }
    const stream = profile.stream ?? false;
    streamToggle.prop("checked", stream);
    const bypassProxy = profile.bypass_proxy ?? false;
    bypassProxyToggle.prop("checked", bypassProxy);
    const mergeSystemUser = profile.merge_system_user ?? false;
    mergeSystemUserToggle.prop("checked", mergeSystemUser);
    const sendImages = profile.send_images ?? false;
    sendImagesToggle.prop("checked", sendImages);
    if (enableCustomHeadersToggle && enableCustomHeadersToggle.length > 0) {
      enableCustomHeadersToggle.prop("checked", profile.enable_custom_headers ?? false);
    }
    if (customHeadersTextarea && customHeadersTextarea.length > 0) {
      customHeadersTextarea.val(profile.custom_headers || "");
    }
    if (enableCustomBodyParamsToggle && enableCustomBodyParamsToggle.length > 0) {
      enableCustomBodyParamsToggle.prop("checked", profile.enable_custom_body_params ?? false);
    }
    if (customBodyParamsTextarea && customBodyParamsTextarea.length > 0) {
      customBodyParamsTextarea.val(profile.custom_body_params || "");
    }
    extension_settings[extensionName].current_llm_profile = profileName;
    saveSettingsDebounced();
  }
}

function updateModelParamControlsState() {
  const tempEnabled = enableTemperatureCheckbox && enableTemperatureCheckbox.length > 0 ? !!enableTemperatureCheckbox.prop("checked") : true;
  if (temperatureContainer && temperatureContainer.length > 0) {
    temperatureContainer.css({
      opacity: tempEnabled ? "1" : "0.45",
      "pointer-events": tempEnabled ? "auto" : "none"
    });
    if (temperatureSlider) temperatureSlider.prop("disabled", !tempEnabled);
    if (temperatureValue) temperatureValue.prop("disabled", !tempEnabled);
  }
  const topPEnabled = enableTopPCheckbox && enableTopPCheckbox.length > 0 ? !!enableTopPCheckbox.prop("checked") : true;
  if (topPContainer && topPContainer.length > 0) {
    topPContainer.css({
      opacity: topPEnabled ? "1" : "0.45",
      "pointer-events": topPEnabled ? "auto" : "none"
    });
    if (topPSlider) topPSlider.prop("disabled", !topPEnabled);
    if (topPValue) topPValue.prop("disabled", !topPEnabled);
  }
  const maxTokensEnabled = enableMaxTokensCheckbox && enableMaxTokensCheckbox.length > 0 ? !!enableMaxTokensCheckbox.prop("checked") : true;
  if (maxTokensContainer && maxTokensContainer.length > 0) {
    maxTokensContainer.css({
      opacity: maxTokensEnabled ? "1" : "0.45",
      "pointer-events": maxTokensEnabled ? "auto" : "none"
    });
    if (maxTokensSlider) maxTokensSlider.prop("disabled", !maxTokensEnabled);
    if (maxTokensValue) maxTokensValue.prop("disabled", !maxTokensEnabled);
  }
}

function onTestContextSelectChange() {
  const contextName = $(this).val();
  if (!contextName) return;
  const contexts = extension_settings[extensionName].test_context_profiles;
  let context = contexts[contextName];
  if (context) {
    const migratedContext = migrateOldContextData(context);
    if (migratedContext !== context) {
      contexts[contextName] = migratedContext;
      saveSettingsDebounced();
      context = migratedContext;
    }
    renderPresetEntries(context.entries || []);
    extension_settings[extensionName].current_test_context_profile = contextName;
    saveSettingsDebounced();
  }
}

function updateToolCallUIVisibility() {
  const isToolEnabled = customToolEnabledCheckbox?.prop("checked") ?? true;
  if (customToolDetailsArea) {
    if (isToolEnabled) customToolDetailsArea.slideDown(200);
    else customToolDetailsArea.slideUp(200);
  }
  const nameMode = toolNameModeSelect?.val() || "dynamic";
  if (toolFixedNameRow) {
    toolFixedNameRow.toggle(nameMode === "fixed");
  }
  const isTailEnabled2 = customTailEnabledCheckbox?.prop("checked") ?? true;
  if (customTailDetailsArea) {
    if (isTailEnabled2) customTailDetailsArea.slideDown(200);
    else customTailDetailsArea.slideUp(200);
  }
}

function renderToolFields(fields = []) {
  if (!toolFieldsContainer) return;
  toolFieldsContainer.empty();
  const items = Array.isArray(fields) && fields.length > 0 ? fields : defaultToolCallConfig.fields;
  items.forEach((field, idx) => {
    const row = $(`
            <div class="st-chatu8-tool-field-row" data-idx="${idx}" style="display: grid; grid-template-columns: 1fr 1.2fr 1fr 36px; gap: 6px; align-items: center;">
                <input type="text" class="st-chatu8-text-input ch-tool-field-name" value="${escapeHtml(field.name || "")}" placeholder="\u5B57\u6BB5\u540D (Key)" />
                <input type="text" class="st-chatu8-text-input ch-tool-field-desc" value="${escapeHtml(field.description || "")}" placeholder="\u5B57\u6BB5\u63CF\u8FF0 (Description)" />
                <input type="text" class="st-chatu8-text-input ch-tool-field-wraptag" value="${escapeHtml(field.wrapTag || "")}" placeholder="\u5982: thinking (\u7A7A\u5219\u76F4\u63A5\u8F93\u51FA)" />
                <button type="button" class="st-chatu8-icon-btn danger ch-delete-tool-field-btn" title="\u5220\u9664\u5B57\u6BB5">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `);
    toolFieldsContainer.append(row);
  });
}

function collectToolFieldsFromDOM() {
  if (!toolFieldsContainer) return [];
  const result = [];
  toolFieldsContainer.find(".st-chatu8-tool-field-row").each(function() {
    const name = $(this).find(".ch-tool-field-name").val() || "";
    const description = $(this).find(".ch-tool-field-desc").val() || "";
    const wrapTag = $(this).find(".ch-tool-field-wraptag").val() || "";
    if (name.trim()) {
      result.push({
        name: name.trim(),
        description: description.trim(),
        required: true,
        wrapTag: wrapTag.trim()
      });
    }
  });
  return result.length > 0 ? result : defaultToolCallConfig.fields;
}

function renderTailMessages(messages = []) {
  if (!tailMessagesContainer) return;
  tailMessagesContainer.empty();
  const items = Array.isArray(messages) && messages.length > 0 ? messages : defaultTailMessagesConfig.messages;
  items.forEach((msg, idx) => {
    const row = $(`
            <div class="st-chatu8-tail-msg-row" data-idx="${idx}" style="display: grid; grid-template-columns: 100px 1fr 36px; gap: 6px; align-items: flex-start;">
                <select class="st-chatu8-select ch-tail-msg-role">
                    <option value="user" ${msg.role === "user" ? "selected" : ""}>user</option>
                    <option value="system" ${msg.role === "system" ? "selected" : ""}>system</option>
                    <option value="assistant" ${msg.role === "assistant" ? "selected" : ""}>assistant</option>
                </select>
                <textarea class="st-chatu8-textarea ch-tail-msg-content" rows="2" placeholder="\u6D88\u606F\u5185\u5BB9 (\u652F\u6301 %TOOL_NAME%)">${escapeHtml(msg.content || "")}</textarea>
                <button type="button" class="st-chatu8-icon-btn danger ch-delete-tail-msg-btn" title="\u5220\u9664\u6B64\u6D88\u606F">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `);
    tailMessagesContainer.append(row);
  });
}

function collectTailMessagesFromDOM() {
  if (!tailMessagesContainer) return [];
  const result = [];
  tailMessagesContainer.find(".st-chatu8-tail-msg-row").each(function() {
    const role = $(this).find(".ch-tail-msg-role").val() || "user";
    const content = $(this).find(".ch-tail-msg-content").val() || "";
    if (content.trim()) {
      result.push({ role, content });
    }
  });
  return result;
}

function exportToolConfig() {
  const isEnabled = customToolEnabledCheckbox?.prop("checked") ?? true;
  const nameMode = toolNameModeSelect?.val() || "dynamic";
  const fixedName = toolFixedNameInput?.val() || "";
  const desc = toolDescTextarea?.val() || defaultToolCallConfig.desc;
  const fields = collectToolFieldsFromDOM();
  const exportData = {
    type: "antigravity_tool_config",
    version: "1.0",
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    data: {
      enabled: isEnabled,
      nameMode,
      fixedName,
      desc,
      fields
    }
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tool_config_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  toastr.success("Tool \u914D\u7F6E\u5DF2\u6210\u529F\u5BFC\u51FA");
}

function importToolConfig(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const data = parsed.data || parsed;
      if (data.enabled !== void 0 && customToolEnabledCheckbox) {
        customToolEnabledCheckbox.prop("checked", !!data.enabled);
      }
      if (data.nameMode && toolNameModeSelect) {
        toolNameModeSelect.val(data.nameMode);
      }
      if (data.fixedName !== void 0 && toolFixedNameInput) {
        toolFixedNameInput.val(data.fixedName);
      }
      if (data.desc !== void 0 && toolDescTextarea) {
        toolDescTextarea.val(data.desc);
      }
      if (Array.isArray(data.fields)) {
        renderToolFields(data.fields);
        toastr.success(`\u6210\u529F\u5BFC\u5165 Tool \u914D\u7F6E (${data.fields.length} \u4E2A\u53C2\u6570\u5B57\u6BB5)`);
      } else {
        toastr.success("\u6210\u529F\u5BFC\u5165 Tool \u914D\u7F6E");
      }
      updateToolCallUIVisibility();
    } catch (err) {
      toastr.error("\u5BFC\u5165\u5931\u8D25\uFF1AJSON \u6587\u4EF6\u683C\u5F0F\u65E0\u6548");
    }
  };
  reader.readAsText(file);
}

function exportTailConfig() {
  const isEnabled = customTailEnabledCheckbox?.prop("checked") ?? true;
  const messages = collectTailMessagesFromDOM();
  const exportData = {
    type: "antigravity_tail_config",
    version: "1.0",
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    data: {
      enabled: isEnabled,
      messages
    }
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tail_messages_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  toastr.success("Tail \u914D\u7F6E\u5DF2\u6210\u529F\u5BFC\u51FA");
}

function importTailConfig(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const data = parsed.data || parsed;
      if (data.enabled !== void 0 && customTailEnabledCheckbox) {
        customTailEnabledCheckbox.prop("checked", !!data.enabled);
      }
      if (Array.isArray(data.messages)) {
        renderTailMessages(data.messages);
        toastr.success(`\u6210\u529F\u5BFC\u5165 ${data.messages.length} \u6761 Tail \u6D88\u606F`);
      } else {
        toastr.warning("\u5BFC\u5165\u7684\u6587\u4EF6\u4E2D\u672A\u53D1\u73B0\u6709\u6548\u7684 messages \u5217\u8868");
      }
      updateToolCallUIVisibility();
    } catch (err) {
      toastr.error("\u5BFC\u5165\u5931\u8D25\uFF1AJSON \u6587\u4EF6\u683C\u5F0F\u65E0\u6548");
    }
  };
  reader.readAsText(file);
}

function collectProfileDataFromUI() {
  const rawApiUrl = apiUrlInput.val();
  const rawApiKey = apiKeyInput.val();
  const rawModel = modelInput.val() || modelSelect.val();
  return {
    api_url: typeof rawApiUrl === "string" ? rawApiUrl.trim() : rawApiUrl || "",
    api_key: typeof rawApiKey === "string" ? rawApiKey.trim() : rawApiKey || "",
    model: typeof rawModel === "string" ? rawModel.trim() : rawModel || "",
    temperature: parseFloat(temperatureSlider.val()),
    enable_temperature: enableTemperatureCheckbox && enableTemperatureCheckbox.length > 0 ? !!enableTemperatureCheckbox.prop("checked") : true,
    top_p: parseFloat(topPSlider.val()),
    enable_top_p: enableTopPCheckbox && enableTopPCheckbox.length > 0 ? !!enableTopPCheckbox.prop("checked") : true,
    max_tokens: parseInt(maxTokensSlider.val(), 10),
    enable_max_tokens: enableMaxTokensCheckbox && enableMaxTokensCheckbox.length > 0 ? !!enableMaxTokensCheckbox.prop("checked") : true,
    reasoning_effort: (reasoningEffortSelect && reasoningEffortSelect.length > 0 ? reasoningEffortSelect.val() || "" : "").trim(),
    stream: streamToggle.prop("checked"),
    bypass_proxy: bypassProxyToggle.prop("checked"),
    merge_system_user: mergeSystemUserToggle.prop("checked"),
    send_images: sendImagesToggle.prop("checked"),
    custom_headers: customHeadersTextarea && customHeadersTextarea.length > 0 ? customHeadersTextarea.val() : "",
    enable_custom_headers: enableCustomHeadersToggle && enableCustomHeadersToggle.length > 0 ? !!enableCustomHeadersToggle.prop("checked") : false,
    custom_body_params: customBodyParamsTextarea && customBodyParamsTextarea.length > 0 ? customBodyParamsTextarea.val() : "",
    enable_custom_body_params: enableCustomBodyParamsToggle && enableCustomBodyParamsToggle.length > 0 ? !!enableCustomBodyParamsToggle.prop("checked") : false,
    // Vertex 专属字段
    channel_type: currentChannelType || "openai",
    vertex_credentials: currentVertexCredentials || null,
    vertex_location: (vertexLocationInput?.val() || vertexLocationSelect?.val() || "us-central1").trim(),
    vertex_model: (vertexModelInput?.val() || vertexModelSelect?.val() || "gemini-2.5-flash").trim()
  };
}

function collectGlobalToolCallConfigFromUI() {
  return {
    enabled: customToolEnabledCheckbox && customToolEnabledCheckbox.length > 0 ? !!customToolEnabledCheckbox.prop("checked") : false,
    nameMode: toolNameModeSelect ? toolNameModeSelect.val() : "dynamic",
    fixedName: toolFixedNameInput ? toolFixedNameInput.val() : "",
    prefix: "agw_emit_",
    desc: toolDescTextarea ? toolDescTextarea.val() : defaultToolCallConfig.desc,
    fields: collectToolFieldsFromDOM()
  };
}

function collectGlobalTailMessagesConfigFromUI() {
  return {
    enabled: customTailEnabledCheckbox && customTailEnabledCheckbox.length > 0 ? !!customTailEnabledCheckbox.prop("checked") : false,
    messages: collectTailMessagesFromDOM()
  };
}

function loadGlobalToolAndTailSettingsToUI() {
  const globalTool = extension_settings[extensionName]?.tool_call_config || defaultToolCallConfig;
  const globalTail = extension_settings[extensionName]?.tail_messages_config || defaultTailMessagesConfig;
  if (customToolEnabledCheckbox && customToolEnabledCheckbox.length > 0) {
    customToolEnabledCheckbox.prop("checked", parseBoolean(globalTool.enabled, true));
  }
  if (toolNameModeSelect && toolNameModeSelect.length > 0) {
    toolNameModeSelect.val(globalTool.nameMode || "dynamic");
  }
  if (toolFixedNameInput && toolFixedNameInput.length > 0) {
    toolFixedNameInput.val(globalTool.fixedName || "");
  }
  if (toolDescTextarea && toolDescTextarea.length > 0) {
    toolDescTextarea.val(globalTool.desc || defaultToolCallConfig.desc);
  }
  renderToolFields(globalTool.fields || []);
  if (customTailEnabledCheckbox && customTailEnabledCheckbox.length > 0) {
    customTailEnabledCheckbox.prop("checked", parseBoolean(globalTail.enabled, true));
  }
  renderTailMessages(globalTail.messages || []);
  updateToolCallUIVisibility();
}

function onSaveProfileClick() {
  const profileName = profileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u3002");
    return;
  }
  extension_settings[extensionName].llm_profiles[profileName] = collectProfileDataFromUI();
  saveSettingsDebounced();
  toastr.success(`\u914D\u7F6E "${profileName}" \u5DF2\u4FDD\u5B58\u3002`);
}

function onSaveTestContextClick() {
  const contextName = testContextSelect.val();
  if (!contextName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u914D\u7F6E\u3002");
    return;
  }
  extension_settings[extensionName].test_context_profiles[contextName] = collectTestContextDataFromUI();
  saveSettingsDebounced();
  toastr.success(`\u6D4B\u8BD5\u4E0A\u4E0B\u6587 "${contextName}" \u5DF2\u4FDD\u5B58\u3002`);
}

function onSaveAsTestContextClick() {
  const currentContextName = testContextSelect.val();
  if (!currentContextName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u914D\u7F6E\u3002");
    return;
  }
  const newName = prompt("\u8BF7\u8F93\u5165\u53E6\u5B58\u4E3A\u7684\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u540D\u79F0\uFF1A", currentContextName + " (\u526F\u672C)");
  if (!newName || newName.trim() === "") {
    toastr.warning("\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
    return;
  }
  const contexts = extension_settings[extensionName].test_context_profiles;
  if (contexts[newName]) {
    toastr.error(`\u6D4B\u8BD5\u4E0A\u4E0B\u6587 "${newName}" \u5DF2\u5B58\u5728\u3002\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u6216\u5148\u5220\u9664\u3002`);
    return;
  }
  contexts[newName] = collectTestContextDataFromUI();
  extension_settings[extensionName].current_test_context_profile = newName;
  saveSettingsDebounced();
  loadTestContextProfiles();
  populateRequestTypeSelects();
  toastr.success(`\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u5DF2\u53E6\u5B58\u4E3A "${newName}"\u3002`);
}

function onNewProfileClick() {
  const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u7684\u914D\u7F6E\u540D\u79F0\uFF1A");
  if (!newName || newName.trim() === "") {
    toastr.warning("\u914D\u7F6E\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
    return;
  }
  const profiles = extension_settings[extensionName].llm_profiles;
  if (profiles[newName]) {
    toastr.error(`\u914D\u7F6E "${newName}" \u5DF2\u5B58\u5728\u3002`);
    return;
  }
  profiles[newName] = {
    api_url: "",
    api_key: "",
    model: "",
    temperature: 1,
    enable_temperature: true,
    top_p: 1,
    enable_top_p: true,
    max_tokens: 3e4,
    enable_max_tokens: true,
    reasoning_effort: "",
    stream: false,
    bypass_proxy: false,
    merge_system_user: false,
    send_images: false,
    custom_headers: "",
    enable_custom_headers: false,
    custom_body_params: "",
    enable_custom_body_params: false,
    channel_type: "openai",
    vertex_credentials: null,
    vertex_location: "us-central1",
    vertex_model: "gemini-2.5-flash"
  };
  extension_settings[extensionName].current_llm_profile = newName;
  saveSettingsDebounced();
  loadLLMProfiles();
  populateRequestTypeSelects();
  toastr.success(`\u914D\u7F6E "${newName}" \u5DF2\u521B\u5EFA\u5E76\u9009\u4E2D\u3002`);
}

function onNewTestContextClick() {
  const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u7684\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u540D\u79F0\uFF1A");
  if (!newName || newName.trim() === "") {
    toastr.warning("\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
    return;
  }
  const contexts = extension_settings[extensionName].test_context_profiles;
  if (contexts[newName]) {
    toastr.error(`\u6D4B\u8BD5\u4E0A\u4E0B\u6587 "${newName}" \u5DF2\u5B58\u5728\u3002`);
    return;
  }
  contexts[newName] = {
    history: [
      { user: "", assistant: "" }
    ]
  };
  extension_settings[extensionName].current_test_context_profile = newName;
  saveSettingsDebounced();
  loadTestContextProfiles();
  populateRequestTypeSelects();
  toastr.success(`\u6D4B\u8BD5\u4E0A\u4E0B\u6587 "${newName}" \u5DF2\u521B\u5EFA\u5E76\u9009\u4E2D\u3002`);
}

function onDeleteProfileClick() {
  const profileName = profileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u3002");
    return;
  }
  if (Object.keys(extension_settings[extensionName].llm_profiles).length <= 1) {
    toastr.error("\u4E0D\u80FD\u5220\u9664\u6700\u540E\u4E00\u4E2A\u914D\u7F6E\u3002");
    return;
  }
  if (confirm(`\u4F60\u786E\u5B9A\u8981\u5220\u9664\u914D\u7F6E "${profileName}" \u5417\uFF1F`)) {
    delete extension_settings[extensionName].llm_profiles[profileName];
    extension_settings[extensionName].current_llm_profile = Object.keys(extension_settings[extensionName].llm_profiles)[0];
    saveSettingsDebounced();
    loadLLMProfiles();
    populateRequestTypeSelects();
    toastr.success(`\u914D\u7F6E "${profileName}" \u5DF2\u5220\u9664\u3002`);
  }
}

function onRenameLLMProfileClick() {
  const oldName = profileSelect.val();
  if (!oldName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684 LLM \u914D\u7F6E\u3002");
    return;
  }
  const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u7684 LLM \u914D\u7F6E\u540D\u79F0\uFF1A", oldName);
  if (!newName || newName.trim() === "") {
    toastr.warning("LLM \u914D\u7F6E\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
    return;
  }
  if (newName === oldName) {
    return;
  }
  const profiles = extension_settings[extensionName].llm_profiles;
  if (profiles[newName]) {
    toastr.error(`LLM \u914D\u7F6E "${newName}" \u5DF2\u5B58\u5728\u3002`);
    return;
  }
  profiles[newName] = profiles[oldName];
  delete profiles[oldName];
  extension_settings[extensionName].current_llm_profile = newName;
  const requestTypeConfigs = extension_settings[extensionName].llm_request_type_configs || {};
  for (const requestType in requestTypeConfigs) {
    if (requestTypeConfigs[requestType].api_profile === oldName) {
      requestTypeConfigs[requestType].api_profile = newName;
    }
  }
  saveSettingsDebounced();
  loadLLMProfiles();
  populateRequestTypeSelects();
  toastr.success(`LLM \u914D\u7F6E\u5DF2\u4ECE "${oldName}" \u91CD\u547D\u540D\u4E3A "${newName}"\u3002`);
}

function onDeleteTestContextClick() {
  const contextName = testContextSelect.val();
  if (!contextName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u914D\u7F6E\u3002");
    return;
  }
  if (Object.keys(extension_settings[extensionName].test_context_profiles).length <= 1) {
    toastr.error("\u4E0D\u80FD\u5220\u9664\u6700\u540E\u4E00\u4E2A\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u914D\u7F6E\u3002");
    return;
  }
  if (confirm(`\u4F60\u786E\u5B9A\u8981\u5220\u9664\u6D4B\u8BD5\u4E0A\u4E0B\u6587 "${contextName}" \u5417\uFF1F`)) {
    delete extension_settings[extensionName].test_context_profiles[contextName];
    extension_settings[extensionName].current_test_context_profile = Object.keys(extension_settings[extensionName].test_context_profiles)[0];
    saveSettingsDebounced();
    loadTestContextProfiles();
    populateRequestTypeSelects();
    toastr.success(`\u6D4B\u8BD5\u4E0A\u4E0B\u6587 "${contextName}" \u5DF2\u5220\u9664\u3002`);
  }
}

function onRenameTestContextClick() {
  const oldName = testContextSelect.val();
  if (!oldName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u914D\u7F6E\u3002");
    return;
  }
  const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u7684\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u540D\u79F0\uFF1A", oldName);
  if (!newName || newName.trim() === "") {
    toastr.warning("\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
    return;
  }
  if (newName === oldName) {
    return;
  }
  const contexts = extension_settings[extensionName].test_context_profiles;
  if (contexts[newName]) {
    toastr.error(`\u6D4B\u8BD5\u4E0A\u4E0B\u6587 "${newName}" \u5DF2\u5B58\u5728\u3002`);
    return;
  }
  contexts[newName] = contexts[oldName];
  delete contexts[oldName];
  extension_settings[extensionName].current_test_context_profile = newName;
  const requestTypeConfigs = extension_settings[extensionName].llm_request_type_configs || {};
  for (const requestType in requestTypeConfigs) {
    if (requestTypeConfigs[requestType].context_profile === oldName) {
      requestTypeConfigs[requestType].context_profile = newName;
    }
  }
  saveSettingsDebounced();
  loadTestContextProfiles();
  populateRequestTypeSelects();
  toastr.success(`\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u5DF2\u4ECE "${oldName}" \u91CD\u547D\u540D\u4E3A "${newName}"\u3002`);
}

function onExportAllTestContextClick() {
  const contexts = extension_settings[extensionName].test_context_profiles || {};
  const contextCount = Object.keys(contexts).length;
  if (contextCount === 0) {
    toastr.warning("\u6CA1\u6709\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const blob = new Blob([JSON.stringify(contexts, null, 4)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st_chatu8_all_test_contexts.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  toastr.success(`\u6210\u529F\u5BFC\u51FA ${contextCount} \u4E2A\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u914D\u7F6E\u3002`);
}

function onExportProfileClick() {
  const profileName = profileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const profile = extension_settings[extensionName].llm_profiles[profileName];
  const exportData = { [profileName]: profile };
  const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st_chatu8_llm_profile_${profileName}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function onExportTestContextClick() {
  const contextName = testContextSelect.val();
  if (!contextName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const context = extension_settings[extensionName].test_context_profiles[contextName];
  const exportData = { [contextName]: context };
  const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st_chatu8_test_context_${contextName}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function onImportProfileClick() {
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
              extension_settings[extensionName].llm_profiles[name] = {
                ...extension_settings[extensionName].llm_profiles[name] || {},
                ...importedProfiles[name]
              };
              importedCount++;
            }
          }
          saveSettingsDebounced();
          loadLLMProfiles();
          populateRequestTypeSelects();
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

function convertWorldBooksToEntries(worldBooks) {
  const entries = [];
  worldBooks.forEach((book, index) => {
    const isAlwaysOn = book.triggerMode === "blue";
    const triggerWords = Array.isArray(book.keywords) ? book.keywords.join(", ") : book.keywords || "";
    entries.push({
      id: book.id || generateEntryId(),
      name: book.name || `\u6761\u76EE ${index + 1}`,
      role: book.role || "system",
      content: book.content || "",
      enabled: book.enabled !== false && book.active !== false,
      triggerMode: isAlwaysOn ? "always" : "trigger",
      triggerWords
    });
  });
  return { entries };
}

function detectImportFormat(data) {
  if (Array.isArray(data) && data.length > 0 && data[0].worldBooks) {
    return "worldBooksArrayOuter";
  }
  if (data.worldBooks && Array.isArray(data.worldBooks)) {
    return "worldBooks";
  }
  if (!Array.isArray(data)) {
    const keys = Object.keys(data);
    if (keys.length > 0) {
      const firstValue = data[keys[0]];
      if (firstValue && (firstValue.entries || firstValue.history)) {
        return "standard";
      }
    }
  }
  return "unknown";
}

function onImportTestContextClick() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          let importedCount = 0;
          let totalEntries = 0;
          const format = detectImportFormat(importedData);
          if (format === "worldBooksArrayOuter") {
            importedData.forEach((item) => {
              const profileName = item.name || `\u5BFC\u5165\u914D\u7F6E_${importedCount + 1}`;
              const convertedData = convertWorldBooksToEntries(item.worldBooks);
              extension_settings[extensionName].test_context_profiles[profileName] = convertedData;
              importedCount++;
              totalEntries += item.worldBooks.length;
            });
            toastr.success(`\u6210\u529F\u5BFC\u5165 ${importedCount} \u4E2A\u914D\u7F6E\uFF0C\u5171 ${totalEntries} \u4E2A\u6761\u76EE\u3002`);
          } else if (format === "worldBooks") {
            const profileName = importedData.name || file.name.replace(".json", "");
            const convertedData = convertWorldBooksToEntries(importedData.worldBooks);
            extension_settings[extensionName].test_context_profiles[profileName] = convertedData;
            importedCount = 1;
            toastr.success(`\u6210\u529F\u5BFC\u5165\u914D\u7F6E "${profileName}"\uFF0C\u5171 ${importedData.worldBooks.length} \u4E2A\u6761\u76EE\u3002`);
          } else {
            for (const name in importedData) {
              if (Object.prototype.hasOwnProperty.call(importedData, name)) {
                extension_settings[extensionName].test_context_profiles[name] = {
                  ...extension_settings[extensionName].test_context_profiles[name] || {},
                  ...importedData[name]
                };
                importedCount++;
              }
            }
            toastr.success(`\u6210\u529F\u5BFC\u5165 ${importedCount} \u4E2A\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u3002`);
          }
          saveSettingsDebounced();
          loadTestContextProfiles();
          populateRequestTypeSelects();
        } catch (error) {
          console.error("\u5BFC\u5165\u6D4B\u8BD5\u4E0A\u4E0B\u6587\u5931\u8D25:", error);
          toastr.error("\u5BFC\u5165\u5931\u8D25\uFF0C\u6587\u4EF6\u683C\u5F0F\u65E0\u6548\u3002");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

async function onQueryCapsClick() {
  const baseUrl = (apiUrlInput.val() || "").trim();
  if (!baseUrl) {
    toastr.warning("\u8BF7\u5148\u586B\u5199 API Base URL\u3002");
    return;
  }
  const apiKey = (apiKeyInput.val() || "").trim();
  const root = baseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  const originalButtonText = queryCapsButton.html();
  queryCapsButton.html('<i class="fa-solid fa-spinner fa-spin"></i> \u67E5\u8BE2\u4E2D...');
  queryCapsButton.prop("disabled", true);
  const lines = [];
  lines.push(`\u601D\u8003\u7B49\u7EA7\u6863\u4F4D: off / low / medium / high / xhigh / max\uFF08Strata \u670D\u52A1\u7AEF\u672A\u63D0\u4F9B\u6863\u4F4D\u67E5\u8BE2\u63A5\u53E3\uFF0C\u4E0A\u8FF0\u4E3A OpenAI \u517C\u5BB9\u4E8B\u5B9E\u6807\u51C6\uFF1B\u672A\u77E5\u6863\u4F4D\u4F1A\u88AB\u62D2\u7EDD\u5E76\u8FD4\u56DE\u5408\u6CD5\u6863\u4F4D\u6E05\u5355\uFF09`);
  try {
    const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
    const [modelsRes, propsRes] = await Promise.all([
      fetch(root + "/v1/models", { headers }),
      fetch(root + "/props", { headers })
    ]);
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json();
      const models = Array.isArray(modelsData?.data) ? modelsData.data : Array.isArray(modelsData) ? modelsData : [];
      const ids = models.map((m) => m?.id || m?.name).filter(Boolean);
      lines.push(`\u6A21\u578B (${ids.length}): ${ids.join(", ") || "\u65E0"}`);
      const first = models[0];
      if (first?.meta?.n_ctx) lines.push(`\u4E0A\u4E0B\u6587\u957F\u5EA6: ${first.meta.n_ctx}`);
      if (first?.architecture?.input_modalities) lines.push(`\u8F93\u5165\u6A21\u6001: ${first.architecture.input_modalities.join(", ")}`);
    } else {
      lines.push(`/v1/models \u67E5\u8BE2\u5931\u8D25: HTTP ${modelsRes.status}`);
    }
    if (propsRes.ok) {
      const props = await propsRes.json();
      if (props.default_generation_settings?.n_ctx) lines.push(`\u4E0A\u4E0B\u6587\u957F\u5EA6: ${props.default_generation_settings.n_ctx}`);
      if (props.model_alias) lines.push(`\u6A21\u578B\u522B\u540D: ${props.model_alias}`);
      if (props.build_info) lines.push(`\u670D\u52A1\u7AEF: ${typeof props.build_info === "string" ? props.build_info : JSON.stringify(props.build_info)}`);
      const caps = props.chat_template_caps;
      if (caps) {
        const capNames = Object.entries(caps).filter(([, v]) => v === true).map(([k]) => k).join(", ");
        lines.push(`\u6A21\u677F\u80FD\u529B: ${capNames || "\u65E0"}`);
      }
    } else {
      lines.push(`/props \u67E5\u8BE2\u5931\u8D25: HTTP ${propsRes.status}\uFF08\u975E Strata \u7C7B\u670D\u52A1\u7AEF\u53EF\u80FD\u4E0D\u652F\u6301\uFF0C\u5C5E\u6B63\u5E38\u73B0\u8C61\uFF09`);
    }
    toastr.success("\u670D\u52A1\u7AEF\u80FD\u529B\u67E5\u8BE2\u5B8C\u6210\u3002");
  } catch (error) {
    lines.unshift(`\u67E5\u8BE2\u5931\u8D25: ${error.message}`);
    toastr.error(`\u67E5\u8BE2\u5931\u8D25: ${error.message}`);
  } finally {
    if (capsResultSpan && capsResultSpan.length > 0) {
      capsResultSpan.text(lines.join("\n")).show();
    }
    queryCapsButton.html(originalButtonText);
    queryCapsButton.prop("disabled", false);
  }
}

async function onFetchModelsClick() {
  if (currentChannelType === "vertex") {
    const defaultVertexModels = [
      "gemini-4-argon",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash"
    ];
    if (vertexModelSelect) {
      vertexModelSelect.empty();
      defaultVertexModels.forEach((m) => {
        vertexModelSelect.append(new Option(m, m));
      });
      vertexModelSelect.append(new Option("\u81EA\u5B9A\u4E49\u6A21\u578B\u540D\u79F0...", "custom"));
      const currentModel = vertexModelInput?.val() || defaultVertexModels[0];
      if (defaultVertexModels.includes(currentModel)) {
        vertexModelSelect.val(currentModel);
      } else {
        vertexModelSelect.val("custom");
      }
    }
    toastr.success(`\u5DF2\u5237\u65B0 Vertex \u5B98\u65B9\u63A8\u8350\u6A21\u578B\u5217\u8868 (${defaultVertexModels.length} \u4E2A)`);
    return;
  }
  const baseUrl = (apiUrlInput.val() || "").trim();
  const apiKey = (apiKeyInput.val() || "").trim();
  if (!baseUrl || !apiKey) {
    toastr.warning("\u8BF7\u8F93\u5165 API Base URL \u548C API Key\u3002");
    return;
  }
  const isBypassProxy = bypassProxyToggle && bypassProxyToggle.length > 0 ? !!bypassProxyToggle.prop("checked") : false;
  const proxyUrl = "/api/backends/chat-completions/status";
  const customApiUrl = baseUrl.replace(/\/$/, "");
  const originalButtonText = fetchModelsButton.html();
  fetchModelsButton.html('<i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u83B7\u53D6...');
  fetchModelsButton.prop("disabled", true);
  const headersText = customHeadersTextarea && customHeadersTextarea.length > 0 ? customHeadersTextarea.val() : "";
  const isHeadersEnabled = enableCustomHeadersToggle && enableCustomHeadersToggle.length > 0 ? !!enableCustomHeadersToggle.prop("checked") : false;
  const customHeadersMap = isHeadersEnabled ? parseCustomHeaders(headersText) : {};
  try {
    let response;
    if (isBypassProxy) {
      const directModelsUrl = customApiUrl + "/models";
      response = await fetch(directModelsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          ...customHeadersMap
        }
      });
    } else {
      response = await fetch(proxyUrl, {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify({
          chat_completion_source: "custom",
          custom_url: customApiUrl,
          custom_include_headers: buildProxyIncludeHeaders(apiKey, customHeadersMap)
        })
      });
    }
    if (!response.ok) {
      let errorBodyText = "";
      try {
        errorBodyText = await response.text();
      } catch (_readErr) {
      }
      const formattedError = extractApiErrorMessage(response, errorBodyText);
      throw new Error(`\u83B7\u53D6\u6A21\u578B\u5217\u8868\u5931\u8D25: ${formattedError}`);
    }
    const data = await response.json();
    if (data.error || !data.data && !data.models && (data.detail || data.message || data.msg)) {
      const formattedError = extractApiErrorMessage(response, data);
      throw new Error(`\u83B7\u53D6\u6A21\u578B\u5217\u8868\u5931\u8D25: ${formattedError}`);
    }
    let rawList = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (Array.isArray(data.data)) {
      rawList = data.data;
    } else if (Array.isArray(data.models)) {
      rawList = data.models;
    }
    const models = rawList.map((item) => {
      if (typeof item === "string") return { id: item };
      if (item && item.id) return item;
      if (item && item.name) return { id: item.name };
      return null;
    }).filter(Boolean);
    models.sort((a, b) => a.id.localeCompare(b.id));
    const currentlySelected = modelSelect.val();
    modelSelect.empty();
    models.forEach((model) => {
      modelSelect.append(new Option(model.id, model.id));
    });
    if (currentlySelected && models.some((m) => m.id === currentlySelected)) {
      modelSelect.val(currentlySelected);
      modelInput.val(currentlySelected);
    } else if (models.length > 0) {
    }
    toastr.success(`\u6210\u529F\u83B7\u53D6 ${models.length} \u4E2A\u6A21\u578B\u3002`);
  } catch (error) {
    toastr.error(`\u83B7\u53D6\u6A21\u578B\u5931\u8D25: ${error.message}`);
  } finally {
    fetchModelsButton.html(originalButtonText);
    fetchModelsButton.prop("disabled", false);
  }
}

async function onTestLLMClick() {
  let currentController = getLLMRequestController();
  if (currentController) {
    currentController.abort();
    toastr.info("LLM\u8BF7\u6C42\u5DF2\u4E2D\u65AD\uFF0C\u5F00\u59CB\u65B0\u8BF7\u6C42\u3002");
  }
  const controller = new AbortController();
  setLLMRequestController(controller);
  const signal = controller.signal;
  const currentData = collectProfileDataFromUI();
  const { api_url, api_key, model, temperature, top_p, max_tokens, bypass_proxy } = currentData;
  if (currentChannelType === "vertex") {
    if (!currentData.vertex_credentials || !currentData.vertex_credentials.client_email) {
      toastr.warning("Vertex \u6E20\u9053\u8BF7\u5148\u5BFC\u5165\u6709\u6548\u7684 GCP \u670D\u52A1\u8D26\u53F7 JSON \u51ED\u636E\u6587\u4EF6\u3002");
      return;
    }
    if (!currentData.vertex_model) {
      toastr.warning("\u8BF7\u8F93\u5165\u6216\u9009\u62E9 Vertex \u6A21\u578B\u540D\u79F0\u3002");
      return;
    }
    resultTextarea.val("\u6B63\u5728\u5411 Google Vertex AI \u53D1\u9001\u6D4B\u8BD5\u8BF7\u6C42\uFF0C\u8BF7\u7A0D\u5019...");
    testButton.prop("disabled", true);
    try {
      const token2 = await getVertexAccessToken(currentData.vertex_credentials, currentData.bypass_proxy);
      const endpoint = buildVertexEndpoint(currentData.vertex_location, currentData.vertex_credentials.project_id, currentData.vertex_model, false);
      const openAiBody = {
        model: currentData.vertex_model,
        messages: [{ role: "user", content: "\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\uFF1A\u4F60\u662F\u8C01\uFF1F\u53EA\u8BF4\u4E00\u53E5\u8BDD\u3002" }],
        stream: false
      };
      if (currentData.enable_temperature !== false) openAiBody.temperature = temperature;
      if (currentData.enable_top_p !== false) openAiBody.top_p = top_p;
      if (currentData.enable_max_tokens !== false) openAiBody.max_tokens = max_tokens;
      const geminiPayload = convertOpenAIToVertexGemini(openAiBody);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token2}`
        },
        body: JSON.stringify(geminiPayload),
        signal
      });
      if (!response.ok) {
        let errText = "";
        try {
          errText = await response.text();
        } catch (_e) {
        }
        throw new Error(`Vertex \u54CD\u5E94\u9519\u8BEF (${response.status}): ${errText}`);
      }
      const vertexJson = await response.json();
      const openAiResp = convertVertexToOpenAIResponse(vertexJson, currentData.vertex_model);
      const reply = openAiResp.choices?.[0]?.message?.content || "\u672A\u8FD4\u56DE\u6709\u6548\u5185\u5BB9";
      resultTextarea.val(`[Vertex AI \u8FDE\u63A5\u6210\u529F]

${reply}`);
      toastr.success("Vertex AI \u6D4B\u8BD5\u8FDE\u63A5\u6210\u529F\uFF01");
    } catch (err) {
      if (err.name === "AbortError") {
        resultTextarea.val("\u8BF7\u6C42\u5DF2\u53D6\u6D88\u3002");
      } else {
        resultTextarea.val(`[Vertex \u8BF7\u6C42\u5931\u8D25]
${err.message}`);
        toastr.error(`Vertex \u6D4B\u8BD5\u5931\u8D25: ${err.message}`);
      }
    } finally {
      testButton.prop("disabled", false);
    }
    return;
  }
  if (!api_url || !api_key || !model) {
    toastr.warning("\u8BF7\u5B8C\u6574\u586B\u5199 API URL, API Key, \u548C\u6A21\u578B\u3002");
    return;
  }
  resultTextarea.val("\u6B63\u5728\u8BF7\u6C42\uFF0C\u8BF7\u7A0D\u5019...");
  testButton.prop("disabled", true);
  try {
    const messages = [{ role: "user", content: "Hello" }];
    const body = { model, messages, stream: false };
    if (currentData.enable_temperature !== false) {
      body.temperature = temperature;
    }
    if (currentData.enable_top_p !== false) {
      body.top_p = top_p;
    }
    if (currentData.enable_max_tokens !== false) {
      body.max_tokens = max_tokens;
    }
    const effort = (currentData.reasoning_effort || "").trim();
    if (effort) {
      body.reasoning_effort = effort;
    }
    if (currentData.enable_custom_body_params && currentData.custom_body_params) {
      const extraBody = parseCustomBody(currentData.custom_body_params);
      Object.assign(body, extraBody);
    }
    const customHeadersMap = currentData.enable_custom_headers ? parseCustomHeaders(currentData.custom_headers) : {};
    let response;
    if (bypass_proxy) {
      const requestUrl = api_url.replace(/\/$/, "") + "/chat/completions";
      response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${api_key}`,
          ...customHeadersMap
        },
        body: JSON.stringify(body),
        signal
      });
    } else {
      const proxyUrl = "/api/backends/chat-completions/generate";
      let proxyBaseUrl = api_url.replace(/\/$/, "");
      response = await fetch(proxyUrl, {
        method: "POST",
        headers: getRequestHeaders(window.token),
        body: JSON.stringify({
          chat_completion_source: "custom",
          custom_url: proxyBaseUrl,
          custom_include_headers: buildProxyIncludeHeaders(api_key, customHeadersMap),
          ...body
        }),
        signal
      });
    }
    if (!response.ok) {
      let errorBodyText = "";
      try {
        errorBodyText = await response.text();
      } catch (_readErr) {
      }
      const formattedError = extractApiErrorMessage(response, errorBodyText);
      throw new Error(formattedError);
    }
    const data = await response.json();
    if (data.error || !data.choices && (data.detail || data.message || data.msg)) {
      const formattedError = extractApiErrorMessage(response, data);
      throw new Error(formattedError);
    }
    const reply = data.choices?.[0]?.message?.content || "\u672A\u6536\u5230\u6709\u6548\u56DE\u590D\u3002";
    resultTextarea.val(reply);
    eventSource.emit(eventNames.LLM_TEST_RESULT, { success: true, data });
  } catch (error) {
    if (error.name === "AbortError") {
      resultTextarea.val("\u8BF7\u6C42\u5DF2\u4E2D\u6B62\u3002");
      return;
    }
    const errorMessage = `\u8BF7\u6C42\u9519\u8BEF: ${error.message}`;
    resultTextarea.val(errorMessage);
    toastr.error(errorMessage);
    eventSource.emit(eventNames.LLM_TEST_RESULT, { success: false, error: errorMessage });
  } finally {
    testButton.prop("disabled", false);
    setLLMRequestController(null);
  }
}

function buildPrompt() {
  const testContextData = collectTestContextDataFromUI();
  const { entries } = testContextData;
  const messages = [];
  if (entries && Array.isArray(entries)) {
    entries.forEach((entry) => {
      if (!entry.enabled) return;
      if (!entry.content || entry.content.trim() === "") return;
      messages.push({ role: entry.role || "user", content: entry.content });
    });
  }
  return messages;
}

function onGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPrompt();
  eventSource.emit(eventNames.LLM_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function loadRequestTypeProfiles(isInit = false) {
  const profiles = extension_settings[extensionName].llm_request_type_profiles || {};
  const currentProfileName = extension_settings[extensionName].current_llm_request_type_profile;
  requestTypeProfileSelect.empty();
  Object.keys(profiles).forEach((name) => {
    const option = new Option(name, name, name === currentProfileName, name === currentProfileName);
    requestTypeProfileSelect.append(option);
  });
  if (requestTypeProfileSelect.val() && !isInit) {
    requestTypeProfileSelect.trigger("change");
  }
}

function onRequestTypeProfileSelectChange() {
  const profileName = $(this).val();
  if (!profileName) return;
  extension_settings[extensionName].current_llm_request_type_profile = profileName;
  saveSettingsDebounced();
  const profiles = extension_settings[extensionName].llm_request_type_profiles || {};
  const profileData = profiles[profileName];
  if (profileData) {
    extension_settings[extensionName].llm_request_type_configs = JSON.parse(JSON.stringify(profileData));
    saveSettingsDebounced();
    populateRequestTypeSelects();
  }
}

function collectRequestTypeConfigFromUI() {
  return {
    image_gen: {
      api_profile: imageGenApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: imageGenContextSelect.val() || "\u9ED8\u8BA4"
    },
    char_design: {
      api_profile: charDesignApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: charDesignContextSelect.val() || "\u9ED8\u8BA4"
    },
    char_display: {
      api_profile: charDisplayApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: charDisplayContextSelect.val() || "\u9ED8\u8BA4"
    },
    char_modify: {
      api_profile: charModifyApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: charModifyContextSelect.val() || "\u9ED8\u8BA4"
    },
    translation: {
      api_profile: translationApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: translationContextSelect.val() || "\u9ED8\u8BA4"
    },
    tag_modify: {
      api_profile: tagModifyApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: tagModifyContextSelect.val() || "\u9ED8\u8BA4"
    },
    ai_assistant: {
      api_profile: "\u9ED8\u8BA4",
      context_profile: aiAssistantContextSelect.val() || "\u9ED8\u8BA4"
    },
    persona_gen: {
      api_profile: personaGenApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: personaGenContextSelect.val() || "\u9ED8\u8BA4"
    },
    user_persona_gen: {
      api_profile: userPersonaGenApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: userPersonaGenContextSelect.val() || "\u9ED8\u8BA4"
    },
    chat_summary: {
      api_profile: summaryApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: summaryContextSelect.val() || "\u9ED8\u8BA4"
    },
    visual_mat_prep: {
      api_profile: visualMatPrepApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: visualMatPrepContextSelect.val() || "\u9ED8\u8BA4"
    },
    video_gen: {
      api_profile: videoGenApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: videoGenContextSelect.val() || "\u9ED8\u8BA4"
    },
    video_asset_gen: {
      api_profile: videoAssetGenApiSelect.val() || "\u9ED8\u8BA4",
      context_profile: videoAssetGenContextSelect.val() || "\u9ED8\u8BA4"
    }
  };
}

function onNewRequestTypeProfileClick() {
  const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u7684\u8BF7\u6C42\u7C7B\u578B\u6863\u6848\u540D\u79F0\uFF1A");
  if (!newName || newName.trim() === "") {
    toastr.warning("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
    return;
  }
  if (!extension_settings[extensionName].llm_request_type_profiles) {
    extension_settings[extensionName].llm_request_type_profiles = {};
  }
  const profiles = extension_settings[extensionName].llm_request_type_profiles;
  if (profiles[newName]) {
    toastr.error(`\u6863\u6848 "${newName}" \u5DF2\u5B58\u5728\u3002`);
    return;
  }
  profiles[newName] = collectRequestTypeConfigFromUI();
  extension_settings[extensionName].current_llm_request_type_profile = newName;
  saveSettingsDebounced();
  loadRequestTypeProfiles();
  toastr.success(`\u6863\u6848 "${newName}" \u5DF2\u521B\u5EFA\u5E76\u9009\u4E2D\u3002`);
}

function onSaveRequestTypeProfileClick() {
  const profileName = requestTypeProfileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6863\u6848\u3002");
    return;
  }
  if (!extension_settings[extensionName].llm_request_type_profiles) {
    extension_settings[extensionName].llm_request_type_profiles = {};
  }
  extension_settings[extensionName].llm_request_type_profiles[profileName] = collectRequestTypeConfigFromUI();
  saveSettingsDebounced();
  toastr.success(`\u6863\u6848 "${profileName}" \u5DF2\u66F4\u65B0\u4FDD\u5B58\u3002`);
}

function onLoadRequestTypeProfileClick() {
  const profileName = requestTypeProfileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6863\u6848\u3002");
    return;
  }
  const profiles = extension_settings[extensionName].llm_request_type_profiles || {};
  const profileData = profiles[profileName];
  if (!profileData) {
    toastr.error(`\u672A\u627E\u5230\u6863\u6848 "${profileName}" \u7684\u6570\u636E\u3002`);
    return;
  }
  extension_settings[extensionName].llm_request_type_configs = JSON.parse(JSON.stringify(profileData));
  saveSettingsDebounced();
  populateRequestTypeSelects();
  toastr.success(`\u5DF2\u8BFB\u53D6\u6863\u6848 "${profileName}" \u7684\u914D\u7F6E\u3002`);
}

function onRenameRequestTypeProfileClick() {
  const oldName = requestTypeProfileSelect.val();
  if (!oldName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6863\u6848\u3002");
    return;
  }
  const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u7684\u6863\u6848\u540D\u79F0\uFF1A", oldName);
  if (!newName || newName.trim() === "") {
    toastr.warning("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
    return;
  }
  if (newName === oldName) return;
  const profiles = extension_settings[extensionName].llm_request_type_profiles;
  if (profiles[newName]) {
    toastr.error(`\u6863\u6848 "${newName}" \u5DF2\u5B58\u5728\u3002`);
    return;
  }
  profiles[newName] = profiles[oldName];
  delete profiles[oldName];
  extension_settings[extensionName].current_llm_request_type_profile = newName;
  saveSettingsDebounced();
  loadRequestTypeProfiles();
  toastr.success(`\u6863\u6848\u5DF2\u4ECE "${oldName}" \u91CD\u547D\u540D\u4E3A "${newName}"\u3002`);
}

function onDeleteRequestTypeProfileClick() {
  const profileName = requestTypeProfileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6863\u6848\u3002");
    return;
  }
  if (Object.keys(extension_settings[extensionName].llm_request_type_profiles).length <= 1) {
    toastr.error("\u4E0D\u80FD\u5220\u9664\u6700\u540E\u4E00\u4E2A\u6863\u6848\u3002");
    return;
  }
  if (confirm(`\u4F60\u786E\u5B9A\u8981\u5220\u9664\u6863\u6848 "${profileName}" \u5417\uFF1F`)) {
    delete extension_settings[extensionName].llm_request_type_profiles[profileName];
    extension_settings[extensionName].current_llm_request_type_profile = Object.keys(extension_settings[extensionName].llm_request_type_profiles)[0];
    saveSettingsDebounced();
    loadRequestTypeProfiles();
    toastr.success(`\u6863\u6848 "${profileName}" \u5DF2\u5220\u9664\u3002`);
  }
}

function onExportRequestTypeProfileClick() {
  const profileName = requestTypeProfileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u6863\u6848\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const profiles = extension_settings[extensionName].llm_request_type_profiles || {};
  let profileData = profiles[profileName];
  if (!profileData) {
    profileData = collectRequestTypeConfigFromUI();
  }
  const contextProfileNames = /* @__PURE__ */ new Set();
  if (profileData && typeof profileData === "object") {
    Object.values(profileData).forEach((item) => {
      if (item && item.context_profile && typeof item.context_profile === "string") {
        contextProfileNames.add(item.context_profile);
      }
    });
  }
  const allContextProfiles = extension_settings[extensionName].test_context_profiles || {};
  const contextPresets = {};
  contextProfileNames.forEach((name) => {
    if (allContextProfiles[name]) {
      contextPresets[name] = allContextProfiles[name];
    }
  });
  const exportProfileData = {};
  if (profileData && typeof profileData === "object") {
    for (const [key, val] of Object.entries(profileData)) {
      exportProfileData[key] = {
        ...val || {},
        api_profile: "\u9ED8\u8BA4"
      };
    }
  }
  const exportData = {
    version: 1,
    type: "st_chatu8_request_type_profile",
    name: profileName,
    request_type_profile: exportProfileData,
    context_presets: contextPresets
  };
  const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st_chatu8_request_type_profile_${profileName}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  const presetCount = Object.keys(contextPresets).length;
  toastr.success(`\u5DF2\u5BFC\u51FA\u6863\u6848 "${profileName}"\uFF08\u5305\u542B ${presetCount} \u4E2A\u4E0A\u4E0B\u6587\u9884\u8BBE\uFF09\u3002`);
}

function onExportAllRequestTypeProfilesClick() {
  const profiles = extension_settings[extensionName].llm_request_type_profiles || {};
  const profileNames = Object.keys(profiles);
  if (profileNames.length === 0) {
    toastr.warning("\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u8BF7\u6C42\u7C7B\u578B\u6863\u6848\u3002");
    return;
  }
  const currentProfileName = requestTypeProfileSelect.val() || extension_settings[extensionName].current_llm_request_type_profile;
  const allProfilesData = JSON.parse(JSON.stringify(profiles));
  if (currentProfileName && allProfilesData[currentProfileName]) {
    allProfilesData[currentProfileName] = collectRequestTypeConfigFromUI();
  }
  const contextProfileNames = /* @__PURE__ */ new Set();
  const exportProfilesData = {};
  for (const [name, pData] of Object.entries(allProfilesData)) {
    const normalizedProfileConfig = {};
    if (pData && typeof pData === "object") {
      for (const [key, val] of Object.entries(pData)) {
        if (val && val.context_profile && typeof val.context_profile === "string") {
          contextProfileNames.add(val.context_profile);
        }
        normalizedProfileConfig[key] = {
          ...val || {},
          api_profile: "\u9ED8\u8BA4"
        };
      }
    }
    exportProfilesData[name] = normalizedProfileConfig;
  }
  const allContextProfiles = extension_settings[extensionName].test_context_profiles || {};
  const contextPresets = {};
  contextProfileNames.forEach((cpName) => {
    if (allContextProfiles[cpName]) {
      contextPresets[cpName] = allContextProfiles[cpName];
    }
  });
  const exportData = {
    version: 1,
    type: "st_chatu8_request_type_profiles_all",
    current_profile: currentProfileName,
    request_type_profiles: exportProfilesData,
    context_presets: contextPresets
  };
  const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st_chatu8_request_type_profiles_all.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  const presetCount = Object.keys(contextPresets).length;
  toastr.success(`\u5DF2\u5BFC\u51FA\u5168\u90E8 ${profileNames.length} \u4E2A\u8BF7\u6C42\u7C7B\u578B\u65B9\u6848\uFF08\u5305\u542B ${presetCount} \u4E2A\u53BB\u91CD\u540E\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\uFF09\u3002`);
}

function onImportRequestTypeProfileClick() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData || typeof importedData !== "object") {
          toastr.error("\u5BFC\u5165\u5931\u8D25\uFF0C\u6587\u4EF6\u5185\u5BB9\u65E0\u6548\u3002");
          return;
        }
        const contextPresets = importedData.context_presets || importedData.test_context_profiles || importedData.context_profiles || {};
        let importedContextCount = 0;
        if (!extension_settings[extensionName].test_context_profiles) {
          extension_settings[extensionName].test_context_profiles = {};
        }
        for (const cpName in contextPresets) {
          if (Object.prototype.hasOwnProperty.call(contextPresets, cpName)) {
            extension_settings[extensionName].test_context_profiles[cpName] = contextPresets[cpName];
            importedContextCount++;
          }
        }
        if (!extension_settings[extensionName].llm_request_type_profiles) {
          extension_settings[extensionName].llm_request_type_profiles = {};
        }
        if (importedData.request_type_profiles && typeof importedData.request_type_profiles === "object") {
          let importedProfileCount = 0;
          let lastProfileName = null;
          for (const [pName, pConfig] of Object.entries(importedData.request_type_profiles)) {
            if (!pConfig || typeof pConfig !== "object") continue;
            const profileConfig2 = {};
            for (const [key, val] of Object.entries(pConfig)) {
              profileConfig2[key] = {
                ...val || {},
                api_profile: val && val.api_profile ? val.api_profile : "\u9ED8\u8BA4"
              };
            }
            extension_settings[extensionName].llm_request_type_profiles[pName] = profileConfig2;
            importedProfileCount++;
            lastProfileName = pName;
          }
          if (importedProfileCount === 0) {
            toastr.error("\u5BFC\u5165\u5931\u8D25\uFF0C\u6587\u4EF6\u4E2D\u672A\u5305\u542B\u6709\u6548\u7684\u8BF7\u6C42\u7C7B\u578B\u6863\u6848\u3002");
            return;
          }
          const targetProfileName = importedData.current_profile && extension_settings[extensionName].llm_request_type_profiles[importedData.current_profile] ? importedData.current_profile : lastProfileName;
          if (targetProfileName) {
            extension_settings[extensionName].current_llm_request_type_profile = targetProfileName;
            extension_settings[extensionName].llm_request_type_configs = JSON.parse(JSON.stringify(extension_settings[extensionName].llm_request_type_profiles[targetProfileName]));
          }
          saveSettingsDebounced();
          loadTestContextProfiles();
          loadRequestTypeProfiles();
          populateRequestTypeSelects();
          toastr.success(`\u6210\u529F\u5BFC\u5165 ${importedProfileCount} \u4E2A\u8BF7\u6C42\u7C7B\u578B\u65B9\u6848\uFF0C\u5E76\u5BFC\u5165/\u8986\u76D6\u4E86 ${importedContextCount} \u4E2A\u4E0A\u4E0B\u6587\u9884\u8BBE\u3002`);
          return;
        }
        let rawProfileConfig = importedData.request_type_profile || importedData.profile || importedData.config;
        if (!rawProfileConfig) {
          if (importedData.image_gen || importedData.char_design || importedData.translation) {
            rawProfileConfig = importedData;
          }
        }
        if (!rawProfileConfig || typeof rawProfileConfig !== "object") {
          toastr.error("\u5BFC\u5165\u5931\u8D25\uFF0C\u672A\u8BC6\u522B\u5230\u6709\u6548\u7684\u8BF7\u6C42\u7C7B\u578B\u6863\u6848\u914D\u7F6E\u3002");
          return;
        }
        const profileConfig = {};
        for (const [key, val] of Object.entries(rawProfileConfig)) {
          profileConfig[key] = {
            ...val || {},
            api_profile: val && val.api_profile ? val.api_profile : "\u9ED8\u8BA4"
          };
        }
        const defaultName = file.name.replace(/\.json$/i, "").replace(/^st_chatu8_request_type_profile_/i, "");
        const profileName = importedData.name && typeof importedData.name === "string" && importedData.name.trim() ? importedData.name.trim() : defaultName;
        if (!extension_settings[extensionName].llm_request_type_profiles) {
          extension_settings[extensionName].llm_request_type_profiles = {};
        }
        extension_settings[extensionName].llm_request_type_profiles[profileName] = profileConfig;
        extension_settings[extensionName].current_llm_request_type_profile = profileName;
        extension_settings[extensionName].llm_request_type_configs = JSON.parse(JSON.stringify(profileConfig));
        saveSettingsDebounced();
        loadTestContextProfiles();
        loadRequestTypeProfiles();
        populateRequestTypeSelects();
        toastr.success(`\u6210\u529F\u5BFC\u5165\u6863\u6848 "${profileName}"\uFF0C\u5E76\u5BFC\u5165/\u8986\u76D6\u4E86 ${importedContextCount} \u4E2A\u4E0A\u4E0B\u6587\u9884\u8BBE\u3002`);
      } catch (error) {
        console.error("\u5BFC\u5165\u8BF7\u6C42\u7C7B\u578B\u6863\u6848\u5931\u8D25:", error);
        toastr.error("\u5BFC\u5165\u5931\u8D25\uFF0C\u6587\u4EF6\u683C\u5F0F\u65E0\u6548\u3002");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function populateRequestTypeSelects() {
  const llmProfiles = extension_settings[extensionName].llm_profiles || {};
  const contextProfiles = extension_settings[extensionName].test_context_profiles || {};
  const configs = extension_settings[extensionName].llm_request_type_configs || {};
  const llmProfileNames = Object.keys(llmProfiles);
  const contextProfileNames = Object.keys(contextProfiles);
  const apiSelects = [imageGenApiSelect, charDesignApiSelect, charDisplayApiSelect, charModifyApiSelect, translationApiSelect, tagModifyApiSelect, aiAssistantApiSelect, personaGenApiSelect, userPersonaGenApiSelect, summaryApiSelect, visualMatPrepApiSelect, videoGenApiSelect, videoAssetGenApiSelect];
  const contextSelects = [imageGenContextSelect, charDesignContextSelect, charDisplayContextSelect, charModifyContextSelect, translationContextSelect, tagModifyContextSelect, aiAssistantContextSelect, personaGenContextSelect, userPersonaGenContextSelect, summaryContextSelect, visualMatPrepContextSelect, videoGenContextSelect, videoAssetGenContextSelect];
  const requestTypes = [LLMRequestTypes.IMAGE_GEN, LLMRequestTypes.CHAR_DESIGN, LLMRequestTypes.CHAR_DISPLAY, LLMRequestTypes.CHAR_MODIFY, LLMRequestTypes.TRANSLATION, LLMRequestTypes.TAG_MODIFY, LLMRequestTypes.AI_ASSISTANT, LLMRequestTypes.PERSONA_GEN, LLMRequestTypes.USER_PERSONA_GEN, LLMRequestTypes.CHAT_SUMMARY, LLMRequestTypes.VISUAL_MAT_PREP, LLMRequestTypes.VIDEO_GEN, LLMRequestTypes.VIDEO_ASSET_GEN];
  apiSelects.forEach((select, index) => {
    if (!select || !select.length) return;
    select.empty();
    const currentConfig = configs[requestTypes[index]] || {};
    const selectedApi = currentConfig.api_profile || "\u9ED8\u8BA4";
    llmProfileNames.forEach((name) => {
      const option = new Option(name, name, name === selectedApi, name === selectedApi);
      select.append(option);
    });
  });
  contextSelects.forEach((select, index) => {
    if (!select || !select.length) return;
    select.empty();
    const currentConfig = configs[requestTypes[index]] || {};
    const selectedContext = currentConfig.context_profile || "\u9ED8\u8BA4";
    contextProfileNames.forEach((name) => {
      const option = new Option(name, name, name === selectedContext, name === selectedContext);
      select.append(option);
    });
  });
}

function bindRequestTypeSelectEvents() {
  if (imageGenApiSelect && imageGenApiSelect.length) {
    imageGenApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.IMAGE_GEN, "api_profile", $(this).val());
    });
  }
  if (imageGenContextSelect && imageGenContextSelect.length) {
    imageGenContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.IMAGE_GEN, "context_profile", $(this).val());
    });
  }
  if (charDesignApiSelect && charDesignApiSelect.length) {
    charDesignApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.CHAR_DESIGN, "api_profile", $(this).val());
    });
  }
  if (charDesignContextSelect && charDesignContextSelect.length) {
    charDesignContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.CHAR_DESIGN, "context_profile", $(this).val());
    });
  }
  if (charDisplayApiSelect && charDisplayApiSelect.length) {
    charDisplayApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.CHAR_DISPLAY, "api_profile", $(this).val());
    });
  }
  if (charDisplayContextSelect && charDisplayContextSelect.length) {
    charDisplayContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.CHAR_DISPLAY, "context_profile", $(this).val());
    });
  }
  if (charModifyApiSelect && charModifyApiSelect.length) {
    charModifyApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.CHAR_MODIFY, "api_profile", $(this).val());
    });
  }
  if (charModifyContextSelect && charModifyContextSelect.length) {
    charModifyContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.CHAR_MODIFY, "context_profile", $(this).val());
    });
  }
  if (translationApiSelect && translationApiSelect.length) {
    translationApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.TRANSLATION, "api_profile", $(this).val());
    });
  }
  if (translationContextSelect && translationContextSelect.length) {
    translationContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.TRANSLATION, "context_profile", $(this).val());
    });
  }
  if (tagModifyApiSelect && tagModifyApiSelect.length) {
    tagModifyApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.TAG_MODIFY, "api_profile", $(this).val());
    });
  }
  if (tagModifyContextSelect && tagModifyContextSelect.length) {
    tagModifyContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.TAG_MODIFY, "context_profile", $(this).val());
    });
  }
  if (aiAssistantApiSelect && aiAssistantApiSelect.length) {
    aiAssistantApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.AI_ASSISTANT, "api_profile", $(this).val());
    });
  }
  if (aiAssistantContextSelect && aiAssistantContextSelect.length) {
    aiAssistantContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.AI_ASSISTANT, "context_profile", $(this).val());
    });
  }
  if (personaGenApiSelect && personaGenApiSelect.length) {
    personaGenApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.PERSONA_GEN, "api_profile", $(this).val());
    });
  }
  if (personaGenContextSelect && personaGenContextSelect.length) {
    personaGenContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.PERSONA_GEN, "context_profile", $(this).val());
    });
  }
  if (userPersonaGenApiSelect && userPersonaGenApiSelect.length) {
    userPersonaGenApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.USER_PERSONA_GEN, "api_profile", $(this).val());
    });
  }
  if (userPersonaGenContextSelect && userPersonaGenContextSelect.length) {
    userPersonaGenContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.USER_PERSONA_GEN, "context_profile", $(this).val());
    });
  }
  if (summaryApiSelect && summaryApiSelect.length) {
    summaryApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.CHAT_SUMMARY, "api_profile", $(this).val());
    });
  }
  if (summaryContextSelect && summaryContextSelect.length) {
    summaryContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.CHAT_SUMMARY, "context_profile", $(this).val());
    });
  }
  if (visualMatPrepApiSelect && visualMatPrepApiSelect.length) {
    visualMatPrepApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.VISUAL_MAT_PREP, "api_profile", $(this).val());
    });
  }
  if (visualMatPrepContextSelect && visualMatPrepContextSelect.length) {
    visualMatPrepContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.VISUAL_MAT_PREP, "context_profile", $(this).val());
    });
  }
  if (videoGenApiSelect && videoGenApiSelect.length) {
    videoGenApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.VIDEO_GEN, "api_profile", $(this).val());
    });
  }
  if (videoGenContextSelect && videoGenContextSelect.length) {
    videoGenContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.VIDEO_GEN, "context_profile", $(this).val());
    });
  }
  if (videoAssetGenApiSelect && videoAssetGenApiSelect.length) {
    videoAssetGenApiSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.VIDEO_ASSET_GEN, "api_profile", $(this).val());
    });
  }
  if (videoAssetGenContextSelect && videoAssetGenContextSelect.length) {
    videoAssetGenContextSelect.on("change", function() {
      saveRequestTypeSelection(LLMRequestTypes.VIDEO_ASSET_GEN, "context_profile", $(this).val());
    });
  }
}

function saveRequestTypeSelection(requestType, field, value) {
  if (!extension_settings[extensionName].llm_request_type_configs) {
    extension_settings[extensionName].llm_request_type_configs = {};
  }
  if (!extension_settings[extensionName].llm_request_type_configs[requestType]) {
    extension_settings[extensionName].llm_request_type_configs[requestType] = {
      api_profile: "\u9ED8\u8BA4",
      context_profile: "\u9ED8\u8BA4"
    };
  }
  extension_settings[extensionName].llm_request_type_configs[requestType][field] = value;
  saveSettingsDebounced();
  const typeNames = {
    "image_gen": "\u6B63\u6587\u56FE\u7247\u751F\u6210",
    "char_design": "\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1",
    "char_display": "\u89D2\u8272/\u670D\u88C5\u5C55\u793A",
    "char_modify": "\u89D2\u8272/\u670D\u88C5\u4FEE\u6539",
    "translation": "\u7FFB\u8BD1",
    "tag_modify": "Tag\u4FEE\u6539",
    "ai_assistant": "\u667A\u7ED8\u59EC\u52A9\u624B",
    "persona_gen": "\u4EBA\u8BBE\u751F\u6210",
    "chat_summary": "\u804A\u5929\u603B\u7ED3",
    "visual_mat_prep": "\u89C6\u6750\u51C6\u5907",
    "video_gen": "\u56FE\u751F\u89C6\u9891",
    "video_asset_gen": "\u89C6\u9891\u8D44\u4EA7\u751F\u6210"
  };
  const fieldNames = {
    "api_profile": "API \u914D\u7F6E",
    "context_profile": "\u4E0A\u4E0B\u6587\u9884\u8BBE"
  };
  console.log(`st-chatu8: ${typeNames[requestType]} \u7684 ${fieldNames[field]} \u5DF2\u66F4\u6539\u4E3A "${value}"`);
}

function onImageGenGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u6B63\u6587\u56FE\u7247\u751F\u6210\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.IMAGE_GEN);
  eventSource.emit(eventNames.LLM_IMAGE_GEN_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function onCharDesignGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u89D2\u8272/\u670D\u88C5\u8BBE\u8BA1\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.CHAR_DESIGN);
  eventSource.emit(eventNames.LLM_CHAR_DESIGN_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function onCharDisplayGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u89D2\u8272/\u670D\u88C5\u5C55\u793A\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.CHAR_DISPLAY);
  eventSource.emit(eventNames.LLM_CHAR_DISPLAY_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function onCharModifyGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u89D2\u8272/\u670D\u88C5\u4FEE\u6539\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.CHAR_MODIFY);
  eventSource.emit(eventNames.LLM_CHAR_MODIFY_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function onTranslationGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u7FFB\u8BD1\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.TRANSLATION);
  eventSource.emit(eventNames.LLM_TRANSLATION_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function onTagModifyGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230Tag\u4FEE\u6539\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.TAG_MODIFY);
  eventSource.emit(eventNames.LLM_TAG_MODIFY_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function onVisualMatPrepGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u89C6\u6750\u51C6\u5907\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.VISUAL_MAT_PREP);
  eventSource.emit(eventNames.LLM_VISUAL_MAT_PREP_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function onVideoGenGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u56FE\u751F\u89C6\u9891\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.VIDEO_GEN);
  eventSource.emit(eventNames.LLM_VIDEO_GEN_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

function onVideoAssetGenGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u89C6\u9891\u8D44\u4EA7\u751F\u6210\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.VIDEO_ASSET_GEN);
  eventSource.emit(eventNames.LLM_VIDEO_ASSET_GEN_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

async function onExecuteRequest(data) {
  const profileData = collectProfileDataFromUI();
  await executeDefaultLLMRequest(data, profileData, getResultTextareaUpdater());
}

async function onImageGenRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.IMAGE_GEN, eventNames.LLM_IMAGE_GEN_RESPONSE, getResultTextareaUpdater());
}

async function onCharDesignRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.CHAR_DESIGN, eventNames.LLM_CHAR_DESIGN_RESPONSE, getResultTextareaUpdater());
}

async function onCharDisplayRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.CHAR_DISPLAY, eventNames.LLM_CHAR_DISPLAY_RESPONSE, getResultTextareaUpdater());
}

async function onCharModifyRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.CHAR_MODIFY, eventNames.LLM_CHAR_MODIFY_RESPONSE, getResultTextareaUpdater());
}

async function onTranslationRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.TRANSLATION, eventNames.LLM_TRANSLATION_RESPONSE, getResultTextareaUpdater());
}

async function onTagModifyRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.TAG_MODIFY, eventNames.LLM_TAG_MODIFY_RESPONSE, getResultTextareaUpdater());
}

async function onVisualMatPrepRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.VISUAL_MAT_PREP, eventNames.LLM_VISUAL_MAT_PREP_RESPONSE, getResultTextareaUpdater());
}

async function onVideoGenRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.VIDEO_GEN, eventNames.LLM_VIDEO_GEN_RESPONSE, getResultTextareaUpdater());
}

async function onVideoAssetGenRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.VIDEO_ASSET_GEN, eventNames.LLM_VIDEO_ASSET_GEN_RESPONSE, getResultTextareaUpdater());
}

function onPersonaGenGetPromptRequest(data) {
  const { id } = data;
  if (!id) return;
  console.log(`st-chatu8: \u6536\u5230\u4EBA\u8BBE\u751F\u6210\u63D0\u793A\u8BCD\u83B7\u53D6\u8BF7\u6C42 (ID: ${id})`);
  const prompt2 = buildPromptForRequestType(LLMRequestTypes.PERSONA_GEN);
  eventSource.emit(eventNames.LLM_PERSONA_GEN_GET_PROMPT_RESPONSE, { prompt: prompt2, id });
}

async function onPersonaGenRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.PERSONA_GEN, eventNames.LLM_PERSONA_GEN_RESPONSE, getResultTextareaUpdater());
}

async function onUserPersonaGenRequest(data) {
  if (data.prompt) {
    updateCombinedPrompt(data.prompt);
  }
  await executeTypedLLMRequest(data, LLMRequestTypes.USER_PERSONA_GEN, eventNames.LLM_USER_PERSONA_GEN_RESPONSE, getResultTextareaUpdater());
}

function cacheDOMElements() {
  profileSelect = $("#ch-llm_profile_select");
  channelOpenAiBtn = $("#ch-llm_channel_openai_btn");
  channelVertexBtn = $("#ch-llm_channel_vertex_btn");
  openaiConfigContainer = $("#ch-llm_openai_config_container");
  vertexConfigContainer = $("#ch-llm_vertex_config_container");
  vertexFileInput = $("#ch-llm_vertex_file_input");
  vertexImportBtn = $("#ch-llm_vertex_import_btn");
  vertexClearBtn = $("#ch-llm_vertex_clear_btn");
  vertexStatusText = $("#ch-llm_vertex_status_text");
  vertexCredInfo = $("#ch-llm_vertex_cred_info");
  vertexProjectIdText = $("#ch-llm_vertex_project_id_text");
  vertexClientEmailText = $("#ch-llm_vertex_client_email_text");
  vertexLocationSelect = $("#ch-llm_vertex_location_select");
  vertexLocationInput = $("#ch-llm_vertex_location_input");
  vertexModelSelect = $("#ch-llm_vertex_model_select");
  vertexModelInput = $("#ch-llm_vertex_model_input");
  apiUrlInput = $("#ch-llm_api_url");
  apiKeyInput = $("#ch-llm_api_key");
  modelSelect = $("#ch-llm_model_select");
  modelInput = $("#ch-llm_model_input");
  fetchModelsButton = $("#ch-llm_fetch_models_button");
  temperatureSlider = $("#ch-llm_temperature");
  temperatureValue = $("#ch-llm_temperature_value");
  enableTemperatureCheckbox = $("#ch-llm_enable_temperature");
  temperatureContainer = $("#ch-llm_temperature_container");
  topPSlider = $("#ch-llm_top_p");
  topPValue = $("#ch-llm_top_p_value");
  enableTopPCheckbox = $("#ch-llm_enable_top_p");
  topPContainer = $("#ch-llm_top_p_container");
  maxTokensSlider = $("#ch-llm_max_tokens");
  maxTokensValue = $("#ch-llm_max_tokens_value");
  enableMaxTokensCheckbox = $("#ch-llm_enable_max_tokens");
  maxTokensContainer = $("#ch-llm_max_tokens_container");
  reasoningEffortSelect = $("#ch-llm_reasoning_effort");
  queryCapsButton = $("#ch-llm_query_caps_button");
  capsResultSpan = $("#ch-llm_caps_result");
  enableCustomHeadersToggle = $("#ch-llm_enable_custom_headers");
  customHeadersContainer = $("#ch-llm_custom_headers_container");
  customHeadersTextarea = $("#ch-llm_custom_headers");
  enableCustomBodyParamsToggle = $("#ch-llm_enable_custom_body_params");
  customBodyParamsContainer = $("#ch-llm_custom_body_params_container");
  customBodyParamsTextarea = $("#ch-llm_custom_body_params");
  testContextSelect = $("#ch-test_context_select");
  presetEntriesContainer = $("#ch-preset-entries-container");
  testButton = $("#ch-llm_test_button");
  resultTextarea = $("#ch-llm_test_result");
  combinedPromptTextarea = $("#ch-llm_combined_prompt");
  streamToggle = $("#ch-llm_stream");
  bypassProxyToggle = $("#ch-llm_bypass_proxy");
  mergeSystemUserToggle = $("#ch-llm_merge_system_user");
  sendImagesToggle = $("#ch-llm_send_images");
  historyDepthSlider = $("#ch-llm_history_depth");
  historyDepthValue = $("#ch-llm_history_depth_value");
  retryCountSlider = $("#ch-llm_retry_count");
  retryCountValue = $("#ch-llm_retry_count_value");
  customToolEnabledCheckbox = $("#ch-custom_tool_enabled");
  customToolDetailsArea = $("#ch-custom_tool_details");
  toolNameModeSelect = $("#ch-tool_name_mode");
  toolFixedNameRow = $("#ch-tool_fixed_name_row");
  toolFixedNameInput = $("#ch-tool_fixed_name");
  toolDescTextarea = $("#ch-tool_desc");
  addToolFieldBtn = $("#ch-add_tool_field_btn");
  toolFieldsContainer = $("#ch-tool-fields-container");
  exportToolConfigBtn = $("#ch-export_tool_config_btn");
  importToolConfigBtn = $("#ch-import_tool_config_btn");
  toolConfigFileInput = $("#ch-tool_config_file_input");
  customTailEnabledCheckbox = $("#ch-custom_tail_messages_enabled");
  customTailDetailsArea = $("#ch-custom_tail_details");
  addTailMsgBtn = $("#ch-add_tail_msg_btn");
  tailMessagesContainer = $("#ch-tail-messages-container");
  exportTailConfigBtn = $("#ch-export_tail_config_btn");
  importTailConfigBtn = $("#ch-import_tail_config_btn");
  tailConfigFileInput = $("#ch-tail_config_file_input");
  imageGenApiSelect = $("#ch-llm_image_gen_api_select");
  imageGenContextSelect = $("#ch-llm_image_gen_context_select");
  charDesignApiSelect = $("#ch-llm_char_design_api_select");
  charDesignContextSelect = $("#ch-llm_char_design_context_select");
  charDisplayApiSelect = $("#ch-llm_char_display_api_select");
  charDisplayContextSelect = $("#ch-llm_char_display_context_select");
  charModifyApiSelect = $("#ch-llm_char_modify_api_select");
  charModifyContextSelect = $("#ch-llm_char_modify_context_select");
  translationApiSelect = $("#ch-llm_translation_api_select");
  translationContextSelect = $("#ch-llm_translation_context_select");
  tagModifyApiSelect = $("#ch-llm_tag_modify_api_select");
  tagModifyContextSelect = $("#ch-llm_tag_modify_context_select");
  aiAssistantApiSelect = $("#ch-llm_ai_assistant_api_select");
  aiAssistantContextSelect = $("#ch-llm_ai_assistant_context_select");
  personaGenApiSelect = $("#ch-llm_persona_gen_api_select");
  personaGenContextSelect = $("#ch-llm_persona_gen_context_select");
  userPersonaGenApiSelect = $("#ch-llm_user_persona_gen_api_select");
  userPersonaGenContextSelect = $("#ch-llm_user_persona_gen_context_select");
  summaryApiSelect = $("#ch-llm_summary_api_select");
  summaryContextSelect = $("#ch-llm_summary_context_select");
  visualMatPrepApiSelect = $("#ch-llm_visual_mat_prep_api_select");
  visualMatPrepContextSelect = $("#ch-llm_visual_mat_prep_context_select");
  videoGenApiSelect = $("#ch-llm_video_gen_api_select");
  videoGenContextSelect = $("#ch-llm_video_gen_context_select");
  videoAssetGenApiSelect = $("#ch-llm_video_asset_gen_api_select");
  videoAssetGenContextSelect = $("#ch-llm_video_asset_gen_context_select");
  requestTypeProfileSelect = $("#ch-llm_request_type_profile_select");
  loadRequestTypeProfileBtn = $("#ch-load_llm_request_type_profile_button");
  newRequestTypeProfileBtn = $("#ch-new_llm_request_type_profile_button");
  saveRequestTypeProfileBtn = $("#ch-save_llm_request_type_profile_button");
  renameRequestTypeProfileBtn = $("#ch-rename_llm_request_type_profile_button");
  deleteRequestTypeProfileBtn = $("#ch-delete_llm_request_type_profile_button");
  importRequestTypeProfileBtn = $("#ch-import_llm_request_type_profile_button");
  exportRequestTypeProfileBtn = $("#ch-export_llm_request_type_profile_button");
  exportAllRequestTypeProfilesBtn = $("#ch-export_all_llm_request_type_profile_button");
}

function bindUIEvents() {
  $("#ch-new_llm_profile_button").on("click", onNewProfileClick);
  $("#ch-save_llm_profile_button").on("click", onSaveProfileClick);
  $("#ch-rename_llm_profile_button").on("click", onRenameLLMProfileClick);
  $("#ch-delete_llm_profile_button").on("click", onDeleteProfileClick);
  $("#ch-import_llm_profile_button").on("click", onImportProfileClick);
  $("#ch-export_llm_profile_button").on("click", onExportProfileClick);
  profileSelect.on("change", onProfileSelectChange);
  $("#ch-new_test_context_button").on("click", onNewTestContextClick);
  $("#ch-save_test_context_button").on("click", onSaveTestContextClick);
  $("#ch-save_as_test_context_button").on("click", onSaveAsTestContextClick);
  $("#ch-rename_test_context_button").on("click", onRenameTestContextClick);
  $("#ch-delete_test_context_button").on("click", onDeleteTestContextClick);
  $("#ch-import_test_context_button").on("click", onImportTestContextClick);
  $("#ch-export_test_context_button").on("click", onExportTestContextClick);
  $("#ch-export_all_test_context_button").on("click", onExportAllTestContextClick);
  testContextSelect.on("change", onTestContextSelectChange);
  $("#ch-add_preset_entry_button").on("click", addNewPresetEntry);
  loadRequestTypeProfileBtn.on("click", onLoadRequestTypeProfileClick);
  newRequestTypeProfileBtn.on("click", onNewRequestTypeProfileClick);
  saveRequestTypeProfileBtn.on("click", onSaveRequestTypeProfileClick);
  renameRequestTypeProfileBtn.on("click", onRenameRequestTypeProfileClick);
  deleteRequestTypeProfileBtn.on("click", onDeleteRequestTypeProfileClick);
  importRequestTypeProfileBtn.on("click", onImportRequestTypeProfileClick);
  exportRequestTypeProfileBtn.on("click", onExportRequestTypeProfileClick);
  exportAllRequestTypeProfilesBtn.on("click", onExportAllRequestTypeProfilesClick);
  requestTypeProfileSelect.on("change", onRequestTypeProfileSelectChange);
  bindDragEvents();
  bindEntryEvents();
  fetchModelsButton.on("click", onFetchModelsClick);
  testButton.on("click", onTestLLMClick);
  channelOpenAiBtn?.on("click", function() {
    setChannelTypeUI("openai");
    triggerProfileAutoSave(true);
  });
  channelVertexBtn?.on("click", function() {
    setChannelTypeUI("vertex");
    triggerProfileAutoSave(true);
  });
  vertexImportBtn?.on("click", function() {
    vertexFileInput?.click();
  });
  vertexFileInput?.on("change", function(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const json4 = JSON.parse(ev.target.result);
        if (!json4.project_id || !json4.client_email || !json4.private_key) {
          toastr.error("\u5BFC\u5165\u5931\u8D25\uFF1A\u8BE5 JSON \u51ED\u8BC1\u7F3A\u5C11 project_id\u3001client_email \u6216 private_key \u5173\u952E\u5B57\u6BB5");
          return;
        }
        currentVertexCredentials = {
          project_id: json4.project_id,
          client_email: json4.client_email,
          private_key: json4.private_key
        };
        updateVertexCredentialsUI();
        triggerProfileAutoSave(true);
        toastr.success(`\u5DF2\u6210\u529F\u5BFC\u5165 GCP \u51ED\u636E (\u9879\u76EE: ${json4.project_id})`);
      } catch (err) {
        toastr.error("\u5BFC\u5165\u5931\u8D25\uFF1AJSON \u6587\u4EF6\u89E3\u6790\u9519\u8BEF");
      }
    };
    reader.readAsText(file);
    vertexFileInput.val("");
  });
  vertexClearBtn?.on("click", function() {
    currentVertexCredentials = null;
    updateVertexCredentialsUI();
    triggerProfileAutoSave(true);
    toastr.info("\u5DF2\u6E05\u9664 Vertex \u51ED\u636E");
  });
  vertexLocationSelect?.on("change", function() {
    const val = $(this).val();
    if (val !== "custom") {
      vertexLocationInput?.val(val);
    }
    triggerProfileAutoSave();
  });
  vertexLocationInput?.on("input", function() {
    const val = $(this).val().trim();
    if (vertexLocationSelect && vertexLocationSelect.find(`option[value="${val}"]`).length > 0) {
      vertexLocationSelect.val(val);
    } else if (vertexLocationSelect) {
      vertexLocationSelect.val("custom");
    }
    triggerProfileAutoSave();
  });
  vertexModelSelect?.on("change", function() {
    const val = $(this).val();
    if (val !== "custom") {
      vertexModelInput?.val(val);
    }
    triggerProfileAutoSave();
  });
  vertexModelInput?.on("input", function() {
    const val = $(this).val().trim();
    if (vertexModelSelect && vertexModelSelect.find(`option[value="${val}"]`).length > 0) {
      vertexModelSelect.val(val);
    } else if (vertexModelSelect) {
      vertexModelSelect.val("custom");
    }
    triggerProfileAutoSave();
  });
  $("#ch-llm_api_key_toggle").on("click", function() {
    const textarea = $("#ch-llm_api_key")[0];
    const icon = $(this).find("i");
    const isHidden = textarea.style.webkitTextSecurity === "disc";
    if (isHidden) {
      textarea.style.webkitTextSecurity = "none";
      icon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
      textarea.style.webkitTextSecurity = "disc";
      icon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
  });
  let profileAutoSaveTimer = null;
  function triggerProfileAutoSave(immediate = false) {
    if (profileAutoSaveTimer) clearTimeout(profileAutoSaveTimer);
    const executeSave2 = () => {
      const profileName = profileSelect?.val() || extension_settings[extensionName]?.current_llm_profile || "\u9ED8\u8BA4";
      if (profileName && extension_settings[extensionName]?.llm_profiles) {
        const collected = collectProfileDataFromUI();
        extension_settings[extensionName].llm_profiles[profileName] = collected;
        saveSettingsDebounced();
        console.log(`st-chatu8: LLM\u914D\u7F6E "${profileName}" \u5DF2\u81EA\u52A8\u4FDD\u5B58`);
      }
    };
    if (immediate === true) {
      executeSave2();
    } else {
      profileAutoSaveTimer = setTimeout(executeSave2, 1e3);
    }
  }
  let toolConfigAutoSaveTimer = null;
  function triggerGlobalToolConfigAutoSave(immediate = false) {
    if (toolConfigAutoSaveTimer) clearTimeout(toolConfigAutoSaveTimer);
    const executeSave2 = () => {
      if (!extension_settings[extensionName]) return;
      const toolCfg = collectGlobalToolCallConfigFromUI();
      const tailCfg = collectGlobalTailMessagesConfigFromUI();
      extension_settings[extensionName].tool_call_config = toolCfg;
      extension_settings[extensionName].tail_messages_config = tailCfg;
      saveSettingsDebounced();
      console.log(`st-chatu8: \u5168\u5C40 Tool/Tail \u63D2\u4EF6\u914D\u7F6E\u5DF2\u4FDD\u5B58 (ToolCall: ${toolCfg.enabled}, TailMsg: ${tailCfg.enabled})`);
    };
    if (immediate === true) {
      executeSave2();
    } else {
      toolConfigAutoSaveTimer = setTimeout(executeSave2, 1e3);
    }
  }
  apiUrlInput.on("input", () => triggerProfileAutoSave(false));
  apiKeyInput.on("input", () => triggerProfileAutoSave(false));
  modelInput.on("input", () => triggerProfileAutoSave(false));
  streamToggle.on("change", () => triggerProfileAutoSave(true));
  bypassProxyToggle.on("change", () => triggerProfileAutoSave(true));
  mergeSystemUserToggle.on("change", () => triggerProfileAutoSave(true));
  sendImagesToggle.on("change", () => triggerProfileAutoSave(true));
  if (enableTemperatureCheckbox) {
    enableTemperatureCheckbox.on("change", () => {
      updateModelParamControlsState();
      triggerProfileAutoSave(true);
    });
  }
  if (enableTopPCheckbox) {
    enableTopPCheckbox.on("change", () => {
      updateModelParamControlsState();
      triggerProfileAutoSave(true);
    });
  }
  if (enableMaxTokensCheckbox) {
    enableMaxTokensCheckbox.on("change", () => {
      updateModelParamControlsState();
      triggerProfileAutoSave(true);
    });
  }
  if (reasoningEffortSelect) {
    reasoningEffortSelect.on("change", () => triggerProfileAutoSave(true));
  }
  if (queryCapsButton) {
    queryCapsButton.on("click", onQueryCapsClick);
  }
  if (enableCustomHeadersToggle) {
    enableCustomHeadersToggle.on("change", () => triggerProfileAutoSave(true));
  }
  if (customHeadersTextarea) {
    customHeadersTextarea.on("input", () => triggerProfileAutoSave(false));
  }
  if (enableCustomBodyParamsToggle) {
    enableCustomBodyParamsToggle.on("change", () => triggerProfileAutoSave(true));
  }
  if (customBodyParamsTextarea) {
    customBodyParamsTextarea.on("input", () => triggerProfileAutoSave(false));
  }
  customToolEnabledCheckbox.on("change", () => {
    updateToolCallUIVisibility();
    triggerGlobalToolConfigAutoSave(true);
  });
  toolNameModeSelect.on("change", () => {
    updateToolCallUIVisibility();
    triggerGlobalToolConfigAutoSave(true);
  });
  toolFixedNameInput.on("input", () => triggerGlobalToolConfigAutoSave(false));
  toolDescTextarea.on("input", () => triggerGlobalToolConfigAutoSave(false));
  addToolFieldBtn.on("click", () => {
    const fields = collectToolFieldsFromDOM();
    fields.push({ name: `param_${fields.length + 1}`, description: "", wrapTag: "", required: true });
    renderToolFields(fields);
    triggerGlobalToolConfigAutoSave(true);
  });
  toolFieldsContainer.on("input change", ".ch-tool-field-name, .ch-tool-field-desc, .ch-tool-field-wraptag", () => {
    triggerGlobalToolConfigAutoSave(false);
  });
  toolFieldsContainer.on("click", ".ch-delete-tool-field-btn", function() {
    $(this).closest(".st-chatu8-tool-field-row").remove();
    triggerGlobalToolConfigAutoSave(true);
    if (toolFieldsContainer.children().length === 0) {
      renderToolFields([]);
    }
  });
  customTailEnabledCheckbox.on("change", () => {
    updateToolCallUIVisibility();
    triggerGlobalToolConfigAutoSave(true);
  });
  addTailMsgBtn.on("click", () => {
    const msgs = collectTailMessagesFromDOM();
    msgs.push({ role: "user", content: "\u7B49\u7B49\uFF0C\u4E0D\u8981\u4F7F\u7528Text/Content \u76F4\u51FA\uFF0C\u800C\u662F\u4F7F\u7528%TOOL_NAME% toolcall\u5DE5\u5177\u8FDB\u884C\u601D\u8003\u548C\u56DE\u590D" });
    renderTailMessages(msgs);
    triggerGlobalToolConfigAutoSave(true);
  });
  tailMessagesContainer.on("input change", ".ch-tail-msg-role, .ch-tail-msg-content", () => {
    triggerGlobalToolConfigAutoSave(false);
  });
  tailMessagesContainer.on("click", ".ch-delete-tail-msg-btn", function() {
    $(this).closest(".st-chatu8-tail-msg-row").remove();
    triggerGlobalToolConfigAutoSave(true);
    if (tailMessagesContainer.children().length === 0) {
      renderTailMessages([]);
    }
  });
  exportToolConfigBtn.on("click", exportToolConfig);
  importToolConfigBtn.on("click", () => {
    toolConfigFileInput.val("");
    toolConfigFileInput.trigger("click");
  });
  toolConfigFileInput.on("change", function(e) {
    const file = e.target.files?.[0];
    if (file) {
      importToolConfig(file);
      triggerGlobalToolConfigAutoSave(true);
    }
  });
  exportTailConfigBtn.on("click", exportTailConfig);
  importTailConfigBtn.on("click", () => {
    tailConfigFileInput.val("");
    tailConfigFileInput.trigger("click");
  });
  tailConfigFileInput.on("change", function(e) {
    const file = e.target.files?.[0];
    if (file) {
      importTailConfig(file);
      triggerGlobalToolConfigAutoSave(true);
    }
  });
  modelSelect.on("change", function() {
    const selectedModel = $(this).val();
    if (selectedModel) {
      modelInput.val(selectedModel);
    }
    triggerProfileAutoSave();
  });
  temperatureSlider.on("input", () => {
    temperatureValue.val(temperatureSlider.val());
    triggerProfileAutoSave();
  });
  temperatureValue.on("input", () => {
    temperatureSlider.val(temperatureValue.val());
    triggerProfileAutoSave();
  });
  topPSlider.on("input", () => {
    topPValue.val(topPSlider.val());
    triggerProfileAutoSave();
  });
  topPValue.on("input", () => {
    topPSlider.val(topPValue.val());
    triggerProfileAutoSave();
  });
  maxTokensSlider.on("input", () => {
    maxTokensValue.val(maxTokensSlider.val());
    triggerProfileAutoSave();
  });
  maxTokensValue.on("input", () => {
    maxTokensSlider.val(maxTokensValue.val());
    triggerProfileAutoSave();
  });
  historyDepthSlider.on("input", () => {
    historyDepthValue.val(historyDepthSlider.val());
    extension_settings[extensionName].llm_history_depth = parseInt(historyDepthSlider.val(), 10);
    saveSettingsDebounced();
  });
  historyDepthValue.on("input", () => {
    historyDepthSlider.val(historyDepthValue.val());
    extension_settings[extensionName].llm_history_depth = parseInt(historyDepthValue.val(), 10);
    saveSettingsDebounced();
  });
  retryCountSlider.on("input", () => {
    retryCountValue.val(retryCountSlider.val());
    extension_settings[extensionName].llm_retry_count = parseInt(retryCountSlider.val(), 10);
    saveSettingsDebounced();
  });
  retryCountValue.on("input", () => {
    retryCountSlider.val(retryCountValue.val());
    extension_settings[extensionName].llm_retry_count = parseInt(retryCountValue.val(), 10);
    saveSettingsDebounced();
  });
  populateRequestTypeSelects();
  bindRequestTypeSelectEvents();
  bypassProxyToggle.on("change", function() {
    if ($(this).prop("checked")) {
      toastr.warning(
        "\u5F00\u542F\u6B64\u9009\u9879\u540E\uFF0C\u5C06\u76F4\u63A5\u901A\u8FC7\u6D4F\u89C8\u5668\u8BF7\u6C42 API\uFF0C\u53EF\u80FD\u5B58\u5728\u8DE8\u57DF(CORS)\u95EE\u9898\u3002<br><br>\u6B64\u529F\u80FD\u4EC5\u7528\u4E8E\u89E3\u51B3\u9152\u9986\u540C\u65F6\u8BF7\u6C42\u5BFC\u81F4\u7684 bug\uFF0C\u8BF7\u786E\u4FDD\u4F60\u7684 API \u670D\u52A1\u5668\u5DF2\u914D\u7F6E CORS \u6216\u90E8\u7F72\u5728\u540C\u57DF\u4E0B\u3002",
        "\u8DE8\u57DF\u8B66\u544A",
        { timeOut: 8e3, closeButton: true, escapeHtml: false }
      );
    }
  });
  $("#ch-tagthink_echo").on("change", function() {
    extension_settings[extensionName].tagthinkEcho = $(this).prop("checked") ? "true" : "false";
    saveSettingsDebounced();
  });
  $("#ch-history_keep_image_tag").on("change", function() {
    extension_settings[extensionName].historyKeepImageTag = $(this).prop("checked");
    saveSettingsDebounced();
  });
}

function registerEventListeners() {
  eventSource.on(eventNames.LLM_GET_PROMPT_REQUEST, onGetPromptRequest);
  eventSource.on(eventNames.LLM_EXECUTE_REQUEST, onExecuteRequest);
  eventSource.on(eventNames.LLM_IMAGE_GEN_REQUEST, onImageGenRequest);
  eventSource.on(eventNames.LLM_CHAR_DESIGN_REQUEST, onCharDesignRequest);
  eventSource.on(eventNames.LLM_CHAR_DISPLAY_REQUEST, onCharDisplayRequest);
  eventSource.on(eventNames.LLM_CHAR_MODIFY_REQUEST, onCharModifyRequest);
  eventSource.on(eventNames.LLM_TRANSLATION_REQUEST, onTranslationRequest);
  eventSource.on(eventNames.LLM_TAG_MODIFY_REQUEST, onTagModifyRequest);
  eventSource.on(eventNames.LLM_VISUAL_MAT_PREP_REQUEST, onVisualMatPrepRequest);
  eventSource.on(eventNames.LLM_VIDEO_GEN_REQUEST, onVideoGenRequest);
  eventSource.on(eventNames.LLM_VIDEO_ASSET_GEN_REQUEST, onVideoAssetGenRequest);
  eventSource.on(eventNames.LLM_IMAGE_GEN_GET_PROMPT_REQUEST, onImageGenGetPromptRequest);
  eventSource.on(eventNames.LLM_CHAR_DESIGN_GET_PROMPT_REQUEST, onCharDesignGetPromptRequest);
  eventSource.on(eventNames.LLM_CHAR_DISPLAY_GET_PROMPT_REQUEST, onCharDisplayGetPromptRequest);
  eventSource.on(eventNames.LLM_CHAR_MODIFY_GET_PROMPT_REQUEST, onCharModifyGetPromptRequest);
  eventSource.on(eventNames.LLM_TRANSLATION_GET_PROMPT_REQUEST, onTranslationGetPromptRequest);
  eventSource.on(eventNames.LLM_TAG_MODIFY_GET_PROMPT_REQUEST, onTagModifyGetPromptRequest);
  eventSource.on(eventNames.LLM_VISUAL_MAT_PREP_GET_PROMPT_REQUEST, onVisualMatPrepGetPromptRequest);
  eventSource.on(eventNames.LLM_VIDEO_GEN_GET_PROMPT_REQUEST, onVideoGenGetPromptRequest);
  eventSource.on(eventNames.LLM_VIDEO_ASSET_GEN_GET_PROMPT_REQUEST, onVideoAssetGenGetPromptRequest);
  eventSource.on(eventNames.LLM_PERSONA_GEN_REQUEST, onPersonaGenRequest);
  eventSource.on(eventNames.LLM_PERSONA_GEN_GET_PROMPT_REQUEST, onPersonaGenGetPromptRequest);
  eventSource.on(eventNames.LLM_USER_PERSONA_GEN_REQUEST, onUserPersonaGenRequest);
  eventSource.on(eventNames.LLM_USER_PERSONA_GEN_GET_PROMPT_REQUEST, onPersonaGenGetPromptRequest);
}

function loadInitialData() {
  loadLLMProfiles();
  loadTestContextProfiles();
  loadRequestTypeProfiles(true);
  loadGlobalToolAndTailSettingsToUI();
  const historyDepth = extension_settings[extensionName].llm_history_depth ?? 0;
  historyDepthSlider.val(historyDepth);
  historyDepthValue.val(historyDepth);
  const tagthinkEcho = String(extension_settings[extensionName].tagthinkEcho) === "true";
  $("#ch-tagthink_echo").prop("checked", tagthinkEcho);
  const historyKeepImageTag = extension_settings[extensionName].historyKeepImageTag === true;
  $("#ch-history_keep_image_tag").prop("checked", historyKeepImageTag);
  const retryCount = extension_settings[extensionName].llm_retry_count ?? 0;
  retryCountSlider.val(retryCount);
  retryCountValue.val(retryCount);
}

export { bindUIEvents, cacheDOMElements, getResultTextareaUpdater, loadInitialData, registerEventListeners, updateCombinedPrompt };
