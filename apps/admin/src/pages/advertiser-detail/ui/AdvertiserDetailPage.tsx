import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  ConfirmDelete,
  DataTable,
  DescriptionList,
  Field,
  Modal,
  Select,
  Toggle,
  cn,
  type DataTableColumn,
} from '@ogonggo/ui';
import { AD_POSTING_PLACEMENTS, type AdPostingPlacement } from '@ogonggo/api/src/ad-postings';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';
import { BANNER_PLACEMENTS, type BannerPlacement } from '@ogonggo/api/src/banners';
import {
  useAdPostingList,
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
  useToggleBanner,
  type Banner,
} from '@/entities/banner/api/useBanners';
import {
  BANNER_STATUS_BADGES,
  PC_IMAGE_SPECS,
  PLACEMENT_LABELS,
  bannerImageSrc,
  bannerStatus,
  formatPeriod,
} from '@/entities/banner/lib/banner';
import { useCompanyMemberDetail } from '@/entities/member/api/useMembers';
import { MemberStatusBadge } from '@/shared/config/labels';
import { formatCount } from '@/shared/lib/format';
import { AdPostingFormModal } from '@/widgets/ad-posting-form';
import { BannerFormModal } from '@/widgets/banner-form';
import { PageHeader } from '@/widgets/page-header';
import { AdvertiserEditModal } from './AdvertiserEditModal';

const BACK_TO = { to: '/business/advertisers', label: '광고주별 광고 목록' };

/** 열린 배너 모달. 새 배너는 자리를 먼저 고른다. */
type BannerEditing = { placement: BannerPlacement; banner: Banner | null } | null;
type AdEditing = { placement: AdPostingPlacement; adPosting: AdPosting | null } | null;

/**
 * 광고주별 광고 상세(이슈 #573, 2026-11-06 사용자). 기업 하나의 배너와 광고 공고를 자리와 상관없이 모아 보고, 켜고 끄고,
 * 고치고, 지우고, 더한다. 더할 때는 자리를 먼저 고르고 광고주가 미리 골라진 배너·광고 공고 모달을 연다.
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
  const [editingInfo, setEditingInfo] = useState(false);

  if (isPending && Number.isInteger(advertiserId)) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }
  if (isError || !advertiser) {
    return (
      <>
        <PageHeader title="광고주" backTo={BACK_TO} />
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
      <PageHeader title={advertiser.name} backTo={BACK_TO} />

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

      <BannerSection advertiser={summary} query={banners} />
      <AdPostingSection advertiser={summary} query={adPostings} />

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

/** 자리 고르기. 배너·광고 공고 추가 모달을 열기 전에 한 번 묻는다. */
function PlacementPicker<P extends string>({
  title,
  placements,
  label,
  onPick,
  onClose,
}: {
  title: string;
  placements: readonly P[];
  label: (placement: P) => string;
  onPick: (placement: P) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState<P | undefined>(placements[0]);
  return (
    <Modal open title={title} description="어느 자리에 실을지 먼저 고릅니다." onClose={onClose}>
      <Field label="자리" htmlFor="advertiser-placement">
        <Select
          id="advertiser-placement"
          options={placements.map((placement) => ({ value: placement, label: label(placement) }))}
          value={value}
          onChange={(event) => setValue(event.target.value as P)}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button
          onClick={() => {
            if (value) {
              onPick(value);
            }
          }}
        >
          다음
        </Button>
      </div>
    </Modal>
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
  advertiser,
  query,
}: {
  advertiser: AdvertiserSummary;
  query: ReturnType<typeof useAdvertiserBanners>;
}) {
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<BannerEditing>(null);
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
      key: 'period',
      header: '노출 기간(KST)',
      width: 'w-64',
      render: (row) => <span className="text-sm">{formatPeriod(row)}</span>,
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
          <Button size="sm" onClick={() => setPicking(true)}>
            배너 추가
          </Button>
        }
      />
      {query.isError ? <Callout tone="error">배너를 불러오지 못했습니다.</Callout> : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={(row) => setEditing({ placement: row.placement, banner: row })}
        isLoading={query.isPending}
        emptyMessage="이 광고주의 배너가 없습니다."
      />

      {picking ? (
        <PlacementPicker
          title="배너 추가"
          placements={BANNER_PLACEMENTS}
          label={(placement) => PLACEMENT_LABELS[placement]}
          onClose={() => setPicking(false)}
          onPick={(placement) => {
            setPicking(false);
            setEditing({ placement, banner: null });
          }}
        />
      ) : null}
      {editing ? (
        <BannerFormModal
          key={`${editing.placement}-${editing.banner?.id ?? 'new'}`}
          open
          placement={editing.placement}
          banner={editing.banner}
          initialAdvertiser={editing.banner ? undefined : advertiser}
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
            deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
      />
    </>
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
  advertiser,
  query,
}: {
  advertiser: AdvertiserSummary;
  query: ReturnType<typeof useAdvertiserAdPostings>;
}) {
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<AdEditing>(null);
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
      render: (row) => <span className="text-sm">{formatPeriod(row)}</span>,
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
          <Button size="sm" onClick={() => setPicking(true)}>
            광고 공고 추가
          </Button>
        }
      />
      <p className="pb-3 text-sm text-gray-500">
        순서는 그 자리 안의 순서입니다. 다른 광고주의 광고와 함께 정해지므로 광고 공고 세팅에서
        바꿉니다.
      </p>
      {query.isError ? <Callout tone="error">광고 공고를 불러오지 못했습니다.</Callout> : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={(row) => setEditing({ placement: row.placement, adPosting: row })}
        isLoading={query.isPending}
        emptyMessage="이 광고주의 광고 공고가 없습니다."
      />

      {picking ? (
        <PlacementPicker
          title="광고 공고 추가"
          placements={AD_POSTING_PLACEMENTS}
          label={(placement) => AD_PLACEMENT_LABELS[placement]}
          onClose={() => setPicking(false)}
          onPick={(placement) => {
            setPicking(false);
            setEditing({ placement, adPosting: null });
          }}
        />
      ) : null}
      {editing?.adPosting ? (
        <AdPostingFormModal
          key={`edit-${editing.adPosting.id}`}
          placement={editing.placement}
          adPosting={editing.adPosting}
          takenTargetIds={new Set()}
          onClose={() => setEditing(null)}
        />
      ) : editing ? (
        <NewAdPostingModal
          key={`new-${editing.placement}`}
          placement={editing.placement}
          advertiser={advertiser}
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
            deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
      />
    </>
  );
}

/** 새 광고 공고. 그 자리에 이미 든 대상을 고르지 못하게 자리 목록을 먼저 받는다. */
function NewAdPostingModal({
  placement,
  advertiser,
  onClose,
}: {
  placement: AdPostingPlacement;
  advertiser: AdvertiserSummary;
  onClose: () => void;
}) {
  const { data, isError } = useAdPostingList(placement);
  if (isError) {
    return (
      <Modal open title="광고 공고 추가" onClose={onClose}>
        <Callout tone="error">이 자리의 광고 목록을 불러오지 못했습니다.</Callout>
      </Modal>
    );
  }
  if (!data) {
    return null;
  }
  return (
    <AdPostingFormModal
      placement={placement}
      adPosting={null}
      takenTargetIds={new Set(data.map((row) => row.targetId))}
      initialAdvertiser={advertiser}
      onClose={onClose}
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
