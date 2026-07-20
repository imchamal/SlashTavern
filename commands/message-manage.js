// ─── commands/message-manage.js ─────────────────────────────────────────────
// /messages — 전체 메시지 목록을 패널로 열어서, 체크박스로 여러 개를 선택한 뒤
// 한꺼번에 숨김 / 숨김해제 / 삭제할 수 있음.
//
// 실제 숨김/삭제는 chat 배열을 직접 건드리지 않고, SillyTavern 자체 슬래시커맨드인
// /hide, /unhide, /cut을 대신 실행시키는 방식(Slashie와 동일한 방식) — 번호 재계산이나
// 내부 캐시 정리를 ST 본체가 알아서 깔끔하게 해줌.

import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { getChat } from '../state.js';
import { createPanel, getPanelBody, btn, setPanelTitleWithBack } from '../panel-ui.js';
import { previewText } from '../utils.js';

// 정렬된 인덱스 배열을 연속 구간들로 묶음. 예: [1,2,3,7,9,10] → [[1,3],[7,7],[9,10]]
function groupIntoRanges(sortedIdxs) {
    const ranges = [];
    let start = sortedIdxs[0];
    let prev = sortedIdxs[0];
    for (let i = 1; i < sortedIdxs.length; i++) {
        const cur = sortedIdxs[i];
        if (cur === prev + 1) { prev = cur; continue; }
        ranges.push([start, prev]);
        start = cur; prev = cur;
    }
    ranges.push([start, prev]);
    return ranges;
}

async function runHideUnhide(idxs, hide) {
    const ctx = SillyTavern.getContext();
    if (typeof ctx.executeSlashCommandsWithOptions !== 'function') {
        toastr.error('이 기능은 SillyTavern 최신 버전에서만 사용할 수 있습니다.', '', { timeOut: 4000 });
        return false;
    }
    for (const idx of idxs) {
        await ctx.executeSlashCommandsWithOptions(`/${hide ? 'hide' : 'unhide'} ${idx}`, { showOutput: false });
    }
    return true;
}

// 뒤(큰 번호)부터 잘라야 앞쪽 구간의 번호가 안 밀림 — 순서가 중요함
async function runDelete(idxs) {
    const ctx = SillyTavern.getContext();
    if (typeof ctx.executeSlashCommandsWithOptions !== 'function') {
        toastr.error('이 기능은 SillyTavern 최신 버전에서만 사용할 수 있습니다.', '', { timeOut: 4000 });
        return false;
    }
    const sorted = [...idxs].sort((a, b) => a - b);
    const ranges = groupIntoRanges(sorted);
    for (let i = ranges.length - 1; i >= 0; i--) {
        const [s, e] = ranges[i];
        const arg = s === e ? `${s}` : `${s}-${e}`;
        await ctx.executeSlashCommandsWithOptions(`/cut ${arg}`, { showOutput: false });
    }
    return true;
}

export function openMessagePanel() {
    const chat = getChat();
    if (!chat.length) { toastr.info('채팅에 메시지가 없습니다.'); return; }

    const ctx = SillyTavern.getContext();
    const selected = new Set();

    const panel = createPanel('ct-messages-panel', `전체 메시지 <span class="ct-dim">(${chat.length})</span>`);
    const body = getPanelBody(panel);
    setPanelTitleWithBack(panel, `전체 메시지 <span class="ct-dim">(${chat.length})</span>`, '메시지 도구로 돌아가기', async () => {
        panel.remove();
        const { openUnifiedMessagesPanel } = await import('./unified-panel.js');
        openUnifiedMessagesPanel();
    });

    const topRow = document.createElement('div');
    topRow.className = 'ct-row-between';
    const countLabel = document.createElement('span');
    countLabel.className = 'ct-dim';
    const selectAllBtn = btn('전체 선택', () => {
        if (selected.size === chat.length) selected.clear();
        else chat.forEach((_, idx) => selected.add(idx));
        renderList();
    });
    topRow.appendChild(countLabel);
    topRow.appendChild(selectAllBtn);
    body.appendChild(topRow);

    const list = document.createElement('div');
    list.className = 'ct-list-scroll';
    body.appendChild(list);

    function updateCountLabel() {
        countLabel.textContent = `${selected.size}개 선택됨`;
        selectAllBtn.textContent = selected.size === chat.length ? '전체 해제' : '전체 선택';
    }

    function renderList() {
        updateCountLabel();
        list.innerHTML = '';
        chat.forEach((msg, idx) => {
            const item = document.createElement('label');
            item.className = 'ct-result-item';
            item.style.cssText = 'display:flex; align-items:center; gap:var(--ct-list-gap); cursor:pointer;' + (msg.is_system ? ' opacity:0.55;' : '');

            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = selected.has(idx);
            chk.addEventListener('change', () => {
                if (chk.checked) selected.add(idx); else selected.delete(idx);
                updateCountLabel();
            });

            const num = document.createElement('span');
            num.className = 'ct-list-num';
            num.textContent = `#${idx}`;

            const sender = msg.name || (msg.is_user ? ctx.name1 : ctx.name2);
            const txt = document.createElement('span');
            txt.className = 'ct-list-text';
            txt.textContent = `${sender}: ${previewText(msg.mes)}`;

            item.appendChild(chk);
            item.appendChild(num);
            item.appendChild(txt);
            if (msg.is_system) {
                const badge = document.createElement('span');
                badge.className = 'ct-badge';
                badge.textContent = '숨김';
                item.appendChild(badge);
            }
            list.appendChild(item);
        });
    }

    renderList();

    // 작업 후에는 패널을 닫고 새로 열어서(=다시 조회) 항상 최신 상태를 보여줌.
    // 삭제는 배열 길이 자체가 바뀌므로 재조회가 특히 중요함.
    function reopen() {
        panel.remove();
        openMessagePanel();
    }

    const actionRow = document.createElement('div');
    actionRow.className = 'ct-action-row';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'ct-row-gap';
    leftGroup.appendChild(btn('<i class="fa-solid fa-eye-slash"></i> 선택 숨김', async () => {
        if (!selected.size) { toastr.info('선택된 메시지가 없습니다.'); return; }
        const ok = await runHideUnhide([...selected], true);
        if (ok) { toastr.success('숨김 처리했습니다.', '', { timeOut: 2000 }); reopen(); }
    }));
    leftGroup.appendChild(btn('<i class="fa-solid fa-eye"></i> 숨김해제', async () => {
        if (!selected.size) { toastr.info('선택된 메시지가 없습니다.'); return; }
        const ok = await runHideUnhide([...selected], false);
        if (ok) { toastr.success('숨김을 해제했습니다.', '', { timeOut: 2000 }); reopen(); }
    }));
    actionRow.appendChild(leftGroup);

    const deleteBtn = btn('<i class="fa-solid fa-trash-can"></i> 선택 삭제', async () => {
        if (!selected.size) { toastr.info('선택된 메시지가 없습니다.'); return; }
        const confirmed = confirm(`선택한 ${selected.size}개 메시지를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`);
        if (!confirmed) return;
        const ok = await runDelete([...selected]);
        if (ok) { toastr.success('삭제했습니다.', '', { timeOut: 2000 }); reopen(); }
    });
    deleteBtn.classList.add('ct-btn-danger');
    actionRow.appendChild(deleteBtn);

    body.appendChild(actionRow);
}

export function registerMessageManageCommand() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'messages',
        helpString: '전체 메시지 목록을 엽니다. 체크박스로 여러 개를 선택해 숨김/숨김해제/삭제할 수 있습니다.',
        callback: async () => {
            openMessagePanel();
            return '';
        },
    }));
}
