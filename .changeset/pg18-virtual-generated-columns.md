---
"@supabase/pg-delta": patch
---

Fix PostgreSQL 18 `VIRTUAL` generated columns being created as `STORED` (#606). The column kind is now part of the extracted column, so a plan creates a virtual column as `VIRTUAL`, adding one no longer declares a table rewrite, and a change between `STORED` and `VIRTUAL` replaces the column, since PostgreSQL has no `ALTER` between the two. Before, both kinds extracted the same, so the next plan and the proof reported no change. Stored and plain columns extract exactly as before, so existing snapshots and baselines keep their hashes.
