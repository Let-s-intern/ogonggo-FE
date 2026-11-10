import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import { AD_INTRODUCTION_PDF } from '@/shared/config/site';
import {
  CASES,
  CHANNEL_GROUPS,
  CHANNEL_STATS,
  COMBO_CARDS,
  FAQ,
  HERO_STATS,
  OPERATING_RULES,
  PACKAGE,
  PARTNERS,
  PROCESS,
  REASONS,
} from './content';
import { CopyInquiryButton } from './CopyInquiryButton';
import { CountUp } from './CountUp';
import { PlacementSimulator } from './PlacementSimulator';
import { RevealOnScroll } from './RevealOnScroll';

const CONTAINER = 'page-container mx-auto w-full max-w-[1200px] px-4 md:px-6';
/** 묶음 안 순서. 화면에 들어올 때 하나씩 늦게 떠오른다(`app/globals.css`). */
const order = (i: number) => ({ '--i': i }) as CSSProperties;
/** 히어로가 열자마자 떠오르는 애니메이션. 늦출 시간은 `animationDelay` 로 준다. */
const RISE = 'motion-safe:animate-[ogonggo-biz-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_both]';
/** 카드에 마우스를 올리면 살짝 뜬다. */
const LIFT = 'transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg';
const PRIMARY_BUTTON =
  'inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-[background-color,translate,box-shadow] hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25';
const OUTLINE_BUTTON =
  'inline-flex items-center justify-center rounded-full border border-blue-500 bg-white px-6 py-3 text-sm font-semibold text-blue-500 transition-[background-color,translate] hover:-translate-y-0.5 hover:bg-blue-00';

function Eyebrow({ children, dark }: { children: string; dark?: boolean }) {
  return (
    <p
      data-reveal
      className={cn('text-sm font-semibold', dark ? 'text-blue-300' : 'text-blue-500')}
    >
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
          className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[720px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-150/50 blur-3xl motion-safe:animate-[ogonggo-biz-float_9s_ease-in-out_infinite]"
        />
        <div className="relative">
          <h1
            className={cn(
              RISE,
              'text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[52px]',
            )}
          >
            취준생에게 <span className="text-teal-600">좋은 공고</span>를,
            <br />
            기업에게 <span className="text-emerald-500">좋은 인재</span>를
          </h1>
          <p
            className={cn(
              RISE,
              'mx-auto mt-6 max-w-[720px] text-base leading-relaxed text-gray-700 md:text-lg',
            )}
            style={{ animationDelay: '120ms' }}
          >
            인턴·신입 채용을 위한 가장 효과적인 채널. 지원 의사가 높은 취준생이 매일 공고를 찾는
            10만명의 취준생이 함께하는 <strong className="text-gray-900">오늘의 공고 지면</strong>
            과, <strong className="text-gray-900">렛츠커리어 채널</strong>에 공고를 알려보세요.
          </p>
          <div
            className={cn(RISE, 'mt-8 flex flex-wrap justify-center gap-3')}
            style={{ animationDelay: '240ms' }}
          >
            <a href="#placements" className={PRIMARY_BUTTON}>
              광고 구좌 둘러보기
            </a>
            {/* 소개서 받기는 광고 신청·문의 화면에 있다(2026-11-10 사용자). */}
            <Link href="/apply" className={OUTLINE_BUTTON}>
              견적 문의
            </Link>
          </div>
          <ul className="mx-auto mt-12 grid max-w-[1000px] grid-cols-2 gap-3 md:grid-cols-5">
            {HERO_STATS.map((s, i) => (
              <li
                key={s.label}
                className={cn(RISE, LIFT, 'rounded-lg bg-white px-3 py-5 shadow-sm')}
                style={{ animationDelay: `${380 + i * 90}ms` }}
              >
                <p className="text-2xl font-bold text-blue-500 md:text-[28px]">
                  <CountUp value={s.value} delay={380 + i * 90} />
                </p>
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
      <h2 data-reveal className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
        인턴·신입 채용 타겟을
        <br />
        가장 잘 아는 채널이에요
      </h2>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {REASONS.map((r, i) => (
          <li
            key={r.no}
            data-reveal
            style={order(i)}
            className={cn(
              LIFT,
              'relative isolate overflow-hidden rounded-xl border border-gray-200 bg-white p-7',
            )}
          >
            <Image
              src={r.icon}
              alt=""
              width={155}
              height={155}
              className="pointer-events-none absolute right-3 bottom-3 -z-10 h-[120px] w-auto select-none md:h-[140px]"
            />
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
      <h2 data-reveal className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
        공고를 <span className="text-teal-600">실제로 찾는 사람</span> 앞에,
        <br />
        공고 그대로 보여드려요
      </h2>
      <p data-reveal className="mt-5 text-gray-600">
        광고가 노출될 위치와 형태를 미리 확인하고, 원하는 지면을 선택해 보세요.
      </p>
      <div data-reveal>
        <PlacementSimulator />
      </div>
      <div
        data-reveal
        className="mt-4 flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 md:flex-row md:items-center md:justify-between"
      >
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

      <div
        data-reveal
        className="mt-10 flex flex-col gap-4 rounded-xl bg-blue-50 px-6 py-6 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p className="text-lg font-semibold">어떤 지면이 맞을지 고민되나요?</p>
          <p className="mt-1 text-sm text-gray-600">
            공고 특성, 목표 지원자, 예산을 알려주시면 세 지면 중 적합한 상품을 비교해볼 수 있어요.
            이 페이지의 상품은 모두 개별 구매입니다.
          </p>
        </div>
        <CopyInquiryButton />
      </div>
    </section>
  );
}

function Channels() {
  return (
    <section className="bg-[#121a2b] py-16 text-white md:py-24">
      <div className={CONTAINER}>
        <Eyebrow dark>렛츠커리어 채널 광고</Eyebrow>
        <h2 data-reveal className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
          그리고 이 공고를 기다리는 사람이
          <br />
          <span className="text-blue-300">월 10만 명</span> 더 있어요
        </h2>
        <p data-reveal className="mt-5 max-w-[760px] leading-relaxed text-gray-300">
          렛츠커리어는 이력서·자소서·포트폴리오 챌린지를 운영하며 취준생과 매일 이야기해요.
          인스타그램 두 계정과 카카오톡 오픈채팅방, 채널 DM에서{' '}
          <strong className="text-white">큐레이션 콘텐츠로 공고를 &apos;추천&apos;</strong>하고,
          소재 제작까지 48시간 안에 끝내요.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5">
          {CHANNEL_STATS.map((s, i) => (
            <li
              key={s.label}
              data-reveal
              style={order(i)}
              className="rounded-lg border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
            >
              <p className="text-2xl font-bold text-blue-300 md:text-[30px]">
                <CountUp value={s.value} delay={i * 90} />
              </p>
              <p className="mt-3 text-sm">{s.label}</p>
              <p className="mt-1 text-xs text-gray-400">{s.sub}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-right text-xs text-gray-400">
          수치는 2026년 9월 기준 · 콘텐츠 제작 대행 포함 · 가격은 견적 문의
        </p>

        {CHANNEL_GROUPS.map((group) => (
          <div key={group.id} data-reveal className="mt-14">
            <h3 className="text-2xl font-bold">{group.title}</h3>
            <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 md:-mx-6 md:scroll-px-6 md:px-6">
              {group.products.map((p) => (
                <li
                  key={p.title}
                  className="grid w-[85vw] max-w-[560px] shrink-0 snap-start gap-6 rounded-xl bg-blue-00 p-6 text-gray-900 sm:grid-cols-[200px_1fr] md:p-8"
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
      <h2 data-reveal className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
        공고를 <span className="text-blue-500">보는</span> 지면과 공고를{' '}
        <span className="text-blue-500">추천받는</span> 채널,
        <br />둘 다 쓰면 지원자가 달라져요
      </h2>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {COMBO_CARDS.map((c, i) => (
          <li
            key={c.title}
            data-reveal
            style={order(i)}
            className={cn(
              LIFT,
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

      <div data-reveal className="mt-6 overflow-hidden rounded-xl border border-gray-200">
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
      <h2 data-reveal className="mt-3 text-3xl font-bold md:text-[44px]">
        함께한 회사
      </h2>
      <div
        data-reveal
        className="group mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        {/* 같은 목록을 두 번 이어 붙여 끊김 없이 흐르게 한다. 두 번째는 화면 읽기 프로그램에 숨긴다. */}
        <div className="flex w-max animate-[ogonggo-biz-marquee_40s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-12 pr-12 md:gap-16 md:pr-16"
            >
              {PARTNERS.map((p) => (
                <li key={p.name} className="shrink-0">
                  <Image
                    src={p.logo}
                    alt={copy === 0 ? p.name : ''}
                    width={p.width}
                    height={p.height}
                    // 띠 밖에 있다가 흘러 들어오는 로고라 미리 받아 둔다. 늦게 받으면 빈칸으로 들어온다.
                    loading="eager"
                    className="h-5 w-auto md:h-6"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 고객 사례 5건(소개서 17~21쪽). 소재는 모자이크한 이미지라 분위기만 보이고, 숫자 성과를 앞에 둔다. */
function Cases() {
  return (
    <section className={cn(CONTAINER, 'pb-16 md:pb-24')}>
      <Eyebrow>CASES</Eyebrow>
      <h2 data-reveal className="mt-3 text-3xl font-bold leading-tight md:text-[44px]">
        먼저 집행한 기업들의 결과예요
      </h2>
      <p data-reveal className="mt-4 text-gray-600">
        실제 집행 소재는 모자이크했어요. 자세한 사례는{' '}
        <a
          href={AD_INTRODUCTION_PDF}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-blue-500 underline underline-offset-2"
        >
          소개서
        </a>
        에서 볼 수 있어요.
      </p>
      {/* 앞의 두 사례는 넓게, 뒤의 셋은 3열로 둬 다섯 장이 빈칸 없이 두 줄에 들어간다. */}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
        {CASES.map((c, i) => (
          <li
            key={c.company}
            data-reveal
            style={order(i)}
            className={cn(
              LIFT,
              'group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white',
              i < 2 ? 'lg:col-span-3' : 'lg:col-span-2',
              i === 4 && 'sm:col-span-2 lg:col-span-2',
            )}
          >
            <div
              className={cn(
                'relative overflow-hidden bg-gradient-to-br from-gray-50 to-blue-00 p-4',
                i < 2 ? 'aspect-[16/9]' : 'aspect-[4/3]',
              )}
            >
              <div className="relative h-full w-full overflow-hidden rounded-lg shadow-sm">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 560px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <span className="absolute top-6 left-6 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                사례 {i + 1} · {c.kind}
              </span>
            </div>
            <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
              <p className="text-sm font-semibold text-blue-500">{c.company}</p>
              <p className="mt-1 text-xl font-bold leading-snug">{c.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{c.situation}</p>
              <ul className="mt-3 mb-5 flex flex-wrap gap-1.5">
                {c.channels.map((channel) => (
                  <li
                    key={channel}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                  >
                    {channel}
                  </li>
                ))}
              </ul>
              <dl
                className={cn(
                  'mt-auto grid gap-2 border-t border-gray-100 pt-5',
                  c.metrics.length > 1 ? 'grid-cols-3' : 'grid-cols-1',
                )}
              >
                {c.metrics.map((m) => (
                  // 숫자를 위에 크게 보이고, 읽는 순서는 이름 → 값이다.
                  <div key={m.label} className="flex flex-col">
                    <dt className="order-2 mt-0.5 text-xs text-gray-500">{m.label}</dt>
                    <dd className="order-1 text-2xl font-bold tracking-tight text-blue-500">
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Process() {
  return (
    <section className={cn(CONTAINER, 'pb-16 md:pb-24')}>
      <Eyebrow>PROCESS</Eyebrow>
      <h2 data-reveal className="mt-3 text-3xl font-bold md:text-[44px]">
        문의부터 게재까지, 이렇게 진행돼요
      </h2>
      <ol className="mt-8 grid gap-3 md:grid-cols-4">
        {PROCESS.map((p, i) => (
          <li
            key={p.no}
            data-reveal
            style={order(i)}
            className={cn(LIFT, 'rounded-xl bg-gray-50 p-6')}
          >
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
        <div data-reveal className="rounded-xl border border-gray-200 p-6 md:p-8">
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
        <aside
          data-reveal
          style={order(1)}
          className="rounded-xl border border-gray-200 p-6 md:p-8"
        >
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
      <div
        data-reveal
        className="rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-teal-500 bg-[length:200%_100%] px-6 py-14 text-center text-white motion-safe:animate-[ogonggo-biz-gradient_10s_ease-in-out_infinite]"
      >
        <h2 className="text-2xl font-bold md:text-[36px]">
          채용공고 홍보 및 교육 모집에 고민이 있다면 지금 문의 주세요
        </h2>
        <p className="mt-4 text-sm text-blue-50 md:text-base">
          예산과 목표만 알려주시면 24시간 안에 세일즈 매니저가 연락드리고, 예산에 맞는
          렛츠커리어&오늘의공고 광고를 제안드립니다.
        </p>
        <Link
          href="/apply"
          className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 font-semibold text-blue-500 transition-[background-color,translate,box-shadow] hover:-translate-y-0.5 hover:bg-blue-00 hover:shadow-xl"
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
      <Cases />
      <Process />
      <Faq />
      <ClosingCta />
      <RevealOnScroll />
    </>
  );
}
