// Tool-calling loop for the in-app AI assistant. Pure logic (no Deno or
// network imports): the model call and the SQL execution are injected, so the
// loop is unit-testable.
//
// Messages use the OpenAI Chat Completions shape and are persisted as-is.
// Read tools (get_schema, query) run immediately. The write tool (mutate)
// never runs on its own: the loop stops and the user must confirm first.

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface AgentDeps {
  callModel: (messages: ChatMessage[]) => Promise<ChatMessage>;
  getSchema: () => Promise<string>;
  runQuery: (sql: string) => Promise<string>;
  runMutation: (sql: string) => Promise<string>;
}

export interface PendingChange {
  id: string;
  sql: string;
  summary: string;
}

export const MAX_MODEL_CALLS = 10;
export const WRITE_TOOL = "mutate";

export const DECLINED_RESULT =
  "The user declined this change. It was NOT applied. Do not retry it unless the user asks again.";
export const SUPERSEDED_RESULT =
  "The user did not confirm this change and sent a new message instead. It was NOT applied.";
export const STEP_LIMIT_REACHED =
  "I had to stop before finishing because the request needed too many steps. Please try a more specific question.";

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_schema",
      description:
        "Return the CRM database schema: tables, views, columns, types and foreign keys. Call it before writing SQL. Views (contacts_summary, companies_summary) are read-only and provide pre-joined/aggregated data.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query",
      description:
        "Run a single read-only SQL SELECT on the CRM database (PostgreSQL). Row Level Security applies: only data the current user may see is returned. Always add a LIMIT (at most 100) unless aggregating.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "The SELECT statement" },
        },
        required: ["sql"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: WRITE_TOOL,
      description:
        "Propose a single INSERT, UPDATE or DELETE statement. It is NOT executed right away: the user sees the summary and must confirm it first. Never set sales_id on insert (a trigger fills it). Prefer one statement per change, use RETURNING id.",
      parameters: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description: "The INSERT/UPDATE/DELETE statement",
          },
          summary: {
            type: "string",
            description:
              "One short sentence, in the user's language, describing the change for the confirmation prompt (e.g. which records and which values).",
          },
        },
        required: ["sql", "summary"],
        additionalProperties: false,
      },
    },
  },
] as const;

const parseArguments = (call: ToolCall): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(call.function.arguments || "{}");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const lastAssistant = (messages: ChatMessage[]) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "assistant") return { message, index: i };
    if (message.role === "user") return null;
  }
  return null;
};

/** Tool calls of the latest assistant turn that have no tool result yet. */
const unansweredCalls = (messages: ChatMessage[]): ToolCall[] => {
  const last = lastAssistant(messages);
  if (!last || last.message.role !== "assistant") return [];
  const answered = new Set(
    messages
      .slice(last.index + 1)
      .filter((m) => m.role === "tool")
      .map((m) => (m as { tool_call_id: string }).tool_call_id),
  );
  return (last.message.tool_calls ?? []).filter((c) => !answered.has(c.id));
};

/** Write calls waiting for the user's confirmation. */
export const getPendingChanges = (messages: ChatMessage[]): PendingChange[] =>
  unansweredCalls(messages)
    .filter((call) => call.function.name === WRITE_TOOL)
    .map((call) => {
      const args = parseArguments(call);
      return {
        id: call.id,
        sql: typeof args?.sql === "string" ? args.sql : "",
        summary: typeof args?.summary === "string" ? args.summary : "",
      };
    });

const runReadCall = async (call: ToolCall, deps: AgentDeps) => {
  const args = parseArguments(call);
  if (!args) return "Error: invalid JSON arguments.";
  switch (call.function.name) {
    case "get_schema":
      return deps.getSchema();
    case "query":
      return typeof args.sql === "string"
        ? deps.runQuery(args.sql)
        : "Error: missing sql argument.";
    default:
      return `Error: unknown tool "${call.function.name}".`;
  }
};

const toolResult = (id: string, content: string): ChatMessage => ({
  role: "tool",
  tool_call_id: id,
  content,
});

/**
 * Continue the conversation until the model answers in plain text, proposes a
 * change that needs confirmation, or the step limit is reached.
 * Returns only the messages added by this run.
 */
export const runAgent = async (
  systemPrompt: string,
  history: ChatMessage[],
  deps: AgentDeps,
): Promise<ChatMessage[]> => {
  const added: ChatMessage[] = [];
  const all = () => [...history, ...added];

  for (let calls = 0; ; ) {
    const pending = unansweredCalls(all());
    const reads = pending.filter((c) => c.function.name !== WRITE_TOOL);
    for (const call of reads) {
      added.push(toolResult(call.id, await runReadCall(call, deps)));
    }
    if (pending.some((c) => c.function.name === WRITE_TOOL)) return added;

    const last = all().at(-1);
    if (last?.role === "assistant" && !last.tool_calls?.length) return added;

    if (calls >= MAX_MODEL_CALLS) {
      added.push({ role: "assistant", content: STEP_LIMIT_REACHED });
      return added;
    }
    calls++;
    added.push(
      await deps.callModel([
        { role: "system", content: systemPrompt },
        ...all(),
      ]),
    );
  }
};

/** Apply (or decline) every change waiting for confirmation. */
export const resolvePendingChanges = async (
  history: ChatMessage[],
  approved: boolean,
  deps: AgentDeps,
): Promise<ChatMessage[]> => {
  const added: ChatMessage[] = [];
  for (const change of getPendingChanges(history)) {
    const content = !approved
      ? DECLINED_RESULT
      : change.sql
        ? await deps.runMutation(change.sql)
        : "Error: missing sql argument.";
    added.push(toolResult(change.id, content));
  }
  return added;
};

/** Close changes left unconfirmed when the user sends a new message. */
export const supersedePendingChanges = (
  history: ChatMessage[],
): ChatMessage[] =>
  getPendingChanges(history).map((change) =>
    toolResult(change.id, SUPERSEDED_RESULT),
  );

export interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

/** The part of the transcript shown in the UI (tool traffic is hidden). */
export const toDisplayMessages = (messages: ChatMessage[]): DisplayMessage[] =>
  messages.flatMap((m): DisplayMessage[] => {
    if (m.role === "user") return [{ role: "user", content: m.content }];
    if (m.role === "assistant" && m.content?.trim()) {
      return [{ role: "assistant", content: m.content }];
    }
    return [];
  });
