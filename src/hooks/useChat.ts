import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "../supabaseClient";
// import { handleSupabaseError } from "../utils/handleSupabaseError";
// import logger from "../utils/logger";
import { ChatMessage } from "../types";

import { useChatMessages } from "./useChatMessages";


interface UseChatParams {
  objectId: string;
  userEmail: string;
  search?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  hasMore: boolean;
  loadMore: (replace?: boolean) => Promise<{ error: any } | undefined>;
  newMessage: string;
  setNewMessage: (message: string) => void;
  sending: boolean;
  file: File | null;
  setFile: (file: File | null) => void;
  filePreview: string | null;
  setFilePreview: (preview: string | null) => void;
  loadError: string | null;
  sendMessage: (content: string, file?: File) => Promise<void>;
  searchMessages: (query: string) => Promise<void>;
  clearSearch: () => void;
  loading: boolean;
  error: string | null;
}

export default function useChat({
  objectId,
  userEmail,
  search: _search,
}: UseChatParams): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<unknown>(null);
  // const loadMoreRef = useRef(() => Promise.resolve());
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const optimisticTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const { fetchMessages, sendMessage: sendMessageUtil } = useChatMessages();
  const LIMIT = 20;

  const offsetRef = useRef(0);
  // const isInitialRender = useRef(true);
  // const activeSearchRef = useRef(search);

  /**
   * Загружает следующую порцию сообщений, используя внутреннее смещение.
   */
  const loadMore = useCallback(
    async (replace = false) => {
      if (!objectId || typeof objectId !== 'string' || objectId.trim() === "" || !supabase) return { error: "No objectId or supabase" };

      try {
        setLoading(true);
        setLoadError(null);

        const offset = replace ? 0 : offsetRef.current;
        const result = await fetchMessages(objectId, { offset, limit: LIMIT });

        if (result.error) {
          setLoadError(result.error.message || "Ошибка загрузки сообщений");
          return { error: result.error };
        }

        const newMessages = result.data || [];
        setMessages((prev) =>
          replace ? newMessages : [...prev, ...newMessages],
        );
        setHasMore(newMessages.length === LIMIT);
        offsetRef.current = offset + newMessages.length;

        return { error: null };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка загрузки";
        setLoadError(errorMessage);
        setError(errorMessage);
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [objectId, fetchMessages],
  );

  const sendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!objectId || typeof objectId !== 'string' || objectId.trim() === "" || !supabase) return;

      try {
        setSending(true);
        setError(null);

        const result = await sendMessageUtil(objectId, content, userEmail, file);
        if (result.error) {
          setError(result.error.message || "Ошибка отправки сообщения");
          return;
        }

        setNewMessage("");
        setFile(null);
        setFilePreview(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка отправки";
        setError(errorMessage);
      } finally {
        setSending(false);
      }
    },
    [objectId, sendMessageUtil],
  );

  const searchMessages = useCallback(
    async (query: string) => {
      if (!objectId || typeof objectId !== 'string' || objectId.trim() === "" || !supabase) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("object_id", objectId)
          .ilike("content", `%${query}%`)
          .order("created_at", { ascending: false });

        if (err) {
          setError(err.message);
          return;
        }

        setMessages(data || []);
        setHasMore(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка поиска";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [objectId],
  );

  const clearSearch = useCallback(() => {
    setMessages([]);
    setHasMore(true);
    offsetRef.current = 0;
    loadMore(true);
  }, [loadMore]);

  // Загрузка сообщений при изменении objectId
  useEffect(() => {
    if (objectId && typeof objectId === 'string' && objectId.trim() !== "") {
      offsetRef.current = 0;
      loadMore(true);
    } else {
      // Очищаем сообщения если нет objectId
      setMessages([]);
      setError(null);
    }
  }, [objectId, loadMore]);

  // Подписка на новые сообщения
  useEffect(() => {
    if (!objectId || typeof objectId !== 'string' || objectId.trim() === "" || !supabase) return;

    const channel = supabase
      .channel(`chat:${objectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [newMessage, ...prev]);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [objectId]);

  return {
    messages,
    hasMore,
    loadMore,
    newMessage,
    setNewMessage,
    sending,
    file,
    setFile,
    filePreview,
    setFilePreview,
    loadError,
    sendMessage,
    searchMessages,
    clearSearch,
    loading,
    error,
  };
}
