'use client';

import Link from 'next/link';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowRight,
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
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

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

  if (!user) {
    return (
      <main className="relative overflow-hidden pb-24">
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-zinc-950 via-zinc-900 to-stone-100 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-0 top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto flex min-h-[82vh] max-w-7xl flex-col justify-between gap-12 px-4 py-8 sm:px-8 lg:px-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/90">The Run Futsal Club</p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">
                  우리 동호회의
                  <br />
                  주간 운영을 한 화면으로.
                </h1>
              </div>
              <Badge className="hidden border border-white/20 bg-white/10 px-3 py-1 text-white sm:inline-flex">
                Beta to Real Club App
              </Badge>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
              <div className="space-y-6">
                <p className="max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                  출석 체크, 투표, 팀 나누기, 경기 기록이 따로 놀지 않게 만들었습니다. 운동 가기 전에 응답하고,
                  운영자는 바로 인원과 경기 흐름을 잡고, 경기 후에는 기록까지 이어집니다.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link href="/login">
                    <Button size="lg" className="rounded-full px-7 shadow-[0_16px_40px_rgba(200,168,88,0.35)]">
                      로그인하고 시작하기
                      <LogIn className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/club-guide">
                    <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-7 text-white hover:bg-white/20 hover:text-white">
                      운영 가이드 보기
                    </Button>
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Weekly Flow', value: 'Vote → Attendance → Match' },
                    { label: 'Member Experience', value: '내 응답 중심' },
                    { label: 'Admin Control', value: '운영 권한 분리' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">{item.label}</p>
                      <p className="mt-2 text-sm font-medium text-white/90">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -right-3 -top-6 h-28 w-28 rounded-full bg-primary/30 blur-3xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-zinc-950/85 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(200,168,88,0.14),rgba(255,255,255,0.03))] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs tracking-[0.22em] text-primary/80">SATURDAY RUN</p>
                        <p className="mt-2 text-xl font-semibold">이번 주 운영 보드</p>
                      </div>
                      <Waves className="h-5 w-5 text-primary" />
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">경기 투표</p>
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/20">마감 임박</Badge>
                        </div>
                        <p className="mt-2 text-sm text-white/70">누가 오는지 바로 확인하고, 운영자는 인원 기반으로 팀을 나눕니다.</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Lineup</p>
                          <p className="mt-2 text-lg font-semibold">자동 밸런싱</p>
                          <p className="mt-1 text-sm text-white/70">스탯 기준 팀 구성</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Match</p>
                          <p className="mt-2 text-lg font-semibold">실시간 기록</p>
                          <p className="mt-1 text-sm text-white/70">스코어/교체/기록 저장</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:px-10">
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
                <Card key={item.step} className="overflow-hidden border-border/70 bg-background/90">
                  <CardHeader>
                    <div className="text-xs font-semibold tracking-[0.22em] text-primary">STEP {item.step}</div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="leading-6">{item.body}</CardDescription>
                  </CardHeader>
                </Card>
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
      <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-zinc-950 via-zinc-900 to-stone-100 text-white">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
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
                <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
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
          <Card className="overflow-hidden border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.1),rgba(255,255,255,0.9))]">
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

          <Card className="border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.95))]">
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
      </section>
    </main>
  );
}
