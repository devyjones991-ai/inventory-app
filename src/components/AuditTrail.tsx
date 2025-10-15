import React, { useEffect, useState } from "react";
import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";
import { supabase } from "../supabaseClient";
import { handleSupabaseError } from "../utils/handleSupabaseError";
import logger from "../utils/logger";

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  user_id: string;
  created_at: string;
}

interface AuditTrailProps {
  limit?: number;
}

export default function AuditTrail({ limit = 50 }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        const { data, error: err } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (err) throw err;
        setLogs(data || []);
        setError(null);
      } catch (err) {
        logger.error("AuditTrail load error:", err);
        await handleSupabaseError(err, null, "Ошибка загрузки логов");
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [limit]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">История изменений</h3>
      {logs.length === 0 ? (
        <p className="text-gray-500">Нет записей</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded border p-3 text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium">{log.action}</span>
                <span className="text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-gray-600">
                Таблица: {log.table_name}
              </div>
              {log.old_values && Object.keys(log.old_values).length > 0 && (
                <div className="mt-1">
                  <span className="text-red-600">Старые значения:</span>
                  <pre className="text-xs">
                    {JSON.stringify(log.old_values, null, 2)}
                  </pre>
                </div>
              )}
              {log.new_values && Object.keys(log.new_values).length > 0 && (
                <div className="mt-1">
                  <span className="text-green-600">Новые значения:</span>
                  <pre className="text-xs">
                    {JSON.stringify(log.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
