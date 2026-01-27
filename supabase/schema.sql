-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  weight numeric,
  height numeric,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security!
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Exercises table
create table exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text, -- 'Barbell', 'Dumbbell', 'Bodyweight', 'Machine'
  primary_muscle_group text,
  is_bodyweight boolean default false,
  default_video_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table exercises enable row level security;
create policy "Exercises are viewable by everyone" on exercises for select using (true);
-- Only admins can insert exercises, but for now allow authenticated maybe? No, seed only.

-- Training Programs
create table training_programs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  competition_date date,
  start_date date default requesting_user_id(), -- wait, no
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table training_programs enable row level security;
create policy "Users can CRUD own programs" on training_programs for all using (auth.uid() = user_id);

-- Workouts
create table workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  program_id uuid references training_programs,
  date timestamp with time zone not null,
  name text,
  notes text,
  status text default 'Planned', -- 'Planned', 'Completed'
  strava_activity_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workouts enable row level security;
create policy "Users can CRUD own workouts" on workouts for all using (auth.uid() = user_id);

-- Workout Exercises (Join table)
create table workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references workouts on delete cascade not null,
  exercise_id uuid references exercises not null,
  order_index integer,
  video_link text -- User added video (Insta/YouTube)
);

alter table workout_exercises enable row level security;
create policy "Users can CRUD own workout exercises" on workout_exercises for all using (
  exists ( select 1 from workouts where id = workout_exercises.workout_id and user_id = auth.uid() )
);

-- Sets
create table sets (
  id uuid default uuid_generate_v4() primary key,
  workout_exercise_id uuid references workout_exercises on delete cascade not null,
  reps integer not null,
  weight_kg numeric not null,
  is_pr boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table sets enable row level security;
create policy "Users can CRUD own sets" on sets for all using (
  exists (
    select 1 from workout_exercises we
    join workouts w on w.id = we.workout_id
    where we.id = sets.workout_exercise_id and w.user_id = auth.uid()
  )
);

-- Trigger to handle new user signup -> create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
