import { listPublicJobs } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';

/**
 * 게시 중인 전체 공고 수. 필터 없는 목록을 한 건만 받아 `pageInfo.totalElements` 를 읽는다 — 새 API 없이
 * 이미 있는 `/api/v1/jobs` 로 된다(`.claude/tasks/memos/결정-광고시스템-web-히어로-2026-11-03.md`).
 * 받지 못하면 0 이 아니라 `undefined` 다. 화면이 그때 옛 문구로 돌아간다.
 */
export async function fetchJobTotal(): Promise<number | undefined> {
  try {
    const response = (await listPublicJobs({
      size: 1,
    })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;
    return response.data?.pageInfo.totalElements;
  } catch {
    return undefined;
  }
}
