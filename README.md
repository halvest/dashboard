# HKI (IPR) Admin Dashboard

A comprehensive admin dashboard for managing Intellectual Property Rights (HKI) entries built with Next.js 14, TypeScript, Supabase, and shadcn/ui.

## Features

- **Authentication**: Email/password authentication with admin role verification
- **CRUD Operations**: Complete management of HKI entries with search, filter, and pagination
- **File Management**: PDF upload with secure storage and temporary signed URLs
- **Data Validation**: Duplicate prevention and comprehensive form validation
- **Admin Interface**: Professional dashboard with sidebar navigation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Deployment**: Vercel
- **Validation**: Zod + React Hook Form

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Setup

The application includes SQL migrations that need to be run in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration files in order

### 3. Supabase Storage Setup

Create a storage bucket called `sertifikat` in your Supabase project:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `sertifikat`
3. Set it as private (non-public)

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Add the environment variables in Vercel dashboard
3. Deploy

## Project Structure

```
app/
├── layout.tsx                 # Root layout
├── login/page.tsx            # Login page
├── dashboard/page.tsx        # Dashboard overview
├── hki/                      # HKI management pages
│   ├── page.tsx             # List view with table
│   ├── create/page.tsx      # Create form
│   ├── [id]/edit/page.tsx   # Edit form
│   └── [id]/view/page.tsx   # Detail view
└── api/                      # API routes
    └── hki/
        ├── route.ts         # GET (list) / POST (create)
        └── [id]/
            ├── route.ts     # GET one / PATCH / DELETE
            └── signed-url/route.ts # PDF signed URL

components/
├── ui/                       # shadcn/ui components
├── layout/                   # Layout components
├── hki/                      # HKI-specific components
└── forms/                    # Form components

lib/
├── supabase-browser.ts       # Browser client
├── supabase-server.ts        # Server client
├── auth.ts                   # Auth helpers
└── utils.ts                  # Utilities

middleware.ts                 # Route protection
```

## Database Schema

### profiles table
- Extends Supabase auth.users with is_admin field

### hki table
- Complete HKI entry management with all required fields
- Unique constraint on nama_hki
- Audit fields (created_at, updated_at)

## Usage

1. **Login**: Use email/password to authenticate
2. **Admin Access**: Only users with `is_admin = true` can access the dashboard
3. **Manage HKI**: Create, edit, view, and delete HKI entries
4. **Upload PDFs**: Secure file upload with temporary access URLs
5. **Search & Filter**: Advanced filtering by type, status, and year

## License

MIT License