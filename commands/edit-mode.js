// ─── commands/edit-mode.js ──────────────────────────────────────────────────
// /st settings — SlashTavern 설정 패널.
// 여기서 바꾼 값은 getSettings()/saveSettings()를 통해 SillyTavern 서버에 저장되므로,
// Termux 서버에 접속하는 어떤 기기(아이폰 포함)에서 봐도 같은 값이 적용됨.

import { SlashCommandParser } from '/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '/scripts/slash-commands/SlashCommand.js';
import { getSettings, saveSettings } from '../state.js';
import { createPanel, getPanelBody } from '../panel-ui.js';

function settingRow(title, desc, getVal, onChange) {
    const row = document.createElement('div');
    row.className = 'ct-setting-row';

    const label = document.createElement('div');
    label.className = 'ct-setting-label';
    label.innerHTML = `<b>${title}</b><span>${desc}</span>`;
    row.appendChild(label);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = `ct-toggle${getVal() ? ' on' : ''}`;
    toggle.title = title;
    toggle.addEventListener('click', () => {
        const next = !getVal();
        onChange(next);
        toggle.classList.toggle('on', next);
    });
    row.appendChild(toggle);

    return row;
}

export function openSettingsPanel() {
    const settings = getSettings();
    const panel = createPanel('ct-settings-panel', '설정');
    const body = getPanelBody(panel);

    body.appendChild(settingRow(
        '하이라이트 사용',
        '/search 결과를 채팅에 색으로 표시',
        () => settings.hlEnabled,
        (v) => { settings.hlEnabled = v; saveSettings(); },
    ));
    body.appendChild(settingRow(
        '퀵 메뉴 사용',
        '텍스트 드래그 시 빠른수정 아이콘 표시',
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
