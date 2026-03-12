import { z } from "zod";

export const accountMemberEditSchema = z.object({
  name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .max(100, "이름은 100자 이내여야 합니다"),
  phone_number: z
    .string()
    .regex(
      /^(010|000)-\d{4}-\d{4}$/,
      "010-1234-5678 또는 000-0000-0000 형식으로 입력해주세요",
    ),
});

export type AccountMemberEditFormData = z.infer<typeof accountMemberEditSchema>;
