'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/shared/lib/utils';

export interface MobileLandingSlide {
  eyebrow: string;
  title: string;
  body: string;
  chips?: string[];
}

interface MobileLandingCarouselProps {
  slides: MobileLandingSlide[];
}

export function MobileLandingCarousel({ slides }: MobileLandingCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlide = useMemo(() => slides[index], [index, slides]);

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
    }, 3800);

    return () => {
      window.clearInterval(timer);
    };
  }, [index, isPaused, paginate, slides.length]);

  return (
    <section className="space-y-4 md:hidden">
      <div
        className="relative overflow-hidden rounded-[2rem] bg-black/15 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl"
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
            className="min-h-[340px] rounded-[1.75rem] bg-[radial-gradient(circle_at_top_right,rgba(200,168,88,0.25),transparent_35%),linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 text-white"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">{activeSlide.eyebrow}</p>
                  <p className="text-xs font-medium text-white/55">{index + 1} / {slides.length}</p>
                </div>
                <h3 className="text-[1.9rem] font-semibold tracking-tight leading-[1.1]">{activeSlide.title}</h3>
                <p className="text-sm leading-7 text-white/72">{activeSlide.body}</p>
              </div>

              {activeSlide.chips?.length ? (
                <div className="grid gap-2.5">
                  {activeSlide.chips.map((chip) => (
                    <div key={chip} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white/90 backdrop-blur-sm">
                      {chip}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`${slideIndex + 1}번 슬라이드로 이동`}
              onClick={() => {
                setDirection(slideIndex > index ? 1 : -1);
                setIndex(slideIndex);
              }}
              className={cn(
                'h-1.5 rounded-full transition-all',
                slideIndex === index ? 'w-8 bg-primary' : 'w-2.5 bg-white/20'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
