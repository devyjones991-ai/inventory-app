import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";

import { supabase } from "@/supabaseClient";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import logger from "@/utils/logger";

export default function AuditTrail({ limit = 50 }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
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
        setError(err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [limit]);

  if (loading) return <Spinner />;
  if (error)
    return <ErrorMessage error={error} message="Ошибка загрузки логов" />;

  return (
    <div className="overflow-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Время</th>
            <th>Пользователь</th>
            <th>Действие</th>
            <th>Таблица</th>
            <th>ID</th>
            <th>Детали</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>
                {log.created_at
                  ? new Date(log.created_at).toLocaleString("ru-RU")
                  : ""}
              </td>
              <td>{log.user_id}</td>
              <td>{log.action}</td>
              <td>{log.target_table}</td>
              <td>{log.target_id}</td>
              <td>
                {log.meta && (
                  <pre className="whitespace-pre-wrap break-all max-w-xs">
                    {JSON.stringify(log.meta, null, 2)}
                  </pre>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

AuditTrail.propTypes = {
  limit: PropTypes.number,
};
