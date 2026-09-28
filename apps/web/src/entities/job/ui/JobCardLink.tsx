'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { track, type DataLayerParams } from '@/shared/analytics/dataLayer';
import { rememberListSource } from '../model/listSource';

export interface JobCardTracking {
  /** 카드가 놓인 목록. `main` | `calendar` | `similar` | `scrap` */
  listSource: string;
  /** 지금 페이지 목록 안의 순서, 1부터. 달력 주간 막대처럼 순서가 없는 자리는 `null` 이다. */
  listPosition: number | null;
  /** 목록 페이지 번호, 1부터. 페이지가 없는 목록은 1 이다. */
  pageNumber: number;
}

export type JobCardLinkProps = ComponentProps<typeof Link> & {
  jobId: number;
  /** `toJobInfo` 결과. 서버 카드에서 만들어 넘긴다. */
  jobInfo?: DataLayerParams;
  /** 없으면 보통 링크다. 스토리처럼 목록 밖에 놓인 카드가 그렇다. */
  tracking?: JobCardTracking;
};

/**
 * 공고 상세로 가는 카드 링크. 누르면 `job_card_click` 을 보내고, 상세 조회가 읽을 목록 출처를
 * 남긴다(`../model/listSource.ts`).
 *
 * 카드 안의 북마크 버튼은 이 링크의 형제라 눌러도 여기로 오지 않는다 — 명세가
 * `stopPropagation` 으로 막으라는 경우가 마크업에서 이미 막혀 있다.
 */
export function JobCardLink({ jobId, jobInfo, tracking, onClick, ...props }: JobCardLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (jobInfo && tracking) {
          track('job_card_click', {
            ...jobInfo,
            list_source: tracking.listSource,
            list_position: tracking.listPosition,
            page_number: tracking.pageNumber,
          });
          rememberListSource(jobId, tracking.listSource);
        }
        onClick?.(e);
      }}
    />
  );
}
