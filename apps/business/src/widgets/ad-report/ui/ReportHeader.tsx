import { CONTACT_EMAIL } from '@/shared/config/site';
import { publishProgress } from '../model/derive';
import { dotDate, positionLabel, shortDate } from '../model/format';
import type { AdReport } from '../model/types';

/** 연장 문의는 받을 API 가 없어 이메일로 연결한다(광고 신청 화면과 같은 방식). 본문에 상품과 기간을 미리 적어 둔다. */
function extensionMailto(companyName: string, report: AdReport): string {
  const { product } = report;
  const subject = `[광고 연장 문의] ${companyName} · ${product.name}`;
  const body = `- 기업·기관명: ${companyName}\n- 상품: ${product.name}\n- 현재 게시 기간: ${dotDate(product.startDate)} ~ ${dotDate(product.endDate)}\n- 문의 내용:\n`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * 리포트 머리. 목업(2026-11-23)대로 광고 위치와 광고주, 광고하는 공고, 게시 기간과 리포트 기준 기간, 게시 진행을 보인다.
 * 광고 연장 문의 버튼은 PDF 에서 뺀다(`data-pdf-hide`).
 */
export function ReportHeader({
  report,
  companyName,
  today,
}: {
  report: AdReport;
  companyName: string;
  today: string;
}) {
  const { product } = report;
  // 목업의 "메인 · 오늘의 추천 공고 · 오공고 PICK" 처럼 노출 자리와 상품 이름을 잇는다. 자리가 없으면 상품 이름만이다.
  const place = [product.position ? positionLabel(product.position) : null, product.name]
    .filter((part, index, all) => part && all.indexOf(part) === index)
    .join(' · ');
  const [first, ...rest] = report.targets;
  const title = first
    ? rest.length > 0
      ? `${first.title} 외 ${rest.length}건`
      : first.title
    : product.name;
  const { elapsed, total } = publishProgress(product.startDate, product.endDate, today);
  const running = today >= product.startDate && today <= product.endDate;
  const todayIncluded = running && report.to === today;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-baseline gap-2.5">
          <span className="text-[22px] font-extrabold tracking-tight text-blue-600">오공고</span>
          <span className="text-[15px] text-gray-500">광고 성과 리포트</span>
        </p>
        <a
          data-pdf-hide
          href={extensionMailto(companyName, report)}
          className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
        >
          광고 연장 문의
        </a>
      </div>
      <div className="flex flex-wrap justify-between gap-x-8 gap-y-5 rounded-2xl border border-gray-200 bg-white p-5 md:p-8">
        <div className="flex min-w-0 flex-1 basis-96 flex-col gap-2.5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[13px] font-bold text-blue-700">
              {place}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[13px] font-bold text-gray-700">
              광고주 {companyName}
            </span>
          </div>
          <h2 className="text-2xl leading-snug font-extrabold break-keep text-gray-950 md:text-3xl">
            {title}
          </h2>
          <p className="text-[15px] break-keep text-gray-500 tabular-nums">
            게시 기간 {dotDate(product.startDate)} ~ {shortDate(product.endDate)} ({total}일) ·
            리포트 기준 {dotDate(report.from)} ~ {shortDate(report.to)}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 basis-64 flex-col justify-center gap-2.5 md:max-w-xs">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">게시 진행</span>
            <span className="font-bold text-gray-900 tabular-nums">
              {elapsed}일 / {total}일
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${total > 0 ? (elapsed / total) * 100 : 0}%` }}
            />
          </div>
          {todayIncluded ? (
            <p className="text-[13px] break-keep text-gray-500">
              {shortDate(today)} 수치는 오늘 집계 중이라 하루치가 다 반영되지 않았어요.
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
