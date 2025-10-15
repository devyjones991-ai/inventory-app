import { PlusIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useHardware } from "../hooks/useHardware";
import { useTasks } from "../hooks/useTasks";
import { t } from "../i18n";
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
  name: z.string().min(1, t("hardware.nameRequired")),
  type: z.string().min(1, t("hardware.typeRequired")),
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
  selected: Object;
  onUpdateSelected: (updated: Object) => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  registerAddHandler: (handler: (() => void) | null) => void;
  tasksCount: number;
  chatCount: number;
}

export default function InventoryTabs({
  selected,
  onUpdateSelected,
  onTabChange,
  activeTab,
  registerAddHandler,
  tasksCount,
  chatCount,
}: InventoryTabsProps) {
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [editingHardware, setEditingHardware] = useState<Hardware | null>(null);
  const [hardwareFormData, setHardwareFormData] = useState<
    Record<string, unknown>
  >({});
  const [hardwareFormErrors, setHardwareFormErrors] = useState<
    Record<string, string>
  >({});

  const {
    hardware,
    loadHardware,
    createHardware,
    updateHardware,
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

  const handleHardwareSubmitForm = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        if (editingHardware) {
          await updateHardware(editingHardware.id, data);
        } else {
          await createHardware(data);
        }
        closeHardwareModal();
      } catch (error) {
        console.error("Hardware submit error:", error);
      }
    },
    [editingHardware, updateHardware, createHardware, closeHardwareModal],
  );

  const handleDeleteHardware = useCallback(
    async (id: string) => {
      if (confirm(t("hardware.confirmDelete"))) {
        await deleteHardware(id);
      }
    },
    [deleteHardware],
  );

  useEffect(() => {
    registerAddHandler(openAddHardwareModal);
  }, [registerAddHandler, openAddHardwareModal]);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="desc">{t("objects.description")}</TabsTrigger>
          <TabsTrigger value="hw">
            {t("hardware.title")} ({hardware.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            {t("tasks.title")} ({tasksCount})
          </TabsTrigger>
          <TabsTrigger value="chat">
            {t("chat.title")} {chatCount > 0 && `(${chatCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="desc" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <p className="text-muted-foreground">{selected.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">{t("objects.type")}</h4>
                <p className="text-sm text-muted-foreground">{selected.type}</p>
              </div>
              <div>
                <h4 className="font-medium">{t("objects.status")}</h4>
                <p className="text-sm text-muted-foreground">
                  {selected.status}
                </p>
              </div>
              {selected.location && (
                <div>
                  <h4 className="font-medium">{t("objects.location")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selected.location}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hw" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t("hardware.title")}</h3>
            <Button onClick={openAddHardwareModal}>
              <PlusIcon className="w-4 h-4 mr-2" />
              {t("hardware.add")}
            </Button>
          </div>

          {hardware.length === 0 ? (
            <p className="text-muted-foreground">{t("hardware.empty")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hardware.map((item: Hardware) => (
                <HardwareCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEditHardwareModal(item)}
                  onDelete={() => handleDeleteHardware(item.id)}
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
            <ChatTab selected={selected} />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Hardware Modal */}
      <Dialog open={isHardwareModalOpen} onOpenChange={setIsHardwareModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingHardware ? t("hardware.edit") : t("hardware.add")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHardwareSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  {...registerHardware("name")}
                  placeholder={t("hardware.namePlaceholder")}
                  className="w-full"
                />
                <FormError message={hardwareErrors.name?.message} />
              </div>
              <div>
                <Input
                  {...registerHardware("type")}
                  placeholder={t("hardware.typePlaceholder")}
                  className="w-full"
                />
                <FormError message={hardwareErrors.type?.message} />
              </div>
              <div>
                <Input
                  {...registerHardware("location")}
                  placeholder={t("hardware.locationPlaceholder")}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("model")}
                  placeholder={t("hardware.modelPlaceholder")}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("serial_number")}
                  placeholder={t("hardware.serialNumberPlaceholder")}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  {...registerHardware("vendor")}
                  placeholder={t("hardware.vendorPlaceholder")}
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
                  placeholder={t("hardware.costPlaceholder")}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <Textarea
                {...registerHardware("notes")}
                placeholder={t("hardware.notesPlaceholder")}
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
                {t("common.cancel")}
              </Button>
              <Button type="submit">
                {editingHardware ? t("common.save") : t("common.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
