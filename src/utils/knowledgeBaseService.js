// 还原自打包产物 — 原始模块: utils/knowledgeBaseService.js
import { world_info } from "../../../../../world-info.js";
import { extension_settings } from "../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extensionName } from "./config.js";
import { getWorldEntries } from "./chatDataUtils.js";
import { getWorldEntrySelectionKey } from "./worldEntrySelection.js";
import { worldbookProcessor_exports } from "./videoAssetsService.js";



async function refreshWorldBookCache(worldName) {
  try {
    if (world_info && typeof world_info.loadWorldInfoData === "function") {
      await world_info.loadWorldInfoData(worldName);
      console.log(`[KnowledgeBase] \u5DF2\u5237\u65B0\u4E16\u754C\u4E66\u7F13\u5B58: ${worldName}`);
      return;
    }
    const { getContext: getContext24 } = await import("../../../../../st-context.js");
    await getContext24().loadWorldInfo(worldName);
    console.log(`[KnowledgeBase] \u5DF2\u901A\u8FC7 loadWorldInfo \u5237\u65B0: ${worldName}`);
  } catch (err) {
    console.warn(`[KnowledgeBase] \u5237\u65B0\u4E16\u754C\u4E66\u7F13\u5B58\u5931\u8D25 ${worldName}:`, err);
  }
}

function getKnowledgeBaseConfig() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.knowledgeBaseConfig) {
    settings3.knowledgeBaseConfig = {
      enabled: false,
      worldBookSelections: {},
      worldEntrySelections: {}
    };
  }
  return settings3.knowledgeBaseConfig;
}

async function refreshAllKnowledgeBaseCaches() {
  const config = getKnowledgeBaseConfig();
  const enabledWorlds = Object.entries(config.worldBookSelections || {}).filter(([, enabled]) => enabled).map(([name]) => name);
  console.log(`[KnowledgeBase] \u5F00\u59CB\u5237\u65B0 ${enabledWorlds.length} \u4E2A\u4E16\u754C\u4E66\u7F13\u5B58...`);
  for (const worldName of enabledWorlds) {
    await refreshWorldBookCache(worldName);
  }
  console.log("[KnowledgeBase] \u6240\u6709\u4E16\u754C\u4E66\u7F13\u5B58\u5237\u65B0\u5B8C\u6210");
}

function isKnowledgeBaseEnabled() {
  return !!getKnowledgeBaseConfig().enabled;
}

function setKnowledgeBaseEnabled(enabled) {
  getKnowledgeBaseConfig().enabled = enabled;
  saveSettingsDebounced();
}

async function buildKnowledgeBasePromptContent(lastUserText = "") {
  const config = getKnowledgeBaseConfig();
  if (!config.enabled) return "";
  const { worldBookSelections: worldBookSelections2, worldEntrySelections: worldEntrySelections2 } = config;
  const enabledWorlds = Object.entries(worldBookSelections2).filter(([, enabled]) => enabled).map(([name]) => name);
  if (enabledWorlds.length === 0) return "";
  const results = [];
  for (const worldName of enabledWorlds) {
    const entrySettings = worldEntrySelections2[worldName] || {};
    let entries;
    try {
      await refreshWorldBookCache(worldName);
      const raw = await getWorldEntries(worldName);
      if (!raw) continue;
      entries = Array.isArray(raw) ? raw : Object.values(raw);
    } catch (err) {
      console.warn(`[KnowledgeBase] \u8BFB\u53D6\u4E16\u754C\u4E66 ${worldName} \u5931\u8D25:`, err);
      continue;
    }
    const skipConstant = config.skipConstant !== false;
    let processEntries = entries;
    if (skipConstant) {
      processEntries = entries.map((e) => {
        const setting = entrySettings[getWorldEntrySelectionKey(e)];
        if (e.constant === true && setting !== "force") {
          return { ...e, constant: false };
        }
        return e;
      });
    }
    const { processSingleWorldBook: processSingleWorldBook2 } = await import("./worldbookProcessor.js");
    const worldContent = await processSingleWorldBook2(processEntries, entrySettings, lastUserText);
    if (worldContent && worldContent.trim()) {
      results.push(`=== ${worldName} ===
${worldContent}`);
    }
  }
  if (results.length === 0) return "";
  return `\u3010\u8D44\u6599\u5E93\u53C2\u8003\u3011
${results.join("\n\n")}`;
}

async function listOnDemandKnowledgeBases() {
  const config = getKnowledgeBaseConfig();
  if (!config.enabled) return "\u8D44\u6599\u5E93\u529F\u80FD\u672A\u542F\u7528\u3002";
  const { worldBookSelections: worldBookSelections2, worldEntrySelections: worldEntrySelections2 } = config;
  const enabledWorlds = Object.entries(worldBookSelections2).filter(([, enabled]) => enabled).map(([name]) => name);
  if (enabledWorlds.length === 0) return "\u8D44\u6599\u5E93\u4E2D\u6CA1\u6709\u542F\u7528\u4EFB\u4F55\u4E16\u754C\u4E66\u3002";
  const parts = [];
  for (const worldName of enabledWorlds) {
    const entrySettings = worldEntrySelections2[worldName] || {};
    let entries = [];
    try {
      await refreshWorldBookCache(worldName);
      const raw = await getWorldEntries(worldName);
      if (raw) {
        entries = Array.isArray(raw) ? raw : Object.values(raw);
      }
    } catch (err) {
    }
    const enabledEntries = entries.filter((e) => {
      const state3 = entrySettings[getWorldEntrySelectionKey(e)];
      return state3 === true || state3 === "force";
    });
    let section = `\u{1F4DA} ${worldName}\uFF08${enabledEntries.length} \u4E2A\u5DF2\u542F\u7528\u6761\u76EE\uFF09`;
    if (enabledEntries.length > 0) {
      section += "\n   \u6761\u76EE\u5217\u8868:";
      enabledEntries.forEach((e) => {
        const label = e.comment || `\u6761\u76EE ${e.uid}`;
        const preview = (e.content || "").replace(/\n/g, " ").substring(0, 60);
        section += `
     - ${label} [uid: ${e.uid}]${preview ? " \u2014 " + preview + (e.content?.length > 60 ? "..." : "") : ""}`;
      });
    }
    parts.push(section);
  }
  return parts.join("\n\n") + "\n\n\u{1F4A1} \u4F7F\u7528 read_knowledge \u8BFB\u53D6\u6574\u4E2A\u4E16\u754C\u4E66\uFF0C\u6216 search_knowledge \u641C\u7D22\u5173\u952E\u8BCD";
}

async function readKnowledgeBase(worldName) {
  const config = getKnowledgeBaseConfig();
  if (!config.worldBookSelections[worldName]) {
    return `\u4E16\u754C\u4E66\u300C${worldName}\u300D\u5728\u8D44\u6599\u5E93\u4E2D\u672A\u542F\u7528\u6216\u4E0D\u5B58\u5728\u3002`;
  }
  const entrySettings = config.worldEntrySelections[worldName] || {};
  let entries = [];
  try {
    await refreshWorldBookCache(worldName);
    const raw = await getWorldEntries(worldName);
    if (raw) entries = Array.isArray(raw) ? raw : Object.values(raw);
  } catch (err) {
    return `\u8BFB\u53D6\u4E16\u754C\u4E66\u300C${worldName}\u300D\u5931\u8D25\uFF1A${err.message}`;
  }
  const enabledEntries = entries.filter((e) => {
    const state3 = entrySettings[getWorldEntrySelectionKey(e)];
    return state3 === true || state3 === "force";
  });
  if (enabledEntries.length === 0) return `\u4E16\u754C\u4E66\u300C${worldName}\u300D\u4E2D\u6CA1\u6709\u5DF2\u542F\u7528\u7684\u6761\u76EE\u3002`;
  let content = `## ${worldName}
`;
  enabledEntries.forEach((e) => {
    const label = e.comment || `\u6761\u76EE ${e.uid}`;
    content += `
### ${label}
${e.content || ""}
`;
  });
  return content;
}

async function readKnowledgeEntry(worldName, entryUid) {
  const config = getKnowledgeBaseConfig();
  let entries = [];
  try {
    await refreshWorldBookCache(worldName);
    const raw = await getWorldEntries(worldName);
    if (raw) entries = Array.isArray(raw) ? raw : Object.values(raw);
  } catch (err) {
    return `\u8BFB\u53D6\u4E16\u754C\u4E66\u300C${worldName}\u300D\u5931\u8D25\uFF1A${err.message}`;
  }
  const uid = typeof entryUid === "string" ? parseInt(entryUid, 10) : entryUid;
  const entry = entries.find((e) => e.uid === uid || e.uid === entryUid);
  if (!entry) return `\u6761\u76EE uid=${entryUid} \u5728\u4E16\u754C\u4E66\u300C${worldName}\u300D\u4E2D\u4E0D\u5B58\u5728\u3002`;
  const label = entry.comment || `\u6761\u76EE ${entry.uid}`;
  return `\u{1F4DA} \u4E16\u754C\u4E66: ${worldName}

\u{1F4C4} \u6761\u76EE: ${label}

${entry.content || "\uFF08\u65E0\u5185\u5BB9\uFF09"}`;
}

async function searchKnowledge(keyword) {
  const config = getKnowledgeBaseConfig();
  if (!config.enabled) return "\u8D44\u6599\u5E93\u529F\u80FD\u672A\u542F\u7528\u3002";
  const { worldBookSelections: worldBookSelections2, worldEntrySelections: worldEntrySelections2 } = config;
  const enabledWorlds = Object.entries(worldBookSelections2).filter(([, enabled]) => enabled).map(([name]) => name);
  if (enabledWorlds.length === 0) return "\u8D44\u6599\u5E93\u4E2D\u6CA1\u6709\u542F\u7528\u4EFB\u4F55\u4E16\u754C\u4E66\u3002";
  const results = [];
  const kw = keyword.toLowerCase();
  for (const worldName of enabledWorlds) {
    const entrySettings = worldEntrySelections2[worldName] || {};
    let entries = [];
    try {
      await refreshWorldBookCache(worldName);
      const raw = await getWorldEntries(worldName);
      if (raw) entries = Array.isArray(raw) ? raw : Object.values(raw);
    } catch (err) {
      continue;
    }
    const enabledEntries = entries.filter((e) => {
      const state3 = entrySettings[getWorldEntrySelectionKey(e)];
      return state3 === true || state3 === "force";
    });
    const matched = enabledEntries.filter((e) => {
      const label = (e.comment || "").toLowerCase();
      const keys = (Array.isArray(e.key) ? e.key.join(" ") : String(e.key || "")).toLowerCase();
      const content = (e.content || "").toLowerCase();
      return label.includes(kw) || keys.includes(kw) || content.includes(kw);
    });
    if (matched.length > 0) {
      results.push(`
\u{1F4DA} \u4E16\u754C\u4E66: ${worldName}`);
      matched.forEach((e) => {
        const label = e.comment || `\u6761\u76EE ${e.uid}`;
        let preview = (e.content || "").replace(/\s+/g, " ").trim().substring(0, 100);
        const keys = Array.isArray(e.key) ? e.key.join(", ") : String(e.key || "");
        const keyInfo = keys ? `
      \u5173\u952E\u8BCD: ${keys}` : "";
        results.push(`   \u{1F4C4} ${label} [uid: ${e.uid}]${keyInfo}
      \u9884\u89C8: ${preview}${(e.content?.length || 0) > 100 ? "..." : ""}`);
      });
    }
  }
  if (results.length === 0) return `\u672A\u627E\u5230\u5305\u542B\u300C${keyword}\u300D\u7684\u8D44\u6599\u3002`;
  return `\u641C\u7D22\u5173\u952E\u8BCD\u300C${keyword}\u300D\u7684\u7ED3\u679C\uFF1A
${results.join("\n")}

\u{1F4A1} \u4F7F\u7528 read_entry \u53EF\u67E5\u770B\u6761\u76EE\u5B8C\u6574\u5185\u5BB9`;
}

async function testKnowledgeBaseTrigger(triggerText = "") {
  const config = getKnowledgeBaseConfig();
  if (!config.enabled) {
    throw new Error("\u8D44\u6599\u5E93\u529F\u80FD\u672A\u542F\u7528");
  }
  const { worldBookSelections: worldBookSelections2, worldEntrySelections: worldEntrySelections2 } = config;
  const enabledWorlds = Object.entries(worldBookSelections2).filter(([, enabled]) => enabled).map(([name]) => name);
  if (enabledWorlds.length === 0) {
    return [];
  }
  const results = [];
  for (const worldName of enabledWorlds) {
    const entrySettings = worldEntrySelections2[worldName] || {};
    let entries;
    try {
      await refreshWorldBookCache(worldName);
      const raw = await getWorldEntries(worldName);
      if (!raw) continue;
      entries = Array.isArray(raw) ? raw : Object.values(raw);
    } catch (err) {
      console.warn(`[KnowledgeBase] \u6D4B\u8BD5\u89E6\u53D1\u65F6\u8BFB\u53D6\u4E16\u754C\u4E66 ${worldName} \u5931\u8D25:`, err);
      continue;
    }
    const skipConstant = config.skipConstant !== false;
    let processEntries = entries;
    if (skipConstant) {
      processEntries = entries.map((e) => {
        const setting = entrySettings[getWorldEntrySelectionKey(e)];
        if (e.constant === true && setting !== "force") {
          return { ...e, constant: false };
        }
        return e;
      });
    }
    const { processSingleWorldBookStructured: processSingleWorldBookStructured2 } = await import("./worldbookProcessor.js");
    const triggeredData = await processSingleWorldBookStructured2(processEntries, entrySettings, triggerText);
    if (triggeredData && triggeredData.entries && triggeredData.entries.length > 0) {
      results.push({
        worldName,
        entries: triggeredData.entries
      });
    }
  }
  return results;
}

export { buildKnowledgeBasePromptContent, isKnowledgeBaseEnabled, listOnDemandKnowledgeBases, readKnowledgeBase, readKnowledgeEntry, refreshAllKnowledgeBaseCaches, searchKnowledge, setKnowledgeBaseEnabled };
