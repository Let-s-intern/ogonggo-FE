'use client';

import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { PRIVACY_POLICY_URL } from '@/shared/config/site';
import { PLACEMENTS } from '@/widgets/landing/content';
import {
  AD_REQUEST_MAX,
  addDays,
  BOOKABLE_WEEKS,
  CREATIVE_OPTIONS,
  type FormValues,
  formatDate,
  INITIAL_VALUES,
  INVOICE_OPTIONS,
  nextMonday,
  parseYmd,
  periodText,
  PURPOSE_OPTIONS,
  RECRUIT_TYPES,
  type RecruitType,
  SCHEDULE_NOTE_MAX,
  selectedProducts,
  STEPS,
  TARGET_OPTIONS,
  toRequest,
  toYmd,
  validateStep,
} from './model';

type Update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;

const INPUT =
  'w-full rounded-md border border-gray-200 px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500';

function Label({
  children,
  required,
  optional,
}: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <p className="mb-2 text-sm font-medium text-gray-800">
      {children}
      {required && <span className="ml-1 text-blue-500">*</span>}
      {optional && <span className="ml-1 font-normal text-gray-400">· 선택</span>}
    </p>
  );
}

function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-error">
      {children}
    </p>
  );
}

function Info({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-blue-00 px-4 py-3.5 text-sm leading-relaxed text-gray-600">
      {children}
    </p>
  );
}

function RadioCards<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              'flex cursor-pointer gap-3 rounded-lg border px-5 py-4 transition-colors',
              checked ? 'border-blue-500 bg-blue-00' : 'border-gray-200 hover:border-gray-300',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="mt-1 size-4 accent-blue-500"
            />
            <span>
              <span className="block font-semibold">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-sm text-gray-500">{o.hint}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function StepPost({
  v,
  set,
  errors,
}: {
  v: FormValues;
  set: Update;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label required>홍보 유형</Label>
        <RadioCards
          name="target"
          options={TARGET_OPTIONS}
          value={v.target}
          onChange={(x) => set('target', x)}
        />
      </div>
      <div>
        <Label required>기업명</Label>
        <input
          className={INPUT}
          value={v.companyName}
          onChange={(e) => set('companyName', e.target.value)}
          placeholder="기업 또는 기관명"
        />
        <ErrorText>{errors.companyName}</ErrorText>
      </div>
      <div>
        <Label required>공고명</Label>
        <input
          className={INPUT}
          value={v.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="예) 브랜드 마케팅 인턴 모집"
        />
        <ErrorText>{errors.title}</ErrorText>
      </div>
      <div>
        <Label required>공고·지원 링크</Label>
        <input
          className={INPUT}
          type="url"
          inputMode="url"
          value={v.url}
          onChange={(e) => set('url', e.target.value)}
          placeholder="https://example.com/recruit"
        />
        <ErrorText>{errors.url}</ErrorText>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>
            {v.recruitType === '기간 지정 모집' ? '모집 마감일' : '모집 마감일(예정)'}
          </Label>
          <input
            className={INPUT}
            type="date"
            value={v.deadline}
            onChange={(e) => set('deadline', e.target.value)}
          />
          <ErrorText>{errors.deadline}</ErrorText>
        </div>
        <div>
          <Label required>모집 형태</Label>
          <select
            className={INPUT}
            value={v.recruitType}
            onChange={(e) => set('recruitType', e.target.value as RecruitType)}
          >
            {RECRUIT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label required>광고 목적</Label>
        <RadioCards
          name="purpose"
          options={PURPOSE_OPTIONS}
          value={v.purpose}
          onChange={(x) => set('purpose', x)}
        />
      </div>
      <Info>
        광고 시작일이 모집 마감일 이후인 경우 집행이 어려울 수 있습니다. 마감 일정에 맞춰 광고
        기간을 선택해 주세요.
      </Info>
    </div>
  );
}

function StepProducts({
  v,
  set,
  errors,
}: {
  v: FormValues;
  set: Update;
  errors: Record<string, string>;
}) {
  const toggle = (id: string) =>
    set(
      'productIds',
      v.productIds.includes(id) ? v.productIds.filter((x) => x !== id) : [...v.productIds, id],
    );
  return (
    <div className="space-y-6">
      <div>
        <Label required>오늘의 공고 지면</Label>
        <ul className="space-y-3">
          {PLACEMENTS.map((p) => {
            const checked = v.productIds.includes(p.id);
            return (
              <li key={p.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-5 py-4 transition-colors',
                    checked
                      ? 'border-blue-500 bg-blue-00'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    className="mt-1 size-4 accent-blue-500"
                  />
                  <span className="flex-1">
                    <span className="block font-semibold">{p.title}</span>
                    <span className="mt-0.5 block text-sm text-gray-500">{p.description[0]}</span>
                  </span>
                  <span className="shrink-0 text-right text-sm">
                    <span className="block font-semibold">{p.price.toLocaleString('ko-KR')}원</span>
                    <span className="text-xs text-gray-500">/1주 · VAT 별도</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <ErrorText>{errors.productIds}</ErrorText>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-5 py-4">
        <input
          type="checkbox"
          checked={v.withChannels}
          onChange={(e) => set('withChannels', e.target.checked)}
          className="mt-1 size-4 accent-blue-500"
        />
        <span>
          <span className="block font-semibold">렛츠커리어 채널 광고도 함께 상담받기</span>
          <span className="mt-0.5 block text-sm text-gray-500">
            인스타그램 · 카카오톡 오픈채팅 · 채널 DM · 웹 배너. 가격은 견적으로 안내해요.
          </span>
        </span>
      </label>
      <Info>
        3개 이상 묶어 신청하면 10% 할인돼요. 최종 금액은 담당자 확인 후 견적서로 안내합니다.
      </Info>
    </div>
  );
}

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function StepSchedule({
  v,
  set,
  errors,
}: {
  v: FormValues;
  set: Update;
  errors: Record<string, string>;
}) {
  const firstBookable = useMemo(() => nextMonday(new Date()), []);
  const lastBookable = addDays(firstBookable, BOOKABLE_WEEKS * 7 - 1);
  const [month, setMonth] = useState(() => {
    const base = v.weekStart ? parseYmd(v.weekStart) : firstBookable;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // 달력 첫 칸은 그 달 1일이 들어 있는 주의 월요일이다.
  const gridStart = addDays(month, -((month.getDay() + 6) % 7));
  const weeks: Date[] = [];
  for (let w = gridStart; w.getMonth() === month.getMonth() || w < month; w = addDays(w, 7)) {
    weeks.push(w);
  }

  const start = v.weekStart ? parseYmd(v.weekStart) : null;
  const end = start ? addDays(start, v.weekCount * 7 - 1) : null;
  const deadline = v.deadline ? parseYmd(v.deadline) : null;

  const bookable = (monday: Date) =>
    monday >= firstBookable && monday <= lastBookable && (!deadline || monday <= deadline);

  function pickWeek(monday: Date) {
    if (!bookable(monday)) return;
    if (!start || v.weekCount > 1 || monday <= start) {
      set('weekStart', toYmd(monday));
      set('weekCount', 1);
      return;
    }
    set('weekCount', Math.round((monday.getTime() - start.getTime()) / (7 * 86400000)) + 1);
  }

  const canPrev = month > new Date(firstBookable.getFullYear(), firstBookable.getMonth(), 1);
  const canNext = month < new Date(lastBookable.getFullYear(), lastBookable.getMonth(), 1);
  const products = selectedProducts(v);

  return (
    <div className="space-y-6">
      <div>
        <Label>선택된 광고 상품</Label>
        <div className="rounded-lg border border-blue-500 bg-blue-00 px-5 py-4">
          <p className="font-semibold">{products.map((p) => p.title).join(', ')}</p>
          <p className="mt-0.5 text-sm text-gray-500">월요일부터 일요일까지 1주 단위로 노출</p>
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-semibold">
            {month.getFullYear()}년 {month.getMonth() + 1}월
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="이전 달"
              disabled={!canPrev}
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            >
              {'<'}
            </button>
            <button
              type="button"
              aria-label="다음 달"
              disabled={!canNext}
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            >
              {'>'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-gray-500">
          {WEEKDAY_LABELS.map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-1 space-y-1.5">
          {weeks.map((monday) => {
            const ok = bookable(monday);
            const inRange = start && end && monday >= start && monday <= end;
            return (
              <button
                key={toYmd(monday)}
                type="button"
                disabled={!ok}
                onClick={() => pickWeek(monday)}
                aria-pressed={Boolean(inRange)}
                aria-label={`${formatDate(toYmd(monday))} 주`}
                className="grid w-full grid-cols-7 gap-1.5 disabled:cursor-not-allowed"
              >
                {WEEKDAY_LABELS.map((_, i) => {
                  const day = addDays(monday, i);
                  const outside = day.getMonth() !== month.getMonth();
                  return (
                    <span
                      key={i}
                      className={cn(
                        'flex h-14 flex-col items-center justify-center rounded-md border text-sm',
                        inRange
                          ? 'border-blue-500 bg-blue-00 font-semibold text-blue-600'
                          : ok
                            ? 'border-gray-200 hover:border-blue-300'
                            : 'border-gray-100 bg-gray-50 text-gray-300',
                        outside && !inRange && 'text-gray-300',
                      )}
                    >
                      {day.getDate()}
                      {inRange && <span className="text-[11px] font-normal">선택</span>}
                    </span>
                  );
                })}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {formatDate(toYmd(firstBookable))}부터 {BOOKABLE_WEEKS}주 안에서, 모집 마감일 이전에
          시작하는 주만 고를 수 있어요. 주를 하나 누른 뒤 뒤쪽 주를 누르면 기간이 이어집니다.
        </p>
        <ErrorText>{errors.weekStart}</ErrorText>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>희망 시작일</Label>
          <p className={cn(INPUT, 'bg-gray-50')}>
            {v.weekStart ? formatDate(v.weekStart, true) : '주를 선택해 주세요'}
          </p>
        </div>
        <div>
          <Label>희망 종료일</Label>
          <p className={cn(INPUT, 'bg-gray-50')}>
            {end ? formatDate(toYmd(end), true) : '주를 선택해 주세요'}
          </p>
        </div>
      </div>
      {v.weekStart && (
        <Info>
          선택한 집행 기간은 <strong className="text-blue-800">{periodText(v)}</strong>입니다. 실제
          예약 가능 여부는 접수 후 확인합니다.
        </Info>
      )}
      <div>
        <Label optional>일정 관련 요청 사항</Label>
        <textarea
          className={cn(INPUT, 'min-h-28')}
          maxLength={SCHEDULE_NOTE_MAX}
          value={v.scheduleNote}
          onChange={(e) => set('scheduleNote', e.target.value)}
          placeholder="집행 일정 조정이나 긴급 집행 요청이 있다면 적어주세요."
        />
        <ErrorText>{errors.scheduleNote}</ErrorText>
      </div>
    </div>
  );
}

function StepContact({
  v,
  set,
  errors,
}: {
  v: FormValues;
  set: Update;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>기업·기관명</Label>
          <input
            className={INPUT}
            value={v.companyName}
            onChange={(e) => set('companyName', e.target.value)}
          />
          <ErrorText>{errors.companyName}</ErrorText>
        </div>
        <div>
          <Label required>담당자 성함</Label>
          <input
            className={INPUT}
            value={v.managerName}
            onChange={(e) => set('managerName', e.target.value)}
            placeholder="이름"
          />
          <ErrorText>{errors.managerName}</ErrorText>
        </div>
        <div>
          <Label required>업무용 이메일</Label>
          <input
            className={INPUT}
            type="email"
            value={v.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="name@company.com"
          />
          <ErrorText>{errors.email}</ErrorText>
        </div>
        <div>
          <Label required>연락처</Label>
          <input
            className={INPUT}
            type="tel"
            value={v.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="010-0000-0000"
          />
          <ErrorText>{errors.phone}</ErrorText>
        </div>
      </div>
      <hr className="border-gray-200" />
      <p className="text-lg font-semibold">계약 및 소재 관련 정보</p>
      <div>
        <Label>계약 및 계산서 발행 방식</Label>
        <RadioCards
          name="invoice"
          options={INVOICE_OPTIONS}
          value={v.invoiceMethod}
          onChange={(x) => set('invoiceMethod', x)}
        />
      </div>
      <div>
        <Label>소재 준비 방식</Label>
        <RadioCards
          name="creative"
          options={CREATIVE_OPTIONS}
          value={v.creativeMethod}
          onChange={(x) => set('creativeMethod', x)}
        />
      </div>
      <div>
        <Label optional>추가 요청 사항</Label>
        <textarea
          className={cn(INPUT, 'min-h-28')}
          maxLength={AD_REQUEST_MAX}
          value={v.adRequest}
          onChange={(e) => set('adRequest', e.target.value)}
          placeholder="강조하고 싶은 기업·모집 메시지, 소재 관련 요청 등을 입력해 주세요."
        />
        <ErrorText>{errors.adRequest}</ErrorText>
      </div>
      <Info>
        배너·SNS 등 일부 상품은 별도 소재 전달이 필요할 수 있습니다. 확정 후 담당자가 구체적인
        규격을 안내합니다.
      </Info>
    </div>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-gray-100">
      {rows.map(([k, val]) => (
        <div key={k} className="flex justify-between gap-6 py-3 text-sm">
          <dt className="shrink-0 text-gray-500">{k}</dt>
          <dd className="text-right font-medium">{val}</dd>
        </div>
      ))}
    </dl>
  );
}

function StepConfirm({
  v,
  set,
  errors,
}: {
  v: FormValues;
  set: Update;
  errors: Record<string, string>;
}) {
  const target = TARGET_OPTIONS.find((o) => o.value === v.target)?.label ?? '';
  const purpose = PURPOSE_OPTIONS.find((o) => o.value === v.purpose)?.label ?? '';
  return (
    <div className="space-y-8">
      <section>
        <p className="mb-1 text-lg font-semibold">공고 정보</p>
        <Rows
          rows={[
            ['홍보 유형', target],
            ['기업명', v.companyName],
            ['공고명', v.title],
            ['모집 마감일', `${formatDate(v.deadline)} · ${v.recruitType}`],
            ['광고 목적', purpose],
          ]}
        />
      </section>
      <section>
        <p className="mb-1 text-lg font-semibold">광고 신청 내역</p>
        <Rows
          rows={[
            [
              '상품',
              selectedProducts(v)
                .map((p) => p.title)
                .join(', '),
            ],
            ...(v.withChannels
              ? ([['추가 상담', '렛츠커리어 채널 광고']] as [string, string][])
              : []),
            ['기간', periodText(v) ?? ''],
            ['견적', '담당자 확인 후 안내'],
          ]}
        />
      </section>
      <section>
        <p className="mb-1 text-lg font-semibold">담당자</p>
        <Rows
          rows={[
            ['담당자', `${v.managerName} · ${v.companyName}`],
            ['이메일', v.email],
            ['연락처', v.phone],
          ]}
        />
      </section>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-5 py-4 text-sm">
          <input
            type="checkbox"
            checked={v.agreePrivacy}
            onChange={(e) => set('agreePrivacy', e.target.checked)}
            className="size-4 accent-blue-500"
          />
          <span>
            개인정보 수집 및 이용 동의 (필수){' '}
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-gray-500 underline"
            >
              보기
            </a>
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-5 py-4 text-sm">
          <input
            type="checkbox"
            checked={v.agreeNotice}
            onChange={(e) => set('agreeNotice', e.target.checked)}
            className="size-4 accent-blue-500"
          />
          광고 신청 및 운영 유의사항 확인 (필수)
        </label>
        <ErrorText>{errors.agree}</ErrorText>
      </div>
      <Info>
        광고 신청은 <strong className="text-blue-800">접수 요청</strong>이며 예약이나 결제가 완료된
        상태가 아닙니다. 집행 가능 여부와 최종 금액은 담당자 검토 후 안내됩니다.
      </Info>
    </div>
  );
}

function Summary({ v }: { v: FormValues }) {
  const products = selectedProducts(v);
  return (
    <aside className="overflow-hidden rounded-xl border border-gray-200 lg:sticky lg:top-24">
      <div className="bg-blue-50 px-6 py-5">
        <p className="text-xs font-semibold text-blue-500">YOUR REQUEST</p>
        <p className="mt-1 text-lg font-semibold">신청 내용 요약</p>
        <p className="mt-0.5 text-xs text-gray-500">현재 입력한 신청 정보를 확인하세요.</p>
      </div>
      <div className="px-6 py-2">
        <Rows
          rows={[
            ['공고', v.title.trim() || '미입력'],
            ['모집 마감일', v.deadline ? formatDate(v.deadline) : '미입력'],
            ['광고 상품', products.length ? products.map((p) => p.title).join(', ') : '선택 전'],
            ['광고 일정', periodText(v) ?? '선택 전'],
            ['담당 기업', v.companyName.trim() || '미입력'],
          ]}
        />
      </div>
      <p className="border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
        광고 집행 및 금액은 담당자 확인 후 최종 확정됩니다.
      </p>
    </aside>
  );
}

function Done({ id, v, onReset }: { id: number; v: FormValues; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-[680px] py-6 text-center">
      <p className="text-sm font-semibold text-blue-500">REQUEST RECEIVED</p>
      <h1 className="mt-2 text-3xl font-bold">광고 신청이 접수되었습니다</h1>
      <p className="mt-4 leading-relaxed text-gray-600">
        광고 신청 내역을 확인해 주셔서 감사합니다.
        <br />
        담당자가 지면 및 일정을 검토한 후 입력하신 이메일로 안내드립니다.
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-blue-300 bg-blue-00 px-6 py-5">
        <p className="text-sm text-gray-500">접수번호</p>
        <p className="mt-1 text-2xl font-bold text-blue-500">{id}</p>
      </div>
      <div className="mt-3 rounded-xl border border-gray-200 px-6 py-2 text-left">
        <Rows
          rows={[
            ['신청 공고', v.title],
            [
              '상품',
              selectedProducts(v)
                .map((p) => p.title)
                .join(', '),
            ],
            ['희망 집행 기간', periodText(v) ?? ''],
            ['현재 상태', '접수 · 검토 전'],
          ]}
        />
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-md border border-gray-300 px-6 py-3 font-semibold hover:border-gray-900"
        >
          처음으로
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600"
        >
          추가 신청하기
        </button>
      </div>
    </div>
  );
}

const STEP_TITLES: Record<1 | 2 | 3 | 4 | 5, { title: string; desc: string; lead: string }> = {
  1: {
    title: '공고 정보',
    desc: '공고 링크가 있으면 기본 정보만 입력할 수 있습니다.',
    lead: '광고할 채용·교육 공고를 등록하고, 홍보 목적을 선택해 주세요.',
  },
  2: {
    title: '광고 상품',
    desc: '원하는 지면을 골라 주세요. 여러 개를 함께 고를 수 있습니다.',
    lead: '공고를 노출할 광고 상품을 선택해 주세요.',
  },
  3: {
    title: '광고 일정 선택',
    desc: '집행할 주를 고르면 월요일부터 일요일까지 노출됩니다.',
    lead: '모집 마감 전에 노출될 수 있도록 광고 집행 주간을 선택해 주세요.',
  },
  4: {
    title: '담당자 정보',
    desc: '견적서·계약 관련 안내에 사용됩니다.',
    lead: '견적 및 광고 확정 안내를 받을 담당자 정보를 입력해 주세요.',
  },
  5: {
    title: '신청 내용 확인',
    desc: '제출 후에도 담당자 확인 전까지 집행이 확정되지 않습니다.',
    lead: '신청 내용을 최종 확인하고 필수 동의 항목을 확인해 주세요.',
  },
};

export function AdApplicationForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);

  const set: Update = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  function goTo(next: 1 | 2 | 3 | 4 | 5) {
    setStep(next);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function next() {
    const found = validateStep(step, values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    if (step < 5) {
      goTo((step + 1) as 1 | 2 | 3 | 4 | 5);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/advertisement-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toRequest(values)),
      });
      const body = (await res.json().catch(() => null)) as {
        data?: { id?: number };
        message?: string;
      } | null;
      if (!res.ok || typeof body?.data?.id !== 'number') {
        setSubmitError(body?.message ?? '신청을 접수하지 못했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      setDoneId(body.data.id);
      window.scrollTo({ top: 0 });
    } catch {
      setSubmitError('신청을 접수하지 못했어요. 네트워크 연결을 확인하고 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (doneId !== null) {
    return (
      <Done
        id={doneId}
        v={values}
        onReset={() => {
          setValues(INITIAL_VALUES);
          setDoneId(null);
          setStep(1);
        }}
      />
    );
  }

  const meta = STEP_TITLES[step];
  const stepProps = { v: values, set, errors };

  return (
    <>
      <p className="text-sm font-semibold text-blue-500">ADVERTISING APPLICATION</p>
      <h1 className="mt-2 text-3xl font-bold md:text-[40px]">광고 신청</h1>
      <p className="mt-3 text-gray-600">{meta.lead}</p>

      <ol className="mt-8 grid grid-cols-5 gap-2 rounded-xl border border-gray-200 px-3 py-4 md:px-6">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li
              key={label}
              className="flex items-center gap-2"
              aria-current={current ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  current
                    ? 'bg-blue-500 text-white'
                    : done
                      ? 'bg-blue-50 text-blue-500'
                      : 'bg-gray-100 text-gray-500',
                )}
              >
                {done ? (
                  <svg viewBox="0 0 16 16" aria-label="완료" className="size-3.5">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ) : (
                  n
                )}
              </span>
              <span
                className={cn(
                  'hidden text-sm md:inline',
                  current ? 'font-semibold text-blue-500' : 'text-gray-600',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="rounded-xl border border-gray-200">
          <header className="border-b border-gray-200 px-6 py-5 md:px-8">
            <h2 className="text-xl font-semibold">
              {String(step).padStart(2, '0')}. {meta.title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{meta.desc}</p>
          </header>
          <div className="px-6 py-6 md:px-8">
            {step === 1 && <StepPost {...stepProps} />}
            {step === 2 && <StepProducts {...stepProps} />}
            {step === 3 && <StepSchedule {...stepProps} />}
            {step === 4 && <StepContact {...stepProps} />}
            {step === 5 && <StepConfirm {...stepProps} />}
            {submitError && (
              <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-error">
                {submitError}
              </p>
            )}
            <div className="mt-8 flex justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => goTo((step - 1) as 1 | 2 | 3 | 4 | 5)}
                  className="rounded-md border border-gray-300 px-5 py-3 font-semibold hover:border-gray-900"
                >
                  이전 단계
                </button>
              ) : (
                <Link
                  href="/apply"
                  className="rounded-md border border-gray-300 px-5 py-3 font-semibold hover:border-gray-900"
                >
                  이전
                </Link>
              )}
              <button
                type="button"
                onClick={next}
                disabled={submitting}
                className="rounded-md bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600 disabled:bg-blue-200"
              >
                {step < 5 ? '다음 단계' : submitting ? '접수하는 중' : '광고 신청 접수하기'}
              </button>
            </div>
          </div>
        </section>
        <Summary v={values} />
      </div>
    </>
  );
}
