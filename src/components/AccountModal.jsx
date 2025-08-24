import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useAccount } from '../hooks/useAccount'
import { toast } from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'


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

    <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto">
        <Button
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </Button>
        <h3 className="font-bold text-lg mb-4">Редактирование аккаунта</h3>

        <div className="space-y-4">
          <div className="form-control">
            <Label className="label">
              <span className="label-text">Никнейм</span>
            </Label>
            <Input
              type="text"
              className="input input-bordered w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <button className="btn btn-primary" onClick={save} disabled={saving}>

        <div className="modal-action flex space-x-2">
          <Button onClick={save} disabled={saving}>

            Сохранить
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Отмена

          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

          </Button>
        </div>
      </div>
    </div>

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
