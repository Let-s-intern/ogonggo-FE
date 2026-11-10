import {
  KIND_LABELS,
  OPERATION_TYPE_LABELS,
  POSITION_LABELS,
} from '@/entities/side-study/model/labels';
import {
  ogDeadlineText,
  POSTING_OG_SIZE,
  renderPostingOgImage,
} from '@/shared/lib/og/postingOgImage';
import { fetchSideStudyDetail } from '@/widgets/side-study-detail';

export const alt = '오늘의 공고 사이드·스터디';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/** 포지션 칸에 이름을 몇 개까지 적는지. 넘치면 `외 N` 으로 줄인다 — 칸 너비가 1/4 이다. */
const MAX_POSITIONS = 2;

/**
 * 사이드·스터디 모집글을 공유했을 때 미리보기 카드. 모양은 채용공고
 * (`app/(site)/jobs/[jobId]/opengraph-image.tsx`)와 같다.
 *
 * 회사가 아니라 개인이 쓴 글이라 제목 위 줄은 회사명 대신 글 종류(`사이드 프로젝트`·`스터디`)
 * 칩이다. 모집 중·마감 상태는 넣지 않는다 — 메신저가 이미지를 캐시하므로 마감된 뒤에도
 * `모집 중` 이 남는다. 첫 첨부 사진이 있으면 배경에 깐다.
 */
export default async function Image({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const sideStudy = await fetchSideStudyDetail(Number(postId));
  const positionNames = sideStudy.positions.map((position) => POSITION_LABELS[position]);
  const positions =
    positionNames.length > MAX_POSITIONS
      ? `${positionNames.slice(0, MAX_POSITIONS).join(' · ')} 외 ${positionNames.length - MAX_POSITIONS}`
      : positionNames.join(' · ');

  return renderPostingOgImage({
    theme: 'side-study',
    kindLabel: '사이드·스터디',
    tags: [KIND_LABELS[sideStudy.recruitmentType]],
    title: sideStudy.title,
    coverUrl: sideStudy.images[0]?.url,
    infoCells: [
      ...(positions ? [{ label: '모집 포지션', value: positions }] : []),
      { label: '모집 인원', value: `${sideStudy.capacity}명` },
      { label: '활동 기간', value: `${sideStudy.activityDurationMonths}개월` },
      {
        label: '진행 방식',
        value: OPERATION_TYPE_LABELS[sideStudy.progressMethod],
      },
    ],
    deadlineText: ogDeadlineText('side-study', sideStudy.recruitmentEndDate),
  });
}
