import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import PropTypes from "prop-types";
import { useCallback, useMemo, useState } from "react";

import TaskCard from "./TaskCard";

import { ScrollArea } from "@/components/ui/scroll-area";
import { TASK_STATUSES } from "@/constants";
import { t } from "@/i18n";

const COLUMN_WIDTH = 280;

function KanbanColumn({ status, tasks, onView, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH }}
      className={`flex flex-col gap-3 rounded-lg border bg-muted/60 p-3 transition-colors ${
        isOver ? "border-primary shadow-sm" : "border-border/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t(`tasks.statuses.${status}`)}
        </h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <KanbanTaskCard
            key={task.id}
            task={task}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center rounded-md border border-dashed border-border/80 bg-background/70 px-3 py-6 text-center text-xs text-muted-foreground">
            {t("tasks.kanban.columnEmpty")}
          </div>
        )}
      </div>
    </div>
  );
}

KanbanColumn.propTypes = {
  status: PropTypes.string.isRequired,
  tasks: PropTypes.arrayOf(PropTypes.object).isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function KanbanTaskCard({ task, onView, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="select-none touch-none"
      {...listeners}
      {...attributes}
    >
      <TaskCard
        item={task}
        onView={() => onView(task)}
        onEdit={() => onEdit(task)}
        onDelete={() => onDelete(task.id)}
      />
    </div>
  );
}

KanbanTaskCard.propTypes = {
  task: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function TasksKanban({
  tasks,
  statuses = TASK_STATUSES,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const [activeTask, setActiveTask] = useState(null);

  const grouped = useMemo(() => {
    const base = statuses.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {});
    tasks.forEach((task) => {
      if (base[task.status]) base[task.status].push(task);
    });
    return base;
  }, [tasks, statuses]);

  const handleDragStart = useCallback(({ active }) => {
    setActiveTask(active?.data?.current?.task ?? null);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      setActiveTask(null);
      if (!active || !over) return;
      const task = active.data?.current?.task;
      const nextStatus = over.data?.current?.status ?? over.id;
      if (!task || !nextStatus || task.status === nextStatus) return;
      onStatusChange(task, nextStatus);
    },
    [onStatusChange],
  );

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {t("tasks.kanban.empty")}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full overflow-x-auto pb-2">
        <div className="flex w-max gap-4">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={grouped[status] ?? []}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>
      <DragOverlay>
        {activeTask ? (
          <div style={{ width: COLUMN_WIDTH }}>
            <TaskCard
              item={activeTask}
              onView={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              canManage={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

TasksKanban.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.object).isRequired,
  statuses: PropTypes.arrayOf(PropTypes.string),
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

export default TasksKanban;
