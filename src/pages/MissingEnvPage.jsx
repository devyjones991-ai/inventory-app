import React from "react";
import { isApiConfigured } from "@/apiConfig";
import { isSupabaseConfigured } from "@/supabaseClient";
import { Alert } from "@/components/ui/alert";
import { t } from "@/i18n";

export default function MissingEnvPage() {
  const missingVars = [];
  const targets = [];

  if (!isSupabaseConfigured) {
    missingVars.push("VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY");
    targets.push("Supabase");
  }

  if (!isApiConfigured) {
    missingVars.push("VITE_API_BASE_URL");
    targets.push("API");
  }

  const varsText = missingVars.join(", ");
  const targetsText = targets.join(", ");

  return (
    <div className="flex h-screen items-center justify-center bg-muted">
      <div className="flex w-full min-h-screen items-center justify-center bg-muted">
        <div className="space-y-4 max-w-md text-center">
          {missingVars.length > 0 && (
            <Alert variant="destructive">
              {t("env.missingVarsPrefix")} {varsText}. {t("env.limitedMode")}{" "}
              {targets.length ? `${t("env.targetsPrefix")}${targetsText}.` : ""}
            </Alert>
          )}
          {!isApiConfigured && (
            <Alert variant="warning">{t("env.apiUnavailable")}</Alert>
          )}
        </div>
      </div>
    </div>
  );
}
