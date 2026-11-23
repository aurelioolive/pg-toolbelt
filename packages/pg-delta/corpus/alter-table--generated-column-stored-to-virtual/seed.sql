-- OMIT line_total: GENERATED ALWAYS rejects explicit inserts. Its value is the
-- same whichever kind computes it, so the data proof holds across the replace.
INSERT INTO test_schema.order_lines (id, qty, unit_price) VALUES (1, 3, 2.50);
