// 还原自打包产物 — 原始模块: utils/iframe/generation.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource } from "../../../../../../../script.js";
import { EventType, extensionName } from "../config.js";
import { addLog, addSmoothShakeEffect, fixMp4Faststart, isPluginToastDisabled, normalizePromptTag, safeDataUrlToBlob } from "../utils.js";
import { isGenerating, startGenerating, stopGenerating } from "../generation_status.js";
import { getItemImg, setItemImg } from "../database.js";
import { showEditDialog } from "./dialogs.js";
import { generateStableId } from "./utils.js";
import { runninghubVideo_exports } from "../comfyuiVideo.js";
import { chatProcessor_exports } from "./imagePreview.js";

var _chatu8PendingImageRespHandlers, _chatu8RespDedupBound, _chatu8RespDedupEnabledCache, _showImagePreview, comfyuiVideo_exports, triggerGeneration;

_showImagePreview = null;

_chatu8PendingImageRespHandlers = /* @__PURE__ */ new Map();

_chatu8RespDedupBound = false;

_chatu8RespDedupEnabledCache = null;

triggerGeneration = (button, isMountExisting = false) => {
      if (!isMountExisting && button.hasAttribute("data-loading")) {
        addLog(`\u6309\u94AE\u5DF2\u5728\u52A0\u8F7D\u4E2D\uFF0C\u8DF3\u8FC7\u91CD\u590D\u70B9\u51FB: ${button.dataset.link?.substring(0, 50)}`);
        return;
      }
      const rawLink = button.dataset.link || "";
      const link = normalizePromptTag(rawLink);
      button.dataset.link = link;
      const change = button.dataset.change;
      const video = button.dataset.video;
      const activeMode = button.dataset.activeMode || (video && !change ? "video" : "image");
      const requestId = button.dataset.requestId || generateStableId(link);
      button.dataset.requestId = requestId;
      const isVideoMode = activeMode === "video";
      const isAssetManifest = /asset_manifest\s*:/i.test(link || "") || /asset_manifest\s*:/i.test(video || "") || /asset_manifest\s*:/i.test(change || "");
      const currentTargetText = ((isVideoMode || isAssetManifest ? video || button.dataset.videoPrompt || (/asset_manifest\s*:/i.test(link) ? link : "") : change || link) || "").trim();
      if (/^\s*asset_manifest\s*:/im.test(currentTargetText) || /asset_manifest\s*:\s*\{/i.test(currentTargetText)) {
        const channel = extension_settings[extensionName]?.videoChannel || "runninghub";
        const isRh = channel === "runninghub";
        const isComfy = channel === "comfyui";
        if (isRh || isComfy) {
          const alreadyGenerating = isGenerating(link);
          if (alreadyGenerating) {
            addLog(`[VideoGen] \u89C6\u9891\u751F\u6210\u8BF7\u6C42\u5DF2\u5728\u8FDB\u884C\u4E2D\uFF0C\u7B49\u5F85\u54CD\u5E94: ${link}`);
            button.setAttribute("data-loading", "true");
            button.dataset.loadingStartedAt = String(Date.now());
            button.textContent = "\u89C6\u9891\u751F\u6210\u4E2D...";
            const videoResponseHandler = (responseData) => {
              if (responseData.id !== requestId) return;
              untrackImageResponseHandler(requestId, videoResponseHandler);
            };
            trackImageResponseHandler(requestId, videoResponseHandler);
            return;
          }
          button.setAttribute("data-loading", "true");
          button.dataset.loadingStartedAt = String(Date.now());
          button.textContent = "\u89C6\u9891\u751F\u6210\u4E2D...";
          startGenerating(link);
          const videoPromise = isRh ? import("../runninghubVideo.js").then((m) => m.generateRunningHubRefVideo) : import("../comfyuiVideo.js").then((m) => m.generateComfyUIRefVideo);
          videoPromise.then(async (generateFn) => {
            try {
              const result = await generateFn({
                prompt: link,
                change: currentTargetText
              });
              if (extension_settings[extensionName].cache != "0") {
                await setItemImg(link, result.mediaData, {
                  change: currentTargetText,
                  isVideo: true,
                  format: result.format || "video/mp4",
                  originalUrl: result.originalUrl || "",
                  genParams: result.genParams,
                  onTailSuccess: () => {
                    addLog(`[${isRh ? "RunningHubRefVideo" : "ComfyUIVideo"}] \u89C6\u9891\u5DF2\u6301\u4E45\u5316\u5165\u5E93: ${link}`);
                  },
                  onTailError: (err) => {
                    addLog(`[${isRh ? "RunningHubRefVideo" : "ComfyUIVideo"}] \u89C6\u9891\u540E\u53F0\u4FDD\u5B58\u5931\u8D25: ${err?.message || err}`);
                  }
                });
                addLog(`[${isRh ? "RunningHubRefVideo" : "ComfyUIVideo"}] \u89C6\u9891\u5DF2\u5B58\u5165\u6570\u636E\u5E93 for prompt: ${link}`);
              }
              stopGenerating(link);
              const docs2 = [document, ...Array.from(document.querySelectorAll("iframe")).map((f) => f.contentDocument).filter(Boolean)];
              docs2.forEach((doc) => {
                const spans = doc.querySelectorAll(`span[data-request-id="${requestId}"]`);
                spans.forEach((span) => {
                  const associatedButton = span.previousElementSibling;
                  if (associatedButton && associatedButton.matches(`button[data-request-id="${requestId}"]`)) {
                    createAndShowImage(span, result.mediaData, "Generated Video", associatedButton, currentTargetText, true, result.originalUrl || "", "", "video");
                  } else {
                    createAndShowImage(span, result.mediaData, "Generated Video", null, currentTargetText, true, result.originalUrl || "", "", "video");
                  }
                });
                const buttons = doc.querySelectorAll(`button[data-request-id="${requestId}"]`);
                buttons.forEach((btn) => {
                  btn.removeAttribute("data-loading");
                  if (extension_settings[extensionName].dbclike === "true") {
                    btn.style.setProperty("display", "none", "important");
                  } else {
                    btn.disabled = false;
                    btn.textContent = "\u751F\u6210\u89C6\u9891";
                  }
                });
              });
              eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
                id: requestId,
                success: true,
                imageData: result.mediaData,
                isVideo: true,
                format: result.format || "video/mp4",
                originalUrl: result.originalUrl || "",
                prompt: link,
                change: currentTargetText
              });
              if (!isPluginToastDisabled()) {
                toastr.success("\u53C2\u8003\u89C6\u9891\u751F\u6210\u5B8C\u6210\uFF01");
              }
            } catch (err) {
              stopGenerating(link);
              console.error(`[${isRh ? "RunningHubRefVideo" : "ComfyUIVideo"}]`, err);
              toastr.error("\u89C6\u9891\u751F\u6210\u5931\u8D25: " + err.message);
              const docs2 = [document, ...Array.from(document.querySelectorAll("iframe")).map((f) => f.contentDocument).filter(Boolean)];
              docs2.forEach((doc) => {
                const buttons = doc.querySelectorAll(`button[data-request-id="${requestId}"]`);
                buttons.forEach((btn) => {
                  btn.removeAttribute("data-loading");
                  btn.disabled = false;
                  btn.textContent = "\u751F\u6210\u89C6\u9891";
                });
              });
              eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
                id: requestId,
                success: false,
                error: err.message,
                prompt: link,
                change: currentTargetText
              });
            }
          }).catch((err) => {
            stopGenerating(link);
            console.error("\u5BFC\u5165\u89C6\u9891\u751F\u6210\u6A21\u5757\u5931\u8D25:", err);
            const docs2 = [document, ...Array.from(document.querySelectorAll("iframe")).map((f) => f.contentDocument).filter(Boolean)];
            docs2.forEach((doc) => {
              const buttons = doc.querySelectorAll(`button[data-request-id="${requestId}"]`);
              buttons.forEach((btn) => {
                btn.removeAttribute("data-loading");
                btn.disabled = false;
                btn.textContent = "\u751F\u6210\u89C6\u9891";
              });
            });
            toastr.error("\u52A0\u8F7D\u89C6\u9891\u751F\u6210\u6A21\u5757\u5931\u8D25: " + err.message);
            eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
              id: requestId,
              success: false,
              error: err.message,
              prompt: link,
              change: currentTargetText
            });
          });
          return;
        } else if (channel === "none") {
          toastr.warning("\u89C6\u9891\u6E20\u9053\u5DF2\u8BBE\u7F6E\u4E3A\u300C\u65E0\u300D\uFF0C\u8DF3\u8FC7\u89C6\u9891\u751F\u6210\u3002\u5982\u9700\u751F\u6210\u89C6\u9891\u8BF7\u5728\u4E3B\u8981\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u89C6\u9891\u6E20\u9053\u3002");
          button.removeAttribute("data-loading");
          button.textContent = "\u751F\u6210\u89C6\u9891";
          return;
        } else {
          toastr.warning(`\u672A\u77E5\u7684\u89C6\u9891\u6E20\u9053: ${channel}`);
          button.removeAttribute("data-loading");
          button.textContent = "\u751F\u6210\u89C6\u9891";
          return;
        }
      }
      const startGenerationProcess = () => {
        console.log("Triggering generation for button:", button);
        const alreadyGenerating = isGenerating(link);
        if (alreadyGenerating) {
          addLog(`\u56FE\u50CF\u751F\u6210\u8BF7\u6C42\u5DF2\u5728\u8FDB\u884C\u4E2D\uFF0C\u7B49\u5F85\u54CD\u5E94: ${link}`);
          button.setAttribute("data-loading", "true");
          button.textContent = isVideoMode ? "\u89C6\u9891\u751F\u6210\u4E2D..." : "\u52A0\u8F7D\u4E2D...";
        }
        const imageResponseHandler = (responseData) => {
          if (responseData.id !== requestId) return;
          console.log("Image response:", responseData);
          try {
            untrackImageResponseHandler(requestId, imageResponseHandler);
            addLog(`\u56FE\u50CF\u54CD\u5E94\u76D1\u542C\u5668\u5DF2\u9500\u6BC1 (ID: ${requestId})`);
            const { success, imageData, error, prompt: prompt2, change: change2, isVideo, originalUrl, video: video2, activeMode: activeMode2 } = responseData;
            if (prompt2) stopGenerating(prompt2);
            else stopGenerating(link);
            const docs2 = [document, ...Array.from(document.querySelectorAll("iframe")).map((f) => f.contentDocument).filter(Boolean)];
            if (!success) {
              addLog(`\u56FE\u50CF\u751F\u6210\u5931\u8D25 (ID: ${requestId}): ${error}`);
              toastr.error(`\u751F\u6210\u5931\u8D25: ${error || "\u672A\u77E5\u9519\u8BEF"}`);
            }
            let totalMatchedSpans = 0;
            docs2.forEach((doc) => {
              const spans = doc.querySelectorAll(`span[data-request-id="${requestId}"]`);
              if (success && spans.length > 0) {
                totalMatchedSpans += spans.length;
                addLog(`${isVideo ? "\u89C6\u9891" : "\u56FE\u50CF"}\u751F\u6210\u6210\u529F (ID: ${requestId}), targeting ${spans.length} element(s).`);
                spans.forEach((span) => {
                  const associatedButton = span.previousElementSibling;
                  const finalVideo = video2 || (associatedButton ? associatedButton.dataset.video : "");
                  const finalActiveMode = activeMode2 || (associatedButton ? associatedButton.dataset.activeMode : "");
                  if (associatedButton && associatedButton.matches(`button[data-request-id="${requestId}"]`)) {
                    createAndShowImage(span, imageData, "Generated Image", associatedButton, change2, isVideo, originalUrl || "", finalVideo, finalActiveMode);
                  } else {
                    createAndShowImage(span, imageData, "Generated Image", null, change2, isVideo, originalUrl || "", finalVideo, finalActiveMode);
                  }
                });
              }
            });
            if (success && totalMatchedSpans === 0) {
              setTimeout(() => {
                import("./chatProcessor.js").then(({ processMesTextElements: processMesTextElements2, processIframes: processIframes2 }) => {
                  processMesTextElements2();
                  processIframes2();
                }).catch(() => {
                });
              }, 80);
            }
          } catch (err) {
            console.error("[generation] imageResponseHandler \u5904\u7406\u5F02\u5E38:", err);
          } finally {
            stopGenerating(link);
            const docs2 = [document, ...Array.from(document.querySelectorAll("iframe")).map((f) => f.contentDocument).filter(Boolean)];
            docs2.forEach((doc) => {
              const buttons = doc.querySelectorAll(`button[data-request-id="${requestId}"]`);
              buttons.forEach((b) => {
                b.removeAttribute("data-loading");
                delete b.dataset.loadingStartedAt;
                if (responseData && responseData.success && extension_settings[extensionName].dbclike == "true") {
                  b.style.setProperty("display", "none", "important");
                } else {
                  b.disabled = false;
                  const bMode = b.dataset.activeMode || (responseData && responseData.isVideo ? "video" : "image");
                  b.textContent = bMode === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
                }
              });
            });
          }
        };
        trackImageResponseHandler(requestId, imageResponseHandler);
        addLog(`\u56FE\u50CF\u54CD\u5E94\u76D1\u542C\u5668\u5DF2\u521B\u5EFA (ID: ${requestId})`);
        if (!alreadyGenerating) {
          button.setAttribute("data-loading", "true");
          button.dataset.loadingStartedAt = String(Date.now());
          button.textContent = isVideoMode ? "\u89C6\u9891\u751F\u6210\u4E2D..." : "\u52A0\u8F7D\u4E2D...";
          startGenerating(link);
          const buttonChange = isVideoMode ? video || button.dataset.videoPrompt || (/asset_manifest\s*:/i.test(link) ? link : "") : change || link;
          let requestPrompt = link;
          let requestChange = buttonChange;
          let finalWidth = button.dataset.width || null;
          let finalHeight = button.dataset.height || null;
          let isSizeExplicitlySet = !!button.dataset.width;
          const sizeRegex = /,?\s*(\d{2,4})x(\d{2,4})(?=[;\s]|$)/i;
          if (requestChange) {
            const changeMatch = requestChange.match(sizeRegex);
            if (changeMatch) {
              if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
                finalWidth = changeMatch[1];
                finalHeight = changeMatch[2];
              }
              isSizeExplicitlySet = true;
            }
          }
          const linkMatch = requestPrompt.match(sizeRegex);
          if (linkMatch) {
            if (!isSizeExplicitlySet) {
              if (String(extension_settings[extensionName].aiAutonomousResolution) !== "false") {
                finalWidth = linkMatch[1];
                finalHeight = linkMatch[2];
              }
            }
          }
          const requestData = {
            id: requestId,
            prompt: requestPrompt,
            width: finalWidth,
            height: finalHeight,
            activeMode,
            isVideo: isVideoMode
          };
          if (requestChange) {
            requestData.change = requestChange;
            if (requestChange.includes("{\u4FEE\u56FE}")) {
              requestData.retouchPrompt = button.dataset.retouchPrompt || "";
              requestData.retouchImage = button.dataset.retouchImage || "";
              button.dataset.change = button.dataset.change?.replaceAll("{\u4FEE\u56FE}", "");
            }
            if (requestChange.includes("{\u89C6\u9891}")) {
              requestData.videoPrompt = button.dataset.videoPrompt || "";
              requestData.videoImage = button.dataset.videoImage || "";
              button.dataset.change = button.dataset.change?.replaceAll("{\u89C6\u9891}", "");
            }
          }
          eventSource.emit(EventType.GENERATE_IMAGE_REQUEST, requestData);
          addLog(`\u53D1\u51FA${isVideoMode ? "\u89C6\u9891" : "\u56FE\u50CF"}\u751F\u6210\u8BF7\u6C42 (ID: ${requestData.id})`);
        }
      };
      const docs = [document, ...Array.from(document.querySelectorAll("iframe")).map((f) => f.contentDocument).filter(Boolean)];
      let imageExistsInDom = false;
      for (const doc of docs) {
        const span = doc.querySelector(`span[data-request-id="${requestId}"]`);
        if (span && span.querySelector("img, video, .st-chatu8-video-fallback")) {
          console.log("Media already exists in DOM. Triggering regeneration.");
          imageExistsInDom = true;
          break;
        }
      }
      if (imageExistsInDom) {
        startGenerationProcess();
      } else {
        getItemImg(link).then(([imageUrl, dbChange, , isVideo, dbOriginalUrl, dbVideo, dbActiveMode]) => {
          if (imageUrl) {
            addLog(`Image for "${link}" already exists in DB. Skipping generation.`);
            for (const doc of docs) {
              const spans = doc.querySelectorAll(`span[data-request-id="${requestId}"]`);
              for (const span of spans) {
                const associatedButton = span.previousElementSibling;
                if (associatedButton && associatedButton.matches(`button[data-request-id="${requestId}"]`)) {
                  createAndShowImage(span, imageUrl, "Generated Image", associatedButton, dbChange, isVideo, dbOriginalUrl || "", dbVideo, dbActiveMode);
                  associatedButton.removeAttribute("data-loading");
                  if (extension_settings[extensionName].dbclike === "true") {
                    associatedButton.style.setProperty("display", "none", "important");
                  } else {
                    associatedButton.disabled = false;
                    associatedButton.textContent = dbActiveMode === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
                  }
                }
              }
            }
            eventSource.emit(EventType.GENERATE_IMAGE_RESPONSE, {
              id: requestId,
              success: true,
              imageData: imageUrl,
              prompt: link,
              change: dbChange,
              isVideo,
              fromCache: true
              // 标记来自缓存
            });
          } else {
            startGenerationProcess();
          }
        });
      }
    };


async function _dataUrlToBlob(dataUrl) {
  return safeDataUrlToBlob(dataUrl);
}

function setShowImagePreview(fn) {
  _showImagePreview = fn;
}

function _chatu8RespDedupEnabled() {
  if (_chatu8RespDedupEnabledCache === null) {
    try {
      const cfg = typeof window !== "undefined" ? window.__chatu8perf : null;
      _chatu8RespDedupEnabledCache = !cfg || cfg.listenerDedup !== false;
    } catch (e) {
      _chatu8RespDedupEnabledCache = true;
    }
  }
  return _chatu8RespDedupEnabledCache;
}

function trackImageResponseHandler(requestId, handler) {
  if (!requestId || !_chatu8RespDedupEnabled()) {
    eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, handler);
    return;
  }
  const key = String(requestId);
  const previous = _chatu8PendingImageRespHandlers.get(key);
  if (previous && previous !== handler) {
    try {
      eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, previous);
    } catch (_) {
    }
  }
  _chatu8PendingImageRespHandlers.set(key, handler);
  if (!_chatu8RespDedupBound) {
    _chatu8RespDedupBound = true;
    try {
      if (typeof window !== "undefined") {
        window.addEventListener("pagehide", () => {
          _chatu8PendingImageRespHandlers.forEach((h) => {
            try {
              eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, h);
            } catch (_) {
            }
          });
          _chatu8PendingImageRespHandlers.clear();
        }, { once: true });
      }
    } catch (_) {
    }
  }
  eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, handler);
}

function untrackImageResponseHandler(requestId, handler) {
  if (requestId && _chatu8RespDedupEnabled()) {
    const key = String(requestId);
    if (_chatu8PendingImageRespHandlers.get(key) === handler) {
      _chatu8PendingImageRespHandlers.delete(key);
    }
  }
  try {
    eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, handler);
  } catch (_) {
  }
}

function createAndShowImage(container, imageUrl, alt, button, change, isVideo = false, originalUrl = "", video = "", activeMode = "") {
  const doc = container.ownerDocument;
  if (!doc) return;
  const div = doc.createElement("div");
  div.className = "st-chatu8-image-container";
  let media;
  if (isVideo) {
    media = doc.createElement("video");
    media.controls = false;
    media.loop = true;
    media.muted = false;
    media.defaultMuted = false;
    media.removeAttribute("muted");
    media.playsInline = true;
    media.setAttribute("playsinline", "");
    media.setAttribute("webkit-playsinline", "true");
    media.setAttribute("x5-playsinline", "true");
    media.setAttribute("x5-video-player-type", "h5-page");
    media.setAttribute("controlslist", "nodownload");
    media.dataset.isVideo = "true";
    media.autoplay = false;
    media.preload = "metadata";
    let isSourceLoaded = false;
    const loadVideoMediaSource = () => {
      if (isSourceLoaded) return;
      isSourceLoaded = true;
      const applyBlob = (blob) => {
        const blobUrl = (doc.defaultView?.URL || window.URL || URL).createObjectURL(blob);
        if (media.dataset.blobUrl) {
          try {
            (doc.defaultView?.URL || window.URL || URL).revokeObjectURL(media.dataset.blobUrl);
          } catch (_) {
          }
        }
        media.dataset.blobUrl = blobUrl;
        media.src = blobUrl;
      };
      if (imageUrl.startsWith("data:")) {
        _dataUrlToBlob(imageUrl).then((rawBlob) => fixMp4Faststart(rawBlob)).then((blob) => applyBlob(blob)).catch((e) => {
          console.warn("[video] DataURL \u8F6C Blob \u5931\u8D25\uFF0C\u56DE\u9000\u76F4\u63A5\u8D4B\u503C:", e);
          media.src = originalUrl || imageUrl;
        });
      } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/") || imageUrl.startsWith(".")) {
        media.src = imageUrl;
        const onDirectErr = () => {
          media.removeEventListener("error", onDirectErr);
          if (media.src !== imageUrl && !media.src.endsWith(imageUrl)) return;
          console.log("[video] \u76F4\u94FE\u539F\u751F\u6D41\u64AD\u653E\u5931\u8D25\uFF0C\u5C1D\u8BD5\u964D\u7EA7\u62C9\u53D6 Blob \u4FEE\u590D:", imageUrl);
          fetch(imageUrl).then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
          }).then((rawBlob) => fixMp4Faststart(rawBlob)).then((blob) => applyBlob(blob)).catch((e) => {
            console.warn("[video] \u964D\u7EA7\u62C9\u53D6\u5931\u8D25\uFF0C\u56DE\u9000\u539F\u59CB URL:", e);
            if (originalUrl) media.src = originalUrl;
          });
        };
        media.addEventListener("error", onDirectErr, { once: true });
      } else {
        media.src = imageUrl;
      }
    };
    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadVideoMediaSource();
          } else {
            if (!media.paused && typeof media.pause === "function") {
              media.pause();
            }
          }
        });
      }, {
        root: null,
        rootMargin: "400px 0px 400px 0px",
        threshold: 0
      });
      observer.observe(div);
      setTimeout(() => {
        if (!isSourceLoaded) {
          loadVideoMediaSource();
        }
      }, 500);
    } else {
      loadVideoMediaSource();
    }
    media.onerror = function() {
      if (!this.src || this.src === "about:blank" || this.src === location.href) return;
      const errCode = this.error?.code;
      console.error(`[iframe] Video onerror: code=${errCode}, msg=${this.error?.message}`);
      if (originalUrl && this.src !== originalUrl) {
        console.log("[iframe] \u5C1D\u8BD5\u4F7F\u7528\u539F\u59CB URL \u5907\u7528\u64AD\u653E:", originalUrl);
        this.src = originalUrl;
        try {
          this.load();
        } catch (_) {
        }
        return;
      }
      if (media.parentNode && media.parentNode.querySelector(".st-chatu8-video-notice")) {
        return;
      }
      const notice = doc.createElement("div");
      notice.className = "st-chatu8-video-notice";
      notice.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 10px;
                background: rgba(0,0,0,0.5);
                border-radius: 0 0 8px 8px;
                color: #fff;
                font-size: 13px;
                text-align: center;
            `;
      const text = doc.createElement("div");
      text.textContent = "\u26A0\uFE0F \u89C6\u9891\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u73AF\u5883\u4E2D\u65E0\u6CD5\u64AD\u653E\uFF0C\u8BF7\u4E0B\u8F7D\u540E\u7528\u89C6\u9891\u64AD\u653E\u5668\u89C2\u770B";
      text.style.opacity = "0.9";
      const downloadBtn = doc.createElement("a");
      const blobSrc = media.dataset.blobUrl || imageUrl;
      downloadBtn.href = blobSrc;
      downloadBtn.download = "video.mp4";
      downloadBtn.textContent = "\u{1F4E5} \u4E0B\u8F7D\u89C6\u9891";
      downloadBtn.style.cssText = `
                background: rgba(255,255,255,0.25);
                padding: 7px 18px;
                border-radius: 4px;
                color: #fff;
                text-decoration: none;
                cursor: pointer;
                font-size: 14px;
            `;
      downloadBtn.onclick = (e) => e.stopPropagation();
      notice.appendChild(text);
      notice.appendChild(downloadBtn);
      if (media.parentNode) {
        media.parentNode.appendChild(notice);
      }
    };
  } else {
    media = doc.createElement("img");
    media.alt = alt;
    media.decoding = "async";
    media.dataset.fullSrc = imageUrl;
    media.src = imageUrl;
    let naturalWidth = 0;
    let naturalHeight = 0;
    media.onload = () => {
      naturalWidth = media.naturalWidth || 0;
      naturalHeight = media.naturalHeight || 0;
      if (naturalWidth && naturalHeight) {
        div.dataset.aspectRatio = String(naturalHeight / naturalWidth);
        if (div.offsetHeight > 40) {
          div.style.minHeight = `${div.offsetHeight}px`;
        }
      }
    };
    div._mountChatImage = () => {
      if (media.src !== imageUrl) {
        media.src = imageUrl;
      }
    };
  }
  if (button) {
    if (change) {
      button.dataset.change = change;
    }
    if (video) {
      button.dataset.video = video;
    }
    if (activeMode) {
      button.dataset.activeMode = activeMode;
      if (activeMode === "video") {
        button.textContent = "\u751F\u6210\u89C6\u9891";
      }
    }
  }
  function attachCustomVideoPlayer(doc2, div2, media2, button2) {
    media2.controls = false;
    media2.playsInline = true;
    media2.setAttribute("playsinline", "");
    media2.setAttribute("webkit-playsinline", "true");
    media2.setAttribute("x5-playsinline", "true");
    media2.setAttribute("x5-video-player-type", "h5");
    div2.style.position = "relative";
    div2.style.overflow = "hidden";
    const bigPlayBtn = doc2.createElement("div");
    bigPlayBtn.className = "st-chatu8-big-play-btn";
    bigPlayBtn.innerHTML = "\u25B6";
    bigPlayBtn.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 52px;
        height: 52px;
        background: rgba(0, 0, 0, 0.65);
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        padding-left: 3px;
        cursor: pointer;
        z-index: 5;
        backdrop-filter: blur(8px);
        border: 1.5px solid rgba(255, 255, 255, 0.45);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        transition: opacity 0.25s ease, transform 0.25s ease;
        user-select: none;
    `;
    const controlsBar = doc2.createElement("div");
    controlsBar.className = "st-chatu8-mini-player-controls";
    controlsBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 8px 12px;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.88));
        display: flex;
        flex-direction: column;
        gap: 6px;
        z-index: 6;
        transition: opacity 0.3s ease;
        opacity: 1;
        user-select: none;
    `;
    controlsBar.onclick = (e) => e.stopPropagation();
    const progressContainer = doc2.createElement("div");
    progressContainer.style.cssText = `
        width: 100%;
        height: 14px;
        display: flex;
        align-items: center;
        cursor: pointer;
        position: relative;
    `;
    const progressBarBg = doc2.createElement("div");
    progressBarBg.style.cssText = `
        width: 100%;
        height: 5px;
        background: rgba(255, 255, 255, 0.35);
        border-radius: 3px;
        position: relative;
        overflow: hidden;
    `;
    const progressFill = doc2.createElement("div");
    progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 3px;
        transition: width 0.1s linear;
    `;
    progressBarBg.appendChild(progressFill);
    progressContainer.appendChild(progressBarBg);
    const btnRow = doc2.createElement("div");
    btnRow.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #fff;
        font-size: 13px;
    `;
    const leftControls = doc2.createElement("div");
    leftControls.style.cssText = "display: flex; align-items: center; gap: 8px;";
    const playPauseBtn = doc2.createElement("div");
    playPauseBtn.innerHTML = "\u25B6";
    playPauseBtn.style.cssText = `
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        border-radius: 4px;
    `;
    const timeDisplay = doc2.createElement("span");
    timeDisplay.style.cssText = "font-size: 12px; opacity: 0.9; font-family: monospace; letter-spacing: 0.5px;";
    timeDisplay.textContent = "0:00 / 0:00";
    leftControls.appendChild(playPauseBtn);
    leftControls.appendChild(timeDisplay);
    const rightControls = doc2.createElement("div");
    rightControls.style.cssText = "display: flex; align-items: center; gap: 8px;";
    const muteBtn = doc2.createElement("div");
    muteBtn.innerHTML = media2.muted ? "\u{1F507}" : "\u{1F50A}";
    muteBtn.title = media2.muted ? "\u5F00\u542F\u58F0\u97F3" : "\u9759\u97F3";
    muteBtn.style.cssText = `
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        border-radius: 4px;
    `;
    const fullscreenBtn = doc2.createElement("div");
    fullscreenBtn.innerHTML = "\u26F6";
    fullscreenBtn.title = "\u5168\u5C4F\u64AD\u653E";
    fullscreenBtn.style.cssText = `
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        border-radius: 4px;
        user-select: none;
    `;
    function isCurrentFullscreen() {
      const topDoc = window.top ? window.top.document : doc2;
      return !!(doc2.fullscreenElement || doc2.webkitFullscreenElement || topDoc && (topDoc.fullscreenElement || topDoc.webkitFullscreenElement));
    }
    function toggleVideoFullscreen(e) {
      if (e) e.stopPropagation();
      const topDoc = window.top ? window.top.document : doc2;
      const targetContainer = div2;
      if (isCurrentFullscreen()) {
        const efs = doc2.exitFullscreen || doc2.webkitExitFullscreen || topDoc && (topDoc.exitFullscreen || topDoc.webkitExitFullscreen);
        if (efs) {
          try {
            const activeDoc2 = doc2.fullscreenElement ? doc2 : topDoc.fullscreenElement ? topDoc : doc2;
            const p = efs.call(activeDoc2);
            if (p && p.catch) p.catch(() => {
            });
          } catch (_) {
          }
        }
      } else {
        const rfs = targetContainer.requestFullscreen || targetContainer.webkitRequestFullscreen || targetContainer.mozRequestFullScreen || targetContainer.msRequestFullscreen;
        if (rfs) {
          try {
            const p = rfs.call(targetContainer);
            if (p && p.catch) {
              p.catch(() => {
                if (media2.webkitEnterFullscreen) media2.webkitEnterFullscreen();
              });
            }
          } catch (_) {
            if (media2.webkitEnterFullscreen) media2.webkitEnterFullscreen();
          }
        } else if (media2.webkitEnterFullscreen) {
          media2.webkitEnterFullscreen();
        }
      }
    }
    fullscreenBtn.onclick = toggleVideoFullscreen;
    const rotateBtn = doc2.createElement("div");
    rotateBtn.innerHTML = '<i class="fa-solid fa-rotate"></i>';
    rotateBtn.title = "\u6A2A\u5C4F\u65CB\u8F6C90\u5EA6";
    rotateBtn.style.cssText = `
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        border-radius: 4px;
        user-select: none;
        transition: color 0.2s ease;
    `;
    let isLandscape = false;
    function toggleLandscape(e) {
      if (e) e.stopPropagation();
      isLandscape = !isLandscape;
      if (isLandscape) {
        rotateBtn.style.color = "#3b82f6";
        rotateBtn.title = "\u6062\u590D\u7AD6\u5C4F";
        div2.classList.add("st-chatu8-landscape-mode");
        if (!isCurrentFullscreen()) {
          toggleVideoFullscreen();
        }
      } else {
        rotateBtn.style.color = "#fff";
        rotateBtn.title = "\u6A2A\u5C4F\u65CB\u8F6C90\u5EA6";
        div2.classList.remove("st-chatu8-landscape-mode");
      }
    }
    rotateBtn.onclick = toggleLandscape;
    if (!doc2.getElementById("st-chatu8-fullscreen-style")) {
      const style = doc2.createElement("style");
      style.id = "st-chatu8-fullscreen-style";
      style.textContent = `
            .st-chatu8-image-container:fullscreen,
            .st-chatu8-image-container:-webkit-full-screen,
            .st-chatu8-image-container.st-chatu8-fullscreen-active {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100vw !important;
                height: 100vh !important;
                height: 100dvh !important;
                max-width: none !important;
                max-height: none !important;
                background-color: #000 !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
            }
            .st-chatu8-image-container:fullscreen video,
            .st-chatu8-image-container:-webkit-full-screen video,
            .st-chatu8-image-container.st-chatu8-fullscreen-active video {
                width: 100% !important;
                height: 100% !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                max-height: 100dvh !important;
                object-fit: contain !important;
                margin: auto !important;
                transition: transform 0.25s ease;
            }
            .st-chatu8-image-container.st-chatu8-landscape-mode video,
            .st-chatu8-image-container:fullscreen.st-chatu8-landscape-mode video,
            .st-chatu8-image-container:-webkit-full-screen.st-chatu8-landscape-mode video,
            .st-chatu8-fullscreen-active.st-chatu8-landscape-mode video {
                transform: rotate(90deg) !important;
                transform-origin: center center !important;
                width: 100vh !important;
                width: 100dvh !important;
                height: 100vw !important;
                min-width: 100dvh !important;
                min-height: 100vw !important;
                max-width: none !important;
                max-height: none !important;
                flex-shrink: 0 !important;
                margin: 0 !important;
                object-fit: contain !important;
            }
            .st-chatu8-image-container:fullscreen .st-chatu8-mini-player-controls,
            .st-chatu8-image-container:-webkit-full-screen .st-chatu8-mini-player-controls,
            .st-chatu8-image-container.st-chatu8-fullscreen-active .st-chatu8-mini-player-controls {
                position: absolute !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                padding: 12px 24px !important;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.92)) !important;
                z-index: 10 !important;
            }
            /* \u5168\u5C4F\u6216\u6A2A\u5C4F\u6A21\u5F0F\u4E0B\u6682\u505C\u65F6\u5F7B\u5E95\u9690\u85CF\u4E2D\u592E\u5927\u64AD\u653E\u56FE\u6807\uFF0C\u907F\u514D\u906E\u6321\u753B\u9762\u7EC6\u8282 */
            .st-chatu8-image-container:fullscreen .st-chatu8-big-play-btn,
            .st-chatu8-image-container:-webkit-full-screen .st-chatu8-big-play-btn,
            .st-chatu8-fullscreen-active .st-chatu8-big-play-btn,
            .st-chatu8-landscape-mode .st-chatu8-big-play-btn {
                display: none !important;
            }
        `;
      doc2.head.appendChild(style);
    }
    const handleFsChange = () => {
      const isFs = isCurrentFullscreen();
      const topDoc = window.top ? window.top.document : doc2;
      const currentFsEl = doc2.fullscreenElement || doc2.webkitFullscreenElement || topDoc && (topDoc.fullscreenElement || topDoc.webkitFullscreenElement);
      if (isFs && (currentFsEl === div2 || currentFsEl === media2)) {
        fullscreenBtn.innerHTML = "\u{1F5D7}";
        fullscreenBtn.title = "\u9000\u51FA\u5168\u5C4F";
        div2.classList.add("st-chatu8-fullscreen-active");
        bigPlayBtn.style.opacity = "0";
        bigPlayBtn.style.pointerEvents = "none";
      } else {
        fullscreenBtn.innerHTML = "\u26F6";
        fullscreenBtn.title = "\u5168\u5C4F\u64AD\u653E";
        div2.classList.remove("st-chatu8-fullscreen-active");
        if (media2.paused && !isLandscape) {
          bigPlayBtn.style.opacity = "1";
          bigPlayBtn.style.pointerEvents = "auto";
        }
        if (isLandscape) {
          isLandscape = false;
          rotateBtn.style.color = "#fff";
          rotateBtn.title = "\u6A2A\u5C4F\u65CB\u8F6C90\u5EA6";
          div2.classList.remove("st-chatu8-landscape-mode");
        }
      }
    };
    doc2.addEventListener("fullscreenchange", handleFsChange);
    doc2.addEventListener("webkitfullscreenchange", handleFsChange);
    if (window.top && window.top.document) {
      window.top.document.addEventListener("fullscreenchange", handleFsChange);
      window.top.document.addEventListener("webkitfullscreenchange", handleFsChange);
    }
    rightControls.appendChild(muteBtn);
    rightControls.appendChild(rotateBtn);
    rightControls.appendChild(fullscreenBtn);
    btnRow.appendChild(leftControls);
    btnRow.appendChild(rightControls);
    controlsBar.appendChild(progressContainer);
    controlsBar.appendChild(btnRow);
    div2.appendChild(bigPlayBtn);
    div2.appendChild(controlsBar);
    function formatTime(sec) {
      if (!sec || isNaN(sec)) return "0:00";
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s < 10 ? "0" : ""}${s}`;
    }
    function togglePlay(e) {
      if (e) e.stopPropagation();
      if (media2.paused || media2.ended) {
        media2.play().catch(() => {
        });
      } else {
        media2.pause();
      }
    }
    bigPlayBtn.onclick = togglePlay;
    playPauseBtn.onclick = togglePlay;
    muteBtn.onclick = (e) => {
      e.stopPropagation();
      media2.muted = !media2.muted;
      if (!media2.muted) {
        media2.defaultMuted = false;
        media2.removeAttribute("muted");
      } else {
        media2.setAttribute("muted", "");
      }
      muteBtn.innerHTML = media2.muted ? "\u{1F507}" : "\u{1F50A}";
      muteBtn.title = media2.muted ? "\u5F00\u542F\u58F0\u97F3" : "\u9759\u97F3";
    };
    progressContainer.onclick = (e) => {
      e.stopPropagation();
      const rect = progressBarBg.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (media2.duration) {
        media2.currentTime = Math.max(0, Math.min(media2.duration, pos * media2.duration));
      }
    };
    media2.ontimeupdate = () => {
      if (!media2.duration) return;
      const pct = media2.currentTime / media2.duration * 100;
      progressFill.style.width = `${pct}%`;
      timeDisplay.textContent = `${formatTime(media2.currentTime)} / ${formatTime(media2.duration)}`;
    };
    media2.onloadedmetadata = () => {
      timeDisplay.textContent = `0:00 / ${formatTime(media2.duration)}`;
    };
    let isControlsVisible = true;
    let hideTimer2 = null;
    function showControls() {
      controlsBar.style.opacity = "1";
      isControlsVisible = true;
      resetHideTimer();
    }
    function hideControls() {
      if (!media2.paused) {
        controlsBar.style.opacity = "0";
        isControlsVisible = false;
      }
    }
    function resetHideTimer() {
      controlsBar.style.opacity = "1";
      isControlsVisible = true;
      if (hideTimer2) clearTimeout(hideTimer2);
      if (!media2.paused) {
        hideTimer2 = setTimeout(() => {
          hideControls();
        }, 2500);
      }
    }
    media2.onplay = () => {
      bigPlayBtn.style.opacity = "0";
      bigPlayBtn.style.pointerEvents = "none";
      playPauseBtn.innerHTML = "\u23F8";
      resetHideTimer();
    };
    media2.onpause = () => {
      if (!isCurrentFullscreen() && !isLandscape) {
        bigPlayBtn.style.opacity = "1";
        bigPlayBtn.style.pointerEvents = "auto";
      } else {
        bigPlayBtn.style.opacity = "0";
        bigPlayBtn.style.pointerEvents = "none";
      }
      playPauseBtn.innerHTML = "\u25B6";
      showControls();
      if (hideTimer2) clearTimeout(hideTimer2);
    };
    media2.onended = () => {
      if (media2.loop) {
        media2.currentTime = 0;
        media2.play().catch(() => {
        });
      }
    };
    div2.addEventListener("mouseenter", resetHideTimer);
    div2.addEventListener("mousemove", resetHideTimer);
    div2.addEventListener("touchstart", resetHideTimer, { passive: true });
    const topOverlay = doc2.createElement("div");
    topOverlay.className = "st-chatu8-video-top-overlay";
    topOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 60%;
        z-index: 4;
        cursor: pointer;
    `;
    const bottomOverlay = doc2.createElement("div");
    bottomOverlay.className = "st-chatu8-video-bottom-overlay";
    bottomOverlay.style.cssText = `
        position: absolute;
        top: 60%;
        left: 0;
        width: 100%;
        height: 40%;
        z-index: 4;
        cursor: pointer;
    `;
    bottomOverlay.onclick = (e) => {
      if (e) e.stopPropagation();
      if (!isControlsVisible) {
        showControls();
        return;
      }
      togglePlay(e);
    };
    bottomOverlay.ondblclick = (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      toggleVideoFullscreen(e);
    };
    bottomOverlay.oncontextmenu = (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    controlsBar.ondblclick = (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    controlsBar.oncontextmenu = (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    bigPlayBtn.ondblclick = (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    div2.appendChild(topOverlay);
    div2.appendChild(bottomOverlay);
    return {
      topOverlay,
      getControlsVisible: () => isControlsVisible,
      showControls,
      isCurrentFullscreen,
      isLandscapeActive: () => isLandscape,
      togglePlay,
      toggleVideoFullscreen
    };
  }
  let clickTimer = null;
  let pressTimer = null;
  let isLongPress2 = false;
  const doubleClickThreshold = 300;
  const longPressThreshold = 1200;
  div.appendChild(media);
  let eventTarget = media;
  let playerHelper = null;
  if (isVideo) {
    playerHelper = attachCustomVideoPlayer(doc, div, media, button);
    eventTarget = playerHelper.topOverlay;
  }
  const handlePressStart = (e) => {
    if (e.type === "mousedown" && e.button !== 0) return;
    if (isVideo && playerHelper) {
      if (!playerHelper.getControlsVisible() || playerHelper.isCurrentFullscreen() || playerHelper.isLandscapeActive()) {
        return;
      }
    }
    isLongPress2 = false;
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    pressTimer = setTimeout(() => {
      pressTimer = null;
      isLongPress2 = true;
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      if (button && extension_settings[extensionName].longPressToEdit == "true") {
        showEditDialog(media, button);
      }
    }, longPressThreshold);
  };
  const handlePressEnd = (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };
  const handleDblClick = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    isLongPress2 = false;
    if (isVideo) {
      if (extension_settings[extensionName].dbclike === "true" && button) {
        addSmoothShakeEffect(media);
        triggerGeneration(button);
      } else if (playerHelper && typeof playerHelper.toggleVideoFullscreen === "function") {
        playerHelper.toggleVideoFullscreen(e);
      }
    } else {
      if (extension_settings[extensionName].dbclike === "true" && button) {
        addSmoothShakeEffect(media);
        triggerGeneration(button);
      }
    }
  };
  const handleClick = (e) => {
    if (e) e.stopPropagation();
    if (isVideo && playerHelper) {
      if (!playerHelper.getControlsVisible()) {
        playerHelper.showControls();
        return;
      }
      if (playerHelper.isCurrentFullscreen() || playerHelper.isLandscapeActive()) {
        playerHelper.togglePlay();
        return;
      }
    }
    if (isLongPress2) return;
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      handleDblClick(e);
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        if (button && extension_settings[extensionName].clickToPreview === "true") {
          if (_showImagePreview) {
            _showImagePreview(media, button);
          }
        }
      }, doubleClickThreshold);
    }
  };
  eventTarget.addEventListener("click", handleClick);
  eventTarget.addEventListener("dblclick", handleDblClick);
  eventTarget.addEventListener("mousedown", handlePressStart);
  eventTarget.addEventListener("mouseup", handlePressEnd);
  eventTarget.addEventListener("mouseleave", handlePressEnd);
  eventTarget.addEventListener("touchstart", handlePressStart, { passive: true });
  eventTarget.addEventListener("touchend", handlePressEnd);
  eventTarget.addEventListener("touchcancel", handlePressEnd);
  eventTarget.addEventListener("contextmenu", (e) => {
    e.stopPropagation();
    if (extension_settings[extensionName].longPressToEdit == "true") {
      e.preventDefault();
    }
  });
  div.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
  div.addEventListener("contextmenu", (e) => {
    e.stopPropagation();
  });
  if (String(extension_settings[extensionName]?.collapseImage) === "true") {
    const wrapper = doc.createElement("div");
    wrapper.className = "st-chatu8-collapse-wrapper";
    wrapper.dataset.mediaType = isVideo ? "video" : "image";
    wrapper.dataset.collapsed = "true";
    const header = doc.createElement("div");
    header.className = "st-chatu8-collapse-header";
    const icon = doc.createElement("span");
    icon.className = "st-chatu8-collapse-icon";
    icon.textContent = "\u25BC";
    const title = doc.createElement("span");
    title.className = "st-chatu8-collapse-title";
    title.textContent = isVideo ? "\u{1F4F9} \u70B9\u51FB\u5C55\u5F00\u89C6\u9891" : "\u{1F4F7} \u70B9\u51FB\u5C55\u5F00\u56FE\u7247";
    const badge = doc.createElement("span");
    badge.className = "st-chatu8-collapse-badge";
    badge.textContent = "\u5DF2\u6298\u53E0";
    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(badge);
    const content = doc.createElement("div");
    content.className = "st-chatu8-collapse-content";
    content.appendChild(div);
    header.addEventListener("click", (e) => {
      e.stopPropagation();
      const isCollapsed = wrapper.dataset.collapsed === "true";
      if (isCollapsed) {
        wrapper.dataset.collapsed = "false";
        badge.textContent = "\u5DF2\u5C55\u5F00";
        title.textContent = isVideo ? "\u{1F4F9} \u70B9\u51FB\u6536\u8D77\u89C6\u9891" : "\u{1F4F7} \u70B9\u51FB\u6536\u8D77\u56FE\u7247";
        if (!isVideo && typeof div._mountChatImage === "function") {
          div._mountChatImage();
        }
      } else {
        wrapper.dataset.collapsed = "true";
        badge.textContent = "\u5DF2\u6298\u53E0";
        title.textContent = isVideo ? "\u{1F4F9} \u70B9\u51FB\u5C55\u5F00\u89C6\u9891" : "\u{1F4F7} \u70B9\u51FB\u5C55\u5F00\u56FE\u7247";
        if (isVideo) {
          try {
            if (media && typeof media.pause === "function") {
              media.pause();
            } else {
              const videoEl2 = wrapper.querySelector("video");
              if (videoEl2 && typeof videoEl2.pause === "function") {
                videoEl2.pause();
              }
            }
          } catch (err) {
            console.warn("[st-chatu8] \u6682\u505C\u89C6\u9891\u5931\u8D25:", err);
          }
        }
      }
    });
    wrapper.appendChild(header);
    wrapper.appendChild(content);
    container.replaceChildren(wrapper);
  } else {
    container.replaceChildren(div);
  }
}

export { createAndShowImage, setShowImagePreview, triggerGeneration };
