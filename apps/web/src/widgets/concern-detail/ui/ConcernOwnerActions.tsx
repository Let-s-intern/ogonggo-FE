'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { deleteMyConcern, HttpError } from '@ogonggo/api';
import { ConfirmDelete, useToast } from '@ogonggo/ui';
import type { ConcernCategory } from '@/entities/concern/model/types';
import { ConcernFormModal } from '@/features/concern-form';
import { useConcernMine } from '../model/useConcernMine';

export interface ConcernOwnerActionsProps {
  concernId: number;
  /** 삭제 확인 창에 보일 글 제목이자 수정 모달의 처음 제목. */
  title: string;
  /** 수정 모달의 처음 값. 서버가 그린 글의 값이라 수정한 뒤 화면이 다시 그려지면 새 값으로 바뀐다. */
  category: ConcernCategory;
  content: string;
}

/** 확인 창에 보일 제목 앞부분 길이. 긴 제목을 통째로 넣으면 확인 창이 본문이 된다. */
const TITLE_PREVIEW_LENGTH = 20;

/**
 * 내 글의 `수정 | 삭제`. 서버가 그린 화면에는 없고, 로그인한 사람이 내 글을 보고 있다고 확인된 뒤에
 * 나타난다(`useConcernMine`). 자리는 작성자 줄 오른쪽 끝이다 — 줄 높이가 아바타(24px) 로 정해져 있어
 * 버튼이 나타나도 아래 내용이 밀리지 않는다.
 *
 * 삭제는 저장소의 삭제 확인(`ConfirmDelete`) 을 거친 뒤 `DELETE` 하고 목록으로 보낸다. 지운 글로 돌아오면
 * 404 라 `replace` 로 기록을 바꾼다.
 *
 * 수정은 수정 모달(`features/concern-form`) 을 이 글의 값으로 연다. 저장하면 모달이 `router.refresh()` 로
 * 서버가 그린 본문을 다시 읽어 새 제목·본문이 보인다. `mine` 은 글을 고쳐도 바뀌지 않아 `useConcernMine` 의
 * 캐시는 건드리지 않는다. 내 글일 때만 이 버튼이 보이므로 비로그인은 여기까지 오지 않는다.
 */
export function ConcernOwnerActions({
  concernId,
  title,
  category,
  content,
}: ConcernOwnerActionsProps) {
  const mine = useConcernMine(concernId);
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);

  const remove = useMutation({
    mutationFn: () => deleteMyConcern(concernId),
    onSuccess: () => {
      toast.show({ message: '고민글을 삭제했어요' });
      router.replace('/concerns');
    },
  });

  if (!mine) {
    return null;
  }

  const actionClass = 'text-xs text-gray-400 hover:text-gray-700';

  return (
    <>
      <span className="ml-auto flex shrink-0 items-center gap-1.5">
        <button type="button" onClick={() => setEditing(true)} className={actionClass}>
          수정
        </button>
        <span aria-hidden="true" className="h-2.5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => {
            remove.reset();
            setConfirming(true);
          }}
          className={actionClass}
        >
          삭제
        </button>
      </span>
      <ConfirmDelete
        open={confirming}
        targetName={preview(title)}
        isDeleting={remove.isPending}
        errorMessage={remove.isError ? failureMessage(remove.error) : undefined}
        onConfirm={() => {
          if (!remove.isPending) {
            remove.mutate();
          }
        }}
        onClose={() => setConfirming(false)}
      />
      <ConcernFormModal
        open={editing}
        onClose={() => setEditing(false)}
        initial={{ id: concernId, category, title, content }}
      />
    </>
  );
}

function preview(title: string): string {
  return title.length > TITLE_PREVIEW_LENGTH ? `${title.slice(0, TITLE_PREVIEW_LENGTH)}…` : title;
}

/** 403 은 남의 글을 지우려 한 경우, 404 는 그 사이 이미 지워진 글이다. 401 은 재발급 흐름이 먼저 받는다. */
function failureMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 403) {
      return '내가 쓴 글만 삭제할 수 있어요';
    }
    if (error.status === 404) {
      return '이미 삭제된 글이에요';
    }
  }
  return '삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요';
}
