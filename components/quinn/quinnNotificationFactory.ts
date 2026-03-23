import type {
  NotificationItem,
  NotificationTarget,
  NotificationTone,
} from './quinnTypes';

export type CreateNotificationArgs = {
  title: string;
  body: string;
  target: NotificationTarget;
  tone: NotificationTone;
};

export function createNotification({
  title,
  body,
  target,
  tone,
}: CreateNotificationArgs): NotificationItem {
  return {
    id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    timestamp: new Date().toISOString(),
    target,
    tone,
    read: false,
  };
}
