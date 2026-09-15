// src/components/NotificationBell.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNotifications, type INotification } from "../hooks/useNotifications.js";

interface NotificationBellProps {
  currentUserId?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ currentUserId }) => {
  const { notifications, unreadCount, markAsRead } = useNotifications(currentUserId);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown & mark read when opened
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      markAsRead();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationText = (notif: INotification) => {
    const name = notif.sender.username || notif.sender.email || "Someone";
    switch (notif.type) {
      case "LIKE":
        return `${name} upvoted your post ${notif.postTitle ? `"${notif.postTitle}"` : ""}`;
      case "FOLLOW":
        return `${name} started following you`;
      case "COMMENT":
        return `${name} commented on your post`;
      default:
        return `${name} interacted with your profile`;
    }
  };

  return (
    <div className={`dropdown is-right ${isOpen ? "is-active" : ""}`} ref={dropdownRef}>
      <div className="dropdown-trigger">
        <button
          className="button is-ghost style-bell-button"
          onClick={handleToggle}
          aria-haspopup="true"
          aria-controls="notification-menu"
          style={{ position: "relative", textDecoration: "none" }}
        >
          <span className="icon is-medium">
            <i className="fas fa-bell fa-lg"></i>
          </span>
          {unreadCount > 0 && (
            <span
              className="tag is-danger is-rounded"
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                fontSize: "0.7rem",
                height: "1.2rem",
                paddingLeft: "0.4em",
                paddingRight: "0.4em",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="dropdown-menu" id="notification-menu" role="menu" style={{ width: "320px" }}>
        <div className="dropdown-content">
          <div className="dropdown-item px-4 py-2">
            <strong className="is-size-6">Notifications</strong>
          </div>
          <hr className="dropdown-divider" />

          {notifications.length === 0 ? (
            <div className="dropdown-item has-text-grey has-text-centered py-4">
              No notifications yet
            </div>
          ) : (
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {notifications.map((notif) => (
                <a
                  key={notif._id}
                  href={notif.postId ? `/posts/${notif.postId}` : "#"}
                  className={`dropdown-item ${!notif.isRead ? "has-background-light" : ""}`}
                  style={{ whiteSpace: "normal" }}
                >
                  <div className="media align-items-center">
                    <div className="media-content">
                      <p className="is-size-7 text-dark">{getNotificationText(notif)}</p>
                      <p className="is-size-7 has-text-grey-light mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};