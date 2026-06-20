(function () {
    if (globalThis.__stChatu8QianfanExtraParamsUiInstalled) return;
    globalThis.__stChatu8QianfanExtraParamsUiInstalled = true;

    const service = globalThis.__stChatu8QianfanExtraParams;
    if (!service) {
        console.error('[st-chatu8] 千帆附加参数服务未初始化，跳过 UI。');
        return;
    }

    const PANEL_ID = 'st-chatu8-qianfan-extra-params-panel';
    const PROFILE_CONTROL_IDS = new Set([
        'ch-llm_profile_select',
        'ch-new_llm_profile_button',
        'ch-save_llm_profile_button',
        'ch-rename_llm_profile_button',
        'ch-delete_llm_profile_button',
        'ch-import_llm_profile_button',
    ]);

    let panel = null;
    let activeProfileKey = null;
    let timer = null;

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function parseInput(text, label) {
        const trimmed = String(text || '').trim();
        if (!trimmed) return {};

        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        } catch (error) {
            throw new Error(`${label} 不是合法 JSON：${error.message}`);
        }

        if (!isPlainObject(parsed)) {
            throw new Error(`${label} 必须是 JSON 对象，不能是数组、字符串或数字。`);
        }

        return parsed;
    }

    function setStatus(text, isError = false) {
        if (!panel) return;
        const status = panel.querySelector('[data-role="status"]');
        if (!status) return;
        status.textContent = text;
        status.style.color = isError
            ? 'var(--st-chatu8-danger-primary, #d9534f)'
            : 'var(--st-chatu8-text-secondary)';
    }

    function textarea(rows, placeholder, role) {
        const element = document.createElement('textarea');
        element.className = 'st-chatu8-textarea';
        element.rows = rows;
        element.placeholder = placeholder;
        element.spellcheck = false;
        element.dataset.role = role;
        element.style.width = '100%';
        element.style.boxSizing = 'border-box';
        element.style.resize = 'vertical';
        element.style.fontFamily = 'ui-monospace, SFMono-Regular, Consolas, monospace';
        return element;
    }

    function field(labelText, input, helpText) {
        const wrapper = document.createElement('div');
        wrapper.className = 'st-chatu8-field-col';

        const label = document.createElement('label');
        label.textContent = labelText;

        const help = document.createElement('p');
        help.textContent = helpText;
        help.style.fontSize = '12px';
        help.style.color = 'var(--st-chatu8-text-secondary)';
        help.style.margin = '4px 0 0';

        wrapper.append(label, input, help);
        return wrapper;
    }

    function makeButton(text, role, danger = false) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = danger ? 'st-chatu8-btn danger' : 'st-chatu8-btn';
        button.textContent = text;
        button.dataset.role = role;
        return button;
    }

    function createPanel() {
        const container = document.createElement('div');
        container.id = PANEL_ID;
        container.className = 'st-chatu8-settings-section';

        const title = document.createElement('h4');
        title.textContent = 'LLM 附加参数';

        const profileNote = document.createElement('p');
        profileNote.dataset.role = 'profile-note';
        profileNote.style.fontSize = '12px';
        profileNote.style.color = 'var(--st-chatu8-text-secondary)';
        profileNote.style.marginTop = '0';

        const toggleRow = document.createElement('div');
        toggleRow.className = 'st-chatu8-field';
        const toggleLabel = document.createElement('label');
        toggleLabel.textContent = '默认禁用 thinking';
        const toggle = document.createElement('div');
        toggle.className = 'st-chatu8-toggle';
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.dataset.role = 'disable-thinking';
        const slider = document.createElement('span');
        slider.className = 'st-chatu8-slider';
        toggle.append(toggleInput, slider);
        toggleRow.append(toggleLabel, toggle);

        const bodyInput = textarea(8, '{\n  "max_completion_tokens": 65535\n}', 'body');
        const headersInput = textarea(5, '{\n  "X-Example": "value"\n}', 'headers');

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.alignItems = 'center';
        actions.style.flexWrap = 'wrap';
        const status = document.createElement('span');
        status.dataset.role = 'status';
        status.style.fontSize = '12px';
        status.style.color = 'var(--st-chatu8-text-secondary)';
        actions.append(
            makeButton('保存当前档案参数', 'save'),
            makeButton('格式化 JSON', 'format'),
            makeButton('清空当前档案参数', 'clear', true),
            status,
        );

        container.append(
            title,
            profileNote,
            toggleRow,
            field(
                '附加 Body 参数 / custom_include_body',
                bodyInput,
                '按当前 LLM 配置档案分别保存，并与千帆 Coding Plan 请求中的 custom_include_body 合并。',
            ),
            field(
                '附加 Header 参数 / custom_include_headers',
                headersInput,
                '按当前 LLM 配置档案分别保存。没有特殊需求时可以留空。',
            ),
            actions,
        );

        container.addEventListener('click', (event) => {
            const role = event.target?.closest('[data-role]')?.dataset.role;
            if (!role) return;

            const body = container.querySelector('[data-role="body"]');
            const headers = container.querySelector('[data-role="headers"]');
            const disableThinking = container.querySelector('[data-role="disable-thinking"]');

            if (role === 'save') {
                try {
                    const config = service.setCurrentConfig({
                        body: parseInput(body.value, '附加 Body 参数'),
                        headers: parseInput(headers.value, '附加 Header 参数'),
                        disableThinking: disableThinking.checked,
                    });
                    body.value = Object.keys(config.body).length ? JSON.stringify(config.body, null, 2) : '';
                    headers.value = Object.keys(config.headers).length ? JSON.stringify(config.headers, null, 2) : '';
                    setStatus('当前档案参数已保存');
                } catch (error) {
                    setStatus(error.message || String(error), true);
                }
            }

            if (role === 'format') {
                try {
                    const bodyValue = parseInput(body.value, '附加 Body 参数');
                    const headerValue = parseInput(headers.value, '附加 Header 参数');
                    body.value = Object.keys(bodyValue).length ? JSON.stringify(bodyValue, null, 2) : '';
                    headers.value = Object.keys(headerValue).length ? JSON.stringify(headerValue, null, 2) : '';
                    setStatus('JSON 格式化完成');
                } catch (error) {
                    setStatus(error.message || String(error), true);
                }
            }

            if (role === 'clear') {
                service.clearCurrentConfig();
                body.value = '';
                headers.value = '';
                disableThinking.checked = true;
                setStatus('已清空当前档案参数，并恢复默认禁用 thinking');
            }
        });

        return container;
    }

    function refresh(force = false) {
        if (!panel?.isConnected) return;

        const descriptor = service.getProfileDescriptor();
        if (!force && descriptor.key === activeProfileKey) return;
        activeProfileKey = descriptor.key;

        const config = service.getCurrentConfig();
        const note = panel.querySelector('[data-role="profile-note"]');
        const body = panel.querySelector('[data-role="body"]');
        const headers = panel.querySelector('[data-role="headers"]');
        const disableThinking = panel.querySelector('[data-role="disable-thinking"]');

        note.textContent = `当前 LLM 配置档案：${descriptor.label}`;
        body.value = Object.keys(config.body).length ? JSON.stringify(config.body, null, 2) : '';
        headers.value = Object.keys(config.headers).length ? JSON.stringify(config.headers, null, 2) : '';
        disableThinking.checked = config.disableThinking;
        setStatus('');
    }

    function mount() {
        const llmRoot = document.querySelector('#ch-tab-llm');
        if (!llmRoot) return;

        const existing = document.getElementById(PANEL_ID);
        if (existing && llmRoot.contains(existing)) {
            panel = existing;
            refresh(false);
            return;
        }

        panel = createPanel();
        const modelHeading = Array.from(llmRoot.querySelectorAll('h4')).find(
            (heading) => heading.textContent?.trim() === '模型参数',
        );
        const modelSection = modelHeading?.closest('.st-chatu8-settings-section');

        if (modelSection?.parentElement) {
            modelSection.insertAdjacentElement('afterend', panel);
        } else {
            llmRoot.appendChild(panel);
        }

        activeProfileKey = null;
        refresh(true);
    }

    function schedule(delay = 80) {
        clearTimeout(timer);
        timer = setTimeout(mount, delay);
    }

    const observer = new MutationObserver(() => schedule());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('change', (event) => {
        if (event.target?.id === 'ch-llm_profile_select') {
            setTimeout(() => {
                activeProfileKey = null;
                refresh(true);
            }, 0);
        }
    }, true);

    document.addEventListener('click', (event) => {
        const id = event.target?.closest('[id]')?.id;
        if (PROFILE_CONTROL_IDS.has(id)) {
            setTimeout(() => {
                activeProfileKey = null;
                schedule(250);
            }, 250);
        }
    }, true);

    document.addEventListener('DOMContentLoaded', () => schedule(0), { once: true });
    schedule(0);
})();
