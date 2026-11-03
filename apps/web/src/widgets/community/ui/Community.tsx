import { Button } from '@ogonggo/ui';
import {
  INSTAGRAM_ACCOUNTS,
  OPEN_CHAT_CHANNELS,
  SHARED_INFO_TOPICS,
  type InstagramAccount,
  type OpenChatChannel,
} from '../model/content';

/** 외부 링크는 새 탭으로 연다. 오픈채팅·인스타그램 모두 오공고 밖이다. */
const EXTERNAL_LINK = { target: '_blank', rel: 'noopener noreferrer' } as const;

function CommunityHero() {
  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl bg-gray-50 px-5 py-12 text-center md:py-16">
      <span className="text-sm font-medium text-blue-500">오공고 커뮤니티</span>
      <h1 className="text-xl font-bold text-gray-900 md:text-4xl md:leading-snug">
        막막하고 외로운 취준,
        <br />
        함께라면 달라집니다
      </h1>
    </section>
  );
}

function SectionHeader({ title, lines }: { title: string; lines: string[] }) {
  return (
    <header className="flex flex-col gap-2">
      <h2 className="text-xl font-bold text-gray-900 md:text-2xl">{title}</h2>
      <p className="text-sm text-gray-600 md:text-base">
        {lines.map((line, index) => (
          <span key={line}>
            {index > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </p>
    </header>
  );
}

function OpenChatCard({ channel, url }: { channel: OpenChatChannel; url: string }) {
  return (
    <li className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-base font-bold text-gray-900">{channel.title}</p>
        <p className="text-xs text-gray-500">{channel.description}</p>
      </div>
      <Button variant="secondary" className="w-full bg-blue-50 text-blue-500" asChild>
        <a href={url} {...EXTERNAL_LINK}>
          참여하기
        </a>
      </Button>
    </li>
  );
}

function InstagramCard({ account }: { account: InstagramAccount }) {
  return (
    <li className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col">
        <p className="text-base font-bold text-gray-900">{account.handle}</p>
        <p className="text-xs text-gray-500">{account.caption}</p>
      </div>
      <div className="flex flex-1 flex-col gap-1 rounded-lg bg-gray-50 p-3">
        <p className="text-sm font-semibold text-blue-500">{account.headline}</p>
        <p className="text-xs text-gray-500">{account.body}</p>
      </div>
      <Button className="w-full" asChild>
        <a href={account.url} {...EXTERNAL_LINK}>
          팔로우
        </a>
      </Button>
    </li>
  );
}

/**
 * 커뮤니티 본문 — 히어로, 오공고 톡방, 톡방에서 공유되는 정보, 오공고 인스타그램. 광고 구좌는 없다(PRD).
 * 아래 배너(PC FOR BUSINESS, MO 취준 고민)는 화면(`views/community`)이 붙인다.
 */
export function Community() {
  const channels = OPEN_CHAT_CHANNELS.flatMap((channel) =>
    channel.url ? [{ channel, url: channel.url }] : [],
  );

  return (
    <div className="flex w-full flex-col gap-14 md:gap-20">
      <CommunityHero />

      <section className="flex flex-col gap-6">
        <SectionHeader
          title="오공고 톡방"
          lines={[
            '문과 취준생을 위해 렛츠커리어가 운영하는 채용공고 큐레이션 채널이에요.',
            '검증된 공고를 직무별로 골라 매일 소개해드려요.',
          ]}
        />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {channels.map(({ channel, url }) => (
            <OpenChatCard key={channel.title} channel={channel} url={url} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6 border-t border-gray-200 pt-10">
        <h2 className="text-lg font-bold text-gray-900">톡방에서 매일 이런 정보가 공유돼요</h2>
        <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-4 md:px-0">
          {SHARED_INFO_TOPICS.map((topic) => (
            <li
              key={topic}
              className="flex aspect-[4/5] w-40 shrink-0 snap-start items-end rounded-xl border border-gray-200 bg-gray-50 p-4 md:w-auto"
            >
              <p className="text-base font-semibold text-gray-900">{topic}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1 rounded-xl border border-gray-200 p-5">
          <p className="text-base font-bold text-gray-900">무료 취업 자료도 받아가세요.</p>
          <p className="text-sm text-gray-500">
            이력서·자소서 템플릿, 직무 자료집, 공채 준비 가이드북 등 렛츠커리어의 무료 자료 창고를
            톡방에서 바로 확인할 수 있어요.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-gray-200 pt-10">
        <SectionHeader
          title="오공고 인스타그램"
          lines={[
            '취준 인사이트, 빠르게 받아보세요.',
            '렛츠커리어와 오공고 인스타그램에서 트렌디한 취준 정보를 만나보세요.',
          ]}
        />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {INSTAGRAM_ACCOUNTS.map((account) => (
            <InstagramCard key={account.handle} account={account} />
          ))}
        </ul>
      </section>
    </div>
  );
}
