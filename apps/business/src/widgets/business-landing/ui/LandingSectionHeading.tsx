export interface LandingSectionHeadingProps {
  /** 제목 위 작은 파란 글자. */
  eyebrow: string;
  /** 줄바꿈은 `\n` 으로 넣는다. */
  title: string;
  description?: string;
}

/** 랜딩 섹션 머리. 섹션마다 같은 크기·간격을 쓴다. */
export function LandingSectionHeading({ eyebrow, title, description }: LandingSectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-blue-500">{eyebrow}</p>
      <h2 className="text-2xl leading-snug font-bold whitespace-pre-line text-gray-950 md:text-4xl md:leading-snug">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
