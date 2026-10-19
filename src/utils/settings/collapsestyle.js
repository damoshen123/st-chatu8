// 还原自打包产物 — 原始模块: utils/settings/collapsestyle.js
import "../config.js"; // init_config

var currentCollapseStyleCSS;

currentCollapseStyleCSS = "";

function injectCollapseStyleToDocument(targetDoc) {
  if (!targetDoc || !currentCollapseStyleCSS) return;
  const styleId = "st-chatu8-collapse-style";
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
  if (styleEl.textContent !== currentCollapseStyleCSS) {
    styleEl.textContent = currentCollapseStyleCSS;
  }
}

function applyCollapseStyle(styleName, isDark = true) {
  const styleId = "st-chatu8-collapse-style";
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  const css = generateCollapseStyleCSS(styleName, isDark);
  styleEl.textContent = css;
  currentCollapseStyleCSS = css;
}

function generateCollapseStyleCSS(styleName, isDark) {
  const wrapper = ".st-chatu8-collapse-wrapper";
  const header = ".st-chatu8-collapse-header";
  const icon = ".st-chatu8-collapse-icon";
  const title = ".st-chatu8-collapse-title";
  const badge = ".st-chatu8-collapse-badge";
  const content = ".st-chatu8-collapse-content";
  let css = `
        ${wrapper} {
            margin: 8px 0;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s ease;
            border: none;
        }
        ${header} {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            cursor: pointer;
            user-select: none;
            transition: all 0.2s ease;
            font-size: 14px;
        }
        ${icon} {
            font-size: 16px;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            line-height: 1;
            text-indent: 1px;
        }
        ${wrapper}[data-collapsed="true"] ${icon} {
            transform: rotate(-90deg);
        }
        ${wrapper}[data-collapsed="false"] ${icon} {
            transform: rotate(0deg);
        }
        ${title} {
            flex: 1;
            font-weight: 500;
            letter-spacing: 0.3px;
        }
        ${badge} {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        ${content} {
            overflow: hidden;
            transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                        opacity 0.3s ease,
                        padding 0.3s ease;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        ${content} .st-chatu8-image-container {
            margin: 0;
        }
        ${content} .st-chatu8-image-container img,
        ${content} .st-chatu8-image-container video {
            display: block;
            max-width: 100%;
            height: auto;
        }
        ${wrapper}[data-collapsed="true"] ${content} {
            max-height: 0;
            opacity: 0;
            padding: 0;
        }
        ${wrapper}[data-collapsed="false"] ${content} {
            max-height: 2000px;
            opacity: 1;
        }
    `;
  css += getThemeSpecificCSS(styleName, isDark, wrapper, header, icon, title, badge, content);
  return css;
}

function getThemeSpecificCSS(styleName, isDark, wrapper, header, icon, title, badge, content) {
  switch (styleName) {
    case "\u9ED8\u8BA4":
    default:
      return `
                ${wrapper} {
                    background: transparent;
                }
                ${header} {
                    background: linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(74, 144, 226, 0.08) 100%);
                    color: #a8c8f0;
                }
                ${header}:hover {
                    background: linear-gradient(135deg, rgba(74, 144, 226, 0.25) 0%, rgba(74, 144, 226, 0.15) 100%);
                    color: #c0dcff;
                }
                ${wrapper}[data-collapsed="true"] ${badge} {
                    background: rgba(255, 193, 7, 0.2);
                    color: #ffc107;
                }
                ${wrapper}[data-collapsed="false"] ${badge} {
                    background: rgba(74, 144, 226, 0.2);
                    color: #8ab4f8;
                }
            `;
    case "\u6781\u7B80\u7EBF\u6761":
      return `
                ${wrapper} {
                    background: transparent;
                    border-radius: 4px;
                }
                ${header} {
                    background: transparent;
                    color: ${isDark ? "#e0e0e0" : "#333"};
                    border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"};
                }
                ${header}:hover {
                    background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"};
                }
                ${badge} {
                    background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"};
                    color: ${isDark ? "#aaa" : "#666"};
                }
            `;
    case "\u79D1\u6280\u9713\u8679":
      return `
                ${wrapper} {
                    background: transparent;
                }
                ${header} {
                    background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 200, 255, 0.05) 100%);
                    color: #0ff;
                }
                ${header}:hover {
                    background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 200, 255, 0.1) 100%);
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
                }
                ${icon} { color: #0ff; }
                ${badge} {
                    background: rgba(0, 255, 255, 0.15);
                    color: #0ff;
                    border: 1px solid rgba(0, 255, 255, 0.3);
                }
            `;
    case "\u73BB\u7483\u8D28\u611F":
      return `
                ${wrapper} {
                    background: transparent;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                ${header} {
                    background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)"};
                    color: ${isDark ? "#e8e8e8" : "#333"};
                }
                ${header}:hover {
                    background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)"};
                }
                ${badge} {
                    background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"};
                    color: ${isDark ? "#ccc" : "#555"};
                }
            `;
    case "\u6696\u8272\u6E29\u99A8":
      return `
                ${wrapper} {
                    background: transparent;
                }
                ${header} {
                    background: linear-gradient(135deg, rgba(255, 160, 64, 0.15) 0%, rgba(255, 180, 80, 0.1) 100%);
                    color: #ffb347;
                }
                ${header}:hover {
                    background: linear-gradient(135deg, rgba(255, 160, 64, 0.25) 0%, rgba(255, 180, 80, 0.18) 100%);
                    color: #ffc96b;
                }
                ${badge} {
                    background: rgba(255, 160, 64, 0.2);
                    color: #ffb347;
                }
            `;
    case "\u68EE\u6797\u7EFF\u610F":
      return `
                ${wrapper} {
                    background: transparent;
                }
                ${header} {
                    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(102, 187, 106, 0.1) 100%);
                    color: #81c784;
                }
                ${header}:hover {
                    background: linear-gradient(135deg, rgba(76, 175, 80, 0.25) 0%, rgba(102, 187, 106, 0.18) 100%);
                    color: #a5d6a7;
                }
                ${badge} {
                    background: rgba(76, 175, 80, 0.2);
                    color: #81c784;
                }
            `;
    case "\u5C11\u5973\u7C89\u5F69":
      return `
                ${wrapper} {
                    background: transparent;
                }
                ${header} {
                    background: linear-gradient(135deg, rgba(233, 30, 99, 0.12) 0%, rgba(156, 39, 176, 0.08) 100%);
                    color: #f48fb1;
                }
                ${header}:hover {
                    background: linear-gradient(135deg, rgba(233, 30, 99, 0.2) 0%, rgba(156, 39, 176, 0.15) 100%);
                    color: #f8bbd9;
                }
                ${badge} {
                    background: rgba(233, 30, 99, 0.15);
                    color: #f48fb1;
                }
            `;
    case "\u661F\u7A7A\u7D2B":
      return `
                ${wrapper} {
                    background: transparent;
                }
                ${header} {
                    background: linear-gradient(135deg, rgba(103, 58, 183, 0.18) 0%, rgba(63, 81, 181, 0.12) 100%);
                    color: #b39ddb;
                }
                ${header}:hover {
                    background: linear-gradient(135deg, rgba(103, 58, 183, 0.28) 0%, rgba(63, 81, 181, 0.2) 100%);
                    color: #d1c4e9;
                }
                ${badge} {
                    background: rgba(103, 58, 183, 0.2);
                    color: #b39ddb;
                }
            `;
  }
}

export { applyCollapseStyle, injectCollapseStyleToDocument };
