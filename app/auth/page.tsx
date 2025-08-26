import React from 'react';
import { LoginForm } from '@/app/components/auth/login-form';

export default function AuthPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Authentication</h1>
      <LoginForm />
    </div>
  );
}