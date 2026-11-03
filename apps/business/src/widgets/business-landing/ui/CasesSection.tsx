import { CASES, PARTNERS } from '../model/content';
import { LandingSectionHeading } from './LandingSectionHeading';

/**
 * 시안 `PARTNERS · 함께한 회사` 와 사례 카드. 로고 파일이 없고 로고는 각 사 승인 후 게시라, 회사 이름 글자 타일로 둔다.
 */
export function CasesSection() {
  return (
    <section id="cases" className="mx-auto max-w-page-padded scroll-mt-4 px-5 py-16 md:py-24">
      <LandingSectionHeading eyebrow="PARTNERS" title="함께한 회사" />
      <ul className="grid grid-cols-2 gap-2 pt-8 md:grid-cols-5">
        {PARTNERS.map((partner) => (
          <li
            key={partner}
            className="flex h-14 items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-semibold text-gray-500"
          >
            {partner}
          </li>
        ))}
      </ul>
      <ul className="grid gap-3 pt-8 md:grid-cols-2 lg:grid-cols-3">
        {CASES.map((item) => (
          <li
            key={item.company}
            className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-5"
          >
            <div>
              <p className="text-base font-bold text-gray-900">{item.company}</p>
              <p className="text-sm text-gray-500">{item.role}</p>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{item.situation}</p>
            <p className="text-xs text-gray-500">{item.channels.join(' · ')}</p>
            <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
              {item.results.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="text-sm font-bold text-blue-500">{value}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
