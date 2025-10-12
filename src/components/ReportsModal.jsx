import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REPORT_FORMATS,
  REPORT_TYPES,
  downloadReport,
} from "@/utils/reportTemplates";

const DEFAULT_TYPES = REPORT_TYPES.map((item) => item.value);

const today = () => {
  const date = new Date();
  return date.toISOString().slice(0, 10);
};

const monthAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
};

export default function ReportsModal({
  open,
  onClose,
  objects,
  defaultObjectId,
  presetTypes,
}) {
  const [objectId, setObjectId] = useState(() =>
    defaultObjectId ? String(defaultObjectId) : "",
  );
  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [selectedTypes, setSelectedTypes] = useState(
    presetTypes?.length ? presetTypes : DEFAULT_TYPES,
  );
  const [format, setFormat] = useState(REPORT_FORMATS[0]?.value ?? "pdf");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setObjectId(defaultObjectId ? String(defaultObjectId) : "");
      setSelectedTypes(presetTypes?.length ? presetTypes : DEFAULT_TYPES);
      setDateFrom(monthAgo());
      setDateTo(today());
      setFormat(REPORT_FORMATS[0]?.value ?? "pdf");
    }
  }, [open, defaultObjectId, presetTypes]);

  const objectOptions = useMemo(
    () =>
      (objects ?? []).map((obj) => ({
        value: String(obj.id),
        label: obj.name || "Без названия",
      })),
    [objects],
  );

  const toggleType = (value) => {
    setSelectedTypes((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!objectId) {
      toast.error("Выберите объект");
      return;
    }
    if (!selectedTypes.length) {
      toast.error("Выберите хотя бы один тип отчёта");
      return;
    }
    if (dateFrom > dateTo) {
      toast.error("Дата начала не может быть позже даты окончания");
      return;
    }
    setLoading(true);
    try {
      const { blob, fileName } = await downloadReport({
        objectId,
        dateFrom,
        dateTo,
        reportTypes: selectedTypes,
        format,
      });
      const downloadName = fileName || `report_${dateFrom}_${dateTo}.${format}`;
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = downloadName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
      toast.success("Отчёт сформирован");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Не удалось сформировать отчёт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !loading && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Формирование отчёта</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="report-object">Объект</Label>
            <Select
              value={objectId || ""}
              onValueChange={setObjectId}
              disabled={!objectOptions.length || loading}
            >
              <SelectTrigger id="report-object">
                <SelectValue placeholder="Выберите объект" />
              </SelectTrigger>
              <SelectContent>
                {objectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-date-from">Дата начала</Label>
              <Input
                id="report-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                max={dateTo}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-date-to">Дата окончания</Label>
              <Input
                id="report-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                min={dateFrom}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Типы отчёта</Label>
            <div className="space-y-2 rounded-md border p-3">
              {REPORT_TYPES.map((item) => {
                const checked = selectedTypes.includes(item.value);
                return (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => toggleType(item.value)}
                      disabled={loading}
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Формат файла</Label>
            <div className="flex flex-wrap gap-4">
              {REPORT_FORMATS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="report-format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={() => setFormat(option.value)}
                    disabled={loading}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Формирование..." : "Сформировать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

ReportsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
    }),
  ),
  defaultObjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  presetTypes: PropTypes.arrayOf(PropTypes.string),
};

ReportsModal.defaultProps = {
  objects: [],
  defaultObjectId: "",
  presetTypes: undefined,
};
