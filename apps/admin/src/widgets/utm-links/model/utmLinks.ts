import { WEB_HOME } from '@/shared/api/webHandoff';
import utmConfig from '@/shared/config/utmTemplates.json';

/** UTM 링크를 만드는 목록의 종류. 웹 상세 경로의 첫 칸과 같다(`/jobs/12`). */
export type UtmContentKind = 'jobs' | 'bootcamps' | 'side-studies';

/** `utmTemplates.json` 의 한 줄. 채널(묶음)과 구분, 그리고 붙일 두 값이다. */
export interface UtmTemplate {
  channel: string;
  placement: string;
  source: string;
  medium: string;
}

export interface UtmPosting {
  id: number;
  title: string;
}

export interface UtmLink {
  posting: UtmPosting;
  template: UtmTemplate;
  campaign: string;
  url: string;
}

/**
 * 채널·구분과 값은 `shared/config/utmTemplates.json` 에만 있다. 채널을 더하거나 값을 고칠 때는 그
 * 파일만 고친다.
 */
export const UTM_TEMPLATES: UtmTemplate[] = utmConfig.templates;

const CAMPAIGNS: Record<UtmContentKind, string> = utmConfig.campaigns;

/** 파일 순서대로 같은 `channel` 끼리 묶는다. 모달의 묶음 제목이 된다. */
export function groupByChannel(
  templates: UtmTemplate[],
): { channel: string; items: UtmTemplate[] }[] {
  const groups: { channel: string; items: UtmTemplate[] }[] = [];
  for (const template of templates) {
    const group = groups.find((g) => g.channel === template.channel);
    if (group) {
      group.items.push(template);
    } else {
      groups.push({ channel: template.channel, items: [template] });
    }
  }
  return groups;
}

/** 공고 × 채널 링크. 채널 순서로 묶고 그 안에서 공고 순서를 따른다. 캠페인이 비면 링크에서 뺀다. */
export function buildUtmLinks(
  kind: UtmContentKind,
  postings: UtmPosting[],
  templates: UtmTemplate[],
): UtmLink[] {
  const campaign = CAMPAIGNS[kind];
  return templates.flatMap((template) =>
    postings.map((posting) => {
      const url = new URL(`/${kind}/${posting.id}`, WEB_HOME);
      url.searchParams.set('utm_source', template.source);
      url.searchParams.set('utm_medium', template.medium);
      if (campaign) {
        url.searchParams.set('utm_campaign', campaign);
      }
      return { posting, template, campaign, url: url.toString() };
    }),
  );
}

export function templateLabel(template: UtmTemplate): string {
  return `${template.channel} · ${template.placement}`;
}

/**
 * 붙여넣기용 텍스트. 채널마다 `[채널 · 구분]` 머리 아래 제목과 링크를 줄을 나눠 적는다. 카톡방·스레드에
 * 그대로 붙여넣는 용도다.
 */
export function toClipboardText(links: UtmLink[]): string {
  const blocks: string[] = [];
  let current: UtmTemplate | null = null;
  for (const link of links) {
    if (link.template !== current) {
      current = link.template;
      blocks.push(`[${templateLabel(current)}]`);
    }
    blocks.push(`${link.posting.title}\n${link.url}`);
  }
  return blocks.join('\n\n');
}

const KIND_LABEL: Record<UtmContentKind, string> = {
  jobs: '채용공고',
  bootcamps: '부트캠프',
  'side-studies': '사이드·스터디',
};

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

/** CSV 본문. 엑셀이 한글을 UTF-8 로 읽도록 BOM 을 앞에 붙인다. */
export function toCsv(kind: UtmContentKind, links: UtmLink[]): string {
  const header = [
    '제목',
    '종류',
    '채널',
    '구분',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'URL',
  ];
  const rows = links.map((link) => [
    link.posting.title,
    KIND_LABEL[kind],
    link.template.channel,
    link.template.placement,
    link.template.source,
    link.template.medium,
    link.campaign,
    link.url,
  ]);
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}
