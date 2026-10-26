import { useState } from 'react';
import { PageHeader } from '@/widgets/page-header';
import { EMPTY_SEND_FORM } from '../lib/sendForm';
import { SendForm } from './SendForm';

/**
 * 알림 발송. 위에 발송 폼, 아래에 최근 발송 작업 표(PRD `prd-notifications.md` "발송 화면").
 *
 * 폼 값은 여기서 든다. 폼 옆 미리보기가 같은 값을 그린다.
 */
export function NotificationSendPage() {
  const [values, setValues] = useState(EMPTY_SEND_FORM);

  return (
    <>
      <PageHeader title="알림 발송" />
      <p className="-mt-4 pb-6 text-sm text-gray-500">
        보낸 알림은 회원 알림함에 저장되고, 알림을 켠 기기에는 푸시로도 갑니다.
      </p>
      <SendForm values={values} onChange={setValues} />
    </>
  );
}
