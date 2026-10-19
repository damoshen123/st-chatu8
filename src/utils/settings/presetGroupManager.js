// 还原自打包产物 — 原始模块: utils/settings/presetGroupManager.js
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { showToast, stylInput, stylishConfirm } from "../ui_common.js";

var UNGROUPED;

UNGROUPED = "__ungrouped__";

function ensureStore(settings3, scope) {
  if (!settings3.presetGroups || typeof settings3.presetGroups !== "object") {
    settings3.presetGroups = {};
  }
  if (!Array.isArray(settings3.presetGroups[scope])) {
    settings3.presetGroups[scope] = [];
  }
  return settings3.presetGroups[scope];
}

function getGroups(settings3, scope) {
  return ensureStore(settings3, scope);
}

function createGroup(settings3, scope, name) {
  const groups = ensureStore(settings3, scope);
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  if (groups.some((g) => g.name === trimmed)) return null;
  const group = {
    id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    members: []
  };
  groups.push(group);
  saveSettingsDebounced();
  return group;
}

function renameGroup(settings3, scope, groupId, newName) {
  const groups = ensureStore(settings3, scope);
  const trimmed = String(newName || "").trim();
  if (!trimmed) return false;
  const group = groups.find((g) => g.id === groupId);
  if (!group) return false;
  if (groups.some((g) => g.id !== groupId && g.name === trimmed)) return false;
  group.name = trimmed;
  saveSettingsDebounced();
  return true;
}

function deleteGroup(settings3, scope, groupId) {
  const groups = ensureStore(settings3, scope);
  const index = groups.findIndex((g) => g.id === groupId);
  if (index === -1) return false;
  groups.splice(index, 1);
  saveSettingsDebounced();
  return true;
}

function moveGroup(settings3, scope, groupId, delta) {
  const groups = ensureStore(settings3, scope);
  const from = groups.findIndex((g) => g.id === groupId);
  if (from === -1) return false;
  const to = from + delta;
  if (to < 0 || to >= groups.length) return false;
  [groups[from], groups[to]] = [groups[to], groups[from]];
  saveSettingsDebounced();
  return true;
}

function getGroupsOf(settings3, scope, itemName) {
  return ensureStore(settings3, scope).filter((g) => g.members.includes(itemName)).map((g) => g.id);
}

function toggleMembership(settings3, scope, groupId, itemName, on) {
  const group = ensureStore(settings3, scope).find((g) => g.id === groupId);
  if (!group) return;
  const index = group.members.indexOf(itemName);
  if (on && index === -1) {
    group.members.push(itemName);
  } else if (!on && index !== -1) {
    group.members.splice(index, 1);
  } else {
    return;
  }
  saveSettingsDebounced();
}

function filterByGroup(names, settings3, scope, groupId) {
  if (!groupId) return names;
  const groups = ensureStore(settings3, scope);
  if (groupId === UNGROUPED) {
    const grouped = new Set(groups.flatMap((g) => g.members));
    return names.filter((name) => !grouped.has(name));
  }
  const group = groups.find((g) => g.id === groupId);
  if (!group) return names;
  const members = new Set(group.members);
  return names.filter((name) => members.has(name));
}

function renameMember(settings3, scope, oldName, newName) {
  let changed = false;
  for (const group of ensureStore(settings3, scope)) {
    const index = group.members.indexOf(oldName);
    if (index !== -1) {
      if (group.members.includes(newName)) {
        group.members.splice(index, 1);
      } else {
        group.members[index] = newName;
      }
      changed = true;
    }
  }
  if (changed) saveSettingsDebounced();
}

function removeMember(settings3, scope, itemName) {
  let changed = false;
  for (const group of ensureStore(settings3, scope)) {
    const index = group.members.indexOf(itemName);
    if (index !== -1) {
      group.members.splice(index, 1);
      changed = true;
    }
  }
  if (changed) saveSettingsDebounced();
}

function countMembers(group, allNames) {
  const existing = new Set(allNames);
  return group.members.reduce((sum, name) => sum + (existing.has(name) ? 1 : 0), 0);
}

function resolveHost(anchor) {
  return anchor.closest(".st-chatu8-workflow-viz-backdrop") || document.getElementById("st-chatu8-settings") || document.body;
}

function positionPanel(panel, trigger) {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  panel.style.visibility = "hidden";
  panel.style.top = "0px";
  panel.style.left = "0px";
  const panelRect = panel.getBoundingClientRect();
  let top = rect.bottom + gap;
  if (top + panelRect.height > window.innerHeight - 8) {
    const flipped = rect.top - gap - panelRect.height;
    top = flipped >= 8 ? flipped : Math.max(8, window.innerHeight - panelRect.height - 8);
  }
  let left = rect.left;
  if (left + panelRect.width > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - panelRect.width - 8);
  }
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  panel.style.visibility = "";
}

function createFloatingPanel({ trigger, className, onOpen }) {
  const panel = document.createElement("div");
  panel.className = className;
  panel.style.display = "none";
  panel.addEventListener("click", (e) => e.stopPropagation());
  let open = false;
  const reposition = () => {
    if (open) positionPanel(panel, trigger);
  };
  const onDocClick = (e) => {
    if (!open) return;
    if (panel.contains(e.target) || trigger.contains(e.target)) return;
    api.close();
  };
  const onKeyDown = (e) => {
    if (open && e.key === "Escape") {
      e.stopPropagation();
      api.close();
    }
  };
  const api = {
    el: panel,
    isOpen: () => open,
    open() {
      if (open) return;
      if (!panel.parentNode) resolveHost(trigger).appendChild(panel);
      if (onOpen) onOpen(panel);
      panel.style.display = "";
      open = true;
      trigger.classList.add("open");
      positionPanel(panel, trigger);
      document.addEventListener("click", onDocClick, true);
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);
      document.addEventListener("keydown", onKeyDown, true);
    },
    close() {
      if (!open) return;
      open = false;
      panel.style.display = "none";
      trigger.classList.remove("open");
      document.removeEventListener("click", onDocClick, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("keydown", onKeyDown, true);
    },
    toggle() {
      open ? api.close() : api.open();
    },
    destroy() {
      api.close();
      panel.remove();
    }
  };
  return api;
}

async function promptInput(message, defaultValue = "") {
  const promise = stylInput(message, defaultValue);
  const backdrops = document.querySelectorAll(".st-chatu8-confirm-backdrop");
  const latest = backdrops[backdrops.length - 1];
  if (latest) latest.style.zIndex = "100000";
  return promise;
}

function createGroupDropdown(config) {
  const { container, insertBefore, settings: settings3, scope, getAllNames, onFilterChange } = config;
  let currentGroupId = null;
  const trigger = document.createElement("div");
  trigger.className = "st-chatu8-group-dropdown-trigger";
  trigger.innerHTML = `
        <i class="fa-solid fa-tags"></i>
        <span class="st-chatu8-group-dropdown-label">\u5168\u90E8</span>
        <span class="st-chatu8-group-dropdown-count">0</span>
        <i class="fa-solid fa-chevron-down st-chatu8-group-dropdown-arrow"></i>
    `;
  if (insertBefore) {
    container.insertBefore(trigger, insertBefore);
  } else {
    container.appendChild(trigger);
  }
  const labelEl = trigger.querySelector(".st-chatu8-group-dropdown-label");
  const countEl = trigger.querySelector(".st-chatu8-group-dropdown-count");
  const panel = createFloatingPanel({
    trigger,
    className: "st-chatu8-group-dropdown-panel",
    onOpen: () => renderPanel2()
  });
  let panelQuery = "";
  function currentLabel() {
    if (!currentGroupId) return "\u5168\u90E8";
    if (currentGroupId === UNGROUPED) return "\u672A\u5206\u7EC4";
    const group = getGroups(settings3, scope).find((g) => g.id === currentGroupId);
    return group ? group.name : "\u5168\u90E8";
  }
  function refreshTrigger() {
    const allNames = getAllNames();
    labelEl.textContent = currentLabel();
    countEl.textContent = filterByGroup(allNames, settings3, scope, currentGroupId).length;
    trigger.classList.toggle("active", !!currentGroupId);
  }
  function makeRow({ id, name, count, isActive }) {
    const row = document.createElement("div");
    row.className = "st-chatu8-group-dropdown-item" + (isActive ? " active" : "");
    row.innerHTML = `
            <span class="st-chatu8-group-dropdown-check">${isActive ? '<i class="fa-solid fa-check"></i>' : ""}</span>
            <span class="st-chatu8-group-dropdown-name"></span>
            <span class="st-chatu8-group-dropdown-count">${count}</span>
        `;
    row.querySelector(".st-chatu8-group-dropdown-name").textContent = name;
    row.onclick = () => {
      currentGroupId = id;
      refreshTrigger();
      panel.close();
      if (onFilterChange) onFilterChange(id);
    };
    return row;
  }
  function renderPanel2() {
    const allNames = getAllNames();
    const groups = getGroups(settings3, scope);
    panel.el.innerHTML = "";
    if (groups.length > 6) {
      const searchWrap = document.createElement("div");
      searchWrap.className = "st-chatu8-group-dropdown-search";
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "\u7B5B\u9009\u5206\u7EC4...";
      input.value = panelQuery;
      input.oninput = (e) => {
        panelQuery = e.target.value.toLowerCase();
        renderPanel2();
        const next = panel.el.querySelector(".st-chatu8-group-dropdown-search input");
        if (next) {
          next.focus();
          next.setSelectionRange(next.value.length, next.value.length);
        }
      };
      searchWrap.appendChild(input);
      panel.el.appendChild(searchWrap);
    } else {
      panelQuery = "";
    }
    const list = document.createElement("div");
    list.className = "st-chatu8-group-dropdown-list";
    list.appendChild(makeRow({
      id: null,
      name: "\u5168\u90E8",
      count: allNames.length,
      isActive: !currentGroupId
    }));
    list.appendChild(makeRow({
      id: UNGROUPED,
      name: "\u672A\u5206\u7EC4",
      count: filterByGroup(allNames, settings3, scope, UNGROUPED).length,
      isActive: currentGroupId === UNGROUPED
    }));
    const visible = panelQuery ? groups.filter((g) => g.name.toLowerCase().includes(panelQuery)) : groups;
    if (visible.length > 0) {
      const divider = document.createElement("div");
      divider.className = "st-chatu8-group-dropdown-divider";
      list.appendChild(divider);
      for (const group of visible) {
        list.appendChild(makeRow({
          id: group.id,
          name: group.name,
          count: countMembers(group, allNames),
          isActive: currentGroupId === group.id
        }));
      }
    } else if (groups.length === 0) {
      const empty = document.createElement("div");
      empty.className = "st-chatu8-group-dropdown-empty";
      empty.textContent = "\u8FD8\u6CA1\u6709\u5206\u7EC4";
      list.appendChild(empty);
    }
    panel.el.appendChild(list);
  }
  trigger.onclick = (e) => {
    e.stopPropagation();
    panel.toggle();
  };
  refreshTrigger();
  return {
    refresh: refreshTrigger,
    destroy: () => {
      panel.destroy();
      trigger.remove();
    },
    getCurrentGroupId: () => currentGroupId,
    /**
     * 分组在别处被改动后调用（典型场景：管理面板删掉了正在筛选的那个分组）。
     *
     * 刻意不在这里触发 onFilterChange：调用方通常紧接着就要重渲染，
     * 由它自己读一次 getCurrentGroupId 再渲染，避免渲染两遍打架。
     *
     * @returns {boolean} 筛选是否被重置回「全部」
     */
    syncAfterGroupChange() {
      let reset = false;
      if (currentGroupId && currentGroupId !== UNGROUPED) {
        const exists = getGroups(settings3, scope).some((g) => g.id === currentGroupId);
        if (!exists) {
          currentGroupId = null;
          reset = true;
        }
      }
      refreshTrigger();
      return reset;
    }
  };
}

function createGroupTagButton(config) {
  const { settings: settings3, scope, itemName, onChanged } = config;
  const btn = document.createElement("button");
  btn.className = "st-chatu8-preset-action-btn";
  btn.title = "\u52A0\u5165 / \u9000\u51FA\u5206\u7EC4";
  btn.innerHTML = '<i class="fa-solid fa-tag"></i>';
  const panel = createFloatingPanel({
    trigger: btn,
    className: "st-chatu8-group-tag-panel",
    onOpen: () => renderPanel2()
  });
  function renderPanel2() {
    const groups = getGroups(settings3, scope);
    panel.el.innerHTML = "";
    const header = document.createElement("div");
    header.className = "st-chatu8-group-tag-header";
    header.textContent = itemName;
    panel.el.appendChild(header);
    const list = document.createElement("div");
    list.className = "st-chatu8-group-tag-list";
    if (groups.length === 0) {
      const empty = document.createElement("div");
      empty.className = "st-chatu8-group-dropdown-empty";
      empty.textContent = "\u8FD8\u6CA1\u6709\u5206\u7EC4\uFF0C\u5148\u65B0\u5EFA\u4E00\u4E2A\u5427";
      list.appendChild(empty);
    } else {
      const mine = new Set(getGroupsOf(settings3, scope, itemName));
      for (const group of groups) {
        const row = document.createElement("label");
        row.className = "st-chatu8-group-tag-row";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = mine.has(group.id);
        checkbox.onchange = () => {
          toggleMembership(settings3, scope, group.id, itemName, checkbox.checked);
          if (onChanged) onChanged();
        };
        const name = document.createElement("span");
        name.className = "st-chatu8-group-tag-name";
        name.textContent = group.name;
        row.appendChild(checkbox);
        row.appendChild(name);
        list.appendChild(row);
      }
    }
    panel.el.appendChild(list);
    const create = document.createElement("div");
    create.className = "st-chatu8-group-dropdown-item manage";
    create.innerHTML = '<i class="fa-solid fa-plus"></i><span>\u65B0\u5EFA\u5206\u7EC4\u2026</span>';
    create.onclick = async () => {
      const name = await promptInput("\u8BF7\u8F93\u5165\u65B0\u5206\u7EC4\u540D\u79F0\uFF1A", "");
      if (name === false) return;
      const group = createGroup(settings3, scope, name);
      if (!group) {
        showToast("\u5206\u7EC4\u540D\u79F0\u4E3A\u7A7A\u6216\u5DF2\u5B58\u5728", "warning");
        return;
      }
      toggleMembership(settings3, scope, group.id, itemName, true);
      if (panel.isOpen()) {
        renderPanel2();
        positionPanel(panel.el, btn);
      } else {
        panel.open();
      }
      if (onChanged) onChanged();
    };
    panel.el.appendChild(create);
  }
  btn.onclick = (e) => {
    e.stopPropagation();
    panel.toggle();
  };
  return btn;
}

function createGroupManageButton(config) {
  const { container, insertBefore, settings: settings3, scope, getAllNames, onChanged } = config;
  const btn = document.createElement("div");
  btn.className = "st-chatu8-group-manage-trigger";
  btn.title = "\u65B0\u5EFA / \u6539\u540D / \u6392\u5E8F\u5206\u7EC4\uFF0C\u6279\u91CF\u5B89\u6392\u6210\u5458";
  btn.innerHTML = `
        <i class="fa-solid fa-folder-tree"></i>
        <span>\u5206\u7EC4</span>
        <span class="st-chatu8-group-dropdown-count">0</span>
    `;
  if (insertBefore) {
    container.insertBefore(btn, insertBefore);
  } else {
    container.appendChild(btn);
  }
  const countEl = btn.querySelector(".st-chatu8-group-dropdown-count");
  function refresh() {
    countEl.textContent = getGroups(settings3, scope).length;
  }
  btn.onclick = async () => {
    await showGroupManagePanel({ settings: settings3, scope, getAllNames, onChanged });
    refresh();
  };
  refresh();
  return {
    refresh,
    destroy: () => btn.remove()
  };
}

function showGroupManagePanel(config) {
  const { settings: settings3, scope, getAllNames, onChanged } = config;
  return new Promise((resolve) => {
    const parent = document.getElementById("st-chatu8-settings") || document.body;
    const backdrop = document.createElement("div");
    backdrop.className = "st-chatu8-confirm-backdrop";
    backdrop.style.zIndex = "99999";
    const box = document.createElement("div");
    box.className = "st-chatu8-confirm-box st-chatu8-group-manage-box";
    const title = document.createElement("p");
    title.className = "st-chatu8-confirm-message";
    title.textContent = "\u5206\u7EC4\u7BA1\u7406";
    box.appendChild(title);
    const panes = document.createElement("div");
    panes.className = "st-chatu8-group-panes";
    const leftPane = document.createElement("div");
    leftPane.className = "st-chatu8-group-pane-left";
    const rightPane = document.createElement("div");
    rightPane.className = "st-chatu8-group-pane-right";
    panes.appendChild(leftPane);
    panes.appendChild(rightPane);
    box.appendChild(panes);
    let dirty = false;
    let selectedGroupId = null;
    let memberQuery = "";
    function renderLeft() {
      const allNames = getAllNames();
      const groups = getGroups(settings3, scope);
      leftPane.innerHTML = "";
      const head = document.createElement("div");
      head.className = "st-chatu8-group-pane-title";
      head.textContent = "\u5206\u7EC4";
      leftPane.appendChild(head);
      const list = document.createElement("div");
      list.className = "st-chatu8-group-manage-list";
      if (groups.length === 0) {
        const empty = document.createElement("div");
        empty.className = "st-chatu8-group-dropdown-empty";
        empty.textContent = "\u8FD8\u6CA1\u6709\u5206\u7EC4\uFF0C\u70B9\u4E0B\u9762\u7684\u300C\u65B0\u5EFA\u5206\u7EC4\u300D\u5F00\u59CB";
        list.appendChild(empty);
      }
      groups.forEach((group, index) => {
        const row = document.createElement("div");
        row.className = "st-chatu8-group-manage-row" + (group.id === selectedGroupId ? " active" : "");
        const name = document.createElement("span");
        name.className = "st-chatu8-group-manage-name";
        name.textContent = group.name;
        row.onclick = () => {
          if (selectedGroupId === group.id) return;
          selectedGroupId = group.id;
          memberQuery = "";
          renderLeft();
          renderRight();
        };
        const count = document.createElement("span");
        count.className = "st-chatu8-group-dropdown-count";
        count.textContent = countMembers(group, allNames);
        const upBtn = document.createElement("button");
        upBtn.className = "st-chatu8-group-manage-btn";
        upBtn.title = "\u4E0A\u79FB";
        upBtn.disabled = index === 0;
        upBtn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
        upBtn.onclick = (e) => {
          e.stopPropagation();
          if (!moveGroup(settings3, scope, group.id, -1)) return;
          dirty = true;
          renderLeft();
        };
        const downBtn = document.createElement("button");
        downBtn.className = "st-chatu8-group-manage-btn";
        downBtn.title = "\u4E0B\u79FB";
        downBtn.disabled = index === groups.length - 1;
        downBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        downBtn.onclick = (e) => {
          e.stopPropagation();
          if (!moveGroup(settings3, scope, group.id, 1)) return;
          dirty = true;
          renderLeft();
        };
        const renameBtn = document.createElement("button");
        renameBtn.className = "st-chatu8-group-manage-btn";
        renameBtn.title = "\u91CD\u547D\u540D";
        renameBtn.innerHTML = '<i class="fa-solid fa-pen-nib"></i>';
        renameBtn.onclick = async (e) => {
          e.stopPropagation();
          const newName = await promptInput(`\u91CD\u547D\u540D\u5206\u7EC4\u300C${group.name}\u300D\uFF1A`, group.name);
          if (newName === false || newName === group.name) return;
          if (!renameGroup(settings3, scope, group.id, newName)) {
            showToast("\u5206\u7EC4\u540D\u79F0\u4E3A\u7A7A\u6216\u5DF2\u5B58\u5728", "warning");
            return;
          }
          dirty = true;
          renderLeft();
          if (selectedGroupId === group.id) renderRight();
        };
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "st-chatu8-group-manage-btn danger";
        deleteBtn.title = "\u5220\u9664\u5206\u7EC4";
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.onclick = async (e) => {
          e.stopPropagation();
          const ok = await stylishConfirm(
            `\u786E\u5B9A\u5220\u9664\u5206\u7EC4\u300C${group.name}\u300D\u5417\uFF1F
\u53EA\u5220\u9664\u5206\u7EC4\uFF0C\u91CC\u9762\u7684\u6761\u76EE\u4E0D\u4F1A\u88AB\u5220\u9664\u3002`
          );
          if (!ok) return;
          deleteGroup(settings3, scope, group.id);
          dirty = true;
          showToast(`\u5DF2\u5220\u9664\u5206\u7EC4\u300C${group.name}\u300D`, "success");
          if (selectedGroupId === group.id) selectedGroupId = null;
          renderLeft();
          renderRight();
        };
        row.appendChild(name);
        row.appendChild(count);
        row.appendChild(upBtn);
        row.appendChild(downBtn);
        row.appendChild(renameBtn);
        row.appendChild(deleteBtn);
        list.appendChild(row);
      });
      leftPane.appendChild(list);
      const createBtn = document.createElement("button");
      createBtn.className = "st-chatu8-btn st-chatu8-group-create-btn";
      createBtn.innerHTML = '<i class="fa-solid fa-plus"></i> \u65B0\u5EFA\u5206\u7EC4';
      createBtn.onclick = async () => {
        const name = await promptInput("\u8BF7\u8F93\u5165\u65B0\u5206\u7EC4\u540D\u79F0\uFF1A", "");
        if (name === false) return;
        const group = createGroup(settings3, scope, name);
        if (!group) {
          showToast("\u5206\u7EC4\u540D\u79F0\u4E3A\u7A7A\u6216\u5DF2\u5B58\u5728", "warning");
          return;
        }
        dirty = true;
        selectedGroupId = group.id;
        memberQuery = "";
        renderLeft();
        renderRight();
      };
      leftPane.appendChild(createBtn);
    }
    function renderMemberList(listEl, footerEl, group) {
      const allNames = getAllNames();
      const mine = new Set(group.members);
      const visible = memberQuery ? allNames.filter((name) => name.toLowerCase().includes(memberQuery)) : allNames;
      listEl.innerHTML = "";
      if (visible.length === 0) {
        const empty = document.createElement("div");
        empty.className = "st-chatu8-group-dropdown-empty";
        empty.textContent = allNames.length === 0 ? "\u8FD8\u6CA1\u6709\u53EF\u7528\u7684\u6761\u76EE" : "\u6CA1\u6709\u5339\u914D\u7684\u6761\u76EE";
        listEl.appendChild(empty);
      }
      for (const name of visible) {
        const row = document.createElement("label");
        row.className = "st-chatu8-group-tag-row";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = mine.has(name);
        checkbox.onchange = () => {
          toggleMembership(settings3, scope, group.id, name, checkbox.checked);
          dirty = true;
          refreshCounts(footerEl, group);
        };
        const label = document.createElement("span");
        label.className = "st-chatu8-group-tag-name";
        label.textContent = name;
        row.appendChild(checkbox);
        row.appendChild(label);
        listEl.appendChild(row);
      }
      refreshCounts(footerEl, group);
    }
    function refreshCounts(footerEl, group) {
      const allNames = getAllNames();
      const stat = footerEl.querySelector(".st-chatu8-group-member-stat");
      if (stat) {
        stat.textContent = `\u5DF2\u9009 ${countMembers(group, allNames)} / ${allNames.length}`;
      }
      const activeCount = leftPane.querySelector(
        ".st-chatu8-group-manage-row.active .st-chatu8-group-dropdown-count"
      );
      if (activeCount) {
        activeCount.textContent = countMembers(group, allNames);
      }
    }
    function renderRight() {
      rightPane.innerHTML = "";
      const groups = getGroups(settings3, scope);
      const group = groups.find((g) => g.id === selectedGroupId);
      if (!group) {
        const empty = document.createElement("div");
        empty.className = "st-chatu8-group-pane-hint";
        empty.innerHTML = `
                    <i class="fa-solid fa-hand-point-left"></i>
                    <span>${groups.length === 0 ? "\u5148\u65B0\u5EFA\u4E00\u4E2A\u5206\u7EC4" : "\u9009\u62E9\u5DE6\u8FB9\u7684\u5206\u7EC4\u6765\u5B89\u6392\u6210\u5458"}</span>
                `;
        rightPane.appendChild(empty);
        return;
      }
      const head = document.createElement("div");
      head.className = "st-chatu8-group-pane-title";
      head.textContent = `\u300C${group.name}\u300D\u7684\u6210\u5458`;
      rightPane.appendChild(head);
      const search = document.createElement("input");
      search.type = "text";
      search.className = "st-chatu8-group-dropdown-search";
      search.placeholder = "\u641C\u7D22\u6761\u76EE...";
      search.value = memberQuery;
      rightPane.appendChild(search);
      const list = document.createElement("div");
      list.className = "st-chatu8-group-member-list";
      rightPane.appendChild(list);
      const footer = document.createElement("div");
      footer.className = "st-chatu8-group-member-footer";
      const stat = document.createElement("span");
      stat.className = "st-chatu8-group-member-stat";
      footer.appendChild(stat);
      const selectAll = document.createElement("button");
      selectAll.className = "st-chatu8-group-member-action";
      selectAll.textContent = "\u5168\u9009\u53EF\u89C1";
      selectAll.onclick = () => {
        const names = visibleNames();
        for (const name of names) {
          toggleMembership(settings3, scope, group.id, name, true);
        }
        dirty = true;
        renderMemberList(list, footer, group);
      };
      const clearAll2 = document.createElement("button");
      clearAll2.className = "st-chatu8-group-member-action";
      clearAll2.textContent = "\u6E05\u7A7A\u53EF\u89C1";
      clearAll2.onclick = () => {
        const names = visibleNames();
        for (const name of names) {
          toggleMembership(settings3, scope, group.id, name, false);
        }
        dirty = true;
        renderMemberList(list, footer, group);
      };
      footer.appendChild(selectAll);
      footer.appendChild(clearAll2);
      rightPane.appendChild(footer);
      function visibleNames() {
        const allNames = getAllNames();
        return memberQuery ? allNames.filter((name) => name.toLowerCase().includes(memberQuery)) : allNames;
      }
      search.oninput = (e) => {
        memberQuery = e.target.value.toLowerCase();
        renderMemberList(list, footer, group);
      };
      renderMemberList(list, footer, group);
    }
    const buttons = document.createElement("div");
    buttons.className = "st-chatu8-confirm-buttons";
    const closeBtn = document.createElement("button");
    closeBtn.className = "st-chatu8-btn";
    closeBtn.textContent = "\u5173\u95ED";
    closeBtn.onclick = () => {
      parent.removeChild(backdrop);
      if (dirty && onChanged) onChanged();
      resolve();
    };
    buttons.appendChild(closeBtn);
    box.appendChild(buttons);
    backdrop.appendChild(box);
    parent.appendChild(backdrop);
    const initial = getGroups(settings3, scope);
    if (initial.length > 0) selectedGroupId = initial[0].id;
    renderLeft();
    renderRight();
    closeBtn.focus();
  });
}

export { createGroupDropdown, createGroupManageButton, createGroupTagButton, filterByGroup, removeMember, renameMember };
