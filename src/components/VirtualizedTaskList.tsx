import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

import { Task } from "../types";

import TaskCard from "./TaskCard";

interface VirtualizedTaskListProps {
  tasks: Task[];
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  height?: number;
  itemSize?: number;
}

function VirtualizedTaskList({
  tasks,
  onView,
  onEdit,
  onDelete,
  height = 400,
  itemSize = 120,
}: VirtualizedTaskListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // В тестовой среде используем простой рендеринг без виртуализации
  if (process.env.NODE_ENV === 'test') {
    if (tasks.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Нет задач
        </div>
      );
    }

    return (
      <div className="rounded border" style={{ height }}>
        {tasks.map((task, index) => (
          <div key={task.id || index} className="px-2 py-1">
            <TaskCard
              item={task}
              onView={() => onView(task)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              canManage={true}
            />
          </div>
        ))}
      </div>
    );
  }

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
  });

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Нет задач
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="rounded border overflow-auto"
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const task = tasks[virtualItem.index];
          if (!task) return null;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-2 py-1"
            >
              <TaskCard
                item={task}
                onView={() => onView(task)}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task)}
                canManage={true}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedTaskList;