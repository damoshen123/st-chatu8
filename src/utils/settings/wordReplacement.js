// 还原自打包产物 — 原始模块: utils/settings/wordReplacement.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../config.js";
import { stylInput } from "../ui_common.js";
import { __set_wrAiEditor, __set_wrProfileSelect, __set_wrTextEditor, wrAiEditor, wrProfileSelect, wrTextEditor } from "../imageInserter.js";
import "../wordReplacementService.js"; // init_wordReplacementService

function ensureProfiles() {
  const settings3 = extension_settings[extensionName];
  if (!settings3.word_replacement_profiles) {
    settings3.word_replacement_profiles = {
      "\u9ED8\u8BA4": {
        textReplacement: "\u8089\u68D2=\u{1F952}\n\u5C0F\u7A74=\u{1F338}\n\u5973\u5B69=\u2640\u{1F476}\u{1F3FB}\n\u5C11\u5973=\u2640\u{1F9D2}\u{1F3FB}\n\u7537\u5B69=\u2642\u{1F476}\u{1F3FB}\n\u6B63\u592A=\u2642\u{1F476}\u{1F3FB}\n\u5C0F\u5B69\u5B50=\u{1F467}\u{1F3FB}\n\u4E71\u4F26=\u26A0\uFE0F\u{1F498}\n\u8272\u60C5=\u{1F51E}\n\u5C81=\u{1F384}\n\u5C0F\u5B66=\u{1F3EC}\n\u5C0F\u5B66\u751F=\u{1F9D2}\u{1F3FB}\n\u5973\u513F=\u{1F467}\u{1F3FC}\n\u513F\u5B50=\u{1F466}\u{1F3FC}",
        aiReplacement: "sf_=\nsafe_="
      }
    };
  }
  if (!settings3.current_word_replacement_profile) {
    settings3.current_word_replacement_profile = "\u9ED8\u8BA4";
  }
}

function loadWRProfiles() {
  ensureProfiles();
  const settings3 = extension_settings[extensionName];
  const profiles = settings3.word_replacement_profiles;
  const currentName = settings3.current_word_replacement_profile;
  wrProfileSelect.empty();
  Object.keys(profiles).forEach((name) => {
    const option = new Option(name, name, name === currentName, name === currentName);
    wrProfileSelect.append(option);
  });
  if (wrProfileSelect.val()) {
    wrProfileSelect.trigger("change");
  }
}

function onWRProfileSelectChange() {
  const profileName = $(this).val();
  if (!profileName) return;
  const settings3 = extension_settings[extensionName];
  const profiles = settings3.word_replacement_profiles;
  const profile = profiles[profileName];
  if (profile) {
    wrTextEditor.val(profile.textReplacement || "");
    wrAiEditor.val(profile.aiReplacement || "");
    settings3.current_word_replacement_profile = profileName;
    saveSettingsDebounced();
  }
}

function onWRSaveProfile() {
  const profileName = wrProfileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u3002");
    return;
  }
  const settings3 = extension_settings[extensionName];
  const profiles = settings3.word_replacement_profiles;
  profiles[profileName] = {
    textReplacement: wrTextEditor.val(),
    aiReplacement: wrAiEditor.val()
  };
  saveSettingsDebounced();
  toastr.success(`\u8BCD\u6C47\u66FF\u6362\u914D\u7F6E "${profileName}" \u5DF2\u4FDD\u5B58\u3002`);
}

function onWRNewProfile() {
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u8BCD\u6C47\u66FF\u6362\u914D\u7F6E\u540D\u79F0").then((newName) => {
    if (!newName || newName.trim() === "") return;
    const settings3 = extension_settings[extensionName];
    const profiles = settings3.word_replacement_profiles;
    if (profiles[newName]) {
      toastr.error(`\u914D\u7F6E "${newName}" \u5DF2\u5B58\u5728\u3002`);
      return;
    }
    profiles[newName] = {
      textReplacement: "",
      aiReplacement: ""
    };
    settings3.current_word_replacement_profile = newName;
    saveSettingsDebounced();
    loadWRProfiles();
    toastr.success(`\u7A7A\u914D\u7F6E "${newName}" \u5DF2\u521B\u5EFA\u5E76\u9009\u4E2D\u3002`);
  });
}

function onWRRenameProfile() {
  const currentName = wrProfileSelect.val();
  if (!currentName) {
    toastr.warning("\u6CA1\u6709\u6D3B\u52A8\u7684\u914D\u7F6E\u53EF\u91CD\u547D\u540D\u3002");
    return;
  }
  if (currentName === "\u9ED8\u8BA4" || currentName === "default") {
    toastr.warning("\u9ED8\u8BA4\u914D\u7F6E\u4E0D\u80FD\u91CD\u547D\u540D\u3002");
    return;
  }
  stylInput("\u8BF7\u8F93\u5165\u65B0\u7684\u914D\u7F6E\u540D\u79F0", currentName).then((newName) => {
    if (newName && newName.trim() !== "" && newName !== currentName) {
      const settings3 = extension_settings[extensionName];
      const profiles = settings3.word_replacement_profiles;
      if (profiles[newName]) {
        toastr.error(`\u914D\u7F6E "${newName}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u6362\u4E00\u4E2A\u540D\u79F0\u3002`);
        return;
      }
      profiles[newName] = profiles[currentName];
      delete profiles[currentName];
      settings3.current_word_replacement_profile = newName;
      saveSettingsDebounced();
      loadWRProfiles();
      toastr.success(`\u914D\u7F6E\u5DF2\u91CD\u547D\u540D\u4E3A "${newName}"`);
    }
  });
}

function onWRDeleteProfile() {
  const profileName = wrProfileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u3002");
    return;
  }
  const settings3 = extension_settings[extensionName];
  if (Object.keys(settings3.word_replacement_profiles).length <= 1) {
    toastr.error("\u4E0D\u80FD\u5220\u9664\u6700\u540E\u4E00\u4E2A\u914D\u7F6E\u3002");
    return;
  }
  if (confirm(`\u4F60\u786E\u5B9A\u8981\u5220\u9664\u8BCD\u6C47\u66FF\u6362\u914D\u7F6E "${profileName}" \u5417\uFF1F`)) {
    delete settings3.word_replacement_profiles[profileName];
    settings3.current_word_replacement_profile = Object.keys(settings3.word_replacement_profiles)[0];
    saveSettingsDebounced();
    loadWRProfiles();
    toastr.success(`\u914D\u7F6E "${profileName}" \u5DF2\u5220\u9664\u3002`);
  }
}

function onWRExportProfile() {
  const profileName = wrProfileSelect.val();
  if (!profileName) {
    toastr.warning("\u6CA1\u6709\u9009\u4E2D\u7684\u914D\u7F6E\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const settings3 = extension_settings[extensionName];
  const profile = settings3.word_replacement_profiles[profileName];
  const exportData = { [profileName]: profile };
  const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st_chatu8_word_replace_${profileName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastr.success(`\u5DF2\u5BFC\u51FA\u8BCD\u6C47\u66FF\u6362\u914D\u7F6E: ${profileName}`);
}

function onWRImportProfile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProfiles = JSON.parse(e.target.result);
          const settings3 = extension_settings[extensionName];
          let importedCount = 0;
          for (const name in importedProfiles) {
            if (Object.prototype.hasOwnProperty.call(importedProfiles, name)) {
              const profile = importedProfiles[name];
              if (typeof profile === "object" && profile !== null) {
                settings3.word_replacement_profiles[name] = {
                  textReplacement: profile.textReplacement || "",
                  aiReplacement: profile.aiReplacement || ""
                };
                importedCount++;
              }
            }
          }
          saveSettingsDebounced();
          loadWRProfiles();
          toastr.success(`\u6210\u529F\u5BFC\u5165 ${importedCount} \u4E2A\u8BCD\u6C47\u66FF\u6362\u914D\u7F6E\u3002`);
        } catch (error) {
          toastr.error("\u5BFC\u5165\u5931\u8D25\uFF0C\u6587\u4EF6\u683C\u5F0F\u65E0\u6548\u3002");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function initWordReplacementSettings() {
  __set_wrProfileSelect($("#ch-word-replace-profile-select"));
  __set_wrTextEditor($("#ch-word-replace-text-editor"));
  __set_wrAiEditor($("#ch-word-replace-ai-editor"));
  wrProfileSelect.on("change", onWRProfileSelectChange);
  $("#ch-new-word-replace-profile-button").on("click", onWRNewProfile);
  $("#ch-rename-word-replace-profile-button").on("click", onWRRenameProfile);
  $("#ch-save-word-replace-profile-button").on("click", onWRSaveProfile);
  $("#ch-import-word-replace-profile-button").on("click", onWRImportProfile);
  $("#ch-export-word-replace-profile-button").on("click", onWRExportProfile);
  $("#ch-delete-word-replace-profile-button").on("click", onWRDeleteProfile);
  loadWRProfiles();
}

export { initWordReplacementSettings };
