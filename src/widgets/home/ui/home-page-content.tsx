'use client';

import Link from 'next/link';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LogIn,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  Users,
  Vote,
  Waves,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useMembers } from '@/entities/member/model/queries';
import { useActiveVoteSessions, useVoteResponses, useVoteSessions } from '@/entities/vote/model/queries';
import { useCurrentAttendanceSession, useAttendanceVotes } from '@/entities/attendance/model/queries';
import { useMatches } from '@/entities/match/model/queries';
import { useAnnouncements, useAnnouncementReads } from '@/entities/announcement/model/queries';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { RevealSection } from './reveal-section';
import { AiSceneCard } from './ai-scene-card';

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
  {
    step: '01',
    title: '로그인 후 내 멤버 연결',
    body: '이메일 링크로 들어와서 내 이름과 번호를 연결하면 개인 기준 흐름이 시작됩니다.',
  },
  {
    step: '02',
    title: '이번 주 응답과 확인',
    body: '투표와 출석에서 내가 응답했는지, 마감이 얼마나 남았는지 바로 볼 수 있습니다.',
  },
  {
    step: '03',
    title: '운영자는 경기까지 이어서 관리',
    body: '팀 편성, 경기 진행, 기록 저장까지 같은 앱 안에서 연결됩니다.',
  },
];

const guideHighlights = [
  '신규 멤버 온보딩 체크리스트',
  '주간 운영 루틴 정리',
  '경기 당일 담당 역할 가이드',
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

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  const relative = formatDistanceToNowStrict(date, { addSuffix: true, locale: ko });
  return `${format(date, 'M월 d일 HH:mm', { locale: ko })} · ${relative}`;
}

export function HomePageContent() {
  const { user, member, isAdmin, isLinked } = useAuth();
  const { data: members } = useMembers();
  const { data: activeVoteSessions } = useActiveVoteSessions();
  const { data: voteSessions } = useVoteSessions();
  const { data: attendanceSession } = useCurrentAttendanceSession();
  const { data: matches } = useMatches();
  const { data: announcements } = useAnnouncements();
  const { data: announcementReads } = useAnnouncementReads(user?.id ?? null);

  const activeVoteSession = activeVoteSessions?.[0] ?? null;
  const { data: activeVoteResponses } = useVoteResponses(activeVoteSession?.id ?? '');
  const { data: attendanceVotes } = useAttendanceVotes(attendanceSession?.id ?? '');

  const myVote = activeVoteSession && member
    ? activeVoteResponses?.find((response) => response.member_id === member.id)?.status ?? null
    : null;
  const myAttendance = attendanceSession && member
    ? attendanceVotes?.find((response) => response.member_id === member.id)?.status ?? null
    : null;

  const totalMembers = members?.length ?? 0;
  const totalVoteSessions = voteSessions?.length ?? 0;
  const totalMatches = matches?.length ?? 0;
  const attendingCount = activeVoteResponses?.filter((response) => response.status === 'attending').length ?? 0;
  const attendanceConfirmedCount = attendanceVotes?.filter((response) => response.status === 'attending').length ?? 0;
  const latestMatch = matches?.[0] ?? null;
  const liveMatch = matches?.find((match) => match.status === 'in_progress') ?? null;
  const pendingMatch = matches?.find((match) => match.status === 'pending') ?? null;
  const latestAnnouncements = announcements?.slice(0, 3) ?? [];
  const unreadAnnouncementCount = latestAnnouncements.filter(
    (announcement) => !(announcementReads ?? []).some((read) => read.announcement_id === announcement.id)
  ).length;

  if (!user) {
    return (
      <main className="relative overflow-hidden pb-24">
        <section className="editorial-hero relative overflow-hidden border-b border-border/60 text-white">
          <div className="editorial-grid absolute inset-0 opacity-20" />
          <div className="editorial-glow-gold absolute left-0 top-0 h-72 w-72 rounded-full" />
          <div className="editorial-glow-white absolute right-0 top-12 h-56 w-56 rounded-full" />
          <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col items-center justify-center gap-10 px-4 py-14 text-center sm:px-8 lg:px-10">
            <Badge className="border border-primary/25 bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/10">
              The Run Futsal Club · Beta to Real Club App
            </Badge>

            <div className="space-y-5">
              <p className="text-sm font-medium tracking-[0.28em] text-white/55 uppercase">Saturday Operating Board</p>
              <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-8xl">
                우리 동호회의
                <br />
                <span className="editorial-highlight">
                  주간 운영을 한 화면으로.
                </span>
              </h1>
              <p className="mx-auto max-w-3xl text-base leading-8 text-white/75 sm:text-lg">
                출석 체크, 투표, 팀 나누기, 경기 기록이 따로 놀지 않게 만들었습니다. 운동 가기 전에 응답하고,
                운영자는 바로 인원과 경기 흐름을 잡고, 경기 후에는 기록까지 이어집니다.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login">
                <Button size="lg" className="rounded-full px-8 shadow-[0_16px_40px_rgba(200,168,88,0.35)]">
                  로그인하고 시작하기
                  <LogIn className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/club-guide">
                <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 text-white hover:bg-white/20 hover:text-white">
                  운영 가이드 보기
                </Button>
              </Link>
            </div>

            <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
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

            <div className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-black/40 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
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
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-20 px-4 py-20 sm:px-8 lg:px-10">
          {landingShowcase.map((item, index) => (
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
                      <div key={metric} className="metric-chip rounded-2xl p-3 text-sm text-white/85">
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </section>

        <section className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-8 lg:px-10">
          <RevealSection className="text-center">
            <p className="text-sm font-medium text-primary uppercase tracking-[0.24em]">AI Visual Campaign</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">스크롤할수록 제품 세계관이 더 또렷해지도록.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              단순한 기능 설명보다, 실제로 이 앱을 쓰는 장면이 떠오르게 만드는 비주얼이 필요합니다. 그래서 축구 경기와 운영 흐름을 AI 캠페인 컷처럼 풀어낸 섹션을 추가합니다.
            </p>
          </RevealSection>

          <div className="space-y-8">
            {aiScenes.map((scene) => (
              <RevealSection key={scene.title}>
                <AiSceneCard {...scene} />
              </RevealSection>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-8 lg:px-10">
          <div className="grid gap-4 md:grid-cols-3">
            {landingFeatures.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="border-primary/15 bg-gradient-to-br from-card via-card to-primary/5 shadow-[0_14px_50px_rgba(0,0,0,0.05)]">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="pt-4 text-xl">{title}</CardTitle>
                  <CardDescription className="text-sm leading-6">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/40 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Welcome Flow</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">처음 써도 헷갈리지 않는 주간 루틴</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                최신 팀 운영 앱들이 공통으로 잘하는 건 화려함보다 흐름 정리입니다. 그래서 첫 사용자가 해야 할 일을 단계별로 짧게 보여줍니다.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {landingWorkflow.map((item) => (
                <RevealSection key={item.step}>
                  <Card className="overflow-hidden border-border/70 bg-background/90">
                  <CardHeader>
                    <div className="text-xs font-semibold tracking-[0.22em] text-primary">STEP {item.step}</div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="leading-6">{item.body}</CardDescription>
                  </CardHeader>
                  </Card>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.12),rgba(255,255,255,0.7))]">
              <CardHeader>
                <CardTitle className="text-2xl">운영자에게 필요한 건 결국 두 가지</CardTitle>
                <CardDescription className="leading-6">
                  누가 오는지 빨리 파악하는 것, 그리고 그날 경기를 매끄럽게 굴리는 것입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <div className="flex items-start gap-3 rounded-2xl border bg-background/70 p-4">
                  <Target className="mt-0.5 h-4 w-4 text-primary" />
                  <p>투표/출석/팀 편성/경기 기록이 한 주기 안에서 이어지도록 연결합니다.</p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border bg-background/70 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <p>일반 멤버는 자기 응답만, 운영자는 생성/삭제/경기 운영만 하도록 권한을 분리했습니다.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-2xl">추가로 준비한 유용한 진입점</CardTitle>
                <CardDescription>단순 기능 나열이 아니라, 실제 사용할 때 도움이 되는 보조 기능입니다.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {guideHighlights.map((item) => (
                  <div key={item} className="rounded-2xl border bg-muted/40 p-4">
                    <Star className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-sm font-medium leading-6">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <section className="editorial-hero relative overflow-hidden border-b border-border/70 text-white">
        <div className="editorial-glow-gold absolute left-0 top-0 h-64 w-64 rounded-full" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge className="border border-white/15 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                {isAdmin ? 'Admin Dashboard' : 'Member Dashboard'}
              </Badge>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-primary/85">Saturday Operating Board</p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
                  {member ? `${member.name}님, 이번 주 준비 상태를 확인하세요.` : '실제 동호회 운영용 대시보드'}
                </h1>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                투표, 출석, 경기, 멤버 운영을 주간 단위로 정리했습니다. 필요한 액션과 지금 상태를 한 번에 볼 수 있게 바꿨습니다.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={isLinked ? '/votes' : '/me'}>
                  <Button size="lg" className="rounded-full px-6">
                    {isLinked ? '이번 주 응답 확인' : '내 멤버 연결하기'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/club-guide">
                  <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white">
                    운영 가이드
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
              {[
                { label: '멤버', value: totalMembers || '-', icon: Users },
                { label: '투표 세션', value: totalVoteSessions || '-', icon: Vote },
                { label: '경기 기록', value: totalMatches || '-', icon: Trophy },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="glass-panel rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/50">{label}</span>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-4 text-3xl font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="section-surface overflow-hidden border-primary/15">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl">이번 주 핵심 상태</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    지금 바로 처리해야 할 응답과 경기 상황을 우선순위대로 배치했습니다.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{isAdmin ? '운영자 모드' : '일반 멤버 모드'}</Badge>
                  <Badge className={cn('border px-3 py-1', isLinked ? 'border-primary/20 bg-primary/10 text-primary' : 'border-amber-300/40 bg-amber-100/70 text-amber-900')}>
                    {isLinked ? '멤버 연결 완료' : '멤버 연결 필요'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border bg-background/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">활성 투표</p>
                    <h3 className="mt-2 text-xl font-semibold">{activeVoteSession?.title ?? '현재 진행 중인 투표 없음'}</h3>
                  </div>
                  <Vote className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  {activeVoteSession ? (
                    <>
                      <p className="text-muted-foreground">마감: {formatDeadline(activeVoteSession.deadline)}</p>
                      <p className="font-medium text-foreground">
                        {member
                          ? myVote
                            ? `내 응답: ${myVote === 'attending' ? '참석' : '불참'}`
                            : '아직 내 응답이 없습니다.'
                          : '멤버 연결 후 내 응답을 사용할 수 있습니다.'}
                      </p>
                      <p className="text-muted-foreground">현재 참석 의사 표시: {attendingCount}명</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">새 투표가 열리면 이곳에서 바로 확인할 수 있습니다.</p>
                  )}
                </div>
                <div className="mt-5 flex gap-2">
                  <Link href={activeVoteSession ? `/votes/${activeVoteSession.id}` : '/votes'}>
                    <Button size="sm">투표 열기</Button>
                  </Link>
                  {!isLinked && <Link href="/me"><Button size="sm" variant="outline">내 계정 연결</Button></Link>}
                </div>
              </div>

              <div className="rounded-3xl border bg-secondary p-5 text-secondary-foreground shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm text-secondary-foreground/80">주간 출석 보드</p>
                    <h3 className="mt-2 text-xl font-semibold">
                      {attendanceSession ? '현재 출석 세션 진행 중' : '열린 출석 세션 없음'}
                    </h3>
                  </div>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4 space-y-3 text-sm text-secondary-foreground/90">
                  {attendanceSession ? (
                    <>
                      <p>
                        경기일: {format(new Date(attendanceSession.match_date), 'M월 d일 (EEE) HH:mm', { locale: ko })}
                      </p>
                      <p>
                        {member
                          ? myAttendance
                            ? `내 출석 응답: ${myAttendance === 'attending' ? '참석' : '불참'}`
                            : '아직 출석 응답을 하지 않았습니다.'
                          : '멤버 연결 후 내 출석 응답을 사용할 수 있습니다.'}
                      </p>
                      <p>출석 확정 인원: {attendanceConfirmedCount}명</p>
                    </>
                  ) : (
                    <p>관리자가 출석 세션을 열면 바로 이곳에서 상태를 확인할 수 있습니다.</p>
                  )}
                </div>
                <div className="mt-5">
                  <Link href="/attendance">
                    <Button size="sm" variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                      출석 보드 보기
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">맞춤 체크리스트</CardTitle>
              <CardDescription>오늘 이 앱에서 해야 할 일을 바로 확인할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  done: !!user,
                  label: '로그인 상태 확인',
                  helper: user?.email ?? '로그인 후 개인 흐름이 활성화됩니다.',
                },
                {
                  done: isLinked,
                  label: '내 멤버 연결',
                  helper: isLinked ? `${member?.name ?? '연결 완료'}로 응답 가능` : '내 계정에서 전화번호 확인 후 연결하세요.',
                },
                {
                  done: !!myVote || !activeVoteSession,
                  label: '이번 주 투표 응답',
                  helper: activeVoteSession ? (myVote ? '응답 완료' : '아직 응답이 필요합니다.') : '진행 중인 투표 없음',
                },
                {
                  done: !!myAttendance || !attendanceSession,
                  label: '출석 응답 확인',
                  helper: attendanceSession ? (myAttendance ? '응답 완료' : '필요 시 출석 응답하세요.') : '진행 중인 출석 없음',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
                  <CheckCircle2 className={cn('mt-0.5 h-5 w-5', item.done ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">경기 허브</CardTitle>
              <CardDescription>실시간 경기나 최근 기록을 가장 먼저 보여줍니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-muted-foreground">지금 경기 상태</p>
                  <p className="mt-2 text-lg font-semibold">
                    {liveMatch ? `${liveMatch.match_number ?? '-'}경기 진행 중` : pendingMatch ? `${pendingMatch.match_number ?? '-'}경기 대기 중` : '예정된 경기 없음'}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {liveMatch || pendingMatch
                      ? `${format(new Date((liveMatch ?? pendingMatch)!.date), 'M월 d일 (EEE) HH:mm', { locale: ko })} · ${(liveMatch ?? pendingMatch)!.location}`
                      : '경기 생성 후 이곳에 바로 표시됩니다.'}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-muted-foreground">최근 저장 기록</p>
                  <p className="mt-2 text-lg font-semibold">
                    {latestMatch ? `${latestMatch.team_a.score} : ${latestMatch.team_b.score}` : '아직 경기 기록 없음'}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {latestMatch
                      ? `${format(new Date(latestMatch.date), 'M월 d일 (EEE)', { locale: ko })} · ${latestMatch.location}`
                      : '첫 경기를 기록하면 히스토리가 쌓이기 시작합니다.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/matches"><Button size="sm">경기 보드 열기</Button></Link>
                {isAdmin && <Link href="/team-division"><Button size="sm" variant="outline">팀 나누기</Button></Link>}
              </div>
            </CardContent>
          </Card>

          <Card className="section-surface border-primary/15">
            <CardHeader>
              <CardTitle className="text-2xl">{isAdmin ? '운영자 콕핏' : '멤버 빠른 동선'}</CardTitle>
              <CardDescription>
                {isAdmin
                  ? '실제 운영에서 자주 반복하는 작업을 짧은 액션으로 배치했습니다.'
                  : '운동 전에 자주 들어오는 화면을 빠르게 이어갈 수 있게 묶었습니다.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {(isAdmin
                ? [
                    { href: '/members', title: '멤버 관리', body: '신규 멤버 등록, 수정, 정리', icon: Users },
                    { href: '/votes', title: '투표 열기', body: '이번 주 경기/회식 응답 운영', icon: Vote },
                    { href: '/attendance', title: '출석 현황', body: '실제 출석 여부와 응답 확인', icon: CalendarDays },
                    { href: '/matches', title: '경기 진행', body: '실시간 운영과 기록 저장', icon: Trophy },
                  ]
                : [
                    { href: '/votes', title: '내 투표 확인', body: '이번 주 응답 상태와 마감 확인', icon: Vote },
                    { href: '/announcements', title: '공지 보기', body: '운영 공지와 일정 변경 확인', icon: BellRing },
                    { href: '/attendance', title: '내 출석 확인', body: '출석 세션 상태와 내 응답 확인', icon: CalendarDays },
                    { href: '/matches', title: '경기 기록 보기', body: '최근 경기 결과와 스코어 확인', icon: Trophy },
                    { href: '/me', title: '내 계정', body: '멤버 연결과 권한 상태 확인', icon: UserRound },
                  ]).map(({ href, title, body, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className="h-full rounded-2xl border bg-background/80 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-3 font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-2xl">운영 가이드와 추가 도움</CardTitle>
                <CardDescription className="mt-2 leading-6">
                  최신 스포츠 팀 앱들처럼 정보가 흩어지지 않게, 자주 필요한 운영 가이드를 별도 페이지로 정리했습니다.
                </CardDescription>
              </div>
              <Link href="/club-guide">
                <Button variant="outline" className="w-full sm:w-auto">
                  가이드 열기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {guideHighlights.map((item) => (
              <div key={item} className="rounded-2xl border bg-muted/30 p-4">
                <Clock3 className="h-4 w-4 text-primary" />
                <p className="mt-3 text-sm font-medium leading-6">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-2xl">공지와 알림</CardTitle>
                <CardDescription className="mt-2 leading-6">
                  일정 변경, 경기 공지, 긴급 안내를 홈에서 바로 확인할 수 있게 붙였습니다.
                </CardDescription>
              </div>
              <Link href="/announcements">
                <Button variant="outline" className="w-full sm:w-auto">
                  공지 보드 열기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">최근 공지 {latestAnnouncements.length}개</Badge>
              <Badge className={cn('border px-3 py-1', unreadAnnouncementCount > 0 ? 'border-amber-300/40 bg-amber-100/70 text-amber-900' : 'border-primary/20 bg-primary/10 text-primary')}>
                읽지 않은 공지 {unreadAnnouncementCount}개
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {latestAnnouncements.length > 0 ? (
                latestAnnouncements.map((announcement) => {
                  const isUnread = !(announcementReads ?? []).some((read) => read.announcement_id === announcement.id);

                  return (
                    <div key={announcement.id} className="rounded-2xl border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold leading-6">{announcement.title}</p>
                        {isUnread && <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">NEW</Badge>}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{announcement.body}</p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-3">
                  아직 등록된 공지가 없습니다. 운영 공지나 시간 변경 사항이 생기면 이곳에 요약됩니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
