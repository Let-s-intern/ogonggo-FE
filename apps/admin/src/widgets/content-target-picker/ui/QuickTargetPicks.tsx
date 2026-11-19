import { Button } from '@ogonggo/ui';
import { targetKey, type ContentTarget } from './ContentTargetPicker';

interface QuickTargetPicksProps {
  /** 바로 고를 대상. 부르는 쪽이 자리에 맞는 종류만 걸러 넘긴다. 비면 아무것도 그리지 않는다. */
  targets: ContentTarget[];
  /** 이미 그 자리에 걸린 대상(`targetKey`). 고를 수 없다. */
  takenKeys: Set<string>;
  onPick: (target: ContentTarget) => void;
}

/**
 * 계약에 이미 등록된 광고할 공고를 검색 없이 한 번에 고르는 줄(2026-11-20 사용자 요청). 계약 상세의 상품 넣기와 광고 공고
 * 모달이 검색(`ContentTargetPicker`) 위에 둔다. 다른 공고는 아래 검색으로 고른다.
 */
export function QuickTargetPicks({ targets, takenKeys, onPick }: QuickTargetPicksProps) {
  if (targets.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-gray-500">이 계약의 광고할 공고</p>
      <ul className="flex flex-col gap-1.5">
        {targets.map((target) => {
          const taken = takenKeys.has(targetKey(target));
          return (
            <li
              key={targetKey(target)}
              className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {target.title}
                </span>
                <span className="block text-xs text-gray-500">
                  {target.companyName ? `${target.companyName} · ` : ''}
                  {target.targetId}번
                </span>
              </span>
              <Button
                size="sm"
                variant="secondary"
                aria-label={`${target.title} ${taken ? '이미 걸림' : '고르기'}`}
                disabled={taken}
                onClick={() => onPick(target)}
              >
                {taken ? '이미 걸림' : '고르기'}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="pt-1 text-xs text-gray-500">다른 공고는 아래에서 검색해 고르세요.</p>
    </div>
  );
}
