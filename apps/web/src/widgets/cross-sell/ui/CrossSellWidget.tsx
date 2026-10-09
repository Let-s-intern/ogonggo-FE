import {
  listPublicRecommendedChallenges,
  type SuccessResponseListUserRecommendedChallengeResponse,
  type UserRecommendedChallengeResponse,
} from '@ogonggo/api';
import { letsCareerChallengeUrl } from '@/shared/api/letsCareerHandoff';

/**
 * 추천 챌린지를 받는다. 생성 타입은 `{ data, status }` 로 감싼 응답을 가정하지만 `httpClient` 는 본문을
 * 그대로 돌려준다(`widgets/job-detail/ui/JobDetailView.tsx` 와 같은 이유).
 *
 * 실패하면 빈 목록이다. 광고 구역 하나 때문에 상세 화면 전체가 오류가 되면 안 된다 — 백엔드도
 * 렛츠커리어가 응답하지 않으면 오류 대신 빈 목록을 준다.
 */
async function fetchRecommendedChallenges(): Promise<UserRecommendedChallengeResponse[]> {
  try {
    const response =
      (await listPublicRecommendedChallenges()) as unknown as SuccessResponseListUserRecommendedChallengeResponse;
    return response.data ?? [];
  } catch {
    return [];
  }
}

/** 챌린지 앞에 고정으로 두는 카드 하나. 링크와 문구는 API 가 아니라 코드가 정한다. */
export interface CrossSellCard {
  /** 카드 맨 위의 종류 글자. 예) `무료 자료집`, `블로그`. */
  label: string;
  title: string;
  description: string;
  /** 누르면 새 탭으로 연다. */
  href: string;
}

export interface CrossSellWidgetProps {
  /** 구역 제목. 기본은 `함께 보면 좋아요`. */
  title?: string;
  /** 챌린지 앞에 두는 고정 카드. 기본은 빈 목록이라 챌린지만 보인다. */
  leadingCards?: readonly CrossSellCard[];
}

const DEFAULT_TITLE = '함께 보면 좋아요';

/**
 * "함께 보면 좋아요" — 렛츠커리어에서 모집 중인 챌린지 최대 3개(`GET /api/v1/recommended-challenges`).
 * 전에는 목업 문구를 하드코딩했다. 누르면 렛츠커리어 챌린지 상세를 새 탭으로 연다.
 *
 * 제목과 앞쪽 고정 카드는 prop 으로 받는다. 넘기지 않으면 지금 모양 그대로다 — 교육·부트캠프 상세가
 * 이 상태로 쓴다. 채용공고 상세는 제목을 바꾸고 고정 카드를 챌린지 앞에 둔다.
 *
 * 서버에서 토큰 없이 부른다. 로그인한 사람에게 맞춘 추천은 백엔드가 토큰을 받을 때 주는데, 이
 * 위젯은 서버 컴포넌트라 토큰이 없다. 지금은 렛츠커리어가 무작위로 고르므로 차이가 없다.
 *
 * 항목은 왼쪽에 한 줄 소개(회색)와 제목(굵게), 오른쪽에 4:3 썸네일이고 항목 사이에 가는 선이
 * 있다. 제목은 두 줄까지 보이고 넘치면 자른다 — 챌린지 이름은 기수까지 붙어 길다. 제목 앞의
 * `[...]` 머리말은 따로 한 줄로 둔다(`ChallengeTitle`). 한 줄 소개는 첫 쉼표 뒤에서 줄을 바꾸고
 * 두 줄까지 보인다(`ChallengeDescription`).
 *
 * 챌린지도 고정 카드도 없으면 구역 전체를 그리지 않는다(API 설명의 규칙).
 *
 * 채용공고 상세와 교육·부트캠프 상세가 같은 것을 쓴다.
 */
export async function CrossSellWidget({
  title = DEFAULT_TITLE,
  leadingCards = [],
}: CrossSellWidgetProps) {
  const challenges = await fetchRecommendedChallenges();
  if (challenges.length === 0 && leadingCards.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {leadingCards.length > 0 ? (
        <ul className="mt-1 divide-y divide-gray-100">
          {leadingCards.map((card) => (
            <li key={card.href}>
              <LeadingCard card={card} />
            </li>
          ))}
        </ul>
      ) : null}
      {/* 챌린지가 없고 고정 카드만 있을 때 빈 목록이 여백을 만들지 않게 한다. */}
      <ul className="mt-1 divide-y divide-gray-100 empty:hidden">
        {challenges.map((challenge) => (
          <li key={challenge.challengeId}>
            <a
              href={letsCareerChallengeUrl(challenge.challengeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 py-4"
            >
              <div className="min-w-0 flex-1">
                {challenge.shortDescription ? (
                  <ChallengeDescription description={challenge.shortDescription} />
                ) : null}
                <ChallengeTitle title={challenge.title} />
              </div>
              {challenge.thumbnailUrl ? (
                <img
                  src={challenge.thumbnailUrl}
                  alt=""
                  className="aspect-[4/3] w-24 shrink-0 rounded-lg bg-gray-100 object-cover"
                />
              ) : (
                <div className="aspect-[4/3] w-24 shrink-0 rounded-lg bg-gray-100" />
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 고정 카드 하나. 종류 글자, 제목, 설명을 위에서 아래로 쌓는다. */
function LeadingCard({ card }: { card: CrossSellCard }) {
  return (
    <a href={card.href} target="_blank" rel="noopener noreferrer" className="group block py-4">
      <p className="text-xs text-gray-500">{card.label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-bold text-gray-800 group-hover:text-blue-500">
        {card.title}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{card.description}</p>
    </a>
  );
}

/** 제목 맨 앞의 `[...]` 머리말(여러 개면 이어진 것 전부)과 나머지. */
const TITLE_PREFIX = /^((?:\[[^\]]*\]\s*)+)(.*)$/;

/**
 * 챌린지 제목. `[인턴·실무 경험자 Ver.] 포트폴리오 2주 완성 챌린지 41기` 처럼 머리말이 붙으면
 * 머리말을 첫 줄에 두고 본 제목을 다음 줄부터 두 줄까지 보인다. 이어 쓰면 머리말이 줄 끝에서
 * 아무 데서나 끊겨 본 제목이 어디서 시작하는지 읽히지 않는다.
 */
function ChallengeTitle({ title }: { title: string }) {
  const [, prefix, rest] = TITLE_PREFIX.exec(title) ?? [];
  const split = Boolean(prefix && rest);
  return (
    <p className="mt-1 text-sm font-bold text-gray-800 group-hover:text-blue-500">
      {split ? <span className="block truncate">{prefix?.trim()}</span> : null}
      <span className="line-clamp-2">{split ? rest : title}</span>
    </p>
  );
}

/**
 * 챌린지 한 줄 소개. 첫 쉼표 자리에서 줄을 바꾼다 — `루틴 있는 취업 준비 속 성장하는 나` /
 * `feat. 손에 꼭 쥔 …` 처럼 쉼표 앞뒤가 다른 말이라 이어 쓰면 줄 끝에서 아무 데서나 끊긴다.
 * 두 줄을 넘으면 자른다.
 */
function ChallengeDescription({ description }: { description: string }) {
  const comma = description.indexOf(',');
  // 줄을 바꾼 자리의 쉼표는 지운다. 줄바꿈이 쉼표를 대신한다.
  const head = comma >= 0 ? description.slice(0, comma) : description;
  const tail = comma >= 0 ? description.slice(comma + 1).trim() : '';
  return (
    <p className="line-clamp-2 text-xs text-gray-500">
      {head}
      {tail ? (
        <>
          <br />
          {tail}
        </>
      ) : null}
    </p>
  );
}
