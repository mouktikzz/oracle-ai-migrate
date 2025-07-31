-- SQL Script to create the conversion_comments table in NEW Supabase account
-- Run this in your NEW Supabase Dashboard → SQL Editor

-- Create a table for conversion comments
create table "public"."conversion_comments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "file_id" text not null,
    "file_name" text not null,
    "comment" text not null,
    "conversion_id" text,
    "is_public" boolean default false
);

-- Create indexes for better performance
create index "conversion_comments_user_id_idx" on "public"."conversion_comments" ("user_id");
create index "conversion_comments_file_id_idx" on "public"."conversion_comments" ("file_id");
create index "conversion_comments_conversion_id_idx" on "public"."conversion_comments" ("conversion_id");

-- Enable row level security
alter table "public"."conversion_comments" enable row level security;

-- Create policy that allows users to view their own comments
create policy "Users can view their own comments"
on "public"."conversion_comments"
as permissive
for select
to public
using ((auth.uid() = user_id));

-- Create policy that allows users to insert their own comments
create policy "Users can insert their own comments"
on "public"."conversion_comments"
as permissive
for insert
to public
with check ((auth.uid() = user_id));

-- Create policy that allows users to update their own comments
create policy "Users can update their own comments"
on "public"."conversion_comments"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));

-- Create policy that allows users to delete their own comments
create policy "Users can delete their own comments"
on "public"."conversion_comments"
as permissive
for delete
to public
using ((auth.uid() = user_id));

-- Enable realtime for automatic updates
ALTER TABLE public.conversion_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversion_comments;

-- Create a function to automatically update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create a trigger to automatically update the updated_at column
create trigger update_conversion_comments_updated_at
    before update on "public"."conversion_comments"
    for each row
    execute function update_updated_at_column(); 