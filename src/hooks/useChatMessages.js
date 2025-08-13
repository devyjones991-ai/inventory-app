import { supabase } from '../supabaseClient'
import { v4 as uuidv4 } from 'uuid'

export function useChatMessages() {
  const fetchMessages = (objectId, { limit = 100, offset = 0 } = {}) =>
    supabase
      .from('chat_messages')
      .select('id, object_id, sender, content, file_url, read_at, created_at')
      .eq('object_id', objectId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: true })

  async function sendMessage({ objectId, sender, content, file }) {
    let fileUrl = null
    if (file) {
      const filePath = `${objectId}/${uuidv4()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file)
      if (uploadError) return { error: uploadError }
      const { data } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath)
      fileUrl = data.publicUrl
    }
    return supabase
      .from('chat_messages')
      .insert([{ object_id: objectId, sender, content, file_url: fileUrl }])
      .select()
      .single()
  }

  const subscribeToMessages = (objectId, handler) => {
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
  }

  const subscribeToAllMessages = (handler) => {
    const channel = supabase
      .channel('chat_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        handler,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  return {
    fetchMessages,
    sendMessage,
    subscribeToMessages,
    subscribeToAllMessages,
  }
}
