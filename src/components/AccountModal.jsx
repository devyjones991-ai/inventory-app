import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useAccount } from '../hooks/useAccount'
import { toast } from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export default function AccountModal({ user, onClose, onUpdated }) {
  const [username, setUsername] = useState(user.user_metadata?.username || '')
  const [saving, setSaving] = useState(false)

  const { updateProfile } = useAccount()

  async function save() {
    setSaving(true)
    const { data, error } = await updateProfile({ username })
    setSaving(false)
    if (error) {
      toast.error('Ошибка обновления: ' + error.message)
    } else {
      onUpdated(data.user)
      onClose()
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование аккаунта</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Никнейм</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            Сохранить
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

AccountModal.propTypes = {
  user: PropTypes.shape({
    user_metadata: PropTypes.shape({
      username: PropTypes.string,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func.isRequired,
}
