import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { linkifyText } from '../utils/linkify';
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import AttachmentPreview from './AttachmentPreview';
import { useChatMessages } from '../hooks/useChatMessages';

export default function ChatTab({ selected, user }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [modalImage, setModalImage] = useState(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isErrorMessages, setIsErrorMessages] = useState(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [messageOffset, setMessageOffset] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const senderName = user.user_metadata?.username || user.email

  const PAGE_SIZE = 20

  // загрузка сообщений
  const loadMessages = async append => {
    if (!selected) return
    setIsLoadingMessages(true)
    setIsErrorMessages(null)
    const from = append ? messageOffset : 0
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('object_id', selected.id)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('Fetch messages error:', error)
      setIsErrorMessages('Ошибка загрузки сообщений')
    } else {
      const fetched = (data || []).reverse()
      setMessages(prev => (append ? [...fetched, ...prev] : fetched))
      setHasMoreMessages((data || []).length === PAGE_SIZE)
      setMessageOffset(from + (data ? data.length : 0))
    }
    setIsLoadingMessages(false)
  }

  const { fetchMessages, subscribeToMessages, sendMessage: sendChatMessage } = useChatMessages()


  // Загрузка и подписка на новые сообщения
  useEffect(() => {
    if (!selected) {
      setMessages([])
      return
    }
    setMessages([])
    setMessageOffset(0)
    setHasMoreMessages(false)
    setIsErrorMessages(null)
    loadMessages(false)


    const objectId = selected.id
    const channel = supabase
      .channel(`chat_messages_object_${objectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `object_id=eq.${objectId}`
        },
        payload => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          setMessageOffset(prev => prev + 1)
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('Chat realtime channel subscribed')
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Chat realtime channel error:', status)
          toast.error('Не удалось подключиться к real-time каналу')
        }

    fetchMessages(objectId).then(({ data, error }) => {
      if (error) console.error('Fetch messages error:', error)
      else setMessages(data || [])
    })

    const unsubscribe = subscribeToMessages(objectId, payload => {
      setMessages(prev => {
        if (prev.some(m => m.id === payload.new.id)) return prev
        return [...prev, payload.new]

      })
    })

    return () => unsubscribe()
  }, [selected])

  // автоскролл вниз
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = scrollRef.current?.parentElement;
      if (container) container.scrollTop = container.scrollHeight;
    }, 0);
    return () => clearTimeout(timer);
  }, [messages])

  // отправка сообщения и файла
  const sendMessage = async () => {
    if (!newMessage.trim() && !file) return


    setSendError(null)
    setIsSending(true)
    let fileUrl = null
    if (file) {
      setUploading(true)
      const filePath = `${selected.id}/${uuidv4()}_${file.name}`
      try {
        const { error: upErr } = await supabase.storage
          .from('chat-files')
          .upload(filePath, file)

        if (upErr) throw upErr

        const { data } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath)
        fileUrl = data.publicUrl
      } catch (err) {
        console.error('Upload error:', err)
        toast.error('Ошибка загрузки файла')
        setUploading(false)
        setIsSending(false)
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      setUploading(false)
    }

    const { data: inserted, error: msgErr } = await supabase
      .from('chat_messages')
      .insert([
        { object_id: selected.id, sender: senderName,  content: newMessage.trim(), file_url: fileUrl }
      ])
      .select()
      .single()

    if (msgErr) {
      console.error('Insert message error:', msgErr)
      setSendError('Не удалось отправить сообщение')
      toast.error('Не удалось отправить сообщение')
    } else if (inserted) {
      setMessages(prev => [...prev, inserted])
      setMessageOffset(prev => prev + 1)
    }

    setIsSending(false)

    setUploading(true)
    const { data: inserted, error } = await sendChatMessage({
      objectId: selected.id,
      sender: senderName,
      content: newMessage.trim(),
      file
    })
    setUploading(false)
    if (error) {
      console.error('Insert message error:', error)
      toast.error('Ошибка отправки сообщения')
    } else if (inserted) {
      setMessages(prev => [...prev, inserted])
    }

    setNewMessage('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const loadMoreMessages = async () => {
    const container = scrollRef.current?.parentElement
    const prevHeight = container?.scrollHeight || 0
    await loadMessages(true)
    if (container) container.scrollTop = container.scrollHeight - prevHeight
  }

  const handleScroll = e => {
    if (e.target.scrollTop === 0 && hasMoreMessages && !isLoadingMessages) {
      loadMoreMessages()
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Сообщения */}
      <div className="flex-1 overflow-auto p-2 bg-gray-100" onScroll={handleScroll}>
        {isErrorMessages && (
          <div className="text-red-500 text-center mt-4">{isErrorMessages}</div>
        )}
        {isLoadingMessages && messages.length === 0 && (
          <div className="flex justify-center mt-4">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
        )}
        {!isLoadingMessages && !isErrorMessages && messages.length === 0 && (
          <div className="text-gray-500 text-center mt-4">
            Нет сообщений. Начните диалог.
          </div>
        )}
        {hasMoreMessages && (
          <button onClick={loadMoreMessages} className="block mx-auto mb-2 text-blue-500">
            Загрузить ещё
          </button>
        )}
        {isLoadingMessages && messages.length > 0 && (
          <div className="flex justify-center mb-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender === senderName;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[60%] break-words p-3 shadow ${
                    isOwn
                      ? 'bg-green-100 text-right rounded-l-lg rounded-t-lg rounded-br-none'
                      : 'bg-white text-left rounded-r-lg rounded-t-lg rounded-bl-none'
                  }`.replace(/\s+/g, ' ')}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.sender} • {new Date(msg.created_at).toLocaleString()}
                  </div>
                  {msg.content && (
                    <div className="whitespace-pre-line break-words mb-1">
                      {linkifyText(msg.content)}
                    </div>
                  )}
                  {msg.file_url && (
                    <AttachmentPreview url={msg.file_url} onImageClick={setModalImage} />
                  )}
                </div>
              </motion.div>
            );
          })}
        <div ref={scrollRef} />
      </div>

      {/* Форма ввода */}
      <div className="p-2 border-t bg-white">
        <div className="flex items-end space-x-2">
          <label className="p-2 cursor-pointer text-gray-500 hover:text-gray-700">
            <PaperClipIcon className="w-6 h-6" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          <textarea
            className="flex-1 border rounded-lg p-2 resize-none"
            rows={2}
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={uploading || isSending}
            className="p-2 bg-green-500 text-white rounded-full disabled:opacity-50"
            aria-label="Send"
          >
            {uploading || isSending ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        {sendError && <div className="text-red-500 text-sm mt-1">{sendError}</div>}
      </div>

      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <button
            aria-label="Close"
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setModalImage(null)}
          >
            ×
          </button>
          <img src={modalImage} alt="preview" className="max-h-full max-w-full" />
        </div>
      )}
    </div>
  )
}
