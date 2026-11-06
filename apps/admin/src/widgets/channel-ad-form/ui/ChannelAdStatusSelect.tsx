import { Select } from '@ogonggo/ui';
import { CHANNEL_AD_STATUSES, type ChannelAdStatus } from '@ogonggo/api/src/ad-channels';
import { usePatchChannelAd, type ChannelAd } from '@/entities/ad-channel/api/useAdChannels';
import { CHANNEL_AD_STATUS_BADGES, PLATFORM_COPY } from '@/entities/ad-channel/lib/adChannel';

/**
 * 표에서 바로 바꾸는 상태(이슈 #573). 고르는 순간 저장한다. 클릭이 행의 수정 모달까지 가지 않게 멈춘다. 게시 완료로 바꿨는데
 * 게시 확인 주소가 없으면 알림으로 적게 이끈다. 오픈채팅은 글 주소가 없어 확인 링크가 있으면 적어 달라고만 한다.
 */
export function ChannelAdStatusSelect({
  ad,
  notify,
}: {
  ad: ChannelAd;
  notify: (message: string) => void;
}) {
  const patch = usePatchChannelAd(ad.id);
  return (
    <span className="block w-28" onClick={(event) => event.stopPropagation()}>
      <Select
        aria-label={`${ad.advertiser?.name ?? '광고'} ${ad.postDate} 상태`}
        options={CHANNEL_AD_STATUSES.map((value) => ({
          value,
          label: CHANNEL_AD_STATUS_BADGES[value].label,
        }))}
        value={ad.status}
        disabled={patch.isPending}
        onChange={(event) => {
          const status = event.target.value as ChannelAdStatus;
          const missingUrl =
            ad.platform === 'INSTAGRAM'
              ? '게시 완료로 바꿨습니다. 게시물 주소를 적어 주세요.'
              : `게시 완료로 바꿨습니다. ${PLATFORM_COPY[ad.platform].postUrlLabel}가 있으면 적어 주세요.`;
          patch.mutate(
            { status },
            {
              onSuccess: () =>
                notify(
                  status === 'PUBLISHED' && !ad.postUrl
                    ? missingUrl
                    : `상태를 ${CHANNEL_AD_STATUS_BADGES[status].label}(으)로 바꿨습니다.`,
                ),
              onError: () => notify('상태를 바꾸지 못했습니다.'),
            },
          );
        }}
      />
    </span>
  );
}
