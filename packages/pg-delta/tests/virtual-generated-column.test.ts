/**
 * PG 18 adds VIRTUAL generated columns (`pg_attribute.attgenerated = 'v'`)
 * next to STORED ones (`'s'`). The kind is part of the column's state: a
 * virtual column is computed on read and adding one does not rewrite the
 * table, while a stored column is written to disk.
 *
 * The kind must survive extract → plan → apply, and a stored and a virtual
 * column must not extract as the same fact; otherwise a plan silently turns a
 * virtual column into a stored one and the next plan, the diff and the proof
 * loop all report no change, because both sides hash the same (#606).
 * Docker required; VIRTUAL only exists on PG 18+.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { apply } from "../src/apply/apply.ts";
import { extract } from "../src/extract/extract.ts";
import { plan } from "../src/plan/plan.ts";
import { createTestDb, type TestDb } from "./containers.ts";

let empty: TestDb;
let stored: TestDb;
let virtual: TestDb;
let pgMajor: number;

const tableSql = (kind: "STORED" | "VIRTUAL") => `
  CREATE SCHEMA app;
  CREATE TABLE app.t (a integer, v integer GENERATED ALWAYS AS (a * 2) ${kind});
`;

beforeAll(async () => {
  empty = await createTestDb("virtual_gen_empty");
  stored = await createTestDb("virtual_gen_stored");
  virtual = await createTestDb("virtual_gen_virtual");
  pgMajor = await virtual.cluster.pgMajor();
  if (pgMajor < 18) return;
  await stored.pool.query(tableSql("STORED"));
  await virtual.pool.query(tableSql("VIRTUAL"));
}, 120_000);

afterAll(async () => {
  await Promise.all([empty.drop(), stored.drop(), virtual.drop()]);
});

const generatedKind = async (db: TestDb): Promise<string | undefined> => {
  const { rows } = await db.pool.query<{ attgenerated: string }>(
    `SELECT attgenerated FROM pg_attribute
     WHERE attrelid = 'app.t'::regclass AND attname = 'v'`,
  );
  return rows[0]?.attgenerated;
};

describe("PG 18 VIRTUAL generated columns", () => {
  test("a stored and a virtual column do not extract as the same state", async () => {
    if (pgMajor < 18) return;
    const source = await extract(stored.pool);
    const desired = await extract(virtual.pool);
    const thePlan = plan(source.factBase, desired.factBase);
    expect(thePlan.actions.length).toBeGreaterThan(0);
  }, 60_000);

  test("a plan from an empty database creates the column as VIRTUAL", async () => {
    if (pgMajor < 18) return;
    const source = await extract(empty.pool);
    const desired = await extract(virtual.pool);
    const thePlan = plan(source.factBase, desired.factBase);
    const sql = thePlan.actions.map((action) => action.sql).join("\n");
    expect(sql).toContain("VIRTUAL");

    const result = await apply(thePlan, empty.pool);
    expect(result.status).toBe("applied");
    expect(await generatedKind(empty)).toBe("v");
  }, 60_000);
});
