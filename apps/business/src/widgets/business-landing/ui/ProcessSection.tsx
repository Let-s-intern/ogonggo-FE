import { PROCESS_STEPS } from '../model/content';
import { LandingSectionHeading } from './LandingSectionHeading';

/** 시안 `PROCESS · 문의부터 게재까지, 이렇게 진행돼요`. */
export function ProcessSection() {
  return (
    <section id="process" className="scroll-mt-4 bg-gray-50">
      <div className="mx-auto max-w-page-padded px-5 py-16 md:py-24">
        <LandingSectionHeading eyebrow="PROCESS" title="문의부터 게재까지, 이렇게 진행돼요" />
        <ol className="grid gap-3 pt-10 md:grid-cols-4">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step.title} className="rounded-md border border-gray-200 bg-white p-5">
              <p className="text-sm font-bold text-blue-500">
                {String(index + 1).padStart(2, '0')}
              </p>
              <p className="pt-2 text-lg font-bold text-gray-900">{step.title}</p>
              <p className="pt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
