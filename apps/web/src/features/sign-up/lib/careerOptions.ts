import type { ReplaceMyProfileRequestGrade } from '@ogonggo/api';

/**
 * 커리어 정보 화면(`/signup/career`) 의 선택지. 렛츠커리어 커리어 계획 화면과 같은 목록이어야 한다 — 같은 사용자의
 * 값이 두 서비스에서 같은 말이어야 하고, 오공고는 첫 교환 때 렛츠커리어의 값을 그대로 복사해 온다(PRD "화면 >
 * 커리어 정보").
 *
 * 원본: `lets-intern-client` origin/main `cd59fa5` 의 `packages/utils/src/constants.ts`.
 * 웹 앱의 `apps/web/src/utils/constants.ts` 는 이 파일을 `export *` 로 다시 내보낼 뿐이다. 목록을 고치면 원본과
 * 다시 대조한다.
 */

/** 원본 `GRADE_ENUM_TO_KOREAN`. 오공고 `grade` enum 과 키가 같다(백엔드 `UserGrade` 는 `ETC` 를 "5학년 이상" 이라 적지만 라벨은 렛츠커리어를 따른다). */
export const GRADE_ENUM_TO_KOREAN = {
  FIRST: '1학년',
  SECOND: '2학년',
  THIRD: '3학년',
  FOURTH: '4학년',
  ETC: '5학년',
  GRADUATE: '졸업생',
} as const satisfies Record<ReplaceMyProfileRequestGrade, string>;

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

/**
 * 원본 `JOB_FIELD_ROLES`. 직군마다 첫 직무가 `<직군> 직무 전체` 이고 다른 직무와 함께 고를 수 없다.
 * `직군 무관` 은 직무가 없다 — 고르면 직무가 `직무 무관` 하나로 정해진다.
 */
export const JOB_FIELD_ROLES: readonly { jobField: string; jobRoles: readonly string[] }[] = [
  {
    jobField: '경영/인사',
    jobRoles: [
      '경영/인사 직무 전체',
      '경영지원',
      '회계/경리',
      '조직관리',
      '정보보호 담당자',
      '인사/평가',
      '교육',
      '채용담당자',
      '서비스운영',
      'CS 매니저',
    ],
  },
  {
    jobField: '마케팅',
    jobRoles: [
      '마케팅 직무 전체',
      '마케터',
      '퍼포먼스 마케터',
      '콘텐츠 마케터',
      '디지털 마케터',
      '마케팅 전략 기획',
      '브랜드 마케터',
      '광고 기획(AE)',
      'CRM 전문가',
      '카피라이터/UX Writer',
      '마켓 리서처',
    ],
  },
  {
    jobField: '영업',
    jobRoles: [
      '영업 직무 전체',
      '기업 영업',
      '기술 영업',
      '해외영업',
      '솔루션 컨설턴트',
      '세일즈',
      '제약 영업',
    ],
  },
  {
    jobField: '기획',
    jobRoles: [
      '기획 직무 전체',
      '서비스 기획',
      'PM/PO',
      '비즈니스 분석가',
      '사업개발/기획',
      '전략 기획',
      '해외 사업개발/기획',
      '상품 기획/MD',
    ],
  },
  {
    jobField: '디자인',
    jobRoles: [
      '디자인 직무 전체',
      '프로덕트 디자인',
      '웹/앱 디자인',
      '그래픽 디자인',
      'UX 디자인',
      'BI/BX 디자인',
      '광고 디자인',
      '영상/모션 디자인',
      '운영 디자인',
      '3D 디자인',
    ],
  },
  {
    jobField: '개발',
    jobRoles: [
      '개발 직무 전체',
      '백엔드/서버 개발',
      '프론트엔드 개발',
      'SW 엔지니어',
      '안드로이드 개발',
      'iOS 개발',
      '데이터 엔지니어',
      '데이터 사이언티스트',
      '데이터 분석가',
      'QA/테스트 엔지니어',
      '보안 엔지니어',
      '임베디드',
      '게임 개발자',
    ],
  },
  {
    jobField: '엔지니어링',
    jobRoles: ['엔지니어링 직무 전체', '기계', '전자', '전기', '로봇', '설비', '공정'],
  },
  { jobField: '직군 무관', jobRoles: [] },
];

/** `직군 무관` 을 고르면 직무 칸에 들어가는 값. 원본 `CareerModal.tsx` 의 `handleFieldSelect`. */
export const ANY_JOB_FIELD = '직군 무관';
export const ANY_JOB_ROLE = '직무 무관';
export const ANY_INDUSTRY = '산업 무관';
/** 직군마다 있는 "직무 전체" 항목의 꼬리. 원본은 `name.includes('직무 전체')` 로 가른다. */
export const ALL_ROLES_SUFFIX = '직무 전체';

/**
 * 원본 `JOB_CONDITIONS`. 렛츠커리어는 문구가 아니라 `value` 를 `', '` 로 이어 `wishEmploymentType` 에 저장한다
 * (`apps/web/src/domain/mypage/career/CareerInfoForm.tsx` 의 `handleConditionToggle`). 오공고도 같은 값을 보낸다.
 */
export const JOB_CONDITIONS = [
  { value: 'PUBLIC', label: '대기업 공채에 지원하고 싶어요.' },
  { value: 'STARTUP', label: '스타트업/중소기업 정규직으로 가고 싶어요.' },
  { value: 'INTERN', label: '채용형 인턴에 도전하고 싶어요.' },
  { value: 'EXPERIENCE', label: '체험형 인턴으로 경험을 먼저 쌓고 싶어요.' },
  { value: 'FREELANCE', label: '계약직/프로젝트성 일자리도 괜찮아요.' },
] as const;

/** 여러 값을 한 칸에 잇는 구분자. 원본의 `join(', ')`. 읽을 때는 `,` 로 자르고 앞뒤 공백을 지운다. */
export const WISH_VALUE_SEPARATOR = ', ';
