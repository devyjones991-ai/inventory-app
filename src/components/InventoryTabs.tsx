import { PlusIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useCallback, Suspense, lazy } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useHardware } from "../hooks/useHardware";
import { useTasks } from "../hooks/useTasks";
// import { t } from "../i18n";
import { Object, Hardware, Task } from "../types";
import { linkifyText } from "../utils/linkify";
import "../assets/space-theme.css";

import FormError from "./FormError";
import HardwareCard from "./HardwareCard";
import Spinner from "./Spinner";
const ChatTab = lazy(() => import("./ChatTab"));
const TasksTab = lazy(() => import("./TasksTab"));
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

const hardwareSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  type: z.string().min(1, "Тип обязателен"),
  location: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_expiry: z.string().optional(),
  cost: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

interface InventoryTabsProps {
  selected: Object | null;
  userEmail: string;
  chatCount?: number;
  tasksCount?: number;
  hardwareCount?: number;
  onTabChange?: (tab: string) => void;
}

export default function InventoryTabs({
  selected,
  userEmail,
  chatCount = 0,
  tasksCount = 0,
  hardwareCount = 0,
  onTabChange,
}: InventoryTabsProps) {
  const [activeTab, setActiveTab] = useState("desc");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [editingHardware, setEditingHardware] = useState<Hardware | null>(null);
  const { hardware, deleteHardware } = useHardware();

  const { tasks, createTask, updateTask, deleteTask } = useTasks(
    selected?.id || "",
  );

  const {
    register: registerHardware,
    handleSubmit: handleHardwareSubmit,
    formState: { errors: hardwareErrors },
    reset: resetHardware,
  } = useForm({
    resolver: zodResolver(hardwareSchema),
  });

  const openAddHardwareModal = useCallback(() => {
    setEditingHardware(null);
    setIsHardwareModalOpen(true);
  }, []);

  const openEditHardwareModal = useCallback((hardware: Hardware) => {
    setEditingHardware(hardware);
    setIsHardwareModalOpen(true);
  }, []);

  const closeHardwareModal = useCallback(() => {
    setIsHardwareModalOpen(false);
    setEditingHardware(null);
    resetHardware();
  }, [resetHardware]);

  const handleDeleteHardware = useCallback(
    async (id: string) => {
      if (confirm("Удалить оборудование?")) {
        await deleteHardware(id);
      }
    },
    [deleteHardware],
  );

  return (
    <div className="space-y-6 space-bg-gradient p-6 rounded-xl">
      {/* Блок описания объекта - всегда видим */}
      <div className="space-card p-6 space-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="space-title text-xl mb-2">📦 {selected.name}</h3>
            <p className="text-space-text-muted link-container">
              {linkifyText(selected.description, 60, "DESCRIPTION")}
            </p>
            {selected.location && (
              <div className="mt-4">
                <h4 className="text-space-text font-semibold">
                  📍 Местоположение
                </h4>
                <p className="text-space-text-muted">{selected.location}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              className="space-sidebar-button"
              onClick={() => {
                /* TODO: Добавить редактирование объекта */
              }}
              aria-label="Редактировать объект"
            >
              ✏️
            </button>
            <button
              className="space-sidebar-button danger"
              onClick={() => {
                /* TODO: Добавить удаление объекта */
              }}
              aria-label="Удалить объект"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 bg-space-bg-light p-1 rounded-lg border border-space-border">
          <TabsTrigger
            value="hw"
            className="data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300 relative"
          >
            🔧 Железо ({hardware.length})
            {hardwareCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {hardwareCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300 relative"
          >
            ✅ Задачи ({tasks.length})
            {tasksCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {tasksCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300 relative"
          >
            💬 Чат
            {chatCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {chatCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hw" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="space-title text-xl">🔧 Оборудование</h3>
              <p className="text-space-text-muted">
                Управление техническим оборудованием
              </p>
            </div>
            <Button
              onClick={openAddHardwareModal}
              className="space-button space-fade-in"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              🔧 Добавить
            </Button>
          </div>

          {hardware.length === 0 ? (
            <div className="space-card flex items-center justify-center h-32 text-space-text-muted">
              <div className="text-center">
                <div className="text-4xl mb-2">🔧</div>
                <p>Нет оборудования</p>
                <p className="text-sm">Добавьте первое устройство!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hardware.map((item: Hardware) => (
                <HardwareCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEditHardwareModal(item)}
                  onDelete={() => handleDeleteHardware(item.id)}
                  user={null}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Suspense fallback={<Spinner />}>
            <TasksTab
              selected={selected}
              tasks={tasks}
              loading={false}
              error={null}
              onCreateTask={createTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Suspense fallback={<Spinner />}>
            <ChatTab
              selected={selected}
              userEmail={userEmail}
              active={activeTab === "chat"}
            />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Hardware Modal */}
      <Dialog open={isHardwareModalOpen} onOpenChange={setIsHardwareModalOpen}>
        <DialogContent className="max-w-2xl space-modal space-fade-in">
          <DialogHeader className="space-modal-header">
            <DialogTitle className="text-white text-xl">
              {editingHardware
                ? "✏️ Редактировать оборудование"
                : "🔧 Добавить оборудование"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHardwareSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  🔧 Название оборудования
                </label>
                <Input
                  {...registerHardware("name")}
                  placeholder="Введите название оборудования..."
                  className="space-input w-full"
                />
                <FormError message={hardwareErrors.name?.message} />
              </div>
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  📋 Тип оборудования
                </label>
                <Input
                  {...registerHardware("type")}
                  placeholder="Введите тип оборудования..."
                  className="space-input w-full"
                />
                <FormError message={hardwareErrors.type?.message} />
              </div>
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  📍 Местоположение
                </label>
                <Input
                  {...registerHardware("location")}
                  placeholder="Введите местоположение..."
                  className="space-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  🏷️ Модель
                </label>
                <Input
                  {...registerHardware("model")}
                  placeholder="Введите модель..."
                  className="space-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  🔢 Серийный номер
                </label>
                <Input
                  {...registerHardware("serial_number")}
                  placeholder="Введите серийный номер..."
                  className="space-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  🏢 Поставщик
                </label>
                <Input
                  {...registerHardware("vendor")}
                  placeholder="Введите поставщика..."
                  className="space-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  📅 Дата покупки
                </label>
                <Input
                  {...registerHardware("purchase_date")}
                  type="date"
                  className="space-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  ⏰ Окончание гарантии
                </label>
                <Input
                  {...registerHardware("warranty_expiry")}
                  type="date"
                  className="space-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  💰 Стоимость
                </label>
                <Input
                  {...registerHardware("cost")}
                  type="number"
                  placeholder="Введите стоимость..."
                  className="space-input w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-space-text font-semibold">
                📝 Заметки
              </label>
              <Textarea
                {...registerHardware("notes")}
                placeholder="Введите дополнительные заметки..."
                className="space-input w-full"
                rows={3}
              />
            </div>
            <DialogFooter className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={closeHardwareModal}
                className="space-button"
              >
                ❌ Отмена
              </Button>
              <Button type="submit" className="space-button space-active">
                {editingHardware ? "💾 Сохранить" : "🔧 Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
