import React from "react";
import { isApiConfigured } from "@/apiConfig";
import { isSupabaseConfigured } from "@/supabaseClient";
import { Alert } from "@/components/ui/alert";

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
  const targetsText = targets.join(" и ");

  return (
    <div className="flex h-screen items-center justify-center bg-muted">
      <div className="flex w-full min-h-screen items-center justify-center bg-muted">
        <div className="space-y-4 max-w-md text-center">
          {missingVars.length > 0 && (
            <Alert variant="destructive">
              {varsText} не заданы. Приложение работает в ограниченном режиме
              {targets.length ? ` для: ${targetsText}.` : "."}
            </Alert>
          )}
          {!isApiConfigured && (
            <Alert variant="warning">
              Без API загрузка и сохранение данных недоступны. Задайте
              {" VITE_API_BASE_URL."}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
