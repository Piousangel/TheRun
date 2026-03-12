'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/shared/lib/utils';

export interface MobileLandingSlide {
  eyebrow: string;
  title: string;
  body: string;
  chips?: string[];
  accent?: 'gold' | 'emerald' | 'blue' | 'white';
}

interface MobileLandingCarouselProps {
  slides: MobileLandingSlide[];
}

export function MobileLandingCarousel({ slides }: MobileLandingCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlide = useMemo(() => slides[index], [index, slides]);
  const accentClass =
    activeSlide.accent === 'emerald'
      ? 'from-emerald-300/40 via-emerald-100/10 to-transparent'
      : activeSlide.accent === 'blue'
        ? 'from-sky-300/40 via-blue-100/10 to-transparent'
        : activeSlide.accent === 'white'
          ? 'from-white/35 via-white/10 to-transparent'
          : 'from-primary/45 via-yellow-200/10 to-transparent';

  const paginate = useCallback((nextDirection: number) => {
    setDirection(nextDirection);
    setIndex((current) => {
      const next = current + nextDirection;
      if (next < 0) return slides.length - 1;
      if (next >= slides.length) return 0;
      return next;
    });
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      paginate(1);
    }, 3200);

    return () => {
      window.clearInterval(timer);
    };
  }, [index, isPaused, paginate, slides.length]);

  return (
    <section className="space-y-4 md:hidden">
      <div
        className="relative overflow-hidden rounded-[2rem] bg-black/15 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 36 : -36, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction >= 0 ? -36 : 36, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x <= -80) paginate(1);
              if (info.offset.x >= 80) paginate(-1);
            }}
            className="min-h-[370px] rounded-[2rem] bg-[linear-gradient(180deg,rgba(7,7,9,0.96),rgba(25,25,30,0.92))] p-5 text-white"
          >
            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-[1.5rem] bg-white/5 p-4">
                <div className={cn('absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl', accentClass)} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
                <div className="relative flex min-h-[150px] flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-primary">{activeSlide.eyebrow}</p>
                    <p className="text-[11px] font-medium text-white/45">AUTO PLAY</p>
                  </div>
                  <div className="space-y-2 text-left">
                    <p className="text-6xl font-semibold leading-none text-white/10">0{index + 1}</p>
                    <p className="max-w-[12rem] text-sm leading-6 text-white/70">{activeSlide.body}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">{index + 1} / {slides.length}</p>
                </div>
                <h3 className="text-[2rem] font-semibold tracking-tight leading-[1.04]">{activeSlide.title}</h3>
              </div>

              {activeSlide.chips?.length ? (
                <div className="grid gap-2.5">
                  {activeSlide.chips.map((chip) => (
                    <div key={chip} className="rounded-2xl bg-white/8 px-4 py-3 text-sm font-medium text-white/88 backdrop-blur-sm">
                      {chip}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex items-center justify-center gap-2 px-4 pb-1">
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.title}
              className={cn(
                'h-1.5 rounded-full transition-all',
                slideIndex === index ? 'w-10 bg-primary' : 'w-3 bg-white/15'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
