// 还原自打包产物 — 原始模块: utils/aiTaskManager.js
var currentTask, stepIdCounter, taskHistory, taskIdCounter;

currentTask = null;

taskHistory = [];

taskIdCounter = 0;

stepIdCounter = 0;

function generateTaskId() {
  taskIdCounter++;
  return `task_${taskIdCounter}_${Date.now()}`;
}

function generateStepId() {
  stepIdCounter++;
  return `step_${stepIdCounter}`;
}

function archiveCurrentTask() {
  if (currentTask) {
    if (currentTask.status === "pending" || currentTask.status === "in_progress") {
      currentTask.status = "archived";
      currentTask.updatedAt = Date.now();
    }
    taskHistory.push(currentTask);
    if (taskHistory.length > 10) {
      taskHistory = taskHistory.slice(-10);
    }
    currentTask = null;
  }
}

function truncateText(text, maxLen = 50) {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + "...";
}

function createTask(title, steps = []) {
  archiveCurrentTask();
  const taskId = generateTaskId();
  const now = Date.now();
  currentTask = {
    id: taskId,
    title,
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
    summary: "",
    steps: steps.map((stepTitle, index) => ({
      id: generateStepId(),
      title: stepTitle,
      status: "pending",
      result: "",
      order: index + 1
    }))
  };
  if (currentTask.steps.length > 0) {
    currentTask.steps[0].status = "in_progress";
  }
  let result = `\u2705 \u4EFB\u52A1\u521B\u5EFA\u6210\u529F\uFF01
`;
  result += `\u4EFB\u52A1: ${title}
`;
  result += `\u6B65\u9AA4\u6570: ${steps.length}
`;
  if (steps.length > 0) {
    result += `\u6B65\u9AA4\u5217\u8868:
`;
    currentTask.steps.forEach((s) => {
      result += `  ${s.id}. ${s.title}
`;
    });
  }
  return result;
}

function updateTask(fields = {}) {
  if (!currentTask) {
    return "\u26A0\uFE0F \u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4EFB\u52A1\u3002\u8BF7\u5148\u4F7F\u7528 task_create \u521B\u5EFA\u4EFB\u52A1\u3002";
  }
  if (fields.title) {
    currentTask.title = fields.title;
  }
  if (fields.status && ["pending", "in_progress", "completed", "failed"].includes(fields.status)) {
    currentTask.status = fields.status;
  }
  currentTask.updatedAt = Date.now();
  return `\u2705 \u4EFB\u52A1\u5DF2\u66F4\u65B0: ${currentTask.title} (${currentTask.status})`;
}

function updateStep(stepId, fields = {}) {
  if (!currentTask) {
    return "\u26A0\uFE0F \u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4EFB\u52A1\u3002";
  }
  const step = currentTask.steps.find((s) => s.id === stepId);
  if (!step) {
    return `\u26A0\uFE0F \u672A\u627E\u5230\u6B65\u9AA4 ${stepId}\u3002\u5F53\u524D\u6B65\u9AA4: ${currentTask.steps.map((s) => s.id).join(", ")}`;
  }
  if (fields.status && ["pending", "in_progress", "completed", "failed", "skipped"].includes(fields.status)) {
    step.status = fields.status;
    if (fields.status === "completed" || fields.status === "skipped") {
      const nextPending = currentTask.steps.find((s) => s.status === "pending");
      if (nextPending) {
        nextPending.status = "in_progress";
      }
    }
  }
  if (fields.result !== void 0) {
    step.result = truncateText(String(fields.result), 50);
  }
  currentTask.updatedAt = Date.now();
  const statusIcon = { pending: "\u25CB", in_progress: "\u2192", completed: "\u2713", failed: "\u2717", skipped: "\u2298" };
  return `${statusIcon[step.status] || "?"} \u6B65\u9AA4 ${step.order}\u300C${step.title}\u300D\u5DF2\u66F4\u65B0\u4E3A ${step.status}${step.result ? " | " + step.result : ""}`;
}

function addSteps(steps = []) {
  if (!currentTask) {
    return "\u26A0\uFE0F \u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4EFB\u52A1\u3002\u8BF7\u5148\u4F7F\u7528 task_create \u521B\u5EFA\u4EFB\u52A1\u3002";
  }
  const startOrder = currentTask.steps.length + 1;
  const newSteps = steps.map((title, index) => ({
    id: generateStepId(),
    title,
    status: "pending",
    result: "",
    order: startOrder + index
  }));
  currentTask.steps.push(...newSteps);
  currentTask.updatedAt = Date.now();
  let result = `\u2705 \u5DF2\u8FFD\u52A0 ${newSteps.length} \u4E2A\u65B0\u6B65\u9AA4:
`;
  newSteps.forEach((s) => {
    result += `  ${s.id}. ${s.title}
`;
  });
  return result;
}

function completeTask(summary = "") {
  if (!currentTask) {
    return "\u26A0\uFE0F \u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4EFB\u52A1\u3002";
  }
  currentTask.status = "completed";
  currentTask.summary = summary;
  currentTask.updatedAt = Date.now();
  currentTask.steps.forEach((s) => {
    if (s.status === "pending" || s.status === "in_progress") {
      s.status = "completed";
    }
  });
  const title = currentTask.title;
  taskHistory.push(currentTask);
  if (taskHistory.length > 10) {
    taskHistory = taskHistory.slice(-10);
  }
  currentTask = null;
  return `\u{1F389} \u4EFB\u52A1\u300C${title}\u300D\u5DF2\u5B8C\u6210\uFF01${summary ? "\n\u6458\u8981: " + summary : ""}`;
}

function getCurrentTask() {
  return currentTask;
}

function getTaskStatusPrompt() {
  if (!currentTask) return "";
  const statusIcon = {
    pending: "\u25CB",
    in_progress: "\u2192",
    completed: "\u2713",
    failed: "\u2717",
    skipped: "\u2298"
  };
  const statusLabel = {
    pending: "\u5F85\u6267\u884C",
    in_progress: "\u8FDB\u884C\u4E2D",
    completed: "\u5DF2\u5B8C\u6210",
    failed: "\u5DF2\u5931\u8D25"
  };
  const completedCount = currentTask.steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const totalCount = currentTask.steps.length;
  let prompt2 = `\u3010\u5F53\u524D\u4EFB\u52A1\u3011${currentTask.title} (${statusLabel[currentTask.status] || currentTask.status}`;
  if (totalCount > 0) {
    prompt2 += `, ${completedCount}/${totalCount}\u6B65\u5DF2\u5B8C\u6210`;
  }
  prompt2 += ")\n";
  let displaySteps = currentTask.steps;
  if (displaySteps.length > 15) {
    const activeIdx = displaySteps.findIndex((s) => s.status === "in_progress");
    const centerIdx = activeIdx >= 0 ? activeIdx : completedCount;
    const start = Math.max(0, centerIdx - 3);
    const end = Math.min(displaySteps.length, start + 10);
    if (start > 0) {
      prompt2 += `  ... (\u524D ${start} \u6B65\u5DF2\u7701\u7565)
`;
    }
    displaySteps = displaySteps.slice(start, end);
    if (end < currentTask.steps.length) {
    }
  }
  for (const step of displaySteps) {
    const icon = statusIcon[step.status] || "?";
    const resultPart = step.result ? ` (${step.result})` : "";
    const activeMark = step.status === "in_progress" ? " (\u6267\u884C\u4E2D)" : "";
    prompt2 += `  ${icon} ${step.order}. ${step.title}${activeMark}${resultPart}
`;
  }
  if (currentTask.steps.length > 15) {
    const shownEnd = displaySteps[displaySteps.length - 1]?.order || 0;
    if (shownEnd < currentTask.steps.length) {
      prompt2 += `  ... (\u540E ${currentTask.steps.length - shownEnd} \u6B65\u5DF2\u7701\u7565)
`;
    }
  }
  return prompt2;
}

function clearAll() {
  currentTask = null;
  taskHistory = [];
}

function serialize() {
  if (!currentTask && taskHistory.length === 0) {
    return null;
  }
  return {
    version: 1,
    currentTask: currentTask ? { ...currentTask, steps: currentTask.steps.map((s) => ({ ...s })) } : null,
    taskHistory: taskHistory.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })),
    taskIdCounter,
    stepIdCounter
  };
}

function restore(data) {
  if (!data || typeof data !== "object" || !data.version) {
    currentTask = null;
    taskHistory = [];
    return;
  }
  currentTask = data.currentTask || null;
  taskHistory = Array.isArray(data.taskHistory) ? data.taskHistory : [];
  if (typeof data.taskIdCounter === "number" && data.taskIdCounter > taskIdCounter) {
    taskIdCounter = data.taskIdCounter;
  }
  if (typeof data.stepIdCounter === "number" && data.stepIdCounter > stepIdCounter) {
    stepIdCounter = data.stepIdCounter;
  }
}

function getTaskInfo() {
  let result = "";
  if (currentTask) {
    result += "\u3010\u5F53\u524D\u6D3B\u52A8\u4EFB\u52A1\u3011\n";
    result += `ID: ${currentTask.id}
`;
    result += `\u6807\u9898: ${currentTask.title}
`;
    result += `\u72B6\u6001: ${currentTask.status}
`;
    result += `\u6B65\u9AA4\u6570: ${currentTask.steps.length}
`;
    const completedCount = currentTask.steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
    result += `\u5DF2\u5B8C\u6210: ${completedCount}/${currentTask.steps.length}
`;
    result += "\n\u6B65\u9AA4\u8BE6\u60C5:\n";
    for (const step of currentTask.steps) {
      result += `  [${step.id}] ${step.order}. ${step.title} \u2014 ${step.status}${step.result ? " | " + step.result : ""}
`;
    }
  } else {
    result += "\u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4EFB\u52A1\u3002\n";
  }
  if (taskHistory.length > 0) {
    result += `
\u3010\u5386\u53F2\u4EFB\u52A1\u3011\uFF08\u5171 ${taskHistory.length} \u4E2A\uFF09
`;
    for (const task of taskHistory.slice(-5)) {
      const completedCount = task.steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
      result += `- ${task.title} [${task.status}] (${completedCount}/${task.steps.length}\u6B65)${task.summary ? " \u2014 " + task.summary : ""}
`;
    }
  }
  return result;
}

export { addSteps, clearAll, completeTask, createTask, getCurrentTask, getTaskInfo, getTaskStatusPrompt, restore, serialize, updateStep, updateTask };
