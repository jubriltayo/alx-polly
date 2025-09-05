'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { isValidEmail } from '@/lib/utils/validation';
import { useAuth } from '@/lib/auth/AuthContext'; // Import useAuth hook

/**
 * Purpose:
 *   Renders and manages the user registration form, handling input validation, error display, and account creation via Supabase.
 *
 * Why:
 *   Centralizes registration logic to ensure a consistent onboarding experience and to encapsulate all business rules and error handling in one place.
 *   Using a dedicated form component allows for future extensibility (e.g., adding fields, changing validation) without impacting other auth flows.
 *
 * Assumptions:
 *   - The useAuth hook provides a signUp method that integrates with Supabase and returns a standardized error object on failure.
 *   - The parent route ensures only unauthenticated users can access this form.
 *
 * Edge cases:
 *   - Handles invalid email formats and password mismatch before attempting registration, providing immediate feedback.
 *   - Displays backend errors (e.g., duplicate email, network issues) returned from Supabase via the signUp method.
 *   - Redirects to login with a message if registration succeeds, but does not handle email confirmation failures (handled elsewhere).
 *
 * Used by:
 *   - The /register route page, which renders <RegisterForm /> as the main registration UI for new users.
 */
export function RegisterForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const { signUp } = useAuth(); // Provides Supabase-backed registration

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    // Business rule: Only allow valid email formats to proceed to backend
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    // Business rule: Prevent user from registering with mismatched passwords
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    // signUp handles Supabase registration and returns error if any
    const { error } = await signUp(email, password);

    if (error) {
      // Show backend error (e.g., duplicate email, weak password, network)
      setMessage(error.message);
    } else {
      // UX: Always redirect to login with a message, even if email confirmation is required
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
          {/* Show error or info messages to the user, including backend errors */}
          {message && <p className="text-red-500 text-center text-sm">{message}</p>}
          <Button className="w-full" type="submit">Register</Button>
        </form>
      </CardContent>
    </Card>
  );
}
