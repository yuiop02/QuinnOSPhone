export const SURFACE_THEME = {
  bg: '#05070F',
  panel: 'rgba(10, 13, 24, 0.9)',
  panelAlt: 'rgba(14, 18, 31, 0.86)',
  panelSoft: 'rgba(18, 22, 37, 0.78)',
  panelInset: 'rgba(7, 10, 19, 0.84)',
  border: 'rgba(182, 166, 255, 0.2)',
  borderStrong: 'rgba(208, 197, 255, 0.4)',
  borderWarm: 'rgba(225, 195, 132, 0.36)',
  text: '#F6F8FF',
  textMuted: 'rgba(214, 220, 241, 0.72)',
  textSoft: 'rgba(190, 198, 224, 0.58)',
  eyebrow: '#D3C3FF',
  gold: '#E2C983',
  goldSoft: 'rgba(226, 201, 131, 0.14)',
  plumSoft: 'rgba(157, 118, 233, 0.16)',
  plumGlow: 'rgba(139, 113, 219, 0.2)',
  success: 'rgba(90, 197, 161, 0.2)',
  danger: 'rgba(233, 116, 142, 0.2)',
  shadow: 'rgba(2, 4, 10, 0.62)',
  veil: 'rgba(255, 255, 255, 0.03)',
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
