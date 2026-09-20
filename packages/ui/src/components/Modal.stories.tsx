import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { DescriptionList } from './DescriptionList';
import { Modal } from './Modal';

/**
 * 네이티브 `<dialog>` 위에 올린 모달. 열림 상태가 기본이라 스토리를 열면 바로 그려진다.
 *
 * 변형을 스토리로 쪼개지 않고 한 장에 둔 이유는 `<dialog>` 의 최상위 레이어 때문이다. 같은
 * 화면에 모달을 여럿 띄우면 서로를 가리므로, 다른 컴포넌트처럼 나란히 늘어놓을 수가 없다.
 * 대신 왼쪽 목록에서 고르면 그 변형이 열린다 — 한 화면 안에서 네 가지를 오갈 수 있다.
 *
 * 스토리북 프레임 안에서 확인할 것 두 가지. Esc 를 누르면 닫힌다(브라우저가 직접 처리하고
 * `close` 이벤트가 `onClose` 를 부른다). 세 번째 변형은 내용이 길어 모달 안쪽이 스크롤되고,
 * 그동안 뒤 화면은 움직이지 않는다.
 */
interface Variant {
  key: string;
  label: string;
  title: string;
  description?: string;
  body: ReactNode;
}

const DETAIL = [
  { label: '회사', value: '오공고 주식회사' },
  { label: '지역', value: '서울 강남구' },
  { label: '경력', value: '신입' },
  { label: '고용형태', value: '정규직' },
];

const LONG_PARAGRAPHS = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  text: `${index + 1}. 모달 안쪽이 스크롤되는지 보려고 채운 문단이다. 뒤 화면은 열려 있는 동안 스크롤이 잠긴다 — 잠그지 않으면 모달 안에서 스크롤이 끝났을 때 뒤 페이지가 대신 움직인다.`,
}));

const VARIANTS: Variant[] = [
  {
    key: 'basic',
    label: '기본 — 제목과 내용만',
    title: '공고 상세',
    body: <DescriptionList items={DETAIL} />,
  },
  {
    key: 'described',
    label: '제목 아래 보조 문구',
    title: '공고 상세',
    description: '크롤링으로 모은 원문을 그대로 보여줍니다.',
    body: <DescriptionList items={DETAIL} />,
  },
  {
    key: 'scroll',
    label: '내용이 길 때 — 안쪽이 스크롤된다',
    title: '이용 약관',
    description: '아래로 끝까지 내려야 다음으로 넘어갑니다.',
    body: (
      <div className="max-h-72 overflow-y-auto pr-2">
        {LONG_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph.id} className="pb-3 text-sm text-gray-700">
            {paragraph.text}
          </p>
        ))}
      </div>
    ),
  },
  {
    key: 'actions',
    label: '아래에 버튼 두 개',
    title: '이 공고를 삭제할까요?',
    description: '되돌릴 수 없습니다.',
    body: (
      <div className="flex items-center gap-2">
        <Button variant="primary">확인</Button>
        <Button variant="secondary">취소</Button>
      </div>
    ),
  },
];

const meta: Meta<typeof Modal> = {
  component: Modal,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Modal>;

function ModalPlayground() {
  const [openKey, setOpenKey] = useState<string | null>('basic');
  const current = VARIANTS.find((variant) => variant.key === openKey);

  return (
    <div className="p-8">
      <h1 className="text-lg font-bold text-gray-900">Modal</h1>
      <p className="pt-1 pb-4 text-sm text-gray-500">
        누르면 그 변형이 열린다. 지금 열린 것:{' '}
        <span className="font-bold text-gray-900">{current ? current.label : '없음'}</span>
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
      <p className="pt-4 text-xs text-gray-500">
        Esc 를 누르거나 다른 변형을 고르면 닫힌다. 닫힘도 이 한 화면에서 확인할 수 있게 마지막 줄에
        상태를 적어 둔다.
      </p>

      {current ? (
        <Modal
          key={current.key}
          open
          title={current.title}
          description={current.description}
          onClose={() => setOpenKey(null)}
        >
          {current.body}
        </Modal>
      ) : null}
    </div>
  );
}

/** 열림 상태가 기본. 변형은 왼쪽 목록에서 고른다. */
export const Variants: Story = {
  render: () => <ModalPlayground />,
};
