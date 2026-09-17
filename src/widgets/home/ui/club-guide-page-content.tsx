"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Trophy,
  UserPlus,
  Vote,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { TheRunLogo } from "@/shared/ui/the-run-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const onboardingChecklist = [
  "이메일 링크 로그인으로 내 계정 생성",
  "내 계정에서 내 이름과 전화번호 연결",
  "이번 주 투표/출석 화면에서 내 응답 완료",
  "경기 기록과 팀 나누기 흐름 확인",
];

const weeklyOps = [
  {
    title: "월~목",
    body: "운영자는 경기 또는 모임 투표를 열고 멤버들은 각자 응답합니다.",
    icon: Vote,
  },
  {
    title: "금요일",
    body: "출석 확정 인원을 확인하고 팀 편성 또는 경기 수를 조정합니다.",
    icon: CalendarDays,
  },
  {
    title: "토요일",
    body: "팀 나누기 → 경기 진행 → 기록 저장 순으로 앱을 운영합니다.",
    icon: Trophy,
  },
];

const adminRoles = [
  "멤버 정보와 운영 권한 관리",
  "투표/출석 세션 생성 및 정리",
  "팀 나누기와 경기 운영",
  "기록 정리 및 다음 주 준비",
];

export function ClubGuidePageContent() {
  return (
    <div className="bg-gradient-to-b from-stone-50 to-white">
      <section className="editorial-hero relative overflow-hidden border-b border-border/70 text-white">
        <div className="editorial-glow-gold absolute left-0 top-0 h-64 w-64 rounded-full" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-3 py-2 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/10">
                <TheRunLogo className="h-6 w-6" tone="light" glow />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary/75">
                  Club Guide
                </p>
                <p className="mt-0.5 text-xs text-white/76">
                  Runner-first operating playbook
                </p>
              </div>
            </div>
            <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
              Weekly routine
            </Badge>
            <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
              Onboarding ready
            </Badge>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            The Run 운영 가이드
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            새 멤버 온보딩, 주간 운영 루틴, 경기 당일 동선을 한 페이지에
            정리했습니다. 운영이 바쁠수록 정리된 기준이 필요하다는 점을
            반영했습니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6">
              <Link href="/">대시보드로 돌아가기</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/20 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/me">내 계정 열기</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="section-surface border-primary/15">
            <CardHeader>
              <CardTitle className="text-2xl">신규 멤버 체크리스트</CardTitle>
              <CardDescription>
                처음 들어온 사람도 앱 안에서 무엇을 해야 하는지 바로 알 수 있게
                정리했습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {onboardingChecklist.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border bg-background/80 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-sm leading-6">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-[linear-gradient(160deg,rgba(255,249,235,0.98),rgba(255,255,255,0.98))]">
            <CardHeader>
              <CardTitle className="text-2xl">운영자 역할 정리</CardTitle>
              <CardDescription>
                실제 운영에서 자주 하는 일만 남기고, 앱 권한도 그 기준에 맞춰
                분리했습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {adminRoles.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-primary/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                >
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-sm font-medium leading-6">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,246,236,0.94))]">
          <CardHeader>
            <CardTitle className="text-2xl">주간 운영 루틴</CardTitle>
            <CardDescription>
              최신 팀 운영 앱들이 강한 부분은 복잡한 기능보다 반복되는 루틴을
              쉽게 만드는 점입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
              {weeklyOps.map(({ title, body, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-primary/10 bg-background p-5 shadow-sm"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-lg font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/members",
              title: "멤버 관리",
              body: "새 멤버 등록과 권한 운영",
              icon: UserPlus,
            },
            {
              href: "/votes",
              title: "투표 / 출석",
              body: "응답 상태와 마감 확인",
              icon: Vote,
            },
            {
              href: "/matches",
              title: "경기 기록",
              body: "진행 상태와 저장된 결과 보기",
              icon: Trophy,
            },
          ].map(({ href, title, body, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="pt-2 text-xl">{title}</CardTitle>
                  <CardDescription>{body}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="px-0 text-primary">
                    바로 이동
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="section-surface border-primary/15">
          <CardHeader>
            <CardTitle className="text-2xl">추천 운영 순서</CardTitle>
            <CardDescription>
              실제 앱 사용 시 가장 무난하고 덜 꼬이는 순서입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { label: "투표 열기", icon: Vote },
                { label: "출석 인원 확인", icon: CalendarDays },
                { label: "팀 나누기", icon: ClipboardList },
                { label: "경기 운영 및 기록", icon: Trophy },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border bg-background/80 p-4 text-center"
                >
                  <Icon className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
