// 还原自打包产物 — 原始模块: utils/settings/character/injectionTemplates.js
import { extension_settings } from "../../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../../script.js";
import { extensionName } from "../../config.js";
import { stylInput, stylishConfirm } from "../../ui_common.js";

var PLACEHOLDER_RE, PREVIEW_SAMPLE_CHARACTER, PREVIEW_SAMPLE_CHARACTER_PARTIAL, PREVIEW_SAMPLE_ENABLE_ENTRY, PREVIEW_SAMPLE_OUTFITS, SYSTEM_INJECTION_TEMPLATES, SYSTEM_PRESET_IDS, TEMPLATE_FIELDS, TEMPLATE_TEXTAREA_SELECTOR;

SYSTEM_PRESET_IDS = ["\u9ED8\u8BA4\u65B9\u6848", "Tavern XML \u683C\u5F0F", "Markdown \u6781\u7B80\u5361\u7247", "\u89C6\u9891\u6CE8\u5165"];

SYSTEM_INJECTION_TEMPLATES = {
      "\u9ED8\u8BA4\u65B9\u6848": {
        characterListTemplate: [
          "\u4E2D\u6587\u540D\u79F0\uFF1A{nameCN}",
          "\u82F1\u6587\u540D\u79F0\uFF1A{nameEN}",
          "\u89D2\u8272\u7279\u5F81\uFF1A{traits}",
          "\u4E94\u5B98\u5916\u8C8C\uFF08\u6B63\u9762\uFF09\uFF1A{facial}",
          "\u4E94\u5B98\u5916\u8C8C\uFF08\u80CC\u9762\uFF09\uFF1A{facialBack}",
          "\u4E0A\u534A\u8EABSFW\uFF08\u6B63\u9762\uFF09\uFF1A{upperSFW}",
          "\u4E0A\u534A\u8EABSFW\uFF08\u80CC\u9762\uFF09\uFF1A{upperSFWBack}",
          "\u4E0B\u534A\u8EABSFW\uFF08\u6B63\u9762\uFF09\uFF1A{lowerSFW}",
          "\u4E0B\u534A\u8EABSFW\uFF08\u80CC\u9762\uFF09\uFF1A{lowerSFWBack}",
          "\u4E0A\u534A\u8EABNSFW\uFF08\u6B63\u9762\uFF09\uFF1A{upperNSFW}",
          "\u4E0A\u534A\u8EABNSFW\uFF08\u80CC\u9762\uFF09\uFF1A{upperNSFWBack}",
          "\u4E0B\u534A\u8EABNSFW\uFF08\u6B63\u9762\uFF09\uFF1A{lowerNSFW}",
          "\u4E0B\u534A\u8EABNSFW\uFF08\u80CC\u9762\uFF09\uFF1A{lowerNSFWBack}",
          "\u670D\u88C5\u5217\u8868\uFF1A{outfits}",
          "\u89D2\u8272\u56FE\u7247\uFF1A[{imageId}] {imageDesc}",
          "\u89D2\u8272\u97F3\u9891\uFF1A[{audioId}] {audioDesc}"
        ].join("\n"),
        innerOutfitTemplate: [
          "  \u4E2D\u6587\u540D\u79F0\uFF1A{nameCN}",
          "  \u82F1\u6587\u540D\u79F0\uFF1A{nameEN}",
          "  \u4E0A\u534A\u8EAB\uFF08\u6B63\u9762\uFF09\uFF1A{upperBody}",
          "  \u4E0A\u534A\u8EAB\uFF08\u80CC\u9762\uFF09\uFF1A{upperBodyBack}",
          "  \u4E0B\u534A\u8EAB\uFF08\u6B63\u9762\uFF09\uFF1A{lowerBody}",
          "  \u4E0B\u534A\u8EAB\uFF08\u80CC\u9762\uFF09\uFF1A{lowerBodyBack}"
        ].join("\n"),
        commonCharacterListTemplate: "{nameCN} {nameEN}",
        enableOutfitListTemplate: [
          "\u4E2D\u6587\u540D\u79F0\uFF1A{nameCN}",
          "\u82F1\u6587\u540D\u79F0\uFF1A{nameEN}",
          "\u4E0A\u534A\u8EAB\uFF08\u6B63\u9762\uFF09\uFF1A{upperBody}",
          "\u4E0A\u534A\u8EAB\uFF08\u80CC\u9762\uFF09\uFF1A{upperBodyBack}",
          "\u4E0B\u534A\u8EAB\uFF08\u6B63\u9762\uFF09\uFF1A{lowerBody}",
          "\u4E0B\u534A\u8EAB\uFF08\u80CC\u9762\uFF09\uFF1A{lowerBodyBack}"
        ].join("\n")
      },
      "Tavern XML \u683C\u5F0F": {
        characterListTemplate: [
          '<character id="{nameEN}" cn="{nameCN}">',
          "  [Traits] {traits}",
          "  [Face] Front: {facial}",
          "  [Face] Back: {facialBack}",
          "  [SFW] Upper: {upperSFW}",
          "  [SFW] Lower: {lowerSFW}",
          "  [NSFW] Upper: {upperNSFW}",
          "  [NSFW] Lower: {lowerNSFW}",
          "  [Outfits]{outfits}",
          "  [Image] {imageId}: {imageDesc}",
          "  [Audio] {audioId}: {audioDesc}",
          "</character>"
        ].join("\n"),
        innerOutfitTemplate: [
          '  <outfit id="{nameEN}" cn="{nameCN}">',
          "    [Upper] {upperBody}",
          "    [Lower] {lowerBody}",
          "  </outfit>"
        ].join("\n"),
        commonCharacterListTemplate: '<common_character id="{nameEN}" cn="{nameCN}" />',
        enableOutfitListTemplate: [
          '<common_outfit id="{nameEN}" cn="{nameCN}">',
          "  [Upper] {upperBody}",
          "  [Lower] {lowerBody}",
          "</common_outfit>"
        ].join("\n")
      },
      "Markdown \u6781\u7B80\u5361\u7247": {
        characterListTemplate: [
          "### {nameCN}\uFF08{nameEN}\uFF09",
          "- \u7279\u5F81\uFF1A{traits}",
          "- \u4E94\u5B98\uFF1A{facial}",
          "- \u4E0A\u534A\u8EAB\uFF1A{upperSFW}",
          "- \u4E0B\u534A\u8EAB\uFF1A{lowerSFW}",
          "- \u4E0A\u534A\u8EABNSFW\uFF1A{upperNSFW}",
          "- \u4E0B\u534A\u8EABNSFW\uFF1A{lowerNSFW}",
          "- \u670D\u88C5\uFF1A{outfits}",
          "- \u56FE\u7247\uFF1A[{imageId}] {imageDesc}",
          "- \u97F3\u9891\uFF1A[{audioId}] {audioDesc}"
        ].join("\n"),
        innerOutfitTemplate: [
          "  - **{nameCN}**\uFF08{nameEN}\uFF09",
          "    - \u4E0A\u534A\u8EAB\uFF1A{upperBody}",
          "    - \u4E0B\u534A\u8EAB\uFF1A{lowerBody}"
        ].join("\n"),
        commonCharacterListTemplate: "- {nameCN}\uFF08{nameEN}\uFF09",
        enableOutfitListTemplate: [
          "### {nameCN}\uFF08{nameEN}\uFF09",
          "- \u4E0A\u534A\u8EAB\uFF1A{upperBody}",
          "- \u4E0B\u534A\u8EAB\uFF1A{lowerBody}"
        ].join("\n")
      },
      "\u89C6\u9891\u6CE8\u5165": {
        characterListTemplate: [
          '<character id="{nameEN}" cn="{nameCN}">',
          "  [Traits] {traits}",
          "  [image_id]:{imageId} \u8BF4\u660E:{imageDesc}",
          "  [audio_id]:{audioId} \u8BF4\u660E:{audioDesc}",
          "  [Face] Front: {facial}",
          "  [Face] Back: {facialBack}",
          "  [SFW] Upper: {upperSFW}",
          "  [SFW] Lower: {lowerSFW}",
          "  [NSFW] Upper: {upperNSFW}",
          "  [NSFW] Lower: {lowerNSFW}",
          "  [Outfits]{outfits}",
          "</character>"
        ].join("\n"),
        innerOutfitTemplate: [
          '  <outfit id="{nameEN}" cn="{nameCN}">',
          "    [Upper] {upperBody}",
          "    [Lower] {lowerBody}",
          "  </outfit>"
        ].join("\n"),
        commonCharacterListTemplate: '<common_character id="{nameEN}" cn="{nameCN}" />',
        enableOutfitListTemplate: [
          '<common_outfit id="{nameEN}" cn="{nameCN}">',
          "  [Upper] {upperBody}",
          "  [Lower] {lowerBody}",
          "</common_outfit>"
        ].join("\n")
      }
    };

PLACEHOLDER_RE = /\{([a-zA-Z0-9_]+)\}/g;

TEMPLATE_FIELDS = [
      ["tpl_characterListTemplate", "characterListTemplate"],
      ["tpl_innerOutfitTemplate", "innerOutfitTemplate"],
      ["tpl_commonCharacterListTemplate", "commonCharacterListTemplate"],
      ["tpl_enableOutfitListTemplate", "enableOutfitListTemplate"]
    ];

TEMPLATE_TEXTAREA_SELECTOR = TEMPLATE_FIELDS.map(([id]) => "#" + id).join(", ");

PREVIEW_SAMPLE_CHARACTER = {
      nameCN: "\u7231\u4E3D\u4E1D",
      nameEN: "Alice",
      characterTraits: "1girl, solo, masterpiece, blonde hair, blue eyes",
      facialFeatures: "cute smile, delicate face",
      facialFeaturesBack: "long flowing blonde hair",
      upperBodySFW: "pale skin, slender arms, collarbone",
      upperBodySFWBack: "slender spine, shoulder blades",
      fullBodySFW: "long legs, thigh gap",
      fullBodySFWBack: "gluteal fold",
      upperBodyNSFW: "small breasts, pink nipples",
      upperBodyNSFWBack: "waist dimples, smooth back",
      fullBodyNSFW: "shaved pussy",
      fullBodyNSFWBack: "plump butt",
      negative: "lowres, bad anatomy",
      outfits: ["__preview_outfit__"]
    };

PREVIEW_SAMPLE_CHARACTER_PARTIAL = {
      nameCN: "\u8D1D\u8482",
      nameEN: "Betty",
      characterTraits: "1girl, solo, silver hair, red eyes",
      facialFeatures: "cool expression, twin braids",
      facialFeaturesBack: "twin braids back",
      upperBodySFW: "fair skin, toned waist",
      upperBodySFWBack: "back curvature",
      fullBodySFW: "thick thighs",
      fullBodySFWBack: "plump glutes"
    };

PREVIEW_SAMPLE_ENABLE_ENTRY = {
      imageFileId: "img_001.png",
      imageDescription: "\u4E00\u5F20\u89D2\u8272\u5168\u8EAB\u7AD9\u7ACB\u7684\u6E05\u6670\u56FE\u7247\uFF0C\u767D\u8272\u80CC\u666F",
      audioFileId: "voice_001.mp3",
      audioDescription: "\u4E00\u53E5\u6B22\u5FEB\u7684\u81EA\u6211\u4ECB\u7ECD\u8BED\u97F3"
    };

PREVIEW_SAMPLE_OUTFITS = {
      __preview_outfit__: {
        nameCN: "JK\u5236\u670D",
        nameEN: "JK Uniform",
        upperBody: "white collared shirt, red ribbon",
        upperBodyBack: "sailor collar back",
        fullBody: "pleated navy skirt",
        fullBodyBack: "pleated skirt back"
      },
      __preview_common_outfit__: {
        nameCN: "\u8FD0\u52A8\u670D",
        nameEN: "Tracksuit",
        upperBody: "zipper jacket, athletic wear",
        upperBodyBack: "sports logo on back",
        fullBody: "track pants, sneakers",
        fullBodyBack: "pants back seam"
      }
    };

function getCharacterPromptData(character, outfitsText = "", mediaInfo = {}) {
  if (!character) return {};
  return {
    nameCN: character.nameCN || "",
    nameEN: character.nameEN ? character.nameEN.split("|")[0].trim() : "",
    traits: character.characterTraits || "",
    facial: character.facialFeatures || "",
    facialBack: character.facialFeaturesBack || "",
    upperSFW: character.upperBodySFW || "",
    upperSFWBack: character.upperBodySFWBack || "",
    // 字段名是 fullBody*，但 UI 文案是「下半身」，两套名字都提供
    fullSFW: character.fullBodySFW || "",
    fullSFWBack: character.fullBodySFWBack || "",
    lowerSFW: character.fullBodySFW || "",
    lowerSFWBack: character.fullBodySFWBack || "",
    upperNSFW: character.upperBodyNSFW || "",
    upperNSFWBack: character.upperBodyNSFWBack || "",
    fullNSFW: character.fullBodyNSFW || "",
    fullNSFWBack: character.fullBodyNSFWBack || "",
    lowerNSFW: character.fullBodyNSFW || "",
    lowerNSFWBack: character.fullBodyNSFWBack || "",
    negative: character.negative || "",
    outfits: outfitsText || "",
    imageId: mediaInfo.imageId || "",
    imageDesc: mediaInfo.imageDesc || "",
    audioId: mediaInfo.audioId || "",
    audioDesc: mediaInfo.audioDesc || ""
  };
}

function getOutfitPromptData(outfit) {
  if (!outfit) return {};
  return {
    nameCN: outfit.nameCN || "",
    nameEN: outfit.nameEN ? outfit.nameEN.split("|")[0].trim() : "",
    upperBody: outfit.upperBody || "",
    upperBodyBack: outfit.upperBodyBack || "",
    // 字段名是 fullBody*，但 UI 文案是「下半身」，两套名字都提供
    fullBody: outfit.fullBody || "",
    fullBodyBack: outfit.fullBodyBack || "",
    lowerBody: outfit.fullBody || "",
    lowerBodyBack: outfit.fullBodyBack || ""
  };
}

function getSystemDefaultInjectionTemplates() {
  return { ...SYSTEM_INJECTION_TEMPLATES["\u9ED8\u8BA4\u65B9\u6848"] };
}

function applyInjectionTemplate(templateStr, dataMap) {
  if (!templateStr || typeof templateStr !== "string") return "";
  const data = dataMap || {};
  const resultLines = [];
  let placeholderLineCount = 0;
  let keptPlaceholderLineCount = 0;
  for (const rawLine of templateStr.split(/\r?\n/)) {
    const matches = [...rawLine.matchAll(PLACEHOLDER_RE)];
    if (matches.length === 0) {
      resultLines.push(rawLine);
      continue;
    }
    placeholderLineCount++;
    const hasValue = matches.some((m) => {
      const v = data[m[1]];
      return v !== void 0 && v !== null && String(v).trim() !== "";
    });
    if (!hasValue) continue;
    const replaced = rawLine.replace(PLACEHOLDER_RE, (_, key) => {
      const v = data[key];
      return v !== void 0 && v !== null ? String(v) : "";
    });
    resultLines.push(replaced);
    keptPlaceholderLineCount++;
  }
  if (placeholderLineCount > 0 && keptPlaceholderLineCount === 0) {
    return "";
  }
  return resultLines.join("\n");
}

function ensureInjectionTemplatesInit() {
  const settings3 = extension_settings[extensionName];
  if (!settings3) return;
  let modified = false;
  if (!settings3.injectionTemplates || typeof settings3.injectionTemplates !== "object") {
    settings3.injectionTemplates = { presets: {}, currentPresetId: "\u9ED8\u8BA4\u65B9\u6848" };
    modified = true;
  }
  if (!settings3.injectionTemplates.presets || typeof settings3.injectionTemplates.presets !== "object") {
    settings3.injectionTemplates.presets = {};
    modified = true;
  }
  const hadVideoPreset = Boolean(settings3.injectionTemplates.presets["\u89C6\u9891\u6CE8\u5165"]);
  for (const [id, tpl] of Object.entries(SYSTEM_INJECTION_TEMPLATES)) {
    if (!settings3.injectionTemplates.presets[id]) {
      settings3.injectionTemplates.presets[id] = { ...tpl };
      modified = true;
    }
  }
  if (!hadVideoPreset) {
    settings3.injectionTemplates.currentPresetId = "\u89C6\u9891\u6CE8\u5165";
    modified = true;
    console.log("[st-chatu8] \u68C0\u6D4B\u5230\u7F3A\u5C11\u300C\u89C6\u9891\u6CE8\u5165\u300D\u63D0\u793A\u8BCD\u6A21\u677F\u65B9\u6848\uFF0C\u5DF2\u81EA\u52A8\u5BFC\u5165\u5E76\u751F\u6548\u3002");
  }
  const currentId = settings3.injectionTemplates.currentPresetId;
  if (!currentId || !settings3.injectionTemplates.presets[currentId]) {
    settings3.injectionTemplates.currentPresetId = "\u89C6\u9891\u6CE8\u5165" in settings3.injectionTemplates.presets ? "\u89C6\u9891\u6CE8\u5165" : "\u9ED8\u8BA4\u65B9\u6848";
    modified = true;
  }
  if (modified) {
    saveSettingsDebounced();
  }
}

function getActiveInjectionTemplates() {
  ensureInjectionTemplatesInit();
  const settings3 = extension_settings[extensionName];
  const defaults = SYSTEM_INJECTION_TEMPLATES["\u9ED8\u8BA4\u65B9\u6848"];
  const currentId = settings3?.injectionTemplates?.currentPresetId || "\u9ED8\u8BA4\u65B9\u6848";
  const preset = settings3?.injectionTemplates?.presets?.[currentId] || {};
  return {
    characterListTemplate: preset.characterListTemplate ?? defaults.characterListTemplate,
    innerOutfitTemplate: preset.innerOutfitTemplate ?? defaults.innerOutfitTemplate,
    commonCharacterListTemplate: preset.commonCharacterListTemplate ?? defaults.commonCharacterListTemplate,
    enableOutfitListTemplate: preset.enableOutfitListTemplate ?? defaults.enableOutfitListTemplate
  };
}

function renderCharacterOutfitsText(character, outfitPresets, innerOutfitTemplate) {
  if (!Array.isArray(character?.outfits) || character.outfits.length === 0) return "";
  const blocks = [];
  for (const outfitId of character.outfits) {
    const outfit = outfitPresets?.[outfitId];
    if (!outfit) continue;
    const rendered = applyInjectionTemplate(innerOutfitTemplate, getOutfitPromptData(outfit));
    if (rendered.trim()) blocks.push(rendered);
  }
  return blocks.length > 0 ? "\n\n" + blocks.join("\n\n") : "";
}

function readTemplatesFromUI(container) {
  const result = {};
  for (const [domId, field] of TEMPLATE_FIELDS) {
    result[field] = container.find("#" + domId).val() || "";
  }
  return result;
}

function updateInjectionTemplateUI(container) {
  ensureInjectionTemplatesInit();
  const settings3 = extension_settings[extensionName];
  if (!settings3?.injectionTemplates) return;
  const presets = settings3.injectionTemplates.presets;
  const currentId = settings3.injectionTemplates.currentPresetId || "\u9ED8\u8BA4\u65B9\u6848";
  const $select = container.find("#injection_template_preset_id");
  $select.empty();
  for (const id of Object.keys(presets)) {
    $select.append($("<option></option>").attr("value", id).text(id));
  }
  $select.val(currentId);
  const active = presets[currentId] || getSystemDefaultInjectionTemplates();
  for (const [domId, field] of TEMPLATE_FIELDS) {
    container.find("#" + domId).val(active[field] || "");
  }
  renderInjectionTemplateLivePreview(container);
}

function renderInjectionTemplateLivePreview(container) {
  const tpls = readTemplatesFromUI(container);
  const sections = [];
  const charTexts = [];
  const mediaInfoPreview = {
    imageId: PREVIEW_SAMPLE_ENABLE_ENTRY.imageFileId,
    imageDesc: PREVIEW_SAMPLE_ENABLE_ENTRY.imageDescription,
    audioId: PREVIEW_SAMPLE_ENABLE_ENTRY.audioFileId,
    audioDesc: PREVIEW_SAMPLE_ENABLE_ENTRY.audioDescription
  };
  for (const sample of [PREVIEW_SAMPLE_CHARACTER, PREVIEW_SAMPLE_CHARACTER_PARTIAL]) {
    const outfitsText = renderCharacterOutfitsText(sample, PREVIEW_SAMPLE_OUTFITS, tpls.innerOutfitTemplate);
    const text = applyInjectionTemplate(tpls.characterListTemplate, getCharacterPromptData(sample, outfitsText, mediaInfoPreview));
    if (text.trim()) charTexts.push(text);
  }
  sections.push("=== \u3010\u89D2\u8272\u542F\u7528\u5217\u8868\u3011 ===\n" + (charTexts.join("\n\n") || "\uFF08\u65E0\u8F93\u51FA\uFF09"));
  const commonCharTexts = [];
  for (const sample of [PREVIEW_SAMPLE_CHARACTER, PREVIEW_SAMPLE_CHARACTER_PARTIAL]) {
    const text = applyInjectionTemplate(tpls.commonCharacterListTemplate, getCharacterPromptData(sample)).trim();
    if (text) commonCharTexts.push(text);
  }
  sections.push("=== \u3010\u901A\u7528\u89D2\u8272\u542F\u7528\u5217\u8868\u3011 ===\n" + (commonCharTexts.join("\n") || "\uFF08\u65E0\u8F93\u51FA\uFF09"));
  const outfitText = applyInjectionTemplate(
    tpls.enableOutfitListTemplate,
    getOutfitPromptData(PREVIEW_SAMPLE_OUTFITS.__preview_common_outfit__)
  );
  sections.push("=== \u3010\u901A\u7528\u670D\u88C5\u542F\u7528\u5217\u8868\u3011 ===\n" + (outfitText.trim() || "\uFF08\u65E0\u8F93\u51FA\uFF09"));
  container.find("#tpl_live_preview").val(sections.join("\n\n"));
}

function exportCurrentInjectionTemplate(container) {
  ensureInjectionTemplatesInit();
  const injTpl = extension_settings[extensionName]?.injectionTemplates;
  const currentId = injTpl?.currentPresetId || "\u9ED8\u8BA4\u65B9\u6848";
  const currentData = readTemplatesFromUI(container);
  const exportData = {
    injectionTemplates: {
      currentPresetId: currentId,
      presets: {
        [currentId]: currentData
      }
    }
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-\u6CE8\u5165\u6A21\u677F\u65B9\u6848-${currentId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastr.success(`\u5DF2\u5BFC\u51FA\u6CE8\u5165\u6A21\u677F\u65B9\u6848\u300C${currentId}\u300D`);
}

function exportAllInjectionTemplates(container) {
  ensureInjectionTemplatesInit();
  const injTpl = extension_settings[extensionName]?.injectionTemplates;
  if (!injTpl?.presets || Object.keys(injTpl.presets).length === 0) {
    toastr.warning("\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u6CE8\u5165\u6A21\u677F\u65B9\u6848");
    return;
  }
  const currentId = injTpl.currentPresetId || "\u9ED8\u8BA4\u65B9\u6848";
  const presetsCopy = { ...injTpl.presets };
  presetsCopy[currentId] = readTemplatesFromUI(container);
  const exportData = {
    injectionTemplates: {
      currentPresetId: currentId,
      presets: presetsCopy
    }
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "st-chatu8-\u6CE8\u5165\u6A21\u677F\u65B9\u6848-\u5168\u90E8.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastr.success(`\u5DF2\u5BFC\u51FA\u5168\u90E8 ${Object.keys(presetsCopy).length} \u4E2A\u6CE8\u5165\u6A21\u677F\u65B9\u6848`);
}

function normalizeTemplatePresetData(obj) {
  if (!obj || typeof obj !== "object") return null;
  const hasAnyField = "characterListTemplate" in obj || "innerOutfitTemplate" in obj || "commonCharacterListTemplate" in obj || "enableOutfitListTemplate" in obj;
  if (!hasAnyField) return null;
  return {
    characterListTemplate: String(obj.characterListTemplate ?? ""),
    innerOutfitTemplate: String(obj.innerOutfitTemplate ?? ""),
    commonCharacterListTemplate: String(obj.commonCharacterListTemplate ?? ""),
    enableOutfitListTemplate: String(obj.enableOutfitListTemplate ?? "")
  };
}

function importInjectionTemplatePreset(container) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== "object") {
          toastr.error("\u5BFC\u5165\u5931\u8D25\uFF1A\u6587\u4EF6\u4E0D\u662F\u6709\u6548\u7684 JSON \u683C\u5F0F");
          return;
        }
        let presetsToImport = {};
        if (parsed.injectionTemplates?.presets && typeof parsed.injectionTemplates.presets === "object") {
          presetsToImport = parsed.injectionTemplates.presets;
        } else if (parsed.presets && typeof parsed.presets === "object") {
          presetsToImport = parsed.presets;
        } else if ("characterListTemplate" in parsed || "innerOutfitTemplate" in parsed || "commonCharacterListTemplate" in parsed || "enableOutfitListTemplate" in parsed) {
          let singleName = file.name.replace(/\.json$/i, "").replace(/^st-chatu8-注入模板方案-/, "").trim();
          if (!singleName) singleName = "\u5BFC\u5165\u65B9\u6848";
          presetsToImport = { [singleName]: parsed };
        } else {
          presetsToImport = parsed;
        }
        ensureInjectionTemplatesInit();
        const injTpl = extension_settings[extensionName].injectionTemplates;
        let importedCount = 0;
        let lastImportedId = null;
        for (const [rawName, rawPreset] of Object.entries(presetsToImport)) {
          const normalized = normalizeTemplatePresetData(rawPreset);
          if (!normalized) continue;
          let finalName = String(rawName).trim();
          if (!finalName) continue;
          if (injTpl.presets[finalName]) {
            const confirmed = await stylishConfirm(
              `\u65B9\u6848\u300C${finalName}\u300D\u5DF2\u5B58\u5728\uFF0C\u662F\u5426\u8986\u76D6\uFF1F

\u70B9\u51FB\u3010\u786E\u5B9A\u3011\u8986\u76D6\u539F\u65B9\u6848
\u70B9\u51FB\u3010\u53D6\u6D88\u3011\u5C06\u53E6\u5B58\u4E3A\u65B0\u65B9\u6848`
            );
            if (!confirmed) {
              let counter = 1;
              let candidate = `${finalName} (\u5BFC\u5165)`;
              while (injTpl.presets[candidate]) {
                candidate = `${finalName} (\u5BFC\u5165${++counter})`;
              }
              finalName = candidate;
            }
          }
          injTpl.presets[finalName] = normalized;
          lastImportedId = finalName;
          importedCount++;
        }
        if (importedCount === 0) {
          toastr.warning("\u672A\u80FD\u8BC6\u522B\u5230\u6709\u6548\u7684\u6CE8\u5165\u6A21\u677F\u65B9\u6848\u6570\u636E");
          return;
        }
        if (lastImportedId) {
          injTpl.currentPresetId = lastImportedId;
        }
        saveSettingsDebounced();
        updateInjectionTemplateUI(container);
        toastr.success(`\u6210\u529F\u5BFC\u5165 ${importedCount} \u4E2A\u6CE8\u5165\u6A21\u677F\u65B9\u6848`);
      } catch (err) {
        console.error("[InjectionTemplates] \u5BFC\u5165\u65B9\u6848\u5931\u8D25:", err);
        toastr.error(`\u5BFC\u5165\u5931\u8D25: ${err.message || "\u6587\u4EF6\u89E3\u6790\u9519\u8BEF"}`);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function setupInjectionTemplateControls(container) {
  updateInjectionTemplateUI(container);
  let $lastActive = container.find("#tpl_characterListTemplate");
  container.find(TEMPLATE_TEXTAREA_SELECTOR).off("focus.injTpl click.injTpl").on("focus.injTpl click.injTpl", function() {
    $lastActive = $(this);
  });
  container.find(TEMPLATE_TEXTAREA_SELECTOR).off("input.injTpl").on("input.injTpl", function() {
    renderInjectionTemplateLivePreview(container);
  });
  container.find(".var-tab-btn").off("click.injTpl").on("click.injTpl", function(e) {
    e.preventDefault();
    container.find(".var-tab-btn").removeClass("primary active");
    $(this).addClass("primary active");
    const tab = $(this).data("tab");
    container.find(".var-panel").hide();
    container.find(`#var-panel-${tab}`).css("display", "flex");
  });
  container.find(".st-chatu8-var-btn").off("click.injTpl").on("click.injTpl", function(e) {
    e.preventDefault();
    const varTag = $(this).data("var");
    if (!varTag) return;
    if (!$lastActive || $lastActive.length === 0) {
      $lastActive = container.find("#tpl_characterListTemplate");
    }
    const el = $lastActive[0];
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const val = $lastActive.val() || "";
    $lastActive.val(val.substring(0, start) + varTag + val.substring(end));
    el.focus();
    el.selectionStart = el.selectionEnd = start + varTag.length;
    renderInjectionTemplateLivePreview(container);
  });
  container.find("#injection_template_refresh_preview").off("click.injTpl").on("click.injTpl", function() {
    renderInjectionTemplateLivePreview(container);
  });
  container.find("#injection_template_preset_id").off("change.injTpl").on("change.injTpl", function() {
    ensureInjectionTemplatesInit();
    extension_settings[extensionName].injectionTemplates.currentPresetId = $(this).val();
    saveSettingsDebounced();
    updateInjectionTemplateUI(container);
  });
  container.find("#injection_template_update").off("click.injTpl").on("click.injTpl", function() {
    ensureInjectionTemplatesInit();
    const injTpl = extension_settings[extensionName].injectionTemplates;
    const currentId = injTpl.currentPresetId || "\u9ED8\u8BA4\u65B9\u6848";
    injTpl.presets[currentId] = readTemplatesFromUI(container);
    saveSettingsDebounced();
    toastr.success(`\u65B9\u6848\u300C${currentId}\u300D\u5DF2\u4FDD\u5B58`);
  });
  container.find("#injection_template_new").off("click.injTpl").on("click.injTpl", function() {
    stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u63D0\u793A\u8BCD\u6CE8\u5165\u6A21\u677F\u65B9\u6848\u540D\u79F0").then((newName) => {
      if (!newName || !newName.trim()) return;
      ensureInjectionTemplatesInit();
      const injTpl = extension_settings[extensionName].injectionTemplates;
      const id = newName.trim();
      if (injTpl.presets[id]) {
        toastr.error(`\u65B9\u6848\u300C${id}\u300D\u5DF2\u5B58\u5728`);
        return;
      }
      injTpl.presets[id] = getSystemDefaultInjectionTemplates();
      injTpl.currentPresetId = id;
      saveSettingsDebounced();
      updateInjectionTemplateUI(container);
      toastr.success(`\u5DF2\u65B0\u5EFA\u65B9\u6848\u300C${id}\u300D`);
    });
  });
  container.find("#injection_template_save_as").off("click.injTpl").on("click.injTpl", function() {
    stylInput("\u8BF7\u8F93\u5165\u53E6\u5B58\u4E3A\u7684\u65B0\u65B9\u6848\u540D\u79F0").then((newName) => {
      if (!newName || !newName.trim()) return;
      ensureInjectionTemplatesInit();
      const injTpl = extension_settings[extensionName].injectionTemplates;
      const id = newName.trim();
      if (injTpl.presets[id]) {
        toastr.error(`\u65B9\u6848\u300C${id}\u300D\u5DF2\u5B58\u5728`);
        return;
      }
      injTpl.presets[id] = readTemplatesFromUI(container);
      injTpl.currentPresetId = id;
      saveSettingsDebounced();
      updateInjectionTemplateUI(container);
      toastr.success(`\u5DF2\u53E6\u5B58\u4E3A\u65B9\u6848\u300C${id}\u300D`);
    });
  });
  container.find("#injection_template_rename").off("click.injTpl").on("click.injTpl", function() {
    ensureInjectionTemplatesInit();
    const injTpl = extension_settings[extensionName].injectionTemplates;
    const oldId = injTpl.currentPresetId || "\u9ED8\u8BA4\u65B9\u6848";
    if (SYSTEM_PRESET_IDS.includes(oldId)) {
      toastr.warning(`\u7CFB\u7EDF\u9884\u7F6E\u65B9\u6848\u300C${oldId}\u300D\u4E0D\u53EF\u91CD\u547D\u540D`);
      return;
    }
    stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u65B9\u6848\u540D\u79F0", oldId).then((newName) => {
      if (!newName || !newName.trim()) return;
      const newId = newName.trim();
      if (newId === oldId) return;
      if (injTpl.presets[newId]) {
        toastr.error(`\u65B9\u6848\u300C${newId}\u300D\u5DF2\u5B58\u5728`);
        return;
      }
      injTpl.presets[newId] = injTpl.presets[oldId];
      delete injTpl.presets[oldId];
      injTpl.currentPresetId = newId;
      saveSettingsDebounced();
      updateInjectionTemplateUI(container);
      toastr.success("\u65B9\u6848\u5DF2\u91CD\u547D\u540D");
    });
  });
  container.find("#injection_template_export").off("click.injTpl").on("click.injTpl", function() {
    exportCurrentInjectionTemplate(container);
  });
  container.find("#injection_template_export_all").off("click.injTpl").on("click.injTpl", function() {
    exportAllInjectionTemplates(container);
  });
  container.find("#injection_template_import").off("click.injTpl").on("click.injTpl", function() {
    importInjectionTemplatePreset(container);
  });
  container.find("#injection_template_reset").off("click.injTpl").on("click.injTpl", function() {
    ensureInjectionTemplatesInit();
    const injTpl = extension_settings[extensionName].injectionTemplates;
    const currentId = injTpl.currentPresetId || "\u9ED8\u8BA4\u65B9\u6848";
    stylishConfirm(`\u662F\u5426\u786E\u5B9A\u628A\u65B9\u6848\u300C${currentId}\u300D\u6062\u590D\u4E3A\u9ED8\u8BA4\u5185\u5BB9`).then((confirmed) => {
      if (!confirmed) return;
      const source = SYSTEM_INJECTION_TEMPLATES[currentId] || SYSTEM_INJECTION_TEMPLATES["\u9ED8\u8BA4\u65B9\u6848"];
      injTpl.presets[currentId] = { ...source };
      saveSettingsDebounced();
      updateInjectionTemplateUI(container);
      toastr.success(`\u65B9\u6848\u300C${currentId}\u300D\u5DF2\u6062\u590D\u9ED8\u8BA4\u5185\u5BB9`);
    });
  });
  container.find("#injection_template_delete").off("click.injTpl").on("click.injTpl", function() {
    ensureInjectionTemplatesInit();
    const injTpl = extension_settings[extensionName].injectionTemplates;
    const currentId = injTpl.currentPresetId || "\u9ED8\u8BA4\u65B9\u6848";
    if (SYSTEM_PRESET_IDS.includes(currentId)) {
      toastr.warning(`\u7CFB\u7EDF\u9884\u7F6E\u65B9\u6848\u300C${currentId}\u300D\u4E0D\u53EF\u5220\u9664`);
      return;
    }
    stylishConfirm(`\u662F\u5426\u786E\u5B9A\u5220\u9664\u65B9\u6848\u300C${currentId}\u300D`).then((confirmed) => {
      if (!confirmed) return;
      delete injTpl.presets[currentId];
      injTpl.currentPresetId = "\u9ED8\u8BA4\u65B9\u6848";
      saveSettingsDebounced();
      updateInjectionTemplateUI(container);
      toastr.success(`\u65B9\u6848\u300C${currentId}\u300D\u5DF2\u5220\u9664`);
    });
  });
}

export { applyInjectionTemplate, ensureInjectionTemplatesInit, getActiveInjectionTemplates, getCharacterPromptData, getOutfitPromptData, renderCharacterOutfitsText, setupInjectionTemplateControls, updateInjectionTemplateUI };
