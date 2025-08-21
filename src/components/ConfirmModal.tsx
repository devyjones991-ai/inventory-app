// @ts-nocheck
import React from 'react'
import PropTypes from 'prop-types'

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
  if (!open) return null
  return (
    <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="modal-box relative w-full max-w-sm">
        {title && <h3 className="font-bold text-lg mb-4">{title}</h3>}
        {message && <p className="mb-4">{message}</p>}
        <div className="modal-action flex space-x-2">
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
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
