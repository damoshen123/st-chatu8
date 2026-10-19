// 还原自打包产物 — 原始模块: utils/settings/worker.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { configDatabase_exports } from "../utils.js";
import { stylInput, stylishConfirm } from "../ui_common.js";

var PLACEHOLDER_MAP;

PLACEHOLDER_MAP = [
      { placeholder: "%seed%", label: "\u79CD\u5B50 (seed)", matchKeys: ["seed"], type: "number" },
      { placeholder: "%steps%", label: "\u6B65\u6570 (steps)", matchKeys: ["steps"], type: "number" },
      { placeholder: "%cfg_scale%", label: "CFG (cfg)", matchKeys: ["cfg", "cfg_scale"], type: "number" },
      { placeholder: "%sampler_name%", label: "\u91C7\u6837\u5668 (sampler)", matchKeys: ["sampler_name", "sampler"], type: "string" },
      { placeholder: "%scheduler%", label: "\u8C03\u5EA6\u5668 (scheduler)", matchKeys: ["scheduler"], type: "string" },
      { placeholder: "%width%", label: "\u5BBD\u5EA6 (width)", matchKeys: ["width"], type: "number" },
      { placeholder: "%height%", label: "\u9AD8\u5EA6 (height)", matchKeys: ["height"], type: "number" },
      { placeholder: "%prompt%", label: "\u6B63\u9762\u63D0\u793A\u8BCD (prompt)", matchKeys: ["positive", "text"], type: "string" },
      { placeholder: "%negative_prompt%", label: "\u8D1F\u9762\u63D0\u793A\u8BCD (negative)", matchKeys: ["negative"], type: "string" },
      { placeholder: "%MODEL_NAME%", label: "\u6A21\u578B (ckpt_name)", matchKeys: ["ckpt_name"], type: "string" },
      { placeholder: "%vae%", label: "VAE", matchKeys: ["vae_name", "vae"], type: "string" },
      { placeholder: "%clip%", label: "CLIP", matchKeys: ["clip_name"], type: "string" },
      { placeholder: "%c_quanzhong%", label: "IPA\u6743\u91CD", matchKeys: ["c_quanzhong"], type: "number" },
      { placeholder: "%c_idquanzhong%", label: "FaceID\u6743\u91CD", matchKeys: ["c_idquanzhong"], type: "number" },
      { placeholder: "%c_xijie%", label: "\u7EC6\u8282\u5F3A\u5EA6", matchKeys: ["c_xijie"], type: "number" },
      { placeholder: "%c_fenwei%", label: "\u6C1B\u56F4\u5F3A\u5EA6", matchKeys: ["c_fenwei"], type: "number" },
      { placeholder: "%comfyuicankaotupian%", label: "\u53C2\u8003\u56FE", matchKeys: ["comfyuicankaotupian", "image"], type: "string" },
      { placeholder: "%ipa%", label: "IPA\u7C7B\u578B", matchKeys: ["ipa"], type: "string" },
      // 局部重绘占位符
      { placeholder: "%inpaint_image%", label: "\u91CD\u7ED8\u539F\u56FE", matchKeys: ["inpaint_image"], type: "string" },
      { placeholder: "%inpaint_mask%", label: "\u91CD\u7ED8\u906E\u7F69", matchKeys: ["inpaint_mask"], type: "string" },
      { placeholder: "%inpaint_denoise%", label: "\u91CD\u7ED8\u5F3A\u5EA6", matchKeys: ["inpaint_denoise", "denoise"], type: "number" },
      { placeholder: "%inpaint_positive%", label: "\u91CD\u7ED8\u6B63\u9762\u63D0\u793A\u8BCD", matchKeys: ["inpaint_positive"], type: "string" },
      { placeholder: "%inpaint_negative%", label: "\u91CD\u7ED8\u8D1F\u9762\u63D0\u793A\u8BCD", matchKeys: ["inpaint_negative"], type: "string" }
    ];

function eidtJSON(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        eidtJSON(obj[key]);
      } else {
        if (key.includes("seed")) {
          obj[key] = "%seed%";
        }
        if (key == "steps") {
          obj[key] = "%steps%";
        }
        if (key == "cfg") {
          obj[key] = "%cfg_scale%";
        }
        if (key == "sampler_name") {
          obj[key] = "%sampler_name%";
        }
        if (key == "width") {
          obj[key] = "%width%";
        }
        if (key == "height") {
          obj[key] = "%height%";
        }
        if (key == "ckpt_name") {
          obj[key] = "%MODEL_NAME%";
        }
        if (key == "positive") {
          obj[key] = "%prompt%";
        }
        if (key == "negative") {
          obj[key] = "%negative_prompt%";
        }
        if (key == "text" && obj[key] == "\u6B63\u9762") {
          obj[key] = "%prompt%";
        }
        if (key == "text" && obj[key] == "\u8D1F\u9762") {
          obj[key] = "%negative_prompt%";
        }
      }
    }
  }
  return obj;
}

function eidtwork() {
  alert("\u8BF7\u5728\u5BFC\u51FA\u65F6\u8BBE\u7F6E\u4E3A\u6B63\u9762\u63D0\u793A\u8BCD\u201C\u6B63\u9762\u201D\uFF0C\u8D1F\u9762\u8BBE\u7F6E\u4E3A\u201D\u8D1F\u9762\u201D\uFF0C\u60C5\u51B5\u590D\u6742\uFF0C\u4E0D\u4FDD\u8BC1\u53EF\u7528\u6027\u3002\u4F1A\u7B80\u6613\u7684\u66FF\u6362\uFF1A\u6A21\u578B\u540D\u79F0\u3001\u63D0\u793A\u8BCD\u3001\u6B65\u6570\u3001cfg\u3001\u91C7\u6837\u5668\u3001\u5BBD\u5EA6\u3001\u9AD8\u5EA6\u3001seed\u3002");
  let el = document.getElementById("worker");
  try {
    let textrejsons = JSON.parse(el.value.trim());
    textrejsons = eidtJSON(textrejsons);
    el.value = JSON.stringify(textrejsons, null, 2);
  } catch (e) {
    alert("\u8BF7\u8F93\u5165\u6B63\u786E\u7684json" + e);
  }
}

function checkNodeSkippable(nodeId, workflow, connections, objectInfo = {}) {
  const inputConnections = connections.filter((c) => c.to === nodeId);
  const validInputConnections = inputConnections.filter((c) => {
    const sourceNode = workflow[c.from];
    return sourceNode && !sourceNode._skip;
  });
  const outputConnections = connections.filter((c) => c.from === nodeId);
  const validOutputConnections = outputConnections.filter((c) => {
    const targetNode = workflow[c.to];
    return targetNode && !targetNode._skip;
  });
  if (validInputConnections.length <= 1) {
    return {
      canSkip: true,
      supportsTypeMatch: false
    };
  }
  const node = workflow[nodeId];
  const hasObjectInfo = objectInfo && Object.keys(objectInfo).length > 0 && node && objectInfo[node.class_type];
  if (hasObjectInfo) {
    const inputTypes = /* @__PURE__ */ new Set();
    for (const conn of validInputConnections) {
      const sourceNode = workflow[conn.from];
      if (sourceNode) {
        const sourceTypeInfo = objectInfo[sourceNode.class_type];
        if (sourceTypeInfo && sourceTypeInfo.output && sourceTypeInfo.output[conn.fromOutput]) {
          inputTypes.add(sourceTypeInfo.output[conn.fromOutput]);
        }
      }
    }
    if (inputTypes.size === validInputConnections.length) {
      return {
        canSkip: true,
        supportsTypeMatch: true,
        reason: `\u652F\u6301\u7C7B\u578B\u5339\u914D\uFF1A${validInputConnections.length} \u4E2A\u4E0D\u540C\u7C7B\u578B\u7684\u8F93\u5165`
      };
    }
  }
  return {
    canSkip: false,
    reason: `\u6B64\u8282\u70B9\u6709 ${validInputConnections.length} \u4E2A\u8F93\u5165\u8FDE\u63A5${hasObjectInfo ? "\uFF08\u542B\u76F8\u540C\u7C7B\u578B\uFF09" : ""}\uFF0C\u8DF3\u8FC7\u540E\u65E0\u6CD5\u81EA\u52A8\u786E\u5B9A\u8FDE\u7EBF\u8D70\u5411\uFF0C\u56E0\u6B64\u6682\u4E0D\u652F\u6301\u8DF3\u8FC7`
  };
}

function processSkippedNodes(workflow, objectInfo = {}) {
  const processedWorkflow = JSON.parse(JSON.stringify(workflow));
  const skippedNodeIds = Object.keys(processedWorkflow).filter((id) => processedWorkflow[id]._skip);
  if (skippedNodeIds.length === 0) {
    for (const nodeId of Object.keys(processedWorkflow)) {
      delete processedWorkflow[nodeId]._skip;
    }
    return processedWorkflow;
  }
  const getOutputType = (nodeId, outputIndex) => {
    const node = processedWorkflow[nodeId];
    if (!node) return null;
    const nodeTypeInfo = objectInfo[node.class_type];
    if (nodeTypeInfo && nodeTypeInfo.output && nodeTypeInfo.output[outputIndex]) {
      return nodeTypeInfo.output[outputIndex];
    }
    return null;
  };
  const getInputType = (nodeId, inputKey) => {
    const node = processedWorkflow[nodeId];
    if (!node) return null;
    const nodeTypeInfo = objectInfo[node.class_type];
    if (!nodeTypeInfo) return null;
    const allInputs = { ...nodeTypeInfo.input?.required, ...nodeTypeInfo.input?.optional };
    const inputDef = allInputs[inputKey];
    if (Array.isArray(inputDef) && inputDef[0]) {
      return typeof inputDef[0] === "string" ? inputDef[0] : null;
    }
    return null;
  };
  const inputSourceMap = {};
  for (const skippedId of skippedNodeIds) {
    const skippedNode = processedWorkflow[skippedId];
    inputSourceMap[skippedId] = {};
    for (const [inputKey, inputValue] of Object.entries(skippedNode.inputs || {})) {
      if (Array.isArray(inputValue) && inputValue.length === 2 && typeof inputValue[0] === "string") {
        let sourceId = inputValue[0];
        let sourceOutput = inputValue[1];
        const visited = /* @__PURE__ */ new Set();
        while (skippedNodeIds.includes(sourceId) && !visited.has(sourceId)) {
          visited.add(sourceId);
          const sourceNode = processedWorkflow[sourceId];
          let found = false;
          for (const [srcInputKey, srcInputValue] of Object.entries(sourceNode.inputs || {})) {
            if (Array.isArray(srcInputValue) && srcInputValue.length === 2 && typeof srcInputValue[0] === "string") {
              sourceId = srcInputValue[0];
              sourceOutput = srcInputValue[1];
              found = true;
              break;
            }
          }
          if (!found) break;
        }
        if (!skippedNodeIds.includes(sourceId)) {
          const outputType = getOutputType(sourceId, sourceOutput);
          inputSourceMap[skippedId][inputKey] = {
            from: sourceId,
            fromOutput: sourceOutput,
            outputType
          };
        }
      }
    }
  }
  for (const nodeId of Object.keys(processedWorkflow)) {
    if (skippedNodeIds.includes(nodeId)) continue;
    const node = processedWorkflow[nodeId];
    for (const [inputKey, inputValue] of Object.entries(node.inputs || {})) {
      if (Array.isArray(inputValue) && inputValue.length === 2 && typeof inputValue[0] === "string") {
        let sourceId = inputValue[0];
        const sourceOutput = inputValue[1];
        if (skippedNodeIds.includes(sourceId)) {
          const skipNodeSources = inputSourceMap[sourceId];
          if (skipNodeSources && Object.keys(skipNodeSources).length > 0) {
            const expectedType = getInputType(nodeId, inputKey);
            let bestMatch = null;
            for (const [srcKey, srcInfo] of Object.entries(skipNodeSources)) {
              if (expectedType && srcInfo.outputType && srcInfo.outputType === expectedType) {
                bestMatch = srcInfo;
                break;
              }
            }
            if (!bestMatch) {
              const firstSource = Object.values(skipNodeSources)[0];
              if (firstSource) {
                bestMatch = firstSource;
              }
            }
            if (bestMatch) {
              node.inputs[inputKey] = [bestMatch.from, bestMatch.fromOutput];
            }
          }
        }
      }
    }
  }
  for (const skippedId of skippedNodeIds) {
    delete processedWorkflow[skippedId];
  }
  for (const nodeId of Object.keys(processedWorkflow)) {
    delete processedWorkflow[nodeId]._skip;
  }
  return processedWorkflow;
}

function getRecommendedPlaceholder(inputName) {
  const lowerName = inputName.toLowerCase();
  for (const item of PLACEHOLDER_MAP) {
    for (const key of item.matchKeys) {
      if (lowerName === key.toLowerCase() || lowerName.includes(key.toLowerCase())) {
        return item.placeholder;
      }
    }
  }
  return null;
}

function wrapWithPlaceholderButton(inputElement, inputName, onChange, defaultValue = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "st-chatu8-workflow-viz-input-wrapper";
  wrapper.appendChild(inputElement);
  const placeholderBtn = document.createElement("button");
  placeholderBtn.type = "button";
  placeholderBtn.className = "st-chatu8-placeholder-btn";
  placeholderBtn.innerHTML = '<i class="fa-solid fa-code"></i>';
  placeholderBtn.title = "\u66FF\u6362\u4E3A\u5360\u4F4D\u7B26";
  const recommendedPlaceholder = getRecommendedPlaceholder(inputName);
  placeholderBtn.onclick = (e) => {
    e.stopPropagation();
    showPlaceholderMenu(e.target.closest("button"), inputElement, inputName, recommendedPlaceholder, onChange, defaultValue);
  };
  wrapper.appendChild(placeholderBtn);
  return wrapper;
}

function showPlaceholderMenu(buttonElement, inputElement, inputName, recommendedPlaceholder, onChange, defaultValue = "") {
  if (!buttonElement) return;
  const existingMenu = document.querySelector(".st-chatu8-placeholder-menu");
  if (existingMenu) existingMenu.remove();
  const menu = document.createElement("div");
  menu.className = "st-chatu8-placeholder-menu";
  PLACEHOLDER_MAP.forEach((item) => {
    const menuItem = document.createElement("div");
    menuItem.className = "st-chatu8-placeholder-menu-item";
    if (item.placeholder === recommendedPlaceholder) {
      menuItem.classList.add("recommended");
    }
    menuItem.innerHTML = `
            <span class="placeholder-code">${item.placeholder}</span>
            <span class="placeholder-label">${item.label}</span>
        `;
    menuItem.onclick = () => {
      const wrapper = inputElement.closest(".st-chatu8-workflow-viz-input-wrapper");
      if (inputElement.tagName === "SELECT" || inputElement.tagName === "INPUT" && inputElement.type === "number") {
        const newInput = document.createElement("input");
        newInput.type = "text";
        newInput.value = item.placeholder;
        newInput.className = inputElement.className;
        newInput.onchange = () => onChange(newInput.value);
        if (wrapper) {
          wrapper.replaceChild(newInput, inputElement);
          inputElement = newInput;
        } else {
          inputElement.parentNode.replaceChild(newInput, inputElement);
        }
      } else if (inputElement.tagName === "INPUT" || inputElement.tagName === "TEXTAREA") {
        inputElement.value = item.placeholder;
      }
      onChange(item.placeholder);
      menu.remove();
    };
    menu.appendChild(menuItem);
  });
  const clearItem = document.createElement("div");
  clearItem.className = "st-chatu8-placeholder-menu-item st-chatu8-placeholder-clear";
  clearItem.innerHTML = `
        <span class="placeholder-code" style="color: #e74c3c;">\u{1F5D1}\uFE0F \u6E05\u9664\u5360\u4F4D\u7B26</span>
        <span class="placeholder-label">\u6062\u590D\u4E3A\u9ED8\u8BA4\u503C${defaultValue ? ": " + defaultValue : ""}</span>
    `;
  clearItem.onclick = () => {
    if (inputElement.tagName === "INPUT" || inputElement.tagName === "TEXTAREA") {
      inputElement.value = defaultValue;
      onChange(defaultValue);
    }
    menu.remove();
  };
  menu.appendChild(clearItem);
  const btnRect = buttonElement.getBoundingClientRect();
  const menuWidth = 220;
  const menuHeight = 350;
  let left = btnRect.left;
  let top = btnRect.bottom + 5;
  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - 10;
  }
  if (left < 10) {
    left = 10;
  }
  if (top + menuHeight > window.innerHeight) {
    top = btnRect.top - menuHeight - 5;
    if (top < 10) top = 10;
  }
  menu.style.position = "fixed";
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.maxWidth = `${window.innerWidth - 20}px`;
  document.body.appendChild(menu);
  const closeHandler = (e) => {
    if (!menu.contains(e.target) && e.target !== buttonElement) {
      menu.remove();
      document.removeEventListener("click", closeHandler);
    }
  };
  setTimeout(() => document.addEventListener("click", closeHandler), 0);
}

function worker_change() {
  const settings3 = extension_settings[extensionName];
  const worker = document.getElementById("worker");
  const selectElement = document.getElementById("workerid");
  settings3["workerid"] = selectElement.value;
  settings3.worker = settings3.workers[settings3.workerid];
  saveSettingsDebounced();
  worker.value = settings3["workers"][settings3["workerid"]];
  $(worker).trigger("input");
}

function worker_new() {
  const settings3 = extension_settings[extensionName];
  stylInput("\u8BF7\u8F93\u5165\u65B0\u5DE5\u4F5C\u6D41\u9884\u8BBE\u7684\u540D\u79F0").then((newName) => {
    if (newName && newName.trim() !== "") {
      if (settings3.workers.hasOwnProperty(newName)) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      const selectElement = document.getElementById("workerid");
      let newOption = new Option(newName, newName);
      newOption.title = newName;
      selectElement.add(newOption);
      const editSelectElement = document.getElementById("editWorkerid");
      if (editSelectElement) {
        let editOption = new Option(newName, newName);
        editOption.title = newName;
        editSelectElement.add(editOption);
      }
      selectElement.value = newName;
      settings3.workerid = newName;
      settings3.workers[newName] = "";
      settings3.worker = "";
      const worker = document.getElementById("worker");
      worker.value = "";
      saveSettingsDebounced();
      toastr.success(`\u5DF2\u521B\u5EFA\u7A7A\u9884\u8BBE "${newName}"`);
    }
  });
}

function worker_rename() {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.workerid;
  if (["\u9ED8\u8BA4", "\u9ED8\u8BA4\u4EBA\u7269\u4E00\u81F4", "\u9762\u90E8\u7EC6\u5316", "\u65B0\u7248\u9ED8\u8BA4", "\u9ED8\u8BA4-\u72EC\u7ACBVAE", "\u65B0weilin-vae"].includes(currentName) || !settings3.workers[currentName]) {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u6216\u4E0D\u5B58\u5728\u7684\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u5DE5\u4F5C\u6D41\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.workers.hasOwnProperty(newName)) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.workers[newName] = settings3.workers[currentName];
      delete settings3.workers[currentName];
      settings3.workerid = newName;
      if (settings3.editWorkerid === currentName) {
        settings3.editWorkerid = newName;
      }
      saveSettingsDebounced();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
      toastr.success(`\u5DE5\u4F5C\u6D41\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function worker_save() {
  const settings3 = extension_settings[extensionName];
  stylInput("\u8BF7\u8F93\u5165\u914D\u7F6E\u540D\u79F0").then((result) => {
    if (result) {
      const worker = document.getElementById("worker");
      const selectElement = document.getElementById("workerid");
      let newOption = new Option(result, result);
      newOption.title = result;
      if (!settings3.workers.hasOwnProperty(result)) {
        selectElement.add(newOption);
      }
      selectElement.value = result;
      settings3.workerid = result;
      settings3.workers[result] = worker.value;
      settings3.worker = worker.value;
      saveSettingsDebounced();
    }
  });
}

function worker_delete() {
  const settings3 = extension_settings[extensionName];
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664").then((result) => {
    if (result) {
      const worker = document.getElementById("worker");
      const selectElement = document.getElementById("workerid");
      const valueToDelete = selectElement.value;
      if (valueToDelete === "\u9ED8\u8BA4" || valueToDelete === "\u9ED8\u8BA4\u4EBA\u7269\u4E00\u81F4" || valueToDelete === "\u9762\u90E8\u7EC6\u5316") {
        alert("\u9ED8\u8BA4\u914D\u7F6E\u4E0D\u80FD\u5220\u9664");
        return;
      }
      Reflect.deleteProperty(settings3["workers"], valueToDelete);
      selectElement.remove(selectElement.selectedIndex);
      selectElement.value = "\u9ED8\u8BA4";
      settings3.workerid = "\u9ED8\u8BA4";
      settings3.worker = settings3["workers"][settings3["workerid"]];
      worker.value = settings3["workers"][settings3["workerid"]];
      saveSettingsDebounced();
    }
  });
}

function worker_update() {
  const settings3 = extension_settings[extensionName];
  const presetName = settings3.workerid;
  if (!presetName || !settings3.workers[presetName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684\u5DE5\u4F5C\u6D41\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148\u201C\u53E6\u5B58\u4E3A\u201D\u4E00\u4E2A\u65B0\u5DE5\u4F5C\u6D41\u3002");
    return;
  }
  if (["\u9ED8\u8BA4", "\u9ED8\u8BA4\u4EBA\u7269\u4E00\u81F4", "\u9762\u90E8\u7EC6\u5316"].includes(presetName)) {
    alert(`\u9ED8\u8BA4\u5DE5\u4F5C\u6D41 "${presetName}" \u4E0D\u80FD\u88AB\u4FEE\u6539\u3002\u8BF7\u4F7F\u7528\u201C\u53E6\u5B58\u4E3A\u201D\u521B\u5EFA\u4E00\u4E2A\u526F\u672C\u3002`);
    return;
  }
  stylishConfirm(`\u786E\u5B9A\u8981\u8986\u76D6\u5F53\u524D\u5DE5\u4F5C\u6D41 "${presetName}" \u5417\uFF1F`).then((confirmed) => {
    if (confirmed) {
      const workerValue = document.getElementById("worker").value;
      settings3.workers[presetName] = workerValue;
      if (settings3.workerid === presetName) {
        settings3.worker = workerValue;
      }
      saveSettingsDebounced();
    }
  });
}

function worker_export_current() {
  const settings3 = extension_settings[extensionName];
  const selectedId = settings3.workerid;
  if (!selectedId || !settings3.workers[selectedId]) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u5DE5\u4F5C\u6D41\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const dataToExport = { [selectedId]: settings3.workers[selectedId] };
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-workflow-${selectedId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function worker_export_all() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.workers || Object.keys(settings3.workers).length === 0) {
    alert("\u6CA1\u6709\u5DE5\u4F5C\u6D41\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const dataStr = JSON.stringify(settings3.workers, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "st-chatu8-workflows-all.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isComfyUIFullWorkflow(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }
  if (data.hasOwnProperty("nodes") && Array.isArray(data.nodes)) {
    if (data.nodes.length > 0 && data.nodes.some((node) => node && node.type)) {
      return true;
    }
  }
  return false;
}

function isRawComfyUIWorkflow(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return false;
  }
  let hasClassType = false;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if (value.hasOwnProperty("class_type")) {
        hasClassType = true;
      }
    } else if (typeof value === "string") {
      return false;
    }
  }
  return hasClassType;
}

async function worker_import() {
  const settings3 = extension_settings[extensionName];
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        const importedData = JSON.parse(readerEvent.target.result);
        if (isComfyUIFullWorkflow(importedData)) {
          alert("\u68C0\u6D4B\u5230ComfyUI\u5B8C\u6574\u5DE5\u4F5C\u6D41\u683C\u5F0F\uFF08\u5305\u542BUI\u4FE1\u606F\uFF09\u3002\n\n\u8BF7\u5728ComfyUI\u4E2D\u6253\u5F00\u6B64\u5DE5\u4F5C\u6D41\uFF0C\u7136\u540E\u5BFC\u51FA\u4E3AAPI\u683C\u5F0F\u540E\u518D\u5BFC\u5165\u3002\n\n");
          return;
        }
        if (isRawComfyUIWorkflow(importedData)) {
          const defaultName = file.name.replace(/\.json$/i, "") || "\u5BFC\u5165\u7684\u5DE5\u4F5C\u6D41";
          const workflowName = await stylInput(`\u68C0\u6D4B\u5230\u539F\u59CBComfyUI API\u5DE5\u4F5C\u6D41\uFF0C\u8BF7\u4E3A\u5176\u547D\u540D\uFF1A`, defaultName);
          if (workflowName && workflowName.trim()) {
            const name = workflowName.trim();
            const workflowData = JSON.stringify(importedData, null, 2);
            const isNew = !settings3.workers.hasOwnProperty(name);
            settings3.workers[name] = workflowData;
            const selectElement = document.getElementById("workerid");
            if (selectElement && isNew) {
              const newOption = new Option(name, name);
              newOption.title = name;
              selectElement.add(newOption);
            }
            selectElement.value = name;
            settings3.workerid = name;
            settings3.worker = workflowData;
            const editSelectElement = document.getElementById("editWorkerid");
            if (editSelectElement && isNew) {
              const editOption = new Option(name, name);
              editOption.title = name;
              editSelectElement.add(editOption);
            }
            const workerTextarea = document.getElementById("worker");
            if (workerTextarea) {
              workerTextarea.value = workflowData;
            }
            saveSettingsDebounced();
            alert(`\u6210\u529F\u5BFC\u5165\u539F\u59CBComfyUI\u5DE5\u4F5C\u6D41\uFF0C\u5DF2\u4FDD\u5B58\u4E3A: "${name}"`);
          } else {
            alert("\u5BFC\u5165\u5DF2\u53D6\u6D88\u3002");
          }
        } else {
          let newWorkflowsCount = 0;
          const selectElement = document.getElementById("workerid");
          const editSelectElement = document.getElementById("editWorkerid");
          for (const key in importedData) {
            if (importedData.hasOwnProperty(key)) {
              const workflowData = typeof importedData[key] === "string" ? importedData[key] : JSON.stringify(importedData[key], null, 2);
              const isNew = !settings3.workers.hasOwnProperty(key);
              if (isNew) {
                newWorkflowsCount++;
                if (selectElement) {
                  const newOption = new Option(key, key);
                  newOption.title = key;
                  selectElement.add(newOption);
                }
                if (editSelectElement) {
                  const editOption = new Option(key, key);
                  editOption.title = key;
                  editSelectElement.add(editOption);
                }
              }
              settings3.workers[key] = workflowData;
            }
          }
          saveSettingsDebounced();
          alert(`\u6210\u529F\u5BFC\u5165 ${Object.keys(importedData).length} \u4E2A\u5DE5\u4F5C\u6D41\uFF0C\u5176\u4E2D ${newWorkflowsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`);
        }
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002");
        console.error("Error importing workflows:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function renderNodeProperties(panel, node, workflow, objectInfo, connections, onUpdate, onSkipChange) {
  const nodeTypeInfo = objectInfo[node.classType] || {};
  const inputDefs = nodeTypeInfo.input || {};
  const requiredInputs = inputDefs.required || {};
  const optionalInputs = inputDefs.optional || {};
  const displayName = node.meta.title || node.classType;
  const skipCheck = checkNodeSkippable(node.id, workflow, connections, objectInfo);
  const isSkipped = workflow[node.id]._skip === true;
  panel.innerHTML = `
        <div class="st-chatu8-workflow-viz-properties-header">
            <h4>${displayName}</h4>
            <span class="node-id">#${node.id} \xB7 ${node.classType}</span>
        </div>
        <div class="st-chatu8-workflow-viz-skip-section" id="viz-skip-section"></div>
        <div class="st-chatu8-workflow-viz-properties-content" id="viz-properties-inputs"></div>
    `;
  const skipSection = panel.querySelector("#viz-skip-section");
  const skipGroup = document.createElement("div");
  skipGroup.className = "st-chatu8-workflow-viz-skip-group";
  const skipLabel = document.createElement("label");
  skipLabel.className = "st-chatu8-workflow-viz-skip-label";
  const skipCheckbox = document.createElement("input");
  skipCheckbox.type = "checkbox";
  skipCheckbox.checked = isSkipped;
  skipCheckbox.disabled = !skipCheck.canSkip && !isSkipped;
  const skipText = document.createElement("span");
  skipText.textContent = "\u8DF3\u8FC7\u6B64\u8282\u70B9";
  skipLabel.appendChild(skipCheckbox);
  skipLabel.appendChild(skipText);
  skipGroup.appendChild(skipLabel);
  const skipStatus = document.createElement("div");
  skipStatus.className = "st-chatu8-workflow-viz-skip-status";
  if (!skipCheck.canSkip && !isSkipped) {
    skipStatus.className += " not-skippable";
    skipStatus.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${skipCheck.reason}`;
  } else if (isSkipped) {
    skipStatus.className += " skipped";
    const typeMatchNote = skipCheck.supportsTypeMatch ? "\uFF08\u7C7B\u578B\u5339\u914D\uFF09" : "";
    skipStatus.innerHTML = `<i class="fa-solid fa-forward"></i> \u8282\u70B9\u5C06\u88AB\u8DF3\u8FC7\uFF0C\u6267\u884C\u65F6\u5C06\u91CD\u6620\u5C04\u8FDE\u63A5${typeMatchNote}`;
  } else if (skipCheck.supportsTypeMatch) {
    skipStatus.className += " can-skip type-match";
    skipStatus.innerHTML = `<i class="fa-solid fa-check-double"></i> ${skipCheck.reason}`;
  } else {
    skipStatus.className += " can-skip";
    skipStatus.innerHTML = '<i class="fa-solid fa-check"></i> \u53EF\u4EE5\u8DF3\u8FC7';
  }
  skipGroup.appendChild(skipStatus);
  skipSection.appendChild(skipGroup);
  skipCheckbox.onchange = () => {
    workflow[node.id]._skip = skipCheckbox.checked;
    if (onSkipChange) onSkipChange(node.id, skipCheckbox.checked);
    if (onUpdate) onUpdate();
    renderNodeProperties(panel, node, workflow, objectInfo, connections, onUpdate, onSkipChange);
  };
  const inputsContainer = panel.querySelector("#viz-properties-inputs");
  const allInputDefs = { ...requiredInputs, ...optionalInputs };
  for (const [inputName, inputDef] of Object.entries(allInputDefs)) {
    const currentValue = node.inputs[inputName];
    const isConnection = Array.isArray(currentValue) && currentValue.length === 2 && typeof currentValue[0] === "string";
    const group = document.createElement("div");
    group.className = "st-chatu8-workflow-viz-property-group";
    const label = document.createElement("label");
    label.textContent = inputName;
    if (isConnection) {
      const badge = document.createElement("span");
      badge.className = "connection-badge";
      badge.textContent = "\u8FDE\u63A5";
      label.appendChild(badge);
    }
    group.appendChild(label);
    if (isConnection) {
      const connectionDisplay = document.createElement("div");
      connectionDisplay.className = "connection-display";
      connectionDisplay.textContent = `\u2190 \u8282\u70B9 #${currentValue[0]} \u8F93\u51FA ${currentValue[1]}`;
      group.appendChild(connectionDisplay);
    } else {
      const control = createInputControl(inputName, inputDef, currentValue, (newValue) => {
        workflow[node.id].inputs[inputName] = newValue;
        node.inputs[inputName] = newValue;
        if (onUpdate) onUpdate();
      });
      group.appendChild(control);
    }
    inputsContainer.appendChild(group);
  }
  if (Object.keys(allInputDefs).length === 0 && Object.keys(node.inputs).length > 0) {
    for (const [inputName, currentValue] of Object.entries(node.inputs)) {
      const isConnection = Array.isArray(currentValue) && currentValue.length === 2 && typeof currentValue[0] === "string";
      const group = document.createElement("div");
      group.className = "st-chatu8-workflow-viz-property-group";
      const label = document.createElement("label");
      label.textContent = inputName;
      if (isConnection) {
        const badge = document.createElement("span");
        badge.className = "connection-badge";
        badge.textContent = "\u8FDE\u63A5";
        label.appendChild(badge);
      }
      group.appendChild(label);
      if (isConnection) {
        const connectionDisplay = document.createElement("div");
        connectionDisplay.className = "connection-display";
        connectionDisplay.textContent = `\u2190 \u8282\u70B9 #${currentValue[0]} \u8F93\u51FA ${currentValue[1]}`;
        group.appendChild(connectionDisplay);
      } else {
        const control = createInputControlByValue(inputName, currentValue, (newValue) => {
          workflow[node.id].inputs[inputName] = newValue;
          node.inputs[inputName] = newValue;
          if (onUpdate) onUpdate();
        });
        group.appendChild(control);
      }
      inputsContainer.appendChild(group);
    }
  }
}

function isPlaceholderValue(value) {
  if (typeof value !== "string") return false;
  return value.startsWith("%") && value.endsWith("%");
}

function createInputControl(inputName, inputDef, currentValue, onChange) {
  const typeInfo = Array.isArray(inputDef) ? inputDef[0] : inputDef;
  const config = Array.isArray(inputDef) && inputDef[1] ? inputDef[1] : {};
  if (isPlaceholderValue(currentValue)) {
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = currentValue;
    textInput.onchange = () => onChange(textInput.value);
    return wrapWithPlaceholderButton(textInput, inputName, onChange);
  }
  if (Array.isArray(typeInfo)) {
    const select = document.createElement("select");
    let hasMatch = false;
    typeInfo.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      if (option === currentValue) {
        opt.selected = true;
        hasMatch = true;
      }
      select.appendChild(opt);
    });
    if (!hasMatch && typeInfo.length > 0) {
      select.value = typeInfo[0];
      setTimeout(() => onChange(typeInfo[0]), 0);
    }
    select.onchange = () => onChange(select.value);
    const defaultVal = typeInfo.length > 0 ? typeInfo[0] : "";
    return wrapWithPlaceholderButton(select, inputName, onChange, defaultVal);
  }
  switch (typeInfo) {
    case "INT":
      const intInput = document.createElement("input");
      intInput.type = "number";
      intInput.step = "1";
      intInput.value = currentValue ?? config.default ?? 0;
      if (config.min !== void 0) intInput.min = config.min;
      if (config.max !== void 0) intInput.max = config.max;
      intInput.onchange = () => onChange(parseInt(intInput.value, 10));
      return wrapWithPlaceholderButton(intInput, inputName, onChange);
    case "FLOAT":
      const floatInput = document.createElement("input");
      floatInput.type = "number";
      floatInput.step = config.step || "0.01";
      floatInput.value = currentValue ?? config.default ?? 0;
      if (config.min !== void 0) floatInput.min = config.min;
      if (config.max !== void 0) floatInput.max = config.max;
      floatInput.onchange = () => onChange(parseFloat(floatInput.value));
      return wrapWithPlaceholderButton(floatInput, inputName, onChange);
    case "BOOLEAN":
      const checkWrapper = document.createElement("div");
      checkWrapper.className = "checkbox-wrapper";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = currentValue ?? config.default ?? false;
      checkbox.onchange = () => onChange(checkbox.checked);
      checkWrapper.appendChild(checkbox);
      const checkLabel = document.createElement("span");
      checkLabel.textContent = checkbox.checked ? "\u662F" : "\u5426";
      checkbox.onchange = () => {
        onChange(checkbox.checked);
        checkLabel.textContent = checkbox.checked ? "\u662F" : "\u5426";
      };
      checkWrapper.appendChild(checkLabel);
      return checkWrapper;
    case "STRING":
      if (config.multiline) {
        const textarea = document.createElement("textarea");
        textarea.value = currentValue ?? config.default ?? "";
        textarea.onchange = () => onChange(textarea.value);
        return wrapWithPlaceholderButton(textarea, inputName, onChange);
      } else {
        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.value = currentValue ?? config.default ?? "";
        textInput.onchange = () => onChange(textInput.value);
        return wrapWithPlaceholderButton(textInput, inputName, onChange);
      }
    default:
      return createInputControlByValue(inputName, currentValue, onChange);
  }
}

function createInputControlByValue(inputName, currentValue, onChange) {
  if (typeof currentValue === "boolean") {
    const checkWrapper = document.createElement("div");
    checkWrapper.className = "checkbox-wrapper";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = currentValue;
    const checkLabel = document.createElement("span");
    checkLabel.textContent = checkbox.checked ? "\u662F" : "\u5426";
    checkbox.onchange = () => {
      onChange(checkbox.checked);
      checkLabel.textContent = checkbox.checked ? "\u662F" : "\u5426";
    };
    checkWrapper.appendChild(checkbox);
    checkWrapper.appendChild(checkLabel);
    return checkWrapper;
  } else if (typeof currentValue === "number") {
    const numInput = document.createElement("input");
    numInput.type = "number";
    numInput.step = Number.isInteger(currentValue) ? "1" : "0.01";
    numInput.value = currentValue;
    numInput.onchange = () => onChange(Number.isInteger(currentValue) ? parseInt(numInput.value, 10) : parseFloat(numInput.value));
    return wrapWithPlaceholderButton(numInput, inputName, onChange);
  } else {
    const strValue = String(currentValue ?? "");
    if (strValue.length > 50 || strValue.includes("\n")) {
      const textarea = document.createElement("textarea");
      textarea.value = strValue;
      textarea.onchange = () => onChange(textarea.value);
      return wrapWithPlaceholderButton(textarea, inputName, onChange);
    } else {
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = strValue;
      textInput.onchange = () => onChange(textInput.value);
      return wrapWithPlaceholderButton(textInput, inputName, onChange);
    }
  }
}

async function visualizeWorkflow() {
  const settings3 = extension_settings[extensionName];
  const workerEl = document.getElementById("worker");
  if (!workerEl || !workerEl.value.trim()) {
    alert("\u6CA1\u6709\u5DE5\u4F5C\u6D41\u53EF\u4EE5\u53EF\u89C6\u5316\u3002\u8BF7\u5148\u8F93\u5165\u6216\u9009\u62E9\u4E00\u4E2A\u5DE5\u4F5C\u6D41\u3002");
    return;
  }
  let workflow;
  try {
    workflow = JSON.parse(workerEl.value.trim());
  } catch (e) {
    alert("\u5DE5\u4F5C\u6D41 JSON \u683C\u5F0F\u4E0D\u6B63\u786E: " + e.message);
    return;
  }
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u5DE5\u4F5C\u6D41\u53EF\u89C6\u5316</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-toolbar">
                <button class="st-chatu8-btn" id="viz-zoom-in"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                <button class="st-chatu8-btn" id="viz-zoom-out"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
                <button class="st-chatu8-btn" id="viz-zoom-reset"><i class="fa-solid fa-expand"></i> \u91CD\u7F6E</button>
                <button class="st-chatu8-btn" id="viz-save-workflow"><i class="fa-solid fa-save"></i> \u4FDD\u5B58\u4FEE\u6539</button>
                <span class="st-chatu8-workflow-viz-stats"></span>
            </div>
            <div class="st-chatu8-workflow-viz-body">
                <div class="st-chatu8-workflow-viz-container">
                    <div class="st-chatu8-workflow-viz-svg-wrapper">
                        <svg class="st-chatu8-workflow-viz-svg"></svg>
                    </div>
                </div>
                <div class="st-chatu8-workflow-viz-properties" id="viz-properties-panel">
                    <div class="st-chatu8-workflow-viz-properties-placeholder">
                        <i class="fa-solid fa-mouse-pointer"></i>
                        <p>\u70B9\u51FB\u8282\u70B9\u67E5\u770B\u5C5E\u6027</p>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(backdrop);
  const closeBtn = backdrop.querySelector(".st-chatu8-workflow-viz-close");
  const container = backdrop.querySelector(".st-chatu8-workflow-viz-container");
  const svgWrapper = backdrop.querySelector(".st-chatu8-workflow-viz-svg-wrapper");
  const svg = backdrop.querySelector(".st-chatu8-workflow-viz-svg");
  const statsEl = backdrop.querySelector(".st-chatu8-workflow-viz-stats");
  const propertiesPanel = backdrop.querySelector("#viz-properties-panel");
  const { getComfyuiCache: getComfyuiCache2 } = await import("../configDatabase.js");
  const objectInfo = await getComfyuiCache2("objectinfo") || {};
  let selectedNodeId = null;
  let hasModifications = false;
  closeBtn.onclick = () => backdrop.remove();
  const isMobile3 = window.innerWidth <= 768;
  const addMobileCloseButton = () => {
    if (!isMobile3) return;
    const existing = propertiesPanel.querySelector(".st-chatu8-workflow-viz-properties-close-mobile");
    if (existing) existing.remove();
    const mobileCloseBtn = document.createElement("span");
    mobileCloseBtn.className = "st-chatu8-workflow-viz-properties-close-mobile";
    mobileCloseBtn.innerHTML = "&times;";
    mobileCloseBtn.onclick = (e) => {
      e.stopPropagation();
      propertiesPanel.classList.remove("visible");
    };
    propertiesPanel.insertBefore(mobileCloseBtn, propertiesPanel.firstChild);
  };
  const togglePropertiesPanel = (forceShow = null) => {
    if (!isMobile3) return;
    if (forceShow !== null) {
      propertiesPanel.classList.toggle("visible", forceShow);
    } else {
      propertiesPanel.classList.toggle("visible");
    }
  };
  const nodes = [];
  const nodeMap = {};
  const connections = [];
  for (const nodeId in workflow) {
    if (workflow.hasOwnProperty(nodeId)) {
      const nodeData = workflow[nodeId];
      const node = {
        id: nodeId,
        classType: nodeData.class_type || "\u672A\u77E5",
        inputs: nodeData.inputs || {},
        meta: nodeData._meta || {}
      };
      nodes.push(node);
      nodeMap[nodeId] = node;
    }
  }
  for (const node of nodes) {
    for (const inputKey in node.inputs) {
      const inputValue = node.inputs[inputKey];
      if (Array.isArray(inputValue) && inputValue.length === 2 && typeof inputValue[0] === "string") {
        connections.push({
          from: inputValue[0],
          fromOutput: inputValue[1],
          to: node.id,
          toInput: inputKey
        });
      }
    }
  }
  statsEl.textContent = `\u8282\u70B9: ${nodes.length} | \u8FDE\u63A5: ${connections.length}`;
  const nodeWidth = 180;
  const nodeHeight = 60;
  const horizontalGap = 80;
  const verticalGap = 30;
  const inDegree = {};
  const levels = {};
  nodes.forEach((n) => {
    inDegree[n.id] = 0;
  });
  connections.forEach((c) => {
    if (inDegree[c.to] !== void 0) inDegree[c.to]++;
  });
  let queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  let level = 0;
  const processed = /* @__PURE__ */ new Set();
  while (queue.length > 0) {
    const nextQueue = [];
    for (const nodeId of queue) {
      if (processed.has(nodeId)) continue;
      processed.add(nodeId);
      levels[nodeId] = level;
      connections.filter((c) => c.from === nodeId).forEach((c) => {
        if (!processed.has(c.to)) {
          nextQueue.push(c.to);
        }
      });
    }
    queue = nextQueue;
    level++;
  }
  nodes.forEach((n) => {
    if (levels[n.id] === void 0) {
      levels[n.id] = level;
    }
  });
  const levelGroups = {};
  nodes.forEach((n) => {
    const l = levels[n.id];
    if (!levelGroups[l]) levelGroups[l] = [];
    levelGroups[l].push(n);
  });
  const positions = {};
  let maxX = 0, maxY = 0;
  Object.keys(levelGroups).sort((a, b) => a - b).forEach((l) => {
    const levelNodes = levelGroups[l];
    const x = parseInt(l) * (nodeWidth + horizontalGap) + 50;
    levelNodes.forEach((n, i) => {
      const y = i * (nodeHeight + verticalGap) + 50;
      positions[n.id] = { x, y };
      maxX = Math.max(maxX, x + nodeWidth);
      maxY = Math.max(maxY, y + nodeHeight);
    });
  });
  const svgWidth = maxX + 100;
  const svgHeight = maxY + 100;
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
  const classColors = {};
  const colorPalette = ["#4a90e2", "#50c878", "#f5a623", "#d0021b", "#9b59b6", "#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#1abc9c"];
  let colorIndex = 0;
  const getClassColor = (classType) => {
    if (!classColors[classType]) {
      classColors[classType] = colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
    }
    return classColors[classType];
  };
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
        </marker>
    `;
  svg.appendChild(defs);
  connections.forEach((conn) => {
    const fromPos = positions[conn.from];
    const toPos = positions[conn.to];
    if (!fromPos || !toPos) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const startX = fromPos.x + nodeWidth;
    const startY = fromPos.y + nodeHeight / 2;
    const endX = toPos.x;
    const endY = toPos.y + nodeHeight / 2;
    const ctrlOffset = Math.abs(endX - startX) / 2;
    path.setAttribute("d", `M ${startX} ${startY} C ${startX + ctrlOffset} ${startY}, ${endX - ctrlOffset} ${endY}, ${endX} ${endY}`);
    path.setAttribute("stroke", "#666");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", "url(#arrowhead)");
    path.classList.add("st-chatu8-workflow-viz-connection");
    svg.appendChild(path);
  });
  nodes.forEach((node) => {
    const pos = positions[node.id];
    if (!pos) return;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("st-chatu8-workflow-viz-node");
    g.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
    const isSkipped = workflow[node.id]._skip === true;
    if (isSkipped) {
      g.classList.add("skipped");
    }
    const color = getClassColor(node.classType);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", nodeWidth);
    rect.setAttribute("height", nodeHeight);
    rect.setAttribute("rx", "8");
    rect.setAttribute("fill", isSkipped ? "#1a1a2e" : "#2a2a3e");
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("stroke-dasharray", isSkipped ? "5,5" : "none");
    g.appendChild(rect);
    const idText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    idText.setAttribute("x", "10");
    idText.setAttribute("y", "18");
    idText.setAttribute("fill", "#aaa");
    idText.setAttribute("font-size", "11");
    idText.textContent = `#${node.id}`;
    g.appendChild(idText);
    const typeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    typeText.setAttribute("x", "10");
    typeText.setAttribute("y", "38");
    typeText.setAttribute("fill", color);
    typeText.setAttribute("font-size", "13");
    typeText.setAttribute("font-weight", "bold");
    const displayName = node.meta.title || node.classType;
    typeText.textContent = displayName.length > 20 ? displayName.substring(0, 18) + "..." : displayName;
    g.appendChild(typeText);
    const inputCount = Object.keys(node.inputs).length;
    const inputText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    inputText.setAttribute("x", "10");
    inputText.setAttribute("y", "54");
    inputText.setAttribute("fill", "#777");
    inputText.setAttribute("font-size", "10");
    inputText.textContent = `\u8F93\u5165: ${inputCount}`;
    g.appendChild(inputText);
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    const inputDetails = Object.entries(node.inputs).map(([k, v]) => `  ${k}: ${Array.isArray(v) ? `[${v[0]}:${v[1]}]` : JSON.stringify(v).substring(0, 30)}`).join("\n");
    title.textContent = `\u8282\u70B9 #${node.id}
\u7C7B\u578B: ${node.classType}
\u6807\u9898: ${node.meta.title || "\u65E0"}

\u8F93\u5165:
${inputDetails || "  \u65E0"}`;
    g.appendChild(title);
    g.setAttribute("data-node-id", node.id);
    g.onclick = (e) => {
      e.stopPropagation();
      svg.querySelectorAll(".st-chatu8-workflow-viz-node.selected").forEach((el) => {
        el.classList.remove("selected");
      });
      g.classList.add("selected");
      selectedNodeId = node.id;
      renderNodeProperties(propertiesPanel, node, workflow, objectInfo, connections, () => {
        hasModifications = true;
      }, (nodeId, skipped) => {
        const nodeEl = svg.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeEl) {
          if (skipped) {
            nodeEl.classList.add("skipped");
            const nodeRect = nodeEl.querySelector("rect");
            if (nodeRect) {
              nodeRect.setAttribute("fill", "#1a1a2e");
              nodeRect.setAttribute("stroke-dasharray", "5,5");
            }
          } else {
            nodeEl.classList.remove("skipped");
            const nodeRect = nodeEl.querySelector("rect");
            if (nodeRect) {
              nodeRect.setAttribute("fill", "#2a2a3e");
              nodeRect.setAttribute("stroke-dasharray", "none");
            }
          }
        }
        hasModifications = true;
      });
      addMobileCloseButton();
      togglePropertiesPanel(true);
    };
    svg.appendChild(g);
  });
  let scale = 1;
  const baseSvgWidth = svgWidth;
  const baseSvgHeight = svgHeight;
  const updateScale = () => {
    svg.style.transform = `scale(${scale})`;
    svg.style.transformOrigin = "top left";
    svgWrapper.style.width = `${baseSvgWidth * scale}px`;
    svgWrapper.style.height = `${baseSvgHeight * scale}px`;
  };
  svgWrapper.style.width = `${baseSvgWidth}px`;
  svgWrapper.style.height = `${baseSvgHeight}px`;
  backdrop.querySelector("#viz-zoom-in").onclick = () => {
    scale = Math.min(scale + 0.2, 3);
    updateScale();
  };
  backdrop.querySelector("#viz-zoom-out").onclick = () => {
    scale = Math.max(scale - 0.2, 0.3);
    updateScale();
  };
  backdrop.querySelector("#viz-zoom-reset").onclick = () => {
    scale = 1;
    updateScale();
    container.scrollTop = 0;
    container.scrollLeft = 0;
  };
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let scrollStartX = 0;
  let scrollStartY = 0;
  container.addEventListener("mousedown", (e) => {
    const clickedNode = e.target.closest(".st-chatu8-workflow-viz-node");
    if (!clickedNode) {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      scrollStartX = container.scrollLeft;
      scrollStartY = container.scrollTop;
      container.style.cursor = "grabbing";
      e.preventDefault();
    }
  });
  container.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    container.scrollLeft = scrollStartX - dx;
    container.scrollTop = scrollStartY - dy;
  });
  container.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = "grab";
    }
  });
  container.addEventListener("mouseleave", () => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = "grab";
    }
  });
  let touchStartX = 0;
  let touchStartY = 0;
  let touchScrollStartX = 0;
  let touchScrollStartY = 0;
  container.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchScrollStartX = container.scrollLeft;
      touchScrollStartY = container.scrollTop;
    }
  }, { passive: true });
  container.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      container.scrollLeft = touchScrollStartX - dx;
      container.scrollTop = touchScrollStartY - dy;
    }
  }, { passive: true });
  backdrop.querySelector("#viz-save-workflow").onclick = async () => {
    try {
      const skippedCount = Object.values(workflow).filter((n) => n._skip).length;
      const workflowJson = JSON.stringify(workflow, null, 2);
      workerEl.value = workflowJson;
      $(workerEl).trigger("input");
      const presetName = settings3.workerid;
      if (!presetName || ["\u9ED8\u8BA4", "\u9ED8\u8BA4\u4EBA\u7269\u4E00\u81F4", "\u9762\u90E8\u7EC6\u5316"].includes(presetName)) {
        const newName = await stylInput("\u9ED8\u8BA4\u5DE5\u4F5C\u6D41\u4E0D\u80FD\u88AB\u4FEE\u6539\uFF0C\u8BF7\u8F93\u5165\u65B0\u7684\u914D\u7F6E\u540D\u79F0\uFF1A");
        if (newName && newName.trim()) {
          const name = newName.trim();
          const selectElement = document.getElementById("workerid");
          if (!settings3.workers.hasOwnProperty(name)) {
            const newOption = new Option(name, name);
            newOption.title = name;
            selectElement.add(newOption);
          }
          selectElement.value = name;
          settings3.workerid = name;
          settings3.workers[name] = workflowJson;
          settings3.worker = workflowJson;
          saveSettingsDebounced();
          hasModifications = false;
          if (skippedCount > 0) {
            toastr.success(`\u5DE5\u4F5C\u6D41\u5DF2\u4FDD\u5B58\u4E3A "${name}"\uFF08\u542B ${skippedCount} \u4E2A\u8DF3\u8FC7\u8282\u70B9\uFF0C\u6267\u884C\u65F6\u751F\u6548\uFF09`);
          } else {
            toastr.success(`\u5DE5\u4F5C\u6D41\u5DF2\u4FDD\u5B58\u4E3A "${name}"`);
          }
        }
      } else {
        settings3.workers[presetName] = workflowJson;
        settings3.worker = workflowJson;
        saveSettingsDebounced();
        hasModifications = false;
        if (skippedCount > 0) {
          toastr.success(`\u5DE5\u4F5C\u6D41 "${presetName}" \u5DF2\u4FDD\u5B58\uFF08\u542B ${skippedCount} \u4E2A\u8DF3\u8FC7\u8282\u70B9\uFF0C\u6267\u884C\u65F6\u751F\u6548\uFF09`);
        } else {
          toastr.success(`\u5DE5\u4F5C\u6D41 "${presetName}" \u5DF2\u4FDD\u5B58`);
        }
      }
    } catch (e) {
      alert("\u4FDD\u5B58\u5931\u8D25: " + e.message);
    }
  };
}

function editWorker_change() {
  const settings3 = extension_settings[extensionName];
  const editWorker = document.getElementById("editWorker");
  const selectElement = document.getElementById("editWorkerid");
  settings3["editWorkerid"] = selectElement.value;
  settings3.editWorker = settings3.workers[settings3.editWorkerid];
  saveSettingsDebounced();
  editWorker.value = settings3["workers"][settings3["editWorkerid"]];
  $(editWorker).trigger("input");
}

function editWorker_new() {
  const settings3 = extension_settings[extensionName];
  stylInput("\u8BF7\u8F93\u5165\u65B0\u4FEE\u56FE\u5DE5\u4F5C\u6D41\u9884\u8BBE\u7684\u540D\u79F0").then((newName) => {
    if (newName && newName.trim() !== "") {
      if (settings3.workers.hasOwnProperty(newName)) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      const selectElement = document.getElementById("editWorkerid");
      let newOption = new Option(newName, newName);
      newOption.title = newName;
      selectElement.add(newOption);
      const workerSelectElement = document.getElementById("workerid");
      if (workerSelectElement) {
        let workerOption = new Option(newName, newName);
        workerOption.title = newName;
        workerSelectElement.add(workerOption);
      }
      selectElement.value = newName;
      settings3.editWorkerid = newName;
      settings3.workers[newName] = "";
      settings3.editWorker = "";
      const editWorker = document.getElementById("editWorker");
      editWorker.value = "";
      saveSettingsDebounced();
      toastr.success(`\u5DF2\u521B\u5EFA\u7A7A\u9884\u8BBE "${newName}"`);
    }
  });
}

function editWorker_rename() {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.editWorkerid;
  if (["\u9ED8\u8BA4", "\u9ED8\u8BA4\u4EBA\u7269\u4E00\u81F4", "\u9762\u90E8\u7EC6\u5316", "\u65B0\u7248\u9ED8\u8BA4", "\u9ED8\u8BA4-\u72EC\u7ACBVAE", "\u65B0weilin-vae"].includes(currentName) || !settings3.workers[currentName]) {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u6216\u4E0D\u5B58\u5728\u7684\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u4FEE\u56FE\u5DE5\u4F5C\u6D41\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.workers.hasOwnProperty(newName)) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.workers[newName] = settings3.workers[currentName];
      delete settings3.workers[currentName];
      settings3.editWorkerid = newName;
      if (settings3.workerid === currentName) {
        settings3.workerid = newName;
      }
      saveSettingsDebounced();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
      toastr.success(`\u4FEE\u56FE\u5DE5\u4F5C\u6D41\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function editWorker_save() {
  const settings3 = extension_settings[extensionName];
  stylInput("\u8BF7\u8F93\u5165\u914D\u7F6E\u540D\u79F0").then((result) => {
    if (result) {
      const editWorker = document.getElementById("editWorker");
      const selectElement = document.getElementById("editWorkerid");
      const workerSelectElement = document.getElementById("workerid");
      let newOption = new Option(result, result);
      newOption.title = result;
      if (!settings3.workers.hasOwnProperty(result)) {
        selectElement.add(newOption);
        if (workerSelectElement) {
          let workerOption = new Option(result, result);
          workerOption.title = result;
          workerSelectElement.add(workerOption);
        }
      }
      selectElement.value = result;
      settings3.editWorkerid = result;
      settings3.workers[result] = editWorker.value;
      settings3.editWorker = editWorker.value;
      saveSettingsDebounced();
    }
  });
}

function editWorker_delete() {
  const settings3 = extension_settings[extensionName];
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664").then((result) => {
    if (result) {
      const editWorker = document.getElementById("editWorker");
      const selectElement = document.getElementById("editWorkerid");
      const workerSelectElement = document.getElementById("workerid");
      const valueToDelete = selectElement.value;
      if (valueToDelete === "\u9ED8\u8BA4" || valueToDelete === "\u9ED8\u8BA4\u4EBA\u7269\u4E00\u81F4" || valueToDelete === "\u9762\u90E8\u7EC6\u5316" || valueToDelete === "\u65B0\u7248\u9ED8\u8BA4" || valueToDelete === "\u9ED8\u8BA4-\u72EC\u7ACBVAE" || valueToDelete === "\u65B0weilin-vae") {
        alert("\u9ED8\u8BA4\u914D\u7F6E\u4E0D\u80FD\u5220\u9664");
        return;
      }
      if (settings3.workerid === valueToDelete) {
        if (!confirm(`\u4E3B\u5DE5\u4F5C\u6D41\u4E5F\u5728\u4F7F\u7528 "${valueToDelete}"\uFF0C\u5220\u9664\u540E\u5C06\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u5DE5\u4F5C\u6D41\u3002\u662F\u5426\u7EE7\u7EED\uFF1F`)) {
          return;
        }
        settings3.workerid = "\u65B0\u7248\u9ED8\u8BA4";
        settings3.worker = settings3.workers["\u65B0\u7248\u9ED8\u8BA4"];
        if (workerSelectElement) {
          workerSelectElement.value = "\u65B0\u7248\u9ED8\u8BA4";
          const workerTextarea = document.getElementById("worker");
          if (workerTextarea) {
            workerTextarea.value = settings3.workers["\u65B0\u7248\u9ED8\u8BA4"];
          }
        }
      }
      Reflect.deleteProperty(settings3["workers"], valueToDelete);
      selectElement.remove(selectElement.selectedIndex);
      if (workerSelectElement) {
        for (let i = 0; i < workerSelectElement.options.length; i++) {
          if (workerSelectElement.options[i].value === valueToDelete) {
            workerSelectElement.remove(i);
            break;
          }
        }
      }
      selectElement.value = "\u65B0\u7248\u9ED8\u8BA4";
      settings3.editWorkerid = "\u65B0\u7248\u9ED8\u8BA4";
      settings3.editWorker = settings3["workers"][settings3["editWorkerid"]];
      editWorker.value = settings3["workers"][settings3["editWorkerid"]];
      saveSettingsDebounced();
    }
  });
}

function editWorker_update() {
  const settings3 = extension_settings[extensionName];
  const presetName = settings3.editWorkerid;
  if (!presetName || !settings3.workers[presetName]) {
    alert('\u6CA1\u6709\u6D3B\u52A8\u7684\u5DE5\u4F5C\u6D41\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148"\u53E6\u5B58\u4E3A"\u4E00\u4E2A\u65B0\u5DE5\u4F5C\u6D41\u3002');
    return;
  }
  if (["\u9ED8\u8BA4", "\u9ED8\u8BA4\u4EBA\u7269\u4E00\u81F4", "\u9762\u90E8\u7EC6\u5316", "\u65B0\u7248\u9ED8\u8BA4", "\u9ED8\u8BA4-\u72EC\u7ACBVAE", "\u65B0weilin-vae"].includes(presetName)) {
    alert(`\u9ED8\u8BA4\u5DE5\u4F5C\u6D41 "${presetName}" \u4E0D\u80FD\u88AB\u4FEE\u6539\u3002\u8BF7\u4F7F\u7528"\u53E6\u5B58\u4E3A"\u521B\u5EFA\u4E00\u4E2A\u526F\u672C\u3002`);
    return;
  }
  stylishConfirm(`\u786E\u5B9A\u8981\u8986\u76D6\u5F53\u524D\u5DE5\u4F5C\u6D41 "${presetName}" \u5417\uFF1F`).then((confirmed) => {
    if (confirmed) {
      const editWorkerValue = document.getElementById("editWorker").value;
      settings3.workers[presetName] = editWorkerValue;
      if (settings3.editWorkerid === presetName) {
        settings3.editWorker = editWorkerValue;
      }
      if (settings3.workerid === presetName) {
        settings3.worker = editWorkerValue;
        const workerTextarea = document.getElementById("worker");
        if (workerTextarea) {
          workerTextarea.value = editWorkerValue;
        }
      }
      saveSettingsDebounced();
    }
  });
}

function editWorker_export_current() {
  const settings3 = extension_settings[extensionName];
  const selectedId = settings3.editWorkerid;
  if (!selectedId || !settings3.workers[selectedId]) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u5DE5\u4F5C\u6D41\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const dataToExport = { [selectedId]: settings3.workers[selectedId] };
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-edit-workflow-${selectedId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function editWorker_export_all() {
  worker_export_all();
}

async function editWorker_import() {
  const settings3 = extension_settings[extensionName];
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        const importedData = JSON.parse(readerEvent.target.result);
        if (isComfyUIFullWorkflow(importedData)) {
          alert('\u68C0\u6D4B\u5230ComfyUI\u5B8C\u6574\u5DE5\u4F5C\u6D41\u683C\u5F0F\uFF08\u5305\u542BUI\u4FE1\u606F\uFF09\u3002\n\n\u8BF7\u5728ComfyUI\u4E2D\u6253\u5F00\u6B64\u5DE5\u4F5C\u6D41\uFF0C\u7136\u540E\u4F7F\u7528 "Save (API Format)" \u5BFC\u51FA\u4E3AAPI\u683C\u5F0F\u540E\u518D\u5BFC\u5165\u3002\n\n\u63D0\u793A\uFF1A\u5728ComfyUI\u754C\u9762\u4E2D\u53F3\u952E\u70B9\u51FB\u7A7A\u767D\u5904\uFF0C\u9009\u62E9 "Save (API Format)" \u5373\u53EF\u5BFC\u51FAAPI\u683C\u5F0F\u7684\u5DE5\u4F5C\u6D41\u3002');
          return;
        }
        if (isRawComfyUIWorkflow(importedData)) {
          const defaultName = file.name.replace(/\.json$/i, "") || "\u5BFC\u5165\u7684\u4FEE\u56FE\u5DE5\u4F5C\u6D41";
          const workflowName = await stylInput(`\u68C0\u6D4B\u5230\u539F\u59CBComfyUI API\u5DE5\u4F5C\u6D41\uFF0C\u8BF7\u4E3A\u5176\u547D\u540D\uFF1A`, defaultName);
          if (workflowName && workflowName.trim()) {
            const name = workflowName.trim();
            const workflowData = JSON.stringify(importedData, null, 2);
            const isNew = !settings3.workers.hasOwnProperty(name);
            settings3.workers[name] = workflowData;
            const selectElement = document.getElementById("editWorkerid");
            const workerSelectElement = document.getElementById("workerid");
            if (selectElement && isNew) {
              const newOption = new Option(name, name);
              newOption.title = name;
              selectElement.add(newOption);
              if (workerSelectElement) {
                const workerOption = new Option(name, name);
                workerOption.title = name;
                workerSelectElement.add(workerOption);
              }
            }
            selectElement.value = name;
            settings3.editWorkerid = name;
            settings3.editWorker = workflowData;
            const editWorkerTextarea = document.getElementById("editWorker");
            if (editWorkerTextarea) {
              editWorkerTextarea.value = workflowData;
            }
            saveSettingsDebounced();
            alert(`\u6210\u529F\u5BFC\u5165\u539F\u59CBComfyUI\u5DE5\u4F5C\u6D41\uFF0C\u5DF2\u4FDD\u5B58\u4E3A: "${name}"`);
          } else {
            alert("\u5BFC\u5165\u5DF2\u53D6\u6D88\u3002");
          }
        } else {
          let newWorkflowsCount = 0;
          const selectElement = document.getElementById("editWorkerid");
          const workerSelectElement = document.getElementById("workerid");
          for (const key in importedData) {
            if (importedData.hasOwnProperty(key)) {
              const workflowData = typeof importedData[key] === "string" ? importedData[key] : JSON.stringify(importedData[key], null, 2);
              const isNew = !settings3.workers.hasOwnProperty(key);
              if (isNew) {
                newWorkflowsCount++;
                if (selectElement) {
                  const newOption = new Option(key, key);
                  newOption.title = key;
                  selectElement.add(newOption);
                }
                if (workerSelectElement) {
                  const workerOption = new Option(key, key);
                  workerOption.title = key;
                  workerSelectElement.add(workerOption);
                }
              }
              settings3.workers[key] = workflowData;
            }
          }
          saveSettingsDebounced();
          alert(`\u6210\u529F\u5BFC\u5165 ${Object.keys(importedData).length} \u4E2A\u5DE5\u4F5C\u6D41\uFF0C\u5176\u4E2D ${newWorkflowsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`);
        }
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002");
        console.error("Error importing workflows:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function initWorkerControls(settingsModal) {
  settingsModal.find("#eidtwork").on("click", eidtwork);
  settingsModal.find("#visualize_workflow").on("click", visualizeWorkflow);
  settingsModal.find("#workerid").on("change", worker_change);
  settingsModal.find("#worker_new").on("click", worker_new);
  settingsModal.find("#worker_rename").on("click", worker_rename);
  settingsModal.find("#worker_update_style").on("click", worker_update);
  settingsModal.find("#worker_save_style").on("click", worker_save);
  settingsModal.find("#worker_delete_style").on("click", worker_delete);
  settingsModal.find("#worker_export_current").on("click", worker_export_current);
  settingsModal.find("#worker_export_all").on("click", worker_export_all);
  settingsModal.find("#worker_import").on("click", worker_import);
  settingsModal.find("#editWorkerid").on("change", editWorker_change);
  settingsModal.find("#edit_worker_new").on("click", editWorker_new);
  settingsModal.find("#edit_worker_rename").on("click", editWorker_rename);
  settingsModal.find("#edit_worker_save_style").on("click", editWorker_save);
  settingsModal.find("#edit_worker_delete_style").on("click", editWorker_delete);
  settingsModal.find("#edit_worker_update_style").on("click", editWorker_update);
  settingsModal.find("#edit_worker_export_current").on("click", editWorker_export_current);
  settingsModal.find("#edit_worker_export_all").on("click", editWorker_export_all);
  settingsModal.find("#edit_worker_import").on("click", editWorker_import);
  settingsModal.find("#eidtEditWork").on("click", () => {
    const el = document.getElementById("editWorker");
    try {
      let textrejsons = JSON.parse(el.value.trim());
      textrejsons = eidtJSON(textrejsons);
      el.value = JSON.stringify(textrejsons, null, 2);
    } catch (e) {
      alert("\u8BF7\u8F93\u5165\u6B63\u786E\u7684json: " + e);
    }
  });
  settingsModal.find("#visualize_edit_workflow").on("click", () => {
    const settings3 = extension_settings[extensionName];
    const originalWorker = settings3.worker;
    const originalWorkerId = settings3.workerid;
    settings3.worker = settings3.editWorker;
    settings3.workerid = settings3.editWorkerid;
    visualizeWorkflow();
    setTimeout(() => {
      settings3.worker = originalWorker;
      settings3.workerid = originalWorkerId;
    }, 100);
  });
}

export { eidtwork, initWorkerControls, processSkippedNodes };
