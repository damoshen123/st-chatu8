// 还原自打包产物 — 原始模块: utils/settings/character/selectSearch.js
import { extension_settings } from "../../../../../../../extensions.js";
import { extensionName } from "../../config.js";

var SEARCH_CONFIG;

SEARCH_CONFIG = {
      // 预设选择器配置
      presets: [
        {
          selectId: "character_preset_id",
          searchId: "character_preset_search",
          placeholder: "\u641C\u7D22\u89D2\u8272\u9884\u8BBE...",
          dataSource: "characterPresets",
          hasNames: true,
          defaultOption: "-- \u65E0 --"
        },
        {
          selectId: "outfit_preset_id",
          searchId: "outfit_preset_search",
          placeholder: "\u641C\u7D22\u670D\u88C5\u9884\u8BBE...",
          dataSource: "outfitPresets",
          hasNames: true,
          defaultOption: "-- \u65E0 --"
        },
        {
          selectId: "character_enable_preset_id",
          searchId: "character_enable_preset_search",
          placeholder: "\u641C\u7D22\u89D2\u8272\u542F\u7528\u9884\u8BBE...",
          dataSource: "characterEnablePresets",
          hasNames: false,
          defaultOption: "-- \u65E0 --"
        },
        {
          selectId: "outfit_enable_preset_id",
          searchId: "outfit_enable_preset_search",
          placeholder: "\u641C\u7D22\u670D\u88C5\u542F\u7528\u9884\u8BBE...",
          dataSource: "outfitEnablePresets",
          hasNames: false,
          defaultOption: "-- \u65E0 --"
        },
        {
          selectId: "character_common_preset_id",
          searchId: "character_common_preset_search",
          placeholder: "\u641C\u7D22\u901A\u7528\u89D2\u8272\u9884\u8BBE...",
          dataSource: "characterCommonPresets",
          hasNames: false,
          defaultOption: "-- \u65E0 --"
        },
        {
          selectId: "banana_char_preset_id",
          searchId: "banana_char_preset_search",
          placeholder: "\u641C\u7D22Banana\u89D2\u8272\u9884\u8BBE...",
          dataSource: "bananaCharacterPresets",
          hasNames: false,
          defaultOption: "-- \u65E0 --"
        }
      ],
      // 添加选择器配置
      selectors: [
        {
          selectId: "char_outfit_selector",
          searchId: "char_outfit_selector_search",
          placeholder: "\u641C\u7D22\u670D\u88C5...",
          dataSource: "outfitPresets",
          hasNames: true,
          defaultOption: "-- \u9009\u62E9\u670D\u88C5 --"
        },
        {
          selectId: "character_enable_selector",
          searchId: "character_enable_selector_search",
          placeholder: "\u641C\u7D22\u89D2\u8272...",
          dataSource: "characterPresets",
          hasNames: true,
          defaultOption: "-- \u9009\u62E9\u89D2\u8272 --"
        },
        {
          selectId: "outfit_enable_selector",
          searchId: "outfit_enable_selector_search",
          placeholder: "\u641C\u7D22\u670D\u88C5...",
          dataSource: "outfitPresets",
          hasNames: true,
          defaultOption: "-- \u9009\u62E9\u670D\u88C5 --"
        },
        {
          selectId: "character_common_selector",
          searchId: "character_common_selector_search",
          placeholder: "\u641C\u7D22\u89D2\u8272...",
          dataSource: "characterPresets",
          hasNames: true,
          defaultOption: "-- \u9009\u62E9\u89D2\u8272 --"
        }
      ]
    };

function createSearchInput(select, config) {
  let searchInput = document.getElementById(config.searchId);
  if (searchInput) {
    return searchInput;
  }
  searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = config.searchId;
  searchInput.className = "st-chatu8-text-input st-chatu8-select-search";
  searchInput.placeholder = config.placeholder;
  const selectParent = select.parentElement;
  if (!selectParent) return searchInput;
  if (selectParent.classList.contains("st-chatu8-profile-controls")) {
    const grandParent = selectParent.parentElement;
    if (grandParent) {
      grandParent.insertBefore(searchInput, selectParent);
    }
  } else {
    const grandParent = selectParent.parentElement;
    if (grandParent) {
      grandParent.insertBefore(searchInput, selectParent);
    }
  }
  return searchInput;
}

function matchesSearch(presetName, presetData, keyword, hasNames) {
  const lowerKeyword = keyword.toLowerCase();
  if (presetName.toLowerCase().includes(lowerKeyword)) {
    return true;
  }
  if (hasNames && presetData) {
    if (presetData.nameCN && presetData.nameCN.toLowerCase().includes(lowerKeyword)) {
      return true;
    }
    if (presetData.nameEN && presetData.nameEN.toLowerCase().includes(lowerKeyword)) {
      return true;
    }
  }
  return false;
}

function filterSelectOptions(select, config, keyword) {
  const settings3 = extension_settings[extensionName];
  const presets = settings3[config.dataSource] || {};
  const currentValue = select.value;
  select.innerHTML = "";
  if (config.defaultOption) {
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = config.defaultOption;
    select.add(defaultOpt);
  }
  const matchedOptions = [];
  for (const presetName in presets) {
    const presetData = presets[presetName];
    if (!keyword || matchesSearch(presetName, presetData, keyword, config.hasNames)) {
      const option = document.createElement("option");
      option.value = presetName;
      if (config.hasNames && presetData && (presetData.nameCN || presetData.nameEN)) {
        const nameParts = [presetName];
        if (presetData.nameCN || presetData.nameEN) {
          const names = [presetData.nameCN, presetData.nameEN].filter(Boolean).join(" / ");
          nameParts.push(`(${names})`);
        }
        option.textContent = nameParts.join(" ");
      } else {
        option.textContent = presetName;
      }
      select.add(option);
      matchedOptions.push(presetName);
    }
  }
  if (keyword && config.defaultOption) {
    select.value = "";
  } else if (currentValue && matchedOptions.includes(currentValue)) {
    select.value = currentValue;
  } else if (keyword && matchedOptions.length === 1) {
    select.value = matchedOptions[0];
  } else if (select.options.length > 0) {
    select.selectedIndex = 0;
  }
}

function initSelectSearch(config) {
  const select = document.getElementById(config.selectId);
  if (!select) return;
  const searchInput = createSearchInput(select, config);
  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.trim();
    filterSelectOptions(select, config, keyword);
  });
  setTimeout(() => {
    filterSelectOptions(select, config, "");
  }, 500);
}

function initAllSelectSearch(container) {
  SEARCH_CONFIG.presets.forEach((config) => {
    initSelectSearch(config);
  });
  SEARCH_CONFIG.selectors.forEach((config) => {
    initSelectSearch(config);
  });
}

function refreshAllSelectSearch() {
  const allConfigs = [...SEARCH_CONFIG.presets, ...SEARCH_CONFIG.selectors];
  allConfigs.forEach((config) => {
    const searchInput = document.getElementById(config.searchId);
    const select = document.getElementById(config.selectId);
    if (!select) return;
    const keyword = searchInput ? searchInput.value.trim() : "";
    filterSelectOptions(select, config, keyword);
  });
}

export { initAllSelectSearch, refreshAllSelectSearch };
