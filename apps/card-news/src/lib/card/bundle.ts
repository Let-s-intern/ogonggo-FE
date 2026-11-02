import {
  type BundleLayout,
  type CardDocument,
  bundleLayoutOf,
  companyBlocks,
  slideJobIndices,
  withJobGroups,
} from './document';
import { COMPANY_PACK_MIN, measureCompanies, textScale } from './layout';
import type { Measure } from './measure';
import { CARD_SIZES } from './types';

/**
 * 묶음 공고 장을 배치에 맞춰 나눈다. 편집 화면이 문서가 바뀔 때마다 부르고(`CardEditor`), 나눈 결과가 지금과
 * 같으면 문서를 그대로 돌려준다.
 *
 * 한 장에 둘을 넣을지는 실제 글자 폭으로 잰다(`measure`). 기준 크기는 문서 크기(없으면 피드 4:5)다 — 다른
 * 크기로 받으면 넘칠 수 있고, 그때는 장마다의 넘침 경고가 뜬다.
 */

/** 공고 장에 나오는 공고. 장 순서, 같은 공고는 한 번이다. 공고 장을 지운 공고는 넣지 않는다. */
function shownJobs(doc: CardDocument): number[] {
  return [...new Set(doc.slides.flatMap(slideJobIndices))].filter(
    (index) => index < doc.jobs.length,
  );
}

/** 앞에서부터 `perSlide` 개까지 한 장에 담되, 다음 것을 더하면 장에 들어가지 않으면 거기서 장을 넘긴다. */
function pack<T>(items: T[], perSlide: number, fits: (group: T[]) => boolean): T[][] {
  const groups: T[][] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.length < perSlide && fits([...last, item])) {
      last.push(item);
    } else {
      groups.push([item]);
    }
  }
  return groups;
}

/** 배치대로 나눈 장마다의 공고들. */
function groupJobs(doc: CardDocument, layout: BundleLayout, measure: Measure): number[][] {
  const size = CARD_SIZES[doc.size ?? 'post'];
  if (layout.kind === 'companies') {
    // 같은 회사 공고는 한 블록이다. 회사는 처음 나온 순서다.
    const byCompany = new Map<string, number[]>();
    for (const index of shownJobs(doc)) {
      const name = doc.jobs[index]!.companyName;
      byCompany.set(name, [...(byCompany.get(name) ?? []), index]);
    }
    const bodyScale = textScale(doc.settings.bodyScale);
    return pack([...byCompany.values()], layout.perSlide, (companies) => {
      const metrics = measureCompanies(
        measure,
        size,
        companyBlocks(doc, companies.flat()),
        bodyScale,
      );
      return !metrics.overflow && metrics.rowSize >= Math.round(COMPANY_PACK_MIN * bodyScale);
    }).map((companies) => companies.flat());
  }
  // 항목명 표는 공고마다 한 장이다. 사람이 같은 공고 장을 더 넣었으면 그대로 둔다.
  return doc.slides.flatMap((slide) => slideJobIndices(slide).map((index) => [index]));
}

/** 배치대로 공고 장을 나눈 문서. 묶음이 아니면 그대로다. */
export function arrangeBundle(doc: CardDocument, measure: Measure): CardDocument {
  if (doc.kind !== 'bundle') {
    return doc;
  }
  return withJobGroups(doc, groupJobs(doc, bundleLayoutOf(doc), measure));
}
