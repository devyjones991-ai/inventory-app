import {
  ArrowLeftIcon,
  CheckIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import InlineSpinner from "@/components/InlineSpinner";
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
import {
  fetchIntegrationStatus,
  triggerIntegrationRun,
  updateIntegrationSchedule,
} from "@/utils/integrationSync";

const PROVIDERS = [
  { id: "excel", label: "Microsoft Excel" },
  { id: "google_sheets", label: "Google Sheets" },
];

const TABLE_OPTIONS = [
  { id: "tasks", label: "Задачи" },
  { id: "hardware", label: "Оборудование" },
  { id: "financial_transactions", label: "Финансовые операции" },
];

const TABLE_COLUMNS = {
  tasks: [
    { id: "title", label: "Название" },
    { id: "status", label: "Статус" },
    { id: "assignee", label: "Исполнитель" },
    { id: "due_date", label: "Срок" },
    { id: "assigned_at", label: "Дата назначения" },
    { id: "notes", label: "Комментарий" },
    { id: "object_id", label: "ID объекта" },
  ],
  hardware: [
    { id: "name", label: "Название" },
    { id: "location", label: "Локация" },
    { id: "purchase_status", label: "Закупка" },
    { id: "install_status", label: "Монтаж" },
    { id: "object_id", label: "ID объекта" },
    { id: "serial_number", label: "Серийный номер" },
    { id: "inventory_number", label: "Инвентарный номер" },
  ],
  financial_transactions: [
    { id: "amount", label: "Сумма" },
    { id: "transaction_date", label: "Дата" },
    { id: "currency", label: "Валюта" },
    { id: "category", label: "Категория" },
    { id: "description", label: "Описание" },
    { id: "object_id", label: "ID объекта" },
    { id: "external_id", label: "Внешний ID" },
  ],
};

const FREQUENCIES = [
  { id: "manual", label: "Ручной запуск", cron: null },
  { id: "hourly", label: "Каждый час", cron: "0 * * * *" },
  { id: "daily", label: "Ежедневно", cron: null },
  { id: "weekly", label: "Еженедельно", cron: null },
  { id: "custom", label: "Своя cron-строка", cron: null },
];

const WEEKDAYS = [
  { id: "1", label: "Понедельник" },
  { id: "2", label: "Вторник" },
  { id: "3", label: "Среда" },
  { id: "4", label: "Четверг" },
  { id: "5", label: "Пятница" },
  { id: "6", label: "Суббота" },
  { id: "0", label: "Воскресенье" },
];

const STEPS = [
  { id: "provider", title: "Источник данных" },
  { id: "credentials", title: "Доступ" },
  { id: "mapping", title: "Маппинг колонок" },
  { id: "schedule", title: "Расписание" },
];

const DEFAULT_STATE = {
  provider: PROVIDERS[0].id,
  table: TABLE_OPTIONS[0].id,
  credentials: {
    apiKey: "",
    workbookUrl: "",
    worksheetName: "",
    serviceAccount: "",
    spreadsheetId: "",
  },
  mappings: [{ source: "", target: "title" }],
  frequency: FREQUENCIES[0].id,
  time: "09:00",
  weekday: WEEKDAYS[0].id,
  customCron: "",
  timezone: "Europe/Moscow",
};

function mappingsToObject(mappings) {
  return mappings.reduce((acc, item) => {
    if (item.source && item.target) {
      acc[item.source] = item.target;
    }
    return acc;
  }, {});
}

function objectToMappings(columnMapping) {
  if (!columnMapping || typeof columnMapping !== "object") return [];
  return Object.entries(columnMapping).map(([source, target]) => ({
    source,
    target: target,
  }));
}

function buildCron({ frequency, time, weekday, customCron }) {
  if (frequency === "manual") return null;
  if (frequency === "hourly") return "0 * * * *";
  if (frequency === "daily") {
    const [hour, minute] = time.split(":");
    return `${minute || "0"} ${hour || "0"} * * *`;
  }
  if (frequency === "weekly") {
    const [hour, minute] = time.split(":");
    return `${minute || "0"} ${hour || "0"} * * ${weekday || "1"}`;
  }
  if (frequency === "custom") {
    return customCron?.trim() || null;
  }
  return null;
}

function IntegrationWizard({ open, onClose, initialIntegration, onCompleted }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);

  const currentTableColumns = useMemo(
    () => TABLE_COLUMNS[state.table] || [],
    [state.table],
  );

  useEffect(() => {
    setState((prev) => {
      const columns = TABLE_COLUMNS[prev.table] || [];
      const fallback = columns[0]?.id || "";
      let changed = false;
      const adjusted = prev.mappings.map((item) => {
        if (!columns.some((col) => col.id === item.target)) {
          changed = true;
          return { ...item, target: fallback };
        }
        return item;
      });
      return changed ? { ...prev, mappings: adjusted } : prev;
    });
  }, [state.table]);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      const baseState = {
        ...DEFAULT_STATE,
        credentials: { ...DEFAULT_STATE.credentials },
        mappings: [...DEFAULT_STATE.mappings],
      };
      if (initialIntegration) {
        const mappings = objectToMappings(initialIntegration.column_mapping);
        setState({
          ...baseState,
          provider: initialIntegration.provider || baseState.provider,
          table: initialIntegration.table_name || baseState.table,
          mappings: mappings.length ? mappings : baseState.mappings,
          frequency:
            initialIntegration.schedule_frequency || baseState.frequency,
          time: initialIntegration.details?.time || baseState.time,
          weekday: initialIntegration.details?.weekday || baseState.weekday,
          customCron: initialIntegration.schedule_cron || baseState.customCron,
          timezone: initialIntegration.timezone || baseState.timezone,
        });
      } else {
        setState(baseState);
      }
      (async () => {
        try {
          setStatusLoading(true);
          const statuses = await fetchIntegrationStatus();
          setStatusList(statuses);
        } catch (err) {
          toast.error(err.message);
        } finally {
          setStatusLoading(false);
        }
      })();
    }
  }, [open, initialIntegration]);

  const addMappingRow = () => {
    setState((prev) => ({
      ...prev,
      mappings: [
        ...prev.mappings,
        { source: "", target: currentTableColumns[0]?.id || "" },
      ],
    }));
  };

  const updateMappingRow = (index, patch) => {
    setState((prev) => ({
      ...prev,
      mappings: prev.mappings.map((item, idx) =>
        idx === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeMappingRow = (index) => {
    setState((prev) => ({
      ...prev,
      mappings: prev.mappings.filter((_, idx) => idx !== index),
    }));
  };

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex((prev) => prev - 1);
  };

  const handleSave = async () => {
    const columnMapping = mappingsToObject(state.mappings);
    if (!Object.keys(columnMapping).length) {
      toast.error("Добавьте хотя бы одно соответствие колонок");
      return;
    }
    const cron = buildCron(state);
    if (state.frequency === "custom" && !cron) {
      toast.error("Укажите cron-строку");
      return;
    }
    setSaving(true);
    try {
      const integrationId = `${state.provider}_${state.table}`;
      const payload = {
        integration: integrationId,
        provider: state.provider,
        table: state.table,
        columnMapping,
        frequency: state.frequency,
        scheduleCron: cron,
        timezone: state.timezone,
        details: {
          credentials: state.credentials,
          weekday: state.weekday,
          time: state.time,
        },
      };
      await updateIntegrationSchedule(payload);
      toast.success("Интеграция сохранена");
      onCompleted?.(payload);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncLoading(true);
    try {
      const integrationId = `${state.provider}_${state.table}`;
      await triggerIntegrationRun({
        integration: integrationId,
        direction: "bidirectional",
      });
      toast.success("Синхронизация запущена");
      const statuses = await fetchIntegrationStatus();
      setStatusList(statuses);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const renderStep = () => {
    if (statusLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <InlineSpinner size={32} />
        </div>
      );
    }
    if (stepIndex === 0) {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Выберите систему
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() =>
                    setState((prev) => ({ ...prev, provider: provider.id }))
                  }
                  className={`rounded border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary ${
                    state.provider === provider.id
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <div className="font-semibold">{provider.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {provider.id === "excel"
                      ? "Импорт/экспорт Excel через Microsoft Graph"
                      : "Google Sheets API / сервисный аккаунт"}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Таблица в Supabase
            </p>
            <Select
              value={state.table}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, table: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите таблицу" />
              </SelectTrigger>
              <SelectContent>
                {TABLE_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    if (stepIndex === 1) {
      const isExcel = state.provider === "excel";
      return (
        <div className="space-y-4">
          {isExcel ? (
            <>
              <Input
                value={state.credentials.workbookUrl}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    credentials: {
                      ...prev.credentials,
                      workbookUrl: e.target.value,
                    },
                  }))
                }
                placeholder="URL книги Excel"
                aria-label="URL книги Excel"
              />
              <Input
                value={state.credentials.worksheetName}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    credentials: {
                      ...prev.credentials,
                      worksheetName: e.target.value,
                    },
                  }))
                }
                placeholder="Лист / диапазон"
                aria-label="Лист Excel"
              />
              <Input
                value={state.credentials.apiKey}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    credentials: {
                      ...prev.credentials,
                      apiKey: e.target.value,
                    },
                  }))
                }
                placeholder="API ключ Microsoft"
                aria-label="API ключ"
              />
            </>
          ) : (
            <>
              <Input
                value={state.credentials.spreadsheetId}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    credentials: {
                      ...prev.credentials,
                      spreadsheetId: e.target.value,
                    },
                  }))
                }
                placeholder="ID таблицы Google"
                aria-label="ID таблицы"
              />
              <Input
                value={state.credentials.worksheetName}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    credentials: {
                      ...prev.credentials,
                      worksheetName: e.target.value,
                    },
                  }))
                }
                placeholder="Лист / диапазон"
                aria-label="Лист"
              />
              <Input
                value={state.credentials.serviceAccount}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    credentials: {
                      ...prev.credentials,
                      serviceAccount: e.target.value,
                    },
                  }))
                }
                placeholder="JSON сервисного аккаунта"
                aria-label="Сервисный аккаунт"
              />
            </>
          )}
        </div>
      );
    }
    if (stepIndex === 2) {
      return (
        <div className="space-y-3">
          {state.mappings.map((item, index) => (
            <div
              key={`mapping-${index}`}
              className="flex flex-col sm:flex-row sm:items-center gap-2"
            >
              <Input
                value={item.source}
                onChange={(e) =>
                  updateMappingRow(index, { source: e.target.value })
                }
                placeholder="Колонка источника"
              />
              <Select
                value={item.target}
                onValueChange={(value) =>
                  updateMappingRow(index, { target: value })
                }
              >
                <SelectTrigger className="w-full sm:w-60">
                  <SelectValue placeholder="Колонка в Supabase" />
                </SelectTrigger>
                <SelectContent>
                  {currentTableColumns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                onClick={() => removeMappingRow(index)}
                aria-label="Удалить соответствие"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={addMappingRow}
          >
            <PlusIcon className="w-4 h-4 mr-2" /> Добавить строку
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Select
          value={state.frequency}
          onValueChange={(value) =>
            setState((prev) => ({ ...prev, frequency: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Частота синхронизации" />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCIES.map((freq) => (
              <SelectItem key={freq.id} value={freq.id}>
                {freq.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(state.frequency === "daily" || state.frequency === "weekly") && (
          <Input
            value={state.time}
            onChange={(e) =>
              setState((prev) => ({ ...prev, time: e.target.value }))
            }
            placeholder="Время (HH:MM)"
          />
        )}
        {state.frequency === "weekly" && (
          <Select
            value={state.weekday}
            onValueChange={(value) =>
              setState((prev) => ({ ...prev, weekday: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="День недели" />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {state.frequency === "custom" && (
          <Input
            value={state.customCron}
            onChange={(e) =>
              setState((prev) => ({ ...prev, customCron: e.target.value }))
            }
            placeholder="* * * * *"
            aria-label="Cron"
          />
        )}
        <Input
          value={state.timezone}
          onChange={(e) =>
            setState((prev) => ({ ...prev, timezone: e.target.value }))
          }
          placeholder="Часовой пояс (IANA)"
        />
        <div className="rounded border p-3 text-sm text-muted-foreground">
          <div>
            Последний успешный обмен:
            {(() => {
              const integrationId = `${state.provider}_${state.table}`;
              const info = statusList.find(
                (item) => item.integration === integrationId,
              );
              return info?.last_success_at
                ? ` ${new Date(info.last_success_at).toLocaleString("ru-RU")}`
                : " —";
            })()}
          </div>
          <div className="mt-1">
            Текущее состояние:
            {(() => {
              const integrationId = `${state.provider}_${state.table}`;
              const info = statusList.find(
                (item) => item.integration === integrationId,
              );
              return info?.status ? ` ${info.status}` : " нет данных";
            })()}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleTriggerSync}
          disabled={syncLoading}
        >
          {syncLoading ? (
            <InlineSpinner size={16} />
          ) : (
            <PlayIcon className="w-4 h-4 mr-2" />
          )}
          {syncLoading ? "Запуск..." : "Запустить синхронизацию"}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Мастер интеграции</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-1 ${
                    index === stepIndex ? "text-primary" : ""
                  }`}
                >
                  {index < stepIndex ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <span className="inline-flex w-5 h-5 items-center justify-center rounded-full border">
                      {index + 1}
                    </span>
                  )}
                  <span>{step.title}</span>
                </div>
                {index !== STEPS.length - 1 && (
                  <span className="opacity-50">/</span>
                )}
              </React.Fragment>
            ))}
          </div>
          {renderStep()}
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrev}
              disabled={stepIndex === 0}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" /> Назад
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
          {stepIndex === STEPS.length - 1 ? (
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? <InlineSpinner size={16} /> : null}
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Далее
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

IntegrationWizard.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  initialIntegration: PropTypes.shape({
    integration: PropTypes.string,
    provider: PropTypes.string,
    table_name: PropTypes.string,
    schedule_frequency: PropTypes.string,
    schedule_cron: PropTypes.string,
    timezone: PropTypes.string,
    column_mapping: PropTypes.object,
    details: PropTypes.object,
    last_success_at: PropTypes.string,
    status: PropTypes.string,
  }),
  onCompleted: PropTypes.func,
};

IntegrationWizard.defaultProps = {
  open: false,
  onClose: () => {},
  initialIntegration: null,
  onCompleted: null,
};

export default IntegrationWizard;
