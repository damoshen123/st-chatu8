// 还原自打包产物 — 原始模块: utils/settings/fabVideoPlayerWebGL.js
async function loadVideoAsBlobUrl(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const blob = await res.blob();
    if (blob.type !== "video/mp4") {
      return URL.createObjectURL(new Blob([blob], { type: "video/mp4" }));
    }
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn(`[st-chatu8] \u65E0\u6CD5\u52A0\u8F7D ${src}\uFF0C\u5C1D\u8BD5\u56DE\u9000...`, err);
    let fallbackSrc = src;
    if (src.includes("idle.chatu8")) fallbackSrc = src.replace("idle.chatu8", "\u9759\u606F\u753B\u9762.mp4");
    else if (src.includes("dragging.chatu8")) fallbackSrc = src.replace("dragging.chatu8", "\u62D6\u52A8.mp4");
    else if (src.includes("headpat.chatu8")) fallbackSrc = src.replace("headpat.chatu8", "\u6478\u5934.mp4");
    else if (src.includes("thinking.chatu8")) fallbackSrc = src.replace("thinking.chatu8", "\u601D\u8003.mp4");
    else if (src.includes(".chatu8")) fallbackSrc = src.replace(".chatu8", ".mp4");
    if (fallbackSrc !== src) {
      try {
        const res2 = await fetch(fallbackSrc);
        if (!res2.ok) throw new Error(`HTTP error! status: ${res2.status}`);
        const blob2 = await res2.blob();
        return URL.createObjectURL(new Blob([blob2], { type: "video/mp4" }));
      } catch (err2) {
        console.error(`[st-chatu8] \u56DE\u9000\u52A0\u8F7D\u4E5F\u5931\u8D25: ${fallbackSrc}`, err2);
        throw err2;
      }
    }
    throw err;
  }
}

function createHiddenVideo(src, id) {
  const existingVideo = document.getElementById(id);
  if (existingVideo) {
    existingVideo.pause();
    if (existingVideo.src && existingVideo.src.startsWith("blob:")) {
      URL.revokeObjectURL(existingVideo.src);
    }
    existingVideo.src = "";
    existingVideo.removeAttribute("src");
    existingVideo.parentNode?.removeChild(existingVideo);
    console.log(`[st-chatu8] Cleaned up stale video element: ${id}`);
  }
  const video = document.createElement("video");
  video.id = id;
  video.style.display = "none";
  video.loop = false;
  video.muted = true;
  video.autoplay = false;
  video.playsInline = true;
  video.preload = "auto";
  video.dataset.originalSrc = src;
  const pathParts = src.split("/");
  const encodedSrc = pathParts.map((part, index) => {
    if (index === pathParts.length - 1) return encodeURIComponent(part);
    return part;
  }).join("/");
  video._loadPromise = loadVideoAsBlobUrl(encodedSrc);
  video._encodedSrc = encodedSrc;
  document.body.appendChild(video);
  return video;
}

function startVideoLoad(video) {
  if (!video._loadPromise) {
    console.error(`[st-chatu8] Video ${video.id} has no load promise`);
    return;
  }
  video._loadPromise.then((blobUrl) => {
    video.src = blobUrl;
    video.load();
  }).catch((err) => {
    console.error(`[st-chatu8] Failed to load video as Blob: ${video.dataset.originalSrc}`, err);
    video.dispatchEvent(new Event("error"));
  });
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function initWebGL(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true
    // ✅ 保留帧缓冲内容，确保 readPixels 在任意时刻可读
  });
  if (!gl) {
    console.error("WebGL not supported");
    return null;
  }
  const vsSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `;
  const fsSource = `
        precision mediump float;
        uniform sampler2D u_frame;
        varying vec2 v_texCoord;
        
        void main() {
            // \u4E0A\u534A\u90E8\u5206\uFF080.0 - 0.5\uFF09\u4E3A\u989C\u8272
            vec2 colorCoord = vec2(v_texCoord.x, v_texCoord.y * 0.5);
            // \u4E0B\u534A\u90E8\u5206\uFF080.5 - 1.0\uFF09\u4E3A alpha
            vec2 alphaCoord = vec2(v_texCoord.x, 0.5 + v_texCoord.y * 0.5);
            
            vec4 color = texture2D(u_frame, colorCoord);
            float alpha = texture2D(u_frame, alphaCoord).r;
            
            gl_FragColor = vec4(color.rgb, alpha);
        }
    `;
  const program = createProgram(gl, vsSource, fsSource);
  if (!program) return null;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    // x, y, u, v
    -1,
    -1,
    0,
    1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    0,
    0,
    1,
    1,
    1,
    0
  ]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);
  const aTexCoord = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(aTexCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  return { gl, program, texture };
}

function createVideoPlayer(container, options) {
  const { idleVideoSrc, draggingVideoSrc, onError } = options;
  const idleVideo = createHiddenVideo(idleVideoSrc, "st-chatu8-fab-video-idle");
  const draggingVideo = createHiddenVideo(draggingVideoSrc, "st-chatu8-fab-video-dragging");
  const idleVideoClone = createHiddenVideo(idleVideoSrc, "st-chatu8-fab-video-idle-clone");
  const draggingVideoClone = createHiddenVideo(draggingVideoSrc, "st-chatu8-fab-video-dragging-clone");
  const headPatVideoSrc = idleVideoSrc.replace(/[^/]+\.(mp4|chatu8)$/, "headpat.chatu8");
  const thinkingVideoSrc = idleVideoSrc.replace(/[^/]+\.(mp4|chatu8)$/, "thinking.chatu8");
  const talkVideoSrc = idleVideoSrc.replace(/[^/]+\.(mp4|chatu8)$/, "talk.chatu8");
  const canvasElement = document.createElement("canvas");
  canvasElement.id = "st-chatu8-fab-video-canvas";
  canvasElement.className = "st-chatu8-fab-video";
  canvasElement.style.width = "100%";
  canvasElement.style.height = "100%";
  canvasElement.style.position = "absolute";
  canvasElement.style.top = "0";
  canvasElement.style.left = "0";
  canvasElement.style.pointerEvents = "none";
  canvasElement.style.display = "block";
  canvasElement.style.zIndex = "2";
  const webgl = initWebGL(canvasElement);
  if (!webgl) {
    console.error("Failed to initialize WebGL");
    fallbackToTraditionalMode(container);
    return null;
  }
  const { gl, program, texture } = webgl;
  const state3 = {
    currentVideo: "idle",
    isPlaying: false,
    isLoaded: false,
    hasError: false,
    container,
    idleVideo,
    draggingVideo,
    idleVideoClone,
    draggingVideoClone,
    headPatVideo: null,
    // ✅ 懒加载：首次使用时才创建
    thinkingVideo: null,
    // ✅ 懒加载：首次使用时才创建
    talkVideo: null,
    // ✅ 懒加载：首次使用时才创建
    headPatVideoSrc,
    // ✅ 记录路径用于懒加载
    thinkingVideoSrc,
    // ✅ 记录路径用于懒加载
    talkVideoSrc,
    // ✅ 记录路径用于懒加载
    headPatVideoLoading: false,
    // ✅ 懒加载中标记
    thinkingVideoLoading: false,
    // ✅ 懒加载中标记
    talkVideoLoading: false,
    // ✅ 懒加载中标记
    activeVideo: idleVideo,
    canvasElement,
    gl,
    program,
    texture,
    rafId: null,
    loadedCount: 0,
    alphaCache: null,
    // 用于 hitTest 的 alpha 缓存
    alphaCacheDirty: true,
    // 标记 alpha 缓存是否需要更新
    lastAlphaCacheTime: 0,
    // 上次更新 alpha 缓存的时间戳
    lastVideoTime: -1,
    // 上一次上传到纹理的视频 currentTime（用于跳过重复帧）
    isPlayingHeadPat: false,
    // ✅ 新增：标记是否正在播放摸头视频
    isPlayingThinking: false,
    // ✅ 新增：标记是否正在播放思考视频
    thinkingRequested: false,
    // ✅ 新增：标记是否已请求播放思考视频（用于取消异步加载）
    isPlayingTalk: false,
    // ✅ 新增：标记是否正在播放说话视频
    pipBackgroundEnabled: false
    // ✅ PiP 模式：启用时 clearColor 使用不透明背景色
  };
  const onVideoLoaded = (video) => {
    state3.loadedCount++;
    const requiredVideosCount = 4;
    if (state3.loadedCount >= requiredVideosCount && !state3.isLoaded) {
      state3.isLoaded = true;
      state3.hasError = false;
      setTimeout(() => {
        const sizeSuccess = updateCanvasSize(state3);
        if (!sizeSuccess) {
          console.warn("[st-chatu8] Initial canvas size update failed, will retry automatically");
        }
        const icon = container.querySelector("i");
        if (icon) {
          icon.style.display = "none";
        }
        state3.isPlaying = true;
        const playPromise = idleVideo.play();
        if (playPromise !== void 0) {
          playPromise.catch((err) => {
            if (err.name !== "AbortError") {
              console.error("Failed to play idle video:", err);
              state3.isPlaying = false;
            }
          });
        }
        startRenderLoop(state3);
        preloadVideoToFirstFrame(idleVideoClone);
        preloadVideoToFirstFrame(draggingVideo);
        preloadVideoToFirstFrame(draggingVideoClone);
      }, 50);
    }
  };
  const onVideoError = (video) => {
    const originalSrc = video.dataset.originalSrc || video.src;
    if (!originalSrc || originalSrc === window.location.href) {
      return;
    }
    console.error("Failed to load video:", originalSrc);
    state3.hasError = true;
    state3.isLoaded = false;
    if (onError && typeof onError === "function") {
      const videoType = originalSrc.includes(idleVideoSrc) ? "idle" : "dragging";
      onError(videoType, originalSrc);
    }
    fallbackToTraditionalMode(container);
  };
  [idleVideo, draggingVideo, idleVideoClone, draggingVideoClone].forEach((video) => {
    video.addEventListener("loadeddata", () => onVideoLoaded(video));
    video.addEventListener("error", () => onVideoError(video));
  });
  setupEndedHandler(idleVideo, idleVideoClone, state3);
  setupEndedHandler(idleVideoClone, idleVideo, state3);
  setupEndedHandler(draggingVideo, draggingVideoClone, state3);
  setupEndedHandler(draggingVideoClone, draggingVideo, state3);
  container.appendChild(canvasElement);
  startVideoLoad(idleVideo);
  startVideoLoad(draggingVideo);
  startVideoLoad(idleVideoClone);
  startVideoLoad(draggingVideoClone);
  const preloadThinking = () => {
    if (state3.hasError) return;
    ensureVideoLoaded(state3, "thinkingVideo", "thinkingVideoSrc", "st-chatu8-fab-video-thinking").then((video) => {
      if (!video._endedHandlerRegistered) {
        setupThinkingEndedHandler(state3);
        video._endedHandlerRegistered = true;
      }
    }).catch((err) => {
      console.warn("[st-chatu8] \u9884\u8F7D\u601D\u8003\u89C6\u9891\u63D0\u793A:", err?.message || err);
    });
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(preloadThinking, { timeout: 3e3 });
  } else {
    setTimeout(preloadThinking, 1500);
  }
  const handleContextLost = (e) => {
    e.preventDefault();
    console.log("[st-chatu8] WebGL context lost, stopping render loop...");
    stopRenderLoop(state3);
    state3.isPlaying = false;
  };
  const handleContextRestored = () => {
    console.log("[st-chatu8] WebGL context restored, reinitializing WebGL pipeline...");
    const newWebgl = initWebGL(canvasElement);
    if (!newWebgl) {
      console.error("[st-chatu8] Failed to reinitialize WebGL after context restore");
      fallbackToTraditionalMode(container);
      return;
    }
    state3.gl = newWebgl.gl;
    state3.program = newWebgl.program;
    state3.texture = newWebgl.texture;
    updateCanvasSize(state3);
    state3.lastVideoTime = -1;
    state3.alphaCacheDirty = true;
    if (state3.isLoaded && !state3.hasError) {
      const video = state3.activeVideo;
      if (video) {
        state3.isPlaying = true;
        if (video.paused && video.readyState >= 2) {
          video.play().catch((err) => {
            console.warn("[st-chatu8] Failed to resume video after context restore:", err);
          });
        }
        startRenderLoop(state3);
        if (video.readyState >= 2) {
          renderFrame(state3);
        }
      }
    }
  };
  canvasElement.addEventListener("webglcontextlost", handleContextLost);
  canvasElement.addEventListener("webglcontextrestored", handleContextRestored);
  state3.handleContextLost = handleContextLost;
  state3.handleContextRestored = handleContextRestored;
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      if (state3.isLoaded && !state3.hasError) {
        console.log("[st-chatu8] Page became visible, resuming video playback...");
        console.log("[st-chatu8] activeVideo:", state3.activeVideo?.id, "readyState:", state3.activeVideo?.readyState, "paused:", state3.activeVideo?.paused);
        setTimeout(() => {
          if (!state3.isLoaded || state3.hasError) return;
          if (state3.gl && state3.gl.isContextLost()) {
            console.log("[st-chatu8] WebGL context is lost, deferring resume to contextrestored handler");
            return;
          }
          const video = state3.activeVideo;
          if (!video) {
            console.warn("[st-chatu8] No active video found!");
            return;
          }
          console.log("[st-chatu8] After delay - readyState:", video.readyState, "paused:", video.paused);
          const canvas = state3.canvasElement;
          if (canvas && (canvas.width === 0 || canvas.height === 0 || state3.container.offsetWidth === 0 || state3.container.offsetHeight === 0)) {
            console.log("[st-chatu8] Canvas/container size is invalid, triggering updateCanvasSize...");
            updateCanvasSize(state3);
          }
          state3.lastVideoTime = -1;
          state3.alphaCacheDirty = true;
          if (video.readyState < 2) {
            console.log("[st-chatu8] Video not ready, attempting to reload...");
            video.load();
          }
          if (video.paused) {
            console.log("[st-chatu8] Video is paused, attempting to play...");
            const playPromise = video.play();
            if (playPromise !== void 0) {
              playPromise.then(() => {
                console.log("[st-chatu8] Video play successful");
                state3.isPlaying = true;
                startRenderLoop(state3);
              }).catch((err) => {
                console.error("[st-chatu8] Failed to resume video:", err);
                const autoResume = () => {
                  video.play().then(() => {
                    state3.isPlaying = true;
                    startRenderLoop(state3);
                  }).catch(() => {
                  });
                  document.removeEventListener("touchstart", autoResume);
                  document.removeEventListener("click", autoResume);
                };
                document.addEventListener("touchstart", autoResume, { once: true });
                document.addEventListener("click", autoResume, { once: true });
              });
            }
          } else {
            console.log("[st-chatu8] Video already playing, just restarting render loop");
            state3.isPlaying = true;
            startRenderLoop(state3);
          }
          if (video.readyState >= 2) {
            renderFrame(state3);
          }
        }, 100);
      }
    } else {
      console.log("[st-chatu8] Page became hidden, stopping render loop...");
      stopRenderLoop(state3);
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);
  const handlePageShow = (event) => {
    if (event.persisted) {
      console.log("[st-chatu8] Page restored from bfcache, triggering visibility handler...");
      handleVisibilityChange();
    }
  };
  window.addEventListener("pageshow", handlePageShow);
  state3.handlePageShow = handlePageShow;
  let lastFocusResumeTime = 0;
  const handleWindowFocus = () => {
    if (document.visibilityState !== "visible") return;
    if (!state3.isLoaded || state3.hasError) return;
    const now = Date.now();
    if (now - lastFocusResumeTime < 500) return;
    lastFocusResumeTime = now;
    const video = state3.activeVideo;
    if (!video) return;
    if (state3.gl && state3.gl.isContextLost()) {
      console.log("[st-chatu8] Focus: WebGL context is lost, waiting for restore...");
      return;
    }
    if (video.paused || !state3.isPlaying) {
      console.log("[st-chatu8] Window focused, video paused:", video.paused, "isPlaying:", state3.isPlaying);
      state3.lastVideoTime = -1;
      state3.alphaCacheDirty = true;
      if (video.paused && video.readyState >= 2) {
        const playPromise = video.play();
        if (playPromise !== void 0) {
          playPromise.then(() => {
            state3.isPlaying = true;
            startRenderLoop(state3);
          }).catch((err) => {
            console.warn("[st-chatu8] Focus resume play failed:", err);
          });
        }
      } else if (!state3.isPlaying) {
        state3.isPlaying = true;
        startRenderLoop(state3);
      }
    }
  };
  window.addEventListener("focus", handleWindowFocus);
  state3.handleWindowFocus = handleWindowFocus;
  const healthMonitor = () => {
    if (!state3.isLoaded || state3.hasError) return;
    if (document.visibilityState !== "visible") return;
    if (state3.gl && state3.gl.isContextLost()) return;
    const video = state3.activeVideo;
    if (!video) return;
    const reasons = [];
    if (state3.isPlaying && video.paused && !video.ended) {
      reasons.push("paused");
    }
    if (state3.isPlaying && !state3.rafId && !state3._usingRVFC) {
      reasons.push("no-rAF");
    }
    const now = Date.now();
    if (state3.isPlaying && !video.paused && video.readyState >= 2) {
      if (state3._healthLastTime !== void 0) {
        const elapsed = now - state3._healthLastWall;
        const advanced = video.currentTime - state3._healthLastTime;
        if (elapsed > 3e3 && Math.abs(advanced) < 0.05) {
          reasons.push("stuck");
        }
      }
      state3._healthLastTime = video.currentTime;
      state3._healthLastWall = now;
    } else {
      state3._healthLastTime = video.currentTime;
      state3._healthLastWall = now;
    }
    if (reasons.length === 0) return;
    console.warn(`[st-chatu8][HealthMonitor] \u68C0\u6D4B\u5230\u89C6\u9891\u5F02\u5E38: ${reasons.join(", ")}, \u5C1D\u8BD5\u6062\u590D ${video.id}`);
    state3.lastVideoTime = -1;
    state3.alphaCacheDirty = true;
    if (video.paused && video.readyState >= 2) {
      const p = video.play();
      if (p && p.catch) {
        p.then(() => {
          state3.isPlaying = true;
          startRenderLoop(state3);
        }).catch((err) => {
          if (err.name !== "AbortError") {
            console.warn("[st-chatu8][HealthMonitor] \u6062\u590D\u64AD\u653E\u5931\u8D25:", err);
          }
        });
      }
    }
    if (!state3.rafId && !state3._usingRVFC) {
      state3.isPlaying = true;
      startRenderLoop(state3);
    }
  };
  state3.healthMonitorInterval = setInterval(healthMonitor, 2e3);
  state3.handleVisibilityChange = handleVisibilityChange;
  return {
    switchToIdleVideo: () => switchToIdleVideo(state3),
    switchToDraggingVideo: () => switchToDraggingVideo(state3),
    playHeadPatVideo: () => playHeadPatVideo(state3),
    // ✅ 新增
    playThinkingVideo: () => playThinkingVideo(state3),
    // ✅ 新增
    stopThinkingVideo: () => stopThinkingVideo(state3),
    // ✅ 新增
    playTalkVideo: () => playTalkVideo(state3),
    // ✅ 新增：播放说话视频
    stopTalkVideo: () => stopTalkVideo(state3),
    // ✅ 新增：停止说话视频
    pause: () => pause(state3),
    resume: () => resume(state3),
    destroy: () => destroy(state3),
    updateSize: (size) => updateSize(state3, size),
    hitTest: (x, y) => hitTest(state3, x, y),
    getState: () => state3,
    // ✅ PiP 背景控制：启用时 renderFrame 使用不透明背景色，关闭时恢复透明
    setPipBackground: (enabled) => {
      state3.pipBackgroundEnabled = !!enabled;
      state3.lastVideoTime = -1;
    }
  };
}

function updateCanvasSize(state3, scheduleRetry = true) {
  const container = state3.container;
  const canvas = state3.canvasElement;
  const video = state3.activeVideo;
  void container.offsetWidth;
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  if (containerWidth === 0 || containerHeight === 0) {
    console.warn("[st-chatu8] Container size is 0 (width:", containerWidth, "height:", containerHeight, ")");
    if (scheduleRetry && !state3._sizeRetryScheduled) {
      state3._sizeRetryScheduled = true;
      state3._sizeRetryCount = (state3._sizeRetryCount || 0) + 1;
      if (state3._sizeRetryCount <= 20) {
        const delay2 = state3._sizeRetryCount <= 5 ? 50 : (state3._sizeRetryCount - 5) * 100;
        console.log(`[st-chatu8] Scheduling retry #${state3._sizeRetryCount} in ${delay2}ms`);
        setTimeout(() => {
          state3._sizeRetryScheduled = false;
          const success = updateCanvasSize(state3, true);
          if (success && state3.isLoaded && state3.activeVideo && state3.activeVideo.readyState >= 2) {
            console.log("[st-chatu8] Canvas size updated successfully after retry");
            renderFrame(state3);
            updateAlphaCache(state3);
            state3.alphaCacheDirty = false;
            state3.lastAlphaCacheTime = performance.now();
          }
        }, delay2);
      } else {
        console.error("[st-chatu8] Max retry count reached for updateCanvasSize, giving up");
      }
    }
    return false;
  }
  state3._sizeRetryCount = 0;
  state3._sizeRetryScheduled = false;
  const videoWidth2 = video.videoWidth || 1;
  const videoHeight2 = (video.videoHeight || 1) / 2;
  const videoAspect = videoWidth2 / videoHeight2;
  const containerAspect = containerWidth / containerHeight;
  let displayWidth, displayHeight;
  if (videoAspect > containerAspect) {
    displayWidth = containerWidth;
    displayHeight = containerWidth / videoAspect;
  } else {
    displayHeight = containerHeight;
    displayWidth = containerHeight * videoAspect;
  }
  canvas.style.width = displayWidth + "px";
  canvas.style.height = displayHeight + "px";
  canvas.width = videoWidth2;
  canvas.height = videoHeight2;
  state3.gl.viewport(0, 0, canvas.width, canvas.height);
  console.log("[st-chatu8] Canvas size updated:", {
    containerSize: `${containerWidth}x${containerHeight}`,
    displaySize: `${displayWidth}x${displayHeight}`,
    resolution: `${canvas.width}x${canvas.height}`
  });
  return true;
}

function stopRenderLoop(state3) {
  if (state3.rafId) {
    cancelAnimationFrame(state3.rafId);
    state3.rafId = null;
  }
  state3.renderGeneration = (state3.renderGeneration || 0) + 1;
}

function startRenderLoop(state3) {
  stopRenderLoop(state3);
  if (state3.activeVideo && typeof state3.activeVideo.requestVideoFrameCallback === "function") {
    state3._usingRVFC = true;
    startVideoFrameLoop(state3);
  } else {
    state3._usingRVFC = false;
    startRafLoop(state3);
  }
}

function startVideoFrameLoop(state3) {
  if (state3.hasError || !state3.isPlaying) return;
  const myGeneration = state3.renderGeneration || 0;
  const onVideoFrame = (now, metadata) => {
    if (state3.renderGeneration !== myGeneration) return;
    if (state3.hasError || !state3.isPlaying) return;
    renderFrame(state3);
    if (state3.activeVideo && !state3.activeVideo.paused && typeof state3.activeVideo.requestVideoFrameCallback === "function") {
      state3.activeVideo.requestVideoFrameCallback(onVideoFrame);
    }
  };
  if (state3.activeVideo && !state3.activeVideo.paused) {
    state3.activeVideo.requestVideoFrameCallback(onVideoFrame);
  }
}

function startRafLoop(state3) {
  const render2 = () => {
    if (state3.hasError || !state3.isPlaying) {
      return;
    }
    renderFrame(state3);
    state3.rafId = requestAnimationFrame(render2);
  };
  render2();
}

function renderFrame(state3) {
  const { gl, texture, activeVideo } = state3;
  if (gl.isContextLost()) {
    return;
  }
  if (activeVideo.readyState < 2) {
    return;
  }
  const currentTime = activeVideo.currentTime;
  if (currentTime === state3.lastVideoTime) {
    return;
  }
  state3.lastVideoTime = currentTime;
  state3.alphaCacheDirty = true;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, activeVideo);
  if (state3.pipBackgroundEnabled) {
    gl.clearColor(0.102, 0.102, 0.18, 1);
  } else {
    gl.clearColor(0, 0, 0, 0);
  }
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function updateAlphaCache(state3) {
  const { gl, canvasElement } = state3;
  const width = canvasElement.width;
  const height = canvasElement.height;
  try {
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    state3.alphaCache = { pixels, width, height };
  } catch (error) {
    console.warn("Failed to update alpha cache:", error);
  }
}

function preloadVideoToFirstFrame(video) {
  video.currentTime = 0;
  video.pause();
}

function ensureVideoLoaded(state3, videoKey, srcKey, id) {
  return new Promise((resolve, reject) => {
    if (state3[videoKey] && state3[videoKey].readyState >= 2) {
      resolve(state3[videoKey]);
      return;
    }
    const loadingKey = videoKey + "Loading";
    if (state3[loadingKey] && state3[videoKey]) {
      const onLoaded = () => {
        state3[videoKey].removeEventListener("loadeddata", onLoaded);
        state3[videoKey].removeEventListener("error", onError);
        resolve(state3[videoKey]);
      };
      const onError = () => {
        state3[videoKey].removeEventListener("loadeddata", onLoaded);
        state3[videoKey].removeEventListener("error", onError);
        reject(new Error(`\u53EF\u9009\u89C6\u9891 ${id} \u52A0\u8F7D\u5931\u8D25`));
      };
      state3[videoKey].addEventListener("loadeddata", onLoaded);
      state3[videoKey].addEventListener("error", onError);
      return;
    }
    state3[loadingKey] = true;
    const video = createHiddenVideo(state3[srcKey], id);
    state3[videoKey] = video;
    video.addEventListener("loadeddata", () => {
      state3[loadingKey] = false;
      resolve(video);
    });
    video.addEventListener("error", () => {
      state3[loadingKey] = false;
      console.warn(`[st-chatu8] \u53EF\u9009\u89C6\u9891 ${id} \u52A0\u8F7D\u5931\u8D25\uFF0C\u529F\u80FD\u4E0D\u53EF\u7528`);
      reject(new Error(`\u53EF\u9009\u89C6\u9891 ${id} \u52A0\u8F7D\u5931\u8D25`));
    });
    startVideoLoad(video);
  });
}

function setupHeadPatEndedHandler(state3) {
  if (!state3.headPatVideo) return;
  state3.headPatVideo.addEventListener("ended", () => {
    if (state3.isPlayingHeadPat) {
      state3.isPlayingHeadPat = false;
      const fab = document.getElementById("st-chatu8-fab");
      const isLoading = fab && fab.dataset.isLoading === "true";
      if (isLoading) {
        playThinkingVideo(state3);
      } else {
        switchToIdleVideo(state3);
      }
    }
  });
}

function setupThinkingEndedHandler(state3) {
  if (!state3.thinkingVideo) return;
  state3.thinkingVideo.addEventListener("ended", () => {
    if (state3.isPlayingThinking) {
      state3.thinkingVideo.currentTime = 0;
      const playPromise = state3.thinkingVideo.play();
      if (playPromise !== void 0) {
        playPromise.catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Failed to loop thinking video:", err);
          }
        });
      }
    }
  });
}

function pauseAllVideos(state3) {
  const videos = [
    state3.idleVideo,
    state3.idleVideoClone,
    state3.draggingVideo,
    state3.draggingVideoClone,
    state3.thinkingVideo,
    state3.headPatVideo,
    state3.talkVideo
  ];
  videos.forEach((video) => {
    if (video && !video.paused) {
      video.pause();
    }
  });
}

function setupEndedHandler(video, clone, state3) {
  video.addEventListener("ended", () => {
    const oldActive = state3.activeVideo;
    state3.activeVideo = clone;
    state3.alphaCacheDirty = true;
    state3.lastVideoTime = -1;
    clone.currentTime = 0;
    const playPromise = clone.play();
    if (playPromise !== void 0) {
      playPromise.then(() => {
        startRenderLoop(state3);
        setTimeout(() => {
          preloadVideoToFirstFrame(video);
        }, 100);
      }).catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to play clone video:", err);
        }
      });
    }
  });
}

function hitTest(state3, clientX, clientY) {
  if (state3.hasError || !state3.isLoaded) {
    return true;
  }
  const now = performance.now();
  if (!state3.alphaCache || state3.alphaCacheDirty || now - state3.lastAlphaCacheTime > 200) {
    updateAlphaCache(state3);
    state3.alphaCacheDirty = false;
    state3.lastAlphaCacheTime = now;
  }
  if (!state3.alphaCache) {
    return true;
  }
  const { canvasElement, alphaCache } = state3;
  if (!canvasElement) return false;
  const rect = canvasElement.getBoundingClientRect();
  const relX = clientX - rect.left;
  const relY = clientY - rect.top;
  const canvasX = Math.floor(relX / rect.width * alphaCache.width);
  const canvasY = Math.floor(relY / rect.height * alphaCache.height);
  if (canvasX < 0 || canvasY < 0 || canvasX >= alphaCache.width || canvasY >= alphaCache.height) {
    return false;
  }
  const index = (canvasY * alphaCache.width + canvasX) * 4 + 3;
  const alpha = alphaCache.pixels[index];
  return alpha > 15;
}

function switchToIdleVideo(state3) {
  if (state3.hasError || state3.currentVideo === "idle") return;
  state3.currentVideo = "idle";
  pauseAllVideos(state3);
  state3.isPlayingThinking = false;
  state3.isPlayingHeadPat = false;
  state3.isPlayingTalk = false;
  state3.alphaCacheDirty = true;
  state3.lastVideoTime = -1;
  state3.idleVideo.currentTime = 0;
  const playPromise = state3.idleVideo.play();
  if (playPromise !== void 0) {
    playPromise.catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Failed to play idle video:", err);
      }
    });
  }
  state3.activeVideo = state3.idleVideo;
  preloadVideoToFirstFrame(state3.idleVideoClone);
  startRenderLoop(state3);
}

function switchToDraggingVideo(state3) {
  if (state3.hasError || state3.currentVideo === "dragging") return;
  state3.currentVideo = "dragging";
  pauseAllVideos(state3);
  state3.alphaCacheDirty = true;
  state3.lastVideoTime = -1;
  state3.draggingVideo.currentTime = 0;
  const playPromise = state3.draggingVideo.play();
  if (playPromise !== void 0) {
    playPromise.catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Failed to play dragging video:", err);
      }
    });
  }
  state3.activeVideo = state3.draggingVideo;
  preloadVideoToFirstFrame(state3.draggingVideoClone);
  startRenderLoop(state3);
}

async function playHeadPatVideo(state3) {
  if (state3.hasError || state3.isPlayingHeadPat) return;
  try {
    const video = await ensureVideoLoaded(
      state3,
      "headPatVideo",
      "headPatVideoSrc",
      "st-chatu8-fab-video-headpat"
    );
    if (!video._endedHandlerRegistered) {
      setupHeadPatEndedHandler(state3);
      video._endedHandlerRegistered = true;
    }
  } catch (err) {
    console.warn("\u6478\u5934\u89C6\u9891\u4E0D\u53EF\u7528");
    return;
  }
  if (!state3.headPatVideo || state3.headPatVideo.readyState < 2) {
    console.warn("Head pat video not ready");
    return;
  }
  state3.isPlayingHeadPat = true;
  state3.currentVideo = "headpat";
  pauseAllVideos(state3);
  state3.alphaCacheDirty = true;
  state3.lastVideoTime = -1;
  state3.headPatVideo.currentTime = 0;
  const playPromise = state3.headPatVideo.play();
  if (playPromise !== void 0) {
    playPromise.catch((err) => {
      if (err.name === "AbortError") return;
      console.error("Failed to play head pat video:", err);
      state3.isPlayingHeadPat = false;
      switchToIdleVideo(state3);
    });
  }
  state3.activeVideo = state3.headPatVideo;
  startRenderLoop(state3);
}

async function playThinkingVideo(state3) {
  if (state3.hasError) return;
  state3.thinkingRequested = true;
  try {
    const video = await ensureVideoLoaded(
      state3,
      "thinkingVideo",
      "thinkingVideoSrc",
      "st-chatu8-fab-video-thinking"
    );
    if (!state3.thinkingRequested) return;
    if (!video._endedHandlerRegistered) {
      setupThinkingEndedHandler(state3);
      video._endedHandlerRegistered = true;
    }
  } catch (err) {
    console.warn("[st-chatu8] \u601D\u8003\u89C6\u9891\u4E0D\u53EF\u7528\u6216\u52A0\u8F7D\u5F02\u5E38:", err);
    return;
  }
  if (!state3.thinkingRequested) return;
  if (!state3.thinkingVideo) {
    console.warn("[st-chatu8] Thinking video element not found");
    return;
  }
  if (state3.thinkingVideo.readyState < 2) {
    const onCanPlay = () => {
      state3.thinkingVideo.removeEventListener("canplay", onCanPlay);
      if (state3.thinkingRequested && !state3.isPlayingThinking) {
        playThinkingVideo(state3);
      }
    };
    state3.thinkingVideo.addEventListener("canplay", onCanPlay, { once: true });
    return;
  }
  if (state3.isPlayingThinking && state3.currentVideo === "thinking") {
    if (state3.thinkingVideo.paused) {
      const playPromise2 = state3.thinkingVideo.play();
      if (playPromise2 !== void 0) {
        playPromise2.catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Failed to resume thinking video:", err);
          }
        });
      }
    }
    return;
  }
  state3.isPlayingThinking = true;
  state3.currentVideo = "thinking";
  pauseAllVideos(state3);
  state3.alphaCacheDirty = true;
  state3.lastVideoTime = -1;
  state3.isPlayingHeadPat = false;
  state3.thinkingVideo.currentTime = 0;
  const playPromise = state3.thinkingVideo.play();
  if (playPromise !== void 0) {
    playPromise.catch((err) => {
      if (err.name === "AbortError") {
        return;
      }
      console.error("Failed to play thinking video:", err);
      state3.isPlayingThinking = false;
      switchToIdleVideo(state3);
    });
  }
  state3.activeVideo = state3.thinkingVideo;
  startRenderLoop(state3);
}

function stopThinkingVideo(state3) {
  const wasRequested = state3.thinkingRequested;
  state3.thinkingRequested = false;
  const fab = document.getElementById("st-chatu8-fab");
  if (fab) fab.classList.remove("st-chatu8-fab-loading");
  if (!state3.isPlayingThinking) {
    return;
  }
  state3.isPlayingThinking = false;
  if (state3.thinkingVideo) {
    state3.thinkingVideo.pause();
  }
  switchToIdleVideo(state3);
}

async function playTalkVideo(state3) {
  if (state3.hasError) return;
  try {
    const video = await ensureVideoLoaded(
      state3,
      "talkVideo",
      "talkVideoSrc",
      "st-chatu8-fab-video-talk"
    );
    if (!video._endedHandlerRegistered) {
      video.addEventListener("ended", () => {
        if (state3.isPlayingTalk) {
          console.log("[st-chatu8] Talk video ended, looping...");
          video.currentTime = 0;
          const playPromise2 = video.play();
          if (playPromise2 !== void 0) {
            playPromise2.then(() => {
              console.log("[st-chatu8] Talk video loop successful");
              startRenderLoop(state3);
            }).catch((err) => {
              if (err.name !== "AbortError") {
                console.error("[st-chatu8] Failed to loop talk video:", err);
                state3.isPlayingTalk = false;
                switchToIdleVideo(state3);
              }
            });
          }
        }
      });
      video._endedHandlerRegistered = true;
    }
  } catch (err) {
    console.warn("\u8BF4\u8BDD\u89C6\u9891\u4E0D\u53EF\u7528");
    return;
  }
  if (!state3.talkVideo || state3.talkVideo.readyState < 2) {
    console.warn("Talk video not ready");
    return;
  }
  if (state3.isPlayingTalk && state3.currentVideo === "talk") {
    if (state3.talkVideo.paused) {
      console.log("[st-chatu8] Resuming paused talk video");
      const playPromise2 = state3.talkVideo.play();
      if (playPromise2 !== void 0) {
        playPromise2.then(() => {
          startRenderLoop(state3);
        }).catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Failed to resume talk video:", err);
            state3.isPlayingTalk = false;
            switchToIdleVideo(state3);
          }
        });
      }
    }
    return;
  }
  console.log("[st-chatu8] Starting talk video playback");
  state3.isPlayingTalk = true;
  state3.currentVideo = "talk";
  pauseAllVideos(state3);
  state3.alphaCacheDirty = true;
  state3.lastVideoTime = -1;
  state3.isPlayingThinking = false;
  state3.isPlayingHeadPat = false;
  if (state3.talkVideoHealthCheckInterval) {
    clearInterval(state3.talkVideoHealthCheckInterval);
    state3.talkVideoHealthCheckInterval = null;
  }
  state3.talkVideo.currentTime = 0;
  const playPromise = state3.talkVideo.play();
  if (playPromise !== void 0) {
    playPromise.then(() => {
      console.log("[st-chatu8] Talk video play successful");
      state3.talkVideoHealthCheckInterval = setInterval(() => {
        if (state3.isPlayingTalk && state3.talkVideo) {
          if (state3.talkVideo.paused && state3.talkVideo.readyState >= 2) {
            console.warn("[st-chatu8] Talk video unexpectedly paused, attempting to resume...");
            state3.talkVideo.play().catch((err) => {
              console.error("[st-chatu8] Failed to resume talk video in health check:", err);
              state3.isPlayingTalk = false;
              clearInterval(state3.talkVideoHealthCheckInterval);
              state3.talkVideoHealthCheckInterval = null;
              switchToIdleVideo(state3);
            });
          }
          if (!state3.isPlaying) {
            console.warn("[st-chatu8] Render loop stopped unexpectedly, restarting...");
            state3.isPlaying = true;
            startRenderLoop(state3);
          }
        }
      }, 2e3);
    }).catch((err) => {
      if (err.name === "AbortError") {
        return;
      }
      console.error("Failed to play talk video:", err);
      state3.isPlayingTalk = false;
      switchToIdleVideo(state3);
    });
  }
  state3.activeVideo = state3.talkVideo;
  startRenderLoop(state3);
}

function stopTalkVideo(state3) {
  if (!state3.isPlayingTalk) return;
  console.log("[st-chatu8] Stopping talk video");
  state3.isPlayingTalk = false;
  if (state3.talkVideoHealthCheckInterval) {
    clearInterval(state3.talkVideoHealthCheckInterval);
    state3.talkVideoHealthCheckInterval = null;
  }
  if (state3.talkVideo) {
    state3.talkVideo.pause();
  }
  const fab = document.getElementById("st-chatu8-fab");
  const isLoading = fab && fab.dataset.isLoading === "true";
  if (isLoading) {
    playThinkingVideo(state3);
  } else {
    switchToIdleVideo(state3);
  }
}

function pause(state3) {
  if (state3.hasError) return;
  state3.activeVideo.pause();
  state3.isPlaying = false;
  stopRenderLoop(state3);
}

function resume(state3) {
  if (state3.hasError) return;
  const playPromise = state3.activeVideo.play();
  if (playPromise !== void 0) {
    playPromise.then(() => {
      state3.isPlaying = true;
      startRenderLoop(state3);
    }).catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Failed to resume video:", err);
      }
    });
  }
}

function destroy(state3) {
  stopRenderLoop(state3);
  if (state3.talkVideoHealthCheckInterval) {
    clearInterval(state3.talkVideoHealthCheckInterval);
    state3.talkVideoHealthCheckInterval = null;
  }
  if (state3.healthMonitorInterval) {
    clearInterval(state3.healthMonitorInterval);
    state3.healthMonitorInterval = null;
  }
  if (state3.handleVisibilityChange) {
    document.removeEventListener("visibilitychange", state3.handleVisibilityChange);
    state3.handleVisibilityChange = null;
  }
  if (state3.handlePageShow) {
    window.removeEventListener("pageshow", state3.handlePageShow);
    state3.handlePageShow = null;
  }
  if (state3.canvasElement) {
    if (state3.handleContextLost) {
      state3.canvasElement.removeEventListener("webglcontextlost", state3.handleContextLost);
      state3.handleContextLost = null;
    }
    if (state3.handleContextRestored) {
      state3.canvasElement.removeEventListener("webglcontextrestored", state3.handleContextRestored);
      state3.handleContextRestored = null;
    }
  }
  if (state3.handleWindowFocus) {
    window.removeEventListener("focus", state3.handleWindowFocus);
    state3.handleWindowFocus = null;
  }
  state3.isPlaying = false;
  state3.isLoaded = false;
  state3.isPlayingHeadPat = false;
  state3.isPlayingThinking = false;
  state3.isPlayingTalk = false;
  [state3.idleVideo, state3.draggingVideo, state3.idleVideoClone, state3.draggingVideoClone, state3.headPatVideo, state3.thinkingVideo, state3.talkVideo].forEach((video) => {
    if (video) {
      video.pause();
      if (video.src && video.src.startsWith("blob:")) {
        URL.revokeObjectURL(video.src);
      }
      video.src = "";
      video.removeAttribute("src");
      video.load();
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    }
  });
  if (state3.canvasElement && state3.canvasElement.parentNode) {
    state3.canvasElement.parentNode.removeChild(state3.canvasElement);
  }
  if (state3.gl) {
    const ext = state3.gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  }
  state3.alphaCache = null;
  const icon = state3.container.querySelector("i");
  if (icon) {
    icon.style.display = "";
  }
}

function updateSize(state3, size) {
  const container = state3.container;
  if (size) {
    container.style.width = size + "px";
    container.style.height = size + "px";
  }
  void container.offsetWidth;
  const sizeChanged = updateCanvasSize(state3);
  if (sizeChanged && state3.isLoaded && state3.activeVideo && state3.activeVideo.readyState >= 2) {
    renderFrame(state3);
    updateAlphaCache(state3);
    state3.alphaCacheDirty = false;
    state3.lastAlphaCacheTime = performance.now();
  }
}

function fallbackToTraditionalMode(container) {
  console.warn("Falling back to traditional icon mode");
  const canvas = container.querySelector("canvas");
  if (canvas) {
    canvas.style.display = "none";
  }
  const icon = container.querySelector("i");
  if (icon) {
    icon.style.display = "";
  }
}

function checkWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch (e) {
    return false;
  }
}

export { checkWebGLSupport, createVideoPlayer };
