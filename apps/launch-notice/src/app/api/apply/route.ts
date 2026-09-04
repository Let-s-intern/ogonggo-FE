import { MODE_LABEL, hasErrors, validateApply, type ApplyPayload } from '@/lib/apply';
import { appendRow } from '@/lib/sheets';

/**
 * `node:crypto` 로 JWT 에 서명하므로 Node 런타임이어야 한다(`lib/sheets.ts`).
 * 라우트 핸들러의 기본값이기도 하지만, 바뀌면 조용히 깨지는 자리라 적어 둔다.
 */
export const runtime = 'nodejs';

/**
 * 신청서를 받아 구글 스프레드시트에 행으로 더한다.
 *
 * **브라우저가 시트로 직접 쏘지 않는 이유가 여기다.** 시트에 쓰려면 서비스 계정 개인 키가
 * 필요한데, 그건 프런트 번들에 넣을 수 있는 물건이 아니다. 이 자리를 한 번 거치면 키가 서버
 * 환경변수에만 남는다.
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

  // 열 순서는 `lib/sheets.ts` 의 `HEADER_LABELS` 와 짝이다. 하나를 바꾸면 다른 하나도 바꾼다.
  const row = [
    new Date().toISOString(),
    MODE_LABEL[payload.mode],
    payload.company.trim(),
    payload.name.trim(),
    payload.title.trim(),
    payload.email.trim().toLowerCase(),
    payload.phone.trim(),
    payload.channel?.trim() ?? '',
    payload.role?.trim() ?? '',
    payload.link?.trim() ?? '',
    payload.survey.trim(),
    payload.marketing ? 'Y' : 'N',
  ];

  try {
    const result = await appendRow(row);
    if (result === '설정되지 않음') {
      // 환경변수를 안 넣고 배포한 경우다. 사용자에게는 일반적인 실패로 보이지만 서버 로그에는
      // 원인이 남아야 한다 — 이게 없으면 "왜 시트가 비어 있지"를 한참 찾는다.
      console.error(
        'GOOGLE_SERVICE_ACCOUNT_JSON 또는 LAUNCH_NOTICE_SHEET_ID 가 없습니다. 신청을 저장하지 못했습니다.',
      );
      return Response.json(
        { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('시트에 행을 더하지 못했습니다.', error);
    return Response.json(
      { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
