import React, { useState } from 'react';
import { useAccount } from '../hooks/useAccount';
import { toast } from 'react-hot-toast';

export default function AccountModal({ user, onClose, onUpdated }) {
  const [username, setUsername] = useState(user.user_metadata?.username || '');
  const [saving, setSaving] = useState(false);

  const { updateProfile } = useAccount();

  async function save() {
    setSaving(true);
    const { data, error } = await updateProfile({ username });
    setSaving(false);
    if (error) {
      toast.error('Ошибка обновления: ' + error.message);
    } else {
      onUpdated(data.user);
      onClose();
    }
  }

  return (
    <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="modal-box relative w-full max-w-md">
        <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={onClose}>✕</button>
        <h3 className="font-bold text-lg mb-4">Редактирование аккаунта</h3>
        <div className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Никнейм</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-action flex space-x-2">
          <button className="btn btn-primary" onClick={save} disabled={saving}>Сохранить</button>
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}
