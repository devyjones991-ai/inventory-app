// src/components/HardwareCard.jsx
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";

export default function HardwareCard({ item, onEdit, onDelete, user = null }) {
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
            {t(
              `hardware.statuses.purchase.${item.purchase_status || "unknown"}`,
            )}
          </span>
          <span>
            {t("hardware.statusInstallPrefix")}{" "}
            {t(`hardware.statuses.install.${item.install_status || "unknown"}`)}
          </span>
        </div>

        {!!user && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="flex items-center gap-1 w-full sm:w-auto text-blue-600 dark:text-blue-400"
            >
              <PencilIcon className="w-4 h-4" />
              {t("common.edit")}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              <TrashIcon className="w-4 h-4" />
              {t("common.delete")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

HardwareCard.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    location: PropTypes.string,
    purchase_status: PropTypes.string.isRequired,
    install_status: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string,
  }),
};
