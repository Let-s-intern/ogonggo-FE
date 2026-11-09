import { useNavigate, useParams } from 'react-router';
import { Callout } from '@ogonggo/ui';
import { useCreateProxyBootcamp } from '@/entities/content/api/useContent';
import { useCompanyMemberDetail } from '@/entities/member/api/useMembers';
import {
  BootcampForm,
  emptyBootcampFormValues,
  toProxyBootcampRequest,
} from '@/widgets/bootcamp-editor';
import { PageHeader } from '@/widgets/page-header';

/**
 * 비즈니스 회원 대신 부트캠프를 등록하는 화면(FE #568, 백엔드 LC-3574).
 *
 * 폼은 전체 수정과 함께 쓴다(`widgets/bootcamp-editor`).
 * 회사명·로고는 회원의 기업 정보로 채워 두고 고칠 수 있다. 저장하면 검수 없이 승인되고 만든 부트캠프 상세로 간다.
 */
export function ProxyBootcampNewPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const member = useCompanyMemberDetail(Number(memberId));
  const mutation = useCreateProxyBootcamp(Number(memberId));
  const memberPath = `/members/companies/${memberId}`;
  const backTo = {
    to: memberPath,
    label: member.data?.organizationName ?? '비즈니스 회원',
  };

  if (member.isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }
  if (member.isError || !member.data) {
    return (
      <>
        <PageHeader title="부트캠프 대리 등록" backTo={backTo} />
        <Callout tone="error">비즈니스 회원을 찾을 수 없습니다.</Callout>
      </>
    );
  }

  return (
    <>
      <PageHeader title="부트캠프 대리 등록" backTo={backTo} />
      {member.data.status !== 'ACTIVE' ? (
        <Callout tone="warning" className="mb-4">
          정지·탈퇴한 회원입니다. 저장하면 서버가 거절합니다.
        </Callout>
      ) : null}
      <BootcampForm
        mode="create"
        initial={emptyBootcampFormValues(
          member.data.organizationName ?? '',
          member.data.logoUrl ?? '',
        )}
        onSubmit={(values) =>
          mutation.mutate(toProxyBootcampRequest(values), {
            onSuccess: (bootcamp) =>
              navigate(bootcamp ? `/content/bootcamps/${bootcamp.id}` : memberPath),
          })
        }
        onCancel={() => navigate(memberPath)}
        pending={mutation.isPending}
        error={mutation.error}
      />
    </>
  );
}
