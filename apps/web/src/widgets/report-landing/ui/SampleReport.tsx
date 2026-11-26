import { Badge, Card } from '@ogonggo/ui';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import {
  INDUSTRY_LANDING_COPY,
  LANDING_ISSUE_LABEL,
  LANDING_SECTIONS,
  SAMPLE_REPORT,
} from '../model/landingMock';

/**
 * `받아 보는 리포트는 이런 모양이에요`. 설명 대신 샘플 리포트 한 장을 그려 보여 준다. 왼쪽 글은 짧게, 오른쪽에 종이
 * 한 장이 있고 번호 원과 가는 세로선이 세 부분(뉴스, 직무 표, 준비)을 잇는다. 부분마다 오른쪽 위 이름표가 그 부분을
 * 가리킨다. 문구는 전부 목데이터(`SAMPLE_REPORT`)라 `샘플` 이름표를 붙였다.
 *
 * 직무 표는 `md` 부터 표로, 그 아래는 행마다 쌓는다. 세 칸 표가 375px 에서는 글자가 한 줄에 한두 자씩 남아서다.
 */
export function SampleReport() {
  const sample = INDUSTRY_REPORTS.find((report) => report.slug === SAMPLE_REPORT.slug);
  const copy = INDUSTRY_LANDING_COPY[SAMPLE_REPORT.slug];
  const [news, jobs, tasks] = LANDING_SECTIONS;

  return (
    <section
      id="structure"
      aria-labelledby="structure-title"
      className="scroll-mt-6 bg-blue-00"
    >
      <div className="mx-auto grid w-full max-w-page-padded gap-8 px-5 py-12 md:py-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:sticky lg:top-6 lg:col-span-4 lg:self-start">
          <Badge tone="neutral">샘플</Badge>
          <h2
            id="structure-title"
            className="mt-3 text-4xl font-bold break-keep text-gray-950 md:text-5xl"
          >
            받아 보는 리포트는 이런 모양이에요
          </h2>
          <p className="mt-3 text-base break-keep text-gray-600">
            산업 한 편이 세 부분이에요. 아래 문구는 예시예요.
          </p>
        </div>

        <Card className="overflow-hidden rounded-xl p-0 lg:col-span-8">
          <div className="border-b border-gray-100 bg-white px-6 py-5 md:px-8">
            <p className="text-sm font-semibold text-gray-500">
              {sample?.label} · {LANDING_ISSUE_LABEL}
            </p>
            <p className="mt-1 text-2xl font-bold break-keep text-gray-950">{copy.headline}</p>
          </div>

          <ol>
            {[news, jobs, tasks].map((section, index) =>
              section ? (
                <li
                  key={section.title}
                  className="group flex gap-4 border-b border-gray-100 px-6 py-6 last:border-b-0 md:gap-5 md:px-8"
                >
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
                      {index + 1}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-2 w-px flex-1 bg-blue-200 group-last:hidden"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xl font-bold break-keep text-gray-950">{section.title}</h3>
                      <Badge tone="main">{section.tag}</Badge>
                    </div>
                    <p className="mt-1 text-sm break-keep text-gray-500">{section.description}</p>
                    <div className="mt-4">
                      {index === 0 ? <NewsPart /> : null}
                      {index === 1 ? <JobsPart /> : null}
                      {index === 2 ? <TasksPart /> : null}
                    </div>
                  </div>
                </li>
              ) : null,
            )}
          </ol>
        </Card>
      </div>
    </section>
  );
}

function NewsPart() {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {SAMPLE_REPORT.news.map((item, index) => (
        <li key={item.title} className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-blue-600">뉴스 {index + 1}</p>
          <p className="mt-1 text-base font-bold break-keep text-gray-900">{item.title}</p>
          <p className="mt-1 text-sm break-keep text-gray-600">{item.why}</p>
        </li>
      ))}
    </ul>
  );
}

function JobsPart() {
  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            <th scope="col" className="rounded-l-md px-3 py-2 font-medium">
              직무
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              공고에 적힌 말
            </th>
            <th scope="col" className="rounded-r-md px-3 py-2 font-medium">
              이어지는 흐름
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {SAMPLE_REPORT.jobs.map((job) => (
            <tr key={job.role}>
              <th scope="row" className="px-3 py-3 font-bold text-gray-900">
                {job.role}
              </th>
              <td className="px-3 py-3 text-gray-700">{job.phrase}</td>
              <td className="px-3 py-3">
                <Badge tone="main">{job.trend}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="divide-y divide-gray-100 md:hidden">
        {SAMPLE_REPORT.jobs.map((job) => (
          <li key={job.role} className="py-3 first:pt-0">
            <p className="text-base font-bold text-gray-900">{job.role}</p>
            <p className="mt-1 text-sm break-keep text-gray-700">{job.phrase}</p>
            <Badge tone="main" className="mt-2">
              {job.trend}
            </Badge>
          </li>
        ))}
      </ul>
    </>
  );
}

function TasksPart() {
  return (
    <ul className="flex flex-col gap-2">
      {SAMPLE_REPORT.tasks.map((task) => (
        <li
          key={task.text}
          className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3"
        >
          <Badge tone="neutral" className="shrink-0">
            {task.tag}
          </Badge>
          <span className="text-sm font-medium break-keep text-gray-900">{task.text}</span>
        </li>
      ))}
    </ul>
  );
}
