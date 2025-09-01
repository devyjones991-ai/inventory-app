import { memo, useCallback } from "react";
import PropTypes from "prop-types";
import { formatDate } from "@/utils/date";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REVERSE_STATUS_MAP } from "@/constants/taskStatus";
import { t } from "@/i18n";

const STATUS_VARIANTS = {
  planned: "info",
  in_progress: "warning",
  done: "success",
  canceled: "destructive",
};

function TaskCard({ item, onEdit, onDelete, onView }) {
  const assignee = item.assignee || null;
  const dueDate = item.due_date || null;
  const assignedAt = item.assigned_at || item.created_at || null;
  const badgeVariant = STATUS_VARIANTS[item.status] || "default";

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
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer hover:bg-accent/30 animate-fade-in"
      onClick={handleView}
    >
      <CardHeader className="flex-1">
        <CardTitle className="break-words whitespace-pre-wrap">
          {item.title}
        </CardTitle>
        <p className="text-sm text-foreground/70 hidden">
          {assignee && <span>РСЃРїРѕР»РЅРёС‚РµР»СЊ: {assignee}</span>}
          {assignee && (assignedAt || dueDate) && <span> | </span>}
          {assignedAt && (
            <span>РќР°Р·РЅР°С‡РµРЅР°: {formatDate(assignedAt)}</span>
          )}
          {dueDate && (assignedAt || assignee) && <span> | </span>}
          {dueDate && <span>РЎСЂРѕРє РґРѕ: {formatDate(dueDate)}</span>}
        </p>
        <p className="text-sm text-foreground/70">
          {assignee && (
            <span>
              {t("tasks.view.assignee")} {assignee}
            </span>
          )}
          {assignee && (assignedAt || dueDate) && <span> | </span>}
          {assignedAt && (
            <span>
              {t("tasks.view.added")} {formatDate(assignedAt)}
            </span>
          )}
          {dueDate && (assignedAt || assignee) && <span> | </span>}
          {dueDate && (
            <span>
              {t("tasks.view.dueDate")} {formatDate(dueDate)}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-2 sm:mt-0 sm:whitespace-nowrap">
        <Badge variant={badgeVariant}>
          {REVERSE_STATUS_MAP[item.status] || item.status}
        </Badge>
        <Button
          size="iconSm"
          variant="ghost"
          className="text-blue-600 dark:text-blue-400"
          title={t("common.edit")}
          aria-label={t("common.edit")}
          onClick={handleEdit}
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
        <Button
          size="iconSm"
          variant="ghost"
          className="text-red-600 dark:text-red-400"
          title={t("common.delete")}
          aria-label={t("common.delete")}
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
