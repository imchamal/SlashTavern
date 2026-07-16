// ─── highlight.js ───────────────────────────────────────────────────────────
// /find, /change 결과를 채팅 화면(DOM) 위에 <mark>로 표시.
// 각 mark가 몇 번 메시지(msgIdx)에 속하고, 그 메시지 안에서 몇 번째 일치인지도
// 같이 기억해둠 — /change에서 "지금 보고 있는 이 매치만 실제로 바꾸기"에 사용.

let marks = [];       // 화면에 표시된 <mark> 엘리먼트들 (등장 순서대로)
let matchMeta = [];   // marks와 같은 순서. { msgIdx, occurrence } (occurrence: 그 메시지 안에서 몇 번째 일치인지, 0부터)
let curIndex = -1;

export function clearHighlights() {
    document.querySelectorAll('#chat .mes_text mark[data-ct]').forEach((mark) => {
        const p = mark.parentNode;
        if (!p) return;
        while (mark.firstChild) p.insertBefore(mark.firstChild, mark);
        p.removeChild(mark);
        p.normalize();
    });
    marks = [];
    matchMeta = [];
    curIndex = -1;
}

// 대소문자 무시 단순 일치만 지원 (테스트 버전 — 정규식/옵션 등은 나중에 추가)
export function highlightKeyword(keyword) {
    clearHighlights();
    if (!keyword) return 0;
    const lower = keyword.toLowerCase();

    document.querySelectorAll('#chat .mes_text').forEach((mesText) => {
        const mesEl = mesText.closest('.mes[mesid]');
        const msgIdx = mesEl ? parseInt(mesEl.getAttribute('mesid'), 10) : -1;
        let occurrence = 0;

        const walker = document.createTreeWalker(mesText, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) textNodes.push(node);

        textNodes.forEach((tn) => {
            const text = tn.textContent;
            const lowerText = text.toLowerCase();
            let idx = lowerText.indexOf(lower);
            if (idx === -1) return;

            const frag = document.createDocumentFragment();
            let cursor = 0;
            while (idx !== -1) {
                frag.appendChild(document.createTextNode(text.slice(cursor, idx)));
                const mark = document.createElement('mark');
                mark.setAttribute('data-ct', '1');
                mark.textContent = text.slice(idx, idx + keyword.length);
                frag.appendChild(mark);
                marks.push(mark);
                matchMeta.push({ msgIdx, occurrence });
                occurrence++;
                cursor = idx + keyword.length;
                idx = lowerText.indexOf(lower, cursor);
            }
            frag.appendChild(document.createTextNode(text.slice(cursor)));
            tn.parentNode.replaceChild(frag, tn);
        });
    });

    if (marks.length) focusMark(0);
    return marks.length;
}

export function focusMark(i) {
    if (!marks.length) return;
    marks.forEach((m) => m.classList.remove('ct-cur'));
    curIndex = ((i % marks.length) + marks.length) % marks.length;
    const mark = marks[curIndex];
    mark.classList.add('ct-cur');
    mark.scrollIntoView({ block: 'center' });
}

export const focusNext = () => focusMark(curIndex + 1);
export const focusPrev = () => focusMark(curIndex - 1);
export const getMarkCount = () => marks.length;
export const getCurrentMatch = () => matchMeta[curIndex] || null;
