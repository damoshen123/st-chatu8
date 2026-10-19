// 还原自打包产物 — 原始模块: utils/aiImageGeneration.js
import { eventSource } from "../../../../../script.js";
import { EventType } from "./config.js";

var imageGenerationIdCounter, imageGenerationQueue;

imageGenerationQueue = /* @__PURE__ */ new Map();

imageGenerationIdCounter = 0;

async function requestImageGeneration(prompt2, negative_prompt = "", options = {}) {
  console.log("[AI Image Generation] \u6536\u5230\u751F\u56FE\u8BF7\u6C42:", { prompt: prompt2, negative_prompt, options });
  const generationId = `ai_gen_${++imageGenerationIdCounter}_${Date.now()}`;
  imageGenerationQueue.set(generationId, {
    id: generationId,
    prompt: prompt2,
    negative_prompt,
    options,
    status: "pending",
    timestamp: Date.now(),
    imageUrl: null,
    error: null
  });
  const completionPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, responseHandler);
      imageGenerationQueue.delete(generationId);
      reject(new Error("\u751F\u56FE\u8BF7\u6C42\u8D85\u65F6\uFF085\u5206\u949F\uFF09"));
    }, 5 * 60 * 1e3);
    const responseHandler = (responseData) => {
      if (responseData.id !== generationId) return;
      console.log("[AI Image Generation] \u6536\u5230\u54CD\u5E94:", responseData);
      clearTimeout(timeout);
      eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, responseHandler);
      const record = imageGenerationQueue.get(generationId);
      if (!record) {
        console.warn("[AI Image Generation] \u672A\u627E\u5230\u751F\u56FE\u8BB0\u5F55:", generationId);
        reject(new Error("\u672A\u627E\u5230\u751F\u56FE\u8BB0\u5F55"));
        return;
      }
      if (responseData.success) {
        record.status = "completed";
        record.imageUrl = responseData.imageData || responseData.imageUrl;
        console.log("[AI Image Generation] \u751F\u56FE\u6210\u529F\uFF0CimageUrl\u957F\u5EA6:", record.imageUrl?.length);
        resolve({
          generationId,
          imageUrl: record.imageUrl,
          prompt: prompt2
        });
      } else {
        record.status = "failed";
        record.error = responseData.error || "\u751F\u6210\u5931\u8D25";
        console.log("[AI Image Generation] \u751F\u56FE\u5931\u8D25:", record.error);
        reject(new Error(`\u751F\u56FE\u5931\u8D25: ${record.error}`));
      }
    };
    eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, responseHandler);
    console.log("[AI Image Generation] \u5DF2\u6CE8\u518C\u54CD\u5E94\u76D1\u542C\u5668:", generationId);
  });
  const requestData = {
    id: generationId,
    prompt: prompt2,
    width: options.width || null,
    height: options.height || null
  };
  if (negative_prompt) {
    requestData.negative_prompt = negative_prompt;
  }
  console.log("[AI Image Generation] \u53D1\u9001\u751F\u56FE\u8BF7\u6C42:", requestData);
  eventSource.emit(EventType.GENERATE_IMAGE_REQUEST, requestData);
  try {
    const result = await completionPromise;
    return result;
  } catch (error) {
    imageGenerationQueue.delete(generationId);
    throw error;
  }
}

function getImageGenerationStatus(generationId) {
  const record = imageGenerationQueue.get(generationId);
  if (!record) {
    return `\u672A\u627E\u5230\u751F\u56FE\u8BF7\u6C42: ${generationId}`;
  }
  let status = `\u751F\u56FEID: ${generationId}
`;
  status += `\u72B6\u6001: ${record.status}
`;
  status += `\u63D0\u793A\u8BCD: ${record.prompt}
`;
  if (record.status === "completed" && record.imageUrl) {
    status += `\u56FE\u7247URL: ${record.imageUrl}
`;
  } else if (record.status === "failed" && record.error) {
    status += `\u9519\u8BEF: ${record.error}
`;
  }
  return status;
}

export { getImageGenerationStatus, requestImageGeneration };
