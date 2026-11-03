/**
 * web 의 `apps/web/src/features/sign-up/lib/careerOptions.ts` 에서 기업 가입이 쓰는 산업 목록만 옮겼다.
 */
/** 원본 `DESIRED_INDUSTRY.industryList`. `산업 무관` 은 다른 산업과 함께 고를 수 없다. */
export const DESIRED_INDUSTRIES = [
  'IT·플랫폼',
  '금융·핀테크',
  '커머스·리테일',
  '모빌리티',
  '교육',
  '패션·뷰티',
  '엔터·미디어',
  '게임·콘텐츠',
  '헬스케어·바이오',
  '제조·하드웨어',
  '환경·에너지',
  '공공·비영리',
  '산업 무관',
] as const;
