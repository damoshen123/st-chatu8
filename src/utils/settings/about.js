// 还原自打包产物 — 原始模块: utils/settings/about.js
import { DISCLAIMER_CONTENT } from "./profile.js";

function getAboutPageContent() {
  const baseContent = `
<div id="ch-tab-about">
    <div class="st-chatu8-settings-section">
        <h3>\u5173\u4E8E \u667A\u7ED8\u59EC \u{1F5BC}\uFE0F</h3>
        <p>\u63D2\u4EF6\u4F5C\u8005: \u4ECE\u524D\u8DDF\u4F60\u4E00\u6837</p>
        <div class="st-chatu8-about-links">
            <a href="https://afdian.com/a/cqgnyy" target="_blank" class="st-chatu8-about-link support">
                <i class="fa-solid fa-heart"></i>
                <span>\u652F\u6301\u4F5C\u8005</span>
                <span class="st-chatu8-cute-emoji">\u{1F496}</span>
            </a>
            <a href="https://gxcgf4l6b2y.feishu.cn/wiki/UXtHw83pmiHnx1k4WpwcIn79nec?from=from_copylink" target="_blank" class="st-chatu8-about-link help">
                <i class="fa-solid fa-circle-question"></i>
                <span>\u67E5\u770B\u5E2E\u52A9</span>
                <span class="st-chatu8-cute-emoji">\u2753</span>
            </a>
        </div>
    </div>
    <div class="st-chatu8-settings-section">
        <h3>\u{1F31F} \u7AD9\u70B9\u63A8\u8350</h3>
        <div class="st-chatu8-about-links" style="flex-direction: column; gap: 10px;">
            <a href="https://spell.novelai.dev/" target="_blank" class="st-chatu8-about-link st-chatu8-site-link">
                <i class="fa-solid fa-wand-magic-sparkles st-chatu8-site-icon"></i>
                <div class="st-chatu8-site-content">
                    <span class="st-chatu8-site-title">Spell</span>
                    <span class="st-chatu8-site-description">\u53EF\u4EE5\u89E3\u6790\u56FE\u7247\u7684 novelai \u7684 tag \u548C comfyui \u7684\u5DE5\u4F5C\u6D41</span>
                </div>
            </a>
            <a href="https://novelai-tag.pages.dev/" target="_blank" class="st-chatu8-about-link st-chatu8-site-link">
                <i class="fa-solid fa-tags st-chatu8-site-icon"></i>
                <div class="st-chatu8-site-content">
                    <span class="st-chatu8-site-title">NovelAI Tag</span>
                    <span class="st-chatu8-site-description">novelai \u7684\u753B\u5E08\u4E32\u5206\u4EAB\u7AD9\u70B9</span>
                </div>
            </a>
        </div>
    </div>
    <div class="st-chatu8-settings-section">
        <h3>\u{1F4CB} \u66F4\u65B0\u65E5\u5FD7</h3>
        <div class="st-chatu8-update-header">
            <button id="ch-check-update" class="st-chatu8-btn">\u68C0\u67E5\u66F4\u65B0</button>
            <span id="ch-update-status" class="st-chatu8-update-status"></span>
        </div>
        <div id="ch-update-notes" class="st-chatu8-changelog-container">
            <div class="st-chatu8-changelog-loading">\u6B63\u5728\u83B7\u53D6\u66F4\u65B0\u65E5\u5FD7...</div>
        </div>
    </div>
    ${DISCLAIMER_CONTENT}
</div>
`;
  return baseContent;
}

function injectProtectedDisclaimer(container) {
  if (!container) return;
  const aboutTab = container.querySelector("#ch-tab-about");
  if (!aboutTab) return;
  const existingDisclaimer = aboutTab.querySelectorAll(".st-chatu8-disclaimer");
  existingDisclaimer.forEach((el) => {
    const parentSection = el.closest(".st-chatu8-settings-section");
    if (parentSection) {
      parentSection.remove();
    }
  });
  aboutTab.insertAdjacentHTML("beforeend", DISCLAIMER_CONTENT);
}

function initAboutProtection(container) {
  if (!container) return;
  const aboutTab = container.querySelector("#st-chatu8-tab-about");
  if (!aboutTab) return;
  injectProtectedDisclaimer(aboutTab);
  const observer = new MutationObserver((mutations) => {
    let needsRestore = false;
    for (const mutation of mutations) {
      if (mutation.removedNodes.length > 0) {
        for (const node of mutation.removedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = (
              /** @type {Element} */
              node
            );
            if (el.classList?.contains("st-chatu8-disclaimer") || el.querySelector?.(".st-chatu8-disclaimer")) {
              needsRestore = true;
              break;
            }
          }
        }
      }
      if (mutation.type === "characterData") {
        const parent = mutation.target.parentElement;
        if (parent?.closest(".st-chatu8-disclaimer")) {
          needsRestore = true;
        }
      }
    }
    if (needsRestore) {
      console.warn("[About] \u68C0\u6D4B\u5230\u58F0\u660E\u5185\u5BB9\u88AB\u4FEE\u6539\uFF0C\u6B63\u5728\u6062\u590D...");
      injectProtectedDisclaimer(aboutTab);
    }
  });
  observer.observe(aboutTab, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

export { getAboutPageContent, initAboutProtection };
