import { type ChatMessage, TOOLS } from "./agent.ts";

// Any OpenAI-compatible Chat Completions API: OpenAI, Azure OpenAI (v1 API),
// OpenCode Zen, OpenRouter, a local server...
export const DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_MODEL = "gpt-5-mini";

const AZURE_HOST = /\.(openai|cognitiveservices)\.azure\.com$/i;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export class OpenAIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Returns an error message, or null when the base URL is acceptable. */
export const validateBaseUrl = (value: string): string | null => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Invalid URL";
  }
  const isLocal = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    return "The base URL must use https";
  }
  return null;
};

/**
 * Chat Completions endpoint for a base URL. A bare Azure resource URL
 * (https://<name>.openai.azure.com) is mapped to its OpenAI-compatible v1 API.
 */
export const resolveChatCompletionsUrl = (baseUrl?: string | null) => {
  const url = new URL(baseUrl || DEFAULT_BASE_URL);
  let path = url.pathname.replace(/\/+$/, "");
  if (AZURE_HOST.test(url.hostname) && path === "") path = "/openai/v1";
  if (!path.endsWith("/chat/completions")) path += "/chat/completions";
  return `${url.origin}${path}${url.search}`;
};

export const buildAuthHeaders = (
  baseUrl: string | null | undefined,
  apiKey: string,
): Record<string, string> => {
  const host = new URL(baseUrl || DEFAULT_BASE_URL).hostname;
  // Azure accepts its own "api-key" header; everyone else uses Bearer.
  return AZURE_HOST.test(host)
    ? { "api-key": apiKey }
    : { Authorization: `Bearer ${apiKey}` };
};

/** One Chat Completions call with the CRM tools; returns the assistant message. */
export const callOpenAI = async (
  config: { apiKey: string; model: string; baseUrl?: string | null },
  messages: ChatMessage[],
): Promise<ChatMessage> => {
  const response = await fetch(resolveChatCompletionsUrl(config.baseUrl), {
    method: "POST",
    headers: {
      ...buildAuthHeaders(config.baseUrl, config.apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: config.model, messages, tools: TOOLS }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    throw new OpenAIError(response.status, message);
  }

  const reply = body?.choices?.[0]?.message;
  if (!reply) {
    throw new OpenAIError(502, "Empty response from the AI provider");
  }
  return {
    role: "assistant",
    content: reply.content ?? null,
    ...(reply.tool_calls?.length ? { tool_calls: reply.tool_calls } : {}),
  };
};
