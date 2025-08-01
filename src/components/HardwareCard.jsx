// src/components/HardwareCard.jsx
import React from 'react';

export default function HardwareCard({ item, onEdit, onDelete }) {
  return (
    <div className="card bg-base-100 shadow p-4 flex justify-between items-center">
      <div>
        <div className="font-medium text-lg">{item.name}</div>
        <div className="text-sm text-gray-500">{item.location}</div>
        <div className="flex space-x-2 mt-1 text-sm">
          <span>Покупка: {item.purchase_status}</span>
          <span>Установка: {item.install_status}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button onClick={onEdit}   className="btn btn-sm btn-outline">Изменить</button>
        <button onClick={onDelete} className="btn btn-sm btn-error">Удалить</button>
      </div>
    </div>
  );
}
