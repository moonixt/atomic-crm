// Shapes exchanged with the `ai_chat` edge function.

export interface AiStatus {
  configured: boolean;
  model: string;
  isAdmin: boolean;
  /** Last characters of the stored key, only sent to administrators. */
  keyHint: string | null;
}

export interface AiConversationSummary {
  id: number;
  title: string;
  updated_at: string;
}

export interface AiDisplayMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiPendingChange {
  id: string;
  sql: string;
  summary: string;
}

export interface AiConversation {
  id: number;
  title: string;
  messages: AiDisplayMessage[];
  pendingChanges: AiPendingChange[];
}

export type AiChatRequest =
  | { action: "status" }
  | {
      action: "save_settings";
      apiKey?: string;
      model?: string;
      clearKey?: boolean;
    }
  | { action: "list" }
  | { action: "get"; conversationId: number }
  | { action: "delete"; conversationId: number }
  | {
      action: "send";
      conversationId?: number;
      message: string;
      locale: string;
    }
  | {
      action: "confirm";
      conversationId: number;
      approved: boolean;
      locale: string;
    };

export type AiErrorCode =
  | "not_configured"
  | "invalid_api_key"
  | "provider_error"
  | "unavailable";

export class AiChatError extends Error {
  constructor(
    message: string,
    public code?: AiErrorCode,
    public conversationId?: number,
  ) {
    super(message);
  }
}
