import { useParams } from 'react-router';
import { Callout, Card, CardTitle, DescriptionList } from '@ogonggo/ui';
import { useUserMemberDetail } from '@/entities/member/api/useMembers';
import { PageHeader } from '@/widgets/page-header';
import { MemberStatusBadge } from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';

/** 일반 회원 상세. 읽기 전용이다. */
export function UserMemberDetailPage() {
  const { memberId } = useParams();
  const { data, isPending, isError } = useUserMemberDetail(Number(memberId));

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="일반 회원" backTo={{ to: '/members/users', label: '일반 회원 목록' }} />
        <Callout tone="error">회원을 찾을 수 없습니다.</Callout>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={data.nickname}
        backTo={{ to: '/members/users', label: '일반 회원 목록' }}
      />

      <Card>
        <CardTitle>기본 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={2}
          items={[
            { label: '닉네임', value: data.nickname },
            { label: '이메일', value: data.email },
            { label: '상태', value: <MemberStatusBadge value={data.status} /> },
            { label: '가입일', value: formatDateTime(data.joinedAt) },
            { label: '최근 접속', value: formatDateTime(data.lastAccessedAt) },
          ]}
        />
      </Card>

      {data.status === 'SUSPENDED' ? (
        <Callout tone="warning" className="mt-4">
          정지된 회원입니다. 제재 해제는 콘솔이 아니라 운영 쿼리로 처리합니다.
        </Callout>
      ) : null}

      <Callout className="mt-4">
        작성 글과 북마크 목록은 아직 붙이지 않았습니다. 사이드·스터디 도메인이 백엔드에 생긴 뒤 한
        번에 잇습니다.
      </Callout>
    </>
  );
}
