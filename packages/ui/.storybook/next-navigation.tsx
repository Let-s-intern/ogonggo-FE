/**
 * `next/navigation` 의 스토리북 대역. `.storybook/main.ts` 의 `resolve.alias` 가 이 파일을
 * 대신 물린다. `next-link.tsx` 와 같은 이유다.
 *
 * 진짜 `useRouter` 는 앱 라우터 컨텍스트가 없으면 던진다
 * (`invariant expected app router to be mounted`). 카드와 상세 CTA 의 북마크 버튼이
 * `useRouter` 를 쓰기 때문에(로그인하지 않은 사용자를 로그인 화면으로 보낸다) 스토리북에
 * 라우터가 없으면 그 조각이 통째로 죽는다.
 *
 * 스토리북 안에는 갈 곳이 없으므로 이동은 콘솔에 남기고 아무것도 하지 않는다. 어디로 가려
 * 했는지는 콘솔에서 본다.
 *
 * 내보내는 넷은 `apps/web` 이 실제로 부르는 것뿐이다. `redirect` 와 `notFound` 는 서버
 * 컴포넌트에만 있어 스토리가 부를 일은 없지만, 같은 모듈에서 오므로 이름이 없으면 그 파일을
 * 임포트하는 순간 번들이 깨진다.
 */
type Navigate = (href: string) => void;

const log =
  (what: string): Navigate =>
  (href) => {
    console.info(`[storybook] router.${what}(${href}) — 스토리북에는 갈 곳이 없다`);
  };

export function useRouter() {
  return {
    push: log('push'),
    replace: log('replace'),
    prefetch: log('prefetch'),
    back: () => console.info('[storybook] router.back()'),
    forward: () => console.info('[storybook] router.forward()'),
    refresh: () => console.info('[storybook] router.refresh()'),
  };
}

export function usePathname(): string {
  return '/';
}

export function redirect(href: string): never {
  throw new Error(`[storybook] redirect(${href})`);
}

export function notFound(): never {
  throw new Error('[storybook] notFound()');
}
