// 还原自打包产物 — 原始模块: utils/settings/vocabulary.js
import { showToast } from "../ui_common.js";
import { dbs } from "../database.js";
import { TAG_DATA_PATH, VOCABULARY_FILE_LIST, VOCABULARY_INSTALL_ALL_BTN, VOCABULARY_MANUAL_TAGS_EXPORT_BTN, VOCABULARY_MANUAL_TAGS_FILTER_INPUT, VOCABULARY_MANUAL_TAGS_IMPORT_BTN, VOCABULARY_MANUAL_TAGS_IMPORT_INPUT, VOCABULARY_MANUAL_TAGS_LIST, VOCABULARY_MANUAL_TAGS_REFRESH_BTN, VOCABULARY_MANUAL_TAG_ADD_BTN, VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT, VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT, VOCABULARY_SEARCH_BTN, VOCABULARY_SEARCH_INPUT, VOCABULARY_SEARCH_LIMIT, VOCABULARY_SEARCH_RESULTS, VOCABULARY_SEARCH_SORT, VOCABULARY_SEARCH_STARTSWITH, VOCABULARY_SELECTED_TAGS, VOCABULARY_TAG_BACKSPACE, VOCABULARY_TAG_CLEAR, VOCABULARY_TAG_COPY, VOCABULARY_TREE_CONTAINER, VOCABULARY_UNINSTALL_ALL_BTN, __set_VOCABULARY_FILE_LIST, __set_VOCABULARY_INSTALL_ALL_BTN, __set_VOCABULARY_MANUAL_TAGS_EXPORT_BTN, __set_VOCABULARY_MANUAL_TAGS_FILTER_INPUT, __set_VOCABULARY_MANUAL_TAGS_IMPORT_BTN, __set_VOCABULARY_MANUAL_TAGS_IMPORT_INPUT, __set_VOCABULARY_MANUAL_TAGS_LIST, __set_VOCABULARY_MANUAL_TAGS_REFRESH_BTN, __set_VOCABULARY_MANUAL_TAG_ADD_BTN, __set_VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT, __set_VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT, __set_VOCABULARY_SEARCH_BTN, __set_VOCABULARY_SEARCH_INPUT, __set_VOCABULARY_SEARCH_LIMIT, __set_VOCABULARY_SEARCH_RESULTS, __set_VOCABULARY_SEARCH_SORT, __set_VOCABULARY_SEARCH_STARTSWITH, __set_VOCABULARY_SELECTED_TAGS, __set_VOCABULARY_TAG_BACKSPACE, __set_VOCABULARY_TAG_CLEAR, __set_VOCABULARY_TAG_COPY, __set_VOCABULARY_TREE_CONTAINER, __set_VOCABULARY_UNINSTALL_ALL_BTN, __set_cachedTagTreeData, cachedTagTreeData, encryptionKey } from "../ui.js";
import "../config.js"; // init_config

async function buildTagTree() {
  try {
    const installed = await dbs.getInstalledVocabularies();
    const tagsJsonInstalled = installed.some((item) => item.fileName === "tags.json");
    if (!tagsJsonInstalled) {
      __set_cachedTagTreeData(null);
      VOCABULARY_TREE_CONTAINER.innerHTML = "<p>\u8BF7\u5148\u4ECE\u4E0A\u65B9\u5217\u8868\u4E2D\u5B89\u88C5 <code>tags.json</code> \u4EE5\u542F\u7528\u6807\u7B7E\u6D4F\u89C8\u5668\u3002</p>";
      return;
    }
    let data;
    if (cachedTagTreeData) {
      data = cachedTagTreeData;
    } else {
      data = await dbs.getTagsTreeData();
      if (!data || !data.tag_groups) {
        throw new Error("\u65E0\u6CD5\u4ECE\u6570\u636E\u5E93\u52A0\u8F7D\u7ED3\u6784\u5316\u6807\u7B7E\u6570\u636E\u3002");
      }
      __set_cachedTagTreeData(data);
    }
    const { tag_groups, tag_tags } = data;
    const tagsBySubgroupId = tag_tags.reduce((acc, tag) => {
      if (!acc[tag.subgroup_id]) {
        acc[tag.subgroup_id] = [];
      }
      acc[tag.subgroup_id].push(tag);
      return acc;
    }, {});
    const tree = document.createElement("ul");
    tree.className = "st-chatu8-tree";
    tag_groups.forEach((group) => {
      const groupItem = document.createElement("li");
      groupItem.className = "st-chatu8-tree-item";
      const groupToggle = document.createElement("span");
      groupToggle.className = "st-chatu8-tree-toggle";
      groupToggle.textContent = "\u25B6 ";
      const groupName = document.createElement("span");
      groupName.textContent = group.name;
      groupName.className = "st-chatu8-tree-group";
      const groupContent = document.createElement("div");
      groupContent.className = "st-chatu8-tree-content";
      groupContent.appendChild(groupToggle);
      groupContent.appendChild(groupName);
      groupItem.appendChild(groupContent);
      const subgroupList = document.createElement("ul");
      subgroupList.className = "st-chatu8-tree-sublist";
      subgroupList.style.display = "none";
      if (group.subgroups && group.subgroups.length > 0) {
        group.subgroups.forEach((subgroup) => {
          const subgroupItem = document.createElement("li");
          subgroupItem.className = "st-chatu8-tree-item";
          const subgroupToggle = document.createElement("span");
          subgroupToggle.className = "st-chatu8-tree-toggle";
          subgroupToggle.textContent = "\u25B6 ";
          const subgroupName = document.createElement("span");
          subgroupName.textContent = subgroup.name;
          subgroupName.className = "st-chatu8-tree-subgroup";
          const subgroupContent = document.createElement("div");
          subgroupContent.className = "st-chatu8-tree-content";
          subgroupContent.appendChild(subgroupToggle);
          subgroupContent.appendChild(subgroupName);
          subgroupItem.appendChild(subgroupContent);
          const tagList = document.createElement("ul");
          tagList.className = "st-chatu8-tree-taglist";
          tagList.style.display = "none";
          const tags = tagsBySubgroupId[subgroup.id_index] || [];
          tags.forEach((tag) => {
            const tagItem = document.createElement("li");
            tagItem.className = "st-chatu8-tree-tag";
            tagItem.textContent = `${tag.text} (${tag.desc})`;
            tagItem.onclick = () => {
              const currentTags = VOCABULARY_SELECTED_TAGS.value.trim();
              const newTag = `${tag.text}(${tag.desc})`;
              if (currentTags) {
                VOCABULARY_SELECTED_TAGS.value = `${currentTags}, ${newTag}`;
              } else {
                VOCABULARY_SELECTED_TAGS.value = newTag;
              }
            };
            tagList.appendChild(tagItem);
          });
          if (tags.length > 0) {
            subgroupItem.appendChild(tagList);
            subgroupContent.onclick = () => {
              const isExpanded = tagList.style.display === "block";
              tagList.style.display = isExpanded ? "none" : "block";
              subgroupToggle.textContent = isExpanded ? "\u25B6 " : "\u25BC ";
            };
          } else {
            subgroupToggle.style.visibility = "hidden";
          }
          subgroupList.appendChild(subgroupItem);
        });
      }
      groupItem.appendChild(subgroupList);
      groupContent.onclick = () => {
        const isExpanded = subgroupList.style.display === "block";
        subgroupList.style.display = isExpanded ? "none" : "block";
        groupToggle.textContent = isExpanded ? "\u25B6 " : "\u25BC ";
      };
      tree.appendChild(groupItem);
    });
    VOCABULARY_TREE_CONTAINER.innerHTML = "";
    VOCABULARY_TREE_CONTAINER.appendChild(tree);
  } catch (error) {
    console.error("Error building tag tree:", error);
    VOCABULARY_TREE_CONTAINER.textContent = "\u52A0\u8F7D\u6807\u7B7E\u6D4F\u89C8\u5668\u5931\u8D25\u3002";
    showToast("\u52A0\u8F7D\u6807\u7B7E\u6D4F\u89C8\u5668\u5931\u8D25", "error");
  }
}

async function fetchTagDataFiles() {
  try {
    const fileNames = [
      "danbooru_001.json",
      "danbooru_002.json",
      "danbooru_003.json",
      "danbooru_004.json",
      "danbooru_005.json",
      "danbooru_006.json",
      "danbooru_007.json",
      "danbooru_008.json",
      "danbooru_009.json",
      "danbooru_010.json",
      "danbooru_011.json",
      "danbooru_012.json",
      "danbooru_013.json",
      "danbooru_014.json",
      "danbooru_015.json",
      "danbooru_016.json",
      "danbooru_017.json",
      "danbooru_018.json",
      "danbooru_019.json",
      "danbooru_020.json",
      "danbooru_021.json",
      "danbooru_022.json",
      "danbooru_023.json",
      "danbooru_024.json",
      "danbooru_025.json",
      "tags.json",
      "tag_NSFW001.json"
    ];
    return fileNames.map((name) => ({ name }));
  } catch (error) {
    console.error("Error fetching tag data files:", error);
    showToast("\u65E0\u6CD5\u52A0\u8F7D\u8BCD\u5E93\u6587\u4EF6\u5217\u8868", "error");
    return [];
  }
}

async function renderVocabularyList() {
  const [files, installed] = await Promise.all([
    fetchTagDataFiles(),
    dbs.getInstalledVocabularies()
  ]);
  const installedFiles = new Set(installed.map((item) => item.fileName));
  VOCABULARY_FILE_LIST.innerHTML = "";
  if (files.length === 0) {
    VOCABULARY_FILE_LIST.textContent = "\u6CA1\u6709\u53EF\u7528\u7684\u8BCD\u5E93\u6587\u4EF6\u3002";
    return;
  }
  const ul = document.createElement("ul");
  ul.className = "st-chatu8-vocabulary-ul";
  files.forEach((file) => {
    const li = document.createElement("li");
    li.className = "st-chatu8-vocabulary-item";
    const fileNameSpan = document.createElement("span");
    fileNameSpan.textContent = file.name;
    li.appendChild(fileNameSpan);
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "st-chatu8-vocabulary-actions";
    if (installedFiles.has(file.name)) {
      const tagCount = installed.find((i) => i.fileName === file.name)?.tagCount || 0;
      const installedSpan = document.createElement("span");
      installedSpan.textContent = `\u5DF2\u5B89\u88C5 (${tagCount} tags)`;
      installedSpan.className = "st-chatu8-installed-label";
      actionsDiv.appendChild(installedSpan);
      const uninstallBtn = document.createElement("button");
      uninstallBtn.textContent = "\u5378\u8F7D";
      uninstallBtn.className = "st-chatu8-btn danger small";
      uninstallBtn.onclick = () => uninstallVocabulary2(file.name);
      actionsDiv.appendChild(uninstallBtn);
    } else {
      const installBtn = document.createElement("button");
      installBtn.textContent = "\u5B89\u88C5";
      installBtn.className = "st-chatu8-btn small";
      installBtn.onclick = () => installVocabulary2(file.name);
      actionsDiv.appendChild(installBtn);
    }
    li.appendChild(actionsDiv);
    ul.appendChild(li);
  });
  VOCABULARY_FILE_LIST.appendChild(ul);
}

async function installVocabulary2(fileName) {
  if (!fileName) {
    showToast("\u65E0\u6548\u7684\u6587\u4EF6\u540D", "warning");
    return;
  }
  try {
    showToast(`\u6B63\u5728\u5B89\u88C5 ${fileName}...`, "info");
    const response = await fetch(`${TAG_DATA_PATH}${fileName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const encryptedText = await response.text();
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error("\u89E3\u5BC6\u5931\u8D25\uFF0C\u5185\u5BB9\u4E3A\u7A7A\u3002\u53EF\u80FD\u662F\u5BC6\u94A5\u4E0D\u5339\u914D\u6216\u6587\u4EF6\u5DF2\u635F\u574F\u3002");
    }
    const data = JSON.parse(decryptedText);
    await dbs.installVocabulary(fileName, data);
    const installedVocab = await dbs.getInstalledVocabularies();
    const vocabInfo = installedVocab.find((v) => v.fileName === fileName);
    const tagCount = vocabInfo ? vocabInfo.tagCount : 0;
    showToast(`${fileName} \u5B89\u88C5\u6210\u529F\uFF0C\u5305\u542B ${tagCount} \u4E2A\u6807\u7B7E`, "success");
    await renderVocabularyList();
    if (fileName === "tags.json") {
      __set_cachedTagTreeData(null);
      await buildTagTree();
    }
  } catch (error) {
    console.error(`Error installing vocabulary ${fileName}:`, error);
    showToast(`\u5B89\u88C5\u5931\u8D25: ${error.message}`, "error");
  }
}

async function uninstallVocabulary2(fileName) {
  if (!fileName) {
    showToast("\u65E0\u6548\u7684\u6587\u4EF6\u540D", "warning");
    return;
  }
  try {
    await dbs.uninstallVocabulary(fileName);
    showToast(`${fileName} \u5378\u8F7D\u6210\u529F`, "success");
    await renderVocabularyList();
    if (fileName === "tags.json") {
      await buildTagTree();
    }
  } catch (error) {
    console.error(`Error uninstalling vocabulary ${fileName}:`, error);
    showToast(`\u5378\u8F7D\u5931\u8D25: ${error.message}`, "error");
  }
}

async function installAllVocabularies() {
  showToast("\u5F00\u59CB\u6279\u91CF\u5B89\u88C5\u6240\u6709\u672A\u5B89\u88C5\u7684\u8BCD\u5E93...", "info");
  const [files, installed] = await Promise.all([
    fetchTagDataFiles(),
    dbs.getInstalledVocabularies()
  ]);
  const installedFiles = new Set(installed.map((item) => item.fileName));
  const filesToInstall = files.filter((file) => !installedFiles.has(file.name));
  if (filesToInstall.length === 0) {
    showToast("\u6240\u6709\u8BCD\u5E93\u5747\u5DF2\u5B89\u88C5\u3002", "success");
    return;
  }
  for (const file of filesToInstall) {
    await installVocabulary2(file.name);
  }
  showToast("\u6279\u91CF\u5B89\u88C5\u5B8C\u6210\uFF01", "success");
}

async function uninstallAllVocabularies() {
  showToast("\u5F00\u59CB\u6279\u91CF\u5378\u8F7D\u6240\u6709\u5DF2\u5B89\u88C5\u7684\u8BCD\u5E93...", "info");
  const installed = await dbs.getInstalledVocabularies();
  if (installed.length === 0) {
    showToast("\u6CA1\u6709\u5DF2\u5B89\u88C5\u7684\u8BCD\u5E93\u3002", "success");
    return;
  }
  for (const item of installed) {
    await uninstallVocabulary2(item.fileName);
  }
  showToast("\u6279\u91CF\u5378\u8F7D\u5B8C\u6210\uFF01", "success");
}

async function searchTags2() {
  const keyword = VOCABULARY_SEARCH_INPUT.value.trim();
  if (!keyword) {
    VOCABULARY_SEARCH_RESULTS.innerHTML = "";
    return;
  }
  const startsWith = VOCABULARY_SEARCH_STARTSWITH.checked;
  const limit = parseInt(VOCABULARY_SEARCH_LIMIT.value, 10);
  const sortBy = VOCABULARY_SEARCH_SORT.value;
  try {
    const results = await dbs.searchTags(keyword, { startsWith, limit, sortBy });
    VOCABULARY_SEARCH_RESULTS.innerHTML = "";
    if (results.length === 0) {
      VOCABULARY_SEARCH_RESULTS.textContent = "\u672A\u627E\u5230\u5339\u914D\u7684\u6807\u7B7E\u3002";
    } else {
      results.forEach((tag) => {
        const div = document.createElement("div");
        const tagName = typeof tag === "object" ? `${tag.name} (${tag.translation || "\u65E0\u7FFB\u8BD1"})` : tag;
        div.textContent = tagName;
        div.className = "st-chatu8-search-result-item";
        div.onclick = () => {
          navigator.clipboard.writeText(tag.name).then(() => {
            showToast(`\u5DF2\u590D\u5236: ${tag.name}`, "success");
          });
        };
        VOCABULARY_SEARCH_RESULTS.appendChild(div);
      });
    }
  } catch (error) {
    console.error("Error searching tags:", error);
    showToast("\u641C\u7D22\u5931\u8D25", "error");
  }
}

function handleTagBackspace() {
  const currentValue = VOCABULARY_SELECTED_TAGS.value;
  let tags = currentValue.split(",").map((tag) => tag.trim()).filter((tag) => tag);
  tags.pop();
  VOCABULARY_SELECTED_TAGS.value = tags.join(", ");
}

function handleTagClear() {
  VOCABULARY_SELECTED_TAGS.value = "";
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`\u5DF2\u590D\u5236: "${text}"`, "success");
    }).catch((err) => {
      console.error("\u4F7F\u7528 Clipboard API \u590D\u5236\u5931\u8D25: ", err);
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.width = "2em";
  textArea.style.height = "2em";
  textArea.style.padding = "0";
  textArea.style.border = "none";
  textArea.style.outline = "none";
  textArea.style.boxShadow = "none";
  textArea.style.background = "transparent";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      showToast(`\u5DF2\u590D\u5236: "${text}"`, "success");
    } else {
      showToast("\u590D\u5236\u5931\u8D25\uFF0C\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u6B64\u64CD\u4F5C", "error");
    }
  } catch (err) {
    console.error("\u540E\u5907\u590D\u5236\u65B9\u6CD5\u5931\u8D25: ", err);
    showToast("\u590D\u5236\u5931\u8D25\uFF0C\u53D1\u751F\u672A\u77E5\u9519\u8BEF", "error");
  }
  document.body.removeChild(textArea);
}

function handleTagCopy() {
  const rawText = VOCABULARY_SELECTED_TAGS.value.trim();
  if (!rawText) {
    showToast("\u8F93\u5165\u6846\u5185\u6CA1\u6709\u6807\u7B7E\u53EF\u4EE5\u590D\u5236", "info");
    return;
  }
  const result = rawText.replace(/\(/g, "\uFF08").replace(/\)/g, "\uFF09");
  if (!result) {
    showToast("\u6CA1\u6709\u53EF\u4EE5\u590D\u5236\u7684\u6807\u7B7E", "info");
    return;
  }
  copyToClipboard(result);
}

async function renderManualTags() {
  try {
    let manualTags = await dbs.getManualTags();
    VOCABULARY_MANUAL_TAGS_LIST.innerHTML = "";
    const filterQuery = VOCABULARY_MANUAL_TAGS_FILTER_INPUT ? VOCABULARY_MANUAL_TAGS_FILTER_INPUT.value.trim().toLowerCase() : "";
    if (filterQuery) {
      manualTags = manualTags.filter(
        (tag) => tag.name.toLowerCase().includes(filterQuery) || tag.translation && tag.translation.toLowerCase().includes(filterQuery)
      );
    }
    if (manualTags.length === 0) {
      VOCABULARY_MANUAL_TAGS_LIST.textContent = filterQuery ? "\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u6807\u7B7E\u3002" : "\u6CA1\u6709\u624B\u52A8\u6DFB\u52A0\u7684\u6807\u7B7E\u3002";
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "st-chatu8-vocabulary-ul";
    manualTags.forEach((tag) => {
      const li = document.createElement("li");
      li.className = "st-chatu8-vocabulary-item";
      const tagInfoSpan = document.createElement("span");
      tagInfoSpan.textContent = `${tag.name} -> ${tag.translation || "(\u65E0\u7FFB\u8BD1)"}`;
      li.appendChild(tagInfoSpan);
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "st-chatu8-vocabulary-actions";
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "\u5220\u9664";
      deleteBtn.className = "st-chatu8-btn danger small";
      deleteBtn.onclick = async () => {
        if (confirm(`\u786E\u5B9A\u8981\u5220\u9664\u6807\u7B7E "${tag.name}" \u5417\uFF1F`)) {
          try {
            await dbs.deleteTagByName(tag.name);
            showToast(`\u6807\u7B7E "${tag.name}" \u5DF2\u5220\u9664`, "success");
            await renderManualTags();
          } catch (error) {
            console.error("Error deleting tag:", error);
            showToast(`\u5220\u9664\u5931\u8D25: ${error.message}`, "error");
          }
        }
      };
      actionsDiv.appendChild(deleteBtn);
      li.appendChild(actionsDiv);
      ul.appendChild(li);
    });
    VOCABULARY_MANUAL_TAGS_LIST.appendChild(ul);
  } catch (error) {
    console.error("Error rendering manual tags:", error);
    VOCABULARY_MANUAL_TAGS_LIST.textContent = "\u52A0\u8F7D\u624B\u52A8\u6807\u7B7E\u5217\u8868\u5931\u8D25\u3002";
    showToast("\u52A0\u8F7D\u624B\u52A8\u6807\u7B7E\u5217\u8868\u5931\u8D25", "error");
  }
}

async function handleManualTagAdd() {
  const original = VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT.value.trim();
  const translation = VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT.value.trim();
  if (!original) {
    showToast("\u6807\u7B7E\u539F\u6587\u4E0D\u80FD\u4E3A\u7A7A", "info");
    return;
  }
  try {
    const existingTags = await dbs.searchTags(original, { startsWith: false, limit: 1 });
    if (existingTags.some((t) => t.name.toLowerCase() === original.toLowerCase())) {
      showToast(`\u6807\u7B7E "${original}" \u5DF2\u5B58\u5728`, "warning");
      return;
    }
    await dbs.addTag({ name: original, translation, hot: 0, fileName: "manual" });
    VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT.value = "";
    VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT.value = "";
    showToast(`\u6210\u529F\u6DFB\u52A0\u6807\u7B7E: ${original}`, "success");
    await renderManualTags();
  } catch (error) {
    console.error("Error adding manual tag:", error);
    showToast(`\u6DFB\u52A0\u5931\u8D25: ${error.message}`, "error");
  }
}

async function handleManualTagsExport() {
  try {
    const manualTags = await dbs.getManualTags();
    if (manualTags.length === 0) {
      showToast("\u6CA1\u6709\u53EF\u4EE5\u5BFC\u51FA\u7684\u6807\u7B7E", "info");
      return;
    }
    const exportData = manualTags.map((tag) => ({ name: tag.name, translation: tag.translation }));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "st-chatu8_manual_tags.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast("\u5BFC\u51FA\u6210\u529F", "success");
  } catch (error) {
    console.error("Error exporting manual tags:", error);
    showToast(`\u5BFC\u51FA\u5931\u8D25: ${error.message}`, "error");
  }
}

async function handleManualTagsImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (!Array.isArray(importedData)) {
        throw new Error("\u6587\u4EF6\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u5E94\u4E3A\u5305\u542B\u6807\u7B7E\u5BF9\u8C61\u7684\u6570\u7EC4");
      }
      const existingTags = await dbs.getManualTags();
      const existingTagNames = new Set(existingTags.map((t) => t.name.toLowerCase()));
      let addedCount = 0;
      let skippedCount = 0;
      showToast("\u5F00\u59CB\u5BFC\u5165\u6807\u7B7E...", "info");
      for (const tag of importedData) {
        if (!tag.name || typeof tag.name !== "string") {
          continue;
        }
        const original = tag.name.trim();
        const translation = tag.translation ? String(tag.translation).trim() : "";
        if (existingTagNames.has(original.toLowerCase())) {
          skippedCount++;
          continue;
        }
        await dbs.addTag({ name: original, translation, hot: 0, fileName: "manual" });
        existingTagNames.add(original.toLowerCase());
        addedCount++;
      }
      showToast(`\u5BFC\u5165\u5B8C\u6210: \u6210\u529F\u6DFB\u52A0 ${addedCount} \u4E2A, \u53BB\u91CD\u8DF3\u8FC7 ${skippedCount} \u4E2A`, "success");
      await renderManualTags();
      VOCABULARY_MANUAL_TAGS_IMPORT_INPUT.value = "";
    } catch (error) {
      console.error("Error importing manual tags:", error);
      showToast(`\u5BFC\u5165\u5931\u8D25: ${error.message}`, "error");
      VOCABULARY_MANUAL_TAGS_IMPORT_INPUT.value = "";
    }
  };
  reader.readAsText(file);
}

function init() {
  __set_VOCABULARY_FILE_LIST(document.getElementById("vocabulary-file-list"));
  __set_VOCABULARY_INSTALL_ALL_BTN(document.getElementById("vocabulary-install-all-btn"));
  __set_VOCABULARY_UNINSTALL_ALL_BTN(document.getElementById("vocabulary-uninstall-all-btn"));
  __set_VOCABULARY_SEARCH_INPUT(document.getElementById("vocabulary-search-input"));
  __set_VOCABULARY_SEARCH_BTN(document.getElementById("vocabulary-search-btn"));
  __set_VOCABULARY_SEARCH_RESULTS(document.getElementById("vocabulary-search-results"));
  __set_VOCABULARY_TREE_CONTAINER(document.getElementById("vocabulary-tree-container"));
  __set_VOCABULARY_SEARCH_STARTSWITH(document.getElementById("vocabulary_search_startswith"));
  __set_VOCABULARY_SEARCH_LIMIT(document.getElementById("vocabulary_search_limit"));
  __set_VOCABULARY_SEARCH_SORT(document.getElementById("vocabulary_search_sort"));
  __set_VOCABULARY_SELECTED_TAGS(document.getElementById("vocabulary-selected-tags"));
  __set_VOCABULARY_TAG_BACKSPACE(document.getElementById("vocabulary-tag-backspace"));
  __set_VOCABULARY_TAG_CLEAR(document.getElementById("vocabulary-tag-clear"));
  __set_VOCABULARY_TAG_COPY(document.getElementById("vocabulary-tag-copy"));
  __set_VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT(document.getElementById("vocabulary-manual-tag-original-input"));
  __set_VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT(document.getElementById("vocabulary-manual-tag-translation-input"));
  __set_VOCABULARY_MANUAL_TAG_ADD_BTN(document.getElementById("vocabulary-manual-tag-add-btn"));
  __set_VOCABULARY_MANUAL_TAGS_LIST(document.getElementById("vocabulary-manual-tags-list"));
  __set_VOCABULARY_MANUAL_TAGS_REFRESH_BTN(document.getElementById("vocabulary-manual-tags-refresh-btn"));
  __set_VOCABULARY_MANUAL_TAGS_EXPORT_BTN(document.getElementById("vocabulary-manual-tags-export-btn"));
  __set_VOCABULARY_MANUAL_TAGS_IMPORT_BTN(document.getElementById("vocabulary-manual-tags-import-btn"));
  __set_VOCABULARY_MANUAL_TAGS_IMPORT_INPUT(document.getElementById("vocabulary-manual-tags-import-input"));
  __set_VOCABULARY_MANUAL_TAGS_FILTER_INPUT(document.getElementById("vocabulary-manual-tags-filter-input"));
  VOCABULARY_INSTALL_ALL_BTN.addEventListener("click", installAllVocabularies);
  VOCABULARY_UNINSTALL_ALL_BTN.addEventListener("click", uninstallAllVocabularies);
  VOCABULARY_SEARCH_BTN.addEventListener("click", searchTags2);
  VOCABULARY_SEARCH_INPUT.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchTags2();
    }
  });
  VOCABULARY_TAG_BACKSPACE.addEventListener("click", handleTagBackspace);
  VOCABULARY_TAG_CLEAR.addEventListener("click", handleTagClear);
  VOCABULARY_TAG_COPY.addEventListener("click", handleTagCopy);
  VOCABULARY_MANUAL_TAG_ADD_BTN.addEventListener("click", handleManualTagAdd);
  VOCABULARY_MANUAL_TAGS_REFRESH_BTN.addEventListener("click", renderManualTags);
  VOCABULARY_MANUAL_TAGS_EXPORT_BTN.addEventListener("click", handleManualTagsExport);
  VOCABULARY_MANUAL_TAGS_IMPORT_BTN.addEventListener("click", () => VOCABULARY_MANUAL_TAGS_IMPORT_INPUT.click());
  VOCABULARY_MANUAL_TAGS_IMPORT_INPUT.addEventListener("change", handleManualTagsImport);
  VOCABULARY_MANUAL_TAGS_FILTER_INPUT.addEventListener("input", renderManualTags);
  const manualTagEnterHandler = (e) => {
    if (e.key === "Enter") {
      handleManualTagAdd();
    }
  };
  VOCABULARY_MANUAL_TAG_ORIGINAL_INPUT.addEventListener("keypress", manualTagEnterHandler);
  VOCABULARY_MANUAL_TAG_TRANSLATION_INPUT.addEventListener("keypress", manualTagEnterHandler);
  renderVocabularyList();
  buildTagTree();
  renderManualTags();
}

export { init };
