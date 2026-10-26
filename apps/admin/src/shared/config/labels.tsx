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
  type AdminNotificationRecentResultItemResponseChannel as NotificationChannel,
  type AdminNotificationRecentResultItemResponseRecipientType as NotificationRecipientType,
  type AdminNotificationRecentResultItemResponseResultCategory as NotificationResultCategory,
  type AdminNotificationRecentResultItemResponseStatus as NotificationStatus,
  type AdminRecruitmentPostSummaryResponsePositionsItem as RecruitmentPosition,
  type CreateNotificationBatchRequestTargetType as NotificationTargetType,
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

export const visibilityLabel = (value: Visibility): string =>
  ADMIN_CONTENT_VISIBILITY.find((option) => option.value === value)?.label ?? value;

export const VisibilityBadge = ({ value }: { value: Visibility }) =>
  renderBadge(VISIBILITY_TONE[value], visibilityLabel(value));

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
  enumName: RecruitmentStatusEnum;
  value: string;
}) => renderBadge(RECRUITMENT_STATUS_TONE[value], enumLabel(enumName, value));

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

/*
 * 알림 발송. 문구는 PRD `prd-notifications.md` "라벨" 로 정했다. 카탈로그에 있는 넷(`NotificationStatus`·
 * `NotificationChannel`·`NotificationRecipientType`·`NotificationBatchTargetType`)의 `desc` 는 `provider 접수`
 * 처럼 백엔드 용어라 운영자가 읽는 말로 바꿨고, 뜻은 `desc` 와 같다. `resultCategory` 는 카탈로그에 없다.
 *
 * 모두 모르는 값이면 원래 값을 그대로 보인다. 백엔드가 값을 늘려도 칸이 비지 않는다.
 */

const NOTIFICATION_STATUS: Record<NotificationStatus, { label: string; tone: Tone }> = {
  PENDING: { label: '대기', tone: 'neutral' },
  PROCESSING: { label: '처리 중', tone: 'main' },
  SENT: { label: '접수 성공', tone: 'success' },
  FAILED: { label: '실패', tone: 'danger' },
  UNKNOWN: { label: '미확정', tone: 'urgent' },
};

const NOTIFICATION_CHANNEL_LABEL: Record<NotificationChannel, string> = {
  FCM: '푸시',
  KAKAO: '알림톡',
  EMAIL: '이메일',
};

const NOTIFICATION_RECIPIENT_TYPE_LABEL: Record<NotificationRecipientType, string> = {
  DIRECT: '개별',
  TOPIC: '토픽',
};

/** 발송 요약·상세의 `deliveryTargetType`. 같은 값을 작업 표(`recipientType`)보다 길게 부른다. */
const NOTIFICATION_DELIVERY_TYPE_LABEL: Record<NotificationRecipientType, string> = {
  DIRECT: '개별 발송',
  TOPIC: '전체 공지',
};

const NOTIFICATION_TARGET_TYPE_LABEL: Record<NotificationTargetType, string> = {
  USER_IDS: '지정 회원',
  ALL: '전체 회원',
};

/**
 * 채널 구현체가 분류한 실패 원인(백엔드 `NotificationFailureCategory`). 예로 FCM 의 `UNREGISTERED` 는
 * `CLIENT_ERROR` 로 온다(`FcmNotificationSender.toFailureCategory`).
 */
const NOTIFICATION_RESULT_CATEGORY_LABEL: Record<NotificationResultCategory, string> = {
  DUPLICATE_REQUEST: '중복 요청',
  AUTHENTICATION_CONFIGURATION: '인증 설정 오류',
  SENDER_PROFILE_CONFIGURATION: '발신 프로필 설정 오류',
  INVALID_REQUEST: '잘못된 요청',
  TEMPLATE_CONFIGURATION: '템플릿 설정 오류',
  RATE_LIMITED: '발송 한도 초과',
  PROVIDER_UNAVAILABLE: '발송사 장애',
  PROVIDER_REJECTED: '발송사 거절',
  TRANSPORT_ERROR: '통신 오류',
  PROCESSING_TIMEOUT: '처리 시간 초과(결과 미확정)',
  HTTP_ERROR: 'HTTP 오류',
  CLIENT_ERROR: '수신 대상 오류',
  INVALID_PROVIDER_RESPONSE: '발송사 응답 해석 실패',
  CHANNEL_NOT_CONFIGURED: '채널 미설정',
  APPLICATION_ERROR: '서버 내부 오류',
  UNKNOWN_PROVIDER_ERROR: '발송사 원인 불명 오류',
};

/** 맵에 없는 값(서버가 새로 더한 값)은 원래 값 그대로다. */
const lookup = (map: Record<string, string>, value: string): string => map[value] ?? value;

export const NotificationStatusBadge = ({ value }: { value: string }) => {
  const known = NOTIFICATION_STATUS[value as NotificationStatus];
  return renderBadge(known?.tone, known?.label ?? value);
};

export const notificationChannelLabel = (value: string): string =>
  lookup(NOTIFICATION_CHANNEL_LABEL, value);

export const notificationRecipientTypeLabel = (value: string): string =>
  lookup(NOTIFICATION_RECIPIENT_TYPE_LABEL, value);

export const notificationDeliveryTypeLabel = (value: string): string =>
  lookup(NOTIFICATION_DELIVERY_TYPE_LABEL, value);

export const notificationTargetTypeLabel = (value: string): string =>
  lookup(NOTIFICATION_TARGET_TYPE_LABEL, value);

export const notificationResultCategoryLabel = (value: string): string =>
  lookup(NOTIFICATION_RESULT_CATEGORY_LABEL, value);

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
