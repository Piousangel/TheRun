"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DemoLoginButtons } from "@/features/dev-session/ui/demo-login-buttons";
import { getApi, isLocalAdapter } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { GoogleLogo, KakaoLogo, NaverLogo } from "@/shared/ui/provider-logo";
import type { OAuthProvider } from "@/shared/api/ports/auth-repo";

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-link": "로그인 링크가 올바르지 않습니다. 다시 시도해주세요.",
  "auth-failed": "로그인 확인에 실패했습니다. 다시 시도해주세요.",
  "naver-setup-required": "네이버 로그인은 곧 열릴 예정입니다. Google 또는 카카오로 로그인해주세요.",
  "provider-disabled": "이 로그인 방식은 아직 열리지 않았습니다. 다른 방식으로 시도하거나 운영진에게 문의해주세요.",
  "not-configured": "로그인이 아직 연결되지 않았습니다. 잠시 후 다시 시도해주세요.",
};

const PROVIDER_LABEL: Record<OAuthProvider, string> = { google: "Google", kakao: "카카오" };

function normalizeAuthErrorMessage(message: string) {
  if (message.includes("Unsupported provider") || message.includes("provider is not enabled")) {
    return ERROR_MESSAGES["provider-disabled"];
  }
  return message;
}

interface LoginPageContentProps {
  errorKey: string | null;
  nextPath: string;
}

export function LoginPageContent({ errorKey, nextPath }: LoginPageContentProps) {
  const [isSubmitting, setIsSubmitting] = useState<OAuthProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const errorMessage = useMemo(() => {
    if (!errorKey) return null;
    return ERROR_MESSAGES[errorKey] ?? "로그인 중 문제가 발생했습니다.";
  }, [errorKey]);

  const activeMessage = message ?? errorMessage;

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setIsSubmitting(provider);
    setMessage(null);

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", nextPath);

    let data: { url: string | null };
    try {
      data = await getApi().auth.signInWithOAuth(provider, redirectTo.toString());
    } catch (error) {
      setMessage(
        normalizeAuthErrorMessage(error instanceof Error ? error.message : "로그인 중 문제가 발생했습니다."),
      );
      setIsSubmitting(null);
      return;
    }

    if (!data?.url) {
      setMessage(ERROR_MESSAGES["not-configured"]);
      setIsSubmitting(null);
      return;
    }

    toast.success(`${PROVIDER_LABEL[provider]} 로그인 화면으로 이동합니다.`);
    window.location.assign(data.url);
  };

  const handleNaverClick = () => {
    setMessage(ERROR_MESSAGES["naver-setup-required"]);
  };

  return (
    <div className="space-y-5">
      {isLocalAdapter() && <DemoLoginButtons nextPath={nextPath} />}

      <section className="space-y-3 rounded-[1.75rem] border border-primary/15 bg-card p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">3초 만에 시작하기</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            쓰던 계정으로 로그인하면 투표·출석·경기 기록이 내 이름으로 정리됩니다.
          </p>
        </div>

        {activeMessage ? (
          <div
            role="alert"
            className={`rounded-xl border px-4 py-3 text-sm leading-6 ${message === null && errorMessage ? "border-destructive/25 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-foreground"}`}
          >
            {activeMessage}
          </div>
        ) : null}

        <Button
          className="h-12 w-full rounded-full text-sm font-semibold"
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("google")}
          disabled={isSubmitting !== null}
        >
          <GoogleLogo className="h-4 w-4" />
          {isSubmitting === "google" ? "Google로 이동 중..." : "Google로 계속하기"}
        </Button>

        <Button
          className="h-12 w-full rounded-full border-0 bg-[#FEE500] text-sm font-semibold text-[#191919] hover:bg-[#FEE500]/90"
          type="button"
          onClick={() => handleOAuthLogin("kakao")}
          disabled={isSubmitting !== null}
        >
          <KakaoLogo className="h-4 w-4" />
          {isSubmitting === "kakao" ? "카카오로 이동 중..." : "카카오로 계속하기"}
        </Button>

        <Button
          className="h-12 w-full rounded-full"
          type="button"
          variant="ghost"
          onClick={handleNaverClick}
          disabled={isSubmitting !== null}
        >
          <NaverLogo className="h-4 w-4" />
          네이버 (준비 중)
        </Button>

        <p className="pt-1 text-center text-xs leading-5 text-muted-foreground">
          로그인 뒤 클럽 멤버 연결은 초대 코드 또는 운영진 승인으로 진행됩니다.
        </p>
      </section>
    </div>
  );
}
