"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Vote, Trophy, ClipboardList, CalendarCheck, UserRound, LogIn } from "lucide-react";
import { useAuth } from '@/providers/auth-provider';
import { cn } from "@/shared/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const navItems = [
    { href: "/", label: "홈", icon: Home },
    { href: "/votes", label: "투표", icon: Vote },
    { href: "/attendance", label: "출석", icon: CalendarCheck },
    { href: "/matches", label: "경기", icon: Trophy },
    user
      ? { href: "/me", label: "내 계정", icon: UserRound }
      : { href: "/login", label: "로그인", icon: LogIn },
  ];

  if (isAdmin) {
    navItems.splice(1, 0, { href: "/members", label: "멤버", icon: Users });
    navItems.splice(4, 0, { href: "/team-division", label: "팀", icon: ClipboardList });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
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
