'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export function ToasterWithSearchParams() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (status === 'success' && message) {
      toast({
        title: 'Success!',
        description: decodeURIComponent(message),
        variant: 'success',
      });

      // Clear search params after showing the toast to prevent it from reappearing on refresh
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('status');
      newSearchParams.delete('message');
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [searchParams, toast, router]);

  return null; // This component doesn't render anything visible directly
}
