import { NextResponse } from 'next/server';
import { SITE_ORIGIN } from '@/shared/config/site';

/**
 * `/llms.txt`. AI 검색(ChatGPT·Perplexity·Claude 등)에 이 사이트가 무엇이고 어디에 무엇이 있는지
 * 알려 주는 마크다운(https://llmstxt.org).
 *
 * 개별 공고는 적지 않는다. 수천 건이라 사이트맵과 RSS 가 맡고, 여기서는 그 주소만 알린다.
 * 서비스 설명은 루트 레이아웃·각 목록 화면의 `description` 과 같은 문장을 쓴다.
 */
export const dynamic = 'force-static';

export function GET() {
  const body = `# 오늘의 공고 (오공고)

> 커리어 여정에 딱 맞는 채용공고, 교육·부트캠프, 사이드·스터디를 모아 보는 서비스. 렛츠커리어가 만들었다.

신입·주니어 취업 준비생을 위해 여러 채용 사이트와 교육기관에 흩어진 공고를 한곳에 모은다. 공고마다 경력·채용 유형·학력·지역·자격 요건·우대 사항·전형 절차를 같은 형식으로 정리해 보여 준다.

## 목록

- [채용공고](${SITE_ORIGIN}/): 직무·채용 형태·요구 경력으로 거르고 \`?q=검색어\` 로 찾는다. 상세는 \`${SITE_ORIGIN}/jobs/{id}\`
- [교육·부트캠프](${SITE_ORIGIN}/bootcamps): 부트캠프·KDT·무료 교육까지, 실무를 배울 수 있는 교육. 상세는 \`${SITE_ORIGIN}/bootcamps/{id}\`
- [사이드·스터디](${SITE_ORIGIN}/side-studies): 사이드 프로젝트·스터디 팀원 모집. 상세는 \`${SITE_ORIGIN}/side-studies/{id}\`
- [취준 고민](${SITE_ORIGIN}/concerns): 공고부터 면접까지, 취준생들의 질문과 답변
- [공지사항](${SITE_ORIGIN}/notices)

## 전체 목록

- [사이트맵](${SITE_ORIGIN}/sitemap.xml)
- [채용공고 RSS](${SITE_ORIGIN}/rss/jobs.xml)
- [교육·부트캠프 RSS](${SITE_ORIGIN}/rss/bootcamps.xml)
- [사이드·스터디 RSS](${SITE_ORIGIN}/rss/side-studies.xml)

## 운영

- 운영: 렛츠커리어 (https://www.letscareer.co.kr)
- 문의: official@letscareer.co.kr
`;

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
