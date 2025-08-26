// src/components/HardwareCard.jsx
import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

export default function HardwareCard({ item, onEdit, onDelete, user = null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <div className="text-sm text-muted-foreground">{item.location}</div>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <div className="flex space-x-2 mt-1 text-sm">
          <span>Покупка: {item.purchase_status}</span>
          <span>Установка: {item.install_status}</span>
        </div>

        {!!user && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              <PencilIcon className="w-4 h-4" />
              Изменить
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              <TrashIcon className="w-4 h-4" />
              Удалить
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

HardwareCard.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    location: PropTypes.string,
    purchase_status: PropTypes.string.isRequired,
    install_status: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string,
  }),
}
