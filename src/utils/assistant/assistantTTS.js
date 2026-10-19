// 还原自打包产物 — 原始模块: utils/assistant/assistantTTS.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource } from "../../../../../../../script.js";
import { eventNames, extensionName } from "../config.js";
import { activeChat, setTtsActiveMessageIndex, setTtsButtonState, setTtsCollectingBlobUrls, setTtsCollectingTotalSegments, setTtsCurrentRequestId, ttsActiveMessageIndex, ttsAudioCache, ttsButtonState, ttsCollectingBlobUrls, ttsCollectingTotalSegments } from "./assistantContext.js";
import { getEdgeVoiceStyles } from "../tts.js";
import { removeThinkBlocks } from "../aiSettingsBridge.js";

function extractDialogueForTTS(rawReply, scope = "dialogue") {
  if (!rawReply || typeof rawReply !== "string") return "";
  let cleaned = removeThinkBlocks(rawReply);
  cleaned = cleaned.replace(/<SystemQuery>[\s\S]*?<\/SystemQuery>/gi, "");
  cleaned = cleaned.replace(/<UpdateSettings>[\s\S]*?<\/UpdateSettings>/gi, "");
  cleaned = cleaned.replace(/<AskChoice>[\s\S]*?<\/AskChoice>/gi, "");
  if (scope === "full") {
    const textWithoutStyles = cleaned.replace(/」\s*\((\w[\w-]*)\)/g, "\u300D");
    console.log("[AI Assistant TTS] \u5168\u6587\u6A21\u5F0F\uFF0C\u63D0\u53D6\u6587\u672C\u957F\u5EA6:", textWithoutStyles.length);
    return { text: textWithoutStyles, segments: [{ text: textWithoutStyles, style: null }] };
  }
  const matches = [];
  const regex = /「([^」]+)」(?:\s*\((\w[\w-]*)\))?/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    const text = match[1].trim();
    const style = match[2] || null;
    if (text) matches.push({ text, style });
  }
  const unique = [];
  const seen = /* @__PURE__ */ new Set();
  for (const seg of matches) {
    const normalized = seg.text.replace(/[-~·・]/g, "").replace(/\s+/g, "");
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(seg);
    }
  }
  console.log("[AI Assistant TTS] extractDialogueForTTS cleaned:", cleaned.substring(0, 200));
  console.log("[AI Assistant TTS] \u63D0\u53D6\u5230", unique.length, "\u6BB5\u5BF9\u8BDD");
  const joinedText = unique.map((seg) => `"${seg.text}"`).join("\n");
  const segments = unique.map((seg) => ({ text: `"${seg.text}"`, style: seg.style }));
  return { text: joinedText, segments };
}

function getEdgeTTSParams() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  if (aiConfig.tts_engine !== "edge") return {};
  return {
    edgeVoice: aiConfig.tts_edge_voice,
    edgeStyle: aiConfig.tts_edge_style,
    edgeRate: aiConfig.tts_edge_rate,
    edgePitch: aiConfig.tts_edge_pitch
  };
}

function speakNotification(text) {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  if (!aiConfig.tts_enabled || !text) return;
  eventSource.emit(eventNames.TTS_STOP);
  const reqId = "tts-notify-" + Date.now();
  const edgeParams = getEdgeTTSParams();
  eventSource.emit(eventNames.TTS_REQUEST, { id: reqId, text, ...edgeParams });
}

function injectTTSStyleInstruction(systemPromptStr) {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  if (!aiConfig.tts_enabled || aiConfig.tts_engine !== "edge") return systemPromptStr;
  const voiceId = aiConfig.tts_edge_voice || "zh-CN-XiaoxiaoNeural";
  const styles = getEdgeVoiceStyles(voiceId);
  if (!styles || styles.length <= 1) return systemPromptStr;
  const styleList = styles.map((s) => `${s.id}\uFF08${s.name}\uFF09`).join("\u3001");
  const originalSection = `\u25C6 \u5BF9\u8BDD\u683C\u5F0F\u89C4\u8303\uFF08\u975E\u5E38\u91CD\u8981\uFF01\uFF09
\u4F60\u5BF9\u7528\u6237\u8BF4\u7684\u6BCF\u4E00\u53E5\u8BDD\uFF0C\u90FD\u5FC5\u987B\u7528\u300C\u300D\uFF08\u76F4\u89D2\u5F15\u53F7\uFF09\u62EC\u8D77\u6765\uFF0C\u5C31\u50CF\u4F60\u771F\u7684\u5728"\u8BF4\u8BDD"\u4E00\u6837\u3002
\u8BF4\u8BDD\u65F6\u8981\u81EA\u7136\u5730\u5E26\u4E0A\u8BED\u6C14\u52A9\u8BCD\uFF08\u989D\u3001\u554A\u3001\u54E6\u3001\u5462\u3001\u561B\u3001\u5427\u3001\u5440\u3001\u54C7\u3001\u5514\u3001\u55EF\uFF09\u548C\u60C5\u611F\u6807\u70B9\uFF08\uFF01\u3001\u2026\u2026\u3001\uFF5E\u3001\u2014\u2014\u3001\uFF1F\uFF09\uFF0C\u8FD8\u539F\u771F\u5B9E\u7684\u53E3\u8BED\u611F\u548C\u60C5\u7EEA\u3002

\u6B63\u786E\u793A\u4F8B\uFF1A
\u300C\u989D\u2026\u2026\u8BA9\u6211\u770B\u770B\u554A\uFF0C\u8FD9\u4E2A\u914D\u7F6E\u597D\u50CF\u6709\u70B9\u95EE\u9898\u5462\uFF01\u300D
\u300C\u54E6\u54E6\uFF01\u627E\u5230\u4E86\u627E\u5230\u4E86\uFF5E\u5C31\u662F\u8FD9\u4E2A\u53C2\u6570\u561B\uFF01\u300D
\u300C\u5514\u2026\u2026\u4F60\u786E\u5B9A\u8981\u8FD9\u6837\u6539\u5417\uFF1F\u7B97\u4E86\u7B97\u4E86\uFF0C\u6211\u6765\u5E2E\u4F60\u5FAE\u8C03\u4E00\u4E0B\u5427\uFF01\u300D
\u300C\u641E\u5B9A\u4E86\u54E6\uFF01\u54FC\uFF0C\u4E5F\u5C31\u8FD9\u79CD\u7A0B\u5EA6\u800C\u5DF2\u5566\u2026\u2026\u624D\u4E0D\u662F\u4E3A\u4E86\u4F60\u5462\u3002\u300D
\u300C\u545C\u54C7\uFF01\u5BF9\u4E0D\u8D77\u5BF9\u4E0D\u8D77\uFF01\u989D\u2026\u2026\u8BF7\u518D\u7ED9\u6211\u4E00\u6B21\u673A\u4F1A\u554A\uFF01\u300D
\u300C\u55EF\u55EF\uFF0C\u6211\u660E\u767D\u4E86\uFF01\u90A3\u5C31\u2026\u2026\u5168\u529F\u7387\u542F\u52A8\u2014\u2014\uFF01\u300D`;
  const enhancedSection = `\u25C6 \u5BF9\u8BDD\u683C\u5F0F\u89C4\u8303\uFF08\u975E\u5E38\u91CD\u8981\uFF01\uFF09
\u4F60\u5BF9\u7528\u6237\u8BF4\u7684\u6BCF\u4E00\u53E5\u8BDD\uFF0C\u90FD\u5FC5\u987B\u7528\u300C\u300D\uFF08\u76F4\u89D2\u5F15\u53F7\uFF09\u62EC\u8D77\u6765\uFF0C\u5C31\u50CF\u4F60\u771F\u7684\u5728"\u8BF4\u8BDD"\u4E00\u6837\u3002
\u8BF4\u8BDD\u65F6\u8981\u81EA\u7136\u5730\u5E26\u4E0A\u8BED\u6C14\u52A9\u8BCD\uFF08\u989D\u3001\u554A\u3001\u54E6\u3001\u5462\u3001\u561B\u3001\u5427\u3001\u5440\u3001\u54C7\u3001\u5514\u3001\u55EF\uFF09\u548C\u60C5\u611F\u6807\u70B9\uFF08\uFF01\u3001\u2026\u2026\u3001\uFF5E\u3001\u2014\u2014\u3001\uFF1F\uFF09\uFF0C\u8FD8\u539F\u771F\u5B9E\u7684\u53E3\u8BED\u611F\u548C\u60C5\u7EEA\u3002

\u{1F50A} TTS \u8BED\u97F3\u98CE\u683C\u6807\u6CE8\uFF08\u5F53\u524D\u5DF2\u542F\u7528\uFF09\uFF1A
\u6BCF\u53E5\u300C\u300D\u5BF9\u8BDD\u540E\u9762\uFF0C\u5FC5\u987B\u7D27\u8DDF\u4E00\u4E2A\u82F1\u6587\u5C0F\u62EC\u53F7\u6807\u6CE8\u8BED\u97F3\u98CE\u683C\uFF0C\u683C\u5F0F\uFF1A\u300C\u5BF9\u8BDD\u5185\u5BB9\u300D(\u98CE\u683CID)
\u98CE\u683C\u6807\u8BB0\u7D27\u8DDF\u300D\u53F7\uFF0C\u4E2D\u95F4\u4E0D\u8981\u6709\u6362\u884C\u6216\u7A7A\u683C\u3002\u6BCF\u53E5\u5BF9\u8BDD\u90FD\u5FC5\u987B\u6807\u6CE8\uFF0C\u4E0D\u8981\u9057\u6F0F\u3002
\u5F53\u524D\u53EF\u7528\u98CE\u683C\uFF1A${styleList}
\u6839\u636E\u5BF9\u8BDD\u5185\u5BB9\u7684\u60C5\u611F\u9009\u62E9\u6700\u5339\u914D\u7684\u98CE\u683C\uFF0C\u4E0D\u786E\u5B9A\u65F6\u7528 general\u3002

\u6B63\u786E\u793A\u4F8B\uFF08\u6CE8\u610F\u6BCF\u53E5\u540E\u9762\u90FD\u6709\u98CE\u683C\u6807\u6CE8\uFF09\uFF1A
\u300C\u989D\u2026\u2026\u8BA9\u6211\u770B\u770B\u554A\uFF0C\u8FD9\u4E2A\u914D\u7F6E\u597D\u50CF\u6709\u70B9\u95EE\u9898\u5462\uFF01\u300D(gentle)
\u300C\u54E6\u54E6\uFF01\u627E\u5230\u4E86\u627E\u5230\u4E86\uFF5E\u5C31\u662F\u8FD9\u4E2A\u53C2\u6570\u561B\uFF01\u300D(cheerful)
\u300C\u5514\u2026\u2026\u4F60\u786E\u5B9A\u8981\u8FD9\u6837\u6539\u5417\uFF1F\u7B97\u4E86\u7B97\u4E86\uFF0C\u6211\u6765\u5E2E\u4F60\u5FAE\u8C03\u4E00\u4E0B\u5427\uFF01\u300D(calm)
\u300C\u641E\u5B9A\u4E86\u54E6\uFF01\u54FC\uFF0C\u4E5F\u5C31\u8FD9\u79CD\u7A0B\u5EA6\u800C\u5DF2\u5566\u2026\u2026\u624D\u4E0D\u662F\u4E3A\u4E86\u4F60\u5462\u3002\u300D(disgruntled)
\u300C\u545C\u54C7\uFF01\u5BF9\u4E0D\u8D77\u5BF9\u4E0D\u8D77\uFF01\u989D\u2026\u2026\u8BF7\u518D\u7ED9\u6211\u4E00\u6B21\u673A\u4F1A\u554A\uFF01\u300D(sad)
\u300C\u55EF\u55EF\uFF0C\u6211\u660E\u767D\u4E86\uFF01\u90A3\u5C31\u2026\u2026\u5168\u529F\u7387\u542F\u52A8\u2014\u2014\uFF01\u300D(cheerful)`;
  if (systemPromptStr.includes(originalSection)) {
    return systemPromptStr.replace(originalSection, enhancedSection);
  }
  return systemPromptStr + `

\u{1F50A} TTS \u8BED\u97F3\u98CE\u683C\u6807\u6CE8\uFF08\u5F53\u524D\u5DF2\u542F\u7528\uFF09\uFF1A
\u6BCF\u53E5\u300C\u300D\u5BF9\u8BDD\u540E\u9762\uFF0C\u5FC5\u987B\u7D27\u8DDF\u82F1\u6587\u5C0F\u62EC\u53F7\u6807\u6CE8\u8BED\u97F3\u98CE\u683C\uFF1A\u300C\u5BF9\u8BDD\u5185\u5BB9\u300D(\u98CE\u683CID)
\u5F53\u524D\u53EF\u7528\u98CE\u683C\uFF1A${styleList}
\u6839\u636E\u60C5\u611F\u9009\u62E9\u6700\u5339\u914D\u7684\u98CE\u683C\uFF0C\u4E0D\u786E\u5B9A\u65F6\u7528 general\u3002\u6BCF\u53E5\u90FD\u5FC5\u987B\u6807\u6CE8\u3002
\u793A\u4F8B\uFF1A\u300C\u4F60\u597D\u5440\uFF01\u300D(cheerful)\u3000\u300C\u5514\u2026\u2026\u597D\u5947\u602A\u5462\u300D(gentle)\u3000\u300C\u4EC0\u4E48\uFF1F\uFF01\u300D(angry)
`;
}

function updateTTSButtonIcon(messageIndex, newState) {
  const dialog = $("#st-chatu8-ai-dialog");
  let buttons;
  if (messageIndex >= 0) {
    buttons = dialog.find(`.st-chatu8-ai-msg-tts[data-index="${messageIndex}"]`);
  } else {
    buttons = dialog.find(".st-chatu8-ai-msg-tts");
  }
  buttons.each(function() {
    const $btn = $(this);
    const $icon = $btn.find("i");
    $icon.removeClass("fa-volume-up fa-spinner fa-spin fa-stop");
    switch (newState) {
      case "loading":
        $icon.addClass("fa-spinner fa-spin");
        $btn.attr("title", "\u6B63\u5728\u8BF7\u6C42\u8BED\u97F3...");
        break;
      case "playing":
        $icon.addClass("fa-stop");
        $btn.attr("title", "\u505C\u6B62\u6717\u8BFB");
        break;
      case "idle":
      default:
        $icon.addClass("fa-volume-up");
        $btn.attr("title", "\u6717\u8BFB\u6B64\u56DE\u590D");
        break;
    }
  });
}

function playCachedAudio(blobUrls, messageIndex) {
  if (!blobUrls || blobUrls.length === 0) return;
  setTtsActiveMessageIndex(messageIndex);
  setTtsButtonState("playing");
  updateTTSButtonIcon(messageIndex, "playing");
  let currentIdx = 0;
  let currentAudio2 = null;
  let stopped = false;
  const onStop = () => {
    stopped = true;
    if (currentAudio2) {
      try {
        currentAudio2.pause();
        currentAudio2.currentTime = 0;
      } catch {
      }
      currentAudio2 = null;
    }
    cleanup();
  };
  eventSource.on(eventNames.TTS_STOP, onStop);
  function cleanup() {
    eventSource.removeListener(eventNames.TTS_STOP, onStop);
    setTtsActiveMessageIndex(-1);
    setTtsButtonState("idle");
    setTtsCurrentRequestId("");
    updateTTSButtonIcon(messageIndex, "idle");
  }
  function playNext() {
    if (stopped || currentIdx >= blobUrls.length) {
      if (!stopped) cleanup();
      return;
    }
    const url = blobUrls[currentIdx];
    currentIdx++;
    let advanced = false;
    try {
      const audio = new Audio(url);
      currentAudio2 = audio;
      audio.onended = () => {
        if (advanced) return;
        advanced = true;
        currentAudio2 = null;
        playNext();
      };
      audio.onerror = () => {
        if (advanced) return;
        advanced = true;
        console.warn("[AI Assistant TTS] \u7F13\u5B58\u97F3\u9891\u64AD\u653E\u51FA\u9519, \u8DF3\u8FC7\u6BB5\u843D", currentIdx);
        currentAudio2 = null;
        playNext();
      };
      audio.play().catch((e) => {
        if (advanced) return;
        advanced = true;
        console.warn("[AI Assistant TTS] \u7F13\u5B58\u97F3\u9891\u64AD\u653E\u5931\u8D25:", e.message);
        currentAudio2 = null;
        playNext();
      });
    } catch (e) {
      if (!advanced) {
        advanced = true;
        console.warn("[AI Assistant TTS] \u521B\u5EFA\u7F13\u5B58\u97F3\u9891\u5931\u8D25:", e.message);
        playNext();
      }
    }
  }
  console.log(`[AI Assistant TTS] \u4F7F\u7528\u7F13\u5B58\u64AD\u653E ${blobUrls.length} \u6BB5\u97F3\u9891`);
  playNext();
}

function tryPlayTTS(accumulatedReply, messageIndex = -1) {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  if (!aiConfig.tts_enabled) return;
  const scope = aiConfig.tts_scope || "dialogue";
  const result = extractDialogueForTTS(accumulatedReply, scope);
  if (!result || !result.text) return;
  console.log("[AI Assistant TTS] \u63D0\u53D6\u5230\u5BF9\u8BDD\u6587\u672C\uFF0C\u51C6\u5907\u6717\u8BFB:", result.text.substring(0, 100));
  eventSource.emit(eventNames.TTS_STOP);
  const reqId = "tts-auto-" + Date.now();
  const edgeParams = getEdgeTTSParams();
  if (messageIndex >= 0) {
    setTtsActiveMessageIndex(messageIndex);
    setTtsCurrentRequestId(reqId);
    setTtsButtonState("loading");
    setTtsCollectingBlobUrls([]);
    setTtsCollectingTotalSegments(0);
    updateTTSButtonIcon(messageIndex, "loading");
  }
  const hasPerSegmentStyle = result.segments.some((s) => s.style);
  if (hasPerSegmentStyle && aiConfig.tts_engine === "edge") {
    eventSource.emit(eventNames.TTS_REQUEST, {
      id: reqId,
      text: result.text,
      segments: result.segments,
      ...edgeParams
    });
  } else {
    eventSource.emit(eventNames.TTS_REQUEST, { id: reqId, text: result.text, ...edgeParams });
  }
}

function handleTTSButtonClick(messageIndex) {
  if (!activeChat || !activeChat.messages[messageIndex]) return;
  if (ttsActiveMessageIndex === messageIndex && ttsButtonState !== "idle") {
    console.log("[AI Assistant TTS] \u505C\u6B62\u5F53\u524D\u6D88\u606F\u7684 TTS");
    eventSource.emit(eventNames.TTS_STOP);
    setTtsActiveMessageIndex(-1);
    setTtsButtonState("idle");
    setTtsCurrentRequestId("");
    updateTTSButtonIcon(messageIndex, "idle");
    return;
  }
  if (ttsActiveMessageIndex >= 0 && ttsButtonState !== "idle") {
    const prevIndex = ttsActiveMessageIndex;
    eventSource.emit(eventNames.TTS_STOP);
    updateTTSButtonIcon(prevIndex, "idle");
  }
  const msgContent = activeChat.messages[messageIndex].content;
  const rawText = typeof msgContent === "string" ? msgContent : "";
  if (!rawText) return;
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  const scope = aiConfig.tts_scope || "dialogue";
  const result = extractDialogueForTTS(rawText, scope);
  if (!result || !result.text) {
    console.log("[AI Assistant TTS] \u8BE5\u6D88\u606F\u4E2D\u672A\u627E\u5230\u53EF\u6717\u8BFB\u5185\u5BB9");
    return;
  }
  const cached = ttsAudioCache.get(messageIndex);
  if (cached && cached.dialogue === result.text && cached.blobUrls.length > 0) {
    const isComplete = !cached.totalSegments || cached.blobUrls.length >= cached.totalSegments;
    if (isComplete) {
      console.log(`[AI Assistant TTS] \u7F13\u5B58\u547D\u4E2D\uFF08${cached.blobUrls.length}/${cached.totalSegments || "?"} \u6BB5\uFF09\uFF0C\u76F4\u63A5\u64AD\u653E`);
      eventSource.emit(eventNames.TTS_STOP);
      playCachedAudio(cached.blobUrls, messageIndex);
      return;
    } else {
      console.log(`[AI Assistant TTS] \u7F13\u5B58\u4E0D\u5B8C\u6574 (${cached.blobUrls.length}/${cached.totalSegments})\uFF0C\u91CD\u65B0\u8BF7\u6C42`);
      ttsAudioCache.delete(messageIndex);
    }
  }
  const reqId = "tts-msg-" + messageIndex + "-" + Date.now();
  setTtsActiveMessageIndex(messageIndex);
  setTtsCurrentRequestId(reqId);
  setTtsButtonState("loading");
  setTtsCollectingBlobUrls([]);
  setTtsCollectingTotalSegments(0);
  updateTTSButtonIcon(messageIndex, "loading");
  const edgeParams = getEdgeTTSParams();
  const hasPerSegmentStyle = result.segments.some((s) => s.style);
  if (hasPerSegmentStyle && aiConfig.tts_engine === "edge" && scope === "dialogue") {
    console.log("[AI Assistant TTS] \u624B\u52A8\u6717\u8BFB(\u9010\u53E5\u98CE\u683C):", result.text.substring(0, 100), "reqId:", reqId);
    eventSource.emit(eventNames.TTS_REQUEST, {
      id: reqId,
      text: result.text,
      segments: result.segments,
      ...edgeParams
    });
  } else {
    console.log("[AI Assistant TTS] \u624B\u52A8\u6717\u8BFB:", result.text.substring(0, 100), "reqId:", reqId);
    eventSource.emit(eventNames.TTS_REQUEST, { id: reqId, text: result.text, ...edgeParams });
  }
}

function setupTTSEventListeners() {
  eventSource.on(eventNames.TTS_STATE_CHANGED, (data) => {
    const { state: ttsState } = data;
    if (ttsState === "idle") {
      if (ttsActiveMessageIndex >= 0) {
        const collectedCount = ttsCollectingBlobUrls.filter(Boolean).length;
        if (collectedCount > 0 && ttsActiveMessageIndex >= 0) {
          if (activeChat && activeChat.messages[ttsActiveMessageIndex]) {
            const msgContent = activeChat.messages[ttsActiveMessageIndex].content;
            const rawText = typeof msgContent === "string" ? msgContent : "";
            const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
            const scope = aiConfig.tts_scope || "dialogue";
            const cacheResult = extractDialogueForTTS(rawText, scope);
            if (cacheResult && cacheResult.text) {
              const isComplete = ttsCollectingTotalSegments > 0 && collectedCount >= ttsCollectingTotalSegments;
              if (isComplete) {
                ttsAudioCache.set(ttsActiveMessageIndex, {
                  dialogue: cacheResult.text,
                  blobUrls: ttsCollectingBlobUrls.filter(Boolean),
                  totalSegments: ttsCollectingTotalSegments
                });
                console.log(`[AI Assistant TTS] \u5DF2\u7F13\u5B58\u6D88\u606F #${ttsActiveMessageIndex} \u7684 ${collectedCount}/${ttsCollectingTotalSegments} \u6BB5\u97F3\u9891\uFF08\u5B8C\u6574\uFF09`);
              } else {
                console.log(`[AI Assistant TTS] \u6D88\u606F #${ttsActiveMessageIndex} \u97F3\u9891\u4E0D\u5B8C\u6574 (${collectedCount}/${ttsCollectingTotalSegments})\uFF0C\u4E0D\u7F13\u5B58`);
              }
            }
          }
        }
        const prevIndex = ttsActiveMessageIndex;
        setTtsActiveMessageIndex(-1);
        setTtsButtonState("idle");
        setTtsCurrentRequestId("");
        setTtsCollectingBlobUrls([]);
        setTtsCollectingTotalSegments(0);
        updateTTSButtonIcon(prevIndex, "idle");
      }
    } else if (ttsState === "active") {
    }
  });
  eventSource.on(eventNames.TTS_RESPONSE, (data) => {
    const { status, blobUrl, totalSegments, segIndex } = data;
    if (totalSegments > 0 && ttsActiveMessageIndex >= 0) {
      setTtsCollectingTotalSegments(totalSegments);
    }
    if (blobUrl && status === "ready" && ttsActiveMessageIndex >= 0) {
      if (typeof segIndex === "number" && segIndex >= 0) {
        ttsCollectingBlobUrls[segIndex] = blobUrl;
      } else {
        ttsCollectingBlobUrls.push(blobUrl);
      }
    }
    if (status === "playing" && ttsActiveMessageIndex >= 0 && ttsButtonState !== "playing") {
      setTtsButtonState("playing");
      updateTTSButtonIcon(ttsActiveMessageIndex, "playing");
    }
  });
}

export { handleTTSButtonClick, injectTTSStyleInstruction, setupTTSEventListeners, speakNotification, tryPlayTTS };
