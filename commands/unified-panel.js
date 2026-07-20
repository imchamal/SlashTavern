// ─── commands/unified-panel.js ─────────────────────────────────────────────
// /st messages — 메시지 관련 기능으로 들어가는 통합 패널

import { createPanel, getPanelBody } from '../panel-ui.js';
import { openSearchInputPanel } from './find-change.js';
import { openMessagePanel } from './message-manage.js';
import { openSwipesPanel } from './swipes.js';

function createMenuItem({ icon, title, desc, onClick }) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'ct-menu-item';

    const iconEl = document.createElement('span');
    iconEl.innerHTML = icon;
    iconEl.className = 'ct-menu-chip';
    item.appendChild(iconEl);

    const textWrap = document.createElement('span');
    textWrap.className = 'ct-menu-body';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;
    titleEl.className = 'ct-menu-title';
    textWrap.appendChild(titleEl);

    const descEl = document.createElement('span');
    descEl.textContent = desc;
    descEl.className = 'ct-menu-desc';
    textWrap.appendChild(descEl);

    item.appendChild(textWrap);
    const chev = document.createElement('span');
    chev.className = 'ct-menu-chev';
    chev.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
    item.appendChild(chev);
    item.addEventListener('click', onClick);
    return item;
}

export function openUnifiedMessagesPanel() {
    const panel = createPanel('ct-message-tools-panel', '메시지 도구');
    const body = getPanelBody(panel);
    body.classList.add('ct-menu-list');

    const openNext = (openPanel) => {
        panel.remove();
        openPanel();
    };

    body.appendChild(createMenuItem({
        icon: '<i class="fa-solid fa-magnifying-glass"></i>',
        title: '검색 및 바꾸기',
        desc: '채팅에서 단어를 찾거나 원하는 문장으로 바꿉니다.',
        onClick: () => openNext(openSearchInputPanel),
    }));

    body.appendChild(createMenuItem({
        icon: '<i class="fa-solid fa-scissors"></i>',
        title: '숨기기 및 자르기',
        desc: '메시지를 여러 개 선택해서 숨김, 숨김해제, 삭제합니다.',
        onClick: () => openNext(openMessagePanel),
    }));

    body.appendChild(createMenuItem({
        icon: '<i class="fa-solid fa-layer-group"></i>',
        title: '스와이프',
        desc: '스와이프가 있는 메시지를 확인하고 버전을 정리합니다.',
        onClick: () => openNext(openSwipesPanel),
    }));
}
