import { useEffect, useRef, useState } from 'react'
import { useChatMessages } from '../hooks/useChatMessages'

export default function ChatTab({ selected, user }) {
  const { fetchMessages, sendMessage, subscribeToMessages } = useChatMessages()
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    if (!selected?.id) return

    let isMounted = true

    ;(async () => {
      const { data } = await fetchMessages(selected.id)
      if (isMounted && data) setMessages(data)
    })()

    const unsubscribe = subscribeToMessages(selected.id, (payload) => {
      const newMessage = payload.new
      setMessages((prev) => [...prev, newMessage])
    })

    return () => {
      isMounted = false
      unsubscribe && unsubscribe()
    }
  }, [selected, fetchMessages, subscribeToMessages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !fileRef.current?.files[0]) return

    const sender = user?.email || user?.user_metadata?.username
    const file = fileRef.current?.files[0]
    const { data, error } = await sendMessage({
      objectId: selected.id,
      sender,
      content,
      file,
    })
    if (!error && data) {
      setMessages((prev) => [...prev, data])
      setContent('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((msg) => (
          <div key={msg.id} className="p-2 bg-base-200 rounded">
            <div className="text-sm text-gray-500">{msg.sender}</div>
            <div>{msg.content}</div>
            {msg.file_url && (
              <a
                href={msg.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Attachment
              </a>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message"
        />
        <input
          type="file"
          ref={fileRef}
          className="file-input file-input-bordered"
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  )
}
