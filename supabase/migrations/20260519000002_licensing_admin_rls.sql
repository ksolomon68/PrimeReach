-- Admin RLS policies for ks@evobrand.net
create policy "Admin can read licenses"
  on licenses for select to authenticated
  using ((auth.jwt()->>'email') = 'ks@evobrand.net');

create policy "Admin can insert licenses"
  on licenses for insert to authenticated
  with check ((auth.jwt()->>'email') = 'ks@evobrand.net');

create policy "Admin can update licenses"
  on licenses for update to authenticated
  using ((auth.jwt()->>'email') = 'ks@evobrand.net');

create policy "Admin can read requests"
  on license_requests for select to authenticated
  using ((auth.jwt()->>'email') = 'ks@evobrand.net');

create policy "Admin can update requests"
  on license_requests for update to authenticated
  using ((auth.jwt()->>'email') = 'ks@evobrand.net');

create policy "Admin can read transfers"
  on license_transfers for select to authenticated
  using ((auth.jwt()->>'email') = 'ks@evobrand.net');

create policy "Admin can update transfers"
  on license_transfers for update to authenticated
  using ((auth.jwt()->>'email') = 'ks@evobrand.net');

create policy "Admin can read events"
  on license_events for select to authenticated
  using ((auth.jwt()->>'email') = 'ks@evobrand.net');

create policy "Admin can insert events"
  on license_events for insert to authenticated
  with check ((auth.jwt()->>'email') = 'ks@evobrand.net');
