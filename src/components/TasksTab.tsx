import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { TASK_STATUSES } from "../constants";
import { Task, Object } from "../types";
import "../assets/space-theme.css";

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
import UserAutocomplete from "./UserAutocomplete";
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
    async (data: Partial<Task>) => {
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
    <div className="space-y-6 space-bg-gradient p-6 rounded-xl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="space-title">✅ Задачи</h3>
          <p className="space-subtitle">Управление задачами и проектами</p>
        </div>
        <Button onClick={openAddModal} className="space-button space-fade-in">
          ✨ Добавить задачу
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-card p-6">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="🔍 Поиск задач..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 space-input"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 space-select">
                <SelectValue placeholder="📊 Статус" />
              </SelectTrigger>
              <SelectContent className="space-modal">
                <SelectItem value="all">🌟 Все статусы</SelectItem>
                <SelectItem value="pending">⏳ Ожидает</SelectItem>
                <SelectItem value="in_progress">🚀 В работе</SelectItem>
                <SelectItem value="completed">✅ Завершено</SelectItem>
                <SelectItem value="cancelled">❌ Отменено</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 space-select">
                <SelectValue placeholder="🔄 Сортировка" />
              </SelectTrigger>
              <SelectContent className="space-modal">
                <SelectItem value="created_at">📅 Дата создания</SelectItem>
                <SelectItem value="title">📝 Название</SelectItem>
                <SelectItem value="status">📊 Статус</SelectItem>
                <SelectItem value="priority">⚡ Приоритет</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="space-button"
            >
              {sortOrder === "asc" ? "⬆️" : "⬇️"}
            </Button>
          </div>
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
        <DialogContent className="max-w-2xl space-modal space-fade-in">
          <DialogHeader className="space-modal-header">
            <DialogTitle className="text-white">
              {editingTask ? "✏️ Редактировать задачу" : "✨ Добавить задачу"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleTaskSubmit)}
            className="space-y-6 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-space-text font-semibold"
                >
                  📝 Название
                </Label>
                <Input
                  {...register("title")}
                  id="title"
                  className="w-full space-input"
                  placeholder="Введите название задачи..."
                />
                <FormError error={errors.title?.message} />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="status"
                  className="text-space-text font-semibold"
                >
                  📊 Статус
                </Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger className="space-select">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent className="space-modal">
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError error={errors.status?.message} />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="priority"
                  className="text-space-text font-semibold"
                >
                  ⚡ Приоритет
                </Label>
                <Select
                  value={watch("priority")}
                  onValueChange={(value) => setValue("priority", value)}
                >
                  <SelectTrigger className="space-select">
                    <SelectValue placeholder="Выберите приоритет" />
                  </SelectTrigger>
                  <SelectContent className="space-modal">
                    <SelectItem value="low">🟢 Низкий</SelectItem>
                    <SelectItem value="medium">🟡 Средний</SelectItem>
                    <SelectItem value="high">🔴 Высокий</SelectItem>
                    <SelectItem value="urgent">🚨 Срочный</SelectItem>
                  </SelectContent>
                </Select>
                <FormError error={errors.priority?.message} />
              </div>
              <div className="space-y-2">
                <UserAutocomplete
                  value={watch("assignee") || ""}
                  onChange={(value) => setValue("assignee", value)}
                  placeholder="Введите имя исполнителя..."
                  label="👤 Исполнитель"
                  error={errors.assignee?.message}
                  id="assignee"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="due_date"
                  className="text-space-text font-semibold"
                >
                  📅 Срок выполнения
                </Label>
                <Input
                  {...register("due_date")}
                  id="due_date"
                  type="date"
                  className="w-full space-input"
                />
                <FormError error={errors.due_date?.message} />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="estimated_hours"
                  className="text-space-text font-semibold"
                >
                  ⏱️ Оценка времени (часы)
                </Label>
                <Input
                  {...register("estimated_hours", { valueAsNumber: true })}
                  id="estimated_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  className="w-full space-input"
                  placeholder="0"
                />
                <FormError error={errors.estimated_hours?.message} />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-space-text font-semibold"
              >
                📄 Описание
              </Label>
              <Textarea
                {...register("description")}
                id="description"
                className="w-full space-input"
                rows={3}
                placeholder="Опишите задачу подробнее..."
              />
              <FormError error={errors.description?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-space-text font-semibold">
                📝 Заметки
              </Label>
              <Textarea
                {...register("notes")}
                id="notes"
                className="w-full space-input"
                rows={2}
                placeholder="Дополнительные заметки..."
              />
              <FormError error={errors.notes?.message} />
            </div>
            <DialogFooter className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className="space-button"
              >
                ❌ Отмена
              </Button>
              <Button type="submit" className="space-button space-active">
                {editingTask ? "💾 Сохранить" : "✨ Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteTaskId}
        title="🗑️ Удалить задачу"
        message="Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить."
        confirmLabel="🗑️ Удалить"
        confirmVariant="destructive"
        onConfirm={() => deleteTaskId && handleDelete(deleteTaskId)}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
}
