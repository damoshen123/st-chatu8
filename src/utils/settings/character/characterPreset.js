// 还原自打包产物 — 原始模块: utils/settings/character/characterPreset.js
import { extension_settings } from "../../../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../../../script.js";
import { getContext } from "../../../../../../../st-context.js";
import { EventType, extensionName } from "../../config.js";
import { deleteConfigImage, getConfigAudio, getConfigImage, saveConfigAudio, saveConfigImage } from "../../configDatabase.js";
import { stylInput, stylishConfirm } from "../../ui_common.js";
import { loadOutfitPresetList } from "./outfitPreset.js";
import { decryptImportData, encryptExportData } from "./crypto.js";
import { showCharacterVisualSelector } from "./characterVisualSelector.js";
import { calculateNovelAITokens } from "../../novelaiTokenCalculator.js";
import { translatePromptTags } from "../../ai.js";
import { normalizeCharacterPreset, normalizeMediaEntry } from "../../character_config.js";
import { handlePhotoGeneratePromptClick } from "../../imagePromptGen.js";
import { handleCharacterPromptModify } from "../../characterPromptModify.js";

var CHARACTER_FIELDS, activePhotoRequests, tokenCalcTimeout;

activePhotoRequests = /* @__PURE__ */ new Map();

CHARACTER_FIELDS = [
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
      "negative"
    ];

function setupCharacterControls(container) {
  const settings3 = extension_settings[extensionName];
  loadCharacterPresetList();
  container.find("#character_preset_id").on("change", loadCharacterPreset);
  container.find("#character_new").on("click", createNewCharacterPreset);
  container.find("#character_rename").on("click", renameCharacterPreset);
  container.find("#character_update").on("click", updateCharacterPreset);
  container.find("#character_save_as").on("click", saveCharacterPresetAs);
  container.find("#character_export").on("click", exportCharacterPreset);
  container.find("#character_export_all").on("click", exportAllCharacterPresets);
  container.find("#character_import").on("click", importCharacterPreset);
  container.find("#character_delete").on("click", deleteCharacterPreset);
  container.find("#character_visual_select").on("click", handleCharacterVisualSelect);
  container.find("#char_outfit_check").on("click", checkCharacterOutfitList);
  container.find("#char_outfit_add").on("click", addOutfitFromSelector);
  container.find("#char_outfit_refresh").on("click", loadCharacterOutfitSelector);
  container.find("#char_translate").on("click", translateCharacterFields);
  container.find("#char_photo_prompt_translate").on("click", translatePhotoPrompt);
  container.find("#char_clear_details").on("click", clearCharacterDetailParameters);
  container.find("#char_photo_generate").on("click", handlePhotoGenerate);
  container.find("#char_photo_generate_prompt").on("click", handlePhotoGeneratePrompt);
  container.find("#char_photo_modify_character_prompt").on("click", handlePhotoModifyCharacterPrompt);
  container.find("#char_photo_character_data").on("click", handleCharacterData);
  container.find("#char_photo_upload").on("click", () => {
    document.getElementById("char_photo_upload_input")?.click();
  });
  container.find("#char_photo_upload_input").on("change", handleCharacterPhotoUpload);
  container.find("#char_extra_media_toggle").on("click", function() {
    const extraContainer = document.getElementById("char_extra_media_container");
    const icon = this.querySelector("i");
    if (!extraContainer) return;
    const isHidden = window.getComputedStyle(extraContainer).display === "none";
    if (isHidden) {
      extraContainer.style.display = "flex";
      if (icon) {
        icon.className = "fa-solid fa-minus";
      }
      this.title = "\u6536\u8D77\u8BF4\u660E\u53CA\u97F3\u9891\u8BBE\u7F6E";
    } else {
      extraContainer.style.display = "none";
      if (icon) {
        icon.className = "fa-solid fa-plus";
      }
      this.title = "\u5C55\u5F00\u8BF4\u660E\u53CA\u97F3\u9891\u8BBE\u7F6E";
    }
  });
  container.find("#char_photo_description").on("input", function() {
    const settings4 = extension_settings[extensionName];
    const preset = settings4.characterPresets?.[settings4.characterPresetId];
    if (!preset) return;
    normalizeCharacterPreset(preset);
    const media = preset.photoMedia.find((item) => item.id === preset.selectedPhotoId);
    if (media) {
      media.description = this.value;
      saveSettingsDebounced();
    }
  });
  container.find("#char_audio_description").on("input", function() {
    const settings4 = extension_settings[extensionName];
    const preset = settings4.characterPresets?.[settings4.characterPresetId];
    if (!preset) return;
    normalizeCharacterPreset(preset);
    const media = preset.audioMedia.find((item) => item.id === preset.selectedAudioId);
    if (media) {
      media.description = this.value;
      saveSettingsDebounced();
    }
  });
  container.find("#char_audio_upload").on("click", () => document.getElementById("char_audio_upload_input")?.click());
  container.find("#char_audio_upload_input").on("change", handleCharacterAudioUpload);
  container.find("#char_send_audio").on("change", function() {
    const preset = extension_settings[extensionName].characterPresets?.[extension_settings[extensionName].characterPresetId];
    if (preset) {
      preset.sendAudio = this.checked;
      saveSettingsDebounced();
    }
  });
  container.find("#char_send_photo").on("change", function() {
    const settings4 = extension_settings[extensionName];
    const presetId = settings4.characterPresetId;
    if (presetId && settings4.characterPresets[presetId]) {
      settings4.characterPresets[presetId].sendPhoto = this.checked;
      saveSettingsDebounced();
      console.log("[characterPreset] \u5DF2\u4FDD\u5B58\u89D2\u8272\u53D1\u9001\u56FE\u7247\u8BBE\u7F6E:", this.checked);
    }
  });
  bindCharacterFieldListeners();
  loadCharacterPreset();
}

function loadCharacterPresetList() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("character_preset_id");
  if (!select) return;
  select.innerHTML = "";
  const sortedPresetNames = Object.keys(settings3.characterPresets).sort(
    (a, b) => a.localeCompare(b, "zh-CN", { sensitivity: "base" })
  );
  for (const presetName of sortedPresetNames) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
  select.value = settings3.characterPresetId;
}

function loadCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("character_preset_id");
  if (!select) return;
  const newPresetId = select.value;
  const currentPresetId = settings3.characterPresetId;
  if (currentPresetId && currentPresetId !== newPresetId) {
    const currentPreset = settings3.characterPresets[currentPresetId] || {};
    let isDirty = false;
    for (const field of CHARACTER_FIELDS) {
      const element = document.getElementById(`char_${field}`);
      if (element && element.value !== (currentPreset[field] || "")) {
        isDirty = true;
        break;
      }
    }
    if (isDirty) {
      stylishConfirm("\u60A8\u6709\u672A\u4FDD\u5B58\u7684\u89D2\u8272\u6570\u636E\u3002\u8981\u653E\u5F03\u8FD9\u4E9B\u66F4\u6539\u5E76\u5207\u6362\u9884\u8BBE\u5417\uFF1F").then((confirmed) => {
        if (confirmed) {
          settings3.characterPresetId = newPresetId;
          loadCharacterPresetData(newPresetId);
          saveSettingsDebounced();
        } else {
          select.value = currentPresetId;
        }
      });
      return;
    }
  }
  settings3.characterPresetId = newPresetId;
  loadCharacterPresetData(newPresetId);
  saveSettingsDebounced();
}

function loadCharacterPresetData(presetId) {
  const settings3 = extension_settings[extensionName];
  const preset = settings3.characterPresets[presetId];
  if (!preset) return;
  CHARACTER_FIELDS.forEach((field) => {
    const element = document.getElementById(`char_${field}`);
    if (element) {
      element.value = preset[field] || "";
      const warning = element.closest(".st-chatu8-field-col")?.querySelector(".st-chatu8-unsaved-warning");
      if (warning) $(warning).hide();
    }
  });
  const outfitListElement = document.getElementById("char_outfit_list");
  if (outfitListElement) {
    outfitListElement.value = (preset.outfits || []).join("\n");
  }
  const sendPhotoElement = document.getElementById("char_send_photo");
  if (sendPhotoElement) sendPhotoElement.checked = preset.sendPhoto === true;
  const sendAudioElement = document.getElementById("char_send_audio");
  if (sendAudioElement) sendAudioElement.checked = preset.sendAudio === true;
  loadCharacterPhoto(preset);
  loadCharacterAudio(preset);
  loadCharacterOutfitSelector();
  debouncedUpdateTokenCounts();
}

function updateCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterPresetId;
  if (!presetId || !settings3.characterPresets[presetId]) {
    toastr.warning('\u6CA1\u6709\u6D3B\u52A8\u7684\u89D2\u8272\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148"\u53E6\u5B58\u4E3A"\u4E00\u4E2A\u65B0\u9884\u8BBE\u3002');
    return;
  }
  saveCurrentCharacterData(presetId);
  CHARACTER_FIELDS.forEach((field) => {
    const element = document.getElementById(`char_${field}`);
    if (element) {
      const warning = element.closest(".st-chatu8-field-col")?.querySelector(".st-chatu8-unsaved-warning");
      if (warning) $(warning).hide();
    }
  });
  toastr.success(`\u89D2\u8272\u9884\u8BBE "${presetId}" \u5DF2\u4FDD\u5B58`);
}

function saveCharacterPresetAs() {
  const stContext = getContext();
  const cardPrefix = stContext?.name2 ? `[${stContext.name2}]` : "";
  const defaultName = cardPrefix || "";
  stylInput("\u8BF7\u8F93\u5165\u65B0\u89D2\u8272\u9884\u8BBE\u7684\u540D\u79F0", defaultName).then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      saveCurrentCharacterData(result);
      settings3.characterPresetId = result;
      loadCharacterPresetList();
      alert(`\u89D2\u8272\u9884\u8BBE "${result}" \u5DF2\u4FDD\u5B58\u3002`);
    }
  });
}

function createNewCharacterPreset() {
  const stContext = getContext();
  const cardPrefix = stContext?.name2 ? `[${stContext.name2}]` : "";
  const defaultName = cardPrefix || "";
  stylInput("\u8BF7\u8F93\u5165\u65B0\u89D2\u8272\u9884\u8BBE\u7684\u540D\u79F0", defaultName).then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      if (settings3.characterPresets[result]) {
        alert(`\u89D2\u8272\u9884\u8BBE "${result}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002`);
        return;
      }
      const emptyPreset = {};
      CHARACTER_FIELDS.forEach((field) => {
        emptyPreset[field] = "";
      });
      emptyPreset.outfits = [];
      emptyPreset.photoMedia = [];
      emptyPreset.audioMedia = [];
      emptyPreset.selectedPhotoId = null;
      emptyPreset.selectedAudioId = null;
      emptyPreset.photoImageIds = [];
      emptyPreset.photoPrompt = "";
      emptyPreset.sendPhoto = false;
      emptyPreset.sendAudio = false;
      emptyPreset.generationContext = "";
      emptyPreset.generationWorldBook = "";
      emptyPreset.generationVariables = {};
      settings3.characterPresets[result] = emptyPreset;
      settings3.characterPresetId = result;
      saveSettingsDebounced();
      loadCharacterPresetList();
      loadCharacterPresetData(result);
      toastr.success(`\u7A7A\u767D\u89D2\u8272\u9884\u8BBE "${result}" \u5DF2\u521B\u5EFA\u3002`);
    }
  });
}

function renameCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.characterPresetId;
  if (!currentName || !settings3.characterPresets[currentName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684\u89D2\u8272\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4\u89D2\u8272") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u89D2\u8272\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.characterPresets[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.characterPresets[newName] = settings3.characterPresets[currentName];
      delete settings3.characterPresets[currentName];
      settings3.characterPresetId = newName;
      for (const enablePreset of Object.values(settings3.characterEnablePresets || {})) {
        if (!Array.isArray(enablePreset.characters)) continue;
        enablePreset.characters = enablePreset.characters.map((entry) => {
          if (typeof entry === "string") {
            return entry === currentName ? newName : entry;
          }
          return entry?.characterPresetName === currentName ? { ...entry, characterPresetName: newName } : entry;
        });
      }
      for (const commonPreset of Object.values(settings3.characterCommonPresets || {})) {
        if (!Array.isArray(commonPreset.characters)) continue;
        commonPreset.characters = commonPreset.characters.map(
          (entry) => entry === currentName ? newName : entry
        );
      }
      saveSettingsDebounced();
      loadCharacterPresetList();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
      toastr.success(`\u89D2\u8272\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function saveCurrentCharacterData(presetId) {
  const settings3 = extension_settings[extensionName];
  const preset = {};
  CHARACTER_FIELDS.forEach((field) => {
    const element = document.getElementById(`char_${field}`);
    if (element) {
      preset[field] = element.value || "";
    }
  });
  const outfitListElement = document.getElementById("char_outfit_list");
  if (outfitListElement) {
    preset.outfits = outfitListElement.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  } else {
    preset.outfits = [];
  }
  const photoPromptElement = document.getElementById("char_photo_prompt");
  if (photoPromptElement) {
    preset.photoPrompt = photoPromptElement.value || "";
  }
  const sendPhotoElement = document.getElementById("char_send_photo");
  if (sendPhotoElement) {
    preset.sendPhoto = sendPhotoElement.checked;
  }
  const sendAudioElement = document.getElementById("char_send_audio");
  if (sendAudioElement) {
    preset.sendAudio = sendAudioElement.checked;
  }
  const existingPreset = settings3.characterPresets[presetId] || {};
  normalizeCharacterPreset(existingPreset);
  preset.photoMedia = existingPreset.photoMedia || [];
  preset.audioMedia = existingPreset.audioMedia || [];
  preset.selectedPhotoId = existingPreset.selectedPhotoId || null;
  preset.selectedAudioId = existingPreset.selectedAudioId || null;
  preset.photoImageIds = existingPreset.photoImageIds || [];
  preset.selectedPhotoIndex = existingPreset.selectedPhotoIndex || 0;
  const photoDescription = document.getElementById("char_photo_description");
  const selectedPhoto = preset.photoMedia.find((item) => item.id === preset.selectedPhotoId);
  if (selectedPhoto && photoDescription) selectedPhoto.description = photoDescription.value || "";
  const audioDescription = document.getElementById("char_audio_description");
  const selectedAudio = preset.audioMedia.find((item) => item.id === preset.selectedAudioId);
  if (selectedAudio && audioDescription) selectedAudio.description = audioDescription.value || "";
  preset.generationContext = existingPreset.generationContext || "";
  preset.generationWorldBook = existingPreset.generationWorldBook || "";
  preset.generationVariables = existingPreset.generationVariables || {};
  settings3.characterPresets[presetId] = preset;
  saveSettingsDebounced();
}

function deleteCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = document.getElementById("character_preset_id")?.value;
  if (presetId === "\u9ED8\u8BA4\u89D2\u8272") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u5220\u9664");
    return;
  }
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664\u8BE5\u89D2\u8272\u9884\u8BBE").then((result) => {
    if (result) {
      delete settings3.characterPresets[presetId];
      settings3.characterPresetId = "\u9ED8\u8BA4\u89D2\u8272";
      loadCharacterPresetList();
      loadCharacterPreset();
      saveSettingsDebounced();
    }
  });
}

function formatOutfitListForDialog(outfits, threshold = 8) {
  if (!outfits || !Array.isArray(outfits) || outfits.length === 0) {
    return "";
  }
  if (typeof threshold !== "number" || threshold <= 0) {
    threshold = 8;
  }
  if (outfits.length <= threshold) {
    return ":\n" + outfits.join("\n");
  } else {
    const preview = outfits.slice(0, 5).join("\n");
    return `:
${preview}
...\u7B49\u5171 ${outfits.length} \u4E2A\u670D\u88C5`;
  }
}

async function exportCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterPresetId;
  const preset = settings3.characterPresets[presetId];
  if (!preset) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u89D2\u8272\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const relatedOutfits = preset.outfits || [];
  let dataToExport = {
    characters: { [presetId]: preset }
  };
  if (relatedOutfits.length > 0) {
    const outfitDisplay = formatOutfitListForDialog(relatedOutfits);
    const confirmMessage = `\u68C0\u6D4B\u5230\u8BE5\u89D2\u8272\u5305\u542B ${relatedOutfits.length} \u4E2A\u670D\u88C5${outfitDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u51FA\u76F8\u5173\u670D\u88C5?`;
    const includeOutfits = await stylishConfirm(confirmMessage);
    if (includeOutfits) {
      dataToExport.outfits = {};
      relatedOutfits.forEach((outfitName) => {
        if (settings3.outfitPresets[outfitName]) {
          dataToExport.outfits[outfitName] = settings3.outfitPresets[outfitName];
        }
      });
    }
  }
  normalizeCharacterPreset(preset);
  const imageIdsToExport = new Set(
    (preset.photoMedia || []).map((item) => item.id)
  );
  (preset.photoImageIds || []).forEach((id) => imageIdsToExport.add(id));
  const audioIdsToExport = new Set(
    (preset.audioMedia || []).map((item) => item.id)
  );
  if (dataToExport.outfits) {
    for (const outfitName in dataToExport.outfits) {
      const outfit = dataToExport.outfits[outfitName];
      if (outfit.photoImageIds && outfit.photoImageIds.length > 0) {
        outfit.photoImageIds.forEach((id) => imageIdsToExport.add(id));
      }
    }
  }
  if (imageIdsToExport.size > 0) {
    dataToExport.images = {};
    for (const imageId of imageIdsToExport) {
      try {
        const imageData = await getConfigImage(imageId);
        if (imageData) dataToExport.images[imageId] = imageData;
      } catch (error) {
        console.error(`[CharacterPreset] \u83B7\u53D6\u56FE\u7247 ${imageId} \u5931\u8D25:`, error);
      }
    }
  }
  if (audioIdsToExport.size > 0) {
    dataToExport.audio = {};
    for (const audioId of audioIdsToExport) {
      try {
        const file = await getConfigAudio(audioId);
        const reader = new FileReader();
        dataToExport.audio[audioId] = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file.data);
        });
      } catch (error) {
        console.error(`[CharacterPreset] \u83B7\u53D6\u97F3\u9891 ${audioId} \u5931\u8D25:`, error);
      }
    }
  }
  dataToExport = await encryptExportData(dataToExport);
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-\u89D2\u8272-${presetId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportAllCharacterPresets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.characterPresets || Object.keys(settings3.characterPresets).length === 0) {
    alert("\u6CA1\u6709\u89D2\u8272\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const allOutfits = /* @__PURE__ */ new Set();
  for (const charName in settings3.characterPresets) {
    const charPreset = settings3.characterPresets[charName];
    const charOutfits = charPreset.outfits || [];
    charOutfits.forEach((outfitName) => allOutfits.add(outfitName));
  }
  let dataToExport = {
    characters: settings3.characterPresets
  };
  if (allOutfits.size > 0) {
    const outfitArray = Array.from(allOutfits);
    const outfitDisplay = formatOutfitListForDialog(outfitArray);
    const confirmMessage = `\u68C0\u6D4B\u5230\u6240\u6709\u89D2\u8272\u5171\u5305\u542B ${allOutfits.size} \u4E2A\u4E0D\u540C\u7684\u670D\u88C5${outfitDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u51FA\u76F8\u5173\u670D\u88C5?`;
    const includeOutfits = await stylishConfirm(confirmMessage);
    if (includeOutfits) {
      dataToExport.outfits = {};
      allOutfits.forEach((outfitName) => {
        if (settings3.outfitPresets[outfitName]) {
          dataToExport.outfits[outfitName] = settings3.outfitPresets[outfitName];
        }
      });
    }
  }
  const imageIdsToExport = /* @__PURE__ */ new Set();
  const audioIdsToExport = /* @__PURE__ */ new Set();
  for (const charName in settings3.characterPresets) {
    const charPreset = settings3.characterPresets[charName];
    normalizeCharacterPreset(charPreset);
    (charPreset.photoMedia || []).forEach((item) => imageIdsToExport.add(item.id));
    (charPreset.photoImageIds || []).forEach((id) => imageIdsToExport.add(id));
    (charPreset.audioMedia || []).forEach((item) => audioIdsToExport.add(item.id));
  }
  if (dataToExport.outfits) {
    for (const outfitName in dataToExport.outfits) {
      const outfit = dataToExport.outfits[outfitName];
      if (outfit.photoImageIds && outfit.photoImageIds.length > 0) {
        outfit.photoImageIds.forEach((id) => imageIdsToExport.add(id));
      }
    }
  }
  if (imageIdsToExport.size > 0) {
    dataToExport.images = {};
    for (const imageId of imageIdsToExport) {
      try {
        const imageData = await getConfigImage(imageId);
        if (imageData) {
          dataToExport.images[imageId] = imageData;
        }
      } catch (error) {
        console.error(`[CharacterPreset] \u83B7\u53D6\u56FE\u7247 ${imageId} \u5931\u8D25:`, error);
      }
    }
    console.log(`[CharacterPreset] \u5BFC\u51FA\u5168\u90E8\uFF1A\u5171 ${Object.keys(dataToExport.images).length} \u5F20\u56FE\u7247`);
  }
  if (audioIdsToExport.size > 0) {
    dataToExport.audio = {};
    for (const audioId of audioIdsToExport) {
      try {
        const file = await getConfigAudio(audioId);
        const reader = new FileReader();
        dataToExport.audio[audioId] = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file.data);
        });
      } catch (error) {
        console.error(`[CharacterPreset] \u83B7\u53D6\u97F3\u9891 ${audioId} \u5931\u8D25:`, error);
      }
    }
  }
  dataToExport = await encryptExportData(dataToExport);
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "st-chatu8-\u89D2\u8272-\u5168\u90E8.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        let importedData = JSON.parse(readerEvent.target.result);
        importedData = decryptImportData(importedData);
        let charactersToImport = {};
        let outfitsToImport = {};
        let imagesToImport = importedData.images || {};
        let audioToImport = importedData.audio || {};
        if (importedData.characters) {
          charactersToImport = importedData.characters;
          outfitsToImport = importedData.outfits || {};
        } else {
          charactersToImport = importedData;
        }
        if (Array.isArray(charactersToImport)) {
          const temp = {};
          charactersToImport.forEach((item, idx) => {
            if (typeof item === "string" && item.trim()) {
              temp[item.trim()] = { nameCN: item.trim() };
            } else if (item && typeof item === "object") {
              const name = item.nameCN || item.nameEN || `\u89D2\u8272_${idx + 1}`;
              temp[name] = item;
            }
          });
          charactersToImport = temp;
        } else if (charactersToImport && typeof charactersToImport === "object") {
          const temp = {};
          for (const [k, v] of Object.entries(charactersToImport)) {
            if (typeof v === "string" && v.trim()) {
              temp[v.trim()] = { nameCN: v.trim() };
            } else if (v && typeof v === "object") {
              temp[k] = v;
            }
          }
          charactersToImport = temp;
        } else {
          charactersToImport = {};
        }
        let importOutfits = false;
        if (Object.keys(outfitsToImport).length > 0) {
          const outfitNames = Object.keys(outfitsToImport);
          const outfitDisplay = formatOutfitListForDialog(outfitNames);
          const confirmMessage = `\u68C0\u6D4B\u5230 ${outfitNames.length} \u4E2A\u76F8\u5173\u670D\u88C5${outfitDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u5165?`;
          importOutfits = await stylishConfirm(confirmMessage);
        }
        let importedImagesCount = 0;
        let importedAudioCount = 0;
        const imageIdMapping = {};
        const audioIdMapping = {};
        for (const oldImageId in imagesToImport) {
          try {
            const newImageId = await saveConfigImage(imagesToImport[oldImageId]);
            imageIdMapping[oldImageId] = newImageId;
            importedImagesCount++;
          } catch (error) {
            console.error(`[CharacterPreset] \u5BFC\u5165\u56FE\u7247 ${oldImageId} \u5931\u8D25:`, error);
          }
        }
        for (const oldAudioId in audioToImport) {
          try {
            const newAudioId = await saveConfigAudio(audioToImport[oldAudioId]);
            audioIdMapping[oldAudioId] = newAudioId;
            importedAudioCount++;
          } catch (error) {
            console.error(`[CharacterPreset] \u5BFC\u5165\u97F3\u9891 ${oldAudioId} \u5931\u8D25:`, error);
          }
        }
        const remapCharacterMedia = (preset) => {
          if (!preset || typeof preset !== "object") return;
          normalizeCharacterPreset(preset);
          preset.photoImageIds = (preset.photoImageIds || []).map((id) => imageIdMapping[id] || id);
          preset.photoMedia = (preset.photoMedia || []).map((item) => ({
            ...item,
            id: imageIdMapping[item.id] || item.id
          }));
          preset.audioMedia = (preset.audioMedia || []).map((item) => ({
            ...item,
            id: audioIdMapping[item.id] || item.id
          }));
          if (preset.selectedPhotoId) preset.selectedPhotoId = imageIdMapping[preset.selectedPhotoId] || preset.selectedPhotoId;
          if (preset.selectedAudioId) preset.selectedAudioId = audioIdMapping[preset.selectedAudioId] || preset.selectedAudioId;
        };
        Object.values(charactersToImport).forEach(remapCharacterMedia);
        Object.values(outfitsToImport).forEach((preset) => {
          if (!preset || typeof preset !== "object") return;
          preset.photoImageIds = (preset.photoImageIds || []).map((id) => imageIdMapping[id] || id);
          if (preset.photoImageId) preset.photoImageId = imageIdMapping[preset.photoImageId] || preset.photoImageId;
        });
        let newCharactersCount = 0;
        for (const key in charactersToImport) {
          if (charactersToImport.hasOwnProperty(key)) {
            if (!settings3.characterPresets.hasOwnProperty(key)) {
              newCharactersCount++;
            }
            settings3.characterPresets[key] = charactersToImport[key];
          }
        }
        let newOutfitsCount = 0;
        if (importOutfits) {
          for (const key in outfitsToImport) {
            if (outfitsToImport.hasOwnProperty(key)) {
              if (!settings3.outfitPresets.hasOwnProperty(key)) {
                newOutfitsCount++;
              }
              settings3.outfitPresets[key] = outfitsToImport[key];
            }
          }
        }
        saveSettingsDebounced();
        loadCharacterPresetList();
        if (importOutfits) {
          loadOutfitPresetList();
        }
        const firstImportedKey = Object.keys(charactersToImport)[0];
        if (firstImportedKey) {
          settings3.characterPresetId = firstImportedKey;
          const select = document.getElementById("character_preset_id");
          if (select) select.value = firstImportedKey;
          loadCharacterPresetData(firstImportedKey);
        }
        let message = `\u6210\u529F\u5BFC\u5165 ${Object.keys(charactersToImport).length} \u4E2A\u89D2\u8272\u9884\u8BBE\uFF0C\u5176\u4E2D ${newCharactersCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`;
        if (importOutfits) {
          message += `
\u540C\u65F6\u5BFC\u5165 ${Object.keys(outfitsToImport).length} \u4E2A\u670D\u88C5\u9884\u8BBE\uFF0C\u5176\u4E2D ${newOutfitsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`;
        }
        if (importedImagesCount > 0) {
          message += `
\u540C\u65F6\u5BFC\u5165 ${importedImagesCount} \u5F20\u56FE\u7247\u3002`;
        }
        if (importedAudioCount > 0) {
          message += `
\u540C\u65F6\u5BFC\u5165 ${importedAudioCount} \u6761\u97F3\u9891\u3002`;
        }
        alert(message);
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002\n\u9519\u8BEF\u4FE1\u606F: " + err.message);
        console.error("Error importing character presets:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function handleCharacterVisualSelect() {
  showCharacterVisualSelector((presetName) => {
    const select = document.getElementById("character_preset_id");
    if (select) {
      select.value = presetName;
    }
  });
}

async function updateTokenCounts() {
  let totalTokens = 0;
  const tokenCounts = {};
  const tokenFields = CHARACTER_FIELDS.filter((f) => !["nameCN", "nameEN"].includes(f));
  for (const field of tokenFields) {
    const element = document.getElementById(`char_${field}`);
    if (element) {
      const count = await calculateNovelAITokens(element.value || "");
      tokenCounts[field] = count;
      totalTokens += count;
    } else {
      tokenCounts[field] = 0;
    }
  }
  for (const field of tokenFields) {
    const display = document.getElementById(`char_${field}_tokens`);
    if (display) {
      display.textContent = `\u5F53\u524D\u5360\u7528: ${tokenCounts[field] || 0} | \u603B\u5360\u7528: ${totalTokens}`;
    }
  }
  const baseTokens = tokenCounts.characterTraits || 0;
  const frontSfw = baseTokens + (tokenCounts.facialFeatures || 0) + (tokenCounts.upperBodySFW || 0) + (tokenCounts.fullBodySFW || 0);
  const frontNsfw = baseTokens + (tokenCounts.facialFeatures || 0) + (tokenCounts.upperBodyNSFW || 0) + (tokenCounts.fullBodyNSFW || 0);
  const backSfw = baseTokens + (tokenCounts.facialFeaturesBack || 0) + (tokenCounts.upperBodySFWBack || 0) + (tokenCounts.fullBodySFWBack || 0);
  const backNsfw = baseTokens + (tokenCounts.facialFeaturesBack || 0) + (tokenCounts.upperBodyNSFWBack || 0) + (tokenCounts.fullBodyNSFWBack || 0);
  const elFrontSfw = document.getElementById("token_combo_front_sfw");
  const elFrontNsfw = document.getElementById("token_combo_front_nsfw");
  const elBackSfw = document.getElementById("token_combo_back_sfw");
  const elBackNsfw = document.getElementById("token_combo_back_nsfw");
  if (elFrontSfw) elFrontSfw.textContent = `\u6B63\u9762 SFW \u5168\u8EAB: ${frontSfw}`;
  if (elFrontNsfw) elFrontNsfw.textContent = `\u6B63\u9762 NSFW \u5168\u8EAB: ${frontNsfw}`;
  if (elBackSfw) elBackSfw.textContent = `\u80CC\u9762 SFW \u5168\u8EAB: ${backSfw}`;
  if (elBackNsfw) elBackNsfw.textContent = `\u80CC\u9762 NSFW \u5168\u8EAB: ${backNsfw}`;
}

function debouncedUpdateTokenCounts() {
  clearTimeout(tokenCalcTimeout);
  tokenCalcTimeout = setTimeout(updateTokenCounts, 300);
}

function bindCharacterFieldListeners() {
  CHARACTER_FIELDS.forEach((field) => {
    const element = document.getElementById(`char_${field}`);
    if (element) {
      $(element).on("input", function() {
        const settings3 = extension_settings[extensionName];
        const presetName = settings3.characterPresetId;
        const warning = $(this).closest(".st-chatu8-field-col").find(".st-chatu8-unsaved-warning");
        $(warning).hide();
        if (presetName && settings3.characterPresets[presetName]) {
          saveCurrentCharacterData(presetName);
        }
      });
      if (!["nameCN", "nameEN"].includes(field)) {
        $(element).on("input", debouncedUpdateTokenCounts);
      }
    }
  });
}

function loadCharacterOutfitSelector() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("char_outfit_selector");
  if (!select) return;
  select.innerHTML = '<option value="">-- \u9009\u62E9\u670D\u88C5 --</option>';
  for (const presetName in settings3.outfitPresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
}

function addOutfitFromSelector() {
  const select = document.getElementById("char_outfit_selector");
  const textarea = document.getElementById("char_outfit_list");
  if (!select || !textarea) return;
  const selectedOutfit = select.value;
  if (!selectedOutfit) {
    alert("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u670D\u88C5");
    return;
  }
  const currentText = textarea.value.trim();
  const lines = currentText ? currentText.split("\n") : [];
  if (lines.includes(selectedOutfit)) {
    alert("\u8BE5\u670D\u88C5\u5DF2\u5728\u5217\u8868\u4E2D");
    return;
  }
  lines.push(selectedOutfit);
  textarea.value = lines.join("\n");
}

function checkCharacterOutfitList() {
  const settings3 = extension_settings[extensionName];
  const textarea = document.getElementById("char_outfit_list");
  const resultDiv = document.getElementById("char_outfit_check_result");
  const contentDiv = document.getElementById("char_outfit_check_content");
  if (!textarea || !resultDiv || !contentDiv) return;
  const inputOutfits = textarea.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (inputOutfits.length === 0) {
    alert("\u8BF7\u5148\u8F93\u5165\u670D\u88C5\u540D\u79F0");
    return;
  }
  const availableOutfits = /* @__PURE__ */ new Set();
  for (const presetName in settings3.outfitPresets) {
    availableOutfits.add(presetName);
  }
  const results = { found: [], notFound: [] };
  inputOutfits.forEach((outfit) => {
    if (availableOutfits.has(outfit)) {
      results.found.push(outfit);
    } else {
      results.notFound.push(outfit);
    }
  });
  let html = '<div style="margin-bottom: 10px;">';
  html += `<strong>\u603B\u8BA1\uFF1A</strong>${inputOutfits.length} \u4E2A\u670D\u88C5`;
  html += `<br><strong>\u627E\u5230\uFF1A</strong>${results.found.length} \u4E2A`;
  html += `<br><strong>\u672A\u627E\u5230\uFF1A</strong>${results.notFound.length} \u4E2A`;
  html += "</div>";
  if (results.found.length > 0) {
    html += '<div style="margin-bottom: 10px;">';
    html += '<strong style="color: #28a745;">\u2713 \u5DF2\u5B58\u5728\u7684\u670D\u88C5\uFF1A</strong>';
    html += '<ul style="margin: 5px 0; padding-left: 20px;">';
    results.found.forEach((outfit) => {
      html += `<li>${outfit}</li>`;
    });
    html += "</ul></div>";
  }
  if (results.notFound.length > 0) {
    html += "<div>";
    html += '<strong style="color: #dc3545;">\u2717 \u672A\u627E\u5230\u7684\u670D\u88C5\uFF1A</strong>';
    html += '<ul style="margin: 5px 0; padding-left: 20px;">';
    results.notFound.forEach((outfit) => {
      html += `<li>${outfit}</li>`;
    });
    html += "</ul></div>";
  }
  contentDiv.innerHTML = html;
  $(resultDiv).show();
}

function cleanTagForTranslation2(tag) {
  return tag.replace(/^[\{\[\(\<]+|[\}\]\)\>]+$/g, "").replace(/^\{+|\}+$/g, "").replace(/:[\d.]+$/, "").trim();
}

async function clearCharacterDetailParameters() {
  const confirmed = await stylishConfirm(
    "\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u8BE6\u7EC6\u53C2\u6570\u5417\uFF1F\n\n\u8FD9\u5C06\u6E05\u7A7A\u4EE5\u4E0B\u5B57\u6BB5\uFF1A\n- \u89D2\u8272\u7279\u8D28\n- \u9762\u90E8\u7279\u5F81\uFF08\u6B63\u9762/\u80CC\u9762\uFF09\n- \u4E0A\u534A\u8EAB\u63CF\u8FF0\uFF08SFW/NSFW\uFF0C\u6B63\u9762/\u80CC\u9762\uFF09\n- \u5168\u8EAB\u63CF\u8FF0\uFF08SFW/NSFW\uFF0C\u6B63\u9762/\u80CC\u9762\uFF09\n- \u8D1F\u9762\u63D0\u793A\u8BCD\n\n\u6B64\u64CD\u4F5C\u4E0D\u4F1A\u81EA\u52A8\u4FDD\u5B58\uFF0C\u60A8\u9700\u8981\u624B\u52A8\u4FDD\u5B58\u66F4\u6539\u3002"
  );
  if (!confirmed) {
    return;
  }
  const fieldsToClean = [
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
    "negative"
  ];
  fieldsToClean.forEach((field) => {
    const element = document.getElementById(`char_${field}`);
    if (element) {
      element.value = "";
      $(element).trigger("input");
    }
  });
  toastr.success("\u8BE6\u7EC6\u53C2\u6570\u5DF2\u6E05\u7A7A\uFF0C\u8BF7\u8BB0\u5F97\u4FDD\u5B58\u66F4\u6539\u3002");
}

async function translateCharacterFields() {
  const fields = CHARACTER_FIELDS.filter((field) => field !== "nameCN" && field !== "nameEN");
  const fieldsToTranslate = [];
  const allTags = [];
  const removeChineseParenRegex = /（[^）]*）/g;
  for (const field of fields) {
    const element = document.getElementById(`char_${field}`);
    if (element && element.value && element.value.trim()) {
      const cleanedValue = element.value.replace(removeChineseParenRegex, "").trim();
      fieldsToTranslate.push({ field, element, originalValue: element.value, cleanedValue });
      const tags = cleanedValue.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      allTags.push(...tags);
    }
  }
  if (allTags.length === 0) {
    toastr.info("\u6CA1\u6709\u627E\u5230\u9700\u8981\u7FFB\u8BD1\u7684\u5185\u5BB9\u3002");
    return;
  }
  const uniqueTags = [...new Set(allTags)];
  const cleanedTagsForTranslation = uniqueTags.map((tag) => cleanTagForTranslation2(tag)).filter(Boolean);
  const uniqueCleanedTags = [...new Set(cleanedTagsForTranslation)];
  toastr.info("\u6B63\u5728\u7FFB\u8BD1\u89D2\u8272\u63CF\u8FF0...", "\u8BF7\u7A0D\u5019", { timeOut: 0, extendedTimeOut: 0 });
  try {
    const combinedText = uniqueCleanedTags.join(", ");
    const result = await translatePromptTags(combinedText);
    if (result && result.results) {
      const translationMap = {};
      for (const item of result.results) {
        if (item.original && item.translation) {
          translationMap[item.original.toLowerCase()] = item.translation;
        }
      }
      let translatedCount = 0;
      for (const { field, element, cleanedValue } of fieldsToTranslate) {
        const fieldTags = cleanedValue.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
        const translatedTags = fieldTags.map((tag) => {
          const cleanedTag = cleanTagForTranslation2(tag);
          const translation = translationMap[cleanedTag.toLowerCase()];
          if (translation) {
            return `${tag}\uFF08${translation}\uFF09`;
          }
          return tag;
        });
        element.value = translatedTags.join(", ");
        translatedCount++;
        $(element).trigger("input");
      }
      toastr.clear();
      toastr.success(`\u5DF2\u7FFB\u8BD1 ${translatedCount} \u4E2A\u5B57\u6BB5\u3002`);
    } else {
      toastr.clear();
      toastr.info("\u7FFB\u8BD1\u7ED3\u679C\u4E3A\u7A7A\u3002");
    }
  } catch (error) {
    console.error("\u7FFB\u8BD1\u5931\u8D25:", error);
    toastr.clear();
    toastr.error(`\u7FFB\u8BD1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u3002`);
  }
}

async function translatePhotoPrompt() {
  const element = document.getElementById("char_photo_prompt");
  if (!element || !element.value || !element.value.trim()) {
    toastr.info("\u6CA1\u6709\u627E\u5230\u9700\u8981\u7FFB\u8BD1\u7684\u63D0\u793A\u8BCD\u5185\u5BB9\u3002");
    return;
  }
  const removeChineseParenRegex = /（[^）]*）/g;
  const originalValue = element.value;
  const cleanedValue = originalValue.replace(removeChineseParenRegex, "").trim();
  const tags = cleanedValue.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  if (tags.length === 0) {
    toastr.info("\u6CA1\u6709\u627E\u5230\u9700\u8981\u7FFB\u8BD1\u7684\u5185\u5BB9\u3002");
    return;
  }
  const uniqueTags = [...new Set(tags)];
  const cleanedTagsForTranslation = uniqueTags.map((tag) => cleanTagForTranslation2(tag)).filter(Boolean);
  const uniqueCleanedTags = [...new Set(cleanedTagsForTranslation)];
  toastr.info("\u6B63\u5728\u7FFB\u8BD1\u63D0\u793A\u8BCD...", "\u8BF7\u7A0D\u5019", { timeOut: 0, extendedTimeOut: 0 });
  try {
    const combinedText = uniqueCleanedTags.join(", ");
    const result = await translatePromptTags(combinedText);
    if (result && result.results) {
      const translationMap = {};
      for (const item of result.results) {
        if (item.original && item.translation) {
          translationMap[item.original.toLowerCase()] = item.translation;
        }
      }
      const translatedTags = tags.map((tag) => {
        const cleanedTag = cleanTagForTranslation2(tag);
        const translation = translationMap[cleanedTag.toLowerCase()];
        if (translation) {
          return `${tag}\uFF08${translation}\uFF09`;
        }
        return tag;
      });
      element.value = translatedTags.join(", ");
      $(element).trigger("input");
      toastr.clear();
      toastr.success("\u63D0\u793A\u8BCD\u7FFB\u8BD1\u5B8C\u6210\u3002");
    } else {
      toastr.clear();
      toastr.info("\u7FFB\u8BD1\u7ED3\u679C\u4E3A\u7A7A\u3002");
    }
  } catch (error) {
    console.error("\u7FFB\u8BD1\u5931\u8D25:", error);
    toastr.clear();
    toastr.error("\u7FFB\u8BD1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u3002");
  }
}

async function loadCharacterPhoto(preset) {
  normalizeCharacterPreset(preset);
  const photoPreview = document.getElementById("char_photo_preview");
  const photoPlaceholder = document.getElementById("char_photo_placeholder");
  const photoPromptElement = document.getElementById("char_photo_prompt");
  if (photoPromptElement) {
    photoPromptElement.value = preset.photoPrompt || "";
  }
  const photoDescription = document.getElementById("char_photo_description");
  const media = preset.photoMedia || [];
  const imageIds = media.map((item) => item.id);
  const selectedIndex = Math.max(0, imageIds.indexOf(preset.selectedPhotoId));
  const selectedImageId = preset.selectedPhotoId || imageIds[selectedIndex];
  const selectedMedia = media.find((item) => item.id === selectedImageId);
  if (photoDescription) {
    photoDescription.value = selectedMedia?.description || "";
  }
  if (selectedImageId) {
    try {
      const imageData = await getConfigImage(selectedImageId);
      if (imageData && photoPreview && photoPlaceholder) {
        photoPreview.src = imageData;
        photoPreview.style.display = "block";
        photoPlaceholder.style.display = "none";
        photoPreview.style.cursor = "pointer";
        photoPreview.onclick = () => showImageViewer(imageIds, selectedIndex);
        if (photoDescription) photoDescription.value = selectedMedia?.description || "";
        return;
      }
    } catch (error) {
      console.error("[CharacterPreset] \u52A0\u8F7D\u89D2\u8272\u7167\u7247\u5931\u8D25:", error);
    }
  }
  if (photoPreview && photoPlaceholder) {
    photoPreview.src = "";
    photoPreview.style.display = "none";
    photoPlaceholder.style.display = "flex";
    photoPreview.onclick = null;
    photoPreview.style.cursor = "default";
  }
}

async function loadCharacterAudio(preset) {
  normalizeCharacterPreset(preset);
  const audio = document.getElementById("char_audio_preview");
  const description = document.getElementById("char_audio_description");
  const selected = preset.audioMedia?.find((item) => item.id === preset.selectedAudioId);
  if (description) description.value = selected?.description || "";
  if (!audio || !selected?.id) {
    if (audio) {
      audio.removeAttribute("src");
      audio.style.display = "none";
    }
    return;
  }
  try {
    const file = await getConfigAudio(selected.id);
    if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl);
    const objectUrl = URL.createObjectURL(file.data);
    audio.dataset.objectUrl = objectUrl;
    audio.src = objectUrl;
    audio.style.display = "block";
  } catch (error) {
    console.error("[CharacterPreset] \u52A0\u8F7D\u89D2\u8272\u97F3\u9891\u5931\u8D25:", error);
    audio.removeAttribute("src");
    audio.style.display = "none";
  }
}

async function handlePhotoGenerate() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterPresetId;
  const preset = settings3.characterPresets[presetId];
  if (!preset) {
    toastr.warning("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u89D2\u8272\u9884\u8BBE");
    return;
  }
  const photoPromptElement = document.getElementById("char_photo_prompt");
  const prompt2 = photoPromptElement?.value?.trim() || "";
  if (!prompt2) {
    toastr.warning("\u8BF7\u5148\u8F93\u5165\u56FE\u7247\u751F\u6210\u63D0\u793A\u8BCD");
    return;
  }
  const requestId = `char_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  toastr.info("\u6B63\u5728\u751F\u6210\u89D2\u8272\u56FE\u7247...", "\u8BF7\u7A0D\u5019", { timeOut: 0, extendedTimeOut: 0 });
  const handleResponse = async (responseData) => {
    if (responseData.id !== requestId) {
      return;
    }
    const requestInfo = activePhotoRequests.get(requestId);
    if (requestInfo) {
      eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, requestInfo.listener);
      activePhotoRequests.delete(requestId);
    }
    toastr.clear();
    if (responseData.success && responseData.imageData) {
      try {
        const imageId = await saveConfigImage(responseData.imageData, {
          mimeType: "image/png",
          fileName: `${presetId}_${Date.now()}.png`
        });
        normalizeCharacterPreset(preset);
        preset.photoMedia.push(normalizeMediaEntry({
          id: imageId,
          kind: "image",
          mimeType: "image/png",
          fileName: `${presetId}_${Date.now()}.png`
        }, "image"));
        preset.selectedPhotoId = imageId;
        saveSettingsDebounced();
        const photoPreview = document.getElementById("char_photo_preview");
        const photoPlaceholder = document.getElementById("char_photo_placeholder");
        const photoDescription = document.getElementById("char_photo_description");
        if (photoDescription) photoDescription.value = "";
        if (photoPreview && photoPlaceholder) {
          photoPreview.src = responseData.imageData;
          photoPreview.style.display = "block";
          photoPlaceholder.style.display = "none";
          photoPreview.style.cursor = "pointer";
          photoPreview.onclick = () => showImageViewer(preset.photoMedia.map((item) => item.id), preset.photoMedia.length - 1);
        }
        toastr.success("\u89D2\u8272\u56FE\u7247\u751F\u6210\u6210\u529F");
      } catch (error) {
        console.error("[CharacterPreset] \u4FDD\u5B58\u56FE\u7247\u5931\u8D25:", error);
        toastr.error("\u4FDD\u5B58\u56FE\u7247\u5931\u8D25: " + error.message);
      }
    } else {
      toastr.error("\u56FE\u7247\u751F\u6210\u5931\u8D25: " + (responseData.error || "\u672A\u77E5\u9519\u8BEF"));
    }
  };
  activePhotoRequests.set(requestId, {
    listener: handleResponse,
    timestamp: Date.now()
  });
  eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, handleResponse);
  eventSource.emit(EventType.GENERATE_IMAGE_REQUEST, {
    id: requestId,
    prompt: prompt2
    // 可选：指定图片尺寸
    // width: 1024,
    // height: 1024,
  });
}

function handlePhotoGeneratePrompt() {
  handlePhotoGeneratePromptClick();
}

async function handleCharacterPhotoUpload(event) {
  const input = event.target;
  if (!input.files || !input.files[0]) return;
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterPresetId;
  const preset = settings3.characterPresets[presetId];
  if (!preset) {
    toastr.warning("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u89D2\u8272\u9884\u8BBE");
    input.value = "";
    return;
  }
  const file = input.files[0];
  if (!file.type.startsWith("image/")) {
    toastr.warning("\u8BF7\u9009\u62E9\u56FE\u7247\u6587\u4EF6");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const imageData = e.target.result;
      const imageId = await saveConfigImage(imageData, {
        mimeType: file.type || "image/png",
        fileName: file.name
      });
      normalizeCharacterPreset(preset);
      preset.photoMedia.push(normalizeMediaEntry({
        id: imageId,
        kind: "image",
        mimeType: file.type || "image/png",
        fileName: file.name,
        size: file.size
      }, "image"));
      preset.selectedPhotoId = imageId;
      saveSettingsDebounced();
      const photoPreview = document.getElementById("char_photo_preview");
      const photoPlaceholder = document.getElementById("char_photo_placeholder");
      const photoDescription = document.getElementById("char_photo_description");
      if (photoDescription) photoDescription.value = "";
      if (photoPreview && photoPlaceholder) {
        photoPreview.src = imageData;
        photoPreview.style.display = "block";
        photoPlaceholder.style.display = "none";
        photoPreview.style.cursor = "pointer";
        photoPreview.onclick = () => showImageViewer(preset.photoMedia.map((item) => item.id), preset.photoMedia.length - 1);
      }
      toastr.success("\u89D2\u8272\u7167\u7247\u4E0A\u4F20\u6210\u529F");
    } catch (error) {
      console.error("[CharacterPreset] \u4E0A\u4F20\u7167\u7247\u5931\u8D25:", error);
      toastr.error("\u4E0A\u4F20\u7167\u7247\u5931\u8D25: " + error.message);
    }
  };
  reader.onerror = () => {
    toastr.error("\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25");
  };
  reader.readAsDataURL(file);
  input.value = "";
}

async function handleCharacterAudioUpload(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!file.type.startsWith("audio/")) {
    toastr.warning("\u8BF7\u9009\u62E9\u97F3\u9891\u6587\u4EF6");
    return;
  }
  const settings3 = extension_settings[extensionName];
  const preset = settings3.characterPresets?.[settings3.characterPresetId];
  if (!preset) return toastr.warning("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u89D2\u8272\u9884\u8BBE");
  try {
    const id = await saveConfigAudio(file, { mimeType: file.type, fileName: file.name });
    normalizeCharacterPreset(preset);
    preset.audioMedia.push(normalizeMediaEntry({ id, kind: "audio", mimeType: file.type, fileName: file.name, size: file.size }, "audio"));
    preset.selectedAudioId = id;
    saveSettingsDebounced();
    await loadCharacterAudio(preset);
    toastr.success("\u89D2\u8272\u97F3\u9891\u4E0A\u4F20\u6210\u529F");
  } catch (error) {
    console.error("[CharacterPreset] \u4E0A\u4F20\u97F3\u9891\u5931\u8D25:", error);
    toastr.error(`\u4E0A\u4F20\u97F3\u9891\u5931\u8D25: ${error.message}`);
  }
}

function readFileAsBase64ForPopup2(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function handlePhotoModifyCharacterPrompt() {
  const uploadedImages = [];
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-confirm-backdrop";
  const modal = document.createElement("div");
  modal.className = "st-chatu8-confirm-box st-chatu8-popup-modal";
  const title = document.createElement("h3");
  title.className = "st-chatu8-popup-title";
  title.textContent = "\u4FEE\u6539\u89D2\u8272\u63D0\u793A\u8BCD";
  modal.appendChild(title);
  const description = document.createElement("p");
  description.className = "st-chatu8-popup-description";
  description.textContent = "\u8BF7\u8F93\u5165\u60A8\u7684\u4FEE\u6539\u9700\u6C42\uFF0CAI \u5C06\u6839\u636E\u9700\u6C42\u8C03\u6574\u89D2\u8272\u63D0\u793A\u8BCD\uFF1A";
  modal.appendChild(description);
  const textarea = document.createElement("textarea");
  textarea.className = "st-chatu8-textarea";
  textarea.rows = 4;
  textarea.placeholder = "\u4F8B\u5982\uFF1A\u8BA9\u89D2\u8272\u7684\u8868\u60C5\u66F4\u751F\u52A8\u3001\u589E\u52A0\u80CC\u666F\u63CF\u8FF0\u3001\u8C03\u6574\u670D\u88C5\u7EC6\u8282...";
  modal.appendChild(textarea);
  const imageUploadSection = document.createElement("div");
  imageUploadSection.className = "st-chatu8-popup-upload-section";
  const uploadHeader = document.createElement("div");
  uploadHeader.className = "st-chatu8-popup-upload-header";
  const uploadLabel = document.createElement("span");
  uploadLabel.className = "st-chatu8-popup-upload-label";
  uploadLabel.textContent = "\u{1F4CE} \u53C2\u8003\u56FE\u7247\uFF08\u53EF\u9009\uFF09";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  const uploadBtn = document.createElement("button");
  uploadBtn.type = "button";
  uploadBtn.innerHTML = '<i class="fa-solid fa-plus"></i> \u6DFB\u52A0\u56FE\u7247';
  uploadBtn.className = "st-chatu8-btn st-chatu8-popup-upload-btn";
  uploadBtn.addEventListener("click", () => fileInput.click());
  uploadHeader.appendChild(uploadLabel);
  uploadHeader.appendChild(uploadBtn);
  const imagePreviewContainer = document.createElement("div");
  imagePreviewContainer.className = "st-chatu8-popup-image-preview";
  const emptyHint = document.createElement("div");
  emptyHint.className = "st-chatu8-popup-empty-hint";
  emptyHint.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
  imagePreviewContainer.appendChild(emptyHint);
  function updateImagePreviews() {
    imagePreviewContainer.innerHTML = "";
    if (uploadedImages.length === 0) {
      const hint = document.createElement("div");
      hint.className = "st-chatu8-popup-empty-hint";
      hint.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
      imagePreviewContainer.appendChild(hint);
      return;
    }
    uploadedImages.forEach((imgObj, index) => {
      const itemContainer = document.createElement("div");
      itemContainer.className = "st-chatu8-popup-image-item";
      const imgWrapper = document.createElement("div");
      imgWrapper.className = "st-chatu8-popup-image-wrapper";
      const img = document.createElement("img");
      img.src = imgObj.base64;
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "st-chatu8-popup-image-delete";
      deleteBtn.innerHTML = "\xD7";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        uploadedImages.splice(index, 1);
        updateImagePreviews();
      });
      imgWrapper.addEventListener("mouseenter", () => {
        deleteBtn.style.opacity = "1";
      });
      imgWrapper.addEventListener("mouseleave", () => {
        deleteBtn.style.opacity = "0";
      });
      imgWrapper.appendChild(img);
      imgWrapper.appendChild(deleteBtn);
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "st-chatu8-popup-image-name";
      nameInput.placeholder = `\u56FE${index + 1}`;
      nameInput.value = imgObj.name || "";
      nameInput.addEventListener("input", (e) => {
        uploadedImages[index].name = e.target.value;
      });
      itemContainer.appendChild(imgWrapper);
      itemContainer.appendChild(nameInput);
      imagePreviewContainer.appendChild(itemContainer);
    });
    const countLabel = document.createElement("div");
    countLabel.className = "st-chatu8-popup-image-count";
    countLabel.textContent = `\u5DF2\u6DFB\u52A0 ${uploadedImages.length} \u5F20\u56FE\u7247`;
    imagePreviewContainer.appendChild(countLabel);
  }
  fileInput.addEventListener("change", async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const base64 = await readFileAsBase64ForPopup2(file);
        uploadedImages.push({
          base64,
          name: ""
        });
      } catch (err) {
        console.error("[characterPreset] Failed to read image:", err);
      }
    }
    updateImagePreviews();
    fileInput.value = "";
  });
  imageUploadSection.appendChild(uploadHeader);
  imageUploadSection.appendChild(fileInput);
  imageUploadSection.appendChild(imagePreviewContainer);
  modal.appendChild(imageUploadSection);
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "st-chatu8-confirm-buttons";
  const cancelButton = document.createElement("button");
  cancelButton.textContent = "\u53D6\u6D88";
  cancelButton.className = "st-chatu8-btn";
  buttonContainer.appendChild(cancelButton);
  const confirmButton = document.createElement("button");
  confirmButton.innerHTML = '<i class="fa-solid fa-check"></i> \u786E\u8BA4';
  confirmButton.className = "st-chatu8-btn st-chatu8-btn-primary";
  buttonContainer.appendChild(confirmButton);
  modal.appendChild(buttonContainer);
  backdrop.appendChild(modal);
  parent.appendChild(backdrop);
  setTimeout(() => textarea.focus(), 100);
  const closeModal = () => {
    parent.removeChild(backdrop);
  };
  cancelButton.addEventListener("click", closeModal);
  confirmButton.addEventListener("click", () => {
    const userRequirement = textarea.value.trim();
    closeModal();
    handleCharacterPromptModify(userRequirement, [...uploadedImages]);
  });
}

function handleCharacterData() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterPresetId;
  const preset = settings3.characterPresets[presetId];
  if (!preset) {
    toastr.warning("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u89D2\u8272\u9884\u8BBE");
    return;
  }
  const generationContext = preset.generationContext || "";
  const generationWorldBook = preset.generationWorldBook || "";
  const generationVariables = preset.generationVariables || {};
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-confirm-backdrop";
  const modal = document.createElement("div");
  modal.className = "st-chatu8-confirm-box st-chatu8-popup-modal st-chatu8-popup-modal-large";
  const title = document.createElement("h3");
  title.className = "st-chatu8-popup-title";
  title.textContent = `\u89D2\u8272\u6570\u636E - ${presetId}`;
  modal.appendChild(title);
  const contentArea = document.createElement("div");
  contentArea.className = "st-chatu8-popup-content";
  const contextSection = createDataSection(
    "\u751F\u6210\u65F6\u7684\u4E0A\u4E0B\u6587",
    "char_data_context",
    generationContext,
    "\u89D2\u8272\u751F\u6210\u65F6\u4F7F\u7528\u7684\u4E0A\u4E0B\u6587\u5185\u5BB9...",
    6
  );
  contentArea.appendChild(contextSection);
  const worldBookSection = createDataSection(
    "\u751F\u6210\u65F6\u7684\u4E16\u754C\u4E66\u89E6\u53D1",
    "char_data_worldbook",
    generationWorldBook,
    "\u89D2\u8272\u751F\u6210\u65F6\u89E6\u53D1\u7684\u4E16\u754C\u4E66\u5185\u5BB9...",
    6
  );
  contentArea.appendChild(worldBookSection);
  const variablesSection = document.createElement("div");
  variablesSection.className = "st-chatu8-field-col";
  const variablesLabel = document.createElement("label");
  variablesLabel.textContent = "\u751F\u6210\u65F6\u4F7F\u7528\u7684\u53D8\u91CF";
  variablesSection.appendChild(variablesLabel);
  const variablesTextarea = document.createElement("textarea");
  variablesTextarea.id = "char_data_variables";
  variablesTextarea.className = "st-chatu8-textarea st-chatu8-popup-code-textarea";
  variablesTextarea.rows = 4;
  variablesTextarea.placeholder = "\u53D8\u91CF\u683C\u5F0F: \u53D8\u91CF\u540D=\u503C\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09...";
  variablesTextarea.value = Object.entries(generationVariables).map(([key, value]) => `${key}=${value}`).join("\n");
  variablesSection.appendChild(variablesTextarea);
  contentArea.appendChild(variablesSection);
  modal.appendChild(contentArea);
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "st-chatu8-confirm-buttons";
  const cancelButton = document.createElement("button");
  cancelButton.textContent = "\u53D6\u6D88";
  cancelButton.className = "st-chatu8-btn";
  buttonContainer.appendChild(cancelButton);
  const saveButton = document.createElement("button");
  saveButton.innerHTML = '<i class="fa-solid fa-save"></i> \u4FDD\u5B58';
  saveButton.className = "st-chatu8-btn st-chatu8-btn-primary";
  buttonContainer.appendChild(saveButton);
  modal.appendChild(buttonContainer);
  backdrop.appendChild(modal);
  parent.appendChild(backdrop);
  const closeModal = () => {
    parent.removeChild(backdrop);
  };
  cancelButton.addEventListener("click", closeModal);
  saveButton.addEventListener("click", () => {
    const newContext = document.getElementById("char_data_context").value;
    const newWorldBook = document.getElementById("char_data_worldbook").value;
    const variablesText = document.getElementById("char_data_variables").value;
    const newVariables = {};
    variablesText.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        newVariables[key] = value;
      }
    });
    preset.generationContext = newContext;
    preset.generationWorldBook = newWorldBook;
    preset.generationVariables = newVariables;
    saveSettingsDebounced();
    closeModal();
    toastr.success("\u89D2\u8272\u6570\u636E\u5DF2\u4FDD\u5B58");
  });
}

function createDataSection(labelText, textareaId, value, placeholder, rows) {
  const section = document.createElement("div");
  section.className = "st-chatu8-field-col";
  const label = document.createElement("label");
  label.textContent = labelText;
  section.appendChild(label);
  const textarea = document.createElement("textarea");
  textarea.id = textareaId;
  textarea.className = "st-chatu8-textarea st-chatu8-popup-code-textarea";
  textarea.rows = rows;
  textarea.placeholder = placeholder;
  textarea.value = value;
  section.appendChild(textarea);
  return section;
}

async function showImageViewer(imageIds, initialIndex) {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.characterPresetId;
  const preset = settings3.characterPresets[presetId];
  if (!imageIds || imageIds.length === 0) {
    toastr.warning("\u6CA1\u6709\u53EF\u663E\u793A\u7684\u56FE\u7247");
    return;
  }
  let currentIndex = Math.max(0, Math.min(initialIndex, imageIds.length - 1));
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-confirm-backdrop";
  backdrop.style.cssText = `
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
  const container = document.createElement("div");
  container.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 95vw;
        max-height: 95vh;
        background: var(--SmartThemeBlurTintColor, rgba(0, 0, 0, 0.8));
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
  const imageArea = document.createElement("div");
  imageArea.style.cssText = `
        display: flex;
        align-items: center;
        gap: 15px;
        position: relative;
    `;
  const leftButton = document.createElement("button");
  leftButton.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  leftButton.className = "st-chatu8-btn";
  leftButton.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        background: rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
    `;
  imageArea.appendChild(leftButton);
  const img = document.createElement("img");
  img.style.cssText = `
        max-width: calc(95vw - 180px);
        max-height: calc(95vh - 160px);
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    `;
  imageArea.appendChild(img);
  const rightButton = document.createElement("button");
  rightButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  rightButton.className = "st-chatu8-btn";
  rightButton.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        background: rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
    `;
  imageArea.appendChild(rightButton);
  container.appendChild(imageArea);
  const indexIndicator = document.createElement("div");
  indexIndicator.style.cssText = `
        margin-top: 12px;
        font-size: 14px;
        color: inherit;
        opacity: 0.8;
    `;
  container.appendChild(indexIndicator);
  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
        display: flex;
        gap: 15px;
        margin-top: 20px;
        justify-content: center;
    `;
  const downloadButton = document.createElement("button");
  downloadButton.innerHTML = '<i class="fa-solid fa-download"></i> \u4E0B\u8F7D\u56FE\u7247';
  downloadButton.className = "st-chatu8-btn";
  downloadButton.style.cssText = `
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        padding: 10px 20px;
        font-size: 14px;
    `;
  buttonContainer.appendChild(downloadButton);
  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i> \u5220\u9664\u56FE\u7247';
  deleteButton.className = "st-chatu8-btn";
  deleteButton.style.cssText = `
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        padding: 10px 20px;
        font-size: 14px;
    `;
  buttonContainer.appendChild(deleteButton);
  const deleteOthersButton = document.createElement("button");
  deleteOthersButton.innerHTML = '<i class="fa-solid fa-trash-can"></i> \u5220\u9664\u5176\u4ED6';
  deleteOthersButton.className = "st-chatu8-btn";
  deleteOthersButton.style.cssText = `
        background: linear-gradient(135deg, #fd7e14 0%, #e65c00 100%);
        padding: 10px 20px;
        font-size: 14px;
    `;
  buttonContainer.appendChild(deleteOthersButton);
  const closeButton = document.createElement("button");
  closeButton.innerHTML = '<i class="fa-solid fa-xmark"></i> \u5173\u95ED';
  closeButton.className = "st-chatu8-btn";
  closeButton.style.cssText = `
        padding: 10px 20px;
        font-size: 14px;
    `;
  buttonContainer.appendChild(closeButton);
  container.appendChild(buttonContainer);
  backdrop.appendChild(container);
  parent.appendChild(backdrop);
  const imageCache = {};
  const loadImage2 = async (index) => {
    if (index < 0 || index >= imageIds.length) return;
    currentIndex = index;
    const imageId = imageIds[currentIndex];
    indexIndicator.textContent = `${currentIndex + 1} / ${imageIds.length}`;
    leftButton.style.opacity = currentIndex === 0 ? "0.3" : "1";
    leftButton.style.pointerEvents = currentIndex === 0 ? "none" : "auto";
    rightButton.style.opacity = currentIndex === imageIds.length - 1 ? "0.3" : "1";
    rightButton.style.pointerEvents = currentIndex === imageIds.length - 1 ? "none" : "auto";
    try {
      let imageData = imageCache[imageId];
      if (!imageData) {
        imageData = await getConfigImage(imageId);
        if (imageData) {
          imageCache[imageId] = imageData;
        }
      }
      if (imageData) {
        img.src = imageData;
      } else {
        img.src = "";
        toastr.warning("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25");
      }
    } catch (error) {
      console.error("[CharacterPreset] \u52A0\u8F7D\u56FE\u7247\u5931\u8D25:", error);
      img.src = "";
    }
  };
  const closeViewer = async () => {
    document.removeEventListener("keydown", handleKeyDown);
    if (preset) {
      preset.selectedPhotoIndex = currentIndex;
      if (imageIds.length > 0 && currentIndex >= 0 && currentIndex < imageIds.length) {
        preset.selectedPhotoId = imageIds[currentIndex];
      } else {
        preset.selectedPhotoId = null;
      }
      saveSettingsDebounced();
      const photoPreview = document.getElementById("char_photo_preview");
      const photoPlaceholder = document.getElementById("char_photo_placeholder");
      const photoDescription = document.getElementById("char_photo_description");
      if (imageIds.length > 0 && currentIndex >= 0 && currentIndex < imageIds.length) {
        const selectedImageId = imageIds[currentIndex];
        const selectedMedia = preset.photoMedia?.find((item) => item.id === selectedImageId);
        if (photoDescription) {
          photoDescription.value = selectedMedia?.description || "";
        }
        try {
          const imageData = imageCache[selectedImageId] || await getConfigImage(selectedImageId);
          if (imageData && photoPreview && photoPlaceholder) {
            photoPreview.src = imageData;
            photoPreview.style.display = "block";
            photoPlaceholder.style.display = "none";
            photoPreview.style.cursor = "pointer";
            photoPreview.onclick = () => showImageViewer(imageIds, currentIndex);
          }
        } catch (error) {
          console.error("[CharacterPreset] \u66F4\u65B0\u9884\u89C8\u56FE\u5931\u8D25:", error);
        }
      } else {
        if (photoDescription) {
          photoDescription.value = "";
        }
      }
    }
    parent.removeChild(backdrop);
  };
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft" && currentIndex > 0) {
      loadImage2(currentIndex - 1);
    } else if (e.key === "ArrowRight" && currentIndex < imageIds.length - 1) {
      loadImage2(currentIndex + 1);
    } else if (e.key === "Escape") {
      closeViewer();
    }
  };
  leftButton.addEventListener("click", () => {
    if (currentIndex > 0) loadImage2(currentIndex - 1);
  });
  rightButton.addEventListener("click", () => {
    if (currentIndex < imageIds.length - 1) loadImage2(currentIndex + 1);
  });
  closeButton.addEventListener("click", closeViewer);
  document.addEventListener("keydown", handleKeyDown);
  downloadButton.addEventListener("click", () => {
    try {
      const currentImageData = imageCache[imageIds[currentIndex]];
      if (!currentImageData) {
        toastr.warning("\u56FE\u7247\u672A\u52A0\u8F7D\u5B8C\u6210");
        return;
      }
      const link = document.createElement("a");
      link.href = currentImageData;
      const charName = preset?.nameCN || preset?.nameEN || presetId || "character";
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      link.download = `${charName}_${currentIndex + 1}_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastr.success("\u56FE\u7247\u4E0B\u8F7D\u6210\u529F");
    } catch (error) {
      console.error("[CharacterPreset] \u4E0B\u8F7D\u56FE\u7247\u5931\u8D25:", error);
      toastr.error("\u4E0B\u8F7D\u56FE\u7247\u5931\u8D25: " + error.message);
    }
  });
  deleteButton.addEventListener("click", async () => {
    const confirmed = await stylishConfirm("\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u5F20\u89D2\u8272\u56FE\u7247\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002");
    if (confirmed) {
      try {
        const imageIdToDelete = imageIds[currentIndex];
        if (imageIdToDelete) {
          await deleteConfigImage(imageIdToDelete);
        }
        if (preset) {
          if (preset.photoImageIds) {
            const deleteIndex = preset.photoImageIds.indexOf(imageIdToDelete);
            if (deleteIndex > -1) {
              preset.photoImageIds.splice(deleteIndex, 1);
            }
          }
          if (preset.photoMedia) {
            const mediaIndex = preset.photoMedia.findIndex((item) => item.id === imageIdToDelete);
            if (mediaIndex > -1) {
              preset.photoMedia.splice(mediaIndex, 1);
            }
          }
          saveSettingsDebounced();
        }
        imageIds.splice(currentIndex, 1);
        if (imageIds.length > 0) {
          if (currentIndex >= imageIds.length) {
            currentIndex = imageIds.length - 1;
          }
          loadImage2(currentIndex);
          toastr.success("\u56FE\u7247\u5DF2\u5220\u9664");
        } else {
          if (preset) {
            preset.selectedPhotoId = null;
            preset.selectedPhotoIndex = 0;
            saveSettingsDebounced();
          }
          closeViewer();
          toastr.success("\u56FE\u7247\u5DF2\u5220\u9664");
          const photoPreview = document.getElementById("char_photo_preview");
          const photoPlaceholder = document.getElementById("char_photo_placeholder");
          const photoDescription = document.getElementById("char_photo_description");
          if (photoDescription) {
            photoDescription.value = "";
          }
          if (photoPreview && photoPlaceholder) {
            photoPreview.src = "";
            photoPreview.style.display = "none";
            photoPreview.onclick = null;
            photoPreview.style.cursor = "default";
            photoPlaceholder.style.display = "flex";
          }
        }
        delete imageCache[imageIdToDelete];
      } catch (error) {
        console.error("[CharacterPreset] \u5220\u9664\u56FE\u7247\u5931\u8D25:", error);
        toastr.error("\u5220\u9664\u56FE\u7247\u5931\u8D25: " + error.message);
      }
    }
  });
  deleteOthersButton.addEventListener("click", async () => {
    if (imageIds.length <= 1) {
      toastr.info("\u6CA1\u6709\u5176\u4ED6\u56FE\u7247\u53EF\u5220\u9664");
      return;
    }
    const confirmed = await stylishConfirm(`\u786E\u5B9A\u8981\u5220\u9664\u5F53\u524D\u56FE\u7247\u4E4B\u5916\u7684 ${imageIds.length - 1} \u5F20\u56FE\u7247\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`);
    if (confirmed) {
      try {
        const currentImageId = imageIds[currentIndex];
        const idsToDelete = imageIds.filter((id, idx) => idx !== currentIndex);
        for (const imageId of idsToDelete) {
          if (imageId) {
            await deleteConfigImage(imageId);
            delete imageCache[imageId];
          }
        }
        if (preset) {
          if (preset.photoImageIds) {
            preset.photoImageIds = [currentImageId];
          }
          if (preset.photoMedia) {
            preset.photoMedia = preset.photoMedia.filter((item) => item.id === currentImageId);
          }
          preset.selectedPhotoId = currentImageId;
          preset.selectedPhotoIndex = 0;
          saveSettingsDebounced();
        }
        imageIds.length = 0;
        imageIds.push(currentImageId);
        currentIndex = 0;
        loadImage2(0);
        toastr.success(`\u5DF2\u5220\u9664 ${idsToDelete.length} \u5F20\u5176\u4ED6\u56FE\u7247`);
      } catch (error) {
        console.error("[CharacterPreset] \u5220\u9664\u5176\u4ED6\u56FE\u7247\u5931\u8D25:", error);
        toastr.error("\u5220\u9664\u5176\u4ED6\u56FE\u7247\u5931\u8D25: " + error.message);
      }
    }
  });
  await loadImage2(currentIndex);
}

export { loadCharacterPreset, loadCharacterPresetData, loadCharacterPresetList, setupCharacterControls };
