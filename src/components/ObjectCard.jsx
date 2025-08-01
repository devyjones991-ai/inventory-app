export default function ObjectCard({ item }) {
  return (
    <div className="p-4 bg-white shadow rounded">
      <h4 className="font-semibold">{item.name}</h4>
      <p className="text-gray-500">{item.description}</p>
    </div>
  )
}
