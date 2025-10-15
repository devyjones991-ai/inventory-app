import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useNotifications } from "../hooks/useNotifications";
import { Notification } from "../types";
import "../assets/notifications-styles.css";

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
          className={`notification-button ${unreadCount > 0 ? 'has-notifications' : ''}`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-5 5v-5zM9 12l2 2 4-4M21 12c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8z"
            />
          </svg>
          {unreadCount > 0 && (
            <div className="notification-badge absolute -top-1 -right-1">
              {unreadCount}
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="notification-center max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="notification-header">Уведомления</DialogTitle>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="notification-action-button danger"
              >
                Очистить все
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="notification-list">
          {permission === "default" && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Разрешите уведомления для получения важных обновлений
              </p>
              <Button size="sm" onClick={handleRequestPermission}>
                Разрешить
              </Button>
            </div>
          )}
          {notifications.length === 0 ? (
            <p className="notification-empty">
              Нет уведомлений
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="notification-text font-medium text-sm">{notification.title}</h4>
                    <p className="notification-text text-xs mt-1">
                      {notification.message}
                    </p>
                    <p className="notification-time">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveNotification(notification.id);
                    }}
                    className="notification-action-button danger h-6 w-6 p-0"
                  >
                    ×
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
