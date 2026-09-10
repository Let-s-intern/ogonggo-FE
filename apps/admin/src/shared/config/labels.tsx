import { Badge, type BadgeProps } from '@ogonggo/ui';
import type {
  ContentSource,
  JobPublicationStatus,
  JobReviewStatus,
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

const JOB_PUBLICATION_STATUS: Record<JobPublicationStatus, LabelSpec> = {
  DRAFT: { label: '초안', tone: 'neutral' },
  PUBLISHED: { label: '게시', tone: 'success' },
  HIDDEN: { label: '숨김', tone: 'danger' },
  ARCHIVED: { label: '보관', tone: 'neutral' },
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

export const JobPublicationStatusBadge = ({ value }: { value: JobPublicationStatus }) =>
  renderBadge(JOB_PUBLICATION_STATUS[value], value);

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

export const JOB_PUBLICATION_STATUS_OPTIONS = toOptions(JOB_PUBLICATION_STATUS, '게시 상태 전체');
export const JOB_REVIEW_STATUS_OPTIONS = toOptions(JOB_REVIEW_STATUS, '검수 상태 전체');
export const CONTENT_SOURCE_OPTIONS = toOptions(CONTENT_SOURCE, '등록 경로 전체');
export const BOOTCAMP_STATUS_OPTIONS = toOptions(BOOTCAMP_STATUS, '게시 상태 전체');
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
