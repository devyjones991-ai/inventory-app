import { PlusIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import PropTypes from "prop-types";
import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
  lazy,
  useRef,
} from "react";
import { z } from "zod";

import HardwareCard from "./HardwareCard";
import Spinner from "./Spinner";
const ChatTab = lazy(() => import("./ChatTab"));
const TasksTab = lazy(() => import("./TasksTab"));

import FormError from "@/components/FormError.jsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  HARDWARE_FIELDS,
  INSTALL_STATUSES,
  PURCHASE_STATUSES,
} from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useHardware } from "@/hooks/useHardware";
import { useObjects } from "@/hooks/useObjects";
import usePersistedForm from "@/hooks/usePersistedForm";
import { t } from "@/i18n";
import { linkifyText } from "@/utils/linkify";

const HW_FORM_KEY = (objectId) => `hwForm_${objectId}`;
const DEFAULT_HW_FORM = {
  [HARDWARE_FIELDS.NAME]: "",
  [HARDWARE_FIELDS.LOCATION]: "",
  [HARDWARE_FIELDS.PURCHASE_STATUS]: PURCHASE_STATUSES[0],
  [HARDWARE_FIELDS.INSTALL_STATUS]: INSTALL_STATUSES[0],
};

function InventoryTabs({
  selected,
  onUpdateSelected,
  onTabChange = () => {},
  registerAddHandler,
  tasksCount: tasksCountExternal,
  chatCount: chatCountExternal,
}) {
  const { user } = useAuth();

  // --- вкладки и описание ---
  const [tab, setTab] = useState("desc");
  const [description, setDescription] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // --- оборудование и счётчики ---
  const [hardware, setHardware] = useState([]);
  const [tasksCount, setTasksCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isHWModalOpen, setIsHWModalOpen] = useState(false);
  const [editingHW, setEditingHW] = useState(null);

  // Allow external counts (from Dashboard) to override before tabs mount
  useEffect(() => {
    if (typeof tasksCountExternal === "number")
      setTasksCount(tasksCountExternal);
  }, [tasksCountExternal]);
  useEffect(() => {
    if (typeof chatCountExternal === "number")
      setMessageCount(chatCountExternal);
  }, [chatCountExternal]);
  const hardwareSchema = z.object({
    [HARDWARE_FIELDS.NAME]: z
      .string()
      .min(1, t("hardware.validation.nameRequired")),
    [HARDWARE_FIELDS.LOCATION]: z.string().optional(),
    [HARDWARE_FIELDS.PURCHASE_STATUS]: z.enum(PURCHASE_STATUSES, {
      required_error: t("hardware.validation.purchaseStatusRequired"),
    }),
    [HARDWARE_FIELDS.INSTALL_STATUS]: z.enum(INSTALL_STATUSES, {
      required_error: t("hardware.validation.installStatusRequired"),
    }),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = usePersistedForm(
    selected ? HW_FORM_KEY(selected.id) : null,
    DEFAULT_HW_FORM,
    isHWModalOpen,
    { resolver: zodResolver(hardwareSchema) },
  );

  useEffect(() => {
    register(HARDWARE_FIELDS.PURCHASE_STATUS);
    register(HARDWARE_FIELDS.INSTALL_STATUS);
  }, [register]);

  const purchaseStatus = watch(HARDWARE_FIELDS.PURCHASE_STATUS);
  const installStatus = watch(HARDWARE_FIELDS.INSTALL_STATUS);

  const {
    hardware: loadedHardware = [],
    loadHardware,
    createHardware,
    updateHardware,
    deleteHardware,
  } = useHardware(selected?.id);

  useEffect(() => {
    if (selected?.id) {
      loadHardware(selected.id);
    }
  }, [selected?.id, loadHardware]);

  useEffect(() => {
    setHardware(loadedHardware);
  }, [loadedHardware]);

  const openHWModal = useCallback(() => {
    reset(DEFAULT_HW_FORM);
    setEditingHW(null);
    setIsHWModalOpen(true);
  }, [reset]);

  const closeHWModal = useCallback(() => {
    setIsHWModalOpen(false);
  }, []);

  const handleHWSubmit = handleSubmit(async (data) => {
    if (!selected?.id) return;
    if (editingHW) {
      await updateHardware(editingHW.id, data);
    } else {
      await createHardware({ ...data, object_id: selected.id });
    }
    setIsHWModalOpen(false);
    reset(DEFAULT_HW_FORM);
  });

  const handleEditHW = useCallback((item) => {
    setEditingHW(item);
    setIsHWModalOpen(true);
  }, []);

  useEffect(() => {
    if (isHWModalOpen && editingHW) {
      reset(editingHW);
    }
  }, [isHWModalOpen, editingHW, reset]);

  const handleDeleteHW = useCallback(
    async (item) => {
      await deleteHardware(item.id);
    },
    [deleteHardware],
  );

  const { updateObject } = useObjects();

  useEffect(() => {
    if (selected) {
      setDescription(selected.description || "");
    }
  }, [selected]);

  const saveDescription = useCallback(async () => {
    if (!selected) return;
    try {
      await updateObject(selected.id, { description });
      onUpdateSelected({ ...selected, description });
    } finally {
      setIsEditingDesc(false);
    }
  }, [selected, description, updateObject, onUpdateSelected]);

  // Notify parent only when tab value changes, not when function identity changes
  const onTabChangeRef = useRef(onTabChange);
  useEffect(() => {
    onTabChangeRef.current = onTabChange;
  }, [onTabChange]);
  useEffect(() => {
    onTabChangeRef.current?.(tab);
  }, [tab]);

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
      <TabsList
        className="mb-4 overflow-x-auto flex-nowrap"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <TabsTrigger value="desc" className="flex-shrink-0">
          {t("inventory.tabs.desc")}
        </TabsTrigger>
        <TabsTrigger value="hw" className="flex-shrink-0">
          {t("inventory.tabs.hw")} ({hardware.length})
        </TabsTrigger>
        <TabsTrigger value="tasks" className="flex-shrink-0">
          {t("inventory.tabs.tasks")} ({tasksCount})
        </TabsTrigger>
        <TabsTrigger value="chat" className="flex-shrink-0">
          {t("inventory.tabs.chat")} ({messageCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="desc" className="flex-1 overflow-auto">
        <div className="space-y-2">
          {isEditingDesc ? (
            <div className="space-y-2">
              <Textarea
                className="textarea textarea-bordered w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" type="button" onClick={saveDescription}>
                  {t("common.save")}
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => setIsEditingDesc(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="whitespace-pre-wrap break-words">
                {description
                  ? linkifyText(description)
                  : t("inventory.noDescription")}
              </div>
              {user && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingDesc(true)}
                >
                  {t("common.edit")}
                </Button>
              )}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="hw" className="flex-1 overflow-auto">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t("hardware.header")}</h2>
            {user && (
              <Button
                size="sm"
                variant="success"
                className="flex items-center gap-1"
                onClick={openHWModal}
              >
                <PlusIcon className="w-4 h-4" /> {t("common.add")}
              </Button>
            )}
          </div>
          {hardware.length === 0 ? (
            <div className="text-center text-gray-500">
              {t("hardware.notFound")}
            </div>
          ) : (
            <div className="space-y-2">
              {hardware.map((item) => (
                <HardwareCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEditHW(item)}
                  onDelete={() => handleDeleteHW(item)}
                  user={user}
                />
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="tasks" forceMount className="flex-1 overflow-auto">
        <Suspense fallback={<Spinner />}>
          <TasksTab
            selected={selected}
            registerAddHandler={registerAddHandler}
            onCountChange={setTasksCount}
          />
        </Suspense>
      </TabsContent>
      <TabsContent value="chat" forceMount className="flex-1 overflow-hidden">
        <Suspense fallback={<Spinner />}>
          <ChatTab
            selected={selected}
            userEmail={user?.email}
            active={tab === "chat"}
            onCountChange={setMessageCount}
          />
        </Suspense>
      </TabsContent>

      <Dialog open={isHWModalOpen} onOpenChange={setIsHWModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHW ? t("hardware.editTitle") : t("hardware.addTitle")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHWSubmit} className="space-y-2">
            <div>
              <Input
                className="w-full"
                placeholder={t("hardware.name")}
                aria-invalid={!!errors[HARDWARE_FIELDS.NAME]}
                aria-describedby={
                  errors[HARDWARE_FIELDS.NAME]
                    ? "hardware-name-error"
                    : undefined
                }
                {...register(HARDWARE_FIELDS.NAME)}
              />
              <FormError
                id="hardware-name-error"
                message={errors[HARDWARE_FIELDS.NAME]?.message}
              />
            </div>
            <div>
              <Input
                className="w-full"
                placeholder={t("hardware.location")}
                {...register(HARDWARE_FIELDS.LOCATION)}
              />
            </div>
            <div>
              <Select
                value={purchaseStatus}
                onValueChange={(value) =>
                  setValue(HARDWARE_FIELDS.PURCHASE_STATUS, value)
                }
              >
                <SelectTrigger
                  className="w-full h-9"
                  aria-invalid={!!errors[HARDWARE_FIELDS.PURCHASE_STATUS]}
                  aria-describedby={
                    errors[HARDWARE_FIELDS.PURCHASE_STATUS]
                      ? "hardware-purchase-error"
                      : undefined
                  }
                >
                  <SelectValue
                    placeholder={t("hardware.choosePurchaseStatus")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`hardware.statuses.purchase.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError
                id="hardware-purchase-error"
                message={errors[HARDWARE_FIELDS.PURCHASE_STATUS]?.message}
              />
            </div>
            <div>
              <Select
                value={installStatus}
                onValueChange={(value) =>
                  setValue(HARDWARE_FIELDS.INSTALL_STATUS, value)
                }
              >
                <SelectTrigger
                  className="w-full h-9"
                  aria-invalid={!!errors[HARDWARE_FIELDS.INSTALL_STATUS]}
                  aria-describedby={
                    errors[HARDWARE_FIELDS.INSTALL_STATUS]
                      ? "hardware-install-error"
                      : undefined
                  }
                >
                  <SelectValue
                    placeholder={t("hardware.chooseInstallStatus")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {INSTALL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`hardware.statuses.install.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError
                id="hardware-install-error"
                message={errors[HARDWARE_FIELDS.INSTALL_STATUS]?.message}
              />
            </div>
            <DialogFooter>
              <Button type="button" onClick={closeHWModal}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

InventoryTabs.propTypes = {
  selected: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
  }),
  onUpdateSelected: PropTypes.func.isRequired,
  onTabChange: PropTypes.func,
  registerAddHandler: PropTypes.func,
  tasksCount: PropTypes.number,
  chatCount: PropTypes.number,
};

export default InventoryTabs;
