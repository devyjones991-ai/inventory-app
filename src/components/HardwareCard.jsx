// src/components/HardwareCard.jsx
import React from 'react'
import Card from './Card'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function HardwareCard({ item, onEdit, onDelete, user = null }) {
  return (
    <Card className="flex justify-between items-center">
      <div>
        <div className="font-medium text-lg">{item.name}</div>
        <div className="text-sm text-base-content/70 transition-colors">
          {item.location}
        </div>
        <div className="flex space-x-2 mt-1 text-sm">
          <span>Покупка: {item.purchase_status}</span>
          <span>Установка: {item.install_status}</span>
        </div>
      </div>
      {!!user && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onEdit}
            className="btn btn-sm btn-outline flex items-center gap-1 w-full sm:w-auto"
          >
            <PencilIcon className="w-4 h-4" />
            Изменить
          </button>
          <button
            onClick={onDelete}
            className="btn btn-sm btn-error flex items-center gap-1 w-full sm:w-auto"
          >
            <TrashIcon className="w-4 h-4" />
            Удалить
          </button>
        </div>
      )}
    </Card>
  )
}
