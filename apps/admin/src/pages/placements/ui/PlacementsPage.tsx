import { Badge, Callout, DataTable, type DataTableColumn } from '@ogonggo/ui';
import { PageHeader } from '@/widgets/page-header';

/**
 * 지면 목록. **읽기 전용이고 값은 하드코딩이다.**
 *
 * 편집 화면을 두지 않는다. 배너 관리는 나중에 제대로 구현할 것이고, 저장되지 않는 폼을 띄워
 * 두면 운영자가 고쳐 놓고 반영되기를 기다린다. 지금 필요한 것은 어떤 지면이 있고 지금 무엇이
 * 걸려 있는지 한눈에 보이는 것까지다(PRD "지면").
 *
 * 아래 문구는 사용자 웹에 하드코딩되어 있는 현재 값을 옮겨 적은 것이다. 히어로 셋은
 * `apps/web/src/widgets/home-hero/ui/HomeHero.tsx` 한 위젯을 쓰고 배지·헤드라인·강조 단어
 * 세 props 로만 달라진다. 중간 배너 자리는 `apps/web/src/views/home/ui/HomePage.tsx` 안에서
 * 아직 회색 div 로 비어 있다.
 */

type PlacementKind = 'HERO' | 'IMAGE';

interface Placement {
  code: string;
  location: string;
  kind: PlacementKind;
  /** 지금 그 자리에 나가고 있는 것. 비어 있으면 아직 아무것도 없다. */
  current: string | null;
}

const PLACEMENTS: Placement[] = [
  {
    code: 'HOME_HERO',
    location: '홈(채용공고) 최상단',
    kind: 'HERO',
    current: '커리어 여정에 딱! 맞는 / 채용공고만 쏙! 보여드려요',
  },
  {
    code: 'BOOTCAMP_HERO',
    location: '부트캠프 목록 최상단',
    kind: 'HERO',
    current: '실무를 배울 수 있는 / 교육만 골라 모았어요',
  },
  {
    code: 'SIDE_STUDY_HERO',
    location: '사이드·스터디 목록 최상단',
    kind: 'HERO',
    current: '혼자 말고, / 함께할 사람을 찾아보세요',
  },
  {
    code: 'HOME_MID',
    location: '홈 인기 공고와 전체 공고 사이',
    kind: 'IMAGE',
    current: null,
  },
];

const KIND_LABEL: Record<PlacementKind, string> = {
  HERO: '문구',
  IMAGE: '이미지·링크',
};

export function PlacementsPage() {
  const columns: DataTableColumn<Placement>[] = [
    {
      key: 'code',
      header: '지면 코드',
      width: 'w-44',
      render: (row) => <span className="font-medium">{row.code}</span>,
    },
    { key: 'location', header: '위치', width: 'w-64', render: (row) => row.location },
    {
      key: 'kind',
      header: '종류',
      width: 'w-32',
      render: (row) => <Badge tone="neutral">{KIND_LABEL[row.kind]}</Badge>,
    },
    {
      key: 'current',
      header: '현재 내용',
      render: (row) =>
        row.current ?? <span className="text-gray-400">비어 있음 (자리만 잡힌 상태)</span>,
    },
  ];

  return (
    <>
      <PageHeader title="지면" />

      <Callout className="mb-4">
        지면은 고정이고 늘리거나 줄이지 않습니다. 지금은 사용자 웹에 하드코딩된 값을 그대로 보여
        주며, 편집은 배너 도메인이 생긴 뒤에 붙입니다.
      </Callout>

      <DataTable columns={columns} rows={PLACEMENTS} rowKey={(row) => row.code} />
    </>
  );
}
