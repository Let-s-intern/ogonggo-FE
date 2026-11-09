'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from '@ogonggo/ui';
import { PLACEMENT_PAGES, PLACEMENTS, type PlacementPage, type PlacementSpot } from './content';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** 브라우저 프레임에 보이는 높이 ÷ 스크린샷 높이 (1280×900 창으로 1280×1800 이미지를 본다). */
const VIEWPORT = 50;
/** 끼워 넣는 배너 위아래 여백(이미지 높이 대비 %). */
const PAD = 1;
const EASE = 'duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

/** 지면 하나에 머무는 시간. 진행바가 이 시간 동안 차고, 다 차면 다음 지면이다(2026-11-09 사용자: 더 빠르게). */
const DWELL_MS = 3000;

/** 자동으로 넘기는 순서. 페이지 탭 순서대로, 페이지 안에서는 지면 순서대로 모두 돈다. */
const STEPS = PLACEMENT_PAGES.flatMap((p) => p.spots.map((s) => ({ pageId: p.id, spotId: s.id })));

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(listener: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function subscribeVisibility(listener: () => void): () => void {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

const productOf = (spot: PlacementSpot) => PLACEMENTS.find((p) => p.id === spot.productId);
/** 배너가 끼어들 때 아래 화면이 내려가는 양. */
const gapOf = (spot: PlacementSpot) => spot.rect.height + PAD * 2;
const isPush = (spot: PlacementSpot) => spot.banner?.mode === 'push' || spot.banner?.mode === 'end';

function findSpot(id: string) {
  for (const page of PLACEMENT_PAGES) {
    const spot = page.spots.find((s) => s.id === id);
    if (spot) return { page, spot };
  }
  return null;
}

/** 지면이 창 가운데 오도록 화면을 올리는 양(이미지 높이 대비 %). */
function scrollOffset(spot: PlacementSpot) {
  const max = 100 - VIEWPORT + (isPush(spot) ? gapOf(spot) : 0);
  const center = spot.rect.top + spot.rect.height / 2;
  return Math.min(Math.max(center - VIEWPORT / 2, 0), max);
}

function BannerCreative({ spot, shown }: { spot: PlacementSpot; shown: boolean }) {
  if (!spot.banner) return null;
  const tall = spot.banner.mode === 'overlay';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute flex origin-top overflow-hidden rounded-[0.8cqw] bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg transition-[transform,opacity]',
        // 세로 배너는 길어서 같은 시간이면 빨리 떨어져 보인다. 천천히 내려오게 둔다.
        tall
          ? 'duration-[1000ms] ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none'
          : EASE,
        tall
          ? 'flex-col items-center justify-center gap-[1cqw] text-center'
          : 'items-center justify-between px-[3cqw]',
        shown ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
      )}
      style={{
        top: `${spot.rect.top}%`,
        left: `${spot.rect.left}%`,
        width: `${spot.rect.width}%`,
        height: `${spot.rect.height}%`,
      }}
    >
      <span className="text-[1.7cqw] font-bold leading-tight">
        여기에 우리 회사 배너가{tall ? <br /> : ' '}노출돼요
      </span>
      <span className="rounded-full bg-white/20 px-[1.2cqw] py-[0.3cqw] text-[1.2cqw]">
        {spot.banner.size}
      </span>
    </div>
  );
}

/** 광고 공고 카드 시안. 웹의 광고 카드처럼 회사명 앞에 `광고` 표시를 붙인다. */
function MockAdCard({ spot, shown }: { spot: PlacementSpot; shown: boolean }) {
  if (!spot.mockCard) return null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute flex flex-col justify-between rounded-[1.2cqw] bg-white p-[1.25cqw] shadow-md transition-[transform,opacity]',
        EASE,
        shown ? 'translate-y-0 opacity-100' : '-translate-y-[2cqw] opacity-0',
      )}
      style={{
        top: `${spot.rect.top}%`,
        left: `${spot.rect.left}%`,
        width: `${spot.rect.width}%`,
        height: `${spot.rect.height}%`,
      }}
    >
      <span className="flex items-center gap-[0.6cqw] text-[1.1cqw]">
        <span className="size-[2.6cqw] rounded-full bg-gradient-to-br from-blue-500 to-teal-500" />
        <span className="rounded-[0.3cqw] bg-gray-100 px-[0.4cqw] text-[0.85cqw] text-gray-500">
          광고
        </span>
        <span className="font-semibold">우리 회사</span>
      </span>
      <span className="text-[1.2cqw] font-bold leading-snug">
        우리 회사 채용공고가 여기에 노출돼요
      </span>
      <span className="flex items-center justify-between text-[0.95cqw] text-gray-400">
        인턴 · 신입 · 서울
        <span className="rounded-full bg-blue-50 px-[0.6cqw] font-semibold text-blue-500">D-7</span>
      </span>
    </div>
  );
}

/**
 * 페이지 한 장. 가로 배너 자리마다 스크린샷을 잘라 두고, 그 자리가 선택되면 아래 조각을 내려 배너가
 * 끼어든 것처럼 보이게 한다.
 */
function PageCanvas({
  page,
  active,
  visible,
}: {
  page: PlacementPage;
  active: PlacementSpot;
  visible: boolean;
}) {
  const pushes = page.spots.filter(isPush).sort((a, b) => a.rect.top - b.rect.top);
  const cuts = [0, ...pushes.map((s) => s.rect.top - PAD), 100];
  const shiftBefore = (index: number) =>
    pushes.slice(0, index).reduce((sum, s) => sum + (s.id === active.id ? gapOf(s) : 0), 0);
  const hiddenBelow = (index: number) =>
    pushes.slice(0, index).some((s) => s.id === active.id && s.banner?.mode === 'end');

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {cuts.slice(0, -1).map((from, i) => (
        <div
          key={from}
          className={cn(
            'absolute inset-0 transition-[transform,opacity]',
            EASE,
            hiddenBelow(i) && 'opacity-0',
          )}
          style={{
            clipPath: `inset(${from}% 0 ${100 - (cuts[i + 1] ?? 100)}% 0)`,
            transform: `translateY(${shiftBefore(i)}%)`,
          }}
        >
          <Image
            src={page.image}
            alt={i === 0 && visible ? page.imageAlt : ''}
            fill
            sizes="(min-width: 768px) 640px, 100vw"
            className="object-cover object-top"
          />
        </div>
      ))}
      {page.spots.map((spot) => (
        <div key={spot.id}>
          <BannerCreative spot={spot} shown={spot.id === active.id} />
          <MockAdCard spot={spot} shown={spot.id === active.id} />
        </div>
      ))}
    </div>
  );
}

/**
 * 지면 미리보기. 모든 지면을 차례로 자동으로 넘긴다(2026-11-09 사용자). 미리보기 아래 진행바가 지면마다 한 칸씩 차고, 멈춤 버튼으로
 * 세워 둘 수 있다. 탭이나 지면을 누르면 그 지면으로 가서 거기서부터 잇는다.
 *
 * 시계는 `BizHeroScreens` 처럼 진행바의 CSS 애니메이션이다. 다 차면(`animationend`) 다음 지면이고, 멈춤은
 * `animation-play-state` 하나라 다시 누르면 멈춘 자리에서 잇는다. 화면 밖에 있거나 탭이 숨으면 멈춘다 — 아래로
 * 내려와 보기 전에 다 지나가 버리지 않게. `prefers-reduced-motion` 이면 멈춘 채로 시작한다.
 */
export function PlacementSimulator() {
  const [pageId, setPageId] = useState(PLACEMENT_PAGES[0]?.id);
  const [spotId, setSpotId] = useState(PLACEMENT_PAGES[0]?.spots[0]?.id);
  /** 지면이 바뀔 때마다 늘린다. 진행바 `key` 로 써서 애니메이션을 처음부터 다시 돌린다. */
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'hidden',
    () => false,
  );

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      {
        threshold: 0.3,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // `#자리id` 로 들어오거나(위치 보기 링크) 해시가 바뀌면 그 페이지와 자리를 고른다.
  useEffect(() => {
    const syncFromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const found = findSpot(id);
      if (!found) return;
      setPageId(found.page.id);
      setSpotId(id);
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      );
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const page = PLACEMENT_PAGES.find((p) => p.id === pageId);
  const active = page?.spots.find((s) => s.id === spotId) ?? page?.spots[0];
  if (!page || !active) return null;
  const { rect } = active;

  const goTo = (nextPageId: string, nextSpotId: string | undefined) => {
    setPageId(nextPageId);
    setSpotId(nextSpotId);
    setRun((r) => r + 1);
  };
  const selectPage = (next: PlacementPage) => goTo(next.id, next.spots[0]?.id);
  const stepIndex = Math.max(
    STEPS.findIndex((st) => st.spotId === active.id),
    0,
  );
  const next = () => {
    const step = STEPS[(stepIndex + 1) % STEPS.length];
    if (step) goTo(step.pageId, step.spotId);
  };
  const running = playing && inView && !hidden;

  return (
    <div ref={rootRef} className="mt-10">
      <div
        role="tablist"
        aria-label="광고가 보이는 페이지"
        className="flex gap-1 overflow-x-auto border-b border-gray-200"
      >
        {PLACEMENT_PAGES.map((p) => {
          const selected = p.id === page.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectPage(p)}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-4 py-3 text-[15px] font-semibold transition-colors md:px-6',
                selected
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700',
              )}
            >
              {p.tab}
              <span className={cn('ml-1.5 text-sm', selected ? 'text-blue-500' : 'text-gray-300')}>
                {p.spots.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid items-start gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10">
        <div className="md:sticky md:top-24">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-gray-300" />
              <span className="size-2.5 rounded-full bg-gray-300" />
              <span className="size-2.5 rounded-full bg-gray-300" />
              <span className="ml-3 flex-1 truncate rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                {page.url}
              </span>
            </div>
            <div className="@container relative aspect-[1280/900] overflow-hidden bg-white">
              <div
                className={cn('relative aspect-[1280/1800] w-full transition-transform', EASE)}
                style={{ transform: `translateY(-${scrollOffset(active)}%)` }}
              >
                {PLACEMENT_PAGES.map((p) => (
                  <PageCanvas key={p.id} page={p} active={active} visible={p.id === page.id} />
                ))}
                <div
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute rounded-[0.8cqw] shadow-[0_0_0_9999px_rgba(15,23,42,0.45)] ring-2 ring-blue-500 transition-all',
                    EASE,
                  )}
                  style={{
                    top: `${rect.top}%`,
                    left: `${rect.left}%`,
                    width: `${rect.width}%`,
                    height: `${rect.height}%`,
                  }}
                >
                  {!active.banner && !active.mockCard && (
                    <span className="absolute inset-0 animate-pulse rounded-[0.8cqw] bg-blue-500/10 motion-reduce:animate-none" />
                  )}
                  <span className="absolute -top-2 left-2 -translate-y-full whitespace-nowrap rounded-sm bg-blue-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                    AD · {active.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {STEPS.map((step, i) => (
                <span
                  key={step.spotId}
                  className={cn(
                    'h-1 flex-1 overflow-hidden rounded-full',
                    i < stepIndex ? 'bg-blue-500' : 'bg-gray-200',
                  )}
                >
                  {i === stepIndex ? (
                    <span
                      key={run}
                      className="block h-full origin-left bg-blue-500"
                      style={
                        mounted
                          ? {
                              animation: `ogonggo-biz-progress ${DWELL_MS}ms linear forwards`,
                              animationPlayState: running ? 'running' : 'paused',
                            }
                          : { transform: 'scaleX(0)' }
                      }
                      onAnimationEnd={next}
                    />
                  ) : null}
                </span>
              ))}
            </div>
            <span className="shrink-0 text-sm tabular-nums text-gray-500">
              {stepIndex + 1} / {STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? '자동 넘김 멈춤' : '자동 넘김 재생'}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'block size-4',
                  playing ? 'icon-[lucide--pause]' : 'icon-[lucide--play]',
                )}
              />
            </button>
          </div>
        </div>

        <ol className="space-y-3">
          {page.spots.map((spot, i) => {
            const selected = spot.id === active.id;
            const product = productOf(spot);
            const tags =
              product?.tags ?? spot.tags?.map((label) => ({ label, highlight: false })) ?? [];
            return (
              <li
                key={spot.id}
                id={spot.id}
                className={cn(
                  'scroll-mt-24 rounded-xl border transition-colors',
                  selected
                    ? 'border-blue-500 bg-blue-50/40'
                    : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <button
                  type="button"
                  aria-expanded={selected}
                  aria-controls={`${spot.id}-detail`}
                  onClick={() => goTo(page.id, spot.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-sm transition-colors',
                      selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className={cn('block font-semibold', !selected && 'text-gray-700')}>
                      {spot.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-gray-500">
                      {product
                        ? `${won(product.price)} / 1주 · 예상 CTR ${product.ctr}`
                        : '가격은 견적 문의'}
                    </span>
                  </span>
                </button>
                <div
                  id={`${spot.id}-detail`}
                  className={cn(
                    'grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none',
                    selected ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden" inert={!selected}>
                    <div className="px-5 pb-5 pl-[60px]">
                      <h3 className="font-semibold">{product?.title ?? spot.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">
                        {(product?.description ?? spot.description ?? []).map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <li
                            key={t.label}
                            className={cn(
                              'rounded-sm px-2.5 py-1 text-xs',
                              t.highlight ? 'bg-teal-600 text-white' : 'bg-white text-gray-700',
                            )}
                          >
                            {t.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
