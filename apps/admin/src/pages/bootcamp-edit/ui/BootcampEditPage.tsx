import { useLocation, useNavigate, useParams } from 'react-router';
import { Callout } from '@ogonggo/ui';
import { useBootcampDetail, useReplaceBootcamp } from '@/entities/content/api/useContent';
import {
  BootcampForm,
  bootcampFormValuesFromDetail,
  toReplaceBootcampRequest,
} from '@/widgets/bootcamp-editor';
import { PageHeader } from '@/widgets/page-header';

/**
 * 부트캠프의 모든 내용과 모집 상태를 고치는 화면(FE #617, 백엔드 LC-3592). 상세의 `내용 수정` 으로 들어온다.
 *
 * 대리 등록과 같은 폼에 저장된 값을 채운다. 검수 상태와 노출은 바꾸지 않는다 — 운영 값 수정이 바꾼다.
 * 저장하면 들어온 상세로 돌아간다.
 */
export function BootcampEditPage() {
  const { bootcampId } = useParams();
  const navigate = useNavigate();
  const { data, isPending, isError } = useBootcampDetail(Number(bootcampId));
  const mutation = useReplaceBootcamp(Number(bootcampId));
  // 상세는 `/content/bootcamps/:id` 와 `/business/bootcamps/:id` 두 곳에 있다. 들어온 상세로 돌아간다.
  const detailPath = useLocation().pathname.replace(/\/edit$/, '');

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }
  if (isError || !data) {
    return (
      <>
        <PageHeader
          title="부트캠프 내용 수정"
          backTo={{ to: detailPath, label: '부트캠프 상세' }}
        />
        <Callout tone="error">부트캠프를 찾을 수 없습니다.</Callout>
      </>
    );
  }

  return (
    <>
      <PageHeader title="부트캠프 내용 수정" backTo={{ to: detailPath, label: data.title }} />
      {data.status === 'DRAFT' ? (
        <Callout tone="warning" className="mb-4">
          임시저장 과정입니다. 저장하면 고른 모집 상태가 됩니다.
        </Callout>
      ) : null}
      <BootcampForm
        mode="edit"
        initial={bootcampFormValuesFromDetail(data)}
        onSubmit={(values) =>
          mutation.mutate(toReplaceBootcampRequest(values), {
            onSuccess: () => navigate(detailPath),
          })
        }
        onCancel={() => navigate(detailPath)}
        pending={mutation.isPending}
        error={mutation.error}
      />
    </>
  );
}
