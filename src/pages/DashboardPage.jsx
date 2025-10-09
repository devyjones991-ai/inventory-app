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
import { toast } from "react-hot-toast";
import { Navigate, useSearchParams } from "react-router-dom";

import Spinner from "@/components/Spinner";
const InventorySidebar = lazy(() => import("@/components/InventorySidebar"));
const InventoryTabs = lazy(() => import("@/components/InventoryTabs"));
const AccountModal = lazy(() => import("@/components/AccountModal"));
const ConfirmModal = lazy(() => import("@/components/ConfirmModal"));
import ThemeToggle from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    templates,
    selected,
    fetchError,
    isEmpty,
    handleSelect,
    handleUpdateSelected,
    saveObject,
    loadTemplates,
    createFromTemplate,
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

  const [objectModalTab, setObjectModalTab] = useState("manual");
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateObjectName, setTemplateObjectName] = useState("");
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  const selectedTemplate =
    selectedTemplateId && templates?.length
      ? templates.find((tpl) => tpl.id === selectedTemplateId) || null
      : null;

  const resetTemplateState = useCallback(() => {
    setObjectModalTab("manual");
    setTemplatesError(null);
    setTemplatesLoading(false);
    setTemplatesLoaded(false);
    setSelectedTemplateId(null);
    setTemplateObjectName("");
    setIsCreatingFromTemplate(false);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    const { data: list, error } = await loadTemplates();
    if (error) {
      setTemplatesError(error.message || "Ошибка загрузки шаблонов");
    } else {
      setTemplatesError(null);
      if (!selectedTemplateId && list?.length) {
        setSelectedTemplateId(list[0].id);
        setTemplateObjectName((prev) => prev || list[0].name || "");
      }
    }
    setTemplatesLoading(false);
    setTemplatesLoaded(true);
  }, [loadTemplates, selectedTemplateId]);

  const ensureTemplatesLoaded = useCallback(async () => {
    if (templatesLoaded || templatesLoading) return;
    await fetchTemplates();
  }, [templatesLoaded, templatesLoading, fetchTemplates]);

  const handleReloadTemplates = useCallback(async () => {
    await fetchTemplates();
  }, [fetchTemplates]);

  const handleObjectModalTabChange = useCallback(
    async (value) => {
      setObjectModalTab(value);
      if (value === "template") {
        await ensureTemplatesLoaded();
      }
    },
    [ensureTemplatesLoaded],
  );

  const handleSelectTemplate = useCallback((template) => {
    if (!template) return;
    setSelectedTemplateId(template.id);
    setTemplateObjectName((prev) => prev || template.name || "");
  }, []);

  const handleCreateFromTemplate = useCallback(async () => {
    if (!selectedTemplateId) {
      toast.error(t("templates.selectTemplate"));
      return;
    }
    const nameToUse = (
      templateObjectName ||
      selectedTemplate?.name ||
      ""
    ).trim();
    if (!nameToUse) {
      toast.error(t("templates.nameRequired"));
      return;
    }
    setIsCreatingFromTemplate(true);
    const { error } = await createFromTemplate({
      templateId: selectedTemplateId,
      name: nameToUse,
      description: selectedTemplate?.description ?? undefined,
    });
    setIsCreatingFromTemplate(false);
    if (!error) {
      closeObjectModal();
      resetTemplateState();
    }
  }, [
    selectedTemplateId,
    templateObjectName,
    selectedTemplate,
    createFromTemplate,
    closeObjectModal,
    resetTemplateState,
  ]);

  const handleCloseObjectModal = useCallback(() => {
    resetTemplateState();
    closeObjectModal();
  }, [resetTemplateState, closeObjectModal]);

  const resolvePurchaseStatus = useCallback((value) => {
    const key = String(value ?? "unknown");
    const translated = t(`hardware.statuses.purchase.${key}`);
    return translated || key;
  }, []);

  const resolveInstallStatus = useCallback((value) => {
    const key = String(value ?? "unknown");
    const translated = t(`hardware.statuses.install.${key}`);
    return translated || key;
  }, []);

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

  useEffect(() => {
    if (editingObject) {
      setObjectModalTab("manual");
    }
  }, [editingObject]);

  useEffect(() => {
    if (!isObjectModalOpen) {
      resetTemplateState();
    }
  }, [isObjectModalOpen, resetTemplateState]);

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
    if (!editingObject && objectModalTab === "template") {
      await handleCreateFromTemplate();
      return;
    }
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
          <header className="flex flex-row items-center justify-between gap-2 p-3 sm:p-4 border-b bg-background">
            <div className="flex items-center gap-3 md:gap-4 overflow-x-auto overflow-y-visible whitespace-nowrap">
              <button
                className="md:hidden p-2 text-blue-600 dark:text-blue-400"
                onClick={toggleSidebar}
                type="button"
                aria-label={t("common.open")}
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <Button
                variant="success"
                size="xs"
                className="flex items-center gap-1 px-2 text-sm"
                onClick={addHandler}
                type="button"
              >
                <PlusIcon className="w-4 h-4" />
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
                onTemplateCreated={fetchTemplates}
              />
            </Suspense>
          </div>
        </div>

        <Dialog
          open={isObjectModalOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              handleCloseObjectModal();
            }
          }}
        >
          <DialogContent draggable className="w-full max-w-2xl">
            <Button
              size="icon"
              type="button"
              className="absolute right-2 top-2 bg-background/90"
              onClick={handleCloseObjectModal}
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
            <DialogHeader data-dialog-handle>
              <DialogTitle>
                {editingObject ? t("objects.editTitle") : t("objects.addTitle")}
              </DialogTitle>
            </DialogHeader>
            {editingObject ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  className="w-full"
                  placeholder={t("objects.namePlaceholder")}
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                />
              </div>
            ) : (
              <Tabs
                value={objectModalTab}
                onValueChange={handleObjectModalTabChange}
                className="space-y-4"
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="manual">
                    {t("templates.tabs.manual")}
                  </TabsTrigger>
                  <TabsTrigger value="template">
                    {t("templates.tabs.template")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="manual">
                  <div className="space-y-4">
                    <Input
                      type="text"
                      className="w-full"
                      placeholder={t("objects.namePlaceholder")}
                      value={objectName}
                      onChange={(e) => setObjectName(e.target.value)}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="template">
                  <div className="space-y-4">
                    <Input
                      type="text"
                      className="w-full"
                      placeholder={t("templates.objectNamePlaceholder")}
                      value={templateObjectName}
                      onChange={(e) => setTemplateObjectName(e.target.value)}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {t("templates.listTitle")}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReloadTemplates}
                            disabled={templatesLoading}
                          >
                            {t("templates.reload")}
                          </Button>
                        </div>
                        {templatesError && (
                          <div className="text-sm text-destructive">
                            {templatesError}
                          </div>
                        )}
                        {templatesLoading ? (
                          <div className="flex justify-center py-6">
                            <Spinner />
                          </div>
                        ) : null}
                        {!templatesLoading &&
                        !templatesError &&
                        (!templates || templates.length === 0) ? (
                          <p className="text-sm text-muted-foreground">
                            {t("templates.empty")}
                          </p>
                        ) : null}
                        {templates && templates.length > 0 && (
                          <ScrollArea className="h-64 border rounded-md">
                            <div className="divide-y divide-border">
                              {templates.map((template) => {
                                const isActive =
                                  template.id === selectedTemplateId;
                                return (
                                  <button
                                    type="button"
                                    key={template.id}
                                    onClick={() =>
                                      handleSelectTemplate(template)
                                    }
                                    className={`w-full text-left px-3 py-2 transition focus:outline-none ${
                                      isActive
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/40"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-medium line-clamp-1">
                                        {template.name}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {template.owned ? (
                                          <Badge variant="secondary">
                                            {t("templates.ownedBadge")}
                                          </Badge>
                                        ) : null}
                                        {template.isPublic ? (
                                          <Badge>
                                            {t("templates.publicBadge")}
                                          </Badge>
                                        ) : null}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {template.description ||
                                        t("templates.preview.noDescription")}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                      <div className="border rounded-md bg-background/60 p-3">
                        {selectedTemplate ? (
                          <div className="space-y-3 text-sm">
                            <div>
                              <h4 className="text-base font-semibold">
                                {t("templates.preview.title")}
                              </h4>
                              <p className="mt-1 text-muted-foreground">
                                {selectedTemplate.description ||
                                  t("templates.preview.noDescription")}
                              </p>
                            </div>
                            <div>
                              <h5 className="font-semibold">
                                {t("templates.preview.equipment")} (
                                {selectedTemplate.equipment.length})
                              </h5>
                              {selectedTemplate.equipment.length ? (
                                <ul className="mt-2 space-y-2">
                                  {selectedTemplate.equipment.map(
                                    (item, idx) => (
                                      <li
                                        key={`${item.name || "item"}-${idx}`}
                                        className="rounded-md border border-border bg-background px-3 py-2"
                                      >
                                        <div className="text-sm font-medium">
                                          {item.name ||
                                            t(
                                              "templates.preview.unnamedEquipment",
                                            )}
                                        </div>
                                        {item.location ? (
                                          <div className="text-xs text-muted-foreground">
                                            {item.location}
                                          </div>
                                        ) : null}
                                        <div className="text-xs text-muted-foreground">
                                          {t("hardware.statusPurchasePrefix")}{" "}
                                          {resolvePurchaseStatus(
                                            item.purchase_status,
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {t("hardware.statusInstallPrefix")}{" "}
                                          {resolveInstallStatus(
                                            item.install_status,
                                          )}
                                        </div>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {t("templates.preview.emptyEquipment")}
                                </p>
                              )}
                            </div>
                            <div>
                              <h5 className="font-semibold">
                                {t("templates.preview.tasks")} (
                                {selectedTemplate.tasks.length})
                              </h5>
                              {selectedTemplate.tasks.length ? (
                                <ul className="mt-2 space-y-2">
                                  {selectedTemplate.tasks.map((task) => {
                                    const statusKey = task.schema.status
                                      ? `tasks.statuses.${task.schema.status}`
                                      : null;
                                    const statusLabel = statusKey
                                      ? t(statusKey)
                                      : t("templates.preview.noStatus");
                                    return (
                                      <li
                                        key={task.id}
                                        className="rounded-md border border-border bg-background px-3 py-2"
                                      >
                                        <div className="text-sm font-semibold line-clamp-1">
                                          {task.schema.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {statusLabel ||
                                            task.schema.status ||
                                            ""}
                                        </div>
                                        {task.schema.due_date ? (
                                          <div className="text-xs text-muted-foreground">
                                            {t("tasks.form.dueDate")}:{" "}
                                            {task.schema.due_date}
                                          </div>
                                        ) : null}
                                        {task.schema.notes ? (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {task.schema.notes}
                                          </p>
                                        ) : null}
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {t("templates.preview.emptyTasks")}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t("templates.selectTemplate")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
            <DialogFooter className="flex space-x-2">
              {editingObject ? (
                <>
                  <Button onClick={onSaveObject} disabled={!objectName.trim()}>
                    {t("common.save")}
                  </Button>
                  <Button variant="ghost" onClick={handleCloseObjectModal}>
                    {t("common.cancel")}
                  </Button>
                </>
              ) : objectModalTab === "template" ? (
                <>
                  <Button
                    onClick={handleCreateFromTemplate}
                    disabled={isCreatingFromTemplate || !selectedTemplateId}
                  >
                    {isCreatingFromTemplate
                      ? t("templates.creating")
                      : t("templates.createButton")}
                  </Button>
                  <Button variant="ghost" onClick={handleCloseObjectModal}>
                    {t("common.cancel")}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={onSaveObject} disabled={!objectName.trim()}>
                    {t("common.save")}
                  </Button>
                  <Button variant="ghost" onClick={handleCloseObjectModal}>
                    {t("common.cancel")}
                  </Button>
                </>
              )}
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
