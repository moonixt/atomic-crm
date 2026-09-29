import { useMemo } from "react";
import { useStore, useTranslate } from "ra-core";

import type { DealStage, LabeledValue, NoteStatus } from "../types";
import { defaultConfiguration } from "./defaultConfiguration";

export const CONFIGURATION_STORE_KEY = "app.configuration";

export interface ConfigurationContextValue {
  companySectors: LabeledValue[];
  currency: string;
  dealCategories: LabeledValue[];
  dealPipelineStatuses: string[];
  dealStages: DealStage[];
  noteStatuses: NoteStatus[];
  taskTypes: LabeledValue[];
  title: string;
  darkModeLogo: string;
  lightModeLogo: string;
}

type TranslatableList =
  | "companySectors"
  | "dealCategories"
  | "dealStages"
  | "noteStatuses"
  | "taskTypes";

const TRANSLATABLE_LISTS: TranslatableList[] = [
  "companySectors",
  "dealCategories",
  "dealStages",
  "noteStatuses",
  "taskTypes",
];

/**
 * Raw configuration, exactly as stored. Use it where labels are persisted or
 * matched against user data (settings form, imports).
 */
export const useRawConfigurationContext = () => {
  const [config] = useStore<ConfigurationContextValue>(
    CONFIGURATION_STORE_KEY,
    defaultConfiguration,
  );
  // Merge with defaults so that missing fields in stored config
  // fall back to default values (e.g. when new settings are added)
  return useMemo(() => ({ ...defaultConfiguration, ...config }), [config]);
};

/**
 * Configuration for display: labels that still match the built-in default are
 * translated (crm.configuration.<list>.<value>), custom labels are kept as is.
 */
export const useConfigurationContext = () => {
  const config = useRawConfigurationContext();
  const translate = useTranslate();
  return useMemo(() => {
    const translateList = <T extends LabeledValue>(
      list: TranslatableList,
    ): T[] =>
      (config[list] as T[]).map((item) => {
        const defaultItem = (defaultConfiguration[list] as T[]).find(
          (d) => d.value === item.value,
        );
        if (defaultItem?.label !== item.label) return item;
        return {
          ...item,
          label: translate(`crm.configuration.${list}.${item.value}`, {
            _: item.label,
          }),
        };
      });
    return TRANSLATABLE_LISTS.reduce(
      (acc, list) => ({ ...acc, [list]: translateList(list) }),
      config,
    );
  }, [config, translate]);
};

export const useConfigurationUpdater = () => {
  const [, setConfig] = useStore<ConfigurationContextValue>(
    CONFIGURATION_STORE_KEY,
  );
  return setConfig;
};
