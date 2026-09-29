import { decodeJwt } from "npm:jose@5";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Shared SQL helpers for the MCP server and the in-app AI assistant.

const connectionString =
  Deno.env.get("SUPABASE_DB_URL") ||
  "postgresql://postgres:postgres@db:5432/postgres";
export const pool = new Pool(connectionString, 1);

// --- Database: get_schema ---

export async function getSchemaData(): Promise<string> {
  const client = await pool.connect();
  try {
    // Query 1: All columns from public schema
    const columnsResult = await client.queryObject<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      table_type: string;
    }>(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        t.table_type
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON c.table_name = t.table_name AND c.table_schema = t.table_schema
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position
    `);

    // Query 2: Foreign key relationships
    const fkResult = await client.queryObject<{
      source_table: string;
      source_column: string;
      target_table: string;
      target_column: string;
    }>(`
      SELECT
        src.relname AS source_table,
        src_att.attname AS source_column,
        tgt.relname AS target_table,
        tgt_att.attname AS target_column
      FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class src ON con.conrelid = src.oid
      JOIN pg_catalog.pg_namespace nsp ON src.relnamespace = nsp.oid
      JOIN pg_catalog.pg_class tgt ON con.confrelid = tgt.oid
      JOIN pg_catalog.pg_attribute src_att
        ON src_att.attrelid = con.conrelid AND src_att.attnum = ANY(con.conkey)
      JOIN pg_catalog.pg_attribute tgt_att
        ON tgt_att.attrelid = con.confrelid AND tgt_att.attnum = ANY(con.confkey)
      WHERE con.contype = 'f' AND nsp.nspname = 'public'
      ORDER BY src.relname
    `);

    // Group columns by table
    const tables = new Map<
      string,
      {
        type: string;
        columns: {
          name: string;
          type: string;
          nullable: boolean;
          default: string | null;
        }[];
      }
    >();
    for (const row of columnsResult.rows) {
      if (!tables.has(row.table_name)) {
        tables.set(row.table_name, {
          type: row.table_type === "VIEW" ? "View" : "Table",
          columns: [],
        });
      }
      tables.get(row.table_name)!.columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        default: row.column_default,
      });
    }

    // Group foreign keys by source table
    const foreignKeys = new Map<
      string,
      { source_column: string; target_table: string; target_column: string }[]
    >();
    for (const row of fkResult.rows) {
      if (!foreignKeys.has(row.source_table)) {
        foreignKeys.set(row.source_table, []);
      }
      foreignKeys.get(row.source_table)!.push({
        source_column: row.source_column,
        target_table: row.target_table,
        target_column: row.target_column,
      });
    }

    // Format output
    const lines: string[] = [];
    for (const [tableName, table] of tables) {
      lines.push(`${table.type}: ${tableName}`);
      for (const col of table.columns) {
        const parts = [`  - ${col.name}: ${col.type}`];
        if (col.nullable) parts.push("(nullable)");
        if (col.default) parts.push(`default: ${col.default}`);
        lines.push(parts.join(" "));
      }
      const fks = foreignKeys.get(tableName);
      if (fks && fks.length > 0) {
        lines.push("  Foreign Keys:");
        for (const fk of fks) {
          lines.push(
            `    - ${fk.source_column} -> ${fk.target_table}.${fk.target_column}`,
          );
        }
      }
      lines.push("");
    }

    return lines.join("\n");
  } finally {
    client.release();
  }
}

// --- Database: query with RLS ---

export async function executeQueryWithRLS(
  sql: string,
  userToken: string,
  validate: (sql: string) => string | null,
): Promise<
  { success: true; data: unknown[] } | { success: false; error: string }
> {
  const validationError = validate(sql);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const client = await pool.connect();
  try {
    const jwtClaims = decodeJwt(userToken);
    const claimsJson = JSON.stringify(jwtClaims);

    await client.queryObject("BEGIN");
    // set_config(..., is_local=true) is the parameterized equivalent of
    // SET LOCAL — avoids interpolating JWT claims into a SQL string.
    await client.queryObject(
      "SELECT set_config('role', 'authenticated', true)",
    );
    await client.queryObject({
      text: "SELECT set_config('request.jwt.claims', $1, true)",
      args: [claimsJson],
    });

    const result = await client.queryObject(sql);
    await client.queryObject("COMMIT");

    // Convert BigInt values to numbers (Deno Postgres returns bigint for
    // PostgreSQL int8/count results, but JSON.stringify can't handle them)
    const rows = JSON.parse(
      JSON.stringify(result.rows, (_key, value) =>
        typeof value === "bigint" ? Number(value) : value,
      ),
    );
    return { success: true, data: rows };
  } catch (error) {
    try {
      await client.queryObject("ROLLBACK");
    } catch {
      // Ignore rollback errors
    }
    const message =
      error instanceof AggregateError
        ? error.errors.map((e) => e.message).join("; ")
        : error instanceof Error
          ? error.message
          : String(error);
    return { success: false, error: message };
  } finally {
    client.release();
  }
}
