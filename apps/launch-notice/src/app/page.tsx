import Image from 'next/image';
import { ApplyForm } from '@/components/ApplyForm';
import { ApplyModal } from '@/components/ApplyModal';

const INSTAGRAM_URL = 'https://www.instagram.com/letscareer.job';

/**
 * 무료 홍보 슬롯. 한 달에 8개만 집행한다.
 *
 * **손으로 고치는 값이다.** 신청이 들어와 자리가 차면 여기에 로고를 더하고 아래 문구의 숫자를
 * 바꾼다. 시트에서 실시간으로 세지 않는 이유는, 페이지를 열 때마다 서버 호출이 하나 늘어나는
 * 대가로 얻는 것이 일주일에 두어 번 바뀌는 숫자이기 때문이다.
 */
const TOTAL_SLOTS = 8;
const TAKEN_SLOTS = [
  { name: '루트로닉', src: '/slot-lutronic.png' },
  { name: '올리브인터내셔널', src: '/slot-olive.png' },
  { name: '라라스윗', src: '/slot-larasweet.png' },
];

const FEATURES = [
  {
    title: '공고를 올리면 렛츠커리어 유저 전체에게 닿습니다',
    body: '오늘의 공고에 등록한 채용공고가 인스타그램, 뉴스레터, 직무별 오픈채팅방까지 한 번에 전달됩니다.',
  },
  {
    title: '배너·SNS·오픈채팅방 광고를 한 곳에서 집행합니다',
    body: '채널마다 따로 문의하실 필요 없이, 원하는 지면을 골라 신청하면 렛츠커리어가 소재 제작부터 집행까지 진행합니다.',
  },
  {
    title: '공고를 넘어 인재까지 연결합니다',
    body: '렛츠커리어 인재풀을 기반으로 인재 추천과 커피챗을 연결하고, 채용공고 설명회도 열 수 있습니다.',
  },
];

const STEPS = [
  {
    title: <>공고 링크를 보내주세요</>,
    body: '이미 올려둔 채용 페이지 주소 하나면 충분합니다. 별도 소재를 만들어 주실 필요 없습니다.',
  },
  {
    title: <>렛츠커리어가 소재를 제작합니다</>,
    body: '채널별 규격에 맞춰 카드뉴스와 요약문을 만들고, 발송 전에 확인을 받습니다.',
  },
  {
    title: (
      <>
        <span className="hilite">48시간 안에 집행</span>합니다
      </>
    ),
    body: '확인해주신 시점부터 이틀 안에 모든 채널에 노출됩니다. 마감이 급한 공고도 태울 수 있습니다.',
  },
  {
    title: <>결과를 정리해 보내드립니다</>,
    body: '채널별 노출·클릭 수와 지원 페이지 유입을 리포트로 받아보십니다.',
  },
];

const FAQ = [
  {
    q: '지금 채용 계획이 확정되지 않았는데 신청해도 되나요?',
    a: '괜찮습니다. 출시 알림 신청은 슬롯을 잡아두는 절차일 뿐이고, 실제 집행 시점은 공고가 나온 뒤에 정하시면 됩니다. 신청만으로 발생하는 비용이나 의무는 없습니다.',
  },
  {
    q: '비용은 얼마인가요?',
    a: '출시 알림을 신청하신 기업은 채널 한 곳에 1회 무료로 집행해드립니다. 이후 추가 집행 단가는 신청 즉시 보내드리는 소개서에서 확인하실 수 있습니다.',
  },
  {
    q: '어떤 회사든 진행할 수 있나요?',
    a: '채널 구독자가 신뢰할 수 있는 공고인지 확인한 뒤 진행합니다. 정규직·인턴 채용 공고를 우선하며, 근무 조건이 명확하지 않은 공고는 정중히 거절할 수 있습니다.',
  },
  {
    q: '공고 소재를 저희가 만들어야 하나요?',
    a: '아닙니다. 채용 페이지 링크만 주시면 렛츠커리어가 채널별 소재를 제작하고, 발송 전에 확인받습니다.',
  },
];

/**
 * 출시 알림 신청 랜딩(`~/Downloads/oneului-gonggo-b2b-landing.html` 포팅).
 *
 * 마크업과 클래스 이름을 에셋 그대로 옮겼고 CSS 도 그대로 가져왔다(`landing.css`). Tailwind 로
 * 다시 적지 않은 이유는, 이미 완성된 디자인을 옮겨 적으면 어긋날 위험만 생기고 3주 뒤 지울
 * 코드에 그 값어치가 없기 때문이다.
 *
 * 서버 컴포넌트다. 움직이는 것은 신청 폼과 플로팅 버튼뿐이라 그 둘만 클라이언트다.
 */
export default function Page() {
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div className="mark">
            렛츠커리어 <span>오늘의 공고</span>
          </div>
          <a className="jump" href="#apply">
            출시 알림 신청
          </a>
        </div>
      </div>

      <header className="hero">
        <div className="wrap">
          <p className="kicker">출시 알림 신청 · 9월 23일 런칭</p>
          <h1>
            렛츠커리어 ‘오늘의 공고’
            <br />
            무료 홍보 혜택
          </h1>
          <p className="lede">
            안녕하세요, 인턴·신입 커리어 교육 콘텐츠 플랫폼 <b>렛츠커리어</b>입니다. 인스타그램과
            오픈채팅방으로 인턴·신입 채용공고를 큐레이션해온 렛츠커리어가 9월 23일 ‘오늘의 공고’
            플랫폼을 런칭합니다.
          </p>
          <p className="lede">
            지금 출시 알림을 신청해주시면 인스타그램{' '}
            <a className="ig" href={INSTAGRAM_URL} target="_blank" rel="noopener">
              @letscareer.job
            </a>{' '}
            또는 오픈채팅방 한 곳을 선택해, <b>기업별 1회 채용공고 무료 홍보</b>를 진행해드립니다.
          </p>

          <p className="featlead">9월 23일 런칭과 함께 이런 것들이 가능해집니다.</p>
          <ol className="feats">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </li>
            ))}
          </ol>

          <div className="slots">
            <h2>무료 홍보 슬롯 {TOTAL_SLOTS}개</h2>
            <p>
              채널 신뢰도를 지키기 위해 한 달에 {TOTAL_SLOTS}개 기업만 집행합니다. 현재{' '}
              {TAKEN_SLOTS.length}곳이 확정돼 <b>{TOTAL_SLOTS - TAKEN_SLOTS.length}자리</b>가
              남았습니다.
            </p>
            <div className="slotrow">
              {TAKEN_SLOTS.map((slot) => (
                <div key={slot.name} className="slot taken">
                  {/*
                    `width`/`height` 는 `next/image` 가 자리를 잡아 두기 위해 요구하는 값일
                    뿐이고, 실제 크기는 CSS 의 `.slot .logo`(`max-height:34px`,
                    `object-fit:contain`)가 정한다. 로고마다 가로세로 비가 달라 여기 적은
                    값과 그림의 실제 비가 다르지만, `object-contain` 이라 찌그러지지 않는다.
                  */}
                  <Image className="logo" src={slot.src} alt={slot.name} width={120} height={34} />
                </div>
              ))}
              {Array.from({ length: TOTAL_SLOTS - TAKEN_SLOTS.length }, (_, index) => (
                <div key={index} className="slot">
                  비어 있음
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="band">
        <div className="wrap">
          <h2 className="sec">공고가 도착하는 곳</h2>
          <p className="sec-note">
            광고 지면을 사는 것이 아닙니다. 렛츠커리어가 직접 운영하는 채널에서, 이미 채용 정보를
            기다리고 있는 사람들의 피드에 공고가 올라갑니다.
          </p>
          <div className="channels">
            <div className="ch">
              <p className="name">오공고 인스타그램</p>
              <p className="size">2.7만명</p>
              <p className="desc">
                <a className="ig" href={INSTAGRAM_URL} target="_blank" rel="noopener">
                  @letscareer.job
                </a>
                . 공고 카드뉴스와 스토리로 나갑니다. 저장과 공유가 가장 많이 일어나는 채널입니다.
              </p>
            </div>
            <div className="ch">
              <p className="name">뉴스레터</p>
              <p className="size">1.5만명</p>
              <p className="desc">
                메일함으로 직접 들어갑니다. 마감 임박 공고와 지원 팁을 함께 담아 보냅니다.
              </p>
            </div>
            <div className="ch">
              <p className="name">직무별 오픈채팅방</p>
              <p className="size">5,539명</p>
              <p className="desc">
                6개 방을 직무별로 운영합니다. 뽑는 직군의 방으로만 정확히 보낼 수 있습니다.
              </p>
            </div>
          </div>

          <figure className="showcase">
            <Image
              src="/showcase.jpg"
              alt="오공고 인스타그램 @letscareer.job 계정과 실제 집행한 채용공고 카드뉴스, 직무별 큐레이션 오픈채팅방 6곳 목록"
              width={1032}
              height={704}
              priority={false}
            />
            <figcaption>운영 중인 채널과 실제 집행 사례</figcaption>
          </figure>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2 className="sec">렛츠커리어 채용공고 홍보 프로세스</h2>
          <p className="sec-note">
            공고 링크를 주신 시점부터 집행까지 이틀이면 끝납니다. 채용은 마감일이 정해져 있으니까요.
          </p>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={index}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="formband" id="apply">
        <div className="wrap">
          <h2 className="sec">출시 알림 신청</h2>
          <p className="sec-note">1분이면 끝납니다. 런칭 전에 담당자가 직접 연락드립니다.</p>
          <div className="card">
            <ApplyForm />
          </div>
        </div>
      </section>

      <section className="band tight">
        <div className="wrap">
          <h2 className="sec">자주 묻는 질문</h2>
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <div className="wrap">
          렛츠커리어 · 주식회사 아이엔지
          <br />
          광고·제휴 문의 official@letscareer.co.kr
        </div>
      </footer>

      <ApplyModal />
    </>
  );
}
