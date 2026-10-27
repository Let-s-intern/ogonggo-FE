import type { CSSProperties, ReactNode } from 'react';
import {
  BODY_LINE_HEIGHT,
  BODY_WEIGHT,
  BOX_PAD,
  BULLET_INDENT,
  CHIP_WEIGHT,
  HEADER_HEIGHT,
  HEADLINE_LINE_GAP,
  HEADLINE_LINE_HEIGHT,
  HEADLINE_TRACKING,
  HEADLINE_WEIGHT,
  NOTE_SCALE,
  type SlideMetrics,
} from '../layout';
import { parseLine } from '../markup';
import {
  type BrandMarkId,
  type CardSection,
  type CardSpec,
  type ElementId,
  type SlideEdits,
  sectionElementId,
} from '../types';
import type { Palette } from '../variants';

/**
 * 시안들이 같이 쓰는 조각. 이미지 생성기(satori)가 그린다 — 브라우저 CSS 가 아니라 flexbox 만 되는
 * 부분 집합이다. 모든 `div` 는 `display: flex` 이고, 줄바꿈이 필요한 글자는 폭이 정해진 상자에 둔다.
 */

/** 렌더 라우트가 미리 읽어 오는 그림(data URL). */
export interface SlideAssets {
  markColor: string;
  markWhite: string;
  /** 오공고 심볼. 원래 색(파랑)과 어두운 바탕용 흰색. */
  ogonggoLogo: string;
  ogonggoWhite: string;
  /** 뱃지 확성기. 검정 뱃지용(흰색)과 흰 뱃지용(검정). */
  speakerLight: string;
  speakerDark: string;
  /** 3장 맨 위 화살표. 밝은 바탕용(검정)과 어두운 바탕용(흰색). */
  arrowDark: string;
  arrowLight: string;
  chevronDown: string;
  threads: string;
  squarePlus: string;
  menu: string;
  plusWhite: string;
  dotsWhite: string;
}

/**
 * 편집할 수 있는 요소를 감싸는 상자. 편집값이 있으면 자동 배치 자리에서 옮기고 가운데를 기준으로
 * 키운다. 숨긴 요소는 투명하게 그려 자리를 지킨다. `data-el` 은 이미지 생성기가 무시하고, 편집
 * 화면이 브라우저 DOM 에서 요소 상자를 찾는 데 쓴다.
 *
 * 상자가 놓이는 자리의 정렬(가운데 정렬, 늘이기)은 `style` 로 넘긴다 — 감싼 상자 때문에 배치가
 * 바뀌지 않게.
 */
export function Editable({
  id,
  edits,
  style,
  children,
}: {
  id: ElementId;
  edits: SlideEdits | undefined;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const edit = edits?.[id];
  return (
    <div
      data-el={id}
      style={{
        display: 'flex',
        ...style,
        ...(edit
          ? {
              transform: `translate(${edit.dx}px, ${edit.dy}px) scale(${edit.scale})`,
              transformOrigin: 'center',
              ...(edit.hidden ? { opacity: 0 } : {}),
            }
          : {}),
      }}
    >
      {children}
    </div>
  );
}

export function Icon({ src, size, style }: { src: string; size: number; style?: CSSProperties }) {
  return <img src={src} alt="" width={size} height={size} style={style} />;
}

/** `*단어*` 상자와 `~단어~` 강조색을 가진 한 줄. */
export function MarkedLine({
  palette,
  text,
  size,
  weight,
  color,
}: {
  palette: Palette;
  text: string;
  size: number;
  weight: number;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {parseLine(text).map((segment, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            fontSize: size,
            fontWeight: weight,
            lineHeight: HEADLINE_LINE_HEIGHT,
            letterSpacing: size * HEADLINE_TRACKING,
            whiteSpace: 'pre',
            color:
              segment.style === 'box'
                ? palette.boxText
                : segment.style === 'accent'
                  ? palette.accent
                  : color,
            ...(segment.style === 'box'
              ? { backgroundColor: palette.box, padding: `0 ${Math.round(size * BOX_PAD)}px` }
              : {}),
          }}
        >
          {segment.text}
        </div>
      ))}
    </div>
  );
}

export function Headline({
  palette,
  text,
  size,
  color,
  align = 'flex-start',
}: {
  palette: Palette;
  text: string;
  size: number;
  color: string;
  align?: 'flex-start' | 'center';
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        gap: Math.round(size * HEADLINE_LINE_GAP),
      }}
    >
      {text
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0)
        .map((line, index) => (
          <MarkedLine
            key={index}
            palette={palette}
            text={line}
            size={size}
            weight={HEADLINE_WEIGHT}
            color={color}
          />
        ))}
    </div>
  );
}

function Chip({
  palette,
  children,
  size,
  pill = false,
  width,
}: {
  palette: Palette;
  children: ReactNode;
  size: number;
  /** 알약 모양(탭 시안). */
  pill?: boolean;
  width?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignSelf: pill ? 'center' : 'flex-start',
        justifyContent: 'center',
        flexShrink: 0,
        ...(width ? { width } : {}),
        backgroundColor: palette.chip,
        color: palette.chipText,
        fontSize: size,
        fontWeight: CHIP_WEIGHT,
        lineHeight: 1,
        letterSpacing: -size * 0.01,
        whiteSpace: 'nowrap',
        // 폭이 정해진 칩(2칸 배치)은 가운데 정렬로 충분해 양옆 여백을 줄인다.
        padding: `${Math.round(size * 0.3)}px ${Math.round(size * (width ? 0.4 : pill ? 0.9 : 0.56))}px`,
        borderRadius: pill ? 999 : Math.round(size * 0.36),
      }}
    >
      {children}
    </div>
  );
}

function visibleSections(sections: CardSection[]) {
  return sections
    .map((section) => ({
      label: section.label,
      items: section.items.filter((item) => item.trim()),
    }))
    .filter((section) => section.items.length > 0);
}

function Bullet({
  item,
  size,
  width,
  color,
  align = 'left',
}: {
  item: string;
  size: number;
  width: number;
  color: string;
  align?: 'left' | 'center';
}) {
  const text: CSSProperties = {
    fontSize: size,
    fontWeight: BODY_WEIGHT,
    lineHeight: BODY_LINE_HEIGHT,
    letterSpacing: -size * 0.01,
    color,
  };
  if (align === 'center') {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', width, textAlign: 'center', ...text }}
      >
        {`• ${item}`}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', width, ...text }}>
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
      <div style={{ display: 'flex', width: width - BULLET_INDENT }}>{item}</div>
    </div>
  );
}

/** 탭 시안 1장의 목록 테두리 두께와 안쪽 여백. 렌더와 높이 계산이 같이 쓴다. */
export const BOXED_BORDER = 4;
export const BOXED_PAD_X = 32;
export const BOXED_PAD_Y = 20;
/** 탭 시안 2장의 칩 칸 폭과 칩·목록 사이. */
export const COLUMN_CHIP_WIDTH = 230;
/** `labels` 배치의 항목명 칸 폭. 칩 여백이 없어 칩 칸보다 좁다. */
export const LABEL_WIDTH = 170;
export const COLUMN_GAP = 28;

/**
 * 칩과 점 목록 묶음, 그리고 맨 아래 작은 안내.
 *
 * - `list`: 칩 아래 왼쪽 정렬 목록(기본).
 * - `boxed`: 가운데 알약 칩 아래 테두리 상자, 항목 가운데 정렬(탭 시안 1장).
 * - `columns`: 왼쪽 알약 칩, 오른쪽 목록 두 칸(탭 시안 2장).
 * - `labels`: `columns` 와 같되 칩 대신 굵은 항목명(LG생활건강형 2장).
 *
 * `metrics.contentWidth` 는 `list`·`columns` 에서 목록 폭, `boxed` 에서 상자 안 글자 폭에
 * `BULLET_INDENT` 를 더한 값이다(높이 계산이 그 폭에서 들여쓰기를 빼고 줄 수를 센다).
 *
 * 섹션(`section-<n>`), 그 안의 칩과 목록, 안내(`note`)를 따로 감싼다. 감싼 상자가 배치를 바꾸지 않게
 * 묶음 상자는 세로 배치로 안을 늘이고, 칩 상자는 칩이 놓이던 정렬을 물려받는다.
 */
export function Sections({
  palette,
  sections,
  note,
  metrics,
  mode = 'list',
  edits,
}: {
  palette: Palette;
  sections: CardSection[];
  note: string;
  metrics: SlideMetrics;
  mode?: 'list' | 'boxed' | 'columns' | 'labels';
  edits: SlideEdits | undefined;
}) {
  const { bodySize: size, contentWidth } = metrics;
  const visible = visibleSections(sections);
  const itemWidth = contentWidth - BULLET_INDENT;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: mode === 'boxed' ? 'center' : 'flex-start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: metrics.sectionGap }}>
        {visible.map((section, sectionIndex) => {
          const number = sectionIndex + 1;
          const chip = section.label.trim() ? (
            <Editable
              id={sectionElementId(number, 'chip')}
              edits={edits}
              style={{ alignSelf: mode === 'list' ? 'flex-start' : 'center', flexShrink: 0 }}
            >
              <Chip
                palette={palette}
                size={metrics.chipSize}
                pill={mode !== 'list'}
                width={mode === 'columns' ? COLUMN_CHIP_WIDTH : undefined}
              >
                {section.label}
              </Chip>
            </Editable>
          ) : null;
          const list = (children: ReactNode) => (
            <Editable
              id={sectionElementId(number, 'list')}
              edits={edits}
              style={{ flexDirection: 'column' }}
            >
              {children}
            </Editable>
          );
          if (mode === 'columns' || mode === 'labels') {
            const label =
              mode === 'labels' ? (
                <Editable
                  id={sectionElementId(number, 'chip')}
                  edits={edits}
                  style={{ flexShrink: 0 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: LABEL_WIDTH,
                      flexShrink: 0,
                      fontSize: Math.round(metrics.chipSize * 1.08),
                      fontWeight: 800,
                      lineHeight: BODY_LINE_HEIGHT,
                      letterSpacing: -metrics.chipSize * 0.02,
                      color: palette.bodyText,
                    }}
                  >
                    {section.label}
                  </div>
                </Editable>
              ) : (
                chip
              );
            return (
              <Editable
                key={sectionIndex}
                id={sectionElementId(number)}
                edits={edits}
                style={{ flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', gap: COLUMN_GAP, alignItems: 'flex-start' }}>
                  {label ?? <div style={{ display: 'flex', width: COLUMN_CHIP_WIDTH }} />}
                  {list(
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {section.items.map((item, index) => (
                        <Bullet
                          key={index}
                          item={item}
                          size={size}
                          width={contentWidth}
                          color={palette.bodyText}
                        />
                      ))}
                    </div>,
                  )}
                </div>
              </Editable>
            );
          }
          if (mode === 'boxed') {
            return (
              <Editable
                key={sectionIndex}
                id={sectionElementId(number)}
                edits={edits}
                style={{ flexDirection: 'column' }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: metrics.chipGap,
                  }}
                >
                  {chip}
                  {list(
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        border: `${BOXED_BORDER}px solid ${palette.border}`,
                        borderRadius: 28,
                        padding: `${BOXED_PAD_Y}px ${BOXED_PAD_X}px`,
                      }}
                    >
                      {section.items.map((item, index) => (
                        <Bullet
                          key={index}
                          item={item}
                          size={size}
                          width={itemWidth}
                          color={palette.bodyText}
                          align="center"
                        />
                      ))}
                    </div>,
                  )}
                </div>
              </Editable>
            );
          }
          return (
            <Editable
              key={sectionIndex}
              id={sectionElementId(number)}
              edits={edits}
              style={{ flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: metrics.chipGap }}>
                {chip}
                {list(
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {section.items.map((item, index) => (
                      <Bullet
                        key={index}
                        item={item}
                        size={size}
                        width={contentWidth}
                        color={palette.bodyText}
                      />
                    ))}
                  </div>,
                )}
              </div>
            </Editable>
          );
        })}
      </div>
      {note.trim() ? (
        <Editable
          id="note"
          edits={edits}
          style={{ flexDirection: 'column', marginTop: metrics.chipGap }}
        >
          {note.split('\n').map((line, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                width: contentWidth,
                fontSize: Math.round(size * NOTE_SCALE),
                fontWeight: 500,
                lineHeight: 1.5,
                color: palette.bodyText,
                opacity: 0.85,
              }}
            >
              {line}
            </div>
          ))}
        </Editable>
      ) : null}
    </div>
  );
}

/** 기업 로고. 로고가 없으면 회사명을 글자로. `size` 는 로고 상자의 최대 높이다. */
export function CompanyLogo({
  spec,
  palette,
  height = 104,
  maxWidth = 380,
}: {
  spec: CardSpec;
  palette: Palette;
  height?: number;
  maxWidth?: number;
}) {
  const { logo } = spec;
  const source =
    palette.logo === 'white'
      ? (logo?.white ?? logo?.original)
      : palette.logo === 'black'
        ? (logo?.black ?? logo?.original)
        : logo?.original;
  if (!source) {
    return (
      <div
        style={{
          display: 'flex',
          fontSize: Math.round(height * 0.5),
          fontWeight: 900,
          letterSpacing: -1.5,
          color: palette.headlineText,
        }}
      >
        {spec.companyName}
      </div>
    );
  }
  const plate = palette.logo === 'plate';
  const boxWidth = plate ? maxWidth - 52 : maxWidth;
  const boxHeight = plate ? height - 28 : height;
  // 비율을 알면 상자에 맞춘 크기를 직접 정한다. 이미지 생성기는 maxWidth·maxHeight 만 주면 그 상자를
  // 통째로 잡아, 흰 판 양옆에 빈 자리가 크게 남는다.
  const aspect = logo?.aspect;
  const fitted = aspect
    ? aspect > boxWidth / boxHeight
      ? { width: boxWidth, height: Math.round(boxWidth / aspect) }
      : { width: Math.round(boxHeight * aspect), height: boxHeight }
    : null;
  const image = fitted ? (
    <img src={source} alt="" width={fitted.width} height={fitted.height} />
  ) : (
    <img
      src={source}
      alt=""
      style={{ maxWidth: boxWidth, maxHeight: boxHeight, objectFit: 'contain' }}
    />
  );
  return plate ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '14px 26px',
        borderRadius: 20,
      }}
    >
      {image}
    </div>
  ) : (
    image
  );
}

/** 렛츠커리어 심볼과 `LETS CAREER` 글자. */
export function LetsCareer({
  palette,
  assets,
  size = 72,
}: {
  palette: Palette;
  assets: SlideAssets;
  size?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.2) }}>
      <img
        src={palette.mark === 'white' ? assets.markWhite : assets.markColor}
        alt=""
        width={size}
        height={size}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: Math.round(size * 0.44),
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: 0.5,
          color: palette.markText,
        }}
      >
        <div style={{ display: 'flex' }}>LETS</div>
        <div style={{ display: 'flex' }}>CAREER</div>
      </div>
    </div>
  );
}

/** 오공고 심볼의 가로÷세로(`assets/brand/ogonggo.svg` 52x25). */
const OGONGGO_ASPECT = 52 / 25;

/**
 * 우리 로고. 오공고는 심볼 옆에 `오공고` 글자를 둔다 — 렛츠커리어의 심볼과 `LETS CAREER` 글자에
 * 맞춘 모양이다. 어두운 바탕은 흰 심볼에 흰 글자다. `size` 는 렛츠커리어 심볼 크기 기준이다.
 */
export function BrandMark({
  brand = 'ogonggo',
  palette,
  assets,
  size = 72,
}: {
  brand?: BrandMarkId;
  palette: Palette;
  assets: SlideAssets;
  size?: number;
}) {
  if (brand === 'letscareer') {
    return <LetsCareer palette={palette} assets={assets} size={size} />;
  }
  const height = Math.round(size * 0.6);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.2) }}>
      <img
        src={palette.mark === 'white' ? assets.ogonggoWhite : assets.ogonggoLogo}
        alt=""
        width={Math.round(height * OGONGGO_ASPECT)}
        height={height}
      />
      <div
        style={{
          display: 'flex',
          fontSize: Math.round(size * 0.62),
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: -size * 0.01,
          color: palette.markText,
        }}
      >
        오공고
      </div>
    </div>
  );
}

/** 뱃지와 오른쪽 로고 한 줄. 도형 시안은 오른쪽에 렛츠커리어를 둔다(회사 로고는 프레임 안에). */
export function Header({
  spec,
  palette,
  assets,
  width,
  edits,
  right,
}: {
  spec: CardSpec;
  palette: Palette;
  assets: SlideAssets;
  width: number;
  edits: SlideEdits | undefined;
  right: ReactNode;
}) {
  // 예전 편집본은 뱃지 끝에 확성기 이모지가 붙어 있다. 아이콘을 따로 그리므로 뗀다.
  const trimmed = spec.content.badge.trimEnd();
  const badge = trimmed.endsWith('📢') ? trimmed.slice(0, -'📢'.length).trimEnd() : trimmed;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: HEADER_HEIGHT,
        width,
      }}
    >
      <Editable id="badge" edits={edits}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: palette.badge,
            color: palette.badgeText,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: -0.5,
            padding: '12px 28px',
            borderRadius: 999,
            border: `2px solid ${palette.badgeText === '#FFFFFF' ? palette.badge : '#111111'}`,
          }}
        >
          {badge}
          <Icon
            src={palette.badgeText === '#FFFFFF' ? assets.speakerLight : assets.speakerDark}
            size={32}
          />
        </div>
      </Editable>
      {right}
    </div>
  );
}
