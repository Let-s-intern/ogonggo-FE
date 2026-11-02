/**
 * 요소 서랍에서 넣는 아이콘. Tabler Icons 3.34.0(MIT, `assets/icons/LICENSE-Tabler-Icons.txt`)에서 채용
 * 카드뉴스에 쓸 만한 것만 골라 `<svg>` 안쪽만 담았다. 색은 `currentColor` 로 두고 넣을 때 칠한다
 * (`iconDataUrl`). 하나 더하려면 jsDelivr 의 같은 판에서 받아 이 목록에 한 줄을 더한다.
 */
export interface CardIcon {
  id: string;
  label: string;
  kind: 'outline' | 'filled';
  body: string;
}

export const CARD_ICONS: CardIcon[] = [
  {
    id: 'outline-calendar-event',
    label: '일정',
    kind: 'outline',
    body: '<path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /> <path d="M16 3l0 4" /> <path d="M8 3l0 4" /> <path d="M4 11l16 0" /> <path d="M8 15h2v2h-2z" />',
  },
  {
    id: 'outline-clock',
    label: '시간',
    kind: 'outline',
    body: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 7v5l3 3" />',
  },
  {
    id: 'outline-alarm',
    label: '알람',
    kind: 'outline',
    body: '<path d="M12 13m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /> <path d="M12 10l0 3l2 0" /> <path d="M7 4l-2.75 2" /> <path d="M17 4l2.75 2" />',
  },
  {
    id: 'outline-map-pin',
    label: '위치',
    kind: 'outline',
    body: '<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /> <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />',
  },
  {
    id: 'outline-briefcase',
    label: '직무',
    kind: 'outline',
    body: '<path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /> <path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2" /> <path d="M12 12l0 .01" /> <path d="M3 13a20 20 0 0 0 18 0" />',
  },
  {
    id: 'outline-building',
    label: '회사',
    kind: 'outline',
    body: '<path d="M3 21l18 0" /> <path d="M9 8l1 0" /> <path d="M9 12l1 0" /> <path d="M9 16l1 0" /> <path d="M14 8l1 0" /> <path d="M14 12l1 0" /> <path d="M14 16l1 0" /> <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />',
  },
  {
    id: 'outline-building-skyscraper',
    label: '빌딩',
    kind: 'outline',
    body: '<path d="M3 21l18 0" /> <path d="M5 21v-14l8 -4v18" /> <path d="M19 21v-10l-6 -4" /> <path d="M9 9l0 .01" /> <path d="M9 12l0 .01" /> <path d="M9 15l0 .01" /> <path d="M9 18l0 .01" />',
  },
  {
    id: 'outline-users',
    label: '사람들',
    kind: 'outline',
    body: '<path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /> <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /> <path d="M16 3.13a4 4 0 0 1 0 7.75" /> <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />',
  },
  {
    id: 'outline-user',
    label: '사람',
    kind: 'outline',
    body: '<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /> <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />',
  },
  {
    id: 'outline-school',
    label: '학교',
    kind: 'outline',
    body: '<path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /> <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />',
  },
  {
    id: 'outline-certificate',
    label: '자격증',
    kind: 'outline',
    body: '<path d="M15 15m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /> <path d="M13 17.5v4.5l2 -1.5l2 1.5v-4.5" /> <path d="M10 19h-5a2 2 0 0 1 -2 -2v-10c0 -1.1 .9 -2 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -1 1.73" /> <path d="M6 9l12 0" /> <path d="M6 12l3 0" /> <path d="M6 15l2 0" />',
  },
  {
    id: 'outline-award',
    label: '수상',
    kind: 'outline',
    body: '<path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" /> <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" /> <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />',
  },
  {
    id: 'outline-trophy',
    label: '트로피',
    kind: 'outline',
    body: '<path d="M8 21l8 0" /> <path d="M12 17l0 4" /> <path d="M7 4l10 0" /> <path d="M17 4v8a5 5 0 0 1 -10 0v-8" /> <path d="M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /> <path d="M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
  },
  {
    id: 'outline-star',
    label: '별',
    kind: 'outline',
    body: '<path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />',
  },
  {
    id: 'outline-heart',
    label: '하트',
    kind: 'outline',
    body: '<path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />',
  },
  { id: 'outline-check', label: '체크', kind: 'outline', body: '<path d="M5 12l5 5l10 -10" />' },
  {
    id: 'outline-circle-check',
    label: '완료',
    kind: 'outline',
    body: '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /> <path d="M9 12l2 2l4 -4" />',
  },
  {
    id: 'outline-alert-circle',
    label: '주의',
    kind: 'outline',
    body: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 8v4" /> <path d="M12 16h.01" />',
  },
  {
    id: 'outline-speakerphone',
    label: '확성기',
    kind: 'outline',
    body: '<path d="M18 8a3 3 0 0 1 0 6" /> <path d="M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5" /> <path d="M12 8h0l4.524 -3.77a.9 .9 0 0 1 1.476 .692v12.156a.9 .9 0 0 1 -1.476 .692l-4.524 -3.77h-8a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h8" />',
  },
  {
    id: 'outline-arrow-right',
    label: '오른쪽 화살표',
    kind: 'outline',
    body: '<path d="M5 12l14 0" /> <path d="M13 18l6 -6" /> <path d="M13 6l6 6" />',
  },
  {
    id: 'outline-arrow-down',
    label: '아래 화살표',
    kind: 'outline',
    body: '<path d="M12 5l0 14" /> <path d="M18 13l-6 6" /> <path d="M6 13l6 6" />',
  },
  {
    id: 'outline-arrow-up-right',
    label: '바로가기',
    kind: 'outline',
    body: '<path d="M17 7l-10 10" /> <path d="M8 7l9 0l0 9" />',
  },
  {
    id: 'outline-hand-finger-right',
    label: '가리키기',
    kind: 'outline',
    body: '<path d="M12 8h8.5a1.5 1.5 0 0 1 0 3h-7.5" /> <path d="M13.5 11h2a1.5 1.5 0 0 1 0 3h-2.5" /> <path d="M14.5 14a1.5 1.5 0 0 1 0 3h-1.5" /> <path d="M13.5 17a1.5 1.5 0 1 1 0 3h-4.5a6 6 0 0 1 -6 -6v-2v.208a6 6 0 0 1 2.7 -5.012l.3 -.196q .718 -.468 5.728 -3.286a1.5 1.5 0 0 1 2.022 .536c.44 .734 .325 1.674 -.28 2.28l-1.47 1.47" />',
  },
  {
    id: 'outline-link',
    label: '링크',
    kind: 'outline',
    body: '<path d="M9 15l6 -6" /> <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" /> <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />',
  },
  {
    id: 'outline-mail',
    label: '메일',
    kind: 'outline',
    body: '<path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /> <path d="M3 7l9 6l9 -6" />',
  },
  {
    id: 'outline-phone',
    label: '전화',
    kind: 'outline',
    body: '<path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />',
  },
  {
    id: 'outline-coin',
    label: '급여',
    kind: 'outline',
    body: '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /> <path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /> <path d="M12 7v10" />',
  },
  {
    id: 'outline-gift',
    label: '혜택',
    kind: 'outline',
    body: '<path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" /> <path d="M12 8l0 13" /> <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" /> <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" />',
  },
  {
    id: 'outline-rocket',
    label: '성장',
    kind: 'outline',
    body: '<path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3" /> <path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3" /> <path d="M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />',
  },
  {
    id: 'outline-flame',
    label: '인기',
    kind: 'outline',
    body: '<path d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235" />',
  },
  {
    id: 'outline-bulb',
    label: '아이디어',
    kind: 'outline',
    body: '<path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7" /> <path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3" /> <path d="M9.7 17l4.6 0" />',
  },
  {
    id: 'outline-target',
    label: '목표',
    kind: 'outline',
    body: '<path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /> <path d="M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" /> <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />',
  },
  {
    id: 'outline-chart-bar',
    label: '성과',
    kind: 'outline',
    body: '<path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /> <path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /> <path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /> <path d="M4 20h14" />',
  },
  {
    id: 'outline-device-laptop',
    label: '노트북',
    kind: 'outline',
    body: '<path d="M3 19l18 0" /> <path d="M5 6m0 1a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z" />',
  },
  {
    id: 'outline-pencil',
    label: '작성',
    kind: 'outline',
    body: '<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /> <path d="M13.5 6.5l4 4" />',
  },
  {
    id: 'outline-book',
    label: '공부',
    kind: 'outline',
    body: '<path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /> <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /> <path d="M3 6l0 13" /> <path d="M12 6l0 13" /> <path d="M21 6l0 13" />',
  },
  {
    id: 'outline-sparkles',
    label: '반짝',
    kind: 'outline',
    body: '<path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />',
  },
  {
    id: 'outline-search',
    label: '검색',
    kind: 'outline',
    body: '<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /> <path d="M21 21l-6 -6" />',
  },
  {
    id: 'outline-bookmark',
    label: '저장',
    kind: 'outline',
    body: '<path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z" />',
  },
  {
    id: 'outline-thumb-up',
    label: '추천',
    kind: 'outline',
    body: '<path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" />',
  },
  {
    id: 'outline-confetti',
    label: '축하',
    kind: 'outline',
    body: '<path d="M4 5h2" /> <path d="M5 4v2" /> <path d="M11.5 4l-.5 2" /> <path d="M18 5h2" /> <path d="M19 4v2" /> <path d="M15 9l-1 1" /> <path d="M18 13l2 -.5" /> <path d="M18 19h2" /> <path d="M19 18v2" /> <path d="M14 16.518l-6.518 -6.518l-4.39 9.58a1 1 0 0 0 1.329 1.329l9.579 -4.39z" />',
  },
  {
    id: 'outline-flag',
    label: '깃발',
    kind: 'outline',
    body: '<path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z" /> <path d="M5 21v-7" />',
  },
  {
    id: 'outline-world',
    label: '해외',
    kind: 'outline',
    body: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M3.6 9h16.8" /> <path d="M3.6 15h16.8" /> <path d="M11.5 3a17 17 0 0 0 0 18" /> <path d="M12.5 3a17 17 0 0 1 0 18" />',
  },
  {
    id: 'outline-file-text',
    label: '서류',
    kind: 'outline',
    body: '<path d="M14 3v4a1 1 0 0 0 1 1h4" /> <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /> <path d="M9 9l1 0" /> <path d="M9 13l6 0" /> <path d="M9 17l6 0" />',
  },
  {
    id: 'outline-pin',
    label: '고정',
    kind: 'outline',
    body: '<path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" /> <path d="M9 15l-4.5 4.5" /> <path d="M14.5 4l5.5 5.5" />',
  },
  {
    id: 'outline-plane',
    label: '출장',
    kind: 'outline',
    body: '<path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" />',
  },
  {
    id: 'outline-quote',
    label: '인용',
    kind: 'outline',
    body: '<path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" /> <path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" />',
  },
  {
    id: 'filled-map-pin',
    label: '위치',
    kind: 'filled',
    body: '<path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />',
  },
  {
    id: 'filled-star',
    label: '별',
    kind: 'filled',
    body: '<path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" />',
  },
  {
    id: 'filled-heart',
    label: '하트',
    kind: 'filled',
    body: '<path d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z" />',
  },
  {
    id: 'filled-circle-check',
    label: '완료',
    kind: 'filled',
    body: '<path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z" />',
  },
  {
    id: 'filled-flame',
    label: '인기',
    kind: 'filled',
    body: '<path d="M10 2c0 -.88 1.056 -1.331 1.692 -.722c1.958 1.876 3.096 5.995 1.75 9.12l-.08 .174l.012 .003c.625 .133 1.203 -.43 2.303 -2.173l.14 -.224a1 1 0 0 1 1.582 -.153c1.334 1.435 2.601 4.377 2.601 6.27c0 4.265 -3.591 7.705 -8 7.705s-8 -3.44 -8 -7.706c0 -2.252 1.022 -4.716 2.632 -6.301l.605 -.589c.241 -.236 .434 -.43 .618 -.624c1.43 -1.512 2.145 -2.924 2.145 -4.78" />',
  },
  {
    id: 'filled-bulb',
    label: '아이디어',
    kind: 'filled',
    body: '<path d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" /> <path d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" /> <path d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" /> <path d="M4.893 4.893a1 1 0 0 1 1.32 -.083l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 0 -1.414z" /> <path d="M17.693 4.893a1 1 0 0 1 1.497 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7z" /> <path d="M14 18a1 1 0 0 1 1 1a3 3 0 0 1 -6 0a1 1 0 0 1 .883 -.993l.117 -.007h4z" /> <path d="M12 6a6 6 0 0 1 3.6 10.8a1 1 0 0 1 -.471 .192l-.129 .008h-6a1 1 0 0 1 -.6 -.2a6 6 0 0 1 3.6 -10.8z" />',
  },
  {
    id: 'filled-bookmark',
    label: '저장',
    kind: 'filled',
    body: '<path d="M14 2a5 5 0 0 1 5 5v14a1 1 0 0 1 -1.555 .832l-5.445 -3.63l-5.444 3.63a1 1 0 0 1 -1.55 -.72l-.006 -.112v-14a5 5 0 0 1 5 -5h4z" />',
  },
  {
    id: 'filled-thumb-up',
    label: '추천',
    kind: 'filled',
    body: '<path d="M13 3a3 3 0 0 1 2.995 2.824l.005 .176v4h2a3 3 0 0 1 2.98 2.65l.015 .174l.005 .176l-.02 .196l-1.006 5.032c-.381 1.626 -1.502 2.796 -2.81 2.78l-.164 -.008h-8a1 1 0 0 1 -.993 -.883l-.007 -.117l.001 -9.536a1 1 0 0 1 .5 -.865a2.998 2.998 0 0 0 1.492 -2.397l.007 -.202v-1a3 3 0 0 1 3 -3z" /> <path d="M5 10a1 1 0 0 1 .993 .883l.007 .117v9a1 1 0 0 1 -.883 .993l-.117 .007h-1a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-7a2 2 0 0 1 1.85 -1.995l.15 -.005h1z" />',
  },
];

/** 아이콘을 한 색으로 칠한 SVG data URL. 이미지 요소로 넣으므로 140px 로 그려 둔다. */
export function iconDataUrl(icon: CardIcon, color: string): string {
  const paint =
    icon.kind === 'outline'
      ? `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="${color}"`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" ${paint}>${icon.body.replaceAll('currentColor', color)}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
