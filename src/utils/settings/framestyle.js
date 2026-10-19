// 还原自打包产物 — 原始模块: utils/settings/framestyle.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";

var currentFrameStyleCSS;

currentFrameStyleCSS = "";

function injectFrameStyleToDocument(targetDoc) {
  if (!targetDoc || !currentFrameStyleCSS) return;
  const styleId = "st-chatu8-image-frame-style";
  let styleEl = targetDoc.getElementById(styleId);
  if (!styleEl) {
    styleEl = targetDoc.createElement("style");
    styleEl.id = styleId;
    const target = targetDoc.head || targetDoc.documentElement;
    if (target) {
      target.appendChild(styleEl);
    } else {
      return;
    }
  }
  if (styleEl.textContent !== currentFrameStyleCSS) {
    styleEl.textContent = currentFrameStyleCSS;
  }
}

function applyImageFrameStyle(styleName, isDark = true) {
  const styleId = "st-chatu8-image-frame-style";
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  const settings3 = extension_settings[extensionName];
  const alignment = settings3?.imageAlignment || "center";
  const imageSizeScale = settings3?.imageSizeScale || "100";
  let css = "";
  const containerSelector = ".st-chatu8-image-container";
  const imgSelector = `${containerSelector} img, ${containerSelector} video`;
  css += `
        ${containerSelector} {
            display: block;
            position: relative;
            line-height: 0;
            text-align: ${alignment};
            margin: 0.5em 0;
        }
        ${containerSelector} img,
        ${containerSelector} video {
            display: inline-block !important;
            max-width: ${imageSizeScale}% !important;
            max-height: none !important;
            height: auto !important;
            vertical-align: middle;
        }
    `;
  switch (styleName) {
    case "\u65E0\u6837\u5F0F":
    default:
      css += `
                ${imgSelector} {
                    border: none !important;
                    box-shadow: none !important;
                    outline: none !important;
                    border-radius: 0 !important;
                }
            `;
      break;
    case "\u7B80\u7EA6\u767D\u8FB9":
      css += `
                ${imgSelector} {
                    border: 3px solid rgba(255, 255, 255, 0.9) !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
                    border-radius: 2px !important;
                }
            `;
      if (!isDark) {
        css += `
                    ${imgSelector} {
                        border-color: rgba(30, 30, 30, 0.85) !important;
                    }
                `;
      }
      break;
    case "\u67D4\u548C\u9634\u5F71":
      css += `
                ${imgSelector} {
                    border: none !important;
                    box-shadow: 
                        0 4px 12px rgba(0, 0, 0, 0.15),
                        0 2px 4px rgba(0, 0, 0, 0.1) !important;
                    border-radius: 4px !important;
                }
            `;
      break;
    case "\u5706\u89D2\u76F8\u6846":
      css += `
                ${imgSelector} {
                    border: 2px solid rgba(128, 128, 128, 0.3) !important;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
                    border-radius: 12px !important;
                }
            `;
      break;
    case "\u590D\u53E4\u753B\u6846":
      css += `
                ${imgSelector} {
                    border: 4px solid #8B7355 !important;
                    box-shadow: 
                        inset 0 0 0 1px rgba(255, 255, 255, 0.2),
                        0 4px 12px rgba(0, 0, 0, 0.3),
                        2px 2px 0 #6B5344,
                        4px 4px 0 #5A4436 !important;
                    border-radius: 2px !important;
                }
            `;
      break;
    case "\u79D1\u6280\u8FB9\u6846":
      css += `
                ${imgSelector} {
                    border: 2px solid rgba(0, 255, 255, 0.6) !important;
                    box-shadow: 
                        0 0 8px rgba(0, 255, 255, 0.3),
                        0 0 2px rgba(0, 255, 255, 0.5),
                        inset 0 0 12px rgba(0, 255, 255, 0.05) !important;
                    border-radius: 4px !important;
                }
            `;
      break;
    case "\u9713\u8679\u5149\u6655":
      css += `
                ${imgSelector} {
                    border: 2px solid rgba(255, 0, 128, 0.7) !important;
                    box-shadow: 
                        0 0 10px rgba(255, 0, 128, 0.4),
                        0 0 20px rgba(0, 200, 255, 0.2),
                        0 0 4px rgba(255, 255, 255, 0.3) !important;
                    border-radius: 4px !important;
                }
            `;
      break;
    case "\u73BB\u7483\u8D28\u611F":
      css += `
                ${imgSelector} {
                    border: 1px solid rgba(255, 255, 255, 0.25) !important;
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
                    border-radius: 8px !important;
                }
            `;
      if (!isDark) {
        css += `
                    ${imgSelector} {
                        border-color: rgba(0, 0, 0, 0.1) !important;
                    }
                `;
      }
      break;
    case "\u6E10\u53D8\u8FB9\u6846":
      css += `
                ${containerSelector} {
                    padding: 3px !important;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%) !important;
                    border-radius: 6px !important;
                }
                ${imgSelector} {
                    border: none !important;
                    border-radius: 4px !important;
                    box-shadow: none !important;
                }
            `;
      break;
    case "\u91D1\u8272\u753B\u6846":
      css += `
                ${imgSelector} {
                    border: 4px solid #C9A227 !important;
                    box-shadow: 
                        inset 0 0 0 1px rgba(255, 215, 0, 0.3),
                        0 0 0 1px #8B6914,
                        0 4px 12px rgba(0, 0, 0, 0.25) !important;
                    border-radius: 2px !important;
                }
            `;
      break;
    case "\u6781\u7B80\u7EBF\u6761":
      css += `
                ${imgSelector} {
                    border: 1px solid rgba(128, 128, 128, 0.4) !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                }
            `;
      break;
    case "\u6D6E\u96D5\u6548\u679C":
      css += `
                ${imgSelector} {
                    border: 3px solid transparent !important;
                    box-shadow: 
                        3px 3px 6px rgba(0, 0, 0, 0.2),
                        -2px -2px 4px rgba(255, 255, 255, 0.1),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
                    border-radius: 4px !important;
                }
            `;
      break;
    case "\u6F2B\u753B\u98CE\u683C":
      css += `
                ${imgSelector} {
                    border: 3px solid #1a1a1a !important;
                    box-shadow: 
                        4px 4px 0 #1a1a1a !important;
                    border-radius: 2px !important;
                }
            `;
      if (!isDark) {
      }
      break;
    case "\u80F6\u7247\u8FB9\u6846":
      css += `
                ${containerSelector} {
                    padding: 8px 4px !important;
                    background: #1a1a1a !important;
                    border-radius: 2px !important;
                    position: relative !important;
                }
                ${containerSelector}::before,
                ${containerSelector}::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 8px;
                    background: 
                        repeating-linear-gradient(
                            to bottom,
                            transparent 0px,
                            transparent 4px,
                            rgba(255, 255, 255, 0.3) 4px,
                            rgba(255, 255, 255, 0.3) 8px
                        );
                }
                ${containerSelector}::before {
                    left: -4px;
                }
                ${containerSelector}::after {
                    right: -4px;
                }
                ${imgSelector} {
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                }
            `;
      break;
  }
  styleEl.textContent = css;
  currentFrameStyleCSS = css;
}

export { applyImageFrameStyle, injectFrameStyleToDocument };
