import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useTranslation } from "react-i18next";

import { Hardware, User } from "../types";

import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface HardwareCardProps {
  item: Hardware;
  onEdit: (item: Hardware) => void;
  onDelete: (id: string) => void;
  onView: (item: Hardware) => void;
}

export default function HardwareCard({
  item,
  onEdit,
  onDelete,
  onView,
}: HardwareCardProps) {
  const { t } = useTranslation();

  const purchaseKey = item.purchase_status === "paid" ? "paid" : "not_paid";
  const installKey =
    item.install_status === "installed" ? "installed" : "not_installed";

  return (
    <Card className="space-card hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-space-text break-words">
              {item.name}
            </CardTitle>
            <div className="text-sm text-space-text-muted mt-1">
              {item.type}
            </div>
          </div>
          {item.location && (
            <div className="text-xs bg-space-bg-light px-2 py-1 rounded border border-space-border text-space-text-muted max-w-[120px] truncate">
              📍 {item.location}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-space-text-muted uppercase font-semibold">
              {t("hardware.statusPurchasePrefix")}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                item.purchase_status === "paid"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {t(`hardware.statusPurchase.${purchaseKey}`)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-space-text-muted uppercase font-semibold">
              {t("hardware.statusInstallPrefix")}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                item.install_status === "installed"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}
            >
              {t(`hardware.statusInstall.${installKey}`)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-space-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(item)}
            className="h-8 px-2 text-space-text hover:text-primary hover:bg-primary/10"
            title="Просмотр"
          >
            👁️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-8 px-2 text-space-text hover:text-yellow-400 hover:bg-yellow-400/10"
            title="Редактировать"
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="h-8 px-2 text-space-text hover:text-red-400 hover:bg-red-400/10"
            title="Удалить"
          >
            🗑️
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
