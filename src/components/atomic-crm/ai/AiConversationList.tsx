import { useNotify, useTranslate } from "ra-core";
import { Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAiConversations, useDeleteAiConversation } from "./useAiChat";

interface AiConversationListProps {
  selectedId?: number;
}

export const AiConversationList = ({ selectedId }: AiConversationListProps) => {
  const translate = useTranslate();
  const notify = useNotify();
  const navigate = useNavigate();
  const { data: conversations, isPending } = useAiConversations(true);
  const { mutate: deleteConversation } = useDeleteAiConversation();

  const handleDelete = (id: number) => {
    if (!window.confirm(translate("crm.ai.delete_confirm"))) return;
    deleteConversation(id, {
      onSuccess: () => {
        if (id === selectedId) navigate("/ai");
      },
      onError: () => notify("crm.ai.errors.generic", { type: "error" }),
    });
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-2">
      <Button asChild variant="outline" className="justify-start">
        <Link to="/ai">
          <Plus className="h-4 w-4" />
          {translate("crm.ai.new_conversation")}
        </Link>
      </Button>
      <nav
        aria-label={translate("crm.ai.conversations")}
        className="flex flex-col gap-1 overflow-y-auto"
      >
        {!isPending && !conversations?.length && (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            {translate("crm.ai.no_conversations")}
          </p>
        )}
        {conversations?.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "group flex items-center rounded-md hover:bg-muted",
              conversation.id === selectedId && "bg-muted",
            )}
          >
            <Link
              to={`/ai/${conversation.id}`}
              className="flex-1 min-w-0 truncate px-3 py-2 text-sm"
            >
              {conversation.title}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={translate("crm.ai.delete_conversation")}
              onClick={() => handleDelete(conversation.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </nav>
    </aside>
  );
};
