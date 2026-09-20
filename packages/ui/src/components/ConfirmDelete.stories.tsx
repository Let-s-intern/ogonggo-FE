import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { ConfirmDelete, DELETE_CONFIRM_PHRASE } from './ConfirmDelete';

/**
 * 삭제 확인. 열림 상태가 기본이라 스토리를 열면 바로 그려진다.
 *
 * `Modal` 과 같은 이유로 변형을 한 장에 모았다 — `<dialog>` 는 최상위 레이어라 여럿을 나란히
 * 놓을 수 없다. 왼쪽 목록에서 고르면 그 변형이 열린다.
 *
 * 스토리북 프레임 안에서 확인할 것. 삭제 버튼은 처음에 잠겨 있고, 입력란에
 * `삭제하겠습니다.` 를 그대로 쳐야 열린다. 문구는 `DELETE_CONFIRM_PHRASE` 가 정하고 이 설명도
 * 그 상수에서 가져온다.
 *
 * 변형을 바꿀 때 `key` 로 새로 띄운다. 그러지 않으면 `open` 이 계속 `true` 라 컴포넌트가
 * 입력란을 비우는 시점(`open` 이 false 에서 true 로 바뀔 때)을 지나치고, 앞 변형에서 친 문구가
 * 다음 변형에 남는다 — 실제로 그렇게 만들었다가 측정에서 잡혔다.
 */
interface Variant {
  key: string;
  label: string;
  targetName: string;
  description?: string;
  isDeleting?: boolean;
  errorMessage?: string;
}

const VARIANTS: Variant[] = [
  {
    key: 'basic',
    label: '기본 — 대상 이름만',
    targetName: '2026년 8월 한국후지필름 VMD 경력사원 채용',
  },
  {
    key: 'described',
    label: '지운 뒤 무슨 일이 생기는지 덧붙일 때',
    targetName: '오공고 주식회사',
    description: '이 기업이 올린 공고 12 건도 함께 사라집니다.',
  },
  {
    key: 'deleting',
    label: '삭제 중 — 버튼이 잠기고 글자가 바뀐다',
    targetName: '오공고 주식회사',
    isDeleting: true,
  },
  {
    key: 'error',
    label: '실패 — 빨간 안내가 하나 더 붙는다',
    targetName: '오공고 주식회사',
    errorMessage: '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  },
];

const meta: Meta<typeof ConfirmDelete> = {
  component: ConfirmDelete,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ConfirmDelete>;

function ConfirmDeletePlayground() {
  const [openKey, setOpenKey] = useState<string | null>('basic');
  const [lastAction, setLastAction] = useState('아직 없음');
  const current = VARIANTS.find((variant) => variant.key === openKey);

  return (
    <div className="p-8">
      <h1 className="text-lg font-bold text-gray-900">ConfirmDelete</h1>
      <p className="pt-1 pb-4 text-sm text-gray-500">
        누르면 그 변형이 열린다. 삭제 버튼을 열려면 입력란에{' '}
        <code className="text-gray-900">{DELETE_CONFIRM_PHRASE}</code> 를 그대로 친다.
      </p>
      <ul className="flex max-w-lg flex-col gap-2">
        {VARIANTS.map((variant) => (
          <li key={variant.key}>
            <Button
              variant={variant.key === openKey ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setOpenKey(variant.key)}
            >
              {variant.label}
            </Button>
          </li>
        ))}
      </ul>
      <p className="pt-4 text-sm text-gray-500">
        마지막 동작: <span className="font-bold text-gray-900">{lastAction}</span>
      </p>

      {current ? (
        <ConfirmDelete
          key={current.key}
          open
          targetName={current.targetName}
          description={current.description}
          isDeleting={current.isDeleting}
          errorMessage={current.errorMessage}
          onConfirm={() => {
            setLastAction(`삭제 확인 — ${current.targetName}`);
            setOpenKey(null);
          }}
          onClose={() => {
            setLastAction('닫힘');
            setOpenKey(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** 열림 상태가 기본. 변형은 왼쪽 목록에서 고른다. */
export const Variants: Story = {
  render: () => <ConfirmDeletePlayground />,
};
