import { Badge, type BadgeProps } from '@ogonggo/ui';
import type {
  ContentSource,
  JobReviewStatus,
  Visibility,
} from '@ogonggo/api/src/mocks/fixtures/admin-content';
import type { InquiryCategory, InquiryStatus } from '@ogonggo/api/src/mocks/fixtures/admin-inquiry';
import type { MemberStatus } from '@ogonggo/api/src/mocks/fixtures/admin-member';

/**
 * enum 값 -> 한국어 라벨과 뱃지 색.
 *
 * 색 매핑이 `packages/ui` 가 아니라 여기 있다. `Badge` 에 도메인별 색 맵을 박으면 상태 종류가
 * 다섯이라 도메인이 UI 패키지로 새어 들어간다(PRD "디자인 시스템"). 패키지는 `tone` 만 받고
 * 어느 상태가 어느 tone 인지는 앱이 안다.
 */

type Tone = NonNullable<BadgeProps['tone']>;

interface LabelSpec {
  label: string;
  tone: Tone;
}

const VISIBILITY: Record<Visibility, LabelSpec> = {
  VISIBLE: { label: '노출', tone: 'success' },
  HIDDEN: { label: '비노출', tone: 'danger' },
};

const JOB_REVIEW_STATUS: Record<JobReviewStatus, LabelSpec> = {
  PENDING: { label: '검수 대기', tone: 'urgent' },
  APPROVED: { label: '승인', tone: 'success' },
  REJECTED: { label: '반려', tone: 'danger' },
};

const CONTENT_SOURCE: Record<ContentSource, LabelSpec> = {
  CRAWLER: { label: '크롤링', tone: 'neutral' },
  COMPANY: { label: '비즈니스 등록', tone: 'main' },
};

/** 모집 상태. 노출 여부와 다른 것이다 — 모집이 끝나도 지면에 남을 수 있다. */
const BOOTCAMP_STATUS: Record<string, LabelSpec> = {
  DRAFT: { label: '임시저장', tone: 'neutral' },
  RECRUITING: { label: '모집중', tone: 'success' },
  CLOSED: { label: '모집 마감', tone: 'neutral' },
};

const MEMBER_STATUS: Record<MemberStatus, LabelSpec> = {
  ACTIVE: { label: '활성', tone: 'success' },
  WITHDRAWN: { label: '탈퇴', tone: 'neutral' },
  SUSPENDED: { label: '정지', tone: 'danger' },
};

const INQUIRY_STATUS: Record<InquiryStatus, LabelSpec> = {
  RECEIVED: { label: '접수', tone: 'urgent' },
  IN_PROGRESS: { label: '처리중', tone: 'main' },
  ANSWERED: { label: '답변 완료', tone: 'success' },
};

const INQUIRY_CATEGORY: Record<InquiryCategory, string> = {
  SERVICE: '서비스',
  JOB_POSTING: '채용공고',
  ACCOUNT: '계정',
  ADVERTISEMENT: '광고',
  ETC: '기타',
};

const SIDE_STUDY_KIND: Record<string, string> = {
  SIDE_PROJECT: '사이드 프로젝트',
  STUDY: '스터디',
};

/** 값이 매핑에 없으면 원래 문자열을 그대로 보여준다. 빈 칸보다 낫다. */
function renderBadge(spec: LabelSpec | undefined, raw: string) {
  if (!spec) {
    return <Badge tone="neutral">{raw}</Badge>;
  }
  return <Badge tone={spec.tone}>{spec.label}</Badge>;
}

export const VisibilityBadge = ({ value }: { value: Visibility }) =>
  renderBadge(VISIBILITY[value], value);

/** 크롤링 수집분에는 검수 상태가 없다. 빈 칸 대신 사유가 되는 단어를 남긴다. */
export const JobReviewStatusBadge = ({ value }: { value: JobReviewStatus | null }) =>
  value === null ? (
    <span className="text-gray-400">해당 없음</span>
  ) : (
    renderBadge(JOB_REVIEW_STATUS[value], value)
  );

export const ContentSourceBadge = ({ value }: { value: ContentSource }) =>
  renderBadge(CONTENT_SOURCE[value], value);

export const BootcampStatusBadge = ({ value }: { value: string }) =>
  renderBadge(BOOTCAMP_STATUS[value], value);

export const MemberStatusBadge = ({ value }: { value: MemberStatus }) =>
  renderBadge(MEMBER_STATUS[value], value);

export const InquiryStatusBadge = ({ value }: { value: InquiryStatus }) =>
  renderBadge(INQUIRY_STATUS[value], value);

export const inquiryCategoryLabel = (value: InquiryCategory): string =>
  INQUIRY_CATEGORY[value] ?? value;

export const sideStudyKindLabel = (value: string): string => SIDE_STUDY_KIND[value] ?? value;

/** 필터 드롭다운 옵션. 첫 칸은 항상 "전체"이고 값이 빈 문자열이다. */
const toOptions = (entries: Record<string, LabelSpec | string>, allLabel: string) => [
  { value: '', label: allLabel },
  ...Object.entries(entries).map(([value, spec]) => ({
    value,
    label: typeof spec === 'string' ? spec : spec.label,
  })),
];

export const VISIBILITY_OPTIONS = toOptions(VISIBILITY, '노출 여부 전체');
export const JOB_REVIEW_STATUS_OPTIONS = toOptions(JOB_REVIEW_STATUS, '검수 상태 전체');
export const CONTENT_SOURCE_OPTIONS = toOptions(CONTENT_SOURCE, '등록 경로 전체');
export const BOOTCAMP_STATUS_OPTIONS = toOptions(BOOTCAMP_STATUS, '모집 상태 전체');
export const MEMBER_STATUS_OPTIONS = toOptions(MEMBER_STATUS, '상태 전체');
export const INQUIRY_STATUS_OPTIONS = toOptions(INQUIRY_STATUS, '처리 상태 전체');
export const INQUIRY_CATEGORY_OPTIONS = toOptions(INQUIRY_CATEGORY, '분류 전체');
export const SIDE_STUDY_KIND_OPTIONS = toOptions(SIDE_STUDY_KIND, '종류 전체');

export const JOINED_WITHIN_OPTIONS = [
  { value: '', label: '가입 기간 전체' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
];

export const CONTENT_SORT_OPTIONS = [
  { value: 'REGISTERED_AT', label: '등록일순' },
  { value: 'VIEW_COUNT', label: '조회순' },
];

/**
 * 상세 화면에서 값 그대로 보여주기엔 읽기 어려운 enum 들.
 *
 * 뱃지가 아니라 평문이다. 상세의 라벨-값 목록에서 값 하나하나에 색을 입히면 어떤 것이 상태이고
 * 어떤 것이 단순 속성인지 구분이 사라진다.
 */
const PLAIN_LABELS: Record<string, string> = {
  // 고용 형태
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  INTERN: '인턴',
  PART_TIME: '파트타임',
  // 경력
  NEWCOMER: '신입',
  EXPERIENCED: '경력',
  BOTH: '신입·경력',
  IRRELEVANT: '경력 무관',
  // 학력
  ANY: '학력 무관',
  HIGH_SCHOOL: '고졸',
  ASSOCIATE: '초대졸',
  BACHELOR: '대졸',
  MASTER: '석사',
  DOCTORATE: '박사',
  // 모집 유형
  PERIOD: '기간 모집',
  ALWAYS_OPEN: '상시 모집',
  // 진행 방식
  ONLINE: '온라인',
  OFFLINE: '오프라인',
  HYBRID: '온·오프라인',
  // 수강료
  FREE: '무료',
  PAID: '유료',
  GOVERNMENT_FUNDED: '국비지원',
  // 지원 방법
  EXTERNAL_PAGE: '외부 페이지',
  EMAIL: '이메일',
  // 공통
  ETC: '기타',
};

/** 매핑에 없으면 원래 값을 그대로 보여준다. 빈 칸보다 낫다. */
export const plainLabel = (value: string | undefined): string =>
  value === undefined ? '-' : (PLAIN_LABELS[value] ?? value);

/** 경력 연차. `experienceMinYears`·`experienceMaxYears` 가 둘 다 없으면 유형만 보여준다. */
export const experienceLabel = (
  type: string,
  minYears: number | undefined,
  maxYears: number | undefined,
): string => {
  const base = plainLabel(type);
  if (minYears === undefined && maxYears === undefined) {
    return base;
  }
  if (minYears !== undefined && maxYears !== undefined) {
    return `${base} (${minYears}~${maxYears}년)`;
  }
  return minYears !== undefined ? `${base} (${minYears}년 이상)` : `${base} (${maxYears}년 이하)`;
};
