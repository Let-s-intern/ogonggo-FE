import Image from 'next/image';
import { AD_INTRODUCTION_PDF } from '@/shared/config/site';

/**
 * 고객 사례 5건. 소개서 17~21쪽을 옮겼다. 광고 신청·문의 첫 화면에 둔다(2026-11-10 사용자). 이미지는 그 쪽의 실제 집행 소재를 모자이크한 것이라
 * 소재 글씨는 읽히지 않는다(`public/landing/cases`).
 */
const CASES = [
  {
    image: '/landing/cases/case-1.jpg',
    kind: '채용공고 광고',
    company: '토스페이먼츠',
    title: '세일즈 계약직 채용',
    situation: '마감이 촉박해 직무 적합도 높은 지원자가 빠르게 필요했어요.',
    channels: '오공고 인스타 피드·스토리 + 직무 큐레이션 톡방 4곳',
    results: ['조회수 1.8만회', '팔로워 조회 비율 97.5%', '전체 클릭 135'],
  },
  {
    image: '/landing/cases/case-2.jpg',
    kind: '채용공고 광고',
    company: '레브잇',
    title: '콘텐츠 마케팅 인턴 채용',
    situation:
      '채용 시 마감이라 빠른 지원 유입이 필요했어요. 문의 24분 만에 톡방 홍보를 시작했어요.',
    channels: '마케팅·세일즈 톡방 + 인스타 2개 계정 스토리',
    results: ['링크 유입 113건', '스토리 조회 1,700여건', '3개월 만에 재구매'],
  },
  {
    image: '/landing/cases/case-3.jpg',
    kind: '채용공고 광고',
    company: '모두닥',
    title: '전환형 인턴 채용',
    situation: '지원자 수와 함께 후보자의 적합도까지 확보해야 했어요.',
    channels: '오공고 인스타 피드 1회',
    results: ['도달 1만 계정', '조회수 2.8만회', '저장 149 · 공유 102'],
  },
  {
    image: '/landing/cases/case-4.jpg',
    kind: '채용공고 광고',
    company: '인바디',
    title: 'GBD 통합 직무 인턴',
    situation: '채용 시 마감이라 빠르게, 적합한 지원자를 모아야 했어요.',
    channels: '오공고 인스타 피드 1회',
    results: ['조회수 3.9만회', '도달 1.4만', '저장 308 · 공유 147'],
  },
  {
    image: '/landing/cases/case-5.jpg',
    kind: '채용설명회',
    company: '라라스윗',
    title: '그로스 마케팅 인턴 채용설명회',
    situation: '기업에 관심 있는 지원자의 리드를 확보해야 했어요.',
    channels: '라라스윗 현직자 세미나',
    results: ['취준생 약 250명 참여'],
  },
];

/** 고객 사례 5건(소개서 17~21쪽). 소재는 모자이크한 이미지라 분위기만 보이고, 숫자 성과를 앞에 둔다. */
export function AdCases() {
  return (
    <section className="page-container mx-auto max-w-[1200px] px-4 pb-16 md:px-6 md:pb-24">
      <p className="text-sm font-semibold text-blue-500">CASES</p>
      <h2 className="mt-2 text-2xl font-bold">먼저 집행한 기업들의 결과예요</h2>
      <p className="mt-2 text-sm text-gray-500">
        실제 집행 소재는 모자이크했어요. 자세한 사례는{' '}
        <a
          href={AD_INTRODUCTION_PDF}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-blue-500 underline underline-offset-2"
        >
          소개서
        </a>
        에서 볼 수 있어요.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CASES.map((c, i) => (
          <li
            key={c.company}
            className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-50">
              <Image
                src={c.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
              <span className="absolute top-3 left-3 rounded-full bg-gray-900/70 px-2.5 py-1 text-xs font-medium text-white">
                사례 {i + 1} · {c.kind}
              </span>
            </div>
            <div className="flex flex-1 flex-col px-5 py-5">
              <p className="text-sm font-semibold text-blue-500">{c.company}</p>
              <p className="mt-1 text-lg font-bold">{c.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{c.situation}</p>
              <p className="mt-3 text-xs text-gray-500">
                <span className="mr-1.5 text-gray-400">진행</span>
                {c.channels}
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-gray-100 pt-4">
                {c.results.map((r) => (
                  <li
                    key={r}
                    className="rounded-md bg-blue-00 px-2.5 py-1 text-sm font-semibold text-blue-600"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
