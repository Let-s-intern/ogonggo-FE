import { Select } from '@ogonggo/ui';
import { INSTAGRAM_AD_STATUSES, type InstagramAdStatus } from '@ogonggo/api/src/instagram';
import { usePatchInstagramAd, type InstagramAd } from '@/entities/instagram/api/useInstagram';
import { INSTAGRAM_AD_STATUS_BADGES } from '@/entities/instagram/lib/instagram';

/**
 * 표에서 바로 바꾸는 상태(이슈 #573). 고르는 순간 저장한다. 클릭이 행의 수정 모달까지 가지 않게 멈춘다. 게시 완료로 바꿨는데
 * 게시물 주소가 없으면 알림으로 적게 이끈다.
 */
export function InstagramAdStatusSelect({
  ad,
  notify,
}: {
  ad: InstagramAd;
  notify: (message: string) => void;
}) {
  const patch = usePatchInstagramAd(ad.id);
  return (
    <span className="block w-28" onClick={(event) => event.stopPropagation()}>
      <Select
        aria-label={`${ad.advertiser?.name ?? '광고'} ${ad.postDate} 상태`}
        options={INSTAGRAM_AD_STATUSES.map((value) => ({
          value,
          label: INSTAGRAM_AD_STATUS_BADGES[value].label,
        }))}
        value={ad.status}
        disabled={patch.isPending}
        onChange={(event) => {
          const status = event.target.value as InstagramAdStatus;
          patch.mutate(
            { status },
            {
              onSuccess: () =>
                notify(
                  status === 'PUBLISHED' && !ad.postUrl
                    ? '게시 완료로 바꿨습니다. 게시물 주소를 적어 주세요.'
                    : `상태를 ${INSTAGRAM_AD_STATUS_BADGES[status].label}(으)로 바꿨습니다.`,
                ),
              onError: () => notify('상태를 바꾸지 못했습니다.'),
            },
          );
        }}
      />
    </span>
  );
}
