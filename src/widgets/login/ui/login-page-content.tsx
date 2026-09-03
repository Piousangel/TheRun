"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DemoLoginButtons } from "@/features/dev-session/ui/demo-login-buttons";
import { getApi, isLocalAdapter } from "@/shared/api/client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { GoogleLogo, NaverLogo } from "@/shared/ui/provider-logo";

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-link": "로그인 링크가 올바르지 않습니다. 다시 시도해주세요.",
  "auth-failed": "로그인 확인에 실패했습니다. 새 링크를 발급받아주세요.",
  "naver-setup-required":
    "네이버 로그인은 보안 설정을 마친 뒤 순차적으로 열릴 예정입니다.",
  "google-not-configured":
    "Google 로그인이 아직 올바르게 연결되지 않았습니다. 잠시 후 다시 시도해주세요.",
  "google-provider-disabled":
    "현재 Supabase 프로젝트에서 Google 로그인이 비활성화되어 있습니다. Authentication > Providers > Google에서 먼저 활성화해주세요.",
};

function normalizeAuthErrorMessage(message: string) {
  if (
    message.includes("Unsupported provider") ||
    message.includes("provider is not enabled")
  ) {
    return ERROR_MESSAGES["google-provider-disabled"];
  }

  return message;
}

interface LoginPageContentProps {
  errorKey: string | null;
  nextPath: string;
}

export function LoginPageContent({
  errorKey,
  nextPath,
}: LoginPageContentProps) {
  const [isSubmitting, setIsSubmitting] = useState<"google" | "naver" | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  const errorMessage = useMemo(() => {
    if (!errorKey) {
      return null;
    }

    return ERROR_MESSAGES[errorKey] ?? "로그인 중 문제가 발생했습니다.";
  }, [errorKey]);

  const activeMessage = errorMessage ?? message;

  const handleGoogleLogin = async () => {
    setIsSubmitting("google");
    setMessage(null);

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", nextPath);

    let data: { url: string | null };
    try {
      data = await getApi().auth.signInWithOAuth("google", redirectTo.toString());
    } catch (error) {
      const normalizedMessage = normalizeAuthErrorMessage(
        error instanceof Error ? error.message : "로그인 중 문제가 발생했습니다.",
      );
      setMessage(normalizedMessage);
      toast.error(normalizedMessage);
      setIsSubmitting(null);
      return;
    }

    if (!data?.url) {
      const fallbackMessage = ERROR_MESSAGES["google-not-configured"];
      setMessage(fallbackMessage);
      toast.error(fallbackMessage);
      setIsSubmitting(null);
      return;
    }

    toast.success("Google 로그인 화면으로 이동합니다.");
    window.location.assign(data.url);
  };

  const handleNaverClick = () => {
    setIsSubmitting("naver");
    setMessage(
      "네이버 로그인은 보안 설정을 마친 뒤 순차적으로 열릴 예정입니다. 지금은 Google 로그인을 먼저 사용해주세요.",
    );
    toast.message(
      "Naver 로그인은 곧 열릴 예정입니다. 지금은 Google 로그인을 사용해주세요.",
    );
    setIsSubmitting(null);
  };

  return (
    <div className="space-y-5">
      {isLocalAdapter() && <DemoLoginButtons nextPath={nextPath} />}
      <section className="overflow-hidden rounded-[1.75rem] border border-primary/15 bg-[linear-gradient(155deg,rgba(200,168,88,0.12),rgba(255,255,255,0.98))] p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Google 우선 연결</Badge>
          <Badge variant="secondary">계정 연결 기반</Badge>
          <Badge variant="secondary">주간 루틴 진입</Badge>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">
          가장 빠르게 앱 안으로 들어가는 방식만 남겼습니다.
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
          먼저 로그인하고, 이어서 내 멤버를 연결하면 이후 투표, 출석, 공지 읽음
          흐름이 모두 본인 기준으로 정리됩니다.
        </p>
      </section>

      <Card className="overflow-hidden border-primary/15 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <GoogleLogo className="h-5 w-5" />
                소셜 로그인
              </CardTitle>
              <CardDescription className="mt-2 leading-6">
                지금은 Google로 바로 진입하고, Naver는 보안 설정이 끝난 뒤 같은
                톤으로 열릴 예정입니다.
              </CardDescription>
            </div>
            <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
              Fast access
            </div>
          </div>

          {activeMessage ? (
            <div
              className={`rounded-[1.15rem] border px-4 py-3 text-sm leading-6 ${errorMessage ? "border-destructive/25 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary"}`}
            >
              {activeMessage}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-3">
          <Button
            className="h-12 w-full rounded-full text-sm font-semibold"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting !== null}
          >
            <GoogleLogo className="h-4 w-4" />
            {isSubmitting === "google"
              ? "Google로 이동 중..."
              : "Google로 로그인"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            className="h-12 w-full rounded-full"
            type="button"
            variant="outline"
            onClick={handleNaverClick}
            disabled={isSubmitting !== null}
          >
            <NaverLogo className="h-4 w-4" />
            {isSubmitting === "naver" ? "오픈 준비 중..." : "Naver 오픈 예정"}
          </Button>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border bg-muted/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                After login
              </p>
              <p className="mt-2 text-sm font-medium">
                내 멤버 연결 후 바로 개인 응답 흐름 사용
              </p>
            </div>
            <div className="rounded-[1.2rem] border bg-muted/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Setup note
              </p>
              <p className="mt-2 text-sm font-medium">
                Google은 즉시 사용 가능, Naver는 순차 오픈
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              로그인 후 달라지는 흐름
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              - 멤버는 자기 계정으로 로그인하고 본인 기준으로 투표와 출석을
              처리합니다.
            </p>
            <p>- 공지 읽음 상태와 응답 기록이 개인 흐름으로 정리됩니다.</p>
            <p>
              - 관리자 계정은 기존 운영 액션을 유지하면서 권한에 맞는 화면만
              노출합니다.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-amber-700" />
              관리자 설정 체크
            </CardTitle>
            <CardDescription>
              Google 로그인이 동작하려면 코드 외에도 Supabase와 Google Cloud
              설정이 모두 맞아야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>- Supabase `Authentication &gt; Providers &gt; Google` 활성화</p>
            <p>- Google Client ID / Secret 입력</p>
            <p>- 서비스 도메인과 redirect URI 일치 확인</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
