// 还原自打包产物 — 原始模块: utils/settings/runninghubWorker.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extensionName } from "../config.js";
import { stylInput } from "../ui_common.js";
import { RUNNINGHUB_PLACEHOLDER_MAP } from "./runninghubui.js";

function isComfyUIFullWorkflow2(data) {
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

function isRawComfyUIWorkflow2(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return false;
  }
  let hasClassType = false;
  for (const key of keys) {
    if (key === "_meta") continue;
    const value = data[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if (value.hasOwnProperty("class_type") || value.hasOwnProperty("inputs")) {
        hasClassType = true;
      }
    } else if (typeof value === "string") {
      return false;
    }
  }
  return hasClassType;
}

function showInheritWorkflowSelectModal(candidateNames, currentName) {
  return new Promise((resolve) => {
    const parent = document.getElementById("st-chatu8-settings") || document.body;
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-confirm-backdrop";
    backdrop.style.zIndex = "1000003";
    const confirmBox = document.createElement("div");
    confirmBox.className = "st-chatu8-confirm-box";
    confirmBox.style.maxWidth = "480px";
    const title = document.createElement("h4");
    title.style.margin = "0 0 6px 0";
    title.style.display = "flex";
    title.style.alignItems = "center";
    title.style.gap = "8px";
    title.innerHTML = '<i class="fa-solid fa-code-fork" style="color: var(--st-chatu8-accent-color, #667eea);"></i> \u7EE7\u627F\u5DE5\u4F5C\u6D41\u5360\u4F4D\u7B26\u4FEE\u6539';
    confirmBox.appendChild(title);
    const desc = document.createElement("p");
    desc.className = "st-chatu8-confirm-message";
    desc.style.fontSize = "13px";
    desc.style.color = "var(--st-chatu8-text-secondary, #888)";
    desc.style.lineHeight = "1.5";
    desc.innerHTML = `\u5F53\u524D\u5DE5\u4F5C\u6D41\uFF1A<strong style="color: var(--st-chatu8-text-primary, #ddd);">${currentName || "\u672A\u547D\u540D"}</strong><br>\u8BF7\u9009\u62E9\u4E00\u4E2A\u5DF2\u914D\u7F6E\u597D\u5360\u4F4D\u7B26\u7684<strong>\u7236\u5DE5\u4F5C\u6D41</strong>\u3002\u7CFB\u7EDF\u5C06\u6839\u636E<strong>\u8282\u70B9 ID</strong>\u81EA\u52A8\u628A\u7236\u5DE5\u4F5C\u6D41\u4E2D\u7684\u5360\u4F4D\u7B26\u914D\u7F6E\uFF08\u5982\u63D0\u793A\u8BCD\u3001\u79CD\u5B50\u3001\u6B65\u6570\u3001\u56FE\u7247\u7B49\uFF09\u7EE7\u627F\u5E76\u5E94\u7528\u5230\u5F53\u524D\u5DE5\u4F5C\u6D41\u3002`;
    confirmBox.appendChild(desc);
    const field = document.createElement("div");
    field.className = "st-chatu8-field";
    field.style.margin = "10px 0";
    const label = document.createElement("label");
    label.textContent = "\u9009\u62E9\u7236\u5DE5\u4F5C\u6D41\u9884\u8BBE\uFF1A";
    label.style.fontSize = "12px";
    label.style.marginBottom = "4px";
    label.style.display = "block";
    field.appendChild(label);
    const select = document.createElement("select");
    select.className = "st-chatu8-select";
    select.style.width = "100%";
    candidateNames.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
    field.appendChild(select);
    confirmBox.appendChild(field);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "st-chatu8-confirm-buttons";
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "\u53D6\u6D88";
    cancelButton.className = "st-chatu8-btn";
    buttonContainer.appendChild(cancelButton);
    const confirmButton = document.createElement("button");
    confirmButton.innerHTML = '<i class="fa-solid fa-check"></i> \u786E\u8BA4\u7EE7\u627F';
    confirmButton.className = "st-chatu8-btn";
    buttonContainer.appendChild(confirmButton);
    confirmBox.appendChild(buttonContainer);
    backdrop.appendChild(confirmBox);
    parent.appendChild(backdrop);
    const close = (value) => {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      resolve(value);
    };
    cancelButton.addEventListener("click", () => close(null));
    confirmButton.addEventListener("click", () => close(select.value));
    select.focus();
  });
}

async function inheritRunningHubWork(targetTextareaId = "runninghub_worker", targetWorkeridKey = "runninghub_workerid", targetWorkerKey = "runninghub_worker") {
  const settings3 = extension_settings[extensionName];
  const el = document.getElementById(targetTextareaId);
  if (!el) return;
  let currentWf;
  try {
    currentWf = JSON.parse(el.value.trim() || "{}");
  } catch (e) {
    alert("\u5F53\u524D\u5DE5\u4F5C\u6D41 JSON \u683C\u5F0F\u9519\u8BEF\uFF0C\u8BF7\u5148\u68C0\u67E5\u683C\u5F0F: " + e.message);
    return;
  }
  const allWorkers = settings3.runninghub_workers || {};
  const currentName = settings3[targetWorkeridKey] || "";
  const candidateNames = Object.keys(allWorkers).filter((name) => name !== currentName);
  if (candidateNames.length === 0) {
    toastr.warning("\u6682\u65E0\u53EF\u7EE7\u627F\u7684\u5176\u4ED6\u5DE5\u4F5C\u6D41\u9884\u8BBE\uFF0C\u8BF7\u5148\u65B0\u5EFA\u6216\u5BFC\u5165\u6A21\u677F\u9884\u8BBE\u3002");
    return;
  }
  const selectedParentName = await showInheritWorkflowSelectModal(candidateNames, currentName);
  if (!selectedParentName) return;
  let parentWf;
  try {
    const parentRaw = allWorkers[selectedParentName];
    parentWf = typeof parentRaw === "string" ? JSON.parse(parentRaw) : parentRaw;
  } catch (e) {
    alert(`\u7236\u5DE5\u4F5C\u6D41\u3010${selectedParentName}\u3011JSON \u89E3\u6790\u5931\u8D25: ` + e.message);
    return;
  }
  if (!parentWf || typeof parentWf !== "object") {
    toastr.error(`\u7236\u5DE5\u4F5C\u6D41\u3010${selectedParentName}\u3011\u5185\u5BB9\u65E0\u6548`);
    return;
  }
  const isPlaceholderVal = (val) => typeof val === "string" && /%[^%]+%/.test(val);
  let updatedCount = 0;
  const updatedNodes = /* @__PURE__ */ new Set();
  const skippedTypeMismatchNodes = /* @__PURE__ */ new Set();
  for (const nodeId in parentWf) {
    if (!parentWf.hasOwnProperty(nodeId) || nodeId === "_meta") continue;
    const parentNode = parentWf[nodeId];
    const currentNode = currentWf[nodeId];
    if (!currentNode || !parentNode || typeof parentNode !== "object" || typeof currentNode !== "object") continue;
    const parentType = parentNode.class_type || parentNode.type;
    const currentType = currentNode.class_type || currentNode.type;
    if (parentType && currentType && parentType !== currentType) {
      skippedTypeMismatchNodes.add(nodeId);
      continue;
    }
    const parentInputs = parentNode.inputs || {};
    if (!currentNode.inputs || typeof currentNode.inputs !== "object") {
      currentNode.inputs = {};
    }
    for (const inputKey in parentInputs) {
      if (!parentInputs.hasOwnProperty(inputKey)) continue;
      const parentVal = parentInputs[inputKey];
      if (isPlaceholderVal(parentVal)) {
        if (currentNode.inputs[inputKey] !== parentVal) {
          currentNode.inputs[inputKey] = parentVal;
          updatedCount++;
          updatedNodes.add(nodeId);
        }
      }
    }
  }
  if (updatedCount > 0) {
    const newJsonStr = JSON.stringify(currentWf, null, 2);
    el.value = newJsonStr;
    if (currentName) {
      settings3.runninghub_workers[currentName] = newJsonStr;
    }
    settings3[targetWorkerKey] = newJsonStr;
    saveSettingsDebounced();
    let tip = `\u5DF2\u4ECE\u7236\u5DE5\u4F5C\u6D41\u3010${selectedParentName}\u3011\u6210\u529F\u7EE7\u627F ${updatedNodes.size} \u4E2A\u8282\u70B9\u7684 ${updatedCount} \u5904\u5360\u4F4D\u7B26\u4FEE\u6539\uFF01`;
    if (skippedTypeMismatchNodes.size > 0) {
      tip += ` (\u5DF2\u5B89\u5168\u8DF3\u8FC7 ${skippedTypeMismatchNodes.size} \u4E2A\u7C7B\u578B\u4E0D\u5339\u914D\u7684\u8282\u70B9)`;
    }
    toastr.success(tip);
  } else {
    let tip = `\u672A\u5728\u7236\u5DE5\u4F5C\u6D41\u3010${selectedParentName}\u3011\u4E2D\u627E\u5230\u53EF\u5339\u914D\u5F53\u524D\u8282\u70B9 ID \u4E0E\u7C7B\u578B\u7684\u65B0\u5360\u4F4D\u7B26\u3002`;
    if (skippedTypeMismatchNodes.size > 0) {
      tip += ` (\u68C0\u6D4B\u5230 ${skippedTypeMismatchNodes.size} \u4E2A\u540C\u540D\u8282\u70B9\u56E0\u7C7B\u578B\u4E0D\u5339\u914D\u5DF2\u88AB\u5B89\u5168\u8DF3\u8FC7)`;
    }
    toastr.info(tip);
  }
}

function showRunningHubPlaceholderMenu(buttonElement, inputElement, inputName, onChange, defaultValue = "") {
  if (!buttonElement) return;
  const existingMenu = document.querySelector(".st-chatu8-placeholder-menu");
  if (existingMenu) existingMenu.remove();
  const menu = document.createElement("div");
  menu.className = "st-chatu8-placeholder-menu";
  RUNNINGHUB_PLACEHOLDER_MAP.forEach((item) => {
    const menuItem = document.createElement("div");
    menuItem.className = "st-chatu8-placeholder-menu-item";
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
  const menuWidth = 260;
  const menuHeight = 380;
  let left = btnRect.left;
  let top = btnRect.bottom + 5;
  if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 10;
  if (left < 10) left = 10;
  if (top + menuHeight > window.innerHeight) {
    top = btnRect.top - menuHeight - 5;
    if (top < 10) top = 10;
  }
  menu.style.position = "fixed";
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.maxHeight = "400px";
  menu.style.overflowY = "auto";
  menu.style.zIndex = "1000002";
  document.body.appendChild(menu);
  const closeHandler = (e) => {
    if (!menu.contains(e.target) && e.target !== buttonElement) {
      menu.remove();
      document.removeEventListener("click", closeHandler);
    }
  };
  setTimeout(() => document.addEventListener("click", closeHandler), 0);
}

function wrapWithRunningHubPlaceholderButton(inputElement, inputName, onChange, defaultValue = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "st-chatu8-workflow-viz-input-wrapper";
  wrapper.appendChild(inputElement);
  const placeholderBtn = document.createElement("button");
  placeholderBtn.type = "button";
  placeholderBtn.className = "st-chatu8-placeholder-btn";
  placeholderBtn.innerHTML = '<i class="fa-solid fa-code"></i>';
  placeholderBtn.title = "\u9009\u62E9 RunningHub \u5360\u4F4D\u7B26";
  placeholderBtn.onclick = (e) => {
    e.stopPropagation();
    showRunningHubPlaceholderMenu(placeholderBtn, inputElement, inputName, onChange, defaultValue);
  };
  wrapper.appendChild(placeholderBtn);
  return wrapper;
}

function renderRunningHubNodeProperties(panel, node, workflow, onUpdate) {
  const displayName = node.meta.title || node.classType;
  panel.innerHTML = `
        <div class="st-chatu8-workflow-viz-properties-header">
            <h4>${displayName}</h4>
            <span class="node-id">#${node.id} \xB7 ${node.classType}</span>
        </div>
        <div class="st-chatu8-workflow-viz-properties-content" id="viz-properties-inputs"></div>
    `;
  const inputsContainer = panel.querySelector("#viz-properties-inputs");
  for (const [inputName, currentValue] of Object.entries(node.inputs || {})) {
    const isConnection = Array.isArray(currentValue) && currentValue.length === 2 && typeof currentValue[0] === "string";
    const group = document.createElement("div");
    group.className = "st-chatu8-workflow-viz-property-group";
    const label = document.createElement("label");
    label.textContent = inputName;
    if (isConnection) {
      const badge = document.createElement("span");
      badge.className = "connection-badge";
      badge.textContent = "\u8FDE\u7EBF";
      label.appendChild(badge);
    }
    group.appendChild(label);
    if (isConnection) {
      const connectionDisplay = document.createElement("div");
      connectionDisplay.className = "connection-display";
      connectionDisplay.textContent = `\u2190 \u8282\u70B9 #${currentValue[0]} \u8F93\u51FA ${currentValue[1]}`;
      group.appendChild(connectionDisplay);
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = currentValue == null ? "" : String(currentValue);
      input.className = "st-chatu8-text-input";
      input.onchange = () => {
        workflow[node.id].inputs[inputName] = input.value;
        node.inputs[inputName] = input.value;
        if (onUpdate) onUpdate();
      };
      const control = wrapWithRunningHubPlaceholderButton(input, inputName, (newValue) => {
        workflow[node.id].inputs[inputName] = newValue;
        node.inputs[inputName] = newValue;
        if (onUpdate) onUpdate();
      }, String(currentValue));
      group.appendChild(control);
    }
    inputsContainer.appendChild(group);
  }
}

async function visualizeRunningHubWorkflow(targetTextareaId = "runninghub_worker", targetWorkeridKey = "runninghub_workerid", targetWorkerKey = "runninghub_worker") {
  const settings3 = extension_settings[extensionName];
  const workerEl = document.getElementById(targetTextareaId);
  const rawJson = (workerEl ? workerEl.value : settings3[targetWorkerKey]) || settings3.runninghub_workers?.[settings3[targetWorkeridKey]] || "";
  let workflow;
  try {
    workflow = JSON.parse(rawJson);
  } catch (e) {
    alert("\u5DE5\u4F5C\u6D41 JSON \u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F\u662F\u5426\u6B63\u786E: " + e.message);
    return;
  }
  if (isComfyUIFullWorkflow2(workflow)) {
    alert("\u68C0\u6D4B\u5230\u5F53\u524D\u5DE5\u4F5C\u6D41\u4E3A ComfyUI \u5B8C\u6574\u683C\u5F0F\uFF08\u5305\u542B UI/\u753B\u5E03 \u4FE1\u606F\uFF09\u3002\n\n\u53EF\u89C6\u5316\u7F16\u8F91\u5668\u4EC5\u652F\u6301 ComfyUI/RunningHub API \u683C\u5F0F\u5DE5\u4F5C\u6D41\uFF0C\u8BF7\u5148\u5BFC\u51FA\u4E3A API \u683C\u5F0F\u3002");
    return;
  }
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>RunningHub \u5DE5\u4F5C\u6D41\u53EF\u89C6\u5316\u4E0E\u5360\u4F4D\u7B26\u7F16\u8F91</h3>
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
                        <p>\u70B9\u51FB\u8282\u70B9\u67E5\u770B\u5E76\u66FF\u6362 RunningHub \u4E13\u5C5E\u5360\u4F4D\u7B26</p>
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
    if (workflow.hasOwnProperty(nodeId) && nodeId !== "_meta") {
      const nodeData = workflow[nodeId];
      if (!nodeData || typeof nodeData !== "object") continue;
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
    const color = getClassColor(node.classType);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", nodeWidth);
    rect.setAttribute("height", nodeHeight);
    rect.setAttribute("rx", "8");
    rect.setAttribute("fill", "#2a2a3e");
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-width", "2");
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
    typeText.textContent = displayName.length > 18 ? displayName.substring(0, 16) + "..." : displayName;
    g.appendChild(typeText);
    const inputCount = Object.keys(node.inputs).length;
    const inputText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    inputText.setAttribute("x", "10");
    inputText.setAttribute("y", "54");
    inputText.setAttribute("fill", "#777");
    inputText.setAttribute("font-size", "10");
    inputText.textContent = `\u8F93\u5165\u9879: ${inputCount}`;
    g.appendChild(inputText);
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `\u8282\u70B9 #${node.id}
\u7C7B\u578B: ${node.classType}
\u6807\u9898: ${displayName}`;
    g.appendChild(title);
    g.setAttribute("data-node-id", node.id);
    g.onclick = (e) => {
      e.stopPropagation();
      svg.querySelectorAll(".st-chatu8-workflow-viz-node.selected").forEach((el) => {
        el.classList.remove("selected");
      });
      g.classList.add("selected");
      selectedNodeId = node.id;
      renderRunningHubNodeProperties(propertiesPanel, node, workflow, () => {
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
  let dragStartX = 0, dragStartY = 0;
  let scrollStartX = 0, scrollStartY = 0;
  container.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".st-chatu8-workflow-viz-node")) {
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
  const endDrag = () => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = "grab";
    }
  };
  container.addEventListener("mouseup", endDrag);
  container.addEventListener("mouseleave", endDrag);
  backdrop.querySelector("#viz-save-workflow").onclick = async () => {
    try {
      const workflowJson = JSON.stringify(workflow, null, 2);
      if (workerEl) {
        workerEl.value = workflowJson;
        $(workerEl).trigger("input");
      }
      const presetName = settings3[targetWorkeridKey];
      if (!presetName) {
        const newName = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u914D\u7F6E\u540D\u79F0\uFF1A");
        if (newName && newName.trim()) {
          const name = newName.trim();
          settings3.runninghub_workers[name] = workflowJson;
          settings3[targetWorkeridKey] = name;
          settings3[targetWorkerKey] = workflowJson;
          saveSettingsDebounced();
          toastr.success(`\u5DE5\u4F5C\u6D41\u5DF2\u4FDD\u5B58\u4E3A "${name}"`);
        }
      } else {
        settings3.runninghub_workers[presetName] = workflowJson;
        settings3[targetWorkerKey] = workflowJson;
        saveSettingsDebounced();
        toastr.success(`\u5DE5\u4F5C\u6D41 "${presetName}" \u5DF2\u4FDD\u5B58\uFF01`);
      }
    } catch (e) {
      alert("\u4FDD\u5B58\u5931\u8D25: " + e.message);
    }
  };
}

export { inheritRunningHubWork, isComfyUIFullWorkflow2, isRawComfyUIWorkflow2, visualizeRunningHubWorkflow };
