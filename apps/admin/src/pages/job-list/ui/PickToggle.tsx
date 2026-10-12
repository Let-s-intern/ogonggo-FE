import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Callout, Modal, Toggle } from '@ogonggo/ui';
import {
  listTodayJobs,
  type AdminJobSummaryResponse as AdminJobSummary,
  type AdminTodayJobSummaryResponse,
  type ReplaceAdminTodayJobsRequest,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';
import { RecommendationFields } from '@/features/today-job/ui/RecommendationFields';
import { isRecommendationValid, type RecommendationValue } from '@/features/today-job/lib/validate';

/** 이 칸이 목록 위에 남기는 안내. 모달이 닫힌 뒤에도 읽을 수 있어야 하는 것만 여기로 보낸다. */
export interface PickNotice {
  tone: 'warning' | 'error';
  message: string;
}

export interface PickToggleProps {
  job: AdminJobSummary;
  /** 이 공고가 오늘의 공고(오공고 PICK)에 들어 있는가. */
  picked: boolean;
  /** 오늘의 공고를 받지 못했거나 다른 요청이 오가는 중이라 바꿀 수 없다. */
  disabled: boolean;
  /** 오늘의 공고를 통째로 바꾼다. 요청 중 표시는 쓰는 쪽(`disabled`)이 한다. */
  replace: (input: ReplaceAdminTodayJobsRequest) => Promise<unknown>;
  onNotice: (notice: PickNotice | null) => void;
}

const EMPTY_RECOMMENDATION: RecommendationValue = { title: '', description: '' };

/** 서버가 준 한 건을 `PUT` 본문의 한 건으로. 다른 곳에서 정한 문구를 그대로 둔다. */
const toRequestJob = (job: AdminTodayJobSummaryResponse) => ({
  jobId: job.id,
  recommendationTitle: job.recommendationTitle,
  recommendationDescription: job.recommendationDescription,
});

/**
 * 채용공고 목록의 `PICK` 칸. 오늘의 공고에 든 공고는 켜져 있다.
 *
 * 켜짐은 서버 목록에서 온다. 누른 순간 바로 뒤집지 않고 요청이 끝나 목록이 다시 받아졌을 때
 * 뒤집힌다 — 실패했을 때 되돌릴 것이 없다.
 *
 * 한 건만 더하고 빼는 API 가 없다. 그래서 보내기 직전에 목록을 다시 받아 그 위에서 더하고
 * 뺀다. 화면이 들고 있는 목록(오래됐을 수 있다)으로 보내면 다른 운영자가 그 사이에 한 일을
 * 덮어쓴다. 확인과 전송 사이의 틈은 남는다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 상세로 가는 링크라 멈추지 않으면 토글을 누르는 순간 화면이
 * 넘어간다(`VisibilityToggle` 과 같다). 모달은 이 칸 안에 그려지므로 모달 안의 클릭도 같은
 * 자리에서 멈춘다.
 */
export function PickToggle({ job, picked, disabled, replace, onNotice }: PickToggleProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<RecommendationValue>(EMPTY_RECOMMENDATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isLocked = disabled || isSubmitting;

  /**
   * 오늘의 공고를 지금 서버 기준으로 다시 받는다. 캐시에 신선한 값이 있어도 쓰지 않는다.
   *
   * 쿼리 키와 요청은 `useTodayJobList`(`entities/today-job/api/useTodayJobs.ts`)와 같다. 같은
   * 키라 화면의 토글도 이 응답으로 바로 맞춰진다.
   */
  const fetchLatest = async (): Promise<AdminTodayJobSummaryResponse[]> => {
    const latest = await queryClient.fetchQuery({
      queryKey: ['admin', 'today-jobs'],
      queryFn: () => unwrapData(listTodayJobs()),
      staleTime: 0,
    });
    if (!latest) {
      throw new Error('오늘의 공고 응답에 목록이 없다.');
    }
    return latest;
  };

  const openModal = () => {
    onNotice(null);
    setValue(EMPTY_RECOMMENDATION);
    setModalError(null);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  /**
   * 입력한 문구로 이 공고를 맨 끝에 붙여 저장한다.
   *
   * 실패하면 모달을 열어 둔 채 오류를 보인다. 닫으면 적은 문구가 사라진다.
   */
  const submit = async () => {
    setModalError(null);
    setIsSubmitting(true);
    try {
      const latest = await fetchLatest();
      if (latest.some((item) => item.id === job.id)) {
        // 다른 곳에서 먼저 켰다. 그쪽 문구를 덮어쓰지 않는다.
        closeModal();
        onNotice({
          tone: 'warning',
          message: `"${job.title}" 은 다른 곳에서 먼저 오늘의 공고에 들어갔습니다. 입력한 문구는 저장하지 않았습니다.`,
        });
        return;
      }
      await replace({
        jobs: [
          ...latest.map(toRequestJob),
          {
            jobId: job.id,
            // 서버에는 앞뒤 공백을 뺀 문구를 보낸다. 검증이 그 길이로 판정했다.
            recommendationTitle: value.title.trim(),
            recommendationDescription: value.description.trim(),
          },
        ],
      });
      closeModal();
    } catch {
      setModalError(
        '저장하지 못했습니다. 적은 문구는 그대로 두었습니다. 문구 길이와 공고를 확인한 뒤 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 확인 없이 이 공고를 뺀 목록으로 보낸다. 다시 켜면 되고, 잃는 것은 적어 둔 문구뿐이다.
   *
   * 실패하면 토글은 켜진 채로 남는다(켜짐은 서버 목록에서 오고 목록은 바뀌지 않았다).
   */
  const turnOff = async () => {
    onNotice(null);
    setIsSubmitting(true);
    try {
      const latest = await fetchLatest();
      if (!latest.some((item) => item.id === job.id)) {
        // 다른 곳에서 이미 뺐다. 목록을 방금 받아 토글이 그에 맞춰 꺼진다. 보낼 것이 없다.
        return;
      }
      await replace({
        jobs: latest.filter((item) => item.id !== job.id).map(toRequestJob),
      });
    } catch {
      onNotice({
        tone: 'error',
        message: `"${job.title}" 을 오늘의 공고에서 빼지 못했습니다. 잠시 뒤 다시 시도해 주세요.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div onClick={(event) => event.stopPropagation()}>
      {/* 라벨이 줄바꿈되면 행 높이가 들쭉날쭉해진다. */}
      <span className="whitespace-nowrap">
        <Toggle
          checked={picked}
          disabled={isLocked}
          label="PICK"
          onChange={(next) => {
            if (next) {
              openModal();
            } else {
              void turnOff();
            }
          }}
        />
      </span>

      <Modal
        open={isOpen}
        title="오늘의 공고에 추가"
        description={`${job.title} (${job.companyName}). 저장하면 오늘의 공고 맨 끝에 붙습니다.`}
        onClose={closeModal}
      >
        {isOpen ? (
          <div className="flex flex-col gap-4">
            <RecommendationFields
              idPrefix={`pick-${job.id}`}
              value={value}
              disabled={isSubmitting}
              onChange={setValue}
            />
            {modalError ? <Callout tone="error">{modalError}</Callout> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={isSubmitting} onClick={closeModal}>
                취소
              </Button>
              <Button
                disabled={isLocked || !isRecommendationValid(value)}
                onClick={() => void submit()}
              >
                {isSubmitting ? '저장 중' : '저장'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
