/**
 * enum 카탈로그 스냅숏(`./generated/enums.ts`)과 orval 생성 타입의 값 집합이 같은지 타입 수준에서
 * 확인한다. 한쪽만 다시 받으면 `pnpm type-check` 가 여기서 실패한다. 실행되는 코드가 아니다.
 *
 * FE 가 라벨이나 선택지를 쓰는 enum 은 모두 단언한다. 같은 값 집합을 가진 생성 타입은 여럿이고
 * 그중 하나와 짝짓는다.
 */
import type * as Admin from './generated/admin/models';
import type * as User from './generated/user/models';
import type { EnumValue } from './enums';
import type { BOOTCAMP_CONTENT_FIELDS, JOB_CONTENT_FIELDS } from './mocks/admin/content';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** camelCase → UPPER_SNAKE (`companyAndTeamIntroduction` → `COMPANY_AND_TEAM_INTRODUCTION`). */
type UpperSnake<S extends string> = S extends `${infer H}${infer T}`
  ? `${H extends Uppercase<H> ? '_' : ''}${Uppercase<H>}${UpperSnake<T>}`
  : '';

export const enumCatalogAssertions: true[] = [
  {} as Equal<EnumValue<'JobEmploymentType'>, User.ListPublicJobsEmploymentType>,
  {} as Equal<EnumValue<'JobExperienceType'>, User.ListPublicJobsExperienceType>,
  {} as Equal<EnumValue<'JobEducationLevel'>, User.UserJobDetailResponseEducationLevel>,
  {} as Equal<EnumValue<'JobRecruitmentType'>, User.UserJobDetailResponseRecruitmentType>,
  {} as Equal<EnumValue<'BootcampRecruitmentType'>, User.UserJobDetailResponseRecruitmentType>,
  {} as Equal<EnumValue<'JobRecruitmentStatus'>, User.ListPublicJobsRecruitmentStatus>,
  {} as Equal<EnumValue<'RecruitmentPostRecruitmentStatus'>, User.ListPublicJobsRecruitmentStatus>,
  {} as Equal<EnumValue<'BootcampRecruitmentStatus'>, User.UserBootcampDetailResponseStatus>,
  {} as Equal<EnumValue<'BootcampRecruitmentStatus'>, Admin.ListBootcampsStatus>,
  {} as Equal<EnumValue<'JobApplicationMethod'>, User.UpdateCompanyJobRequestApplicationMethod>,
  {} as Equal<
    EnumValue<'BootcampApplicationMethod'>,
    User.UpdateCompanyJobRequestApplicationMethod
  >,
  {} as Equal<EnumValue<'JobApplicationStatus'>, User.ListMyJobBookmarksApplicationStatus>,
  {} as Equal<
    EnumValue<'BootcampApplicationStatus'>,
    User.ListMyBootcampBookmarksApplicationStatus
  >,
  {} as Equal<EnumValue<'JobPublicationStatus'>, User.CompanyJobDetailResponsePublicationStatus>,
  {} as Equal<
    EnumValue<'BootcampPublicationStatus'>,
    User.CompanyJobDetailResponsePublicationStatus
  >,
  {} as Equal<
    EnumValue<'RecruitmentPostPublicationStatus'>,
    User.CompanyJobDetailResponsePublicationStatus
  >,
  {} as Equal<EnumValue<'JobSortType'>, User.ListPublicJobsSort>,
  {} as Equal<EnumValue<'BootcampSortType'>, User.ListPublicJobsSort>,
  {} as Equal<EnumValue<'JobField'>, User.ListPublicJobsJobField>,
  {} as Equal<EnumValue<'JobField'>, Admin.ListJobsJobField>,
  {} as Equal<EnumValue<'JobRole'>, User.ListPublicJobsJobRoleItem>,
  {} as Equal<EnumValue<'JobRole'>, Admin.ListJobsJobRoleItem>,
  {} as Equal<EnumValue<'Region'>, User.ListPublicJobsRegion>,
  {} as Equal<EnumValue<'BootcampOperationType'>, User.GetRecruitmentPostsProgressMethodsItem>,
  {} as Equal<
    EnumValue<'RecruitmentPostProgressMethod'>,
    User.GetRecruitmentPostsProgressMethodsItem
  >,
  {} as Equal<EnumValue<'BootcampTuitionType'>, User.UserBootcampDetailResponseTuitionType>,
  {} as Equal<EnumValue<'BootcampCategory'>, User.ListPublicBootcampsCategory>,
  {} as Equal<EnumValue<'ContentReviewTargetType'>, Admin.ListContentRejectionsType>,
  {} as Equal<EnumValue<'ContentReviewStatus'>, User.CompanyJobDetailResponseReviewStatus>,
  {} as Equal<EnumValue<'ContentReviewStatus'>, Admin.ListJobsReviewStatus>,
  {} as Equal<EnumValue<'ContentSource'>, Admin.ListJobsSource>,
  {} as Equal<
    EnumValue<'LetsCareerContentKind'>,
    User.UserRecommendedLetsCareerContentResponseKind
  >,
  {} as Equal<EnumValue<'BookmarkSortType'>, User.ListMyJobBookmarksSort>,
  {} as Equal<EnumValue<'RecruitmentPostType'>, User.ListMyRecruitmentPostsRecruitmentType>,
  {} as Equal<EnumValue<'RecruitmentPostType'>, Admin.ListRecruitmentPostsRecruitmentType>,
  {} as Equal<EnumValue<'RecruitmentPostPosition'>, User.GetRecruitmentPostsPositionsItem>,
  {} as Equal<
    EnumValue<'RecruitmentPostPosition'>,
    Admin.AdminRecruitmentPostSummaryResponsePositionsItem
  >,
  {} as Equal<EnumValue<'RecruitmentPostContactMethod'>, User.RecruitmentPostContactResponseMethod>,
  {} as Equal<EnumValue<'RecruitmentPostSortType'>, User.GetRecruitmentPostsSort>,
  {} as Equal<
    EnumValue<'RecruitmentPostApplicantPresence'>,
    User.ListMyRecruitmentPostsApplicationStatus
  >,
  {} as Equal<EnumValue<'RecruitmentPostManagementSortType'>, User.ListMyRecruitmentPostsSort>,
  {} as Equal<
    EnumValue<'RecruitmentPostApplicationProgressStatus'>,
    User.ListMyRecruitmentPostApplicationsApplicationStatus
  >,
  {} as Equal<
    EnumValue<'RecruitmentPostApplicationSortType'>,
    User.ListMyRecruitmentPostApplicationsSort
  >,
  {} as Equal<EnumValue<'ConcernCategory'>, User.SaveConcernRequestCategory>,
  {} as Equal<EnumValue<'ConcernCategory'>, Admin.ListConcernsCategory>,
  {} as Equal<EnumValue<'ConcernSortType'>, User.ListPublicConcernsSort>,
  {} as Equal<EnumValue<'UserRole'>, User.MyAccountResponseRole>,
  {} as Equal<EnumValue<'UserRole'>, Admin.ListGeneralMembersRole>,
  {} as Equal<EnumValue<'UserStatus'>, User.MyAccountResponseStatus>,
  {} as Equal<EnumValue<'UserStatus'>, Admin.ListGeneralMembersStatus>,
  {} as Equal<EnumValue<'UserInflowSource'>, Admin.ListGeneralMembersInflowSource>,
  {} as Equal<EnumValue<'UserGrade'>, User.MyProfileResponseGrade>,
  {} as Equal<EnumValue<'UserGrade'>, Admin.AdminGeneralMemberResponseGrade>,
  {} as Equal<EnumValue<'LetsCareerAuthProvider'>, User.MyProfileResponseAuthProvider>,
  {} as Equal<
    EnumValue<'AdvertisementInquiryPromotionChannel'>,
    User.CreateAdvertisementInquiryRequestPromotionChannel
  >,
  {} as Equal<EnumValue<'CompanyBusinessNumberType'>, User.CompanySignUpRequestBusinessNumberType>,
  {} as Equal<EnumValue<'CompanyType'>, User.CompanySignUpRequestCompanyType>,
  {} as Equal<EnumValue<'CompanyEmployeeCountRange'>, User.CompanySignUpRequestEmployeeCountRange>,
  {} as Equal<EnumValue<'CompanyManagerDuty'>, User.CompanySignUpRequestManagerDuty>,
  // 본문 칸은 생성 타입이 없다(응답은 camelCase 필드). `contentFieldLabel` 이 칸 이름을 바꿔 찾는
  // 값이 카탈로그와 같은지 본다. 채용공고 일곱 칸, 부트캠프 두 칸.
  {} as Equal<UpperSnake<(typeof JOB_CONTENT_FIELDS)[number]>, EnumValue<'JobContentField'>>,
  {} as Equal<
    UpperSnake<(typeof BOOTCAMP_CONTENT_FIELDS)[number]>,
    EnumValue<'BootcampContentField'>
  >,
];
