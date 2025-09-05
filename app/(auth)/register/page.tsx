"use client";
import React from 'react'
import { RegisterForm } from '@/components/auth/RegisterForm'

/**
 * Purpose:
 *   Renders the user registration page, providing a UI for new users to create an account.
 *
 * Why:
 *   Separates registration into a dedicated route to streamline onboarding and maintain a clear authentication flow.
 *   This modularity supports future changes to registration logic or UI without impacting other auth areas.
 *
 * Assumptions:
 *   - <RegisterForm /> encapsulates all registration logic, including validation, error handling, and Supabase integration.
 *   - This page is only accessible to unauthenticated users (enforced by upstream middleware or layout).
 *
 * Edge cases:
 *   - If <RegisterForm /> encounters errors (e.g., duplicate email, network issues), it is responsible for displaying error states.
 *   - Handles cases where a user navigates here while already authenticated (should be redirected elsewhere by higher-level logic).
 *
 * Used by:
 *   - The Next.js App Router as the default export for the /register route segment.
 *   - Navigated to from login flows or when a user chooses to sign up.
 */
export default function RegisterPage() {
  return (
    <div className="container mx-auto py-10">
      {/* RegisterForm handles all registration logic and error display internally */}
      <h1 className="text-2xl font-bold mb-6">Create an account</h1>
      <RegisterForm />
    </div>
  )
}