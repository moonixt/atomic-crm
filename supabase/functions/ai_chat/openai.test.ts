// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildAuthHeaders,
  resolveChatCompletionsUrl,
  validateBaseUrl,
} from "./openai";

describe("resolveChatCompletionsUrl", () => {
  it.each([
    [null, "https://api.openai.com/v1/chat/completions"],
    [
      "https://api.openai.com/v1/",
      "https://api.openai.com/v1/chat/completions",
    ],
    [
      "https://opencode.ai/zen/v1",
      "https://opencode.ai/zen/v1/chat/completions",
    ],
    [
      "https://hermina-ai.openai.azure.com",
      "https://hermina-ai.openai.azure.com/openai/v1/chat/completions",
    ],
    [
      "https://hermina-ai.openai.azure.com/openai/v1",
      "https://hermina-ai.openai.azure.com/openai/v1/chat/completions",
    ],
    [
      "https://example.cognitiveservices.azure.com/",
      "https://example.cognitiveservices.azure.com/openai/v1/chat/completions",
    ],
    [
      "https://proxy.example.com/v1/chat/completions",
      "https://proxy.example.com/v1/chat/completions",
    ],
  ])("maps %s to %s", (baseUrl, expected) => {
    expect(resolveChatCompletionsUrl(baseUrl)).toBe(expected);
  });
});

describe("buildAuthHeaders", () => {
  it("uses the api-key header for Azure resources", () => {
    expect(
      buildAuthHeaders("https://hermina-ai.openai.azure.com", "secret"),
    ).toEqual({ "api-key": "secret" });
  });

  it("uses a Bearer token for OpenAI and compatible providers", () => {
    expect(buildAuthHeaders(null, "secret")).toEqual({
      Authorization: "Bearer secret",
    });
    expect(buildAuthHeaders("https://opencode.ai/zen/v1", "secret")).toEqual({
      Authorization: "Bearer secret",
    });
  });
});

describe("validateBaseUrl", () => {
  it("accepts https URLs and plain http on localhost", () => {
    expect(validateBaseUrl("https://opencode.ai/zen/v1")).toBeNull();
    expect(validateBaseUrl("http://localhost:11434/v1")).toBeNull();
  });

  it("rejects plain http on remote hosts, so the key never travels unencrypted", () => {
    expect(validateBaseUrl("http://example.com/v1")).toMatch(/https/);
  });

  it("rejects values that are not URLs", () => {
    expect(validateBaseUrl("hermina-ai")).toBe("Invalid URL");
  });
});
