import type { ReactNode } from 'react';
import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  /** 우측 링크(예: "전체 보기"). href와 label을 함께 준다. */
  action?: { href: string; label: string };
  /** 링크 대신 임의 노드(버튼 등)를 우측에 둘 때 */
  trailing?: ReactNode;
}

export function SectionHeader({ title, action, trailing }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[19px] font-bold text-ink">{title}</h2>
      {action ? (
        <Link href={action.href} className="inline-flex min-h-[44px] items-center text-sm font-medium text-brand-dark hover:underline">
          {action.label}
        </Link>
      ) : (
        trailing
      )}
    </div>
  );
}
