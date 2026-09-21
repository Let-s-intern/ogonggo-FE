import { Logo } from '@/shared/ui/Logo';

/**
 * 로고 하나가 천천히 맥동하는 로딩 표시.
 *
 * 스켈레톤을 쓰지 않는 자리에만 쓴다. 스켈레톤은 "이 자리에 이런 게 온다"는 약속이라, 뒤이어
 * 올 화면의 모양을 모르는 자리에서는 지킬 수 없는 약속이 된다 — 그 자리가 루트
 * `app/loading.tsx`다(`/`와 `/calendar`가 같이 쓰는 폴백이고 둘의 레이아웃이 다르다).
 * 목록·상세는 각자 모양을 아는 스켈레톤을 쓴다(`ListPageSkeleton`, `DetailPageSkeleton`).
 *
 * 서버 컴포넌트로 둔다. 애니메이션이 전부 CSS라 클라이언트 번들에 들어갈 이유가 없고,
 * `loading.tsx`는 스트리밍되는 첫 셸에 들어가므로 JS를 기다리면 늦다.
 *
 * 동작은 `app/globals.css`의 `.ogonggo-fallback`(300ms 지연 노출)과
 * `.ogonggo-logo-pulse`(1.2초 주기로 1 → 1.06)가 만든다. `prefers-reduced-motion: reduce`면
 * 맥동이 멈춘다.
 *
 * 로고는 헤더와 같은 인라인 `Logo`(52x25)다. 이미지 요청이 없으니 로딩 표시가 이미지를
 * 기다리지 않는다.
 */
export function LogoLoader() {
  return (
    <div className="ogonggo-fallback flex flex-col items-center" role="status">
      <Logo className="ogonggo-logo-pulse h-[31px] w-16 text-blue-500" />
      <span className="sr-only">불러오는 중</span>
    </div>
  );
}
