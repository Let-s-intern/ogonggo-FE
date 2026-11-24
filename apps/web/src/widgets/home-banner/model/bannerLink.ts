import type { ContentTargetType } from '../../../shared/analytics/contentEventQueue';

/** 우리 사이트의 운영 호스트. 배너 주소가 이 호스트의 절대 주소면 사이트 안 경로로 본다(2026-11-24). */
const OWN_HOSTS: readonly string[] = ['ogonggo.co.kr', 'www.ogonggo.co.kr'];

export interface BannerLink {
  /** `Link` 에 넘길 주소. 우리 사이트 절대 주소는 경로로 바꾼다. */
  href: string;
  /** 외부 주소라 새 탭으로 연다. */
  newTab: boolean;
}

/**
 * 운영자가 적은 배너 주소를 어떻게 열지. 외부 주소는 새 탭, 사이트 안 경로는 같은 탭이다. 운영자가
 * `https://www.ogonggo.co.kr/jobs/1` 처럼 우리 사이트의 절대 주소를 적어도 사이트 안 경로로 본다 — 그러지 않으면 새 탭으로 열려
 * 노출 id 를 상세로 넘기지 못하고 조회가 광고 몫으로 잡히지 않는다.
 */
export function bannerLink(linkUrl: string): BannerLink {
  if (!/^https?:\/\//.test(linkUrl)) {
    return { href: linkUrl, newTab: false };
  }
  try {
    const url = new URL(linkUrl);
    if (OWN_HOSTS.includes(url.hostname)) {
      return { href: `${url.pathname}${url.search}${url.hash}`, newTab: false };
    }
  } catch {
    // 읽을 수 없는 주소는 외부로 둔다.
  }
  return { href: linkUrl, newTab: true };
}

/**
 * 배너가 사이트 안 공고·부트캠프 상세로 가면 그 대상. 같은 탭으로 가는 경로만 본다 — 외부 주소는 새 탭이라
 * 이 탭의 저장소로 노출 id 를 넘길 수 없다. `bannerLink().href` 를 넘긴다.
 */
export function bannerTarget(
  href: string,
): { targetType: ContentTargetType; targetId: number } | null {
  const match = /^\/(jobs|bootcamps)\/(\d+)(?:[/?#]|$)/.exec(href);
  if (!match) {
    return null;
  }
  return { targetType: match[1] === 'jobs' ? 'JOB' : 'BOOTCAMP', targetId: Number(match[2]) };
}
