import { useState } from 'react';
import type { AdminNotificationBatchCreatedResponse } from '@ogonggo/api/src/admin';
import { PageHeader } from '@/widgets/page-header';
import { EMPTY_SEND_FORM } from '../lib/sendForm';
import { SendForm } from './SendForm';
import { SendPreview } from './SendPreview';
import { SentSummary } from './SentSummary';

/**
 * 알림 발송. 위에 발송 폼, 아래에 최근 발송 작업 표(PRD `prd-notifications.md` "발송 화면").
 *
 * 폼 값은 여기서 든다. 폼 옆 미리보기가 같은 값을 그린다. 보낸 뒤 요약은 다음 발송 전까지 남는다 — 폼이
 * 비워져도 방금 보낸 묶음의 결과 상세로 갈 길이 있어야 한다. 묶음 목록 API 가 없어 다른 길이 마땅치 않다.
 */
export function NotificationSendPage() {
  const [values, setValues] = useState(EMPTY_SEND_FORM);
  const [created, setCreated] = useState<AdminNotificationBatchCreatedResponse | null>(null);

  return (
    <>
      <PageHeader title="알림 발송" />
      <p className="-mt-4 pb-6 text-sm text-gray-500">
        보낸 알림은 회원 알림함에 저장되고, 알림을 켠 기기에는 푸시로도 갑니다.
      </p>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <SendForm values={values} onChange={setValues} onSent={setCreated} />
        </div>
        <div className="xl:w-[380px] xl:flex-none">
          <SendPreview values={values} />
        </div>
      </div>
      {created ? <SentSummary created={created} /> : null}
    </>
  );
}
