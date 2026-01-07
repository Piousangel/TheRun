'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackPath?: string;
}

export function BackButton({ fallbackPath = '/' }: BackButtonProps) {
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
      size="icon"
      onClick={handleBack}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
