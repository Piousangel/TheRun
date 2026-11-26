import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkinKeys } from '@/entities/checkin/model/keys';
import { getApi } from '@/shared/api/client';
import type { CheckInInput, Checkin, ConfirmCheckinInput } from '@/shared/types/checkin';

export { checkinKeys };

/** 주어진 경기일들의 체크인 전체(시즌 출석왕 계산용). 날짜가 없으면 요청하지 않는다. */
export function useCheckinsOnDates(dates: readonly string[]) {
  return useQuery({
    queryKey: checkinKeys.onDates(dates),
    queryFn: async (): Promise<Checkin[]> => {
      const lists = await Promise.all(dates.map((d) => getApi().checkins.listByDate(d)));
      return lists.flat();
    },
    enabled: dates.length > 0,
  });
}

/** 한 경기일의 체크인. date가 비면 요청하지 않는다. */
export function useCheckinsByDate(date: string | null) {
  return useQuery({
    queryKey: checkinKeys.byDate(date ?? ''),
    queryFn: () => getApi().checkins.listByDate(date ?? ''),
    enabled: !!date,
  });
}

/** 본인 체크인("도착했어요"). 정시/지각은 어댑터가 시각으로 판정한다. */
export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckInInput) => getApi().checkins.checkIn(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: checkinKeys.all }),
  });
}

/** 운영진 확정·수정. 여러 명을 한 번에 넘기면 차례로 확정한다(미확인 일괄 결석). */
export function useConfirmCheckins() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: ConfirmCheckinInput[]) => {
      const rows: Checkin[] = [];
      for (const input of inputs) rows.push(await getApi().checkins.confirm(input));
      return rows;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: checkinKeys.all }),
  });
}
