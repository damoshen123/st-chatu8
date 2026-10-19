// 还原自打包产物 — 原始模块: utils/banana.js
import { extension_settings } from "../../../../../extensions.js";
import { eventSource } from "../../../../../../script.js";
import { EventType, extensionName } from "./config.js";
import { addLog, clearLog, convertImageToJpeg, getRequestHeaders, getSortedCharacterIds, isPluginEnabled, isPluginToastDisabled, parsePromptStringWithCoordinates, prompt_replace_banana, prompt_replace_banana_for_character, stripChineseAnnotations } from "./utils.js";
import { getConfigImage } from "./configDatabase.js";
import { TaskStatus, TaskType, taskQueue } from "./taskQueue.js";
import { processCharacterPrompt } from "./characterprompt.js";
import { setItemImg } from "./database.js";
import { buildGenParams } from "./genParams.js";
import { recordImageGeneration } from "./imageGenStats.js";
import { initializeImageProcessing } from "./iframe/index.js";
import { generateComfyUIImage } from "./comfyui.js";
import "./iframe.js"; // init_iframe2

var currentAbortController, currentPrompt, currentRequestId, currentTaskId2;

currentTaskId2 = null;

currentRequestId = null;

currentPrompt = null;

currentAbortController = null;

function getDirectHeaders(contentType = null, auth = null) {
  const headers = {
    "Accept": "*/*"
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  if (auth) {
    headers["Authorization"] = auth;
  }
  return headers;
}

async function getImageFromTurnData(data) {
  if (!data) return "";
  if (data.imageId && data.imageId.startsWith("cfgimg_")) {
    const imageData = await getConfigImage(data.imageId);
    return imageData || "";
  }
  if (data.image && data.image.startsWith("data:image")) {
    return data.image;
  }
  return "";
}

async function dataUrlToBlob(dataUrl) {
  if (!dataUrl) return null;
  if (dataUrl.startsWith("blob:")) {
    const resp = await fetch(dataUrl);
    return await resp.blob();
  }
  if (dataUrl.startsWith("data:")) {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
  try {
    const resp = await fetch(dataUrl, { headers: getDirectHeaders() });
    return await resp.blob();
  } catch (e) {
    return null;
  }
}

function resolveGrokGenerationsUrl(apiUrl, customEndpoint) {
  let base = (apiUrl || "").trim().replace(/\/+$/, "");
  if (!base) return "";
  if (customEndpoint && customEndpoint.trim()) {
    const custom = customEndpoint.trim();
    if (/^https?:\/\//i.test(custom)) return custom;
    return base + (custom.startsWith("/") ? custom : "/" + custom);
  }
  if (/\/images\/generations$/i.test(base) || /\/image\/generation$/i.test(base)) {
    return base;
  }
  if (/\/images\/edits$/i.test(base) || /\/image\/edit$/i.test(base)) {
    return base.replace(/\/images?\/edits?$/i, "/images/generations");
  }
  if (/\/v1$/i.test(base) || /\/v1beta$/i.test(base)) {
    return base + "/images/generations";
  }
  return base + "/v1/images/generations";
}

function resolveGrokEditsUrl(apiUrl, customEndpoint) {
  let base = (apiUrl || "").trim().replace(/\/+$/, "");
  if (!base) return "";
  if (customEndpoint && customEndpoint.trim()) {
    const custom = customEndpoint.trim();
    if (/^https?:\/\//i.test(custom)) return custom;
    return base + (custom.startsWith("/") ? custom : "/" + custom);
  }
  if (/\/images\/edits$/i.test(base) || /\/image\/edit$/i.test(base)) {
    return base;
  }
  if (/\/images\/generations$/i.test(base) || /\/image\/generation$/i.test(base)) {
    return base.replace(/\/images?\/generations?$/i, "/images/edits");
  }
  if (/\/v1$/i.test(base) || /\/v1beta$/i.test(base)) {
    return base + "/images/edits";
  }
  return base + "/v1/images/edits";
}

async function collectBananaReferenceImages({ retouchImage, finalPrompt, conversationPreset, bananaCharacterPresets }) {
  const images = [];
  if (retouchImage) {
    images.push(retouchImage);
  }
  if (bananaCharacterPresets && finalPrompt) {
    for (const presetName in bananaCharacterPresets) {
      const charPreset = bananaCharacterPresets[presetName];
      const triggers = (charPreset?.triggers || "").split("|").filter((t) => t.trim() !== "");
      for (const trigger of triggers) {
        if (finalPrompt.toLowerCase().includes(trigger.toLowerCase())) {
          if (charPreset.conversation) {
            const userImg = await getImageFromTurnData(charPreset.conversation.user);
            if (userImg && !images.includes(userImg)) images.push(userImg);
            const modelImg = await getImageFromTurnData(charPreset.conversation.model);
            if (modelImg && !images.includes(modelImg)) images.push(modelImg);
          }
          break;
        }
      }
    }
  }
  if (conversationPreset?.conversation && Array.isArray(conversationPreset.conversation)) {
    for (const turn of conversationPreset.conversation) {
      const uImg = await getImageFromTurnData(turn.user);
      if (uImg && !images.includes(uImg)) images.push(uImg);
      const mImg = await getImageFromTurnData(turn.model);
      if (mImg && !images.includes(mImg)) images.push(mImg);
    }
  }
  return images;
}

async function readOpenAIResponse(response) {
  const text = await response.text();
  const trimmed = text.trimStart();
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const isSSE = contentType.includes("text/event-stream") || trimmed.startsWith("data:") || /\n\s*data:\s*/.test(text);
  if (!isSSE) {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`\u65E0\u6CD5\u89E3\u6790\u54CD\u5E94 JSON: ${e.message}; \u539F\u59CB\u54CD\u5E94: ${text.slice(0, 500)}`);
    }
  }
  addLog("[Banana] \u68C0\u6D4B\u5230 SSE \u6D41\u5F0F\u54CD\u5E94\uFF0C\u5F00\u59CB\u805A\u5408 chunk");
  let aggregatedContentText = "";
  const aggregatedContentParts = [];
  let aggregatedReasoningText = "";
  const aggregatedImages = [];
  let finishReason = null;
  let usage = null;
  let model = null;
  let id = null;
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith(":")) continue;
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    let chunk;
    try {
      chunk = JSON.parse(payload);
    } catch (e) {
      addLog(`[Banana] \u8DF3\u8FC7\u65E0\u6CD5\u89E3\u6790\u7684 SSE chunk: ${payload.slice(0, 200)}`);
      continue;
    }
    if (chunk.id && !id) id = chunk.id;
    if (chunk.model && !model) model = chunk.model;
    if (chunk.usage) usage = chunk.usage;
    const choice = chunk.choices && chunk.choices[0];
    if (!choice) continue;
    const delta = choice.delta || choice.message || {};
    if (typeof delta.content === "string") {
      aggregatedContentText += delta.content;
    } else if (Array.isArray(delta.content)) {
      for (const item of delta.content) {
        if (item && item.type === "text" && typeof item.text === "string") {
          aggregatedContentText += item.text;
        } else {
          aggregatedContentParts.push(item);
        }
      }
    }
    if (typeof delta.reasoning_content === "string") {
      aggregatedReasoningText += delta.reasoning_content;
    }
    const rd = delta.reasoning_details;
    if (rd && Array.isArray(rd.images)) {
      for (const img of rd.images) aggregatedImages.push(img);
    }
    if (choice.finish_reason) finishReason = choice.finish_reason;
  }
  let messageContent;
  if (aggregatedContentParts.length > 0) {
    messageContent = [...aggregatedContentParts];
    if (aggregatedContentText) {
      messageContent.unshift({ type: "text", text: aggregatedContentText });
    }
  } else {
    messageContent = aggregatedContentText;
  }
  const message = { role: "assistant", content: messageContent };
  if (aggregatedReasoningText) message.reasoning_content = aggregatedReasoningText;
  if (aggregatedImages.length > 0) message.reasoning_details = { images: aggregatedImages };
  addLog(`[Banana] SSE \u805A\u5408\u5B8C\u6210\uFF1Atext=${aggregatedContentText.length} \u5B57\u7B26\uFF0Cimages=${aggregatedImages.length}\uFF0Creasoning=${aggregatedReasoningText.length} \u5B57\u7B26`);
  return {
    id,
    object: "chat.completion",
    model,
    choices: [{ index: 0, message, finish_reason: finishReason || "stop" }],
    usage: usage || void 0
  };
}

async function generateBananaImage({ prompt: prompt2, width, height, change, retouchPrompt, retouchImage, videoPrompt, videoImage }) {
  clearLog();
  const taskId = taskQueue.addTask({
    name: (prompt2 || "").substring(0, 30) + (prompt2 && prompt2.length > 30 ? "..." : ""),
    type: TaskType.BANANA,
    prompt: prompt2
  });
  currentTaskId2 = taskId;
  currentAbortController = new AbortController();
  taskQueue.updateStatus(taskId, TaskStatus.RUNNING);
  const startTime = Date.now();
  const isGrok = String(extension_settings[extensionName]?.banana?.useGrokFormat) === "true";
  if (!isPluginToastDisabled()) {
    toastr.info(isGrok ? "\u{1F3A8} \u5DF2\u53D1\u8D77 Grok \u751F\u56FE\u8BF7\u6C42..." : "\u{1F34C} \u5DF2\u53D1\u8D77 Banana \u751F\u56FE\u8BF7\u6C42...");
  }
  if (change && change.includes("{\u89C6\u9891}")) {
    addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\uFF1A\u8DF3\u8FC7\u56FE\u7247\u63D0\u793A\u8BCD\u5904\u7406\uFF0C\u76F4\u63A5\u6784\u5EFA\u89C6\u9891\u8BF7\u6C42`);
    const bananaSettings2 = extension_settings[extensionName].banana;
    const { videoModel: videoModel2, model: model2, apiUrl: apiUrl2, apiKey: apiKey2, conversationPresets: conversationPresets2, videoPresetId: videoPresetId2, aspectRatio: aspectRatio2 } = bananaSettings2;
    const useModel = videoModel2 || model2;
    addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\u4F7F\u7528\u6A21\u578B: ${useModel}`);
    const selectedVideoPresetId = videoPresetId2 || "\u9ED8\u8BA4";
    const preset = conversationPresets2[selectedVideoPresetId] || { conversation: [], fixedPrompt: "" };
    addLog(`[Banana] \u4F7F\u7528\u89C6\u9891\u9884\u8BBE: "${selectedVideoPresetId}"`);
    const history = [];
    for (const turn of preset.conversation) {
      const userContent2 = [];
      if (turn.user?.text) userContent2.push({ type: "text", text: turn.user.text });
      const userImage = await getImageFromTurnData(turn.user);
      if (userImage) userContent2.push({ type: "image_url", image_url: { url: userImage } });
      const modelContent = [];
      if (turn.model?.text) modelContent.push({ type: "text", text: turn.model.text });
      const modelImage = await getImageFromTurnData(turn.model);
      if (modelImage) modelContent.push({ type: "image_url", image_url: { url: modelImage } });
      if (userContent2.length === 0 || modelContent.length === 0) {
        if (userContent2.length > 0 && modelContent.length === 0) {
          addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\uFF1A\u8DF3\u8FC7 model \u4E3A\u7A7A\u7684\u9884\u8BBE\u8F6E\u6B21\uFF0C\u907F\u514D\u8FDE\u7EED user \u6D88\u606F\u5806\u53E0`);
        }
        continue;
      }
      history.push({ role: "user", content: userContent2 });
      history.push({ role: "assistant", content: modelContent });
    }
    const userContent = [];
    const promptText = videoPrompt || "";
    const combinedPrompt = [preset.fixedPrompt, promptText, preset.postfixPrompt].filter(Boolean).join(", ");
    userContent.push({ type: "text", text: combinedPrompt });
    if (videoImage) {
      userContent.push({ type: "image_url", image_url: { url: videoImage } });
      addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\uFF1A\u5DF2\u6DFB\u52A0\u53C2\u8003\u56FE\u7247`);
    }
    history.push({ role: "user", content: userContent });
    addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\uFF1A\u6307\u4EE4 = ${combinedPrompt}`);
    const _videoGenParams = buildGenParams("Banana \u89C6\u9891", {
      model: useModel,
      yushe: selectedVideoPresetId,
      promptReplaceId: bananaSettings2.prompt_replace_id || "\u9ED8\u8BA4",
      resolvedPrompt: combinedPrompt,
      aspectRatio: aspectRatio2
    });
    const payload2 = {
      model: useModel,
      messages: history.filter((entry) => entry.content.length > 0)
      // config: {
      //     imageConfig: {
      //         aspectRatio: aspectRatio
      //     }
      // }
    };
    addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F payload \u5305\u542B ${payload2.messages.length} \u6761\u6D88\u606F\uFF08\u5DF2\u7981\u7528 config.imageConfig\uFF09`);
    const path2 = "/v1/chat/completions";
    let baseUrl2 = apiUrl2.replace(/\/$/, "");
    let directUrl2 = baseUrl2 + "/chat/completions";
    const client2 = extension_settings[extensionName].client;
    let requestUrl2, requestHeaders2, requestBody2;
    if (client2 === "jiuguan") {
      let proxyBaseUrl = baseUrl2;
      requestUrl2 = "/api/backends/chat-completions/generate";
      requestHeaders2 = getRequestHeaders(window.token);
      requestBody2 = {
        chat_completion_source: "custom",
        custom_url: proxyBaseUrl,
        custom_include_headers: `Authorization: "Bearer ${apiKey2}"`,
        model: useModel,
        messages: payload2.messages,
        stream: false
      };
    } else {
      requestUrl2 = directUrl2;
      requestHeaders2 = getDirectHeaders("application/json", `Bearer ${apiKey2}`);
      requestBody2 = payload2;
    }
    addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\u53D1\u9001\u8BF7\u6C42\u5230: ${requestUrl2}`);
    addLog(`[Banana] \u89C6\u9891 Payload: ${JSON.stringify(requestBody2, null, 2)}`);
    try {
      taskQueue.updateStatus(taskId, "running");
      const response = await fetch(requestUrl2, {
        method: "POST",
        headers: requestHeaders2,
        body: JSON.stringify(requestBody2),
        signal: currentAbortController.signal
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      const result = await readOpenAIResponse(response);
      const content = result.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        const videoSrcMatch = content.match(/src="([^"]+\.mp4[^"]*)"/);
        if (videoSrcMatch && videoSrcMatch[1]) {
          const videoUrl = videoSrcMatch[1];
          addLog(`[Banana] Video URL extracted: ${videoUrl}`);
          try {
            const videoResponse = await fetch(videoUrl, { headers: getDirectHeaders() });
            if (!videoResponse.ok) {
              throw new Error(`Failed to fetch video: ${videoResponse.status}`);
            }
            const videoBlob = await videoResponse.blob();
            const videoDataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(videoBlob);
            });
            const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
            addLog(`[Banana] Video downloaded (${(videoBlob.size / 1024 / 1024).toFixed(2)} MB, \u8017\u65F6 ${duration} \u79D2)`);
            taskQueue.completeTask(taskId, true);
            if (!isPluginToastDisabled()) {
              toastr.success(`\u2705 Banana \u89C6\u9891\u751F\u6210\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
            }
            currentTaskId2 = null;
            const changeClean = change.replaceAll("{\u89C6\u9891}", "");
            return { image: videoDataUrl, change: changeClean || prompt2, isVideo: true, format: "video/mp4", originalUrl: videoUrl, genParams: _videoGenParams };
          } catch (fetchError) {
            addLog(`[Banana] Failed to download video: ${fetchError.message}`);
            throw new Error(`\u89C6\u9891\u4E0B\u8F7D\u5931\u8D25: ${fetchError.message}`);
          }
        }
      }
      throw new Error("Video response did not contain a valid MP4 URL");
    } catch (error) {
      addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\u9519\u8BEF: ${error.message}`);
      if (error.name === "AbortError" || error.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88") {
        addLog("[Banana] \u89C6\u9891\u751F\u6210\u88AB\u53D6\u6D88\u3002");
      } else {
        taskQueue.completeTask(taskId, false);
      }
      currentTaskId2 = null;
      throw error;
    }
  }
  let change_ = change;
  const sizeRegex = /,?\s*(\d{2,4})x(\d{2,4})(?=[;\s]*$)/i;
  if (typeof prompt2 === "string") {
    const match = prompt2.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        width = parseInt(match[1], 10);
        height = parseInt(match[2], 10);
      }
    }
    prompt2 = prompt2.replace(sizeRegex, "");
  }
  if (typeof change === "string") {
    const match = change.match(sizeRegex);
    if (match) {
      if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
        width = parseInt(match[1], 10);
        height = parseInt(match[2], 10);
      }
    }
    change = change.replace(sizeRegex, "");
  }
  prompt2 = processCharacterPrompt(prompt2);
  prompt2 = await stripChineseAnnotations(prompt2);
  change = processCharacterPrompt(change);
  change = await stripChineseAnnotations(change);
  addLog(`\u5F00\u59CB Banana\u751F\u56FE\u6D41\u7A0B\u3002\u5BA2\u6237\u7AEF\u4E3A${extension_settings[extensionName].client}`);
  addLog(`\u8BF7\u6C42\u5C3A\u5BF8: \u5BBD\u5EA6 - ${width || "\u9ED8\u8BA4"}, \u9AD8\u5EA6 - ${height || "\u9ED8\u8BA4"}`);
  prompt2 = change && change.trim() !== "" ? change : prompt2;
  addLog(`\u7528\u4E8E\u751F\u6210\u7684Tag: ${prompt2}`);
  let Divide_roles = false;
  if (prompt2.includes("Scene Composition")) {
    Divide_roles = true;
  }
  addLog(`\u662F\u5426\u542F\u7528\u5206\u89D2\u8272\u6A21\u5F0F (Divide_roles): ${Divide_roles}`);
  let prompt_data = {};
  let mainPrompt = "";
  let other_prompt = "";
  if (Divide_roles) {
    addLog("\u5206\u89D2\u8272\u6A21\u5F0F: \u89E3\u6790\u5E26\u5750\u6807\u7684\u63D0\u793A\u8BCD\u5B57\u7B26\u4E32\u3002");
    prompt_data = parsePromptStringWithCoordinates(prompt2);
    mainPrompt = prompt_data["Scene Composition"];
    const charIds = getSortedCharacterIds(prompt_data);
    for (const i of charIds) {
      if (prompt_data[`Character ${i} Prompt`]) {
        other_prompt = other_prompt + ", " + prompt_data[`Character ${i} Prompt`];
      }
    }
  } else {
    addLog("\u6807\u51C6\u6A21\u5F0F: \u4F7F\u7528\u8BF7\u6C42\u4E2D\u7684 prompt\u3002");
    mainPrompt = prompt2;
  }
  let { modifiedPrompt, insertions } = await prompt_replace_banana(mainPrompt, other_prompt);
  if (Divide_roles) {
    const charIds = getSortedCharacterIds(prompt_data);
    for (const i of charIds) {
      if (prompt_data[`Character ${i} Prompt`]) {
        modifiedPrompt = modifiedPrompt + " | " + prompt_replace_banana_for_character(prompt_data[`Character ${i} Prompt`], (mainPrompt || "") + " " + (other_prompt || ""));
      }
    }
  }
  const bananaSettings = extension_settings[extensionName].banana;
  const { model, editModel, videoModel, apiUrl, apiKey, conversationPresets, conversationPresetId, editPresetId, videoPresetId, aspectRatio } = bananaSettings;
  const imageSize = (bananaSettings.imageSize || "").trim() || "1024x1024";
  const useGrokFormat = String(bananaSettings.useGrokFormat) === "true";
  const isEditMode = !!(change && change.includes("{\u4FEE\u56FE}") || retouchImage);
  const isVideoMode = !!(change && change.includes("{\u89C6\u9891}"));
  const effectiveModel = isVideoMode ? videoModel || model : isEditMode ? editModel || model : model;
  addLog(`[Banana] Starting image generation with model: ${effectiveModel}${isEditMode ? " (\u4FEE\u56FE\u6A21\u5F0F)" : isVideoMode ? " (\u89C6\u9891\u6A21\u5F0F)" : ""}`);
  let _banana_gen_params = null;
  const _bananaSnapshot = (presetId, finalPromptText) => buildGenParams("Banana", {
    model: effectiveModel,
    yushe: presetId,
    promptReplaceId: bananaSettings.prompt_replace_id || "\u9ED8\u8BA4",
    resolvedPrompt: finalPromptText,
    imageSize: effectiveModel.startsWith("imagen") ? void 0 : imageSize,
    aspectRatio: effectiveModel.startsWith("imagen") ? aspectRatio : void 0
  });
  if (useGrokFormat && !change.includes("{\u89C6\u9891}")) {
    addLog(`[Banana] \u542F\u7528 Grok / OpenAI \u539F\u751F\u56FE\u50CF\u63A5\u53E3\u6A21\u5F0F${isEditMode ? " (\u4FEE\u56FE\u6A21\u5F0F)" : ""}`);
    const grokEndpointType = bananaSettings.grokEndpointType || "auto";
    const grokCustomEndpoint = bananaSettings.grokCustomEndpoint || "";
    const grokRefImageParam = bananaSettings.grokRefImageParam || "auto";
    const activePresetId = isEditMode ? editPresetId || "\u9ED8\u8BA4" : conversationPresetId;
    const grokPreset = conversationPresets[activePresetId] || { fixedPrompt: "", postfixPrompt: "" };
    let grokFinalPrompt;
    if (isEditMode) {
      const promptText = retouchPrompt || modifiedPrompt;
      grokFinalPrompt = [grokPreset.fixedPrompt, promptText, grokPreset.postfixPrompt].filter(Boolean).join(", ");
      addLog(`[Banana] Grok prompt (\u4FEE\u56FE): ${grokFinalPrompt}`);
    } else {
      grokFinalPrompt = [
        grokPreset.fixedPrompt,
        insertions["\u524D\u7F6E\u524D"],
        insertions["\u524D\u7F6E\u540E"],
        modifiedPrompt,
        insertions["\u540E\u7F6E\u524D"],
        insertions["\u540E\u7F6E\u540E"],
        grokPreset.postfixPrompt,
        insertions["\u6700\u540E\u7F6E"]
      ].filter(Boolean).join(", ");
      addLog(`[Banana] Grok prompt (\u6587\u751F\u56FE): ${grokFinalPrompt}`);
    }
    _banana_gen_params = _bananaSnapshot(activePresetId, grokFinalPrompt);
    const bananaCharacterPresets = extension_settings[extensionName].bananaCharacterPresets || {};
    const refImages = await collectBananaReferenceImages({
      retouchImage: isEditMode ? retouchImage : null,
      finalPrompt: grokFinalPrompt,
      conversationPreset: grokPreset,
      bananaCharacterPresets: isEditMode ? null : bananaCharacterPresets
    });
    const hasRefImages = refImages.length > 0 && grokRefImageParam !== "disabled";
    const grokGenerationsEndpoint = bananaSettings.grokGenerationsEndpoint || "";
    const grokEditsEndpoint = bananaSettings.grokEditsEndpoint || "";
    const grokEditsFormat = bananaSettings.grokEditsFormat || "form_data";
    const grokResponseFormat = bananaSettings.grokResponseFormat || "none";
    let grokRequestUrl;
    let grokRequestHeaders;
    let grokRequestBody;
    if (hasRefImages) {
      addLog(`[Banana] \u68C0\u6D4B\u5230\u53C2\u8003\u56FE (\u5171 ${refImages.length} \u5F20)\uFF0C\u8C03\u7528\u72EC\u7ACB\u56FE\u751F\u56FE/\u4FEE\u56FE\u63A5\u53E3 (POST /v1/images/edits)`);
      grokRequestUrl = resolveGrokEditsUrl(apiUrl, grokEditsEndpoint || bananaSettings.grokCustomEndpoint);
      const primaryRefImage = refImages[0];
      if (grokEditsFormat === "json") {
        grokRequestHeaders = getDirectHeaders("application/json", `Bearer ${apiKey}`);
        const editsPayload = {
          model: effectiveModel,
          prompt: grokFinalPrompt,
          image: primaryRefImage,
          n: 1,
          size: imageSize
        };
        if (grokResponseFormat && grokResponseFormat !== "none") {
          editsPayload.response_format = grokResponseFormat;
        }
        grokRequestBody = JSON.stringify(editsPayload);
        addLog(`[Banana] Edits \u63A5\u53E3\u53D1\u9001\u8BF7\u6C42\u5230: ${grokRequestUrl} (JSON \u6A21\u5F0F, response_format: ${grokResponseFormat})`);
      } else {
        const formData = new FormData();
        const imageBlob = await dataUrlToBlob(primaryRefImage);
        if (!imageBlob) {
          throw new Error("\u53C2\u8003\u56FE\u6570\u636E\u65E0\u6548\uFF0C\u65E0\u6CD5\u8F6C\u6362\u4E3A\u4E8C\u8FDB\u5236\u56FE\u7247\u6587\u4EF6");
        }
        formData.append("image", imageBlob, "image.png");
        formData.append("prompt", grokFinalPrompt);
        formData.append("model", effectiveModel);
        formData.append("n", "1");
        formData.append("size", imageSize);
        if (grokResponseFormat && grokResponseFormat !== "none") {
          formData.append("response_format", grokResponseFormat);
        }
        grokRequestHeaders = getDirectHeaders(null, `Bearer ${apiKey}`);
        grokRequestBody = formData;
        addLog(`[Banana] Edits \u63A5\u53E3\u53D1\u9001\u8BF7\u6C42\u5230: ${grokRequestUrl} (\u6807\u51C6 multipart/form-data \u6587\u4EF6\u4E0A\u4F20\u6A21\u5F0F, response_format: ${grokResponseFormat})`);
      }
    } else {
      addLog("[Banana] \u65E0\u53C2\u8003\u56FE\uFF0C\u8C03\u7528\u72EC\u7ACB\u7EAF\u6587\u751F\u56FE\u63A5\u53E3 (POST /v1/images/generations)");
      grokRequestUrl = resolveGrokGenerationsUrl(apiUrl, grokGenerationsEndpoint || bananaSettings.grokCustomEndpoint);
      const generationsPayload = {
        model: effectiveModel,
        prompt: grokFinalPrompt,
        n: 1,
        size: imageSize
      };
      if (grokResponseFormat && grokResponseFormat !== "none") {
        generationsPayload.response_format = grokResponseFormat;
      }
      grokRequestHeaders = getDirectHeaders("application/json", `Bearer ${apiKey}`);
      grokRequestBody = JSON.stringify(generationsPayload);
      addLog(`[Banana] \u6587\u751F\u56FE\u63A5\u53E3\u53D1\u9001\u8BF7\u6C42\u5230: ${grokRequestUrl}`);
      addLog(`[Banana] \u6587\u751F\u56FE payload: ${JSON.stringify(generationsPayload)}`);
    }
    try {
      taskQueue.updateStatus(taskId, "running");
      const grokResponse = await fetch(grokRequestUrl, {
        method: "POST",
        headers: grokRequestHeaders,
        body: grokRequestBody,
        signal: currentAbortController.signal
      });
      if (!grokResponse.ok) {
        const errorText = await grokResponse.text();
        throw new Error(`Grok API request failed (${grokResponse.status}): ${errorText}`);
      }
      const grokResult = await grokResponse.json();
      const item = grokResult?.data?.[0] || (Array.isArray(grokResult?.images) ? typeof grokResult.images[0] === "string" ? { b64_json: grokResult.images[0] } : grokResult.images[0] : null) || (grokResult?.image ? { b64_json: grokResult.image } : null);
      if (!item) {
        throw new Error(`Grok \u54CD\u5E94\u7F3A\u5C11\u56FE\u7247\u6570\u636E (data[0]/images)\uFF0C\u539F\u59CB\u54CD\u5E94: ${JSON.stringify(grokResult).slice(0, 500)}`);
      }
      let imageUrl = "";
      const rawB642 = item.b64_json || item.base64;
      if (rawB642) {
        imageUrl = rawB642.startsWith("data:image") ? rawB642 : `data:image/png;base64,${rawB642}`;
        addLog("[Banana] Grok \u6A21\u5F0F\uFF1A\u4ECE b64_json/base64 \u63D0\u53D6\u5230\u56FE\u7247");
      } else if (item.url) {
        addLog(`[Banana] Grok \u6A21\u5F0F\uFF1A\u4E0B\u8F7D\u56FE\u7247 URL ${item.url}`);
        const imgResp = await fetch(item.url, { headers: getDirectHeaders() });
        if (!imgResp.ok) {
          throw new Error(`\u4E0B\u8F7D\u56FE\u7247\u5931\u8D25: ${imgResp.status}`);
        }
        const blob = await imgResp.blob();
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      if (!imageUrl) {
        throw new Error("Grok \u54CD\u5E94\u672A\u5305\u542B\u56FE\u7247\uFF08b64_json/url \u5747\u4E3A\u7A7A\uFF09");
      }
      const rawUrl = item.url || "";
      const isVideo = Boolean(
        imageUrl && imageUrl.startsWith("data:video/") || typeof rawB642 === "string" && (rawB642.startsWith("data:video/") || rawB642.startsWith("AAAA")) || rawUrl && /\.(mp4|webm|mkv|mov)(\?.*)?$/i.test(rawUrl)
      );
      const format = isVideo ? imageUrl.includes("webm") || rawUrl.includes("webm") ? "video/webm" : "video/mp4" : "image/png";
      if (!isVideo && String(extension_settings[extensionName].convertToJpegStorage) === "true") {
        imageUrl = await convertImageToJpeg(imageUrl);
      }
      const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
      addLog(`[Banana] Grok \u6A21\u5F0F\uFF1A${isVideo ? "\u89C6\u9891" : "\u56FE\u7247"}\u751F\u6210\u6210\u529F (\u8017\u65F6 ${duration} \u79D2)`);
      taskQueue.completeTask(taskId, true);
      if (!isPluginToastDisabled()) {
        toastr.success(isVideo ? `\u2705 Grok \u89C6\u9891\u751F\u6210\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2` : `\u2705 Grok \u751F\u56FE\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
      }
      currentTaskId2 = null;
      return {
        image: imageUrl,
        change: change_ || "",
        isVideo,
        format,
        originalUrl: rawUrl,
        genParams: _banana_gen_params
      };
    } catch (error) {
      addLog(`[Banana] Grok \u6A21\u5F0F\u9519\u8BEF: ${error.message}`);
      console.error("[Banana] Grok mode error:", error);
      if (error.name !== "AbortError" && error.message !== "\u4EFB\u52A1\u5DF2\u53D6\u6D88") {
        taskQueue.completeTask(taskId, false);
      } else {
        addLog("[Banana] Grok \u6A21\u5F0F\u751F\u6210\u88AB\u53D6\u6D88\u3002");
      }
      currentTaskId2 = null;
      throw error;
    }
  }
  let path;
  let payload;
  if (effectiveModel.startsWith("imagen")) {
    path = `/v1beta/models/${effectiveModel}`;
    const preset = conversationPresets[conversationPresetId] || { fixedPrompt: "" };
    const finalPrompt = [
      preset.fixedPrompt,
      insertions["\u524D\u7F6E\u524D"],
      insertions["\u524D\u7F6E\u540E"],
      modifiedPrompt,
      insertions["\u540E\u7F6E\u524D"],
      insertions["\u540E\u7F6E\u540E"],
      preset.postfixPrompt,
      insertions["\u6700\u540E\u7F6E"]
    ].filter(Boolean).join(", ");
    addLog(`\u6B63\u9762\u63D0\u793A\u8BCD: ${finalPrompt}`);
    payload = {
      instances: [{ prompt: finalPrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio
      }
    };
    addLog(`[Banana] Built Imagen payload with prompt: ${finalPrompt}`);
    _banana_gen_params = _bananaSnapshot(conversationPresetId, finalPrompt);
  } else {
    path = "/v1/chat/completions";
    let preset;
    let selectedPresetId;
    if (change.includes("{\u4FEE\u56FE}")) {
      addLog("[Banana] \u542F\u7528\u4E86 {\u4FEE\u56FE} \u6807\u8BC6\u3002");
      const selectedEditPresetId = editPresetId || "\u9ED8\u8BA4";
      preset = conversationPresets[selectedEditPresetId] || { conversation: [], fixedPrompt: "" };
      selectedPresetId = selectedEditPresetId;
      addLog(`[Banana] \u4F7F\u7528\u4FEE\u56FE\u9884\u8BBE: "${selectedEditPresetId}"`);
    } else if (change.includes("{\u89C6\u9891}")) {
      addLog("[Banana] \u542F\u7528\u4E86 {\u89C6\u9891} \u6807\u8BC6\u3002");
      const selectedVideoPresetId = videoPresetId || "\u9ED8\u8BA4";
      preset = conversationPresets[selectedVideoPresetId] || { conversation: [], fixedPrompt: "" };
      selectedPresetId = selectedVideoPresetId;
      addLog(`[Banana] \u4F7F\u7528\u89C6\u9891\u9884\u8BBE: "${selectedVideoPresetId}"`);
    } else {
      preset = conversationPresets[conversationPresetId] || { conversation: [], fixedPrompt: "" };
      selectedPresetId = conversationPresetId;
    }
    const finalPrompt = [
      preset.fixedPrompt,
      insertions["\u524D\u7F6E\u524D"],
      insertions["\u524D\u7F6E\u540E"],
      modifiedPrompt,
      insertions["\u540E\u7F6E\u524D"],
      insertions["\u540E\u7F6E\u540E"],
      preset.postfixPrompt,
      insertions["\u6700\u540E\u7F6E"]
    ].filter(Boolean).join(", ");
    addLog(`\u6B63\u9762\u63D0\u793A\u8BCD: ${finalPrompt}`);
    _banana_gen_params = _bananaSnapshot(selectedPresetId, finalPrompt);
    const history = [];
    for (const turn of preset.conversation) {
      const turnUserContent = [];
      if (turn.user?.text) turnUserContent.push({ type: "text", text: turn.user.text });
      const userImage = await getImageFromTurnData(turn.user);
      if (userImage) turnUserContent.push({ type: "image_url", image_url: { url: userImage } });
      const turnModelContent = [];
      if (turn.model?.text) turnModelContent.push({ type: "text", text: turn.model.text });
      const modelImage = await getImageFromTurnData(turn.model);
      if (modelImage) turnModelContent.push({ type: "image_url", image_url: { url: modelImage } });
      if (turnUserContent.length === 0 || turnModelContent.length === 0) {
        if (turnUserContent.length > 0 && turnModelContent.length === 0) {
          addLog(`[Banana] \u8DF3\u8FC7 model \u4E3A\u7A7A\u7684\u9884\u8BBE\u8F6E\u6B21\uFF0C\u907F\u514D\u8FDE\u7EED user \u6D88\u606F\u5806\u53E0`);
        }
        continue;
      }
      history.push({ role: "user", content: turnUserContent });
      history.push({ role: "assistant", content: turnModelContent });
    }
    if (!change.includes("{\u4FEE\u56FE}") && !change.includes("{\u89C6\u9891}")) {
      const bananaCharacterPresets = extension_settings[extensionName].bananaCharacterPresets || {};
      for (const presetName in bananaCharacterPresets) {
        const charPreset = bananaCharacterPresets[presetName];
        const triggers = (charPreset.triggers || "").split("|").filter((t) => t.trim() !== "");
        for (const trigger of triggers) {
          if (finalPrompt.toLowerCase().includes(trigger.toLowerCase())) {
            addLog(`[Banana] Found matching trigger "${trigger}" from preset "${presetName}".`);
            const turn = charPreset.conversation;
            if (turn) {
              const userContent = [];
              if (turn.user && turn.user.text) userContent.push({ type: "text", text: turn.user.text });
              const userImage = await getImageFromTurnData(turn.user);
              if (userImage) userContent.push({ type: "image_url", image_url: { url: userImage } });
              if (userContent.length > 0) {
                history.push({ role: "user", content: userContent });
              }
              const modelContent = [];
              if (turn.model && turn.model.text) modelContent.push({ type: "text", text: turn.model.text });
              const modelImage = await getImageFromTurnData(turn.model);
              if (modelImage) modelContent.push({ type: "image_url", image_url: { url: modelImage } });
              if (modelContent.length > 0) {
                history.push({ role: "assistant", content: modelContent });
              }
            }
            break;
          }
        }
      }
    }
    if (!change.includes("{\u4FEE\u56FE}") && !change.includes("{\u89C6\u9891}")) {
      history.push({
        role: "user",
        content: [{ type: "text", text: finalPrompt }]
      });
    } else if (change.includes("{\u4FEE\u56FE}")) {
      const userContent = [];
      const promptText = retouchPrompt || finalPrompt;
      const combinedPrompt = [preset.fixedPrompt, promptText, preset.postfixPrompt].filter(Boolean).join(", ");
      userContent.push({ type: "text", text: combinedPrompt });
      if (retouchImage) {
        userContent.push({ type: "image_url", image_url: { url: retouchImage } });
        addLog(`[Banana] \u4FEE\u56FE\u6A21\u5F0F\uFF1A\u5DF2\u6DFB\u52A0\u5F85\u4FEE\u6539\u7684\u56FE\u7247`);
      }
      history.push({
        role: "user",
        content: userContent
      });
      addLog(`[Banana] \u4FEE\u56FE\u6A21\u5F0F\uFF1A\u6307\u4EE4 = ${combinedPrompt}`);
    } else if (change.includes("{\u89C6\u9891}")) {
      const userContent = [];
      const promptText = videoPrompt || finalPrompt;
      const combinedPrompt = [preset.fixedPrompt, promptText, preset.postfixPrompt].filter(Boolean).join(", ");
      userContent.push({ type: "text", text: combinedPrompt });
      if (videoImage) {
        userContent.push({ type: "image_url", image_url: { url: videoImage } });
        addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\uFF1A\u5DF2\u6DFB\u52A0\u53C2\u8003\u56FE\u7247`);
      }
      history.push({ role: "user", content: userContent });
      addLog(`[Banana] \u89C6\u9891\u6A21\u5F0F\uFF1A\u6307\u4EE4 = ${combinedPrompt}`);
    }
    payload = {
      model: effectiveModel,
      messages: history.filter((entry) => entry.content.length > 0),
      size: imageSize
      // 临时禁用 config.imageConfig，排查部分模型（如 grok-imagine-*）不识别该字段导致生图异常
      // config: {
      //     imageConfig: {
      //         aspectRatio: aspectRatio
      //     }
      // }
    };
    addLog(`[Banana] Built multimodal payload with ${payload.messages.length} messages.\uFF08\u5DF2\u7981\u7528 config.imageConfig\uFF09`);
  }
  let baseUrl = apiUrl.replace(/\/$/, "");
  let directUrl = baseUrl + "/chat/completions";
  const client = extension_settings[extensionName].client;
  let requestUrl, requestHeaders, requestBody;
  if (client === "jiuguan") {
    let proxyBaseUrl = baseUrl;
    requestUrl = "/api/backends/chat-completions/generate";
    requestHeaders = getRequestHeaders(window.token);
    const proxyModel = effectiveModel;
    requestBody = {
      chat_completion_source: "custom",
      custom_url: proxyBaseUrl,
      custom_include_headers: `Authorization: "Bearer ${apiKey}"`,
      model: proxyModel,
      messages: payload.messages,
      size: imageSize,
      stream: false
    };
    if (proxyModel.startsWith("imagen")) {
      addLog(`[Banana] Imagen \u6A21\u578B\u4E0D\u652F\u6301\u9152\u9986\u4EE3\u7406\uFF0C\u5207\u6362\u4E3A\u76F4\u63A5\u8BF7\u6C42`);
      requestUrl = directUrl;
      requestHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      };
      requestBody = payload;
    }
    addLog(`[Banana] \u4F7F\u7528\u9152\u9986\u4EE3\u7406\u6A21\u5F0F`);
  } else {
    requestUrl = directUrl;
    requestHeaders = getDirectHeaders("application/json", `Bearer ${apiKey}`);
    requestBody = payload;
    addLog(`[Banana] \u4F7F\u7528\u76F4\u63A5\u8BF7\u6C42\u6A21\u5F0F`);
  }
  addLog(`[Banana] Sending request to: ${requestUrl}`);
  addLog(`[Banana] Payload: ${JSON.stringify(requestBody, null, 2)}`);
  try {
    taskQueue.updateStatus(taskId, "running");
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
      signal: currentAbortController.signal
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    const result = await readOpenAIResponse(response);
    if (change && change.includes("{\u89C6\u9891}")) {
      const content = result.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        const videoSrcMatch = content.match(/src="([^"]+\.mp4[^"]*)"/);
        if (videoSrcMatch && videoSrcMatch[1]) {
          const videoUrl = videoSrcMatch[1];
          addLog(`[Banana] Video URL extracted: ${videoUrl}`);
          try {
            const videoResponse = await fetch(videoUrl, { headers: getDirectHeaders() });
            if (!videoResponse.ok) {
              throw new Error(`Failed to fetch video: ${videoResponse.status}`);
            }
            const videoBlob = await videoResponse.blob();
            const videoDataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(videoBlob);
            });
            const duration2 = ((Date.now() - startTime) / 1e3).toFixed(1);
            addLog(`[Banana] Video downloaded (${(videoBlob.size / 1024 / 1024).toFixed(2)} MB, \u8017\u65F6 ${duration2} \u79D2)`);
            taskQueue.completeTask(taskId, true);
            if (!isPluginToastDisabled()) {
              toastr.success(`\u2705 Banana \u89C6\u9891\u751F\u6210\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration2} \u79D2`);
            }
            currentTaskId2 = null;
            return { image: videoDataUrl, change: change_ || "", isVideo: true, format: "video/mp4", originalUrl: videoUrl, genParams: _banana_gen_params };
          } catch (fetchError) {
            addLog(`[Banana] Failed to download video: ${fetchError.message}`);
            throw new Error(`\u89C6\u9891\u4E0B\u8F7D\u5931\u8D25: ${fetchError.message}`);
          }
        }
      }
      throw new Error("Video response did not contain a valid MP4 URL");
    }
    let imageUrl = "";
    const choices = result.choices;
    if (choices && choices.length > 0) {
      const content = choices[0].message?.content;
      const reasoningDetails = choices[0].message?.reasoning_details;
      if (reasoningDetails?.images && Array.isArray(reasoningDetails.images) && reasoningDetails.images.length > 0) {
        addLog("[Banana] Detected images array in reasoning_details.");
        const firstImage = reasoningDetails.images[0];
        if (firstImage.type === "image_url" && firstImage.image_url) {
          imageUrl = typeof firstImage.image_url === "string" ? firstImage.image_url : firstImage.image_url.url;
          addLog("[Banana] Extracted image from reasoning_details.images array.");
        }
      }
      if (!imageUrl && Array.isArray(content)) {
        for (const item of content) {
          if (item.type === "image_url" && item.image_url) {
            imageUrl = typeof item.image_url === "string" ? item.image_url : item.image_url.url;
            break;
          }
        }
      } else if (!imageUrl && typeof content === "string") {
        const markdownImageRegex = /!\[.*?\]\(((?:https?:\/\/|data:image\/[^;]+;base64,)[^\s\)]+)\)/;
        const match = content.match(markdownImageRegex);
        if (match && match[1]) {
          const mdImageData2 = match[1];
          if (mdImageData2.startsWith("data:image/")) {
            addLog("[Banana] Detected Markdown embedded base64 image.");
            imageUrl = mdImageData2;
            addLog("[Banana] Successfully extracted base64 image from Markdown.");
          } else {
            addLog("[Banana] Detected Markdown image URL, extracting...");
            addLog(`[Banana] Markdown image URL: ${mdImageData2}`);
            try {
              const imageResponse = await fetch(mdImageData2, { headers: getDirectHeaders() });
              if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.status}`);
              }
              const imageBlob = await imageResponse.blob();
              const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(imageBlob);
              });
              imageUrl = base64Data;
              const isMdVideo = Boolean(
                base64Data && base64Data.startsWith("data:video/") || typeof mdImageData2 === "string" && /\.(mp4|webm|mkv|mov)(\?.*)?$/i.test(mdImageData2)
              );
              if (!isMdVideo && String(extension_settings[extensionName].convertToJpegStorage) === "true") {
                imageUrl = await convertImageToJpeg(imageUrl);
              }
              addLog("[Banana] Successfully converted Markdown image to base64.");
            } catch (fetchError) {
              addLog(`[Banana] Failed to fetch Markdown image: ${fetchError.message}`);
              imageUrl = mdImageData2;
              addLog("[Banana] Using direct URL as fallback.");
            }
          }
        } else {
          addLog("[Banana] Response contains text only, no image.");
        }
      }
    }
    if (!imageUrl) {
      throw new Error("API response did not contain image in OpenAI format");
    }
    const isVideo = Boolean(
      imageUrl && imageUrl.startsWith("data:video/") || typeof rawB64 === "string" && (rawB64.startsWith("data:video/") || rawB64.startsWith("AAAA")) || typeof mdImageData === "string" && /\.(mp4|webm|mkv|mov)(\?.*)?$/i.test(mdImageData)
    );
    const format = isVideo ? imageUrl.includes("webm") || typeof mdImageData === "string" && mdImageData.includes("webm") ? "video/webm" : "video/mp4" : "image/png";
    const originalUrl = typeof mdImageData === "string" ? mdImageData : "";
    const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
    addLog(`[Banana] ${isVideo ? "Video" : "Image"} generated successfully (\u8017\u65F6 ${duration} \u79D2).`);
    taskQueue.completeTask(taskId, true);
    if (!isPluginToastDisabled()) {
      toastr.success(isGrok ? `\u2705 Grok \u751F\u56FE\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2` : `\u2705 Banana \u751F\u56FE\u5B8C\u6210\uFF0C\u8017\u65F6 ${duration} \u79D2`);
    }
    currentTaskId2 = null;
    return {
      image: imageUrl,
      change: change_ || "",
      isVideo,
      format,
      originalUrl,
      genParams: _banana_gen_params
    };
  } catch (error) {
    addLog(`[Banana] Fetch error: ${error.message}`);
    console.error("[Banana] Fetch error:", error);
    if (error.name === "AbortError" || error.message === "\u4EFB\u52A1\u5DF2\u53D6\u6D88") {
      addLog("[Banana] \u4EFB\u52A1\u5DF2\u88AB\u53D6\u6D88\uFF0C\u4E2D\u65AD\u7F51\u7EDC\u8BF7\u6C42\u3002");
    } else {
      taskQueue.completeTask(taskId, false);
    }
    currentTaskId2 = null;
    throw error;
  }
}

async function bananaGenerate(requestData) {
  clearLog();
  let { id, prompt: prompt2, width, height, change, retouchPrompt, retouchImage, videoPrompt, videoImage } = requestData;
  currentRequestId = id;
  currentPrompt = prompt2;
  addLog(`[Banana] Received image generation request (ID: ${id})`);
  let change_ = "";
  if (change) {
    change_ = change.replaceAll("{\u4FEE\u56FE}", "").replaceAll("{\u89C6\u9891}", "");
  } else {
    change_ = prompt2;
  }
  if (change && change.includes("{\u4FEE\u56FE}")) {
    addLog(`Banana\u4FEE\u56FE\u6A21\u5F0F\u542F\u52A8`);
    if (retouchPrompt) addLog(`\u4FEE\u56FE\u6307\u4EE4: ${retouchPrompt}`);
    if (retouchImage) addLog(`\u4FEE\u56FE\u56FE\u7247: [\u5DF2\u63D0\u4F9B]`);
  }
  if (change && change.includes("{\u89C6\u9891}")) {
    addLog(`Banana\u89C6\u9891\u6A21\u5F0F\u542F\u52A8`);
    if (videoPrompt) addLog(`\u89C6\u9891\u6307\u4EE4: ${videoPrompt}`);
    if (videoImage) addLog(`\u89C6\u9891\u56FE\u7247: [\u5DF2\u63D0\u4F9B]`);
  }
  if (change && change.includes("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}")) {
    addLog(`[Banana] \u68C0\u6D4B\u5230 {ComfyUI\u5C40\u90E8\u91CD\u7ED8} \u6807\u7B7E\uFF0C\u8F6C\u53D1\u5230 ComfyUI \u5904\u7406`);
    try {
      const { image: imageUrl, change: returnedChange, isVideo, format, genParams } = await generateComfyUIImage({ prompt: prompt2, width, height, change, extraNegativePrompt: void 0 });
      const cleanedChange = returnedChange.replaceAll("{ComfyUI\u5C40\u90E8\u91CD\u7ED8}", "");
      if (extension_settings[extensionName].cache != "0") {
        await setItemImg(prompt2, imageUrl, {
          change: cleanedChange,
          genParams,
          onTailSuccess: () => addLog(`\u56FE\u50CF\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
          onTailError: (e) => {
            const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
            addLog(`\u9519\u8BEF: ${msg}`);
            if (typeof toastr !== "undefined") toastr.error(msg);
          }
        });
      } else {
        addLog(`\u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
      }
      recordImageGeneration("banana", true);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
        id,
        success: true,
        imageData: imageUrl,
        prompt: prompt2,
        change: cleanedChange,
        isVideo: isVideo || false,
        format: format || "image"
      });
      addLog(`[Banana] \u53D1\u9001ComfyUI\u5C40\u90E8\u91CD\u7ED8\u6210\u529F\u54CD\u5E94 (ID: ${id})`);
    } catch (error) {
      const errorMsg = `[Banana] ComfyUI\u5C40\u90E8\u91CD\u7ED8\u6D41\u7A0B\u6355\u83B7\u5230\u5F02\u5E38 (ID: ${id}): ${error.message}`;
      addLog(`\u9519\u8BEF: ${errorMsg}`);
      console.error("Error generating ComfyUI inpaint image:", error);
      recordImageGeneration("banana", false);
      eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
        id,
        success: false,
        error: error.message,
        prompt: prompt2
      });
      addLog(`[Banana] \u53D1\u9001ComfyUI\u5C40\u90E8\u91CD\u7ED8\u5931\u8D25\u54CD\u5E94 (ID: ${id})`);
    }
    return;
  }
  try {
    const { image: imageUrl, change: returnedChange, isVideo, format, originalUrl, genParams } = await generateBananaImage({ prompt: prompt2, width, height, change, retouchPrompt, retouchImage, videoPrompt, videoImage });
    if (extension_settings[extensionName].cache != "0") {
      await setItemImg(prompt2, imageUrl, {
        change: change_,
        isVideo: isVideo || false,
        format: format || "image",
        originalUrl: originalUrl || "",
        genParams,
        onTailSuccess: () => addLog(`\u56FE\u50CF\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${prompt2}`),
        onTailError: (e) => {
          const msg = `\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25: ${e?.message || e}`;
          addLog(`\u9519\u8BEF: ${msg}`);
          if (typeof toastr !== "undefined") toastr.error(msg);
        }
      });
      if (extension_settings[extensionName].banana.cishu) {
        extension_settings[extensionName].banana.cishu = extension_settings[extensionName].banana.cishu + 1;
        addLog(`\u5F53\u524D\u751F\u56FE\u6B21\u6570\u4E3A for prompt: ${extension_settings[extensionName].banana.cishu}`);
      } else {
        extension_settings[extensionName].banana.cishu = 1;
        addLog(`\u5F53\u524D\u751F\u56FE\u6B21\u6570\u4E3A for prompt: ${extension_settings[extensionName].banana.cishu}`);
      }
    } else {
      addLog(`\u7F13\u5B58\u8BBE\u7F6E\u4E3A\u4E0D\u5B58\u5165\u6570\u636E\u5E93`);
    }
    recordImageGeneration("banana", true);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: true,
      imageData: imageUrl,
      prompt: prompt2,
      change: change_,
      isVideo: isVideo || false,
      format: format || "image",
      originalUrl: originalUrl || ""
    });
    eventSource.emit("generate-image-response", {
      id,
      success: true,
      imageData: imageUrl,
      prompt: prompt2,
      change: change_,
      isVideo: isVideo || false,
      format: format || "image",
      originalUrl: originalUrl || ""
    });
    addLog(`[Banana] Emitted success response for ID: ${id}`);
  } catch (error) {
    const errorMessage = `[Banana] Generation failed for ID ${id}: ${error.message}`;
    addLog(errorMessage);
    console.error(errorMessage);
    recordImageGeneration("banana", false);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id,
      success: false,
      error: error.message,
      prompt: prompt2
    });
    eventSource.emit("generate-image-response", {
      id,
      success: false,
      error: error.message,
      prompt: prompt2
    });
    addLog(`[Banana] Emitted failure response for ID: ${id}`);
  }
}

function handleCancelBananaTask(data) {
  const { taskId } = data;
  addLog(`[Banana] \u6536\u5230\u53D6\u6D88\u4EFB\u52A1\u4E8B\u4EF6 (TaskID: ${taskId})`);
  if (currentTaskId2 === taskId && currentRequestId) {
    addLog(`[Banana] \u53D6\u6D88\u5F53\u524D\u4EFB\u52A1\uFF0C\u53D1\u9001\u5931\u8D25\u54CD\u5E94 (ID: ${currentRequestId})`);
    recordImageGeneration("banana", false);
    eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
      id: currentRequestId,
      success: false,
      error: "\u4EFB\u52A1\u5DF2\u53D6\u6D88",
      prompt: currentPrompt || ""
    });
    eventSource.emit("generate-image-response", {
      id: currentRequestId,
      success: false,
      error: "\u4EFB\u52A1\u5DF2\u53D6\u6D88",
      prompt: currentPrompt || ""
    });
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
      addLog(`[Banana] \u5DF2\u89E6\u53D1 AbortController \u5F7B\u5E95\u4E2D\u65AD\u8BF7\u6C42`);
    }
    currentTaskId2 = null;
    currentRequestId = null;
    currentPrompt = null;
  }
}

function initializeBananaListener() {
  eventSource.on(EventType.GENERATE_IMAGE_REQUEST, bananaGenerate);
  eventSource.on("st_chatu8_cancel_banana_task", handleCancelBananaTask);
  addLog("banana \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u521D\u59CB\u5316\u3002");
}

async function replaceWithBanana() {
  if (isPluginEnabled() && extension_settings[extensionName].mode == "banana") {
    if (!window.initializeBananaListener) {
      window.initializeBananaListener = true;
      initializeBananaListener();
    }
    initializeImageProcessing();
  } else {
    if (window.initializeBananaListener) {
      eventSource.removeListener(EventType.GENERATE_IMAGE_REQUEST, bananaGenerate);
      eventSource.removeListener("st_chatu8_cancel_banana_task", handleCancelBananaTask);
      window.initializeBananaListener = false;
      addLog("[Banana] \u751F\u56FE\u4E8B\u4EF6\u76D1\u542C\u5668\u5DF2\u5173\u95ED\u3002");
    }
  }
}

export { bananaGenerate, replaceWithBanana };
