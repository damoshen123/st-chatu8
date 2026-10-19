// 还原自打包产物 — 原始模块: utils/settings/character/outfitPreset.js
import { extension_settings } from "../../../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../../../script.js";
import { getContext } from "../../../../../../../st-context.js";
import { EventType, extensionName } from "../../config.js";
import { deleteConfigImage, getConfigImage, saveConfigImage } from "../../configDatabase.js";
import { formatListForDialog, stylInput, stylishConfirm } from "../../ui_common.js";
import { decryptImportData, encryptExportData } from "./crypto.js";
import { showOutfitVisualSelector } from "./characterVisualSelector.js";
import { calculateNovelAITokens } from "../../novelaiTokenCalculator.js";
import { translatePromptTags } from "../../ai.js";
import { handleOutfitPhotoGeneratePromptClick } from "../../outfitImagePromptGen.js";
import { handleOutfitPromptModify } from "../../outfitPromptModify.js";

var activeOutfitPhotoRequests, outfitTokenCalcTimeout;

activeOutfitPhotoRequests = /* @__PURE__ */ new Map();

function setupOutfitControls(container) {
  const settings3 = extension_settings[extensionName];
  loadOutfitPresetList();
  container.find("#outfit_preset_id").on("change", loadOutfitPreset);
  container.find("#outfit_new").on("click", createNewOutfitPreset);
  container.find("#outfit_rename").on("click", renameOutfitPreset);
  container.find("#outfit_update").on("click", updateOutfitPreset);
  container.find("#outfit_save_as").on("click", saveOutfitPresetAs);
  container.find("#outfit_export").on("click", exportOutfitPreset);
  container.find("#outfit_export_all").on("click", exportAllOutfitPresets);
  container.find("#outfit_import").on("click", importOutfitPreset);
  container.find("#outfit_delete").on("click", deleteOutfitPreset);
  container.find("#outfit_visual_select").on("click", handleOutfitVisualSelect);
  container.find("#outfit_translate").on("click", translateOutfitFields);
  container.find("#outfit_photo_prompt_translate").on("click", translateOutfitPhotoPrompt);
  container.find("#outfit_clear_details").on("click", clearOutfitDetailParameters);
  container.find("#outfit_photo_generate").on("click", handleOutfitPhotoGenerate);
  container.find("#outfit_photo_generate_prompt").on("click", handleOutfitPhotoGeneratePrompt);
  container.find("#outfit_photo_modify_prompt").on("click", handleOutfitPhotoModifyPrompt);
  container.find("#outfit_photo_upload").on("click", () => {
    document.getElementById("outfit_photo_upload_input")?.click();
  });
  container.find("#outfit_photo_upload_input").on("change", handleOutfitPhotoUpload);
  container.find("#outfit_send_photo").on("change", function() {
    const settings4 = extension_settings[extensionName];
    const presetId = settings4.outfitPresetId;
    if (presetId && settings4.outfitPresets[presetId]) {
      settings4.outfitPresets[presetId].sendPhoto = this.checked;
      saveSettingsDebounced();
      console.log("[outfitPreset] \u5DF2\u4FDD\u5B58\u670D\u88C5\u53D1\u9001\u56FE\u7247\u8BBE\u7F6E:", this.checked);
    }
  });
  bindOutfitFieldListeners();
  loadOutfitPreset();
}

function loadOutfitPresetList() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("outfit_preset_id");
  if (!select) return;
  select.innerHTML = "";
  for (const presetName in settings3.outfitPresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
  select.value = settings3.outfitPresetId;
}

function loadOutfitPreset() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("outfit_preset_id");
  if (!select) return;
  const newPresetId = select.value;
  const currentPresetId = settings3.outfitPresetId;
  if (currentPresetId && currentPresetId !== newPresetId) {
    const currentPreset = settings3.outfitPresets[currentPresetId] || {};
    const fields = ["nameCN", "nameEN", "upperBody", "fullBody"];
    let isDirty = false;
    for (const field of fields) {
      const element = document.getElementById(`outfit_${field}`);
      if (element && element.value !== (currentPreset[field] || "")) {
        isDirty = true;
        break;
      }
    }
    if (isDirty) {
      stylishConfirm("\u60A8\u6709\u672A\u4FDD\u5B58\u7684\u670D\u88C5\u6570\u636E\u3002\u8981\u653E\u5F03\u8FD9\u4E9B\u66F4\u6539\u5E76\u5207\u6362\u9884\u8BBE\u5417\uFF1F").then((confirmed) => {
        if (confirmed) {
          settings3.outfitPresetId = newPresetId;
          loadOutfitPresetData(newPresetId);
          saveSettingsDebounced();
        } else {
          select.value = currentPresetId;
        }
      });
      return;
    }
  }
  settings3.outfitPresetId = newPresetId;
  loadOutfitPresetData(newPresetId);
  saveSettingsDebounced();
}

function loadOutfitPresetData(presetId) {
  const settings3 = extension_settings[extensionName];
  const preset = settings3.outfitPresets[presetId];
  if (!preset) return;
  const fields = ["nameCN", "nameEN", "upperBody", "upperBodyBack", "fullBody", "fullBodyBack"];
  fields.forEach((field) => {
    const element = document.getElementById(`outfit_${field}`);
    if (element) {
      element.value = preset[field] || "";
      const warning = element.closest(".st-chatu8-field-col")?.querySelector(".st-chatu8-unsaved-warning");
      if (warning) $(warning).hide();
    }
  });
  const sendPhotoElement = document.getElementById("outfit_send_photo");
  if (sendPhotoElement) {
    sendPhotoElement.checked = preset.sendPhoto === true;
  }
  loadOutfitPhoto(preset);
  debouncedUpdateOutfitTokenCounts();
}

function updateOutfitPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.outfitPresetId;
  if (!presetId || !settings3.outfitPresets[presetId]) {
    toastr.warning('\u6CA1\u6709\u6D3B\u52A8\u7684\u670D\u88C5\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148"\u53E6\u5B58\u4E3A"\u4E00\u4E2A\u65B0\u9884\u8BBE\u3002');
    return;
  }
  saveCurrentOutfitData(presetId);
  toastr.success(`\u670D\u88C5\u9884\u8BBE "${presetId}" \u5DF2\u4FDD\u5B58`);
}

function saveOutfitPresetAs() {
  const stContext = getContext();
  const cardPrefix = stContext?.name2 ? `[${stContext.name2}]` : "";
  const defaultName = cardPrefix || "";
  stylInput("\u8BF7\u8F93\u5165\u65B0\u670D\u88C5\u9884\u8BBE\u7684\u540D\u79F0", defaultName).then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      saveCurrentOutfitData(result);
      settings3.outfitPresetId = result;
      loadOutfitPresetList();
      alert(`\u670D\u88C5\u9884\u8BBE "${result}" \u5DF2\u4FDD\u5B58\u3002`);
    }
  });
}

function createNewOutfitPreset() {
  const stContext = getContext();
  const cardPrefix = stContext?.name2 ? `[${stContext.name2}]` : "";
  const defaultName = cardPrefix || "";
  stylInput("\u8BF7\u8F93\u5165\u65B0\u670D\u88C5\u9884\u8BBE\u7684\u540D\u79F0", defaultName).then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      if (settings3.outfitPresets[result]) {
        alert(`\u670D\u88C5\u9884\u8BBE "${result}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002`);
        return;
      }
      const emptyPreset = {
        nameCN: "",
        nameEN: "",
        owner: "",
        upperBody: "",
        upperBodyBack: "",
        fullBody: "",
        fullBodyBack: "",
        photoImageIds: [],
        photoPrompt: "",
        sendPhoto: false
      };
      settings3.outfitPresets[result] = emptyPreset;
      settings3.outfitPresetId = result;
      saveSettingsDebounced();
      loadOutfitPresetList();
      loadOutfitPresetData(result);
      toastr.success(`\u7A7A\u767D\u670D\u88C5\u9884\u8BBE "${result}" \u5DF2\u521B\u5EFA\u3002`);
    }
  });
}

function renameOutfitPreset() {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.outfitPresetId;
  if (!currentName || !settings3.outfitPresets[currentName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684\u670D\u88C5\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4\u670D\u88C5") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u670D\u88C5\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.outfitPresets[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.outfitPresets[newName] = settings3.outfitPresets[currentName];
      delete settings3.outfitPresets[currentName];
      settings3.outfitPresetId = newName;
      saveSettingsDebounced();
      loadOutfitPresetList();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
      toastr.success(`\u670D\u88C5\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function saveCurrentOutfitData(presetId) {
  const settings3 = extension_settings[extensionName];
  const preset = {};
  const fields = ["nameCN", "nameEN", "upperBody", "upperBodyBack", "fullBody", "fullBodyBack"];
  fields.forEach((field) => {
    const element = document.getElementById(`outfit_${field}`);
    if (element) {
      preset[field] = element.value || "";
    }
  });
  const photoPromptElement = document.getElementById("outfit_photo_prompt");
  if (photoPromptElement) {
    preset.photoPrompt = photoPromptElement.value || "";
  }
  const sendPhotoElement = document.getElementById("outfit_send_photo");
  if (sendPhotoElement) {
    preset.sendPhoto = sendPhotoElement.checked;
  }
  const existingPreset = settings3.outfitPresets[presetId] || {};
  preset.photoImageIds = existingPreset.photoImageIds || [];
  settings3.outfitPresets[presetId] = preset;
  saveSettingsDebounced();
}

function deleteOutfitPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = document.getElementById("outfit_preset_id")?.value;
  if (presetId === "\u9ED8\u8BA4\u670D\u88C5") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u5220\u9664");
    return;
  }
  stylishConfirm("\u662F\u5426\u786E\u5B9A\u5220\u9664\u8BE5\u670D\u88C5\u9884\u8BBE").then((result) => {
    if (result) {
      delete settings3.outfitPresets[presetId];
      settings3.outfitPresetId = "\u9ED8\u8BA4\u670D\u88C5";
      loadOutfitPresetList();
      loadOutfitPreset();
      saveSettingsDebounced();
    }
  });
}

async function exportOutfitPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.outfitPresetId;
  const preset = settings3.outfitPresets[presetId];
  if (!preset) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u670D\u88C5\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  let dataToExport = {
    outfits: { [presetId]: preset }
  };
  const imageIdsToExport = /* @__PURE__ */ new Set();
  if (preset.photoImageIds && preset.photoImageIds.length > 0) {
    preset.photoImageIds.forEach((id) => imageIdsToExport.add(id));
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
        console.error(`[OutfitPreset] \u83B7\u53D6\u56FE\u7247 ${imageId} \u5931\u8D25:`, error);
      }
    }
    console.log(`[OutfitPreset] \u5BFC\u51FA ${Object.keys(dataToExport.images).length} \u5F20\u56FE\u7247`);
  }
  dataToExport = await encryptExportData(dataToExport);
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-\u670D\u88C5-${presetId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportAllOutfitPresets() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.outfitPresets || Object.keys(settings3.outfitPresets).length === 0) {
    alert("\u6CA1\u6709\u670D\u88C5\u9884\u8BBE\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const allOutfitNames = new Set(Object.keys(settings3.outfitPresets));
  const relatedCharacters = {};
  for (const charName in settings3.characterPresets) {
    const charPreset = settings3.characterPresets[charName];
    const charOutfits = charPreset.outfits || [];
    const hasRelatedOutfit = charOutfits.some((outfitName) => allOutfitNames.has(outfitName));
    if (hasRelatedOutfit) {
      relatedCharacters[charName] = charPreset;
    }
  }
  let dataToExport = {
    outfits: settings3.outfitPresets
  };
  if (Object.keys(relatedCharacters).length > 0) {
    const charNames = Object.keys(relatedCharacters);
    const charDisplay = formatListForDialog(charNames, 8, "\u89D2\u8272");
    const confirmMessage = `\u68C0\u6D4B\u5230 ${charNames.length} \u4E2A\u89D2\u8272\u4F7F\u7528\u4E86\u8FD9\u4E9B\u670D\u88C5${charDisplay}

\u662F\u5426\u4E00\u8D77\u5BFC\u51FA\u76F8\u5173\u89D2\u8272?`;
    const includeCharacters = await stylishConfirm(confirmMessage);
    if (includeCharacters) {
      dataToExport.characters = relatedCharacters;
    }
  }
  const imageIdsToExport = /* @__PURE__ */ new Set();
  for (const outfitName in settings3.outfitPresets) {
    const outfit = settings3.outfitPresets[outfitName];
    if (outfit.photoImageIds && outfit.photoImageIds.length > 0) {
      outfit.photoImageIds.forEach((id) => imageIdsToExport.add(id));
    }
  }
  if (dataToExport.characters) {
    for (const charName in dataToExport.characters) {
      const charPreset = dataToExport.characters[charName];
      if (charPreset.photoImageIds && charPreset.photoImageIds.length > 0) {
        charPreset.photoImageIds.forEach((id) => imageIdsToExport.add(id));
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
        console.error(`[OutfitPreset] \u83B7\u53D6\u56FE\u7247 ${imageId} \u5931\u8D25:`, error);
      }
    }
    console.log(`[OutfitPreset] \u5BFC\u51FA\u5168\u90E8\uFF1A\u5171 ${Object.keys(dataToExport.images).length} \u5F20\u56FE\u7247`);
  }
  dataToExport = await encryptExportData(dataToExport);
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "st-chatu8-\u670D\u88C5-\u5168\u90E8.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importOutfitPreset() {
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
        let outfitsToImport = {};
        let imagesToImport = importedData.images || {};
        if (importedData.outfits) {
          outfitsToImport = importedData.outfits;
        } else {
          outfitsToImport = importedData;
        }
        let importedImagesCount = 0;
        const imageIdMapping = {};
        if (Object.keys(imagesToImport).length > 0) {
          console.log(`[OutfitPreset] \u6B63\u5728\u5BFC\u5165 ${Object.keys(imagesToImport).length} \u5F20\u56FE\u7247...`);
          for (const oldImageId in imagesToImport) {
            try {
              const imageData = imagesToImport[oldImageId];
              const newImageId = await saveConfigImage(imageData);
              imageIdMapping[oldImageId] = newImageId;
              importedImagesCount++;
            } catch (error) {
              console.error(`[OutfitPreset] \u5BFC\u5165\u56FE\u7247 ${oldImageId} \u5931\u8D25:`, error);
            }
          }
          console.log(`[OutfitPreset] \u6210\u529F\u5BFC\u5165 ${importedImagesCount} \u5F20\u56FE\u7247`);
          for (const outfitName in outfitsToImport) {
            const outfitPreset = outfitsToImport[outfitName];
            if (outfitPreset.photoImageIds && outfitPreset.photoImageIds.length > 0) {
              outfitPreset.photoImageIds = outfitPreset.photoImageIds.map(
                (oldId) => imageIdMapping[oldId] || oldId
              );
            }
          }
        }
        let newPresetsCount = 0;
        for (const key in outfitsToImport) {
          if (outfitsToImport.hasOwnProperty(key)) {
            if (!settings3.outfitPresets.hasOwnProperty(key)) {
              newPresetsCount++;
            }
            settings3.outfitPresets[key] = outfitsToImport[key];
          }
        }
        saveSettingsDebounced();
        loadOutfitPresetList();
        const firstImportedKey = Object.keys(outfitsToImport)[0];
        if (firstImportedKey) {
          settings3.outfitPresetId = firstImportedKey;
          const select = document.getElementById("outfit_preset_id");
          if (select) select.value = firstImportedKey;
          loadOutfitPresetData(firstImportedKey);
        }
        let message = `\u6210\u529F\u5BFC\u5165 ${Object.keys(outfitsToImport).length} \u4E2A\u670D\u88C5\u9884\u8BBE\uFF0C\u5176\u4E2D ${newPresetsCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`;
        if (importedImagesCount > 0) {
          message += `
\u540C\u65F6\u5BFC\u5165 ${importedImagesCount} \u5F20\u56FE\u7247\u3002`;
        }
        alert(message);
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002\n\u9519\u8BEF\u4FE1\u606F: " + err.message);
        console.error("Error importing outfit presets:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function handleOutfitVisualSelect() {
  showOutfitVisualSelector((presetName) => {
    const select = document.getElementById("outfit_preset_id");
    if (select) {
      select.value = presetName;
    }
  });
}

function bindOutfitFieldListeners() {
  const fields = ["nameCN", "nameEN", "upperBody", "upperBodyBack", "fullBody", "fullBodyBack"];
  fields.forEach((field) => {
    const element = document.getElementById(`outfit_${field}`);
    if (element) {
      $(element).on("input", function() {
        const settings3 = extension_settings[extensionName];
        const presetName = settings3.outfitPresetId;
        const warning = $(this).closest(".st-chatu8-field-col").find(".st-chatu8-unsaved-warning");
        $(warning).hide();
        if (presetName && settings3.outfitPresets[presetName]) {
          saveCurrentOutfitData(presetName);
        }
      });
      $(element).on("input", debouncedUpdateOutfitTokenCounts);
    }
  });
}

async function updateOutfitTokenCounts() {
  let totalTokens = 0;
  const tokenCounts = {};
  const tokenFields = ["upperBody", "upperBodyBack", "fullBody", "fullBodyBack"];
  for (const field of tokenFields) {
    const element = document.getElementById(`outfit_${field}`);
    if (element) {
      const count = await calculateNovelAITokens(element.value || "");
      tokenCounts[field] = count;
      totalTokens += count;
    } else {
      tokenCounts[field] = 0;
    }
  }
  for (const field of tokenFields) {
    const display = document.getElementById(`outfit_${field}_tokens`);
    if (display) {
      display.textContent = `\u5F53\u524D\u5360\u7528: ${tokenCounts[field] || 0} | \u603B\u5360\u7528: ${totalTokens}`;
    }
  }
  const frontTotal = (tokenCounts.upperBody || 0) + (tokenCounts.fullBody || 0);
  const backTotal = (tokenCounts.upperBodyBack || 0) + (tokenCounts.fullBodyBack || 0);
  const elFront = document.getElementById("token_combo_outfit_front");
  const elBack = document.getElementById("token_combo_outfit_back");
  if (elFront) elFront.textContent = `\u6B63\u9762\u5168\u8EAB: ${frontTotal}`;
  if (elBack) elBack.textContent = `\u80CC\u9762\u5168\u8EAB: ${backTotal}`;
}

function debouncedUpdateOutfitTokenCounts() {
  clearTimeout(outfitTokenCalcTimeout);
  outfitTokenCalcTimeout = setTimeout(updateOutfitTokenCounts, 300);
}

function cleanTagForTranslation(tag) {
  return tag.replace(/^[\{\[\(\<]+|[\}\]\)\>]+$/g, "").replace(/^\{+|\}+$/g, "").replace(/:[\d.]+$/, "").trim();
}

async function clearOutfitDetailParameters() {
  const confirmed = await stylishConfirm(
    "\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u8BE6\u7EC6\u53C2\u6570\u5417\uFF1F\n\n\u8FD9\u5C06\u6E05\u7A7A\u4EE5\u4E0B\u5B57\u6BB5\uFF1A\n- \u4E0A\u534A\u8EAB\u63CF\u8FF0\uFF08\u6B63\u9762/\u80CC\u9762\uFF09\n- \u5168\u8EAB\u63CF\u8FF0\uFF08\u6B63\u9762/\u80CC\u9762\uFF09\n\n\u6B64\u64CD\u4F5C\u4E0D\u4F1A\u81EA\u52A8\u4FDD\u5B58\uFF0C\u60A8\u9700\u8981\u624B\u52A8\u4FDD\u5B58\u66F4\u6539\u3002"
  );
  if (!confirmed) {
    return;
  }
  const fieldsToClean = [
    "upperBody",
    "upperBodyBack",
    "fullBody",
    "fullBodyBack"
  ];
  fieldsToClean.forEach((field) => {
    const element = document.getElementById(`outfit_${field}`);
    if (element) {
      element.value = "";
      $(element).trigger("input");
    }
  });
  toastr.success("\u8BE6\u7EC6\u53C2\u6570\u5DF2\u6E05\u7A7A\uFF0C\u8BF7\u8BB0\u5F97\u4FDD\u5B58\u66F4\u6539\u3002");
}

async function translateOutfitFields() {
  const fields = ["upperBody", "upperBodyBack", "fullBody", "fullBodyBack"];
  const fieldsToTranslate = [];
  const allTags = [];
  const removeChineseParenRegex = /（[^）]*）/g;
  for (const field of fields) {
    const element = document.getElementById(`outfit_${field}`);
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
  const cleanedTagsForTranslation = uniqueTags.map((tag) => cleanTagForTranslation(tag)).filter(Boolean);
  const uniqueCleanedTags = [...new Set(cleanedTagsForTranslation)];
  toastr.info("\u6B63\u5728\u7FFB\u8BD1\u670D\u88C5\u63CF\u8FF0...", "\u8BF7\u7A0D\u5019", { timeOut: 0, extendedTimeOut: 0 });
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
          const cleanedTag = cleanTagForTranslation(tag);
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

async function loadOutfitPhoto(preset) {
  const photoPreview = document.getElementById("outfit_photo_preview");
  const photoPlaceholder = document.getElementById("outfit_photo_placeholder");
  const photoPromptElement = document.getElementById("outfit_photo_prompt");
  if (photoPromptElement) {
    photoPromptElement.value = preset.photoPrompt || "";
  }
  if (preset.photoImageId && (!preset.photoImageIds || preset.photoImageIds.length === 0)) {
    preset.photoImageIds = [preset.photoImageId];
    delete preset.photoImageId;
    saveSettingsDebounced();
  }
  const imageIds = preset.photoImageIds || [];
  let selectedIndex = preset.selectedPhotoIndex || 0;
  if (selectedIndex < 0 || selectedIndex >= imageIds.length) {
    selectedIndex = imageIds.length > 0 ? imageIds.length - 1 : 0;
  }
  if (imageIds.length > 0) {
    const selectedImageId = imageIds[selectedIndex];
    try {
      const imageData = await getConfigImage(selectedImageId);
      if (imageData && photoPreview && photoPlaceholder) {
        photoPreview.src = imageData;
        photoPreview.style.display = "block";
        photoPlaceholder.style.display = "none";
        photoPreview.style.cursor = "pointer";
        photoPreview.onclick = () => showOutfitImageViewer(imageIds, selectedIndex);
        return;
      }
    } catch (error) {
      console.error("[OutfitPreset] \u52A0\u8F7D\u670D\u88C5\u7167\u7247\u5931\u8D25:", error);
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

async function handleOutfitPhotoGenerate() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.outfitPresetId;
  const preset = settings3.outfitPresets[presetId];
  if (!preset) {
    toastr.warning("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u670D\u88C5\u9884\u8BBE");
    return;
  }
  const photoPromptElement = document.getElementById("outfit_photo_prompt");
  const prompt2 = photoPromptElement?.value?.trim() || "";
  if (!prompt2) {
    toastr.warning("\u8BF7\u5148\u8F93\u5165\u56FE\u7247\u751F\u6210\u63D0\u793A\u8BCD");
    return;
  }
  const requestId = `outfit_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  toastr.info("\u6B63\u5728\u751F\u6210\u670D\u88C5\u56FE\u7247...", "\u8BF7\u7A0D\u5019", { timeOut: 0, extendedTimeOut: 0 });
  const handleResponse = async (responseData) => {
    if (responseData.id !== requestId) {
      return;
    }
    const requestInfo = activeOutfitPhotoRequests.get(requestId);
    if (requestInfo) {
      eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, requestInfo.listener);
      activeOutfitPhotoRequests.delete(requestId);
    }
    toastr.clear();
    if (responseData.success && responseData.imageData) {
      try {
        const imageId = await saveConfigImage(responseData.imageData);
        if (!preset.photoImageIds) {
          preset.photoImageIds = [];
        }
        preset.photoImageIds.push(imageId);
        preset.selectedPhotoIndex = preset.photoImageIds.length - 1;
        saveSettingsDebounced();
        const photoPreview = document.getElementById("outfit_photo_preview");
        const photoPlaceholder = document.getElementById("outfit_photo_placeholder");
        if (photoPreview && photoPlaceholder) {
          photoPreview.src = responseData.imageData;
          photoPreview.style.display = "block";
          photoPlaceholder.style.display = "none";
          photoPreview.style.cursor = "pointer";
          photoPreview.onclick = () => showOutfitImageViewer(preset.photoImageIds, preset.photoImageIds.length - 1);
        }
        toastr.success("\u670D\u88C5\u56FE\u7247\u751F\u6210\u6210\u529F");
      } catch (error) {
        console.error("[OutfitPreset] \u4FDD\u5B58\u56FE\u7247\u5931\u8D25:", error);
        toastr.error("\u4FDD\u5B58\u56FE\u7247\u5931\u8D25: " + error.message);
      }
    } else {
      toastr.error("\u56FE\u7247\u751F\u6210\u5931\u8D25: " + (responseData.error || "\u672A\u77E5\u9519\u8BEF"));
    }
  };
  activeOutfitPhotoRequests.set(requestId, {
    listener: handleResponse,
    timestamp: Date.now()
  });
  eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, handleResponse);
  eventSource.emit(EventType.GENERATE_IMAGE_REQUEST, {
    id: requestId,
    prompt: prompt2
  });
}

function handleOutfitPhotoGeneratePrompt() {
  handleOutfitPhotoGeneratePromptClick();
}

async function handleOutfitPhotoUpload(event) {
  const input = event.target;
  if (!input.files || !input.files[0]) return;
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.outfitPresetId;
  const preset = settings3.outfitPresets[presetId];
  if (!preset) {
    toastr.warning("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u670D\u88C5\u9884\u8BBE");
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
      const imageId = await saveConfigImage(imageData);
      if (!preset.photoImageIds) {
        preset.photoImageIds = [];
      }
      preset.photoImageIds.push(imageId);
      preset.selectedPhotoIndex = preset.photoImageIds.length - 1;
      saveSettingsDebounced();
      const photoPreview = document.getElementById("outfit_photo_preview");
      const photoPlaceholder = document.getElementById("outfit_photo_placeholder");
      if (photoPreview && photoPlaceholder) {
        photoPreview.src = imageData;
        photoPreview.style.display = "block";
        photoPlaceholder.style.display = "none";
        photoPreview.style.cursor = "pointer";
        photoPreview.onclick = () => showOutfitImageViewer(preset.photoImageIds, preset.photoImageIds.length - 1);
      }
      toastr.success("\u670D\u88C5\u7167\u7247\u4E0A\u4F20\u6210\u529F");
    } catch (error) {
      console.error("[OutfitPreset] \u4E0A\u4F20\u7167\u7247\u5931\u8D25:", error);
      toastr.error("\u4E0A\u4F20\u7167\u7247\u5931\u8D25: " + error.message);
    }
  };
  reader.onerror = () => {
    toastr.error("\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25");
  };
  reader.readAsDataURL(file);
  input.value = "";
}

function readFileAsBase64ForPopup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function handleOutfitPhotoModifyPrompt() {
  const uploadedImages = [];
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-confirm-backdrop";
  const modal = document.createElement("div");
  modal.className = "st-chatu8-confirm-box st-chatu8-popup-modal";
  const title = document.createElement("h3");
  title.className = "st-chatu8-popup-title";
  title.textContent = "\u4FEE\u6539\u670D\u88C5\u63D0\u793A\u8BCD";
  modal.appendChild(title);
  const description = document.createElement("p");
  description.className = "st-chatu8-popup-description";
  description.textContent = "\u8BF7\u8F93\u5165\u60A8\u7684\u4FEE\u6539\u9700\u6C42\uFF0CAI \u5C06\u6839\u636E\u9700\u6C42\u8C03\u6574\u670D\u88C5\u63D0\u793A\u8BCD\uFF1A";
  modal.appendChild(description);
  const textarea = document.createElement("textarea");
  textarea.className = "st-chatu8-textarea";
  textarea.rows = 4;
  textarea.placeholder = "\u4F8B\u5982\uFF1A\u589E\u52A0\u66F4\u591A\u7EC6\u8282\u63CF\u8FF0\u3001\u8C03\u6574\u989C\u8272\u63CF\u8FF0\u3001\u6DFB\u52A0\u914D\u9970\u7EC6\u8282...";
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
        const base64 = await readFileAsBase64ForPopup(file);
        uploadedImages.push({
          base64,
          name: ""
        });
      } catch (err) {
        console.error("[outfitPreset] Failed to read image:", err);
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
    handleOutfitPromptModify(userRequirement, [...uploadedImages]);
  });
}

async function translateOutfitPhotoPrompt() {
  const element = document.getElementById("outfit_photo_prompt");
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
  toastr.info("\u6B63\u5728\u7FFB\u8BD1\u63D0\u793A\u8BCD...", "\u8BF7\u7A0D\u5019", { timeOut: 0, extendedTimeOut: 0 });
  try {
    const combinedText = uniqueTags.join(", ");
    const result = await translatePromptTags(combinedText);
    if (result && result.results) {
      const translationMap = {};
      for (const item of result.results) {
        if (item.original && item.translation) {
          translationMap[item.original.toLowerCase()] = `${item.original}\uFF08${item.translation}\uFF09`;
        } else if (item.original) {
          translationMap[item.original.toLowerCase()] = item.original;
        }
      }
      const translatedTags = tags.map((tag) => {
        return translationMap[tag.toLowerCase()] || tag;
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

async function showOutfitImageViewer(imageIds, initialIndex) {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.outfitPresetId;
  const preset = settings3.outfitPresets[presetId];
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
      console.error("[OutfitPreset] \u52A0\u8F7D\u56FE\u7247\u5931\u8D25:", error);
      img.src = "";
    }
  };
  const closeViewer = async () => {
    document.removeEventListener("keydown", handleKeyDown);
    if (preset) {
      preset.selectedPhotoIndex = currentIndex;
      saveSettingsDebounced();
      const photoPreview = document.getElementById("outfit_photo_preview");
      const photoPlaceholder = document.getElementById("outfit_photo_placeholder");
      if (imageIds.length > 0 && currentIndex >= 0 && currentIndex < imageIds.length) {
        try {
          const selectedImageId = imageIds[currentIndex];
          const imageData = imageCache[selectedImageId] || await getConfigImage(selectedImageId);
          if (imageData && photoPreview && photoPlaceholder) {
            photoPreview.src = imageData;
            photoPreview.style.display = "block";
            photoPlaceholder.style.display = "none";
            photoPreview.style.cursor = "pointer";
            photoPreview.onclick = () => showOutfitImageViewer(imageIds, currentIndex);
          }
        } catch (error) {
          console.error("[OutfitPreset] \u66F4\u65B0\u9884\u89C8\u56FE\u5931\u8D25:", error);
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
      const outfitName = preset?.nameCN || preset?.nameEN || presetId || "outfit";
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      link.download = `${outfitName}_${currentIndex + 1}_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastr.success("\u56FE\u7247\u4E0B\u8F7D\u6210\u529F");
    } catch (error) {
      console.error("[OutfitPreset] \u4E0B\u8F7D\u56FE\u7247\u5931\u8D25:", error);
      toastr.error("\u4E0B\u8F7D\u56FE\u7247\u5931\u8D25: " + error.message);
    }
  });
  deleteButton.addEventListener("click", async () => {
    const confirmed = await stylishConfirm("\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u5F20\u670D\u88C5\u56FE\u7247\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002");
    if (confirmed) {
      try {
        const imageIdToDelete = imageIds[currentIndex];
        if (imageIdToDelete) {
          await deleteConfigImage(imageIdToDelete);
        }
        if (preset && preset.photoImageIds) {
          const deleteIndex = preset.photoImageIds.indexOf(imageIdToDelete);
          if (deleteIndex > -1) {
            preset.photoImageIds.splice(deleteIndex, 1);
            saveSettingsDebounced();
          }
        }
        imageIds.splice(currentIndex, 1);
        if (imageIds.length > 0) {
          if (currentIndex >= imageIds.length) {
            currentIndex = imageIds.length - 1;
          }
          loadImage2(currentIndex);
          toastr.success("\u56FE\u7247\u5DF2\u5220\u9664");
        } else {
          closeViewer();
          toastr.success("\u56FE\u7247\u5DF2\u5220\u9664");
          const photoPreview = document.getElementById("outfit_photo_preview");
          const photoPlaceholder = document.getElementById("outfit_photo_placeholder");
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
        console.error("[OutfitPreset] \u5220\u9664\u56FE\u7247\u5931\u8D25:", error);
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
        if (preset && preset.photoImageIds) {
          preset.photoImageIds = [currentImageId];
          saveSettingsDebounced();
        }
        imageIds.length = 0;
        imageIds.push(currentImageId);
        currentIndex = 0;
        loadImage2(0);
        toastr.success(`\u5DF2\u5220\u9664 ${idsToDelete.length} \u5F20\u5176\u4ED6\u56FE\u7247`);
      } catch (error) {
        console.error("[OutfitPreset] \u5220\u9664\u5176\u4ED6\u56FE\u7247\u5931\u8D25:", error);
        toastr.error("\u5220\u9664\u5176\u4ED6\u56FE\u7247\u5931\u8D25: " + error.message);
      }
    }
  });
  await loadImage2(currentIndex);
}

export { loadOutfitPreset, loadOutfitPresetData, loadOutfitPresetList, setupOutfitControls };
