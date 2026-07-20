-- Tabla + función para mantener activo Supabase (evita pausa por 7 días de inactividad).
-- El cron de Vercel llama /api/keepalive una vez por día y suma 1 para siempre.

create table if not exists keepalive (
  id int primary key default 1,
  count bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into keepalive (id, count) values (1, 0)
on conflict (id) do nothing;

-- Incremento atómico
create or replace function increment_keepalive()
returns bigint
language sql
as $$
  update keepalive
  set count = count + 1, updated_at = now()
  where id = 1
  returning count;
$$;
