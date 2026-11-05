import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ActionAlert, Button, Callout } from '@ogonggo/ui';
import {
  kstNow,
  type NewJobDetail,
  useNewJobDetail,
  useSetJobInspected,
  useSetJobVisibility,
} from '@/entities/new-job/api/useNewJobQueue';
import { useJobFillRequest } from '@/features/ai-assistant';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { JobEditor } from '@/widgets/job-editor';
import {
  JobReviewHeader,
  JobReviewPanes,
  useInlineJobEdit,
  useUnsavedEdits,
} from '@/widgets/job-review';

const UNSAVED_MESSAGE = '저장하지 않은 고침이 있습니다. 창을 떠나면 사라집니다. 떠날까요?';

/**
 * 채용공고 목록에서 연 공고 편집 창(2026-11-05 사용자). 오늘 올라온 공고 화면의 편집기(`widgets/job-review`)를
 * 그대로 쓴다 — 머리 카드(검수 완료 체크, 내용 수정, 비노출), 분석 칸, 원문 칸, AI 비서 검수 요청. 오늘 공고가 아니어도
 * 연다. 단축키와 앞뒤 넘기기는 없다. 체크와 비노출은 그 건에 머문다.
 *
 * 네이티브 모달(`showModal`)이 아니라 열린 `<dialog>`(`show`)다. 모달로 띄우면 창 밖이 전부 막혀 오른쪽 AI 비서
 * 패널을 읽고 스크롤하고 묻지 못한다. 그래서 창과 어두운 막을 비서 패널 폭(`--assistant-width`)만큼 비켜 세우고,
 * Esc·막 클릭으로 닫기와 뒤 화면 스크롤 막기는 여기서 한다. AI 비서의 화면 읽기는 열린 `dialog` 를 먼저 읽는다
 * (`features/ai-assistant/model/screen.ts`).
 */
export function JobReviewDialog({ jobId, onClose }: { jobId: number; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const detail = useNewJobDetail(jobId);
  const edit = useInlineJobEdit(detail.data);
  const setInspected = useSetJobInspected();
  const setVisibility = useSetJobVisibility();
  const busy = setInspected.isPending || setVisibility.isPending;
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState<{
    message: string;
    detail?: string;
    tone: 'success' | 'danger';
    nonce: number;
  } | null>(null);
  const { hasUnsaved, onDraftChange } = useUnsavedEdits(edit);

  /** 저장하지 않은 고침이 있으면 묻는다(오공고 PICK 화면과 같은 `confirm`). */
  const requestClose = useCallback(() => {
    if (hasUnsaved && !window.confirm(UNSAVED_MESSAGE)) {
      return;
    }
    onClose();
  }, [hasUnsaved, onClose]);
  const requestCloseRef = useRef(requestClose);
  useLayoutEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.show();
      dialog.focus({ preventScroll: true });
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /*
   * Esc 로 닫는다. 열린 `dialog` 는 브라우저가 Esc 를 처리하지 않는다. 위에 진짜 모달(`내용 수정`, 로고 찾기)이 떠
   * 있으면 그것이 먼저 닫히게 두고, AI 비서 패널에서 누른 Esc 는 건드리지 않는다.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        document.querySelector('dialog:modal')
      ) {
        return;
      }
      const target = event.target as Node;
      if (target !== document.body && !dialogRef.current?.contains(target)) {
        return;
      }
      event.preventDefault();
      requestCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // AI 비서가 이 공고의 수정 창을 채워 달라고 했다. 창을 열면 `JobEditor` 가 칸을 채운다. 저장은 하지 않는다.
  const fillRequest = useJobFillRequest(jobId);
  useEffect(() => {
    if (fillRequest) {
      setIsEditing(true);
    }
  }, [fillRequest]);

  const fail = (caught: unknown) =>
    setError(serverErrorMessage(caught) ?? '저장하지 못했습니다. 다시 시도해 주세요.');

  /** 응답을 기다리지 않고 상세 캐시를 고친다. 훅이 무효화해 다시 받으면 서버 값으로 맞춰진다. */
  const patchDetail = (patch: Partial<NewJobDetail>) =>
    queryClient.setQueryData<NewJobDetail>(['admin', 'jobs', jobId], (previous) =>
      previous ? { ...previous, ...patch } : previous,
    );

  const onCheck = (checked: boolean) => {
    if (!detail.data || busy || checked === Boolean(detail.data.inspectedAt)) {
      return;
    }
    setError('');
    setInspected.mutate(
      { jobId, inspected: checked },
      {
        onSuccess: () => patchDetail({ inspectedAt: checked ? kstNow() : null }),
        onError: fail,
      },
    );
  };

  const onToggleHidden = () => {
    if (!detail.data || busy) {
      return;
    }
    const hiding = detail.data.visibility !== 'HIDDEN';
    setError('');
    setVisibility.mutate(
      { jobId, visibility: hiding ? 'HIDDEN' : 'VISIBLE' },
      {
        onSuccess: () => {
          patchDetail({ visibility: hiding ? 'HIDDEN' : 'VISIBLE' });
          setAlert({
            message: hiding ? '비노출로 바꿨습니다.' : '다시 노출했습니다.',
            detail: detail.data?.title,
            tone: hiding ? 'danger' : 'success',
            nonce: Date.now(),
          });
        },
        onError: fail,
      },
    );
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 right-[var(--assistant-width,0px)] z-40 bg-gray-950/40"
        onClick={requestClose}
      />
      <dialog
        ref={dialogRef}
        aria-label={`공고 ${jobId} 편집`}
        tabIndex={-1}
        className="fixed inset-y-4 left-4 right-[calc(var(--assistant-width,0px)+1rem)] z-40 m-0 flex h-auto max-h-none w-auto max-w-none flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-0 outline-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-3">
          <h2 className="text-lg font-bold text-gray-900">공고 편집</h2>
          <div className="flex items-center gap-3">
            <Link
              to={`/content/jobs/${jobId}`}
              className="text-sm text-blue-600 underline"
              onClick={(event) => {
                if (hasUnsaved && !window.confirm(UNSAVED_MESSAGE)) {
                  event.preventDefault();
                }
              }}
            >
              상세 페이지로
            </Link>
            <Button size="sm" variant="secondary" onClick={requestClose} title="닫기 (Esc)">
              닫기
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {alert ? (
            <ActionAlert
              message={alert.message}
              detail={alert.detail}
              tone={alert.tone}
              nonce={alert.nonce}
              onDismiss={() => setAlert(null)}
            />
          ) : null}

          {error ? (
            <Callout tone="error" className="mb-3">
              {error}
            </Callout>
          ) : null}

          {detail.data ? (
            <JobReviewHeader
              job={detail.data}
              busy={busy}
              canEdit
              onCheck={onCheck}
              onEdit={() => setIsEditing(true)}
              onToggleHidden={onToggleHidden}
            />
          ) : detail.isError ? (
            <Callout tone="error">공고를 불러오지 못했습니다.</Callout>
          ) : (
            <p className="text-sm text-gray-500">불러오는 중입니다.</p>
          )}

          {detail.data ? (
            <JobReviewPanes
              jobId={jobId}
              detail={detail}
              edit={edit}
              paneHeightClass="@min-[944px]:h-[calc(100vh-16rem)]"
              onDraftChange={onDraftChange}
            />
          ) : null}

          {detail.data ? (
            <JobEditor
              open={isEditing}
              job={detail.data}
              onClose={() => {
                setIsEditing(false);
                dialogRef.current?.focus({ preventScroll: true });
              }}
              onSaved={() =>
                setAlert({
                  message: '내용을 수정했습니다.',
                  detail:
                    '제목·본문·모집 안내를 고쳤다면 AI 가 만든 분석은 다시 분석을 기다립니다. 운영자가 고친 분석은 그대로입니다.',
                  tone: 'success',
                  nonce: Date.now(),
                })
              }
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
