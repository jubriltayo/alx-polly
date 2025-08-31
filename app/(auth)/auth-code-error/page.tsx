"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('An unknown authentication error occurred.');

  useEffect(() => {
    const errorDescription = searchParams.get('error_description');
    if (errorDescription) {
      setErrorMessage(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto py-10 flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-500">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">{errorMessage}</p>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
