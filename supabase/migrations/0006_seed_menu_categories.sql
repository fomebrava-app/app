-- Categorias mais comuns já disponíveis por padrão no cardápio.
-- Idempotente: usa a constraint unique de menu_categories.nome (0001_init.sql).
insert into public.menu_categories (nome, ordem) values
  ('Salgados', 1),
  ('Porções', 2),
  ('Bebidas', 3),
  ('Sobremesa', 4),
  ('Doces', 5)
on conflict (nome) do nothing;
