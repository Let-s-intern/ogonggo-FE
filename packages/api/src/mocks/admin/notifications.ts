import { http, HttpResponse, type HttpHandler } from 'msw';
import { localDateTime } from '../fixtures/admin-notice';
import type {
  AdminNotificationBatchCreatedResponse,
  AdminNotificationBatchResultResponse,
  AdminNotificationBatchStatisticGroupResponse,
  AdminNotificationJobRoleOptionResponse,
  AdminNotificationRecentResultItemResponse,
  AdminNotificationRecentResultItemResponseResultCategory,
  CreateNotificationBatchRequestTargetType,
  ErrorResponse,
  SuccessResponseAdminNotificationBatchCreatedResponse,
  SuccessResponseAdminNotificationBatchResultResponse,
  SuccessResponseAdminNotificationBatchStatisticsResponse,
  SuccessResponseAdminNotificationRecentResultsResponse,
  SuccessResponseListAdminNotificationJobRoleOptionResponse,
} from '../../generated/admin/models';
import type { SuccessResponseImageUploadResponse } from '../../generated/user/models';
import { ok } from './paging';

/**
 * 관리자 알림 발송 핸들러(PRD `prd-notifications.md` "목 · 관리자"). 발송·결과 상세·최근 발송 작업·희망 직무
 * 선택지·기간별 통계, 그리고 알림 이미지 업로드(사용자 API `POST /api/v1/images`).
 *
 * 발송은 백엔드 `AdminNotificationBatchService` 의 검사를 같은 순서·같은 문구로 흉내 낸다. 400 문구는
 * `AdminApiExceptionHandler` 처럼 `[필드] 사유` 모양이다. 광고성을 기업 회원 대상에 켜면 400, 다른 대상에
 * `userIds`·`jobRoles` 가 있으면 400, 업로드한 적 없는 `imageId` 는 400 `IMAGE_ASSET_NOT_AVAILABLE` 이다.
 * `userIds` 에 `999999` 가 있으면 없는 회원으로 보고 404 `USER_NOT_FOUND` 로 전체를 거절한다.
 *
 * 비광고성 전체·일반 회원·기업 회원 발송은 토픽 전환이 켜진 운영과 같이 TOPIC 으로 답한다. 광고성은 동의자만
 * 골라야 해 늘 DIRECT 다. 희망 직무 발송도 DIRECT 다.
 *
 * 결과 상세는 묶음마다 조회 횟수를 센다. 처음 두 번은 `completed=false` 이고 세 번째부터 `true` 다 —
 * 화면의 10초 폴링이 멈추는지 보려고. 묶음은 메모리에 있어 워커가 다시 뜨면 시드만 남는다.
 *
 * 회원은 ID 로 상태를 정한다. 10의 배수는 비활성, 3의 배수는 토큰 없음, 짝수는 기기 둘(토큰 둘), 4의 배수는
 * 마케팅 수신 미동의다. 토큰은 검사하지 않는다(다른 어드민 목과 같다).
 */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** 없는 회원으로 다루는 ID. 404 문구를 목 모드에서 보려고 둔다. */
const MISSING_USER_ID = 999999;

/** 전체 회원 발송의 대상 수. 실제로는 요청 시점의 활성 회원 수다. */
const ALL_ACTIVE_USERS = 1532;
const ALL_NO_TOKEN_USERS = 410;

type TargetType = CreateNotificationBatchRequestTargetType;

/** 회원 종류 발송의 활성 회원 수, 토큰 없는 회원 수, 마케팅 수신 미동의 회원 수. */
const AUDIENCE: Record<
  'ALL' | 'GENERAL_MEMBERS' | 'COMPANY_MEMBERS',
  {
    active: number;
    noToken: number;
    noConsent: number;
  }
> = {
  ALL: { active: ALL_ACTIVE_USERS, noToken: ALL_NO_TOKEN_USERS, noConsent: 655 },
  GENERAL_MEMBERS: { active: 1404, noToken: 372, noConsent: 600 },
  // 기업 회원은 동의 항목이 없어 광고성이면 모두 미동의로 센다(백엔드 응답 설명). 화면이 막으므로 쓰이지 않는다.
  COMPANY_MEMBERS: { active: 128, noToken: 38, noConsent: 128 },
};

/** 희망 직무 한 개를 고른 활성 일반 회원 수. 직군 전체는 그 직군 직무 수만큼 곱한다. */
const MEMBERS_PER_JOB_ROLE = 23;

/**
 * 렛츠커리어 희망 직군·직무. 백엔드 `LetsCareerWishJobCatalog.rolesByField` 를 옮겼다(오공고 웹
 * `apps/web/src/features/sign-up/lib/careerOptions.ts` 도 같은 목록이다).
 */
const ROLES_BY_FIELD: Record<string, string[]> = {
  '경영/인사': [
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
  마케팅: [
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
  영업: ['기업 영업', '기술 영업', '해외영업', '솔루션 컨설턴트', '세일즈', '제약 영업'],
  기획: [
    '서비스 기획',
    'PM/PO',
    '비즈니스 분석가',
    '사업개발/기획',
    '전략 기획',
    '해외 사업개발/기획',
    '상품 기획/MD',
  ],
  디자인: [
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
  개발: [
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
  엔지니어링: ['기계', '전자', '전기', '로봇', '설비', '공정'],
};

const JOB_ROLE_OPTIONS: AdminNotificationJobRoleOptionResponse[] = Object.entries(
  ROLES_BY_FIELD,
).map(([jobField, jobRoles]) => ({ jobField, allRolesOption: `${jobField} 직무 전체`, jobRoles }));

/** 직군 전체를 그 직군의 직무로 펼친다. 목록에 없는 값은 빠진다(백엔드 `expand`). */
function expandJobRoles(labels: readonly string[]): Set<string> {
  const roles = new Set<string>();
  for (const label of labels) {
    const field = JOB_ROLE_OPTIONS.find((option) => option.allRolesOption === label);
    for (const role of field
      ? field.jobRoles
      : JOB_ROLE_OPTIONS.some((o) => o.jobRoles.includes(label))
        ? [label]
        : []) {
      roles.add(role);
    }
  }
  return roles;
}

const isSelectableJobRole = (label: unknown) =>
  typeof label === 'string' &&
  JOB_ROLE_OPTIONS.some(
    (option) => option.allRolesOption === label || option.jobRoles.includes(label),
  );

/** 업로드한 알림 이미지. `imageId` 가 여기 없으면 발송을 400 으로 거절한다. */
const uploadedImages = new Map<string, string>();

/** 시드 묶음의 이미지. 네트워크 없이 보이게 SVG 데이터 주소로 둔다. */
const SEED_IMAGE_ID = 'c1d4b7e2-3a5f-4e8d-9b6c-2f1a0e7d5c34';
const SEED_IMAGE_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#2f6bff"/><text x="40" y="180" font-size="48" fill="#ffffff" font-family="sans-serif">채용 박람회</text></svg>',
)}`;
uploadedImages.set(SEED_IMAGE_ID, SEED_IMAGE_URL);

/** 목 관리자 계정의 회원 ID. */
const ADMIN_USER_ID = 1;

const at = (msAgo: number) => localDateTime(new Date(Date.now() - msAgo));

interface StoredBatch {
  result: AdminNotificationBatchResultResponse;
  /** 이 횟수만큼 조회될 때까지 `completed=false` 로 답한다. */
  pollsBeforeDone: number;
  polls: number;
}

const batches = new Map<string, StoredBatch>();

/**
 * 결과 상세를 처음 만든다. 처리 중 상태라 적재한 작업이 모두 대기다. 끝났을 때의 집계는 `finish` 가 채운다.
 */
function storeBatch(
  base: Omit<
    AdminNotificationBatchResultResponse,
    | 'sentCount'
    | 'failedCount'
    | 'unknownCount'
    | 'pendingCount'
    | 'expiredCount'
    | 'completed'
    | 'failureReasons'
  >,
  pollsBeforeDone: number,
) {
  batches.set(base.batchId, {
    result: {
      ...base,
      sentCount: 0,
      failedCount: 0,
      unknownCount: 0,
      pendingCount: base.enqueuedCount,
      expiredCount: 0,
      completed: false,
      failureReasons: [],
    },
    pollsBeforeDone,
    polls: 0,
  });
}

/** 처리 중 화면: 반은 접수됐고 반은 대기다. */
function inProgress(
  result: AdminNotificationBatchResultResponse,
): AdminNotificationBatchResultResponse {
  const sent = Math.floor(result.enqueuedCount / 2);
  return {
    ...result,
    sentCount: sent,
    pendingCount: result.enqueuedCount - sent,
    completed: false,
  };
}

/**
 * 처리 끝 화면. 개별 발송은 작업이 셋 이상이면 한 건을 `UNREGISTERED` 실패, 다섯 이상이면 한 건을 미확정으로
 * 둔다 — 실패 사유 표가 비지 않게. 토픽 발송은 한 건이라 접수 성공이다.
 */
function finished(
  result: AdminNotificationBatchResultResponse,
): AdminNotificationBatchResultResponse {
  const failed = result.deliveryTargetType === 'DIRECT' && result.enqueuedCount >= 3 ? 1 : 0;
  const unknown = result.deliveryTargetType === 'DIRECT' && result.enqueuedCount >= 5 ? 1 : 0;
  return {
    ...result,
    sentCount: result.enqueuedCount - failed - unknown,
    failedCount: failed,
    unknownCount: unknown,
    pendingCount: 0,
    expiredCount: 0,
    completed: true,
    failureReasons: [
      ...(failed ? [{ status: 'FAILED' as const, resultCode: 'UNREGISTERED', count: failed }] : []),
      ...(unknown
        ? [{ status: 'UNKNOWN' as const, resultCode: 'STALE_PROCESSING_TIMEOUT', count: unknown }]
        : []),
    ],
  };
}

/** 최근 발송 작업 표의 링크가 갈 곳. 처리 중인 개별 발송 하나와 끝난 전체 공지 하나다. */
const SEED_DIRECT_BATCH_ID = '2467bb25-5a40-4a80-a452-c2ccf99aef25';
const SEED_TOPIC_BATCH_ID = '8f3c1a90-7d2e-4b61-9c0a-5e8f2b7d4a13';

storeBatch(
  {
    batchId: SEED_DIRECT_BATCH_ID,
    requestedByUserId: ADMIN_USER_ID,
    createdAt: at(12 * MINUTE_MS),
    targetType: 'USER_IDS',
    title: '11월 채용 박람회 일정 안내',
    body: '11월 둘째 주에 열리는 채용 박람회 일정과 사전 등록 방법을 정리했어요. 사전 등록하면 현장 대기 없이 입장할 수 있어요.',
    targetUserCount: 5,
    recipientUserCount: 3,
    enqueuedCount: 4,
    skippedNoTokenUserCount: 1,
    noTokenUserCount: 1,
    skippedInactiveUserCount: 1,
    advertisement: false,
    noMarketingConsentUserCount: 0,
    deliveryTargetType: 'DIRECT',
    dispatchExpiresAt: at(12 * MINUTE_MS - DAY_MS),
    resultsAvailableUntil: at(12 * MINUTE_MS - 30 * DAY_MS),
  },
  2,
);

storeBatch(
  {
    batchId: SEED_TOPIC_BATCH_ID,
    requestedByUserId: ADMIN_USER_ID,
    createdAt: at(3 * HOUR_MS),
    targetType: 'ALL',
    title: '오공고 서비스 점검 안내',
    body: '10월 28일 새벽 2시부터 4시까지 서비스 점검이 있어요. 점검 중에는 공고 검색과 알림함을 쓸 수 없어요.',
    targetUserCount: ALL_ACTIVE_USERS,
    recipientUserCount: ALL_ACTIVE_USERS - ALL_NO_TOKEN_USERS,
    enqueuedCount: 1,
    skippedNoTokenUserCount: ALL_NO_TOKEN_USERS,
    noTokenUserCount: ALL_NO_TOKEN_USERS,
    skippedInactiveUserCount: 0,
    advertisement: false,
    noMarketingConsentUserCount: 0,
    deliveryTargetType: 'TOPIC',
    dispatchExpiresAt: at(3 * HOUR_MS - DAY_MS),
    resultsAvailableUntil: at(3 * HOUR_MS - 30 * DAY_MS),
  },
  0,
);

/**
 * 통계 표가 대상·발송 방식마다 줄이 생기도록 둔 지난 묶음. 모두 처리가 끝났다. 일반 회원은 광고성(DIRECT)과
 * 토픽(TOPIC) 두 줄이 된다. 희망 직무 묶음은 맞는 회원이 없어 읽음률 분모가 0 이다 — 서버가 `readRate=null` 을
 * 주는 경우다.
 */
const SEED_PAST_BATCHES: (Parameters<typeof storeBatch>[0] & { daysAgo: number })[] = [
  {
    daysAgo: 2,
    batchId: '5b0e9d21-6c47-4f3a-8e12-7d9a4c6b2f80',
    requestedByUserId: ADMIN_USER_ID,
    createdAt: '',
    targetType: 'GENERAL_MEMBERS',
    title: '(광고) 채용 박람회 사전 등록',
    body: '채용 박람회 사전 등록이 열렸어요. 참가 기업과 일정을 확인해 보세요.',
    targetUserCount: 299,
    recipientUserCount: 140,
    enqueuedCount: 186,
    skippedNoTokenUserCount: 39,
    noTokenUserCount: 39,
    skippedInactiveUserCount: 0,
    advertisement: true,
    noMarketingConsentUserCount: 120,
    deliveryTargetType: 'DIRECT',
    imageId: SEED_IMAGE_ID,
    imageUrl: SEED_IMAGE_URL,
    dispatchExpiresAt: '',
    resultsAvailableUntil: '',
  },
  {
    daysAgo: 5,
    batchId: '9e7a3c15-2d84-4b6f-a1c9-0f5e8d3b7a26',
    requestedByUserId: ADMIN_USER_ID,
    createdAt: '',
    targetType: 'GENERAL_MEMBERS',
    title: '이번 주 새로 올라온 공고를 확인해 보세요',
    body: '관심 직무의 새 공고가 120건 올라왔어요.',
    targetUserCount: 1404,
    recipientUserCount: 1032,
    enqueuedCount: 1,
    skippedNoTokenUserCount: 372,
    noTokenUserCount: 372,
    skippedInactiveUserCount: 0,
    advertisement: false,
    noMarketingConsentUserCount: 0,
    deliveryTargetType: 'TOPIC',
    dispatchExpiresAt: '',
    resultsAvailableUntil: '',
  },
  {
    daysAgo: 9,
    batchId: '3f6c8a42-9b17-4d5e-b0a3-6e2d1c9f8b57',
    requestedByUserId: ADMIN_USER_ID,
    createdAt: '',
    targetType: 'COMPANY_MEMBERS',
    title: '기업 회원 공고 등록 화면이 바뀌었어요',
    body: '공고 등록 단계가 셋으로 줄었어요. 바뀐 화면을 확인해 보세요.',
    targetUserCount: 128,
    recipientUserCount: 90,
    enqueuedCount: 1,
    skippedNoTokenUserCount: 38,
    noTokenUserCount: 38,
    skippedInactiveUserCount: 0,
    advertisement: false,
    noMarketingConsentUserCount: 0,
    deliveryTargetType: 'TOPIC',
    dispatchExpiresAt: '',
    resultsAvailableUntil: '',
  },
  {
    daysAgo: 20,
    batchId: '7a2d5e98-4c31-4f6b-9d80-1b3e6a5c2f49',
    requestedByUserId: ADMIN_USER_ID,
    createdAt: '',
    targetType: 'JOB_ROLES',
    title: '(광고) 엔지니어링 직무 부트캠프 모집',
    body: '설비·공정 직무 부트캠프가 모집 중이에요.',
    targetUserCount: 0,
    recipientUserCount: 0,
    enqueuedCount: 0,
    skippedNoTokenUserCount: 0,
    noTokenUserCount: 0,
    skippedInactiveUserCount: 0,
    advertisement: true,
    noMarketingConsentUserCount: 0,
    deliveryTargetType: 'DIRECT',
    targetJobRoles: ['설비', '공정'],
    dispatchExpiresAt: '',
    resultsAvailableUntil: '',
  },
];

for (const { daysAgo, ...base } of SEED_PAST_BATCHES) {
  const createdMsAgo = daysAgo * DAY_MS;
  storeBatch(
    {
      ...base,
      createdAt: at(createdMsAgo),
      dispatchExpiresAt: at(createdMsAgo - DAY_MS),
      resultsAvailableUntil: at(createdMsAgo - 30 * DAY_MS),
    },
    0,
  );
}

function badRequest(field: string, reason: string) {
  const body: ErrorResponse = { status: 400, code: 'BAD_REQUEST', message: `[${field}] ${reason}` };
  return HttpResponse.json(body, { status: 400 });
}

/** 백엔드가 쓰는 Bean Validation 한국어 기본 문구. */
const NOT_BLANK = '공백일 수 없습니다';
const sizeMessage = (max: number) => `크기가 0에서 ${max} 사이여야 합니다`;

/** 백엔드 `validateData` 와 같다. 스킴이 http·https 이고 host 가 있어야 한다. */
function isHttpUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') {
    return false;
  }
  try {
    const url = new URL(raw);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '';
  } catch {
    return false;
  }
}

/** 요청 본문은 생성 타입을 믿지 않고 읽는다. 화면이 잘못 보낸 것을 잡는 것이 목의 일이다. */
interface RawCreateBody {
  targetType?: unknown;
  userIds?: unknown;
  jobRoles?: unknown;
  title?: unknown;
  body?: unknown;
  data?: unknown;
  advertisement?: unknown;
  imageId?: unknown;
}

const TARGET_TYPES: readonly TargetType[] = [
  'USER_IDS',
  'ALL',
  'GENERAL_MEMBERS',
  'COMPANY_MEMBERS',
  'JOB_ROLES',
];
const isTargetType = (value: unknown): value is TargetType =>
  TARGET_TYPES.includes(value as TargetType);

type CreatedCounts = Omit<
  AdminNotificationBatchCreatedResponse,
  'batchId' | 'imageId' | 'imageUrl'
>;

/**
 * 활성 회원 `active` 명 가운데 동의하지 않은 `noConsent` 명을 빼고 기기마다 보낼 때의 집계. 남은 회원 넷 중 하나는
 * 토큰이 없고, 셋 중 하나는 기기가 둘이다.
 */
function directCounts(active: number, noConsent: number, advertisement: boolean): CreatedCounts {
  const consented = active - noConsent;
  const noToken = Math.floor(consented / 4);
  const recipients = consented - noToken;
  return {
    deliveryTargetType: 'DIRECT',
    targetUserCount: active,
    recipientUserCount: recipients,
    noTokenUserCount: noToken,
    skippedNoTokenUserCount: noToken,
    skippedInactiveUserCount: 0,
    enqueuedCount: recipients + Math.floor(recipients / 3),
    advertisement,
    noMarketingConsentUserCount: noConsent,
  };
}

const createBatchHandler = http.post('*/api/v1/admin/notification-batches', async ({ request }) => {
  const body = (await request.json()) as RawCreateBody;
  const title = typeof body.title === 'string' ? body.title : '';
  const text = typeof body.body === 'string' ? body.body : '';

  // 요청 본문 검증(Bean Validation)이 서비스 검사보다 먼저다.
  if (!isTargetType(body.targetType)) {
    return badRequest(
      'targetType',
      '발송 대상은 USER_IDS, ALL, GENERAL_MEMBERS, COMPANY_MEMBERS, JOB_ROLES 중 하나여야 합니다.',
    );
  }
  if (typeof body.advertisement !== 'boolean') {
    return badRequest('advertisement', '광고성 여부(true 또는 false)를 보내야 합니다.');
  }
  if (!title.trim()) {
    return badRequest('title', NOT_BLANK);
  }
  if (title.length > 100) {
    return badRequest('title', sizeMessage(100));
  }
  if (!text.trim()) {
    return badRequest('body', NOT_BLANK);
  }
  if (text.length > 1000) {
    return badRequest('body', sizeMessage(1000));
  }
  if (Array.isArray(body.jobRoles) && body.jobRoles.length > 100) {
    return badRequest('jobRoles', sizeMessage(100));
  }

  const targetType = body.targetType;
  const advertisement = body.advertisement;

  // 서비스 `validateTargets` 순서. 다른 대상에 키가 있으면 빈 배열이어도 거절한다 — 화면이 키를 빼는지 드러난다.
  if (targetType !== 'JOB_ROLES' && 'jobRoles' in body) {
    return badRequest('jobRoles', '희망 직무 발송에서만 jobRoles를 보냅니다.');
  }
  if (advertisement && targetType === 'COMPANY_MEMBERS') {
    return badRequest(
      'advertisement',
      '기업 회원은 마케팅 수신 동의 항목이 없어 광고성 발송 대상이 아닙니다.',
    );
  }
  if (targetType !== 'USER_IDS' && 'userIds' in body) {
    return badRequest(
      'userIds',
      targetType === 'JOB_ROLES'
        ? '희망 직무 발송에서는 userIds를 보내지 않습니다.'
        : '전체·회원 종류 발송에서는 userIds를 보내지 않습니다.',
    );
  }
  const jobRoles = Array.isArray(body.jobRoles) ? body.jobRoles : [];
  if (
    targetType === 'JOB_ROLES' &&
    (jobRoles.length === 0 || !jobRoles.every(isSelectableJobRole))
  ) {
    return badRequest(
      'jobRoles',
      '렛츠커리어 희망 직무 선택지를 1개 이상 100개 이하로 지정해야 합니다.',
    );
  }
  const userIds = Array.isArray(body.userIds) ? body.userIds : [];
  if (
    targetType === 'USER_IDS' &&
    (userIds.length === 0 ||
      userIds.length > 1000 ||
      userIds.some((id) => !Number.isInteger(id) || (id as number) <= 0))
  ) {
    return badRequest('userIds', '양수 회원 ID를 1개 이상 1000개 이하로 지정해야 합니다.');
  }

  const data = (body.data ?? {}) as Record<string, unknown>;
  if (!isHttpUrl(data.url)) {
    return badRequest('data.url', '이동할 http 또는 https URL이 필요합니다.');
  }

  const imageId = typeof body.imageId === 'string' ? body.imageId : undefined;
  const imageUrl = imageId ? uploadedImages.get(imageId) : undefined;
  if (imageId && !imageUrl) {
    const unavailable: ErrorResponse = {
      status: 400,
      code: 'IMAGE_ASSET_NOT_AVAILABLE',
      message: '사용할 수 없는 이미지입니다.',
    };
    return HttpResponse.json(unavailable, { status: 400 });
  }

  const ids = [...new Set(userIds as number[])];
  if (ids.includes(MISSING_USER_ID)) {
    const notFound: ErrorResponse = {
      status: 404,
      code: 'USER_NOT_FOUND',
      message: '사용자를 찾을 수 없습니다.',
    };
    return HttpResponse.json(notFound, { status: 404 });
  }

  let counts: CreatedCounts;
  if (targetType === 'USER_IDS') {
    const active = ids.filter((id) => id % 10 !== 0);
    const consented = advertisement ? active.filter((id) => id % 4 !== 0) : active;
    const withToken = consented.filter((id) => id % 3 !== 0);
    counts = {
      deliveryTargetType: 'DIRECT',
      targetUserCount: ids.length,
      recipientUserCount: withToken.length,
      noTokenUserCount: consented.length - withToken.length,
      skippedNoTokenUserCount: consented.length - withToken.length,
      skippedInactiveUserCount: ids.length - active.length,
      enqueuedCount: withToken.reduce((sum, id) => sum + (id % 2 === 0 ? 2 : 1), 0),
      advertisement,
      noMarketingConsentUserCount: active.length - consented.length,
    };
  } else if (targetType === 'JOB_ROLES') {
    const active = Math.min(
      expandJobRoles(jobRoles as string[]).size * MEMBERS_PER_JOB_ROLE,
      AUDIENCE.GENERAL_MEMBERS.active,
    );
    counts = directCounts(active, advertisement ? Math.floor(active * 0.4) : 0, advertisement);
  } else if (advertisement) {
    const audience = AUDIENCE[targetType];
    counts = directCounts(audience.active, audience.noConsent, true);
  } else {
    const audience = AUDIENCE[targetType];
    counts = {
      deliveryTargetType: 'TOPIC',
      targetUserCount: audience.active,
      recipientUserCount: audience.active - audience.noToken,
      noTokenUserCount: audience.noToken,
      skippedNoTokenUserCount: audience.noToken,
      skippedInactiveUserCount: 0,
      enqueuedCount: 1,
      advertisement: false,
      noMarketingConsentUserCount: 0,
    };
  }

  const created: AdminNotificationBatchCreatedResponse = {
    batchId: crypto.randomUUID(),
    ...counts,
    ...(imageId ? { imageId, imageUrl } : {}),
  };
  const now = Date.now();

  storeBatch(
    {
      ...created,
      requestedByUserId: ADMIN_USER_ID,
      createdAt: localDateTime(new Date(now)),
      targetType,
      title,
      body: text,
      ...(targetType === 'JOB_ROLES' ? { targetJobRoles: [...new Set(jobRoles as string[])] } : {}),
      dispatchExpiresAt: localDateTime(new Date(now + DAY_MS)),
      resultsAvailableUntil: localDateTime(new Date(now + 30 * DAY_MS)),
    },
    2,
  );

  const response: SuccessResponseAdminNotificationBatchCreatedResponse = {
    status: 201,
    message: 'CREATED',
    data: created,
  };
  return HttpResponse.json(response, { status: 201 });
});

const jobRoleOptionsHandler = http.get(
  '*/api/v1/admin/notification-batches/job-role-options',
  () => {
    const response: SuccessResponseListAdminNotificationJobRoleOptionResponse =
      ok(JOB_ROLE_OPTIONS);
    return HttpResponse.json(response);
  },
);

/** `2026-11-05T00:00:00` 처럼 시간대 없는 값을 브라우저 시간으로 읽는다(`localDateTime` 의 반대). */
function parseLocalDateTime(raw: string | null): Date | null | undefined {
  if (raw === null) {
    return null;
  }
  const date = new Date(raw);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(raw) && !Number.isNaN(date.getTime())
    ? date
    : undefined;
}

/**
 * 기간별 통계. 백엔드 `AdminNotificationBatchStatisticsService` 의 기간 검사를 같은 문구로 흉내 내고, 메모리의
 * 묶음을 `createdAt` 으로 걸러 대상 × 발송 방식마다 더한다. 결과 상세 조회 횟수는 세지 않는다.
 *
 * 읽음 분모는 DIRECT 면 알림함 행 수(비활성·미동의를 뺀 대상), TOPIC 이면 대상 회원 수다. 읽은 회원은 그 37% 로
 * 둔다.
 */
const statisticsHandler = http.get(
  '*/api/v1/admin/notification-batches/statistics',
  ({ request }) => {
    const query = new URL(request.url).searchParams;
    const from = parseLocalDateTime(query.get('from'));
    const to = parseLocalDateTime(query.get('to'));
    if (from === undefined || to === undefined) {
      return badRequest('from, to', '날짜 형식이 올바르지 않습니다.');
    }
    if ((from === null) !== (to === null)) {
      return badRequest('from, to', '시작과 종료 시각을 함께 보내야 합니다.');
    }
    const now = Date.now();
    const start = from ?? new Date(now - 30 * DAY_MS);
    const end = to ?? new Date(now);
    if (start.getTime() >= end.getTime()) {
      return badRequest('from, to', '시작 시각은 종료 시각보다 빨라야 합니다.');
    }
    if (
      start.getTime() < now - 30 * DAY_MS ||
      end.getTime() > now + DAY_MS ||
      end.getTime() - start.getTime() > 30 * DAY_MS
    ) {
      return badRequest('from, to', '최근 30일 이내에서 최대 30일 범위를 조회할 수 있습니다.');
    }
    const targetType = query.get('targetType');

    const groups = new Map<string, AdminNotificationBatchStatisticGroupResponse>();
    for (const stored of batches.values()) {
      const createdAt = new Date(stored.result.createdAt).getTime();
      if (createdAt < start.getTime() || createdAt >= end.getTime()) {
        continue;
      }
      if (targetType && stored.result.targetType !== targetType) {
        continue;
      }
      const result =
        stored.polls >= stored.pollsBeforeDone
          ? finished(stored.result)
          : inProgress(stored.result);
      const key = `${result.targetType}:${result.deliveryTargetType}`;
      const group = groups.get(key) ?? {
        targetType: result.targetType,
        deliveryTargetType: result.deliveryTargetType,
        batchCount: 0,
        targetUserCount: 0,
        recipientUserCount: 0,
        enqueuedCount: 0,
        sentCount: 0,
        failedCount: 0,
        unknownCount: 0,
        pendingCount: 0,
        expiredCount: 0,
        readUserCount: 0,
        readEligibleUserCount: 0,
      };
      const eligible =
        result.deliveryTargetType === 'TOPIC'
          ? result.targetUserCount
          : result.targetUserCount -
            result.skippedInactiveUserCount -
            result.noMarketingConsentUserCount;
      group.batchCount += 1;
      group.targetUserCount += result.targetUserCount;
      group.recipientUserCount += result.recipientUserCount;
      group.enqueuedCount += result.enqueuedCount;
      group.sentCount += result.sentCount;
      group.failedCount += result.failedCount;
      group.unknownCount += result.unknownCount;
      group.pendingCount += result.pendingCount;
      group.expiredCount += result.expiredCount;
      group.readEligibleUserCount += eligible;
      group.readUserCount += Math.floor(eligible * 0.37);
      groups.set(key, group);
    }

    const response: SuccessResponseAdminNotificationBatchStatisticsResponse = ok({
      from: localDateTime(start),
      to: localDateTime(end),
      groups: [...groups.values()]
        .map((group) => ({
          ...group,
          // 분모가 0 이면 백엔드는 `null` 을 보낸다. 생성 타입은 선택 필드(`undefined`)로만 적어 맞춰 넣는다.
          readRate:
            group.readEligibleUserCount === 0
              ? (null as unknown as undefined)
              : group.readUserCount / group.readEligibleUserCount,
        }))
        .sort(
          (a, b) =>
            a.targetType.localeCompare(b.targetType) ||
            a.deliveryTargetType.localeCompare(b.deliveryTargetType),
        ),
    });
    return HttpResponse.json(response);
  },
);

/**
 * 알림 이미지 업로드(사용자 API `POST /api/v1/images?usage=NOTIFICATION`, multipart `file`). 어드민 워커에는 사용자
 * 핸들러가 없어 여기 둔다. 백엔드처럼 JPEG·PNG 만 받는다. 파일은 저장하지 않고 데이터 주소로 돌려줘 미리보기에
 * 고른 그림이 그대로 보인다.
 */
const notificationImageHandler = http.post('*/api/v1/images', async ({ request }) => {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    const error: ErrorResponse = {
      status: 400,
      code: 'IMAGE_FILE_REQUIRED',
      message: '이미지 파일이 필요합니다.',
    };
    return HttpResponse.json(error, { status: 400 });
  }
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    const error: ErrorResponse = {
      status: 400,
      code: 'IMAGE_FILE_TYPE_NOT_SUPPORTED',
      message: 'JPG·PNG만 됩니다.',
    };
    return HttpResponse.json(error, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const id = crypto.randomUUID();
  const url = `data:${file.type};base64,${btoa(binary)}`;
  uploadedImages.set(id, url);
  const response: SuccessResponseImageUploadResponse = {
    status: 201,
    message: 'Created',
    data: { id, url, mimeType: file.type, size: file.size },
  };
  return HttpResponse.json(response, { status: 201 });
});

const getBatchHandler = http.get('*/api/v1/admin/notification-batches/:batchId', ({ params }) => {
  const stored = batches.get(String(params.batchId));
  if (!stored) {
    const notFound: ErrorResponse = {
      status: 404,
      code: 'NOTIFICATION_BATCH_NOT_FOUND',
      message: '발송 묶음을 찾을 수 없거나 결과 조회 기간이 지났습니다.',
    };
    return HttpResponse.json(notFound, { status: 404 });
  }

  stored.polls += 1;
  const result =
    stored.polls > stored.pollsBeforeDone ? finished(stored.result) : inProgress(stored.result);
  const response: SuccessResponseAdminNotificationBatchResultResponse = ok(result);
  return HttpResponse.json(response);
});

/**
 * 최근 발송 작업. 서버처럼 `updatedAt` 내림차순이다.
 *
 * 세 채널, 다섯 상태, `STALE_PROCESSING_TIMEOUT` 미확정 한 건, 시드 묶음을 가리키는 행이 있다. 알림톡·이메일은
 * 회원 알림함과 무관해 `userNotificationId` 가 없고, 토픽 작업은 수신 회원도 없다.
 */
type RecentItem = AdminNotificationRecentResultItemResponse;

const job = (
  minutesAgo: number,
  fields: Omit<RecentItem, 'scheduledAt' | 'createdAt' | 'updatedAt'>,
): RecentItem => ({
  scheduledAt: at(minutesAgo * MINUTE_MS + 30 * 1000),
  createdAt: at(minutesAgo * MINUTE_MS + 30 * 1000),
  updatedAt: at(minutesAgo * MINUTE_MS),
  ...fields,
});

/**
 * 서버가 나중에 늘릴 분류를 흉내 낸다. 생성 타입에는 없는 값이라 타입을 넘어서 넣는다 — 화면이 원래 값을
 * 그대로 보이는지 보려고.
 */
const FUTURE_CATEGORY =
  'NEW_PROVIDER_POLICY' as AdminNotificationRecentResultItemResponseResultCategory;

const RECENT_RESULTS: RecentItem[] = [
  job(12, {
    notificationId: 5821,
    channel: 'FCM',
    status: 'PROCESSING',
    recipientType: 'DIRECT',
    templateCode: 'admin_notification',
    recipientUserId: 1,
    userNotificationId: 9310,
    batchId: SEED_DIRECT_BATCH_ID,
    processingStartedAt: at(12 * MINUTE_MS),
    attemptCount: 1,
  }),
  job(12, {
    notificationId: 5820,
    channel: 'FCM',
    status: 'PENDING',
    recipientType: 'DIRECT',
    templateCode: 'admin_notification',
    recipientUserId: 2,
    userNotificationId: 9309,
    batchId: SEED_DIRECT_BATCH_ID,
    attemptCount: 0,
  }),
  job(12, {
    notificationId: 5819,
    channel: 'FCM',
    status: 'SENT',
    recipientType: 'DIRECT',
    templateCode: 'admin_notification',
    recipientUserId: 5,
    userNotificationId: 9308,
    batchId: SEED_DIRECT_BATCH_ID,
    sentAt: at(12 * MINUTE_MS),
    providerMessageId: 'projects/ogonggo/messages/0:1761454920123',
    attemptCount: 1,
  }),
  job(180, {
    notificationId: 5814,
    channel: 'FCM',
    status: 'SENT',
    recipientType: 'TOPIC',
    templateCode: 'admin_notification',
    batchId: SEED_TOPIC_BATCH_ID,
    sentAt: at(180 * MINUTE_MS),
    providerMessageId: 'projects/ogonggo/messages/8251772034417',
    attemptCount: 1,
  }),
  job(254, {
    notificationId: 5810,
    channel: 'FCM',
    status: 'UNKNOWN',
    recipientType: 'DIRECT',
    templateCode: 'CONCERN_COMMENT',
    recipientUserId: 7,
    userNotificationId: 9288,
    processingStartedAt: at(262 * MINUTE_MS),
    resultCode: 'STALE_PROCESSING_TIMEOUT',
    resultCategory: 'PROCESSING_TIMEOUT',
    resultDetail:
      'provider 처리 시작 후 8분 안에 결과를 저장하지 못했습니다. 접수 여부를 알 수 없어 자동 재발송하지 않습니다.',
    attemptCount: 1,
  }),
  job(287, {
    notificationId: 5807,
    channel: 'FCM',
    status: 'FAILED',
    recipientType: 'DIRECT',
    templateCode: 'SIDE_STUDY_COMMENT_REPLY',
    recipientUserId: 8,
    userNotificationId: 9281,
    processingStartedAt: at(287 * MINUTE_MS),
    resultCode: 'UNREGISTERED',
    resultCategory: 'CLIENT_ERROR',
    resultDetail: 'Requested entity was not found. token=[REDACTED]',
    attemptCount: 1,
  }),
  job(301, {
    notificationId: 5803,
    channel: 'FCM',
    status: 'UNKNOWN',
    recipientType: 'DIRECT',
    templateCode: 'CONCERN_COMMENT',
    recipientUserId: 9,
    userNotificationId: 9270,
    processingStartedAt: at(301 * MINUTE_MS),
    resultCode: 'POLICY_HOLD',
    resultCategory: FUTURE_CATEGORY,
    resultDetail: '발송사가 새 정책으로 보류했습니다.',
    attemptCount: 1,
  }),
  job(310, {
    notificationId: 5799,
    channel: 'KAKAO',
    status: 'SENT',
    recipientType: 'DIRECT',
    templateCode: 'sign_up_confirm',
    recipientUserId: 1,
    sentAt: at(310 * MINUTE_MS),
    providerMessageId: 'kakao-20261026-0952-4410',
    resultCode: '0000',
    attemptCount: 1,
  }),
  job(322, {
    notificationId: 5795,
    channel: 'EMAIL',
    status: 'SENT',
    recipientType: 'DIRECT',
    templateCode: 'sign_up_welcome',
    recipientUserId: 2,
    sentAt: at(322 * MINUTE_MS),
    providerMessageId: '0100019a1f2c-ses-4409',
    attemptCount: 1,
  }),
  job(340, {
    notificationId: 5790,
    channel: 'KAKAO',
    status: 'FAILED',
    recipientType: 'DIRECT',
    templateCode: 'sign_up_confirm',
    recipientUserId: 5,
    resultCode: '3018',
    resultCategory: 'PROVIDER_REJECTED',
    resultDetail: '메시지를 전송할 수 없음(카카오톡 미사용자). 발송사 응답 코드 3018.',
    attemptCount: 1,
  }),
  job(355, {
    notificationId: 5786,
    channel: 'EMAIL',
    status: 'PENDING',
    recipientType: 'DIRECT',
    templateCode: 'sign_up_welcome',
    recipientUserId: 7,
    attemptCount: 0,
  }),
  // 광고 신청 한 건이 이메일(신청 확인)과 슬랙(영업 채널)을 함께 쌓는다(BE LC-3584). 둘 다 받는 회원이 없다.
  job(25, {
    notificationId: 5824,
    channel: 'EMAIL',
    status: 'SENT',
    recipientType: 'DIRECT',
    templateCode: 'advertisement_contract_received',
    sentAt: at(25 * MINUTE_MS),
    providerMessageId: '0100019a3b7d-ses-5120',
    attemptCount: 1,
  }),
  job(25, {
    notificationId: 5823,
    channel: 'SLACK',
    status: 'SENT',
    recipientType: 'DIRECT',
    templateCode: 'advertisement_contract_submitted',
    sentAt: at(25 * MINUTE_MS),
    attemptCount: 1,
  }),
  job(410, {
    notificationId: 5770,
    channel: 'SLACK',
    status: 'FAILED',
    recipientType: 'DIRECT',
    templateCode: 'advertisement_contract_submitted',
    resultCode: 'HTTP_500',
    resultCategory: 'PROVIDER_UNAVAILABLE',
    resultDetail: 'Slack 웹훅이 500 을 돌려주었습니다.',
    attemptCount: 3,
  }),
];

const recentResultsHandler = http.get('*/api/v1/admin/notifications/recent-results', () => {
  const response: SuccessResponseAdminNotificationRecentResultsResponse = ok({
    items: RECENT_RESULTS,
  });
  return HttpResponse.json(response);
});

export const notificationHandlers: HttpHandler[] = [
  createBatchHandler,
  // `getBatchHandler` 의 `:batchId` 가 `statistics`·`job-role-options` 를 삼키므로 그보다 앞에 둔다.
  jobRoleOptionsHandler,
  statisticsHandler,
  getBatchHandler,
  recentResultsHandler,
  notificationImageHandler,
];
