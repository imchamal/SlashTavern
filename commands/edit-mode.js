// ─── commands/edit-mode.js ──────────────────────────────────────────────────
// /st settings — SlashTavern 설정 패널.
// 여기서 바꾼 값은 getSettings()/saveSettings()를 통해 SillyTavern 서버에 저장되므로,
// Termux 서버에 접속하는 어떤 기기(아이폰 포함)에서 봐도 같은 값이 적용됨.

import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { getSettings, saveSettings } from '../state.js';
import { createPanel, getPanelBody, checkRow } from '../panel-ui.js';

export function openSettingsPanel() {
    const settings = getSettings();
    const panel = createPanel('ct-settings-panel', '설정');
    const body = getPanelBody(panel);

    body.appendChild(checkRow(
        '하이라이트 사용',
        () => settings.hlEnabled,
        (v) => { settings.hlEnabled = v; saveSettings(); },
    ));
    body.appendChild(checkRow(
        '퀵 메뉴 사용',
        () => settings.quickEditEnabled,
        (v) => { settings.quickEditEnabled = v; saveSettings(); },
    ));
}

export function registerSettingsCommand() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'settings',
        helpString: '설정 패널을 엽니다. (검색 하이라이트, 빠른수정 아이콘 켬/끔)',
        callback: async () => {
            openSettingsPanel();
            return '';
        },
    }));
}
