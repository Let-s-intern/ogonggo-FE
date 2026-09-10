/**
 * 일반 회원의 활동 — 북마크와 작성 글.
 *
 * 회원 상세가 "이 사람이 무엇을 했는가"를 보여주려면 필요한데, 백엔드에는 아직 어드민용 조회
 * API 가 없다. 여기 타입이 그 계약이 된다.
 *
 * 어느 회원이 무엇을 북마크했는지는 **계산해서 만든다.** 회원마다 목록을 손으로 적으면 픽스처가
 * 늘 때마다 표를 같이 고쳐야 하고, 빠뜨린 회원은 활동이 텅 빈 상세가 된다.
 *
 * 값을 뽑을 때 `id % n` 을 그대로 쓰지 않는다. `admin-content.ts` 에서 등록일과 등록 경로를
 * 각각 나머지로 잡았다가 두 값이 물려 "오늘 등록된 공고가 전부 비즈니스 등록"이 된 적이 있다.
 * 같은 해시를 쓴다.
 */

import { ADMIN_BOOTCAMP_FIXTURES, ADMIN_JOB_FIXTURES, hashId } from './admin-content';
import { SIDE_STUDY_FIXTURES } from './side-study';
import { USER_MEMBER_FIXTURES } from './admin-member';

export interface BookmarkedJob {
  id: number;
  title: string;
  companyName: string;
  viewCount: number;
}

export interface BookmarkedBootcamp {
  id: number;
  title: string;
  companyName: string;
  status: string;
}

export interface AuthoredSideStudy {
  id: number;
  title: string;
  kind: string;
  appliedCount: number;
  capacity: number;
  closed: boolean;
  viewCount: number;
}

/** 회원 상세가 기본 정보에 더해 보여주는 것. */
export interface UserMemberActivity {
  bookmarkedJobs: BookmarkedJob[];
  bookmarkedBootcamps: BookmarkedBootcamp[];
  authoredSideStudies: AuthoredSideStudy[];
}

/**
 * 목록에서 `count` 개를 회원마다 다르게 고른다.
 *
 * 시작 위치와 간격을 둘 다 해시로 정한다. 시작만 다르게 하면 모든 회원이 같은 순서의 연속된
 * 구간을 갖게 되어, 두 회원의 상세가 한 칸 밀린 것처럼 보인다.
 */
function pick<T>(all: T[], memberId: number, salt: number, count: number): T[] {
  if (all.length === 0) {
    return [];
  }
  const start = hashId(memberId, salt) % all.length;
  const stride = 1 + (hashId(memberId, salt + 100) % 7);
  const picked: T[] = [];
  for (let index = 0; index < count; index += 1) {
    const item = all[(start + index * stride) % all.length];
    if (item !== undefined && !picked.includes(item)) {
      picked.push(item);
    }
  }
  return picked;
}

/**
 * 회원 id -> 활동.
 *
 * 탈퇴 회원은 활동이 비어 있다. 탈퇴하면 작성 글과 북마크가 지워지는 것이 이 서비스의 전제이고,
 * 그 화면이 어떻게 보이는지도 확인할 수 있어야 한다.
 */
export function activityFor(memberId: number): UserMemberActivity {
  const member = USER_MEMBER_FIXTURES.find((entry) => entry.id === memberId);
  if (!member || member.status === 'WITHDRAWN') {
    return { bookmarkedJobs: [], bookmarkedBootcamps: [], authoredSideStudies: [] };
  }

  const jobCount = hashId(memberId, 11) % 6;
  const bootcampCount = hashId(memberId, 12) % 4;
  const studyCount = hashId(memberId, 13) % 3;

  return {
    bookmarkedJobs: pick(ADMIN_JOB_FIXTURES, memberId, 21, jobCount).map((job) => ({
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      viewCount: job.viewCount,
    })),
    bookmarkedBootcamps: pick(ADMIN_BOOTCAMP_FIXTURES, memberId, 22, bootcampCount).map(
      (bootcamp) => ({
        id: bootcamp.id,
        title: bootcamp.title,
        companyName: bootcamp.companyName,
        status: bootcamp.status,
      }),
    ),
    authoredSideStudies: pick(SIDE_STUDY_FIXTURES, memberId, 23, studyCount).map((study) => ({
      id: study.id,
      title: study.title,
      kind: study.kind,
      appliedCount: study.appliedCount,
      capacity: study.capacity,
      closed: study.closed,
      viewCount: study.viewCount,
    })),
  };
}
