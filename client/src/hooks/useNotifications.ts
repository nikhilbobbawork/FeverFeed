// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from "react";
import { socket } from "../socket.js";

export interface INotification {
  _id: string;
  recipientId: string;
  senderId: string;
  type: "LIKE" | "COMMENT" | "FOLLOW";
  postId?: string;
  postTitle?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    username?: string;
    email?: string;
    avatar?: string;
  };
}

export const useNotifications = (currentUserId?: string) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Fetch historical notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        const unread = data.data.filter((n: INotification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // 2. Setup Socket.io connection & real-time listeners
  useEffect(() => {
    if (!currentUserId) return;

    fetchNotifications();

    const registerUserSocket = () => {
      console.log(`[Socket Client] Emitting 'register_user' for ${currentUserId}`);
      socket.emit("register_user", currentUserId);
    };

    // Attach connect listener FIRST
    socket.on("connect", registerUserSocket);

    // If socket is already connected, emit registration immediately
    if (socket.connected) {
      registerUserSocket();
    } else {
      socket.connect(); // Connect AFTER listeners are attached
    }

    // Real-time notification handler
    const handleNewNotification = (newNotif: INotification) => {
      console.log("[Socket Client] Received new notification:", newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("connect", registerUserSocket);
      socket.off("new_notification", handleNewNotification);
    };
  }, [currentUserId, fetchNotifications]);

  // 3. Mark all as read locally and sync with REST API
  const markAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications/read", {
        method: "PATCH",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, refresh: fetchNotifications };
};