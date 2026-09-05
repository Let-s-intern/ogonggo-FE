/**
 * 무료 홍보 신청을 영업 슬랙 채널로 알린다.
 *
 * 백엔드의 `POST /api/v1/advertisement-inquiries` 를 부른다. 그쪽은 문의를 저장하지 않고
 * 슬랙으로 넘기기만 하므로(`200` + `data: null`), 이건 **알림이지 저장이 아니다.** 신청
 * 자체는 포켓베이스가 갖는다(`lib/pocketbase.ts`).
 *
 * **`무료 홍보 신청`일 때만 부른다**(2026-09-05 결정). `출시 알림만 받겠다`고 한 사람은
 * 런칭 전에 연락하면 되는 것이라 영업 채널을 울릴 일이 아니다. 백엔드 enum 에
 * `LAUNCH_ALERT` 가 있지만 쓰지 않는다.
 */

/** 백엔드 enum. 우리는 `FREE_PROMOTION` 만 보낸다. */
const INQUIRY_TYPE = 'FREE_PROMOTION';

export interface AdvertisementInquiry {
  companyName: string;
  managerName: string;
  email: string;
  phoneNumber: string;
  /** 설문 답변. 백엔드에서 필수 필드다. */
  promotionAnswer: string;
}

/**
 * 알림을 보낸다. **실패해도 던지지 않는다.**
 *
 * 신청은 이미 포켓베이스에 저장된 뒤라 데이터가 사라지지 않는다. 여기서 던지면 사용자에게
 * "접수 실패"가 뜨고 같은 사람이 다시 제출해 신청이 두 벌 쌓인다 — 슬랙 알림 하나 때문에
 * 치를 값이 아니다. 실패는 서버 로그에 남기고 어드민 화면에서 신청을 볼 수 있다.
 *
 * 백엔드는 슬랙 전달에 실패하면 503(`ADVERTISEMENT_INQUIRY_NOTIFICATION_FAILED`)을 준다.
 */
export async function notifyAdvertisementInquiry(inquiry: AdvertisementInquiry): Promise<void> {
  const origin = process.env.ADVERTISEMENT_INQUIRY_API_ORIGIN;
  if (!origin) {
    console.error('[신청] ADVERTISEMENT_INQUIRY_API_ORIGIN 이 없어 슬랙 알림을 건너뜁니다.');
    return;
  }

  try {
    const response = await fetch(`${origin.replace(/\/$/, '')}/api/v1/advertisement-inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...inquiry, inquiryType: INQUIRY_TYPE }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[신청] 슬랙 알림 실패 (${response.status}): ${body.slice(0, 300)} — 신청은 포켓베이스에 저장돼 있습니다.`,
      );
    }
  } catch (error) {
    console.error('[신청] 슬랙 알림 호출에 실패했습니다. 신청은 저장돼 있습니다.', error);
  }
}
