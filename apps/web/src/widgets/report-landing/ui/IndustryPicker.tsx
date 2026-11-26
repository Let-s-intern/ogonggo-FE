'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge, Button, Card, Chip, cn } from '@ogonggo/ui';
import { INDUSTRY_REPORTS, type IndustrySlug } from '@/shared/config/industryReports';
import { INDUSTRY_LANDING_COPY } from '../model/landingMock';

/**
 * 산업마다 쓰는 아이콘. Iconify 플러그인은 소스에 적힌 글자를 스캔하므로 이름을 조립하지 않고 통째로 적는다.
 * `Record` 라 산업이 늘면 여기서 빠뜨린 칸을 타입 검사가 잡는다.
 */
const INDUSTRY_ICON: Record<IndustrySlug, string> = {
  fnb: 'icon-[lucide--utensils]',
  'it-platform': 'icon-[lucide--smartphone]',
  beauty: 'icon-[lucide--sparkles]',
  entertainment: 'icon-[lucide--clapperboard]',
  'retail-ecommerce': 'icon-[lucide--shopping-bag]',
};

/**
 * 산업 고르기. 위의 칩 다섯에서 산업을 고르면 아래 패널이 그 산업의 이번 주 헤드라인, 키워드, 자주 보이는 직무로
 * 바뀌고, 패널 안 `리포트 보기` 버튼이 판매 상세(`/reports/{slug}`)로 간다. 누르는 것은 칩과 버튼이고 패널 자체는
 * 링크가 아니다.
 *
 * 칩은 `aria-pressed` 로 고른 것을 알리는 토글 버튼 묶음이다. 첫 렌더는 첫 산업이 골라진 상태라 서버가 그린 화면과
 * 다르지 않다. 이 화면의 유일한 클라이언트 컴포넌트다.
 */
export function IndustryPicker() {
  const [selected, setSelected] = useState<IndustrySlug>(INDUSTRY_REPORTS[0].slug);
  const report = INDUSTRY_REPORTS.find((item) => item.slug === selected) ?? INDUSTRY_REPORTS[0];
  const copy = INDUSTRY_LANDING_COPY[report.slug];

  return (
    <section id="industries" aria-labelledby="industries-title" className="scroll-mt-6">
      <h2 id="industries-title" className="text-4xl font-bold break-keep text-gray-950 md:text-5xl">
        어느 산업이 궁금해요?
      </h2>
      <p className="mt-2 text-base break-keep text-gray-600">
        산업을 누르면 이번 주 헤드라인과 직무가 바뀌어요.
      </p>

      <div role="group" aria-label="산업 선택" className="mt-6 flex flex-wrap gap-2">
        {INDUSTRY_REPORTS.map((item) => (
          <Chip
            key={item.slug}
            tone={item.slug === selected ? 'blue' : 'gray'}
            aria-pressed={item.slug === selected}
            onClick={() => setSelected(item.slug)}
            className="h-11 cursor-pointer px-5 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {item.label}
          </Chip>
        ))}
      </div>

      <Card
        aria-live="polite"
        className="mt-4 grid gap-8 rounded-xl p-6 md:p-8 lg:grid-cols-12 lg:gap-12"
      >
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-500">
              <span aria-hidden="true" className={cn(INDUSTRY_ICON[report.slug], 'h-6 w-6')} />
            </span>
            <div>
              <h3 className="text-3xl font-bold text-gray-950">{report.label}</h3>
              <p className="text-sm break-keep text-gray-500">{copy.tagline}</p>
            </div>
          </div>
          <p className="mt-6 text-sm font-semibold text-gray-500">이번 주 헤드라인</p>
          <p className="mt-1 text-2xl font-bold break-keep text-gray-950 lg:text-3xl">{copy.headline}</p>
          <p className="mt-6 text-sm font-semibold text-gray-500">이번 주 키워드</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {copy.keywords.map((keyword) => (
              <li key={keyword}>
                <Badge tone="neutral" className="rounded-full px-3 py-1 text-xs">
                  {keyword}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col rounded-lg bg-blue-00 p-5 lg:col-span-5">
          <p className="text-sm font-semibold text-gray-500">공고에서 자주 보이는 직무</p>
          <ol className="mt-3 divide-y divide-blue-100">
            {copy.roles.map((role, index) => (
              <li key={role} className="flex items-center gap-3 py-2.5 text-base font-semibold text-gray-900">
                <span className="w-6 text-sm font-bold text-blue-600 tabular-nums">{index + 1}</span>
                {role}
              </li>
            ))}
          </ol>
          <div className="mt-auto pt-6">
            <Button
              asChild
              className="w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <Link href={`/reports/${report.slug}`}>
                {report.label} 리포트 보기
                <span aria-hidden="true" className="ml-1.5 icon-[lucide--arrow-right] h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
