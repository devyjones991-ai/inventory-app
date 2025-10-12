import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import { memo, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";

function InventorySidebar({
  objects,
  selected = null,
  onSelect,
  onEdit,
  onDelete,
  notifications = {},
  members = [],
  canManageObject = false,
  canManageRoles = false,
  onManageAccess = () => {},
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

  const memberList = useMemo(
    () =>
      (members || []).map((member) => ({
        id: member.user_id,
        name:
          member?.profiles?.full_name?.trim() ||
          member.user_id?.slice(0, 8) ||
          "—",
        role: member.role,
      })),
    [members],
  );

  const list = (
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
            {canManageObject && (
              <div className="flex items-center ml-auto">
                <button
                  onClick={o.edit}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  title={t("objects.edit")}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={o.remove}
                  className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  title={t("objects.delete")}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </nav>
  );

  return (
    <div className="space-y-4">
      {list}
      {selected && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("objects.members")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3 text-sm">
            {memberList.length ? (
              <ul className="space-y-2">
                {memberList.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate" title={member.name}>
                      {member.name}
                    </span>
                    <Badge variant="secondary" className="capitalize">
                      {member.role}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-foreground/70">{t("objects.noMembers")}</p>
            )}
            {canManageRoles && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={onManageAccess}
              >
                {t("objects.manageAccess")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
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
  members: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.string,
      role: PropTypes.string,
      profiles: PropTypes.shape({
        full_name: PropTypes.string,
      }),
    }),
  ),
  canManageObject: PropTypes.bool,
  canManageRoles: PropTypes.bool,
  onManageAccess: PropTypes.func,
};
