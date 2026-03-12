'use client';

import { cn } from '@/shared/lib/utils';

interface AiSceneCardProps {
  title: string;
  subtitle: string;
  accent: 'gold' | 'emerald' | 'blue';
  chips: string[];
}

const accentStyles = {
  gold: {
    orb: 'from-primary/70 via-yellow-200/35 to-transparent',
    line: 'from-primary/80 to-yellow-200/20',
    panel: 'from-primary/20 via-zinc-900/40 to-zinc-950',
  },
  emerald: {
    orb: 'from-emerald-400/60 via-emerald-200/20 to-transparent',
    line: 'from-emerald-300/70 to-emerald-100/20',
    panel: 'from-emerald-500/15 via-zinc-900/40 to-zinc-950',
  },
  blue: {
    orb: 'from-sky-400/60 via-blue-200/20 to-transparent',
    line: 'from-sky-300/70 to-blue-100/20',
    panel: 'from-sky-500/15 via-zinc-900/40 to-zinc-950',
  },
} as const;

export function AiSceneCard({ title, subtitle, accent, chips }: AiSceneCardProps) {
  const style = accentStyles[accent];

  return (
    <div className={cn('relative overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-br p-5 text-white shadow-[0_30px_70px_rgba(0,0,0,0.2)]', style.panel)}>
      <div className={cn('absolute -right-10 -top-12 h-40 w-40 rounded-full bg-gradient-to-br blur-3xl', style.orb)} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/55">AI Crafted Scene</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{title}</p>
          </div>
          <div className={cn('h-px w-20 bg-gradient-to-r', style.line)} />
        </div>

        <p className="mt-4 max-w-sm text-sm leading-7 text-white/72">{subtitle}</p>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
              <div className="flex items-center justify-between text-xs text-white/55 uppercase tracking-[0.18em]">
                <span>Vision Frame</span>
                <span>4K</span>
              </div>
              <div className="relative mt-4 h-56 overflow-hidden rounded-[1.1rem] border border-white/10 bg-gradient-to-br from-black/20 via-white/5 to-black/30">
                <div className={cn('absolute left-8 top-7 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl', style.orb)} />
                <div className="absolute inset-x-6 bottom-5 top-10 rounded-[1rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.18))]" />
                <div className="absolute left-10 top-24 h-24 w-24 rounded-full border border-white/35 bg-white/10 shadow-[0_0_50px_rgba(255,255,255,0.08)]" />
                <div className="absolute bottom-8 left-6 right-6 flex items-end justify-between">
                  {[34, 56, 48, 72, 62, 84].map((height) => (
                    <div key={`${title}-${height}`} className="w-8 rounded-t-2xl bg-white/12" style={{ height }}>
                      <div className={cn('h-2 w-full rounded-t-2xl bg-gradient-to-r', style.line)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {chips.map((chip) => (
                <div key={chip} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/82">
                  {chip}
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Prompt Layer</p>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  경기장 조명, 잔디 질감, 선수 실루엣, 전술 보드 오버레이를 결합한 제품 비주얼 톤입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
