// ─── commands/find-change.js ────────────────────────────────────────────────
// /find, /change — 검색(하이라이트 + 결과 패널), 찾아바꾸기
// 검색옵션(대소문자 구분/띄어쓰기 무시/온전한 단어/태그 무시) 4개는 항상 2열로
// 노출되고, 검색 범위(예: 5 / 2-8 / 1,3,5-9)도 지정할 수 있음.

import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '/scripts/slash-commands/SlashCommandArgument.js';
import { getChat, editMessage, getSettings } from '../state.js';
import { createPanel, getPanelBody, btn, inputBox, checkRow } from '../panel-ui.js';
import { buildSearchRegex, maskTags, parseRangeInput } from '../utils.js';
import {
    highlightKeyword, focusNext, focusPrev, clearHighlights,
    getMarkCount, getCurrentIndex, getCurrentMatch,
} from '../highlight.js';

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

// 켜진 옵션들을 "(대소문자, 온전한단어)" 형태로 옅게 표시
function optionBadgesHtml(options) {
    const labels = [];
    if (options?.caseSensitive) labels.push('대소문자');
    if (options?.ignoreSpace) labels.push('띄어쓰기무시');
    if (options?.wholeWord) labels.push('온전한단어');
    if (options?.ignoreTags) labels.push('태그무시');
    if (!labels.length) return '';
    return ` <span class="ct-dim" style="font-size:11px;">(${labels.join(', ')})</span>`;
}

// 패널 제목: "검색어" N개 발견 (옵션뱃지). 위치 표시(#4 (4/23))는
// createPanel이 항상 만들어주는 우측 슬롯(#ct-pos)에 따로 채워짐.
function resultTitleHtml(keyword, count, options) {
    return `"${escapeHtml(keyword)}" <span class="ct-dim">${count}개 발견</span>${optionBadgesHtml(options)}`;
}

// 제목 옆 위치 표시(#메시지번호 (몇번째/전체))를 지금 상태에 맞게 갱신
function updatePositionLabel(panel) {
    const el = panel.querySelector('#ct-pos');
    if (!el) return;
    const total = getMarkCount();
    const match = getCurrentMatch();
    if (!total || !match) { el.textContent = ''; return; }
    el.textContent = `#${match.msgIdx} (${getCurrentIndex() + 1}/${total})`;
}

// 입력 패널 공용 부품: 옵션 체크박스 4개(2열 그리드) + 검색범위 입력창.
// getOptions()로 지금 체크 상태를, rangeInput.value로 범위 텍스트를 읽어옴.
function buildSearchControls() {
    const state = { caseSensitive: false, ignoreSpace: false, wholeWord: false, ignoreTags: false };

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: 1fr 1fr; gap:2px 12px; margin-bottom:10px;';
    grid.appendChild(checkRow('대소문자 구분', () => state.caseSensitive, (v) => { state.caseSensitive = v; }));
    grid.appendChild(checkRow('띄어쓰기 무시', () => state.ignoreSpace, (v) => { state.ignoreSpace = v; }));
    grid.appendChild(checkRow('온전한 단어', () => state.wholeWord, (v) => { state.wholeWord = v; }));
    grid.appendChild(checkRow('태그 무시', () => state.ignoreTags, (v) => { state.ignoreTags = v; }));

    const rangeInput = document.createElement('input');
    rangeInput.type = 'text';
    rangeInput.placeholder = '범위 지정';
    rangeInput.autocomplete = 'off';
    rangeInput.autocorrect = 'off';
    rangeInput.autocapitalize = 'off';
    rangeInput.spellcheck = false;
    rangeInput.style.cssText = 'width:70px; box-sizing:border-box; padding:6px 10px; border-radius:8px; border:1px solid #dddddd; background:#f4f4f4; font-size:13px; font-family:inherit; margin:0;';

    function getOptions() {
        return { ...state };
    }

    return { grid, rangeInput, getOptions };
}

// 검색범위 입력값을 옵션에 반영. 형식이 잘못됐으면 false를 반환(그때는 진행하면 안 됨)
function applyRangeToOptions(options, rangeInput) {
    const range = parseRangeInput(rangeInput.value);
    if (range === 'invalid') {
        toastr.error('검색 범위를 올바르게 입력해주세요. 예: 5 / 2-8 / 1,3,5-9', '', { timeOut: 4000 });
        return false;
    }
    if (range) options.allowedIdxs = new Set(range);
    return true;
}

// ── /find ────────────────────────────────────────────────────────────────────

export function runFind(keyword, options = {}) {
    const settings = getSettings();
    if (!settings.hlEnabled) { toastr.info('편집모드(/edit-mode)에서 하이라이트가 꺼져있습니다.'); return; }

    const count = highlightKeyword(keyword, options);
    if (!count) { toastr.info('검색 결과가 없습니다.'); return; }

    const panel = createPanel('ct-find-panel', resultTitleHtml(keyword, count, options), () => clearHighlights());
    const body = getPanelBody(panel);
    const row = document.createElement('div');
    row.appendChild(btn('◀ 이전', () => { focusPrev(); updatePositionLabel(panel); }));
    row.appendChild(btn('다음 ▶︎', () => { focusNext(); updatePositionLabel(panel); }));
    body.appendChild(row);

    updatePositionLabel(panel);
}

function openFindInputPanel() {
    const panel = createPanel('ct-find-panel', '검색');
    const body = getPanelBody(panel);
    const input = inputBox('찾을 단어를 입력하세요');
    body.appendChild(input);

    const { grid, rangeInput, getOptions } = buildSearchControls();
    body.appendChild(grid);

    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
    bottomRow.appendChild(rangeInput);
    const findBtn = btn('찾기', doFind);
    findBtn.classList.add('ct-btn-white');
    findBtn.style.margin = '0';
    bottomRow.appendChild(findBtn);
    body.appendChild(bottomRow);

    function doFind() {
        const kw = input.value.trim();
        if (!kw) return;
        const options = getOptions();
        if (!applyRangeToOptions(options, rangeInput)) return;
        panel.remove();
        runFind(kw, options);
    }
    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        doFind();
    });
    input.focus();
}

// ── /change ──────────────────────────────────────────────────────────────────

// 메시지 전체(채팅 전체, 또는 지정한 범위)에서 find를 replace로 전부 바꿈.
// 옵션(대소문자/띄어쓰기/온전한단어/태그무시)에 맞는 정규식으로 원본 텍스트(msg.mes)를 직접 치환.
async function runChangeAll(find, replace, options = {}) {
    if (!find) { toastr.error('원본텍스트가 비어있습니다.'); return; }
    const chat = getChat();
    let changedCount = 0;
    for (let idx = 0; idx < chat.length; idx++) {
        if (options.allowedIdxs && !options.allowedIdxs.has(idx)) continue;
        const msg = chat[idx];
        if (!msg) continue;
        const raw = msg.mes;
        const searchText = options.ignoreTags ? maskTags(raw) : raw;
        const re = buildSearchRegex(find, options);

        const found = [];
        let m;
        while ((m = re.exec(searchText)) !== null) {
            if (m.index === re.lastIndex) { re.lastIndex++; continue; }
            found.push({ start: m.index, end: m.index + m[0].length });
        }
        if (!found.length) continue;

        let newMes = '';
        let cursor = 0;
        found.forEach(({ start, end }) => {
            newMes += raw.slice(cursor, start) + replace;
            cursor = end;
        });
        newMes += raw.slice(cursor);

        await editMessage(idx, newMes);
        changedCount++;
    }
    if (changedCount) toastr.success(`${changedCount}개 메시지에서 바꿨습니다.`);
    else toastr.info('일치하는 내용이 없습니다.');
}

// 지금 하이라이트로 선택되어 있는 "이 매치 하나만" 원본 텍스트에서 바꿈.
// ("하나씩 검토" 모드에서 사용 — runChangeAll과 같은 방식으로 위치를 찾되, 그중 현재 매치 하나만 교체)
async function runChangeOne(find, replace, options = {}) {
    const match = getCurrentMatch();
    if (!match) { toastr.info('선택된 항목이 없습니다.'); return; }
    const chat = getChat();
    const msg = chat[match.msgIdx];
    if (!msg) return;
    const raw = msg.mes;
    const searchText = options.ignoreTags ? maskTags(raw) : raw;
    const re = buildSearchRegex(find, options);

    const found = [];
    let m;
    while ((m = re.exec(searchText)) !== null) {
        if (m.index === re.lastIndex) { re.lastIndex++; continue; }
        found.push({ start: m.index, end: m.index + m[0].length });
    }
    const target = found[match.occurrence];
    if (!target) { toastr.error('원문에서 해당 위치를 찾지 못했습니다.'); return; }

    const newMes = raw.slice(0, target.start) + replace + raw.slice(target.end);
    await editMessage(match.msgIdx, newMes);
    toastr.success('바꿨습니다.', '', { timeOut: 1500 });
}

function showChangeResultPanel(find, replaceValue, options, startReviewing = false) {
    const panel = createPanel('ct-change-panel', resultTitleHtml(find, getMarkCount(), options), () => clearHighlights());
    const body = getPanelBody(panel);
    updatePositionLabel(panel);

    const replaceInput = inputBox('바꿀 텍스트');
    replaceInput.value = replaceValue;
    body.appendChild(replaceInput);

// '하나씩 검토'와 '모두 바꾸기'는 항상 한 줄(actionRow)에 있음.
    // '하나씩 검토'를 누르면 새 줄이 생기는 게 아니라, 같은 자리(leftGroup)의
    // 내용물이 '◂ 이전 / 다음 ▸'으로 바뀔 뿐이라 '모두 바꾸기' 위치는 그대로 유지됨.
    const actionRow = document.createElement('div');
    actionRow.className = 'ct-action-row';

    const leftGroup = document.createElement('div');
    leftGroup.style.cssText = 'display:flex; gap:6px; align-items:center;';

let reviewing = startReviewing; // false: '모두 바꾸기' 모드, true: '하나씩 검토' 후 '바꾸기'(현재 매치만) 모드
    
    const reviewBtn = btn('하나씩 검토', () => {
        reviewing = true;
        reviewBtn.style.display = 'none';
        navGroup.style.display = 'flex';
        allBtn.textContent = '바꾸기';
    });
    leftGroup.appendChild(reviewBtn);

    const navGroup = document.createElement('div');
    navGroup.style.cssText = 'display:none; gap:6px;';
    navGroup.appendChild(btn('◂ 이전', () => { focusPrev(); updatePositionLabel(panel); }));
    navGroup.appendChild(btn('다음 ▸', () => { focusNext(); updatePositionLabel(panel); }));
    leftGroup.appendChild(navGroup);

    actionRow.appendChild(leftGroup);

    const allBtn = btn('모두 바꾸기', async () => {
        if (reviewing) {
            // '하나씩 검토' 모드: 지금 보고 있는 매치 하나만 바꾸고, 검색을 새로고침해서 계속 검토할 수 있게 함
            await runChangeOne(find, replaceInput.value, options);
            panel.remove();
            runChangeSearch(find, replaceInput.value, options, true);
        } else {
            // 기본 모드: 전체 매치를 한 번에 바꿈
            clearHighlights();
            panel.remove();
            await runChangeAll(find, replaceInput.value, options);
        }
    });
    allBtn.classList.add('ct-btn-white');
    actionRow.appendChild(allBtn);

    // 검토 중이었다면(=방금 하나 바꾸고 다시 그려진 패널이라면) 처음부터
    // '이전/다음 + 바꾸기' 상태로 열어서 검토 흐름이 끊기지 않게 함
    if (startReviewing) {
        reviewBtn.style.display = 'none';
        navGroup.style.display = 'flex';
        allBtn.textContent = '바꾸기';
    }

    body.appendChild(actionRow);
}

function runChangeSearch(find, replaceValue, options = {}, startReviewing = false) {
    const settings = getSettings();
    if (!settings.hlEnabled) { toastr.info('편집모드(/edit-mode)에서 하이라이트가 꺼져있습니다.'); return; }

    const count = highlightKeyword(find, options);
    if (!count) { toastr.info('검색 결과가 없습니다.'); return; }

    showChangeResultPanel(find, replaceValue, options, startReviewing);
}

function openChangeInputPanel() {
    const panel = createPanel('ct-change-panel', '찾아바꾸기');
    const body = getPanelBody(panel);
    const findInput = inputBox('찾을 텍스트');
    body.appendChild(findInput);

    const { grid, rangeInput, getOptions } = buildSearchControls();
    body.appendChild(grid);

    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
    bottomRow.appendChild(rangeInput);
    const searchBtn = btn('검색', doSearch);
    searchBtn.classList.add('ct-btn-white');
    searchBtn.style.margin = '0';
    bottomRow.appendChild(searchBtn);
    body.appendChild(bottomRow);

    function doSearch() {
        const find = findInput.value.trim();
        if (!find) return;
        const options = getOptions();
        if (!applyRangeToOptions(options, rangeInput)) return;
        panel.remove();
        runChangeSearch(find, '', options);
    }
    findInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        doSearch();
    });
    findInput.focus();
}

// ── 명령어 등록 ────────────────────────────────────────────────────────────────

export function registerFindChangeCommands() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'find',
        helpString: '채팅에서 검색합니다. 사용법: /find 키워드, 또는 키워드 없이 /find 만 입력하면 옵션과 범위를 고를 수 있는 입력 패널이 뜹니다.',
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
        helpString: '채팅에서 찾아 바꿉니다. 검색 후 검토/바꾸기를 선택합니다. 사용법: /change 원본텍스트/바꿀텍스트, 또는 인자 없이 /change 만 입력하면 옵션과 범위를 고를 수 있는 입력 패널이 뜹니다.',
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
