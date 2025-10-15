import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { supabase } from "../supabaseClient";
import { handleSupabaseError } from "../utils/handleSupabaseError";
import logger from "../utils/logger";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/plain",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
}

interface FetchMessagesParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export function useChatMessages() {
  const navigate = useNavigate();

  const fetchMessages = useCallback(
    async (
      objectId: string,
      { limit = 20, offset = 0, search }: FetchMessagesParams = {},
    ) => {
      try {
        let query;
        try {
          query = supabase
            .from("chat_messages")
            .select("*")
            .eq("object_id", objectId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (search) {
            query = query.ilike("content", `%${search}%`);
          }

          const { data, error } = await query;

          if (error) {
            logger.error("Error fetching messages:", error);
            await handleSupabaseError(
              error,
              navigate,
              "Ошибка загрузки сообщений",
            );
            return { data: null, error };
          }

          return { data: data || [], error: null };
        } catch (err) {
          logger.error("Error in fetchMessages:", err);
          await handleSupabaseError(err, navigate, "Ошибка загрузки сообщений");
          return { data: null, error: err };
        }
      } catch (err) {
        logger.error("Error in fetchMessages:", err);
        await handleSupabaseError(err, navigate, "Ошибка загрузки сообщений");
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const sendMessage = useCallback(
    async (objectId: string, content: string, file?: File) => {
      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }

        let fileUrl = null;
        let fileName = null;

        if (file) {
          // Validate file
          if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new Error("Неподдерживаемый тип файла");
          }

          if (file.size > MAX_FILE_SIZE) {
            throw new Error("Файл слишком большой (максимум 5MB)");
          }

          // Upload file
          const fileExt = file.name.split(".").pop();
          const uploadedFileName = `${uuidv4()}.${fileExt}`;
          const filePath = `chat/${objectId}/${uploadedFileName}`;

          const { error: uploadError } = await supabase.storage
            .from("chat-files")
            .upload(filePath, file);

          if (uploadError) {
            throw new Error("Ошибка загрузки файла");
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("chat-files").getPublicUrl(filePath);

          fileUrl = publicUrl;
          fileName = file.name;
        }

        // Send message
        const { data, error } = await supabase
          .from("chat_messages")
          .insert({
            object_id: objectId,
            content,
            file_url: fileUrl,
            file_name: fileName,
          })
          .select()
          .single();

        if (error) {
          logger.error("Error sending message:", error);
          await handleSupabaseError(
            error,
            navigate,
            "Ошибка отправки сообщения",
          );
          return { data: null, error };
        }

        return { data, error: null };
      } catch (err) {
        logger.error("Error in sendMessage:", err);
        await handleSupabaseError(err, navigate, "Ошибка отправки сообщения");
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  return useMemo(
    () => ({
      fetchMessages,
      sendMessage,
    }),
    [fetchMessages, sendMessage],
  );
}
