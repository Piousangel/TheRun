'use client';

import Link from 'next/link';
import { LogIn, Sparkles, ClipboardList, Vote, Waves } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/shared/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { RevealSection } from './reveal-section';
import { AiSceneCard } from './ai-scene-card';
import { MobileLandingCarousel } from './mobile-landing-carousel';

const landingFeatures = [
  {
    title: '이번 주 참석 여부를 한 번에',
    description: '경기, 회식, 번개까지 한 화면에서 빠르게 응답하고 운영자는 바로 인원 파악을 할 수 있습니다.',
    icon: Vote,
  },
  {
    title: '팀 나누기와 경기 운영을 연결',
    description: '출석 인원 기반으로 팀을 나누고 경기 스코어, 교체, 기록까지 흐름이 이어집니다.',
    icon: ClipboardList,
  },
  {
    title: '실제 동호회 운영에 맞춘 모바일 UX',
    description: '운동장 가는 길, 지하철 안, 경기 직전에도 바로 확인할 수 있게 모바일 중심으로 설계했습니다.',
    icon: Sparkles,
  },
];

const landingWorkflow = [
  { step: '01', title: '로그인 후 내 멤버 연결', body: '개인 계정과 멤버를 연결해 본인 기준 응답 흐름을 시작합니다.' },
  { step: '02', title: '이번 주 응답과 확인', body: '투표와 출석에서 내가 응답했는지, 마감이 얼마나 남았는지 바로 봅니다.' },
  { step: '03', title: '운영자는 경기까지 이어서 관리', body: '팀 편성, 경기 진행, 기록 저장까지 같은 앱 안에서 연결됩니다.' },
];

const landingShowcase = [
  {
    eyebrow: 'Weekly Readiness',
    title: '이번 주 참석 여부를 빠르게 정리',
    body: '경기, 회식, 번개 응답을 같은 흐름으로 모아 운영자가 인원 파악을 즉시 할 수 있게 구성합니다.',
    cardTitle: '이번 주 경기 응답',
    cardBody: '현재 참석 의사 인원과 미응답 인원을 보고 바로 팀 구성을 준비합니다.',
    metrics: ['참석 희망 14명', '미응답 5명', '마감 D-1'],
  },
  {
    eyebrow: 'Match Flow',
    title: '팀 나누기에서 경기 기록까지 한 번에 연결',
    body: '응답 인원 기반 팀 편성, 실시간 경기 운영, 경기 후 기록 저장까지 같은 루틴 안에서 이어집니다.',
    cardTitle: '운영 흐름',
    cardBody: '투표 → 출석 → 팀 구성 → 경기 운영 → 기록 저장',
    metrics: ['자동 밸런싱', '실시간 스코어', '기록 히스토리'],
  },
  {
    eyebrow: 'Mobile First',
    title: '운동장 가는 길에도 바로 쓰는 모바일 UX',
    body: '큰 화면보다 휴대폰 환경을 우선해, 멤버도 운영자도 이동 중에 바로 확인할 수 있게 구성했습니다.',
    cardTitle: '오늘의 체크리스트',
    cardBody: '내 응답 상태, 경기 시간, 운영 가이드를 첫 화면에서 바로 확인합니다.',
    metrics: ['내 응답 중심', '관리자 권한 분리', '한 화면 요약'],
  },
];

const aiScenes = [
  {
    title: 'Floodlit Match Vision',
    subtitle: '야간 경기장의 조명과 역동적인 선수 실루엣을 바탕으로, 경기 운영 보드가 살아 있는 것처럼 보이게 구성한 히어로 장면입니다.',
    accent: 'gold' as const,
    chips: ['조명 강조', '경기장 실루엣', '운영 보드 오버레이'],
  },
  {
    title: 'Tactical Split Engine',
    subtitle: '팀 밸런싱과 전술 보드를 동시에 보여주는 장면으로, 운영자가 팀을 나누는 순간의 긴장감을 시각화합니다.',
    accent: 'emerald' as const,
    chips: ['팀 밸런싱 HUD', '전술 포인트', '라인업 시각화'],
  },
  {
    title: 'Mobile Club Pulse',
    subtitle: '멤버가 휴대폰으로 투표와 공지를 확인하는 흐름을 중심으로, 실제 동호회 사용 장면처럼 구성한 모바일 중심 비주얼입니다.',
    accent: 'blue' as const,
    chips: ['모바일 피드', '읽지 않은 공지', '즉시 응답 흐름'],
  },
];

const mobileLandingSlides = [
  {
    eyebrow: 'Weekly Readiness',
    title: '이번 주 참석 여부를 빠르게 정리',
    body: '경기, 회식, 번개 응답을 같은 흐름으로 모아 운영자가 인원 파악을 즉시 할 수 있게 구성합니다.',
    chips: ['참석 희망 14명', '미응답 5명', '마감 D-1'],
    accent: 'gold' as const,
  },
  {
    eyebrow: 'Match Flow',
    title: '팀 나누기에서 경기 기록까지 한 번에 연결',
    body: '응답 인원 기반 팀 편성, 실시간 경기 운영, 경기 후 기록 저장까지 같은 루틴 안에서 이어집니다.',
    chips: ['자동 밸런싱', '실시간 스코어', '기록 히스토리'],
    accent: 'emerald' as const,
  },
  {
    eyebrow: 'Mobile First',
    title: '운동장 가는 길에도 바로 쓰는 모바일 UX',
    body: '휴대폰 환경을 우선해, 멤버도 운영자도 이동 중에 바로 확인할 수 있게 구성했습니다.',
    chips: ['내 응답 중심', '관리자 권한 분리', '한 화면 요약'],
    accent: 'blue' as const,
  },
  {
    eyebrow: 'Welcome Flow',
    title: '처음 써도 헷갈리지 않는 주간 루틴',
    body: '로그인 → 멤버 연결 → 투표/출석 응답 → 경기 확인 흐름을 단계별로 짧게 보여줍니다.',
    chips: ['로그인 후 연결', '이번 주 응답 확인', '운영자 경기 관리'],
    accent: 'white' as const,
  },
  {
    eyebrow: 'AI Visual Campaign',
    title: '제품 세계관이 더 또렷해지는 축구 비주얼',
    body: '실제 사용 장면이 떠오르도록 축구 경기와 운영 흐름을 AI 캠페인 컷처럼 풀어냅니다.',
    chips: ['Floodlit Match', 'Tactical Split', 'Mobile Club Pulse'],
    accent: 'gold' as const,
  },
];

export function HomePageContent() {
  const { user } = useAuth();

  return (
    <main className="relative overflow-hidden pb-24">
      <section className="editorial-hero relative overflow-hidden border-b border-border/60 text-white">
        <div className="editorial-grid absolute inset-0 opacity-20" />
        <div className="editorial-glow-gold absolute left-0 top-0 h-72 w-72 rounded-full" />
        <div className="editorial-glow-white absolute right-0 top-12 h-56 w-56 rounded-full" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center justify-center gap-6 px-4 py-8 text-center sm:px-8 lg:min-h-[92vh] lg:gap-10 lg:py-14 lg:text-center lg:px-10">
          <Badge className="hidden border border-primary/25 bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/10 md:inline-flex">
            The Run Futsal Club · Beta to Real Club App
          </Badge>

          <div className="space-y-4 md:space-y-5">
            <p className="text-sm font-medium tracking-[0.28em] text-white/55 uppercase">Saturday Operating Board</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-8xl">
              우리 동호회의
              <br />
              <span className="editorial-highlight">주간 운영을 한 화면으로.</span>
            </h1>
            <p className="mx-auto hidden max-w-3xl text-base leading-8 text-white/75 sm:text-lg md:block">
              출석 체크, 투표, 팀 나누기, 경기 기록이 따로 놀지 않게 만들었습니다. 운동 가기 전에 응답하고,
              운영자는 바로 인원과 경기 흐름을 잡고, 경기 후에는 기록까지 이어집니다.
            </p>
          </div>

          <div className="mt-1 flex flex-wrap justify-center gap-3 md:mt-0">
            <Link href={user ? '/dashboard' : '/login'}>
              <Button size="lg" className="rounded-full px-8 shadow-[0_16px_40px_rgba(200,168,88,0.35)]">
                {user ? '앱 열기' : '로그인하고 시작하기'}
                <LogIn className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/club-guide" className="hidden md:inline-flex">
              <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 text-white hover:bg-white/20 hover:text-white">
                운영 가이드 보기
              </Button>
            </Link>
          </div>

          <div className="grid hidden w-full max-w-4xl gap-3 sm:grid-cols-3 md:grid">
            {[
              { label: 'Weekly Flow', value: 'Vote → Attendance → Match' },
              { label: 'Member Experience', value: '내 응답 중심' },
              { label: 'Admin Control', value: '운영 권한 분리' },
            ].map((item) => (
              <div key={item.label} className="glass-panel rounded-3xl p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/50">{item.label}</p>
                <p className="mt-3 text-base font-medium text-white/90">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="hidden w-full max-w-xl rounded-[2rem] border border-white/15 bg-black/40 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl md:block">
            <div className="editorial-preview rounded-[1.5rem] p-5 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-[0.22em] text-primary/80 uppercase">Saturday Run</p>
                  <p className="mt-2 text-xl font-semibold text-white">이번 주 운영 보드</p>
                </div>
                <Waves className="h-5 w-5 text-primary" />
              </div>

              <div className="mt-5 grid gap-3">
                <div className="glass-panel-soft rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">경기 투표</p>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">마감 임박</Badge>
                  </div>
                  <p className="mt-2 text-sm text-white/70">누가 오는지 바로 확인하고, 운영자는 인원 기반으로 팀을 나눕니다.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="glass-panel-soft rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Lineup</p>
                    <p className="mt-2 text-lg font-semibold text-white">자동 밸런싱</p>
                    <p className="mt-1 text-sm text-white/70">스탯 기준 팀 구성</p>
                  </div>
                  <div className="glass-panel-soft rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Match</p>
                    <p className="mt-2 text-lg font-semibold text-white">실시간 기록</p>
                    <p className="mt-1 text-sm text-white/70">스코어/교체/기록 저장</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:hidden">
            <MobileLandingCarousel slides={mobileLandingSlides} />
          </div>
        </div>
      </section>

      <section className="mx-auto hidden max-w-6xl space-y-16 px-4 py-16 sm:px-8 lg:px-10 md:block">
        {landingShowcase.slice(0, 2).map((item, index) => (
          <RevealSection key={item.title} className={cn('grid gap-8 lg:grid-cols-2 lg:items-center', index % 2 === 1 && 'lg:[&>*:first-child]:order-2')}>
            <div className="space-y-4">
              <p className="text-sm font-medium text-primary uppercase tracking-[0.22em]">{item.eyebrow}</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{item.title}</h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">{item.body}</p>
            </div>
            <div className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="glass-panel-soft rounded-[1.5rem] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Preview</p>
                    <p className="mt-2 text-xl font-semibold">{item.cardTitle}</p>
                  </div>
                  {index === 0 ? <Vote className="h-5 w-5 text-primary" /> : index === 1 ? <ClipboardList className="h-5 w-5 text-primary" /> : <Sparkles className="h-5 w-5 text-primary" />}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/70">{item.cardBody}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {item.metrics.map((metric) => (
                    <div key={metric} className="metric-chip rounded-2xl p-3 text-sm text-white/85">{metric}</div>
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>
        ))}
      </section>

      <section className="mx-auto hidden max-w-6xl space-y-8 px-4 py-8 sm:px-8 lg:px-10 md:block">
        <RevealSection className="text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-[0.24em]">AI Visual Campaign</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">길게 읽기보다, 빠르게 감이 오게.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            실제 사용 장면이 떠오르게 만드는 비주얼만 남기고, 긴 설명은 줄였습니다. 제품 감각은 유지하고 피로는 낮추는 방향입니다.
          </p>
        </RevealSection>
        <div className="grid gap-6 lg:grid-cols-2">
          {aiScenes.slice(0, 2).map((scene) => (
            <RevealSection key={scene.title}>
              <AiSceneCard {...scene} />
            </RevealSection>
          ))}
        </div>
      </section>

      <section className="hidden bg-muted/40 py-12 md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Why It Works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">핵심만 남긴 운영 원칙</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              실제 사용 관점에서 중요한 건 화려함보다 빠른 판단입니다. 그래서 기능보다 흐름과 우선순위를 먼저 보이게 설계합니다.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {landingFeatures.map(({ title, description, icon: Icon }, index) => {
              const workflow = landingWorkflow[index];
              return (
              <RevealSection key={title}>
                <Card className="overflow-hidden border-border/70 bg-background/90">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="pt-4 text-xs font-semibold tracking-[0.22em] text-primary">STEP {workflow?.step}</div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <CardDescription className="leading-6">{description}</CardDescription>
                    <p className="text-sm leading-6 text-muted-foreground">{workflow?.body}</p>
                  </CardHeader>
                </Card>
              </RevealSection>
            )})}
          </div>
        </div>
      </section>
    </main>
  );
}
