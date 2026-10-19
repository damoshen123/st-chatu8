// 还原自打包产物 — 原始模块: utils/settings/presetSearchMatcher.js
var SEARCHABLE_FIELDS;

SEARCHABLE_FIELDS = {
      // 提示词预设 settings.yushe
      yushe: [
        "fixedPrompt",
        "fixedPrompt_end",
        "negativePrompt"
      ],
      // 角色预设 settings.characterPresets
      characterPresets: [
        "nameCN",
        "nameEN",
        "characterTraits",
        "facialFeatures",
        "facialFeaturesBack",
        "upperBodySFW",
        "upperBodySFWBack",
        "fullBodySFW",
        "fullBodySFWBack",
        "upperBodyNSFW",
        "upperBodyNSFWBack",
        "fullBodyNSFW",
        "fullBodyNSFWBack",
        "negative",
        "photoPrompt",
        // 关联的服装预设名单，是字符串数组
        "outfits"
      ],
      // 服装预设 settings.outfitPresets
      outfitPresets: [
        "nameCN",
        "nameEN",
        "owner",
        "upperBody",
        "upperBodyBack",
        "fullBody",
        "fullBodyBack",
        "photoPrompt"
      ]
    };

function flattenFieldValue(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string").join(" ");
  }
  return "";
}

function getPresetSearchableText(preset, scope) {
  if (!preset || typeof preset !== "object") return "";
  const fields = SEARCHABLE_FIELDS[scope];
  if (!fields) return "";
  const parts = [];
  for (const field of fields) {
    const text = flattenFieldValue(preset[field]);
    if (text) parts.push(text);
  }
  return parts.join(" ").toLowerCase();
}

function matchesPresetSearch(name, preset, scope, query) {
  if (!query) return true;
  if (name && name.toLowerCase().includes(query)) return true;
  return getPresetSearchableText(preset, scope).includes(query);
}

function filterPresetsBySearch(names, presets, scope, query) {
  if (!query) return names;
  return names.filter((name) => matchesPresetSearch(name, presets?.[name], scope, query));
}

export { filterPresetsBySearch };
