import React, { useState, useRef, useCallback, useEffect } from "react";
import InventorySidebar from "@/components/InventorySidebar";
import InventoryTabs from "@/components/InventoryTabs";
import AccountModal from "@/components/AccountModal";
import ConfirmModal from "@/components/ConfirmModal";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/ThemeToggle";
import { t } from "@/i18n";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabaseClient";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasksCount, setTasksCount] = useState(0);

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

  const { chatUnread, clearNotifications } = useObjectNotifications(
    selected,
    activeTab,
    user,
  );
  const chatCount = selected?.id ? chatUnread[selected.id] || 0 : 0;

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isSidebarOpen]);

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

  // Keep URL in sync with selected object and active tab
  useEffect(() => {
    const currentObj = searchParams.get("obj");
    const currentTab = searchParams.get("tab");
    const nextObj = selected?.id ? String(selected.id) : null;
    const nextTab = activeTab;

    let changed = false;
    const params = new URLSearchParams(searchParams);
    if (nextObj !== currentObj) {
      changed = true;
      if (nextObj) params.set("obj", nextObj);
      else params.delete("obj");
    }
    if (nextTab !== currentTab) {
      changed = true;
      params.set("tab", nextTab);
    }
    if (changed) setSearchParams(params, { replace: true });
  }, [selected?.id, activeTab]);

  // Restore selection/tab from URL (and react to browser navigation)
  useEffect(() => {
    // tab
    const tabParam = searchParams.get("tab");
    const allowedTabs = ["desc", "hw", "tasks", "chat"];
    if (tabParam && allowedTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }

    // object by id
    const objParam = Number(searchParams.get("obj"));
    if (
      objects?.length &&
      objParam &&
      (!selected || selected.id !== objParam)
    ) {
      const found = objects.find((o) => o.id === objParam);
      if (found) {
        // Use handleSelect directly to avoid resetting tab to "desc"
        handleSelect(found);
      }
    }
  }, [searchParams, objects, selected]);

  // Fetch total tasks count for header; keep updated via realtime
  useEffect(() => {
    let isCancelled = false;
    let channel;
    async function fetchCount(objectId) {
      try {
        const { count, error } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("object_id", objectId);
        if (!isCancelled) {
          if (error) throw error;
          setTasksCount(count || 0);
        }
      } catch (err) {
        if (!isCancelled) {
          setTasksCount(0);
          await handleSupabaseError(
            err,
            null,
            "Не удалось получить количество задач",
          );
        }
      }
    }
    if (selected?.id) {
      fetchCount(selected.id);
      channel = supabase
        .channel(`tasks:count:${selected.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "tasks",
            filter: `object_id=eq.${selected.id}`,
          },
          () => setTasksCount((c) => (typeof c === "number" ? c + 1 : 1)),
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "tasks",
            filter: `object_id=eq.${selected.id}`,
          },
          () =>
            setTasksCount((c) =>
              Math.max(0, (typeof c === "number" ? c : 0) - 1),
            ),
        )
        .subscribe();
    } else {
      setTasksCount(0);
    }
    return () => {
      isCancelled = true;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [selected?.id]);

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
            notifications={chatUnread}
          />
        </aside>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-10 flex"
            aria-modal="true"
            role="dialog"
          >
            <div
              className="fixed inset-0 bg-background"
              onClick={toggleSidebar}
            />
            <aside className="relative z-20 w-72 bg-muted p-4 shadow-lg overflow-y-auto transition-transform">
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
                notifications={chatUnread}
              />
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <header className="flex flex-col xs:items-start xs:gap-2 md:flex-row items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                className="md:hidden p-2 text-lg text-blue-600 dark:text-blue-400"
                onClick={toggleSidebar}
              >
                ☰
              </button>
              <Button
                variant="success"
                size="xs"
                className="flex items-center gap-1 px-2 text-sm"
                onClick={addHandler}
              >
                <PlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t("dashboard.add")}</span>
              </Button>
              <div className="hidden md:flex gap-2">
                <Button
                  variant="warning"
                  onClick={() => importInputRef.current?.click()}
                >
                  {t("dashboard.import")}
                </Button>
                <Button variant="info" onClick={exportToFile}>
                  {t("dashboard.export")}
                </Button>
              </div>
              <div className="relative md:hidden">
                <Button
                  variant="outline"
                  size="iconSm"
                  className="p-2"
                  onClick={toggleMenu}
                  aria-label="Меню импорта и экспорта"
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                >
                  ⋮
                </Button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 rounded-md border bg-background shadow-md">
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setIsMenuOpen(false);
                        importInputRef.current?.click();
                      }}
                    >
                      {t("dashboard.import")}
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setIsMenuOpen(false);
                        exportToFile();
                      }}
                    >
                      {t("dashboard.export")}
                    </button>
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept=".csv"
                ref={importInputRef}
                className="hidden"
                onChange={handleImport}
              />
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <ThemeToggle />
              <Button
                className="p-2 text-lg md:text-sm"
                onClick={() => setIsAccountModalOpen(true)}
              >
                {user.user_metadata?.username || t("common.account")}
              </Button>
              <Button
                variant="destructive"
                className="p-2 text-lg md:text-sm"
                onClick={signOut}
              >
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
              tasksCount={tasksCount}
              chatCount={chatCount}
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
