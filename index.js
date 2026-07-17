// ─── index.js ───────────────────────────────────────────────────────────────
// 확장 진입점. 조립만 담당 — 실제 로직은 전부 다른 파일에 있음.
// 새 기능을 추가할 땐 이 파일을 거의 건드리지 않고 commands/index.js에만 등록하면 됨.

import { injectThemeCSS } from './panel-ui.js';
import { registerAllCommands } from './commands/index.js';

// git pull로 서버의 manifest.json 버전이 바뀌면(=업데이트 적용됨) 5분마다 확인해서
// 알려주고, 알림을 누르면 바로 새로고침. 지금 로드된 코드는 새로고침 전까지 그대로라
// 알림+클릭새로고침이 가장 확실한 방법.
function watchForUpdate(startVersion) {
    setInterval(async () => {
        try {
            const res = await fetch(new URL('./manifest.json', import.meta.url), { cache: 'no-store' });
            const manifest = await res.json();
            if (manifest.version && manifest.version !== startVersion) {
                const toast = toastr.info(
                    'Chat Tools 새 버전이 적용되었습니다. 눌러서 새로고침하세요.',
                    '', { timeOut: 0, extendedTimeOut: 0 },
                );
                toast.click(() => location.reload());
            }
        } catch (e) { /* 확인 실패 시 조용히 무시 */ }
    }, 5 * 60 * 1000);
}

(async () => {
    injectThemeCSS();
    registerAllCommands();

    try {
        const res = await fetch(new URL('./manifest.json', import.meta.url), { cache: 'no-store' });
        const manifest = await res.json();
        watchForUpdate(manifest.version);
    } catch (e) { /* 버전 확인 실패해도 확장 자체는 정상 동작 */ }
})();
