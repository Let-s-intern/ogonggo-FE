import { Callout, Card, CardTitle, Field, Input } from '@ogonggo/ui';
import {
  useRecommendWeights,
  type RecommendWeights,
} from '@/entities/recommend-weights/api/useRecommendWeights';
import { PageHeader } from '@/widgets/page-header';

type WeightKey = keyof RecommendWeights;

interface WeightField {
  key: WeightKey;
  label: string;
  description: string;
  /** 백엔드 `@Min`·`@Max` 와 같다. 기본값과 달리 화면이 직접 검사해야 해서 여기 둔다. */
  min: number;
  max: number;
}

interface WeightGroup {
  title: string;
  fields: WeightField[];
}

/**
 * 칸 묶음. PRD `.claude/tasks/todo/prd-admin-recommend-weights.md` 의 "칸"·"화면" 표와 같다.
 *
 * 기본값은 두지 않는다. 백엔드 상수라 여기 복사하면 어긋난다 — GET 이 주는 값만 쓴다.
 */
const WEIGHT_GROUPS: WeightGroup[] = [
  {
    title: '공고와 맞는 정도',
    fields: [
      {
        key: 'roleScore',
        label: '직무 일치',
        description: '공고와 직무가 같을 때 더하는 점수',
        min: 0,
        max: 100,
      },
      {
        key: 'fieldScore',
        label: '직군 일치',
        description: '공고와 직군이 같을 때 더하는 점수',
        min: 0,
        max: 100,
      },
      {
        key: 'topicScore',
        label: '준비 단계 일치',
        description: '준비 단계가 하나 겹칠 때 더하는 점수',
        min: 0,
        max: 100,
      },
      {
        key: 'maxTopicMatches',
        label: '준비 단계 최대 개수',
        description: '준비 단계 점수를 셀 최대 개수',
        min: 0,
        max: 10,
      },
    ],
  },
  {
    title: '갈래 가산점',
    fields: [
      {
        key: 'programBonus',
        label: '프로그램 가산점',
        description: '공고와 하나라도 맞는 프로그램에만 더함',
        min: 0,
        max: 100,
      },
      {
        key: 'materialBonus',
        label: '무료 자료집 가산점',
        description: '공고와 하나라도 맞는 자료집에만 더함',
        min: 0,
        max: 100,
      },
      {
        key: 'blogBonus',
        label: '블로그 가산점',
        description: '공고와 하나라도 맞는 블로그에만 더함',
        min: 0,
        max: 100,
      },
    ],
  },
  {
    title: '노출 개수',
    fields: [
      {
        key: 'maxPerGroup',
        label: '갈래별 최대 개수',
        description: '한 갈래에서 고르는 최대 개수',
        min: 1,
        max: 10,
      },
    ],
  },
];

/**
 * 채용공고 상세의 렛츠커리어 콘텐츠 추천(공고마다 3개)을 고르는 점수 여덟 칸.
 *
 * 바꾼 값은 다음 추천 요청부터 운영에 바로 쓰인다. 시험 저장을 할 곳이 없다.
 */
export function RecommendWeightsPage() {
  return (
    <>
      <PageHeader title="렛츠커리어 콘텐츠 추천 점수" />
      <p className="max-w-3xl pb-6 text-sm leading-6 text-gray-700">
        채용공고 상세에 보이는 렛츠커리어 콘텐츠 3개는 이 점수로 고릅니다. 콘텐츠마다 공고와
        직무·직군·준비 단계가 맞는 만큼 점수를 더하고, 하나라도 맞는 콘텐츠에만 갈래 가산점을 더한
        뒤, 높은 순으로 한 갈래에서 정한 개수까지만 고릅니다. 저장한 값은 다음 추천 요청부터 운영에
        바로 쓰입니다.
      </p>
      <RecommendWeightsEditor />
    </>
  );
}

/**
 * 폼에 넣을 현재 값을 받아 온다.
 *
 * 폼은 처음 그려질 때 칸의 초기값을 잡으므로 값이 도착하기 전에 그리면 빈 칸으로 고정된다.
 * 그래서 받아 온 뒤에 폼을 그린다(`pages/notice-list` 의 `NoticeEditor` 와 같은 모양).
 */
function RecommendWeightsEditor() {
  const { data, isPending, isError } = useRecommendWeights();

  if (isPending) {
    return (
      <Card>
        <CardTitle>추천 점수</CardTitle>
        <p className="pt-4 text-sm text-gray-500">불러오는 중입니다.</p>
      </Card>
    );
  }
  if (isError || !data) {
    return <Callout tone="error">추천 점수를 불러오지 못했습니다.</Callout>;
  }

  return <RecommendWeightsForm weights={data} />;
}

function RecommendWeightsForm({ weights }: { weights: RecommendWeights }) {
  return (
    <Card>
      <CardTitle>추천 점수</CardTitle>
      <div className="pt-4">
        {WEIGHT_GROUPS.map((group) => (
          <section key={group.title} className="pb-2">
            <h2 className="pb-3 text-base font-bold text-gray-900">{group.title}</h2>
            <div className="grid grid-cols-2 gap-x-6 xl:grid-cols-4">
              {group.fields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  htmlFor={`recommend-weight-${field.key}`}
                  hint={`${field.description} (${field.min}~${field.max})`}
                >
                  <Input
                    id={`recommend-weight-${field.key}`}
                    value={String(weights[field.key])}
                    readOnly
                  />
                </Field>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Card>
  );
}
