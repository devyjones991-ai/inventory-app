import { memo, useMemo } from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";

function InventorySidebar({
  objects,
  selected = null,
  onSelect,
  onEdit,
  onDelete,
  notifications = {},
}) {
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
        <Card key={o.id}>
          <CardHeader className="p-2">
            <CardTitle className="p-0 text-base font-normal">
              <button
                onClick={o.select}
                className={`w-full text-left px-3 py-2 rounded md:hover:bg-accent/60 md:hover:text-accent-foreground ${
                  selected?.id === o.id
                    ? "bg-accent text-accent-foreground font-medium ring-1 ring-ring"
                    : ""
                }`}
              >
                {o.name}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0 flex items-center">
            {notifications[o.id] ? (
              <Badge variant="destructive">{notifications[o.id]}</Badge>
            ) : null}
            <div className="flex items-center ml-auto">
              <button
                onClick={o.edit}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                title="Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РѕР±СЉРµРєС‚"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={o.remove}
                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                title="РЈРґР°Р»РёС‚СЊ РѕР±СЉРµРєС‚"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </nav>
  );
}

export default memo(InventorySidebar);

InventorySidebar.propTypes = {
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selected: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  notifications: PropTypes.objectOf(PropTypes.number),
};
