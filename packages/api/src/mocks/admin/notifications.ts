import { http, HttpResponse, type HttpHandler } from 'msw';
import { localDateTime } from '../fixtures/admin-notice';
import type {
  AdminNotificationBatchCreatedResponse,
  AdminNotificationBatchResultResponse,
  AdminNotificationRecentResultItemResponse,
  AdminNotificationRecentResultItemResponseResultCategory,
  ErrorResponse,
  SuccessResponseAdminNotificationBatchCreatedResponse,
  SuccessResponseAdminNotificationBatchResultResponse,
  SuccessResponseAdminNotificationRecentResultsResponse,
} from '../../generated/admin/models';
import { ok } from './paging';

/**
 * 관리자 알림 발송 핸들러(PRD `prd-notifications.md` "목 · 관리자"). 발송·결과 상세·최근 발송 작업 셋.
 *
 * 발송은 백엔드 `AdminNotificationBatchService` 의 검사를 같은 순서·같은 문구로 흉내 낸다. 400 문구는
 * `AdminApiExceptionHandler` 처럼 `[필드] 사유` 모양이다. `userIds` 에 `999999` 가 있으면 없는 회원으로
 * 보고 404 `USER_NOT_FOUND` 로 전체를 거절한다. `ALL` 은 토픽 전환이 켜진 운영과 같이 TOPIC 으로 답한다.
 *
 * 결과 상세는 묶음마다 조회 횟수를 센다. 처음 두 번은 `completed=false` 이고 세 번째부터 `true` 다 —
 * 화면의 10초 폴링이 멈추는지 보려고. 묶음은 메모리에 있어 워커가 다시 뜨면 시드 둘만 남는다.
 *
 * 회원은 ID 로 상태를 정한다. 10의 배수는 비활성, 3의 배수는 토큰 없음, 짝수는 기기 둘(토큰 둘)이다.
 * 토큰은 검사하지 않는다(다른 어드민 목과 같다).
 */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** 없는 회원으로 다루는 ID. 404 문구를 목 모드에서 보려고 둔다. */
const MISSING_USER_ID = 999999;

/** 전체 회원 발송의 대상 수. 실제로는 요청 시점의 활성 회원 수다. */
const ALL_ACTIVE_USERS = 1532;
const ALL_NO_TOKEN_USERS = 410;

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
    deliveryTargetType: 'TOPIC',
    dispatchExpiresAt: at(3 * HOUR_MS - DAY_MS),
    resultsAvailableUntil: at(3 * HOUR_MS - 30 * DAY_MS),
  },
  0,
);

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
  title?: unknown;
  body?: unknown;
  data?: unknown;
}

const createBatchHandler = http.post('*/api/v1/admin/notification-batches', async ({ request }) => {
  const body = (await request.json()) as RawCreateBody;
  const title = typeof body.title === 'string' ? body.title : '';
  const text = typeof body.body === 'string' ? body.body : '';

  if (body.targetType !== 'USER_IDS' && body.targetType !== 'ALL') {
    return badRequest('targetType', '발송 대상은 USER_IDS 또는 ALL 이어야 합니다.');
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

  // 백엔드는 `ALL` 에 `userIds` 키가 있으면 빈 배열이어도 거절한다. 화면이 키를 빼고 보내는지 여기서 드러난다.
  if (body.targetType === 'ALL' && 'userIds' in body) {
    return badRequest('userIds', '전체 발송에서는 userIds를 보내지 않습니다.');
  }
  const userIds = Array.isArray(body.userIds) ? body.userIds : [];
  if (
    body.targetType === 'USER_IDS' &&
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

  const ids = [...new Set(userIds as number[])];
  if (ids.includes(MISSING_USER_ID)) {
    const notFound: ErrorResponse = {
      status: 404,
      code: 'USER_NOT_FOUND',
      message: '사용자를 찾을 수 없습니다.',
    };
    return HttpResponse.json(notFound, { status: 404 });
  }

  const batchId = crypto.randomUUID();
  const now = Date.now();
  let created: AdminNotificationBatchCreatedResponse;

  if (body.targetType === 'ALL') {
    created = {
      batchId,
      deliveryTargetType: 'TOPIC',
      targetUserCount: ALL_ACTIVE_USERS,
      recipientUserCount: ALL_ACTIVE_USERS - ALL_NO_TOKEN_USERS,
      noTokenUserCount: ALL_NO_TOKEN_USERS,
      skippedNoTokenUserCount: ALL_NO_TOKEN_USERS,
      skippedInactiveUserCount: 0,
      enqueuedCount: 1,
    };
  } else {
    const active = ids.filter((id) => id % 10 !== 0);
    const withToken = active.filter((id) => id % 3 !== 0);
    created = {
      batchId,
      deliveryTargetType: 'DIRECT',
      targetUserCount: ids.length,
      recipientUserCount: withToken.length,
      noTokenUserCount: active.length - withToken.length,
      skippedNoTokenUserCount: active.length - withToken.length,
      skippedInactiveUserCount: ids.length - active.length,
      enqueuedCount: withToken.reduce((sum, id) => sum + (id % 2 === 0 ? 2 : 1), 0),
    };
  }

  storeBatch(
    {
      ...created,
      requestedByUserId: ADMIN_USER_ID,
      createdAt: localDateTime(new Date(now)),
      targetType: body.targetType,
      title,
      body: text,
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
    recipientUserId: 1024,
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
    recipientUserId: 1031,
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
    recipientUserId: 1188,
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
    recipientUserId: 2045,
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
    recipientUserId: 3102,
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
    recipientUserId: 1290,
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
    recipientUserId: 4410,
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
    recipientUserId: 4409,
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
    recipientUserId: 4402,
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
    recipientUserId: 4398,
    attemptCount: 0,
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
  getBatchHandler,
  recentResultsHandler,
];
