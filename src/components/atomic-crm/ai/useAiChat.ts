import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useLocaleState } from "ra-core";

import type { CrmDataProvider } from "../providers/types";
import type { AiConversation, AiConversationSummary, AiStatus } from "./types";

const statusKey = ["ai", "status"];
const listKey = ["ai", "conversations"];
const conversationKey = (id: number) => ["ai", "conversation", id];

export const useAiStatus = () => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  return useQuery({
    queryKey: statusKey,
    queryFn: () => dataProvider.aiChat<AiStatus>({ action: "status" }),
    retry: false,
  });
};

export const useAiConversations = (enabled: boolean) => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  return useQuery({
    queryKey: listKey,
    queryFn: () =>
      dataProvider.aiChat<AiConversationSummary[]>({ action: "list" }),
    enabled,
  });
};

export const useAiConversation = (id: number | undefined) => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  return useQuery({
    queryKey: conversationKey(id ?? 0),
    queryFn: () =>
      dataProvider.aiChat<AiConversation>({
        action: "get",
        conversationId: id!,
      }),
    enabled: id != null,
  });
};

/** Send a message, or answer a pending change; both return the updated conversation. */
export const useAiTurn = () => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();
  const [locale] = useLocaleState();
  return useMutation({
    mutationFn: (
      turn:
        | { type: "send"; conversationId?: number; message: string }
        | { type: "confirm"; conversationId: number; approved: boolean },
    ) =>
      dataProvider.aiChat<AiConversation>(
        turn.type === "send"
          ? {
              action: "send",
              conversationId: turn.conversationId,
              message: turn.message,
              locale,
            }
          : {
              action: "confirm",
              conversationId: turn.conversationId,
              approved: turn.approved,
              locale,
            },
      ),
    onSuccess: (conversation) => {
      queryClient.setQueryData(conversationKey(conversation.id), conversation);
    },
    onSettled: (conversation, error) => {
      queryClient.invalidateQueries({ queryKey: listKey });
      // On error the user message may still have been saved: refetch it.
      const id =
        conversation?.id ??
        (error as { conversationId?: number } | null)?.conversationId;
      if (error && id) {
        queryClient.invalidateQueries({ queryKey: conversationKey(id) });
      }
    },
  });
};

export const useDeleteAiConversation = () => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) =>
      dataProvider.aiChat({ action: "delete", conversationId }),
    onSuccess: (_, conversationId) => {
      queryClient.removeQueries({ queryKey: conversationKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });
};

export const useSaveAiSettings = () => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: {
      apiKey?: string;
      model?: string;
      clearKey?: boolean;
    }) =>
      dataProvider.aiChat<AiStatus>({ action: "save_settings", ...settings }),
    onSuccess: (status) => {
      queryClient.setQueryData(statusKey, status);
    },
  });
};
