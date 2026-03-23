const DESIGN_TOKENS = require('../../design/tokens.json');
const MICROCOPY = require('../../design/microcopy.json');
const GRAVITY_WELL = require('../../animations/gravitywell.json');

const colorTokens = DESIGN_TOKENS?.colors ?? {};
const typeTokens = DESIGN_TOKENS?.type ?? {};
const spacingTokens = DESIGN_TOKENS?.spacing ?? {};
const radiusTokens = DESIGN_TOKENS?.radii ?? {};
const gutterTokens = DESIGN_TOKENS?.gutters ?? {};

export const TOKENS = {
  color: {
    cream: colorTokens['bg.cream'] || '#F6F0E4',
    creamSoft: colorTokens['bg.creamSoft'] || '#FBF7EF',
    tile: colorTokens['surface.tile'] || '#F3EADB',
    tileAlt: colorTokens['surface.tileAlt'] || '#EEE1CA',
    ink: colorTokens['ink.primary'] || '#111111',
    inkMuted: colorTokens['ink.muted'] || '#4A463E',
    gold: colorTokens['accent.gold'] || '#B88A2A',
    goldSoft: colorTokens['accent.goldSoft'] || 'rgba(184,138,42,0.16)',
    rule: colorTokens['rule.soft'] || '#D8C8A6',
    nodeA: colorTokens['node.forest'] || '#1E3C34',
    nodeB: colorTokens['node.clay'] || '#7A4B18',
    nodeC: colorTokens['node.berry'] || '#8B1E2D',
  },

  type: {
    displayXl: typeTokens['display.xl'] || {
      fontSize: 34,
      lineHeight: 38,
      fontWeight: '900',
      letterSpacing: -1.1,
    },

    displayLg: typeTokens['display.lg'] || {
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '900',
      letterSpacing: -1,
    },

    headingMd: typeTokens['heading.md'] || {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: '900',
      letterSpacing: -0.8,
    },

    titleSm: typeTokens['title.sm'] || {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '800',
      letterSpacing: -0.4,
    },

    bodyMd: typeTokens['body.md'] || {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
      letterSpacing: 0,
    },

    bodySm: typeTokens['body.sm'] || {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '500',
      letterSpacing: 0,
    },

    eyebrow: typeTokens['eyebrow'] || {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '900',
      letterSpacing: 1.2,
    },
  },

  spacing: {
    xs: spacingTokens.xs || 6,
    sm: spacingTokens.sm || 10,
    md: spacingTokens.md || 14,
    lg: spacingTokens.lg || 18,
    xl: spacingTokens.xl || 24,
    xxl: spacingTokens.xxl || 32,
  },

  radius: {
    sm: radiusTokens.sm || 12,
    md: radiusTokens.md || 18,
    lg: radiusTokens.lg || 24,
    xl: radiusTokens.xl || 30,
    pill: radiusTokens.pill || 999,
  },

  gutters: {
    'grid.base': gutterTokens['grid.base'] || 14,
    'grid.imperfectOffsetA': gutterTokens['grid.imperfectOffsetA'] || 13,
    'grid.imperfectOffsetB': gutterTokens['grid.imperfectOffsetB'] || 15,
  },
};

export const DESIGN_TOKEN_DEFAULTS = {
  gutters: TOKENS.gutters,
};

export const HOME_TILES = [
  { id: 'packet', title: 'Packet', subtitle: 'Shape the brief before anything else.' },
  { id: 'gravity', title: 'Gravity', subtitle: 'Drop the strongest thing into motion.' },
  { id: 'voice', title: 'Voice Mode', subtitle: 'Short spoken summaries. Long results stay written.' },
  { id: 'memory', title: 'Memory', subtitle: 'Keep the context that should keep mattering.' },
  { id: 'exports', title: 'Exports', subtitle: 'Pull clean bundles when the run lands.' },
  { id: 'sync', title: 'Sync', subtitle: 'Keep the state recoverable.' },
];

export const LONG_RESULT = `QuinnOS can feel more personal when the spoken layer stays short, decisive, and warm. The long response should remain written so the voice is not forced to carry detail that reads better on screen. Gravity works best when it acts like a compression layer: pull the signal forward, cut the clutter, and speak only the next thing that matters.`;

export { DESIGN_TOKENS, GRAVITY_WELL, MICROCOPY };
