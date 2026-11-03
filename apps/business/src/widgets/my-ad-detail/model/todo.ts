import type { AdApplication } from '@/entities/advertisement';

export interface AdTodo {
  title: string;
  description: string;
  /** `creatives`: 소재 미리보기로 내려가는 링크, `report`: 성과 보기, `editPost`: 공고 수정. */
  action?: 'creatives' | 'report' | 'editPost';
}

/** 상세 맨 위 `지금 할 일`(시안 B-05). 단계와 반려·소재 확인 상태로 정한다. */
export function adTodoOf(ad: AdApplication): AdTodo {
  if (ad.rejection) {
    return {
      title: '반려된 내용을 고쳐 주세요',
      description: `${ad.rejection.reason}. 고친 뒤 담당 매니저에게 알려 주시면 다시 검수해요.`,
      action: ad.postTarget === 'JOB' ? 'editPost' : undefined,
    };
  }
  switch (ad.status) {
    case 'RECEIVED':
      return {
        title: '견적서를 준비하고 있어요',
        description: '영업일 2일 안에 담당자 메일로 견적서를 보내드려요.',
      };
    case 'QUOTED':
      return {
        title: '메일로 보낸 견적서를 확인해 주세요',
        description: '확인하시면 모두싸인 전자계약서를 보내드려요.',
      };
    case 'CONTRACTED':
      return {
        title: '입금을 기다리고 있어요',
        description: '세금계산서를 확인하고 입금해 주세요. 입금 확인 뒤 소재 검수가 시작돼요.',
      };
    case 'PAID':
      return {
        title: '소재를 만들고 있어요',
        description: '오공고가 48시간 안에 소재를 만들어 확인을 요청드려요.',
      };
    case 'REVIEWING':
      return ad.items.some((item) => item.creative.confirmStatus !== 'APPROVED')
        ? {
            title: '오공고가 제작한 소재를 확인해 주세요',
            description:
              "확인 없이는 확정되지 않아요. 지면별 미리보기에서 '이대로 게재' 또는 '수정 요청'을 눌러 주세요.",
            action: 'creatives',
          }
        : {
            title: '운영자 승인을 기다리고 있어요',
            description: '소재 확인을 마쳤어요. 운영자가 승인하면 확정돼요.',
          };
    case 'CONFIRMED':
      return { title: '게재를 기다리고 있어요', description: '확정한 주 월요일부터 게재돼요.' };
    case 'RUNNING':
      return { title: '광고가 게재 중이에요', description: '종료 7일 뒤 성과 리포트를 드려요.' };
    case 'ENDED':
      return {
        title: '성과 리포트가 나왔어요',
        description: '노출 · 클릭 · 지원하기 클릭을 확인해 보세요.',
        action: 'report',
      };
  }
}

/** 취소 요청을 받을 수 있는지. 확정 후에는 시작 3일 전까지(PRD `광고 진행 단계`). 집행·종료면 안 된다. */
export function canRequestCancel(ad: AdApplication, today = new Date()): boolean {
  if (ad.status === 'RUNNING' || ad.status === 'ENDED') return false;
  const start = ad.items.map((item) => item.startDate).sort()[0];
  if (!start) return false;
  const [year, month, day] = start.split('-').map(Number) as [number, number, number];
  const limit = new Date(year, month - 1, day - 3, 23, 59, 59);
  return today.getTime() <= limit.getTime();
}
