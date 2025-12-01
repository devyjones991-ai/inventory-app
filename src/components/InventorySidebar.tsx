import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { memo, useMemo } from "react";

import { Object } from "../types";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
// import { t } from "../i18n";
import "../assets/notifications-styles.css";
import "../assets/space-theme.css";

interface InventorySidebarProps {
  objects: Object[];
  selected?: Object | null;
  onSelect: (object: Object) => void;
  onEdit: (object: Object) => void;
  onDelete: (objectId: string) => void;
  notifications?: Record<string, number>;
}

function InventorySidebar({
  objects,
  selected = null,
  onSelect,
  onEdit,
  onDelete,
  notifications = {},
}: InventorySidebarProps) {
  const items = useMemo(
    () =>
      objects.map((o) => ({
        ...o,
        select: () => onSelect(o),
        edit: () => onEdit(o),
        remove: () => onDelete(o.id),
      })),
    [objects, onSelect, onEdit, onDelete],
  );

  // Permission check removed - relying on RLS
  const isSuperUser = true; // currentUserEmail === "devyjones991@gmail.com";

  return (
    <nav className="flex flex-col space-y-3 p-4">
      {items.map((o) => (
        <div
          key={o.id}
          className={`space-card cursor-pointer transition-all duration-300 hover:space-active ${
            selected?.id === o.id ? "space-card-selected" : ""
          }`}
          onClick={o.select}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="space-title text-lg font-semibold text-space-text">
                {o.name}
              </h3>
              {notifications[o.id] > 0 && (
                <div className="space-notification-badge">
                  {notifications[o.id]}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end">
              {isSuperUser && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      o.edit();
                    }}
                    className="space-sidebar-button"
                    aria-label="Редактировать объект"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      o.remove();
                    }}
                    className="space-sidebar-button danger"
                    aria-label="Удалить объект"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </nav>
  );
}

export default memo(InventorySidebar);
