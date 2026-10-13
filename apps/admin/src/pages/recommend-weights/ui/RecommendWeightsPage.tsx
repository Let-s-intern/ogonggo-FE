import { useState } from 'react';
import {
  Button,
  Callout,
  Card,
  CardDescription,
  CardTitle,
  DataTable,
  Field,
  Input,
} from '@ogonggo/ui';
import {
  useRecommendWeights,
  useSaveRecommendWeights,
  type RecommendWeights,
  type RecommendWeightsInput,
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
    title: '종류 가산점',
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
        label: '한 종류 최대 개수',
        description: '프로그램·자료집·블로그 중 한 종류에서 고르는 최대 개수',
        min: 1,
        max: 10,
      },
    ],
  },
];

/**
 * 사용자 화면의 추천을 고르는 가중치. 추천 대상마다 카드 하나다.
 *
 * 지금 대상은 채용공고 상세의 렛츠커리어 콘텐츠 추천(공고마다 3개) 하나다. 대상이 늘면 카드를
 * 더한다. 바꾼 값은 다음 추천 요청부터 운영에 바로 쓰인다. 시험 저장을 할 곳이 없다.
 */
export function RecommendWeightsPage() {
  return (
    <>
      <PageHeader title="추천 로직 가중치" />
      <RecommendWeightsEditor />
    </>
  );
}

function LetsCareerCardHeader() {
  return (
    <>
      <CardTitle>렛츠커리어 콘텐츠</CardTitle>
      <CardDescription className="pt-1">
        채용공고 상세에 공고마다 3개를 보여 줍니다.
      </CardDescription>
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
        <LetsCareerCardHeader />
        <p className="pt-4 text-sm text-gray-500">불러오는 중입니다.</p>
      </Card>
    );
  }
  if (isError || !data) {
    return <Callout tone="error">추천 점수를 불러오지 못했습니다.</Callout>;
  }

  return <RecommendWeightsForm weights={data} />;
}

const ALL_FIELDS = WEIGHT_GROUPS.flatMap((group) => group.fields);

type Draft = Record<WeightKey, string>;

function toDraft(weights: RecommendWeights): Draft {
  return Object.fromEntries(
    ALL_FIELDS.map((field) => [field.key, String(weights[field.key])]),
  ) as Draft;
}

/** 비었거나 정수가 아니거나 범위 밖이면 범위 문구. 맞으면 `undefined`. */
function rangeError(field: WeightField, raw: string): string | undefined {
  const value = Number(raw);
  if (!/^\d+$/.test(raw.trim()) || value < field.min || value > field.max) {
    return `${field.min}~${field.max} 사이의 정수를 입력해 주세요.`;
  }
  return undefined;
}

function RecommendWeightsForm({ weights }: { weights: RecommendWeights }) {
  const saveMutation = useSaveRecommendWeights();
  /** 서버에 저장된 값. 저장에 성공하면 응답으로 바꾼다. `저장` 을 켤지 이것과 비교해 정한다. */
  const [saved, setSaved] = useState(weights);
  const [draft, setDraft] = useState(() => toDraft(weights));

  const errors = Object.fromEntries(
    ALL_FIELDS.map((field) => [field.key, rangeError(field, draft[field.key])]),
  ) as Record<WeightKey, string | undefined>;
  const hasError = ALL_FIELDS.some((field) => errors[field.key] !== undefined);
  const isChanged = ALL_FIELDS.some((field) => Number(draft[field.key]) !== saved[field.key]);

  const change = (key: WeightKey, value: string) => {
    // 다시 고치기 시작하면 앞선 저장 결과는 지금 입력과 상관이 없다.
    saveMutation.reset();
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    // PUT 이라 여덟 칸을 모두 보낸다. 하나만 바꿔도 전체다.
    const input: RecommendWeightsInput = Object.fromEntries(
      ALL_FIELDS.map((field) => [field.key, Number(draft[field.key])]),
    ) as Record<WeightKey, number>;
    saveMutation.mutate(input, {
      // 응답의 `data` 가 서버에 저장된 값이다. 봉투에 `data` 가 없으면 보낸 값이 저장된 것으로 본다.
      onSuccess: (data) => {
        const next = data ?? input;
        setSaved(next);
        setDraft(toDraft(next));
      },
    });
  };

  return (
    <Card>
      <LetsCareerCardHeader />
      <RecommendGuide weights={saved} />

      {saveMutation.isSuccess ? (
        <Callout tone="success" className="mt-4">
          저장했습니다.
        </Callout>
      ) : null}

      {saveMutation.isError ? (
        <Callout tone="error" className="mt-4">
          저장하지 못했습니다. 입력값을 확인해 주세요.
        </Callout>
      ) : null}

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
                  error={errors[field.key]}
                >
                  <Input
                    id={`recommend-weight-${field.key}`}
                    inputMode="numeric"
                    value={draft[field.key]}
                    onChange={(event) => change(field.key, event.target.value)}
                    aria-invalid={errors[field.key] !== undefined}
                  />
                </Field>
              ))}
            </div>
          </section>
        ))}

        <Button onClick={save} disabled={hasError || !isChanged || saveMutation.isPending}>
          {saveMutation.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </Card>
  );
}

/** 가산점처럼 0 일 수 있는 점수를 `+2`·`0` 으로 적는다. */
function signed(score: number): string {
  return score === 0 ? '0' : `+${score}`;
}

interface ExampleRow {
  title: string;
  /** 공고와 맞는 정도의 항목. 이 예시 콘텐츠가 공고와 맞는 것만 적는다. */
  matches: { label: string; score: number }[];
  bonus: number;
}

/**
 * 예시 공고(마케팅 신입, 서류에 자소서·포트폴리오)에 콘텐츠 셋을 견준 계산.
 *
 * 숫자는 저장된 값으로 다시 센다. 고정 숫자로 적어 두면 운영자가 값을 바꾸는 순간 설명이 틀린다.
 * 가산점은 맞는 정도가 0 보다 클 때만 더한다(백엔드 `LetsCareerContentRecommendWeights` 와 같다).
 */
function exampleRows(weights: RecommendWeights) {
  const topics = (count: number) => weights.topicScore * Math.min(count, weights.maxTopicMatches);
  const rows: ExampleRow[] = [
    {
      title: '마케팅 포트폴리오 예시 (블로그)',
      matches: [
        { label: '직군', score: weights.fieldScore },
        { label: '준비 단계', score: topics(2) },
      ],
      bonus: weights.blogBonus,
    },
    {
      title: '자소서 2주 완성 챌린지 (프로그램)',
      matches: [{ label: '준비 단계', score: topics(2) }],
      bonus: weights.programBonus,
    },
    {
      title: '마케팅 직무 자료집 (자료집)',
      matches: [
        { label: '직군', score: weights.fieldScore },
        { label: '준비 단계', score: topics(1) },
      ],
      bonus: weights.materialBonus,
    },
  ];

  return rows
    .map((row) => {
      const matchScore = row.matches.reduce((sum, match) => sum + match.score, 0);
      const bonus = matchScore > 0 ? row.bonus : 0;
      const parts = row.matches.map((match) => `${match.label} ${match.score}`);
      const formula =
        matchScore > 0
          ? [...parts, String(bonus)].join(' + ')
          : `${parts.join(' + ')} (가산점 없음)`;
      return { title: row.title, formula, score: matchScore + bonus };
    })
    .sort((a, b) => b.score - a.score);
}

/** 운영자가 값을 바꾸기 전에 읽는 설명. 저장된 값을 보여 준다(입력 중인 값이 아니다). */
function RecommendGuide({ weights }: { weights: RecommendWeights }) {
  return (
    <section className="mt-4 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
      <h2 className="pb-1 text-base font-bold text-gray-900">추천은 이렇게 골라요</h2>
      <p>공고마다 렛츠커리어 콘텐츠 중 점수가 높은 3개를 보여 줘요. 바꾼 점수는 바로 적용돼요.</p>

      <p className="pt-3 font-semibold text-gray-900">점수 = 공고와 맞는 정도 + 종류 가산점</p>
      <ul className="list-disc pl-5">
        <li>
          맞는 정도: 직무가 같으면 {signed(weights.roleScore)}, 직군이 같으면{' '}
          {signed(weights.fieldScore)}, 준비 단계(자소서·포트폴리오·면접 등)가 겹치면 하나당{' '}
          {signed(weights.topicScore)} (최대 {weights.maxTopicMatches}개)
        </li>
        <li>
          종류 가산점: 프로그램 {signed(weights.programBonus)}, 자료집{' '}
          {signed(weights.materialBonus)}, 블로그 {signed(weights.blogBonus)}. 공고와 하나라도 맞을
          때만 더해요.
        </li>
        <li>
          다른 직군 전용 콘텐츠는 빼요. 한 종류는 최대 {weights.maxPerGroup}
          개까지만 골라요.
        </li>
      </ul>

      <h3 className="pt-3 pb-2 font-semibold text-gray-900">
        예시: 마케팅 신입 공고 (서류에 자소서·포트폴리오)
      </h3>
      <DataTable
        columns={[
          { key: 'title', header: '콘텐츠', render: (row) => row.title },
          { key: 'formula', header: '계산', render: (row) => row.formula },
          {
            key: 'score',
            header: '점수',
            align: 'right',
            render: (row) => row.score,
          },
        ]}
        rows={exampleRows(weights)}
        rowKey={(row) => row.title}
      />

      <h3 className="pt-3 font-semibold text-gray-900">이럴 땐</h3>
      <ul className="list-disc pl-5">
        <li>프로그램을 더 보이고 싶으면 프로그램 가산점을 올려요.</li>
        <li>세 종류를 골고루 섞고 싶으면 한 종류 최대 개수를 1로 둬요.</li>
        <li>바꾼 뒤에는 공고 몇 개를 열어 결과를 확인해 주세요.</li>
      </ul>
    </section>
  );
}
