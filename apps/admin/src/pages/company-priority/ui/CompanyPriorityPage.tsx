import { Callout, Card, CardDescription, CardTitle, Toggle } from '@ogonggo/ui';
import {
  useCompanyPriority,
  useSaveCompanyPriority,
} from '@/entities/company-priority/api/useCompanyPriority';
import { PageHeader } from '@/widgets/page-header';

/**
 * 기업회원이 비즈니스 등록으로 올린 공고를 공개 목록 맨 앞에 둘지 정한다. 채용공고·부트캠프 한 값이다.
 *
 * 저장 버튼이 없다. 토글을 누르면 바로 저장한다. 토글의 켜짐은 서버 값에서 오고, 누른 순간 뒤집지
 * 않는다 — 저장이 끝나 캐시가 바뀌면 뒤집힌다. 그래서 실패하면 토글은 이전 값에 남는다.
 */
export function CompanyPriorityPage() {
  const { data, isPending, isError } = useCompanyPriority();
  const saveMutation = useSaveCompanyPriority();

  const enabled = data?.enabled ?? false;

  return (
    <>
      <PageHeader title="기업회원 공고 우선 노출" />
      <Card>
        <CardTitle>마감 전 기업회원 공고를 맨 앞에</CardTitle>
        <CardDescription className="pt-1">
          켜면 비즈니스 회원이 등록한 마감 전 채용공고·부트캠프가 공개 목록 맨 앞에 와요. 끄면
          크롤링 공고와 같은 기준으로 정렬돼요. 바꾸면 다음 목록 요청부터 운영에 바로 반영돼요.
        </CardDescription>
        <p className="pt-2 text-sm text-gray-500">
          광고 구좌가 열리기 전까지의 임시 혜택이에요. 구좌가 열리면 꺼 주세요.
        </p>

        <div className="pt-4">
          {isPending ? (
            <p className="text-sm text-gray-500">불러오는 중입니다.</p>
          ) : isError || !data ? (
            <Callout tone="error">설정을 불러오지 못했습니다.</Callout>
          ) : (
            <Toggle
              checked={enabled}
              disabled={saveMutation.isPending}
              label={enabled ? '켜짐' : '꺼짐'}
              onChange={(next) => saveMutation.mutate({ enabled: next })}
            />
          )}
        </div>

        {saveMutation.isError ? (
          <Callout tone="error" className="mt-4">
            저장하지 못했습니다. 설정은 이전 값({enabled ? '켜짐' : '꺼짐'})으로 남아 있어요. 잠시
            뒤 다시 시도해 주세요.
          </Callout>
        ) : null}
      </Card>
    </>
  );
}
