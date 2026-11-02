import type { CSSProperties, ReactElement, ReactNode } from 'react';
import {
  BULLET_INDENT,
  BUNDLE_TOP_GAP,
  CHIP_WEIGHT,
  COMPANY_BAND_PAD_Y,
  COMPANY_BAND_SIZE,
  COMPANY_CELL_WIDTH,
  COMPANY_HEAD_GAP,
  COMPANY_LOGO_GAP,
  COMPANY_LOGO_HEIGHT,
  COMPANY_LOGO_MAX_WIDTH,
  COMPANY_ROW_LINE_HEIGHT,
  COMPANY_RULE,
  COMPANY_TABLE_PAD_BOTTOM,
  COMPANY_TABLE_PAD_TOP,
  COMPANY_TABLE_PAD_X,
  COLUMNS_BAND_PAD_Y,
  COLUMNS_BAND_SIZE,
  COLUMNS_CARD_GAP,
  COLUMNS_CARD_PAD_X,
  COLUMNS_CARD_PAD_Y,
  COLUMNS_CHIP_GAP,
  COLUMNS_GAP,
  COLUMNS_LEFT_WEIGHT,
  COLUMNS_LEFT_WIDTH,
  COLUMNS_LINE_HEIGHT,
  COLUMNS_LOGO_GAP,
  COLUMNS_LOGO_HEIGHT,
  COLUMNS_RIGHT_WEIGHT,
  COLUMNS_RIGHT_WIDTH,
  COLUMNS_SECTION_GAP,
  CONTENT_WIDTH,
  COVER_DEADLINE_INNER_GAP,
  COVER_LINK_SCALE,
  COVER_LINK_TEXT,
  COVER_ROW_WEIGHT,
  COVER_SCHEDULE_GAP,
  COVER_SCHEDULE_LINE_HEIGHT,
  COVER_SCHEDULE_PAD_X,
  COVER_SCHEDULE_PAD_Y,
  COVER_SCHEDULE_WEIGHT,
  COVER_TABLE_PAD_X,
  COVER_TABLE_PAD_Y,
  HEADER_HEIGHT,
  HEADLINE_TRACKING,
  HEADLINE_WEIGHT,
  OUTLINE_CHIP_BORDER,
  PAD_X,
  type SlideMetrics,
  columnsChipSize,
  companyHeadSize,
  measureColumns,
  measureCompanies,
  measureCover,
  measureSlide,
  textScale,
} from '../layout';
import { contrastRatio } from '../color';
import type { SlideRole } from '../document';
import { type Measure, wordBreakFor } from '../measure';
import {
  type BrandMarkId,
  type BundleCard,
  type BundleCompany,
  type CardSection,
  type CardSize,
  type CardSpec,
  type CoverTable,
  type Layer,
  sectionElementId,
} from '../types';
import { type Palette, resolvePalette, textOnBrand, variantImage, variantOf } from '../variants';
import { Background } from './backgrounds';
import { layerElements } from './layers';
import {
  BOXED_BORDER,
  BOXED_PAD_X,
  BOXED_PAD_Y,
  COLUMN_CHIP_WIDTH,
  COLUMN_GAP,
  BrandMark,
  Chip,
  CompanyLogo,
  Editable,
  LABEL_WIDTH,
  Header,
  Headline,
  Icon,
  MarkedLine,
  Sections,
  type SlideAssets,
} from './primitives';

/**
 * 장 하나를 시안에 맞춰 조립한다. 배치는 세 가지다.
 *
 * - `open`: 머리·제목·목록을 바탕에 바로 놓는다(물결·워터마크·테두리).
 * - `panel`: 목록만 흰 판 안에 넣는다(흰 판 목록).
 * - `tab`: 로고 탭이 달린 큰 흰 카드 안에 직무명과 목록을 넣는다(카카오스타일 예시). 1장은 알약 칩
 *   아래 테두리 상자, 2장은 왼쪽 칩·오른쪽 목록 두 칸이다.
 * - `labels`: 가운데 로고, 브랜드색 띠 머리 카드, 왼쪽 항목명·오른쪽 목록 표(LG생활건강형 2장).
 *
 * 시안이 `detailLayout` 을 가지면 2장만 그 배치로 그린다. 묶음 공고 장은 시안과 상관없이 문서의 묶음 배치다 —
 * 항목명 표(`bundleRow`)는 `labels`, 2열 카드(`bundleCards`)는 `ColumnsSlide`, 회사 블록(`bundleCompanies`)은
 * `CompaniesSlide` 다.
 */

/** 흰 판 안쪽 여백. */
const PANEL_PAD = 44;

/** 탭 카드. 카드 폭·안쪽 여백, 로고 탭 높이, 직무명 최대 크기. */
const TAB_CARD_WIDTH = 880;
const TAB_CARD_PAD_X = 56;
const TAB_CARD_PAD_TOP = 52;
const TAB_HEIGHT = 128;
/** 로고 탭 폭. 내용에 맞추면 이미지 생성기가 줄 전체로 늘려 버려 고정한다. */
const TAB_WIDTH = 440;
const TAB_TITLE_MAX = 72;
const TAB_INNER = TAB_CARD_WIDTH - TAB_CARD_PAD_X * 2;

/** 장 하나의 바탕. 템플릿을 그린 뒤 맨 위에 자유 요소를 얹는다. */
function Canvas({
  size,
  layers,
  children,
}: {
  size: CardSize;
  layers: Layer[] | undefined;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: size.width,
        height: size.height,
        fontFamily: 'Pretendard',
      }}
    >
      {children}
      {layerElements(layers)}
    </div>
  );
}

function Column({
  size,
  metrics,
  children,
  justify = 'space-between',
}: {
  size: CardSize;
  metrics: Pick<SlideMetrics, 'padTop' | 'padBottom'>;
  children: ReactNode;
  justify?: CSSProperties['justifyContent'];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        width: size.width,
        height: size.height,
        padding: `${metrics.padTop}px ${PAD_X}px ${metrics.padBottom}px`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 직무명이 카드 폭에 한 줄로 들어가는 크기. 좁힌 자간(`HEADLINE_TRACKING`)은 빼고 잰다 — 이미지
 * 생성기는 줄을 나눌 때 좁힌 자간만큼 덜 들어가는 것처럼 굴어, 폭에 꼭 맞춘 직무명의 마지막 한두
 * 글자를 다음 줄로 넘긴다(편집 캔버스와 비교해 찾았다).
 */
function titleSizeFor(measure: Measure, title: string): number {
  const at100 = measure(title, 100, 800);
  return Math.floor(Math.max(40, Math.min(TAB_TITLE_MAX, (TAB_INNER / Math.max(1, at100)) * 100)));
}

type Built = { element: ReactElement; overflow: boolean };

/** 공고 문구를 목록으로 그리는 장. 표지는 요약 섹션, 공고 장은 자격·우대 섹션이다. */
type InfoRole = Extract<SlideRole, 'cover' | 'job'>;

/** 묶음 공고 장의 표 항목. 문구에서 이 이름의 섹션을 찾고, 없으면 그 자리 순서의 섹션을 쓴다. */
const BUNDLE_JOB_SECTIONS = [
  { from: 'summarySections', label: '마감 기한', index: 1 },
  { from: 'summarySections', label: '담당 업무', index: 2 },
  { from: 'detailSections', label: '우대 요건', index: 1 },
] as const;

function slideSections(
  spec: Pick<CardSpec, 'content' | 'bundleRow'>,
  slide: InfoRole,
  dropRole: boolean,
): CardSection[] {
  const { content } = spec;
  if (slide === 'job' && spec.bundleRow) {
    return BUNDLE_JOB_SECTIONS.flatMap(({ from, label, index }) => {
      const found =
        content[from].find((section) => section.label.trim() === label) ?? content[from][index];
      return found ? [found] : [];
    });
  }
  const sections = slide === 'cover' ? content.summarySections : content.detailSections;
  // 직무명을 제목으로 크게 쓰는 시안은 `채용 직무` 섹션을 또 그리지 않는다.
  return dropRole && content.roleTitle.trim()
    ? sections.filter((section) => section.label.trim() !== '채용 직무')
    : sections;
}

/**
 * 장에 보이는 섹션이 문구(`summarySections`·`detailSections`)의 몇 번째인지. `Sections` 가 단
 * `section-<n>` 의 n 번째가 이 배열의 n-1 번째다. 탭 템플릿은 `채용 직무` 를 그리지 않고, 항목이 빈 섹션은
 * 세지 않는다.
 */
export function visibleSectionIndices(
  spec: Pick<CardSpec, 'variant' | 'content' | 'bundleRow' | 'bundleCompanies' | 'bundleCards'>,
  slide: SlideRole,
): number[] {
  // 묶음 공고 장은 두 문구 배열에서 섹션을 모아 그리거나(항목명 표) 공고 여럿을 그려(회사 블록) 한 배열의
  // 순서로 가리킬 수 없다.
  if (
    (slide !== 'cover' && slide !== 'job') ||
    (slide === 'job' && (spec.bundleRow || spec.bundleCompanies || spec.bundleCards))
  ) {
    return [];
  }
  const layout = variantOf(spec.variant);
  const tab =
    (slide === 'job' && layout.detailLayout ? layout.detailLayout : layout.layout) === 'tab';
  const shown = new Set(slideSections(spec, slide, tab));
  const all = slide === 'cover' ? spec.content.summarySections : spec.content.detailSections;
  return all.flatMap((section, index) =>
    shown.has(section) && section.items.some((item) => item.trim()) ? [index] : [],
  );
}

/** 장에 보이는 섹션의 칩 제목. 섹션 요소 이름(`섹션 2 · 마감 기한`)에 쓴다. */
export function visibleSectionLabels(
  spec: Pick<CardSpec, 'variant' | 'content' | 'bundleRow' | 'bundleCompanies' | 'bundleCards'>,
  slide: SlideRole,
): string[] {
  // 회사 블록·2열 카드 배치의 `section-<n>` 은 n 번째 회사 블록·카드다.
  if (slide === 'job' && spec.bundleCompanies) {
    return spec.bundleCompanies.map((company) => company.name);
  }
  if (slide === 'job' && spec.bundleCards) {
    return spec.bundleCards.map((card) => card.title);
  }
  if (slide === 'job' && spec.bundleRow) {
    return slideSections(spec, slide, false)
      .filter((section) => section.items.some((item) => item.trim()))
      .map((section) => section.label);
  }
  const all = slide === 'cover' ? spec.content.summarySections : spec.content.detailSections;
  return visibleSectionIndices(spec, slide).map((index) => all[index]?.label ?? '');
}

function visibleCount(sections: CardSection[]): number {
  return sections.filter((section) => section.items.some((item) => item.trim())).length;
}

function TabSlide({
  spec,
  palette,
  size,
  slide,
  measure,
  assets,
}: {
  spec: CardSpec;
  palette: Palette;
  size: CardSize;
  slide: InfoRole;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  const boxed = slide === 'cover';
  const sections = slideSections(spec, slide, true);
  const note = boxed ? spec.content.note : '';
  const count = visibleCount(sections);
  const titleSize = Math.round(
    titleSizeFor(measure, spec.content.roleTitle) * textScale(spec.settings.headlineScale),
  );
  const titleHeight = spec.content.roleTitle.trim() ? Math.round(titleSize * 1.2) : 0;
  const story = size.height > size.width * 1.5;
  const square = size.height <= size.width;
  const padTop = story ? 200 : square ? 40 : 64;
  const cardTop = padTop + TAB_HEIGHT - 8;

  // 높이 계산은 머리(뱃지 줄) 자리를 늘 잡으므로, 그만큼 빼고 카드 머리·제목·상자 여백을 더한다.
  // 2칸 배치는 칩이 목록 옆에 있어 칩 높이를 다시 돌려준다.
  const chrome =
    cardTop -
    padTop +
    TAB_CARD_PAD_TOP +
    titleHeight -
    HEADER_HEIGHT +
    (boxed ? count * (BOXED_BORDER + BOXED_PAD_Y) * 2 : -count * 60);
  const metrics = measureSlide(measure, size, {
    headline: null,
    sections,
    note,
    contentWidth: boxed
      ? TAB_INNER - (BOXED_BORDER + BOXED_PAD_X) * 2 + BULLET_INDENT
      : TAB_INNER - COLUMN_CHIP_WIDTH - COLUMN_GAP,
    chrome,
    footer: false,
    headlineScale: 1,
    bodyScale: textScale(spec.settings.bodyScale),
  });

  const edits = spec.edits;
  const element = (
    <Canvas size={size} layers={spec.layers}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <div style={{ display: 'flex', position: 'absolute', left: PAD_X, top: padTop + 12 }}>
        <Editable id="brandMark" edits={edits}>
          <BrandMark
            brand={spec.settings.brandMark}
            image={spec.settings.brandImage}
            palette={palette}
            assets={assets}
            size={64}
          />
        </Editable>
      </div>
      {/* 로고 탭과 카드는 한 요소로 같이 움직인다. 카드가 탭 아래 8px 를 덮는다. */}
      <Editable
        id="tabCard"
        edits={edits}
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          position: 'absolute',
          top: padTop,
          left: (size.width - TAB_CARD_WIDTH) / 2,
          width: TAB_CARD_WIDTH,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: TAB_WIDTH,
            height: TAB_HEIGHT,
            padding: '8px 40px 0',
            backgroundColor: '#FFFFFF',
            borderRadius: '40px 40px 0 0',
          }}
        >
          <Editable id="companyLogo" edits={edits}>
            <CompanyLogo spec={spec} palette={palette} height={84} maxWidth={TAB_WIDTH - 80} />
          </Editable>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: cardTop - padTop - TAB_HEIGHT,
            width: TAB_CARD_WIDTH,
            // 카드는 화면 아래로 이어진다(예시처럼 아래 모서리를 보이지 않는다).
            height: size.height - cardTop + 60,
            backgroundColor: '#FFFFFF',
            borderRadius: 40,
            padding: `${TAB_CARD_PAD_TOP}px ${TAB_CARD_PAD_X}px 0`,
          }}
        >
          {titleHeight ? (
            <Editable id="roleTitle" edits={edits}>
              <div
                style={{
                  display: 'flex',
                  fontSize: titleSize,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: titleSize * HEADLINE_TRACKING,
                  color: palette.headlineText,
                }}
              >
                {spec.content.roleTitle}
              </div>
            </Editable>
          ) : null}
          <div style={{ display: 'flex', marginTop: metrics.sectionsGap }}>
            <Sections
              palette={palette}
              sections={sections}
              note={note}
              metrics={metrics}
              mode={boxed ? 'boxed' : 'columns'}
              edits={edits}
              measure={measure}
            />
          </div>
        </div>
      </Editable>
    </Canvas>
  );
  return { element, overflow: metrics.overflow };
}

/** LG생활건강형 2장. 가운데 로고, 브랜드색 띠 머리 카드, 왼쪽 항목명·오른쪽 목록 표. */
const LABELS_LOGO = 96;
const LABELS_BAR = 40;
const LABELS_ROLE_MAX = 54;
const LABELS_CARD_PAD_X = 44;
const LABELS_CARD_PAD_Y = 48;

/**
 * `labels` 배치의 글자 크기와 간격. 렌더와, 묶음 공고 장 배치를 자동으로 고르는 쪽(`../bundle.ts`, 이 배치에서
 * 목록 글자가 얼마나 줄어드는가)이 같이 쓴다.
 */
export function labelsMetrics(
  spec: CardSpec,
  size: CardSize,
  slide: InfoRole,
  measure: Measure,
): { metrics: SlideMetrics; sections: CardSection[]; role: string; roleSize: number } {
  const sections = slideSections(spec, slide, false);
  const count = visibleCount(sections);
  const role = (spec.bundleRow ? spec.bundleRow[1] : spec.content.roleTitle).trim();
  const roleSize = Math.round(
    Math.min(LABELS_ROLE_MAX, titleSizeFor(measure, role)) * textScale(spec.settings.headlineScale),
  );
  const headCard = Math.round(LABELS_BAR * 1.2) + 28 + (role ? Math.round(roleSize * 1.2) + 36 : 0);
  // 머리 자리(뱃지 줄) 대신 로고·머리 카드·표 안쪽 여백을 잡는다. 표는 항목명이 목록 옆에 있어 칩
  // 높이를 다시 돌려준다.
  const chrome =
    LABELS_LOGO + 36 + headCard + 40 + LABELS_CARD_PAD_Y * 2 - HEADER_HEIGHT - count * 60;
  const metrics = measureSlide(measure, size, {
    headline: null,
    sections,
    note: '',
    contentWidth: CONTENT_WIDTH - LABELS_CARD_PAD_X * 2 - LABEL_WIDTH - COLUMN_GAP,
    chrome,
    footer: false,
    headlineScale: 1,
    bodyScale: textScale(spec.settings.bodyScale),
  });
  return { metrics, sections, role, roleSize };
}

function LabelsSlide({
  spec,
  palette: base,
  size,
  slide,
  measure,
  assets,
}: {
  spec: CardSpec;
  palette: Palette;
  size: CardSize;
  slide: InfoRole;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  // 머리 카드와 표는 흰 카드라, 묶음 공고 장은 바탕 시안이 어두워도 검은 글자로 쓴다. 공고 하나는 이
  // 배치를 밝은 바탕 시안(뒷배경 + 흰 판)에서만 써 원래 글자색 그대로다.
  const palette: Palette = spec.bundleRow
    ? { ...base, headlineText: '#111111', bodyText: '#111111' }
    : base;
  const { metrics, sections, role, roleSize } = labelsMetrics(spec, size, slide, measure);
  const brand = spec.settings.brandColor;
  // 묶음 공고 장은 머리띠에 직무, 흰 줄에 모집 분야(표지 표 줄)를 쓴다. 공고 하나는 회사명과 직무명이다.
  const band = spec.bundleRow ? spec.bundleRow[0] : spec.companyName;

  const card: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: CONTENT_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
  };
  const edits = spec.edits;
  const element = (
    <Canvas size={size} layers={spec.layers}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <div style={{ display: 'flex', position: 'absolute', right: PAD_X, top: metrics.padTop }}>
        <Editable id="brandMark" edits={edits}>
          <BrandMark
            brand={spec.settings.brandMark}
            image={spec.settings.brandImage}
            palette={palette}
            assets={assets}
            size={52}
          />
        </Editable>
      </div>
      <Column size={size} metrics={metrics} justify="flex-start">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: LABELS_LOGO,
            marginTop: 24,
          }}
        >
          <Editable id="companyLogo" edits={edits}>
            <CompanyLogo
              spec={spec}
              palette={{ ...palette, logo: palette.logo === 'plate' ? 'original' : palette.logo }}
              height={LABELS_LOGO}
              maxWidth={520}
            />
          </Editable>
        </div>
        {/* 표 배치의 직무명은 회사명 띠와 함께 머리 카드째 움직인다. */}
        <Editable id="roleTitle" edits={edits} style={{ marginTop: 36 }}>
          <div style={{ ...card, overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: brand,
                color: textOnBrand(brand),
                fontSize: LABELS_BAR,
                fontWeight: 800,
                lineHeight: 1.2,
                padding: '14px 0',
              }}
            >
              {band}
            </div>
            {role ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  fontSize: roleSize,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: roleSize * HEADLINE_TRACKING,
                  color: palette.headlineText,
                  padding: '18px 0',
                }}
              >
                {role}
              </div>
            ) : null}
          </div>
        </Editable>
        <Editable id="sectionsPanel" edits={edits} style={{ marginTop: 40 }}>
          <div
            style={{
              ...card,
              padding: `${LABELS_CARD_PAD_Y}px ${LABELS_CARD_PAD_X}px`,
            }}
          >
            <Sections
              palette={palette}
              sections={sections}
              note=""
              metrics={metrics}
              mode="labels"
              edits={edits}
              measure={measure}
            />
          </div>
        </Editable>
      </Column>
    </Canvas>
  );
  return { element, overflow: metrics.overflow };
}

/**
 * 묶음 공고 장(회사 블록) 오른쪽 위 브랜드 로고. 처음 값(`ogonggo`, 심볼 + 글자)은 좁은 귀퉁이에 맞지 않아 옛
 * 오공고 로고로 그린다(예시 묶음 게시물). 다른 것을 고르면 그것이다.
 */
function cornerBrandMark(mark: BrandMarkId | undefined): BrandMarkId {
  return mark === undefined || mark === 'ogonggo' ? 'ogonggoClassic' : mark;
}

/**
 * 흰 바탕에 브랜드색 테두리 알약 칩(묶음 공고 장의 표 머리). 글자는 검정이다. 브랜드색이 흰 바탕과 거의 같으면
 * 테두리를 검정으로 한다.
 */
function OutlineChip({
  brand,
  size,
  children,
}: {
  brand: string;
  size: number;
  children: ReactNode;
}) {
  const border = contrastRatio(brand, '#FFFFFF') < 1.15 ? '#111111' : brand;
  return (
    <div
      style={{
        display: 'flex',
        alignSelf: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        color: '#111111',
        border: `${OUTLINE_CHIP_BORDER}px solid ${border}`,
        fontSize: size,
        fontWeight: CHIP_WEIGHT,
        lineHeight: 1,
        letterSpacing: -size * 0.01,
        whiteSpace: 'nowrap',
        padding: `${Math.round(size * 0.3)}px ${Math.round(size * 0.9)}px`,
        borderRadius: 999,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 회사 블록의 회사 로고. 같은 높이·최대 폭 상자(`COMPANY_LOGO_HEIGHT`·`COMPANY_LOGO_MAX_WIDTH`)에 비율대로
 * 맞춘다. 로고가 없으면 회사명을 상자 높이의 6할 크기 글자로 쓰고, 상자 폭을 넘으면 줄인다.
 */
function BlockLogo({
  company,
  palette,
  measure,
}: {
  company: BundleCompany;
  palette: Palette;
  measure: Measure;
}) {
  const { logo } = company;
  const source =
    palette.logo === 'white'
      ? (logo?.white ?? logo?.original)
      : palette.logo === 'black'
        ? (logo?.black ?? logo?.original)
        : logo?.original;
  if (source) {
    const aspect = logo?.aspect ?? 1;
    const wide = aspect > COMPANY_LOGO_MAX_WIDTH / COMPANY_LOGO_HEIGHT;
    return (
      <img
        src={source}
        alt=""
        width={wide ? COMPANY_LOGO_MAX_WIDTH : Math.round(COMPANY_LOGO_HEIGHT * aspect)}
        height={wide ? Math.round(COMPANY_LOGO_MAX_WIDTH / aspect) : COMPANY_LOGO_HEIGHT}
      />
    );
  }
  const base = Math.round(COMPANY_LOGO_HEIGHT * 0.6);
  const width = measure(company.name, base, 900);
  const fontSize =
    width > COMPANY_LOGO_MAX_WIDTH
      ? Math.max(24, Math.floor((base * COMPANY_LOGO_MAX_WIDTH) / width))
      : base;
  return (
    <div
      style={{
        display: 'flex',
        fontSize,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: -fontSize * 0.02,
        whiteSpace: 'nowrap',
        color: palette.headlineText,
      }}
    >
      {company.name}
    </div>
  );
}

/**
 * 회사 블록 배치(여러 회사 묶음 예시). 회사마다 가운데 로고, 브랜드색 머리띠에 회사명, 흰 카드 안 2열 표(테두리
 * 칩 머리, 줄 사이 회색 선, 빈 칸은 `-`)다. 오른쪽 위에 브랜드 로고. 블록이 장에 다 들어가게 표 글자를 줄인다
 * (`measureCompanies`).
 */
function CompaniesSlide({
  spec,
  companies,
  palette,
  size,
  measure,
  assets,
}: {
  spec: CardSpec;
  companies: BundleCompany[];
  palette: Palette;
  size: CardSize;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  const metrics = measureCompanies(measure, size, companies, textScale(spec.settings.bodyScale));
  const brand = spec.settings.brandColor;
  const { rowSize } = metrics;
  const headSize = companyHeadSize(rowSize);
  const logoPalette: Palette = {
    ...palette,
    logo: palette.logo === 'plate' ? 'original' : palette.logo,
  };
  const cell: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    width: COMPANY_CELL_WIDTH,
  };
  const edits = spec.edits;
  const element = (
    <Canvas size={size} layers={spec.layers}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <div style={{ display: 'flex', position: 'absolute', right: PAD_X, top: metrics.padTop }}>
        <Editable id="brandMark" edits={edits}>
          <BrandMark
            brand={cornerBrandMark(spec.settings.brandMark)}
            image={spec.settings.brandImage}
            palette={palette}
            assets={assets}
            size={52}
          />
        </Editable>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: size.width,
          padding: `${metrics.padTop + BUNDLE_TOP_GAP + metrics.blockTop}px ${PAD_X}px 0`,
          gap: metrics.blockGap,
        }}
      >
        {companies.map((company, blockIndex) => (
          <Editable
            key={blockIndex}
            id={sectionElementId(blockIndex + 1)}
            edits={edits}
            style={{ flexDirection: 'column', alignItems: 'center' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: COMPANY_LOGO_HEIGHT,
                marginBottom: COMPANY_LOGO_GAP,
              }}
            >
              <BlockLogo company={company} palette={logoPalette} measure={measure} />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: CONTENT_WIDTH,
                backgroundColor: '#FFFFFF',
                borderRadius: 28,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  backgroundColor: brand,
                  color: textOnBrand(brand),
                  fontSize: COMPANY_BAND_SIZE,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: -COMPANY_BAND_SIZE * 0.01,
                  padding: `${COMPANY_BAND_PAD_Y}px 0`,
                }}
              >
                {company.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: `${COMPANY_TABLE_PAD_TOP}px ${COMPANY_TABLE_PAD_X}px ${COMPANY_TABLE_PAD_BOTTOM}px`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: COMPANY_HEAD_GAP,
                  }}
                >
                  {company.columns.map((label, index) => (
                    <div key={index} style={cell}>
                      <OutlineChip brand={brand} size={headSize}>
                        {label}
                      </OutlineChip>
                    </div>
                  ))}
                </div>
                {company.rows.map((cells, rowIndex) => (
                  <div
                    key={rowIndex}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: `${metrics.rowPad}px 0`,
                      ...(rowIndex > 0 ? { borderTop: `${COMPANY_RULE}px solid #DDDDDD` } : {}),
                    }}
                  >
                    {cells.map((text, index) => (
                      <div
                        key={index}
                        style={{
                          ...cell,
                          textAlign: 'center',
                          fontSize: rowSize,
                          fontWeight: COVER_ROW_WEIGHT,
                          lineHeight: COMPANY_ROW_LINE_HEIGHT,
                          letterSpacing: -rowSize * 0.01,
                          wordBreak: wordBreakFor(
                            measure,
                            text.trim() || '-',
                            rowSize,
                            COVER_ROW_WEIGHT,
                            COMPANY_CELL_WIDTH,
                          ),
                          color: '#111111',
                        }}
                      >
                        {text.trim() || '-'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Editable>
        ))}
      </div>
    </Canvas>
  );
  return { element, overflow: metrics.overflow };
}

/** 2열 카드의 열 하나. 섹션마다 가운데 테두리 칩, 그 아래 왼쪽 정렬 점 목록이다. */
function CardColumn({
  sections,
  brand,
  size,
  weight,
  width,
  measure,
}: {
  sections: CardSection[];
  brand: string;
  size: number;
  weight: number;
  width: number;
  measure: Measure;
}) {
  const visible = sections
    .map((section) => ({ ...section, items: section.items.filter((item) => item.trim()) }))
    .filter((section) => section.items.length > 0);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        gap: Math.round(size * COLUMNS_SECTION_GAP),
      }}
    >
      {visible.map((section, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: Math.round(size * COLUMNS_CHIP_GAP),
          }}
        >
          <OutlineChip brand={brand} size={columnsChipSize(size)}>
            {section.label}
          </OutlineChip>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {section.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                style={{
                  display: 'flex',
                  width,
                  fontSize: size,
                  fontWeight: weight,
                  lineHeight: COLUMNS_LINE_HEIGHT,
                  letterSpacing: -size * 0.01,
                  color: '#111111',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: BULLET_INDENT,
                    flexShrink: 0,
                    paddingLeft: Math.round(size * 0.3),
                  }}
                >
                  •
                </div>
                <div
                  style={{
                    display: 'flex',
                    width: width - BULLET_INDENT,
                    wordBreak: wordBreakFor(measure, item, size, weight, width - BULLET_INDENT),
                  }}
                >
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 2열 카드 배치(한 회사 여러 직무 묶음 예시). 맨 위 가운데 회사 로고, 오른쪽 위 브랜드 로고, 공고마다 검정
 * 머리띠에 직무, 흰 카드 안 왼쪽 열 담당 업무, 오른쪽 열 자격·우대 요건이다. 칩은 흰 바탕에 브랜드색 테두리다.
 * 카드가 장에 다 들어가게 목록 글자를 줄인다(`measureColumns`).
 */
function ColumnsSlide({
  spec,
  cards,
  palette,
  size,
  measure,
  assets,
}: {
  spec: CardSpec;
  cards: BundleCard[];
  palette: Palette;
  size: CardSize;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  const metrics = measureColumns(measure, size, cards, textScale(spec.settings.bodyScale));
  const brand = spec.settings.brandColor;
  const { bodySize } = metrics;
  const edits = spec.edits;
  const element = (
    <Canvas size={size} layers={spec.layers}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <div style={{ display: 'flex', position: 'absolute', right: PAD_X, top: metrics.padTop }}>
        <Editable id="brandMark" edits={edits}>
          <BrandMark
            brand={cornerBrandMark(spec.settings.brandMark)}
            image={spec.settings.brandImage}
            palette={palette}
            assets={assets}
            size={52}
          />
        </Editable>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: size.width,
          padding: `${metrics.padTop + BUNDLE_TOP_GAP}px ${PAD_X}px 0`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: COLUMNS_LOGO_HEIGHT,
            marginBottom: COLUMNS_LOGO_GAP,
          }}
        >
          <Editable id="companyLogo" edits={edits}>
            <CompanyLogo
              spec={spec}
              palette={{ ...palette, logo: palette.logo === 'plate' ? 'original' : palette.logo }}
              height={COLUMNS_LOGO_HEIGHT}
              maxWidth={520}
            />
          </Editable>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: COLUMNS_CARD_GAP }}>
          {cards.map((card, index) => (
            <Editable
              key={index}
              id={sectionElementId(index + 1)}
              edits={edits}
              style={{ flexDirection: 'column' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: CONTENT_WIDTH,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 28,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    fontSize: COLUMNS_BAND_SIZE,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    letterSpacing: -COLUMNS_BAND_SIZE * 0.01,
                    padding: `${COLUMNS_BAND_PAD_Y}px 0`,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: COLUMNS_GAP,
                    padding: `${COLUMNS_CARD_PAD_Y}px ${COLUMNS_CARD_PAD_X}px`,
                  }}
                >
                  <CardColumn
                    sections={card.left}
                    brand={brand}
                    size={bodySize}
                    weight={COLUMNS_LEFT_WEIGHT}
                    width={COLUMNS_LEFT_WIDTH}
                    measure={measure}
                  />
                  <CardColumn
                    sections={card.right}
                    brand={brand}
                    size={bodySize}
                    weight={COLUMNS_RIGHT_WEIGHT}
                    width={COLUMNS_RIGHT_WIDTH}
                    measure={measure}
                  />
                </div>
              </div>
            </Editable>
          ))}
        </div>
      </div>
    </Canvas>
  );
  return { element, overflow: metrics.overflow };
}

/**
 * 썸네일 카드 크기. 이미지 비율 그대로 콘텐츠 폭에 맞추되, 세로는 카드 높이의 3할까지. 그보다 길면
 * 세로에 맞춰 폭을 줄인다 — 배너 속 글자가 잘리지 않게 통째로 보여 준다.
 */
function thumbCardSize(size: CardSize, aspect: number): { width: number; height: number } {
  const maxHeight = Math.round(size.height * 0.3);
  const height = Math.min(maxHeight, Math.round(CONTENT_WIDTH / aspect));
  return { width: Math.min(CONTENT_WIDTH, Math.round(height * aspect)), height };
}

function InfoSlide({
  spec,
  palette,
  size,
  slide,
  measure,
  assets,
}: {
  spec: CardSpec;
  palette: Palette;
  size: CardSize;
  slide: InfoRole;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  const definition = variantOf(spec.variant);
  // 묶음 공고 장은 어느 시안이든 항목명 표 배치다(공고별 장 틀).
  const layout =
    slide === 'job' && spec.bundleRow
      ? 'labels'
      : slide === 'job' && definition.detailLayout
        ? definition.detailLayout
        : definition.layout;
  if (layout === 'tab') {
    return TabSlide({ spec, palette, size, slide, measure, assets });
  }
  if (layout === 'labels') {
    return LabelsSlide({ spec, palette, size, slide, measure, assets });
  }
  const panel = layout === 'panel';
  // 썸네일 카드 시안은 2장의 제목(1장과 같은 문구) 자리에 썸네일 카드를 둔다.
  const thumbnail =
    definition.image === 'card' && slide === 'job'
      ? variantImage(spec.variant, spec.settings)
      : undefined;
  const card = thumbnail ? thumbCardSize(size, thumbnail.aspect) : null;
  const sections = slideSections(spec, slide, false);
  const note = slide === 'cover' ? spec.content.note : '';
  const headline = thumbnail ? null : spec.content.headline;

  const metrics = measureSlide(measure, size, {
    headline,
    sections,
    note,
    contentWidth: panel ? CONTENT_WIDTH - PANEL_PAD * 2 : CONTENT_WIDTH,
    chrome: (panel ? PANEL_PAD * 2 : 0) + (card ? card.height + 32 : 0),
    footer: true,
    headlineScale: textScale(spec.settings.headlineScale),
    bodyScale: textScale(spec.settings.bodyScale),
  });

  const edits = spec.edits;
  const list = (
    <Sections
      palette={palette}
      sections={sections}
      note={note}
      metrics={metrics}
      edits={edits}
      measure={measure}
    />
  );
  const element = (
    <Canvas size={size} layers={spec.layers}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <Column size={size} metrics={metrics}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Header
            spec={spec}
            palette={palette}
            assets={assets}
            width={CONTENT_WIDTH}
            edits={edits}
            right={
              <Editable id="companyLogo" edits={edits}>
                <CompanyLogo spec={spec} palette={palette} />
              </Editable>
            }
          />
          {thumbnail && card ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <Editable id="thumbnail" edits={edits}>
                <img
                  src={thumbnail.dataUrl}
                  alt=""
                  width={card.width}
                  height={card.height}
                  style={{ borderRadius: 32, opacity: thumbnail.opacity }}
                />
              </Editable>
            </div>
          ) : null}
          {headline !== null ? (
            <div style={{ display: 'flex', marginTop: metrics.headlineGap }}>
              <Editable id="headline" edits={edits}>
                <Headline
                  palette={palette}
                  text={headline}
                  size={metrics.headlineSize}
                  color={palette.headlineText}
                />
              </Editable>
            </div>
          ) : null}
          <div style={{ display: 'flex', marginTop: metrics.sectionsGap }}>
            {panel ? (
              <Editable id="sectionsPanel" edits={edits}>
                <div
                  style={{
                    display: 'flex',
                    // 썸네일 위에 놓이므로 불투명하게 — 배너 속 글자가 비치지 않게.
                    backgroundColor: '#FFFFFF',
                    borderRadius: 36,
                    padding: PANEL_PAD,
                  }}
                >
                  {list}
                </div>
              </Editable>
            ) : (
              list
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Editable id="brandMark" edits={edits}>
            <BrandMark
              brand={spec.settings.brandMark}
              image={spec.settings.brandImage}
              palette={palette}
              assets={assets}
            />
          </Editable>
        </div>
      </Column>
    </Canvas>
  );
  return { element, overflow: metrics.overflow };
}

/**
 * 묶음 표지(농심 그룹 묶음 예시 1장). 뱃지·회사 로고 머리, 강조 상자 제목, 마감 줄(칩 + 가장 이른 마감 +
 * `직무별 공고 자세히 보기`), 흰 판 안 2열 직무 표(머리 칩 두 개, 공고마다 한 줄), 아래 우리 로고.
 * 표 줄이 늘면 글자를 줄인다(`measureCover`).
 */
function CoverSlide({
  spec,
  cover,
  palette,
  size,
  measure,
  assets,
}: {
  spec: CardSpec;
  cover: CoverTable;
  palette: Palette;
  size: CardSize;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  const metrics = measureCover(measure, size, {
    headline: spec.content.headline,
    deadline: cover.deadline,
    columns: cover.columns,
    rows: cover.rows,
    ...(cover.schedule ? { schedule: cover.schedule } : {}),
    headlineScale: textScale(spec.settings.headlineScale),
    bodyScale: textScale(spec.settings.bodyScale),
  });
  // 표는 흰 판 위라 바탕 시안과 상관없이 검은 글자다. 머리 칩은 브랜드색, 흰 판에 묻히는 밝은 색이면 검정.
  const brand = spec.settings.brandColor;
  const headChip = contrastRatio(brand, '#FFFFFF') < 1.35 ? '#111111' : brand;
  const headPalette: Palette = { ...palette, chip: headChip, chipText: textOnBrand(headChip) };
  const deadlineChip = Math.round(metrics.deadlineSize * 0.86);
  const cell = (column: number): CSSProperties => ({
    display: 'flex',
    justifyContent: 'center',
    width: metrics.cellWidths[column === 0 ? 0 : 1],
  });
  const edits = spec.edits;
  const element = (
    <Canvas size={size} layers={spec.layers}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <Column size={size} metrics={metrics}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Header
            spec={spec}
            palette={palette}
            assets={assets}
            width={CONTENT_WIDTH}
            edits={edits}
            right={
              // 여러 회사 묶음은 회사 로고 하나를 고를 수 없어 머리 오른쪽을 비운다(우리 로고는 아래에 있다).
              spec.companyNames ? null : (
                <Editable id="companyLogo" edits={edits}>
                  <CompanyLogo spec={spec} palette={palette} />
                </Editable>
              )
            }
          />
          <div style={{ display: 'flex', marginTop: metrics.headlineGap }}>
            <Editable id="headline" edits={edits}>
              <Headline
                palette={palette}
                text={spec.content.headline}
                size={metrics.headlineSize}
                color={palette.headlineText}
              />
            </Editable>
          </div>
          <Editable id="deadlineRow" edits={edits} style={{ marginTop: metrics.deadlineGap }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: CONTENT_WIDTH,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: COVER_DEADLINE_INNER_GAP }}>
                <Chip palette={palette} size={deadlineChip} pill>
                  마감 기한
                </Chip>
                <div
                  style={{
                    display: 'flex',
                    fontSize: metrics.deadlineSize,
                    fontWeight: HEADLINE_WEIGHT,
                    lineHeight: 1.2,
                    letterSpacing: -metrics.deadlineSize * 0.01,
                    whiteSpace: 'nowrap',
                    color: palette.headlineText,
                  }}
                >
                  {cover.deadline}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: Math.round(metrics.deadlineSize * COVER_LINK_SCALE),
                  fontWeight: 700,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  color: palette.headlineText,
                }}
              >
                {COVER_LINK_TEXT}
              </div>
            </div>
          </Editable>
          <Editable id="jobTable" edits={edits} style={{ marginTop: metrics.tableGap }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: CONTENT_WIDTH,
                backgroundColor: '#FFFFFF',
                borderRadius: 32,
                padding: `${COVER_TABLE_PAD_Y}px ${COVER_TABLE_PAD_X}px`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: metrics.headGap,
                }}
              >
                {cover.columns.map((label, index) => (
                  <div key={index} style={cell(index)}>
                    <Chip palette={headPalette} size={metrics.headSize} pill>
                      {label}
                    </Chip>
                  </div>
                ))}
              </div>
              {cover.rows.map((cells, rowIndex) => (
                <div
                  key={rowIndex}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: metrics.rowPitch,
                  }}
                >
                  {cells.map((text, index) => (
                    <div
                      key={index}
                      style={{
                        ...cell(index),
                        fontSize: metrics.rowSize,
                        fontWeight: COVER_ROW_WEIGHT,
                        lineHeight: 1.2,
                        letterSpacing: -metrics.rowSize * 0.01,
                        whiteSpace: 'nowrap',
                        color: '#111111',
                      }}
                    >
                      {text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Editable>
          {cover.schedule?.length ? (
            <Editable id="note" edits={edits} style={{ marginTop: COVER_SCHEDULE_GAP }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: CONTENT_WIDTH,
                  backgroundColor: 'rgba(255,255,255,0.86)',
                  borderRadius: 32,
                  padding: `${COVER_SCHEDULE_PAD_Y}px ${COVER_SCHEDULE_PAD_X}px`,
                }}
              >
                {cover.schedule.map((line, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      textAlign: 'center',
                      width: CONTENT_WIDTH - COVER_SCHEDULE_PAD_X * 2,
                      fontSize: metrics.scheduleSize,
                      fontWeight: COVER_SCHEDULE_WEIGHT,
                      wordBreak: wordBreakFor(
                        measure,
                        line,
                        metrics.scheduleSize,
                        COVER_SCHEDULE_WEIGHT,
                        CONTENT_WIDTH - COVER_SCHEDULE_PAD_X * 2,
                      ),
                      lineHeight: COVER_SCHEDULE_LINE_HEIGHT,
                      letterSpacing: -metrics.scheduleSize * 0.01,
                      color: '#111111',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </Editable>
          ) : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Editable id="brandMark" edits={edits}>
            <BrandMark
              brand={spec.settings.brandMark}
              image={spec.settings.brandImage}
              palette={palette}
              assets={assets}
            />
          </Editable>
        </div>
      </Column>
    </Canvas>
  );
  return { element, overflow: metrics.overflow };
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 200 }}>
      <div
        style={{
          display: 'flex',
          fontSize: 42,
          fontWeight: 700,
          color: '#111111',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 36,
          fontWeight: 500,
          color: '#222222',
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** 인스타그램 프로필 화면을 흉내 낸 카드. 예시 3장의 그것이다. */
function ProfileCard({ spec, assets }: { spec: CardSpec; assets: SlideAssets }) {
  const { profile } = spec.content;
  const button: CSSProperties = {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    fontSize: 36,
    fontWeight: 600,
    padding: '20px 0',
    borderRadius: 18,
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 880,
        backgroundColor: '#FFFFFF',
        borderRadius: 44,
        padding: 40,
        gap: 26,
        boxShadow: '0 10px 40px rgba(0,0,0,0.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 50,
              fontWeight: 700,
              letterSpacing: -1,
              color: '#111111',
            }}
          >
            {profile.handle}
          </div>
          <Icon src={assets.chevronDown} size={36} />
          <div
            style={{
              display: 'flex',
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: '#FF3040',
              marginLeft: 4,
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <div style={{ display: 'flex', position: 'relative' }}>
            <Icon src={assets.threads} size={60} />
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: -26,
                right: -26,
                width: 46,
                height: 46,
                borderRadius: 999,
                backgroundColor: '#FF3040',
                border: '4px solid #FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon src={assets.dotsWhite} size={28} />
            </div>
          </div>
          <Icon src={assets.squarePlus} size={60} />
          <Icon src={assets.menu} size={60} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 44, marginTop: 18 }}>
        <div
          style={{ display: 'flex', position: 'relative', width: 200, height: 200, flexShrink: 0 }}
        >
          <div
            style={{
              display: 'flex',
              width: 200,
              height: 200,
              borderRadius: 999,
              border: '2px solid #E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
            }}
          >
            <img src={assets.ogonggoLogo} alt="" width={140} height={67} />
          </div>
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: -30,
              left: -14,
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: '10px 20px',
              fontSize: 22,
              fontWeight: 500,
              color: '#8E8E8E',
              boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
            }}
          >
            새로운 소식이 있나요?
          </div>
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 56,
              height: 56,
              borderRadius: 999,
              backgroundColor: '#111111',
              border: '5px solid #FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon src={assets.plusWhite} size={30} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: -0.5,
              color: '#111111',
            }}
          >
            {profile.name}
          </div>
          <div style={{ display: 'flex' }}>
            <Stat value={profile.posts} label="게시물" />
            <Stat value={profile.followers} label="팔로워" />
            <Stat value={profile.following} label="팔로잉" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {profile.bio
          .split('\n')
          .filter((line) => line.trim())
          .map((line, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                fontSize: 34,
                fontWeight: 500,
                lineHeight: 1.4,
                letterSpacing: -0.5,
                color: '#111111',
              }}
            >
              {line}
            </div>
          ))}
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ ...button, backgroundColor: '#0095F6', color: '#FFFFFF' }}>팔로우</div>
        <div style={{ ...button, backgroundColor: '#EFEFEF', color: '#111111' }}>메시지</div>
      </div>
    </div>
  );
}

function CtaSlide({
  spec,
  palette,
  size,
  assets,
}: {
  spec: CardSpec;
  palette: Palette;
  size: CardSize;
  assets: SlideAssets;
}): ReactElement {
  const story = size.height > size.width * 1.5;
  const square = size.height <= size.width;
  // 정사각은 세로가 모자라 전체를 줄인다. 글자 크기를 하나씩 바꾸지 않고 묶음째 줄인다.
  const scale = square ? 0.76 : 1;
  const text = palette.ctaText;
  const ctaPalette: Palette = { ...palette, headlineText: text };
  // 3장 제목·부제는 크기가 고정이라 제목 배율만 곱한다.
  const headlineScale = textScale(spec.settings.headlineScale);
  const edits = spec.edits;
  return (
    <Canvas size={size} layers={spec.layers}>
      <Background spec={spec} palette={palette} size={size} assets={assets} cta />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: story ? 'center' : 'flex-start',
          alignItems: 'center',
          width: size.width,
          height: size.height,
          padding: `${square ? 40 : 84}px ${PAD_X}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 880,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <Editable id="arrow" edits={edits} style={{ alignSelf: 'flex-start', marginLeft: -18 }}>
            <Icon src={text === '#FFFFFF' ? assets.arrowLight : assets.arrowDark} size={92} />
          </Editable>
          <div style={{ display: 'flex', marginTop: 24 }}>
            <Editable id="ctaHeadline" edits={edits}>
              <Headline
                palette={ctaPalette}
                text={spec.content.ctaHeadline}
                size={Math.round(88 * headlineScale)}
                color={text}
              />
            </Editable>
          </div>
          <Editable id="ctaSub" edits={edits} style={{ alignSelf: 'center', marginTop: 56 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {spec.content.ctaSub
                .split('\n')
                .filter((line) => line.trim())
                .map((line, index) => (
                  <MarkedLine
                    key={index}
                    palette={ctaPalette}
                    text={line}
                    size={Math.round(46 * headlineScale)}
                    weight={800}
                    color={text}
                  />
                ))}
            </div>
          </Editable>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 52 }}>
            <Editable id="profile" edits={edits}>
              <ProfileCard spec={spec} assets={assets} />
            </Editable>
          </div>
        </div>
      </div>
    </Canvas>
  );
}

/** 시안 배경만 그린 빈 장. 자유 요소를 얹는 자리다. */
function FreeSlide({
  spec,
  palette,
  size,
  assets,
}: {
  spec: CardSpec;
  palette: Palette;
  size: CardSize;
  assets: SlideAssets;
}): ReactElement {
  return (
    <Canvas size={size} layers={spec.layers}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
    </Canvas>
  );
}

/**
 * 한 장을 만든다. 무엇을 그릴지는 장 종류가 정한다 — 표지·공고 장은 문구 목록(묶음 표지는 직무 표),
 * 안내 장은 프로필 링크 안내, 빈 장은 배경만. `overflow` 는 가장 작은 글자로도 목록이 넘치는 경우다.
 */
export function buildSlide(
  spec: CardSpec,
  role: SlideRole,
  size: CardSize,
  measure: Measure,
  assets: SlideAssets,
): { element: ReactElement; overflow: boolean } {
  const palette = resolvePalette(spec.variant, spec.settings);
  if (role === 'profile') {
    return {
      element: <CtaSlide spec={spec} palette={palette} size={size} assets={assets} />,
      overflow: false,
    };
  }
  if (role === 'free') {
    return {
      element: <FreeSlide spec={spec} palette={palette} size={size} assets={assets} />,
      overflow: false,
    };
  }
  if (role === 'cover' && spec.cover) {
    return CoverSlide({ spec, cover: spec.cover, palette, size, measure, assets });
  }
  if (role === 'job' && spec.bundleCards) {
    return ColumnsSlide({ spec, cards: spec.bundleCards, palette, size, measure, assets });
  }
  if (role === 'job' && spec.bundleCompanies) {
    return CompaniesSlide({
      spec,
      companies: spec.bundleCompanies,
      palette,
      size,
      measure,
      assets,
    });
  }
  return InfoSlide({ spec, palette, size, slide: role, measure, assets });
}
