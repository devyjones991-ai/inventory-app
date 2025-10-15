import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { supabase } from "../supabaseClient";
import {
  requestNotificationPermission,
  pushNotification,
  playTaskSound,
  playMessageSound,
} from "../utils/notifications";

const NOTIF_KEY = "objectNotifications";
const CHAT_UNREAD_KEY = "objectChatUnread";

export function useObjectNotifications(selected, activeTab, user) {
  const [notifications, setNotifications] = useState(() => {
    if (typeof localStorage === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(NOTIF_KEY)) || {};
    } catch {
      return {};
    }
  });

  const [chatUnread, setChatUnread] = useState(() => {
    if (typeof localStorage === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(CHAT_UNREAD_KEY)) || {};
    } catch {
      return {};
    }
  });

  const selectedRef = useRef(selected);
  const tabRef = useRef(activeTab);
  const userRef = useRef(user);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    tabRef.current = activeTab;
  }, [activeTab]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CHAT_UNREAD_KEY, JSON.stringify(chatUnread));
    }
  }, [chatUnread]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const tasksChannel = supabase
      .channel("tasks_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => {
          const objId = payload.new.object_id;
          const isCurrent =
            selectedRef.current?.id === objId && tabRef.current === "tasks";
          setNotifications((prev) => {
            if (isCurrent) return prev;
            return { ...prev, [objId]: (prev[objId] || 0) + 1 };
          });
          if (!isCurrent) {
            toast.success(`Добавлена задача: ${payload.new.title}`);
            pushNotification("Новая задача", payload.new.title);
            playTaskSound();
          }
        },
      )
      .subscribe();

    const chatChannel = supabase
      .channel("chat_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const objId = payload.new.object_id;
          const sender = payload.new.sender;
          const currentUser =
            userRef.current?.user_metadata?.username || userRef.current?.email;
          if (sender === currentUser) return;
          const isCurrent =
            selectedRef.current?.id === objId && tabRef.current === "chat";
          setNotifications((prev) => {
            if (isCurrent) return prev;
            return { ...prev, [objId]: (prev[objId] || 0) + 1 };
          });
          if (!isCurrent) {
            toast.success("Новое сообщение в чате");
            const body = payload.new.content || "📎 Файл";
            pushNotification(
              "Новое сообщение",
              `${payload.new.sender}: ${body}`,
            );
            playMessageSound();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(chatChannel);
    };
  }, []);

  // Track unread chat counts per object (separate from generic notifications)
  useEffect(() => {
    const currentUser =
      userRef.current?.user_metadata?.username || userRef.current?.email;
    const me = (currentUser || "").trim().toLowerCase();

    const unreadChannel = supabase
      .channel("chat_unread_all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        (payload) => {
          const n = payload.new || {};
          const o = payload.old || {};
          const objId = n.object_id ?? o.object_id;
          const sender = (n.sender ?? o.sender) || "";
          const isOwn = sender.trim().toLowerCase() === me;

          if (payload.eventType === "INSERT") {
            if (isOwn) return;
            setChatUnread((prev) => ({
              ...prev,
              [objId]: (prev[objId] || 0) + 1,
            }));
            return;
          }

          if (
            payload.eventType === "UPDATE" &&
            o.read_at == null &&
            n.read_at != null
          ) {
            setChatUnread((prev) => {
              const curr = prev[objId] || 0;
              if (curr <= 1) {
                const updated = { ...prev };
                delete updated[objId];
                return updated;
              }
              return { ...prev, [objId]: curr - 1 };
            });
          }
        },
      )
      .subscribe();

    // Initial preload
    (async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("object_id,sender,read_at")
          .is("read_at", null);
        if (error) return;
        const counts = {};
        for (const row of data || []) {
          const s = (row.sender || "").trim().toLowerCase();
          if (s === me) continue;
          counts[row.object_id] = (counts[row.object_id] || 0) + 1;
        }
        setChatUnread(counts);
      } catch {
        // ignore
      }
    })();

    return () => {
      supabase.removeChannel(unreadChannel);
    };
  }, []);

  const clearNotifications = (objectId) => {
    setNotifications((prev) => {
      if (!prev[objectId]) return prev;
      const updated = { ...prev };
      delete updated[objectId];
      return updated;
    });
    setChatUnread((prev) => {
      if (!prev[objectId]) return prev;
      const updated = { ...prev };
      delete updated[objectId];
      return updated;
    });
  };

  return { notifications, chatUnread, clearNotifications };
}
