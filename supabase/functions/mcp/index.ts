import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.28.0/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.28.0/server/webStandardStreamableHttp.js";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";
import { z } from "npm:zod@^3.25";
import { validateReadOnly, validateWrite } from "./validateSql.ts";
import { TASK_LIST_HTML, TASK_LIST_UI_URI } from "./taskListUi.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { executeQueryWithRLS, getSchemaData } from "../_shared/sqlTools.ts";

// --- Environment & Config ---

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_JWT_ISSUER =
  Deno.env.get("SB_JWT_ISSUER") ?? `${SUPABASE_URL}/auth/v1`;
const CRM_BASE_URL = (Deno.env.get("CRM_BASE_URL") ?? "").replace(/\/$/, "");

const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

// --- URL Helpers ---

function getBaseUrl(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedHost) {
    // When behind a proxy (ngrok, production), always use HTTPS.
    // x-forwarded-proto may not survive the Supabase gateway chain.
    return `https://${forwardedHost}`;
  }
  const url = new URL(req.url);
  const host = url.host;
  // Supabase edge functions see http:// internally, but are served over HTTPS publicly
  const proto =
    host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}

function getResourceMetadataUrl(req: Request): string {
  return `${getBaseUrl(req)}/functions/v1/mcp/oauth-protected-resource`;
}

// --- Auth ---

interface AuthInfo {
  token: string;
  userId: string;
  role?: string;
  clientId?: string;
}

async function validateToken(req: Request): Promise<AuthInfo | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: SUPABASE_JWT_ISSUER,
    });

    if (!payload.sub) return null;

    return {
      token,
      userId: payload.sub,
      role: payload.role as string | undefined,
      clientId: payload.client_id as string | undefined,
    };
  } catch {
    return null;
  }
}

// --- MCP Server Factory ---

function createMcpServer(authInfo: AuthInfo): McpServer {
  const server = new McpServer({
    name: "atomic-crm",
    version: "1.0.0",
  });

  server.registerTool(
    "get_schema",
    {
      title: "Get Database Schema",
      description:
        "Retrieve the database schema for the user's Atomic CRM instance including all tables, views, columns, types, and foreign key relationships. Views (like contacts_summary, companies_summary) are read-only and provide pre-joined/aggregated data. Use them for search and list queries.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const schema = await getSchemaData();
      return { content: [{ type: "text" as const, text: schema }] };
    },
  );

  server.registerTool(
    "query",
    {
      title: "Query CRM Data",
      description: `Read data from the user's CRM instance using SQL SELECT queries.

IMPORTANT: Before using this tool, you MUST call the get_schema tool first to understand what tables and columns are available in the database.

Use this tool when the user asks about their CRM data such as:
- Contacts, companies, and deals
- Sales pipeline and forecasting data
- Customer interactions and notes
- Tasks and follow-ups
- Custom fields and metadata

Row Level Security (RLS) is enforced - queries automatically return only data the authenticated user has permission to access.

Use the *_summary views (contacts_summary, companies_summary) for queries that need aggregated data or search capabilities.

To filter by the current user, if the table has a sales_id column, add a WHERE sales_id = auth.uid() clause to your query.

This tool only supports SELECT queries. For INSERT, UPDATE, or DELETE operations, use the mutate tool.

Examples:
- "SELECT id, first_name, last_name, email_fts FROM contacts_summary WHERE email_fts LIKE '%@company.com%'"
- "SELECT name, stage, amount FROM deals WHERE created_at > NOW() - INTERVAL '30 days' ORDER BY amount DESC"
- "SELECT COUNT(*) as total_tasks, type FROM tasks WHERE done_date IS NULL GROUP BY type"
- "SELECT c.first_name, c.last_name, co.name as company_name FROM contacts c JOIN companies co ON c.company_id = co.id WHERE co.sector = 'Technology'"`,
      inputSchema: z.object({
        sql: z.string().describe("The SQL SELECT query to execute"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ sql }: { sql: string }) => {
      // eslint-disable-next-line no-console
      console.log(`[MCP query] user=${authInfo.userId} sql=${sql}`);
      const result = await executeQueryWithRLS(
        sql,
        authInfo.token,
        validateReadOnly,
      );
      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      }
      return {
        content: [{ type: "text" as const, text: `Error: ${result.error}` }],
        isError: true,
      };
    },
  );

  server.registerTool(
    "mutate",
    {
      title: "Mutate CRM Data",
      description: `Create, update, or delete data in the user's CRM instance using SQL.

IMPORTANT: Before using this tool, you MUST call the get_schema tool first to understand what tables and columns are available in the database.

Use this tool for data modifications such as:
- Creating new contacts, companies, deals, tasks, or notes
- Updating existing records
- Deleting records

Row Level Security (RLS) is enforced - mutations only affect data the authenticated user has permission to modify.

IMPORTANT: Never specify sales_id in INSERT or UPDATE statements — it is automatically set to the authenticated user by a database trigger.

For read-only queries, use the query tool instead.

Examples:
- "INSERT INTO contacts (first_name, last_name, email) VALUES ('John', 'Doe', 'john@example.com')"
- "UPDATE deals SET stage = 'won-deal' WHERE id = 123"
- "DELETE FROM tasks WHERE id = 456"`,
      inputSchema: z.object({
        sql: z
          .string()
          .describe("The SQL INSERT, UPDATE, or DELETE statement to execute"),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ sql }: { sql: string }) => {
      // eslint-disable-next-line no-console
      console.log(`[MCP mutate] user=${authInfo.userId} sql=${sql}`);
      const result = await executeQueryWithRLS(
        sql,
        authInfo.token,
        validateWrite,
      );
      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      }
      return {
        content: [{ type: "text" as const, text: `Error: ${result.error}` }],
        isError: true,
      };
    },
  );

  // --- UI resource for the task-list MCP App ---

  // Inject the CRM base URL into the task-list guest HTML
  // so contact names can link back to the CRM
  const taskListHtml = TASK_LIST_HTML.replace(
    /__CRM_BASE_URL__/g,
    CRM_BASE_URL,
  );

  server.registerResource(
    "task-list-ui",
    TASK_LIST_UI_URI,
    {
      title: "Task List UI",
      description: "Interactive list of tasks with mark-as-done buttons.",
      mimeType: "text/html;profile=mcp-app",
    },
    async (uri: URL) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html;profile=mcp-app",
          text: taskListHtml,
        },
      ],
    }),
  );

  const taskSchema = z.object({
    id: z
      .number()
      .int()
      .describe("Task id — required for the mark-as-done action"),
    text: z.string().nullable().optional().describe("Task description"),
    type: z
      .string()
      .nullable()
      .optional()
      .describe("Task category/type (rendered as a pill)"),
    due_date: z.string().nullable().optional().describe("ISO date string"),
    done_date: z
      .string()
      .nullable()
      .optional()
      .describe("ISO timestamp if already done; null or omitted for pending"),
    contact_name: z
      .string()
      .nullable()
      .optional()
      .describe("Full name of the linked contact, if any"),
    contact_id: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe(
        "Id of the linked contact — used to render the contact name as a link to the CRM contact page",
      ),
  });
  type Task = z.infer<typeof taskSchema>;

  server.registerTool(
    "display_task_list",
    {
      title: "Display Task List",
      description: `Render an array of task rows as an interactive UI (MCP App) where the user can mark each task as done.

This tool is presentational: it does not query the database. Fetch the rows yourself via the query tool (joining contacts for contact_name when useful), then pass them here. Prefer this over replying with a bulleted list of tasks.

Each task should include at least: id (required, used for the mark-as-done action), text, type, due_date, done_date, and optionally contact_name + contact_id (the UI renders the name as a link to the CRM contact page when contact_id is provided).`,
      inputSchema: {
        tasks: z.array(taskSchema).describe("Array of task objects to render"),
      },
      annotations: { readOnlyHint: true },
      _meta: {
        ui: {
          resourceUri: TASK_LIST_UI_URI,
          visibility: ["model"],
        },
      },
    },
    ({ tasks }: { tasks: Task[] }) => {
      // eslint-disable-next-line no-console
      console.log(
        `[MCP display_task_list] user=${authInfo.userId} count=${tasks.length}`,
      );
      // content carries the display text (used by Claude's guest HTML);
      // structuredContent carries the typed data (used by ChatGPT's Apps SDK
      // convention). Supplying both keeps the guest host-agnostic.
      return {
        content: [{ type: "text" as const, text: JSON.stringify(tasks) }],
        structuredContent: { tasks },
      };
    },
  );

  server.registerTool(
    "complete_task",
    {
      title: "Mark Task Done",
      description:
        "Mark a single task as done by id. Used by the task-list UI when the user clicks a task's checkmark, and also callable directly by the model.",
      inputSchema: {
        id: z
          .number()
          .int()
          .positive()
          .describe("The id of the task to mark as done"),
      },
      annotations: { idempotentHint: true },
      _meta: {
        ui: {
          visibility: ["model", "app"],
        },
      },
    },
    async ({ id }: { id: number }) => {
      // RETURNING id lets us distinguish a successful update from an
      // RLS-blocked or non-existent row (executeQueryWithRLS would otherwise
      // report success on 0 rows affected).
      const sql = `UPDATE tasks SET done_date = NOW() WHERE id = ${id} RETURNING id`;
      // eslint-disable-next-line no-console
      console.log(`[MCP complete_task] user=${authInfo.userId} id=${id}`);
      const result = await executeQueryWithRLS(
        sql,
        authInfo.token,
        validateWrite,
      );
      if (!result.success) {
        return {
          content: [{ type: "text" as const, text: `Error: ${result.error}` }],
          isError: true,
        };
      }
      if (result.data.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: task ${id} not found or permission denied.`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: `Task ${id} marked as done.` },
        ],
      };
    },
  );

  return server;
}

// --- OAuth Protected Resource Metadata ---

function handleProtectedResourceMetadata(req: Request): Response {
  const baseUrl = getBaseUrl(req);
  return new Response(
    JSON.stringify({
      resource: `${baseUrl}/functions/v1/mcp`,
      authorization_servers: [`${baseUrl}/auth/v1`],
      bearer_methods_supported: ["header"],
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

// --- MCP Request Handler ---

async function handleMcpRequest(req: Request): Promise<Response> {
  // Validate auth
  const authInfo = await validateToken(req);
  if (!authInfo) {
    const metadataUrl = getResourceMetadataUrl(req);
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${metadataUrl}"`,
      },
    });
  }

  // Create stateless MCP server + transport for this request
  const server = createMcpServer(authInfo);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless
  });

  await server.connect(transport);

  // Clean up server + transport when the connection closes.
  // Do NOT close in a finally block — the SSE response body is a
  // ReadableStream that must remain open until the client consumes it.
  transport.onclose = () => {
    server.close().catch(() => {});
  };

  try {
    return await transport.handleRequest(req);
  } catch (error) {
    console.error("MCP request error:", error);
    await transport.close();
    await server.close();
    return new Response("Internal Server Error", { status: 500 });
  }
}

// --- CORS Helper ---

function withCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// --- Route Dispatcher ---

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // GET /functions/v1/mcp/oauth-protected-resource → RFC 9728 metadata
  if (path.endsWith("/oauth-protected-resource") && req.method === "GET") {
    return withCorsHeaders(handleProtectedResourceMetadata(req));
  }

  // POST/GET/DELETE /functions/v1/mcp → MCP protocol handler
  if (path.endsWith("/mcp") || path.endsWith("/mcp/")) {
    return withCorsHeaders(await handleMcpRequest(req));
  }

  return withCorsHeaders(new Response("Not Found", { status: 404 }));
});
