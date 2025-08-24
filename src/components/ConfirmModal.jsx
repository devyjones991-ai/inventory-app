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
  open,
  title = '',
  message = '',
  confirmLabel = 'OK',
  cancelLabel = 'Отмена',
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
}) {
  return (

    <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="modal-box relative w-full max-w-sm">
        {title && <h3 className="font-bold text-lg mb-4">{title}</h3>}
        {message && <p className="mb-4">{message}</p>}
        <div className="modal-action flex space-x-2">
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button onClick={onCancel}>{cancelLabel}</Button>
        </div>
      </div>
    </div>

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
  confirmVariant: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}
