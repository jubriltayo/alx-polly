'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter
import { isValidEmail } from '@/lib/utils/validation'
import { useAuth } from '@/lib/auth/AuthContext' // Import useAuth hook

/**
 * Purpose:
 *   Renders and manages the email/password login and registration form for user authentication.
 *
 * Why:
 *   Centralizes authentication UI and logic, ensuring consistent user experience and error handling.
 *   Abstracts away Supabase and routing details, so business logic is not duplicated across the app.
 *
 * Assumptions:
 *   - The useAuth hook provides signIn and signUp methods that return { error } objects on failure.
 *   - AuthContext handles all post-authentication redirects and state updates (no manual router navigation here).
 *
 * Edge cases:
 *   - Displays backend error messages directly to the user for both sign-in and sign-up failures.
 *   - Handles invalid email input gracefully, preventing unnecessary backend calls.
 *   - After sign-up, prompts user to check their email, but does not auto-redirect or poll for confirmation.
 *
 * Used by:
 *   - Consumed directly in authentication-related pages (e.g., /login, /register).
 *   - Parent components rely on this to handle all user credential input and feedback.
 */
export function LoginForm() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [view, setView] = useState('sign-in') // 'sign-in' or 'check-email'
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter() // Not used for navigation; kept for possible future needs
  const { signIn, signUp } = useAuth() // Provides backend auth methods; abstracts Supabase details

  // Handles user sign-in with email/password
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    // Password validation intentionally omitted; see validation.ts for rationale

    const { error } = await signIn(email, password)
    if (error) {
      // Show backend error to user; covers cases like invalid credentials, rate limiting, etc.
      setMessage(error.message)
    } else {
      // No redirect here: AuthContext manages navigation after successful login
    }
  }

  // Handles user registration with email/password
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    // Password validation intentionally omitted; see validation.ts for rationale

    const { error } = await signUp(email, password)
    if (error) {
      // Show backend error to user; covers duplicate accounts, weak passwords, etc.
      setMessage(error.message)
    } else {
      setView('check-email') // After successful sign-up, prompt user to check their email for confirmation
      // No redirect here: AuthContext manages navigation after confirmation
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      {view === 'check-email' ? (
        <p className="text-center">
          Check <span className="font-bold">{email}</span> to continue signing up
        </p>
      ) : (
        <>
          <form
            className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
            onSubmit={view === 'sign-in' ? handleSignIn : handleSignUp}
          >
            <Label className="text-md" htmlFor="email">
              Email
            </Label>
            <Input
              className="rounded-md px-4 py-2 bg-inherit border mb-6"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              placeholder="you@example.com"
            />
            <Label className="text-md" htmlFor="password">
              Password
            </Label>
            <Input
              className="rounded-md px-4 py-2 bg-inherit border mb-6"
              type="password"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              placeholder="••••••••"
            />
            {message && (
              // Shows both validation and backend errors; ensures user always gets feedback
              <p className="text-red-500 text-center text-sm">{message}</p>
            )}
            {view === 'sign-in' ? (
              <>
                <Button>Sign In</Button>
                <p className="text-center">
                  Don't have an account?
                  <button
                    type="button"
                    className="ml-1 font-bold"
                    onClick={() => setView('sign-up')}
                  >
                    Sign Up
                  </button>
                </p>
              </>
            ) : (
              <>
                <Button>Sign Up</Button>
                <p className="text-center">
                  Already have an account?
                  <button
                    type="button"
                    className="ml-1 font-bold"
                    onClick={() => setView('sign-in')}
                  >
                    Sign In
                  </button>
                </p>
              </>
            )}
          </form>
          {/* Google sign-in intentionally disabled for now; see business requirements */}
        </>
      )}
    </div>
  )
}