// 还原自打包产物 — 原始模块: utils/novelaiTokenCalculator.js
import { extensionFolderPath } from "./config.js";

var tokenizer, transformersLoadPromise;

transformersLoadPromise = null;

tokenizer = null;

async function loadTransformersIsolated() {
  if (transformersLoadPromise) return transformersLoadPromise;
  const scriptSrc = `${extensionFolderPath}/transformers.min.js`;
  const absoluteScriptSrc = new URL(scriptSrc, window.location.href).href;
  try {
    await fetch(absoluteScriptSrc);
  } catch (e) {
    console.warn("[st-chatu8] transformers pre-fetch failed, falling back to direct import", e);
  }
  const originalDefine = window.define;
  const originalModule = window.module;
  const originalExports = window.exports;
  window.define = void 0;
  window.module = void 0;
  window.exports = void 0;
  try {
    const transformers = await import(absoluteScriptSrc);
    transformersLoadPromise = transformers;
    return transformers;
  } catch (error) {
    console.error("[st-chatu8] transformers load failed", error);
    transformersLoadPromise = null;
    throw error;
  } finally {
    window.define = originalDefine;
    window.module = originalModule;
    window.exports = originalExports;
  }
}

async function initNovelAITokenizer() {
  if (tokenizer) return;
  try {
    const transformers = await loadTransformersIsolated();
    const { AutoTokenizer, env } = transformers;
    env.allowLocalModels = false;
    const modelPath = "Xenova/t5-small";
    tokenizer = await AutoTokenizer.from_pretrained(modelPath);
  } catch (error) {
    console.error("[st-chatu8] \u52A0\u8F7D\u5206\u8BCD\u5668\u5931\u8D25:", error);
  }
}

async function calculateNovelAITokens(prompt2) {
  if (!tokenizer) await initNovelAITokenizer();
  if (!tokenizer || !prompt2) return 0;
  let processedPrompt = prompt2.replace(/[-+]?\d*\.?\d+::/g, "");
  processedPrompt = processedPrompt.replace(/::/g, "");
  processedPrompt = processedPrompt.replace(/[\r\n]+/g, " ");
  processedPrompt = processedPrompt.replace(/[{}[\]]/g, "");
  try {
    const encoded = await tokenizer(processedPrompt);
    const tokenIds = Array.from(encoded.input_ids.data);
    return tokenIds.length;
  } catch (error) {
    console.error("[st-chatu8] \u8BA1\u7B97 Token \u65F6\u53D1\u751F\u9519\u8BEF:", error);
    return 0;
  }
}

function getNovelAIQualityPresetsText(settings3) {
  let aqt = "";
  if (settings3.AQT_novelai != "" && settings3.novelaimode == "nai-diffusion-4-curated-preview") {
    aqt = "rating:general, best quality, very aesthetic, absurdres";
  } else if (settings3.AQT_novelai != "" && settings3.novelaimode == "nai-diffusion-4-full") {
    aqt = "no text, best quality, very aesthetic, absurdres";
  } else if (settings3.AQT_novelai != "" && settings3.novelaimode == "nai-diffusion-4-5-full") {
    aqt = "very aesthetic, masterpiece, no text";
  } else if (settings3.AQT_novelai != "" && settings3.novelaimode == "nai-diffusion-4-5-curated") {
    aqt = "very aesthetic, masterpiece, no text, -0.8::feet::, rating:general";
  } else if (settings3.AQT_novelai != "" && String(settings3.novelaimode || "").includes("nai-diffusion-5-full")) {
    aqt = "very aesthetic, amazing quality, no text";
  } else if (settings3.AQT_novelai != "" && settings3.novelaimode == "nai-diffusion-5-curated") {
    aqt = "very aesthetic, masterpiece, no text";
  } else if (settings3.AQT_novelai != "" && settings3.novelaimode == "nai-diffusion-3") {
    aqt = "best quality, amazing quality, very aesthetic, absurdres";
  }
  let ucp = "";
  if (settings3.novelaimode == "nai-diffusion-3" && settings3.UCP_novelai == "Heavy") {
    ucp = "lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]";
  } else if (settings3.novelaimode == "nai-diffusion-3" && settings3.UCP_novelai == "Light") {
    ucp = "lowres, jpeg artifacts, worst quality, watermark, blurry, very displeasing";
  } else if (settings3.novelaimode == "nai-diffusion-3" && settings3.UCP_novelai == "Human Focus") {
    ucp = "lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract], bad anatomy, bad hands, @_@, mismatched pupils, heart-shaped pupils, glowing eyes";
  } else if (settings3.novelaimode == "nai-diffusion-4-full" && settings3.UCP_novelai == "Heavy") {
    ucp = "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks, white blank page, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-full" && settings3.UCP_novelai == "Light") {
    ucp = "blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, white blank page, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-curated-preview" && settings3.UCP_novelai == "Heavy") {
    ucp = "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, logo, dated, signature, multiple views, gigantic breasts, white blank page, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-curated-preview" && settings3.UCP_novelai == "Light") {
    ucp = "blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, logo, dated, signature, white blank page, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-5-curated" && settings3.UCP_novelai == "Human Focus") {
    ucp = "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-5-curated" && settings3.UCP_novelai == "Heavy") {
    ucp = "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-5-curated" && settings3.UCP_novelai == "Light") {
    ucp = "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-5-full" && settings3.UCP_novelai == "Human Focus") {
    ucp = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy";
  } else if (settings3.novelaimode == "nai-diffusion-4-5-full" && settings3.UCP_novelai == "Heavy") {
    ucp = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-5-full" && settings3.UCP_novelai == "Light") {
    ucp = "lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page";
  } else if (settings3.novelaimode == "nai-diffusion-4-5-full" && settings3.UCP_novelai == "Furry Focus") {
    ucp = "{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic";
  } else if (settings3.novelaimode.includes("nai-diffusion-5") && settings3.UCP_novelai == "heavy") {
    ucp = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page";
  } else if (settings3.novelaimode.includes("nai-diffusion-5") && settings3.UCP_novelai == "light") {
    ucp = "lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::";
  } else if (settings3.novelaimode.includes("nai-diffusion-5") && settings3.UCP_novelai == "humanFocus") {
    ucp = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy";
  } else if (settings3.novelaimode.includes("nai-diffusion-5") && settings3.UCP_novelai == "furryFocus") {
    ucp = "{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic";
  }
  return { aqt, ucp };
}

function getNovelAIMaxTokens(modelOrSettings) {
  let model = "";
  if (typeof modelOrSettings === "string") {
    model = modelOrSettings;
  } else if (modelOrSettings && typeof modelOrSettings === "object") {
    model = modelOrSettings.novelaimode || "";
  }
  if (typeof document !== "undefined") {
    const select = document.getElementById("novelaimode");
    if (select && select.value) {
      model = select.value;
    }
  }
  return String(model || "").toLowerCase().includes("nai-diffusion-5") ? 1471 : 512;
}

export { calculateNovelAITokens, getNovelAIMaxTokens, getNovelAIQualityPresetsText };
