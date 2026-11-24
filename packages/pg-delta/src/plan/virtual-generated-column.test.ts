/**
 * PG 18 VIRTUAL generated columns at the rule level (no DB): the column rule
 * renders the kind it was extracted with, adding a virtual column declares no
 * rewrite (it stores nothing), and a stored ↔ virtual change replaces the
 * column, since PostgreSQL has no ALTER between the two kinds (#606). A type
 * change of a virtual column stores nothing either, so it declares no rewrite.
 */
import { describe, expect, test } from "bun:test";
import { buildFactBase, type Fact } from "../core/fact.ts";
import type { StableId } from "../core/stable-id.ts";
import { plan } from "./plan.ts";

const schemaFact: Fact = {
  id: { kind: "schema", name: "s" },
  payload: { owner: "test" },
};
const tableId: StableId = { kind: "table", schema: "s", name: "t" };
const tableFact: Fact = {
  id: tableId,
  parent: { kind: "schema", name: "s" },
  payload: {
    persistence: "p",
    rowSecurity: false,
    forceRowSecurity: false,
    replicaIdentity: "d",
    replicaIdentityIndex: null,
    partitionKey: null,
    partitionBound: null,
    parentTable: null,
    reloptions: null,
  },
};
const plainColumn: Fact = {
  id: { kind: "column", schema: "s", table: "t", name: "a" },
  parent: tableId,
  payload: {
    _position: 1,
    type: "integer",
    notNull: false,
    identity: null,
    collation: null,
    generatedExpr: null,
  },
};
const generatedColumn = (
  kind: "stored" | "virtual",
  type = "integer",
): Fact => ({
  id: { kind: "column", schema: "s", table: "t", name: "v" },
  parent: tableId,
  payload: {
    _position: 2,
    type,
    notNull: false,
    identity: null,
    collation: null,
    generatedExpr: "(a * 2)",
    ...(kind === "virtual" ? { virtual: true } : {}),
  },
});
const base = (...columns: Fact[]) =>
  buildFactBase([schemaFact, tableFact, ...columns], []);

describe("PG 18 VIRTUAL generated columns", () => {
  test("a from-empty CREATE TABLE renders the virtual column as VIRTUAL", () => {
    const sql = plan(
      buildFactBase([], []),
      base(plainColumn, generatedColumn("virtual")),
    )
      .actions.map((a) => a.sql)
      .find((s) => s.startsWith(`CREATE TABLE "s"."t"`));
    expect(sql).toMatchInlineSnapshot(
      `"CREATE TABLE "s"."t" ("a" integer, "v" integer GENERATED ALWAYS AS ((a * 2)) VIRTUAL)"`,
    );
  });

  test("adding a virtual column declares no rewrite; adding a stored one does", () => {
    const addVirtual = plan(
      base(plainColumn),
      base(plainColumn, generatedColumn("virtual")),
    );
    expect(addVirtual.actions.map((a) => [a.sql, a.rewriteRisk])).toEqual([
      [
        `ALTER TABLE "s"."t" ADD COLUMN "v" integer GENERATED ALWAYS AS ((a * 2)) VIRTUAL`,
        false,
      ],
    ]);

    const addStored = plan(
      base(plainColumn),
      base(plainColumn, generatedColumn("stored")),
    );
    expect(addStored.actions.map((a) => [a.sql, a.rewriteRisk])).toEqual([
      [
        `ALTER TABLE "s"."t" ADD COLUMN "v" integer GENERATED ALWAYS AS ((a * 2)) STORED`,
        true,
      ],
    ]);
  });

  test("a stored to virtual change replaces the column", () => {
    const sql = plan(
      base(plainColumn, generatedColumn("stored")),
      base(plainColumn, generatedColumn("virtual")),
    ).actions.map((a) => a.sql);
    expect(sql).toEqual([
      `ALTER TABLE "s"."t" DROP COLUMN "v"`,
      `ALTER TABLE "s"."t" ADD COLUMN "v" integer GENERATED ALWAYS AS ((a * 2)) VIRTUAL`,
    ]);
  });

  test("a virtual to stored change replaces the column", () => {
    const sql = plan(
      base(plainColumn, generatedColumn("virtual")),
      base(plainColumn, generatedColumn("stored")),
    ).actions.map((a) => a.sql);
    expect(sql).toEqual([
      `ALTER TABLE "s"."t" DROP COLUMN "v"`,
      `ALTER TABLE "s"."t" ADD COLUMN "v" integer GENERATED ALWAYS AS ((a * 2)) STORED`,
    ]);
  });

  test("a type change declares no rewrite for a virtual column; it does for a stored one", () => {
    const retypeVirtual = plan(
      base(plainColumn, generatedColumn("virtual")),
      base(plainColumn, generatedColumn("virtual", "bigint")),
    );
    expect(retypeVirtual.actions.map((a) => [a.sql, a.rewriteRisk])).toEqual([
      [`ALTER TABLE "s"."t" ALTER COLUMN "v" TYPE bigint`, false],
    ]);

    const retypeStored = plan(
      base(plainColumn, generatedColumn("stored")),
      base(plainColumn, generatedColumn("stored", "bigint")),
    );
    expect(retypeStored.actions.map((a) => [a.sql, a.rewriteRisk])).toEqual([
      [`ALTER TABLE "s"."t" ALTER COLUMN "v" TYPE bigint`, true],
    ]);
  });
});
