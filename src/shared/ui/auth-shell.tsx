import type { ReactNode } from "react";
import { TheRunLogo } from "@/shared/ui/the-run-logo";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(214,180,83,0.12),transparent_32%),linear-gradient(180deg,#f7f3ea_0%,#f8f6f1_44%,#ffffff_100%)] p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
        <section className="overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(165deg,rgba(17,17,19,0.96),rgba(31,30,27,0.94))] p-6 text-white shadow-[0_28px_100px_rgba(0,0,0,0.18)] lg:flex lg:flex-col lg:justify-between lg:p-8">
          <div>
            <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-4 py-4 backdrop-blur-xl">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border border-primary/20 bg-[linear-gradient(160deg,rgba(212,175,84,0.18),rgba(255,255,255,0.08))]">
                <TheRunLogo className="h-9 w-9" tone="light" glow />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-primary/80">
                  {eyebrow}
                </p>
                <p className="mt-1 text-sm font-medium text-white/76">
                  Club access for real matchday flow
                </p>
              </div>
            </div>
            <h1 className="mt-5 max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/68 sm:text-base">
              {description}
            </p>
          </div>

          <div className="mt-8 space-y-4 lg:mt-0">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/48">
                Brand rhythm
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                Runner mark first, weekly flow second.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/62">
                첫 화면의 러닝 에너지와 운영 제품의 신뢰감을 같은 톤으로
                이어서, 로그인 이후에도 브랜드 인상이 흐트러지지 않게 정리합니다.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { label: "Fast entry", value: "Google first" },
                { label: "Trust", value: "Account-linked flow" },
                { label: "Mode", value: "Member or admin" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.25rem] border border-white/8 bg-black/18 px-4 py-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white/90">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-full flex-col justify-center">
          <div className="overflow-hidden rounded-[2rem] border border-primary/15 bg-background/92 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-5 lg:p-6">
            {children}
          </div>

          {footer ? <div className="mt-4">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}
