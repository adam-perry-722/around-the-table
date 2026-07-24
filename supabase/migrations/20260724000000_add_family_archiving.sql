-- Families are archived instead of deleted so saved sessions can continue to
-- resolve their names. Existing families remain active after this migration.
alter table public.families
add column if not exists archived boolean not null default false;

create index if not exists families_archived_idx
on public.families (archived);
