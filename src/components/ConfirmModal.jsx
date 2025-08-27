import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export default function ConfirmModal({
  open = false,
  title = '',
  message = '',
  confirmLabel = 'OK',
  cancelLabel = 'Отмена',
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel()
        }
      }}
    >
      <DialogContent>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {message && <p>{message}</p>}
        <DialogFooter>
          <Button autoFocus variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

ConfirmModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmLabel: PropTypes.node,
  cancelLabel: PropTypes.node,
  confirmVariant: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}
