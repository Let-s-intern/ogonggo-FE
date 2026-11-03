import { REASONS } from '../model/content';
import { LandingSectionHeading } from './LandingSectionHeading';

/** 시안 `오늘의공고/렛츠커리어와 함께해야 하는 이유`. 이유 셋을 카드로. */
export function LandingReasons() {
  return (
    <section className="mx-auto max-w-page-padded px-5 py-16 md:py-24">
      <LandingSectionHeading
        eyebrow="오늘의공고/렛츠커리어와 함께해야 하는 이유"
        title={'인턴·신입 채용 타겟을\n가장 잘 아는 채널이에요'}
      />
      <ol className="grid gap-4 pt-10 md:grid-cols-3">
        {REASONS.map((reason, index) => (
          <li key={reason.title} className="rounded-md border border-gray-200 bg-white p-6">
            <p className="text-sm font-bold text-blue-500">{String(index + 1).padStart(2, '0')}</p>
            <p className="pt-3 text-lg font-bold text-gray-900">{reason.title}</p>
            <p className="pt-2 text-sm leading-relaxed text-gray-600">{reason.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
