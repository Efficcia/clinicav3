-- Supabase Database Setup Script
-- This script enables RLS on all tables and clears existing data
-- Execute this in the Supabase SQL Editor

begin;
  -- Enable RLS on all tables
  alter table public.patients enable row level security;
  alter table public.professionals enable row level security;
  alter table public.team_members enable row level security;
  alter table public.appointments enable row level security;
  alter table public.financial_entries enable row level security;
  alter table public.waitlist enable row level security;
  alter table public.company enable row level security;

  -- Allow anonymous read access for all tables
  create policy "allow anon read patients"
    on public.patients
    for select
    using (auth.role() = 'anon');

  create policy "allow anon read professionals"
    on public.professionals
    for select
    using (auth.role() = 'anon');

  create policy "allow anon read team members"
    on public.team_members
    for select
    using (auth.role() = 'anon');

  create policy "allow anon read appointments"
    on public.appointments
    for select
    using (auth.role() = 'anon');

  create policy "allow anon read financial entries"
    on public.financial_entries
    for select
    using (auth.role() = 'anon');

  create policy "allow anon read waitlist"
    on public.waitlist
    for select
    using (auth.role() = 'anon');

  create policy "allow anon read company"
    on public.company
    for select
    using (auth.role() = 'anon');

  -- Optional: Allow anonymous write access (uncomment if needed)
  -- Note: Only enable if you want direct frontend write access
  -- Otherwise, use Netlify Functions with service_role for writes

  -- create policy "allow anon insert professionals"
  --   on public.professionals
  --   for insert
  --   with check (auth.role() = 'anon');

  -- create policy "allow anon update professionals"
  --   on public.professionals
  --   for update
  --   using (auth.role() = 'anon')
  --   with check (auth.role() = 'anon');

  -- Clear all existing data
  truncate table public.appointments,
                 public.financial_entries,
                 public.team_members,
                 public.professionals,
                 public.patients,
                 public.waitlist,
                 public.company
  restart identity cascade;

commit;