// 还原自打包产物 — 原始模块: utils/taskQueue.js
import { eventSource } from "../../../../../../script.js";

var TaskQueue, TaskStatus, TaskType, taskQueue;

TaskStatus = {
      QUEUED: "queued",
      RUNNING: "running",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
      FAILED: "failed"
    };

TaskType = {
      BUTTON: "button",
      NOVELAI: "novelai",
      COMFYUI: "comfyui",
      COMFYUI_IMG: "comfyui_img",
      COMFYUI_IMG2VID: "comfyui_img2vid",
      COMFYUI_REF2VID: "comfyui_ref2vid",
      RUNNINGHUB: "runninghub",
      RUNNINGHUB_IMG: "runninghub_img",
      RUNNINGHUB_IMG2VID: "runninghub_img2vid",
      RUNNINGHUB_REF2VID: "runninghub_ref2vid",
      AUTO_CLICK: "auto_click",
      SD: "sd",
      LLM: "llm",
      BANANA: "banana"
    };

TaskQueue = class {
      constructor() {
        this.tasks = /* @__PURE__ */ new Map();
        this.listeners = [];
        this.maxHistory = 50;
      }
      /**
       * 生成唯一任务ID
       * @returns {string}
       */
      generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      }
      /**
       * 添加任务到队列
       * @param {object} task 任务信息
       * @param {string} task.name 任务名称
       * @param {string} task.type 任务类型 (button | comfyui)
       * @param {string} [task.prompt] 完整 prompt
       * @param {HTMLElement} [task.buttonElement] 按钮元素引用
       * @returns {string} 任务ID
       */
      addTask(task) {
        const id = this.generateId();
        const newTask = {
          id,
          name: task.name || "\u672A\u547D\u540D\u4EFB\u52A1",
          type: task.type || TaskType.BUTTON,
          prompt: task.prompt || "",
          buttonElement: task.buttonElement || null,
          status: TaskStatus.QUEUED,
          createdAt: Date.now(),
          startedAt: null,
          completedAt: null
        };
        this.tasks.set(id, newTask);
        this.notify();
        console.log(`[TaskQueue] \u4EFB\u52A1\u5DF2\u6DFB\u52A0: ${id} - ${newTask.name}`);
        return id;
      }
      /**
       * 更新任务状态
       * @param {string} id 任务ID
       * @param {string} status 新状态
       */
      updateStatus(id, status) {
        const task = this.tasks.get(id);
        if (task) {
          task.status = status;
          if (status === TaskStatus.RUNNING) {
            task.startedAt = Date.now();
          }
          if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED || status === TaskStatus.CANCELLED) {
            task.completedAt = Date.now();
          }
          this.notify();
          console.log(`[TaskQueue] \u4EFB\u52A1\u72B6\u6001\u66F4\u65B0: ${id} -> ${status}`);
        }
      }
      /**
       * 检查任务是否在队列中（未被取消）
       * @param {string} id 任务ID
       * @returns {boolean}
       */
      isTaskInQueue(id) {
        const task = this.tasks.get(id);
        return task && (task.status === TaskStatus.QUEUED || task.status === TaskStatus.RUNNING);
      }
      /**
       * 取消任务
       * @param {string} id 任务ID
       * @returns {boolean} 是否需要中断正在运行的任务
       */
      cancelTask(id) {
        const task = this.tasks.get(id);
        if (!task) return false;
        const wasRunning = task.status === TaskStatus.RUNNING;
        task.status = TaskStatus.CANCELLED;
        task.completedAt = Date.now();
        this.notify();
        console.log(`[TaskQueue] \u4EFB\u52A1\u5DF2\u53D6\u6D88: ${id}`);
        eventSource.emit("st_chatu8_task_cancelled", { taskId: id });
        return wasRunning;
      }
      /**
       * 完成任务
       * @param {string} id 任务ID
       * @param {boolean} success 是否成功
       */
      completeTask(id, success = true) {
        this.updateStatus(id, success ? TaskStatus.COMPLETED : TaskStatus.FAILED);
        this.cleanupHistory();
      }
      /**
       * 获取所有任务（按时间倒序）
       * @returns {Array}
       */
      getAllTasks() {
        return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt).slice(0, this.maxHistory);
      }
      /**
       * 获取正在运行的任务数量
       * @returns {number}
       */
      getRunningCount() {
        return Array.from(this.tasks.values()).filter((t) => t.status === TaskStatus.RUNNING).length;
      }
      /**
       * 获取排队中的任务数量
       * @returns {number}
       */
      getQueuedCount() {
        return Array.from(this.tasks.values()).filter((t) => t.status === TaskStatus.QUEUED).length;
      }
      /**
       * 取消所有排队中的任务
       */
      cancelAllQueued() {
        for (const [id, task] of this.tasks) {
          if (task.status === TaskStatus.QUEUED) {
            this.cancelTask(id);
          }
        }
      }
      /**
       * 清空已完成的任务
       */
      clearCompleted() {
        for (const [id, task] of this.tasks) {
          if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED || task.status === TaskStatus.CANCELLED) {
            this.tasks.delete(id);
          }
        }
        this.notify();
      }
      /**
       * 清理历史任务（保留最近的 maxHistory 条）
       */
      cleanupHistory() {
        const allTasks = this.getAllTasks();
        if (allTasks.length > this.maxHistory) {
          const toRemove = allTasks.slice(this.maxHistory);
          for (const task of toRemove) {
            if (task.status !== TaskStatus.QUEUED && task.status !== TaskStatus.RUNNING) {
              this.tasks.delete(task.id);
            }
          }
        }
      }
      /**
       * 通知所有监听器
       */
      notify() {
        const tasks = this.getAllTasks();
        this.listeners.forEach((fn) => {
          try {
            fn(tasks);
          } catch (e) {
            console.error("[TaskQueue] \u76D1\u542C\u5668\u6267\u884C\u9519\u8BEF:", e);
          }
        });
      }
      /**
       * 订阅任务列表更新
       * @param {Function} fn 回调函数
       * @returns {Function} 取消订阅函数
       */
      subscribe(fn) {
        this.listeners.push(fn);
        fn(this.getAllTasks());
        return () => {
          this.listeners = this.listeners.filter((l) => l !== fn);
        };
      }
    };

taskQueue = new TaskQueue();

export { TaskStatus, TaskType, taskQueue };
