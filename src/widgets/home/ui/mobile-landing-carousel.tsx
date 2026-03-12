'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/shared/lib/utils';

interface SlideMetric {
  label: string;
  value: string;
}

export interface MobileLandingSlide {
  eyebrow: string;
  title: string;
  body: string;
  chips?: string[];
  accent?: 'gold' | 'emerald' | 'blue' | 'white';
  kicker?: string;
  metrics?: SlideMetric[];
}

interface MobileLandingCarouselProps {
  slides: MobileLandingSlide[];
  reducedMotion?: boolean;
}

const accentStyles = {
  gold: {
    glow: 'from-primary/65 via-primary/16 to-transparent',
    line: 'from-primary/90 via-yellow-200/55 to-white/10',
    chip: 'border-primary/20 bg-primary/10 text-primary/95',
    panel: 'from-[#181410] via-[#0e0d0d] to-[#060606]',
  },
  emerald: {
    glow: 'from-emerald-300/55 via-emerald-200/14 to-transparent',
    line: 'from-emerald-300/80 via-emerald-100/45 to-white/10',
    chip: 'border-emerald-200/18 bg-emerald-300/10 text-emerald-100',
    panel: 'from-[#0f1714] via-[#090d0c] to-[#060606]',
  },
  blue: {
    glow: 'from-sky-300/55 via-sky-200/15 to-transparent',
    line: 'from-sky-300/80 via-blue-100/45 to-white/10',
    chip: 'border-sky-200/18 bg-sky-300/10 text-sky-100',
    panel: 'from-[#10161c] via-[#090c10] to-[#060606]',
  },
  white: {
    glow: 'from-white/45 via-white/12 to-transparent',
    line: 'from-white/70 via-white/36 to-white/5',
    chip: 'border-white/16 bg-white/8 text-white/88',
    panel: 'from-[#171719] via-[#101013] to-[#060606]',
  },
} as const;

const autoAdvanceMs = 4200;
const resumeAfterInteractionMs = 6500;

export function MobileLandingCarousel({ slides, reducedMotion = false }: MobileLandingCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const activeSlide = useMemo(() => slides[index], [index, slides]);
  const accent = accentStyles[activeSlide.accent ?? 'gold'];
  const isLastSlide = index === slides.length - 1;

  const goToSlide = useCallback((nextIndex: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, nextIndex)));
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setIndex((current) => Math.min(current + 1, slides.length - 1));
  }, [slides.length]);

  const handlePrevious = useCallback(() => {
    setIndex((current) => Math.max(current - 1, 0));
  }, []);

  useEffect(() => {
    if (reducedMotion || isInteracting || isLastSlide || slides.length <= 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      handleNext();
    }, autoAdvanceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [handleNext, index, isInteracting, isLastSlide, reducedMotion, slides.length]);

  useEffect(() => {
    if (!isInteracting) {
      return;
    }

    const resumeTimer = window.setTimeout(() => {
      setIsInteracting(false);
    }, resumeAfterInteractionMs);

    return () => {
      window.clearTimeout(resumeTimer);
    };
  }, [isInteracting]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsInteracting(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <section
      data-testid="onboarding-carousel"
      className="relative flex min-h-[100svh] w-full overflow-hidden rounded-none bg-black/32 [touch-action:pan-y] lg:min-h-[100svh] lg:rounded-[2rem]"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onTouchStart={() => setIsInteracting(true)}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br transition-[background] duration-700', accent.panel)} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_26%,transparent_55%,rgba(0,0,0,0.36)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px] opacity-25" />
      <div className={cn('pointer-events-none absolute right-[-12%] top-[-14%] h-[24rem] w-[24rem] rounded-full bg-gradient-to-br blur-[120px] transition-all duration-700 lg:h-[28rem] lg:w-[28rem]', accent.glow)} />

      <motion.div
        key={`${activeSlide.title}-${index}`}
        initial={reducedMotion ? false : { opacity: 0, y: 26, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid min-h-full w-full grid-cols-1 gap-4 px-4 pb-36 pt-24 sm:px-5 sm:pb-40 sm:pt-28 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-6 lg:px-6 lg:pb-44 lg:pt-28"
        drag={reducedMotion ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragStart={() => setIsInteracting(true)}
        onDragEnd={(_, info) => {
          if (info.offset.x <= -80) {
            handleNext();
            return;
          }

          if (info.offset.x >= 80) {
            handlePrevious();
          }
        }}
      >
        <div className="flex min-h-[24rem] flex-col rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:min-h-[26rem] sm:p-6 lg:min-h-full lg:justify-between lg:p-7">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/50">{activeSlide.eyebrow}</p>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/58">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span className="text-white/20">/</span>
                <span>{String(slides.length).padStart(2, '0')}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className={cn('h-px w-24 bg-gradient-to-r', accent.line)} />
              <h1 className="max-w-3xl text-[2.35rem] font-semibold leading-[0.98] tracking-tight text-white sm:text-[3.25rem] lg:text-[4.5rem] lg:leading-[0.92]">
                {activeSlide.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/66 sm:text-base lg:text-lg lg:leading-8">
                {activeSlide.body}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {(activeSlide.metrics ?? []).map((metric) => (
                <div key={metric.label} className="rounded-[1.35rem] border border-white/8 bg-black/24 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/58">{metric.label}</p>
                  <p className="mt-3 text-lg font-medium text-white/90">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.55rem] border border-white/10 bg-black/26 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/58">Design cue</p>
                <ArrowUpRight className="h-4 w-4 text-white/32" />
              </div>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/72">{activeSlide.kicker}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
          <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl sm:p-5 lg:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_36%),linear-gradient(180deg,transparent,rgba(0,0,0,0.2))]" />
            <div className="relative flex h-full min-h-[16rem] flex-col justify-between rounded-[1.4rem] border border-white/8 bg-black/18 p-4 sm:min-h-[18rem] sm:p-5 lg:min-h-[20rem] lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/58">Live preview</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary/90" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/12" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/58">Flow state</p>
                  <p className="mt-2 text-xl font-semibold text-white">{activeSlide.eyebrow}</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">더 빠르게 판단하도록 필요한 신호만 남긴 랜딩 구조입니다.</p>
                </div>
                <div className="grid gap-2">
                  {activeSlide.chips?.map((chip) => (
                    <div key={chip} className={cn('rounded-full border px-4 py-3 text-sm font-medium backdrop-blur-sm', accent.chip)}>
                      {chip}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-white/8 bg-black/26 p-4">
                <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.26em] text-white/56">
                  <span>Interaction</span>
                  <span>{reducedMotion ? 'Reduced motion' : isLastSlide ? 'Ready to enter' : 'Autoplay on'}</span>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  {[32, 44, 38, 58, 48, 72].map((height, itemIndex) => (
                    <div key={`${activeSlide.title}-${height}`} className="flex-1 rounded-t-full bg-white/7" style={{ height }}>
                      <div className={cn('h-1.5 w-full rounded-t-full bg-gradient-to-r', itemIndex <= index + 1 ? accent.line : 'from-white/18 to-white/6')} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[1.7rem] border border-white/10 bg-black/22 p-4 backdrop-blur-xl sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div data-testid="progress-indicator" className="flex flex-wrap items-center gap-2">
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.title}
                    type="button"
                    aria-label={`${slide.title} 보기`}
                    onClick={() => {
                      setIsInteracting(true);
                      goToSlide(slideIndex);
                    }}
                    className={cn(
                      'group relative flex h-9 items-center rounded-full border px-3 transition-all duration-300',
                      slideIndex === index
                        ? 'border-white/14 bg-white/10 text-white'
                        : 'border-white/8 bg-white/[0.03] text-white/40 hover:border-white/12 hover:text-white/72'
                    )}
                  >
                    <span className={cn('absolute left-0 top-0 h-full rounded-full bg-gradient-to-r opacity-0 transition-opacity duration-300', accent.line, slideIndex === index && 'opacity-100')} style={{ width: '100%' }} />
                    <span className="relative text-[11px] font-medium uppercase tracking-[0.22em]">{String(slideIndex + 1).padStart(2, '0')}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs leading-6 text-white/58">
                손으로 넘기면 자동 전환이 잠시 멈추고, 마지막 화면에서는 그대로 로그인 액션에 머뭅니다.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => {
                  setIsInteracting(true);
                  handlePrevious();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="이전 슬라이드"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsInteracting(true);
                  handleNext();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="다음 슬라이드"
                disabled={isLastSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
