import { render } from "vitest-browser-react";
import { CoreAdminContext, memoryStore } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import { i18nProvider } from "../providers/commons/i18nProvider";
import {
  CONFIGURATION_STORE_KEY,
  useConfigurationContext,
} from "./ConfigurationContext";
import { defaultConfiguration } from "./defaultConfiguration";

const StageLabels = () => {
  const { dealStages, companySectors } = useConfigurationContext();
  return (
    <ul>
      {[...dealStages, ...companySectors].map((item) => (
        <li key={item.value}>{item.label}</li>
      ))}
    </ul>
  );
};

const renderInPortuguese = async (store = memoryStore()) => {
  await i18nProvider.changeLocale("pt-BR");
  store.setItem("locale", "pt-BR");
  return render(
    <CoreAdminContext
      dataProvider={fakeDataProvider({})}
      i18nProvider={i18nProvider}
      store={store}
    >
      <StageLabels />
    </CoreAdminContext>,
  );
};

describe("useConfigurationContext", () => {
  afterEach(async () => {
    await i18nProvider.changeLocale("en");
  });

  it("translates default deal stages and company sectors", async () => {
    const screen = await renderInPortuguese();

    await expect.element(screen.getByText("Em negociação")).toBeInTheDocument();
    await expect.element(screen.getByText("Energia")).toBeInTheDocument();
  });

  it("keeps labels the user customized in settings", async () => {
    const store = memoryStore({
      [CONFIGURATION_STORE_KEY]: {
        ...defaultConfiguration,
        dealStages: [
          { value: "opportunity", label: "Lead quente" },
          { value: "custom-stage", label: "Custom stage" },
          { value: "won", label: "Won" },
        ],
      },
    });

    const screen = await renderInPortuguese(store);

    await expect.element(screen.getByText("Lead quente")).toBeInTheDocument();
    await expect.element(screen.getByText("Custom stage")).toBeInTheDocument();
    await expect.element(screen.getByText("Ganho")).toBeInTheDocument();
  });
});
