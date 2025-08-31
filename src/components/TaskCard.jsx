import { memo, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REVERSE_STATUS_MAP } from "@/constants/taskStatus";

/**
 * Format date string into locale friendly format.
 * Falls back to original value on parse errors.
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU");
  } catch {
    return dateStr;
  }
}

const STATUS_VARIANTS = {
  planned: "info",
  in_progress: "warning",
  done: "success",
  canceled: "destructive",
};

function TaskCard({ item, onEdit, onDelete, onView }) {
  const badgeVariant = useMemo(
    () => STATUS_VARIANTS[item.status] || "default",
    [item.status],
  );

  const assignee = useMemo(() => item.assignee, [item.assignee]);
  const dueDate = useMemo(() => item.due_date, [item.due_date]);
  const assignedAt = useMemo(
    () => item.assigned_at || item.created_at,
    [item.assigned_at, item.created_at],
  );

  const handleView = useCallback(
    (e) => {
      e.stopPropagation();
      onView();
    },
    [onView],
  );

  const handleEdit = useCallback(
    (e) => {
      e.stopPropagation();
      onEdit();
    },
    [onEdit],
  );

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation();
      onDelete();
    },
    [onDelete],
  );

  return (
    <Card
      className="flex flex-col xs:flex-row md:flex-row justify-between items-start xs:items-center cursor-pointer hover:bg-accent/30 animate-fade-in"
      onClick={handleView}
    >
      <CardHeader className="flex-1">
        <CardTitle className="break-words whitespace-pre-wrap">
          {item.title}
        </CardTitle>
        {(assignee || dueDate) && (
          <p className="text-sm text-foreground/70">
            {assignee && <span>Ответственный: {assignee}</span>}
            {assignee && dueDate && " • "}
            {dueDate && <span>Срок: {formatDate(dueDate)}</span>}
          </p>
        )}
        {assignedAt && (
          <p className="text-sm text-foreground/70">
            Назначено: {formatDate(assignedAt)}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col xs:flex-row md:flex-row flex-wrap items-center gap-2 mt-2 xs:mt-0">
        <Badge variant={badgeVariant}>
          {REVERSE_STATUS_MAP[item.status] || item.status}
        </Badge>
        <Button
          size="iconSm"
          variant="ghost"
          className="text-blue-600 dark:text-blue-400"
          title="Редактировать задачу"
          aria-label="Редактировать задачу"
          onClick={handleEdit}
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
        <Button
          size="iconSm"
          variant="ghost"
          className="text-red-600 dark:text-red-400"
          title="Удалить задачу"
          aria-label="Удалить задачу"
          onClick={handleDelete}
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default memo(TaskCard);

TaskCard.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    assignee: PropTypes.string,
    due_date: PropTypes.string,
    created_at: PropTypes.string,
    assigned_at: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
};
