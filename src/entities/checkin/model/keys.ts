/** 출석 체크인 쿼리 키 팩토리 */
export const checkinKeys = {
  all: ['checkins'] as const,
  dates: () => [...checkinKeys.all, 'dates'] as const,
  /** 여러 경기일의 체크인 묶음(시즌 출석왕). 날짜는 정렬해서 키를 안정화한다. */
  onDates: (dates: readonly string[]) => [...checkinKeys.dates(), [...dates].sort().join(',')] as const,
};
