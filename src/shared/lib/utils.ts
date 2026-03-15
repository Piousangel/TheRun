import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const MASKED_MEMBER_PHONE_NUMBER = "000-0000-0000";

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePhoneNumber(phoneNumber: string) {
  const trimmedPhoneNumber = phoneNumber.trim();
  const digitsOnly = trimmedPhoneNumber.replace(/\D/g, "");

  if (digitsOnly.length === 11) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
  }

  return trimmedPhoneNumber;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (hasMessage(error)) {
    return error.message;
  }

  return fallback;
}

export function getMemberPhoneDisplay(phoneNumber: string) {
  return phoneNumber === MASKED_MEMBER_PHONE_NUMBER ? "연락처 비공개" : phoneNumber;
}
