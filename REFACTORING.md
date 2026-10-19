# 重构说明：从单文件 bundle 到模块化源码

## 背景

`index.js` 原为 3.8MB / 85,726 行的打包产物（v2.6.8 起"合并了js"），保留了 esbuild 的
`init_xxx = __esm({ "原文件路径"() {...} })` 惰性模块结构与 `// 原文件路径.js` 分节注释，
据此完整还原出 **206 个原始源码模块**（v3.1.7 重新生成）。

## 产物

- `index.js` — 新入口（27KB，含原始主模块代码），导入 `./src/**`
- `src/**` — 206 个 ES Module，按原始目录结构镜像（`utils/`、`utils/settings/` 等）
- `index.bundle.bak.js` — 原 bundle 备份（git 历史中也有，可删）

## 重写规则（由 /tmp/refactor-tools 的脚本自动完成）

1. **模块归属**：按 esbuild 保留的原始路径注释，把每个顶层声明/语句归属回原模块。
2. **宿主导入去混淆**：`extension_settings2..102` 等 mangled 别名还原为规范名
   （`extension_settings`、`saveSettingsDebounced`…），相对路径按新目录深度重算。
3. **`init_x()` 剥离**：惰性初始化调用改为 ESM 静态 import（依赖序排列）；
   入口的 eager init 转为副作用 import，保证初始化副作用不丢。
4. **动态 import 还原**：`Promise.resolve().then(() => (init_X(), X_exports))`
   → `await import("./x.js")`。
5. **跨模块可变状态**：打包器单作用域下可直接赋值的模块级变量（233 处），
   在属主模块生成 `export function __set_<name>(v) { <name> = v; }`，引用方赋值改写为 setter 调用。
6. **导出**：每模块导出被其他模块引用的全部名字。

## 验证

- 173 个模块 acorn 解析 0 失败、0 未解析引用（作用域感知校验）
（v3.1.7 重跑后指标：acorn 0 未解析引用、esbuild 全图 0 错误、Node 模拟加载全图求值通过；详见 REA-ANALYSIS.md）
- ⚠ 未在 SillyTavern 运行时做端到端验证 —— 请安装到 ST 实测一遍生图主流程

## 后续维护

- 直接改 `src/**`，`index.js` 只保留入口逻辑。
- `utils/settings/*.js` 基本一一对应设置页分区；`utils/aiModules/*` 是智绘姬助手的知识模块。
- 打包非必需：ST 扩展原生支持 ES modules，`manifest.json` 的 `js: "index.js"` 不变。
