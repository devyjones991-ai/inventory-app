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

import Spinner from "../components/Spinner";
const InventorySidebar = lazy(() => import("../components/InventorySidebar"));
const InventoryTabs = lazy(() => import("../components/InventoryTabs"));
const AccountModal = lazy(() => import("../components/AccountModal"));
const ConfirmModal = lazy(() => import("../components/ConfirmModal"));
const NotificationCenter = lazy(
  () => import("../components/NotificationCenter"),
);
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { useDashboardModals } from "../hooks/useDashboardModals";
import { useObjectList } from "../hooks/useObjectList";
import { useObjectNotifications } from "../hooks/useObjectNotifications";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { Object as ObjectType } from "../types";
import "../assets/space-theme.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const { signOut } = useSupabaseAuth();
  // Active tab is derived from URL (single source of truth)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    objects,
    selected,
    fetchError,
    isEmpty,
    handleSelect,
    saveObject,
    updateObjectName,
    updateObjectDescription,
    deleteObject,
    importFromFile,
    exportToFile,
  } = useObjectList() as {
    objects: ObjectType[];
    selected: ObjectType | null;
    fetchError: string | null;
    isEmpty: boolean;
    handleSelect: (obj: ObjectType) => void;
    saveObject: (
      name: string,
      description: string,
      obj: ObjectType | null,
    ) => Promise<boolean>;
    updateObjectName: (id: string | number, name: string) => Promise<boolean>;
    updateObjectDescription: (
      id: string | number,
      description: string,
    ) => Promise<boolean>;
    deleteObject: (id: string) => Promise<boolean>;
    importFromFile: (file: File) => Promise<void>;
    exportToFile: () => Promise<void>;
  };

  const allowedTabs = ["desc", "hw", "tasks", "chat"];
  const tabParam = searchParams.get("tab");
  const activeTab = allowedTabs.includes(tabParam || "")
    ? (tabParam as string)
    : "desc";
  const { chatUnread, hardwareUnread, clearNotifications } =
    useObjectNotifications(selected, activeTab, user);
  const chatCount = selected?.id ? chatUnread[selected.id] || 0 : 0;
  const hardwareCount = selected?.id ? hardwareUnread[selected.id] || 0 : 0;

  const {
    isObjectModalOpen,
    objectName,
    setObjectName,
    objectDescription,
    setObjectDescription,
    editingObject,
    deleteCandidate,
    setDeleteCandidate,
    isAccountModalOpen,
    setIsAccountModalOpen,
    openAddModal,
    openEditModal,
    closeObjectModal,
  } = useDashboardModals() as {
    isObjectModalOpen: boolean;
    objectName: string;
    setObjectName: (name: string) => void;
    objectDescription: string;
    setObjectDescription: (desc: string) => void;
    editingObject: ObjectType | null;
    deleteCandidate: string | null;
    setDeleteCandidate: (id: string | null) => void;
    isAccountModalOpen: boolean;
    setIsAccountModalOpen: (isOpen: boolean) => void;
    openAddModal: () => void;
    openEditModal: (obj: ObjectType) => void;
    closeObjectModal: () => void;
  };

  const [addHandler] = useState(() => openAddModal);

  const importInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = useCallback(
    () => setIsMenuOpen((prev: boolean) => !prev),
    [],
  );

  const toggleSidebar = () => setIsSidebarOpen((prev: boolean) => !prev);

  // Отладка: отслеживание изменений isObjectModalOpen
  useEffect(() => {
    console.log("isObjectModalOpen changed to:", isObjectModalOpen);
  }, [isObjectModalOpen]);

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

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const onSelect = (obj: ObjectType) => {
    handleSelect(obj);
    clearNotifications(obj.id);
    // sync URL: set obj and reset tab to desc
    const params = new URLSearchParams(searchParams);
    params.set("obj", String(obj.id));
    params.set("tab", "desc");
    setSearchParams(params, { replace: true });
    setIsSidebarOpen(false);
  };

  const onTabChange = useCallback(
    (tab: string) => {
      // update URL only if actually changed
      const current = searchParams.get("tab") || "desc";
      if (current !== tab) {
        const params = new URLSearchParams(searchParams);
        params.set("tab", tab);
        setSearchParams(params, { replace: true });
      }
      if ((tab === "tasks" || tab === "chat" || tab === "hw") && selected) {
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
      const found = objects.find((o: ObjectType) => String(o.id) === objParam);
      if (found) {
        // Use handleSelect directly to avoid resetting tab to "desc"
        handleSelect(found);
      }
    }
  }, [searchParams, objects, selected, handleSelect]);

  const onSaveObject = async () => {
    if (editingObject) {
      // При редактировании из сайдбара обновляем только название
      const ok = await updateObjectName(editingObject.id, objectName);
      if (ok) closeObjectModal();
    } else {
      // При создании нового объекта сохраняем название и описание
      const ok = await saveObject(objectName, objectDescription, editingObject);
      if (ok) closeObjectModal();
    }
  };

  const onConfirmDelete = async () => {
    if (deleteCandidate) {
      const ok = await deleteObject(deleteCandidate);
      if (ok) setDeleteCandidate(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Permission check removed - relying on RLS
  const isSuperUser = true; // user?.email === "devyjones991@gmail.com";

  return (
    <>
      {!selected && isEmpty ? (
        <div className="flex w-full min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-gray-500 text-lg">Нет объектов</p>
            <Button
              onClick={() => {
                console.log("Button clicked, calling openAddModal");
                openAddModal();
                console.log(
                  "After openAddModal, isObjectModalOpen:",
                  isObjectModalOpen,
                );
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              ➕ Создать первый объект
            </Button>
          </div>
        </div>
      ) : !selected ? (
        <div className="flex w-full min-h-screen items-center justify-center bg-background text-gray-500">
          Выберите объект...
        </div>
      ) : (
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
                currentUserEmail={user?.email}
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
                    currentUserEmail={user?.email}
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
                  aria-label="Открыть"
                >
                  <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                {isSuperUser && (
                  <Button
                    variant="success"
                    size="sm"
                    className="flex items-center gap-1 px-1.5 sm:px-2 text-xs sm:text-sm h-7 sm:h-8"
                    onClick={addHandler}
                    type="button"
                  >
                    <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Добавить</span>
                  </Button>
                )}
                {isSuperUser && (
                  <div className="hidden md:flex gap-2">
                    <Button
                      variant="warning"
                      onClick={() => importInputRef.current?.click()}
                      type="button"
                    >
                      Импорт
                    </Button>
                    <Button variant="info" onClick={exportToFile} type="button">
                      Экспорт
                    </Button>
                  </div>
                )}
                {isSuperUser && (
                  <div className="relative md:hidden" ref={menuRef}>
                    <Button
                      variant="outline"
                      size="icon"
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
                          Импорт
                        </button>
                        <button
                          type="button"
                          className="block w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setIsMenuOpen(false);
                            exportToFile();
                          }}
                        >
                          Экспорт
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                <Button
                  className="p-2 text-sm md:text-base"
                  onClick={() => setIsAccountModalOpen(true)}
                  type="button"
                >
                  {user.user_metadata?.username || "Аккаунт"}
                </Button>
                <Button
                  variant="destructive"
                  className="p-2 text-sm md:text-base"
                  onClick={signOut}
                  type="button"
                >
                  Выйти
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-2 sm:p-4">
              <Suspense fallback={<Spinner />}>
                <InventoryTabs
                  selected={selected}
                  userEmail={user?.email || ""}
                  chatCount={chatCount}
                  tasksCount={0}
                  hardwareCount={hardwareCount}
                  onTabChange={onTabChange}
                  onEdit={openEditModal}
                  onUpdateDescription={updateObjectDescription}
                />
              </Suspense>
            </div>
            <footer className="p-2 text-center text-xs text-gray-400 border-t bg-background">
              v0.1.1 ({new Date().toLocaleDateString()})
            </footer>
          </div>
        </div>
      )}

      <Dialog
        open={isObjectModalOpen}
        onOpenChange={(isOpen: boolean) => {
          console.log(
            "Dialog onOpenChange:",
            isOpen,
            "isObjectModalOpen:",
            isObjectModalOpen,
          );
          if (!isOpen) {
            closeObjectModal();
          }
        }}
      >
        <DialogContent
          draggable
          className="w-full max-w-md space-modal space-fade-in"
        >
          <Button
            size="icon"
            type="button"
            className="absolute right-2 top-2 space-button"
            onClick={closeObjectModal}
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
          <DialogHeader data-dialog-handle className="space-modal-header">
            <DialogTitle className="text-white text-xl font-bold">
              {editingObject ? "✏️ Редактировать объект" : "➕ Добавить объект"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            {editingObject ? (
              // При редактировании показываем только название (для сайдбара)
              <div className="space-y-2">
                <label className="text-space-text font-semibold">
                  📦 Название объекта
                </label>
                <Input
                  type="text"
                  className="w-full space-input"
                  placeholder="Введите название объекта..."
                  value={objectName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setObjectName(e.target.value)
                  }
                />
              </div>
            ) : (
              // При создании показываем название и описание
              <>
                <div className="space-y-2">
                  <label className="text-space-text font-semibold">
                    📦 Название объекта
                  </label>
                  <Input
                    type="text"
                    className="w-full space-input"
                    placeholder="Введите название объекта..."
                    value={objectName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setObjectName(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-space-text font-semibold">
                    📄 Описание объекта
                  </label>
                  <Textarea
                    className="w-full space-input"
                    placeholder="Введите описание объекта..."
                    value={objectDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setObjectDescription(e.target.value)
                    }
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex space-x-2 pt-6">
            <Button
              onClick={onSaveObject}
              className="space-button space-active"
            >
              💾 Сохранить
            </Button>
            <Button
              variant="ghost"
              onClick={closeObjectModal}
              className="space-button"
            >
              ❌ Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Suspense fallback={<Spinner />}>
        <ConfirmModal
          open={!!deleteCandidate}
          title="Удалить объект?"
          confirmLabel={
            <>
              <TrashIcon className="w-4 h-4" /> Удалить
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
    </>
  );
}
