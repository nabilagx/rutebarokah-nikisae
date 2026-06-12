-- RuteBarokah MVP RLS reference.
-- Jalankan di Supabase SQL Editor setelah tabel dibuat.
-- Sesuaikan nama kolom role di profiles bila berbeda.

alter table profiles enable row level security;
alter table umkm_profiles enable row level security;
alter table vendor_requests enable row level security;
alter table leads enable row level security;

create policy "profiles read own profile"
on profiles for select
to authenticated
using (id = auth.uid());

create policy "public read approved umkm"
on umkm_profiles for select
to anon, authenticated
using (status = 'approved');

create policy "owner read own umkm"
on umkm_profiles for select
to authenticated
using (user_id = auth.uid());

create policy "admin read all umkm"
on umkm_profiles for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "public submit umkm registration"
on umkm_profiles for insert
to anon, authenticated
with check (status = 'pending');

create policy "owner update own umkm"
on umkm_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "admin update umkm"
on umkm_profiles for update
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "public insert vendor requests"
on vendor_requests for insert
to anon, authenticated
with check (true);

create policy "admin read vendor requests"
on vendor_requests for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "public insert leads"
on leads for insert
to anon, authenticated
with check (true);

create policy "admin read leads"
on leads for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "owner read own leads"
on leads for select
to authenticated
using (
  exists (
    select 1 from umkm_profiles
    where umkm_profiles.id = leads.umkm_id
    and umkm_profiles.user_id = auth.uid()
  )
);

