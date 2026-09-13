/**
 * Added by Codex for yunx738 on 2026-09-13.
 * Keep ACU worldbook selections stable when generated entries are recreated.
 * Distributed under the repository's Aladdin Free Public License; see LICENSE.
 */

const acuComment = /^(?:ACU-\[[^\]]+\]-)?(?:TavernDB-ACU-|重要人物条目|总结条目)/;
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function stableComment(entry) {
  return typeof entry?.comment === "string" && acuComment.test(entry.comment)
    ? entry.comment
    : null;
}

export function getWorldEntrySelectionKey(entry) {
  if (entry?.chatu8SelectionKey != null) return entry.chatu8SelectionKey;
  if (entry?.selectionKey != null) return entry.selectionKey;
  if (entry?.uid == null) return undefined;
  const comment = stableComment(entry);
  return comment === null ? String(entry.uid) : `acu:${JSON.stringify([comment])}`;
}

export function prepareWorldEntries(entries) {
  const rows = Object.values(entries);
  const counts = new Map();
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
        // A duplicate title cannot safely identify a different UID after a rebuild.
        key = `acu-uid:${JSON.stringify([comment, String(entry.uid)])}`;
      } else {
        // Keep the full isolation prefix: different chats must not share selections.
        key = `acu:${JSON.stringify([comment])}`;
      }
    }
    return { ...entry, chatu8SelectionKey: key };
  };
  return Array.isArray(entries)
    ? entries.map(prepare)
    : Object.fromEntries(Object.entries(entries).map(([uid, entry]) => [uid, prepare(entry)]));
}

export function migrateWorldEntryConfig(config, worldName, keys, extraMaps = []) {
  if (!config || ![...keys].some(([uid, key]) => uid !== key)) return false;
  const firstMigration = config.worldEntryKeyVersion?.[worldName] !== 1;
  const maps = [
    config.worldEntrySelections?.[worldName],
    config.savedEntrySelections?.[worldName],
    config.worldEntryBindings?.[worldName],
    ...extraMaps,
  ];
  let changed = false;
  for (const map of new Set(maps)) {
    if (!map || typeof map !== "object") continue;
    for (const [uid, key] of keys) {
      if (uid === key || !owns(map, uid)) continue;
      // Only adopt legacy UID settings once. Recycled UIDs must never overwrite
      // an existing stable selection, including an explicit false setting.
      if (firstMigration && !owns(map, key)) map[key] = map[uid];
      delete map[uid];
      changed = true;
    }
  }
  if (firstMigration) {
    config.worldEntryKeyVersion ??= {};
    config.worldEntryKeyVersion[worldName] = 1;
    changed = true;
  }
  return changed;
}
