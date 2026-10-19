// 还原自打包产物 — 原始模块: utils/assistant/assistantContext.js
var activeChat, chatIndex, chatSessions, currentSystemMsgContent, currentSystemMsgElement, dom, initialized, isAiGenerating, markedLoadPromise, markedLoaded, pendingCommand, pendingImageGenerations, refreshSettingsPanelFn, selectedImages2, ttsActiveMessageIndex, ttsAudioCache, ttsButtonState, ttsCollectingBlobUrls, ttsCollectingTotalSegments, ttsCurrentRequestId, v2Ready;

chatSessions = {
      activeChatId: null,
      chats: {}
    };

chatIndex = { version: 2, activeChatId: null, chatList: [] };

activeChat = null;

v2Ready = false;

initialized = false;

isAiGenerating = false;

refreshSettingsPanelFn = null;

pendingImageGenerations = /* @__PURE__ */ new Map();

ttsAudioCache = /* @__PURE__ */ new Map();

ttsActiveMessageIndex = -1;

ttsCurrentRequestId = "";

ttsButtonState = "idle";

ttsCollectingBlobUrls = [];

ttsCollectingTotalSegments = 0;

currentSystemMsgElement = null;

currentSystemMsgContent = null;

selectedImages2 = [];

pendingCommand = null;

markedLoaded = false;

markedLoadPromise = null;

dom = {
      // 主对话框
      dialog: null,
      chatBody: null,
      header: null,
      closeBtn: null,
      sendBtn: null,
      inputArea: null,
      triggerBtn: null,
      // 图片相关
      imageBtn: null,
      imageInput: null,
      imagePreview: null,
      // 设置面板
      settingsBtn: null,
      settingsPanel: null,
      settingsCloseBtn: null,
      saveSettingsBtn: null,
      checkUseLlmApi: null,
      inputApiUrl: null,
      inputApiKey: null,
      inputModel: null,
      selectModel: null,
      selectSystemPrompt: null,
      fetchModelsBtn: null,
      checkBypassProxy: null,
      checkSendImages: null,
      checkUseToolCall: null,
      checkStream: null,
      inputMaxTokens: null,
      inputTemperature: null,
      inputTopP: null,
      checkAutoExecute: null,
      checkKnowledgeBase: null,
      checkTTSEnabled: null,
      checkASREnabled: null,
      // TTS 设置
      ttsSettingsPanel: null,
      ttsScopeSelect: null,
      ttsEngineSelect: null,
      ttsQwenOptions: null,
      ttsQwenVoiceSelect: null,
      ttsEdgeOptions: null,
      ttsEdgeVoiceSelect: null,
      ttsEdgeStyleSelect: null,
      ttsEdgeRateSlider: null,
      ttsEdgeRateVal: null,
      ttsEdgePitchSlider: null,
      ttsEdgePitchVal: null,
      ttsEdgePingBtn: null,
      ttsEdgePingStatus: null,
      // ASR 设置
      asrSettingsPanel: null,
      asrMicBtn: null,
      asrConvModeSelect: null,
      asrSilenceSlider: null,
      asrSilenceVal: null,
      asrVadSlider: null,
      asrVadVal: null,
      asrMaxKeepSlider: null,
      asrMaxKeepVal: null,
      asrLanguageSelect: null,
      asrAppendSelect: null,
      // ASR 麦克风测试
      asrMicTestBtn: null,
      asrMicTestMeter: null,
      asrMicTestBar: null,
      asrMicTestVadLine: null,
      asrMicTestLabel: null,
      asrMicTestStatus: null,
      // 独立窗口
      checkDesktopPet: null,
      // 屏幕共享
      checkScreenShare: null,
      checkBrowserCapture: null,
      screenShareIndicator: null,
      browserCaptureIndicator: null,
      // 楼层信息
      checkFloorMessage: null,
      floorStatus: null,
      floorCount: null,
      floorIndicator: null,
      // 历史记录面板
      newChatBtn: null,
      historyBtn: null,
      historyPanel: null,
      historyCloseBtn: null,
      historyList: null,
      exportChatBtn: null,
      selectAllBtn: null,
      deselectAllBtn: null,
      // 聊天总结
      summaryBtn: null,
      summaryManager: null
    };

function setChatIndex(val) {
  chatIndex = val;
}

function setActiveChat(val) {
  activeChat = val;
  if (val) {
    chatSessions.activeChatId = val.id;
    chatSessions.chats[val.id] = val;
  }
}

function setV2Ready(val) {
  v2Ready = val;
}

function setInitialized(val) {
  initialized = val;
}

function setIsAiGenerating(val) {
  isAiGenerating = val;
}

function setRefreshSettingsPanelFn(val) {
  refreshSettingsPanelFn = val;
}

function setTtsActiveMessageIndex(val) {
  ttsActiveMessageIndex = val;
}

function setTtsCurrentRequestId(val) {
  ttsCurrentRequestId = val;
}

function setTtsButtonState(val) {
  ttsButtonState = val;
}

function setTtsCollectingBlobUrls(val) {
  ttsCollectingBlobUrls = val;
}

function setTtsCollectingTotalSegments(val) {
  ttsCollectingTotalSegments = val;
}

function setCurrentSystemMsgElement(val) {
  currentSystemMsgElement = val;
}

function setCurrentSystemMsgContent(val) {
  currentSystemMsgContent = val;
}

function setSelectedImages(val) {
  selectedImages2 = val;
}

function setPendingCommand(val) {
  pendingCommand = val;
}

function setMarkedLoaded(val) {
  markedLoaded = val;
}

function setMarkedLoadPromise(val) {
  markedLoadPromise = val;
}

function initDomRefs(dialog) {
  dom.dialog = dialog;
  dom.triggerBtn = $("#st-chatu8-ai-trigger");
  dom.chatBody = dialog.find("#st-chatu8-ai-chat-body");
  dom.header = dialog.find(".st-chatu8-ai-dialog-header");
  dom.closeBtn = dialog.find("#st-chatu8-ai-close");
  dom.sendBtn = dialog.find("#st-chatu8-ai-send");
  dom.inputArea = dialog.find("#st-chatu8-ai-input");
  dom.imageBtn = dialog.find("#st-chatu8-ai-image-btn");
  dom.imageInput = dialog.find("#st-chatu8-ai-image-input");
  dom.imagePreview = dialog.find("#st-chatu8-ai-image-preview");
  dom.settingsBtn = dialog.find("#st-chatu8-ai-settings-btn");
  dom.settingsPanel = dialog.find("#st-chatu8-ai-settings-panel");
  dom.settingsCloseBtn = dialog.find("#st-chatu8-ai-settings-close");
  dom.saveSettingsBtn = dialog.find("#st-chatu8-ai-save-settings");
  dom.checkUseLlmApi = dialog.find("#chatu8-ai-use-llm-api");
  dom.inputApiUrl = dialog.find("#chatu8-ai-api-url");
  dom.inputApiKey = dialog.find("#chatu8-ai-api-key");
  dom.inputModel = dialog.find("#chatu8-ai-model");
  dom.selectModel = dialog.find("#chatu8-ai-model-select");
  dom.selectSystemPrompt = dialog.find("#chatu8-ai-system-prompt");
  dom.fetchModelsBtn = dialog.find("#chatu8-ai-fetch-models");
  dom.checkBypassProxy = dialog.find("#chatu8-ai-bypass-proxy");
  dom.checkSendImages = dialog.find("#chatu8-ai-send-images");
  dom.checkUseToolCall = dialog.find("#chatu8-ai-use-tool-call");
  dom.checkStream = dialog.find("#chatu8-ai-stream");
  dom.inputMaxTokens = dialog.find("#chatu8-ai-max-tokens");
  dom.inputTemperature = dialog.find("#chatu8-ai-temperature");
  dom.inputTopP = dialog.find("#chatu8-ai-top-p");
  dom.checkAutoExecute = dialog.find("#chatu8-ai-auto-execute");
  dom.checkKnowledgeBase = dialog.find("#chatu8-ai-knowledge-base");
  dom.checkTTSEnabled = dialog.find("#chatu8-ai-tts-enabled");
  dom.checkASREnabled = dialog.find("#chatu8-ai-asr-enabled");
  dom.ttsSettingsPanel = dialog.find("#chatu8-ai-tts-settings");
  dom.ttsScopeSelect = dialog.find("#chatu8-ai-tts-scope");
  dom.ttsEngineSelect = dialog.find("#chatu8-ai-tts-engine");
  dom.ttsQwenOptions = dialog.find("#chatu8-ai-tts-qwen-options");
  dom.ttsQwenVoiceSelect = dialog.find("#chatu8-ai-tts-qwen-voice");
  dom.ttsEdgeOptions = dialog.find("#chatu8-ai-tts-edge-options");
  dom.ttsEdgeVoiceSelect = dialog.find("#chatu8-ai-tts-edge-voice");
  dom.ttsEdgeStyleSelect = dialog.find("#chatu8-ai-tts-edge-style");
  dom.ttsEdgeRateSlider = dialog.find("#chatu8-ai-tts-edge-rate");
  dom.ttsEdgeRateVal = dialog.find("#chatu8-ai-tts-edge-rate-val");
  dom.ttsEdgePitchSlider = dialog.find("#chatu8-ai-tts-edge-pitch");
  dom.ttsEdgePitchVal = dialog.find("#chatu8-ai-tts-edge-pitch-val");
  dom.ttsEdgePingBtn = dialog.find("#chatu8-ai-tts-edge-ping");
  dom.ttsEdgePingStatus = dialog.find("#chatu8-ai-tts-edge-ping-status");
  dom.asrSettingsPanel = dialog.find("#chatu8-ai-asr-settings");
  dom.asrMicBtn = dialog.find("#st-chatu8-ai-mic-btn");
  dom.asrConvModeSelect = dialog.find("#chatu8-ai-asr-conv-mode");
  dom.asrSilenceSlider = dialog.find("#chatu8-ai-asr-silence-timeout");
  dom.asrSilenceVal = dialog.find("#chatu8-ai-asr-silence-timeout-val");
  dom.asrVadSlider = dialog.find("#chatu8-ai-asr-vad-threshold");
  dom.asrVadVal = dialog.find("#chatu8-ai-asr-vad-threshold-val");
  dom.asrMaxKeepSlider = dialog.find("#chatu8-ai-asr-max-keep");
  dom.asrMaxKeepVal = dialog.find("#chatu8-ai-asr-max-keep-val");
  dom.asrLanguageSelect = dialog.find("#chatu8-ai-asr-language");
  dom.asrAppendSelect = dialog.find("#chatu8-ai-asr-append");
  dom.asrAutoSendCheckbox = dialog.find("#chatu8-ai-asr-auto-send");
  dom.asrMicTestBtn = dialog.find("#chatu8-ai-asr-mic-test-btn");
  dom.asrMicTestMeter = dialog.find("#chatu8-ai-asr-mic-test-meter");
  dom.asrMicTestBar = dialog.find("#chatu8-ai-asr-meter-bar");
  dom.asrMicTestVadLine = dialog.find("#chatu8-ai-asr-meter-vad-line");
  dom.asrMicTestLabel = dialog.find("#chatu8-ai-asr-meter-label");
  dom.asrMicTestStatus = dialog.find("#chatu8-ai-asr-meter-status");
  dom.checkDesktopPet = dialog.find("#chatu8-ai-desktop-pet");
  dom.checkScreenShare = dialog.find("#chatu8-ai-screen-share");
  dom.checkBrowserCapture = dialog.find("#chatu8-ai-browser-capture");
  dom.screenShareIndicator = dialog.find("#st-chatu8-ai-screen-share-indicator");
  dom.browserCaptureIndicator = dialog.find("#st-chatu8-ai-browser-capture-indicator");
  dom.checkFloorMessage = dialog.find("#chatu8-ai-floor-message");
  dom.floorStatus = dialog.find("#chatu8-ai-floor-status");
  dom.floorCount = dialog.find("#chatu8-ai-floor-count");
  dom.floorIndicator = dialog.find("#st-chatu8-ai-floor-indicator");
  dom.newChatBtn = dialog.find("#st-chatu8-ai-new-chat");
  dom.historyBtn = dialog.find("#st-chatu8-ai-history-btn");
  dom.historyPanel = dialog.find("#st-chatu8-ai-history-panel");
  dom.historyCloseBtn = dialog.find("#st-chatu8-ai-history-close");
  dom.historyList = dialog.find("#st-chatu8-ai-history-list");
  dom.exportChatBtn = dialog.find("#st-chatu8-ai-export-chat");
  dom.selectAllBtn = dialog.find("#st-chatu8-ai-select-all");
  dom.deselectAllBtn = dialog.find("#st-chatu8-ai-deselect-all");
  dom.summaryBtn = dialog.find("#st-chatu8-ai-summary-btn");
  dom.summaryManager = dialog.find("#st-chatu8-summary-manager");
}

export { activeChat, chatIndex, currentSystemMsgContent, currentSystemMsgElement, dom, initDomRefs, initialized, isAiGenerating, markedLoadPromise, markedLoaded, pendingCommand, pendingImageGenerations, refreshSettingsPanelFn, selectedImages2, setActiveChat, setChatIndex, setCurrentSystemMsgContent, setCurrentSystemMsgElement, setInitialized, setIsAiGenerating, setMarkedLoadPromise, setMarkedLoaded, setPendingCommand, setRefreshSettingsPanelFn, setSelectedImages, setTtsActiveMessageIndex, setTtsButtonState, setTtsCollectingBlobUrls, setTtsCollectingTotalSegments, setTtsCurrentRequestId, setV2Ready, ttsActiveMessageIndex, ttsAudioCache, ttsButtonState, ttsCollectingBlobUrls, ttsCollectingTotalSegments };
