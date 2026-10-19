# REA 静态分析摘要（v3.1.7 bundle）

- 工具: REA (rea-agents 6.7.0), `analyze-javascript-application`
- 目标: v3.1.7 原始打包产物（sha256 `19a67b40…`，目录 Evidence `ev_3f5204bd…`）
- 结论: **bundler=esbuild, runtime=esbuild-esm**, 与本仓库 `src/` 重构所用还原方法一致

## REA 图要点（authority=ast-static-analysis, confidence=exact）

- 483 节点 / 1036 边：esbuild module 节点带原始模块键
  （`utils/characterGen.js`、`utils/configDatabase.js`、`utils/avatarConfig.js`…），
  与 `src/` 下 206 个还原模块的命名/结构对应
- 139 个网络端点字面量（`/api/sd/generate`、`${url}/queue` 等，均为 call:fetch）
- 7195 个函数语义指纹（normalized AST / control-flow / relation-shape）
- 宿主导入边状态 `rejected`（ST 宿主文件在分析目录外，属预期）

## 覆盖限制（Evidence limitations/coverage）

- 语义图 20k 节点上限触发截断，模块清单为**部分覆盖**
- unknowns: call-flow dynamic-call 32028、object-flow ambiguous-target 46968 等——
  动态派发与 DOM 流，静态分析不可判定
- REA 观察到 bundle 内宿主导入存在 **3 层与 4 层 `../` 混用**（resolution rejected），
  4 层在扩展根目录下会 404；重构时已统一归一化为根相对 3 层

## 与重构的交叉验证

- REA 识别出的 esbuild 模块键 ⊆ 重构模块集合（差异均为 host/dynamic-import 节点与截断）
- 动态 import 形态 `Promise.resolve().then(() => (init_X(), X_exports))` 与 REA
  edges 中的 dynamic-import 记录一致，重构已还原为 `await import(...)`
