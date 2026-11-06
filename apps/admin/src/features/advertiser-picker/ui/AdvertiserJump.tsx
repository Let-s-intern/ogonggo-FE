import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input, cn } from '@ogonggo/ui';
import { useAdvertiserList } from '@/entities/advertiser/api/useAdvertisers';
import { AdvertiserName } from '@/entities/advertiser/ui/AdvertiserName';

/** 펼친 목록에 한 번에 보이는 수. 고르기 칸(`AdvertiserField`)과 같다. */
const VISIBLE_COUNT = 8;

/**
 * 광고주 바로 가기(이슈 #573, 2026-11-06 사용자). 광고 계약 목록·상세 위에서 광고주를 검색해 고르면 그 광고주 상세로
 * 간다. 목록은 고르기 칸과 같은 `GET /api/v1/admin/advertisers` 다.
 *
 * 입력에 초점이 있는 동안만 결과를 펼친다. 위아래 화살표로 옮기고 Enter 로 간다. Esc 는 닫는다.
 */
export function AdvertiserJump({ currentId }: { currentId?: number }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { data, isPending, isError } = useAdvertiserList(keyword.trim());
  const results = (data ?? []).slice(0, VISIBLE_COUNT);

  const go = (id: number) => {
    setOpen(false);
    setKeyword('');
    if (id !== currentId) {
      navigate(`/business/advertisers/${id}`);
    }
  };

  return (
    <div className="relative w-80">
      <Input
        role="combobox"
        aria-label="광고주 바로 가기"
        aria-expanded={open}
        aria-controls="advertiser-jump-results"
        autoComplete="off"
        value={keyword}
        placeholder="광고주 바로 가기: 이름·담당자·메일"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setKeyword(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, results.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter') {
            const picked = results[active];
            if (picked) {
              event.preventDefault();
              go(picked.id);
            }
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open ? (
        <div
          id="advertiser-jump-results"
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {isError ? (
            <p className="px-3 py-2 text-sm text-error">광고주 목록을 불러오지 못했습니다.</p>
          ) : isPending ? (
            <p className="px-3 py-2 text-sm text-gray-500">불러오는 중입니다.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">맞는 광고주가 없습니다.</p>
          ) : (
            <ul
              role="listbox"
              aria-label="광고주 바로 가기 결과"
              className="divide-y divide-gray-100"
            >
              {results.map((advertiser, index) => (
                <li key={advertiser.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    // 입력의 blur 보다 먼저 와야 눌린다.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(advertiser.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50',
                      index === active && 'bg-gray-50',
                      advertiser.id === currentId && 'bg-blue-50',
                    )}
                  >
                    <AdvertiserName advertiser={advertiser} />
                    <span className="truncate text-xs text-gray-500">
                      {advertiser.id === currentId ? '보는 중' : (advertiser.contactName ?? '')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
