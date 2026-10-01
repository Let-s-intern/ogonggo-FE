import type { CSSProperties, ReactElement, ReactNode } from 'react';
import {
  BULLET_INDENT,
  CONTENT_WIDTH,
  HEADER_HEIGHT,
  HEADLINE_TRACKING,
  PAD_X,
  type SlideMetrics,
  measureSlide,
} from '../layout';
import type { Measure } from '../measure';
import type { CardSection, CardSize, CardSpec } from '../types';
import { type Palette, resolvePalette, textOnBrand, variantImage, variantOf } from '../variants';
import { Background } from './backgrounds';
import {
  BOXED_BORDER,
  BOXED_PAD_X,
  BOXED_PAD_Y,
  COLUMN_CHIP_WIDTH,
  COLUMN_GAP,
  CompanyLogo,
  LABEL_WIDTH,
  Header,
  Headline,
  Icon,
  LetsCareer,
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
 * 시안이 `detailLayout` 을 가지면 2장만 그 배치로 그린다.
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

function Canvas({ size, children }: { size: CardSize; children: ReactNode }) {
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

/** 직무명이 카드 폭에 한 줄로 들어가는 크기. */
function titleSizeFor(measure: Measure, title: string): number {
  const at100 = measure(title, 100, 800, 100 * HEADLINE_TRACKING);
  return Math.floor(Math.max(40, Math.min(TAB_TITLE_MAX, (TAB_INNER / Math.max(1, at100)) * 100)));
}

type Built = { element: ReactElement; overflow: boolean };

function slideSections(spec: CardSpec, slide: number, dropRole: boolean): CardSection[] {
  const { content } = spec;
  const sections = slide === 0 ? content.summarySections : content.detailSections;
  // 직무명을 제목으로 크게 쓰는 시안은 `채용 직무` 섹션을 또 그리지 않는다.
  return dropRole && content.roleTitle.trim()
    ? sections.filter((section) => section.label.trim() !== '채용 직무')
    : sections;
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
  slide: number;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  const boxed = slide === 0;
  const sections = slideSections(spec, slide, true);
  const note = boxed ? spec.content.note : '';
  const count = visibleCount(sections);
  const titleSize = titleSizeFor(measure, spec.content.roleTitle);
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
  });

  const element = (
    <Canvas size={size}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <div style={{ display: 'flex', position: 'absolute', left: PAD_X, top: padTop + 12 }}>
        <LetsCareer palette={palette} assets={assets} size={64} />
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: padTop,
          left: 0,
          width: size.width,
          justifyContent: 'center',
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
          <CompanyLogo spec={spec} palette={palette} height={84} maxWidth={TAB_WIDTH - 80} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'absolute',
          top: cardTop,
          left: (size.width - TAB_CARD_WIDTH) / 2,
          width: TAB_CARD_WIDTH,
          // 카드는 화면 아래로 이어진다(예시처럼 아래 모서리를 보이지 않는다).
          height: size.height - cardTop + 60,
          backgroundColor: '#FFFFFF',
          borderRadius: 40,
          padding: `${TAB_CARD_PAD_TOP}px ${TAB_CARD_PAD_X}px 0`,
        }}
      >
        {titleHeight ? (
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
        ) : null}
        <div style={{ display: 'flex', marginTop: metrics.sectionsGap }}>
          <Sections
            palette={palette}
            sections={sections}
            note={note}
            metrics={metrics}
            mode={boxed ? 'boxed' : 'columns'}
          />
        </div>
      </div>
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

function LabelsSlide({
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
  slide: number;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  const sections = slideSections(spec, slide, false);
  const count = visibleCount(sections);
  const brand = spec.settings.brandColor;
  const role = spec.content.roleTitle.trim();
  const roleSize = Math.min(LABELS_ROLE_MAX, titleSizeFor(measure, role));
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
  });

  const card: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: CONTENT_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
  };
  const element = (
    <Canvas size={size}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <div style={{ display: 'flex', position: 'absolute', right: PAD_X, top: metrics.padTop }}>
        <LetsCareer palette={palette} assets={assets} size={52} />
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
          <CompanyLogo
            spec={spec}
            palette={{ ...palette, logo: palette.logo === 'plate' ? 'original' : palette.logo }}
            height={LABELS_LOGO}
            maxWidth={520}
          />
        </div>
        <div style={{ ...card, marginTop: 36, overflow: 'hidden' }}>
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
            {spec.companyName}
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
        <div
          style={{
            ...card,
            marginTop: 40,
            padding: `${LABELS_CARD_PAD_Y}px ${LABELS_CARD_PAD_X}px`,
          }}
        >
          <Sections palette={palette} sections={sections} note="" metrics={metrics} mode="labels" />
        </div>
      </Column>
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
  slide: number;
  measure: Measure;
  assets: SlideAssets;
}): Built {
  const definition = variantOf(spec.variant);
  const layout =
    slide === 1 && definition.detailLayout ? definition.detailLayout : definition.layout;
  if (layout === 'tab') {
    return TabSlide({ spec, palette, size, slide, measure, assets });
  }
  if (layout === 'labels') {
    return LabelsSlide({ spec, palette, size, slide, measure, assets });
  }
  const panel = layout === 'panel';
  // 썸네일 카드 시안은 2장의 제목(1장과 같은 문구) 자리에 썸네일 카드를 둔다.
  const thumbnail =
    definition.image === 'card' && slide === 1
      ? variantImage(spec.variant, spec.settings)
      : undefined;
  const card = thumbnail ? thumbCardSize(size, thumbnail.aspect) : null;
  const sections = slideSections(spec, slide, false);
  const note = slide === 0 ? spec.content.note : '';
  const headline = thumbnail ? null : spec.content.headline;

  const metrics = measureSlide(measure, size, {
    headline,
    sections,
    note,
    contentWidth: panel ? CONTENT_WIDTH - PANEL_PAD * 2 : CONTENT_WIDTH,
    chrome: (panel ? PANEL_PAD * 2 : 0) + (card ? card.height + 32 : 0),
    footer: true,
  });

  const list = <Sections palette={palette} sections={sections} note={note} metrics={metrics} />;
  const element = (
    <Canvas size={size}>
      <Background spec={spec} palette={palette} size={size} assets={assets} />
      <Column size={size} metrics={metrics}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Header
            spec={spec}
            palette={palette}
            assets={assets}
            width={CONTENT_WIDTH}
            right={<CompanyLogo spec={spec} palette={palette} />}
          />
          {thumbnail && card ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <img
                src={thumbnail.dataUrl}
                alt=""
                width={card.width}
                height={card.height}
                style={{ borderRadius: 32, opacity: thumbnail.opacity }}
              />
            </div>
          ) : null}
          {headline !== null ? (
            <div style={{ display: 'flex', marginTop: metrics.headlineGap }}>
              <Headline
                palette={palette}
                text={headline}
                size={metrics.headlineSize}
                color={palette.headlineText}
              />
            </div>
          ) : null}
          <div style={{ display: 'flex', marginTop: metrics.sectionsGap }}>
            {panel ? (
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
            ) : (
              list
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LetsCareer palette={palette} assets={assets} />
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
  return (
    <Canvas size={size}>
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
          <Icon
            src={text === '#FFFFFF' ? assets.arrowLight : assets.arrowDark}
            size={92}
            style={{ marginLeft: -18 }}
          />
          <div style={{ display: 'flex', marginTop: 24 }}>
            <Headline palette={ctaPalette} text={spec.content.ctaHeadline} size={88} color={text} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 56,
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
                  size={46}
                  weight={800}
                  color={text}
                />
              ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 52 }}>
            <ProfileCard spec={spec} assets={assets} />
          </div>
        </div>
      </div>
    </Canvas>
  );
}

/** 한 장을 만든다. `overflow` 는 가장 작은 글자로도 목록이 넘치는 경우다. */
export function buildSlide(
  spec: CardSpec,
  slide: number,
  size: CardSize,
  measure: Measure,
  assets: SlideAssets,
): { element: ReactElement; overflow: boolean } {
  const palette = resolvePalette(spec.variant, spec.settings);
  if (slide === 2) {
    return {
      element: <CtaSlide spec={spec} palette={palette} size={size} assets={assets} />,
      overflow: false,
    };
  }
  return InfoSlide({ spec, palette, size, slide, measure, assets });
}
