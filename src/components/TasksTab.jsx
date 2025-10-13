import { zodResolver } from "@hookform/resolvers/zod";
import PropTypes from "prop-types";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ConfirmModal from "./ConfirmModal";
import ErrorMessage from "./ErrorMessage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import VirtualizedTaskList from "./VirtualizedTaskList";

import FormError from "@/components/FormError.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUSES } from "@/constants";
import { useTasks } from "@/hooks/useTasks";
import { t } from "@/i18n";
import { formatDate } from "@/utils/date";
import logger from "@/utils/logger";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = TASK_STATUSES;

const taskSchema = z.object({
  title: z.string().min(1, "Введите название"),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(STATUS_OPTIONS, { required_error: "Выберите статус" }),
  notes: z.string().optional(),
});

function TasksTab({ selected, registerAddHandler, onCountChange }) {
  const assigneeInputRef = useRef(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [taskDeleteId, setTaskDeleteId] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterQuery, setFilterQuery] = useState("");
  // Debounced input state to avoid refresh on every keystroke
  const [queryInput, setQueryInput] = useState("");
  // Virtualized list responsive sizing for mobile correctness
  const [listHeight, setListHeight] = useState(400);
  const [listItemSize, setListItemSize] = useState(120);

  // Debounced search effect
  useEffect(() => {
    const id = setTimeout(() => setFilterQuery(queryInput), 300);
    return () => clearTimeout(id);
  }, [queryInput]);

  // Compute responsive list height and row size (prevents clipping on mobile)
  useEffect(() => {
    const compute = () => {
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
      // Leave room for header/filters/footer; use 55% of viewport on mobile, 65% on larger
      const h = Math.max(260, Math.floor(vw < 640 ? vh * 0.55 : vh * 0.65));
      // Row height: taller on mobile to accommodate wrapping
      const row = vw < 640 ? 156 : 120;
      setListHeight(h);
      setListItemSize(row);
    };
    compute();
    let rafId = 0;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(compute);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      assignee: "",
      due_date: "",
      status: STATUS_OPTIONS[0] || "",
      notes: "",
    },
  });

  useEffect(() => {
    register("status");
  }, [register]);

  const status = watch("status");

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
    const statusCode = filterStatus === "all" ? undefined : filterStatus;
    const query = filterQuery.trim() || undefined;
    loadTasks({ limit: PAGE_SIZE, status: statusCode, query });
  }, [selected?.id, filterStatus, filterQuery, loadTasks]);

  const openTaskModal = useCallback(() => {
    reset({
      title: "",
      assignee: "",
      due_date: todayStr,
      status: STATUS_OPTIONS[0] || "",
      notes: "",
    });
    setEditingTask(null);
    setIsTaskModalOpen(true);
  }, [todayStr, reset]);

  useEffect(() => {
    registerAddHandler?.(openTaskModal);
    return () => registerAddHandler?.(null);
  }, [registerAddHandler, openTaskModal]);

  // Notify parent about tasks count changes without re-triggering on every re-render
  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);
  useEffect(() => {
    onCountChangeRef.current?.(tasks.length);
  }, [tasks.length]);
  // Optimized search input handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e) => {
    setQueryInput(e.target.value);
  }, []);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setFilterStatus("all");
    setQueryInput("");
    setFilterQuery("");
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleTaskSubmit = useCallback(
    async (data) => {
      if (!TASK_STATUSES.includes(data.status)) {
        logger.error("Unknown status selected:", data.status);
        return;
      }
      const payload = {
        ...data,
        object_id: selected?.id,
        status: data.status,
      };
      try {
        if (editingTask) await updateTask(editingTask.id, payload);
        else await createTask(payload);
        closeTaskModal();
      } catch (err) {
        logger.error("Error saving task:", err);
      }
    },
    [editingTask, selected?.id, createTask, updateTask, closeTaskModal],
  );

  const handleEditTask = useCallback(
    (task) => {
      reset({
        title: task.title || "",
        assignee: task.assignee || "",
        due_date: task.due_date || "",
        status: task.status || STATUS_OPTIONS[0] || "",
        notes: task.notes || "",
      });
      setEditingTask(task);
      setIsTaskModalOpen(true);
    },
    [reset],
  );

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
        {t("dashboard.selectPrompt")}
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

  if (error) {
    logger.error("TasksTab error:", error);
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {t("tasks.headerPrefix")} {selected.name}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" type="button" onClick={openTaskModal}>
            {t("tasks.add")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-full sm:min-w-[180px] sm:w-auto">
          <Label>{t("tasks.status")}</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder={t("tasks.chooseStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`tasks.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:min-w-[220px] sm:w-auto flex-1">
          <Label>{t("common.search")}</Label>
          <div className="relative h-10">
            <Input
              ref={assigneeInputRef}
              type="text"
              inputMode="search"
              autoComplete="off"
              value={queryInput}
              onChange={handleSearchChange}
              placeholder={t("tasks.searchPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              className="h-full pr-10"
            />
            {(filterStatus !== "all" || queryInput) && (
              <Button
                type="button"
                variant="ghost"
                className="hidden sm:inline-flex h-8 px-2 absolute right-1 top-1/2 -translate-y-1/2"
                onClick={handleResetFilters}
              >
                {t("common.reset")}
              </Button>
            )}
          </div>
          {(filterStatus !== "all" || queryInput) && (
            <Button
              variant="ghost"
              type="button"
              className="sm:hidden mt-2"
              onClick={handleResetFilters}
            >
              {t("common.reset")}
            </Button>
          )}
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="text-gray-500 text-center py-8">{t("tasks.empty")}</div>
      ) : (
        <VirtualizedTaskList
          tasks={tasks}
          onEdit={handleEditTask}
          onDelete={(id) => setTaskDeleteId(id)}
          onView={(task) => setViewingTask(task)}
          height={listHeight}
          itemSize={listItemSize}
        />
      )}
      {/* Task Modal */}
      <Dialog
        open={isTaskModalOpen}
        onOpenChange={(open) => !open && closeTaskModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? t("tasks.editTitle") : t("tasks.addTitle")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleTaskSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">{t("tasks.title")} *</Label>
              <Input
                id="task-title"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "task-title-error" : undefined}
                {...register("title")}
              />
              <FormError
                id="task-title-error"
                message={errors.title?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">{t("tasks.assignee")}</Label>
              <Input
                id="task-assignee"
                aria-invalid={!!errors.assignee}
                aria-describedby={
                  errors.assignee ? "task-assignee-error" : undefined
                }
                {...register("assignee")}
              />
              <FormError
                id="task-assignee-error"
                message={errors.assignee?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-date">{t("tasks.form.dueDate")}</Label>
              <Input
                id="task-due-date"
                type="date"
                aria-label={t("tasks.form.dueDate")}
                title={t("tasks.form.dueDate")}
                aria-invalid={!!errors.due_date}
                aria-describedby={
                  errors.due_date ? "task-due-date-error" : undefined
                }
                {...register("due_date")}
              />
              <FormError
                id="task-due-date-error"
                message={errors.due_date?.message}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("tasks.status")}</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger
                  aria-invalid={!!errors.status}
                  aria-describedby={
                    errors.status ? "task-status-error" : undefined
                  }
                >
                  <SelectValue placeholder={t("tasks.chooseStatus")} />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`tasks.statuses.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError
                id="task-status-error"
                message={errors.status?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-notes">{t("tasks.notes")}</Label>
              <Textarea
                id="task-notes"
                rows={3}
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? "task-notes-error" : undefined}
                {...register("notes")}
              />
              <FormError
                id="task-notes-error"
                message={errors.notes?.message}
              />
            </div>
            <DialogFooter>
              <Button type="submit">{t("common.save")}</Button>
              <Button type="button" variant="ghost" onClick={closeTaskModal}>
                {t("common.cancel")}
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
        <DialogContent
          aria-labelledby="view-task-title"
          aria-describedby="view-task-content"
          className="border rounded-md bg-background shadow-lg"
        >
          <DialogHeader>
            <DialogTitle id="view-task-title">{viewingTask?.title}</DialogTitle>
          </DialogHeader>
          <div id="view-task-content" className="space-y-2">
            {viewingTask?.assignee && (
              <p>
                <strong>{t("tasks.view.assignee")}</strong>{" "}
                {viewingTask.assignee}
              </p>
            )}
            {(viewingTask?.assigned_at || viewingTask?.created_at) && (
              <p>
                <strong>{t("tasks.view.added")}</strong>{" "}
                {formatDate(viewingTask.assigned_at || viewingTask.created_at)}
              </p>
            )}
            {viewingTask?.due_date && (
              <p>
                <strong>{t("tasks.view.dueDate")}</strong>{" "}
                {formatDate(viewingTask.due_date)}
              </p>
            )}
            <p>
              <strong>{t("tasks.view.status")}</strong>{" "}
              {t(`tasks.statuses.${viewingTask?.status}`)}
            </p>
            {viewingTask?.notes && (
              <p className="whitespace-pre-wrap break-words">
                <strong>{t("tasks.view.notes")}</strong> {viewingTask.notes}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!taskDeleteId}
        title={t("tasks.confirmDelete")}
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

export default TasksTab;
