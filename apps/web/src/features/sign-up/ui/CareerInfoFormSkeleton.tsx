import { cn } from '@ogonggo/ui';
import { JOB_CONDITIONS } from '../lib/careerOptions';

/** 자리만 채우는 회색 막대. 실제 요소의 line-height를 그대로 높이로 쓴다. */
function Bar({ className }: { className: string }) {
  return <div className={cn('rounded bg-gray-200', className)} />;
}

/** 라벨(`text-base`, 24px) + `gap-2` + 칸(`h-12`). `SignUpField` 와 같은 모양이다. */
function FieldSkeleton({ labelWidth }: { labelWidth: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Bar className={cn('h-6', labelWidth)} />
      <div className="h-12 rounded-xs bg-gray-200" />
    </div>
  );
}

/**
 * 커리어 정보 폼(`./CareerInfoForm.tsx`) 을 불러오는 동안의 자리. 여백과 높이는 그 폼에서
 * 그대로 가져와, 계정을 받아 폼으로 바뀌는 순간 칸이 움직이지 않게 한다.
 *
 * 맥동은 Tailwind `animate-pulse` 이고, `ogonggo-skeleton` 은 `prefers-reduced-motion` 에서 그것을 끄는
 * 표식이다(`app/globals.css`).
 */
export function CareerInfoFormSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">불러오는 중</span>
      <div aria-hidden="true" className="ogonggo-skeleton flex animate-pulse flex-col">
        {/* 제목 `h2 text-lg` 는 26px, 아래 `pb-8`. */}
        <Bar className="mb-8 h-[26px] w-24" />
        <div className="flex flex-col gap-5">
          <FieldSkeleton labelWidth="w-10" />
          <FieldSkeleton labelWidth="w-10" />
          <FieldSkeleton labelWidth="w-10" />
        </div>
        <div className="flex flex-col gap-5 pt-12">
          <FieldSkeleton labelWidth="w-20" />
          <FieldSkeleton labelWidth="w-32" />
          <FieldSkeleton labelWidth="w-32" />
          <FieldSkeleton labelWidth="w-20" />
        </div>
        {/* 희망 구직 조건 — 제목(`text-base`, 24px, `pb-1`) 과 체크박스 줄(20px) 들이 `gap-3` 으로 붙는다. */}
        <div className="flex flex-col gap-3 pt-12">
          <Bar className="mb-1 h-6 w-28" />
          {JOB_CONDITIONS.map(({ value }) => (
            <Bar key={value} className="h-5 w-64" />
          ))}
        </div>
        <div className="pt-14">
          <div className="h-12 w-full rounded-xs bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
