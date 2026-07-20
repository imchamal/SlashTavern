// ─── commands/swipes.js ─────────────────────────────────────────────────────
// /st swipes — 스와이프가 있는 메시지를 고르고, 개별 스와이프를 선택/삭제/정리

import { getChat } from '../state.js';
import { createPanel, getPanelBody, btn } from '../panel-ui.js';
import { previewText } from '../utils.js';
import { scrollToMessage } from './scroll.js';

function getSwipeItems() {
    return getChat()
        .map((msg, idx) => ({ msg, idx }))
        .filter(({ msg }) => Array.isArray(msg?.swipes) && msg.swipes.length > 1);
}

function getCurrentSwipeIndex(msg) {
    const idx = Number.isInteger(msg?.swipe_id) ? msg.swipe_id : 0;
    if (!Array.isArray(msg?.swipes) || !msg.swipes.length) return 0;
    return Math.min(Math.max(idx, 0), msg.swipes.length - 1);
}

function setPanelTitle(panel, title) {
    const titleEl = panel.querySelector('.ct-panel-header > span');
    if (titleEl) titleEl.textContent = title;
}

function renderMessage(msgIdx) {
    const ctx = SillyTavern.getContext();
    const msg = getChat()[msgIdx];
    const el = document.querySelector(`#chat [mesid="${msgIdx}"] .mes_text`);
    if (msg && el && ctx.messageFormatting) {
        el.innerHTML = ctx.messageFormatting(msg.mes, msg.name, msg.is_system, msg.is_user, msgIdx);
    }
    ctx.saveChatDebounced?.();
}

function setCurrentSwipe(msgIdx, swipeIdx) {
    const msg = getChat()[msgIdx];
    if (!msg || !Array.isArray(msg.swipes) || swipeIdx < 0 || swipeIdx >= msg.swipes.length) return false;
    msg.swipe_id = swipeIdx;
    msg.mes = msg.swipes[swipeIdx];
    renderMessage(msgIdx);
    return true;
}

function deleteSwipe(msgIdx, swipeIdx) {
    const msg = getChat()[msgIdx];
    if (!msg || !Array.isArray(msg.swipes) || msg.swipes.length <= 1) {
        toastr.info('마지막 스와이프는 삭제할 수 없습니다.');
        return false;
    }

    const current = getCurrentSwipeIndex(msg);
    msg.swipes.splice(swipeIdx, 1);

    let nextCurrent = current;
    if (swipeIdx < current) nextCurrent = current - 1;
    else if (swipeIdx === current) nextCurrent = Math.min(current, msg.swipes.length - 1);

    return setCurrentSwipe(msgIdx, nextCurrent);
}

function keepOnlySwipe(msgIdx, swipeIdx) {
    const msg = getChat()[msgIdx];
    if (!msg || !Array.isArray(msg.swipes) || swipeIdx < 0 || swipeIdx >= msg.swipes.length) return false;

    const selected = msg.swipes[swipeIdx];
    msg.swipes = [selected];
    msg.swipe_id = 0;
    msg.mes = selected;
    renderMessage(msgIdx);
    return true;
}

function createIconButton(icon, title, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ct-btn';
    button.textContent = icon;
    button.title = title;
    button.style.cssText = 'width:28px; height:28px; padding:0; margin:0; display:inline-flex; align-items:center; justify-content:center;';
    button.addEventListener('click', onClick);
    return button;
}

function createSwipeRow({ msgIdx, swipeIdx, text, isCurrent, isSelected, onSelect, onDelete }) {
    const row = document.createElement('div');
    row.className = 'ct-result-item';
    row.style.cssText = 'cursor:pointer; margin-bottom:6px;' +
        (isCurrent ? ' border-color:#1976d2; background:#eef6ff;' : '') +
        (!isCurrent && isSelected ? ' border-color:#999999;' : '');

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; gap:8px;';

    const num = document.createElement('span');
    num.style.cssText = 'flex-shrink:0; width:1.8em; font-size:12px; font-weight:600;';
    num.textContent = String(swipeIdx + 1);
    header.appendChild(num);

    const preview = document.createElement('span');
    preview.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px;';
    preview.textContent = previewText(text, 90);
    header.appendChild(preview);

    if (isCurrent) {
        const badge = document.createElement('span');
        badge.className = 'ct-badge';
        badge.textContent = '현재';
        header.appendChild(badge);
    } else if (isSelected) {
        const badge = document.createElement('span');
        badge.className = 'ct-badge';
        badge.textContent = '선택';
        header.appendChild(badge);
    }

    const toggleBtn = createIconButton('▸', '내용 펼치기/접기', (e) => {
        e.stopPropagation();
        const open = content.style.display === 'none';
        content.style.display = open ? 'block' : 'none';
        toggleBtn.textContent = open ? '▾' : '▸';
    });
    header.appendChild(toggleBtn);

    const deleteBtn = createIconButton('🗑', '스와이프 삭제', (e) => {
        e.stopPropagation();
        const confirmed = confirm(`${swipeIdx + 1}번 스와이프를 삭제할까요?`);
        if (!confirmed) return;
        onDelete();
    });
    deleteBtn.classList.add('ct-btn-danger');
    header.appendChild(deleteBtn);

    row.appendChild(header);

    const content = document.createElement('div');
    content.style.cssText = 'display:none; white-space:pre-wrap; margin-top:8px; font-size:12px; line-height:1.45;';
    content.textContent = text;
    row.appendChild(content);

    row.addEventListener('click', () => onSelect());
    return row;
}

function renderSwipeList(panel) {
    const items = getSwipeItems();
    const body = getPanelBody(panel);
    body.innerHTML = '';
    setPanelTitle(panel, `스와이프 메시지 (${items.length})`);

    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'ct-dim';
        empty.textContent = '스와이프가 있는 메시지가 없습니다.';
        body.appendChild(empty);
        return;
    }

    const ctx = SillyTavern.getContext();
    items.forEach(({ msg, idx }) => {
        const item = document.createElement('div');
        item.className = 'ct-result-item';
        item.style.cssText = 'display:flex; align-items:center; gap:8px; cursor:pointer;';
        item.addEventListener('click', () => scrollToMessage(idx));

        const num = document.createElement('span');
        num.style.cssText = 'flex-shrink:0; min-width:2.6em; font-size:11px; color:#999;';
        num.textContent = `#${idx}`;
        item.appendChild(num);

        const txt = document.createElement('span');
        txt.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px;';
        const sender = msg.name || (msg.is_user ? ctx.name1 : ctx.name2);
        txt.textContent = `${sender}: ${previewText(msg.mes)}`;
        item.appendChild(txt);

        const badge = document.createElement('span');
        badge.className = 'ct-badge';
        badge.textContent = `${msg.swipes.length}개`;
        item.appendChild(badge);

        const detailBtn = btn('보기', (e) => {
            e.stopPropagation();
            renderSwipeDetail(panel, idx);
        });
        detailBtn.style.margin = '0';
        item.appendChild(detailBtn);

        body.appendChild(item);
    });
}

function renderSwipeDetail(panel, msgIdx) {
    const msg = getChat()[msgIdx];
    if (!msg || !Array.isArray(msg.swipes) || msg.swipes.length < 2) {
        renderSwipeList(panel);
        return;
    }

    const body = getPanelBody(panel);
    body.innerHTML = '';
    setPanelTitle(panel, `#${msgIdx} 스와이프 (${msg.swipes.length})`);

    renderSwipeDetailWithSelection(panel, msgIdx, getCurrentSwipeIndex(msg));
}

function renderSwipeDetailWithSelection(panel, msgIdx, selectedSwipeIdx) {
    const msg = getChat()[msgIdx];
    if (!msg || !Array.isArray(msg.swipes) || msg.swipes.length < 2) {
        renderSwipeList(panel);
        return;
    }

    const body = getPanelBody(panel);
    body.innerHTML = '';
    setPanelTitle(panel, `#${msgIdx} 스와이프 (${msg.swipes.length})`);

    const current = getCurrentSwipeIndex(msg);
    let selected = Math.min(Math.max(selectedSwipeIdx, 0), msg.swipes.length - 1);

    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px;';

    topRow.appendChild(btn('목록', () => renderSwipeList(panel)));

    const rightGroup = document.createElement('div');
    rightGroup.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;';
    const selectBtn = btn('이 버전 선택', () => {
        if (setCurrentSwipe(msgIdx, selected)) {
            toastr.success('선택했습니다.', '', { timeOut: 1500 });
            renderSwipeDetailWithSelection(panel, msgIdx, selected);
        }
    });
    if (selected === current) selectBtn.disabled = true;
    rightGroup.appendChild(selectBtn);

    const keepCurrentBtn = btn('현재 스와이프만 남기기', () => {
        const confirmed = confirm('현재 채택된 스와이프를 제외한 다른 스와이프를 모두 삭제할까요?');
        if (!confirmed) return;
        if (keepOnlySwipe(msgIdx, current)) {
            toastr.success('정리했습니다.', '', { timeOut: 1500 });
            renderSwipeList(panel);
        }
    });
    keepCurrentBtn.classList.add('ct-btn-danger');
    rightGroup.appendChild(keepCurrentBtn);
    topRow.appendChild(rightGroup);
    body.appendChild(topRow);

    msg.swipes.forEach((swipe, swipeIdx) => {
        body.appendChild(createSwipeRow({
            msgIdx,
            swipeIdx,
            text: swipe,
            isCurrent: swipeIdx === current,
            isSelected: swipeIdx === selected,
            onSelect: () => renderSwipeDetailWithSelection(panel, msgIdx, swipeIdx),
            onDelete: () => {
                if (deleteSwipe(msgIdx, swipeIdx)) {
                    toastr.success('삭제했습니다.', '', { timeOut: 1500 });
                    renderSwipeDetailWithSelection(panel, msgIdx, Math.min(selected, getChat()[msgIdx]?.swipes?.length - 1 ?? 0));
                }
            },
        }));
    });
}

export function openSwipesPanel() {
    const panel = createPanel('ct-swipes-panel', '스와이프 메시지');
    renderSwipeList(panel);
}
