"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  ClipboardList,
  Ellipsis,
  Home,
  LogIn,
  Trophy,
  UserRound,
  Users,
  Vote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/shared/lib/utils";
import {
  DrawerClose,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

const hiddenRoutes = ["/", "/login", "/club-guide"];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const shouldHide = hiddenRoutes.some(
    (route) => pathname === route || pathname.startsWith("/auth/"),
  );

  if (shouldHide) {
    return null;
  }

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "대시보드", shortLabel: "홈", icon: Home },
    {
      href: "/announcements",
      label: "공지 보드",
      shortLabel: "공지",
      icon: Bell,
    },
    { href: "/votes", label: "투표 운영", shortLabel: "투표", icon: Vote },
    {
      href: "/attendance",
      label: "출석 보드",
      shortLabel: "출석",
      icon: CalendarCheck,
    },
    { href: "/matches", label: "경기 허브", shortLabel: "경기", icon: Trophy },
    user
      ? { href: "/me", label: "내 계정", shortLabel: "계정", icon: UserRound }
      : { href: "/login", label: "로그인", shortLabel: "로그인", icon: LogIn },
  ];

  if (isAdmin) {
    navItems.splice(2, 0, {
      href: "/members",
      label: "멤버 디렉토리",
      shortLabel: "멤버",
      icon: Users,
    });
    navItems.splice(6, 0, {
      href: "/team-division",
      label: "팀 나누기",
      shortLabel: "팀",
      icon: ClipboardList,
    });
  }

  const primaryItems = navItems.slice(0, 4);
  const secondaryItems = navItems.slice(4);
  const isMoreActive = secondaryItems.some((item) =>
    isRouteActive(pathname, item.href),
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto flex h-20 max-w-xl items-center justify-between gap-2 px-3">
        {primaryItems.map(({ href, label, shortLabel, icon: Icon }) => {
          const isActive = isRouteActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-[1.25rem] px-2 py-2.5 transition-all duration-200",
                isActive
                  ? "bg-primary/12 text-primary shadow-[0_10px_24px_rgba(200,168,88,0.16)]"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium tracking-tight">
                {shortLabel}
              </span>
            </Link>
          );
        })}

        <Drawer>
          <DrawerTrigger asChild>
            <button
              type="button"
              aria-label="더 많은 메뉴 열기"
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-[1.25rem] px-2 py-2.5 transition-all duration-200",
                isMoreActive
                  ? "bg-primary/12 text-primary shadow-[0_10px_24px_rgba(200,168,88,0.16)]"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Ellipsis className="h-5 w-5" />
              <span className="text-[11px] font-medium tracking-tight">
                더보기
              </span>
            </button>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>빠른 이동</DrawerTitle>
              <DrawerDescription>
                자주 쓰는 화면은 아래에 고정하고, 나머지 관리 메뉴는 이곳에
                정리했습니다.
              </DrawerDescription>
            </DrawerHeader>

            <div className="grid gap-3 pt-2">
              {secondaryItems.map(({ href, label, shortLabel, icon: Icon }) => {
                const isActive = isRouteActive(pathname, href);

                return (
                  <DrawerClose asChild key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center justify-between rounded-[1.35rem] border px-4 py-4 transition-all duration-200",
                        isActive
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-border/70 bg-muted/20 hover:border-primary/20 hover:bg-primary/5",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-2xl",
                            isActive ? "bg-primary/12" : "bg-background",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {label}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {shortLabel} 바로가기
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Open
                      </span>
                    </Link>
                  </DrawerClose>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
