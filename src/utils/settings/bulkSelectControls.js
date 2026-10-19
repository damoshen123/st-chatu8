// 还原自打包产物 — 原始模块: utils/settings/bulkSelectControls.js
function createBulkSelectControls(config) {
  const {
    container,
    insertBefore = null,
    selected,
    getSelectable,
    onChange,
    style = "pill"
  } = config;
  const group = document.createElement("div");
  group.className = "st-chatu8-bulk-select-controls";
  group.style.display = "none";
  group.style.gap = style === "pill" ? "10px" : "8px";
  group.style.alignItems = "center";
  const makeBtn = (cls, icon, label, title) => {
    const btn = document.createElement(style === "pill" ? "div" : "button");
    btn.className = style === "pill" ? `st-chatu8-bulk-select-btn ${cls}` : `st-chatu8-btn st-chatu8-btn-secondary ${cls}`;
    btn.title = title;
    if (style === "pill") {
      btn.style.cssText = "cursor: pointer; padding: 6px 14px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.9em; user-select: none; white-space: nowrap; display: flex; align-items: center; gap: 6px; transition: all 0.3s;";
    }
    btn.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${label}</span>`;
    return btn;
  };
  const selectAllBtn = makeBtn("st-chatu8-bulk-select-all", "fa-check-double", "\u5168\u9009", "\u5168\u9009\u5F53\u524D\u7B5B\u9009\u7ED3\u679C\uFF08\u8DE8\u9875\u751F\u6548\uFF09");
  const invertBtn = makeBtn("st-chatu8-bulk-select-invert", "fa-right-left", "\u53CD\u9009", "\u53CD\u9009\u5F53\u524D\u7B5B\u9009\u7ED3\u679C\uFF08\u8DE8\u9875\u751F\u6548\uFF09");
  const clearBtn = makeBtn("st-chatu8-bulk-select-clear", "fa-eraser", "\u6E05\u7A7A", "\u6E05\u7A7A\u5DF2\u9009");
  group.appendChild(selectAllBtn);
  group.appendChild(invertBtn);
  group.appendChild(clearBtn);
  if (insertBefore && insertBefore.parentNode === container) {
    container.insertBefore(group, insertBefore);
  } else {
    container.appendChild(group);
  }
  function isAllSelected() {
    const selectable = getSelectable();
    return selectable.length > 0 && selectable.every((name) => selected.has(name));
  }
  function refresh() {
    const selectable = getSelectable();
    const allSelected = isAllSelected();
    selectAllBtn.querySelector("span").textContent = allSelected ? "\u53D6\u6D88\u5168\u9009" : "\u5168\u9009";
    selectAllBtn.querySelector("i").className = allSelected ? "fa-solid fa-square-minus" : "fa-solid fa-check-double";
    selectAllBtn.title = allSelected ? "\u53D6\u6D88\u5168\u9009\u5F53\u524D\u7B5B\u9009\u7ED3\u679C" : "\u5168\u9009\u5F53\u524D\u7B5B\u9009\u7ED3\u679C\uFF08\u8DE8\u9875\u751F\u6548\uFF09";
    const noSelectable = selectable.length === 0;
    [selectAllBtn, invertBtn].forEach((btn) => {
      btn.style.opacity = noSelectable ? "0.5" : "1";
      btn.style.cursor = noSelectable ? "not-allowed" : "pointer";
    });
    const noSelection = selected.size === 0;
    clearBtn.style.opacity = noSelection ? "0.5" : "1";
    clearBtn.style.cursor = noSelection ? "not-allowed" : "pointer";
  }
  selectAllBtn.onclick = () => {
    const selectable = getSelectable();
    if (selectable.length === 0) return;
    if (isAllSelected()) {
      selectable.forEach((name) => selected.delete(name));
    } else {
      selectable.forEach((name) => selected.add(name));
    }
    onChange();
    refresh();
  };
  invertBtn.onclick = () => {
    const selectable = getSelectable();
    if (selectable.length === 0) return;
    selectable.forEach((name) => {
      if (selected.has(name)) {
        selected.delete(name);
      } else {
        selected.add(name);
      }
    });
    onChange();
    refresh();
  };
  clearBtn.onclick = () => {
    if (selected.size === 0) return;
    selected.clear();
    onChange();
    refresh();
  };
  return {
    show() {
      group.style.display = "flex";
      refresh();
    },
    hide() {
      group.style.display = "none";
    },
    refresh
  };
}

export { createBulkSelectControls };
