(function () {
    if (globalThis.__stChatu8QianfanExtraParamsUi) return;
    globalThis.__stChatu8QianfanExtraParamsUi = true;

    const bodyKey = 'st_chatu8_llm_extra_body';
    const headerKey = 'st_chatu8_llm_extra_headers';
    const thinkingKey = 'st_chatu8_qianfan_default_thinking_param';
    const panelId = 'st-chatu8-qianfan-extra-params-panel';

    function isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function isEmpty(value) {
        return !isObject(value) || Object.keys(value).length === 0;
    }

    function textOf(element) {
        return (element?.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function visible(element) {
        if (!element || !element.isConnected) return false;
        const style = globalThis.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function parseJsonObject(value, label) {
        const text = String(value || '').trim();
        if (!text) return {};

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (error) {
            throw new Error(label + ' 不是合法 JSON：' + error.message);
        }

        if (!isObject(parsed)) {
            throw new Error(label + ' 必须是 JSON 对象，不能是数组、字符串或数字');
        }

        return parsed;
    }

    function prettyStoredJson(key) {
        const raw = globalThis.localStorage?.getItem(key) || '';
        if (!raw.trim()) return '';
        try {
            return JSON.stringify(parseJsonObject(raw, key), null, 2);
        } catch (_) {
            return raw;
        }
    }

    function defaultThinkingEnabled() {
        const flag = globalThis.localStorage?.getItem(thinkingKey);
        return !(flag === 'false' || flag === '0' || flag === 'off');
    }

    function getLlmContent(root) {
        const candidates = Array.from(root.querySelectorAll('.st-chatu8-tab-content.active, .st-chatu8-sub-tab-content.active, .st-chatu8-sub-tab-content[style*="display: block"]'));
        return candidates.find((element) => {
            if (!visible(element)) return false;
            const text = textOf(element).toLowerCase();
            return text.includes('llm') || text.includes('模型参数') || text.includes('模型设置');
        }) || null;
    }

    function findInsertAfter(content) {
        const markers = Array.from(content.querySelectorAll('h3, h4, h5, label, .st-chatu8-field, .st-chatu8-field-col, .st-chatu8-settings-section'));
        const marker = markers.find((element) => {
            if (!visible(element)) return false;
            const text = textOf(element).toLowerCase();
            return text.includes('模型参数') || text.includes('model parameters') || text.includes('model params');
        });
        return marker ? (marker.closest('.st-chatu8-settings-section') || marker.parentElement || marker) : null;
    }

    function makeTextarea(rows, placeholder) {
        const textarea = document.createElement('textarea');
        textarea.className = 'st-chatu8-text-input';
        textarea.rows = rows;
        textarea.spellcheck = false;
        textarea.placeholder = placeholder;
        textarea.style.width = '100%';
        textarea.style.boxSizing = 'border-box';
        textarea.style.fontFamily = 'ui-monospace, SFMono-Regular, Consolas, monospace';
        textarea.style.resize = 'vertical';
        return textarea;
    }

    function makeSmall(text) {
        const small = document.createElement('small');
        small.textContent = text;
        small.style.color = 'var(--st-chatu8-text-secondary)';
        return small;
    }

    function makeButton(text, danger) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = danger ? 'st-chatu8-btn danger' : 'st-chatu8-btn';
        button.textContent = text;
        return button;
    }

    function setStatus(status, text, error) {
        status.textContent = text;
        status.style.color = error ? 'var(--st-chatu8-danger-primary)' : 'var(--st-chatu8-text-secondary)';
    }

    function makePanel() {
        const panel = document.createElement('div');
        panel.id = panelId;
        panel.className = 'st-chatu8-settings-section';
        panel.style.marginTop = '16px';

        const title = document.createElement('h4');
        title.textContent = 'LLM 附加参数';
        title.style.marginTop = '0';
        panel.appendChild(title);

        const switchRow = document.createElement('div');
        switchRow.className = 'st-chatu8-field';
        switchRow.style.alignItems = 'flex-start';
        const switchLabel = document.createElement('label');
        switchLabel.textContent = '默认禁用 thinking';
        switchLabel.style.paddingTop = '4px';
        const toggle = document.createElement('label');
        toggle.className = 'st-chatu8-toggle';
        toggle.title = '开启后自动附加 thinking.type = disabled';
        const thinkingInput = document.createElement('input');
        thinkingInput.type = 'checkbox';
        thinkingInput.checked = defaultThinkingEnabled();
        const slider = document.createElement('span');
        slider.className = 'st-chatu8-slider';
        toggle.append(thinkingInput, slider);
        switchRow.append(switchLabel, toggle);
        panel.appendChild(switchRow);

        const bodyGroup = document.createElement('div');
        bodyGroup.className = 'st-chatu8-field-col';
        const bodyLabel = document.createElement('label');
        bodyLabel.textContent = '附加 Body 参数 / custom_include_body';
        const bodyInput = makeTextarea(8, '{\n  "max_completion_tokens": 65535\n}');
        bodyInput.value = prettyStoredJson(bodyKey);
        bodyGroup.append(bodyLabel, bodyInput, makeSmall('只填写 JSON 对象。保存后会合并到千帆 Coding Plan 请求的 custom_include_body 中。'));
        panel.appendChild(bodyGroup);

        const headerGroup = document.createElement('div');
        headerGroup.className = 'st-chatu8-field-col';
        const headerLabel = document.createElement('label');
        headerLabel.textContent = '附加 Header 参数 / custom_include_headers';
        const headerInput = makeTextarea(5, '{\n  "X-Example": "value"\n}');
        headerInput.value = prettyStoredJson(headerKey);
        headerGroup.append(headerLabel, headerInput, makeSmall('只填写 JSON 对象。通常没有特殊需求可以留空。'));
        panel.appendChild(headerGroup);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.alignItems = 'center';
        actions.style.flexWrap = 'wrap';
        const saveButton = makeButton('保存附加参数');
        const formatButton = makeButton('格式化 JSON');
        const clearButton = makeButton('清空', true);
        const status = document.createElement('span');
        status.style.color = 'var(--st-chatu8-text-secondary)';
        actions.append(saveButton, formatButton, clearButton, status);
        panel.appendChild(actions);

        function save() {
            try {
                const body = parseJsonObject(bodyInput.value, '附加 Body 参数');
                const headers = parseJsonObject(headerInput.value, '附加 Header 参数');

                if (isEmpty(body)) {
                    globalThis.localStorage?.removeItem(bodyKey);
                    bodyInput.value = '';
                } else {
                    globalThis.localStorage?.setItem(bodyKey, JSON.stringify(body));
                    bodyInput.value = JSON.stringify(body, null, 2);
                }

                if (isEmpty(headers)) {
                    globalThis.localStorage?.removeItem(headerKey);
                    headerInput.value = '';
                } else {
                    globalThis.localStorage?.setItem(headerKey, JSON.stringify(headers));
                    headerInput.value = JSON.stringify(headers, null, 2);
                }

                if (thinkingInput.checked) {
                    globalThis.localStorage?.removeItem(thinkingKey);
                } else {
                    globalThis.localStorage?.setItem(thinkingKey, 'false');
                }

                setStatus(status, '已保存');
            } catch (error) {
                setStatus(status, error.message || String(error), true);
            }
        }

        saveButton.addEventListener('click', save);
        formatButton.addEventListener('click', () => {
            try {
                const body = parseJsonObject(bodyInput.value, '附加 Body 参数');
                const headers = parseJsonObject(headerInput.value, '附加 Header 参数');
                bodyInput.value = isEmpty(body) ? '' : JSON.stringify(body, null, 2);
                headerInput.value = isEmpty(headers) ? '' : JSON.stringify(headers, null, 2);
                setStatus(status, 'JSON 格式化完成');
            } catch (error) {
                setStatus(status, error.message || String(error), true);
            }
        });
        clearButton.addEventListener('click', () => {
            bodyInput.value = '';
            headerInput.value = '';
            thinkingInput.checked = true;
            globalThis.localStorage?.removeItem(bodyKey);
            globalThis.localStorage?.removeItem(headerKey);
            globalThis.localStorage?.removeItem(thinkingKey);
            setStatus(status, '已清空，并恢复默认禁用 thinking');
        });

        return panel;
    }

    function inject() {
        const root = document.querySelector('#st-chatu8-settings');
        if (!root) return;
        const content = getLlmContent(root);
        if (!content) return;

        const existing = document.getElementById(panelId);
        if (existing && content.contains(existing)) return;

        const panel = existing || makePanel();
        const after = findInsertAfter(content);
        if (after && after.parentElement) {
            after.insertAdjacentElement('afterend', panel);
        } else {
            content.appendChild(panel);
        }
    }

    let timer = null;
    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(inject, 80);
    }

    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    document.addEventListener('click', schedule, true);
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
    schedule();
})();
