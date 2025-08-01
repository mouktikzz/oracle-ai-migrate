-- Create storage_files table for tracking files from Supabase storage buckets
create table if not exists "public"."storage_files" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "bucket_name" text not null,
    "file_path" text not null,
    "file_name" text not null,
    "file_size" bigint,
    "file_type" text,
    "conversion_status" text not null default 'pending',
    "original_content" text,
    "converted_content" text,
    "error_message" text,
    "migration_id" uuid,
    "performance_metrics" jsonb,
    "issues" jsonb,
    "data_type_mapping" jsonb,
    "syntax_differences" jsonb
);

-- Create indexes for better performance
create index if not exists "storage_files_user_id_idx" on "public"."storage_files" ("user_id");
create index if not exists "storage_files_bucket_name_idx" on "public"."storage_files" ("bucket_name");
create index if not exists "storage_files_conversion_status_idx" on "public"."storage_files" ("conversion_status");
create index if not exists "storage_files_migration_id_idx" on "public"."storage_files" ("migration_id");

-- Enable RLS
alter table "public"."storage_files" enable row level security;

-- Create policies
create policy "Users can view their own storage files"
on "public"."storage_files"
as permissive
for select
to public
using ((auth.uid() = user_id));

create policy "Users can insert their own storage files"
on "public"."storage_files"
as permissive
for insert
to public
with check ((auth.uid() = user_id));

create policy "Users can update their own storage files"
on "public"."storage_files"
as permissive
for update
to public
using ((auth.uid() = user_id));

create policy "Users can delete their own storage files"
on "public"."storage_files"
as permissive
for delete
to public
using ((auth.uid() = user_id));

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_storage_files_updated_at
    before update on storage_files
    for each row
    execute function update_updated_at_column(); 