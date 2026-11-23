-- the same column, now VIRTUAL (PG 18). PostgreSQL has no ALTER between the two
-- kinds, so the column is replaced; the table and its rows are kept (#606).
CREATE SCHEMA test_schema;

CREATE TABLE test_schema.order_lines (
  id integer NOT NULL,
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  line_total numeric GENERATED ALWAYS AS (qty * unit_price) VIRTUAL
);
