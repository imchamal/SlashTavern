// ─── panel-ui.js ────────────────────────────────────────────────────────────
// 여러 기능이 공유하는 UI 부품 빌더. HTML 파일 없이 코드로 직접 DOM을 조립함.
// 테스트 버전이라 패널 드래그 이동 등은 생략하고 화면 중앙에 고정 — 필요해지면 나중에 추가.

export function injectThemeCSS() {
    if (document.getElementById('ct-theme-vars')) return;
    const s = document.createElement('style');
    s.id = 'ct-theme-vars';
    s.textContent = `
        .ct-panel {
            position: fixed;
            width: min(380px, 92vw); max-height: 80vh;
            display: flex; flex-direction: column;
            background: #ffffff; color: #333333;
            border: 1px solid #dddddd; border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            z-index: 9999999; font-size: 13px; font-family: inherit;
            opacity: 0;
        }
        .ct-panel-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 14px; border-bottom: 1px solid #eeeeee; font-weight: 600;
            cursor: grab; touch-action: none;
        }
        .ct-panel-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ct-panel-body { padding: 12px 14px; overflow-y: auto; flex: 1; }
        .ct-close-btn {
            background: transparent; border: none; font-size: 16px; cursor: pointer;
            color: #999999; width: 26px; height: 26px;
        }
        .ct-btn {
            padding: 6px 12px; border-radius: 8px; border: 1px solid #dddddd;
            background: #f4f4f4; cursor: pointer; font-size: 13px;
            margin-right: 6px; margin-bottom: 6px;
        }
        .ct-btn:active { background: #e0e0e0; }
        .ct-input {
            width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px;
            border: 1px solid #dddddd; font-size: 13px; margin-bottom: 8px; font-family: inherit;
        }
        .ct-result-item {
            padding: 6px 8px; border-radius: 6px; cursor: pointer; margin-bottom: 4px;
            border: 1px solid transparent; font-size: 12px; line-height: 1.4; background: #fff;
        }
        .ct-result-item:hover { background: #f5f5f5; border-color: #eeeeee; }
        .ct-check-row {
            display: flex; align-items: center; gap: 8px; margin-bottom: 10px; cursor: pointer;
        }
        .ct-dim { opacity: 0.55; font-weight: 400; }
        .ct-pos { opacity: 0.55; font-weight: 400; margin-left: 6px; }
        .ct-action-row {
            display: flex; justify-content: space-between; align-items: center;
        }
        .ct-btn-primary {
            background: #2e7d32; color: #ffffff; border-color: #2e7d32;
        }
        .ct-btn-primary:active { background: #256428; }
        .ct-btn-danger {
            background: #c62828; color: #ffffff; border-color: #c62828;
        }
        .ct-btn-danger:active { background: #a02121; }
        .ct-badge {
            flex-shrink: 0; font-size: 10px; color: #999999; border: 1px solid #dddddd;
            border-radius: 4px; padding: 1px 5px; margin-left: 6px;
        }

        /* /find 하이라이트 표시 */
        #chat .mes_text mark[data-ct] {
            background: rgba(177,224,179,0.9) !important; color: inherit !important; padding: 1px;
        }
        #chat .mes_text mark[data-ct].ct-cur {
            background: rgba(0,0,0,0.75) !important; color: #ffffff !important; font-weight: bold;
        }

        /* 드래그 선택 후 뜨는 빠른수정 아이콘 */
        .ct-pill {
            position: fixed; z-index: 999999; transform: translate(-50%, 0%);
            background: #ffffff; border: 1px solid #dddddd; border-radius: 20px;
            padding: 6px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            font-size: 14px; cursor: pointer; white-space: nowrap; user-select: none;
        }
    `;
    document.head.appendChild(s);
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
                <button class="ct-close-btn" type="button">✕</button>
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

export function btn(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
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
