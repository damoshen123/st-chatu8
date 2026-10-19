// 还原自打包产物 — 原始模块: utils/settings/character/bananaCharacter.js
import { extension_settings } from "../../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../../script.js";
import { extensionName } from "../../config.js";
import { deleteConfigImage, getConfigImage, saveConfigImage } from "../../configDatabase.js";
import { stylInput, stylishConfirm } from "../../ui_common.js";

var setupBananaImageUpload, updateBananaImageUI;

setupBananaImageUpload = (role) => {
      const container = document.getElementById(`banana_char_${role}_image_container`);
      const img = document.getElementById(`banana_char_${role}_image`);
      const placeholder = container.querySelector(".st-chatu8-image-placeholder");
      const removeBtn = document.getElementById(`banana_char_${role}_image_remove`);
      const input = document.getElementById(`banana_char_${role}_image_input`);
      if (!container || !img || !placeholder || !removeBtn || !input) return;
      container.addEventListener("click", (event) => {
        if (event.target !== removeBtn && !removeBtn.contains(event.target)) {
          input.click();
        }
      });
      input.addEventListener("change", () => {
        if (input.files && input.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target.result;
            img.style.display = "block";
            placeholder.style.display = "none";
            removeBtn.style.display = "block";
          };
          reader.readAsDataURL(input.files[0]);
        }
      });
      removeBtn.addEventListener("click", () => {
        img.src = "";
        img.style.display = "none";
        placeholder.style.display = "block";
        removeBtn.style.display = "none";
        input.value = "";
      });
    };

updateBananaImageUI = (role, imageData) => {
      const img = document.getElementById(`banana_char_${role}_image`);
      const container = document.getElementById(`banana_char_${role}_image_container`);
      if (!img || !container) return;
      const placeholder = container.querySelector(".st-chatu8-image-placeholder");
      const removeBtn = document.getElementById(`banana_char_${role}_image_remove`);
      if (imageData) {
        img.src = imageData;
        img.style.display = "block";
        placeholder.style.display = "none";
        removeBtn.style.display = "block";
      } else {
        img.src = "";
        img.style.display = "none";
        placeholder.style.display = "block";
        removeBtn.style.display = "none";
      }
    };

function setupBananaCharacterControls(container) {
  loadBananaCharacterPresetList();
  container.find("#banana_char_preset_id").on("change", loadBananaCharacterPreset);
  container.find("#banana_char_new").on("click", createNewBananaCharacterPreset);
  container.find("#banana_char_rename").on("click", renameBananaCharacterPreset);
  container.find("#banana_char_update").on("click", updateBananaCharacterPreset);
  container.find("#banana_char_save_as").on("click", saveBananaCharacterPresetAs);
  container.find("#banana_char_delete").on("click", deleteBananaCharacterPreset);
  setupBananaImageUpload("user");
  setupBananaImageUpload("model");
  loadBananaCharacterPreset();
}

function loadBananaCharacterPresetList() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("banana_char_preset_id");
  if (!select) return;
  select.innerHTML = "";
  for (const presetName in settings3.bananaCharacterPresets) {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    select.add(option);
  }
  select.value = settings3.bananaCharacterPresetId;
}

async function loadBananaCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const select = document.getElementById("banana_char_preset_id");
  if (!select) return;
  const presetId = select.value;
  settings3.bananaCharacterPresetId = presetId;
  const preset = settings3.bananaCharacterPresets[presetId];
  if (!preset) return;
  let migrated = false;
  const conversation = preset.conversation || { user: { text: "" }, model: { text: "" } };
  if (conversation.user?.image && conversation.user.image.startsWith("data:image")) {
    const imageId = await saveConfigImage(conversation.user.image);
    conversation.user.imageId = imageId;
    delete conversation.user.image;
    migrated = true;
    console.log("[Character] \u8FC1\u79FB Banana \u7528\u6237\u56FE\u7247:", imageId);
  }
  if (conversation.model?.image && conversation.model.image.startsWith("data:image")) {
    const imageId = await saveConfigImage(conversation.model.image);
    conversation.model.imageId = imageId;
    delete conversation.model.image;
    migrated = true;
    console.log("[Character] \u8FC1\u79FB Banana \u6A21\u578B\u56FE\u7247:", imageId);
  }
  if (migrated) {
    saveSettingsDebounced();
  }
  document.getElementById("banana_char_triggers").value = preset.triggers || "";
  document.getElementById("banana_char_user_text").value = conversation.user?.text || "";
  document.getElementById("banana_char_model_text").value = conversation.model?.text || "";
  let userImage = "";
  let modelImage = "";
  if (conversation.user?.imageId && conversation.user.imageId.startsWith("cfgimg_")) {
    userImage = await getConfigImage(conversation.user.imageId) || "";
  }
  if (conversation.model?.imageId && conversation.model.imageId.startsWith("cfgimg_")) {
    modelImage = await getConfigImage(conversation.model.imageId) || "";
  }
  updateBananaImageUI("user", userImage);
  updateBananaImageUI("model", modelImage);
  saveSettingsDebounced();
}

function updateBananaCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = settings3.bananaCharacterPresetId;
  if (!presetId || !settings3.bananaCharacterPresets[presetId]) {
    alert('\u6CA1\u6709\u6D3B\u52A8\u7684 Banana \u89D2\u8272\u9884\u8BBE\u53EF\u4FDD\u5B58\u3002\u8BF7\u5148"\u53E6\u5B58\u4E3A"\u4E00\u4E2A\u65B0\u9884\u8BBE\u3002');
    return;
  }
  stylishConfirm(`\u786E\u5B9A\u8981\u8986\u76D6\u5F53\u524D Banana \u89D2\u8272\u9884\u8BBE "${presetId}" \u5417\uFF1F`).then((confirmed) => {
    if (confirmed) {
      saveCurrentBananaCharacterData(presetId);
      alert(`Banana \u89D2\u8272\u9884\u8BBE "${presetId}" \u5DF2\u66F4\u65B0\u3002`);
    }
  });
}

function saveBananaCharacterPresetAs() {
  stylInput("\u8BF7\u8F93\u5165\u65B0 Banana \u89D2\u8272\u9884\u8BBE\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      saveCurrentBananaCharacterData(result);
      settings3.bananaCharacterPresetId = result;
      loadBananaCharacterPresetList();
      alert(`Banana \u89D2\u8272\u9884\u8BBE "${result}" \u5DF2\u4FDD\u5B58\u3002`);
    }
  });
}

function createNewBananaCharacterPreset() {
  stylInput("\u8BF7\u8F93\u5165\u65B0 Banana \u89D2\u8272\u9884\u8BBE\u7684\u540D\u79F0").then((result) => {
    if (result && result.trim() !== "") {
      const settings3 = extension_settings[extensionName];
      if (settings3.bananaCharacterPresets[result]) {
        alert(`Banana \u89D2\u8272\u9884\u8BBE "${result}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002`);
        return;
      }
      settings3.bananaCharacterPresets[result] = {
        triggers: "",
        conversation: {
          user: { text: "", imageId: "" },
          model: { text: "", imageId: "" }
        }
      };
      settings3.bananaCharacterPresetId = result;
      saveSettingsDebounced();
      loadBananaCharacterPresetList();
      loadBananaCharacterPreset();
      toastr.success(`\u7A7A\u767D Banana \u89D2\u8272\u9884\u8BBE "${result}" \u5DF2\u521B\u5EFA\u3002`);
    }
  });
}

function renameBananaCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const currentName = settings3.bananaCharacterPresetId;
  if (!currentName || !settings3.bananaCharacterPresets[currentName]) {
    alert("\u6CA1\u6709\u6D3B\u52A8\u7684 Banana \u89D2\u8272\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4") {
    alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684 Banana \u89D2\u8272\u9884\u8BBE\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      if (settings3.bananaCharacterPresets[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002");
        return;
      }
      settings3.bananaCharacterPresets[newName] = settings3.bananaCharacterPresets[currentName];
      delete settings3.bananaCharacterPresets[currentName];
      settings3.bananaCharacterPresetId = newName;
      saveSettingsDebounced();
      loadBananaCharacterPresetList();
      try {
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } catch (error) {
        console.warn("Failed to refresh UI after renaming preset:", error);
      }
      toastr.success(`Banana \u89D2\u8272\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

async function saveCurrentBananaCharacterData(presetId) {
  const settings3 = extension_settings[extensionName];
  const existingPreset = settings3.bananaCharacterPresets[presetId];
  const userImgSrc = document.getElementById("banana_char_user_image").src;
  const modelImgSrc = document.getElementById("banana_char_model_image").src;
  const existingUserImageId = existingPreset?.conversation?.user?.imageId || "";
  const existingModelImageId = existingPreset?.conversation?.model?.imageId || "";
  let userImageId = "";
  let modelImageId = "";
  if (userImgSrc.startsWith("data:image")) {
    if (existingUserImageId && existingUserImageId.startsWith("cfgimg_")) {
      await deleteConfigImage(existingUserImageId).catch((err) => console.warn("[Character] \u5220\u9664\u65E7\u7528\u6237\u56FE\u7247\u5931\u8D25:", err));
    }
    userImageId = await saveConfigImage(userImgSrc);
    console.log("[Character] Banana \u7528\u6237\u56FE\u7247\u5DF2\u4FDD\u5B58:", userImageId);
  }
  if (modelImgSrc.startsWith("data:image")) {
    if (existingModelImageId && existingModelImageId.startsWith("cfgimg_")) {
      await deleteConfigImage(existingModelImageId).catch((err) => console.warn("[Character] \u5220\u9664\u65E7\u6A21\u578B\u56FE\u7247\u5931\u8D25:", err));
    }
    modelImageId = await saveConfigImage(modelImgSrc);
    console.log("[Character] Banana \u6A21\u578B\u56FE\u7247\u5DF2\u4FDD\u5B58:", modelImageId);
  }
  const preset = {
    triggers: document.getElementById("banana_char_triggers").value,
    conversation: {
      user: {
        text: document.getElementById("banana_char_user_text").value,
        imageId: userImageId
      },
      model: {
        text: document.getElementById("banana_char_model_text").value,
        imageId: modelImageId
      }
    }
  };
  settings3.bananaCharacterPresets[presetId] = preset;
  saveSettingsDebounced();
}

async function deleteBananaCharacterPreset() {
  const settings3 = extension_settings[extensionName];
  const presetId = document.getElementById("banana_char_preset_id")?.value;
  if (Object.keys(settings3.bananaCharacterPresets).length <= 1) {
    alert("\u4E0D\u80FD\u5220\u9664\u6700\u540E\u4E00\u4E2A\u9884\u8BBE\u3002");
    return;
  }
  const confirmed = await stylishConfirm(`\u662F\u5426\u786E\u5B9A\u5220\u9664\u8BE5 Banana \u89D2\u8272\u9884\u8BBE "${presetId}"`);
  if (confirmed) {
    const preset = settings3.bananaCharacterPresets[presetId];
    if (preset?.conversation?.user?.imageId && preset.conversation.user.imageId.startsWith("cfgimg_")) {
      await deleteConfigImage(preset.conversation.user.imageId).catch((err) => console.warn("[Character] \u5220\u9664\u7528\u6237\u56FE\u7247\u5931\u8D25:", err));
    }
    if (preset?.conversation?.model?.imageId && preset.conversation.model.imageId.startsWith("cfgimg_")) {
      await deleteConfigImage(preset.conversation.model.imageId).catch((err) => console.warn("[Character] \u5220\u9664\u6A21\u578B\u56FE\u7247\u5931\u8D25:", err));
    }
    delete settings3.bananaCharacterPresets[presetId];
    settings3.bananaCharacterPresetId = Object.keys(settings3.bananaCharacterPresets)[0];
    loadBananaCharacterPresetList();
    await loadBananaCharacterPreset();
    saveSettingsDebounced();
  }
}

export { loadBananaCharacterPreset, loadBananaCharacterPresetList, setupBananaCharacterControls };
