// ─── commands/scroll.js ─────────────────────────────────────────────────────
// /up, /down, /goto, /prev, /next — 스크롤 이동

import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '/scripts/slash-commands/SlashCommandArgument.js';

// 실리태번은 성능을 위해 최근 N개 메시지만 화면(DOM)에 그려두고, 그 이상은
// "Show more messages" 버튼을 눌러야 위쪽 메시지들을 추가로 불러옴.
// predicate()가 true가 될 때까지(=원하는 메시지가 로드될 때까지) 그 버튼을 대신 눌러줌.
async function loadMoreUntil(predicate, { maxAttempts = 50, delay = 200 } = {}) {
    for (let i = 0; i < maxAttempts; i++) {
        if (predicate()) return true;
        const moreBtn = document.getElementById('show_more_messages');
        if (!moreBtn) return predicate(); // 더 불러올 게 없음 — 여기서 끝
        moreBtn.click();
        await new Promise((r) => setTimeout(r, delay));
    }
    return predicate();
}

export async function scrollUp() {
    document.getElementById('chat')?.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function scrollDown() {
    const chatEl = document.getElementById('chat');
    chatEl?.scrollTo({ top: chatEl.scrollHeight, behavior: 'smooth' });
}

export async function scrollToMemoryBoundary() {
    const marker = document.querySelector('div.stmb_memory_boundary_divider');
    if (marker) marker.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function getCurrentMessageIndex() {
    const chatEl = document.getElementById('chat');
    const messages = [...document.querySelectorAll('.mes[mesid]')];
    if (!messages.length) return null;

    const chatTop = chatEl?.getBoundingClientRect().top ?? 0;
    let bestIdx = parseInt(messages[0].getAttribute('mesid'), 10);
    let bestDistance = Infinity;

    for (const el of messages) {
        const idx = parseInt(el.getAttribute('mesid'), 10);
        if (Number.isNaN(idx)) continue;
        const distance = Math.abs(el.getBoundingClientRect().top - chatTop);
        if (distance < bestDistance) {
            bestIdx = idx;
            bestDistance = distance;
        }
    }

    return bestIdx;
}

export async function scrollToMessage(value) {
    const idx = parseInt(value, 10);
    if (Number.isNaN(idx)) { toastr.error('사용법: /goto 5 또는 /st goto 5'); return; }
    await loadMoreUntil(() => !!document.querySelector(`[mesid="${idx}"]`));
    const el = document.querySelector(`[mesid="${idx}"]`);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    else toastr.error(`${idx}번 메시지를 화면에서 찾지 못했습니다. (실제로 존재하지 않는 번호일 수 있음)`, '', { timeOut: 5000 });
}

export async function scrollToAdjacentMessage(direction) {
    const currentIdx = getCurrentMessageIndex();
    if (currentIdx === null) return;

    const targetIdx = currentIdx + direction;
    if (targetIdx < 0) return;

    await loadMoreUntil(() => !!document.querySelector(`[mesid="${targetIdx}"]`));
    const el = document.querySelector(`[mesid="${targetIdx}"]`);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

export function registerScrollCommands() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'up',
        helpString: '채팅 맨 위로 스크롤합니다.',
        callback: async () => {
            await scrollUp();
            return '';
        },
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'down',
        helpString: '채팅 맨 아래로 스크롤합니다.',
        callback: async () => {
            await scrollDown();
            return '';
        },
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'prev',
        helpString: '현재 위치 기준 이전 메시지로 스크롤합니다.',
        callback: async () => {
            await scrollToAdjacentMessage(-1);
            return '';
        },
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'next',
        helpString: '현재 위치 기준 다음 메시지로 스크롤합니다.',
        callback: async () => {
            await scrollToAdjacentMessage(1);
            return '';
        },
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'message-mb',
        helpString: 'STMemoryBooks 확장의 메모리 경계선(마지막 요약 지점)으로 스크롤합니다.',
        callback: async () => {
            await scrollToMemoryBoundary();
            return '';
        },
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'goto',
        helpString: '메시지 번호로 스크롤합니다. 사용법: /goto 5',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({ description: '메시지 번호', typeList: [ARGUMENT_TYPE.NUMBER], isRequired: true }),
        ],
        callback: async (_a, value) => {
            await scrollToMessage(value);
            return '';
        },
    }));
}
