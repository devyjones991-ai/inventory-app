import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { supabase } from "@/supabaseClient";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import logger from "@/utils/logger";

const DEFAULT_PAGE_SIZE = 20;

const objectFilters = (objectId) => [
  `target_id.eq.${objectId}`,
  `meta->>object_id.eq.${objectId}`,
  `meta->old->>object_id.eq.${objectId}`,
  `meta->new->>object_id.eq.${objectId}`,
];

const escapeLike = (value) => value.replace(/[%_]/g, (m) => `\\${m}`);

const buildSearchClause = (pattern) => [
  `action.ilike.${pattern}`,
  `target_table.ilike.${pattern}`,
  `meta::text.ilike.${pattern}`,
];

export default function AuditTrail({ objectId, pageSize = DEFAULT_PAGE_SIZE }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const hasObjectFilter = Boolean(objectId);
  const from = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const to = useMemo(() => from + pageSize - 1, [from, pageSize]);
  const maxPage = useMemo(
    () => (total ? Math.max(1, Math.ceil(total / pageSize)) : 1),
    [total, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [objectId, submittedSearch, pageSize]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const trimmedSearch = submittedSearch.trim();
      const hasSearch = Boolean(trimmedSearch);
      const pattern = hasSearch ? `%${escapeLike(trimmedSearch)}%` : null;

      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (hasObjectFilter && hasSearch) {
        const combinedClauses = objectFilters(objectId).flatMap(
          (objectClause) =>
            buildSearchClause(pattern).map(
              (searchClause) => `and(${objectClause},${searchClause})`,
            ),
        );

        query = query.or(combinedClauses.join(","));
      } else if (hasObjectFilter) {
        query = query.or(objectFilters(objectId).join(","));
      } else if (hasSearch) {
        query = query.or(buildSearchClause(pattern).join(","));
      }

      query = query.range(from, to);

      const { data, error: err, count } = await query;
      if (err) throw err;
      setLogs(data || []);
      setTotal(count || 0);
      setError(null);
    } catch (err) {
      logger.error("AuditTrail load error:", err);
      await handleSupabaseError(err, null, t("audit.error"));
      setLogs([]);
      setError(err);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [from, to, hasObjectFilter, objectId, submittedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setSubmittedSearch(search);
    },
    [search],
  );

  const onReset = useCallback(() => {
    setSearch("");
    setSubmittedSearch("");
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} message={t("audit.error")} />;

  return (
    <div className="flex flex-col gap-4 h-full">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={onSearchSubmit}
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("audit.searchPlaceholder")}
        />
        <div className="flex gap-2">
          <Button type="submit">{t("common.search")}</Button>
          <Button type="button" variant="outline" onClick={onReset}>
            {t("common.reset")}
          </Button>
        </div>
      </form>

      <div className="flex-1 overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">{t("audit.columns.time")}</th>
              <th className="px-3 py-2 text-left">{t("audit.columns.user")}</th>
              <th className="px-3 py-2 text-left">
                {t("audit.columns.action")}
              </th>
              <th className="px-3 py-2 text-left">
                {t("audit.columns.table")}
              </th>
              <th className="px-3 py-2 text-left">{t("audit.columns.id")}</th>
              <th className="px-3 py-2 text-left">
                {t("audit.columns.details")}
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={6}
                >
                  {t("audit.empty")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-3 py-2 align-top">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString("ru-RU")
                      : ""}
                  </td>
                  <td className="px-3 py-2 align-top break-all">
                    {log.user_id}
                  </td>
                  <td className="px-3 py-2 align-top">{log.action}</td>
                  <td className="px-3 py-2 align-top">{log.target_table}</td>
                  <td className="px-3 py-2 align-top break-all">
                    {log.target_id}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {log.meta && (
                      <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto rounded bg-muted/50 p-2 text-xs">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("audit.pagination", {
            from: total === 0 ? 0 : from + 1,
            to: Math.min(to + 1, total),
            total,
          })}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            {t("audit.prev")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={page >= maxPage}
            onClick={() => setPage((prev) => Math.min(maxPage, prev + 1))}
          >
            {t("audit.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}

AuditTrail.propTypes = {
  objectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  pageSize: PropTypes.number,
};
