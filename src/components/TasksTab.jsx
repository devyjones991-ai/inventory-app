import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

import TaskCard from "./TaskCard";
import ErrorMessage from "./ErrorMessage";
import ConfirmModal from "./ConfirmModal";
import { useTasks } from "@/hooks/useTasks";
import logger from "@/utils/logger";
import { STATUS_MAP, REVERSE_STATUS_MAP } from "@/constants/taskStatus";
import { formatDate } from "@/utils/date";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = Object.keys(STATUS_MAP);

export default function TasksTab({
  selected,
  registerAddHandler,
  onCountChange,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [taskForm, setTaskForm] = useState({
    title: "",
    assignee: "",
    due_date: "",
    status: STATUS_OPTIONS[0] || "",
    notes: "",
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [taskDeleteId, setTaskDeleteId] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("");

  const {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks(selected?.id);

  useEffect(() => {
    if (!selected?.id) return;
    const statusCode =
      filterStatus === "all" ? undefined : STATUS_MAP[filterStatus];
    const assignee = filterAssignee.trim() || undefined;
    loadTasks({ limit: PAGE_SIZE, status: statusCode, assignee });
  }, [selected?.id, filterStatus, filterAssignee, loadTasks]);

  const openTaskModal = useCallback(() => {
    setTaskForm({
      title: "",
      assignee: "",
      due_date: todayStr,
      status: STATUS_OPTIONS[0] || "",
      notes: "",
    });
    setEditingTask(null);
    setIsTaskModalOpen(true);
  }, [todayStr]);

  useEffect(() => {
    registerAddHandler?.(openTaskModal);
    return () => registerAddHandler?.(null);
  }, [registerAddHandler, openTaskModal]);

  useEffect(() => {
    onCountChange?.(tasks.length);
  }, [tasks, onCountChange]);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleTaskSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const statusValue = STATUS_MAP[taskForm.status];
      if (!statusValue) {
        logger.error("Unknown status selected:", taskForm.status);
        return;
      }
      const payload = {
        ...taskForm,
        object_id: selected?.id,
        status: statusValue,
      };
      try {
        if (editingTask) await updateTask(editingTask.id, payload);
        else await createTask(payload);
        closeTaskModal();
      } catch (err) {
        logger.error("Error saving task:", err);
      }
    },
    [
      taskForm,
      editingTask,
      selected?.id,
      createTask,
      updateTask,
      closeTaskModal,
    ],
  );

  const handleEditTask = useCallback((task) => {
    setTaskForm({
      title: task.title || "",
      assignee: task.assignee || "",
      due_date: task.due_date || "",
      status: REVERSE_STATUS_MAP[task.status] || STATUS_OPTIONS[0] || "",
      notes: task.notes || "",
    });
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const confirmDeleteTask = useCallback(async () => {
    if (!taskDeleteId) return;
    try {
      await deleteTask(taskDeleteId);
    } catch (err) {
      logger.error("Error deleting task:", err);
    } finally {
      setTaskDeleteId(null);
    }
  }, [taskDeleteId, deleteTask]);

  if (!selected) {
    return (
      <div className="text-center py-8 text-gray-500">
        Выберите объект, чтобы просматривать задачи
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Задачи для {selected.name}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={openTaskModal}>
            Создать задачу
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[180px]">
          <Label>Статус</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[220px]">
          <Label>Исполнитель</Label>
          <Input
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            placeholder="Имя или email"
          />
        </div>
        {(filterStatus !== "all" || filterAssignee) && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterStatus("all");
              setFilterAssignee("");
            }}
          >
            Сбросить
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Пока задач нет. Нажмите «Создать задачу».
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              item={task}
              onEdit={() => handleEditTask(task)}
              onDelete={() => setTaskDeleteId(task.id)}
              onView={() => setViewingTask(task)}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <Dialog
        open={isTaskModalOpen}
        onOpenChange={(open) => !open && closeTaskModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Редактировать задачу" : "Создать задачу"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Название *</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Исполнитель</Label>
              <Input
                id="task-assignee"
                value={taskForm.assignee}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, assignee: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Срок до</Label>
              <Input
                id="task-due-date"
                type="date"
                value={taskForm.due_date}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, due_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={taskForm.status}
                onValueChange={(value) =>
                  setTaskForm({ ...taskForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-notes">Заметки</Label>
              <Textarea
                id="task-notes"
                rows={3}
                value={taskForm.notes}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, notes: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button type="submit">Сохранить</Button>
              <Button type="button" variant="ghost" onClick={closeTaskModal}>
                Отмена
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Task Modal */}
      <Dialog
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {viewingTask?.assignee && (
              <p>
                <strong>Исполнитель:</strong> {viewingTask.assignee}
              </p>
            )}
            {(viewingTask?.assigned_at || viewingTask?.created_at) && (
              <p>
                <strong>Назначена:</strong>{" "}
                {formatDate(viewingTask.assigned_at || viewingTask.created_at)}
              </p>
            )}
            {viewingTask?.due_date && (
              <p>
                <strong>Срок до:</strong> {formatDate(viewingTask.due_date)}
              </p>
            )}
            <p>
              <strong>Статус:</strong>{" "}
              {REVERSE_STATUS_MAP[viewingTask?.status] || viewingTask?.status}
            </p>
            {viewingTask?.notes && (
              <p className="whitespace-pre-wrap break-words">
                <strong>Заметки:</strong> {viewingTask.notes}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!taskDeleteId}
        title="Удалить задачу?"
        onConfirm={confirmDeleteTask}
        onCancel={() => setTaskDeleteId(null)}
      />
    </div>
  );
}

TasksTab.propTypes = {
  selected: PropTypes.object,
  registerAddHandler: PropTypes.func,
  onCountChange: PropTypes.func,
};
