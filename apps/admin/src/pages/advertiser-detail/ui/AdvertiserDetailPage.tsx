import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  ActionAlert,
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  ConfirmDelete,
  DataTable,
  DescriptionList,
  EmptyState,
  Toggle,
  cn,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { AdPostingPlacement } from '@ogonggo/api/src/ad-postings';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';
import type { BannerPlacement } from '@ogonggo/api/src/banners';
import { useAdContracts, type AdContract } from '@/entities/ad-contract/api/useAdContracts';
import { defaultAdContract } from '@/entities/ad-contract/lib/adContract';
import {
  useAdvertiserAdPostings,
  useDeleteAdPosting,
  useUpdateAdPosting,
  type AdPosting,
} from '@/entities/ad-posting/api/useAdPostings';
import {
  AD_PLACEMENT_LABELS,
  AD_POSTING_STATUS_BADGES,
  adPostingStatus,
} from '@/entities/ad-posting/lib/adPosting';
import { useAdvertiserDetail, type Advertiser } from '@/entities/advertiser/api/useAdvertisers';
import { ADVERTISER_SOURCE_LABELS } from '@/entities/advertiser/lib/advertiser';
import { AdvertiserName } from '@/entities/advertiser/ui/AdvertiserName';
import {
  useAdvertiserBanners,
  useDeleteBanner,
  usePatchBanner,
  useToggleBanner,
  type Banner,
} from '@/entities/banner/api/useBanners';
import {
  BANNER_STATUS_BADGES,
  PC_IMAGE_SPECS,
  PLACEMENT_LABELS,
  bannerImageSrc,
  bannerStatus,
} from '@/entities/banner/lib/banner';
import { useCompanyMemberDetail } from '@/entities/member/api/useMembers';
import { AdvertiserJump } from '@/features/advertiser-picker/ui/AdvertiserJump';
import { MemberStatusBadge } from '@/shared/config/labels';
import { formatCount } from '@/shared/lib/format';
import { AdPostingFormModal } from '@/widgets/ad-posting-form';
import { BannerFormModal } from '@/widgets/banner-form';
import { PageHeader } from '@/widgets/page-header';
import { AdContractSection } from './AdContractSection';
import { AdvertiserEditModal } from './AdvertiserEditModal';
import { AdvertiserNoteSection } from './AdvertiserNoteSection';
import { BulkAdModal, type BulkAdKind } from './BulkAdModal';
import { InlineLinkCell, InlinePeriodCell } from './InlineEditCells';

const BACK_TO = { to: '/business/advertisers', label: '광고주별 광고 목록' };

/** 한 번에 추가를 연 상태. 미리 고를 계약(계약 행에서 열었거나 기본 계약)과 처음 체크할 종류. */
type BulkAdding = { contract: AdContract | null; kind: BulkAdKind } | null;
/** 화면 위에 잠깐 뜨는 결과 문구. */
type Notify = (message: string) => void;

/**
 * 광고주별 광고 상세(이슈 #573, 2026-11-06 사용자). 기업 하나의 광고 계약, 배너, 광고 공고, 어드민 메모를 모아 보고 고친다.
 * 더할 때는 `광고 한 번에 추가`(`BulkAdModal`)에서 자리를 여러 개 체크해 한 번에 만든다. 표의 노출 기간·링크는 칸을 눌러 바로
 * 고치고, 나머지 칸은 행을 눌러 여는 수정 모달에서 고친다.
 *
 * 모달과 쓰기는 배너 세팅·광고 공고 세팅의 것을 그대로 쓴다. 자리 안 순서는 여기서 바꾸지 않는다 — 다른 광고주의 광고와
 * 섞인 순서라 자리별 화면에서 보고 바꾼다. 비회원 광고주는 이름·담당자·메모를 고칠 수 있고, 회원 광고주는 비즈니스 회원
 * 정보를 따른다.
 */
export function AdvertiserDetailPage() {
  const advertiserId = Number(useParams().advertiserId);
  const { data: advertiser, isPending, isError } = useAdvertiserDetail(advertiserId);
  const banners = useAdvertiserBanners(advertiserId);
  const adPostings = useAdvertiserAdPostings(advertiserId);
  const contracts = useAdContracts(Number.isInteger(advertiserId) ? advertiserId : null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [bulk, setBulk] = useState<BulkAdding>(null);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);
  const notify: Notify = (message) => setAlert({ message, nonce: Date.now() });
  const openBulk = (kind: BulkAdKind, contract?: AdContract) =>
    setBulk({ kind, contract: contract ?? defaultAdContract(contracts.data ?? []) });

  if (isPending && Number.isInteger(advertiserId)) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }
  if (isError || !advertiser) {
    return (
      <>
        <PageHeader title="광고주" backTo={BACK_TO} action={<AdvertiserJump />} />
        <Callout tone="error">광고주를 찾을 수 없습니다.</Callout>
      </>
    );
  }

  const summary: AdvertiserSummary = {
    id: advertiser.id,
    name: advertiser.name,
    type: advertiser.type,
  };

  return (
    <>
      <PageHeader
        title={advertiser.name}
        backTo={BACK_TO}
        action={<AdvertiserJump key={advertiser.id} currentId={advertiser.id} />}
      />

      <Card>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>광고주 정보</CardTitle>
          {advertiser.type === 'NON_MEMBER' ? (
            <Button size="sm" variant="secondary" onClick={() => setEditingInfo(true)}>
              정보 수정
            </Button>
          ) : null}
        </div>
        {advertiser.type === 'MEMBER' && advertiser.companyMemberUserId !== undefined ? (
          <MemberInfo advertiser={advertiser} userId={advertiser.companyMemberUserId} />
        ) : (
          <NonMemberInfo advertiser={advertiser} />
        )}
      </Card>

      <Card className="mt-4">
        <CardTitle>지금 노출 중</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={2}
          items={[
            {
              label: `배너 ${formatCount(advertiser.activeBannerCount)}건`,
              value: liveByPlacement(
                (banners.data ?? []).filter((row) => bannerStatus(row) === 'LIVE'),
                (placement: BannerPlacement) => PLACEMENT_LABELS[placement],
              ),
            },
            {
              label: `광고 공고 ${formatCount(advertiser.activeAdPostingCount)}건`,
              value: liveByPlacement(
                (adPostings.data ?? []).filter((row) => adPostingStatus(row) === 'LIVE'),
                (placement: AdPostingPlacement) => AD_PLACEMENT_LABELS[placement],
              ),
            },
          ]}
        />
      </Card>

      <AdContractSection
        advertiser={advertiser}
        query={contracts}
        onAddBanner={(contract) => openBulk('BANNER', contract)}
        onAddAdPosting={(contract) => openBulk('AD_POSTING', contract)}
        notify={notify}
      />
      <BannerSection query={banners} onAdd={() => openBulk('BANNER')} notify={notify} />
      <AdPostingSection query={adPostings} onAdd={() => openBulk('AD_POSTING')} notify={notify} />
      <AdvertiserNoteSection advertiserId={advertiser.id} notify={notify} />

      {bulk ? (
        <BulkAdModal
          advertiser={summary}
          contracts={contracts.data ?? []}
          initialContract={bulk.contract}
          kind={bulk.kind}
          onClose={() => setBulk(null)}
          onDone={notify}
        />
      ) : null}
      {alert ? (
        <ActionAlert message={alert.message} nonce={alert.nonce} onDismiss={() => setAlert(null)} />
      ) : null}

      {editingInfo ? (
        <AdvertiserEditModal advertiser={advertiser} onClose={() => setEditingInfo(false)} />
      ) : null}
    </>
  );
}

/** 자리별 노출 중 수. `홈 상단 1 · 공고 상세 2` 처럼 적는다. */
function liveByPlacement<P extends string>(
  rows: { placement: P }[],
  label: (placement: P) => string,
): string {
  if (rows.length === 0) {
    return '없음';
  }
  const counts = new Map<P, number>();
  for (const row of rows) {
    counts.set(row.placement, (counts.get(row.placement) ?? 0) + 1);
  }
  return [...counts].map(([placement, count]) => `${label(placement)} ${count}`).join(' · ');
}

function NonMemberInfo({ advertiser }: { advertiser: Advertiser }) {
  return (
    <DescriptionList
      className="pt-4"
      columns={2}
      items={[
        { label: '구분', value: <AdvertiserName advertiser={advertiser} /> },
        { label: '들어온 길', value: <SourceValue advertiser={advertiser} /> },
        { label: '담당자', value: advertiser.contactName ?? '-' },
        { label: '메일', value: advertiser.contactEmail ?? '-' },
        { label: '전화', value: advertiser.contactPhone ?? '-' },
        {
          label: '메모',
          value: <span className="whitespace-pre-line">{advertiser.memo ?? '-'}</span>,
          full: true,
        },
      ]}
    />
  );
}

/** 들어온 길. 광고 문의로 들어왔으면 문의 목록으로 가는 링크를 붙인다. */
function SourceValue({ advertiser }: { advertiser: Advertiser }) {
  const label = ADVERTISER_SOURCE_LABELS[advertiser.source];
  if (advertiser.adInquiryId === undefined) {
    return <>{label}</>;
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      {label} {advertiser.adInquiryId}번
      <Link to="/business/ad-inquiries" className="text-sm text-blue-600 underline">
        광고 문의 보기
      </Link>
    </span>
  );
}

/** 회원 광고주는 비즈니스 회원 정보를 그대로 보인다. 고치려면 회원 상세로 간다. */
function MemberInfo({ advertiser, userId }: { advertiser: Advertiser; userId: number }) {
  const { data: member, isError } = useCompanyMemberDetail(userId);
  return (
    <>
      <DescriptionList
        className="pt-4"
        columns={2}
        items={[
          { label: '구분', value: <AdvertiserName advertiser={advertiser} /> },
          { label: '회원 상태', value: member ? <MemberStatusBadge value={member.status} /> : '-' },
          { label: '회사명', value: member?.organizationName ?? advertiser.name },
          { label: '계정 이메일', value: member?.email ?? '-' },
          { label: '담당자', value: member?.managerName ?? advertiser.contactName ?? '-' },
          {
            label: '담당자 연락처',
            value: member?.managerPhone ?? advertiser.contactPhone ?? '-',
          },
        ]}
      />
      {isError ? (
        <Callout tone="error" className="mt-4">
          비즈니스 회원 정보를 불러오지 못했습니다.
        </Callout>
      ) : null}
      <p className="pt-4 text-sm text-gray-500">
        회원 광고주의 정보는 비즈니스 회원 정보를 따릅니다.{' '}
        <Link to={`/members/companies/${userId}`} className="text-blue-600 underline">
          비즈니스 회원 상세 보기
        </Link>
      </p>
    </>
  );
}

function SectionHeader({ title, action }: { title: string; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 pt-8 pb-3">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {action}
    </div>
  );
}

function BannerSection({
  query,
  onAdd,
  notify,
}: {
  query: ReturnType<typeof useAdvertiserBanners>;
  onAdd: () => void;
  notify: Notify;
}) {
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const deleteMutation = useDeleteBanner();
  const rows = query.data ?? [];

  const columns: DataTableColumn<Banner>[] = [
    {
      key: 'placement',
      header: '자리',
      width: 'w-28 whitespace-nowrap',
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-gray-900">{PLACEMENT_LABELS[row.placement]}</span>
          <span className="text-xs text-gray-500">{row.displayOrder}번</span>
        </span>
      ),
    },
    {
      key: 'image',
      header: '이미지',
      width: 'w-56',
      render: (row) => (
        <img
          src={bannerImageSrc(row.pcImageUrl)}
          alt=""
          className={cn(
            'rounded border border-gray-200 object-cover',
            PC_IMAGE_SPECS[row.placement].aspectClassName,
            row.placement === 'JOB_DETAIL_SIDE' ? 'w-20' : 'w-52',
          )}
        />
      ),
    },
    {
      key: 'name',
      header: '이름',
      render: (row) => (
        <span className="flex items-center gap-2 font-medium text-gray-900">
          {row.name}
          {row.showAdLabel ? (
            <Badge tone="urgent" className="shrink-0 whitespace-nowrap">
              광고 표시
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: 'link',
      header: '링크',
      width: 'w-48 max-w-48',
      render: (row) => <BannerLinkCell banner={row} notify={notify} />,
    },
    {
      key: 'period',
      header: '노출 기간(KST)',
      width: 'w-64',
      render: (row) => <BannerPeriodCell banner={row} notify={notify} />,
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-24',
      render: (row) => {
        const badge = BANNER_STATUS_BADGES[bannerStatus(row)];
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    },
    {
      key: 'enabled',
      header: '켜기',
      width: 'w-24',
      render: (row) => <BannerToggle banner={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-24 whitespace-nowrap',
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Button
            size="sm"
            variant="secondary"
            aria-label={`${row.name} 삭제`}
            className="border-red-200 text-error hover:bg-red-50"
            onClick={() => {
              deleteMutation.reset();
              setDeleting(row);
            }}
          >
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <SectionHeader
        title={`배너 ${formatCount(rows.length)}건`}
        action={
          <Button size="sm" onClick={onAdd}>
            배너 추가
          </Button>
        }
      />
      {query.isError ? <Callout tone="error">배너를 불러오지 못했습니다.</Callout> : null}
      {!query.isPending && !query.isError && rows.length === 0 ? (
        <EmptyState
          title="이 광고주의 배너가 없습니다"
          description="계약을 고르고 자리를 체크하면 기간과 광고주가 채워진 배너를 한 번에 만듭니다."
          action={
            <Button size="sm" onClick={onAdd}>
              배너 추가
            </Button>
          }
        />
      ) : (
        <>
          <p className="pb-3 text-sm text-gray-500">
            링크와 노출 기간은 칸을 눌러 바로 고칩니다. 다른 칸은 행을 눌러 고칩니다.
          </p>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            onRowClick={setEditing}
            isLoading={query.isPending}
            emptyMessage="이 광고주의 배너가 없습니다."
          />
        </>
      )}

      {editing ? (
        <BannerFormModal
          key={editing.id}
          open
          placement={editing.placement}
          banner={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.name ?? ''}
        description="사용자 화면에서도 즉시 사라집니다."
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify(`배너 ${deleting.name} 을(를) 지웠습니다.`);
                setDeleting(null);
              },
            });
          }
        }}
      />
    </>
  );
}

function BannerPeriodCell({ banner, notify }: { banner: Banner; notify: Notify }) {
  const patch = usePatchBanner(banner.id);
  return (
    <InlinePeriodCell
      name={banner.name}
      value={banner}
      contract={banner.contract}
      onSave={async (period) => {
        await patch.mutateAsync(period);
        notify('배너 노출 기간을 고쳤습니다.');
      }}
    />
  );
}

function BannerLinkCell({ banner, notify }: { banner: Banner; notify: Notify }) {
  const patch = usePatchBanner(banner.id);
  return (
    <InlineLinkCell
      name={banner.name}
      value={banner.linkUrl}
      onSave={async (linkUrl) => {
        await patch.mutateAsync({ linkUrl });
        notify('배너 링크를 고쳤습니다.');
      }}
    />
  );
}

function BannerToggle({ banner }: { banner: Banner }) {
  const toggle = useToggleBanner(banner.placement, banner.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={banner.enabled}
        disabled={toggle.isPending}
        label={banner.enabled ? '켜짐' : '꺼짐'}
        onChange={(next) => toggle.mutate(next)}
      />
    </span>
  );
}

function AdPostingSection({
  query,
  onAdd,
  notify,
}: {
  query: ReturnType<typeof useAdvertiserAdPostings>;
  onAdd: () => void;
  notify: Notify;
}) {
  const [editing, setEditing] = useState<AdPosting | null>(null);
  const [deleting, setDeleting] = useState<AdPosting | null>(null);
  const deleteMutation = useDeleteAdPosting();
  const rows = query.data ?? [];

  const columns: DataTableColumn<AdPosting>[] = [
    {
      key: 'placement',
      header: '자리',
      width: 'w-36 whitespace-nowrap',
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-gray-900">{AD_PLACEMENT_LABELS[row.placement]}</span>
          <span className="text-xs text-gray-500">순서 {row.displayOrder}번</span>
        </span>
      ),
    },
    {
      key: 'target',
      header: '대상',
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">{row.targetTitle || '지워진 대상'}</span>
          <span className="text-xs text-gray-500">
            {row.targetCompanyName} · {row.targetId}번
          </span>
        </span>
      ),
    },
    {
      key: 'period',
      header: '노출 기간(KST)',
      width: 'w-56',
      render: (row) => <AdPostingPeriodCell adPosting={row} notify={notify} />,
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-32',
      render: (row) => {
        const badge = AD_POSTING_STATUS_BADGES[adPostingStatus(row)];
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    },
    {
      key: 'enabled',
      header: '켜기',
      width: 'w-24',
      render: (row) => <AdPostingToggle adPosting={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-24 whitespace-nowrap',
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Button
            size="sm"
            variant="secondary"
            aria-label={`${row.targetTitle} 광고 삭제`}
            className="border-red-200 text-error hover:bg-red-50"
            onClick={() => {
              deleteMutation.reset();
              setDeleting(row);
            }}
          >
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <SectionHeader
        title={`광고 공고 ${formatCount(rows.length)}건`}
        action={
          <Button size="sm" onClick={onAdd}>
            광고 공고 추가
          </Button>
        }
      />
      {query.isError ? <Callout tone="error">광고 공고를 불러오지 못했습니다.</Callout> : null}
      {!query.isPending && !query.isError && rows.length === 0 ? (
        <EmptyState
          title="이 광고주의 광고 공고가 없습니다"
          description="광고할 공고를 한 번 고르고 자리를 여러 개 체크하면 자리마다 하나씩 만듭니다."
          action={
            <Button size="sm" onClick={onAdd}>
              광고 공고 추가
            </Button>
          }
        />
      ) : (
        <>
          <p className="pb-3 text-sm text-gray-500">
            노출 기간은 칸을 눌러 바로 고칩니다. 대상 공고는 바꿀 수 없어 지우고 새로 더합니다.
            순서는 그 자리 안의 순서이고 다른 광고주의 광고와 함께 정해지므로 광고 공고 세팅에서
            바꿉니다.
          </p>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            onRowClick={setEditing}
            isLoading={query.isPending}
            emptyMessage="이 광고주의 광고 공고가 없습니다."
          />
        </>
      )}

      {editing ? (
        <AdPostingFormModal
          key={editing.id}
          placement={editing.placement}
          adPosting={editing}
          takenTargetIds={new Set()}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.targetTitle || '광고 공고'}
        description="사용자 화면에서도 즉시 사라집니다. 그 자리의 남은 광고 순서는 앞으로 당겨집니다."
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify('광고 공고를 지웠습니다.');
                setDeleting(null);
              },
            });
          }
        }}
      />
    </>
  );
}

function AdPostingPeriodCell({ adPosting, notify }: { adPosting: AdPosting; notify: Notify }) {
  const update = useUpdateAdPosting(adPosting.placement, adPosting.id);
  return (
    <InlinePeriodCell
      name={adPosting.targetTitle}
      value={adPosting}
      contract={adPosting.contract}
      onSave={async (period) => {
        await update.mutateAsync(period);
        notify('광고 공고 노출 기간을 고쳤습니다.');
      }}
    />
  );
}

function AdPostingToggle({ adPosting }: { adPosting: AdPosting }) {
  const update = useUpdateAdPosting(adPosting.placement, adPosting.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={adPosting.enabled}
        disabled={update.isPending}
        label={adPosting.enabled ? '켜짐' : '꺼짐'}
        onChange={(next) => update.mutate({ enabled: next })}
      />
    </span>
  );
}
