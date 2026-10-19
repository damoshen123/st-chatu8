// 还原自打包产物 — 原始模块: utils/settings/taskManager.js
import { eventSource } from "../../../../../../script.js";
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { cancelSerialLock, resetSerialLock } from "../utils.js";
import { TaskStatus, TaskType, taskQueue } from "../taskQueue.js";
import { clearAllGenerating, stopGenerating } from "../generation_status.js";
import { clearInFlightRequests, refreshBubbleState } from "./fabBubble.js";
import { stopFabLoading } from "./fab.js";
import { statusIcons, statusTexts, typeTexts } from "./log.js";

function renderTaskList(tasks) {
  const container = document.getElementById("ch-task-list");
  if (!container) return;
  if (tasks.length === 0) {
    container.innerHTML = '<div class="st-chatu8-task-empty">\u6682\u65E0\u4EFB\u52A1</div>';
    return;
  }
  const html = tasks.map((task) => {
    const icon = statusIcons[task.status] || "\u2753";
    const statusText = statusTexts[task.status] || task.status;
    const typeText = typeTexts[task.type] || task.type;
    const canCancel = task.status === TaskStatus.QUEUED || task.status === TaskStatus.RUNNING;
    let durationText = "";
    if (task.completedAt && (task.startedAt || task.createdAt)) {
      const start = task.startedAt || task.createdAt;
      const duration = ((task.completedAt - start) / 1e3).toFixed(1);
      durationText = ` \xB7 \u8017\u65F6 ${duration}s`;
    } else if (task.status === TaskStatus.RUNNING && (task.startedAt || task.createdAt)) {
      const start = task.startedAt || task.createdAt;
      const duration = ((Date.now() - start) / 1e3).toFixed(0);
      durationText = ` \xB7 \u8FD0\u884C\u4E2D ${duration}s`;
    }
    return `
            <div class="st-chatu8-task-item" data-task-id="${task.id}">
                <span class="task-icon">${icon}</span>
                <span class="task-info">
                    <span class="task-name" title="${task.prompt || task.name}">${task.name}</span>
                    <span class="task-meta">${typeText} \xB7 ${statusText}${durationText}</span>
                </span>
                ${canCancel ? `<button class="task-cancel-btn" data-task-id="${task.id}" title="\u53D6\u6D88\u4EFB\u52A1">\u274C</button>` : ""}
            </div>
        `;
  }).join("");
  container.innerHTML = html;
  container.querySelectorAll(".task-cancel-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const taskId = btn.getAttribute("data-task-id");
      handleCancelTask(taskId);
    });
  });
}

function handleCancelTask(taskId) {
  const task = taskQueue.tasks.get(taskId);
  if (!task) return;
  if (task.prompt) {
    stopGenerating(task.prompt);
  }
  cancelSerialLock(taskId);
  const wasRunning = taskQueue.cancelTask(taskId);
  if (task.type === TaskType.AUTO_CLICK) {
    window.zidongdianji = false;
    console.log("[TaskManager] \u5DF2\u505C\u6B62\u81EA\u52A8\u70B9\u51FB\u4EFB\u52A1");
  } else if (task.type === TaskType.LLM) {
    eventSource.emit("st_chatu8_cancel_llm_task", { taskId });
    console.log("[TaskManager] \u5DF2\u89E6\u53D1 LLM \u53D6\u6D88\u4E8B\u4EF6");
  } else if (task.type === TaskType.NOVELAI) {
    eventSource.emit("st_chatu8_cancel_novelai_task", { taskId });
    console.log("[TaskManager] \u5DF2\u89E6\u53D1 NovelAI \u53D6\u6D88\u4E8B\u4EF6");
  } else if (task.type === TaskType.BANANA) {
    eventSource.emit("st_chatu8_cancel_banana_task", { taskId });
    console.log("[TaskManager] \u5DF2\u89E6\u53D1 Banana \u53D6\u6D88\u4E8B\u4EF6");
  } else if (task.type === TaskType.RUNNINGHUB || task.type === TaskType.RUNNINGHUB_IMG || task.type === TaskType.RUNNINGHUB_IMG2VID || task.type === TaskType.RUNNINGHUB_REF2VID) {
    eventSource.emit("st_chatu8_cancel_runninghub_task", { taskId });
    eventSource.emit("st_chatu8_cancel_task", { taskId });
    console.log("[TaskManager] \u5DF2\u89E6\u53D1 RunningHub \u53D6\u6D88\u4E8B\u4EF6");
  } else if (task.type === TaskType.COMFYUI || task.type === TaskType.COMFYUI_IMG || task.type === TaskType.COMFYUI_IMG2VID || task.type === TaskType.COMFYUI_REF2VID) {
    eventSource.emit("st_chatu8_cancel_comfyui_task", { taskId });
    eventSource.emit("st_chatu8_cancel_task", { taskId });
    console.log("[TaskManager] \u5DF2\u89E6\u53D1 ComfyUI \u53D6\u6D88\u4E8B\u4EF6");
  } else if (extension_settings[extensionName]?.client === "jiuguan") {
    eventSource.emit("sd_stop_generation");
    console.log("[TaskManager] \u5DF2\u901A\u77E5\u9152\u9986\u53D6\u6D88\u4EFB\u52A1");
  } else {
    eventSource.emit("st_chatu8_cancel_task", { taskId });
    console.log("[TaskManager] \u5DF2\u89E6\u53D1\u76F4\u8FDE\u53D6\u6D88\u4E8B\u4EF6");
  }
  if (taskQueue.getRunningCount() === 0) {
    try {
      stopFabLoading(false);
      refreshBubbleState();
    } catch (_e) {
    }
  }
  toastr.info("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
}

function handleCancelAll() {
  const runningTasks = Array.from(taskQueue.tasks.values()).filter((t) => t.status === TaskStatus.RUNNING);
  taskQueue.cancelAllQueued();
  for (const task of runningTasks) {
    handleCancelTask(task.id);
  }
  eventSource.emit("st_chatu8_cancel_novelai_task", {});
  eventSource.emit("st_chatu8_cancel_banana_task", {});
  eventSource.emit("st_chatu8_cancel_runninghub_task", {});
  eventSource.emit("st_chatu8_cancel_comfyui_task", {});
  eventSource.emit("st_chatu8_cancel_llm_task", {});
  eventSource.emit("st_chatu8_cancel_task", {});
  if (extension_settings[extensionName]?.client === "jiuguan") {
    eventSource.emit("sd_stop_generation");
  }
  clearAllGenerating();
  clearInFlightRequests();
  resetSerialLock();
  try {
    const docs = [document, ...Array.from(document.querySelectorAll("iframe")).map((f) => f.contentDocument).filter(Boolean)];
    docs.forEach((doc) => {
      const buttons = doc.querySelectorAll('button.image-tag-button[data-loading="true"]');
      buttons.forEach((btn) => {
        btn.removeAttribute("data-loading");
        btn.disabled = false;
        const bMode = btn.dataset.activeMode || "image";
        btn.textContent = bMode === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
      });
    });
  } catch (e) {
    console.warn("[TaskManager] \u6E05\u7406\u6309\u94AE loading \u72B6\u6001\u5F02\u5E38:", e);
  }
  try {
    stopFabLoading(true);
    refreshBubbleState();
  } catch (e) {
    console.warn("[TaskManager] \u5168\u90E8\u53D6\u6D88\u590D\u4F4D\u5F02\u5E38:", e);
  }
  toastr.info("\u5DF2\u53D6\u6D88\u6240\u6709\u4EFB\u52A1\u5E76\u590D\u4F4D\u72B6\u6001");
}

function handleClearCompleted() {
  taskQueue.clearCompleted();
  toastr.info("\u5DF2\u6E05\u7A7A\u5DF2\u5B8C\u6210\u4EFB\u52A1");
}

function updateStats(tasks) {
  const statsEl = document.getElementById("ch-task-stats");
  if (!statsEl) return;
  const running = tasks.filter((t) => t.status === TaskStatus.RUNNING).length;
  const queued = tasks.filter((t) => t.status === TaskStatus.QUEUED).length;
  if (running > 0 || queued > 0) {
    statsEl.textContent = `\u8FD0\u884C\u4E2D: ${running} | \u6392\u961F\u4E2D: ${queued}`;
    statsEl.style.display = "block";
  } else {
    statsEl.style.display = "none";
  }
}

function initTaskManager(settingsModal) {
  taskQueue.subscribe((tasks) => {
    renderTaskList(tasks);
    updateStats(tasks);
  });
  settingsModal.find("#ch-cancel-all-tasks").on("click", handleCancelAll);
  settingsModal.find("#ch-clear-completed").on("click", handleClearCompleted);
  console.log("[TaskManager] \u521D\u59CB\u5316\u5B8C\u6210");
}

function updateTaskManagerView() {
  const tasks = taskQueue.getAllTasks();
  renderTaskList(tasks);
  updateStats(tasks);
}

export { initTaskManager, updateTaskManagerView };
