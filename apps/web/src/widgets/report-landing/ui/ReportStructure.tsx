import { cn } from '@ogonggo/ui';
import { LANDING_SECTIONS } from '../model/landingMock';

/**
 * 세 단계의 아이콘. 단계 순서와 같다. Iconify 는 소스의 글자를 스캔하므로 이름을 통째로 적는다.
 */
const SECTION_ICONS = [
  'icon-[lucide--newspaper]',
  'icon-[lucide--briefcase-business]',
  'icon-[lucide--lightbulb]',
] as const;

/**
 * `리포트는 이렇게 구성돼요`. 큰 번호와 가는 연결선으로 이어진 세 단계다. 화면 폭 끝까지 닿는 옅은 파랑 띠
 * (blue-00) 위에 놓인다. 데스크톱은 가로 한 줄이고 선이 단계 위를 가로지른다. 그 아래는 왼쪽에 세로선이 흐르고
 * 단계가 쌓인다.
 */
export function ReportStructure() {
  return (
    <section id="structure" aria-labelledby="structure-title" className="scroll-mt-6 bg-blue-00">
      <div className="mx-auto w-full max-w-page-padded px-5 py-16 md:py-24">
        <p className="text-sm font-semibold tracking-widest text-blue-500">INSIDE THE REPORT</p>
        <h2
          id="structure-title"
          className="mt-3 text-5xl font-bold break-keep text-gray-950 md:text-7xl"
        >
          리포트는 이렇게 구성돼요
        </h2>
        <ol
          className={cn(
            'relative mt-12 grid gap-12 md:mt-16 lg:grid-cols-3 lg:gap-10',
            // 연결선. 모바일·태블릿은 노드 중심을 따라 세로, 데스크톱은 노드 높이에서 가로로 흐른다.
            'before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-blue-200',
            'lg:before:right-3 lg:before:bottom-auto lg:before:h-px lg:before:w-auto',
          )}
        >
          {LANDING_SECTIONS.map((section, index) => (
            <li key={section.title} className="relative pl-12 lg:pt-12 lg:pl-0">
              {/* 노드. 연결선 위의 점이다. */}
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-500 bg-white"
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <p aria-hidden="true" className="text-7xl font-bold text-blue-200 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-500 text-white">
                  <span
                    aria-hidden="true"
                    className={cn(SECTION_ICONS[index] ?? SECTION_ICONS[0], 'h-5 w-5')}
                  />
                </span>
                <h3 className="text-2xl font-bold break-keep text-gray-950">{section.title}</h3>
              </div>
              <p className="mt-4 text-base break-keep text-gray-600">{section.description}</p>
              <ul className="mt-5 flex flex-col gap-2 border-t border-blue-100 pt-5">
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
      </div>
    </section>
  );
}
