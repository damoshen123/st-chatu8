// 还原自打包产物 — 原始模块: utils/settings/theme.js
import { saveSettingsDebounced } from "../../../../../../script.js";
import { extension_settings } from "../../../../../../extensions.js";
import { defaultThemes, extensionName } from "../config.js";
import { applyGenerateButtonStyle } from "./buttonstyle.js";
import { applyImageFrameStyle } from "./framestyle.js";
import { applyCollapseStyle } from "./collapsestyle.js";
import { stylInput, stylishConfirm } from "../ui_common.js";

var colorVarMap, currentPreviewTheme, settings;

currentPreviewTheme = {};

colorVarMap = {
      "--st-chatu8-bg-primary": "\u4E3B\u80CC\u666F\u8272",
      "--st-chatu8-bg-secondary": "\u6B21\u80CC\u666F\u8272",
      "--st-chatu8-bg-tertiary": "\u4E09\u7EA7\u80CC\u666F\u8272",
      "--st-chatu8-text-primary": "\u4E3B\u6587\u672C\u989C\u8272",
      "--st-chatu8-text-secondary": "\u6B21\u6587\u672C\u989C\u8272",
      "--st-chatu8-accent-primary": "\u4E3B\u5F3A\u8C03\u8272",
      "--st-chatu8-accent-secondary": "\u6B21\u5F3A\u8C03\u8272",
      "--st-chatu8-danger-primary": "\u5371\u9669/\u5220\u9664\u6309\u94AE\u8272",
      "--st-chatu8-danger-secondary": "\u5371\u9669/\u5220\u9664\u6309\u94AE\u60AC\u505C\u8272",
      "--st-chatu8-danger-text": "\u5371\u9669/\u5220\u9664\u6309\u94AE\u6587\u672C\u8272",
      "--st-chatu8-border-color": "\u8FB9\u6846\u989C\u8272",
      "--st-chatu8-dropdown-bg": "\u4E0B\u62C9\u6846\u80CC\u666F\u8272",
      "--st-chatu8-dropdown-text": "\u4E0B\u62C9\u5217\u8868\u6587\u672C\u989C\u8272",
      "--st-chatu8-dropdown-list-bg": "\u4E0B\u62C9\u9009\u9879\u80CC\u666F\u8272",
      "--st-chatu8-text-highlight": "\u9AD8\u4EAE\u6587\u672C\u989C\u8272",
      "--st-chatu8-input-bg": "\u8F93\u5165\u6846\u80CC\u666F\u8272",
      "--st-chatu8-input-text": "\u8F93\u5165\u6846\u6587\u672C\u989C\u8272",
      "--st-chatu8-input-border": "\u8F93\u5165\u6846\u8FB9\u6846\u989C\u8272"
    };



function isThemeDark(theme) {
  const bgColor = theme["--st-chatu8-bg-primary"] || "#ffffff";
  const color = bgColor.substring(1);
  const rgb = parseInt(color, 16);
  const r = rgb >> 16 & 255;
  const g = rgb >> 8 & 255;
  const b = rgb >> 0 & 255;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
}

function applyTheme(theme) {
  if (!theme) {
    console.error(`Theme object is invalid.`);
    return;
  }
  const defaults = {
    "--st-chatu8-input-bg": theme["--st-chatu8-bg-secondary"] || "#ffffff",
    "--st-chatu8-input-text": theme["--st-chatu8-text-primary"] || "#000000",
    "--st-chatu8-input-border": theme["--st-chatu8-border-color"] || "#cccccc"
  };
  const fullTheme = { ...defaults, ...theme };
  const root = document.querySelector("#st-chatu8-settings");
  if (root) {
    for (const [key, value] of Object.entries(fullTheme)) {
      root.style.setProperty(key, value);
    }
  }
  const topRoot = window.top.document.documentElement;
  if (topRoot) {
    for (const [key, value] of Object.entries(fullTheme)) {
      topRoot.style.setProperty(key, value);
    }
  }
  const themeIcon = document.querySelector("#ch-toggle-theme i");
  if (themeIcon) {
    const isDark = isThemeDark(fullTheme);
    if (isDark) {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
    } else {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
    }
  }
}

function populateThemeColorPickers(themeId) {
  const container = document.getElementById("theme-color-pickers");
  if (!container) return;
  container.innerHTML = "";
  const theme = currentPreviewTheme;
  if (!theme) return;
  for (const key in colorVarMap) {
    if (Object.hasOwnProperty.call(theme, key)) {
      const labelText = colorVarMap[key];
      const color = theme[key];
      const field = document.createElement("div");
      field.className = "st-chatu8-field";
      const label = document.createElement("label");
      label.textContent = labelText;
      label.htmlFor = `theme-color-${key}`;
      const colorPicker = document.createElement("input");
      colorPicker.type = "color";
      colorPicker.id = `theme-color-${key}`;
      colorPicker.className = "st-chatu8-color-picker";
      colorPicker.value = color;
      colorPicker.dataset.var = key;
      colorPicker.addEventListener("input", (event) => {
        const newColor = event.target.value;
        const cssVar = event.target.dataset.var;
        currentPreviewTheme[cssVar] = newColor;
        applyTheme(currentPreviewTheme);
      });
      field.appendChild(label);
      field.appendChild(colorPicker);
      container.appendChild(field);
    }
  }
}

function loadThemeSettings() {
  const select = document.getElementById("theme_id");
  if (!select) return;
  const currentThemeId = settings.theme_id;
  select.innerHTML = "";
  for (const key in settings.themes) {
    const option = new Option(key, key);
    option.title = key;
    select.add(option);
  }
  select.value = currentThemeId;
  const btnStyleSelect = document.getElementById("theme_generate_btn_style");
  if (btnStyleSelect) {
    btnStyleSelect.value = settings.generate_btn_style || "\u9ED8\u8BA4";
  }
  const frameStyleSelect = document.getElementById("theme_image_frame_style");
  if (frameStyleSelect) {
    frameStyleSelect.value = settings.image_frame_style || "\u65E0\u6837\u5F0F";
  }
  const collapseStyleSelect = document.getElementById("theme_collapse_style");
  if (collapseStyleSelect) {
    collapseStyleSelect.value = settings.collapse_style || "\u9ED8\u8BA4";
  }
  currentPreviewTheme = JSON.parse(JSON.stringify(settings.themes[currentThemeId]));
  populateThemeColorPickers(currentThemeId);
  applyGenerateButtonStyle(settings.generate_btn_style, isThemeDark(currentPreviewTheme));
  applyImageFrameStyle(settings.image_frame_style || "\u65E0\u6837\u5F0F", isThemeDark(currentPreviewTheme));
  applyCollapseStyle(settings.collapse_style || "\u9ED8\u8BA4", isThemeDark(currentPreviewTheme));
}

function theme_change() {
  const select = document.getElementById("theme_id");
  const newThemeId = select.value;
  settings.theme_id = newThemeId;
  currentPreviewTheme = JSON.parse(JSON.stringify(settings.themes[newThemeId]));
  applyTheme(currentPreviewTheme);
  populateThemeColorPickers(newThemeId);
  saveSettingsDebounced();
}

function btn_style_change() {
  const select = document.getElementById("theme_generate_btn_style");
  const newStyle = select.value;
  settings.generate_btn_style = newStyle;
  applyGenerateButtonStyle(newStyle, isThemeDark(currentPreviewTheme));
  saveSettingsDebounced();
}

function frame_style_change() {
  const select = document.getElementById("theme_image_frame_style");
  const newStyle = select.value;
  settings.image_frame_style = newStyle;
  applyImageFrameStyle(newStyle, isThemeDark(currentPreviewTheme));
  saveSettingsDebounced();
}

function collapse_style_change() {
  const select = document.getElementById("theme_collapse_style");
  const newStyle = select.value;
  settings.collapse_style = newStyle;
  applyCollapseStyle(newStyle, isThemeDark(currentPreviewTheme));
  saveSettingsDebounced();
}

function theme_save() {
  const currentThemeId = settings.theme_id;
  if (defaultThemes.hasOwnProperty(currentThemeId)) {
    stylInput("\u6B63\u5728\u7F16\u8F91\u9ED8\u8BA4\u4E3B\u9898\u3002\u8BF7\u8F93\u5165\u65B0\u4E3B\u9898\u7684\u540D\u79F0\u4EE5\u4FDD\u5B58\uFF1A").then((name) => {
      if (name && name.trim() !== "") {
        settings.themes[name] = JSON.parse(JSON.stringify(currentPreviewTheme));
        settings.theme_id = name;
        saveSettingsDebounced();
        loadThemeSettings();
        applyTheme(currentPreviewTheme);
      }
    });
  } else {
    stylishConfirm(`\u786E\u5B9A\u8981\u8986\u76D6\u5F53\u524D\u4E3B\u9898 "${currentThemeId}" \u5417\uFF1F`).then((confirmed) => {
      if (confirmed) {
        settings.themes[currentThemeId] = JSON.parse(JSON.stringify(currentPreviewTheme));
        saveSettingsDebounced();
        alert(`\u4E3B\u9898 "${currentThemeId}" \u5DF2\u4FDD\u5B58\u3002`);
      }
    });
  }
}

function theme_delete() {
  const select = document.getElementById("theme_id");
  const themeIdToDelete = select.value;
  if (defaultThemes.hasOwnProperty(themeIdToDelete)) {
    alert("\u4E0D\u80FD\u5220\u9664\u9ED8\u8BA4\u4E3B\u9898\u3002");
    return;
  }
  stylishConfirm(`\u786E\u5B9A\u8981\u5220\u9664\u4E3B\u9898 "${themeIdToDelete}" \u5417?`).then((confirmed) => {
    if (confirmed) {
      delete settings.themes[themeIdToDelete];
      settings.theme_id = "\u9ED8\u8BA4-\u767D\u5929";
      saveSettingsDebounced();
      applyTheme(settings.themes[settings.theme_id]);
      loadThemeSettings();
    }
  });
}

function theme_import() {
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
        let newThemesCount = 0;
        for (const key in importedData) {
          if (importedData.hasOwnProperty(key)) {
            if (!settings.themes.hasOwnProperty(key)) {
              newThemesCount++;
            }
            settings.themes[key] = importedData[key];
          }
        }
        saveSettingsDebounced();
        loadThemeSettings();
        alert(`\u6210\u529F\u5BFC\u5165 ${Object.keys(importedData).length} \u4E2A\u4E3B\u9898\uFF0C\u5176\u4E2D ${newThemesCount} \u4E2A\u662F\u5168\u65B0\u7684\u3002`);
      } catch (err) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u6587\u4EF6\u662F\u6B63\u786E\u7684JSON\u683C\u5F0F\u3002");
        console.error("Error importing themes:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function theme_export(all = false) {
  const themeId = settings.theme_id;
  if (!all && !settings.themes[themeId]) {
    alert("\u6CA1\u6709\u9009\u4E2D\u7684\u4E3B\u9898\u53EF\u5BFC\u51FA\u3002");
    return;
  }
  const dataToExport = all ? settings.themes : { [themeId]: settings.themes[themeId] };
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-chatu8-theme${all ? "s-all" : "-" + themeId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toggleTheme() {
  const themeKeys = Object.keys(settings.themes);
  const currentIndex = themeKeys.indexOf(settings.theme_id);
  const nextIndex = (currentIndex + 1) % themeKeys.length;
  const newThemeId = themeKeys[nextIndex];
  settings.theme_id = newThemeId;
  applyTheme(settings.themes[newThemeId]);
  loadThemeSettings();
  saveSettingsDebounced();
}

function initThemeSettings(settingsModal) {
  settings = extension_settings[extensionName];
  for (const themeId in defaultThemes) {
    if (!settings.themes.hasOwnProperty(themeId)) {
      settings.themes[themeId] = JSON.parse(JSON.stringify(defaultThemes[themeId]));
    }
  }
  loadThemeSettings();
  settingsModal.find("#ch-toggle-theme").on("click", toggleTheme);
  settingsModal.find("#theme_id").on("change", theme_change);
  settingsModal.find("#theme_generate_btn_style").on("change", btn_style_change);
  settingsModal.find("#theme_image_frame_style").on("change", frame_style_change);
  settingsModal.find("#theme_collapse_style").on("change", collapse_style_change);
  settingsModal.find("#theme_save_style").on("click", theme_save);
  settingsModal.find("#theme_delete_style").on("click", theme_delete);
  settingsModal.find("#theme_export_current").on("click", () => theme_export(false));
  settingsModal.find("#theme_export_all").on("click", () => theme_export(true));
  settingsModal.find("#theme_import").on("click", theme_import);
}

export { applyTheme, initThemeSettings, isThemeDark };
