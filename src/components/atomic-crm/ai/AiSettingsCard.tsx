import { useNotify, useTranslate } from "ra-core";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AiChatError } from "./types";
import { useAiStatus, useSaveAiSettings } from "./useAiChat";

/**
 * AI assistant settings. Saved through the ai_chat edge function (not the
 * configuration form): the API key is stored server-side and never sent back.
 */
export const AiSettingsCard = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const { data: status, error } = useAiStatus();
  const { mutate: save, isPending } = useSaveAiSettings();
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);

  const unavailable =
    error instanceof AiChatError && error.code === "unavailable";
  const modelValue = model ?? status?.model ?? "";
  const baseUrlValue = baseUrl ?? status?.baseUrl ?? "";

  const submit = (settings: { clearKey?: boolean } = {}) =>
    save(
      { apiKey, model: modelValue, baseUrl: baseUrlValue, ...settings },
      {
        onSuccess: () => {
          setApiKey("");
          notify("crm.ai.settings.saved");
        },
        onError: (error) =>
          notify(
            error instanceof AiChatError && error.code === "invalid_base_url"
              ? "crm.ai.settings.invalid_base_url"
              : "crm.ai.settings.save_error",
            { type: "error" },
          ),
      },
    );

  // These inputs sit inside the settings <Form>: keep Enter from submitting it.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  return (
    <Card id="ai">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.ai.settings.title")}
        </h2>
        {unavailable ? (
          <p className="text-sm text-muted-foreground">
            {translate("crm.ai.errors.unavailable")}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="ai-base-url">
                {translate("crm.ai.settings.base_url")}
              </Label>
              <Input
                id="ai-base-url"
                type="url"
                value={baseUrlValue}
                onChange={(event) => setBaseUrl(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="https://api.openai.com/v1"
              />
              <p className="text-sm text-muted-foreground">
                {translate("crm.ai.settings.base_url_help")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-api-key">
                {translate("crm.ai.settings.api_key")}
              </Label>
              <Input
                id="ai-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  status?.keyHint
                    ? translate("crm.ai.settings.api_key_configured", {
                        hint: status.keyHint,
                      })
                    : "sk-..."
                }
              />
              <p className="text-sm text-muted-foreground">
                {translate("crm.ai.settings.api_key_help")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-model">
                {translate("crm.ai.settings.model")}
              </Label>
              <Input
                id="ai-model"
                value={modelValue}
                onChange={(event) => setModel(event.target.value)}
                onKeyDown={onKeyDown}
              />
              <p className="text-sm text-muted-foreground">
                {translate("crm.ai.settings.model_help")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={isPending}
                onClick={() => submit()}
              >
                {translate("crm.ai.settings.save")}
              </Button>
              {status?.configured && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => submit({ clearKey: true })}
                >
                  {translate("crm.ai.settings.remove_key")}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
