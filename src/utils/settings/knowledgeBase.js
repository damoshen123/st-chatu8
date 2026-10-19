// 还原自打包产物 — 原始模块: utils/settings/knowledgeBase.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { getWorldEntries, getrWorlds } from "../chatDataUtils.js";
import { getWorldEntrySelectionKey } from "../worldEntrySelection.js";
import { knowledgeBaseService_exports } from "./knowledgeBase/userPreset.js";
import { isKnowledgeBaseEnabled, setKnowledgeBaseEnabled } from "../knowledgeBaseService.js";
import { __set_kbActiveWorld, __set_kbWorldList, __set_reloadWorldsFn, kbActiveWorld, kbWorldList, reloadWorldsFn } from "../ui.js";
import { initPersonaSettings, initUserSettings, refreshPersonaSettings, refreshUserSettings } from "./knowledgeBase/index.js";

function getKBConfig() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.knowledgeBaseConfig) {
    settings3.knowledgeBaseConfig = {
      enabled: false,
      skipConstant: true,
      worldBookSelections: {},
      worldEntrySelections: {}
    };
  }
  if (settings3.knowledgeBaseConfig.skipConstant === void 0) {
    settings3.knowledgeBaseConfig.skipConstant = true;
  }
  return settings3.knowledgeBaseConfig;
}

function saveKBConfig() {
  saveSettingsDebounced();
}

function initKnowledgeBaseSettings(settingsModal) {
  setupSubNavigation2(settingsModal);
  initKBWorldBookUI(settingsModal);
  initPersonaSettings(settingsModal);
  initUserSettings(settingsModal);
}

function refreshKnowledgeBaseSettings(container) {
  const kbRoot = container && container.find("#ch-tab-knowledgeBase").length ? container.find("#ch-tab-knowledgeBase") : $("#ch-tab-knowledgeBase");
  if (!kbRoot.length) return;
  const subNavLinks = kbRoot.find(".st-chatu8-sub-nav-link");
  let activeLink = subNavLinks.filter(".active");
  if (!activeLink.length) {
    activeLink = subNavLinks.first();
    subNavLinks.removeClass("active");
    activeLink.addClass("active");
  }
  const subTabId = activeLink.data("sub-tab") || "ch-sub-tab-kb-entries";
  kbRoot.find(".st-chatu8-sub-tab-content").css("display", "none");
  kbRoot.find(`#${subTabId}`).css("display", "block");
  if (subTabId === "ch-sub-tab-kb-entries") {
    if (typeof reloadWorldsFn === "function") {
      reloadWorldsFn();
    }
  } else if (subTabId === "ch-sub-tab-kb-persona") {
    refreshPersonaSettings();
  } else if (subTabId === "ch-sub-tab-kb-user") {
    refreshUserSettings();
  }
}

function setupSubNavigation2(container) {
  const kbRoot = container.find("#ch-tab-knowledgeBase").length ? container.find("#ch-tab-knowledgeBase") : container;
  kbRoot.find(".st-chatu8-sub-nav-link").off("click").on("click", function(e) {
    e.preventDefault();
    const subTabId = $(this).data("sub-tab");
    kbRoot.find(".st-chatu8-sub-nav-link").removeClass("active");
    $(this).addClass("active");
    kbRoot.find(".st-chatu8-sub-tab-content").css("display", "none");
    kbRoot.find(`#${subTabId}`).css("display", "block");
    if (subTabId === "ch-sub-tab-kb-entries") {
      if (typeof reloadWorldsFn === "function") {
        reloadWorldsFn();
      }
    } else if (subTabId === "ch-sub-tab-kb-persona") {
      refreshPersonaSettings();
    } else if (subTabId === "ch-sub-tab-kb-user") {
      refreshUserSettings();
    }
  });
  const allSubNavLinks = kbRoot.find(".st-chatu8-sub-nav-link");
  const activeLink = allSubNavLinks.filter(".active");
  const targetLink = activeLink.length ? activeLink : allSubNavLinks.first();
  if (targetLink.length) {
    allSubNavLinks.removeClass("active");
    targetLink.addClass("active");
    const targetSubTabId = targetLink.data("sub-tab");
    kbRoot.find(".st-chatu8-sub-tab-content").css("display", "none");
    kbRoot.find(`#${targetSubTabId}`).css("display", "block");
  }
}

function initKBWorldBookUI(settingsModal) {
  const worldListContainer = settingsModal.find("#ch-kb2-world-list");
  const entryListContainer = settingsModal.find("#ch-kb2-entry-list");
  const worldSearchInput = settingsModal.find("#ch-kb2-world-search");
  const entrySearchInput = settingsModal.find("#ch-kb2-entry-search");
  const enabledSwitch = settingsModal.find("#ch-kb2-enabled");
  enabledSwitch.prop("checked", isKnowledgeBaseEnabled());
  enabledSwitch.off("change").on("change", function() {
    setKnowledgeBaseEnabled($(this).prop("checked"));
  });
  const triggerDepthInput = settingsModal.find("#ch-kb2-trigger-depth");
  const savedDepth = typeof getKBConfig().triggerDepth === "number" ? getKBConfig().triggerDepth : 1;
  triggerDepthInput.val(savedDepth);
  triggerDepthInput.off("change input").on("change", function() {
    const val = parseInt($(this).val(), 10);
    getKBConfig().triggerDepth = isNaN(val) || val < 0 ? 0 : val;
    saveKBConfig();
  });
  const skipConstantSwitch = settingsModal.find("#ch-kb2-skip-constant");
  skipConstantSwitch.prop("checked", getKBConfig().skipConstant !== false);
  skipConstantSwitch.off("change").on("change", function() {
    getKBConfig().skipConstant = $(this).prop("checked");
    saveKBConfig();
  });
  async function loadAndRenderWorlds() {
    const config = getKBConfig();
    __set_kbWorldList(await getrWorlds());
    const isCurrentActiveValid = kbActiveWorld && kbWorldList.includes(kbActiveWorld);
    if (!isCurrentActiveValid && kbWorldList.length > 0) {
      const enabledWorld = kbWorldList.find((w) => config.worldBookSelections?.[w]);
      __set_kbActiveWorld(enabledWorld || kbWorldList[0]);
    }
    renderWorldList();
    renderEntryList();
  }
  __set_reloadWorldsFn(loadAndRenderWorlds);
  function renderWorldList() {
    worldListContainer.empty();
    const fragment = document.createDocumentFragment();
    const searchTerm = worldSearchInput.val().toLowerCase();
    const config = getKBConfig();
    kbWorldList.filter((worldName) => worldName.toLowerCase().includes(searchTerm)).forEach((worldName) => {
      const worldItem = $("<div></div>").addClass("st-chatu8-list-item").data("worldName", worldName);
      const checkboxWrapper = $("<span></span>").addClass("st-chatu8-world-checkbox").css({
        position: "relative",
        marginRight: "10px",
        display: "inline-block",
        width: "16px",
        height: "16px"
      });
      const textSpan = $("<span></span>").text(worldName);
      if (config.worldBookSelections[worldName]) {
        worldItem.addClass("world-selected");
      }
      if (worldName === kbActiveWorld) {
        worldItem.addClass("active");
      }
      worldItem.append(checkboxWrapper).append(textSpan);
      fragment.appendChild(worldItem[0]);
    });
    worldListContainer.append(fragment);
  }
  async function renderEntryList() {
    entryListContainer.empty();
    if (!kbActiveWorld) {
      entryListContainer.html('<div style="padding:10px; color:#888;">\u8BF7\u5148\u5728\u5DE6\u4FA7\u9009\u62E9\u4E00\u4E2A\u4E16\u754C\u4E66\u3002</div>');
      return;
    }
    const config = getKBConfig();
    const searchTerm = entrySearchInput.val().toLowerCase();
    const entries = await getWorldEntries(kbActiveWorld);
    entryListContainer.empty();
    const fragment = document.createDocumentFragment();
    if (entries) {
      const currentWorldSelections = config.worldEntrySelections[kbActiveWorld] || {};
      const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
      const filteredEntries = entriesArray.filter((entry) => {
        const comment = (entry.comment || "").toLowerCase();
        const keys = (Array.isArray(entry.key) ? entry.key.join(" ") : String(entry.key || "")).toLowerCase();
        return comment.includes(searchTerm) || keys.includes(searchTerm);
      });
      if (filteredEntries.length === 0) {
        entryListContainer.html('<div style="padding:10px; color:#888;">\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u6761\u76EE\u3002</div>');
        return;
      }
      filteredEntries.forEach((entry) => {
        const entryKey = getWorldEntrySelectionKey(entry);
        const displayName = entry.comment || `\u6761\u76EE ${entryKey}`;
        const isConstant = entry.constant === true;
        const entryItem = $("<div></div>").addClass("st-chatu8-list-item").data("entryKey", entryKey).data("entryContent", entry.content || "");
        if (isConstant) {
          entryItem.addClass("constant-entry");
        }
        const textSpan = $("<span></span>").addClass("st-chatu8-entry-text").text(displayName);
        if (isConstant) {
          const constantBadge = $("<span></span>").addClass("st-chatu8-constant-badge").text("\u5E38\u5F00").css({
            marginLeft: "6px",
            padding: "2px 6px",
            background: "rgba(255, 193, 7, 0.2)",
            border: "1px solid rgba(255, 193, 7, 0.4)",
            borderRadius: "3px",
            color: "#ffc107",
            fontSize: "9px",
            fontWeight: "normal"
          });
          textSpan.append(constantBadge);
        }
        const keys = Array.isArray(entry.key) ? entry.key : entry.key ? [entry.key] : [];
        if (keys.length > 0) {
          const keyDisplay = keys.slice(0, 3).join(", ") + (keys.length > 3 ? "..." : "");
          const keyBadge = $("<span></span>").addClass("st-chatu8-key-badge").text("\u{1F511} " + keyDisplay).attr("title", keys.join(", ")).css({
            marginLeft: "6px",
            padding: "2px 6px",
            background: "rgba(33, 150, 243, 0.15)",
            border: "1px solid rgba(33, 150, 243, 0.3)",
            borderRadius: "3px",
            color: "#42a5f5",
            fontSize: "9px",
            fontWeight: "normal",
            maxWidth: "150px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "inline-block",
            verticalAlign: "middle"
          });
          textSpan.append(keyBadge);
        }
        const eyeIcon = $("<i></i>").addClass("fa fa-eye st-chatu8-entry-view-icon").attr("title", "\u67E5\u770B\u5185\u5BB9").on("click", function(e) {
          e.stopPropagation();
          showEntryContentModal(displayName, entry.content || "", entry.key || [], isConstant);
        });
        const checkboxSpan = $("<span></span>").addClass("st-chatu8-entry-checkbox");
        entryItem.append(checkboxSpan).append(textSpan).append(eyeIcon);
        const entryState = currentWorldSelections[entryKey];
        if (entryState === "force") {
          entryItem.addClass("selected force-enabled");
        } else if (entryState === true) {
          entryItem.addClass("selected");
        }
        fragment.appendChild(entryItem[0]);
      });
    } else {
      entryListContainer.html('<div style="padding:10px; color:#888;">\u8FD9\u4E2A\u4E16\u754C\u4E66\u662F\u7A7A\u7684\u3002</div>');
    }
    entryListContainer.append(fragment);
  }
  function handleWorldClick(event) {
    const target = $(event.target).closest(".st-chatu8-list-item");
    if (!target.length) return;
    const worldName = target.data("worldName");
    if (!worldName) return;
    const checkboxArea = $(event.target).closest(".st-chatu8-world-checkbox");
    if (checkboxArea.length) {
      const config = getKBConfig();
      if (!config.worldBookSelections) config.worldBookSelections = {};
      config.worldBookSelections[worldName] = !config.worldBookSelections[worldName];
      saveKBConfig();
      renderWorldList();
    } else {
      if (worldName !== kbActiveWorld) {
        __set_kbActiveWorld(worldName);
        renderWorldList();
        renderEntryList();
      }
    }
  }
  let longPressTimer2 = null;
  let isLongPress2 = false;
  const LONG_PRESS_DURATION = 500;
  function handleEntryMouseDown(event) {
    const target = $(event.target).closest(".st-chatu8-list-item");
    if (!target.length || !kbActiveWorld) return;
    if ($(event.target).closest(".st-chatu8-entry-view-icon").length) return;
    if (!$(event.target).closest(".st-chatu8-entry-checkbox").length) return;
    isLongPress2 = false;
    longPressTimer2 = setTimeout(() => {
      isLongPress2 = true;
      handleForceToggle(target);
    }, LONG_PRESS_DURATION);
  }
  function handleEntryMouseUp() {
    if (longPressTimer2) {
      clearTimeout(longPressTimer2);
      longPressTimer2 = null;
    }
  }
  function handleEntryClick(event) {
    const target = $(event.target).closest(".st-chatu8-list-item");
    if (!target.length || !kbActiveWorld) return;
    if ($(event.target).closest(".st-chatu8-entry-view-icon").length) return;
    if (!$(event.target).closest(".st-chatu8-entry-checkbox").length) return;
    const entryKey = target.data("entryKey");
    if (entryKey === void 0 || entryKey === null) return;
    if (event.type === "contextmenu") {
      event.preventDefault();
      handleForceToggle(target);
      return;
    }
    if (isLongPress2) {
      isLongPress2 = false;
      return;
    }
    const config = getKBConfig();
    if (!config.worldEntrySelections[kbActiveWorld]) {
      config.worldEntrySelections[kbActiveWorld] = {};
    }
    const currentState = config.worldEntrySelections[kbActiveWorld][entryKey];
    if (currentState === true || currentState === "force" || currentState === void 0) {
      config.worldEntrySelections[kbActiveWorld][entryKey] = false;
    } else {
      config.worldEntrySelections[kbActiveWorld][entryKey] = true;
    }
    saveKBConfig();
    renderEntryList();
    renderWorldList();
  }
  function handleForceToggle(target) {
    const entryKey = target.data("entryKey");
    if (entryKey === void 0 || entryKey === null) return;
    const config = getKBConfig();
    if (!config.worldEntrySelections[kbActiveWorld]) {
      config.worldEntrySelections[kbActiveWorld] = {};
    }
    const currentState = config.worldEntrySelections[kbActiveWorld][entryKey];
    if (currentState === "force") {
      config.worldEntrySelections[kbActiveWorld][entryKey] = true;
      toastr.info("\u5DF2\u53D6\u6D88\u5F3A\u5236\u542F\u7528");
    } else {
      config.worldEntrySelections[kbActiveWorld][entryKey] = "force";
      toastr.success("\u5DF2\u8BBE\u4E3A\u5F3A\u5236\u542F\u7528");
    }
    saveKBConfig();
    renderEntryList();
    renderWorldList();
  }
  async function handleSelectAll() {
    if (!kbActiveWorld) return;
    const entries = await getWorldEntries(kbActiveWorld);
    if (!entries) return;
    const config = getKBConfig();
    if (!config.worldEntrySelections[kbActiveWorld]) {
      config.worldEntrySelections[kbActiveWorld] = {};
    }
    const searchTerm = entrySearchInput.val().toLowerCase();
    const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
    const filteredEntries = entriesArray.filter((entry) => {
      const comment = (entry.comment || "").toLowerCase();
      const keys = (Array.isArray(entry.key) ? entry.key.join(" ") : String(entry.key || "")).toLowerCase();
      return comment.includes(searchTerm) || keys.includes(searchTerm);
    });
    filteredEntries.forEach((entry) => {
      const entryKey = getWorldEntrySelectionKey(entry);
      if (entryKey !== void 0 && entryKey !== null) {
        config.worldEntrySelections[kbActiveWorld][entryKey] = true;
      }
    });
    saveKBConfig();
    renderWorldList();
    renderEntryList();
  }
  async function handleDeselectAll() {
    if (!kbActiveWorld) return;
    const entries = await getWorldEntries(kbActiveWorld);
    if (!entries) return;
    const config = getKBConfig();
    if (!config.worldEntrySelections[kbActiveWorld]) {
      config.worldEntrySelections[kbActiveWorld] = {};
    }
    const searchTerm = entrySearchInput.val().toLowerCase();
    const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
    const filteredEntries = entriesArray.filter((entry) => {
      const comment = (entry.comment || "").toLowerCase();
      const keys = (Array.isArray(entry.key) ? entry.key.join(" ") : String(entry.key || "")).toLowerCase();
      return comment.includes(searchTerm) || keys.includes(searchTerm);
    });
    filteredEntries.forEach((entry) => {
      const entryKey = getWorldEntrySelectionKey(entry);
      if (entryKey !== void 0 && entryKey !== null) {
        config.worldEntrySelections[kbActiveWorld][entryKey] = false;
      }
    });
    saveKBConfig();
    renderWorldList();
    renderEntryList();
  }
  async function handleRefreshWorlds() {
    const refreshButton = settingsModal.find("#ch-kb2-refresh-worlds");
    const originalHtml = refreshButton.html();
    refreshButton.prop("disabled", true).html('<i class="fa fa-spinner fa-spin"></i>');
    try {
      await loadAndRenderWorlds();
      toastr.success("\u4E16\u754C\u4E66\u5DF2\u5237\u65B0");
    } catch (error) {
      console.error("[KnowledgeBase] \u5237\u65B0\u4E16\u754C\u4E66\u5931\u8D25:", error);
      toastr.error("\u5237\u65B0\u5931\u8D25: " + error.message);
    } finally {
      refreshButton.prop("disabled", false).html(originalHtml);
    }
  }
  function showEntryContentModal(title, content, keys = [], isConstant = false) {
    document.querySelector(".st-chatu8-entry-content-backdrop")?.remove();
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-workflow-viz-backdrop st-chatu8-entry-content-backdrop";
    let keywordsHtml = "";
    if (keys && keys.length > 0) {
      const keysList = Array.isArray(keys) ? keys : [keys];
      const keysDisplay = keysList.map((k) => `<span style="
                display: inline-block;
                margin: 2px 4px;
                padding: 3px 8px;
                background: rgba(33, 150, 243, 0.2);
                border: 1px solid rgba(33, 150, 243, 0.4);
                border-radius: 4px;
                color: #42a5f5;
                font-size: 12px;
            ">${$("<div>").text(k).html()}</span>`).join("");
      keywordsHtml = `
                <div style="
                    padding: 10px 15px;
                    background: rgba(33, 150, 243, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div style="color: #888; font-size: 11px; margin-bottom: 5px;">\u{1F511} \u89E6\u53D1\u5173\u952E\u8BCD\uFF1A</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${keysDisplay}
                    </div>
                </div>
            `;
    }
    let constantBadge = "";
    if (isConstant) {
      constantBadge = `<span style="
                margin-left: 10px;
                padding: 3px 8px;
                background: rgba(255, 193, 7, 0.2);
                border: 1px solid rgba(255, 193, 7, 0.4);
                border-radius: 4px;
                color: #ffc107;
                font-size: 12px;
            ">\u5E38\u5F00</span>`;
    }
    backdrop.innerHTML = `
            <div class="st-chatu8-workflow-viz-dialog st-chatu8-entry-content-dialog">
                <div class="st-chatu8-workflow-viz-header">
                    <h3>${$("<div>").text(title).html()}${constantBadge}</h3>
                    <span class="st-chatu8-workflow-viz-close">&times;</span>
                </div>
                ${keywordsHtml}
                <div class="st-chatu8-entry-content-body">
                    <pre class="st-chatu8-entry-content-text">${$("<div>").text(content || "(\u65E0\u5185\u5BB9)").html()}</pre>
                </div>
            </div>
        `;
    document.body.appendChild(backdrop);
    backdrop.querySelector(".st-chatu8-workflow-viz-close").onclick = () => backdrop.remove();
    const escHandler = (e) => {
      if (e.key === "Escape") {
        backdrop.remove();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }
  worldListContainer.off("click").on("click", handleWorldClick);
  entryListContainer.off("click contextmenu mousedown mouseup mouseleave touchstart touchend touchcancel").on("click", handleEntryClick).on("contextmenu", handleEntryClick).on("mousedown touchstart", handleEntryMouseDown).on("mouseup mouseleave touchend touchcancel", handleEntryMouseUp);
  worldSearchInput.off("input").on("input", renderWorldList);
  entrySearchInput.off("input").on("input", renderEntryList);
  settingsModal.find("#ch-kb2-select-all").off("click").on("click", handleSelectAll);
  settingsModal.find("#ch-kb2-deselect-all").off("click").on("click", handleDeselectAll);
  settingsModal.find("#ch-kb2-refresh-worlds").off("click").on("click", handleRefreshWorlds);
  settingsModal.find("#ch-kb2-test-trigger").off("click").on("click", handleTestTrigger2);
  loadAndRenderWorlds();
}

async function handleTestTrigger2() {
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.style.zIndex = "10002";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog" style="width: 90%; max-width: 1000px; max-height: 85vh;">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u{1F9EA} \u6D4B\u8BD5\u8D44\u6599\u5E93\u89E6\u53D1</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; max-height: calc(85vh - 60px);">
                <div>
                    <label style="display: block; margin-bottom: 8px; color: #ddd; font-weight: bold;">
                        \u8F93\u5165\u89E6\u53D1\u6587\u672C\uFF08\u53EF\u9009\uFF0C\u7559\u7A7A\u5219\u4F7F\u7528\u9ED8\u8BA4\u6D4B\u8BD5\u6587\u672C\uFF09\uFF1A
                    </label>
                    <textarea id="test-kb-trigger-input" style="
                        width: 100%;
                        min-height: 100px;
                        padding: 10px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 6px;
                        color: #ddd;
                        font-family: monospace;
                        resize: vertical;
                    " placeholder="\u4F8B\u5982\uFF1A\u89D2\u8272\u540D\u3001\u5730\u70B9\u3001\u7269\u54C1\u7B49\u5173\u952E\u8BCD..."></textarea>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="test-kb-trigger-run" style="
                        flex: 1;
                        padding: 10px 20px;
                        background: rgba(76, 175, 80, 0.3);
                        border: 1px solid rgba(76, 175, 80, 0.5);
                        border-radius: 6px;
                        color: #4CAF50;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">
                        <i class="fa fa-play"></i> \u5F00\u59CB\u6D4B\u8BD5
                    </button>
                </div>
                <div id="test-kb-trigger-result" style="display: none;">
                    <!-- \u6D4B\u8BD5\u7ED3\u679C\u5C06\u663E\u793A\u5728\u8FD9\u91CC -->
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(backdrop);
  const closeBtn = backdrop.querySelector(".st-chatu8-workflow-viz-close");
  closeBtn.onclick = () => backdrop.remove();
  const escHandler = (e) => {
    if (e.key === "Escape") {
      backdrop.remove();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
  const runBtn = backdrop.querySelector("#test-kb-trigger-run");
  const inputArea = backdrop.querySelector("#test-kb-trigger-input");
  const resultDiv = backdrop.querySelector("#test-kb-trigger-result");
  runBtn.onclick = async () => {
    const triggerText = inputArea.value.trim() || "\u4F60\u597D";
    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> \u6D4B\u8BD5\u4E2D...';
    try {
      const { testKnowledgeBaseTrigger: testKnowledgeBaseTrigger2 } = await import("../knowledgeBaseService.js");
      const knowledgeBaseData = await testKnowledgeBaseTrigger2(triggerText);
      displayKBTestResult(resultDiv, knowledgeBaseData, triggerText);
    } catch (error) {
      console.error("[KnowledgeBase] \u6D4B\u8BD5\u89E6\u53D1\u5931\u8D25:", error);
      resultDiv.innerHTML = `
                <div style="padding: 15px; background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3); border-radius: 6px; color: #f44336;">
                    <i class="fa fa-times-circle"></i> \u6D4B\u8BD5\u5931\u8D25: ${error.message || "\u672A\u77E5\u9519\u8BEF"}
                </div>
            `;
      resultDiv.style.display = "block";
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = '<i class="fa fa-play"></i> \u5F00\u59CB\u6D4B\u8BD5';
    }
  };
}

function displayKBTestResult(container, knowledgeBaseData, triggerText) {
  container.style.display = "block";
  if (!knowledgeBaseData || knowledgeBaseData.length === 0) {
    container.innerHTML = `
            <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;">
                <div style="color: #888; text-align: center;">
                    <i class="fa fa-info-circle"></i> \u6CA1\u6709\u89E6\u53D1\u4EFB\u4F55\u8D44\u6599\u5E93\u6761\u76EE
                </div>
            </div>
        `;
    return;
  }
  const totalEntries = knowledgeBaseData.reduce((sum, wb) => sum + wb.entries.length, 0);
  let html = `
        <div style="margin-bottom: 15px; padding: 12px; background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px;">
            <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">
                <i class="fa fa-check-circle"></i> \u6D4B\u8BD5\u5B8C\u6210
            </div>
            <div style="color: #ddd; font-size: 13px;">
                \u89E6\u53D1\u4E86 <strong>${knowledgeBaseData.length}</strong> \u4E2A\u4E16\u754C\u4E66\uFF0C\u5171 <strong>${totalEntries}</strong> \u4E2A\u6761\u76EE
            </div>
            <div style="color: #888; font-size: 12px; margin-top: 5px;">
                \u89E6\u53D1\u6587\u672C: ${$("<div>").text(triggerText).html()}
            </div>
        </div>
    `;
  knowledgeBaseData.forEach((worldBook, worldIndex) => {
    const worldId = `test-kb-world-${worldIndex}`;
    const worldName = worldBook.worldName || "\u672A\u547D\u540D\u4E16\u754C\u4E66";
    const entries = worldBook.entries || [];
    let entriesHtml = "";
    entries.forEach((entry, entryIndex) => {
      const entryId = `${worldId}-entry-${entryIndex}`;
      const entryName = entry.comment || "\u672A\u547D\u540D\u6761\u76EE";
      const entryContent = entry.content || "";
      const previewLength = 150;
      const entryPreview = entryContent.substring(0, previewLength);
      const hasMore = entryContent.length > previewLength;
      const isConstant = entry.constant === true;
      const keys = Array.isArray(entry.key) ? entry.key : entry.key ? [entry.key] : [];
      const keyDisplay = keys.length > 0 ? keys.slice(0, 5).join(", ") + (keys.length > 5 ? "..." : "") : "";
      const escapeHtml11 = (text) => $("<div>").text(text).html();
      const escapedContent = escapeHtml11(entryContent);
      const escapedPreview = escapeHtml11(entryPreview);
      const escapedName = escapeHtml11(entryName);
      const escapedKeyDisplay = escapeHtml11(keyDisplay);
      const escapedKeysTitle = escapeHtml11(keys.join(", "));
      const borderColor = isConstant ? "rgba(255, 193, 7, 0.4)" : "rgba(156, 39, 176, 0.3)";
      const bgColor = isConstant ? "rgba(255, 193, 7, 0.08)" : "rgba(156, 39, 176, 0.05)";
      const titleColor = isConstant ? "#ffc107" : "#ba68c8";
      const badgeBg = isConstant ? "rgba(255, 193, 7, 0.2)" : "rgba(156, 39, 176, 0.2)";
      const badgeColor = isConstant ? "#ffc107" : "#ba68c8";
      entriesHtml += `
                <div class="test-kb-entry-item" style="
                    margin-bottom: 8px;
                    padding: 8px 10px;
                    background: ${bgColor};
                    border-left: 2px solid ${borderColor};
                    border-radius: 4px;
                ">
                    <div style="
                        font-weight: bold;
                        color: ${titleColor};
                        font-size: 12px;
                        margin-bottom: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 6px;
                    ">
                        <div style="display: flex; align-items: center; gap: 6px; flex: 1; flex-wrap: wrap;">
                            <i class="fa-solid fa-bookmark" style="font-size: 10px;"></i>
                            <span>${escapedName}</span>
                            ${isConstant ? `
                            <span style="
                                padding: 2px 6px;
                                background: ${badgeBg};
                                border: 1px solid ${borderColor};
                                border-radius: 3px;
                                color: ${badgeColor};
                                font-size: 9px;
                                font-weight: normal;
                            ">\u5E38\u5F00</span>
                            ` : ""}
                            ${keyDisplay ? `
                            <span style="
                                padding: 2px 6px;
                                background: rgba(33, 150, 243, 0.15);
                                border: 1px solid rgba(33, 150, 243, 0.3);
                                border-radius: 3px;
                                color: #42a5f5;
                                font-size: 9px;
                                font-weight: normal;
                                max-width: 300px;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            " title="${escapedKeysTitle}">\u{1F511} ${escapedKeyDisplay}</span>
                            ` : ""}
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <button class="test-kb-entry-disable-btn" data-world-name="${worldName}" data-entry-uid="${encodeURIComponent(getWorldEntrySelectionKey(entry) ?? "")}" style="
                                padding: 2px 8px;
                                background: rgba(255, 152, 0, 0.15);
                                border: 1px solid rgba(255, 152, 0, 0.3);
                                border-radius: 3px;
                                color: #ff9800;
                                cursor: pointer;
                                font-size: 10px;
                                transition: all 0.2s;
                            " title="\u7981\u7528\u6B64\u6761\u76EE">
                                <i class="fa-solid fa-ban"></i> \u7981\u7528
                            </button>
                            ${hasMore ? `
                            <button class="test-kb-entry-toggle-top" data-entry-id="${entryId}" style="
                                padding: 2px 8px;
                                background: rgba(156, 39, 176, 0.15);
                                border: 1px solid rgba(156, 39, 176, 0.3);
                                border-radius: 3px;
                                color: #ba68c8;
                                cursor: pointer;
                                font-size: 10px;
                                transition: all 0.2s;
                                display: none;
                            ">
                                <i class="fa-solid fa-chevron-up"></i> \u6536\u8D77
                            </button>
                            ` : ""}
                        </div>
                    </div>
                    <div class="test-kb-entry-preview" style="
                        white-space: pre-wrap;
                        line-height: 1.5;
                        font-size: 13px;
                        color: #ddd;
                        ${hasMore ? "cursor: pointer;" : ""}
                    " data-entry-id="${entryId}">
                        ${hasMore ? escapedPreview + "..." : escapedContent}
                    </div>
                    <div class="test-kb-entry-full" id="${entryId}-full" style="
                        white-space: pre-wrap;
                        line-height: 1.5;
                        font-size: 13px;
                        color: #ddd;
                        display: none;
                    ">
                        ${escapedContent}
                    </div>
                    ${hasMore ? `
                    <button class="test-kb-entry-toggle" data-entry-id="${entryId}" style="
                        margin-top: 6px;
                        padding: 3px 10px;
                        background: rgba(156, 39, 176, 0.15);
                        border: 1px solid rgba(156, 39, 176, 0.3);
                        border-radius: 3px;
                        color: #ba68c8;
                        cursor: pointer;
                        font-size: 11px;
                        transition: all 0.2s;
                    ">
                        <i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00
                    </button>
                    ` : ""}
                </div>
            `;
    });
    html += `
            <div class="test-kb-world-item" style="
                margin-bottom: 12px;
                border: 1px solid rgba(156, 39, 176, 0.2);
                border-radius: 6px;
                overflow: hidden;
                background: rgba(156, 39, 176, 0.03);
            ">
                <div class="test-kb-world-header" data-world-id="${worldId}" style="
                    padding: 10px 12px;
                    background: rgba(156, 39, 176, 0.1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    user-select: none;
                    transition: background 0.2s;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-chevron-right test-kb-world-icon" style="
                            color: #ba68c8;
                            font-size: 12px;
                            transition: transform 0.2s;
                        "></i>
                        <span style="font-weight: bold; color: #ba68c8; font-size: 13px;">
                            \u{1F4DA} ${worldName}
                        </span>
                    </div>
                    <span style="font-size: 11px; color: #888;">
                        ${entries.length} \u4E2A\u6761\u76EE
                    </span>
                </div>
                <div class="test-kb-world-content" id="${worldId}-content" style="
                    padding: 10px;
                    display: none;
                ">
                    ${entriesHtml}
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
  $(container).off("click").on("click", ".test-kb-world-header", function() {
    const worldId = $(this).data("world-id");
    const $content = $(`#${worldId}-content`);
    const $icon = $(this).find(".test-kb-world-icon");
    if ($content.is(":visible")) {
      $content.slideUp(200);
      $icon.css("transform", "rotate(0deg)");
    } else {
      $content.slideDown(200);
      $icon.css("transform", "rotate(90deg)");
    }
  });
  $(container).on("click", ".test-kb-entry-toggle", function(e) {
    e.stopPropagation();
    const entryId = $(this).data("entry-id");
    const $item = $(this).closest(".test-kb-entry-item");
    const $preview = $item.find(".test-kb-entry-preview");
    const $full = $(`#${entryId}-full`);
    const $topBtn = $item.find(".test-kb-entry-toggle-top");
    if ($full.is(":visible")) {
      $full.hide();
      $preview.show();
      $(this).html('<i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00');
      $topBtn.hide();
    } else {
      $preview.hide();
      $full.show();
      $(this).html('<i class="fa-solid fa-chevron-up"></i> \u6536\u8D77');
      $topBtn.show();
    }
  });
  $(container).on("click", ".test-kb-entry-toggle-top", function(e) {
    e.stopPropagation();
    const entryId = $(this).data("entry-id");
    const $item = $(this).closest(".test-kb-entry-item");
    const $preview = $item.find(".test-kb-entry-preview");
    const $full = $(`#${entryId}-full`);
    const $bottomBtn = $item.find(".test-kb-entry-toggle");
    $full.hide();
    $preview.show();
    $bottomBtn.html('<i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00');
    $(this).hide();
  });
  $(container).on("click", ".test-kb-entry-preview", function(e) {
    const entryId = $(this).data("entry-id");
    if (!entryId) return;
    const $toggle = $(this).siblings(".test-kb-entry-toggle");
    if ($toggle.length > 0) {
      $toggle.click();
    }
  });
  $(container).on("click", ".test-kb-entry-disable-btn", async function(e) {
    e.stopPropagation();
    const worldName = $(this).data("world-name");
    const entryUid = decodeURIComponent($(this).attr("data-entry-uid") ?? "");
    if (!worldName || entryUid === "") {
      console.warn("[KnowledgeBase] \u5207\u6362\u6761\u76EE\u72B6\u6001\u5931\u8D25\uFF1A\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570", { worldName, entryUid });
      return;
    }
    try {
      const config = getKBConfig();
      if (!config.worldEntrySelections[worldName]) {
        config.worldEntrySelections[worldName] = {};
      }
      const currentState = config.worldEntrySelections[worldName][entryUid];
      const newState = currentState === false ? true : false;
      config.worldEntrySelections[worldName][entryUid] = newState;
      saveKBConfig();
      console.log("[KnowledgeBase] \u5DF2\u5207\u6362\u6761\u76EE\u72B6\u6001:", {
        worldName,
        entryUid,
        \u539F\u72B6\u6001: currentState,
        \u65B0\u72B6\u6001: newState
      });
      const $btn = $(this);
      if (newState === false) {
        $btn.html('<i class="fa-solid fa-check-circle"></i> \u5DF2\u7981\u7528');
        $btn.css({
          "background": "rgba(158, 158, 158, 0.15)",
          "border-color": "rgba(158, 158, 158, 0.3)",
          "color": "#9e9e9e"
        });
        $btn.attr("title", "\u70B9\u51FB\u542F\u7528\u6B64\u6761\u76EE");
        toastr.info(`\u5DF2\u7981\u7528\u6761\u76EE\uFF08\u4E16\u754C\u4E66: ${worldName}\uFF09`);
      } else {
        $btn.html('<i class="fa-solid fa-ban"></i> \u7981\u7528');
        $btn.css({
          "background": "rgba(255, 152, 0, 0.15)",
          "border-color": "rgba(255, 152, 0, 0.3)",
          "color": "#ff9800"
        });
        $btn.attr("title", "\u7981\u7528\u6B64\u6761\u76EE");
        toastr.success(`\u5DF2\u542F\u7528\u6761\u76EE\uFF08\u4E16\u754C\u4E66: ${worldName}\uFF09`);
      }
    } catch (err) {
      console.error("[KnowledgeBase] \u5207\u6362\u6761\u76EE\u72B6\u6001\u5931\u8D25:", err);
      toastr.error("\u64CD\u4F5C\u5931\u8D25: " + (err.message || "\u672A\u77E5\u9519\u8BEF"));
    }
  });
}

export { initKnowledgeBaseSettings, refreshKnowledgeBaseSettings };
