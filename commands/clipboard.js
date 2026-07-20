// ─── commands/clipboard.js ──────────────────────────────────────────────────
// /st copy — 선택한 텍스트, 입력한 텍스트, 또는 현재 입력창 텍스트를 클립보드에 복사

import { copyText as writeClipboard } from '../state.js';

function getSelectedPageText() {
    const text = window.getSelection()?.toString() ?? '';
    return text.trim() ? text : '';
}

function getActiveInputText() {
    const el = document.activeElement;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return '';

    const value = String(el.value ?? '');
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = start !== end ? value.slice(start, end) : '';
    const text = selected || value;

    // /st copy를 실행한 입력창 자체를 복사하지 않도록 방지
    if (/^\/st\s+copy(?:\s|$)/i.test(text.trim())) return '';
    return text.trim() ? text : '';
}

export async function copyText(value = '') {
    const directText = String(value ?? '').trim();
    const text = directText || getSelectedPageText() || getActiveInputText();

    if (!text) {
        toastr.info('복사할 텍스트가 없습니다.');
        return;
    }

    await writeClipboard(text);
    toastr.success('복사했습니다.', '', { timeOut: 1500 });
}
