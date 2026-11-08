import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import {
  CHANNEL_GROUPS,
  CHANNEL_STATS,
  COMBO_CARDS,
  FAQ,
  HERO_STATS,
  OPERATING_RULES,
  PACKAGE,
  PARTNERS,
  PICKS,
  PLACEMENTS,
  PROCESS,
  REASONS,
} from './content';
import { CopyInquiryButton } from './CopyInquiryButton';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 md:px-6';
const PRIMARY_BUTTON =
  'inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600';
const OUTLINE_BUTTON =
  'inline-flex items-center justify-center rounded-full border border-blue-500 bg-white px-6 py-3 text-sm font-semibold text-blue-500 transition-colors hover:bg-blue-00';

function Eyebrow({ children, dark }: { children: string; dark?: boolean }) {
  return (
    <p className={cn('text-sm font-semibold', dark ? 'text-blue-300' : 'text-blue-500')}>
      {children}
    </p>
  );
}

function Hero() {
  return (
    <section className={cn(CONTAINER, 'pt-6 md:pt-8')}>
      <div className="relative overflow-hidden rounded-xl bg-gray-100 px-5 py-14 text-center md:px-12 md:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[720px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-150/50 blur-3xl"
        />
        <div className="relative">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[52px]">
            취준생에게 <span className="text-teal-600">좋은 공고</span>를,
            <br />
            기업에게 <span className="text-emerald-500">좋은 인재</span>를
          </h1>
          <p className="mx-auto mt-6 max-w-[720px] text-base leading-relaxed text-gray-700 md:text-lg">
            인턴·신입 채용을 위한 가장 효과적인 채널. 지원 의사가 높은 취준생이 매일 공고를 찾는
            10만명의 취준생이 함께하는 <strong className="text-gray-900">오늘의 공고 지면</strong>
            과, <strong className="text-gray-900">렛츠커리어 채널</strong>에 공고를 알려보세요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#placements" className={PRIMARY_BUTTON}>
              광고 구좌 둘러보기
            </a>
            <Link href="/apply" className={OUTLINE_BUTTON}>
              소개서 · 견적 문의
            </Link>
          </div>
          <ul className="mx-auto mt-12 grid max-w-[1000px] grid-cols-2 gap-3 md:grid-cols-5">
            {HERO_STATS.map((s) => (
              <li key={s.label} className="rounded-lg bg-white px-3 py-5 shadow-sm">
                <p className="text-2xl font-bold text-blue-500 md:text-[28px]">{s.value}</p>
                <p className="mt-2 text-xs text-gray-600 md:text-sm">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Reasons() {
  return (
    <section className={cn(CONTAINER, 'py-16 md:py-24')}>
      <Eyebrow>오늘의 공고 · 렛츠커리어와 함께해야 하는 이유</Eyebrow>
      <h2 className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
        인턴·신입 채용 타겟을
        <br />
        가장 잘 아는 채널이에요
      </h2>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {REASONS.map((r) => (
          <li key={r.no} className="rounded-xl border border-gray-200 p-7">
            <p className="text-sm font-semibold text-blue-500">{r.no}</p>
            <p className="mt-5 text-lg font-semibold">{r.eyebrow}</p>
            <p className="mt-1 text-[28px] font-bold text-blue-500">{r.title}</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{r.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Placements() {
  return (
    <section id="placements" className={cn(CONTAINER, 'scroll-mt-20 pb-16 md:pb-24')}>
      <Eyebrow>오늘의공고 지면 광고</Eyebrow>
      <h2 className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
        공고를 <span className="text-teal-600">실제로 찾는 사람</span> 앞에,
        <br />
        공고 그대로 보여드려요
      </h2>
      <p className="mt-5 text-gray-600">
        광고가 노출될 위치와 형태를 미리 확인하고, 원하는 지면을 선택해 보세요.
      </p>
      <nav aria-label="지면 바로가기" className="mt-8 flex flex-wrap gap-2">
        {PLACEMENTS.map((p, i) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-500"
          >
            {i + 1}. {p.tab}
          </a>
        ))}
      </nav>
      <ol className="mt-6 space-y-4">
        {PLACEMENTS.map((p, i) => (
          <li
            key={p.id}
            id={p.id}
            className="grid scroll-mt-24 overflow-hidden rounded-xl border border-gray-200 md:grid-cols-[45%_1fr]"
          >
            <div className="relative aspect-[16/9] bg-gray-200 md:aspect-auto md:min-h-[260px]">
              <Image
                src={p.image}
                alt={p.imageAlt}
                fill
                sizes="(min-width: 768px) 540px, 100vw"
                className="object-cover object-top"
              />
            </div>
            <div className="p-6 md:p-8">
              <h3 className="flex items-center gap-2.5 text-xl font-semibold">
                <span className="flex size-7 items-center justify-center rounded-full bg-blue-500 text-sm text-white">
                  {i + 1}
                </span>
                {p.title}
              </h3>
              <p className="mt-4 leading-relaxed text-gray-700">
                {p.description.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li
                    key={t.label}
                    className={cn(
                      'rounded-sm px-3 py-1.5 text-sm',
                      t.highlight ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700',
                    )}
                  >
                    {t.label}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                <p>
                  <span className="text-[28px] font-bold">{won(p.price)}</span>
                  <span className="ml-1 text-sm text-gray-500">/1주 · VAT 별도</span>
                </p>
                <p className="rounded-sm bg-blue-50 px-3 py-1.5 text-sm text-blue-600">
                  예상 CTR {p.ctr}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-700">
          <span className="mr-2 text-gray-500">운영 원칙</span>
          {OPERATING_RULES.join(' · ')}
        </p>
        <Link
          href="/apply/ad"
          className="shrink-0 rounded-md bg-blue-500 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-600"
        >
          지면 골라 신청하기
        </Link>
      </div>

      <div className="mt-20">
        <h3 className="text-2xl font-bold md:text-[32px]">나에게 맞는 광고 선택하기</h3>
        <p className="mt-2 text-gray-600">
          3개 모두 별도 상품입니다. <strong>목표와 예산에 맞춰 한 가지씩</strong> 선택할 수 있어요.
        </p>
        <ul className="mt-6 divide-y divide-gray-100 border-y border-gray-100">
          {PICKS.map((p) => (
            <li
              key={p.title}
              className="grid gap-4 px-2 py-6 md:grid-cols-[1.6fr_1fr_0.6fr_0.9fr_auto] md:items-center md:px-6"
            >
              <div>
                <p className="text-sm font-semibold text-blue-500">{p.eyebrow}</p>
                <p className="mt-1 text-xl font-semibold">{p.title}</p>
                <p className="mt-1 text-sm text-gray-500">{p.body}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">노출 방식</p>
                <p className="mt-1 text-sm">{p.method}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">예상 CTR</p>
                <p className="mt-1 font-semibold">{p.ctr}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">구매가</p>
                <p className="mt-1">
                  <span className="text-2xl font-bold">₩{p.price.toLocaleString('ko-KR')}</span>
                  <span className="ml-1 text-xs text-gray-500">/1주</span>
                </p>
              </div>
              <a
                href={`#${p.target}`}
                className="rounded-md border border-gray-200 px-6 py-3 text-center text-sm text-blue-500 hover:border-blue-500"
              >
                위치 보기
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-blue-50 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold">어떤 지면이 맞을지 고민되나요?</p>
            <p className="mt-1 text-sm text-gray-600">
              공고 특성, 목표 지원자, 예산을 알려주시면 세 지면 중 적합한 상품을 비교해볼 수 있어요.
              이 페이지의 상품은 모두 개별 구매입니다.
            </p>
          </div>
          <CopyInquiryButton />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          ※ 예상 CTR은 성과 보장이 아닙니다. 문의 문구를 복사하여 담당자에게 전달할 수 있습니다.
        </p>
      </div>
    </section>
  );
}

function Channels() {
  return (
    <section className="bg-[#121a2b] py-16 text-white md:py-24">
      <div className={CONTAINER}>
        <Eyebrow dark>렛츠커리어 채널 광고</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
          그리고 이 공고를 기다리는 사람이
          <br />
          <span className="text-blue-300">월 10만 명</span> 더 있어요
        </h2>
        <p className="mt-5 max-w-[760px] leading-relaxed text-gray-300">
          렛츠커리어는 이력서·자소서·포트폴리오 챌린지를 운영하며 취준생과 매일 이야기해요.
          인스타그램 두 계정과 카카오톡 오픈채팅방, 채널 DM에서{' '}
          <strong className="text-white">큐레이션 콘텐츠로 공고를 &apos;추천&apos;</strong>하고,
          소재 제작까지 48시간 안에 끝내요.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5">
          {CHANNEL_STATS.map((s) => (
            <li key={s.label} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-bold text-blue-300 md:text-[30px]">{s.value}</p>
              <p className="mt-3 text-sm">{s.label}</p>
              <p className="mt-1 text-xs text-gray-400">{s.sub}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-right text-xs text-gray-400">
          수치는 2026년 9월 기준 · 콘텐츠 제작 대행 포함 · 가격은 견적 문의
        </p>

        {CHANNEL_GROUPS.map((group) => (
          <div key={group.id} className="mt-14">
            <h3 className="text-2xl font-bold">{group.title}</h3>
            <ul className="mt-6 grid gap-4 lg:grid-cols-2">
              {group.products.map((p) => (
                <li
                  key={p.title}
                  className="grid gap-6 rounded-xl bg-blue-00 p-6 text-gray-900 sm:grid-cols-[200px_1fr] md:p-8"
                >
                  <div className="relative mx-auto h-[260px] w-[200px]">
                    {p.images.map((src, i) => (
                      <Image
                        key={src}
                        src={src}
                        alt=""
                        width={180}
                        height={240}
                        className={cn(
                          'absolute h-auto max-h-[240px] w-[150px] rounded-md object-contain shadow-md',
                          i === 0 ? 'left-0 top-0' : 'bottom-0 right-0',
                          p.images.length === 1 &&
                            'left-1/2 top-1/2 w-[190px] -translate-x-1/2 -translate-y-1/2',
                        )}
                      />
                    ))}
                  </div>
                  <div>
                    <span
                      className={cn(
                        'rounded-sm px-2 py-1 text-xs font-semibold text-white',
                        p.badge === 'CRM'
                          ? 'bg-orange-500'
                          : p.badge === 'WEB'
                            ? 'bg-blue-500'
                            : 'bg-gray-600',
                      )}
                    >
                      {p.badge}
                    </span>
                    <h4 className="mt-4 text-lg font-semibold">{p.title}</h4>
                    <p className="mt-3 text-sm leading-relaxed text-gray-700">{p.body}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <li
                          key={t}
                          className={cn(
                            'rounded-sm px-2.5 py-1 text-xs',
                            p.badge === 'CRM'
                              ? 'bg-orange-100 text-orange-900'
                              : 'bg-blue-100 text-blue-900',
                          )}
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      {p.specs.map((s) => (
                        <div key={s.label} className="contents">
                          <dt className="text-gray-500">{s.label}</dt>
                          <dd className="font-semibold">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Combo() {
  return (
    <section className={cn(CONTAINER, 'py-16 md:py-24')}>
      <Eyebrow>오늘의 공고와 렛츠커리어 채널 광고를 함께 집행하면</Eyebrow>
      <h2 className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
        공고를 <span className="text-blue-500">보는</span> 지면과 공고를{' '}
        <span className="text-blue-500">추천받는</span> 채널,
        <br />둘 다 쓰면 지원자가 달라져요
      </h2>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {COMBO_CARDS.map((c) => (
          <li
            key={c.title}
            className={cn(
              'rounded-xl border p-7',
              c.best ? 'border-teal-500 bg-teal-50/50' : 'border-gray-200',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-teal-700">{c.eyebrow}</p>
              {c.best && (
                <span className="rounded-sm bg-teal-600 px-2 py-0.5 text-xs font-semibold text-white">
                  BEST
                </span>
              )}
            </div>
            <p className="mt-3 text-xl font-semibold">{c.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{c.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
          <p className="text-xl font-semibold">목적별 추천 패키지 · {PACKAGE.name}</p>
          <p className="mt-1 text-sm text-gray-600">
            오공고 지면 + 렛츠커리어 채널 조합 예시 · 실제 구성은 상담 후 확정
          </p>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-gray-700">{PACKAGE.caption}</p>
            <ul className="mt-3 space-y-3">
              {PACKAGE.items.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-4"
                >
                  <span
                    className={cn(
                      'shrink-0 rounded-sm px-2 py-1 text-xs font-semibold text-white',
                      item.channel === '오늘의공고' ? 'bg-blue-500' : 'bg-gray-900',
                    )}
                  >
                    {item.channel}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.body}</p>
                  </div>
                  <span className="shrink-0 text-sm text-gray-500">{item.when}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-blue-50 p-6">
            <p className="text-sm font-semibold text-blue-500">이렇게 진행돼요!</p>
            <ol className="mt-4 space-y-5">
              {PACKAGE.steps.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-blue-150 pt-4 text-sm text-gray-600">
              {PACKAGE.effect}
            </p>
            <Link
              href="/apply"
              className="mt-4 block rounded-md bg-blue-500 py-3.5 text-center font-semibold text-white hover:bg-blue-600"
            >
              이 패키지로 견적 받기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section className={cn(CONTAINER, 'pb-16 md:pb-24')}>
      <Eyebrow>PARTNERS</Eyebrow>
      <h2 className="mt-3 text-3xl font-bold md:text-[44px]">함께한 회사</h2>
      <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-xl font-bold text-gray-400">
        {PARTNERS.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  );
}

function Process() {
  return (
    <section className={cn(CONTAINER, 'pb-16 md:pb-24')}>
      <Eyebrow>PROCESS</Eyebrow>
      <h2 className="mt-3 text-3xl font-bold md:text-[44px]">문의부터 게재까지, 이렇게 진행돼요</h2>
      <ol className="mt-8 grid gap-3 md:grid-cols-4">
        {PROCESS.map((p) => (
          <li key={p.no} className="rounded-xl bg-gray-50 p-6">
            <p className="text-sm font-semibold text-blue-500">{p.no}</p>
            <p className="mt-3 text-xl font-semibold">{p.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{p.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Faq() {
  return (
    <section className={cn(CONTAINER, 'pb-16 md:pb-24')}>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="rounded-xl border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold">자주 묻는 질문</h2>
          <div className="mt-4 divide-y divide-gray-100">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-2" open>
                <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-semibold">
                  Q. {f.q}
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="size-4 rotate-180 text-gray-400 transition-transform group-open:rotate-0"
                  >
                    <path d="M3 10l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </summary>
                <p className="rounded-lg bg-gray-50 px-5 py-4 text-sm leading-relaxed text-gray-700">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
        <aside className="rounded-xl border border-gray-200 p-6 md:p-8">
          <p className="text-xl font-bold leading-snug">
            예산만 알려주시면,
            <br />
            광고 조합은 저희가 추천드려요!
          </p>
          <p className="mt-5 text-sm leading-relaxed text-gray-600">
            예산 · 목표 · 관심 구좌 세 가지만 적으면 끝. 회원가입 없이도 접수 가능해요. 접수 후,
            24시간 안에 세일즈 매니저가 오공고 지면과 렛츠커리어 채널을 묶은 예산 맞춤 제안서를
            드려요.
          </p>
          <Link href="/apply" className={cn(PRIMARY_BUTTON, 'mt-6')}>
            광고 상담 신청
          </Link>
        </aside>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className={cn(CONTAINER, 'pb-16 md:pb-24')}>
      <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-14 text-center text-white">
        <h2 className="text-2xl font-bold md:text-[36px]">
          채용공고 홍보 및 교육 모집에 고민이 있다면 지금 문의 주세요
        </h2>
        <p className="mt-4 text-sm text-blue-50 md:text-base">
          예산과 목표만 알려주시면 24시간 안에 세일즈 매니저가 연락드리고, 예산에 맞는
          렛츠커리어&오늘의공고 광고를 제안드립니다.
        </p>
        <Link
          href="/apply"
          className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 font-semibold text-blue-500 hover:bg-blue-00"
        >
          광고 상담 신청
        </Link>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <Reasons />
      <Placements />
      <Channels />
      <Combo />
      <Partners />
      <Process />
      <Faq />
      <ClosingCta />
    </>
  );
}
