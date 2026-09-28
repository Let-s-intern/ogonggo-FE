'use client';

import { useEffect, useRef } from 'react';
import { takeListSource } from '@/entities/job/model/listSource';
import { track, type DataLayerParams } from '@/shared/analytics/dataLayer';

/**
 * 상세 진입마다 `job_detail_view` 를 한 번 보낸다. 공고 데이터는 서버가 이미 받아 그렸으므로
 * 이것이 마운트된 때가 "데이터 로드 완료" 다.
 *
 * 같은 공고로 다시 그려지는 것(리렌더, 개발 모드의 effect 두 번 실행)에는 보내지 않는다 —
 * 마지막으로 보낸 공고 id 를 ref 에 둔다. 다른 공고로 넘어가면 다시 보낸다.
 */
export function JobDetailViewTracker({
  jobId,
  jobInfo,
}: {
  jobId: number;
  jobInfo: DataLayerParams;
}) {
  const sentFor = useRef<number | null>(null);

  useEffect(() => {
    if (sentFor.current === jobId) {
      return;
    }
    sentFor.current = jobId;
    track('job_detail_view', { ...jobInfo, list_source: takeListSource(jobId) });
  }, [jobId, jobInfo]);

  return null;
}
