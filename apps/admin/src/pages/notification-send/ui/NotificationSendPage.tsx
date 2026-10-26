import { useState } from 'react';
import type { AdminNotificationBatchCreatedResponse } from '@ogonggo/api/src/admin';
import { PageHeader } from '@/widgets/page-header';
import { EMPTY_SEND_FORM } from '../lib/sendForm';
import { SendForm } from './SendForm';
import { SentSummary } from './SentSummary';

/**
 * 푸시 알림 전송(PRD `prd-notifications.md` "발송 화면"). 지난 발송은 `전송 내역` 메뉴가 따로 보인다
 * (`pages/notification-history`).
 *
 * 보낸 뒤 요약은 다음 발송 전까지 남는다 — 폼이 비워져도 방금 보낸 묶음의 결과 상세로 갈 길이 있어야 한다.
 */
export function NotificationSendPage() {
  const [values, setValues] = useState(EMPTY_SEND_FORM);
  const [created, setCreated] = useState<AdminNotificationBatchCreatedResponse | null>(null);

  return (
    <>
      <PageHeader title="푸시 알림 전송" />
      <p className="-mt-4 pb-6 text-sm text-gray-500">
        보낸 알림은 회원 알림함에 저장되고, 알림을 켠 기기에는 푸시로도 갑니다.
      </p>
      <div className="max-w-2xl">
        <SendForm values={values} onChange={setValues} onSent={setCreated} />
      </div>
      {created ? <SentSummary created={created} /> : null}
    </>
  );
}
