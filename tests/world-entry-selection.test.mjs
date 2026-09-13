// Added by Codex for yunx738, 2026-09-13. AFPL; see ../LICENSE.
// Organized by Codex for yunx738, 2026-09-13: restore the intended tests/ location.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { prepareWorldEntries, getWorldEntrySelectionKey, migrateWorldEntryConfig } from "../world-entry-selection.mjs";

const source = readFileSync(new URL("../index.js", import.meta.url), "utf8");
const world = "测试世界书";
const prefix = "ACU-[chat-a]-TavernDB-ACU-CustomExport-";
const entry = (uid, name, extra = {}) => ({
  uid, comment: prefix + name, content: `${name} content`, key: ["keyword"],
  constant: false, disable: false, order: 10000 + uid, depth: 10000, position: 4,
  ...extra,
});
const original = [entry(0, "任务表"), entry(7, "重要角色DNA"), entry(9, "主角DNA")];

function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Missing production section: ${start}`);
  return source.slice(from, to);
}

function harness(savedSettings) {
  const legacy = { 0: false, 7: "force", 9: "force" };
  const settings = savedSettings || {
    worldBookConfig: {
      savedSelections: { [world]: true }, worldBookSelections: { [world]: true },
      savedEntrySelections: { [world]: { ...legacy } },
      worldEntrySelections: { [world]: { ...legacy } },
      worldBookBindings: {}, worldEntryBindings: { [world]: { 7: "角色A" } },
    },
    knowledgeBaseConfig: { worldEntrySelections: { [world]: { 7: false, 9: "force" } } },
  };
  const books = new Map([[world, structuredClone(original)]]);
  let saves = 0;
  const linkedSettings = { "st-chatu8": settings };
  const context = vm.createContext({
    prepareWorldEntries, getWorldEntrySelectionKey, migrateWorldEntryConfig,
    extensionName: "st-chatu8", extension_settings11: linkedSettings,
    extension_settings12: linkedSettings, extension_settings84: linkedSettings,
    getContext2: () => ({ loadWorldInfo: async (name) => ({ entries: books.get(name) }) }),
    getcharWorld: async () => "角色A", getrWorlds: async () => [...books.keys()],
    worldEntrySelections: structuredClone(settings.worldBookConfig.savedEntrySelections),
    worldEntryBindings: structuredClone(settings.worldBookConfig.worldEntryBindings),
    worldBookSelections: { [world]: true }, worldBookBindings: {}, currentCharWorldName: "角色A",
    saveSettingsDebounced: () => { saves++; }, saveSettingsDebounced57: () => { saves++; },
    console: { log() {}, warn() {}, error(error) { throw error; } },
    clearWorldVars() {},
  });
  // Exercise the shipped loader, trigger processor, save and binding paths.
  vm.runInContext([
    section("var worldEntrySelectionKeys = new Map();", "function resolveNestedVariable"),
    section("async function processWorldBooksWithTriggerStructured", "function processVariablePlaceholders"),
    section("async function processSingleWorldBookStructured", "var worldVars;"),
    section("function getWorldBookConfig()", "function initSendData("),
  ].join("\n"), context);
  return {
    context, settings, books,
    get saves() { return saves; },
    async run() { return context.processWorldBooksWithTriggerStructured([""]); },
  };
}

const comments = (result) => Array.from(result.flatMap((book) => Array.from(book.entries, (row) => row.comment)));

test("both DNA selections survive insertions, recycled UIDs, content changes and refresh", async () => {
  const h = harness();
  const baseline = comments(await h.run());
  assert.deepEqual(baseline, [prefix + "重要角色DNA", prefix + "主角DNA"]);
  const rebuilt = [
    entry(0, "任务表"), entry(7, "新插入的纪要"),
    entry(15, "重要角色DNA", { content: "updated DNA", order: 10007 }),
    entry(16, "主角DNA", { order: 10009 }),
  ];
  const unchanged = structuredClone(rebuilt);
  h.books.set(world, rebuilt);
  assert.deepEqual(comments(await h.run()), baseline);
  h.context.saveWorldBookConfig();
  assert.deepEqual(comments(await h.run()), baseline);
  assert.deepEqual(rebuilt, unchanged, "worldbook content, order, depth and position are never written");
  assert.equal(h.context.getWorldEntryState(world, 15), "force");
  assert.equal(h.context.getWorldEntryState(world, 7), undefined);
});

test("legacy true/false/force, UID zero and character bindings migrate together", async () => {
  const h = harness();
  const entries = await h.context.getWorldEntries(world);
  const dna = getWorldEntrySelectionKey(entries[1]);
  const task = getWorldEntrySelectionKey(entries[0]);
  assert.equal(h.settings.worldBookConfig.savedEntrySelections[world][dna], "force");
  assert.equal(h.settings.worldBookConfig.worldEntrySelections[world][task], false);
  assert.equal(h.settings.worldBookConfig.worldEntryBindings[world][dna], "角色A");
  assert.equal(h.context.worldEntrySelections[world][dna], "force");
  assert.equal(h.context.worldEntryBindings[world][dna], "角色A");
  assert.equal(h.settings.knowledgeBaseConfig.worldEntrySelections[world][dna], false);
  assert.equal(Object.hasOwn(h.settings.worldBookConfig.savedEntrySelections[world], "7"), false);
  h.context.currentCharWorldName = "角色B";
  h.context.recalculateEffectiveWorldBooks();
  assert.equal(h.settings.worldBookConfig.worldEntrySelections[world][dna], false);
  assert.equal(h.context.getWorldEntryState(world, dna), false);
  h.context.currentCharWorldName = "角色A";
  h.context.recalculateEffectiveWorldBooks();
  assert.equal(h.context.getWorldEntryState(world, dna), "force");
});

test("delete/recreate gap and a settings JSON round trip retain DNA bindings", async () => {
  const h = harness();
  const baseline = comments(await h.run());
  h.books.set(world, []);
  assert.deepEqual(comments(await h.run()), []);
  const restarted = harness(JSON.parse(JSON.stringify(h.settings)));
  restarted.books.set(world, [entry(20, "重要角色DNA"), entry(21, "主角DNA")]);
  assert.deepEqual(comments(await restarted.run()), baseline);
});

test("a stale UID cannot re-enable an explicitly disabled stable entry", async () => {
  const h = harness();
  await h.run();
  const key = getWorldEntrySelectionKey(original[1]);
  h.context.toggleWorldEntryState(world, key, false);
  h.settings.worldBookConfig.worldEntrySelections[world][7] = "force";
  assert.deepEqual(comments(await h.run()), [prefix + "主角DNA"]);
  assert.equal(h.settings.worldBookConfig.worldEntrySelections[world][key], false);
  assert.equal(Object.hasOwn(h.settings.worldBookConfig.worldEntrySelections[world], "7"), false);
});

test("new entries do not inherit obsolete UID settings after migration", async () => {
  const h = harness();
  await h.run();
  h.settings.worldBookConfig.worldEntrySelections[world][88] = "force";
  h.books.set(world, [entry(88, "新角色")]);
  assert.deepEqual(comments(await h.run()), []);
});

test("chat isolation prefixes and separate worldbooks do not share selections", async () => {
  const h = harness();
  await h.run();
  h.books.set(world, [entry(7, "重要角色DNA", { comment: "ACU-[chat-b]-TavernDB-ACU-CustomExport-重要角色DNA" })]);
  assert.deepEqual(comments(await h.run()), []);
  h.settings.worldBookConfig.worldBookSelections["其他世界书"] = true;
  h.books.set("其他世界书", original);
  assert.deepEqual(comments(await h.run()), []);
});

test("duplicate generated names do not fan a single force setting out to multiple entries", async () => {
  const h = harness();
  await h.run();
  h.books.set(world, [entry(7, "重要角色DNA"), entry(8, "重要角色DNA")]);
  assert.deepEqual(comments(await h.run()), []);
  const rows = await h.context.getWorldEntries(world);
  h.context.toggleWorldEntryState(world, getWorldEntrySelectionKey(rows[0]), "force");
  const result = await h.run();
  assert.equal(result[0].entries.length, 1);
  assert.equal(result[0].entries[0].uid, 7);
});

test("keyword triggers, worldbook disable and original injection order are respected", async () => {
  const h = harness();
  const rows = prepareWorldEntries([
    entry(1, "强制", { order: 20 }), entry(2, "关键词", { order: 10 }),
    entry(3, "已禁用", { disable: true }),
  ]);
  const selections = Object.fromEntries(rows.map((row) => [getWorldEntrySelectionKey(row), row.uid === 2 ? true : "force"]));
  let result = await h.context.processSingleWorldBookStructured(rows, selections, "");
  assert.deepEqual(Array.from(result.entries, (row) => row.uid), [1]);
  result = await h.context.processSingleWorldBookStructured(rows, selections, "keyword");
  assert.deepEqual(Array.from(result.entries, (row) => row.uid), [2, 1]);
});

test("ordinary worldbook entries keep UID behavior, including zero", async () => {
  const h = harness();
  const raw = { 0: entry(0, "", { comment: "普通世界书" }) };
  const copy = structuredClone(raw);
  const rows = prepareWorldEntries(raw);
  const result = await h.context.processSingleWorldBookStructured(Object.values(rows), { 0: "force" }, "");
  assert.equal(result.entries[0].uid, 0);
  assert.equal(result.entries[0].selectionKey, "0");
  assert.deepEqual(raw, copy);
});

test("preview actions keep a stable key even when the displayed UID is later reused", async () => {
  const h = harness();
  const first = await h.run();
  const displayed = first[0].entries[0];
  const actionKey = decodeURIComponent(encodeURIComponent(getWorldEntrySelectionKey(displayed)));
  h.books.set(world, [entry(7, "新插入的纪要"), entry(15, "重要角色DNA"), entry(16, "主角DNA")]);
  await h.run();
  h.context.toggleWorldEntryState(world, actionKey, false);
  assert.deepEqual(comments(await h.run()), [prefix + "主角DNA"]);
  assert.equal(h.context.getWorldEntryState(world, 7), undefined);
});
