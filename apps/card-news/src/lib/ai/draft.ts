import type { UserJobDetailResponse } from '@ogonggo/api';

/**
 * AI 가 쓰는 카드뉴스 초안. 마감 기한은 데이터로 정확히 계산되므로 AI 에 맡기지 않는다
 * (`../card/fromJob.ts`).
 */
export interface AiDraft {
  headline: string;
  roles: string[];
  responsibilities: string[];
  qualifications: string[];
  preferred: string[];
  note: string;
}

export interface DraftResult {
  draft: AiDraft;
  /** `ai` 면 모델이 썼고, `fallback` 이면 모델 없이 원문을 잘라 만들었다. */
  source: 'ai' | 'fallback';
  message?: string;
}

/**
 * 어느 모델을 쓸지는 환경변수로 고른다. DeepSeek·Gemini 모두 OpenAI 호환 `chat/completions` 를
 * 열어 두어서 주소와 모델 이름만 바꾸면 된다.
 *
 *   DeepSeek  CARD_LLM_BASE_URL=https://api.deepseek.com  CARD_LLM_MODEL=deepseek-chat
 *   Gemini    CARD_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
 *             CARD_LLM_MODEL=gemini-2.5-flash
 *
 * 키가 없으면 모델을 부르지 않고 원문을 잘라 초안을 만든다(`fallbackDraft`).
 */
function llmConfig() {
  const apiKey = process.env.CARD_LLM_API_KEY?.trim();
  const baseUrl = process.env.CARD_LLM_BASE_URL?.trim().replace(/\/$/, '');
  const model = process.env.CARD_LLM_MODEL?.trim();
  return apiKey && baseUrl && model ? { apiKey, baseUrl, model } : null;
}

const SYSTEM_PROMPT = `너는 인스타그램 채용 정보 계정 '오늘의 공고(@letscareer.job)'의 카드뉴스 에디터다.
독자는 인턴·신입 공고를 찾는 문과 대학생·취업 준비생이다. 공고 원문을 읽고 카드뉴스 문구를 JSON 으로만 답한다.

[카드 구성]
1장: 큰 제목(headline) + 채용 직무(roles) + 마감 기한(코드가 채움) + 담당 업무(responsibilities)
2장: 같은 제목 + 자격 요건(qualifications) + 우대 요건(preferred)

[headline 규칙]
- 정확히 2줄. 줄바꿈은 "\\n". 한 줄은 공백 포함 12자 이내 — 카드 폭을 꽉 채우는 큰 글자로 들어가야 한다. 두 줄 길이를 비슷하게 맞춘다.
- 회사명은 [공고 원문]의 '회사명' 값을 그대로 쓴다. 계열사·영문명·서비스명으로 바꾸지 않는다.
- 첫 줄에 회사명을 넣는다. 회사명과 직무(또는 독자가 끌릴 핵심 키워드)를 *별표*로 감싸 강조 상자로 강조한다. 강조는 2~3곳.
- 끝맺음은 "채용 중이에요!", "채용!", "채용중!" 처럼 짧고 경쾌하게. 독자의 눈을 끄는 포인트(첫 인턴, 대규모 채용, 경험 우대 등)가 원문에 있으면 살린다.
- 원문에 없는 사실(연봉, 규모, 혜택)을 지어내지 않는다.

[목록 규칙]
- roles: 1~2개. 원문의 직무명을 짧게. 예: "그로스 마케터 인턴"
- responsibilities: 3~5개. 각 26자 이내. "~리서치", "~관리", "~지원" 처럼 명사형으로 끝낸다.
- qualifications: 2~4개, preferred: 0~4개. 각 32자 이내. "~분" 으로 끝낸다. 원문에 우대 사항이 없으면 [].
- 원문 문장을 그대로 옮기지 말고 핵심만 짧게 요약한다. 비슷한 항목은 합친다.
- 이모지, 번호, 마크다운, 따옴표 장식을 쓰지 않는다.
- note: 원문에 "배치 팀에 따라 다르다" 같은 단서가 꼭 필요할 때만 1~2줄, 아니면 "".

[예시]
{"headline":"*배달의 민족*에서\\n*마케팅 인턴* 채용 중이에요!","roles":["그로스 마케터 인턴"],"responsibilities":["그로스 사례 및 트렌드 리서치","비즈니스 데이터 관리","서비스 개선을 위한 레퍼런스 관리"],"qualifications":["퍼포먼스 마케팅 또는 데이터 기반 마케팅에 관심이 있는 분","데이터로 가설을 세우고 검증해보는 것에 관심 있는 분"],"preferred":["AARRR, 퍼널, 코호트 등 성장 지표를 이해하는 분","Google Spreadsheet로 데이터를 정리할 수 있는 분"],"note":""}
{"headline":"*인턴 한번도 못 해봤다면* ~추천~\\n*와이어트 대규모 인턴* ~채용!~","roles":["경영본부/브랜드개발실 등 다양한 조직에서 실무 경험"],"responsibilities":["시장/경쟁사 리서치 및 분석 자료 정리","데이터 입력 & 자료 취합 및 정리","콘텐츠 및 광고 소재 제작 보조"],"qualifications":[],"preferred":[],"note":"※ 상기 항목은 대표 예시입니다.\\n실제 담당 업무는 배치되는 팀에 따라 다르게 구성될 수 있습니다."}
{"headline":"*에르메스*에서 *동아리/학회 협업*\\n*프로젝트 경험 있는 HR* 채용중!","roles":["HR Assistant"],"responsibilities":["채용 프로세스 운영 서포트","후보자 커뮤니케이션 (폰스크리닝, 인터뷰 일정 조율)","채용 데이터 관리"],"qualifications":[],"preferred":[],"note":""}

~단어~ 는 강조색 글자다. 꼭 필요할 때 한두 단어에만 쓴다.

[출력]
{"headline": string, "roles": string[], "responsibilities": string[], "qualifications": string[], "preferred": string[], "note": string} 형태의 JSON 하나만. 설명을 붙이지 않는다.`;

function jobBrief(job: UserJobDetailResponse): string {
  const fields: [string, string | undefined][] = [
    ['회사명', job.companyName],
    ['공고 제목', job.title],
    ['고용 형태', job.employmentType],
    ['경력', job.experienceType],
    ['회사·팀 소개', job.companyAndTeamIntroduction],
    ['담당 업무', job.responsibilities],
    ['자격 요건', job.qualifications],
    ['우대 사항', job.preferredQualifications],
  ];
  return fields
    .filter(([, value]) => value?.trim())
    .map(([label, value]) => `## ${label}\n${(value ?? '').trim().slice(0, 2500)}`)
    .join('\n\n');
}

/** 문자열 목록. 길이로 자르지 않는다 — 말줄임표로 끊긴 문장이 카드에 그대로 나갔다. 긴 항목은 렌더가 줄을 바꾼다. */
function strings(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

/** 모델 답을 초안으로. 모양이 틀리면 `null` 이고, 부르는 쪽이 원문 초안으로 대신한다. */
export function parseDraft(raw: string): AiDraft | null {
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
  const headline = typeof parsed.headline === 'string' ? parsed.headline.trim() : '';
  if (!headline) {
    return null;
  }
  return {
    headline: headline.replace(/\\n/g, '\n'),
    roles: strings(parsed.roles, 2),
    responsibilities: strings(parsed.responsibilities, 5),
    qualifications: strings(parsed.qualifications, 4),
    preferred: strings(parsed.preferred, 4),
    note: typeof parsed.note === 'string' ? parsed.note.trim() : '',
  };
}

/** 원문 한 덩어리를 점 목록 후보로. 번호·이모지·기호 머리를 떼고 짧은 줄만 남긴다. */
function lines(text: string | undefined, max: number): string[] {
  return (text ?? '')
    .split(/\n|(?<=[.。])\s+/)
    .map((line) =>
      line
        .replace(/^[\s\-•·*●▶▪◦>]+/, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^\p{Extended_Pictographic}️?⃣?\s*/u, '')
        .replace(/^[0-9]️?⃣\s*/u, '')
        .trim(),
    )
    .filter((line) => line.length >= 4)
    .slice(0, max);
}

/** 공고 제목에서 `[체험형/월350만원]` 같은 머리말과 회사명을 뗀 직무 이름. */
function roleName(job: UserJobDetailResponse): string {
  const cleaned = job.title
    .replace(/\[[^\]]*\]/g, '')
    .replaceAll(job.companyName, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || job.title;
}

export function fallbackDraft(job: UserJobDetailResponse): AiDraft {
  const name = roleName(job);
  const role = name.length > 14 ? `${name.slice(0, 13)}…` : name;
  return {
    headline: `*${job.companyName}*에서\n*${role}* 채용 중이에요!`,
    roles: [name],
    responsibilities: lines(job.responsibilities, 4),
    qualifications: lines(job.qualifications, 3),
    preferred: lines(job.preferredQualifications, 3),
    note: '',
  };
}

export async function generateDraft(
  job: UserJobDetailResponse,
  options: { instruction?: string; current?: AiDraft } = {},
): Promise<DraftResult> {
  const config = llmConfig();
  if (!config) {
    return {
      draft: fallbackDraft(job),
      source: 'fallback',
      message: 'AI 키(CARD_LLM_API_KEY 등)가 없어 원문을 잘라 초안을 만들었습니다.',
    };
  }

  const userParts = [`[공고 원문]\n${jobBrief(job)}`];
  if (options.current) {
    userParts.push(`[지금 초안]\n${JSON.stringify(options.current)}`);
  }
  if (options.instruction?.trim()) {
    userParts.push(
      `[추가 지시 — 규칙보다 이 지시를 먼저 따른다]\n${options.instruction.trim().slice(0, 1000)}`,
    );
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        temperature: options.instruction ? 0.8 : 0.6,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userParts.join('\n\n') },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${(await response.text()).slice(0, 200)}`);
    }
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const draft = parseDraft(body.choices?.[0]?.message?.content ?? '');
    if (!draft) {
      throw new Error('모델 답이 JSON 모양이 아닙니다.');
    }
    return { draft, source: 'ai' };
  } catch (error) {
    console.error('[card-news] AI 초안 실패', error);
    return {
      draft: fallbackDraft(job),
      source: 'fallback',
      message: 'AI 호출이 실패해 원문을 잘라 초안을 만들었습니다. 다시 시도해 주세요.',
    };
  }
}
