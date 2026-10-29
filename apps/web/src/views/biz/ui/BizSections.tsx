import Image from 'next/image';
import type { ReactNode } from 'react';
import { enumLabel } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import {
  APPLY_NOTES,
  FAQ,
  INSTAGRAM_FOLLOWERS_LABEL,
  INSTAGRAM_URL,
  INTRO_FEATURES,
  OPEN_CHAT_MEMBERS_AS_OF,
  OPEN_CHAT_MEMBERS_LABEL,
  OPEN_CHAT_ROOMS,
  OPEN_CHAT_ROOM_COUNT,
  PRIVACY_URL,
  STEPS,
  TERMS_URL,
} from '../model/content';

export function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
}) {
  return (
    <>
      <p className="text-sm font-bold text-blue-500">{eyebrow}</p>
      <h2 className="mt-2.5 text-2xl leading-[1.35] font-extrabold tracking-[-0.03em] text-gray-900 md:text-[34px]">
        {title}
      </h2>
      {sub ? (
        <p className="mt-3 text-base leading-relaxed text-gray-500 md:text-[17px]">{sub}</p>
      ) : null}
    </>
  );
}

/** 소개 방식. 짝수 번째는 그림이 왼쪽이다(시안 `.feat.rev`). */
export function BizIntro() {
  return (
    <section id="intro" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <SectionHeading
          eyebrow="소개 방식"
          title={
            <>
              채용공고만 등록하면,
              <br />
              &lsquo;오늘의 공고&rsquo;가 이렇게 소개합니다
            </>
          }
        />
        {INTRO_FEATURES.map((feature, index) => (
          <div
            key={feature.image.src}
            className={cn(
              'mt-12 grid items-center gap-8 md:mt-[72px] md:gap-14',
              index % 2 === 1 ? 'md:grid-cols-[1.25fr_1fr]' : 'md:grid-cols-[1fr_1.25fr]',
            )}
          >
            <div className={cn(index % 2 === 1 && 'md:order-2')}>
              <span className="inline-flex size-8 items-center justify-center rounded-[10px] bg-blue-50 text-[15px] font-extrabold text-blue-600">
                {index + 1}
              </span>
              <h3 className="mt-4 text-xl leading-[1.42] font-bold tracking-[-0.025em] text-gray-900 md:text-2xl">
                {feature.title[0]}
                <br className="hidden md:block" /> {feature.title[1]}
              </h3>
              <p className="mt-3 text-base leading-[1.75] text-gray-600">{feature.body}</p>
            </div>
            <div className="rounded-3xl border border-gray-150 bg-gray-50 p-4 md:p-7">
              <Image
                src={feature.image.src}
                alt={feature.image.alt}
                width={feature.image.width}
                height={feature.image.height}
                sizes="(min-width: 768px) 560px, 100vw"
                className="block h-auto w-full rounded-xl bg-white shadow-[0_8px_24px_-12px_rgba(17,24,39,0.18)]"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 홍보 채널, 집행 사례, 진행 3단계. */
export function BizChannels() {
  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <SectionHeading
          eyebrow="홍보 채널"
          title="원하는 채널 한 곳을 고르세요"
          sub="렛츠커리어가 직접 운영하는 채널에서, 채용 정보를 기다리는 인턴·신입 구직자에게 공고가 전달됩니다."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] border border-gray-150 bg-white p-6 md:p-7">
            <p className="text-[15px] font-semibold text-gray-500">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                {enumLabel('AdvertisementInquiryPromotionChannel', 'INSTAGRAM')}
              </a>
            </p>
            <p className="mt-2 text-[36px] font-extrabold tracking-[-0.03em] text-gray-900">
              {INSTAGRAM_FOLLOWERS_LABEL}
              <small className="ml-1.5 text-base font-semibold text-gray-500">팔로워</small>
            </p>
            <p className="mt-3 text-[15px] leading-[1.65] text-gray-600">
              저장과 공유가 가장 많이 일어나는 채널입니다.
            </p>
            <p className="mt-3.5 text-[13px] text-gray-500">
              기존 유료 상품 · 이벤트 기간 <b className="text-blue-600">1회 무료</b>
            </p>
          </div>
          <div className="rounded-[20px] border border-gray-150 bg-white p-6 md:p-7">
            <p className="text-[15px] font-semibold text-gray-500">직무별 오픈채팅방</p>
            <p className="mt-2 text-[36px] font-extrabold tracking-[-0.03em] text-gray-900">
              {OPEN_CHAT_MEMBERS_LABEL}
              <small className="ml-1.5 text-base font-semibold text-gray-500">
                명 · {OPEN_CHAT_ROOM_COUNT}개 방
              </small>
            </p>
            <p className="mt-1 text-[13px] text-gray-500">{OPEN_CHAT_MEMBERS_AS_OF} 기준</p>
            <p className="mt-3 text-[15px] leading-[1.65] text-gray-600">
              뽑는 직군의 방으로만 정확히 보낼 수 있습니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {OPEN_CHAT_ROOMS.map((room) => (
                <span
                  key={room.value}
                  className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[13px] font-medium text-gray-700"
                >
                  {room.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <figure className="mt-4 rounded-[20px] border border-gray-150 bg-white p-4 md:p-6">
          <Image
            src="/biz/showcase.jpg"
            alt="오공고 인스타그램 @letscareer.job 계정과 실제 집행한 채용공고 카드뉴스, 직무별 큐레이션 오픈채팅방 6곳 목록"
            width={1032}
            height={704}
            sizes="(min-width: 1120px) 1056px, 100vw"
            className="block h-auto w-full rounded-xl"
          />
          <figcaption className="mt-3.5 text-center text-sm text-gray-500">
            운영 중인 채널과 실제 집행 사례
          </figcaption>
        </figure>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-[20px] border border-gray-150 bg-white p-6">
              <p className="text-[13px] font-bold text-blue-500">STEP {index + 1}</p>
              <h3 className="mt-2 text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** 신청 구역의 왼쪽 안내 단. */
export function BizApplySide() {
  return (
    <div>
      <SectionHeading
        eyebrow="무료 홍보 신청"
        title={
          <>
            채용공고 무료 홍보
            <br />
            신청하기
          </>
        }
        sub="기업별 1회, 채널 한 곳에 무료로 집행합니다."
      />
      <ul className="mt-2">
        {APPLY_NOTES.map((note, index) => (
          <li key={note} className="mt-4 flex gap-3 text-[15px] leading-relaxed text-gray-700">
            <b className="w-5 flex-none font-extrabold text-blue-500">{index + 1}</b>
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BizFaq() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-[820px] px-5 md:px-8">
        <SectionHeading eyebrow="자주 묻는 질문" title="궁금한 점이 있으신가요" />
        <div className="mt-8 border-t border-gray-200">
          {FAQ.map((item, index) => (
            <details key={item.q} open={index === 0} className="group border-b border-gray-200">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-1 py-5 text-base font-semibold text-gray-900 md:text-[17px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden="true"
                  className="icon-[lucide--chevron-down] mt-0.5 size-5 flex-none text-gray-400 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="px-1 pb-5 text-[15px] leading-[1.7] text-gray-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 푸터는 기존 랜딩(`apps/launch-notice`) 그대로다(PRD 6절). */
export function BizFooter() {
  return (
    <footer className="bg-gray-50 py-10 text-[13px] leading-[1.8] text-gray-500">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        렛츠커리어 · 주식회사 아이엔지
        <br />
        광고·제휴 문의 official@letscareer.co.kr
        <br />
        직업정보제공사업 신고번호: J1202020260026
        <br />
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
          서비스 이용약관
        </a>
        {' · '}
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
          개인정보처리방침
        </a>
      </div>
    </footer>
  );
}
