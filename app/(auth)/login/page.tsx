import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function AuthPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Authentication</h1>
      <LoginForm />
    </div>
  );
}
