// @ts-nocheck
import { memo, useState } from 'react'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'

function ObjectList({
  objects = [],
  loading = false,
  error = null,
  onItemClick = () => {},
}) {
  const [filter, setFilter] = useState('')

  if (loading) return <Spinner />

  if (error) return <ErrorMessage error={error} />

  const filtered = objects.filter((o) =>
    o.name.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <div>
      <input
        aria-label="Поиск"
        placeholder="Поиск"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p>Нет объектов</p>
      ) : (
        <ul>
          {filtered.map((o) => (
            <li key={o.id}>
              <button onClick={() => onItemClick(o)}>{o.name}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default memo(ObjectList)
