// 还原自打包产物 — 原始模块: utils/tts.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../script.js";
import { eventNames, extensionName } from "./config.js";
import { getGlobalVideoPlayer } from "./ui_common.js";

var AVAILABLE_VOICES, EDGE_STYLE_MAP, EDGE_TTS_CONFIG, EDGE_VOICES, LB_CACHE_TTL, SILENT_WAV, TIMEOUT_MS, TTS_CONFIG, activeTtsCount, audioQueue, availableEdgeServers, currentAudio, currentAutoPlay, currentEngine, currentRequestId2, currentSessionId, edgePingInProgress, edgePingPromise, edgeServerIndex, isAudioPlaying, lastEdgePingResult, lastEdgePingTime, lbCache, nextPlayIdx, state, ttsWaitQueue;

TTS_CONFIG = {
      enabled: true,
      lbServerUrl: "https://st-chatu-load-balancer.hf.space",
      chatServerUrls: "",
      // 备用服务地址（换行分隔）
      voice: "Cherry / \u828A\u60A6",
      // 默认声音角色
      systemPrompt: "\u4F60\u662F\u4E00\u53EA\u9E66\u9E49\u3002\u4F60\u552F\u4E00\u7684\u4EFB\u52A1\u5C31\u662F\u9010\u5B57\u9010\u53E5\u5730\u91CD\u590D\u7528\u6237\u6240\u8BF4\u7684\u8BDD\u3002\u4E0D\u8981\u6DFB\u52A0\u3001\u5220\u9664\u6216\u4FEE\u6539\u4EFB\u4F55\u5185\u5BB9\u3002\u4E0D\u8981\u89E3\u91CA\u3001\u8BC4\u8BBA\u6216\u4EE5\u4EFB\u4F55\u5176\u4ED6\u65B9\u5F0F\u56DE\u5E94\u3002\u53EA\u9700\u539F\u5C01\u4E0D\u52A8\u5730\u5C06\u7528\u6237\u7684\u6D88\u606F\u91CD\u590D\u56DE\u53BB\u3002",
      temperature: 0.1,
      topP: 0.5,
      minSegLen: 10,
      maxSegLen: 80,
      newlineOnly: false,
      inlineAudio: true,
      maxConcurrency: 20,
      maxRetries: 2,
      // TTS 段落失败最大重试次数
      retryDelay: 1e3,
      // 重试间隔（毫秒）
      TOTP_SECRET: "EFPCO3YIHIXUYTCD"
    };

TIMEOUT_MS = 18e4;

AVAILABLE_VOICES = [
      // 基础角色
      "Cherry / \u828A\u60A6",
      "Serena / \u82CF\u7476",
      "Ethan / \u6668\u7166",
      "Chelsie / \u5343\u96EA",
      "Momo / \u8309\u5154",
      "Vivian / \u5341\u4E09",
      "Moon / \u6708\u767D",
      "Maia / \u56DB\u6708",
      "Kai / \u51EF",
      "Nofish / \u4E0D\u5403\u9C7C",
      "Bella / \u840C\u5B9D",
      "Jennifer / \u8A79\u59AE\u5F17",
      "Ryan / \u751C\u8336",
      "Katerina / \u5361\u6377\u7433\u5A1C",
      "Aiden / \u827E\u767B",
      // 多语种
      "Bodega / \u897F\u73ED\u7259\u8BED-\u535A\u5FB7\u52A0",
      "Alek / \u4FC4\u8BED-\u963F\u5217\u514B",
      "Dolce / \u610F\u5927\u5229\u8BED-\u591A\u5C14\u5207",
      "Sohee / \u97E9\u8BED-\u7D20\u7199",
      "Ono Anna / \u65E5\u8BED-\u5C0F\u91CE\u674F",
      "Lenn / \u5FB7\u8BED-\u83B1\u6069",
      "Sonrisa / \u897F\u73ED\u7259\u8BED\u62C9\u7F8E-\u7D22\u5C3C\u838E",
      "Emilien / \u6CD5\u8BED-\u57C3\u7C73\u5C14\u5B89",
      "Andre / \u8461\u8404\u7259\u8BED\u6B27-\u5B89\u5FB7\u96F7",
      "Radio Gol / \u8461\u8404\u7259\u8BED\u5DF4-\u62C9\u8FEA\u5965\xB7\u6208\u5C14",
      // 精品百人 & 特色
      "Eldric Sage / \u7CBE\u54C1\u767E\u4EBA-\u6CA7\u660E\u5B50",
      "Mia / \u7CBE\u54C1\u767E\u4EBA-\u4E56\u5C0F\u59B9",
      "Mochi / \u7CBE\u54C1\u767E\u4EBA-\u6C99\u5C0F\u5F25",
      "Bellona / \u7CBE\u54C1\u767E\u4EBA-\u71D5\u94EE\u83BA",
      "Vincent / \u7CBE\u54C1\u767E\u4EBA-\u7530\u53D4",
      "Bunny / \u7CBE\u54C1\u767E\u4EBA-\u840C\u5C0F\u59EC",
      "Neil / \u7CBE\u54C1\u767E\u4EBA-\u963F\u95FB",
      "Elias / \u58A8\u8BB2\u5E08",
      "Arthur / \u7CBE\u54C1\u767E\u4EBA-\u5F90\u5927\u7237",
      "Nini / \u7CBE\u54C1\u767E\u4EBA-\u90BB\u5BB6\u59B9\u59B9",
      "Ebona / \u7CBE\u54C1\u767E\u4EBA-\u8BE1\u5A46\u5A46",
      "Seren / \u7CBE\u54C1\u767E\u4EBA-\u5C0F\u5A49",
      "Pip / \u7CBE\u54C1\u767E\u4EBA-\u8C03\u76AE\u5C0F\u65B0",
      "Stella / \u7CBE\u54C1\u767E\u4EBA-\u7F8E\u5C11\u5973\u963F\u6708",
      // 方言
      "Li / \u5357\u4EAC-\u8001\u674E",
      "Marcus / \u9655\u897F-\u79E6\u5DDD",
      "Roy / \u95FD\u5357-\u963F\u6770",
      "Peter / \u5929\u6D25-\u674E\u5F7C\u5F97",
      "Eric / \u56DB\u5DDD-\u7A0B\u5DDD",
      "Rocky / \u7CA4\u8BED-\u963F\u5F3A",
      "Kiki / \u7CA4\u8BED-\u963F\u6E05",
      "Sunny / \u56DB\u5DDD-\u6674\u513F",
      "Jada / \u4E0A\u6D77-\u963F\u73CD",
      "Dylan / \u5317\u4EAC-\u6653\u4E1C"
    ];

currentEngine = "qwen";

EDGE_TTS_CONFIG = {
      proxyServers: [
        { name: "Cloudflare\u4E13\u5C5E", url: "https://edge.damoshen123.workers.dev/tts" },
        { name: "\u65B0\u52A0\u5761\u5907\u7528", url: "http://5.45.99.149:8075/tts" }
      ],
      voice: "zh-CN-XiaoxiaoNeural",
      style: "general",
      rate: 0,
      pitch: 0,
      volume: 50,
      format: "audio-24khz-96kbitrate-mono-mp3",
      pingTimeout: 5e3
    };

EDGE_STYLE_MAP = {
      "general": "\u901A\u7528",
      "assistant": "\u52A9\u624B",
      "chat": "\u95F2\u804A",
      "customerservice": "\u5BA2\u670D",
      "newscast": "\u65B0\u95FB\u64AD\u62A5",
      "affectionate": "\u4EB2\u5207",
      "angry": "\u6124\u6012",
      "calm": "\u5E73\u9759",
      "cheerful": "\u5F00\u6717",
      "disgruntled": "\u4E0D\u6EE1",
      "fearful": "\u6050\u60E7",
      "gentle": "\u6E29\u67D4",
      "lyrical": "\u6292\u60C5",
      "sad": "\u60B2\u4F24",
      "serious": "\u4E25\u8083",
      "poetry-reading": "\u8BD7\u6B4C\u6717\u8BF5",
      "livecommercial": "\u76F4\u64AD\u5E26\u8D27",
      "embarrassed": "\u5C34\u5C2C",
      "depressed": "\u4F4E\u843D",
      "envious": "\u5AC9\u5992",
      "narration-relaxed": "\u65C1\u767D-\u8F7B\u677E",
      "sports-commentary": "\u4F53\u80B2\u89E3\u8BF4",
      "sports-commentary-excited": "\u4F53\u80B2\u89E3\u8BF4-\u6FC0\u52A8",
      "narration-professional": "\u65C1\u767D-\u4E13\u4E1A",
      "newscast-casual": "\u65B0\u95FB-\u968F\u610F",
      "newscast-formal": "\u65B0\u95FB-\u6B63\u5F0F",
      "advertisement-upbeat": "\u5E7F\u544A-\u6B22\u5FEB",
      "documentary-narration": "\u7EAA\u5F55\u7247\u65C1\u767D",
      "excited": "\u5174\u594B",
      "friendly": "\u53CB\u597D",
      "terrified": "\u60CA\u6050",
      "shouting": "\u558A\u53EB",
      "unfriendly": "\u51B7\u6DE1",
      "whispering": "\u8033\u8BED",
      "hopeful": "\u671F\u5F85",
      "empathetic": "\u5171\u60C5"
    };

EDGE_VOICES = [
      // 中文（普通话）- 女声
      { id: "zh-CN-XiaoxiaoNeural", name: "\u6653\u6653", gender: "Female", styles: ["general", "assistant", "chat", "customerservice", "newscast", "affectionate", "angry", "calm", "cheerful", "disgruntled", "fearful", "gentle", "lyrical", "sad", "serious", "poetry-reading"] },
      { id: "zh-CN-XiaoyiNeural", name: "\u6653\u4F0A", gender: "Female", styles: ["general", "angry", "disgruntled", "affectionate", "cheerful", "fearful", "gentle", "sad", "serious"] },
      { id: "zh-CN-XiaochenNeural", name: "\u6653\u8FB0", gender: "Female", styles: ["general", "livecommercial"] },
      { id: "zh-CN-XiaohanNeural", name: "\u6653\u6DB5", gender: "Female", styles: ["general", "calm", "fearful", "cheerful", "disgruntled", "serious", "angry", "sad", "gentle", "affectionate", "embarrassed"] },
      { id: "zh-CN-XiaomengNeural", name: "\u6653\u68A6", gender: "Female", styles: ["general", "chat"] },
      { id: "zh-CN-XiaomoNeural", name: "\u6653\u58A8", gender: "Female", styles: ["general", "embarrassed", "calm", "fearful", "cheerful", "disgruntled", "serious", "angry", "sad", "depressed", "affectionate", "gentle", "envious"] },
      { id: "zh-CN-XiaoqiuNeural", name: "\u6653\u79CB", gender: "Female", styles: ["general"] },
      { id: "zh-CN-XiaoruiNeural", name: "\u6653\u777F", gender: "Female", styles: ["general", "calm", "fearful", "angry", "sad"] },
      { id: "zh-CN-XiaoshuangNeural", name: "\u6653\u53CC\uFF08\u513F\u7AE5\uFF09", gender: "Female", styles: ["general", "chat"] },
      { id: "zh-CN-XiaoxuanNeural", name: "\u6653\u8431", gender: "Female", styles: ["general", "calm", "fearful", "cheerful", "disgruntled", "serious", "angry", "gentle", "depressed"] },
      { id: "zh-CN-XiaoyanNeural", name: "\u6653\u989C", gender: "Female", styles: ["general"] },
      { id: "zh-CN-XiaozhenNeural", name: "\u6653\u7504", gender: "Female", styles: ["general", "angry", "disgruntled", "cheerful", "fearful", "sad", "serious"] },
      // 中文（普通话）- 男声
      { id: "zh-CN-YunxiNeural", name: "\u4E91\u5E0C", gender: "Male", styles: ["general", "narration-relaxed", "embarrassed", "fearful", "cheerful", "disgruntled", "serious", "angry", "sad", "depressed", "chat", "assistant", "newscast"] },
      { id: "zh-CN-YunjianNeural", name: "\u4E91\u5065", gender: "Male", styles: ["general", "narration-relaxed", "sports-commentary", "sports-commentary-excited"] },
      { id: "zh-CN-YunyangNeural", name: "\u4E91\u626C", gender: "Male", styles: ["general", "customerservice", "narration-professional", "newscast-casual"] },
      { id: "zh-CN-YunyeNeural", name: "\u4E91\u91CE", gender: "Male", styles: ["general", "embarrassed", "calm", "fearful", "cheerful", "disgruntled", "serious", "angry", "sad"] },
      { id: "zh-CN-YunzeNeural", name: "\u4E91\u6CFD", gender: "Male", styles: ["general", "calm", "fearful", "cheerful", "disgruntled", "serious", "angry", "sad", "depressed", "documentary-narration"] },
      { id: "zh-CN-YunhaoNeural", name: "\u4E91\u7693", gender: "Male", styles: ["general", "advertisement-upbeat"] },
      { id: "zh-CN-YunfengNeural", name: "\u4E91\u67AB", gender: "Male", styles: ["general", "angry", "disgruntled", "cheerful", "fearful", "sad", "serious"] },
      { id: "zh-CN-YunxiaNeural", name: "\u4E91\u590F\uFF08\u513F\u7AE5\uFF09", gender: "Male", styles: ["general"] },
      // 中文（台湾）
      { id: "zh-TW-HsiaoChenNeural", name: "\u66C9\u81FB\uFF08\u53F0\u6E7E\u5973\uFF09", gender: "Female", styles: ["general"] },
      { id: "zh-TW-YunJheNeural", name: "\u96F2\u54F2\uFF08\u53F0\u6E7E\u7537\uFF09", gender: "Male", styles: ["general"] },
      { id: "zh-TW-HsiaoYuNeural", name: "\u66C9\u96E8\uFF08\u53F0\u6E7E\u5973\uFF09", gender: "Female", styles: ["general"] },
      // 粤语
      { id: "zh-HK-HiuGaaiNeural", name: "\u66C9\u4F73\uFF08\u7CA4\u8BED\u5973\uFF09", gender: "Female", styles: ["general"] },
      { id: "zh-HK-WanLungNeural", name: "\u96F2\u9F8D\uFF08\u7CA4\u8BED\u7537\uFF09", gender: "Male", styles: ["general"] },
      { id: "zh-HK-HiuMaanNeural", name: "\u66C9\u66FC\uFF08\u7CA4\u8BED\u5973\uFF09", gender: "Female", styles: ["general"] },
      // 英语
      { id: "en-US-JennyNeural", name: "Jenny\uFF08\u82F1\u8BED\u5973\uFF09", gender: "Female", styles: ["general", "assistant", "chat", "customerservice", "newscast", "angry", "cheerful", "sad", "excited", "friendly", "terrified", "shouting", "unfriendly", "whispering", "hopeful"] },
      { id: "en-US-GuyNeural", name: "Guy\uFF08\u82F1\u8BED\u7537\uFF09", gender: "Male", styles: ["general", "newscast", "angry", "cheerful", "sad", "excited", "friendly", "terrified", "shouting", "unfriendly", "whispering", "hopeful"] },
      { id: "en-US-AriaNeural", name: "Aria\uFF08\u82F1\u8BED\u5973\uFF09", gender: "Female", styles: ["general", "chat", "customerservice", "narration-professional", "newscast-casual", "newscast-formal", "cheerful", "empathetic", "angry", "sad", "excited", "friendly", "terrified", "shouting", "unfriendly", "whispering", "hopeful"] },
      // 日语
      { id: "ja-JP-NanamiNeural", name: "\u4E03\u6D77\uFF08\u65E5\u8BED\u5973\uFF09", gender: "Female", styles: ["general", "chat", "customerservice", "cheerful"] },
      { id: "ja-JP-KeitaNeural", name: "\u572D\u592A\uFF08\u65E5\u8BED\u7537\uFF09", gender: "Male", styles: ["general"] },
      // 韩语
      { id: "ko-KR-SunHiNeural", name: "SunHi\uFF08\u97E9\u8BED\u5973\uFF09", gender: "Female", styles: ["general", "cheerful"] },
      { id: "ko-KR-InJoonNeural", name: "InJoon\uFF08\u97E9\u8BED\u7537\uFF09", gender: "Male", styles: ["general"] }
    ];

availableEdgeServers = [];

edgeServerIndex = 0;

edgePingInProgress = false;

edgePingPromise = null;

lastEdgePingResult = null;

lastEdgePingTime = 0;

SILENT_WAV = createSilentWav();

state = "idle";

audioQueue = [];

isAudioPlaying = false;

nextPlayIdx = 0;

currentAudio = null;

currentSessionId = "";

currentRequestId2 = "";

currentAutoPlay = true;

activeTtsCount = 0;

ttsWaitQueue = [];

lbCache = { url: null, expires: 0 };

LB_CACHE_TTL = 15e3;

function saveEdgePingToSettings() {
  if (!extension_settings[extensionName]) return;
  extension_settings[extensionName].edgePingCache = {
    servers: availableEdgeServers.map((s) => ({ name: s.name, url: s.url, latency: s.latency })),
    pingResult: lastEdgePingResult,
    pingTime: lastEdgePingTime
  };
  saveSettingsDebounced();
  log("\u{1F4BE} Edge ping \u7ED3\u679C\u5DF2\u4FDD\u5B58\u5230\u63D2\u4EF6\u8BBE\u7F6E (edgePingCache)");
}

function loadEdgePingFromSettings() {
  if (!extension_settings[extensionName]) return false;
  const cache = extension_settings[extensionName].edgePingCache;
  if (!cache || !cache.servers || !cache.pingTime) return false;
  const validUrls = new Set(EDGE_TTS_CONFIG.proxyServers.map((s) => s.url));
  const validServers = cache.servers.filter((s) => validUrls.has(s.url));
  if (validServers.length === 0) {
    log("\u{1F4C2} \u7F13\u5B58\u7684 Edge \u670D\u52A1\u5668\u5DF2\u4E0D\u5728\u5F53\u524D\u914D\u7F6E\u5217\u8868\u4E2D\uFF0C\u5C06\u91CD\u65B0\u68C0\u6D4B\u65B0\u8282\u70B9");
    return false;
  }
  availableEdgeServers = validServers.map((s) => ({ name: s.name, url: s.url, latency: s.latency }));
  edgeServerIndex = 0;
  lastEdgePingResult = cache.pingResult;
  lastEdgePingTime = cache.pingTime;
  const ageMinutes = Math.round((Date.now() - cache.pingTime) / 6e4);
  log(`\u{1F4C2} \u5DF2\u4ECE\u63D2\u4EF6\u8BBE\u7F6E\u52A0\u8F7D Edge ping \u7F13\u5B58: ${availableEdgeServers.length} \u4E2A\u53EF\u7528\u670D\u52A1\u5668 (\u7F13\u5B58\u4E8E ${ageMinutes} \u5206\u949F\u524D)`);
  return true;
}

function b32Decode(s) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  s = s.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const c of s) {
    const v = A.indexOf(c);
    if (v >= 0) bits += v.toString(2).padStart(5, "0");
  }
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return out;
}

async function hmacSha1(key, data) {
  const ck = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", ck, data);
  return new Uint8Array(sig);
}

async function generateTOTP(secret) {
  const key = b32Decode(secret);
  const epoch = Math.floor(Date.now() / 1e3);
  const counter = Math.floor(epoch / 30);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter, false);
  const hmac = await hmacSha1(key, new Uint8Array(buf));
  const offset = hmac[hmac.length - 1] & 15;
  const code = ((hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255) % 1e6;
  return code.toString().padStart(6, "0");
}

function createSilentWav() {
  const sampleRate = 16e3;
  const numSamples = Math.floor(sampleRate * 0.1);
  const pcm = new Int16Array(numSamples);
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
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ws(36, "data");
  v.setUint32(40, pcm.byteLength, true);
  new Uint8Array(wav, 44).set(new Uint8Array(pcm.buffer));
  return new Blob([wav], { type: "audio/wav" });
}

function log(msg) {
  console.log("[TTS]", msg);
}

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getChatServerList() {
  const raw = TTS_CONFIG.chatServerUrls;
  return raw.split(/[\n,]+/).map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
}

function getLbServerUrl() {
  return TTS_CONFIG.lbServerUrl.trim().replace(/\/+$/, "");
}

function resolveAudioUrl(url, base) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (base) return base.replace(/\/+$/, "") + (url.startsWith("/") ? "" : "/") + url;
  if (location.protocol.startsWith("http")) return location.origin + (url.startsWith("/") ? "" : "/") + url;
  log("\u26A0\uFE0F \u97F3\u9891\u5730\u5740\u4E3A\u76F8\u5BF9\u8DEF\u5F84\u4F46\u672A\u914D\u7F6E Chat \u670D\u52A1\u5730\u5740");
  return url;
}

async function getChatServerFromLB() {
  const lbUrl = getLbServerUrl();
  if (!lbUrl) return null;
  if (lbCache.url && Date.now() < lbCache.expires) {
    log(`\u26A1 \u4F7F\u7528\u7F13\u5B58\u7684\u5747\u8861\u8282\u70B9: ${lbCache.url}`);
    return lbCache.url;
  }
  try {
    const totp = await generateTOTP(TTS_CONFIG.TOTP_SECRET);
    const res = await fetch(`${lbUrl}/api/pick-server`, {
      headers: { "X-TOTP-Code": totp },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const data = await res.json();
    if (data.success && data.server && data.server.url) {
      const serverUrl = data.server.url.replace(/\/+$/, "");
      lbCache = { url: serverUrl, expires: Date.now() + LB_CACHE_TTL };
      log(`\u2696\uFE0F \u5747\u8861\u5668\u5206\u914D: ${data.server.name || serverUrl} (\u5EF6\u8FDF${data.server.latency}ms, \u7B56\u7565:${data.stats.strategy})`);
      return serverUrl;
    } else {
      log(`\u26A0\uFE0F \u5747\u8861\u5668\u8FD4\u56DE: ${data.error || "\u65E0\u53EF\u7528\u8282\u70B9"}`);
      return null;
    }
  } catch (e) {
    log(`\u26A0\uFE0F \u5747\u8861\u5668\u8BF7\u6C42\u5931\u8D25: ${e.message}`);
    return null;
  }
}

async function getChatServer() {
  const lbResult = await getChatServerFromLB();
  if (lbResult) return lbResult;
  const list = getChatServerList();
  if (list.length > 0) {
    const fallback = list[Math.floor(Math.random() * list.length)];
    log(`\u{1F504} \u56DE\u9000\u5230\u5907\u7528\u5730\u5740: ${fallback}`);
    return fallback;
  }
  return "";
}

function splitTextToSegments(text, minLen, maxLen, newlineOnly = false) {
  if (!text || !text.trim()) return [];
  if (newlineOnly) {
    return text.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  }
  const rawParts = text.replace(/([。！？；\n!?;])/g, "$1\0").split("\0").filter((s) => s.length > 0);
  const merged = [];
  let buffer = "";
  for (const part of rawParts) {
    buffer += part;
    if (buffer.trim().length >= minLen) {
      merged.push(buffer.trim());
      buffer = "";
    }
  }
  if (buffer.trim()) {
    if (merged.length > 0 && buffer.trim().length < minLen) {
      merged[merged.length - 1] += buffer;
    } else {
      merged.push(buffer.trim());
    }
  }
  const result = [];
  for (const seg of merged) {
    if (seg.length <= maxLen) {
      result.push(seg);
    } else {
      const subParts = seg.replace(/([，、：…—,:\-])/g, "$1\0").split("\0").filter((s) => s.length > 0);
      let sub = "";
      for (const sp of subParts) {
        if ((sub + sp).length > maxLen && sub.trim()) {
          result.push(sub.trim());
          sub = sp;
        } else {
          sub += sp;
        }
      }
      if (sub.trim()) result.push(sub.trim());
    }
  }
  const final = [];
  for (const seg of result) {
    if (!seg) continue;
    if (seg.length <= maxLen) {
      final.push(seg);
    } else {
      for (let i = 0; i < seg.length; i += maxLen) {
        const chunk = seg.slice(i, i + maxLen).trim();
        if (chunk) final.push(chunk);
      }
    }
  }
  return final;
}

async function requestParrotTTS(text, segIdx, requestParams) {
  const chatBase = await getChatServer();
  if (!chatBase) throw new Error("\u65E0\u53EF\u7528\u670D\u52A1\u8282\u70B9");
  const voice = requestParams.voice || TTS_CONFIG.voice;
  const systemPrompt = TTS_CONFIG.systemPrompt;
  const temperature = requestParams.temperature || TTS_CONFIG.temperature;
  const topP = requestParams.topP || TTS_CONFIG.topP;
  const useInline = TTS_CONFIG.inlineAudio;
  const fd = new FormData();
  const silentFile = new File([SILENT_WAV], "silent.wav", { type: "audio/wav" });
  fd.append("audio", silentFile);
  fd.append("history", JSON.stringify([{ role: "user", content: text }]));
  fd.append("systemPrompt", systemPrompt);
  fd.append("voice", voice);
  fd.append("temperature", String(temperature));
  fd.append("topP", String(topP));
  fd.append("enableAudio", "true");
  fd.append("enableThinking", "false");
  if (useInline) fd.append("inlineAudio", "true");
  const totp = await generateTOTP(TTS_CONFIG.TOTP_SECRET);
  log(`\u{1F99C} TTS #${segIdx + 1} \u8BF7\u6C42\u4E2D... "${text.slice(0, 20)}${text.length > 20 ? "..." : ""}" \u2192 ${chatBase}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resp;
  try {
    resp = await fetch(`${chatBase}/api/chat`, {
      method: "POST",
      body: fd,
      headers: { "X-TOTP-Code": totp },
      signal: controller.signal
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") throw new Error("TTS \u8BF7\u6C42\u8D85\u65F6(180s)");
    throw e;
  }
  if (!resp.ok) {
    clearTimeout(timeout);
    throw new Error(`TTS \u8BF7\u6C42\u5931\u8D25 ${resp.status}`);
  }
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let sseBuf = "";
  let audioUrl = null;
  let audioDataUri = null;
  let evType = null;
  while (true) {
    const { done, value } = await reader.read();
    if (!done) {
      sseBuf += dec.decode(value, { stream: true });
    } else {
      sseBuf += dec.decode();
    }
    const lines = sseBuf.split("\n");
    sseBuf = done ? "" : lines.pop();
    for (const line of lines) {
      if (line.startsWith("event:")) {
        evType = line.slice(6).trim();
        continue;
      }
      if (!line.startsWith("data:")) continue;
      const pl = line.slice(5).trim();
      if (!evType) continue;
      if (evType === "audio") {
        const p = tryParseJSON(pl);
        if (p && p.data) {
          audioDataUri = p.data;
        } else {
          audioUrl = resolveAudioUrl(p ? p.url : pl, chatBase);
        }
      } else if (evType === "done") {
        const p = tryParseJSON(pl);
        if (p && p.audioUrl && !audioUrl) {
          audioUrl = resolveAudioUrl(p.audioUrl, chatBase);
        }
      }
      evType = null;
    }
    if (done) break;
  }
  clearTimeout(timeout);
  log(`\u{1F99C} TTS #${segIdx + 1} SSE\u5B8C\u6210, audioDataUri=${audioDataUri ? "\u6709(" + audioDataUri.length + "\u5B57\u7B26)" : "\u65E0"}, audioUrl=${audioUrl ? "\u6709" : "\u65E0"}`);
  if (audioDataUri) {
    return { inline: true, dataUri: audioDataUri };
  }
  return audioUrl ? { inline: false, url: audioUrl } : null;
}

async function pingEdgeServers(force = false) {
  if (edgePingInProgress && edgePingPromise) {
    log("\u23F3 Edge \u670D\u52A1\u5668\u68C0\u6D4B\u5DF2\u5728\u8FDB\u884C\u4E2D\uFF0C\u7B49\u5F85\u7ED3\u679C...");
    return edgePingPromise;
  }
  if (!force && availableEdgeServers.length > 0) {
    log(`\u26A1 \u4F7F\u7528\u7F13\u5B58\u7684 Edge \u670D\u52A1\u5668\u5217\u8868 (${availableEdgeServers.length} \u4E2A\u53EF\u7528)`);
    return availableEdgeServers;
  }
  edgePingInProgress = true;
  log("\u{1F50D} \u5F00\u59CB\u68C0\u6D4B Edge TTS \u4EE3\u7406\u670D\u52A1\u5668...");
  edgePingPromise = (async () => {
    try {
      const results = await Promise.allSettled(
        EDGE_TTS_CONFIG.proxyServers.map(async (server) => {
          const start = Date.now();
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), EDGE_TTS_CONFIG.pingTimeout);
          try {
            const testUrl = `${server.url}?t=test&v=zh-CN-XiaoxiaoNeural&r=0&p=0&vol=100`;
            const resp = await fetch(testUrl, {
              signal: controller.signal,
              headers: { "Accept": "audio/*" }
            });
            clearTimeout(timeout);
            if (resp.ok) {
              const latency = Date.now() - start;
              log(`  \u2705 ${server.name} (${latency}ms)`);
              return { name: server.name, url: server.url, latency };
            }
            throw new Error(`HTTP ${resp.status}`);
          } catch (e) {
            clearTimeout(timeout);
            const latency = Date.now() - start;
            log(`  \u274C ${server.name} (${latency}ms) - ${e.name === "AbortError" ? "\u8D85\u65F6" : e.message}`);
            throw e;
          }
        })
      );
      availableEdgeServers = results.filter((r) => r.status === "fulfilled").map((r) => r.value).sort((a, b) => a.latency - b.latency);
      edgeServerIndex = 0;
      lastEdgePingTime = Date.now();
      lastEdgePingResult = {
        timestamp: Date.now(),
        available: availableEdgeServers.map((s) => ({ name: s.name, latency: s.latency })),
        failed: results.map((r, i) => r.status === "rejected" ? EDGE_TTS_CONFIG.proxyServers[i].name : null).filter(Boolean)
      };
      log(`\u{1F50D} Edge \u670D\u52A1\u5668\u68C0\u6D4B\u5B8C\u6210: ${availableEdgeServers.length}/${EDGE_TTS_CONFIG.proxyServers.length} \u53EF\u7528`);
      saveEdgePingToSettings();
      return availableEdgeServers;
    } finally {
      edgePingInProgress = false;
      edgePingPromise = null;
    }
  })();
  return edgePingPromise;
}

function getNextEdgeServer() {
  if (availableEdgeServers.length === 0) return null;
  const server = availableEdgeServers[edgeServerIndex % availableEdgeServers.length];
  edgeServerIndex++;
  return server;
}

function markEdgeServerFailed(server) {
  const idx = availableEdgeServers.findIndex((s) => s.url === server.url);
  if (idx >= 0) {
    availableEdgeServers.splice(idx, 1);
    log(`\u{1F6AB} \u5DF2\u79FB\u9664\u5931\u8D25\u7684 Edge \u670D\u52A1\u5668: ${server.name}, \u5269\u4F59 ${availableEdgeServers.length} \u4E2A`);
    saveEdgePingToSettings();
  }
}

async function requestEdgeTTS(text, segIdx, requestParams) {
  if (availableEdgeServers.length === 0) {
    await pingEdgeServers();
  }
  if (availableEdgeServers.length === 0) {
    throw new Error("\u65E0\u53EF\u7528 Edge TTS \u4EE3\u7406\u670D\u52A1\u5668");
  }
  const voice = requestParams.edgeVoice || EDGE_TTS_CONFIG.voice;
  const style = requestParams.edgeStyle || EDGE_TTS_CONFIG.style;
  const rate = requestParams.edgeRate !== void 0 ? requestParams.edgeRate : EDGE_TTS_CONFIG.rate;
  const pitch = requestParams.edgePitch !== void 0 ? requestParams.edgePitch : EDGE_TTS_CONFIG.pitch;
  const volume = (requestParams.edgeVolume !== void 0 ? requestParams.edgeVolume : EDGE_TTS_CONFIG.volume) + 50;
  const encodedText = encodeURIComponent(text);
  const triedServers = /* @__PURE__ */ new Set();
  let lastError = null;
  while (true) {
    const server = getNextEdgeServer();
    if (!server || triedServers.has(server.url)) {
      break;
    }
    triedServers.add(server.url);
    const url = `${server.url}?t=${encodedText}&v=${voice}&r=${rate}&p=${pitch}&s=${style}&vol=${volume}`;
    log(`\u{1F50A} Edge TTS #${segIdx + 1} \u8BF7\u6C42\u4E2D... "${text.slice(0, 20)}${text.length > 20 ? "..." : ""}" \u2192 ${server.name}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { "Accept": "audio/*" }
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        throw new Error(`Edge TTS \u8BF7\u6C42\u5931\u8D25 HTTP-${resp.status}`);
      }
      const contentType = resp.headers.get("Content-Type") || "";
      if (contentType && !contentType.includes("audio")) {
        const errorText = await resp.text();
        throw new Error(`Edge TTS \u8FD4\u56DE\u975E\u97F3\u9891: ${errorText.slice(0, 100)}`);
      }
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      log(`\u{1F50A} Edge TTS #${segIdx + 1} \u5B8C\u6210, blobUrl \u5DF2\u521B\u5EFA (\u670D\u52A1\u5668: ${server.name})`);
      return { inline: false, url: blobUrl, isBlob: true };
    } catch (e) {
      clearTimeout(timeout);
      markEdgeServerFailed(server);
      lastError = e.name === "AbortError" ? new Error(`Edge TTS \u8BF7\u6C42\u8D85\u65F6(${TIMEOUT_MS / 1e3}s) - ${server.name}`) : e;
      log(`\u26A0\uFE0F Edge TTS #${segIdx + 1} \u670D\u52A1\u5668 ${server.name} \u5931\u8D25: ${lastError.message}, \u5C1D\u8BD5\u4E0B\u4E00\u4E2A\u670D\u52A1\u5668...`);
      if (availableEdgeServers.length > 0) {
        continue;
      }
      break;
    }
  }
  if (availableEdgeServers.length === 0 && triedServers.size > 0) {
    log(`\u{1F504} \u6240\u6709 Edge \u670D\u52A1\u5668\u5747\u5931\u8D25\uFF0C\u5C1D\u8BD5\u91CD\u65B0\u68C0\u6D4B...`);
    await pingEdgeServers(true);
    if (availableEdgeServers.length > 0) {
      const retryServer = getNextEdgeServer();
      if (retryServer && !triedServers.has(retryServer.url)) {
        const url = `${retryServer.url}?t=${encodedText}&v=${voice}&r=${rate}&p=${pitch}&s=${style}&vol=${volume}`;
        log(`\u{1F50A} Edge TTS #${segIdx + 1} \u91CD\u65B0\u68C0\u6D4B\u540E\u91CD\u8BD5 \u2192 ${retryServer.name}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const resp = await fetch(url, {
            signal: controller.signal,
            headers: { "Accept": "audio/*" }
          });
          clearTimeout(timeout);
          if (resp.ok) {
            const contentType = resp.headers.get("Content-Type") || "";
            if (!contentType || contentType.includes("audio")) {
              const blob = await resp.blob();
              const blobUrl = URL.createObjectURL(blob);
              log(`\u{1F50A} Edge TTS #${segIdx + 1} \u91CD\u8BD5\u6210\u529F! (\u670D\u52A1\u5668: ${retryServer.name})`);
              return { inline: false, url: blobUrl, isBlob: true };
            }
          }
          markEdgeServerFailed(retryServer);
        } catch (retryErr) {
          clearTimeout(timeout);
          markEdgeServerFailed(retryServer);
        }
      }
    }
  }
  throw lastError || new Error("\u65E0\u53EF\u7528 Edge TTS \u4EE3\u7406\u670D\u52A1\u5668");
}

async function fetchAudioBlob(url) {
  const resp = await fetch(url, {
    credentials: "include",
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!resp.ok) throw new Error(`\u97F3\u9891\u8BF7\u6C42\u5931\u8D25 ${resp.status}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

async function handleTTSRequest(requestData) {
  const { id, text, segments: preSegments, voice, autoPlay = true, temperature, topP, minSegLen, maxSegLen, newlineOnly, edgeVoice, edgeStyle, edgeRate, edgePitch, edgeVolume } = requestData;
  if (!text || !text.trim()) {
    emitResponse(id, { success: false, segIndex: 0, totalSegments: 0, status: "error", error: "\u6587\u672C\u4E3A\u7A7A" });
    return;
  }
  if (state === "active") {
    stopAll();
  }
  let segments;
  let segmentStyles = null;
  if (preSegments && Array.isArray(preSegments) && preSegments.length > 0) {
    segments = preSegments.map((s) => s.text);
    segmentStyles = preSegments.map((s) => {
      if (!s.style) return null;
      const voiceId = edgeVoice || EDGE_TTS_CONFIG.voice;
      return validateEdgeStyle(s.style, voiceId);
    });
    log(`\u{1F4DD} \u4F7F\u7528\u9884\u5206\u6BB5: ${segments.length} \u6BB5 (\u542B\u9010\u53E5\u98CE\u683C\u6807\u8BB0)`);
    for (let i = 0; i < segments.length; i++) {
      const styleTag = segmentStyles[i] ? ` [style=${segmentStyles[i]}]` : "";
      log(`   \u6BB5${i + 1}: "${segments[i].slice(0, 40)}${segments[i].length > 40 ? "..." : ""}" (${segments[i].length}\u5B57)${styleTag}`);
    }
  } else {
    const segMinLen = minSegLen || TTS_CONFIG.minSegLen;
    const segMaxLen = maxSegLen || TTS_CONFIG.maxSegLen;
    const segNewlineOnly = newlineOnly !== void 0 ? newlineOnly : TTS_CONFIG.newlineOnly;
    segments = splitTextToSegments(text.trim(), segMinLen, segMaxLen, segNewlineOnly);
    if (segments.length === 0) {
      emitResponse(id, { success: false, segIndex: 0, totalSegments: 0, status: "error", error: "\u65AD\u53E5\u540E\u65E0\u6709\u6548\u6BB5\u843D" });
      return;
    }
    log(`\u{1F4DD} \u65AD\u53E5\u5B8C\u6210: ${segments.length} \u6BB5 (min=${segMinLen}, max=${segMaxLen})`);
    for (let i = 0; i < segments.length; i++) {
      log(`   \u6BB5${i + 1}: "${segments[i].slice(0, 40)}${segments[i].length > 40 ? "..." : ""}" (${segments[i].length}\u5B57)`);
    }
  }
  resetAudioQueue();
  currentSessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  currentRequestId2 = id;
  currentAutoPlay = autoPlay;
  setState("active");
  const requestParams = { voice, temperature, topP, edgeVoice, edgeStyle, edgeRate, edgePitch, edgeVolume };
  const sid = currentSessionId;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const queueItem = { text: seg, segIdx: i, status: "pending", url: null, blobUrl: null, sessionId: sid };
    audioQueue.push(queueItem);
    emitResponse(id, { success: true, segIndex: i, totalSegments: segments.length, status: "pending" });
    let segRequestParams = requestParams;
    if (segmentStyles && segmentStyles[i]) {
      segRequestParams = { ...requestParams, edgeStyle: segmentStyles[i] };
    }
    enqueueTTSTask(seg, i, queueItem, sid, segRequestParams);
  }
}

function validateEdgeStyle(styleId, voiceId) {
  if (!styleId) return null;
  const voice = EDGE_VOICES.find((v) => v.id === voiceId);
  if (!voice) return null;
  return voice.styles.includes(styleId) ? styleId : null;
}

function enqueueTTSTask(text, segIdx, queueItem, sessionId, requestParams) {
  const maxRetries = TTS_CONFIG.maxRetries || 2;
  const retryDelay = TTS_CONFIG.retryDelay || 1e3;
  const task = async () => {
    let attempt = 0;
    let lastError = null;
    while (attempt <= maxRetries) {
      try {
        if (state !== "active" || currentSessionId !== sessionId) return;
        if (attempt > 0) {
          log(`\u{1F504} \u6BB5\u843D #${segIdx + 1} \u7B2C ${attempt} \u6B21\u91CD\u8BD5...`);
          queueItem.status = "pending";
        }
        const result = currentEngine === "edge" ? await requestEdgeTTS(text, segIdx, requestParams) : await requestParrotTTS(text, segIdx, requestParams);
        if (state !== "active" || currentSessionId !== sessionId) return;
        if (!result) {
          lastError = `\u6BB5\u843D #${segIdx + 1} TTS \u65E0\u97F3\u9891`;
          attempt++;
          if (attempt <= maxRetries) {
            log(`\u26A0\uFE0F ${lastError}\uFF0C${retryDelay}ms \u540E\u91CD\u8BD5 (${attempt}/${maxRetries})`);
            await new Promise((r) => setTimeout(r, retryDelay));
            continue;
          }
          queueItem.status = "error";
          emitResponse(currentRequestId2, { success: false, segIndex: segIdx, totalSegments: audioQueue.length, status: "error", error: lastError });
          log(`\u26A0\uFE0F ${lastError}\uFF08\u5DF2\u91CD\u8BD5 ${maxRetries} \u6B21\uFF09`);
          skipIfCurrent(segIdx);
          return;
        }
        let blobUrl;
        if (result.isBlob) {
          blobUrl = result.url;
          log(`\u{1F4E5} \u6BB5\u843D #${segIdx + 1} Edge \u97F3\u9891\u5C31\u7EEA`);
        } else if (result.inline) {
          log(`\u{1F4E5} \u6BB5\u843D #${segIdx + 1} \u5185\u8054\u97F3\u9891\u8F6C\u6362\u4E2D...`);
          const resp = await fetch(result.dataUri);
          const blob = await resp.blob();
          blobUrl = URL.createObjectURL(blob);
        } else {
          log(`\u{1F4E5} \u6BB5\u843D #${segIdx + 1} \u9884\u7F13\u5B58\u97F3\u9891...`);
          blobUrl = await fetchAudioBlob(result.url);
        }
        if (state !== "active" || currentSessionId !== sessionId) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        queueItem.url = result.inline ? "(inline)" : result.url;
        queueItem.blobUrl = blobUrl;
        queueItem.status = "ready";
        emitResponse(currentRequestId2, { success: true, segIndex: segIdx, totalSegments: audioQueue.length, status: "ready", blobUrl });
        log(`\u2705 \u6BB5\u843D #${segIdx + 1} \u5DF2\u7F13\u5B58\u5C31\u7EEA${attempt > 0 ? `\uFF08\u7B2C ${attempt} \u6B21\u91CD\u8BD5\u6210\u529F\uFF09` : ""}`);
        if (currentAutoPlay) tryPlayNext();
        return;
      } catch (e) {
        if (state !== "active" || currentSessionId !== sessionId) return;
        lastError = e.message;
        attempt++;
        if (attempt <= maxRetries) {
          log(`\u26A0\uFE0F \u6BB5\u843D #${segIdx + 1} TTS \u5931\u8D25: ${e.message}\uFF0C${retryDelay}ms \u540E\u91CD\u8BD5 (${attempt}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }
        queueItem.status = "error";
        emitResponse(currentRequestId2, { success: false, segIndex: segIdx, totalSegments: audioQueue.length, status: "error", error: `\u6BB5\u843D #${segIdx + 1} TTS \u5931\u8D25: ${e.message}\uFF08\u5DF2\u91CD\u8BD5 ${maxRetries} \u6B21\uFF09` });
        log(`\u26A0\uFE0F \u6BB5\u843D #${segIdx + 1} TTS \u5931\u8D25: ${e.message}\uFF08\u5DF2\u91CD\u8BD5 ${maxRetries} \u6B21\uFF09`);
        skipIfCurrent(segIdx);
      }
    }
    if (queueItem.status === "pending") {
      queueItem.status = "error";
      skipIfCurrent(segIdx);
    }
  };
  const wrappedTask = async () => {
    activeTtsCount++;
    try {
      await task();
    } finally {
      activeTtsCount--;
      drainTTSWaitQueue();
      checkAllDone();
    }
  };
  if (activeTtsCount < TTS_CONFIG.maxConcurrency) {
    wrappedTask();
  } else {
    ttsWaitQueue.push(wrappedTask);
  }
}

function drainTTSWaitQueue() {
  while (ttsWaitQueue.length > 0 && activeTtsCount < TTS_CONFIG.maxConcurrency) {
    const next = ttsWaitQueue.shift();
    next();
  }
}

function skipIfCurrent(segIdx) {
  if (nextPlayIdx === segIdx) {
    nextPlayIdx++;
    if (currentAutoPlay) tryPlayNext();
  }
}

function resetAudioQueue() {
  stopPlayback();
  audioQueue = [];
  isAudioPlaying = false;
  nextPlayIdx = 0;
  activeTtsCount = 0;
  ttsWaitQueue = [];
  currentAudio = null;
}

function tryPlayNext() {
  if (isAudioPlaying) return;
  if (state !== "active") return;
  const item = audioQueue.find((q) => q.segIdx === nextPlayIdx);
  if (!item) {
    checkAllDone();
    return;
  }
  if (item.status === "ready") {
    playSegment(item);
  } else if (item.status === "error") {
    nextPlayIdx++;
    tryPlayNext();
  }
}

async function playSegment(item) {
  isAudioPlaying = true;
  item.status = "playing";
  emitResponse(currentRequestId2, { success: true, segIndex: item.segIdx, totalSegments: audioQueue.length, status: "playing" });
  const videoPlayer = getGlobalVideoPlayer();
  if (videoPlayer && videoPlayer.playTalkVideo) {
    videoPlayer.playTalkVideo();
  }
  try {
    const audio = new Audio(item.blobUrl);
    currentAudio = audio;
    audio.onended = () => {
      item.status = "done";
      const reqId = currentRequestId2;
      emitResponse(reqId, { success: true, segIndex: item.segIdx, totalSegments: audioQueue.length, status: "done" });
      isAudioPlaying = false;
      currentAudio = null;
      nextPlayIdx++;
      checkAllDone();
      if (state === "active") tryPlayNext();
    };
    audio.onerror = () => {
      log(`\u26A0\uFE0F \u6BB5\u843D #${item.segIdx + 1} \u64AD\u653E\u51FA\u9519`);
      item.status = "error";
      const reqId = currentRequestId2;
      emitResponse(reqId, { success: false, segIndex: item.segIdx, totalSegments: audioQueue.length, status: "error", error: "\u64AD\u653E\u51FA\u9519" });
      isAudioPlaying = false;
      currentAudio = null;
      nextPlayIdx++;
      checkAllDone();
      if (state === "active") tryPlayNext();
    };
    await audio.play();
    log(`\u25B6\uFE0F \u64AD\u653E\u6BB5\u843D #${item.segIdx + 1}: "${item.text.slice(0, 20)}..."`);
  } catch (e) {
    log(`\u26A0\uFE0F \u6BB5\u843D #${item.segIdx + 1} \u64AD\u653E\u5931\u8D25: ${e.message}`);
    item.status = "error";
    const reqId = currentRequestId2;
    emitResponse(reqId, { success: false, segIndex: item.segIdx, totalSegments: audioQueue.length, status: "error", error: `\u64AD\u653E\u5931\u8D25: ${e.message}` });
    isAudioPlaying = false;
    currentAudio = null;
    nextPlayIdx++;
    checkAllDone();
    if (state === "active") tryPlayNext();
  }
}

function checkAllDone() {
  if (audioQueue.length === 0) return;
  const allDone = audioQueue.every((q) => q.status === "done" || q.status === "error");
  if (allDone) {
    const successCount = audioQueue.filter((q) => q.status === "done").length;
    log(`\u{1F507} \u5168\u90E8\u64AD\u653E\u5B8C\u6BD5 (${successCount}/${audioQueue.length} \u6210\u529F)`);
    const videoPlayer = getGlobalVideoPlayer();
    if (videoPlayer && videoPlayer.stopTalkVideo) {
      videoPlayer.stopTalkVideo();
    }
    setState("idle");
  }
}

function stopPlayback() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
    }
    currentAudio = null;
  }
  isAudioPlaying = false;
}

function stopAll() {
  stopPlayback();
  const videoPlayer = getGlobalVideoPlayer();
  if (videoPlayer && videoPlayer.stopTalkVideo) {
    videoPlayer.stopTalkVideo();
  }
  ttsWaitQueue = [];
  audioQueue = [];
  nextPlayIdx = 0;
  activeTtsCount = 0;
  setState("idle");
  log("\u23F9\uFE0F \u5DF2\u505C\u6B62\u6240\u6709 TTS");
}

function setState(s) {
  state = s;
  eventSource.emit(eventNames.TTS_STATE_CHANGED, {
    state: s,
    requestId: currentRequestId2 || void 0
  });
  if (s === "idle") {
    currentRequestId2 = "";
    currentSessionId = "";
  }
}

function emitResponse(id, data) {
  eventSource.emit(eventNames.TTS_RESPONSE, {
    id,
    ...data
  });
}

function onTTSRequest(requestData) {
  handleTTSRequest(requestData).catch((e) => {
    log(`\u274C TTS \u8BF7\u6C42\u5904\u7406\u5F02\u5E38: ${e.message}`);
    emitResponse(requestData.id, { success: false, segIndex: 0, totalSegments: 0, status: "error", error: e.message });
    if (state === "active") {
      log("\u26A0\uFE0F TTS \u5F02\u5E38\u540E\u5F3A\u5236\u6062\u590D idle \u72B6\u6001");
      setState("idle");
    }
  });
}

function onTTSStop(data) {
  if (data && data.id) {
    if (currentRequestId2 === data.id) {
      stopAll();
    }
  } else {
    stopAll();
  }
}

function initializeTTS() {
  eventSource.on(eventNames.TTS_REQUEST, onTTSRequest);
  eventSource.on(eventNames.TTS_STOP, onTTSStop);
  const loaded = loadEdgePingFromSettings();
  if (loaded) {
    log("\u{1F4C2} \u5DF2\u6062\u590D\u4E0A\u6B21 Edge ping \u7ED3\u679C\uFF0C\u65E0\u9700\u91CD\u65B0\u68C0\u6D4B");
  }
  log("\u2705 TTS \u8BED\u97F3\u5408\u6210\u6A21\u5757\u5DF2\u521D\u59CB\u5316");
  log(`   \u5F53\u524D\u5F15\u64CE: ${currentEngine}`);
  log(`   Qwen \u9ED8\u8BA4\u58F0\u97F3: ${TTS_CONFIG.voice}`);
  log(`   Edge \u9ED8\u8BA4\u58F0\u97F3: ${EDGE_TTS_CONFIG.voice}`);
  log(`   \u8D1F\u8F7D\u5747\u8861\u5668: ${TTS_CONFIG.lbServerUrl}`);
  log(`   \u6700\u5927\u5E76\u53D1: ${TTS_CONFIG.maxConcurrency}`);
  log(`   \u8D85\u65F6: ${TIMEOUT_MS / 1e3}\u79D2`);
}

function getQwenVoices() {
  return [...AVAILABLE_VOICES];
}

function getTTSState() {
  return { state, requestId: currentRequestId2 };
}

function setTTSEngineType(engineType) {
  if (engineType !== "qwen" && engineType !== "edge") {
    log(`\u26A0\uFE0F \u65E0\u6548\u5F15\u64CE\u7C7B\u578B: ${engineType}\uFF0C\u4FDD\u6301\u5F53\u524D\u5F15\u64CE: ${currentEngine}`);
    return;
  }
  if (currentEngine === engineType) return;
  stopAll();
  currentEngine = engineType;
  log(`\u{1F504} TTS \u5F15\u64CE\u5DF2\u5207\u6362\u4E3A: ${currentEngine}`);
}

function getEdgeVoices() {
  return EDGE_VOICES.map((v) => ({
    id: v.id,
    name: v.name,
    gender: v.gender,
    styles: v.styles.map((s) => ({ id: s, name: EDGE_STYLE_MAP[s] || s }))
  }));
}

function getEdgeVoiceStyles(voiceId) {
  const voice = EDGE_VOICES.find((v) => v.id === voiceId);
  return voice ? voice.styles.map((s) => ({ id: s, name: EDGE_STYLE_MAP[s] || s })) : [];
}

async function pingAndRefreshServers() {
  const result = await pingEdgeServers(true);
  return {
    servers: result.map((s) => ({ name: s.name, url: s.url, latency: s.latency })),
    total: EDGE_TTS_CONFIG.proxyServers.length,
    available: availableEdgeServers.length,
    timestamp: Date.now()
  };
}

export { getEdgeVoiceStyles, getEdgeVoices, getQwenVoices, getTTSState, initializeTTS, pingAndRefreshServers, setTTSEngineType };
