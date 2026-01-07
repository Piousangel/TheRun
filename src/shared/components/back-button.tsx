'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
}

export function BackButton({ fallbackPath = '/', label = '뒤로' }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
