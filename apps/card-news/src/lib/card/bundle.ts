import {
  type BundleLayout,
  type CardDocument,
  bundleCards,
  bundleLayoutOf,
  companyBlocks,
  companyNames,
  newSlide,
  slideJobIndices,
  slideSpec,
  withJobGroups,
} from './document';
import {
  COLUMNS_PACK_MIN,
  COMPANY_PACK_MIN,
  measureColumns,
  measureCompanies,
  textScale,
} from './layout';
import type { Measure } from './measure';
import { labelsMetrics } from './render/slides';
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
  const bodyScale = textScale(doc.settings.bodyScale);
  if (layout.kind === 'columns') {
    return pack(
      shownJobs(doc).map((index) => [index]),
      layout.perSlide,
      (jobs) => {
        const metrics = measureColumns(measure, size, bundleCards(doc, jobs.flat()), bodyScale);
        return !metrics.overflow && metrics.bodySize >= Math.round(COLUMNS_PACK_MIN * bodyScale);
      },
    ).map((jobs) => jobs.flat());
  }
  if (layout.kind === 'companies') {
    // 같은 회사 공고는 한 블록이다. 회사는 처음 나온 순서다.
    const byCompany = new Map<string, number[]>();
    for (const index of shownJobs(doc)) {
      const name = doc.jobs[index]!.companyName;
      byCompany.set(name, [...(byCompany.get(name) ?? []), index]);
    }
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

/**
 * 한 회사 묶음에서 항목명 표 대신 2열 카드를 고르는 기준. 공고 하나라도 항목명 표 배치에서 목록 글자가 이
 * 크기(4:5 기준, 글자 배율을 곱한다) 아래로 줄어야 들어가면 글이 많은 것으로 본다. 항목명 표의 목록 글자는
 * 40px 에서 시작한다.
 */
export const LABELS_CROWDED_BELOW = 32;

/**
 * 내용으로 고른 묶음 공고 장 배치. 묶은 회사가 둘 이상이면 회사 블록(한 장에 2곳까지), 한 회사이고 공고마다
 * 담당·자격·우대 글이 많으면 2열 카드(한 장에 2개까지), 그 밖은 항목명 표(공고마다 한 장)다. 글이 많은지는
 * 항목명 표로 그렸을 때의 목록 글자 크기로 잰다(`LABELS_CROWDED_BELOW`).
 */
export function autoBundleLayout(doc: CardDocument, measure: Measure): BundleLayout {
  if (companyNames(doc).length > 1) {
    return { kind: 'companies', perSlide: 2 };
  }
  const size = CARD_SIZES[doc.size ?? 'post'];
  const labels: CardDocument = { ...doc, bundleLayout: { kind: 'labels', perSlide: 1 } };
  const limit = Math.round(LABELS_CROWDED_BELOW * textScale(doc.settings.bodyScale));
  const crowded = shownJobs(doc).some((index) => {
    const { spec } = slideSpec(labels, newSlide('job', index), doc.variant);
    const { metrics } = labelsMetrics(spec, size, 'job', measure);
    return metrics.overflow || metrics.bodySize < limit;
  });
  return crowded ? { kind: 'columns', perSlide: 2 } : { kind: 'labels', perSlide: 1 };
}

/**
 * 배치대로 공고 장을 나눈 문서. 묶음이 아니면 그대로다. 사람이 배치를 고르지 않은 묶음(`manual` 이 없다)은
 * 먼저 내용으로 배치를 고른다(`autoBundleLayout()`).
 */
export function arrangeBundle(doc: CardDocument, measure: Measure): CardDocument {
  if (doc.kind !== 'bundle') {
    return doc;
  }
  const current = bundleLayoutOf(doc);
  let next = doc;
  if (!current.manual) {
    const auto = autoBundleLayout(doc, measure);
    if (auto.kind !== current.kind || auto.perSlide !== current.perSlide) {
      next = { ...doc, bundleLayout: auto };
    }
  }
  return withJobGroups(next, groupJobs(next, bundleLayoutOf(next), measure));
}
