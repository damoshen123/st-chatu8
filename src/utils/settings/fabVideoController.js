// 还原自打包产物 — 原始模块: utils/settings/fabVideoController.js
function initVideoController(videoPlayer, options = {}) {
  let isDragging = false;
  let switchTimeout = null;
  let wasThinking = false;
  const { isLoadingFn } = options;
  const controller = {
    onDragStart: () => {
      if (switchTimeout) {
        clearTimeout(switchTimeout);
        switchTimeout = null;
      }
      const state3 = videoPlayer.getState();
      wasThinking = state3.isPlayingThinking;
      switchTimeout = setTimeout(() => {
        if (!isDragging) {
          isDragging = true;
          videoPlayer.switchToDraggingVideo();
        }
      }, 50);
    },
    onDragEnd: () => {
      if (switchTimeout) {
        clearTimeout(switchTimeout);
        switchTimeout = null;
      }
      if (isDragging) {
        isDragging = false;
        const state3 = videoPlayer.getState();
        if (state3 && state3.isPlayingTalk) {
          videoPlayer.playTalkVideo();
          wasThinking = false;
          return;
        }
        const isLoading = isLoadingFn ? isLoadingFn() : false;
        if ((wasThinking || isLoading) && videoPlayer.playThinkingVideo) {
          videoPlayer.playThinkingVideo();
        } else {
          videoPlayer.switchToIdleVideo();
        }
        wasThinking = false;
      }
    },
    cleanup: () => {
      if (switchTimeout) {
        clearTimeout(switchTimeout);
        switchTimeout = null;
      }
      isDragging = false;
      wasThinking = false;
    }
  };
  return controller;
}

export { initVideoController };
