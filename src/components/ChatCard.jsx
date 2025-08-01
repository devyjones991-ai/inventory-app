export default function ChatCard({ item }) {
  return (
    <div className="p-3 bg-white rounded shadow">
      <div className="font-medium">{item.platform}</div>
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all"
      >
        {item.link}
      </a>
    </div>
  )
}
