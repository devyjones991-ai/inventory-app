import PropTypes from "prop-types";
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import InlineSpinner from "@/components/InlineSpinner.jsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useAccount } from "@/hooks/useAccount";
import { t } from "@/i18n";

export default function AccountModal({
  user,
  onClose,
  onUpdated,
  selectedObject = null,
  members = [],
  availableRoles = [],
  canManageRoles = false,
  onAssignRole = async () => {},
  onRemoveMember = async () => {},
  loadingMembers = false,
}) {
  const [username, setUsername] = useState(user.user_metadata?.username || "");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState({});

  const { updateProfile } = useAccount();

  async function save() {
    setSaving(true);
    const { data, error } = await updateProfile({ username });
    setSaving(false);
    if (error) {
      toast.error("Ошибка обновления: " + error.message);
    } else {
      onUpdated(data.user);
      onClose();
    }
  }

  const permissionLabels = useMemo(
    () => ({
      can_manage_object: t("objects.rolePermissions.manageObject"),
      can_edit_tasks: t("objects.rolePermissions.editTasks"),
      can_manage_hardware: t("objects.rolePermissions.manageHardware"),
      can_manage_chat: t("objects.rolePermissions.manageChat"),
      can_manage_finances: t("objects.rolePermissions.manageFinances"),
      can_manage_roles: t("objects.rolePermissions.manageRoles"),
    }),
    [],
  );

  const roleSummaries = useMemo(() => {
    const map = new Map();
    availableRoles.forEach((role) => {
      const summary = Object.entries(permissionLabels)
        .filter(([key]) => role?.[key])
        .map(([, label]) => label);
      map.set(role.role, summary);
    });
    return map;
  }, [availableRoles, permissionLabels]);

  const handleAssign = async (memberId, role) => {
    setPending((prev) => ({ ...prev, [memberId]: true }));
    try {
      await onAssignRole(memberId, role);
      toast.success(t("objects.roleUpdated"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("objects.roleUpdateError");
      toast.error(message);
    } finally {
      setPending((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleRemove = async (memberId) => {
    setPending((prev) => ({ ...prev, [memberId]: true }));
    try {
      await onRemoveMember(memberId);
      toast.success(t("objects.roleRemoved"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("objects.roleRemoveError");
      toast.error(message);
    } finally {
      setPending((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const roleOptions = useMemo(
    () => availableRoles.map((role) => role.role),
    [availableRoles],
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование аккаунта</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Никнейм</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          {selectedObject && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {`${t("objects.accessTitle")}: ${selectedObject.name}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {canManageRoles
                      ? t("objects.accessManageHint")
                      : t("objects.accessReadOnly")}
                  </p>
                </div>
              </div>
              {loadingMembers ? (
                <div className="flex justify-center py-4">
                  <InlineSpinner />
                </div>
              ) : members.length ? (
                <ul className="space-y-3">
                  {members.map((member) => {
                    const id = member.user_id;
                    const name =
                      member?.profiles?.full_name?.trim() ||
                      id?.slice(0, 8) ||
                      "—";
                    const summary = roleSummaries.get(member.role) || [];
                    const isPending = Boolean(pending[id]);
                    return (
                      <li
                        key={id}
                        className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium" title={name}>
                            {name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {summary.length
                              ? summary.join(", ")
                              : t("objects.rolePermissions.readOnly")}
                          </p>
                        </div>
                        {canManageRoles ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select
                              value={member.role}
                              onValueChange={(value) => handleAssign(id, value)}
                              disabled={isPending || roleOptions.length === 0}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder={member.role} />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemove(id)}
                              disabled={isPending}
                            >
                              {isPending
                                ? t("objects.roleRemoving")
                                : t("common.delete")}
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="capitalize">
                            {member.role}
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("objects.noMembers")}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

AccountModal.propTypes = {
  user: PropTypes.shape({
    user_metadata: PropTypes.shape({
      username: PropTypes.string,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func.isRequired,
  selectedObject: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  members: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.string,
      role: PropTypes.string,
      profiles: PropTypes.shape({
        full_name: PropTypes.string,
      }),
    }),
  ),
  availableRoles: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.string.isRequired,
      can_manage_object: PropTypes.bool,
      can_edit_tasks: PropTypes.bool,
      can_manage_hardware: PropTypes.bool,
      can_manage_chat: PropTypes.bool,
      can_manage_finances: PropTypes.bool,
      can_manage_roles: PropTypes.bool,
    }),
  ),
  canManageRoles: PropTypes.bool,
  onAssignRole: PropTypes.func,
  onRemoveMember: PropTypes.func,
  loadingMembers: PropTypes.bool,
};
