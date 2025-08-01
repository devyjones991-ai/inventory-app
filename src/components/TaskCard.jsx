export default function TaskCard({ item }) {
  const color = item.status === 'завершено' ? 'text-green-500' : 'text-yellow-500'
  return (
    <div className="p-3 bg-white rounded shadow flex justify-between">
      <div>{item.title}</div>
      <div className={`text-xs ${color}`}>{item.status}</div>
    </div>
  )
}
