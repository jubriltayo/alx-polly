"use client";
import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

/**
 * Purpose:
 *   Renders the authentication (login) page, providing users with a UI to sign in to the polling app.
 *
 * Why:
 *   Centralizes authentication in a dedicated route, ensuring a consistent and secure entry point for user sessions.
 *   This separation allows for easier updates to authentication flows and UI, and supports future extensibility (e.g., SSO, magic links).
 *
 * Assumptions:
 *   - Assumes <LoginForm /> encapsulates all authentication logic, including form validation and error handling.
 *   - Assumes this page is only accessible to unauthenticated users (enforced by upstream middleware or layout).
 *
 * Edge cases:
 *   - If <LoginForm /> encounters authentication errors (e.g., invalid credentials, network issues), it is responsible for displaying error states.
 *   - Handles cases where a user navigates here while already authenticated (should be redirected elsewhere by higher-level logic).
 *
 * Used by:
 *   - The Next.js App Router as the default export for the /login route segment.
 *   - Navigated to from authentication-required flows, or when a session expires.
 */
export default function AuthPage() {
  return (
    <div className="container mx-auto py-10">
      {/* LoginForm handles all authentication logic and error display internally */}
      <h1 className="text-2xl font-bold mb-6">Authentication</h1>
      <LoginForm />
    </div>
  );
}
