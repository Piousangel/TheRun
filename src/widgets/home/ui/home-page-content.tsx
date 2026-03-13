"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, LogIn, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  MobileLandingCarousel,
  type MobileLandingSlide,
} from "./mobile-landing-carousel";

const splashDurationMs = 2000;

function TheRunMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="11" r="6" fill="currentColor" />
      <path
        d="M34 22L41 19L49 26"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M41 19L35 32L25 39"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 31L48 35L56 28"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 32L30 50"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46 35L52 51"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const landingSlides: MobileLandingSlide[] = [
  {
    eyebrow: "Saturday Readiness",
    title: "이번 주 인원 파악을 가장 먼저 보여줍니다.",
    body: "누가 오는지, 누가 아직 응답하지 않았는지, 언제 마감되는지 첫 화면에서 바로 감이 오게 정리합니다.",
    chips: ["참석 예정 14", "미응답 5", "마감 D-1"],
    accent: "gold",
    kicker: "멤버와 운영자가 같은 흐름을 함께 봅니다.",
    metrics: [
      { label: "Weekly pulse", value: "Attendance first" },
      { label: "Decision speed", value: "15 sec check" },
    ],
  },
  {
    eyebrow: "Match Direction",
    title: "팀 나누기부터 경기 운영까지 같은 리듬으로.",
    body: "투표와 출석이 끝나면 바로 팀 구성을 이어가고, 경기 중에는 점수와 교체 흐름까지 하나로 연결합니다.",
    chips: ["자동 밸런싱", "실시간 점수", "교체 기록"],
    accent: "emerald",
    kicker: "운영 보드처럼 차분하지만 판단은 빠르게.",
    metrics: [
      { label: "Team split", value: "Balanced live" },
      { label: "Match ops", value: "Score + subs" },
    ],
  },
  {
    eyebrow: "Mobile Ritual",
    title: "지하철에서도 바로 쓰는 모바일 중심 UX.",
    body: "운동장 가는 길에 한 손으로 응답하고, 운영자는 도착 전에 전체 흐름을 정리할 수 있게 화면을 낮고 크게 설계했습니다.",
    chips: ["한 손 조작", "큰 타이포", "낮은 액션 존"],
    accent: "blue",
    kicker: "읽는 화면보다 움직이는 루틴에 가깝게.",
    metrics: [
      { label: "Reach zone", value: "Bottom anchored" },
      { label: "Noise", value: "Reduced" },
    ],
  },
  {
    eyebrow: "Welcome Back",
    title: "로그인 후 바로 우리 동호회 루틴 안으로 들어갑니다.",
    body: "개인 계정으로 로그인하고 내 멤버를 연결한 뒤, 이번 주 응답과 경기 흐름을 내 기준으로 바로 이어서 봅니다.",
    chips: ["Google 즉시 연결", "내 멤버 기준", "운영자 권한 분리"],
    accent: "white",
    kicker: "설명은 줄이고 시작 버튼은 더 또렷하게.",
    metrics: [
      { label: "Access", value: "Google first" },
      { label: "After login", value: "Go to dashboard" },
    ],
  },
];

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return reducedMotion;
}

function LandingBootScreen() {
  return (
    <motion.div
      data-testid="boot-logo-screen"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      }}
      className="landing-noise fixed inset-0 z-50 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(214,180,83,0.18),transparent_34%),linear-gradient(180deg,#050505_0%,#0b0b0e_48%,#151518_100%)]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_50%_70%,rgba(255,255,255,0.04),transparent_24%)] opacity-70" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.1 }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/6"
      />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-white">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 18 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-40 w-40 items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-[48px]" />
            <motion.div
              animate={{
                opacity: [0.18, 0.42, 0.18],
                scale: [0.96, 1.03, 0.96],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-4 rounded-full border border-primary/18"
            />
            <TheRunMark className="relative h-24 w-24 text-white drop-shadow-[0_0_22px_rgba(200,168,88,0.42)]" />
          </motion.div>

          <div className="space-y-3 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-white/50">
              The Run
            </p>
            <h1 className="text-5xl font-semibold tracking-[0.04em] text-white sm:text-6xl">
              THE RUN
            </h1>
            <p className="text-xs tracking-[0.28em] text-white/42 uppercase">
              Matchday Operating System
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function HomePageContent() {
  const { user } = useAuth();
  const reducedMotion = usePrefersReducedMotion();
  const [showBootScreen, setShowBootScreen] = useState(true);

  useEffect(() => {
    if (reducedMotion) {
      setShowBootScreen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowBootScreen(false);
    }, splashDurationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [reducedMotion]);

  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "앱 바로 열기" : "로그인하고 시작하기";
  const secondaryLabel = user ? "운영 가이드 보기" : "동호회 운영 흐름 보기";
  const activeStatus = useMemo(
    () =>
      user
        ? "이미 연결된 계정으로 진입할 수 있습니다."
        : "Google로 빠르게 로그인한 뒤 바로 이어서 사용할 수 있습니다.",
    [user],
  );

  return (
    <>
      <AnimatePresence>
        {showBootScreen ? <LandingBootScreen /> : null}
      </AnimatePresence>

      <main className="landing-noise relative min-h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,84,0.13),transparent_28%),linear-gradient(180deg,#060606_0%,#111114_46%,#19181a_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.16]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-sky-400/10 blur-[120px]" />

        <section className="relative mx-auto min-h-[100svh] w-full max-w-7xl px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4 sm:px-6 md:px-8 lg:px-10 lg:pb-10 lg:pt-6">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-4 sm:inset-x-6 md:inset-x-8 lg:inset-x-10 lg:top-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/7 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <TheRunMark className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.36em] text-white/46">
                  The Run
                </p>
                <p className="mt-1 text-sm font-medium text-white/88">
                  Club Flow
                </p>
              </div>
            </div>

            <Badge className="border-white/10 bg-white/6 px-3.5 py-1.5 text-[10px] font-medium tracking-[0.28em] text-white/66 shadow-none backdrop-blur-xl hover:bg-white/6">
              SATURDAY READY
            </Badge>
          </motion.div>

          <div className="absolute inset-0">
            <MobileLandingCarousel
              slides={landingSlides}
              reducedMotion={reducedMotion}
            />
          </div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
              delay: reducedMotion ? 0 : 0.15,
            }}
            data-testid="login-cta"
            className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-10 sm:inset-x-6 md:inset-x-8 lg:inset-x-10 lg:bottom-8"
          >
            <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/42 p-3 shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-4 lg:p-5">
              <div className="flex flex-col gap-4 rounded-[1.65rem] border border-white/8 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between lg:p-6">
                <div className="space-y-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-primary/80">
                    Welcome Flow
                  </p>
                  <div className="space-y-2">
                    <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                      처음 진입은 더 짧게, 시작 버튼은 더 아래로.
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-white/64 sm:text-[15px] sm:leading-7">
                      {activeStatus}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-white/58">
                    <span className="landing-chip">하단 안전 영역 최적화</span>
                    <span className="landing-chip">
                      자동 슬라이드 + 직접 스와이프
                    </span>
                    <span className="landing-chip">설명보다 빠른 진입</span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                  <Button
                    asChild
                    className="h-12 w-full rounded-full px-6 text-sm font-semibold shadow-[0_18px_40px_rgba(200,168,88,0.35)] sm:h-12 sm:flex-1 sm:px-7 lg:w-auto lg:flex-none"
                  >
                    <Link href={primaryHref} className="w-full">
                      {primaryLabel}
                      {user ? (
                        <ArrowRight className="h-4 w-4" />
                      ) : (
                        <LogIn className="h-4 w-4" />
                      )}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full rounded-full border-white/14 bg-white/6 px-6 text-sm font-medium text-white hover:bg-white/10 hover:text-white sm:h-12 sm:flex-1 sm:px-7 lg:w-auto lg:flex-none"
                  >
                    <Link href="/club-guide" className="w-full">
                      {secondaryLabel}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-3 flex max-w-5xl flex-wrap items-center justify-between gap-3 px-1 text-xs text-white/56 sm:px-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary/80" />
                <span>Google 우선 로그인, 멤버 연결 후 내 흐름으로 진입</span>
              </div>
              <div className="flex items-center gap-2 text-white/52">
                <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                <span>New landing sequence</span>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}
