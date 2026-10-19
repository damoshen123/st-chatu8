// 还原自打包产物 — 原始模块: utils/worldbookProcessor.js
import { extension_settings } from "../../../../../extensions.js";
import { getContext } from "../../../../../st-context.js";
import { extensionName } from "./config.js";
import { getWorldEntries, getcharWorld, getrWorlds, resolveGlobalVariable, resolveNestedVariable, setNestedVariable, setglobalvar } from "./chatDataUtils.js";
import { getWorldEntrySelectionKey, prepareWorldEntries } from "./worldEntrySelection.js";

var worldVars;

worldVars = {};



function getworldvar(name) {
  return resolveNestedVariable(worldVars, name);
}

function setworldvar(name, value) {
  setNestedVariable(worldVars, name, value);
}

function clearWorldVars() {
  worldVars = {};
}

async function processWorldBooksWithTrigger(contextElements) {
  const structuredData = await processWorldBooksWithTriggerStructured(contextElements);
  let finalContent = structuredData.map((item) => {
    const content = item.entries.map((e) => e.content).filter((c) => c && c.trim()).join("\n\n");
    return `=== ${item.worldName} ===
${content}`;
  }).join("\n\n");
  finalContent = processVariablePlaceholders(finalContent);
  return finalContent;
}

async function processWorldBooksWithTriggerStructured(contextElements) {
  try {
    clearWorldVars();
    const triggerText = contextElements.join("\n");
    const settings3 = extension_settings[extensionName];
    const worldBookConfig = settings3?.worldBookConfig || {};
    const savedWorldBookSelections = worldBookConfig.worldBookSelections || {};
    const worldEntrySettings = worldBookConfig.worldEntrySelections || {};
    const currentCharWorldName2 = await getcharWorld();
    const worldBookSettings = { ...savedWorldBookSelections };
    if (currentCharWorldName2) {
      const hasCharWorldEntrySettings = worldEntrySettings[currentCharWorldName2] && Object.keys(worldEntrySettings[currentCharWorldName2]).length > 0;
      if (hasCharWorldEntrySettings || !savedWorldBookSelections.hasOwnProperty(currentCharWorldName2)) {
        worldBookSettings[currentCharWorldName2] = true;
      }
    }
    const worlds = await getrWorlds();
    let allTriggeredData = [];
    for (const worldName of worlds) {
      if (!worldBookSettings[worldName]) {
        continue;
      }
      const entries = await getWorldEntries(worldName);
      if (!entries) {
        continue;
      }
      const entriesArray = Array.isArray(entries) ? entries : Object.values(entries);
      const currentWorldEntrySettings = worldEntrySettings[worldName] || {};
      const worldData = await processSingleWorldBookStructured(
        entriesArray,
        currentWorldEntrySettings,
        triggerText
      );
      if (worldData && worldData.entries.length > 0) {
        allTriggeredData.push({
          worldName,
          entries: worldData.entries
        });
      }
    }
    return allTriggeredData;
  } catch (error) {
    console.error("[processWorldBooksStructured] Error:", error);
    return [];
  }
}

function processVariablePlaceholders(content) {
  if (!content) return content;
  const context = getContext();
  if (!context.chatMetadata) {
    context.chatMetadata = {};
  }
  if (!context.chatMetadata.variables) {
    context.chatMetadata.variables = {};
  }
  let result = content;
  result = result.replace(/\{@setvar::([^:@]+)::([\s\S]*?)@\}/g, (match, name, value) => {
    const trimmedName = name.trim();
    setNestedVariable(context.chatMetadata.variables, trimmedName, value);
    return "";
  });
  result = result.replace(/\{@getvar::([^@]+)@\}/g, (match, name) => {
    const trimmedName = name.trim();
    const value = resolveNestedVariable(context.chatMetadata.variables, trimmedName);
    return value;
  });
  result = result.replace(/\{@setglobalvar::([^:@]+)::([\s\S]*?)@\}/g, (match, name, value) => {
    const trimmedName = name.trim();
    setglobalvar(trimmedName, value);
    return "";
  });
  result = result.replace(/\{@getglobalvar::([^@]+)@\}/g, (match, name) => {
    const trimmedName = name.trim();
    const value = resolveGlobalVariable(trimmedName);
    return value;
  });
  result = result.replace(/\{@setworldvar::([^:@]+)::([\s\S]*?)@\}/g, (match, name, value) => {
    const trimmedName = name.trim();
    setworldvar(trimmedName, value);
    return "";
  });
  result = result.replace(/\{@getworldvar::([^@]+)@\}/g, (match, name) => {
    const trimmedName = name.trim();
    const value = getworldvar(trimmedName) || "";
    return value;
  });
  return result;
}

async function processSingleWorldBookStructured(entries, entrySettings, triggerText) {
  entries = prepareWorldEntries(entries);
  const enabledEntries = entries.filter((entry) => {
    if (entry.disable) return false;
    const entryKey = getWorldEntrySelectionKey(entry);
    const setting = entrySettings[entryKey];
    if (setting === "force") {
      return true;
    }
    return setting === true;
  });
  const forceEnabledUids = /* @__PURE__ */ new Set();
  for (const entry of enabledEntries) {
    const setting = entrySettings[getWorldEntrySelectionKey(entry)];
    if (setting === "force") {
      forceEnabledUids.add(entry.uid);
    }
  }
  const constantEntries = enabledEntries.filter((e) => e.constant === true || forceEnabledUids.has(e.uid));
  const nonConstantEntries = enabledEntries.filter((e) => e.constant !== true && !forceEnabledUids.has(e.uid));
  const excludeRecursionEntries = nonConstantEntries.filter((e) => e.excludeRecursion === true);
  const normalEntries = nonConstantEntries.filter((e) => e.excludeRecursion !== true);
  const constantNoRecursion = constantEntries.filter((e) => e.preventRecursion === true);
  const constantWithRecursion = constantEntries.filter((e) => e.preventRecursion !== true);
  let triggeredEntries = [];
  let recursionText = triggerText;
  for (const entry of excludeRecursionEntries) {
    if (checkEntryTrigger(entry, triggerText)) {
      triggeredEntries.push(entry);
      if (entry.preventRecursion !== true) {
        recursionText += "\n" + (entry.content || "");
      }
    }
  }
  for (const entry of constantWithRecursion) {
    triggeredEntries.push(entry);
    recursionText += "\n" + (entry.content || "");
  }
  const recursiveTriggered = await processEntriesRecursively(
    normalEntries,
    recursionText
  );
  triggeredEntries.push(...recursiveTriggered);
  triggeredEntries.push(...constantNoRecursion);
  triggeredEntries.sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    return orderA - orderB;
  });
  const result = {
    entries: triggeredEntries.map((entry) => ({
      uid: entry.uid !== void 0 && entry.uid !== null ? entry.uid : "",
      selectionKey: getWorldEntrySelectionKey(entry),
      comment: entry.comment || "\u672A\u547D\u540D\u6761\u76EE",
      content: entry.content || "",
      // ★ 新增：保留原始条目的其他重要字段
      // 注意：使用 ?? 而不是 || 来避免 false 被转换为默认值
      constant: entry.constant ?? false,
      key: entry.key ?? [],
      selectiveLogic: entry.selectiveLogic ?? 0,
      order: entry.order,
      disable: entry.disable
    }))
  };
  console.log(`[processSingleWorldBookStructured] \u8FD4\u56DE ${result.entries.length} \u4E2A\u6761\u76EE`);
  return result;
}

async function processSingleWorldBook(entries, entrySettings, triggerText) {
  const structuredData = await processSingleWorldBookStructured(entries, entrySettings, triggerText);
  const content = structuredData.entries.map((entry) => entry.content).filter((c) => c.trim()).join("\n\n");
  return content;
}

async function processEntriesRecursively(entries, recursionText) {
  let triggered = [];
  let currentRecursionText = recursionText;
  let hasNewTrigger = true;
  const triggeredUids = /* @__PURE__ */ new Set();
  while (hasNewTrigger) {
    hasNewTrigger = false;
    for (const entry of entries) {
      const uid = entry.uid;
      if (triggeredUids.has(uid)) continue;
      if (checkEntryTrigger(entry, currentRecursionText)) {
        triggered.push(entry);
        triggeredUids.add(uid);
        hasNewTrigger = true;
        if (entry.preventRecursion !== true) {
          currentRecursionText += "\n" + (entry.content || "");
        }
      }
    }
  }
  return triggered;
}

function checkEntryTrigger(entry, text) {
  if (!entry.selective) {
    return checkKeywords(entry.key, text, entry.caseSensitive, entry.matchWholeWords);
  }
  const hasMainKey = checkKeywords(entry.key, text, entry.caseSensitive, entry.matchWholeWords);
  if (!hasMainKey) return false;
  const keysecondary = entry.keysecondary || [];
  if (keysecondary.length === 0) return hasMainKey;
  const selectiveLogic = entry.selectiveLogic || 0;
  switch (selectiveLogic) {
    case 0:
      return checkKeywords(keysecondary, text, entry.caseSensitive, entry.matchWholeWords, "any");
    case 1:
      return checkKeywords(keysecondary, text, entry.caseSensitive, entry.matchWholeWords, "all");
    case 2:
      return !checkKeywords(keysecondary, text, entry.caseSensitive, entry.matchWholeWords, "any");
    default:
      return hasMainKey;
  }
}

function checkKeywords(keywords, text, caseSensitive, matchWholeWords, mode = "any") {
  if (!keywords || keywords.length === 0) return false;
  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
  const searchText = caseSensitive ? text : text.toLowerCase();
  const matches = keywordArray.map((keyword) => {
    if (!keyword) return false;
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
    if (matchWholeWords) {
      const regex = new RegExp(`\\b${escapeRegex(searchKeyword)}\\b`, caseSensitive ? "" : "i");
      return regex.test(text);
    } else {
      return searchText.includes(searchKeyword);
    }
  });
  if (mode === "all") {
    return matches.every((m) => m);
  } else {
    return matches.some((m) => m);
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { getworldvar, processWorldBooksWithTrigger };
