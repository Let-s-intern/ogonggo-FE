import { Toggle } from '@ogonggo/ui';
import type { AdminBootcampSummaryResponse, AdminJobSummaryResponse } from '@ogonggo/api/src/admin';
import { usePatchBootcamp, usePatchJob } from '@/entities/content/api/useContent';

/**
 * 기업회원 공고별 우선 노출 토글(백엔드 LC-3573 `priorityExposed`). `기업회원 공고 우선 노출` 화면의 공고별 목록과
 * 비즈니스 구역의 채용공고·부트캠프 목록이 함께 쓴다(2026-11-05 사용자).
 *
 * 켜짐은 서버 값에서 온다. 누른 순간 뒤집지 않고, 저장이 끝나 목록을 다시 받으면 뒤집힌다(`usePatchJob` 이 목록을
 * 무효화한다). 그래서 실패하면 이전 값에 남는다. 클릭을 행에서 멈춘다 — 목록의 행 전체가 편집 창·상세를 연다.
 */
export function JobPriorityToggle({ job }: { job: AdminJobSummaryResponse }) {
  const patchMutation = usePatchJob(job.id);
  return (
    <PriorityToggle
      checked={job.priorityExposed}
      isPending={patchMutation.isPending}
      isError={patchMutation.isError}
      onChange={(next) => patchMutation.mutate({ priorityExposed: next })}
    />
  );
}

export function BootcampPriorityToggle({ bootcamp }: { bootcamp: AdminBootcampSummaryResponse }) {
  const patchMutation = usePatchBootcamp(bootcamp.id);
  return (
    <PriorityToggle
      checked={bootcamp.priorityExposed}
      isPending={patchMutation.isPending}
      isError={patchMutation.isError}
      onChange={(next) => patchMutation.mutate({ priorityExposed: next })}
    />
  );
}

function PriorityToggle({
  checked,
  isPending,
  isError,
  onChange,
}: {
  checked: boolean;
  isPending: boolean;
  isError: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    // 라벨이 줄바꿈되면 행 높이가 들쭉날쭉해진다.
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={checked}
        disabled={isPending}
        label={checked ? '켜짐' : '꺼짐'}
        onChange={onChange}
      />
      {isError ? (
        <span className="block pt-1 text-xs text-red-500">저장하지 못했습니다.</span>
      ) : null}
    </span>
  );
}
