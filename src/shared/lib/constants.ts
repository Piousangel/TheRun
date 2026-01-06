export const FORMATION_TYPES = ['6v6', '7v7', '8v8'] as const;

export const POSITION_ROLES = ['GK', 'DF', 'MF', 'FW'] as const;

export const POSITION_ROLE_LABELS: Record<string, string> = {
  GK: '골키퍼',
  DF: '수비수',
  MF: '미드필더',
  FW: '공격수',
};

export const STAT_LABELS: Record<string, string> = {
  speed: '스피드',
  shooting: '슈팅',
  passing: '패스',
  dribbling: '드리블',
  stamina: '체력',
  defense: '수비',
};

export const DEFAULT_STATS = {
  speed: 50,
  shooting: 50,
  passing: 50,
  dribbling: 50,
  stamina: 50,
  defense: 50,
};

export const ATTENDANCE_DEADLINE_HOUR = 23; // 금요일 밤 11시
export const ATTENDANCE_DEADLINE_MINUTE = 59; // 금요일 밤 11:59
