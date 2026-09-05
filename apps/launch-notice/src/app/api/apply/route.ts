import { MODE_LABEL, hasErrors, validateApply, type ApplyPayload } from '@/lib/apply';
import { saveApplication } from '@/lib/pocketbase';

/**
 * 신청서를 받아 포켓베이스에 저장한다(`lib/pocketbase.ts`).
 *
 * **브라우저가 포켓베이스로 직접 쏘지 않는 이유가 여기다.** 컬렉션 규칙을 슈퍼유저 전용으로
 * 잠가 두었고, 그 자격증명은 프런트 번들에 넣을 수 있는 물건이 아니다. 이 자리를 한 번
 * 거치면 주소와 비밀번호가 서버 환경변수에만 남는다.
 *
 * 서버 검증을 다시 하는 것도 같은 이유다. 폼을 거치지 않고 이 엔드포인트로 바로 POST 하는
 * 요청이 있으므로 클라이언트 검증은 사용자 편의일 뿐 관문이 아니다.
 */
export async function POST(request: Request) {
  let payload: ApplyPayload;
  try {
    payload = (await request.json()) as ApplyPayload;
  } catch {
    return Response.json({ ok: false, message: '잘못된 요청입니다.' }, { status: 400 });
  }

  // 허니팟. 사람에게는 보이지 않는 자리라 값이 차 있으면 자동 제출이다. 봇에게 실패를
  // 알려 주면 우회를 시도하므로 성공한 것처럼 200 을 돌려주고 조용히 버린다.
  if (payload.website) {
    return Response.json({ ok: true });
  }

  const errors = validateApply(payload);
  if (hasErrors(errors)) {
    return Response.json({ ok: false, errors }, { status: 400 });
  }

  // 필드 이름은 포켓베이스 컬렉션과 짝이다(`lib/pocketbase.ts` 의 `ApplicationRecord`).
  const record = {
    mode: MODE_LABEL[payload.mode],
    company: payload.company.trim(),
    name: payload.name.trim(),
    title: payload.title.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    channel: payload.channel?.trim() ?? '',
    role: payload.role?.trim() ?? '',
    link: payload.link?.trim() ?? '',
    survey: payload.survey.trim(),
    marketing: payload.marketing,
  };

  try {
    const result = await saveApplication(record);
    if (result === '설정되지 않음') {
      // 환경변수를 안 넣고 배포한 경우다. 사용자에게는 일반적인 실패로 보이지만 서버 로그에는
      // 원인이 남아야 한다 — 이게 없으면 "왜 신청이 안 쌓이지"를 한참 찾는다.
      console.error('[신청] POCKETBASE_* 환경변수가 없습니다. 저장하지 못했습니다.');
      return Response.json(
        { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('[신청] 포켓베이스 저장에 실패했습니다.', error);
    return Response.json(
      { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
