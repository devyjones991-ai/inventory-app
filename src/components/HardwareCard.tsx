import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import React from "react";

import { t } from "../i18n";
import { Hardware, User } from "../types";

import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface HardwareCardProps {
  item: Hardware;
  onEdit: () => void;
  onDelete: () => void;
  user?: User | null;
}

export default function HardwareCard({
  item,
  onEdit,
  onDelete,
  user: _user = null,
}: HardwareCardProps) {
  const normalize = (v: unknown, allowed: string[]) => {
    const s = String(v ?? "").trim();
    return allowed.includes(s) ? s : "unknown";
  };
  const purchaseKey = normalize(item?.purchase_status, ["not_paid", "paid"]);
  const installKey = normalize(item?.install_status, [
    "not_installed",
    "installed",
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <div className="text-sm text-foreground/70">{item.location}</div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 text-sm max-sm:text-xs w-full sm:w-auto min-w-0">
          <span className="whitespace-normal break-all">
            {t("hardware.statusPurchasePrefix")}{" "}
            {t(`hardware.statusPurchase.${purchaseKey}`)}
          </span>
          <span className="whitespace-normal break-all">
            {t("hardware.statusInstallPrefix")}{" "}
            {t(`hardware.statusInstall.${installKey}`)}
          </span>
        </div>
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
            aria-label="Изменить"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
