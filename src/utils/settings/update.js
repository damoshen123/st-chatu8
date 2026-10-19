// 还原自打包产物 — 原始模块: utils/settings/update.js
import { extensionFolderPath } from "../config.js";

function parseChangelog(rawText) {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const entries = [];
  let currentEntry = null;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const versionMatch = line.match(/^(v\.?[\d]+(?:\.[\d]+)*)[\s:：]*(.*)/);
    if (versionMatch) {
      currentEntry = {
        version: versionMatch[1],
        changes: []
      };
      entries.push(currentEntry);
      if (versionMatch[2] && versionMatch[2].trim()) {
        currentEntry.changes.push(versionMatch[2].trim());
      }
    } else if (currentEntry) {
      currentEntry.changes.push(line.replace(/^\d+\.\s*/, ""));
    }
  }
  return entries;
}

function renderChangelog(entries, currentVersion) {
  if (!entries || entries.length === 0) {
    return '<div class="st-chatu8-changelog-empty">\u6682\u65E0\u66F4\u65B0\u65E5\u5FD7</div>';
  }
  let html = "";
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLatest = i === 0;
    const isCurrent = currentVersion && (entry.version === `v.${currentVersion}` || entry.version === `v${currentVersion}` || entry.version === currentVersion);
    let badgeHtml = "";
    if (isLatest) {
      badgeHtml = '<span class="st-chatu8-changelog-badge latest">\u6700\u65B0</span>';
    } else if (isCurrent) {
      badgeHtml = '<span class="st-chatu8-changelog-badge current">\u5F53\u524D</span>';
    }
    const changesHtml = entry.changes.map((change) => {
      let icon = "\u2022";
      const lowerChange = change.toLowerCase();
      if (/^(修复|fix)/.test(change)) {
        icon = "\u{1F527}";
      } else if (/^(新增|添加|新加|支持|add)/.test(change)) {
        icon = "\u2728";
      } else if (/^(优化|改进|improve)/.test(change)) {
        icon = "\u26A1";
      } else if (/^(更新|update)/.test(change)) {
        icon = "\u{1F4E6}";
      } else if (/^(移除|删除|取消|remove)/.test(change)) {
        icon = "\u{1F5D1}\uFE0F";
      } else if (/^(更名|重命名|rename)/.test(change)) {
        icon = "\u{1F4DD}";
      }
      return `<li><span class="st-chatu8-changelog-icon">${icon}</span><span>${escapeHtml5(change)}</span></li>`;
    }).join("");
    html += `
        <div class="st-chatu8-changelog-entry${isLatest ? " latest" : ""}${isCurrent ? " current" : ""}">
            <div class="st-chatu8-changelog-version-row">
                <span class="st-chatu8-changelog-version">${escapeHtml5(entry.version)}</span>
                ${badgeHtml}
            </div>
            ${entry.changes.length > 0 ? `<ul class="st-chatu8-changelog-changes">${changesHtml}</ul>` : ""}
        </div>`;
  }
  return html;
}

function escapeHtml5(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function displayChangelog(rawText, currentVersion) {
  const container = document.getElementById("ch-update-notes");
  if (!container) return;
  if (!rawText) {
    container.innerHTML = '<div class="st-chatu8-changelog-empty">\u65E0\u6CD5\u83B7\u53D6\u66F4\u65B0\u65E5\u5FD7\uFF0C\u8BF7\u70B9\u51FB"\u68C0\u67E5\u66F4\u65B0"\u6309\u94AE\u91CD\u8BD5\u3002</div>';
    return;
  }
  const entries = parseChangelog(rawText);
  container.innerHTML = renderChangelog(entries, currentVersion);
}

async function checkForUpdates() {
  try {
    const localManifestResponse = await fetch(`${extensionFolderPath}/manifest.json?t=${(/* @__PURE__ */ new Date()).getTime()}`, { cache: "no-cache" });
    if (localManifestResponse.ok) {
      const localManifest = await localManifestResponse.json();
      const localVersion = localManifest.version;
      window.chatu8LocalVersion = localVersion;
    } else {
      console.error("Failed to fetch local manifest for version check.");
    }
  } catch (error) {
    console.error("Error fetching local manifest:", error);
  }
  const updateStatusElement = document.getElementById("ch-update-status");
  console.log("Checking for updates...");
  try {
    const remoteManifestUrl = `https://raw.githubusercontent.com/damoshen123/st-chatu8/master/manifest.json?t=${(/* @__PURE__ */ new Date()).getTime()}`;
    const response = await fetch(remoteManifestUrl, { cache: "no-cache" });
    if (!response.ok) {
      console.error("Failed to fetch remote manifest for update check.");
      displayChangelog(null);
      if (updateStatusElement) {
        updateStatusElement.textContent = "\u274C \u65E0\u6CD5\u8FDE\u63A5\u5230\u66F4\u65B0\u670D\u52A1\u5668";
        updateStatusElement.className = "st-chatu8-update-status error";
      }
      window.chatu8UpdateAvailable = false;
      return;
    }
    const remoteManifest = await response.json();
    const remoteVersion = remoteManifest.version;
    window.chatu8RemoteVersion = remoteVersion;
    if (remoteManifest.updata) {
      displayChangelog(remoteManifest.updata, window.chatu8LocalVersion);
    }
    if (window.chatu8LocalVersion) {
      if (remoteVersion.localeCompare(window.chatu8LocalVersion, void 0, { numeric: true, sensitivity: "base" }) > 0) {
        console.log(`New version available: ${remoteVersion} (current: ${window.chatu8LocalVersion})`);
        window.chatu8UpdateAvailable = true;
        if (updateStatusElement) {
          updateStatusElement.textContent = `\u{1F389} \u53D1\u73B0\u65B0\u7248\u672C v${remoteVersion}\uFF08\u5F53\u524D v${window.chatu8LocalVersion}\uFF09`;
          updateStatusElement.className = "st-chatu8-update-status available";
        }
      } else {
        console.log("Extension is up to date.");
        window.chatu8UpdateAvailable = false;
        if (updateStatusElement) {
          updateStatusElement.textContent = `\u2705 \u5DF2\u662F\u6700\u65B0\u7248\u672C v${window.chatu8LocalVersion}`;
          updateStatusElement.className = "st-chatu8-update-status uptodate";
        }
      }
    } else {
      window.chatu8UpdateAvailable = false;
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
    displayChangelog(null);
    if (updateStatusElement) {
      updateStatusElement.textContent = "\u274C \u68C0\u67E5\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5";
      updateStatusElement.className = "st-chatu8-update-status error";
    }
    window.chatu8UpdateAvailable = false;
  }
}

function updateVersionInfo() {
  const versionDisplay = document.getElementById("ch-version-display");
  if (versionDisplay && window.chatu8LocalVersion) {
    versionDisplay.textContent = `v${window.chatu8LocalVersion}`;
  }
  const updateIndicator = document.getElementById("ch-update-indicator");
  const titleUpdateNotification = document.getElementById("ch-title-update-notification");
  if (window.chatu8UpdateAvailable) {
    if (updateIndicator) {
      updateIndicator.style.display = "inline";
    }
    if (titleUpdateNotification) {
      titleUpdateNotification.style.display = "inline";
    }
  }
}

async function initUpdateCheck(settingsModal, check_update_func) {
  settingsModal.find("#ch-check-update").on("click", async function() {
    const btn = $(this);
    btn.prop("disabled", true).text("\u68C0\u67E5\u4E2D...");
    const statusEl = document.getElementById("ch-update-status");
    if (statusEl) {
      statusEl.textContent = "\u23F3 \u6B63\u5728\u68C0\u67E5\u66F4\u65B0...";
      statusEl.className = "st-chatu8-update-status checking";
    }
    try {
      await check_update_func();
    } finally {
      btn.prop("disabled", false).text("\u68C0\u67E5\u66F4\u65B0");
    }
  });
  const container = document.getElementById("ch-update-notes");
  if (container) {
    container.addEventListener("chatu8-changelog-update", (e) => {
      const { rawText, currentVersion } = e.detail || {};
      if (rawText) {
        displayChangelog(rawText, currentVersion);
      }
    });
  }
  await checkForUpdates();
  updateVersionInfo();
}

export { initUpdateCheck };
