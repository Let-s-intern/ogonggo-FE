/**
 * 계약 전체 성과 카드와 상품 리포트 모달이 같이 쓰는 작은 조각. 숫자 칸과 설명 툴팁의 모양을 한 곳에서 정한다(6.11 일관성).
 */

/** 숫자 칸. `hint` 는 값 아래 작은 글씨와 툴팁으로 둘 다 보인다(PDF 에도 찍힌다). */
export function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3" title={hint}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="pt-1 text-xl font-semibold text-gray-900">{value}</p>
      {hint ? <p className="pt-1 text-[11px] leading-tight text-gray-400">{hint}</p> : null}
    </div>
  );
}

/** 제목 옆 작은 `i`. 마우스를 올리거나 키보드로 가면 설명이 뜬다. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span
      tabIndex={0}
      title={text}
      aria-label={text}
      className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-300 text-[10px] font-semibold text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
    >
      i
    </span>
  );
}
