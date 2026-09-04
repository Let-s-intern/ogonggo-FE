/**
 * 출시 알림 신청을 구글 스프레드시트에 쌓는 앱스 스크립트.
 *
 * 이 코드는 저장소에서 실행되지 않는다. 아래 "설치" 순서대로 스프레드시트에 붙여 넣고 배포한
 * 뒤, 나오는 `/exec` 주소를 `apps/launch-notice` 의 `LAUNCH_NOTICE_SHEET_WEBHOOK_URL` 에 넣는다.
 * 여기 두는 이유는 이 파일이 없으면 나중에 시트가 어떻게 채워지는지 아무도 모르기 때문이다.
 *
 * 설치
 *   1. 신청을 받을 스프레드시트를 만든다
 *   2. 확장 프로그램 → Apps Script 를 열고 이 파일 내용을 통째로 붙여 넣는다
 *   3. `SHARED_SECRET` 을 아무도 모르는 문자열로 바꾼다
 *   4. 배포 → 새 배포 → 유형 "웹 앱"
 *      - 실행 사용자: 나
 *      - 액세스 권한: 모든 사용자
 *   5. 나온 `/exec` 주소와 3번의 문자열을 Vercel 환경변수에 넣는다
 *      LAUNCH_NOTICE_SHEET_WEBHOOK_URL / LAUNCH_NOTICE_SHEET_SECRET
 *
 * "모든 사용자" 로 열어야 하는 것은 우리 서버가 구글 로그인 없이 부르기 때문이다. 대신
 * `SHARED_SECRET` 이 맞지 않는 요청은 아무 일도 하지 않는다. 주소만으로는 행을 넣을 수 없다.
 */

var SHARED_SECRET = '여기를-바꾸세요';

/** 시트의 열 순서. `src/app/api/apply/route.ts` 가 보내는 키와 이름이 같아야 한다. */
var HEADERS = [
  'submittedAt',
  'mode',
  'company',
  'name',
  'title',
  'email',
  'phone',
  'channel',
  'role',
  'link',
  'survey',
  'marketing',
];

var HEADER_LABELS = [
  '신청 시각',
  '유형',
  '회사명',
  '담당자',
  '직함',
  '이메일',
  '연락처',
  '희망 채널',
  '채용 직무',
  '공고 링크',
  '설문 답변',
  '마케팅 수신',
];

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, message: 'bad json' });
  }

  if (payload.secret !== SHARED_SECRET) {
    return json({ ok: false, message: 'forbidden' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  // 첫 실행이면 머리글을 깔아 둔다. 사람이 읽을 시트라 라벨은 한국어다.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_LABELS);
    sheet.getRange(1, 1, 1, HEADER_LABELS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var row = HEADERS.map(function (key) {
    return payload[key] === undefined ? '' : payload[key];
  });
  sheet.appendRow(row);

  return json({ ok: true });
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
