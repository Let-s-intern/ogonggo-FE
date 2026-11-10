import { useLocation, useParams } from 'react-router';
import { Callout } from '@ogonggo/ui';
import { useBootcampDetail } from '@/entities/content/api/useContent';
import { BootcampDetailBody } from '@/widgets/bootcamp-detail';
import { PageHeader } from '@/widgets/page-header';

/** 부트캠프 상세 화면. 주소로 바로 들어올 때 쓴다. 목록에서는 모달로 연다(`BootcampDetailDialog`). */
export function BootcampDetailPage() {
  const { bootcampId } = useParams();
  const { pathname } = useLocation();
  const listPath = pathname.startsWith('/business/') ? '/business/bootcamps' : '/content/bootcamps';
  const { data, isPending, isError } = useBootcampDetail(Number(bootcampId));

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="부트캠프" backTo={{ to: listPath, label: '부트캠프 목록' }} />
        <Callout tone="error">부트캠프를 찾을 수 없습니다.</Callout>
      </>
    );
  }

  return (
    <>
      <PageHeader title={data.title} backTo={{ to: listPath, label: '부트캠프 목록' }} />
      <BootcampDetailBody data={data} listPath={listPath} />
    </>
  );
}
