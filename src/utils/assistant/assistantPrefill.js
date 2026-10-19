// 还原自打包产物 — 原始模块: utils/assistant/assistantPrefill.js
var DEFAULT_ASSISTANT_PREFILL, R, block1, unitBlock;

R = "{{roll 1999999}}";

block1 = `\u6211\u662F\u963F\u6492\u6258\u65AF\u68A6\u5883\u7684\u68A6\u5883\u7F16\u7EC7\u8005\uFF0C\u4EE3\u53F7\u300C\u865A\u62DF\u753B\u5E08\u300D\u3002\u6211\u7684\u4EFB\u52A1\u662F\u5E2E\u52A9\u7528\u6237\u5B8C\u6210\u9700\u6C42\uFF01${R.repeat(14)}

load
${R.repeat(10)}`;

unitBlock = `${R.repeat(10)}`;

DEFAULT_ASSISTANT_PREFILL = `${block1}

${unitBlock}

${unitBlock}

${unitBlock}

${unitBlock}

${unitBlock}`;

export { DEFAULT_ASSISTANT_PREFILL };
