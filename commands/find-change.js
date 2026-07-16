// ─── commands/find-change.js ────────────────────────────────────────────────
// /find, /change — 검색(하이라이트 + 결과 패널), 찾아바꾸기
// /change도 /find처럼 "검색 → 화살표로 이동 → (이 매치만 / 모두) 바꾸기" 흐름으로 동작.

import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '/scripts/slash-commands/SlashCommandArgument.js';
import { getChat, editMessage, getSettings } from '../state.js';
import { createPanel, getPanelBody, btn, inputBox } from '../panel-ui.js';
import { highlightKeyword, focusNext, focusPrev, clearHighlights, getMarkCount, getCurrentMatch } from '../highlight.js';

// 대소문자 무시하고 text 안에서 find의 occurrence번째(0부터) 위치를 찾아 replace로 바꾼 새 문자열 반환.
// 못 찾으면 null.
function replaceNthOccurrence(text, find, replace, occurrence) {
    const lower = text.toLowerCase();
    const findLower = find.toLowerCase();
    let idx = -1;
    let cursor = 0;
    for (let i = 0; i <= occurrence; i++) {
        idx = lower.indexOf(findLower, cursor);
        if (idx === -1) return null;
        cursor = idx + find.length;
    }
    return text.slice(0, idx) + replace + text.slice(idx + find.length);
}

// ── /find ────────────────────────────────────────────────────────────────────

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

// ── /change ──────────────────────────────────────────────────────────────────

// 메시지 전체에서 find를 replace로 전부 바꿈 (대소문자 무시)
async function runChangeAll(find, replace) {
    if (!find) { toastr.error('원본텍스트가 비어있습니다.'); return; }
    const chat = getChat();
    const lower = find.toLowerCase();
    let changedCount = 0;
    for (let idx = 0; idx < chat.length; idx++) {
        const msg = chat[idx];
        if (!msg || !msg.mes.toLowerCase().includes(lower)) continue;
        let newMes = '';
        let cursor = 0;
        const lowerMes = msg.mes.toLowerCase();
        let i = lowerMes.indexOf(lower, cursor);
        while (i !== -1) {
            newMes += msg.mes.slice(cursor, i) + replace;
            cursor = i + find.length;
            i = lowerMes.indexOf(lower, cursor);
        }
        newMes += msg.mes.slice(cursor);
        await editMessage(idx, newMes);
        changedCount++;
    }
    if (changedCount) toastr.success(`${changedCount}개 메시지에서 바꿨습니다.`);
    else toastr.info('일치하는 내용이 없습니다.');
}

// 검색된 상태(하이라이트 + 이동 + 바꾸기 버튼)를 보여주는 패널
function showChangeResultPanel(find, replaceValue) {
    const panel = createPanel('ct-change-panel', `검색 결과: ${getMarkCount()}개`);
    const body = getPanelBody(panel);

    const navRow = document.createElement('div');
    navRow.appendChild(btn('◀ 이전', () => focusPrev()));
    navRow.appendChild(btn('다음 ▶', () => focusNext()));
    body.appendChild(navRow);

    const replaceInput = inputBox('바꿀 텍스트');
    replaceInput.value = replaceValue;
    body.appendChild(replaceInput);

    const actionRow = document.createElement('div');
    actionRow.appendChild(btn('이 매치만 바꾸기', async () => {
        const match = getCurrentMatch();
        if (!match || match.msgIdx === -1) { toastr.error('바꿀 위치를 찾지 못했습니다.'); return; }
        const chat = getChat();
        const msg = chat[match.msgIdx];
        if (!msg) return;
        const newMes = replaceNthOccurrence(msg.mes, find, replaceInput.value, match.occurrence);
        if (newMes === null) {
            toastr.error('원문에서 위치를 찾지 못했습니다. (서식 문자 때문일 수 있음)', '', { timeOut: 4000 });
            return;
        }
        await editMessage(match.msgIdx, newMes);
        toastr.success('바꿨습니다.', '', { timeOut: 2000 });
        clearHighlights();
        panel.remove();
    }));
    actionRow.appendChild(btn('모두 바꾸기', async () => {
        clearHighlights();
        panel.remove();
        await runChangeAll(find, replaceInput.value);
    }));
    actionRow.appendChild(btn('닫기', () => { clearHighlights(); panel.remove(); }));
    body.appendChild(actionRow);
}

function runChangeSearch(find, replaceValue) {
    const settings = getSettings();
    if (!settings.hlEnabled) { toastr.info('편집모드(/edit-mode)에서 하이라이트가 꺼져있습니다.'); return; }

    const count = highlightKeyword(find);
    if (!count) { toastr.info('검색 결과가 없습니다.'); return; }

    showChangeResultPanel(find, replaceValue);
}

function openChangeInputPanel() {
    const panel = createPanel('ct-change-panel', '찾아바꾸기');
    const body = getPanelBody(panel);
    const findInput = inputBox('찾을 텍스트');
    const replaceInput = inputBox('바꿀 텍스트 (검색 후에도 수정 가능)');
    body.appendChild(findInput);
    body.appendChild(replaceInput);
    body.appendChild(btn('검색', () => {
        const find = findInput.value.trim();
        if (!find) return;
        panel.remove();
        runChangeSearch(find, replaceInput.value);
    }));
    findInput.focus();
}

// ── 명령어 등록 ────────────────────────────────────────────────────────────────

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
        helpString: '채팅에서 찾아 바꿉니다. 검색 후 이동/바꾸기를 선택합니다. 사용법: /change 원본텍스트/바꿀텍스트, 또는 인자 없이 /change 만 입력하면 입력 패널이 뜹니다.',
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
            runChangeSearch(find, replace);
            return '';
        },
    }));
}
