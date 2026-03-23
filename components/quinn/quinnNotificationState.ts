import type { NotificationItem } from './quinnTypes';

const MAX_NOTIFICATIONS = 24;

export function prependNotification(
  notifications: NotificationItem[],
  notification: NotificationItem,
  limit = MAX_NOTIFICATIONS
): NotificationItem[] {
  return [notification, ...notifications].slice(0, limit);
}

export function markNotificationRead(
  notifications: NotificationItem[],
  id: string,
  read = true
): NotificationItem[] {
  return notifications.map((item) =>
    item.id === id
      ? {
          ...item,
          read,
        }
      : item
  );
}

export function toggleNotificationRead(
  notifications: NotificationItem[],
  id: string
): NotificationItem[] {
  return notifications.map((item) =>
    item.id === id
      ? {
          ...item,
          read: !item.read,
        }
      : item
  );
}

export function removeNotification(
  notifications: NotificationItem[],
  id: string
): NotificationItem[] {
  return notifications.filter((item) => item.id !== id);
}

export function countUnreadNotifications(notifications: NotificationItem[]): number {
  return notifications.filter((item) => !item.read).length;
}
