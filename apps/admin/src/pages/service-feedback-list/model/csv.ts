import type { AdminServiceFeedbackResponse } from '@ogonggo/api/src/admin';
import { formatDateTime } from '@/shared/lib/format';

/** 엑셀이 수식으로 읽는 첫 글자. 의견은 누구나 쓰므로 앞에 `'` 를 붙여 글자로 열리게 한다. */
const FORMULA_PREFIX = /^[=+@\t\r]/;

/** 모든 칸을 큰따옴표로 감싼다. 쉼표·줄바꿈·따옴표가 든 의견이 칸을 넘지 않는다. */
function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? '' : String(value);
  const safe = FORMULA_PREFIX.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** 모달에 보이는 값 전부를 열로 둔다. */
const COLUMNS: [string, (row: AdminServiceFeedbackResponse) => string | number | undefined][] = [
  ['ID', (row) => row.id],
  ['등록 일시', (row) => formatDateTime(row.registeredAt)],
  ['회원 ID', (row) => row.userId ?? '비로그인'],
  ['닉네임', (row) => row.userNickname],
  ['이름', (row) => row.userName],
  ['이메일', (row) => row.userEmail],
  ['만족한 점', (row) => row.satisfaction],
  ['아쉬운 점', (row) => row.improvement],
];

/** CSV 본문. 엑셀이 한글을 UTF-8 로 읽도록 BOM 을 앞에 붙인다(`ad-inquiry-list` 와 같은 방식). */
export function toServiceFeedbackCsv(rows: AdminServiceFeedbackResponse[]): string {
  const header = COLUMNS.map(([name]) => csvCell(name)).join(',');
  const body = rows.map((row) => COLUMNS.map(([, read]) => csvCell(read(row))).join(','));
  return `﻿${[header, ...body].join('\r\n')}`;
}
