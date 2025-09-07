import PropTypes from "prop-types";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

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
import { useAccount } from "@/hooks/useAccount";

export default function AccountModal({ user, onClose, onUpdated }) {
  const [username, setUsername] = useState(user.user_metadata?.username || "");
  const [saving, setSaving] = useState(false);

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
};
