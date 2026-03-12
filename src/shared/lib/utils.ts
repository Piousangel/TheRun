import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMemberPhoneDisplay(phoneNumber: string) {
  return phoneNumber === "000-0000-0000" ? "연락처 비공개" : phoneNumber;
}
