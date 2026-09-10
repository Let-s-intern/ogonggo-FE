/**
 * 반려 기록.
 *
 * 검수에서 반려한 건과 그때 보낸 사유를 담는다. 반려 보관 화면이 이걸 읽고, 사유 수정도
 * 여기를 고친다.
 *
 * 콘텐츠 쪽 `reviewStatus` 와 따로 두는 이유는 사유가 콘텐츠의 속성이 아니기 때문이다. 사유는
 * "운영자가 올린 사람에게 보낸 말"이고, 같은 글이 고쳐져 다시 올라오면 새 판정과 새 사유가
 * 붙는다. 백엔드에서도 별도 테이블이 될 자리다.
 *
 * 이 배열은 목이 실제로 고친다 — 반려하면 늘고, 사유를 고치면 바뀌고, 검수 상태를 되돌리면
 * 빠진다. 새로고침하면 아래 초기값으로 돌아간다.
 */

import { ADMIN_BOOTCAMP_FIXTURES, ADMIN_JOB_FIXTURES } from './admin-content';

export type RejectionTargetType = 'JOB' | 'BOOTCAMP';

export interface RejectionRecord {
  type: RejectionTargetType;
  id: number;
  title: string;
  companyName: string;
  /** 올린 사람에게 보낸 말. 비어 있을 수 없다. */
  reason: string;
  /** ISO 8601. */
  rejectedAt: string;
  /** ISO 8601. 사유를 고친 적이 없으면 없다. */
  reasonUpdatedAt?: string;
}

/**
 * 픽스처가 이미 반려 상태로 만들어 둔 건들에 그럴듯한 사유를 붙인다.
 *
 * 반려 보관 화면이 처음부터 비어 있으면 목록·수정이 도는지 확인할 수 없다. 사유는 id 로 골라
 * 새로고침해도 같은 글에 같은 사유가 붙는다.
 */
const SEED_REASONS = [
  '급여 조건이 비어 있습니다. 채우고 다시 등록해 주세요.',
  '모집 마감일이 지난 공고입니다. 기간을 수정해 주세요.',
  '본문에 회사 소개만 있고 담당 업무가 없습니다.',
  '동일한 공고가 이미 등록되어 있습니다.',
  '외부 링크가 열리지 않습니다. 주소를 확인해 주세요.',
];

const seedReasonFor = (id: number): string =>
  SEED_REASONS[id % SEED_REASONS.length] ?? SEED_REASONS[0]!;

export const REJECTIONS: RejectionRecord[] = [
  ...ADMIN_JOB_FIXTURES.filter((job) => job.reviewStatus === 'REJECTED').map((job) => ({
    type: 'JOB' as const,
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    reason: seedReasonFor(job.id),
    rejectedAt: job.registeredAt,
  })),
  ...ADMIN_BOOTCAMP_FIXTURES.filter((bootcamp) => bootcamp.reviewStatus === 'REJECTED').map(
    (bootcamp) => ({
      type: 'BOOTCAMP' as const,
      id: bootcamp.id,
      title: bootcamp.title,
      companyName: bootcamp.companyName,
      reason: seedReasonFor(bootcamp.id),
      rejectedAt: bootcamp.registeredAt,
    }),
  ),
];

const keyOf = (type: RejectionTargetType, id: number) => `${type}:${id}`;

export const findRejection = (type: RejectionTargetType, id: number): RejectionRecord | undefined =>
  REJECTIONS.find((entry) => keyOf(entry.type, entry.id) === keyOf(type, id));

/** 반려를 기록한다. 같은 대상을 다시 반려하면 사유만 갈아 끼운다. */
export function recordRejection(
  record: Omit<RejectionRecord, 'rejectedAt' | 'reasonUpdatedAt'>,
): void {
  const existing = findRejection(record.type, record.id);
  if (existing) {
    existing.reason = record.reason;
    existing.reasonUpdatedAt = new Date().toISOString();
    return;
  }
  REJECTIONS.push({ ...record, rejectedAt: new Date().toISOString() });
}

/** 반려를 취소한다. 허용으로 바꾸거나 검수 상태를 되돌릴 때. */
export function clearRejection(type: RejectionTargetType, id: number): void {
  const position = REJECTIONS.findIndex((entry) => entry.type === type && entry.id === id);
  if (position >= 0) {
    REJECTIONS.splice(position, 1);
  }
}
