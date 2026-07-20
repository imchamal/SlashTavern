// ─── panel-ui.js ────────────────────────────────────────────────────────────
// 여러 기능이 공유하는 UI 부품 빌더. HTML 파일 없이 코드로 직접 DOM을 조립함.
// 테스트 버전이라 패널 드래그 이동 등은 생략하고 화면 중앙에 고정 — 필요해지면 나중에 추가.

export function injectThemeCSS() {
    if (document.getElementById('ct-theme-vars')) return;
    const s = document.createElement('style');
    s.id = 'ct-theme-vars';
    s.textContent = `
        :root {
            --ct-panel-bg: #ffffff;
            --ct-panel-bg-muted: #f7f7f8;
            --ct-border: #e6e6e8;
            --ct-border-soft: #eeeeef;
            --ct-text: #232326;
            --ct-text-dim: #95959c;
            --ct-primary: #3f6fe0;
            --ct-primary-hover: #3259bd;
            --ct-primary-tint: #eef2fd;
            --ct-danger: #e0473f;
            --ct-danger-hover: #c73a33;
            --ct-danger-tint: #fdeeed;
            --ct-radius-panel: 16px;
            --ct-radius-control: 9px;
            --ct-shadow-panel: 0 16px 40px rgba(20,20,24,.14), 0 3px 10px rgba(20,20,24,.06);
            --ct-list-item-pad-y: 7px;
            --ct-list-item-pad-x: 8px;
            --ct-list-num-w: 28px;
            --ct-list-gap: 8px;
        }
        .ct-panel {
            position: fixed; box-sizing: border-box;
            width: min(372px, 92vw); max-height: 80vh;
            display: flex; flex-direction: column;
            background: var(--ct-panel-bg); color: var(--ct-text);
            border: 1px solid var(--ct-border); border-radius: var(--ct-radius-panel);
            box-shadow: var(--ct-shadow-panel); overflow: hidden;
            z-index: 9999999; font-size: 13px; font-family: inherit;
            opacity: 0;
        }
        .ct-panel-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 11px 10px; border-bottom: 1px solid var(--ct-border-soft); font-weight: 600;
            cursor: grab; touch-action: none;
        }
        .ct-panel-header > span {
            display: flex; align-items: center; gap: 6px; min-width: 0;
            font-size: 13.5px; font-weight: 600;
        }
        .ct-panel-header > span > span {
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ct-panel-header-right { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
        .ct-panel-body { padding: 14px 15px; overflow-y: auto; flex: 1; }
        .ct-panel-body > * + * { margin-top: 12px; }
        .ct-close-btn {
            width: 28px; height: 28px; border: none; border-radius: 8px;
            background: var(--ct-panel-bg-muted); color: var(--ct-text-dim);
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 13px; cursor: pointer; transition: background .12s, color .12s;
        }
        .ct-close-btn:hover {
            background: #eceef1; color: var(--ct-text);
        }
        .ct-btn {
            height: 34px; padding: 0 15px; border-radius: var(--ct-radius-control);
            border: 1px solid var(--ct-border); background: var(--ct-panel-bg-muted);
            color: var(--ct-text); cursor: pointer; font-size: 12.5px; font-weight: 600;
            margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
            white-space: nowrap; transition: background .12s, border-color .12s, color .12s;
        }
        .ct-btn:hover, .ct-btn:active { background: #eeeef0; }
        .ct-btn:disabled { opacity: .5; cursor: default; }
        .ct-input {
            width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: var(--ct-radius-control);
            border: 1px solid var(--ct-border); background: var(--ct-panel-bg-muted);
            color: var(--ct-text); font-size: 13px; margin: 0; font-family: inherit;
        }
        .ct-input::placeholder { color: #b3b3b8; }
        .ct-result-item {
            padding: var(--ct-list-item-pad-y) var(--ct-list-item-pad-x);
            border-radius: 9px; cursor: pointer; margin: 0 0 4px;
            border: 1px solid transparent; font-size: 12.3px; line-height: 1.4;
            background: transparent; transition: background .12s, border-color .12s;
        }
        .ct-result-item:hover { background: var(--ct-panel-bg-muted); border-color: transparent; }
        .ct-check-row {
            display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer;
            font-size: 12.5px; color: #3d3d41;
        }
        .ct-check-row input[type="checkbox"] {
            width: 16px; height: 16px; accent-color: var(--ct-primary);
        }
        .ct-dim { color: var(--ct-text-dim); font-weight: 400; }
        .ct-pos { color: var(--ct-text-dim); font-weight: 400; margin-right: 4px; font-size: 11.5px; white-space: nowrap; }
        .ct-action-row {
            display: flex; justify-content: space-between; align-items: center; gap: 10px;
            margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--ct-border-soft);
        }
        .ct-btn-white {
            background: #ffffff; color: var(--ct-text); border-color: var(--ct-border);
        }
        .ct-btn-white:hover, .ct-btn-white:active { background: #eeeef0; }
        .ct-btn-primary {
            background: var(--ct-primary); color: #ffffff; border-color: var(--ct-primary);
        }
        .ct-btn-primary:hover, .ct-btn-primary:active {
            background: var(--ct-primary-hover); border-color: var(--ct-primary-hover);
        }
        .ct-btn-danger {
            background: var(--ct-danger); color: #ffffff; border-color: var(--ct-danger);
        }
        .ct-btn-danger:hover, .ct-btn-danger:active {
            background: var(--ct-danger-hover); border-color: var(--ct-danger-hover);
        }
        .ct-badge {
            flex-shrink: 0; font-size: 10px; font-weight: 600; color: var(--ct-text-dim);
            background: var(--ct-panel-bg-muted); border: 1px solid var(--ct-border);
            border-radius: 6px; padding: 2px 7px; margin-left: 0;
        }
        .ct-icon-btn, .ct-icon-btn-sm {
            border: none; background: transparent; color: var(--ct-text-dim);
            display: inline-flex; align-items: center; justify-content: center;
            cursor: pointer; transition: background .12s, color .12s; flex-shrink: 0;
        }
        .ct-icon-btn {
            width: 28px; height: 28px; border-radius: 8px; font-size: 13px;
        }
        .ct-icon-btn-sm {
            width: 20px; height: 20px; border-radius: 6px; font-size: 10.5px;
        }
        .ct-icon-btn:hover, .ct-icon-btn-sm:hover {
            background: var(--ct-panel-bg-muted); color: var(--ct-text);
        }
        .ct-icon-btn.danger:hover, .ct-icon-btn-sm.danger:hover {
            background: var(--ct-danger-tint); color: var(--ct-danger);
        }
        .ct-header-icon {
            background: var(--ct-panel-bg-muted);
        }
        .ct-seg {
            display: inline-flex; border: 1px solid var(--ct-border);
            border-radius: var(--ct-radius-control); overflow: hidden;
        }
        .ct-seg .ct-btn {
            border: none; border-radius: 0; background: var(--ct-panel-bg-muted);
        }
        .ct-seg .ct-btn:first-child {
            border-right: 1px solid var(--ct-border);
        }
        .ct-row-between {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
        }
        .ct-row-gap {
            display: flex; align-items: center; gap: 8px;
        }
        .ct-list-scroll {
            max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;
            margin: 0; padding: 0;
        }
        .ct-list-num {
            flex-shrink: 0; width: var(--ct-list-num-w); font-size: 11px;
            color: var(--ct-text-dim); font-variant-numeric: tabular-nums;
        }
        .ct-list-text {
            flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ct-current {
            background: var(--ct-primary-tint); border-color: #d8e2fb;
        }
        .ct-menu-list {
            display: flex; flex-direction: column; gap: 3px;
        }
        .ct-panel-body.ct-menu-list > * + * {
            margin-top: 0;
        }
        .ct-menu-item {
            display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
            padding: 9px; border-radius: 11px; border: 1px solid transparent;
            background: transparent; cursor: pointer; font-family: inherit; color: inherit;
            transition: background .12s;
        }
        .ct-menu-item:hover { background: var(--ct-panel-bg-muted); }
        .ct-menu-chip {
            width: 32px; height: 32px; border-radius: 9px;
            background: var(--ct-primary-tint); color: var(--ct-primary);
            display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0;
        }
        .ct-menu-body {
            display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;
        }
        .ct-menu-title { font-size: 13.5px; font-weight: 600; }
        .ct-menu-desc {
            font-size: 11.5px; color: var(--ct-text-dim);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ct-menu-chev { color: var(--ct-text-dim); font-size: 11px; flex-shrink: 0; }
        .ct-setting-row {
            display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 0;
        }
        .ct-setting-label b { display: block; font-size: 13px; font-weight: 600; }
        .ct-setting-label span { display: block; font-size: 11.5px; color: var(--ct-text-dim); margin-top: 2px; }
        .ct-toggle {
            width: 38px; height: 22px; border: none; border-radius: 999px; background: #dcdce0;
            position: relative; flex-shrink: 0; cursor: pointer; transition: background .15s;
        }
        .ct-toggle::after {
            content: ""; position: absolute; top: 2px; left: 2px;
            width: 18px; height: 18px; border-radius: 50%; background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: left .15s;
        }
        .ct-toggle.on { background: var(--ct-primary); }
        .ct-toggle.on::after { left: 18px; }
        .ct-empty-note {
            font-size: 12.5px; color: var(--ct-text-dim); text-align: center; padding: 18px 0;
        }

        /* /find 하이라이트 표시 */
        #chat .mes_text mark[data-ct] {
            background: rgba(177,224,179,0.9) !important; color: inherit !important; padding: 1px;
        }
        #chat .mes_text mark[data-ct].ct-cur {
            background: rgba(0,0,0,0.75) !important; color: #ffffff !important; font-weight: bold;
        }

        /* 드래그 선택 후 뜨는 빠른수정/검색 아이콘 묶음 */
        .ct-pill-group {
            position: fixed; z-index: 999999; transform: translate(-50%, 0%);
            display: flex; align-items: center; gap: 2px;
            background: var(--ct-panel-bg); border: 1px solid var(--ct-border); border-radius: 999px;
            padding: 5px; box-shadow: var(--ct-shadow-panel);
            white-space: nowrap; user-select: none;
        }
        .ct-pill-item {
            width: 34px; height: 34px; color: var(--ct-text-dim);
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 14px; line-height: 1; cursor: pointer; border-radius: 8px;
        }
        .ct-pill-item:hover, .ct-pill-item:active { background: var(--ct-panel-bg-muted); color: var(--ct-text); }
    `;
    document.head.appendChild(s);
    watchDrawers();
}

// 확장/연결/로어북/유저설정 등 상단 서랍(drawer)이 열리면 우리 패널이 그 위에
// 겹쳐 보이지 않도록 잠깐 숨겨주고, 서랍을 닫으면 다시 보여줌.
function watchDrawers() {
    const sync = () => {
        const drawerOpen = !!document.querySelector('.drawer-content.openDrawer');
        document.querySelectorAll('.ct-panel').forEach((p) => {
            p.style.visibility = drawerOpen ? 'hidden' : '';
        });
    };
    new MutationObserver(sync).observe(document.body, {
        attributes: true, attributeFilter: ['class'], subtree: true,
    });
}

// 패널 헤더를 손가락/마우스로 누른 채 움직이면 패널이 따라 움직이게 함
export function makeDraggable(panel, handle) {
    let drag = null;
    handle.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return; // 닫기 버튼 등 안쪽 버튼은 드래그 시작 안 함
        const r = panel.getBoundingClientRect();
        drag = { sx: e.clientX, sy: e.clientY, ol: r.left, ot: r.top };
        handle.style.cursor = 'grabbing';
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
        if (!drag) return;
        panel.style.left = `${drag.ol + e.clientX - drag.sx}px`;
        panel.style.top = `${drag.ot + e.clientY - drag.sy}px`;
    });
    handle.addEventListener('pointerup', () => { drag = null; handle.style.cursor = 'grab'; });
    handle.addEventListener('pointercancel', () => { drag = null; handle.style.cursor = 'grab'; });
}

export function createPanel(id, title, onClose) {
    document.getElementById(id)?.remove();
    const panel = document.createElement('div');
    panel.id = id;
    panel.className = 'ct-panel';
    panel.innerHTML = `
        <div class="ct-panel-header">
            <span>${title}</span>
            <div class="ct-panel-header-right">
                <span id="ct-pos" class="ct-pos"></span>
                <button class="ct-close-btn" type="button" title="닫기"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>
        <div class="ct-panel-body"></div>
    `;
    panel.querySelector('.ct-close-btn').addEventListener('click', () => {
        onClose?.();
        panel.remove();
    });
    document.body.appendChild(panel);

    requestAnimationFrame(() => {
        const pw = panel.offsetWidth, ph = panel.offsetHeight;
        panel.style.left = `${Math.round((window.innerWidth - pw) / 2)}px`;
        panel.style.top = `${Math.round((window.innerHeight - ph) / 2)}px`;
        panel.style.opacity = '1';
    });
    makeDraggable(panel, panel.querySelector('.ct-panel-header'));

    return panel;
}

export const getPanelBody = (panel) => panel.querySelector('.ct-panel-body');
export const closePanel = (id) => document.getElementById(id)?.remove();

export function setPanelTitleWithBack(panel, titleHtml, backTitle, onBack) {
    const titleEl = panel.querySelector('.ct-panel-header > span');
    if (!titleEl) return;
    titleEl.textContent = '';
    titleEl.style.cssText = '';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'ct-icon-btn ct-header-icon';
    backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    backBtn.title = backTitle;
    backBtn.addEventListener('click', onBack);
    titleEl.appendChild(backBtn);

    const titleText = document.createElement('span');
    titleText.innerHTML = titleHtml;
    titleEl.appendChild(titleText);
}

export function btn(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    if (String(label).includes('<')) b.innerHTML = label;
    else b.textContent = label;
    b.className = 'ct-btn';
    b.addEventListener('click', onClick);
    return b;
}

export function inputBox(placeholder) {
    const i = document.createElement('input');
    i.type = 'text';
    i.placeholder = placeholder;
    i.className = 'ct-input';
    i.autocomplete = 'off';
    i.autocorrect = 'off';
    i.autocapitalize = 'off';
    i.spellcheck = false;
    return i;
}

// 라벨 + 체크박스 한 줄. getVal/setVal로 즉시 반영하고, 바깥에서 저장 함수를 넘겨받아 호출.
export function checkRow(label, getVal, onChange) {
    const row = document.createElement('label');
    row.className = 'ct-check-row';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = getVal();
    chk.addEventListener('change', () => onChange(chk.checked));
    row.appendChild(chk);
    row.appendChild(document.createTextNode(label));
    return row;
}
