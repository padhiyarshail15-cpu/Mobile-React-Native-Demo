-- datasets: describes where each number comes from (provenance).
-- Rows are inserted in W3 after the provider spike verifies names, URLs and
-- licences. Nothing is guessed here.
CREATE TABLE datasets (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider            text    NOT NULL,
  name                text    NOT NULL,
  variable            text    NOT NULL
                      CHECK (variable IN ('temperature', 'precipitation', 'humidity', 'wind', 'solar')),
  unit                text    NOT NULL,
  data_type           text    NOT NULL
                      CHECK (data_type IN ('observed', 'reanalysis', 'projection')),
  spatial_resolution  text    NOT NULL,
  temporal_resolution text    NOT NULL,
  coverage_start      date,
  coverage_end        date,
  source_url          text    NOT NULL,
  licence             text    NOT NULL,
  attribution         text    NOT NULL,
  limitations         text[]  NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (coverage_end IS NULL OR coverage_start IS NULL OR coverage_end >= coverage_start),
  UNIQUE (provider, name, variable)
);

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
