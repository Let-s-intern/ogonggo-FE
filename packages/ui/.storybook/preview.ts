import type { Preview } from '@storybook/react';
import './tailwind.css';
import './preview.css';

/**
 * 배포 뒤 열려 있던 탭이 옛 청크를 찾다 깨지는 것을 새로고침 한 번으로 푼다.
 *
 * 스토리 파일은 이름에 해시가 붙은 청크(`DescriptionList.stories-AHOmsy18.js`)로 나뉘고, 새로 배포하면
 * 옛 청크는 사라진다. 이미 열려 있던 탭은 옛 빌드의 청크 이름을 들고 있어서 다른 스토리를 누르는 순간
 * 404 가 나고 "Failed to fetch dynamically imported module" 로 스토리가 깨진다. 새로 열면 정상이다.
 *
 * Vite 는 동적 import 가 실패하면 `vite:preloadError` 를 낸다. 그때 페이지를 새로 읽어 새 빌드를
 * 받게 한다. 스토리는 미리보기 iframe 안에서 불리지만 새로고침은 바깥 창(`window.top`)에 건다 —
 * 바깥의 스토리 목록(`index.json`)도 옛 것이라 같이 새로 받아야 한다.
 *
 * 새로고침 뒤에도 같은 청크가 없으면(진짜로 빠진 파일이면) 다시 새로고치지 않는다. 10초 안에 한 번
 * 새로고친 적이 있으면 그냥 오류를 보인다. 무한 새로고침보다 깨진 화면이 원인을 찾기 쉽다.
 */
const RELOADED_AT_KEY = 'ogonggo.storybook.chunkReloadAt';
const RELOAD_GUARD_MS = 10_000;

window.addEventListener('vite:preloadError', (event) => {
  // 저장소를 못 쓰는 환경(차단된 사이트 데이터 등)에서는 새로고침 이력을 남길 수 없어 무한
  // 새로고침을 막을 방법이 없다. 그때는 새로고치지 않고 오류를 그대로 둔다.
  try {
    const reloadedAt = Number(sessionStorage.getItem(RELOADED_AT_KEY) ?? 0);
    if (Date.now() - reloadedAt < RELOAD_GUARD_MS) {
      return;
    }
    sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    return;
  }

  event.preventDefault();
  (window.top ?? window).location.reload();
});

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
