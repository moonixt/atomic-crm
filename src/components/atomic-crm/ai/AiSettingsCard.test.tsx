import { render } from "vitest-browser-react";
import { CoreAdminContext, type DataProvider } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import { testI18nProvider } from "../providers/commons/i18nProvider";
import { AiSettingsCard } from "./AiSettingsCard";
import type { AiChatRequest, AiStatus } from "./types";

const adminStatus: AiStatus = {
  configured: false,
  model: "gpt-5-mini",
  baseUrl: "https://api.openai.com/v1",
  isAdmin: true,
  keyHint: null,
};

const renderCard = async () => {
  const saved: AiChatRequest[] = [];
  const aiChat = async (request: AiChatRequest) => {
    if (request.action === "save_settings") {
      saved.push(request);
      return { ...adminStatus, configured: true, keyHint: "…1234" };
    }
    return adminStatus;
  };
  const screen = await render(
    <CoreAdminContext
      dataProvider={{ ...fakeDataProvider({}), aiChat } as DataProvider}
      i18nProvider={testI18nProvider}
    >
      <AiSettingsCard />
    </CoreAdminContext>,
  );
  return { screen, saved };
};

describe("AiSettingsCard", () => {
  it("shows the current endpoint and model", async () => {
    const { screen } = await renderCard();

    await expect
      .element(screen.getByLabelText("Base URL"))
      .toHaveValue("https://api.openai.com/v1");
    await expect
      .element(screen.getByLabelText("Model"))
      .toHaveValue("gpt-5-mini");
  });

  it("saves an Azure endpoint together with the key and deployment name", async () => {
    const { screen, saved } = await renderCard();

    await screen
      .getByLabelText("Base URL")
      .fill("https://my-resource.openai.azure.com");
    await screen.getByLabelText("API key").fill("azure-key");
    await screen.getByLabelText("Model").fill("my-deployment");
    await screen.getByRole("button", { name: "Save AI settings" }).click();

    await expect
      .element(screen.getByLabelText("API key"))
      .toHaveAttribute("placeholder", expect.stringContaining("…1234"));
    expect(saved).toEqual([
      {
        action: "save_settings",
        apiKey: "azure-key",
        model: "my-deployment",
        baseUrl: "https://my-resource.openai.azure.com",
      },
    ]);
  });
});
