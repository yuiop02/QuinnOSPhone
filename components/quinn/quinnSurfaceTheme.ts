export const SURFACE_THEME = {
  bg: '#020008',
  bgDeep: '#090114',
  panel: 'rgba(20, 8, 31, 0.86)',
  panelAlt: 'rgba(26, 11, 41, 0.84)',
  panelSoft: 'rgba(36, 14, 54, 0.74)',
  panelInset: 'rgba(8, 3, 16, 0.92)',
  border: 'rgba(244, 198, 255, 0.2)',
  borderStrong: 'rgba(255, 227, 244, 0.4)',
  borderWarm: 'rgba(255, 227, 201, 0.36)',
  glassLine: 'rgba(255, 241, 248, 0.14)',
  text: '#FFF9FE',
  textMuted: 'rgba(235, 226, 246, 0.76)',
  textSoft: 'rgba(212, 199, 229, 0.6)',
  eyebrow: '#F6BDEB',
  gold: '#FFE0C7',
  goldSoft: 'rgba(255, 226, 201, 0.16)',
  plumSoft: 'rgba(208, 98, 255, 0.2)',
  plumGlow: 'rgba(208, 88, 255, 0.34)',
  roseGlow: 'rgba(255, 118, 214, 0.24)',
  peachGlow: 'rgba(255, 226, 198, 0.2)',
  portalGlow: 'rgba(255, 114, 214, 0.3)',
  portalWarm: 'rgba(255, 224, 196, 0.24)',
  violetCore: 'rgba(179, 82, 255, 0.44)',
  glassHighlight: 'rgba(255, 249, 252, 0.095)',
  orbital: 'rgba(255, 198, 240, 0.18)',
  success: 'rgba(90, 197, 161, 0.2)',
  danger: 'rgba(233, 116, 142, 0.2)',
  shadow: 'rgba(5, 0, 12, 0.84)',
  veil: 'rgba(255, 255, 255, 0.05)',
};

export const SURFACE_COPY = {
  shellMaxWidth: 1120,
  heroMaxWidth: 760,
};

export function toneToSurfaceAccent(tone: 'neutral' | 'gold' | 'success' | 'alert') {
  if (tone === 'gold') {
    return {
      borderColor: SURFACE_THEME.borderWarm,
      backgroundColor: SURFACE_THEME.goldSoft,
    };
  }

  if (tone === 'success') {
    return {
      borderColor: 'rgba(90, 197, 161, 0.28)',
      backgroundColor: SURFACE_THEME.success,
    };
  }

  if (tone === 'alert') {
    return {
      borderColor: 'rgba(233, 116, 142, 0.3)',
      backgroundColor: SURFACE_THEME.danger,
    };
  }

  return {
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelSoft,
  };
}
