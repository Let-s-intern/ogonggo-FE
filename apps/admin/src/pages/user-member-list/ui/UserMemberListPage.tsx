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
import type {
  AdminGeneralMemberResponse,
  AdminGeneralMemberResponseGrade,
} from '@ogonggo/api/src/admin';
import { useUserMemberList } from '@/entities/member/api/useMembers';
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
 * 일반 회원 목록. 읽기 전용이다.
 *
 * 제재는 운영자가 쿼리로 걸고 이 화면은 결과를 상태 뱃지로 보여준다(PRD "하지 않는 것").
 *
 * 칸은 API(`AdminGeneralMemberResponse`) 가 주는 것만 둔다. 목 시절의 "최근 접속" 은 응답에
 * 없어 뺐다. 정렬 파라미터도 없어 정렬 선택은 두지 않는다 — 순서는 서버가 정한다.
 *
 * 행을 누르면 그 행의 응답을 모달로 보여 준다. 상세 API 가 아직 없어 목록 응답이 가진 칸이
 * 전부다 — 활동 내역(작성한 글, 북마크)은 없다.
 */
export function UserMemberListPage() {
  const [selected, setSelected] = useState<AdminGeneralMemberResponse | null>(null);
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

const GRADE_LABELS: Record<AdminGeneralMemberResponseGrade, string> = {
  FIRST: '1학년',
  SECOND: '2학년',
  THIRD: '3학년',
  FOURTH: '4학년',
  ETC: '5학년 이상',
  GRADUATE: '졸업생',
};

/** 응답에 없는 값은 `-` 로 둔다. 빈 칸은 값이 안 그려진 것과 구분되지 않는다. */
const orDash = (value: string | number | undefined) => value ?? '-';

function MemberModal({
  member,
  onClose,
}: {
  member: AdminGeneralMemberResponse;
  onClose: () => void;
}) {
  return (
    <Modal open title={member.nickname ?? member.name ?? '일반 회원'} onClose={onClose}>
      <div className="flex items-center gap-3 pb-4">
        <Avatar
          src={member.profileImageUrl}
          alt=""
          fallback={(member.nickname ?? member.name ?? '?').slice(0, 1)}
        />
        <MemberStatusBadge value={member.status} />
      </div>
      <DescriptionList
        items={[
          { label: '회원 ID', value: member.userId },
          { label: '렛츠커리어 ID', value: orDash(member.letsCareerUserId) },
          { label: '이름', value: orDash(member.name) },
          { label: '닉네임', value: orDash(member.nickname) },
          { label: '이메일', value: orDash(member.email), full: true },
          { label: '가입일', value: formatDateTime(member.joinedAt) },
          { label: '탈퇴일', value: member.withdrawnAt ? formatDateTime(member.withdrawnAt) : '-' },
          { label: '학교', value: orDash(member.university) },
          { label: '전공', value: orDash(member.major) },
          { label: '학년', value: member.grade ? GRADE_LABELS[member.grade] : '-' },
          { label: '희망 분야', value: orDash(member.wishField) },
          { label: '희망 직무', value: orDash(member.wishJob) },
          { label: '희망 산업', value: orDash(member.wishIndustry) },
          { label: '희망 고용형태', value: orDash(member.wishEmploymentType) },
          { label: '희망 기업', value: orDash(member.wishCompany) },
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
