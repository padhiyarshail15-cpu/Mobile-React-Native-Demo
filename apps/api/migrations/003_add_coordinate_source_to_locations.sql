-- Records where each location's coordinates came from, so seed data is never
-- mistaken for an authoritative gazetteer. The table is empty when this runs
-- (seeding happens after migrations), so NOT NULL is safe.
ALTER TABLE locations ADD COLUMN coordinate_source text NOT NULL;
