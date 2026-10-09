'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { deleteMyConcern, HttpError } from '@ogonggo/api';
import { ConfirmDelete, useToast } from '@ogonggo/ui';
import { useConcernMine } from '../model/useConcernMine';

export interface ConcernOwnerActionsProps {
  concernId: number;
  /** 삭제 확인 창에 보일 글 제목. */
  title: string;
  /**
   * `수정` 을 눌렀을 때. 수정 모달(`features/concern-form`, v13 Push 3) 을 여는 쪽이 넘긴다 — 이 컴포넌트는
   * 모달을 알지 못한다. 서버 컴포넌트는 함수를 넘길 수 없으므로 연결할 때 이 컴포넌트를 감싸는
   * 클라이언트 컴포넌트가 필요하다.
   */
  onEdit?: () => void;
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
 */
export function ConcernOwnerActions({ concernId, title, onEdit }: ConcernOwnerActionsProps) {
  const mine = useConcernMine(concernId);
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

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
        <button type="button" onClick={onEdit} className={actionClass}>
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
