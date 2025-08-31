'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { signInWithEmail, signUpWithEmail } from '@/lib/supabase/auth' // Import auth utilities

export function LoginForm() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [view, setView] = useState('sign-in') // 'sign-in' or 'check-email'
  const [message, setMessage] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    const { error } = await signInWithEmail(email, password)
    if (error) {
      setMessage(error.message)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    const { error } = await signUpWithEmail(email, password)
    if (error) {
      setMessage(error.message)
    } else {
      setView('check-email')
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
            {message && <p className="text-red-500 text-center text-sm">{message}</p>}
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
          {/* Temporarily remove Google Sign-in as we're focusing on email/password */}
          {/* <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleGoogleSignIn}
          >
            Sign in with Google
          </Button> */}
        </>
      )}
    </div>
  )
}