import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { memo, useCallback } from "react";

import { t } from "../i18n";
import { Task } from "../types";
import { formatDate } from "../utils/date";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

const STATUS_VARIANTS: Record<string, string> = {
  planned: "info",
  in_progress: "warning",
  done: "success",
  canceled: "destructive",
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
  onEdit,
  onDelete,
  onView,
  canManage = true,
}: TaskCardProps) {
  const assignee = item.assignee || null;
  const dueDate = item.due_date || null;
  const assignedAt = item.assigned_at || item.created_at || null;
  const badgeVariant = STATUS_VARIANTS[item.status] || "default";

  const handleView = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onView();
    },
    [onView],
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit();
    },
    [onEdit],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete();
    },
    [onDelete],
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant as any}>
              {t(`tasks.status.${item.status}`)}
            </Badge>
            {canManage && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleView}
                  className="h-6 w-6 p-0"
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          {assignee && (
            <div>
              <span className="font-medium">Исполнитель:</span> {assignee}
            </div>
          )}
          {dueDate && (
            <div>
              <span className="font-medium">Срок:</span> {formatDate(dueDate)}
            </div>
          )}
          {assignedAt && (
            <div>
              <span className="font-medium">Назначено:</span>{" "}
              {formatDate(assignedAt)}
            </div>
          )}
          {item.notes && (
            <div>
              <span className="font-medium">Заметки:</span> {item.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(TaskCard);
