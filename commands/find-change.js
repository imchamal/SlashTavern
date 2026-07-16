// ─── commands/find-change.js ────────────────────────────────────────────────
// /find, /change — 검색(하이라이트 + 결과 패널), 찾아바꾸기

import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '/scripts/slash-commands/SlashCommandArgument.js';
import { getChat, editMessage, getSettings } from '../state.js';
import { createPanel, getPanelBody, btn, inputBox } from '../panel-ui.js';
import { highlightKeyword, focusNext, focusPrev, clearHighlights } from '../highlight.js';

function runFind(keyword) {
    const settings = getSettings();
    if (!settings.hlEnabled) { toastr.info('편집모드(/edit-mode)에서 하이라이트가 꺼져있습니다.'); return; }

    const count = highlightKeyword(keyword);
    if (!count) { toastr.info('검색 결과가 없습니다.'); return; }

    const panel = createPanel('ct-find-panel', `검색 결과: ${count}개`);
    const body = getPanelBody(panel);
    const row = document.createElement('div');
    row.appendChild(btn('◀ 이전', () => focusPrev()));
    row.appendChild(btn('다음 ▶', () => focusNext()));
    row.appendChild(btn('닫기', () => { clearHighlights(); panel.remove(); }));
    body.appendChild(row);
}

function openFindInputPanel() {
    const panel = createPanel('ct-find-panel', '검색');
    const body = getPanelBody(panel);
    const input = inputBox('검색어를 입력하세요');
    body.appendChild(input);
    body.appendChild(btn('검색', () => {
        const kw = input.value.trim();
        if (!kw) return;
        panel.remove();
        runFind(kw);
    }));
    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const kw = input.value.trim();
        if (!kw) return;
        panel.remove();
        runFind(kw);
    });
    input.focus();
}

async function runChange(find, replace) {
    if (!find) { toastr.error('원본텍스트가 비어있습니다.'); return; }
    const chat = getChat();
    let changedCount = 0;
    for (let idx = 0; idx < chat.length; idx++) {
        const msg = chat[idx];
        if (!msg || !msg.mes.includes(find)) continue;
        await editMessage(idx, msg.mes.split(find).join(replace));
        changedCount++;
    }
    if (changedCount) toastr.success(`${changedCount}개 메시지에서 바꿨습니다.`);
    else toastr.info('일치하는 내용이 없습니다.');
}

function openChangeInputPanel() {
    const panel = createPanel('ct-change-panel', '찾아바꾸기');
    const body = getPanelBody(panel);
    const findInput = inputBox('찾을 텍스트');
    const replaceInput = inputBox('바꿀 텍스트');
    body.appendChild(findInput);
    body.appendChild(replaceInput);
    body.appendChild(btn('바꾸기', async () => {
        const find = findInput.value.trim();
        const replace = replaceInput.value;
        if (!find) return;
        panel.remove();
        await runChange(find, replace);
    }));
    findInput.focus();
}

export function registerFindChangeCommands() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'find',
        helpString: '채팅에서 검색합니다. 사용법: /find 키워드, 또는 키워드 없이 /find 만 입력하면 입력 패널이 뜹니다.',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({ description: '검색어 (생략시 입력 패널)', typeList: [ARGUMENT_TYPE.STRING], isRequired: false }),
        ],
        callback: async (_a, value) => {
            const keyword = String(value ?? '').trim();
            if (!keyword) { openFindInputPanel(); return ''; }
            runFind(keyword);
            return '';
        },
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'change',
        helpString: '전체 채팅에서 찾아 바꿉니다. 사용법: /change 원본텍스트/바꿀텍스트, 또는 인자 없이 /change 만 입력하면 입력 패널이 뜹니다.',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({ description: '원본/바꿀텍스트 (생략시 입력 패널)', typeList: [ARGUMENT_TYPE.STRING], isRequired: false }),
        ],
        callback: async (_a, value) => {
            const raw = String(value ?? '');
            if (!raw.trim()) { openChangeInputPanel(); return ''; }
            const slashIdx = raw.indexOf('/');
            if (slashIdx === -1) { toastr.error('사용법: /change 원본텍스트/바꿀텍스트'); return ''; }
            const find = raw.slice(0, slashIdx);
            const replace = raw.slice(slashIdx + 1);
            await runChange(find, replace);
            return '';
        },
    }));
}
