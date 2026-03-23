import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import GoldRule from './GoldRule';
import SectionCard from './SectionCard';
import { MICROCOPY, TOKENS } from './quinnSystem';

type TileExpandedCanvasProps = {
  onBack: () => void;
  onOpenGravity: () => void;
  onOpenMemory: () => void;
  onOpenExports: () => void;
  packetTitle: string;
  packetText: string;
  onChangeTitle: (value: string) => void;
  onChangeText: (value: string) => void;
};

export default function TileExpandedCanvas({
  onBack,
  onOpenGravity,
  onOpenMemory,
  onOpenExports,
  packetTitle,
  packetText,
  onChangeTitle,
  onChangeText,
}: TileExpandedCanvasProps) {
  const [saveMessage, setSaveMessage] = useState('');

  const safePacketTitle = String(packetTitle || '');
  const safePacketText = String(packetText || '');
  const cleanPacket = safePacketText.trim();
  const isBlank = !cleanPacket;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.rowBetween}>
        <Text style={styles.eyebrow}>TILE EXPANDED CANVAS</Text>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.heroTitle}>Expanded canvas</Text>
      <Text style={styles.heroText}>
        This is the writing surface. Build the packet here first, then send the strongest version into Gravity.
      </Text>

      <GoldRule />

      <SectionCard eyebrow="PACKET TITLE" title="Name the working surface">
        <TextInput
          value={safePacketTitle}
          onChangeText={(value) => {
            onChangeTitle(value);
            if (saveMessage) setSaveMessage('');
          }}
          placeholder="Session title"
          placeholderTextColor="#7F776B"
          style={styles.singleInput}
        />
      </SectionCard>

      <SectionCard eyebrow="CANVAS" title="Write inside the tile logic">
        <TextInput
          multiline
          value={safePacketText}
          onChangeText={(value) => {
            onChangeText(value);
            if (saveMessage) setSaveMessage('');
          }}
          placeholder="Start here"
          placeholderTextColor="#7F776B"
          style={styles.canvasInput}
          textAlignVertical="top"
        />

        {isBlank ? (
          <View style={styles.noteBand}>
            <Text style={styles.noteBandText}>{MICROCOPY.emptyState}</Text>
          </View>
        ) : (
          <View style={styles.readyBand}>
            <Text style={styles.readyBandText}>
              Gravity will receive this exact packet. {cleanPacket.length} characters are ready.
            </Text>
          </View>
        )}

        <View style={styles.rowWrap}>
          <Pressable style={styles.primaryButton} onPress={onOpenGravity}>
            <Text style={styles.primaryButtonText}>Send to Gravity</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => setSaveMessage(MICROCOPY.successToast)}
          >
            <Text style={styles.secondaryButtonText}>Save shape</Text>
          </Pressable>
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickPill} onPress={onOpenMemory}>
            <Text style={styles.quickPillText}>Open Memory</Text>
          </Pressable>

          <Pressable style={styles.quickPill} onPress={onOpenExports}>
            <Text style={styles.quickPillText}>Open Exports</Text>
          </Pressable>
        </View>

        <Text style={styles.helperText}>{MICROCOPY.sendToGravityTooltip}</Text>

        {saveMessage ? (
          <View style={styles.toastBand}>
            <Text style={styles.toastBandText}>{saveMessage}</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard eyebrow="TEXTURE" title="Visual rules">
        <Text style={styles.bodyLine}>• Cream field, never icy white.</Text>
        <Text style={styles.bodyLine}>• Gold rules guide attention, not decoration.</Text>
        <Text style={styles.bodyLine}>• Gutters stay slightly imperfect so the grid feels authored.</Text>
        <Text style={styles.bodyLine}>• Type is bold, trimmed, and dry.</Text>
      </SectionCard>
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
  singleInput: {
    color: TOKENS.color?.ink ?? '#111111',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '700',
  },
  canvasInput: {
    minHeight: 220,
    color: TOKENS.color?.ink ?? '#111111',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: 18,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  rowWrap: {
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
    letterSpacing: 0.3,
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
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 2,
  },
  quickPill: {
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },
  quickPillText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '800',
  },
  helperText: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  noteBand: {
    marginTop: 12,
    backgroundColor: 'rgba(255,253,248,0.95)',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.md ?? 18,
    padding: 12,
  },
  noteBandText: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  readyBand: {
    marginTop: 12,
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.md ?? 18,
    padding: 12,
  },
  readyBandText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  toastBand: {
    marginTop: 12,
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.md ?? 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  toastBandText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  bodyLine: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },
});