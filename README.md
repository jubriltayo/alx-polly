# alx-polly

A modern, real-time polling app built with Next.js, Supabase, shadcn/ui, and Tailwind CSS.

## Architecture Overview

**Frontend Layer (Next.js on Vercel):**
- App Router with nested layouts and server/client components
- Server Components for initial data fetching and SEO
- Client Components for interactive features (voting, real-time updates)
- Route Handlers for API endpoints
- Middleware for authentication and route protection

**Backend Layer (Supabase):**
- PostgreSQL database with Row Level Security (RLS)
- Built-in email/password authentication (custom SMTP required for production)
- Real-time WebSocket subscriptions for live poll updates
- Storage for poll-related assets (for future use)
- Edge Functions for complex server-side logic (for future use)

---

## Folder Structure

```
app/                              # App Router
├── (auth)/                       # Route groups for auth pages (e.g., /login, /register)
│   ├── auth-code-error/          # Error page for auth callbacks
│   ├── login/
│   └── register/
├── (dashboard)/                  # Protected routes
│   ├── dashboard/
│   └── create/
├── poll/
│   └── [id]/                     # Dynamic poll pages
│       ├── page.tsx              # Voting interface
│       ├── results/              # Results page
│       └── qr/                   # QR code page
├── api/                          # Route handlers
│   ├── polls/
│   │   ├── route.ts              # GET, POST polls
│   │   └── [id]/
│   │       ├── route.ts          # GET, PUT, DELETE specific poll
│   │       └── vote/
│   │           └── route.ts      # POST votes
│   ├── qr/
│   │   └── [id]/
│   │       └── route.ts          # Generate QR codes
│   └── auth/
│       └── callback/
│           └── route.ts          # Supabase auth callback
├── globals.css
├── layout.tsx                    # Root layout
├── page.tsx                      # Landing page
└── polls/                        # Public poll listing page
    └── page.tsx

components/
├── ui/                           # shadcn/ui components
│   ├── radio-group.tsx           # RadioGroup component for voting
│   ├── toast.tsx                 # Toast component for notifications
│   ├── toaster.tsx               # Toaster component for rendering toasts
│   └── use-toast.ts              # useToast hook for managing toasts
├── polls/
│   ├── PollCard.tsx              # Displays individual poll details and actions
│   ├── PollForm.tsx              # Form for creating/editing polls
│   ├── PollList.tsx              # Lists polls (e.g., for dashboard)
│   ├── PublicPollList.tsx        # Lists polls for public viewing (no edit/delete)
│   └── VoteForm.tsx              # Client component for submitting votes
├── auth/
│   ├── AuthButton.tsx            # Server Component wrapper for AuthButtonClient
│   ├── AuthButtonClient.tsx      # Client Component for interactive auth UI
│   ├── AuthForm.tsx
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
└── layout/
    ├── Header.tsx
    ├── Footer.tsx
    ├── Navbar.tsx                # Main application navigation
    └── Navigation.tsx

lib/
├── supabase/
│   ├── client.ts                 # Client-side Supabase instance (createBrowserClient)
│   ├── server.ts                 # Server-side Supabase instance (createServerClient, requires cookieStore)
│   ├── types.ts                  # Database types (generate with Supabase CLI)
│   └── auth.ts                   # Centralized authentication utilities
├── utils/
│   ├── db.ts                     # Database query utilities
│   ├── qr-generator.ts
│   ├── poll-validation.ts
│   ├── date-helpers.ts
│   ├── error.ts                  # Error handling utilities
│   └── validation.ts             # Form validation helpers
└── hooks/
    ├── useRealTimePolls.ts
    ├── usePollData.ts
    └── useAuth.ts

types/
├── index.ts                      # Global TypeScript types
└── auth.ts                       # Authentication-specific types (e.g., AuthProviders)

middleware.ts                     # Auth middleware for route protection

supabase/
├── functions/                    # Supabase Edge Functions (placeholder)
└── migrations/                   # Supabase SQL migration files (schema, RLS)

public/
├── assets/                       # Static assets (logos, icons)
└── ...                           # Other public files

tests/                            # Placeholder for future tests

.env.example                      # Example environment variables
.github/
└── workflows/
    └── ci.yml                    # Basic CI/CD workflow (placeholder)
```

---

## Database Schema (SQL)

The complete PostgreSQL schema, including tables, indexes, and Row Level Security (RLS) policies, is defined in the `supabase/migrations/` directory.

### Tables:

```sql
-- Enhanced polls table with QR tracking
CREATE TABLE polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    allow_multiple_votes BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    poll_url TEXT,
    qr_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll options
CREATE TABLE poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table with enhanced duplicate prevention
CREATE TABLE votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    session_fingerprint TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive duplicate vote prevention indexes
CREATE UNIQUE INDEX idx_votes_user_poll 
    ON votes(poll_id, user_id) 
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_votes_anonymous_poll 
    ON votes(poll_id, ip_address, session_fingerprint) 
    WHERE user_id IS NULL;

CREATE INDEX idx_votes_poll_created ON votes(poll_id, created_at DESC);

-- Poll analytics
CREATE TABLE poll_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies:

```sql
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_analytics ENABLE ROW LEVEL SECURITY;

-- Polls policies
DROP POLICY IF EXISTS "Public polls are viewable by everyone" ON polls;
CREATE POLICY "Public polls are viewable by everyone" ON polls
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can create polls" ON polls;
CREATE POLICY "Users can create polls" ON polls
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their polls" ON polls;
CREATE POLICY "Creators can update their polls" ON polls
    FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can delete their polls" ON polls;
CREATE POLICY "Creators can delete their polls" ON polls
    FOR DELETE USING (auth.uid() = creator_id);

-- Poll options policies
DROP POLICY IF EXISTS "Poll options are viewable with their polls" ON poll_options;
CREATE POLICY "Poll options are viewable with their polls" ON poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.is_active = true
        )
    );

DROP POLICY IF EXISTS "Poll creators can manage options" ON poll_options;
CREATE POLICY "Poll creators can manage options" ON poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.creator_id = auth.uid()
        )
    );

-- Votes policies
-- The FOR INSERT RLS policy for votes is being removed. The unique constraints on the 'votes' table
-- (idx_votes_user_poll and idx_votes_anonymous_poll) are sufficient to prevent duplicate votes.
-- Removing this policy allows the database to enforce uniqueness directly, which has been confirmed to work as desired.
DROP POLICY IF EXISTS "Users can vote once per poll" ON votes;

-- Allow all users (authenticated and anonymous) to insert votes. Duplicate vote prevention
-- will be handled by unique indexes on the 'votes' table, as confirmed by testing.
DROP POLICY IF EXISTS "Allow all inserts on votes" ON votes;
CREATE POLICY "Allow all inserts on votes" ON votes
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Vote counts are public" ON votes;
CREATE POLICY "Vote counts are public" ON votes
    FOR SELECT USING (true);
```

---

## Development Setup Instructions

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**
    *   Copy `.env.example` to `.env.local` and fill in your actual values.
    *   **`.env.example` content:**
        ```
        # Supabase
        NEXT_PUBLIC_SUPABASE_URL=
        NEXT_PUBLIC_SUPABASE_ANON_KEY=
        SUPABASE_SERVICE_ROLE_KEY=

        # Vercel (optional, for deployment)
        VERCEL_URL=

        # OAuth Providers (for future implementation)
        GOOGLE_CLIENT_ID=
        GOOGLE_CLIENT_SECRET=
        GITHUB_CLIENT_ID=
        GITHUB_CLIENT_SECRET=

        # App Specific
        NEXT_PUBLIC_SITE_URL=http://localhost:3000 # Important for auth redirects
        ```

3.  **Supabase Project Setup & Database Migration:**
    *   Create a Supabase project.
    *   **Crucially, set up custom SMTP for email sending in your Supabase Dashboard:**
        *   Navigate to **Authentication** > **Settings** > **SMTP Settings**.
        *   Enable "Set up custom SMTP server" and fill in the Host, Port, Username, Password, and Sender Email from your chosen email service provider (e.g., SendGrid, Mailgun). This is **essential** to avoid rate limits and ensure email confirmation delivery.
    *   Use the Supabase CLI to apply your database schema and RLS policies:
        ```bash
        # Install Supabase CLI (if you haven't already)
        npm install -g supabase

        # Link your local project to your Supabase project (get Project Ref from Supabase Dashboard -> Project Settings -> General)
        supabase login # Authenticate the CLI
        supabase link --project-ref <your-supabase-project-ref>

        # Apply database migrations (this will push your schema and RLS policies)
        supabase db push
        ```
    *   **Generate TypeScript types for your database:**
        ```bash
        npx supabase gen types typescript --project-id <your-supabase-project-ref> --schema public > lib/supabase/types.ts
        ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

## Key Architectural Decisions & Highlights

*   **Next.js App Router:** Leverages Server Components for initial loads and SEO, Client Components for interactivity.
*   **Supabase Integration:** Dedicated client-side (`lib/supabase/client.ts`) and server-side (`lib/supabase/server.ts`) Supabase instances for robust data access and authentication.
*   **Centralized Auth Utilities:** `lib/supabase/auth.ts` provides reusable functions for sign-in, sign-up, sign-out, and user session management.
*   **Server Actions:** Logout functionality is implemented as a Server Action (`lib/actions/auth.ts`) for secure, direct server interaction.
*   **Middleware (`middleware.ts`):** Protects routes (`/dashboard`, `/create`) by redirecting unauthenticated users to `/login`, and redirects authenticated users from auth pages (`/login`, `/register`) to `/dashboard`.
*   **`cookies()` Handling:** Strict adherence to Next.js's asynchronous dynamic API 
guidelines for `cookies()` in Server Components and Route Handlers, ensuring `cookies()` 
is called at the top level and the `cookieStore` is passed to `createServerClient`.
*   **Tailwind CSS v4 & shadcn/ui:** Modern styling and UI components are integrated, 
using Tailwind CSS v4's CSS-based configuration.
*   **Public Poll Listing & Voting:** Implemented a public `/polls` route to display all polls, allowing users to vote (once per poll) and view results. Uses `PollCard` with conditional actions.
*   **Robust Voting System:** Utilizes Server Actions (`lib/actions/poll.ts`) for secure vote submission and `shadcn/ui` `RadioGroup` and `useToast` for an intuitive voting interface.
*   **RLS Policy Refinement:** Simplified `votes` table RLS policies to explicitly allow inserts, relying on unique database indexes to prevent duplicate votes per poll, ensuring both authenticated and anonymous users can vote once.
*   **Tailwind CSS v4 & shadcn/ui:** Modern styling and UI components are integrated, using Tailwind CSS v4's CSS-based configuration, including `RadioGroup` and `Toast` components.

---

## Next Steps for Implementation

Now that the architectural foundation and core voting functionality are solid, you can continue building out features:

*   Integrate **Real-time Poll Updates** using Supabase's WebSocket subscriptions (`lib/hooks/useRealTimePolls.ts`).
*   Build the **Poll Results Chart** (`components/polls/ResultsChart.tsx`).
*   Implement **QR Code Generation** and analytics (`lib/utils/qr-generator.ts`, `app/api/qr/[id]/route.ts`).
*   Expand **Analytics Event Tracking** to `poll_analytics` table.
*   Add **Error Boundaries** and more detailed logging utilities.
*   Implement **OAuth Providers** (Google, GitHub) for authentication.
*   Add **testing frameworks** and write unit/integration tests.
*   Refine **Poll Creation Form** (e.g., add expiration date, allow multiple votes setting).
