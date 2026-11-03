/**
 * 기업서비스 랜딩의 문구와 수치. 시안 `.claude/tasks/memos/광고-시스템-시안/오늘의공고 기업서비스.html` 의 내부 스크립트
 * (`heroStats`, `whys`, `LC`, `PKGS`, `cases`, `steps`, `faqs`)에서 그대로 옮겼다.
 *
 * 수치는 시안에 "2026년 9월 기준"으로 적힌 값이다. 게시 전 영업 확인이 필요하다(PRD `기업서비스 랜딩`,
 * `.claude/tasks/memos/결정-광고시스템-business-랜딩-2026-11-03.md`). 바뀌면 이 파일만 고친다.
 */

export const STATS_BASIS = '수치는 2026년 9월 기준';

export const HERO_STATS: readonly { value: string; label: string }[] = [
  { value: '월 10만명+', label: '렛츠커리어 · 오늘의공고 채널 총합' },
  { value: '6.7만명+', label: '인스타그램 팔로워' },
  { value: '10,000명+', label: '카카오톡 오픈채팅 참여자' },
  { value: '24시간', label: '세일즈 매니저 연락' },
  { value: '48시간', label: '소재 제작 → 집행' },
];

export const REASONS: readonly { title: string; description: string }[] = [
  {
    title: '지원 중인 취준생 중심 유저풀',
    description:
      '렛츠커리어가 취업 준비부터 실제 지원 단계까지 함께해요. 높은 지원 의사와 완성된 서류를 갖춘 타겟에게 바로 닿아요.',
  },
  {
    title: "광고가 아닌 '추천하는' 채널",
    description:
      '취업 교육부터 공고 큐레이션까지 쌓아온 신뢰로, 광고 콘텐츠도 팔로워의 97%가 보는 반응을 만들어요.',
  },
  {
    title: '소재 제작까지 48시간',
    description:
      '공고 링크만 있으면 카드뉴스·카카오톡 소재·오공고 해석 한 줄까지 직접 만들어 빠르게 집행해요.',
  },
];

export const CHANNEL_STATS: readonly { value: string; label: string; sub: string }[] = [
  {
    value: '6.7만+',
    label: '인스타그램 팔로워',
    sub: '@letscareer.official 3.8만 · @letscareer.job 2.7만',
  },
  { value: '월 3만+', label: '렛츠커리어 MAU', sub: '홈페이지 기준' },
  { value: '7,137명', label: '카카오톡 오픈채팅', sub: 'Q&A방 2,509 + 직무방 4,628' },
  { value: '3,375명', label: '카카오 채널 친구', sub: 'DM 발송 대상' },
  { value: '20,000+', label: '누적 고객 · 교육 300+', sub: 'B2B 파트너 50+' },
];

export type ChannelKind = 'SNS' | 'CRM' | 'WEB';

export const CHANNEL_PRODUCTS: readonly {
  kind: ChannelKind;
  no: string;
  name: string;
  description: string;
  rows: readonly (readonly [string, string])[];
}[] = [
  {
    kind: 'SNS',
    no: '01',
    name: '인스타그램 피드 · 메인 계정',
    description:
      '3.8만 팔로워 @letscareer.official에 단독 콘텐츠로 업로드. 한 번의 게재로 가장 큰 효과를 내는 시그니처 상품이에요.',
    rows: [
      ['형태', '게시글 + 프로필 링크 2주'],
      ['게재', '최초 게재일로부터 6개월'],
      ['성과', '일평균 조회 3만+ · 도달 4천+'],
    ],
  },
  {
    kind: 'SNS',
    no: '02',
    name: '인스타그램 피드 · 오공고 계정',
    description:
      '2.7만 팔로워 @letscareer.job. 매일 1개 이상 큐레이션하는 계정이라 실제 공고를 찾는 트래픽에 정확히 닿아요.',
    rows: [
      ['형태', '게시글 + 프로필 링크 2주'],
      ['게재', '최초 게재일로부터 6개월'],
      ['성과', '평균 조회 2~3만 · 도달 1만+'],
    ],
  },
  {
    kind: 'SNS',
    no: '03',
    name: '인스타그램 스토리',
    description: '링크 클릭이 가장 쉬운 스토리. 공고 핵심만 담아 24시간 노출, 두 계정 중 선택해요.',
    rows: [
      ['형태', '스토리 + 링크 CTA'],
      ['게재', '24시간'],
      ['성과', '평균 조회 1.8천 · 도달 1.5천'],
    ],
  },
  {
    kind: 'CRM',
    no: '04',
    name: '취준 Q&A 오픈채팅방',
    description: '쥬디와 라포가 형성된 2,509명의 취준생 톡방 "쥬디의 취업QNA방"에 홍보글 1회 게시.',
    rows: [
      ['형태', '카카오톡 홍보글'],
      ['발송', '2,509명 · 1회'],
    ],
  },
  {
    kind: 'CRM',
    no: '05',
    name: '직무별 큐레이션 오픈채팅방',
    description:
      '마케팅 · 기획/운영 · HR · 세일즈 4개 톡방에 각 1회. 매일 공고를 공유하며 신뢰를 쌓은 채널이에요.',
    rows: [
      ['형태', '카카오톡 홍보글 · 4개 방'],
      ['발송', '총 4,628명 (마케팅 2,030 · 기획 1,145 · HR 1,117 · 세일즈 336)'],
    ],
  },
  {
    kind: 'CRM',
    no: '06',
    name: '카카오 채널톡 DM',
    description:
      '렛츠커리어 카카오 채널 친구 전체에게 메시지 발송. 단기간에 효과가 필요할 때 추천해요.',
    rows: [
      ['형태', '카카오 채널 DM'],
      ['발송', '3,375명 · 1회'],
    ],
  },
  {
    kind: 'WEB',
    no: '07',
    name: '렛츠커리어 홈 메인 배너',
    description: '렛츠커리어 홈페이지 상단 배너(PC · MO). 첫 페이지에서 모든 유저가 봐요.',
    rows: [
      ['규격', 'PC 1120×180 · MO 320×100'],
      ['게재', '1주'],
      ['규모', 'MAU 3만'],
    ],
  },
];

export const CHANNEL_COMPARISON: readonly {
  label: string;
  title: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    label: '오늘의공고 지면만',
    title: '지원 직전 유저에게 도달',
    description:
      '공고를 고르는 순간 노출돼 전환율이 높지만, 아직 오공고에 안 들어온 취준생에게는 닿지 않아요.',
  },
  {
    label: '렛츠커리어 채널만',
    title: '넓게 알리고 관심을 만들기',
    description:
      '피드 1회로 1만 계정 도달·3만 조회가 나오지만, 콘텐츠를 본 뒤 공고를 다시 찾아오게 하는 자리가 필요해요.',
  },
  {
    label: '함께 집행',
    title: '알리고 → 다시 만나고 → 지원',
    description:
      '인스타·톡방에서 공고를 접한 취준생이 오공고에 들어왔을 때 추천 카드·상단 고정으로 다시 만나요. 같은 공고를 두 번 본 사람이 지원 버튼을 눌러요.',
    recommended: true,
  },
];

export interface LandingPackage {
  name: string;
  situation: string;
  items: readonly {
    source: '렛츠커리어' | '오늘의공고';
    name: string;
    why: string;
    timing: string;
  }[];
  flow: readonly { title: string; description: string }[];
  expect: string;
}

export const PACKAGES: readonly LandingPackage[] = [
  {
    name: '지원자 빨리 모으기',
    situation: '채용 시 마감 · 마감 임박 — 빠른 유입이 필요할 때',
    items: [
      {
        source: '렛츠커리어',
        name: '인스타그램 스토리 2계정 + 직무 톡방 4개',
        why: '문의 후 당일 집행 가능 · 링크 클릭 CTA',
        timing: 'D-day',
      },
      {
        source: '오늘의공고',
        name: '리스트 상단 고정 + 달력 하이라이트',
        why: '직무 탭 첫 카드 + 마감일 달력 핀으로 반복 노출',
        timing: '1주',
      },
      {
        source: '렛츠커리어',
        name: '카카오 채널 DM',
        why: '3,375명에게 마감 리마인드',
        timing: '마감 3일 전',
      },
    ],
    flow: [
      {
        title: '톡방·스토리로 알리기',
        description: '직무 톡방 4,628명 + 스토리로 공고를 처음 접해요',
      },
      {
        title: '오공고에서 다시 만나기',
        description: '직무 탭을 열면 상단 고정 카드, 달력에선 마감일 핀',
      },
      { title: 'DM 리마인드 → 지원', description: '마감 3일 전 DM이 마지막 한 번을 밀어줘요' },
    ],
    expect: '사례 기준 링크 유입 100건+ · 24분 만에 톡방 홍보 시작 (레브잇)',
  },
  {
    name: '적합한 지원자 찾기',
    situation: '지원자 수보다 직무 적합도가 중요할 때',
    items: [
      {
        source: '렛츠커리어',
        name: '인스타그램 피드 · 오공고 계정',
        why: '큐레이션 톤의 카드뉴스로 "왜 이 공고인지" 설명',
        timing: '1회 · 6개월 유지',
      },
      {
        source: '오늘의공고',
        name: '비슷한 공고 상단 노출 + 오공고 추천 카드',
        why: '같은 직무 공고를 보던 유저에게 해석 한 줄 + 역량 태그',
        timing: '1주',
      },
      {
        source: '렛츠커리어',
        name: '해당 직무 큐레이션 톡방 1개',
        why: '직무 커뮤니티에 정확히 1회',
        timing: '1회',
      },
    ],
    flow: [
      {
        title: '피드로 공고 해석 전달',
        description: '카드뉴스가 자격·우대 조건을 취준생 언어로 풀어줘요',
      },
      {
        title: '상세 페이지에서 재노출',
        description: '비슷한 공고를 보던 사람 앞에 역량 태그와 함께',
      },
      {
        title: '오공고 공고 분석 → 지원',
        description: '체크리스트로 적합도를 스스로 확인한 사람이 지원해요',
      },
    ],
    expect: '사례 기준 저장 149~308건 · 공유 100건+ (모두닥 · 인바디)',
  },
  {
    name: '기업 알리기',
    situation: '채용 브랜딩 · 채용설명회 · 상시 채용 안내',
    items: [
      {
        source: '렛츠커리어',
        name: '인스타그램 피드 · 메인 계정',
        why: '3.8만 팔로워 메인 계정 단독 콘텐츠',
        timing: '1회 · 6개월 유지',
      },
      {
        source: '오늘의공고',
        name: '메인 상단 배너',
        why: '브랜드 이미지 배너 · 채용설명회 신청 링크',
        timing: '2주',
      },
      {
        source: '렛츠커리어',
        name: '홈 메인 배너 + 현직자 세미나',
        why: 'MAU 3만 홈 상단 + 라이브 세미나로 리드 확보',
        timing: '1주 + 1회',
      },
    ],
    flow: [
      {
        title: '메인 계정 피드로 브랜드 소개',
        description: '일평균 조회 3만의 메인 계정에서 기업 이야기를 전해요',
      },
      { title: '두 홈페이지 배너로 반복 노출', description: '렛츠커리어 홈 + 오공고 리스트 배너' },
      {
        title: '세미나로 리드 확보',
        description: '현직자 세미나에 참여한 취준생이 다음 공채의 지원자가 돼요',
      },
    ],
    expect: '사례 기준 세미나 참여 약 250명 (라라스윗)',
  },
];

export const PARTNERS = [
  '토스페이먼츠',
  '레브잇',
  '모두닥',
  '인바디',
  '라라스윗',
  'KT',
  '한컴',
  'SeSAC 새싹',
  'PFCT',
  '강남언니',
] as const;

export const CASES: readonly {
  company: string;
  role: string;
  situation: string;
  channels: readonly string[];
  results: readonly (readonly [string, string])[];
}[] = [
  {
    company: '토스페이먼츠',
    role: '세일즈 계약직',
    situation: '마감 시한이 촉박해 직무 적합도 높은 지원자가 빠르게 필요',
    channels: ['오공고 IG 피드·스토리', '직무 톡방 4개'],
    results: [
      ['조회수', '1.8만 (팔로워 97.5%)'],
      ['전체 클릭', '135'],
    ],
  },
  {
    company: '레브잇',
    role: '콘텐츠 마케팅 인턴',
    situation: '채용 시 마감 — 문의 후 24분 만에 톡방 홍보, 7시간 만에 스토리 업로드',
    channels: ['마케팅·세일즈 톡방', 'IG 스토리 2계정'],
    results: [
      ['링크 유입', '113건'],
      ['스토리 조회', '1,700+'],
      ['재결제', '3개월 만에'],
    ],
  },
  {
    company: '모두닥',
    role: '전환형 인턴',
    situation: '지원자 양과 후보자 적합도를 동시에 확보해야 하는 경우',
    channels: ['오공고 IG 피드 1회'],
    results: [
      ['도달', '1만 계정'],
      ['조회수', '2.8만 (팔로워 91.1%)'],
      ['저장 · 공유', '149 · 102'],
    ],
  },
  {
    company: '인바디',
    role: 'GBD 통합 직무 인턴',
    situation: '채용 시 마감 — 빠른 유입과 적합도 확보',
    channels: ['오공고 IG 피드 1회'],
    results: [
      ['조회수', '3.9만 (팔로워 91%)'],
      ['도달', '1.4만'],
      ['저장 · 공유', '308 · 147'],
    ],
  },
  {
    company: '라라스윗',
    role: '그로스 마케팅 인턴',
    situation: '기업에 관심 있는 지원자 리드를 확보해야 하는 경우',
    channels: ['현직자 채용설명회'],
    results: [['세미나 참여', '약 250명']],
  },
];

export const PROCESS_STEPS: readonly { title: string; description: string }[] = [
  {
    title: '접수',
    description:
      '예산 · 목표 · 관심 구좌만 알려주세요 (3분, 가입 없이). 24시간 안에 세일즈 매니저가 연락드려요.',
  },
  {
    title: '확정',
    description:
      '예산 맞춤 제안서(오공고 + 렛츠커리어 조합)를 2~3안으로 받고, 전자계약 · 입금으로 확정해요.',
  },
  {
    title: '집행',
    description:
      '확정한 주 월요일부터 게재돼요. 오공고 카드 지면은 공고 정보로 자동 구성되고, 인스타·톡방 소재는 렛츠커리어가 만들어요.',
  },
  {
    title: '종료',
    description: '노출 · 클릭 · 지원 클릭을 집계해 종료 7일 뒤 성과 리포트를 드려요.',
  },
];

export const FAQS: readonly { question: string; answer: string }[] = [
  {
    question: '소재를 직접 만들어야 하나요?',
    answer:
      '아니요. 오공고 카드형 지면은 공고 정보로 자동 구성되고, 인스타·톡방 소재는 렛츠커리어가 제작해요. 배너만 이미지를 주시면 돼요.',
  },
  {
    question: '예산이 적어도 상담할 수 있나요?',
    answer:
      '네. 50만 원 미만부터 가능해요. 예산 범위만 알려주시면 그 안에서 효율이 가장 좋은 조합을 제안하고, 신규 기업은 오공고 무료 쿠폰 1장도 드려요.',
  },
  {
    question: '오공고 지면만 따로 할 수 있나요?',
    answer:
      '네. 상담 신청에서 오공고 지면만 선택해도 되고, 신청 가능 일정에서 잔여 구좌를 먼저 확인할 수도 있어요. 3개 이상이면 10% 할인돼요.',
  },
  {
    question: '어떤 공고든 광고할 수 있나요?',
    answer:
      '정규직·인턴 공고를 우선해요. 급여·근무지·기간이 불명확하면 매니저가 상담 때 보완을 안내드려요.',
  },
  {
    question: '처음이면 무료로 해볼 수 있나요?',
    answer: '신규 기업회원에게 리스트 상단 고정 또는 비슷한 공고 상단 노출 1주 무료 쿠폰을 드려요.',
  },
];
