'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signUpWithEmail } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';

export function RegisterForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const { error } = await signUpWithEmail(email, password);

    if (error) {
      setMessage(error.message);
    } else {
      // Redirect to a check email page or directly to login with a message
      router.push('/login?message=Check your email to confirm your account.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="Create a password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              placeholder="Confirm your password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {message && <p className="text-red-500 text-center text-sm">{message}</p>}
          <Button className="w-full" type="submit">Register</Button>
        </form>
      </CardContent>
    </Card>
  );
}
