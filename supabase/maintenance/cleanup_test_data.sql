-- Removes test records left in the production database by the automated e2e/smoke
-- tests (found in the audit of 2026-09-20). NOTHING here runs by itself.
--
-- 1) Run the SELECTs and check the rows are really test data.
-- 2) The DELETEs are inside a transaction that ends in ROLLBACK. Once the counts look
--    right, change the last line to COMMIT and run the block again.

-- Preview
select 'marinas' as tbl, id, name, created_at from public.marinas where name like 'Codex smoke marina%'
union all
select 'shipyards', id, name, created_at from public.shipyards where name like 'Codex smoke varadero%'
order by tbl, created_at;

begin;

  -- Marinas/shipyards may be referenced by haul-outs; clear the reference first.
  update public.haul_outs set shipyard_id = null
   where shipyard_id in (select id from public.shipyards where name like 'Codex smoke varadero%');

  delete from public.marinas   where name like 'Codex smoke marina%';
  delete from public.shipyards where name like 'Codex smoke varadero%';

rollback;  -- change to COMMIT when the preview above was correct

-- Not automated on purpose (check each one in the app first):
--   * REWIND, "Notas motor": "Test e2e — notas actualizadas"
--   * REWIND, Velas: "Foque tormenta E2E"
--   * Boat "Northwind" (id bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb) is a seed/demo boat
--   * REWIND, Tanques: "Diesel 2" is typed as fresh water; change its type to fuel
--   * Duplicate marinas "Αρετσού" (three identical rows)
