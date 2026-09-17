-- Bucket público para fotos dos itens do cardápio.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- Leitura é liberada pelo bucket público; só escrita precisa de policy.
create policy "menu_images_admin_write" on storage.objects
  for all
  using (
    bucket_id = 'menu-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    bucket_id = 'menu-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
