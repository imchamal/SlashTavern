// ─── commands/quick-edit.js ─────────────────────────────────────────────────
// 채팅 메시지에서 텍스트를 드래그(길게 눌러 선택)하면 그 아래에 "✏️" 아이콘이 뜨고,
// 누르면 다른 패널들과 같은 디자인의 입력 패널이 떠서 그 부분만 바꿔줌.

import { getChat, editMessage, getSettings } from '../state.js';
import { createPanel, getPanelBody, inputBox, btn } from '../panel-ui.js';

let pillEl = null;
let debounceTimer = null;

function removePill() {
    pillEl?.remove();
    pillEl = null;
}

function showPill(x, y, onClick) {
    removePill();
    pillEl = document.createElement('div');
    pillEl.className = 'ct-pill';
    pillEl.textContent = '✏️';
    pillEl.style.left = `${x}px`;
    pillEl.style.top = `${y}px`;
    pillEl.addEventListener('pointerdown', (e) => e.stopPropagation());
    pillEl.addEventListener('click', () => { onClick(); removePill(); });
    document.body.appendChild(pillEl);
}

function openQuickEditPanel(msgIdx, originalText) {
    const panel = createPanel('ct-quick-edit-panel', '빠른수정');
    const body = getPanelBody(panel);
    const input = inputBox('바꿀 텍스트');
    input.value = originalText;
    body.appendChild(input);
    body.appendChild(btn('적용', async () => {
        const replacement = input.value;
        panel.remove();
        const chat = getChat();
        const msg = chat[msgIdx];
        if (!msg) return;
        const idx = msg.mes.indexOf(originalText);
        if (idx === -1) {
            toastr.error('원문에서 선택한 텍스트를 정확히 찾지 못했습니다. (서식 문자 때문일 수 있음)', '', { timeOut: 4000 });
            return;
        }
        const newMes = msg.mes.slice(0, idx) + replacement + msg.mes.slice(idx + originalText.length);
        await editMessage(msgIdx, newMes);
        toastr.success('수정되었습니다.', '', { timeOut: 2000 });
    }));
    input.focus();
    input.select();
}

function handleSelection() {
    const settings = getSettings();
    if (!settings.quickEditEnabled) { removePill(); return; }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { removePill(); return; }
    const text = sel.toString();
    if (!text.trim()) { removePill(); return; }

    const range = sel.getRangeAt(0);
    const startNode = range.startContainer;
    const startEl = startNode.nodeType === 1 ? startNode : startNode.parentElement;
    const mesEl = startEl?.closest?.('.mes[mesid]');
    if (!mesEl) { removePill(); return; }

    const msgIdx = parseInt(mesEl.getAttribute('mesid'), 10);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) { removePill(); return; }

    showPill(rect.ㅠ + rect.width / 2, rect.bottom - 10, () => {
        openQuickEditPanel(msgIdx, text);
    });
}

export function registerQuickEdit() {
    document.addEventListener('selectionchange', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleSelection, 150);
    });
    document.addEventListener('pointerdown', (e) => {
        if (pillEl && !pillEl.contains(e.target)) removePill();
    });
}
