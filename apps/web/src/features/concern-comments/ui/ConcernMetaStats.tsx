'use client';

import { ConcernStats } from '@/entities/concern/ui/ConcernStats';
import { useCommentCount } from '../model/useConcernCommentActions';

export interface ConcernMetaStatsProps {
  concernId: number;
  viewCount: number;
  /** 서버 렌더가 받은 `commentCount`. */
  commentCount: number;
}

/**
 * 본문 카드의 조회수·답변 수. 답변 수는 답변 영역에서 쓰고 지우면 같이 바뀐다(`useCommentCount`).
 * 조회수는 서버가 읽은 값 그대로다.
 */
export function ConcernMetaStats({ concernId, viewCount, commentCount }: ConcernMetaStatsProps) {
  const count = useCommentCount(concernId, commentCount);
  return <ConcernStats viewCount={viewCount} commentCount={count} />;
}
