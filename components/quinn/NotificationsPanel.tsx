import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { TOKENS } from './quinnSystem';
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
  if (tone === 'alert') {
    return TOKENS.color?.nodeC ?? '#8B1E2D';
  }

  if (tone === 'success') {
    return TOKENS.color?.nodeA ?? '#1E3C34';
  }

  if (tone === 'gold') {
    return TOKENS.color?.gold ?? '#B88A2A';
  }

  return TOKENS.color?.rule ?? '#D8C8A6';
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
      <View style={styles.rowBetween}>
        <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.heroTitle}>Alerts, trimmed down.</Text>
      <Text style={styles.heroText}>
        This is the notification surface. Runs, memory actions, and system changes land here.
      </Text>

      <View style={styles.statusBand}>
        <Text style={styles.statusBandText}>
          {unreadCount} unread • quiet mode {quietNotifications ? 'on' : 'off'}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={onClearAll}>
          <Text style={styles.secondaryButtonText}>Clear all</Text>
        </Pressable>
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
    paddingHorizontal: TOKENS.spacing?.lg ?? 18,
    paddingBottom: 30,
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 8,
  },

  heroTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.1,
    marginBottom: 10,
  },

  heroText: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 14,
  },

  ghostButton: {
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: TOKENS.radius?.pill ?? 999,
    marginTop: 10,
  },

  ghostButtonText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '800',
  },

  statusBand: {
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.md ?? 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },

  statusBandText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },

  notificationCard: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderRadius: TOKENS.radius?.lg ?? 24,
    padding: 16,
    marginBottom: 12,
  },

  notificationTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 4,
  },

  notificationMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  notificationBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
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
    backgroundColor: TOKENS.color?.ink ?? '#111111',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  primaryButtonText: {
    color: TOKENS.color?.creamSoft ?? '#FBF7EF',
    fontSize: 13,
    fontWeight: '900',
  },

  secondaryButton: {
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  secondaryButtonText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  deleteButton: {
    backgroundColor: 'rgba(139,30,45,0.10)',
    borderWidth: 1,
    borderColor: TOKENS.color?.nodeC ?? '#8B1E2D',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  deleteButtonText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.xl ?? 30,
    padding: 16,
  },

  emptyTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  emptyBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
});