import React, { useState, useRef, useCallback } from "react";
import InventorySidebar from "@/components/InventorySidebar";
import InventoryTabs from "@/components/InventoryTabs";
import AccountModal from "@/components/AccountModal";
import ConfirmModal from "@/components/ConfirmModal";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/ThemeToggle";
import { t } from "@/i18n";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useObjectList } from "@/hooks/useObjectList";
import { useObjectNotifications } from "@/hooks/useObjectNotifications";
import { useDashboardModals } from "@/hooks/useDashboardModals";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const { signOut } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState("desc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    objects,
    selected,
    fetchError,
    isEmpty,
    handleSelect,
    handleUpdateSelected,
    saveObject,
    deleteObject,
    importFromFile,
    exportToFile,
  } = useObjectList();

  const { notifications, clearNotifications } = useObjectNotifications(
    selected,
    activeTab,
    user,
  );

  const {
    isObjectModalOpen,
    objectName,
    setObjectName,
    editingObject,
    deleteCandidate,
    setDeleteCandidate,
    isAccountModalOpen,
    setIsAccountModalOpen,
    openAddModal,
    openEditModal,
    closeObjectModal,
  } = useDashboardModals();

  const [addHandler, setAddHandler] = useState(() => openAddModal);
  const registerAddHandler = useCallback(
    (handler) => {
      setAddHandler(() => handler || openAddModal);
    },
    [openAddModal],
  );

  const importInputRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const onSelect = (obj) => {
    handleSelect(obj);
    clearNotifications(obj.id);
    setActiveTab("desc");
    setIsSidebarOpen(false);
  };

  const onUpdateSelected = (updated) => {
    handleUpdateSelected(updated);
    clearNotifications(updated.id);
  };

  const onTabChange = (tab) => {
    setActiveTab(tab);
    if ((tab === "tasks" || tab === "chat") && selected) {
      clearNotifications(selected.id);
    }
  };

  const onSaveObject = async () => {
    const ok = await saveObject(objectName, editingObject);
    if (ok) closeObjectModal();
  };

  const onConfirmDelete = async () => {
    const ok = await deleteObject(deleteCandidate);
    if (ok) setDeleteCandidate(null);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await importFromFile(file);
      e.target.value = "";
    }
  };

  if (!user) return <Navigate to="/auth" replace />;

  if (fetchError) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-background text-red-500">
        {fetchError}
      </div>
    );
  }

  if (!selected) {
    if (isEmpty) {
      return (
        <div className="flex w-full min-h-screen items-center justify-center bg-background text-gray-500">
          {t("dashboard.empty")}
        </div>
      );
    }
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-background text-gray-500">
        {t("dashboard.selectPrompt")}
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <aside className="hidden md:flex flex-col w-72 bg-muted p-4 border-r shadow-lg overflow-y-auto">
          <InventorySidebar
            objects={objects}
            selected={selected}
            onSelect={onSelect}
            onEdit={openEditModal}
            onDelete={setDeleteCandidate}
            notifications={notifications}
          />
        </aside>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-10 flex">
            <div
              className="fixed inset-0 bg-background"
              onClick={toggleSidebar}
            />
            <aside className="relative z-20 w-72 bg-muted p-4 shadow-lg overflow-y-auto">
              <Button
                size="icon"
                className="absolute right-2 top-2"
                onClick={toggleSidebar}
                aria-label="Close"
              >
                ✕
              </Button>
              <InventorySidebar
                objects={objects}
                selected={selected}
                onSelect={onSelect}
                onEdit={openEditModal}
                onDelete={setDeleteCandidate}
                notifications={notifications}
              />
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <header className="flex flex-col xs:items-start xs:gap-2 md:flex-row items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-3 md:gap-4">
              <button className="md:hidden p-2 text-lg" onClick={toggleSidebar}>
                ☰
              </button>
              <Button
                variant="success"
                className="flex items-center gap-1"
                onClick={addHandler}
              >
                <PlusIcon className="w-4 h-4" /> {t("dashboard.add")}
              </Button>
              <>
                <Button
                  variant="outline"
                  onClick={() => importInputRef.current?.click()}
                >
                  {t("dashboard.import")}
                </Button>
                <Button variant="outline" onClick={exportToFile}>
                  {t("dashboard.export")}
                </Button>
                <Input
                  type="file"
                  accept=".csv"
                  ref={importInputRef}
                  className="hidden"
                  onChange={handleImport}
                />
              </>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <ThemeToggle />
              <Button
                className="p-2 text-lg md:text-sm"
                onClick={() => setIsAccountModalOpen(true)}
              >
                {user.user_metadata?.username || t("common.account")}
              </Button>
              <Button className="p-2 text-lg md:text-sm" onClick={signOut}>
                {t("common.logout")}
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4">
            <InventoryTabs
              selected={selected}
              onUpdateSelected={onUpdateSelected}
              onTabChange={onTabChange}
              registerAddHandler={registerAddHandler}
            />
          </div>
        </div>

        <Dialog
          open={isObjectModalOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              closeObjectModal();
            }
          }}
        >
          <DialogContent draggable className="w-full max-w-md">
            <Button
              size="icon"
              className="absolute right-2 top-2"
              onClick={closeObjectModal}
              aria-label="Close"
            >
              ✕
            </Button>
            <DialogHeader data-dialog-handle>
              <DialogTitle>
                {editingObject ? t("objects.editTitle") : t("objects.addTitle")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="text"
                className="w-full"
                placeholder={t("objects.namePlaceholder")}
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
              />
            </div>
            <DialogFooter className="flex space-x-2">
              <Button onClick={onSaveObject}>{t("common.save")}</Button>
              <Button variant="ghost" onClick={closeObjectModal}>
                {t("common.cancel")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmModal
          open={!!deleteCandidate}
          title={t("objects.confirmDeleteTitle")}
          confirmLabel={
            <>
              <TrashIcon className="w-4 h-4" /> {t("common.delete")}
            </>
          }
          onConfirm={onConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />

        {isAccountModalOpen && (
          <AccountModal
            user={user}
            onClose={() => setIsAccountModalOpen(false)}
            onUpdated={() => {}}
          />
        )}
      </div>
    </>
  );
}
