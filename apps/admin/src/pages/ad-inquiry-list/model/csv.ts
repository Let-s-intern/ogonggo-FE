import { type AdminAdvertisementInquiryResponse, enumLabel } from '@ogonggo/api/src/admin';
import { formatDateTime } from '@/shared/lib/format';
import { inflowName } from './inflow';

/**
 * 엑셀이 수식으로 읽는 첫 글자. 신청서는 누구나 쓰므로 `=HYPERLINK(...)` 같은 값이 들어올 수 있다.
 * 앞에 `'` 를 붙여 글자로 열리게 한다.
 */
const FORMULA_PREFIX = /^[=+@\t\r]/;

/** 모든 칸을 큰따옴표로 감싼다. 쉼표·줄바꿈·따옴표가 든 설문이 칸을 넘지 않는다. */
function csvCell(value: string | number | boolean | undefined | null): string {
  const text = value === undefined || value === null ? '' : String(value);
  const safe = FORMULA_PREFIX.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** 카드의 모든 값과 유입 원본 필드를 열로 펼친다(PRD `어드민 화면`). */
const COLUMNS: [string, (row: AdminAdvertisementInquiryResponse) => string | number | undefined][] =
  [
    ['ID', (row) => row.id],
    ['신청 시각', (row) => formatDateTime(row.registeredAt)],
    ['처리 상태', (row) => enumLabel('AdvertisementInquiryStatus', row.status)],
    ['문의 유형', (row) => enumLabel('AdvertisementInquiryType', row.inquiryType)],
    ['캠페인', (row) => row.campaignCode],
    ['회사명', (row) => row.companyName],
    [
      '회사명 입력 방식',
      (row) => enumLabel('AdvertisementInquiryCompanyNameSource', row.companyNameSource),
    ],
    ['담당자', (row) => row.managerName],
    ['직함', (row) => row.managerTitle],
    ['연락처', (row) => row.phoneNumber],
    ['이메일', (row) => row.email],
    ['홍보 채널', (row) => enumLabel('AdvertisementInquiryPromotionChannel', row.promotionChannel)],
    ['채용 직무', (row) => row.hiringJobName],
    ['공고 링크', (row) => row.jobPostingUrl],
    ['채용 홍보 채널과 어려운 점', (row) => row.promotionAnswer],
    ['마케팅 수신 동의', (row) => (row.marketingConsent ? '동의' : '미동의')],
    ['회원 구분', (row) => enumLabel('AdvertisementInquiryMemberType', row.memberType)],
    ['회원 ID', (row) => row.userId],
    ['유입 경로', (row) => inflowName(row)],
    ['utm_source', (row) => row.utmSource],
    ['utm_medium', (row) => row.utmMedium],
    ['utm_campaign', (row) => row.utmCampaign],
    ['utm_content', (row) => row.utmContent],
    ['referrer', (row) => row.referrer],
    ['진입 호스트', (row) => row.entryHost],
    ['진입 경로', (row) => row.landingPath],
    ['메모', (row) => row.memo],
  ];

/** CSV 본문. 엑셀이 한글을 UTF-8 로 읽도록 BOM 을 앞에 붙인다(`widgets/utm-links` 와 같은 방식). */
export function toAdInquiryCsv(rows: AdminAdvertisementInquiryResponse[]): string {
  const header = COLUMNS.map(([name]) => csvCell(name)).join(',');
  const body = rows.map((row) => COLUMNS.map(([, read]) => csvCell(read(row))).join(','));
  return `﻿${[header, ...body].join('\r\n')}`;
}
