// 还原自打包产物 — 原始模块: utils/settings/bananaui.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { getRequestHeaders } from "../utils.js";
import { deleteConfigImage, getConfigImage, saveConfigImage } from "../configDatabase.js";
import { stylInput, stylishConfirm } from "../ui_common.js";
import { isBase64Image, isImageId, setupImageUpload, updateImageUI } from "./runninghubui.js";

async function getImageData(turn, role) {
  const data = turn?.[role];
  if (!data) return "";
  if (data.imageId && isImageId(data.imageId)) {
    const imageData = await getConfigImage(data.imageId);
    return imageData || "";
  }
  if (data.image && isBase64Image(data.image)) {
    return data.image;
  }
  return "";
}

async function saveImageAndGetId(imgSrc, existingId = "") {
  if (isBase64Image(imgSrc)) {
    if (existingId && isImageId(existingId)) {
      await deleteConfigImage(existingId).catch((err) => console.warn("[BananaUI] \u5220\u9664\u65E7\u56FE\u7247\u5931\u8D25:", err));
    }
    const newId = await saveConfigImage(imgSrc);
    console.log("[BananaUI] \u56FE\u7247\u5DF2\u4FDD\u5B58\u5230\u6570\u636E\u5E93:", newId);
    return newId;
  }
  return "";
}

async function deletePresetImages(preset) {
  if (!preset?.conversation) return;
  for (const turn of preset.conversation) {
    if (turn?.user?.imageId && isImageId(turn.user.imageId)) {
      await deleteConfigImage(turn.user.imageId).catch((err) => console.warn("[BananaUI] \u5220\u9664\u56FE\u7247\u5931\u8D25:", err));
    }
    if (turn?.model?.imageId && isImageId(turn.model.imageId)) {
      await deleteConfigImage(turn.model.imageId).catch((err) => console.warn("[BananaUI] \u5220\u9664\u56FE\u7247\u5931\u8D25:", err));
    }
  }
}

async function migratePresetIfNeeded(preset) {
  if (!preset?.conversation) return false;
  let migrated = false;
  for (const turn of preset.conversation) {
    if (turn?.user?.image && isBase64Image(turn.user.image)) {
      const imageId = await saveConfigImage(turn.user.image);
      turn.user.imageId = imageId;
      delete turn.user.image;
      migrated = true;
      console.log("[BananaUI] \u8FC1\u79FB\u7528\u6237\u56FE\u7247:", imageId);
    }
    if (turn?.model?.image && isBase64Image(turn.model.image)) {
      const imageId = await saveConfigImage(turn.model.image);
      turn.model.imageId = imageId;
      delete turn.model.image;
      migrated = true;
      console.log("[BananaUI] \u8FC1\u79FB\u6A21\u578B\u56FE\u7247:", imageId);
    }
  }
  return migrated;
}

function initBananaUI(settingsModal) {
  const getBananaSettings = () => extension_settings[extensionName].banana;
  const presetSelect = document.getElementById("st-chatu8-banana-conversation-preset-id");
  const saveButton = document.getElementById("st-chatu8-banana-conversation-save");
  const saveAsButton = document.getElementById("st-chatu8-banana-conversation-save-as");
  const newButton = document.getElementById("st-chatu8-banana-conversation-new");
  const renameButton = document.getElementById("st-chatu8-banana-conversation-rename");
  const deleteButton = document.getElementById("st-chatu8-banana-conversation-delete");
  const importButton = document.getElementById("st-chatu8-banana-conversation-import");
  const exportButton = document.getElementById("st-chatu8-banana-conversation-export");
  const fixedPromptInput = document.getElementById("st-chatu8-banana-fixed-prompt");
  const postfixPromptInput = document.getElementById("st-chatu8-banana-postfix-prompt");
  const modelSelect2 = document.getElementById("st-chatu8-banana-model-select");
  const editModelSelect = document.getElementById("st-chatu8-banana-edit-model-select");
  const multimodalSection = document.getElementById("st-chatu8-banana-multimodal-section");
  const apiUrlInput2 = document.getElementById("st-chatu8-banana-api-url");
  const apiKeyInput2 = document.getElementById("st-chatu8-banana-api-key");
  const aspectRatioSelect = document.getElementById("st-chatu8-banana-aspect-ratio");
  const imageSizeSelect = document.getElementById("st-chatu8-banana-image-size-select");
  const imageSizeInput = document.getElementById("st-chatu8-banana-image-size-input");
  const useGrokFormatCheckbox = document.getElementById("st-chatu8-banana-use-grok-format");
  const grokOptionsContainer = document.getElementById("st-chatu8-banana-grok-options");
  const grokRefImageParamSelect = document.getElementById("st-chatu8-banana-grok-ref-image-param");
  const grokEditsFormatSelect = document.getElementById("st-chatu8-banana-grok-edits-format");
  const grokResponseFormatSelect = document.getElementById("st-chatu8-banana-grok-response-format");
  const grokGenerationsEndpointInput = document.getElementById("st-chatu8-banana-grok-generations-endpoint");
  const grokEditsEndpointInput = document.getElementById("st-chatu8-banana-grok-edits-endpoint");
  const editPresetSelect = document.getElementById("st-chatu8-banana-edit-preset");
  const videoModelSelect = document.getElementById("st-chatu8-banana-video-model-select");
  const videoPresetSelect = document.getElementById("st-chatu8-banana-video-preset");
  const updateGrokOptionsVisibility = () => {
    const isGrok = useGrokFormatCheckbox && useGrokFormatCheckbox.checked;
    if (grokOptionsContainer) {
      grokOptionsContainer.style.display = isGrok ? "block" : "none";
    }
  };
  const populateEditPresetDropdown = () => {
    const bananaSettings2 = getBananaSettings();
    const presets = bananaSettings2.conversationPresets || {};
    const presetNames = Object.keys(presets);
    const currentEditPresetId = bananaSettings2.editPresetId || "\u9ED8\u8BA4";
    if (!editPresetSelect) return;
    editPresetSelect.innerHTML = "";
    presetNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      if (name === currentEditPresetId) {
        option.selected = true;
      }
      editPresetSelect.appendChild(option);
    });
  };
  const populateVideoPresetDropdown = () => {
    const bananaSettings2 = getBananaSettings();
    const presets = bananaSettings2.conversationPresets || {};
    const presetNames = Object.keys(presets);
    const currentVideoPresetId = bananaSettings2.videoPresetId || "\u9ED8\u8BA4";
    if (!videoPresetSelect) return;
    videoPresetSelect.innerHTML = "";
    presetNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      if (name === currentVideoPresetId) {
        option.selected = true;
      }
      videoPresetSelect.appendChild(option);
    });
  };
  const populateDropdown = () => {
    const bananaSettings2 = getBananaSettings();
    const presets = bananaSettings2.conversationPresets || {};
    const presetNames = Object.keys(presets);
    const currentPresetId = bananaSettings2.conversationPresetId;
    presetSelect.innerHTML = "";
    presetNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      if (name === currentPresetId) {
        option.selected = true;
      }
      presetSelect.appendChild(option);
    });
  };
  const loadPreset = async (presetId) => {
    const bananaSettings2 = getBananaSettings();
    const preset = bananaSettings2.conversationPresets[presetId];
    if (!preset) return;
    const migrated = await migratePresetIfNeeded(preset);
    if (migrated) {
      saveSettingsDebounced();
      console.log("[BananaUI] \u9884\u8BBE\u5DF2\u8FC1\u79FB\u5230\u65B0\u683C\u5F0F");
    }
    fixedPromptInput.value = preset.fixedPrompt || "";
    postfixPromptInput.value = preset.postfixPrompt || "";
    for (let i = 0; i < 3; i++) {
      const userTextEl = document.getElementById(`st-chatu8-banana-user-text-${i + 1}`);
      const modelTextEl = document.getElementById(`st-chatu8-banana-model-text-${i + 1}`);
      const turn = preset.conversation?.[i] || { user: { text: "" }, model: { text: "" } };
      if (userTextEl) userTextEl.value = turn.user?.text || "";
      if (modelTextEl) modelTextEl.value = turn.model?.text || "";
      const userImage = await getImageData(turn, "user");
      const modelImage = await getImageData(turn, "model");
      updateImageUI("user", i, userImage);
      updateImageUI("model", i, modelImage);
    }
    bananaSettings2.conversationPresetId = presetId;
  };
  const updateVisibility = () => {
    if (modelSelect2 && multimodalSection) {
      const selectedModel = modelSelect2.value;
      const isImagen = selectedModel.startsWith("imagen");
      multimodalSection.style.display = "block";
      const titleElement = multimodalSection.querySelector("h3");
      const conversationGroups = multimodalSection.querySelectorAll(".st-chatu8-banana-conversation-group");
      const presetLabel = document.querySelector('label[for="st-chatu8-banana-conversation-preset-id"]');
      if (isImagen) {
        if (titleElement) titleElement.textContent = "\u63D0\u793A\u8BCD\u9884\u8BBE (Imagen)";
        if (presetLabel) presetLabel.textContent = "\u63D0\u793A\u8BCD\u9884\u8BBE";
        conversationGroups.forEach((group) => group.style.display = "none");
      } else {
        if (titleElement) titleElement.textContent = "\u591A\u8F6E\u5BF9\u8BDD (\u591A\u6A21\u6001)";
        if (presetLabel) presetLabel.textContent = "\u5BF9\u8BDD\u9884\u8BBE";
        conversationGroups.forEach((group) => group.style.display = "block");
      }
    }
  };
  presetSelect.addEventListener("change", async () => {
    await loadPreset(presetSelect.value);
    toastr.success(`\u5DF2\u52A0\u8F7D\u9884\u8BBE: "${presetSelect.value}"`);
  });
  saveButton.addEventListener("click", async () => {
    const bananaSettings2 = getBananaSettings();
    const presetId = bananaSettings2.conversationPresetId;
    const existingPreset = bananaSettings2.conversationPresets[presetId];
    const conversation = [];
    for (let i = 0; i < 3; i++) {
      const userImgSrc = document.getElementById(`st-chatu8-banana-user-image-${i + 1}`).src;
      const modelImgSrc = document.getElementById(`st-chatu8-banana-model-image-${i + 1}`).src;
      const existingTurn = existingPreset?.conversation?.[i];
      const existingUserImageId = existingTurn?.user?.imageId || "";
      const existingModelImageId = existingTurn?.model?.imageId || "";
      const userImageId = await saveImageAndGetId(userImgSrc, existingUserImageId);
      const modelImageId = await saveImageAndGetId(modelImgSrc, existingModelImageId);
      conversation.push({
        user: {
          text: document.getElementById(`st-chatu8-banana-user-text-${i + 1}`).value,
          imageId: userImageId
        },
        model: {
          text: document.getElementById(`st-chatu8-banana-model-text-${i + 1}`).value,
          imageId: modelImageId
        }
      });
    }
    bananaSettings2.conversationPresets[presetId] = {
      fixedPrompt: fixedPromptInput.value,
      postfixPrompt: postfixPromptInput.value,
      conversation
    };
    saveSettingsDebounced();
    toastr.success(`\u9884\u8BBE "${presetId}" \u5DF2\u4FDD\u5B58!`);
  });
  saveAsButton.addEventListener("click", async () => {
    const newPresetName = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u9884\u8BBE\u540D\u79F0:");
    if (!newPresetName || newPresetName.trim() === "") {
      toastr.info("\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002");
      return;
    }
    const bananaSettings2 = getBananaSettings();
    if (bananaSettings2.conversationPresets[newPresetName]) {
      const overwrite = await stylishConfirm(`\u9884\u8BBE "${newPresetName}" \u5DF2\u5B58\u5728\u3002\u8981\u8986\u76D6\u5B83\u5417?`);
      if (!overwrite) {
        toastr.info("\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002");
        return;
      }
      await deletePresetImages(bananaSettings2.conversationPresets[newPresetName]);
    }
    const conversation = [];
    for (let i = 0; i < 3; i++) {
      const userImgSrc = document.getElementById(`st-chatu8-banana-user-image-${i + 1}`).src;
      const modelImgSrc = document.getElementById(`st-chatu8-banana-model-image-${i + 1}`).src;
      const userImageId = await saveImageAndGetId(userImgSrc);
      const modelImageId = await saveImageAndGetId(modelImgSrc);
      conversation.push({
        user: {
          text: document.getElementById(`st-chatu8-banana-user-text-${i + 1}`).value,
          imageId: userImageId
        },
        model: {
          text: document.getElementById(`st-chatu8-banana-model-text-${i + 1}`).value,
          imageId: modelImageId
        }
      });
    }
    bananaSettings2.conversationPresets[newPresetName] = {
      fixedPrompt: fixedPromptInput.value,
      postfixPrompt: postfixPromptInput.value,
      conversation
    };
    bananaSettings2.conversationPresetId = newPresetName;
    populateDropdown();
    populateEditPresetDropdown();
    populateVideoPresetDropdown();
    saveSettingsDebounced();
    toastr.success(`\u65B0\u9884\u8BBE "${newPresetName}" \u5DF2\u521B\u5EFA\u5E76\u52A0\u8F7D!`);
  });
  newButton.addEventListener("click", async () => {
    const newPresetName = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u9884\u8BBE\u540D\u79F0:");
    if (!newPresetName || newPresetName.trim() === "") return;
    const bananaSettings2 = getBananaSettings();
    if (bananaSettings2.conversationPresets[newPresetName]) {
      toastr.error(`\u9884\u8BBE "${newPresetName}" \u5DF2\u5B58\u5728\u3002`);
      return;
    }
    bananaSettings2.conversationPresets[newPresetName] = {
      fixedPrompt: "",
      postfixPrompt: "",
      conversation: []
    };
    bananaSettings2.conversationPresetId = newPresetName;
    populateDropdown();
    populateEditPresetDropdown();
    populateVideoPresetDropdown();
    await loadPreset(newPresetName);
    saveSettingsDebounced();
    toastr.success(`\u7A7A\u9884\u8BBE "${newPresetName}" \u5DF2\u521B\u5EFA!`);
  });
  renameButton.addEventListener("click", async () => {
    const bananaSettings2 = getBananaSettings();
    const currentName = bananaSettings2.conversationPresetId;
    if (!currentName || !bananaSettings2.conversationPresets[currentName]) {
      toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684\u9884\u8BBE\u53EF\u91CD\u547D\u540D\u3002");
      return;
    }
    if (currentName === "\u9ED8\u8BA4" || currentName === "default") {
      toastr.warning("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
      return;
    }
    const result = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u9884\u8BBE\u540D\u79F0:", currentName);
    if (!result || !result.trim() || result.trim() === currentName) return;
    const newName = result.trim();
    if (bananaSettings2.conversationPresets[newName]) {
      toastr.error(`\u9884\u8BBE "${newName}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002`);
      return;
    }
    bananaSettings2.conversationPresets[newName] = bananaSettings2.conversationPresets[currentName];
    delete bananaSettings2.conversationPresets[currentName];
    bananaSettings2.conversationPresetId = newName;
    populateDropdown();
    populateEditPresetDropdown();
    populateVideoPresetDropdown();
    saveSettingsDebounced();
    toastr.success(`\u9884\u8BBE\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
  });
  deleteButton.addEventListener("click", async () => {
    const bananaSettings2 = getBananaSettings();
    const presetId = bananaSettings2.conversationPresetId;
    if (Object.keys(bananaSettings2.conversationPresets).length <= 1) {
      toastr.warning("\u4E0D\u80FD\u5220\u9664\u6700\u540E\u4E00\u4E2A\u9884\u8BBE\u3002");
      return;
    }
    const confirmDelete = await stylishConfirm(`\u786E\u5B9A\u8981\u5220\u9664\u9884\u8BBE "${presetId}" \u5417? \u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`);
    if (!confirmDelete) {
      toastr.info("\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002");
      return;
    }
    await deletePresetImages(bananaSettings2.conversationPresets[presetId]);
    delete bananaSettings2.conversationPresets[presetId];
    const newPresetId = Object.keys(bananaSettings2.conversationPresets)[0];
    bananaSettings2.conversationPresetId = newPresetId;
    populateDropdown();
    populateEditPresetDropdown();
    populateVideoPresetDropdown();
    await loadPreset(newPresetId);
    saveSettingsDebounced();
    toastr.success(`\u9884\u8BBE "${presetId}" \u5DF2\u5220\u9664\u3002`);
  });
  exportButton.addEventListener("click", async () => {
    const bananaSettings2 = getBananaSettings();
    const presetId = bananaSettings2.conversationPresetId;
    if (!presetId) {
      toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u9884\u8BBE\u53EF\u4F9B\u5BFC\u51FA\u3002");
      return;
    }
    const preset = bananaSettings2.conversationPresets[presetId];
    if (!preset) {
      toastr.error(`\u627E\u4E0D\u5230\u9884\u8BBE "${presetId}" \u7684\u6570\u636E\u3002`);
      return;
    }
    const exportData = {
      fixedPrompt: preset.fixedPrompt,
      postfixPrompt: preset.postfixPrompt,
      conversation: []
    };
    for (const turn of preset.conversation || []) {
      const userImage = await getImageData(turn, "user");
      const modelImage = await getImageData(turn, "model");
      exportData.conversation.push({
        user: {
          text: turn?.user?.text || "",
          image: userImage
        },
        model: {
          text: turn?.model?.text || "",
          image: modelImage
        }
      });
    }
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presetId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastr.success(`\u9884\u8BBE "${presetId}" \u5DF2\u5BFC\u51FA\u3002`);
  });
  importButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const presetData = JSON.parse(e.target.result);
          if (typeof presetData.fixedPrompt === "undefined" || typeof presetData.conversation === "undefined") {
            toastr.error("\u5BFC\u5165\u5931\u8D25\uFF1A\u6587\u4EF6\u683C\u5F0F\u4E0D\u6B63\u786E\u3002");
            return;
          }
          let presetName = file.name.replace(/\.json$/, "");
          const bananaSettings2 = getBananaSettings();
          if (bananaSettings2.conversationPresets[presetName]) {
            const overwrite = await stylishConfirm(`\u9884\u8BBE "${presetName}" \u5DF2\u5B58\u5728\u3002\u8981\u8986\u76D6\u5B83\u5417?`);
            if (!overwrite) {
              presetName = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u9884\u8BBE\u540D\u79F0:", presetName + "_imported");
              if (!presetName || presetName.trim() === "") {
                toastr.info("\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002");
                return;
              }
            } else {
              await deletePresetImages(bananaSettings2.conversationPresets[presetName]);
            }
          }
          const importedPreset = {
            fixedPrompt: presetData.fixedPrompt,
            postfixPrompt: presetData.postfixPrompt,
            conversation: []
          };
          for (const turn of presetData.conversation || []) {
            const userImageId = await saveImageAndGetId(turn?.user?.image || "");
            const modelImageId = await saveImageAndGetId(turn?.model?.image || "");
            importedPreset.conversation.push({
              user: {
                text: turn?.user?.text || "",
                imageId: userImageId
              },
              model: {
                text: turn?.model?.text || "",
                imageId: modelImageId
              }
            });
          }
          bananaSettings2.conversationPresets[presetName] = importedPreset;
          bananaSettings2.conversationPresetId = presetName;
          populateDropdown();
          populateEditPresetDropdown();
          populateVideoPresetDropdown();
          await loadPreset(presetName);
          saveSettingsDebounced();
          toastr.success(`\u9884\u8BBE "${presetName}" \u5DF2\u6210\u529F\u5BFC\u5165\u5E76\u52A0\u8F7D\uFF01`);
        } catch (error) {
          toastr.error(`\u5BFC\u5165\u5931\u8D25: ${error.message}`);
          console.error("Error importing preset:", error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
  let bananaApiAutoSaveTimer = null;
  const triggerBananaApiAutoSave = () => {
    if (bananaApiAutoSaveTimer) clearTimeout(bananaApiAutoSaveTimer);
    bananaApiAutoSaveTimer = setTimeout(() => {
      saveSettingsDebounced();
    }, 1e3);
  };
  apiUrlInput2.addEventListener("input", () => {
    getBananaSettings().apiUrl = (apiUrlInput2.value || "").trim();
    triggerBananaApiAutoSave();
  });
  apiKeyInput2.addEventListener("input", () => {
    getBananaSettings().apiKey = (apiKeyInput2.value || "").trim();
    triggerBananaApiAutoSave();
  });
  const apiKeyToggle = document.getElementById("st-chatu8-banana-api-key-toggle");
  if (apiKeyToggle) {
    apiKeyToggle.addEventListener("click", () => {
      const icon = apiKeyToggle.querySelector("i");
      if (apiKeyInput2.type === "password") {
        apiKeyInput2.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        apiKeyInput2.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  }
  modelSelect2.addEventListener("change", () => {
    getBananaSettings().model = modelSelect2.value;
    saveSettingsDebounced();
    updateVisibility();
  });
  if (editModelSelect) {
    editModelSelect.addEventListener("change", () => {
      getBananaSettings().editModel = editModelSelect.value;
      saveSettingsDebounced();
    });
  }
  if (videoModelSelect) {
    videoModelSelect.addEventListener("change", () => {
      getBananaSettings().videoModel = videoModelSelect.value;
      saveSettingsDebounced();
    });
  }
  aspectRatioSelect.addEventListener("change", () => {
    getBananaSettings().aspectRatio = aspectRatioSelect.value;
    saveSettingsDebounced();
  });
  if (imageSizeSelect && imageSizeInput) {
    imageSizeSelect.addEventListener("change", () => {
      if (imageSizeSelect.value === "__custom__") {
        imageSizeInput.focus();
        return;
      }
      imageSizeInput.value = imageSizeSelect.value;
      getBananaSettings().imageSize = imageSizeSelect.value;
      saveSettingsDebounced();
    });
    imageSizeInput.addEventListener("input", () => {
      const val = imageSizeInput.value.trim();
      getBananaSettings().imageSize = val;
      const matched = Array.from(imageSizeSelect.options).some((opt) => opt.value === val);
      imageSizeSelect.value = matched ? val : "__custom__";
      saveSettingsDebounced();
    });
  }
  if (useGrokFormatCheckbox) {
    useGrokFormatCheckbox.addEventListener("change", () => {
      getBananaSettings().useGrokFormat = useGrokFormatCheckbox.checked ? "true" : "false";
      updateGrokOptionsVisibility();
      saveSettingsDebounced();
    });
  }
  if (grokRefImageParamSelect) {
    grokRefImageParamSelect.addEventListener("change", () => {
      getBananaSettings().grokRefImageParam = grokRefImageParamSelect.value;
      saveSettingsDebounced();
    });
  }
  if (grokEditsFormatSelect) {
    grokEditsFormatSelect.addEventListener("change", () => {
      getBananaSettings().grokEditsFormat = grokEditsFormatSelect.value;
      saveSettingsDebounced();
    });
  }
  if (grokResponseFormatSelect) {
    grokResponseFormatSelect.addEventListener("change", () => {
      getBananaSettings().grokResponseFormat = grokResponseFormatSelect.value;
      saveSettingsDebounced();
    });
  }
  if (grokGenerationsEndpointInput) {
    grokGenerationsEndpointInput.addEventListener("input", () => {
      getBananaSettings().grokGenerationsEndpoint = grokGenerationsEndpointInput.value.trim();
      saveSettingsDebounced();
    });
  }
  if (grokEditsEndpointInput) {
    grokEditsEndpointInput.addEventListener("input", () => {
      getBananaSettings().grokEditsEndpoint = grokEditsEndpointInput.value.trim();
      saveSettingsDebounced();
    });
  }
  if (editPresetSelect) {
    editPresetSelect.addEventListener("change", () => {
      getBananaSettings().editPresetId = editPresetSelect.value;
      saveSettingsDebounced();
      toastr.success(`\u4FEE\u56FE\u9884\u8BBE\u5DF2\u8BBE\u7F6E\u4E3A: "${editPresetSelect.value}"`);
    });
  }
  if (videoPresetSelect) {
    videoPresetSelect.addEventListener("change", () => {
      getBananaSettings().videoPresetId = videoPresetSelect.value;
      saveSettingsDebounced();
      toastr.success(`\u89C6\u9891\u9884\u8BBE\u5DF2\u8BBE\u7F6E\u4E3A: "${videoPresetSelect.value}"`);
    });
  }
  const fetchModelsButton2 = document.getElementById("st-chatu8-banana-fetch-models");
  if (fetchModelsButton2) {
    fetchModelsButton2.addEventListener("click", async () => {
      const bananaSettings2 = getBananaSettings();
      const apiUrl = (bananaSettings2.apiUrl || "").trim();
      const apiKey = (bananaSettings2.apiKey || "").trim();
      if (!apiUrl) {
        toastr.warning("\u8BF7\u5148\u586B\u5199 API \u8FDE\u63A5\u5730\u5740");
        return;
      }
      try {
        fetchModelsButton2.disabled = true;
        fetchModelsButton2.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        let baseUrl = apiUrl.replace(/\/$/, "");
        let directModelsUrl = baseUrl + "/models";
        const client = extension_settings[extensionName].client;
        let response;
        if (client === "jiuguan") {
          let proxyBaseUrl = baseUrl;
          response = await fetch("/api/backends/chat-completions/status", {
            method: "POST",
            headers: getRequestHeaders(window.token),
            body: JSON.stringify({
              chat_completion_source: "custom",
              custom_url: proxyBaseUrl,
              custom_include_headers: `Authorization: "Bearer ${apiKey || ""}"`
            })
          });
          console.log("[BananaUI] \u4F7F\u7528\u9152\u9986\u4EE3\u7406\u83B7\u53D6\u6A21\u578B\u5217\u8868, URL:", proxyBaseUrl);
        } else {
          response = await fetch(directModelsUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey || ""}`
            }
          });
          console.log("[BananaUI] \u76F4\u63A5\u8BF7\u6C42\u83B7\u53D6\u6A21\u578B\u5217\u8868");
        }
        if (!response.ok) {
          throw new Error(`\u83B7\u53D6\u6A21\u578B\u5931\u8D25: ${response.status}`);
        }
        const result = await response.json();
        console.log("[BananaUI] \u83B7\u53D6\u5230\u7684\u6A21\u578B\u54CD\u5E94:", result);
        if (result.error) {
          if (result.error === true) {
            throw new Error("\u9152\u9986\u540E\u7AEF\u4EE3\u7406\u8FDE\u63A5\u5931\u8D25\uFF1AAPI Key \u9519\u8BEF/\u65E0\u6548\uFF0C\u6216 API \u5730\u5740\u65E0\u6CD5\u8FDE\u63A5 (401/404)");
          }
          throw new Error(result.error.message || JSON.stringify(result.error));
        }
        let models = [];
        if (Array.isArray(result.data)) {
          models = result.data;
        } else if (Array.isArray(result.models)) {
          models = result.models;
        } else if (Array.isArray(result)) {
          models = result;
        }
        models = models.map((model) => {
          if (typeof model === "string") {
            return { id: model };
          }
          return { id: model.id || model.name || model.model || String(model) };
        }).filter((m) => m.id);
        console.log("[BananaUI] \u89E3\u6790\u540E\u7684\u6A21\u578B\u5217\u8868:", models);
        if (models.length === 0) {
          toastr.info("\u6CA1\u6709\u83B7\u53D6\u5230\u53EF\u7528\u6A21\u578B");
          return;
        }
        const currentModel = modelSelect2.value;
        const currentEditModel = editModelSelect ? editModelSelect.value : "";
        const currentVideoModel = videoModelSelect ? videoModelSelect.value : "";
        models.sort((a, b) => a.id.localeCompare(b.id));
        modelSelect2.innerHTML = "";
        models.forEach((model) => {
          const option = document.createElement("option");
          option.value = model.id;
          option.textContent = model.id;
          modelSelect2.appendChild(option);
        });
        if (editModelSelect) {
          editModelSelect.innerHTML = "";
          models.forEach((model) => {
            const option = document.createElement("option");
            option.value = model.id;
            option.textContent = model.id;
            editModelSelect.appendChild(option);
          });
        }
        if (videoModelSelect) {
          videoModelSelect.innerHTML = "";
          models.forEach((model) => {
            const option = document.createElement("option");
            option.value = model.id;
            option.textContent = model.id;
            videoModelSelect.appendChild(option);
          });
        }
        if (models.some((m) => m.id === currentModel)) {
          modelSelect2.value = currentModel;
        } else {
          modelSelect2.value = models[0].id;
          getBananaSettings().model = models[0].id;
          saveSettingsDebounced();
        }
        if (editModelSelect) {
          if (models.some((m) => m.id === currentEditModel)) {
            editModelSelect.value = currentEditModel;
          } else {
            editModelSelect.value = models[0].id;
            getBananaSettings().editModel = models[0].id;
            saveSettingsDebounced();
          }
        }
        if (videoModelSelect) {
          if (models.some((m) => m.id === currentVideoModel)) {
            videoModelSelect.value = currentVideoModel;
          } else {
            videoModelSelect.value = models[0].id;
            getBananaSettings().videoModel = models[0].id;
            saveSettingsDebounced();
          }
        }
        toastr.success(`\u6210\u529F\u83B7\u53D6 ${models.length} \u4E2A\u6A21\u578B`);
        updateVisibility();
      } catch (error) {
        console.error("[BananaUI] \u83B7\u53D6\u6A21\u578B\u5931\u8D25:", error);
        toastr.error(`\u83B7\u53D6\u6A21\u578B\u5931\u8D25: ${error.message}`);
      } finally {
        fetchModelsButton2.disabled = false;
        fetchModelsButton2.innerHTML = '<i class="fa-solid fa-rotate"></i>';
      }
    });
  }
  for (let i = 0; i < 3; i++) {
    setupImageUpload("user", i);
    setupImageUpload("model", i);
  }
  const bananaSettings = getBananaSettings();
  apiUrlInput2.value = bananaSettings.apiUrl || "";
  apiKeyInput2.value = bananaSettings.apiKey || "";
  const savedModel = bananaSettings.model || "";
  if (savedModel) {
    const existingOption = Array.from(modelSelect2.options).find((opt) => opt.value === savedModel);
    if (!existingOption) {
      const newOption = document.createElement("option");
      newOption.value = savedModel;
      newOption.textContent = savedModel;
      modelSelect2.appendChild(newOption);
    }
    modelSelect2.value = savedModel;
  }
  const savedEditModel = bananaSettings.editModel || "";
  if (editModelSelect && savedEditModel) {
    const existingEditOption = Array.from(editModelSelect.options).find((opt) => opt.value === savedEditModel);
    if (!existingEditOption) {
      const newEditOption = document.createElement("option");
      newEditOption.value = savedEditModel;
      newEditOption.textContent = savedEditModel;
      editModelSelect.appendChild(newEditOption);
    }
    editModelSelect.value = savedEditModel;
  }
  aspectRatioSelect.value = bananaSettings.aspectRatio || "1:1";
  if (imageSizeSelect && imageSizeInput) {
    const savedSize = bananaSettings.imageSize || "1024x1024";
    imageSizeInput.value = savedSize;
    const matchedSize = Array.from(imageSizeSelect.options).some((opt) => opt.value === savedSize);
    imageSizeSelect.value = matchedSize ? savedSize : "__custom__";
  }
  if (useGrokFormatCheckbox) {
    useGrokFormatCheckbox.checked = String(bananaSettings.useGrokFormat) === "true";
  }
  if (grokRefImageParamSelect) {
    grokRefImageParamSelect.value = bananaSettings.grokRefImageParam || "auto";
  }
  if (grokEditsFormatSelect) {
    grokEditsFormatSelect.value = bananaSettings.grokEditsFormat || "form_data";
  }
  if (grokResponseFormatSelect) {
    grokResponseFormatSelect.value = bananaSettings.grokResponseFormat || "none";
  }
  if (grokGenerationsEndpointInput) {
    grokGenerationsEndpointInput.value = bananaSettings.grokGenerationsEndpoint || "";
  }
  if (grokEditsEndpointInput) {
    grokEditsEndpointInput.value = bananaSettings.grokEditsEndpoint || "";
  }
  updateGrokOptionsVisibility();
  const savedVideoModel = bananaSettings.videoModel || "";
  if (videoModelSelect && savedVideoModel) {
    const existingVideoOption = Array.from(videoModelSelect.options).find((opt) => opt.value === savedVideoModel);
    if (!existingVideoOption) {
      const newVideoOption = document.createElement("option");
      newVideoOption.value = savedVideoModel;
      newVideoOption.textContent = savedVideoModel;
      videoModelSelect.appendChild(newVideoOption);
    }
    videoModelSelect.value = savedVideoModel;
  }
  populateDropdown();
  populateEditPresetDropdown();
  populateVideoPresetDropdown();
  loadPreset(bananaSettings.conversationPresetId);
  updateVisibility();
  initBananaPromptReplace();
}

function initBananaPromptReplace() {
  const getBananaSettings = () => extension_settings[extensionName].banana;
  const presetSelect = document.getElementById("st-chatu8-banana-prompt-replace-id");
  const textarea = document.getElementById("st-chatu8-banana-prompt-replace-text");
  const saveBtn = document.getElementById("st-chatu8-banana-prompt-replace-save");
  const saveAsBtn = document.getElementById("st-chatu8-banana-prompt-replace-save-as");
  const newBtn = document.getElementById("st-chatu8-banana-prompt-replace-new");
  const renameBtn = document.getElementById("st-chatu8-banana-prompt-replace-rename");
  const deleteBtn = document.getElementById("st-chatu8-banana-prompt-replace-delete");
  const importBtn = document.getElementById("st-chatu8-banana-prompt-replace-import");
  const exportBtn = document.getElementById("st-chatu8-banana-prompt-replace-export");
  const unsavedWarning = textarea?.closest(".st-chatu8-field-col")?.querySelector(".st-chatu8-unsaved-warning");
  if (!presetSelect || !textarea) {
    console.warn("[BananaUI] \u66FF\u6362\u8BCD\u8BBE\u7F6E\u5143\u7D20\u672A\u627E\u5230");
    return;
  }
  const bananaSettings = getBananaSettings();
  if (!bananaSettings.prompt_replace) {
    bananaSettings.prompt_replace = { "\u9ED8\u8BA4": { "text": "" } };
  }
  if (!bananaSettings.prompt_replace_id) {
    bananaSettings.prompt_replace_id = "\u9ED8\u8BA4";
  }
  const populateReplaceDropdown = () => {
    const presets = bananaSettings.prompt_replace || {};
    const currentId = bananaSettings.prompt_replace_id;
    presetSelect.innerHTML = "";
    Object.keys(presets).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      if (name === currentId) option.selected = true;
      presetSelect.appendChild(option);
    });
  };
  const loadReplacePreset = (presetId) => {
    const preset = bananaSettings.prompt_replace[presetId] || {};
    textarea.value = preset.text ?? "";
    bananaSettings.prompt_replace_id = presetId;
    if (unsavedWarning) unsavedWarning.style.display = "none";
  };
  const checkUnsaved = () => {
    const currentPreset = bananaSettings.prompt_replace[bananaSettings.prompt_replace_id] || {};
    const isDirty = textarea.value !== (currentPreset.text ?? "");
    if (unsavedWarning) {
      unsavedWarning.style.display = isDirty ? "inline" : "none";
    }
    return isDirty;
  };
  presetSelect.addEventListener("change", async () => {
    if (checkUnsaved()) {
      const confirmed = await stylishConfirm("\u60A8\u6709\u672A\u4FDD\u5B58\u7684\u66FF\u6362\u89C4\u5219\u3002\u8981\u653E\u5F03\u8FD9\u4E9B\u66F4\u6539\u5E76\u5207\u6362\u9884\u8BBE\u5417\uFF1F");
      if (!confirmed) {
        presetSelect.value = bananaSettings.prompt_replace_id;
        return;
      }
    }
    loadReplacePreset(presetSelect.value);
    saveSettingsDebounced();
    toastr.success(`\u5DF2\u52A0\u8F7D\u66FF\u6362\u89C4\u5219: "${presetSelect.value}"`);
  });
  textarea.addEventListener("input", checkUnsaved);
  saveBtn.addEventListener("click", async () => {
    const presetId = bananaSettings.prompt_replace_id;
    if (!presetId || !bananaSettings.prompt_replace[presetId]) {
      toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684\u66FF\u6362\u89C4\u5219\u53EF\u4FDD\u5B58\uFF0C\u8BF7\u5148\u53E6\u5B58\u4E3A\u4E00\u4E2A\u65B0\u89C4\u5219\u3002");
      return;
    }
    const confirmed = await stylishConfirm(`\u786E\u5B9A\u8981\u8986\u76D6\u5F53\u524D\u66FF\u6362\u89C4\u5219 "${presetId}" \u5417\uFF1F`);
    if (!confirmed) return;
    bananaSettings.prompt_replace[presetId] = { text: textarea.value };
    saveSettingsDebounced();
    if (unsavedWarning) unsavedWarning.style.display = "none";
    toastr.success(`\u66FF\u6362\u89C4\u5219 "${presetId}" \u5DF2\u4FDD\u5B58!`);
  });
  saveAsBtn.addEventListener("click", async () => {
    const newName = await stylInput("\u8BF7\u8F93\u5165\u65B0\u66FF\u6362\u89C4\u5219\u914D\u7F6E\u7684\u540D\u79F0:");
    if (!newName || newName.trim() === "") {
      toastr.info("\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002");
      return;
    }
    if (bananaSettings.prompt_replace[newName]) {
      const overwrite = await stylishConfirm(`\u66FF\u6362\u89C4\u5219 "${newName}" \u5DF2\u5B58\u5728\uFF0C\u8981\u8986\u76D6\u5B83\u5417\uFF1F`);
      if (!overwrite) return;
    }
    bananaSettings.prompt_replace[newName] = { text: textarea.value };
    bananaSettings.prompt_replace_id = newName;
    populateReplaceDropdown();
    saveSettingsDebounced();
    if (unsavedWarning) unsavedWarning.style.display = "none";
    toastr.success(`\u66FF\u6362\u89C4\u5219 "${newName}" \u5DF2\u4FDD\u5B58!`);
  });
  newBtn.addEventListener("click", async () => {
    const newName = await stylInput("\u8BF7\u8F93\u5165\u65B0\u66FF\u6362\u89C4\u5219\u914D\u7F6E\u7684\u540D\u79F0:");
    if (!newName || newName.trim() === "") return;
    if (bananaSettings.prompt_replace[newName]) {
      toastr.error(`\u66FF\u6362\u89C4\u5219 "${newName}" \u5DF2\u5B58\u5728\u3002`);
      return;
    }
    bananaSettings.prompt_replace[newName] = { text: "" };
    bananaSettings.prompt_replace_id = newName;
    populateReplaceDropdown();
    loadReplacePreset(newName);
    saveSettingsDebounced();
    if (unsavedWarning) unsavedWarning.style.display = "none";
    toastr.success(`\u7A7A\u66FF\u6362\u89C4\u5219 "${newName}" \u5DF2\u521B\u5EFA!`);
  });
  renameBtn.addEventListener("click", async () => {
    const currentName = bananaSettings.prompt_replace_id;
    if (!currentName || !bananaSettings.prompt_replace[currentName]) {
      toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684\u89C4\u5219\u53EF\u91CD\u547D\u540D\u3002");
      return;
    }
    if (currentName === "\u9ED8\u8BA4" || currentName === "default") {
      toastr.warning("\u9ED8\u8BA4\u914D\u7F6E\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
      return;
    }
    const newName = await stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u66FF\u6362\u89C4\u5219\u914D\u7F6E\u540D\u79F0:", currentName);
    if (!newName || newName.trim() === "" || newName.trim() === currentName) return;
    if (bananaSettings.prompt_replace[newName]) {
      toastr.error(`\u66FF\u6362\u89C4\u5219 "${newName}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002`);
      return;
    }
    bananaSettings.prompt_replace[newName] = bananaSettings.prompt_replace[currentName];
    delete bananaSettings.prompt_replace[currentName];
    bananaSettings.prompt_replace_id = newName;
    populateReplaceDropdown();
    saveSettingsDebounced();
    toastr.success(`\u66FF\u6362\u89C4\u5219\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
  });
  deleteBtn.addEventListener("click", async () => {
    const presetId = bananaSettings.prompt_replace_id;
    if (presetId === "\u9ED8\u8BA4") {
      toastr.warning("\u9ED8\u8BA4\u914D\u7F6E\u4E0D\u80FD\u5220\u9664\u3002");
      return;
    }
    const confirmed = await stylishConfirm(`\u786E\u5B9A\u8981\u5220\u9664\u66FF\u6362\u89C4\u5219 "${presetId}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`);
    if (!confirmed) return;
    delete bananaSettings.prompt_replace[presetId];
    bananaSettings.prompt_replace_id = "\u9ED8\u8BA4";
    populateReplaceDropdown();
    loadReplacePreset("\u9ED8\u8BA4");
    saveSettingsDebounced();
    toastr.success(`\u66FF\u6362\u89C4\u5219 "${presetId}" \u5DF2\u5220\u9664\u3002`);
  });
  exportBtn.addEventListener("click", () => {
    const presetId = bananaSettings.prompt_replace_id;
    const preset = bananaSettings.prompt_replace[presetId];
    if (!preset) {
      toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u66FF\u6362\u89C4\u5219\u53EF\u5BFC\u51FA\u3002");
      return;
    }
    const dataToExport = { [presetId]: preset };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banana-prompt-replace-${presetId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastr.success(`\u66FF\u6362\u89C4\u5219 "${presetId}" \u5DF2\u5BFC\u51FA\u3002`);
  });
  importBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          const importedData = JSON.parse(readerEvent.target.result);
          let newCount = 0;
          for (const key in importedData) {
            if (importedData.hasOwnProperty(key)) {
              if (!bananaSettings.prompt_replace.hasOwnProperty(key)) {
                newCount++;
              }
              bananaSettings.prompt_replace[key] = importedData[key];
            }
          }
          populateReplaceDropdown();
          saveSettingsDebounced();
          toastr.success(`\u6210\u529F\u5BFC\u5165 ${Object.keys(importedData).length} \u4E2A\u66FF\u6362\u89C4\u5219\uFF0C\u5176\u4E2D ${newCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`);
        } catch (err) {
          toastr.error("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684 JSON \u683C\u5F0F\u3002");
          console.error("[BananaUI] \u5BFC\u5165\u66FF\u6362\u89C4\u5219\u5931\u8D25:", err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
  populateReplaceDropdown();
  loadReplacePreset(bananaSettings.prompt_replace_id);
}

export { initBananaUI };
