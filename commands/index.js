// ─── commands/index.js ──────────────────────────────────────────────────────
// 기능 등록 레지스트리. 새 기능(파일)을 추가할 땐:
//   1) commands/새파일.js 만들고 register 함수 export
//   2) 아래 import 한 줄 + 배열에 한 줄만 추가
// index.js 본체는 건드리지 않아도 됨.

import { registerScrollCommands } from './scroll.js';
import { registerCollapseCommands } from './collapse.js';
import { registerFindChangeCommands } from './find-change.js';
import { registerQuickEdit } from './quick-edit.js';
import { registerClipboardCommand } from './clipboard.js';
import { registerWordCountCommand } from './wordcount.js';
import { registerEditModeCommand } from './edit-mode.js';
import { registerMessageManageCommand } from './message-manage.js';
import { registerScissorButton } from './scissor-button.js';

const registrars = [
    registerScrollCommands,        // /up /down /goto /message-mb
    registerCollapseCommands,      // /collapse /expand
    registerFindChangeCommands,    // /find /change (옵션: 대소문자/띄어쓰기/온전한단어/태그무시)
    registerQuickEdit,             // 드래그 후 빠른수정 아이콘
    registerClipboardCommand,      // /clip
    registerWordCountCommand,      // /word
    registerEditModeCommand,       // /edit-mode
    registerMessageManageCommand,  // /messages (전체 메시지 숨김/삭제 관리)
    registerScissorButton,         // 메시지 툴바에 가위 아이콘(삭제) 추가
];

export function registerAllCommands() {
    for (const register of registrars) {
        try {
            register();
        } catch (err) {
            console.error('[ChatTools] 기능 등록 실패:', register.name, err);
        }
    }
}
