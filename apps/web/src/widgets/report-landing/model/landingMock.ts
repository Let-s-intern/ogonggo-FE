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
}

/** 이번에 발행한 회차. 히어로에 보인다. */
export const LANDING_ISSUE_LABEL = '2026년 11월 4주차';

export const INDUSTRY_LANDING_COPY: Record<IndustrySlug, IndustryLandingCopy> = {
  fnb: {
    tagline: '먹고 마시는 브랜드가 사람을 모으는 방법',
    headline: '편의점 신메뉴 경쟁이 시즌 한정 협업으로 옮겨 갔어요',
    keywords: ['시즌 한정', '협업 메뉴', '가맹 확장'],
  },
  'it-platform': {
    tagline: '서비스와 플랫폼이 일하는 방식',
    headline: '플랫폼들이 생성형 AI 기능을 앱 첫 화면으로 끌어올렸어요',
    keywords: ['생성형 AI', '구독 모델', '개인화 추천'],
  },
  beauty: {
    tagline: '취향과 성분으로 갈리는 뷰티 시장',
    headline: '체험형 오프라인 매장이 뷰티 브랜드 전략의 중심이 됐어요',
    keywords: ['체험 매장', '성분 마케팅', '해외 진출'],
  },
  entertainment: {
    tagline: '팬덤이 만드는 콘텐츠와 비즈니스',
    headline: '팬덤 플랫폼이 콘서트와 굿즈를 한 번에 묶기 시작했어요',
    keywords: ['팬덤 플랫폼', '굿즈', '글로벌 투어'],
  },
  'retail-ecommerce': {
    tagline: '사고파는 흐름을 설계하는 유통 현장',
    headline: '새벽 배송 경쟁이 물류 효율과 멤버십 혜택 싸움으로 바뀌었어요',
    keywords: ['당일 배송', '멤버십', '물류 자동화'],
  },
};

/** `리포트는 이렇게 구성돼요` 의 칸. 세 칸이고 번호는 화면이 붙인다. */
export interface LandingSection {
  title: string;
  description: string;
  /** 칸의 내용을 짚어 주는 글. */
  points: readonly string[];
}

export const LANDING_SECTIONS: readonly LandingSection[] = [
  {
    title: '이번 주 산업 흐름',
    description: '한 주 동안 눈여겨볼 산업 뉴스를 네 꼭지로 골랐어요.',
    points: ['뉴스 4꼭지를 숫자와 함께 정리', '왜 중요한지 맥락까지 설명'],
  },
  {
    title: '채용공고로 보는 직무',
    description: '실제 채용공고에 적힌 문구가 산업 흐름과 어떻게 이어지는지 보여 줘요.',
    points: ['공고가 요구하는 역량을 문구 그대로 연결', '지원 직무에서 쓰이는 말을 익히기'],
  },
  {
    title: '지금 혼자 할 수 있는 준비 포인트',
    description: '부담 없이 시작할 수 있는 활동을 세 가지씩 제안해요.',
    points: ['좋아하는 브랜드를 덕질하듯 분석하기', '앱을 뜯어보고 개선안 적어 보기', '후기를 모아 소비자 반응 정리하기'],
  },
];
