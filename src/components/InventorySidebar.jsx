import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import Card from './Card'
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
        <Card key={o.id} className="flex items-center justify-between p-2">
          <div className="flex items-center flex-1">
            <button
              onClick={o.select}
              className={`flex-1 text-left px-3 py-2 rounded hover:bg-primary/10 ${
                selected?.id === o.id ? 'bg-primary/10 font-medium' : ''
              }`}
            >
              {o.name}
            </button>
            {notifications[o.id] ? (
              <span className="badge badge-error ml-2">
                {notifications[o.id]}
              </span>
            ) : null}
          </div>
          <>
            <button
              onClick={o.edit}
              className="ml-2 text-primary hover:text-primary/70"
              title="Редактировать объект"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={o.remove}
              className="ml-2 text-red-500 hover:text-red-700"
              title="Удалить объект"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </>
        </Card>
      ))}
    </nav>
  )
}

export default memo(InventorySidebar)

InventorySidebar.propTypes = {
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selected: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  notifications: PropTypes.objectOf(PropTypes.number),
}
