/**
 * 기업 회원 콘솔의 메뉴와 모바일 머리. 처음에는 `apps/web/src/widgets/mypage-sidebar/model/menu.ts` 의 기업 회원
 * 부분을 옮긴 마이페이지 메뉴였다.
 */
export interface ConsoleNavItem {
  href: string;
  label: string;
  /** lucide 아이콘 클래스. */
  icon: string;
  /** 정확히 이 주소일 때만 켠다. 대시보드(`/mypage/company`)는 모든 화면의 앞부분이라 이것이 필요하다. */
  exact?: boolean;
  /** 이 항목을 켜는 다른 주소. 그 주소와 같거나 그 아래면 켠다. */
  alsoActiveOn?: readonly string[];
}

export interface ConsoleNavSection {
  /** 묶음 제목. 대시보드처럼 혼자인 묶음은 없다. */
  title?: string;
  items: readonly ConsoleNavItem[];
}

/** 기업 회원 콘솔의 왼쪽 메뉴(2026-11-10 사용자: 로그인하면 어드민처럼 페이지 모양이 바뀐다). */
export const COMPANY_CONSOLE_NAV: readonly ConsoleNavSection[] = [
  {
    items: [
      {
        href: '/mypage/company',
        label: '대시보드',
        icon: 'icon-[lucide--layout-dashboard]',
        exact: true,
      },
    ],
  },
  {
    title: '공고 관리',
    items: [
      { href: '/mypage/company/posts/jobs', label: '채용공고', icon: 'icon-[lucide--briefcase]' },
      {
        href: '/mypage/company/posts/bootcamps',
        label: '부트캠프',
        icon: 'icon-[lucide--graduation-cap]',
      },
    ],
  },
  {
    // 로그인하면 헤더의 광고 신청/문의도 여기로 옮긴다. 광고 안내(`/`)는 그 화면의 탭이다(`AdTabs`, 2026-11-10 사용자).
    title: '광고',
    items: [
      {
        href: '/apply',
        label: '광고 신청/문의',
        icon: 'icon-[lucide--send]',
        alsoActiveOn: ['/'],
      },
      { href: '/mypage/company/ads', label: '광고 신청 내역', icon: 'icon-[lucide--megaphone]' },
    ],
  },
  {
    title: '계정',
    items: [
      {
        href: '/mypage/company/profile',
        label: '기업/기관 정보',
        icon: 'icon-[lucide--building-2]',
      },
    ],
  },
];

const matchesPath = (href: string, pathname: string) =>
  pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

export const isConsoleNavActive = (item: ConsoleNavItem, pathname: string) => {
  if (item.alsoActiveOn?.some((href) => matchesPath(href, pathname))) return true;
  return item.exact ? pathname === item.href : matchesPath(item.href, pathname);
};

/** 공고 목록의 첫 화면. `/mypage/company/posts` 가 여기로 보낸다. `/mypage/company` 는 대시보드다. */
export const COMPANY_MYPAGE_HOME = '/mypage/company/posts/jobs';

/**
 * 모바일 작성·수정 화면의 `< 제목` 머리. 제목은 각 `page.tsx` 의 `metadata.title` 과 같고, `<` 는 자기 목록으로
 * 간다.
 *
 * 목록 화면은 머리 대신 콘솔 메뉴를 위에 둔다(`CompanyMyPageLayout`).
 */
const MOBILE_HEADERS: readonly { pattern: RegExp; title: string; back: string }[] = [
  {
    pattern: /^\/mypage\/company\/posts\/jobs\/new$/,
    title: '채용 공고 등록',
    back: '/mypage/company/posts/jobs',
  },
  {
    pattern: /^\/mypage\/company\/posts\/jobs\/[^/]+\/edit$/,
    title: '채용 공고 수정',
    back: '/mypage/company/posts/jobs',
  },
  {
    pattern: /^\/mypage\/company\/posts\/bootcamps\/new$/,
    title: '교육 · 부트캠프 공고 등록',
    back: '/mypage/company/posts/bootcamps',
  },
  {
    pattern: /^\/mypage\/company\/posts\/bootcamps\/[^/]+\/edit$/,
    title: '교육 · 부트캠프 공고 수정',
    back: '/mypage/company/posts/bootcamps',
  },
  {
    pattern: /^\/mypage\/company\/ads\/[^/]+$/,
    title: '광고 신청 상세',
    back: '/mypage/company/ads',
  },
];

export function myPageMobileHeaderOf(
  pathname: string,
): { title: string; back: string } | undefined {
  const found = MOBILE_HEADERS.find(({ pattern }) => pattern.test(pathname));
  return found ? { title: found.title, back: found.back } : undefined;
}
