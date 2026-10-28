import { INSTAGRAM_URL, LAUNCH_DATE_LABEL } from '../model/content';
import { BizHeroScreens } from './BizHeroScreens';

/** 히어로 문구와 화면 전환(PRD 2절). 버튼은 같은 화면 안의 구역으로 내려간다. */
export function BizHero() {
  return (
    <header className="overflow-hidden bg-[linear-gradient(180deg,var(--color-blue-00)_0%,#fff_100%)] pt-14 pb-16 md:pt-20 md:pb-24">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 md:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        <div>
          <span className="inline-block rounded-full border border-blue-100 bg-white px-3.5 py-1.5 text-sm font-bold text-blue-600">
            출시 기념 무료 이벤트
          </span>
          <h1 className="mt-5 text-[34px] leading-[1.22] font-extrabold tracking-[-0.035em] text-gray-900 md:text-5xl">
            &lsquo;오늘의 공고&rsquo; 출시 기념
            <br />
            <em className="text-blue-500 not-italic">무료 홍보 이벤트</em>
          </h1>
          <p className="mt-5 text-base leading-[1.75] text-gray-600 md:text-[17px]">
            안녕하세요, 인턴·신입 커리어 교육 콘텐츠 플랫폼{' '}
            <b className="text-gray-900">렛츠커리어</b>
            입니다. 렛츠커리어가 {LAUNCH_DATE_LABEL}, &lsquo;오늘의 공고&rsquo; 플랫폼을
            출시했습니다.
          </p>
          <p className="mt-2.5 text-base leading-[1.75] text-gray-600 md:text-[17px]">
            출시를 기념해 <b className="text-gray-900">기업별 1회 채용공고 무료 홍보</b> 이벤트를
            진행합니다. 기존 유료로 운영되던 인스타그램{' '}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              @letscareer.job
            </a>{' '}
            또는 직무별 오픈채팅방 1곳 중 원하는 채널을 선택해 채용공고를 무료로 홍보하실 수
            있습니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <a
              href="#apply"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-500 px-[22px] text-base font-bold text-white hover:bg-blue-600"
            >
              무료 홍보 신청하기
            </a>
            <a
              href="#intro"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-[22px] text-base font-bold text-gray-800 hover:bg-gray-50"
            >
              소개 방식 보기
            </a>
          </div>
          <p className="mt-5 text-[13px] text-gray-500">
            신청 비용 없음 · 소재 제작은 렛츠커리어가 진행 · 2일 안에 일정 안내
          </p>
        </div>
        <BizHeroScreens />
      </div>
    </header>
  );
}
