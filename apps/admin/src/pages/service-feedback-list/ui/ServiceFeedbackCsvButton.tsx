import { useState } from 'react';
import { Button } from '@ogonggo/ui';
import { todayInSeoul } from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import { fetchAllServiceFeedbacks } from '@/entities/service-feedback/api/useServiceFeedbacks';
import { toServiceFeedbackCsv } from '../model/csv';

/** 의견 전체를 CSV 로 내려받는다. 보고 있는 페이지만이 아니다. */
export function ServiceFeedbackCsvButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const download = async () => {
    setState('loading');
    try {
      const rows = await fetchAllServiceFeedbacks();
      const blob = new Blob([toServiceFeedbackCsv(rows)], { type: 'text/csv;charset=utf-8' });
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `service-feedbacks-${todayInSeoul()}.csv`;
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
