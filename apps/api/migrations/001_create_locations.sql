-- locations: the places users can search and select.
-- Seed data arrives in W2D2. State/country rows use one representative point.
CREATE TABLE locations (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                text        NOT NULL,
  level               text        NOT NULL
                      CHECK (level IN ('city', 'district', 'state', 'country')),
  country_code        char(2)     NOT NULL,
  admin1              text,
  lat                 numeric(8, 5) NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lon                 numeric(8, 5) NOT NULL CHECK (lon BETWEEN -180 AND 180),
  representative_note text,
  is_popular          boolean     NOT NULL DEFAULT false,
  region              text,
  supported           boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- The same place cannot be inserted twice (re-running a seed is safe).
CREATE UNIQUE INDEX locations_identity_key
  ON locations (lower(name), level, country_code, COALESCE(lower(admin1), ''));

-- Prefix search: WHERE lower(name) LIKE 'ahm%'
CREATE INDEX locations_name_prefix_idx
  ON locations (lower(name) text_pattern_ops);

-- GET /locations/popular
CREATE INDEX locations_popular_idx
  ON locations (name) WHERE is_popular AND supported;

-- Only our backend reads this table. With RLS on and no policies, the public
-- Supabase API cannot read it; the backend's postgres role bypasses RLS.
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
