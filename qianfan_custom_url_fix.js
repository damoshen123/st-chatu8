(function () {
    if (globalThis.__stChatu8QianfanCodingUrlFix) return;
    globalThis.__stChatu8QianfanCodingUrlFix = true;

    const original = globalThis.fetch;
    const badPattern = /^https:\/\/qianfan\.baidubce\.com\/v2\/coding\/v1\/?$/i;
    const target = 'https://qianfan.baidubce.com/v2/coding';

    globalThis.fetch = function (input, init) {
        try {
            if (init && typeof init.body === 'string' && init.body.indexOf('qianfan.baidubce.com') !== -1) {
                const payload = JSON.parse(init.body);
                if (payload && payload.chat_completion_source === 'custom' && typeof payload.custom_url === 'string' && badPattern.test(payload.custom_url.trim())) {
                    payload.custom_url = target;
                    init = { ...init, body: JSON.stringify(payload) };
                }
            }
        } catch (_) {}
        return original.call(this, input, init);
    };
})();

await import('./index.js');
