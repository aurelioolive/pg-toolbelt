-- partitioned tables without virtual generated columns
CREATE SCHEMA test_schema;

CREATE TABLE test_schema.events (
  id integer NOT NULL,
  qty integer NOT NULL,
  unit_price numeric NOT NULL
) PARTITION BY RANGE (id);
CREATE TABLE test_schema.events_p0 PARTITION OF test_schema.events FOR VALUES FROM (0) TO (100);
CREATE TABLE test_schema.events_p1 PARTITION OF test_schema.events FOR VALUES FROM (100) TO (200);

CREATE TABLE test_schema.orders (
  id integer NOT NULL,
  net numeric NOT NULL,
  gross numeric GENERATED ALWAYS AS (net * 1.2) STORED
) PARTITION BY RANGE (id);
CREATE TABLE test_schema.orders_p0 PARTITION OF test_schema.orders FOR VALUES FROM (0) TO (100);
