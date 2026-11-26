import { cn } from '@ogonggo/ui';
import { LANDING_SECTIONS } from '../model/landingMock';

/**
 * 세 칸의 아이콘. 칸 순서와 같다. Iconify 는 소스의 글자를 스캔하므로 이름을 통째로 적는다.
 */
const SECTION_ICONS = [
  'icon-[lucide--newspaper]',
  'icon-[lucide--briefcase-business]',
  'icon-[lucide--lightbulb]',
] as const;

/** `리포트는 이렇게 구성돼요`. 세 칸이 데스크톱에서는 한 줄, 그 아래에서는 쌓인다. */
export function ReportStructure() {
  return (
    <section id="structure" aria-labelledby="structure-title" className="scroll-mt-6">
      <h2 id="structure-title" className="text-2xl font-bold break-keep text-gray-950">
        리포트는 이렇게 구성돼요
      </h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {LANDING_SECTIONS.map((section, index) => (
          <li key={section.title} className="rounded-xl bg-blue-00 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-blue-500">
              <span
                aria-hidden="true"
                className={cn(SECTION_ICONS[index] ?? SECTION_ICONS[0], 'h-5 w-5')}
              />
            </span>
            <p className="mt-4 text-sm font-semibold text-blue-500">{index + 1}</p>
            <h3 className="mt-1 text-lg font-bold break-keep text-gray-950">{section.title}</h3>
            <p className="mt-2 text-sm break-keep text-gray-600">{section.description}</p>
            <ul className="mt-4 flex flex-col gap-2 border-t border-blue-100 pt-4">
              {section.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm break-keep text-gray-700">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 icon-[lucide--check] h-4 w-4 shrink-0 text-blue-500"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
