'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

interface MemberAvatarProps {
  src: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MemberAvatar({ src, alt, size = 'md' }: MemberAvatarProps) {
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

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={src || undefined} alt={alt} />
      <AvatarFallback className={`bg-primary text-white ${fallbackSizeClasses[size]}`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
