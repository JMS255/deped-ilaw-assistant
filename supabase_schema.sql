-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

create table if not exists students (
  id uuid primary key,
  full_name text not null,
  grade_level text not null,
  section text not null,
  school_year text not null,
  created_at timestamptz default now()
);

create table if not exists reading_levels (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  level text not null,
  notes text default '',
  assessed_date date not null,
  created_at timestamptz default now(),
  unique(student_id)
);

create table if not exists math_levels (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  level text not null,
  notes text default '',
  assessed_date date not null,
  created_at timestamptz default now(),
  unique(student_id)
);

create table if not exists health_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  height_cm float not null,
  weight_kg float not null,
  bmi float not null,
  bmi_category text not null,
  assessed_date date not null,
  created_at timestamptz default now(),
  unique(student_id)
);