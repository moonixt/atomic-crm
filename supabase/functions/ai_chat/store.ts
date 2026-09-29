import { pool } from "../_shared/sqlTools.ts";
import type { ChatMessage } from "./agent.ts";

// Persistence for the AI assistant. The tables live in the "private" schema
// (not exposed by the REST API), so they are read here with the service
// connection and every conversation query is scoped by the caller's sales id.

export interface AiSettings {
  apiKey: string | null;
  model: string | null;
  baseUrl: string | null;
}

export interface ConversationSummary {
  id: number;
  title: string;
  updated_at: string;
}

const run = async <T>(text: string, args: unknown[] = []): Promise<T[]> => {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<T>({ text, args });
    return result.rows;
  } finally {
    client.release();
  }
};

const toNumber = (value: unknown) =>
  typeof value === "bigint" ? Number(value) : (value as number);

export const getSettings = async (): Promise<AiSettings> => {
  const [row] = await run<{
    openai_api_key: string | null;
    model: string | null;
    base_url: string | null;
  }>(
    "select openai_api_key, model, base_url from private.ai_settings where id = 1",
  );
  return {
    apiKey: row?.openai_api_key ?? null,
    model: row?.model ?? null,
    baseUrl: row?.base_url ?? null,
  };
};

export const saveSettings = async (settings: AiSettings) => {
  await run(
    `insert into private.ai_settings (id, openai_api_key, model, base_url, updated_at)
     values (1, $1, $2, $3, now())
     on conflict (id) do update
       set openai_api_key = excluded.openai_api_key,
           model = excluded.model,
           base_url = excluded.base_url,
           updated_at = now()`,
    [settings.apiKey, settings.model, settings.baseUrl],
  );
};

export const listConversations = async (
  salesId: number,
): Promise<ConversationSummary[]> => {
  const rows = await run<ConversationSummary>(
    `select id, title, updated_at from private.ai_conversations
     where sales_id = $1 order by updated_at desc limit 100`,
    [salesId],
  );
  return rows.map((row) => ({ ...row, id: toNumber(row.id) }));
};

/** Returns null when the conversation does not exist or belongs to someone else. */
export const getConversation = async (
  salesId: number,
  conversationId: number,
): Promise<{ id: number; title: string; messages: ChatMessage[] } | null> => {
  const [conversation] = await run<{ id: bigint; title: string }>(
    "select id, title from private.ai_conversations where id = $1 and sales_id = $2",
    [conversationId, salesId],
  );
  if (!conversation) return null;
  const rows = await run<{ message: ChatMessage }>(
    "select message from private.ai_messages where conversation_id = $1 order by id",
    [conversationId],
  );
  return {
    id: toNumber(conversation.id),
    title: conversation.title,
    messages: rows.map((row) => row.message),
  };
};

export const createConversation = async (
  salesId: number,
  title: string,
): Promise<number> => {
  const [row] = await run<{ id: bigint }>(
    "insert into private.ai_conversations (sales_id, title) values ($1, $2) returning id",
    [salesId, title],
  );
  return toNumber(row.id);
};

export const appendMessages = async (
  conversationId: number,
  messages: ChatMessage[],
) => {
  for (const message of messages) {
    await run(
      "insert into private.ai_messages (conversation_id, message) values ($1, $2)",
      [conversationId, JSON.stringify(message)],
    );
  }
  await run(
    "update private.ai_conversations set updated_at = now() where id = $1",
    [conversationId],
  );
};

export const deleteConversation = async (
  salesId: number,
  conversationId: number,
) => {
  await run(
    "delete from private.ai_conversations where id = $1 and sales_id = $2",
    [conversationId, salesId],
  );
};
