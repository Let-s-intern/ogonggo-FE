/**
 * 산업 트렌드 리포트 통합 랜딩(`/reports`)에 보이는 글. 전부 목데이터다 — 실제 발행 내용이 아니다.
 *
 * 실제 데이터로 바꿀 때는 이 파일만 바꾼다. 화면(`widgets/report-landing/ui`)은 이 파일의 타입만 읽는다.
 * 산업별 글은 `IndustrySlug` 를 키로 하는 `Record` 라, `shared/config/industryReports.ts` 에 산업이 늘면 여기서
 * 빠뜨린 칸을 타입 검사가 잡는다.
 */
import type { IndustrySlug } from '@/shared/config/industryReports';

/** 산업 카드 한 장에 들어가는 글. 이름과 주소는 `INDUSTRY_REPORTS` 가 정한다. */
export interface IndustryLandingCopy {
  /** 산업을 한 줄로 소개하는 글. */
  tagline: string;
  /** 이번 주 리포트의 헤드라인. */
  headline: string;
  /** 이번 주 키워드. 세 개다. */
  keywords: readonly [string, string, string];
  /** 이 산업 공고에서 자주 보이는 직무. 세 개다. */
  roles: readonly [string, string, string];
}

/** 이번에 발행한 회차. 히어로에 보인다. */
export const LANDING_ISSUE_LABEL = '2026년 11월 4주차';

export const INDUSTRY_LANDING_COPY: Record<IndustrySlug, IndustryLandingCopy> = {
  fnb: {
    tagline: '먹고 마시는 브랜드가 사람을 모으는 방법',
    headline: '편의점 신메뉴 경쟁이 시즌 한정 협업으로 옮겨 갔어요',
    keywords: ['시즌 한정', '협업 메뉴', '가맹 확장'],
    roles: ['상품기획(MD)', '브랜드 마케터', '가맹 운영 담당'],
  },
  'it-platform': {
    tagline: '서비스와 플랫폼이 일하는 방식',
    headline: '플랫폼들이 생성형 AI 기능을 앱 첫 화면으로 끌어올렸어요',
    keywords: ['생성형 AI', '구독 모델', '개인화 추천'],
    roles: ['서비스 기획자', '그로스 마케터', '프로덕트 매니저'],
  },
  beauty: {
    tagline: '취향과 성분으로 갈리는 뷰티 시장',
    headline: '체험형 오프라인 매장이 뷰티 브랜드 전략의 중심이 됐어요',
    keywords: ['체험 매장', '성분 마케팅', '해외 진출'],
    roles: ['브랜드 마케터', '상품기획(MD)', '해외 영업'],
  },
  entertainment: {
    tagline: '팬덤이 만드는 콘텐츠와 비즈니스',
    headline: '팬덤 플랫폼이 콘서트와 굿즈를 한 번에 묶기 시작했어요',
    keywords: ['팬덤 플랫폼', '굿즈', '글로벌 투어'],
    roles: ['콘텐츠 마케터', '팬덤 플랫폼 운영', '공연·행사 기획'],
  },
  'retail-ecommerce': {
    tagline: '사고파는 흐름을 설계하는 유통 현장',
    headline: '새벽 배송 경쟁이 물류 효율과 멤버십 혜택 싸움으로 바뀌었어요',
    keywords: ['당일 배송', '멤버십', '물류 자동화'],
    roles: ['상품기획(MD)', '물류 기획', '멤버십 CRM 마케터'],
  },
};

/** `받아 보는 리포트는 이런 모양이에요` 의 부분. 세 부분이고 번호는 화면이 붙인다. */
export interface LandingSection {
  title: string;
  /** 부분이 무엇인지 한 줄로. */
  description: string;
  /** 샘플 리포트에서 이 부분을 가리키는 짧은 이름표. */
  tag: string;
}

export const LANDING_SECTIONS: readonly LandingSection[] = [
  {
    title: '이번 주 산업 흐름',
    description: '한 주 동안 눈여겨볼 산업 뉴스를 골랐어요.',
    tag: '뉴스 4꼭지',
  },
  {
    title: '채용공고로 보는 직무',
    description: '공고에 적힌 문구가 산업 흐름과 어떻게 이어지는지 보여 줘요.',
    tag: '직무 표',
  },
  {
    title: '지금 혼자 할 수 있는 준비',
    description: '부담 없이 시작할 수 있는 활동을 골랐어요.',
    tag: '준비 3가지',
  },
];

/**
 * 샘플 리포트 한 장. 히어로의 표지와 `SampleReport` 가 같이 쓴다. 산업은 `IT·플랫폼` 이고 문구는 모두 예시다 —
 * 실제 발행 내용이 아니고 특정 회사나 숫자를 넣지 않았다.
 */
export const SAMPLE_REPORT = {
  slug: 'it-platform',
  news: [
    { title: '생성형 AI 기능이 앱 첫 화면으로', why: '서비스 기획자가 가장 먼저 보는 변화예요' },
    { title: '구독 모델로 옮겨 가는 플랫폼', why: '수익 구조가 직무 요구사항을 바꿔요' },
    { title: '개인화 추천 경쟁', why: '데이터를 읽는 역량이 공고에 늘어요' },
    { title: '서비스끼리 손잡는 제휴', why: '협업 경험을 묻는 공고가 보여요' },
  ],
  jobs: [
    { role: '서비스 기획자', phrase: '사용자 데이터를 바탕으로 기능 개선', trend: '생성형 AI' },
    { role: '그로스 마케터', phrase: '고객 유형별 메시지 설계', trend: '개인화 추천' },
    { role: '프로덕트 매니저', phrase: '구독 전환 개선 경험', trend: '구독 모델' },
  ],
  tasks: [
    { tag: '분석', text: '좋아하는 서비스를 덕질하듯 분석해 보기' },
    { tag: '개선안', text: '앱을 뜯어보고 개선안 적어 보기' },
    { tag: '정리', text: '후기를 모아 소비자 반응 정리하기' },
  ],
} as const;
