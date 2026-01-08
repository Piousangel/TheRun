'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

interface MemberAvatarProps {
  src: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  bgColor?: string; // Custom background color
}

export function MemberAvatar({ src, alt, size = 'md', bgColor }: MemberAvatarProps) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  const fallbackSizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const initials = alt
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Use custom bg color if provided, otherwise use primary
  const bgColorClass = bgColor || 'bg-primary';

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={src || undefined} alt={alt} />
      <AvatarFallback className={`${bgColorClass} text-white ${fallbackSizeClasses[size]}`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
