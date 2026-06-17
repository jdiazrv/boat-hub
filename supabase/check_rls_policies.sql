select policyname, cmd, qual, with_check
from pg_policies
where tablename = 'boats'
order by cmd, policyname;
