// src/components/HardwareCard.jsx
import React from 'react';
import Card from './Card';
import { Pencil, Trash2 } from 'lucide-react';

export default function HardwareCard({ item, onEdit, onDelete }) {
  return (
    <Card className="flex justify-between items-center">
      <div>
        <div className="font-medium text-lg">{item.name}</div>
        <div className="text-sm text-gray-500">{item.location}</div>
        <div className="flex space-x-2 mt-1 text-sm">
          <span>Покупка: {item.purchase_status}</span>
          <span>Установка: {item.install_status}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button onClick={onEdit} className="btn btn-sm btn-outline flex items-center gap-1">
          <Pencil className="w-4 h-4" />
          Изменить
        </button>
        <button onClick={onDelete} className="btn btn-sm btn-error flex items-center gap-1">
          <Trash2 className="w-4 h-4" />
          Удалить
        </button>
      </div>
    </Card>
  );
}
