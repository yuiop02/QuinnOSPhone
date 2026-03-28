import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import QuinnSurfaceShell from './QuinnSurfaceShell';
import { SURFACE_THEME, toneToSurfaceAccent } from './quinnSurfaceTheme';
import { NotificationItem } from './quinnTypes';

type NotificationsPanelProps = {
  onBack: () => void;
  notifications: NotificationItem[];
  quietNotifications: boolean;
  onOpenNotification: (item: NotificationItem) => void;
  onToggleRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
};

function formatTimestamp(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function toneBorderColor(tone: NotificationItem['tone']) {
  return toneToSurfaceAccent(tone).borderColor;
}

export default function NotificationsPanel({
  onBack,
  notifications,
  quietNotifications,
  onOpenNotification,
  onToggleRead,
  onDeleteNotification,
  onClearAll,
}: NotificationsPanelProps) {
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const orderedNotifications = [...safeNotifications].sort((a, b) =>
    String(b.timestamp || '').localeCompare(String(a.timestamp || ''))
  );
  const unreadCount = orderedNotifications.filter((item) => !item.read).length;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <QuinnSurfaceShell
        eyebrow="SIGNAL STACK"
        title="Alerts, trimmed down."
        description="Runs, memory actions, and system changes land here. The stack stays quiet, readable, and ready to move you back into the right Quinn surface."
        onBack={onBack}
        actions={[
          { label: `${unreadCount} unread`, tone: 'secondary' },
          { label: quietNotifications ? 'Quiet mode on' : 'Live feed', tone: 'ghost' },
          { label: 'Clear all', tone: 'primary', onPress: onClearAll },
        ]}
      />

      <View style={styles.statusBand}>
        <Text style={styles.statusBandText}>
          {unreadCount} unread • quiet mode {quietNotifications ? 'on' : 'off'}
        </Text>
      </View>

      {orderedNotifications.length ? (
        orderedNotifications.map((item) => (
          <View
            key={item.id}
            style={[
              styles.notificationCard,
              {
                borderColor: toneBorderColor(item.tone),
                opacity: item.read ? 0.72 : 1,
              },
            ]}
          >
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMeta}>
              {formatTimestamp(item.timestamp)} • {item.target}
            </Text>
            <Text style={styles.notificationBody}>{item.body}</Text>

            <View style={styles.cardActionRow}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => onOpenNotification(item)}
              >
                <Text style={styles.primaryButtonText}>Open</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => onToggleRead(item.id)}
              >
                <Text style={styles.secondaryButtonText}>
                  {item.read ? 'Mark unread' : 'Mark read'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => onDeleteNotification(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyBody}>
            Run Quinn, pin memory, or change controls and new alerts will show up here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  statusBand: {
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },

  statusBandText: {
    color: SURFACE_THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },

  notificationCard: {
    backgroundColor: SURFACE_THEME.panelAlt,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },

  notificationTitle: {
    color: SURFACE_THEME.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 4,
  },

  notificationMeta: {
    color: SURFACE_THEME.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  notificationBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  cardActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  primaryButton: {
    backgroundColor: SURFACE_THEME.goldSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderWarm,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  primaryButtonText: {
    color: SURFACE_THEME.gold,
    fontSize: 13,
    fontWeight: '900',
  },

  secondaryButton: {
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  secondaryButtonText: {
    color: SURFACE_THEME.text,
    fontSize: 13,
    fontWeight: '900',
  },

  deleteButton: {
    backgroundColor: SURFACE_THEME.danger,
    borderWidth: 1,
    borderColor: 'rgba(233, 116, 142, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  deleteButtonText: {
    color: '#FFD6E1',
    fontSize: 13,
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: SURFACE_THEME.panel,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 30,
    padding: 18,
  },

  emptyTitle: {
    color: SURFACE_THEME.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  emptyBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
});
