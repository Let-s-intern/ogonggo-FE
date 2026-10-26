import type { CreateNotificationBatchRequest } from '@ogonggo/api/src/admin';

/**
 * 발송 폼의 화면 검증과 요청 본문(PRD `prd-notifications.md` "발송 화면").
 *
 * 규칙은 서버(`CreateNotificationBatchRequest` 의 Bean Validation 과 `AdminNotificationBatchService`)와 같게
 * 맞춘다. 화면에서 먼저 막는 것은 운영자가 400 문구를 읽고 고치는 왕복을 줄이려는 것이고, 서버 메시지는 그와
 * 별개로 받은 그대로 보인다. payload 바이트 한도는 서버가 시스템 식별자를 더해 재므로 여기서 계산하지 않는다.
 */

export type SendTarget = CreateNotificationBatchRequest['targetType'];

export interface SendFormValues {
  target: SendTarget;
  /** 회원 ID 입력 원문. 쉼표·공백·줄바꿈으로 나눈다. */
  userIds: string;
  title: string;
  body: string;
  url: string;
}

export type SendFormErrors = Partial<Record<keyof SendFormValues, string>>;

export const TITLE_MAX = 100;
export const BODY_MAX = 1000;
/** 원본 개수 한도. 서버는 중복을 지우기 전 개수로 잰다(`@Size(max = 1000)`). */
export const USER_IDS_MAX = 1000;

export const EMPTY_SEND_FORM: SendFormValues = {
  target: 'USER_IDS',
  userIds: '',
  title: '',
  body: '',
  url: '',
};

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

  if (values.target === 'USER_IDS') {
    const parsed = parseUserIds(values.userIds);
    if (parsed.count === 0) {
      errors.userIds = '회원 ID를 1개 이상 입력해 주세요.';
    } else if (parsed.invalid.length > 0) {
      const shown = parsed.invalid.slice(0, 5).join(', ');
      const more = parsed.invalid.length > 5 ? ` 외 ${parsed.invalid.length - 5}개` : '';
      errors.userIds = `회원 ID는 양의 정수만 입력할 수 있어요: ${shown}${more}`;
    } else if (parsed.count > USER_IDS_MAX) {
      errors.userIds = `한 번에 ${USER_IDS_MAX.toLocaleString('ko-KR')}개까지 입력할 수 있어요. 지금 ${parsed.count.toLocaleString('ko-KR')}개예요.`;
    }
  }

  const title = values.title.trim();
  if (!title) {
    errors.title = '제목을 입력해 주세요.';
  } else if (title.length > TITLE_MAX) {
    errors.title = `제목은 ${TITLE_MAX}자까지 쓸 수 있어요.`;
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
 * 요청 본문. `ALL` 이면 `userIds` 키를 아예 넣지 않는다 — 서버는 빈 배열도 400 으로 거절한다.
 * `data` 는 `url` 하나뿐이다(PRD "결정한 것" 7).
 */
export function toCreateRequest(values: SendFormValues): CreateNotificationBatchRequest {
  const common = {
    title: values.title.trim(),
    body: values.body.trim(),
    data: { url: values.url.trim() },
  };
  if (values.target === 'ALL') {
    return { targetType: 'ALL', ...common };
  }
  return { targetType: 'USER_IDS', userIds: parseUserIds(values.userIds).ids, ...common };
}
