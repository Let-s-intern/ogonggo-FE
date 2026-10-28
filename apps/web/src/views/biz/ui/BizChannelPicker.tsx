'use client';

import { cn } from '@ogonggo/ui';
import type { ChannelGroup, PromotionChannel } from '../model/apply';
import { INSTAGRAM_FOLLOWERS_LABEL, OPEN_CHAT_ROOM_COUNT, OPEN_CHAT_ROOMS } from '../model/content';

interface BizChannelPickerProps {
  group: ChannelGroup | null;
  room: PromotionChannel | null;
  error?: string;
  onGroupChange: (group: ChannelGroup) => void;
  onRoomChange: (room: PromotionChannel) => void;
}

/**
 * 홍보 채널을 두 단계로 고른다(PRD 5절). 드롭다운 하나에 여덟 개를 늘어놓던 것을 바꿨다.
 *
 * 1. 큰 카드 둘(`인스타그램` / `직무별 오픈채팅방`)과 그 아래 `어디가 맞을지 모르겠어요` 텍스트 버튼.
 * 2. `직무별 오픈채팅방` 을 고르면 방 여섯 곳이 칩으로 펼쳐진다.
 *
 * `어디가 맞을지 모르겠어요` 는 PRD 가 정한 버튼 문구다. 서버에는 `RECOMMENDATION_REQUESTED` 로 간다.
 */
export function BizChannelPicker({
  group,
  room,
  error,
  onGroupChange,
  onRoomChange,
}: BizChannelPickerProps) {
  const card = (value: ChannelGroup, title: string, sub: string) => {
    const selected = group === value;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => onGroupChange(value)}
        className={cn(
          'flex flex-col items-start rounded-xl border px-4 py-3.5 text-left transition-colors',
          selected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300',
        )}
      >
        <span className={cn('text-[15px] font-bold', selected ? 'text-blue-600' : 'text-gray-900')}>
          {title}
        </span>
        <span className="mt-0.5 text-[13px] text-gray-500">{sub}</span>
      </button>
    );
  };

  return (
    <div className="pb-4">
      <p id="biz-channel-label" className="pb-1.5 text-sm font-medium text-gray-700">
        홍보 채널<span className="pl-0.5 text-error">*</span>
      </p>
      <div
        id="biz-channel"
        tabIndex={-1}
        role="radiogroup"
        aria-labelledby="biz-channel-label"
        className="grid grid-cols-2 gap-2 outline-none"
      >
        {card('INSTAGRAM', '인스타그램', `${INSTAGRAM_FOLLOWERS_LABEL} 팔로워`)}
        {card('OPEN_CHAT', '직무별 오픈채팅방', `${OPEN_CHAT_ROOM_COUNT}개 방`)}
      </div>
      <button
        type="button"
        role="radio"
        aria-checked={group === 'RECOMMENDATION'}
        onClick={() => onGroupChange('RECOMMENDATION')}
        className={cn(
          'mt-2 text-sm underline-offset-2 hover:underline',
          group === 'RECOMMENDATION' ? 'font-bold text-blue-600 underline' : 'text-gray-500',
        )}
      >
        어디가 맞을지 모르겠어요
      </button>

      {group === 'OPEN_CHAT' ? (
        <div role="radiogroup" aria-label="오픈채팅방" className="mt-3 flex flex-wrap gap-2">
          {OPEN_CHAT_ROOMS.map((option) => {
            const selected = room === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onRoomChange(option.value)}
                className={cn(
                  'h-10 rounded-[10px] border px-3.5 text-sm transition-colors',
                  selected
                    ? 'border-blue-500 bg-blue-50 font-bold text-blue-600'
                    : 'border-gray-200 font-medium text-gray-700 hover:border-gray-300',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {error ? <p className="pt-1.5 text-sm text-error">{error}</p> : null}
    </div>
  );
}
