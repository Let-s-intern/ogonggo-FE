'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { signOut } from '@ogonggo/api';
import { Button, MenuItem } from '@ogonggo/ui';
import { clearTokens, isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { COMPANY_JOB_REGISTER_HREF, companyJobRegisterHref } from '@/shared/lib/companyJobRegister';
import { LetsCareerMark } from '@/shared/ui/LetsCareerMark';
import { Logo } from '@/shared/ui/Logo';
import { myPageHomeFor } from '@/widgets/mypage-sidebar';

/**
 * `matches`는 그 메뉴에 밑줄이 붙는 경로들이다. 채용공고는 목록(`/`)과 상세(`/jobs/1`)가
 * 경로 접두사를 공유하지 않아 따로 적는다 — 접두사만 보면 `/`가 모든 경로에 걸린다.
 */
const NAV_ITEMS = [
  {
    href: '/',
    label: '채용공고',
    matches: (path: string) => path === '/' || path.startsWith('/jobs'),
  },
  {
    href: '/bootcamps',
    label: '교육·부트캠프',
    matches: (path: string) => path.startsWith('/bootcamps'),
  },
  {
    href: '/side-studies',
    label: '사이드·스터디',
    matches: (path: string) => path.startsWith('/side-studies'),
  },
] as const;

/**
 * `home.png`·`교육부트캠프.png`의 상단 헤더. 현재 경로에 밑줄이 붙어야 해서 `usePathname`을
 * 쓰는 클라이언트 컴포넌트다.
 *
 * 왼쪽 로고는 v3에서 글자("오늘의 공고 BY LETS CAREER")가 심볼 마크로 바뀌었다
 * (`docs/asset/v3 변경사항/오공고 로고.svg`, 목업의 원본 크기 52x25 그대로다). 글자가 사라져
 * 링크에 읽을 것이 남지 않으므로 이름은 `aria-label`로 붙인다.
 *
 * 그 왼쪽의 회색 렛츠커리어 마크와 세로 구분선은 v3에서 에셋이 없어 미뤘던 것이고
 * (`docs/asset/v3-1/icon/렛츠커리어.svg`), 셋이 하나의 로고 잠금이라 같은 링크 안에 있다.
 * 새 마크도 구분선도 읽을 것이 없으므로 이름은 그대로 링크의 `aria-label` 하나뿐이다.
 *
 * 간격은 목업(`docs/asset/v3 변경사항/사이드 스터디 디자인변경.png`, 1440px)을 픽셀로 재서
 * 맞췄다 — 회색 마크 x 130~155, 구분선 x 167, 파란 로고 x 180~231이라 사이가 11~12px다.
 * `gap-3`(12px)이 그 값이다. 구분선은 26px 높이의 1px 선이고 색은 `gray-300`이다(목업의
 * rgb(232,234,237)은 #D1D5DB 1px 선이 두 열에 반씩 걸린 값이다).
 *
 * 우측은 `공고 등록`·`공고 달력`, 그리고 로그인했으면 `마이페이지`·`로그아웃` 이다.
 * `공고 등록` 이 가는 곳은 역할마다 다르다 — 아래 `registerHref` 주석에 적었다.
 *
 * 맨 오른쪽은 토큰 유무로 갈린다. 없으면 "로그인"(`/login`), 있으면 "마이페이지" 와 "로그아웃". 토큰이 브라우저 저장소에만
 * 있어 서버는 알 수 없으므로 서버 렌더와 첫 하이드레이션은 "로그인" 으로 그리고, 그 직후 저장소를 읽어
 * 바꾼다(`useSyncExternalStore` 의 서버 스냅샷).
 *
 * 좌측 메뉴는 `MenuItem`이 그린다(`docs/asset/v3-1/menu/`). 밑줄은 그 컴포넌트의 `current`
 * 상태고, 36px 상자의 맨 아래에 있어 전보다 7px 내려온다 — 목업의 밑줄도 글자에서 그만큼
 * 떨어져 있다. 글자 크기만 `text-sm`으로 덮어쓰는 이유는
 * `.claude/tasks/memos/결정-menuitem-글자크기-2026-09-21.md`에 적었다.
 *
 * 우측 메뉴의 활성 표시는 좌측과 다르다. 좌측은 밑줄인데, 우측은 목업
 * (`docs/asset/공고달력.png`)의 `공고 달력` 화면에서도 밑줄이 없다 — 헤더 높이를 꽉 채우는
 * 좌측 탭과 달리 우측은 가운데 정렬된 짧은 줄이라 밑줄이 붙을 자리가 없다. 그래서 글자색만
 * 진해진다.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const calendarActive = pathname.startsWith('/calendar');
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const accountState = useMyAccount();
  const role = accountState.kind === 'ready' ? accountState.account.role : undefined;

  /*
   * 기업 회원이면 공고 등록 폼으로, 그 밖에는(로그아웃, 일반 회원) 기업 회원 **로그인**으로
   * 보낸다. `ForBusinessBanner` 의 같은 버튼과 같은 규칙이다(`shared/lib/companyJobRegister.ts`).
   * 기업 계정이 없는 사람은 로그인 화면의 `회원가입` 으로 간다.
   */
  const registerHref = companyJobRegisterHref(role);
  const registerActive = pathname.startsWith(COMPANY_JOB_REGISTER_HREF);

  /*
   * 마이페이지는 역할마다 첫 화면이 다르다(`myPageHomeFor`). 역할을 아직 모르는 동안에는
   * 일반 회원 쪽으로 보내 둔다 — 기업 계정이 그리 가도 `MyPageLayout` 의 역할 가드가 기업
   * 마이페이지로 다시 보낸다. 역할이 올 때까지 링크를 감추면 헤더에서 항목이 늦게 나타난다.
   */
  const myPageHref = myPageHomeFor(role === 'COMPANY' ? 'COMPANY' : 'USER');
  const myPageActive = pathname.startsWith('/mypage');

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-stretch justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="오늘의 공고 홈" className="flex items-center gap-3">
            <LetsCareerMark className="h-[26px] w-[26px]" />
            <span className="h-[26px] w-px bg-gray-300" />
            <Logo className="h-[25px] w-[52px] text-blue-500" />
          </Link>
          <nav className="flex items-stretch gap-6">
            {NAV_ITEMS.map(({ href, label, matches }) => {
              const active = matches(pathname);
              return (
                <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                  <MenuItem state={active ? 'current' : 'default'} className="text-sm">
                    {label}
                  </MenuItem>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
          <Link
            href={registerHref}
            aria-current={registerActive ? 'page' : undefined}
            className={registerActive ? 'font-semibold text-gray-900' : undefined}
          >
            공고 등록
          </Link>
          <Link
            href="/calendar"
            aria-current={calendarActive ? 'page' : undefined}
            className={calendarActive ? 'font-semibold text-gray-900' : undefined}
          >
            공고 달력
          </Link>
          {signedIn ? (
            <>
              <Link
                href={myPageHref}
                aria-current={myPageActive ? 'page' : undefined}
                className={myPageActive ? 'font-semibold text-gray-900' : undefined}
              >
                마이페이지
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * 서버에 로그아웃(`signOut`, 리프레시 토큰 폐기) 을 알린 뒤 두 토큰을 지운다. `signOut` 이 실패해도(액세스
 * 토큰 만료, 네트워크) 화면에서는 로그아웃한다 — 사용자가 누른 것은 이 브라우저에서 나가는 일이다.
 * `signOut` 의 401 은 재발급하지 않는다(`shared/api/reissue.ts` 의 인증 API 제외).
 */
function SignOutButton() {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      await signOut();
    } catch {
      // 위 주석대로 실패해도 지운다.
    } finally {
      clearTokens();
      setPending(false);
    }
  };

  return (
    <Button size="sm" variant="secondary" disabled={pending} onClick={handleClick}>
      로그아웃
    </Button>
  );
}
