const GENERIC_PACKET_TITLES = new Set([
  'quinnos sprint 2',
  'quinn thread',
  'untitled packet',
  'next move',
  'current signal',
]);

function cleanTitle(value: string, maxLength = 56) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return '';
  }

  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
}

function extractSentenceTitle(value: string) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return '';
  }

  const sentence = clean.match(/[^.!?]+[.!?]?/)?.[0] || clean;
  return cleanTitle(sentence.replace(/[.!?]+$/, '').trim(), 52);
}

export function shouldAutoRetitlePacket(packetTitle: string) {
  const clean = cleanTitle(packetTitle).toLowerCase();
  return !clean || GENERIC_PACKET_TITLES.has(clean);
}

export function derivePacketTitle({
  packetTitle,
  packetText,
  lensLabel = '',
  sessionArcTitle = '',
}: {
  packetTitle: string;
  packetText: string;
  lensLabel?: string;
  sessionArcTitle?: string;
}) {
  const safeTitle = cleanTitle(packetTitle);

  if (safeTitle && !GENERIC_PACKET_TITLES.has(safeTitle.toLowerCase())) {
    return safeTitle;
  }

  const safeArcTitle = cleanTitle(sessionArcTitle);

  if (safeArcTitle && !GENERIC_PACKET_TITLES.has(safeArcTitle.toLowerCase())) {
    return safeArcTitle;
  }

  const extracted = extractSentenceTitle(packetText);

  if (extracted) {
    return extracted;
  }

  const safeLens = cleanTitle(lensLabel, 18);

  if (safeLens) {
    return `${safeLens} signal`;
  }

  return 'Current signal';
}
