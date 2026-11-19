'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trophy, X } from 'lucide-react';
import { SEASON_STATUS_LABELS, SEASON_STATUS_TONES, formatSeasonFormat, formatSeasonRange } from '@/entities/league/model/labels';
import { useSeasons } from '@/entities/league/model/queries';
import { SeasonCreateForm } from '@/features/season-create/ui/season-create-form';
import { useAuth } from '@/providers/auth-provider';
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib/use-media-query';
import { useUrlState } from '@/shared/lib/use-url-state';
import { cn } from '@/shared/lib/utils';
import type { Season } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';
import { StatusBadge } from '@/shared/ui/status-badge';
import { SeasonDetail } from '@/widgets/seasons/ui/season-detail';

const SHEET_NEW = 'new';

interface SeasonsBoardProps {
  /** /seasons/[id]에서 고른 시즌. /seasons이면 null */
  selectedId: string | null;
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/**
 * 리그 시즌 보드.
 * - 모바일: 목록 → 상세(별도 경로), 시즌 만들기는 하단 시트(`?sheet=new`).
 * - 데스크톱: 목록 + 상세 2단, 시즌 만들기는 오른쪽 패널, `N` 단축키.
 */
export function SeasonsBoard({ selectedId }: SeasonsBoardProps) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { data: seasons, isLoading, error, refetch } = useSeasons();
  const [sheet, setSheet] = useUrlState('sheet');
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const creating = isAdmin && sheet === SHEET_NEW;

  useEffect(() => {
    if (!isAdmin || !isDesktop) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'n' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      event.preventDefault();
      setSheet(SHEET_NEW);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, isDesktop, setSheet]);

  const handleOpenCreate = () => setSheet(SHEET_NEW);

  const handleCloseCreate = () => {
    if (window.history.length > 1) router.back();
    else setSheet(null);
  };

  const handleCreated = (season: Season) => {
    router.replace(`/seasons/${season.id}`, { scroll: false });
  };

  const createButton = isAdmin ? (
    <Button className="h-11" onClick={handleOpenCreate} aria-keyshortcuts="n">
      <Plus className="mr-1.5 h-4 w-4" aria-hidden />
      시즌 만들기
    </Button>
  ) : null;

  let list: React.ReactNode;
  if (isLoading) list = <CardSkeleton count={3} />;
  else if (error) list = <ErrorState title="시즌을 불러오지 못했어요" description={error.message} onRetry={() => refetch()} />;
  else if (!seasons || seasons.length === 0)
    list = (
      <EmptyState
        icon={Trophy}
        title="아직 시즌이 없어요"
        description={isAdmin ? '시즌을 만들면 팀장 지정, 드래프트, 일정 생성으로 이어집니다.' : '운영진이 시즌을 열면 이곳에서 일정과 순위를 볼 수 있어요.'}
        action={createButton}
      />
    );
  else
    list = (
      <ul className="flex flex-col gap-2" aria-label="시즌 목록">
        {seasons.map((season) => {
          const active = season.id === selectedId;
          return (
            <li key={season.id}>
              <Link
                href={`/seasons/${season.id}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[44px] flex-col gap-1.5 rounded-[14px] border p-4 outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-brand bg-brand-soft/40' : 'border-border bg-background',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[16px] font-semibold text-ink">{season.name}</span>
                  <StatusBadge tone={SEASON_STATUS_TONES[season.status]}>{SEASON_STATUS_LABELS[season.status]}</StatusBadge>
                </span>
                <span className="text-[13px] tabular-nums text-ink-dim">{formatSeasonRange(season)}</span>
                <span className="text-[13px] text-ink-dim">{formatSeasonFormat(season)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );

  let pane: React.ReactNode;
  if (creating && isDesktop) {
    pane = (
      <section aria-labelledby="season-create-title" className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="season-create-title" className="text-[19px] font-bold text-ink">
            새 시즌
          </h2>
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={handleCloseCreate} aria-label="닫기">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SeasonCreateForm onCreated={handleCreated} />
      </section>
    );
  } else if (selectedId) {
    pane = <SeasonDetail seasonId={selectedId} />;
  } else {
    pane = (
      <EmptyState
        icon={Trophy}
        title="시즌을 고르세요"
        description={isAdmin ? '왼쪽 목록에서 시즌을 고르거나 N 키로 새 시즌을 만듭니다.' : '왼쪽 목록에서 시즌을 고르세요.'}
      />
    );
  }

  return (
    <>
      <div className="md:grid md:grid-cols-[minmax(280px,360px)_1fr] md:gap-6">
        <div className={cn('flex-col gap-4', selectedId ? 'hidden md:flex' : 'flex')}>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[19px] font-bold text-ink">리그 시즌</h1>
            {seasons && seasons.length > 0 && createButton}
          </div>
          {list}
        </div>
        <div
          className={cn(
            'min-w-0 md:rounded-[16px] md:border md:border-border md:bg-background md:p-6',
            selectedId ? 'block' : 'hidden md:block',
          )}
        >
          {pane}
        </div>
      </div>

      {isDesktop === false && (
        <Drawer open={creating} onOpenChange={(open) => (open ? handleOpenCreate() : handleCloseCreate())}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader>
              <DrawerTitle>새 시즌</DrawerTitle>
              <DrawerDescription>기간과 경기 방식을 정하면 팀 구성과 일정으로 이어집니다.</DrawerDescription>
            </DrawerHeader>
            <SeasonCreateForm onCreated={handleCreated} />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
