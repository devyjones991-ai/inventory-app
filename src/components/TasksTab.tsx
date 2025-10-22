import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { TASK_STATUSES } from "../constants";
import { Task, Object } from "../types";

import ConfirmModal from "./ConfirmModal";
import ErrorMessage from "./ErrorMessage";
import FormError from "./FormError";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import VirtualizedTaskList from "./VirtualizedTaskList";

const taskSchema = z.object({
  title: z.string().min(1, "Название задачи обязательно"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().optional(),
  notes: z.string().optional(),
});

interface TasksTabProps {
  selected: Object | null;
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onCreateTask: (task: Partial<Task>) => Promise<void>;
  onUpdateTask: (id: string, task: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export default function TasksTab({
  selected,
  tasks,
  loading,
  error,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: TasksTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      assignee: "",
      due_date: "",
      estimated_hours: 0,
      notes: "",
    },
  });

  const filteredTasks = (tasks || []).filter((task) => {
    const matchesFilter =
      task.title.toLowerCase().includes(filter.toLowerCase()) ||
      task.description?.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesFilter && matchesStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aValue = a[sortBy as keyof Task];
    const bValue = b[sortBy as keyof Task];

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const openAddModal = useCallback(() => {
    setEditingTask(null);
    reset();
    setIsModalOpen(true);
  }, [reset]);

  const openEditModal = useCallback(
    (task: Task) => {
      setEditingTask(task);
      setValue("title", task.title);
      setValue("description", task.description || "");
      setValue("status", task.status);
      setValue("priority", task.priority);
      setValue("assignee", task.assignee || "");
      setValue("due_date", task.due_date || "");
      setValue("estimated_hours", task.estimated_hours || 0);
      setValue("notes", task.notes || "");
      setIsModalOpen(true);
    },
    [setValue],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
    reset();
  }, [reset]);

  const handleTaskSubmit = useCallback(
    async (data: any) => {
      try {
        if (editingTask) {
          await onUpdateTask(editingTask.id, data);
        } else {
          await onCreateTask({
            ...data,
            object_id: selected?.id || "",
          });
        }
        closeModal();
      } catch (error) {
        console.error("Error saving task:", error);
      }
    },
    [editingTask, onUpdateTask, onCreateTask, selected?.id, closeModal],
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      try {
        await onDeleteTask(taskId);
        setDeleteTaskId(null);
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    },
    [onDeleteTask],
  );

  if (loading) {
    return (
      <div className="text-center text-muted-foreground">Загрузка задач...</div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Задачи</h3>
        <Button onClick={openAddModal}>Добавить задачу</Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Поиск задач..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
              <SelectItem value="cancelled">Отменено</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Дата создания</SelectItem>
              <SelectItem value="title">Название</SelectItem>
              <SelectItem value="status">Статус</SelectItem>
              <SelectItem value="priority">Приоритет</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <VirtualizedTaskList
          tasks={sortedTasks}
          onView={(task) => openEditModal(task)}
          onEdit={(task) => openEditModal(task)}
          onDelete={(task) => setDeleteTaskId(task.id)}
          height={400}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Редактировать задачу" : "Добавить задачу"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleTaskSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input {...register("title")} id="title" className="w-full" />
                <FormError error={errors.title?.message} />
              </div>
              <div>
                <Label htmlFor="status">Статус</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError error={errors.status?.message} />
              </div>
              <div>
                <Label htmlFor="priority">Приоритет</Label>
                <Select
                  value={watch("priority")}
                  onValueChange={(value) => setValue("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочный</SelectItem>
                  </SelectContent>
                </Select>
                <FormError error={errors.priority?.message} />
              </div>
              <div>
                <Label htmlFor="assignee">Исполнитель</Label>
                <Input
                  {...register("assignee")}
                  id="assignee"
                  className="w-full"
                />
                <FormError error={errors.assignee?.message} />
              </div>
              <div>
                <Label htmlFor="due_date">Срок выполнения</Label>
                <Input
                  {...register("due_date")}
                  id="due_date"
                  type="date"
                  className="w-full"
                />
                <FormError error={errors.due_date?.message} />
              </div>
              <div>
                <Label htmlFor="estimated_hours">Оценка времени (часы)</Label>
                <Input
                  {...register("estimated_hours", { valueAsNumber: true })}
                  id="estimated_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  className="w-full"
                />
                <FormError error={errors.estimated_hours?.message} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                {...register("description")}
                id="description"
                className="w-full"
                rows={3}
              />
              <FormError error={errors.description?.message} />
            </div>
            <div>
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                {...register("notes")}
                id="notes"
                className="w-full"
                rows={2}
              />
              <FormError error={errors.notes?.message} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Отмена
              </Button>
              <Button type="submit">
                {editingTask ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteTaskId}
        title="Удалить задачу"
        message="Вы уверены, что хотите удалить эту задачу?"
        confirmLabel="Удалить"
        confirmVariant="destructive"
        onConfirm={() => deleteTaskId && handleDelete(deleteTaskId)}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
}
