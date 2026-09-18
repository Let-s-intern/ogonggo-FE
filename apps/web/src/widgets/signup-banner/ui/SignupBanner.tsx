const COPY = {
  user: {
    title: '채용 공고를 찾고 계신가요?',
    description:
      '새로 등록된 채용·교육·지원사업 공고를 한곳에서 확인하고, 사이드 스터디에 참여해보세요!',
  },
  company: {
    title: '기업·교육기관 담당자이신가요?',
    description: '월 8만 취준생에게 공고를 직접 등록하고, 배너 광고로 더 크게 알려보세요',
  },
} as const;

export interface SignupBannerProps {
  /** 일반 회원 가입(`회원가입 유저.png`) 과 기업 회원 가입(`회원가입 기업.png`) 의 문구를 가른다. */
  audience: keyof typeof COPY;
}

/**
 * 가입 화면 맨 위의 파란 띠. 홈 히어로와 모양이 달라 가입 화면 전용으로 둔다(PRD "공용 UI").
 *
 * 글자 왼쪽 끝을 헤더 로고와 맞추려고 헤더와 같은 `max-w-6xl px-6` 틀을 쓴다.
 */
export function SignupBanner({ audience }: SignupBannerProps) {
  const { title, description } = COPY[audience];
  return (
    <section className="bg-linear-to-r from-blue-600 to-blue-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 md:py-12">
        <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
        <p className="text-sm text-white/90">{description}</p>
      </div>
    </section>
  );
}
