'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
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

  const activeSlide = useMemo(() => slides[index], [index, slides]);

  const paginate = (nextDirection: number) => {
    setDirection(nextDirection);
    setIndex((current) => {
      const next = current + nextDirection;
      if (next < 0) return slides.length - 1;
      if (next >= slides.length) return 0;
      return next;
    });
  };

  return (
    <section className="space-y-4 md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Swipe Story</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">한 장씩 넘기며 보는 웰컴 플로우</h2>
        </div>
        <Badge variant="secondary">{index + 1} / {slides.length}</Badge>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.12),rgba(255,255,255,0.98))] p-4 shadow-sm">
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
            className="rounded-[1.5rem] border border-white/40 bg-background/88 p-5"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-primary">{activeSlide.eyebrow}</p>
                <h3 className="text-2xl font-semibold tracking-tight leading-tight">{activeSlide.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{activeSlide.body}</p>
              </div>

              {activeSlide.chips?.length ? (
                <div className="grid gap-2">
                  {activeSlide.chips.map((chip) => (
                    <div key={chip} className="rounded-2xl border bg-muted/35 px-4 py-3 text-sm font-medium text-foreground/90">
                      {chip}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
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
                'h-2.5 rounded-full transition-all',
                slideIndex === index ? 'w-8 bg-primary' : 'w-2.5 bg-primary/25'
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => paginate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={() => paginate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
