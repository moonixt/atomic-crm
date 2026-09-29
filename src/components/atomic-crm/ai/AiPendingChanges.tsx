import { useTranslate } from "ra-core";
import { Check, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { AiPendingChange } from "./types";

interface AiPendingChangesProps {
  changes: AiPendingChange[];
  isPending: boolean;
  onAnswer: (approved: boolean) => void;
}

/** Changes proposed by the assistant, applied only once the user confirms. */
export const AiPendingChanges = ({
  changes,
  isPending,
  onAnswer,
}: AiPendingChangesProps) => {
  const translate = useTranslate();
  return (
    <div
      role="group"
      aria-label={translate("crm.ai.pending.title")}
      className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-3"
    >
      <p className="flex items-center gap-2 font-medium">
        <TriangleAlert className="h-4 w-4 text-amber-600" />
        {translate("crm.ai.pending.title")}
      </p>
      <ul className="space-y-2">
        {changes.map((change) => (
          <li key={change.id} className="text-sm space-y-1">
            <p>{change.summary || translate("crm.ai.pending.no_summary")}</p>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">
                {translate("crm.ai.pending.show_sql")}
              </summary>
              <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs">
                {change.sql}
              </pre>
            </details>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button size="sm" disabled={isPending} onClick={() => onAnswer(true)}>
          <Check className="h-4 w-4" />
          {translate("crm.ai.pending.confirm")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => onAnswer(false)}
        >
          <X className="h-4 w-4" />
          {translate("crm.ai.pending.cancel")}
        </Button>
      </div>
    </div>
  );
};
