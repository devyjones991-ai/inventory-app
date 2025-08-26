import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

function InventorySidebar({
  objects,
  selected = null,
  onSelect,
  onEdit,
  onDelete,
  notifications = {},
}) {
  const items = useMemo(
    () =>
      objects.map((o) => ({
        ...o,
        select: () => onSelect(o),
        edit: () => onEdit(o),
        remove: () => onDelete(o.id),
      })),
    [objects, onSelect, onEdit, onDelete],
  )

  return (
    <nav className="flex flex-col space-y-2">
      {items.map((o) => (
        <Card key={o.id}>
          <CardHeader className="p-2">
            <CardTitle className="p-0 text-base font-normal">
              <button
                onClick={o.select}
                className={`w-full text-left px-3 py-2 rounded hover:bg-primary/10 ${
                  selected?.id === o.id ? 'bg-primary/10 font-medium' : ''
                }`}
              >
                {o.name}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0 flex items-center">
            {notifications[o.id] ? (
              <span className="badge badge-error">{notifications[o.id]}</span>
            ) : null}
            <div className="flex items-center ml-auto">
              <button
                onClick={o.edit}
                className="ml-2 text-primary hover:text-primary/70"
                title="Редактировать объект"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={o.remove}
                className="ml-2 text-destructive hover:text-destructive/80"
                title="Удалить объект"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </nav>
  )
}

export default memo(InventorySidebar)

InventorySidebar.propTypes = {
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selected: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  notifications: PropTypes.objectOf(PropTypes.number),
}