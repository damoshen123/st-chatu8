// 还原自打包产物 — 原始模块: utils/assistant/assistantDialog.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { eventNames, extensionName } from "../config.js";
import { getRequestHeaders } from "../utils.js";
import { applyFabSettings, getGlobalVideoPlayer } from "../ui_common.js";
import { extractApiErrorMessage } from "../settings/llmService.js";
import { dom, isAiGenerating, setRefreshSettingsPanelFn, ttsButtonState } from "./assistantContext.js";
import { getEdgeVoiceStyles, getEdgeVoices, getQwenVoices, pingAndRefreshServers, setTTSEngineType } from "../tts.js";
import { isKnowledgeBaseEnabled, setKnowledgeBaseEnabled } from "../knowledgeBaseService.js";
import { hideSummaryPanel, showSummaryPanel } from "./assistantSummary.js";
import { defaultSystemPromptKey, systemPrompts } from "../aiPrompts.js";
import { getASRConfig, isASREnabled, isConversationMode, saveASRConfig, setASREnabled, startConversationMode, startMicTest, stopConversationMode, stopMicTest } from "../asr.js";
import "./assistantUtils.js"; // init_assistantUtils

var assistantAutoSaveTimer;

assistantAutoSaveTimer = null;

function makeDraggable(element, handle, excludeSelector) {
  let isDragging = false;
  let startClientX, startClientY;
  let startLeft, startTop;
  let hasMoved = false;
  let isInitialized5 = false;
  function handleDragStart(clientX, clientY, target) {
    if (excludeSelector && $(target).closest(excludeSelector).length > 0) return false;
    isDragging = true;
    hasMoved = false;
    startClientX = clientX;
    startClientY = clientY;
    if (!isInitialized5) {
      const rect = element[0].getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      isInitialized5 = true;
    } else {
      const computedStyle = window.getComputedStyle(element[0]);
      startLeft = parseFloat(computedStyle.left) || 0;
      startTop = parseFloat(computedStyle.top) || 0;
    }
    element.css("transition", "none");
    return true;
  }
  function handleDragMove(clientX, clientY) {
    if (!isDragging) return;
    hasMoved = true;
    let newLeft = startLeft + (clientX - startClientX);
    let newTop = startTop + (clientY - startClientY);
    const elementWidth = element.outerWidth();
    const elementHeight = element.outerHeight();
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - elementWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - elementHeight));
    element.css({
      left: newLeft + "px",
      top: newTop + "px",
      right: "auto",
      bottom: "auto"
    });
  }
  function handleDragEnd() {
    if (isDragging) {
      isDragging = false;
      setTimeout(() => hasMoved = false, 50);
      element.css("transition", "");
    }
  }
  handle.off("mousedown.aiDrag").on("mousedown.aiDrag", function(e) {
    handleDragStart(e.clientX, e.clientY, e.target);
  });
  $(document).off("mousemove.aiDrag").on("mousemove.aiDrag", function(e) {
    handleDragMove(e.clientX, e.clientY);
  });
  $(document).off("mouseup.aiDrag").on("mouseup.aiDrag", function() {
    handleDragEnd();
  });
  handle.off("touchstart.aiDrag").on("touchstart.aiDrag", function(e) {
    const touch = e.originalEvent.touches[0];
    if (handleDragStart(touch.clientX, touch.clientY, e.target)) {
      e.preventDefault();
    }
  });
  let dragMoveHandler = null;
  let dragEndHandler = null;
  const originalDragStart = handleDragStart;
  handleDragStart = function(clientX, clientY, target) {
    const result = originalDragStart(clientX, clientY, target);
    if (result && !dragMoveHandler) {
      dragMoveHandler = function(e) {
        if (isDragging) {
          const touch = e.touches[0];
          handleDragMove(touch.clientX, touch.clientY);
          e.preventDefault();
        }
      };
      dragEndHandler = function() {
        handleDragEnd();
        if (dragMoveHandler) {
          document.removeEventListener("touchmove", dragMoveHandler);
          document.removeEventListener("touchend", dragEndHandler);
          document.removeEventListener("touchcancel", dragEndHandler);
          dragMoveHandler = null;
          dragEndHandler = null;
        }
      };
      document.addEventListener("touchmove", dragMoveHandler, { passive: false });
      document.addEventListener("touchend", dragEndHandler);
      document.addEventListener("touchcancel", dragEndHandler);
    }
    return result;
  };
  return () => hasMoved;
}

function makeResizable(element) {
  const resizeHandle = $('<div class="st-chatu8-ai-resize-handle"><i class="fa-solid fa-grip-lines"></i></div>');
  element.append(resizeHandle);
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  function handleResizeStart(clientX, clientY) {
    isResizing = true;
    startX = clientX;
    startY = clientY;
    startWidth = element.outerWidth();
    startHeight = element.outerHeight();
    element.css("transition", "none");
    $("body").css("user-select", "none");
  }
  function handleResizeMove(clientX, clientY) {
    if (!isResizing) return;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    let newWidth = startWidth + deltaX;
    let newHeight = startHeight + deltaY;
    const minWidth = 300;
    const minHeight = 400;
    newWidth = Math.max(minWidth, newWidth);
    newHeight = Math.max(minHeight, newHeight);
    const maxWidth = window.innerWidth - 50;
    const maxHeight = window.innerHeight - 50;
    newWidth = Math.min(maxWidth, newWidth);
    newHeight = Math.min(maxHeight, newHeight);
    element.css({
      width: newWidth + "px",
      height: newHeight + "px",
      "max-height": "none",
      "max-width": "none"
    });
  }
  function handleResizeEnd() {
    if (isResizing) {
      isResizing = false;
      element.css("transition", "");
      $("body").css("user-select", "");
    }
  }
  resizeHandle.off("mousedown.aiResize").on("mousedown.aiResize", function(e) {
    e.preventDefault();
    e.stopPropagation();
    handleResizeStart(e.clientX, e.clientY);
  });
  $(document).off("mousemove.aiResize").on("mousemove.aiResize", function(e) {
    handleResizeMove(e.clientX, e.clientY);
  });
  $(document).off("mouseup.aiResize").on("mouseup.aiResize", function() {
    handleResizeEnd();
  });
  let resizeMoveHandler = null;
  let resizeEndHandler = null;
  resizeHandle.off("touchstart.aiResize").on("touchstart.aiResize", function(e) {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.originalEvent.touches[0];
    handleResizeStart(touch.clientX, touch.clientY);
    if (!resizeMoveHandler) {
      resizeMoveHandler = function(ev) {
        if (isResizing) {
          const t = ev.touches[0];
          handleResizeMove(t.clientX, t.clientY);
          ev.preventDefault();
        }
      };
      resizeEndHandler = function() {
        handleResizeEnd();
        if (resizeMoveHandler) {
          document.removeEventListener("touchmove", resizeMoveHandler);
          document.removeEventListener("touchend", resizeEndHandler);
          document.removeEventListener("touchcancel", resizeEndHandler);
          resizeMoveHandler = null;
          resizeEndHandler = null;
        }
      };
      document.addEventListener("touchmove", resizeMoveHandler, { passive: false });
      document.addEventListener("touchend", resizeEndHandler);
      document.addEventListener("touchcancel", resizeEndHandler);
    }
  });
}

function populateQwenVoices(selectedVoice) {
  const voices = getQwenVoices();
  dom.ttsQwenVoiceSelect.empty();
  voices.forEach((v) => {
    dom.ttsQwenVoiceSelect.append(`<option value="${v}">${v}</option>`);
  });
  if (selectedVoice) {
    dom.ttsQwenVoiceSelect.val(selectedVoice);
  }
}

function populateEdgeVoices(selectedVoiceId) {
  const voices = getEdgeVoices();
  dom.ttsEdgeVoiceSelect.empty();
  voices.forEach((v) => {
    const genderTag = v.gender === "female" ? "\u2640" : "\u2642";
    dom.ttsEdgeVoiceSelect.append(`<option value="${v.id}">${genderTag} ${v.name}</option>`);
  });
  if (selectedVoiceId) {
    dom.ttsEdgeVoiceSelect.val(selectedVoiceId);
  }
}

function populateEdgeStyles(voiceId, selectedStyle) {
  const styles = voiceId ? getEdgeVoiceStyles(voiceId) : [];
  dom.ttsEdgeStyleSelect.empty();
  if (styles.length === 0) {
    dom.ttsEdgeStyleSelect.append('<option value="general">\u901A\u7528 (\u9ED8\u8BA4)</option>');
  } else {
    styles.forEach((s) => {
      dom.ttsEdgeStyleSelect.append(`<option value="${s.id}">${s.name}</option>`);
    });
  }
  if (selectedStyle) {
    dom.ttsEdgeStyleSelect.val(selectedStyle);
  }
}

function updatePingStatusDisplay(pingData) {
  if (!pingData) {
    dom.ttsEdgePingStatus.text("\u672A\u68C0\u6D4B").css("color", "");
    return;
  }
  const { available, total, bestName, bestLatency } = pingData;
  if (available > 0) {
    dom.ttsEdgePingStatus.text(`${available}/${total} \u53EF\u7528\uFF0C\u6700\u5FEB: ${bestName} (${bestLatency}ms)`).css("color", "#4CAF50");
  } else {
    dom.ttsEdgePingStatus.text(`${available}/${total} \u53EF\u7528\uFF0C\u6240\u6709\u670D\u52A1\u5668\u4E0D\u53EF\u8FBE`).css("color", "#f44336");
  }
}

function updateLlmApiToggleUI(isUseLlmApi) {
  if (!dom.dialog) return;
  const $apiFields = dom.dialog.find("#chatu8-ai-api-url, #chatu8-ai-api-key, #chatu8-ai-model, #chatu8-ai-model-select, #chatu8-ai-fetch-models, #chatu8-ai-bypass-proxy");
  if (isUseLlmApi) {
    $apiFields.prop("disabled", true).css({ opacity: "0.6", cursor: "not-allowed" });
  } else {
    $apiFields.prop("disabled", false).css({ opacity: "1", cursor: "" });
  }
}

function refreshSettingsPanel() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  const useLlmApi = !!aiConfig.use_llm_api;
  dom.checkUseLlmApi?.prop("checked", useLlmApi);
  updateLlmApiToggleUI(useLlmApi);
  dom.inputApiUrl.val(aiConfig.api_url || "");
  dom.inputApiKey.val(aiConfig.api_key || "");
  dom.inputModel.val(aiConfig.model || "mistral");
  dom.selectSystemPrompt.val(aiConfig.system_prompt_key || defaultSystemPromptKey);
  dom.checkBypassProxy.prop("checked", !!aiConfig.bypass_proxy);
  dom.checkSendImages.prop("checked", aiConfig.send_images !== false);
  dom.checkUseToolCall.prop("checked", aiConfig.use_tool_call !== false);
  dom.checkStream.prop("checked", false);
  dom.checkAutoExecute.prop("checked", !!aiConfig.auto_execute_commands);
  dom.checkKnowledgeBase.prop("checked", isKnowledgeBaseEnabled());
  const floorEnabled = !!aiConfig.floor_message_enabled;
  dom.checkFloorMessage.prop("checked", floorEnabled);
  dom.floorCount.val(aiConfig.floor_count ?? 1);
  dom.dialog.find("#chatu8-ai-floor-settings").toggle(floorEnabled);
  dom.checkTTSEnabled.prop("checked", !!aiConfig.tts_enabled);
  const ttsEnabled = !!aiConfig.tts_enabled;
  dom.ttsSettingsPanel.toggle(ttsEnabled);
  dom.ttsScopeSelect.val(aiConfig.tts_scope || "dialogue");
  const savedEngine = aiConfig.tts_engine || "edge";
  dom.ttsEngineSelect.val(savedEngine);
  setTTSEngineType(savedEngine);
  dom.ttsQwenOptions.toggle(savedEngine === "qwen");
  dom.ttsEdgeOptions.toggle(savedEngine === "edge");
  if (savedEngine === "qwen") {
    populateQwenVoices(aiConfig.tts_qwen_voice);
  } else if (savedEngine === "edge") {
    populateEdgeVoices(aiConfig.tts_edge_voice);
    populateEdgeStyles(aiConfig.tts_edge_voice, aiConfig.tts_edge_style);
    dom.ttsEdgeRateSlider.val(aiConfig.tts_edge_rate ?? 0);
    dom.ttsEdgeRateVal.text(aiConfig.tts_edge_rate ?? 0);
    dom.ttsEdgePitchSlider.val(aiConfig.tts_edge_pitch ?? 0);
    dom.ttsEdgePitchVal.text(aiConfig.tts_edge_pitch ?? 0);
    if (aiConfig.tts_edge_ping) {
      updatePingStatusDisplay(aiConfig.tts_edge_ping);
    }
  }
  const asrEnabled = isASREnabled();
  dom.checkASREnabled.prop("checked", asrEnabled);
  dom.asrSettingsPanel.toggle(asrEnabled);
  const asrCfg = getASRConfig();
  const isConvModeSetting = asrCfg.conversationMode;
  dom.asrMicBtn.toggle(asrEnabled);
  const $micIcon = dom.asrMicBtn.find("i");
  if (asrEnabled && isConvModeSetting) {
    dom.asrMicBtn.attr("title", "\u591A\u8F6E\u5BF9\u8BDD\uFF08\u70B9\u51FB\u5F00\u59CB/\u505C\u6B62\uFF09");
    $micIcon.removeClass("fa-microphone fa-stop fa-spinner fa-spin").addClass("fa-comments");
  } else {
    dom.asrMicBtn.attr("title", "\u8BED\u97F3\u8F93\u5165\uFF08\u5355\u6B21\uFF09");
    $micIcon.removeClass("fa-comments fa-stop fa-spinner fa-spin").addClass("fa-microphone");
  }
  if (isConversationMode()) {
    dom.asrMicBtn.addClass("conv-active");
  } else {
    dom.asrMicBtn.removeClass("conv-active");
  }
  dom.asrConvModeSelect.val(isConvModeSetting ? "conversation" : "single");
  dom.asrSilenceSlider.val(asrCfg.silenceTimeout);
  dom.asrSilenceVal.text(asrCfg.silenceTimeout);
  dom.asrVadSlider.val(asrCfg.vadThreshold);
  dom.asrVadVal.text(asrCfg.vadThreshold);
  dom.asrMaxKeepSlider.val(asrCfg.maxKeepDuration);
  dom.asrMaxKeepVal.text(asrCfg.maxKeepDuration);
  dom.asrLanguageSelect.val(asrCfg.language || "auto");
  dom.asrAppendSelect.val(String(asrCfg.appendMode !== false));
  dom.asrAutoSendCheckbox.prop("checked", asrCfg.autoSend !== false);
  dom.inputMaxTokens.val(aiConfig.max_tokens ?? 4e4);
  dom.inputTemperature.val(aiConfig.temperature ?? 0.8);
  dom.inputTopP.val(aiConfig.top_p ?? 1);
}

function checkAndShowSettings() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  if (!aiConfig.api_key) {
    dom.settingsPanel.addClass("active");
    toastr?.info("\u521D\u6B21\u4F7F\u7528\u8BF7\u5148\u914D\u7F6E\u597D API \u548C \u6A21\u578B\u4FE1\u606F\u54E6~");
  }
  refreshSettingsPanel();
}

function autoSaveSettings() {
  if (!extension_settings[extensionName].chatu8_ai_assistant) {
    extension_settings[extensionName].chatu8_ai_assistant = {};
  }
  const aiConfig = extension_settings[extensionName].chatu8_ai_assistant;
  aiConfig.api_url = dom.inputApiUrl.val().trim();
  aiConfig.api_key = dom.inputApiKey.val().trim();
  aiConfig.model = dom.inputModel.val().trim();
  aiConfig.system_prompt_key = dom.selectSystemPrompt.val();
  if (aiConfig.system_prompt !== void 0) {
    delete aiConfig.system_prompt;
  }
  aiConfig.use_llm_api = dom.checkUseLlmApi?.is(":checked") ?? false;
  aiConfig.bypass_proxy = dom.checkBypassProxy.is(":checked");
  aiConfig.send_images = dom.checkSendImages.is(":checked");
  aiConfig.use_tool_call = dom.checkUseToolCall.is(":checked");
  aiConfig.stream = false;
  aiConfig.auto_execute_commands = dom.checkAutoExecute.is(":checked");
  aiConfig.floor_message_enabled = dom.checkFloorMessage.is(":checked");
  const floorCount = parseInt(dom.floorCount.val());
  aiConfig.floor_count = !isNaN(floorCount) ? floorCount : 1;
  aiConfig.tts_enabled = dom.checkTTSEnabled.is(":checked");
  aiConfig.tts_scope = dom.ttsScopeSelect.val();
  aiConfig.tts_engine = dom.ttsEngineSelect.val();
  if (aiConfig.tts_engine === "qwen") {
    aiConfig.tts_qwen_voice = dom.ttsQwenVoiceSelect.val();
  } else if (aiConfig.tts_engine === "edge") {
    aiConfig.tts_edge_voice = dom.ttsEdgeVoiceSelect.val();
    aiConfig.tts_edge_style = dom.ttsEdgeStyleSelect.val();
    aiConfig.tts_edge_rate = parseInt(dom.ttsEdgeRateSlider.val()) || 0;
    aiConfig.tts_edge_pitch = parseInt(dom.ttsEdgePitchSlider.val()) || 0;
  }
  const maxT = parseInt(dom.inputMaxTokens.val());
  aiConfig.max_tokens = !isNaN(maxT) ? maxT : 4e4;
  const temp = parseFloat(dom.inputTemperature.val());
  aiConfig.temperature = !isNaN(temp) ? temp : 0.8;
  const topP = parseFloat(dom.inputTopP.val());
  aiConfig.top_p = !isNaN(topP) ? topP : 1;
  saveSettingsDebounced();
}

function debouncedAutoSaveSettings() {
  if (assistantAutoSaveTimer) clearTimeout(assistantAutoSaveTimer);
  assistantAutoSaveTimer = setTimeout(() => {
    autoSaveSettings();
  }, 1e3);
}

function initDialogEvents() {
  const {
    dialog,
    header,
    settingsBtn,
    settingsPanel,
    settingsCloseBtn,
    saveSettingsBtn,
    checkUseLlmApi,
    inputApiUrl,
    inputApiKey,
    inputModel,
    selectModel,
    selectSystemPrompt,
    fetchModelsBtn,
    checkBypassProxy,
    checkSendImages,
    checkUseToolCall,
    checkAutoExecute,
    checkTTSEnabled,
    checkASREnabled,
    ttsSettingsPanel,
    ttsEngineSelect,
    ttsQwenOptions,
    ttsQwenVoiceSelect,
    ttsEdgeOptions,
    ttsEdgeVoiceSelect,
    ttsEdgeStyleSelect,
    ttsEdgeRateSlider,
    ttsEdgeRateVal,
    ttsEdgePitchSlider,
    ttsEdgePitchVal,
    ttsEdgePingBtn,
    ttsEdgePingStatus,
    asrSettingsPanel,
    asrMicBtn,
    asrConvModeSelect,
    asrSilenceSlider,
    asrSilenceVal,
    asrVadSlider,
    asrVadVal,
    asrMaxKeepSlider,
    asrMaxKeepVal,
    asrLanguageSelect,
    asrAppendSelect,
    asrAutoSendCheckbox,
    asrMicTestBtn,
    asrMicTestMeter,
    asrMicTestBar,
    asrMicTestVadLine,
    asrMicTestLabel,
    asrMicTestStatus,
    historyPanel,
    inputMaxTokens,
    inputTemperature,
    inputTopP,
    checkKnowledgeBase,
    checkDesktopPet,
    closeBtn
  } = dom;
  selectSystemPrompt.empty();
  Object.entries(systemPrompts).forEach(([key, value]) => {
    selectSystemPrompt.append(new Option(value.name, key));
  });
  makeDraggable(dialog, header, "#st-chatu8-ai-close, #st-chatu8-ai-settings-btn, #st-chatu8-ai-new-chat, #st-chatu8-ai-history-btn, #st-chatu8-ai-summary-btn");
  makeResizable(dialog);
  setRefreshSettingsPanelFn(refreshSettingsPanel);
  dom.summaryBtn.on("click", function() {
    historyPanel.removeClass("active");
    settingsPanel.removeClass("active");
    const $sm = dom.summaryManager;
    if ($sm && $sm.length) {
      if ($sm.is(":visible")) {
        hideSummaryPanel();
      } else {
        showSummaryPanel();
      }
    }
  });
  settingsBtn.on("click", function() {
    historyPanel.removeClass("active");
    hideSummaryPanel();
    checkAndShowSettings();
    settingsPanel.addClass("active");
  });
  settingsCloseBtn.on("click", function() {
    settingsPanel.removeClass("active");
  });
  inputApiUrl.on("input", debouncedAutoSaveSettings);
  inputApiKey.on("input", debouncedAutoSaveSettings);
  inputModel.on("input", debouncedAutoSaveSettings);
  selectSystemPrompt.on("change", function() {
    autoSaveSettings();
    if ($(this).val() === "custom" && !isKnowledgeBaseEnabled()) {
      setKnowledgeBaseEnabled(true);
      checkKnowledgeBase.prop("checked", true);
      const $kbNavLink = $('.st-chatu8-nav-link[data-tab="knowledgeBase"]');
      if ($kbNavLink.length) {
        $kbNavLink.show();
      }
      toastr?.info("\u5DF2\u81EA\u52A8\u5F00\u542F\u8D44\u6599\u5E93\u529F\u80FD\uFF08\u81EA\u5B9A\u4E49\u9884\u8BBE\u63A8\u8350\u642D\u914D\u8D44\u6599\u5E93\u4F7F\u7528\uFF09");
    }
  });
  checkUseLlmApi?.on("change", function() {
    updateLlmApiToggleUI($(this).is(":checked"));
    autoSaveSettings();
  });
  checkBypassProxy.on("change", autoSaveSettings);
  checkSendImages.on("change", autoSaveSettings);
  checkUseToolCall.on("change", autoSaveSettings);
  checkAutoExecute.on("change", autoSaveSettings);
  checkTTSEnabled.on("change", function() {
    const enabled = $(this).prop("checked");
    ttsSettingsPanel.toggle(enabled);
    autoSaveSettings();
  });
  dom.ttsScopeSelect.on("change", autoSaveSettings);
  ttsEngineSelect.on("change", function() {
    const engine = $(this).val();
    setTTSEngineType(engine);
    ttsQwenOptions.toggle(engine === "qwen");
    ttsEdgeOptions.toggle(engine === "edge");
    const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
    if (engine === "qwen") {
      populateQwenVoices(aiConfig.tts_qwen_voice);
    } else if (engine === "edge") {
      populateEdgeVoices(aiConfig.tts_edge_voice);
      populateEdgeStyles(ttsEdgeVoiceSelect.val(), aiConfig.tts_edge_style);
      if (aiConfig.tts_edge_ping) {
        updatePingStatusDisplay(aiConfig.tts_edge_ping);
      } else {
        updatePingStatusDisplay(null);
      }
    }
    autoSaveSettings();
  });
  ttsQwenVoiceSelect.on("change", autoSaveSettings);
  ttsEdgeVoiceSelect.on("change", function() {
    const voiceId = $(this).val();
    populateEdgeStyles(voiceId);
    autoSaveSettings();
  });
  ttsEdgeStyleSelect.on("change", autoSaveSettings);
  ttsEdgeRateSlider.on("input", function() {
    ttsEdgeRateVal.text($(this).val());
  });
  ttsEdgeRateSlider.on("change", autoSaveSettings);
  ttsEdgePitchSlider.on("input", function() {
    ttsEdgePitchVal.text($(this).val());
  });
  ttsEdgePitchSlider.on("change", autoSaveSettings);
  ttsEdgePingBtn.on("click", async function() {
    const $btn = $(this);
    const $icon = $btn.find("i");
    $btn.prop("disabled", true);
    $icon.removeClass("fa-signal").addClass("fa-spinner fa-spin");
    ttsEdgePingStatus.text("\u68C0\u6D4B\u4E2D...").css("color", "");
    try {
      const result = await pingAndRefreshServers();
      const pingData = {
        available: result.available,
        total: result.total,
        bestName: result.servers.length > 0 ? result.servers[0].name : "",
        bestLatency: result.servers.length > 0 ? result.servers[0].latency : 0,
        timestamp: result.timestamp
      };
      if (!extension_settings[extensionName].chatu8_ai_assistant) {
        extension_settings[extensionName].chatu8_ai_assistant = {};
      }
      extension_settings[extensionName].chatu8_ai_assistant.tts_edge_ping = pingData;
      saveSettingsDebounced();
      updatePingStatusDisplay(pingData);
    } catch (e) {
      ttsEdgePingStatus.text("\u68C0\u6D4B\u5931\u8D25: " + e.message).css("color", "#f44336");
    } finally {
      $btn.prop("disabled", false);
      $icon.removeClass("fa-spinner fa-spin").addClass("fa-signal");
    }
  });
  checkASREnabled.on("change", function() {
    const enabled = $(this).prop("checked");
    setASREnabled(enabled);
    asrSettingsPanel.toggle(enabled);
    asrMicBtn.toggle(enabled);
    if (!enabled) {
      stopConversationMode();
      asrMicBtn.removeClass("conv-active conv-recording");
    }
  });
  asrConvModeSelect.on("change", function() {
    const mode = $(this).val();
    const isConv = mode === "conversation";
    saveASRConfig({ conversationMode: isConv });
    if (isConversationMode()) {
      stopConversationMode();
      asrMicBtn.removeClass("conv-active conv-recording");
    }
    const $icon = asrMicBtn.find("i");
    if (isConv) {
      asrMicBtn.attr("title", "\u591A\u8F6E\u5BF9\u8BDD\uFF08\u70B9\u51FB\u5F00\u59CB/\u505C\u6B62\uFF09");
      $icon.removeClass("fa-microphone fa-stop fa-spinner fa-spin").addClass("fa-comments");
    } else {
      asrMicBtn.attr("title", "\u8BED\u97F3\u8F93\u5165\uFF08\u5355\u6B21\uFF09");
      $icon.removeClass("fa-comments fa-stop fa-spinner fa-spin").addClass("fa-microphone");
    }
  });
  asrMicBtn.on("click", function() {
    const asrCfg = getASRConfig();
    const isConvModeSetting = asrCfg.conversationMode;
    if (isConvModeSetting) {
      if (isConversationMode()) {
        stopConversationMode();
        asrMicBtn.removeClass("conv-active conv-recording");
        const $icon = asrMicBtn.find("i");
        $icon.removeClass("fa-microphone fa-stop fa-spinner fa-spin").addClass("fa-comments");
        toastr?.info("\u591A\u8F6E\u5BF9\u8BDD\u6A21\u5F0F\u5DF2\u5173\u95ED");
      } else {
        const autoSendFn = () => {
          if (dom.sendBtn && dom.sendBtn.length) {
            dom.sendBtn.trigger("click");
          }
        };
        const isBusy = isAiGenerating || ttsButtonState !== "idle";
        startConversationMode(autoSendFn, isBusy);
        asrMicBtn.addClass("conv-active");
        if (isBusy) {
          toastr?.success("\u591A\u8F6E\u5BF9\u8BDD\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF0C\u7B49\u5F85\u5F53\u524D\u4EFB\u52A1\u5B8C\u6210\u540E\u81EA\u52A8\u5F00\u59CB\u5F55\u97F3...");
        } else {
          toastr?.success("\u591A\u8F6E\u5BF9\u8BDD\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF0C\u5F00\u59CB\u5F55\u97F3...");
        }
      }
    } else {
      const $btn = $(this);
      if ($btn.hasClass("asr-recording")) {
        eventSource.emit(eventNames.ASR_STOP);
      } else {
        eventSource.emit(eventNames.ASR_START, { mode: "vad", targetInput: "#st-chatu8-ai-input" });
      }
    }
  });
  eventSource.on(eventNames.ASR_STATE_CHANGED, (data) => {
    const $icon = asrMicBtn.find("i");
    const inConvMode = isConversationMode();
    const asrCfg = getASRConfig();
    const isConvModeSetting = asrCfg.conversationMode;
    switch (data?.state) {
      case "recording":
        if (inConvMode || isConvModeSetting) {
          asrMicBtn.addClass("asr-recording conv-recording");
          $icon.removeClass("fa-comments fa-spinner fa-spin").addClass("fa-microphone");
          asrMicBtn.css("color", "");
        } else {
          asrMicBtn.addClass("asr-recording");
          $icon.removeClass("fa-microphone fa-spinner fa-spin").addClass("fa-stop");
          asrMicBtn.css("color", "#ff4444");
        }
        break;
      case "processing":
        asrMicBtn.removeClass("asr-recording conv-recording");
        $icon.removeClass("fa-microphone fa-stop fa-comments").addClass("fa-spinner fa-spin");
        asrMicBtn.css("color", "");
        break;
      default:
        asrMicBtn.removeClass("asr-recording conv-recording");
        asrMicBtn.css("color", "");
        if (inConvMode) {
          $icon.removeClass("fa-microphone fa-stop fa-spinner fa-spin").addClass("fa-comments");
        } else if (isConvModeSetting) {
          $icon.removeClass("fa-microphone fa-stop fa-spinner fa-spin").addClass("fa-comments");
          asrMicBtn.removeClass("conv-active");
        } else {
          $icon.removeClass("fa-stop fa-spinner fa-spin fa-comments").addClass("fa-microphone");
        }
        break;
    }
  });
  asrSilenceSlider.on("input", function() {
    const v = parseInt($(this).val());
    asrSilenceVal.text(v);
    saveASRConfig({ silenceTimeout: v });
  });
  asrVadSlider.on("input", function() {
    const v = parseFloat($(this).val());
    asrVadVal.text(v);
    saveASRConfig({ vadThreshold: v });
  });
  asrMaxKeepSlider.on("input", function() {
    const v = parseInt($(this).val());
    asrMaxKeepVal.text(v);
    saveASRConfig({ maxKeepDuration: v });
  });
  asrLanguageSelect.on("change", function() {
    saveASRConfig({ language: $(this).val() });
  });
  asrAppendSelect.on("change", function() {
    saveASRConfig({ appendMode: $(this).val() === "true" });
  });
  asrAutoSendCheckbox.on("change", function() {
    saveASRConfig({ autoSend: $(this).prop("checked") });
  });
  let micTestActive = false;
  asrMicTestBtn.on("click", async function() {
    if (micTestActive) {
      stopMicTest();
      micTestActive = false;
      asrMicTestMeter.hide();
      asrMicTestBtn.html('<i class="fa-solid fa-wave-square"></i> \u5F00\u59CB\u6D4B\u8BD5');
      asrMicTestBtn.css("background", "");
      return;
    }
    asrMicTestBtn.html('<i class="fa-solid fa-spinner fa-spin"></i> \u8FDE\u63A5\u9EA6\u514B\u98CE...');
    const ok = await startMicTest((rms, vadThreshold) => {
      const displayMax = 0.3;
      const pct = Math.min(100, rms / displayMax * 100);
      const vadPct = Math.min(100, vadThreshold / displayMax * 100);
      asrMicTestBar.css("width", pct + "%");
      asrMicTestVadLine.css("left", vadPct + "%");
      asrMicTestLabel.text(`RMS: ${rms.toFixed(4)} / VAD: ${vadThreshold.toFixed(4)}`);
      if (rms > vadThreshold) {
        asrMicTestStatus.text("\u{1F7E2} \u68C0\u6D4B\u5230\u8BED\u97F3").css("color", "#4CAF50");
      } else if (rms > vadThreshold * 0.5) {
        asrMicTestStatus.text("\u{1F7E1} \u63A5\u8FD1\u9608\u503C").css("color", "#FFC107");
      } else {
        asrMicTestStatus.text("\u26AB \u9759\u97F3/\u5E95\u566A").css("color", "#888");
      }
    });
    if (!ok) {
      asrMicTestBtn.html('<i class="fa-solid fa-wave-square"></i> \u5F00\u59CB\u6D4B\u8BD5');
      toastr?.error("\u65E0\u6CD5\u8BBF\u95EE\u9EA6\u514B\u98CE\uFF0C\u8BF7\u68C0\u67E5\u6743\u9650");
      return;
    }
    micTestActive = true;
    asrMicTestMeter.show();
    asrMicTestBtn.html('<i class="fa-solid fa-stop"></i> \u505C\u6B62\u6D4B\u8BD5');
    asrMicTestBtn.css("background", "#ff4444");
  });
  asrVadSlider.on("input", function() {
    if (micTestActive) {
      const v = parseFloat($(this).val());
      const displayMax = 0.3;
      const vadPct = Math.min(100, v / displayMax * 100);
      asrMicTestVadLine.css("left", vadPct + "%");
    }
  });
  settingsCloseBtn.on("click", function() {
    if (micTestActive) {
      stopMicTest();
      micTestActive = false;
      asrMicTestMeter.hide();
      asrMicTestBtn.html('<i class="fa-solid fa-wave-square"></i> \u5F00\u59CB\u6D4B\u8BD5');
      asrMicTestBtn.css("background", "");
    }
  });
  let pipVideoElement = null;
  checkDesktopPet.on("change", async function() {
    const checked = $(this).prop("checked");
    const settings3 = extension_settings[extensionName];
    if (checked) {
      try {
        const videoModeWasOff = !(settings3.enable_chatu8_fab_video === true || settings3.enable_chatu8_fab_video === "true");
        if (videoModeWasOff) {
          settings3.enable_chatu8_fab_video = true;
          $("#enable_chatu8_fab_video").prop("checked", true).trigger("change");
          applyFabSettings();
          await new Promise((r) => setTimeout(r, 1500));
        }
        const videoPlayer = getGlobalVideoPlayer();
        if (!videoPlayer || !videoPlayer.setPipBackground) {
          toastr.error("\u672A\u627E\u5230\u89C6\u9891\u64AD\u653E\u5668\uFF0C\u8BF7\u5148\u5728\u60AC\u6D6E\u7403\u8BBE\u7F6E\u4E2D\u542F\u7528\u89C6\u9891\u5F62\u8C61", "\u72EC\u7ACB\u7A97\u53E3");
          $(this).prop("checked", false);
          return;
        }
        const glCanvas = document.getElementById("st-chatu8-fab-video-canvas");
        if (!glCanvas) {
          toastr.error("\u672A\u627E\u5230\u89C6\u9891\u753B\u5E03\u5143\u7D20\uFF0C\u8BF7\u5148\u5728\u60AC\u6D6E\u7403\u8BBE\u7F6E\u4E2D\u542F\u7528\u89C6\u9891\u5F62\u8C61", "\u72EC\u7ACB\u7A97\u53E3");
          $(this).prop("checked", false);
          return;
        }
        videoPlayer.setPipBackground(true);
        const stream = glCanvas.captureStream(30);
        pipVideoElement = document.createElement("video");
        pipVideoElement.id = "st-chatu8-pip-video-assistant";
        pipVideoElement.srcObject = stream;
        pipVideoElement.muted = true;
        pipVideoElement.autoplay = true;
        pipVideoElement.playsInline = true;
        pipVideoElement.style.cssText = "display:none;position:fixed;opacity:0;pointer-events:none;";
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
          checkDesktopPet.prop("checked", false);
          toastr.info("\u753B\u4E2D\u753B\u5DF2\u5173\u95ED\uFF0C\u667A\u7ED8\u59EC\u56DE\u5230\u6D4F\u89C8\u5668\u5185", "\u72EC\u7ACB\u7A97\u53E3");
        });
        toastr.success("\u667A\u7ED8\u59EC\u5DF2\u5F39\u51FA\u5230\u753B\u4E2D\u753B\u7A97\u53E3\uFF0C\u53EF\u7F6E\u9876\u663E\u793A\u5728\u5176\u4ED6\u5E94\u7528\u4E0A\u65B9", "\u72EC\u7ACB\u7A97\u53E3");
      } catch (err) {
        console.error("[st-chatu8] \u667A\u7ED8\u59ECAI\u52A9\u624B\u521B\u5EFA\u753B\u4E2D\u753B\u5931\u8D25:", err);
        const vp = getGlobalVideoPlayer();
        if (vp && vp.setPipBackground) {
          vp.setPipBackground(false);
        }
        if (pipVideoElement) {
          pipVideoElement.srcObject = null;
          pipVideoElement.remove();
          pipVideoElement = null;
        }
        $(this).prop("checked", false);
        if (err.name === "NotAllowedError") {
          toastr.warning("\u753B\u4E2D\u753B\u8BF7\u6C42\u88AB\u62D2\u7EDD\u3002\u8BF7\u786E\u4FDD\u901A\u8FC7\u7528\u6237\u64CD\u4F5C\uFF08\u5982\u70B9\u51FB\uFF09\u89E6\u53D1\uFF0C\u4E14\u6D4F\u89C8\u5668\u5141\u8BB8\u753B\u4E2D\u753B\u3002", "\u72EC\u7ACB\u7A97\u53E3", { timeOut: 5e3 });
        } else {
          toastr.error("\u521B\u5EFA\u753B\u4E2D\u753B\u5931\u8D25\uFF1A" + err.message, "\u72EC\u7ACB\u7A97\u53E3", { timeOut: 5e3 });
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
  dom.checkFloorMessage.on("change", function() {
    const enabled = $(this).prop("checked");
    dom.dialog.find("#chatu8-ai-floor-settings").toggle(enabled);
    autoSaveSettings();
  });
  dom.floorCount.on("input", autoSaveSettings);
  checkKnowledgeBase.on("change", function() {
    const enabled = $(this).prop("checked");
    setKnowledgeBaseEnabled(enabled);
    const $kbNavLink = $('.st-chatu8-nav-link[data-tab="knowledgeBase"]');
    if ($kbNavLink.length) {
      $kbNavLink.toggle(enabled);
    }
    if (enabled) {
      toastr?.success("\u8D44\u6599\u5E93\u529F\u80FD\u5DF2\u5F00\u542F\uFF01\u8BF7\u524D\u5F80\u5DE6\u4FA7\u8BBE\u7F6E\u9762\u677F\u7684\u300C\u8D44\u6599\u5E93\u300D\u9875\u9762\u6DFB\u52A0\u548C\u7BA1\u7406\u4F60\u7684\u53C2\u8003\u8D44\u6599\u3002");
    }
  });
  settingsPanel.on("click", ".st-chatu8-ai-settings-tab", function() {
    const tabName = $(this).data("settings-tab");
    settingsPanel.find(".st-chatu8-ai-settings-tab").removeClass("active");
    $(this).addClass("active");
    settingsPanel.find(".st-chatu8-ai-settings-tab-content").removeClass("active");
    settingsPanel.find(`.st-chatu8-ai-settings-tab-content[data-settings-tab-content="${tabName}"]`).addClass("active");
  });
  inputMaxTokens.on("input", autoSaveSettings);
  inputTemperature.on("input", autoSaveSettings);
  inputTopP.on("input", autoSaveSettings);
  saveSettingsBtn.on("click", function() {
    autoSaveSettings();
    settingsPanel.removeClass("active");
  });
  closeBtn.on("click", function() {
    dialog.removeClass("active");
  });
  selectModel.on("change", function() {
    const selectedModel = $(this).val();
    if (selectedModel) {
      inputModel.val(selectedModel);
      inputModel.trigger("input");
    }
  });
  fetchModelsBtn.on("click", async function() {
    if (dom.checkUseLlmApi?.is(":checked")) {
      toastr?.info("\u5F53\u524D\u5DF2\u542F\u7528\u300C\u4F7F\u7528 LLM \u754C\u9762 API \u914D\u7F6E\u300D\uFF0C\u8BF7\u5728\u4E3B\u754C\u9762\u7684\u300CLLM \u8BBE\u7F6E -> API \u914D\u7F6E\u300D\u4E2D\u7BA1\u7406\u548C\u83B7\u53D6\u6A21\u578B\u3002");
      return;
    }
    const baseUrl = inputApiUrl.val().trim();
    const apiKey = inputApiKey.val().trim();
    const bypassProxy = dom.checkBypassProxy.is(":checked");
    if (!baseUrl || !apiKey) {
      toastr?.warning("\u8BF7\u5148\u914D\u7F6E API \u5730\u5740\u548C API Key\u3002");
      return;
    }
    const originalHtml = fetchModelsBtn.html();
    fetchModelsBtn.html('<i class="fa-solid fa-spinner fa-spin"></i>');
    fetchModelsBtn.prop("disabled", true);
    const customApiUrl = baseUrl.replace(/\/$/, "");
    try {
      let response;
      if (bypassProxy) {
        const directModelsUrl = customApiUrl + "/models";
        response = await fetch(directModelsUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          }
        });
      } else {
        const proxyUrl = "/api/backends/chat-completions/status";
        response = await fetch(proxyUrl, {
          method: "POST",
          headers: getRequestHeaders(window.token),
          body: JSON.stringify({
            chat_completion_source: "custom",
            custom_url: customApiUrl,
            custom_include_headers: `Authorization: "Bearer ${apiKey}"`
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
        if (data.error === true) {
          throw new Error("\u9152\u9986\u540E\u7AEF\u4EE3\u7406\u8FDE\u63A5\u5931\u8D25\uFF1AAPI Key \u9519\u8BEF/\u65E0\u6548\uFF0C\u6216 API \u5730\u5740\u65E0\u6CD5\u8FDE\u63A5 (401/404)");
        }
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
      const currentlySelected = (inputModel.val() || selectModel.val() || "").trim();
      selectModel.empty();
      selectModel.append('<option value="">(\u8BF7\u5148\u83B7\u53D6\u5E76\u9009\u62E9\u6A21\u578B)</option>');
      models.forEach((model) => {
        selectModel.append(new Option(model.id, model.id));
      });
      if (currentlySelected && models.some((m) => m.id === currentlySelected)) {
        selectModel.val(currentlySelected);
        inputModel.val(currentlySelected);
      }
      toastr?.success(`\u6210\u529F\u83B7\u53D6 ${models.length} \u4E2A\u6A21\u578B\u3002`);
    } catch (error) {
      toastr?.error(error.message || `\u83B7\u53D6\u6A21\u578B\u5931\u8D25: ${error}`);
    } finally {
      fetchModelsBtn.html(originalHtml);
      fetchModelsBtn.prop("disabled", false);
    }
  });
}

export { checkAndShowSettings, initDialogEvents };
