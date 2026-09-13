// Added by Codex for yunx738, 2026-09-13: generic ACU selection regressions. AFPL; see ../LICENSE.
import test from "node:test";
import assert from "node:assert/strict";
import { prepareWorldEntries, getWorldEntrySelectionKey as key, migrateWorldEntryConfig } from "../world-entry-selection.mjs";

const entry = (uid, name = "entry-a", chat = "chat-a") => ({ uid, comment: `ACU-[${chat}]-${name}` });
const migrate = (config, entries) => migrateWorldEntryConfig(config, "book", new Map(
  prepareWorldEntries(entries).map((row) => [String(row.uid), key(row)])
));

test("selection states and bindings survive UID reuse and settings reload", () => {
  let config = {
    worldEntrySelections: { book: { 0: true, 7: "force", 9: false } },
    savedEntrySelections: { book: { 0: true, 7: "force", 9: false } },
    worldEntryBindings: { book: { 7: "character-a" } },
  };
  migrate(config, [entry(0, "entry-zero"), entry(7), entry(9, "entry-b")]);
  config = JSON.parse(JSON.stringify(config));
  const rebuilt = [entry(7, "inserted-entry"), entry(17), entry(19, "entry-b"), entry(20, "entry-zero")];
  config.worldEntrySelections.book[7] = "force";
  migrate(config, rebuilt);
  const selected = config.worldEntrySelections.book;
  assert.equal(selected[key(rebuilt[0])], undefined);
  assert.equal(selected[key(rebuilt[1])], "force");
  assert.equal(selected[key(rebuilt[2])], false);
  assert.equal(selected[key(rebuilt[3])], true);
  assert.equal(config.worldEntryBindings.book[key(rebuilt[1])], "character-a");
  assert.equal(config.savedEntrySelections.book[key(rebuilt[1])], "force");
  selected[key(rebuilt[1])] = false;
  selected[17] = "force";
  migrate(config, rebuilt);
  assert.equal(selected[key(rebuilt[1])], false);
  assert.equal(Object.hasOwn(selected, "17"), false);
});

test("generator identifiers support arbitrary names while isolating chats", () => {
  assert.equal(key(entry(1, "arbitrary-name")), key(entry(99, "arbitrary-name")));
  assert.notEqual(key(entry(1)), key(entry(1, "entry-a", "chat-b")));
  assert.equal(key({ uid: 1, comment: "TavernDB-ACU-any-name" }), key({ uid: 99, comment: "TavernDB-ACU-any-name" }));
  assert.equal(key({ uid: 0, comment: "ordinary-entry" }), "0");
  assert.equal(key({ uid: 0, comment: "ACU-[chat-a]-" }), "0");
});

test("duplicate names remain distinct without mutating worldbook entries", () => {
  const entries = { 7: entry(7), 8: entry(8) };
  const original = structuredClone(entries);
  const rows = prepareWorldEntries(entries);
  const selected = { [key(rows[7])]: "force" };
  assert.notEqual(key(rows[7]), key(rows[8]));
  assert.equal(selected[key(rows[8])], undefined);
  assert.deepEqual(entries, original);
});
