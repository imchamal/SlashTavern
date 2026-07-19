import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '/scripts/slash-commands/SlashCommandArgument.js';

export function registerStCommand() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'st',
        helpString: 'SlashTavern 명령어를 실행합니다. 사용법: /st search, /st goto 5, /st messages',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: '실행할 SlashTavern 명령어',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        callback: async (_a, value) => {
            const raw = String(value ?? '').trim();

            if (!raw) {
                toastr.info('사용법: /st search, /st goto 5, /st messages');
                return '';
            }

            const ctx = SillyTavern.getContext();

            if (typeof ctx.executeSlashCommandsWithOptions !== 'function') {
                toastr.error('이 기능은 SillyTavern 최신 버전에서만 사용할 수 있습니다.');
                return '';
            }

            await ctx.executeSlashCommandsWithOptions(`/${raw}`, { showOutput: false });
            return '';
        },
    }));
}