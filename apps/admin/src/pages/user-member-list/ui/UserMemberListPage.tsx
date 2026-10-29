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
import {
  enumLabel,
  type AdminGeneralMemberResponse,
  type AdminGeneralMemberResponseRole,
} from '@ogonggo/api/src/admin';
import { useChangeMemberRole, useUserMemberList } from '@/entities/member/api/useMembers';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  InflowSourceBadge,
  JOINED_WITHIN_OPTIONS,
  MEMBER_ROLE_CHANGE_OPTIONS,
  MEMBER_ROLE_OPTIONS,
  MEMBER_STATUS_OPTIONS,
  MemberRoleBadge,
  MemberStatusBadge,
} from '@/shared/config/labels';
import { formatDate, formatDateTime } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 일반 회원 목록. 읽기 전용이다.
 *
 * 제재는 운영자가 쿼리로 걸고 이 화면은 결과를 상태 뱃지로 보여준다(PRD "하지 않는 것"). 바꿀 수 있는 것은
 * 역할 하나다 — 행 모달에서 멘토를 지정하고 관리자로 올리거나 내린다.
 *
 * 칸은 API(`AdminGeneralMemberResponse`) 가 주는 것만 둔다. 목 시절의 "최근 접속" 은 응답에
 * 없어 뺐다. 학교·학년·희망 직무까지 목록에 두어 행을 열지 않고도 회원을 가늠하게 한다. 나머지
 * (렛츠커리어 ID, 탈퇴일, 희망 산업 등)는 행을 눌러 본다. 정렬 파라미터도 없어 정렬 선택은 두지 않는다 — 순서는 서버가 정한다.
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
    role: get('role'),
    joinedWithinDays: get('joinedWithinDays'),
  };

  const { data, isPending, isError } = useUserMemberList(filters);

  const columns: DataTableColumn<AdminGeneralMemberResponse>[] = [
    { key: 'userId', header: 'ID', width: 'w-20', render: (row) => row.userId },
    {
      key: 'nickname',
      header: '닉네임 · 이름',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{orDash(row.nickname)}</span>
          <span className="text-xs text-gray-500">{orDash(row.name)}</span>
        </div>
      ),
    },
    { key: 'email', header: '이메일', render: (row) => orDash(row.email) },
    {
      key: 'school',
      header: '학교 · 전공',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{orDash(row.university)}</span>
          <span className="text-xs text-gray-500">{orDash(row.major)}</span>
        </div>
      ),
    },
    {
      key: 'grade',
      header: '학년',
      width: 'w-24',
      render: (row) => (row.grade ? enumLabel('UserGrade', row.grade) : '-'),
    },
    {
      key: 'wish',
      header: '희망 직군 · 직무',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{orDash(row.wishField)}</span>
          <span className="text-xs text-gray-500">{orDash(row.wishJob)}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: '역할',
      width: 'w-24',
      render: (row) => <MemberRoleBadge value={row.role} />,
    },
    {
      key: 'inflowSource',
      header: '유입',
      width: 'w-28',
      render: (row) => <InflowSourceBadge value={row.inflowSource} />,
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
      <PageHeader title="일반 회원" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="이름·닉네임·이메일 검색"
        />
        <Select
          options={MEMBER_STATUS_OPTIONS}
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
          aria-label="상태"
        />
        <Select
          options={MEMBER_ROLE_OPTIONS}
          value={filters.role}
          onChange={(event) => setFilter('role', event.target.value)}
          aria-label="역할"
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

      {selected ? (
        <MemberModal
          member={selected}
          onRoleChanged={(role) => setSelected({ ...selected, role })}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

/** 응답에 없는 값은 `-` 로 둔다. 빈 칸은 값이 안 그려진 것과 구분되지 않는다. */
const orDash = (value: string | number | undefined) => value ?? '-';

/**
 * 역할 변경. 고르고 `변경` 을 누르면 한 번 더 묻고, 확인하면 보낸다.
 *
 * 관리자 권한은 서버가 요청마다 역할로 확인하므로 `ADMIN` 으로 올리면 그 회원이 바로 어드민을 쓸 수 있고
 * 내리면 다음 요청부터 접근을 잃는다. 되돌릴 수 있는 일이라 문구 입력까지 받지는 않는다. 탈퇴 회원은
 * 서버가 거절하므로 처음부터 막는다. 기업 회원·자기 자신은 서버가 거절하고 그 메시지를 그대로 보인다.
 */
function RoleChanger({
  member,
  onRoleChanged,
}: {
  member: AdminGeneralMemberResponse;
  onRoleChanged: (role: AdminGeneralMemberResponseRole) => void;
}) {
  const [draft, setDraft] = useState(member.role);
  const [confirming, setConfirming] = useState(false);
  const mutation = useChangeMemberRole();
  const withdrawn = member.status === 'WITHDRAWN';

  const submit = () => {
    mutation.mutate(
      { userId: member.userId, role: draft as 'USER' | 'MENTOR' | 'ADMIN' },
      {
        onSuccess: () => {
          setConfirming(false);
          onRoleChanged(draft);
        },
        onError: () => setConfirming(false),
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">역할</span>
        <MemberRoleBadge value={member.role} />
        <Select
          options={MEMBER_ROLE_CHANGE_OPTIONS}
          value={draft}
          disabled={withdrawn || mutation.isPending}
          onChange={(event) => {
            setDraft(event.target.value as AdminGeneralMemberResponseRole);
            setConfirming(false);
            mutation.reset();
          }}
          aria-label="바꿀 역할"
        />
        <Button
          variant="secondary"
          disabled={withdrawn || draft === member.role || mutation.isPending}
          onClick={() => setConfirming(true)}
        >
          변경
        </Button>
      </div>
      {withdrawn ? (
        <p className="text-xs text-gray-500">탈퇴한 회원의 역할은 바꿀 수 없습니다.</p>
      ) : null}
      {confirming ? (
        <Callout tone="warning">
          <p>
            이 회원이 {enumLabel('UserRole', draft)} 역할로 바뀝니다. 다음 요청부터 적용됩니다.
            {draft === 'ADMIN' ? ' 관리자가 되면 어드민을 쓸 수 있습니다.' : ''}
            {member.role === 'ADMIN' ? ' 관리자에서 내리면 어드민에 접근할 수 없게 됩니다.' : ''}
          </p>
          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={mutation.isPending}>
              확인
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              취소
            </Button>
          </div>
        </Callout>
      ) : null}
      {mutation.isError ? (
        <Callout tone="error">
          {serverErrorMessage(mutation.error) ?? '역할을 바꾸지 못했습니다.'}
        </Callout>
      ) : null}
    </div>
  );
}

function MemberModal({
  member,
  onRoleChanged,
  onClose,
}: {
  member: AdminGeneralMemberResponse;
  onRoleChanged: (role: AdminGeneralMemberResponseRole) => void;
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
          { label: '유입', value: <InflowSourceBadge value={member.inflowSource} /> },
          { label: '가입일', value: formatDateTime(member.joinedAt) },
          { label: '탈퇴일', value: member.withdrawnAt ? formatDateTime(member.withdrawnAt) : '-' },
          { label: '학교', value: orDash(member.university) },
          { label: '전공', value: orDash(member.major) },
          { label: '학년', value: member.grade ? enumLabel('UserGrade', member.grade) : '-' },
          { label: '희망 분야', value: orDash(member.wishField) },
          { label: '희망 직무', value: orDash(member.wishJob) },
          { label: '희망 산업', value: orDash(member.wishIndustry) },
          { label: '희망 고용형태', value: orDash(member.wishEmploymentType) },
          { label: '희망 기업', value: orDash(member.wishCompany) },
        ]}
      />
      <RoleChanger key={member.userId} member={member} onRoleChanged={onRoleChanged} />
      <div className="flex justify-end pt-6">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Modal>
  );
}
