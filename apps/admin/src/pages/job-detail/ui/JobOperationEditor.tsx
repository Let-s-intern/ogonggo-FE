import { useEffect, useState } from 'react';
import { ActionAlert, Button, Callout, Field, Modal, Select, Toggle } from '@ogonggo/ui';
import type { AdminJobDetail } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import { usePatchJob } from '@/entities/content/api/useContent';
import { CONTENT_SOURCE_OPTIONS, JOB_REVIEW_STATUS_OPTIONS } from '@/shared/config/labels';

export interface JobOperationEditorProps {
  job: AdminJobDetail;
}

/**
 * 채용공고의 운영 값을 상세 화면에서 고친다. 본문을 보면서 바로 고칠 수 있어야 해서
 * 화면 오른쪽 아래 플로팅 버튼으로 연다.
 *
 * 고치는 것은 셋뿐이다 — 노출 여부, 등록 경로, 검수 상태. 제목과 본문은 올린 사람이 쓴 글이라
 * 운영자가 손대지 않는다. 고쳐야 할 글이면 반려해서 올린 사람이 고치게 한다.
 *
 * 검수 상태는 등록 경로가 비즈니스 등록일 때만 고를 수 있다. 크롤링 수집분은 검수 대상이
 * 아니라 값 자체가 없다.
 */
export function JobOperationEditor({ job }: JobOperationEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(job.visibility === 'VISIBLE');
  const [source, setSource] = useState<AdminJobDetail['source']>(job.source);
  const [reviewStatus, setReviewStatus] = useState<string>(job.reviewStatus ?? '');
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);

  const patchMutation = usePatchJob(job.id);

  // 서버 값이 바뀌면 폼도 따라간다. 저장 뒤 응답이나 다른 화면에서 고친 값이 여기 반영된다.
  useEffect(() => {
    setVisible(job.visibility === 'VISIBLE');
    setSource(job.source);
    setReviewStatus(job.reviewStatus ?? '');
  }, [job.visibility, job.source, job.reviewStatus]);

  const isDirty =
    visible !== (job.visibility === 'VISIBLE') ||
    source !== job.source ||
    (source === 'COMPANY' && reviewStatus !== (job.reviewStatus ?? ''));

  const close = () => {
    setIsOpen(false);
    // 닫을 때 서버 값으로 되돌린다. 고치다 만 값이 다음에 열었을 때 남아 있으면 헷갈린다.
    setVisible(job.visibility === 'VISIBLE');
    setSource(job.source);
    setReviewStatus(job.reviewStatus ?? '');
  };

  const save = () => {
    patchMutation.mutate(
      {
        visibility: visible ? 'VISIBLE' : 'HIDDEN',
        source,
        reviewStatus:
          source === 'COMPANY' && reviewStatus !== ''
            ? (reviewStatus as NonNullable<AdminJobDetail['reviewStatus']>)
            : undefined,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setAlert({ message: '수정했습니다.', nonce: Date.now() });
        },
      },
    );
  };

  return (
    <>
      {alert ? (
        <ActionAlert
          message={alert.message}
          detail={job.title}
          nonce={alert.nonce}
          onDismiss={() => setAlert(null)}
        />
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-8 bottom-8 z-40 flex items-center gap-2 rounded-full bg-blue-500 py-3 pr-5 pl-4 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(74,118,255,0.6)] transition-colors hover:bg-blue-600"
      >
        <PencilIcon />
        운영 값 수정
      </button>

      <Modal
        open={isOpen}
        title="운영 값 수정"
        description="노출 여부와 등록 경로, 검수 상태만 고칩니다. 제목과 본문은 올린 사람이 쓴 글이라 여기서 고치지 않습니다."
        onClose={close}
      >
        {patchMutation.isError ? (
          <Callout tone="error" className="mb-4">
            저장하지 못했습니다. 다시 시도해 주세요.
          </Callout>
        ) : null}

        <Field
          label="노출"
          hint={visible ? '사용자 화면에 보입니다.' : '사용자 화면에서 내려갑니다.'}
        >
          <Toggle checked={visible} onChange={setVisible} label={visible ? '노출' : '비노출'} />
        </Field>

        <Field label="등록 경로" htmlFor="job-source">
          <Select
            id="job-source"
            className="w-full"
            // 첫 칸이 "전체"인 필터용 목록이라 그 칸만 뺀다.
            options={CONTENT_SOURCE_OPTIONS.filter((option) => option.value !== '')}
            value={source}
            onChange={(event) => setSource(event.target.value as AdminJobDetail['source'])}
          />
        </Field>

        <Field
          label="검수 상태"
          htmlFor="job-review"
          hint={
            source === 'CRAWLER'
              ? '크롤링 수집분은 검수 대상이 아닙니다.'
              : '검수 대기로 되돌리면 검수 대기 큐에 다시 올라옵니다.'
          }
        >
          <Select
            id="job-review"
            className="w-full"
            disabled={source === 'CRAWLER'}
            options={JOB_REVIEW_STATUS_OPTIONS.filter((option) => option.value !== '')}
            value={source === 'CRAWLER' ? '' : reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value)}
          />
        </Field>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={save} disabled={!isDirty || patchMutation.isPending}>
            {patchMutation.isPending ? '저장 중' : '저장'}
          </Button>
          <Button variant="secondary" onClick={close}>
            취소
          </Button>
        </div>
      </Modal>
    </>
  );
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
