import type { CSSProperties, ReactNode } from 'react';
import { isDark } from './color';
import { CONTENT_WIDTH, PAD_X, type SlideMetrics } from './layout';
import { parseHeadline, parseLine } from './markup';
import type { CardSection, CardSize, CardSpec } from './types';

/**
 * 카드 한 장의 JSX. 이미지 생성기(satori)가 그린다 — 브라우저 CSS 가 아니라 flexbox 만 되는
 * 부분 집합이다. 모든 `div` 는 `display: flex` 이고, 줄바꿈이 필요한 글자는 폭이 정해진 상자에 둔다.
 */

export interface SlideAssets {
  letscareerMark: string;
  ogonggoLogo: string;
}

function Background({ spec, size }: { spec: CardSpec; size: CardSize }) {
  const { background } = spec.theme;
  const base: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: size.width,
    height: size.height,
    display: 'flex',
  };
  return (
    <div style={base}>
      <div
        style={{
          ...base,
          backgroundColor: background.color,
          ...(background.kind === 'gradient'
            ? {
                backgroundImage: `linear-gradient(180deg, ${background.color} 0%, ${background.color2} 100%)`,
              }
            : {}),
        }}
      />
      {background.kind === 'image' && background.imageDataUrl ? (
        <img
          src={background.imageDataUrl}
          alt=""
          width={size.width}
          height={size.height}
          style={{ ...base, objectFit: 'cover', opacity: background.imageOpacity }}
        />
      ) : null}
    </div>
  );
}

function Headline({
  spec,
  text,
  size,
  align = 'flex-start',
}: {
  spec: CardSpec;
  text: string;
  size: number;
  align?: 'flex-start' | 'center';
}) {
  const { theme } = spec;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, gap: 14 }}>
      {parseHeadline(text).map((line, lineIndex) => (
        <div key={lineIndex} style={{ display: 'flex', alignItems: 'center' }}>
          {line.map((segment, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                fontSize: size,
                fontWeight: 900,
                lineHeight: 1.24,
                letterSpacing: -size * 0.03,
                whiteSpace: 'pre',
                color:
                  segment.style === 'box'
                    ? theme.boxTextColor
                    : segment.style === 'accent'
                      ? theme.accentColor
                      : theme.textColor,
                ...(segment.style === 'box'
                  ? { backgroundColor: theme.boxColor, padding: '0 10px' }
                  : {}),
              }}
            >
              {segment.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Chip({ spec, children, size }: { spec: CardSpec; children: ReactNode; size: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignSelf: 'flex-start',
        backgroundColor: spec.theme.boxColor,
        color: spec.theme.boxTextColor,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1,
        padding: `${Math.round(size * 0.32)}px ${Math.round(size * 0.62)}px`,
        borderRadius: Math.round(size * 0.42),
      }}
    >
      {children}
    </div>
  );
}

function Sections({
  spec,
  sections,
  size,
}: {
  spec: CardSpec;
  sections: CardSection[];
  size: number;
}) {
  // 항목이 없는 섹션은 칩도 그리지 않는다(우대 사항이 없는 공고).
  const visible = sections.filter((section) => section.items.some((item) => item.trim()));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {visible.map((section, sectionIndex) => (
        <div key={sectionIndex} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {section.label.trim() ? (
            <Chip spec={spec} size={size}>
              {section.label}
            </Chip>
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {section.items
              .filter((item) => item.trim())
              .map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    width: CONTENT_WIDTH,
                    fontSize: size,
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: spec.theme.textColor,
                  }}
                >
                  <div style={{ display: 'flex', width: 40, flexShrink: 0, paddingLeft: 10 }}>
                    •
                  </div>
                  <div style={{ display: 'flex', width: CONTENT_WIDTH - 40 }}>{item}</div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompanyLogo({ spec }: { spec: CardSpec }) {
  if (spec.logoDataUrl) {
    const logo = (
      <img
        src={spec.logoDataUrl}
        alt=""
        style={{
          maxWidth: spec.theme.logoPlate ? 300 : 340,
          maxHeight: spec.theme.logoPlate ? 80 : 110,
          objectFit: 'contain',
        }}
      />
    );
    return spec.theme.logoPlate ? (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '14px 26px',
          borderRadius: 24,
        }}
      >
        {logo}
      </div>
    ) : (
      logo
    );
  }
  return (
    <div style={{ display: 'flex', fontSize: 44, fontWeight: 900, color: spec.theme.textColor }}>
      {spec.companyName}
    </div>
  );
}

function Header({ spec }: { spec: CardSpec }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 110,
        width: CONTENT_WIDTH,
      }}
    >
      <div
        style={{
          display: 'flex',
          backgroundColor: '#111111',
          color: '#FFFFFF',
          fontSize: 30,
          fontWeight: 700,
          padding: '14px 28px',
          borderRadius: 999,
        }}
      >
        {spec.content.badge}
      </div>
      <CompanyLogo spec={spec} />
    </div>
  );
}

function Footer({ spec, assets }: { spec: CardSpec; assets: SlideAssets }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
      <img src={assets.letscareerMark} alt="" width={64} height={64} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 30,
          fontWeight: 800,
          lineHeight: 1.05,
          color: isDark(spec.theme.textColor) ? '#3F4A5C' : '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex' }}>LETS</div>
        <div style={{ display: 'flex' }}>CAREER</div>
      </div>
    </div>
  );
}

function Frame({
  spec,
  size,
  metrics,
  children,
  assets,
}: {
  spec: CardSpec;
  size: CardSize;
  metrics: Pick<SlideMetrics, 'padTop' | 'padBottom'>;
  children: ReactNode;
  assets: SlideAssets;
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
      <Background spec={spec} size={size} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: size.width,
          height: size.height,
          padding: `${metrics.padTop}px ${PAD_X}px ${metrics.padBottom}px`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        <Footer spec={spec} assets={assets} />
      </div>
    </div>
  );
}

export function InfoSlide({
  spec,
  size,
  metrics,
  sections,
  note,
  assets,
}: {
  spec: CardSpec;
  size: CardSize;
  metrics: SlideMetrics;
  sections: CardSection[];
  note: string;
  assets: SlideAssets;
}) {
  return (
    <Frame spec={spec} size={size} metrics={metrics} assets={assets}>
      <Header spec={spec} />
      <div style={{ display: 'flex', marginTop: 52 }}>
        <Headline spec={spec} text={spec.content.headline} size={metrics.headlineSize} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 56 }}>
        <Sections spec={spec} sections={sections} size={metrics.bodySize} />
        {note.trim() ? (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: -16 }}>
            {note.split('\n').map((line, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  width: CONTENT_WIDTH,
                  fontSize: Math.round(metrics.bodySize * 0.72),
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: spec.theme.textColor,
                  opacity: 0.85,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Frame>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 190 }}>
      <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: '#111111' }}>
        {value}
      </div>
      <div style={{ display: 'flex', fontSize: 34, fontWeight: 500, color: '#333333' }}>
        {label}
      </div>
    </div>
  );
}

function ProfileCard({ spec, assets }: { spec: CardSpec; assets: SlideAssets }) {
  const { profile } = spec.content;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 860,
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        padding: '34px 40px 38px',
        gap: 22,
        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, color: '#111111' }}>
        {profile.handle}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div
          style={{
            display: 'flex',
            width: 190,
            height: 190,
            borderRadius: 999,
            border: '2px solid #E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <img src={assets.ogonggoLogo} alt="" width={130} height={62} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, color: '#111111' }}>
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
              style={{ display: 'flex', fontSize: 32, fontWeight: 500, color: '#222222' }}
            >
              {line}
            </div>
          ))}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            backgroundColor: '#1D6BF3',
            color: '#FFFFFF',
            fontSize: 34,
            fontWeight: 600,
            padding: '18px 0',
            borderRadius: 18,
          }}
        >
          팔로우
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            backgroundColor: '#EFF0F3',
            color: '#111111',
            fontSize: 34,
            fontWeight: 600,
            padding: '18px 0',
            borderRadius: 18,
          }}
        >
          메시지
        </div>
      </div>
    </div>
  );
}

export function CtaSlide({
  spec,
  size,
  assets,
}: {
  spec: CardSpec;
  size: CardSize;
  assets: SlideAssets;
}) {
  const story = size.height > size.width * 1.5;
  const square = size.height <= size.width;
  // 정사각은 세로가 모자라 전체를 줄인다. 글자 크기를 하나씩 바꾸지 않고 묶음째 줄인다.
  const scale = square ? 0.78 : 1;
  const { theme } = spec;
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
      <Background spec={spec} size={size} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: story ? 'center' : 'flex-start',
          width: size.width,
          height: size.height,
          padding: `${square ? 48 : 72}px ${PAD_X + 30}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 92,
              fontWeight: 500,
              color: theme.textColor,
              lineHeight: 1,
            }}
          >
            ↑
          </div>
          <div style={{ display: 'flex', marginTop: 28 }}>
            <Headline spec={spec} text={spec.content.ctaHeadline} size={88} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 52,
              gap: 8,
            }}
          >
            {spec.content.ctaSub
              .split('\n')
              .filter((line) => line.trim())
              .map((line, index) => (
                <div key={index} style={{ display: 'flex' }}>
                  {parseLine(line).map((segment, segmentIndex) => (
                    <div
                      key={segmentIndex}
                      style={{
                        display: 'flex',
                        whiteSpace: 'pre',
                        fontSize: 46,
                        fontWeight: 800,
                        color: segment.style === 'box' ? theme.boxTextColor : theme.textColor,
                        ...(segment.style === 'box'
                          ? { backgroundColor: theme.boxColor, padding: '0 8px' }
                          : {}),
                      }}
                    >
                      {segment.text}
                    </div>
                  ))}
                </div>
              ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
            <ProfileCard spec={spec} assets={assets} />
          </div>
        </div>
      </div>
    </div>
  );
}
