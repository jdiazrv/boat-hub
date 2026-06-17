select
  name,
  identifier,
  flag,
  dimensions is not null as has_dimensions,
  tanks is not null as has_tanks,
  identifiers is not null as has_identifiers,
  case when tanks is not null then jsonb_array_length(tanks) else 0 end as tank_count,
  (dimensions->>'P') as P,
  (dimensions->>'loa') as loa,
  case when dimensions->'polarRows' is not null then jsonb_array_length(dimensions->'polarRows') else 0 end as polar_rows,
  case when dimensions->'sails' is not null then jsonb_array_length(dimensions->'sails') else 0 end as sail_count
from public.boats
order by name;
