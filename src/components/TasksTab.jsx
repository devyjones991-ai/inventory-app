import { useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import TaskCard from './TaskCard'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'
import { useTasks } from '../hooks/useTasks'

const PAGE_SIZE = 20

function TasksTab({ selected = null }) {
  const objectId = selected?.id || null
  const { fetchTasks: fetchTasksApi } = useTasks()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)
  const controllerRef = useRef(null)

  const fetchTasks = useCallback(
    async (id, offset, controller) => {
      setLoading(true)
      setError(null)
      const { data, error } = await fetchTasksApi(id, offset, PAGE_SIZE)
      if (controller.signal.aborted) return
      if (error) {
        setError(error)
        hasMoreRef.current = false
      } else {
        const tasksData = data || []
        setTasks((prev) => (offset === 0 ? tasksData : [...prev, ...tasksData]))
        hasMoreRef.current = tasksData.length === PAGE_SIZE
      }
      setLoading(false)
    },
    [fetchTasksApi],
  )

  useEffect(() => {
    if (!objectId) return
    const controller = new AbortController()
    controllerRef.current = controller
    pageRef.current = 0
    hasMoreRef.current = true
    setTasks([])
    fetchTasks(objectId, 0, controller)
    return () => controller.abort()
  }, [objectId, fetchTasks])

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || loading) return
    const controller = new AbortController()
    controllerRef.current?.abort()
    controllerRef.current = controller
    const nextPage = pageRef.current + 1
    pageRef.current = nextPage
    fetchTasks(objectId, nextPage * PAGE_SIZE, controller)
  }, [fetchTasks, objectId, loading])

  useEffect(() => () => controllerRef.current?.abort(), [])

  if (!objectId) {
    return <div className="p-6 text-sm text-base-content/70">Выбери объект</div>
  }

  return (
    <div className="p-4 space-y-4">
      {error && (
        <ErrorMessage error={error} message="Не удалось загрузить задачи" />
      )}
      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          item={t}
          onEdit={() => {}}
          onDelete={() => {}}
          onView={() => {}}
        />
      ))}
      {loading && <Spinner />}
      {!loading && hasMoreRef.current && (
        <div className="text-center">
          <button className="btn btn-sm" onClick={loadMore}>
            Загрузить ещё
          </button>
        </div>
      )}
    </div>
  )
}

TasksTab.propTypes = {
  selected: PropTypes.shape({ id: PropTypes.any }),
}

export default TasksTab
