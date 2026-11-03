import { FAQS } from '../model/content';
import { LandingSectionHeading } from './LandingSectionHeading';

/** 시안 `자주 묻는 질문`. 질문을 누르면 답이 펼쳐진다(`<details>`). */
export function FaqSection() {
  return (
    <section className="mx-auto max-w-page-padded px-5 py-16 md:py-24">
      <LandingSectionHeading eyebrow="FAQ" title="자주 묻는 질문" />
      <ul className="flex flex-col divide-y divide-gray-200 border-y border-gray-200 pt-0 mt-8">
        {FAQS.map((faq) => (
          <li key={faq.question}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                Q. {faq.question}
                <span
                  aria-hidden="true"
                  className="icon-[lucide--chevron-down] block h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-gray-600">{faq.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
