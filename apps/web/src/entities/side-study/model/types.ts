/**
 * 사이드·스터디 타입만 `packages/api/src/generated/`가 아니라 목데이터 쪽에서 온다.
 * 백엔드에 엔드포인트도 엔티티도 없어 응답 형태가 계약이 아니라 가정이기 때문이다(PRD 5절) —
 * 그 가정을 적어 둔 곳이 `packages/api/src/mocks/fixtures/side-study.ts`다. 실제 API가 생기면
 * 그 파일이 사라지고 이 재노출만 생성 타입을 가리키게 바뀐다.
 *
 * 값이 아니라 타입만 가져오므로(`import type`) 픽스처 12건이 앱 번들에 들어가지는 않는다.
 */
import type {
  SideStudyDetail,
  SideStudyKind,
  SideStudyOperationType,
  SideStudySummary,
} from '@ogonggo/api/src/mocks/fixtures/side-study';

export type { SideStudyDetail, SideStudyKind, SideStudyOperationType, SideStudySummary };
