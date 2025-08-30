# alx-polly

A modern, real-time polling app built with Next.js, Supabase, shadcn/ui, and Tailwind CSS.

## Architecture Overview

**Frontend:**
- Next.js App Router (nested layouts, server/client components)
- shadcn/ui + Tailwind CSS for UI
- Route Handlers for API endpoints
- Middleware for authentication and route protection

**Backend:**
- Supabase (PostgreSQL, RLS, Auth, Real-time, Storage, Edge Functions)

## Folder Structure

```
app/
  (auth)/
    login/
    register/
  (dashboard)/
    dashboard/
    create/
  poll/
    [id]/
      page.tsx
      results/
      qr/
  api/
    polls/
      route.ts
      [id]/
        route.ts
        vote/
          route.ts
    qr/
      [id]/
        route.ts
    auth/
      callback/
        route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  ui/
  polls/
    PollCard.tsx
    PollForm.tsx
    VotingInterface.tsx
    ResultsChart.tsx
  auth/
    AuthButton.tsx
    AuthForm.tsx
  layout/
    Header.tsx
    Footer.tsx
    Navigation.tsx
lib/
  supabase/
    client.ts
    server.ts
    types.ts
  utils/
    qr-generator.ts
    poll-validation.ts
    date-helpers.ts
  hooks/
    useRealTimePolls.ts
    usePollData.ts
    useAuth.ts
types/
  index.ts
middleware.ts
supabase/
  functions/
public/
  assets/
tests/
  (placeholder for future tests)
.env.example
.github/
  workflows/
    ci.yml
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   - Copy `.env.example` to `.env.local` and fill in Supabase, Vercel, and OAuth provider values.
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. **Supabase:**
   - Set up your Supabase project and database schema as described in `/supabase`.
   - Enable RLS and configure policies.
5. **shadcn/ui:**
   - UI components are scaffolded and ready for extension.
6. **Testing:**
   - Placeholder `tests/` directory included. Add your preferred testing framework later.
7. **CI/CD:**
   - Basic GitHub Actions workflow is scaffolded in `.github/workflows/ci.yml`.

## Next Steps

- Implement authentication flows (login, register, callback)
- Build poll creation and voting interfaces
- Integrate Supabase client/server logic
- Set up real-time subscriptions for live poll updates
- Implement analytics event tracking
- Add error boundaries and logging utilities
- Expand tests and CI/CD as features are built

## Notes
- This project uses strict TypeScript settings for safety and maintainability.
- UI is built with shadcn/ui and Tailwind CSS for rapid, accessible development.
- Supabase Edge Functions and advanced features are scaffolded for future use.
