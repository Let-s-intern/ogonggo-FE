'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@ogonggo/ui';
import { SUPPORT_EMAIL } from './ErrorState';

/** 푸터에 적힌 고객센터 번호. 고객센터 모달이 이메일과 함께 보인다. */
export const SUPPORT_PHONE = '0507-0178-8541';

/** 모달을 여는 세 곳의 문구. 제목은 누른 글자와 같게 둔다. */
export const CONTACT_DIALOG_COPY = {
  advertisement: {
    title: '광고 상품 문의',
    description: '배너 광고 등 광고 상품 문의는 아래 이메일로 보내 주세요. 확인 후 연락드릴게요.',
  },
  partnership: {
    title: '제휴 문의',
    description: '제휴 제안은 아래 이메일로 보내 주세요. 확인 후 연락드릴게요.',
  },
  support: {
    title: '고객센터',
    description: '서비스 이용 중 궁금한 점이나 불편한 점은 아래 이메일로 문의해 주세요.',
  },
} as const;

export interface ContactEmailDialogProps {
  open: boolean;
  onClose: () => void;
  /** 모달 제목. `광고 상품 문의`, `제휴 문의`, `고객센터`. */
  title: string;
  /** 제목 아래 안내 한두 줄. */
  description: string;
  /** 넘기면 이메일 아래에 전화번호 줄을 더한다(고객센터). */
  phone?: string;
}

/**
 * 문의할 이메일을 알려 주는 모달. `광고 상품 문의하기`(홈 배너·모바일 메뉴)와 푸터의 `제휴 문의`·
 * `고객센터` 가 쓴다. 문의 양식이 따로 없어 이메일로 받는다. 주소는 오류 화면의 문의처와 같다
 * (`SUPPORT_EMAIL`).
 *
 * 이메일 칸 옆에 `복사`, 아래에 `메일 보내기`(`mailto:`) 를 둔다. 메일 앱이 연결되지 않은 브라우저에서는
 * `mailto:` 가 아무 일도 하지 않으므로 복사가 먼저다.
 *
 * `<dialog>` 가 아니라 `z-40` 고정 층이다. `showModal()` 은 브라우저 최상위 층에 그려져 복사했다는
 * 토스트(`z-50`)를 가린다 — 공고 공유 창(`features/share-posting`)과 같은 이유다.
 */
export function ContactEmailDialog({
  open,
  onClose,
  title,
  description,
  phone,
}: ContactEmailDialogProps) {
  const toast = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const copyEmail = () =>
    navigator.clipboard
      .writeText(SUPPORT_EMAIL)
      .then(() => toast.show({ message: '이메일 주소를 복사했어요.' }))
      .catch(() => toast.show({ message: '이메일 주소를 복사하지 못했습니다.', tone: 'error' }));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/50 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-email-title"
        className="w-full max-w-[420px] rounded-3xl bg-white px-6 pt-6 pb-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="contact-email-title" className="text-lg font-bold text-gray-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label={`${title} 닫기`}
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
          </button>
        </div>
        <p className="mt-2 text-sm break-keep text-gray-700">{description}</p>

        <p className="mt-5 text-sm text-gray-500">이메일</p>
        <button
          type="button"
          onClick={() => void copyEmail()}
          aria-label={`${SUPPORT_EMAIL} 복사`}
          className="mt-2 flex h-12 w-full items-center justify-between rounded-lg bg-gray-100 px-3 text-left text-base text-gray-900 hover:bg-gray-200"
        >
          {SUPPORT_EMAIL}
          <span aria-hidden="true" className="icon-[lucide--copy] block h-5 w-5" />
        </button>
        {phone ? (
          <p className="mt-3 text-sm text-gray-600">
            전화 <span className="font-medium text-gray-900">{phone}</span>
          </p>
        ) : null}

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-5 flex h-11 w-full items-center justify-center rounded-md bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600"
        >
          메일 보내기
        </a>
      </div>
    </div>
  );
}
