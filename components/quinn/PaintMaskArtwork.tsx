import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { TOKENS } from './quinnSystem';

export default function PaintMaskArtwork() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice">
      <Rect
        x="8"
        y="10"
        width="192"
        height="132"
        rx="28"
        transform="rotate(-4 8 10)"
        fill="#EEDCB4"
        fillOpacity="0.72"
      />
      <Rect
        x="188"
        y="36"
        width="108"
        height="88"
        rx="22"
        transform="rotate(8 188 36)"
        fill={TOKENS.color.gold}
        fillOpacity="0.18"
      />
      <Rect
        x="36"
        y="132"
        width="92"
        height="62"
        rx="18"
        transform="rotate(11 36 132)"
        fill={TOKENS.color.ink}
        fillOpacity="0.06"
      />
      <Path
        d="M20 180C78 164 136 166 204 188"
        stroke={TOKENS.color.ink}
        strokeOpacity="0.08"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </Svg>
  );
}