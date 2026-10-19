// 还原自打包产物 — 原始模块: utils/settings/worldbook.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, event_types } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { configDatabase_exports } from "../utils.js";
import { normalizeCharacterEnableEntry, normalizeCharacterPreset } from "../character_config.js";
import { applyInjectionTemplate, getActiveInjectionTemplates, getCharacterPromptData, getOutfitPromptData, renderCharacterOutfitsText } from "./character/injectionTemplates.js";
import "../ui_common.js"; // init_ui_common

function normalizeTriggerText(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/[\s\u3000]+/g, "").toLowerCase();
}

function isCharacterTriggered(character, triggerText) {
  if (!triggerText || !character) return false;
  const normalizedTrigger = normalizeTriggerText(triggerText);
  if (!normalizedTrigger) return false;
  if (character.nameCN) {
    const chineseNames = character.nameCN.split("|").map((name) => normalizeTriggerText(name)).filter((name) => name);
    for (const name of chineseNames) {
      if (normalizedTrigger.includes(name)) {
        return true;
      }
    }
  }
  if (character.nameEN) {
    const englishNames = character.nameEN.split("|").map((name) => normalizeTriggerText(name)).filter((name) => name);
    for (const name of englishNames) {
      if (normalizedTrigger.includes(name)) {
        return true;
      }
    }
  }
  return false;
}

function getTriggeredCharacterName(character, triggerText) {
  if (!triggerText || !character) return null;
  const normalizedTrigger = normalizeTriggerText(triggerText);
  if (!normalizedTrigger) return null;
  if (character.nameCN) {
    const chineseNames = character.nameCN.split("|").map((name) => name.trim()).filter((name) => name);
    for (const name of chineseNames) {
      if (normalizedTrigger.includes(normalizeTriggerText(name))) {
        return name;
      }
    }
  }
  if (character.nameEN) {
    const englishNames = character.nameEN.split("|").map((name) => name.trim()).filter((name) => name);
    for (const name of englishNames) {
      if (normalizedTrigger.includes(normalizeTriggerText(name))) {
        return name;
      }
    }
  }
  return null;
}

function inspectCharacterListTrigger(triggerText) {
  const settings3 = extension_settings[extensionName] || {};
  const enablePresetId = settings3.characterEnablePresetId || "";
  const enablePreset = settings3.characterEnablePresets?.[enablePresetId];
  if (!enablePreset || !Array.isArray(enablePreset.characters)) {
    return { presetId: enablePresetId, enabledCount: 0, triggered: [], notTriggered: [], missing: [] };
  }
  const triggered = [];
  const notTriggered = [];
  const missing = [];
  for (const rawEntry of enablePreset.characters) {
    const charId = normalizeCharacterEnableEntry(rawEntry).characterPresetName;
    const character = settings3.characterPresets?.[charId];
    if (!character) {
      missing.push(charId);
      continue;
    }
    const hitName = getTriggeredCharacterName(character, triggerText || "");
    const entry = {
      presetId: charId,
      nameCN: character.nameCN || "",
      nameEN: character.nameEN || "",
      triggeredBy: hitName || ""
    };
    if (hitName) {
      triggered.push(entry);
    } else {
      notTriggered.push(entry);
    }
  }
  return {
    presetId: enablePresetId,
    enabledCount: enablePreset.characters.length,
    triggered,
    notTriggered,
    missing
  };
}

function generateCharacterListText(triggerText = null) {
  const settings3 = extension_settings[extensionName];
  const enablePresetId = settings3.characterEnablePresetId;
  const enablePreset = settings3.characterEnablePresets?.[enablePresetId];
  if (!enablePreset || !Array.isArray(enablePreset.characters) || enablePreset.characters.length === 0) {
    return "\uFF08\u6682\u65E0\u542F\u7528\u7684\u89D2\u8272\uFF09";
  }
  const templates = getActiveInjectionTemplates();
  const characterList = [];
  for (const rawEntry of enablePreset.characters) {
    const entry = normalizeCharacterEnableEntry(rawEntry);
    const charId = entry.characterPresetName;
    const character = settings3.characterPresets?.[charId];
    if (!character) continue;
    if (triggerText !== null) {
      if (!isCharacterTriggered(character, triggerText)) {
        continue;
      }
    }
    const outfitsText = renderCharacterOutfitsText(
      character,
      settings3.outfitPresets,
      templates.innerOutfitTemplate
    );
    normalizeCharacterPreset(character);
    const photoMedia = character.photoMedia || [];
    const legacyImageIds = character.photoImageIds || [];
    const fallbackIndex = Number.isInteger(character.selectedPhotoIndex) ? character.selectedPhotoIndex : 0;
    const photoFallbackId = character.selectedPhotoId || legacyImageIds[fallbackIndex] || photoMedia[fallbackIndex]?.id || null;
    const finalImageId = entry.imageFileId || photoFallbackId;
    const finalImageDesc = entry.imageDescription || photoMedia.find((m) => m.id === finalImageId)?.description || "";
    const audioMedia = character.audioMedia || [];
    const audioFallbackId = character.selectedAudioId || audioMedia[0]?.id || null;
    const finalAudioId = entry.audioFileId || audioFallbackId;
    const finalAudioDesc = entry.audioDescription || audioMedia.find((m) => m.id === finalAudioId)?.description || "";
    const mediaInfo = {
      imageId: finalImageId,
      imageDesc: finalImageDesc,
      audioId: finalAudioId,
      audioDesc: finalAudioDesc
    };
    const rendered = applyInjectionTemplate(
      templates.characterListTemplate,
      getCharacterPromptData(character, outfitsText, mediaInfo)
    );
    if (rendered.trim()) {
      characterList.push(rendered);
    }
  }
  return characterList.length > 0 ? characterList.join("\n\n") : "\uFF08\u6682\u65E0\u88AB\u89E6\u53D1\u7684\u89D2\u8272\uFF09";
}

function generateOutfitEnableListText() {
  const settings3 = extension_settings[extensionName];
  const enablePresetId = settings3.outfitEnablePresetId;
  const enablePreset = settings3.outfitEnablePresets?.[enablePresetId];
  if (!enablePreset || !Array.isArray(enablePreset.outfits) || enablePreset.outfits.length === 0) {
    return "\u6682\u672A\u914D\u7F6E\u901A\u7528\u670D\u88C5";
  }
  const templates = getActiveInjectionTemplates();
  const outfitList = [];
  for (const outfitId of enablePreset.outfits) {
    const outfit = settings3.outfitPresets?.[outfitId];
    if (!outfit) continue;
    const rendered = applyInjectionTemplate(
      templates.enableOutfitListTemplate,
      getOutfitPromptData(outfit)
    );
    if (rendered.trim()) {
      outfitList.push(rendered);
    }
  }
  return outfitList.join("\n\n");
}

function generateCommonCharacterListText() {
  const settings3 = extension_settings[extensionName];
  const enablePresetId = settings3.characterCommonPresetId;
  const enablePreset = settings3.characterCommonPresets?.[enablePresetId];
  if (!enablePreset || !Array.isArray(enablePreset.characters) || enablePreset.characters.length === 0) {
    return "\u6682\u672A\u914D\u7F6E\u901A\u7528\u89D2\u8272";
  }
  const templates = getActiveInjectionTemplates();
  const characterList = [];
  for (const rawEntry of enablePreset.characters) {
    const charId = normalizeCharacterEnableEntry(rawEntry).characterPresetName;
    const character = settings3.characterPresets?.[charId];
    if (!character) continue;
    const rendered = applyInjectionTemplate(
      templates.commonCharacterListTemplate,
      getCharacterPromptData(character)
    ).trim();
    if (rendered) {
      characterList.push(rendered);
    }
  }
  return characterList.join("\n");
}

async function getEnabledCharacterImages(triggerText = null) {
  const { getConfigImage: getConfigImage2 } = await import("../configDatabase.js");
  const settings3 = extension_settings[extensionName];
  const enablePresetId = settings3.characterEnablePresetId;
  const enablePreset = settings3.characterEnablePresets?.[enablePresetId];
  if (!enablePreset || !Array.isArray(enablePreset.characters) || enablePreset.characters.length === 0) {
    return [];
  }
  const collectedImages = [];
  for (const rawEntry of enablePreset.characters) {
    const entry = normalizeCharacterEnableEntry(rawEntry);
    const charId = entry.characterPresetName;
    const character = settings3.characterPresets?.[charId];
    if (!character) continue;
    if (!character.sendPhoto) continue;
    if (triggerText !== null) {
      if (!isCharacterTriggered(character, triggerText)) {
        continue;
      }
    }
    normalizeCharacterPreset(character);
    const media = character.photoMedia || [];
    const legacyImageIds = character.photoImageIds || [];
    const fallbackIndex = Number.isInteger(character.selectedPhotoIndex) ? character.selectedPhotoIndex : 0;
    const fallbackId = character.selectedPhotoId || legacyImageIds[fallbackIndex] || media[fallbackIndex]?.id || null;
    const selectedImageId = entry.imageFileId || fallbackId;
    if (entry.imageFileId && !media.some((item) => item.id === entry.imageFileId)) {
      console.error(`[WorldBook] Invalid image reference ${entry.imageFileId} for character ${charId}`);
      continue;
    }
    if (selectedImageId) {
      try {
        const imageData = await getConfigImage2(selectedImageId);
        if (imageData) {
          const mediaDescription = media.find((item) => item.id === selectedImageId)?.description || "";
          const description = entry.imageDescription || mediaDescription;
          const triggeredName = triggerText ? getTriggeredCharacterName(character, triggerText) : null;
          const label = triggeredName || character.nameCN?.split("|")[0] || character.nameEN?.split("|")[0] || charId;
          collectedImages.push({
            base64: imageData,
            name: `${label} \u7684\u53C2\u8003\u56FE\u7247`,
            description
          });
        }
      } catch (err) {
        console.error(`[WorldBook] Failed to get image ${selectedImageId} for character ${charId}:`, err);
      }
    }
    if (Array.isArray(character.outfits)) {
      for (const outfitId of character.outfits) {
        const outfit = settings3.outfitPresets?.[outfitId];
        if (!outfit || !outfit.sendPhoto) continue;
        const outfitImageIds = outfit.photoImageIds || [];
        if (outfitImageIds.length > 0) {
          let selectedOutfitIndex = outfit.selectedPhotoIndex || 0;
          if (selectedOutfitIndex < 0 || selectedOutfitIndex >= outfitImageIds.length) {
            selectedOutfitIndex = outfitImageIds.length - 1;
          }
          const selectedOutfitImageId = outfitImageIds[selectedOutfitIndex];
          try {
            const imageData = await getConfigImage2(selectedOutfitImageId);
            if (imageData) {
              const triggeredCharName = triggerText ? getTriggeredCharacterName(character, triggerText) : null;
              const charLabel = triggeredCharName || character.nameCN?.split("|")[0] || character.nameEN?.split("|")[0] || charId;
              const outfitLabel = outfit.nameCN?.split("|")[0] || outfit.nameEN?.split("|")[0] || outfitId;
              collectedImages.push({
                base64: imageData,
                name: `${charLabel} \u7684 ${outfitLabel} \u670D\u88C5\u53C2\u8003\u56FE\u7247`
              });
            }
          } catch (err) {
            console.error(`[WorldBook] Failed to get image ${selectedOutfitImageId} for outfit ${outfitId}:`, err);
          }
        }
      }
    }
  }
  return collectedImages;
}

async function getEnabledOutfitImages() {
  const { getConfigImage: getConfigImage2 } = await import("../configDatabase.js");
  const settings3 = extension_settings[extensionName];
  const enablePresetId = settings3.outfitEnablePresetId;
  const enablePreset = settings3.outfitEnablePresets?.[enablePresetId];
  if (!enablePreset || !Array.isArray(enablePreset.outfits) || enablePreset.outfits.length === 0) {
    return [];
  }
  const collectedImages = [];
  for (const outfitId of enablePreset.outfits) {
    const outfit = settings3.outfitPresets?.[outfitId];
    if (!outfit) continue;
    if (!outfit.sendPhoto) continue;
    const imageIds = outfit.photoImageIds || [];
    if (imageIds.length > 0) {
      let selectedIndex = outfit.selectedPhotoIndex || 0;
      if (selectedIndex < 0 || selectedIndex >= imageIds.length) {
        selectedIndex = imageIds.length - 1;
      }
      const selectedImageId = imageIds[selectedIndex];
      try {
        const imageData = await getConfigImage2(selectedImageId);
        if (imageData) {
          const label = outfit.nameCN || outfit.nameEN?.split("|")[0] || outfitId;
          collectedImages.push({
            base64: imageData,
            name: `${label} \u7684\u53C2\u8003\u56FE\u7247`,
            description: outfit.photoMedia?.find((item) => item.id === selectedImageId)?.description || ""
          });
        }
      } catch (err) {
        console.error(`[WorldBook] Failed to get image ${selectedImageId} for outfit ${outfitId}:`, err);
      }
    }
  }
  return collectedImages;
}

async function getCommonCharacterImages() {
  const { getConfigImage: getConfigImage2 } = await import("../configDatabase.js");
  const settings3 = extension_settings[extensionName];
  const enablePresetId = settings3.characterCommonPresetId;
  const enablePreset = settings3.characterCommonPresets?.[enablePresetId];
  if (!enablePreset || !Array.isArray(enablePreset.characters) || enablePreset.characters.length === 0) {
    return [];
  }
  const collectedImages = [];
  for (const rawEntry of enablePreset.characters) {
    const charId = normalizeCharacterEnableEntry(rawEntry).characterPresetName;
    const character = settings3.characterPresets?.[charId];
    if (!character) continue;
    if (!character.sendPhoto) continue;
    normalizeCharacterPreset(character);
    const media = character.photoMedia || [];
    const imageIds = character.photoImageIds || [];
    const fallbackIndex = Number.isInteger(character.selectedPhotoIndex) ? character.selectedPhotoIndex : 0;
    const selectedImageId = character.selectedPhotoId || imageIds[fallbackIndex] || media[fallbackIndex]?.id || media.at(-1)?.id || null;
    if (selectedImageId) {
      try {
        const imageData = await getConfigImage2(selectedImageId);
        if (imageData) {
          const label = character.nameCN || character.nameEN?.split("|")[0] || charId;
          const description = media.find((item) => item.id === selectedImageId)?.description || "";
          collectedImages.push({
            base64: imageData,
            name: `${label} \u7684\u53C2\u8003\u56FE\u7247`,
            description
          });
        }
      } catch (err) {
        console.error(`[WorldBook] Failed to get image ${selectedImageId} for character ${charId}:`, err);
      }
    }
  }
  return collectedImages;
}

function setupWorldBookEventListener() {
  eventSource.on(event_types.WORLDINFO_ENTRIES_LOADED, (data) => {
    const settings3 = extension_settings[extensionName];
    const characterListText = generateCharacterListText();
    const outfitEnableListText = generateOutfitEnableListText();
    const commonCharacterListText = generateCommonCharacterListText();
    console.log("[WorldBook] Character list text:", characterListText);
    console.log("[WorldBook] Outfit enable list text:", outfitEnableListText);
    console.log("[WorldBook] Common character list text:", commonCharacterListText);
    if (data && Array.isArray(data.globalLore)) {
      for (const entry of data.globalLore) {
        if (entry.content && typeof entry.content === "string") {
          if (entry.content.includes("{{\u89D2\u8272\u542F\u7528\u5217\u8868}}")) {
            entry.content = entry.content.replace(/\{\{角色启用列表\}\}/g, characterListText);
          }
          if (entry.content.includes("{{\u901A\u7528\u670D\u88C5\u542F\u7528\u5217\u8868}}")) {
            entry.content = entry.content.replace(/\{\{通用服装启用列表\}\}/g, outfitEnableListText);
          }
          if (entry.content.includes("{{\u901A\u7528\u89D2\u8272\u542F\u7528\u5217\u8868}}")) {
            entry.content = entry.content.replace(/\{\{通用角色启用列表\}\}/g, commonCharacterListText);
          }
        }
      }
    }
    if (data && Array.isArray(data.charLore)) {
      for (const entry of data.charLore) {
        if (entry.content && typeof entry.content === "string") {
          if (entry.content.includes("{{\u89D2\u8272\u542F\u7528\u5217\u8868}}")) {
            entry.content = entry.content.replace(/\{\{角色启用列表\}\}/g, characterListText);
          }
          if (entry.content.includes("{{\u901A\u7528\u670D\u88C5\u542F\u7528\u5217\u8868}}")) {
            entry.content = entry.content.replace(/\{\{通用服装启用列表\}\}/g, outfitEnableListText);
          }
          if (entry.content.includes("{{\u901A\u7528\u89D2\u8272\u542F\u7528\u5217\u8868}}")) {
            entry.content = entry.content.replace(/\{\{通用角色启用列表\}\}/g, commonCharacterListText);
          }
        }
      }
    }
    console.log("[WorldBook] Processed globalLore and charLore entries", JSON.stringify(data));
  });
}

export { generateCharacterListText, generateCommonCharacterListText, generateOutfitEnableListText, getCommonCharacterImages, getEnabledCharacterImages, getEnabledOutfitImages, inspectCharacterListTrigger, setupWorldBookEventListener };
