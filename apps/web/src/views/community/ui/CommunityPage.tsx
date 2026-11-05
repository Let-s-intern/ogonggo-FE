import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import { TrackedLink } from '@/shared/analytics/TrackedLink';
import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeHero } from '@/widgets/home-hero';
import { communityLinkClick } from '../model/analytics';
import {
  CHAT_PREVIEW_CARDS,
  INSTAGRAM_ACCOUNT_CARDS,
  OPEN_CHAT_ROOM_CARDS,
  type InstagramAccountCard,
  type OpenChatRoomCard,
} from '../model/content';

/**
 * 카드 한 장의 폭. 모바일 한 줄에 하나, md 둘, lg 셋이다. 줄이 다 차지 않으면 남은 카드를 가운데로 모은다 —
 * 시안의 인스타그램 둘째 줄이 그렇다. 그래서 `grid` 가 아니라 `flex-wrap` 이다. 간격은 20px(`gap-5`)이다.
 */
const CARD_WIDTH = 'w-full md:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]';

/**
 * `/community` — 오공고 톡방과 인스타그램 안내(이슈 #569). 시안은
 * `.claude/tasks/todo/오공고 커무니티/image copy.png`(1440 폭)이다.
 *
 * 바깥 레이아웃은 목록 화면(`views/bootcamp-list`)과 같다. 히어로는 같은 `HomeHero` 에 배경만 시안의 흐린
 * 오공고 로고(`public/hero/community.png`)를 깔고, 본문은 `max-w-page-padded`, 맨 아래가 `FOR BUSINESS`
 * 배너다. 데이터를 부르지 않아 서버 컴포넌트다 — 누르는 순간의 이벤트만 `TrackedLink` 가 받는다.
 */
export function CommunityPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero screen="community" />
      <div className="flex w-full max-w-page-padded flex-col gap-12 px-5 pt-12 pb-10 md:gap-16 md:pt-20">
        <section>
          <SectionHeading
            iconClass="icon-[lucide--messages-square]"
            title="오공고 톡방"
            lines={[
              '문과 취준생을 위해 렛츠커리어가 운영하는 채용공고 큐레이션 채널이에요.',
              '검증된 공고를 직무별로 골라 매일 소개해드려요.',
            ]}
          />
          <ul className="mt-8 flex flex-wrap justify-center gap-5 md:mt-10">
            {OPEN_CHAT_ROOM_CARDS.map((room) => (
              <li key={room.id} className={CARD_WIDTH}>
                <OpenChatCard room={room} />
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-gray-200 pt-12 md:pt-10">
          <h2 className="text-base font-bold text-gray-900">톡방에서 매일 이런 정보가 공유돼요</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {CHAT_PREVIEW_CARDS.map((card) => (
              <li
                key={card.label}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <div className="relative aspect-[264/260] bg-gray-100">
                  <Image
                    src={card.src}
                    alt={card.alt}
                    fill
                    sizes="(min-width: 768px) 280px, 50vw"
                    className="object-cover object-top"
                  />
                </div>
                <p className="px-4 py-3 text-sm font-semibold text-gray-700 md:py-4">
                  {card.label}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl border border-gray-200 px-5 py-5 md:mt-8 md:px-6">
            <p className="text-base font-bold text-gray-900">무료 취업 자료도 받아가세요.</p>
            <p className="mt-2 text-sm break-keep text-gray-500">
              이력서·자소서 템플릿, 직무 자료집, 공채 준비 가이드북 등 렛츠커리어의 무료 자료 창고를
              톡방에서 바로 확인할 수 있어요.
            </p>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-12 md:pt-16">
          <SectionHeading
            iconClass="icon-[simple-icons--instagram]"
            title="오공고 인스타그램"
            lines={[
              '취준 인사이트, 빠르게 받아보세요.',
              '렛츠커리어와 오공고 인스타그램에서 트렌디한 취준 정보를 만나보세요.',
            ]}
          />
          <ul className="mt-8 flex flex-wrap justify-center gap-5 md:mt-10">
            {INSTAGRAM_ACCOUNT_CARDS.map((account) => (
              <li key={account.id} className={CARD_WIDTH}>
                <InstagramCard account={account} />
              </li>
            ))}
          </ul>
        </section>

        <div className="w-full md:mt-10">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}

function SectionHeading({
  iconClass,
  title,
  lines,
}: {
  iconClass: string;
  title: string;
  lines: string[];
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 md:text-2xl">
        <span aria-hidden="true" className={cn(iconClass, 'block h-6 w-6 text-gray-900')} />
        {title}
      </h2>
      <p className="mt-3 text-sm break-keep text-gray-600 md:text-base">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

/** 밖으로 나가는 버튼. 새 탭으로 열고, 누르는 순간 `community_link_click` 을 보낸다. */
function OutboundButton({
  href,
  event,
  className,
  children,
}: {
  href: string;
  event: ReturnType<typeof communityLinkClick>;
  className: string;
  children: ReactNode;
}) {
  return (
    <TrackedLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      events={[event]}
      className={cn(
        'flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors',
        className,
      )}
    >
      {children}
    </TrackedLink>
  );
}

function OpenChatCard({ room }: { room: OpenChatRoomCard }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-1 items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <span aria-hidden="true" className={cn(room.iconClass, 'block h-5 w-5 text-gray-700')} />
        </span>
        <div className="min-w-0 pt-1">
          <h3 className="text-base font-bold break-keep text-gray-900">{room.title}</h3>
          <p className="mt-1 text-xs break-keep text-gray-500">{room.description}</p>
        </div>
      </div>
      <OutboundButton
        href={room.url}
        event={communityLinkClick('open_chat', room.id, room.url)}
        className="bg-blue-50 text-blue-500 hover:bg-blue-100"
      >
        참여하기
      </OutboundButton>
    </article>
  );
}

function InstagramCard({ account }: { account: InstagramAccountCard }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="grid grid-cols-3 gap-px bg-gray-200">
        {account.thumbnails.map((thumbnail) => (
          <div key={thumbnail.src} className="relative aspect-square bg-gray-100">
            <Image
              src={thumbnail.src}
              alt={thumbnail.alt}
              fill
              sizes="(min-width: 1024px) 120px, (min-width: 768px) 25vw, 33vw"
              className="object-cover object-top"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Image
            src={account.profileImage}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full border border-gray-100 object-cover"
          />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-gray-900">{account.handle}</h3>
            <p className="text-xs text-gray-500">{account.label}</p>
          </div>
        </div>
        <div className="flex-1 rounded-lg bg-blue-00 px-3 py-3">
          <p className="text-sm font-semibold break-keep text-blue-500">{account.pitch}</p>
          <p className="mt-1 text-xs break-keep text-gray-500">{account.description}</p>
        </div>
        <OutboundButton
          href={account.url}
          event={communityLinkClick('instagram', account.id, account.url)}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          팔로우
        </OutboundButton>
      </div>
    </article>
  );
}
