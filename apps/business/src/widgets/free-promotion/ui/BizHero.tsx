import { cn } from '@ogonggo/ui';
import { INSTAGRAM_URL } from '../model/content';
import { BizApplyLink } from './BizApplyLink';
import { BizHeroScreens } from './BizHeroScreens';
import { BizLoginPrompt } from './BizLoginPrompt';
import { CONTAINER, OUTLINE_BUTTON, PRIMARY_BUTTON } from './styles';

/** 히어로 아래 세 가지 약속. 광고 안내 히어로의 수치 카드와 같은 모양이다. */
const PROMISES = [
  { value: '0원', label: '신청 비용' },
  { value: '1회', label: '기업별 무료 홍보' },
  { value: '2일', label: '안에 일정 안내' },
];

/**
 * 히어로 문구와 화면 전환(PRD 2절). 광고 안내 히어로처럼 둥근 회색 판 위에 둔다(2026-11-10 사용자). 버튼은 같은
 * 화면 안의 구역으로 내려간다.
 */
export function BizHero() {
  return (
    <section className={cn(CONTAINER, 'pt-6 md:pt-8')}>
      <div className="relative overflow-hidden rounded-xl bg-gray-100 px-5 py-12 md:px-12 md:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/4 h-[360px] w-[620px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-150/50 blur-3xl"
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div>
            <span className="inline-block rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-blue-600 shadow-sm">
              출시 기념 무료 이벤트
            </span>
            <h1 className="mt-5 text-[32px] leading-tight font-bold tracking-tight text-gray-900 md:text-[44px]">
              &lsquo;오늘의 공고&rsquo; 출시 기념
              <br />
              <span className="text-blue-500">채용공고 무료 홍보</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-gray-700 md:text-lg">
              유료로 운영하던 인스타그램{' '}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:underline"
              >
                @letscareer.job
              </a>
              이나 직무별 오픈채팅방 한 곳에서, 기업별 1회 채용공고를 무료로 홍보해 드려요.
            </p>
            <ul className="mt-7 grid max-w-[460px] grid-cols-3 gap-2.5">
              {PROMISES.map((p) => (
                <li key={p.label} className="rounded-lg bg-white px-3 py-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-blue-500">{p.value}</p>
                  <p className="mt-1 text-xs text-gray-600">{p.label}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <BizApplyLink className={PRIMARY_BUTTON}>무료 홍보 신청하기</BizApplyLink>
              <a href="#intro" className={OUTLINE_BUTTON}>
                소개 방식 보기
              </a>
            </div>
            <BizLoginPrompt variant="inline" />
          </div>
          <BizHeroScreens />
        </div>
      </div>
    </section>
  );
}
