import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { CONSULT_HREF } from '@/shared/config/site';

/** 시안 맨 아래 상담 신청 띠 둘(`예산만 알려주시면...`, `채용공고 홍보 및 교육 모집에...`)을 하나로 합쳤다. */
export function ConsultCta() {
  return (
    <section className="bg-linear-to-r from-blue-600 to-blue-400 text-white">
      <div className="mx-auto flex max-w-page-padded flex-col gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between md:py-16">
        <div className="flex flex-col gap-3">
          <p className="text-2xl leading-snug font-bold md:text-3xl">
            예산만 알려주시면, 조합은 저희가 짜드려요
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">
            예산 · 목표 · 관심 구좌 세 가지만 적으면 끝. 가입 없이 접수되고, 24시간 안에 세일즈
            매니저가 연락해 오공고 지면과 렛츠커리어 채널을 묶은 예산 맞춤 제안서를 드려요. 공고가
            아직 없어도 괜찮아요.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button asChild className="border border-white/70 bg-transparent hover:bg-white/10">
            <Link href="/schedule">잔여 구좌 보기</Link>
          </Button>
          <Button asChild className="bg-white text-blue-600 hover:bg-blue-50">
            <a href={CONSULT_HREF}>광고 상담 신청</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
