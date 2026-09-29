import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { AuthMiddleware, UserMiddleware } from "../_shared/authentication.ts";
import { getUserSale } from "../_shared/getUserSale.ts";
import { executeQueryWithRLS, getSchemaData } from "../_shared/sqlTools.ts";
import { validateReadOnly, validateWrite } from "../mcp/validateSql.ts";
import {
  type AgentDeps,
  type ChatMessage,
  getPendingChanges,
  resolvePendingChanges,
  runAgent,
  supersedePendingChanges,
  toDisplayMessages,
} from "./agent.ts";
import { callOpenAI, DEFAULT_MODEL, OpenAIError } from "./openai.ts";
import * as store from "./store.ts";

// Tool results are sent back to the model: cap them to keep requests small.
const MAX_TOOL_RESULT_LENGTH = 20_000;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_API_KEY_LENGTH = 500;
const MAX_MODEL_NAME_LENGTH = 100;
const TITLE_LENGTH = 60;

interface Sale {
  id: number;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
}

const json = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const truncate = (text: string) =>
  text.length > MAX_TOOL_RESULT_LENGTH
    ? `${text.slice(0, MAX_TOOL_RESULT_LENGTH)}\n[truncated: add a LIMIT or select fewer columns]`
    : text;

const getToken = (req: Request) =>
  (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");

const buildSystemPrompt = (sale: Sale, locale: string) =>
  `You are the assistant built into Atomic CRM, a CRM for small teams.
You help ${sale.first_name} ${sale.last_name} (sales id ${sale.id}) find and update CRM data.
Today is ${new Date().toISOString().slice(0, 10)}. The user's interface language is "${locale}": always reply in the user's language.

How to work:
- Call get_schema once before writing SQL, then use query to read data.
- Records "owned" by the user have sales_id = ${sale.id}.
- Deal stages, company sectors, categories, note statuses and task types are stored as slugs; their display labels are in public.configuration (config jsonb).
- To change data, call mutate with one statement and a short summary. The change is only applied after the user confirms it, so never claim it is done before you get the tool result.
- Never touch the sales table or authentication data.
- Keep answers short. Use plain text with simple lists; do not dump raw SQL results or ids unless asked.`;

const handleStatus = async (sale: Sale) => {
  const settings = await store.getSettings();
  return json({
    configured: !!settings.apiKey,
    model: settings.model || DEFAULT_MODEL,
    isAdmin: sale.administrator,
    keyHint:
      sale.administrator && settings.apiKey
        ? `…${settings.apiKey.slice(-4)}`
        : null,
  });
};

const handleSaveSettings = async (
  sale: Sale,
  body: Record<string, unknown>,
) => {
  if (!sale.administrator) {
    return createErrorResponse(
      403,
      "Only administrators can change AI settings",
    );
  }
  const current = await store.getSettings();
  const apiKey =
    body.clearKey === true
      ? null
      : typeof body.apiKey === "string" && body.apiKey.trim()
        ? body.apiKey.trim()
        : current.apiKey;
  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : null;
  if (
    (apiKey && apiKey.length > MAX_API_KEY_LENGTH) ||
    (model && model.length > MAX_MODEL_NAME_LENGTH)
  ) {
    return createErrorResponse(400, "Value too long");
  }
  await store.saveSettings({ apiKey, model });
  return handleStatus(sale);
};

const conversationPayload = (
  id: number,
  title: string,
  messages: ChatMessage[],
) => ({
  id,
  title,
  messages: toDisplayMessages(messages),
  pendingChanges: getPendingChanges(messages),
});

const handleConversationTurn = async (
  req: Request,
  sale: Sale,
  body: Record<string, unknown>,
) => {
  const settings = await store.getSettings();
  if (!settings.apiKey) {
    return createErrorResponse(412, "AI assistant is not configured", {
      code: "not_configured",
    });
  }

  const token = getToken(req);
  const deps: AgentDeps = {
    callModel: (messages) =>
      callOpenAI(settings.apiKey!, settings.model || DEFAULT_MODEL, messages),
    getSchema: getSchemaData,
    runQuery: async (sql) => {
      const result = await executeQueryWithRLS(sql, token, validateReadOnly);
      return result.success
        ? truncate(JSON.stringify(result.data))
        : `Error: ${result.error}`;
    },
    runMutation: async (sql) => {
      // eslint-disable-next-line no-console
      console.log(`[ai_chat mutate] sales_id=${sale.id} sql=${sql}`);
      const result = await executeQueryWithRLS(sql, token, validateWrite);
      return result.success
        ? truncate(`Applied. Returned rows: ${JSON.stringify(result.data)}`)
        : `Error: ${result.error}`;
    },
  };

  let conversation: { id: number; title: string; messages: ChatMessage[] };
  const added: ChatMessage[] = [];

  if (body.action === "send") {
    const text = typeof body.message === "string" ? body.message.trim() : "";
    if (!text || text.length > MAX_MESSAGE_LENGTH) {
      return createErrorResponse(400, "Invalid message");
    }
    if (body.conversationId) {
      const existing = await store.getConversation(
        sale.id,
        Number(body.conversationId),
      );
      if (!existing) return createErrorResponse(404, "Conversation not found");
      conversation = existing;
    } else {
      const title = text.slice(0, TITLE_LENGTH);
      conversation = {
        id: await store.createConversation(sale.id, title),
        title,
        messages: [],
      };
    }
    added.push(...supersedePendingChanges(conversation.messages));
    added.push({ role: "user", content: text });
  } else {
    const existing = await store.getConversation(
      sale.id,
      Number(body.conversationId),
    );
    if (!existing) return createErrorResponse(404, "Conversation not found");
    conversation = existing;
    added.push(
      ...(await resolvePendingChanges(
        conversation.messages,
        body.approved === true,
        deps,
      )),
    );
  }

  // Persist the user's input first so it is kept even if the model call fails.
  await store.appendMessages(conversation.id, added);
  let history = [...conversation.messages, ...added];

  try {
    // Interpolated into the system prompt: accept only a locale code.
    const locale =
      typeof body.locale === "string" && /^[A-Za-z-]{2,10}$/.test(body.locale)
        ? body.locale
        : "en";
    const reply = await runAgent(
      buildSystemPrompt(sale, locale),
      history,
      deps,
    );
    await store.appendMessages(conversation.id, reply);
    history = [...history, ...reply];
  } catch (error) {
    console.error("ai_chat agent error:", error);
    const status = error instanceof OpenAIError ? error.status : 500;
    return createErrorResponse(
      status === 401 ? 424 : 502,
      error instanceof Error ? error.message : "AI request failed",
      {
        code: status === 401 ? "invalid_api_key" : "provider_error",
        conversationId: conversation.id,
      },
    );
  }

  return json(
    conversationPayload(conversation.id, conversation.title, history),
  );
};

const handle = async (req: Request, sale: Sale) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  switch (body.action) {
    case "status":
      return handleStatus(sale);
    case "save_settings":
      return handleSaveSettings(sale, body);
    case "list":
      return json(await store.listConversations(sale.id));
    case "get": {
      const conversation = await store.getConversation(
        sale.id,
        Number(body.conversationId),
      );
      if (!conversation)
        return createErrorResponse(404, "Conversation not found");
      return json(
        conversationPayload(
          conversation.id,
          conversation.title,
          conversation.messages,
        ),
      );
    }
    case "delete":
      await store.deleteConversation(sale.id, Number(body.conversationId));
      return json({ ok: true });
    case "send":
    case "confirm":
      return handleConversationTurn(req, sale, body);
    default:
      return createErrorResponse(400, "Unknown action");
  }
};

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) =>
    AuthMiddleware(req, async (req) =>
      UserMiddleware(req, async (req, user) => {
        if (req.method !== "POST") {
          return createErrorResponse(405, "Method Not Allowed");
        }
        const sale = user ? ((await getUserSale(user)) as Sale | null) : null;
        if (!sale || sale.disabled) {
          return createErrorResponse(403, "Forbidden");
        }
        try {
          return await handle(req, sale);
        } catch (error) {
          console.error("ai_chat error:", error);
          return createErrorResponse(500, "Internal error");
        }
      }),
    ),
  ),
);
