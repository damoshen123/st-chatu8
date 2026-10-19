// 还原自打包产物 — 原始模块: utils/settings/vibeGroupEditor.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { deleteConfigImage, getConfigImage, getConfigText, saveConfigImage, saveConfigText } from "../configDatabase.js";
import { createBulkSelectControls } from "./bulkSelectControls.js";
import { __set_vibeThumbnailWarmupPromise, vibeDataCache, vibeThumbnailCache, vibeThumbnailPending, vibeThumbnailWarmupPromise } from "../novelai.js";
import { ensureVibeDataStoredByPreference, getVibeStorageOptions } from "./vibeStorageMigration.js";

function ensureVibeGroupPresets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.vibeGroups || typeof settings3.vibeGroups !== "object" || Array.isArray(settings3.vibeGroups)) {
    if (settings3.vibeGroups) {
      console.error("[VibeGroup] Corrupted vibeGroups data detected, resetting to default:", settings3.vibeGroups);
    }
    settings3.vibeGroups = {
      "\u9ED8\u8BA4\u7EC4": {
        vibes: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
    console.log("[VibeGroup] Initialized vibeGroups with default group");
  }
  for (const groupName in settings3.vibeGroups) {
    const group = settings3.vibeGroups[groupName];
    if (!group || typeof group !== "object") {
      console.error("[VibeGroup] Corrupted group data for:", groupName, "- removing");
      delete settings3.vibeGroups[groupName];
      continue;
    }
    if (!Array.isArray(group.vibes)) {
      console.warn("[VibeGroup] Group missing vibes array:", groupName, "- initializing");
      group.vibes = [];
    }
    if (typeof group.createdAt !== "number") {
      group.createdAt = Date.now();
    }
    if (typeof group.updatedAt !== "number") {
      group.updatedAt = Date.now();
    }
  }
  if (Object.keys(settings3.vibeGroups).length === 0) {
    console.warn("[VibeGroup] No valid groups found, creating default group");
    settings3.vibeGroups["\u9ED8\u8BA4\u7EC4"] = {
      vibes: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  if (!settings3.vibeGroupId || !settings3.vibeGroups[settings3.vibeGroupId]) {
    const firstGroupName = Object.keys(settings3.vibeGroups)[0];
    settings3.vibeGroupId = firstGroupName || "\u9ED8\u8BA4\u7EC4";
    console.log("[VibeGroup] Set vibeGroupId to:", settings3.vibeGroupId);
  }
  return settings3.vibeGroups;
}

function showVibeGroupEditorDialog() {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const settings3 = extension_settings[extensionName];
  ensureVibeGroupPresets();
  void warmMissingVibePresetThumbnails();
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-vibe-group-editor-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>Vibe \u7EC4\u7F16\u8F91\u5668</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-body" style="padding: 2rem;">
                <div class="st-chatu8-vibe-group-editor-content">
                    <!-- Group Preset Selector -->
                    <div class="st-chatu8-field" style="margin-bottom: 1.2rem;">
                        <label for="vibe-group-select">Vibe \u7EC4\u9884\u8BBE</label>
                        <div class="st-chatu8-profile-controls">
                            <select id="vibe-group-select" class="st-chatu8-select"></select>
                            <button class="st-chatu8-icon-btn" id="vibe-group-visual-select" title="\u53EF\u89C6\u5316\u9009\u62E9">
                                <i class="fa-solid fa-grip"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-group-new" title="\u65B0\u5EFA\u7EC4">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-group-save" title="\u4FDD\u5B58\u5F53\u524D\u7EC4">
                                <i class="fa-solid fa-save"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-group-export-current" title="\u5BFC\u51FA\u5F53\u524D\u7EC4">
                                <i class="fa-solid fa-upload"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-group-export-all" title="\u5BFC\u51FA\u5168\u90E8\u7EC4">
                                <i class="fa-solid fa-file-export"></i>
                            </button>
                            <button class="st-chatu8-icon-btn" id="vibe-group-import" title="\u5BFC\u5165\u7EC4">
                                <i class="fa-solid fa-download"></i>
                            </button>
                            <button class="st-chatu8-icon-btn danger" id="vibe-group-delete" title="\u5220\u9664\u5F53\u524D\u7EC4">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Add Vibe Button -->
                    <button type="button" class="st-chatu8-btn" id="vibe-group-add-vibe" style="width: 100%; padding: 1rem; font-size: 16px; font-weight: 600; margin-bottom: 1.5rem;">
                        <i class="fa-solid fa-plus"></i> \u6DFB\u52A0 Vibe (0/4)
                    </button>

                    <!-- Vibe Slots Container -->
                    <div id="vibe-slots-container" class="st-chatu8-vibe-slots">
                        <!-- Dynamically rendered slots (0-4) -->
                    </div>

                    <!-- Status Message Area -->
                    <div id="vibe-group-status" style="margin-top: 1.5rem; padding: 1rem; border-radius: 6px; font-size: 0.9rem; display: none; line-height: 1.4;"></div>
                </div>
            </div>
        </div>
    `;
  parent.appendChild(backdrop);
  const closeBtn = backdrop.querySelector(".st-chatu8-workflow-viz-close");
  const closeDialog = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
  };
  if (closeBtn) {
    closeBtn.onclick = closeDialog;
    closeBtn.addEventListener("touchend", closeDialog, { passive: false });
  }
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      closeDialog(e);
    }
  };
  const groupSelect = document.getElementById("vibe-group-select");
  const visualSelectBtn = document.getElementById("vibe-group-visual-select");
  const newBtn = document.getElementById("vibe-group-new");
  const saveBtn = document.getElementById("vibe-group-save");
  const deleteBtn = document.getElementById("vibe-group-delete");
  const exportCurrentBtn = document.getElementById("vibe-group-export-current");
  const exportAllBtn = document.getElementById("vibe-group-export-all");
  const importBtn = document.getElementById("vibe-group-import");
  const addVibeBtn = document.getElementById("vibe-group-add-vibe");
  const slotsContainer = document.getElementById("vibe-slots-container");
  const statusDiv = document.getElementById("vibe-group-status");
  loadGroupPresetList(groupSelect);
  visualSelectBtn.onclick = () => {
    showVibeGroupVisualSelector((selectedPresetName) => {
      settings3.vibeGroupId = selectedPresetName;
      groupSelect.value = selectedPresetName;
      renderVibeSlots(slotsContainer, groupSelect, addVibeBtn);
      try {
        saveSettingsDebounced();
        console.log("[VibeGroup] Selected preset from visual selector:", selectedPresetName);
      } catch (error) {
        console.error("[VibeGroup] Failed to save settings after preset selection:", {
          error: error.message,
          errorName: error.name,
          presetName: selectedPresetName,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          stack: error.stack
        });
        alert(`\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25: ${error.message}`);
      }
    });
  };
  newBtn.onclick = () => createNewGroup(groupSelect, statusDiv, slotsContainer, addVibeBtn);
  saveBtn.onclick = () => saveCurrentGroup(groupSelect, statusDiv);
  deleteBtn.onclick = () => deleteCurrentGroup(groupSelect, statusDiv);
  addVibeBtn.onclick = () => {
    const settings4 = extension_settings[extensionName];
    const vibeGroups = settings4.vibeGroups || {};
    const currentGroupId = groupSelect.value;
    const currentGroup = vibeGroups[currentGroupId];
    if (!currentGroup) {
      showStatus(statusDiv, "\u9519\u8BEF: \u672A\u9009\u62E9\u7EC4\u3002\u8BF7\u5148\u9009\u62E9\u6216\u521B\u5EFA\u4E00\u4E2A\u7EC4\u3002", "error");
      console.error("[VibeGroup] No group selected when attempting to add Vibe");
      return;
    }
    const vibes = currentGroup.vibes || [];
    if (vibes.length >= 4) {
      showStatus(statusDiv, "\u5DF2\u8FBE\u5230\u6700\u5927\u6570\u91CF (4\u4E2A)\u3002\u6BCF\u4E2A\u7EC4\u6700\u591A\u53EF\u5305\u542B 4 \u4E2A Vibe\u3002", "error");
      console.warn("[VibeGroup] Maximum Vibe limit reached for group:", currentGroupId);
      return;
    }
    try {
      showVibeVisualSelector((vibeDataId) => {
        try {
          if (!vibeDataId || typeof vibeDataId !== "string") {
            showStatus(statusDiv, "\u9519\u8BEF: \u65E0\u6548\u7684 Vibe \u6570\u636E ID", "error");
            console.error("[VibeGroup] Invalid vibeDataId received:", vibeDataId);
            return;
          }
          currentGroup.vibes.push({
            vibeDataId,
            strength: 0.6
            // Default strength
          });
          currentGroup.updatedAt = Date.now();
          try {
            saveSettingsDebounced();
          } catch (error) {
            console.error("[VibeGroup] Failed to save settings after adding Vibe:", {
              vibeDataId: vibeDataId.substring(0, 12) + "...",
              error: error.message,
              errorName: error.name,
              groupId: currentGroupId,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              stack: error.stack
            });
            showStatus(statusDiv, `\u9519\u8BEF: \u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25 - ${error.message}`, "error");
            return;
          }
          renderVibeSlots(slotsContainer, groupSelect, addVibeBtn);
          showStatus(statusDiv, "Vibe \u5DF2\u6210\u529F\u6DFB\u52A0\u5230\u7EC4", "success");
          console.log("[VibeGroup] Successfully added Vibe to group:", currentGroupId, vibeDataId);
        } catch (error) {
          console.error("[VibeGroup] Error adding Vibe to group:", {
            error: error.message,
            errorName: error.name,
            groupId: currentGroupId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            stack: error.stack
          });
          showStatus(statusDiv, `\u9519\u8BEF: \u6DFB\u52A0 Vibe \u5931\u8D25 - ${error.message}`, "error");
        }
      });
    } catch (error) {
      console.error("[VibeGroup] Error opening visual selector:", {
        error: error.message,
        errorName: error.name,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        stack: error.stack
      });
      showStatus(statusDiv, `\u9519\u8BEF: \u65E0\u6CD5\u6253\u5F00 Vibe \u9009\u62E9\u5668 - ${error.message}`, "error");
    }
  };
  exportCurrentBtn.onclick = async () => {
    const currentGroupId = groupSelect.value;
    if (!currentGroupId) {
      showStatus(statusDiv, "\u9519\u8BEF: \u672A\u9009\u62E9\u7EC4\u3002\u8BF7\u5148\u9009\u62E9\u8981\u5BFC\u51FA\u7684\u7EC4\u3002", "error");
      console.error("[VibeGroup] No group selected for export");
      return;
    }
    try {
      showStatus(statusDiv, "\u6B63\u5728\u5BFC\u51FA...", "info");
      await exportVibeGroup(currentGroupId);
      showStatus(statusDiv, `\u5DF2\u6210\u529F\u5BFC\u51FA\u7EC4 "${currentGroupId}"`, "success");
      console.log("[VibeGroup] Successfully exported group:", currentGroupId);
    } catch (error) {
      const errorMessage = error.message || "\u672A\u77E5\u9519\u8BEF";
      console.error("[VibeGroup] Export failed:", {
        groupId: currentGroupId,
        error: error.message,
        errorName: error.name,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        stack: error.stack
      });
      showStatus(statusDiv, `\u5BFC\u51FA\u5931\u8D25: ${errorMessage}\u3002\u8BF7\u68C0\u67E5\u63A7\u5236\u53F0\u4EE5\u83B7\u53D6\u8BE6\u7EC6\u4FE1\u606F\u3002`, "error");
    }
  };
  exportAllBtn.onclick = async () => {
    const settings4 = extension_settings[extensionName];
    const vibeGroups = settings4.vibeGroups || {};
    const groupCount = Object.keys(vibeGroups).length;
    if (groupCount === 0) {
      showStatus(statusDiv, "\u9519\u8BEF: \u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u7EC4\u3002\u8BF7\u5148\u521B\u5EFA\u81F3\u5C11\u4E00\u4E2A\u7EC4\u3002", "error");
      console.warn("[VibeGroup] No groups available for export");
      return;
    }
    try {
      showStatus(statusDiv, `\u6B63\u5728\u5BFC\u51FA ${groupCount} \u4E2A\u7EC4...`, "info");
      await exportAllVibeGroups();
      showStatus(statusDiv, `\u5DF2\u6210\u529F\u5BFC\u51FA\u5168\u90E8 ${groupCount} \u4E2A\u7EC4`, "success");
      console.log("[VibeGroup] Successfully exported all groups:", groupCount);
    } catch (error) {
      const errorMessage = error.message || "\u672A\u77E5\u9519\u8BEF";
      console.error("[VibeGroup] Export all failed:", {
        groupCount,
        error: error.message,
        errorName: error.name,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        stack: error.stack
      });
      showStatus(statusDiv, `\u5BFC\u51FA\u5931\u8D25: ${errorMessage}\u3002\u8BF7\u68C0\u67E5\u63A7\u5236\u53F0\u4EE5\u83B7\u53D6\u8BE6\u7EC6\u4FE1\u606F\u3002`, "error");
    }
  };
  importBtn.onclick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      try {
        showStatus(statusDiv, "\u6B63\u5728\u5BFC\u5165...", "info");
        const fileContent = await readFileAsText(file);
        const result = await importVibeGroup(fileContent);
        if (result.success) {
          let message = `\u6210\u529F\u5BFC\u5165 ${result.groupsImported} \u4E2A\u7EC4\u3001${result.vibesImported} \u4E2A Vibe\u3001${result.presetsImported} \u4E2A\u9884\u8BBE`;
          if (result.warnings.length > 0) {
            message += `

\u8B66\u544A (${result.warnings.length} \u4E2A):
`;
            const displayWarnings = result.warnings.slice(0, 3);
            message += displayWarnings.map((w) => `\u2022 ${w}`).join("\n");
            if (result.warnings.length > 3) {
              message += `
\u2022 ... \u8FD8\u6709 ${result.warnings.length - 3} \u4E2A\u8B66\u544A`;
            }
            message += "\n\n\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u4EE5\u83B7\u53D6\u5B8C\u6574\u7684\u8B66\u544A\u5217\u8868\u3002";
            console.warn("[VibeGroup] Import warnings:", result.warnings);
          }
          showStatus(statusDiv, message, result.warnings.length > 0 ? "info" : "success");
          loadGroupPresetList(groupSelect);
          renderVibeSlots(slotsContainer, groupSelect, addVibeBtn);
        } else {
          let errorMessage = "\u5BFC\u5165\u5931\u8D25";
          if (result.errors.length > 0) {
            errorMessage += ":\n\n";
            errorMessage += result.errors.map((e2) => `\u2022 ${e2}`).join("\n");
            errorMessage += "\n\n\u8BF7\u68C0\u67E5\u6587\u4EF6\u683C\u5F0F\u662F\u5426\u6B63\u786E\u3002";
          }
          showStatus(statusDiv, errorMessage, "error");
          console.error("[VibeGroup] Import errors:", result.errors);
        }
      } catch (error) {
        console.error("[VibeGroup] Import error:", {
          error: error.message,
          errorName: error.name,
          fileSize: file.size,
          fileName: file.name,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          stack: error.stack
        });
        const errorMessage = `\u5BFC\u5165\u5931\u8D25: ${error.message || "\u672A\u77E5\u9519\u8BEF"}\u3002

\u53EF\u80FD\u7684\u539F\u56E0:
\u2022 \u6587\u4EF6\u683C\u5F0F\u4E0D\u6B63\u786E
\u2022 \u6587\u4EF6\u5DF2\u635F\u574F
\u2022 \u6D4F\u89C8\u5668\u5B58\u50A8\u7A7A\u95F4\u4E0D\u8DB3

\u8BF7\u68C0\u67E5\u63A7\u5236\u53F0\u4EE5\u83B7\u53D6\u8BE6\u7EC6\u4FE1\u606F\u3002`;
        showStatus(statusDiv, errorMessage, "error");
      } finally {
        document.body.removeChild(fileInput);
      }
    };
    document.body.appendChild(fileInput);
    fileInput.click();
  };
  renderVibeSlots(slotsContainer, groupSelect, addVibeBtn);
  groupSelect.onchange = () => {
    settings3.vibeGroupId = groupSelect.value;
    renderVibeSlots(slotsContainer, groupSelect, addVibeBtn);
  };
  console.log("[VibeGroup] Dialog opened");
}

function loadGroupPresetList(selectElement) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const currentGroupId = settings3.vibeGroupId || "\u9ED8\u8BA4\u7EC4";
  selectElement.innerHTML = "";
  const groupNames = Object.keys(vibeGroups).sort((a, b) => {
    if (a === "\u9ED8\u8BA4\u7EC4") return -1;
    if (b === "\u9ED8\u8BA4\u7EC4") return 1;
    return a.localeCompare(b, "zh-CN");
  });
  groupNames.forEach((groupName) => {
    const option = document.createElement("option");
    option.value = groupName;
    option.textContent = groupName;
    if (groupName === currentGroupId) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
  console.log("[VibeGroup] Loaded preset list:", groupNames.length, "groups");
}

function createNewGroup(selectElement, statusDiv, slotsContainer, addVibeBtn) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const groupName = prompt("\u8BF7\u8F93\u5165\u65B0\u7EC4\u540D\u79F0:");
  if (!groupName) {
    return;
  }
  const trimmedName = groupName.trim();
  if (!trimmedName) {
    showStatus(statusDiv, "\u7EC4\u540D\u4E0D\u80FD\u4E3A\u7A7A", "error");
    return;
  }
  if (vibeGroups[trimmedName]) {
    showStatus(statusDiv, `\u7EC4\u540D "${trimmedName}" \u5DF2\u5B58\u5728`, "error");
    return;
  }
  vibeGroups[trimmedName] = {
    vibes: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  settings3.vibeGroupId = trimmedName;
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[VibeGroup] Failed to save settings after creating new group:", {
      groupName: trimmedName,
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
    showStatus(statusDiv, `\u521B\u5EFA\u6210\u529F\u4F46\u4FDD\u5B58\u5931\u8D25: ${error.message}`, "error");
    return;
  }
  loadGroupPresetList(selectElement);
  renderVibeSlots(slotsContainer, selectElement, addVibeBtn);
  showStatus(statusDiv, `\u5DF2\u521B\u5EFA\u65B0\u7EC4 "${trimmedName}"`, "success");
  console.log("[VibeGroup] Created new group:", trimmedName);
}

function saveCurrentGroup(selectElement, statusDiv) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const currentGroupId = selectElement.value;
  if (!currentGroupId) {
    showStatus(statusDiv, "\u672A\u9009\u62E9\u7EC4", "error");
    return;
  }
  const currentGroup = vibeGroups[currentGroupId];
  if (!currentGroup) {
    showStatus(statusDiv, "\u5F53\u524D\u7EC4\u4E0D\u5B58\u5728", "error");
    return;
  }
  currentGroup.updatedAt = Date.now();
  settings3.vibeGroupId = currentGroupId;
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[VibeGroup] Failed to save settings after saving group:", {
      groupId: currentGroupId,
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
    showStatus(statusDiv, `\u4FDD\u5B58\u5931\u8D25: ${error.message}`, "error");
    return;
  }
  showStatus(statusDiv, `\u5DF2\u4FDD\u5B58\u7EC4 "${currentGroupId}"`, "success");
  console.log("[VibeGroup] Saved group:", currentGroupId);
}

function deleteCurrentGroup(selectElement, statusDiv) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const currentGroupId = selectElement.value;
  if (!currentGroupId) {
    showStatus(statusDiv, "\u672A\u9009\u62E9\u7EC4", "error");
    return;
  }
  if (currentGroupId === "\u9ED8\u8BA4\u7EC4" && Object.keys(vibeGroups).length === 1) {
    showStatus(statusDiv, "\u4E0D\u80FD\u5220\u9664\u552F\u4E00\u7684\u7EC4", "error");
    return;
  }
  const confirmed = confirm(`\u786E\u5B9A\u8981\u5220\u9664\u7EC4 "${currentGroupId}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002`);
  if (!confirmed) {
    return;
  }
  delete vibeGroups[currentGroupId];
  if (vibeGroups["\u9ED8\u8BA4\u7EC4"]) {
    settings3.vibeGroupId = "\u9ED8\u8BA4\u7EC4";
  } else {
    const remainingGroups = Object.keys(vibeGroups);
    settings3.vibeGroupId = remainingGroups.length > 0 ? remainingGroups[0] : "\u9ED8\u8BA4\u7EC4";
    if (remainingGroups.length === 0) {
      vibeGroups["\u9ED8\u8BA4\u7EC4"] = {
        vibes: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      settings3.vibeGroupId = "\u9ED8\u8BA4\u7EC4";
    }
  }
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[VibeGroup] Failed to save settings after deleting group:", {
      groupId: currentGroupId,
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
    showStatus(statusDiv, `\u5220\u9664\u6210\u529F\u4F46\u4FDD\u5B58\u5931\u8D25: ${error.message}`, "error");
  }
  loadGroupPresetList(selectElement);
  const slotsContainer = document.getElementById("vibe-group-slots");
  const addVibeBtn = document.getElementById("vibe-group-add-vibe");
  if (slotsContainer && addVibeBtn) {
    renderVibeSlots(slotsContainer, selectElement, addVibeBtn);
  }
  showStatus(statusDiv, `\u5DF2\u5220\u9664\u7EC4 "${currentGroupId}"`, "success");
  console.log("[VibeGroup] Deleted group:", currentGroupId);
}

function showStatus(statusDiv, message, type = "info") {
  statusDiv.textContent = message;
  statusDiv.style.display = "block";
  if (type === "success") {
    statusDiv.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
    statusDiv.style.color = "#4caf50";
    statusDiv.style.border = "1px solid rgba(76, 175, 80, 0.3)";
  } else if (type === "error") {
    statusDiv.style.backgroundColor = "rgba(244, 67, 54, 0.1)";
    statusDiv.style.color = "#f44336";
    statusDiv.style.border = "1px solid rgba(244, 67, 54, 0.3)";
  } else {
    statusDiv.style.backgroundColor = "rgba(33, 150, 243, 0.1)";
    statusDiv.style.color = "#2196f3";
    statusDiv.style.border = "1px solid rgba(33, 150, 243, 0.3)";
  }
  setTimeout(() => {
    statusDiv.style.display = "none";
  }, 5e3);
}

async function renderVibeSlots(slotsContainer, groupSelect, addVibeBtn) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const currentGroupId = groupSelect.value;
  const currentGroup = vibeGroups[currentGroupId];
  slotsContainer.innerHTML = "";
  if (!currentGroup) {
    console.warn("[VibeGroup] Current group not found:", currentGroupId);
    slotsContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: rgba(255, 255, 255, 0.5);">
                <i class="fa-solid fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>\u65E0\u6CD5\u52A0\u8F7D\u7EC4\u6570\u636E</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">\u8BF7\u5C1D\u8BD5\u9009\u62E9\u5176\u4ED6\u7EC4\u6216\u521B\u5EFA\u65B0\u7EC4</p>
            </div>
        `;
    addVibeBtn.disabled = true;
    addVibeBtn.style.opacity = "0.5";
    return;
  }
  if (!Array.isArray(currentGroup.vibes)) {
    console.error("[VibeGroup] Corrupted group data - vibes is not an array:", currentGroupId, currentGroup);
    currentGroup.vibes = [];
    currentGroup.updatedAt = Date.now();
    saveSettingsDebounced();
    console.log("[VibeGroup] Fixed corrupted group data by initializing empty vibes array");
  }
  const vibes = currentGroup.vibes;
  const validVibes = [];
  for (let i = 0; i < vibes.length; i++) {
    const vibeRef = vibes[i];
    if (!vibeRef || typeof vibeRef !== "object") {
      console.warn("[VibeGroup] Invalid Vibe reference at index", i, "- skipping:", vibeRef);
      continue;
    }
    if (!vibeRef.vibeDataId || typeof vibeRef.vibeDataId !== "string") {
      console.warn("[VibeGroup] Missing vibeDataId at index", i, "- skipping:", vibeRef);
      continue;
    }
    if (typeof vibeRef.strength !== "number") {
      console.warn("[VibeGroup] Invalid strength at index", i, "- using default:", vibeRef);
      vibeRef.strength = 0.6;
    }
    validVibes.push(vibeRef);
  }
  if (validVibes.length !== vibes.length) {
    console.log("[VibeGroup] Cleaned up corrupted Vibe references:", vibes.length, "->", validVibes.length);
    currentGroup.vibes = validVibes;
    currentGroup.updatedAt = Date.now();
    saveSettingsDebounced();
  }
  const vibeCount = validVibes.length;
  addVibeBtn.innerHTML = `<i class="fa-solid fa-plus"></i> \u6DFB\u52A0 Vibe (${vibeCount}/4)`;
  if (vibeCount >= 4) {
    addVibeBtn.disabled = true;
    addVibeBtn.style.opacity = "0.5";
    addVibeBtn.style.cursor = "not-allowed";
  } else {
    addVibeBtn.disabled = false;
    addVibeBtn.style.opacity = "1";
    addVibeBtn.style.cursor = "pointer";
  }
  for (let i = 0; i < validVibes.length; i++) {
    const vibeRef = validVibes[i];
    await updateVibeSlot(slotsContainer, i, vibeRef, groupSelect, addVibeBtn);
  }
  console.log("[VibeGroup] Rendered", validVibes.length, "Vibe slots");
}

function parseVibeDataFromDataUrl(dataUrlOrObject) {
  try {
    if (dataUrlOrObject && typeof dataUrlOrObject === "object" && !Array.isArray(dataUrlOrObject)) {
      return dataUrlOrObject;
    }
    if (typeof dataUrlOrObject !== "string") {
      console.warn("[VibeGroup] parseVibeDataFromDataUrl: Invalid input type:", typeof dataUrlOrObject);
      return null;
    }
    const trimmedInput = dataUrlOrObject.trim();
    if (trimmedInput.startsWith("{") || trimmedInput.startsWith("[")) {
      try {
        return JSON.parse(trimmedInput);
      } catch (parseError) {
        console.error("[VibeGroup] parseVibeDataFromDataUrl: JSON parse failed:", {
          error: parseError.message,
          jsonPrefix: trimmedInput.substring(0, 100),
          jsonLength: trimmedInput.length
        });
        return null;
      }
    }
    if (!dataUrlOrObject.startsWith("data:")) {
      console.warn("[VibeGroup] parseVibeDataFromDataUrl: Input is not a data URL, length:", dataUrlOrObject.length);
      return null;
    }
    const commaIndex = dataUrlOrObject.indexOf(",");
    if (commaIndex === -1) {
      console.error("[VibeGroup] parseVibeDataFromDataUrl: Missing comma in data URL, length:", dataUrlOrObject.length);
      return null;
    }
    const base64Data = dataUrlOrObject.substring(commaIndex + 1);
    if (!base64Data) {
      console.error("[VibeGroup] parseVibeDataFromDataUrl: Empty base64 data after comma");
      return null;
    }
    let jsonString;
    try {
      jsonString = dataUrlOrObject.substring(0, commaIndex).includes(";base64") ? decodeURIComponent(escape(atob(base64Data))) : decodeURIComponent(base64Data);
    } catch (decodeError) {
      console.error("[VibeGroup] parseVibeDataFromDataUrl: Data URL decode failed:", {
        error: decodeError.message,
        dataUrlPrefix: dataUrlOrObject.substring(0, 100),
        base64Length: base64Data.length
      });
      return null;
    }
    let vibeData;
    try {
      vibeData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("[VibeGroup] parseVibeDataFromDataUrl: JSON parse failed:", {
        error: parseError.message,
        jsonPrefix: jsonString.substring(0, 100),
        jsonLength: jsonString.length
      });
      return null;
    }
    return vibeData;
  } catch (error) {
    console.error("[VibeGroup] parseVibeDataFromDataUrl: Unexpected error:", {
      error: error.message,
      errorName: error.name,
      stack: error.stack,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return null;
  }
}

function appendThumbnailImage(container, src, alt = "Vibe preview") {
  if (!src) return false;
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    `;
  container.appendChild(img);
  return true;
}

function extractJsonStringField(jsonText, fieldName) {
  if (typeof jsonText !== "string") return null;
  const fieldIndex = jsonText.indexOf(`"${fieldName}"`);
  if (fieldIndex === -1) return null;
  const colonIndex = jsonText.indexOf(":", fieldIndex);
  if (colonIndex === -1) return null;
  let quoteIndex = colonIndex + 1;
  while (quoteIndex < jsonText.length && /\s/.test(jsonText[quoteIndex])) {
    quoteIndex++;
  }
  if (jsonText[quoteIndex] !== '"') return null;
  let value = "";
  let escaped = false;
  for (let i = quoteIndex + 1; i < jsonText.length; i++) {
    const char = jsonText[i];
    if (escaped) {
      value += `\\${char}`;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      try {
        return JSON.parse(`"${value}"`);
      } catch {
        return null;
      }
    }
    value += char;
  }
  return null;
}

async function resolveStoredVibeThumbnail(vibeDataId) {
  if (!vibeDataId) return null;
  if (vibeThumbnailCache.has(vibeDataId)) {
    return vibeThumbnailCache.get(vibeDataId);
  }
  if (vibeThumbnailPending.has(vibeDataId)) {
    return vibeThumbnailPending.get(vibeDataId);
  }
  const pending = (async () => {
    const rawText = await getConfigText(vibeDataId);
    const thumbnail = extractJsonStringField(rawText, "thumbnail");
    if (thumbnail) {
      vibeThumbnailCache.set(vibeDataId, thumbnail);
      return thumbnail;
    }
    vibeThumbnailCache.set(vibeDataId, null);
    return null;
  })().finally(() => {
    vibeThumbnailPending.delete(vibeDataId);
  });
  vibeThumbnailPending.set(vibeDataId, pending);
  return pending;
}

function waitForIdle() {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve(), { timeout: 500 });
    } else {
      setTimeout(resolve, 16);
    }
  });
}

function createCoverDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 512;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.82),
          format: "jpeg"
        });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("\u56FE\u7247\u89E3\u7801\u5931\u8D25"));
    };
    img.src = url;
  });
}

function warmMissingVibePresetThumbnails() {
  if (vibeThumbnailWarmupPromise) {
    return vibeThumbnailWarmupPromise;
  }
  __set_vibeThumbnailWarmupPromise((async () => {
    const settings3 = extension_settings[extensionName];
    const vibePresets = settings3.vibePresets || {};
    let updatedCount = 0;
    for (const presetName of Object.keys(vibePresets)) {
      const preset = vibePresets[presetName];
      if (!preset || preset.thumbnail || !preset.vibeDataId) {
        continue;
      }
      await waitForIdle();
      try {
        const thumbnail = await resolveStoredVibeThumbnail(preset.vibeDataId);
        if (thumbnail && !preset.thumbnail) {
          preset.thumbnail = thumbnail;
          updatedCount++;
          if (updatedCount % 5 === 0) {
            saveSettingsDebounced();
          }
        }
      } catch (error) {
        console.warn("[VibeGroup] Failed to warm Vibe thumbnail:", {
          presetName,
          vibeDataId: preset.vibeDataId?.substring(0, 12) + "...",
          error: error.message
        });
      }
    }
    if (updatedCount > 0) {
      saveSettingsDebounced();
      console.log("[VibeGroup] Warmed Vibe preset thumbnails:", updatedCount);
    }
  })().finally(() => {
    __set_vibeThumbnailWarmupPromise(null);
  }));
  return vibeThumbnailWarmupPromise;
}

async function updateVibeSlot(slotsContainer, slotIndex, vibeRef, groupSelect, addVibeBtn) {
  const { vibeDataId, strength } = vibeRef;
  const slotDiv = document.createElement("div");
  slotDiv.className = "st-chatu8-vibe-slot";
  slotDiv.dataset.slotIndex = slotIndex;
  slotDiv.style.cssText = `
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        background: rgba(0, 0, 0, 0.2);
    `;
  const headerDiv = document.createElement("div");
  headerDiv.className = "st-chatu8-vibe-slot-header";
  headerDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
    `;
  const titleSpan = document.createElement("span");
  titleSpan.className = "st-chatu8-vibe-slot-title";
  titleSpan.textContent = `Vibe ${slotIndex + 1}`;
  titleSpan.style.cssText = `
        font-weight: 600;
        font-size: 1rem;
    `;
  const removeBtn = document.createElement("button");
  removeBtn.className = "st-chatu8-icon-btn danger st-chatu8-vibe-slot-remove";
  removeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
  removeBtn.title = "\u79FB\u9664\u6B64 Vibe";
  removeBtn.onclick = () => removeVibeFromSlot(slotIndex, slotsContainer, groupSelect, addVibeBtn);
  headerDiv.appendChild(titleSpan);
  headerDiv.appendChild(removeBtn);
  const previewDiv = document.createElement("div");
  previewDiv.className = "st-chatu8-vibe-slot-preview";
  previewDiv.style.cssText = `
        width: 100%;
        height: 200px;
        border-radius: 6px;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
    `;
  try {
    const thumbnail = await resolveStoredVibeThumbnail(vibeDataId);
    if (!appendThumbnailImage(previewDiv, thumbnail)) {
      previewDiv.innerHTML = `
                <div style="text-align: center; color: rgba(255, 255, 255, 0.5);">
                    <i class="fa-solid fa-image" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 0.5rem;"></i>
                    <div style="font-size: 0.85rem;">\u65E0\u7F29\u7565\u56FE</div>
                </div>
            `;
      console.warn("[VibeGroup] No thumbnail field in Vibe data:", {
        vibeDataId: vibeDataId.substring(0, 12) + "...",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  } catch (error) {
    let errorMessage = "Vibe \u6570\u636E\u52A0\u8F7D\u5931\u8D25";
    let errorType = error.name || "Error";
    if (error.name === "QuotaExceededError" || error.message.includes("quota")) {
      errorMessage = "\u5B58\u50A8\u7A7A\u95F4\u5DF2\u6EE1";
      errorType = "QuotaExceededError";
    } else if (error.name === "NotFoundError") {
      errorMessage = "Vibe \u6570\u636E\u672A\u627E\u5230";
      errorType = "NotFoundError";
    } else if (error.name === "InvalidStateError") {
      errorMessage = "\u6570\u636E\u5E93\u72B6\u6001\u65E0\u6548";
      errorType = "InvalidStateError";
    }
    previewDiv.innerHTML = `
            <div style="text-align: center; color: #f44336;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 3rem; opacity: 0.5; display: block; margin-bottom: 0.5rem;"></i>
                <div style="font-size: 0.85rem; font-weight: 600;">${errorMessage}</div>
                <div style="font-size: 0.75rem; margin-top: 0.3rem; opacity: 0.7;">${errorType}</div>
                <div style="font-size: 0.75rem; margin-top: 0.3rem; opacity: 0.7;">ID: ${vibeDataId.substring(0, 12)}...</div>
            </div>
        `;
    previewDiv.title = `\u52A0\u8F7D\u5931\u8D25: ${error.message}`;
    console.error("[VibeGroup] Failed to load Vibe data from database:", {
      vibeDataId: vibeDataId.substring(0, 12) + "...",
      error: error.message,
      errorName: error.name,
      slotIndex,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
  }
  const fieldDiv = document.createElement("div");
  fieldDiv.className = "st-chatu8-field";
  fieldDiv.style.marginBottom = "0";
  const label = document.createElement("label");
  label.innerHTML = `Reference Strength: <span class="strength-value">${strength.toFixed(2)}</span>`;
  const rangeContainer = document.createElement("div");
  rangeContainer.className = "st-chatu8-range-container";
  rangeContainer.style.cssText = `
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-top: 0.5rem;
    `;
  const rangeSlider = document.createElement("input");
  rangeSlider.type = "range";
  rangeSlider.className = "st-chatu8-range-slider vibe-strength-range";
  rangeSlider.min = "0";
  rangeSlider.max = "1";
  rangeSlider.step = "0.01";
  rangeSlider.value = strength.toString();
  rangeSlider.style.flex = "1";
  const numberInput = document.createElement("input");
  numberInput.type = "number";
  numberInput.className = "st-chatu8-range-input vibe-strength-num";
  numberInput.min = "0";
  numberInput.max = "1";
  numberInput.step = "0.01";
  numberInput.value = strength.toString();
  numberInput.style.width = "80px";
  setupStrengthSliderSync(rangeSlider, numberInput, label, slotIndex, groupSelect);
  rangeContainer.appendChild(rangeSlider);
  rangeContainer.appendChild(numberInput);
  fieldDiv.appendChild(label);
  fieldDiv.appendChild(rangeContainer);
  slotDiv.appendChild(headerDiv);
  slotDiv.appendChild(previewDiv);
  slotDiv.appendChild(fieldDiv);
  slotsContainer.appendChild(slotDiv);
}

function setupStrengthSliderSync(rangeSlider, numberInput, label, slotIndex, groupSelect) {
  const settings3 = extension_settings[extensionName];
  const updateStrength = (value) => {
    let clampedValue = Math.max(0, Math.min(1, parseFloat(value) || 0));
    rangeSlider.value = clampedValue.toString();
    numberInput.value = clampedValue.toString();
    const strengthValueSpan = label.querySelector(".strength-value");
    if (strengthValueSpan) {
      strengthValueSpan.textContent = clampedValue.toFixed(2);
    }
    const vibeGroups = settings3.vibeGroups || {};
    const currentGroupId = groupSelect.value;
    const currentGroup = vibeGroups[currentGroupId];
    if (currentGroup && currentGroup.vibes[slotIndex]) {
      currentGroup.vibes[slotIndex].strength = clampedValue;
      currentGroup.updatedAt = Date.now();
      try {
        saveSettingsDebounced();
      } catch (error) {
        console.error("[VibeGroup] Failed to save settings after strength update:", {
          slotIndex,
          strength: clampedValue,
          error: error.message,
          errorName: error.name,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
  };
  rangeSlider.oninput = () => {
    updateStrength(rangeSlider.value);
  };
  numberInput.oninput = () => {
    updateStrength(numberInput.value);
  };
  numberInput.onblur = () => {
    updateStrength(numberInput.value);
  };
}

function removeVibeFromSlot(slotIndex, slotsContainer, groupSelect, addVibeBtn) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const currentGroupId = groupSelect.value;
  const currentGroup = vibeGroups[currentGroupId];
  if (!currentGroup) {
    console.warn("[VibeGroup] Current group not found:", currentGroupId);
    return;
  }
  currentGroup.vibes.splice(slotIndex, 1);
  currentGroup.updatedAt = Date.now();
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[VibeGroup] Failed to save settings after removing Vibe:", {
      slotIndex,
      groupId: currentGroupId,
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
  }
  renderVibeSlots(slotsContainer, groupSelect, addVibeBtn);
  console.log("[VibeGroup] Removed Vibe from slot", slotIndex);
}

async function showVibeVisualSelector(onSelect) {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const settings3 = extension_settings[extensionName];
  const vibePresets = settings3.vibePresets || {};
  void warmMissingVibePresetThumbnails();
  let currentPage = 1;
  let pageSize = 12;
  let filteredPresets = [];
  let searchQuery = "";
  let renderSerial = 0;
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-vibe-visual-selector-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u9009\u62E9 Vibe \u9884\u8BBE</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-toolbar" style="justify-content: space-between; align-items: center; gap: 15px; padding: 12px 20px; background: rgba(30, 30, 46, 0.6); border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div class="st-chatu8-viz-search-container" style="position: relative; flex-grow: 1; max-width: 300px;">
                    <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #aaa; pointer-events: none;"></i>
                    <input type="text" class="st-chatu8-viz-search-input" placeholder="\u641C\u7D22 Vibe..." style="width: 100%; padding: 8px 12px 8px 36px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: white; outline: none; transition: all 0.3s;">
                </div>
            </div>
            <div class="st-chatu8-pagination-container">
                <button class="st-chatu8-pagination-btn st-chatu8-pagination-prev" title="\u4E0A\u4E00\u9875">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="st-chatu8-pagination-info">
                    <span class="st-chatu8-pagination-current">1</span>
                    <span>/</span>
                    <span class="st-chatu8-pagination-total">1</span>
                    <span style="margin-left: 8px; color: #666;">|</span>
                    <span style="margin-left: 8px;">\u5171 <span class="st-chatu8-pagination-count">0</span> \u4E2A</span>
                </div>
                <button class="st-chatu8-pagination-btn st-chatu8-pagination-next" title="\u4E0B\u4E00\u9875">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div class="st-chatu8-pagination-size-container">
                    <span class="st-chatu8-pagination-size-label">\u6BCF\u9875</span>
                    <select class="st-chatu8-pagination-size">
                        <option value="8">8</option>
                        <option value="12" selected>12</option>
                        <option value="16">16</option>
                        <option value="24">24</option>
                    </select>
                </div>
            </div>
            <div class="st-chatu8-workflow-viz-body">
                <div class="st-chatu8-vibe-visual-selector-grid">
                    <!-- Vibe cards will be inserted here -->
                </div>
            </div>
        </div>
    `;
  parent.appendChild(backdrop);
  const closeBtn = backdrop.querySelector(".st-chatu8-workflow-viz-close");
  const closeDialog = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
  };
  if (closeBtn) {
    closeBtn.onclick = closeDialog;
    closeBtn.addEventListener("touchend", closeDialog, { passive: false });
  }
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      closeDialog(e);
    }
  };
  const gridContainer = backdrop.querySelector(".st-chatu8-vibe-visual-selector-grid");
  const searchInput = backdrop.querySelector(".st-chatu8-viz-search-input");
  const paginationPrev = backdrop.querySelector(".st-chatu8-pagination-prev");
  const paginationNext = backdrop.querySelector(".st-chatu8-pagination-next");
  const paginationCurrent = backdrop.querySelector(".st-chatu8-pagination-current");
  const paginationTotal = backdrop.querySelector(".st-chatu8-pagination-total");
  const paginationCount = backdrop.querySelector(".st-chatu8-pagination-count");
  const paginationSizeSelect = backdrop.querySelector(".st-chatu8-pagination-size");
  const allPresetNames = Object.keys(vibePresets).filter((name) => vibePresets[name].vibeDataId).sort((a, b) => {
    if (a === "\u9ED8\u8BA4") return -1;
    if (b === "\u9ED8\u8BA4") return 1;
    return a.localeCompare(b, "zh-CN");
  });
  function updateFilteredPresets() {
    if (searchQuery) {
      filteredPresets = allPresetNames.filter(
        (name) => name.toLowerCase().includes(searchQuery)
      );
    } else {
      filteredPresets = [...allPresetNames];
    }
  }
  function updatePaginationUI() {
    const totalPages = Math.ceil(filteredPresets.length / pageSize) || 1;
    paginationCurrent.textContent = currentPage;
    paginationTotal.textContent = totalPages;
    paginationCount.textContent = filteredPresets.length;
    paginationPrev.disabled = currentPage <= 1;
    paginationPrev.style.opacity = currentPage <= 1 ? "0.5" : "1";
    paginationPrev.style.cursor = currentPage <= 1 ? "not-allowed" : "pointer";
    paginationNext.disabled = currentPage >= totalPages;
    paginationNext.style.opacity = currentPage >= totalPages ? "0.5" : "1";
    paginationNext.style.cursor = currentPage >= totalPages ? "not-allowed" : "pointer";
  }
  function setVibeCardImage(thumbnailDiv, src, presetName) {
    thumbnailDiv.innerHTML = "";
    const img = document.createElement("img");
    img.src = src;
    img.alt = presetName;
    thumbnailDiv.appendChild(img);
  }
  function setVibeCardPlaceholder(thumbnailDiv, label = "\u52A0\u8F7D\u4E2D...") {
    thumbnailDiv.innerHTML = `
            <div class="st-chatu8-vibe-card-placeholder">
                <i class="fa-solid fa-image"></i>
                <div>${label}</div>
            </div>
        `;
  }
  async function resolveVibePresetThumbnail(presetName, preset, markBackfilled) {
    if (preset.thumbnail) {
      return preset.thumbnail;
    }
    if (preset.vibeDataId) {
      const thumbnail = await resolveStoredVibeThumbnail(preset.vibeDataId);
      if (thumbnail) {
        preset.thumbnail = thumbnail;
        markBackfilled();
        return thumbnail;
      }
    }
    if (preset.imageId) {
      return await getConfigImage(preset.imageId);
    }
    return null;
  }
  async function renderCurrentPage() {
    const renderId = ++renderSerial;
    let thumbnailsBackfilled = false;
    const markBackfilled = () => {
      thumbnailsBackfilled = true;
    };
    gridContainer.style.opacity = "0";
    gridContainer.style.transform = "translateY(10px)";
    if (renderId !== renderSerial) return;
    gridContainer.innerHTML = "";
    if (filteredPresets.length === 0) {
      gridContainer.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 3rem;
                    color: rgba(255, 255, 255, 0.5);
                ">
                    <i class="fa-solid fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <p>${searchQuery ? "\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684 Vibe \u9884\u8BBE" : "\u6CA1\u6709\u53EF\u7528\u7684 Vibe \u9884\u8BBE"}</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">${searchQuery ? "\u8BF7\u5C1D\u8BD5\u5176\u4ED6\u641C\u7D22\u8BCD" : "\u8BF7\u5148\u5728 Vibe \u751F\u6210\u5668\u4E2D\u521B\u5EFA Vibe \u9884\u8BBE"}</p>
                </div>
            `;
      updatePaginationUI();
      gridContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      gridContainer.style.opacity = "1";
      gridContainer.style.transform = "translateY(0)";
      return;
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagePresets = filteredPresets.slice(startIndex, endIndex);
    const thumbnailTasks = [];
    for (const presetName of pagePresets) {
      const preset = vibePresets[presetName];
      const card = document.createElement("div");
      card.className = "st-chatu8-vibe-card";
      const thumbnailDiv = document.createElement("div");
      thumbnailDiv.className = "st-chatu8-vibe-card-thumbnail";
      if (preset.thumbnail) {
        setVibeCardImage(thumbnailDiv, preset.thumbnail, presetName);
      } else {
        setVibeCardPlaceholder(thumbnailDiv);
      }
      const infoDiv = document.createElement("div");
      infoDiv.className = "st-chatu8-vibe-card-info";
      const nameDiv = document.createElement("div");
      nameDiv.className = "st-chatu8-vibe-card-name";
      nameDiv.textContent = presetName;
      const modelDiv = document.createElement("div");
      modelDiv.className = "st-chatu8-vibe-card-model";
      const modelName = preset.model || "Unknown";
      const modelDisplay = modelName.replace("nai-diffusion-", "V").replace("-", " ");
      modelDiv.textContent = modelDisplay;
      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(modelDiv);
      card.appendChild(thumbnailDiv);
      card.appendChild(infoDiv);
      card.onclick = () => {
        onSelect(preset.vibeDataId);
        parent.removeChild(backdrop);
        console.log("[VibeGroup] Selected Vibe:", presetName, preset.vibeDataId);
      };
      gridContainer.appendChild(card);
      if (!preset.thumbnail) {
        const task = resolveVibePresetThumbnail(presetName, preset, markBackfilled).then((thumbnail) => {
          if (renderId !== renderSerial || !thumbnailDiv.isConnected) return;
          if (thumbnail) {
            setVibeCardImage(thumbnailDiv, thumbnail, presetName);
          } else {
            setVibeCardPlaceholder(thumbnailDiv, "\u65E0\u56FE\u50CF");
          }
        }).catch((error) => {
          if (renderId !== renderSerial || !thumbnailDiv.isConnected) return;
          thumbnailDiv.innerHTML = `
                            <div class="st-chatu8-vibe-card-error">
                                <i class="fa-solid fa-exclamation-triangle"></i>
                                <div>\u52A0\u8F7D\u5931\u8D25</div>
                            </div>
                        `;
          thumbnailDiv.title = `\u52A0\u8F7D\u5931\u8D25: ${error.message}`;
          console.error("[VibeGroup] Failed to load Vibe thumbnail:", {
            vibeDataId: preset.vibeDataId?.substring(0, 12) + "...",
            presetName,
            error: error.message,
            errorName: error.name || "Error",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            stack: error.stack
          });
        });
        thumbnailTasks.push(task);
      }
    }
    updatePaginationUI();
    gridContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    gridContainer.style.opacity = "1";
    gridContainer.style.transform = "translateY(0)";
    if (thumbnailTasks.length > 0) {
      Promise.allSettled(thumbnailTasks).then(() => {
        if (thumbnailsBackfilled) {
          saveSettingsDebounced();
        }
      });
    }
  }
  searchInput.oninput = (e) => {
    searchQuery = e.target.value.toLowerCase();
    currentPage = 1;
    updateFilteredPresets();
    renderCurrentPage();
  };
  paginationPrev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  };
  paginationNext.onclick = () => {
    const totalPages = Math.ceil(filteredPresets.length / pageSize) || 1;
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  };
  paginationSizeSelect.onchange = (e) => {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderCurrentPage();
  };
  updateFilteredPresets();
  renderCurrentPage();
  console.log("[VibeGroup] Visual selector opened with", allPresetNames.length, "presets");
}

async function exportVibeGroup(groupId) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const group = vibeGroups[groupId];
  if (!group) {
    throw new Error(`Group "${groupId}" not found`);
  }
  const vibeIds = group.vibes.map((v) => v.vibeDataId);
  const vibeIdSet = new Set(vibeIds);
  const vibeData = {};
  for (const vibeId of vibeIds) {
    try {
      const rawData = await getConfigText(vibeId);
      if (rawData) {
        const parsedData = parseVibeDataFromDataUrl(rawData);
        if (parsedData) {
          vibeData[vibeId] = parsedData;
        } else {
          console.warn("[VibeGroup] Failed to parse Vibe data for export:", vibeId);
        }
      } else {
        console.warn("[VibeGroup] Vibe data not found for ID:", vibeId);
      }
    } catch (error) {
      let errorType = error.name || "Error";
      if (error.name === "QuotaExceededError" || error.message.includes("quota")) {
        errorType = "QuotaExceededError";
      } else if (error.name === "NotFoundError") {
        errorType = "NotFoundError";
      } else if (error.name === "InvalidStateError") {
        errorType = "InvalidStateError";
      }
      console.error("[VibeGroup] Failed to load Vibe data for export:", {
        vibeDataId: vibeId.substring(0, 12) + "...",
        error: error.message,
        errorName: errorType,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        stack: error.stack
      });
    }
  }
  const relatedPresets = {};
  const allPresets = settings3.vibePresets || {};
  for (const presetName in allPresets) {
    const preset = allPresets[presetName];
    if (preset.vibeDataId && vibeIdSet.has(preset.vibeDataId)) {
      relatedPresets[presetName] = { ...preset };
    }
  }
  const presetImages = {};
  for (const presetName in relatedPresets) {
    const preset = relatedPresets[presetName];
    if (preset.imageId) {
      try {
        const imageData = await getConfigImage(preset.imageId);
        if (imageData) {
          presetImages[preset.imageId] = imageData;
        }
      } catch (error) {
        console.warn("[VibeGroup] Failed to load preset image for export:", preset.imageId, error.message);
      }
    }
  }
  const exportData = {
    groups: {
      [groupId]: {
        vibes: group.vibes,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
    },
    vibeData,
    vibePresets: relatedPresets,
    presetImages
  };
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vibe-group-${groupId}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log("[VibeGroup] Exported group:", groupId, "with", vibeIds.length, "Vibes,", Object.keys(relatedPresets).length, "presets");
}

async function exportAllVibeGroups() {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const allVibeIds = /* @__PURE__ */ new Set();
  for (const groupId in vibeGroups) {
    const group = vibeGroups[groupId];
    if (group.vibes) {
      group.vibes.forEach((v) => allVibeIds.add(v.vibeDataId));
    }
  }
  const vibeData = {};
  for (const vibeId of allVibeIds) {
    try {
      const rawData = await getConfigText(vibeId);
      if (rawData) {
        const parsedData = parseVibeDataFromDataUrl(rawData);
        if (parsedData) {
          vibeData[vibeId] = parsedData;
        } else {
          console.warn("[VibeGroup] Failed to parse Vibe data for export all:", vibeId);
        }
      } else {
        console.warn("[VibeGroup] Vibe data not found for ID:", vibeId);
      }
    } catch (error) {
      let errorType = error.name || "Error";
      if (error.name === "QuotaExceededError" || error.message.includes("quota")) {
        errorType = "QuotaExceededError";
      } else if (error.name === "NotFoundError") {
        errorType = "NotFoundError";
      } else if (error.name === "InvalidStateError") {
        errorType = "InvalidStateError";
      }
      console.error("[VibeGroup] Failed to load Vibe data for export all:", {
        vibeDataId: vibeId.substring(0, 12) + "...",
        error: error.message,
        errorName: errorType,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        stack: error.stack
      });
    }
  }
  const relatedPresets = {};
  const allPresets = settings3.vibePresets || {};
  for (const presetName in allPresets) {
    const preset = allPresets[presetName];
    if (preset.vibeDataId && allVibeIds.has(preset.vibeDataId)) {
      relatedPresets[presetName] = { ...preset };
    }
  }
  const presetImages = {};
  for (const presetName in relatedPresets) {
    const preset = relatedPresets[presetName];
    if (preset.imageId) {
      try {
        const imageData = await getConfigImage(preset.imageId);
        if (imageData) {
          presetImages[preset.imageId] = imageData;
        }
      } catch (error) {
        console.warn("[VibeGroup] Failed to load preset image for export all:", preset.imageId, error.message);
      }
    }
  }
  const exportData = {
    groups: vibeGroups,
    vibeData,
    vibePresets: relatedPresets,
    presetImages
  };
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vibe-groups-all-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log("[VibeGroup] Exported all groups:", Object.keys(vibeGroups).length, "groups with", allVibeIds.size, "unique Vibes,", Object.keys(relatedPresets).length, "presets");
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error("\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25"));
    reader.readAsText(file);
  });
}

async function importVibeGroup(jsonString) {
  const result = {
    success: false,
    groupsImported: 0,
    vibesImported: 0,
    presetsImported: 0,
    errors: [],
    warnings: []
  };
  try {
    let importData;
    try {
      importData = JSON.parse(jsonString);
    } catch (parseError) {
      result.errors.push("\u6587\u4EF6\u683C\u5F0F\u9519\u8BEF: \u65E0\u6548\u7684 JSON \u683C\u5F0F");
      console.error("[VibeGroup] JSON parse error:", {
        error: parseError.message,
        errorName: parseError.name,
        position: parseError.message.match(/position (\d+)/)?.[1] || "unknown",
        fileSize: jsonString.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.error("[VibeGroup] First 200 characters of file:", jsonString.substring(0, 200));
      return result;
    }
    if (!importData || typeof importData !== "object") {
      result.errors.push("\u6587\u4EF6\u683C\u5F0F\u9519\u8BEF: \u6839\u5BF9\u8C61\u65E0\u6548");
      return result;
    }
    if (!importData.groups || typeof importData.groups !== "object") {
      result.errors.push("\u6587\u4EF6\u683C\u5F0F\u9519\u8BEF: \u7F3A\u5C11 groups \u5B57\u6BB5");
      return result;
    }
    if (!importData.vibeData || typeof importData.vibeData !== "object") {
      result.errors.push("\u6587\u4EF6\u683C\u5F0F\u9519\u8BEF: \u7F3A\u5C11 vibeData \u5B57\u6BB5");
      return result;
    }
    const settings3 = extension_settings[extensionName];
    const vibeGroups = settings3.vibeGroups || {};
    const savedVibeIds = /* @__PURE__ */ new Set();
    const vibeDataKeys = Object.keys(importData.vibeData);
    for (const vibeId of vibeDataKeys) {
      const vibeData = importData.vibeData[vibeId];
      if (!validateVibeData(vibeData)) {
        result.warnings.push(`\u8DF3\u8FC7\u65E0\u6548\u7684 Vibe \u6570\u636E: ${vibeId}`);
        console.warn("[VibeGroup] Invalid Vibe data structure:", vibeId, vibeData);
        continue;
      }
      try {
        const savedVibeId = await saveVibeDataWithDuplicatePrevention(vibeData);
        if (savedVibeId !== vibeId) {
          console.log("[VibeGroup] Remapping Vibe ID:", vibeId, "->", savedVibeId);
          for (const groupName in importData.groups) {
            const groupData = importData.groups[groupName];
            if (groupData.vibes && Array.isArray(groupData.vibes)) {
              groupData.vibes.forEach((vibeRef) => {
                if (vibeRef.vibeDataId === vibeId) {
                  vibeRef.vibeDataId = savedVibeId;
                }
              });
            }
          }
          if (importData.vibePresets && typeof importData.vibePresets === "object") {
            for (const presetName in importData.vibePresets) {
              const preset = importData.vibePresets[presetName];
              if (preset.vibeDataId === vibeId) {
                preset.vibeDataId = savedVibeId;
              }
            }
          }
        }
        result.vibesImported++;
        savedVibeIds.add(savedVibeId);
        console.log("[VibeGroup] Imported Vibe data:", savedVibeId);
      } catch (error) {
        result.warnings.push(`\u4FDD\u5B58 Vibe \u6570\u636E\u5931\u8D25: ${vibeId}`);
        let errorType = error.name || "Error";
        if (error.name === "QuotaExceededError" || error.message.includes("quota")) {
          errorType = "QuotaExceededError";
        } else if (error.name === "NotFoundError") {
          errorType = "NotFoundError";
        } else if (error.name === "InvalidStateError") {
          errorType = "InvalidStateError";
        }
        console.error("[VibeGroup] Failed to save Vibe data:", {
          vibeDataId: vibeId.substring(0, 12) + "...",
          error: error.message,
          errorName: errorType,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          stack: error.stack
        });
      }
    }
    const groupNames = Object.keys(importData.groups);
    for (const groupName of groupNames) {
      const groupData = importData.groups[groupName];
      if (!groupData || typeof groupData !== "object") {
        result.warnings.push(`\u8DF3\u8FC7\u65E0\u6548\u7684\u7EC4: ${groupName}`);
        console.warn("[VibeGroup] Invalid group data:", groupName, groupData);
        continue;
      }
      if (!Array.isArray(groupData.vibes)) {
        result.warnings.push(`\u8DF3\u8FC7\u65E0\u6548\u7684\u7EC4 (vibes \u4E0D\u662F\u6570\u7EC4): ${groupName}`);
        console.warn("[VibeGroup] Group vibes is not an array:", groupName, groupData);
        continue;
      }
      let finalGroupName = groupName;
      let counter = 1;
      while (vibeGroups[finalGroupName]) {
        finalGroupName = `${groupName} (${counter})`;
        counter++;
      }
      if (finalGroupName !== groupName) {
        result.warnings.push(`\u7EC4\u540D\u51B2\u7A81: "${groupName}" \u5DF2\u91CD\u547D\u540D\u4E3A "${finalGroupName}"`);
        console.log("[VibeGroup] Group name conflict, renamed:", groupName, "->", finalGroupName);
      }
      const validVibes = [];
      for (const vibeRef of groupData.vibes) {
        if (!vibeRef || typeof vibeRef !== "object" || !vibeRef.vibeDataId) {
          result.warnings.push(`\u8DF3\u8FC7\u65E0\u6548\u7684 Vibe \u5F15\u7528 (\u7EC4: ${finalGroupName})`);
          continue;
        }
        if (!savedVibeIds.has(vibeRef.vibeDataId)) {
          result.warnings.push(`\u8DF3\u8FC7\u7F3A\u5931\u7684 Vibe: ${vibeRef.vibeDataId} (\u7EC4: ${finalGroupName})`);
          console.warn("[VibeGroup] Vibe data not successfully imported:", vibeRef.vibeDataId);
          continue;
        }
        let strength = parseFloat(vibeRef.strength);
        if (isNaN(strength) || strength < 0 || strength > 1) {
          strength = 0.6;
          result.warnings.push(`Vibe \u5F3A\u5EA6\u503C\u65E0\u6548\uFF0C\u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u503C (\u7EC4: ${finalGroupName})`);
        }
        validVibes.push({
          vibeDataId: vibeRef.vibeDataId,
          strength
        });
      }
      vibeGroups[finalGroupName] = {
        vibes: validVibes,
        createdAt: groupData.createdAt || Date.now(),
        updatedAt: Date.now()
        // Update timestamp on import
      };
      result.groupsImported++;
      console.log("[VibeGroup] Imported group:", finalGroupName, "with", validVibes.length, "Vibes");
    }
    if (importData.vibePresets && typeof importData.vibePresets === "object") {
      const imageIdMap = {};
      if (importData.presetImages && typeof importData.presetImages === "object") {
        for (const oldImageId in importData.presetImages) {
          try {
            const imageData = importData.presetImages[oldImageId];
            if (imageData && typeof imageData === "string") {
              const newImageId = await saveConfigImage(imageData, getVibeStorageOptions());
              imageIdMap[oldImageId] = newImageId;
              console.log("[VibeGroup] Imported preset image:", oldImageId, "->", newImageId);
            }
          } catch (error) {
            console.warn("[VibeGroup] Failed to import preset image:", oldImageId, error.message);
          }
        }
      }
      const existingPresets = settings3.vibePresets || {};
      const presetNames = Object.keys(importData.vibePresets);
      for (const presetName of presetNames) {
        const presetData = importData.vibePresets[presetName];
        if (!presetData || typeof presetData !== "object") {
          result.warnings.push(`\u8DF3\u8FC7\u65E0\u6548\u7684\u9884\u8BBE: ${presetName}`);
          console.warn("[VibeGroup] Invalid preset data:", presetName, presetData);
          continue;
        }
        let finalPresetName = presetName;
        let counter = 1;
        while (existingPresets[finalPresetName]) {
          finalPresetName = `${presetName} (${counter})`;
          counter++;
        }
        if (finalPresetName !== presetName) {
          result.warnings.push(`\u9884\u8BBE\u540D\u51B2\u7A81: "${presetName}" \u5DF2\u91CD\u547D\u540D\u4E3A "${finalPresetName}"`);
          console.log("[VibeGroup] Preset name conflict, renamed:", presetName, "->", finalPresetName);
        }
        const mappedImageId = presetData.imageId ? imageIdMap[presetData.imageId] || presetData.imageId : null;
        existingPresets[finalPresetName] = {
          model: presetData.model || "nai-diffusion-4-5-curated",
          infoExtract: typeof presetData.infoExtract === "number" ? presetData.infoExtract : 1,
          strength: typeof presetData.strength === "number" ? presetData.strength : 0.6,
          imageId: mappedImageId,
          vibeDataId: presetData.vibeDataId || null
        };
        result.presetsImported++;
        console.log("[VibeGroup] Imported preset:", finalPresetName);
      }
      settings3.vibePresets = existingPresets;
    }
    saveSettingsDebounced();
    result.success = true;
    return result;
  } catch (error) {
    result.errors.push(`\u5BFC\u5165\u5931\u8D25: ${error.message}`);
    console.error("[VibeGroup] Import error:", {
      error: error.message,
      errorName: error.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      stack: error.stack
    });
    return result;
  }
}

function validateVibeData(vibeData) {
  if (!vibeData || typeof vibeData !== "object") {
    return false;
  }
  if (vibeData.identifier !== "novelai-vibe-transfer") {
    return false;
  }
  if (vibeData.version !== 1) {
    return false;
  }
  if (vibeData.image && typeof vibeData.image !== "string") {
    return false;
  }
  if (!vibeData.encodings || typeof vibeData.encodings !== "object") {
    return false;
  }
  if (!vibeData.id || typeof vibeData.id !== "string") {
    console.warn("[VibeGroup] Vibe data missing id field");
  }
  return true;
}

function validateVibeGroupStorage(group, groupName) {
  if (!group || typeof group !== "object") {
    console.warn("[VibeGroup] Invalid group structure:", groupName);
    return false;
  }
  if (!Array.isArray(group.vibes)) {
    console.warn("[VibeGroup] Group vibes is not an array:", groupName);
    return false;
  }
  let isValid = true;
  for (let i = 0; i < group.vibes.length; i++) {
    const vibeRef = group.vibes[i];
    if (!vibeRef || typeof vibeRef !== "object") {
      console.warn(`[VibeGroup] Invalid Vibe reference at index ${i} in group "${groupName}"`);
      isValid = false;
      continue;
    }
    if (!vibeRef.vibeDataId || typeof vibeRef.vibeDataId !== "string") {
      console.warn(`[VibeGroup] Missing or invalid vibeDataId at index ${i} in group "${groupName}"`);
      isValid = false;
    }
    if (typeof vibeRef.strength !== "number") {
      console.warn(`[VibeGroup] Missing or invalid strength at index ${i} in group "${groupName}"`);
      isValid = false;
    }
    const allowedFields = ["vibeDataId", "strength"];
    const actualFields = Object.keys(vibeRef);
    const extraFields = actualFields.filter((field) => !allowedFields.includes(field));
    if (extraFields.length > 0) {
      console.warn(`[VibeGroup] Group "${groupName}" contains extra fields in Vibe reference at index ${i}:`, extraFields);
      console.warn("[VibeGroup] Groups should only store vibeDataId and strength, not full Vibe data");
      isValid = false;
    }
    if (typeof vibeRef.strength === "number" && (vibeRef.strength < 0 || vibeRef.strength > 1)) {
      console.warn(`[VibeGroup] Strength value out of range [0, 1] at index ${i} in group "${groupName}": ${vibeRef.strength}`);
      isValid = false;
    }
  }
  return isValid;
}

function validateAllVibeGroups() {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const result = {
    totalGroups: 0,
    validGroups: 0,
    invalidGroups: 0,
    issues: []
  };
  const groupNames = Object.keys(vibeGroups);
  result.totalGroups = groupNames.length;
  for (const groupName of groupNames) {
    const group = vibeGroups[groupName];
    const isValid = validateVibeGroupStorage(group, groupName);
    if (isValid) {
      result.validGroups++;
    } else {
      result.invalidGroups++;
      result.issues.push(groupName);
    }
  }
  console.log("[VibeGroup] Validation complete:", result);
  return result;
}

async function resolveVibeData(vibeDataId, useCache = true) {
  if (!vibeDataId || typeof vibeDataId !== "string") {
    console.warn("[VibeGroup] Invalid vibeDataId provided to resolveVibeData:", vibeDataId);
    return null;
  }
  if (useCache && vibeDataCache.has(vibeDataId)) {
    console.log("[VibeGroup] Resolved Vibe data from cache:", vibeDataId);
    return vibeDataCache.get(vibeDataId);
  }
  try {
    const rawData = await getConfigText(vibeDataId);
    if (!rawData) {
      console.warn("[VibeGroup] Vibe data not found in configDatabase:", vibeDataId);
      return null;
    }
    const vibeData = parseVibeDataFromDataUrl(rawData);
    if (!vibeData) {
      console.warn("[VibeGroup] Failed to parse Vibe data:", vibeDataId);
      return null;
    }
    if (!validateVibeData(vibeData)) {
      console.warn("[VibeGroup] Loaded Vibe data is invalid:", vibeDataId);
      return null;
    }
    vibeDataCache.set(vibeDataId, vibeData);
    console.log("[VibeGroup] Resolved and cached Vibe data:", vibeDataId);
    return vibeData;
  } catch (error) {
    console.error("[VibeGroup] ConfigDatabase access error while loading Vibe data:", {
      vibeDataId,
      error: error.message,
      stack: error.stack,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (error.name === "QuotaExceededError" || error.message.includes("quota")) {
      console.error("[VibeGroup] Storage quota exceeded. Consider deleting unused Vibes or clearing cache.");
    } else if (error.name === "NotFoundError") {
      console.error("[VibeGroup] Vibe data not found in database:", vibeDataId);
    } else if (error.name === "InvalidStateError") {
      console.error("[VibeGroup] Database is in an invalid state. Try refreshing the page.");
    }
    return null;
  }
}

async function findExistingVibeData(vibeData) {
  if (!vibeData || typeof vibeData !== "object") {
    return null;
  }
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const vibePresets = settings3.vibePresets || {};
  const allVibeIds = /* @__PURE__ */ new Set();
  for (const groupName in vibeGroups) {
    const group = vibeGroups[groupName];
    if (group.vibes && Array.isArray(group.vibes)) {
      group.vibes.forEach((v) => {
        if (v.vibeDataId) {
          allVibeIds.add(v.vibeDataId);
        }
      });
    }
  }
  for (const presetName in vibePresets) {
    const preset = vibePresets[presetName];
    if (preset.vibeDataId) {
      allVibeIds.add(preset.vibeDataId);
    }
  }
  for (const vibeId of allVibeIds) {
    try {
      const existingVibeData = await resolveVibeData(vibeId, true);
      if (existingVibeData && areVibesEqual(vibeData, existingVibeData)) {
        console.log("[VibeGroup] Found existing Vibe data:", vibeId);
        return vibeId;
      }
    } catch (error) {
      console.warn("[VibeGroup] Error checking Vibe:", {
        vibeDataId: vibeId.substring(0, 12) + "...",
        error: error.message,
        errorName: error.name,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  return null;
}

function areVibesEqual(vibe1, vibe2) {
  if (!vibe1 || !vibe2) {
    return false;
  }
  if (vibe1.image !== vibe2.image) {
    return false;
  }
  if (!vibe1.encodings || !vibe2.encodings) {
    return false;
  }
  const encodings1Keys = Object.keys(vibe1.encodings).sort();
  const encodings2Keys = Object.keys(vibe2.encodings).sort();
  if (encodings1Keys.length !== encodings2Keys.length) {
    return false;
  }
  for (let i = 0; i < encodings1Keys.length; i++) {
    if (encodings1Keys[i] !== encodings2Keys[i]) {
      return false;
    }
    const encoding1 = JSON.stringify(vibe1.encodings[encodings1Keys[i]]);
    const encoding2 = JSON.stringify(vibe2.encodings[encodings2Keys[i]]);
    if (encoding1 !== encoding2) {
      return false;
    }
  }
  return true;
}

async function saveVibeDataWithDuplicatePrevention(vibeData) {
  if (!vibeData || typeof vibeData !== "object") {
    const error = new Error("Invalid Vibe data provided");
    console.error("[VibeGroup] Validation error:", {
      error: error.message,
      vibeData,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    throw error;
  }
  try {
    const existingVibeId = await findExistingVibeData(vibeData);
    if (existingVibeId) {
      console.log("[VibeGroup] Reusing existing Vibe ID:", existingVibeId);
      await ensureVibeDataStoredByPreference(existingVibeId);
      return existingVibeId;
    }
    const vibeDataId = await saveConfigText(JSON.stringify(vibeData), {
      filename: `vibe_group_${Date.now()}`,
      ...getVibeStorageOptions()
    });
    console.log("[VibeGroup] Saved new Vibe data:", vibeDataId);
    vibeDataCache.set(vibeDataId, vibeData);
    return vibeDataId;
  } catch (error) {
    console.error("[VibeGroup] ConfigDatabase save error:", {
      error: error.message,
      errorName: error.name,
      stack: error.stack,
      vibeDataSize: JSON.stringify(vibeData).length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (error.name === "QuotaExceededError" || error.message.includes("quota")) {
      console.error("[VibeGroup] Storage quota exceeded error. Database is full.");
      console.error("[VibeGroup] Suggested actions:");
      console.error("[VibeGroup]   1. Delete unused Vibe presets");
      console.error("[VibeGroup]   2. Clear browser cache");
      console.error("[VibeGroup]   3. Export important data before clearing");
      throw new Error("\u5B58\u50A8\u7A7A\u95F4\u5DF2\u6EE1\u3002\u8BF7\u5220\u9664\u672A\u4F7F\u7528\u7684 Vibe \u6216\u6E05\u9664\u7F13\u5B58\u3002");
    } else if (error.name === "InvalidStateError") {
      console.error("[VibeGroup] Database is in an invalid state");
      throw new Error("\u6570\u636E\u5E93\u72B6\u6001\u65E0\u6548\u3002\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002");
    } else if (error.name === "DataError") {
      console.error("[VibeGroup] Data format error");
      throw new Error("\u6570\u636E\u683C\u5F0F\u9519\u8BEF\u3002\u8BF7\u68C0\u67E5 Vibe \u6570\u636E\u662F\u5426\u6709\u6548\u3002");
    }
    throw error;
  }
}

async function showVibeGroupVisualSelector(onSelect) {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const settings3 = extension_settings[extensionName];
  ensureVibeGroupPresets();
  let currentPage = 1;
  let pageSize = 12;
  let filteredPresetNames = [];
  let searchQuery = "";
  let isBulkDeleteMode = false;
  let selectedForDelete = /* @__PURE__ */ new Set();
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop st-chatu8-preset-viz-dialog-wrapper";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-vibe-group-visual-selector-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u9009\u62E9 Vibe \u7EC4\u9884\u8BBE</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-toolbar" style="justify-content: space-between; align-items: center; gap: 15px; padding: 12px 20px; background: rgba(30, 30, 46, 0.6); border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div class="st-chatu8-viz-search-container" style="position: relative; flex-grow: 1; max-width: 300px;">
                    <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #aaa; pointer-events: none;"></i>
                    <input type="text" class="st-chatu8-viz-search-input" placeholder="\u641C\u7D22 Vibe \u7EC4..." style="width: 100%; padding: 8px 12px 8px 36px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: white; outline: none; transition: all 0.3s;">
                </div>
                <div class="st-chatu8-viz-mode-controls" style="display: flex; gap: 8px;">
                    <button class="st-chatu8-btn st-chatu8-btn-secondary st-chatu8-mode-toggle-manage" title="\u7BA1\u7406\u6A21\u5F0F">
                        <i class="fa-solid fa-cog"></i> \u7BA1\u7406
                    </button>
                    <button class="st-chatu8-btn st-chatu8-btn-danger st-chatu8-mode-toggle-bulk-delete" title="\u6279\u91CF\u5220\u9664\u6A21\u5F0F">
                        <i class="fa-solid fa-trash"></i> \u6279\u91CF\u5220\u9664
                    </button>
                </div>
            </div>
            <div class="st-chatu8-pagination-container">
                <button class="st-chatu8-pagination-btn st-chatu8-pagination-prev" title="\u4E0A\u4E00\u9875">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="st-chatu8-pagination-info">
                    <span class="st-chatu8-pagination-current">1</span>
                    <span>/</span>
                    <span class="st-chatu8-pagination-total">1</span>
                    <span style="margin-left: 8px; color: #666;">|</span>
                    <span style="margin-left: 8px;">\u5171 <span class="st-chatu8-pagination-count">0</span> \u4E2A</span>
                </div>
                <button class="st-chatu8-pagination-btn st-chatu8-pagination-next" title="\u4E0B\u4E00\u9875">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div class="st-chatu8-pagination-size-container">
                    <span class="st-chatu8-pagination-size-label">\u6BCF\u9875</span>
                    <select class="st-chatu8-pagination-size">
                        <option value="8">8</option>
                        <option value="12" selected>12</option>
                        <option value="16">16</option>
                        <option value="24">24</option>
                    </select>
                </div>
            </div>
            <div class="st-chatu8-workflow-viz-body">
                <div class="st-chatu8-preset-grid">
                    <!-- Vibe group preset cards will be inserted here -->
                </div>
            </div>
        </div>
    `;
  parent.appendChild(backdrop);
  const closeBtn = backdrop.querySelector(".st-chatu8-workflow-viz-close");
  const closeDialog = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
  };
  if (closeBtn) {
    closeBtn.onclick = closeDialog;
    closeBtn.addEventListener("touchend", closeDialog, { passive: false });
  }
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      closeDialog(e);
    }
  };
  function updateFilteredPresets() {
    const vibeGroups = settings3.vibeGroups || {};
    let allPresetNames = Object.keys(vibeGroups);
    if (searchQuery && searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      allPresetNames = allPresetNames.filter(
        (name) => name.toLowerCase().includes(lowerQuery)
      );
    }
    allPresetNames.sort((a, b) => {
      if (a === "\u9ED8\u8BA4\u7EC4") return -1;
      if (b === "\u9ED8\u8BA4\u7EC4") return 1;
      return a.localeCompare(b, "zh-CN");
    });
    filteredPresetNames = allPresetNames;
    console.log("[VibeGroupVisualSelector] Filtered presets:", filteredPresetNames.length, "of", Object.keys(vibeGroups).length);
  }
  function updatePaginationUI() {
    const paginationCurrent = backdrop.querySelector(".st-chatu8-pagination-current");
    const paginationTotal = backdrop.querySelector(".st-chatu8-pagination-total");
    const paginationCount = backdrop.querySelector(".st-chatu8-pagination-count");
    const paginationPrev2 = backdrop.querySelector(".st-chatu8-pagination-prev");
    const paginationNext2 = backdrop.querySelector(".st-chatu8-pagination-next");
    const totalPages = Math.max(1, Math.ceil(filteredPresetNames.length / pageSize));
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }
    paginationCurrent.textContent = currentPage;
    paginationTotal.textContent = totalPages;
    paginationCount.textContent = filteredPresetNames.length;
    if (currentPage <= 1) {
      paginationPrev2.disabled = true;
      paginationPrev2.style.opacity = "0.5";
      paginationPrev2.style.cursor = "not-allowed";
    } else {
      paginationPrev2.disabled = false;
      paginationPrev2.style.opacity = "1";
      paginationPrev2.style.cursor = "pointer";
    }
    if (currentPage >= totalPages) {
      paginationNext2.disabled = true;
      paginationNext2.style.opacity = "0.5";
      paginationNext2.style.cursor = "not-allowed";
    } else {
      paginationNext2.disabled = false;
      paginationNext2.style.opacity = "1";
      paginationNext2.style.cursor = "pointer";
    }
    console.log("[VibeGroupVisualSelector] Pagination updated:", {
      currentPage,
      totalPages,
      totalPresets: filteredPresetNames.length,
      pageSize
    });
  }
  const paginationPrev = backdrop.querySelector(".st-chatu8-pagination-prev");
  const paginationNext = backdrop.querySelector(".st-chatu8-pagination-next");
  const paginationSizeSelect = backdrop.querySelector(".st-chatu8-pagination-size");
  async function createVibeGroupPresetCard(config) {
    const { presetName, preset, isSelected, onCardClick, onRefreshGrid } = config;
    const card = document.createElement("div");
    card.className = "st-chatu8-preset-card";
    card.dataset.presetName = presetName;
    if (isSelected) {
      card.classList.add("selected");
    }
    const imageContainer = document.createElement("div");
    imageContainer.className = "st-chatu8-preset-card-image";
    if (preset.coverImageId) {
      try {
        const imageData = await getConfigImage(preset.coverImageId);
        if (imageData) {
          const img = document.createElement("img");
          img.src = imageData;
          img.alt = presetName;
          img.style.cssText = `
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    `;
          imageContainer.appendChild(img);
        } else {
          imageContainer.innerHTML = `
                        <div class="st-chatu8-preset-card-placeholder">
                            <i class="fa-solid fa-image"></i>
                            <div>\u56FE\u50CF\u672A\u627E\u5230</div>
                        </div>
                    `;
          console.warn("[VibeGroupVisualSelector] Cover image not found in database:", preset.coverImageId);
        }
      } catch (error) {
        let errorMessage = "\u52A0\u8F7D\u5931\u8D25";
        if (error.name === "QuotaExceededError" || error.message.includes("quota")) {
          errorMessage = "\u5B58\u50A8\u5DF2\u6EE1";
        } else if (error.name === "NotFoundError") {
          errorMessage = "\u56FE\u50CF\u672A\u627E\u5230";
        } else if (error.name === "InvalidStateError") {
          errorMessage = "\u6570\u636E\u5E93\u9519\u8BEF";
        }
        imageContainer.innerHTML = `
                    <div class="st-chatu8-preset-card-error">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <div>${errorMessage}</div>
                    </div>
                `;
        imageContainer.title = `\u52A0\u8F7D\u5931\u8D25: ${error.message}`;
        console.error("[VibeGroupVisualSelector] Failed to load cover image:", preset.coverImageId, {
          error: error.message,
          errorName: error.name,
          presetName,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } else {
      imageContainer.innerHTML = `
                <div class="st-chatu8-preset-card-placeholder">
                    <i class="fa-solid fa-image"></i>
                    <div>\u65E0\u56FE\u50CF</div>
                </div>
            `;
    }
    const nameLabel = document.createElement("div");
    nameLabel.className = "st-chatu8-preset-card-name";
    nameLabel.textContent = presetName;
    nameLabel.title = presetName;
    card.appendChild(imageContainer);
    card.appendChild(nameLabel);
    card.onclick = () => {
      if (onCardClick) {
        onCardClick(presetName, card);
      }
    };
    return card;
  }
  function createActionButtons(presetName, preset, imageContainer, onRefreshGrid) {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "st-chatu8-preset-card-actions";
    const uploadBtn = document.createElement("button");
    uploadBtn.className = "st-chatu8-preset-action-btn st-chatu8-preset-action-upload";
    uploadBtn.innerHTML = '<i class="fa-solid fa-camera"></i>';
    uploadBtn.title = "\u4E0A\u4F20\u5C01\u9762\u56FE";
    uploadBtn.onclick = (e) => {
      e.stopPropagation();
      handleCoverImageUpload(presetName, imageContainer, onRefreshGrid);
    };
    const deleteImageBtn = document.createElement("button");
    deleteImageBtn.className = "st-chatu8-preset-action-btn st-chatu8-preset-action-delete-image";
    deleteImageBtn.innerHTML = '<i class="fa-solid fa-image-slash"></i>';
    deleteImageBtn.title = "\u5220\u9664\u5C01\u9762\u56FE";
    deleteImageBtn.onclick = (e) => {
      e.stopPropagation();
      deleteCoverImage(presetName, imageContainer);
    };
    if (!preset.coverImageId) {
      deleteImageBtn.style.display = "none";
    }
    const renameBtn = document.createElement("button");
    renameBtn.className = "st-chatu8-preset-action-btn st-chatu8-preset-action-rename";
    renameBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    renameBtn.title = "\u91CD\u547D\u540D";
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      handlePresetRename(presetName, onRefreshGrid);
    };
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "st-chatu8-preset-action-btn st-chatu8-preset-action-delete";
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.title = "\u5220\u9664\u9884\u8BBE";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      handlePresetDelete(presetName, onRefreshGrid);
    };
    actionsDiv.appendChild(uploadBtn);
    actionsDiv.appendChild(deleteImageBtn);
    actionsDiv.appendChild(renameBtn);
    actionsDiv.appendChild(deleteBtn);
    return actionsDiv;
  }
  async function handleCoverImageUpload(presetName, imageContainer, onRefreshGrid) {
    console.log("[VibeGroupVisualSelector] Cover image upload clicked for:", presetName);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      try {
        const { dataUrl: coverDataUrl, format: imageFormat } = await createCoverDataUrl(file);
        const vibeGroups = settings3.vibeGroups || {};
        const preset = vibeGroups[presetName];
        if (!preset) {
          console.error("[VibeGroupVisualSelector] Preset not found:", presetName);
          alert("\u9519\u8BEF: \u9884\u8BBE\u4E0D\u5B58\u5728");
          return;
        }
        if (preset.coverImageId) {
          try {
            await deleteConfigImage(preset.coverImageId);
            console.log("[VibeGroupVisualSelector] Deleted old cover image:", preset.coverImageId);
          } catch (error) {
            console.warn("[VibeGroupVisualSelector] Failed to delete old cover image:", error);
          }
        }
        const newImageId = await saveConfigImage(coverDataUrl, {
          format: imageFormat,
          filename: `vibe_group_cover_${presetName}_${Date.now()}`,
          ...getVibeStorageOptions()
        });
        console.log("[VibeGroupVisualSelector] Saved new cover image:", newImageId);
        preset.coverImageId = newImageId;
        preset.updatedAt = Date.now();
        try {
          saveSettingsDebounced();
        } catch (error) {
          console.error("[VibeGroupVisualSelector] Failed to save settings after cover image upload:", error);
          alert(`\u56FE\u7247\u5DF2\u4E0A\u4F20\u4F46\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25: ${error.message}`);
          return;
        }
        await refreshCardImage3(imageContainer, coverDataUrl);
        console.log("[VibeGroupVisualSelector] Cover image uploaded successfully for:", presetName);
      } catch (error) {
        console.error("[VibeGroupVisualSelector] Failed to upload cover image:", error);
        if (error.name === "QuotaExceededError" || error.message.includes("quota")) {
          alert("\u5B58\u50A8\u7A7A\u95F4\u5DF2\u6EE1\u3002\u8BF7\u5220\u9664\u672A\u4F7F\u7528\u7684\u56FE\u7247\u6216\u6E05\u9664\u7F13\u5B58\u3002");
        } else {
          alert(`\u4E0A\u4F20\u5931\u8D25: ${error.message}`);
        }
      } finally {
        document.body.removeChild(fileInput);
      }
    };
    document.body.appendChild(fileInput);
    fileInput.click();
  }
  async function deleteCoverImage(presetName, imageContainer) {
    console.log("[VibeGroupVisualSelector] Delete cover image clicked for:", presetName);
    const confirmed = confirm(`\u786E\u5B9A\u8981\u5220\u9664 "${presetName}" \u7684\u5C01\u9762\u56FE\u5417\uFF1F`);
    if (!confirmed) {
      return;
    }
    try {
      const vibeGroups = settings3.vibeGroups || {};
      const preset = vibeGroups[presetName];
      if (!preset) {
        console.error("[VibeGroupVisualSelector] Preset not found:", presetName);
        alert("\u9519\u8BEF: \u9884\u8BBE\u4E0D\u5B58\u5728");
        return;
      }
      if (!preset.coverImageId) {
        console.warn("[VibeGroupVisualSelector] No cover image to delete for:", presetName);
        alert("\u8BE5\u9884\u8BBE\u6CA1\u6709\u5C01\u9762\u56FE");
        return;
      }
      try {
        await deleteConfigImage(preset.coverImageId);
        console.log("[VibeGroupVisualSelector] Deleted cover image from database:", preset.coverImageId);
      } catch (error) {
        console.error("[VibeGroupVisualSelector] Failed to delete image from database:", error);
      }
      delete preset.coverImageId;
      preset.updatedAt = Date.now();
      try {
        saveSettingsDebounced();
      } catch (error) {
        console.error("[VibeGroupVisualSelector] Failed to save settings after deleting cover image:", error);
        alert(`\u56FE\u7247\u5DF2\u5220\u9664\u4F46\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25: ${error.message}`);
        return;
      }
      await refreshCardImage3(imageContainer, null);
      console.log("[VibeGroupVisualSelector] Cover image deleted successfully for:", presetName);
    } catch (error) {
      console.error("[VibeGroupVisualSelector] Failed to delete cover image:", error);
      alert(`\u5220\u9664\u5931\u8D25: ${error.message}`);
    }
  }
  async function handlePresetRename(oldName, onRefreshGrid) {
    const vibeGroups = settings3.vibeGroups || {};
    const newName = prompt("\u8BF7\u8F93\u5165\u65B0\u7684\u7EC4\u540D\u79F0:", oldName);
    if (newName === null) {
      return;
    }
    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert("\u7EC4\u540D\u4E0D\u80FD\u4E3A\u7A7A");
      console.warn("[VibeGroupVisualSelector] Rename failed: empty name");
      return;
    }
    if (trimmedName === oldName) {
      console.log("[VibeGroupVisualSelector] Rename cancelled: name unchanged");
      return;
    }
    if (vibeGroups[trimmedName]) {
      alert(`\u7EC4\u540D "${trimmedName}" \u5DF2\u5B58\u5728`);
      console.warn("[VibeGroupVisualSelector] Rename failed: name already exists:", trimmedName);
      return;
    }
    const groupData = vibeGroups[oldName];
    vibeGroups[trimmedName] = groupData;
    delete vibeGroups[oldName];
    groupData.updatedAt = Date.now();
    if (settings3.vibeGroupId === oldName) {
      settings3.vibeGroupId = trimmedName;
      console.log("[VibeGroupVisualSelector] Updated vibeGroupId to:", trimmedName);
    }
    try {
      saveSettingsDebounced();
    } catch (error) {
      console.error("[VibeGroupVisualSelector] Failed to save settings after renaming preset:", error);
      alert(`\u91CD\u547D\u540D\u6210\u529F\u4F46\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25: ${error.message}`);
    }
    console.log("[VibeGroupVisualSelector] Renamed preset:", oldName, "->", trimmedName);
    if (onRefreshGrid) {
      onRefreshGrid();
    }
  }
  async function handlePresetDelete(presetName, onRefreshGrid) {
    const vibeGroups = settings3.vibeGroups || {};
    const preset = vibeGroups[presetName];
    if (!preset) {
      console.error("[VibeGroupVisualSelector] Preset not found:", presetName);
      alert(`\u9519\u8BEF: \u9884\u8BBE "${presetName}" \u4E0D\u5B58\u5728`);
      return;
    }
    const groupCount = Object.keys(vibeGroups).length;
    if (presetName === "\u9ED8\u8BA4\u7EC4" && groupCount === 1) {
      alert("\u4E0D\u80FD\u5220\u9664\u552F\u4E00\u7684\u7EC4");
      console.warn("[VibeGroupVisualSelector] Cannot delete the only group");
      return;
    }
    const confirmed = confirm(`\u786E\u5B9A\u8981\u5220\u9664\u7EC4 "${presetName}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002`);
    if (!confirmed) {
      console.log("[VibeGroupVisualSelector] Deletion cancelled by user");
      return;
    }
    try {
      if (preset.coverImageId) {
        try {
          await deleteConfigImage(preset.coverImageId);
          console.log("[VibeGroupVisualSelector] Deleted cover image:", preset.coverImageId);
        } catch (error) {
          console.warn("[VibeGroupVisualSelector] Failed to delete cover image:", preset.coverImageId, error);
        }
      }
      delete vibeGroups[presetName];
      console.log("[VibeGroupVisualSelector] Deleted preset:", presetName);
      if (settings3.vibeGroupId === presetName) {
        if (vibeGroups["\u9ED8\u8BA4\u7EC4"]) {
          settings3.vibeGroupId = "\u9ED8\u8BA4\u7EC4";
        } else {
          const remainingGroups = Object.keys(vibeGroups);
          if (remainingGroups.length > 0) {
            settings3.vibeGroupId = remainingGroups[0];
          } else {
            vibeGroups["\u9ED8\u8BA4\u7EC4"] = {
              vibes: [],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            settings3.vibeGroupId = "\u9ED8\u8BA4\u7EC4";
            console.log("[VibeGroupVisualSelector] Created default group after deleting last group");
          }
        }
        console.log("[VibeGroupVisualSelector] Switched to group:", settings3.vibeGroupId);
      }
      try {
        saveSettingsDebounced();
      } catch (error) {
        console.error("[VibeGroupVisualSelector] Failed to save settings after deleting preset:", error);
        alert(`\u5220\u9664\u6210\u529F\u4F46\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25: ${error.message}`);
      }
      if (Object.keys(vibeGroups).length === 0) {
        console.log("[VibeGroupVisualSelector] No groups remaining, closing dialog");
        parent.removeChild(backdrop);
      } else {
        onRefreshGrid();
      }
      console.log("[VibeGroupVisualSelector] Successfully deleted preset:", presetName);
    } catch (error) {
      console.error("[VibeGroupVisualSelector] Error deleting preset:", error);
      alert(`\u5220\u9664\u5931\u8D25: ${error.message}`);
    }
  }
  async function refreshCardImage3(container, imageData) {
    const actions = container.querySelector(".st-chatu8-preset-card-actions");
    container.innerHTML = "";
    if (imageData) {
      const img = document.createElement("img");
      img.src = imageData;
      img.alt = "Cover image";
      img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
      container.appendChild(img);
    } else {
      container.innerHTML = `
                <div class="st-chatu8-preset-card-placeholder">
                    <i class="fa-solid fa-image"></i>
                    <div>\u65E0\u56FE\u50CF</div>
                </div>
            `;
    }
    if (actions) {
      container.appendChild(actions);
    }
    console.log("[VibeGroupVisualSelector] Card image refreshed");
  }
  async function renderCurrentPage() {
    const gridContainer = backdrop.querySelector(".st-chatu8-preset-grid");
    const vibeGroups = settings3.vibeGroups || {};
    const currentGroupId = settings3.vibeGroupId;
    gridContainer.style.opacity = "0";
    gridContainer.style.transform = "translateY(10px)";
    gridContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    gridContainer.innerHTML = "";
    if (filteredPresetNames.length === 0) {
      gridContainer.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 3rem;
                    color: rgba(255, 255, 255, 0.5);
                ">
                    <i class="fa-solid fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <p>${searchQuery ? "\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684 Vibe \u7EC4\u9884\u8BBE" : "\u6CA1\u6709\u53EF\u7528\u7684 Vibe \u7EC4\u9884\u8BBE"}</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">${searchQuery ? "\u8BF7\u5C1D\u8BD5\u5176\u4ED6\u641C\u7D22\u8BCD" : "\u8BF7\u5148\u521B\u5EFA Vibe \u7EC4\u9884\u8BBE"}</p>
                </div>
            `;
      gridContainer.style.opacity = "1";
      gridContainer.style.transform = "translateY(0)";
      bulkControls.refresh();
      console.log("[VibeGroupVisualSelector] Displayed empty state");
      return;
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredPresetNames.length);
    console.log("[VibeGroupVisualSelector] Rendering page", currentPage, "presets", startIndex, "to", endIndex - 1);
    const pagePresetNames = filteredPresetNames.slice(startIndex, endIndex);
    for (const presetName of pagePresetNames) {
      const preset = vibeGroups[presetName];
      const isSelected = presetName === currentGroupId;
      const card = await createVibeGroupPresetCard({
        presetName,
        preset,
        isSelected,
        onCardClick: (name, cardElement) => {
          const isManagementMode3 = backdrop.classList.contains("st-chatu8-mode-manage");
          if (isBulkDeleteMode) {
            if (selectedForDelete.has(name)) {
              selectedForDelete.delete(name);
              cardElement.classList.remove("selected-for-delete");
              console.log("[VibeGroupVisualSelector] Deselected for bulk delete:", name);
            } else {
              selectedForDelete.add(name);
              cardElement.classList.add("selected-for-delete");
              console.log("[VibeGroupVisualSelector] Selected for bulk delete:", name);
            }
            updateBulkDeleteLabel();
            bulkControls.refresh();
          } else if (isManagementMode3) {
            console.log("[VibeGroupVisualSelector] Card clicked in management mode - no action");
          } else {
            console.log("[VibeGroupVisualSelector] Card clicked in normal mode:", name);
            settings3.vibeGroupId = name;
            try {
              saveSettingsDebounced();
            } catch (error) {
              console.error("[VibeGroupVisualSelector] Failed to save settings after preset selection:", error);
              alert(`\u9009\u62E9\u6210\u529F\u4F46\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25: ${error.message}`);
            }
            if (onSelect) {
              onSelect(name);
            }
            parent.removeChild(backdrop);
            console.log("[VibeGroupVisualSelector] Preset selected and dialog closed:", name);
          }
        },
        onRefreshGrid: () => {
          renderCurrentPage();
        }
      });
      const isManagementMode2 = backdrop.classList.contains("st-chatu8-mode-manage");
      if (isManagementMode2) {
        const imageContainer = card.querySelector(".st-chatu8-preset-card-image");
        const actionButtons = createActionButtons(presetName, preset, imageContainer, () => {
          updateFilteredPresets();
          updatePaginationUI();
          renderCurrentPage();
        });
        imageContainer.appendChild(actionButtons);
      }
      card.dataset.presetName = presetName;
      gridContainer.appendChild(card);
    }
    syncCardSelection();
    bulkControls.refresh();
    gridContainer.style.opacity = "1";
    gridContainer.style.transform = "translateY(0)";
    console.log("[VibeGroupVisualSelector] Rendered", pagePresetNames.length, "cards");
  }
  paginationPrev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      updatePaginationUI();
      renderCurrentPage();
      console.log("[VibeGroupVisualSelector] Navigate to previous page:", currentPage);
    }
  };
  paginationNext.onclick = () => {
    const totalPages = Math.max(1, Math.ceil(filteredPresetNames.length / pageSize));
    if (currentPage < totalPages) {
      currentPage++;
      updatePaginationUI();
      renderCurrentPage();
      console.log("[VibeGroupVisualSelector] Navigate to next page:", currentPage);
    }
  };
  paginationSizeSelect.onchange = (e) => {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1;
    updatePaginationUI();
    renderCurrentPage();
    console.log("[VibeGroupVisualSelector] Page size changed to:", pageSize);
  };
  function updateBulkDeleteLabel() {
    const btn = backdrop.querySelector(".st-chatu8-mode-toggle-bulk-delete");
    if (!btn) return;
    if (isBulkDeleteMode && selectedForDelete.size > 0) {
      btn.innerHTML = `<i class="fa-solid fa-trash"></i> \u786E\u8BA4\u5220\u9664 (${selectedForDelete.size})`;
    } else if (isBulkDeleteMode) {
      btn.innerHTML = `<i class="fa-solid fa-trash"></i> \u53D6\u6D88\u5220\u9664`;
    } else {
      btn.innerHTML = `<i class="fa-solid fa-trash"></i> \u6279\u91CF\u5220\u9664`;
    }
  }
  function syncCardSelection() {
    const cards = backdrop.querySelectorAll(".st-chatu8-preset-card");
    cards.forEach((card) => {
      const name = card.dataset.presetName;
      const shouldSelect = isBulkDeleteMode && name && selectedForDelete.has(name);
      card.classList.toggle("selected-for-delete", !!shouldSelect);
    });
  }
  const modeControls = backdrop.querySelector(".st-chatu8-viz-mode-controls");
  const bulkControls = createBulkSelectControls({
    container: modeControls,
    selected: selectedForDelete,
    // "默认组" is the fallback group (vibeGroupId resets to it after deletion),
    // so keep it out of select all / invert to avoid wiping it in one click.
    // It can still be deleted deliberately by clicking its card.
    getSelectable: () => filteredPresetNames.filter((name) => name !== "\u9ED8\u8BA4\u7EC4"),
    onChange: () => {
      syncCardSelection();
      updateBulkDeleteLabel();
    },
    style: "btn"
  });
  updateFilteredPresets();
  updatePaginationUI();
  renderCurrentPage();
  const searchInput = backdrop.querySelector(".st-chatu8-viz-search-input");
  searchInput.oninput = (e) => {
    searchQuery = e.target.value.trim();
    currentPage = 1;
    updateFilteredPresets();
    updatePaginationUI();
    renderCurrentPage();
    console.log("[VibeGroupVisualSelector] Search query changed:", searchQuery);
  };
  const manageModeBtn = backdrop.querySelector(".st-chatu8-mode-toggle-manage");
  let isManagementMode = false;
  manageModeBtn.onclick = () => {
    isManagementMode = !isManagementMode;
    if (isManagementMode) {
      backdrop.classList.add("st-chatu8-mode-manage");
      manageModeBtn.classList.add("active");
      manageModeBtn.style.backgroundColor = "rgba(33, 150, 243, 0.2)";
      manageModeBtn.style.borderColor = "#2196f3";
      console.log("[VibeGroupVisualSelector] Entered management mode");
    } else {
      backdrop.classList.remove("st-chatu8-mode-manage");
      manageModeBtn.classList.remove("active");
      manageModeBtn.style.backgroundColor = "";
      manageModeBtn.style.borderColor = "";
      console.log("[VibeGroupVisualSelector] Exited management mode");
    }
    if (isBulkDeleteMode) {
      isBulkDeleteMode = false;
      backdrop.classList.remove("st-chatu8-mode-bulk-delete");
      selectedForDelete.clear();
      const bulkDeleteBtn2 = backdrop.querySelector(".st-chatu8-mode-toggle-bulk-delete");
      if (bulkDeleteBtn2) {
        bulkDeleteBtn2.classList.remove("active");
        bulkDeleteBtn2.style.backgroundColor = "";
        bulkDeleteBtn2.style.borderColor = "";
      }
      updateBulkDeleteLabel();
      bulkControls.hide();
      console.log("[VibeGroupVisualSelector] Exited bulk delete mode (switched to management mode)");
    }
    renderCurrentPage();
  };
  const bulkDeleteBtn = backdrop.querySelector(".st-chatu8-mode-toggle-bulk-delete");
  bulkDeleteBtn.onclick = () => {
    if (isBulkDeleteMode && selectedForDelete.size > 0) {
      handleBulkDelete(selectedForDelete, () => {
        isBulkDeleteMode = false;
        selectedForDelete.clear();
        backdrop.classList.remove("st-chatu8-mode-bulk-delete");
        bulkDeleteBtn.classList.remove("active");
        bulkDeleteBtn.style.backgroundColor = "";
        bulkDeleteBtn.style.borderColor = "";
        updateBulkDeleteLabel();
        bulkControls.hide();
        updateFilteredPresets();
        updatePaginationUI();
        renderCurrentPage();
      });
    } else {
      isBulkDeleteMode = !isBulkDeleteMode;
      if (isBulkDeleteMode) {
        backdrop.classList.add("st-chatu8-mode-bulk-delete");
        bulkDeleteBtn.classList.add("active");
        bulkDeleteBtn.style.backgroundColor = "rgba(244, 67, 54, 0.2)";
        bulkDeleteBtn.style.borderColor = "#f44336";
        selectedForDelete.clear();
        updateBulkDeleteLabel();
        bulkControls.show();
        console.log("[VibeGroupVisualSelector] Entered bulk delete mode");
      } else {
        backdrop.classList.remove("st-chatu8-mode-bulk-delete");
        bulkDeleteBtn.classList.remove("active");
        bulkDeleteBtn.style.backgroundColor = "";
        bulkDeleteBtn.style.borderColor = "";
        selectedForDelete.clear();
        updateBulkDeleteLabel();
        bulkControls.hide();
        console.log("[VibeGroupVisualSelector] Exited bulk delete mode");
      }
      if (isManagementMode) {
        isManagementMode = false;
        backdrop.classList.remove("st-chatu8-mode-manage");
        manageModeBtn.classList.remove("active");
        manageModeBtn.style.backgroundColor = "";
        manageModeBtn.style.borderColor = "";
        console.log("[VibeGroupVisualSelector] Exited management mode (switched to bulk delete mode)");
      }
      renderCurrentPage();
    }
  };
  console.log("[VibeGroupVisualSelector] Dialog opened");
}

async function handleBulkDelete(selectedPresets, onRefreshGrid) {
  const settings3 = extension_settings[extensionName];
  const vibeGroups = settings3.vibeGroups || {};
  const currentGroupId = settings3.vibeGroupId;
  const confirmed = confirm(`\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${selectedPresets.size} \u4E2A Vibe \u7EC4\u9884\u8BBE\u5417\uFF1F\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002`);
  if (!confirmed) {
    console.log("[VibeGroupVisualSelector] Bulk delete cancelled by user");
    return;
  }
  console.log("[VibeGroupVisualSelector] Starting bulk delete of", selectedPresets.size, "presets");
  let deletedCount = 0;
  let errorCount = 0;
  const errors = [];
  for (const presetName of selectedPresets) {
    try {
      const preset = vibeGroups[presetName];
      if (preset && preset.coverImageId) {
        try {
          await deleteConfigImage(preset.coverImageId);
          console.log("[VibeGroupVisualSelector] Deleted cover image for preset:", presetName);
        } catch (imageError) {
          console.warn("[VibeGroupVisualSelector] Failed to delete cover image for preset:", presetName, imageError);
        }
      }
      delete vibeGroups[presetName];
      deletedCount++;
      console.log("[VibeGroupVisualSelector] Deleted preset:", presetName);
    } catch (error) {
      errorCount++;
      errors.push({ presetName, error: error.message });
      console.error("[VibeGroupVisualSelector] Failed to delete preset:", presetName, error);
    }
  }
  if (selectedPresets.has(currentGroupId)) {
    if (vibeGroups["\u9ED8\u8BA4\u7EC4"]) {
      settings3.vibeGroupId = "\u9ED8\u8BA4\u7EC4";
    } else {
      const remainingGroups = Object.keys(vibeGroups);
      if (remainingGroups.length > 0) {
        settings3.vibeGroupId = remainingGroups[0];
      } else {
        vibeGroups["\u9ED8\u8BA4\u7EC4"] = {
          vibes: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        settings3.vibeGroupId = "\u9ED8\u8BA4\u7EC4";
      }
    }
    console.log("[VibeGroupVisualSelector] Current group was deleted, switched to:", settings3.vibeGroupId);
  }
  try {
    saveSettingsDebounced();
  } catch (error) {
    console.error("[VibeGroupVisualSelector] Failed to save settings after bulk delete:", error);
    alert(`\u6279\u91CF\u5220\u9664\u5B8C\u6210\u4F46\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25: ${error.message}

\u6210\u529F\u5220\u9664: ${deletedCount} \u4E2A
\u5931\u8D25: ${errorCount} \u4E2A`);
  }
  if (errorCount > 0) {
    alert(`\u6279\u91CF\u5220\u9664\u5B8C\u6210\u3002
\u6210\u529F\u5220\u9664: ${deletedCount} \u4E2A
\u5931\u8D25: ${errorCount} \u4E2A

\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u4EE5\u83B7\u53D6\u8BE6\u7EC6\u9519\u8BEF\u4FE1\u606F\u3002`);
    console.error("[VibeGroupVisualSelector] Bulk delete errors:", errors);
  } else {
    console.log("[VibeGroupVisualSelector] Bulk delete completed successfully:", deletedCount, "presets deleted");
  }
  if (onRefreshGrid) {
    onRefreshGrid();
  }
  console.log("[VibeGroupVisualSelector] Bulk delete operation completed");
}

function initVibeGroupEditor(settingsModal) {
  ensureVibeGroupPresets();
  void warmMissingVibePresetThumbnails();
  validateAllVibeGroups();
  const vibeGroupEditorBtn = settingsModal.find("#novelai-vibe-group-editor-btn");
  if (vibeGroupEditorBtn.length) {
    vibeGroupEditorBtn.on("click", () => {
      showVibeGroupEditorDialog();
    });
  }
}

export { initVibeGroupEditor, resolveVibeData };
