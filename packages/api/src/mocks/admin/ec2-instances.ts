import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminEc2InstanceResponse,
  AdminEc2InstanceResponseInstance,
} from '../../generated/admin/models';
import { ok } from './paging';

/**
 * 리대시·크롤러 EC2 켜고 끄기 핸들러(BE LC-3616, `/api/v1/admin/ec2-instances`).
 *
 * 켜기·끄기는 바로 `PENDING`·`STOPPING` 을 돌려주고, 몇 초 뒤 목록을 다시 부르면 `RUNNING`·`STOPPED` 가 된다. 이미 그
 * 상태면 그대로 성공한다. 바뀌는 중에 반대로 누르면 409 `EC2_INSTANCE_STATE_CONFLICT` 다. 값은 모듈 안에 있어 목을 다시
 * 띄우면 처음으로 돌아간다.
 */

const BASE = '*/api/v1/admin/ec2-instances';
const SETTLE_MS = 4000;

const instances: AdminEc2InstanceResponse[] = [
  { instance: 'REDASH', state: 'RUNNING' },
  { instance: 'CRAWLER', state: 'STOPPED' },
];
const changedAt = new Map<AdminEc2InstanceResponseInstance, number>();

/** 바뀌는 중인 인스턴스가 `SETTLE_MS` 를 넘겼으면 끝 상태로 옮긴다. */
function settle() {
  const now = Date.now();
  for (const item of instances) {
    const at = changedAt.get(item.instance);
    if (at === undefined || now - at < SETTLE_MS) continue;
    if (item.state === 'PENDING') item.state = 'RUNNING';
    if (item.state === 'STOPPING') item.state = 'STOPPED';
    changedAt.delete(item.instance);
  }
}

function conflict() {
  return HttpResponse.json(
    {
      status: 409,
      code: 'EC2_INSTANCE_STATE_CONFLICT',
      message: 'EC2 인스턴스가 상태를 바꾸는 중입니다. 잠시 후 다시 시도해주세요.',
    },
    { status: 409 },
  );
}

function change(name: unknown, action: 'start' | 'stop') {
  settle();
  const item = instances.find((candidate) => candidate.instance === name);
  if (!item) {
    return HttpResponse.json(
      { status: 400, code: 'BAD_REQUEST', message: 'REDASH·CRAWLER가 아닌 인스턴스입니다.' },
      { status: 400 },
    );
  }
  if (action === 'start') {
    if (item.state === 'STOPPING') return conflict();
    if (item.state === 'STOPPED') {
      item.state = 'PENDING';
      changedAt.set(item.instance, Date.now());
    }
  } else {
    if (item.state === 'PENDING') return conflict();
    if (item.state === 'RUNNING') {
      item.state = 'STOPPING';
      changedAt.set(item.instance, Date.now());
    }
  }
  return HttpResponse.json(ok({ ...item }));
}

export const ec2InstanceHandlers: HttpHandler[] = [
  http.get(BASE, () => {
    settle();
    return HttpResponse.json(ok(instances.map((item) => ({ ...item }))));
  }),
  http.post(`${BASE}/:instance/start`, ({ params }) => change(params.instance, 'start')),
  http.post(`${BASE}/:instance/stop`, ({ params }) => change(params.instance, 'stop')),
];
