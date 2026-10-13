import { useState } from 'react';
import { Button, Callout, Card, CardTitle } from '@ogonggo/ui';
import { useReplaceTodayJobs, useTodayJobList } from '@/entities/today-job/api/useTodayJobs';
import { RecommendationFields } from '@/features/today-job/ui/RecommendationFields';
import { useTodayJobWriter } from '@/features/today-job/lib/useTodayJobWriter';
import { isRecommendationValid, type RecommendationValue } from '@/features/today-job/lib/validate';

const EMPTY_RECOMMENDATION: RecommendationValue = { title: '', description: '' };

/** 카드 안에 남는 결과 문구. 토스트가 아니라 화면에 남고 다음 입력이나 요청에서 사라진다. */
interface Notice {
  tone: 'success' | 'warning' | 'error';
  message: string;
}

/** 저장하지 못했을 때. 서버는 문구 길이와 공고 존재 여부를 본다. */
const SAVE_FAILED =
  '저장하지 못했습니다. 입력한 문구는 그대로 두었습니다. 문구 길이와 공고를 확인한 뒤 다시 시도해 주세요.';

export interface TodayJobCardProps {
  jobId: number;
  /** 비노출 공고는 오늘의 공고에 들어 있어도 사용자 화면에 나오지 않는다. */
  isHidden: boolean;
}

/**
 * 채용공고 상세의 `오늘의 공고` 카드. 이 공고가 오늘의 공고(오공고 PICK)에 들어 있는지 보이고,
 * 넣고 빼고 추천 문구를 고친다.
 *
 * 목록의 `PICK` 토글(`pages/job-list`)과 같은 쓰기를 쓴다(`useTodayJobWriter`). 보내기 직전에 목록을
 * 다시 받아 그 위에서 바꾸므로, 다른 운영자가 그 사이에 한 일을 덮어쓰지 않는다.
 *
 * 입력은 `draft` 로 따로 든다. 비어 있으면(`null`) 서버의 문구를 그대로 보이고, 한 글자라도
 * 고치면 그 값이 된다. 서버 목록이 다시 받아져도 고치던 문구는 사라지지 않는다.
 *
 * 결과는 카드 안의 `Callout` 으로 남긴다. 실패하면 오류 문구를 보이고 입력은 그대로 둔다.
 */
export function TodayJobCard({ jobId, isHidden }: TodayJobCardProps) {
  const todayJobs = useTodayJobList();
  const replaceMutation = useReplaceTodayJobs();
  const writer = useTodayJobWriter(replaceMutation.mutateAsync);

  const [draft, setDraft] = useState<RecommendationValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const list = todayJobs.data;
  const index = list ? list.findIndex((job) => job.id === jobId) : -1;
  const picked = list && index >= 0 ? list[index] : undefined;

  const serverValue: RecommendationValue = picked
    ? { title: picked.recommendationTitle, description: picked.recommendationDescription }
    : EMPTY_RECOMMENDATION;
  const value = draft ?? serverValue;

  // 목록을 다시 받는 동안(창에 돌아왔을 때 등)은 잠그지 않는다. 입력 중에 칸이 비활성이 되면
  // 초점을 잃는다. 보내기 직전에는 어차피 목록을 새로 받는다.
  const isLocked = isSubmitting || replaceMutation.isPending;
  const isValid = isRecommendationValid(value);
  // 고치지 않은 채 저장하면 같은 문구를 다시 보내게 된다.
  const isChanged =
    value.title.trim() !== serverValue.title.trim() ||
    value.description.trim() !== serverValue.description.trim();

  /**
   * 쓰기 하나를 돌리고 결과를 `notice` 로 남긴다. 실패하면 `failure` 문구를 보이고 입력은 그대로 둔다.
   * `keepDraft` 가 거짓이면 서버 문구로 돌아간다.
   */
  const perform = async (
    task: () => Promise<{ notice: Notice; keepDraft: boolean }>,
    failure: string,
  ) => {
    setNotice(null);
    setIsSubmitting(true);
    try {
      const result = await task();
      setNotice(result.notice);
      if (!result.keepDraft) {
        setDraft(null);
      }
    } catch {
      setNotice({ tone: 'error', message: failure });
    } finally {
      setIsSubmitting(false);
    }
  };

  const add = () =>
    perform(async () => {
      const result = await writer.add(jobId, value);
      if (result === 'exists') {
        // 다른 곳에서 먼저 넣었다. 그쪽 문구를 덮어쓰지 않고 입력은 남긴다.
        return {
          keepDraft: true,
          notice: {
            tone: 'warning',
            message:
              '다른 곳에서 먼저 오공고 PICK에 들어갔습니다. 보내지 않았습니다. 입력한 문구는 칸에 남겨 두었습니다. 저장하면 이 문구로 바뀝니다.',
          },
        };
      }
      return {
        keepDraft: false,
        notice: { tone: 'success', message: '오공고 PICK 맨 끝에 넣었습니다.' },
      };
    }, SAVE_FAILED);

  const save = () =>
    perform(async () => {
      const result = await writer.editCopy(jobId, value);
      if (result === 'absent') {
        // 다른 곳에서 뺐다. 문구 저장이 되살리지 않는다. 입력은 남겨 다시 넣을 수 있게 한다.
        return {
          keepDraft: true,
          notice: {
            tone: 'warning',
            message:
              '다른 곳에서 이미 오공고 PICK에서 뺐습니다. 문구를 저장하지 않았습니다. 입력한 문구는 칸에 남겨 두었습니다.',
          },
        };
      }
      return {
        keepDraft: false,
        notice: { tone: 'success', message: '추천 문구를 저장했습니다.' },
      };
    }, SAVE_FAILED);

  const remove = () =>
    perform(async () => {
      const result = await writer.remove(jobId);
      return {
        keepDraft: false,
        notice:
          result === 'absent'
            ? { tone: 'warning', message: '이미 오공고 PICK에서 빠져 있습니다.' }
            : { tone: 'success', message: '오공고 PICK에서 뺐습니다.' },
      };
    }, '오공고 PICK에서 빼지 못했습니다. 잠시 뒤 다시 시도해 주세요.');

  return (
    <Card className="mt-4">
      <CardTitle>오공고 PICK</CardTitle>

      {list === undefined ? (
        todayJobs.isError ? (
          <Callout tone="error" className="mt-4">
            오공고 PICK을 불러오지 못해 넣고 뺄 수 없습니다. 나머지 정보는 그대로 쓸 수 있습니다.
          </Callout>
        ) : (
          <p className="pt-4 text-sm text-gray-500">불러오는 중입니다.</p>
        )
      ) : (
        <div className="flex flex-col gap-4 pt-4">
          <p className="text-sm text-gray-900">
            {picked
              ? `오공고 PICK ${list.length}건 중 ${index + 1}번째에 들어 있습니다.`
              : '오공고 PICK에 들어 있지 않습니다.'}
          </p>

          {isHidden ? (
            <Callout tone="warning">
              비노출 공고는 오공고 PICK에 들어 있어도 사용자 화면에 나오지 않습니다. 노출로 바꾸면
              나옵니다.
            </Callout>
          ) : null}

          <RecommendationFields
            idPrefix={`job-detail-${jobId}`}
            value={value}
            disabled={isLocked}
            onChange={(next) => {
              setNotice(null);
              setDraft(next);
            }}
          />

          <div className="flex flex-wrap justify-end gap-2">
            {picked ? (
              <>
                <Button
                  variant="secondary"
                  className="border-red-200 text-error hover:bg-red-50"
                  disabled={isLocked}
                  onClick={() => void remove()}
                >
                  오공고 PICK에서 빼기
                </Button>
                <Button disabled={isLocked || !isValid || !isChanged} onClick={() => void save()}>
                  {isSubmitting ? '저장 중' : '문구 저장'}
                </Button>
              </>
            ) : (
              <Button disabled={isLocked || !isValid} onClick={() => void add()}>
                {isSubmitting ? '저장 중' : '오공고 PICK에 넣기'}
              </Button>
            )}
          </div>

          {notice ? <Callout tone={notice.tone}>{notice.message}</Callout> : null}
        </div>
      )}
    </Card>
  );
}
