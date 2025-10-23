import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import React, { useState } from "react";

import { useNotifications } from "../hooks/useNotifications";
import { Notification } from "../types";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import "../assets/notifications-styles.css";
import "../assets/space-theme.css";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    requestPermission,
    isSupported,
    permission,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleRemoveNotification = (notificationId: string) => {
    removeNotification(notificationId);
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`space-notification-button ${unreadCount > 0 ? "has-notifications" : ""}`}
        >
          <div className="relative">
            <div className="space-notification-icon">🔔</div>
            {unreadCount > 0 && (
              <div className="space-notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
            {unreadCount > 0 && (
              <div className="space-notification-pulse"></div>
            )}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="space-modal space-fade-in max-w-md">
        <DialogHeader className="space-modal-header">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-xl font-bold">
              🔔 Уведомления
            </DialogTitle>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="space-button"
              >
                🗑️ Очистить все
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="space-list max-h-96 overflow-y-auto">
          {permission === "default" && (
            <div className="space-card p-4 mb-4">
              <p className="text-space-text-muted mb-3">
                🔔 Разрешите уведомления для получения важных обновлений
              </p>
              <Button
                size="sm"
                onClick={handleRequestPermission}
                className="space-button"
              >
                🔔 Разрешить
              </Button>
            </div>
          )}
          {notifications.length === 0 ? (
            <div className="space-card p-6 text-center text-space-text-muted">
              <div className="text-4xl mb-2">🔔</div>
              <p>Нет уведомлений</p>
              <p className="text-sm">
                Здесь будут появляться важные обновления
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`space-card p-4 mb-3 cursor-pointer transition-all duration-300 hover:space-active ${notification.read ? "opacity-70" : "space-fade-in"}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-space-text font-semibold mb-1">
                      {notification.read ? "📖" : "📬"} {notification.title}
                    </div>
                    <div className="text-space-text-muted text-sm mb-2">
                      {notification.message}
                    </div>
                    <div className="text-space-text-muted text-xs">
                      ⏰{" "}
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveNotification(notification.id);
                    }}
                    className="space-button p-1 h-6 w-6"
                  >
                    ❌
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
