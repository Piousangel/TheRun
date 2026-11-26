import { useQuery } from '@tanstack/react-query';
import { checkinKeys } from '@/entities/checkin/model/keys';
import { getApi } from '@/shared/api/client';
import type { Checkin } from '@/shared/types/checkin';

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
