import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { DataTable, type DataTableColumn } from './DataTable';

interface Row {
  id: number;
  title: string;
  company: string;
  status: '게시' | '숨김';
  viewCount: number;
}

const ROWS: Row[] = [
  { id: 1, title: '백엔드 개발자', company: '넥스트웨이브', status: '게시', viewCount: 1284 },
  { id: 2, title: '프론트엔드 개발자', company: '코드그로브', status: '게시', viewCount: 932 },
  { id: 3, title: '데이터 엔지니어', company: '라이트박스', status: '숨김', viewCount: 77 },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'title', header: '제목', render: (row) => row.title },
  { key: 'company', header: '회사', render: (row) => row.company },
  {
    key: 'status',
    header: '게시 상태',
    width: 'w-28',
    render: (row) => (
      <Badge tone={row.status === '게시' ? 'success' : 'danger'}>{row.status}</Badge>
    ),
  },
  {
    key: 'viewCount',
    header: '조회 수',
    align: 'right',
    width: 'w-24',
    render: (row) => row.viewCount.toLocaleString('ko-KR'),
  },
];

const meta: Meta<typeof DataTable<Row>> = {
  component: DataTable,
  args: { columns: COLUMNS, rows: ROWS, rowKey: (row: Row) => row.id },
};
export default meta;

type Story = StoryObj<typeof DataTable<Row>>;

export const Default: Story = {};
export const Clickable: Story = { args: { onRowClick: () => {} } };
export const Loading: Story = { args: { isLoading: true } };
export const Empty: Story = { args: { rows: [] } };
