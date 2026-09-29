'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@ogonggo/ui';
import { OPEN_CHAT_ROOMS, type OpenChatPreview } from '../model/openChatRooms';

/**
 * 카카오 오픈채팅방 배너(목업 `개인정보/image.png`의 노란 띠).
 *
 * 배너 하나가 주소 하나로 가지 않고 모달을 여는 이유는, 받은 것이 단일 채널이 아니라 **직무별
 * 방 넷**이기 때문이다. 배너에 넷을 늘어놓으면 목업의 한 줄짜리 띠가 아니게 되고, 넷 중 하나를
 * 골라 배너에 걸면 나머지 셋으로 갈 길이 없어진다.
 *
 * `iframe`으로 방을 품지 않는다. 오픈채팅 주소는 "카카오톡으로 열기" 안내 페이지이고 실제
 * 입장은 앱이 한다. 액자에 넣으면 그 안내 페이지가 갇힌 채 보일 뿐 입장은 여전히 앱에서
 * 일어나므로, 액자가 하는 일이 없다.
 *
 * 방은 카카오톡에 링크를 붙였을 때처럼 미리보기 카드로 보인다 — 대표 이미지, 방 이름, 주소.
 * 이름과 이미지는 각 방의 `og:title`·`og:image` 를 서버가 읽어 준다(`app/open-chat-previews/route.ts`).
 * 모달을 처음 열 때 한 번 받고, 받기 전이나 못 받았으면 직무 이름만 적은 카드로 그린다.
 *
 * 노랑은 카카오 브랜드 색 `#FEE500`을 그대로 쓴다. `tokens.css`에 노랑 스케일이 없고, 있더라도
 * 이 색은 팔레트의 한 단계가 아니라 남의 브랜드 색이라 가까운 값으로 바꿀 수 없다.
 */
export function KakaoChannelBanner() {
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<OpenChatPreview[] | null>(null);

  // 처음 열 때만 받는다. 실패하면 빈 목록으로 두고 직무 이름 카드로 그린다.
  useEffect(() => {
    if (!open || previews) return;
    let active = true;
    fetch('/open-chat-previews')
      .then((response) => (response.ok ? (response.json() as Promise<OpenChatPreview[]>) : []))
      .catch(() => [])
      .then((result) => {
        if (active) setPreviews(result);
      });
    return () => {
      active = false;
    };
  }, [open, previews]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-4 rounded-lg bg-[#FEE500] px-8 py-6 text-left"
      >
        <span>
          <span className="block text-base font-bold text-gray-900">오공고 채팅방 입장하기</span>
          <span className="block pt-1 text-sm text-gray-700">
            직무별 채용공고 큐레이션을 카카오톡으로 받아보세요.
            <br />
            관심 있는 방을 골라 들어가면 됩니다.
          </span>
        </span>
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white"
        >
          Ch+
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="오공고 채팅방 입장하기"
        description="관심 있는 직무의 방을 고르세요. 카카오톡이 열립니다."
      >
        {/*
          닫기 버튼은 `Modal` 이 아니라 부르는 쪽이 넣는다 — `CareerSelectModals` 와 같은 자리,
          같은 모양이다. Esc 와 바깥 클릭으로도 닫히지만 그 둘은 눈에 보이지 않아서, 보이는
          닫는 길이 하나는 있어야 한다.
        */}
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setOpen(false)}
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-900"
        >
          <span className="icon-[lucide--x] block size-5" aria-hidden="true" />
        </button>
        <ul className="flex flex-col gap-3">
          {OPEN_CHAT_ROOMS.map((room) => {
            const preview = previews?.find((item) => item.url === room.url);
            return (
              <li key={room.url}>
                <a
                  href={room.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white pr-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  {/* 카카오 링크 미리보기와 같은 1.91:1 대표 이미지. 받기 전에는 카카오 노랑 자리다. */}
                  <span className="relative block aspect-[1.91/1] w-32 shrink-0 bg-[#FEE500]">
                    {preview?.image ? (
                      <img
                        src={preview.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="icon-[simple-icons--kakaotalk] absolute inset-0 m-auto block h-7 w-7 text-gray-900"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 py-3">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {preview?.title ?? `${room.job} 채용공고 큐레이션`}
                    </span>
                    <span className="block pt-1 text-xs text-gray-400">open.kakao.com</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#FEE500] px-3 py-1.5 text-xs font-semibold text-gray-900 group-hover:brightness-95">
                    입장하기
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
