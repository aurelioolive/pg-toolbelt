-- the same VIRTUAL column retyped to bigint (PG 18). A virtual column stores
-- nothing, so the TYPE change is in place and does not rewrite the table; the
-- proof's rewrite check fails if the plan claims otherwise wrongly (#606).
CREATE SCHEMA test_schema;

CREATE TABLE test_schema.order_lines (
  id integer NOT NULL,
  qty integer NOT NULL,
  line_qty bigint GENERATED ALWAYS AS (qty * 2) VIRTUAL
);
