import { useState } from 'react';
import { enumLabel } from '@ogonggo/api/src/admin';
import { Badge, Button, Callout, Card, CardTitle, Field, Input, Textarea } from '@ogonggo/ui';
import type { AdPlacement } from '@ogonggo/api/src/mocks/fixtures/advertisement-types';
import {
  AD_CREATIVE_CONFIRM_LABELS,
  adErrorMessage,
  useRejectAdCreative,
  useUploadAdCreative,
  type AdApplicationItem,
} from '@/entities/advertisement/api/useAdvertisements';
import { formatCount, formatDate, formatDateTime } from '@/shared/lib/format';

const HEADLINE_MAX = 40;

interface AdApplicationItemCardProps {
  applicationId: number;
  /** 검수 단계일 때만 소재를 올리거나 반려한다(목이 아니면 409). */
  reviewing: boolean;
  item: AdApplicationItem;
  /** 구좌 설정을 아직 못 받았으면 없다. 배너 여부와 규격을 여기서 읽는다. */
  placement: AdPlacement | undefined;
}

/**
 * 신청 항목 한 줄: 지면·기간·금액과 소재. 소재 업로드는 이미지 주소를 받는다 — 어드민에 업로드 컴포넌트가 없다
 * (memos `결정-광고시스템-admin-공지카테고리-필드-2026-11-03.md` 의 썸네일과 같은 이유).
 */
export function AdApplicationItemCard({
  applicationId,
  reviewing,
  item,
  placement,
}: AdApplicationItemCardProps) {
  const { creative } = item;
  const isBanner = placement?.format === 'BANNER' || creative.bannerImageUrlPc !== undefined;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle>{item.placementName}</CardTitle>
        {item.displayOrder !== undefined ? (
          <Badge tone="success">노출 {item.displayOrder}번</Badge>
        ) : null}
        {item.couponApplied ? <Badge tone="main">쿠폰</Badge> : null}
      </div>
      <p className="pt-1 text-sm text-gray-500">
        {item.jobField ? `${enumLabel('JobField', item.jobField)} · ` : ''}
        {formatDate(item.startDate)} ~ {formatDate(item.endDate)} · {item.weeks}주 ·{' '}
        {formatCount(item.amount)}원{placement ? ` · 규격 ${placement.spec}` : ''}
      </p>

      <div className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">소재</span>
          <span className="text-gray-500">
            {creative.source === 'UPLOADED' ? '광고주 업로드' : '오공고 제작'}
          </span>
          <Badge tone={creative.confirmStatus === 'APPROVED' ? 'success' : 'neutral'}>
            {AD_CREATIVE_CONFIRM_LABELS[creative.confirmStatus]}
          </Badge>
          {creative.uploadedAt ? (
            <span className="text-xs text-gray-400">
              {formatDateTime(creative.uploadedAt)} 업로드
            </span>
          ) : null}
        </p>
        {creative.headline ? <p className="mt-2 text-gray-900">{creative.headline}</p> : null}
        {creative.skillTags.length > 0 || creative.taskTags.length > 0 ? (
          <p className="mt-1 text-xs text-gray-500">
            {[...creative.skillTags, ...creative.taskTags].join(' · ')}
          </p>
        ) : null}
        {isBanner ? (
          <div className="mt-2 flex flex-wrap gap-3">
            {creative.bannerImageUrlPc ? (
              <img
                src={creative.bannerImageUrlPc}
                alt="PC 배너"
                className="h-12 rounded-sm border border-gray-200 object-cover"
              />
            ) : null}
            {creative.bannerImageUrlMo ? (
              <img
                src={creative.bannerImageUrlMo}
                alt="MO 배너"
                className="h-12 rounded-sm border border-gray-200 object-cover"
              />
            ) : null}
          </div>
        ) : null}
        {creative.revisionRequest ? (
          <p className="mt-2 text-gray-700">광고주 수정 요청 · {creative.revisionRequest}</p>
        ) : null}
        {creative.rejectionReason ? (
          <p className="mt-2 text-error">반려 사유 · {creative.rejectionReason}</p>
        ) : null}
      </div>

      {reviewing ? (
        <div className="grid gap-4 pt-4 md:grid-cols-2">
          <CreativeUploadForm
            key={`upload-${creative.uploadedAt ?? ''}`}
            applicationId={applicationId}
            creativeId={creative.id}
            isBanner={isBanner}
            initial={creative}
          />
          <CreativeRejectForm applicationId={applicationId} creativeId={creative.id} />
        </div>
      ) : (
        <p className="pt-4 text-sm text-gray-500">
          검수 단계에서 소재를 올리거나 반려할 수 있습니다.
        </p>
      )}
    </Card>
  );
}

function CreativeUploadForm({
  applicationId,
  creativeId,
  isBanner,
  initial,
}: {
  applicationId: number;
  creativeId: number;
  isBanner: boolean;
  initial: AdApplicationItem['creative'];
}) {
  const uploadMutation = useUploadAdCreative(applicationId);
  const [pc, setPc] = useState(initial.bannerImageUrlPc ?? '');
  const [mo, setMo] = useState(initial.bannerImageUrlMo ?? '');
  const [headline, setHeadline] = useState(initial.headline ?? '');
  const canSave = isBanner
    ? pc.trim().length > 0 && mo.trim().length > 0
    : headline.trim().length > 0 && headline.trim().length <= HEADLINE_MAX;

  return (
    <div>
      <p className="pb-2 text-sm font-medium text-gray-900">소재 업로드</p>
      {isBanner ? (
        <>
          <Field label="PC 배너 이미지 주소" htmlFor={`creative-pc-${creativeId}`} required>
            <Input
              id={`creative-pc-${creativeId}`}
              value={pc}
              onChange={(event) => setPc(event.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="MO 배너 이미지 주소" htmlFor={`creative-mo-${creativeId}`} required>
            <Input
              id={`creative-mo-${creativeId}`}
              value={mo}
              onChange={(event) => setMo(event.target.value)}
              placeholder="https://"
            />
          </Field>
        </>
      ) : (
        <Field
          label="해석 한 줄"
          htmlFor={`creative-headline-${creativeId}`}
          hint={`${headline.trim().length}/${HEADLINE_MAX}자`}
          required
        >
          <Input
            id={`creative-headline-${creativeId}`}
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
          />
        </Field>
      )}
      {uploadMutation.isError ? (
        <Callout tone="error" className="mb-2">
          {adErrorMessage(uploadMutation.error, '소재를 올리지 못했습니다.')}
        </Callout>
      ) : null}
      <Button
        size="sm"
        disabled={!canSave || uploadMutation.isPending}
        onClick={() =>
          uploadMutation.mutate(
            isBanner
              ? { creativeId, bannerImageUrlPc: pc.trim(), bannerImageUrlMo: mo.trim() }
              : { creativeId, headline: headline.trim() },
          )
        }
      >
        {uploadMutation.isPending ? '올리는 중' : '올리고 광고주 확인 요청'}
      </Button>
    </div>
  );
}

function CreativeRejectForm({
  applicationId,
  creativeId,
}: {
  applicationId: number;
  creativeId: number;
}) {
  const rejectMutation = useRejectAdCreative(applicationId);
  const [reason, setReason] = useState('');

  return (
    <div>
      <p className="pb-2 text-sm font-medium text-gray-900">소재 반려</p>
      <Field
        label="반려 사유"
        htmlFor={`creative-reject-${creativeId}`}
        hint="신청도 검수 단계에서 반려됩니다. 광고주 화면에 그대로 보입니다."
        required
      >
        <Textarea
          id={`creative-reject-${creativeId}`}
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="예: 배너 이미지 규격 불일치(1200×120 필요)"
        />
      </Field>
      {rejectMutation.isError ? (
        <Callout tone="error" className="mb-2">
          {adErrorMessage(rejectMutation.error, '반려하지 못했습니다.')}
        </Callout>
      ) : null}
      <Button
        size="sm"
        variant="secondary"
        className="border-red-200 text-error hover:bg-red-50"
        disabled={!reason.trim() || rejectMutation.isPending}
        onClick={() =>
          rejectMutation.mutate(
            { creativeId, reason: reason.trim() },
            { onSuccess: () => setReason('') },
          )
        }
      >
        {rejectMutation.isPending ? '반려 중' : '반려'}
      </Button>
    </div>
  );
}
