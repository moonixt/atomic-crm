import { useNotify, useTranslate } from "ra-core";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { Markdown } from "../misc/Markdown";
import { AiPendingChanges } from "./AiPendingChanges";
import { AiChatError, type AiDisplayMessage } from "./types";
import { useAiConversation, useAiTurn } from "./useAiChat";

const errorMessageKey = (error: unknown) => {
  const code = error instanceof AiChatError ? error.code : undefined;
  return code ? `crm.ai.errors.${code}` : "crm.ai.errors.generic";
};

interface AiChatPanelProps {
  conversationId?: number;
}

export const AiChatPanel = ({ conversationId }: AiChatPanelProps) => {
  const translate = useTranslate();
  const notify = useNotify();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [sentText, setSentText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isPending: isLoading } =
    useAiConversation(conversationId);
  const { mutate: runTurn, isPending: isRunning } = useAiTurn();

  const messages: AiDisplayMessage[] = [
    ...(conversationId ? (conversation?.messages ?? []) : []),
    ...(sentText ? [{ role: "user" as const, content: sentText }] : []),
  ];
  const pendingChanges = conversation?.pendingChanges ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length, isRunning, pendingChanges.length]);

  const onError = (error: unknown) => {
    // Provider errors carry the provider's own message (wrong model, quota...).
    const detail =
      error instanceof AiChatError &&
      (error.code === "provider_error" || error.code === "invalid_api_key")
        ? ` (${error.message})`
        : "";
    notify(`${translate(errorMessageKey(error))}${detail}`, { type: "error" });
    const savedId = error instanceof AiChatError && error.conversationId;
    if (!conversationId && savedId) navigate(`/ai/${savedId}`);
  };

  const send = () => {
    const message = draft.trim();
    if (!message || isRunning) return;
    setSentText(message);
    setDraft("");
    runTurn(
      { type: "send", conversationId, message },
      {
        onSuccess: (result) => {
          setSentText(null);
          if (result.id !== conversationId) navigate(`/ai/${result.id}`);
        },
        onError,
        onSettled: () => setSentText(null),
      },
    );
  };

  const answer = (approved: boolean) => {
    if (!conversationId) return;
    runTurn({ type: "confirm", conversationId, approved }, { onError });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <section className="flex-1 min-w-0 flex flex-col rounded-lg border bg-card">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationId && isLoading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
            <p className="text-lg font-medium text-foreground">
              {translate("crm.ai.empty_title")}
            </p>
            <p className="text-sm max-w-md">{translate("crm.ai.empty_hint")}</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))
        )}
        {isRunning && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="small" />
            {translate("crm.ai.thinking")}
          </p>
        )}
        {!isRunning && pendingChanges.length > 0 && (
          <AiPendingChanges
            changes={pendingChanges}
            isPending={isRunning}
            onAnswer={answer}
          />
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-3 flex gap-2 items-end">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={translate("crm.ai.placeholder")}
          aria-label={translate("crm.ai.placeholder")}
          maxLength={4000}
          rows={2}
          className="resize-none"
        />
        <Button
          onClick={send}
          disabled={!draft.trim() || isRunning}
          aria-label={translate("crm.ai.send")}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

const ChatBubble = ({ message }: { message: AiDisplayMessage }) => (
  <div
    className={cn(
      "flex",
      message.role === "user" ? "justify-end" : "justify-start",
    )}
  >
    <div
      className={cn(
        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
        message.role === "user"
          ? "bg-primary text-primary-foreground whitespace-pre-wrap"
          : "bg-muted",
      )}
    >
      {message.role === "user" ? (
        message.content
      ) : (
        <Markdown>{message.content}</Markdown>
      )}
    </div>
  </div>
);
