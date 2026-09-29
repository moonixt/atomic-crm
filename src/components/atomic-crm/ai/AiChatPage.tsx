import { useTranslate } from "ra-core";
import { Bot } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { AiChatPanel } from "./AiChatPanel";
import { AiConversationList } from "./AiConversationList";
import { AiChatError } from "./types";
import { useAiStatus } from "./useAiChat";

export const AiChatPage = () => {
  const translate = useTranslate();
  const params = useParams<{ conversationId?: string }>();
  const conversationId = params.conversationId
    ? Number(params.conversationId)
    : undefined;
  const { data: status, error, isPending } = useAiStatus();

  if (isPending) {
    return (
      <div className="mt-8">
        <Spinner />
      </div>
    );
  }

  const unavailable =
    error instanceof AiChatError && error.code === "unavailable";
  if (error || !status?.configured) {
    return (
      <div className="mt-16 mx-auto max-w-md text-center space-y-3">
        <Bot className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">{translate("crm.ai.title")}</h1>
        <p className="text-muted-foreground">
          {translate(
            unavailable
              ? "crm.ai.errors.unavailable"
              : error
                ? "crm.ai.errors.generic"
                : status?.isAdmin
                  ? "crm.ai.errors.not_configured_admin"
                  : "crm.ai.errors.not_configured",
          )}
        </p>
        {status?.isAdmin && (
          <Button asChild>
            <Link to="/settings#ai">{translate("crm.ai.go_to_settings")}</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 flex gap-4 h-[calc(100vh-8rem)]">
      <h1 className="sr-only">{translate("crm.ai.title")}</h1>
      <AiConversationList selectedId={conversationId} />
      <AiChatPanel conversationId={conversationId} />
    </div>
  );
};

AiChatPage.path = "/ai/:conversationId?";
