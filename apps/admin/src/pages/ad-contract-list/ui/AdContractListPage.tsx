import { useNavigate, useSearchParams } from 'react-router';
import {
  Badge,
  Checkbox,
  Callout,
  DataTable,
  Input,
  Pagination,
  Select,
  cn,
  type DataTableColumn,
} from '@ogonggo/ui';
import {
  enumLabel,
  enumOptions,
  type AdminAdvertisementContractSummaryResponse,
  type ListAdvertisementContractsStatusItem,
} from '@ogonggo/api/src/admin';
import {
  useContractList,
  type ContractListFilters,
} from '@/entities/advertisement-contract/api/useAdvertisementContracts';
import {
  CONTRACT_STATUS_TONE,
  formatPaymentAmount,
} from '@/entities/advertisement-contract/lib/contract';
import { formatKst } from '@/entities/advertisement-exposure/lib/exposure';
import { useListQuery } from '@/shared/lib/useListQuery';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import { PageHeader } from '@/widgets/page-header';

/** 값을 고른 필터는 파란 배경, 고르지 않았으면 회색 이름이다(사이트 전체 드롭다운 규칙). */
const SELECTED = 'border-transparent bg-blue-50 font-semibold text-blue-500';
const UNSELECTED = 'text-gray-500';

const STATUS_OPTIONS = enumOptions('AdvertisementContractStatus');

/**
 * 화면. BE 에서는 신청 한 건이 곧 계약 한 행이고 상태만 바뀐다. 아직 승인되지 않은 것(신청·협의 중·반려)을 `유료 광고 신청`,
 * 승인된 것을 `계약` 메뉴로 나눠 본다(2026-11-09 사용자). 상태 체크는 그 화면의 상태만 고를 수 있고, 하나도 고르지 않으면
 * 화면의 상태 전부로 거른다.
 */
export type ContractListView = 'applications' | 'contracts';

const VIEWS: Record<
  ContractListView,
  { title: string; statuses: ListAdvertisementContractsStatusItem[]; empty: string }
> = {
  applications: {
    title: '유료 광고 신청',
    statuses: ['REQUESTED', 'NEGOTIATING', 'REJECTED'],
    empty: '조건에 맞는 신청이 없습니다.',
  },
  contracts: { title: '광고 계약', statuses: ['APPROVED'], empty: '조건에 맞는 계약이 없습니다.' },
};

/**
 * 광고 신청서로 들어온 계약만 본다. 기업회원 공고 등록(`COMPANY_POSTING`)도 계약 행을 만들지만 공고 하나에 자동으로
 * 생기고 상태가 공고 검수를 따라가 계약이 아니다(2026-11-09 사용자). 그 건은 `채용공고·부트캠프 등록` 검수에서 본다.
 */
const SOURCE = 'APPLICATION_FORM';

type SelectKey = 'promotionTarget' | 'category';

const SELECTS: { key: SelectKey; label: string; options: { value: string; label: string }[] }[] = [
  {
    key: 'promotionTarget',
    label: '홍보 대상',
    options: [
      { value: '', label: '홍보 대상' },
      ...enumOptions('AdvertisementContractPromotionTarget'),
    ],
  },
  {
    key: 'category',
    label: '카테고리',
    options: [{ value: '', label: '카테고리' }, ...enumOptions('AdvertisementProductCategory')],
  },
];

type Row = AdminAdvertisementContractSummaryResponse;

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'id', header: 'ID', width: 'w-16', render: (row) => row.id },
  {
    key: 'status',
    header: '상태',
    width: 'w-24',
    render: (row) => (
      <Badge tone={CONTRACT_STATUS_TONE[row.status]}>
        {enumLabel('AdvertisementContractStatus', row.status)}
      </Badge>
    ),
  },
  {
    key: 'company',
    header: '회사명 · 공고',
    render: (row) => (
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-gray-900">{row.companyName}</span>
        <span className="text-xs text-gray-500">
          {enumLabel('AdvertisementContractPromotionTarget', row.promotionTarget)} ·{' '}
          {row.recruitmentTitle}
          {row.recruitmentDeadline ? ` (마감 ${row.recruitmentDeadline})` : ''}
        </span>
      </span>
    ),
  },
  {
    key: 'categories',
    header: '희망 카테고리',
    width: 'w-48',
    render: (row) =>
      row.categories
        .map((category) => enumLabel('AdvertisementProductCategory', category))
        .join(', '),
  },
  {
    key: 'paymentAmount',
    header: '협의 금액',
    width: 'w-28',
    render: (row) => formatPaymentAmount(row.paymentAmount),
  },
  {
    key: 'registeredAt',
    header: '신청일',
    width: 'w-40',
    render: (row) => <span className="text-sm">{formatKst(row.registeredAt)}</span>,
  },
];

const isStatus = (value: string): value is ListAdvertisementContractsStatusItem =>
  STATUS_OPTIONS.some((option) => option.value === value);

/**
 * 유료 광고 신청·계약 목록(PRD 4절). 광고 신청 폼으로 들어온 신청만 본다(`SOURCE`). 최신 신청이 먼저다.
 * `유료 광고 신청`(승인 전, `/business/advertisement-applications`)과 `계약`(승인, `/business/advertisement-contracts`)
 * 이 같은 화면을 `view` 로 나눠 쓴다(`VIEWS`).
 *
 * 필터는 모두 URL 쿼리에 있다. 상태는 여러 개를 고를 수 있어 `status=REQUESTED,NEGOTIATING` 처럼 쉼표로 잇는다.
 */
export function AdContractListPage({ view }: { view: ContractListView }) {
  const navigate = useNavigate();
  const { get, page, setPage } = useListQuery();
  const [, setSearchParams] = useSearchParams();

  /** 필터 여럿을 지금 주소에서 출발해 한 번에 바꾼다(`AdInquiryListPage` 와 같은 이유). 바꾸면 1페이지로 간다. */
  const change = (changes: Record<string, string>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const { title, statuses: tabStatuses, empty } = VIEWS[view];
  const checkedStatuses = get('status')
    .split(',')
    .filter(isStatus)
    .filter((status) => tabStatuses.includes(status));

  const filters: ContractListFilters = {
    page,
    source: SOURCE,
    status: checkedStatuses.length > 0 ? checkedStatuses : tabStatuses,
    promotionTarget: get('promotionTarget'),
    category: get('category'),
    companyName: get('companyName'),
    createdFrom: get('createdFrom'),
    createdTo: get('createdTo'),
  };
  const { data, isPending, isError } = useContractList(filters);

  const toggleStatus = (status: ListAdvertisementContractsStatusItem, on: boolean) => {
    const next = on
      ? [...checkedStatuses, status]
      : checkedStatuses.filter((value) => value !== status);
    change({ status: next.join(',') });
  };

  return (
    <>
      <PageHeader title={title} />
      <ListToolbar>
        {SELECTS.map(({ key, label, options }) => (
          <Select
            key={key}
            aria-label={label}
            options={options}
            value={filters[key]}
            onChange={(event) => change({ [key]: event.target.value })}
            className={filters[key] ? SELECTED : UNSELECTED}
          />
        ))}
        <SearchBox
          value={filters.companyName}
          placeholder="회사명"
          onSubmit={(companyName) => change({ companyName })}
        />
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="신청일 시작"
            value={filters.createdFrom}
            max={filters.createdTo || undefined}
            onChange={(event) => change({ createdFrom: event.target.value })}
            className={cn('h-9 w-36 px-2 text-sm', filters.createdFrom ? SELECTED : UNSELECTED)}
          />
          <span className="text-sm text-gray-400">~</span>
          <Input
            type="date"
            aria-label="신청일 끝"
            value={filters.createdTo}
            min={filters.createdFrom || undefined}
            onChange={(event) => change({ createdTo: event.target.value })}
            className={cn('h-9 w-36 px-2 text-sm', filters.createdTo ? SELECTED : UNSELECTED)}
          />
        </div>
        {tabStatuses.length > 1 ? (
          <div className="flex items-center gap-3" role="group" aria-label="상태">
            {STATUS_OPTIONS.filter((option) => tabStatuses.includes(option.value)).map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={checkedStatuses.includes(option.value)}
                onChange={(on) => toggleStatus(option.value, on)}
              />
            ))}
          </div>
        ) : null}
        <p className="ml-auto text-sm text-gray-500">
          현재 조건{' '}
          <b className="font-semibold text-gray-900">{data?.pageInfo.totalElements ?? '-'}</b>건
        </p>
      </ListToolbar>

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/business/advertisement-contracts/${row.id}`)}
            isLoading={isPending}
            emptyMessage={empty}
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}
