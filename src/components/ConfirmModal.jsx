import React from 'react'
import PropTypes from 'prop-types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export default function ConfirmModal({
  open,
  title = '',
  message = '',
  confirmLabel = 'OK',
  cancelLabel = 'Отмена',
  confirmClass = 'btn-error',
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {message && <p>{message}</p>}
        <DialogFooter>
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

ConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmLabel: PropTypes.node,
  cancelLabel: PropTypes.node,
  confirmClass: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}
