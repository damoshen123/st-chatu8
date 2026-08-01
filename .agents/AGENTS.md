# st-chatu8 (智绘姬 / ChatU8) 项目指南

## 项目概述
`st-chatu8` 是一个为 [SillyTavern](https://github.com/SillyTavern/SillyTavern) 打造的高级第三方文生图/图生图/图生视频扩展插件（智绘姬）。支持 Stable Diffusion (A1111/Forge)、NovelAI、ComfyUI、Banana (Gemini/OpenAI 格式)、Grok 等多种绘画与大语言模型后端。

- **版本**: v2.8.0
- **作者**: 从前跟你一样
- **主页**: https://github.com/NoahFoya/ComfyUi-ST

---

## 目录结构

```
st-chatu8/
├── manifest.json            # SillyTavern 插件清单文件
├── index.js                 # 核心 JS 代码库 (合并后的单文件运行脚本)
├── settings.html            # 主设置面板 HTML 结构
├── style.css                # 插件基础全局样式
├── .prettierrc              # Prettier 代码格式化配置文件
├── README.md                # 插件使用与功能说明文档
├── html/                    # 各种子设置模块与悬浮 UI 模板
│   ├── settings/            # 独立功能页 HTML (sd, novelai, comfyui, banana, llm, character, etc.)
│   └── summary-manager.html
├── styles/                  # 模块化 CSS 样式表 (modals, forms, vibeGroup, character, etc.)
├── tagData/                 # Danbooru 标签及标签补全 JSON 词库数据
└── *.min.js                 # 依赖包本地化版本 (transformers, crypto-js, jszip, msgpack)
```

---

## 关键模块与开发约定

### 1. 代码格式规范 (.prettierrc)
- **缩进**: 4 个空格 (`tabWidth: 4`, `useTabs: false`)
- **单行最大长度**: 300 (`printWidth: 300`)
- **HTML 标签括号**: 同行闭合 (`bracketSameLine: true`)

### 2. SillyTavern 扩展开发规范
- **加载顺序**: `loading_order: 9`
- **文件引入**: `index.js` 为主要执行逻辑，`style.css` 为主样式。
- **DOM & 样式管理**: 避免强行修改酒馆宿主环境的全局样式，优先使用 `st-chatu8` 前缀隔离类名与 ID。

### 3. 注意事项
- 修改逻辑代码时注意兼容手机端 (Edge/Safari/Android) 与云端/局域网酒馆部署。
- `tagData/` 目录为静态 JSON 词库文件，修改或新增 tag 时需确认编码与格式正确。
