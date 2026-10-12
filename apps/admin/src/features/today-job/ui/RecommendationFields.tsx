import { Input, cn } from '@ogonggo/ui';
import {
  RECOMMENDATION_DESCRIPTION_MAX,
  RECOMMENDATION_TITLE_MAX,
  recommendationLength,
  validateRecommendation,
  type RecommendationValue,
} from '../lib/validate';

export interface RecommendationFieldsProps {
  value: RecommendationValue;
  onChange: (next: RecommendationValue) => void;
  /** 한 화면에 이 컴포넌트가 여럿일 때 라벨과 입력을 잇는 id 를 가른다. 행 id 를 넘긴다. */
  idPrefix: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 추천 제목과 추천 설명을 한 덩어리로 그린다. 값은 쓰는 쪽이 들고 있는 제어 컴포넌트다.
 *
 * 글자 수(`12/30`)와 실패 이유를 입력칸 바로 곁에 보인다. 한도를 넘기면 입력을 자르지 않고
 * 그대로 두고 표시한다 — `maxLength` 로 자르면 긴 문구를 붙여 넣었을 때 어디가 잘렸는지 알 수 없다.
 *
 * 저장을 막는 판단은 쓰는 쪽이 `validateRecommendation` 으로 한다. 이 컴포넌트는 보이기만 한다.
 */
export function RecommendationFields({
  value,
  onChange,
  idPrefix,
  disabled = false,
  className,
}: RecommendationFieldsProps) {
  const errors = validateRecommendation(value);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <TextRow
        id={`${idPrefix}-recommendation-title`}
        label="추천 제목"
        text={value.title}
        max={RECOMMENDATION_TITLE_MAX}
        error={errors.title}
        disabled={disabled}
        onChange={(title) => onChange({ ...value, title })}
      />
      <TextRow
        id={`${idPrefix}-recommendation-description`}
        label="추천 설명"
        text={value.description}
        max={RECOMMENDATION_DESCRIPTION_MAX}
        error={errors.description}
        disabled={disabled}
        onChange={(description) => onChange({ ...value, description })}
      />
    </div>
  );
}

interface TextRowProps {
  id: string;
  label: string;
  text: string;
  max: number;
  error: string | undefined;
  disabled: boolean;
  onChange: (text: string) => void;
}

function TextRow({ id, label, text, max, error, disabled, onChange }: TextRowProps) {
  const length = recommendationLength(text);
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="flex items-baseline justify-between pb-1">
        <label htmlFor={id} className="text-xs font-medium text-gray-500">
          {label}
        </label>
        <span
          className={cn(
            'text-xs [font-variant-numeric:tabular-nums]',
            length > max ? 'font-semibold text-error' : 'text-gray-400',
          )}
        >
          {length}/{max}
        </span>
      </div>
      <Input
        id={id}
        value={text}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-9 text-sm"
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={errorId} className="pt-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
