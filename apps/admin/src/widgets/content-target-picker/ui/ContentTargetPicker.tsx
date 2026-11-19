import { useState } from 'react';
import { Button, Callout, DataTable, Pagination, Tabs, cn } from '@ogonggo/ui';
import { useBootcampList, useJobList } from '@/entities/content/api/useContent';
import { SearchBox } from '@/widgets/list-toolbar';

export type ContentTargetType = 'JOB' | 'BOOTCAMP';

/** 고른 대상. 표에 보일 제목·회사만 들고 있다. */
export interface ContentTarget {
  targetType: ContentTargetType;
  targetId: number;
  title: string;
  companyName: string;
}

const TYPE_TABS = [
  { value: 'JOB' as const, label: '채용공고' },
  { value: 'BOOTCAMP' as const, label: '부트캠프' },
];

export const targetKey = (target: Pick<ContentTarget, 'targetType' | 'targetId'>) =>
  `${target.targetType}:${target.targetId}`;

interface ContentTargetPickerProps {
  /** 이미 고른 대상(`targetKey`). 다시 고를 수 없다. */
  takenKeys: Set<string>;
  onPick: (target: ContentTarget) => void;
  /** 고르는 중이면 버튼을 막는다. */
  disabled?: boolean;
  /** 처음 고른 종류. */
  initialType?: ContentTargetType;
  /** 종류를 하나로 묶는다(부트캠프 목록 자리처럼). 주면 종류 탭이 없다. */
  fixedType?: ContentTargetType;
}

/**
 * 채용공고·부트캠프를 검색해 고른다. 광고 계약의 광고할 공고 연결과 광고 공고 설정이 함께 쓴다.
 *
 * 콘텐츠 목록 API(`GET /api/v1/admin/jobs`·`/bootcamps`)를 그대로 쓴다. 공개 여부로 거르지 않는다 — 광고할 공고는 내린
 * 공고도 연결할 수 있어야 한다. 표의 `공개` 칸으로 가른다.
 */
export function ContentTargetPicker({
  takenKeys,
  onPick,
  disabled = false,
  initialType = 'JOB',
  fixedType,
}: ContentTargetPickerProps) {
  const [chosenType, setChosenType] = useState<ContentTargetType>(initialType);
  const targetType = fixedType ?? chosenType;
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const isBootcamp = targetType === 'BOOTCAMP';
  const common = { page, keyword, visibility: '', source: '', reviewStatus: '' };
  // 훅은 둘 다 부르되 고른 쪽만 켠다. 다른 쪽은 요청이 나가지 않는다.
  const jobs = useJobList({ ...common, recruitmentStatus: '', sort: 'REGISTERED_AT' }, !isBootcamp);
  const bootcamps = useBootcampList({ ...common, status: '', sort: 'REGISTERED_AT' }, isBootcamp);
  const query = isBootcamp ? bootcamps : jobs;
  const rows = (query.data?.items ?? []).map((row) => ({
    targetType,
    targetId: row.id,
    title: row.title,
    companyName: row.companyName,
    visible: row.visibility === 'VISIBLE',
  }));

  return (
    <div className="flex flex-col gap-2">
      {fixedType ? null : (
        <Tabs
          items={TYPE_TABS}
          value={targetType}
          onValueChange={(next) => {
            setChosenType(next);
            setPage(1);
          }}
          aria-label="대상 종류"
          className="max-w-72"
        />
      )}
      <SearchBox
        value={keyword}
        onSubmit={(next) => {
          setKeyword(next);
          setPage(1);
        }}
        placeholder={isBootcamp ? '과정명·운영사 검색' : '제목·회사 검색'}
      />
      {query.isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <div
            className={cn(
              'max-h-[40vh] overflow-y-auto rounded-lg',
              query.isFetching && 'opacity-50',
            )}
          >
            <DataTable
              columns={[
                {
                  key: 'id',
                  header: '번호',
                  width: 'w-20',
                  render: (row) => <span className="text-sm text-gray-500">{row.targetId}</span>,
                },
                { key: 'title', header: '제목', render: (row) => row.title },
                { key: 'company', header: '회사', width: 'w-40', render: (row) => row.companyName },
                {
                  key: 'visible',
                  header: '공개',
                  width: 'w-20',
                  render: (row) => (
                    <span
                      className={cn('text-sm', row.visible ? 'text-gray-900' : 'text-gray-400')}
                    >
                      {row.visible ? '공개' : '비공개'}
                    </span>
                  ),
                },
                {
                  key: 'select',
                  header: '선택',
                  width: 'w-24',
                  render: (row) => {
                    const taken = takenKeys.has(targetKey(row));
                    return (
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`${row.title} ${taken ? '이미 고름' : '고르기'}`}
                        disabled={taken || disabled}
                        onClick={() => onPick(row)}
                      >
                        {taken ? '고름' : '고르기'}
                      </Button>
                    );
                  },
                },
              ]}
              rows={rows}
              rowKey={(row) => row.targetId}
              isLoading={query.isPending}
              emptyMessage="조건에 맞는 대상이 없습니다."
            />
          </div>
          <Pagination
            page={page}
            totalPages={query.data?.pageInfo.totalPages ?? 1}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
