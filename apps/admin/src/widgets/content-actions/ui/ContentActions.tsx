import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ActionAlert, Button, ConfirmDelete } from '@ogonggo/ui';
import { useDeleteContent, usePatchBootcamp, usePatchJob } from '@/entities/content/api/useContent';
import { ContentEditor, type ContentEditorField } from '@/widgets/content-editor';

type ContentKind = 'jobs' | 'bootcamps' | 'side-studies';

export interface ContentActionsProps {
  kind: ContentKind;
  id: number;
  title: string;
  /** 수정 가능한 본문 칸. 사이드·스터디는 아직 수정을 붙이지 않아 비운다. */
  fields?: ContentEditorField[];
  /** 삭제 후 돌아갈 목록 주소. */
  listPath: string;
  /**
   * 이 화면에만 있는 버튼. 채용공고의 "운영 값 수정" 이 여기 들어온다.
   *
   * 화면마다 따로 `fixed` 버튼을 그리면 같은 자리에 겹쳐 떠서 글자가 서로를 가린다. 플로팅
   * 자리는 이 묶음 하나가 소유하고, 다른 화면은 버튼만 넘긴다.
   */
  extraActions?: ReactNode;
}

/**
 * 상세 화면의 수정·삭제.
 *
 * 화면 오른쪽 아래 플로팅으로 띄운다. 본문이 길어 아래로 스크롤한 상태에서도 손이 닿아야 하고,
 * 제목 옆에 두면 긴 글을 다 읽고 위로 되돌아가야 한다.
 *
 * 삭제는 문구를 그대로 입력해야 열린다(`ConfirmDelete`). 되돌릴 길이 없어서 그 확인이
 * 되돌리기를 대신한다.
 */
export function ContentActions({
  kind,
  id,
  title,
  fields,
  listPath,
  extraActions,
}: ContentActionsProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);

  const patchJob = usePatchJob(id);
  const patchBootcamp = usePatchBootcamp(id);
  const deleteMutation = useDeleteContent(kind);

  const patchMutation = kind === 'bootcamps' ? patchBootcamp : patchJob;
  const canEdit = kind !== 'side-studies' && fields !== undefined;

  return (
    <>
      {alert ? (
        <ActionAlert
          message={alert.message}
          detail={title}
          nonce={alert.nonce}
          onDismiss={() => setAlert(null)}
        />
      ) : null}

      <div className="fixed right-8 bottom-8 z-40 flex items-center gap-2">
        {extraActions}
        {canEdit ? (
          <Button
            className="rounded-full shadow-[0_8px_24px_-6px_rgba(74,118,255,0.6)]"
            onClick={() => setIsEditing(true)}
          >
            내용 수정
          </Button>
        ) : null}
        <Button
          variant="secondary"
          className="rounded-full border-red-200 bg-white text-error shadow-[0_8px_24px_-6px_rgba(17,24,39,0.25)] hover:bg-red-50"
          onClick={() => setIsDeleting(true)}
        >
          삭제
        </Button>
      </div>

      {canEdit ? (
        <ContentEditor
          open={isEditing}
          title={title}
          fields={fields}
          isSaving={patchMutation.isPending}
          errorMessage={patchMutation.isError ? '저장하지 못했습니다.' : undefined}
          onClose={() => setIsEditing(false)}
          onSave={(input) =>
            patchMutation.mutate(input, {
              onSuccess: () => {
                setIsEditing(false);
                setAlert({ message: '내용을 수정했습니다.', nonce: Date.now() });
              },
            })
          }
        />
      ) : null}

      <ConfirmDelete
        open={isDeleting}
        targetName={title}
        description="사용자 화면에서도 즉시 사라집니다."
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
        onClose={() => setIsDeleting(false)}
        onConfirm={() =>
          deleteMutation.mutate(id, {
            // 지운 글의 상세에 남아 있을 수 없으므로 목록으로 돌아간다.
            onSuccess: () => navigate(listPath, { replace: true }),
          })
        }
      />
    </>
  );
}
