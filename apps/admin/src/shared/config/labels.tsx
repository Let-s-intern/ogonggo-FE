import { Badge, type BadgeProps } from '@ogonggo/ui';
import {
  enumLabel,
  enumOptions,
  type AdminConcernSummaryResponseCategory as ConcernCategory,
  type AdminGeneralMemberResponseInflowSource as InflowSource,
  type AdminGeneralMemberResponseRole as MemberRole,
  type AdminJobDetailResponseReviewStatus as JobReviewStatus,
  type AdminJobDetailResponseSource as ContentSource,
  type AdminJobDetailResponseVisibility as Visibility,
  type AdminRecruitmentPostSummaryResponsePositionsItem as RecruitmentPosition,
  type EnumName,
  type EnumValue,
  type ListGeneralMembersStatus as MemberStatus,
} from '@ogonggo/api/src/admin';

/**
 * enum 값의 뱃지 색과 한국어 라벨.
 *
 * 라벨은 백엔드 enum 카탈로그(`enumLabel`)에서 온다. 여기는 색만 정한다.
 *
 * 색 매핑이 `packages/ui` 가 아니라 여기 있다. `Badge` 에 도메인별 색 맵을 박으면 상태 종류가
 * 다섯이라 도메인이 UI 패키지로 새어 들어간다(PRD "디자인 시스템"). 패키지는 `tone` 만 받고
 * 어느 상태가 어느 tone 인지는 앱이 안다.
 */

type Tone = NonNullable<BadgeProps['tone']>;

/**
 * 어드민 전용 enum 두 개. 공개 카탈로그에 없어 `enumLabel` 로 찾을 수 없으므로 백엔드 `desc` 를
 * 옮겨 둔다. 출처는 `ogonggo-BE/ogonggo-api-admin/src/main/kotlin/com/ogonggo/adminapi/content/business/`
 * 의 `AdminContentVisibility.kt`, `AdminContentSortType.kt` 다.
 */
const ADMIN_CONTENT_VISIBILITY: { value: Visibility; label: string }[] = [
  { value: 'VISIBLE', label: '노출' },
  { value: 'HIDDEN', label: '비노출' },
];

export const CONTENT_SORT_OPTIONS = [
  { value: 'REGISTERED_AT', label: '등록일순' },
  { value: 'VIEW_COUNT', label: '조회수순' },
];

const VISIBILITY_TONE: Record<Visibility, Tone> = {
  VISIBLE: 'success',
  HIDDEN: 'danger',
};

const JOB_REVIEW_STATUS_TONE: Record<JobReviewStatus, Tone> = {
  PENDING: 'urgent',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const CONTENT_SOURCE_TONE: Record<ContentSource, Tone> = {
  CRAWLER: 'neutral',
  COMPANY: 'main',
  // 고용24 Open API 일일 수집으로 들어온 공고(LC-3197).
  WORK24: 'neutral',
};

/**
 * 모집 상태. 노출 여부와 다른 것이다 — 모집이 끝나도 지면에 남을 수 있다.
 *
 * 채용공고(`JobRecruitmentStatus`, 계산값), 부트캠프(`BootcampRecruitmentStatus`, 저장값),
 * 사이드(`RecruitmentPostRecruitmentStatus`)가 같은 이름의 값을 쓰지만 라벨은 enum 마다 다르다.
 * 그래서 라벨은 화면이 넘기는 `enumName` 으로 찾고 색만 함께 쓴다. 부트캠프의 임시저장(`DRAFT`)은
 * 회색이다.
 */
const RECRUITMENT_STATUS_TONE: Record<string, Tone> = {
  RECRUITING: 'success',
  CLOSED: 'neutral',
};

type RecruitmentStatusEnum =
  | 'JobRecruitmentStatus'
  | 'BootcampRecruitmentStatus'
  | 'RecruitmentPostRecruitmentStatus';

/** 옛 공용 라벨. 호출부가 모두 `enumName` 을 넘기면 지운다. */
const RECRUITMENT_STATUS: Record<string, string> = {
  RECRUITING: '모집중',
  CLOSED: '모집 마감',
};

const MEMBER_STATUS_TONE: Record<MemberStatus, Tone> = {
  ACTIVE: 'success',
  WITHDRAWN: 'neutral',
  SUSPENDED: 'danger',
};

/** 일반 회원의 역할. 기업 회원(`COMPANY`) 은 일반 회원 화면에 오지 않으므로 색을 두지 않는다. */
const MEMBER_ROLE_TONE: Partial<Record<MemberRole, Tone>> = {
  USER: 'neutral',
  MENTOR: 'success',
  ADMIN: 'main',
};

const INFLOW_SOURCE_TONE: Record<InflowSource, Tone> = {
  LETSCAREER: 'main',
  OGONGGO: 'success',
};

/** 색이 매핑에 없으면 회색이다. 라벨은 카탈로그에 없으면 원래 값 그대로다(`enumLabel`). */
function renderBadge(tone: Tone | undefined, label: string) {
  return <Badge tone={tone ?? 'neutral'}>{label}</Badge>;
}

export const VisibilityBadge = ({ value }: { value: Visibility }) =>
  renderBadge(
    VISIBILITY_TONE[value],
    ADMIN_CONTENT_VISIBILITY.find((option) => option.value === value)?.label ?? value,
  );

/**
 * 크롤링 수집분에는 검수 상태가 없다. 빈 칸 대신 사유가 되는 단어를 남긴다.
 *
 * 없을 때 생성 모델은 `undefined`, 실제 응답은 `null`, 회원 목은 `null` 이라 셋 다 받는다.
 */
export const JobReviewStatusBadge = ({ value }: { value?: JobReviewStatus | null }) =>
  !value ? (
    <span className="text-gray-400">해당 없음</span>
  ) : (
    renderBadge(JOB_REVIEW_STATUS_TONE[value], enumLabel('ContentReviewStatus', value))
  );

export const ContentSourceBadge = ({ value }: { value: ContentSource }) =>
  renderBadge(CONTENT_SOURCE_TONE[value], enumLabel('ContentSource', value));

export const RecruitmentStatusBadge = ({
  enumName,
  value,
}: {
  enumName?: RecruitmentStatusEnum;
  value: string;
}) =>
  renderBadge(
    RECRUITMENT_STATUS_TONE[value],
    enumName ? enumLabel(enumName, value) : (RECRUITMENT_STATUS[value] ?? value),
  );

export const MemberStatusBadge = ({ value }: { value: MemberStatus }) =>
  renderBadge(MEMBER_STATUS_TONE[value], enumLabel('UserStatus', value));

export const MemberRoleBadge = ({ value }: { value: MemberRole }) =>
  renderBadge(MEMBER_ROLE_TONE[value], enumLabel('UserRole', value));

/** 유입 구분을 아직 정하지 못한 회원은 응답이 `null` 이다. 빈 칸 대신 `-` 를 남긴다. */
export const InflowSourceBadge = ({ value }: { value?: InflowSource | null }) =>
  !value ? (
    <span className="text-gray-400">-</span>
  ) : (
    renderBadge(INFLOW_SOURCE_TONE[value], enumLabel('UserInflowSource', value))
  );

export const sideStudyKindLabel = (value: string): string =>
  enumLabel('RecruitmentPostType', value);

export const recruitmentPositionLabel = (value: RecruitmentPosition): string =>
  enumLabel('RecruitmentPostPosition', value);

export const concernCategoryLabel = (value: ConcernCategory): string =>
  enumLabel('ConcernCategory', value);

/**
 * 필터 드롭다운 옵션. 첫 칸은 항상 "전체"이고 값이 빈 문자열이다. 나머지는 카탈로그 선언
 * 순서이고, 화면에 보이지 않을 값만 `exclude` 로 뺀다.
 */
const toOptions = <K extends EnumName>(
  name: K,
  allLabel: string,
  exclude: readonly EnumValue<K>[] = [],
) => [
  { value: '', label: allLabel },
  ...enumOptions(name).filter((option) => !exclude.includes(option.value)),
];

export const VISIBILITY_OPTIONS = [
  { value: '', label: '노출 여부 전체' },
  ...ADMIN_CONTENT_VISIBILITY,
];
export const JOB_REVIEW_STATUS_OPTIONS = toOptions('ContentReviewStatus', '검수 상태 전체');
export const CONTENT_SOURCE_OPTIONS = toOptions('ContentSource', '등록 경로 전체');
export const RECRUITMENT_STATUS_OPTIONS = [
  { value: '', label: '모집 상태 전체' },
  ...Object.entries(RECRUITMENT_STATUS).map(([value, label]) => ({ value, label })),
];
export const JOB_RECRUITMENT_STATUS_OPTIONS = toOptions('JobRecruitmentStatus', '모집 상태 전체');
/**
 * 임시저장(`DRAFT`)은 뺀다. 운영자가 콘솔에서 만들 수 있는 상태가 아니고, 필터로 남겨 두면
 * 골라도 늘 0 건이다.
 */
export const BOOTCAMP_RECRUITMENT_STATUS_OPTIONS = toOptions(
  'BootcampRecruitmentStatus',
  '모집 상태 전체',
  ['DRAFT'],
);
export const SIDE_STUDY_RECRUITMENT_STATUS_OPTIONS = toOptions(
  'RecruitmentPostRecruitmentStatus',
  '모집 상태 전체',
);
export const MEMBER_STATUS_OPTIONS = toOptions('UserStatus', '상태 전체');
/** 백엔드 선언 순서(일반, 관리자, 멘토)다. 기업 회원은 일반 회원 화면에 오지 않아 뺀다. */
export const MEMBER_ROLE_OPTIONS = toOptions('UserRole', '역할 전체', ['COMPANY']);
/** 역할을 바꿀 때 고르는 값. "전체" 칸이 없다. */
export const MEMBER_ROLE_CHANGE_OPTIONS = MEMBER_ROLE_OPTIONS.slice(1);
export const SIDE_STUDY_KIND_OPTIONS = toOptions('RecruitmentPostType', '종류 전체');
export const CONCERN_CATEGORY_OPTIONS = toOptions('ConcernCategory', '카테고리 전체');

export const JOINED_WITHIN_OPTIONS = [
  { value: '', label: '가입 기간 전체' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
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
  WORK_STUDY: '일학습병행',
  WORK_EXPERIENCE: '미래내일 일경험',
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
  // 근무 지역(시·도). 사용자 웹의 `REGION_LABELS` 와 같은 말이다
  NATIONWIDE: '전국',
  SEOUL: '서울',
  GYEONGGI: '경기',
  INCHEON: '인천',
  BUSAN: '부산',
  DAEGU: '대구',
  JEONNAM_GWANGJU: '전남광주',
  DAEJEON: '대전',
  ULSAN: '울산',
  SEJONG: '세종',
  GANGWON: '강원',
  GYEONGNAM: '경남',
  GYEONGBUK: '경북',
  CHUNGNAM: '충남',
  CHUNGBUK: '충북',
  JEONBUK: '전북',
  JEJU: '제주',
  OVERSEAS: '해외',
  // 공통
  ETC: '기타',
};

/** 매핑에 없으면 원래 값을 그대로 보여준다. 빈 칸보다 낫다. */
export const plainLabel = (value: string | undefined): string =>
  value === undefined ? '-' : (PLAIN_LABELS[value] ?? value);
