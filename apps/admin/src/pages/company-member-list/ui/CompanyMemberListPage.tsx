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
import { enumLabel } from '@ogonggo/api';
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
 *
 * 알림 이메일과 담당자 연락처까지 목록에 두어 행을 열지 않고도 연락처를 찾게 한다. 가입 때 받은 기업·담당자
 * 정보(LC-3526)는 칸이 많아 모달에서만 보인다. 그 전에 가입한 회원은 값이 없어 `-` 다.
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
    { key: 'userId', header: 'ID', width: 'w-20', render: (row) => row.userId },
    { key: 'organizationName', header: '회사명', render: (row) => orDash(row.organizationName) },
    {
      key: 'email',
      header: '계정 · 알림 이메일',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{orDash(row.email)}</span>
          <span className="text-xs text-gray-500">{orDash(row.notificationEmail)}</span>
        </div>
      ),
    },
    {
      key: 'managerName',
      header: '담당자 · 연락처',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{orDash(row.managerName)}</span>
          <span className="text-xs text-gray-500">{orDash(row.managerPhone)}</span>
        </div>
      ),
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
          placeholder="회사명·담당자·이메일 검색"
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

/** 카탈로그 라벨. 값이 없으면 `-` 다. */
const labelOrDash = (
  name: 'CompanyType' | 'CompanyEmployeeCountRange' | 'CompanyManagerDuty',
  value: string | undefined,
) => (value ? enumLabel(name, value) : '-');

/**
 * 사업자 번호 칸. 종류 라벨과 하이픈 넣은 번호(가입 화면과 같은 자리), 해외 기업은 종류 라벨만 보인다.
 * 서버는 숫자만 저장한다.
 */
function businessNumberOf(member: AdminCompanyMemberResponse): string {
  const { businessNumberType: type, businessNumber: number } = member;
  if (!type) return '-';
  const label = enumLabel('CompanyBusinessNumberType', type);
  if (!number) return label;
  const formatted =
    type === 'CORPORATE_REGISTRATION'
      ? `${number.slice(0, 6)}-${number.slice(6)}`
      : `${number.slice(0, 3)}-${number.slice(3, 5)}-${number.slice(5)}`;
  return `${label} ${formatted}`;
}

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
      <h3 className="pt-6 pb-2.5 text-base font-bold text-gray-900">기업 정보</h3>
      <DescriptionList
        items={[
          { label: '사업자 번호', value: businessNumberOf(member), full: true },
          { label: '기업 형태', value: labelOrDash('CompanyType', member.companyType) },
          {
            label: '직원 수',
            value: labelOrDash('CompanyEmployeeCountRange', member.employeeCountRange),
          },
          { label: '산업', value: orDash(member.industry) },
          {
            label: '홈페이지',
            value: member.homepageUrl ? (
              <a
                href={member.homepageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-600 hover:underline"
              >
                {member.homepageUrl}
              </a>
            ) : (
              '-'
            ),
          },
          { label: '주소', value: orDash(member.address), full: true },
        ]}
      />
      <h3 className="pt-6 pb-2.5 text-base font-bold text-gray-900">담당자 정보</h3>
      <DescriptionList
        items={[
          { label: '직책', value: orDash(member.managerTitle) },
          { label: '담당 업무', value: labelOrDash('CompanyManagerDuty', member.managerDuty) },
          { label: '추천인', value: orDash(member.recommender), full: true },
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
