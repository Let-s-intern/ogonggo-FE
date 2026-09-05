/**
 * 출시 알림 신청을 구글 스프레드시트에 쌓는 앱스 스크립트.
 *
 * 이 코드는 저장소에서 실행되지 않는다. 아래 "설치" 순서대로 스프레드시트에 붙여 넣고 배포한
 * 뒤, 나오는 `/exec` 주소를 `apps/launch-notice` 의 `LAUNCH_NOTICE_SHEET_WEBHOOK_URL` 에 넣는다.
 * 여기 두는 이유는 이 파일이 없으면 나중에 시트가 어떻게 채워지는지 아무도 모르기 때문이다.
 *
 * 설치 — 두 가지 길이 있다. A 가 막히면 B 로 간다.
 *
 * A. 시트에 붙여 쓰기 (시트를 내가 만들었을 때)
 *   1. 신청을 받을 스프레드시트를 연다
 *   2. 확장 프로그램 → Apps Script 를 열고 이 파일 내용을 통째로 붙여 넣는다
 *   3. SHARED_SECRET 을 아무도 모르는 문자열로 바꾼다
 *   4. 저장(Ctrl+S) 후 함수 목록에서 `setup` 을 골라 한 번 실행한다
 *      → 권한 승인 창이 뜨면 허용한다. **배포 전에 이걸 먼저 해야 한다**
 *   5. 배포 → 새 배포 → 유형 "웹 앱"
 *      - 실행 사용자: 나
 *      - 액세스 권한: 모든 사용자
 *   6. 나온 `/exec` 주소를 브라우저로 열어 `{"ok":true,...}` 가 보이는지 확인한다
 *   7. 그 주소와 3번의 문자열을 Vercel 환경변수에 넣는다
 *        LAUNCH_NOTICE_SHEET_WEBHOOK_URL / LAUNCH_NOTICE_SHEET_SECRET
 *
 * B. 독립 프로젝트로 만들기 (시트가 남의 것이라 A 의 `새 배포` 가 막힐 때)
 *   시트에 붙은 스크립트는 **파일 소유자만 배포할 수 있다.** 남이 만든 시트에서 `새 배포` 를
 *   누르면 "이 작업을 수행할 권한이 없습니다" 가 뜬다. 그때는 내가 만든 프로젝트에 올린다.
 *   1. script.google.com → 새 프로젝트
 *   2. 이 파일 내용을 통째로 붙여 넣는다. SPREADSHEET_ID 는 이미 채워져 있다
 *   3. SHARED_SECRET 을 바꾼다
 *   4. 저장 → `setup` 실행 → 권한 승인 (시트 접근 권한도 여기서 함께 승인된다)
 *   5. 배포 → 새 배포 → 웹 앱 / 실행: 나 / 액세스: 모든 사용자
 *   6~7. A 와 같다
 *
 *   내 시트가 아니어도 **편집 권한만 있으면 된다.** 배포가 "나로 실행" 이라 내 권한으로 쓴다.
 *
 * **시트 ID 를 손으로 적지 않는다.** `setup` 이 자기가 붙어 있는 문서에서 ID 를 읽어
 * 스크립트 속성에 저장하고, 그 다음부터 웹 앱이 그 값을 쓴다. 주소창에서 ID 를 골라
 * 복사하는 일이 없어지므로 엉뚱한 조각을 집어 `Illegal spreadsheet id` 로 막힐 일도 없다.
 *
 * "모든 사용자" 로 열어야 하는 것은 우리 서버가 구글 로그인 없이 부르기 때문이다. 대신
 * SHARED_SECRET 이 맞지 않는 요청은 아무 일도 하지 않는다. 주소만으로는 행을 넣을 수 없다.
 */

/**
 * 신청이 쌓일 스프레드시트 ID. 이미 채워 두었다 — 주소창에서 골라 복사할 필요가 없다.
 *
 * 이 값이 있으면 **독립 프로젝트로도 돌아간다.** 시트에 붙은 스크립트(container-bound)는
 * 파일 소유자만 배포할 수 있어서, 남이 만든 시트에서는 `새 배포` 가
 * "이 작업을 수행할 권한이 없습니다" 로 막힌다. 그럴 때는 script.google.com 에서 내가 만든
 * 새 프로젝트에 이 코드를 붙여 넣으면 된다 — 그쪽은 열려 있는 문서가 없지만 이 ID 로 연다.
 * 시트에는 편집 권한만 있으면 되고, 배포는 "나로 실행" 이라 내 권한으로 쓴다.
 */
var SPREADSHEET_ID = '1dRobUwhT7GP4gE74_7OiR2xpASwUwNGZhszv4ijZNUs';

/** 스크립트 속성에 시트 ID 를 저장해 둘 이름. */
var ID_PROPERTY = 'SPREADSHEET_ID';

/** 우리 서버만 아는 문자열. 이게 맞지 않으면 행을 넣지 않는다. */
var SHARED_SECRET = '여기를-바꾸세요';

/** 신청이 쌓일 시트(탭) 이름. 없으면 만든다. */
var SHEET_NAME = '출시알림 신청';

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

/**
 * 배포 전에 한 번 손으로 돌린다. 두 가지를 한다.
 *   - 권한 승인 창을 띄운다. 웹 앱은 승인 없이 배포하면 첫 요청에서 조용히 실패한다
 *   - 시트와 머리글을 만들어 둔다
 * 실행 기록에 시트 이름이 찍히면 성공이다.
 */
function setup() {
  var book = resolveBook();
  var sheet = getSheet();
  Logger.log(
    '준비됨: ' + book.getName() + ' / ' + sheet.getName() + ' (' + sheet.getLastRow() + '행)',
  );
  return sheet.getName();
}

/**
 * 신청을 쌓을 문서를 찾는다.
 *
 * 세 군데를 순서대로 본다. 어느 하나만 있으면 되고, 셋 다 없을 때만 실패한다.
 *
 *   1. 위에 적어 둔 SPREADSHEET_ID — 독립 프로젝트에서 쓰는 길이다
 *   2. 스크립트 속성 — 붙은 시트에서 `setup` 을 한 번 돌리면 여기에 적힌다
 *   3. 지금 열려 있는 문서 — 편집기에서 직접 돌릴 때만 있다. 웹 앱 요청에는 없다
 *
 * 3번만으로는 안 되는 것이 처음의 실패였다. 웹 앱으로 들어온 요청에는 열린 문서가 없어
 * `getActiveSpreadsheet()` 가 `null` 을 주고 다음 줄이 바로 터진다.
 */
function resolveBook() {
  var props = PropertiesService.getScriptProperties();

  if (SPREADSHEET_ID && SPREADSHEET_ID.indexOf('여기에') === -1) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  var stored = props.getProperty(ID_PROPERTY);
  if (stored) {
    return SpreadsheetApp.openById(stored);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty(ID_PROPERTY, active.getId());
    return active;
  }

  throw new Error('시트를 찾지 못했습니다. SPREADSHEET_ID 를 채우거나 setup() 을 실행하세요.');
}

function getSheet() {
  var book = resolveBook();
  var sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_LABELS);
    sheet.getRange(1, 1, 1, HEADER_LABELS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 배포가 살아 있는지 브라우저로 확인하는 용도. `/exec` 주소를 그냥 열면 이게 돈다.
 * 비밀은 받지 않으므로 아무것도 쓰지 않고 상태만 알려 준다.
 */
function doGet() {
  try {
    var sheet = getSheet();
    return json({ ok: true, sheet: sheet.getName(), rows: sheet.getLastRow() - 1 });
  } catch (err) {
    return json({ ok: false, where: 'doGet', message: String(err) });
  }
}

function doPost(e) {
  // 오류를 통째로 감싸 돌려준다. 그러지 않으면 앱스 스크립트가 HTML 오류 페이지를 주고,
  // 우리 서버에는 "502" 만 남아 원인을 못 찾는다.
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, message: 'no body' });
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      return json({ ok: false, message: 'bad json' });
    }

    if (payload.secret !== SHARED_SECRET) {
      return json({ ok: false, message: 'forbidden' });
    }

    var sheet = getSheet();
    var row = HEADERS.map(function (key) {
      return payload[key] === undefined ? '' : payload[key];
    });
    sheet.appendRow(row);

    return json({ ok: true });
  } catch (err) {
    // 실행 기록에도 남기고 응답으로도 돌려준다.
    Logger.log('doPost 실패: ' + err);
    return json({ ok: false, where: 'doPost', message: String(err) });
  }
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
