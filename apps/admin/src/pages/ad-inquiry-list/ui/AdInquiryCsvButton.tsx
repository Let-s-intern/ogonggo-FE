import { useState } from 'react';
import { Button } from '@ogonggo/ui';
import {
  type AdInquiryListFilters,
  fetchAllAdInquiries,
  todayInSeoul,
} from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import { toAdInquiryCsv } from '../model/csv';

/** 현재 필터 기준 전체를 CSV 로 내려받는다. 보고 있는 페이지만이 아니다. */
export function AdInquiryCsvButton({ filters }: { filters: AdInquiryListFilters }) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const download = async () => {
    setState('loading');
    try {
      const rows = await fetchAllAdInquiries(filters);
      const blob = new Blob([toAdInquiryCsv(rows)], { type: 'text/csv;charset=utf-8' });
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `${filters.view === 'rejected' ? 'rejected-' : ''}ad-inquiries-${todayInSeoul()}.csv`;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {state === 'error' ? (
        <span role="alert" className="text-sm text-error">
          내려받지 못했습니다
        </span>
      ) : null}
      <Button
        size="sm"
        variant="secondary"
        disabled={state === 'loading'}
        onClick={() => void download()}
      >
        {state === 'loading' ? '만드는 중' : 'CSV 내보내기'}
      </Button>
    </div>
  );
}
