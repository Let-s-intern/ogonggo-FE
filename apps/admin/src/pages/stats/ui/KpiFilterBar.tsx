import { type ReactNode } from 'react';
import { Input, Select } from '@ogonggo/ui';
import {
  CHANNEL_OPTIONS,
  EXPERIENCE_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  type KpiFilters,
  PERIOD_OPTIONS,
  RANGE_OPTIONS,
  type RangePreset,
  resolveDateRange,
} from '@/entities/kpi';

interface KpiFilterBarProps {
  filters: KpiFilters;
  onChange: (patch: Partial<KpiFilters>) => void;
}

const toOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

/**
 * 화면 맨 위 한 줄의 필터. 모든 차트에 함께 걸린다. 쿼리마다 받는 필터가 달라, 받지 않는 쿼리는 그
 * 필터를 바꿔도 그대로다(`@/entities/kpi` 의 `QUERY_PARAMETERS`).
 */
export function KpiFilterBar({ filters, onChange }: KpiFilterBarProps) {
  const range = resolveDateRange(filters);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <Labeled label="기간">
        <Select
          value={filters.range}
          options={RANGE_OPTIONS.map(({ value, label }) => ({ value, label }))}
          onChange={(event) => {
            const next = event.target.value as RangePreset;
            // 직접 입력으로 바꾸면 보고 있던 범위를 그대로 채워 둔다. 빈 칸에서 시작하면 차트가 모두 빈다.
            onChange(next === 'custom' ? { range: next, ...range } : { range: next });
          }}
        />
      </Labeled>
      {filters.range === 'custom' ? (
        <div className="flex items-end gap-2">
          <Labeled label="시작일">
            <Input
              type="date"
              value={filters.start}
              max={filters.end || undefined}
              onChange={(event) => onChange({ start: event.target.value })}
              className="h-9"
            />
          </Labeled>
          <span className="pb-2 text-sm text-gray-400">~</span>
          <Labeled label="종료일">
            <Input
              type="date"
              value={filters.end}
              min={filters.start || undefined}
              onChange={(event) => onChange({ end: event.target.value })}
              className="h-9"
            />
          </Labeled>
        </div>
      ) : (
        <p className="pb-2 text-sm text-gray-500 [font-variant-numeric:tabular-nums]">
          {range.start} ~ {range.end}
        </p>
      )}
      <Labeled label="기간 단위">
        <Select
          value={filters.period}
          options={toOptions(PERIOD_OPTIONS)}
          onChange={(event) => onChange({ period: event.target.value })}
        />
      </Labeled>
      <Labeled label="채널">
        <Select
          value={filters.channel}
          options={toOptions(CHANNEL_OPTIONS)}
          onChange={(event) => onChange({ channel: event.target.value })}
        />
      </Labeled>
      <Labeled label="직군(공고)">
        <Select
          value={filters.jobCategory}
          options={toOptions(JOB_CATEGORY_OPTIONS)}
          onChange={(event) => onChange({ jobCategory: event.target.value })}
        />
      </Labeled>
      <Labeled label="경력(공고)">
        <Select
          value={filters.experience}
          options={toOptions(EXPERIENCE_OPTIONS)}
          onChange={(event) => onChange({ experience: event.target.value })}
        />
      </Labeled>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
    </label>
  );
}
