import { parse, type Statement } from "npm:pgsql-ast-parser@^12";

const ALLOWED_READ_TYPES = new Set(["select", "with"]);
const ALLOWED_WRITE_TYPES = new Set(["insert", "update", "delete", "with"]);

// Queries run on a superuser connection downgraded to the "authenticated" role
// for the transaction. set_config('role', ...) would switch it back (bypassing
// RLS), and the *_to_xml / dblink functions run a SQL string this validator
// never sees. None of them is needed to read or edit CRM data.
const FORBIDDEN_FUNCTIONS = new Set([
  "set_config",
  "query_to_xml",
  "query_to_xmlschema",
  "query_to_xml_and_xmlschema",
  "cursor_to_xml",
  "cursor_to_xmlschema",
  "dblink",
  "dblink_exec",
  "dblink_open",
  "dblink_send_query",
]);

// Walk the whole AST (select lists, FROM, subqueries, CTEs, WHERE...) and
// return the first forbidden function call found.
function findForbiddenCall(node: unknown): string | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findForbiddenCall(child);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;
  if (record.type === "call") {
    const fn = record.function as { name?: unknown } | undefined;
    const name = typeof fn?.name === "string" ? fn.name.toLowerCase() : "";
    if (FORBIDDEN_FUNCTIONS.has(name)) return name;
  }
  for (const value of Object.values(record)) {
    const found = findForbiddenCall(value);
    if (found) return found;
  }
  return null;
}

function forbiddenCallError(stmts: Statement[]): string | null {
  const name = findForbiddenCall(stmts);
  return name ? `Function "${name}" is not allowed.` : null;
}

// Collect all statement types found in a parsed AST, including inner
// statements in WITH (CTE) bindings which can contain writable DML.
function collectStatementTypes(stmts: Statement[]): Set<string> {
  const types = new Set<string>();
  for (const stmt of stmts) {
    types.add(stmt.type);
    if (stmt.type === "with" && "bind" in stmt && Array.isArray(stmt.bind)) {
      for (const cte of stmt.bind) {
        if (cte.statement?.type) {
          types.add(cte.statement.type);
        }
      }
    }
  }
  return types;
}

export function validateReadOnly(sql: string): string | null {
  let stmts: Statement[];
  try {
    stmts = parse(sql);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // pgsql-ast-parser appends a parse-table dump that is useless to the
    // LLM and consumes many tokens; keep the diagnostic prefix only.
    const message = raw.split("Here is the state of my parse table")[0].trim();
    return `Failed to parse SQL: ${message}`;
  }
  if (stmts.length === 0) {
    return "Empty query.";
  }
  if (stmts.length > 1) {
    return "Only a single statement is allowed.";
  }
  const types = collectStatementTypes(stmts);
  for (const type of types) {
    if (!ALLOWED_READ_TYPES.has(type)) {
      return `Statement type "${type}" is not allowed in read-only queries. Use the mutate tool for data modifications.`;
    }
  }
  return forbiddenCallError(stmts);
}

export function validateWrite(sql: string): string | null {
  let stmts: Statement[];
  try {
    stmts = parse(sql);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // pgsql-ast-parser appends a parse-table dump that is useless to the
    // LLM and consumes many tokens; keep the diagnostic prefix only.
    const message = raw.split("Here is the state of my parse table")[0].trim();
    return `Failed to parse SQL: ${message}`;
  }
  if (stmts.length === 0) {
    return "Empty query.";
  }
  if (stmts.length > 1) {
    return "Only a single statement is allowed.";
  }
  const types = collectStatementTypes(stmts);
  for (const type of types) {
    if (!ALLOWED_WRITE_TYPES.has(type)) {
      return `Statement type "${type}" is not allowed. Only INSERT, UPDATE, and DELETE statements are supported.`;
    }
  }
  return forbiddenCallError(stmts);
}
