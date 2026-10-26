import { PageHeader } from '@/widgets/page-header';

/** 발송 결과 상세(PRD `prd-notifications.md` "발송 결과 상세"). */
export function NotificationBatchDetailPage() {
  return (
    <PageHeader title="발송 결과" backTo={{ to: '/support/notifications', label: '알림 발송' }} />
  );
}
