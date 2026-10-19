// 还原自打包产物 — 原始模块: utils/settings/presetVisualSelector.js
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { deleteConfigImage, getConfigImage, saveConfigImage } from "../configDatabase.js";
import { getSuffix } from "../ui_common.js";
import { createBulkSelectControls } from "./bulkSelectControls.js";
import { createGroupDropdown, createGroupManageButton, createGroupTagButton, filterByGroup, removeMember, renameMember } from "./presetGroupManager.js";
import { filterPresetsBySearch } from "./presetSearchMatcher.js";
import { GROUP_SCOPE } from "./prompt.js";
import "../config.js"; // init_config

async function showPresetVisualSelector(mode, settings3, onSelect) {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const backdrop = document.createElement("div");
  backdrop.className = "st-chatu8-workflow-viz-backdrop";
  const selectedForDelete = /* @__PURE__ */ new Set();
  let isBulkDeleteMode = false;
  let currentPage = 1;
  let pageSize = settings3.presetVisualPageSize || 12;
  let filteredPresets = [];
  let gridColumns = settings3.presetVisualGridColumns || 6;
  let currentGroupId = null;
  let groupDropdown = null;
  let groupManageBtn = null;
  backdrop.innerHTML = `
        <div class="st-chatu8-workflow-viz-dialog st-chatu8-preset-viz-dialog-wrapper">
            <div class="st-chatu8-workflow-viz-header">
                <h3>\u9009\u62E9\u63D0\u793A\u8BCD\u9884\u8BBE</h3>
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
                        <option value="8" ${pageSize === 8 ? "selected" : ""}>8</option>
                        <option value="12" ${pageSize === 12 ? "selected" : ""}>12</option>
                        <option value="16" ${pageSize === 16 ? "selected" : ""}>16</option>
                        <option value="24" ${pageSize === 24 ? "selected" : ""}>24</option>
                        <option value="48" ${pageSize === 48 ? "selected" : ""}>48</option>
                    </select>
                </div>
                <div style="margin-left: 16px; display: flex; align-items: center; gap: 6px;">
                    <span style="color: #888; font-size: 0.85em;">\u6BCF\u884C</span>
                    <select class="st-chatu8-grid-columns-select" style="padding: 4px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #ccc; cursor: pointer; font-size: 0.85em;">
                        <option value="4" ${gridColumns === 4 ? "selected" : ""}>4</option>
                        <option value="6" ${gridColumns === 6 ? "selected" : ""}>6</option>
                        <option value="8" ${gridColumns === 8 ? "selected" : ""}>8</option>
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
    window.removeEventListener("resize", handleResize);
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
  let searchQuery = "";
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
    // "默认" 是删除后的兜底预设（settings.yusheid* 会重置到它），
    // 不纳入全选/反选范围，避免一次全选把兜底也删掉
    getSelectable: () => filteredPresets.filter((name) => name !== "\u9ED8\u8BA4"),
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
        const preset = settings3.yushe[presetName];
        if (preset && preset.previewImageId) {
          try {
            await deleteConfigImage(preset.previewImageId);
          } catch (e) {
            console.warn(`Failed to delete image for ${presetName}`);
          }
        }
        if (settings3.yushe[presetName]) {
          delete settings3.yushe[presetName];
          deletedCount++;
        }
        removeMember(settings3, GROUP_SCOPE, presetName);
        const suffix2 = getSuffix(mode);
        const yusheIdKey2 = `yusheid${mode === "sd" ? "_sd" : suffix2}`;
        if (settings3[yusheIdKey2] === presetName) {
          settings3[yusheIdKey2] = "\u9ED8\u8BA4";
        }
      }
      await saveSettingsDebounced();
      alert(`\u6210\u529F\u5220\u9664 ${deletedCount} \u4E2A\u9884\u8BBE\u3002`);
      exitBulkDeleteMode();
      updateFilteredPresets();
      const totalPages = Math.ceil(filteredPresets.length / pageSize) || 1;
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      renderCurrentPage();
      if (groupDropdown) groupDropdown.refresh();
    }
  };
  const grid = backdrop.querySelector(".st-chatu8-preset-grid");
  const suffix = getSuffix(mode);
  const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
  const currentPresetId = settings3[yusheIdKey];
  const presets = settings3.yushe || {};
  const getAllPresetNames = () => Object.keys(presets);
  groupDropdown = createGroupDropdown({
    container: toggleBtn.parentNode,
    insertBefore: bulkDeleteBtn,
    settings: settings3,
    scope: GROUP_SCOPE,
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
    scope: GROUP_SCOPE,
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
  const paginationPrev = backdrop.querySelector(".st-chatu8-pagination-prev");
  const paginationNext = backdrop.querySelector(".st-chatu8-pagination-next");
  const paginationCurrent = backdrop.querySelector(".st-chatu8-pagination-current");
  const paginationTotal = backdrop.querySelector(".st-chatu8-pagination-total");
  const paginationCount = backdrop.querySelector(".st-chatu8-pagination-count");
  const paginationSizeSelect = backdrop.querySelector(".st-chatu8-pagination-size");
  const gridColumnsSelect = backdrop.querySelector(".st-chatu8-grid-columns-select");
  function updateFilteredPresets() {
    const names = filterByGroup(getAllPresetNames(), settings3, GROUP_SCOPE, currentGroupId);
    filteredPresets = filterPresetsBySearch(names, presets, GROUP_SCOPE, searchQuery);
  }
  function updateGridLayout() {
    if (window.innerWidth > 1400) {
      grid.style.columnCount = gridColumns;
    } else {
      grid.style.columnCount = "";
    }
  }
  function handleResize() {
    updateGridLayout();
  }
  function updatePaginationUI() {
    const totalPages = Math.ceil(filteredPresets.length / pageSize) || 1;
    paginationCurrent.textContent = currentPage;
    paginationTotal.textContent = totalPages;
    paginationCount.textContent = filteredPresets.length;
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
    const pagePresets = filteredPresets.slice(startIndex, endIndex);
    for (const presetName of pagePresets) {
      const preset = presets[presetName];
      const card = await createPresetCard2(presetName, preset, presetName === currentPresetId, settings3, mode, handleCardClick, {
        // 归属变了只刷新下拉框计数，网格不动，免得卡片在用户脚下重排
        onGroupChanged: () => {
          if (groupDropdown) groupDropdown.refresh();
          if (groupManageBtn) groupManageBtn.refresh();
        },
        onRefreshGrid: () => {
          updateFilteredPresets();
          renderCurrentPage();
          if (groupDropdown) groupDropdown.refresh();
        },
        onCloseDialog: closeDialog
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
  const handleCardClick = (name, cardElement) => {
    if (isBulkDeleteMode) {
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
      onSelect(name);
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
    const totalPages = Math.ceil(filteredPresets.length / pageSize) || 1;
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  };
  paginationSizeSelect.onchange = (e) => {
    pageSize = parseInt(e.target.value);
    settings3.presetVisualPageSize = pageSize;
    saveSettingsDebounced();
    currentPage = 1;
    renderCurrentPage();
  };
  gridColumnsSelect.onchange = (e) => {
    gridColumns = parseInt(e.target.value);
    settings3.presetVisualGridColumns = gridColumns;
    saveSettingsDebounced();
    updateGridLayout();
  };
  parent.appendChild(backdrop);
  window.addEventListener("resize", handleResize);
  updateFilteredPresets();
  updateGridLayout();
  renderCurrentPage();
}

async function createPresetCard2(presetName, preset, isSelected, settings3, mode, onClick, hooks = {}) {
  const { onGroupChanged, onRefreshGrid, onCloseDialog } = hooks;
  const card = document.createElement("div");
  card.className = "st-chatu8-preset-card" + (isSelected ? " selected" : "");
  const imageContainer = document.createElement("div");
  imageContainer.className = "st-chatu8-preset-card-image";
  const previewImageId = preset.previewImageId;
  if (previewImageId) {
    try {
      const imageData = await getConfigImage(previewImageId);
      if (imageData) {
        const img = document.createElement("img");
        img.src = imageData;
        img.alt = presetName;
        imageContainer.appendChild(img);
      } else {
        addPlaceholder2(imageContainer);
      }
    } catch (e) {
      console.error("\u52A0\u8F7D\u9884\u8BBE\u9884\u89C8\u56FE\u5931\u8D25:", e);
      addPlaceholder2(imageContainer);
    }
  } else {
    addPlaceholder2(imageContainer);
  }
  const actions = document.createElement("div");
  actions.className = "st-chatu8-preset-card-actions";
  const uploadBtn = document.createElement("button");
  uploadBtn.className = "st-chatu8-preset-action-btn";
  uploadBtn.title = "\u4E0A\u4F20/\u4FEE\u6539\u9884\u89C8\u56FE (Upload Preview)";
  uploadBtn.innerHTML = '<i class="fa-solid fa-image"></i>';
  uploadBtn.onclick = (e) => {
    e.stopPropagation();
    handleImageUpload2(presetName, settings3, imageContainer);
  };
  actions.appendChild(uploadBtn);
  if (previewImageId) {
    const deleteImgBtn = document.createElement("button");
    deleteImgBtn.className = "st-chatu8-preset-action-btn danger";
    deleteImgBtn.title = "\u5220\u9664\u9884\u89C8\u56FE (Delete Preview)";
    deleteImgBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    deleteImgBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`\u786E\u5B9A\u8981\u5220\u9664\u9884\u8BBE "${presetName}" \u7684\u9884\u89C8\u56FE\u5417\uFF1F`)) {
        await deleteConfigImage(previewImageId);
        delete preset.previewImageId;
        saveSettingsDebounced();
        refreshCardImage2(imageContainer, null);
      }
    };
    actions.appendChild(deleteImgBtn);
  }
  actions.appendChild(createGroupTagButton({
    settings: settings3,
    scope: GROUP_SCOPE,
    itemName: presetName,
    onChanged: onGroupChanged
  }));
  const renameBtn = document.createElement("button");
  renameBtn.className = "st-chatu8-preset-action-btn";
  renameBtn.title = "\u91CD\u547D\u540D\u9884\u8BBE (Rename Preset)";
  renameBtn.innerHTML = '<i class="fa-solid fa-pen-nib"></i>';
  renameBtn.onclick = (e) => {
    e.stopPropagation();
    const newName = prompt(`\u8BF7\u8F93\u5165\u65B0\u7684\u9884\u8BBE\u540D\u79F0 (Current: ${presetName}):`, presetName);
    if (newName && newName !== presetName) {
      if (settings3.yushe[newName]) {
        alert("\u8BE5\u540D\u79F0\u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002");
        return;
      }
      settings3.yushe[newName] = settings3.yushe[presetName];
      delete settings3.yushe[presetName];
      const suffix = getSuffix(mode);
      const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
      if (settings3[yusheIdKey] === presetName) {
        settings3[yusheIdKey] = newName;
      }
      renameMember(settings3, GROUP_SCOPE, presetName, newName);
      saveSettingsDebounced();
      if (onRefreshGrid) onRefreshGrid();
    }
  };
  actions.appendChild(renameBtn);
  const deletePresetBtn = document.createElement("button");
  deletePresetBtn.className = "st-chatu8-preset-action-btn danger";
  deletePresetBtn.title = "\u5220\u9664\u6B64\u9884\u8BBE (Delete Preset)";
  deletePresetBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
  deletePresetBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm(`\u786E\u5B9A\u8981\u5F7B\u5E95\u5220\u9664\u9884\u8BBE "${presetName}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF01`)) {
      if (preset.previewImageId) {
        deleteConfigImage(preset.previewImageId);
      }
      delete settings3.yushe[presetName];
      removeMember(settings3, GROUP_SCOPE, presetName);
      const suffix = getSuffix(mode);
      const yusheIdKey = `yusheid${mode === "sd" ? "_sd" : suffix}`;
      const isDeletingCurrentPreset = settings3[yusheIdKey] === presetName;
      if (isDeletingCurrentPreset) {
        settings3[yusheIdKey] = "\u9ED8\u8BA4";
      }
      saveSettingsDebounced();
      if (isDeletingCurrentPreset) {
        if (onCloseDialog) onCloseDialog();
        if (typeof window.loadSilterTavernChatu8Settings === "function") {
          window.loadSilterTavernChatu8Settings();
        }
      } else {
        if (onRefreshGrid) onRefreshGrid();
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
  card.onclick = () => onClick(presetName, card);
  return card;
}

function addPlaceholder2(container) {
  const placeholder = document.createElement("div");
  placeholder.className = "st-chatu8-preset-card-placeholder";
  placeholder.innerHTML = '<i class="fa-solid fa-image"></i>';
  container.appendChild(placeholder);
}

async function refreshCardImage2(container, imageId) {
  const actions = container.querySelector(".st-chatu8-preset-card-actions");
  container.innerHTML = "";
  if (imageId) {
    try {
      const imageData = await getConfigImage(imageId);
      if (imageData) {
        const img = document.createElement("img");
        img.src = imageData;
        container.appendChild(img);
      } else {
        addPlaceholder2(container);
      }
    } catch (e) {
      addPlaceholder2(container);
    }
  } else {
    addPlaceholder2(container);
  }
  if (actions) {
    container.appendChild(actions);
  }
}

function handleImageUpload2(presetName, settings3, container) {
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
        const oldImageId = settings3.yushe[presetName]?.previewImageId;
        if (oldImageId) {
          try {
            await deleteConfigImage(oldImageId);
          } catch (e2) {
            console.warn("\u5220\u9664\u65E7\u9884\u89C8\u56FE\u5931\u8D25:", e2);
          }
        }
        const newImageId = await saveConfigImage(base64, {
          format: file.type.split("/")[1] || "png",
          filename: `preset_${presetName}_preview`
        });
        if (!settings3.yushe[presetName]) {
          settings3.yushe[presetName] = {};
        }
        settings3.yushe[presetName].previewImageId = newImageId;
        saveSettingsDebounced();
        refreshCardImage2(container, newImageId);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("\u4E0A\u4F20\u9884\u89C8\u56FE\u5931\u8D25:", error);
      alert("\u4E0A\u4F20\u9884\u89C8\u56FE\u5931\u8D25: " + error.message);
    }
  };
  input.click();
}

export { showPresetVisualSelector };
