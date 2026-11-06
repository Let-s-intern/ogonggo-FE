import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Callout, DataTable, Modal, Select, type DataTableColumn } from '@ogonggo/ui';
import type { AdvertiserType } from '@ogonggo/api/src/advertisers';
import { useAdvertiserList, type Advertiser } from '@/entities/advertiser/api/useAdvertisers';
import {
  ADVERTISER_SOURCE_LABELS,
  ADVERTISER_TYPE_OPTIONS,
} from '@/entities/advertiser/lib/advertiser';
import { AdvertiserName } from '@/entities/advertiser/ui/AdvertiserName';
import { formatKst } from '@/entities/banner/lib/banner';
import { formatWon } from '@/entities/ad-contract/lib/adContract';
import { NewAdvertiserForm } from '@/features/advertiser-picker/ui/AdvertiserField';
import { AdvertiserJump } from '@/features/advertiser-picker/ui/AdvertiserJump';
import { formatCount } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import { PageHeader } from '@/widgets/page-header';

/** 서버 값이 아니면 전체로 본다. 주소창에 아무 값이나 넣어도 400 이 나지 않게 한다. */
const toType = (value: string): AdvertiserType | '' =>
  value === 'MEMBER' || value === 'NON_MEMBER' ? value : '';

/**
 * 광고주별 광고 목록(이슈 #573, 2026-11-06 사용자). 자리마다 세팅하는 배너 세팅·광고 공고 세팅과 달리 기업 하나를 기준으로
 * 그 기업의 광고가 지금 몇 개 나가는지 본다. 행을 누르면 그 광고주의 배너·광고 공고를 모아 보는 상세로 간다.
 *
 * 목록은 고르기 칸과 같은 `GET /api/v1/admin/advertisers` 이고 행마다 광고 수가 붙는다. 페이지가 없어 최대 50건이다 —
 * 더 찾으려면 검색어로 좁힌다.
 */
export function AdvertiserListPage() {
  const navigate = useNavigate();
  const { get, setFilter } = useListQuery();
  const keyword = get('keyword');
  const type = toType(get('type'));
  const [adding, setAdding] = useState(false);
  const { data, isPending, isError } = useAdvertiserList(keyword, type);

  const columns: DataTableColumn<Advertiser>[] = [
    {
      key: 'name',
      header: '광고주',
      render: (row) => <AdvertiserName advertiser={row} />,
    },
    {
      key: 'source',
      header: '들어온 길',
      width: 'w-28',
      render: (row) => <span className="text-sm">{ADVERTISER_SOURCE_LABELS[row.source]}</span>,
    },
    {
      key: 'contact',
      header: '담당자 · 연락처',
      width: 'w-56',
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-gray-900">{row.contactName ?? '-'}</span>
          <span className="text-xs text-gray-500">
            {[row.contactEmail, row.contactPhone].filter(Boolean).join(' · ') || '-'}
          </span>
        </span>
      ),
    },
    {
      key: 'activeBanners',
      header: '노출 중 배너',
      align: 'right',
      width: 'w-28',
      render: (row) => formatCount(row.activeBannerCount),
    },
    {
      key: 'activeAdPostings',
      header: '노출 중 광고 공고',
      align: 'right',
      width: 'w-32',
      render: (row) => formatCount(row.activeAdPostingCount),
    },
    {
      key: 'total',
      header: '전체 광고',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.bannerCount + row.adPostingCount),
    },
    {
      key: 'contracts',
      header: '계약',
      align: 'right',
      width: 'w-28',
      render: (row) => (
        <span className="flex flex-col">
          <span>{formatCount(row.contractCount)}건</span>
          {row.activeContractCount > 0 ? (
            <span className="text-xs text-gray-500">진행 중 {row.activeContractCount}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'contractTotal',
      header: '계약 금액 합계',
      align: 'right',
      width: 'w-36',
      render: (row) => (
        <span className="whitespace-nowrap">{formatWon(row.contractTotalAmount)}</span>
      ),
    },
    {
      key: 'latestEndAt',
      header: '마지막 노출 끝(KST)',
      width: 'w-40',
      render: (row) => (
        <span className="text-sm">{row.latestEndAt ? formatKst(row.latestEndAt) : '-'}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="광고주별 광고"
        action={
          <span className="flex items-center gap-2">
            <AdvertiserJump />
            <Button size="sm" onClick={() => setAdding(true)}>
              새 광고주 추가
            </Button>
          </span>
        }
      />
      <p className="pb-4 text-sm text-gray-500">
        기업마다 맡긴 배너와 광고 공고를 모아 봅니다. 자리 안 순서는 배너 세팅·광고 공고 세팅에서
        바꿉니다.
      </p>

      <ListToolbar>
        <SearchBox
          value={keyword}
          onSubmit={(next) => setFilter('keyword', next)}
          placeholder="기업 이름·담당자·메일 검색"
        />
        <Select
          aria-label="회원·비회원"
          options={ADVERTISER_TYPE_OPTIONS}
          value={type}
          onChange={(event) => setFilter('type', event.target.value)}
        />
      </ListToolbar>

      {isError ? (
        <Callout tone="error">광고주 목록을 불러오지 못했습니다.</Callout>
      ) : (
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/business/advertisers/${row.id}`)}
          isLoading={isPending}
          emptyMessage="조건에 맞는 광고주가 없습니다."
        />
      )}

      {adding ? (
        <Modal
          open
          title="새 광고주 추가"
          description="비즈니스 회원이 아닌 기업을 더합니다. 회원은 가입하면 목록에 저절로 들어옵니다."
          onClose={() => setAdding(false)}
        >
          <NewAdvertiserForm
            initialName={keyword}
            submitLabel="추가"
            onCancel={() => setAdding(false)}
            onCreated={(advertiser) => navigate(`/business/advertisers/${advertiser.id}`)}
          />
        </Modal>
      ) : null}
    </>
  );
}
