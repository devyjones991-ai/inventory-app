import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { memo, useCallback } from "react";

import { Task } from "../types";
import { formatDate } from "../utils/date";
import { linkifyText } from "../utils/linkify";
import "../assets/space-theme.css";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

const STATUS_VARIANTS: Record<string, string> = {
  pending: "space-status-pending",
  in_progress: "space-status-in-progress",
  completed: "space-status-completed",
  cancelled: "space-status-cancelled",
};

const PRIORITY_VARIANTS: Record<string, string> = {
  low: "space-priority-low",
  medium: "space-priority-medium",
  high: "space-priority-high",
  urgent: "space-priority-urgent",
};

interface TaskCardProps {
  item: Task;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  canManage?: boolean;
}

function TaskCard({
  item,
  onEdit: _onEdit,
  onDelete,
  onView,
  canManage = true,
}: TaskCardProps) {
  const assignee = item.assignee || null;
  const dueDate = item.due_date || null;
  const assignedAt = item.assigned_at || item.created_at || null;
  const statusClass = STATUS_VARIANTS[item.status] || "space-status-pending";
  const priorityClass =
    PRIORITY_VARIANTS[item.priority] || "space-priority-medium";

  const handleView = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onView();
    },
    [onView],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete();
    },
    [onDelete],
  );

  return (
    <Card className="space-card space-fade-in hover:space-active transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-semibold text-space-text">
            {item.title}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className={`space-status ${statusClass}`}>
              {item.status === "pending" && "⏳"}
              {item.status === "in_progress" && "🚀"}
              {item.status === "completed" && "✅"}
              {item.status === "cancelled" && "❌"}{" "}
              {item.status === "pending" && "Ожидает"}
              {item.status === "in_progress" && "В работе"}
              {item.status === "completed" && "Завершено"}
              {item.status === "cancelled" && "Отменено"}
            </div>
            {item.priority && (
              <div className={`space-priority ${priorityClass}`}>
                {item.priority === "low" && "🟢"}
                {item.priority === "medium" && "🟡"}
                {item.priority === "high" && "🔴"}
                {item.priority === "urgent" && "🚨"}{" "}
                {item.priority === "low" && "Низкий"}
                {item.priority === "medium" && "Средний"}
                {item.priority === "high" && "Высокий"}
                {item.priority === "urgent" && "Срочный"}
              </div>
            )}
            {canManage && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleView}
                  className="h-8 w-8 p-0 space-icon hover:space-active"
                  aria-label="Редактировать"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 space-icon hover:text-red-500 hover:bg-red-500/10"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 text-sm text-space-text-muted">
          {assignee && (
            <div className="flex items-center gap-2">
              <span className="text-space-text font-semibold">
                👤 Исполнитель:
              </span>
              <span className="text-space-text">{assignee}</span>
            </div>
          )}
          {dueDate && (
            <div className="flex items-center gap-2">
              <span className="text-space-text font-semibold">📅 Срок:</span>
              <span className="text-space-text">{formatDate(dueDate)}</span>
            </div>
          )}
          {assignedAt && (
            <div className="flex items-center gap-2">
              <span className="text-space-text font-semibold">
                🚀 Назначено:
              </span>{" "}
              <span className="text-space-text">{formatDate(assignedAt)}</span>
            </div>
          )}
          {item.description && (
            <div className="flex items-start gap-2">
              <span className="text-space-text font-semibold">
                📄 Описание:
              </span>
              <span className="text-space-text link-container">
                {linkifyText(item.description, 45, "TASKS")}
              </span>
            </div>
          )}
          {item.notes && (
            <div className="flex items-start gap-2">
              <span className="text-space-text font-semibold">📝 Заметки:</span>
              <span className="text-space-text link-container">
                {linkifyText(item.notes, 45, "TASKS")}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(TaskCard);
