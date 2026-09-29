import { type ChatMessage, TOOLS } from "./agent.ts";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const DEFAULT_MODEL = "gpt-5-mini";

export class OpenAIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** One Chat Completions call with the CRM tools; returns the assistant message. */
export const callOpenAI = async (
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<ChatMessage> => {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, tools: TOOLS }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    throw new OpenAIError(response.status, message);
  }

  const reply = body?.choices?.[0]?.message;
  if (!reply) {
    throw new OpenAIError(502, "Empty response from OpenAI");
  }
  return {
    role: "assistant",
    content: reply.content ?? null,
    ...(reply.tool_calls?.length ? { tool_calls: reply.tool_calls } : {}),
  };
};
