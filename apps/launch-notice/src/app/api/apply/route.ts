import { MODE_LABEL, hasErrors, validateApply, type ApplyPayload } from '@/lib/apply';

/**
 * 신청서를 받아 구글 앱스 스크립트 웹앱으로 넘긴다. 그쪽이 스프레드시트에 행을 더한다
 * (`docs/apps-script.gs`).
 *
 * **브라우저가 웹앱으로 직접 쏘지 않는 이유가 여기다.** 그 주소는 그 자체가 열쇠라 프런트
 * 번들에 넣으면 누구나 남의 시트에 행을 넣을 수 있다. 이 자리를 한 번 거치면 주소와 비밀이
 * 서버 환경변수에만 남는다.
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
    console.error('[신청] LAUNCH_NOTICE_SHEET_WEBHOOK_URL 이 없습니다. 저장하지 못했습니다.');
    return Response.json(
      { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }

  // 시트의 열 순서와 이름이 여기서 정해진다. 앱스 스크립트는 이 키들을 그대로 행으로 옮긴다
  // (`docs/apps-script.gs` 의 `HEADERS`). 키를 바꾸면 그쪽도 같이 바꾼다.
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
    // 앱스 스크립트 웹앱은 `/exec` 로 요청하면 `script.googleusercontent.com` 으로
    // 302 를 준다. `fetch` 는 기본으로 따라가므로 그대로 두면 되지만, 따라간 뒤의 응답이
    // 진짜 결과다 — 302 자체를 성공으로 읽지 않도록 아래에서 본문까지 확인한다.
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      redirect: 'follow',
      // 앱스 스크립트는 가끔 몇 초씩 걸린다. 그렇다고 무한정 기다리면 요청이 쌓이므로 끊는다.
      signal: AbortSignal.timeout(15_000),
    });

    const text = await response.text();

    if (!response.ok) {
      // 앱스 스크립트가 실패하면 JSON 이 아니라 HTML 오류 페이지를 준다. 앞부분만 남겨도
      // "권한 승인 안 됨"인지 "배포 없음"인지 구분이 된다.
      console.error(
        `[신청] 웹훅이 ${response.status} 를 돌려줬습니다. 응답 앞부분: ${text.slice(0, 300)}`,
      );
      return Response.json(
        { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 },
      );
    }

    // 200 이어도 실패일 수 있다. 스크립트가 `{ok:false, where, message}` 를 돌려주는 경우와,
    // 배포 설정이 잘못돼 로그인 페이지 HTML 이 오는 경우가 그렇다. 둘 다 여기서 걸러야
    // 사용자에게 "접수됐다"고 거짓말하지 않는다.
    let result: { ok?: boolean; where?: string; message?: string };
    try {
      result = JSON.parse(text) as typeof result;
    } catch {
      console.error(
        `[신청] 웹훅이 JSON 이 아닌 응답을 줬습니다. 배포의 "액세스 권한"이 ` +
          `"모든 사용자"인지 확인하세요. 응답 앞부분: ${text.slice(0, 300)}`,
      );
      return Response.json(
        { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 },
      );
    }

    if (!result.ok) {
      console.error(
        `[신청] 스크립트가 실패를 알렸습니다. where=${result.where ?? '-'} message=${result.message ?? '-'}`,
      );
      return Response.json(
        { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error('[신청] 웹훅 호출에 실패했습니다.', error);
    return Response.json(
      { ok: false, message: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
