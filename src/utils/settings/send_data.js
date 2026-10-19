// 还原自打包产物 — 原始模块: utils/settings/send_data.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, event_types, saveMetadata, saveSettingsDebounced } from "../../../../../../../script.js";
import { getContext } from "../../../../../../st-context.js";
import { extensionName } from "../config.js";
import { getWorldEntries, getcharWorld, getrWorlds } from "../chatDataUtils.js";
import { getWorldEntrySelectionKey, worldEntrySelectionKeys } from "../worldEntrySelection.js";
import { worldbookProcessor_exports } from "../videoAssetsService.js";
import "../promptReq.js"; // init_promptReq

var activeWorld, currentCharWorldName, worldBookBindings, worldBookSelections, worldEntryBindings, worldEntrySelections, worldList;

worldList = [];

worldEntrySelections = {};

worldBookSelections = {};

worldBookBindings = {};

worldEntryBindings = {};

activeWorld = null;

currentCharWorldName = null;



function getWorldBookConfig() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.worldBookConfig) {
    settings3.worldBookConfig = {
      worldBookSelections: {},
      savedSelections: {},
      worldEntrySelections: {},
      savedEntrySelections: {},
      worldBookBindings: {},
      worldEntryBindings: {}
    };
  } else {
    if (!settings3.worldBookConfig.worldBookBindings) settings3.worldBookConfig.worldBookBindings = {};
    if (!settings3.worldBookConfig.worldEntryBindings) settings3.worldBookConfig.worldEntryBindings = {};
    if (!settings3.worldBookConfig.savedSelections) settings3.worldBookConfig.savedSelections = { ...settings3.worldBookConfig.worldBookSelections || {} };
    if (!settings3.worldBookConfig.savedEntrySelections) settings3.worldBookConfig.savedEntrySelections = JSON.parse(JSON.stringify(settings3.worldBookConfig.worldEntrySelections || {}));
  }
  return settings3.worldBookConfig;
}

function recalculateEffectiveWorldBooks() {
  const config = getWorldBookConfig();
  const baseSelections = config.savedSelections || {};
  const effectiveSelections = {};
  for (const worldName in baseSelections) {
    if (worldName === currentCharWorldName) continue;
    if (baseSelections[worldName]) {
      const boundParent = config.worldBookBindings?.[worldName];
      if (boundParent && boundParent !== currentCharWorldName) {
        continue;
      }
      effectiveSelections[worldName] = true;
    }
  }
  config.worldBookSelections = effectiveSelections;
  const baseEntries = config.savedEntrySelections || {};
  const effectiveEntries = {};
  for (const wName in baseEntries) {
    effectiveEntries[wName] = {};
    const wBound = config.worldBookBindings?.[wName];
    const isWorldAvailable = !(wBound && wBound !== currentCharWorldName);
    for (const eUid in baseEntries[wName]) {
      const state3 = baseEntries[wName][eUid];
      const eBound = config.worldEntryBindings?.[wName]?.[eUid];
      const isEntryAvailable = !(eBound && eBound !== currentCharWorldName);
      if (!isWorldAvailable || !isEntryAvailable) {
        effectiveEntries[wName][eUid] = false;
      } else {
        effectiveEntries[wName][eUid] = state3;
      }
    }
  }
  config.worldEntrySelections = effectiveEntries;
  saveSettingsDebounced();
}

function saveWorldBookConfig() {
  const config = getWorldBookConfig();
  config.worldBookBindings = { ...worldBookBindings };
  config.worldEntryBindings = JSON.parse(JSON.stringify(worldEntryBindings));
  const userSelections = {};
  for (const worldName in worldBookSelections) {
    if (worldName !== currentCharWorldName) {
      userSelections[worldName] = worldBookSelections[worldName];
    }
  }
  config.savedSelections = userSelections;
  config.savedEntrySelections = JSON.parse(JSON.stringify(worldEntrySelections));
  recalculateEffectiveWorldBooks();
}

function toggleWorldEntryState(worldName, entryUid, newState = null) {
  entryUid = worldEntrySelectionKeys.get(worldName)?.get(String(entryUid)) ?? entryUid;
  if (!worldEntrySelections[worldName]) {
    worldEntrySelections[worldName] = {};
  }
  const currentState = worldEntrySelections[worldName][entryUid];
  if (newState !== null) {
    worldEntrySelections[worldName][entryUid] = newState;
  } else {
    if (currentState === true || currentState === "force" || currentState === void 0) {
      worldEntrySelections[worldName][entryUid] = false;
    } else {
      worldEntrySelections[worldName][entryUid] = true;
    }
  }
  saveWorldBookConfig();
  return worldEntrySelections[worldName][entryUid];
}

function getWorldEntryState(worldName, entryUid) {
  entryUid = worldEntrySelectionKeys.get(worldName)?.get(String(entryUid)) ?? entryUid;
  const wBound = worldBookBindings[worldName];
  if (wBound && wBound !== currentCharWorldName) return false;
  const eBound = worldEntryBindings[worldName]?.[entryUid];
  if (eBound && eBound !== currentCharWorldName) return false;
  if (!worldEntrySelections[worldName]) {
    return void 0;
  }
  return worldEntrySelections[worldName][entryUid];
}

function isNewEntry(worldName, entryKey) {
  const worldSelections = worldEntrySelections[worldName];
  if (!worldSelections) return true;
  return worldSelections[entryKey] === void 0;
}

function initSendData(settingsModal) {
  const worldListContainer = settingsModal.find("#ch-send-data-world-list");
  const entryListContainer = settingsModal.find("#ch-send-data-entry-list");
  const worldSearchInput = settingsModal.find("#ch-send-data-world-search");
  const entrySearchInput = settingsModal.find("#ch-send-data-entry-search");
  async function loadAndRenderWorlds() {
    worldList = await getrWorlds();
    currentCharWorldName = await getcharWorld();
    const config = getWorldBookConfig();
    console.log("[send_data] \u5F53\u524D\u89D2\u8272\u4E16\u754C\u4E66:", currentCharWorldName);
    console.log("[send_data] \u63D2\u4EF6\u914D\u7F6E:", config);
    worldBookSelections = { ...config.savedSelections || config.worldBookSelections || {} };
    worldEntrySelections = JSON.parse(JSON.stringify(config.savedEntrySelections || config.worldEntrySelections || {}));
    worldBookBindings = { ...config.worldBookBindings || {} };
    worldEntryBindings = JSON.parse(JSON.stringify(config.worldEntryBindings || {}));
    recalculateEffectiveWorldBooks();
    if (currentCharWorldName) {
      const hasCharWorldEntrySettings = worldEntrySelections[currentCharWorldName] && Object.keys(worldEntrySelections[currentCharWorldName]).length > 0;
      if (!hasCharWorldEntrySettings) {
        console.log("[send_data] \u5F53\u524D\u89D2\u8272\u4E16\u754C\u4E66\u65E0\u6761\u76EE\u8BB0\u5F55\uFF0C\u521D\u59CB\u5316\u9ED8\u8BA4\u8BBE\u7F6E");
        worldBookSelections[currentCharWorldName] = true;
        const charWorldEntries = await getWorldEntries(currentCharWorldName);
        if (charWorldEntries) {
          worldEntrySelections[currentCharWorldName] = {};
          const entriesArray = Array.isArray(charWorldEntries) ? charWorldEntries : Object.values(charWorldEntries);
          entriesArray.forEach((entry) => {
            const entryKey = getWorldEntrySelectionKey(entry);
            if (entryKey !== void 0 && entryKey !== null) {
              worldEntrySelections[currentCharWorldName][entryKey] = false;
            }
          });
        }
        saveWorldBookConfig();
      } else {
        console.log("[send_data] \u5F53\u524D\u89D2\u8272\u4E16\u754C\u4E66\u6709\u6761\u76EE\u8BB0\u5F55\uFF0C\u9ED8\u8BA4\u5F00\u542F");
        worldBookSelections[currentCharWorldName] = true;
      }
    }
    if (!activeWorld && worldList.length > 0) {
      activeWorld = worldList[0];
    }
    renderWorldList();
    renderEntryList();
  }
  function toggleBinding(worldName) {
    if (!currentCharWorldName) {
      toastr.warning("\u5F53\u524D\u6CA1\u6709\u89D2\u8272\u4E13\u5C5E\u4E16\u754C\u4E66\uFF0C\u65E0\u6CD5\u7ED1\u5B9A\u3002");
      return;
    }
    if (worldBookBindings[worldName] === currentCharWorldName) {
      delete worldBookBindings[worldName];
      toastr.info(`\u5DF2\u89E3\u9664 [${worldName}] \u7684\u7ED1\u5B9A`);
    } else {
      worldBookBindings[worldName] = currentCharWorldName;
      toastr.success(`\u5DF2\u5C06 [${worldName}] \u7ED1\u5B9A\u5230\u5F53\u524D\u89D2\u8272`);
    }
    saveWorldBookConfig();
    renderWorldList();
    if (activeWorld === worldName) renderEntryList();
  }
  function toggleEntryBinding(worldName, entryKey) {
    if (!currentCharWorldName) {
      toastr.warning("\u5F53\u524D\u6CA1\u6709\u89D2\u8272\u4E13\u5C5E\u4E16\u754C\u4E66\uFF0C\u65E0\u6CD5\u7ED1\u5B9A\u3002");
      return;
    }
    if (!worldEntryBindings[worldName]) {
      worldEntryBindings[worldName] = {};
    }
    if (worldEntryBindings[worldName][entryKey] === currentCharWorldName) {
      delete worldEntryBindings[worldName][entryKey];
      toastr.info(`\u5DF2\u89E3\u9664\u6B64\u6761\u76EE\u7684\u7ED1\u5B9A`);
    } else {
      worldEntryBindings[worldName][entryKey] = currentCharWorldName;
      toastr.success(`\u5DF2\u5C06\u6B64\u6761\u76EE\u7ED1\u5B9A\u5230\u5F53\u524D\u89D2\u8272`);
    }
    saveWorldBookConfig();
    renderEntryList();
  }
  function renderWorldList() {
    worldListContainer.empty();
    const fragment = document.createDocumentFragment();
    const searchTerm = worldSearchInput.val().toLowerCase();
    const filteredWorlds = worldList.filter((worldName) => worldName.toLowerCase().includes(searchTerm));
    const charWorld = filteredWorlds.find((w) => w === currentCharWorldName);
    const availableBound = filteredWorlds.filter((w) => worldBookBindings[w] && worldBookBindings[w] === currentCharWorldName);
    const others = filteredWorlds.filter((w) => w !== currentCharWorldName && worldBookBindings[w] !== currentCharWorldName);
    const renderItem = (worldName, type) => {
      const worldItem = $("<div></div>").addClass("st-chatu8-list-item").data("worldName", worldName).css({
        display: "flex",
        alignItems: "center"
      });
      if (type === "availableBound") {
        worldItem.addClass("bound-available");
      } else if (type === "unavailableBound") {
        worldItem.addClass("bound-unavailable");
      }
      const checkboxWrapper = $("<span></span>").addClass("st-chatu8-world-checkbox").css({
        position: "relative",
        marginRight: "10px",
        display: "inline-block",
        width: "16px",
        height: "16px",
        flexShrink: 0
      });
      const textSpan = $("<span></span>").text(worldName).css({
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      });
      if (worldName === currentCharWorldName) {
        textSpan.append($("<span></span>").text(" (\u89D2\u8272)").css({ color: "#4CAF50", fontSize: "0.85em" }));
      } else if (type === "availableBound") {
        textSpan.append($("<span></span>").text(" (\u7ED1\u5B9A)").css({ color: "var(--st-chatu8-text-secondary, #888)", fontSize: "0.85em", marginLeft: "4px" }));
      } else if (type === "unavailableBound") {
        textSpan.append($("<span></span>").text(` (\u7ED1\u5B9A\u7684\u7236\u7EA7: ${worldBookBindings[worldName]})`).css({ color: "#f44336", fontSize: "0.85em", marginLeft: "4px" }));
      }
      if (worldBookSelections[worldName]) {
        worldItem.addClass("world-selected");
      }
      if (worldName === activeWorld) {
        worldItem.addClass("active");
      }
      worldItem.append(checkboxWrapper).append(textSpan);
      if (worldName !== currentCharWorldName && currentCharWorldName) {
        const isBoundToCurrent = worldBookBindings[worldName] === currentCharWorldName;
        const bindIcon = $("<i></i>").addClass(isBoundToCurrent ? "fa fa-unlink st-chatu8-bind-btn bound" : "fa fa-link st-chatu8-bind-btn unbound").attr("title", isBoundToCurrent ? "\u89E3\u9664\u7ED1\u5B9A" : "\u7ED1\u5B9A\u5230\u5F53\u524D\u89D2\u8272").css({
          position: "static",
          transform: "none",
          marginLeft: "auto",
          padding: "4px 8px",
          flexShrink: 0
        }).on("click", function(e) {
          e.stopPropagation();
          toggleBinding(worldName);
        });
        worldItem.append(bindIcon);
      }
      fragment.appendChild(worldItem[0]);
    };
    if (charWorld) renderItem(charWorld, "char");
    availableBound.forEach((w) => renderItem(w, "availableBound"));
    others.forEach((w) => {
      if (worldBookBindings[w]) {
        renderItem(w, "unavailableBound");
      } else {
        renderItem(w, "normal");
      }
    });
    worldListContainer.append(fragment);
  }
  async function renderEntryList() {
    entryListContainer.empty();
    if (!activeWorld) {
      entryListContainer.html('<div style="padding:10px; color:#888;">\u8BF7\u5148\u5728\u5DE6\u4FA7\u9009\u62E9\u4E00\u4E2A\u4E16\u754C\u4E66\u3002</div>');
      settingsModal.find("#ch-send-data-new-entry-buttons").hide();
      return;
    }
    const wBound = worldBookBindings[activeWorld];
    const isWorldAvailable = !(wBound && wBound !== currentCharWorldName);
    const searchTerm = entrySearchInput.val().toLowerCase();
    const entries = await getWorldEntries(activeWorld);
    entryListContainer.empty();
    const fragment = document.createDocumentFragment();
    let hasNewEntries = false;
    if (entries) {
      const currentWorldSelections = worldEntrySelections[activeWorld] || {};
      const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
      const filteredEntries = entriesArray.filter((entry) => {
        const key = entry.key || entry.uid || "";
        const comment = entry.comment || "";
        return String(key).toLowerCase().includes(searchTerm) || String(comment).toLowerCase().includes(searchTerm);
      });
      if (filteredEntries.length === 0) {
        entryListContainer.html('<div style="padding:10px; color:#888;">\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u6761\u76EE\u3002</div>');
        settingsModal.find("#ch-send-data-new-entry-buttons").hide();
        return;
      }
      filteredEntries.forEach((entry) => {
        const entryKey = getWorldEntrySelectionKey(entry);
        const displayName = entry.comment || `\u6761\u76EE ${entryKey}`;
        const isConstant = entry.constant === true;
        const entryItem = $("<div></div>").addClass("st-chatu8-list-item").data("entryKey", entryKey).data("entryContent", entry.content || "");
        const isNew = isNewEntry(activeWorld, entryKey);
        if (isNew) {
          entryItem.addClass("new-entry");
          hasNewEntries = true;
        }
        if (isConstant) {
          entryItem.addClass("constant-entry");
        }
        const eBound = worldEntryBindings[activeWorld]?.[entryKey];
        const isEntryAvailable = !(eBound && eBound !== currentCharWorldName);
        const isAvailable = isWorldAvailable && isEntryAvailable;
        const textSpan = $("<span></span>").addClass("st-chatu8-entry-text").text(displayName);
        if (!isAvailable) {
          textSpan.css({ color: "#f44336" });
        }
        if (isNew) {
          const newBadge = $("<span></span>").addClass("st-chatu8-new-badge").text("\u65B0");
          textSpan.append(newBadge);
        }
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
        if (eBound) {
          if (eBound === currentCharWorldName && isAvailable) {
            const boundBadge = $("<span></span>").text("\u7ED1\u5B9A").attr("title", "\u5DF2\u7ED1\u5B9A\u5230\u5F53\u524D\u89D2\u8272").css({
              marginLeft: "6px",
              padding: "2px 6px",
              background: "rgba(76, 175, 80, 0.15)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              borderRadius: "3px",
              color: "#4CAF50",
              fontSize: "9px",
              fontWeight: "normal",
              display: "inline-block",
              verticalAlign: "middle"
            });
            textSpan.append(boundBadge);
          } else if (eBound !== currentCharWorldName) {
            const boundBadge = $("<span></span>").text(eBound).attr("title", "\u7ED1\u5B9A\u7684\u7236\u7EA7: " + eBound).css({
              marginLeft: "6px",
              padding: "2px 6px",
              background: "rgba(244, 67, 54, 0.15)",
              border: "1px solid rgba(244, 67, 54, 0.3)",
              borderRadius: "3px",
              color: "#f44336",
              fontSize: "9px",
              fontWeight: "normal",
              maxWidth: "48px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-block",
              verticalAlign: "middle"
            });
            textSpan.append(boundBadge);
          }
        }
        const actionWrapper = $("<div></div>").css({ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 });
        const eyeIcon = $("<i></i>").addClass("fa fa-eye st-chatu8-entry-view-icon").attr("title", "\u67E5\u770B\u5185\u5BB9").css({ margin: 0 }).on("click", function(e) {
          e.stopPropagation();
          showEntryContentModal(displayName, entry.content || "", entry.key || [], isConstant);
        });
        actionWrapper.append(eyeIcon);
        if (activeWorld !== currentCharWorldName && currentCharWorldName) {
          const isBoundToCurrent = eBound === currentCharWorldName;
          const bindIcon = $("<i></i>").addClass(isBoundToCurrent ? "fa fa-unlink st-chatu8-bind-btn bound" : "fa fa-link st-chatu8-bind-btn unbound").attr("title", isBoundToCurrent ? "\u89E3\u9664\u7ED1\u5B9A" : "\u7ED1\u5B9A\u5230\u5F53\u524D\u89D2\u8272").css({ position: "static", transform: "none", fontSize: "14px", padding: "0 4px" }).on("click", function(e) {
            e.stopPropagation();
            toggleEntryBinding(activeWorld, entryKey);
          });
          actionWrapper.append(bindIcon);
        }
        const checkboxSpan = $("<span></span>").addClass("st-chatu8-entry-checkbox");
        entryItem.append(checkboxSpan).append(textSpan).append(actionWrapper);
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
    const newEntryButtons = settingsModal.find("#ch-send-data-new-entry-buttons");
    if (hasNewEntries) {
      newEntryButtons.show();
    } else {
      newEntryButtons.hide();
    }
  }
  function handleWorldClick(event) {
    const target = $(event.target).closest(".st-chatu8-list-item");
    if (!target.length) return;
    const worldName = target.data("worldName");
    if (!worldName) return;
    const checkboxArea = $(event.target).closest(".st-chatu8-world-checkbox");
    if (checkboxArea.length) {
      worldBookSelections[worldName] = !worldBookSelections[worldName];
      saveWorldBookConfig();
      renderWorldList();
    } else {
      if (worldName !== activeWorld) {
        activeWorld = worldName;
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
    if (!target.length || !activeWorld) return;
    if ($(event.target).closest(".st-chatu8-entry-view-icon").length) return;
    if ($(event.target).closest(".st-chatu8-bind-btn").length) return;
    if (!$(event.target).closest(".st-chatu8-entry-checkbox").length) return;
    isLongPress2 = false;
    longPressTimer2 = setTimeout(() => {
      isLongPress2 = true;
      handleForceToggle(target);
    }, LONG_PRESS_DURATION);
  }
  function handleEntryMouseUp(event) {
    if (longPressTimer2) {
      clearTimeout(longPressTimer2);
      longPressTimer2 = null;
    }
  }
  function handleEntryClick(event) {
    const target = $(event.target).closest(".st-chatu8-list-item");
    if (!target.length || !activeWorld) return;
    if ($(event.target).closest(".st-chatu8-entry-view-icon").length) return;
    if ($(event.target).closest(".st-chatu8-bind-btn").length) return;
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
    if (!worldEntrySelections[activeWorld]) {
      worldEntrySelections[activeWorld] = {};
    }
    const currentState = worldEntrySelections[activeWorld][entryKey];
    if (currentState === true || currentState === "force" || currentState === void 0) {
      worldEntrySelections[activeWorld][entryKey] = false;
    } else {
      worldEntrySelections[activeWorld][entryKey] = true;
    }
    saveWorldBookConfig();
    renderEntryList();
    renderWorldList();
  }
  function handleForceToggle(target) {
    const entryKey = target.data("entryKey");
    if (entryKey === void 0 || entryKey === null) return;
    if (!worldEntrySelections[activeWorld]) {
      worldEntrySelections[activeWorld] = {};
    }
    const currentState = worldEntrySelections[activeWorld][entryKey];
    if (currentState === "force") {
      worldEntrySelections[activeWorld][entryKey] = true;
      toastr.info("\u5DF2\u53D6\u6D88\u5F3A\u5236\u542F\u7528");
    } else {
      worldEntrySelections[activeWorld][entryKey] = "force";
      toastr.success("\u5DF2\u8BBE\u4E3A\u5F3A\u5236\u542F\u7528");
    }
    saveWorldBookConfig();
    renderEntryList();
    renderWorldList();
  }
  async function handleSelectAll() {
    if (!activeWorld) return;
    const entries = await getWorldEntries(activeWorld);
    if (!entries) return;
    if (!worldEntrySelections[activeWorld]) {
      worldEntrySelections[activeWorld] = {};
    }
    const searchTerm = entrySearchInput.val().toLowerCase();
    const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
    const filteredEntries = entriesArray.filter((entry) => {
      const key = entry.key || entry.uid || "";
      const comment = entry.comment || "";
      return String(key).toLowerCase().includes(searchTerm) || String(comment).toLowerCase().includes(searchTerm);
    });
    filteredEntries.forEach((entry) => {
      const entryKey = getWorldEntrySelectionKey(entry);
      if (entryKey !== void 0 && entryKey !== null) {
        worldEntrySelections[activeWorld][entryKey] = true;
      }
    });
    saveWorldBookConfig();
    renderWorldList();
    renderEntryList();
  }
  async function handleDeselectAll() {
    if (!activeWorld) return;
    const entries = await getWorldEntries(activeWorld);
    if (!entries) return;
    if (!worldEntrySelections[activeWorld]) {
      worldEntrySelections[activeWorld] = {};
    }
    const searchTerm = entrySearchInput.val().toLowerCase();
    const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
    const filteredEntries = entriesArray.filter((entry) => {
      const key = entry.key || entry.uid || "";
      const comment = entry.comment || "";
      return String(key).toLowerCase().includes(searchTerm) || String(comment).toLowerCase().includes(searchTerm);
    });
    filteredEntries.forEach((entry) => {
      const entryKey = getWorldEntrySelectionKey(entry);
      if (entryKey !== void 0 && entryKey !== null) {
        worldEntrySelections[activeWorld][entryKey] = false;
      }
    });
    saveWorldBookConfig();
    renderWorldList();
    renderEntryList();
  }
  async function handleEnableNewEntries() {
    if (!activeWorld) return;
    try {
      const entries = await getWorldEntries(activeWorld);
      if (!entries) return;
      if (!worldEntrySelections[activeWorld]) {
        worldEntrySelections[activeWorld] = {};
      }
      const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
      let count = 0;
      entriesArray.forEach((entry) => {
        const entryKey = getWorldEntrySelectionKey(entry);
        if (entryKey !== void 0 && entryKey !== null && isNewEntry(activeWorld, entryKey)) {
          worldEntrySelections[activeWorld][entryKey] = true;
          count++;
        }
      });
      if (count > 0) {
        saveWorldBookConfig();
        renderWorldList();
        renderEntryList();
        toastr.success(`\u5DF2\u542F\u7528 ${count} \u4E2A\u65B0\u6761\u76EE`);
      } else {
        toastr.info("\u6CA1\u6709\u65B0\u6761\u76EE");
      }
    } catch (error) {
      console.error("[send_data] \u6279\u91CF\u542F\u7528\u65B0\u6761\u76EE\u5931\u8D25:", error);
      toastr.error("\u64CD\u4F5C\u5931\u8D25: " + error.message);
    }
  }
  async function handleDisableNewEntries() {
    if (!activeWorld) return;
    try {
      const entries = await getWorldEntries(activeWorld);
      if (!entries) return;
      if (!worldEntrySelections[activeWorld]) {
        worldEntrySelections[activeWorld] = {};
      }
      const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
      let count = 0;
      entriesArray.forEach((entry) => {
        const entryKey = getWorldEntrySelectionKey(entry);
        if (entryKey !== void 0 && entryKey !== null && isNewEntry(activeWorld, entryKey)) {
          worldEntrySelections[activeWorld][entryKey] = false;
          count++;
        }
      });
      if (count > 0) {
        saveWorldBookConfig();
        renderWorldList();
        renderEntryList();
        toastr.success(`\u5DF2\u7981\u7528 ${count} \u4E2A\u65B0\u6761\u76EE`);
      } else {
        toastr.info("\u6CA1\u6709\u65B0\u6761\u76EE");
      }
    } catch (error) {
      console.error("[send_data] \u6279\u91CF\u7981\u7528\u65B0\u6761\u76EE\u5931\u8D25:", error);
      toastr.error("\u64CD\u4F5C\u5931\u8D25: " + error.message);
    }
  }
  function showEntryContentModal(title, content, keys = [], isConstant = false) {
    document.querySelector(".st-chatu8-entry-content-backdrop")?.remove();
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
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-workflow-viz-backdrop st-chatu8-entry-content-backdrop";
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
    const closeBtn = backdrop.querySelector(".st-chatu8-workflow-viz-close");
    closeBtn.onclick = () => backdrop.remove();
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
  async function handleRefreshWorlds() {
    const refreshButton = settingsModal.find("#ch-send-data-refresh-worlds");
    const originalHtml = refreshButton.html();
    refreshButton.prop("disabled", true).html('<i class="fa fa-spinner fa-spin"></i> \u5237\u65B0\u4E2D...');
    try {
      await loadAndRenderWorlds();
      toastr.success("\u4E16\u754C\u4E66\u5DF2\u5237\u65B0");
    } catch (error) {
      console.error("[send_data] \u5237\u65B0\u4E16\u754C\u4E66\u5931\u8D25:", error);
      toastr.error("\u5237\u65B0\u4E16\u754C\u4E66\u5931\u8D25: " + error.message);
    } finally {
      refreshButton.prop("disabled", false).html(originalHtml);
    }
  }
  settingsModal.find("#ch-send-data-select-all").off("click").on("click", handleSelectAll);
  settingsModal.find("#ch-send-data-deselect-all").off("click").on("click", handleDeselectAll);
  settingsModal.find("#ch-send-data-enable-new-entries").off("click").on("click", handleEnableNewEntries);
  settingsModal.find("#ch-send-data-disable-new-entries").off("click").on("click", handleDisableNewEntries);
  settingsModal.find("#ch-send-data-refresh-worlds").off("click").on("click", handleRefreshWorlds);
  settingsModal.find("#ch-send-data-test-trigger").off("click").on("click", handleTestTrigger);
  eventSource.on(event_types.GENERATION_STARTED, loadAndRenderWorlds);
  const intervalId = setInterval(async () => {
    let conet = getContext();
    const settings3 = extension_settings[extensionName];
    if (conet && conet.chatId && conet.chat && conet.chat.length > 0) {
      if (!conet.chatMetadata) conet.chatMetadata = {};
      if (!conet.chatMetadata.variables) conet.chatMetadata.variables = {};
      conet.chatMetadata.variables.zhihuiji = settings3.scriptEnabled;
      await saveMetadata();
      clearInterval(intervalId);
    }
  }, 2e3);
  eventSource.on(event_types.CHAT_CHANGED, async () => {
    try {
      currentCharWorldName = await getcharWorld();
      recalculateEffectiveWorldBooks();
      if ($("#ch-send-data-world-list").is(":visible")) {
        renderWorldList();
        if (activeWorld) renderEntryList();
      }
    } catch (e) {
      console.error("[send_data] \u540C\u6B65\u89D2\u8272\u4E16\u754C\u4E66\u5931\u8D25:", e);
    }
    let conet = getContext();
    const settings3 = extension_settings[extensionName];
    if (conet && conet.chatId && conet.chat && conet.chat.length > 0) {
      if (!conet.chatMetadata) conet.chatMetadata = {};
      if (!conet.chatMetadata.variables) conet.chatMetadata.variables = {};
      conet.chatMetadata.variables.zhihuiji = settings3.scriptEnabled;
      console.log("1231", conet);
      if (conet.name2 && settings3.characterEnablePresets) {
        let matchedPresets = [];
        for (const presetName in settings3.characterEnablePresets) {
          const preset = settings3.characterEnablePresets[presetName];
          if (preset.bindCharacterCard === conet.name2) {
            matchedPresets.push({ name: presetName, preset });
          }
        }
        let matchedPresetId = null;
        if (matchedPresets.length > 0) {
          if (matchedPresets.length === 1) {
            matchedPresetId = matchedPresets[0].name;
          } else {
            let chatMatched = matchedPresets.find((p) => p.preset.bindChatId === conet.chatId);
            if (chatMatched) {
              matchedPresetId = chatMatched.name;
            } else {
              let currentBelongs = matchedPresets.find((p) => p.name === settings3.characterEnablePresetId);
              if (currentBelongs) {
                matchedPresetId = null;
              } else {
                let randomIndex = Math.floor(Math.random() * matchedPresets.length);
                matchedPresetId = matchedPresets[randomIndex].name;
              }
            }
          }
        }
        if (matchedPresetId && settings3.characterEnablePresetId !== matchedPresetId) {
          settings3.characterEnablePresetId = matchedPresetId;
          toastr.success(`\u5DF2\u81EA\u52A8\u5207\u6362\u89D2\u8272\u542F\u7528\u9884\u8BBE\u81F3\uFF1A${matchedPresetId}`);
          const select = document.getElementById("character_enable_preset_id");
          if (select) {
            select.value = matchedPresetId;
            $(select).trigger("change");
          }
        }
      }
      await saveMetadata();
    }
  });
}

async function handleTestTrigger() {
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  backdrop.style.zIndex = "10002";
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog" style="width: 90%; max-width: 1000px; max-height: 85vh;">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u{1F9EA} \u6D4B\u8BD5\u4E16\u754C\u4E66\u89E6\u53D1</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; max-height: calc(85vh - 60px);">
                <div>
                    <label style="display: block; margin-bottom: 8px; color: #ddd; font-weight: bold;">
                        \u8F93\u5165\u89E6\u53D1\u6587\u672C\uFF08\u53EF\u9009\uFF0C\u7559\u7A7A\u5219\u4F7F\u7528\u6700\u8FD1\u7684\u804A\u5929\u6D88\u606F\uFF09\uFF1A
                    </label>
                    <textarea id="test-trigger-input" style="
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
                    <button id="test-trigger-run" style="
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
                <div id="test-trigger-result" style="display: none;">
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
  const runBtn = backdrop.querySelector("#test-trigger-run");
  const inputArea = backdrop.querySelector("#test-trigger-input");
  const resultDiv = backdrop.querySelector("#test-trigger-result");
  runBtn.onclick = async () => {
    const triggerText = inputArea.value.trim();
    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> \u6D4B\u8BD5\u4E2D...';
    try {
      const { processWorldBooksWithTriggerStructured: processWorldBooksWithTriggerStructured2 } = await import("../worldbookProcessor.js");
      let contextElements = [];
      if (triggerText) {
        contextElements = [triggerText];
      } else {
        contextElements = ["\u4F60\u597D"];
        console.log('[send_data] \u4F7F\u7528\u9ED8\u8BA4\u6D4B\u8BD5\u6587\u672C: "\u4F60\u597D"');
      }
      const worldBooksData = await processWorldBooksWithTriggerStructured2(contextElements);
      displayTestResult(resultDiv, worldBooksData, contextElements);
    } catch (error) {
      console.error("[send_data] \u6D4B\u8BD5\u89E6\u53D1\u5931\u8D25:", error);
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

function displayTestResult(container, worldBooksData, contextElements) {
  container.style.display = "block";
  if (!worldBooksData || worldBooksData.length === 0) {
    container.innerHTML = `
            <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;">
                <div style="color: #888; text-align: center;">
                    <i class="fa fa-info-circle"></i> \u6CA1\u6709\u89E6\u53D1\u4EFB\u4F55\u4E16\u754C\u4E66\u6761\u76EE
                </div>
            </div>
        `;
    return;
  }
  const totalEntries = worldBooksData.reduce((sum, wb) => sum + wb.entries.length, 0);
  let html = `
        <div style="margin-bottom: 15px; padding: 12px; background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px;">
            <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">
                <i class="fa fa-check-circle"></i> \u6D4B\u8BD5\u5B8C\u6210
            </div>
            <div style="color: #ddd; font-size: 13px;">
                \u89E6\u53D1\u4E86 <strong>${worldBooksData.length}</strong> \u4E2A\u4E16\u754C\u4E66\uFF0C\u5171 <strong>${totalEntries}</strong> \u4E2A\u6761\u76EE
            </div>
            <div style="color: #888; font-size: 12px; margin-top: 5px;">
                \u89E6\u53D1\u6587\u672C\u957F\u5EA6: ${contextElements.join("\n").length} \u5B57\u7B26
            </div>
        </div>
    `;
  worldBooksData.forEach((worldBook, worldIndex) => {
    const worldId = `test-world-${worldIndex}`;
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
      const borderColor = isConstant ? "rgba(255, 193, 7, 0.4)" : "rgba(66, 165, 245, 0.3)";
      const bgColor = isConstant ? "rgba(255, 193, 7, 0.08)" : "rgba(66, 165, 245, 0.05)";
      const titleColor = isConstant ? "#ffc107" : "#64b5f6";
      const badgeBg = isConstant ? "rgba(255, 193, 7, 0.2)" : "rgba(66, 165, 245, 0.2)";
      const badgeColor = isConstant ? "#ffc107" : "#64b5f6";
      entriesHtml += `
                <div class="test-wb-entry-item" style="
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
                            <button class="test-wb-entry-disable-btn" data-world-name="${worldName}" data-entry-uid="${encodeURIComponent(getWorldEntrySelectionKey(entry) ?? "")}" style="
                                padding: 2px 8px;
                                background: rgba(255, 152, 0, 0.15);
                                border: 1px solid rgba(255, 152, 0, 0.3);
                                border-radius: 3px;
                                color: #ff9800;
                                cursor: pointer;
                                font-size: 10px;
                                transition: all 0.2s;
                            " title="\u7981\u7528\u6B64\u6761\u76EE\uFF08\u5F71\u54CD\u53D1\u9001\u6570\u636E\u8BBE\u7F6E\uFF09">
                                <i class="fa-solid fa-ban"></i> \u7981\u7528
                            </button>
                            ${hasMore ? `
                            <button class="test-wb-entry-toggle-top" data-entry-id="${entryId}" style="
                                padding: 2px 8px;
                                background: rgba(66, 165, 245, 0.15);
                                border: 1px solid rgba(66, 165, 245, 0.3);
                                border-radius: 3px;
                                color: #42a5f5;
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
                    <div class="test-wb-entry-preview" style="
                        white-space: pre-wrap;
                        line-height: 1.5;
                        font-size: 13px;
                        color: #ddd;
                        ${hasMore ? "cursor: pointer;" : ""}
                    " data-entry-id="${entryId}">
                        ${hasMore ? escapedPreview + "..." : escapedContent}
                    </div>
                    <div class="test-wb-entry-full" id="${entryId}-full" style="
                        white-space: pre-wrap;
                        line-height: 1.5;
                        font-size: 13px;
                        color: #ddd;
                        display: none;
                    ">
                        ${escapedContent}
                    </div>
                    ${hasMore ? `
                    <button class="test-wb-entry-toggle" data-entry-id="${entryId}" style="
                        margin-top: 6px;
                        padding: 3px 10px;
                        background: rgba(66, 165, 245, 0.15);
                        border: 1px solid rgba(66, 165, 245, 0.3);
                        border-radius: 3px;
                        color: #42a5f5;
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
            <div class="test-wb-world-item" style="
                margin-bottom: 12px;
                border: 1px solid rgba(66, 165, 245, 0.2);
                border-radius: 6px;
                overflow: hidden;
                background: rgba(66, 165, 245, 0.03);
            ">
                <div class="test-wb-world-header" data-world-id="${worldId}" style="
                    padding: 10px 12px;
                    background: rgba(66, 165, 245, 0.1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    user-select: none;
                    transition: background 0.2s;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-chevron-right test-wb-world-icon" style="
                            color: #42a5f5;
                            font-size: 12px;
                            transition: transform 0.2s;
                        "></i>
                        <span style="font-weight: bold; color: #42a5f5; font-size: 13px;">
                            \u{1F4D6} ${worldName}
                        </span>
                    </div>
                    <span style="font-size: 11px; color: #888;">
                        ${entries.length} \u4E2A\u6761\u76EE
                    </span>
                </div>
                <div class="test-wb-world-content" id="${worldId}-content" style="
                    padding: 10px;
                    display: none;
                ">
                    ${entriesHtml}
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
  $(container).off("click").on("click", ".test-wb-world-header", function() {
    const worldId = $(this).data("world-id");
    const $content = $(`#${worldId}-content`);
    const $icon = $(this).find(".test-wb-world-icon");
    if ($content.is(":visible")) {
      $content.slideUp(200);
      $icon.css("transform", "rotate(0deg)");
    } else {
      $content.slideDown(200);
      $icon.css("transform", "rotate(90deg)");
    }
  });
  $(container).on("click", ".test-wb-entry-toggle", function(e) {
    e.stopPropagation();
    const entryId = $(this).data("entry-id");
    const $item = $(this).closest(".test-wb-entry-item");
    const $preview = $item.find(".test-wb-entry-preview");
    const $full = $(`#${entryId}-full`);
    const $topBtn = $item.find(".test-wb-entry-toggle-top");
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
  $(container).on("click", ".test-wb-entry-toggle-top", function(e) {
    e.stopPropagation();
    const entryId = $(this).data("entry-id");
    const $item = $(this).closest(".test-wb-entry-item");
    const $preview = $item.find(".test-wb-entry-preview");
    const $full = $(`#${entryId}-full`);
    const $bottomBtn = $item.find(".test-wb-entry-toggle");
    $full.hide();
    $preview.show();
    $bottomBtn.html('<i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00');
    $(this).hide();
  });
  $(container).on("click", ".test-wb-entry-preview", function(e) {
    const entryId = $(this).data("entry-id");
    if (!entryId) return;
    const $toggle = $(this).siblings(".test-wb-entry-toggle");
    if ($toggle.length > 0) {
      $toggle.click();
    }
  });
  $(container).on("click", ".test-wb-entry-disable-btn", async function(e) {
    e.stopPropagation();
    const worldName = $(this).data("world-name");
    const entryUid = decodeURIComponent($(this).attr("data-entry-uid") ?? "");
    if (!worldName || entryUid === "") {
      console.warn("[send_data] \u5207\u6362\u6761\u76EE\u72B6\u6001\u5931\u8D25\uFF1A\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570", { worldName, entryUid });
      return;
    }
    try {
      const currentState = getWorldEntryState(worldName, entryUid);
      const newState = currentState === false ? true : false;
      toggleWorldEntryState(worldName, entryUid, newState);
      console.log("[send_data] \u5DF2\u5207\u6362\u6761\u76EE\u72B6\u6001:", {
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
        $btn.attr("title", "\u7981\u7528\u6B64\u6761\u76EE\uFF08\u5F71\u54CD\u53D1\u9001\u6570\u636E\u8BBE\u7F6E\uFF09");
        toastr.success(`\u5DF2\u542F\u7528\u6761\u76EE\uFF08\u4E16\u754C\u4E66: ${worldName}\uFF09`);
      }
    } catch (err) {
      console.error("[send_data] \u5207\u6362\u6761\u76EE\u72B6\u6001\u5931\u8D25:", err);
      toastr.error("\u64CD\u4F5C\u5931\u8D25: " + (err.message || "\u672A\u77E5\u9519\u8BEF"));
    }
  });
}

export { initSendData };
