import { useNavigate } from 'react-router';
import { Callout, DataTable, Pagination, Select, type DataTableColumn } from '@ogonggo/ui';
import type { AdminGeneralMemberResponse } from '@ogonggo/api/src/admin';
import { useUserMemberList } from '@/entities/member/api/useMembers';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  JOINED_WITHIN_OPTIONS,
  MEMBER_STATUS_OPTIONS,
  MemberStatusBadge,
} from '@/shared/config/labels';
import { formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 일반 회원 목록. 읽기 전용이다.
 *
 * 제재는 운영자가 쿼리로 걸고 이 화면은 결과를 상태 뱃지로 보여준다(PRD "하지 않는 것").
 *
 * 칸은 API(`AdminGeneralMemberResponse`) 가 주는 것만 둔다. 목 시절의 "최근 접속" 은 응답에
 * 없어 뺐다. 정렬 파라미터도 없어 정렬 선택은 두지 않는다 — 순서는 서버가 정한다.
 *
 * 행을 누르면 상세로 가지만 상세 API 는 아직 없다. 실서버 모드의 상세는 안내만 그린다.
 */
export function UserMemberListPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    keyword: get('keyword'),
    status: get('status'),
    joinedWithinDays: get('joinedWithinDays'),
  };

  const { data, isPending, isError } = useUserMemberList(filters);

  const columns: DataTableColumn<AdminGeneralMemberResponse>[] = [
    { key: 'nickname', header: '닉네임', render: (row) => row.nickname ?? '-' },
    { key: 'email', header: '이메일', render: (row) => row.email ?? '-' },
    {
      key: 'status',
      header: '상태',
      width: 'w-24',
      render: (row) => <MemberStatusBadge value={row.status} />,
    },
    { key: 'joinedAt', header: '가입일', width: 'w-32', render: (row) => formatDate(row.joinedAt) },
  ];

  return (
    <>
      <PageHeader title="일반 회원" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="닉네임·이메일 검색"
        />
        <Select
          options={MEMBER_STATUS_OPTIONS}
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
          aria-label="상태"
        />
        <Select
          options={JOINED_WITHIN_OPTIONS}
          value={filters.joinedWithinDays}
          onChange={(event) => setFilter('joinedWithinDays', event.target.value)}
          aria-label="가입 기간"
        />
      </ListToolbar>

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.userId}
            onRowClick={(row) => navigate(`/members/users/${row.userId}`)}
            isLoading={isPending}
            emptyMessage="조건에 맞는 회원이 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}
