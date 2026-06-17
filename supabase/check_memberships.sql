select
  b.name as boat,
  p.email,
  bm.role,
  count(bmp.permission) as permission_count
from public.boat_memberships bm
join public.boats b on b.id = bm.boat_id
join public.user_profiles p on p.id = bm.user_id
left join public.boat_membership_permissions bmp on bmp.membership_id = bm.id
group by b.name, p.email, bm.role
order by b.name, p.email;
