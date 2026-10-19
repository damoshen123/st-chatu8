// 还原自打包产物 — 原始模块: utils/settings/openingVideo.js
import { extension_settings } from "../../../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../../../script.js";
import { extensionFolderPath, extensionName } from "../config.js";
import { addLog } from "../utils.js";
import { __set_hasPlayedOnce, __set_videoContainer, hasPlayedOnce, videoContainer } from "../configHelper/settingsHelpText.js";

function generateRandomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function showCodeGenerationAnimation() {
  const container = videoContainer;
  if (!container) return;
  const isMobile3 = window.innerWidth <= 768;
  const animationContainer = document.createElement("div");
  animationContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, rgba(135, 206, 235, 0.85) 0%, rgba(176, 224, 230, 0.85) 50%, rgba(224, 246, 255, 0.85) 100%);
        z-index: 100002;
        animation: fadeIn 0.5s ease-in;
        padding: 20px;
        box-sizing: border-box;
    `;
  const title = document.createElement("div");
  title.textContent = "\u{1F3A8} \u521D\u6B21\u89C1\u9762\uFF0C\u8BA9\u6211\u4EEC\u5EFA\u7ACB\u8FDE\u63A5\u5427 \u2728";
  title.style.cssText = `
        font-size: ${isMobile3 ? "18px" : "24px"};
        font-weight: bold;
        color: #2C5F8D;
        margin-bottom: ${isMobile3 ? "10px" : "15px"};
        text-shadow: 0 2px 8px rgba(255, 255, 255, 0.8);
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
        animation: pulse 1.5s ease-in-out infinite;
        text-align: center;
    `;
  const subtitle = document.createElement("div");
  subtitle.textContent = "\u6BCF\u4E2A\u6784\u7B51\u5E08\u90FD\u6709\u4E13\u5C5E\u7684\u667A\u7ED8\u59EC\u7F16\u53F7\u54E6~";
  subtitle.style.cssText = `
        font-size: ${isMobile3 ? "14px" : "16px"};
        color: #4A90C8;
        margin-bottom: ${isMobile3 ? "20px" : "30px"};
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
        text-align: center;
    `;
  const codeDisplay = document.createElement("div");
  codeDisplay.style.cssText = `
        font-size: ${isMobile3 ? "48px" : "72px"};
        font-weight: bold;
        color: #4A90E2;
        letter-spacing: ${isMobile3 ? "10px" : "15px"};
        text-shadow: 0 0 20px rgba(74, 144, 226, 0.6),
                     0 0 40px rgba(74, 144, 226, 0.3),
                     0 4px 8px rgba(255, 255, 255, 0.8);
        font-family: "Courier New", monospace;
        margin-bottom: ${isMobile3 ? "30px" : "40px"};
        min-width: ${isMobile3 ? "200px" : "300px"};
        text-align: center;
        animation: glow 1s ease-in-out infinite alternate;
    `;
  codeDisplay.textContent = "????";
  const clickButton = document.createElement("button");
  clickButton.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> \u751F\u6210\u4E13\u5C5E\u667A\u7ED8\u59EC\u7F16\u53F7';
  clickButton.style.cssText = `
        padding: ${isMobile3 ? "12px 30px" : "15px 40px"};
        font-size: ${isMobile3 ? "16px" : "20px"};
        font-weight: bold;
        color: white;
        background: linear-gradient(45deg, #5DADE2, #3498DB);
        border: none;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
        transition: all 0.3s ease;
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
        animation: bounce 2s ease-in-out infinite;
        text-align: center;
    `;
  clickButton.onmouseover = () => {
    clickButton.style.transform = "scale(1.1)";
    clickButton.style.boxShadow = "0 12px 30px rgba(52, 152, 219, 0.6)";
  };
  clickButton.onmouseout = () => {
    clickButton.style.transform = "scale(1)";
    clickButton.style.boxShadow = "0 8px 20px rgba(52, 152, 219, 0.4)";
  };
  clickButton.onclick = () => {
    clickButton.disabled = true;
    clickButton.style.opacity = "0.5";
    clickButton.style.cursor = "not-allowed";
    let rollCount = 0;
    const maxRolls = 20;
    const rollInterval = setInterval(() => {
      codeDisplay.textContent = generateRandomCode();
      rollCount++;
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        const settings3 = extension_settings[extensionName];
        const finalCode = settings3 && settings3.chatu8_code || generateRandomCode();
        if (settings3 && !settings3.chatu8_code) {
          settings3.chatu8_code = finalCode;
          saveSettingsDebounced();
          addLog(`[OpeningVideo] \u667A\u7ED8\u59EC\u7F16\u53F7\u515C\u5E95\u4FDD\u5B58: ${finalCode}`);
        }
        codeDisplay.textContent = finalCode;
        codeDisplay.style.animation = "flash 0.5s ease-in-out 3";
        addLog(`[OpeningVideo] \u63ED\u6653\u667A\u7ED8\u59EC\u7F16\u53F7: ${finalCode}`);
        setTimeout(() => {
          const confirmText = document.createElement("div");
          confirmText.innerHTML = `
                        <div style="font-size: ${isMobile3 ? "18px" : "24px"}; color: #2C5F8D; margin-top: 20px; animation: fadeIn 0.5s ease-in; text-align: center; font-weight: bold;">
                            \u2728 \u4F60\u7684\u4E13\u5C5E\u667A\u7ED8\u59EC\u7F16\u53F7\u662F\uFF1A<span style="color: #4A90E2; font-weight: bold; text-shadow: 0 2px 8px rgba(74, 144, 226, 0.4);">${finalCode}</span>
                        </div>
                        <div style="font-size: ${isMobile3 ? "14px" : "16px"}; color: #5DADE2; margin-top: 15px; text-align: center; line-height: 1.6;">
                            \u4ECE\u73B0\u5728\u5F00\u59CB\uFF0C\u6211\u4F1A\u966A\u4F34\u4F60\u4F7F\u7528\u8FD9\u4E2A\u63D2\u4EF6\uFF01<br>
                            \u6709\u4EFB\u4F55\u7591\u95EE\u90FD\u53EF\u4EE5\u95EE\u6211\u54E6~ \u{1F496}
                        </div>
                    `;
          animationContainer.appendChild(confirmText);
          setTimeout(() => {
            const confirmButton = document.createElement("button");
            confirmButton.innerHTML = '<i class="fa-solid fa-comments"></i> \u5F00\u59CB\u4E0E\u667A\u7ED8\u59EC\u5BF9\u8BDD';
            confirmButton.style.cssText = `
                            margin-top: 30px;
                            padding: ${isMobile3 ? "12px 35px" : "15px 45px"};
                            font-size: ${isMobile3 ? "16px" : "20px"};
                            font-weight: bold;
                            color: white;
                            background: linear-gradient(45deg, #5DADE2, #3498DB);
                            border: 2px solid rgba(255, 255, 255, 0.5);
                            border-radius: 50px;
                            cursor: pointer;
                            box-shadow: 0 8px 25px rgba(52, 152, 219, 0.5);
                            transition: all 0.3s ease;
                            font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
                            animation: fadeIn 0.5s ease-in, glow 2s ease-in-out infinite alternate;
                        `;
            confirmButton.onmouseover = () => {
              confirmButton.style.transform = "scale(1.05) translateY(-2px)";
              confirmButton.style.boxShadow = "0 12px 35px rgba(52, 152, 219, 0.7)";
            };
            confirmButton.onmouseout = () => {
              confirmButton.style.transform = "scale(1) translateY(0)";
              confirmButton.style.boxShadow = "0 8px 25px rgba(52, 152, 219, 0.5)";
            };
            confirmButton.onclick = () => {
              confirmButton.style.transform = "scale(0.95)";
              confirmButton.disabled = true;
              confirmButton.style.opacity = "0.5";
              confirmText.style.animation = "fadeOut 0.5s ease-out";
              confirmButton.style.animation = "fadeOut 0.5s ease-out";
              setTimeout(() => {
                confirmText.remove();
                confirmButton.remove();
                const greetingText = document.createElement("div");
                greetingText.innerHTML = `
                                    <div style="font-size: ${isMobile3 ? "20px" : "28px"}; color: #2C5F8D; margin-bottom: 20px; animation: fadeIn 0.8s ease-in; text-align: center; font-weight: bold;">
                                        \u4F60\u597D\uFF0C\u6784\u7B51\u5E08\uFF01\u{1F44B}
                                    </div>
                                    <div style="font-size: ${isMobile3 ? "16px" : "20px"}; color: #4A90E2; margin-bottom: 15px; animation: fadeIn 1s ease-in; text-align: center; line-height: 1.8;">
                                        \u6211\u662F\u7F16\u53F7 <span style="color: #3498DB; font-weight: bold; letter-spacing: 2px;">${finalCode}</span> \u7684\u667A\u7ED8\u59EC<br>
                                        \u5F88\u9AD8\u5174\u8BA4\u8BC6\u4F60\uFF01\u2728
                                    </div>
                                    <div style="font-size: ${isMobile3 ? "14px" : "16px"}; color: #5DADE2; margin-top: 20px; animation: fadeIn 1.2s ease-in; text-align: center; line-height: 1.8;">
                                        \u4EE5\u540E\u4F60\u53EF\u4EE5\u901A\u8FC7\u4EE5\u4E0B\u65B9\u5F0F\u53EC\u5524\u6211\uFF1A<br>
                                        \u{1F4CD} \u70B9\u51FB\u8BBE\u7F6E\u754C\u9762\u5DE6\u4E0A\u89D2\u7684\u5934\u50CF<br>
                                        \u{1F4CD} \u957F\u6309\u60AC\u6D6E\u7403\uFF08\u667A\u7ED8\u59EC\u56FE\u6807\uFF09<br><br>
                                        \u73B0\u5728\uFF0C\u8BA9\u6211\u4EEC\u5148\u914D\u7F6E\u4E00\u4E0B\u6211\u7684 API \u5427~ \u{1F496}
                                    </div>
                                `;
                animationContainer.appendChild(greetingText);
                setTimeout(() => {
                  const startButton = document.createElement("button");
                  startButton.innerHTML = '<i class="fa-solid fa-gear"></i> \u5F00\u59CB\u8BBE\u7F6E API';
                  startButton.style.cssText = `
                                        margin-top: 30px;
                                        padding: ${isMobile3 ? "12px 35px" : "15px 45px"};
                                        font-size: ${isMobile3 ? "16px" : "20px"};
                                        font-weight: bold;
                                        color: white;
                                        background: linear-gradient(45deg, #5DADE2, #3498DB);
                                        border: 2px solid rgba(255, 255, 255, 0.5);
                                        border-radius: 50px;
                                        cursor: pointer;
                                        box-shadow: 0 8px 25px rgba(52, 152, 219, 0.5);
                                        transition: all 0.3s ease;
                                        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
                                        animation: fadeIn 0.5s ease-in, glow 2s ease-in-out infinite alternate;
                                    `;
                  startButton.onmouseover = () => {
                    startButton.style.transform = "scale(1.05) translateY(-2px)";
                    startButton.style.boxShadow = "0 12px 35px rgba(52, 152, 219, 0.7)";
                  };
                  startButton.onmouseout = () => {
                    startButton.style.transform = "scale(1) translateY(0)";
                    startButton.style.boxShadow = "0 8px 25px rgba(52, 152, 219, 0.5)";
                  };
                  startButton.onclick = () => {
                    startButton.style.transform = "scale(0.95)";
                    setTimeout(() => {
                      animationContainer.style.animation = "fadeOut 0.8s ease-out";
                      setTimeout(() => {
                        animationContainer.remove();
                        closeVideo();
                        setTimeout(() => {
                          const aiDialog = document.getElementById("st-chatu8-ai-dialog");
                          if (aiDialog && !aiDialog.classList.contains("active")) {
                            const dialogWidth = aiDialog.offsetWidth;
                            const dialogHeight = aiDialog.offsetHeight;
                            const viewportWidth = window.innerWidth;
                            const viewportHeight = window.innerHeight;
                            const centerLeft = (viewportWidth - dialogWidth) / 2;
                            const centerTop = (viewportHeight - dialogHeight) / 2;
                            aiDialog.style.left = Math.max(0, centerLeft) + "px";
                            aiDialog.style.top = Math.max(0, centerTop) + "px";
                            aiDialog.classList.add("active");
                            const settingsPanel = document.getElementById("st-chatu8-ai-settings-panel");
                            if (settingsPanel) {
                              settingsPanel.classList.add("active");
                              addLog("[OpeningVideo] \u5DF2\u6253\u5F00\u667A\u7ED8\u59ECAI\u52A9\u624BAPI\u8BBE\u7F6E\u9762\u677F");
                            }
                          }
                        }, 300);
                      }, 800);
                    }, 200);
                  };
                  animationContainer.appendChild(startButton);
                }, 3e3);
              }, 500);
            };
            animationContainer.appendChild(confirmButton);
          }, 800);
        }, 500);
      }
    }, 100);
  };
  animationContainer.appendChild(title);
  animationContainer.appendChild(subtitle);
  animationContainer.appendChild(codeDisplay);
  animationContainer.appendChild(clickButton);
  container.appendChild(animationContainer);
}

function createVideoContainer() {
  if (videoContainer) return videoContainer;
  __set_videoContainer(document.createElement("div"));
  videoContainer.id = "st-chatu8-opening-video-container";
  videoContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        z-index: 99999;
        display: none;
        justify-content: center;
        align-items: center;
    `;
  const style = document.createElement("style");
  style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        @keyframes glow {
            from { text-shadow: 0 0 15px rgba(74, 144, 226, 0.4), 0 0 30px rgba(74, 144, 226, 0.2); }
            to { text-shadow: 0 0 20px rgba(74, 144, 226, 0.6), 0 0 40px rgba(74, 144, 226, 0.3); }
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes flash {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
    `;
  document.head.appendChild(style);
  const video = document.createElement("video");
  video.id = "st-chatu8-opening-video";
  video.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    `;
  video.autoplay = true;
  video.playsInline = true;
  const isMobile3 = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  video.muted = isMobile3;
  let volumeButton = null;
  if (isMobile3) {
    volumeButton = document.createElement("button");
    volumeButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    volumeButton.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 10px 15px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 5px;
            cursor: pointer;
            font-size: 18px;
            transition: background 0.3s;
            z-index: 100000;
        `;
    volumeButton.onclick = () => {
      video.muted = !video.muted;
      volumeButton.innerHTML = video.muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
    };
  }
  const chatu8Path = `${extensionFolderPath}/html/settings/enter.chatu8`;
  fetch(chatu8Path).then((res) => {
    if (!res.ok) throw new Error("enter.chatu8 load failed");
    return res.blob();
  }).then((blob) => {
    if (blob.type !== "video/mp4") {
      video.src = URL.createObjectURL(new Blob([blob], { type: "video/mp4" }));
    } else {
      video.src = URL.createObjectURL(blob);
    }
  }).catch((err) => {
    console.warn("[OpeningVideo] \u65B0\u7248\u89C6\u9891\u683C\u5F0F\u52A0\u8F7D\u5931\u8D25\u6216\u672A\u66F4\u65B0\uFF0C\u5C1D\u8BD5\u56DE\u9000:", err);
    const videoFormats = ["mp4", "webm", "ogg"];
    for (const format of videoFormats) {
      const source = document.createElement("source");
      const encodedFileName = encodeURIComponent("\u767B\u573A") + "." + format;
      source.src = `${extensionFolderPath}/html/settings/${encodedFileName}`;
      source.type = `video/${format}`;
      video.appendChild(source);
    }
  });
  const skipButton = document.createElement("button");
  skipButton.textContent = "\u8DF3\u8FC7 (ESC)";
  skipButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s;
        z-index: 100000;
    `;
  skipButton.onmouseover = () => {
    skipButton.style.background = "rgba(255, 255, 255, 0.4)";
  };
  skipButton.onmouseout = () => {
    skipButton.style.background = "rgba(255, 255, 255, 0.2)";
  };
  videoContainer.appendChild(video);
  if (volumeButton) {
    videoContainer.appendChild(volumeButton);
  }
  videoContainer.appendChild(skipButton);
  document.body.appendChild(videoContainer);
  video.addEventListener("ended", () => {
    skipButton.style.display = "none";
    if (volumeButton) {
      volumeButton.style.display = "none";
    }
    showCodeGenerationAnimation();
  });
  skipButton.addEventListener("click", (e) => {
    e.stopPropagation();
    video.pause();
    video.currentTime = video.duration;
    skipButton.style.display = "none";
    if (volumeButton) {
      volumeButton.style.display = "none";
    }
    showCodeGenerationAnimation();
  });
  const escHandler = (e) => {
    if (e.key === "Escape" && videoContainer.style.display === "flex") {
      video.pause();
      video.currentTime = video.duration;
      skipButton.style.display = "none";
      if (volumeButton) {
        volumeButton.style.display = "none";
      }
      showCodeGenerationAnimation();
    }
  };
  document.addEventListener("keydown", escHandler);
  videoContainer.addEventListener("click", (e) => {
    if (e.target === videoContainer) {
      video.pause();
      video.currentTime = video.duration;
      skipButton.style.display = "none";
      if (volumeButton) {
        volumeButton.style.display = "none";
      }
      showCodeGenerationAnimation();
    }
  });
  return videoContainer;
}

function playOpeningVideo() {
  const settings3 = extension_settings[extensionName];
  if (settings3 && settings3.chatu8_code) {
    addLog(`[OpeningVideo] \u5DF2\u6709\u667A\u7ED8\u59EC\u7F16\u53F7 ${settings3.chatu8_code}\uFF0C\u8DF3\u8FC7\u5F00\u573A\u89C6\u9891`);
    return;
  }
  if (hasPlayedOnce) {
    addLog("[OpeningVideo] \u672C\u6B21\u4F1A\u8BDD\u5DF2\u64AD\u653E\u8FC7\u5F00\u573A\u89C6\u9891\uFF0C\u8DF3\u8FC7");
    return;
  }
  if (settings3 && !settings3.chatu8_code) {
    const preGeneratedCode = generateRandomCode();
    settings3.chatu8_code = preGeneratedCode;
    saveSettingsDebounced();
    addLog(`[OpeningVideo] \u7F16\u53F7\u524D\u7F6E\u751F\u6210\u5E76\u4FDD\u5B58: ${preGeneratedCode}`);
  }
  try {
    const container = createVideoContainer();
    const video = container.querySelector("video");
    if (!video) {
      console.error("[OpeningVideo] \u89C6\u9891\u5143\u7D20\u672A\u627E\u5230");
      return;
    }
    container.style.display = "flex";
    const isMobile3 = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const canPlayHandler = () => {
      video.removeEventListener("canplay", canPlayHandler);
      const playPromise = video.play();
      if (playPromise !== void 0) {
        playPromise.then(() => {
          addLog("[OpeningVideo] \u5F00\u573A\u89C6\u9891\u64AD\u653E\u6210\u529F");
          __set_hasPlayedOnce(true);
          if (isMobile3 && video.muted) {
            const toast = document.createElement("div");
            toast.textContent = "\u70B9\u51FB\u5DE6\u4E0A\u89D2\u56FE\u6807\u5F00\u542F\u58F0\u97F3";
            toast.style.cssText = `
                                position: absolute;
                                bottom: 80px;
                                left: 50%;
                                transform: translateX(-50%);
                                padding: 10px 20px;
                                background: rgba(0, 0, 0, 0.7);
                                color: white;
                                border-radius: 5px;
                                font-size: 14px;
                                z-index: 100001;
                                animation: fadeOut 3s forwards;
                            `;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 3e3);
          }
        }).catch((error) => {
          console.error("[OpeningVideo] \u89C6\u9891\u64AD\u653E\u5931\u8D25:", error);
          addLog("[OpeningVideo] \u89C6\u9891\u64AD\u653E\u5931\u8D25: " + error.message);
          if (isMobile3) {
            const playButton = document.createElement("button");
            playButton.innerHTML = '<i class="fa-solid fa-play"></i> \u70B9\u51FB\u64AD\u653E';
            playButton.style.cssText = `
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                padding: 15px 30px;
                                background: rgba(255, 255, 255, 0.9);
                                color: #333;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 18px;
                                font-weight: bold;
                                z-index: 100001;
                            `;
            playButton.onclick = () => {
              video.play().then(() => {
                playButton.remove();
                __set_hasPlayedOnce(true);
              }).catch((err) => {
                console.error("[OpeningVideo] \u624B\u52A8\u64AD\u653E\u4E5F\u5931\u8D25:", err);
                closeVideo();
              });
            };
            container.appendChild(playButton);
          } else {
            closeVideo();
          }
        });
      }
    };
    const errorHandler = (e) => {
      const sources = video.querySelectorAll("source");
      const allFailed = Array.from(sources).every((source) => {
        return source.error !== null;
      });
      if (allFailed) {
        console.warn("[OpeningVideo] \u6240\u6709\u89C6\u9891\u683C\u5F0F\u90FD\u52A0\u8F7D\u5931\u8D25\uFF0C\u89C6\u9891\u6587\u4EF6\u53EF\u80FD\u4E0D\u5B58\u5728");
        addLog("[OpeningVideo] \u89C6\u9891\u6587\u4EF6\u672A\u627E\u5230\uFF0C\u5DF2\u8DF3\u8FC7\u64AD\u653E");
        closeVideo();
        video.removeEventListener("error", errorHandler);
      }
    };
    video.addEventListener("canplay", canPlayHandler);
    video.addEventListener("error", errorHandler);
    setTimeout(() => {
      if (container.style.display === "flex" && video.paused && !container.querySelector("button[onclick]")) {
        addLog("[OpeningVideo] \u89C6\u9891\u52A0\u8F7D\u8D85\u65F6\uFF0C\u5DF2\u8DF3\u8FC7");
        closeVideo();
      }
    }, 3e3);
  } catch (error) {
    console.error("[OpeningVideo] \u64AD\u653E\u5F00\u573A\u89C6\u9891\u65F6\u51FA\u9519:", error);
    closeVideo();
  }
}

function closeVideo() {
  if (!videoContainer) return;
  videoContainer.style.animation = "fadeOut 0.5s ease-out";
  setTimeout(() => {
    videoContainer.style.display = "none";
    videoContainer.style.animation = "";
  }, 500);
  addLog("[OpeningVideo] \u5F00\u573A\u89C6\u9891\u5DF2\u5173\u95ED");
}

export { playOpeningVideo };
