/**
 * 백엔드 enum 카탈로그(`GET /api/v1/enums`)의 선택지와 라벨.
 *
 * 카탈로그는 codegen 이 만든 정적 스냅숏(`./generated/enums.ts`)이다. 실행 중에 `/enums` 를 부르지
 * 않으므로 모두 동기 함수다. `ENUM_CATALOG` 는 이 파일 밖에서 직접 읽지 않는다.
 *
 * 어드민 전용 2개(`AdminContentSortType`, `AdminContentVisibility`)는 공개 카탈로그에 없어 여기서
 * 다루지 않는다. 어드민 코드가 따로 둔다.
 */
import { ENUM_CATALOG } from './generated/enums';

export type EnumName = keyof typeof ENUM_CATALOG;
export type EnumValue<K extends EnumName> = (typeof ENUM_CATALOG)[K][number]['name'];

type Option = { readonly name: string; readonly desc: string; readonly parent: string | null };

// 모듈을 처음 읽을 때 한 번 만든다. 조회는 객체 접근이다.
const LABELS = {} as Record<EnumName, Record<string, string>>;
const PARENTS = {} as Record<EnumName, Record<string, string>>;
for (const [name, options] of Object.entries(ENUM_CATALOG) as [EnumName, readonly Option[]][]) {
  const labels: Record<string, string> = {};
  const parents: Record<string, string> = {};
  for (const option of options) {
    labels[option.name] = option.desc;
    if (option.parent !== null) parents[option.name] = option.parent;
  }
  LABELS[name] = labels;
  PARENTS[name] = parents;
}

function optionsOf(name: EnumName): readonly Option[] {
  return ENUM_CATALOG[name];
}

/** 선언 순서의 선택지. */
export function enumOptions<K extends EnumName>(name: K): { value: EnumValue<K>; label: string }[] {
  return optionsOf(name).map((option) => ({
    value: option.name as EnumValue<K>,
    label: option.desc,
  }));
}

/** 값의 라벨. 카탈로그에 없는 값이면 값 그대로 돌려준다. */
export function enumLabel<K extends EnumName>(name: K, value: string): string {
  return LABELS[name][value] ?? value;
}

/** 값 → 라벨 맵. 기존 `Record<Enum, string>` 상수를 대신한다. 키 순서는 선언 순서다. */
export function enumLabels<K extends EnumName>(name: K): Record<EnumValue<K>, string> {
  return { ...LABELS[name] } as Record<EnumValue<K>, string>;
}

/** 상위 값이 같은 값들(직군 → 직무, 시·도 → 시·군·구). 선언 순서다. */
export function enumChildren<K extends EnumName>(name: K, parent: string): EnumValue<K>[] {
  return optionsOf(name)
    .filter((option) => option.parent === parent)
    .map((option) => option.name as EnumValue<K>);
}

/** 상위 값(직무 → 직군). 없으면 undefined. */
export function enumParent<K extends EnumName>(name: K, value: string): string | undefined {
  return PARENTS[name][value];
}

/**
 * 본문 칸 이름(camelCase, 응답 필드)의 라벨. `companyAndTeamIntroduction` 을
 * `COMPANY_AND_TEAM_INTRODUCTION` 으로 바꿔 찾는다. 없으면 칸 이름 그대로다.
 */
export function contentFieldLabel(
  name: 'JobContentField' | 'BootcampContentField',
  field: string,
): string {
  return LABELS[name][field.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()] ?? field;
}
