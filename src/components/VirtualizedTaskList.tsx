import { forwardRef, useCallback, useEffect, useRef } from "react";
import { VariableSizeList as List } from "react-window";

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
  const listRef = useRef<List | null>(null);
  const sizeMapRef = useRef<Record<number, number>>({});
  const defaultSizeRef = useRef(itemSize);

  const setSize = useCallback((index: number, size: number) => {
    const prev = sizeMapRef.current[index];
    if (prev !== size && Number.isFinite(size) && size > 0) {
      sizeMapRef.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  }, []);

  const getSize = useCallback(
    (index: number) => sizeMapRef.current[index] || defaultSizeRef.current,
    [],
  );

  const Item = forwardRef<
    HTMLDivElement,
    { index: number; style: React.CSSProperties }
  >(({ index, style }, ref) => {
    const task = tasks[index];
    if (!task) return null;

    return (
      <div ref={ref} style={style} className="px-2 py-1">
        <TaskCard
          item={task}
          onView={() => onView(task)}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task)}
          canManage={true}
        />
      </div>
    );
  });

  Item.displayName = "Item";

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [tasks.length]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Нет задач
      </div>
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={tasks.length}
      itemSize={getSize}
      className="rounded border"
    >
      {Item}
    </List>
  );
}

export default VirtualizedTaskList;
