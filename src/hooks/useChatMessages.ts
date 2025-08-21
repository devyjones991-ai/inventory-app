// @ts-nocheck
import { useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export function useChatMessages() {
  const navigate = useNavigate()

  const fetchMessages = useCallback(
    async (objectId, { limit, offset, search } = {}) => {
      try {
        let query = supabase
          .from('chat_messages')
          .select('*')
          .eq('object_id', objectId)
          .order('created_at', { ascending: false })

        if (search) {
          query = query.ilike('content', `%${search}%`)
        }

        if (typeof limit === 'number') {
          if (typeof offset === 'number') {
            query = query.range(offset, offset + limit - 1)
          } else {
            query = query.limit(limit)
          }
        }

        const result = await query
        if (result.error) throw result.error
        if (result.data) result.data.reverse()
        return result
      } catch (error) {
        await handleSupabaseError(error, navigate, 'Ошибка загрузки сообщений')
        return { data: null, error }
      }
    },
    [navigate],
  )

  const sendMessage = useCallback(
    async ({ objectId, sender, content, file }) => {
      try {
        let fileUrl = null
        if (file) {
          if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return { error: new Error('Unsupported file type') }
          }
          if (file.size > MAX_FILE_SIZE) {
            return { error: new Error('File too large') }
          }
          const filePath = `${objectId}/${uuidv4()}_${file.name}`
          const { error: uploadError } = await supabase.storage
            .from('chat-files')
            .upload(filePath, file)
          if (uploadError) throw uploadError
          const { data } = supabase.storage
            .from('chat-files')
            .getPublicUrl(filePath)
          fileUrl = data.publicUrl
        }
        const result = await supabase
          .from('chat_messages')
          .insert([{ object_id: objectId, sender, content, file_url: fileUrl }])
          .select()
          .single()
        if (result.error) throw result.error
        return result
      } catch (error) {
        await handleSupabaseError(error, navigate, 'Ошибка отправки сообщения')
        return { data: null, error }
      }
    },
    [navigate],
  )

  const subscribeToMessages = useCallback((objectId, handler) => {
    const channel = supabase
      .channel(`chat_messages_object_${objectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `object_id=eq.${objectId}`,
        },
        handler,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const subscribeToAllMessages = useCallback((handler) => {
    const channel = supabase
      .channel('chat_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        handler,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return useMemo(
    () => ({
      fetchMessages,
      sendMessage,
      subscribeToMessages,
      subscribeToAllMessages,
    }),
    [fetchMessages, sendMessage, subscribeToMessages, subscribeToAllMessages],
  )
}
