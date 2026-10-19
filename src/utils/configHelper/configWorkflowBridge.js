// 还原自打包产物 — 原始模块: utils/configHelper/configWorkflowBridge.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extensionName } from "../config.js";
import { refreshWorkflowSelectors } from "./configUIRefresh.js";

function getWorkflowStorage(target = "comfyui", name = "") {
  const s = extension_settings[extensionName];
  if (!s) return { storage: null, currentId: "", currentIdKey: "", currentContentKey: "", targetLabel: "", settings: null };
  const t = String(target || "").toLowerCase().trim();
  let isRunningHub = false;
  let isVideo = false;
  let isRef2Vid = false;
  if (t.includes("runninghub") || t.includes("rh")) {
    isRunningHub = true;
    if (t.includes("ref") || t.includes("\u53C2\u8003")) {
      isRef2Vid = true;
    } else if (t.includes("vid") || t.includes("video") || t.includes("\u89C6\u9891") || t.includes("img2vid")) {
      isVideo = true;
    }
  } else {
    if (t.includes("ref") || t.includes("\u53C2\u8003")) {
      isRef2Vid = true;
    } else if (t.includes("vid") || t.includes("video") || t.includes("\u89C6\u9891") || t.includes("img2vid")) {
      isVideo = true;
    }
  }
  if (!isRunningHub && !isVideo && !isRef2Vid && name) {
    const inCommon = s.workers && name in s.workers;
    const inVideo = s.comfyui_video_workers && name in s.comfyui_video_workers;
    if (!inCommon && inVideo) {
      isVideo = true;
    }
  }
  let storageKey = "workers";
  let currentIdKey = "workerid";
  let currentContentKey = "worker";
  let targetLabel = "ComfyUI";
  if (isRunningHub) {
    storageKey = "runninghub_workers";
    if (isRef2Vid) {
      currentIdKey = "runninghub_ref2vid_workerid";
      currentContentKey = "runninghub_ref2vid_worker";
      targetLabel = "RunningHub\u53C2\u8003\u751F\u89C6\u9891";
    } else if (isVideo) {
      currentIdKey = "runninghub_img2vid_workerid";
      currentContentKey = "runninghub_img2vid_worker";
      targetLabel = "RunningHub\u56FE\u751F\u89C6\u9891";
    } else {
      currentIdKey = "runninghub_workerid";
      currentContentKey = "runninghub_worker";
      targetLabel = "RunningHub";
    }
  } else {
    if (isRef2Vid) {
      storageKey = "comfyui_video_workers";
      currentIdKey = "comfyui_ref2vid_workerid";
      currentContentKey = "comfyui_ref2vid_worker";
      targetLabel = "ComfyUI\u53C2\u8003\u751F\u89C6\u9891";
    } else if (isVideo) {
      storageKey = "comfyui_video_workers";
      currentIdKey = "comfyui_img2vid_workerid";
      currentContentKey = "comfyui_img2vid_worker";
      targetLabel = "ComfyUI\u56FE\u751F\u89C6\u9891";
    }
  }
  if (!s[storageKey]) {
    s[storageKey] = {};
  }
  return {
    storage: s[storageKey],
    currentId: s[currentIdKey] || "(\u672A\u9009\u62E9)",
    currentIdKey,
    currentContentKey,
    targetLabel,
    settings: s
  };
}

function getWorkflowList(target = "comfyui") {
  const { storage, currentId, targetLabel } = getWorkflowStorage(target);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  const names = Object.keys(storage);
  let result = `\u{1F4C2} [${targetLabel}] \u5DE5\u4F5C\u6D41\u9884\u8BBE\u5217\u8868 (\u5171 ${names.length} \u4E2A)\uFF1A
`;
  result += `\u5F53\u524D\u4F7F\u7528: ${currentId}
`;
  result += "\u2500".repeat(40) + "\n";
  for (const name of names) {
    const isCurrent = name === currentId ? " \u2190 \u5F53\u524D" : "";
    const content = storage[name] || "";
    const size = content.length;
    result += `  - ${name} (${size}\u5B57\u7B26)${isCurrent}
`;
  }
  const t = String(target || "").toLowerCase().trim();
  const s = extension_settings[extensionName];
  if ((t === "comfyui" || t === "") && s?.comfyui_video_workers) {
    const videoCount = Object.keys(s.comfyui_video_workers).length;
    result += `
\u{1F4A1} \u63D0\u793A\uFF1A\u53E6\u6709\u3010ComfyUI \u56FE\u751F\u89C6\u9891\u5DE5\u4F5C\u6D41\u3011\u9884\u8BBE\u6C60 (\u5171 ${videoCount} \u4E2A)\uFF0C\u53EF\u7528 target: "comfyui_video" \u5355\u72EC\u67E5\u8BE2\u4E0E\u7F16\u8F91\u3002`;
  }
  return result;
}

function readWorkflow(name, target = "comfyui") {
  const { storage, targetLabel } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!(name in storage)) {
    const available = Object.keys(storage).join(", ") || "(\u65E0)";
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002\u53EF\u7528: ${available}`;
  }
  const content = storage[name];
  if (!content) return `${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\u3002`;
  return `\u{1F4C4} [${targetLabel}] \u5DE5\u4F5C\u6D41 "${name}" \u7684\u5B8C\u6574\u5185\u5BB9 (${content.length}\u5B57\u7B26)\uFF1A
${content}`;
}

function scanWorkflowVariables(name, target = "comfyui") {
  const { storage, targetLabel } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!(name in storage)) {
    const available = Object.keys(storage).join(", ") || "(\u65E0)";
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002\u53EF\u7528: ${available}`;
  }
  const content = storage[name];
  if (!content) return `${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\uFF0C\u65E0\u53D8\u91CF\u3002`;
  const regex = /%([\u4e00-\u9fa5a-zA-Z0-9_]+)%/g;
  const found = /* @__PURE__ */ new Map();
  let match;
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1];
    if (!found.has(varName)) {
      found.set(varName, 0);
    }
    found.set(varName, found.get(varName) + 1);
  }
  if (found.size === 0) {
    return `${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E2D\u672A\u53D1\u73B0 %xxx% \u683C\u5F0F\u7684\u53D8\u91CF\u5360\u4F4D\u7B26\u3002`;
  }
  const varDescMap = {
    // 英文标准
    "seed": "\u968F\u673A\u79CD\u5B50 (\u6570\u503C)",
    "steps": "\u91C7\u6837\u6B65\u6570 (\u6570\u503C)",
    "cfg_scale": "CFG\u5F15\u5BFC\u6BD4\u4F8B (\u6570\u503C)",
    "width": "\u56FE\u7247\u5BBD\u5EA6 (\u6570\u503C)",
    "height": "\u56FE\u7247\u9AD8\u5EA6 (\u6570\u503C)",
    "prompt": "\u6B63\u9762\u63D0\u793A\u8BCD (\u5B57\u7B26\u4E32)",
    "negative_prompt": "\u8D1F\u9762\u63D0\u793A\u8BCD (\u5B57\u7B26\u4E32)",
    "sampler_name": "\u91C7\u6837\u5668 (\u5B57\u7B26\u4E32)",
    "MODEL_NAME": "\u6A21\u578B\u540D\u79F0 (\u5B57\u7B26\u4E32)",
    "c_quanzhong": "\u6743\u91CD (\u6570\u503C)",
    "c_idquanzhong": "ID\u6743\u91CD (\u6570\u503C)",
    "c_xijie": "\u7EC6\u8282 (\u6570\u503C)",
    "c_fenwei": "\u6C1B\u56F4 (\u6570\u503C)",
    "comfyuicankaotupian": "\u53C2\u8003\u56FE\u7247 (\u5B57\u7B26\u4E32)",
    "ipa": "IP-Adapter (\u5B57\u7B26\u4E32)",
    "scheduler": "\u8C03\u5EA6\u5668 (\u5B57\u7B26\u4E32)",
    "vae": "VAE\u6A21\u578B (\u5B57\u7B26\u4E32)",
    "clip": "CLIP\u6A21\u578B (\u5B57\u7B26\u4E32)",
    "inpaint_image": "\u91CD\u7ED8\u539F\u56FE (\u5B57\u7B26\u4E32)",
    "inpaint_mask": "\u91CD\u7ED8\u8499\u7248 (\u5B57\u7B26\u4E32)",
    "inpaint_denoise": "\u91CD\u7ED8\u5E45\u5EA6 (\u6570\u503C)",
    "inpaint_positive": "\u91CD\u7ED8\u6B63\u9762\u8BCD (\u5B57\u7B26\u4E32)",
    "inpaint_negative": "\u91CD\u7ED8\u8D1F\u9762\u8BCD (\u5B57\u7B26\u4E32)",
    // 中文通用与视频标准
    "\u63D0\u793A\u8BCD": "\u6B63\u9762\u63D0\u793A\u8BCD (\u5B57\u7B26\u4E32)",
    "\u6B63\u9762\u63D0\u793A\u8BCD": "\u6B63\u9762\u63D0\u793A\u8BCD (\u5B57\u7B26\u4E32)",
    "\u8D1F\u9762\u63D0\u793A\u8BCD": "\u8D1F\u9762\u63D0\u793A\u8BCD (\u5B57\u7B26\u4E32)",
    "\u79CD\u5B50": "\u968F\u673A\u79CD\u5B50 (\u6570\u503C)",
    "\u6B65\u6570": "\u91C7\u6837\u6B65\u6570 (\u6570\u503C)",
    "\u89C6\u9891\u6B65\u6570": "\u89C6\u9891\u4E13\u7528\u91C7\u6837\u6B65\u6570 (\u6570\u503C)",
    "\u50CF\u7D20": "\u5206\u8FA8\u7387/\u5146\u50CF\u7D20 (\u6570\u503C)",
    "\u89C6\u9891\u79D2\u6570": "\u89C6\u9891\u65F6\u957F\u79D2\u6570 (\u6570\u503C)",
    "\u6A21\u578B": "\u6A21\u578B\u540D\u79F0 (\u5B57\u7B26\u4E32)",
    "\u91C7\u6837\u65B9\u6CD5": "\u91C7\u6837\u5668 (\u5B57\u7B26\u4E32)",
    "\u8C03\u5EA6\u5668": "\u8C03\u5EA6\u5668 (\u5B57\u7B26\u4E32)",
    "CFG": "CFG\u6BD4\u4F8B (\u6570\u503C)",
    "\u5BBD\u5EA6": "\u56FE\u7247\u5BBD\u5EA6 (\u6570\u503C)",
    "\u9AD8\u5EA6": "\u56FE\u7247\u9AD8\u5EA6 (\u6570\u503C)",
    // 图片与控制 1~9
    "\u56FE\u72471": "\u56FE\u72471 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72472": "\u56FE\u72472 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72473": "\u56FE\u72473 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72474": "\u56FE\u72474 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72475": "\u56FE\u72475 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72476": "\u56FE\u72476 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72477": "\u56FE\u72477 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72478": "\u56FE\u72478 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72479": "\u56FE\u72479 \u6587\u4EF6\u540D (LoadImage)",
    "\u56FE\u72471\u63A7\u5236": "\u56FE\u72471 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u56FE\u72472\u63A7\u5236": "\u56FE\u72472 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u56FE\u72473\u63A7\u5236": "\u56FE\u72473 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u56FE\u72474\u63A7\u5236": "\u56FE\u72474 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u56FE\u72475\u63A7\u5236": "\u56FE\u72475 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u56FE\u72476\u63A7\u5236": "\u56FE\u72476 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u56FE\u72477\u63A7\u5236": "\u56FE\u72477 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u56FE\u72478\u63A7\u5236": "\u56FE\u72478 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u56FE\u72479\u63A7\u5236": "\u56FE\u72479 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    // 音频与控制 1~3
    "\u97F3\u98911": "\u97F3\u98911 \u6587\u4EF6\u540D (LoadAudio)",
    "\u97F3\u98912": "\u97F3\u98912 \u6587\u4EF6\u540D (LoadAudio)",
    "\u97F3\u98913": "\u97F3\u98913 \u6587\u4EF6\u540D (LoadAudio)",
    "\u97F3\u98911\u63A7\u5236": "\u97F3\u98911 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u97F3\u98912\u63A7\u5236": "\u97F3\u98912 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)",
    "\u97F3\u98913\u63A7\u5236": "\u97F3\u98913 \u5F00\u5173/Bypass\u6A21\u5F0F (\u6570\u503C)"
  };
  let result = `\u{1F50D} [${targetLabel}] \u5DE5\u4F5C\u6D41 "${name}" \u4E2D\u7684\u53D8\u91CF\u5360\u4F4D\u7B26 (\u5171 ${found.size} \u79CD)\uFF1A
`;
  result += "\u2500".repeat(50) + "\n";
  for (const [varName, count] of found) {
    const desc = varDescMap[varName] || "(\u81EA\u5B9A\u4E49\u53D8\u91CF)";
    result += `  %${varName}% \u2014 ${desc}  (\u51FA\u73B0 ${count} \u6B21)
`;
  }
  return result;
}

function replaceWorkflowVariable(name, variable, value, target = "comfyui") {
  const { storage, currentId, currentContentKey, targetLabel, settings: settings3 } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!variable) return "\u274C \u8BF7\u6307\u5B9A\u53D8\u91CF\u540D\u3002";
  if (!(name in storage)) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002`;
  }
  let content = storage[name];
  if (!content) return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\u3002`;
  const cleanVar = variable.replace(/%/g, "");
  const quotedPlaceholder = `"%${cleanVar}%"`;
  const unquotedPlaceholder = `%${cleanVar}%`;
  let count = 0;
  if (content.includes(quotedPlaceholder)) {
    let replacement;
    if (typeof value === "number" || !isNaN(Number(value))) {
      replacement = String(Number(value));
    } else {
      replacement = `"${String(value).replace(/"/g, '\\"')}"`;
    }
    count = (content.match(new RegExp(quotedPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    content = content.replaceAll(quotedPlaceholder, replacement);
  } else if (content.includes(unquotedPlaceholder)) {
    const replacement = String(value);
    count = (content.match(new RegExp(unquotedPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    content = content.replaceAll(unquotedPlaceholder, replacement);
  } else {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E2D\u672A\u627E\u5230\u53D8\u91CF %${cleanVar}%\u3002\u8BF7\u5148\u7528 workflow_variables \u786E\u8BA4\u3002`;
  }
  storage[name] = content;
  if (currentId === name && settings3 && currentContentKey) {
    settings3[currentContentKey] = content;
  }
  saveSettingsDebounced();
  try {
    refreshWorkflowSelectors(settings3);
  } catch (_e) {
  }
  return `\u2705 \u5DF2\u5728 [${targetLabel}] \u5DE5\u4F5C\u6D41 "${name}" \u4E2D\u66FF\u6362 %${cleanVar}% (${count} \u5904)`;
}

function saveWorkflow(name, content, target = "comfyui") {
  const { storage, currentId, currentContentKey, targetLabel, settings: settings3 } = getWorkflowStorage(target, name);
  if (!storage || !settings3) return `\u274C \u63D2\u4EF6\u914D\u7F6E\u5C1A\u672A\u521D\u59CB\u5316\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!content) return "\u274C \u8BF7\u63D0\u4F9B\u5DE5\u4F5C\u6D41\u5185\u5BB9\u3002";
  try {
    JSON.parse(content);
  } catch (e) {
    return `\u274C \u5DE5\u4F5C\u6D41\u5185\u5BB9\u4E0D\u662F\u5408\u6CD5\u7684 JSON: ${e.message}`;
  }
  const isNew = !(name in storage);
  storage[name] = content;
  if (currentId === name && currentContentKey) {
    settings3[currentContentKey] = content;
  }
  saveSettingsDebounced();
  try {
    refreshWorkflowSelectors(settings3);
  } catch (_e) {
  }
  return `\u2705 [${targetLabel}] \u5DE5\u4F5C\u6D41 "${name}" \u5DF2${isNew ? "\u521B\u5EFA" : "\u4FDD\u5B58"} (${content.length}\u5B57\u7B26)`;
}

function listWorkflowNodes(name, target = "comfyui") {
  const { storage, targetLabel } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!(name in storage)) {
    const available = Object.keys(storage).join(", ") || "(\u65E0)";
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002\u53EF\u7528: ${available}`;
  }
  const content = storage[name];
  if (!content) return `${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\u3002`;
  let workflow;
  try {
    workflow = JSON.parse(content);
  } catch (e) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" JSON \u89E3\u6790\u5931\u8D25: ${e.message}`;
  }
  if (!workflow || typeof workflow !== "object") {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u683C\u5F0F\u4E0D\u6B63\u786E\u3002`;
  }
  const nodeIds = Object.keys(workflow).sort((a, b) => Number(a) - Number(b));
  if (nodeIds.length === 0) {
    return `${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E2D\u6CA1\u6709\u8282\u70B9\u3002`;
  }
  let result = `\u{1F4CB} [${targetLabel}] \u5DE5\u4F5C\u6D41 "${name}" \u7684\u8282\u70B9\u5217\u8868 (\u5171 ${nodeIds.length} \u4E2A\u8282\u70B9)\uFF1A
`;
  result += "\u2500".repeat(60) + "\n";
  for (const nodeId of nodeIds) {
    const node = workflow[nodeId];
    const classType = node.class_type || "(\u672A\u77E5\u7C7B\u578B)";
    const title = node._meta?.title || classType;
    result += `  [${nodeId}] ${title} (${classType})
`;
  }
  return result;
}

function readWorkflowNode(name, nodeId, target = "comfyui") {
  const { storage, targetLabel } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!nodeId) return "\u274C \u8BF7\u6307\u5B9A\u8282\u70B9ID\u3002";
  if (!(name in storage)) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002`;
  }
  const content = storage[name];
  if (!content) return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\u3002`;
  let workflow;
  try {
    workflow = JSON.parse(content);
  } catch (e) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" JSON \u89E3\u6790\u5931\u8D25: ${e.message}`;
  }
  if (!(nodeId in workflow)) {
    const available = Object.keys(workflow).sort((a, b) => Number(a) - Number(b)).join(", ");
    return `\u274C \u8282\u70B9 "${nodeId}" \u4E0D\u5B58\u5728\u3002\u53EF\u7528\u8282\u70B9: ${available}`;
  }
  const node = workflow[nodeId];
  const title = node._meta?.title || node.class_type || "(\u672A\u547D\u540D)";
  let result = `\u{1F50D} [${targetLabel}] \u8282\u70B9 [${nodeId}] ${title} \u7684\u8BE6\u7EC6\u4FE1\u606F\uFF1A
`;
  result += "\u2500".repeat(60) + "\n";
  result += JSON.stringify(node, null, 2);
  return result;
}

function updateWorkflowNodeInput(name, nodeId, inputKey, value, target = "comfyui") {
  const { storage, currentId, currentContentKey, targetLabel, settings: settings3 } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!nodeId) return "\u274C \u8BF7\u6307\u5B9A\u8282\u70B9ID\u3002";
  if (!inputKey) return "\u274C \u8BF7\u6307\u5B9A\u8F93\u5165\u53C2\u6570\u952E\u540D\u3002";
  if (!(name in storage)) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002`;
  }
  const content = storage[name];
  if (!content) return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\u3002`;
  let workflow;
  try {
    workflow = JSON.parse(content);
  } catch (e) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" JSON \u89E3\u6790\u5931\u8D25: ${e.message}`;
  }
  if (!(nodeId in workflow)) {
    return `\u274C \u8282\u70B9 "${nodeId}" \u4E0D\u5B58\u5728\u3002`;
  }
  const node = workflow[nodeId];
  if (!node.inputs) {
    node.inputs = {};
  }
  const inputKeys = Object.keys(node.inputs);
  const oldValue = node.inputs[inputKey];
  node.inputs[inputKey] = value;
  const preservedKeys = Object.keys(node.inputs);
  const lostKeys = inputKeys.filter((k) => !preservedKeys.includes(k));
  const newContent = JSON.stringify(workflow);
  storage[name] = newContent;
  if (currentId === name && settings3 && currentContentKey) {
    settings3[currentContentKey] = newContent;
  }
  saveSettingsDebounced();
  try {
    refreshWorkflowSelectors(settings3);
  } catch (_e) {
  }
  const title = node._meta?.title || node.class_type || "(\u672A\u547D\u540D)";
  let result = `\u2705 \u5DF2\u4FEE\u6539 [${targetLabel}] \u8282\u70B9 [${nodeId}] ${title} \u7684\u53C2\u6570\uFF1A
  ${inputKey}: ${JSON.stringify(oldValue)} \u2192 ${JSON.stringify(value)}`;
  if (lostKeys.length > 0) {
    result += `
\u26A0\uFE0F \u8B66\u544A\uFF1A\u4EE5\u4E0B\u5B57\u6BB5\u5728\u4FEE\u6539\u8FC7\u7A0B\u4E2D\u4E22\u5931: ${lostKeys.join(", ")}`;
  }
  result += `
\u{1F4CB} \u8282\u70B9\u5F53\u524D\u5B57\u6BB5: ${preservedKeys.join(", ")}`;
  return result;
}

function batchUpdateWorkflowNodes(name, updates, target = "comfyui") {
  const { storage, currentId, currentContentKey, targetLabel, settings: settings3 } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!Array.isArray(updates) || updates.length === 0) {
    return "\u274C \u8BF7\u63D0\u4F9B\u6709\u6548\u7684\u66F4\u65B0\u5217\u8868\uFF08\u6570\u7EC4\u683C\u5F0F\uFF09\u3002";
  }
  if (!(name in storage)) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002`;
  }
  const content = storage[name];
  if (!content) return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\u3002`;
  let workflow;
  try {
    workflow = JSON.parse(content);
  } catch (e) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" JSON \u89E3\u6790\u5931\u8D25: ${e.message}`;
  }
  const results = [];
  let successCount = 0;
  const warnings = [];
  for (const update of updates) {
    const { nodeId, inputKey, value } = update;
    if (!nodeId || !inputKey) {
      results.push(`\u26A0\uFE0F \u8DF3\u8FC7\u65E0\u6548\u66F4\u65B0: ${JSON.stringify(update)}`);
      continue;
    }
    if (!(nodeId in workflow)) {
      results.push(`\u274C \u8282\u70B9 "${nodeId}" \u4E0D\u5B58\u5728`);
      continue;
    }
    const node = workflow[nodeId];
    if (!node.inputs) {
      node.inputs = {};
    }
    const inputKeysBefore = Object.keys(node.inputs);
    const oldValue = node.inputs[inputKey];
    node.inputs[inputKey] = value;
    const inputKeysAfter = Object.keys(node.inputs);
    const lostKeys = inputKeysBefore.filter((k) => !inputKeysAfter.includes(k));
    if (lostKeys.length > 0) {
      warnings.push(`\u26A0\uFE0F \u8282\u70B9 [${nodeId}] \u4E22\u5931\u5B57\u6BB5: ${lostKeys.join(", ")}`);
    }
    const title = node._meta?.title || node.class_type || "(\u672A\u547D\u540D)";
    results.push(`\u2705 [${nodeId}] ${title}.${inputKey}: ${JSON.stringify(oldValue)} \u2192 ${JSON.stringify(value)}`);
    successCount++;
  }
  const newContent = JSON.stringify(workflow);
  storage[name] = newContent;
  if (currentId === name && settings3 && currentContentKey) {
    settings3[currentContentKey] = newContent;
  }
  saveSettingsDebounced();
  try {
    refreshWorkflowSelectors(settings3);
  } catch (_e) {
  }
  let result = `\u{1F4DD} [${targetLabel}] \u6279\u91CF\u4FEE\u6539\u5DE5\u4F5C\u6D41 "${name}" (\u6210\u529F ${successCount}/${updates.length})\uFF1A
`;
  result += "\u2500".repeat(60) + "\n";
  result += results.join("\n");
  if (warnings.length > 0) {
    result += "\n\n" + warnings.join("\n");
  }
  return result;
}

function deleteWorkflowNode(name, nodeId, target = "comfyui") {
  const { storage, currentId, currentContentKey, targetLabel, settings: settings3 } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!nodeId) return "\u274C \u8BF7\u6307\u5B9A\u8282\u70B9ID\u3002";
  if (!(name in storage)) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002`;
  }
  const content = storage[name];
  if (!content) return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\u3002`;
  let workflow;
  try {
    workflow = JSON.parse(content);
  } catch (e) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" JSON \u89E3\u6790\u5931\u8D25: ${e.message}`;
  }
  if (!(nodeId in workflow)) {
    return `\u274C \u8282\u70B9 "${nodeId}" \u4E0D\u5B58\u5728\u3002`;
  }
  const node = workflow[nodeId];
  const title = node._meta?.title || node.class_type || "(\u672A\u547D\u540D)";
  delete workflow[nodeId];
  const newContent = JSON.stringify(workflow);
  storage[name] = newContent;
  if (currentId === name && settings3 && currentContentKey) {
    settings3[currentContentKey] = newContent;
  }
  saveSettingsDebounced();
  try {
    refreshWorkflowSelectors(settings3);
  } catch (_e) {
  }
  return `\u2705 \u5DF2\u5728 [${targetLabel}] \u4E2D\u5220\u9664\u8282\u70B9 [${nodeId}] ${title}`;
}

function addWorkflowNode(name, nodeId, nodeData, target = "comfyui") {
  const { storage, currentId, currentContentKey, targetLabel, settings: settings3 } = getWorkflowStorage(target, name);
  if (!storage) return `\u274C \u672A\u627E\u5230 ${targetLabel} \u5DE5\u4F5C\u6D41\u6570\u636E\u3002`;
  if (!name) return "\u274C \u8BF7\u6307\u5B9A\u5DE5\u4F5C\u6D41\u540D\u79F0\u3002";
  if (!nodeId) return "\u274C \u8BF7\u6307\u5B9A\u8282\u70B9ID\u3002";
  if (!nodeData || typeof nodeData !== "object") {
    return "\u274C \u8BF7\u63D0\u4F9B\u6709\u6548\u7684\u8282\u70B9\u6570\u636E\uFF08\u5BF9\u8C61\u683C\u5F0F\uFF09\u3002";
  }
  if (!(name in storage)) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u4E0D\u5B58\u5728\u3002`;
  }
  const content = storage[name];
  if (!content) return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" \u5185\u5BB9\u4E3A\u7A7A\u3002`;
  let workflow;
  try {
    workflow = JSON.parse(content);
  } catch (e) {
    return `\u274C ${targetLabel} \u5DE5\u4F5C\u6D41 "${name}" JSON \u89E3\u6790\u5931\u8D25: ${e.message}`;
  }
  if (nodeId in workflow) {
    return `\u274C \u8282\u70B9 "${nodeId}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6ID\u6216\u5148\u5220\u9664\u73B0\u6709\u8282\u70B9\u3002`;
  }
  workflow[nodeId] = nodeData;
  const newContent = JSON.stringify(workflow);
  storage[name] = newContent;
  if (currentId === name && settings3 && currentContentKey) {
    settings3[currentContentKey] = newContent;
  }
  saveSettingsDebounced();
  try {
    refreshWorkflowSelectors(settings3);
  } catch (_e) {
  }
  const title = nodeData._meta?.title || nodeData.class_type || "(\u672A\u547D\u540D)";
  return `\u2705 \u5DF2\u5728 [${targetLabel}] \u4E2D\u6DFB\u52A0\u8282\u70B9 [${nodeId}] ${title}`;
}

function analyzeWorkflow(contentOrName, target = "comfyui") {
  let jsonStr = "";
  let workflowName = "";
  const potentialName = typeof contentOrName === "string" && !contentOrName.trim().startsWith("{") ? contentOrName.trim() : "";
  const { storage, targetLabel } = getWorkflowStorage(target, potentialName);
  if (storage && contentOrName in storage) {
    jsonStr = storage[contentOrName];
    workflowName = contentOrName;
  } else if (typeof contentOrName === "string") {
    jsonStr = contentOrName.trim();
  }
  if (!jsonStr) {
    return `\u274C \u672A\u80FD\u83B7\u53D6\u5230\u5DE5\u4F5C\u6D41\u5185\u5BB9\u3002\u8BF7\u786E\u8BA4\u9884\u8BBE\u540D\u79F0\u6216\u63D0\u4F9B\u5B8C\u6574\u7684 JSON \u5B57\u7B26\u4E32\u3002`;
  }
  let workflow;
  try {
    workflow = JSON.parse(jsonStr);
  } catch (e) {
    return `\u274C \u5DE5\u4F5C\u6D41 JSON \u89E3\u6790\u5931\u8D25: ${e.message}`;
  }
  if (!workflow || typeof workflow !== "object") {
    return `\u274C \u5DE5\u4F5C\u6D41\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u4E0D\u662F\u6709\u6548\u7684\u5BF9\u8C61\u7ED3\u6784\u3002`;
  }
  const nodeIds = Object.keys(workflow).sort((a, b) => Number(a) - Number(b));
  if (nodeIds.length === 0) {
    return `\u274C \u5DE5\u4F5C\u6D41\u4E2D\u6CA1\u6709\u53D1\u73B0\u4EFB\u4F55\u8282\u70B9\u3002`;
  }
  const existingPlaceholders = /* @__PURE__ */ new Set();
  const phRegex = /%([\u4e00-\u9fa5a-zA-Z0-9_]+)%/g;
  let phMatch;
  while ((phMatch = phRegex.exec(jsonStr)) !== null) {
    existingPlaceholders.add(`%${phMatch[1]}%`);
  }
  const downstreamMap = {};
  for (const nid of nodeIds) {
    const n = workflow[nid];
    if (!n || typeof n !== "object" || !n.inputs) continue;
    for (const [inputKey, inputVal] of Object.entries(n.inputs)) {
      if (Array.isArray(inputVal) && inputVal.length === 2 && typeof inputVal[0] === "string") {
        const srcId = inputVal[0];
        if (!downstreamMap[srcId]) downstreamMap[srcId] = [];
        downstreamMap[srcId].push({
          targetNodeId: nid,
          targetClassType: (n.class_type || "").toLowerCase(),
          rawClassType: n.class_type || "",
          targetTitle: n._meta?.title || n.class_type || `Node_${nid}`,
          inputKey
        });
      }
    }
  }
  const recommendations = [];
  let imageIndex = 1;
  let audioIndex = 1;
  for (const nodeId of nodeIds) {
    const node = workflow[nodeId];
    if (!node || typeof node !== "object") continue;
    const classType = (node.class_type || "").toLowerCase();
    const title = node._meta?.title || node.class_type || `Node_${nodeId}`;
    const inputs = node.inputs || {};
    if (classType.includes("sampler")) {
      if ("seed" in inputs && typeof inputs.seed === "number") {
        recommendations.push({
          nodeId,
          title,
          classType: node.class_type,
          field: "seed",
          current: inputs.seed,
          suggested: "%\u79CD\u5B50%",
          alt: "%seed%",
          note: "\u968F\u673A\u79CD\u5B50\uFF0C\u5BA2\u6237\u7AEF\u751F\u56FE/\u751F\u89C6\u9891\u65F6\u81EA\u52A8\u66FF\u6362\u4E3A\u968F\u673A\u6570\u6216\u7528\u6237\u6307\u5B9A\u79CD\u5B50"
        });
      } else if ("noise_seed" in inputs && typeof inputs.noise_seed === "number") {
        recommendations.push({
          nodeId,
          title,
          classType: node.class_type,
          field: "noise_seed",
          current: inputs.noise_seed,
          suggested: "%\u79CD\u5B50%",
          alt: "%seed%",
          note: "\u566A\u6CE2\u968F\u673A\u79CD\u5B50"
        });
      }
      if ("steps" in inputs && typeof inputs.steps === "number") {
        const isVideoSampler = classType.includes("video") || classType.includes("wan") || title.toLowerCase().includes("video");
        recommendations.push({
          nodeId,
          title,
          classType: node.class_type,
          field: "steps",
          current: inputs.steps,
          suggested: isVideoSampler ? "%\u89C6\u9891\u6B65\u6570%" : "%\u6B65\u6570%",
          alt: "%steps%",
          note: isVideoSampler ? "\u89C6\u9891\u4E13\u5C5E\u91C7\u6837\u6B65\u6570\uFF08\u63A8\u8350 %\u89C6\u9891\u6B65\u6570% \u6216 %\u6B65\u6570%\uFF09" : "\u57FA\u7840\u751F\u56FE\u91C7\u6837\u6B65\u6570"
        });
      }
      if ("cfg" in inputs && typeof inputs.cfg === "number") {
        recommendations.push({
          nodeId,
          title,
          classType: node.class_type,
          field: "cfg",
          current: inputs.cfg,
          suggested: "%CFG%",
          alt: "%cfg_scale%",
          note: "CFG \u5F15\u5BFC\u6BD4\u4F8B"
        });
      }
    }
    if (classType.includes("text") || classType.includes("prompt") || classType.includes("cliptext")) {
      for (const key of ["text", "prompt"]) {
        if (key in inputs && typeof inputs[key] === "string") {
          const textVal = inputs[key];
          const isNeg = title.toLowerCase().includes("neg") || key.toLowerCase().includes("neg");
          if (!textVal.includes("%")) {
            recommendations.push({
              nodeId,
              title,
              classType: node.class_type,
              field: key,
              current: textVal.length > 30 ? textVal.substring(0, 30) + "..." : textVal,
              suggested: isNeg ? "%\u8D1F\u9762\u63D0\u793A\u8BCD%" : "%\u63D0\u793A\u8BCD%",
              alt: isNeg ? "%negative_prompt%" : "%prompt%",
              note: isNeg ? "\u8D1F\u9762\u63D0\u793A\u8BCD\u8F93\u5165\u9879" : "\u6838\u5FC3\u6B63\u9762\u63D0\u793A\u8BCD\u8F93\u5165\u9879"
            });
          }
        }
      }
    }
    if (classType.includes("latent") || classType.includes("resolution") || classType.includes("dimension")) {
      if ("width" in inputs && typeof inputs.width === "number") {
        recommendations.push({
          nodeId,
          title,
          classType: node.class_type,
          field: "width",
          current: inputs.width,
          suggested: "%\u5BBD\u5EA6%",
          alt: "%width%",
          note: "\u751F\u6210\u56FE\u50CF/\u89C6\u9891\u5BBD\u5EA6"
        });
      }
      if ("height" in inputs && typeof inputs.height === "number") {
        recommendations.push({
          nodeId,
          title,
          classType: node.class_type,
          field: "height",
          current: inputs.height,
          suggested: "%\u9AD8\u5EA6%",
          alt: "%height%",
          note: "\u751F\u6210\u56FE\u50CF/\u89C6\u9891\u9AD8\u5EA6"
        });
      }
      if ("megapixels" in inputs && typeof inputs.megapixels === "number") {
        recommendations.push({
          nodeId,
          title,
          classType: node.class_type,
          field: "megapixels",
          current: inputs.megapixels,
          suggested: "%\u50CF\u7D20%",
          alt: "%megapixels%",
          note: "\u5206\u8FA8\u7387/\u5146\u50CF\u7D20\uFF08\u89C6\u9891\u751F\u6210\u5E38\u89C1\uFF0C\u5982 0.9 / 1.0\uFF09"
        });
      }
      for (const durKey of ["duration", "video_length_seconds", "length"]) {
        if (durKey in inputs && typeof inputs[durKey] === "number") {
          recommendations.push({
            nodeId,
            title,
            classType: node.class_type,
            field: durKey,
            current: inputs[durKey],
            suggested: "%\u89C6\u9891\u79D2\u6570%",
            alt: "%duration%",
            note: "\u89C6\u9891\u65F6\u957F\u79D2\u6570 (\u5982 4, 5, 6)"
          });
          break;
        }
      }
    }
    if (classType.includes("loadimage")) {
      if ("image" in inputs) {
        let matchedNum = null;
        const titleMatch = title.match(/(?:图片|图像|Image|img|图)\s*([1-9])/i);
        if (titleMatch) {
          matchedNum = parseInt(titleMatch[1]);
        } else if (typeof inputs.image === "string") {
          const curMatch = inputs.image.match(/%图片([1-9])%/);
          if (curMatch) matchedNum = parseInt(curMatch[1]);
        }
        let topologyRole = "";
        let topologyNum = null;
        const downLinks = downstreamMap[nodeId] || [];
        if (!matchedNum && downLinks.length > 0) {
          for (const link of downLinks) {
            const tc = link.targetClassType;
            const ik = (link.inputKey || "").toLowerCase();
            if (tc.includes("vaeencode") && (ik.includes("pixels") || ik.includes("image"))) {
              topologyRole = `\u3010\u62D3\u6251\u63A8\u65AD\u3011\u4E0B\u6E38\u8FDE\u5411\u8282\u70B9 [${link.targetNodeId}] ${link.targetTitle} \u7684 "${link.inputKey}"\uFF0C\u5224\u5B9A\u4E3A\u751F\u56FE/\u751F\u89C6\u9891\u4E3B\u8F93\u5165\u56FE\uFF08\u539F\u56FE/\u9996\u5E27\uFF09`;
              topologyNum = 1;
              break;
            }
            if (ik.includes("end_image") || ik.includes("tail") || ik.includes("last_frame")) {
              topologyRole = `\u3010\u62D3\u6251\u63A8\u65AD\u3011\u4E0B\u6E38\u8FDE\u5411\u8282\u70B9 [${link.targetNodeId}] ${link.targetTitle} \u7684\u5C3E\u5E27\u8F93\u5165 "${link.inputKey}"\uFF0C\u5224\u5B9A\u4E3A\u89C6\u9891\u5C3E\u5E27`;
              topologyNum = 2;
              break;
            }
            if (tc.includes("ipadapter") || tc.includes("instantid") || tc.includes("faceid") || tc.includes("insightface") || tc.includes("reference")) {
              topologyRole = `\u3010\u62D3\u6251\u63A8\u65AD\u3011\u4E0B\u6E38\u8FDE\u5411\u8282\u70B9 [${link.targetNodeId}] ${link.targetTitle} (${link.rawClassType})\uFF0C\u5224\u5B9A\u4E3A\u53C2\u8003\u56FE/\u4EBA\u8138\u7279\u5F81\u56FE`;
              topologyNum = imageIndex > 1 ? imageIndex : 2;
              break;
            }
            if (tc.includes("controlnet")) {
              topologyRole = `\u3010\u62D3\u6251\u63A8\u65AD\u3011\u4E0B\u6E38\u8FDE\u5411\u8282\u70B9 [${link.targetNodeId}] ${link.targetTitle} (${link.rawClassType})\uFF0C\u5224\u5B9A\u4E3A ControlNet \u63A7\u5236\u6761\u4EF6\u56FE`;
              topologyNum = imageIndex > 1 ? imageIndex : 2;
              break;
            }
          }
        }
        const finalNum = matchedNum || topologyNum || imageIndex;
        if (!matchedNum && !topologyNum && imageIndex <= 9) imageIndex++;
        const suggestedPh = `%\u56FE\u7247${finalNum}%`;
        const isAlreadyConfigured = inputs.image === suggestedPh;
        let noteText = "";
        if (matchedNum) {
          noteText = `\u3010\u4F9D\u636E Title\u3011\u8282\u70B9\u6807\u9898\u4E3A\u300C${title}\u300D\uFF0C\u7CBE\u786E\u9501\u5B9A\u4E3A %\u56FE\u7247${finalNum}%`;
        } else if (topologyRole) {
          noteText = `${topologyRole}\uFF0C\u63A8\u8350 %\u56FE\u7247${finalNum}%`;
        } else {
          noteText = downLinks.length > 0 ? `\u26A0\uFE0F\u3010\u7F3A\u5C11 Title \u5E8F\u53F7\u3011\u4E0B\u6E38\u8FDE\u7EBF ${downLinks.length} \u5904\uFF08\u8FDE\u5411\u8282\u70B9 [${downLinks.map((l) => l.targetNodeId).join(", ")}]\uFF09\uFF0C\u6682\u5206\u914D\u7B2C ${finalNum} \u5F20\u3002\u82E5\u9700\u786E\u8BA4\u5EFA\u8BAE\u6267\u884C workflow_read \u7EC6\u770B` : `\u26A0\uFE0F\u3010\u7F3A\u5C11 Title \u5E8F\u53F7\u4E14\u65E0\u8FDE\u7EBF\u3011\u6682\u5206\u914D\u7B2C ${finalNum} \u5F20\uFF0C\u5EFA\u8BAE\u6838\u9A8C`;
        }
        recommendations.push({
          nodeId,
          title,
          classType: node.class_type,
          field: "image",
          current: inputs.image,
          suggested: suggestedPh,
          alt: "",
          isConfigured: isAlreadyConfigured,
          note: noteText
        });
      }
    }
    if (classType.includes("loadaudio")) {
      for (const audKey of ["audio", "audio_path"]) {
        if (audKey in inputs) {
          let matchedNum = null;
          const titleMatch = title.match(/(?:音频|Audio|声音|音)\s*([1-3])/i);
          if (titleMatch) {
            matchedNum = parseInt(titleMatch[1]);
          } else if (typeof inputs[audKey] === "string") {
            const curMatch = inputs[audKey].match(/%音频([1-3])%/);
            if (curMatch) matchedNum = parseInt(curMatch[1]);
          }
          let topologyRole = "";
          let topologyNum = null;
          const downLinks = downstreamMap[nodeId] || [];
          if (!matchedNum && downLinks.length > 0) {
            for (const link of downLinks) {
              const tc = link.targetClassType;
              if (tc.includes("wav2lip") || tc.includes("echomimic") || tc.includes("liveportrait") || tc.includes("lip") || tc.includes("audio")) {
                topologyRole = `\u3010\u62D3\u6251\u63A8\u65AD\u3011\u4E0B\u6E38\u8FDE\u5411\u5BF9\u53E3\u578B/\u97F3\u9891\u9A71\u52A8\u8282\u70B9 [${link.targetNodeId}] ${link.targetTitle}`;
                topologyNum = 1;
                break;
              }
            }
          }
          const finalNum = matchedNum || topologyNum || audioIndex;
          if (!matchedNum && !topologyNum && audioIndex <= 3) audioIndex++;
          const suggestedPh = `%\u97F3\u9891${finalNum}%`;
          const isAlreadyConfigured = inputs[audKey] === suggestedPh;
          let noteText = "";
          if (matchedNum) {
            noteText = `\u3010\u4F9D\u636E Title\u3011\u8282\u70B9\u6807\u9898\u4E3A\u300C${title}\u300D\uFF0C\u7CBE\u786E\u9501\u5B9A\u4E3A %\u97F3\u9891${finalNum}%`;
          } else if (topologyRole) {
            noteText = `${topologyRole}\uFF0C\u63A8\u8350 %\u97F3\u9891${finalNum}%`;
          } else {
            noteText = `\u5206\u914D\u7B2C ${finalNum} \u9996\u97F3\u9891\u6587\u4EF6\u540D`;
          }
          recommendations.push({
            nodeId,
            title,
            classType: node.class_type,
            field: audKey,
            current: inputs[audKey],
            suggested: suggestedPh,
            alt: "",
            isConfigured: isAlreadyConfigured,
            note: noteText
          });
          break;
        }
      }
    }
    if (classType.includes("switch") || classType.includes("bypasser")) {
      for (const swKey of ["select", "switch", "path", "mode"]) {
        if (swKey in inputs) {
          let suggestedPh = "";
          let matchedNote = "";
          const audioMatch = title.match(/(?:音频|Audio)\s*([1-3])/i);
          if (audioMatch) {
            const num = audioMatch[1];
            suggestedPh = `%\u97F3\u9891${num}\u63A7\u5236%`;
            matchedNote = `\u3010\u4F9D\u636E Title\u3011\u8282\u70B9\u6807\u9898\u300C${title}\u300D\u5305\u542B\u97F3\u9891${num}\uFF0C\u7CBE\u786E\u9501\u5B9A\u4E3A %\u97F3\u9891${num}\u63A7\u5236%`;
          } else {
            const imgMatch = title.match(/(?:图片|图像|Image|图)\s*([1-9])/i);
            if (imgMatch) {
              const num = imgMatch[1];
              suggestedPh = `%\u56FE\u7247${num}\u63A7\u5236%`;
              matchedNote = `\u3010\u4F9D\u636E Title\u3011\u8282\u70B9\u6807\u9898\u300C${title}\u300D\u5305\u542B\u56FE\u7247${num}\uFF0C\u7CBE\u786E\u9501\u5B9A\u4E3A %\u56FE\u7247${num}\u63A7\u5236%`;
            }
          }
          if (!suggestedPh && typeof inputs[swKey] === "string") {
            const curMatch = inputs[swKey].match(/%(图片[1-9]控制|音频[1-3]控制)%/);
            if (curMatch) {
              suggestedPh = `%${curMatch[1]}%`;
              matchedNote = `\u3010\u4F9D\u636E\u73B0\u6709\u5360\u4F4D\u7B26\u3011\u4FDD\u7559\u5F53\u524D\u8BBE\u5B9A\u7684 ${suggestedPh}`;
            }
          }
          if (suggestedPh) {
            const isAlreadyConfigured = inputs[swKey] === suggestedPh;
            recommendations.push({
              nodeId,
              title,
              classType: node.class_type,
              field: swKey,
              current: inputs[swKey],
              suggested: suggestedPh,
              alt: "",
              isConfigured: isAlreadyConfigured,
              note: `${matchedNote}\uFF08\u6A21\u5F0F\u503C\uFF1A0 \u5F00\u542F, 4 Bypass\u8DF3\u8FC7, 2 Mute\u505C\u7528\uFF09`
            });
            break;
          }
        }
      }
    }
  }
  let report = `\u{1F4CA} [${targetLabel}] \u5DE5\u4F5C\u6D41\u7ED3\u6784\u667A\u80FD\u5206\u6790\u62A5\u544A${workflowName ? `: "${workflowName}"` : ""}
`;
  report += `\u603B\u8282\u70B9\u6570: ${nodeIds.length} \u4E2A  |  \u540E\u7AEF\u7C7B\u578B: ${targetLabel}
`;
  report += "\u2500".repeat(65) + "\n";
  if (existingPlaceholders.size > 0) {
    report += `\u5DF2\u5B58\u5728\u7684\u5360\u4F4D\u7B26 (${existingPlaceholders.size} \u4E2A):
`;
    report += `  ${Array.from(existingPlaceholders).join(", ")}

`;
  } else {
    report += `\u672A\u53D1\u73B0\u4EFB\u4F55\u5360\u4F4D\u7B26\uFF08\u5F53\u524D\u4E3A\u9759\u6001\u539F\u751F\u5DE5\u4F5C\u6D41\uFF09\u3002

`;
  }
  const configuredItems = recommendations.filter((r) => r.isConfigured);
  const pendingItems = recommendations.filter((r) => !r.isConfigured);
  if (configuredItems.length > 0) {
    report += `\u2705 \u5DF2\u6B63\u786E\u914D\u7F6E\u5360\u4F4D\u7B26\u7684\u8282\u70B9 (${configuredItems.length} \u5904\uFF0C\u4FDD\u6301\u4E0D\u53D8\u65E0\u9700\u4FEE\u6539):
`;
    configuredItems.forEach((r) => {
      report += `  \u2022 [\u8282\u70B9 ${r.nodeId}] \u6807\u9898: "${r.title}" (${r.classType})
`;
      report += `    \u5B57\u6BB5: "${r.field}" = "${r.current}" \u2014 ${r.note}
`;
    });
    report += "\n";
  }
  if (pendingItems.length === 0) {
    report += `\u{1F389} \u6240\u6709\u6838\u5FC3\u52A8\u6001\u8282\u70B9\u5747\u5DF2\u6B63\u786E\u914D\u7F6E\u4E3A\u6807\u51C6\u5360\u4F4D\u7B26\uFF0C\u65E0\u9700\u989D\u5916\u4FEE\u6539\uFF01
`;
  } else {
    report += `\u{1F3AF} \u5F85\u66FF\u6362\u4E3A\u5360\u4F4D\u7B26\u7684\u8282\u70B9 (${pendingItems.length} \u5904):
`;
    pendingItems.forEach((r, idx) => {
      report += `  ${idx + 1}. [\u8282\u70B9 ${r.nodeId}] \u6807\u9898: "${r.title}" (${r.classType})
`;
      report += `     \u5B57\u6BB5: "${r.field}"  \u5F53\u524D\u503C: ${JSON.stringify(r.current)}
`;
      report += `     \u{1F449} \u5EFA\u8BAE\u5360\u4F4D\u7B26: "${r.suggested}"${r.alt ? ` (\u6216 ${r.alt})` : ""}
`;
      report += `     \u{1F4CC} \u5339\u914D\u4F9D\u636E: ${r.note}
`;
    });
    if (workflowName) {
      report += `
\u{1F6E0}\uFE0F \u4E00\u952E\u6279\u91CF\u66F4\u65B0\u793A\u4F8B\uFF08\u4EC5\u66F4\u65B0\u5F85\u66FF\u6362\u9879\uFF09:
`;
      const sampleUpdates = pendingItems.map((r) => ({
        nodeId: r.nodeId,
        inputKey: r.field,
        value: r.suggested
      }));
      report += `<SystemQuery>{"type": "workflow_batch_update", "target": "${target}", "name": "${workflowName}", "updates": ${JSON.stringify(sampleUpdates)}}</SystemQuery>
`;
    }
  }
  const hasUncertainNodes = recommendations.some((r) => r.note && r.note.includes("\u26A0\uFE0F\u3010\u7F3A\u5C11 Title \u5E8F\u53F7\u3011"));
  if (hasUncertainNodes || !workflowName) {
    report += `
\u{1F4A1} \u62D3\u6251\u7814\u5224\u5EFA\u8BAE\uFF1A\u82E5\u90E8\u5206\u591A\u6A21\u6001\u8282\u70B9\u56E0\u672A\u547D\u540D Title \u5E8F\u53F7\u800C\u65E0\u6CD5\u5B8C\u5168\u65AD\u5B9A\u7528\u9014\uFF0C\u5EFA\u8BAE\u6267\u884C\u5B8C\u6574\u8BFB\u53D6\u67E5\u9A8C\u4E0B\u6E38\u8FDE\u7EBF\uFF0C\u6216\u5411\u7528\u6237\u786E\u8BA4\u5176\u901A\u9053\u7528\u9014\uFF1A
`;
    if (workflowName) {
      report += `<SystemQuery>{"type": "workflow_read", "target": "${target}", "name": "${workflowName}"}</SystemQuery>
`;
    }
  }
  return report;
}

export { addWorkflowNode, analyzeWorkflow, batchUpdateWorkflowNodes, deleteWorkflowNode, getWorkflowList, listWorkflowNodes, readWorkflow, readWorkflowNode, replaceWorkflowVariable, saveWorkflow, scanWorkflowVariables, updateWorkflowNodeInput };
