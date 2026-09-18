import { useEffect, useState } from 'react';
import { Button, Callout, Field, Modal, Select, Toggle } from '@ogonggo/ui';
import type {
  AdminJobDetailResponseReviewStatus as JobReviewStatus,
  AdminJobDetailResponseSource as ContentSource,
  AdminJobDetailResponseVisibility as Visibility,
} from '@ogonggo/api/src/admin';
import { usePatchBootcamp, usePatchJob } from '@/entities/content/api/useContent';
import { JOB_REVIEW_STATUS_OPTIONS } from '@/shared/config/labels';

export interface OperationEditorProps {
  kind: 'jobs' | 'bootcamps';
  id: number;
  visibility: Visibility;
  source: ContentSource;
  reviewStatus?: JobReviewStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/**
 * 노출·검수 상태를 고친다. 채용공고와 부트캠프가 같은 화면을 쓴다.
 *
 * 둘로 나눠 두면 한쪽에만 칸이 늘거나 규칙이 갈린다. 실제로 부트캠프에는 이 값들이 데이터에
 * 있는데 화면이 없어서, 같은 일을 하러 두 화면을 오갈 때 조작이 달랐다.
 *
 * 제목과 본문은 여기서 고치지 않는다. 그건 올린 사람이 쓴 글이고 `ContentEditor` 가 맡는다.
 *
 * 등록 경로는 고칠 수 없다. 스펙의 요청 모델(`UpdateAdminJobRequest`·`UpdateAdminBootcampRequest`)
 * 에 칸이 없고 백엔드는 보내도 버린다. 검수 상태를 고를 수 있는지 가리는 데만 쓴다.
 *
 * 검수 상태는 등록 경로가 비즈니스 등록일 때만 고를 수 있다. 크롤링 수집분은 검수 대상이
 * 아니라 값 자체가 없다. 고를 수 있는 값은 검수 대기와 승인뿐이다 — 반려는 사유가 있어야 해서
 * 검수 화면에서만 하고, 여기서 보내면 400 이다. 이미 반려된 글은 현재 값을 보여 주려고 반려를
 * 목록에 두되, 바꾼 값만 보내므로 반려가 다시 나가지는 않는다.
 */
export function OperationEditor({
  kind,
  id,
  visibility,
  source,
  reviewStatus,
  open,
  onOpenChange,
  onSaved,
}: OperationEditorProps) {
  const [visible, setVisible] = useState(visibility === 'VISIBLE');
  const [draftReview, setDraftReview] = useState<string>(reviewStatus ?? '');

  const patchJob = usePatchJob(id);
  const patchBootcamp = usePatchBootcamp(id);
  const mutation = kind === 'jobs' ? patchJob : patchBootcamp;

  // 서버 값이 바뀌면 폼도 따라간다. 저장 뒤 응답이나 다른 화면에서 고친 값이 여기 반영된다.
  useEffect(() => {
    setVisible(visibility === 'VISIBLE');
    setDraftReview(reviewStatus ?? '');
  }, [visibility, reviewStatus]);

  const visibilityChanged = visible !== (visibility === 'VISIBLE');
  const reviewChanged = source === 'COMPANY' && draftReview !== (reviewStatus ?? '');
  const isDirty = visibilityChanged || reviewChanged;

  const reviewOptions = JOB_REVIEW_STATUS_OPTIONS.filter(
    (option) => option.value !== '' && (option.value !== 'REJECTED' || reviewStatus === 'REJECTED'),
  );

  const close = () => {
    onOpenChange(false);
    // 닫을 때 서버 값으로 되돌린다. 고치다 만 값이 다음에 열었을 때 남아 있으면 헷갈린다.
    setVisible(visibility === 'VISIBLE');
    setDraftReview(reviewStatus ?? '');
  };

  return (
    <Modal
      open={open}
      title="운영 값 수정"
      description="노출 여부와 검수 상태만 고칩니다. 제목과 본문은 올린 사람이 쓴 글이라 여기서 고치지 않습니다."
      onClose={close}
    >
      {mutation.isError ? (
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

      <Field
        label="검수 상태"
        htmlFor="operation-review"
        hint={
          source === 'CRAWLER'
            ? '크롤링 수집분은 검수 대상이 아닙니다.'
            : '검수 대기로 되돌리면 검수 대기 큐에 다시 올라옵니다. 반려는 검수 대기 화면에서 사유와 함께 합니다.'
        }
      >
        <Select
          id="operation-review"
          className="w-full"
          disabled={source === 'CRAWLER'}
          // 첫 칸이 "전체"인 필터용 목록이라 그 칸을 빼고, 반려는 지금 값일 때만 보여 준다.
          options={reviewOptions}
          value={source === 'CRAWLER' ? '' : draftReview}
          onChange={(event) => setDraftReview(event.target.value)}
        />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button
          disabled={!isDirty || mutation.isPending}
          onClick={() =>
            mutation.mutate(
              // 바꾼 값만 보낸다. 안 바꾼 반려를 다시 보내면 400 이다.
              {
                visibility: visibilityChanged ? (visible ? 'VISIBLE' : 'HIDDEN') : undefined,
                reviewStatus: reviewChanged
                  ? (draftReview as Exclude<JobReviewStatus, 'REJECTED'>)
                  : undefined,
              },
              {
                onSuccess: () => {
                  onOpenChange(false);
                  onSaved();
                },
              },
            )
          }
        >
          {mutation.isPending ? '저장 중' : '저장'}
        </Button>
        <Button variant="secondary" onClick={close}>
          취소
        </Button>
      </div>
    </Modal>
  );
}
