import { Badge } from '@ogonggo/ui';
import { CHANNEL_PRODUCTS, CHANNEL_STATS, STATS_BASIS, type ChannelKind } from '../model/content';
import { LandingSectionHeading } from './LandingSectionHeading';

const KIND_TONE: Record<ChannelKind, 'main' | 'urgent' | 'neutral'> = {
  SNS: 'main',
  CRM: 'urgent',
  WEB: 'neutral',
};

/** 시안 `STEP 2 · 렛츠커리어 채널`. 채널 수치 다섯과 상품 일곱. 가격은 견적 문의다. */
export function ChannelSection() {
  return (
    <section id="channels" className="mx-auto max-w-page-padded scroll-mt-4 px-5 py-16 md:py-24">
      <LandingSectionHeading
        eyebrow="STEP 2 · 렛츠커리어 채널"
        title={'그리고 이 공고를 기다리는 사람이\n월 10만 명 더 있어요'}
        description="렛츠커리어는 이력서·자소서·포트폴리오 챌린지를 운영하며 취준생과 매일 이야기해요. 인스타그램 두 계정과 카카오톡 오픈채팅방, 채널 DM에서 큐레이션 콘텐츠로 공고를 '추천' 하고, 소재 제작까지 48시간 안에 끝내요."
      />
      <dl className="grid grid-cols-2 gap-3 pt-10 md:grid-cols-5">
        {CHANNEL_STATS.map((stat) => (
          <div key={stat.label} className="rounded-md bg-gray-50 px-4 py-4">
            <dt className="text-sm font-semibold text-gray-700">{stat.label}</dt>
            <dd className="pt-1 text-xl font-bold text-blue-500 md:text-2xl">{stat.value}</dd>
            <dd className="pt-1 text-xs text-gray-500">{stat.sub}</dd>
          </div>
        ))}
      </dl>
      <ul className="grid gap-3 pt-6 md:grid-cols-2 lg:grid-cols-3">
        {CHANNEL_PRODUCTS.map((product) => (
          <li
            key={product.no}
            className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-5"
          >
            <span className="flex items-center gap-2">
              <Badge tone={KIND_TONE[product.kind]} className="rounded-full">
                {product.kind}
              </Badge>
              <span className="text-xs font-semibold text-gray-400">{product.no}</span>
            </span>
            <p className="text-base font-bold text-gray-900">{product.name}</p>
            <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
            <dl className="mt-auto flex flex-col gap-1 pt-2 text-sm">
              {product.rows.map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-10 shrink-0 text-gray-400">{label}</dt>
                  <dd className="text-gray-700">{value}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <p className="pt-4 text-xs text-gray-500">
        {STATS_BASIS} · 콘텐츠 제작 대행 포함 · 가격은 견적 문의
      </p>
    </section>
  );
}
