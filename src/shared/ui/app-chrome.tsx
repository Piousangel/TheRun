"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  ClipboardList,
  Home,
  LogIn,
  Trophy,
  UserRound,
  Users,
  Vote,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

interface AppChromeProps {
  children: ReactNode;
}

const publicRoutes = ["/", "/login", "/club-guide"];

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const { user, isAdmin, member } = useAuth();

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/auth/"),
  );

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/dashboard", label: "대시보드", icon: Home },
    { href: "/announcements", label: "공지", icon: Bell },
    { href: "/votes", label: "투표", icon: Vote },
    { href: "/attendance", label: "출석", icon: CalendarCheck },
    { href: "/matches", label: "경기", icon: Trophy },
    user
      ? { href: "/me", label: "내 계정", icon: UserRound }
      : { href: "/login", label: "로그인", icon: LogIn },
  ];

  if (isAdmin) {
    navItems.splice(2, 0, { href: "/members", label: "멤버", icon: Users });
    navItems.splice(6, 0, {
      href: "/strategy",
      label: "전략",
      icon: ClipboardList,
    });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(248,247,243,1),rgba(255,255,255,1))]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[260px] shrink-0 border-r border-border/70 bg-background/80 px-5 py-6 backdrop-blur xl:block">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">
                The Run
              </p>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Club OS
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  동호회 운영을 위한 실제 앱 워크스페이스
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.1),rgba(255,255,255,0.96))] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">
                Current Mode
              </p>
              <p className="mt-2 text-lg font-semibold">
                {isAdmin ? "운영자 모드" : "멤버 모드"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {member
                  ? `${member.name}님으로 사용 중`
                  : "계정 연결 상태를 확인하세요."}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">
                Workspace Rule
              </p>
              <p className="mt-2 leading-6">
                매주 가장 중요한 운영 판단이 먼저 보이도록, 앱 화면은 계속
                간결하게 다듬고 있습니다.
              </p>
            </div>

            <nav className="space-y-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(200,168,88,0.22)]"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 hidden border-b border-border/70 bg-background/75 backdrop-blur xl:block">
            <div className="flex items-center justify-between px-8 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary">
                  Launch Readiness
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight">
                  실사용 기준으로 다듬는 중인 클럽 워크스페이스
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {isAdmin ? "Admin" : "Member"}
                </Badge>
                <Badge variant="secondary">
                  {member?.name ?? user?.email ?? "Guest"}
                </Badge>
              </div>
            </div>
          </header>

          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
