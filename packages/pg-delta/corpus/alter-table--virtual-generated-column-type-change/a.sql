-- a VIRTUAL generated column of type integer
CREATE SCHEMA test_schema;

CREATE TABLE test_schema.order_lines (
  id integer NOT NULL,
  qty integer NOT NULL,
  line_qty integer GENERATED ALWAYS AS (qty * 2) VIRTUAL
);
