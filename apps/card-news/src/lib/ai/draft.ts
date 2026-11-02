import { type UserJobDetailResponse, enumLabel } from '@ogonggo/api';
import { captionDeadline } from '../card/fromJob';

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
  /** 인스타그램 게시물 본문. */
  caption: string;
  /**
   * 카드의 마감 기한 문구. 추가 지시가 마감을 바꾸라고 할 때만 모델이 채운다(예: 바뀐 마감 시각). 없으면
   * 공고 데이터로 계산한다(`../card/fromJob.ts`).
   */
  deadline?: string;
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
 * 키가 없으면 모델을 부르지 않고 원문을 잘라 초안을 만든다(`fallbackDraft`). 편집 비서
 * (`app/api/assistant/route.ts`)도 같은 설정을 쓴다.
 */
export function llmConfig() {
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

[caption 규칙 — 인스타그램 게시물 본문]
- 아래 예시의 말투·구성·길이를 그대로 따른다. 첫 줄은 "[오늘의 공고 속보🚨]".
- 회사 소개 한 줄(원문에 근거가 있을 때만 "~ 1위" 같은 수식) → 무엇을 채용하는지 → 독자가 끌릴 포인트(전환 기회, 직무 무관, 대규모 등 원문에 있는 것만) → 지원 권유 순서. 문단 사이는 빈 줄.
- 이모지는 예시처럼 문단 끝이나 줄 머리에 한두 개만.
- 마감 줄은 "⏰ " 뒤에 [마감 문구]를 글자 그대로 쓴다. 날짜를 바꾸거나 지어내지 않는다.
- 끝은 늘 아래 세 줄이다.
🔗자세한 공고 내용은 프로필 링크에서!

👇더 많은 취업·공고 컨텐츠는
@letscareer.job
- 원문에 없는 사실(연봉, 규모, 순위, 전환 조건)을 지어내지 않는다. 확실하지 않으면 뺀다.

[caption 예시]
[오늘의 공고 속보🚨]

뷰티 기업 시총 1위🌟
에이피알에서 2026 하반기 대규모 인턴 채용해요!

경영지원, 마케팅, 영업, 상품기획 등 다양한 직군에서 채용 중이며
특히 해외 마케팅은 무려 10개 직무 채용 중이에요!

3개월 인턴 근무 후 기간 내 우수 근무자에 한해
정규직 전환 기회가 주어집니다!

엄청난 기세로 성장 중인 뷰티 기업에서 커리어를 쌓고 싶다면
이번 공고 놓치지 말고 꼭 지원해 보세요!

⏰ ~ 9월 20일(일) 23:59

🔗자세한 공고 내용은 프로필 링크에서!

👇더 많은 취업·공고 컨텐츠는
@letscareer.job
---
[오늘의 공고 속보🚨]

운동하는 사람이라면 무조건 해봤을
인바디 검사! 체성분 분석기 분야 TOP1 인바디에서
전공, 경력, 나이 무관 통합직무 채용중!

통합직무는 입사 후 개인의 역량, 적성, 수행 과제에 따라
직무를 정할 수 있는 직무에요!
아직 직무 확정하지 못한 분이라면 주목! 🔥

⏰ ~ 9월 14일(월) 11:00

🔗자세한 공고 내용은 프로필 링크에서!

👇더 많은 취업·공고 컨텐츠는
@letscareer.job
---
[오늘의 공고 속보🚨]

LG전자 신입 공채 떴다⭐️
오공고에서 문과 공고만 모아 왔어요!

총 5개의 사업본부에서
HR, 영업/마케팅, 구매, SCM, Finance 등
다양한 직무 신입을 채용 중이에요.

자세한 요건은 채용공고 링크에서 꼭 확인하세요!

⏰ ~ 9월 13일(일) 23:00

🔗자세한 공고 내용은 프로필 링크에서!

👇더 많은 취업·공고 컨텐츠는
@letscareer.job

[출력]
{"headline": string, "roles": string[], "responsibilities": string[], "qualifications": string[], "preferred": string[], "note": string, "caption": string} 형태의 JSON 하나만. caption 안의 줄바꿈은 "\\n". 설명을 붙이지 않는다.`;

/** 공고 원문을 모델에 넘길 글로. 항목마다 `limit` 자까지 자른다. */
function jobBrief(job: UserJobDetailResponse, limit = 2500): string {
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
    .map(([label, value]) => `## ${label}\n${(value ?? '').trim().slice(0, limit)}`)
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

/** 모델 답에서 JSON 객체 하나를 꺼낸다. 못 읽으면 `null`. */
function parseObject(raw: string): Record<string, unknown> | null {
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  try {
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** 모델 답을 초안으로. 모양이 틀리면 `null` 이고, 부르는 쪽이 원문 초안으로 대신한다. */
export function parseDraft(raw: string): AiDraft | null {
  const parsed = parseObject(raw);
  return parsed ? draftFromObject(parsed) : null;
}

function draftFromObject(parsed: Record<string, unknown>): AiDraft | null {
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
    caption: typeof parsed.caption === 'string' ? parsed.caption.replace(/\\n/g, '\n').trim() : '',
    ...(typeof parsed.deadline === 'string' && parsed.deadline.trim()
      ? { deadline: parsed.deadline.trim() }
      : {}),
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
    caption: fallbackCaption(job, name),
  };
}

/** AI 없이 쓰는 인스타 본문. 예시와 같은 틀에 회사명·직무·마감만 채운다. */
function fallbackCaption(job: UserJobDetailResponse, role: string): string {
  return [
    '[오늘의 공고 속보🚨]',
    '',
    `${job.companyName}에서 ${role} 채용 중이에요!`,
    '',
    '자세한 요건은 채용공고 링크에서 꼭 확인하시고',
    '이번 공고 놓치지 말고 꼭 지원해 보세요!',
    '',
    `⏰ ${captionDeadline(job)}`,
    '',
    '🔗자세한 공고 내용은 프로필 링크에서!',
    '',
    '👇더 많은 취업·공고 컨텐츠는',
    '@letscareer.job',
  ].join('\n');
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

  const userParts = [`[공고 원문]\n${jobBrief(job)}`, `[마감 문구]\n${captionDeadline(job)}`];
  if (options.current) {
    userParts.push(`[지금 초안]\n${JSON.stringify(options.current)}`);
  }
  if (options.instruction?.trim()) {
    userParts.push(
      `[추가 지시 — 규칙보다 이 지시를 먼저 따른다]\n${options.instruction.trim().slice(0, 1000)}`,
      `[마감 바꾸기]\n추가 지시가 마감 일시를 바꾸라고 할 때만 JSON 에 "deadline" 을 더한다. 카드에 들어갈 문구로 "2026.11.09 (월) 23:59" 형식이다. 그때 caption 의 마감 줄도 그 일시로 쓴다. 바꾸라는 말이 없으면 "deadline" 을 넣지 않는다.`,
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

/**
 * 여러 공고를 묶은 게시물의 초안. 표지(직무 표)와 공고마다의 문구, 게시물 본문 하나다. 마감 기한은
 * 단일 초안처럼 데이터로 계산한다.
 */
export interface BundleCover {
  badge: string;
  /** 단일 초안의 제목 규칙과 같다(2줄, 줄당 12자, `*강조*`). */
  headline: string;
  /** 표지 표의 열 이름. */
  columns: [string, string];
  /** 공고마다 한 줄. 묶은 순서다. */
  rows: [string, string][];
  /**
   * 직무 표 밑 일정 상자 줄(`서류 합격 발표 : 10월 20일 화요일 오후 6시`). 요청사항에 일정이 적혀 있을 때만
   * 모델이 채운다 — 요청사항이 없으면 모델 답에 있어도 버린다(지어낸 일정을 막는다).
   */
  schedule?: string[];
}

export interface BundleDraft {
  cover: BundleCover;
  /** 묶은 순서. 단일 초안과 같은 모양이고, `caption` 은 비어 있다(본문은 `BundleDraft.caption` 하나). */
  jobs: AiDraft[];
  caption: string;
}

export interface BundleDraftResult {
  draft: BundleDraft;
  source: 'ai' | 'fallback';
  message?: string;
}

/** 표지 표의 기본 열. */
export const BUNDLE_COLUMNS: [string, string] = ['채용 직무', '모집 분야'];

const BUNDLE_SYSTEM_PROMPT = `너는 인스타그램 채용 정보 계정 '오늘의 공고(@letscareer.job)'의 카드뉴스 에디터다.
독자는 인턴·신입 공고를 찾는 문과 대학생·취업 준비생이다. 여러 공고를 한 게시물로 묶는다. 공고 원문들을 읽고 카드뉴스 문구를 JSON 으로만 답한다.

[게시물 구성]
1장 표지: 큰 제목(cover.headline) + 직무 표(cover.rows, 공고마다 한 줄: [채용 직무, 모집 분야])
2장부터 공고마다 한 장: jobs[i] 의 제목·채용 직무·담당 업무·자격 요건·우대 요건. [공고 1], [공고 2] … 순서를 그대로 지킨다.
마지막 장: 프로필 안내(코드가 채움)

[cover.headline 규칙]
- 정확히 2줄. 줄바꿈은 "\\n". 한 줄은 공백 포함 12자 이내. 두 줄 길이를 비슷하게.
- 회사명은 원문 '회사명' 값을 그대로 쓴다. 한 회사면 첫 줄에 회사명. 여러 회사면 공통 주제(예: 신입 공채, 마케팅 인턴)를 쓴다.
- 회사명·핵심 키워드를 *별표*로 감싸 강조 상자로 강조한다. 강조는 2~3곳. 끝맺음은 "채용 중!", "채용!" 처럼 짧게.
- 원문에 없는 사실(연봉, 규모, 혜택)을 지어내지 않는다.
- cover.badge: 표지 왼쪽 위 짧은 칩. 기본 "오늘의 공고 속보".

[cover.rows 규칙]
- 공고 수와 같은 줄 수, 같은 순서. 각 줄은 ["채용 직무", "모집 분야"] 두 칸, 칸마다 14자 이내.
- 채용 직무는 원문의 직무명을 짧게(예: "국내영업"), 모집 분야는 직군·근무지·전형 등 공고를 가르는 값(예: "영업관리", "서울 본사"). 모르면 "".

[jobs[i] 규칙 — 공고 하나 카드와 같다]
- headline: 2줄, 줄당 12자 이내, 회사명과 직무를 *별표*로 강조.
- roles: 1~2개. responsibilities: 3~5개, 각 26자 이내, 명사형. qualifications: 2~4개, preferred: 0~4개, 각 32자 이내, "~분" 으로 끝낸다. 원문에 없으면 [].
- 원문 문장을 그대로 옮기지 말고 핵심만 짧게. 이모지·번호·마크다운을 쓰지 않는다.
- note: 꼭 필요할 때만 1~2줄, 아니면 "".

[caption 규칙 — 인스타그램 게시물 본문 하나]
- 첫 줄 "[오늘의 공고 속보🚨]". 회사 소개 한 줄(원문 근거가 있을 때만) → 어떤 직무들을 채용하는지 → 지원 권유. 문단 사이는 빈 줄. 이모지는 한두 개만.
- 마감 줄은 "⏰ " 뒤에 [가장 이른 마감]을 글자 그대로 쓴다.
- 끝은 늘 아래 세 줄이다.
🔗자세한 공고 내용은 프로필 링크에서!

👇더 많은 취업·공고 컨텐츠는
@letscareer.job

[출력]
{"cover": {"badge": string, "headline": string, "rows": [[string, string], …]}, "jobs": [{"headline": string, "roles": string[], "responsibilities": string[], "qualifications": string[], "preferred": string[], "note": string}, …], "caption": string} 형태의 JSON 하나만. 설명을 붙이지 않는다.`;

/** 표지 표의 `모집 분야` 대신 쓸 값. 직무 분류, 없으면 직군 이름. */
function fieldName(job: UserJobDetailResponse): string {
  if (job.jobRole) {
    return enumLabel('JobRole', job.jobRole);
  }
  return job.jobField ? enumLabel('JobField', job.jobField) : '';
}

/** 묶은 회사 이름. 한 회사면 그 이름, 여러 회사면 `<첫 회사> 외 N곳`. */
function bundleCompany(jobs: UserJobDetailResponse[]): string {
  const names = [...new Set(jobs.map((job) => job.companyName))];
  return names.length > 1 ? `${names[0]} 외 ${names.length - 1}곳` : (names[0] ?? '');
}

/** 묶은 공고 중 가장 먼저 마감하는 공고의 마감 줄. 모두 상시 채용이면 `채용 시 마감`. */
export function bundleDeadline(jobs: UserJobDetailResponse[]): string {
  const dated = jobs
    .filter((job) => job.recruitmentType !== 'ALWAYS_OPEN' && job.recruitmentEndAt)
    .sort((a, b) => (a.recruitmentEndAt ?? '').localeCompare(b.recruitmentEndAt ?? ''));
  return captionDeadline(dated[0] ?? { recruitmentType: 'ALWAYS_OPEN' });
}

function fallbackCover(jobs: UserJobDetailResponse[]): BundleCover {
  return {
    badge: '오늘의 공고 속보',
    headline: `*${bundleCompany(jobs)}*\n채용 중!`,
    columns: BUNDLE_COLUMNS,
    rows: jobs.map((job) => [roleName(job), fieldName(job)]),
  };
}

/** AI 없이 쓰는 묶음 본문. 회사·직무 목록·가장 이른 마감만 채운다. */
function fallbackBundleCaption(jobs: UserJobDetailResponse[]): string {
  return [
    '[오늘의 공고 속보🚨]',
    '',
    `${bundleCompany(jobs)}에서 ${jobs.length}개 직무 채용 중이에요!`,
    '',
    ...jobs.map((job) => `- ${roleName(job)}`),
    '',
    '자세한 요건은 채용공고 링크에서 꼭 확인하시고',
    '이번 공고 놓치지 말고 꼭 지원해 보세요!',
    '',
    `⏰ ${bundleDeadline(jobs)}`,
    '',
    '🔗자세한 공고 내용은 프로필 링크에서!',
    '',
    '👇더 많은 취업·공고 컨텐츠는',
    '@letscareer.job',
  ].join('\n');
}

/** 모델 없이 만드는 묶음 초안. 공고마다 `fallbackDraft`, 표지는 회사명 + `채용 중!` 이다. */
export function fallbackBundle(jobs: UserJobDetailResponse[]): BundleDraft {
  return {
    cover: fallbackCover(jobs),
    jobs: jobs.map((job) => ({ ...fallbackDraft(job), caption: '' })),
    caption: fallbackBundleCaption(jobs),
  };
}

/** 두 칸짜리 표 줄. 모양이 틀리면 `null`. */
function row(value: unknown): [string, string] | null {
  return Array.isArray(value) &&
    value.length === 2 &&
    value.every((cell) => typeof cell === 'string')
    ? [String(value[0]).trim(), String(value[1]).trim()]
    : null;
}

/**
 * 모델 답을 묶음 초안으로. 통째로 못 읽으면 `null` 이다. 일부가 틀리면 그 부분만 원문 초안으로
 * 채운다 — 제목이 2줄이 아닌 표지, 공고 수와 줄 수가 다른 표, 빠진 공고. 표지 일정은 `withSchedule`(요청사항이
 * 있을 때)일 때만 읽는다.
 */
export function parseBundleDraft(
  raw: string,
  jobs: UserJobDetailResponse[],
  withSchedule = false,
): BundleDraft | null {
  const parsed = parseObject(raw);
  if (!parsed) {
    return null;
  }
  const fallback = fallbackCover(jobs);
  const cover = (parsed.cover ?? {}) as Record<string, unknown>;
  const headline =
    typeof cover.headline === 'string' ? cover.headline.replace(/\\n/g, '\n').trim() : '';
  const rows = Array.isArray(cover.rows) ? cover.rows.map(row) : [];
  const drafts = Array.isArray(parsed.jobs) ? parsed.jobs : [];
  const schedule =
    withSchedule && Array.isArray(cover.schedule)
      ? cover.schedule
          .filter((line): line is string => typeof line === 'string' && Boolean(line.trim()))
          .map((line) => line.trim())
          .slice(0, 4)
      : [];
  return {
    cover: {
      ...(schedule.length > 0 ? { schedule } : {}),
      badge:
        typeof cover.badge === 'string' && cover.badge.trim() ? cover.badge.trim() : fallback.badge,
      headline: headline.split('\n').length === 2 ? headline : fallback.headline,
      columns: BUNDLE_COLUMNS,
      rows:
        rows.length === jobs.length && rows.every(Boolean)
          ? (rows as [string, string][])
          : fallback.rows,
    },
    jobs: jobs.map((job, index) => {
      const value = drafts[index];
      const draft =
        value && typeof value === 'object'
          ? draftFromObject(value as Record<string, unknown>)
          : null;
      return { ...(draft ?? fallbackDraft(job)), caption: '' };
    }),
    caption:
      typeof parsed.caption === 'string' && parsed.caption.trim()
        ? parsed.caption.replace(/\\n/g, '\n').trim()
        : fallbackBundleCaption(jobs),
  };
}

/** 여러 공고 초안. `jobs` 는 묶은 순서이고 답도 그 순서다. `request` 는 시작 화면의 요청사항이다. */
export async function generateBundleDraft(
  jobs: UserJobDetailResponse[],
  request = '',
): Promise<BundleDraftResult> {
  const config = llmConfig();
  if (!config) {
    return {
      draft: fallbackBundle(jobs),
      source: 'fallback',
      message: 'AI 키(CARD_LLM_API_KEY 등)가 없어 원문을 잘라 초안을 만들었습니다.',
    };
  }

  // 공고가 여럿이라 항목마다 짧게 자른다.
  const userParts = jobs.map(
    (job, index) =>
      `[공고 ${index + 1}]\n${jobBrief(job, 800)}\n## 마감 문구\n${captionDeadline(job)}`,
  );
  userParts.push(`[가장 이른 마감]\n${bundleDeadline(jobs)}`);
  if (request.trim()) {
    userParts.push(
      `[추가 지시 — 규칙보다 이 지시를 먼저 따른다]\n${request.trim().slice(0, 1000)}`,
      `[마감 바꾸기]\n추가 지시가 어느 공고의 마감 일시를 바꾸라고 할 때만 그 jobs[i] 에 "deadline" 을 더한다. 카드에 들어갈 문구로 "2026.11.09 (월) 23:59" 형식이다. 그때 caption 의 마감 줄도 바꾼 일시를 따른다.`,
      `[표지 일정]\n추가 지시에 서류 발표·면접·최종 발표 같은 전형 일정이 적혀 있을 때만 cover 에 "schedule"(문자열 배열, 한 줄에 하나, 4줄까지)을 더한다. "서류 합격 발표 : 10월 20일 화요일 오후 6시" 처럼 "항목 : 일시" 로 쓴다. 추가 지시에 없는 일정은 지어내지 않는다 — 공고 원문의 마감 기한도 넣지 않는다. 일정이 없으면 "schedule" 을 넣지 않는다.`,
    );
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.6,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: BUNDLE_SYSTEM_PROMPT },
          { role: 'user', content: userParts.join('\n\n') },
        ],
      }),
      // 공고가 여럿이라 답이 길다.
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${(await response.text()).slice(0, 200)}`);
    }
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const draft = parseBundleDraft(
      body.choices?.[0]?.message?.content ?? '',
      jobs,
      Boolean(request.trim()),
    );
    if (!draft) {
      throw new Error('모델 답이 JSON 모양이 아닙니다.');
    }
    return { draft, source: 'ai' };
  } catch (error) {
    console.error('[card-news] AI 묶음 초안 실패', error);
    return {
      draft: fallbackBundle(jobs),
      source: 'fallback',
      message: 'AI 호출이 실패해 원문을 잘라 초안을 만들었습니다. 다시 시도해 주세요.',
    };
  }
}
