#  Smart Bookmark App

A real-time, private bookmark manager built with Next.js App Router and Supabase.

##  Features

-  Google OAuth authentication (No email/password)
-  Add bookmarks (Title + URL)
-  Private bookmarks per user (Row Level Security)
-  Real-time updates across tabs
-  Delete your own bookmarks
-  Clean responsive UI with TailwindCSS

##  Tech Stack

Frontend:
- Next.js (App Router)
- Tailwind CSS

Supabase Database:
- Supabase Auth (Google OAuth)
- Supabase Realtime
- Row Level Security (RLS)

#  Project Structure

 smart-bookmark-app/
- ├── src/
- │ ├── app/
- │ │ ├── globals.css
- │ │ ├── layout.tsx
- │ │ ├── page.tsx
- │ │
- │ ├── lib/
- │ │ └── supabaseClient.ts
- │
- ├── .env.local
- ├── package.json
- ├── tailwind.config.js
- └── README.md

# Authentication Flow

- 1. User clicks "Login with Google"
- 2. Supabase OAuth redirects to Google
- 3. Google authenticates user
- 4. Supabase stores session
- 5. Frontend retrieves authenticated user using:
supabase.auth.getUser()


# Database Schema

- create table bookmarks (
 -  id uuid default uuid_generate_v4() primary key,
 -  user_id uuid references auth.users not null,
 -   url text not null,
 -  title text not null,
 -  created_at timestamp with time zone default now()
- );


- # Row Level Security (RLS)
- RLS ensures:
- User A cannot see User B’s bookmarks
- Users can only insert/delete their own data Enable RLS

- # Enable RLS
- alter table bookmarks enable row level security;

- # Insert
  - create policy "Users can insert their own bookmarks"
  - on bookmarks
  - for insert
  - with check (auth.uid() = user_id);

- # Select
  - create policy "Users can view their own bookmarks"
  - on bookmarks
  - for select
  - using (auth.uid() = user_id);

- # Delete
  - create policy "Users can delete their own bookmarks"
  - on bookmarks
  - for delete
  - using (auth.uid() = user_id);

- # Real-Time Updates
  - Supabase Realtime listens to database changes
  - supabase
   - .channel("bookmarks-channel")
  - .on(
   - "postgres_changes",
   - { event: "*", schema: "public", table: "bookmarks" },
   - () => fetchBookmarks()
  )
   .subscribe();

- If two tabs are open:
- Adding bookmark in one tab
- Automatically updates in the other tab
- No refresh needed.

# Environment Variables
- Create .env.local:
- NEXT_PUBLIC_SUPABASE_URL=your_project_url
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Running the Project
1. Install dependencies
- npm install

2. Start development server
- npm run dev

- Open
- http://localhost:3000

# How It Works (Architecture)

- User → Google OAuth → Supabase Auth
- User → Insert bookmark → Supabase Database
- Database change → Supabase Realtime → UI auto-updates

- App Router handles rendering.
- Supabase handles backend.
- Tailwind handles styling.

# Why App Router?
- Server-first architecture
- Cleaner routing structure
- Better scalability
- Modern Next.js standard

# conclusion
- This project demonstrates:
- OAuth integration
- Row Level Security implementation
- Real-time systems
- Modern Next.js App Router usage
- Secure multi-user architecture
