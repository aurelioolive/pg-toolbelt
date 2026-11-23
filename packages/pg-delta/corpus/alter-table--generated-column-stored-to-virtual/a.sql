-- a STORED generated column
CREATE SCHEMA test_schema;

CREATE TABLE test_schema.order_lines (
  id integer NOT NULL,
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  line_total numeric GENERATED ALWAYS AS (qty * unit_price) STORED
);
