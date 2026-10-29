import { Button, Input, Select, type SelectOption, cn } from '@ogonggo/ui';
import {
  type AdInquiryListFilters,
  todayInSeoul,
} from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import {
  AD_INQUIRY_CAMPAIGN_OPTIONS,
  AD_INQUIRY_COMPANY_NAME_SOURCE_OPTIONS,
  AD_INQUIRY_INFLOW_CHANNEL_OPTIONS,
  AD_INQUIRY_MEMBER_TYPE_OPTIONS,
  AD_INQUIRY_STATUS_OPTIONS,
  AD_INQUIRY_TYPE_OPTIONS,
} from '@/shared/config/labels';
import { ListToolbar } from '@/widgets/list-toolbar';

/** 값을 고른 필터는 파란 배경, 고르지 않았으면 회색 이름이다(사이트 전체 드롭다운 규칙). */
const SELECTED = 'border-transparent bg-blue-50 font-semibold text-blue-500';
const UNSELECTED = 'text-gray-500';

/**
 * 탭 안의 처리 상태 선택지. `광고 문의` 탭은 반려를 뺀 셋만 고른다(반려는 `반려한 문의` 탭이다). `반려한 문의`
 * 탭은 상태가 하나뿐이라 처리 상태 필터를 숨긴다.
 */
const ACTIVE_STATUS_OPTIONS = AD_INQUIRY_STATUS_OPTIONS.filter(
  (option) => option.value !== 'REJECTED',
);

type FilterKey = Exclude<keyof AdInquiryListFilters, 'page' | 'tab'>;

const SELECTS: { key: FilterKey; label: string; options: SelectOption[] }[] = [
  { key: 'inquiryType', label: '문의 유형', options: AD_INQUIRY_TYPE_OPTIONS },
  { key: 'campaignCode', label: '캠페인', options: AD_INQUIRY_CAMPAIGN_OPTIONS },
  { key: 'status', label: '처리 상태', options: ACTIVE_STATUS_OPTIONS },
  { key: 'memberType', label: '회원 구분', options: AD_INQUIRY_MEMBER_TYPE_OPTIONS },
  { key: 'inflowChannel', label: '유입 경로', options: AD_INQUIRY_INFLOW_CHANNEL_OPTIONS },
  {
    key: 'companyNameSource',
    label: '회사명 입력 방식',
    options: AD_INQUIRY_COMPANY_NAME_SOURCE_OPTIONS,
  },
];

/**
 * 목록 위 필터 한 줄과 현재 조건의 건수. 값은 URL 쿼리에 있어 새로고침·북마크에도 남는다.
 *
 * 기간은 접수일(한국 시간) 양끝 포함이다. `오늘` 은 시작·끝을 오늘로 한 번에 건다 — 메뉴 숫자와 같은 조건이다.
 */
export function AdInquiryFilters({
  filters,
  total,
  onChange,
}: {
  filters: AdInquiryListFilters;
  /** 현재 조건의 건수. 아직 모르면 `undefined`. */
  total: number | undefined;
  onChange: (changes: Partial<Record<FilterKey, string>>) => void;
}) {
  const today = todayInSeoul();
  const isToday = filters.createdFrom === today && filters.createdTo === today;

  return (
    <ListToolbar>
      {SELECTS.filter(({ key }) => !(key === 'status' && filters.tab === 'rejected')).map(
        ({ key, label, options }) => (
          <Select
            key={key}
            aria-label={label}
            options={options}
            value={filters[key]}
            onChange={(event) => onChange({ [key]: event.target.value })}
            className={filters[key] ? SELECTED : UNSELECTED}
          />
        ),
      )}
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          aria-label="접수일 시작"
          value={filters.createdFrom}
          max={filters.createdTo || undefined}
          onChange={(event) => onChange({ createdFrom: event.target.value })}
          className={cn('h-9 w-36 px-2 text-sm', filters.createdFrom ? SELECTED : UNSELECTED)}
        />
        <span className="text-sm text-gray-400">~</span>
        <Input
          type="date"
          aria-label="접수일 끝"
          value={filters.createdTo}
          min={filters.createdFrom || undefined}
          onChange={(event) => onChange({ createdTo: event.target.value })}
          className={cn('h-9 w-36 px-2 text-sm', filters.createdTo ? SELECTED : UNSELECTED)}
        />
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={isToday}
          onClick={() =>
            onChange(
              isToday
                ? { createdFrom: '', createdTo: '' }
                : { createdFrom: today, createdTo: today },
            )
          }
          className={cn(isToday && SELECTED)}
        >
          오늘
        </Button>
      </div>
      <p className="ml-auto text-sm text-gray-500">
        현재 조건 <b className="font-semibold text-gray-900">{total ?? '-'}</b>건
      </p>
    </ListToolbar>
  );
}
