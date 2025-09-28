-- Test PostGIS extension
create extension if not exists postgis;

-- Verify extension
select PostGIS_Version();

-- Test spatial functions
select ST_MakePoint(110.4917, -7.7522);