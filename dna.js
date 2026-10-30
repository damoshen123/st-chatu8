/**
 * 档案库 · 已融合进 st-chatu8（由融合入口 index.js 引入本文件）
 * ---------------------------------------------------------------
 * 本文件是原扩展的构建产物（原 st-chatu8-dna/index.js）。
 * 字段规则已经内联在下方，不需要再跑构建脚本。
 *
 * v2.9.32：分类操作里新增「清空全部」——把当前库的所有分类和条目一次清空
 *          （内置库是插件里的静态文件，删不掉，所以不逐条记 deleted、只打一个「整库已清空」
 *          标记，合库时跳过内置本体；点「重载内置库」/「恢复内置」可以全部找回来）
 * v2.9.31：同人资料库进页面卡几秒的优化——合并结果、分类统计、分类下拉三样都缓存起来了
 *          （10 万条库以前每次渲染都要重新规范化 + 统计 + 重建 9629 个 option，手机上一次
 *          一两秒）；分类下拉最多铺 800 项、其余靠搜索框筛；搜索框输入加了防抖；
 *          「内置库来源」下拉不再每次渲染都把导入的那份整库从 IndexedDB 读出来只为看条数
 * v2.9.30：修两个 bug——①「重载内置库」解压出来的结果只放内存，重进酒馆（游戏）内置库就消失、
 *          得再点一次；现在解压成功顺手把整库存进 IndexedDB，下次进游戏直接从本地读回来；
 *          ②同人库搜索框打字没反应：libHit 里用了那层拿不到的 tag 变量，一有搜索词就抛
 *          ReferenceError，又被外面的 .catch 吞掉——改成由调用方把 scope 传进来
 * v2.9.28：档案字段新增「ip」（角色出自哪部作品）——内置默认模板改成十二段，三份内置上下文预设
 *          同步加上 ip 填写规则（判断得出出处就写作品名，原创角色写「无」）；
 *          底部详情里的字段编辑入口整个删掉，改档案只走列表上的小铅笔弹窗；
 *          弹窗里的历史存档小按钮补上样式（原先取不到 #dna-tab 作用域的 .dna-mini，退化成白块）
 * v2.9.19：档案详情底部新增「历史存档」——自动记录 / 手动生成 / 同人库生成，每次更新前的那一版
 *          自动留一份，每个角色最多保存 3 份（内容没变不留），可以随时查看旧版全文并一键回档；
 *          回档时当前这版也会进历史，点错了还能再回回来
 * v2.9.18：内置预设加版本号——presets/ 里的内置预设改版后，下次进酒馆自动重装（以前只在首次安装时装一次，
 *          改了文件用户库里那份永远不变，等于白改）；预设管理框新增「更新内置」按钮可手动强刷
 * v2.9.17：新增「别称」字段（小名 / 外号 / 昵称，多个用「、」隔开）——
 *          写档案时只增不减地并进老档案；正文用别称称呼也算这个角色出场（发送数据、形态切换都认）；
 *          档案列表在名字后面显示别称；三份内置上下文预设与内置字段规范同步加上别称规则
 * v2.9.16：档案详情里每个字段条目都带小锁头——锁住的字段 AI 不改写、手动也点不开编辑；
 *          锁按字段名存，所以模板里多加出来的字段（九段变十段十二段…）同样能单独锁
 * v2.9.15：档案模板瘦身——模板只管「有哪些字段」，字段规范 / 输出格式那些提示词交回上下文预设；
 *          模板新增「新建模板 / 编辑模板」悬浮窗编辑器（方便二创），面板与弹窗都提醒「改模板必须同步改预设」；
 *          「发送数据」里没用的「发给哪几种请求」勾选和预览 / 状态栏位删掉，只留「发送 DNA」一个总开关
 * v2.9.14：手动生成的收录规则改为「用户要求优先 + 判断轻重（轻的也照样建档，只影响详略）」；
 *         ① 按世界书条目生成里的条目列表可以折叠；智绘姬 LLM 页签的模型参数 / 上下文配置 / 上下文历史可折叠并记住状态
 * v2.9.13：服装线并入「组合生成」——①②③ 任意组合，服装不许单独生成。
 * v2.9.12：档案库新增「档案模板」——模板可导出 / 导入 / 切换 / 删除，默认模板内置不可删；
 *         模板决定 AI 输出哪些字段、字段规则、JSON 格式，自动记录与手动生成都跟它走；
 *         老档案换模板后详情里照旧显示多出来的字段。
 * v2.9.11：「发送数据」只留把 DNA 发给 LLM（去掉发送范围）；手动生成三条线整合——世界书 / 角色 / 服装
 *          可以单独生成，也可以「三条一起生成」；AI 回复（实时）加折叠按钮，默认收起，状态记在设置里
 *          （退出再进来还是上次那样）；手机版勾选列表字号缩小、条目名可换行
 * v2.9.10：设置最底部加「保存」；世界书条目加小眼睛（悬浮窗看原文 / 改 / 存回酒馆或智绘姬世界书）；
 *          导入文本支持按 token 分段（「分段生成tokens上限」），一段一次请求；
 *          子页签重排：档案库单独一栏，其余配置归入「自动生成」（扫描层数 / 记录间隔也搬进去了）
 * v2.9.9：折叠功能推倒重做（原来借用了智绘姬本体的折叠类，被本体在 document 上的委托点击又 toggle 一次，
 *         一次点击 toggle 两下 = 点了没反应；现在换成 DNA 自己的类名 + 自己的点击委托 + 自己记状态）
 * v2.9.6：LLM 配置与上下文预设拆成「档案库 / 手动生成」两套（各选各的，互不影响）；
 *         正则 & 测试工具搬进档案库最下面；手动生成新增自己的测试工具（组装/试跑，不写档案）
 * v2.9.5：上下文预设支持导出 / 改名；内置默认预设「昆仑DNA档案记录版 · 九字段」首次安装自动装入
 * v2.9.4：手动生成拆成两条独立的线——只勾世界书能生成、只勾角色也能生成
 * v2.9.3：新增「手动生成 DNA」；预设条目可编辑；档案字段可编辑；LLM 配置独立
 * v2.9.2：界面重做，与智绘姬本体同一套主题变量与组件规范；预设条目改为框内一行一条、可下拉
 * v2.9.1：预设条目可逐条开关；附加配置卡片只留两个开关
 * v2.9.0：新增「上下文预设」卡片——可导入智绘姬格式的上下文预设，DNA 记录按预设条目组装 messages
 * v2.8.0：手机版界面 + 自动认设备；双开关独立；扩展声明依赖智绘姬
 * v2.7.0：发送数据（智绘姬跑 LLM 时把 DNA 塞进它的请求）
 * v2.6.0：只收 AI 输出楼层；附加配置改为读智绘姬 LLM 配置，不再硬编码
 * v2.5.0：接上智绘姬正则，新增测试工具
 * v2.2.0：API 配置直接复用智绘姬 LLM 页签那份，不再单独存一份
 */

import { eventSource, event_types, getRequestHeaders, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';

const MODULE = 'st-chatu8-dna';
const CHATU8 = 'st-chatu8';
const SHARED = '__shared__';
const NO_CARD = '__no_card__';

/* ------------------------------ 默认设置 ------------------------------ */
const DEFAULTS = {
    enabled: true,
    followChar: true,          // 档案跟随当前存档：同一张角色卡的不同存档各一份档案库
    updateExisting: true,      // AI自动更新档案库：同名角色按当前剧情更新
    libStream: true,           // 档案库流式输出：开着能实时看到 AI 写的字；关掉就等整段回来（只影响档案库）
    scanDepth: 3,              // 每次扫最近 N 层
    autoScan: true,            // 自动记录
    autoEvery: 3,              // 每 N 层 AI 回复触发一次
    autoMinChars: 0,           // 最新一层 AI 正文至少 N 字才自动记录；0 = 不限制
    notify: true,
    useRegex: true,            // 发送给 AI 之前先过一遍智绘姬的正则
    /* 界面：auto = 手机用手机版、电脑用电脑版；也可以手动锁定 */
    uiMode: 'auto',
    /* 附加配置：这两项在插件里有自己的开关，和智绘姬 LLM 页签那边的开关互不影响 */
    breakTool: true,           // 用智绘姬「自定义 Tool 工具配置」
    breakTail: true,           // 用智绘姬「末尾多 Role 消息」
    /* 发送数据：智绘姬跑 LLM（出 Tag / Tag 修改…）时，把对应角色的 DNA 一起发过去 */
    sendEnabled: true,
    /* 字段锁：{ 字段名: true }。锁住的字段 AI 不改写、手动也不能编辑。
       按字段名存（不按人物），所以模板里加了新字段也能单独锁。 */
    fieldLocks: {},
    /* 发送字段勾选：{ 字段名: false } 表示这个字段不跟着「发送数据」发出去。
       没记录的字段 = 照常发送，所以默认是空表（全发）。
       只影响「发送数据」这一条路，自动记录那边照旧读全部字段。 */
    sendFields: {},
    /* 别称禁词：这些词不会被录成别称（说的是关系 / 职业，谁都能用，
       正文里出现会同时点亮好几个人）。null = 用内置那套默认词表；
       在「档案库 → 别称禁词」里改过之后就整份存进这里，改完立刻生效。 */
    aliasBan: null,
    replyMaxTokens: 0,         // AI 回复的输出上限（token）；0 = 不设上限（默认不设）
    retryCount: 0,             // 请求失败时自动重试几次；0 = 不重试
    /* 上下文预设：导入一份智绘姬格式的上下文预设，DNA 记录时按它的条目组装 messages。
       不导入或关掉时，还是用下面 batchPrompt 那套内置提示词。 */
    presetEnabled: false,      // 用预设组装提示词
    presetName: '',            // 当前选中的预设名（全局那份；自动生成页签改按角色卡记，见 presetNameByCard）
    presetNameByCard: {},      // 自动生成（lib）的上下文预设按角色卡记：{ cardKey: 预设名 }
    presetLockByCard: {},      // 上下文预设锁：{ cardKey: true }。锁住的卡固定用自己那份预设
    presetMergeSystem: false,  // 把 system 消息合并到最前面一条（默认关：保持预设原本的穿插顺序）
    presets: {},               // 档案库（自动记录）的上下文预设：{ 预设名: { entries, importedAt, source } }
    presetsGen: {},            // 手动生成自己的上下文预设库（和档案库完全分开）
    genPresetName: '',         // 手动生成当前选中的预设名
    genPresetEnabled: false,   // 手动生成用不用预设组装
    genPresetMergeSystem: false, // 手动生成把 system 合并到开头一条
    genPresetSeeded: false,    // 是否已做过「把档案库预设复制一份给手动生成」的一次性迁移
    seedPreset: '',            // 内置默认预设（档案库那份）装过没有（存文件名，装过就不再自动装）
    seedGenPreset: '',         // 内置默认预设（手动生成那份）装过没有
    seedPresetVer: '',         // 已装的那份内置预设是哪个版本（内置预设改版后自动重装一次）
    seedGenPresetVer: '',
    /* 折叠状态：{ libAI, libLLM, libPreset, genAI, genLLM, genPreset } → true = 收起。
       DNA 自己记，不借智绘姬那套折叠状态（两边混用会互相打架）。 */
    folds: {},
    /* LLM 配置：DNA 自己记一份选中的配置名。只读智绘姬那份配置列表，
       不写回智绘姬的 current_llm_profile，两边各选各的。 */
    llmProfile: '',            // 档案库（自动记录）用哪份 LLM 配置
    llmProfileGen: '',         // 手动生成用哪份 LLM 配置（和档案库分开选）
    /* 手动生成：勾世界书条目 + 勾角色 → 生成 DNA */
    genSource: 'st',           // st = 酒馆世界书（书 + 条目）；chatu8 = 智绘姬世界书（条目列表）
    genBook: '',               // 选中的酒馆世界书名
    genBookFollowCard: true,   // 进入角色卡时把世界书自动切到这张卡的主世界书（手动选书会关掉它）
    genEntries: [],            // 勾选的条目：st 存 '书::uid'，chatu8 存条目名
    genChars: [],              // 勾选的智绘姬「角色管理」角色预设名
    genOutfits: [],            // 勾选的智绘姬「服装」服装预设名
    dnaTemplate: '',           // 当前用的档案模板名（'' = 内置默认模板）
    dnaTemplates: {},          // 导入的档案模板：{ 模板名: { fields, rules, format, importedAt } }（全卡共用）
    dnaTemplatesByCard: {},    // 每个角色卡 / 会话各用哪份模板：{ cardKey: 模板名 }（'' = 默认模板）
    dnaTplLock: {},            // 模板锁：{ cardKey: true }。锁住的卡固定用自己那份模板，下拉框不能改
    genExtraChars: [],         // 手动补进去的角色名
    genInstruction: '',        // 额外要求（可留空）
    genTxtName: '',            // 导入的 txt 文件名（正文只在内存里，不落盘）
    genTxtChunk: 3000,         // 分段生成tokens上限：一条请求最多吃多少 token；0 = 不分段
    genTxtPart: 0,             // 0 = 全部段依次生成；1..N = 只生成第 N 段
    records: {},               // 内置存储：{ 卡片key: { card, entries: { 角色名: 档案 } } }
    /* 同人资料库：内置库是插件里的一份静态文件（1130 条，不塞进 settings），
       这里只存「用户改了什么」——编辑覆盖 / 新增 / 删除 / 勾选 / 额外要求。 */
    ranobe: null,              // 结构见 loadSettings 里的 normLib
    ranobeBuiltinSrc: 'zip',   // 内置库来源：'zip' = 插件自带的分类条目包，'custom' = 用户导入的那份（存 IndexedDB）
    wbLib: null,               // 按世界书生成：同样一套（数据源是当前角色卡世界书）
    presetsRanobe: {},         // 同人库 / 世界书页签共用的上下文预设库
    ranobePresetName: '',      // 当前选中的同人预设名
    ranobePresetEnabled: false,// 用预设组装（否则用内置 batchPrompt）
    ranobePresetMergeSystem: false,
    seedRanobePreset: '',      // 内置同人预设装过没有
    seedRanobePresetVer: '',
    llmProfileRanobe: '',      // 同人库用哪份 LLM 配置（空 = 跟着手动生成）
};

/* 这几块默认收起（第一次进来看到的是收起状态）；没列在这里的块默认展开。
   状态本身存在 S.folds 里，退出再进来照旧——「上次是展开，下次还是展开」。 */
const FOLD_DEFAULT_FOLDED = { libAI: true, genAI: true, ranobeAI: true, archBan: false };

/* 旧版本里插件自己存过一份 API 配置，现在统一用智绘姬那份，这些键直接丢掉 */
const LEGACY_KEYS = ['worldbookName', 'useChatu8LLM', 'apiFormat', 'apiUrl', 'apiKey', 'model', 'modelCache', 'temperature', 'maxTokens'];

let S = loadSettings();
/* 老版本导入的预设末尾停在闭合标签（</task> 之类），模型会认为文档已结束，直接不输出。
   这里给这种预设补一条「开始任务」触发语，补过就打标记，只补一次。 */
const START_TRIGGER = `开始任务。

[system@linux-kernel ~]$ dna-engine --extract --strict --json
# 现在开始输出：先 <director_thinking>，再 <dna_archives>，不要复述规则。`;
function patchPresetStart() {
    let changed = false;
    for (const n of Object.keys(S.presets || {})) {
        const p = S.presets[n];
        if (!p || p.startPatched) continue;
        const list = Array.isArray(p.entries) ? p.entries : null;
        if (!list || !list.length) continue;
        const hasStart = list.some((e) => String((e && e.name) || '').indexOf('开始任务') >= 0);
        const lastOn = [...list].reverse().find((e) => e && e.enabled !== false);
        const tail = String((lastOn && lastOn.content) || '').trim();
        /* 末尾只剩闭合标签 → 缺开工指令 */
        const closedOnly = /^<\/(task|DNA记录|dna_archives|payload_tag)>/i.test(tail)
            || /<\/(task|DNA记录|dna_archives)>$/i.test(tail);
        if (hasStart || !closedOnly) continue;
        list.push({
            id: 'dna_start', name: '开始任务', role: 'user', content: START_TRIGGER,
            enabled: true, triggerMode: 'always', triggerWords: '', andTriggerWords: ''
        });
        p.entries = list;
        p.startPatched = true;
        changed = true;
    }
    return changed;
}
try {
    if (patchPresetStart()) saveSettingsDebounced();
} catch (e) { /* 忽略 */ }
/* 老版本留在设置里的 API 配置字段（apiUrl/apiKey/model/apiFormat/modelCache…）立刻落盘清掉，
   免得 settings.json 里一直躺着一份用不到的配置 */
try {
    extension_settings[MODULE] = S;
    saveSettingsDebounced();
} catch (e) { /* 忽略：扩展加载早期可能还没就绪 */ }
let scanning = false;
let lastAutoFloor = 0;
let selected = null;           // 当前在详情区查看的角色名
let viewingHist = '';          // 详情区里正展开看的那份历史存档：「角色名#序号」（'' = 都收起）
let searchTerm = '';           // 档案库搜索词（只存在内存里，不落盘）
let editingEntry = -1;         // 当前展开编辑的预设条目下标（-1 = 没开）
let editingScope = 'lib';      // 预设条目编辑框属于哪一套（lib / gen）
const LOG = [];

/* ------------------------------ 设置读写 ------------------------------ */
function loadSettings() {
    const saved = (extension_settings && extension_settings[MODULE]) || {};
    const out = {};
    for (const k in DEFAULTS) out[k] = (saved[k] === undefined || saved[k] === null) ? DEFAULTS[k] : saved[k];
    /* 老版本遗留字段，直接丢掉 */
    for (const k of LEGACY_KEYS) delete out[k];
    if (!out.records || typeof out.records !== 'object' || Array.isArray(out.records)) out.records = {};
    delete out.sendTargets;      // 发送范围设置已删掉（现在所有请求类型都发）
    if (!out.fieldLocks || typeof out.fieldLocks !== 'object' || Array.isArray(out.fieldLocks)) out.fieldLocks = {};
    if (!out.sendFields || typeof out.sendFields !== 'object' || Array.isArray(out.sendFields)) out.sendFields = {};
    /* 发送数据的上限单位从「字」改成「token」，老字段丢掉直接用新默认 */
    delete out.sendMaxChars;
    delete out.sendMaxTokens;   // 请求长度不再设上限，老字段清掉
    out.retryCount = clampInt(out.retryCount, 0, 5, 0);
    if (typeof out.libStream !== 'boolean') out.libStream = true;
    /* AI 回复上限：0 = 不设上限（默认就是 0）；老版本没这字段时也给 0 */
    out.replyMaxTokens = clampInt(out.replyMaxTokens, 0, 200000, 0);
    /* 最新一层正文的字数门槛：0 = 不看字数，照旧按楼层数触发 */
    out.autoMinChars = clampInt(out.autoMinChars, 0, 100000, 0);
    /* 发送范围设置已删掉：只保留「把正文里出场角色的 DNA 发给 LLM」这一种行为 */
    delete out.sendMode;
    if (!out.presets || typeof out.presets !== 'object' || Array.isArray(out.presets)) out.presets = {};
    if (!out.presetsGen || typeof out.presetsGen !== 'object' || Array.isArray(out.presetsGen)) out.presetsGen = {};
    if (typeof out.genPresetName !== 'string') out.genPresetName = '';
    if (typeof out.genPresetEnabled !== 'boolean') out.genPresetEnabled = false;
    if (typeof out.genPresetMergeSystem !== 'boolean') out.genPresetMergeSystem = false;
    if (typeof out.genPresetSeeded !== 'boolean') out.genPresetSeeded = false;
    if (typeof out.presetName !== 'string') out.presetName = '';
    if (!out.presetNameByCard || typeof out.presetNameByCard !== 'object' || Array.isArray(out.presetNameByCard)) out.presetNameByCard = {};
    if (!out.presetLockByCard || typeof out.presetLockByCard !== 'object' || Array.isArray(out.presetLockByCard)) out.presetLockByCard = {};
    if (typeof out.seedPreset !== 'string') out.seedPreset = '';
    if (typeof out.seedGenPreset !== 'string') out.seedGenPreset = '';
    if (typeof out.seedPresetVer !== 'string') out.seedPresetVer = '';
    if (typeof out.seedGenPresetVer !== 'string') out.seedGenPresetVer = '';
    if (!out.folds || typeof out.folds !== 'object' || Array.isArray(out.folds)) out.folds = {};
    /* 默认收起的块显式写进设置：用户点开过（true→false）就一直记着是展开 */
    for (const fk of Object.keys(FOLD_DEFAULT_FOLDED)) {
        if (!(fk in out.folds)) out.folds[fk] = !!FOLD_DEFAULT_FOLDED[fk];
    }
    if (!Array.isArray(out.genOutfits)) out.genOutfits = [];
    /* 别称禁词：null = 内置默认那套；存坏了就当没改过 */
    if (out.aliasBan != null) {
        if (!Array.isArray(out.aliasBan)) out.aliasBan = null;
        else out.aliasBan = out.aliasBan.map((w) => String(w == null ? '' : w).trim()).filter(Boolean);
    }
    if (typeof out.dnaTemplate !== 'string') out.dnaTemplate = '';
    if (!out.dnaTemplates || typeof out.dnaTemplates !== 'object' || Array.isArray(out.dnaTemplates)) out.dnaTemplates = {};
    if (!out.dnaTemplatesByCard || typeof out.dnaTemplatesByCard !== 'object' || Array.isArray(out.dnaTemplatesByCard)) out.dnaTemplatesByCard = {};
    if (!out.dnaTplLock || typeof out.dnaTplLock !== 'object' || Array.isArray(out.dnaTplLock)) out.dnaTplLock = {};
    /* 选中的模板被删掉 / 存坏了 → 退回内置默认模板 */
    if (out.dnaTemplate && !out.dnaTemplates[out.dnaTemplate]) out.dnaTemplate = '';
    if (!['auto', 'desktop', 'mobile'].includes(out.uiMode)) out.uiMode = 'auto';
    /* v2.9.3 新增：LLM 配置独立 + 手动生成的选择 */
    if (typeof out.llmProfile !== 'string') out.llmProfile = '';
    if (typeof out.llmProfileGen !== 'string') out.llmProfileGen = '';
    if (out.genSource !== 'chatu8') out.genSource = 'st';
    if (typeof out.genBook !== 'string') out.genBook = '';
    if (typeof out.genBookFollowCard !== 'boolean') out.genBookFollowCard = true;
    if (typeof out.genInstruction !== 'string') out.genInstruction = '';
    if (typeof out.genTxtName !== 'string') out.genTxtName = '';
    out.genTxtChunk = clampInt(out.genTxtChunk, 0, 200000, 3000);
    out.genTxtPart = clampInt(out.genTxtPart, 0, 9999, 0);
    for (const k of ['genEntries', 'genChars', 'genExtraChars']) {
        if (!Array.isArray(out[k])) out[k] = [];
        else out[k] = out[k].filter((x) => typeof x === 'string' && x.trim());
    }
    /* 同人资料库 / 按世界书生成：两套结构一样的用户层（内置本体是插件里的静态文件） */
    const normLib = (v, withVer) => {
        const o = (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
        const strs = (x) => (Array.isArray(x) ? x.filter((y) => typeof y === 'string' && y) : []);
        const rec = {
            edits: (o.edits && typeof o.edits === 'object' && !Array.isArray(o.edits)) ? Object.assign({}, o.edits) : {},
            added: (Array.isArray(o.added) ? o.added : []).filter((x) => x && typeof x === 'object').map((x) => Object.assign({}, x)),
            deleted: strs(o.deleted),
            sel: strs(o.sel),
            req: typeof o.req === 'string' ? o.req : '',
            q: typeof o.q === 'string' ? o.q : '',
            wiped: o.wiped === true
        };
        if (withVer) rec.v = typeof o.v === 'string' ? o.v : '';
        return rec;
    };
    out.ranobe = normLib(out.ranobe, true);
    out.wbLib = normLib(out.wbLib, false);
    /* 内置库来源只认这两个值；老版本没这个字段，一律回落到插件自带 */
    if (out.ranobeBuiltinSrc !== 'custom') out.ranobeBuiltinSrc = 'zip';
    if (!out.presetsRanobe || typeof out.presetsRanobe !== 'object' || Array.isArray(out.presetsRanobe)) out.presetsRanobe = {};
    for (const k of ['ranobePresetName', 'seedRanobePreset', 'seedRanobePresetVer', 'llmProfileRanobe']) {
        if (typeof out[k] !== 'string') out[k] = '';
    }
    for (const k of ['ranobePresetEnabled', 'ranobePresetMergeSystem']) {
        if (typeof out[k] !== 'boolean') out[k] = false;
    }
    return out;
}

function saveSettings(silent) {
    extension_settings[MODULE] = S;
    saveSettingsDebounced();
    if (!silent) toast('设置已保存');
}

/* ------------------------------ 小工具 ------------------------------ */
function esc(s) {
    return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function toast(msg, type) {
    try {
        const t = globalThis.toastr;
        if (t) { (type === 'error' ? t.error : t.success)(msg, '档案库', { timeOut: 3200 }); return; }
    } catch (e) { /* ignore */ }
    console.log('[DNA]', msg);
}

function log(msg, level) {
    const line = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    LOG.push(line);
    if (LOG.length > 300) LOG.splice(0, LOG.length - 300);
    if (level === 'error') console.error('[DNA]', msg); else console.log('[DNA]', msg);
    renderLog();
}

function renderLog() {
    const box = document.querySelector('#dna-tab [data-dna="log"]');
    if (!box) return;
    box.innerHTML = LOG.slice(-160).map((l) => '<div class="dna-log-line">' + esc(l) + '</div>').join('');
    box.scrollTop = box.scrollHeight;
}

function numOr(v, dflt) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : dflt;
}

function clampInt(v, min, max, dflt) {
    let n = parseInt(v, 10);
    if (!Number.isFinite(n)) n = dflt;
    return Math.min(max, Math.max(min, n));
}

function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return (d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/* ------------------------------ 角色卡上下文 ------------------------------ */
function currentCard() {
    const ctx = getContext();
    const ch = (ctx.characters || [])[ctx.characterId];
    if (ch) return ch;
    if (ctx.groupId) {
        const g = (ctx.groups || []).find((x) => x.id === ctx.groupId);
        if (g) return { name: g.name, isGroup: true, avatar: 'group:' + g.id };
    }
    return null;
}

/* 当前聊天存档的标识：同一张角色卡开几个存档，就是几份独立的档案库。
   优先用酒馆给的 chatId（存档文件名），老版本没有就问角色对象上的 chat，
   再拿不到就退回「按角色卡分库」的老行为，绝不因此让档案库消失。 */
function chatStoreId() {
    try {
        const ctx = getContext() || {};
        if (typeof ctx.chatId === 'string' && ctx.chatId) return ctx.chatId;
        if (typeof ctx.getCurrentChatId === 'function') {
            const v = ctx.getCurrentChatId();
            if (v) return String(v);
        }
        if (ctx.groupId) {
            const g = (ctx.groups || []).find((x) => x.id === ctx.groupId);
            if (g && g.chat_id) return String(g.chat_id);
        }
        const ch = (ctx.characters || [])[ctx.characterId];
        if (ch && typeof ch.chat === 'string' && ch.chat) return ch.chat;
        if (ctx.chat_metadata && ctx.chat_metadata.chat_id) return String(ctx.chat_metadata.chat_id);
    } catch (e) { /* 取不到就按角色卡分库 */ }
    return '';
}

/* 存档名的尾巴：chatId 一般是「角色名 - 2024-1-1 @12h 30m」，显示时间那半截就够了 */
function shortChatName(id) {
    const t = String(id || '');
    const k = t.lastIndexOf(' - ');
    const tail = (k >= 0 ? t.slice(k + 3) : t).trim();
    return tail.length > 24 ? (tail.slice(0, 24) + '…') : tail;
}

/* 角色卡这一层（不含存档）的键 */
function cardBaseKey() {
    if (!S.followChar) return SHARED;
    const ctx = getContext();
    if (ctx.groupId) {
        const g = (ctx.groups || []).find((x) => x.id === ctx.groupId);
        return 'group:' + (g ? g.name : ctx.groupId);
    }
    const ch = (ctx.characters || [])[ctx.characterId];
    if (ch && ch.avatar) return ch.avatar;
    if (ch && ch.name) return 'char:' + ch.name;
    return NO_CARD;
}

/* 档案库的键 = 角色卡 + 当前存档；同一个存档反复进出始终是同一份库 */
function cardKey() {
    const base = cardBaseKey();
    if (!S.followChar || base === SHARED) return base;
    const chat = chatStoreId();
    return chat ? (base + '::' + chat) : base;
}

function cardLabel() {
    if (!S.followChar) return '共用档案库';
    const ctx = getContext();
    let name;
    if (ctx.groupId) {
        const g = (ctx.groups || []).find((x) => x.id === ctx.groupId);
        name = '群聊：' + (g ? g.name : '未命名');
    } else {
        const ch = (ctx.characters || [])[ctx.characterId];
        name = (ch && ch.name) ? ch.name : '未选择角色卡';
    }
    const chat = chatStoreId();
    const tail = chat ? shortChatName(chat) : '';
    return tail ? (name + ' · ' + tail) : name;
}

/* 老版本按角色卡共用一个库。改成按存档分库后，第一次进某个存档时把老库复制过来；
   老库本身原样留着，并打上 _claimed 标记——同一个老库只认领一次，其它存档拿到的是空库。 */
function adoptLegacyLibrary(k) {
    if (!S.followChar) return null;
    const key = String(k || '');
    const cut = key.indexOf('::');
    if (cut <= 0) return null;
    const base = key.slice(0, cut);
    const old = S.records[base];
    if (!old || !old.entries || typeof old.entries !== 'object') return null;
    if (old._claimed) return null;
    if (!Object.keys(old.entries).length) return null;
    const copy = JSON.parse(JSON.stringify(old));
    copy.card = cardLabel();
    copy.updated = Date.now();
    copy._fromLegacy = true;
    old._claimed = true;
    return copy;
}

/* 角色卡自身的设定，作为人物底子交给模型（不读世界书） */
function cardOrigins() {
    const ch = currentCard();
    if (!ch || ch.isGroup) return [];
    const parts = [];
    if (ch.description) parts.push('【角色设定】\n' + ch.description);
    if (ch.personality) parts.push('【性格】\n' + ch.personality);
    if (ch.scenario) parts.push('【场景】\n' + ch.scenario);
    if (!parts.length) return [];
    let content = parts.join('\n\n');
    if (content.length > 6000) content = content.slice(0, 6000) + '\n……（已截断）';
    return [{ name: ch.name || '当前角色', content }];
}

/* ------------------------------ 内置存储 ------------------------------ */
function bucket(key, create) {
    const k = key || cardKey();
    let b = S.records[k];
    if (!b) {
        const legacy = adoptLegacyLibrary(k);
        if (legacy) {
            S.records[k] = legacy;
            b = legacy;
            log('老档案库已复制给当前存档：' + cardLabel() + '（老库原样保留）');
            saveSettings(true);
        }
    }
    if (!b && create) {
        b = { card: cardLabel(), entries: {}, updated: 0 };
        S.records[k] = b;
    }
    if (!b) return null;
    if (!b.entries || typeof b.entries !== 'object') b.entries = {};
    return b;
}

function currentEntries() {
    const b = bucket(cardKey(), false);
    return (b && b.entries) || {};
}

function countAll() {
    let n = 0;
    for (const k in S.records) {
        const e = S.records[k] && S.records[k].entries;
        if (e) n += Object.keys(e).length;
    }
    return n;
}

/* -------------------- 多形态兜底：一条档案里写了好几种外形 -------------------- */
/* AI 经常图省事，把「平时黑发洋装，变身后粉发战斗服」塞进同一条档案的同一字段里。
   这样档案库里就只有一条，出图时两种外形会打架。这里把它拆成多条。
   只在「明确写了两种外形」时才拆，判断不出就原样保留，不瞎猜。 */

/* 字段里出现这些词，说明这条档案在描述多个形态 */
const FORM_HINT_RE = /(变身后|变身时|战斗形态|常态|日常形态|另一种形态|化身|觉醒后|觉醒形态|黑化|暴走|第二形态|第三形态|人形态|兽形态|原形|伪装时|平时|日常| ordinarily|alternate form)/;

/* 从一段文字里按「；」/「。」/换行 切成小句 */
function splitClauses(v) {
    return String(v || '').split(/[；;\n]+/).map((x) => x.trim()).filter(Boolean);
}

/* 从一条档案里拆出多个形态。
   返回 null 表示「不是多形态，原样处理」；返回数组表示拆成多条。 */
function splitFormsFromRecord(profile) {
    const name = String(profile['姓名'] || '').trim();
    if (!name) return null;
    const fi = formInfo(name);
    /* 姓名里已经有形态名 → 本来就是分开的，不用拆 */
    if (fi.form) return null;

    /* 找「写了两种外形」的字段：同一字段被「；」分开，且两段都像外貌/服装描述 */
    const LOOK_KEYS = ['外貌特征', '当前衣着/装扮'];
    const found = [];
    for (const k of LOOK_KEYS) {
        const v = String(profile[k] || '');
        if (!v) continue;
        const clauses = splitClauses(v);
        if (clauses.length < 2) continue;
        /* 至少有 2 段各自像独立的外形描述 */
        const looks = clauses.filter((c) => wbHasLook(c).any);
        if (looks.length < 2) continue;
        found.push({ key: k, clauses });
    }
    if (!found.length) return null;

    /* 还要有「形态」的明确信号，否则可能只是罗列多件衣服 */
    const wholeText = Object.keys(profile).map((k) => String(profile[k] || '')).join(' ');
    const hasHint = FORM_HINT_RE.test(wholeText);
    if (!hasHint) return null;

    /* 拆：把每个字段的第 i 段归到第 i 个形态。
       段数不一致时，多出来的段并到最后一个形态，避免丢信息。 */
    const maxN = Math.max(...found.map((f) => f.clauses.length));
    if (maxN < 2 || maxN > 4) return null;   /* 超过 4 个形态明显是误判，不动 */

    const out = [];
    for (let i = 0; i < maxN; i++) {
        const p = { '姓名': '' };
        for (const k of Object.keys(profile)) {
            if (k === '姓名' || k === '本名') continue;
            p[k] = profile[k];
        }
        /* 被拆的字段取第 i 段 */
        for (const f of found) {
            const seg = f.clauses[Math.min(i, f.clauses.length - 1)];
            p[f.key] = seg;
        }
        out.push(p);
    }
    /* 把猜到的形态名一起带出去，saveProfile 起名时用 */
    out._names = out.map((p) => {
        for (const f of found) { const g = guessFormName(p[f.key]); if (g) return g; }
        return '';
    });
    return out;
}

/* 从一段外形描述里猜形态名：能猜到就用它，猜不到返回空串。
   例：「变身后粉发」→ 变身；「兽形态银白毛发」→ 兽化；「觉醒后金发竖瞳」→ 觉醒 */
const FORM_NAME_HINTS = [
    [/变身后|变身时/, '变身'],
    [/觉醒后|觉醒形态/, '觉醒'],
    [/兽形态|兽化|化身成兽/, '兽化'],
    [/人形态|人类形态/, '人形'],
    [/战斗形态|战斗服|战斗时/, '战斗'],
    [/黑化|暴走/, '黑化'],
    [/第二形态/, '第二形态'],
    [/第三形态/, '第三形态'],
    [/伪装/, '伪装'],
    [/日常形态|常态|平时|日常/, '日常']
];

function guessFormName(text) {
    const t = String(text || '');
    if (!t) return '';
    for (const pair of FORM_NAME_HINTS) { if (pair[0].test(t)) return pair[1]; }
    return '';
}

/* 写入一个角色：自动处理「一条档案里写了好几种外形」的情况。
   返回 { results: [{name, r}], created, updated, skipped, locked, failed, split } */
/* 把档案名规范成标准形态格式：
   爱丽丝（魔法少女形态）→ 爱丽丝·魔法少女[当前]
   爱丽丝·魔法少女 → 爱丽丝·魔法少女[当前]
   爱丽丝 → 爱丽丝（不动）
   已经有 [当前]/[非当前] 标记的原样保留。 */
function normalizeFormName(name, tagIfMissing) {
    const fi = formInfo(name);
    if (!fi.form) return String(name || '').trim();
    /* 已有标记就不动 */
    if (fi.tag) return String(name || '').trim();
    /* 没标记时：同批里已经有 [当前] 了，这条就当 [非当前]，避免两条抢同一个位置 */
    return fi.base + '·' + fi.form + '[' + (tagIfMissing || '当前') + ']';
}

function saveProfile(profile, floor) {
    const parts = splitFormsFromRecord(profile);
    const list = parts && parts.length > 1 ? parts : [profile];
    const out = { results: [], created: 0, updated: 0, skipped: 0, locked: 0, failed: 0, split: list.length > 1 };
    /* 同一角色的 [当前] 只能有一个。
       注意 saveProfile 是逐条调用的，同批信息拿不到，所以直接查档案库：
       这个本名已经有一条 [当前] 了，新的形态就只能当 [非当前]。 */
    const batchBase = formInfo(String(profile['姓名'] || '')).base;
    let curTaken = (formGroups().get(batchBase) || []).some((x) => x.info.isCurrent);
    for (let i = 0; i < list.length; i++) {
        const p = list[i];
        /* 拆出来的多条要给名字：优先用能看懂的形态名，猜不到才退回「原形/N」 */
        if (out.split) {
            const base = String(profile['姓名'] || '').trim();
            let fname = (parts && parts._names && parts._names[i]) || '';
            if (!fname) fname = (i === 0 ? '原形' : '形态' + (i + 1));
            p['姓名'] = base + '·' + fname + (i === 0 ? '[当前]' : '[非当前]');
            p['本名'] = i === 0 ? base : '';
        }
        /* 姓名规范成标准形态格式，档案库里看起来才整齐 */
        const fixed = normalizeFormName(p['姓名'], curTaken ? '非当前' : '当前');
        if (fixed && fixed !== String(p['姓名'] || '').trim()) {
            p['姓名'] = fixed;
            const nf = formInfo(fixed);
            if (nf.form && nf.isCurrent) {
                curTaken = true;
                if (!String(p['本名'] || '').trim()) p['本名'] = nf.base;
            }
        }
        const nm = String(p['姓名'] || '').trim();
        const r = saveRecord(p, floor);
        out.results.push({ name: nm, r });
        if (r === 'created') out.created++;
        else if (r === 'updated') out.updated++;
        else if (r === 'locked') out.locked++;
        else if (r === 'failed') out.failed++;
        else out.skipped++;
    }
    return out;
}

/* ------------------------------ 更新留档（角色 DNA 历史存档） ------------------------------ */
/* 一个角色每被更新一次（自动记录 / 手动生成 / 同人库生成，三条路都汇到 saveRecord），
   就把「更新前的那一版」压进这条档案自己的 _hist 里，只留最近 3 份，随时能回档。
   存在档案身上（而不是另开一张表），改名 / 复制档案 / 导出导入都跟着走。 */
const HIST_MAX = 3;

/* 拍一份快照：把 _hist 自己剔除，不然会越存越深（历史里的历史里的历史） */
function snapshotRecord(rec) {
    const c = {};
    for (const k of Object.keys(rec || {})) {
        if (k === '_hist') continue;
        c[k] = rec[k];
    }
    return c;
}

/* 两版档案按当前模板的字段比一遍：一个字都没变就当没更新，不留档。
   （AI 有时候会把同一份内容重复写一遍，不拦的话 3 份历史几下就被空写冲光了） */
function recordSame(oldRec, newRec) {
    for (const k of tplFields()) {
        if (k === '姓名') continue;
        const a = String(oldRec[k] == null ? '' : oldRec[k]);
        const b = String(newRec[k] == null ? '' : newRec[k]);
        if (a !== b) return false;
    }
    return true;
}

function recordHistory(name) {
    const rec = currentEntries()[name];
    return (rec && Array.isArray(rec._hist)) ? rec._hist : [];
}

/* 回档：把这一版原样写回档案。当前这一版也会被压进历史，所以点错了还能再回回来。 */
function restoreHistory(name, idx) {
    const b = bucket(cardKey(), true);
    if (!b) return false;
    const rec = b.entries[name];
    if (!rec) return false;
    const hist = Array.isArray(rec._hist) ? rec._hist : [];
    const snap = hist[idx];
    if (!snap) return false;
    const out = { '姓名': name };
    for (const k of Object.keys(snap)) {
        /* 锁 / 强制发送是「现在的状态」，不跟着旧版本一起退回去 */
        if (k === '_hist' || k === '_locked' || k === '_forceSend') continue;
        out[k] = snap[k];
    }
    if (rec._locked) out._locked = true;
    if (rec._forceSend) out._forceSend = true;
    out._updated = snap._updated || Date.now();
    out._floor = snap._floor || '';
    out._hist = [snapshotRecord(rec)].concat(hist.filter((x, i) => i !== idx)).slice(0, HIST_MAX);
    b.entries[name] = out;
    b.card = cardLabel();
    b.updated = Date.now();
    saveSettings(true);
    return true;
}

/* 写入 / 更新一个角色 */
function saveRecord(profile, floor) {
    let name = String(profile['姓名'] || '').trim();
    if (!name) return 'skipped';
    const b = bucket(cardKey(), true);
    const fi = formInfo(name);
    /* 形态档案：同一角色同一形态只留一条。标记变了（[当前] ↔ [非当前]）也算同一条，
       以这次的新内容为准，旧名字那条退场，避免同一个形态在库里出现两份。
       v2.9.29：AI 换一种写法（「A」/「A [当前]」/「A（当前）」/「A·原形[当前]」）也是同一个人的同一个形态，
       不能当成新角色再建一条——以前只认「本名·形态名」精确相等，所以库里会冒出两个 A。 */
    const nameKey = (n) => {
        const o = formInfo(n);
        return o.base.replace(/\s+/g, '') + '·' + String(o.form || '').replace(/\s+/g, '');
    };
    const myKey = nameKey(name);
    let sameName = '';
    /* 精确同名由下面的 b.entries[name] 处理；这里只管「名字写法不同但其实是同一个人」 */
    if (!b.entries[name]) {
        /* ① 本名 + 形态名都一样（不管 [当前]/[非当前] 标记）→ 同一条 */
        sameName = Object.keys(b.entries).find((k) => nameKey(k) === myKey) || '';
        if (!sameName && !fi.form) {
            /* ② 这次没写形态名、只多了个标记：库里那条纯本名就是它 */
            sameName = Object.keys(b.entries).find((k) => {
                const o = formInfo(k);
                return o.base === fi.base && !o.form;
            }) || '';
        }
        if (!sameName && !fi.form) {
            /* ③ 库里本体已经被写成「A·原形[当前]」这种默认形态名 → 也认它，
               不然 AI 下次只写「A」就又冒出一条 */
            sameName = Object.keys(b.entries).find((k) => {
                const o = formInfo(k);
                return o.base === fi.base && (o.form === '原形' || o.form === '本体');
            }) || '';
        }
        /* 只是多了个标记、没有真正的形态名：名字保持库里那条的原样，
           别把好好的「A」改成「A [当前]」这种没意义的写法 */
        /* 本次没有真正的形态名：命中纯本名 → 用回原名；命中的是「·原形」这种默认包装 → 归一成纯本名，
           免得库里留下「A [当前]」这种没意义的写法 */
        if (sameName && !fi.form) name = formInfo(sameName).form ? fi.base : sameName;
    }
    const old = b.entries[name] || (sameName ? b.entries[sameName] : null);
    /* 锁定的档案：AI 一律不许改（自动记录 / 手动生成都会走到这里被挡住） */
    if (old && old._locked) return 'locked';
    if (old && !S.updateExisting) return 'skipped';
    /* 保留旧模板/自定义模板留下的字段，避免换模板后下一次 AI 更新静默删数据。 */
    const currentFields = new Set(tplFields());
    const rec = { '姓名': name };
    if (old) {
        for (const k of Object.keys(old)) {
            if (k === '姓名' || k[0] === '_' || currentFields.has(k)) continue;
            rec[k] = old[k];
        }
    }
    for (const k of tplFields()) {
        if (k === '姓名') continue;
        rec[k] = profile[k] || '';
        /* 别称只增不减：老档案里记下的小名，AI 这轮没提到也不能丢 */
        if (old && k === ALIAS_FIELD) rec[k] = aliasMerge(old[k], rec[k]);
        /* 这个字段被锁住 → 一律照抄老值。老值是空的就保持空：
           以前要求"老值非空"才锁，结果是空字段锁了照样能被 AI 填进去 */
        if (old && fieldLocked(name, k)) rec[k] = String(old[k] == null ? '' : old[k]);
    }
    /* 强制发送是用户自己勾的，AI 更新档案时不能丢 */
    if (old && old._forceSend) rec._forceSend = true;
    rec._updated = Date.now();
    rec._floor = floor || '';
    /* 留档：这次真有改动才把「上一版」压进历史；内容一模一样就不留（免得空写把 3 份冲掉） */
    const prevHist = (old && Array.isArray(old._hist))
        ? old._hist.filter((x) => x && typeof x === 'object')
        : [];
    if (old && !recordSame(old, rec)) rec._hist = [snapshotRecord(old)].concat(prevHist).slice(0, HIST_MAX);
    else if (prevHist.length) rec._hist = prevHist.slice(0, HIST_MAX);
    if (sameName && b.entries[sameName]) {
        moveFieldLocks(sameName, name);
        delete b.entries[sameName];
    }
    b.entries[name] = rec;
    b.card = cardLabel();
    b.updated = Date.now();
    /* 新的这条是 [当前] → 同组其它 [当前] 自动让位 */
    if (fi.isForm && fi.isCurrent) enforceOneCurrent(fi.base, name);
    return old ? 'updated' : 'created';
}

/* 点「回档」：确认后把档案写回那一版（当前这版进历史，等于可撤销） */
function onHistRestore(name, idx) {
    const hist = recordHistory(name);
    const snap = hist[idx];
    if (!snap) { toast('这份存档已经不在了', 'error'); return false; }
    if (isLocked(name)) { toast('「' + name + '」已锁定，先点小锁解锁再回档', 'error'); return false; }
    const when = fmtTime(snap._updated) || '（没有时间）';
    if (!confirm('把「' + name + '」回档到 ' + when + ' 那一版？\n\n当前这一版会留在历史里（点错了还能再回回来），历史最多存 ' + HIST_MAX + ' 份。')) return false;
    if (!restoreHistory(name, idx)) { toast('回档失败，这份存档可能已经不在了', 'error'); return false; }
    selected = name;
    viewingHist = '';
    renderList();
    toast('已回档「' + name + '」到 ' + when + ' 那一版');
    log('回档：' + name + ' → 存档 ' + (idx + 1) + '（' + when + '）');
    return true;
}

/* ------------------------------ 档案锁 ------------------------------ */
/* 锁住 = AI 不许改这条档案：自动记录和手动生成都会跳过它，正文里的增量更新也不会动它。
   只约束 AI；你自己在详情里编辑之前会先让你解锁（点小锁即可）。 */
function isLocked(name) {
    const rec = currentEntries()[name];
    return !!(rec && rec._locked);
}

function setLock(name, on) {
    const rec = currentEntries()[name];
    if (!rec) return false;
    if (on) rec._locked = true; else delete rec._locked;
    saveSettings(true);
    return true;
}

/* 强制发送：勾上以后，每次发送数据都会把这条档案一起带上，
   不看正文里有没有提到它（原来的规则是只发「这一轮出场的角色」）。 */
function isForceSend(name) {
    const rec = currentEntries()[name];
    return !!(rec && rec._forceSend);
}

function setForceSend(name, on) {
    const rec = currentEntries()[name];
    if (!rec) return false;
    if (on) rec._forceSend = true; else delete rec._forceSend;
    saveSettings(true);
    return true;
}

function toggleForceSend(name) {
    if (!name) return false;
    const next = !isForceSend(name);
    if (!setForceSend(name, next)) return false;
    log(next ? ('已开启「' + name + '」的强制发送：以后每次发送都会带上它')
        : ('已关闭「' + name + '」的强制发送'));
    toast(next ? ('「' + name + '」以后每次发送都会带上') : ('「' + name + '」不再强制发送'));
    renderList();
    return true;
}

function toggleLock(name) {
    if (!name) return false;
    const next = !isLocked(name);
    if (!setLock(name, next)) return false;
    log(next ? ('已锁定「' + name + '」，AI 不会再改它') : ('已解锁「' + name + '」，AI 可以继续更新'));
    toast(next ? ('已锁定「' + name + '」') : ('已解锁「' + name + '」'));
    renderList();
    return true;
}

function setAllLocks(on) {
    const entries = currentEntries();
    const names = Object.keys(entries);
    if (!names.length) { toast('本库还是空的'); return; }
    let n = 0;
    for (const nm of names) {
        const rec = entries[nm];
        if (!rec) continue;
        if (on) { if (!rec._locked) { rec._locked = true; n++; } }
        else if (rec._locked) { delete rec._locked; n++; }
    }
    saveSettings(true);
    log((on ? '全部锁定 ' : '全部解锁 ') + n + ' 份档案');
    toast((on ? '已锁定 ' : '已解锁 ') + n + ' 份');
    renderList();
}

function lockedCount() {
    const entries = currentEntries();
    let n = 0;
    for (const k in entries) if (entries[k] && entries[k]._locked) n++;
    return n;
}

/* ------------------------------ 字段锁 ------------------------------ */
/* 锁住某个字段 = 这个字段 AI 不改写（saveProfile 会保留原值），你也点不开编辑框。
   按字段名保存，不跟人物走：模板里多加一个字段，它照样有自己的小锁。 */
/* 字段锁：按「角色 + 字段」两把一起做键。
   以前只按字段名记，锁住一个人的「外貌特征」，别的角色的同一个字段也一起锁上，
   看着就像 "锁一个全锁了"。现在各锁各的。
   旧版存下来的裸字段名会在 migrateFieldLocks() 里一次性展开成当前库里每个角色各一条。 */
const FIELD_LOCK_SEP = '\u0001';

function fieldLockKey(name, k) {
    return String(name == null ? '' : name) + FIELD_LOCK_SEP + String(k == null ? '' : k);
}

function fieldLocked(name, k) {
    const F = S.fieldLocks;
    if (!F || typeof F !== 'object') return false;
    return !!F[fieldLockKey(name, k)];
}

function moveFieldLocks(oldName, newName) {
    if (oldName === newName || !S.fieldLocks || typeof S.fieldLocks !== 'object') return;
    const from = String(oldName) + FIELD_LOCK_SEP;
    const to = String(newName) + FIELD_LOCK_SEP;
    for (const key of Object.keys(S.fieldLocks)) {
        if (!S.fieldLocks[key] || key.indexOf(from) !== 0) continue;
        const target = to + key.slice(from.length);
        S.fieldLocks[target] = S.fieldLocks[target] || true;
        delete S.fieldLocks[key];
    }
}

function removeFieldLocks(name) {
    if (!S.fieldLocks || typeof S.fieldLocks !== 'object') return;
    const prefix = String(name) + FIELD_LOCK_SEP;
    for (const key of Object.keys(S.fieldLocks)) {
        if (key.indexOf(prefix) === 0) delete S.fieldLocks[key];
    }
}

function setFieldLock(name, k, on) {
    if (!S.fieldLocks || typeof S.fieldLocks !== 'object' || Array.isArray(S.fieldLocks)) S.fieldLocks = {};
    const key = fieldLockKey(name, k);
    if (on) S.fieldLocks[key] = true; else delete S.fieldLocks[key];
    saveSettings(true);
}

/* 老数据迁移：只有字段名、没有角色名的那些，展开给当前库里的每个角色 */
function migrateFieldLocks() {
    const F = S.fieldLocks;
    if (!F || typeof F !== 'object' || Array.isArray(F)) return;
    const legacy = Object.keys(F).filter((k) => F[k] && k.indexOf(FIELD_LOCK_SEP) < 0);
    if (!legacy.length) return;
    const entries = currentEntries();
    for (const nm of Object.keys(entries)) {
        for (const k of legacy) F[fieldLockKey(nm, k)] = true;
    }
    for (const k of legacy) delete F[k];
    saveSettings(true);
}

/* 某个角色身上被锁的字段（不传名字就给全部带角色前缀的键，方便排查） */
function lockedFieldNames(name) {
    const F = S.fieldLocks || {};
    const all = Object.keys(F).filter((k) => F[k]);
    if (name == null) return all;
    const pre = String(name) + FIELD_LOCK_SEP;
    return all.filter((k) => k.indexOf(pre) === 0).map((k) => k.slice(pre.length));
}

function toggleFieldLock(name, k) {
    if (!k) return false;
    const next = !fieldLocked(name, k);
    setFieldLock(name, k, next);
    const who = String(name == null ? '' : name);
    log(next ? ('已锁住「' + who + '」的字段「' + k + '」：AI 不会改写它，手动也不能编辑')
        : ('已解锁「' + who + '」的字段「' + k + '」'));
    toast(next ? ('已锁住「' + who + '」的字段「' + k + '」') : ('已解锁「' + who + '」的字段「' + k + '」'));
    renderList();
    return true;
}

function deleteRecord(name) {
    const b = bucket(cardKey(), false);
    if (!b || !b.entries[name]) return false;
    delete b.entries[name];
    removeFieldLocks(name);
    b.updated = Date.now();
    saveSettings(true);
    return true;
}


/* ------------------------- 判断一段文字是不是在写长相 / 穿着 ------------------------- */
/* 给「一条档案里塞了多种形态」的拆分用：只有切开后每段都真的在描述外形，
   才认定它是多形态，避免把「白衬衫；百褶裙；乐福鞋」这种罗列误拆。 */

/* 外貌类：发色、瞳色、发型、脸、身材、肤色、体征…… */
const WB_LOOK_WORDS = [
    /* 发 */
    '发色', '发丝', '头发', '发型', '长发', '短发', '中长发', '卷发', '直发', '马尾', '双马尾',
    '单马尾', '辫子', '麻花辫', '刘海', '前发', '鬓发', '呆毛', '碎发', '盘发', '丸子头', '散发',
    '银发', '金发', '黑发', '白发', '红发', '棕发', '褐发', '粉发', '蓝发', '紫发', '绿发', '灰发',
    '亚麻', '挑染', '渐变发',
    /* 眼 / 脸 */
    '瞳色', '眼瞳', '眼眸', '双眼', '眼睛', '瞳孔', '红瞳', '蓝瞳', '金瞳', '绿瞳', '紫瞳',
    '异色瞳', '瞳孔', '眼型', '丹凤眼', '杏眼', '眼梢', '双眼皮',
    '脸型', '脸蛋', '面容', '五官', '长相', '相貌', '眉毛', '眉头', '睫毛', '酒窝', '下巴', '面部轮廓',
    /* 身体 */
    '身高', '体重', '体型', '身材', '三围', '胸围', '腰围', '臀围', '胸型', '罩杯',
    '肤色', '肌肤', '皮肤', '双腿', '长腿', '细腿', '手指', '手指纤细', '锁骨', '香肩', '肩膀轮廓',
    /* 非人特征（不用单字，避免「角落」「桌腿」误伤） */
    '兽耳', '猫耳', '狐耳', '精灵耳', '尖耳', '长耳', '犄角', '兽角', '头角',
    '尾巴', '狐尾', '猫尾', '翅膀', '羽翼', '鳞片', '纹身', '刺青', '纹路', '印记',
    /* 年龄性别体态 */
    '年龄', '外貌', '容貌', '稚气', '妩媚', '清秀', '英气', '娇小', '高挑', '纤细', '丰满',
    '黑长直', '金发', '竖瞳', '毛发', '长直', '短发', '卷曲',
    /* 英文（世界书里常混 Tag） */
    'hair', 'eye', 'eyes', 'pupil', 'skin', 'face', 'facial', 'body', 'figure', 'height',
    'blonde', 'brunette', 'silver hair', 'white hair', 'black hair', 'long hair', 'short hair',
    'silver-haired', 'pigtail', 'ponytail', 'twintail', 'braid', 'fringe', 'bangs'
];

/* 服装类：衣服、鞋袜、配饰、材质、颜色 */
const WB_OUTFIT_WORDS = [
    /* 上下装 */
    '衣', '衬衫', '衬衣', '上衣', '外套', '大衣', '风衣', '夹克', '西装', '马甲', '背心',
    '连衣裙', '裙子', '长裙', '短裙', '百褶裙', '半身裙', '裤', '长裤', '短裤', '牛仔裤',
    '裙装', '洋装', '礼服', '制服', '校服', '工作服', '女仆装', '战斗服', '和服', '旗袍',
    '袍', '斗篷', '披风', '长袍', '法袍',
    /* 鞋袜 */
    '鞋', '靴', '长靴', '短靴', '皮鞋', '乐福鞋', '高跟鞋', '凉鞋', '拖鞋',
    '袜', '丝袜', '过膝袜', '短袜', '长袜', '连裤袜', '袜套',
    /* 配饰 */
    '帽子', '帽', '头饰', '发饰', '发带', '发卡', '蝴蝶结', '眼镜', '耳环', '项链', '手链',
    '手镯', '戒指', '胸针', '腰带', '围巾', '手套', '披肩', '护腕', '肩章', '徽章',
    '装扮', '穿着', '着装', '打扮', '服饰', '衣物', '服装', '衣物',
    /* 材质与风格 */
    '蕾丝', '棉', '丝质', '皮革', '丝绒', '毛呢', '针织', '雪纺', '薄纱', '金属',
    '镶边', '褶皱', '荷叶边', '纽扣', '拉链', '系带', '开衩',
    /* 英文 */
    'dress', 'shirt', 'skirt', 'jacket', 'coat', 'uniform', 'outfit', 'clothes', 'clothing',
    'costume', 'armor', 'boots', 'shoes', 'socks', 'stocking', 'glove', 'gloves', 'hat', 'cap',
    'necklace', 'earring', 'ribbon', 'bow', 'glasses', 'cloak', 'cape', 'apron', 'vest',
    'sleeve', 'collar', 'lace', 'silk', 'leather'
];

/* 把词表编成正则，长词优先，避免「衣」先命中把「衬衫」吞掉 */
function lookRe(words) {
    const sorted = words.slice().sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(sorted.join('|'));
}
const WB_LOOK_RE = lookRe(WB_LOOK_WORDS);
const WB_OUTFIT_RE = lookRe(WB_OUTFIT_WORDS);

/* 这条世界书内容里有没有「长相」或「穿着」信息？
   有就带回 true（并告诉是哪一类），没有就不该发出去。 */
function wbHasLook(content) {
    const t = String(content || '');
    if (!t) return { look: false, outfit: false, any: false };
    const look = WB_LOOK_RE.test(t);
    const outfit = WB_OUTFIT_RE.test(t);
    return { look, outfit, any: look || outfit };
}



/* 正文里提到的、已经记录过的角色 → 交给模型做增量更新 */
/* 旧档案预算：一份真实档案约 4000～5000 字，留够 8～9 个角色的余量。
   预算不够时不是默默丢掉，而是把没发成的角色列给 AI 并明确禁止编造。 */
const OLD_RECORD_BUDGET = 40000;

function pickOldRecords(text, limit) {
    const out = [];
    const entries = currentEntries();
    const t = String(text || '');
    let used = 0;
    /* 因为预算不够、一个字都没发出去的角色 */
    const dropped = [];
    /* 一条档案的正文，超预算就截断 */
    const push = (name) => {
        const rec = entries[name];
        if (!rec || rec._locked) return;
        const content = buildContent(rec);
        if (!content) return;
        const room = limit - used;
        if (room <= 0) { dropped.push(name); return; }
        out.push({ name, content: content.length > room ? content.slice(0, room) + '……' : content });
        used += Math.min(content.length, room);
    };
    /* 正文里可能称呼到这个角色的说法：本名 + 档案「别称」栏里列的别名。
       正文只写小名 / 外号 / 西式称呼也算这个角色出场，跟预设里「用别称称呼也算出场」的收录规则对齐。 */
    const calledIn = (base, list) => {
        const names = [base];
        for (const x of list) {
            const rec = entries[x.name];
            const al = String((rec && rec['别称']) || '');
            for (const a of al.split(/[、,，;；/|\s]+/)) {
                const v = String(a || '').trim();
                if (v.length >= 2 && names.indexOf(v) < 0) names.push(v);
            }
        }
        return names.some((n) => t.indexOf(n) >= 0);
    };
    /* 按「本名」分组找：正文写「爱丽丝」也算命中「爱丽丝·魔法少女[当前]」 */
    for (const [base, list] of formGroups()) {
        if (base.length < 2) continue;
        if (!calledIn(base, list)) continue;
        /* 多形态角色只提交一个形态的全文：正文点名了哪个就发哪个，否则发 [当前]。
           其它形态只报名字，不占字数——让 AI 知道它们存在，别重复新建。 */
        const hits = list.filter((x) => x.info.form && !x.info.isSealed && t.indexOf(x.info.form) >= 0);
        const target = hits.length
            ? hits[hits.length - 1]
            : (list.find((x) => x.info.isCurrent) || list.find((x) => !x.info.form) || list[0]);
        push(target.name);
        const others = list.filter((x) => x.name !== target.name);
        if (others.length) {
            const room = limit - used;
            if (room > 0) {
                const names = others.map((x) => {
                    const rec = entries[x.name];
                    return (x.info.form || x.info.base)
                        + (x.info.isSealed ? '（永久封印）' : '')
                        + (rec && rec._locked ? '（已锁定，不要改）' : '');
                }).join('、');
                const content = '（这些形态已经有档案了，不要重复新建；要更新就按姓名精确对应）：' + names;
                out.push({ name: base + ' 的其它形态', content });
                used += Math.min(content.length, room);
            }
        }
    }
    /* 预算不够的角色：报个名字，并明确要求不要凭空编造 */
    if (dropped.length) {
        out.push({
            name: '预算没装下的角色',
            dropped: dropped.slice(),
            content: '（下面这些角色已经有档案，但这次档案太长没一起发过来：' + dropped.join('、')
                + '。**不要凭印象补写它们的字段**：正文里明确写到的就按正文更新，没写到的字段留空或原样保留，不许编造。）'
        });
    }
    return out;
}

/* ------------------------------ 正文采集 ------------------------------ */

/* 借用智绘姬的正则管道：把文本丢给它的正则页签处理，拿回处理后的结果。
   智绘姬会依次套用它「正则设置」里当前配置的全部条目 + 前后正则 + 文字正则。
   拿不到就原样返回（不能让正则挂了就记不了档）。 */
let regexBroken = false;   // 一旦确认调不通就不再每条都等超时

function regexClean(text) {
    return new Promise((resolve) => {
        const raw = String(text || '');
        if (!raw) { resolve(raw); return; }
        if (!S.useRegex || regexBroken) { resolve(raw); return; }
        let es = null;
        try { es = getContext().eventSource; } catch (e) { es = null; }
        if (!es || typeof es.emit !== 'function') { regexBroken = true; resolve(raw); return; }

        const REQ = 'regex-st-chatu8-test-message';
        const RES = 'regex-st-chatu8-result-message';
        const rid = 'dna-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        let done = false;
        const finish = (v, timedOut) => {
            if (done) return;
            done = true;
            try { es.removeListener(RES, onResult); } catch (e) { /* 忽略 */ }
            clearTimeout(timer);
            if (timedOut) {
                if (!regexBroken) {
                    regexBroken = true;
                    log('智绘姬正则没有响应，本轮改用原文（检查智绘姬正则页签是否正常）', 'error');
                }
                resolve(raw);
                return;
            }
            resolve(typeof v === 'string' ? v : raw);
        };
        const onResult = (d) => { if (d && d.id === rid) finish(d.message, false); };
        const timer = setTimeout(() => finish(raw, true), 8000);
        try {
            es.on(RES, onResult);
            es.emit(REQ, { message: raw, id: rid });
        } catch (e) { finish(raw, true); }
    });
}

/* 只跑正则、不干别的（测试工具用） */
async function regexOnly(text) {
    const raw = String(text || '');
    if (!raw) return '';
    let es = null;
    try { es = getContext().eventSource; } catch (e) { es = null; }
    if (!es || typeof es.emit !== 'function') throw new Error('拿不到酒馆的事件总线，没法调用智绘姬正则');
    return await new Promise((resolve, reject) => {
        const REQ = 'regex-st-chatu8-test-message';
        const RES = 'regex-st-chatu8-result-message';
        const rid = 'dna-t-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        let done = false;
        const finish = (ok, v) => {
            if (done) return;
            done = true;
            try { es.removeListener(RES, onResult); } catch (e) { /* 忽略 */ }
            clearTimeout(timer);
            ok ? resolve(v) : reject(new Error(v));
        };
        const onResult = (d) => { if (d && d.id === rid) finish(true, String(d.message)); };
        const timer = setTimeout(() => finish(false, '智绘姬正则处理超时（8 秒）'), 8000);
        try {
            es.on(RES, onResult);
            es.emit(REQ, { message: raw, id: rid });
        } catch (e) { finish(false, '调用正则失败：' + (e && e.message ? e.message : e)); }
    });
}

/* 正则当前用的是哪份配置 */
function regexProfileName() {
    try {
        const ch = extension_settings[CHATU8];
        return (ch && ch.current_regex_profile) || '';
    } catch (e) { return ''; }
}

function regexEntriesCount() {
    try {
        const ch = extension_settings[CHATU8];
        const name = ch && ch.current_regex_profile;
        const prof = name && ch.regex_profiles && ch.regex_profiles[name];
        if (!prof || !Array.isArray(prof.regexEntries)) return 0;
        return prof.regexEntries.filter((e) => e && !e.disabled).length;
    } catch (e) { return 0; }
}

function cleanText(s) {
    let t = String(s || '');
    t = t.replace(/<[^>]{0,300}>/g, ' ');
    t = t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    return t.trim();
}

async function collectChatText(depth, onlyIdx) {
    const ctx = getContext();
    const chat = Array.isArray(ctx.chat) ? ctx.chat : [];
    if (!chat.length) return { text: '', count: 0, from: 0, to: 0, before: 0, after: 0, skipped: 0 };
    const want = clampInt(depth, 1, 300, 3);

    /* 只要 AI 输出的楼层，玩家输入一律不进正文。
       所以「最近 N 层」按 N 条 AI 回复来数：从最后一层往前找，
       找满 N 条 AI 回复就停，中间夹着的玩家楼层直接跳过。 */
    const picked = [];
    let skipped = 0;
    /* 指定了楼层（连点正文 → 操作弹窗里的「档案生成」）：只收这一层，而且必须是 AI 楼层 */
    if (Number.isInteger(onlyIdx) && onlyIdx >= 0) {
        const one = chat[onlyIdx];
        if (one && !one.is_user && !one.is_system && String(one.mes || one.message || '').trim()) {
            picked.push({ idx: onlyIdx, mes: one });
        }
    } else {
        for (let i = chat.length - 1; i >= 0 && picked.length < want; i--) {
            const m = chat[i];
            if (!m || m.is_system) continue;
            if (m.is_user) { skipped++; continue; }
            if (!String(m.mes || m.message || '').trim()) continue;
            picked.push({ idx: i, mes: m });
        }
        picked.reverse();
    }

    const parts = [];
    let beforeLen = 0, afterLen = 0;
    /* 智绘姬跑正则时会顺手 clearLog() 并往它自己的测试框里写内容，
       我们只是借它的管道，不该把用户那边的现场弄乱，所以前后存一份再还原 */
    const scene = S.useRegex && !regexBroken ? snapshotChatu8RegexUI() : null;
    try {
        /* 一条一条过正则：智绘姬的正则是把文本灌进它自己的页签里跑的，
           并发调用会互相踩，所以这里必须串行 */
        for (const item of picked) {
            const raw = String(item.mes.mes || item.mes.message || '');
            let cleaned = raw;
            if (S.useRegex) {
                beforeLen += raw.length;
                cleaned = await regexClean(raw);
                afterLen += String(cleaned || '').length;
            }
            const body = cleanText(cleaned);
            if (!body) continue;
            parts.push('【第' + item.idx + '层·AI】\n' + body);
        }
    } finally {
        if (scene) restoreChatu8RegexUI(scene);
    }
    let text = parts.join('\n\n');
    const LIMIT = 30000;
    if (text.length > LIMIT) text = text.slice(0, LIMIT) + '\n……（正文过长，已截断）';
    const from = picked.length ? picked[0].idx : 0;
    const to = picked.length ? picked[picked.length - 1].idx : 0;
    return { text, count: parts.length, from, to, before: beforeLen, after: afterLen, skipped };
}

/* 借管道前，把智绘姬正则页签的现场存一份 */
function snapshotChatu8RegexUI() {
    try {
        const ch = extension_settings[CHATU8];
        return {
            log: ch ? ch.log : undefined,
            orig: (document.querySelector('#ch-regex-test-original-text') || {}).value,
            res: (document.querySelector('#ch-regex-test-result-text') || {}).value
        };
    } catch (e) { return null; }
}

function restoreChatu8RegexUI(scene) {
    if (!scene) return;
    try {
        const ch = extension_settings[CHATU8];
        if (ch && scene.log !== undefined) ch.log = scene.log;
        const orig = document.querySelector('#ch-regex-test-original-text');
        if (orig && scene.orig !== undefined) orig.value = scene.orig;
        const res = document.querySelector('#ch-regex-test-result-text');
        if (res && scene.res !== undefined) res.value = scene.res;
    } catch (e) { /* 还原失败不影响记录 */ }
}

/* ------------------------------ 提示词 ------------------------------ */
/* 原来这里是一整段硬编码的附加提示词（漠然档案馆），现在整段删掉了。
   改成联动智绘姬「LLM」页签里的两项配置：
     · 自定义 Tool 工具配置（tool_call_config）
     · 发送前末尾自定义多 Role 消息（tail_messages_config）
   两样都从那边原样读，这里不再自己写一份。 */
/* 档案字段：与「重要角色表」的列一一对应（row_id 是表格行号，不进档案内容）。
   这个数组同时决定写入顺序、复制顺序和详情里的展示顺序。 */
const DNA_FIELDS = ['姓名', '别称', 'ip', '物种', '性别/年龄', '外貌特征', '当前衣着/装扮', '核心DNA', '服装DNA', '本名', '外貌串', '服装串'];

const FIELD_RULES = [
    "只输出这 12 个字段：姓名 / 别称 / ip / 物种 / 性别/年龄 / 外貌特征 / 当前衣着/装扮 / 核心DNA / 服装DNA / 本名 / 外貌串 / 服装串，",
    "一个都不许少，也不许自己增加别的字段（不要性格、身份、关系、能力、好感度这类）。",
    "允许留空的是「别称」：正文没提到小名外号就写空字符串，但这个键必须存在。",
    "「ip」也必须有值：判断得出出处就写作品名，原创角色写「无」。",
    "",
    "【姓名】正文里的具体名字，原样照抄，不要改写成代称。",
    "多形态：同一角色的不同形态各占一条档案，姓名写成「原名·形态名」，并在末尾标注 [当前] / [非当前] / [永久封印]。",
    "只有正文明确发生形态转换、性别或种族变化、变身/觉醒、或达到条件的 Cosplay 才另立形态；",
    "普通理发、持久染发、临时假发、一次性美瞳都算原形态的更新，不另立形态。",
    "",
    "【别称】小名、外号、绰号、昵称、别人平时怎么称呼她 —— 有一个写一个，多个用「、」隔开（例：「明明、明哥」）。",
    "只写正文里真的这么称呼过的；没提到就写空字符串。别称不是姓名，也不代替姓名。",
    "这是追加栏：资料里给了上次档案、上次的别称已经写了，就原样带上，把新发现的补在后面，不许丢老的、不许改写老的。",
    "正文里用别称称呼人，也算这个角色出场。",
    "",
    "【ip】这个角色出自哪部作品（IP / 同人作品 / 游戏 / 动漫 / 小说 / 影视），填作品名。",
    "能判断出出处就填那部作品的中文名（例：明日方舟、原神、Fate/Grand Order）；原创角色、本地角色写「无」，不许留空。",
    "同一部作品在整批输出里写法必须逐字一致；只写作品名，不写作者、不写章节、不写第几部。",
    "这是作品出处，不是身份职业，也不是物种。",
    "",
    "【物种】必填，不许留空、不许写「未知」「其他」。写物种名，必要时用括号补品种或分支：人类、精灵、矮人、狼人、吸血鬼、魔物娘、亚人（兽耳族）、马（温血马）、犬（边境牧羊犬）、树人、史莱姆、龙形。",
    "混血 / 半兽 / 化形按当前出场形态写主物种，括号里补分支：人类（狼人血统）、马（化形人形）。",
    "「性别/年龄」里不再重复物种；「外貌特征」首句写明的物种要与这一栏逐字一致。",
    "",
    "【性别/年龄】性别与年龄写成一段，例如「女/23」「男/40 上下」。",
    "正文没写年龄时，按人物的种族、身份与整体设计推定一个具体数字，不要写「未知」。",
    "",
    "【外貌特征】用中文自然语言记录固有外貌：发型、发色、身高、身材、肤色、五官。",
    "严禁神态描写（如「嘴角勾起冷笑」）、服装、姿势或临时状态。",
    "身高必须写；女性角色还要逐项写胸围、腰围、臀围、胸型，固定格式为：",
    "  身高：<数值> cm；胸围：<数值> cm；腰围：<数值> cm；臀围：<数值> cm；胸型：<稳定胸型描述>。",
    "尖括号要换成具体数值，不许只写「三围」或一串没标含义的数字；正文没给就按种族、年龄段、体型一次性合理补全，",
    "并在该项后注明「（设定补全）」，之后锁定。胸围是围度，不能用罩杯或胸部大小代替。",
    "这里写自然语言的概览即可；同一批信息在核心DNA里还要按结构化字段再写一遍，两边要一致：",
    "身高对应「身高/相对身高」，胸围对应「胸部」，腰围臀围对应「身材比例（肩/腰/胯/臀/腿）」，胸型对应「固定胸型」。",
    "",
    "【当前衣着/装扮】用中文自然语言完整列出当前全部衣物及每件的实际状态。",
    "禁止用「其余不变」「同前」「略」。正文明示没穿贴身层就写「无内衣/无内裤」，光脚写「赤脚」；",
    "正文省略的贴身衣物与鞋袜要依据人物、时代、场景、外层服装和整体配色一次性合理补全并锁定。",
    "状态措辞只用这几个词：正常穿着/敞开/部分敞开/解扣/卷袖/束入/掀起/半脱/暂时脱下/湿透/临时透明/破损/沾污/缺失。",
    "",
    "【核心DNA】固定 29 个字段 + 末尾「当前发型」快照，共 30 项，顺序不可调换、不可省略。",
    "格式为：中文字段名{英文内容}; 下一字段{……};",
    "⚠️ 硬性要求：花括号 { } 里只能出现英文单词、英文短语或英文标签，一个中文字符都不许有，也不许出现全角标点。",
    "   正确：发色{silver hair}; 前发/刘海{blunt bangs}; 当前发型{same as initial};",
    "   错误：发色{银发}; 前发/刘海{齐刘海}; 当前发型{同初始};",
    "   —— 中文字段名在花括号外面，花括号里面一律英文，这是固定写法。",
    "顺序：发色;发色细节;前发/刘海;主发型;发长;鬓发/侧发;顶部/后部特征;发质;发饰;瞳色;眼型;特殊瞳孔/巩膜;脸型;眉毛;睫毛;鼻型;唇型;面部印象;永久面部标记及位置;体型（含肌肉特征）;身材比例（肩/腰/胯/臀/腿）;胸部;固定胸型;肤色;年龄;身体标记及位置;身高/相对身高;非人部位（类型/数量/颜色/位置）;固定妆容/面部彩绘;当前发型",
    "规则：",
    "- {none} 只表示「已确认不存在或确实不适用」，不能因为正文没写就写 none。",
    "- 正文没写的外貌关键项，要依据人物种族、年龄段、身份、性格、时代、整体设计一次性合理补全并锁定。",
    "- 禁止出现 unknown、「未明确」「待定」「可能」这类占位。",
    "- 前发/刘海必须写明具体结构、分缝、方向、长度或遮眼关系，例如 blunt bangs、curtain bangs、swept bangs、hair pulled back、hair slicked back；禁止只写 bangs / fringe / no bangs。",
    "- 肌肉并入「体型（含肌肉特征）」；永久标记必须写位置。",
    "- 当前发型未变化就写：当前发型{same as initial};",
    "",
    "【服装DNA】按 17 个槽位顺序逐件记录，格式为：中文槽位名{英文内容};",
    "⚠️ 花括号里同样只能写英文，一个中文字符都不许有，六项的键名也用英文。",
    "   正确：上身外层{style:hoodie | color:black | length/structure:cropped | material:cotton | pattern/details:plain | default state:worn normally};",
    "   错误：上身外层{黑色卫衣}; 上身外层{款式/子型:卫衣 | 颜色:黑色};",
    "顺序：妆容;唇妆;内衣上身;内衣下身;上身内层;上身外层;下身主层;连体;腿部穿着;腿部可见状态;足部;头部;颈部;手腕手部;腰部;眼部;耳部",
    "规则：",
    "- 每件真实衣物写全六项（键名和值都用英文）：style:___ | color:___ | length/structure:___ | material:___ | pattern/details:___ | default state:___",
    "- 同一个槽位有多件衣物时写成 槽位名1、槽位名2，每件各占一个花括号；连衣裙、长袍等连体衣物只在「连体」记一次。",
    "- 只有经过完整穿搭判断后确认没有该物件，才写 {none}；正文没提的要在不影响设定时合理补全并锁定，不许写 unknown。",
    "- 妆容与唇妆写当前实际视觉，素颜写 no makeup、自然唇色写 natural lips。",
    "- 裸腿写：腿部穿着{none}; 腿部可见状态{bare legs};",
    "- 决定角色辨识度的配饰在槽位值末尾加【签名件】。",
    "",
    "【本名】非必填，按形态状态判定：",
    "- 无形态的普通角色（姓名里没有「·」也没有标记）：本名 = 姓名原文。",
    "- 姓名带 [当前] 的形态：本名 = 去掉形态名和标记后的原始姓名（「艾莉丝·暗堕态[当前]」→「艾莉丝」）。",
    "- 姓名带 [非当前] 或 [永久封印]：本名留空（输出空字符串）。",
    "- 同一个本名在整批输出里最多只出现在一条上。",
    "",
    "【外貌串】由核心DNA拼装好的完整外貌生图提示词，供生图逐字复制，禁止生图时重新拼装。",
    "固定前缀逐字为「这是生图的外貌提示词：」，冒号后紧跟拼装结果，前缀一个字都不许改。",
    "- 按核心DNA字段顺序拼装，只保留英文Tag与中文精确短语，逗号分隔，串首带性别前缀（girl / boy）；",
    "  {none} 的字段跳过；当前发型{同初始}不追加，临时发型把对应Tag追加在串末。",
    "- 瞳色写当前可见的瞳色：戴美瞳写美瞳颜色，不写被遮住的真实瞳色。",
    "- 禁止候选同义词并列、自造复合词、遗漏任何已记录的字段。",
    "",
    "【服装串】由服装DNA拼装好的完整服装生图提示词，同样逐字复制，禁止重新拼装。",
    "固定前缀逐字为「这是生图的服装提示词：」，冒号后紧跟拼装结果。",
    "- 17 个槽位逐件组装，每件取 款式/子型 + 颜色 + 长度/结构 + 材质 + 图案/标志细节，全部逐件列出，逗号分隔。",
    "- 不含内衣上身、内衣下身、腿部可见状态、眼部槽位；妆容/唇妆有实际值才写，素颜与自然唇色不写。",
    "- 不含任何临时状态（敞开/湿透等）；【签名件】标注不进入串。",
    "",
    "【两串与DNA的同步】core_dna 或 clothing_dna 有任何更新，必须同步完整重写对应串；两串与核心DNA、服装DNA逐项一致，缺一项视为作废。",
    "旧档案缺这两串时，按现有核心DNA、服装DNA一次性拼装补齐后锁定。"
];

function batchPrompt(text, pack) {
    const origins = (pack && pack.origins) || [];
    const olds = (pack && pack.olds) || [];
    const lines = [];
    lines.push('你是人物档案生成器。下面给你一段剧情正文，请把正文里出现过的人物整理成固定格式的档案。');
    lines.push('');
    lines.push('【谁要收录】');
    lines.push('· 正文里出现了具体名字、或者有专指称谓的人物都要收录，一个都不要漏。');
    lines.push('· 没有名字的泛称不要收录：士兵、守卫、侍女、人群、路人甲、众人、老板、酒保、摊贩之类。');
    lines.push('· 只是被顺口提一句、并没有真正出场的人物不要收录。');
    lines.push('');
    lines.push('【输出格式】只输出 JSON 数组本身，不要 markdown 代码块，不要任何解释：');
    lines.push(tplFormat());
    lines.push('');
    lines.push(...tplRuleLines());
    if (origins.length) {
        lines.push('');
        lines.push('【角色卡里的角色设定】');
        lines.push('下面这些角色在正文里出现了。写它们的时候必须以这里的设定为人物基础：');
        lines.push('种族、外貌底子（发色/瞳色/脸型/体型等）、身份、能力、关系、称谓都不许改，只按正文更新它当前的状态。');
        lines.push('如果正文情节与设定冲突，以正文的剧情进展为准，但人物底子保持不变。');
        for (const o of origins) {
            lines.push('');
            lines.push('—— ' + o.name + ' ——');
            lines.push(o.content);
        }
    }
    if (olds.length) {
        lines.push('');
        lines.push('【这些角色上次记录的档案】');
        lines.push('它们如果出现在正文里，请按当前剧情更新：没变化的部分原样保留，只改变化的部分。');
        for (const o of olds) {
            lines.push('');
            lines.push('—— ' + o.name + ' ——');
            lines.push(o.content);
        }
    }
    lines.push('');
    lines.push('【剧情正文】');
    lines.push(text);
    return lines.join('\n');
}

function buildContent(profile, sendOnly) {
    const lines = [];
    for (const k of tplFields()) {
        /* sendOnly：这条是发出去给 AI 看的，勾掉的字段就不带（复制档案走全量，不受影响）
           姓名被勾掉也不影响 AI 认人：档案块的标题本来就写着名字 */
        if (sendOnly && !sendFieldOn(k)) continue;
        const v = String(profile[k] == null ? '' : profile[k]).trim();
        if (!v) continue;   /* 旧档案缺的新字段不占行 */
        lines.push(k + '：' + v);
    }
    return lines.join('\n');
}

/* ------------------------------ 上下文预设 ------------------------------ */
/* 导入的是智绘姬「LLM → 测试上下文预设」那种格式：
     { 预设名: { entries: [ {id, name, role, content, enabled, triggerMode, triggerWords, andTriggerWords} ] } }
   也认 { entries:[...] }、{ context_presets:{...} }、以及一个文件里放好几份预设。
   组装时按条目顺序取启用项，支持下面这些占位符；预设里没写占位符也能跑，缺的块会补在末尾。 */

const PRESET_ROLES = ['system', 'user', 'assistant'];

/* 占位符：中文名是主写法，英文别名也认 */
const PRESET_TOKENS = [
    { keys: ['{{正文}}', '{{剧情正文}}', '{{DNA_TEXT}}'], label: '剧情正文' },
    { keys: ['{{角色卡设定}}', '{{DNA_ORIGINS}}'], label: '角色卡设定' },
    { keys: ['{{旧档案}}', '{{DNA_OLDS}}'], label: '上次记录的档案' },
    { keys: ['{{收录规则}}', '{{DNA_RULES}}'], label: '收录规则' },
    { keys: ['{{字段规范}}', '{{DNA_FIELDS}}'], label: '字段规范（跟当前档案模板走）' },
    { keys: ['{{输出格式}}', '{{DNA_FORMAT}}'], label: '输出格式' }
];

/* 收录规则 / 输出格式的内置副本：预设里用 {{收录规则}} {{输出格式}} 引用时填这个 */
const COLLECT_RULES = [
    '· 正文里出现具体名字的人物，全部收录，一个都不许漏。',
    '· 只有专指称谓、但明确指向某个具体人物的，也收录，姓名写那个称谓。',
    '· 泛称、群体（士兵、守卫、侍女、人群、路人甲、众人、老板、酒保、摊贩）一律不收录。',
    '· 只被顺口提一句、并没有真正出场的人物不收录。',
    '· 正文里用别称（小名、外号）称呼人，也算这个角色出场。',
    '· 发现别称就写进「别称」栏，多个用「、」隔开；上次档案里已有的别称要原样带上，只许追加不许删改。',
    '· 判断得出角色出自哪部作品，就把作品名写进「ip」栏；原创角色或判不出来的写「无」，不许留空。'
].join('\n');

const JSON_TEMPLATE = [
    '[',
    '  {"姓名":"甲","别称":"明明、明哥","ip":"无","物种":"人类","性别/年龄":"…","外貌特征":"…","当前衣着/装扮":"…","核心DNA":"…","服装DNA":"…","本名":"甲","外貌串":"这是生图的外貌提示词：girl, …","服装串":"这是生图的服装提示词：…"},',
    '  {"姓名":"乙","别称":"…","ip":"…","物种":"精灵","性别/年龄":"…","外貌特征":"…","当前衣着/装扮":"…","核心DNA":"…","服装DNA":"…","本名":"乙","外貌串":"这是生图的外貌提示词：boy, …","服装串":"这是生图的服装提示词：…"}',
    ']'
].join('\n');

/* ------------------------------ 档案模板 ------------------------------ */
/* v2.9.15 起：模板只管「这份档案有哪些字段」——决定落盘顺序、详情展示顺序、buildContent 输出什么。
   「每个字段怎么写 / JSON 长什么样」这类提示词不再存在模板里，统一由上下文预设提供；
   所以改了模板字段之后，必须同步改对应的上下文预设，否则模型输出对不上字段。
   内置默认模板就是那套十二段（姓名 + 别称 + ip + 物种 + 8 个，改不了、删不掉）；导入/自建的模板存在 S.dnaTemplates 里按名切换。
   导出的 JSON 就是「可以改完再导回来」的样子：{ name, fields:[…] }。 */
function normalizeTemplate(raw, fallbackName) {
    const src = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
    const name = String(src.name || src['模板名'] || fallbackName || '').trim() || '未命名模板';
    let fields = src.fields || src['字段'] || src.columns;
    if (typeof fields === 'string') fields = fields.split(/[,\n、|]+/);
    fields = (Array.isArray(fields) ? fields : [])
        .map((f) => String(f && f.name !== undefined ? f.name : f).trim())
        .filter(Boolean);
    if (!fields.length) throw new Error('模板里没有字段列表（fields）');
    /* 姓名必须是第一个：档案以姓名为键 */
    fields = ['姓名'].concat(fields.filter((f) => f !== '姓名'));
    /* 旧模板文件里的 rules / format 直接忽略：模板不再保存提示词（v2.9.15） */
    return {
        name,
        fields,
        importedAt: src.importedAt || new Date().toISOString()
    };
}

/* 模板选择跟着角色卡走 —— 和档案库用同一个 cardKey()，所以：
     · 同一个角色卡的不同会话可以各用一份模板；
     · 不同的角色卡各用一套（字段结构可以完全不同）。
   而模板本身（S.dnaTemplates，自己建 / 导入的那些）仍然是全卡共用的，
   这里按卡记的只是「这个卡现在用哪一份」。 */
function tplNameOfCard() {
    const map = S.dnaTemplatesByCard;
    const bag = S.dnaTemplates || {};
    const k = cardKey();
    const has = !!(map && typeof map === 'object' && Object.prototype.hasOwnProperty.call(map, k));
    /* 这张卡还没单独选过 → 沿用升级前那个全局选择，老用户不会被重置回默认 */
    let name = has ? String(map[k] == null ? '' : map[k]) : String(S.dnaTemplate == null ? '' : S.dnaTemplate);
    if (name && !bag[name]) name = '';   /* 选的那份被删了 → 回退内置默认 */
    return name;
}

/* 模板锁：按角色卡（会话）记一把。锁着的卡固定用自己那份模板，
   下拉框变灰不能改；再点一下锁就解开，随时可开可关。
   和「模板选择」用的是同一个 cardKey()，所以卡 A 锁 A 模板、卡 B 锁 B 模板互不干扰。 */
function tplLocked() {
    const m = S.dnaTplLock;
    return !!(m && typeof m === 'object' && m[cardKey()]);
}

function setTplLock(on) {
    if (!S.dnaTplLock || typeof S.dnaTplLock !== 'object' || Array.isArray(S.dnaTplLock)) S.dnaTplLock = {};
    const k = cardKey();
    if (on) S.dnaTplLock[k] = true; else delete S.dnaTplLock[k];
    saveSettings(true);
    renderTemplateUI();
}

function toggleTplLock() {
    const next = !tplLocked();
    setTplLock(next);
    const nm = tplIsDefault() ? '默认模板（内置）' : tplNameOfCard();
    log(next ? ('模板已锁定：这张角色卡固定用「' + nm + '」') : ('模板已解锁：这张角色卡可以换模板了'));
    toast(next ? ('已锁定：这张角色卡用「' + nm + '」') : '已解锁，可以换模板了');
    return next;
}

function setTplNameOfCard(name) {
    /* 锁着的卡不许改：换模板、导入、重置都要先解锁 */
    if (tplLocked()) return false;
    if (!S.dnaTemplatesByCard || typeof S.dnaTemplatesByCard !== 'object' || Array.isArray(S.dnaTemplatesByCard)) S.dnaTemplatesByCard = {};
    const bag = S.dnaTemplates || {};
    const k = cardKey();
    /* 显式写空串（而不是删键）= 这张卡明确用默认模板，别再回退到全局那个旧值 */
    S.dnaTemplatesByCard[k] = (name && bag[name]) ? String(name) : '';
    return true;
}

/* 当前生效的模板：没选、或者选的那份没了 → 内置默认 */
function activeTemplate() {
    const bag = S.dnaTemplates || {};
    const cur = tplNameOfCard();
    const t = cur && bag[cur];
    return t ? t : { name: '默认模板', fields: DNA_FIELDS };
}

function tplIsDefault() {
    const cur = tplNameOfCard();
    return !(cur && (S.dnaTemplates || {})[cur]);
}

function tplFields() {
    const f = activeTemplate().fields;
    const arr = Array.isArray(f) ? f.filter(Boolean) : [];
    return arr.length ? arr : DNA_FIELDS;
}

/* 模板字段是不是就是内置那十个（连顺序一起比）。
   是的话所有规范逐字走内置那套，一个字都不变；不是才按模板重新生成。 */
function tplIsDefaultFields() {
    const f = tplFields();
    if (f.length !== DNA_FIELDS.length) return false;
    for (let i = 0; i < f.length; i++) if (f[i] !== DNA_FIELDS[i]) return false;
    return true;
}

/* 自建模板里多出来的字段（内置那十个之外的） */
function tplExtraFields() {
    const out = [];
    for (const k of tplFields()) {
        if (DNA_FIELDS.indexOf(k) < 0 && out.indexOf(k) < 0) out.push(k);
    }
    return out;
}

/* 从内置 FIELD_RULES 里切出某个字段那一段（没有就返回空串） */
function ruleSectionOf(k) {
    const head = '【' + k + '】';
    let i = -1;
    for (let n = 0; n < FIELD_RULES.length; n++) {
        if (FIELD_RULES[n].indexOf(head) === 0) { i = n; break; }
    }
    if (i < 0) return '';
    const out = [FIELD_RULES[i]];
    for (let n = i + 1; n < FIELD_RULES.length; n++) {
        if (FIELD_RULES[n].indexOf('【') === 0) break;
        out.push(FIELD_RULES[n]);
    }
    while (out.length && !String(out[out.length - 1]).trim()) out.pop();
    return out.join('\n');
}

/* 预设里没写规范的自定义字段：给一条通用的，总比让模型直接忽略它强 */
function genericFieldRule(k) {
    return '【' + k + '】按正文如实记录；正文没写的，依据人物设定、时代与场景合理补全，之后保持稳定；不要写临时状态或旁白。';
}

/* 字段规范 / 输出格式：跟着当前模板的字段走。
   默认那十二个字段 → 逐字用内置那套（跟以前完全一样）；
   换成自建模板 → 内置字段沿用原有说明，新加的字段补一条通用规范。 */
function tplRules() {
    if (tplIsDefaultFields()) return FIELD_RULES.join('\n');
    const fields = tplFields();
    const head = [
        '只输出这 ' + fields.length + ' 个字段：' + fields.join(' / ') + '，',
        '一个都不许少，也不许自己增加别的字段（不要性格、身份、关系、能力、好感度这类）。',
        '正文没提到内容的字段写空字符串，但键必须存在。',
        ''
    ];
    return head.concat(fields.map((k) => ruleSectionOf(k) || genericFieldRule(k))).join('\n');
}

function tplRuleLines() {
    return tplRules().split('\n');
}

function tplFormat() {
    if (tplIsDefaultFields()) return JSON_TEMPLATE;
    const fields = tplFields();
    const demo = (name) => '{' + fields.map((k) => {
        const v = (k === '姓名') ? name : (k === '别称' ? '明明、明哥' : '…');
        return JSON.stringify(k) + ':"' + v + '"';
    }).join(',') + '}';
    return '[\n  ' + demo('甲') + ',\n  ' + demo('乙') + '\n]';
}

/* 预设里那份字段表是写死的（内置预设写的就是固定十二个字段，含 ip），
   自建模板加了字段以后必须补一段把它掰回来，否则模型按预设那句「不许增加字段」直接不输出。 */
function tplFieldSpecBlock() {
    const extra = tplExtraFields();
    if (!extra.length) return '';
    const fields = tplFields();
    const lines = [
        '【档案字段清单（以本段为准）】',
        '这份档案按下面这些字段输出，共 ' + fields.length + ' 个，一个都不许少，也不许自己增加别的字段：',
        fields.join(' / '),
        '输出 JSON 时每个对象的键必须正好是这些字段名，逐字一致（含斜杠）。',
        '上面如果写了固定的字段表或 JSON 示例，按本节这份清单替换。'
    ];
    lines.push('下面这几个字段预设里没有写规范，按这样填：');
    extra.forEach((k) => lines.push('· ' + genericFieldRule(k)));
    return lines.join('\n');
}

/* 详情用：模板字段在前，档案里多出来的旧字段跟在后（换模板后旧档案也不会「丢」内容） */
function tplDetailFields(rec) {
    const out = tplFields().filter((k) => k !== '姓名');
    const push = (k) => { if (k && k !== '姓名' && k.charAt(0) !== '_' && out.indexOf(k) < 0) out.push(k); };
    DNA_FIELDS.forEach(push);
    Object.keys(rec || {}).forEach(push);
    return out;
}

/* 导出用的对象（name 留空 = 当前模板） */
function templateExport(name) {
    const t = name ? ((S.dnaTemplates || {})[name] || null) : activeTemplate();
    if (!t) return null;
    return {
        type: 'st-chatu8-dna-template',
        version: 2,
        name: name || t.name || (tplIsDefault() ? '默认模板' : tplNameOfCard()),
        fields: Array.isArray(t.fields) ? t.fields : DNA_FIELDS,
        exportedAt: new Date().toISOString()
    };
}

/* 和智绘姬一样：//* 注释行不进 messages */
function stripPresetComments(text) {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/\{\{\/\/[\s\S]*?\}\}/g, '')
        .replace(/^[ \t]*\/\/\*.*?(?:\*+\/+|\*\/)?[ \t]*(?:\r?\n|$)/gm, '')
        .replace(/\/\/\*[\s\S]*?(?:\*+\/+|\*\/)/g, '')
        .replace(/[ \t]+\/\/\*.*?(?:\*+\/+|\*\/)?(?=$|\r?\n)/g, '')
        .replace(/(\r?\n){3,}/g, '$1$1')
        .trim();
}

function randToken(n) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    try {
        const arr = new Uint8Array(n);
        crypto.getRandomValues(arr);
        for (let i = 0; i < n; i++) s += chars[arr[i] % chars.length];
    } catch (e) {
        for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
}

/* 变量：{@setvar::名::值@} 存下来，{@getvar::名@} 换成值。
   作用域 scope 由调用方传进来跨条目共用（配置中心里的 setvar 才能被后面的条目读到）。
   if 块本插件不判条件，只把标记去掉、内容保留；{{roll N}} 换成随机串。 */
function applyPresetVariables(text, scope) {
    const vars = scope || Object.create(null);
    let out = String(text).replace(/\{@setvar::([^:@]+)::([\s\S]*?)@\}/g, (m, k, v) => {
        vars[String(k).trim()] = String(v);
        return '';
    });
    out = out.replace(/\{@getvar::([^@]+)@\}/g, (m, k) => {
        const key = String(k).trim();
        return vars[key] === undefined ? '' : vars[key];
    });
    out = out.replace(/\{@if[^@]*@\}/g, '').replace(/\{@\/if@\}/g, '');
    out = out.replace(/\{\{roll\s+\d+\}\}/gi, () => randToken(10));
    return out;
}

/* 上下文预设分两套：lib = 档案库/自动记录，gen = 手动生成。两套互不影响。 */
function presetBag(scope) {
    if (scope === 'gen') return S.presetsGen || {};
    if (scope === 'ranobe') return S.presetsRanobe || {};
    return S.presets || {};
}

function presetNames(scope) {
    return Object.keys(presetBag(scope));
}

/* 自动生成（lib）的上下文预设：选择跟着角色卡走，机制跟档案模板一模一样；
   另外能上一把锁 —— 锁住的卡固定用这份预设，换卡、导入新预设都不会被顺手切走。
   手动生成 / 同人库那两套还是全局一份，不受影响。 */
function libPresetNameOfCard() {
    const map = S.presetNameByCard;
    const bag = S.presets || {};
    const k = cardKey();
    const has = !!(map && typeof map === 'object' && Object.prototype.hasOwnProperty.call(map, k));
    /* 这张卡还没单独选过 → 沿用原来那份全局选择，老用户不会被重置 */
    let name = has ? String(map[k] == null ? '' : map[k]) : String(S.presetName == null ? '' : S.presetName);
    if (name && !bag[name]) name = '';   /* 那份预设被删了 → 回退到第一个 */
    return name;
}

function libPresetLocked() {
    const m = S.presetLockByCard;
    return !!(m && typeof m === 'object' && m[cardKey()]);
}

/* 写「当前预设」的统一入口：lib 按卡记（锁住就拒绝），其它 scope 照旧写全局 */
function setPresetNameOfScope(scope, name) {
    if (scope === 'lib') {
        if (libPresetLocked()) return false;
        if (!S.presetNameByCard || typeof S.presetNameByCard !== 'object' || Array.isArray(S.presetNameByCard)) S.presetNameByCard = {};
        /* 显式写空串 = 这张卡没选（回退第一个），别再回退到全局那个旧值 */
        S.presetNameByCard[cardKey()] = (name && (S.presets || {})[name]) ? String(name) : '';
        return true;
    }
    S[presetKey(scope, 'Name')] = String(name || '');
    return true;
}

function setLibPresetLock(on) {
    if (!S.presetLockByCard || typeof S.presetLockByCard !== 'object' || Array.isArray(S.presetLockByCard)) S.presetLockByCard = {};
    const k = cardKey();
    if (on) S.presetLockByCard[k] = true; else delete S.presetLockByCard[k];
    saveSettings(true);
    renderPresetCard('lib');
}

function toggleLibPresetLock() {
    const next = !libPresetLocked();
    setLibPresetLock(next);
    const nm = activePresetName('lib') || '（还没导入预设）';
    log(next ? ('上下文预设已锁定：这张角色卡固定用「' + nm + '」') : '上下文预设已解锁：这张角色卡可以换预设了');
    toast(next ? ('已锁定：这张角色卡用「' + nm + '」') : '已解锁，可以换预设了');
    return next;
}

function activePresetName(scope) {
    const names = presetNames(scope);
    const cur = scope === 'gen' ? S.genPresetName
        : (scope === 'ranobe' ? S.ranobePresetName : libPresetNameOfCard());
    if (cur && presetBag(scope)[cur]) return cur;
    return names[0] || '';
}

function presetEntries(name, scope) {
    const p = presetBag(scope)[name || activePresetName(scope)];
    return p && Array.isArray(p.entries) ? p.entries : [];
}

function presetEnabledOf(scope) {
    if (scope === 'gen') return !!S.genPresetEnabled;
    if (scope === 'ranobe') return !!S.ranobePresetEnabled;
    return !!S.presetEnabled;
}

function presetMergeOf(scope) {
    const v = scope === 'gen' ? S.genPresetMergeSystem
        : (scope === 'ranobe' ? S.ranobePresetMergeSystem : S.presetMergeSystem);
    return v !== false;
}

/* 每个占位符这次要填的内容 */
function presetBlocks(text, pack) {
    const origins = (pack && pack.origins) || [];
    const olds = (pack && pack.olds) || [];
    const originText = origins.length
        ? origins.map((o) => '—— ' + o.name + ' ——\n' + o.content).join('\n\n')
        : '（本轮没有角色卡设定可用）';
    const oldText = olds.length
        ? olds.map((o) => '—— ' + o.name + ' ——\n' + o.content).join('\n\n')
        : '（本轮没有从档案库里取到旧 DNA：正文里的角色全部按新建处理，按「条目一：收录规则」逐个人物建档。）';
    return {
        '{{正文}}': text,
        '{{角色卡设定}}': originText,
        /* 世界书检索功能已移除，占位符保留但填空，避免旧预设里残留原样文字 */
        '{{世界书设定}}': '',
        '{{旧档案}}': oldText,
        '{{收录规则}}': COLLECT_RULES,
        '{{字段规范}}': tplRules(),
        '{{输出格式}}': tplFormat()
    };
}

/* 同一个 role 的相邻条目合并（含【ToolCall引导】的不合并，和智绘姬的规则一致） */
function mergeSameRole(messages) {
    const out = [];
    const keepApart = (m) => String(m.content || '').indexOf('【ToolCall引导】') >= 0;
    for (const m of messages) {
        if (!m || !m.content) continue;
        const prev = out[out.length - 1];
        if (prev && prev.role === m.role && !keepApart(prev) && !keepApart(m)) {
            prev.content = prev.content + '\n\n' + m.content;
        } else {
            out.push({ role: m.role, content: m.content });
        }
    }
    return out;
}

/* 有的中转（尤其 Gemini 系）只认开头一条 system，中间夹 system 会直接吐空内容。
   默认把 system 全部合并到最前面一条，其余角色顺序不动。 */
function systemFirst(messages) {
    const sys = [];
    const rest = [];
    for (const m of messages) {
        if (m.role === 'system') sys.push(m.content);
        else rest.push(m);
    }
    if (!sys.length) return rest;
    return [{ role: 'system', content: sys.join('\n\n') }].concat(rest);
}

/* 把预设条目组装成 messages */
function assemblePresetMessages(text, pack, scope) {
    const list = presetEntries(undefined, scope);
    const vars = presetBlocks(text, pack);
    const alias = {
        '{{剧情正文}}': '{{正文}}',
        '{{DNA_TEXT}}': '{{正文}}',
        '{{DNA_ORIGINS}}': '{{角色卡设定}}',
        '{{DNA_OLDS}}': '{{旧档案}}',
        '{{DNA_RULES}}': '{{收录规则}}',
        '{{DNA_FIELDS}}': '{{字段规范}}',
        '{{DNA_FORMAT}}': '{{输出格式}}'
    };
    const used = new Set();
    const triggerText = String(text || '');
    const varScope = Object.create(null);   // setvar/getvar 跨条目共用
    const msgs = [];
    for (const en of list) {
        if (!en || en.enabled === false) continue;
        if (en.triggerMode === 'trigger') {
            const any = String(en.triggerWords || '').split(/[\n,，;；|]+/).map((x) => x.trim()).filter(Boolean);
            const all = String(en.andTriggerWords || '').split(/[\n,，;；|]+/).map((x) => x.trim()).filter(Boolean);
            if ((any.length && !any.some((w) => triggerText.indexOf(w) >= 0)) || (all.length && !all.every((w) => triggerText.indexOf(w) >= 0))) continue;
        }
        let c = stripPresetComments(en.content || '');
        if (!c) continue;
        c = applyPresetVariables(c, varScope);
        /* 纯 setvar/注释的条目（比如配置中心）处理完就空了，不用发出去 */
        if (!c.trim()) continue;
        for (const k of Object.keys(alias)) {
            if (c.indexOf(k) >= 0) c = c.split(k).join(alias[k]);
        }
        for (const k of Object.keys(vars)) {
            if (c.indexOf(k) >= 0) { c = c.split(k).join(vars[k]); used.add(k); }
        }
        msgs.push({ role: PRESET_ROLES.includes(en.role) ? en.role : 'user', content: c });
    }
    /* 预设里没用到的块逐个补在最后一条 user 消息里。
       以前只在「没写 {{正文}}」时补，于是「写了 {{正文}}、没写 {{旧档案}}」的预设
       会把已经记录过的角色档案静默丢掉——增量更新退化成重新建档。 */
    const tail = [];
    if (pack && !used.has('{{角色卡设定}}') && pack.origins && pack.origins.length) {
        tail.push('【角色卡里的角色设定】');
        tail.push(pack.origins.map((o) => '—— ' + o.name + ' ——\n' + o.content).join('\n\n'));
    }
    if (pack && !used.has('{{旧档案}}') && pack.olds && pack.olds.length) {
        tail.push('【这些角色上次记录的档案】');
        tail.push('这些角色档案库里已经有了。正文里出现它们时按当前剧情增量更新，姓名、别称、核心DNA、服装DNA 原样沿用，不要新建同名档案。');
        tail.push(pack.olds.map((o) => '—— ' + o.name + ' ——\n' + o.content).join('\n\n'));
    }
    if (!used.has('{{正文}}')) {
        tail.push('【剧情正文】');
        tail.push(text);
    }
    /* 自建模板多出来的字段：预设里没引用 {{字段规范}} 就补一段字段清单，
       否则内置预设那句「固定十二个字段、禁止增加」会把新字段压掉，
       模型永远不输出它，档案里一直空着，发送数据里自然也没有。 */
    if (!used.has('{{字段规范}}')) {
        const spec = tplFieldSpecBlock();
        if (spec) tail.push(spec);
    }
    if (tail.length) msgs.push({ role: 'user', content: tail.join('\n\n') });
    const merged = mergeSameRole(msgs);
    return presetMergeOf(scope) ? systemFirst(merged) : merged;
}

/* 统一入口：开了预设就用预设组装，否则用内置 batchPrompt。
   scope：lib = 档案库/自动记录（默认），gen = 手动生成 */
function buildRecordPrompt(text, pack, scope) {
    if (presetEnabledOf(scope) && presetEntries(undefined, scope).length) return assemblePresetMessages(text, pack, scope);
    return batchPrompt(text, pack);
}

function normalizeMessages(prompt) {
    if (Array.isArray(prompt)) {
        return prompt
            .filter((m) => m && m.content && String(m.content).trim())
            .map((m) => ({ role: PRESET_ROLES.includes(m.role) ? m.role : 'user', content: String(m.content) }));
    }
    return [{ role: 'user', content: String(prompt == null ? '' : prompt) }];
}

function promptChars(prompt) {
    return normalizeMessages(prompt).reduce((n, m) => n + m.content.length, 0);
}

/* 把导入文件拆成 { 预设名: entries[] } */
function normalizePresetEntries(arr) {
    if (!Array.isArray(arr)) return null;
    const out = [];
    for (const e of arr) {
        if (!e || typeof e !== 'object') continue;
        const content = typeof e.content === 'string' ? e.content : '';
        if (!content.trim()) continue;
        out.push({
            id: String(e.id || ('dna_imp_' + out.length + '_' + Date.now())),
            name: String(e.name || ('条目 ' + (out.length + 1))),
            role: PRESET_ROLES.includes(e.role) ? e.role : 'system',
            content,
            enabled: e.enabled !== false,
            triggerMode: e.triggerMode === 'trigger' ? 'trigger' : 'always',
            triggerWords: String(e.triggerWords || ''),
            andTriggerWords: String(e.andTriggerWords || '')
        });
    }
    return out.length ? out : null;
}

function pickPresetsFromFile(data) {
    const out = {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) return out;
    if (Array.isArray(data.entries)) {
        const list = normalizePresetEntries(data.entries);
        if (list) out[String(data.name || '').trim() || '导入的预设'] = list;
        return out;
    }
    if (data.context_presets && typeof data.context_presets === 'object') {
        for (const k of Object.keys(data.context_presets)) {
            const v = data.context_presets[k];
            const list = normalizePresetEntries(v && v.entries);
            if (list) out[k] = list;
        }
        if (Object.keys(out).length) return out;
    }
    for (const k of Object.keys(data)) {
        const v = data[k];
        if (!v || typeof v !== 'object') continue;
        const list = normalizePresetEntries(v.entries);
        if (list) out[k] = list;
    }
    return out;
}

/* 导入时顺手登记到智绘姬「LLM」页签的上下文预设列表，那边也能直接选到 */
function mirrorToChatu8(names, scope) {
    if (scope === 'gen' || scope === 'ranobe') return false;   // 手动生成 / 同人库那两套是 DNA 专用，不登记到智绘姬，免得互相覆盖
    try {
        const ch = extension_settings[CHATU8];
        if (!ch) return false;
        if (!ch.test_context_profiles || typeof ch.test_context_profiles !== 'object') ch.test_context_profiles = {};
        for (const n of names) {
            const src = presetBag(scope)[n];
            if (src) ch.test_context_profiles[n] = { entries: JSON.parse(JSON.stringify(src.entries)) };
        }
        saveSettingsDebounced();
        return true;
    } catch (e) {
        return false;
    }
}

function importPreset(ev, scope) {
    const input = ev.target;
    const file = input.files && input.files[0];
    if (!file) return;
    const bag = presetBag(scope);
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(String(reader.result || ''));
            const found = pickPresetsFromFile(data);
            const names = Object.keys(found);
            if (!names.length) throw new Error('文件里没找到 entries 条目（不是上下文预设格式？）');
            const now = Date.now();
            for (const n of names) {
                bag[n] = { entries: found[n], importedAt: now, source: file.name };
            }
            const switched = setPresetNameOfScope(scope, names[0]);
            S[presetKey(scope, 'Enabled')] = true;
            saveSettings(true);
            const mirrored = mirrorToChatu8(names, scope);
            renderPresetCard(scope);
            log('已导入上下文预设：' + names.join('、') + '（' + found[names[0]].length + ' 条，已启用）');
            if (mirrored) log('已同步登记到智绘姬「LLM」页签的上下文预设列表');
            toast(switched
                ? ('已导入上下文预设：' + names[0] + '（' + found[names[0]].length + ' 条）')
                : ('已导入上下文预设：' + names[0] + '（这张卡已锁定，预设没切过去）'));
        } catch (e) {
            log('导入上下文预设失败：' + (e && e.message ? e.message : e), 'error');
            toast('导入失败：' + (e && e.message ? e.message : e), 'error');
        } finally {
            input.value = '';
        }
    };
    reader.readAsText(file, 'utf-8');
}

/* 导出一份预设（格式和智绘姬「LLM → 测试上下文」完全一致，能再导回去） */
function exportPreset(scope) {
    const n = activePresetName(scope);
    if (!n) { toast('还没有导入预设，没东西可导出'); return; }
    const list = presetEntries(n, scope);
    if (!list.length) { toast('这份预设是空的'); return; }
    const payload = {};
    payload[n] = {
        entries: list.map((e) => ({
            id: String(e.id || ''),
            name: String(e.name || ''),
            role: PRESET_ROLES.includes(e.role) ? e.role : 'system',
            content: String(e.content || ''),
            enabled: e.enabled !== false,
            triggerMode: e.triggerMode === 'trigger' ? 'trigger' : 'always',
            triggerWords: String(e.triggerWords || ''),
            andTriggerWords: String(e.andTriggerWords || '')
        }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = String(n).replace(/[\\/:*?"<>|]/g, '_');
    a.href = url;
    a.download = '上下文预设_' + safe + '_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    log('已导出上下文预设「' + n + '」（' + list.length + ' 条）');
    toast('已导出「' + n + '」');
}

/* 改预设名字：DNA 这边改名，智绘姬那份副本也跟着改 */
function renamePreset(scope) {
    const bag = presetBag(scope);
    const old = activePresetName(scope);
    if (!old) { toast('还没有导入预设'); return; }
    const input = prompt('给预设改个新名字：', old);
    if (input === null) return;                       // 点了取消
    const next = String(input).trim();
    if (!next) { toast('名字不能为空', 'error'); return; }
    if (next === old) return;
    if (bag[next]) { toast('已经有同名预设了，换一个名字', 'error'); return; }

    bag[next] = bag[old];
    delete bag[old];
    const switchedByRename = setPresetNameOfScope(scope, next);
    saveSettings(true);
    if (scope === 'gen' || scope === 'ranobe') {
        renderPresetCard(scope);
        log(presetScopeLabel(scope) + '预设改名：' + old + ' → ' + next);
        toast('已改名为「' + next + '」');
        return;
    }

    /* 智绘姬「LLM」页签里那份副本同步改名（原来那键删掉，新键写上最新内容） */
    try {
        const ch = extension_settings[CHATU8];
        if (ch && ch.test_context_profiles && typeof ch.test_context_profiles === 'object') {
            delete ch.test_context_profiles[old];
            ch.test_context_profiles[next] = { entries: JSON.parse(JSON.stringify(S.presets[next].entries || [])) };
            /* 智绘姬自己正选中这份的话，指针也跟着挪，不然它那边会指向一个不存在的名字 */
            if (ch.current_test_context_profile === old) ch.current_test_context_profile = next;
            saveSettingsDebounced();
        }
    } catch (e) { /* 智绘姬没就绪就算了，DNA 这边已经改好 */ }

    renderPresetCard(scope);
    log('预设改名：' + old + ' → ' + next);
    toast(switchedByRename
        ? ('已改名为「' + next + '」')
        : ('已改名为「' + next + '」（这张卡已锁定，没自动切过去）'));
}

/* 「保存」：把当前这份预设立刻落盘。档案库那份还会同步给智绘姬 LLM 页签里的副本，
   不然 DNA 这边改完，智绘姬测试工具用的还是旧内容。 */
function onPresetSave(scope) {
    const n = activePresetName(scope);
    if (!n) { toast('还没有导入预设', 'error'); return; }
    const bag = presetBag(scope);
    const cur = bag && bag[n];
    if (!cur || !Array.isArray(cur.entries) || !cur.entries.length) { toast('这份预设里没有内容', 'error'); return; }
    const total = cur.entries.length;
    const on = cur.entries.filter((e) => e && e.enabled).length;
    let synced = false;
    /* 只同步档案库那份：另外两套只在本插件里用，不往智绘姬那边塞，免得撞名覆盖 */
    if (scope === 'lib') {
        try {
            const ch = extension_settings[CHATU8];
            if (ch && ch.test_context_profiles && typeof ch.test_context_profiles === 'object') {
                ch.test_context_profiles[n] = { entries: JSON.parse(JSON.stringify(cur.entries)) };
                synced = true;
            }
        } catch (e) { /* 智绘姬没就绪就算了，DNA 这边已经存好 */ }
    }
    try { saveSettings(true); } catch (e) { /* 忽略 */ }
    log('已保存预设「' + n + '」（' + presetScopeLabel(scope) + '，' + on + '/' + total + ' 条启用）');
    toast('已保存「' + n + '」 · ' + on + '/' + total + ' 条启用' + (synced ? '，智绘姬那边已同步' : ''));
}

/* 删掉当前这套里选中的预设 */
function removePreset(scope) {
    const n = activePresetName(scope);
    if (!n) { toast('还没有导入预设'); return; }
    if (!confirm('删除预设「' + n + '」？' + ((scope === 'gen' || scope === 'ranobe') ? '' : '\n（智绘姬「LLM」页签里那份不会被删）'))) return;
    delete presetBag(scope)[n];
    const rest = presetNames(scope)[0] || '';
    setPresetNameOfScope(scope, rest);
    if (!presetNames(scope).length) S[presetKey(scope, 'Enabled')] = false;
    saveSettings(true);
    renderPresetCard(scope);
    log('已删除' + presetScopeLabel(scope) + '预设：' + n);
}

/* ------------------------- 内置默认预设 ------------------------- */
/* 档案库那份：读剧情正文检索人物生成 DNA（纯 ASCII 文件名，避免解压后中文名取不到） */
const DEFAULT_PRESET_FILE = 'presets/st_chatu8_lib_storytext_9fields_v3.json';
const DEFAULT_PRESET_NAME = '昆仑DNA档案记录版';
/* 上一版内置预设的名字：装新版时自动退场，免得库里堆两份 */
const LEGACY_PRESET_NAMES = ['昆仑DNA档案记录版 · 九字段'];
/* 手动生成那份：读世界书条目 / 角色管理设定，不读剧情正文 */
const DEFAULT_GEN_PRESET_FILE = 'presets/st_chatu8_gen_worldbook_chars_v3.json';   // 纯 ASCII 文件名，避免解压后中文名取不到
const DEFAULT_GEN_PRESET_NAME = '昆仑DNA建档版 · 世界书角色';
/* 同人资料库 / 按世界书生成：这两页共用一份上下文预设（内置一份同人版） */
const DEFAULT_RANOBE_PRESET_FILE = 'presets/st_chatu8_ranobe_fanfic_v1.json';
const DEFAULT_RANOBE_PRESET_NAME = '昆仑DNA同人档案记录版';
/* 内置同人库：旧的单文件 JSON（44MB）在手机上经常读不出来，已经删掉了。
   现在改用插件自带的分类条目包：8089 个分类 json 装在一个 zip 里，
   点「重载内置库」时才用 JSZip 解压合并（解压要十几秒，所以不做自动加载）。 */
const RANOBE_ZIP_FILE = 'data/ranobe_categories.zip';
let RANOBE_WORKS = {};   // 作品 tag → 中文作品名（语料文件的 works 表，分类显示直接用这个）

/* 内置预设的版本号：动了 presets/ 里那两个文件的内容，就把这里一起改掉。
   老用户下次进来自动重装内置预设（自己导入 / 新建的预设一律不动）。
   以前只看「装过没有」，所以插件升级后规则改了，用户库里那份永远不会变——这就是「改了没生效」。 */
const BUILTIN_PRESET_VER = 'v2.9.29';


/* 装一次内置默认预设。装过就记住（seedPreset），以后就算删掉也不会每次刷新又冒出来 */
async function ensureDefaultPreset(force) {
    /* 装过同一个版本就不再动；内置预设改版（BUILTIN_PRESET_VER 变了）自动重装一次 */
    if (!force && S.seedPreset === DEFAULT_PRESET_FILE && S.seedPresetVer === BUILTIN_PRESET_VER) return false;
    try {
        const url = new URL(DEFAULT_PRESET_FILE, import.meta.url).toString();
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) { log('内置默认预设读取失败：HTTP ' + res.status, 'error'); return false; }
        const data = await res.json();
        const found = pickPresetsFromFile(data);
        const names = Object.keys(found);
        if (!names.length) { log('内置默认预设里没找到条目', 'error'); return false; }
        for (const n of names) {
            S.presets[n] = { entries: found[n], importedAt: Date.now(), source: '内置默认预设' };
        }
        /* 上一版内置预设自动退场（只删我们自己装的，用户自己导入的不动） */
        for (const legacy of LEGACY_PRESET_NAMES) {
            if (names.indexOf(legacy) >= 0) continue;
            if (S.presets[legacy] && S.presets[legacy].source === '内置默认预设') {
                delete S.presets[legacy];
                log('已移除上一版内置预设「' + legacy + '」');
            }
        }
        /* 装内置默认预设这一次，顺手把它切成当前用的那份（只此一次，之后你手动选什么就是什么） */
        S.presetName = (S.presetName && S.presets[S.presetName]) ? S.presetName : names[0];
        S.presetEnabled = true;
        S.seedPreset = DEFAULT_PRESET_FILE;
        S.seedPresetVer = BUILTIN_PRESET_VER;
        patchPresetStart();
        saveSettings(true);
        try { mirrorToChatu8(names); } catch (e) { /* 智绘姬没就绪不影响 */ }
        log('已装好内置默认预设「' + names[0] + '」（' + found[names[0]].length + ' 条）');
        return true;
    } catch (e) {
        log('装内置默认预设失败：' + (e && e.message ? e.message : e), 'error');
        return false;
    }
}

/* 老用户迁移：以前手动生成借用的是档案库那份预设，升级后两套分开，
   所以把档案库那份复制一份给手动生成，行为不中断（只做一次，之后各管各的）。 */
function migrateGenPresets() {
    if (S.genPresetSeeded) return false;
    S.genPresetSeeded = true;
    if (Object.keys(S.presetsGen || {}).length) { saveSettings(true); return false; }
    const src = S.presets || {};
    const names = Object.keys(src);
    if (!names.length) { saveSettings(true); return false; }
    try {
        S.presetsGen = JSON.parse(JSON.stringify(src));
    } catch (e) {
        S.presetsGen = {};
        saveSettings(true);
        return false;
    }
    S.genPresetName = (S.presetName && S.presetsGen[S.presetName]) ? S.presetName : names[0];
    S.genPresetEnabled = !!S.presetEnabled;
    saveSettings(true);
    log('已把档案库的 ' + names.length + ' 份预设复制给手动生成（两套从此各管各的）');
    return true;
}

/* 装一次手动生成的内置预设（读世界书 / 角色管理那套）。装过就记住，删掉也不会自己冒回来 */
async function ensureDefaultGenPreset(force) {
    if (!force && S.seedGenPreset === DEFAULT_GEN_PRESET_FILE && S.seedGenPresetVer === BUILTIN_PRESET_VER) return false;
    try {
        const url = new URL(DEFAULT_GEN_PRESET_FILE, import.meta.url).toString();
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) { log('内置手动生成预设读取失败：HTTP ' + res.status, 'error'); return false; }
        const data = await res.json();
        const found = pickPresetsFromFile(data);
        const names = Object.keys(found);
        if (!names.length) { log('内置手动生成预设里没找到条目', 'error'); return false; }
        for (const n of names) {
            S.presetsGen[n] = { entries: found[n], importedAt: Date.now(), source: '内置默认预设' };
        }
        /* 装这一次顺手切成当前用的那份，之后你手动选什么就是什么 */
        S.genPresetName = (S.genPresetName && S.presetsGen[S.genPresetName]) ? S.genPresetName : names[0];
        S.genPresetEnabled = true;
        S.seedGenPreset = DEFAULT_GEN_PRESET_FILE;
        S.seedGenPresetVer = BUILTIN_PRESET_VER;
        saveSettings(true);
        log('已装好手动生成预设「' + names[0] + '」（' + found[names[0]].length + ' 条）');
        return true;
    } catch (e) {
        log('装手动生成预设失败：' + (e && e.message ? e.message : e), 'error');
        return false;
    }
}

/* 用户点「更新内置」时走这里：把那份内置预设强制刷成插件里的最新版本。
   只管内置那一份，自己导入 / 新建的预设一概不动。 */
/* 内置同人预设：装过一次就不再动，内置改版（BUILTIN_PRESET_VER 变了）自动重装 */
async function ensureDefaultRanobePreset(force) {
    if (!force && S.seedRanobePreset === DEFAULT_RANOBE_PRESET_FILE && S.seedRanobePresetVer === BUILTIN_PRESET_VER) return false;
    try {
        const url = new URL(DEFAULT_RANOBE_PRESET_FILE, import.meta.url).toString();
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) { log('内置同人预设读取失败：HTTP ' + res.status, 'error'); return false; }
        const data = await res.json();
        const found = pickPresetsFromFile(data);
        const names = Object.keys(found);
        if (!names.length) { log('内置同人预设里没找到条目', 'error'); return false; }
        for (const n of names) {
            S.presetsRanobe[n] = { entries: found[n], importedAt: Date.now(), source: '内置默认预设' };
        }
        S.ranobePresetName = (S.ranobePresetName && S.presetsRanobe[S.ranobePresetName]) ? S.ranobePresetName : names[0];
        S.ranobePresetEnabled = true;
        S.seedRanobePreset = DEFAULT_RANOBE_PRESET_FILE;
        S.seedRanobePresetVer = BUILTIN_PRESET_VER;
        patchPresetStart();
        saveSettings(true);
        log('已装好同人库预设「' + names[0] + '」（' + found[names[0]].length + ' 条）');
        return true;
    } catch (e) {
        log('装同人库预设失败：' + (e && e.message ? e.message : e), 'error');
        return false;
    }
}

/* ------------------------------ 同人资料库 / 按世界书：数据层 ------------------------------ */
/* 一条条目统一成 { k, n, a, c, w, t, p, d, x }：
   k 唯一键、n 名字、a 别名数组、c 全名标识、w 作品、t 角色tag、p 生图前缀、d 默认服装、x 完整记录文本。 */
function normLibEntry(raw, fallbackK) {
    const o = (raw && typeof raw === 'object') ? raw : {};
    const str = (v) => (v == null ? '' : String(v));
    const arr = Array.isArray(o.a)
        ? o.a.map(str).map((x) => x.trim()).filter(Boolean)
        : str(o.a).split(/[、,，]/).map((x) => x.trim()).filter(Boolean);
    return {
        k: str(o.k || fallbackK),
        n: str(o.n || o.name || o['姓名']).trim(),
        a: arr,
        c: str(o.c),
        w: str(o.w),
        t: str(o.t),
        p: str(o.p),
        d: str(o.d),
        x: str(o.x)
    };
}


/* 同人库里的作品（IP）在数据里是英文 slug（senran_kagura），这里配上中文名。
   表里没有的作品（用户自己导入的库）就把 slug 的下划线换成空格照原样显示。 */
const IP_CN = {
    'senran_kagura': '闪乱神乐',
    'fate_grand_order': 'Fate/Grand Order',
    'blue_archive': '蔚蓝档案',
    'zenless_zone_zero': '绝区零',
    'dragon_ball': '龙珠',
    'league_of_legends': '英雄联盟',
    'honkai_star_rail': '崩坏：星穹铁道',
    'bleach': '死神',
    'fire_emblem': '火焰纹章',
    'fire_emblem_three_houses': '火焰纹章：风花雪月',
    'komi_san_wa_komyushou_desu': '古见同学有交流障碍症',
    'youkoso_jitsuryoku_shijou_shugi_no_kyoushitsu_e': '欢迎来到实力至上主义的教室',
    'tensei_shitara_slime_datta_ken': '关于我转生变成史莱姆这档事',
    'to_love_ru': '出包王女',
    'overwatch': '守望先锋',
    'kakegurui': '狂赌之渊',
    'dungeon_meshi': '迷宫饭',
    'mushoku_tensei': '无职转生',
    'fate_kaleid_liner_prisma_illya': 'Fate/kaleid liner 魔法少女伊莉雅',
    'toaru_kagaku_no_railgun': '某科学的超电磁炮',
    'naruto_shippuuden': '火影忍者疾风传',
    'make_heroine_ga_oo_sugiru': '败犬女主太多了',
    'fullmetal_alchemist': '钢之炼金术师',
    'infinite_stratos': 'IS〈无限斯特拉托斯〉',
    'no_game_no_life': '游戏人生',
    'yahari_ore_no_seishun_lovecome_wa_machigatteiru': '我的青春恋爱物语果然有问题',
    'meitantei_conan': '名侦探柯南',
    'ikkitousen': '一骑当千',
    'cardcaptor_sakura': '魔卡少女樱',
    'kami_nomi_zo_shiru_sekai': '只有神知道的世界',
    'oshi_no_ko': '我推的孩子',
    'bishoujo_senshi_sailor_moon': '美少女战士',
    'lycoris_recoil': '莉可丽丝',
    'fate_series': 'Fate 系列',
    'keijo': '竞女',
    'musaigen_no_phantom_world': '无彩限的怪灵世界',
    'saenai_heroine_no_sodatekata': '路人女主的养成方法',
    'sora_no_otoshimono': '天降之物',
    'sono_bisque_doll_wa_koi_wo_suru': '更衣人偶坠入爱河',
    'tokidoki_bosotto_roshia_go_de_dereru_tonari_no_alya_san': '邻座的艾莉同学',
    'kuroinu': '黑兽',
    'kaichou_wa_maid_sama': '会长是女仆大人',
    'one_piece': '海贼王',
    'bokutachi_wa_benkyou_ga_dekinai': '我们无法一起学习',
    'kobayashi_san_chi_no_maidragon': '小林家的龙女仆',
    'ssss_gridman': 'SSSS.GRIDMAN',
    'kimetsu_no_yaiba': '鬼灭之刃',
    'azur_lane': '碧蓝航线',
    'bocchi_the_rock': '孤独摇滚',
    'saiki_kusuo_no_sainan': '齐木楠雄的灾难',
    'grand_blue': '碧蓝之海',
    'crayon_shin-chan': '蜡笔小新',
    'amagi_brilliant_park': '甘城光辉游乐园',
    'chuunibyou_demo_koi_ga_shitai': '中二病也要谈恋爱',
    'k_on': '轻音少女',
    'kanojo_okarishimasu': '租借女友',
    'sakura_sou_no_pet_na_kanojo': '樱花庄的宠物女孩',
    'ore_no_imouto_ga_konna_ni_kawaii_wake_ga_nai': '我的妹妹哪有这么可爱',
    'fate_extra': 'Fate/EXTRA',
    'persona_5': '女神异闻录5',
    'fairy_tail': '妖精的尾巴',
    'genshin_impact': '原神',
    're_zero_kara_hajimeru_isekai_seikatsu': 'Re:从零开始的异世界生活',
    'jujutsu_kaisen': '咒术回战',
    'shingeki_no_kyojin': '进击的巨人',
    'chainsaw_man': '电锯人',
    'code_geass': '叛逆的鲁路修',
    'one_punch_man': '一拳超人',
    'enen_no_shouboutai': '炎炎消防队',
    'senpai_ga_uzai_kouhai_no_hanashi': '前辈有够烦',
    'suzumiya_haruhi_no_yuuutsu': '凉宫春日的忧郁',
    'princess_connect': '公主连结',
    'dandadan': '胆大党',
    'spy_x_family': '间谍过家家',
    'love_plus': 'Love Plus',
    'kaguya_sama_wa_kokurasetai': '辉夜大小姐想让我告白',
    'the_legend_of_zelda': '塞尔达传说',
    'nisekoi': '伪恋',
    'hanamaru_youchien': '花丸幼稚园',
    'ryuuou_no_oshigoto': '龙王的工作',
    'doraemon': '哆啦A梦',
    'cats_eye': '猫眼三姐妹',
    'mobile_police_patlabor': '机动警察',
    'taiho_shichau_zo': '逮捕令',
    'city_hunter': '城市猎人',
    'bubblegum_crisis': '泡泡糖危机',
    'read_or_die': 'Read or Die',
    'kekkai_sensen': '血界战线',
    'black_lagoon': '黑礁',
    'psycho_pass': 'PSYCHO-PASS',
    'durarara': '无头骑士异闻录',
    'boruto_naruto_next_generations': '博人传',
    'naruto_series': '火影忍者系列',
    'toaru_majutsu_no_index': '魔法禁书目录',
    'eromanga_sensei': '情色漫画老师',
    'gakuen_idolmaster': '学园偶像大师',
    'toradora': '龙与虎',
    'tokyo_ghoul': '东京喰种',
    'final_fantasy_vii': '最终幻想VII',
    'boku_wa_tomodachi_ga_sukunai': '我的朋友很少',
    'gunsmith_cats': '枪神',
    'darker_than_black': '黑之契约者',
    'planetes': '星空清理者',
    'canaan': 'CANAAN',
    'michiko_to_hatchin': '道子与哈金',
    'azumanga_daioh': '阿滋漫画大王',
    'shokugeki_no_souma': '食戟之灵',
    'nande_koko_ni_sensei_ga': '为什么老师会在这里',
    'domestic_na_kanojo': '家有女友',
    'fate_zero': 'Fate/Zero',
    'koi_wa_ameagari_no_you_ni': '恋如雨止',
    'highschool_of_the_dead': '学园默示录',
    'fate_stay_night': 'Fate/stay night',
    'bleach_zanpakutou_ibun_hen': '死神 斩魄刀异闻篇',
    'ijiranaide_nagatoro_san': '不要欺负我，长瀞同学',
    'mahou_shoujo_ni_akogarete': '憧憬成为魔法少女',
    'touhou': '东方Project',
    'majo_no_tabitabi': '魔女之旅',
    'bang_dream': 'BanG Dream!',
    'nonohara_yuka_no_himitsu_no_haishin': '野野原优香的秘密配信',
    'oni_chichi': '鬼父',
    'kantai_collection': '舰队Collection',
    'sousou_no_frieren': '葬送的芙莉莲',
    'umamusume': '赛马娘',
    'kono_subarashii_sekai_ni_shukufuku_wo': '为美好的世界献上祝福',
    'isekai_ojisan': '异世界舅舅',
    'uzaki_chan_wa_asobitai': '宇崎学妹想要玩',
    'atelier_ryza': '莱莎的炼金工房',
    'xenoblade_chronicles_series': '异度神剑系列',
    'hataraku_saibou': '工作细胞',
    'monogatari_series': '物语系列',
    'vtuber': 'VTuber（虚拟主播）',
    'black_bullet': '漆黑的子弹',
    'senren_banka': '千恋万花',
    'machine_doll_wa_kizutsukanai': '机巧少女不会受伤',
    'huyao_xiao_hongniang': '狐妖小红娘',
    'hidan_no_aria': '绯弹的亚里亚',
    'neon_genesis_evangelion': '新世纪福音战士',
    'snowbreak': '尘白禁区',
    'aether_gazer': '深空之眼',
    'girls_frontline': '少女前线',
    'project_sekai': '世界计划缤纷舞台',
    'arknights': '明日方舟',
    'wuthering_waves': '鸣潮',
    'honkai_impact_3rd': '崩坏3',
    'nikke': '胜利女神：妮姬',
    'reverse_1999': '重返未来1999',
    'path_to_nowhere': '无期迷途',
    'girls_frontline_2': '少女前线2：追放',
    'punishing_gray_raven': '战双帕弥什',
    'infinity_nikki': '无限暖暖',
    'love_and_deepspace': '恋与深空',
    'tower_of_fantasy': '幻塔',
    'arknights_endfield': '明日方舟：终末地',
    'girls_frontline_neural_cloud': '少女前线：云图计划',
    'honkai_gakuen': '崩坏学园2',
    'pokemon': '宝可梦',
    'hololive': 'hololive',
    'idolmaster': '偶像大师',
    'love_live': 'Love Live!',
    'nijisanji': '彩虹社',
    'mahou_shoujo_madoka_magica': '魔法少女小圆',
    'girls_und_panzer': '少女与战车',
    'precure': '光之美少女',
    'danganronpa': '弹丸论破',
    'jojo_no_kimyou_na_bouken': 'JOJO的奇妙冒险',
    'boku_no_hero_academia': '我的英雄学院',
    'final_fantasy': '最终幻想',
    'gundam': '高达',
    'kemono_friends': '兽娘动物园',
    'granblue_fantasy': '碧蓝幻想',
    'project_moon': '月亮计划',
    'sonic': '刺猬索尼克',
    'digimon': '数码宝贝',
    'tales_of': '传说系列',
    'dragon_quest': '勇者斗恶龙',
    'sword_art_online': '刀剑神域',
    'yu_gi_oh': '游戏王',
    'street_fighter': '街头霸王',
    'mario': '超级马里奥',
    'utau': 'UTAU',
    'nier': '尼尔',
    'persona': '女神异闻录',
    'tsukihime': '月姬',
    'steins_gate': '命运石之门',
    'hunter_x_hunter': '全职猎人',
    'haikyuu': '排球少年',
    'absolute_duo': '绝对可怜Children',
    'amagami': '圣诞之吻',
    'beck': 'BECK',
    'blue_exorcist': '青之驱魔师',
    'bokurano': '地球防卫少年',
    'captain_tsubasa': '足球小将',
    'clannad': 'CLANNAD',
    'corpse_party': '尸体派对',
    'date_a_live': '约会大作战',
    'dead_or_alive': '死或生',
    'dennou_coil': '电脑线圈',
    'eureka_seven': '交响诗篇',
    'full_metal_panic': '全金属狂潮',
    'fushigi_yuugi': '不思议游戏',
    'gakusen_toshi_asterisk': '学战都市Asterisk',
    'gankutsuou': '岩窟王',
    'gintama': '银魂',
    'guilty_crown': '罪恶王冠',
    'guilty_gear': '罪恶装备',
    'gunslinger_girl': '神枪少女',
    'haibane_renmei': '灰羽联盟',
    'hidamari_sketch': '向阳素描',
    'highschool_dxd': '恶魔高校D×D',
    'higurashi': '寒蝉鸣泣之时',
    'honey_and_clover': '蜂蜜与四叶草',
    'hyouka': '冰菓',
    'ichigo_mashimaro': '草莓棉花糖',
    'inuyasha': '犬夜叉',
    'kannagi': '神薙',
    'kara_no_kyoukai': '空之境界',
    'katekyo_hitman_reborn': '家庭教师HITMAN REBORN!',
    'kino_no_tabi': '奇诺之旅',
    'kokoro_connect': '心连·情结',
    'lucky_star': '幸运星',
    'macross': '超时空要塞',
    'madan_no_ou_to_vanadis': '魔弹之王与战姬',
    'magic_knight_rayearth': '魔法骑士',
    'mahou_sensei_negima': '魔法老师',
    'mahou_shoujo_lyrical_nanoha': '魔法少女奈叶',
    'maison_ikkoku': '相聚一刻',
    'melty_blood': 'Melty Blood',
    'mirai_nikki': '未来日记',
    'mushishi': '虫师',
    'nazo_no_kanojo_x': '谜之女友X',
    'noein': '到另一个你的身边',
    'onmyoji': '阴阳师',
    'rakudai_kishi_no_cavalry': '落第骑士英雄谭',
    'ranma_half': '乱马1/2',
    'rozen_maiden': '蔷薇少女',
    'rurouni_kenshin': '浪客剑心',
    'samurai_champloo': '混沌武士',
    'school_days': 'School Days',
    'seirei_tsukai_no_blade_dance': '精灵使的剑舞',
    'sekirei': '鹦鹉女神',
    'senki_zesshou_symphogear': '战姬绝唱',
    'serial_experiments_lain': '玲音',
    'shakugan_no_shana': '灼眼的夏娜',
    'shaman_king': '通灵王',
    'shin_sekai_yori': '来自新世界',
    'shoujo_kakumei_utena': '少女革命',
    'slayers': '秀逗魔导士',
    'soul_eater': '噬魂师',
    'soulcalibur': '灵魂能力',
    'speed_grapher': '极速摄魔',
    'strike_witches': '强袭魔女',
    'tate_no_yuusha_no_nariagari': '盾之勇者成名录',
    'tears_to_tiara': '提亚拉之泪',
    'tekken': '铁拳',
    'tengen_toppa_gurren_lagann': '天元突破红莲螺岩',
    'to_heart': 'ToHeart',
    'true_tears': '真实之泪',
    'umineko': '海猫鸣泣之时',
    'urusei_yatsura': '福星小子',
    'utawarerumono': '传颂之物',
    'white_album': '白色相簿',
    'yosuga_no_sora': '缘之空',
    'yotsubato': '四叶妹妹',
    'yu_yu_hakusho': '幽游白书',
    'yuru_camp': '摇曳露营',
    'yuru_yuri': '摇曳百合',
    'zero_no_tsukaima': '零之使魔',
};

/* 用户给这个分类改过的名字 */
function ipLabelOver(k, scope) {
    const bag = (scope === 'wb' ? (S.wbLib && S.wbLib.ipName) : (S.ranobe && S.ranobe.ipName)) || {};
    const v = bag[k];
    return String(v == null ? '' : v).trim();
}

/* 作品的中文显示名：用户改的名字 > 语料里的作品表 > 内置对照表 > 把 slug 的下划线换成空格 */
function ipLabel(w, scope) {
    const k = String(w == null ? '' : w).trim();
    if (!k) return '未标注作品';
    const over = ipLabelOver(k, scope);
    if (over) return over;
    if (RANOBE_WORKS[k]) return RANOBE_WORKS[k];
    if (IP_CN[k]) return IP_CN[k];
    if (IP_CN[k.toLowerCase()]) return IP_CN[k.toLowerCase()];
    return k.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
}

/* 按显示名找已有分类的 slug（找不到返回空） */
function ipSlugOfName(nm, scope) {
    const want = String(nm == null ? '' : nm).trim();
    if (!want) return '';
    const bag = (scope === 'wb' ? (S.wbLib && S.wbLib.ipName) : (S.ranobe && S.ranobe.ipName)) || {};
    for (const k of Object.keys(bag)) {
        if (String(bag[k] == null ? '' : bag[k]).trim() === want) return k;
    }
    for (const k of Object.keys(IP_CN)) {
        if (IP_CN[k] === want) return k;
    }
    return '';
}

/* 新建分类用的 slug */
function ipNewSlug() {
    return 'u:ip:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* 这份库里有哪些作品，按条目数从多到少 */
/* 分类统计缓存：库没换（同一个数组）+ 自定义分类名没改 → 直接用上次的结果。
   10 万条统计加中文排序在手机上一次几百毫秒，每次渲染都跑就是「点一下卡一下」。 */
const IP_CNT_CACHE = new WeakMap();

function ipNameBag(scope) {
    return (scope === 'wb' ? (S.wbLib && S.wbLib.ipName) : (S.ranobe && S.ranobe.ipName)) || {};
}

function ipCounts(all, scope) {
    const arr = all || [];
    let sig = '';
    try { sig = JSON.stringify(ipNameBag(scope)); } catch (e) { sig = 'x' + Math.random(); }
    let slot = IP_CNT_CACHE.get(arr);
    if (slot && slot[scope] && slot[scope].sig === sig) return slot[scope].list;
    const m = new Map();
    for (const e of arr) {
        const raw = e ? e.w : '';
        const w = String(raw == null ? '' : raw).trim();
        m.set(w, (m.get(w) || 0) + 1);
    }
    /* 自己建的分类，哪怕还没往里放条目，也要出现在列表里 */
    const bag = ipNameBag(scope);
    for (const k of Object.keys(bag)) {
        if (!m.has(k)) m.set(k, 0);
    }
    const list = Array.from(m.entries()).sort((a, b) => b[1] - a[1] || ipLabel(a[0], scope).localeCompare(ipLabel(b[0], scope), 'zh'));
    if (!slot) { slot = {}; IP_CNT_CACHE.set(arr, slot); }
    slot[scope] = { sig, list };
    return list;
}

/* 同步作品下拉的选项；选项没变就不重建，免得把正在点的那一下顶掉 */
function fillIpSelect(sel, all, curIp, q, hitW, scope, tag) {
    if (!sel) return '';
    /* 下拉下面的分类翻页条 + 分页状态（tag 没传就退化成不分页） */
    const pager = tag ? libEl(tag, 'IpPager') : null;
    const st = tag ? libState(scope) : null;
    const want = String(curIp == null ? '' : curIp);
    /* 没有分类的条目（作品空着）不算分类，也不做「全部」这一项 */
    const list = ipCounts(all, scope).filter((x) => !!String(x[0] || '').trim());
    /* 搜索词对得上分类名（中文名或 slug 都算）时，下拉里只留这些分类 */
    const qq = String(q == null ? '' : q).trim().toLowerCase();
    const nameHit = qq
        ? list.filter((x) => ipLabel(x[0], scope).toLowerCase().indexOf(qq) >= 0 || String(x[0]).toLowerCase().indexOf(qq) >= 0)
        : list;
    /* 分类名对不上时，退而用「这个分类下有条目命中搜索词」来筛：
       搜人名（如「凯尔希」）也能定位到它所在的分类，并自动切过去 */
    const shown = (qq && !nameHit.length && hitW && hitW.size)
        ? list.filter((x) => hitW.has(x[0]))
        : nameHit;
    /* 选中的那个还在就保持；不在就落在第一个上（搜索时就是第一个对得上的分类） */
    const eff = shown.some((x) => x[0] === want) ? want : (shown.length ? shown[0][0] : '');
    /* 分类快一万个，一次全铺进 select，手机上光解析就要好几秒。
       改成每页 IP_PAGE_SIZE 个 + 下拉下面的翻页条；搜索时命中数少，不分页直接全给。 */
    const IP_PAGE_SIZE = 1000;
    let opts = shown;
    let page = 1;
    let pages = 1;
    if (!qq && shown.length > IP_PAGE_SIZE) {
        pages = Math.ceil(shown.length / IP_PAGE_SIZE);
        page = Math.min(pages, Math.max(1, parseInt((st && st.ipPage) || 1, 10) || 1));
        opts = shown.slice((page - 1) * IP_PAGE_SIZE, page * IP_PAGE_SIZE);
        /* 当前选中的那个要是落在别的页上，也留在这一页里，免得下拉显示成第一项 */
        if (eff && !opts.some((x) => x[0] === eff)) {
            const curb = shown.find((x) => x[0] === eff);
            if (curb) opts = [curb].concat(opts);
        }
    }
    /* 选项签名不含当前选中项：换分类时只改 value，不重建下拉 */
    const sig = opts.map((x) => x[0] + ':' + x[1]).join(',') + '|' + page + '/' + pages + '/' + shown.length;
    if (sel.getAttribute('data-sig') !== sig) {
        sel.setAttribute('data-sig', sig);
        sel.innerHTML = opts.length
            ? opts.map((item) => '<option value="' + esc(item[0]) + '">' + esc(ipLabel(item[0], scope)) + '</option>').join('')
            : '<option value="">（没有对得上的分类）</option>';
    }
    /* 下拉下面的分类翻页条 */
    if (pager) pager.innerHTML = (pages > 1) ? ipPagerHtml(page, pages, shown.length) : '';
    sel.value = eff;
    return eff;
}

function libState(scope) {
    const bag = scope === 'wb' ? (S.wbLib || (S.wbLib = {})) : (S.ranobe || (S.ranobe = {}));
    /* ip：按作品（IP）筛选，空字符串 = 全部作品 */
    if (bag.edits == null || typeof bag.edits !== 'object') bag.edits = {};
    if (!Array.isArray(bag.added)) bag.added = [];
    if (!Array.isArray(bag.deleted)) bag.deleted = [];
    if (!Array.isArray(bag.sel)) bag.sel = [];
    if (typeof bag.req !== 'string') bag.req = '';
    if (typeof bag.q !== 'string') bag.q = '';
    if (typeof bag.ip !== 'string') bag.ip = '';
    /* ipPage：分类下拉翻到第几页（1 起，每页 500 个分类） */
    if (typeof bag.ipPage !== 'number' || !isFinite(bag.ipPage) || bag.ipPage < 1) bag.ipPage = 1;
    /* page：列表翻到第几页（1 起）。改搜索词 / 换分类时会被重置回第 1 页 */
    if (!(parseInt(bag.page, 10) >= 1)) bag.page = 1;
    /* ipName：分类的自定义名字（内置分类改名 / 自己新建的分类都放这儿） */
    if (bag.ipName == null || typeof bag.ipName !== 'object' || Array.isArray(bag.ipName)) bag.ipName = {};
    /* wiped：整库被「清空全部」过（true = 内置本体一条都不进列表，只留自己新增的）。
       不逐条记 deleted 是因为内置有 10 万条，光记删除就能把设置撑爆。 */
    if (typeof bag.wiped !== 'boolean') bag.wiped = false;
    return bag;
}

let RANOBE_BUILTIN = null;
let RANOBE_LOADING = null;

/* 拿 JSZip：chatu8.js 在模块加载时就把它挂在 window 上了（index.js 先 import chatu8.js） */
function libZipCtor() {
    const w = (typeof window !== 'undefined') ? window : null;
    const C = w ? (w.stChatu8JSZip || w.JSZip) : null;
    return (typeof C === 'function') ? C : null;
}

/* 从分类条目包（zip）里解出 8089 个分类 json，合并成一份内置库。
   只在点「重载内置库」时走这里：解压 + 解析在手机上要十几秒，不能每次进面板都来一遍。 */
async function loadRanobeFromZip() {
    const C = libZipCtor();
    if (!C) throw new Error('JSZip 还没准备好（刷新一下页面再试）');
    const url = new URL(RANOBE_ZIP_FILE, import.meta.url).toString();
    log('正在读取分类条目包…');
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('读取分类条目包失败：HTTP ' + res.status);
    const buf = await res.arrayBuffer();
    const zip = await C.loadAsync(buf);
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir && /\.json$/i.test(n)).sort();
    if (!names.length) throw new Error('分类条目包里没有 json 文件');
    const works = {};
    const chars = [];
    let done = 0;
    for (const n of names) {
        done++;
        let d = null;
        try { d = JSON.parse(await zip.files[n].async('string')); } catch (e) { continue; }
        const w = (d && d.works && typeof d.works === 'object') ? d.works : {};
        for (const k of Object.keys(w)) works[k] = w[k];
        const arr = (d && Array.isArray(d.chars)) ? d.chars : [];
        for (const c of arr) chars.push(c);
        if (done % 800 === 0) log('分类条目包：' + done + ' / ' + names.length + ' 个分类，已收 ' + chars.length + ' 条');
    }
    if (!chars.length) throw new Error('分类条目包里没解出条目');
    RANOBE_WORKS = works;
    RANOBE_BUILTIN = {
        name: '日冕星谱·千曜群像（分类条目包 · ' + names.length + ' 个分类）',
        v: '',
        chars
    };
    log('内置同人资料库已从分类条目包载入：' + chars.length + ' 条（' + names.length + ' 个分类）');
    /* 顺手落盘：下次进游戏直接从 IndexedDB 读回来，不用再点「重载内置库」、也不用再解压一遍。
       存不进去不算失败（这次照样能用），只是下次还得手点。 */
    builtinStorePutZip({ ts: Date.now(), name: RANOBE_BUILTIN.name, works, chars }).then(() => {
        delete RANOBE_CACHE_TRIED.zip;
        log('内置同人资料库已缓存到本地（' + chars.length + ' 条，下次进游戏直接用）');
    }).catch((e) => {
        log('内置同人资料库缓存失败（不影响这次使用）：' + (e && e.message ? e.message : e), 'error');
    });
    return RANOBE_BUILTIN;
}

/* 哪些来源的本地缓存已经查过了（没有就别每次渲染都去翻一遍 IndexedDB） */
let RANOBE_CACHE_TRIED = {};

/* 没点「重载内置库」时走这里：把上次落盘的整库从 IndexedDB 读回来。
   读不到才返回 null（面板会提示去点「重载内置库」）。 */
async function loadRanobeFromCache() {
    const src = String(S.ranobeBuiltinSrc || 'zip');
    if (RANOBE_CACHE_TRIED[src]) return null;
    RANOBE_CACHE_TRIED[src] = true;
    try {
        const c = (src === 'custom') ? await builtinStoreGet() : await builtinStoreGetZip();
        if (!c || !Array.isArray(c.chars) || !c.chars.length) return null;
        RANOBE_WORKS = (c.works && typeof c.works === 'object') ? c.works : {};
        RANOBE_BUILTIN = {
            name: String(c.name || '内置库（本地缓存）'),
            v: String(c.exportedAt || ''),
            chars: c.chars
        };
        log('内置同人资料库已从本地缓存载入：' + RANOBE_BUILTIN.chars.length + ' 条');
        return RANOBE_BUILTIN;
    } catch (e) {
        log('读内置库本地缓存失败：' + (e && e.message ? e.message : e), 'error');
        return null;
    }
}

/* force=true 才真去解压 / 重读；平时先看内存，再看本地缓存，都没有才返回 null（面板会提示去点「重载内置库」） */
async function loadRanobeBuiltin(force) {
    if (RANOBE_BUILTIN && !force) return RANOBE_BUILTIN;
    if (RANOBE_LOADING) return RANOBE_LOADING;
    if (!force) return await loadRanobeFromCache();
    RANOBE_LOADING = (async () => {
        try {
            /* 按「内置库来源」下拉里选的来载入 */
            const src = String(S.ranobeBuiltinSrc || 'zip');
            if (src === 'custom') {
                const custom = await builtinStoreGet().catch(() => null);
                if (!custom || !Array.isArray(custom.chars) || !custom.chars.length) {
                    throw new Error('你选的是「我导入的内置库」，但本地没有这份（可能已删除）——把来源换成插件自带的再试');
                }
                RANOBE_WORKS = (custom.works && typeof custom.works === 'object') ? custom.works : {};
                RANOBE_BUILTIN = {
                    name: String(custom.name || '导入的内置库'),
                    v: String(custom.exportedAt || ''),
                    chars: custom.chars
                };
                log('内置同人资料库已载入（你导入的内置库）：' + RANOBE_BUILTIN.chars.length + ' 条');
                return RANOBE_BUILTIN;
            }
            return await loadRanobeFromZip();
        } catch (e) {
            log('内置同人资料库读取失败：' + (e && e.message ? e.message : e), 'error');
            return null;
        } finally {
            RANOBE_LOADING = null;
        }
    })();
    return RANOBE_LOADING;
}

/* 按世界书生成的数据源：当前角色卡绑定的主世界书（没绑定就用 gen 里选的那本） */
let WB_LIB_CACHE = [];
let WB_LIB_BOOK = '';

async function loadWbLibSource(force) {
    if (WB_LIB_CACHE.length && !force) return WB_LIB_CACHE;
    try {
        if (S.genSource === 'chatu8') {
            WB_LIB_BOOK = '智绘姬世界书';
            WB_LIB_CACHE = chatu8WorldEntries() || [];
            return WB_LIB_CACHE;
        }
        const book = cardWorldBook() || S.genBook || '';
        if (!book) { WB_LIB_CACHE = []; WB_LIB_BOOK = ''; return WB_LIB_CACHE; }
        const names = await stWorldNames();
        if (names.indexOf(book) < 0) { WB_LIB_CACHE = []; WB_LIB_BOOK = book + '（不在列表里）'; return WB_LIB_CACHE; }
        WB_LIB_BOOK = book;
        const list = await stWorldEntries(book);
        WB_LIB_CACHE = (list || []).map((e) => ({
            k: 'wb:' + e.key,
            n: e.title,
            a: [],
            c: e.title,
            w: book,
            t: '',
            p: '',
            d: '',
            x: e.content
        }));
        return WB_LIB_CACHE;
    } catch (e) {
        log('读当前角色卡世界书失败：' + (e && e.message ? e.message : e), 'error');
        WB_LIB_CACHE = [];
        return WB_LIB_CACHE;
    }
}

/* 合并：内置本体 - 删掉的 + 改过的 + 自己加的 */
function mergeLib(scope, base) {
    const st = libState(scope);
    const del = new Set(st.deleted || []);
    const out = [];
    const seen = new Set();
    /* 整库被「清空全部」过：内置本体一条都不铺，只留下面自己新增的 */
    for (const raw of (st.wiped ? [] : (base || []))) {
        const e = normLibEntry(raw);
        if (!e.k || del.has(e.k) || seen.has(e.k)) continue;
        seen.add(e.k);
        const ed = st.edits && st.edits[e.k];
        out.push(ed ? normLibEntry(Object.assign({}, e, ed), e.k) : e);
    }
    for (const raw of (st.added || [])) {
        const e = normLibEntry(raw);
        if (!e.k) e.k = 'u:' + (e.n || '');
        if (del.has(e.k) || seen.has(e.k)) continue;
        seen.add(e.k);
        out.push(e);
    }
    return out;
}

/* 合并结果缓存：用户层（删掉的 / 改过的 / 自己新增的）没变、内置本体也没换，就直接复用上次的结果。
   以前每次渲染都拿 10 万条重新规范化合并一遍（桌面 ~100ms，手机 300ms+），换分类、翻页、打字都卡一下。 */
const LIB_MERGED = { ranobe: null, wb: null };
let LIB_BASE_SEQ = 0;
const LIB_BASE_ID = new WeakMap();

/* 内置本体（数组）的身份：换了库（解压 / 读缓存 / 导入 / 删除 / 重读世界书）就换一个号 */
function libBaseId(base) {
    if (!base) return 0;
    let id = LIB_BASE_ID.get(base);
    if (!id) { id = ++LIB_BASE_SEQ; LIB_BASE_ID.set(base, id); }
    return id;
}

/* 用户层的指纹：这三样一变就得重新合并 */
function libUserSig(scope) {
    const st = libState(scope);
    try {
        return JSON.stringify([st.wiped === true, st.deleted || [], st.added || [], st.edits || {}]);
    } catch (e) {
        return 'x' + Math.random();   /* 存坏了就当每次都变，宁可慢也别显示旧数据 */
    }
}

function mergeLibCached(scope, base) {
    const sig = libBaseId(base) + '|' + (base ? base.length : 0) + '|' + libUserSig(scope);
    const slot = LIB_MERGED[scope];
    if (slot && slot.sig === sig) return slot.list;
    const list = mergeLib(scope, base);
    LIB_MERGED[scope] = { sig, list };
    return list;
}

async function libAll(scope) {
    if (scope === 'wb') return mergeLibCached('wb', await loadWbLibSource());
    const b = await loadRanobeBuiltin();
    return mergeLibCached('ranobe', b ? b.chars : []);
}

async function onPresetReseed(scope) {
    const isGen = scope === 'gen';
    const isRanobe = scope === 'ranobe';
    const name = isGen ? DEFAULT_GEN_PRESET_NAME : (isRanobe ? DEFAULT_RANOBE_PRESET_NAME : DEFAULT_PRESET_NAME);
    const label = presetScopeLabel(scope);
    const has = !!presetBag(scope)[name];
    const ok = confirm('把' + label + '的内置预设「' + name + '」刷新成插件里的最新版本？' +
        (has ? '\n\n你对这一份做过的改动会被覆盖（自己导入 / 新建的预设不受影响）。' : ''));
    if (!ok) return false;
    if (isGen) { S.seedGenPreset = ''; S.seedGenPresetVer = ''; await ensureDefaultGenPreset(true); }
    else if (isRanobe) { S.seedRanobePreset = ''; S.seedRanobePresetVer = ''; await ensureDefaultRanobePreset(true); }
    else { S.seedPreset = ''; S.seedPresetVer = ''; await ensureDefaultPreset(true); }
    saveSettings(true);
    renderPresetCard(scope);
    toast(label + '的内置预设已更新到最新版');
    return true;
}

function presetPlaceholderState(list) {
    const all = list.map((e) => String(e.content || '')).join('\n');
    const hit = [];
    for (const t of PRESET_TOKENS) {
        if (t.keys.some((k) => all.indexOf(k) >= 0)) hit.push(t.label);
    }
    return hit.length ? hit.join(' / ') : '无（正文会补在末尾）';
}

/* 同一套控件有两份（档案库 / 手动生成），gen 版键名统一加 gen 前缀 */
function dkey(scope, base) {
    const up = (p) => p + base.charAt(0).toUpperCase() + base.slice(1);
    if (scope === 'gen') return up('gen');
    if (scope === 'ranobe') return up('ranobe');
    return base;
}

/* 三套上下文预设各存各的：档案库（lib）/ 手动生成（gen）/ 同人库与按世界书（ranobe）。
   kind：Enabled（总开关）/ MergeSystem（合并 system）/ Name（当前选中的预设名） */
function presetKey(scope, kind) {
    if (scope === 'gen') return 'genPreset' + kind;
    if (scope === 'ranobe') return 'ranobePreset' + kind;
    return 'preset' + kind;
}

/* 日志 / 提示里怎么称呼这一套预设 */
function presetScopeLabel(scope) {
    return scope === 'gen' ? '手动生成' : (scope === 'ranobe' ? '同人库' : '档案库');
}

/* 自动生成那块「当前预设」下拉旁边的锁：第一次渲染时插进去，之后只更新状态。
   这样静态 PANEL_HTML 和 profileCardHtml() 生成的卡片都自动带上，不用改两处 HTML。 */
function ensureLibPresetLockBtn(tab, sel) {
    let btn = tab.querySelector('[data-dna="libPresetLock"]');
    if (btn) return btn;
    if (!sel || !sel.parentNode) return null;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'st-chatu8-btn dna-tpl-lock dna-tpl-lock-icon';
    btn.setAttribute('data-dna', 'libPresetLock');
    btn.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
    try { sel.parentNode.insertBefore(btn, sel.nextSibling); } catch (e) { return null; }
    btn.addEventListener('click', () => toggleLibPresetLock());
    return btn;
}

function renderPresetCard(scope) {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const q = (base) => tab.querySelector('[data-dna="' + dkey(scope, base) + '"]');
    const names = presetNames(scope);
    const name = activePresetName(scope);
    const list = presetEntries(name, scope);
    const on = presetEnabledOf(scope) && names.length > 0;

    const sel = q('presetSelect');
    if (sel) {
        sel.innerHTML = names.length
            ? names.map((n) => '<option value="' + esc(n) + '"' + (n === name ? ' selected' : '') + '>' + esc(n) + '</option>').join('')
            : '<option value="">（还没导入预设）</option>';
        if (scope === 'lib') {
            const lk = libPresetLocked();
            sel.disabled = !names.length || lk;
            const lb = ensureLibPresetLockBtn(tab, sel);
            if (lb) {
                lb.classList.toggle('is-locked', lk);
                lb.innerHTML = '<i class="fa-solid ' + (lk ? 'fa-lock' : 'fa-lock-open') + '"></i>';
                lb.title = lk
                    ? ('已锁定：这张角色卡固定用「' + (name || '（无）') + '」，点一下解锁')
                    : '锁定：这张角色卡固定用这份上下文预设（导入新预设也不会被切走）';
            }
        } else {
            sel.disabled = !names.length;
        }
    }
    const badge = q('presetLabel');
    if (badge) badge.textContent = on ? '已启用' : (names.length ? '已导入 · 未启用' : '未导入');
    const hint = q('presetHint');
    if (hint) {
        const who = presetScopeLabel(scope);
        let txt = on
            ? who + '按「' + name + '」的 ' + list.filter((e) => e.enabled !== false).length + ' 条条目组装 messages'
            : (names.length ? '关着的时候用插件内置提示词（batchPrompt）' : '导入后' + who + '就按预设的条目组装提示词');
        /* 档案输出长，max_tokens 太小会被截成空文本 */
        const p = chatu8Profile(scope);
        if (on && p && p.enable_max_tokens !== false) {
            const mt = numOr(p.max_tokens, 4000);
            if (mt > 0 && mt < 4000) {
                txt += ' · ⚠ 这份 LLM 配置的最大 tokens 只有 ' + mt + '，档案输出容易被截断，建议调到 8000 以上';
            }
        }
        hint.textContent = txt;
    }
    const info = q('presetInfo');
    if (info) {
        if (!names.length) {
            info.innerHTML = '';
        } else {
            const chars = list.reduce((n, e) => n + String(e.content || '').length, 0);
            const byRole = { system: 0, user: 0, assistant: 0 };
            list.forEach((e) => { byRole[e.role] = (byRole[e.role] || 0) + 1; });
            const rows = [
                ['预设', name],
                ['条目', list.length + ' 条（启用 ' + list.filter((e) => e.enabled !== false).length + '）'],
                ['角色分布', 'system ' + byRole.system + ' · user ' + byRole.user + ' · assistant ' + byRole.assistant],
                ['总字数', chars + ' 字'],
                ['占位符', presetPlaceholderState(list)]
            ];
            info.innerHTML = rows.map((r) =>
                '<div class="dna-kv-row"><span class="dna-kv-k">' + esc(r[0]) + '</span>' +
                '<span class="dna-kv-v">' + esc(String(r[1])) + '</span></div>'
            ).join('');
        }
    }
    renderPresetEntries(scope);
}

/* ------------------------------ 可折叠区块 ------------------------------ */
/* LLM 配置 / 上下文预设这两块占地方，点标题或右边箭头就能收起来。

   为什么不借智绘姬本体那套 .st-chatu8-collapsible-section：
   本体在 document 上挂了一个委托点击，凡是点 .st-chatu8-section-header 它自己会 toggle 一次
   is-collapsed。DNA 这边要是也用同一个类名再挂一个监听，一次点击就被 toggle 两下——
   等于没点，这就是「折叠点了没反应」的根因。所以这里用自己的一套类名（dna-fold / dna-fold-head），
   本体的委托选择器压根匹配不到，两边井水不犯河水。

   收起的表现：.dna-folded 让 head 之外的所有子元素 display:none（见 dna.css），
   不用再包一层 body，静态 HTML 也不用跟着改结构。 */
/* 某块当前是不是收起的：设置里记过就用记的，没记过就看默认值 */
function foldOn(key, bag) {
    const f = bag || ((S.folds && typeof S.folds === 'object') ? S.folds : {});
    if (key in f) return !!f[key];
    return !!FOLD_DEFAULT_FOLDED[key];
}

function applyFolds() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const f = (S.folds && typeof S.folds === 'object') ? S.folds : {};
    tab.querySelectorAll('[data-fold]').forEach((sec) => {
        sec.classList.toggle('dna-folded', foldOn(sec.dataset.fold, f));
    });
}

/* 点箭头或点标题都能收/展开。挂在 #dna-tab 上一次就够：
   面板内容被外部重建也不影响，只要容器还在就有人接点击。 */
function bindFoldClicks(tab) {
    if (!tab || tab.dataset.foldBound === '1') return;
    tab.dataset.foldBound = '1';
    tab.addEventListener('click', (e) => {
        const t = e.target;
        const btn = t && t.closest ? t.closest('[data-fold-btn]') : null;
        const head = t && t.closest ? t.closest('.dna-fold-head') : null;
        if (!btn && !head) return;
        /* 标题行里塞了搜索框 / 全选按钮的折叠块：点这些控件只当操作用，不折叠 */
        if (!btn && t.closest('input, select, textarea, a, button')) return;
        const sec = (btn || head).closest('[data-fold]');
        if (!sec) return;
        e.preventDefault();
        const k = sec.dataset.fold;
        if (!S.folds || typeof S.folds !== 'object') S.folds = {};
        /* 收起 / 展开会让整块高度骤变，页面若已经滚到底部，浏览器会 clamp 滚动位置，
           标题行（连同折叠箭头）就跟着跳到别处。这里按「点击前 → 点击后」的位移补一次滚动，
           保证你点的那一行原地不动。 */
        const scroller = (() => {
            let p = sec.parentElement;
            while (p && p !== document.body) {
                const st = getComputedStyle(p);
                if (/(auto|scroll)/.test(st.overflowY) && p.scrollHeight > p.clientHeight + 1) return p;
                p = p.parentElement;
            }
            return null;
        })();
        const y0 = sec.getBoundingClientRect().top;
        S.folds[k] = !foldOn(k, S.folds);
        sec.classList.toggle('dna-folded', !!S.folds[k]);
        const dy = sec.getBoundingClientRect().top - y0;
        if (Math.abs(dy) > 1) {
            if (scroller) scroller.scrollTop += dy;
            else window.scrollBy(0, dy);
        }
        saveSettings(true);
    });
}

/* ------------------------------ 悬浮窗 ------------------------------ */
/* 编辑字段 / 编辑预设条目都走这个：内容放在屏幕中央的弹窗里，不挤在面板里。
   挂在 body 上，所以面板滚动不影响它。 */
let dnaModalMask = null;
/* 弹窗返回钩子：历史存档查看页关掉时要回到编辑弹窗，而不是退出整个编辑 */
let dnaModalBack = null;
/* 从编辑框跳去看历史时，先把它还没保存的改动存这儿，回来再填回去 */
let REC_EDIT_DRAFT = null;
/* 弹窗打开期间锁住背后页面的滚动：弹窗是普通 div（没有 <dialog> 的 inert），
   不锁的话手指滑到弹窗内容尽头会穿透到聊天区，"看到主页面里的东西在动"。 */
let dnaScrollLockSaved = null;
function dnaLockPageScroll() {
    if (dnaScrollLockSaved) return;
    try {
        dnaScrollLockSaved = {
            body: document.body.style.overflow,
            html: document.documentElement.style.overflow,
        };
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    } catch (e) { dnaScrollLockSaved = null; }
}
function dnaUnlockPageScroll() {
    if (!dnaScrollLockSaved) return;
    /* 还有另一层弹窗（历史存档查看切回编辑页的那一瞬）就先别解锁 */
    try { if (document.querySelector('.dna-modal-mask')) return; } catch (e) { /* 忽略 */ }
    const saved = dnaScrollLockSaved;
    dnaScrollLockSaved = null;
    try {
        document.body.style.overflow = saved.body || '';
        document.documentElement.style.overflow = saved.html || '';
    } catch (e) { /* 忽略 */ }
}
function dnaModalOpen(title, bodyHtml) {
    /* 立即清掉上一个（不等退场动画），否则会短暂同时存在两个 */
    dnaModalClose(true);
    /* 弹窗的观感样式和条目那套一起注入，别指望 dna.css 一定是最新的 */
    try { ensurePresetEntryStyle(); } catch (e) { /* 忽略 */ }
    /* 用原生 <dialog> + showModal()：内容进浏览器的 top layer，
       任何主题 / z-index / 层叠上下文 / transform / overflow 裁剪都盖不住它。
       这是唯一能保证「弹窗一定在最前面」的机制 —— 普通 div 不管 z-index 调多高，
       在这套美化里都可能被压到后面（2026-10-29 反复验证过）。
       它唯一的毛病是滑动时 top layer 偶尔重绘掉帧，那个已经用别的办法压下去了：
       visualViewport 不跟 scroll、弹窗高度不用 dvh、内容区关掉滚动加速。 */
    const mask = document.createElement('dialog');
    /* 直接复用智绘姬本体的编辑弹窗组件（modals.css 里的 .st-chatu8-edit-*），
       遮罩、圆角、按钮、间距全都跟本体一模一样，不用自己造一套。 */
    mask.className = 'st-chatu8-edit-backdrop dna-modal-mask';
    /* 定位和层级一律内联钉死，不吃外部样式表：
       弹窗的「全屏 fixed + 居中」原先只写在 styles/modals.css 的
       .st-chatu8-edit-backdrop 里，那份 CSS 一旦没加载上（缓存 / 加载失败），
       这个节点就退化成 body 末尾的普通块，用户看到的就是「弹窗渲染到页面后面、
       界面出不来」。遮罩色也画在自己身上，任何时刻都在。
       ⚠️ z-index 只能到 2147483000，绝不能写 2147483647：那是 32 位有符号整数上限，
       有的 WebView 会把它溢出成负数，弹窗反而被压到所有内容后面（2026-10-29 踩过）。 */
    mask.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;' +
        'margin:0;padding:10px;box-sizing:border-box;display:grid;place-items:center;' +
        'overflow:hidden;background:rgba(0,0,0,.6);z-index:2147483000;' +
        'max-width:none;max-height:none;min-width:0;min-height:0;border:0;color:inherit';
    mask.innerHTML =
        '<div class="st-chatu8-edit-dialog" role="dialog" aria-modal="true">' +
            '<div class="st-chatu8-edit-title dna-modal-title">' +
                '<span class="dna-modal-tname"><i class="fa-solid fa-dna dna-modal-ticon"></i>' + esc(title) + '</span>' +
                '<button type="button" class="dna-modal-x" data-modal-close="1" title="关闭">&times;</button>' +
            '</div>' +
            '<div class="dna-modal-b">' + bodyHtml + '</div>' +
        '</div>';
    document.body.appendChild(mask);
    dnaModalMask = mask;
    /* 真正进 top layer。老 WebView 没有 showModal 时退化成 [open] 属性，
       节点仍然是内联钉死的全屏 fixed 弹窗，不会消失。 */
    try {
        if (typeof mask.showModal === 'function') mask.showModal();
        else mask.setAttribute('open', '');
    } catch (e) {
        try { mask.setAttribute('open', ''); } catch (e2) { /* 忽略 */ }
    }
    /* Esc：dialog 会自己触发 cancel，接管成走统一关闭流程（含"历史存档 → 返回编辑"） */
    mask.addEventListener('cancel', (e) => {
        e.preventDefault();
        dnaModalClose();
    });
    /* 另外再锁一层背后页面的滚动：滚动穿透会让人"看到主页面里的东西在动" */
    try { dnaLockPageScroll(); } catch (e) { /* 忽略 */ }
    /* 手机：把遮罩对齐到真实可视区（键盘/缩放会让 fixed 定位偏出屏幕） */
    try { dnaFitVisualViewport(mask); } catch (e) { /* 忽略 */ }
    /* 点遮罩空白处关闭，点弹窗内部不关 */
    mask.addEventListener('mousedown', (e) => {
        if (e.target === mask) dnaModalClose();
    });
    const xBtn = mask.querySelector('[data-modal-close]');
    if (xBtn) xBtn.addEventListener('click', () => dnaModalClose());
    const raf = (typeof requestAnimationFrame === 'function')
        ? requestAnimationFrame
        : (fn) => setTimeout(fn, 16);
    raf(() => {
        try { mask.classList.add('dna-modal-show'); } catch (e) { /* 忽略 */ }
    });
    return mask;
}
function dnaModalClose(instant) {
    /* 历史存档查看页这一层：关掉它 = 回到编辑弹窗，不是退出整个编辑 */
    if (!instant && dnaModalBack) {
        const back = dnaModalBack;
        dnaModalBack = null;
        /* 先把这一层真正关掉：back() 里万一因为档案被删 / 被锁而开不出编辑页，
           也不会留下一层点不掉的遮罩把用户卡住 */
        dnaModalClose(true);
        back();
        return;
    }
    dnaModalBack = null;
    if (!instant) REC_EDIT_DRAFT = null;
    const mask = dnaModalMask || document.querySelector('.dna-modal-mask');
    dnaModalMask = null;
    try { dnaUnfitVisualViewport(); } catch (e) { /* 忽略 */ }
    if (!mask) return;
    try { mask.classList.remove('dna-modal-show'); } catch (e) { /* 忽略 */ }
    const dropMask = () => {
        /* 是 <dialog> 就先 close() 退出 top layer，再删节点 */
        try { if (typeof mask.close === 'function' && mask.hasAttribute('open')) mask.close(); } catch (e) { /* 忽略 */ }
        try { if (mask.parentNode) mask.parentNode.removeChild(mask); } catch (e) { /* 忽略 */ }
        try { dnaUnlockPageScroll(); } catch (e) { /* 忽略 */ }
    };
    if (instant) { dropMask(); return; }
    /* 点关闭时留一点退场动画时间 */
    setTimeout(dropMask, 180);
}
/* 弹窗里的保存/取消按钮：统一在这里接线 */
function dnaModalWire(onSave) {
    const mask = dnaModalMask;
    if (!mask) return;
    const save = mask.querySelector('[data-modal-save]');
    const cancel = mask.querySelector('[data-modal-cancel]');
    if (save) save.addEventListener('click', () => { if (onSave) onSave(mask); });
    if (cancel) cancel.addEventListener('click', () => dnaModalClose());
    const first = mask.querySelector('textarea, input[type="text"]');
    /* 手机上不自动聚焦：一聚焦键盘就弹起来，可视高度立刻少一半，看着就像"只显示一半" */
    const coarse = (typeof window.matchMedia === 'function')
        && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (first && !coarse) { try { first.focus(); } catch (e) { /* 忽略 */ } }
}

/* 手机上键盘弹出 / 双指缩放时，position:fixed 的遮罩仍然按"布局视口"定位，
   弹窗会跑到屏幕外。这里把遮罩对齐到 visualViewport 的真实可视区。
   ⚠️ 只跟 resize（键盘 / 缩放），**不跟 scroll**：
   监听 scroll 会让滑动时反复改全屏尺寸，弹窗与遮罩一帧一个样，看着就是一跳一跳地闪。
   而且值没变就干脆不写，避免每次事件都触发一次样式重算 + 重绘。 */
let dnaVVHandler = null;
function dnaFitVisualViewport(mask) {
    if (!mask || !window.visualViewport) return;
    const vv = window.visualViewport;
    let lastKey = '';
    const apply = () => {
        try {
            /* 键盘真的挡住一大截（或双指放大）才对齐可视区；
               平时就用 CSS 的全屏 fixed 居中，自己算反而容易算偏、弹窗跑到屏幕外 */
            const covered = (window.innerHeight || 0) - vv.height;
            const keyboard = (covered > 120 || vv.scale > 1.01);
            const key = keyboard
                ? ('k|' + Math.round(vv.offsetLeft) + '|' + Math.round(vv.offsetTop) +
                   '|' + Math.round(vv.width) + '|' + Math.round(vv.height))
                : 'full';
            if (key === lastKey) return;   /* 值没变就别动样式，动一下就闪 */
            lastKey = key;
            mask.style.position = 'fixed';
            if (keyboard) {
                mask.style.left = vv.offsetLeft + 'px';
                mask.style.top = vv.offsetTop + 'px';
                mask.style.width = vv.width + 'px';
                mask.style.height = vv.height + 'px';
            } else {
                /* 键盘收起 / 没缩放：回到「整屏 fixed 居中」。
                   这里绝对不能写成清理内联（style.x = ''）——定位是 dnaModalOpen
                   内联写死的，清掉就只剩 CSS 兜底，CSS 没加载时弹窗又掉回页面后面。 */
                mask.style.left = '0';
                mask.style.top = '0';
                mask.style.width = '100%';
                mask.style.height = '100%';
            }
        } catch (e) { /* 忽略 */ }
    };
    apply();
    dnaVVHandler = apply;
    vv.addEventListener('resize', apply);
}

function dnaUnfitVisualViewport() {
    const vv = window.visualViewport;
    if (vv && dnaVVHandler) {
        try {
            vv.removeEventListener('resize', dnaVVHandler);
            vv.removeEventListener('scroll', dnaVVHandler);
        } catch (e) { /* 忽略 */ }
    }
    dnaVVHandler = null;
}

/* 预设条目这几条兜底样式，直接注入到 document.head。
   为什么要注入、而不是只写在 dna.css 里：dna.css 是靠 style.css 的 @import 进来的，
   插件整包更新后浏览器常常还拿着缓存里的旧 dna.css——JS 变了、CSS 没变，
   条目就可能被撑歪、手机上的预览和字数也藏不掉。注入的 style 跟着 dna.js 走，不吃这个亏。
   按钮本身的观感（底色 / 圆角 / 边框 / hover）不在这里管，直接用智绘姬本体已经加载的
   .st-chatu8-icon-btn / .st-chatu8-entry-* 那一套，和 LLM「上下文配置」的条目完全一致。 */
let presetEntryStyleDone = false;
/* 分类翻页条的样式单独注入一次：dna.css 会被浏览器缓存成旧版，
   而且预设条目那段注入只在预设页签渲染时才跑，同人库页签吃不到。 */
let ipPagerStyleDone = false;
function ensureIpPagerStyle() {
    if (ipPagerStyleDone) return;
    ipPagerStyleDone = true;
    try {
        const st = document.createElement('style');
        st.id = 'dna-ip-pager-style';
        st.textContent = IP_PAGER_CSS;
        document.head.appendChild(st);
    } catch (e) { ipPagerStyleDone = false; }
}
const IP_PAGER_CSS = String.raw`
#st-chatu8-settings #dna-tab .dna-lib-filters{align-items:start}
/* 翻页条独占一行：100% 宽 + 上边一条虚线，和上面的下拉 / 分类操作彻底分开 */
#st-chatu8-settings #dna-tab .dna-ippager{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:5px;width:100%;margin-top:10px;padding:10px 0 0;border-top:1px dashed var(--st-chatu8-border-color,rgba(128,128,128,.3))}
#st-chatu8-settings #dna-tab .dna-ippager .dna-page-info{margin-left:6px;font-size:.76rem;opacity:.7;white-space:nowrap}
`;

function ensurePresetEntryStyle() {
    if (presetEntryStyleDone) return;
    presetEntryStyleDone = true;
    try {
        /* 条目勾选态 + 弹窗观感：跟 dna.css 末尾那段一一对应，
           写在这边是为了 dna.css 被浏览器缓存时也照样生效。 */
        const PRESET_EXTRA_CSS = String.raw`
#st-chatu8-settings #dna-tab .dna-entry-item.is-on{border-color:var(--dna-ok-line,rgba(80,200,120,.45));box-shadow:inset 3px 0 0 var(--dna-ok-line,rgba(80,200,120,.55))}
#st-chatu8-settings #dna-tab .dna-lib-row{transition:border-color .16s,box-shadow .16s,background-color .16s}
#st-chatu8-settings #dna-tab .dna-lib-row:hover{border-color:var(--st-chatu8-accent-secondary,rgba(128,128,128,.6))}
.st-chatu8-edit-backdrop.dna-modal-mask .st-chatu8-edit-dialog{border-radius:12px;box-shadow:0 24px 60px -20px rgba(0,0,0,.65),0 0 0 1px var(--st-chatu8-border-color,rgba(128,128,128,.25))}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-title{display:flex;align-items:center;justify-content:center;padding:2px 32px 10px;font-size:1rem;font-weight:600;letter-spacing:.01em;border-bottom:1px solid var(--st-chatu8-border-color,rgba(128,128,128,.22))}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-tname{display:inline-flex;align-items:center;gap:8px;min-width:0}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-ticon{flex:0 0 auto;font-size:.9rem;color:var(--st-chatu8-accent-primary,#3b82f6)}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b{min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:auto}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b label{display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:.82rem;font-weight:600;color:var(--st-chatu8-text-secondary,inherit)}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b label::before{content:"";flex:0 0 auto;width:3px;height:12px;border-radius:2px;background:var(--st-chatu8-accent-primary,#3b82f6);opacity:.8}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b .st-chatu8-text-input,.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b .st-chatu8-textarea,.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b .st-chatu8-edit-input{border-radius:8px;background:var(--st-chatu8-bg-tertiary,rgba(128,128,128,.14));border:1px solid var(--st-chatu8-border-color,rgba(128,128,128,.35));transition:border-color .16s,box-shadow .16s}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b .st-chatu8-text-input:focus,.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b .st-chatu8-textarea:focus,.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-b .st-chatu8-edit-input:focus{outline:none;border-color:var(--st-chatu8-accent-primary,#3b82f6);box-shadow:0 0 0 3px rgba(59,130,246,.15)}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-sec{display:flex;align-items:center;gap:8px;margin:14px 0 10px;padding-bottom:6px;font-size:.78rem;font-weight:700;letter-spacing:.04em;color:var(--st-chatu8-accent-primary,#3b82f6);border-bottom:1px dashed var(--st-chatu8-border-color,rgba(128,128,128,.28))}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-sec:first-child{margin-top:4px}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-sec i{font-size:.78rem;opacity:.85}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-meta{margin-bottom:10px;padding:8px 10px;border-radius:8px;background:var(--st-chatu8-bg-tertiary,rgba(128,128,128,.12));font-size:.78rem;line-height:1.5}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-foot{margin-top:14px}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-modal-foot .st-chatu8-edit-button.send{box-shadow:0 6px 16px -8px rgba(59,130,246,.75)}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-mini{flex:0 0 auto;padding:2px 10px;font-size:.75rem;line-height:1.6;border-radius:5px;cursor:pointer;color:inherit;border:1px solid var(--st-chatu8-border-color,rgba(128,128,128,.4));background:transparent;transition:background .16s,color .16s}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-mini:hover{background:var(--st-chatu8-accent-secondary,#2563eb);color:var(--st-chatu8-text-highlight,#fff)}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-mini-hist{color:var(--st-chatu8-warn-color,#f0b429);border-color:var(--dna-warn-line,rgba(240,180,41,.5))}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-mini-hist:hover{background:var(--st-chatu8-warn-color,#f0b429);color:#1a1a1a}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-mini-hist:disabled{opacity:.45;cursor:not-allowed}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-hist-editor-list{margin-top:8px}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-hist-item{margin-bottom:6px;padding:6px 8px;border-radius:6px;border:1px solid var(--st-chatu8-border-color,rgba(128,128,128,.3))}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-hist-main{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-hist-t{font-size:.75rem;opacity:.8}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-hist-n{margin-left:auto;font-weight:400;opacity:.7}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-hist-acts{margin-left:auto;display:flex;gap:6px}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-hist-empty{font-size:.74rem;line-height:1.65;opacity:.62}
.dna-ban-chips{display:flex;flex-wrap:wrap;align-items:flex-start;gap:6px;max-height:210px;overflow-y:auto;padding:9px;border:1px solid rgba(127,127,127,.28);border-radius:10px;background:rgba(127,127,127,.07);-webkit-overflow-scrolling:touch}
.dna-ban-chip{display:inline-flex;align-items:center;gap:3px;max-width:100%;padding:3px 4px 3px 9px;border:1px solid rgba(239,68,68,.26);border-radius:7px;background:rgba(239,68,68,.1);color:var(--SmartThemeBodyColor,#e8eaed);font-size:.8rem;line-height:1.4;white-space:nowrap}
.dna-ban-x{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;border:none;border-radius:4px;background:transparent;color:rgba(239,68,68,.85);font-size:.9rem;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .15s,color .15s}
.dna-ban-x:hover{background:rgba(239,68,68,.2);color:#ef4444}
.dna-ban-add{display:flex;align-items:center;gap:8px;margin-top:8px}
.dna-ban-add .st-chatu8-text-input{flex:1 1 auto;min-width:0}
.dna-ban-add .st-chatu8-btn{flex:0 0 auto;white-space:nowrap}
.dna-tpl-row{display:flex;align-items:center;gap:8px}
.dna-tpl-row .st-chatu8-select{flex:1 1 auto;min-width:0}
.dna-tpl-row .st-chatu8-select:disabled{opacity:.55;cursor:not-allowed}
.dna-tpl-lock{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.dna-tpl-lock.is-locked{border-color:rgba(240,180,41,.7);color:var(--dna-warn,#f0b429);background:rgba(240,180,41,.12)}
.dna-tpl-lock-icon{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:36px;min-width:36px;padding:0}
.st-chatu8-edit-backdrop.dna-modal-mask{display:grid;place-items:center}
.st-chatu8-edit-backdrop.dna-modal-mask .st-chatu8-edit-dialog{margin:auto}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-rec-field textarea{min-height:84px;max-height:30vh;resize:vertical}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-rec-lock{flex:0 0 auto;margin-left:6px;display:inline-flex;align-items:center;justify-content:center;width:24px;height:22px;padding:0;border-radius:5px;cursor:pointer;color:inherit;border:1px solid var(--st-chatu8-border-color,rgba(128,128,128,.4));background:transparent;transition:background .16s,color .16s,border-color .16s}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-rec-lock>i{font-family:"Font Awesome 6 Free","Font Awesome 5 Free","FontAwesome",sans-serif;font-weight:900;font-style:normal;font-size:.72rem;line-height:1}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-rec-lock:hover{background:var(--st-chatu8-bg-tertiary,rgba(128,128,128,.22))}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-rec-lock.is-locked{color:var(--st-chatu8-warn-color,#f0b429);border-color:var(--dna-warn-line,rgba(240,180,41,.5));background:rgba(240,180,41,.12)}
.st-chatu8-edit-backdrop.dna-modal-mask .dna-rec-locktag{margin-left:6px;font-weight:500;font-size:.74rem;opacity:.75}
.dna-rec-field.is-locked textarea{opacity:.65;cursor:not-allowed}
#st-chatu8-settings #dna-tab .dna-sendfields{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:6px;margin-bottom:6px}
#st-chatu8-settings #dna-tab .dna-sendfield{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;padding:5px 9px;border-radius:6px;border:1px solid var(--st-chatu8-border-color,rgba(128,128,128,.3));background:var(--st-chatu8-bg-secondary,rgba(128,128,128,.1));transition:border-color .16s,background .16s,box-shadow .16s}
#st-chatu8-settings #dna-tab .dna-sendfield:hover{border-color:var(--st-chatu8-accent-secondary,rgba(128,128,128,.6))}
#st-chatu8-settings #dna-tab .dna-sendfield.is-on{border-color:var(--dna-ok-line,rgba(80,200,120,.45));box-shadow:inset 3px 0 0 var(--dna-ok-line,rgba(80,200,120,.55))}
#st-chatu8-settings #dna-tab .dna-sendfield-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem;line-height:1.5;opacity:.45;transition:opacity .16s}
#st-chatu8-settings #dna-tab .dna-sendfield.is-on .dna-sendfield-name{opacity:1}
#st-chatu8-settings #dna-tab .dna-sendfield .st-chatu8-entry-toggle{flex:0 0 auto}
#st-chatu8-settings #dna-tab .dna-photo-wrap{display:flex;align-items:center;justify-content:center;min-height:200px;margin-top:8px;padding:10px;border-radius:8px;border:1px dashed var(--SmartThemeBorderColor,rgba(128,128,128,.35));background:var(--SmartThemeBlurTintColor,rgba(128,128,128,.06))}#st-chatu8-settings #dna-tab .dna-photo-wrap img{max-width:100%;max-height:420px;border-radius:8px;object-fit:contain}#st-chatu8-settings #dna-tab .dna-photo-empty{display:flex;flex-direction:column;align-items:center;gap:8px;opacity:.5;font-size:.8rem}#st-chatu8-settings #dna-tab .dna-photo-empty i{font-size:32px}
.st-chatu8-edit-backdrop.dna-modal-mask{z-index:2147483000!important}
/* 弹窗是原生 <dialog>：定位 / 遮罩色内联写死（见 dnaModalOpen），
   下面两条是必须的兜底 —— 没 [open] 就不许显示（内联 display:grid 否则会把空壳露出来），
   ::backdrop 保持透明（遮罩色已经画在 dialog 自己身上，别叠成两层黑）。 */
dialog.dna-modal-mask:not([open]){display:none!important}
dialog.dna-modal-mask::backdrop{background:transparent!important}
.dna-banner-stop{flex:0 0 auto;display:none;align-items:center;justify-content:center;width:24px;height:24px;margin-left:2px;padding:0;border:1px solid rgba(255,255,255,.55);border-radius:6px;background:rgba(255,255,255,.18);color:#fff;font-size:.66rem;line-height:1;cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent;transition:background-color .16s,border-color .16s,transform .12s}
.dna-banner-run .dna-banner-stop{display:inline-flex}
.dna-banner-stop:hover{background:rgba(255,255,255,.34)}
.dna-banner-stop:active{transform:scale(.9)}
.dna-banner-stop i{font-size:.66rem;pointer-events:none}
/* ===== 更新留档：详情底部的历史存档区（与 dna.css 末尾那段对应，防 dna.css 被缓存） ===== */
#st-chatu8-settings #dna-tab .dna-hist{margin-top:14px;padding-top:12px;border-top:1px dashed var(--st-chatu8-border-color,rgba(128,128,128,.35))}
#st-chatu8-settings #dna-tab .dna-hist-h{display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:.78rem;font-weight:600;opacity:.85}
#st-chatu8-settings #dna-tab .dna-hist-n{margin-left:auto;font-weight:400;opacity:.7}
#st-chatu8-settings #dna-tab .dna-hist-empty{font-size:.74rem;line-height:1.65;opacity:.62}
#st-chatu8-settings #dna-tab .dna-hist-item{margin-bottom:6px;padding:6px 8px;border-radius:6px;border:1px solid var(--st-chatu8-border-color,rgba(128,128,128,.3))}
#st-chatu8-settings #dna-tab .dna-hist-item.is-open{background:rgba(128,128,128,.08)}
#st-chatu8-settings #dna-tab .dna-hist-main{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#st-chatu8-settings #dna-tab .dna-hist-t{font-size:.75rem;opacity:.8}
#st-chatu8-settings #dna-tab .dna-hist-acts{margin-left:auto;display:flex;gap:6px}
#st-chatu8-settings #dna-tab.dna-mobile .dna-hist-acts{margin-left:0;flex:0 0 auto}
#st-chatu8-settings #dna-tab .dna-mini-hist{color:var(--st-chatu8-warn-color,#f0b429);border-color:var(--dna-warn-line,rgba(240,180,41,.5))}
#st-chatu8-settings #dna-tab .dna-mini-hist:hover{background:var(--st-chatu8-warn-color,#f0b429);color:#1a1a1a}
#st-chatu8-settings #dna-tab .dna-mini-hist:disabled{opacity:.45;cursor:not-allowed}
#st-chatu8-settings #dna-tab .dna-hist-body{margin-top:8px}
/* 电脑版：同人资料库 / 世界书生成 —— 搜索与分类并排、条目铺成多列、面板限宽 */
#st-chatu8-settings #dna-tab .dna-lib-filters{display:grid;grid-template-columns:1fr;gap:10px;align-items:end}
#st-chatu8-settings #dna-tab .dna-lib-filters>.st-chatu8-field{margin-bottom:0}
#st-chatu8-settings #dna-tab.dna-desktop .dna-lib-filters{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobe"],
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobewb"]{width:100%;max-width:1180px;margin-left:auto;margin-right:auto}
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobe"] .dna-list,
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobewb"] .dna-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));align-content:start;align-items:start;gap:8px;max-height:560px}
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobe"] .dna-list>.dna-empty,
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobewb"] .dna-list>.dna-empty{grid-column:1/-1}
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobe"] .dna-lib-row,
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobewb"] .dna-lib-row{margin:0}
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobe"] .dna-lib-name,
#st-chatu8-settings #dna-tab.dna-desktop .dna-panel[data-dna-panel="ranobewb"] .dna-lib-name{overflow-wrap:anywhere}
`;
        if (document.getElementById('dna-preset-entry-style')) return;
        const st = document.createElement('style');
        st.id = 'dna-preset-entry-style';
        const P = '#st-chatu8-settings #dna-tab';
        st.textContent = [
            /* 整条钉死 76px（两行）：字多就省略号，别想把行撑高 */
            P + ' .dna-entry-line-preset{height:76px;overflow:hidden}',
            P + ' .dna-entry-line-preset .dna-entry-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
            P + ' .dna-entry-line-preset .st-chatu8-entry-preview{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
            /* 那排按钮：不许被压缩，内边距归零（尺寸由内联样式给） */
            P + ' .dna-entry-line-preset .st-chatu8-entry-actions{flex:0 0 auto}',
            P + ' .dna-entry-line-preset .st-chatu8-entry-actions>button{flex:0 0 auto;padding:0}',
            /* 到头了的上下移（第一条的上移 / 最后一条的下移）：灰掉 */
            P + ' .dna-entry-line-preset .st-chatu8-entry-actions>button:disabled,' +
                P + ' .dna-entry-line-preset .st-chatu8-entry-actions>button.is-off{opacity:.3;cursor:not-allowed}',
            /* 手机上：预览收起来，第二行只留按钮；第一行留给名字 */
            P + '.dna-mobile .dna-entry-line-preset .st-chatu8-entry-preview,' +
                P + '.dna-mobile .dna-entry-line-preset .dna-entry-len{display:none}'
        ].join('\n') + PRESET_EXTRA_CSS + IP_PAGER_CSS;
        document.head.appendChild(st);
    } catch (e) { presetEntryStyleDone = false; }
}

function renderPresetEntries(scope) {
    ensurePresetEntryStyle();
    const box = document.querySelector('#dna-tab [data-dna="' + dkey(scope, 'presetEntries') + '"]');
    if (!box) return;
    const list = presetEntries(undefined, scope);
    if (!list.length) {
        box.innerHTML = '<div class="dna-entries-empty">还没导入预设</div>';
        updatePresetMeta(scope);
        return;
    }
    /* 编辑框只在它所属的那套里展开 */
    const editing = (editingEntry >= 0 && editingScope === scope) ? editingEntry : -1;
    /* 有编辑框展开时把列表放高一点，写长条目才不憋屈 */
    try { box.classList.toggle('dna-entries-editing', editing >= 0); } catch (e) { /* 忽略 */ }
    /* 重绘别把列表滚动位置弹回顶部（条目多的时候调一次顺序就找不到刚才那条了） */
    const keepTop = box.scrollTop;
    box.innerHTML = list.map((e, i) => {
        const on = e.enabled !== false;
        const role = PRESET_ROLES.includes(e.role) ? e.role : 'user';
        const tag = role === 'system' ? 'SYS' : role === 'assistant' ? 'AST' : 'USR';
        const len = String(e.content || '').length;
        const open = (editing === i);
        /* 条目照智绘姬 LLM「上下文配置」的折叠条目做，但排成两行，
           因为手机上塞不下「名字 + 4 个按钮」：
             第一行 = 开关 / 角色徽标 / 条目名称 / 字数（名字独占一行，能看全）
             第二行 = 正文预览 + 上移 / 下移 / 编辑 / 删除 那排按钮
           整条高度钉死 76px，字再多也只是省略号，不会把行撑歪。
           高度与各段宽度都用内联写死，浏览器缓存旧 dna.css 也改变不了这个布局。 */
        const first = i === 0;
        const last = i === list.length - 1;
        const preview = String(e.content || '').replace(/\s+/g, ' ').trim();
        const LINE_STYLE = 'display:flex;flex-direction:column;justify-content:center;gap:6px;' +
            'height:76px;overflow:hidden;padding:6px 10px';
        const ROW_STYLE = 'display:flex;align-items:center;gap:8px;min-width:0;width:100%';
        const NAME_STYLE = 'flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;' +
            'white-space:nowrap;font-weight:500;font-size:0.9rem;line-height:1.2;opacity:' + (on ? '1' : '.45');
        const PREVIEW_STYLE = 'flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
            'font-size:0.82rem;color:var(--st-chatu8-text-secondary, inherit);opacity:' + (on ? '.85' : '.4');
        const IB_STYLE = 'width:30px;height:30px;min-width:30px;padding:0;margin:0;display:inline-flex;' +
            'align-items:center;justify-content:center;flex:0 0 auto;font-size:0.9rem;line-height:1';
        const row = '<div class="dna-entry-line dna-entry-line-preset" style="' + LINE_STYLE + '">'
            /* 第一行：条目名称在这，占满整行宽度 */
            + '<div style="' + ROW_STYLE + '">'
            + '<div class="st-chatu8-entry-toggle" style="flex:0 0 auto" title="启用 / 禁用这条">'
            + '<input type="checkbox"' + (on ? ' checked' : '') + '><span class="st-chatu8-slider"></span></div>'
            + '<span class="st-chatu8-entry-role-badge" data-role="' + role + '" style="flex:0 0 auto">' + tag + '</span>'
            + '<span class="dna-entry-name" style="' + NAME_STYLE + '" title="' + esc(e.name || '') + '">'
            + esc(e.name || ('条目 ' + (i + 1))) + '</span>'
            + '<span class="dna-entry-len" style="flex:0 0 auto">' + len + ' 字</span>'
            + '</div>'
            /* 第二行：预览在左，按钮在右 */
            + '<div style="' + ROW_STYLE + '">'
            + '<span class="st-chatu8-entry-preview" style="' + PREVIEW_STYLE + '" title="' + esc(preview) + '">'
            + esc(preview || '（这条是空的）') + '</span>'
            + '<div class="st-chatu8-entry-actions" style="flex:0 0 auto">'
            + '<button class="st-chatu8-icon-btn dna-entry-ibtn' + (first ? ' is-off' : '') + '" style="' + IB_STYLE + '" data-move="up"' + (first ? ' disabled' : '') + ' title="上移一位（往前挪）"><i class="fa-solid fa-arrow-up"></i></button>'
            + '<button class="st-chatu8-icon-btn dna-entry-ibtn' + (last ? ' is-off' : '') + '" style="' + IB_STYLE + '" data-move="down"' + (last ? ' disabled' : '') + ' title="下移一位（往后挪）"><i class="fa-solid fa-arrow-down"></i></button>'
            + '<button class="st-chatu8-icon-btn st-chatu8-entry-edit dna-entry-edit' + (open ? ' is-open' : '') + '" style="' + IB_STYLE + '" data-edit="' + i + '" title="编辑这条">'
            + '<i class="fa-solid fa-pen"></i></button>'
            + '<button class="st-chatu8-icon-btn danger dna-entry-ibtn" style="' + IB_STYLE + '" data-del="' + i + '" title="删除这条（整份预设不受影响）"><i class="fa-solid fa-trash"></i></button>'
            + '</div>'
            + '</div>'
            + '</div>';
        if (!open) return '<div class="dna-entry-item" data-idx="' + i + '">' + row + '</div>';
        const editor = '<div class="dna-entry-editor" data-editor="' + i + '">'
            + '<div class="dna-editor-row"><label>名称</label>'
            + '<input type="text" class="st-chatu8-text-input" data-ef="name" value="' + esc(e.name || '') + '"></div>'
            + '<div class="dna-editor-row"><label>角色</label>'
            + '<select class="st-chatu8-select" data-ef="role">'
            + PRESET_ROLES.map((r) => '<option value="' + r + '"' + (r === role ? ' selected' : '') + '>' + r + '</option>').join('')
            + '</select></div>'
            + '<div class="st-chatu8-field-col"><label>内容（支持 {{正文}} / {{角色卡设定}} / {{旧档案}} 等占位符）</label>'
            + '<textarea class="st-chatu8-textarea dna-mono" data-ef="content" rows="12">' + esc(e.content || '') + '</textarea></div>'
            + '<div class="dna-actions"><button class="st-chatu8-btn" data-eact="save"><i class="fa-solid fa-check"></i>保存这条</button>'
            + '<button class="st-chatu8-btn" data-eact="cancel">取消</button></div>'
            + '</div>';
        return '<div class="dna-entry-item" data-idx="' + i + '">' + row + editor + '</div>';
    }).join('');
    try { box.scrollTop = keepTop; } catch (e) { /* 忽略 */ }
    updatePresetMeta(scope);
}

/* 上移 / 下移一条：只在这份预设自己的条目数组里换位置。
   顺序＝真正发给 AI 的 messages 顺序，所以挪位置就是改提示词结构。 */
function movePresetEntry(idx, dir, scope) {
    const list = presetEntries(undefined, scope);
    const to = dir === 'up' ? idx - 1 : idx + 1;
    if (!list[idx] || to < 0 || to >= list.length) return false;
    const moved = list.splice(idx, 1)[0];
    list.splice(to, 0, moved);
    /* 正在展开的编辑框按下标记位，位置一变就对不上了，直接收起来 */
    if (editingScope === scope) editingEntry = -1;
    saveSettings(true);
    if (scope !== 'gen') { try { mirrorToChatu8([activePresetName(scope)], scope); } catch (err) { /* 忽略 */ } }
    renderPresetEntries(scope);
    log('预设条目「' + (moved.name || ('#' + (idx + 1))) + '」' + (dir === 'up' ? '上移' : '下移') + '到第 ' + (to + 1) + ' 条（' + presetScopeLabel(scope) + '）');
    return true;
}

/* 删掉一条：只删这一条，整份预设不动 */
function removePresetEntry(idx, scope) {
    const list = presetEntries(undefined, scope);
    const e = list[idx];
    if (!e) return false;
    const nm = String(e.name || ('条目 ' + (idx + 1)));
    if (!confirm('删除预设条目？\n\n' + nm + '\n\n（只删这一条，整份预设和其它条目都不动）')) return false;
    list.splice(idx, 1);
    if (editingScope === scope) editingEntry = -1;
    saveSettings(true);
    if (scope !== 'gen') { try { mirrorToChatu8([activePresetName(scope)], scope); } catch (err) { /* 忽略 */ } }
    renderPresetCard(scope);
    log('已删除预设条目「' + nm + '」（还剩 ' + list.length + ' 条 · ' + presetScopeLabel(scope) + '）');
    return true;
}

/* 保存某一条的修改，并同步到智绘姬那份预设副本 */
function savePresetEntry(idx, patch, scope) {
    const list = presetEntries(undefined, scope);
    const e = list[idx];
    if (!e) return false;
    if (typeof patch.name === 'string') e.name = patch.name.trim() || e.name;
    if (PRESET_ROLES.includes(patch.role)) e.role = patch.role;
    if (typeof patch.content === 'string') e.content = patch.content;
    saveSettings(true);
    if (scope !== 'gen') { try { mirrorToChatu8([activePresetName(scope)], scope); } catch (err) { /* 忽略 */ } }
    return true;
}

/* 只改计数文字，不重绘列表（免得滚动位置被重置） */
function updatePresetMeta(scope) {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const list = presetEntries(undefined, scope);
    const on = list.filter((e) => e.enabled !== false).length;
    const cnt = tab.querySelector('[data-dna="' + dkey(scope, 'presetEntryCount') + '"]');
    if (cnt) cnt.textContent = on + ' / ' + list.length;
    const kv = tab.querySelector('[data-dna="' + dkey(scope, 'presetInfo') + '"]');
    if (kv && list.length) {
        const row = kv.querySelector('.dna-kv-row:nth-child(2) .dna-kv-v');
        if (row) row.textContent = list.length + ' 条（启用 ' + on + '）';
    }
}

/* 全开 / 全关 */
function setAllPresetEntries(on, scope) {
    const list = presetEntries(undefined, scope);
    if (!list.length) return;
    list.forEach((e) => { e.enabled = on; });
    saveSettings(true);
    renderPresetEntries(scope);
    log('预设条目全部' + (on ? '打开' : '关掉') + '（' + list.length + ' 条）');
}

/* ------------------------------ JSON 解析（原样搬自原脚本） ------------------------------ */
function extractBracket(s, open, close) {
    const start = s.indexOf(open);
    if (start < 0) return null;
    let depth = 0, inStr = false, escNext = false;
    for (let i = start; i < s.length; i++) {
        const c = s.charAt(i);
        if (inStr) {
            if (escNext) { escNext = false; continue; }
            if (c === '\\') { escNext = true; continue; }
            if (c === '"') inStr = false;
            continue;
        }
        if (c === '"') { inStr = true; continue; }
        if (c === open) depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) return s.slice(start, i + 1);
        }
    }
    return null;
}

function stripFence(t) {
    const m = String(t || '').match(/```(?:json)?\s*([\s\S]*?)```/);
    return m ? m[1].trim() : String(t || '').trim();
}

function jsonTry(s) {
    try {
        const o = JSON.parse(s);
        return (o && typeof o === 'object' && !Array.isArray(o)) ? o : null;
    } catch (e) { return null; }
}

function jsonRepair(s) {
    return String(s)
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/,\s*([}\]])/g, '$1');
}

function asProfileArray(x) {
    if (!Array.isArray(x)) return null;
    /* 空数组是合法结果：模型明确表示本轮没有可收录角色，不应被当成解析失败。 */
    return x.filter((v) => v && typeof v === 'object' && !Array.isArray(v));
}

function parseObjects(t) {
    const out = [];
    let pos = 0;
    while (pos < t.length) {
        const i = t.indexOf('{', pos);
        if (i < 0) break;
        const seg = extractBracket(t.slice(i), '{', '}');
        if (!seg) break;
        const o = jsonTry(seg) || jsonTry(jsonRepair(seg));
        if (o && !Array.isArray(o)) out.push(o);
        pos = i + seg.length;
    }
    return out.length ? out : null;
}

function parseProfileList(txt) {
    const t = stripFence(txt);
    let arr = asProfileArray(jsonTry(t));
    if (arr) return arr;
    const whole = jsonTry(t) || jsonTry(jsonRepair(t));
    if (whole && !Array.isArray(whole)) {
        for (const k in whole) {
            arr = asProfileArray(whole[k]);
            if (arr) return arr;
        }
    }
    const i = t.indexOf('['), j = t.lastIndexOf(']');
    if (i >= 0 && j > i) {
        const seg = t.slice(i, j + 1);
        arr = asProfileArray(jsonTry(seg)) || asProfileArray(jsonTry(jsonRepair(seg)));
        if (arr) return arr;
    }
    return parseObjects(t);
}

function normalizeProfile(raw, name) {
    if (!raw) return null;
    const norm = (s) => String(s).replace(/[\s_\-\/·、]/g, '').toLowerCase();
    const flat = {};
    for (const k in raw) {
        if (raw[k] !== undefined && raw[k] !== null) flat[norm(k)] = String(raw[k]).trim();
    }
    const pick = (...keys) => {
        for (const k of keys) {
            const v = flat[norm(k)];
            if (v) return v;
        }
        return '';
    };
    /* 模板字段 → AI 可能用的别名（自定义字段没别名，就按字段名本身取） */
    const ALIAS = {
        '别称': ['别称', '别名', '小名', '外号', '绰号', '花名', '昵称', 'alias', 'aliases', 'nickname', 'nicknames'],
        '性别/年龄': ['性别/年龄', '性别年龄', '性别', '年龄', 'gender_age', 'gender', 'age'],
        '外貌特征': ['外貌特征', '外貌', '外观', '外貌描述', 'appearance', 'looks'],
        '当前衣着/装扮': ['当前衣着/装扮', '当前衣着', '当前装扮', '衣着', '装扮', '服装', 'current_outfit', 'outfit'],
        '核心DNA': ['核心DNA', '核心dna', 'core_dna', 'DNA', '核心基因'],
        '服装DNA': ['服装DNA', '服装dna', 'clothing_dna', '服饰DNA', '衣物DNA'],
        '本名': ['本名', '原名', '原始姓名', 'original_name', 'realname'],
        '外貌串': ['外貌串', '外貌提示词', '外貌prompt', 'appearance_prompt', 'appearanceprompt'],
        '服装串': ['服装串', '服装提示词', '服装prompt', 'outfit_prompt', 'outfitprompt']
    };
    const out = { '姓名': pick('姓名', 'name', '名字', '角色名', '角色') || name };
    let filled = 0;
    for (const f of tplFields()) {
        if (f === '姓名') continue;
        const keys = ALIAS[f] ? [f].concat(ALIAS[f]) : [f];
        const v = pick.apply(null, keys);
        out[f] = v;
        if (v) filled++;
    }
    if (!filled) return null;
    return out;
}


/* ------------------------------ AI 调用 ------------------------------ */

/* 智绘姬 LLM 配置列表（全部） */
function allProfiles() {
    try {
        const ch = extension_settings[CHATU8];
        if (!ch || !ch.llm_profiles || typeof ch.llm_profiles !== 'object') return {};
        return ch.llm_profiles;
    } catch (e) { return {}; }
}

/* DNA 自己选的那份配置名；没选过就跟着智绘姬当前那份走（只读，不写回）。
   scope：lib = 档案库（默认），gen = 手动生成。手动生成没单独选过时沿用档案库那份。 */
function currentProfileName(scope) {
    const list = allProfiles();
    /* 手动生成：先看自己选的那份，没选/已失效就退到档案库那份，再退到智绘姬当前那份 */
    const tries = scope === 'gen' ? [S.llmProfileGen, S.llmProfile]
        : (scope === 'ranobe' ? [S.llmProfileRanobe, S.llmProfileGen, S.llmProfile] : [S.llmProfile]);
    for (const n of tries) { if (n && list[n]) return n; }
    try {
        const ch = extension_settings[CHATU8];
        const fallback = (ch && ch.current_llm_profile) || '';
        if (fallback && list[fallback]) return fallback;
    } catch (e) { /* 忽略 */ }
    return '';
}

/* 只改 DNA 自己的选择，绝不碰智绘姬的 current_llm_profile */
function switchProfile(name, scope) {
    if (!name) return false;
    if (!allProfiles()[name]) return false;
    if (scope === 'gen') S.llmProfileGen = name;
    else if (scope === 'ranobe') S.llmProfileRanobe = name;
    else S.llmProfile = name;
    saveSettings(true);
    return true;
}

/* 把下拉框填成智绘姬那几份配置（scope：lib / gen 各一个下拉） */
function fillProfileSelect(scope) {
    const sel = document.querySelector('#dna-tab [data-dna="' + dkey(scope, 'profileSelect') + '"]');
    if (!sel) return;
    const list = allProfiles();
    const names = Object.keys(list);
    const cur = currentProfileName(scope);
    if (!names.length) {
        sel.innerHTML = '<option value="">（智绘姬里还没有 LLM 配置）</option>';
        sel.value = '';
        return;
    }
    sel.innerHTML = names.map((n) => {
        const p = list[n] || {};
        const m = String(p.model || '未选模型');
        return '<option value="' + esc(n) + '">' + esc(n) + ' · ' + esc(m) + '</option>';
    }).join('');
    sel.value = list[cur] ? cur : names[0];
}

/* 把当前配置的全部字段摊开展示（scope：lib / gen 各一块） */
function renderConfigDetail(scope) {
    const box = document.querySelector('#dna-tab [data-dna="' + dkey(scope, 'configDetail') + '"]');
    if (!box) return;
    const p = chatu8Profile(scope);
    if (!p) { box.innerHTML = ''; return; }
    const onOff = (v, d) => (v === undefined || v === null ? d : (v ? '开' : '关'));
    const rows = [
        ['API Base URL', p.api_url || '（空）'],
        ['API Key', p.api_key ? (String(p.api_key).slice(0, 6) + '••••••' + String(p.api_key).slice(-4)) : '（空）'],
        ['模型', p.model || '（未选）'],
        ['渠道', p.channel_type === 'vertex' ? 'Vertex' : 'OpenAI'],
        ['温度', (p.enable_temperature === false ? '（未启用）' : '') + (p.temperature ?? '—')],
        ['Top P', (p.enable_top_p === false ? '（未启用）' : '') + (p.top_p ?? '—')],
        ['最大 tokens', (p.enable_max_tokens === false ? '（未启用）' : '') + (p.max_tokens ?? '—')],
        ['流式输出', onOff(p.stream, '关')],
        ['绕过代理', onOff(p.bypass_proxy, '关')],
        ['合并 system/user', onOff(p.merge_system_user, '关')],
        ['发送图片', onOff(p.send_images, '关')],
        ['自定义请求头', p.enable_custom_headers ? (p.custom_headers || '（已启用但为空）') : '关'],
        ['自定义请求体', p.enable_custom_body_params ? (p.custom_body_params || '（已启用但为空）') : '关']
    ];
    box.innerHTML = rows.map((r) =>
        '<div class="dna-kv-row"><span class="dna-kv-k">' + esc(r[0]) + '</span>' +
        '<span class="dna-kv-v">' + esc(String(r[1])) + '</span></div>'
    ).join('');
}

/* 当前选中的那份配置（填了地址和模型才算可用） */
function chatu8Profile(scope) {
    const name = currentProfileName(scope);
    if (!name) return null;
    const p = allProfiles()[name];
    return (p && typeof p === 'object') ? p : null;
}

function resolveApi(scope) {
    const p = chatu8Profile(scope);
    if (!p) throw new Error('智绘姬里还没有 LLM 配置：请到「LLM」页签新建一份并填好地址、Key、模型');
    if (String(p.channel_type || 'openai') === 'vertex') {
        throw new Error('智绘姬当前是 Vertex 渠道，档案库只支持 OpenAI 兼容渠道，请到 LLM 页签切回 OpenAI 渠道');
    }
    const url = String(p.api_url || '').trim();
    const model = String(p.model || '').trim();
    if (!url) throw new Error('智绘姬 LLM 页签还没填 API Base URL');
    if (!model) throw new Error('智绘姬 LLM 页签还没选模型');
    return {
        source: '智绘姬 LLM',
        format: 'openai',
        url,
        key: String(p.api_key || ''),
        model,
        temperature: p.enable_temperature === false ? 1 : numOr(p.temperature, 0.8),
        maxTokens: p.enable_max_tokens === false ? 0 : numOr(p.max_tokens, 4000),
        customHeaders: apiExtras(scope).headersObj
    };
}function openAiEndpoint(base, path) {
    const b = String(base || '').trim().replace(/\/+$/, '');
    if (!b) throw new Error('还没填 API 地址');
    if (/\/chat\/completions$/i.test(b)) return b;
    if (/\/messages$/i.test(b)) return b;
    if (/\/v\d+[a-z]*$/i.test(b)) return b + path;
    return b + '/v1' + path;
}

function isSafetyBlock(msg) {
    return /prohibited use policy|sensitive words|SAFETY|content policy|use-policy|content_filter|blockReason|PROHIBITED_CONTENT|返回内容为空/i.test(String(msg || ''));
}

function clipText(t, per) {
    return String(t || '').split('\n').map((l) => (l.length > per ? l.slice(0, per) + '……' : l)).join('\n');
}

/* 组装请求头：智绘姬里可以加自定义头（比如各种中转站要的字段） */
function apiHeaders(api, extra) {
    const h = { 'Content-Type': 'application/json' };
    if (api.key) h['Authorization'] = 'Bearer ' + api.key;
    if (api.customHeaders && typeof api.customHeaders === 'object') {
        for (const k in api.customHeaders) if (k) h[k] = String(api.customHeaders[k]);
    }
    return Object.assign(h, extra || {});
}

/* 从智绘姬配置里取出要用的附加项 */
function apiExtras(scope) {
    const p = chatu8Profile(scope) || {};
    let customHeaders = null;
    if (p.enable_custom_headers && p.custom_headers) {
        customHeaders = {};
        /* 智绘姬这里是 "Key: Value" 每行一条 */
        String(p.custom_headers).split('\n').forEach((line) => {
            const i = line.indexOf(':');
            if (i > 0) {
                const k = line.slice(0, i).trim();
                const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
                if (k) customHeaders[k] = v;
            }
        });
    }
    return {
        bypassProxy: !!p.bypass_proxy,
        customHeaders,
        headersObj: customHeaders
    };
}

/* 输出上限取哪个：「AI 回复上限」优先；填 0 = 不设上限（交给服务端默认）。
   只有完全没传（undefined）时才退回智绘姬 LLM 配置里的 max_tokens。 */
function replyPower(replyMax, profileMax) {
    if (typeof replyMax === 'number' && isFinite(replyMax)) {
        return replyMax > 0 ? Math.round(replyMax) : 0;
    }
    return profileMax > 0 ? profileMax : 0;
}

/* 读 SSE 流：边收边把累积文本回调出去。返回完整文本。
   只认 OpenAI 的 `data: {...}` 格式；拿到内容才算成功，否则抛错让上层回退。 */
async function readOpenAIStream(res, onDelta, signal) {
    const reader = res.body.getReader();
    const dec = new TextDecoder('utf-8');
    let buf = '';
    let acc = '';
    let got = false;
    while (true) {
        if (signal && signal.aborted) throw new Error('已手动中断');
        const step = await reader.read();
        if (step.done) break;
        buf += dec.decode(step.value, { stream: true });
        /* SSE 一帧可能被拆成多个 chunk，按行切，最后一段留到下次 */
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
            const t = line.trim();
            if (!t || t.charAt(0) === ':') continue;
            if (t.indexOf('data:') !== 0) continue;
            const payload = t.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            let j;
            try { j = JSON.parse(payload); } catch (e) { continue; }
            const ch = j && j.choices && j.choices[0];
            const d = (ch && (ch.delta || ch.message)) || {};
            let piece = d.content;
            /* 有些兼容层把 content 拆成数组 */
            if (Array.isArray(piece)) piece = piece.map((x) => (x && (x.text || x.content)) || '').join('');
            if (typeof piece !== 'string' || !piece) continue;
            got = true;
            acc += piece;
            if (onDelta) onDelta(acc, piece);
        }
    }
    if (!got) throw new Error('流式没有返回任何内容');
    return acc;
}

async function callOpenAI(prompt, api, signal, replyMax, onDelta, scope) {
    const url = openAiEndpoint(api.url, '/chat/completions');
    const plan = applyBreakthrough({}, normalizeMessages(prompt));
    /* 真要挂 tools 时正文在 tool_calls 里、而且不能流式，整段生成完才有内容；
       这段时间回复框空着像卡死，先写一条「正在处理」提示（不挂 tools 就完全不显示）。 */
    if (plan && Array.isArray(plan.tools) && plan.tools.length) markToolWait(scope);
    const body = {
        model: api.model,
        messages: plan.messages,
        temperature: api.temperature
    };
    if (plan.tools) { body.tools = plan.tools; body.tool_choice = plan.toolChoice; }
    const mtOut = replyPower(replyMax, api.maxTokens);
    if (mtOut > 0) body.max_tokens = mtOut;
    /* 要实时显示时才开流式。开了自定义 Tool 的不用流式：
       那种模式下正文在 tool_calls 里，流式分片拼起来很容易缺内容。 */
    const wantStream = !!onDelta && !plan.tools;
    if (wantStream) body.stream = true;
    const res = await fetch(url, {
        method: 'POST',
        headers: apiHeaders(api),
        body: JSON.stringify(body),
        signal
    });
    if (!res.ok) {
        const bad = await res.text();
        throw new Error('HTTP ' + res.status + '：' + bad.slice(0, 300));
    }
    /* 流式：能读就读，读不出内容就退回一次性读取（最多多发一次请求） */
    if (wantStream && res.body && typeof res.body.getReader === 'function') {
        try {
            const streamed = await readOpenAIStream(res, onDelta, signal);
            if (String(streamed).trim()) return streamed;
        } catch (e) {
            if (signal && signal.aborted) throw new Error('已手动中断');
            /* 流式失败：重新发一次非流式请求，保证功能不因为流式挂掉 */
            delete body.stream;
            const res2 = await fetch(url, {
                method: 'POST',
                headers: apiHeaders(api),
                body: JSON.stringify(body),
                signal
            });
            const raw2 = await res2.text();
            if (!res2.ok) throw new Error('HTTP ' + res2.status + '：' + raw2.slice(0, 300));
            return finishOpenAI(raw2, plan.toolFields);
        }
        return '';
    }
    const raw = await res.text();
    return finishOpenAI(raw, plan.toolFields);
}

/* 解析 OpenAI 格式的返回（非流式）。流式拿不到内容时也走这里。 */
function finishOpenAI(raw, toolFields) {
    let data;
    try { data = JSON.parse(raw); } catch (e) { throw new Error('返回不是 JSON：' + raw.slice(0, 200)); }
    const ch = data && data.choices && data.choices[0];
    const msg = ch ? ch.message : null;
    const finish = String((ch && ch.finish_reason) || (ch && ch.finishReason) || '');
    const usage = (data && data.usage) || {};
    /* 被输出上限截断：内容还会返回，但后面的档案会缺，提示一句 */
    if (finish === 'length') {
        log('⚠️ 输出被截断（用完 ' + (usage.completion_tokens || '?') + ' token 上限），'
            + '后面的档案可能没写完。把「AI 回复上限」调大，或分两批。', 'error');
    }
    /* 开了自定义 Tool 时，正文在 tool_calls 里 */
    if (msg && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
        const decoded = decodeToolCall(msg, toolFields || chatu8ToolConfig());
        if (decoded && String(decoded).trim()) return String(decoded);
    }
    let txt = msg ? msg.content : (ch ? ch.text : '');
    if (txt && String(txt).trim()) return String(txt);

    /* 空正文的几种常见情况，分别给能照着做的提示 */
    if (msg && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
        const tc = msg.tool_calls[0];
        if (tc && tc.function && tc.function.arguments) return String(tc.function.arguments);
    }
    if (finish === 'length') {
        const rt = usage.completion_tokens_details && usage.completion_tokens_details.reasoning_tokens;
        throw new Error('输出被截断（finish_reason=length）：max_tokens 用完了，正文一个字都没出来'
            + (rt ? '（其中思考占了 ' + rt + ' tokens）' : '')
            + '。请到 DNA「设置 → 运行」把「AI 回复上限」调大（建议 10000 以上），'
            + '或把「每次扫描最近 N 层」调小再试。');
    }
    /* 有的推理模型把正文全塞进 reasoning_content */
    if (finish !== 'length' && msg) {
        const rc = msg.reasoning_content || msg.reasoning || msg.thinking;
        if (rc && String(rc).trim()) return String(rc);
    }
    throw new Error('返回内容为空（finish_reason=' + (finish || '未知')
        + '，usage=' + JSON.stringify(usage) + '）：' + raw.slice(0, 300));
}

async function callAnthropic(prompt, api, signal, replyMax) {
    const url = openAiEndpoint(api.url, '/messages');
    const mt = replyPower(replyMax, api.maxTokens) || 4000;
    /* Anthropic 不收 messages 里的 system，单独提到 system 字段 */
    const all = normalizeMessages(prompt);
    const sys = all.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    const rest = all.filter((m) => m.role !== 'system');
    const body = {
        model: api.model,
        max_tokens: mt,
        temperature: api.temperature,
        messages: rest.length ? rest : [{ role: 'user', content: '（无正文）' }]
    };
    if (sys) body.system = sys;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': api.key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(body),
        signal
    });
    const raw = await res.text();
    if (!res.ok) throw new Error('HTTP ' + res.status + '：' + raw.slice(0, 300));
    let data;
    try { data = JSON.parse(raw); } catch (e) { throw new Error('返回不是 JSON：' + raw.slice(0, 200)); }
    const out = ((data && data.content) || []).map((b) => (b && b.text ? b.text : '')).join('');
    if (!out.trim()) {
        const stop = String((data && data.stop_reason) || '未知');
        throw new Error('返回内容为空（stop_reason=' + stop + '）'
            + (stop === 'max_tokens' ? '：输出上限用完了，请到 DNA「设置 → 运行」把「AI 回复上限」调大（建议 10000 以上）' : '')
            + '：' + raw.slice(0, 300));
    }
    return out;
}

async function callGemini(prompt, api, signal, replyMax) {
    const base = String(api.url || '').trim().replace(/\/+$/, '');
    let url;
    if (/:(generateContent|streamGenerateContent)$/i.test(base)) {
        url = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'key=' + encodeURIComponent(api.key);
    } else {
        url = base + (/\/v\d+[a-z]*$/i.test(base) ? '' : '/v1beta') +
            '/models/' + encodeURIComponent(api.model) + ':generateContent?key=' + encodeURIComponent(api.key);
    }
    const gen = { temperature: api.temperature };
    const mtOut = replyPower(replyMax, api.maxTokens);
    if (mtOut > 0) gen.maxOutputTokens = mtOut;
    /* Gemini 的 system 走 systemInstruction，其余按 user/model 轮次发 */
    const all = normalizeMessages(prompt);
    const sys = all.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    const rest = all.filter((m) => m.role !== 'system');
    const body = {
        contents: (rest.length ? rest : [{ role: 'user', content: '（无正文）' }]).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        })),
        generationConfig: gen
    };
    if (sys) body.systemInstruction = { parts: [{ text: sys }] };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal
    });
    const raw = await res.text();
    if (!res.ok) throw new Error('HTTP ' + res.status + '：' + raw.slice(0, 300));
    let data;
    try { data = JSON.parse(raw); } catch (e) { throw new Error('返回不是 JSON：' + raw.slice(0, 200)); }
    const cand = data && data.candidates && data.candidates[0];
    const out = cand && cand.content && cand.content.parts
        ? cand.content.parts.map((p) => (p && p.text ? p.text : '')).join('')
        : '';
    if (!out.trim()) {
        const fr = String((cand && (cand.finishReason || cand.finish_reason)) || '未知');
        const block = data && data.promptFeedback && data.promptFeedback.blockReason;
        throw new Error('返回内容为空（finishReason=' + fr + (block ? ' / blockReason=' + block : '') + '）'
            + (fr === 'MAX_TOKENS' ? '：max_tokens 用完了，请把「最大 tokens」调大（建议 8000 以上）' : '')
            + '：' + raw.slice(0, 300));
    }
    return out;
}

async function callAI(prompt, scope, replyMax, onDelta) {
    const api = resolveApi(scope);
    if (!api.url) throw new Error('智绘姬 LLM 页签里还没填 API 地址');
    if (!api.model) throw new Error('智绘姬 LLM 页签里还没选模型');
    const signal = abortSignal();
    if (api.format === 'anthropic') return callAnthropic(prompt, api, signal, replyMax);
    if (api.format === 'gemini') return callGemini(prompt, api, signal, replyMax);
    return callOpenAI(prompt, api, signal, replyMax, onDelta, scope);
}

/* ------------------------------ 中断请求 ------------------------------ */
/* 一次任务（扫描 / 手动生成 / 测试）共用一个 AbortController；
   按钮只在这期间可用，任务结束自动失效。 */
let abortCtl = null;
const ABORT_KEYS = ['abortScan', 'genAbortWorld', 'genAbortChars', 'genAbortMix', 'genAbortText', 'ranobeAbort', 'ranobewbAbort'];

function abortSignal() {
    if (typeof AbortController !== 'function') return undefined;
    if (!abortCtl) abortCtl = new AbortController();
    return abortCtl.signal;
}

function abortedNow() {
    return !!(abortCtl && abortCtl.signal && abortCtl.signal.aborted);
}

function syncAbortBtns() {
    const on = !!(abortCtl && abortCtl.signal && !abortCtl.signal.aborted);
    for (const k of ABORT_KEYS) {
        const b = document.querySelector('#dna-tab [data-dna="' + k + '"]');
        if (!b) continue;
        b.disabled = !on;
        b.classList.toggle('dna-btn-abort-on', on);
    }
}

function clearAbort() {
    abortCtl = null;
    syncAbortBtns();
}

function doAbort() {
    if (!abortCtl || !abortCtl.signal || abortCtl.signal.aborted) {
        toast('现在没有正在进行的请求');
        return;
    }
    abortCtl.abort();
    log('已中断请求，正在断开连接…');
    toast('已中断');
    syncAbortBtns();
}

/* 自动重试次数：0 = 不重试（默认）。只在「内容过滤 / 返回空」这类错误上重试，
   网络断了、key 错了、模型名错了都不重试——重试也不会变好，只是白花钱。 */
function retryTimes() {
    const n = Number(S.retryCount);
    return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.floor(n))) : 0;
}

async function callSafe(prompt, softPrompt, scope, altPrompt, replyMax, onDelta) {
    abortSignal();          /* 本轮任务的中断控制器，按钮在这一刻才可用 */
    syncAbortBtns();
    try {
        try {
            return await callAI(prompt, scope, replyMax, onDelta);
        } catch (e) {
            if (abortedNow()) throw new Error('已手动中断');
            const max = retryTimes();
            const msg = String((e && e.message) || e);
            if (max <= 0) {
                if (isSafetyBlock(msg)) log('请求没走通（' + msg.slice(0, 140) + '）；自动重试是关闭的（0 次），不再试', 'error');
                throw e;
            }
            if (!isSafetyBlock(msg)) throw e;   /* 这类错重试也没用 */
            let last = e;
            for (let i = 1; i <= max; i++) {
                if (abortedNow()) throw new Error('已手动中断');
                /* 第 1 次用精简正文，第 2 次换成内置提示词，之后原样再试 */
                let p = prompt;
                let what = '原样重试';
                if (i === 1 && softPrompt) { p = softPrompt; what = '精简正文'; }
                else if (i === 2 && altPrompt) { p = altPrompt; what = '换内置提示词'; }
                log('自动重试 ' + i + '/' + max + '（' + what + '）……上一次：' + String((last && last.message) || last).slice(0, 120), 'error');
                try {
                    return await callAI(p, scope, replyMax, onDelta);
                } catch (e2) {
                    if (abortedNow()) throw new Error('已手动中断');
                    last = e2;
                    if (!isSafetyBlock(String((e2 && e2.message) || e2))) throw e2;
                }
            }
            log('自动重试 ' + max + ' 次都没成功，放弃', 'error');
            throw last;
        }
    } finally {
        clearAbort();       /* 任务收尾：按钮回到不可用 */
    }
}

/* ------------------------------ 附加配置：智绘姬的自定义 Tool + 末尾多 Role 消息 ------------------------------ */

/* 读智绘姬那份配置（都是全局的，和 LLM 页签里看到的是同一份） */
function chatu8ToolConfig() {
    try {
        const ch = extension_settings[CHATU8];
        return (ch && ch.tool_call_config) || null;
    } catch (e) { return null; }
}

function chatu8TailConfig() {
    try {
        const ch = extension_settings[CHATU8];
        return (ch && ch.tail_messages_config) || null;
    } catch (e) { return null; }
}

/* 插件自己那两个开关才是决定权：智绘姬 LLM 页签那边的 enabled 只管它自己，不干涉这里 */
function toolEnabled() {
    if (!S.breakTool) return false;
    const c = chatu8ToolConfig();
    return !!(c && Array.isArray(c.fields) && c.fields.length);
}

function tailEnabled() {
    if (!S.breakTail) return false;
    const c = chatu8TailConfig();
    return !!(c && Array.isArray(c.messages) && c.messages.length);
}

/* 智绘姬那边的原始开关状态，只用来在面板上说明，不参与判断 */
function chatu8ToolSwitch() {
    const c = chatu8ToolConfig();
    return !!(c && c.enabled !== false);
}

function chatu8TailSwitch() {
    const c = chatu8TailConfig();
    return !!(c && c.enabled !== false);
}

/* 和智绘姬一样：动态随机名（防缓存），或固定名 */
function makeToolName() {
    const c = chatu8ToolConfig() || {};
    if ((c.nameMode || 'dynamic') === 'fixed' && String(c.fixedName || '').trim()) {
        return String(c.fixedName).trim();
    }
    const prefix = c.prefix || 'agw_emit_';
    let nonce = '';
    try {
        const arr = new Uint8Array(8);
        crypto.getRandomValues(arr);
        nonce = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        nonce = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    }
    return prefix + nonce;
}

/* 照智绘姬 buildSyntheticToolSchema 的规则拼工具定义 */
function buildToolSchema(name, cfg) {
    const properties = {};
    const required = [];
    for (const f of (cfg.fields || [])) {
        if (!f || !String(f.name || '').trim()) continue;
        const key = String(f.name).trim();
        properties[key] = { type: 'string', description: String(f.description || ('Field ' + key)) };
        if (f.required !== false) required.push(key);
    }
    if (!Object.keys(properties).length) {
        properties.thought_and_context = { type: 'string', description: '你的思考与正文' };
        required.push('thought_and_context');
    }
    return {
        type: 'function',
        function: {
            name,
            description: String(cfg.desc || 'must使用这个工具来进行内容思考和正文回复'),
            parameters: {
                type: 'object',
                properties,
                required: required.length ? required : Object.keys(properties).slice(0, 1)
            }
        }
    };
}

/* 把末尾多 Role 消息追加到 messages 末尾，%TOOL_NAME% 换成真实工具名（同智绘姬 injectTailMessages） */
function injectTail(messages, toolName) {
    const cfg = chatu8TailConfig();
    const out = Array.isArray(messages) ? messages.slice() : [];
    if (!cfg || !S.breakTail || !Array.isArray(cfg.messages)) return out;
    for (const item of cfg.messages) {
        if (!item || !item.role || !item.content) continue;
        const content = String(item.content)
            .replace(/%TOOL_NAME%/g, toolName)
            .replace(/TOOL_NAME%/g, toolName)
            .replace(/%s/g, toolName);
        out.push({ role: String(item.role), content });
    }
    return out;
}

/* 模型走 tool call 回来时，按智绘姬的字段顺序把内容还原成正文 */
function decodeToolCall(message, cfg) {
    const tc = message && Array.isArray(message.tool_calls) ? message.tool_calls[0] : null;
    if (!tc || !tc.function) return '';
    let args = tc.function.arguments;
    if (args && typeof args === 'object') args = JSON.stringify(args);
    let parsed = null;
    try { parsed = JSON.parse(String(args || '')); } catch (e) { parsed = null; }
    if (!parsed) return String(args || '');
    const calls = message && Array.isArray(message.tool_calls) ? message.tool_calls : [];
    if (calls.length > 1) {
        const chunks = calls.map((call) => decodeToolCall({ tool_calls: [call] }, cfg)).filter((s) => String(s || '').trim());
        if (chunks.length) return chunks.join('\n\n');
    }
    /* 上下文预设 ToolCall 与智绘姬 LLM 页签一致：优先读取 display_stream，
       这样即使档案库自己的 Tool 字段配置不同，也不会丢掉预设引导输出。 */
    if (Object.prototype.hasOwnProperty.call(parsed, 'display_stream')) {
        const stream = parsed.display_stream;
        const thought = parsed.thought || parsed.reasoning || '';
        if (thought) return '<thinking>' + String(thought) + '</thinking>\n\n' + String(stream == null ? '' : stream);
        return String(stream == null ? '' : stream);
    }
    const fields = Array.isArray(cfg) && cfg.length
        ? cfg
        : ((cfg && Array.isArray(cfg.fields) && cfg.fields.length)
            ? cfg.fields : [{ name: 'thought_and_context', wrapTag: '' }]);
    let out = '';
    if (calls.length > 1) {
        const chunks = calls.map((call) => decodeToolCall({ tool_calls: [call] }, fields)).filter((s) => String(s || '').trim());
        if (chunks.length) return chunks.join('\n\n');
    }
    for (const f of fields) {
        const key = String(f.name || '').trim();
        if (!key) continue;
        const v = parsed[key];
        if (v === undefined || v === null) continue;
        const sv = typeof v === 'string' ? v : JSON.stringify(v);
        const tag = String(f.wrapTag || '').trim();
        if (tag) {
            const t = sv.trim();
            const already = t.startsWith('<' + tag + '>') || (tag === 'thinking' && t.startsWith('<think'));
            out += already ? (out ? '\n\n' : '') + t : '<' + tag + '>' + sv + '</' + tag + '>\n\n';
        } else {
            out += (out ? '\n\n' : '') + sv;
        }
    }
    /* 模型用了配置里没有的字段名 → 按原顺序把所有值拼出来，别把内容丢了 */
    if (!out.trim()) {
        const vals = Object.keys(parsed)
            .map((k) => parsed[k])
            .filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
        out = vals.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n\n');
    }
    return out;
}

/* 从上下文预设中提取「【ToolCall引导】」：
   这是照搬智绘姬 LLM 页签 transformToolCallRequest 的核心行为。
   工具说明进入 tool.description，字段说明进入 display_stream 的 description，
   其余正文仍留在 messages，避免档案正文被塞进工具描述后截断。 */
function extractPresetToolCallGuide(messages) {
    if (!Array.isArray(messages)) return { handled: false };
    const hasMarker = messages.some((m) => String(m && m.content || '').indexOf('【ToolCall引导】') >= 0);
    if (!hasMarker) return { handled: false };
    const toolName = makeToolName();
    let toolDesc = '';
    let fieldDesc = '';
    const guides = [];
    const context = [];
    for (const m of messages) {
        if (!m || !m.content) continue;
        const role = PRESET_ROLES.includes(m.role) ? m.role : 'user';
        const text = stripPresetComments(String(m.content)).replace(/%TOOL_NAME%/g, toolName).replace(/TOOL_NAME%/g, toolName);
        const blocks = text.match(/【ToolCall引导】[\s\S]*?(?=(?:【ToolCall引导】|$))/gi) || [];
        if (!blocks.length) {
            context.push({ role, content: text });
            continue;
        }
        const desc = text.match(/【ToolCall引导】(?:工具说明|工具描述)[\s\S]*?(?=(?:【ToolCall引导】|$))/i);
        const field = text.match(/【ToolCall引导】(?:字段说明|正文说明|参数说明)[\s\S]*?(?=(?:【ToolCall引导】|$))/i);
        if (desc) toolDesc = stripPresetComments(desc[0].replace(/【ToolCall引导】(?:工具说明|工具描述)\s*/i, '').trim());
        if (field) fieldDesc = stripPresetComments(field[0].replace(/【ToolCall引导】(?:字段说明|正文说明|参数说明)\s*/i, '').trim());
        for (const block of blocks) {
            if (desc && block === desc[0]) continue;
            if (field && block === field[0]) continue;
            const cleaned = stripPresetComments(block.replace(/【ToolCall引导】\s*/g, '').trim());
            /* 与 LLM 页签相同：纯英文控制/破限块不发给模型，避免 Google 输入审核拦截。 */
            if (cleaned && /[\u4e00-\u9fff]/.test(cleaned)) guides.push({ role, content: cleaned });
        }
        const rest = stripPresetComments(text.replace(/【ToolCall引导】[\s\S]*?(?=(?:【ToolCall引导】|$))/gi, '').trim());
        if (rest) context.push({ role, content: rest });
    }
    const outMessages = guides.concat(context);
    while (outMessages.length && outMessages[outMessages.length - 1].role === 'assistant') outMessages.pop();
    if (!outMessages.length || outMessages[outMessages.length - 1].role !== 'user') {
        outMessages.push({ role: 'user', content: '请调用 ' + toolName + ' 输出结果。' });
    }
    const schema = {
        type: 'function',
        function: {
            name: toolName,
            description: toolDesc || '请使用这个工具输出最终档案结果。',
            parameters: {
                type: 'object',
                properties: { display_stream: { type: 'string', description: fieldDesc || '把最终档案 JSON 整段写入这里。' } },
                required: ['display_stream']
            }
        }
    };
    return { handled: true, messages: outMessages, toolName, tools: [schema], toolChoice: 'auto', fields: [{ name: 'display_stream', wrapTag: '' }] };
}

/* 请求体里加上工具和末尾消息；预设内嵌 ToolCall 引导优先，
   否则按档案库「工具与末尾消息」卡片的开关处理。 */
function applyBreakthrough(body, messages) {
    /* 优先调用智绘姬 LLM 页签已经在同一 bundle 中使用的实现。
       这样上下文预设与 LLM 页签完全共用格式；取不到时才走本地兼容逻辑。 */
    try {
        const shared = globalThis.__stChatu8TransformToolCallRequest;
        if (typeof shared === 'function') {
            const req = Object.assign({}, body || {}, { messages: Array.isArray(messages) ? messages : [] });
            const got = shared(req, {});
            if (got && got.isToolCallEnabled && got.transformedBody) {
                const transformed = got.transformedBody;
                return {
                    messages: transformed.messages || req.messages,
                    tools: transformed.tools,
                    toolChoice: transformed.tool_choice,
                    toolName: got.toolName,
                    toolFields: got.toolFields
                };
            }
        }
    } catch (e) { /* 共享链不可用时走下面的兼容实现 */ }
    const out = { messages: Array.isArray(messages) ? messages : [] };
    const presetGuide = extractPresetToolCallGuide(out.messages);
    if (presetGuide.handled) {
        out.messages = presetGuide.messages;
        out.tools = presetGuide.tools;
        out.toolChoice = presetGuide.toolChoice;
        out.toolName = presetGuide.toolName;
        out.toolFields = presetGuide.fields;
        return out;
    }
    const tc = chatu8ToolConfig();
    const wantTool = toolEnabled();
    const wantTail = tailEnabled();
    const name = (wantTool || wantTail) ? makeToolName() : 'emit_payload';
    out.messages = out.messages.map((m) => {
        if (!m || typeof m.content !== 'string' || m.content.indexOf('TOOL_NAME%') < 0) return m;
        return Object.assign({}, m, { content: m.content.replace(/%TOOL_NAME%/g, name).replace(/TOOL_NAME%/g, name) });
    });
    if (wantTool || wantTail) {
        out.toolName = name;
        if (wantTool) {
            out.tools = [buildToolSchema(name, tc)];
            out.toolChoice = 'auto';
        }
        if (wantTail) out.messages = injectTail(out.messages, name);
    }
    return out;
}

/* 测试工具里展示「真正发出去的东西」：messages + tool 定义 */
function previewPayload(prompt) {
    const plan = applyBreakthrough({}, normalizeMessages(prompt));
    const lines = [];
    lines.push('===== messages（共 ' + plan.messages.length + ' 条）=====');
    plan.messages.forEach((m, i) => {
        lines.push('');
        lines.push('--- [' + (i + 1) + '] role=' + m.role + ' ---');
        lines.push(m.content);
    });
    if (plan.tools) {
        lines.push('');
        lines.push('===== tools（1 个，tool_choice=' + plan.toolChoice + '）=====');
        lines.push(JSON.stringify(plan.tools[0], null, 2));
    } else {
        lines.push('');
        lines.push('===== tools：未启用（「Tool 与末尾消息」卡片里没开自定义 Tool）=====');
    }
    return lines.join('\n');
}

/* ------------------------------ 正则 & 测试工具 ------------------------------ */
function renderRegexInfo() {
    const box = document.querySelector('#dna-tab [data-dna="regexInfo"]');
    if (!box) return;
    const name = regexProfileName();
    const n = regexEntriesCount();
    const rows = [
        ['正则配置', name || '（智绘姬里没选）'],
        ['启用的条目', n + ' 条'],
        ['正文是否过正则', S.useRegex ? '是' : '否（已关闭）'],
        ['收哪些楼层', '只收 AI 输出的楼层，玩家输入不进来']
    ];
    box.innerHTML = rows.map((r) =>
        '<div class="dna-kv-row"><span class="dna-kv-k">' + esc(r[0]) + '</span>' +
        '<span class="dna-kv-v">' + esc(String(r[1])) + '</span></div>'
    ).join('');
}

/* 这两项读的是智绘姬 LLM 页签那两份配置 */

/* ------------------------------ 手机 / 电脑界面自适应 ------------------------------ */
/* 自动检测优先用酒馆自己的 isMobile()，拿不到就退回屏宽判断。
   检测出来的结果只影响外观（给 #dna-tab 挂 dna-mobile / dna-desktop），不动任何功能。 */

const UI_MODES = { auto: '自动检测', desktop: '电脑版', mobile: '手机版' };

/* 酒馆自己的 isMobile() 是认 UA 的（手机/平板），最准，优先用它 */
function stIsMobile() {
    try {
        const ctx = getContext();
        if (ctx && typeof ctx.isMobile === 'function') return !!ctx.isMobile();
    } catch (e) { /* 拿不到就自己认 UA */ }
    try {
        return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(String(navigator.userAgent || ''));
    } catch (e) { return false; }
}

/* 面板实际能用的宽度：窄到这个程度就按手机排版，免得挤成一团 */
function panelNarrow() {
    try {
        const tab = document.querySelector('#dna-tab');
        const w = (tab && tab.getBoundingClientRect().width) || window.innerWidth || 0;
        return w > 0 && w < 560;
    } catch (e) { return false; }
}

function useMobileUI() {
    if (S.uiMode === 'mobile') return true;
    if (S.uiMode === 'desktop') return false;
    return stIsMobile() || panelNarrow();
}

let uiModeTimer = null;
let uiWatched = false;

function applyUiMode() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const mob = useMobileUI();
    tab.classList.toggle('dna-mobile', mob);
    tab.classList.toggle('dna-desktop', !mob);
    const el = tab.querySelector('[data-dna="uiState"]');
    if (el) {
        const why = S.uiMode === 'auto' ? (stIsMobile() ? '认出来是手机' : (panelNarrow() ? '面板太窄' : '认出来是电脑')) : '手动锁定';
        el.textContent = '界面：' + (UI_MODES[S.uiMode] || '自动检测') +
            ' · 当前' + (mob ? '手机版' : '电脑版') + '（' + why + '）';
    }
}

function watchViewport() {
    if (uiWatched) return;
    uiWatched = true;
    const onResize = () => {
        if (S.uiMode !== 'auto') return;
        clearTimeout(uiModeTimer);
        uiModeTimer = setTimeout(applyUiMode, 150);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
}

/* 发送数据 */
/* 智绘姬跑 LLM（正文出 Tag、Tag 修改…）之前，把正文里出场角色的 DNA 档案
   一起塞进它的 messages。用 makeFirst 把自己的监听器排到智绘姬前面，
   这样我们改的是它即将发出去的那份 prompt。 */

const SEND_EVENTS = {
    image_gen: 'ch-llm-image-gen-request',
    tag_modify: 'ch-llm-tag-modify-request',
    char_display: 'ch-llm-char-display-request',
    char_modify: 'ch-llm-char-modify-request',
    visual_mat_prep: 'ch-llm-visual-mat-prep-request'
};
const SEND_LABELS = {
    image_gen: '正文出 Tag',
    tag_modify: 'Tag 修改',
    char_display: '角色展示',
    char_modify: '角色修改',
    visual_mat_prep: '视材准备'
};

/* 一次请求里已经塞过就不再塞（重试 / 同一条 prompt 被重复 emit） */
const sendStamp = new WeakSet();

function promptTextOf(prompt) {
    if (!Array.isArray(prompt)) return '';
    const out = [];
    for (const m of prompt) {
        if (!m) continue;
        if (typeof m.content === 'string') out.push(m.content);
        else if (Array.isArray(m.content)) {
            for (const p of m.content) if (p && p.type === 'text' && p.text) out.push(p.text);
        }
    }
    return out.join('\n');
}

/* 正文里提到了哪些已记录的角色（按名字命中，长的名字优先，避免「漠」抢了「漠然」） */
/* 粗估 token：汉字与全角标点按 1 字 1 token，英文/数字按 4 字符 1 token（宁可估多不估少） */
function estimateTokens(text) {
    const str = String(text || '');
    let cjk = 0, other = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if ((c >= 0x2e80 && c <= 0x9fff) || (c >= 0xff00 && c <= 0xffef) || (c >= 0x3000 && c <= 0x303f)) cjk++;
        else other++;
    }
    return cjk + Math.ceil(other / 4);
}

/* ------------------------------ 人物形态 ------------------------------ */
/* 同一角色的多个形态在档案库里是「多条档案」，姓名格式由预设规定：
     爱丽丝              ← 没有形态差异的普通角色
     爱丽丝·魔法少女[当前]   ← 当前正在用的形态
     爱丽丝·魔法少女[非当前] ← 别的形态，留着不删
   下面这个函数把这些名字拆成「本名 + 形态名 + 标记」，发送和列表都靠它归组。 */
function formInfo(name) {
    const raw = String(name == null ? '' : name).trim();
    let tag = '';
    let body = raw;
    const m = raw.match(/\[(当前|非当前|永久封印)\]\s*$/);
    if (m) {
        tag = m[1];
        body = raw.slice(0, raw.length - m[0].length).trim();
    }
    let parts = body.split('·');
    let base = (parts[0] || '').trim() || raw;
    let form = parts.slice(1).join('·').trim();
    /* AI 常把形态写成括号：爱丽丝（魔法少女形态）/ 爱丽丝【兽化】/ 爱丽丝(变身)
       这种也要认成形态，否则会当成一个全新角色单独躺一条，两种外形就分不开了。 */
    if (!form) {
        const bm = body.match(/^(.+?)\s*[（(【\[]\s*(.+?)\s*[）)】\]]$/);
        if (bm) {
            const inner = String(bm[2] || '').trim();
            if (inner && /^(当前|非当前|永久封印)$/.test(inner)) {
                /* 括号里写的就是形态标记：A（当前）/ A【非当前】也一样认，不然会被当成另一个角色 */
                tag = inner;
                body = String(bm[1] || '').trim() || body;
                base = body || base;
            } else if (inner) {
                base = String(bm[1] || '').trim() || base;
                form = inner.replace(/形态$/, '').trim();
            }
        }
    }
    return {
        raw,
        base,                       /* 本名：爱丽丝 */
        form,                       /* 形态名：魔法少女（没有形态时为空） */
        tag,                        /* 当前 / 非当前 / 永久封印 / 空 */
        isForm: parts.length > 1 || !!form || !!tag,
        isCurrent: tag === '当前',
        isSealed: tag === '永久封印'
    };
}

/* 把档案名按本名分组：爱丽丝 → 它的全部形态（当前形态排最前） */
function formGroups() {
    const entries = currentEntries();
    const map = new Map();
    for (const name of Object.keys(entries)) {
        const info = formInfo(name);
        if (!map.has(info.base)) map.set(info.base, []);
        map.get(info.base).push({ name, info });
    }
    for (const list of map.values()) {
        list.sort((a, b) => {
            if (a.info.isCurrent !== b.info.isCurrent) return a.info.isCurrent ? -1 : 1;
            if (!!a.info.form !== !!b.info.form) return a.info.form ? 1 : -1;
            return String(a.name).localeCompare(String(b.name), 'zh');
        });
    }
    return map;
}

/* 改姓名末尾的形态标记：爱丽丝·日常[非当前] → 爱丽丝·日常[当前] */
function retagName(name, tag) {
    const body = String(name || '').replace(/\s*\[(当前|非当前|永久封印)\]\s*$/, '').trim();
    return body + (tag ? '[' + tag + ']' : '');
}

/* 把某个形态设为 [当前]：目标打 [当前] 并填本名，同组其它改 [非当前] 并清空本名。
   锁定的档案一律不动（锁就是「AI 别碰这条」）。返回改动列表。 */
function setCurrentForm(base, targetName) {
    const entries = currentEntries();
    const list = formGroups().get(base) || [];
    if (!list.some((x) => x.name === targetName)) return [];
    /* 目标这条锁着 → 整个切换都不做。只改别人的话，会变成「一个 [当前] 都没有」。 */
    if (!entries[targetName] || entries[targetName]._locked) return [];
    const changed = [];
    for (const x of list) {
        const rec = entries[x.name];
        if (!rec) continue;
        if (rec._locked) continue;
        const isTarget = (x.name === targetName);
        if (!isTarget && x.info.isSealed) continue;   /* 永久封印保持原样 */
        const tag = isTarget ? '当前' : '非当前';
        const nn = retagName(x.name, tag);
        if (nn !== x.name) {
            delete entries[x.name];
            moveFieldLocks(x.name, nn);
            if (entries[nn]) {
                /* 目标名上已经有一条（AI 刚写的新版）→ 旧这条退场，别覆盖新版 */
                entries[nn]['本名'] = isTarget ? base : '';
            } else {
                entries[nn] = rec;
                rec['本名'] = isTarget ? base : '';
            }
        } else {
            rec['本名'] = isTarget ? base : '';
        }
        changed.push({ from: x.name, to: nn, form: x.info.form });
    }
    return changed;
}

/* 正文里点名了某个形态 → 把 [当前] 移过去。
   同时出现多个形态名时，取正文里最后提到的那个（剧情往后走的方向）。 */
function autoSwitchForms(text) {
    const t = String(text || '');
    if (!t) return [];
    const out = [];
    for (const [base, list] of formGroups()) {
        if (list.length < 2) continue;
        if (t.indexOf(base) < 0 && !aliasHit(t, list, currentEntries())) continue;
        const hits = list
            .filter((x) => x.info.form && !x.info.isSealed && t.indexOf(x.info.form) >= 0)
            .sort((a, b) => t.lastIndexOf(b.info.form) - t.lastIndexOf(a.info.form));
        const target = hits[0];
        if (!target || target.info.isCurrent) continue;
        const changed = setCurrentForm(base, target.name);
        if (changed.length) out.push({ base, form: target.info.form, changed });
    }
    return out;
}

/* 同一角色只能有一个 [当前]：以 keepName 为准，同组其它 [当前] 自动改 [非当前] 并清空本名 */
function enforceOneCurrent(base, keepName) {
    const entries = currentEntries();
    /* [当前] 形态的本名必须是原名：AI 偶尔漏填，这里补上 */
    const keep = entries[keepName];
    if (keep && !keep._locked && !String(keep['本名'] || '').trim()) keep['本名'] = base;
    const list = formGroups().get(base) || [];
    const others = list.filter((x) => x.info.isCurrent && x.name !== keepName);
    for (const x of others) {
        const rec = entries[x.name];
        if (!rec || rec._locked) continue;
        const nn = retagName(x.name, '非当前');
        delete entries[x.name];
        if (entries[nn]) {
            entries[nn]['本名'] = '';
        } else {
            entries[nn] = rec;
            rec['本名'] = '';
        }
    }
}

/* ------------------------------ 别称 ------------------------------ */
/* 别称一栏是小名 / 外号 / 昵称的集合，多个用「、」隔开。三处用途：
   ① 写档案时只增不减地并进老档案（AI 这轮没提也不能丢）；
   ② 正文里提到别称也算这个角色出场（发送数据、形态切换都用它判定）；
   ③ 发送 DNA 时别称跟着档案一起发出去，让模型知道「明明」就是「王明」。 */
const ALIAS_FIELD = '别称';
const ALIAS_SEP = '、';

/* 关系 / 职业这类"谁都能是"的称呼，不能当别称用。
   别称的用途之一是「正文里提到它就算这个角色出场」，
   所以一个称呼必须唯一指向一个人。「妈妈」被两个角色共用时，
   正文里出现一句「妈妈」，两个人的档案会一起被塞给 AI —— 这就是不严谨的来源。
   下面这些一律不入别称：它们说的是关系或职业，不是这个人的名字。 */
const ALIAS_GENERIC = [
    /* 亲属 */
    '爸爸', '父亲', '爸', '老爸', '妈妈', '母亲', '妈', '老妈',
    '哥哥', '哥', '弟弟', '弟', '姐姐', '姐', '妹妹', '妹',
    '老公', '老婆', '丈夫', '妻子', '儿子', '女儿',
    '爷爷', '奶奶', '外公', '外婆', '祖父', '祖母', '姥姥', '姥爷',
    '叔叔', '阿姨', '舅舅', '姑姑', '伯伯', '婶婶', '舅妈', '姑父', '表哥', '表妹', '堂哥', '堂妹',
    '继父', '继母', '养父', '养母', '义父', '义母', '干爹', '干妈',
    '亲戚', '家人', '家属', '长辈', '晚辈',
    /* 学校 / 职场 */
    '老师', '教师', '教授', '助教', '学生', '同学', '同桌', '校长', '主任', '班长', '组长',
    '老板', '老板娘', '店长', '店员', '掌柜', '经理', '主管', '秘书', '助理', '董事长', '总裁', '社长', '会长', '部长', '队长', '主席', '议员', '干部',
    '同事', '下属', '上司', '客户', '合作伙伴',
    /* 职业 / 身份 */
    '医生', '护士', '警察', '警官', '侦探', '律师', '法官', '军人', '士兵', '保安', '服务员', '收银员', '司机', '厨师', '店员',
    '主人', '仆人', '管家', '女仆', '佣人', '侍从', '执事', '护卫', '保镖',
    '前辈', '后辈', '学长', '学姐', '学弟', '学妹', '师父', '师傅', '徒弟', '弟子',
    '先生', '小姐', '女士', '大人', '殿下', '陛下', '阁下', '少爷', '公主', '王子', '小姐',
    '客人', '顾客', '路人', '陌生人', '居民', '村民', '市民', '邻居', '房东', '租客',
    /* 泛指的某个人 */
    '男子', '女子', '男人', '女人', '少年', '少女', '孩子', '小孩', '老人', '老头', '老太',
    '那个人', '那个男人', '那个女人', '这家伙', '那家伙', '这个人', '这个人',
];
/* 内置那套只是个默认值：用户在「档案库 → 别称禁词」里改过之后，
   就整份用 S.aliasBan 这一份，改完立刻生效（录入、手动编辑、存量清理都查它）。 */
let ALIAS_BAN_CACHE = null;

function aliasBanWords() {
    if (!Array.isArray(S.aliasBan)) {
        S.aliasBan = ALIAS_GENERIC.slice();
        try { saveSettings(true); } catch (e) { /* 存不下就先用着 */ }
    }
    return S.aliasBan;
}

function aliasBanSet() {
    if (!ALIAS_BAN_CACHE) {
        const set = new Set();
        for (const w of aliasBanWords()) {
            const t = String(w == null ? '' : w).replace(/\s+/g, '');
            if (t) set.add(t);
        }
        ALIAS_BAN_CACHE = set;
    }
    return ALIAS_BAN_CACHE;
}

/* 整份写回：去空、去重、去两边空白 */
function aliasBanSave(words) {
    const out = [];
    for (const w of (Array.isArray(words) ? words : [])) {
        const t = String(w == null ? '' : w).trim();
        if (t && out.indexOf(t) < 0) out.push(t);
    }
    S.aliasBan = out;
    ALIAS_BAN_CACHE = null;
    saveSettings(true);
    return out;
}

/* 这个称呼是不是"关系/职业泛称"（是的话不能当别称）
   词表可编辑，下面几条变形规则是固定的 */
function aliasIsGeneric(a) {
    const raw = String(a == null ? '' : a).replace(/\s+/g, '');
    if (!raw) return true;
    const ban = aliasBanSet();
    if (ban.has(raw)) return true;
    /* 「妈妈（来生泪）」「老板【店】」这种带括号注的，把括号去掉再看 */
    const bare = raw.replace(/[（(【\[][^）)】\]]*[）)】\]]/g, '').trim();
    if (bare && bare !== raw && ban.has(bare)) return true;
    /* 「他的妈妈」「来生泪的老板」：带归属的关系称呼 */
    const m = raw.match(/^(.{1,8})的(.+)$/);
    if (m && ban.has(m[2])) return true;
    /* 「店长大人」「老板先生」：泛称 + 敬称 */
    const tail2 = raw.slice(-2);
    if ((tail2 === '大人' || tail2 === '先生' || tail2 === '小姐' || tail2 === '阁下' || tail2 === '殿下')
        && raw.length > 2 && ban.has(raw.slice(0, -2))) return true;
    return false;
}

/* 把一串别称洗一遍：逗号/顿号分开 → 去掉泛称 → 去重拼回 */
function aliasClean(v) {
    const out = [];
    for (const a of aliasSplit(v)) {
        if (!a || aliasIsGeneric(a) || out.indexOf(a) >= 0) continue;
        out.push(a);
    }
    return out.join(ALIAS_SEP);
}

function aliasSplit(v) {
    return String(v == null ? '' : v)
        .split(/[、,，;；\/|｜\n\r\t]+|\s{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);
}

/* 老别称在前、新别称在后，去重后拼回一串 */
function aliasMerge(oldVal, newVal) {
    const out = [];
    /* 老别称也要过一遍：以前已经录进去的「妈妈」「老板」在这里顺手清掉 */
    const push = (a) => { if (a && !aliasIsGeneric(a) && out.indexOf(a) < 0) out.push(a); };
    aliasSplit(oldVal).forEach(push);
    aliasSplit(newVal).forEach(push);
    return out.join(ALIAS_SEP);
}

/* 正文里有没有提到这一组里某个档案的别称（单字别称太容易误伤，跳过） */
/* 同一个别称挂在两个以上角色身上时，它已经无法区分是谁了
   （「妈妈」被两个人占着，正文一出现就会双命中）。
   这种别称留在档案里给人看没问题，但不能再拿来判定"文里提到了谁"。 */
let ALIAS_SHARED = null;
function sharedAliasSet() {
    const entries = currentEntries();
    const seen = new Map();
    for (const n of Object.keys(entries)) {
        const rec = entries[n];
        if (!rec) continue;
        for (const a of aliasSplit(rec[ALIAS_FIELD])) {
            if (a.length < 2) continue;
            seen.set(a, (seen.get(a) || 0) + 1);
        }
    }
    const out = new Set();
    for (const [a, c] of seen) if (c > 1) out.add(a);
    return out;
}

function aliasHit(text, list, entries) {
    const t = String(text || '');
    if (!t || !Array.isArray(list)) return false;
    const shared = ALIAS_SHARED || (ALIAS_SHARED = sharedAliasSet());
    for (const x of list) {
        const rec = (entries || {})[x.name];
        if (!rec) continue;
        for (const a of aliasSplit(rec[ALIAS_FIELD])) {
            if (a.length >= 2 && !shared.has(a) && t.indexOf(a) >= 0) return true;
        }
    }
    return false;
}

/* 老档案里已经录进去的泛称别称（妈妈、老板…）一次性摘掉，
   renderList 时顺手跑，改完自动存盘。 */
function sanitizeAliases() {
    const entries = currentEntries();
    let changed = 0;
    const removed = [];
    for (const n of Object.keys(entries)) {
        const rec = entries[n];
        if (!rec) continue;
        /* 别称这个字段被单独锁住：等于用户明说"这个别动"，清理也跳过 */
        if (fieldLocked(n, ALIAS_FIELD)) continue;
        const before = String(rec[ALIAS_FIELD] || '');
        if (!before.trim()) continue;
        const after = aliasClean(before);
        if (after === before) continue;
        for (const a of aliasSplit(before)) {
            if (aliasIsGeneric(a) && removed.indexOf(a) < 0) removed.push(a);
        }
        rec[ALIAS_FIELD] = after;
        rec._updated = rec._updated || Date.now();
        changed++;
    }
    if (changed) {
        saveSettings(true);
        ALIAS_SHARED = null;
        log('别称清掉了 ' + changed + ' 份档案里的关系 / 职业泛称' +
            (removed.length ? ('（' + removed.slice(0, 8).join('、') + (removed.length > 8 ? '…' : '') + '）') : '') +
            '：这类称呼谁都能用，不能当别称');
        toast('已清掉别称里的关系称呼' + (removed.length ? '：' + removed.slice(0, 3).join('、') : ''));
    }
    return changed;
}

/* ------------------------------ 别称禁词（档案库下面那块） ------------------------------ */
function renderAliasBan() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const words = aliasBanWords();
    const cnt = tab.querySelector('[data-dna="banCount"]');
    if (cnt) cnt.textContent = String(words.length);
    const box = tab.querySelector('[data-dna="banChips"]');
    if (!box) return;
    if (!words.length) {
        box.innerHTML = '<span class="dna-empty-inline">（空：别称不再过滤任何词，正文提到谁就算谁）</span>';
        return;
    }
    box.innerHTML = words.map((w) => '<span class="dna-ban-chip">' + esc(w) +
        '<button type="button" class="dna-ban-x" data-ban-del="' + esc(w) + '" title="把这个词从禁词表里删掉">×</button></span>').join('');
}

function onBanAdd() {
    const tab = document.querySelector('#dna-tab');
    const inp = tab ? tab.querySelector('[data-dna="banInput"]') : null;
    const raw = String((inp && inp.value) || '');
    if (!raw.trim()) { toast('先输入要禁的词'); return; }
    const cur = aliasBanWords();
    const add = [];
    for (const w of raw.split(/[、,，;；\/|｜\s]+/)) {
        const t = String(w || '').trim();
        if (t && cur.indexOf(t) < 0 && add.indexOf(t) < 0) add.push(t);
    }
    if (!add.length) { toast('这些词已经在禁词里了'); return; }
    aliasBanSave(cur.concat(add));
    if (inp) inp.value = '';
    renderAliasBan();
    /* 新禁的词如果已经录进别称了，顺手清掉 */
    try { sanitizeAliases(); } catch (e) { /* 忽略 */ }
    renderList();
    log('别称禁词 + ' + add.join('、') + '（现在共 ' + aliasBanWords().length + ' 个）');
    toast('已加入 ' + add.length + ' 个禁词');
}

function onBanDelete(word) {
    const w = String(word == null ? '' : word).trim();
    if (!w) return;
    const cur = aliasBanWords();
    const next = cur.filter((x) => String(x) !== w);
    if (next.length === cur.length) return;
    aliasBanSave(next);
    renderAliasBan();
    log('别称禁词 - ' + w + '（现在共 ' + aliasBanWords().length + ' 个）');
    toast('已从禁词里删掉「' + w + '」');
}

function openAliasBanEditor() {
    const words = aliasBanWords();
    const body =
        '<div class="dna-modal-sec"><i class="fa-solid fa-ban"></i>别称禁词</div>' +
        '<div class="dna-modal-meta">一行一个，也可以用逗号、顿号隔开。这些词不会被录成别称。</div>' +
        '<div class="dna-modal-field">' +
            '<textarea class="st-chatu8-edit-input dna-mono" data-ban-ta rows="14">' + esc(words.join('\n')) + '</textarea>' +
        '</div>' +
        '<div class="st-chatu8-edit-buttons dna-modal-foot">' +
            '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>取消</button>' +
            '<button type="button" class="st-chatu8-edit-button send" data-modal-save>保存</button>' +
        '</div>';
    dnaModalOpen('编辑别称禁词', body);
    dnaModalWire((mask) => {
        const ta = mask.querySelector('[data-ban-ta]');
        const before = words.length;
        const next = aliasBanSave(String((ta && ta.value) || '').split(/[、,，;；\/|｜\n\r\t]+/));
        renderAliasBan();
        try { sanitizeAliases(); } catch (e) { /* 忽略 */ }
        renderList();
        log('别称禁词已改为 ' + next.length + ' 个（原 ' + before + ' 个）');
        toast('禁词表已保存：' + next.length + ' 个词');
    });
}

function onBanExport() {
    const words = aliasBanWords();
    const payload = { type: 'st-chatu8-dna-aliasban', version: 1, count: words.length, words: words.slice() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DNA别称禁词.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    log('已导出别称禁词 ' + words.length + ' 个');
    toast('已导出禁词 ' + words.length + ' 个');
}

function onBanImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const raw = String(reader.result || '');
            const txt = raw.trim();
            let words = [];
            if (txt.charAt(0) === '[' || txt.charAt(0) === '{') {
                const data = JSON.parse(txt);
                if (Array.isArray(data)) words = data;
                else if (data && Array.isArray(data.words)) words = data.words;
                else if (data && Array.isArray(data.ban)) words = data.ban;
                else throw new Error('文件里没有 words 数组');
            } else {
                words = txt.split(/[、,，;；\/|｜\n\r\t]+/);   /* 纯文本也能导：一行一个 */
            }
            const cur = aliasBanWords();
            const add = [];
            for (const w of words) {
                const t = String(w == null ? '' : w).trim();
                if (t && cur.indexOf(t) < 0 && add.indexOf(t) < 0) add.push(t);
            }
            if (!add.length) { toast('导入的词都已经在禁词里了'); return; }
            aliasBanSave(cur.concat(add));
            renderAliasBan();
            try { sanitizeAliases(); } catch (e) { /* 忽略 */ }
            renderList();
            log('导入别称禁词 ' + add.length + ' 个（现在共 ' + aliasBanWords().length + ' 个）');
            toast('已导入 ' + add.length + ' 个禁词');
        } catch (e) {
            log('禁词导入失败：' + (e && e.message ? e.message : e), 'error');
            toast('禁词导入失败：' + (e && e.message ? e.message : e), 'error');
        }
    };
    reader.readAsText(file, 'utf-8');
}

function bindAliasBan(tab) {
    if (!tab) return;
    const one = (sel, ev, fn) => {
        const el = tab.querySelector(sel);
        if (!el || el.dataset.banBound === '1') return;
        el.dataset.banBound = '1';
        el.addEventListener(ev, fn);
    };
    one('[data-dna="banChips"]', 'click', (e) => {
        const x = (e.target && e.target.closest) ? e.target.closest('[data-ban-del]') : null;
        if (!x) return;
        e.preventDefault();
        e.stopPropagation();
        onBanDelete(x.getAttribute('data-ban-del'));
    });
    one('[data-dna="banAdd"]', 'click', () => onBanAdd());
    one('[data-dna="banInput"]', 'keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); onBanAdd(); }
    });
    one('[data-dna="banEdit"]', 'click', () => openAliasBanEditor());
    one('[data-dna="banExport"]', 'click', () => onBanExport());
    one('[data-dna="banImport"]', 'click', () => {
        const f = tab.querySelector('[data-dna="banFile"]');
        if (f) f.click();
    });
    one('[data-dna="banFile"]', 'change', (e) => {
        const f = e.target && e.target.files && e.target.files[0];
        try { onBanImportFile(f); } finally { try { e.target.value = ''; } catch (err) { /* 忽略 */ } }
    });
    renderAliasBan();
}

function pickSendRecords(text) {
    ALIAS_SHARED = null;   /* 别称可能刚被改过，重算一次「哪些别称被多人共用」 */
    const entries = currentEntries();
    const all = false;   /* 发送范围设置已删掉：固定只发正文里被提到的角色（外加勾了「强制发送」的） */
    const t = String(text || '');
    const groups = formGroups();
    const out = [];
    /* 按「本名」分组判断，正文提到本名就算这个角色出场，
       然后只发一个形态：正文点名了某个形态就发那个，否则发 [当前] 那个。
       这样「日常黑发洋装」和「变身后粉发战斗服」不会同时塞给 AI 打架。 */
    for (const [base, list] of groups) {
        /* 勾了强制发送的那几条：不看正文，每次都带上 */
        const forced = list.filter((x) => { const r = entries[x.name]; return !!(r && r._forceSend); });
        if (base.length < 2 && !forced.length) continue;
        const mentioned = all || t.indexOf(base) >= 0 || aliasHit(t, list, entries) || forced.length > 0;
        const formHits = list.filter((x) => x.info.form && !x.info.isSealed && t.indexOf(x.info.form) >= 0);
        if (!mentioned && !formHits.length) continue;
        let pick;
        if (formHits.length) {
            pick = formHits;                                   /* 正文点名了形态 */
        } else {
            const cur = list.find((x) => x.info.isCurrent);     /* 当前形态 */
            if (cur) pick = [cur];
            else {
                const plain = list.find((x) => !x.info.form);   /* 没有形态标记的老档案 */
                pick = plain ? [plain] : list.slice(0, 1);
            }
        }
        /* 强制发送的形态：就算不是 [当前] 形态、正文也没提到，也一起发出去 */
        for (const x of forced) { if (pick.indexOf(x) < 0) pick.push(x); }
        for (const x of pick) {
            const content = buildContent(entries[x.name], true);
            if (content) out.push({ name: x.name, content, form: x.info.form });
        }
    }
    return out;
}

/* 连点正文 → 智绘姬的操作弹窗里点「档案生成」时走到这里：
   只把这一个楼层交给自动记录那套流程（提示词、预设、正则、形态切换全都不变）。
   楼层号拿不到就退回「只记录最近 1 层 AI 回复」。 */
window.__DNA_RECORD_FLOOR__ = function (floor) {
    if (!S.enabled) {
        toast('档案库已停用，先到「设置」里打开', 'error');
        return false;
    }
    const hasFloor = (typeof floor === 'number' && isFinite(floor) && floor >= 0);
    const run = hasFloor ? runScan({ floor: Math.round(floor) }) : runScan({ depth: 1 });
    Promise.resolve(run).catch((e) => {
        log('档案生成失败：' + ((e && e.message) || e), 'error');
    });
    return true;
};

function buildSendBlock(recs) {
    if (!recs.length) return '';
    return '【以下角色已登记 DNA 档案，写这一段时必须严格照此设定，不得改写】\n\n' +
        recs.map((r) => '▍' + r.name + '\n' + r.content).join('\n\n') +
        '\n\n【DNA 档案到此为止】';
}

/* 追加到末尾那条 user 消息里；没有 user 消息就新加一条 */
function appendToPrompt(prompt, block) {
    if (!block) return false;
    for (let i = prompt.length - 1; i >= 0; i--) {
        const m = prompt[i];
        if (!m || m.role !== 'user') continue;
        if (typeof m.content === 'string') m.content = m.content + '\n\n' + block;
        else if (Array.isArray(m.content)) m.content = m.content.concat([{ type: 'text', text: block }]);
        else m.content = block;
        return true;
    }
    prompt.push({ role: 'user', content: block });
    return true;
}

/* ------------------------------ 发送数据用的「最新正文」 ------------------------------ */
/* 发送数据要按「最新一层正文」里提到的角色来挑档案。
   原来拿整条 prompt 文本去匹配（历史楼层、角色卡里出现的名字会一起命中，不该发的也发了）。
   这段正文还要先过智绘姬的正则：collectChatText 内部会串行走它的正则管道，
   但正则管道是异步的、发送钩子是同步的，所以这里预先算好缓存，钩子里同步取。 */
let LAST_BODY = { text: '', floor: -1, at: 0 };
let LAST_BODY_RUN = null;

/* 同步取最新一层 AI 回复的原文与楼层号（钩子里要用，不能 await） */
function latestBodySync() {
    try {
        const ctx = SillyTavern.getContext();
        const chat = ctx && ctx.chat;
        if (!Array.isArray(chat)) return { text: '', floor: -1 };
        for (let i = chat.length - 1; i >= 0; i--) {
            const m = chat[i];
            if (!m || m.is_user || m.is_system) continue;
            const t = String(m.mes || m.message || '').trim();
            if (t) return { text: t, floor: i };
        }
    } catch (e) { /* 拿不到就算了 */ }
    return { text: '', floor: -1 };
}

/* 把最新一层正文过一遍智绘姬正则后缓存起来（异步，AI 出新楼层时调） */
function refreshLastBody() {
    if (LAST_BODY_RUN) return LAST_BODY_RUN;
    LAST_BODY_RUN = (async () => {
        try {
            const bag = await collectChatText(1);
            const text = String((bag && bag.text) || '').trim();
            if (!text) return;
            LAST_BODY = {
                text,
                floor: (bag && typeof bag.to === 'number') ? bag.to : -1,
                at: Date.now()
            };
        } catch (e) {
            /* 正则 / 采集挂了就保持上一份，钩子里会退回原文 */
        } finally {
            LAST_BODY_RUN = null;
        }
    })();
    return LAST_BODY_RUN;
}

/* 发送时真正用来匹配角色名的正文：优先用「同一楼层的正则版」，否则用原文并顺手刷新缓存 */
function sendBodyText() {
    const now = latestBodySync();
    if (now.floor >= 0 && LAST_BODY.floor === now.floor && LAST_BODY.text) return LAST_BODY.text;
    if (now.text) { refreshLastBody(); return now.text; }
    return '';
}

/* ------------------------------ 请求组成（最近一次发送） ------------------------------ */
/* 日志只写「请求合计 44839 token」，看不出这些 token 是哪来的。
   这里把请求按 role 拆开算一遍，DNA 单独一行，贴在日志框下面。 */
let REQ_BREAK = null;

function promptMsgText(m) {
    if (!m) return '';
    if (typeof m.content === 'string') return m.content;
    if (Array.isArray(m.content)) {
        const out = [];
        for (const p of m.content) if (p && p.type === 'text' && p.text) out.push(p.text);
        return out.join('\n');
    }
    return '';
}

/* 按 role 拆 token。必须在追加 DNA 之前调用，DNA 单独算一行。 */
/* 按 role 汇总，同时把每条消息也记下来（逐条明细要用）。
   必须在追加 DNA 之前调用，DNA 单独算。 */
function breakdownPrompt(prompt) {
    let sys = 0, sysN = 0, ass = 0, assN = 0, usr = 0, usrN = 0, oth = 0, othN = 0;
    let lastUser = 0;
    const last = prompt.length - 1;
    const msgs = [];
    prompt.forEach((m, i) => {
        if (!m) return;
        const text = promptMsgText(m);
        const t = estimateTokens(text);
        const role = String(m.role || '?');
        let kind;
        if (text.indexOf('【以下角色已登记 DNA 档案') >= 0) kind = 'DNA 档案';
        else if (/<world_info|\[World Info\]|\[世界书/i.test(text)) kind = '世界书';
        else if (role === 'system' && i === 0) kind = '角色卡 / 主提示';
        else if (role === 'system') kind = '系统提示';
        else if (role === 'assistant') kind = '历史回复';
        else if (role === 'user') kind = (i === last) ? '本层输入' : '历史输入';
        else kind = role;
        msgs.push({
            i,
            role,
            kind,
            tokens: t,
            chars: text.length,
            head: text.replace(/\s+/g, ' ').trim().slice(0, 80),
            /* 正文完整留着：导出 txt 要给全文；界面上展开时再截断显示 */
            full: text
        });
        if (role === 'system') { sys += t; sysN++; }
        else if (role === 'assistant') { ass += t; assN++; }
        else if (role === 'user') {
            usr += t; usrN++;
            if (i === last) lastUser = t;
        } else { oth += t; othN++; }
    });
    const rows = [];
    if (sysN) rows.push({ label: '系统 / 角色设定', note: sysN + ' 条 system', tokens: sys });
    if (assN) rows.push({ label: '历史对话', note: assN + ' 条 assistant', tokens: ass });
    if (usrN > 1) rows.push({ label: '历史输入', note: (usrN - 1) + ' 条 user', tokens: Math.max(0, usr - lastUser) });
    if (lastUser) rows.push({ label: '本层输入', note: '最后一条 user', tokens: lastUser });
    if (othN) rows.push({ label: '其他消息', note: othN + ' 条', tokens: oth });
    return { rows, msgs };
}

function renderReqBreak() {
    const box = document.querySelector('#dna-tab [data-dna="reqBreak"]');
    if (!box) return;
    if (!REQ_BREAK) {
        box.innerHTML = '<div class="dna-hint">还没发过请求。智绘姬跑 LLM（正文出 Tag、Tag 修改…）时，'
            + '这里会列出那次请求的 token 由什么组成。</div>';
        return;
    }
    const total = Math.max(1, REQ_BREAK.total || 1);
    const escp = (v) => esc(String(v == null ? '' : v));
    const bar = (t) => {
        const pct = Math.round((t || 0) / total * 100);
        return '<span class="dna-reqbreak-bar"><i style="width:' + Math.max(2, pct) + '%"></i></span>'
            + '<span class="dna-reqbreak-v">' + (t || 0) + ' · ' + pct + '%</span>';
    };

    /* ---- 汇总 ---- */
    const rows = (REQ_BREAK.items || []).slice();
    if (REQ_BREAK.dna) rows.push({ label: 'DNA 档案', note: REQ_BREAK.dnaCount + ' 份', tokens: REQ_BREAK.dna });
    const sum = rows.reduce((a, x) => a + (x.tokens || 0), 0);
    const diff = sum - (REQ_BREAK.total || 0);
    let html = '<div class="dna-reqbreak-head">最近一次请求（' + escp(REQ_BREAK.kind) + ' · '
        + escp(new Date(REQ_BREAK.at).toLocaleTimeString()) + '）合计 <b>' + (REQ_BREAK.total || 0) + '</b> token'
        + (Math.abs(diff) > Math.max(30, total * 0.02)
            ? ' <i>分项合计 ' + sum + '，差额是消息头等开销</i>' : '')
        + '</div>'
        + rows.map((x) => '<div class="dna-reqbreak-row">'
            + '<span class="dna-reqbreak-l">' + escp(x.label)
            + (x.note ? ' <i>' + escp(x.note) + '</i>' : '') + '</span>'
            + bar(x.tokens) + '</div>').join('');

    /* ---- DNA 逐份（默认展开） ---- */
    const dnaRows = REQ_BREAK.dnaRows || [];
    if (dnaRows.length) {
        html += '<details class="dna-reqbreak-det" open><summary>DNA 明细（' + dnaRows.length + ' 份 · '
            + (REQ_BREAK.dna || 0) + ' token）</summary>'
            + dnaRows.map((x) => '<div class="dna-reqbreak-row">'
                + '<span class="dna-reqbreak-l">' + escp(x.name) + '</span>'
                + bar(x.tokens) + '</div>').join('')
            + '</details>';
    }

    /* ---- 逐条消息（默认收起） ---- */
    const msgs = REQ_BREAK.msgs || [];
    if (msgs.length) {
        html += '<details class="dna-reqbreak-det"><summary>消息明细（' + msgs.length + ' 条）</summary>'
            + msgs.map((x, k) => '<div class="dna-reqbreak-msg">'
                + '<div class="dna-reqbreak-msg-top"><b>#' + x.i + '</b>'
                + '<span class="dna-reqbreak-tag">' + escp(x.kind) + '</span>'
                + '<span class="dna-reqbreak-mt">' + (x.tokens || 0) + ' · '
                + Math.round((x.tokens || 0) / total * 100) + '% · ' + (x.chars || 0) + ' 字</span>'
                + '<button type="button" class="dna-mini dna-reqbreak-exp" data-reqexp="' + k
                + '" title="把这一条的完整内容导出成 txt">导出</button>'
                + '</div>'
                + '<div class="dna-reqbreak-msg-head">' + escp(x.head || '（空）') + '</div>'
                + (x.full
                    ? '<details class="dna-reqbreak-more"><summary>展开全文（' + (x.chars || String(x.full).length) + ' 字）</summary>'
                        + '<div class="dna-reqbreak-msg-full">' + escp(String(x.full))
                        + '</div></details>'
                    : '')
                + '</div>').join('')
            + '</details>';
    }
    box.innerHTML = html;
    /* 导出按钮：每次渲染重挂一次（onclick 赋值不会叠加） */
    box.onclick = (e) => {
        const b = (e.target && e.target.closest) ? e.target.closest('[data-reqexp]') : null;
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        exportReqMsg(parseInt(b.getAttribute('data-reqexp'), 10));
    };
}

/* 把「消息明细」里某一条的完整内容导出成 txt */
function exportReqMsg(k) {
    const m = (REQ_BREAK && REQ_BREAK.msgs || [])[k];
    if (!m) { toast('这条消息已经不在缓存里了（重新发一次请求再看）', 'error'); return; }
    const body = String(m.full == null ? '' : m.full);
    if (!body) { toast('这一条是空的，没内容可导', 'error'); return; }
    const nm = ('消息' + m.i + '_' + (m.kind || m.role || 'msg')).replace(/[\\/:*?"<>|]/g, '_');
    downloadText(nm + '.txt', body);
    log('已导出消息 #' + m.i + '（' + body.length + ' 字）');
    toast('已导出消息 #' + m.i + '（' + body.length + ' 字）');
}

function onSendData(kind, data) {
    try {
        if (!S.enabled || !S.sendEnabled) return;
        if (!data || !Array.isArray(data.prompt) || !data.prompt.length) return;
        if (sendStamp.has(data.prompt)) return;
        const baseText = promptTextOf(data.prompt);
        const baseTokens = estimateTokens(baseText);
        /* 拆解要在追加 DNA 之前做，否则 DNA 会被算进「本层输入」里 */
        const parts = breakdownPrompt(data.prompt);
        /* 只按「最新正文」里出现的档案名挑（正文先过智绘姬正则）；拿不到正文才退回整条 prompt */
        const bodyText = sendBodyText();
        const recs = pickSendRecords(bodyText || baseText);
        if (!recs.length) return;
        const block = buildSendBlock(recs);
        const dnaRows = recs.map((r) => ({
            name: r.name,
            tokens: estimateTokens('▍' + r.name + '\n' + r.content)
        }));
        if (!appendToPrompt(data.prompt, block)) return;
        sendStamp.add(data.prompt);
        const tokens = estimateTokens(block);
        log('发送数据 · ' + (SEND_LABELS[kind] || kind) + '：按' +
            (bodyText ? '最新正文（' + bodyText.length + ' 字，已过智绘姬正则）' : '整条请求') +
            '匹配到 ' + recs.length + ' 份 DNA（' + recs.map((r) => r.name).join('、') + '），'
            + tokens + ' token；请求合计 ' + (baseTokens + tokens) + ' token');
        REQ_BREAK = {
            at: Date.now(),
            kind: SEND_LABELS[kind] || kind,
            total: baseTokens + tokens,
            dna: tokens,
            dnaCount: recs.length,
            items: parts.rows,
            msgs: parts.msgs,
            dnaRows
        };
        renderReqBreak();
    } catch (e) {
        console.warn('[DNA] send data failed', e);
    }
}

const hooked = {};

function installSendHooks() {
    let es = null;
    try { es = SillyTavern.getContext().eventSource; } catch (e) { return; }
    if (!es || typeof es.on !== 'function') return;
    for (const kind in SEND_EVENTS) {
        const ev = SEND_EVENTS[kind];
        if (!hooked[ev]) {
            hooked[ev] = (data) => onSendData(kind, data);
            es.on(ev, hooked[ev]);
        }
        /* 必须排在智绘姬自己的处理函数前面，否则它已经把请求发出去了 */
        if (typeof es.makeFirst === 'function') es.makeFirst(ev, hooked[ev]);
    }
    /* AI 每出一层新正文就预先过一遍智绘姬正则缓存起来，发送时才能同步拿到正则版 */
    for (const evName of ['message_received', 'generation_ended']) {
        if (hooked[evName]) continue;
        hooked[evName] = () => { refreshLastBody(); };
        es.on(evName, hooked[evName]);
    }
    refreshLastBody();
}

/* 取用于测试的原始正文：输入框有就用输入框，否则取最近 N 层 AI 回复 */async function testSourceText() {
    const ta = document.querySelector('#dna-tab [data-dna="testInput"]');
    const typed = ta ? String(ta.value || '').trim() : '';
    if (typed) return { text: typed, from: '输入框' };
    const bag = await collectChatText(clampInt(S.scanDepth, 1, 300, 3));
    return { text: bag.text, from: '最近 ' + bag.count + ' 层 AI 回复' };
}

function setTestField(key, value) {
    const el = document.querySelector('#dna-tab [data-dna="' + key + '"]');
    if (el) el.value = value;
}

function testHint(msg, isErr) {
    const el = document.querySelector('#dna-tab [data-dna="testHint"]');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isErr ? '#e06c75' : '';
}

/* 只组装（不请求）：正则 → 组装真正要发出去的 messages，摊开看清楚，不发请求不花钱 */
async function onTestAssemble() {
    regexBroken = false;
    const btn = document.querySelector('#dna-tab [data-dna="testAssemble"]');
    const old = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '组装中…'; }
    const scene = snapshotChatu8RegexUI();
    try {
        const src = await testSourceText();
        if (!src.text) { testHint('没有可测试的正文', true); return; }
        const cleaned = S.useRegex ? await regexOnly(src.text) : src.text;
        setTestField('testCleaned', cleaned);
        const origins = cardOrigins();
        const olds = pickOldRecords(cleaned, OLD_RECORD_BUDGET);
        const prompt = buildRecordPrompt(cleaned, { origins, olds });
        setTestField('testPrompt', previewPayload(prompt));
        const msgs = normalizeMessages(prompt);
        const usePreset = presetEnabledOf() && presetEntries().length > 0;
        const from = usePreset ? ('预设「' + activePresetName() + '」') : '插件内置 batchPrompt';
        testHint('组装完成：' + msgs.length + ' 条 / ' + promptChars(prompt) + ' 字（没发请求、不花钱）');
        log('只组装：正文 ' + src.text.length + ' → ' + cleaned.length + ' 字 · ' + from
            + ' · ' + msgs.length + ' 条 / ' + promptChars(prompt) + ' 字（没发请求）');
        openPromptPreview('只组装 · 档案库', prompt,
            '正文来源：' + src.from + ' · ' + from + ' · ' + msgs.length + ' 条消息 / '
            + promptChars(prompt) + ' 字（不发请求、不花钱）');
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        testHint('组装失败：' + msg, true);
        log('只组装失败：' + msg, 'error');
    } finally {
        restoreChatu8RegexUI(scene);
        if (btn) { btn.disabled = false; btn.textContent = old; }
    }
}

async function onTestRegex() {
    regexBroken = false;   // 手动测试时重新给一次机会
    const btn = document.querySelector('#dna-tab [data-dna="testRegex"]');
    const old = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '正则处理中…'; }
    setTestField('testPrompt', '');
    setTestField('testResult', '');
    const scene = snapshotChatu8RegexUI();
    try {
        const src = await testSourceText();
        if (!src.text) { testHint('没有可测试的正文', true); return; }
        const cleaned = await regexOnly(src.text);
        setTestField('testCleaned', cleaned);
        testHint('正则处理完成：' + src.from + ' · ' + src.text.length + ' 字 → ' + cleaned.length + ' 字');
        log('正则预览：' + src.text.length + ' 字 → ' + cleaned.length + ' 字');
    } catch (e) {
        testHint('正则处理失败：' + (e && e.message ? e.message : e), true);
        log('正则预览失败：' + (e && e.message ? e.message : e), 'error');
    } finally {
        restoreChatu8RegexUI(scene);
        if (btn) { btn.disabled = false; btn.textContent = old; }
    }
}

async function onTestLLM() {
    if (scanning) { toast('上一轮还在跑，等它跑完'); return; }
    regexBroken = false;
    const btn = document.querySelector('#dna-tab [data-dna="testLLM"]');
    const old = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '请求中…'; }
    setTestField('testResult', '正在请求……');
    const scene = snapshotChatu8RegexUI();
    try {
        const src = await testSourceText();
        if (!src.text) { testHint('没有可测试的正文', true); setTestField('testResult', ''); return; }
        const cleaned = S.useRegex ? await regexOnly(src.text) : src.text;
        setTestField('testCleaned', cleaned);
        const origins = cardOrigins();
        const olds = pickOldRecords(cleaned, OLD_RECORD_BUDGET);
        const prompt = buildRecordPrompt(cleaned, { origins, olds });
        setTestField('testPrompt', previewPayload(prompt));
        const api = resolveApi();
        testHint('正在用 ' + api.source + ' · ' + api.model + ' 请求…');
        liveBegin('lib', '测试请求');
        let reply;
        try {
            reply = await callSafe(prompt, buildRecordPrompt(clipText(cleaned, 400), { origins, olds }),
                undefined, undefined, S.replyMaxTokens, libDeltaCb());
            liveEnd('lib', reply);
        } catch (e) {
            liveEnd('lib', '', (e && e.message) || e);
            throw e;
        }
        setTestField('testResult', reply);
        const nChars = promptChars(prompt);
        testHint('完成：正文 ' + src.text.length + ' → ' + cleaned.length + ' 字，prompt ' + nChars + ' 字，回复 ' + reply.length + ' 字');
        log('测试请求完成：' + api.model + ' · prompt ' + nChars + ' 字 → 回复 ' + reply.length + ' 字');
        logBreakthrough();
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        setTestField('testResult', '失败：' + msg);
        testHint('测试请求失败：' + msg, true);
        log('测试请求失败：' + msg, 'error');
    } finally {
        restoreChatu8RegexUI(scene);
        if (btn) { btn.disabled = false; btn.textContent = old; }
    }
}

/* 日志里说清楚这轮带没带附加配置（tool / 末尾消息） */
function logBreakthrough() {
    const t = toolEnabled();
    const tl = tailEnabled();
    if (!t && !tl) { log('附加配置：都没开（只有预设 / 内置提示词）'); return; }
    const bits = [];
    if (t) {
        const c = chatu8ToolConfig() || {};
        bits.push('自定义 Tool（' + (c.fields || []).length + ' 个字段）');
    }
    if (tl) {
        const c = chatu8TailConfig() || {};
        bits.push('末尾 ' + (c.messages || []).length + ' 条多 Role 消息');
    }
    log('附加配置：已带上 · ' + bits.join(' + '));
}

/* ------------------------------ AI 回复窗口 ------------------------------ */
/* 记录最近一次 AI 的原始返回，供人工核对。只在内存里，刷新页面就没了。 */
const LAST_REPLY = { lib: '', gen: '', ranobe: '' };

/* scope 到实时回复框的映射：lib / gen / ranobe → aiReplyLib / aiReplyGen / aiReplyRanobe */
function replyKey(scope) {
    return (scope === 'gen' || scope === 'ranobe') ? scope : 'lib';
}

function replyField(base, scope) {
    const k = replyKey(scope);
    return base + k.charAt(0).toUpperCase() + k.slice(1);
}

function aiReplyBox(scope) {
    const sel = '#dna-tab [data-dna="' + replyField('aiReply', scope) + '"]';
    const list = document.querySelectorAll(sel);
    if (list && list.length) return list[list.length - 1];
    return document.querySelector(sel);
}

/* 所有同名输入框都写一遍：设置弹窗重建过的话，可能同时存在多份 */
function aiReplyBoxAll(scope) {
    const sel = '#dna-tab [data-dna="' + replyField('aiReply', scope) + '"]';
    const list = document.querySelectorAll(sel);
    if (list && list.length) return Array.prototype.slice.call(list);
    const one = document.querySelector(sel);
    return one ? [one] : [];
}

/* 写内容 + 控制滚动位置。
   atTop=true 时滚回顶部：接收完要让人从第一条档案开始看，
   不能停在 JSON 的尾巴上。 */
function writeAiReply(scope, text, atTop) {
    const val = String(text == null ? '' : text);
    for (const ta of aiReplyBoxAll(scope)) {
        ta.value = val;
        if (atTop) ta.scrollTop = 0;
        else ta.scrollTop = ta.scrollHeight;
    }
}

function setAiReply(scope, text, atTop) {
    const k = replyKey(scope);
    LAST_REPLY[k] = String(text == null ? '' : text);
    writeAiReply(k, LAST_REPLY[k], atTop !== false);
}

/* 状态条：待命 / 请求中 / 接收中 / 完成 / 失败 */
/* 同人资料库和「按世界书生成」两页各放了一个实时框，所以这里取全部同名元素一起写 */
function aiReplyStateEl(scope) {
    return document.querySelectorAll('#dna-tab [data-dna="' + replyField('aiReply', scope) + 'State"]');
}
function aiReplyMetaEl(scope) {
    return document.querySelectorAll('#dna-tab [data-dna="' + replyField('aiReply', scope) + 'Meta"]');
}
function appendAiReplyMeta(scope, extra) {
    if (!extra) return;
    const list = aiReplyMetaEl(scope);
    for (let i = 0; i < list.length; i++) {
        const m = list[i];
        m.textContent = (m.textContent ? m.textContent + ' · ' : '') + extra;
    }
}
function setAiReplyState(scope, state, meta) {
    const list = aiReplyStateEl(scope);
    for (let i = 0; i < list.length; i++) {
        const b = list[i];
        b.textContent = state;
        b.classList.remove('dna-badge-live', 'dna-badge-ok', 'dna-badge-err');
        if (state === '请求中…' || state === '接收中…') b.classList.add('dna-badge-live');
        else if (state === '完成') b.classList.add('dna-badge-ok');
        else if (state === '失败') b.classList.add('dna-badge-err');
    }
    const metas = aiReplyMetaEl(scope);
    for (let i = 0; i < metas.length; i++) metas[i].textContent = meta || '';
}

/* 实时接收：一边收一边往 textarea 里写。
   每 80ms 最多刷一次 DOM，避免每个 token 都重排把页面卡死。 */
const LIVE_TICK = { lib: 0, gen: 0, ranobe: 0, timer: {} };
function pushAiReply(scope, fullText) {
    const k = replyKey(scope);
    LAST_REPLY[k] = String(fullText == null ? '' : fullText);
    const now = Date.now();
    const flush = () => {
        writeAiReply(k, LAST_REPLY[k], false);
        LIVE_TICK[k] = Date.now();
    };
    if (now - LIVE_TICK[k] > 80) { flush(); return; }
    if (!LIVE_TICK.timer[k]) {
        LIVE_TICK.timer[k] = setTimeout(() => { LIVE_TICK.timer[k] = 0; flush(); }, 80);
    }
}

/* ------------------------------ 悬浮字幕 ------------------------------ */
/* 挂在 document.body 上，position:fixed 贴在屏幕最上方。
   不受设置弹窗层级 / 裁剪影响，关掉弹窗也还在（酒馆是全屏 WebView）。 */
let dnaBannerEl = null;
let dnaBannerTimer = 0;
let dnaBannerKind = '';

function dnaBannerElEnsure() {
    if (!document.body) return null;
    try { ensurePresetEntryStyle(); } catch (e) { /* 忽略 */ }
    let el = dnaBannerEl;
    /* 元素被外部清理掉了（面板关闭时有的框架会统一清 DOM），重新造一个 */
    if (!el || !el.parentNode) {
        el = document.querySelector('.dna-banner');
        if (!el || !el.parentNode) {
            el = document.createElement('div');
            el.className = 'dna-banner';
            el.innerHTML = '<i class="fa-solid fa-dna"></i><span class="dna-banner-text"></span>' +
                '<button type="button" class="dna-banner-stop" title="终止建档：点一下马上断开这次请求">' +
                '<i class="fa-solid fa-stop"></i></button>';
        }
        dnaBannerEl = el;
    }
    /* 老的横幅元素（页面里已经存在的那个）没有这个按钮，补一个 */
    if (!el.querySelector('.dna-banner-stop')) {
        try {
            el.insertAdjacentHTML('beforeend',
                '<button type="button" class="dna-banner-stop" title="终止建档：点一下马上断开这次请求">' +
                '<i class="fa-solid fa-stop"></i></button>');
        } catch (e) { /* 忽略 */ }
    }
    /* 终止键：只在「建档中」这条横幅上露出来，点了立刻断请求，
       不用再翻回设置面板里找中止按钮。事件只绑一次。 */
    if (!el.dataset.stopBound) {
        el.dataset.stopBound = '1';
        const stopBtn = el.querySelector('.dna-banner-stop');
        if (stopBtn) {
            stopBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const busy = !!(abortCtl && abortCtl.signal && !abortCtl.signal.aborted);
                doAbort();
                if (busy) {
                    const sp = el.querySelector('.dna-banner-text');
                    if (sp) sp.textContent = '正在终止…';
                    el.classList.remove('dna-banner-run');
                }
            });
        }
    }
    /* 始终挂在 body 最后一个子节点：这样它在 DOM 顺序上压在最上面，
       而且就算之前被挪到某个会被一起删掉的容器里，也会被拽回来。
       关掉智绘姬面板后 body 还在，字幕就还在。 */
    if (el.parentNode !== document.body) {
        try { document.body.appendChild(el); } catch (e) { /* 忽略 */ }
    }
    return el;
}

/* kind: run（建档中）/ ok（成功）/ err（失败） */
function dnaBanner(text, kind, holdMs) {
    const el = dnaBannerElEnsure();
    if (!el) return;
    dnaBannerKind = kind || 'run';
    const span = el.querySelector('.dna-banner-text');
    if (span) span.textContent = String(text || '');
    el.className = 'dna-banner dna-banner-' + dnaBannerKind + ' dna-banner-show';
    if (dnaBannerTimer) { clearTimeout(dnaBannerTimer); dnaBannerTimer = 0; }
    if (holdMs) {
        dnaBannerTimer = setTimeout(() => {
            dnaBannerTimer = 0;
            if (dnaBannerEl) dnaBannerEl.classList.remove('dna-banner-show');
            dnaBannerKind = '';
        }, holdMs);
    }
}

function dnaBannerHide() {
    if (dnaBannerTimer) { clearTimeout(dnaBannerTimer); dnaBannerTimer = 0; }
    if (dnaBannerEl) dnaBannerEl.classList.remove('dna-banner-show');
    dnaBannerKind = '';
}

/* 一次请求的实时状态机：开始时起表，流式回调推进，结束时收尾 */
const LIVE_RUN = { lib: null, gen: null, ranobe: null };
/* 档案库的流式开关：关掉就不传 onDelta（走非流式，等整段回来再显示）。
   只作用在档案库这两处调用上，手动生成 / 同人库照旧流式。 */
function libStreamOn() {
    return S.libStream !== false;
}

function libDeltaCb() {
    return libStreamOn() ? (full) => liveDelta('lib', full) : null;
}

/* Tool Call 模式占位提示：三个页签（档案库 / 手动生成 / 同人库）各自的「AI 回复（实时）」框。
   只有本次请求真的挂了 tools 才写，普通请求一个字都不多出来。
   注意 scope 不能判假：自动记录那一页传进来的是 undefined，replyKey 会归一成 lib。 */
const TOOL_WAIT_TEXT = '正在处理 DNA档案 请求 [Tool Call 模式]，请稍候...';
function markToolWait(scope) {
    try {
        setAiReply(scope, TOOL_WAIT_TEXT);
        setAiReplyState(scope, '发送中…', 'Tool Call 模式：等模型把整段参数生成完');
    } catch (e) { /* 面板还没建好就不提示，不影响请求本身 */ }
}

function liveBegin(scope, what) {
    const k = replyKey(scope);
    LIVE_RUN[k] = { t0: Date.now(), what: what || '', chars: 0 };
    setAiReply(scope, '');
    setAiReplyState(scope, '请求中…', (what ? what + ' · ' : '') + '等待 AI 响应…');
}
function liveDelta(scope, full) {
    const k = replyKey(scope);
    const r = LIVE_RUN[k];
    if (!r) return;
    r.chars = String(full || '').length;
    pushAiReply(scope, full);
    const sec = ((Date.now() - r.t0) / 1000).toFixed(1);
    setAiReplyState(scope, '接收中…', (r.what ? r.what + ' · ' : '') + r.chars + ' 字 · ' + sec + 's');
}
function liveEnd(scope, text, err) {
    const k = replyKey(scope);
    const r = LIVE_RUN[k];
    const sec = r ? ((Date.now() - r.t0) / 1000).toFixed(1) : '?';
    const what = r ? (r.what ? r.what + ' · ' : '') : '';
    LIVE_RUN[k] = null;
    if (LIVE_TICK.timer[k]) { clearTimeout(LIVE_TICK.timer[k]); LIVE_TICK.timer[k] = 0; }
    if (err) {
        /* 失败也别把已经收到的内容清掉：中途断了还能看到 AI 写了什么 */
        if (LAST_REPLY[k]) writeAiReply(k, LAST_REPLY[k], true);
        setAiReplyState(scope, '失败', what + String(err).slice(0, 80)
            + (LAST_REPLY[k] ? ' · 已收到 ' + LAST_REPLY[k].length + ' 字' : ''));
        return;
    }
    /* 接收完滚回顶部：从第一条档案开始看，而不是停在 JSON 尾巴 */
    setAiReply(scope, text, true);
    setAiReplyState(scope, '完成', what + String(text || '').length + ' 字 · 用时 ' + sec + 's');
}

function clearAiReply(scope) {
    const k = replyKey(scope);
    LIVE_RUN[k] = null;
    if (LIVE_TICK.timer[k]) { clearTimeout(LIVE_TICK.timer[k]); LIVE_TICK.timer[k] = 0; }
    setAiReply(scope, '');
    setAiReplyState(scope, '待命', '');
}

async function copyAiReply(scope) {
    const txt = LAST_REPLY[replyKey(scope)];
    if (!txt) { toast('还没有内容'); return; }
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(txt);
        } else {
            const ta = aiReplyBox(scope);
            if (ta) { ta.removeAttribute('readonly'); ta.select(); document.execCommand('copy'); ta.setAttribute('readonly', 'readonly'); }
        }
        toast('已复制 ' + txt.length + ' 字');
    } catch (e) {
        toast('复制失败，手动选中吧', 'error');
    }
}

/* ------------------------------ 扫描主流程 ------------------------------ */
function setBusy(busy, label) {
    scanning = busy;
    const btn = document.querySelector('#dna-tab [data-dna="scanNow"]');
    if (btn) btn.disabled = busy;
    /* 按钮里有图标，只能换文字节点，不能整个 textContent 覆盖 */
    const lb = document.querySelector('#dna-tab [data-dna="scanLabel"]');
    if (lb) lb.textContent = busy ? (label || '记录中…') : '立即记录';
    const dot = document.querySelector('#dna-tab [data-dna="status"]');
    if (dot) dot.textContent = busy ? '运行中' : '空闲';
    const d = document.querySelector('#dna-tab .dna-dot');
    if (d) {
        d.classList.toggle('dna-dot-busy', !!busy);
        d.classList.toggle('dna-dot-on', !busy && !!S.enabled);
    }
    if (!busy) syncAbortBtns();
}

async function runScan(opts) {
    opts = opts || {};
    if (scanning) { log('上一轮还在跑，跳过本次'); return; }
    if (!S.enabled) { log('插件已停用，跳过'); return; }

    const depth = clampInt(opts.depth || S.scanDepth, 1, 300, 3);
    /* floor：只记录指定的那一层（连点正文 → 「档案生成」用），不传就还是扫最近 N 层 */
    const onlyFloor = Number.isInteger(opts.floor) ? opts.floor : null;
    let scanSucceeded = false;
    setBusy(true);
    dnaBanner('DNA建档中', 'run');

    try {
        const bag = await collectChatText(depth, onlyFloor);
        if (!bag.count) {
            log(onlyFloor != null
                ? ('第 ' + onlyFloor + ' 层没有可用的 AI 正文（这一层可能是玩家输入或空的），换个楼层再试')
                : ('最近 ' + depth + ' 层里没有 AI 输出的正文可扫'));
            return;
        }
        if (onlyFloor != null) log('只记录第 ' + bag.from + ' 层（' + bag.text.length + ' 字）');
        else log('扫描第 ' + bag.from + '-' + bag.to + ' 层，取到 ' + bag.count + ' 层 AI 回复 / ' + bag.text.length + ' 字');
        if (bag.skipped) log('跳过 ' + bag.skipped + ' 层玩家输入（只收 AI 楼层）');
        if (S.useRegex) {
            log('已过智绘姬正则「' + (regexProfileName() || '未选') + '」：' + bag.before + ' 字 → ' + bag.after + ' 字');
        } else {
            log('正则处理已关闭，直接发原文');
        }
        log('档案库：' + cardLabel());

        const origins = cardOrigins();
        if (origins.length) log('带上角色卡设定作为人物底子（' + origins[0].content.length + ' 字）');

        /* 关掉「AI自动更新档案库」时不用带旧档案——反正也不会更新，白发几万字 */
        const olds = S.updateExisting ? pickOldRecords(bag.text, OLD_RECORD_BUDGET) : [];
        if (olds.length) {
            const full = olds.filter((o) => !o.dropped && !o.name.includes('其它形态'));
            const dropOne = olds.find((o) => o.dropped);
            log('已记录过 ' + full.length + ' 个出场角色，会一起提交做增量更新'
                + (dropOne ? ('；另有 ' + dropOne.dropped.length + ' 个档案太长没装下（已要求 AI 不要编造）') : ''));
        } else if (!S.updateExisting) {
            log('「AI自动更新档案库」是关的，这次不带旧档案');
        }

        const usePreset = S.presetEnabled && presetEntries().length > 0;
        log('提示词：' + (usePreset ? '上下文预设「' + activePresetName() + '」' : '插件内置 batchPrompt'));
        log('提交 AI（本轮只调用一次）……');
        const api = resolveApi();
        log('使用 ' + api.source + ' · ' + api.model);
        logBreakthrough();
        const prompt = buildRecordPrompt(bag.text, { origins, olds });
        log('提示词共 ' + promptChars(prompt) + ' 字 / 约 ' + estimateTokens(promptTextOf(prompt)) + ' token / '
            + normalizeMessages(prompt).length + ' 条');
        /* 重试由「自动重试次数」统一管：第 1 次用精简正文，第 2 次换成内置提示词 */
        liveBegin('lib', '自动记录');
        let raw;
        try {
            raw = await callSafe(
                prompt,
                buildRecordPrompt(clipText(bag.text, 400), { origins, olds }),
                undefined,
                usePreset ? batchPrompt(bag.text, { origins, olds }) : undefined,
                S.replyMaxTokens,
                libDeltaCb()
            );
            liveEnd('lib', raw);
        } catch (e) {
            liveEnd('lib', '', (e && e.message) || e);
            throw e;
        }
        const list = parseProfileList(raw);
        if (!list) {
            appendAiReplyMeta('lib', '解析失败，看原文');
            log('AI 返回无法解析：' + String(raw || '').slice(0, 300), 'error');
            log('原始返回已留在「AI 回复（实时）」窗口里', 'error');
            return;
        }
        appendAiReplyMeta('lib', list.length + ' 份档案');
        log('AI 返回 ' + list.length + ' 份档案');

        let created = 0, updated = 0, skipped = 0, locked = 0, failed = 0;
        const done = Object.create(null);
        const floorTag = (onlyFloor != null) ? String(bag.from) : (bag.from + '-' + bag.to);
        for (const item of list) {
            const prof = normalizeProfile(item, item && item['姓名']);
            if (!prof || !String(prof['姓名'] || '').trim()) { failed++; continue; }
            const nm = String(prof['姓名']).trim();
            if (done[nm]) continue;
            done[nm] = 1;
            try {
                const res = saveProfile(prof, floorTag);
                if (res.split) log('「' + nm + '」一条里写了多种形态，自动拆成 ' + res.results.length + ' 条档案');
                for (const one of res.results) {
                    if (one.r === 'created') { created++; log('新建「' + one.name + '」'); }
                    else if (one.r === 'updated') { updated++; log('更新「' + one.name + '」'); }
                    else if (one.r === 'locked') { locked++; log('「' + one.name + '」已锁定，AI 不改它'); }
                    else { skipped++; log('「' + one.name + '」已存在，按设置跳过'); }
                }
            } catch (e) {
                failed++;
                log('「' + nm + '」保存失败：' + (e && e.message ? e.message : e), 'error');
            }
        }
        if (created || updated) saveSettings(true);
        scanSucceeded = true;

        /* 形态自动切换：正文里点名了哪个形态，就把 [当前] 移过去 */
        try {
            const sw = autoSwitchForms(bag.text);
            if (sw.length) {
                saveSettings(true);
                log('形态自动切换：' + sw.map((x) => x.base + ' → ' + x.form + '（[当前] 已移过去）').join('；'));
                if (selected && !currentEntries()[selected]) selected = null;
            }
        } catch (e) { /* 切换失败不影响本轮记录 */ }
        /* 形态统计：让用户知道哪些角色有多形态档案，便于核对 [当前] 标记 */
        const fg = formGroups();
        const multi = [...fg.entries()].filter(([, list]) => list.some((x) => x.info.form));
        if (multi.length) {
            log('多形态角色 ' + multi.length + ' 个：' + multi.map(([b, list]) =>
                b + '（' + list.map((x) => (x.info.form || '本体') + (x.info.isCurrent ? '·当前' : '')).join(' / ') + '）'
            ).join('；'));
        }
        log('本轮结束：新建 ' + created + '，更新 ' + updated + '，跳过 ' + skipped
            + (locked ? ('，锁定跳过 ' + locked) : '') + '，失败 ' + failed);
        if ((created || updated) && S.notify) {
            toast('DNA 已记录：新建 ' + created + '，更新 ' + updated + (locked ? ('，锁定跳过 ' + locked) : ''));
        }
        renderList();
        dnaBanner('建档成功', 'ok', 2600);
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        if (/已手动中断/.test(msg)) {
            log('本轮已手动中断，没写任何档案');
            if (!opts.auto) toast('已中断这一轮');
            dnaBanner('已中断', 'err', 2400);
        } else {
            log('扫描中断：' + msg, 'error');
            if (!opts.auto) toast('扫描失败：' + msg, 'error');
            dnaBanner('建档失败', 'err', 3600);
        }
    } finally {
        setBusy(false);
        syncAbortBtns();
        if (opts.auto && !scanSucceeded) lastAutoFloor = Math.max(0, lastAutoFloor - Math.max(1, S.autoEvery));
        /* 早退（没正文 / 上一轮还在跑）时没走成功也没走失败，把字幕收掉 */
        if (dnaBannerKind === 'run') dnaBannerHide();
    }
}

/* ------------------------------ 面板 UI ------------------------------ */
/* ------------------------------ 同人资料库 / 按世界书：界面与操作 ------------------------------ */
/* 两页共用一套逻辑，tag 只是外壳：'ranobe' = 内置同人库，'wblib' = 当前角色卡世界书。
   内置本体是静态文件（只进内存），用户改动（改名/新增/删除/勾选/额外要求）才进 settings。 */
const LIB_LABEL = { ranobe: '同人库', ranobewb: '世界书生成' };
const LIB_CACHE = { ranobe: [], wb: [] };   // 合并后的完整列表（渲染与生成共用）
const LIB_RENDER_MAX = 60;                  // 一次最多渲染多少行（1000+ 条全渲染手机会卡）

function libScopeOf(tag) {
    return (tag === 'wblib' || tag === 'ranobewb') ? 'wb' : 'ranobe';
}

function libEl(tag, base) {
    return document.querySelector('#dna-tab [data-dna="' + tag + base + '"]');
}

function libSetText(tag, base, text) {
    const el = libEl(tag, base);
    if (el) el.textContent = text;
}

function libSetVal(tag, base, v) {
    const el = libEl(tag, base);
    if (el) el.value = v;
}

function libGetVal(tag, base) {
    const el = libEl(tag, base);
    return el ? String(el.value == null ? '' : el.value) : '';
}

/* 搜索：名字 / 全名 / 作品 / 标签 / 生图前缀 / 别名 里任意一处命中即算。
   scope 必须由调用方传进来：这里拿不到 tag，以前写了 libScopeOf(tag) 直接抛
   ReferenceError，被 renderLib 外面的 .catch 吞掉 —— 表现就是「搜索框打字没反应」。 */
function libHit(e, q, scope) {
    if (!q) return true;
    /* 分类的显示名也算进去：搜「闪乱」能搜到这个分类下的所有条目 */
    const bag = [e.n, e.c, e.w, ipLabel(e.w, scope === 'wb' ? 'wb' : 'ranobe'), e.t, e.p, e.d, (e.a || []).join(' '), String(e.x || '').slice(0, 160)];
    return bag.some((v) => String(v == null ? '' : v).toLowerCase().indexOf(q) >= 0);
}

/* 列表翻页条：上一页 / 页码窗口 / 下一页。点一下由列表上的事件委托接住 */
function libPagerHtml(page, pages, total) {
    const mk = (p, label, on, dis) => '<button type="button" class="dna-page-btn'
        + (on ? ' is-on' : '') + '" data-libpage="' + p + '"' + (dis ? ' disabled' : '') + '>' + label + '</button>';
    const parts = [mk(page - 1, '‹', false, page <= 1)];
    let from = Math.max(1, page - 2), to = Math.min(pages, from + 4);
    from = Math.max(1, Math.min(from, to - 4));
    if (from > 1) parts.push(mk(1, '1', page === 1, false), '<span class="dna-page-gap">…</span>');
    for (let p = from; p <= to; p++) parts.push(mk(p, String(p), p === page, false));
    if (to < pages) parts.push('<span class="dna-page-gap">…</span>', mk(pages, String(pages), page === pages, false));
    parts.push(mk(page + 1, '›', false, page >= pages));
    return '<div class="dna-pager">' + parts.join('')
        + '<span class="dna-page-info">第 ' + page + ' / ' + pages + ' 页 · 共 ' + total + ' 条</span></div>';
}

/* 分类下拉的翻页条：页码按钮式（‹ 1 2 3 … N ›）+ 一行信息。
   它靠 dna-ippager 的 width:100% + 上边虚线独占一行，不和上面的下拉、分类操作按钮挤在一起。
   data-ippage 和条目的 data-libpage 分开，两个翻页条才不会互相抢点击。 */
function ipPagerHtml(page, pages, total) {
    const mk = (p, label, on, dis) => '<button type="button" class="dna-page-btn'
        + (on ? ' is-on' : '') + '" data-ippage="' + p + '"' + (dis ? ' disabled' : '') + '>' + label + '</button>';
    const parts = [mk(page - 1, '‹', false, page <= 1)];
    let from = Math.max(1, page - 2), to = Math.min(pages, from + 4);
    if (to - from < 4) from = Math.max(1, to - 4);
    for (let p = from; p <= to; p++) parts.push(mk(p, String(p), p === page, false));
    if (to < pages) parts.push('<span class="dna-page-gap">…</span>', mk(pages, String(pages), page === pages, false));
    parts.push(mk(page + 1, '›', false, page >= pages));
    return '<div class="dna-pager dna-ippager">' + parts.join('')
        + '<span class="dna-page-info">分类第 ' + page + ' / ' + pages + ' 页 · 共 ' + total + ' 个</span></div>';
}

/* 每次渲染发一个号：期间又被触发的话，先算完的那次结果直接丢掉（免得旧结果盖新结果） */
const LIB_RENDER_SEQ = { ranobe: 0, wb: 0 };

async function renderLib(tag) {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    try { ensureIpPagerStyle(); } catch (e) { /* 忽略 */ }
    const scope = libScopeOf(tag);
    const seq = (LIB_RENDER_SEQ[scope] = (LIB_RENDER_SEQ[scope] || 0) + 1);
    fillBuiltinSrcSelect(tag).catch(() => { /* 忽略 */ });
    const st = libState(scope);
    const listBox = libEl(tag, 'List');
    const pagerBox = libEl(tag, 'Pager');   /* 翻页条放在滚动列表外面，不用滚到底才看得到 */
    if (listBox && !LIB_CACHE[scope].length) listBox.innerHTML = '<div class="dna-empty">读取中…</div>';
    const all = await libAll(scope);
    if (seq !== LIB_RENDER_SEQ[scope]) return;   /* 期间又触发过一次渲染，这次作废 */
    LIB_CACHE[scope] = all;
    const q = String(st.q || '').trim().toLowerCase();
    let hit = q ? all.filter((e) => libHit(e, q, scope)) : all;
    /* 按作品（IP）收窄；下拉本身也从这份库算出来 */
    const ipSel = libEl(tag, 'Ip');
    /* 下拉跟着搜索词走：输「龙珠」下拉里就只剩龙珠，并且自动切过去；
       输人名（下拉里没有同名分类）就退到「含这个人的分类」并切过去 */
    const keepIp = String(st.ip || '');
    const hitW = q ? new Set(hit.map((e) => String(e && e.w == null ? '' : e.w).trim())) : null;
    const curIp = ipSel ? fillIpSelect(ipSel, all, keepIp, q, hitW, libScopeOf(tag), tag) : '';
    /* 搜到分类就切过去；没搜（或搜的是人名、对不上任何分类）就别动用户原来选的分类 */
    if (ipSel) {
        if (!q) { if (keepIp !== curIp) { st.ip = curIp; st.ipPage = 1; } }
        else if (curIp) st.ip = curIp;
    }
    /* 对上分类就只看这个分类；对不上（搜的是人名）才跨分类找 */
    if (ipSel && curIp) hit = hit.filter((e) => String(e && e.w == null ? '' : (e && e.w)).trim() === curIp);
    const sel = new Set(st.sel || []);
    /* 没搜索时这里显示的是当前分类有多少条，不是整库 */
    libSetText(tag, 'Count', q ? (hit.length + ' / ' + all.length) : String(hit.length));
    const picked = all.filter((e) => sel.has(e.k)).length;
    const mine = (st.added || []).length;
    libSetText(tag, 'Meta', '共 ' + all.length + ' 条 · 已勾选 ' + picked + (mine ? (' · 自己新增 ' + mine) : ''));
    if (scope === 'wb') {
        libSetText(tag, 'Source', '数据源：' + (WB_LIB_BOOK || '还没读到世界书'));
    }
    /* 世界书那两块共用同一份搜索词，渲染时把输入框同步过来 */
    const qEl = libEl(tag, 'Search');
    if (qEl && document.activeElement !== qEl) qEl.value = String(st.q || '');
    if (!listBox) return;
    if (!hit.length) {
        listBox.innerHTML = '<div class="dna-empty">'
            + ((scope === 'ranobe' && !RANOBE_BUILTIN)
                ? '内置库还没载入：点「分类操作 → 重载内置库」，会从插件自带的分类条目包里解压恢复（第一次要等十几秒）。'
                : (st.wiped && !q
                    ? ('整个库已经被清空了：点「分类操作 → ' + (scope === 'wb' ? '恢复内置' : '重载内置库') + '」可以全部找回来。')
                    : (q ? '没有匹配的条目。'
                        : (curIp ? '这个分类还没有条目，用上面的「加条目」往里放。' : '这里还没有条目。'))))
            + '</div>';
        if (pagerBox) pagerBox.innerHTML = '';
        return;
    }
    /* 勾上的排最上面（同人资料库条目、世界书生成条目共用这一段） */
    const sorted = onFirst(hit, (e) => sel.has(e.k));
    /* 翻页：每页 LIB_RENDER_MAX 条，页数随命中数变，页码越界自动夹回 */
    const pages = Math.max(1, Math.ceil(sorted.length / LIB_RENDER_MAX));
    let page = parseInt(st.page, 10);
    if (!(page >= 1)) page = 1;
    if (page > pages) page = pages;
    st.page = page;
    const shown = sorted.slice((page - 1) * LIB_RENDER_MAX, page * LIB_RENDER_MAX);
    listBox.innerHTML = shown.map((e, ord) => {
        const on = sel.has(e.k);
        const alias = (e.a || []).slice(0, 4).join('、');
        const tagline = [ipLabel(e.w), e.t].filter(Boolean).join(' · ');
        return dnaEntryRowHtml({
            on,
            boxClass: 'dna-lib-row',
            badge: tag === 'ranobewb' ? '世界书' : '同人',
            badgeColor: tag === 'ranobewb' ? '#06b6d4' : '#f97316',
            cbAttr: 'data-libsel="' + esc(e.k) + '"',
            boxAttr: 'data-librow="' + esc(e.k) + '" data-ord="' + ord + '"',
            toggleTitle: '选中这条一起发给 AI',
            title: (e.n || '') + (alias ? ' · ' + alias : ''),
            nameHtml: esc(e.n || '（没名字）'),
            meta: '',
            nameClass: 'dna-lib-name',
            pvClass: 'dna-lib-meta',
            pvTitle: tagline,
            previewHtml: esc([alias, tagline].filter(Boolean).join(' · ') || '（这条没有别名和作品信息）'),
            buttons: '<button class="dna-mini" data-libedit="' + esc(e.k) + '">编辑</button>'
                + '<button class="dna-mini dna-mini-del" data-libdel="' + esc(e.k) + '" title="删掉这一条">删</button>'
        });
    }).join('');
    /* 翻页条写到列表外面的常驻容器里：列表是滚动区，写进去要滚到底才看得见 */
    if (pagerBox) pagerBox.innerHTML = pages > 1 ? libPagerHtml(page, pages, sorted.length) : '';
}

function libPicked(tag) {
    const scope = libScopeOf(tag);
    const sel = new Set(libState(scope).sel || []);
    return (LIB_CACHE[scope] || []).filter((e) => sel.has(e.k));
}

function libSaveSel(tag, keys) {
    const st = libState(libScopeOf(tag));
    st.sel = keys.filter((k) => typeof k === 'string' && k);
    saveSettings(true);
    renderLib(tag);
}

/* 一条条目的编辑弹窗：内置条目改的是「覆盖层」，自己加的改 added 里那条 */
/* 弹一个小窗让人输入一行字。取消 / 确定都走回调 */
function dnaAskText(o) {
    const opt = o || {};
    const body = '<div class="st-chatu8-field-col"><label>' + esc(opt.label || '') + '</label>'
        + '<input type="text" class="st-chatu8-text-input" data-ask="1" placeholder="' + esc(opt.ph || '') + '" value="' + esc(opt.value || '') + '">'
        + '</div>'
        + '<div class="st-chatu8-edit-buttons dna-modal-foot">'
        + '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>取消</button>'
        + '<button type="button" class="st-chatu8-edit-button send" data-ask-ok="1">' + esc(opt.ok || '确定') + '</button>'
        + '</div>';
    dnaModalOpen(opt.title || '输入', body);
    const mask = dnaModalMask;
    if (!mask) return;
    const inp = mask.querySelector('[data-ask]');
    if (inp) { try { inp.focus(); inp.select(); } catch (e) { /* 忽略 */ } }
    const cancel = mask.querySelector('[data-modal-cancel]');
    if (cancel) cancel.addEventListener('click', () => dnaModalClose());
    const okBtn = mask.querySelector('[data-ask-ok]');
    if (okBtn) {
        okBtn.addEventListener('click', () => {
            const v = inp ? String(inp.value == null ? '' : inp.value).trim() : '';
            if (!v && opt.required !== false) { toast('不能空着', 'error'); return; }
            dnaModalClose();
            if (typeof opt.onOk === 'function') opt.onOk(v);
        });
    }
}

/* ---------- ⑦ 分类的四个动作 ---------- */
function onIpNew(tag) {
    dnaAskText({
        title: '新建分类',
        label: '分类名字（例：我的私货）',
        ph: '给这个分类起个名字',
        ok: '建好',
        onOk: (nm) => {
            const st = libState(libScopeOf(tag));
            const slug = ipSlugOfName(nm, libScopeOf(tag)) || ipNewSlug();
            st.ipName[slug] = nm;
            st.ip = slug;
            saveSettings(true);
            toast('分类「' + nm + '」建好了，可以用「加条目」往里放角色');
            renderLib(tag).catch(() => { /* 忽略 */ });
        }
    });
}

function onIpRename(tag) {
    const st = libState(libScopeOf(tag));
    const cur = String(st.ip || '');
    if (!cur) { toast('先在上面选一个分类，再改名字', 'error'); return; }
    const old = ipLabel(cur, libScopeOf(tag));
    dnaAskText({
        title: '改分类名',
        label: '「' + old + '」的新名字',
        value: old,
        ph: '留空就恢复原来的名字',
        ok: '保存',
        required: false,
        onOk: (nm) => {
            if (nm) st.ipName[cur] = nm;
            else delete st.ipName[cur];
            saveSettings(true);
            toast(nm ? ('分类改名为「' + nm + '」') : '名字已清空');
            renderLib(tag).catch(() => { /* 忽略 */ });
        }
    });
}

function onIpClear(tag) {
    const scope = libScopeOf(tag);
    const st = libState(scope);
    const cur = String(st.ip || '');
    if (!cur) { toast('先在上面选一个分类，再清空条目', 'error'); return; }
    const all = LIB_CACHE[scope] || [];
    const keys = all
        .filter((e) => String(e && e.w == null ? '' : e.w).trim() === cur)
        .map((e) => String(e.k));
    if (!keys.length) { toast('「' + ipLabel(cur, scope) + '」这个分类里没有条目', 'error'); return; }
    if (!confirm('把分类「' + ipLabel(cur, scope) + '」里的 ' + keys.length + ' 条条目一次全部清空？'
        + '\n\n内置条目会记成「已删除」，自己新增的一并移除；想找回来点「重载内置库」。')) return;
    const set = new Set(keys);
    st.added = (st.added || []).filter((e) => !set.has(String(e.k)));
    const dels = new Set(st.deleted || []);
    for (const k of keys) {
        delete st.edits[k];
        if (k.indexOf('u:') !== 0) dels.add(k);   /* 自己新增的只在 added 里，不用记删除 */
    }
    st.deleted = Array.from(dels);
    st.sel = (st.sel || []).filter((k) => !set.has(String(k)));
    st.page = 1;
    saveSettings(true);
    log(LIB_LABEL[tag] + '：已清空分类「' + ipLabel(cur, scope) + '」的 ' + keys.length + ' 条条目');
    toast('已清空 ' + keys.length + ' 条');
    renderLib(tag).catch(() => { /* 忽略 */ });
}

/* 下载一份 JSON（导出分类 / 导出内置库共用） */
function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

/* 下载一份纯文本（导出某条消息用） */
function downloadText(filename, text) {
    const blob = new Blob([String(text == null ? '' : text)], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

/* 列表上直接删掉一条（和编辑弹窗里的「删除这条」同一套规则） */
function libDeleteEntry(tag, k) {
    const scope = libScopeOf(tag);
    const st = libState(scope);
    const all = LIB_CACHE[scope] || [];
    const e = all.find((x) => String(x.k) === String(k));
    if (!e) return;
    if (!confirm('删除条目「' + (e.n || k) + '」？\n\n内置条目删掉后可以点「重载内置库」找回来。')) return;
    const isCustom = String(k).indexOf('u:') === 0;
    if (isCustom) st.added = (st.added || []).filter((x) => String(x.k) !== String(k));
    else {
        delete st.edits[k];
        st.deleted = (st.deleted || []).concat([String(k)]);
    }
    st.sel = (st.sel || []).filter((x) => String(x) !== String(k));
    saveSettings(true);
    log(LIB_LABEL[tag] + '：已删除条目「' + (e.n || k) + '」');
    toast('已删除「' + (e.n || k) + '」');
    renderLib(tag).catch(() => { /* 忽略 */ });
}

/* 导出当前分类 */
function onIpExport(tag) {
    const scope = libScopeOf(tag);
    const st = libState(scope);
    const cur = String(st.ip || '');
    if (!cur) { toast('先在上面选一个分类，再导出', 'error'); return; }
    const all = LIB_CACHE[scope] || [];
    const list = all.filter((e) => String(e.w == null ? '' : e.w).trim() === cur);
    if (!list.length) { toast('「' + ipLabel(cur, scope) + '」这个分类里没有条目', 'error'); return; }
    const nm = ipLabel(cur, scope);
    downloadJson('同人库分类_' + nm.replace(/[\\/:*?"<>|]/g, '_') + '_' + list.length + '条.json', {
        type: 'st-chatu8-dna-category',
        name: nm,
        ip: cur,
        count: list.length,
        exportedAt: new Date().toISOString(),
        chars: list
    });
    log(LIB_LABEL[tag] + '：已导出分类「' + nm + '」的 ' + list.length + ' 条');
    toast('已导出「' + nm + '」' + list.length + ' 条');
}

/* 删除当前分类（分类下的条目一起删） */
function onIpDelete(tag) {
    const scope = libScopeOf(tag);
    const st = libState(scope);
    const cur = String(st.ip || '');
    if (!cur) { toast('先在上面选一个分类，再删除', 'error'); return; }
    const nm = ipLabel(cur, scope);
    const all = LIB_CACHE[scope] || [];
    const keys = all.filter((e) => String(e.w == null ? '' : e.w).trim() === cur).map((e) => String(e.k));
    if (!confirm('删除分类「' + nm + '」？'
        + '\n\n分类下的 ' + keys.length + ' 条条目会一起删掉（内置条目记成已删除，自己新增的移除）。'
        + '\n想找回来点「重载内置库」。')) return;
    const set = new Set(keys);
    st.added = (st.added || []).filter((e) => !set.has(String(e.k)));
    const dels = new Set((st.deleted || []).map(String));
    for (const k of keys) {
        delete st.edits[k];
        if (k.indexOf('u:') !== 0) dels.add(k);
    }
    st.deleted = Array.from(dels);
    st.sel = (st.sel || []).filter((k) => !set.has(String(k)));
    delete st.ipName[cur];
    st.ip = '';
    st.page = 1;
    saveSettings(true);
    log(LIB_LABEL[tag] + '：已删除分类「' + nm + '」（' + keys.length + ' 条）');
    toast('已删除分类「' + nm + '」');
    renderLib(tag).catch(() => { /* 忽略 */ });
}

/* ------------------------------ 自定义内置库（IndexedDB） ------------------------------ */
/* 「导入内置库」导入的是几十 MB 的 JSON，settings（localStorage）根本存不下，
   所以放 IndexedDB：一个库、一个 store、一个键，存一份整库对象。 */
const BUILTIN_DB_NAME = 'st-chatu8-dna-builtin';
const BUILTIN_DB_STORE = 'kv';
const BUILTIN_DB_KEY = 'ranobe';
let BUILTIN_DB_PROMISE = null;

function builtinStoreOpen() {
    if (BUILTIN_DB_PROMISE) return BUILTIN_DB_PROMISE;
    BUILTIN_DB_PROMISE = new Promise((res, rej) => {
        try {
            const req = indexedDB.open(BUILTIN_DB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(BUILTIN_DB_STORE)) db.createObjectStore(BUILTIN_DB_STORE);
            };
            req.onsuccess = () => res(req.result);
            req.onerror = () => { BUILTIN_DB_PROMISE = null; rej(req.error || new Error('打不开内置库存储')); };
        } catch (e) { BUILTIN_DB_PROMISE = null; rej(e); }
    });
    return BUILTIN_DB_PROMISE;
}

function builtinStoreDo(mode, fn) {
    return builtinStoreOpen().then((db) => new Promise((res, rej) => {
        const tx = db.transaction(BUILTIN_DB_STORE, mode);
        const out = fn(tx.objectStore(BUILTIN_DB_STORE));
        tx.oncomplete = () => res(mode === 'readonly' ? (out ? out.result : undefined) : true);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error || new Error('内置库存储事务被中断'));
    }));
}

function builtinStoreGet() { return builtinStoreDo('readonly', (s) => s.get(BUILTIN_DB_KEY)); }
function builtinStorePut(v) { return builtinStoreDo('readwrite', (s) => s.put(v, BUILTIN_DB_KEY)); }
function builtinStoreDel() { return builtinStoreDo('readwrite', (s) => s.delete(BUILTIN_DB_KEY)); }

/* 插件自带那份（分类条目包解出来的结果）的落盘缓存：另一个键、同一个 store。
   以前解压出来的结果只放在内存里，重进酒馆就没了，得再点一次「重载内置库」等十几秒——
   这就是「重载完重进游戏内置库又消失」的根因。现在解压成功顺手存一份，
   下次进游戏直接从 IndexedDB 读回来（比解压 9630 个 json 快得多）。 */
/* v2：内置库做过一轮「同 IP 分类合并 + 重复人物清理」，
   键名换掉让老缓存自然失效，不然升级后还在用解压前的旧库。 */
const BUILTIN_DB_KEY_ZIP = 'zipcache_v2';
function builtinStoreGetZip() { return builtinStoreDo('readonly', (s) => s.get(BUILTIN_DB_KEY_ZIP)); }
function builtinStorePutZip(v) { return builtinStoreDo('readwrite', (s) => s.put(v, BUILTIN_DB_KEY_ZIP)); }
function builtinStoreDelZip() { return builtinStoreDo('readwrite', (s) => s.delete(BUILTIN_DB_KEY_ZIP)); }

/* 「内置库来源」下拉要显示的那几行字：查一次就留着。
   以前每次渲染都从 IndexedDB 把导入的那整份库（几十 MB）读出来，只为看名字和条数，卡得厉害。 */
let BUILTIN_SRC_INFO = null;

async function builtinSrcInfo() {
    if (BUILTIN_SRC_INFO) return BUILTIN_SRC_INFO;
    let custom = null;
    try { custom = await builtinStoreGet(); } catch (e) { custom = null; }
    BUILTIN_SRC_INFO = (custom && Array.isArray(custom.chars) && custom.chars.length)
        ? { has: true, name: String(custom.name || ''), n: custom.chars.length }
        : { has: false, name: '', n: 0 };
    return BUILTIN_SRC_INFO;
}

/* 「内置库来源」下拉：把「我导入的那份」的库名与条数写进选项，没有就禁用 */
async function fillBuiltinSrcSelect(tag) {
    const sel = document.querySelector('#dna-tab [data-dna="' + tag + 'BuiltinSrc"]');
    if (!sel) return;
    const info = await builtinSrcInfo();
    const hasCustom = info.has;
    const opt = sel.querySelector('option[value="custom"]');
    if (opt) {
        opt.textContent = hasCustom
            ? ('我导入的内置库（' + String(info.name || '未命名') + ' · ' + info.n + ' 条）')
            : '我导入的内置库（还没导入）';
        opt.disabled = !hasCustom;
    }
    const want = String(S.ranobeBuiltinSrc || 'zip');
    const eff = (want === 'custom' && !hasCustom) ? 'zip' : want;
    if (sel.value !== eff) sel.value = eff;
    if (S.ranobeBuiltinSrc !== eff) S.ranobeBuiltinSrc = eff;
}

/* 导入新内置库：存进 IndexedDB，然后当作内置库重新载入 */
async function onBuiltinImport(tag, file) {
    if (!file) return;
    let data = null;
    try { data = JSON.parse(await file.text()); }
    catch (e) { toast('这个文件不是 JSON', 'error'); return; }
    const chars = Array.isArray(data) ? data : (Array.isArray(data && data.chars) ? data.chars : []);
    if (!chars.length) { toast('文件里没找到条目（要 chars 或数组）', 'error'); return; }
    const works = (data && data.works && typeof data.works === 'object') ? data.works : {};
    toast('正在保存内置库（' + chars.length + ' 条）…');
    try {
        await builtinStorePut({
            name: String((data && data.name) || file.name || '导入的内置库'),
            exportedAt: new Date().toISOString(),
            works,
            chars
        });
    } catch (e) {
        const msg = (e && e.message) || String(e);
        toast('存不进浏览器本地：' + msg, 'error');
        log('导入内置库失败：' + msg, 'error');
        return;
    }
    RANOBE_BUILTIN = null;
    RANOBE_WORKS = {};
    RANOBE_CACHE_TRIED = {};         /* 换了库，缓存结论作废，下次重新读 */
    BUILTIN_SRC_INFO = null;         /* 来源下拉里的库名 / 条数也重查 */
    S.ranobeBuiltinSrc = 'custom';   /* 导入完就把来源切到这份 */
    saveSettings(true);
    log('已导入新内置库：' + chars.length + ' 条（' + file.name + '）');
    toast('已导入新内置库 ' + chars.length + ' 条，正在载入…');
    await onLibReloadRestore(tag);
}

/* 导出内置库：当前生效的那份（你导入的，或插件自带的） */
function onBuiltinExport(tag) {
    const b = RANOBE_BUILTIN;
    if (!b || !(b.chars || []).length) { toast('内置库还没载入，先点「重载内置库」', 'error'); return; }
    downloadJson('内置库_' + String(b.name || '').replace(/[\\/:*?"<>|]/g, '_') + '_' + b.chars.length + '条.json', {
        type: 'st-chatu8-dna-builtin',
        name: b.name,
        source: 'builtin',
        count: b.chars.length,
        exportedAt: new Date().toISOString(),
        works: RANOBE_WORKS,
        chars: b.chars
    });
    log(LIB_LABEL[tag] + '：已导出内置库 ' + b.chars.length + ' 条');
    toast('已导出内置库 ' + b.chars.length + ' 条');
}

/* 删除内置库：删掉导入的那份，回到插件自带的 */
async function onBuiltinDelete(tag) {
    let has = null;
    try { has = await builtinStoreGet(); } catch (e) { has = null; }
    if (!has) { toast('现在用的就是插件自带的内置库，没有可删的', 'error'); return; }
    if (!confirm('删除你导入的那份内置库，回到插件自带的那份？\n\n（条目要重新点「重载内置库」才会回来）')) return;
    try { await builtinStoreDel(); }
    catch (e) { toast('删不掉：' + ((e && e.message) || e), 'error'); return; }
    RANOBE_BUILTIN = null;
    RANOBE_WORKS = {};
    RANOBE_CACHE_TRIED = {};         /* 库删了，缓存结论作废 */
    BUILTIN_SRC_INFO = null;         /* 来源下拉里的库名 / 条数也重查 */
    S.ranobeBuiltinSrc = 'zip';      /* 删掉导入的那份，来源回到插件自带 */
    saveSettings(true);
    log(LIB_LABEL[tag] + '：已删除导入的内置库，回到插件自带的那份');
    toast('已删除导入的内置库，点「重载内置库」载入插件自带的');
    renderLib(tag).catch(() => { /* 忽略 */ });
}

function onIpAddEntry(tag) {
    const st = libState(libScopeOf(tag));
    const cur = String(st.ip || '');
    if (!cur) { toast('先在上面选一个分类，再往里加条目', 'error'); return; }
    openLibEntry(tag, '', true, cur);
}

function onIpImport(tag, file) {
    if (!file) return;
    const scope = libScopeOf(tag);
    const reader = new FileReader();
    reader.onload = () => {
        let data = null;
        try { data = JSON.parse(String(reader.result == null ? '' : reader.result)); }
        catch (e) { toast('这个文件不是 JSON', 'error'); return; }
        const st = libState(scope);
        const all = LIB_CACHE[scope] || [];
        const made = [];
        const addCat = (name, list) => {
            const nm = String(name == null ? '' : name).trim();
            if (!nm) return;
            const slug = ipSlugOfName(nm, libScopeOf(tag)) || ipNewSlug();
            st.ipName[slug] = nm;
            made.push(slug);
            if (!Array.isArray(list) || !list.length) return;
            /* 数组里写的是条目名（或别名），对上的就把它的作品改成这个分类 */
            for (const want of list) {
                const q = String(want == null ? '' : want).trim().toLowerCase();
                if (!q) continue;
                const hit = all.find((e) => String(e.n || '').trim().toLowerCase() === q)
                    || all.find((e) => (e.a || []).some((x) => String(x == null ? '' : x).toLowerCase() === q));
                if (!hit) continue;
                st.edits[hit.k] = Object.assign({}, st.edits[hit.k] || {}, { w: slug });
            }
        };
        if (Array.isArray(data)) data.forEach((x) => addCat(x, null));
        else if (data && typeof data === 'object') Object.keys(data).forEach((k) => addCat(k, data[k]));
        if (!made.length) { toast('这个文件里没读到分类', 'error'); return; }
        if (made.length) st.ip = made[0];
        saveSettings(true);
        toast('导入了 ' + made.length + ' 个分类');
        renderLib(tag).catch(() => { /* 忽略 */ });
    };
    reader.onerror = () => toast('这个文件读不出来', 'error');
    reader.readAsText(file);
}

function openLibEntry(tag, k, isNew, prefillW) {
    const scope = libScopeOf(tag);
    const st = libState(scope);
    const all = LIB_CACHE[scope] || [];
    const cur = isNew ? null : (all.find((e) => e.k === k) || null);
    if (!isNew && !cur) { toast('这条已经不在列表里了，刷新一下再试', 'error'); return; }
    const v = cur || { k: '', n: '', a: [], c: '', w: (prefillW || ''), t: '', p: '', d: '', x: '' };
    const row = (label, field, ph, rows) => '<div class="st-chatu8-field-col"><label>' + label + '</label>'
        + (rows
            ? '<textarea class="st-chatu8-textarea" data-libf="' + field + '" rows="' + rows + '" placeholder="' + esc(ph) + '">' + esc(String(v[field] == null ? '' : (Array.isArray(v[field]) ? v[field].join('、') : v[field]))) + '</textarea>'
            : '<input type="text" class="st-chatu8-text-input" data-libf="' + field + '" placeholder="' + esc(ph) + '" value="' + esc(String(v[field] == null ? '' : v[field])) + '">')
        + '</div>';
    const sec = (icon, text) => '<div class="dna-modal-sec"><i class="fa-solid ' + icon + '"></i>' + text + '</div>';
    const body = sec('fa-circle-info', '基本信息')
        + row('名字（必填）', 'n', '例：来生泪', 0)
        + row('别名（多个用、隔开）', 'a', '例：来生淚、Rui Kisugi', 0)
        + row('全名 / 标识', 'c', '例：C001｜来生泪｜kisugi_rui', 0)
        + sec('fa-image', '生图信息')
        + row('作品', 'w', '例：cats_eye', 0)
        + row('角色 tag', 't', '例：kisugi_rui', 0)
        + row('生图前缀', 'p', '例：kisugi_rui,cats_eye,long_hair', 0)
        + row('默认服装', 'd', '例：none', 0)
        + sec('fa-align-left', '资料正文')
        + row('资料正文（生成 DNA 时喂给 AI 的内容，最重要）', 'x', '把这个人物的设定写在这里；也可以留空，只用上面的字段', 10)
        + '<div class="st-chatu8-edit-buttons dna-modal-foot">'
        + (isNew ? '' : '<button type="button" class="st-chatu8-edit-button cancel" data-libdel="' + esc(k) + '">删除这条</button>')
        + '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>取消</button>'
        + '<button type="button" class="st-chatu8-edit-button send" data-libsav="1">保存</button>'
        + '</div>';
    dnaModalOpen(isNew ? ('新增' + LIB_LABEL[tag] + '条目') : ('编辑：' + (cur.n || k)), body);
    const mask = dnaModalMask;
    if (!mask) return;
    const cancelBtn = mask.querySelector('[data-modal-cancel]');
    if (cancelBtn) cancelBtn.addEventListener('click', () => dnaModalClose());
    const save = mask.querySelector('[data-libsav]');
    if (save) {
        save.addEventListener('click', () => {
            const get = (f) => {
                const el = mask.querySelector('[data-libf="' + f + '"]');
                return el ? String(el.value == null ? '' : el.value) : '';
            };
            const n = get('n').trim();
            if (!n) { toast('名字不能空', 'error'); return; }
            const aRaw = get('a').trim();
            const item = {
                k: isNew ? ('u:' + Date.now().toString(36)) : k,
                n,
                a: aRaw ? aRaw.split(/[、,，]/).map((x) => x.trim()).filter(Boolean) : [],
                c: get('c').trim(),
                w: get('w').trim(),
                t: get('t').trim(),
                p: get('p').trim(),
                d: get('d').trim(),
                x: get('x')
            };
            const isCustom = String(item.k).indexOf('u:') === 0;
            if (isCustom) {
                const i = (st.added || []).findIndex((e) => e.k === item.k);
                if (i >= 0) st.added[i] = item; else st.added.push(item);
            } else {
                st.edits[item.k] = item;
            }
            if ((st.deleted || []).indexOf(item.k) >= 0) st.deleted = st.deleted.filter((x) => x !== item.k);
            st.sel = (st.sel || []).indexOf(item.k) >= 0 ? st.sel : (st.sel || []).concat([item.k]);
            saveSettings(true);
            dnaModalClose();
            log(LIB_LABEL[tag] + '：已保存条目「' + n + '」');
            toast('已保存「' + n + '」');
            renderLib(tag);
        });
    }
    const del = mask.querySelector('[data-libdel]');
    if (del) {
        del.addEventListener('click', () => {
            const which = del.getAttribute('data-libdel');
            if (!which) return;
            if (!confirm('删除「' + (cur.n || which) + '」？内置条目删掉后可以点「恢复内置」找回来。')) return;
            const isCustom = String(which).indexOf('u:') === 0;
            if (isCustom) st.added = (st.added || []).filter((e) => e.k !== which);
            else { delete st.edits[which]; st.deleted = (st.deleted || []).concat([which]); }
            st.sel = (st.sel || []).filter((x) => x !== which);
            saveSettings(true);
            dnaModalClose();
            log(LIB_LABEL[tag] + '：已删除条目「' + (cur.n || which) + '」');
            renderLib(tag);
        });
    }
}

function onLibExport(tag) {
    const scope = libScopeOf(tag);
    const all = LIB_CACHE[scope] || [];
    if (!all.length) { toast('还没有条目', 'error'); return; }
    const st = libState(scope);
    const data = {
        type: 'st-chatu8-dna-ranobe',
        name: LIB_LABEL[tag] + (tag === 'wblib' ? '（' + (WB_LIB_BOOK || '世界书') + '）' : ''),
        source: 'user',
        count: all.length,
        exportedAt: new Date().toISOString(),
        chars: all
    };
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '同人库_' + (data.name || '').replace(/[\\/:*?"<>|]/g, '_') + '_' + all.length + '条.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    log(LIB_LABEL[tag] + '：已导出 ' + all.length + ' 条');
    toast('已导出 ' + all.length + ' 条');
}

async function onLibImportFile(tag, file) {
    if (!file) return;
    const scope = libScopeOf(tag);
    const st = libState(scope);
    try {
        const txt = await file.text();
        const data = JSON.parse(txt);
        const arr = Array.isArray(data) ? data : (Array.isArray(data.chars) ? data.chars : (Array.isArray(data.entries) ? data.entries : []));
        if (!arr.length) { toast('这个文件里没找到条目（要 chars 或数组）', 'error'); return; }
        const stamp = Date.now().toString(36);
        let n = 0;
        arr.forEach((raw, i) => {
            const e = normLibEntry(raw);
            if (!e.n) return;
            e.k = 'u:' + stamp + i;
            st.added.push(e);
            n++;
        });
        saveSettings(true);
        log(LIB_LABEL[tag] + '：导入 ' + n + ' 条（来自 ' + file.name + '）');
        toast('已导入 ' + n + ' 条');
        await renderLib(tag);
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        log(LIB_LABEL[tag] + '：导入失败 ' + msg, 'error');
        toast('导入失败：' + msg, 'error');
    }
}

async function onLibReset(tag) {
    const scope = libScopeOf(tag);
    const st = libState(scope);
    const mine = (st.added || []).length + Object.keys(st.edits || {}).length + (st.deleted || []).length + (st.wiped ? 1 : 0);
    if (!confirm(mine
        ? ('把 ' + mine + ' 处改动全部清掉，回到' + (tag === 'wblib' ? '当前角色卡的世界书' : '插件自带的同人库') + '？')
        : ('重新载入' + (tag === 'wblib' ? '当前角色卡的世界书' : '插件自带的同人库') + '？'))) return;
    st.edits = {};
    st.added = [];
    st.deleted = [];
    st.sel = [];
    st.wiped = false;      /* 「清空全部」的标记一起解除，恢复回来 */
    if (libScopeOf(tag) === 'wb') await loadWbLibSource(true);
    else await loadRanobeBuiltin(true);
    saveSettings(true);
    log(LIB_LABEL[tag] + '：已恢复内置');
    toast('已恢复内置');
    await renderLib(tag);
}

async function onLibReload(tag) {
    if (libScopeOf(tag) === 'wb') await loadWbLibSource(true);
    else await loadRanobeBuiltin(true);
    await renderLib(tag);
    toast('已重新读取');
}

/* 同人库的「重载内置库」：重读插件里的内置库，并把「删掉的 / 改过的 / 自己新增的」条目全部还原。
   以前这里只重读文件、不动用户层，所以清空过条目再点它什么都不会变。
   世界书页的「重新读取世界书」还是走 onLibReload，不动用户改过的条目。 */
async function onLibReloadRestore(tag) {
    const scope = libScopeOf(tag);
    const st = libState(scope);
    const mine = (st.added || []).length + Object.keys(st.edits || {}).length + (st.deleted || []).length + (st.wiped ? 1 : 0);
    if (!confirm(mine
        ? ('重新载入内置库（插件自带的分类条目包，或你导入的那份），并把你改动过的 ' + mine + ' 处（删掉的 / 改过的 / 自己新增的）全部还原？'
            + '\n\n自建的分类会留着，只是分类里的条目回到内置库里的样子。')
        : '重新载入内置库？')) return;
    toast('正在解压分类条目包，第一次要等十几秒…');
    /* 先真去解压：解不出来就停手——既不动你的改动，也不谎报「已还原」 */
    const b = await loadRanobeBuiltin(true);
    if (!b || !(b.chars || []).length) {
        toast('分类条目包没解出来（看日志面板的报错），你的条目没动', 'error');
        log(LIB_LABEL[tag] + '：重载内置库失败，data/ranobe_categories.zip 没解出来', 'error');
        await renderLib(tag);
        return;
    }
    st.edits = {};
    st.added = [];
    st.deleted = [];
    st.sel = [];
    st.q = '';      /* 搜索词留着会让人以为「没还原」，一起清掉 */
    st.ip = '';     /* 清空分类筛选，renderLib 会落到条目最多的那个分类上 */
    st.page = 1;
    st.wiped = false;   /* 「清空全部」的标记一起解除，内置条目全回来 */
    saveSettings(true);
    log(LIB_LABEL[tag] + '：已重载内置库，条目已还原（分类条目包 ' + b.chars.length + ' 条）');
    toast('已重载内置库，条目已还原（' + b.chars.length + ' 条）');
    await renderLib(tag);
}

/* 「清空全部」：把当前库的所有分类和所有条目一次清空。
   内置库是插件里的静态文件（10 万条），没法真删，逐条记 deleted 也会把设置撑爆、
   每次合库还要多查 10 万次——所以只打一个「整库已清空」的标记，合库时跳过内置本体。
   想找回来点「重载内置库」（世界书页是「恢复内置」），标记会和其它改动一起还原。 */
function onLibWipeAll(tag) {
    const scope = libScopeOf(tag);
    const st = libState(scope);
    const all = LIB_CACHE[scope] || [];
    const total = all.length || ((scope === 'ranobe' && RANOBE_BUILTIN && RANOBE_BUILTIN.chars) ? RANOBE_BUILTIN.chars.length : 0);
    const cats = ipCounts(all, scope).filter((x) => !!String(x[0] || '').trim()).length;
    const label = LIB_LABEL[tag] || '库';
    const back = scope === 'wb' ? '恢复内置' : '重载内置库';
    if (!total && !cats && !Object.keys(st.ipName || {}).length && !(st.added || []).length) {
        toast('现在本来就是空的', 'error');
        return;
    }
    if (!confirm('把' + label + '里当前全部 ' + total + ' 条条目和 ' + cats + ' 个分类一次清空？'
        + '\n\n内置条目不会被真的删掉，只是整库标记成「已清空」；你自己新增的条目、改过的内容、'
        + '勾选的条目、改过名 / 自己建的分类也一起清掉。'
        + '\n想找回来点「分类操作 → ' + back + '」（会连同其它改动一起还原）。')) return;
    st.wiped = true;
    st.edits = {};
    st.added = [];
    st.deleted = [];     /* 整库都清了，不用再逐条记「删掉哪条」 */
    st.sel = [];
    st.q = '';
    st.ip = '';
    st.page = 1;
    st.ipName = {};      /* 分类名（改过的 / 自己建的）也全清 */
    saveSettings(true);
    log(label + '：已清空全部分类和条目（想找回来点「' + back + '」）');
    toast('已清空全部分类和条目');
    renderLib(tag).catch(() => { /* 忽略 */ });
}

/* 把勾选条目拼成给 AI 的资料正文 */
function buildLibText(tag) {
    const scope = libScopeOf(tag);
    const picked = libPicked(tag);
    if (!picked.length) return '';
    const parts = [];
    if (scope === 'wb') {
        parts.push('【世界书资料】');
        for (const e of picked) parts.push('—— ' + (e.n || '') + ' ——\n' + (e.x || ''));
        parts.push('',
            '请为上面这些条目里出现的每一个具体人物各出一份 DNA 档案，一个都不许漏（泛称群体、地名、组织名不算人物）。',
            '资料里没写到的字段，按这个世界观合理补全，不要留空、不要写“未知”。',
            '不要因为戏份少或只是配角就跳过某个具体人物，也不要额外编造条目里没有的人物——收录范围由用户勾选决定。');
    } else {
        /* 标记要和上下文预设里 §1.1 认的那三个对齐，否则预设会走「三种都没有」的兜底分支 */
        parts.push('【同人资料库资料】');
        for (const e of picked) {
            /* 每条只贴一次机器记录：NAME / TAG / WORK / PROMPT / WARDROBE 都在 [CHARACTER_LIBRARY_RECORD] 里，
               不再逐行重复一遍（旧版重复两遍，勾几十条时白白翻倍）。记录里没有的才单独补一行。 */
            const cn = ipLabel(e.w, scope);
            const extra = [];
            if (e.a && e.a.length) extra.push('ALIASES=' + e.a.join(','));
            if (cn && cn !== e.w) extra.push('作品中文名=' + cn);
            parts.push('—— 条目 ' + (e.k || '') + ' ——' + (extra.length ? ('\n' + extra.join('\n')) : ''));
            if (e.x) {
                parts.push(String(e.x).trim());
            } else {
                /* 老数据可能没有整段记录，退回逐行字段，格式跟记录里一致 */
                parts.push([
                    e.n ? ('NAME=' + e.n) : '',
                    'SOURCE=A_LIBRARY',
                    e.t ? ('CHARACTER_TAG=' + e.t) : '',
                    e.w ? ('WORK_TAG=' + e.w) : '',
                    e.p ? ('PROMPT_PREFIX=' + e.p) : '',
                    'DEFAULT_WARDROBE=' + (e.d || 'none')
                ].filter(Boolean).join('\n'));
            }
        }
        parts.push('',
            '请为上面这些同人条目里提到的每一个具体人物各出一份 DNA 档案，一个都不许漏（泛称群体、作品名、组织名不算人物）。',
            '资料里没写到的字段，按角色在原作里的设定与气质合理补全，不要留空、不要写“未知”。',
            '不要额外编造资料里没有的人物——收录范围由用户勾选决定。');
    }
    const extra = String(libState(scope).req || '').trim();
    if (extra) parts.push('', '【额外要求】', extra);
    return parts.join('\n');
}

function buildLibPrompt(tag) {
    const scope = libScopeOf(tag);
    const picked = libPicked(tag);
    const text = buildLibText(tag);
    /* 同人库把条目的身份信息当「角色底子」一起给模型；世界书那页只靠条目正文 */
    const origins = scope === 'wb' ? [] : picked.map((e) => ({
        name: e.n,
        content: [e.c, e.w ? ('作品：' + (ipLabel(e.w, scope) !== e.w ? ipLabel(e.w, scope) + '（' + e.w + '）' : e.w)) : '', e.t ? ('角色 tag：' + e.t) : '', e.p ? ('生图前缀：' + e.p) : '', e.d ? ('默认服装：' + e.d) : '']
            .filter(Boolean).join('\n')
    })).filter((o) => o.content);
    const olds = S.updateExisting ? pickOldRecords(picked.map((e) => e.n).join(' '), OLD_RECORD_BUDGET) : [];
    return { picked, text, origins, olds, prompt: buildRecordPrompt(text, { origins, olds }, 'ranobe') };
}

/* 预览弹窗：把真正要发出去的 messages 一条条摊开 */
function openPromptPreview(title, prompt, info) {
    const msgs = normalizeMessages(prompt);
    const body = '<div class="dna-hint dna-hint-inline">' + esc(info || '') + '</div>'
        + msgs.map((m) => '<div class="st-chatu8-field-col"><label>'
            + esc(m.role) + ' · ' + m.content.length + ' 字</label>'
            + '<textarea class="st-chatu8-textarea dna-mono" rows="10" readonly>' + esc(m.content) + '</textarea></div>').join('')
        + '<div class="st-chatu8-edit-buttons dna-modal-foot">'
        + '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>关闭</button></div>';
    const mask = dnaModalOpen(title, body);
    const close = mask ? mask.querySelector('[data-modal-cancel]') : null;
    if (close) close.addEventListener('click', () => dnaModalClose());
}

/* 同人库 / 世界书：生成 DNA（写进档案库） */
async function onLibDna(tag) {
    const scope = libScopeOf(tag);
    const label = LIB_LABEL[tag];
    if (scanning) { toast('上一轮还在跑，等它跑完'); return; }
    if (!S.enabled) { toast('插件已停用，先打开「设置」里的启用插件'); return; }
    const picked = libPicked(tag);
    if (!picked.length) { toast('先在列表里勾至少一条', 'error'); return; }
    const g = buildLibPrompt(tag);
    setBusy(true, '生成中…');
    dnaBanner('DNA建档中', 'run');
    let created = 0, updated = 0, skipped = 0, locked = 0, failed = 0;
    let firstName = '';
    try {
        const api = resolveApi('ranobe');
        const usePreset = presetEnabledOf('ranobe') && presetEntries(undefined, 'ranobe').length > 0;
        log(label + '：勾选 ' + picked.length + ' 条 / 资料 ' + g.text.length + ' 字');
        log('使用 ' + api.source + ' · ' + api.model + '（' + label + '）');
        logBreakthrough();
        log('提示词：' + (usePreset ? '同人库预设「' + activePresetName('ranobe') + '」' : '插件内置 batchPrompt')
            + ' · ' + promptChars(g.prompt) + ' 字 / ' + normalizeMessages(g.prompt).length + ' 条');
        liveBegin('ranobe', label);
        let raw;
        try {
            raw = await callSafe(
                g.prompt,
                buildRecordPrompt(clipText(g.text, 400), { origins: g.origins, olds: g.olds }, 'ranobe'),
                'ranobe',
                usePreset ? batchPrompt(g.text, { origins: g.origins, olds: g.olds }) : undefined,
                S.replyMaxTokens,
                (full) => liveDelta('ranobe', full)
            );
            liveEnd('ranobe', raw);
        } catch (e) {
            liveEnd('ranobe', '', (e && e.message) || e);
            throw e;
        }
        const list = parseProfileList(raw);
        if (!list) {
            appendAiReplyMeta('ranobe', '解析失败，看原文');
            log('AI 返回无法解析：' + String(raw || '').slice(0, 300), 'error');
            toast('返回解析不了，看「AI 回复（实时）」', 'error');
            return;
        }
        appendAiReplyMeta('ranobe', list.length + ' 份档案');
        log('AI 返回 ' + list.length + ' 份档案');
        const done = Object.create(null);
        for (const item of list) {
            const prof = normalizeProfile(item, item && item['姓名']);
            if (!prof || !String(prof['姓名'] || '').trim()) { failed++; continue; }
            const nm = String(prof['姓名']).trim();
            if (done[nm]) continue;
            done[nm] = 1;
            try {
                const res = saveProfile(prof, label);
                if (res.split) log('「' + nm + '」一条里写了多种形态，自动拆成 ' + res.results.length + ' 条档案');
                for (const one of res.results) {
                    if (one.r === 'created') { created++; log('新建「' + one.name + '」'); if (!firstName) firstName = one.name; }
                    else if (one.r === 'updated') { updated++; log('更新「' + one.name + '」'); if (!firstName) firstName = one.name; }
                    else if (one.r === 'locked') { locked++; log('「' + one.name + '」已锁定，AI 不改它'); }
                    else { skipped++; log('跳过「' + one.name + '」（已建档，且没开「AI自动更新档案库」）'); }
                }
            } catch (e) {
                failed++;
                log('「' + nm + '」写入失败：' + (e && e.message ? e.message : e), 'error');
            }
        }
        if (created || updated) saveSettings(true);
        log(label + '完成：新建 ' + created + ' · 更新 ' + updated + ' · 跳过 ' + skipped
            + (locked ? (' · 锁定跳过 ' + locked) : '') + ' · 失败 ' + failed);
        toast('生成完成：新建 ' + created + ' / 更新 ' + updated + (locked ? (' / 锁定跳过 ' + locked) : ''));
        renderList();
        if (created + updated > 0 && firstName) { selected = firstName; renderList(); }
        if (created + updated > 0) dnaBanner('建档成功', 'ok', 2600);
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        if (/已手动中断/.test(msg)) {
            log(label + '已中断' + ((created + updated) ? ('：已经建档 ' + (created + updated) + ' 条，保留不动') : '，没写任何档案'));
            toast('已中断这次生成');
            dnaBanner('已中断', 'err', 2400);
        } else {
            log(label + '失败：' + msg, 'error');
            toast('生成失败：' + msg, 'error');
            dnaBanner('建档失败', 'err', 3600);
        }
    } finally {
        if (created || updated) saveSettings(true);
        setBusy(false);
        syncAbortBtns();
        if (dnaBannerKind === 'run') dnaBannerHide();
    }
}


/* 测试工具：只组装（不请求）/ 组装 + 发一次测试请求（结果只显示，不写档案） */
function libPromptDump(prompt) {
    return normalizeMessages(prompt).map((m) => '==== ' + m.role + ' · ' + m.content.length + ' 字 ====\n' + m.content).join('\n\n');
}

async function onLibTest(tag, send) {
    const label = LIB_LABEL[tag];
    const out = libEl(tag, 'TestPrompt');
    const res = libEl(tag, 'TestResult');
    if (!libPicked(tag).length) { toast('先在列表里勾至少一条', 'error'); return; }
    if (!send) {
        const g = buildLibPrompt(tag);
        if (out) out.value = libPromptDump(g.prompt) + '\n\n==== 资料正文 · ' + g.text.length + ' 字 ====\n' + g.text;
        toast('已组装：' + normalizeMessages(g.prompt).length + ' 条消息，' + promptChars(g.prompt) + ' 字（没发请求）');
        return;
    }
    if (scanning) { toast('上一轮还在跑，等它跑完'); return; }
    setBusy(true, '测试中…');
    const btn = libEl(tag, 'TestLLM');
    const old = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.textContent = '请求中…'; }
    if (res) res.value = '正在请求……';
    try {
        const g = buildLibPrompt(tag);
        if (out) out.value = libPromptDump(g.prompt);
        const api = resolveApi('ranobe');
        log(label + '测试请求：' + api.model + ' · ' + promptChars(g.prompt) + ' 字');
        liveBegin('ranobe', label + ' · 测试');
        let reply;
        try {
            reply = await callSafe(g.prompt,
                buildRecordPrompt(clipText(g.text, 400), { origins: g.origins, olds: g.olds }, 'ranobe'),
                'ranobe', undefined, S.replyMaxTokens, (full) => liveDelta('ranobe', full));
            liveEnd('ranobe', reply);
        } catch (e) {
            liveEnd('ranobe', '', (e && e.message) || e);
            throw e;
        }
        if (res) res.value = reply;
        toast('测试完成：回复 ' + reply.length + ' 字（没写档案）');
        log(label + '测试完成：回复 ' + reply.length + ' 字（没写进档案库）');
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        if (res) res.value = '失败：' + msg;
        log(label + '测试失败：' + msg, 'error');
    } finally {
        setBusy(false);
        if (btn) { btn.disabled = false; btn.innerHTML = old; }
    }
}

/* 生成两个新页签的 HTML（同人资料库 / 按世界书生成），结构一样只有标题与数据源不同 */
/* LLM 配置 / 上下文预设这两个卡片：手动生成与同人库各一份，结构完全一样，只是控件前缀（scope）不同。
   档案库那一份是静态写在 PANEL_HTML 里的，这里生成的 gen / ranobe 版与它保持同一套类名与排版。 */
function profileCardHtml(scope) {
    const k = (b) => 'data-dna="' + dkey(scope, b) + '"';
    const fold = scope + 'LLM';
    return [
        '    <div class="st-chatu8-settings-section dna-fold" data-fold="' + fold + '">',
        '      <div class="dna-fold-head">',
        '        <h3><i class="fa-solid fa-microchip"></i> LLM 配置</h3>',
        '        <button type="button" class="dna-fold-btn" data-fold-btn="' + fold + '" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>',
        '      </div>',
        '      <div class="st-chatu8-field">',
        '        <label>使用哪份配置</label>',
        '        <select class="st-chatu8-select" ' + k('profileSelect') + '></select>',
        '      </div>',
        '      <div class="dna-actions">',
        '        <button class="st-chatu8-btn" ' + k('gotoLLM') + '><i class="fa-solid fa-arrow-right-to-bracket"></i>去 LLM 页签编辑</button>',
        '      </div>',
        '      <div class="dna-kv" ' + k('configDetail') + '></div>',
        '    </div>'
    ].join('\n');
}

function presetCardHtml(scope, cfg) {
    const C = cfg || {};
    const k = (b) => 'data-dna="' + dkey(scope, b) + '"';
    const fold = C.fold || (scope + 'Preset');
    const boxTitle = C.boxTitle || '预设操作';
    return [
        '    <div class="st-chatu8-settings-section dna-fold" data-fold="' + fold + '">',
        '      <div class="dna-fold-head">',
        '        <h3><i class="fa-solid fa-layer-group"></i> 上下文预设</h3>',
        '        <div class="dna-sec-actions">',
        '          <button type="button" class="dna-fold-btn" data-fold-btn="' + fold + '" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>',
        '        </div>',
        '      </div>',
        '      <div class="dna-status-row">',
        '        <span class="dna-badge" ' + k('presetLabel') + '>未导入</span>',
        '      </div>',
        '      <div class="st-chatu8-field">',
        '        <label>用这份预设组装提示词</label>',
        '        <div class="st-chatu8-toggle"><input type="checkbox" ' + k('presetEnabled') + '><span class="st-chatu8-slider"></span></div>',
        '      </div>',
        '      <div class="st-chatu8-field">',
        '        <label>把 system 消息合并到开头一条</label>',
        '        <div class="st-chatu8-toggle"><input type="checkbox" ' + k('presetMergeSystem') + '><span class="st-chatu8-slider"></span></div>',
        '      </div>',
        '      <div class="st-chatu8-field">',
        '        <label>当前预设</label>',
        '        <div class="st-chatu8-profile-controls">',
        '          <select class="st-chatu8-select" ' + k('presetSelect') + '></select>',
        '          <div class="st-chatu8-preset-box-wrapper">',
        '            <button type="button" class="st-chatu8-icon-btn st-chatu8-preset-box-btn" title="预设操作收纳盒"><i class="fa-solid fa-table-cells"></i></button>',
        '            <div class="st-chatu8-preset-box-dropdown">',
        '              <div class="st-chatu8-preset-box-header">',
        '                <span class="st-chatu8-preset-box-title"><i class="fa-solid fa-box-archive"></i> ' + boxTitle + '</span>',
        '                <button type="button" class="st-chatu8-preset-box-close" title="关闭">&times;</button>',
        '              </div>',
        '              <div class="st-chatu8-preset-box-group">',
        '                <span class="st-chatu8-preset-box-group-label">导入与导出</span>',
        '                <div class="st-chatu8-preset-box-grid">',
        '                  <button type="button" class="st-chatu8-preset-box-item" ' + k('presetSave') + ' title="把当前这份预设存下来"><i class="fa-solid fa-floppy-disk"></i><span>保存</span></button>',
        '                  <button type="button" class="st-chatu8-preset-box-item" ' + k('presetImport') + ' title="导入预设文件"><i class="fa-solid fa-file-import"></i><span>导入</span></button>',
        '                  <button type="button" class="st-chatu8-preset-box-item" ' + k('presetExport') + ' title="导出当前预设"><i class="fa-solid fa-file-export"></i><span>导出</span></button>',
        '                </div>',
        '              </div>',
        '              <div class="st-chatu8-preset-box-group">',
        '                <span class="st-chatu8-preset-box-group-label">管理</span>',
        '                <div class="st-chatu8-preset-box-grid">',
        '                  <button type="button" class="st-chatu8-preset-box-item" ' + k('presetRename') + ' title="重命名预设"><i class="fa-solid fa-pen"></i><span>改名</span></button>',
        '                  <button type="button" class="st-chatu8-preset-box-item" ' + k('presetReseed') + ' title="把内置预设刷新成插件里的最新版本（自己导入 / 新建的预设不受影响）"><i class="fa-solid fa-rotate"></i><span>更新内置</span></button>',
        '                </div>',
        '              </div>',
        '              <div class="st-chatu8-preset-box-group">',
        '                <span class="st-chatu8-preset-box-group-label">危险操作</span>',
        '                <div class="st-chatu8-preset-box-grid">',
        '                  <button type="button" class="st-chatu8-preset-box-item danger" ' + k('presetRemove') + ' title="删除预设"><i class="fa-solid fa-trash"></i><span>删除</span></button>',
        '                </div>',
        '              </div>',
        '            </div>',
        '          </div>',
        '        </div>',
        '      </div>',
        '      <input type="file" accept=".json,application/json" ' + k('presetFile') + ' style="display:none">',
        '      <div class="dna-kv" ' + k('presetInfo') + '></div>',
        '      <div class="dna-entry-head">',
        '        <span class="dna-entry-head-t">预设条目 <span class="dna-count" ' + k('presetEntryCount') + '>0 / 0</span></span>',
        '        <span class="dna-entry-tools">',
        '          <button class="st-chatu8-btn dna-btn-sm" ' + k('presetAllOn') + '>全开</button>',
        '          <button class="st-chatu8-btn dna-btn-sm" ' + k('presetAllOff') + '>全关</button>',
        '        </span>',
        '      </div>',
        '      <div class="dna-entries" ' + k('presetEntries') + '></div>',
        '    </div>'
    ].join('\n');
}


/* ------------------------------ 角色照片：拿档案生图 ------------------------------ */
/* 生图直接借智绘姬自己那套：往 SillyTavern 的事件源上发 generate-image-request，
   哪个渠道开着（novelai / comfyui / banana / runninghub / sd）就由谁接，
   回来是一张 data URI。这样 DNA 里不用再实现一遍各种渠道。 */
const PHOTO_REQ_EVENT = 'generate-image-request';
const PHOTO_RES_EVENT = 'generate-image-response';
const PHOTO_TIMEOUT = 180000;
let photoBusy = false;
let photoTimer = null;
let photoLast = null;

function photoEntries() {
    const entries = currentEntries();
    const out = [];
    for (const k in entries) {
        const rec = entries[k];
        if (!rec) continue;
        const nm = String(rec['姓名'] == null ? '' : rec['姓名']).trim() || String(k || '');
        if (!nm) continue;
        out.push({ key: String(k), name: nm, rec });
    }
    out.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    return out;
}

/* 提示词：先拿给生图用的那两栏（外貌串 / 服装串），没有再退回描述栏 */
/* 手选：拿档案里的哪几栏拼生图提示词。选择记在设置里，换角色也沿用。 */
const PHOTO_PICK_DEFAULT = ['外貌串', '服装串'];

function photoPickList() {
    if (!Array.isArray(S.photoPick)) S.photoPick = PHOTO_PICK_DEFAULT.slice();
    return S.photoPick;
}

function photoPickSet(name, on) {
    const list = photoPickList();
    const i = list.indexOf(name);
    if (on && i < 0) list.push(name);
    if (!on && i >= 0) list.splice(i, 1);
    S.photoPick = list;
    try { saveSettingsDebounced(); } catch (e) { /* 存不了也不影响这次 */ }
}

/* 把该角色每一栏有没有内容画成开关；空的置灰、点不了 */
function renderPhotoPick() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const box = tab.querySelector('[data-dna="photoPick"]');
    if (!box) return;
    const selEl = tab.querySelector('[data-dna="photoChar"]');
    const key = String((selEl && selEl.value) || '');
    const hit = photoEntries().find((x) => x.key === key);
    const rec = hit ? hit.rec : null;
    const picks = photoPickList();
    box.innerHTML = DNA_FIELDS.map((f) => {
        const v = rec ? String(rec[f] == null ? '' : rec[f]).trim() : '';
        const on = picks.indexOf(f) >= 0 && !!v;
        const cls = 'dna-sendfield' + (on ? ' is-on' : '') + (v ? '' : ' is-empty');
        return '<div class="' + cls + '" data-pk="' + esc(f) + '">'
            + '<span class="dna-sendfield-name" title="' + esc(v ? v.slice(0, 80) : '这一栏是空的') + '">'
            + esc(f) + (v ? '' : '（空）') + '</span>'
            + '<div class="st-chatu8-entry-toggle"><input type="checkbox" data-pk-in="' + esc(f) + '"'
            + (on ? ' checked' : '') + (v ? '' : ' disabled') + '><span class="st-chatu8-slider"></span></div>'
            + '</div>';
    }).join('');
}

function photoPromptFor(rec) {
    if (!rec) return '';
    const g = (k) => String(rec[k] == null ? '' : rec[k]).trim();
    const picks = photoPickList();
    const parts = [];
    /* 按档案字段表的顺序拼，勾了哪几栏就拼哪几栏，空的跳过 */
    for (const f of DNA_FIELDS) {
        if (picks.indexOf(f) < 0) continue;
        const v = g(f);
        if (v) parts.push(v);
    }
    if (parts.length) return parts.join('，');
    /* 勾的那几栏这个角色恰好都是空的：退回默认规则，别让提示词空着 */
    const ext = g('外貌串') || g('外貌特征');
    const wear = g('服装串') || g('当前衣着/装扮');
    if (ext) parts.push(ext);
    if (wear) parts.push(wear);
    if (!parts.length) {
        const nm = g('姓名');
        const sex = g('性别/年龄');
        if (nm) parts.push(nm);
        if (sex) parts.push(sex);
    }
    return parts.join('，');
}

function renderPhotoChars() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const sel = tab.querySelector('[data-dna="photoChar"]');
    const cnt = tab.querySelector('[data-dna="photoCount"]');
    if (!sel) return;
    const list = photoEntries();
    if (cnt) cnt.textContent = String(list.length);
    const keep = String(sel.value || '');
    if (!list.length) {
        sel.innerHTML = '<option value="">档案库还是空的，先去记一条</option>';
        return;
    }
    sel.innerHTML = list.map((x) => '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>').join('');
    if (keep && list.some((x) => x.key === keep)) sel.value = keep;
    renderPhotoPick();
    /* 提示词还空着就顺手补一份 */
    const ta = tab.querySelector('[data-dna="photoPrompt"]');
    if (ta && !String(ta.value || '').trim()) photoFillPrompt();
}

function photoFillPrompt() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const sel = tab.querySelector('[data-dna="photoChar"]');
    const ta = tab.querySelector('[data-dna="photoPrompt"]');
    if (!sel || !ta) return;
    const key = String(sel.value || '');
    const hit = photoEntries().find((x) => x.key === key);
    ta.value = hit ? photoPromptFor(hit.rec) : '';
}

function onPhotoSave() {
    if (!photoLast || !photoLast.src) { toast('还没有图片', 'error'); return; }
    const nm = String(photoLast.name || '角色').replace(/[\\/:*?"<>|]/g, '_');
    const a = document.createElement('a');
    a.download = nm + '_' + Date.now() + '.png';
    a.href = photoLast.src;
    a.click();
}

function onPhotoGen() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    if (photoBusy) { toast('上一张还在生成，等它回来', 'error'); return; }
    const ta = tab.querySelector('[data-dna="photoPrompt"]');
    const prompt = String((ta && ta.value) || '').trim();
    if (!prompt) { toast('提示词还是空的：先选个角色，或者自己写一句', 'error'); return; }
    let es = null;
    try { es = SillyTavern.getContext().eventSource; } catch (e) { es = null; }
    if (!es || typeof es.emit !== 'function') { toast('读不到智绘姬的事件源，生图发不出去', 'error'); return; }
    const selEl = tab.querySelector('[data-dna="photoChar"]');
    const whoKey = String((selEl && selEl.value) || '');
    const who = (photoEntries().find((x) => x.key === whoKey) || {}).name || '这个角色';
    const info = tab.querySelector('[data-dna="photoInfo"]');
    const btn = tab.querySelector('[data-dna="photoGen"]');
    const id = 'dna_photo_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const finish = () => {
        photoBusy = false;
        if (photoTimer) { clearTimeout(photoTimer); photoTimer = null; }
        try { es.removeListener(PHOTO_RES_EVENT, onRes); } catch (e) { /* 忽略 */ }
        if (btn) btn.disabled = false;
    };
    const onRes = (data) => {
        if (!data || String(data.id == null ? '' : data.id) !== id) return;
        finish();
        if (!data.success || !data.imageData) {
            const why = data.error || '渠道没给图片，看看生图渠道开着没';
            if (info) info.textContent = '生成失败：' + why;
            toast('生成失败：' + why, 'error');
            return;
        }
        let src = String(data.imageData);
        if (src.indexOf('data:') !== 0) src = 'data:image/png;base64,' + src;
        const img = tab.querySelector('[data-dna="photoImg"]');
        const empty = tab.querySelector('[data-dna="photoEmpty"]');
        const save = tab.querySelector('[data-dna="photoSave"]');
        if (img) { img.src = src; img.style.display = 'block'; }
        if (empty) empty.style.display = 'none';
        if (save) save.disabled = false;
        photoLast = { src, name: who };
        if (info) info.textContent = who + ' · ' + new Date().toLocaleTimeString();
        toast('图片生成好了');
    };
    photoBusy = true;
    if (btn) btn.disabled = true;
    if (info) info.textContent = '正在生成 ' + who + ' 的图片…';
    es.on(PHOTO_RES_EVENT, onRes);
    photoTimer = setTimeout(() => {
        if (!photoBusy) return;
        finish();
        if (info) info.textContent = '等了 180 秒没等到结果，可能渠道卡住了或者没开生图';
        toast('等太久没等到图片，看看智绘姬的生图渠道开着没', 'error');
    }, PHOTO_TIMEOUT);
    try {
        es.emit(PHOTO_REQ_EVENT, { id, prompt });
    } catch (e) {
        finish();
        if (info) info.textContent = '发请求的时候就出错了：' + (e && e.message ? e.message : e);
        toast('发请求出错', 'error');
    }
}

function libPanelHtml(tag, cfg) {
    const d = (n) => 'data-dna="' + tag + n + '"';
    const C = cfg || {};
    const reply = '<div class="st-chatu8-settings-section dna-fold" data-fold="' + tag + 'AI">'
        + '<div class="dna-fold-head"><h3><i class="fa-solid fa-comments"></i> AI 回复（实时）</h3>'
        + '<button type="button" class="dna-fold-btn" data-fold-btn="' + tag + 'AI" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button></div>'
        + '<div class="dna-status-row"><span class="dna-badge" data-dna="aiReplyRanobeState">待命</span></div>'
        + '<div class="st-chatu8-field-col">'
        + '<textarea class="st-chatu8-textarea dna-mono" data-dna="aiReplyRanobe" rows="8" readonly placeholder="还没有内容。点一次「生成 DNA」，AI 正在写什么、写了多少，都会实时出现在这里。"></textarea>'
        + '<div class="dna-hint dna-hint-inline">'
        + '<button class="st-chatu8-btn dna-btn-sm" ' + d('Copy') + '><i class="fa-regular fa-copy"></i>复制</button>'
        + '<button class="st-chatu8-btn dna-btn-sm" ' + d('ClearReply') + '>清空</button>'
        + '</div></div></div>';
    const foldLib = tag + 'Lib';
    const head = '<div class="st-chatu8-settings-section dna-fold" data-fold="' + foldLib + '">'
        + '<div class="dna-sec-head dna-fold-head"><h3><i class="' + C.icon + '"></i> ' + C.title + ' <span class="dna-count" ' + d('Count') + '>0</span></h3>'
        + '<div class="dna-sec-actions">'
        /* 同人库那一页的「库操作」已经全部并进分类操作收纳盒，这里只给世界书生成页留一份 */
        + (C.ipFilter ? '' : ('<div class="st-chatu8-preset-box-wrapper">'
        + '<button type="button" class="st-chatu8-icon-btn st-chatu8-preset-box-btn" title="库操作收纳盒"><i class="fa-solid fa-table-cells"></i></button>'
        + '<div class="st-chatu8-preset-box-dropdown">'
        + '<div class="st-chatu8-preset-box-header">'
        + '<span class="st-chatu8-preset-box-title"><i class="fa-solid fa-box-archive"></i> 库操作</span>'
        + '<button type="button" class="st-chatu8-preset-box-close" title="关闭">&times;</button>'
        + '</div>'
        + '<div class="st-chatu8-preset-box-group">'
        + '<span class="st-chatu8-preset-box-group-label">导入与导出</span>'
        + '<div class="st-chatu8-preset-box-grid">'
        + '<button type="button" class="st-chatu8-preset-box-item" ' + d('Import') + ' title="导入一份同人库 JSON（同格式即可）"><i class="fa-solid fa-file-import"></i><span>导入</span></button>'
        + '<button type="button" class="st-chatu8-preset-box-item" ' + d('Export') + ' title="把当前这份库导成 JSON"><i class="fa-solid fa-file-export"></i><span>导出</span></button>'
        + '</div></div>'
        + '<div class="st-chatu8-preset-box-group">'
        + '<span class="st-chatu8-preset-box-group-label">编辑</span>'
        + '<div class="st-chatu8-preset-box-grid">'
        + '<button type="button" class="st-chatu8-preset-box-item" ' + d('Add') + ' title="自己加一条"><i class="fa-solid fa-plus"></i><span>新增条目</span></button>'
        + '</div></div>'
        + '<div class="st-chatu8-preset-box-group">'
        + '<span class="st-chatu8-preset-box-group-label">危险操作</span>'
        + '<div class="st-chatu8-preset-box-grid">'
        + '<button type="button" class="st-chatu8-preset-box-item danger" ' + d('Reset') + ' title="' + C.resetTip + '"><i class="fa-solid fa-rotate-left"></i><span>恢复内置</span></button>'
        + '</div></div>'
        + '</div></div>'))
        + '<button type="button" class="dna-fold-btn" data-fold-btn="' + foldLib + '" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>'
        + '</div></div>'
        + '<div class="dna-status-row"><span class="dna-badge" ' + d('Meta') + '>—</span>'
        + (C.source ? ('<span class="dna-badge" ' + d('Source') + '>—</span>') : '')
        + '</div>'
        /* 搜索 + 分类这两块包一层：电脑版里并排成两列，手机版还是各自一整行 */
        + '<div class="dna-lib-filters">'
        + '<div class="st-chatu8-field"><label>搜索</label>'
        + '<input type="text" class="st-chatu8-text-input" ' + d('Search') + ' placeholder="' + C.searchPh + '"></div>'
        + (C.ipFilter
            ? ('<div class="st-chatu8-field"><label>分类</label>'
                + '<div class="st-chatu8-profile-controls">'
                + '<select class="st-chatu8-select" ' + d('Ip') + '></select>'
                + '<div class="st-chatu8-preset-box-wrapper">'
                + '<button type="button" class="st-chatu8-icon-btn st-chatu8-preset-box-btn" title="分类操作收纳盒"><i class="fa-solid fa-table-cells"></i></button>'
                + '<div class="st-chatu8-preset-box-dropdown">'
                + '<div class="st-chatu8-preset-box-header">'
                + '<span class="st-chatu8-preset-box-title"><i class="fa-solid fa-box-archive"></i> 分类操作</span>'
                + '<button type="button" class="st-chatu8-preset-box-close" title="关闭">&times;</button>'
                + '</div>'
                + '<div class="st-chatu8-preset-box-group">'
                + '<span class="st-chatu8-preset-box-group-label">分类</span>'
                + '<div class="st-chatu8-preset-box-grid">'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('IpNew') + ' title="新建一个分类"><i class="fa-solid fa-plus"></i><span>新建分类</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('IpImport') + ' title="从 JSON 文件导入分类"><i class="fa-solid fa-file-import"></i><span>导入分类</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('IpExport') + ' title="把当前这个分类的条目导成 JSON"><i class="fa-solid fa-file-export"></i><span>导出分类</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('IpRename') + ' title="改当前分类的名字"><i class="fa-solid fa-pen"></i><span>改分类名</span></button>'
                + '</div></div>'
                + '<div class="st-chatu8-preset-box-group">'
                + '<span class="st-chatu8-preset-box-group-label">库</span>'
                + '<div class="st-chatu8-preset-box-grid">'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('Import') + ' title="导入一份同人库 JSON（同格式即可）"><i class="fa-solid fa-file-import"></i><span>导入</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('Export') + ' title="把当前这份库导成 JSON"><i class="fa-solid fa-file-export"></i><span>导出</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('Add') + ' title="自己加一条"><i class="fa-solid fa-plus"></i><span>新增条目</span></button>'
                + '</div></div>'
                + '<div class="st-chatu8-preset-box-group">'
                + '<span class="st-chatu8-preset-box-group-label">内置库</span>'
                + '<div class="st-chatu8-preset-box-grid">'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('BuiltinImport') + ' title="导入一份 JSON 当新的内置库（存在浏览器本地，替换插件自带的那份）"><i class="fa-solid fa-file-arrow-up"></i><span>导入内置库</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('BuiltinExport') + ' title="把当前生效的内置库导成 JSON"><i class="fa-solid fa-file-arrow-down"></i><span>导出内置库</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item danger" ' + d('BuiltinDelete') + ' title="删掉你导入的内置库，回到插件自带的那份"><i class="fa-solid fa-trash"></i><span>删除内置库</span></button>'
                + '</div></div>'
                + '<div class="st-chatu8-preset-box-group">'
                + '<span class="st-chatu8-preset-box-group-label">维护</span>'
                + '<div class="st-chatu8-preset-box-grid">'
                + '<button type="button" class="st-chatu8-preset-box-item" ' + d('Reload') + ' title="按下面选的来源重新载入内置库，并把删掉的 / 改过的 / 自己新增的条目全部还原"><i class="fa-solid fa-rotate"></i><span>重载内置库</span></button>'
                + '</div>'
                + '<div class="st-chatu8-field-col" style="margin-top:8px">'
                + '<label>内置库来源</label>'
                + '<select class="st-chatu8-select" ' + d('BuiltinSrc') + '>'
                + '<option value="zip">插件自带（分类条目包）</option>'
                + '<option value="custom">我导入的内置库</option>'
                + '</select>'
                + '<div class="dna-hint" ' + d('BuiltinSrcHint') + '>点「重载内置库」才会按这里选的来源重新载入。</div>'
                + '</div></div>'
                + '<div class="st-chatu8-preset-box-group">'
                + '<span class="st-chatu8-preset-box-group-label">危险操作</span>'
                + '<div class="st-chatu8-preset-box-grid">'
                + '<button type="button" class="st-chatu8-preset-box-item danger" ' + d('LibWipe') + ' title="把当前库的全部分类和条目一次清空（想找回来点「重载内置库」）"><i class="fa-solid fa-broom"></i><span>清空全部</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item danger" ' + d('IpClear') + ' title="把当前分类下的条目一次全部清空"><i class="fa-solid fa-trash-can"></i><span>清空条目</span></button>'
                + '<button type="button" class="st-chatu8-preset-box-item danger" ' + d('IpDelete') + ' title="连分类带条目一起删掉"><i class="fa-solid fa-folder-minus"></i><span>删除分类</span></button>'
                + '</div></div>'
                + '</div></div>'
                + '</div>'
                + '<input type="file" accept=".json,application/json" style="display:none" ' + d('IpFile') + '>'
                + '<input type="file" accept=".json,application/json" style="display:none" ' + d('BuiltinFile') + '>'
                + '</div>')
            : '')
        + '</div>'
        /* 分类翻页条：放在筛选区外面、单独占一整行，不和「分类」那行的下拉 / 分类操作按钮挤在一起 */
        + (C.ipFilter ? ('<div class="dna-pager-box" ' + d('IpPager') + '></div>') : '')
        + '<div class="dna-actions">'
        + '<button class="st-chatu8-btn" ' + d('SelAll') + '>全选搜索结果</button>'
        + '<button class="st-chatu8-btn" ' + d('SelNone') + '>取消全选</button>'
        + (C.ipFilter ? ('<button class="st-chatu8-btn" ' + d('IpAddEntry') + ' title="往当前分类里加一条角色"><i class="fa-solid fa-user-plus"></i> 加条目</button>') : '')
        + (!C.ipFilter ? ('<button class="st-chatu8-btn" ' + d('Reload') + '><i class="fa-solid fa-rotate"></i>' + C.reloadLabel + '</button>') : '')
        + '</div>'
        + '<div class="dna-list" ' + d('List') + '></div>'
        + '<div class="dna-pager-box" ' + d('Pager') + '></div>'
        + '<div class="st-chatu8-field-col"><label>额外要求（可留空）</label>'
        + '<textarea class="st-chatu8-textarea" ' + d('Req') + ' rows="3" placeholder="' + C.reqPh + '"></textarea></div>'
        + '<div class="dna-actions">'
        + '<button class="st-chatu8-btn" ' + d('Run') + '><i class="fa-solid fa-wand-magic-sparkles"></i>生成 DNA</button>'
        + '<button class="st-chatu8-btn dna-btn-abort" ' + d('Abort') + ' disabled><i class="fa-solid fa-stop"></i>中断请求</button>'
        + '</div>'
        + '<div class="dna-kv" ' + d('Info') + '></div>'
        + '<input type="file" accept=".json,application/json" ' + d('File') + ' style="display:none">'
        + '</div>';
    const test = '<div class="st-chatu8-settings-section">'
        + '<h3><i class="fa-solid fa-flask"></i> 测试工具</h3>'
        + '<div class="dna-actions">'
        + '<button class="st-chatu8-btn" ' + d('TestPreview') + '><i class="fa-solid fa-eye"></i>① 只组装（不请求）</button>'
        + '<button class="st-chatu8-btn" ' + d('TestLLM') + '><i class="fa-solid fa-paper-plane"></i>② 组装 + 发测试请求</button>'
        + '<button class="st-chatu8-btn" ' + d('TestClear') + '>清空</button>'
        + '</div>'
        + '<div class="st-chatu8-field-col"><label>要发出去的 messages</label>'
        + '<textarea class="st-chatu8-textarea dna-mono" ' + d('TestPrompt') + ' rows="10" readonly></textarea></div>'
        + '<div class="st-chatu8-field-col"><label>AI 回复</label>'
        + '<textarea class="st-chatu8-textarea dna-mono" ' + d('TestResult') + ' rows="8" readonly></textarea></div>'
        + '</div>';
    /* 同人资料库页里额外挂一块「世界书生成」：读当前角色卡的世界书，搜索 / 编辑条目 / 勾选生成 */
    const w = (n) => 'data-dna="ranobewb' + n + '"';
    const foldWb = tag + 'Wbgen';
    const wbgen = C.wbGen ? ('<div class="st-chatu8-settings-section dna-fold" data-fold="' + foldWb + '">'
        + '<div class="dna-sec-head dna-fold-head"><h3><i class="fa-solid fa-book-open"></i> 世界书生成 <span class="dna-count" ' + w('Count') + '>0</span></h3>'
        + '<div class="dna-sec-actions">'
        + '<button class="st-chatu8-btn" ' + w('Reload') + '><i class="fa-solid fa-rotate"></i>重新读取世界书</button>'
        + '<button type="button" class="dna-fold-btn" data-fold-btn="' + foldWb + '" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>'
        + '</div></div>'
        + '<div class="dna-status-row"><span class="dna-badge" ' + w('Source') + '>—</span></div>'
        + '<div class="dna-hint dna-hint-inline">读的是当前角色卡的世界书。'
        + '点条目右边的「编辑」可以改标题 / 关键词 / 正文，改动只保存在插件里，不会改动世界书文件。</div>'
        + '<div class="st-chatu8-field"><label>搜索条目</label>'
        + '<input type="text" class="st-chatu8-text-input" ' + w('Search') + ' placeholder="条目标题 / 关键词 / 内容"></div>'
        + '<div class="dna-actions">'
        + '<button class="st-chatu8-btn" ' + w('SelAll') + '>全选搜索结果</button>'
        + '<button class="st-chatu8-btn" ' + w('SelNone') + '>取消全选</button>'
        + '</div>'
        + '<div class="dna-list" ' + w('List') + '></div>'
        + '<div class="dna-pager-box" ' + w('Pager') + '></div>'
        + '<div class="st-chatu8-field-col"><label>额外要求（可留空）</label>'
        + '<textarea class="st-chatu8-textarea" ' + w('Req') + ' rows="3" placeholder="例如：这次只写新出场的角色"></textarea></div>'
        + '<div class="dna-actions">'
        + '<button class="st-chatu8-btn" ' + w('Run') + '><i class="fa-solid fa-wand-magic-sparkles"></i>按所选世界书条目生成 DNA</button>'
        + '<button class="st-chatu8-btn dna-btn-abort" ' + w('Abort') + ' disabled><i class="fa-solid fa-stop"></i>中断请求</button>'
        + '</div>'
        + '<div class="dna-kv" ' + w('Info') + '></div>'
        + '</div>') : '';
    /* 同人资料库页：AI 回复下面按顺序先放 LLM 配置、上下文预设（与手动生成同一套 UI） */
    const cards = C.profileCards ? (profileCardHtml(tag) + '\n' + presetCardHtml(tag, { boxTitle: '同人库预设操作' })) : '';
    return '<div class="dna-panel" data-dna-panel="' + tag + '">' + reply + cards + head + wbgen + test + '</div>';
}

const PANEL_HTML = `
<div id="dna-tab" class="dna-wrap">

  <!-- 状态条 -->
  <div class="st-chatu8-settings-section dna-status-section">
    <div class="dna-sec-head">
      <h3><i class="fa-solid fa-dna"></i> 档案库</h3>
      <div class="dna-sec-actions">
        <button class="st-chatu8-btn" data-dna="scanNow"><i class="fa-solid fa-bolt"></i><span data-dna="scanLabel">立即记录</span></button>
        <button class="st-chatu8-btn dna-btn-abort" data-dna="abortScan" disabled><i class="fa-solid fa-stop"></i>中断请求</button>
        <a class="st-chatu8-btn dna-help-btn" data-dna="helpLink"
           href="https://docs.qq.com/doc/DZnF6Z2d3b0xBVVNP"
           target="_blank" rel="noopener noreferrer"
           title="打开档案库使用说明"><i class="fa-solid fa-book-open"></i>使用说明</a>
      </div>
    </div>
    <div class="dna-status-row">
      <span class="dna-dot"></span>
      <span data-dna="status">空闲</span>
      <span class="dna-sep">·</span>
      <span data-dna="autoState">自动记录已开启</span>
    </div>
  </div>

  <!-- 子板块 -->
  <div class="st-chatu8-sub-nav dna-sub-nav" data-dna="subtabs">
    <a href="#" class="st-chatu8-sub-nav-link active" data-dna-tab="arch"><i class="fa-solid fa-box-archive"></i> 档案库</a>
    <a href="#" class="st-chatu8-sub-nav-link" data-dna-tab="auto"><i class="fa-solid fa-robot"></i> 自动生成</a>
    <a href="#" class="st-chatu8-sub-nav-link" data-dna-tab="gen"><i class="fa-solid fa-wand-magic-sparkles"></i> 手动生成</a>
    <a href="#" class="st-chatu8-sub-nav-link" data-dna-tab="ranobe"><i class="fa-solid fa-users-viewfinder"></i> 同人资料库</a>
    <a href="#" class="st-chatu8-sub-nav-link" data-dna-tab="photo"><i class="fa-solid fa-camera-retro"></i> 角色照片</a>
    <a href="#" class="st-chatu8-sub-nav-link" data-dna-tab="tools"><i class="fa-solid fa-paper-plane"></i> 发送 &amp; 日志</a>
    <a href="#" class="st-chatu8-sub-nav-link" data-dna-tab="settings"><i class="fa-solid fa-sliders"></i> 设置</a>
  </div>

  <!-- ============ 档案库：只管存角色档案 ============ -->
  <div class="dna-panel active" data-dna-panel="arch">

    <div class="st-chatu8-settings-section">
      <div class="dna-sec-head">
        <h3><i class="fa-solid fa-box-archive"></i> 档案库 <span class="dna-count" data-dna="count">0</span></h3>
        <div class="dna-sec-actions">
          <button class="st-chatu8-btn" data-dna="lockAll" title="把本库所有档案锁上，AI 一条都改不了"><i class="fa-solid fa-lock"></i>全部锁定</button>
          <button class="st-chatu8-btn" data-dna="unlockAll" title="把本库所有锁解开"><i class="fa-solid fa-lock-open"></i>全部解锁</button>
          <button class="st-chatu8-btn" data-dna="export"><i class="fa-solid fa-file-export"></i>导出 JSON</button>
          <button class="st-chatu8-btn" data-dna="import"><i class="fa-solid fa-file-import"></i>导入 JSON</button>
          <button class="st-chatu8-btn danger" data-dna="clearAll"><i class="fa-solid fa-trash"></i>清空本库</button>
        </div>
      </div>
      <div class="dna-status-row">
        <span class="dna-badge" data-dna="cardLabel">—</span>
        <span class="dna-badge" data-dna="lockCount">未锁定</span>
      </div>
      <div class="st-chatu8-field">
        <label>搜索档案</label>
        <input type="text" class="st-chatu8-text-input" data-dna="search" placeholder="角色名 / 别称">
      </div>
      <div class="dna-split dna-split-solo">
        <div class="dna-list" data-dna="list"></div>
        <div class="dna-detail" data-dna="detail" style="display:none"></div>
      </div>
      <input type="file" accept=".json,application/json" data-dna="file" style="display:none">
    </div>

    <div class="st-chatu8-settings-section dna-fold" data-fold="archTpl">
      <div class="dna-fold-head">
        <h3><i class="fa-solid fa-clipboard-list"></i> 档案模板</h3>
        <button type="button" class="dna-fold-btn" data-fold-btn="archTpl" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>
      </div>
      
      <div class="st-chatu8-field">
        <label>当前模板（只对这张角色卡生效）</label>
        <div class="dna-tpl-row">
          <select class="st-chatu8-select" data-dna="tplSelect"></select>
          <button type="button" class="st-chatu8-btn dna-tpl-lock" data-dna="tplLock" title="锁定：这张角色卡就固定用这份模板，随时可以再点开解锁"><i class="fa-solid fa-lock-open"></i><span>锁定</span></button>
        </div>
      </div>
      <div class="dna-status-row">
        <span class="dna-badge" data-dna="tplBadge">默认模板</span>
        
      </div>
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="tplNew"><i class="fa-solid fa-plus"></i>新建模板</button>
        <button class="st-chatu8-btn" data-dna="tplEdit"><i class="fa-solid fa-pen-to-square"></i>编辑模板</button>
        <button class="st-chatu8-btn" data-dna="tplExport"><i class="fa-solid fa-file-export"></i>导出模板</button>
        <button class="st-chatu8-btn" data-dna="tplImport"><i class="fa-solid fa-file-import"></i>导入模板</button>
        <button class="st-chatu8-btn" data-dna="tplDelete"><i class="fa-solid fa-trash"></i>删除这个模板</button>
        <button class="st-chatu8-btn" data-dna="tplReset"><i class="fa-solid fa-rotate-left"></i>恢复默认模板</button>
      </div>
      <div class="st-chatu8-field-col">
        <label>发送给 AI 的字段 <span class="dna-count" data-dna="sendFieldsCount">0 / 0</span></label>
        <div class="dna-sendfields" data-dna="sendFields"></div>
        <div class="dna-hint">勾上的才会跟着<b>「发送数据」</b>一起发出去。不勾的字段档案里照样留着，编辑器里照样能改，自动记录也照旧读全部字段。姓名不勾也没关系——档案块的标题本来就写着名字。</div>
      </div>
      <div class="st-chatu8-field-col">
        <label>当前模板内容（只读，点「编辑模板」改）</label>
        <textarea class="st-chatu8-textarea dna-mono" data-dna="tplPreview" rows="7" readonly></textarea>
      </div>
      <input type="file" accept=".json,application/json" data-dna="tplFile" style="display:none">
      
      
    </div>

    <div class="st-chatu8-settings-section dna-fold" data-fold="archBan">
      <div class="dna-fold-head">
        <h3><i class="fa-solid fa-ban"></i> 别称禁词 <span class="dna-count" data-dna="banCount">0</span></h3>
        <button type="button" class="dna-fold-btn" data-fold-btn="archBan" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>
      </div>
      <div class="dna-hint">这里列出的词<b>不会被录成别称</b>：它们说的是关系或职业（妈妈、老板、店长…），谁都能用，正文里一出现就会同时点亮好几个人。误杀的词点它右边的 × 删掉就行。</div>
      <div class="dna-ban-chips" data-dna="banChips"></div>
      <div class="dna-ban-add">
        <input type="text" class="st-chatu8-text-input" data-dna="banInput" placeholder="要禁的词，可用顿号或逗号一次加多个">
        <button class="st-chatu8-btn" data-dna="banAdd"><i class="fa-solid fa-plus"></i>添加</button>
      </div>
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="banEdit"><i class="fa-solid fa-pen-to-square"></i>编辑整份</button>
        <button class="st-chatu8-btn" data-dna="banExport"><i class="fa-solid fa-file-export"></i>导出禁词</button>
        <button class="st-chatu8-btn" data-dna="banImport"><i class="fa-solid fa-file-import"></i>导入禁词</button>
      </div>
      <input type="file" accept=".json,.txt,text/plain,application/json" data-dna="banFile" style="display:none">
    </div>
  </div>

  <!-- ============ 自动生成 ============ -->
  <div class="dna-panel" data-dna-panel="auto">

    <div class="st-chatu8-settings-section dna-fold" data-fold="libAI">
      <div class="dna-fold-head">
        <h3><i class="fa-solid fa-comment-dots"></i> AI 回复（实时）</h3>
        <button type="button" class="dna-fold-btn" data-fold-btn="libAI" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>
      </div>
      
      <div class="dna-status-row">
        <span class="dna-badge" data-dna="aiReplyLibState">待命</span>
        
      </div>
      <div class="st-chatu8-field-col">
        <textarea class="st-chatu8-textarea dna-mono" data-dna="aiReplyLib" rows="10" readonly placeholder="还没有内容。跑一次自动记录 / 手动生成，AI 正在写什么、写了多少，都会实时出现在这里。"></textarea>
        <div class="dna-hint dna-hint-inline"><button class="st-chatu8-btn dna-btn-sm" data-dna="aiReplyLibCopy"><i class="fa-regular fa-copy"></i>复制</button><button class="st-chatu8-btn dna-btn-sm" data-dna="aiReplyLibClear">清空</button></div>
      </div>
    </div>

    <div class="st-chatu8-settings-section dna-fold" data-fold="libLLM">
      <div class="dna-fold-head">
        <h3><i class="fa-solid fa-microchip"></i> LLM 配置</h3>
        <button type="button" class="dna-fold-btn" data-fold-btn="libLLM" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>
      </div>
      
      <div class="st-chatu8-field">
        <label>使用哪份配置</label>
        <select class="st-chatu8-select" data-dna="profileSelect"></select>
      </div>
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="gotoLLM"><i class="fa-solid fa-arrow-right-to-bracket"></i>去 LLM 页签编辑</button>
      </div>
      <div class="dna-kv" data-dna="configDetail"></div>
      
    </div>

    <div class="st-chatu8-settings-section dna-fold" data-fold="libPreset">
      <div class="dna-fold-head">
        <h3><i class="fa-solid fa-layer-group"></i> 上下文预设</h3>
        <div class="dna-sec-actions">
          <button type="button" class="dna-fold-btn" data-fold-btn="libPreset" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>
        </div>
      </div>
      
      <div class="dna-status-row">
        <span class="dna-badge" data-dna="presetLabel">未导入</span>
        
      </div>
      <div class="st-chatu8-field">
        <label>用这份预设组装提示词</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="presetEnabled"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>把 system 消息合并到开头一条</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="presetMergeSystem"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>当前预设</label>
        <div class="st-chatu8-profile-controls">
          <select class="st-chatu8-select" data-dna="presetSelect"></select>
          <div class="st-chatu8-preset-box-wrapper">
            <button type="button" class="st-chatu8-icon-btn st-chatu8-preset-box-btn" title="预设操作收纳盒"><i class="fa-solid fa-table-cells"></i></button>
            <div class="st-chatu8-preset-box-dropdown">
              <div class="st-chatu8-preset-box-header">
                <span class="st-chatu8-preset-box-title"><i class="fa-solid fa-box-archive"></i> 档案库预设操作</span>
                <button type="button" class="st-chatu8-preset-box-close" title="关闭">&times;</button>
              </div>
              <div class="st-chatu8-preset-box-group">
                <span class="st-chatu8-preset-box-group-label">导入与导出</span>
                <div class="st-chatu8-preset-box-grid">
                  <button type="button" class="st-chatu8-preset-box-item" data-dna="presetSave" title="把当前这份预设存下来（顺带同步到智绘姬 LLM 页签的那份副本）"><i class="fa-solid fa-floppy-disk"></i><span>保存</span></button>
                  <button type="button" class="st-chatu8-preset-box-item" data-dna="presetImport" title="导入预设文件"><i class="fa-solid fa-file-import"></i><span>导入</span></button>
                  <button type="button" class="st-chatu8-preset-box-item" data-dna="presetExport" title="导出当前预设"><i class="fa-solid fa-file-export"></i><span>导出</span></button>
                </div>
              </div>
              <div class="st-chatu8-preset-box-group">
                <span class="st-chatu8-preset-box-group-label">管理</span>
                <div class="st-chatu8-preset-box-grid">
                  <button type="button" class="st-chatu8-preset-box-item" data-dna="presetRename" title="重命名预设"><i class="fa-solid fa-pen"></i><span>改名</span></button>
                  <button type="button" class="st-chatu8-preset-box-item" data-dna="presetReseed" title="把内置预设刷新成插件里的最新版本（自己导入 / 新建的预设不受影响）"><i class="fa-solid fa-rotate"></i><span>更新内置</span></button>
                </div>
              </div>
              <div class="st-chatu8-preset-box-group">
                <span class="st-chatu8-preset-box-group-label">危险操作</span>
                <div class="st-chatu8-preset-box-grid">
                  <button type="button" class="st-chatu8-preset-box-item danger" data-dna="presetRemove" title="删除预设"><i class="fa-solid fa-trash"></i><span>删除</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <input type="file" accept=".json,application/json" data-dna="presetFile" style="display:none">
      <div class="dna-kv" data-dna="presetInfo"></div>

      <div class="dna-entry-head">
        <span class="dna-entry-head-t">预设条目 <span class="dna-count" data-dna="presetEntryCount">0 / 0</span></span>
        <span class="dna-entry-tools">
          <button class="st-chatu8-btn dna-btn-sm" data-dna="presetAllOn">全开</button>
          <button class="st-chatu8-btn dna-btn-sm" data-dna="presetAllOff">全关</button>
        </span>
      </div>
      <div class="dna-entries" data-dna="presetEntries"></div>

    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-scissors"></i> 正则 &amp; 测试工具</h3>
      
      <div class="dna-kv" data-dna="regexInfo"></div>
      <div class="st-chatu8-field-col">
        <label>原始正文（粘一段想试的文本，留空则取最近 N 层 AI 回复）</label>
        <textarea class="st-chatu8-textarea" data-dna="testInput" rows="4" placeholder="留空 = 用最近 N 层 AI 回复的正文（不含玩家输入）"></textarea>
      </div>
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="testRegex"><i class="fa-solid fa-scissors"></i>① 只跑正则</button>
        <button class="st-chatu8-btn" data-dna="testAssemble"><i class="fa-solid fa-eye"></i>只组装（不请求）</button>
        <button class="st-chatu8-btn" data-dna="testLLM"><i class="fa-solid fa-paper-plane"></i>② 跑正则 + 发测试请求</button>
        <button class="st-chatu8-btn" data-dna="clearTest">清空</button>
      </div>
      <div class="st-chatu8-field-col">
        <label>正则后正文（这就是要发给 AI 的东西）</label>
        <textarea class="st-chatu8-textarea dna-mono" data-dna="testCleaned" rows="5" readonly></textarea>
      </div>
      <div class="st-chatu8-field-col">
        <label>组合提示词（真正发出去的 messages + tools）</label>
        <textarea class="st-chatu8-textarea dna-mono" data-dna="testPrompt" rows="5" readonly></textarea>
      </div>
      <div class="st-chatu8-field-col">
        <label>AI 回复</label>
        <textarea class="st-chatu8-textarea dna-mono" data-dna="testResult" rows="6" readonly></textarea>
      </div>
      
    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-clock-rotate-left"></i> 扫描与记录节奏</h3>
      
      <div class="st-chatu8-field">
        <label>每次扫描最近 N 层 AI 回复</label>
        <input type="number" min="1" max="300" class="st-chatu8-text-input" data-dna="scanDepth">
      </div>
      <div class="st-chatu8-field">
        <label>自动记录间隔（每 N 层）</label>
        <input type="number" min="1" max="50" class="st-chatu8-text-input" data-dna="autoEvery">
      </div>
      <div class="st-chatu8-field">
        <label>最新一层正文至少 N 字才记录（0 = 不限）</label>
        <input type="number" min="0" max="100000" step="100" class="st-chatu8-text-input" data-dna="autoMinChars">
      </div>
    </div>
  </div>

  <!-- ============ 手动生成 ============ -->
  <div class="dna-panel" data-dna-panel="gen">

    <div class="st-chatu8-settings-section dna-fold" data-fold="genAI">
      <div class="dna-fold-head">
        <h3><i class="fa-solid fa-comment-dots"></i> AI 回复（实时）</h3>
        <button type="button" class="dna-fold-btn" data-fold-btn="genAI" title="收起 / 展开这块"><i class="fa-solid fa-chevron-up"></i></button>
      </div>
      
      <div class="dna-status-row">
        <span class="dna-badge" data-dna="aiReplyGenState">待命</span>
        
      </div>
      <div class="st-chatu8-field-col">
        <textarea class="st-chatu8-textarea dna-mono" data-dna="aiReplyGen" rows="10" readonly placeholder="还没有内容。点一次「按…生成 DNA」，AI 正在写什么、写了多少，都会实时出现在这里。"></textarea>
        <div class="dna-hint dna-hint-inline"><button class="st-chatu8-btn dna-btn-sm" data-dna="aiReplyGenCopy"><i class="fa-regular fa-copy"></i>复制</button><button class="st-chatu8-btn dna-btn-sm" data-dna="aiReplyGenClear">清空</button></div>
      </div>
    </div>

    ${profileCardHtml('gen')}

    ${presetCardHtml('gen', { boxTitle: '手动生成预设操作' })}

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-book-open"></i> ① 按世界书条目生成</h3>
      <div class="st-chatu8-field">
        <label>世界书来源</label>
        <select class="st-chatu8-select" data-dna="genSource">
          <option value="st">酒馆世界书（书 + 条目）</option>
          <option value="chatu8">智绘姬世界书（条目列表）</option>
        </select>
      </div>
      <div class="st-chatu8-field" data-dna="genBookToolsRow">
        <label>跟随角色卡的主世界书</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="genBookFollowCard"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="dna-inline-row" data-dna="genBookRow">
        <select class="st-chatu8-select" data-dna="genBook"></select>
        <button class="st-chatu8-btn" data-dna="genReload"><i class="fa-solid fa-rotate"></i>重新读取</button>
      </div>
      
      <div class="dna-fold" data-fold="genEntryPick">
        <div class="dna-entry-head dna-fold-head">
          <span class="dna-entry-head-t">世界书条目 <span class="dna-count" data-dna="genEntryCount">0 / 0</span></span>
          <span class="dna-entry-tools">
            <button type="button" class="dna-fold-btn" data-fold-btn="genEntryPick" title="收起 / 展开条目列表"><i class="fa-solid fa-chevron-up"></i></button>
            <input type="text" class="st-chatu8-text-input dna-search" data-dna="genEntrySearch" placeholder="搜条目…">
            <button class="st-chatu8-btn dna-btn-sm" data-dna="genEntryAll">全选</button>
            <button class="st-chatu8-btn dna-btn-sm" data-dna="genEntryNone">全不选</button>
          </span>
        </div>
        <div class="dna-entries" data-dna="genEntryList"></div>
      </div>
      
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="genRunWorld"><i class="fa-solid fa-wand-magic-sparkles"></i>按世界书生成 DNA</button>
        <button class="st-chatu8-btn dna-btn-abort" data-dna="genAbortWorld" disabled><i class="fa-solid fa-stop"></i>中断请求</button>
      </div>
    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-user-pen"></i> ② 按角色生成</h3>
      <div class="dna-entry-head">
        <span class="dna-entry-head-t">角色（智绘姬「角色管理」）<span class="dna-count" data-dna="genCharCount">0 / 0</span></span>
        <span class="dna-entry-tools">
          <input type="text" class="st-chatu8-text-input dna-search" data-dna="genCharSearch" placeholder="搜角色…">
          <button class="st-chatu8-btn dna-btn-sm" data-dna="genCharAll">全选</button>
          <button class="st-chatu8-btn dna-btn-sm" data-dna="genCharNone">全不选</button>
        </span>
      </div>
      <div class="dna-entries dna-entries-sm" data-dna="genCharList"></div>
      <div class="dna-inline-row">
        <input type="text" class="st-chatu8-text-input" data-dna="genExtraName" placeholder="角色管理里没有的角色，可以在这里手动加名字">
        <button class="st-chatu8-btn" data-dna="genExtraAdd"><i class="fa-solid fa-plus"></i>加入</button>
      </div>
      <div class="dna-chips" data-dna="genExtraList"></div>
      
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="genRunChars"><i class="fa-solid fa-wand-magic-sparkles"></i>按角色生成 DNA</button>
        <button class="st-chatu8-btn dna-btn-abort" data-dna="genAbortChars" disabled><i class="fa-solid fa-stop"></i>中断请求</button>
      </div>
    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-layer-group"></i> 组合生成（世界书 + 角色 + 服装）</h3>
      <div class="dna-entry-head">
        <span class="dna-entry-head-t">③ 服装（智绘姬「服装」）<span class="dna-count" data-dna="genOutfitCount">0 / 0</span></span>
        <span class="dna-entry-tools">
          <input type="text" class="st-chatu8-text-input dna-search" data-dna="genOutfitSearch" placeholder="搜服装…">
          <button class="st-chatu8-btn dna-btn-sm" data-dna="genOutfitAll">全选</button>
          <button class="st-chatu8-btn dna-btn-sm" data-dna="genOutfitNone">全不选</button>
        </span>
      </div>
      <div class="dna-entries dna-entries-sm" data-dna="genOutfitList"></div>
      
      
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="genRunMix"><i class="fa-solid fa-wand-magic-sparkles"></i>组合生成 DNA</button>
        <button class="st-chatu8-btn dna-btn-abort" data-dna="genAbortMix" disabled><i class="fa-solid fa-stop"></i>中断请求</button>
      </div>
    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-file-import"></i> ④ 按导入文本生成</h3>
      
      <div class="dna-actions">
        <input type="file" accept=".txt,text/plain" data-dna="genTxtFile" style="display:none">
        <button class="st-chatu8-btn" data-dna="genTxtPick"><i class="fa-solid fa-folder-open"></i>选择 txt 文件</button>
        <button class="st-chatu8-btn" data-dna="genTxtClearFile"><i class="fa-solid fa-xmark"></i>移除</button>
      </div>
      
      <div class="st-chatu8-field-col">
        <label>文本内容（导入后可以在这里改，改完直接按改过的生成）</label>
        <textarea class="st-chatu8-textarea dna-mono" data-dna="genTxtContent" rows="10" placeholder="点「选择 txt 文件」导入；也可以直接把内容粘到这里。"></textarea>
      </div>
      
      <div class="st-chatu8-field">
        <label>分段生成tokens上限（0 = 不分段）</label>
        <input type="number" min="0" max="200000" step="500" class="st-chatu8-text-input" data-dna="genTxtChunk">
      </div>
      
      <div class="dna-inline-row">
        <select class="st-chatu8-select" data-dna="genTxtPart"></select>
        <button class="st-chatu8-btn" data-dna="genTxtResplit"><i class="fa-solid fa-scissors"></i>重新分段</button>
      </div>
      
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="genRunText"><i class="fa-solid fa-wand-magic-sparkles"></i>按文本生成 DNA</button>
        <button class="st-chatu8-btn dna-btn-abort" data-dna="genAbortText" disabled><i class="fa-solid fa-stop"></i>中断请求</button>
      </div>
    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-comment-dots"></i> 额外要求</h3>
      <div class="st-chatu8-field-col">
        <label>额外要求（两条线共用，可留空）</label>
        <textarea class="st-chatu8-textarea" data-dna="genInstruction" rows="3" placeholder="例如：只写主要角色，配角不要；或者重点写服装"></textarea>
      </div>
      <div class="dna-actions">
        <button class="st-chatu8-btn danger" data-dna="genClear">清空全部选择</button>
      </div>
      <div class="dna-kv" data-dna="genInfo"></div>
    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-flask"></i> 测试工具</h3>
      
      <div class="st-chatu8-field">
        <label>测试哪条线</label>
        <select class="st-chatu8-select" data-dna="genTestMode">
          <option value="world">① 按世界书条目生成</option>
          <option value="chars">② 按角色生成</option>
          <option value="text">④ 按导入文本生成</option>
          <option value="mix">组合生成（世界书 + 角色 + 服装）</option>
        </select>
      </div>
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="genTestPreview"><i class="fa-solid fa-eye"></i>① 只组装（不请求）</button>
        <button class="st-chatu8-btn" data-dna="genTestLLM"><i class="fa-solid fa-paper-plane"></i>② 组装 + 发测试请求</button>
        <button class="st-chatu8-btn" data-dna="genClearTest">清空</button>
      </div>
      <div class="st-chatu8-field-col">
        <label>组合提示词（真正发出去的 messages + tools）</label>
        <textarea class="st-chatu8-textarea dna-mono" data-dna="genTestPrompt" rows="8" readonly></textarea>
      </div>
      <div class="st-chatu8-field-col">
        <label>AI 回复</label>
        <textarea class="st-chatu8-textarea dna-mono" data-dna="genTestResult" rows="8" readonly></textarea>
      </div>
      
    </div>
  </div>

  ${libPanelHtml('ranobe', {
    title: '同人库',
    icon: 'fa-solid fa-users-viewfinder',
    searchPh: '名字 / 别名 / 作品 / 标签',
    ipFilter: true,
    reqPh: '例如：只写勾选到的人；出生地不写',
    wbGen: true,
    profileCards: true,
    resetTip: '清掉所有改动，回到插件自带的那份同人库',
    reloadLabel: '重新载入内置库'
  })}

  <!-- ============ 角色照片：拿档案里的角色生成图片 ============ -->
  <div class="dna-panel" data-dna-panel="photo">
    <div class="st-chatu8-settings-section">
      <div class="dna-sec-head">
        <h3><i class="fa-solid fa-camera-retro"></i> 角色照片 <span class="dna-count" data-dna="photoCount">0</span></h3>
      </div>
      <div class="st-chatu8-field">
        <label>选角色</label>
        <select class="st-chatu8-select" data-dna="photoChar"></select>
      </div>
      <div class="st-chatu8-field-col">
        <label>用档案里的哪些内容</label>
        <div class="dna-sendfields" data-dna="photoPick"></div>
      </div>
      <div class="st-chatu8-field-col">
        <label>生图提示词（可以自己改）</label>
        <textarea class="st-chatu8-textarea dna-mono" data-dna="photoPrompt" rows="5" placeholder="选一个角色，这里会自动填上他的外貌串 / 服装串"></textarea>
        <div class="dna-hint dna-hint-inline">
          <button class="st-chatu8-btn dna-btn-sm" data-dna="photoRefill"><i class="fa-solid fa-rotate"></i>按档案重新填写</button>
          <button class="st-chatu8-btn dna-btn-sm" data-dna="photoClear">清空</button>
        </div>
      </div>
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="photoGen"><i class="fa-solid fa-wand-magic-sparkles"></i>生成图片</button>
        <button class="st-chatu8-btn" data-dna="photoSave" disabled><i class="fa-solid fa-download"></i>保存这张</button>
      </div>
      <div class="dna-kv" data-dna="photoInfo">还没生成</div>
      <div class="dna-photo-wrap">
        <div class="dna-photo-empty" data-dna="photoEmpty"><i class="fa-solid fa-image"></i><span>还没有图片</span></div>
        <img data-dna="photoImg" alt="" style="display:none">
      </div>
    </div>
  </div>

  <!-- ============ 发送 & 日志 ============ -->
  <div class="dna-panel" data-dna-panel="tools">
    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-paper-plane"></i> 发送数据</h3>
      
      <div class="st-chatu8-field">
        <label>发送 DNA</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="sendEnabled"><span class="st-chatu8-slider"></span></div>
      </div>
      
    </div>

    <div class="st-chatu8-settings-section">
      <div class="dna-sec-head">
        <h3><i class="fa-solid fa-clipboard-list"></i> 日志</h3>
        <div class="dna-sec-actions">
          <button class="st-chatu8-btn" data-dna="clearLog"><i class="fa-solid fa-eraser"></i>清空日志</button>
        </div>
      </div>
      <div class="dna-log" data-dna="log"></div>
      <div class="dna-reqbreak" data-dna="reqBreak"></div>
    </div>
  </div>

  <!-- ============ 设置 ============ -->
  <div class="dna-panel" data-dna-panel="settings">
    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-gear"></i> 运行</h3>
      <div class="st-chatu8-field">
        <label>启用插件</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="enabled"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>自动记录</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="autoScan"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>档案跟随角色卡存档</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="followChar"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>AI自动更新档案库</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="updateExisting"><span class="st-chatu8-slider"></span></div>
      </div>
      
      <div class="st-chatu8-field">
        <label>完成后弹提示</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="notify"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>流式输出（实时显示 AI 写的字，只影响档案库）</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="libStream"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>AI 回复上限（token，0 = 不设上限）</label>
        <input type="number" min="0" max="200000" step="1000" class="st-chatu8-text-input" data-dna="replyMaxTokens">
      </div>
      
      <div class="st-chatu8-field">
        <label>自动重试次数（0 = 不重试）</label>
        <input type="number" min="0" max="5" step="1" class="st-chatu8-text-input" data-dna="retryCount">
      </div>
      
      <div class="st-chatu8-field">
        <label>正文先过智绘姬正则</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="useRegex"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>界面</label>
        <select class="st-chatu8-select" data-dna="uiMode"><option value="auto">自动检测</option><option value="desktop">一直用电脑版</option><option value="mobile">一直用手机版</option></select>
      </div>
      
    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-wrench"></i> Tool 与末尾消息</h3>
      
      <div class="st-chatu8-field">
        <label>启用自定义 Tool</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="breakTool"><span class="st-chatu8-slider"></span></div>
      </div>
      <div class="st-chatu8-field">
        <label>启用末尾多 Role 消息</label>
        <div class="st-chatu8-toggle"><input type="checkbox" data-dna="breakTail"><span class="st-chatu8-slider"></span></div>
      </div>
    </div>

    <div class="st-chatu8-settings-section">
      <h3><i class="fa-solid fa-floppy-disk"></i> 保存</h3>
      
      <div class="dna-actions">
        <button class="st-chatu8-btn" data-dna="saveAll"><i class="fa-solid fa-floppy-disk"></i>保存设置</button>
        
      </div>
    </div>
  </div>

</div>
`;

/* ============================ 手动生成：世界书 + 角色 → DNA ============================ */
/* 世界书支持两种来源：
   ① 酒馆世界书（书 → 条目），走 ST 自己的 /api/worldinfo/get，只读不改
   ② 智绘姬世界书（worldBookList，一条一段文本）                                    */

let genEntriesCache = [];   // 当前来源下能选的全部条目
let genCharsCache = [];     // 智绘姬「角色管理」里的角色预设
let genOutfitsCache = [];   // 智绘姬「服装」里的服装预设

/* 酒馆世界书名列表（只读，不动任何数据） */
async function stWorldNames() {
    /* 首选 ST 自己的世界书列表接口 */
    try {
        const res = await fetch('/api/worldinfo/list', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({}),
            cache: 'no-cache'
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) {
                const names = data.map((x) => String((x && (x.file_id || x.name)) || '').trim()).filter(Boolean);
                if (names.length) return names;
            }
        }
    } catch (e) { /* 落到下面的兜底 */ }
    /* 兜底：直接问 ST 的 world-info 模块 */
    try {
        const mod = await import('../../../../scripts/world-info.js');
        if (mod && Array.isArray(mod.world_names)) return mod.world_names.slice();
    } catch (e) { /* 老版本路径不同就算了，界面会提示换来源 */ }
    return [];
}

/* 读一本酒馆世界书的全部条目 */
async function stWorldEntries(book) {
    const res = await fetch('/api/worldinfo/get', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ name: book }),
        cache: 'no-cache'
    });
    if (!res.ok) throw new Error('读取世界书失败：HTTP ' + res.status);
    const data = await res.json();
    const entries = (data && data.entries) || {};
    return Object.keys(entries).map((uid) => {
        const e = entries[uid] || {};
        const keys = Array.isArray(e.key) ? e.key.join('、') : String(e.key || '');
        const title = String(e.comment || keys || ('条目 ' + uid)).trim() || ('条目 ' + uid);
        return {
            key: book + '::' + uid,
            title,
            keywords: keys,
            content: String(e.content || ''),
            disabled: !!e.disable
        };
    }).filter((e) => e.content.trim());
}

/* 智绘姬世界书：{ 条目名: { content } } */
function chatu8WorldEntries() {
    let ch = null;
    try { ch = extension_settings[CHATU8]; } catch (e) { ch = null; }
    const list = (ch && ch.worldBookList && typeof ch.worldBookList === 'object') ? ch.worldBookList : {};
    return Object.keys(list).map((name) => ({
        key: name,
        title: name,
        keywords: '',
        content: String((list[name] && list[name].content) || '')
    })).filter((e) => e.content.trim());
}

/* 智绘姬「角色管理」里的角色预设 */
function chatu8CharPresets() {
    let ch = null;
    try { ch = extension_settings[CHATU8]; } catch (e) { ch = null; }
    const p = (ch && ch.characterPresets && typeof ch.characterPresets === 'object') ? ch.characterPresets : {};
    return Object.keys(p).map((key) => {
        const v = (p[key] && typeof p[key] === 'object') ? p[key] : {};
        const nm = String(v.nameCN || v.nameEN || key).trim() || key;
        return { key, name: nm, preset: v };
    });
}

/* 智绘姬「服装」里的服装预设：{ 服装名: { nameCN, nameEN, owner, upperBody, ... } } */
function chatu8OutfitPresets() {
    let ch = null;
    try { ch = extension_settings[CHATU8]; } catch (e) { ch = null; }
    const p = (ch && ch.outfitPresets && typeof ch.outfitPresets === 'object') ? ch.outfitPresets : {};
    return Object.keys(p).map((key) => {
        const v = (p[key] && typeof p[key] === 'object') ? p[key] : {};
        const owner = String(v.owner || '').trim();
        return { key, name: key, owner, text: outfitText(key, v) };
    });
}

const OUTFIT_FIELD_LABELS = {
    upperBody: '上半身', upperBodyBack: '上半身（背面）',
    fullBody: '全身', fullBodyBack: '全身（背面）',
    photoPrompt: '照片提示词'
};

/* 一套服装压成一段给模型看的资料 */
function outfitText(name, v) {
    const val = (v && typeof v === 'object') ? v : {};
    const owner = String(val.owner || '').trim();
    const lines = ['—— 服装「' + String(name || '') + '」' + (owner ? ('（归属：' + owner + '）') : '（没写归属人）') + ' ——'];
    for (const k of Object.keys(OUTFIT_FIELD_LABELS)) {
        const t = String(val[k] || '').trim();
        if (t) lines.push(OUTFIT_FIELD_LABELS[k] + '：' + t);
    }
    const extra = [];
    if (String(val.nameCN || '').trim()) extra.push('中文名：' + String(val.nameCN).trim());
    if (String(val.nameEN || '').trim()) extra.push('英文名：' + String(val.nameEN).trim());
    if (lines.length === 1 && extra.length) lines.push(extra.join(' / '));
    return lines.join('\n');
}

/* 角色预设字段的中文名（不认识的字段就不带标签直接列） */
const CHAR_FIELD_LABELS = {
    nameCN: '中文名', nameEN: '英文名',
    characterTraits: '角色特征', facialFeatures: '五官特征', facialFeaturesBack: '五官特征（背面）',
    upperBodySFW: '上半身', upperBodySFWBack: '上半身（背面）',
    fullBodySFW: '全身', fullBodySFWBack: '全身（背面）',
    upperBodyNSFW: '上半身（露骨）', upperBodyNSFWBack: '上半身（露骨·背面）',
    fullBodyNSFW: '全身（露骨）', fullBodyNSFWBack: '全身（露骨·背面）',
    negative: '负面词'
};
const CHAR_FIELD_SKIP = /token|prompt|photo|audio|media|schema|preview|thumb|url|path/i;

/* 把一个角色预设压成一段给模型看的设定摘要 */
function charBrief(v) {
    const lines = [];
    for (const k of Object.keys(CHAR_FIELD_LABELS)) {
        const t = String(v[k] || '').trim();
        if (t && k !== 'nameCN' && k !== 'nameEN') lines.push(CHAR_FIELD_LABELS[k] + '：' + t);
    }
    /* 服装预设：结构不确定，能认出来就带上 */
    const outfits = v.outfits || v.outfitPresets || null;
    if (outfits && typeof outfits === 'object') {
        const names = Object.keys(outfits).filter((n) => {
            const o = outfits[n];
            return o && (typeof o === 'string' || (typeof o === 'object' && Object.keys(o).length));
        });
        if (names.length) lines.push('已有服装：' + names.join('、'));
    }
    return lines.join('\n');
}

/* 条目行统一外观（手动生成里的三个列表 + 同人资料库那两块列表共用）：
   第一行 = 开关 + 名称 + 右侧小字，第二行 = 预览 + 调用方交给它的按钮。
   整条高度钉死 76px、文字单行省略号，跟「上下文预设」里的条目是同一套排版。
   按钮完全由调用方决定：不给就没有——这里不会自己加任何按钮。 */
/* 勾选 / 取消之后按行就地挪位置：勾中的移到最上面，取消的按 data-ord 回到原位。
   只移动现有节点、不重建列表 —— 列表几百行也不卡，滚动位置也不会跳。 */
function onTopRows(box) {
    if (!box || !box.children) return;
    const rows = [];
    const others = [];
    for (let i = 0; i < box.children.length; i++) {
        const el = box.children[i];
        if (el && el.getAttribute && el.hasAttribute('data-ord')) rows.push(el);
        else others.push(el);
    }
    if (!rows.length) return;
    const sorted = rows.slice().sort((a, b) => {
        const oa = a.classList && a.classList.contains('is-on') ? 0 : 1;
        const ob = b.classList && b.classList.contains('is-on') ? 0 : 1;
        if (oa !== ob) return oa - ob;
        return (Number(a.getAttribute('data-ord')) || 0) - (Number(b.getAttribute('data-ord')) || 0);
    });
    let same = true;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i] !== sorted[i]) { same = false; break; }
    }
    if (same) return;
    const frag = document.createDocumentFragment();
    sorted.forEach((r) => frag.appendChild(r));
    others.forEach((r) => frag.appendChild(r));
    box.appendChild(frag);
}

/* 勾选的条目排到最上面。sort 是稳定排序，同一组里保持原本的顺序，
   所以取消勾选后它会自然回到原来的位置，不用记任何东西。
   只影响渲染，不动数据源（genEntriesCache / LIB_CACHE）。 */
function onFirst(list, isOn) {
    return list.slice().sort((a, b) => (isOn(b) ? 1 : 0) - (isOn(a) ? 1 : 0));
}

function dnaEntryRowHtml(o) {
    const ON = 'flex:0 0 auto';
    const LINE = 'display:flex;flex-direction:column;justify-content:center;gap:6px;height:76px;overflow:hidden;padding:6px 10px';
    const ROW = 'display:flex;align-items:center;gap:8px;min-width:0;width:100%';
    const NAME = 'flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
        'font-weight:500;font-size:0.9rem;line-height:1.2;opacity:' + (o.on ? '1' : '.45');
    const META = 'flex:0 1 auto;max-width:38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
        'font-size:0.75rem;color:var(--st-chatu8-text-secondary, inherit);opacity:.7';
    const PV = 'flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
        'font-size:0.82rem;color:var(--st-chatu8-text-secondary, inherit);opacity:' + (o.on ? '.85' : '.4');
    return '<div class="' + (o.boxClass || 'dna-entry-item') + (o.on ? ' is-on' : '') + '" style="padding:0"' + (o.boxAttr ? ' ' + o.boxAttr : '') + '>'
        + '<div class="dna-entry-line" style="' + LINE + '">'
        + '<div style="' + ROW + '">'
        + '<div class="st-chatu8-entry-toggle" style="' + ON + '" title="' + esc(o.toggleTitle || '选中 / 不选') + '">'
        + '<input type="checkbox"' + (o.on ? ' checked' : '') + (o.cbAttr ? ' ' + o.cbAttr : '') + '><span class="st-chatu8-slider"></span></div>'
        + (o.badge ? '<span class="st-chatu8-entry-role-badge" style="flex:0 0 auto;background-color:' +
            (o.badgeColor || '#3b82f6') + '33;color:' + (o.badgeColor || '#3b82f6') + '">' + esc(o.badge) + '</span>' : '')
        + '<span class="' + (o.nameClass || 'dna-entry-name') + '" style="' + NAME + '" title="' + esc(o.title || '') + '">'
        + o.nameHtml + '</span>'
        + (o.meta ? '<span style="' + META + '">' + o.meta + '</span>' : '')
        + '</div>'
        + '<div style="' + ROW + '">'
        + '<span class="' + (o.pvClass || 'st-chatu8-entry-preview') + '" style="' + PV + '" title="' + esc(o.pvTitle || '') + '">'
        + (o.previewHtml || '') + '</span>'
        + (o.buttons || '')
        + '</div>'
        + '</div>'
        + '</div>';
}

/* ---------- 渲染：条目列表 ---------- */
function renderGenEntries() {
    const box = document.querySelector('#dna-tab [data-dna="genEntryList"]');
    if (!box) return;
    const picked = new Set(S.genEntries || []);
    const sEl = document.querySelector('#dna-tab [data-dna="genEntrySearch"]');
    const q = String((sEl && sEl.value) || '').trim().toLowerCase();
    const list = onFirst(genEntriesCache.filter((e) => !q || (e.title + ' ' + e.keywords).toLowerCase().indexOf(q) >= 0),
        (e) => picked.has(e.key));
    if (!list.length) {
        box.innerHTML = '<div class="dna-entries-empty">' +
            (genEntriesCache.length ? '没有匹配的条目' : '这里没有可选的条目') + '</div>';
        renderGenInfo();
        return;
    }
    box.innerHTML = list.map((e, ord) => {
        const on = picked.has(e.key);
        return dnaEntryRowHtml({
            on,
            boxAttr: 'data-genentry="' + esc(e.key) + '" data-ord="' + ord + '"',
            badge: '世界书',
            badgeColor: '#a855f7',
            toggleTitle: '选中这条词条一起发给 AI',
            title: e.keywords || e.title,
            nameHtml: esc(e.title),
            meta: e.content.length + ' 字',
            pvTitle: e.keywords || '',
            previewHtml: esc(e.keywords || '（这条词条没有关键词）'),
            buttons: '<button type="button" class="dna-eye" data-genlook="' + esc(e.key) + '" title="看一眼这条的内容（可以改，也可以存回去）"><i class="fa-solid fa-eye"></i></button>'
        });
    }).join('');
    renderGenInfo();
}

/* ---------- 渲染：角色列表 ---------- */
function renderGenChars() {
    const box = document.querySelector('#dna-tab [data-dna="genCharList"]');
    if (!box) return;
    const picked = new Set(S.genChars || []);
    const sEl = document.querySelector('#dna-tab [data-dna="genCharSearch"]');
    const q = String((sEl && sEl.value) || '').trim().toLowerCase();
    const list = onFirst(genCharsCache.filter((c) => !q || (c.name + ' ' + c.key).toLowerCase().indexOf(q) >= 0),
        (c) => picked.has(c.key));
    if (!list.length) {
        box.innerHTML = '<div class="dna-entries-empty">' +
            (genCharsCache.length ? '没有匹配的角色' : '智绘姬「角色管理」里还没有角色预设') + '</div>';
        renderGenExtra();
        renderGenInfo();
        return;
    }
    box.innerHTML = list.map((c, ord) => {
        const on = picked.has(c.key);
        const brief = charBrief(c.preset);
        return dnaEntryRowHtml({
            on,
            boxAttr: 'data-genchar="' + esc(c.key) + '" data-ord="' + ord + '"',
            badge: '角色',
            badgeColor: '#3b82f6',
            toggleTitle: '选中这个角色一起发给 AI',
            title: brief.slice(0, 400),
            nameHtml: esc(c.name) + (c.key !== c.name ? '（' + esc(c.key) + '）' : ''),
            meta: brief.length ? (brief.length + ' 字设定') : '无设定',
            pvTitle: brief.slice(0, 400),
            previewHtml: esc(brief ? brief.replace(/\s+/g, ' ').slice(0, 200) : '（这个角色没有设定正文）')
        });
    }).join('');
    renderGenExtra();
    renderGenInfo();
}

/* ---------- 渲染：服装列表 ---------- */
function renderGenOutfits() {
    const box = document.querySelector('#dna-tab [data-dna="genOutfitList"]');
    if (!box) return;
    const picked = new Set(S.genOutfits || []);
    const sEl = document.querySelector('#dna-tab [data-dna="genOutfitSearch"]');
    const q = String((sEl && sEl.value) || '').trim().toLowerCase();
    const list = onFirst(genOutfitsCache.filter((o) => !q || (o.name + ' ' + o.owner).toLowerCase().indexOf(q) >= 0),
        (o) => picked.has(o.key));
    if (!list.length) {
        box.innerHTML = '<div class="dna-entries-empty">' +
            (genOutfitsCache.length ? '没有匹配的服装' : '智绘姬「服装」里还没有服装预设') + '</div>';
        renderGenInfo();
        return;
    }
    box.innerHTML = list.map((o, ord) => {
        const on = picked.has(o.key);
        return dnaEntryRowHtml({
            on,
            boxAttr: 'data-genoutfit="' + esc(o.key) + '" data-ord="' + ord + '"',
            badge: '服装',
            badgeColor: '#22c55e',
            toggleTitle: '选中这套服装一起发给 AI',
            title: o.text.slice(0, 400),
            nameHtml: esc(o.name) + (o.owner ? '（→ ' + esc(o.owner) + '）' : ''),
            meta: o.owner ? ('归属 ' + esc(o.owner)) : '没写归属',
            pvTitle: o.text.slice(0, 400),
            previewHtml: esc(String(o.text || '').replace(/\s+/g, ' ').slice(0, 200) || '（这套服装没有描述）')
        });
    }).join('');
    renderGenInfo();
}

function toggleGenOutfit(key, on) {
    const set = new Set(S.genOutfits || []);
    if (on) set.add(key); else set.delete(key);
    S.genOutfits = [...set];
    saveSettings(true);
    renderGenInfo();
}

function setAllGenOutfits(on) {
    const sEl = document.querySelector('#dna-tab [data-dna="genOutfitSearch"]');
    const q = String((sEl && sEl.value) || '').trim().toLowerCase();
    const list = genOutfitsCache.filter((o) => !q || (o.name + ' ' + o.owner).toLowerCase().indexOf(q) >= 0);
    const set = new Set(S.genOutfits || []);
    list.forEach((o) => { if (on) set.add(o.key); else set.delete(o.key); });
    S.genOutfits = [...set];
    saveSettings(true);
    renderGenOutfits();
}

/* ---------- 渲染：手动加的角色 ---------- */
function renderGenExtra() {
    const box = document.querySelector('#dna-tab [data-dna="genExtraList"]');
    if (!box) return;
    const list = S.genExtraChars || [];
    box.innerHTML = list.length
        ? list.map((n) => '<span class="dna-tag">' + esc(n) +
            '<button class="dna-tag-x" data-genextra="' + esc(n) + '" title="移除">×</button></span>').join('')
        : '';
}

/* ---------- 汇总：勾到了什么 ---------- */
function pickedGenEntries() {
    const picked = new Set(S.genEntries || []);
    return genEntriesCache.filter((e) => picked.has(e.key));
}

function pickedGenChars() {
    const picked = new Set(S.genChars || []);
    const out = genCharsCache.filter((c) => picked.has(c.key)).map((c) => ({ name: c.name, brief: charBrief(c.preset) }));
    for (const n of (S.genExtraChars || [])) {
        const nm = String(n || '').trim();
        if (!nm) continue;
        if (out.some((c) => c.name === nm)) continue;
        out.push({ name: nm, brief: '' });
    }
    return out;
}

function pickedGenOutfits() {
    const picked = new Set(S.genOutfits || []);
    return genOutfitsCache.filter((o) => picked.has(o.key));
}

function renderGenInfo() {
    const box = document.querySelector('#dna-tab [data-dna="genInfo"]');
    if (!box) return;
    const entries = pickedGenEntries();
    const chars = pickedGenChars();
    const outs = pickedGenOutfits();
    const oCnt = document.querySelector('#dna-tab [data-dna="genOutfitCount"]');
    if (oCnt) oCnt.textContent = outs.length + ' / ' + genOutfitsCache.length;
    const eCnt = document.querySelector('#dna-tab [data-dna="genEntryCount"]');
    if (eCnt) eCnt.textContent = entries.length + ' / ' + genEntriesCache.length;
    const cCnt = document.querySelector('#dna-tab [data-dna="genCharCount"]');
    if (cCnt) cCnt.textContent = chars.length + ' / ' + (genCharsCache.length + (S.genExtraChars || []).length);
    const chars2 = entries.reduce((n, e) => n + e.content.length, 0);
    const rows = [
        ['① 世界书', (S.genSource === 'chatu8' ? '智绘姬世界书' : ('酒馆世界书 · ' + (S.genBook || '未选')))
            + ' → ' + (entries.length ? ('已勾 ' + entries.length + ' 条 / ' + chars2 + ' 字') : '（还没勾）')],
        ['② 角色', chars.length ? ('已勾 ' + chars.length + ' 个：' + chars.map((c) => c.name).join('、')) : '（还没勾）'],
        ['③ 服装', outs.length ? ('已勾 ' + outs.length + ' 套：' + outs.map((o) => o.name + (o.owner ? '→' + o.owner : '')).join('、')) : '（还没勾）'],
        ['组装方式', (presetEnabledOf('gen') && presetEntries(undefined, 'gen').length) ? ('手动生成预设「' + activePresetName('gen') + '」') : '插件内置提示词'],
        ['LLM 配置', currentProfileName('gen') || '（没选）']
    ];
    if (chars2 > 40000) rows.push(['提醒', '世界书勾了 ' + chars2 + ' 字（超过 4 万），容易超出模型上下文，建议少勾几条']);
    /* 真正决定成败的是发出去的总量（含预设）。这里只做字符级粗估，不组装提示词，免得勾一下就卡。 */
    const presetTxt = (presetEnabledOf('gen') && presetEntries(undefined, 'gen').length)
        ? presetEntries(undefined, 'gen').map((e) => String(e.content || '')).join('\n') : '';
    const estTok = estimateTokens(presetTxt) + estimateTokens(entries.map((e) => e.content).join('\n')) + 2000;
    const txtLen = genTxtGet().length;
    if (txtLen) rows.push(['导入文本', (S.genTxtName || '(粘贴的内容)') + ' · ' + txtLen + ' 字']);
    rows.push(['请求规模', '约 ' + estTok + ' token（含预设）' + (estTok > 30000 ? ' · 偏大，可能超出模型上下文' : '')]);
    box.innerHTML = rows.map((r) =>
        '<div class="dna-kv-row"><span class="dna-kv-k">' + esc(r[0]) + '</span>' +
        '<span class="dna-kv-v">' + esc(String(r[1])) + '</span></div>'
    ).join('');
}

/* ---------- 导入的 txt ---------- */
/* 正文只放内存（几百 KB 塞 localStorage 会炸），持久化只存文件名。 */
let genTxtBody = '';

function genTxtGet() {
    const ta = document.querySelector('#dna-tab [data-dna="genTxtContent"]');
    if (ta && ta.value) return ta.value;
    return genTxtBody;
}

function genTxtHint(text) {
    const h = document.querySelector('#dna-tab [data-dna="genTxtHint"]');
    if (h) h.textContent = text || '';
}

function genTxtRefresh() {
    const body = genTxtGet();
    const name = S.genTxtName || '';
    if (!body) {
        genTxtHint(name ? ('文件「' + name + '」的内容是空的') : '还没导入文件。');
        return;
    }
    genTxtHint((name ? ('文件「' + name + '」· ') : '粘贴内容 · ') + body.length + ' 字'
        + (body.length > 100000 ? '（偏大，建议先删掉无关段落）' : ''));
}

/* 中文 txt 常见 UTF-8 和 GBK 两种，先按 UTF-8 解，出现大量乱码再退回 GBK */
async function readTxtFile(file) {
    const buf = await file.arrayBuffer();
    let txt = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    const bad = (txt.match(/\uFFFD/g) || []).length;
    if (bad > 3) {
        try {
            const alt = new TextDecoder('gbk', { fatal: false }).decode(buf);
            if ((alt.match(/\uFFFD/g) || []).length < bad) txt = alt;
        } catch (e) { /* 浏览器不支持 gbk 就用 utf-8 的结果 */ }
    }
    return txt.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

async function onGenTxtPick() {
    const inp = document.querySelector('#dna-tab [data-dna="genTxtFile"]');
    if (inp) inp.click();
}

async function onGenTxtFileChosen(file) {
    if (!file) return;
    try {
        const txt = await readTxtFile(file);
        genTxtBody = txt;
        S.genTxtName = file.name || 'text.txt';
        saveSettings(true);
        const ta = document.querySelector('#dna-tab [data-dna="genTxtContent"]');
        if (ta) ta.value = txt;
        genTxtRefresh();
        S.genTxtPart = 0;
        genTxtRefreshSeg();
        log('导入文本「' + S.genTxtName + '」：' + txt.length + ' 字');
        toast('已导入 ' + txt.length + ' 字');
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        genTxtHint('读取失败：' + msg);
        log('导入文本失败：' + msg, 'error');
    }
}

function onGenTxtClearFile() {
    genTxtBody = '';
    S.genTxtName = '';
    saveSettings(true);
    const ta = document.querySelector('#dna-tab [data-dna="genTxtContent"]');
    if (ta) ta.value = '';
    S.genTxtPart = 0;
    genTxtRefresh();
    genTxtRefreshSeg();
}

/* ---------- 组装「正文」：三条线各说各的 ---------- */
/* 'world' 只用世界书条目 / 'chars' 只用角色 / 'text' 只用导入的 txt /
   'mix' = 组合生成：世界书 / 角色 / 服装按勾选任意组合成一次请求
   （服装没有单独的 mode —— 它必须搭着世界书或角色一起走） */
const GEN_MODES = ['world', 'chars', 'text', 'mix'];
function genMode(mode) {
    const v = String(mode == null ? '' : mode);
    return GEN_MODES.indexOf(v) >= 0 ? v : 'world';
}

function buildGenText(mode, entries, chars, outs, txt) {
    const parts = [];
    const m = genMode(mode);
    const hasE = (m === 'world' || m === 'mix');
    const hasC = (m === 'chars' || m === 'mix');
    const hasO = (m === 'mix');
    if (m === 'text') {
        parts.push('【导入的文本资料】', String(txt || ''));
        parts.push('',
            '请从上面这份资料里，把出现的每一个具体人物各挑出来建一份 DNA 档案，一个都不许漏（泛称群体、地名、组织名不算人物）。',
            '资料里没写到的字段，按人物在文中表现出的气质和身份合理补全，不要留空、不要写“未知”。',
            '不要因为戏份少或只是提到一句就跳过某个具体人物，也不要额外编造资料里没有的人物。');
    } else {
        /* 三条线：勾了几条就拼几段，哪条没勾就整段不出现 */
        if (hasE && entries.length) {
            parts.push('【世界书资料】');
            for (const e of entries) parts.push('—— ' + e.title + ' ——\n' + e.content);
        }
        if (hasC && chars.length) {
            if (parts.length) parts.push('');
            parts.push('【要建档的角色】');
            for (const c of chars) parts.push('· ' + c.name + (c.brief ? '（设定见「角色卡设定」）' : '（没有设定，按名字和身份合理补全）'));
        }
        if (hasO && outs.length) {
            if (parts.length) parts.push('');
            parts.push('【服装资料】');
            for (const o of outs) parts.push(o.text);
        }
        parts.push('');
        if (m === 'chars' || (m === 'mix' && !entries.length && !outs.length)) {
            parts.push(
                '请为上面列出的每个角色各出一份 DNA 档案，依据「角色卡设定」里的资料写。',
                '设定里没写到的字段，按角色的气质和身份合理补全，不要留空、不要写“未知”。');
        } else if (m === 'mix') {
            parts.push(
                '请综合上面全部资料，为每一个出现的具体人物各出一份 DNA 档案，一个都不许漏（泛称群体、地名、组织名不算人物）。',
                '同一个人只出一份档案：世界书里的资料 + 角色卡设定 + 服装资料合并写，服装按「归属人」并进那个人的服装DNA。',
                '资料里没写到的字段，按世界观和人物气质合理补全，不要留空、不要写“未知”。',
                '不要额外编造资料里没有的人物——收录范围由用户勾选决定。');
        } else {
            parts.push(
                '请为上面这些条目里出现的每一个具体人物各出一份 DNA 档案，一个都不许漏（泛称群体、地名、组织名不算人物）。',
                '资料里没写到的字段，按这个世界观合理补全，不要留空、不要写“未知”。',
                '不要因为戏份少或只是配角就跳过某个具体人物，也不要额外编造条目里没有的人物——收录范围由用户勾选决定。');
        }
    }
    const extra = String(S.genInstruction || '').trim();
    if (extra) parts.push('', '【额外要求】', extra);
    return parts.join('\n');
}

/* mode: 'world' = 只用勾到的世界书条目；'chars' = 只用勾到的角色；'text' = 只用导入的 txt；
   'mix' = 组合生成（世界书 / 角色 / 服装按勾选组合） */
function buildGenPrompt(mode, txtOverride) {
    const m = genMode(mode);
    const entries = (m === 'world' || m === 'mix') ? pickedGenEntries() : [];
    const chars = (m === 'chars' || m === 'mix') ? pickedGenChars() : [];
    const outs = (m === 'mix') ? pickedGenOutfits() : [];
    /* txtOverride：分段生成时只喂这一段；不传就按当前选中的段（或不分段的全篇） */
    const txt = (m === 'text')
        ? (txtOverride === undefined ? genTxtSendText() : String(txtOverride || ''))
        : '';
    const text = buildGenText(m, entries, chars, outs, txt);
    const origins = chars.filter((c) => c.brief).map((c) => ({ name: c.name, content: c.brief }));
    /* 旧档案按本名从文本里找：导入的资料提到同一个角色也能命中已有档案 */
    const scanSrc = m === 'chars' ? chars.map((c) => c.name).join(' ') : (m === 'text' ? txt : text);
    const olds = S.updateExisting ? pickOldRecords(scanSrc, OLD_RECORD_BUDGET) : [];
    return { mode: m, entries, chars, outs, txt, text, origins, olds, prompt: buildRecordPrompt(text, { origins, olds }, 'gen') };
}

/* 这次到底喂了什么，写日志用 */
function genBrief(g) {
    const bits = [];
    if (g && g.entries && g.entries.length) {
        bits.push(g.entries.length + ' 条世界书条目 / ' + g.entries.reduce((n, e) => n + e.content.length, 0) + ' 字');
    }
    if (g && g.chars && g.chars.length) bits.push(g.chars.length + ' 个角色（' + g.chars.map((c) => c.name).join('、') + '）');
    if (g && g.outs && g.outs.length) bits.push(g.outs.length + ' 套服装（' + g.outs.map((o) => o.name + (o.owner ? '→' + o.owner : '')).join('、') + '）');
    if (g && String(g.txt || '').trim()) bits.push('导入文本 ' + String(g.txt || '').length + ' 字');
    return bits.join(' + ') || '（什么都没勾）';
}

/* ---------- 预览 ---------- */
const GEN_MODE_LABEL = { world: '按世界书生成', chars: '按角色生成', text: '按导入文本生成', mix: '组合生成' };

/* 组合生成合法性：返回空串＝能生成，否则是拦截原因。
   允许 ① / ② / ①+② / ①+③ / ②+③ / ①②③；只勾 ③ 服装不行（AI 不知道该把衣服记给谁）。 */
function mixBlockReason(g) {
    const e = (g && g.entries) ? g.entries.length : 0;
    const c = (g && g.chars) ? g.chars.length : 0;
    const o = (g && g.outs) ? g.outs.length : 0;
    if (!e && !c && !o) return '组合生成至少要勾一条线：① 世界书条目 或 ② 角色（服装得搭着它们走）。';
    if (o && !e && !c) return '③ 服装不能单独生成：再勾上 ① 世界书条目 或 ② 角色，这套衣服才知道该记到谁头上。';
    return '';
}

/* ---------- 手动生成的测试工具 ---------- */
/* 用当前勾选的世界书条目 / 角色组装一份请求，预览或试跑；结果只显示，不写档案 */
function genTestMode() {
    const sel = document.querySelector('#dna-tab [data-dna="genTestMode"]');
    const v = sel ? String(sel.value || '') : '';
    return genMode(v);
}

function genTestHint(text) {
    const h = document.querySelector('#dna-tab [data-dna="genTestHint"]');
    if (h) h.textContent = text || '';
}

function genTestFill(m, g) {
    const ta = document.querySelector('#dna-tab [data-dna="genTestPrompt"]');
    if (!ta) return;
    const msgs = normalizeMessages(g.prompt);
    ta.value = '【' + (GEN_MODE_LABEL[m] || GEN_MODE_LABEL.world) + '】\n\n'
        + msgs.map((x, i) => '【' + (i + 1) + ' · ' + x.role + '】\n' + x.content).join('\n\n');
}

function onGenTestPreview() {
    const m = genTestMode();
    const ta = document.querySelector('#dna-tab [data-dna="genTestPrompt"]');
    if (!ta) return;
    try {
        const g = buildGenPrompt(m);
        if (m === 'world' && !g.entries.length) { ta.value = '先在「① 按世界书条目生成」里勾至少一条条目。'; genTestHint(''); return; }
        if (m === 'chars' && !g.chars.length) { ta.value = '先在「② 按角色生成」里勾至少一个角色。'; genTestHint(''); return; }
        if (m === 'text' && !String(g.txt || '').trim()) { ta.value = '先在「④ 按导入文本生成」里导入一份 txt。'; genTestHint(''); return; }
        if (m === 'mix') { const r = mixBlockReason(g); if (r) { ta.value = r; genTestHint(''); return; } }
        genTestFill(m, g);
        const msgs = normalizeMessages(g.prompt);
        genTestHint('组装完成：' + msgs.length + ' 条 / ' + promptChars(g.prompt) + ' 字（没发请求、不花钱）');
        /* 摊开成一个窗口，一条条看清楚要发什么 */
        const usePreset = presetEnabledOf('gen') && presetEntries(undefined, 'gen').length > 0;
        openPromptPreview('只组装 · ' + (GEN_MODE_LABEL[m] || m), g.prompt,
            genBrief(g) + ' · ' + (usePreset ? ('预设「' + activePresetName('gen') + '」') : '插件内置 batchPrompt')
            + ' · ' + msgs.length + ' 条消息 / ' + promptChars(g.prompt) + ' 字（不发请求、不花钱）');
    } catch (e) {
        ta.value = '组装失败：' + (e && e.message ? e.message : e);
    }
}

async function onGenTestLLM() {
    if (scanning) { toast('上一轮还在跑，等它跑完'); return; }
    const m = genTestMode();
    const btn = document.querySelector('#dna-tab [data-dna="genTestLLM"]');
    const res = document.querySelector('#dna-tab [data-dna="genTestResult"]');
    if (scanning) { toast('上一轮还在跑，等它跑完'); return; }
    const old = btn ? btn.innerHTML : '';
    setBusy(true, '测试中…');
    if (btn) { btn.disabled = true; btn.textContent = '请求中…'; }
    if (res) res.value = '正在请求……';
    try {
        const g = buildGenPrompt(m);
        if (m === 'world' && !g.entries.length) { if (res) res.value = ''; genTestHint('先在「① 按世界书条目生成」里勾至少一条条目。'); return; }
        if (m === 'chars' && !g.chars.length) { if (res) res.value = ''; genTestHint('先在「② 按角色生成」里勾至少一个角色。'); return; }
        if (m === 'text' && !String(g.txt || '').trim()) { if (res) res.value = ''; genTestHint('先在「④ 按导入文本生成」里导入一份 txt。'); return; }
        if (m === 'mix') { const r = mixBlockReason(g); if (r) { if (res) res.value = ''; genTestHint(r); return; } }
        genTestFill(m, g);
        const api = resolveApi('gen');
        genTestHint('正在用 ' + api.source + ' · ' + api.model + ' 请求…（结果只显示，不写档案）');
        liveBegin('gen', '手动测试 · ' + (GEN_MODE_LABEL[m] || m));
        let reply;
        try {
            reply = await callSafe(g.prompt, buildRecordPrompt(clipText(g.text, 400), { origins: g.origins, olds: g.olds }, 'gen'),
                'gen', undefined, S.replyMaxTokens, (full) => liveDelta('gen', full));
            liveEnd('gen', reply);
        } catch (e) {
            liveEnd('gen', '', (e && e.message) || e);
            throw e;
        }
        if (res) res.value = reply;
        const n = promptChars(g.prompt);
        genTestHint('完成：prompt ' + n + ' 字 → 回复 ' + reply.length + ' 字（没写进档案库）');
        log('手动生成测试请求完成：' + api.model + ' · prompt ' + n + ' 字 → 回复 ' + reply.length + ' 字');
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        if (res) res.value = '失败：' + msg;
        genTestHint('测试请求失败：' + msg);
        log('手动生成测试请求失败：' + msg, 'error');
    } finally {
        setBusy(false);
        if (btn) { btn.disabled = false; btn.innerHTML = old; }
    }
}

/* ---------- 生成 ---------- */
async function onGenDna(mode) {
    const m = genMode(mode);
    if (scanning) { toast('上一轮还在跑，等它跑完'); return; }
    if (!S.enabled) { toast('插件已停用，先打开「运行」里的启用插件'); return; }
    const jobs = buildGenJobs(m);
    if (m === 'chars') {
        if (!jobs.length || !jobs[0].g.chars.length) { toast('先在「② 按角色生成」里勾至少一个角色', 'error'); return; }
    } else if (m === 'mix') {
        const g0 = jobs.length ? jobs[0].g : null;
        const r = g0 ? mixBlockReason(g0) : '组合生成至少要勾一条线，再生成';
        if (r) { toast(r, 'error'); return; }
    } else if (m === 'text') {
        if (!String(genTxtGet() || '').trim()) { toast('先在「按导入文本生成」里导入一份 txt', 'error'); return; }
        if (!jobs.length) { toast('这个分段编号不存在，点「重新分段」再来', 'error'); return; }
    } else {
        if (!jobs.length || !jobs[0].g.entries.length) { toast('先在「按世界书条目生成」里勾至少一条条目', 'error'); return; }
    }
    /* 会分几段发就提前说清楚：每段都是一次独立请求，都算钱 */
    if (jobs.length > 1
        && !confirm('这次会分 ' + jobs.length + ' 段依次生成（共 ' + jobs.length + ' 次请求）。\n\n'
            + '想只发一段，就在「④ 按导入文本生成」的段下拉里挑一个。继续吗？')) return;

    setBusy(true, '生成中…');
    dnaBanner('DNA建档中', 'run');
    let created = 0, updated = 0, skipped = 0, locked = 0, failed = 0;
    let firstName = '';
    try {
        const api = resolveApi('gen');
        const usePreset = presetEnabledOf('gen') && presetEntries(undefined, 'gen').length > 0;
        for (let ji = 0; ji < jobs.length; ji++) {
            if (abortedNow()) { log('已中断，剩下 ' + (jobs.length - ji) + ' 段没有发'); break; }
            const job = jobs[ji];
            const g = job.g;
            if (jobs.length > 1) log('—— 分段 ' + job.tag + ' ——');
            log('手动生成（' + (GEN_MODE_LABEL[m] || '') + '）：' + genBrief(g));
            log('使用 ' + api.source + ' · ' + api.model + '（手动生成）');
            logBreakthrough();
            log('提示词：' + (usePreset ? '手动生成预设「' + activePresetName('gen') + '」' : '插件内置 batchPrompt')
                + ' · ' + (GEN_MODE_LABEL[m] || '') + ' · ' + promptChars(g.prompt) + ' 字 / '
                + normalizeMessages(g.prompt).length + ' 条');
            /* 重试由「自动重试次数」统一管：第 1 次用精简正文，第 2 次换成内置提示词 */
            liveBegin('gen', '手动生成 · ' + (GEN_MODE_LABEL[m] || '') + (job.tag ? ' · ' + job.tag : ''));
            let raw;
            try {
                raw = await callSafe(
                    g.prompt,
                    buildRecordPrompt(clipText(g.text, 400), { origins: g.origins, olds: g.olds }, 'gen'),
                    'gen',
                    usePreset ? batchPrompt(g.text, { origins: g.origins, olds: g.olds }) : undefined,
                    S.replyMaxTokens,
                    (full) => liveDelta('gen', full)
                );
                liveEnd('gen', raw);
            } catch (e) {
                liveEnd('gen', '', (e && e.message) || e);
                throw e;
            }
            const list = parseProfileList(raw);
            if (!list) {
                appendAiReplyMeta('gen', '解析失败，看原文');
                log('AI 返回无法解析：' + String(raw || '').slice(0, 300), 'error');
                toast('返回解析不了，看「AI 回复（实时）」', 'error');
                if (jobs.length === 1) return;
                continue;
            }
            appendAiReplyMeta('gen', list.length + ' 份档案');
            log('AI 返回 ' + list.length + ' 份档案');

            const done = Object.create(null);
            const floorTag = '手动生成';
            for (const item of list) {
                const prof = normalizeProfile(item, item && item['姓名']);
                if (!prof || !String(prof['姓名'] || '').trim()) { failed++; continue; }
                const nm = String(prof['姓名']).trim();
                if (done[nm]) continue;
                done[nm] = 1;
                try {
                    const res = saveProfile(prof, floorTag);
                    if (res.split) log('「' + nm + '」一条里写了多种形态，自动拆成 ' + res.results.length + ' 条档案');
                    for (const one of res.results) {
                        if (one.r === 'created') { created++; log('新建「' + one.name + '」'); if (!firstName) firstName = one.name; }
                        else if (one.r === 'updated') { updated++; log('更新「' + one.name + '」'); if (!firstName) firstName = one.name; }
                        else if (one.r === 'locked') { locked++; log('「' + one.name + '」已锁定，AI 不改它'); }
                        else { skipped++; log('跳过「' + one.name + '」（已建档，且没开「AI自动更新档案库」）'); }
                    }
                } catch (e) {
                    failed++;
                    log('「' + nm + '」写入失败：' + (e && e.message ? e.message : e), 'error');
                }
            }
        }
        log('手动生成完成：新建 ' + created + ' · 更新 ' + updated + ' · 跳过 ' + skipped
            + (locked ? (' · 锁定跳过 ' + locked) : '') + ' · 失败 ' + failed);
        toast('生成完成：新建 ' + created + ' / 更新 ' + updated + (locked ? (' / 锁定跳过 ' + locked) : ''));
        renderList();
        if (created + updated > 0 && firstName) { selected = firstName; renderList(); }
        if (created + updated > 0) dnaBanner('建档成功', 'ok', 2600);
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        if (/已手动中断/.test(msg)) {
            log('手动生成已中断' + ((created + updated) ? ('：前面几段已经建档 ' + (created + updated) + ' 条，保留不动') : '，没写任何档案'));
            toast('已中断这次生成');
            dnaBanner('已中断', 'err', 2400);
        } else {
            log('手动生成失败：' + msg, 'error');
            toast('生成失败：' + msg, 'error');
            dnaBanner('建档失败', 'err', 3600);
        }
    } finally {
        setBusy(false);
        syncAbortBtns();
        renderGenInfo();
        if (dnaBannerKind === 'run') dnaBannerHide();
    }
}

/* ---------- 选择状态存取 ---------- */
function toggleGenEntry(key, on) {
    const set = new Set(S.genEntries || []);
    if (on) set.add(key); else set.delete(key);
    S.genEntries = [...set];
    saveSettings(true);
    renderGenInfo();
}

function toggleGenChar(key, on) {
    const set = new Set(S.genChars || []);
    if (on) set.add(key); else set.delete(key);
    S.genChars = [...set];
    saveSettings(true);
    renderGenInfo();
}

/* 一次勾上 / 勾掉当前筛选出来的全部 */
function setAllGenEntries(on) {
    const sEl = document.querySelector('#dna-tab [data-dna="genEntrySearch"]');
    const q = String((sEl && sEl.value) || '').trim().toLowerCase();
    const list = genEntriesCache.filter((e) => !q || (e.title + ' ' + e.keywords).toLowerCase().indexOf(q) >= 0);
    const set = new Set(S.genEntries || []);
    list.forEach((e) => { if (on) set.add(e.key); else set.delete(e.key); });
    S.genEntries = [...set];
    saveSettings(true);
    renderGenEntries();
}

function setAllGenChars(on) {
    const sEl = document.querySelector('#dna-tab [data-dna="genCharSearch"]');
    const q = String((sEl && sEl.value) || '').trim().toLowerCase();
    const list = genCharsCache.filter((c) => !q || (c.name + ' ' + c.key).toLowerCase().indexOf(q) >= 0);
    const set = new Set(S.genChars || []);
    list.forEach((c) => { if (on) set.add(c.key); else set.delete(c.key); });
    S.genChars = [...set];
    saveSettings(true);
    renderGenChars();
}

/* ---------- 角色卡的主世界书 ---------- */
/* 角色卡编辑页里那个「主要世界书」。聊天自己绑了世界书时酒馆实际用的是聊天那本，
   取不到角色卡的就退回它。都没有就返回空串（保持手动选择）。 */
let genBookMissing = false;   /* 角色卡绑定的世界书不在酒馆列表里 */

function cardWorldBook() {
    try {
        const ctx = getContext();
        const ch = ctx && ctx.characters && ctx.characters[ctx.characterId];
        const w = ch && ((ch.data && ch.data.extensions && ch.data.extensions.world)
            || (ch.data && ch.data.world)
            || ch.world);
        if (w) return String(w).trim();
        const chatW = ctx && ctx.chatMetadata && ctx.chatMetadata.world_info;
        return chatW ? String(chatW).trim() : '';
    } catch (e) { return ''; }
}

function renderGenBookHint() {
    const hint = document.querySelector('#dna-tab [data-dna="genBookHint"]');
    if (!hint) return;
    if (S.genSource === 'chatu8') { hint.textContent = ''; return; }
    const book = cardWorldBook();
    if (!S.genBookFollowCard) {
        hint.textContent = book
            ? '跟随已关闭，用上面手动选的那本（当前角色卡绑定的是「' + book + '」）。'
            : '跟随已关闭，用上面手动选的那本。';
        return;
    }
    if (!book) { hint.textContent = '当前角色卡没绑定主世界书，保持手动选择。'; return; }
    if (genBookMissing) {
        hint.textContent = '角色卡绑定的是「' + book + '」，它不在酒馆世界书列表里，现在用的是「' + (S.genBook || '无') + '」。';
        return;
    }
    hint.textContent = '已跟随角色卡的主世界书「' + book + '」。想用别的书，直接在下面手动选，跟随会自动关掉。';
}

/* 进入角色卡时把世界书切到卡绑定的那本；返回 true 表示书变了，需要重新读取条目 */
async function followCardWorldBook() {
    const book = cardWorldBook();
    renderGenBookHint();
    if (!S.genBookFollowCard || S.genSource === 'chatu8' || !book) return false;
    if (S.genBook === book) return false;
    S.genBook = book;
    S.genEntries = [];      // 换书后条目 key 全变了，旧勾选作废
    saveSettings(true);
    return true;
}

/* ---------- 初始化 / 换来源 ---------- */
async function loadGenSource() {
    const isSt = S.genSource !== 'chatu8';
    const row = document.querySelector('#dna-tab [data-dna="genBookRow"]');
    if (row) row.style.display = isSt ? '' : 'none';
    const tools = document.querySelector('#dna-tab [data-dna="genBookToolsRow"]');
    if (tools) tools.style.display = isSt ? '' : 'none';
    renderGenBookHint();
    const box = document.querySelector('#dna-tab [data-dna="genEntryList"]');
    if (box) box.innerHTML = '<div class="dna-entries-empty">读取中…</div>';
    try {
        if (S.genSource === 'chatu8') {
            genEntriesCache = chatu8WorldEntries();
        } else {
            const names = await stWorldNames();
            const sel = document.querySelector('#dna-tab [data-dna="genBook"]');
            if (sel) {
                sel.innerHTML = names.length
                    ? names.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('')
                    : '<option value="">（酒馆里还没有世界书）</option>';
                const want = S.genBookFollowCard ? cardWorldBook() : '';
                genBookMissing = !!(want && names.indexOf(want) < 0);
                if (S.genBook && names.indexOf(S.genBook) >= 0) sel.value = S.genBook;
                else { S.genBook = names[0] || ''; if (S.genBook) sel.value = S.genBook; }
                renderGenBookHint();
            }
            genEntriesCache = S.genBook ? await stWorldEntries(S.genBook) : [];
        }
    } catch (e) {
        genEntriesCache = [];
        if (box) box.innerHTML = '<div class="dna-entries-empty">读取失败：' + esc(e && e.message ? e.message : e) + '</div>';
        renderGenInfo();
        return;
    }
    genCharsCache = chatu8CharPresets();
    genOutfitsCache = chatu8OutfitPresets();
    renderGenEntries();
    renderGenChars();
    renderGenOutfits();
    renderGenInfo();
}

function injectIntoChatu8() {
    const modal = document.querySelector('#ch-settings-modal');
    if (!modal) return false;
    const nav = modal.querySelector('.st-chatu8-nav');
    const content = modal.querySelector('.st-chatu8-content');
    if (!nav || !content) return false;
    /* 关键：必须等智绘姬把所有页签内容灌进 .st-chatu8-content（innerHTML 会覆盖），
       否则我们插进去的页签会被冲掉。以「主要设置」页签出现为准。 */
    if (!content.querySelector('#st-chatu8-tab-main')) return false;
    /* 链接在，但内容元素可能已被智绘姬重灌冲掉（它重灌的是 .st-chatu8-content）。
       这时如果直接 return，用户点「档案库」看到的是空白 / 死面板，
       里面所有按钮（编辑、锁、删除、复制）都点不动 —— 必须重建。 */
    if (nav.querySelector('[data-tab="dna"]')) {
        if (content.querySelector('#st-chatu8-tab-dna') || content.querySelector('#dna-tab')) return true;
        const stale = nav.querySelector('[data-tab="dna"]');
        if (stale) { try { stale.remove(); } catch (e) { /* 忽略 */ } }
    }

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'st-chatu8-nav-link';
    link.dataset.tab = 'dna';
    link.innerHTML = '<i class="fa-solid fa-dna" style="margin-right:6px"></i>档案库';
    /* 放在「LLM」页签右边；老版本没有 LLM 页签时还是退回到「关于」前面 */
    const llmLink = nav.querySelector('.st-chatu8-nav-link[data-tab="llm"]') || nav.querySelector('[data-tab="llm"]');
    const aboutLink = nav.querySelector('[data-tab="about"]');
    if (llmLink) nav.insertBefore(link, llmLink.nextSibling);
    else if (aboutLink) nav.insertBefore(link, aboutLink);
    else nav.appendChild(link);

    /* 智绘姬重灌 .st-chatu8-content 时可能留下一个孤儿 DNA 页签
       （nav 里的链接没了、content 里的 div 还在）。不清掉的话会出现两个 #dna-tab，
       querySelector 只拿到第一个，用户看到的第二个就是没绑过事件的死面板——
       折叠点不动、按钮没反应，都是这么来的。 */
    content.querySelectorAll('.st-chatu8-tab-content[data-tab-id="dna"]').forEach((el) => {
        try { el.remove(); } catch (e) { /* 忽略 */ }
    });

    const tab = document.createElement('div');
    tab.id = 'st-chatu8-tab-dna';
    tab.className = 'st-chatu8-tab-content';
    tab.dataset.tabId = 'dna';
    tab.innerHTML = PANEL_HTML;
    content.appendChild(tab);

    link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nav.querySelectorAll('.st-chatu8-nav-link').forEach((a) => a.classList.remove('active'));
        link.classList.add('active');
        content.querySelectorAll(':scope > .st-chatu8-tab-content').forEach((d) => d.classList.remove('active'));
        tab.classList.add('active');
        bindPanel();
        renderList();
        renderTemplateUI();
    });

    bindPanel();
    renderList();
    renderTemplateUI();
    log('已挂载到智绘姬设置面板（侧栏「档案库」）');
    return true;
}

/* 预设收纳盒：本体 setupPresetBoxes 只在设置面板初始化时跑一次，DNA 页签是后注入的，
   所以这里自己绑一份（类名与本体一致，样式直接复用 presetBox.css）。 */
function bindPresetBoxes(tab) {
    const closeAll = (except) => {
        tab.querySelectorAll('.st-chatu8-preset-box-dropdown.is-open').forEach((d) => {
            if (d !== except) d.classList.remove('is-open');
        });
        tab.querySelectorAll('.st-chatu8-preset-box-btn.is-active').forEach((b) => {
            if (!except || !except.parentElement.contains(b)) b.classList.remove('is-active');
        });
    };
    tab.querySelectorAll('.st-chatu8-preset-box-wrapper').forEach((wrap) => {
        /* bindPanel() 每次切页签都会跑，这里必须幂等，否则点一下会开一次又关一次 */
        if (wrap.getAttribute('data-box-bound') === '1') return;
        wrap.setAttribute('data-box-bound', '1');
        const btn = wrap.querySelector('.st-chatu8-preset-box-btn');
        const dd = wrap.querySelector('.st-chatu8-preset-box-dropdown');
        const close = wrap.querySelector('.st-chatu8-preset-box-close');
        if (!btn || !dd) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const open = dd.classList.contains('is-open');
            closeAll(dd);
            dd.classList.toggle('is-open', !open);
            btn.classList.toggle('is-active', !open);
        });
        if (close) close.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dd.classList.remove('is-open');
            btn.classList.remove('is-active');
        });
        dd.addEventListener('click', (e) => {
            if (!e.target.closest('.st-chatu8-preset-box-item')) return;
            setTimeout(() => {
                dd.classList.remove('is-open');
                btn.classList.remove('is-active');
            }, 120);
        });
    });
}

/* 跳到智绘姬「LLM」页签（两个 LLM 卡片上的按钮共用） */
function gotoLLMTab() {
    document.querySelectorAll('.st-chatu8-nav-link').forEach((l) => l.classList.remove('active'));
    document.querySelectorAll('.st-chatu8-tab-content').forEach((t) => t.classList.remove('active'));
    const link = document.querySelector('.st-chatu8-nav-link[data-tab="llm"]');
    const pane = document.querySelector('#st-chatu8-tab-llm');
    if (link) link.classList.add('active');
    if (pane) pane.classList.add('active');
    if (!link) toast('找不到 LLM 页签', 'error');
}

/* LLM 配置那一小块：档案库 / 手动生成各一份，scope 决定绑哪套控件、改哪个字段 */
function bindProfileSection(tab, scope) {
    const sel = tab.querySelector('[data-dna="' + dkey(scope, 'profileSelect') + '"]');
    if (!sel) return;
    sel.addEventListener('change', (e) => {
        const name = e.target.value;
        if (!name) return;
        if (!switchProfile(name, scope)) { toast('切换失败：这份配置不存在', 'error'); return; }
        renderConfigDetail(scope);
        updateModelHint(scope);
        log('已切换 LLM 配置：' + name + ((scope === 'gen' || scope === 'ranobe') ? ('（' + presetScopeLabel(scope) + '）') : ''));
    });
    const go = tab.querySelector('[data-dna="' + dkey(scope, 'gotoLLM') + '"]');
    if (go) go.addEventListener('click', gotoLLMTab);
}

/* 上下文预设那一整套：档案库 / 手动生成各一套，互不影响 */
function bindPresetSection(tab, scope) {
    const q = (base) => tab.querySelector('[data-dna="' + dkey(scope, base) + '"]');
    const en = q('presetEnabled');
    if (!en) return;                     // 这套没渲染出来就跳过

    en.addEventListener('change', (e) => {
        S[presetKey(scope, 'Enabled')] = !!e.target.checked;
        saveSettings(true);
        renderPresetCard(scope);
    });
    const merge = q('presetMergeSystem');
    if (merge) merge.addEventListener('change', (e) => {
        S[presetKey(scope, 'MergeSystem')] = !!e.target.checked;
        saveSettings(true);
        renderPresetCard(scope);
        log('system 消息合并：' + (presetMergeOf(scope) ? '开' : '关') + '（' + presetScopeLabel(scope) + '）');
    });
    const sel = q('presetSelect');
    if (sel) sel.addEventListener('change', (e) => {
        /* 自动生成这套是按角色卡记的：锁住了就不许从这儿换 */
        if (scope === 'lib' && libPresetLocked()) {
            toast('这张角色卡的上下文预设已锁定，先点小锁解锁');
            renderPresetCard(scope);
            return;
        }
        if (!setPresetNameOfScope(scope, e.target.value || '')) { renderPresetCard(scope); return; }
        saveSettings(true);
        renderPresetCard(scope);
    });
    const imp = q('presetImport');
    const file = q('presetFile');
    if (imp && file) {
        imp.addEventListener('click', () => file.click());
        file.addEventListener('change', (ev) => importPreset(ev, scope));
    }
    const exp = q('presetExport');
    if (exp) exp.addEventListener('click', () => exportPreset(scope));
    const ren = q('presetRename');
    if (ren) ren.addEventListener('click', () => renamePreset(scope));
    const reseed = q('presetReseed');
    if (reseed) reseed.addEventListener('click', () => onPresetReseed(scope));
    const sav = q('presetSave');
    if (sav) sav.onclick = () => onPresetSave(scope);
    const rm = q('presetRemove');
    if (rm) rm.addEventListener('click', () => removePreset(scope));
    const allOn = q('presetAllOn');
    if (allOn) allOn.addEventListener('click', () => setAllPresetEntries(true, scope));
    const allOff = q('presetAllOff');
    if (allOff) allOff.addEventListener('click', () => setAllPresetEntries(false, scope));

    const box = q('presetEntries');
    if (!box) return;
    box.addEventListener('change', (e) => {
        const cb = e.target;
        if (!cb || cb.type !== 'checkbox') return;
        const card = cb.closest('.dna-entry-item');
        if (!card) return;
        const idx = Number(card.dataset.idx);
        const list = presetEntries(undefined, scope);
        if (!list[idx]) return;
        list[idx].enabled = !!cb.checked;
        /* 关掉的条目：只把名字和预览压暗，按钮保持原样（还要能点） */
        const nm = card.querySelector('.dna-entry-name');
        const pv = card.querySelector('.st-chatu8-entry-preview');
        if (nm) nm.style.opacity = cb.checked ? '1' : '.45';
        if (pv) pv.style.opacity = cb.checked ? '.85' : '.4';
        saveSettings(true);
        updatePresetMeta(scope);
    });
    box.addEventListener('click', (e) => {
        /* 上移 / 下移 / 删除（LLM 上下文配置那排图标按钮） */
        const mv = e.target.closest('[data-move]');
        if (mv) {
            e.preventDefault();
            e.stopPropagation();
            const row = mv.closest('.dna-entry-item');
            if (!row) return;
            const idx = Number(row.dataset.idx);
            if (mv.disabled) return;
            if (!movePresetEntry(idx, mv.dataset.move, scope)) toast('已经到头了', 'error');
            return;
        }
        const del = e.target.closest('[data-del]');
        if (del) {
            e.preventDefault();
            e.stopPropagation();
            const row = del.closest('.dna-entry-item');
            if (!row) return;
            removePresetEntry(Number(row.dataset.idx), scope);
            return;
        }
        const editBtn = e.target.closest('[data-edit]');
        if (editBtn) {
            e.preventDefault();
            const idx = Number(editBtn.dataset.edit);
            const list0 = presetEntries(undefined, scope);
            const e0 = list0[idx];
            if (!e0) return;
            const role0 = PRESET_ROLES.includes(e0.role) ? e0.role : 'user';
            dnaModalOpen('编辑条目 ' + (idx + 1) + '：' + (e0.name || ''),
                '<div class="dna-modal-row"><label>名称</label>' +
                    '<input type="text" class="st-chatu8-text-input" data-mf="name" value="' + esc(e0.name || '') + '"></div>' +
                '<div class="dna-modal-row"><label>角色</label>' +
                    '<select class="st-chatu8-select" data-mf="role">' +
                    PRESET_ROLES.map((r) => '<option value="' + r + '"' + (r === role0 ? ' selected' : '') + '>' + r + '</option>').join('') +
                    '</select></div>' +
                '<div class="dna-modal-field"><label>内容（支持 {{正文}} / {{角色卡设定}} / {{旧档案}} 等占位符）</label>' +
                    '<textarea class="st-chatu8-edit-input dna-mono" data-mf="content" rows="18">' + esc(e0.content || '') + '</textarea></div>' +
                '<div class="dna-modal-row"><label>触发方式</label><select class="st-chatu8-select" data-mf="triggerMode"><option value="always"' + (e0.triggerMode === 'trigger' ? '' : ' selected') + '>始终启用</option><option value="trigger"' + (e0.triggerMode === 'trigger' ? ' selected' : '') + '>按触发词启用</option></select></div>' +
                '<div class="dna-modal-row"><label>任一触发词（逗号或换行分隔）</label><input class="st-chatu8-text-input" data-mf="triggerWords" value="' + esc(e0.triggerWords || '') + '"></div>' +
                '<div class="dna-modal-row"><label>必须同时出现（逗号或换行分隔）</label><input class="st-chatu8-text-input" data-mf="andTriggerWords" value="' + esc(e0.andTriggerWords || '') + '"></div>' +
                '<div class="st-chatu8-edit-buttons dna-modal-foot">' +
                    '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>取消</button>' +
                    '<button type="button" class="st-chatu8-edit-button send" data-modal-save>保存这条</button>' +
                '</div>');
            dnaModalWire((mask) => {
                const nameEl = mask.querySelector('[data-mf="name"]');
                const roleEl = mask.querySelector('[data-mf="role"]');
                const contEl = mask.querySelector('[data-mf="content"]');
                if (!savePresetEntry(idx, {
                    name: nameEl ? nameEl.value : undefined,
                    role: roleEl ? roleEl.value : undefined,
                    content: contEl ? contEl.value : undefined,
                    triggerMode: mask.querySelector('[data-mf="triggerMode"]')?.value,
                    triggerWords: mask.querySelector('[data-mf="triggerWords"]')?.value,
                    andTriggerWords: mask.querySelector('[data-mf="andTriggerWords"]')?.value
                }, scope)) { toast('保存失败：这条已经不存在了', 'error'); return; }
                dnaModalClose();
                renderPresetCard(scope);
                log('已修改预设条目 #' + (idx + 1));
            });
            return;
        }
        const act = e.target.closest('[data-eact]');
        if (!act) return;
    });
}


/* ------------------------------ 导入文本：分段 ------------------------------ */
/* 按 token 估算切段：先按空行/换行分块累加，单块自己就超上限的再按句子切，
   单句还超的硬切。切出来的每一段单独发一次请求，提示词里只有这一段。 */
function genTxtSegments(body) {
    const text = String(body || '');
    if (!text.trim()) return [];
    const limit = clampInt(S.genTxtChunk, 0, 200000, 3000);
    if (!limit) return [{ i: 0, text, chars: text.length, tokens: estimateTokens(text) }];
    const out = [];
    const blocks = text.split(/\n+/).map((x) => x.trim()).filter(Boolean);
    let acc = '';
    const pushHard = (sent) => {
        const step = Math.max(200, Math.floor(limit * 0.9));
        for (let i = 0; i < sent.length; i += step) out.push(sent.slice(i, i + step));
    };
    for (const b of blocks) {
        if (estimateTokens(b) > limit) {
            if (acc.trim()) { out.push(acc); acc = ''; }
            let cur = '';
            for (const sent of b.split(/(?<=[。！？；!?;])/)) {
                if (!sent) continue;
                if (!cur && estimateTokens(sent) > limit) { pushHard(sent); continue; }
                if (cur && estimateTokens(cur + sent) > limit) { out.push(cur); cur = ''; }
                cur += sent;
            }
            if (cur.trim()) out.push(cur);
            continue;
        }
        const next = acc ? (acc + '\n' + b) : b;
        if (acc && estimateTokens(next) > limit) { out.push(acc); acc = b; }
        else acc = next;
    }
    if (acc.trim()) out.push(acc);
    return out.map((t, i) => ({ i, text: t, chars: t.length, tokens: estimateTokens(t) }));
}

/* 界面上选中的那段；分段关着、或选了「全部」时就是全篇 */
function genTxtSendText() {
    const body = genTxtGet();
    const segs = genTxtSegments(body);
    const part = clampInt(S.genTxtPart, 0, 9999, 0);
    if (segs.length > 1 && part > 0 && segs[part - 1]) return segs[part - 1].text;
    return body;
}

function genTxtRefreshSeg() {
    const body = genTxtGet();
    const segs = genTxtSegments(body);
    const limit = clampInt(S.genTxtChunk, 0, 200000, 3000);
    let part = clampInt(S.genTxtPart, 0, 9999, 0);
    if (part > segs.length) { part = 0; S.genTxtPart = 0; }
    const sel = document.querySelector('#dna-tab [data-dna="genTxtPart"]');
    if (sel) {
        sel.innerHTML = segs.length <= 1
            ? '<option value="0">不分段（全文一次发）</option>'
            : ('<option value="0">全部 ' + segs.length + ' 段依次生成</option>'
                + segs.map((sg, i) => '<option value="' + (i + 1) + '">第 ' + (i + 1) + ' 段 · '
                    + sg.chars + ' 字 / 约 ' + sg.tokens + ' token</option>').join(''));
        sel.value = String(part);
    }
    const hint = document.querySelector('#dna-tab [data-dna="genTxtSegHint"]');
    if (hint) {
        if (!String(body || '').trim()) hint.textContent = '还没有文本，导入或粘一段再看分段。';
        else if (segs.length <= 1) {
            hint.textContent = '整篇 ' + body.length + ' 字 / 约 ' + estimateTokens(body) + ' token，'
                + (limit ? ('没超过 ' + limit + ' token 的上限，不用分段。') : '分段关着，整篇一次发。');
        } else if (part > 0) {
            hint.textContent = '共 ' + segs.length + ' 段（上限 ' + limit + ' token/段）。这次只生成第 ' + part
                + ' 段：' + segs[part - 1].chars + ' 字 / 约 ' + segs[part - 1].tokens + ' token。';
        } else {
            hint.textContent = '共 ' + segs.length + ' 段（上限 ' + limit + ' token/段）。这次会依次生成全部 '
                + segs.length + ' 段，一共 ' + segs.length + ' 次请求。';
        }
    }
}

/* 一次点击要发几次请求：世界书/角色各一次；导入文本开了分段就是每段一次 */
function buildGenJobs(m) {
    if (m === 'text') {
        const body = genTxtGet();
        const segs = genTxtSegments(body);
        let part = clampInt(S.genTxtPart, 0, 9999, 0);
        if (part > segs.length) part = 0;
        if (segs.length <= 1 || !part) {
            if (segs.length <= 1) return [{ tag: '', g: buildGenPrompt('text', body) }];
            return segs.map((sg, i) => ({
                tag: '第 ' + (i + 1) + '/' + segs.length + ' 段',
                g: buildGenPrompt('text', sg.text)
            }));
        }
        return [{ tag: '第 ' + part + '/' + segs.length + ' 段', g: buildGenPrompt('text', segs[part - 1].text) }];
    }
    return [{ tag: '', g: buildGenPrompt(m) }];
}

/* ------------------------------ 世界书条目：看 / 改 / 存回去 ------------------------------ */
function genEntryByKey(key) {
    return (genEntriesCache || []).find((e) => e.key === key) || null;
}

function openGenEntryViewer(key) {
    const e = genEntryByKey(key);
    if (!e) { toast('这条已经不在列表里了，点「重新读取」再试', 'error'); return; }
    const isCh = S.genSource === 'chatu8';
    const srcName = isCh ? '智绘姬世界书' : '酒馆世界书';
    dnaModalOpen('查看 / 编辑：' + e.title,
        '<div class="dna-modal-meta">来源：' + esc(srcName)
            + (e.keywords ? (' · 关键词：' + esc(e.keywords)) : '')
            + ' · ' + e.content.length + ' 字</div>' +
        '<div class="dna-modal-field"><label>条目内容（改完点右下角保存，会写回' + esc(srcName) + '）</label>' +
            '<textarea class="st-chatu8-edit-input dna-mono" data-mv="content" rows="20">' + esc(e.content) + '</textarea></div>' +
        '<div class="st-chatu8-edit-buttons dna-modal-foot">' +
            '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>关闭</button>' +
            '<button type="button" class="st-chatu8-edit-button send" data-modal-save>保存到' + esc(srcName) + '</button>' +
        '</div>');
    dnaModalWire(async (mask) => {
        const ta = mask.querySelector('[data-mv="content"]');
        const text = ta ? ta.value : '';
        if (text === e.content) { dnaModalClose(); toast('内容没变，没写入'); return; }
        const done = await saveGenEntryContent(key, text);
        if (done) dnaModalClose();
    });
}

async function saveGenEntryContent(key, text) {
    const e = genEntryByKey(key);
    if (!e) { toast('这条已经不在列表里了，点「重新读取」再试', 'error'); return false; }
    const val = String(text == null ? '' : text);
    try {
        if (S.genSource === 'chatu8') {
            const ch = extension_settings[CHATU8];
            const node = ch && ch.worldBookList ? ch.worldBookList[e.title] : null;
            if (!node) throw new Error('智绘姬世界书里找不到「' + e.title + '」');
            node.content = val;
            saveSettingsDebounced();
            e.content = val;
            renderGenEntries();
            log('已保存智绘姬世界书「' + e.title + '」（' + val.length + ' 字）');
            toast('已存回智绘姬世界书');
            return true;
        }
        /* 酒馆世界书：key = 书名::uid。整本取回来、只改这一条，再整体写回，别的东西不动。 */
        const cut = key.lastIndexOf('::');
        if (cut < 0) throw new Error('条目 key 认不出来：' + key);
        const book = key.slice(0, cut);
        const uid = key.slice(cut + 2);
        const res = await fetch('/api/worldinfo/get', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({ name: book }),
            cache: 'no-cache'
        });
        if (!res.ok) throw new Error('读取世界书失败：HTTP ' + res.status);
        const data = await res.json();
        const entries = (data && data.entries) || {};
        const target = entries[uid];
        if (!target) throw new Error('世界书「' + book + '」里找不到这条（uid ' + uid + '）');
        target.content = val;
        const w = await fetch('/api/worldinfo/edit', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({ name: book, data }),
            cache: 'no-cache'
        });
        if (!w.ok) throw new Error('写入世界书失败：HTTP ' + w.status);
        e.content = val;
        renderGenEntries();
        log('已保存酒馆世界书「' + book + '」的条目「' + e.title + '」（' + val.length + ' 字）');
        toast('已存回酒馆世界书（酒馆里没变就切一下世界书页签刷一下）');
        return true;
    } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        log('保存世界书条目失败：' + msg, 'error');
        toast('保存失败：' + msg, 'error');
        return false;
    }
}

/* ------------------------------ 设置：开关同步 ------------------------------ */
/* 智绘姬本体翻开关的方式是 jQuery：$(this).find('input').prop('checked', !x).trigger('change')。
   jQuery 的 trigger 只走 jQuery 自己的处理器，原生 addEventListener('change') 收不到——
   所以光靠 change 事件，开关点了界面会变、设置却永远是旧值（点保存也存的是旧值，重进就恢复）。
   这里点完等一拍，按 checkbox 的真实状态把设置同步进来；document 级监听，面板被重建也不会丢。 */
let dnaToggleSyncing = false;

/* 开关的中文名（写日志用，用户看不到控制台，靠日志判断有没有同步上） */
function toggleLabelOf(key) {
    const map = {
        enabled: '启用插件', autoScan: '自动记录', followChar: '档案跟随角色卡存档',
        updateExisting: 'AI自动更新档案库', notify: '完成后弹提示', libStream: '档案库流式输出', useRegex: '正文先过正则',
        breakTool: '自定义 Tool', breakTail: '末尾多 Role', sendEnabled: '发送 DNA',
        presetEnabled: '档案库用上下文预设', presetMergeSystem: '档案库合并 system',
        genPresetEnabled: '手动生成用上下文预设', genPresetMergeSystem: '手动生成合并 system',
        genBookFollowCard: '世界书跟随角色卡'
    };
    return map[key] || key;
}

function syncTogglesFromDom() {
    const tab = document.querySelector('#dna-tab');
    if (!tab || dnaToggleSyncing) return false;
    const changed = [];
    let followChanged = false;
    let bookFollowChanged = false;
    tab.querySelectorAll('input[type="checkbox"][data-dna]').forEach((el) => {
        const key = el.dataset.dna;
        if (!(key in DEFAULTS) || typeof DEFAULTS[key] !== 'boolean') return;
        const now = !!el.checked;
        if (!!S[key] === now) return;
        S[key] = now;
        changed.push(key);
        if (key === 'followChar') followChanged = true;
        if (key === 'genBookFollowCard') bookFollowChanged = true;
    });
    if (!changed.length) return false;
    dnaToggleSyncing = true;
    try {
        saveSettings(true);
        updateDerivedUI();
        try { renderPresetCard('lib'); renderPresetCard('gen'); renderPresetCard('ranobe'); } catch (e) { /* 忽略 */ }
        if (followChanged) { selected = null; renderList(); }
        log('设置已更新：' + changed.map(toggleLabelOf).join('、'));
    } finally {
        dnaToggleSyncing = false;
    }
    if (bookFollowChanged) {
        followCardWorldBook().then((ok) => {
            if (ok) {
                log('世界书已跟随角色卡切到「' + S.genBook + '」');
                loadGenSource();
            }
        }).catch(() => { /* 取不到角色卡就保持原样 */ });
    }
    return true;
}

function installDnaToggleSync() {
    if (window.__dnaToggleSync) return;
    window.__dnaToggleSync = true;
    /* 点开关：等本体那次 prop/trigger 做完再看真实状态 */
    document.addEventListener('click', (e) => {
        const hit = (e.target && e.target.closest) ? e.target.closest('#dna-tab .st-chatu8-toggle') : null;
        if (!hit) return;
        setTimeout(() => { try { syncTogglesFromDom(); } catch (err) { /* 忽略 */ } }, 0);
    }, false);
    /* 键盘空格、脚本改值这类真原生 change 也同步一次 */
    document.addEventListener('change', (e) => {
        const el = e.target;
        if (!el || el.type !== 'checkbox' || !el.dataset || !el.dataset.dna) return;
        if (!el.closest || !el.closest('#dna-tab')) return;
        syncTogglesFromDom();
    }, true);
}

/* ------------------------------ 设置：手动保存 ------------------------------ */
function onSaveAll() {
    /* 先按界面上的真实状态同步一遍，再落盘（手快时开关同步的那一拍可能还没到） */
    try { syncTogglesFromDom(); } catch (e) { /* 忽略 */ }
    saveSettings(true);
    /* saveSettingsDebounced 是防抖的：点完保存立刻退出应用，可能还没写进 settings.json，这里强刷一次 */
    try {
        if (typeof saveSettingsDebounced.flush === 'function') saveSettingsDebounced.flush();
    } catch (e) { /* 忽略 */ }
    const d = new Date();
    const p2 = (n) => String(n).padStart(2, '0');
    const hhmm = p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
    const h = document.querySelector('#dna-tab [data-dna="saveHint"]');
    if (h) h.textContent = '已保存 · ' + hhmm;
    log('设置已手动保存（' + hhmm + '）');
    toast('设置已保存');
}

function bindPanel() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    if (tab.dataset.binding === '1') return;   /* 防重入 */
    /* 幂等，但要能自愈：面板被重新注入后，tab 上的标记还在、里面全是新元素、监听早没了。
       只看 tab.dataset.bound 就会直接 return，导致所有按钮都点不动。
       所以再看一眼列表容器有没有绑过。 */
    const listEl0 = tab.querySelector('[data-dna="list"]');
    if (tab.dataset.bound === '1' && (!listEl0 || listEl0.dataset.bound === '1')) return;
    tab.dataset.binding = '1';
    tab.dataset.bound = '1';
    if (listEl0) listEl0.dataset.bound = '1';
    bindFoldClicks(tab);
    bindAliasBan(tab);

    /* 子板块切换：档案库 / 手动生成 / 发送 & 工具 / 设置
       只切显示，不重建 DOM——所有 data-dna 控件都还在，事件绑定不受影响。 */
    const subTabs = Array.from(tab.querySelectorAll('.st-chatu8-sub-nav-link'));
    const subPanels = Array.from(tab.querySelectorAll('.dna-panel'));
    const showSub = (name) => {
        if (!name || !subPanels.some((p) => p.dataset.dnaPanel === name)) name = 'arch';
        subTabs.forEach((b) => b.classList.toggle('active', b.dataset.dnaTab === name));
        subPanels.forEach((p) => p.classList.toggle('active', p.dataset.dnaPanel === name));
        tab.dataset.sub = name;
        /* 同人资料库：内置本体是静态文件，切过去再载入并渲染 */
        if (name === 'ranobe') {
            const scope = libScopeOf(name);
            const st = libState(scope);
            libSetVal(name, 'Search', st.q || '');
            libSetVal(name, 'Req', st.req || '');
            setTimeout(() => { renderLib(name).catch(() => { /* 读取失败已在 renderLib 里记日志 */ }); }, 0);
            /* 同人资料库页里还挂着一块「世界书生成」，一起渲染 */
            if (name === 'ranobe') {
                libSetVal('ranobewb', 'Search', st.q || '');
                libSetVal('ranobewb', 'Req', st.req || '');
                setTimeout(() => { renderLib('ranobewb').catch(() => { /* 同上 */ }); }, 0);
            }
        }
        /* 角色照片：切过去就重新拉一遍档案库（别的地方刚记完也能看到） */
        if (name === 'photo') {
            try { renderPhotoChars(true); } catch (e) { /* 档案库还没准备好就先空着 */ }
        }
        /* 切过去的时候再确认一遍折叠结构。幂等的：已经改造过的直接跳过，
           所以就算哪个 section 被外部重建了，切一次页签也能自愈。 */
        applyFolds();
    };
    subTabs.forEach((b) => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showSub(b.dataset.dnaTab);
        });
    });
    showSub(tab.dataset.sub || 'arch');
    applyFolds();
    /* 角色照片：onclick 赋值天然幂等（bindPanel 每次切页签都会重跑） */
    {
        const q = (n) => tab.querySelector('[data-dna="' + n + '"]');
        const selEl = q('photoChar');
        if (selEl) selEl.onchange = () => { renderPhotoPick(); photoFillPrompt(); };
        /* 勾选框是动态生成的，事件挂在容器上（容器节点本身不会被换掉） */
        const pickBox = q('photoPick');
        if (pickBox) pickBox.onchange = (e) => {
            const t = e.target;
            if (!t || t.type !== 'checkbox') return;
            const name = t.getAttribute('data-pk-in');
            if (!name) return;
            photoPickSet(name, !!t.checked);
            const row = t.closest ? t.closest('.dna-sendfield') : null;
            if (row) row.classList.toggle('is-on', !!t.checked);
            photoFillPrompt();
        };
        const refill = q('photoRefill');
        if (refill) refill.onclick = () => {
            /* 恢复默认勾选（外貌串 + 服装串），再重拼 */
            S.photoPick = PHOTO_PICK_DEFAULT.slice();
            try { saveSettingsDebounced(); } catch (e) { /* 忽略 */ }
            renderPhotoPick();
            photoFillPrompt();
        };
        const clr = q('photoClear');
        if (clr) clr.onclick = () => { const ta = q('photoPrompt'); if (ta) ta.value = ''; };
        const gen = q('photoGen');
        if (gen) gen.onclick = () => onPhotoGen();
        const sav = q('photoSave');
        if (sav) sav.onclick = () => onPhotoSave();
    }
    bindPresetBoxes(tab);

    const fill = () => {
        applyFolds();
        tab.querySelector('[data-dna="enabled"]').checked = !!S.enabled;
        tab.querySelector('[data-dna="autoScan"]').checked = !!S.autoScan;
        tab.querySelector('[data-dna="followChar"]').checked = !!S.followChar;
        tab.querySelector('[data-dna="updateExisting"]').checked = !!S.updateExisting;
        tab.querySelector('[data-dna="replyMaxTokens"]').value = String(S.replyMaxTokens);
        tab.querySelector('[data-dna="notify"]').checked = !!S.notify;
        tab.querySelector('[data-dna="libStream"]').checked = S.libStream !== false;
        tab.querySelector('[data-dna="useRegex"]').checked = !!S.useRegex;
        const rtEl = tab.querySelector('[data-dna="retryCount"]');
        if (rtEl) rtEl.value = S.retryCount;
        tab.querySelector('[data-dna="breakTool"]').checked = !!S.breakTool;
        tab.querySelector('[data-dna="breakTail"]').checked = !!S.breakTail;
        tab.querySelector('[data-dna="scanDepth"]').value = S.scanDepth;
        tab.querySelector('[data-dna="autoEvery"]').value = S.autoEvery;
        const mcEl = tab.querySelector('[data-dna="autoMinChars"]');
        if (mcEl) mcEl.value = String(S.autoMinChars);
        const searchEl = tab.querySelector('[data-dna="search"]');
        if (searchEl) searchEl.value = searchTerm;
        tab.querySelector('[data-dna="uiMode"]').value = S.uiMode || 'auto';
        const gtc = tab.querySelector('[data-dna="genTxtChunk"]');
        if (gtc) gtc.value = String(S.genTxtChunk);
        genTxtRefreshSeg();
        tab.querySelector('[data-dna="sendEnabled"]').checked = !!S.sendEnabled;
        const pe = tab.querySelector('[data-dna="presetEnabled"]');
        if (pe) pe.checked = !!S.presetEnabled;
        const pm = tab.querySelector('[data-dna="presetMergeSystem"]');
        if (pm) pm.checked = S.presetMergeSystem !== false;
        const gpe = tab.querySelector('[data-dna="genPresetEnabled"]');
        if (gpe) gpe.checked = !!S.genPresetEnabled;
        const gpm = tab.querySelector('[data-dna="genPresetMergeSystem"]');
        if (gpm) gpm.checked = S.genPresetMergeSystem !== false;
        const gs = tab.querySelector('[data-dna="genSource"]');
        if (gs) gs.value = S.genSource === 'chatu8' ? 'chatu8' : 'st';
        const gfc = tab.querySelector('[data-dna="genBookFollowCard"]');
        if (gfc) gfc.checked = S.genBookFollowCard !== false;
        const gi = tab.querySelector('[data-dna="genInstruction"]');
        if (gi) gi.value = S.genInstruction || '';
        genTxtRefresh();
        if (!genEntriesCache.length) loadGenSource();
        else { renderGenEntries(); renderGenChars(); renderGenInfo(); }
        updateDerivedUI();
        renderPresetCard('lib');
        renderPresetCard('gen');
        renderPresetCard('ranobe');
        renderAliasBan();
    };

    const onChange = (key, kind) => {
        const el = tab.querySelector('[data-dna="' + key + '"]');
        if (!el) return;
        const read = () => {
            if (kind === 'bool') return !!el.checked;
            if (kind === 'int') {
                const lo = Number(el.min);
                const hi = Number(el.max);
                return clampInt(el.value, Number.isFinite(lo) ? lo : 1, Number.isFinite(hi) ? hi : 300, DEFAULTS[key]);
            }
            if (kind === 'num') return numOr(el.value, DEFAULTS[key]);
            return el.value;
        };
        el.addEventListener('change', () => {
            S[key] = read();
            saveSettings(true);
            updateDerivedUI();
            if (key === 'followChar') { selected = null; renderList(); }
            renderPresetCard('lib');
            renderPresetCard('gen');
            renderPresetCard('ranobe');
        });
        if (el.type === 'text' || el.type === 'password' || el.type === 'number') {
            el.addEventListener('input', () => { S[key] = read(); saveSettings(true); updateDerivedUI(); });
        }
    };

    ['enabled', 'autoScan', 'followChar', 'updateExisting', 'notify', 'libStream', 'useRegex', 'breakTool', 'breakTail'].forEach((k) => onChange(k, 'bool'));
    onChange('scanDepth', 'int');
    onChange('replyMaxTokens', 'int');
    onChange('retryCount', 'int');
    onChange('autoEvery', 'int');
    onChange('autoMinChars', 'int');
    onChange('uiMode', 'str');

    tab.querySelector('[data-dna="scanNow"]').addEventListener('click', () => runScan({ depth: S.scanDepth }));
    ABORT_KEYS.forEach((k) => {
        const b = tab.querySelector('[data-dna="' + k + '"]');
        if (b) b.addEventListener('click', () => doAbort());
    });
    /* ---------- 同人资料库（含世界书生成） ---------- */
    ['ranobe', 'ranobewb'].forEach((tag) => {
        const one = (base, ev, fn) => {
            const el = tab.querySelector('[data-dna="' + tag + base + '"]');
            if (el) el.addEventListener(ev, fn);
        };
        one('Copy', 'click', () => copyAiReply('ranobe'));
        one('ClearReply', 'click', () => clearAiReply('ranobe'));
        one('Import', 'click', () => {
            const f = tab.querySelector('[data-dna="' + tag + 'File"]');
            if (f) f.click();
        });
        one('File', 'change', (e) => {
            const f = e.target && e.target.files && e.target.files[0];
            onLibImportFile(tag, f).then(() => { try { e.target.value = ''; } catch (err) { /* 忽略 */ } });
        });
        one('Export', 'click', () => onLibExport(tag));
        one('Add', 'click', () => openLibEntry(tag, '', true));
        one('Reset', 'click', () => onLibReset(tag));
        /* 同人库的重载要连用户改动一起还原（那边的「恢复内置」已经删掉了）；
           世界书页仍是只重读世界书，不动用户改过的条目 */
        one('Reload', 'click', () => (libScopeOf(tag) === 'wb' ? onLibReload(tag) : onLibReloadRestore(tag)));
        let searchTimer = 0;
        one('Search', 'input', (e) => {
            const st2 = libState(libScopeOf(tag));
            st2.q = String(e.target.value || '');
            st2.page = 1;
            /* 防抖：连着打几个字只渲染最后一次（每敲一下都过一遍全库太奢侈） */
            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchTimer = 0;
                renderLib(tag).catch(() => { /* 忽略 */ });
            }, 120);
        });
        one('Search', 'change', () => saveSettings(true));
        one('IpNew', 'click', () => onIpNew(tag));
        one('IpRename', 'click', () => onIpRename(tag));
        one('LibWipe', 'click', () => onLibWipeAll(tag));
        one('IpClear', 'click', () => onIpClear(tag));
        one('IpExport', 'click', () => onIpExport(tag));
        one('IpDelete', 'click', () => onIpDelete(tag));
        one('BuiltinImport', 'click', () => {
            const f = tab.querySelector('[data-dna="' + tag + 'BuiltinFile"]');
            if (f) f.click();
        });
        one('BuiltinFile', 'change', (e) => {
            const f = e.target && e.target.files && e.target.files[0];
            onBuiltinImport(tag, f).catch((err) => toast('导入内置库失败：' + ((err && err.message) || err), 'error'));
            try { e.target.value = ''; } catch (err) { /* 忽略 */ }
        });
        one('BuiltinSrc', 'change', (e) => {
            const v = String((e.target && e.target.value) || 'zip');
            S.ranobeBuiltinSrc = (v === 'custom') ? 'custom' : 'zip';
            RANOBE_CACHE_TRIED = {};
            saveSettings(true);
            toast(S.ranobeBuiltinSrc === 'custom'
                ? '内置库来源：我导入的那份（点「重载内置库」生效）'
                : '内置库来源：插件自带（点「重载内置库」生效）');
        });
        one('BuiltinExport', 'click', () => onBuiltinExport(tag));
        one('BuiltinDelete', 'click', () => onBuiltinDelete(tag));
        one('IpAddEntry', 'click', () => onIpAddEntry(tag));
        one('IpImport', 'click', () => {
            const f = tab.querySelector('[data-dna="' + tag + 'IpFile"]');
            if (f) f.click();
        });
        one('IpFile', 'change', (e) => {
            const f = e.target && e.target.files && e.target.files[0];
            onIpImport(tag, f);
            try { e.target.value = ''; } catch (err) { /* 忽略 */ }
        });
        one('Ip', 'change', (e) => {
            const st2 = libState(libScopeOf(tag));
            st2.ip = String((e.target && e.target.value) || '');
            st2.page = 1;
            saveSettings(true);
            renderLib(tag).catch(() => { /* 忽略 */ });
        });
        one('Req', 'change', (e) => {
            libState(libScopeOf(tag)).req = String(e.target.value || '');
            saveSettings(true);
        });
        one('SelAll', 'click', () => {
            const scope = libScopeOf(tag);
            const st = libState(scope);
            const q = String(st.q || '').trim().toLowerCase();
            const all = LIB_CACHE[scope] || [];
            const ip = String(st.ip || '');
            const hit = (q ? all.filter((e) => libHit(e, q, scope)) : all)
                .filter((e) => !ip || String(e && e.w == null ? '' : (e && e.w)).trim() === ip)
                .map((e) => e.k);
            const cur = st.sel || [];
            libSaveSel(tag, cur.concat(hit.filter((k) => cur.indexOf(k) < 0)));
        });
        one('SelNone', 'click', () => libSaveSel(tag, []));
        one('Run', 'click', () => onLibDna(tag));
        one('Abort', 'click', () => doAbort());
        one('TestPreview', 'click', () => onLibTest(tag, false));
        one('TestLLM', 'click', () => onLibTest(tag, true));
        one('TestClear', 'click', () => { libSetVal(tag, 'TestPrompt', ''); libSetVal(tag, 'TestResult', ''); });
        /* 列表：勾选 + 编辑按钮（事件委托，列表重渲染也不用重绑） */
        const box = tab.querySelector('[data-dna="' + tag + 'List"]');
        if (box) {
            box.addEventListener('change', (e) => {
                const cb = e.target;
                if (!cb || !cb.getAttribute || !cb.hasAttribute('data-libsel')) return;
                const k = cb.getAttribute('data-libsel');
                const scope = libScopeOf(tag);
                const st = libState(scope);
                const cur = new Set(st.sel || []);
                if (cb.checked) cur.add(k); else cur.delete(k);
                st.sel = Array.from(cur);
                saveSettings(true);
                const row = cb.closest ? cb.closest('.dna-lib-row') : null;
                if (row) row.classList.toggle('is-on', !!cb.checked);
                const nm2 = row ? row.querySelector('.dna-lib-name') : null;
                const pv2 = row ? row.querySelector('.dna-lib-meta') : null;
                if (nm2) nm2.style.opacity = cb.checked ? '1' : '.45';
                if (pv2) pv2.style.opacity = cb.checked ? '.85' : '.4';
                libSetText(tag, 'Meta', '共 ' + (LIB_CACHE[scope] || []).length + ' 条 · 已勾选 ' + libPicked(tag).length);
                onTopRows(box);
            });
            box.addEventListener('click', (e) => {
                /* 翻页条：换页只重渲染列表，不动勾选 */
                const pg = (e.target && e.target.closest) ? e.target.closest('[data-libpage]') : null;
                if (pg) {
                    e.preventDefault();
                    const st2 = libState(libScopeOf(tag));
                    const n = parseInt(pg.getAttribute('data-libpage'), 10);
                    if (n >= 1 && n !== st2.page) {
                        st2.page = n;
                        renderLib(tag).catch(() => { /* 忽略 */ });
                        const lb = libEl(tag, 'List');
                        if (lb && lb.scrollIntoView) { try { lb.scrollIntoView({ block: 'nearest' }); } catch (err) { /* 忽略 */ } }
                    }
                    return;
                }
                const delBtn = (e.target && e.target.closest) ? e.target.closest('[data-libdel]') : null;
                if (delBtn) {
                    e.preventDefault();
                    libDeleteEntry(tag, delBtn.getAttribute('data-libdel'));
                    return;
                }
                const btn = (e.target && e.target.closest) ? e.target.closest('[data-libedit]') : null;
                if (!btn) return;
                e.preventDefault();
                openLibEntry(tag, btn.getAttribute('data-libedit'), false);
            });
        }
        /* 翻页条挪到了列表外面，单独接它的点击 */
        const pgBox = tab.querySelector('[data-dna="' + tag + 'Pager"]');
        if (pgBox) {
            pgBox.addEventListener('click', (e) => {
                const pg = (e.target && e.target.closest) ? e.target.closest('[data-libpage]') : null;
                if (!pg) return;
                e.preventDefault();
                const st2 = libState(libScopeOf(tag));
                const n = parseInt(pg.getAttribute('data-libpage'), 10);
                if (n >= 1 && n !== st2.page) {
                    st2.page = n;
                    renderLib(tag).catch(() => { /* 忽略 */ });
                }
            });
        }
        /* 分类下拉的翻页条（每页 500 个分类），和上面条目的翻页条各接各的 */
        const ipPgBox = tab.querySelector('[data-dna="' + tag + 'IpPager"]');
        if (ipPgBox) {
            ipPgBox.addEventListener('click', (e) => {
                const pg = (e.target && e.target.closest) ? e.target.closest('[data-ippage]') : null;
                if (!pg) return;
                e.preventDefault();
                const st2 = libState(libScopeOf(tag));
                const n = parseInt(pg.getAttribute('data-ippage'), 10);
                if (n >= 1 && n !== st2.ipPage) {
                    st2.ipPage = n;
                    renderLib(tag).catch(() => { /* 忽略 */ });
                }
            });
        }
    });
    /* 发送字段勾选：勾上 = 发，取消 = 不发 */
    tab.querySelector('[data-dna="sendFields"]').addEventListener('change', (e) => {
        const cb = (e.target && e.target.getAttribute) ? e.target.closest('[data-sendfield]') : null;
        if (!cb) return;
        const k = cb.getAttribute('data-sendfield');
        setSendField(k, !!cb.checked);
        const wrap = cb.closest('.dna-sendfield');
        if (wrap) wrap.classList.toggle('is-on', !!cb.checked);
        const fields = tplFields();
        const cnt = tab.querySelector('[data-dna="sendFieldsCount"]');
        if (cnt) cnt.textContent = fields.filter((x) => sendFieldOn(x)).length + ' / ' + fields.length;
        log('发送字段' + (cb.checked ? '打开' : '关闭') + '：' + k);
    });
    tab.querySelector('[data-dna="clearLog"]').addEventListener('click', () => { LOG.length = 0; renderLog(); });

    /* 发送数据 */
    tab.querySelector('[data-dna="sendEnabled"]').addEventListener('change', (e) => {
        S.sendEnabled = !!e.target.checked;
        saveSettings(true);
    });

    bindPresetSection(tab, 'lib');
    bindPresetSection(tab, 'gen');
    bindPresetSection(tab, 'ranobe');

    /* ---------- 手动生成：世界书 + 角色 ---------- */
    tab.querySelector('[data-dna="genSource"]').addEventListener('change', (e) => {
        S.genSource = e.target.value === 'chatu8' ? 'chatu8' : 'st';
        S.genEntries = [];       // 两种来源的条目 key 不通用，换来源就清空勾选
        saveSettings(true);
        /* 从智绘姬世界书切回酒馆时，顺手对一次角色卡绑定的书 */
        followCardWorldBook().then(() => loadGenSource()).catch(() => loadGenSource());
    });
    tab.querySelector('[data-dna="genBook"]').addEventListener('change', (e) => {
        S.genBook = e.target.value || '';
        S.genEntries = [];
        /* 用户主动换书 → 关掉跟随，免得下次进角色卡又被改回去 */
        if (S.genBookFollowCard && S.genBook && S.genBook !== cardWorldBook()) {
            S.genBookFollowCard = false;
            const fb = tab.querySelector('[data-dna="genBookFollowCard"]');
            if (fb) fb.checked = false;
            log('手动选世界书「' + S.genBook + '」，已关闭跟随角色卡');
            toast('已手动选书，跟随角色卡世界书已关闭');
        }
        saveSettings(true);
        loadGenSource();
    });
    tab.querySelector('[data-dna="genBookFollowCard"]').addEventListener('change', async (e) => {
        S.genBookFollowCard = !!e.target.checked;
        saveSettings(true);
        const changed = await followCardWorldBook();
        if (changed) {
            log('世界书已跟随角色卡切到「' + S.genBook + '」');
            toast('已切到角色卡的主世界书「' + S.genBook + '」');
            loadGenSource();
        } else {
            renderGenBookHint();
            toast(S.genBookFollowCard ? '已开启：进入角色卡自动切到它的主世界书' : '已关闭：世界书完全手动选');
        }
    });
    tab.querySelector('[data-dna="genReload"]').addEventListener('click', () => loadGenSource());
    tab.querySelector('[data-dna="genEntrySearch"]').addEventListener('input', () => renderGenEntries());
    tab.querySelector('[data-dna="genEntryList"]').addEventListener('click', (e) => {
        const eye = e.target.closest('[data-genlook]');
        if (!eye) return;
        e.preventDefault();
        e.stopPropagation();
        openGenEntryViewer(eye.dataset.genlook);
    });
    tab.querySelector('[data-dna="genEntryAll"]').addEventListener('click', () => setAllGenEntries(true));
    tab.querySelector('[data-dna="genEntryNone"]').addEventListener('click', () => setAllGenEntries(false));
    tab.querySelector('[data-dna="genEntryList"]').addEventListener('change', (e) => {
        const cb = e.target;
        if (!cb || cb.type !== 'checkbox') return;
        const row = cb.closest('[data-genentry]');
        if (!row) return;
        row.classList.toggle('is-on', !!cb.checked);
        const nmEl = row.querySelector('.dna-entry-name');
        const pvEl = row.querySelector('.st-chatu8-entry-preview');
        if (nmEl) nmEl.style.opacity = cb.checked ? '1' : '.45';
        if (pvEl) pvEl.style.opacity = cb.checked ? '.85' : '.4';
        toggleGenEntry(row.dataset.genentry, !!cb.checked);
        onTopRows(row.parentNode);
    });
    tab.querySelector('[data-dna="genCharSearch"]').addEventListener('input', () => renderGenChars());
    tab.querySelector('[data-dna="genCharAll"]').addEventListener('click', () => setAllGenChars(true));
    tab.querySelector('[data-dna="genCharNone"]').addEventListener('click', () => setAllGenChars(false));
    tab.querySelector('[data-dna="genCharList"]').addEventListener('change', (e) => {
        const cb = e.target;
        if (!cb || cb.type !== 'checkbox') return;
        const row = cb.closest('[data-genchar]');
        if (!row) return;
        row.classList.toggle('is-on', !!cb.checked);
        const nmEl = row.querySelector('.dna-entry-name');
        const pvEl = row.querySelector('.st-chatu8-entry-preview');
        if (nmEl) nmEl.style.opacity = cb.checked ? '1' : '.45';
        if (pvEl) pvEl.style.opacity = cb.checked ? '.85' : '.4';
        toggleGenChar(row.dataset.genchar, !!cb.checked);
        onTopRows(row.parentNode);
    });
    tab.querySelector('[data-dna="genExtraAdd"]').addEventListener('click', () => {
        const inp = tab.querySelector('[data-dna="genExtraName"]');
        const nm = String((inp && inp.value) || '').trim();
        if (!nm) return;
        const list = new Set(S.genExtraChars || []);
        list.add(nm);
        S.genExtraChars = [...list];
        if (inp) inp.value = '';
        saveSettings(true);
        renderGenExtra();
        renderGenInfo();
    });
    tab.querySelector('[data-dna="genExtraName"]').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); tab.querySelector('[data-dna="genExtraAdd"]').click(); }
    });
    tab.querySelector('[data-dna="genExtraList"]').addEventListener('click', (e) => {
        const x = e.target.closest('[data-genextra]');
        if (!x) return;
        S.genExtraChars = (S.genExtraChars || []).filter((n) => n !== x.dataset.genextra);
        saveSettings(true);
        renderGenExtra();
        renderGenInfo();
    });
    tab.querySelector('[data-dna="genInstruction"]').addEventListener('change', (e) => {
        S.genInstruction = e.target.value || '';
        saveSettings(true);
    });
    tab.querySelector('[data-dna="genOutfitSearch"]').addEventListener('input', () => renderGenOutfits());
    tab.querySelector('[data-dna="genOutfitAll"]').addEventListener('click', () => setAllGenOutfits(true));
    tab.querySelector('[data-dna="genOutfitNone"]').addEventListener('click', () => setAllGenOutfits(false));
    tab.querySelector('[data-dna="genOutfitList"]').addEventListener('change', (e) => {
        const cb = e.target;
        if (!cb || cb.type !== 'checkbox') return;
        const row = cb.closest('[data-genoutfit]');
        if (!row) return;
        row.classList.toggle('is-on', !!cb.checked);
        const nmEl = row.querySelector('.dna-entry-name');
        const pvEl = row.querySelector('.st-chatu8-entry-preview');
        if (nmEl) nmEl.style.opacity = cb.checked ? '1' : '.45';
        if (pvEl) pvEl.style.opacity = cb.checked ? '.85' : '.4';
        toggleGenOutfit(row.dataset.genoutfit, !!cb.checked);
        onTopRows(row.parentNode);
    });
    tab.querySelector('[data-dna="genRunWorld"]').addEventListener('click', () => onGenDna('world'));
    tab.querySelector('[data-dna="genRunChars"]').addEventListener('click', () => onGenDna('chars'));

    tab.querySelector('[data-dna="genRunMix"]').addEventListener('click', () => onGenDna('mix'));

    /* ③ 按导入文本生成 */
    tab.querySelector('[data-dna="genTxtPick"]').addEventListener('click', () => onGenTxtPick());
    tab.querySelector('[data-dna="genTxtClearFile"]').addEventListener('click', () => onGenTxtClearFile());
    tab.querySelector('[data-dna="genTxtFile"]').addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        onGenTxtFileChosen(f);
        e.target.value = '';       /* 同一个文件再选一次也要能触发 */
    });
    tab.querySelector('[data-dna="genTxtContent"]').addEventListener('input', (e) => {
        genTxtBody = e.target.value || '';
        genTxtRefresh();
    });
    tab.querySelector('[data-dna="genTxtChunk"]').addEventListener('change', (e) => {
        S.genTxtChunk = clampInt(e.target.value, 0, 200000, 3000);
        e.target.value = String(S.genTxtChunk);
        S.genTxtPart = 0;
        saveSettings(true);
        genTxtRefreshSeg();
    });
    tab.querySelector('[data-dna="genTxtPart"]').addEventListener('change', (e) => {
        S.genTxtPart = clampInt(e.target.value, 0, 9999, 0);
        saveSettings(true);
        genTxtRefreshSeg();
    });
    tab.querySelector('[data-dna="genTxtResplit"]').addEventListener('click', () => {
        genTxtRefreshSeg();
        toast('已按当前上限重新分段');
    });
    tab.querySelector('[data-dna="genTxtContent"]').addEventListener('change', () => genTxtRefreshSeg());
    tab.querySelector('[data-dna="genRunText"]').addEventListener('click', () => onGenDna('text'));
    tab.querySelector('[data-dna="genClear"]').addEventListener('click', () => {
        S.genEntries = [];
        S.genChars = [];
        S.genExtraChars = [];
        saveSettings(true);
        onGenTxtClearFile();
        renderGenEntries();
        renderGenChars();
        log('已清空手动生成的选择');
    });

    /* 正则 & 测试工具（档案库这套：正文过正则 → 组装 → 试跑） */
    tab.querySelector('[data-dna="testRegex"]').addEventListener('click', onTestRegex);
    tab.querySelector('[data-dna="testAssemble"]').addEventListener('click', onTestAssemble);
    tab.querySelector('[data-dna="testLLM"]').addEventListener('click', onTestLLM);
    tab.querySelector('[data-dna="aiReplyLibCopy"]').addEventListener('click', () => copyAiReply('lib'));
    tab.querySelector('[data-dna="aiReplyLibClear"]').addEventListener('click', () => clearAiReply('lib'));
    tab.querySelector('[data-dna="aiReplyGenCopy"]').addEventListener('click', () => copyAiReply('gen'));
    tab.querySelector('[data-dna="aiReplyGenClear"]').addEventListener('click', () => clearAiReply('gen'));
    const saveAllBtn = tab.querySelector('[data-dna="saveAll"]');
    if (saveAllBtn) saveAllBtn.addEventListener('click', () => onSaveAll());
    tab.querySelector('[data-dna="clearTest"]').addEventListener('click', () => {
        ['testInput', 'testCleaned', 'testPrompt', 'testResult'].forEach((k) => setTestField(k, ''));
        testHint('');
    });

    /* 测试工具（手动生成这套：用当前勾选的条目/角色组装 → 预览或试跑，不写档案） */
    const genPrev = tab.querySelector('[data-dna="genTestPreview"]');
    if (genPrev) genPrev.addEventListener('click', onGenTestPreview);
    const genRun = tab.querySelector('[data-dna="genTestLLM"]');
    if (genRun) genRun.addEventListener('click', onGenTestLLM);
    const genClear = tab.querySelector('[data-dna="genClearTest"]');
    if (genClear) genClear.addEventListener('click', () => {
        ['genTestPrompt', 'genTestResult'].forEach((k) => {
            const ta = tab.querySelector('[data-dna="' + k + '"]');
            if (ta) ta.value = '';
        });
        const h = tab.querySelector('[data-dna="genTestHint"]');
        if (h) h.textContent = '';
    });

    bindProfileSection(tab, 'lib');
    bindProfileSection(tab, 'gen');
    bindProfileSection(tab, 'ranobe');

    /* 智绘姬那边换配置时，这边两套都跟着刷新 */
    try {
        const chSel = document.querySelector('#ch-llm_profile_select');
        if (chSel && chSel.dataset.dnaWatch !== '1') {
            chSel.dataset.dnaWatch = '1';
            chSel.addEventListener('change', () => setTimeout(() => {
                ['lib', 'gen', 'ranobe'].forEach((sc) => { fillProfileSelect(sc); renderConfigDetail(sc); updateModelHint(sc); });
            }, 80));
        }
    } catch (e) { /* 忽略 */ }

    const lockAllBtn = tab.querySelector('[data-dna="lockAll"]');
    if (lockAllBtn) lockAllBtn.addEventListener('click', () => setAllLocks(true));
    const unlockAllBtn = tab.querySelector('[data-dna="unlockAll"]');
    if (unlockAllBtn) unlockAllBtn.addEventListener('click', () => setAllLocks(false));

    tab.querySelector('[data-dna="export"]').addEventListener('click', exportRecords);
    tab.querySelector('[data-dna="import"]').addEventListener('click', () => tab.querySelector('[data-dna="file"]').click());
    tab.querySelector('[data-dna="file"]').addEventListener('change', importRecords);

    /* 档案模板 */
    const tplSel = tab.querySelector('[data-dna="tplSelect"]');
    if (tplSel) tplSel.addEventListener('change', () => onTplSelect(tplSel));
    const tplLockBtn = tab.querySelector('[data-dna="tplLock"]');
    if (tplLockBtn) tplLockBtn.addEventListener('click', () => toggleTplLock());
    tab.querySelector('[data-dna="tplNew"]').addEventListener('click', onTplNew);
    tab.querySelector('[data-dna="tplEdit"]').addEventListener('click', onTplEdit);
    tab.querySelector('[data-dna="tplExport"]').addEventListener('click', onTplExport);
    tab.querySelector('[data-dna="tplImport"]').addEventListener('click', () => tab.querySelector('[data-dna="tplFile"]').click());
    tab.querySelector('[data-dna="tplFile"]').addEventListener('change', onTplImport);
    tab.querySelector('[data-dna="tplDelete"]').addEventListener('click', onTplDelete);
    tab.querySelector('[data-dna="tplReset"]').addEventListener('click', onTplReset);
    tab.querySelector('[data-dna="clearAll"]').addEventListener('click', () => {
        const b = bucket(cardKey(), false);
        const n = b ? Object.keys(b.entries).length : 0;
        if (!n) { toast('本库还是空的'); return; }
        if (!confirm('确定清空「' + cardLabel() + '」的 ' + n + ' 份档案？此操作不可撤销。')) return;
        S.records[cardKey()] = { card: cardLabel(), entries: {}, updated: Date.now() };
        saveSettings(true);
        selected = null;
        renderList();
        log('已清空本库档案（' + n + ' 份）');
    });

    const searchBox = tab.querySelector('[data-dna="search"]');
    if (searchBox) {
        searchBox.addEventListener('input', () => {
            searchTerm = String(searchBox.value || '');
            renderList();
        });
    }

    tab.querySelector('[data-dna="list"]').addEventListener('click', (e) => {
        const row = e.target.closest('.dna-item');
        if (!row) return;
        const name = row.dataset.name;
        if (e.target.closest('[data-act="lock"]')) {
            e.stopPropagation();
            toggleLock(name);
            return;
        }
        if (e.target.closest('[data-act="force"]')) {
            e.stopPropagation();
            toggleForceSend(name);
            return;
        }
        if (e.target.closest('[data-act="edit"]')) {
            e.stopPropagation();
            openRecordEditor(name);
            return;
        }
        if (e.target.closest('[data-act="del"]')) {
            if (!confirm('删除「' + name + '」的档案？')) return;
            deleteRecord(name);
            if (selected === name) selected = null;
            renderList();
            log('已删除「' + name + '」');
            return;
        }
        if (e.target.closest('[data-act="copy"]')) {
            const rec = currentEntries()[name];
            if (rec) copyText(buildContent(rec), '已复制「' + name + '」的完整档案');
            return;
        }
        /* 底部详情编辑页已删除：点角色块不再展开第二套编辑界面，改档案走条目上的小铅笔 */
    });

    tab.querySelector('[data-dna="detail"]').addEventListener('click', (e) => {
        /* 历史存档：点「查看」就地展开那一版全文（再点收起） */
        const hvBtn = e.target.closest('[data-histview]');
        if (hvBtn && selected) {
            const i = parseInt(hvBtn.getAttribute('data-histview'), 10);
            const key = selected + '#' + (isNaN(i) ? 0 : i);
            viewingHist = (viewingHist === key) ? '' : key;
            renderList();
            return;
        }
        /* 历史存档：点「回档」把这条档案写回那一版 */
        const hrBtn = e.target.closest('[data-histrestore]');
        if (hrBtn && selected) {
            if (hrBtn.disabled) { toast('这条档案已锁定，先解锁再回档', 'error'); return; }
            const i = parseInt(hrBtn.getAttribute('data-histrestore'), 10);
            onHistRestore(selected, isNaN(i) ? 0 : i);
            return;
        }
        /* 详情里的锁按钮 */
        const lockBtn = e.target.closest('[data-lockdetail]');
        if (lockBtn && selected) {
            toggleLock(selected);
            return;
        }
        /* 改名：整条档案换个键，字段内容 / 锁 / 形态标记都跟着走 */
        const rnBtn = e.target.closest('[data-rename]');
        if (rnBtn && selected) {
            openRenameModal(selected);
            return;
        }
        /* 手动把某个形态设为当前 */
        const curBtn = e.target.closest('[data-formcur]');
        if (curBtn && selected) {
            const base = curBtn.dataset.formcur;
            const nm = curBtn.dataset.formname;
            if (isLocked(nm)) { toast('「' + nm + '」已锁定，先解锁再切换', 'error'); return; }
            const changed = setCurrentForm(base, nm);
            if (!changed.length) { toast('没有可切换的形态'); return; }
            saveSettings(true);
            const nowCur = changed.filter((c) => c.to.indexOf('[当前]') >= 0)[0];
            selected = nowCur ? nowCur.to : selected;
            renderList();
            const fname = formInfo(nm).form || '本体';
            toast('「' + base + '」的当前形态已切到「' + fname + '」');
            log('手动切换形态：' + base + ' → ' + fname + '（[当前] 已移过去）');
            return;
        }
        /* 单个字段的小锁 */
        const flBtn = e.target.closest('[data-lockfield]');
        if (flBtn && selected) {
            toggleFieldLock(selected, flBtn.dataset.lockfield);
            return;
        }
        const histViewBtn = e.target.closest('[data-recedit-histview]');
        if (histViewBtn && selected) {
            openRecordHistoryView(selected, parseInt(histViewBtn.getAttribute('data-recedit-histview'), 10) || 0);
            return;
        }
        const histRestoreBtn = e.target.closest('[data-recedit-histrestore]');
        if (histRestoreBtn && selected) {
            dnaModalClose();
            onHistRestore(selected, parseInt(histRestoreBtn.getAttribute('data-recedit-histrestore'), 10) || 0);
            return;
        }
        const act = e.target.closest('[data-copy]');
        if (!act || !selected) return;
        const rec = currentEntries()[selected];
        if (!rec) return;
        const what = act.dataset.copy;
        if (what === 'all') copyText(buildContent(rec), '已复制完整档案');
        else copyText(String(rec[what] || ''), '已复制「' + what + '」');
    });

    fill();
    renderLog();
}

function copyText(text, okMsg) {
    const done = () => toast(okMsg);
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
            return;
        }
    } catch (e) { /* ignore */ }
    fallbackCopy(text, done);
}

function fallbackCopy(text, done) {
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
    } catch (e) {
        toast('复制失败，请手动选中', 'error');
    }
}

function updateModelHint(scope) {
    const hint = document.querySelector('#dna-tab [data-dna="' + dkey(scope, 'modelHint') + '"]');
    if (!hint) return;
    let ch = null;
    try { ch = extension_settings[CHATU8]; } catch (e) { ch = null; }
    const list = allProfiles();
    const names = Object.keys(list);
    if (!ch) {
        hint.textContent = '没找到智绘姬的配置，请确认智绘姬扩展已启用。';
        return;
    }
    if (!names.length) {
        hint.textContent = '智绘姬里还没有任何 LLM 配置。点「去 LLM 页签编辑」新建一份，填好地址、Key、模型即可。';
        return;
    }
    const p = chatu8Profile(scope);
    if (!p) {
        hint.textContent = '当前选中的配置不存在了，请在上面的下拉框里重新选一份。';
        return;
    }
    if (String(p.channel_type || 'openai') === 'vertex') {
        hint.textContent = '这份配置是 Vertex 渠道，档案库只走 OpenAI 兼容接口，请到 LLM 页签切成 OpenAI 渠道。';
        return;
    }
    if (!String(p.api_url || '').trim()) { hint.textContent = '这份配置还没填 API Base URL，去 LLM 页签补上。'; return; }
    if (!String(p.model || '').trim()) { hint.textContent = '这份配置还没选模型，去 LLM 页签选一个。'; return; }
    hint.textContent = '记录时会用这份配置（共 ' + names.length + ' 份配置可选）。要改里面的内容，去 LLM 页签编辑。';
}

function updateDerivedUI() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const autoState = tab.querySelector('[data-dna="autoState"]');
    if (autoState) {
        const needC = clampInt(S.autoMinChars, 0, 100000, 0);
        autoState.textContent = S.autoScan
            ? ('自动记录已开启 · 每 ' + S.autoEvery + ' 层' + (needC > 0 ? (' · 正文≥' + needC + ' 字') : ''))
            : '自动记录已关闭';
    }
    const dot = tab.querySelector('.dna-dot');
    if (dot) {
        dot.classList.toggle('dna-dot-on', !!S.enabled && !scanning);
        dot.classList.toggle('dna-dot-busy', !!scanning);
    }
    const label = tab.querySelector('[data-dna="cardLabel"]');
    if (label) label.textContent = cardLabel();
    const hint = tab.querySelector('[data-dna="storeHint"]');
    if (hint) {
        hint.textContent = S.followChar
            ? '每张角色卡各存一份，切换角色卡自动切换档案库'
            : '所有角色卡共用同一份档案库';
    }
    refreshLLMCard();
    renderRegexInfo();
    applyUiMode();
    /* 复位防重入标记：面板以后再被重建，还能再自愈一次 */
    try { delete tab.dataset.binding; } catch (e) { /* 忽略 */ }
}

function refreshLLMCard() {
    ['lib', 'gen', 'ranobe'].forEach((sc) => {
        fillProfileSelect(sc);
        renderConfigDetail(sc);
        updateModelHint(sc);
    });
}

/* 搜索：角色名 / 本名 / 形态名 / 别称 任意一个包含搜索词就算命中 */
function hitSearch(x, q, entries) {
    if (!q) return true;
    const rec = (entries && entries[x.name]) || {};
    const bag = [x.name, x.info.base, x.info.form, String(rec[ALIAS_FIELD] || ''), String(rec['姓名'] || '')];
    return bag.some((v) => String(v == null ? '' : v).toLowerCase().indexOf(q) >= 0);
}

function renderList() {
    /* 详情区的历史存档区靠注入的兜底样式，dna.css 被缓存时也不至于挤歪 */
    try { ensurePresetEntryStyle(); } catch (e) { /* 忽略 */ }
    /* 列表每次渲染前顺手检查一次绑定：面板要是被重建过，这里能把监听补回来，
       否则编辑/锁/删除这些按钮会全部变成死的。 */
    try { bindPanel(); } catch (e) { /* 忽略 */ }
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const listBox = tab.querySelector('[data-dna="list"]');
    const detail = tab.querySelector('[data-dna="detail"]');
    const cnt = tab.querySelector('[data-dna="count"]');
    if (!listBox) return;

    updateDerivedUI();
    try { migrateFieldLocks(); } catch (e) { /* 迁移失败不影响查看 */ }
    try { sanitizeAliases(); } catch (e) { /* 清别称失败就下次再说 */ }
    const entries = currentEntries();
    /* 列表顺序按「本名」分组：同一角色的各个形态排在一起，[当前] 形态排最前 */
    const groups = formGroups();
    const allOrdered = [];
    for (const base of [...groups.keys()].sort((a, b) => String(a).localeCompare(String(b), 'zh'))) {
        for (const x of groups.get(base)) allOrdered.push(x);
    }
    const q = String(searchTerm || '').trim().toLowerCase();
    const ordered = q ? allOrdered.filter((x) => hitSearch(x, q, entries)) : allOrdered;
    const names = ordered.map((x) => x.name);
    if (selected && !names.includes(selected)) { selected = null; viewingHist = ''; }
    if (cnt) cnt.textContent = q ? (names.length + ' / ' + allOrdered.length) : String(allOrdered.length);
    const lkCnt = tab.querySelector('[data-dna="lockCount"]');
    if (lkCnt) {
        /* 一条都没锁的时候不显示这个标签——默认状态就是全解锁，界面上不占地方 */
        const nLk = names.filter((n) => entries[n] && entries[n]._locked).length;
        lkCnt.textContent = nLk ? ('已锁 ' + nLk + ' / ' + names.length) : '';
        lkCnt.style.display = nLk ? '' : 'none';
        lkCnt.classList.toggle('dna-badge-warn', nLk > 0);
    }

    if (!names.length) {
        listBox.innerHTML = '<div class="dna-empty">'
            + (q ? ('没有匹配「' + esc(String(searchTerm || '').trim()) + '」的档案。')
                 : '这个档案库还是空的。点「立即记录」或等自动记录攒几条。')
            + '</div>';
        if (detail) { detail.style.display = 'none'; detail.innerHTML = ''; }
        const sp0 = tab.querySelector('.dna-split');
        if (sp0) sp0.classList.add('dna-split-solo');
        return;
    }

    listBox.innerHTML = ordered.map((x) => {
        const n = x.name;
        const rec = entries[n] || {};
        const active = (selected === n) ? ' dna-item-active' : '';
        const lk = !!rec._locked;
        const forced = !!rec._forceSend;
        const fi = x.info;
        const aliases = aliasSplit(rec[ALIAS_FIELD]);
        const aliasHtml = aliases.length
            ? '<span class="dna-item-alias" title="别称：' + esc(aliases.join(ALIAS_SEP)) + '">' + esc(aliases.join(ALIAS_SEP)) + '</span>'
            : '';
        /* 形态档案：显示「本名 · 形态名」+ 状态徽标，一眼看出是同一个人的不同形态 */
        const nameHtml = fi.isForm
            ? ('<span class="dna-form-base">' + esc(fi.base) + '</span>' +
                (fi.form ? '<span class="dna-form-sep">·</span><span class="dna-form-name">' + esc(fi.form) + '</span>' : '') +
                (fi.tag ? '<span class="dna-form-tag' +
                    (fi.isCurrent ? ' is-cur' : (fi.isSealed ? ' is-seal' : '')) + '">' + esc(fi.tag) + '</span>' : ''))
            : esc(n);
        /* 第二行小字：更新时间 + 这条现在的状态（强制发送 / 已锁定） */
        const subBits = [esc(fmtTime(rec._updated))];
        if (forced) subBits.push('强制发送');
        if (lk) subBits.push('已锁定');
        return '<div class="dna-item' + active + (lk ? ' dna-item-locked' : '') + (fi.isForm ? ' dna-item-form' : '') + '" data-name="' + esc(n) + '">' +
            '<span class="dna-item-main">' +
            '<span class="dna-item-name">' + (lk ? '<i class="fa-solid fa-lock dna-lock-ico"></i>' : '') + nameHtml + aliasHtml + '</span>' +
            '<span class="dna-item-sub">' + subBits.join(' · ') + '</span>' +
            '</span>' +
            '<span class="dna-item-acts">' +
            '<button class="dna-mini dna-mini-lock' + (lk ? ' is-locked' : '') + '" data-act="lock" title="' +
            (lk ? '已锁定：AI 不会改这条（点一下解锁）' : '未锁定：点一下锁住，AI 就不会再改这条') + '">' +
            '<i class="fa-solid ' + (lk ? 'fa-lock' : 'fa-lock-open') + '"></i></button>' +
            '<button class="dna-mini dna-mini-force' + (forced ? ' is-on' : '') + '" data-act="force" title="' +
            (forced ? '强制发送已开：以后每次发送都会带上这条（不管正文提没提到）' : '强制发送：打开后每次发送都会带上这条档案，不管正文提没提到') + '">' +
            '<i class="fa-solid fa-paper-plane"></i></button>' +
            '<button class="dna-mini" data-act="edit" title="编辑这条档案：名字 + 所有字段内容"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="dna-mini" data-act="copy" title="复制完整档案">复制</button>' +
            '<button class="dna-mini dna-mini-del" data-act="del" title="删除">×</button>' +
            '</span>' +
            '</div>';
    }).join('');

    if (!detail) return;
    /* 底部详情页整个删掉：改档案只走列表条目上的小铅笔弹窗（名字 / 字段 / 字段锁 / 历史存档都在那） */
    detail.style.display = 'none';
    detail.innerHTML = '';
    const spAll = tab.querySelector('.dna-split');
    if (spAll) spAll.classList.add('dna-split-solo');
}

/* ---------- 发送字段勾选 ---------- */
/* 没记录过 = 发。姓名永远发：档案块没有名字，AI 认不出这条是谁。 */
function sendFieldOn(k) {
    const bag = S.sendFields || {};
    return bag[k] !== false;
}

function setSendField(k, on) {
    if (!k) return;
    if (!S.sendFields || typeof S.sendFields !== 'object' || Array.isArray(S.sendFields)) S.sendFields = {};
    if (on) delete S.sendFields[k];
    else S.sendFields[k] = false;
    saveSettings(true);
}

/* 模板页签里那排勾选：勾上的才会跟着「发送数据」一起发 */
function renderSendFieldsUI() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const box = tab.querySelector('[data-dna="sendFields"]');
    if (!box) return;
    const fields = tplFields();
    const onCnt = fields.filter((k) => sendFieldOn(k)).length;
    const cnt = tab.querySelector('[data-dna="sendFieldsCount"]');
    if (cnt) cnt.textContent = onCnt + ' / ' + fields.length;
    /* 开关用本体那套滑块（st-chatu8-entry-toggle + st-chatu8-slider），
       跟「上下文预设」条目里的开关是同一个组件；外层不能用 label，
       否则点一下 label 会再补一次点击，两次切换互相抵消。 */
    box.innerHTML = fields.map((k) => {
        const on = sendFieldOn(k);
        return '<div class="dna-sendfield' + (on ? ' is-on' : '') + '">' +
            '<span class="dna-sendfield-name" title="' + esc(k) + '">' + esc(k) + '</span>' +
            '<div class="st-chatu8-entry-toggle" title="' + (on ? '正在发送，点一下不发' : '不发，点一下发') + '">' +
            '<input type="checkbox" data-sendfield="' + esc(k) + '"' + (on ? ' checked' : '') + '>' +
            '<span class="st-chatu8-slider"></span>' +
            '</div>' +
            '</div>';
    }).join('');
}

/* 编辑器里每个字段的那把小锁：点了就地切换，不用退出去再进详情面板 */
function recLockBtnHtml(k, locked) {
    return '<button type="button" class="dna-mini dna-mini-lock dna-rec-lock' + (locked ? ' is-locked' : '') +
        '" data-reclock="' + esc(k) + '" title="' +
        (locked
            ? '这个字段已锁：AI 不会改写它，也不能手动编辑（点一下解锁）'
            : '未锁：点一下锁住这个字段，AI 和手动编辑都不会再改它') + '">' +
        '<i class="fa-solid ' + (locked ? 'fa-lock' : 'fa-lock-open') + '"></i></button>';
}

/* 点列表里的铅笔：名字 + 所有字段 + 历史存档一起管理。 */
function recordHistoryEditorHtml(name, rec) {
    const hist = Array.isArray(rec._hist) ? rec._hist.filter((x) => x && typeof x === 'object') : [];
    let html = '<div class="dna-modal-sec"><i class="fa-solid fa-clock-rotate-left"></i>历史存档' +
        '<span class="dna-hist-n">' + hist.length + ' / ' + HIST_MAX + '</span></div>';
    if (!hist.length) return html + '<div class="dna-hist-empty">还没有历史存档。角色下次被更新时，更新前的版本会自动保存在这里。</div>';
    html += '<div class="dna-hist-editor-list">';
    for (let i = 0; i < hist.length; i++) {
        const h = hist[i];
        html += '<div class="dna-hist-item"><div class="dna-hist-main">' +
            '<span class="dna-hist-t">' + (i + 1) + ' · ' + esc(fmtTime(h._updated) || '（没有时间）') +
            (h._floor ? (' · 第' + esc(h._floor) + '层') : '') + '</span>' +
            '<span class="dna-hist-acts"><button type="button" class="dna-mini" data-recedit-histview="' + i + '">查看</button>' +
            '<button type="button" class="dna-mini dna-mini-hist" data-recedit-histrestore="' + i + '"' +
            (rec._locked ? ' disabled title="已锁定，先解锁再回档"' : ' title="回档到这一版"') + '>回档</button></span>' +
            '</div></div>';
    }
    return html + '</div>';
}

/* 把编辑框里已经改了、还没保存的内容存一份（跳去看历史再回来时填回去） */
function captureRecordDraft(name) {
    if (!dnaModalMask) return null;
    const d = { name, title: '', fields: Object.create(null) };
    const nameEl = dnaModalMask.querySelector('[data-rec-name]');
    if (nameEl) d.title = nameEl.value;
    dnaModalMask.querySelectorAll('[data-rec]').forEach((ta) => {
        if (ta.hasAttribute('readonly')) return;
        d.fields[ta.getAttribute('data-rec')] = ta.value;
    });
    return d;
}

function openRecordHistoryView(name, idx) {
    const rec = currentEntries()[name];
    const hist = rec && Array.isArray(rec._hist) ? rec._hist : [];
    const h = hist[idx];
    if (!h) return;
    const body = '<div class="dna-modal-meta">「' + esc(name) + '」历史存档 · ' + esc(fmtTime(h._updated) || '（没有时间）') + '</div>' +
        tplDetailFields(h).map((k) => '<div class="dna-modal-field"><label>' + esc(k) + '</label><div class="dna-field-v">' +
            (h[k] ? esc(String(h[k])) : '<span class="dna-empty-inline">（空）</span>') + '</div></div>').join('') +
        '<div class="st-chatu8-edit-buttons dna-modal-foot">' +
        '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>返回编辑</button>' +
        '<button type="button" class="st-chatu8-edit-button send" data-recedit-histrestore="' + idx + '">回档到这一版</button></div>';
    const mask = dnaModalOpen('查看历史存档', body);
    if (!mask) return;
    /* 这一层只是「看一眼」：× / 点空白 / 返回编辑 全都是回到编辑弹窗，没保存的改动也带回去 */
    dnaModalBack = () => openRecordEditor(name);
    /* 「返回编辑」按钮：这个弹窗没走 dnaModalWire，要自己接线，否则点了没反应 */
    const hCancel = mask.querySelector('[data-modal-cancel]');
    if (hCancel) hCancel.addEventListener('click', () => dnaModalClose());
    const restore = mask.querySelector('[data-recedit-histrestore]');
    if (restore) restore.addEventListener('click', () => {
        if (onHistRestore(name, idx)) {
            dnaModalBack = null;
            REC_EDIT_DRAFT = null;
            openRecordEditor(name);   /* 回到编辑页，显示刚回档的那一版 */
        }
    });
}

function openRecordEditor(name) {
    const rec0 = currentEntries()[name];
    if (!rec0) { toast('这条档案已经不存在了', 'error'); return; }
    if (rec0._locked) { toast('「' + name + '」已锁定，先点小锁解锁再改', 'error'); return; }
    const fields = tplDetailFields(rec0);
    const rowsHtml = fields.map((k) => {
        const flock = fieldLocked(name, k);
        return '<div class="dna-modal-field dna-rec-field' + (flock ? ' is-locked' : '') + '">' +
            '<label>' + esc(k) + recLockBtnHtml(k, flock) +
                '<span class="dna-rec-locktag"' + (flock ? '' : ' style="display:none"') + '>' +
                '<i class="fa-solid fa-lock"></i>已锁，改不了</span>' +
            '</label>' +
            '<textarea class="st-chatu8-edit-input dna-mono" data-rec="' + esc(k) + '" rows="3"' +
                (flock ? ' readonly' : '') + '>' + esc(rec0[k] || '') + '</textarea>' +
            '</div>';
    }).join('');
    dnaModalOpen('编辑档案「' + name + '」',
        '<div class="dna-modal-sec"><i class="fa-solid fa-id-card"></i>名字</div>' +
        '<div class="dna-modal-row"><label>这条档案叫什么</label>' +
            '<input type="text" class="st-chatu8-text-input" data-rec-name value="' + esc(name) + '"></div>' +
        (fields.length ? '<div class="dna-modal-sec"><i class="fa-solid fa-list-check"></i>字段内容</div>' + rowsHtml : '') +
        recordHistoryEditorHtml(name, rec0) +
        '<div class="st-chatu8-edit-buttons dna-modal-foot">' +
            '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>取消</button>' +
            '<button type="button" class="st-chatu8-edit-button send" data-modal-save>保存</button>' +
        '</div>');
    /* 从历史存档查看页返回：把刚才还没保存的改动填回编辑框 */
    if (REC_EDIT_DRAFT && REC_EDIT_DRAFT.name === name && dnaModalMask) {
        const d = REC_EDIT_DRAFT;
        REC_EDIT_DRAFT = null;
        const nameEl2 = dnaModalMask.querySelector('[data-rec-name]');
        if (nameEl2 && d.title) nameEl2.value = d.title;
        dnaModalMask.querySelectorAll('[data-rec]').forEach((ta) => {
            if (ta.hasAttribute('readonly')) return;
            const k = ta.getAttribute('data-rec');
            if (d.fields && d.fields[k] !== undefined) ta.value = d.fields[k];
        });
    }
    const modalHistView = dnaModalMask && dnaModalMask.querySelectorAll('[data-recedit-histview]');
    if (modalHistView) modalHistView.forEach((btn) => btn.addEventListener('click', () => {
        REC_EDIT_DRAFT = captureRecordDraft(name);
        openRecordHistoryView(name, parseInt(btn.getAttribute('data-recedit-histview'), 10) || 0);
    }));
    const modalHistRestore = dnaModalMask && dnaModalMask.querySelectorAll('[data-recedit-histrestore]');
    if (modalHistRestore) modalHistRestore.forEach((btn) => btn.addEventListener('click', () => {
        const hi = parseInt(btn.getAttribute('data-recedit-histrestore'), 10) || 0;
        if (onHistRestore(name, hi)) {
            dnaModalBack = null;
            REC_EDIT_DRAFT = null;
            openRecordEditor(name);   /* 回档后留在编辑页，看到的就是回档后的内容 */
        }
    }));
    dnaModalWire((mask) => {
        const list = currentEntries();
        const rec = list[name];
        if (!rec) { toast('这条档案已经不存在了', 'error'); dnaModalClose(); return; }
        const nameEl = mask.querySelector('[data-rec-name]');
        let nm = String((nameEl && nameEl.value) || '').trim();
        if (!nm) nm = name;
        const before = snapshotRecord(rec);
        if (nm !== name) {
            if (list[nm]) { toast('已经有同名档案了：' + nm, 'error'); return; }
            delete list[name];
            list[nm] = rec;
            rec['姓名'] = nm;
            try { moveFieldLocks(name, nm); } catch (e) { /* 锁搬不动不影响内容保存 */ }
            if (selected === name) selected = nm;
        }
        const dropped = [];
        let changed = 0;
        mask.querySelectorAll('[data-rec]').forEach((ta) => {
            if (ta.hasAttribute('readonly')) return;
            const k = ta.getAttribute('data-rec');
            let v = ta.value;
            if (k === ALIAS_FIELD) {
                /* 手动改别称也走同一套过滤：关系 / 职业泛称不入库 */
                const clean = aliasClean(v);
                if (clean !== v) {
                    aliasSplit(v).forEach((a) => {
                        if (aliasIsGeneric(a) && dropped.indexOf(a) < 0) dropped.push(a);
                    });
                    v = clean;
                }
            }
            if (String(rec[k] == null ? '' : rec[k]) !== v) { rec[k] = v; changed++; }
        });
        if (changed || nm !== name) rec._hist = [before].concat(Array.isArray(rec._hist) ? rec._hist : []).slice(0, HIST_MAX);
        rec._updated = Date.now();
        const b = bucket(cardKey(), false);
        if (b) b.updated = Date.now();
        saveSettings(true);
        ALIAS_SHARED = null;
        dnaModalClose();
        renderList();
        log('已编辑档案「' + nm + '」：' + changed + ' 个字段有改动'
            + (nm !== name ? ('（改名自「' + name + '」）') : ''));
        toast(changed || nm !== name
            ? ('已保存' + (nm !== name ? '，改名为「' + nm + '」' : ('，改了 ' + changed + ' 个字段')))
            : '内容没有变化');
        if (dropped.length) {
            toast('「' + dropped.slice(0, 3).join('、') + '」这类关系称呼不能当别称，没存', 'error');
        }
    });
    /* 小锁就地切换：只改这一块的观感，不重画弹窗（否则已经敲进去的字会丢） */
    const mask0 = dnaModalMask;
    if (mask0) mask0.addEventListener('click', (e) => {
        const b = (e.target && e.target.closest) ? e.target.closest('[data-reclock]') : null;
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        const k = b.getAttribute('data-reclock');
        const now = !fieldLocked(name, k);
        toggleFieldLock(name, k);        /* 存盘 + 提示 + 重画列表 */
        b.classList.toggle('is-locked', now);
        b.innerHTML = '<i class="fa-solid ' + (now ? 'fa-lock' : 'fa-lock-open') + '"></i>';
        b.title = now
            ? '这个字段已锁：AI 不会改写它，也不能手动编辑（点一下解锁）'
            : '未锁：点一下锁住这个字段，AI 和手动编辑都不会再改它';
        const wrap = b.closest('.dna-rec-field');
        if (wrap) {
            wrap.classList.toggle('is-locked', now);
            const tag = wrap.querySelector('.dna-rec-locktag');
            if (tag) tag.style.display = now ? '' : 'none';
            const ta = wrap.querySelector('textarea[data-rec]');
            if (ta) {
                if (now) ta.setAttribute('readonly', 'readonly');
                else ta.removeAttribute('readonly');
            }
        }
    });
}

/* 改档案名：整条档案换一个键，字段内容 / 锁 / 形态标记都跟着走 */
function openRenameModal(oldName) {
    const rec0 = currentEntries()[oldName];
    if (!rec0) return;
    if (rec0._locked) { toast('「' + oldName + '」已锁定，先点小锁解锁再改名', 'error'); return; }
    dnaModalOpen('修改档案名',
        '<div class="dna-modal-row"><label>新名字</label>' +
        '<input type="text" class="st-chatu8-text-input" data-rn="name" value="' + esc(oldName) + '"></div>' +
        '<div class="st-chatu8-edit-buttons dna-modal-foot">' +
        '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>取消</button>' +
        '<button type="button" class="st-chatu8-edit-button send" data-modal-save>保存</button></div>');
    dnaModalWire((mask) => {
        const input = mask.querySelector('[data-rn="name"]');
        const nm = String((input && input.value) || '').trim();
        if (!nm) { toast('名字不能为空', 'error'); return; }
        if (nm === oldName) { dnaModalClose(); return; }
        const list = currentEntries();
        if (list[nm]) { toast('已经有同名档案了：' + nm, 'error'); return; }
        const rec = list[oldName];
        if (!rec) { dnaModalClose(); return; }
        delete list[oldName];
        rec['姓名'] = nm;
        rec._updated = Date.now();
        list[nm] = rec;
        try { moveFieldLocks(oldName, nm); } catch (e) { /* 锁搬不动不影响改名 */ }
        const b = bucket(cardKey(), false);
        if (b) b.updated = Date.now();
        if (selected === oldName) selected = nm;
        saveSettings(true);
        dnaModalClose();
        renderList();
        log('档案改名：' + oldName + ' → ' + nm);
        toast('已改名为「' + nm + '」');
    });
}

/* ------------------------------ 档案模板 UI ------------------------------ */
function tplNames() {
    return Object.keys(S.dnaTemplates || {});
}

function renderTemplateUI() {
    const tab = document.querySelector('#dna-tab');
    if (!tab) return;
    const lk = tplLocked();
    const sel = tab.querySelector('[data-dna="tplSelect"]');
    if (sel) {
        sel.innerHTML = '<option value="">默认模板（内置）</option>' +
            tplNames().map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('');
        sel.value = tplIsDefault() ? '' : tplNameOfCard();
        sel.disabled = lk;                       /* 锁住就不许从这儿改 */
    }
    const lockBtn = tab.querySelector('[data-dna="tplLock"]');
    if (lockBtn) {
        lockBtn.classList.toggle('is-locked', lk);
        lockBtn.innerHTML = '<i class="fa-solid ' + (lk ? 'fa-lock' : 'fa-lock-open') + '"></i><span>' + (lk ? '已锁定' : '锁定') + '</span>';
        lockBtn.title = lk
            ? ('已锁定：这张角色卡固定用「' + (tplIsDefault() ? '默认模板（内置）' : tplNameOfCard()) + '」，点一下解锁')
            : '锁定：这张角色卡就固定用这份模板，随时可以再点开解锁';
    }
    const badge = tab.querySelector('[data-dna="tplBadge"]');
    if (badge) badge.textContent = tplIsDefault() ? '默认模板（内置）' : tplNameOfCard();
    const hint = tab.querySelector('[data-dna="tplHint"]');
    if (hint) hint.textContent = tplFields().length + ' 个字段（字段规范 / 输出格式由上下文预设提供）';
    const pv = tab.querySelector('[data-dna="tplPreview"]');
    if (pv) pv.value = JSON.stringify(templateExport(''), null, 2);
    renderSendFieldsUI();
}

function onTplSelect(sel) {
    const v = String((sel && sel.value) || '');
    if (tplLocked()) {
        toast('这张角色卡的模板已锁定，先点「已锁定」解锁再换');
        renderTemplateUI();
        return;
    }
    setTplNameOfCard(v);
    saveSettings(true);
    renderTemplateUI();
    /* 模板一换，字段顺序就变了，列表和详情跟着重画一遍 */
    try { renderList(); } catch (e) { /* 面板还没建好就算了 */ }
    log('档案模板切到：' + (tplIsDefault() ? '默认模板' : tplNameOfCard()) + '（只对当前这张卡生效）');
}

function onTplExport() {
    const payload = templateExport('');
    if (!payload) { toast('没有可导出的模板'); return; }
    try { payload.name = payload.name || '默认模板'; } catch (e) { /* 忽略 */ }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = String(payload.name).replace(/[\\/:*?"<>|]/g, '_');
    a.href = url;
    a.download = 'DNA档案模板_' + safe + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    log('已导出模板：' + payload.name);
    toast('已导出模板：' + payload.name);
}

/* 一个文件里可以放一份，也可以放多份（数组 / {templates:{名:…}}） */
function onTplImport(ev) {
    const input = ev.target;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(String(reader.result || ''));
            const list = [];
            if (Array.isArray(data)) list.push.apply(list, data);
            else if (data && Array.isArray(data.templates)) list.push.apply(list, data.templates);
            else if (data && data.templates && typeof data.templates === 'object') {
                for (const k of Object.keys(data.templates)) {
                    list.push(Object.assign({ name: k }, data.templates[k] || {}));
                }
            } else if (data && typeof data === 'object') list.push(data);
            if (!list.length) throw new Error('文件里没找到模板');
            const names = [];
            for (let i = 0; i < list.length; i++) {
                const t = normalizeTemplate(list[i], '导入模板' + (i + 1));
                S.dnaTemplates[t.name] = t;
                names.push(t.name);
            }
            const switched = setTplNameOfCard(names[names.length - 1] || '');
            saveSettings(true);
            renderTemplateUI();
            log('导入模板 ' + names.length + ' 份：' + names.join('、'));
            toast(switched
                ? ('导入模板 ' + names.length + ' 份，已切到「' + names[names.length - 1] + '」')
                : ('导入模板 ' + names.length + ' 份（这张卡已锁定，模板没切过去）'));
        } catch (e) {
            log('模板导入失败：' + (e && e.message ? e.message : e), 'error');
            toast('模板导入失败：' + (e && e.message ? e.message : e), 'error');
        } finally {
            input.value = '';
        }
    };
    reader.readAsText(file, 'utf-8');
}

function onTplDelete() {
    if (tplIsDefault()) { toast('默认模板是内置的，删不掉'); return; }
    const nm = tplNameOfCard();
    const lockedCards = Object.keys(S.dnaTplLock || {}).filter((k) => (S.dnaTemplatesByCard || {})[k] === nm).length;
    if (!confirm('删除模板「' + nm + '」？（已经在档案里的内容不受影响）'
        + (lockedCards ? ('\n有 ' + lockedCards + ' 张角色卡锁定着这份模板，删掉后它们会回到默认模板。') : ''))) return;
    delete S.dnaTemplates[nm];
    setTplNameOfCard('');
    saveSettings(true);
    renderTemplateUI();
    log('已删除模板：' + nm + '（回到默认模板）');
    toast('已删除模板：' + nm);
}

function onTplReset() {
    if (tplLocked()) { toast('这张角色卡的模板已锁定，先点「已锁定」解锁'); return; }
    setTplNameOfCard('');
    saveSettings(true);
    renderTemplateUI();
    toast('已切回默认模板');
}

/* 模板只提供字段表，提示词在预设里 —— 这句在面板和编辑弹窗里各露一次 */
const TPL_SYNC_NOTE = '模板决定这份档案有哪些字段。新增的字段会自动补进提示词的字段清单；如果预设里写了固定的字段表，以模板这份为准。';

/* 打开模板编辑器：name 留空 = 新建（用当前模板的字段做底，方便二创） */
/* name 为空 = 新建；给了名字 = 修改那份模板。
   prefill 只在「新建」时有意义：true = 拿当前模板的字段起步（从默认模板复制出来用），
   false = 空白起步。以前新建也照抄当前模板，所以点「编辑」和「新建」看起来一模一样。 */
function openTplEditor(name, prefill) {
    const key = String(name || '');
    const bag = S.dnaTemplates || {};
    const cur = (key && bag[key]) ? bag[key] : null;
    const isNew = !cur;
    const tname = cur ? String(cur.name || key) : ('模板 ' + (tplNames().length + 1));
    const startFields = cur ? (cur.fields || []) : (prefill ? tplFields() : ['姓名']);
    const fields = startFields.join('\n');
    const body =
        '<div class="dna-modal-row"><label>模板名</label>' +
        '<input type="text" class="st-chatu8-text-input" data-tf="name" value="' + esc(tname) + '"></div>' +
        (isNew
            ? '<div class="dna-hint">空白起步：一行一个字段名，写什么就按这个顺序输出什么。想拿当前模板改，用「编辑模板」或者先复制一份。</div>'
            : '<div class="dna-hint">保存后会直接覆盖模板「' + esc(tname) + '」，正在用这份模板的角色卡下一轮就按新字段走。</div>') +
        '<div class="dna-modal-field"><label>字段（一行一个，按这个顺序输出；姓名必须第一个）</label>' +
        '<textarea class="st-chatu8-edit-input dna-mono" data-tf="fields" rows="14">' + esc(fields) + '</textarea></div>' +
        '' +
        '' +
        '<div class="st-chatu8-edit-buttons dna-modal-foot">' +
        '<button type="button" class="st-chatu8-edit-button cancel" data-modal-cancel>取消</button>' +
        '<button type="button" class="st-chatu8-edit-button send" data-modal-save>' +
        (isNew ? '创建模板' : '保存修改') + '</button></div>';
    dnaModalOpen(isNew ? '新建模板' : ('修改当前模板 · ' + tname), body);
    dnaModalWire((mask) => {
        try {
            const nmIn = mask.querySelector('[data-tf="name"]');
            const fdIn = mask.querySelector('[data-tf="fields"]');
            const nm = String((nmIn && nmIn.value) || '').trim();
            const fd = String((fdIn && fdIn.value) || '');
            const t = normalizeTemplate({ name: nm || tname, fields: fd }, '未命名模板');
            S.dnaTemplates = S.dnaTemplates || {};
            if (S.dnaTemplates[t.name] && (!cur || t.name !== key)) {
                toast('已经有同名模板「' + t.name + '」，换个名字');
                return;
            }
            if (cur && key && key !== t.name) delete S.dnaTemplates[key];
            S.dnaTemplates[t.name] = t;
            const switched = setTplNameOfCard(t.name);
            saveSettings(true);
            renderTemplateUI();
            dnaModalClose();
            log('保存档案模板：' + t.name + '（' + t.fields.length + ' 个字段）');
            toast(switched
                ? ('已保存模板「' + t.name + '」，记得同步改上下文预设')
                : ('已保存模板「' + t.name + '」（这张卡已锁定，模板没切过去）'));
        } catch (e) {
            toast('保存失败：' + (e && e.message ? e.message : e), 'error');
        }
    });
}

/* 新建：空白起步 */
function onTplNew() {
    openTplEditor('');
}

/* 编辑：改当前这张卡正在用的那份模板 */
function onTplEdit() {
    if (tplIsDefault()) {
        if (!confirm('现在的模板是内置的「默认模板」，改不了。要基于它复制一份新模板来改吗？')) return;
        openTplEditor('', true);      /* 带着默认模板那套字段起步 */
        return;
    }
    openTplEditor(tplNameOfCard());
}

/* ------------------------------ 导入 / 导出 ------------------------------ */
function exportRecords() {
    const key = cardKey();
    const b = bucket(key, false);
    const entries = (b && b.entries) || {};
    const n = Object.keys(entries).length;
    if (!n) { toast('本库还没有档案可导出'); return; }
    const payload = {
        type: 'st-chatu8-dna',
        version: 3,
        card: cardLabel(),
        cardKey: key,
        exportedAt: new Date().toISOString(),
        entries
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = String(cardLabel()).replace(/[\\/:*?"<>|]/g, '_');
    a.href = url;
    a.download = '档案库_' + safe + '_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    log('已导出 ' + n + ' 份档案');
}

/* 把一批外来档案并进某个档案库（导入用），返回新增/覆盖数 */
function mergeEntries(b, src) {
    let added = 0, replaced = 0;
    for (const name in src) {
        const rec = src[name];
        if (!rec || typeof rec !== 'object' || Array.isArray(rec)) continue;
        const nm = String(rec['姓名'] || name).trim();
        if (!nm) continue;
        const prev = b.entries[nm];
        if (prev) replaced++; else added++;
        const merged = Object.assign({}, rec, { '姓名': nm });
        /* 锁是本地状态：导入覆盖时别把它冲掉（导入文件自己带 _locked 的话以文件为准） */
        if (prev && prev._locked) merged._locked = true;
        if (prev && prev._forceSend) merged._forceSend = true;
        if (prev && !recordSame(prev, merged)) merged._hist = [snapshotRecord(prev)].concat(Array.isArray(prev._hist) ? prev._hist : []).slice(0, HIST_MAX);
        b.entries[nm] = merged;
    }
    b.card = cardLabel();
    b.updated = Date.now();
    return { added, replaced };
}

function importRecords(ev) {
    const input = ev.target;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(String(reader.result || ''));
            let src = (data && data.entries) ? data.entries : null;
            if (!src && data && data.records) {
                const first = Object.keys(data.records)[0];
                src = first ? data.records[first].entries : null;
            }
            if (!src && data && typeof data === 'object' && !data.records) src = data;
            if (!src || typeof src !== 'object') throw new Error('文件里没找到档案数据');
            const k = cardKey();
            /* 导入是「往当前存档里装」：缺库就建空的，不要顺手把老库搬进来 */
            if (!S.records[k]) S.records[k] = { card: cardLabel(), entries: {}, updated: 0 };
            const b = bucket(k, true);
            const r = mergeEntries(b, src);
            saveSettings(true);
            renderList();
            log('导入完成：新增 ' + r.added + '，覆盖 ' + r.replaced);
            toast('导入完成：新增 ' + r.added + '，覆盖 ' + r.replaced);
        } catch (e) {
            log('导入失败：' + (e && e.message ? e.message : e), 'error');
            toast('导入失败：' + (e && e.message ? e.message : e), 'error');
        } finally {
            input.value = '';
        }
    };
    reader.readAsText(file, 'utf-8');
}

/* ------------------------------ 自动记录 ------------------------------ */
/* 最后一条 AI 消息（玩家的楼层不算） */
function lastAiMessage(chat) {
    const arr = Array.isArray(chat) ? chat : [];
    for (let i = arr.length - 1; i >= 0; i--) {
        const m = arr[i];
        if (!m || m.is_system || m.is_user) continue;
        if (!String(m.mes || m.message || '').trim()) continue;
        return m;
    }
    return null;
}

function onMessageReceived() {
    if (!S.enabled || !S.autoScan) return;
    if (scanning) return;
    try {
        const ctx = getContext();
        const chat = ctx.chat || [];
        /* 字数门槛：最新一层正文不够长就这层不记，等下一层再看 */
        const need = clampInt(S.autoMinChars, 0, 100000, 0);
        if (need > 0) {
            const last = lastAiMessage(chat);
            const len = cleanText(last && (last.mes || last.message)).length;
            if (len < need) {
                log('最新一层正文 ' + len + ' 字，不到 ' + need + ' 字，这次不记录');
                return;
            }
        }
        const aiCount = chat.filter((m) => m && !m.is_user && !m.is_system).length;
        if (aiCount - lastAutoFloor < Math.max(1, S.autoEvery)) return;
        lastAutoFloor = aiCount;
        log('自动记录触发（已累计 ' + aiCount + ' 层 AI 回复）');
        runScan({ depth: S.scanDepth, auto: true });
    } catch (e) {
        console.warn('[DNA] auto scan failed', e);
    }
}

function onChatChanged() {
    lastAutoFloor = 0;
    selected = null;
    renderList();
    /* 模板和自动生成的上下文预设都是按卡记的，换卡 / 换会话后下拉框和徽标要跟着变 */
    try { renderTemplateUI(); } catch (e) { /* 页签还没挂上就算了 */ }
    try { renderPresetCard('lib'); } catch (e) { /* 同上 */ }
    /* 「按世界书生成」的数据源是当前角色卡的世界书，换卡后必须重读 */
    WB_LIB_CACHE = [];
    WB_LIB_BOOK = '';
    (async () => {
        try {
            const cur = document.querySelector('#dna-tab');
            if (!cur) return;
            if (cur.dataset.sub === 'ranobe') await renderLib('ranobewb');
        } catch (e) { /* 页签还没挂上就算了 */ }
    })();
    /* 换存档后让用户看得见现在用的是哪一份档案库 */
    log('档案库：' + cardLabel() + ' · ' + Object.keys(currentEntries()).length + ' 份档案');
    /* 进入角色卡 / 换聊天：按开关把世界书切到这张卡的主世界书 */
    followCardWorldBook().then((changed) => {
        if (!changed) return;
        log('世界书已跟随角色卡切到「' + S.genBook + '」');
        loadGenSource();
        renderGenInfo();
    }).catch(() => { /* 取不到角色卡就保持原样 */ });
}

/* ------------------------------ 启动 ------------------------------ */
function boot() {
    /* 开关同步：document 级监听，必须在面板挂上之前就装好 */
    installDnaToggleSync();
    /* 智绘姬是异步把设置面板插进 DOM 的，这里轮询等它建好再挂载 */
    let tries = 0;
    const timer = setInterval(() => {
        tries++;
        if (injectIntoChatu8()) {
            clearInterval(timer);
            startWatchdog();
            watchViewport();
            applyUiMode();
            renderReqBreak();   /* 面板挂上之后再渲染一次「请求组成」 */
            return;
        }
        if (tries > 240) {
            clearInterval(timer);
            console.warn('[DNA] 没等到智绘姬的设置面板，档案库页签未挂载（智绘姬没装或没启用？）');
        }
    }, 500);

    if (!extension_settings[MODULE]) saveSettings(true);

    /* 内置默认预设：第一次装（或之前从没装过这一份）就自动塞进上下文预设列表 */
    ensureDefaultPreset()
        .then(() => ensureDefaultGenPreset())
        .then(() => ensureDefaultRanobePreset())
        .then(() => { try { migrateGenPresets(); } catch (e) { /* 迁移失败不影响使用 */ } })
        .then(() => {
            try { renderPresetCard('lib'); renderPresetCard('gen'); renderPresetCard('ranobe'); } catch (e) { /* 页签还没挂上就算了，fill() 会再渲染 */ }
        })
        .catch(() => { /* 内置预设装不上不影响手动导入 */ });

    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
    /* 启动时先按当前角色卡对一次世界书 */
    followCardWorldBook().then((changed) => { if (changed) loadGenSource(); }).catch(() => { /* 忽略 */ });
    /* 发送数据：必须在智绘姬注册监听之前排到最前面，所以尽早就装 */
    installSendHooks();
    renderReqBreak();
    setTimeout(installSendHooks, 5000);
    setTimeout(installSendHooks, 20000);
    log('档案库已加载 v2.9.18 · 融合版（内置存储 + 上下文预设）');
}

/* 智绘姬重载页签内容时会把我们的页签冲掉，这里兜底重新挂载 */
let watchdog = null;
function startWatchdog() {
    if (watchdog) return;
    watchdog = setInterval(() => {
        const modal = document.querySelector('#ch-settings-modal');
        if (!modal) return;
        const nav = modal.querySelector('.st-chatu8-nav');
        if (!nav || nav.querySelector('[data-tab="dna"]')) return;
        if (injectIntoChatu8()) log('页签被重建，已重新挂载');
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
