import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { memo, useMemo } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { t } from "../i18n";
import { Object } from "../types";

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

  return (
    <nav className="flex flex-col space-y-2">
      {items.map((o) => (
        <Card
          key={o.id}
          className={`cursor-pointer transition-colors hover:bg-accent ${
            selected?.id === o.id ? "bg-primary/10 border-primary border-2" : ""
          }`}
          onClick={o.select}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{o.name}</CardTitle>
              {notifications[o.id] > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {notifications[o.id]}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {o.description || "Нет описания"}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    o.edit();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    o.remove();
                  }}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </nav>
  );
}

export default memo(InventorySidebar);
