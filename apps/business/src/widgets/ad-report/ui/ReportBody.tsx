'use client';

import { type ReactNode, useMemo } from 'react';
import { enumLabel } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { CONTACT_EMAIL } from '@/shared/config/site';
import { EChart } from '@/shared/ui/EChart';
import { trendOption } from '../lib/chartOptions';
import { costEfficiency, dayLabel, ratio, rateLabelOf, statusCounts } from '../model/derive';
import {
  dotDate,
  formatCount,
  formatPercent,
  formatRate,
  formatSeconds,
  SOURCE_LABELS,
  todayYmd,
} from '../model/format';
import type { AdReport } from '../model/types';

/**
 * 광고 성과 리포트 본문. 구성과 문구는 목업(`오공고 광고 성과 리포트.html`, 2026-11-23 사용자)을 따른다:
 * 한눈에 보기 → 01 광고 구좌 성과 → 02 공고 전체 성과 → 03 공고 몰입도 → 04 타깃 적합도 → 05 비용 효율 →
 * 06 날짜별 추이 → 07 인사이트 → 지표 정의. 구좌 평균 비교와 탭별 노출·조회는 사용자가 뺐다.
 * 용어: 광고 카드를 눌러 공고를 연 것은 `조회`, 지원 버튼을 누른 것은 `지원하기 클릭` 이다.
 */

/** 배너 상품인지. 배너는 상세 페이지가 아니라 스크롤 깊이·체류 시간을 보이지 않는다(2026-11-19 사용자, 계약 5절). */
export const isBannerReport = (report: AdReport) => report.product.category === 'BANNER';

/** 배너가 데려온 상세 숫자가 있는지. 배너 링크가 공고 상세가 아니면 0 이다. */
const hasDetailNumbers = (report: AdReport) =>
  report.summary.views > 0 || report.summary.ctaClicks > 0;

/** 리포트 칸. PDF 가 이 칸의 아래 끝에서만 페이지를 나눈다(`data-pdf-block`). */
function Section({
  eyebrow,
  title,
  description,
  dark,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      data-pdf-block
      className={cn(
        'flex min-w-0 flex-col gap-5 rounded-2xl p-5 md:p-8',
        dark ? 'bg-[#16183a] text-white' : 'border border-gray-200 bg-white',
      )}
    >
      <header className="flex flex-col gap-1.5">
        <span className={cn('text-[13px] font-bold', dark ? 'text-[#b9bbff]' : 'text-blue-600')}>
          {eyebrow}
        </span>
        <h3
          className={cn('text-xl font-extrabold break-keep', dark ? 'text-white' : 'text-gray-950')}
        >
          {title}
        </h3>
        {description ? <p className="text-sm break-keep text-gray-500">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function NewBadge() {
  return (
    <span className="shrink-0 rounded-md bg-[#fff1dc] px-1.5 py-0.5 text-[11px] font-bold text-[#8a4b00]">
      신규 집계
    </span>
  );
}

/** 숫자 칸. `isNew` 는 이번에 새로 모으기 시작한 숫자라 `신규 집계` 를 붙인다. */
function Stat({
  label,
  value,
  sub,
  isNew,
}: {
  label: string;
  value: string;
  sub: string;
  isNew?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-sm text-gray-500">{label}</span>
        {isNew ? <NewBadge /> : null}
      </div>
      <span className="text-[28px] leading-tight font-extrabold tracking-tight text-gray-950 tabular-nums">
        {value}
      </span>
      <span className="text-xs leading-relaxed break-keep text-gray-500">{sub}</span>
    </div>
  );
}

const countOrDash = (value: number | null, unit: string) =>
  value == null ? '-' : `${formatCount(value)}${unit}`;

/** 한눈에 보기: 노출 → 조회 → 지원하기 클릭, 그리고 이 공고의 조회 중 광고에서 나온 비중. */
function Overview({ report }: { report: AdReport }) {
  const { summary } = report;
  const banner = isBannerReport(report);
  const withApply = !banner || hasDetailNumbers(report);
  const unit = banner ? '배너' : '광고 카드';
  const clickLabel = banner ? '클릭' : '조회';
  const steps = [
    {
      label: '노출',
      value: formatCount(summary.impressions),
      sub: `${unit}가 화면에 보인 횟수`,
      rate: `→ ${rateLabelOf(clickLabel)} ${formatRate(summary.adClickRate)}`,
    },
    {
      label: clickLabel,
      value: formatCount(summary.adClicks),
      sub: banner ? '배너를 누른 횟수' : '광고 카드를 눌러 공고를 연 횟수',
      rate: withApply
        ? `→ 지원 전환율 ${formatRate(ratio(summary.ctaClicks, summary.adClicks))}`
        : null,
    },
    ...(withApply
      ? [
          {
            label: '지원하기 클릭',
            value: formatCount(summary.ctaClicks),
            sub: '지원 버튼을 누른 횟수',
            rate: null,
          },
        ]
      : []),
  ];
  // 공고 전체 조회 중 광고 카드에서 나온 것. 대상 공고가 여럿이면 합친다.
  const totalViews = report.targets.reduce((acc, target) => acc + target.total.views, 0);
  const adShare = ratio(summary.views, totalViews);
  return (
    <Section eyebrow="한눈에 보기" title="광고가 지원까지 이어진 흐름">
      <div className={cn('grid gap-3', steps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex min-w-0 flex-col gap-1.5 rounded-2xl bg-gray-50 p-5"
          >
            <span className="text-sm text-gray-500">{step.label}</span>
            <span className="text-4xl font-extrabold tracking-tight text-gray-950 tabular-nums">
              {step.value}
            </span>
            <span className="text-[13px] break-keep text-gray-500">{step.sub}</span>
            {step.rate ? (
              <span className="mt-2 self-start rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[13px] font-bold text-blue-700">
                {step.rate}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {!banner && adShare != null && totalViews > 0 ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-2xl bg-blue-600 px-6 py-5 text-white">
          <span className="text-4xl font-extrabold tracking-tight tabular-nums">
            {Math.round(Math.min(adShare, 1) * 100)}%
          </span>
          <span className="min-w-0 flex-1 basis-72 text-base leading-relaxed break-keep">
            이 공고의 조회 {formatCount(totalViews)}회 중 {formatCount(summary.views)}회가 광고
            카드에서 나왔어요.
          </span>
        </div>
      ) : null}
    </Section>
  );
}

/** 01. 광고 구좌 성과: 노출, 도달, 평균 빈도, 조회, 조회한 사람, 조회율. */
function SlotSection({ report }: { report: AdReport }) {
  const { summary, audience } = report;
  const banner = isBannerReport(report);
  const unit = banner ? '배너' : '광고 카드';
  const clickLabel = banner ? '클릭' : '조회';
  return (
    <Section
      eyebrow="01 · 광고 구좌 성과"
      title={`몇 명에게 보였고, 몇 번 ${clickLabel}됐나요?`}
      description={`이 상품의 ${unit}로 발생한 숫자만 셉니다.`}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat
          label="노출"
          value={formatCount(summary.impressions)}
          sub={`${unit}가 절반 이상, 1초 넘게 보인 횟수`}
        />
        <Stat
          label="도달"
          value={countOrDash(audience.reach, '명')}
          sub={`기간 동안 ${unit}를 본 사람 수 (중복 제외)`}
          isNew
        />
        <Stat
          label="평균 빈도"
          value={audience.avgFrequency == null ? '-' : `${audience.avgFrequency.toFixed(1)}회`}
          sub="한 사람이 평균 몇 번 봤는지"
          isNew
        />
        <Stat
          label={clickLabel}
          value={formatCount(summary.adClicks)}
          sub={banner ? '배너를 누른 횟수' : '카드를 눌러 공고를 연 횟수'}
        />
        <Stat
          label={banner ? '클릭한 사람' : '조회한 사람'}
          value={countOrDash(audience.adClickVisitors, '명')}
          sub={banner ? '배너를 누른 사람 수 (중복 제외)' : '공고를 연 사람 수 (중복 제외)'}
          isNew
        />
        <Stat
          label={rateLabelOf(clickLabel)}
          value={formatRate(summary.adClickRate)}
          sub={`${clickLabel} ÷ 노출`}
        />
      </div>
      <ExposureTable report={report} />
    </Section>
  );
}

const TH = 'px-2 py-2 text-right font-medium first:text-left';
const TD = 'px-2 py-2.5 text-right tabular-nums first:text-left';

/** 광고물(노출 소재)별 표. 하나뿐이면 요약 카드와 같은 숫자라 보이지 않는다(2026-11-19 사용자). */
function ExposureTable({ report }: { report: AdReport }) {
  if (report.exposures.length < 2) return null;
  const clickLabel = isBannerReport(report) ? '클릭' : '조회';
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-gray-50 p-5">
      <span className="text-base font-bold text-gray-950">광고물별 성과</span>
      <table className="w-full table-fixed text-xs sm:text-sm">
        <thead className="text-gray-500">
          <tr>
            <th className={cn(TH, 'w-[40%]')}>광고물</th>
            <th className={TH}>노출</th>
            <th className={TH}>{clickLabel}</th>
            <th className={TH}>{rateLabelOf(clickLabel)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {report.exposures.map((exposure) => (
            <tr key={exposure.exposureId}>
              <td className={cn(TD, 'break-keep')}>{exposure.name}</td>
              <td className={TD}>{formatCount(exposure.impressions)}</td>
              <td className={TD}>{formatCount(exposure.adClicks)}</td>
              <td className={cn(TD, 'font-semibold')}>{formatRate(exposure.adClickRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 02. 공고 전체 성과: 대상 공고마다 조회, 조회한 사람, 회원 조회, 지원하기 클릭, 저장, 공유와 유입 경로별. */
function PostingSection({ report }: { report: AdReport }) {
  return (
    <Section
      eyebrow="02 · 공고 전체 성과"
      title="공고는 얼마나 읽혔고, 지원으로 이어졌나요?"
      description="광고 카드뿐 아니라 일반 목록, 검색, 외부 링크 등 모든 경로를 합친 숫자예요."
    >
      {report.targets.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">이 계약에 연결된 공고가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {report.targets.map((target) => {
            const maxViews = Math.max(1, ...target.bySource.map((row) => row.views));
            return (
              <div key={`${target.targetType}-${target.targetId}`} className="flex flex-col gap-4">
                {report.targets.length > 1 ? (
                  <p className="font-semibold break-keep text-gray-900">
                    <span className="mr-2 text-xs font-normal text-gray-500">
                      {target.targetType === 'JOB' ? '채용공고' : '부트캠프'}
                    </span>
                    {target.title}
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  <Stat label="조회" value={formatCount(target.total.views)} sub="모든 경로 합계" />
                  <Stat
                    label="조회한 사람"
                    value={`${formatCount(target.total.uniqueVisitors)}명`}
                    sub="공고를 연 서로 다른 사람"
                  />
                  <Stat
                    label="회원 조회"
                    value={formatCount(target.total.memberViews)}
                    sub="로그인 상태로 연 조회"
                  />
                  <Stat
                    label="지원하기 클릭"
                    value={formatCount(target.total.ctaClicks)}
                    sub="지원 페이지로 이동한 횟수"
                  />
                  <Stat
                    label="저장"
                    value={formatCount(target.total.saves)}
                    sub="북마크한 사람 수"
                    isNew
                  />
                  <Stat
                    label="공유"
                    value={formatCount(target.total.shares)}
                    sub="링크 공유 횟수"
                    isNew
                  />
                </div>
                <div className="flex flex-col gap-2 rounded-2xl bg-gray-50 p-5">
                  <span className="text-base font-bold text-gray-950">유입 경로별</span>
                  <ul className="flex flex-col gap-2">
                    {target.bySource.map((row) => (
                      <li
                        key={row.source}
                        className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm"
                      >
                        <span className="text-gray-600">{SOURCE_LABELS[row.source]}</span>
                        <span className="h-3 rounded-full bg-gray-200">
                          <span
                            className={cn(
                              'block h-3 rounded-full',
                              row.source === 'AD_CARD' || row.source === 'BANNER'
                                ? 'bg-blue-600'
                                : 'bg-gray-400',
                            )}
                            style={{ width: `${(row.views / maxViews) * 100}%` }}
                          />
                        </span>
                        <span className="text-right text-xs text-gray-500 tabular-nums">
                          조회 {formatCount(row.views)} · 지원하기 클릭 {formatCount(row.ctaClicks)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

/** 03. 공고 몰입도: 평균 체류·스크롤 깊이(공고 전체 기준을 옆에), 어디까지 읽었나요. 배너는 상세 페이지가 아니라 없다. */
function EngagementSection({ report }: { report: AdReport }) {
  const { summary } = report;
  const steps = summary.scrollFunnel ?? [];
  const opened = steps[0]?.visitors ?? 0;
  // 대상 공고가 하나일 때만 "공고 전체 기준" 을 옆에 적는다. 여럿이면 어느 공고인지 가릴 수 없다.
  const whole = report.targets.length === 1 ? report.targets[0]?.total : null;
  const labels: Record<number, string> = {
    0: '공고를 연 사람',
    25: '25%까지',
    50: '50%까지',
    75: '75%까지',
    100: '끝까지',
  };
  return (
    <Section
      eyebrow="03 · 공고 몰입도"
      title="들어온 사람은 공고를 얼마나 읽었나요?"
      description={`광고 카드로 공고를 연 ${formatCount(opened)}명 기준이에요.`}
    >
      {opened === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">아직 공고를 연 사람이 없어요.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Stat
              label="평균 체류 시간"
              value={formatSeconds(summary.avgDurationSeconds)}
              sub={
                whole
                  ? `공고 전체 기준 ${formatSeconds(whole.avgDurationSeconds)}`
                  : '공고를 연 뒤 떠날 때까지'
              }
            />
            <Stat
              label="평균 스크롤 깊이"
              value={formatPercent(summary.avgScrollPercent)}
              sub={
                whole
                  ? `공고 전체 기준 ${formatPercent(whole.avgScrollPercent)}`
                  : '떠날 때 가장 깊이 내린 비율'
              }
            />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-5">
            <span className="text-base font-bold text-gray-950">어디까지 읽었나요?</span>
            {steps.map((step) => (
              <div
                key={step.threshold}
                className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 text-sm"
              >
                <span className="text-gray-700">{labels[step.threshold]}</span>
                <span className="h-3.5 rounded-full bg-gray-200">
                  <span
                    className="block h-3.5 rounded-full bg-blue-600"
                    style={{ width: `${(step.visitors / opened) * 100}%` }}
                  />
                </span>
                <span className="text-right font-bold text-gray-900 tabular-nums">
                  {formatCount(step.visitors)}명
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

/** 04. 타깃 적합도: 희망 직무(타깃은 진하게), 타깃 직무 일치율, 로그인 회원 비중, 신분·학년. 로그인 회원만 센다. */
function AudienceSection({ report }: { report: AdReport }) {
  const { audience, summary, byJobField } = report;
  const { targetMatch, targetJobFields, byGrade } = audience;
  if (summary.uniqueVisitors === 0 && byJobField.length === 0) return null;
  const max = Math.max(1, ...byJobField.map((row) => row.memberUniqueVisitors));
  const status = statusCounts(byGrade);
  const grades = byGrade.filter((row) => row.grade != null && row.memberUniqueVisitors > 0);
  return (
    <Section
      eyebrow="04 · 타깃 적합도"
      title="우리가 원하는 사람이 봤나요?"
      description="로그인한 회원만 집계해요. 희망 직무를 여러 개 고른 회원은 직무마다 한 번씩 세요."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-5">
          <span className="text-base font-bold text-gray-950">희망 직무</span>
          {byJobField.length === 0 ? (
            <p className="py-2 text-sm text-gray-500">아직 공고를 연 로그인 회원이 없어요.</p>
          ) : (
            byJobField.map((row) => {
              const target = row.jobField != null && targetJobFields.includes(row.jobField);
              return (
                <div
                  key={row.jobField ?? 'none'}
                  className="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm"
                >
                  <span className="truncate text-gray-700">{row.label}</span>
                  <span className="h-3.5 rounded-full bg-gray-200">
                    <span
                      className={cn(
                        'block h-3.5 rounded-full',
                        target ? 'bg-blue-600' : 'bg-gray-400',
                      )}
                      style={{ width: `${(row.memberUniqueVisitors / max) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-bold text-gray-900 tabular-nums">
                    {formatCount(row.memberUniqueVisitors)}명
                  </span>
                </div>
              );
            })
          )}
          <p className="text-[13px] text-gray-500">진한 색이 광고주가 지정한 타깃 직무예요.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Stat
            label="타깃 직무 일치율"
            value={formatRate(targetMatch.rate)}
            sub={
              targetJobFields.length === 0
                ? '이 광고에는 타깃 직군이 없어 계산하지 않아요'
                : `${targetJobFields.map((field) => enumLabel('JobField', field)).join(', ')}을 하나라도 희망하는 회원 ${formatCount(targetMatch.matchedMembers)}명 ÷ 공고를 연 회원 ${formatCount(targetMatch.members)}명`
            }
            isNew
          />
          <Stat
            label="로그인 회원 비중"
            value={`${formatCount(summary.memberUniqueVisitors)}명 / ${formatCount(summary.uniqueVisitors)}명`}
            sub={`${isBannerReport(report) ? '배너' : '광고 카드'}로 공고를 연 사람 중 회원`}
          />
          <div className="flex flex-col gap-2.5 rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-sm text-gray-500">신분 · 학년</span>
              <NewBadge />
            </div>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <span className="rounded-full bg-gray-100 px-2.5 py-1.5">
                재학 {formatCount(status.studying)}명
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1.5">
                졸업 {formatCount(status.graduated)}명
              </span>
              {status.unset > 0 ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-1.5">
                  학년 미설정 {formatCount(status.unset)}명
                </span>
              ) : null}
            </div>
            {grades.length > 0 ? (
              <p className="text-xs text-gray-500">
                {grades
                  .map((row) => `${row.label} ${formatCount(row.memberUniqueVisitors)}명`)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}

/** 05. 비용 효율. 광고비는 상품 정가다. 정가가 없는 견적 문의 상품은 칸을 그리지 않는다. */
function CostSection({ report }: { report: AdReport }) {
  const cost = costEfficiency(report, isBannerReport(report));
  if (!cost) return null;
  return (
    <Section
      eyebrow="05 · 비용 효율"
      title="광고비만큼 효과가 있었나요?"
      description={
        cost.prorated
          ? `정가 ${formatCount(report.product.price ?? 0)}원 중 게시 ${cost.prorated[1]}일 가운데 ${cost.prorated[0]}일치 ${formatCount(Math.round(cost.cost))}원 기준이에요. 무료 혜택이라면 정가 기준으로 환산해서 보여줘요.`
          : `광고비 ${formatCount(Math.round(cost.cost))}원 기준이에요. 무료 혜택이라면 정가 기준으로 환산해서 보여줘요.`
      }
    >
      <div
        className={cn('grid gap-3', cost.items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}
      >
        {cost.items.map((item) => (
          <Stat key={item.label} label={item.label} value={item.value} sub={item.sub} />
        ))}
      </div>
    </Section>
  );
}

/** 06. 날짜별 추이: 그래프와 표(합계 줄 포함). 수집 시작일 앞 날짜는 "집계 전" 이다. */
function TrendSection({ report }: { report: AdReport }) {
  const banner = isBannerReport(report);
  const clickLabel = banner ? '클릭' : '조회';
  const withApply = !banner || hasDetailNumbers(report);
  const today = todayYmd();
  const { summary } = report;
  const option = useMemo(
    () => trendOption(report.daily, report.collectedSince, clickLabel, withApply),
    [report, clickLabel, withApply],
  );
  const cells = withApply ? 5 : 3;
  return (
    <Section eyebrow="06 · 날짜별 추이" title="하루하루 어떻게 움직였나요?">
      <EChart option={option} height={280} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] table-fixed text-xs sm:text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className={cn(TH, 'w-[28%]')}>날짜</th>
              <th className={TH}>노출</th>
              <th className={TH}>{clickLabel}</th>
              <th className={TH}>{rateLabelOf(clickLabel)}</th>
              {withApply ? (
                <>
                  <th className={TH}>지원하기 클릭</th>
                  <th className={TH}>지원 전환율</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {report.daily.map((row) => (
              <tr key={row.date}>
                <td className={TD}>{dayLabel(row.date, today)}</td>
                {row.date < report.collectedSince ? (
                  <td colSpan={cells} className="px-2 py-2.5 text-right text-gray-400">
                    집계 전
                  </td>
                ) : (
                  <>
                    <td className={TD}>{formatCount(row.impressions)}</td>
                    <td className={TD}>{formatCount(row.adClicks)}</td>
                    <td className={TD}>{formatRate(ratio(row.adClicks, row.impressions))}</td>
                    {withApply ? (
                      <>
                        <td className={TD}>{formatCount(row.ctaClicks)}</td>
                        <td className={TD}>{formatRate(ratio(row.ctaClicks, row.adClicks))}</td>
                      </>
                    ) : null}
                  </>
                )}
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-extrabold">
              <td className={TD}>합계</td>
              <td className={TD}>{formatCount(summary.impressions)}</td>
              <td className={TD}>{formatCount(summary.adClicks)}</td>
              <td className={TD}>{formatRate(summary.adClickRate)}</td>
              {withApply ? (
                <>
                  <td className={TD}>{formatCount(summary.ctaClicks)}</td>
                  <td className={TD}>{formatRate(ratio(summary.ctaClicks, summary.adClicks))}</td>
                </>
              ) : null}
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/** 07. 인사이트와 다음 제안. 운영자가 써서 보낸 것만 온다. 없으면 칸을 그리지 않는다. */
function InsightsSection({ report }: { report: AdReport }) {
  const insights = report.insights ?? [];
  if (insights.length === 0) return null;
  return (
    <Section eyebrow="07 · 인사이트와 다음 제안" title="오공고가 본 이번 광고" dark>
      <ul className="grid gap-3 md:grid-cols-2">
        {insights.map((insight, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-2xl bg-[#23265a] p-5">
            <p className="text-base leading-snug font-bold break-keep">{insight.title}</p>
            <p className="text-sm leading-relaxed break-keep whitespace-pre-line text-[#d3d5f5]">
              {insight.body}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** 지표 정의. 배너 리포트에서는 `scroll` 이 붙은 줄(스크롤·체류)을 뺀다. 앞 열 개는 목업의 문구다. */
const DEFINITIONS: readonly (readonly [string, string, 'scroll'?])[] = [
  ['노출', '광고 카드가 화면에 절반 이상, 1초 넘게 보인 횟수'],
  ['도달', '기간 동안 광고 카드를 본 서로 다른 사람 수 (회원, 비회원은 익명 방문자 ID 기준)'],
  ['평균 빈도', '노출 ÷ 도달. 한 사람이 같은 광고를 평균 몇 번 봤는지'],
  ['조회', '공고를 연 횟수. 광고 구좌는 카드를 누른 횟수로 셈'],
  ['조회한 사람', '공고를 연 서로 다른 사람 수. 광고 구좌는 광고를 눌러 연 사람'],
  ['조회율', '조회 ÷ 노출'],
  ['지원 전환율', '지원하기 클릭 ÷ 조회'],
  [
    '지원하기 클릭',
    '공고의 지원하기 버튼을 누른 횟수. 이후 외부 지원 페이지의 실제 제출 여부는 알 수 없음',
  ],
  [
    '스크롤 깊이',
    '공고를 연 사람이 25·50·75·100%까지 내렸는지. 사람마다 가장 깊이 내린 값으로 셈',
    'scroll',
  ],
  ['평균 체류', '공고를 열고 떠날 때까지 화면이 보인 시간의 평균', 'scroll'],
  [
    '타깃 직무 일치율',
    '공고를 연 로그인 회원 중 희망 직무의 직군이 광고 공고의 직군과 겹치는 회원 비율',
  ],
  [
    '신분 · 학년',
    '공고를 연 로그인 회원의 프로필 학년. 1~4학년·5학년 이상은 재학, 졸업생은 졸업으로 묶음',
  ],
  ['저장', '기간 안에 대상 공고를 저장했고 지금도 저장 중인 사람 수. 저장을 풀면 빠짐'],
  ['공유', '대상 공고의 링크 복사·공유 창·SNS 공유 횟수'],
  ['비용 효율', '광고비(상품 정가)를 노출, 조회, 지원하기 클릭 수로 나눈 값'],
  ['광고 구좌 성과', '광고 카드를 통해 들어온 것만 셈'],
  ['공고 전체 성과', '일반 목록, 검색, 외부 링크 등 모든 유입을 합침'],
];

function Definitions({ report }: { report: AdReport }) {
  const banner = isBannerReport(report);
  const rows = DEFINITIONS.filter(([, , kind]) => !(banner && kind === 'scroll'));
  return (
    <section data-pdf-block className="flex flex-col gap-3.5 px-1 py-2">
      <h3 className="text-base font-extrabold text-gray-950">지표는 이렇게 셌어요</h3>
      <dl className="grid gap-x-8 md:grid-cols-2">
        {rows.map(([term, description]) => (
          <div
            key={term}
            className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-t border-gray-200 py-2 text-[13px] leading-relaxed"
          >
            <dt className="font-bold text-gray-900">{term}</dt>
            <dd className="break-keep text-gray-600">{description}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-500">문의 {CONTACT_EMAIL}</p>
    </section>
  );
}

/**
 * 리포트 본문. 기간이 수집 시작일보다 앞이면 그 앞은 "집계 전" 이다. 기간 전체가 그렇다면 숫자 대신 안내만 보인다.
 * 배너 상품은 스크롤 깊이·체류 시간(03)을 보이지 않는다.
 */
export function ReportBody({ report }: { report: AdReport }) {
  const allBefore = report.to < report.collectedSince;
  const partlyBefore = !allBefore && report.from < report.collectedSince;

  if (allBefore) {
    return (
      <div className="flex flex-col gap-4">
        <p
          data-pdf-block
          className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-10 text-center text-sm break-keep text-gray-600"
        >
          이 기간({dotDate(report.from)} ~ {dotDate(report.to)})은 집계 전이에요. 성과 숫자는{' '}
          {dotDate(report.collectedSince)}부터 모으고 있어요.
        </p>
        <Definitions report={report} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {partlyBefore ? (
        <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm break-keep text-gray-600">
          {dotDate(report.collectedSince)} 이전은 집계 전이에요. 성과 숫자는 그날부터 모으고 있어
          요약 숫자에 그 앞 날짜는 들어가지 않아요.
        </p>
      ) : null}
      <Overview report={report} />
      <SlotSection report={report} />
      <PostingSection report={report} />
      {isBannerReport(report) ? null : <EngagementSection report={report} />}
      <AudienceSection report={report} />
      <CostSection report={report} />
      <TrendSection report={report} />
      <InsightsSection report={report} />
      <Definitions report={report} />
    </div>
  );
}
