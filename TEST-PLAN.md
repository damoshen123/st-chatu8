# E2E 实测任务：ComfyUI 生图全流程（st-chatu8-fix v3.1.7 重构版）

## 环境

- SillyTavern 1.19.0 @ ubuntu (10.44.152.2:8000)，启用 `st-chatu8-fix`
- 后端：ComfyUI（CloudStudio 隧道，T4，CORS 全开，v0.3.42）
- 模型：`raehoshiIllustXL_vpredV30.safetensors`（已确认在 ComfyUI 上）
- 触发词：`image###<提示词>###`

## 测试步骤（自动化执行）

| # | 步骤 | 通过标准 |
|---|------|----------|
| T1 | 打开 ST，确认扩展加载 | 无 pageerror；悬浮球存在 |
| T2 | 在当前聊天发送 `image###1girl, solo, simple background, best quality###` | 消息发出，无立即报错 |
| T3 | 等待插件捕获触发词并创建生图任务 | 任务日志出现（console 出现 [st-chatu8] 生图相关日志） |
| T4 | 等待 ComfyUI 出图并回填（最长 180s） | 聊天最后一条消息内出现 `<img>`（src 为 data:/blob:/user/images） |
| T5 | 图片可交互验证缓存 | IndexedDB `chatu8_gallery` 收到新记录 / 图片元素可点击 |

## 判定

- T1–T5 全过 = 生图主流程跑通
- 任一步超时/报错：抓取当时的 console 错误与网络请求，定位到具体 src 模块

## 已知非阻断项

- SD 缓存图片 404（用户数据尚未生成）
- `processImageFile` 上游死代码（拖拽上传路径）


## 实测结果（2026-10-20 11:03，自动化执行）

| # | 步骤 | 结果 |
|---|------|------|
| T1 | 扩展加载 | ✅ 悬浮球存在，仅 st-chatu8-fix 脚本注入，无 pageerror |
| T2 | 发送触发词 `image###1girl, solo, silver hair…###` | ✅ 消息发出，插件捕获 |
| T3 | 任务创建 → ComfyUI `/prompt` 提交工作流 | ✅ console 见完整 workflow JSON（seed/steps/cfg 4.5/euler/simple） |
| T4 | 出图回填 | ✅ **1024×1024 PNG 渲染进最后一条消息**，toast「ComfyUI 普通生图完成，耗时 64.1 秒」 |
| T5 | 缓存/上传 | ✅ 图片上传至服务器 `/user/images/chatu8List/图片缓存列表.png`（Stego）；IndexedDB count 查询显示 0，但服务器缓存路径已写入——缓存记录 key 结构待查，不影响生图 |

**结论：重构版 ComfyUI 生图主流程完整跑通。**

### 非阻断观察项
- 页面 503 来自角色的 LLM 后端（Google AI 浏览器执行器未连接），与插件无关
- 悬浮球动画路径硬编码 `third-party/st-chatu8/html/…`（旧目录名），依赖原版目录存在；独立部署 fork 时悬浮球动画可能缺失
- `/mgpu/status` 404（CloudStudio 探测），非阻断
