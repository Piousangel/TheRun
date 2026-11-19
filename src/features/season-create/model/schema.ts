import { z } from 'zod';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const int = (label: string, min: number, max: number) =>
  z
    .number({ invalid_type_error: `${label}을(를) 숫자로 입력해주세요` })
    .int(`${label}은(는) 정수여야 합니다`)
    .min(min, `${label}은(는) ${min} 이상이어야 합니다`)
    .max(max, `${label}은(는) ${max} 이하여야 합니다`);

export const seasonCreateSchema = z
  .object({
    name: z.string().trim().min(1, '시즌 이름을 입력해주세요').max(50, '시즌 이름은 50자 이내여야 합니다'),
    starts_on: z.string().regex(DATE, '시작일을 선택해주세요'),
    ends_on: z.string().regex(DATE, '종료일을 선택해주세요'),
    quarters_per_match: int('쿼터 수', 1, 6),
    quarter_minutes: int('쿼터 시간', 5, 30),
    players_per_side: int('인원', 4, 11),
    win: int('승 승점', 0, 10),
    draw: int('무 승점', 0, 10),
    loss: int('패 승점', 0, 10),
  })
  .refine((d) => d.ends_on >= d.starts_on, { message: '종료일은 시작일 이후여야 합니다', path: ['ends_on'] })
  .refine((d) => d.win >= d.draw && d.draw >= d.loss, { message: '승점은 승 ≥ 무 ≥ 패 순서여야 합니다', path: ['draw'] });

export type SeasonCreateFormData = z.infer<typeof seasonCreateSchema>;
