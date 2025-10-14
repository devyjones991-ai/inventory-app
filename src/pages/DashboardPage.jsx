import {
  Bars3Icon,
  EllipsisVerticalIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
  lazy,
} from "react";
import { Navigate, useSearchParams } from "react-router-dom";

import Spinner from "@/components/Spinner";
const InventorySidebar = lazy(() => import("@/components/InventorySidebar"));
const InventoryTabs = lazy(() => import("@/components/InventoryTabs"));
const AccountModal = lazy(() => import("@/components/AccountModal"));
const ConfirmModal = lazy(() => import("@/components/ConfirmModal"));
const NotificationCenter = lazy(
  () => import("@/components/NotificationCenter"),
);
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardModals } from "@/hooks/useDashboardModals";
import { useObjectList } from "@/hooks/useObjectList";
import { useObjectNotifications } from "@/hooks/useObjectNotifications";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { t } from "@/i18n";
import { supabase } from "@/supabaseClient";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

export default function DashboardPage() {
  const { user } = useAuth();
  const { signOut } = useSupabaseAuth();
  // Active tab is derived from URL (single source of truth)
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

  const allowedTabs = ["desc", "hw", "tasks", "chat"];
  const tabParam = searchParams.get("tab");
  const activeTab = allowedTabs.includes(tabParam) ? tabParam : "desc";
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
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);

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

  // Закрытие меню по клику вне его области или при нажатии Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const onSelect = (obj) => {
    handleSelect(obj);
    clearNotifications(obj.id);
    // sync URL: set obj and reset tab to desc
    const params = new URLSearchParams(searchParams);
    params.set("obj", String(obj.id));
    params.set("tab", "desc");
    setSearchParams(params, { replace: true });
    setIsSidebarOpen(false);
  };

  const onUpdateSelected = (updated) => {
    handleUpdateSelected(updated);
    clearNotifications(updated.id);
  };

  const onTabChange = useCallback(
    (tab) => {
      // update URL only if actually changed
      const current = searchParams.get("tab") || "desc";
      if (current !== tab) {
        const params = new URLSearchParams(searchParams);
        params.set("tab", tab);
        setSearchParams(params, { replace: true });
      }
      if ((tab === "tasks" || tab === "chat") && selected) {
        clearNotifications(selected.id);
      }
    },
    [searchParams, setSearchParams, selected, clearNotifications],
  );

  // URL is updated explicitly in handlers; no syncing effect to avoid loops

  // Restore selection from URL (and react to browser navigation)
  useEffect(() => {
    // object by id
    const objParam = searchParams.get("obj");
    if (
      objects?.length &&
      objParam &&
      (!selected || String(selected.id) !== objParam)
    ) {
      const found = objects.find((o) => String(o.id) === objParam);
      if (found) {
        // Use handleSelect directly to avoid resetting tab to "desc"
        handleSelect(found);
      }
    }
  }, [searchParams, objects, selected, handleSelect]);

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

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isSidebarOpen) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [isSidebarOpen]);

  if (!user) return <Navigate to="/auth" replace />;

  if (fetchError) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-background text-destructive">
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
      <div className="flex min-h-screen bg-background">
        <aside className="hidden md:flex flex-col w-72 bg-muted p-4 border-r shadow-lg overflow-y-auto">
          <Suspense fallback={<Spinner />}>
            <InventorySidebar
              objects={objects}
              selected={selected}
              onSelect={onSelect}
              onEdit={openEditModal}
              onDelete={setDeleteCandidate}
              notifications={chatUnread}
            />
          </Suspense>
        </aside>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-10 flex"
            aria-modal="true"
            role="dialog"
          >
            <div
              className="fixed inset-0 bg-black animate-in fade-in-0"
              onClick={toggleSidebar}
            />
            <aside className="relative z-20 w-72 max-w-[85vw] bg-background p-4 shadow-lg overflow-y-auto transform duration-200 ease-out animate-in slide-in-from-left">
              <Button
                size="icon"
                type="button"
                className="absolute right-2 top-2 bg-background/90"
                onClick={toggleSidebar}
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
              <Suspense fallback={<Spinner />}>
                <InventorySidebar
                  objects={objects}
                  selected={selected}
                  onSelect={onSelect}
                  onEdit={openEditModal}
                  onDelete={setDeleteCandidate}
                  notifications={chatUnread}
                />
              </Suspense>
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <header className="flex flex-row items-center justify-between gap-2 p-2 sm:p-3 md:p-4 border-b bg-background">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto overflow-y-visible whitespace-nowrap">
              <button
                className="md:hidden p-1.5 sm:p-2 text-blue-600 dark:text-blue-400"
                onClick={toggleSidebar}
                type="button"
                aria-label={t("common.open")}
              >
                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <Button
                variant="success"
                size="xs"
                className="flex items-center gap-1 px-1.5 sm:px-2 text-xs sm:text-sm h-7 sm:h-8"
                onClick={addHandler}
                type="button"
              >
                <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t("dashboard.add")}</span>
              </Button>
              <div className="hidden md:flex gap-2">
                <Button
                  variant="warning"
                  onClick={() => importInputRef.current?.click()}
                  type="button"
                >
                  {t("dashboard.import")}
                </Button>
                <Button variant="info" onClick={exportToFile} type="button">
                  {t("dashboard.export")}
                </Button>
              </div>
              <div className="relative md:hidden" ref={menuRef}>
                <Button
                  variant="outline"
                  size="iconSm"
                  className="p-2"
                  onClick={toggleMenu}
                  aria-label="More"
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-36 z-50 rounded-md border bg-background shadow-lg ring-1 ring-border">
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setIsMenuOpen(false);
                        importInputRef.current?.click();
                      }}
                    >
                      {t("dashboard.import")}
                    </button>
                    <button
                      type="button"
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
              <Suspense fallback={<div className="w-8 h-8" />}>
                <NotificationCenter />
              </Suspense>
              <ThemeToggle />
              <Button
                className="p-2 text-sm md:text-base"
                onClick={() => setIsAccountModalOpen(true)}
                type="button"
              >
                {user.user_metadata?.username || t("common.account")}
              </Button>
              <Button
                variant="destructive"
                className="p-2 text-sm md:text-base"
                onClick={signOut}
                type="button"
              >
                {t("common.logout")}
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-2 sm:p-4">
            <Suspense fallback={<Spinner />}>
              <InventoryTabs
                selected={selected}
                onUpdateSelected={onUpdateSelected}
                onTabChange={onTabChange}
                activeTab={activeTab}
                registerAddHandler={registerAddHandler}
                tasksCount={tasksCount}
                chatCount={chatCount}
              />
            </Suspense>
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
              type="button"
              className="absolute right-2 top-2 bg-background/90"
              onClick={closeObjectModal}
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
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

        <Suspense fallback={<Spinner />}>
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
        </Suspense>

        {isAccountModalOpen && (
          <Suspense fallback={<Spinner />}>
            <AccountModal
              user={user}
              onClose={() => setIsAccountModalOpen(false)}
              onUpdated={() => {}}
            />
          </Suspense>
        )}
      </div>
    </>
  );
}
