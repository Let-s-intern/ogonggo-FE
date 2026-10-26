import { useState } from 'react';
import {
  Button,
  Callout,
  Checkbox,
  DataTable,
  Modal,
  Pagination,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { AdminGeneralMemberResponse } from '@ogonggo/api/src/admin';
import { useUserMemberList } from '@/entities/member/api/useMembers';
import { formatCount, formatDate } from '@/shared/lib/format';
import { SearchBox } from '@/widgets/list-toolbar';
import type { SelectedMember } from '../lib/sendForm';

interface MemberPickerModalProps {
  /** 열 때 이미 담겨 있던 회원. 체크된 채로 시작한다. */
  initial: SelectedMember[];
  onCancel: () => void;
  onConfirm: (members: SelectedMember[]) => void;
}

/** 칩에 보일 이름. 닉네임, 없으면 이름이다. */
const labelOf = (member: AdminGeneralMemberResponse) => member.nickname ?? member.name ?? '';

/**
 * 발송 대상 회원을 검색해 여러 명 고르는 창. 일반 회원 목록 API(`listGeneralMembers`)를 활동 중 회원(`ACTIVE`)으로
 * 거른다 — 정지·탈퇴 회원에게는 서버가 보내지 않는다.
 *
 * 고른 회원은 검색어를 바꾸거나 페이지를 넘겨도 남는다. `담기` 를 눌러야 폼에 들어가고, `취소` 면 연 때로 돌아간다.
 * 푸시 동의(활성 토큰) 여부로는 거를 수 없다 — API 에 그 필터가 없다.
 */
export function MemberPickerModal({ initial, onCancel, onConfirm }: MemberPickerModalProps) {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState(
    () => new Map(initial.map((member) => [member.userId, member])),
  );
  const { data, isPending, isError } = useUserMemberList({
    page,
    keyword,
    status: 'ACTIVE',
    joinedWithinDays: '',
    role: '',
  });
  const rows = data?.items ?? [];

  const toggle = (member: AdminGeneralMemberResponse, checked: boolean) =>
    setPicked((previous) => {
      const next = new Map(previous);
      if (checked) {
        next.set(member.userId, { userId: member.userId, label: labelOf(member) });
      } else {
        next.delete(member.userId);
      }
      return next;
    });

  const allOnPage = rows.length > 0 && rows.every((row) => picked.has(row.userId));
  const togglePage = (checked: boolean) =>
    setPicked((previous) => {
      const next = new Map(previous);
      for (const row of rows) {
        if (checked) {
          next.set(row.userId, { userId: row.userId, label: labelOf(row) });
        } else {
          next.delete(row.userId);
        }
      }
      return next;
    });

  const columns: DataTableColumn<AdminGeneralMemberResponse>[] = [
    {
      key: 'pick',
      header: '선택',
      width: 'w-14',
      render: (row) => (
        <Checkbox
          checked={picked.has(row.userId)}
          onChange={(checked) => toggle(row, checked)}
          label={<span className="sr-only">{labelOf(row) || row.userId} 선택</span>}
        />
      ),
    },
    { key: 'userId', header: 'ID', width: 'w-20', render: (row) => row.userId },
    {
      key: 'name',
      header: '닉네임·이름',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{row.nickname ?? '-'}</span>
          <span className="text-xs text-gray-500">{row.name ?? '-'}</span>
        </div>
      ),
    },
    { key: 'email', header: '이메일', render: (row) => row.email ?? '-' },
    { key: 'wishField', header: '희망 직군', render: (row) => row.wishField ?? '-' },
    { key: 'joinedAt', header: '가입일', render: (row) => formatDate(row.joinedAt) },
  ];

  return (
    <Modal open title="회원 검색" onClose={onCancel} className="w-[min(56rem,calc(100vw-2rem))]">
      <div className="flex flex-col gap-4 [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
        <div className="flex items-center justify-between gap-4">
          <SearchBox
            value={keyword}
            onSubmit={(next) => {
              setKeyword(next);
              setPage(1);
            }}
            placeholder="닉네임·이메일 검색"
          />
          <Checkbox
            checked={allOnPage}
            onChange={togglePage}
            disabled={rows.length === 0}
            label="이 페이지 모두 선택"
          />
        </div>
        {isError ? (
          <Callout tone="error">회원 목록을 불러오지 못했어요.</Callout>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(row) => row.userId}
              isLoading={isPending}
              emptyMessage="조건에 맞는 회원이 없어요."
            />
            <Pagination
              page={page}
              totalPages={data?.pageInfo.totalPages ?? 1}
              onChange={setPage}
            />
          </>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <span className="text-sm text-gray-700">
            <span className="font-semibold text-blue-600">{formatCount(picked.size)}명</span> 선택됨
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancel}>
              취소
            </Button>
            <Button onClick={() => onConfirm([...picked.values()])}>담기</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
