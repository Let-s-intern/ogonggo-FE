import { useState } from 'react';
import {
  Avatar,
  Button,
  Callout,
  DataTable,
  DescriptionList,
  Modal,
  Pagination,
  Select,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { AdminCompanyMemberResponse } from '@ogonggo/api/src/admin';
import { useCompanyMemberList } from '@/entities/member/api/useMembers';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  JOINED_WITHIN_OPTIONS,
  MEMBER_STATUS_OPTIONS,
  MemberStatusBadge,
} from '@/shared/config/labels';
import { formatDate, formatDateTime } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 비즈니스 회원 목록. 일반 회원과 구성이 같고 칸만 다르다.
 *
 * 칸은 API(`AdminCompanyMemberResponse`) 가 주는 것만 둔다. 목 시절의 "사업자등록번호" 와
 * "등록 공고" 수는 응답에 없어 뺐고, 대신 계정을 알아볼 로그인 이메일을 둔다. 정렬 파라미터가
 * 없는 것과 행을 누르면 목록 응답을 모달로 보여 주는 것은 일반 회원 목록과 같다.
 */
export function CompanyMemberListPage() {
  const [selected, setSelected] = useState<AdminCompanyMemberResponse | null>(null);
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    keyword: get('keyword'),
    status: get('status'),
    joinedWithinDays: get('joinedWithinDays'),
  };

  const { data, isPending, isError } = useCompanyMemberList(filters);

  const columns: DataTableColumn<AdminCompanyMemberResponse>[] = [
    { key: 'organizationName', header: '회사명', render: (row) => row.organizationName ?? '-' },
    { key: 'email', header: '이메일', render: (row) => row.email ?? '-' },
    {
      key: 'managerName',
      header: '담당자',
      width: 'w-28',
      render: (row) => row.managerName ?? '-',
    },
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
      <PageHeader title="비즈니스 회원" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="회사명·담당자 검색"
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
            onRowClick={setSelected}
            isLoading={isPending}
            emptyMessage="조건에 맞는 회원이 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}

      {selected ? <MemberModal member={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

/** 응답에 없는 값은 `-` 로 둔다. 빈 칸은 값이 안 그려진 것과 구분되지 않는다. */
const orDash = (value: string | undefined) => value ?? '-';

function MemberModal({
  member,
  onClose,
}: {
  member: AdminCompanyMemberResponse;
  onClose: () => void;
}) {
  return (
    <Modal open title={member.organizationName ?? '비즈니스 회원'} onClose={onClose}>
      <div className="flex items-center gap-3 pb-4">
        <Avatar
          src={member.logoUrl}
          alt=""
          fallback={(member.organizationName ?? '?').slice(0, 1)}
        />
        <MemberStatusBadge value={member.status} />
      </div>
      <DescriptionList
        items={[
          { label: '회원 ID', value: member.userId },
          { label: '회사명', value: orDash(member.organizationName) },
          { label: '계정 이메일', value: orDash(member.email), full: true },
          { label: '알림 이메일', value: orDash(member.notificationEmail), full: true },
          { label: '담당자', value: orDash(member.managerName) },
          { label: '담당자 연락처', value: orDash(member.managerPhone) },
          { label: '가입일', value: formatDateTime(member.joinedAt) },
          { label: '탈퇴일', value: member.withdrawnAt ? formatDateTime(member.withdrawnAt) : '-' },
        ]}
      />
      <div className="flex justify-end pt-6">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Modal>
  );
}
