import type { CreateNotificationBatchRequest } from '@ogonggo/api/src/admin';

/**
 * 발송 폼의 화면 검증과 요청 본문(PRD `prd-notifications.md` "발송 화면").
 *
 * 규칙은 서버(`CreateNotificationBatchRequest` 의 Bean Validation 과 `AdminNotificationBatchService`)와 같게
 * 맞춘다. 화면에서 먼저 막는 것은 운영자가 400 문구를 읽고 고치는 왕복을 줄이려는 것이고, 서버 메시지는 그와
 * 별개로 받은 그대로 보인다. payload 바이트 한도는 서버가 시스템 식별자를 더해 재므로 여기서 계산하지 않는다.
 */

export type SendTarget = CreateNotificationBatchRequest['targetType'];

/** 회원 검색에서 고른 회원. 칩에 보일 이름만 함께 든다. */
export interface SelectedMember {
  userId: number;
  /** 닉네임, 없으면 이름. 둘 다 없으면 비어 있다. */
  label: string;
}

export interface SendFormValues {
  target: SendTarget;
  /** 회원 검색에서 고른 회원(`MemberPickerModal`). */
  selectedMembers: SelectedMember[];
  /** 회원 ID 직접 입력 원문. 쉼표·공백·줄바꿈으로 나눈다. 검색으로 고른 회원과 합쳐 보낸다. */
  userIds: string;
  /** 희망 직무 발송에서 고른 선택지. 직군 전체(`allRolesOption`)와 개별 직무 이름이 섞인다. */
  jobRoles: string[];
  /** 광고성 발송. 켜면 제목 앞에 `(광고) ` 를 붙여 보낸다(`sendTitle`). 기업 회원 대상에서는 켤 수 없다. */
  advertisement: boolean;
  title: string;
  body: string;
  url: string;
  /** 올린 알림 이미지. 없으면 이미지 없이 보낸다. */
  image: NotificationImage | null;
}

/** 사용자 API 이미지 업로드가 돌려준 식별자와 표시용 주소. */
export interface NotificationImage {
  id: string;
  url: string;
}

export type SendFormErrors = Partial<Record<keyof SendFormValues, string>>;

export const TITLE_MAX = 100;
export const BODY_MAX = 1000;
/** 원본 개수 한도. 서버는 중복을 지우기 전 개수로 잰다(`@Size(max = 1000)`). */
export const USER_IDS_MAX = 1000;
/** 희망 직무 선택지 한도(`jobRoles` 의 `@Size(max = 100)`). */
export const JOB_ROLES_MAX = 100;

export const EMPTY_SEND_FORM: SendFormValues = {
  target: 'USER_IDS',
  selectedMembers: [],
  userIds: '',
  jobRoles: [],
  advertisement: false,
  title: '',
  body: '',
  url: '',
  image: null,
};

/** 광고성 알림 제목 앞에 붙이는 표기(사용자 결정). 뒤의 공백까지 제목 글자 수에 든다. */
export const AD_TITLE_PREFIX = '(광고) ';

/** 광고성을 켤 수 없는 대상. 기업 회원은 마케팅 수신 동의 항목이 없다(서버도 400 으로 거절한다). */
export const canAdvertise = (target: SendTarget) => target !== 'COMPANY_MEMBERS';

/**
 * 제목 앞에 붙일 것. 광고성이고 운영자가 이미 `(광고)` 로 시작하게 썼으면 다시 붙이지 않는다 — `(광고) (광고) …`
 * 가 되지 않게.
 */
export function titlePrefix(values: SendFormValues): string {
  return values.advertisement && !values.title.trim().startsWith('(광고)') ? AD_TITLE_PREFIX : '';
}

/** 실제로 보낼 제목. 100자 한도는 이 값으로 잰다. */
export function sendTitle(values: SendFormValues): string {
  return `${titlePrefix(values)}${values.title.trim()}`;
}

/**
 * 한국 시간 밤 9시부터 아침 8시 전까지. 이 시간의 광고성 발송은 확인 창에서 한 번 더 경고한다(사용자 결정). 막지는
 * 않는다.
 */
export function isAdQuietHours(now: Date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now),
  );
  return hour >= 21 || hour < 8;
}

export interface ParsedUserIds {
  /** 나눈 조각 수. 중복과 잘못된 값을 포함한다. */
  count: number;
  /** 양의 정수로 읽히지 않는 조각. 입력 순서대로다. */
  invalid: string[];
  /** 양의 정수로 읽힌 값. 중복을 지우지 않는다. */
  ids: number[];
  /** 중복을 지운 회원 수. */
  uniqueCount: number;
}

/** `0`, 음수(`-3`), 소수, 글자, 안전 범위를 넘는 수는 잘못된 값이다. 앞의 0(`007`)은 7 로 읽는다. */
export function parseUserIds(raw: string): ParsedUserIds {
  const tokens = raw.split(/[\s,]+/).filter(Boolean);
  const invalid: string[] = [];
  const ids: number[] = [];
  for (const token of tokens) {
    const value = Number(token);
    if (/^\d+$/.test(token) && Number.isSafeInteger(value) && value > 0) {
      ids.push(value);
    } else {
      invalid.push(token);
    }
  }
  return { count: tokens.length, invalid, ids, uniqueCount: new Set(ids).size };
}

/**
 * 보낼 회원 ID. 검색으로 고른 회원 다음에 직접 입력한 ID 를 붙인다. 중복은 지우지 않는다 — 서버가 지우고, 1,000개
 * 한도는 지우기 전 개수로 잰다. 직접 입력의 잘못된 조각은 빼고 센다(그 경우 검증이 먼저 막는다).
 */
export function targetUserIds(values: SendFormValues): number[] {
  return [
    ...values.selectedMembers.map((member) => member.userId),
    ...parseUserIds(values.userIds).ids,
  ];
}

/** 서버 `validateData` 와 같다. 스킴이 http·https 이고 host 가 있어야 한다. */
export function isHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '';
  } catch {
    return false;
  }
}

/** 칸별 첫 오류. 비어 있으면 보낼 수 있다. */
export function validateSendForm(values: SendFormValues): SendFormErrors {
  const errors: SendFormErrors = {};

  if (values.target === 'JOB_ROLES') {
    if (values.jobRoles.length === 0) {
      errors.jobRoles = '희망 직무를 1개 이상 골라 주세요.';
    } else if (values.jobRoles.length > JOB_ROLES_MAX) {
      errors.jobRoles = `희망 직무는 ${JOB_ROLES_MAX}개까지 고를 수 있어요. 지금 ${values.jobRoles.length}개예요.`;
    }
  }

  if (values.target === 'USER_IDS') {
    const parsed = parseUserIds(values.userIds);
    const total = values.selectedMembers.length + parsed.count;
    if (total === 0) {
      errors.userIds = '회원을 검색해 고르거나 회원 ID를 1개 이상 입력해 주세요.';
    } else if (parsed.invalid.length > 0) {
      const shown = parsed.invalid.slice(0, 5).join(', ');
      const more = parsed.invalid.length > 5 ? ` 외 ${parsed.invalid.length - 5}개` : '';
      errors.userIds = `회원 ID는 양의 정수만 입력할 수 있어요: ${shown}${more}`;
    } else if (total > USER_IDS_MAX) {
      errors.userIds = `한 번에 ${USER_IDS_MAX.toLocaleString('ko-KR')}명까지 보낼 수 있어요. 지금 ${total.toLocaleString('ko-KR')}명이에요.`;
    }
  }

  if (values.advertisement && !canAdvertise(values.target)) {
    errors.advertisement = '기업 회원에게는 광고성 알림을 보낼 수 없어요.';
  }

  if (!values.title.trim()) {
    errors.title = '제목을 입력해 주세요.';
  } else if (sendTitle(values).length > TITLE_MAX) {
    errors.title = titlePrefix(values)
      ? `제목은 앞에 붙는 ${AD_TITLE_PREFIX.trim()} 까지 ${TITLE_MAX}자까지 쓸 수 있어요.`
      : `제목은 ${TITLE_MAX}자까지 쓸 수 있어요.`;
  }

  const body = values.body.trim();
  if (!body) {
    errors.body = '본문을 입력해 주세요.';
  } else if (body.length > BODY_MAX) {
    errors.body = `본문은 ${BODY_MAX.toLocaleString('ko-KR')}자까지 쓸 수 있어요.`;
  }

  const url = values.url.trim();
  if (!url) {
    errors.url = '이동 URL을 입력해 주세요.';
  } else if (!isHttpUrl(url)) {
    errors.url = 'http:// 또는 https:// 로 시작하는 전체 주소를 입력해 주세요.';
  }

  return errors;
}

/**
 * 요청 본문. `userIds` 는 `USER_IDS` 에서만, `jobRoles` 는 `JOB_ROLES` 에서만 넣는다 — 서버는 다른 대상에 그 키가
 * 있으면 빈 배열이어도 400 으로 거절한다. `data` 는 `url` 하나뿐이다(PRD "결정한 것" 7).
 */
export function toCreateRequest(values: SendFormValues): CreateNotificationBatchRequest {
  const common = {
    title: sendTitle(values),
    body: values.body.trim(),
    data: { url: values.url.trim() },
    advertisement: values.advertisement,
    ...(values.image ? { imageId: values.image.id } : {}),
  };
  if (values.target === 'USER_IDS') {
    return { targetType: 'USER_IDS', userIds: targetUserIds(values), ...common };
  }
  if (values.target === 'JOB_ROLES') {
    return { targetType: 'JOB_ROLES', jobRoles: values.jobRoles, ...common };
  }
  return { targetType: values.target, ...common };
}
