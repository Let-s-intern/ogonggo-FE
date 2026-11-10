import { useState } from 'react';
import { Link } from 'react-router';
import { Callout, Modal } from '@ogonggo/ui';
import { useBootcampDetail, useReplaceBootcamp } from '@/entities/content/api/useContent';
import {
  BootcampForm,
  bootcampFormValuesFromDetail,
  toReplaceBootcampRequest,
} from '@/widgets/bootcamp-editor';
import { BootcampDetailBody } from './BootcampDetailBody';

/** 넓은 화면에서 상세·수정 폼이 답답하지 않은 폭. AI 비서 패널이 열려 있으면 그만큼 줄인다. */
const DIALOG_CLASS =
  'w-[min(80rem,calc(100vw-var(--assistant-width,0px)-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto';

/**
 * 부트캠프 목록에서 연 상세 모달(2026-11-10 사용자: 상세를 페이지 이동 대신 모달로). 내용은 상세 화면과 같은
 * `BootcampDetailBody` 다. 열린 건은 목록 주소의 `?bootcamp=<id>` 에 있어 뒤로가기로 닫히고 새로고침해도 남는다.
 *
 * `내용 수정` 도 이 모달 안에서 한다(2026-11-10 사용자). 수정 화면(`BootcampEditPage`)과 같은 폼이고, 저장하거나
 * 취소하면 상세로 돌아온다. 검수 상태와 노출은 바꾸지 않는다 — 운영 값 수정이 바꾼다.
 */
export function BootcampDetailDialog({
  bootcampId,
  listPath,
  onClose,
}: {
  bootcampId: number;
  listPath: string;
  onClose: () => void;
}) {
  const { data, isPending, isError } = useBootcampDetail(bootcampId);
  const mutation = useReplaceBootcamp(bootcampId);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Modal
      open
      title={isEditing ? '부트캠프 내용 수정' : (data?.title ?? '부트캠프')}
      description={isEditing ? data?.title : undefined}
      onClose={onClose}
      className={DIALOG_CLASS}
    >
      {isPending ? (
        <p className="text-sm text-gray-500">불러오는 중입니다.</p>
      ) : isError || !data ? (
        <Callout tone="error">부트캠프를 찾을 수 없습니다.</Callout>
      ) : isEditing ? (
        <>
          {data.status === 'DRAFT' ? (
            <Callout tone="warning" className="mb-4">
              임시저장 과정입니다. 저장하면 고른 모집 상태가 됩니다.
            </Callout>
          ) : null}
          <BootcampForm
            mode="edit"
            initial={bootcampFormValuesFromDetail(data)}
            onSubmit={(values) =>
              mutation.mutate(toReplaceBootcampRequest(values), {
                onSuccess: () => setIsEditing(false),
              })
            }
            onCancel={() => setIsEditing(false)}
            pending={mutation.isPending}
            error={mutation.error}
          />
        </>
      ) : (
        <>
          <p className="mb-4 text-right text-sm">
            <Link
              to={`${listPath}/${data.id}`}
              className="text-gray-500 underline hover:text-gray-900"
            >
              상세 화면으로 열기
            </Link>
          </p>
          <BootcampDetailBody
            data={data}
            listPath={listPath}
            onEdit={() => {
              mutation.reset();
              setIsEditing(true);
            }}
          />
        </>
      )}
    </Modal>
  );
}
