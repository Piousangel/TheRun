'use client';

import Link from 'next/link';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowRight, BellRing, CalendarDays, CheckCircle2, Clock3, Trophy, UserRound, Users, Vote } from 'lucide-react';
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

const guideHighlights = ['신규 멤버 온보딩 체크리스트', '주간 운영 루틴 정리', '경기 당일 담당 역할 가이드'];

const adminChecklist = [
  '이번 주 투표가 열려 있는지 확인',
  '출석 세션과 확정 인원 점검',
  '팀 구성 또는 경기 수 조정',
  '공지와 시간 변경 사항 공지',
];

const memberChecklist = [
  '내 멤버 연결 상태 확인',
  '이번 주 투표 응답 완료',
  '출석 응답과 시간 확인',
  '공지와 경기 기록 확인',
];

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  const relative = formatDistanceToNowStrict(date, { addSuffix: true, locale: ko });
  return `${format(date, 'M월 d일 HH:mm', { locale: ko })} · ${relative}`;
}

export function AppDashboardContent() {
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
  const dashboardPrimaryCta = isAdmin
    ? { href: '/votes', label: '이번 주 운영 열기' }
    : { href: isLinked ? '/votes' : '/me', label: isLinked ? '이번 주 응답 확인' : '내 멤버 연결하기' };
  const roleChecklist = isAdmin ? adminChecklist : memberChecklist;
  const roleQuickLinks = isAdmin
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
      ];

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
                  {isAdmin
                    ? '이번 주 운영 상태를 조정하세요.'
                    : member
                      ? `${member.name}님, 이번 주 준비 상태를 확인하세요.`
                      : '실제 동호회 운영용 대시보드'}
                </h1>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                {isAdmin
                  ? '운영자가 바로 판단해야 하는 투표, 출석, 공지, 경기 흐름을 한 번에 정리했습니다.'
                  : '멤버가 이번 주에 꼭 확인해야 하는 응답, 시간, 공지, 경기 기록을 한 화면에 모았습니다.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={dashboardPrimaryCta.href}>
                  <Button size="lg" className="rounded-full px-6">
                    {dashboardPrimaryCta.label}
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
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2 border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.12),rgba(255,255,255,0.98))]">
            <CardHeader>
              <CardTitle className="text-2xl">오늘의 포커스</CardTitle>
              <CardDescription>
                {isAdmin
                  ? '운영자가 가장 먼저 확인해야 할 흐름만 추려서 보여줍니다.'
                  : '이번 주에 멤버가 놓치면 안 되는 액션만 먼저 보여줍니다.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {(isAdmin
                ? [
                    {
                      label: '투표 마감',
                      value: activeVoteSession ? formatDeadline(activeVoteSession.deadline) : '열린 투표 없음',
                    },
                    {
                      label: '출석 확정',
                      value: attendanceSession ? `${attendanceConfirmedCount}명 응답` : '출석 세션 없음',
                    },
                    {
                      label: '경기 준비',
                      value: pendingMatch || liveMatch ? '경기 흐름 연결됨' : '팀 구성/경기 생성 필요',
                    },
                  ]
                : [
                    {
                      label: '내 투표',
                      value: activeVoteSession ? (myVote ? '응답 완료' : '응답 필요') : '열린 투표 없음',
                    },
                    {
                      label: '내 출석',
                      value: attendanceSession ? (myAttendance ? '응답 완료' : '응답 필요') : '출석 세션 없음',
                    },
                    {
                      label: '새 공지',
                      value: unreadAnnouncementCount > 0 ? `${unreadAnnouncementCount}개 미확인` : '새 공지 없음',
                    },
                  ]).map((item) => (
                <div key={item.label} className="rounded-2xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-base font-semibold leading-7">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">역할 요약</CardTitle>
              <CardDescription>{isAdmin ? '운영자 워크스페이스' : '멤버 워크스페이스'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>- {isAdmin ? '공지, 투표, 경기 흐름을 조정하는 역할' : '응답과 공지를 확인하는 개인 흐름 중심'}</p>
              <p>- {isLinked ? '멤버 연결이 완료되어 개인 흐름이 활성화됨' : '멤버 연결이 필요해 일부 개인 흐름이 제한됨'}</p>
              <p>- {isAdmin ? '운영 루틴을 빠르게 반복할 수 있도록 구성' : '이번 주 필요한 액션만 빠르게 확인 가능'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="section-surface overflow-hidden border-primary/15">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl">이번 주 핵심 상태</CardTitle>
                  <CardDescription className="mt-2 leading-6">지금 바로 처리해야 할 응답과 경기 상황을 우선순위대로 배치했습니다.</CardDescription>
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
                      <p className="font-medium text-foreground">{member ? (myVote ? `내 응답: ${myVote === 'attending' ? '참석' : '불참'}` : '아직 내 응답이 없습니다.') : '멤버 연결 후 내 응답을 사용할 수 있습니다.'}</p>
                      <p className="text-muted-foreground">현재 참석 의사 표시: {attendingCount}명</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">새 투표가 열리면 이곳에서 바로 확인할 수 있습니다.</p>
                  )}
                </div>
                <div className="mt-5 flex gap-2">
                  <Link href={activeVoteSession ? `/votes/${activeVoteSession.id}` : '/votes'}><Button size="sm">투표 열기</Button></Link>
                  {!isLinked && <Link href="/me"><Button size="sm" variant="outline">내 계정 연결</Button></Link>}
                </div>
              </div>

              <div className="rounded-3xl border bg-secondary p-5 text-secondary-foreground shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-foreground/80">주간 출석 보드</p>
                    <h3 className="mt-2 text-xl font-semibold">{attendanceSession ? '현재 출석 세션 진행 중' : '열린 출석 세션 없음'}</h3>
                  </div>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4 space-y-3 text-sm text-secondary-foreground/90">
                  {attendanceSession ? (
                    <>
                      <p>경기일: {format(new Date(attendanceSession.match_date), 'M월 d일 (EEE) HH:mm', { locale: ko })}</p>
                      <p>{member ? (myAttendance ? `내 출석 응답: ${myAttendance === 'attending' ? '참석' : '불참'}` : '아직 출석 응답을 하지 않았습니다.') : '멤버 연결 후 내 출석 응답을 사용할 수 있습니다.'}</p>
                      <p>출석 확정 인원: {attendanceConfirmedCount}명</p>
                    </>
                  ) : (
                    <p>관리자가 출석 세션을 열면 바로 이곳에서 상태를 확인할 수 있습니다.</p>
                  )}
                </div>
                <div className="mt-5">
                  <Link href="/attendance"><Button size="sm" variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white">출석 보드 보기</Button></Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{isAdmin ? '운영 체크리스트' : '내 체크리스트'}</CardTitle>
              <CardDescription>{isAdmin ? '오늘 운영자가 먼저 점검해야 하는 루틴입니다.' : '오늘 이 앱에서 해야 할 일을 바로 확인할 수 있습니다.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(isAdmin
                ? [
                    { done: !!activeVoteSession, label: roleChecklist[0], helper: activeVoteSession ? '활성 투표가 열려 있습니다.' : '운영 투표를 열어야 합니다.' },
                    { done: !!attendanceSession, label: roleChecklist[1], helper: attendanceSession ? '출석 세션이 열려 있습니다.' : '출석 세션이 아직 없습니다.' },
                    { done: !!pendingMatch || !!liveMatch, label: roleChecklist[2], helper: pendingMatch || liveMatch ? '경기 흐름이 연결되어 있습니다.' : '팀 구성 또는 경기 생성이 필요합니다.' },
                    { done: latestAnnouncements.length > 0, label: roleChecklist[3], helper: latestAnnouncements.length > 0 ? '최근 공지가 등록되어 있습니다.' : '이번 주 공지를 올리면 좋습니다.' },
                  ]
                : [
                    { done: isLinked, label: roleChecklist[0], helper: isLinked ? `${member?.name ?? '연결 완료'}로 응답 가능` : '내 계정에서 전화번호 확인 후 연결하세요.' },
                    { done: !!myVote || !activeVoteSession, label: roleChecklist[1], helper: activeVoteSession ? (myVote ? '응답 완료' : '아직 응답이 필요합니다.') : '진행 중인 투표 없음' },
                    { done: !!myAttendance || !attendanceSession, label: roleChecklist[2], helper: attendanceSession ? (myAttendance ? '응답 완료' : '필요 시 출석 응답하세요.') : '진행 중인 출석 없음' },
                    { done: latestAnnouncements.length > 0, label: roleChecklist[3], helper: latestAnnouncements.length > 0 ? `${unreadAnnouncementCount}개의 읽지 않은 공지가 있습니다.` : '확인할 공지가 없습니다.' },
                  ]).map((item) => (
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

        <div className="grid gap-4 lg:grid-cols-4">
          {[
            {
              label: isAdmin ? '운영 액션' : '내 상태',
              value: isAdmin ? (activeVoteSession ? '투표 진행 중' : '투표 열기 필요') : (isLinked ? '연결 완료' : '연결 필요'),
            },
            {
              label: '출석 상태',
              value: attendanceSession ? `${attendanceConfirmedCount}명 확정` : '세션 없음',
            },
            {
              label: '공지 상태',
              value: latestAnnouncements.length > 0 ? `${unreadAnnouncementCount}개 미확인` : '공지 없음',
            },
            {
              label: '경기 상태',
              value: liveMatch ? '진행 중' : pendingMatch ? '대기 중' : '예정 없음',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border bg-background/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
              <p className="mt-3 text-lg font-semibold tracking-tight">{item.value}</p>
            </div>
          ))}
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
                  <p className="mt-2 text-lg font-semibold">{liveMatch ? `${liveMatch.match_number ?? '-'}경기 진행 중` : pendingMatch ? `${pendingMatch.match_number ?? '-'}경기 대기 중` : '예정된 경기 없음'}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{liveMatch || pendingMatch ? `${format(new Date((liveMatch ?? pendingMatch)!.date), 'M월 d일 (EEE) HH:mm', { locale: ko })} · ${(liveMatch ?? pendingMatch)!.location}` : '경기 생성 후 이곳에 바로 표시됩니다.'}</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-muted-foreground">최근 저장 기록</p>
                  <p className="mt-2 text-lg font-semibold">{latestMatch ? `${latestMatch.team_a.score} : ${latestMatch.team_b.score}` : '아직 경기 기록 없음'}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{latestMatch ? `${format(new Date(latestMatch.date), 'M월 d일 (EEE)', { locale: ko })} · ${latestMatch.location}` : '첫 경기를 기록하면 히스토리가 쌓이기 시작합니다.'}</p>
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
              <CardDescription>{isAdmin ? '운영자가 자주 반복하는 작업을 운영 흐름 순서대로 배치했습니다.' : '멤버가 이번 주에 자주 오가는 화면만 빠르게 이어갈 수 있게 묶었습니다.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {roleQuickLinks.map(({ href, title, body, icon: Icon }) => (
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
                <CardDescription className="mt-2 leading-6">최신 스포츠 팀 앱들처럼 정보가 흩어지지 않게, 자주 필요한 운영 가이드를 별도 페이지로 정리했습니다.</CardDescription>
              </div>
              <Link href="/club-guide"><Button variant="outline" className="w-full sm:w-auto">가이드 열기<ArrowRight className="h-4 w-4" /></Button></Link>
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
                <CardDescription className="mt-2 leading-6">일정 변경, 경기 공지, 긴급 안내를 홈에서 바로 확인할 수 있게 붙였습니다.</CardDescription>
              </div>
              <Link href="/announcements"><Button variant="outline" className="w-full sm:w-auto">공지 보드 열기<ArrowRight className="h-4 w-4" /></Button></Link>
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
              {latestAnnouncements.length > 0 ? latestAnnouncements.map((announcement) => {
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
              }) : (
                <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-3">
                  {isAdmin
                    ? '이번 주 공지를 아직 올리지 않았습니다. 시간 변경, 경기 안내, 긴급 메시지를 등록해두면 멤버가 홈에서 바로 확인할 수 있습니다.'
                    : '운영진 공지가 올라오면 이곳에서 새 안내를 바로 확인할 수 있습니다.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
