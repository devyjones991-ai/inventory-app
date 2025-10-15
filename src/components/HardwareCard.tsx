import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import React from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { t } from "../i18n";
import { Hardware, User } from "../types";

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
  user = null 
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
      <CardContent className="flex justify-between items-center">
        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2 text-sm max-sm:text-xs">
          <span>
            {t("hardware.statusPurchasePrefix")}{" "}
            {t(`hardware.statusPurchase.${purchaseKey}`)}
          </span>
          <span>
            {t("hardware.statusInstallPrefix")}{" "}
            {t(`hardware.statusInstall.${installKey}`)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
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
