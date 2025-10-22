import { PlusIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useCallback, Suspense, lazy } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useHardware } from "../hooks/useHardware";
import { useTasks } from "../hooks/useTasks";
// import { t } from "../i18n";
import { Object, Hardware, Task } from "../types";

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
}

export default function InventoryTabs({
  selected,
  userEmail,
}: InventoryTabsProps) {
  const [activeTab, setActiveTab] = useState("desc");
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [editingHardware, setEditingHardware] = useState<Hardware | null>(null);
  const [hardwareFormData, setHardwareFormData] = useState<Partial<Hardware>>({});
  const [hardwareFormErrors, setHardwareFormErrors] = useState<Record<string, string>>({});
  const {
    hardware,
    deleteHardware,
  } = useHardware();

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
    setHardwareFormData({});
    setHardwareFormErrors({});
    setIsHardwareModalOpen(true);
  }, []);

  const openEditHardwareModal = useCallback((hardware: Hardware) => {
    setEditingHardware(hardware);
    setHardwareFormData({
      name: hardware.name,
      type: hardware.type,
      location: hardware.location || "",
      model: hardware.model || "",
      serial_number: hardware.serial_number || "",
      purchase_date: hardware.purchase_date || "",
      warranty_expiry: hardware.warranty_expiry || "",
      cost: hardware.cost?.toString() || "",
      vendor: hardware.vendor || "",
      notes: hardware.notes || "",
    });
    setHardwareFormErrors({});
    setIsHardwareModalOpen(true);
  }, []);

  const closeHardwareModal = useCallback(() => {
    setIsHardwareModalOpen(false);
    setEditingHardware(null);
    setHardwareFormData({});
    setHardwareFormErrors({});
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
    <div className="space-y-4">
      {/* Блок описания объекта - всегда видим */}
      <div className="space-y-4 p-4 bg-card rounded-lg border">
        <div>
          <h3 className="text-lg font-semibold">{selected.name}</h3>
          <p className="text-muted-foreground">{selected.description}</p>
        </div>
        {selected.location && (
          <div>
            <h4 className="font-medium">Местоположение</h4>
            <p className="text-sm text-muted-foreground">
              {selected.location}
            </p>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hw">
            Железо ({hardware.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Задачи ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="chat">
            Чат
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hw" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Оборудование</h3>
            <Button onClick={openAddHardwareModal}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>

          {hardware.length === 0 ? (
            <p className="text-muted-foreground">Нет оборудования</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <ChatTab selected={selected} userEmail={userEmail} active={activeTab === "chat"} />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Hardware Modal */}
      <Dialog open={isHardwareModalOpen} onOpenChange={setIsHardwareModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingHardware ? "Редактировать" : "Добавить"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHardwareSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  {...registerHardware("name")}
                  placeholder="Название оборудования"
                  className="w-full"
                />
                <FormError message={hardwareErrors.name?.message} />
              </div>
              <div>
                <Input
                  {...registerHardware("type")}
                  placeholder="Тип оборудования"
                  className="w-full"
                />
                <FormError message={hardwareErrors.type?.message} />
              </div>
              <div>
                <Input
                  {...registerHardware("location")}
                  placeholder="Местоположение"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("model")}
                  placeholder="Модель"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("serial_number")}
                  placeholder="Серийный номер"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("vendor")}
                  placeholder="Поставщик"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("purchase_date")}
                  type="date"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("warranty_expiry")}
                  type="date"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("cost")}
                  type="number"
                  placeholder="Стоимость"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <Textarea
                {...registerHardware("notes")}
                placeholder="Заметки"
                className="w-full"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeHardwareModal}
              >
                Отмена
              </Button>
              <Button type="submit">
                {editingHardware ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
