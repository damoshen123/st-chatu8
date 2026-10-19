// 还原自打包产物 — 原始模块: utils/settings/character/characterVisualSelector.js
import { extension_settings } from "../../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionName } from "../../config.js";
import { deleteConfigImage, getConfigImage, saveConfigImage } from "../../configDatabase.js";
import { loadOutfitPresetData, loadOutfitPresetList } from "./outfitPreset.js";
import { loadCharacterPresetData, loadCharacterPresetList } from "./characterPreset.js";
import { createBulkSelectControls } from "../bulkSelectControls.js";
import { createGroupDropdown, createGroupManageButton, createGroupTagButton, filterByGroup, removeMember, renameMember } from "../presetGroupManager.js";
import { filterPresetsBySearch } from "../presetSearchMatcher.js";

async function showCharacterVisualSelector(onSelect) {
  const settings3 = extension_settings[extensionName];
  await showGenericVisualSelector({
    type: "character",
    title: "\u9009\u62E9\u89D2\u8272\u9884\u8BBE",
    presets: settings3.characterPresets || {},
    currentPresetIdKey: "characterPresetId",
    defaultPresetName: "\u9ED8\u8BA4\u89D2\u8272",
    imageIdField: "photoImageIds",
    // 角色使用 photoImageIds 数组
    groupScope: "characterPresets",
    settings: settings3,
    onSelect,
    onRefresh: () => {
      loadCharacterPresetList();
    },
    loadPresetData: loadCharacterPresetData
  });
}

async function showOutfitVisualSelector(onSelect) {
  const settings3 = extension_settings[extensionName];
  await showGenericVisualSelector({
    type: "outfit",
    title: "\u9009\u62E9\u670D\u88C5\u9884\u8BBE",
    presets: settings3.outfitPresets || {},
    currentPresetIdKey: "outfitPresetId",
    defaultPresetName: "\u9ED8\u8BA4\u670D\u88C5",
    imageIdField: "photoImageIds",
    // 服装也使用 photoImageIds 数组
    groupScope: "outfitPresets",
    settings: settings3,
    onSelect,
    onRefresh: () => {
      loadOutfitPresetList();
    },
    loadPresetData: loadOutfitPresetData
  });
}

async function showGenericVisualSelector(config) {
  const {
    type,
    title,
    presets,
    currentPresetIdKey,
    defaultPresetName,
    imageIdField,
    groupScope,
    settings: settings3,
    onSelect,
    onRefresh,
    loadPresetData
  } = config;
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  const selectedForDelete = /* @__PURE__ */ new Set();
  let isBulkDeleteMode = false;
  let currentPage = 1;
  let pageSize = 12;
  let filteredPresetNames = [];
  let searchQuery = "";
  let currentGroupId = null;
  let groupDropdown = null;
  let groupManageBtn = null;
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-preset-viz-dialog-wrapper">
            <div class="st-chatu8-workflow-viz-header">
                <h3>${title}</h3>
                <span class="st-chatu8-workflow-viz-close">&times;</span>
            </div>
            <div class="st-chatu8-workflow-viz-toolbar" style="justify-content: space-between; align-items: center; gap: 15px;">
                <div class="st-chatu8-viz-search-container" style="position: relative; flex-grow: 1; max-width: 300px;">
                    <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #aaa; pointer-events: none;"></i>
                    <input type="text" class="st-chatu8-viz-search-input" placeholder="\u641C\u7D22\u540D\u79F0\u6216\u63D0\u793A\u8BCD\u5185\u5BB9..." style="width: 100%; padding: 8px 12px 8px 36px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: white; outline: none; transition: all 0.3s;">
                </div>
                <div style="display: flex; gap: 10px;">
                    <div class="st-chatu8-viz-bulk-delete" style="cursor: pointer; padding: 6px 14px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.9em; user-select: none; white-space: nowrap; display: flex; align-items: center; gap: 6px; transition: all 0.3s;">
                        <i class="fa-solid fa-trash-can"></i> <span>\u6279\u91CF\u5220\u9664</span>
                    </div>
                     <div class="st-chatu8-viz-confirm-delete" style="display: none; cursor: pointer; padding: 6px 14px; background: var(--st-chatu8-danger-primary, #d9534f); border-radius: 20px; font-size: 0.9em; user-select: none; white-space: nowrap; align-items: center; gap: 6px; transition: all 0.3s; color: white;">
                        <i class="fa-solid fa-check"></i> <span>\u786E\u8BA4\u5220\u9664 (0)</span>
                    </div>
                    <div class="st-chatu8-viz-mode-toggle" style="cursor: pointer; padding: 6px 14px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.9em; user-select: none; white-space: nowrap; display: flex; align-items: center; gap: 6px; transition: all 0.3s;">
                        <i class="fa-solid fa-pen-to-square"></i> <span>\u7BA1\u7406</span>
                    </div>
                </div>
            </div>
            <div class="st-chatu8-pagination-container" style="display: flex; justify-content: center; align-items: center; gap: 12px; padding: 12px 20px; background: rgba(30, 30, 46, 0.6); border-bottom: 1px solid rgba(255,255,255,0.05);">
                <button class="st-chatu8-pagination-btn st-chatu8-pagination-prev" title="\u4E0A\u4E00\u9875" style="padding: 6px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #ccc; cursor: pointer; transition: all 0.2s;">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="st-chatu8-pagination-info" style="display: flex; align-items: center; gap: 8px; color: #aaa; font-size: 0.9em;">
                    <span class="st-chatu8-pagination-current">1</span>
                    <span>/</span>
                    <span class="st-chatu8-pagination-total">1</span>
                    <span style="margin-left: 8px; color: #666;">|</span>
                    <span style="margin-left: 8px;">\u5171 <span class="st-chatu8-pagination-count">0</span> \u4E2A</span>
                </div>
                <button class="st-chatu8-pagination-btn st-chatu8-pagination-next" title="\u4E0B\u4E00\u9875" style="padding: 6px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #ccc; cursor: pointer; transition: all 0.2s;">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div style="margin-left: 16px; display: flex; align-items: center; gap: 6px;">
                    <span style="color: #888; font-size: 0.85em;">\u6BCF\u9875</span>
                    <select class="st-chatu8-pagination-size" style="padding: 4px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #ccc; cursor: pointer; font-size: 0.85em;">
                        <option value="8">8</option>
                        <option value="12" selected>12</option>
                        <option value="16">16</option>
                        <option value="24">24</option>
                        <option value="48">48</option>
                    </select>
                </div>
            </div>
            <div class="st-chatu8-workflow-viz-body">
                <div class="st-chatu8-workflow-viz-container st-chatu8-preset-viz-container">
                    <div class="st-chatu8-preset-grid"></div>
                </div>
            </div>
        </div>
    `;
  function closeDialog() {
    if (groupDropdown) groupDropdown.destroy();
    if (groupManageBtn) groupManageBtn.destroy();
    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }
  const closeBtn = backdrop.querySelector(".st-chatu8-workflow-viz-close");
  closeBtn.onclick = () => closeDialog();
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      closeDialog();
    }
  };
  const searchInput = backdrop.querySelector(".st-chatu8-viz-search-input");
  searchInput.oninput = (e) => {
    searchQuery = e.target.value.toLowerCase();
    currentPage = 1;
    updateFilteredPresets();
    renderCurrentPage();
  };
  const wrapper = backdrop.querySelector(".st-chatu8-preset-viz-dialog-wrapper");
  const bulkDeleteBtn = backdrop.querySelector(".st-chatu8-viz-bulk-delete");
  const confirmDeleteBtn = backdrop.querySelector(".st-chatu8-viz-confirm-delete");
  const toggleBtn = backdrop.querySelector(".st-chatu8-viz-mode-toggle");
  const bulkControls = createBulkSelectControls({
    container: toggleBtn.parentNode,
    insertBefore: toggleBtn,
    selected: selectedForDelete,
    getSelectable: () => filteredPresetNames.filter((name) => name !== defaultPresetName),
    onChange: () => {
      syncCardSelection();
      updateConfirmButton();
    }
  });
  toggleBtn.onclick = () => {
    if (isBulkDeleteMode) {
      exitBulkDeleteMode();
    }
    wrapper.classList.toggle("st-chatu8-mode-manage");
    const isManage = wrapper.classList.contains("st-chatu8-mode-manage");
    toggleBtn.style.background = isManage ? "var(--st-chatu8-accent-primary)" : "rgba(255,255,255,0.1)";
    toggleBtn.style.color = isManage ? "white" : "inherit";
  };
  function exitBulkDeleteMode() {
    isBulkDeleteMode = false;
    selectedForDelete.clear();
    wrapper.classList.remove("st-chatu8-mode-bulk-delete");
    bulkDeleteBtn.style.background = "rgba(255,255,255,0.1)";
    bulkDeleteBtn.style.color = "inherit";
    bulkDeleteBtn.querySelector("span").textContent = "\u6279\u91CF\u5220\u9664";
    confirmDeleteBtn.style.display = "none";
    bulkControls.hide();
    const cards = backdrop.querySelectorAll(".st-chatu8-preset-card");
    cards.forEach((card) => card.classList.remove("selected-for-delete"));
  }
  function syncCardSelection() {
    const cards = backdrop.querySelectorAll(".st-chatu8-preset-card");
    cards.forEach((card) => {
      const name = card.dataset.presetName;
      const shouldSelect = isBulkDeleteMode && name && selectedForDelete.has(name);
      card.classList.toggle("selected-for-delete", !!shouldSelect);
    });
  }
  bulkDeleteBtn.onclick = () => {
    if (wrapper.classList.contains("st-chatu8-mode-manage")) {
      wrapper.classList.remove("st-chatu8-mode-manage");
      toggleBtn.style.background = "rgba(255,255,255,0.1)";
      toggleBtn.style.color = "inherit";
    }
    isBulkDeleteMode = !isBulkDeleteMode;
    if (isBulkDeleteMode) {
      wrapper.classList.add("st-chatu8-mode-bulk-delete");
      bulkDeleteBtn.style.background = "var(--st-chatu8-danger-primary, #d9534f)";
      bulkDeleteBtn.style.color = "white";
      bulkDeleteBtn.querySelector("span").textContent = "\u53D6\u6D88\u5220\u9664";
      confirmDeleteBtn.style.display = "flex";
      bulkControls.show();
      updateConfirmButton();
    } else {
      exitBulkDeleteMode();
    }
  };
  function updateConfirmButton() {
    confirmDeleteBtn.querySelector("span").textContent = `\u786E\u8BA4\u5220\u9664 (${selectedForDelete.size})`;
  }
  confirmDeleteBtn.onclick = async () => {
    if (selectedForDelete.size === 0) return;
    if (confirm(`\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${selectedForDelete.size} \u4E2A\u9884\u8BBE\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF01`)) {
      let deletedCount = 0;
      for (const presetName of selectedForDelete) {
        if (presetName === defaultPresetName) {
          continue;
        }
        const preset = presets[presetName];
        if (preset) {
          const imageIds = preset[imageIdField] || [];
          for (const imageId of imageIds) {
            try {
              await deleteConfigImage(imageId);
            } catch (e) {
              console.warn(`Failed to delete image ${imageId} for ${presetName}`);
            }
          }
          if (preset.previewImageId) {
            try {
              await deleteConfigImage(preset.previewImageId);
            } catch (e) {
              console.warn(`Failed to delete preview image for ${presetName}`);
            }
          }
        }
        if (presets[presetName]) {
          delete presets[presetName];
          deletedCount++;
        }
        removeMember(settings3, groupScope, presetName);
        if (settings3[currentPresetIdKey] === presetName) {
          settings3[currentPresetIdKey] = defaultPresetName;
        }
      }
      await saveSettingsDebounced();
      alert(`\u6210\u529F\u5220\u9664 ${deletedCount} \u4E2A\u9884\u8BBE\u3002`);
      exitBulkDeleteMode();
      updateFilteredPresets();
      const totalPages = Math.ceil(filteredPresetNames.length / pageSize) || 1;
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      renderCurrentPage();
      if (groupDropdown) groupDropdown.refresh();
      if (onRefresh) onRefresh();
    }
  };
  const grid = backdrop.querySelector(".st-chatu8-preset-grid");
  const paginationPrev = backdrop.querySelector(".st-chatu8-pagination-prev");
  const paginationNext = backdrop.querySelector(".st-chatu8-pagination-next");
  const paginationCurrent = backdrop.querySelector(".st-chatu8-pagination-current");
  const paginationTotal = backdrop.querySelector(".st-chatu8-pagination-total");
  const paginationCount = backdrop.querySelector(".st-chatu8-pagination-count");
  const paginationSizeSelect = backdrop.querySelector(".st-chatu8-pagination-size");
  const getAllPresetNames = () => Object.keys(presets).sort(
    (a, b) => a.localeCompare(b, "zh-CN", { sensitivity: "base" })
  );
  const currentPresetId = settings3[currentPresetIdKey];
  groupDropdown = createGroupDropdown({
    container: toggleBtn.parentNode,
    insertBefore: bulkDeleteBtn,
    settings: settings3,
    scope: groupScope,
    getAllNames: getAllPresetNames,
    onFilterChange: (groupId) => {
      currentGroupId = groupId;
      currentPage = 1;
      updateFilteredPresets();
      renderCurrentPage();
    }
  });
  groupManageBtn = createGroupManageButton({
    container: toggleBtn.parentNode,
    insertBefore: bulkDeleteBtn,
    settings: settings3,
    scope: groupScope,
    getAllNames: getAllPresetNames,
    onChanged: () => {
      if (groupDropdown) {
        groupDropdown.syncAfterGroupChange();
        currentGroupId = groupDropdown.getCurrentGroupId();
      }
      currentPage = 1;
      updateFilteredPresets();
      renderCurrentPage();
    }
  });
  function updateFilteredPresets() {
    const names = filterByGroup(getAllPresetNames(), settings3, groupScope, currentGroupId);
    filteredPresetNames = filterPresetsBySearch(names, presets, groupScope, searchQuery);
  }
  function updatePaginationUI() {
    const totalPages = Math.ceil(filteredPresetNames.length / pageSize) || 1;
    paginationCurrent.textContent = currentPage;
    paginationTotal.textContent = totalPages;
    paginationCount.textContent = filteredPresetNames.length;
    paginationPrev.disabled = currentPage <= 1;
    paginationPrev.style.opacity = currentPage <= 1 ? "0.5" : "1";
    paginationPrev.style.cursor = currentPage <= 1 ? "not-allowed" : "pointer";
    paginationNext.disabled = currentPage >= totalPages;
    paginationNext.style.opacity = currentPage >= totalPages ? "0.5" : "1";
    paginationNext.style.cursor = currentPage >= totalPages ? "not-allowed" : "pointer";
  }
  async function renderCurrentPage() {
    grid.style.opacity = "0";
    grid.style.transform = "translateY(10px)";
    await new Promise((resolve) => setTimeout(resolve, 150));
    grid.innerHTML = "";
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagePresets = filteredPresetNames.slice(startIndex, endIndex);
    for (const presetName of pagePresets) {
      const preset = presets[presetName];
      const card = await createPresetCard({
        presetName,
        preset,
        isSelected: presetName === currentPresetId,
        imageIdField,
        defaultPresetName,
        presets,
        settings: settings3,
        currentPresetIdKey,
        groupScope,
        onCardClick: handleCardClick,
        onRefreshGrid: () => {
          updateFilteredPresets();
          renderCurrentPage();
        },
        onGroupChanged: () => {
          if (groupDropdown) groupDropdown.refresh();
          if (groupManageBtn) groupManageBtn.refresh();
        },
        onCloseDialog: closeDialog,
        onRefresh,
        loadPresetData
      });
      card.dataset.presetName = presetName;
      grid.appendChild(card);
    }
    syncCardSelection();
    bulkControls.refresh();
    updatePaginationUI();
    grid.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    grid.style.opacity = "1";
    grid.style.transform = "translateY(0)";
  }
  async function refreshGrid() {
    updateFilteredPresets();
    await renderCurrentPage();
  }
  const handleCardClick = (name, cardElement) => {
    if (isBulkDeleteMode) {
      if (name === defaultPresetName) {
        toastr.warning("\u4E0D\u80FD\u5220\u9664\u9ED8\u8BA4\u9884\u8BBE");
        return;
      }
      if (selectedForDelete.has(name)) {
        selectedForDelete.delete(name);
        cardElement.classList.remove("selected-for-delete");
      } else {
        selectedForDelete.add(name);
        cardElement.classList.add("selected-for-delete");
      }
      updateConfirmButton();
      bulkControls.refresh();
    } else {
      settings3[currentPresetIdKey] = name;
      saveSettingsDebounced();
      if (loadPresetData) loadPresetData(name);
      if (onRefresh) onRefresh();
      if (onSelect) onSelect(name);
      closeDialog();
    }
  };
  paginationPrev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  };
  paginationNext.onclick = () => {
    const totalPages = Math.ceil(filteredPresetNames.length / pageSize) || 1;
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  };
  paginationSizeSelect.onchange = (e) => {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderCurrentPage();
  };
  parent.appendChild(backdrop);
  updateFilteredPresets();
  await renderCurrentPage();
}

async function createPresetCard(config) {
  const {
    presetName,
    preset,
    isSelected,
    imageIdField,
    defaultPresetName,
    presets,
    settings: settings3,
    currentPresetIdKey,
    groupScope,
    onCardClick,
    onRefreshGrid,
    onGroupChanged,
    onCloseDialog,
    onRefresh,
    loadPresetData
  } = config;
  const card = document.createElement("div");
  card.className = "st-chatu8-preset-card" + (isSelected ? " selected" : "");
  const imageContainer = document.createElement("div");
  imageContainer.className = "st-chatu8-preset-card-image";
  let previewImageData = null;
  const imageIds = preset?.[imageIdField] || [];
  if (imageIds.length > 0) {
    const latestImageId = imageIds[imageIds.length - 1];
    try {
      previewImageData = await getConfigImage(latestImageId);
    } catch (e) {
      console.warn("\u52A0\u8F7D\u9884\u8BBE\u9884\u89C8\u56FE\u5931\u8D25:", e);
    }
  }
  if (!previewImageData && preset?.previewImageId) {
    try {
      previewImageData = await getConfigImage(preset.previewImageId);
    } catch (e) {
      console.warn("\u52A0\u8F7D\u9884\u8BBE\u9884\u89C8\u56FE\u5931\u8D25:", e);
    }
  }
  if (previewImageData) {
    const img = document.createElement("img");
    img.src = previewImageData;
    img.alt = presetName;
    imageContainer.appendChild(img);
  } else {
    addPlaceholder(imageContainer);
  }
  const actions = document.createElement("div");
  actions.className = "st-chatu8-preset-card-actions";
  const uploadBtn = document.createElement("button");
  uploadBtn.className = "st-chatu8-preset-action-btn";
  uploadBtn.title = "\u4E0A\u4F20/\u4FEE\u6539\u9884\u89C8\u56FE";
  uploadBtn.innerHTML = '<i class="fa-solid fa-image"></i>';
  uploadBtn.onclick = (e) => {
    e.stopPropagation();
    handleImageUpload(presetName, presets, imageIdField, imageContainer);
  };
  actions.appendChild(uploadBtn);
  if (previewImageData) {
    const deleteImgBtn = document.createElement("button");
    deleteImgBtn.className = "st-chatu8-preset-action-btn danger";
    deleteImgBtn.title = "\u5220\u9664\u9884\u89C8\u56FE";
    deleteImgBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    deleteImgBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`\u786E\u5B9A\u8981\u5220\u9664\u9884\u8BBE "${presetName}" \u7684\u9884\u89C8\u56FE\u5417\uFF1F`)) {
        const ids = preset?.[imageIdField] || [];
        for (const id of ids) {
          await deleteConfigImage(id);
        }
        if (preset?.previewImageId) {
          await deleteConfigImage(preset.previewImageId);
          delete preset.previewImageId;
        }
        preset[imageIdField] = [];
        saveSettingsDebounced();
        refreshCardImage(imageContainer, null);
      }
    };
    actions.appendChild(deleteImgBtn);
  }
  actions.appendChild(createGroupTagButton({
    settings: settings3,
    scope: groupScope,
    itemName: presetName,
    onChanged: onGroupChanged
  }));
  const renameBtn = document.createElement("button");
  renameBtn.className = "st-chatu8-preset-action-btn";
  renameBtn.title = "\u91CD\u547D\u540D\u9884\u8BBE";
  renameBtn.innerHTML = '<i class="fa-solid fa-pen-nib"></i>';
  renameBtn.onclick = async (e) => {
    e.stopPropagation();
    if (presetName === defaultPresetName) {
      alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u91CD\u547D\u540D");
      return;
    }
    const newName = prompt(`\u8BF7\u8F93\u5165\u65B0\u7684\u9884\u8BBE\u540D\u79F0 (\u5F53\u524D: ${presetName}):`, presetName);
    if (newName && newName !== presetName) {
      if (presets[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002");
        return;
      }
      presets[newName] = presets[presetName];
      delete presets[presetName];
      if (settings3[currentPresetIdKey] === presetName) {
        settings3[currentPresetIdKey] = newName;
      }
      if (settings3.characterEnablePresets) {
        for (const enablePresetId in settings3.characterEnablePresets) {
          const enablePreset = settings3.characterEnablePresets[enablePresetId];
          if (enablePreset.characters && Array.isArray(enablePreset.characters)) {
            let changed = false;
            enablePreset.characters = enablePreset.characters.map((entry) => {
              if (typeof entry === "string") {
                if (entry === presetName) changed = true;
                return entry === presetName ? newName : entry;
              }
              if (entry?.characterPresetName === presetName) {
                changed = true;
                return { ...entry, characterPresetName: newName };
              }
              return entry;
            });
            if (changed) {
              console.log(`[CharacterVisualSelector] \u5DF2\u66F4\u65B0 characterEnablePresets[${enablePresetId}] \u4E2D\u7684\u89D2\u8272 ID: ${presetName} -> ${newName}`);
            }
          }
        }
      }
      if (settings3.characterCommonPresets) {
        for (const commonPresetId in settings3.characterCommonPresets) {
          const commonPreset = settings3.characterCommonPresets[commonPresetId];
          if (commonPreset.characters && Array.isArray(commonPreset.characters)) {
            const index = commonPreset.characters.indexOf(presetName);
            if (index !== -1) {
              commonPreset.characters[index] = newName;
              console.log(`[CharacterVisualSelector] \u5DF2\u66F4\u65B0 characterCommonPresets[${commonPresetId}] \u4E2D\u7684\u89D2\u8272 ID: ${presetName} -> ${newName}`);
            }
          }
        }
      }
      if (settings3.outfitEnablePresets) {
        for (const enablePresetId in settings3.outfitEnablePresets) {
          const enablePreset = settings3.outfitEnablePresets[enablePresetId];
          if (enablePreset.outfits && Array.isArray(enablePreset.outfits)) {
            const index = enablePreset.outfits.indexOf(presetName);
            if (index !== -1) {
              enablePreset.outfits[index] = newName;
              console.log(`[CharacterVisualSelector] \u5DF2\u66F4\u65B0 outfitEnablePresets[${enablePresetId}] \u4E2D\u7684\u670D\u88C5 ID: ${presetName} -> ${newName}`);
            }
          }
        }
      }
      if (settings3.characterPresets) {
        for (const charPresetId in settings3.characterPresets) {
          const charPreset = settings3.characterPresets[charPresetId];
          if (charPreset.outfits && Array.isArray(charPreset.outfits)) {
            const index = charPreset.outfits.indexOf(presetName);
            if (index !== -1) {
              charPreset.outfits[index] = newName;
              console.log(`[CharacterVisualSelector] \u5DF2\u66F4\u65B0 characterPresets[${charPresetId}].outfits \u4E2D\u7684\u670D\u88C5 ID: ${presetName} -> ${newName}`);
            }
          }
        }
      }
      renameMember(settings3, groupScope, presetName, newName);
      saveSettingsDebounced();
      if (onRefresh) onRefresh();
      if (onGroupChanged) onGroupChanged();
      await onRefreshGrid();
    }
  };
  actions.appendChild(renameBtn);
  const deletePresetBtn = document.createElement("button");
  deletePresetBtn.className = "st-chatu8-preset-action-btn danger";
  deletePresetBtn.title = "\u5220\u9664\u6B64\u9884\u8BBE";
  deletePresetBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
  deletePresetBtn.onclick = async (e) => {
    e.stopPropagation();
    if (presetName === defaultPresetName) {
      alert("\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u80FD\u5220\u9664");
      return;
    }
    if (confirm(`\u786E\u5B9A\u8981\u5F7B\u5E95\u5220\u9664\u9884\u8BBE "${presetName}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF01`)) {
      const ids = preset?.[imageIdField] || [];
      for (const id of ids) {
        await deleteConfigImage(id);
      }
      if (preset?.previewImageId) {
        await deleteConfigImage(preset.previewImageId);
      }
      delete presets[presetName];
      removeMember(settings3, groupScope, presetName);
      const isDeletingCurrentPreset = settings3[currentPresetIdKey] === presetName;
      if (isDeletingCurrentPreset) {
        settings3[currentPresetIdKey] = defaultPresetName;
        if (loadPresetData) loadPresetData(defaultPresetName);
      }
      saveSettingsDebounced();
      if (onRefresh) onRefresh();
      if (isDeletingCurrentPreset) {
        if (onCloseDialog) onCloseDialog();
      } else {
        if (onGroupChanged) onGroupChanged();
        await onRefreshGrid();
      }
    }
  };
  actions.appendChild(deletePresetBtn);
  imageContainer.appendChild(actions);
  card.appendChild(imageContainer);
  const nameLabel = document.createElement("div");
  nameLabel.className = "st-chatu8-preset-card-name";
  nameLabel.textContent = presetName;
  card.appendChild(nameLabel);
  card.onclick = () => onCardClick(presetName, card);
  return card;
}

function addPlaceholder(container) {
  const placeholder = document.createElement("div");
  placeholder.className = "st-chatu8-preset-card-placeholder";
  placeholder.innerHTML = '<i class="fa-solid fa-image"></i>';
  container.appendChild(placeholder);
}

async function refreshCardImage(container, imageData) {
  const actions = container.querySelector(".st-chatu8-preset-card-actions");
  container.innerHTML = "";
  if (imageData) {
    const img = document.createElement("img");
    img.src = imageData;
    container.appendChild(img);
  } else {
    addPlaceholder(container);
  }
  if (actions) {
    container.appendChild(actions);
  }
}

function handleImageUpload(presetName, presets, imageIdField, container) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const base64 = readerEvent.target.result;
        const newImageId = await saveConfigImage(base64, {
          format: file.type.split("/")[1] || "png",
          filename: `preset_${presetName}_preview`
        });
        if (!presets[presetName]) {
          presets[presetName] = {};
        }
        if (!presets[presetName][imageIdField]) {
          presets[presetName][imageIdField] = [];
        }
        presets[presetName][imageIdField].push(newImageId);
        saveSettingsDebounced();
        refreshCardImage(container, base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("\u4E0A\u4F20\u9884\u89C8\u56FE\u5931\u8D25:", error);
      alert("\u4E0A\u4F20\u9884\u89C8\u56FE\u5931\u8D25: " + error.message);
    }
  };
  input.click();
}

export { showCharacterVisualSelector, showOutfitVisualSelector };
