# st-chatu8 智绘姬 · 角色DNA 融合版

把两个插件合成了一个：

| 原扩展 | 版本 | 融合后的位置 |
|---|---|---|
| **st-chatu8（智绘姬）** — 文生图 / LLM 出 Tag / 酒馆陪伴 | 3.1.7 | `chatu8.js`（核心，逻辑原样保留） |
| **st-chatu8-dna（角色DNA记录器）** — 边聊边整理角色档案 | 2.8.0 | `dna.js`（内置，不再需要单独安装） |

装一次、启用一次，智绘姬设置面板左侧就会直接出现 **「角色DNA」** 页签。
角色DNA 依然复用智绘姬的 LLM 配置、正则配置和发送请求，行为和原来一样。

---

## 安装

1. **先删掉旧的**：把 `extensions` 里的 `st-chatu8-dna` 整个文件夹删掉（或移走），
   旧的 `st-chatu8` 也删掉。**不要新旧三个同时存在**，否则 DNA 会跑两遍。
2. 把本压缩包里的 `st-chatu8` 文件夹放进
   `SillyTavern\data\default-user\extensions\`
   （用别的用户就放对应用户目录）。
3. 刷新酒馆页面（`Ctrl+F5`）。
4. 打开智绘姬设置面板，左侧导航最下面就是 **角色DNA**。

> 你的设置不会丢：智绘姬的配置仍存在 `extension_settings["st-chatu8"]`，
> 角色DNA 的档案仍存在 `extension_settings["st-chatu8-dna"]`，键名和原版一致。

---

## 目录结构

```
st-chatu8/
├─ index.js              融合入口：先加载 chatu8.js，再加载 dna.js
├─ chatu8.js             智绘姬核心（原 index.js，仅把「在线更新」改成提示）
├─ dna.js                角色DNA记录器（原 st-chatu8-dna/index.js）
├─ dna.css               角色DNA 面板样式
├─ style.css             智绘姬样式（末尾 @import 了 dna.css）
├─ manifest.json         融合版清单（已去掉对 st-chatu8 的 dependencies）
├─ settings.html         智绘姬设置弹窗
├─ html/ styles/ tagData/  智绘姬资源
├─ crypto-js.min.js / jszip.min.js / msgpack.min.js / transformers.min.js
├─ 角色DNA使用说明书.md    原 DNA 插件的详细使用说明（安装章节以本 README 为准）
├─ LICENSE               AFPL v9
└─ README.md             本文件
```

入口文件很短，只有两行真正干活的代码：

```js
import './chatu8.js';
import './dna.js';
```

ES Module 的求值顺序保证 `chatu8.js` 先完整执行，`dna.js` 后执行，
所以 DNA 挂载时智绘姬的设置面板一定已经存在。

---

## 融合后的差异

- **只要一个扩展**：不再有 `dependencies: ["third-party/st-chatu8"]`，
  也不会出现「缺前置」提示。
- **在线更新改为提示**：智绘姬原生带一个从 GitHub `git pull` 的更新按钮，
  直接更新会把 `dna.js` 和融合入口覆盖掉，所以融合版点击更新时
  只弹提示、不再执行。升级融合版请整包替换（见下）。
- **角色DNA 仍是页签**：没有改动智绘姬的源码结构，只是把两份代码装进同一个扩展。
- **控制台标记**：加载成功后可在控制台输入 `__chatu8Fusion` 查看融合版本信息。

---

## 升级 / 回滚

**升级融合包**
1. 备份 `st-chatu8` 文件夹（设置存在 `settings.json` 里，不在文件夹内，不会丢）。
2. 用新融合包整个替换 `extensions\st-chatu8\`。
3. `Ctrl+F5`。

**只想升级智绘姬本体**
1. 下载新版 st-chatu8，把它的 `index.js` 改名为 `chatu8.js` 覆盖本目录同名文件。
2. 保留本目录的 `index.js`（融合入口）、`dna.js`、`dna.css`。
3. 若新版新增了资源文件，一并覆盖 `html/`、`styles/`、`tagData/`。

**回滚**
删除 `st-chatu8`，恢复备份的原版 `st-chatu8` + `st-chatu8-dna`，再 `Ctrl+F5`。

---

## 常见问题

**左侧没有「角色DNA」？**
先 `Ctrl+F5` 硬刷新；再看控制台有没有 `[DNA]` 日志。
若日志提示「没等到智绘姬的设置面板」，说明 `chatu8.js` 没加载成功，
检查 `extensions\st-chatu8\` 下文件是否齐全（尤其 `chatu8.js`）。

**DNA 自动记录跑两次 / 日志重复？**
旧的 `st-chatu8-dna` 扩展还在 `extensions` 里并且被启用了。删掉它再刷新。

**点「检查更新」没反应？**
融合版故意禁用了在线更新，只弹一条提示。

---

## 许可与致谢

- **智绘姬 st-chatu8**：© 从前跟你一样，Aladdin Free Public License (AFPL) v9。
  该许可允许免费复制、修改、再分发，但**禁止商业机构以任何收费方式分发**；
  再分发需标注修改、保持同一许可证并附完整源码。全文见 `LICENSE`。
- **角色DNA记录器**：© moran99123。
- 本融合包只做了文件结构与入口整合，未改变两个插件的功能逻辑。
  尊重原创，请勿用于售卖或去署名的二次分发。
