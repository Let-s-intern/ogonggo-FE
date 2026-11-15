import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listEc2Instances,
  startEc2Instance,
  stopEc2Instance,
  type AdminEc2InstanceResponse,
  type AdminEc2InstanceResponseInstance,
  type AdminEc2InstanceResponseState,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

export type Ec2Instance = AdminEc2InstanceResponse;
export type Ec2InstanceName = AdminEc2InstanceResponseInstance;
export type Ec2InstanceState = AdminEc2InstanceResponseState;

const EC2_INSTANCES_KEY = ['admin', 'ec2-instances'] as const;

/** AWS 가 상태를 바꾸는 중인 값. 이 동안에는 목록을 다시 불러 끝 상태를 기다린다. */
export const TRANSITIONING_STATES: readonly Ec2InstanceState[] = [
  'PENDING',
  'STOPPING',
  'SHUTTING_DOWN',
];

const POLL_MS = 5000;

/**
 * 리대시·크롤러 EC2 의 지금 상태(BE LC-3616). 켜기·끄기는 AWS 에 요청만 하고 바로 돌아와서, 하나라도 바뀌는 중이면
 * 끝 상태가 될 때까지 5초마다 다시 부른다.
 */
export function useEc2Instances() {
  return useQuery({
    queryKey: EC2_INSTANCES_KEY,
    queryFn: async () => (await unwrapData(listEc2Instances())) ?? [],
    refetchInterval: (query) =>
      query.state.data?.some((item) => TRANSITIONING_STATES.includes(item.state)) ? POLL_MS : false,
  });
}

/** 켜기·끄기. 응답 상태(보통 `PENDING`·`STOPPING`)를 목록 캐시에 바로 넣어 다시 부르기를 시작한다. */
export function useToggleEc2Instance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instance, action }: { instance: Ec2InstanceName; action: 'start' | 'stop' }) =>
      unwrapData(action === 'start' ? startEc2Instance(instance) : stopEc2Instance(instance)),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData<Ec2Instance[]>(EC2_INSTANCES_KEY, (current) =>
          current?.map((item) => (item.instance === updated.instance ? updated : item)),
        );
      }
      void queryClient.invalidateQueries({ queryKey: EC2_INSTANCES_KEY });
    },
  });
}
