import type { LucideIcon } from 'lucide-react';
import { Bell, BookOpen, CalendarCheck, ClipboardList, Ellipsis, Home, Trophy, UserRound, Users, Vote } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const HOME: NavItem = { href: '/dashboard', label: '홈', icon: Home };
const VOTES: NavItem = { href: '/votes', label: '투표', icon: Vote };
const MATCHES: NavItem = { href: '/matches', label: '경기', icon: Trophy };
const ATTENDANCE: NavItem = { href: '/attendance', label: '출석', icon: CalendarCheck };
const MORE: NavItem = { href: '/more', label: '더보기', icon: Ellipsis };
const ANNOUNCEMENTS: NavItem = { href: '/announcements', label: '공지', icon: Bell };
const CLUB_GUIDE: NavItem = { href: '/club-guide', label: '클럽 안내', icon: BookOpen };
const MEMBERS: NavItem = { href: '/members', label: '멤버', icon: Users, adminOnly: true };
const STRATEGY: NavItem = { href: '/strategy', label: '전략·팀 편성', icon: ClipboardList, adminOnly: true };
const ME: NavItem = { href: '/me', label: '내 정보', icon: UserRound };

export const TAB_ITEMS: readonly NavItem[] = [HOME, VOTES, MATCHES, ATTENDANCE, MORE];

export const NAV_GROUPS: readonly NavGroup[] = [
  { label: null, items: [HOME, VOTES, MATCHES, ATTENDANCE] },
  { label: '클럽', items: [ANNOUNCEMENTS, CLUB_GUIDE] },
  { label: '운영', items: [MEMBERS, STRATEGY] },
  { label: '계정', items: [ME] },
];

export const MORE_GROUPS: readonly NavGroup[] = NAV_GROUPS.slice(1);

const MORE_CHILDREN: readonly NavItem[] = MORE_GROUPS.flatMap((group) => group.items);

/** 목록 → 상세로 들어가는 경로. 상세 헤더는 목록으로 돌아간다. */
const DEEP_PARENTS: readonly NavItem[] = [VOTES, MATCHES, MEMBERS];

const SHELL_HIDDEN_ROUTES = ['/login', '/signup', '/reset', '/auth'];

export function visibleGroups(groups: readonly NavGroup[], isAdmin: boolean): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => isAdmin || !item.adminOnly) }))
    .filter((group) => group.items.length > 0);
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function activeTabHref(pathname: string): string | null {
  if (isNavItemActive(pathname, MORE.href) || MORE_CHILDREN.some((item) => isNavItemActive(pathname, item.href))) {
    return MORE.href;
  }
  return TAB_ITEMS.find((item) => isNavItemActive(pathname, item.href))?.href ?? null;
}

export function isShellHidden(pathname: string): boolean {
  return SHELL_HIDDEN_ROUTES.some((route) => isNavItemActive(pathname, route));
}

export type RouteKind = 'home' | 'root' | 'more-child' | 'deep';

export interface RouteMeta {
  title: string;
  kind: RouteKind;
  backHref: string | null;
}

export function resolveRouteMeta(pathname: string): RouteMeta {
  if (pathname === HOME.href) return { title: HOME.label, kind: 'home', backHref: null };

  const tabRoot = TAB_ITEMS.find((item) => item.href === pathname);
  if (tabRoot) return { title: tabRoot.label, kind: 'root', backHref: null };

  const deepParent = DEEP_PARENTS.find((item) => pathname.startsWith(`${item.href}/`));
  if (deepParent) return { title: deepParent.label, kind: 'deep', backHref: deepParent.href };

  const moreChild = MORE_CHILDREN.find((item) => item.href === pathname);
  if (moreChild) return { title: moreChild.label, kind: 'more-child', backHref: MORE.href };

  return { title: '', kind: 'root', backHref: null };
}
