"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Vote, Trophy, ClipboardList, CalendarCheck, UserRound, LogIn, Bell } from "lucide-react";
import { useAuth } from '@/providers/auth-provider';
import { cn } from "@/shared/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const hiddenRoutes = ['/', '/login', '/club-guide'];
  const shouldHide = hiddenRoutes.some((route) => pathname === route || pathname.startsWith('/auth/'));

  if (shouldHide) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "홈", icon: Home },
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
    navItems.splice(6, 0, { href: "/team-division", label: "팀", icon: ClipboardList });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex h-16 items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
