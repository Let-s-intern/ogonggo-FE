'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { AlertIcon, CloseIcon } from '@/shared/ui/icons';

export interface JobDetailModalProps {
  /**
   * 닫았을 때 갈 주소. `?job=` 만 뺀 지금 달력 주소이므로 보고 있던 날짜와 뷰(월간·주간)가
   * 그대로 남는다.
   */
  closeHref: string;
  /**
   * 모달 본문. **서버에서 그려져 내려온다** — 달력 페이지가 `JobDetailView` 를 렌더해
   * 이 자리에 꽂는다. 이 컴포넌트는 껍데기만 맡고 상세를 직접 받아오지 않는다.
   */
  children: ReactNode;
}

/**
 * 달력에서 공고를 누르면 뜨는 상세 모달(`docs/asset/공고달력 클릭시.png`).
 *
 * 열림 상태는 지역 상태가 아니라 URL 이다(`?job=<id>`). 이 컴포넌트는 그 파라미터가 있을 때만
 * 마운트되므로 `open` 은 늘 참이고, 닫는 일은 파라미터를 빼는 이동이 한다. 그래서 뒤로가기가
 * 곧 닫기이고 주소를 그대로 복사해 보내면 같은 모달이 열린다(PRD 7절, 다른 화면들이 탭·
 * 페이지네이션을 쿼리에 두는 것과 같다).
 *
 * 닫을 때 `replace` 인 것은 히스토리를 늘리지 않기 위해서다. 여는 이동이 `push` 라
 * (`MonthGrid`·`WeekGrid` 의 `eventClick`) 닫으면 항목이 하나 늘었다가 그 자리를 되돌려
 * 받는 셈이 되고, 닫은 뒤 뒤로가기는 모달을 다시 여는 대신 달력에 오기 전으로 간다.
 * `router.back()` 은 쓰지 않는다 — `?job=` 이 붙은 주소로 바로 들어온 경우 되돌아갈 자리가
 * 이 사이트가 아니다.
 *
 * 포커스 트랩·`Esc`·바깥 클릭·배경 스크롤 잠금은 Radix Dialog 가 한다
 * (`MiniCalendarPopover` 가 Popover 를 쓰는 것과 같은 이유).
 */
export function JobDetailModal({ closeHref, children }: JobDetailModalProps) {
  const router = useRouter();

  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next) {
          router.replace(closeHref);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50" />
        {/*
          목업의 모달은 화면 위아래로 여백을 조금 남기고 그 안에서 내용이 스크롤된다. 상세는
          길이가 정해져 있지 않아(본문 섹션이 공고마다 다르다) 패널 높이를 고정하지 않고
          최대치만 준다.
        */}
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-80px)] w-[calc(100vw-32px)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-white"
        >
          {/*
            제목은 화면에 그리지 않는다. 목업에 제목 줄이 따로 없고 공고 제목은 본문 헤더
            카드가 이미 크게 보여주는데, Radix 는 `Dialog.Title` 이 없으면 콘솔에 경고를
            남긴다 — 보이지 않게 두어 스크린 리더에만 읽히게 한다.
          */}
          <Dialog.Title className="sr-only">채용공고 상세</Dialog.Title>
          <Dialog.Close
            aria-label="닫기"
            className="absolute right-6 top-6 z-10 rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <CloseIcon className="h-5 w-5" />
          </Dialog.Close>
          <div className="overflow-y-auto px-6 pb-8 pt-14">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * `?job=` 이 가리키는 공고가 없을 때 모달 안에 뜨는 문구.
 *
 * 화면 전체를 404 로 보내지 않는다 — 뒤에 있던 달력까지 사라지고, 사용자가 한 일은 달력에서
 * 항목 하나를 누른 것뿐이다. 닫으면 보던 달력으로 돌아간다.
 *
 * 마감이 지나 내려간 공고가 대부분이라 문구를 그렇게 잡았다. `ErrorState`(전체 화면 오류)를
 * 쓰지 않는 것은 그쪽이 `min-h-[70vh]` 짜리 `<main>` 이라 모달 안에 들어갈 모양이 아니기
 * 때문이다.
 */
export function JobDetailModalMissing() {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <AlertIcon className="h-11 w-11 text-gray-300" />
      <p className="mt-6 text-lg font-bold text-gray-900">공고를 찾을 수 없어요</p>
      <p className="mt-2 text-sm text-gray-500">마감되어 내려갔거나 주소가 바뀐 것 같아요.</p>
    </div>
  );
}
