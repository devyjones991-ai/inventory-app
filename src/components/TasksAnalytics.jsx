import PropTypes from "prop-types";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TASK_STATUSES } from "@/constants";
import { t } from "@/i18n";

const STATUS_COLORS = ["#6366f1", "#0ea5e9", "#22c55e", "#f97316", "#f43f5e"];

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

SummaryItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

function TasksAnalytics({ tasks, statuses = TASK_STATUSES }) {
  const { counts, completed, overdue } = useMemo(() => {
    const baseCounts = statuses.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    let completedTotal = 0;
    let overdueTotal = 0;
    const now = new Date();
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    tasks.forEach((task) => {
      if (baseCounts[task.status] !== undefined) {
        baseCounts[task.status] += 1;
      }
      if (task.status === "done") {
        completedTotal += 1;
      }
      if (task.due_date) {
        const due = new Date(task.due_date);
        if (
          !Number.isNaN(due.getTime()) &&
          due < endOfToday &&
          task.status !== "done"
        ) {
          overdueTotal += 1;
        }
      }
    });

    return {
      counts: baseCounts,
      completed: completedTotal,
      overdue: overdueTotal,
    };
  }, [tasks, statuses]);

  const total = tasks.length;

  const chartData = statuses.map((status, index) => ({
    status,
    label: t(`tasks.statuses.${status}`),
    count: counts[status] ?? 0,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  }));

  const dataToRender = chartData.some((item) => item.count > 0)
    ? chartData.filter((item) => item.count > 0)
    : chartData;

  if (total === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {t("tasks.analytics.empty")}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{t("tasks.analytics.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryItem label={t("tasks.analytics.total")} value={total} />
          <SummaryItem
            label={t("tasks.analytics.completed")}
            value={completed}
          />
          <SummaryItem label={t("tasks.analytics.overdue")} value={overdue} />
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataToRender}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.25)"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-10}
                height={50}
                tickMargin={12}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
                formatter={(value, _name, props) => [
                  value,
                  props?.payload?.label ?? t("tasks.analytics.byStatus"),
                ]}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {dataToRender.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

TasksAnalytics.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.object).isRequired,
  statuses: PropTypes.arrayOf(PropTypes.string),
};

export default TasksAnalytics;
