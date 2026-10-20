import { useState } from 'react';

/** 즐겨찾기 하나. 칩에는 `label` 이 보이고, 누르면 `prompt` 가 그대로 비서에게 간다. */
export interface AssistantFavorite {
  label: string;
  prompt: string;
}

/**
 * 처음 쓰는 운영자에게 깔아 두는 즐겨찾기. 운영에서 매일 하는 일을 비서의 도구로 바로 끝나는 문장으로
 * 적었다 — 칩 하나로 다시 묻지 않고 답이 나와야 즐겨찾기로 쓸모가 있다.
 */
export const DEFAULT_FAVORITES: AssistantFavorite[] = [
  {
    label: '어제 KPI 요약',
    prompt:
      '지난 7일 일간 통계에서 가장 최근 날짜를 그 전날과 비교해 방문자·가입·지원 클릭 핵심만 3줄로 요약해줘',
  },
  {
    label: 'PICK 후보 찾기',
    prompt: '최근 7일 지원 클릭 기준 상위 공고 중 오공고 PICK 에 없는 공고 5개 알려줘',
  },
  {
    label: '서비스 의견 요약',
    prompt: '최근 서비스 의견을 공통 주제로 묶어 요약하고, 바로 고칠 만한 것 두 가지를 골라줘',
  },
  {
    label: '채널 효율 비교',
    prompt:
      '최근 30일 채널별 방문자와 가입 전환율을 비교해서 효율이 가장 좋은 채널과 나쁜 채널을 알려줘',
  },
  {
    label: '이 공고 다듬기',
    prompt: '지금 보고 있는 공고의 담당 업무와 자격 요건 문장을 다듬어서 수정 창에 넣어줘',
  },
  { label: '검수 대기 열기', prompt: '검수 대기 화면 열어줘' },
];

const STORAGE_KEY = 'ogonggo.admin.assistantFavorites';
const MAX_FAVORITES = 12;
const MAX_LABEL_LENGTH = 14;

function load(): AssistantFavorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_FAVORITES;
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is AssistantFavorite =>
            typeof item?.label === 'string' && typeof item?.prompt === 'string',
        )
      : DEFAULT_FAVORITES;
  } catch {
    return DEFAULT_FAVORITES;
  }
}

function save(favorites: AssistantFavorite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // 기억하지 못해도 이번 화면에서는 고친 대로 보인다.
  }
}

/**
 * 비서 즐겨찾기. 운영자마다 자주 묻는 것이 달라 이 브라우저에 기억한다. 서버에 두지 않는 이유는 이것이
 * 개인 편의일 뿐 함께 볼 데이터가 아니기 때문이다.
 */
export function useAssistantFavorites() {
  const [favorites, setFavorites] = useState(load);

  const update = (next: AssistantFavorite[]) => {
    setFavorites(next);
    save(next);
  };

  /** 지금 입력한 질문을 즐겨찾기에 더한다. 같은 질문이 있으면 더하지 않는다. */
  const add = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || favorites.some((item) => item.prompt === trimmed)) {
      return;
    }
    const label =
      trimmed.length > MAX_LABEL_LENGTH ? `${trimmed.slice(0, MAX_LABEL_LENGTH)}…` : trimmed;
    update([...favorites, { label, prompt: trimmed }].slice(-MAX_FAVORITES));
  };

  const remove = (prompt: string) => update(favorites.filter((item) => item.prompt !== prompt));

  const resetToDefaults = () => update(DEFAULT_FAVORITES);

  return { favorites, add, remove, resetToDefaults };
}
