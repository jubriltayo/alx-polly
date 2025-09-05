# ALX Polly

A modern, real-time polling application built with Next.js 15, Supabase, and shadcn/ui. Create polls, share them publicly, and get instant results with a clean, responsive interface.

## Features

- **Poll Creation & Management**: Create polls with multiple options, edit existing polls, and delete when needed
- **Public & Private Voting**: Share polls publicly or keep them private to your dashboard
- **Real-time Results**: See vote counts update in real-time as users participate
- **Duplicate Vote Prevention**: Robust system prevents multiple votes from the same user/session/IP
- **QR Code Sharing**: Generate QR codes for easy poll sharing
- **Mobile Responsive**: Works seamlessly across desktop and mobile devices
- **Authentication**: Secure user registration and login with email verification

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui components with Radix UI primitives
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time subscriptions)
- **Deployment**: Vercel (recommended)
- **Styling**: Tailwind CSS with custom configuration

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd alx-polly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # App Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   
   Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
   
   Link to your project and apply migrations:
   ```bash
   supabase login
   supabase link --project-ref your_project_ref_id
   supabase db push
   ```

5. **Configure Supabase Authentication**
   
   In your Supabase Dashboard:
   - Go to Authentication > Settings > SMTP Settings
   - Set up a custom SMTP server (required for production email delivery)
   - Configure your site URL: `http://localhost:3000` for development

6. **Generate TypeScript types**
   ```bash
   npx supabase gen types typescript --project-id your_project_ref_id --schema public > lib/supabase/types.ts
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see your application running.

## Usage Examples

### Creating a Poll

1. Register/login to your account
2. Navigate to the dashboard
3. Click "Create Poll"
4. Add a title, description (optional), and 2-10 options
5. Click "Create Poll" to publish

### Sharing a Poll

- **Public Link**: Share the poll URL directly
- **QR Code**: Generate a QR code from the poll page for easy mobile access
- **Dashboard**: Manage all your polls from the dashboard

### Voting on a Poll

- Visit any poll URL (authentication not required)
- Select an option and click "Vote"
- View results immediately after voting
- Each user/session/IP can only vote once per poll

## Project Structure

```
alx-polly/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard routes  
│   ├── poll/[id]/         # Dynamic poll pages
│   ├── api/               # API route handlers
│   └── polls/             # Public poll listing
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── polls/             # Poll-specific components
│   ├── auth/              # Authentication components
│   └── layout/            # Layout components
├── lib/                   # Utilities and configurations
│   ├── supabase/          # Supabase client configurations
│   ├── utils/             # Helper utilities
│   └── hooks/             # Custom React hooks
├── supabase/
│   └── migrations/        # Database schema and RLS policies
└── types/                 # TypeScript type definitions
```

## Database Schema

The application uses PostgreSQL with Row Level Security (RLS) for data protection:

- **polls**: Store poll metadata (title, description, creator)
- **poll_options**: Individual options for each poll
- **votes**: Vote records with duplicate prevention
- **poll_analytics**: Analytics and usage tracking

All tables include proper indexes and RLS policies for security and performance.

## Key Features Explained

### Authentication & Security

- Email-based authentication with Supabase Auth
- Row Level Security (RLS) policies protect user data
- Server-side validation for all database operations
- CSRF protection through Next.js Server Actions

### Voting System

- Prevents duplicate votes using multiple strategies:
  - User ID for authenticated users
  - IP address + session fingerprint for anonymous users
- Database-level unique constraints ensure data integrity
- Real-time vote count updates

### Poll Management

- Server Actions handle all CRUD operations securely
- Automatic cleanup of related data when polls are deleted
- Poll creators have full control over their content
- Public polls are discoverable on the /polls page

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_SITE_URL` to your domain
5. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Email verification not working**
- Ensure SMTP settings are configured in Supabase Dashboard
- Check that `NEXT_PUBLIC_SITE_URL` matches your development/production URL

**Database connection errors**
- Verify your Supabase credentials in `.env.local`
- Ensure database migrations are applied: `supabase db push`

**Authentication redirects failing**
- Check that your site URL is configured correctly in Supabase Auth settings
- Verify middleware configuration in `middleware.ts`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for the ALX Software Engineering Program
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and authentication by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)