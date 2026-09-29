import { render } from "vitest-browser-react";
import { CoreAdminContext, type DataProvider } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";
import { MemoryRouter, Route, Routes } from "react-router";

import { testI18nProvider } from "../providers/commons/i18nProvider";
import { AiChatPage } from "./AiChatPage";
import {
  AiChatError,
  type AiChatRequest,
  type AiConversation,
  type AiStatus,
} from "./types";

const configuredStatus: AiStatus = {
  configured: true,
  model: "gpt-5-mini",
  isAdmin: false,
  keyHint: null,
};

/** In-memory stand-in for the ai_chat edge function. */
const createAiBackend = (status: AiStatus | AiChatError) => {
  let conversation: AiConversation | null = null;
  const applied: string[] = [];

  const aiChat = async (request: AiChatRequest): Promise<unknown> => {
    switch (request.action) {
      case "status":
        if (status instanceof AiChatError) throw status;
        return status;
      case "list":
        return conversation
          ? [{ id: 1, title: conversation.title, updated_at: "" }]
          : [];
      case "get":
        return conversation;
      case "send": {
        const wantsChange = request.message.startsWith("Delete");
        conversation = {
          id: 1,
          title: request.message,
          messages: [
            ...(conversation?.messages ?? []),
            { role: "user", content: request.message },
            ...(wantsChange
              ? []
              : [
                  {
                    role: "assistant" as const,
                    content: "You have **3** deals.",
                  },
                ]),
          ],
          pendingChanges: wantsChange
            ? [
                {
                  id: "w1",
                  sql: "DELETE FROM tasks WHERE id = 4",
                  summary: "Delete the task “Call Bob”",
                },
              ]
            : [],
        };
        return conversation;
      }
      case "confirm": {
        if (request.approved) applied.push("w1");
        conversation = {
          ...conversation!,
          messages: [
            ...conversation!.messages,
            {
              role: "assistant",
              content: request.approved ? "Task deleted." : "Okay, I left it.",
            },
          ],
          pendingChanges: [],
        };
        return conversation;
      }
      default:
        return {};
    }
  };

  return { aiChat, applied };
};

const renderPage = (backend: ReturnType<typeof createAiBackend>) => {
  const dataProvider = {
    ...fakeDataProvider({}),
    aiChat: backend.aiChat,
  } as DataProvider;
  return render(
    <MemoryRouter initialEntries={["/ai"]}>
      <CoreAdminContext
        dataProvider={dataProvider}
        i18nProvider={testI18nProvider}
      >
        <Routes>
          <Route path={AiChatPage.path} element={<AiChatPage />} />
        </Routes>
      </CoreAdminContext>
    </MemoryRouter>,
  );
};

describe("AiChatPage", () => {
  it("sends a message and shows the assistant's answer", async () => {
    const screen = await renderPage(createAiBackend(configuredStatus));

    await screen.getByRole("textbox").fill("How many deals do I have?");
    await screen.getByRole("button", { name: "Send" }).click();

    await expect
      .element(screen.getByText("You have 3 deals.", { exact: false }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: "How many deals do I have?" }))
      .toBeInTheDocument();
  });

  it("only applies a proposed change after the user confirms it", async () => {
    const backend = createAiBackend(configuredStatus);
    const screen = await renderPage(backend);

    await screen.getByRole("textbox").fill("Delete my task about Bob");
    await screen.getByRole("button", { name: "Send" }).click();

    await expect
      .element(screen.getByText("Delete the task “Call Bob”"))
      .toBeInTheDocument();
    expect(backend.applied).toEqual([]);

    await screen.getByRole("button", { name: "Apply" }).click();

    await expect.element(screen.getByText("Task deleted.")).toBeInTheDocument();
    expect(backend.applied).toEqual(["w1"]);
  });

  it("does not apply the change when the user cancels", async () => {
    const backend = createAiBackend(configuredStatus);
    const screen = await renderPage(backend);

    await screen.getByRole("textbox").fill("Delete my task about Bob");
    await screen.getByRole("button", { name: "Send" }).click();
    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect
      .element(screen.getByText("Okay, I left it."))
      .toBeInTheDocument();
    expect(backend.applied).toEqual([]);
  });

  it("asks a non-admin user to contact an administrator when no key is set", async () => {
    const screen = await renderPage(
      createAiBackend({ ...configuredStatus, configured: false }),
    );

    await expect
      .element(screen.getByText(/Ask an administrator/))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: "Open settings" }))
      .not.toBeInTheDocument();
  });

  it("points administrators to the settings when no key is set", async () => {
    const screen = await renderPage(
      createAiBackend({
        ...configuredStatus,
        configured: false,
        isAdmin: true,
      }),
    );

    await expect
      .element(screen.getByRole("link", { name: "Open settings" }))
      .toBeInTheDocument();
  });

  it("explains that the assistant is unavailable in demo mode", async () => {
    const screen = await renderPage(
      createAiBackend(new AiChatError("unavailable", "unavailable")),
    );

    await expect
      .element(screen.getByText(/not available in demo mode/))
      .toBeInTheDocument();
  });
});
