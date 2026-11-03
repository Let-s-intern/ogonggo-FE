'use client';

import { useState } from 'react';
import { enumLabel } from '@ogonggo/api';
import { Badge, Button, Field, Modal, Textarea } from '@ogonggo/ui';
import {
  AD_CREATIVE_CONFIRM_LABELS,
  type AdApplicationItem,
  formatShortDate,
} from '@/entities/advertisement';

export interface CreativePreviewProps {
  item: AdApplicationItem;
  postTitle: string;
  companyName: string;
  /** 검수 단계이고 반려가 아닐 때만 버튼이 켜진다. */
  reviewable: boolean;
  pending: boolean;
  onApprove: () => void;
  onRequestRevision: (message: string) => void;
}

const CONFIRM_TONE = {
  PENDING: 'urgent',
  APPROVED: 'success',
  REVISION_REQUESTED: 'danger',
} as const;

/**
 * 지면별 소재 미리보기(시안 B-05). 배너면 올라온 이미지, 카드 지면이면 공고 정보로 꾸민 카드에 AD 라벨·해석 한 줄·역량
 * 태그를 붙인다. 검수 단계에서 `이대로 게재` 또는 `수정 요청`(사유 입력)을 누른다.
 */
export function CreativePreview({
  item,
  postTitle,
  companyName,
  reviewable,
  pending,
  onApprove,
  onRequestRevision,
}: CreativePreviewProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { creative } = item;
  const status = creative.confirmStatus;

  return (
    <li className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">{item.placementName}</span>
        <span className="text-xs text-gray-500">
          {item.jobField ? `${enumLabel('JobField', item.jobField)} · ` : ''}
          {formatShortDate(item.startDate)} ~ {formatShortDate(item.endDate)}
        </span>
        <Badge tone={CONFIRM_TONE[status]} className="ml-auto rounded-full">
          {AD_CREATIVE_CONFIRM_LABELS[status]}
        </Badge>
      </div>

      {creative.bannerImageUrlPc ? (
        <div className="relative overflow-hidden rounded-xs border border-gray-200">
          <img
            src={creative.bannerImageUrlPc}
            alt={`${item.placementName} 배너 소재`}
            className="h-24 w-full object-cover"
          />
          <span className="absolute top-1.5 right-1.5 rounded-xs bg-gray-900/70 px-1 text-[10px] font-bold text-white">
            AD
          </span>
        </div>
      ) : (
        <div className="relative flex flex-col gap-1 rounded-md border border-gray-200 bg-gray-50 p-4">
          <span className="absolute top-2 right-2 rounded-xs bg-gray-900/70 px-1 text-[10px] font-bold text-white">
            AD
          </span>
          <span className="text-xs text-gray-500">{companyName}</span>
          <span className="text-sm font-bold text-gray-900">{postTitle}</span>
          {creative.headline ? (
            <span className="text-sm text-blue-600">{creative.headline}</span>
          ) : null}
          {creative.skillTags.length > 0 ? (
            <span className="flex flex-wrap gap-1 pt-1">
              {creative.skillTags.slice(0, 2).map((tag) => (
                <Badge key={tag} tone="main" className="rounded-full">
                  {tag}
                </Badge>
              ))}
            </span>
          ) : null}
        </div>
      )}

      {creative.rejectionReason ? (
        <p className="rounded-xs bg-red-50 px-3 py-2 text-sm text-error">
          반려 사유 · {creative.rejectionReason}
        </p>
      ) : null}
      {status === 'REVISION_REQUESTED' && creative.revisionRequest ? (
        <p className="rounded-xs bg-orange-50 px-3 py-2 text-sm text-orange-700">
          요청한 수정 · {creative.revisionRequest}
        </p>
      ) : null}

      {reviewable && status === 'PENDING' ? (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => setOpen(true)}
          >
            수정 요청
          </Button>
          <Button type="button" size="sm" disabled={pending} onClick={onApprove}>
            이대로 게재
          </Button>
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="소재 수정 요청"
        description={item.placementName}
      >
        <Field label="고칠 내용" htmlFor={`revision-${creative.id}`} required>
          <Textarea
            id={`revision-${creative.id}`}
            rows={4}
            maxLength={500}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="예) 해석 한 줄을 '첫 PO 커리어를 시작하고 싶다면'으로 바꿔 주세요"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-5">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            type="button"
            disabled={!message.trim() || pending}
            onClick={() => {
              onRequestRevision(message.trim());
              setOpen(false);
              setMessage('');
            }}
          >
            요청 보내기
          </Button>
        </div>
      </Modal>
    </li>
  );
}
