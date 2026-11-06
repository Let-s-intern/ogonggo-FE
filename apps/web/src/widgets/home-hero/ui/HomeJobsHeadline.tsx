import { fetchHeadlineJobCount } from '../api/fetchHeadlineJobCount';
import { JobsHeroHeadline } from './JobsHeroHeadline';

/**
 * 홈 히어로 헤드라인을 공고 수와 함께 그린다. 숫자를 서버에서 받는 일을 이 컴포넌트 안에 두어, 홈의 다른 요청
 * (인기 공고·전체 공고·배너)과 서로 기다리지 않고 함께 나간다.
 */
export async function HomeJobsHeadline() {
  const count = await fetchHeadlineJobCount();
  return <JobsHeroHeadline count={count} />;
}
