'use client';

import { useState } from 'react';
import { Modal } from '@ogonggo/ui';

/**
 * 오픈채팅방 넷. 이름은 각 방의 `og:title`에서 그대로 가져왔고(2026-09-21 확인), 앞에 붙는
 * `[렛츠커리어]`와 뒤에 붙는 `채용공고 큐레이션`은 넷이 공유하므로 화면에서는 직무만 남긴다.
 *
 * 비밀이 아니라 공개 초대 주소다. `.env`로 뺄 이유가 없고, 빼면 값이 없는 환경에서 배너가
 * 조용히 빈 모달을 연다.
 */
const OPEN_CHAT_ROOMS = [
  { job: '마케팅', url: 'https://open.kakao.com/o/g9JmRSFh' },
  { job: '세일즈', url: 'https://open.kakao.com/o/gZgMRSFh' },
  { job: '기획/운영', url: 'https://open.kakao.com/o/gPDpSSFh' },
  { job: '인사/HR/경영관리', url: 'https://open.kakao.com/o/ghzwTSFh' },
] as const;

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
 * 노랑은 카카오 브랜드 색 `#FEE500`을 그대로 쓴다. `tokens.css`에 노랑 스케일이 없고, 있더라도
 * 이 색은 팔레트의 한 단계가 아니라 남의 브랜드 색이라 가까운 값으로 바꿀 수 없다.
 */
export function KakaoChannelBanner() {
  const [open, setOpen] = useState(false);

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
        <ul className="flex flex-col gap-2">
          {OPEN_CHAT_ROOMS.map((room) => (
            <li key={room.url}>
              <a
                href={room.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 hover:bg-gray-50"
              >
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{room.job}</span>
                  <span className="block pt-0.5 text-xs text-gray-500">채용공고 큐레이션</span>
                </span>
                <span className="shrink-0 text-sm font-medium text-gray-500">입장하기</span>
              </a>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
