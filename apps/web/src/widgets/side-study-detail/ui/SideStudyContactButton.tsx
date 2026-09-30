'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button, useToast } from '@ogonggo/ui';
import { CONTACT_METHOD_LABELS } from '@/entities/side-study/model/labels';
import type { SideStudyDetail } from '@/entities/side-study/model/types';
import { isSignedIn } from '@/shared/api/authTokens';
import { track, type DataLayerEvent } from '@/shared/analytics/dataLayer';

export interface SideStudyContactButtonProps {
  label: string;
  contact: SideStudyDetail['contact'];
  /** 버튼을 누를 때 보낼 GTM 이벤트(`program_apply_click`). */
  applyEvent: DataLayerEvent;
}

/**
 * 사이드·스터디 상세의 `신청하러 가기`. 누르면 작성자가 적은 연락처(이메일 또는 카카오톡
 * 오픈채팅 링크)를 모달로 보여 준다. 연락처는 정보 그리드의 소통 방법 칸에는 수단 이름만 두고
 * 여기서만 드러낸다.
 *
 * 로그인한 회원만 본다. 비회원은 로그인으로 보내고 돌아올 곳으로 지금 경로를 싣는다.
 *
 * 모달 모양은 `shared/ui/ContactEmailDialog` 와 같다 — `<dialog>` 가 아닌 고정 층이라 복사 토스트가
 * 가려지지 않는다.
 */
export function SideStudyContactButton({
  label,
  contact,
  applyEvent,
}: SideStudyContactButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const email = contact.method === 'EMAIL';

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const onApply = () => {
    track(applyEvent.event, applyEvent.params);
    if (!isSignedIn()) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setOpen(true);
  };

  const copy = () =>
    navigator.clipboard
      .writeText(contact.value)
      .then(() =>
        toast.show({ message: email ? '이메일 주소를 복사했어요.' : '링크를 복사했어요.' }),
      )
      .catch(() => toast.show({ message: '복사하지 못했습니다.', tone: 'error' }));

  // 오픈채팅은 백엔드가 http(s) 주소만 받지만, 그 밖의 값이 오면 여는 버튼 없이 복사만 둔다.
  const openHref = email
    ? `mailto:${contact.value}`
    : /^https?:\/\//i.test(contact.value)
      ? contact.value
      : undefined;

  return (
    <>
      <Button className="flex-1" onClick={onApply}>
        {label}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/50 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="side-study-contact-title"
            className="w-full max-w-[420px] rounded-3xl bg-white px-6 pt-6 pb-7"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="side-study-contact-title" className="text-lg font-bold text-gray-900">
                신청하기
              </h2>
              <button
                ref={closeRef}
                type="button"
                aria-label="신청하기 닫기"
                onClick={() => setOpen(false)}
                className="-mt-1 -mr-1 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
              </button>
            </div>
            <p className="mt-2 text-sm break-keep text-gray-700">
              {email
                ? '아래 이메일로 신청해 주세요.'
                : '아래 카카오톡 오픈채팅방에서 신청해 주세요.'}
            </p>

            <p className="mt-5 text-sm text-gray-500">{CONTACT_METHOD_LABELS[contact.method]}</p>
            <button
              type="button"
              onClick={() => void copy()}
              aria-label={`${contact.value} 복사`}
              className="mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-lg bg-gray-100 px-3 py-2 text-left text-base break-all text-gray-900 hover:bg-gray-200"
            >
              {contact.value}
              <span aria-hidden="true" className="icon-[lucide--copy] block h-5 w-5 shrink-0" />
            </button>

            {openHref ? (
              <a
                href={openHref}
                target={email ? undefined : '_blank'}
                rel={email ? undefined : 'noopener noreferrer'}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-md bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600"
              >
                {email ? '메일 보내기' : '오픈채팅방 열기'}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
