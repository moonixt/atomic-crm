// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type AgentDeps,
  type ChatMessage,
  DECLINED_RESULT,
  getPendingChanges,
  MAX_MODEL_CALLS,
  resolvePendingChanges,
  runAgent,
  STEP_LIMIT_REACHED,
  SUPERSEDED_RESULT,
  supersedePendingChanges,
  toDisplayMessages,
} from "./agent";

const toolCall = (id: string, name: string, args: Record<string, unknown>) => ({
  id,
  type: "function" as const,
  function: { name, arguments: JSON.stringify(args) },
});

const assistantCalling = (
  ...calls: ReturnType<typeof toolCall>[]
): ChatMessage => ({ role: "assistant", content: null, tool_calls: calls });

const assistantSaying = (content: string): ChatMessage => ({
  role: "assistant",
  content,
});

let deps: AgentDeps & {
  callModel: ReturnType<typeof vi.fn>;
  runMutation: ReturnType<typeof vi.fn>;
};

const modelReplies = (...replies: ChatMessage[]) => {
  replies.forEach((reply) => deps.callModel.mockResolvedValueOnce(reply));
};

beforeEach(() => {
  deps = {
    callModel: vi.fn(),
    getSchema: vi.fn().mockResolvedValue("Table: deals"),
    runQuery: vi.fn().mockResolvedValue('[{"count":3}]'),
    runMutation: vi.fn().mockResolvedValue("Applied."),
  };
});

describe("runAgent", () => {
  it("runs read tools and returns the model's final answer", async () => {
    // Arrange
    modelReplies(
      assistantCalling(
        toolCall("c1", "query", { sql: "SELECT count(*) FROM deals" }),
      ),
      assistantSaying("You have 3 deals."),
    );

    // Act
    const added = await runAgent(
      "system",
      [{ role: "user", content: "How many deals?" }],
      deps,
    );

    // Assert
    expect(added.at(-1)).toEqual(assistantSaying("You have 3 deals."));
    expect(added).toContainEqual({
      role: "tool",
      tool_call_id: "c1",
      content: '[{"count":3}]',
    });
  });

  it("stops before executing a write and exposes it as a pending change", async () => {
    modelReplies(
      assistantCalling(
        toolCall("w1", "mutate", {
          sql: "DELETE FROM tasks WHERE id = 4",
          summary: "Delete task 4",
        }),
      ),
    );

    const history: ChatMessage[] = [{ role: "user", content: "Delete task 4" }];
    const added = await runAgent("system", history, deps);

    expect(deps.runMutation).not.toHaveBeenCalled();
    expect(getPendingChanges([...history, ...added])).toEqual([
      {
        id: "w1",
        sql: "DELETE FROM tasks WHERE id = 4",
        summary: "Delete task 4",
      },
    ]);
  });

  it("answers read calls issued alongside a write before waiting for confirmation", async () => {
    modelReplies(
      assistantCalling(
        toolCall("r1", "get_schema", {}),
        toolCall("w1", "mutate", {
          sql: "UPDATE deals SET stage = 'won'",
          summary: "Win",
        }),
      ),
    );

    const added = await runAgent(
      "system",
      [{ role: "user", content: "win it" }],
      deps,
    );

    expect(added).toContainEqual({
      role: "tool",
      tool_call_id: "r1",
      content: "Table: deals",
    });
    expect(
      added.some((m) => m.role === "tool" && m.tool_call_id === "w1"),
    ).toBe(false);
  });

  it("returns an error result for malformed tool arguments instead of throwing", async () => {
    modelReplies(
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "c1",
            type: "function",
            function: { name: "query", arguments: "{oops" },
          },
        ],
      },
      assistantSaying("Sorry."),
    );

    const added = await runAgent(
      "system",
      [{ role: "user", content: "hi" }],
      deps,
    );

    expect(added).toContainEqual({
      role: "tool",
      tool_call_id: "c1",
      content: "Error: invalid JSON arguments.",
    });
  });

  it("gives up with a message when the model keeps calling tools", async () => {
    deps.callModel.mockResolvedValue(
      assistantCalling(toolCall("loop", "get_schema", {})),
    );

    const added = await runAgent(
      "system",
      [{ role: "user", content: "hi" }],
      deps,
    );

    expect(deps.callModel).toHaveBeenCalledTimes(MAX_MODEL_CALLS);
    expect(added.at(-1)).toEqual(assistantSaying(STEP_LIMIT_REACHED));
  });

  it("sends the system prompt first on every model call", async () => {
    modelReplies(assistantSaying("Hello"));

    await runAgent("be helpful", [{ role: "user", content: "hi" }], deps);

    expect(deps.callModel.mock.calls[0][0][0]).toEqual({
      role: "system",
      content: "be helpful",
    });
  });
});

describe("pending changes", () => {
  const history: ChatMessage[] = [
    { role: "user", content: "Delete task 4" },
    assistantCalling(
      toolCall("w1", "mutate", {
        sql: "DELETE FROM tasks WHERE id = 4",
        summary: "Delete task 4",
      }),
    ),
  ];

  it("executes the write only when the user approves", async () => {
    const added = await resolvePendingChanges(history, true, deps);

    expect(deps.runMutation).toHaveBeenCalledWith(
      "DELETE FROM tasks WHERE id = 4",
    );
    expect(added).toEqual([
      { role: "tool", tool_call_id: "w1", content: "Applied." },
    ]);
    expect(getPendingChanges([...history, ...added])).toEqual([]);
  });

  it("does not execute the write when the user declines", async () => {
    const added = await resolvePendingChanges(history, false, deps);

    expect(deps.runMutation).not.toHaveBeenCalled();
    expect(added).toEqual([
      { role: "tool", tool_call_id: "w1", content: DECLINED_RESULT },
    ]);
  });

  it("closes unconfirmed writes when the user sends another message", () => {
    expect(supersedePendingChanges(history)).toEqual([
      { role: "tool", tool_call_id: "w1", content: SUPERSEDED_RESULT },
    ]);
  });

  it("has nothing pending once the model answered in text", () => {
    expect(
      getPendingChanges([
        { role: "user", content: "hi" },
        assistantSaying("hello"),
      ]),
    ).toEqual([]);
  });
});

describe("toDisplayMessages", () => {
  it("shows user and assistant text only, hiding tool traffic", () => {
    const display = toDisplayMessages([
      { role: "user", content: "How many deals?" },
      assistantCalling(toolCall("c1", "query", { sql: "SELECT 1" })),
      { role: "tool", tool_call_id: "c1", content: "[]" },
      assistantSaying("None yet."),
    ]);

    expect(display).toEqual([
      { role: "user", content: "How many deals?" },
      { role: "assistant", content: "None yet." },
    ]);
  });
});
