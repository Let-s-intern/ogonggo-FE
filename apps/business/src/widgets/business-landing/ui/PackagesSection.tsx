'use client';

import { useState } from 'react';
import { Badge, Button, Tabs, cn } from '@ogonggo/ui';
import { SALES_EMAIL } from '@/shared/config/site';
import { CHANNEL_COMPARISON, PACKAGES } from '../model/content';
import { LandingSectionHeading } from './LandingSectionHeading';

/**
 * 시안 `STEP 3 · 함께 집행하면`. 지면만·채널만·함께 셋을 견주고, 목적별 추천 패키지 셋을 탭으로 바꿔 본다.
 * `이 패키지로 견적 받기` 는 견적 메일을 연다(`memos/결정-광고시스템-business-랜딩-2026-11-03.md`).
 */
export function PackagesSection() {
  const [name, setName] = useState<string>(PACKAGES[0]!.name);
  const selected = PACKAGES.find((item) => item.name === name) ?? PACKAGES[0]!;

  return (
    <section id="packages" className="scroll-mt-4 bg-gray-50">
      <div className="mx-auto max-w-page-padded px-5 py-16 md:py-24">
        <LandingSectionHeading
          eyebrow="STEP 3 · 함께 집행하면"
          title={"공고를 '보는' 지면과 공고를 '추천받는' 채널,\n둘 다 쓰면 지원자가 달라져요"}
        />
        <ul className="grid gap-3 pt-10 md:grid-cols-3">
          {CHANNEL_COMPARISON.map((item) => (
            <li
              key={item.label}
              className={cn(
                'rounded-md border bg-white p-5',
                item.recommended ? 'border-blue-500' : 'border-gray-200',
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">{item.label}</span>
                {item.recommended ? (
                  <Badge tone="main" className="rounded-full">
                    추천
                  </Badge>
                ) : null}
              </span>
              <p className="pt-2 text-lg font-bold text-gray-900">{item.title}</p>
              <p className="pt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
            </li>
          ))}
        </ul>

        <div className="pt-14">
          <p className="text-xl font-bold text-gray-950">목적별 추천 패키지</p>
          <p className="pt-1 text-sm text-gray-500">
            오늘의공고 지면 + 렛츠커리어 채널 조합 예시 · 실제 구성은 상담 후 확정
          </p>
          <div className="pt-6">
            <Tabs
              aria-label="추천 패키지"
              items={PACKAGES.map((item) => ({ value: item.name, label: item.name }))}
              value={selected.name}
              onValueChange={setName}
            />
          </div>
          <div
            role="tabpanel"
            className="mt-6 rounded-md border border-gray-200 bg-white p-5 md:p-8"
          >
            <p className="text-sm text-gray-500">{selected.situation}</p>
            <ol className="flex flex-col divide-y divide-gray-100 pt-4">
              {selected.items.map((item) => (
                <li
                  key={item.name}
                  className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:gap-4"
                >
                  <Badge
                    tone={item.source === '오늘의공고' ? 'main' : 'neutral'}
                    className="w-fit rounded-full"
                  >
                    {item.source}
                  </Badge>
                  <span className="text-base font-bold text-gray-900 md:w-80">{item.name}</span>
                  <span className="flex-1 text-sm text-gray-600">{item.why}</span>
                  <span className="text-sm font-semibold text-blue-500">{item.timing}</span>
                </li>
              ))}
            </ol>
            <p className="pt-6 text-sm font-bold text-gray-900">이렇게 흘러가요</p>
            <ol className="grid gap-3 pt-3 md:grid-cols-3">
              {selected.flow.map((step, index) => (
                <li key={step.title} className="rounded-md bg-gray-50 p-4">
                  <p className="text-xs font-bold text-blue-500">{index + 1}</p>
                  <p className="pt-1 text-sm font-bold text-gray-900">{step.title}</p>
                  <p className="pt-1 text-sm text-gray-600">{step.description}</p>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-700">{selected.expect}</p>
              <Button asChild size="sm">
                <a
                  href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`[견적 문의] ${selected.name} 패키지`)}`}
                >
                  이 패키지로 견적 받기
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
