// 还原自打包产物 — 原始模块: utils/worldEntrySelection.js
var acuComment, owns, worldEntrySelectionKeys;

acuComment = /^(?:ACU-\[[^\]]+\]-|TavernDB-ACU-).+/;

owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

worldEntrySelectionKeys = /* @__PURE__ */ new Map();

function stableComment(entry) {
  return typeof entry?.comment === "string" && acuComment.test(entry.comment) ? entry.comment : null;
}

function getWorldEntrySelectionKey(entry) {
  if (entry?.chatu8SelectionKey != null) return entry.chatu8SelectionKey;
  if (entry?.selectionKey != null) return entry.selectionKey;
  if (entry?.uid == null) return void 0;
  const comment = stableComment(entry);
  return comment === null ? String(entry.uid) : `acu:${JSON.stringify([comment])}`;
}

function prepareWorldEntries(entries) {
  if (!entries) return entries;
  const rows = Object.values(entries);
  const counts = /* @__PURE__ */ new Map();
  for (const entry of rows) {
    const comment = stableComment(entry);
    if (entry?.uid != null && comment !== null) {
      counts.set(comment, (counts.get(comment) || 0) + 1);
    }
  }
  const prepare = (entry) => {
    if (!entry || typeof entry !== "object") return entry;
    const comment = stableComment(entry);
    let key;
    if (entry.uid != null) {
      if (comment === null) {
        key = String(entry.uid);
      } else if (counts.get(comment) > 1) {
        key = `acu-uid:${JSON.stringify([comment, String(entry.uid)])}`;
      } else {
        key = `acu:${JSON.stringify([comment])}`;
      }
    }
    return { ...entry, chatu8SelectionKey: key };
  };
  return Array.isArray(entries) ? entries.map(prepare) : Object.fromEntries(Object.entries(entries).map(([uid, entry]) => [uid, prepare(entry)]));
}

function migrateWorldEntryConfig(config, worldName, keys, extraMaps = []) {
  if (!config || ![...keys].some(([uid, key]) => uid !== key)) return false;
  const firstMigration = config.worldEntryKeyVersion?.[worldName] !== 1;
  const maps = [
    config.worldEntrySelections?.[worldName],
    config.savedEntrySelections?.[worldName],
    config.worldEntryBindings?.[worldName],
    ...extraMaps
  ];
  let changed = false;
  for (const map of new Set(maps)) {
    if (!map || typeof map !== "object") continue;
    for (const [uid, key] of keys) {
      if (uid === key || !owns(map, uid)) continue;
      if (firstMigration && !owns(map, key)) map[key] = map[uid];
      delete map[uid];
      changed = true;
    }
  }
  if (firstMigration) {
    config.worldEntryKeyVersion = config.worldEntryKeyVersion || {};
    config.worldEntryKeyVersion[worldName] = 1;
    changed = true;
  }
  return changed;
}

export { getWorldEntrySelectionKey, migrateWorldEntryConfig, prepareWorldEntries, worldEntrySelectionKeys };
