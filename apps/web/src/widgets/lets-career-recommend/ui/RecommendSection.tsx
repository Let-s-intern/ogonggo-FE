import { LetsCareerMark } from '@/shared/ui/LetsCareerMark';
import type { RecommendItem } from '../lib/recommendItems';

interface RecommendSectionProps {
  title: string;
  description?: string;
  items: RecommendItem[];
}

/**
 * 상세 사이드바의 렛츠커리어 추천 카드 목록. 카드는 종류(아이콘·파랑 글자), 제목(굵게, 두 줄),
 * 설명(회색, 두 줄, 없으면 줄 없음)이고 오른쪽 아래에 옅은 마크가 깔린다. 누르면 새 탭으로 연다.
 */
export function RecommendSection({ title, description, items }: RecommendSectionProps) {
  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {description ? <p className="mt-1 text-xs text-gray-400">{description}</p> : null}
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-lg bg-gray-50 p-4"
            >
              <LetsCareerMark
                flat
                className="absolute -right-5 -bottom-6 h-24 w-24 text-blue-100 opacity-30"
              />
              <div className="relative">
                <p className="flex items-center gap-1.5 text-xs font-bold text-blue-500">
                  {item.icon === 'folder' ? (
                    <span
                      aria-hidden="true"
                      className="icon-[material-symbols--folder] block h-4 w-4 shrink-0 text-blue-300"
                    />
                  ) : (
                    <LetsCareerMark flat className="h-4 w-4 shrink-0 text-blue-400" />
                  )}
                  <span className="truncate">{item.label}</span>
                </p>
                <p className="mt-2 line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-blue-500">
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.description}</p>
                ) : null}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
