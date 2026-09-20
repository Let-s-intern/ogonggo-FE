import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * 저장소가 실제로 쓰는 아이콘 전부.
 *
 * 고를 수 있는 아이콘의 목록이 아니라 쓰고 있는 아이콘의 목록이다. `@iconify/json` 에는 세트가
 * 백오십 개가 들어 있고 플러그인은 소스에 적힌 것만 CSS 로 뽑으므로, 여기 없는 이름을 써도
 * 그대로 나온다. 여기 있는 것은 "이미 이 이름으로 쓰고 있으니 같은 뜻이면 이걸 쓰라" 는 뜻이다.
 *
 * `className` 을 이름에서 조립하지 않고 항목마다 문자열로 적어 둔 것은 그래야 플러그인 스캐너에
 * 걸리기 때문이다. 조립하면 이 스토리의 아이콘이 통째로 빈칸이 된다.
 *
 * 세트가 두 개인 이유는 `usedBy` 에 적어 두었다 — `lucide` 가 기본이고, `lucide` 에 맞는 모양이
 * 없는 하나만 `tabler` 다. 둘 다 24 그리드에 2px 획이라 같은 줄에 놓아도 굵기가 맞는다.
 *
 * 북마크는 여기 없다. 그림자를 마스크로는 그릴 수 없어 `apps/web/src/shared/ui/icons.tsx` 의
 * `BookmarkIcon` 만 인라인 SVG 로 되돌렸다(`docs/asset/v3-1/bookmark/`).
 */
interface IconEntry {
  name: string;
  className: string;
  usedBy: string;
}

const ICONS: IconEntry[] = [
  {
    name: 'lucide--search',
    className: 'icon-[lucide--search]',
    usedBy: 'SearchIcon, CircleIconButton 스토리',
  },
  { name: 'lucide--eye', className: 'icon-[lucide--eye]', usedBy: 'EyeIcon' },
  {
    name: 'lucide--chevron-down',
    className: 'icon-[lucide--chevron-down]',
    usedBy: 'ChevronIcon (방향은 회전)',
  },
  {
    name: 'lucide--message-circle',
    className: 'icon-[lucide--message-circle]',
    usedBy: 'CommentIcon',
  },
  { name: 'lucide--calendar', className: 'icon-[lucide--calendar]', usedBy: 'CalendarIcon' },
  { name: 'lucide--circle-alert', className: 'icon-[lucide--circle-alert]', usedBy: 'AlertIcon' },
  { name: 'lucide--refresh-cw', className: 'icon-[lucide--refresh-cw]', usedBy: 'RefreshIcon' },
  { name: 'lucide--house', className: 'icon-[lucide--house]', usedBy: 'HomeIcon' },
  { name: 'lucide--list', className: 'icon-[lucide--list]', usedBy: 'ListIcon' },
  { name: 'lucide--user', className: 'icon-[lucide--user]', usedBy: 'UserIcon' },
  { name: 'lucide--building-2', className: 'icon-[lucide--building-2]', usedBy: 'BuildingIcon' },
  {
    name: 'lucide--check',
    className: 'icon-[lucide--check]',
    usedBy: 'Checkbox, CalendarFilterBar, CareerSelectModals, ActionAlert(success)',
  },
  {
    name: 'lucide--x',
    className: 'icon-[lucide--x]',
    usedBy: 'CareerSelectModals 닫기, ActionAlert(danger)',
  },
  { name: 'lucide--circle', className: 'icon-[lucide--circle]', usedBy: 'Tabs 스토리' },
  {
    name: 'tabler--info-small',
    className: 'icon-[tabler--info-small]',
    usedBy: 'ActionAlert(info) — lucide 의 i 는 동그라미 안에 있어 배지와 겹친다',
  },
];

function IconGrid() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (name: string) => {
    void navigator.clipboard.writeText(`icon-[${name}]`).then(
      () => setCopied(name),
      () => setCopied(null),
    );
  };

  return (
    <div className="p-8">
      <p className="pb-1 text-base text-gray-900">
        쓰고 있는 아이콘 {ICONS.length} 개 (lucide{' '}
        {ICONS.filter((i) => i.name.startsWith('lucide--')).length}, tabler{' '}
        {ICONS.filter((i) => i.name.startsWith('tabler--')).length})
      </p>
      <p className="pb-6 text-sm text-gray-500">
        이름을 누르면 <code className="text-gray-700">icon-[lucide--search]</code> 꼴로 복사된다.
        크기는 <code className="text-gray-700">size-5</code> 같은 크기 클래스가 정하고, 색은{' '}
        <code className="text-gray-700">text-*</code> 가 정한다.
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
        {ICONS.map((icon) => (
          <li
            key={icon.name}
            className="flex items-start gap-3 rounded-md border border-gray-200 p-4"
          >
            <span
              aria-hidden="true"
              className={`${icon.className} block size-6 shrink-0 text-gray-900`}
            />
            <span className="flex min-w-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => copy(icon.name)}
                className="truncate text-left text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900"
              >
                {icon.name}
              </button>
              <span className="text-xs text-gray-500">{icon.usedBy}</span>
              <span className="h-4 text-xs text-blue-500">
                {copied === icon.name ? '복사됨' : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const meta: Meta = {
  parameters: { layout: 'fullscreen' },
  render: () => <IconGrid />,
};

export default meta;

export const Icons: StoryObj<typeof meta> = {};
