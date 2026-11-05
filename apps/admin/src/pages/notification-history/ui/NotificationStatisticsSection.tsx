import { useState } from 'react';
import { Button, Callout, DataTable, Input, cn, type DataTableColumn } from '@ogonggo/ui';
import type { AdminNotificationBatchStatisticGroupResponse } from '@ogonggo/api/src/admin';
import { useNotificationBatchStatistics } from '@/entities/notification-batch/api/useNotificationBatches';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { notificationDeliveryTypeLabel, notificationTargetTypeLabel } from '@/shared/config/labels';
import { formatCount, formatDateTime } from '@/shared/lib/format';
import {
  PERIOD_MAX_DAYS,
  isRecentPeriod,
  periodBounds,
  periodError,
  recentPeriod,
  toStatisticsParams,
  type StatisticsPeriod,
} from '../lib/statisticsPeriod';

type Group = AdminNotificationBatchStatisticGroupResponse;

/** 기본값이 아닌 기간은 파란 배경이다(사이트 전체 드롭다운 규칙). */
const SELECTED = 'border-transparent bg-blue-50 font-semibold text-blue-500';
const UNSELECTED = 'text-gray-500';

/** 분모가 0 이면 서버가 `null` 을 준다. 빈 칸 대신 낱말로 둔다. */
const readRateText = (rate: number | undefined | null) =>
  rate == null ? '없음' : `${(rate * 100).toFixed(1)}%`;

const columns: DataTableColumn<Group>[] = [
  {
    key: 'targetType',
    header: '대상',
    render: (row) => notificationTargetTypeLabel(row.targetType),
  },
  {
    key: 'deliveryTargetType',
    header: '발송 방식',
    render: (row) => notificationDeliveryTypeLabel(row.deliveryTargetType),
  },
  {
    key: 'batchCount',
    header: '발송 수',
    align: 'right',
    render: (row) => formatCount(row.batchCount),
  },
  {
    key: 'targetUserCount',
    header: '요청 대상',
    align: 'right',
    render: (row) => formatCount(row.targetUserCount),
  },
  {
    key: 'recipientUserCount',
    header: '푸시 수신 가능',
    align: 'right',
    render: (row) => formatCount(row.recipientUserCount),
  },
  {
    key: 'sentCount',
    header: '접수 성공',
    align: 'right',
    render: (row) => formatCount(row.sentCount),
  },
  {
    key: 'failedCount',
    header: '실패',
    align: 'right',
    render: (row) => formatCount(row.failedCount),
  },
  {
    key: 'unknownCount',
    header: '미확정',
    align: 'right',
    render: (row) => formatCount(row.unknownCount),
  },
  {
    key: 'pendingCount',
    header: '대기·처리 중',
    align: 'right',
    render: (row) => formatCount(row.pendingCount),
  },
  {
    key: 'expiredCount',
    header: '기한 초과',
    align: 'right',
    render: (row) => formatCount(row.expiredCount),
  },
  {
    key: 'read',
    header: '읽음/대상',
    align: 'right',
    render: (row) => `${formatCount(row.readUserCount)}/${formatCount(row.readEligibleUserCount)}`,
  },
  {
    key: 'readRate',
    header: '읽음률',
    align: 'right',
    render: (row) => readRateText(row.readRate),
  },
];

/**
 * 푸시 전송 내역 위의 기간별 발송·읽음 통계(사용자 결정). 관리자 발송 묶음만 센다 — 댓글 푸시는 들지 않는다.
 *
 * 기본은 오늘까지 최근 30일이다. 서버가 최근 30일 안의 30일 이하만 받아, 날짜 칸도 그 안에서만 고른다.
 */
export function NotificationStatisticsSection() {
  const [period, setPeriod] = useState<StatisticsPeriod>(recentPeriod);
  const invalid = periodError(period);
  const { data, isPending, isFetching, isError, error } = useNotificationBatchStatistics(
    invalid ? null : toStatisticsParams(period),
  );
  const { min, max } = periodBounds();
  const isRecent = isRecentPeriod(period);

  return (
    <section aria-label="발송 통계" className="pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <h2 className="text-base font-bold text-gray-900">발송 통계</h2>
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="통계 시작일"
            value={period.from}
            min={min}
            max={period.to || max}
            onChange={(event) => setPeriod({ ...period, from: event.target.value })}
            className={cn('h-9 w-36 px-2 text-sm', isRecent ? UNSELECTED : SELECTED)}
          />
          <span className="text-sm text-gray-400">~</span>
          <Input
            type="date"
            aria-label="통계 종료일"
            value={period.to}
            min={period.from || min}
            max={max}
            onChange={(event) => setPeriod({ ...period, to: event.target.value })}
            className={cn('h-9 w-36 px-2 text-sm', isRecent ? UNSELECTED : SELECTED)}
          />
          <Button
            size="sm"
            variant="secondary"
            aria-pressed={isRecent}
            onClick={() => setPeriod(recentPeriod())}
            className={cn(isRecent && SELECTED)}
          >
            최근 {PERIOD_MAX_DAYS}일
          </Button>
        </div>
      </div>

      {invalid ? (
        <Callout tone="error">{invalid}</Callout>
      ) : isError ? (
        <Callout tone="error">
          {serverErrorMessage(error) ?? '발송 통계를 불러오지 못했어요.'}
        </Callout>
      ) : (
        <>
          <DataTable
            className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
            columns={columns}
            rows={data?.groups ?? []}
            rowKey={(row) => `${row.targetType}:${row.deliveryTargetType}`}
            isLoading={isPending || isFetching}
            emptyMessage="이 기간에 보낸 알림이 없어요"
          />
          <ul className="list-disc pt-3 pl-5 text-xs text-gray-500">
            {data ? (
              <li>
                집계 기간 {formatDateTime(data.from)} ~ {formatDateTime(data.to)}. 발송 요청 시각
                기준이에요.
              </li>
            ) : null}
            <li>
              접수 성공은 FCM이 받은 발송 작업 수예요. 개별 발송은 기기별, 전체 공지는 토픽 요청 한
              건 단위라 회원 수와 다르고, 기기 도착이나 푸시 탭을 뜻하지 않아요.
            </li>
            <li>
              읽음은 발송마다 알림함에서 읽은 회원 수를 더한 값이에요. 같은 회원이 여러 발송을
              읽으면 각각 세요. 대상이 0명이면 읽음률은 없음이에요.
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
