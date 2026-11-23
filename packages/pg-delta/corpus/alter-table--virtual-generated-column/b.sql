-- PG 18 VIRTUAL generated columns: one added to an existing table, one declared
-- inline in a new table. Both must come back as VIRTUAL (attgenerated 'v'), not
-- STORED (#606).
CREATE SCHEMA test_schema;

CREATE TABLE test_schema.order_lines (
  id integer NOT NULL,
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  line_total numeric GENERATED ALWAYS AS (qty * unit_price) VIRTUAL
);

CREATE TABLE test_schema.invoices (
  id integer NOT NULL,
  net numeric NOT NULL,
  gross numeric GENERATED ALWAYS AS (net * 1.2) VIRTUAL
);
