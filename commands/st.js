import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '/scripts/slash-commands/SlashCommandArgument.js';
import {
    scrollUp, scrollDown, scrollToMessage,
    scrollToMemoryBoundary, scrollToAdjacentMessage,
} from './scroll.js';
import { runSearchCommand } from './find-change.js';
import { copyMessages } from './clipboard.js';
import { countWords } from './wordcount.js';
import { openEditModePanel } from './edit-mode.js';
import { openMessagePanel } from './message-manage.js';

const SUBCOMMANDS = [
    'search',
    'goto',
    'up',
    'down',
    'prev',
    'next',
    'message-mb',
    'clip',
    'word',
    'settings',
    'messages',
];

function splitSubcommand(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return { command: '', rest: '' };
    const firstSpace = raw.search(/\s/);
    if (firstSpace === -1) return { command: raw, rest: '' };
    return {
        command: raw.slice(0, firstSpace),
        rest: raw.slice(firstSpace).trim(),
    };
}

async function runStSubcommand(command, rest) {
    switch (command) {
        case 'search':
            await runSearchCommand(rest);
            break;
        case 'goto':
            await scrollToMessage(rest);
            break;
        case 'up':
            await scrollUp();
            break;
        case 'down':
            await scrollDown();
            break;
        case 'prev':
            await scrollToAdjacentMessage(-1);
            break;
        case 'next':
            await scrollToAdjacentMessage(1);
            break;
        case 'message-mb':
            await scrollToMemoryBoundary();
            break;
        case 'clip':
            await copyMessages(rest);
            break;
        case 'word':
            await countWords(rest);
            break;
        case 'settings':
            openSettingsPanel();
            break;
        case 'messages':
            openMessagePanel();
            break;
        default:
            toastr.error(`알 수 없는 SlashTavern 명령어입니다: ${command}`, '', { timeOut: 4000 });
    }
}

export function registerStCommand() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'st',
        helpString: 'SlashTavern 명령어 모음입니다. 사용법: /st search, /st goto 5, /st messages',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'SlashTavern 명령어',
                typeList: [ARGUMENT_TYPE.STRING],
                enumList: SUBCOMMANDS,
                isRequired: false,
            }),
        ],
        callback: async (_a, value) => {
            const { command, rest } = splitSubcommand(value);
            if (!command) {
                toastr.info('사용법: /st search, /st goto 5, /st messages');
                return '';
            }
            await runStSubcommand(command, rest);
            return '';
        },
    }));
}
