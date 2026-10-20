import type { UpdateAdminJobRequest } from '@ogonggo/api/src/admin';
import { JOB_BODY_FIELDS, type JobEditorValues } from './formValues';

/** 문자열로 입력받는 공고 정보 칸. 제목·본문·체크박스를 뺀 나머지다. */
type InfoKey = Exclude<
  keyof JobEditorValues,
  'title' | 'fields' | 'closesWhenFilled' | 'autoCloseEnabled'
>;

/** 입력값을 요청 값으로. 빈 칸은 `undefined` 다. */
type Normalize = (value: string) => string | number | undefined;

const text: Normalize = (value) => value.trim() || undefined;
const number: Normalize = (value) => (value.trim() === '' ? undefined : Number(value));
// 날짜만 고르므로 시각을 붙인다. 마감일은 그날이 끝날 때까지 모집 중이어야 해서 23:59:59 다.
const startOfDay: Normalize = (value) => (value ? `${value}T00:00:00` : undefined);
const endOfDay: Normalize = (value) => (value ? `${value}T23:59:59` : undefined);

/**
 * 공고 정보 칸과 요청 모양. `clearable` 이 아닌 칸은 비울 수 없다(상세 응답 필수) — 검증이 빈 값을
 * 막으므로 여기까지 빈 값으로 오지 않는다. 순서는 모달의 칸 순서다.
 */
const INFO_FIELDS: { key: InfoKey; normalize: Normalize; clearable: boolean }[] = [
  { key: 'companyName', normalize: text, clearable: false },
  { key: 'parentCompanyName', normalize: text, clearable: true },
  { key: 'industry', normalize: text, clearable: true },
  { key: 'logoUrl', normalize: text, clearable: true },
  { key: 'coverImageUrl', normalize: text, clearable: true },
  { key: 'jobField', normalize: text, clearable: true },
  { key: 'jobRole', normalize: text, clearable: true },
  { key: 'employmentType', normalize: text, clearable: false },
  { key: 'experienceType', normalize: text, clearable: false },
  { key: 'experienceMinYears', normalize: number, clearable: true },
  { key: 'educationLevel', normalize: text, clearable: false },
  { key: 'region', normalize: text, clearable: true },
  { key: 'recruitmentType', normalize: text, clearable: false },
  { key: 'recruitmentStartAt', normalize: startOfDay, clearable: true },
  { key: 'recruitmentEndAt', normalize: endOfDay, clearable: true },
  { key: 'recruitmentHeadcount', normalize: number, clearable: true },
  { key: 'recruitmentNotice', normalize: text, clearable: true },
  { key: 'applicationMethod', normalize: text, clearable: true },
  { key: 'applyEmail', normalize: text, clearable: true },
  { key: 'inquiryEmail', normalize: text, clearable: true },
  { key: 'sourceUrl', normalize: text, clearable: true },
];

/**
 * 연 때의 값(`before`)과 지금 값(`after`)에서 `PATCH /admin/jobs/{jobId}` 본문을 만든다.
 *
 * 바뀐 칸만 싣는다. 안 바뀐 칸까지 보내면 그 사이 크롤러나 다른 운영자가 바꾼 값을 연 때의 값으로
 * 조용히 되돌린다. 바뀌었는데 비었으면 `clear` 에 담는다 — 서버는 `null` 과 보내지 않은 칸을
 * 똑같이 "그대로 둠" 으로 읽는다.
 *
 * 상시 채용으로 바꾸면 마감일은 싣지도 비우지도 않는다. 서버가 지우고, 상시 채용에 마감일을
 * 보내면 400 이다.
 *
 * 아무것도 바뀌지 않았으면 빈 객체다. 모달은 이때 저장 버튼을 잠근다.
 */
export function buildPatch(before: JobEditorValues, after: JobEditorValues): UpdateAdminJobRequest {
  const patch: Record<string, unknown> = {};
  const clear: string[] = [];

  const title = after.title.trim();
  if (title !== before.title.trim()) {
    patch.title = title;
  }

  for (const { key, normalize, clearable } of INFO_FIELDS) {
    if (key === 'recruitmentEndAt' && after.recruitmentType === 'ALWAYS_OPEN') {
      continue;
    }
    const next = normalize(after[key]);
    if (next === normalize(before[key])) {
      continue;
    }
    if (next !== undefined) {
      patch[key] = next;
    } else if (clearable) {
      clear.push(key);
    }
  }

  // 체크박스는 비우는 일이 없다. 바뀌면 참·거짓을 그대로 싣는다.
  for (const key of ['closesWhenFilled', 'autoCloseEnabled'] as const) {
    if (after[key] !== before[key]) {
      patch[key] = after[key];
    }
  }

  // 본문은 빈 문자열이 그 칸을 비우는 뜻이라 `clear` 를 쓰지 않는다.
  const fields = Object.fromEntries(
    JOB_BODY_FIELDS.filter((field) => after.fields[field] !== before.fields[field]).map((field) => [
      field,
      after.fields[field],
    ]),
  );
  if (Object.keys(fields).length > 0) {
    patch.fields = fields;
  }
  if (clear.length > 0) {
    patch.clear = clear;
  }

  return patch as UpdateAdminJobRequest;
}
