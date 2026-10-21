/** 즐겨찾기 하나. 버튼에는 `label` 이 보이고, 누르면 `prompt` 가 그대로 비서에게 간다. */
export interface AssistantFavorite {
  label: string;
  prompt: string;
}

/**
 * 비서 패널을 처음 열었을 때 보이는 즐겨찾기. 운영에서 매일 하는 일을 비서의 도구로 바로 끝나는 문장으로
 * 적었다 — 누르면 다시 묻지 않고 답이 나와야 즐겨찾기로 쓸모가 있다.
 */
export const FAVORITES: AssistantFavorite[] = [
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
