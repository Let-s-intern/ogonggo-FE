import { MODE_LABEL, hasErrors, validateApply, type ApplyPayload } from '@/lib/apply';

/**
 * 신청서를 받아 구글 스프레드시트로 넘긴다.
 *
 * **브라우저가 시트로 직접 쏘지 않는 이유가 여기다.** 앱스 스크립트 웹앱 주소는 그 자체가
 * 열쇠라, 프런트 번들에 넣으면 누구나 남의 시트에 행을 넣을 수 있다. 이 자리를 한 번 거치면
 * 주소와 비밀이 서버 환경변수에만 남는다.
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

  const webhookUrl = process.env.LAUNCH_NOTICE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    // 환경변수를 안 넣고 배포한 경우다. 사용자에게는 일반적인 실패로 보이지만 서버 로그에는
    // 원인이 남아야 한다 — 이게 없으면 "왜 시트가 비어 있지"를 한참 찾는다.
    console.error('LAUNCH_NOTICE_SHEET_WEBHOOK_URL 이 없습니다. 신청을 저장하지 못했습니다.');
    return Response.json(
      { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }

  // 시트의 열 순서와 이름이 여기서 정해진다. 앱스 스크립트는 이 키들을 그대로 행으로 옮긴다
  // (`docs/apps-script.gs`). 키를 바꾸면 그쪽 `HEADERS` 도 같이 바꿔야 한다.
  const row = {
    secret: process.env.LAUNCH_NOTICE_SHEET_SECRET ?? '',
    submittedAt: new Date().toISOString(),
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
    marketing: payload.marketing ? 'Y' : 'N',
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      // 앱스 스크립트는 가끔 몇 초씩 걸린다. 그렇다고 무한정 기다리면 요청이 쌓이므로 끊는다.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`시트 웹훅이 ${response.status} 를 돌려줬습니다.`);
      return Response.json(
        { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error('시트 웹훅 호출에 실패했습니다.', error);
    return Response.json(
      { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
