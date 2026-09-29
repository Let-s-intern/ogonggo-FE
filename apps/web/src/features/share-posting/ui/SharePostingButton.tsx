'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn, useToast } from '@ogonggo/ui';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';
import {
  googleCalendarUrl,
  linkedInShareUrl,
  naverBlogShareUrl,
  shareKindLabel,
  shareUrl,
  xShareUrl,
  type SharePosting,
} from '../model/share';

export interface SharePostingButtonProps {
  posting: SharePosting;
  /**
   * 참이면 글자 없는 아이콘 버튼이다. 모바일에서 신청 버튼 줄(화면 아래 고정 바, `StickyApplyBar`)의
   * 북마크 옆에 둔다 — 전체 폭 버튼을 한 줄 더 넣으면 고정 바가 그만큼 화면을 가린다.
   */
  compact?: boolean;
}

/**
 * 상세 화면 신청 버튼 아래의 `공고 공유하기`. 누르면 공유 창이 뜬다 — 데스크톱은 가운데 모달, 모바일은
 * 아래에서 올라오는 시트다(시안 `공고 공유하기` 데스크톱·모바일).
 *
 * 창을 `<dialog>` 로 만들지 않는다. `showModal()` 은 브라우저 최상위 층에 그려져서, 링크를 복사했다는
 * 토스트(`ToastProvider`, `z-50`)가 창 뒤에 가려진다. 시안은 토스트가 창 위에 떠 있다. 그래서
 * `z-40` 의 고정 층으로 그리고, Esc·바깥 누르기로 닫기와 뒤 화면 스크롤 잠금은 여기서 한다.
 */
export function SharePostingButton({ posting, compact = false }: SharePostingButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {compact ? (
        <button
          type="button"
          aria-label="공고 공유하기"
          onClick={() => setOpen(true)}
          className="flex h-11 shrink-0 items-center justify-center rounded-md border border-gray-300 px-3 text-gray-500"
        >
          <span aria-hidden="true" className="icon-[lucide--share-2] block h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <span aria-hidden="true" className="icon-[lucide--share-2] block h-4 w-4" />
          공고 공유하기
        </button>
      )}
      {open ? <ShareSheet posting={posting} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ShareSheet({ posting, onClose }: { posting: SharePosting; onClose: () => void }) {
  const toast = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
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
  }, [onClose]);

  const url = shareUrl(posting);
  const calendarUrl = googleCalendarUrl(posting, url);
  const label = shareKindLabel(posting.kind);

  const copyLink = (message = `${label} 링크가 클립보드에 복사되었습니다.`) =>
    navigator.clipboard
      .writeText(url)
      .then(() => toast.show({ message }))
      .catch(() => toast.show({ message: '링크를 복사하지 못했습니다.', tone: 'error' }));

  /**
   * 인스타그램은 웹에서 링크를 넘겨받는 공유 주소가 없다. 휴대폰이면 기기 공유 창을 열어 인스타그램
   * DM 을 고르게 한다. 공유 창이 없으면(대부분의 데스크톱) 링크를 복사하고 인스타그램 DM 화면을 새
   * 창으로 열어 붙여 넣게 한다. 전에는 복사만 해서 누른 사람에게는 아무 일도 안 일어난 것처럼 보였다.
   */
  const shareToInstagram = () => {
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      navigator.share({ title: posting.title, url }).catch(() => {
        // 공유 창을 닫은 것도 여기로 온다. 알릴 것이 없다.
      });
      return;
    }
    void copyLink('링크를 복사했어요. 인스타그램 DM 에 붙여 넣어 주세요.');
    openWindow('https://www.instagram.com/direct/inbox/');
  };

  const openWindow = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-gray-950/50 md:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-posting-title"
        className="w-full rounded-t-3xl bg-white px-5 pt-6 pb-8 md:w-[480px] md:rounded-3xl md:px-5 md:pt-6 md:pb-10"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-posting-title" className="text-lg font-bold text-gray-900">
              공고 공유하기
            </h2>
            <p className="mt-2 text-sm break-keep text-gray-800">
              내가 관심 있게 보고 있는 기업의 공고 소식을 공유해보세요.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="공고 공유하기 닫기"
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
          </button>
        </div>

        {/* 무엇을 공유하는지 먼저 보인다 — 상세 헤더와 같은 로고, 이름, 제목. */}
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <CompanyLogo companyName={posting.organizationName} className="h-12 w-12 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">
              {posting.organizationName} · {label}
            </p>
            <p className="truncate text-sm font-bold text-gray-900">{posting.title}</p>
          </div>
        </div>

        <hr className="mt-5 border-gray-200" />

        <p className="mt-5 text-sm text-gray-500">링크 공유</p>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="mt-3 flex h-12 w-full items-center justify-between rounded-lg bg-gray-100 px-3 text-left text-base text-gray-900 hover:bg-gray-200"
        >
          오공고 링크
          <span aria-hidden="true" className="icon-[lucide--copy] block h-5 w-5 text-gray-900" />
        </button>

        {calendarUrl ? (
          <button
            type="button"
            onClick={() => openWindow(calendarUrl)}
            className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 text-base text-gray-600 hover:bg-gray-100"
          >
            <span aria-hidden="true" className="icon-[logos--google-calendar-2020] block h-5 w-5" />
            Google Calendar에 일정 추가하기
          </button>
        ) : null}

        {/*
          카카오톡은 숨겨 둔다. 공유하려면 카카오 JS 앱 키와 SDK 가 있어야 하는데 아직 없다.
          모바일은 한 줄에 다 들어가지 않아 가로로 넘긴다. 시안의 모바일 줄은 맨 앞에 `캘린더 추가` 가 있다.
        */}
        <ul className="-mx-5 mt-8 flex gap-5 overflow-x-auto px-5 md:mx-0 md:justify-between md:gap-0 md:px-0">
          {calendarUrl ? (
            <ShareIcon
              label="캘린더 추가"
              className="bg-gray-100"
              itemClassName="md:hidden"
              onClick={() => openWindow(calendarUrl)}
            >
              <span
                aria-hidden="true"
                className="icon-[logos--google-calendar-2020] block h-7 w-7"
              />
            </ShareIcon>
          ) : null}
          <ShareIcon
            label="instagram"
            className="bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]"
            onClick={shareToInstagram}
          >
            <span
              aria-hidden="true"
              className="icon-[simple-icons--instagram] block h-7 w-7 text-white"
            />
          </ShareIcon>
          <ShareIcon
            label="네이버 블로그"
            className="bg-black"
            onClick={() => openWindow(naverBlogShareUrl(url, posting.title))}
          >
            {/* 시안의 네이버 블로그 표식(`b|`)이다. 아이콘 세트에 같은 모양이 없어 글자로 그린다. */}
            <span aria-hidden="true" className="text-2xl font-extrabold text-[#03C75A]">
              b|
            </span>
          </ShareIcon>
          <ShareIcon
            label="linkedin"
            className="bg-[#0A66C2]"
            onClick={() => openWindow(linkedInShareUrl(url))}
          >
            <span
              aria-hidden="true"
              className="icon-[simple-icons--linkedin] block h-7 w-7 text-white"
            />
          </ShareIcon>
          <ShareIcon
            label="twitter"
            className="bg-black"
            onClick={() => openWindow(xShareUrl(url, posting.title))}
          >
            <span aria-hidden="true" className="icon-[simple-icons--x] block h-6 w-6 text-white" />
          </ShareIcon>
        </ul>
      </div>
    </div>
  );
}

function ShareIcon({
  label,
  className,
  itemClassName,
  onClick,
  children,
}: {
  label: string;
  /** 동그라미의 바탕. */
  className: string;
  /** 항목 전체. 모바일에만 보이는 `캘린더 추가` 가 `md:hidden` 을 준다. */
  itemClassName?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <li className={cn('shrink-0', itemClassName)}>
      <button type="button" onClick={onClick} className="flex min-w-15 flex-col items-center gap-2">
        <span className={cn('flex h-15 w-15 items-center justify-center rounded-full', className)}>
          {children}
        </span>
        <span className="text-sm whitespace-nowrap text-gray-600">{label}</span>
      </button>
    </li>
  );
}
