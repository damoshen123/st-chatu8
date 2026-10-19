// 还原自打包产物 — 原始模块: utils/asr.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { defaultSettings, eventNames, extensionName } from "./config.js";
import { isAiGenerating } from "./assistant/assistantContext.js";
import { getTTSState } from "./tts.js";

var analyserNode, audioChunks, audioCtx, conversationAutoSendFn, conversationModeActive, conversationMuted, conversationResumeTimer, conversationWatchdogInterval, currentMode, currentTargetInput, hasSpoken, isSpeaking, maxDurationTimer, mediaRecorder, micBtnEl, micSource, micTestAnalyser, micTestAudioCtx, micTestRafId, micTestRunning, micTestSource, micTestStream, persistentStream, recordingStartTime, silenceTimer, state2, vadRunning;

state2 = "idle";

currentMode = "vad";

currentTargetInput = null;

persistentStream = null;

audioCtx = null;

analyserNode = null;

micSource = null;

mediaRecorder = null;

audioChunks = [];

recordingStartTime = 0;

silenceTimer = null;

isSpeaking = false;

hasSpoken = false;

vadRunning = false;

maxDurationTimer = null;

micBtnEl = null;

conversationModeActive = false;

conversationMuted = false;

conversationAutoSendFn = null;

conversationResumeTimer = null;

conversationWatchdogInterval = null;

micTestRunning = false;

micTestStream = null;

micTestAudioCtx = null;

micTestAnalyser = null;

micTestSource = null;

micTestRafId = null;

function log2(msg) {
  console.log("[ASR]", msg);
}

function getASRConfig() {
  const settings3 = extension_settings[extensionName];
  const defaults = defaultSettings.asr;
  return {
    ...defaults,
    ...settings3?.asr || {}
  };
}

function saveASRConfig(partial) {
  if (!extension_settings[extensionName]) return;
  if (!extension_settings[extensionName].asr) {
    extension_settings[extensionName].asr = { ...defaultSettings.asr };
  }
  Object.assign(extension_settings[extensionName].asr, partial);
  saveSettingsDebounced();
}

async function ensureMic() {
  if (persistentStream && persistentStream.active) return true;
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    log2("\u274C \u975E\u5B89\u5168\u4E0A\u4E0B\u6587\uFF08\u9700\u8981 HTTPS\uFF09\uFF0C\u65E0\u6CD5\u4F7F\u7528\u9EA6\u514B\u98CE");
    showMobileToast("\u9700\u8981 HTTPS \u624D\u80FD\u4F7F\u7528\u9EA6\u514B\u98CE\uFF0C\u8BF7\u786E\u4FDD\u901A\u8FC7 HTTPS \u8BBF\u95EE");
    eventSource.emit(eventNames.ASR_ERROR, {
      message: "\u9700\u8981 HTTPS \u624D\u80FD\u4F7F\u7528\u9EA6\u514B\u98CE\uFF0C\u8BF7\u786E\u4FDD\u901A\u8FC7 HTTPS \u8BBF\u95EE",
      code: "INSECURE_CONTEXT"
    });
    return false;
  }
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
    log2("\u274C \u6D4F\u89C8\u5668\u4E0D\u652F\u6301 mediaDevices.getUserMedia\uFF08\u53EF\u80FD\u4E3A\u975E\u5B89\u5168\u4E0A\u4E0B\u6587\u6216\u65E7\u7248\u6D4F\u89C8\u5668\uFF09");
    showMobileToast("\u5F53\u524D\u6D4F\u89C8\u5668\u6216\u73AF\u5883\u4E0D\u652F\u6301\u9EA6\u514B\u98CE\uFF0C\u8BF7\u4F7F\u7528 HTTPS \u8BBF\u95EE");
    eventSource.emit(eventNames.ASR_ERROR, {
      message: "\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u9EA6\u514B\u98CE\u529F\u80FD\uFF0C\u8BF7\u786E\u8BA4\u4F7F\u7528 HTTPS \u8BBF\u95EE\u4E14\u6D4F\u89C8\u5668\u7248\u672C\u652F\u6301",
      code: "NOT_SUPPORTED"
    });
    return false;
  }
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    log2("\u{1F50A} AudioContext \u5DF2\u521B\u5EFA, state=" + audioCtx.state);
  }
  if (audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
      log2("\u{1F50A} AudioContext \u5DF2\u6062\u590D, state=" + audioCtx.state);
    } catch (e) {
      log2("\u26A0\uFE0F AudioContext resume \u5931\u8D25: " + e.message);
    }
  }
  try {
    persistentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    log2("\u2705 \u9EA6\u514B\u98CE\u6743\u9650\u5DF2\u83B7\u53D6");
  } catch (e) {
    log2("\u274C \u9EA6\u514B\u98CE\u6743\u9650\u88AB\u62D2: " + e.message);
    showMobileToast("\u9EA6\u514B\u98CE\u6743\u9650\u88AB\u62D2\u7EDD\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u8BBE\u7F6E\u4E2D\u5141\u8BB8");
    eventSource.emit(eventNames.ASR_ERROR, {
      message: "\u9EA6\u514B\u98CE\u6743\u9650\u88AB\u62D2\u7EDD\uFF0C\u8BF7\u5141\u8BB8\u540E\u91CD\u8BD5",
      code: "MIC_DENIED"
    });
    return false;
  }
  if (audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
      log2("\u{1F50A} AudioContext \u4E8C\u6B21\u6062\u590D, state=" + audioCtx.state);
    } catch (e) {
      log2("\u26A0\uFE0F AudioContext \u4E8C\u6B21 resume \u5931\u8D25: " + e.message);
    }
  }
  micSource = audioCtx.createMediaStreamSource(persistentStream);
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 2048;
  micSource.connect(analyserNode);
  return true;
}

function showMobileToast(msg, duration = 3e3) {
  try {
    if (typeof toastr !== "undefined" && toastr.warning) {
      toastr.warning(msg, "ASR");
      return;
    }
    const toast = document.createElement("div");
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "80px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.8)",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "8px",
      fontSize: "14px",
      zIndex: "99999",
      maxWidth: "85vw",
      textAlign: "center",
      pointerEvents: "none",
      transition: "opacity 0.3s"
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  } catch (e) {
  }
}

function releaseMic() {
  if (micSource) {
    try {
      micSource.disconnect();
    } catch (e) {
    }
    micSource = null;
  }
  if (analyserNode) {
    analyserNode = null;
  }
  if (persistentStream) {
    persistentStream.getTracks().forEach((t) => t.stop());
    persistentStream = null;
  }
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (e) {
    }
    audioCtx = null;
  }
  log2("\u{1F3A4} \u9EA6\u514B\u98CE\u5DF2\u91CA\u653E");
}

function runVAD() {
  if (!analyserNode || state2 !== "recording" || currentMode !== "vad") {
    vadRunning = false;
    return;
  }
  vadRunning = true;
  const buf = new Float32Array(analyserNode.fftSize);
  const config = getASRConfig();
  function tick() {
    if (state2 !== "recording" || currentMode !== "vad") {
      vadRunning = false;
      return;
    }
    analyserNode.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const threshold = config.vadThreshold;
    const timeout = config.silenceTimeout;
    if (rms > threshold) {
      isSpeaking = true;
      hasSpoken = true;
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    } else if (isSpeaking) {
      isSpeaking = false;
      if (!silenceTimer && hasSpoken) {
        silenceTimer = setTimeout(() => {
          silenceTimer = null;
          if (state2 === "recording") {
            log2("\u{1F507} \u9759\u97F3\u68C0\u6D4B \u2192 \u81EA\u52A8\u505C\u6B62");
            stopRecording();
          }
        }, timeout);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function startRecording() {
  if (state2 === "recording") return;
  if (state2 === "processing") return;
  const config = getASRConfig();
  currentMode = config.mode || "vad";
  const ok = await ensureMic();
  if (!ok) return;
  audioChunks = [];
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
  mediaRecorder = new MediaRecorder(persistentStream, { mimeType });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };
  mediaRecorder.onstop = async () => {
    if (maxDurationTimer) {
      clearTimeout(maxDurationTimer);
      maxDurationTimer = null;
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    const duration = Date.now() - recordingStartTime;
    if (!hasSpoken || audioChunks.length === 0) {
      log2("\u26A0\uFE0F \u672A\u68C0\u6D4B\u5230\u8BED\u97F3\uFF0C\u8DF3\u8FC7");
      setState2("idle");
      return;
    }
    const blob = new Blob(audioChunks, { type: mimeType });
    log2(`\u{1F3A4} \u5F55\u97F3\u5B8C\u6210: ${(blob.size / 1024).toFixed(1)}KB, ${(duration / 1e3).toFixed(1)}s`);
    setState2("processing");
    processAudio(blob, duration);
  };
  mediaRecorder.start(100);
  recordingStartTime = Date.now();
  hasSpoken = false;
  isSpeaking = false;
  setState2("recording");
  if (currentMode === "vad" && !vadRunning) runVAD();
  maxDurationTimer = setTimeout(() => {
    maxDurationTimer = null;
    if (state2 === "recording") {
      log2("\u23F0 \u5F55\u97F3\u8D85\u65F660s \u2192 \u5F3A\u5236\u505C\u6B62");
      stopRecording();
    }
  }, 6e4);
  log2("\u{1F399}\uFE0F \u5F55\u97F3\u5F00\u59CB [" + currentMode.toUpperCase() + "]");
}

function stopRecording() {
  if (state2 !== "recording" || !mediaRecorder || mediaRecorder.state === "inactive") return;
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  isSpeaking = false;
  mediaRecorder.stop();
}

function isValidASRResult(text) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  const invalidPatterns = [
    /响应.*不完整/,
    /结构.*不完整/,
    /服务[器端].*错误/,
    /服务不可用/,
    /请求超时/,
    /连接.*失败/,
    /^error$/i,
    /^failed$/i,
    /^timeout$/i,
    /internal.?server.?error/i,
    /service.?unavailable/i,
    /bad.?gateway/i,
    /rate.?limit/i,
    /too.?many.?requests/i,
    /traceback\s*\(/i,
    // Python 错误堆栈
    /exception\s*:/i,
    // 异常信息格式
    /^\s*\{.*"error".*\}\s*$/,
    // JSON 错误对象
    /^\s*\[.*\]\s*$/
    // 纯 JSON 数组（无文本内容）
  ];
  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmed)) {
      log2(`\u26A0\uFE0F ASR \u7ED3\u679C\u88AB\u8FC7\u6EE4\uFF08\u5339\u914D\u65E0\u6548\u6A21\u5F0F ${pattern}\uFF09: "${trimmed}"`);
      return false;
    }
  }
  return true;
}

async function processAudio(blob, duration) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    const arrBuf = await blob.arrayBuffer();
    let buffer;
    try {
      buffer = await audioCtx.decodeAudioData(arrBuf);
    } catch (e) {
      log2("\u26A0\uFE0F \u97F3\u9891\u89E3\u7801\u5931\u8D25: " + e.message);
      eventSource.emit(eventNames.ASR_ERROR, { message: "\u97F3\u9891\u89E3\u7801\u5931\u8D25", code: "DECODE_ERROR" });
      setState2("idle");
      return;
    }
    const config = getASRConfig();
    const maxKeep = config.maxKeepDuration || 10;
    const totalDuration = buffer.duration;
    let bufferToConvert = buffer;
    if (totalDuration > maxKeep) {
      const keepSamples = Math.floor(maxKeep * buffer.sampleRate);
      const startSample = buffer.length - keepSamples;
      const trimmedBuffer = audioCtx.createBuffer(
        buffer.numberOfChannels,
        keepSamples,
        buffer.sampleRate
      );
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const src = buffer.getChannelData(ch);
        const dst = trimmedBuffer.getChannelData(ch);
        dst.set(src.subarray(startSample));
      }
      bufferToConvert = trimmedBuffer;
      log2(`\u2702\uFE0F \u5C3E\u90E8\u622A\u53D6: ${totalDuration.toFixed(1)}s \u2192 \u4FDD\u7559\u672B\u5C3E ${maxKeep}s`);
    }
    const wavBlob = toWavFromBuffer(bufferToConvert, 16e3);
    const wavFile = new File([wavBlob], `asr_${Date.now()}.wav`, { type: "audio/wav" });
    log2(`\u{1F4E6} WAV \u6587\u4EF6: ${(wavFile.size / 1024).toFixed(1)}KB (16kHz)`);
    const text = await runASR(wavFile);
    if (text && isValidASRResult(text)) {
      log2(`\u{1F524} \u8BC6\u522B\u7ED3\u679C: "${text}"`);
      const target = currentTargetInput || "#send_textarea";
      eventSource.emit(eventNames.ASR_RESULT, {
        text,
        target,
        success: true,
        duration
      });
      fillTextToInput(text, target);
      if (conversationModeActive && conversationAutoSendFn && target === "#st-chatu8-ai-input" && config.autoSend !== false) {
        log2("\u{1F504} \u591A\u8F6E\u5BF9\u8BDD\u6A21\u5F0F\uFF1A\u81EA\u52A8\u53D1\u9001");
        setTimeout(() => {
          if (conversationModeActive && conversationAutoSendFn) {
            conversationAutoSendFn();
          }
        }, 100);
      }
      currentTargetInput = null;
    } else {
      log2("\u26A0\uFE0F ASR \u54CD\u5E94\u7ED3\u6784\u4E0D\u5B8C\u6574\u6216\u672A\u8FD4\u56DE\u6709\u6548\u7ED3\u679C\uFF0C\u4E0D\u586B\u5165\u6587\u5B57");
      eventSource.emit(eventNames.ASR_RESULT, {
        text: "",
        target: currentTargetInput || "#send_textarea",
        success: false,
        duration
      });
      const shouldRestart = conversationModeActive ? !conversationMuted : currentMode === "vad";
      if (shouldRestart) {
        log2("\u{1F504} ASR \u8BC6\u522B\u5931\u8D25\uFF0C\u81EA\u52A8\u91CD\u65B0\u5F00\u59CB\u5F55\u97F3");
        setTimeout(() => {
          if (state2 === "idle") {
            if (conversationModeActive && conversationMuted) return;
            startRecording();
          }
        }, 500);
      }
    }
    setState2("idle");
  } catch (e) {
    log2("\u274C \u97F3\u9891\u5904\u7406\u5931\u8D25: " + e.message);
    eventSource.emit(eventNames.ASR_ERROR, { message: e.message, code: "PROCESS_ERROR" });
    setState2("idle");
    const shouldRestart = conversationModeActive ? !conversationMuted : currentMode === "vad";
    if (shouldRestart) {
      log2("\u{1F504} \u97F3\u9891\u5904\u7406\u5931\u8D25\uFF0C\u81EA\u52A8\u91CD\u65B0\u5F00\u59CB\u5F55\u97F3");
      setTimeout(() => {
        if (state2 === "idle") {
          if (conversationModeActive && conversationMuted) return;
          startRecording();
        }
      }, 500);
    }
  }
}

function toWavFromBuffer(buffer, targetSampleRate = 16e3) {
  const origSR = buffer.sampleRate;
  const origLen = buffer.length;
  const ch = buffer.numberOfChannels;
  const mono = new Float32Array(origLen);
  for (let i = 0; i < origLen; i++) {
    let s = 0;
    for (let c = 0; c < ch; c++) s += buffer.getChannelData(c)[i];
    mono[i] = s / ch;
  }
  const ratio = origSR / targetSampleRate;
  const newLen = Math.floor(origLen / ratio);
  const resampled = new Float32Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const srcIdx = i * ratio;
    const idx0 = Math.floor(srcIdx);
    const idx1 = Math.min(idx0 + 1, origLen - 1);
    const frac = srcIdx - idx0;
    resampled[i] = mono[idx0] * (1 - frac) + mono[idx1] * frac;
  }
  const pcm = new Int16Array(newLen);
  for (let i = 0; i < newLen; i++) {
    pcm[i] = Math.max(-32768, Math.min(32767, Math.round(resampled[i] * 32767)));
  }
  const wav = new ArrayBuffer(44 + pcm.byteLength);
  const v = new DataView(wav);
  const ws = (o, str) => {
    for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i));
  };
  ws(0, "RIFF");
  v.setUint32(4, 36 + pcm.byteLength, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, targetSampleRate, true);
  v.setUint32(28, targetSampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ws(36, "data");
  v.setUint32(40, pcm.byteLength, true);
  new Uint8Array(wav, 44).set(new Uint8Array(pcm.buffer));
  return new Blob([wav], { type: "audio/wav" });
}

async function uploadFile(file, baseUrl) {
  const fd = new FormData();
  fd.append("files", file);
  const r = await fetch(`${baseUrl}/gradio_api/upload`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`\u4E0A\u4F20\u5931\u8D25 ${r.status}`);
  const j = await r.json();
  return Array.isArray(j) ? j[0] : j;
}

async function runASR(file) {
  const config = getASRConfig();
  const asrBase = (config.asrServerUrl || "https://qwen-qwen3-asr-demo.ms.show").replace(/\/+$/, "");
  try {
    log2("\u{1F524} ASR \u4E0A\u4F20\u4E2D...");
    const path = await uploadFile(file, asrBase);
    const postBody = {
      data: [
        {
          path,
          orig_name: file.name,
          size: file.size,
          mime_type: file.type || "audio/wav",
          meta: { _type: "gradio.FileData" }
        },
        "",
        // context
        config.language || "auto",
        // language
        false
        // ITN
      ]
    };
    const postResp = await fetch(`${asrBase}/gradio_api/call/asr_inference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postBody)
    });
    if (!postResp.ok) throw new Error(`ASR \u63D0\u4EA4\u5931\u8D25 ${postResp.status}`);
    let postJson;
    try {
      postJson = await postResp.json();
    } catch (e) {
      throw new Error("ASR \u54CD\u5E94\u7ED3\u6784\u4E0D\u5B8C\u6574\uFF1A\u65E0\u6CD5\u89E3\u6790\u63D0\u4EA4\u54CD\u5E94 JSON");
    }
    const { event_id } = postJson;
    if (!event_id) {
      throw new Error("ASR \u54CD\u5E94\u7ED3\u6784\u4E0D\u5B8C\u6574\uFF1A\u7F3A\u5C11 event_id");
    }
    log2(`\u{1F4CB} ASR \u4EFB\u52A1 ${event_id}`);
    const getResp = await fetch(`${asrBase}/gradio_api/call/asr_inference/${event_id}`);
    if (!getResp.ok) throw new Error(`ASR \u83B7\u53D6\u7ED3\u679C\u5931\u8D25 ${getResp.status}`);
    const text = await getResp.text();
    if (!text || !text.trim()) {
      throw new Error("ASR \u54CD\u5E94\u7ED3\u6784\u4E0D\u5B8C\u6574\uFF1A\u8FD4\u56DE\u5185\u5BB9\u4E3A\u7A7A");
    }
    let currentEventType = null;
    let foundDataLine = false;
    let errorMessage = null;
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        currentEventType = null;
        continue;
      }
      if (trimmed.startsWith("event:")) {
        currentEventType = trimmed.slice(6).trim();
        log2(`\u{1F4E1} ASR SSE \u4E8B\u4EF6\u7C7B\u578B: ${currentEventType}`);
        continue;
      }
      if (trimmed.startsWith("data:")) {
        foundDataLine = true;
        const rawPayload = trimmed.slice(5).trim();
        if (currentEventType === "error") {
          log2("\u26A0\uFE0F ASR \u670D\u52A1\u7AEF\u8FD4\u56DE error \u4E8B\u4EF6");
          try {
            const errData = JSON.parse(rawPayload);
            errorMessage = typeof errData === "string" ? errData : JSON.stringify(errData);
          } catch {
            errorMessage = rawPayload || "\u672A\u77E5\u670D\u52A1\u7AEF\u9519\u8BEF";
          }
          continue;
        }
        if (currentEventType && currentEventType !== "complete") {
          log2(`\u{1F4E1} ASR \u8DF3\u8FC7\u975E complete \u4E8B\u4EF6: ${currentEventType}`);
          continue;
        }
        if (!rawPayload) {
          log2("\u26A0\uFE0F ASR data: \u884C\u5185\u5BB9\u4E3A\u7A7A\uFF0C\u8DF3\u8FC7");
          continue;
        }
        let data;
        try {
          data = JSON.parse(rawPayload);
        } catch {
          log2("\u26A0\uFE0F ASR data: \u884C JSON \u89E3\u6790\u5931\u8D25\uFF0C\u8DF3\u8FC7");
          continue;
        }
        if (!Array.isArray(data)) {
          log2("\u26A0\uFE0F ASR \u54CD\u5E94\u6570\u636E\u4E0D\u662F\u6570\u7EC4\uFF0C\u8DF3\u8FC7");
          continue;
        }
        if (data[0] && typeof data[0] === "string" && data[0].trim()) {
          return data[0];
        }
      }
    }
    if (errorMessage) {
      throw new Error(`ASR \u670D\u52A1\u7AEF\u9519\u8BEF: ${errorMessage}`);
    }
    if (!foundDataLine) {
      throw new Error("ASR \u54CD\u5E94\u7ED3\u6784\u4E0D\u5B8C\u6574\uFF1A\u672A\u627E\u5230 data: \u884C");
    }
    throw new Error("ASR \u54CD\u5E94\u7ED3\u6784\u4E0D\u5B8C\u6574\uFF1A\u672A\u8FD4\u56DE\u6709\u6548\u8BC6\u522B\u6587\u672C");
  } catch (e) {
    log2("\u26A0\uFE0F ASR \u5931\u8D25: " + e.message);
    eventSource.emit(eventNames.ASR_ERROR, {
      message: "ASR \u8BC6\u522B\u5931\u8D25: " + e.message,
      code: "ASR_FAILED"
    });
    return null;
  }
}

function fillTextToInput(text, target = "#send_textarea") {
  const selector = target.startsWith("#") ? target : `#${target}`;
  const textarea = document.querySelector(selector);
  if (!textarea) {
    log2("\u26A0\uFE0F \u672A\u627E\u5230\u8F93\u5165\u6846 #" + target);
    return;
  }
  const config = getASRConfig();
  if (config.appendMode && textarea.value.trim()) {
    textarea.value = textarea.value.trimEnd() + " " + text;
  } else {
    textarea.value = text;
  }
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
  log2("\u2705 \u6587\u5B57\u5DF2\u586B\u5165\u8F93\u5165\u6846");
}

function setState2(s) {
  state2 = s;
  eventSource.emit(eventNames.ASR_STATE_CHANGED, {
    state: s,
    mode: currentMode
  });
  updateMicButton();
}

function updateMicButton() {
  if (!micBtnEl) return;
  const icon = micBtnEl.querySelector("i");
  if (!icon) return;
  micBtnEl.classList.remove("ch-asr-recording", "ch-asr-processing");
  switch (state2) {
    case "idle":
      icon.className = "fa-solid fa-microphone";
      micBtnEl.title = currentMode === "ptt" ? "\u6309\u4F4F\u8BF4\u8BDD" : "\u70B9\u51FB\u5F00\u59CB\u8BED\u97F3\u8F93\u5165";
      break;
    case "recording":
      icon.className = "fa-solid fa-microphone";
      micBtnEl.classList.add("ch-asr-recording");
      micBtnEl.title = "\u6B63\u5728\u5F55\u97F3...";
      break;
    case "processing":
      icon.className = "fa-solid fa-spinner fa-spin";
      micBtnEl.classList.add("ch-asr-processing");
      micBtnEl.title = "\u6B63\u5728\u8BC6\u522B...";
      break;
  }
}

function injectMicButton() {
  if (micBtnEl) return;
  const sendForm = document.querySelector("#send_form");
  if (!sendForm) {
    log2("\u26A0\uFE0F \u672A\u627E\u5230 #send_form\uFF0C\u5EF6\u8FDF\u6CE8\u5165");
    setTimeout(injectMicButton, 2e3);
    return;
  }
  if (!document.querySelector("#ch-asr-styles")) {
    const style = document.createElement("style");
    style.id = "ch-asr-styles";
    style.textContent = `
            .ch-asr-mic-btn {
                width: 36px;
                height: 36px;
                min-width: 44px;
                min-height: 44px;
                border: 1px solid var(--SmartThemeBorderColor, #555);
                background: var(--SmartThemeBlurTintColor, #2a2a2a);
                border-radius: 8px;
                color: inherit;
                opacity: 0.8;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
                margin-right: 4px;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                user-select: none;
                -webkit-user-select: none;
            }
            .ch-asr-mic-btn:hover {
                border-color: var(--SmartThemeQuoteColor, #4a9eff);
                color: var(--SmartThemeQuoteColor, #4a9eff);
            }
            .ch-asr-mic-btn.ch-asr-recording {
                background: rgba(214, 48, 49, 0.2);
                border-color: #d63031;
                color: #d63031;
                animation: ch-asr-pulse 1.5s infinite;
            }
            .ch-asr-mic-btn.ch-asr-processing {
                background: rgba(9, 132, 227, 0.15);
                border-color: #0984e3;
                color: #0984e3;
            }
            @keyframes ch-asr-pulse {
                0% { box-shadow: 0 0 0 0 rgba(214, 48, 49, 0.5); }
                70% { box-shadow: 0 0 0 8px rgba(214, 48, 49, 0); }
                100% { box-shadow: 0 0 0 0 rgba(214, 48, 49, 0); }
            }
        `;
    document.head.appendChild(style);
  }
  micBtnEl = document.createElement("div");
  micBtnEl.id = "ch-asr-mic-btn";
  micBtnEl.className = "ch-asr-mic-btn";
  micBtnEl.title = "\u70B9\u51FB\u5F00\u59CB\u8BED\u97F3\u8F93\u5165";
  micBtnEl.innerHTML = '<i class="fa-solid fa-microphone"></i>';
  let touchHandled = false;
  micBtnEl.addEventListener("touchstart", (e) => {
    touchHandled = true;
    onMicDown(e);
  }, { passive: false });
  micBtnEl.addEventListener("touchend", (e) => {
    onMicUp(e);
    setTimeout(() => {
      touchHandled = false;
    }, 300);
  }, { passive: false });
  micBtnEl.addEventListener("mousedown", (e) => {
    if (touchHandled) return;
    onMicDown(e);
  });
  micBtnEl.addEventListener("mouseup", (e) => {
    if (touchHandled) return;
    onMicUp(e);
  });
  micBtnEl.addEventListener("click", (e) => {
    if (touchHandled) return;
    e.preventDefault();
    const config = getASRConfig();
    const mode = config.mode || "vad";
    if (mode === "vad") {
      if (state2 === "processing") return;
      if (state2 === "idle") startRecording();
      else if (state2 === "recording") stopRecording();
    }
  });
  micBtnEl.addEventListener("contextmenu", (e) => e.preventDefault());
  const textarea = sendForm.querySelector("#send_textarea");
  if (textarea && textarea.parentNode) {
    textarea.parentNode.insertBefore(micBtnEl, textarea);
  } else {
    sendForm.insertBefore(micBtnEl, sendForm.firstChild);
  }
  log2("\u{1F3A4} \u9EA6\u514B\u98CE\u6309\u94AE\u5DF2\u6CE8\u5165");
  updateMicButton();
}

function removeMicButton() {
  if (micBtnEl) {
    micBtnEl.remove();
    micBtnEl = null;
    log2("\u{1F3A4} \u9EA6\u514B\u98CE\u6309\u94AE\u5DF2\u79FB\u9664");
  }
}

function onMicDown(e) {
  e.preventDefault();
  if (state2 === "processing") return;
  const config = getASRConfig();
  currentMode = config.mode || "vad";
  if (currentMode === "ptt") {
    startRecording();
  } else {
    if (state2 === "idle") startRecording();
    else if (state2 === "recording") stopRecording();
  }
}

function onMicUp(e) {
  e.preventDefault();
  if (currentMode === "ptt" && state2 === "recording") {
    stopRecording();
  }
}

function initSettingsUI() {
  const checkAndBind = () => {
    const enabledCheckbox = document.querySelector("#asr_enabled");
    if (!enabledCheckbox) {
      setTimeout(checkAndBind, 1e3);
      return;
    }
    const config = getASRConfig();
    enabledCheckbox.checked = config.enabled;
    toggleAdvancedSettings(config.enabled);
    enabledCheckbox.addEventListener("change", () => {
      const enabled = enabledCheckbox.checked;
      saveASRConfig({ enabled });
      toggleAdvancedSettings(enabled);
      if (enabled) {
        injectMicButton();
      } else {
        if (state2 === "recording") stopRecording();
        removeMicButton();
        releaseMic();
      }
    });
    bindRangeControl("asr_silence_timeout", "silenceTimeout", config.silenceTimeout);
    bindRangeControl("asr_vad_threshold", "vadThreshold", config.vadThreshold);
    bindRangeControl("asr_max_keep_duration", "maxKeepDuration", config.maxKeepDuration);
    const modeSelect = document.querySelector("#asr_mode");
    if (modeSelect) {
      modeSelect.value = config.mode || "vad";
      modeSelect.addEventListener("change", () => {
        saveASRConfig({ mode: modeSelect.value });
        currentMode = modeSelect.value;
        updateMicButton();
      });
    }
    const langSelect = document.querySelector("#asr_language");
    if (langSelect) {
      langSelect.value = config.language || "auto";
      langSelect.addEventListener("change", () => {
        saveASRConfig({ language: langSelect.value });
      });
    }
    const appendSelect = document.querySelector("#asr_append_mode");
    if (appendSelect) {
      appendSelect.value = String(config.appendMode !== false);
      appendSelect.addEventListener("change", () => {
        saveASRConfig({ appendMode: appendSelect.value === "true" });
      });
    }
    log2("\u2699\uFE0F \u8BBE\u7F6E\u754C\u9762\u5DF2\u7ED1\u5B9A");
  };
  checkAndBind();
}

function bindRangeControl(baseId, configKey, initialValue) {
  const slider = document.querySelector(`#${baseId}`);
  const numberInput = document.querySelector(`#${baseId}_value`);
  if (slider) {
    slider.value = initialValue;
    slider.addEventListener("input", () => {
      const val = parseFloat(slider.value);
      if (numberInput) numberInput.value = val;
      saveASRConfig({ [configKey]: val });
    });
  }
  if (numberInput) {
    numberInput.value = initialValue;
    numberInput.addEventListener("input", () => {
      const val = parseFloat(numberInput.value);
      if (slider) slider.value = val;
      saveASRConfig({ [configKey]: val });
    });
  }
}

function toggleAdvancedSettings(show) {
  const advanced = document.querySelector("#asr-advanced-settings");
  if (advanced) {
    advanced.style.display = show ? "" : "none";
  }
}

function initializeASR() {
  eventSource.on(eventNames.ASR_START, (data) => {
    if (data?.mode) currentMode = data.mode;
    if (data?.targetInput) currentTargetInput = data.targetInput;
    startRecording();
  });
  eventSource.on(eventNames.ASR_STOP, () => {
    if (state2 === "recording") stopRecording();
  });
  eventSource.on(eventNames.TTS_STATE_CHANGED, (data) => {
    if (!conversationModeActive) return;
    const ttsState = data?.state;
    if (ttsState === "active") {
      conversationMuted = true;
      if (state2 === "recording") {
        log2("\u{1F507} \u591A\u8F6E\u5BF9\u8BDD\uFF1ATTS \u64AD\u653E\u4E2D\uFF0C\u6682\u505C\u5F55\u97F3");
        stopRecording();
      }
      if (conversationResumeTimer) {
        clearTimeout(conversationResumeTimer);
        conversationResumeTimer = null;
      }
    } else if (ttsState === "idle") {
      conversationMuted = false;
      clearWatchdog();
      if (conversationModeActive) {
        log2("\u{1F50A} \u591A\u8F6E\u5BF9\u8BDD\uFF1ATTS \u64AD\u653E\u7ED3\u675F\uFF0C\u5EF6\u8FDF\u6062\u590D\u5F55\u97F3");
        if (conversationResumeTimer) {
          clearTimeout(conversationResumeTimer);
        }
        conversationResumeTimer = setTimeout(() => {
          conversationResumeTimer = null;
          if (!conversationModeActive || conversationMuted) return;
          if (state2 === "idle") {
            log2("\u{1F399}\uFE0F \u591A\u8F6E\u5BF9\u8BDD\uFF1A\u81EA\u52A8\u6062\u590D\u5F55\u97F3");
            currentTargetInput = "#st-chatu8-ai-input";
            startRecording();
          } else if (state2 === "processing") {
            log2("\u{1F399}\uFE0F \u591A\u8F6E\u5BF9\u8BDD\uFF1AASR \u6B63\u5728\u5904\u7406\u4E2D\uFF0C\u7B49\u5F85\u5904\u7406\u5B8C\u6210\u540E\u81EA\u52A8\u6062\u590D");
          }
        }, 800);
      }
    }
  });
  const config = getASRConfig();
  if (config.enabled) {
    if (document.readyState === "complete") {
      injectMicButton();
    } else {
      window.addEventListener("load", () => injectMicButton());
    }
  }
  initSettingsUI();
  log2("\u2705 ASR \u8BED\u97F3\u8F93\u5165\u6A21\u5757\u5DF2\u521D\u59CB\u5316");
}

function setASREnabled(enabled) {
  saveASRConfig({ enabled });
  if (enabled) {
    injectMicButton();
  } else {
    if (state2 === "recording") stopRecording();
    removeMicButton();
    releaseMic();
  }
  const settingsCheckbox = document.querySelector("#asr_enabled");
  if (settingsCheckbox) {
    settingsCheckbox.checked = enabled;
    toggleAdvancedSettings(enabled);
  }
  log2(enabled ? "\u2705 ASR \u5DF2\u542F\u7528" : "\u26D4 ASR \u5DF2\u7981\u7528");
}

function isASREnabled() {
  return getASRConfig().enabled;
}

function startConversationMode(autoSendFn, startMuted = false) {
  conversationModeActive = true;
  conversationMuted = startMuted;
  conversationAutoSendFn = autoSendFn || null;
  if (conversationResumeTimer) {
    clearTimeout(conversationResumeTimer);
    conversationResumeTimer = null;
  }
  if (startMuted) {
    log2("\u{1F5E3}\uFE0F \u591A\u8F6E\u5BF9\u8BDD\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF08\u7B49\u5F85\u4E2D\uFF1AAI\u751F\u6210\u6216TTS\u64AD\u653E\u5C1A\u672A\u7ED3\u675F\uFF09");
  } else {
    log2("\u{1F5E3}\uFE0F \u591A\u8F6E\u5BF9\u8BDD\u6A21\u5F0F\u5DF2\u5F00\u542F");
    currentTargetInput = "#st-chatu8-ai-input";
    if (state2 === "idle") {
      startRecording();
    }
  }
}

function stopConversationMode() {
  conversationModeActive = false;
  conversationMuted = false;
  conversationAutoSendFn = null;
  clearWatchdog();
  if (conversationResumeTimer) {
    clearTimeout(conversationResumeTimer);
    conversationResumeTimer = null;
  }
  if (state2 === "recording") {
    stopRecording();
  }
  log2("\u{1F507} \u591A\u8F6E\u5BF9\u8BDD\u6A21\u5F0F\u5DF2\u5173\u95ED");
}

function isConversationMode() {
  return conversationModeActive;
}

function notifyAiGenerating() {
  if (!conversationModeActive) return;
  conversationMuted = true;
  if (state2 === "recording") {
    log2("\u{1F507} \u591A\u8F6E\u5BF9\u8BDD\uFF1AAI \u751F\u6210\u4E2D\uFF0C\u6682\u505C\u5F55\u97F3");
    stopRecording();
  }
}

function notifyAiGenerationDone() {
  if (!conversationModeActive) return;
  const settings3 = extension_settings[extensionName];
  const aiConfig = settings3?.chatu8_ai_assistant || {};
  if (!aiConfig.tts_enabled) {
    conversationMuted = false;
    clearWatchdog();
    log2("\u{1F50A} \u591A\u8F6E\u5BF9\u8BDD\uFF1AAI \u751F\u6210\u5B8C\u6BD5\uFF08TTS \u672A\u542F\u7528\uFF09\uFF0C\u5EF6\u8FDF\u6062\u590D\u5F55\u97F3");
    conversationResumeTimer = setTimeout(() => {
      conversationResumeTimer = null;
      if (conversationModeActive && !conversationMuted && state2 === "idle") {
        currentTargetInput = "#st-chatu8-ai-input";
        startRecording();
      }
    }, 500);
  } else {
    log2("\u{1F50A} \u591A\u8F6E\u5BF9\u8BDD\uFF1AAI \u751F\u6210\u5B8C\u6BD5\uFF0C\u7B49\u5F85 TTS \u64AD\u653E\u7ED3\u675F\u540E\u6062\u590D\uFF08\u5DF2\u542F\u52A8\u770B\u95E8\u72D7\uFF09");
    startWatchdog();
  }
}

function startWatchdog() {
  clearWatchdog();
  conversationWatchdogInterval = setInterval(() => {
    if (!conversationModeActive) {
      clearWatchdog();
      return;
    }
    if (!conversationMuted) {
      clearWatchdog();
      return;
    }
    const aiStillGenerating = isAiGenerating;
    let ttsStillActive = false;
    try {
      const ttsInfo = getTTSState();
      ttsStillActive = ttsInfo?.state === "active";
    } catch (e) {
      log2("\u26A0\uFE0F \u770B\u95E8\u72D7\uFF1A\u83B7\u53D6 TTS \u72B6\u6001\u5931\u8D25: " + e.message);
    }
    log2(`\u{1F50D} \u770B\u95E8\u72D7\u68C0\u67E5\uFF1AisAiGenerating=${aiStillGenerating}, ttsActive=${ttsStillActive}, conversationMuted=${conversationMuted}`);
    if (!aiStillGenerating && !ttsStillActive) {
      log2("\u26A0\uFE0F \u770B\u95E8\u72D7\uFF1ALLM \u548C TTS \u5747\u5DF2\u7ED3\u675F\u4F46 ASR \u4ECD\u88AB\u7981\u97F3\uFF0C\u5F3A\u5236\u6062\u590D\u5F55\u97F3");
      conversationMuted = false;
      clearWatchdog();
      if (state2 === "idle") {
        currentTargetInput = "#st-chatu8-ai-input";
        startRecording();
      }
    }
  }, 3e3);
}

function clearWatchdog() {
  if (conversationWatchdogInterval) {
    clearInterval(conversationWatchdogInterval);
    conversationWatchdogInterval = null;
  }
}

async function startMicTest(onTick) {
  if (micTestRunning) return true;
  try {
    micTestStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    log2("\u274C \u9EA6\u514B\u98CE\u6D4B\u8BD5 - \u6743\u9650\u88AB\u62D2: " + e.message);
    return false;
  }
  micTestAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (micTestAudioCtx.state === "suspended") await micTestAudioCtx.resume();
  micTestSource = micTestAudioCtx.createMediaStreamSource(micTestStream);
  micTestAnalyser = micTestAudioCtx.createAnalyser();
  micTestAnalyser.fftSize = 2048;
  micTestSource.connect(micTestAnalyser);
  micTestRunning = true;
  const buf = new Float32Array(micTestAnalyser.fftSize);
  function tick() {
    if (!micTestRunning) return;
    micTestAnalyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const config = getASRConfig();
    if (onTick) onTick(rms, config.vadThreshold);
    micTestRafId = requestAnimationFrame(tick);
  }
  micTestRafId = requestAnimationFrame(tick);
  log2("\u{1F3A4} \u9EA6\u514B\u98CE\u6D4B\u8BD5\u5DF2\u542F\u52A8");
  return true;
}

function stopMicTest() {
  micTestRunning = false;
  if (micTestRafId) {
    cancelAnimationFrame(micTestRafId);
    micTestRafId = null;
  }
  if (micTestSource) {
    try {
      micTestSource.disconnect();
    } catch (e) {
    }
    micTestSource = null;
  }
  micTestAnalyser = null;
  if (micTestStream) {
    micTestStream.getTracks().forEach((t) => t.stop());
    micTestStream = null;
  }
  if (micTestAudioCtx) {
    try {
      micTestAudioCtx.close();
    } catch (e) {
    }
    micTestAudioCtx = null;
  }
  log2("\u{1F3A4} \u9EA6\u514B\u98CE\u6D4B\u8BD5\u5DF2\u505C\u6B62");
}

export { getASRConfig, initializeASR, isASREnabled, isConversationMode, notifyAiGenerating, notifyAiGenerationDone, saveASRConfig, setASREnabled, startConversationMode, startMicTest, stopConversationMode, stopMicTest };
