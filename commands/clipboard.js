// ─── commands/clipboard.js ──────────────────────────────────────────────────
// /clip — 메시지를 클립보드에 복사

import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '/scripts/slash-commands/SlashCommandArgument.js';
import { parseRange, stripText } from '../utils.js';
import { getChat, copyText } from '../state.js';

export function registerClipboardCommand() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'clip',
        helpString: '메시지를 클립보드에 복사합니다. 사용법: /clip (전체), /clip 2, /clip 2-5',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({ description: '메시지 번호 또는 범위 (생략시 전체)', typeList: [ARGUMENT_TYPE.STRING], isRequired: false }),
        ],
        callback: async (_a, value) => {
            const trimmed = String(value ?? '').trim();
            const chat = getChat();
            const ctx = SillyTavern.getContext();
            const idxs = trimmed ? parseRange(trimmed) : chat.map((_, i) => i);
            if (!idxs) { toastr.error('사용법: /clip, /clip 2, /clip 2-5'); return ''; }

            const lines = idxs
                .map((i) => chat[i])
                .filter(Boolean)
                .map((msg) => `${msg.name || (msg.is_user ? ctx.name1 : ctx.name2)}: ${stripText(msg.mes)}`);
            if (!lines.length) { toastr.info('복사할 내용이 없습니다.'); return ''; }

            await copyText(lines.join('\n\n'));
            return '';
        },
    }));
}
