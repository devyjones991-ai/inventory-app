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
  loadMore: (replace?: boolean) => Promise<{ error: unknown } | undefined>;
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
      if (
        !objectId ||
        typeof objectId !== "string" ||
        objectId.trim() === "" ||
        !supabase
      )
        return { error: "No objectId or supabase" };

      try {
        setLoading(true);
        setLoadError(null);

        // Для загрузки последних сообщений используем отрицательный offset
        const offset = replace ? -LIMIT : offsetRef.current;
        const result = await fetchMessages(objectId, { offset, limit: LIMIT });

        if (result.error) {
          setLoadError(result.error.message || "Ошибка загрузки сообщений");
          return { error: result.error };
        }

        const newMessages = result.data || [];
        const hasMoreMessages = result.hasMore || false;
        console.log("Loading messages:", {
          replace,
          newMessages: newMessages.length,
          offset,
          hasMoreMessages,
        });

        if (replace) {
          // При замене загружаем последние сообщения (они в обратном порядке, нужно перевернуть)
          setMessages(newMessages.reverse());
          setHasMore(hasMoreMessages);
          offsetRef.current = newMessages.length;
        } else {
          // При добавлении добавляем к существующим (старые сообщения в начало)
          setMessages((prev) => [...newMessages, ...prev]);
          setHasMore(hasMoreMessages);
          offsetRef.current = offset + newMessages.length;
        }

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
      if (
        !objectId ||
        typeof objectId !== "string" ||
        objectId.trim() === "" ||
        !supabase
      )
        return;

      try {
        setSending(true);
        setError(null);

        const result = await sendMessageUtil(
          objectId,
          content,
          userEmail,
          file,
        );
        if (result.error) {
          setError(result.error.message || "Ошибка отправки сообщения");
          return;
        }

        // Очищаем форму после успешной отправки
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
    [objectId, userEmail, sendMessageUtil],
  );

  const searchMessages = useCallback(
    async (query: string) => {
      if (
        !objectId ||
        typeof objectId !== "string" ||
        objectId.trim() === "" ||
        !supabase
      )
        return;

      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("object_id", objectId)
          .ilike("content", `%${query}%`)
          .order("created_at", { ascending: true });

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

  // Загрузка всех сообщений для объекта
  const loadAllMessages = useCallback(async () => {
    if (
      !objectId ||
      typeof objectId !== "string" ||
      objectId.trim() === "" ||
      !supabase
    )
      return;

    try {
      setLoading(true);
      setError(null);

      // Загружаем все сообщения сразу
      const result = await fetchMessages(objectId, { limit: 1000 }); // Большой лимит для всех сообщений

      if (result.error) {
        setError(result.error.message || "Ошибка загрузки сообщений");
        return;
      }

      const allMessages = result.data || [];
      console.log("Loading all messages:", { count: allMessages.length });

      // Устанавливаем все сообщения в хронологическом порядке
      setMessages(allMessages);
      setHasMore(false); // Больше не нужно загружать
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка загрузки";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [objectId, fetchMessages]);

  const clearSearch = useCallback(() => {
    setMessages([]);
    setHasMore(false);
    offsetRef.current = 0;
    loadAllMessages();
  }, [loadAllMessages]);

  // Загрузка всех сообщений при изменении objectId
  useEffect(() => {
    if (objectId && typeof objectId === "string" && objectId.trim() !== "") {
      loadAllMessages();
    } else {
      // Очищаем сообщения если нет objectId
      setMessages([]);
      setError(null);
    }
  }, [objectId, loadAllMessages]);

  // Подписка на новые сообщения в реальном времени
  useEffect(() => {
    if (
      !objectId ||
      typeof objectId !== "string" ||
      objectId.trim() === "" ||
      !supabase
    )
      return;

    console.log(`[Realtime] Subscribing to chat:${objectId}`);

    const channel = supabase
      .channel(`chat:${objectId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: "" },
        },
      })
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
          console.log("[Realtime] New message received:", newMessage);
          
          setMessages((prev) => {
            // Проверяем, нет ли уже такого сообщения (избегаем дублирования)
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) {
              console.log("[Realtime] Message already exists, skipping");
              return prev;
            }
            
            console.log("[Realtime] Adding new message to list");
            
            // Добавляем новое сообщение и сортируем по created_at для правильного порядка
            const updated = [...prev, newMessage].sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateA - dateB;
            });
            
            return updated;
          });

          // Принудительно обновляем hasMore для новых сообщений
          setHasMore(true);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          console.log("[Realtime] Message updated:", updatedMessage);
          
          setMessages((prev) => {
            return prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            );
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          console.log("[Realtime] Message deleted:", deletedId);
          
          setMessages((prev) => {
            return prev.filter((msg) => msg.id !== deletedId);
          });
        },
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status: ${status}`);
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Successfully subscribed to chat:${objectId}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[Realtime] Channel error for chat:${objectId}`);
        } else if (status === "TIMED_OUT") {
          console.error(`[Realtime] Subscription timeout for chat:${objectId}`);
        } else if (status === "CLOSED") {
          console.log(`[Realtime] Channel closed for chat:${objectId}`);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`[Realtime] Unsubscribing from chat:${objectId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
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
