import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

type QuinnFieldProps = {
  height?: number;
  waveKey: number;
};

type Particle = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  color: string;
  d: number;
  phase: number;
};

type NodePoint = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  d: number;
  phase: number;
};

const RAINBOW = [
  '#ff43da',
  '#ff6a2f',
  '#ffcf2b',
  '#f5ff5d',
  '#5cff9a',
  '#3ce0ff',
  '#4f6fff',
  '#a15bff',
];

const STAR_COLORS = ['#ffffff', '#f4f8ff', '#dce7ff', '#aad4ff', '#9b98ff', '#c7fdff'];

function mulberry32(seed: number) {
  let t = seed;
  return function rand() {
    t += 0x6d2b79f5;
    let next = Math.imul(t ^ (t >>> 15), 1 | t);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function fadeCurve(t: number) {
  if (t <= 0) {
    return 0;
  }
  if (t < 0.08) {
    return t / 0.08;
  }
  if (t < 0.42) {
    return 1;
  }
  if (t < 0.88) {
    return 1 - (t - 0.42) / 0.46;
  }
  return 0;
}

type StaticSceneProps = {
  width: number;
  height: number;
  orbCx: number;
  orbCy: number;
  stars: Particle[];
  dust: Particle[];
  filamentNodes: NodePoint[];
  lowerNodes: NodePoint[];
  orbitDust: NodePoint[];
};

const StaticScene = memo(function StaticScene({
  width,
  height,
  orbCx,
  orbCy,
  stars,
  dust,
  filamentNodes,
  lowerNodes,
  orbitDust,
}: StaticSceneProps) {
  const topFilamentA = `M ${width * 0.46} 76 C ${width * 0.61} 44, ${width * 0.74} 58, ${orbCx} ${orbCy}`;
  const topFilamentB = `M ${width * 0.49} 108 C ${width * 0.62} 70, ${width * 0.81} 82, ${orbCx + 2} ${orbCy + 10}`;
  const topFilamentC = `M ${width * 0.51} 138 C ${width * 0.64} 88, ${width * 0.84} 110, ${orbCx + 10} ${orbCy + 22}`;
  const topFilamentD = `M ${width * 0.56} 166 C ${width * 0.7} 118, ${width * 0.88} 140, ${orbCx + 18} ${orbCy + 34}`;
  const topFilamentE = `M ${width * 0.58} 198 C ${width * 0.72} 144, ${width * 0.9} 170, ${orbCx + 30} ${orbCy + 52}`;

  const lowerFilamentA = `M 0 ${height * 0.81} C ${width * 0.16} ${height * 0.7}, ${width * 0.42} ${height * 0.74}, ${width * 0.9} ${height * 0.9}`;
  const lowerFilamentB = `M ${width * 0.04} ${height * 0.86} C ${width * 0.26} ${height * 0.76}, ${width * 0.56} ${height * 0.8}, ${width} ${height * 0.74}`;
  const lowerFilamentC = `M ${width * 0.08} ${height * 0.94} C ${width * 0.34} ${height * 0.82}, ${width * 0.64} ${height * 0.88}, ${width} ${height * 0.8}`;
  const lowerFilamentD = `M ${width * 0.12} ${height} C ${width * 0.4} ${height * 0.9}, ${width * 0.72} ${height * 0.93}, ${width} ${height * 0.86}`;

  const sideSweepA = `M ${width * 0.96} ${height * 0.12} C ${width * 0.88} ${height * 0.28}, ${width * 0.9} ${height * 0.46}, ${width} ${height * 0.62}`;
  const sideSweepB = `M ${width * 0.93} ${height * 0.08} C ${width * 0.82} ${height * 0.2}, ${width * 0.86} ${height * 0.42}, ${width} ${height * 0.56}`;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
      <Defs>
        <LinearGradient id="bgFade" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#010208" />
          <Stop offset="24%" stopColor="#040713" />
          <Stop offset="56%" stopColor="#050911" />
          <Stop offset="100%" stopColor="#010207" />
        </LinearGradient>

        <RadialGradient id="orbCore" cx="50%" cy="50%" r="58%">
          <Stop offset="0%" stopColor="rgba(183,192,255,0.42)" />
          <Stop offset="26%" stopColor="rgba(118,104,255,0.28)" />
          <Stop offset="56%" stopColor="rgba(79,96,255,0.16)" />
          <Stop offset="78%" stopColor="rgba(64,73,168,0.08)" />
          <Stop offset="100%" stopColor="rgba(9,11,22,0)" />
        </RadialGradient>

        <RadialGradient id="orbHalo" cx="50%" cy="50%" r="68%">
          <Stop offset="0%" stopColor="rgba(125,132,255,0.16)" />
          <Stop offset="52%" stopColor="rgba(93,93,255,0.10)" />
          <Stop offset="100%" stopColor="rgba(18,22,42,0)" />
        </RadialGradient>

        <LinearGradient id="rainbowRoadStatic" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="rgba(255,82,217,0)" />
          <Stop offset="16%" stopColor="rgba(255,122,61,0.22)" />
          <Stop offset="34%" stopColor="rgba(255,216,74,0.20)" />
          <Stop offset="52%" stopColor="rgba(120,255,152,0.18)" />
          <Stop offset="68%" stopColor="rgba(86,221,255,0.18)" />
          <Stop offset="84%" stopColor="rgba(107,121,255,0.18)" />
          <Stop offset="100%" stopColor="rgba(186,117,255,0)" />
        </LinearGradient>

        <LinearGradient id="coolSweepStatic" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="rgba(97,116,255,0)" />
          <Stop offset="20%" stopColor="rgba(114,132,255,0.18)" />
          <Stop offset="48%" stopColor="rgba(86,220,255,0.14)" />
          <Stop offset="76%" stopColor="rgba(164,121,255,0.14)" />
          <Stop offset="100%" stopColor="rgba(164,121,255,0)" />
        </LinearGradient>
      </Defs>

      <Rect width={width} height={height} fill="url(#bgFade)" />

      <Circle cx={orbCx} cy={orbCy} r={116} fill="rgba(90, 92, 255, 0.05)" />
      <Circle cx={orbCx} cy={orbCy} r={92} fill="url(#orbHalo)" />
      <Circle cx={orbCx} cy={orbCy} r={76} fill="url(#orbCore)" />
      <Circle
        cx={orbCx}
        cy={orbCy}
        r={74}
        stroke="rgba(201, 210, 255, 0.14)"
        strokeWidth={1}
        fill="none"
      />
      <Circle
        cx={orbCx}
        cy={orbCy}
        r={58}
        stroke="rgba(188, 202, 255, 0.10)"
        strokeWidth={1}
        fill="none"
      />
      <Circle cx={orbCx + 4} cy={orbCy - 3} r={16} fill="rgba(230,236,255,0.08)" />

      <Path d={topFilamentA} stroke="rgba(168, 176, 255, 0.26)" strokeWidth={1.35} fill="none" />
      <Path d={topFilamentB} stroke="rgba(123, 203, 255, 0.20)" strokeWidth={1.15} fill="none" />
      <Path d={topFilamentC} stroke="rgba(179, 126, 255, 0.18)" strokeWidth={1.1} fill="none" />
      <Path d={topFilamentD} stroke="rgba(131, 147, 255, 0.16)" strokeWidth={1.05} fill="none" />
      <Path d={topFilamentE} stroke="rgba(107, 208, 255, 0.14)" strokeWidth={1} fill="none" />

      <Path d={lowerFilamentA} stroke="url(#rainbowRoadStatic)" strokeWidth={1.6} fill="none" />
      <Path d={lowerFilamentB} stroke="url(#coolSweepStatic)" strokeWidth={1.4} fill="none" />
      <Path d={lowerFilamentC} stroke="url(#rainbowRoadStatic)" strokeWidth={1.1} fill="none" opacity={0.42} />
      <Path d={lowerFilamentD} stroke="url(#coolSweepStatic)" strokeWidth={1.2} fill="none" />

      <Path d={sideSweepA} stroke="rgba(101, 121, 255, 0.15)" strokeWidth={1.1} fill="none" />
      <Path d={sideSweepB} stroke="rgba(163, 124, 255, 0.12)" strokeWidth={1} fill="none" />

      <G>
        {dust.map((particle, index) => (
          <Circle
            key={`dust-${index}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            fill={particle.color}
            opacity={particle.opacity}
          />
        ))}
      </G>

      <G>
        {stars.map((particle, index) => (
          <Circle
            key={`star-${index}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            fill={particle.color}
            opacity={particle.opacity}
          />
        ))}
      </G>

      <G>
        {filamentNodes.map((node, index) => (
          <Circle
            key={`filament-${index}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="#c3d2ff"
            opacity={node.opacity}
          />
        ))}
      </G>

      <G>
        {lowerNodes.map((node, index) => (
          <Circle
            key={`lower-${index}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="#9bb8ff"
            opacity={node.opacity}
          />
        ))}
      </G>

      <G>
        {orbitDust.map((node, index) => (
          <Circle
            key={`orbit-${index}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="#b2bfff"
            opacity={node.opacity}
          />
        ))}
      </G>
    </Svg>
  );
});

export default function QuinnField({ height = 1180, waveKey }: QuinnFieldProps) {
  const width = Dimensions.get('window').width;
  const [waveProgress, setWaveProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const orbCx = width * 0.79;
  const orbCy = 108;
  const waveOriginX = width - 68;
  const waveOriginY = 272;
  const maxRadius = Math.hypot(width + 180, height + 180);

  const stars = useMemo<Particle[]>(() => {
    const rand = mulberry32(Math.floor(width * height * 1.3));
    return Array.from({ length: 360 }, (_, index) => {
      const x = rand() * width;
      const y = rand() * height;
      return {
        x,
        y,
        r:
          index % 13 === 0
            ? 2.1 + rand() * 1.6
            : index % 4 === 0
              ? 1.1 + rand() * 1.1
              : 0.45 + rand() * 0.9,
        opacity:
          index % 9 === 0
            ? 0.92
            : index % 4 === 0
              ? 0.48 + rand() * 0.28
              : 0.16 + rand() * 0.36,
        color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
        d: Math.hypot(x - waveOriginX, y - waveOriginY),
        phase: rand() * 24,
      };
    });
  }, [width, height, waveOriginX, waveOriginY]);

  const dust = useMemo<Particle[]>(() => {
    const rand = mulberry32(Math.floor(width * height * 2.1));
    return Array.from({ length: 520 }, () => {
      const x = rand() * width;
      const y = rand() * height;
      return {
        x,
        y,
        r: 0.22 + rand() * 0.48,
        opacity: 0.05 + rand() * 0.12,
        color: rand() > 0.8 ? '#8e8fff' : '#dfe7ff',
        d: Math.hypot(x - waveOriginX, y - waveOriginY),
        phase: rand() * 20,
      };
    });
  }, [width, height, waveOriginX, waveOriginY]);

  const filamentNodes = useMemo<NodePoint[]>(() => {
    const rand = mulberry32(Math.floor(width * 77 + height * 13));
    return Array.from({ length: 110 }, () => {
      const x = width * 0.5 + rand() * (width * 0.42);
      const y = 40 + rand() * 220;
      return {
        x,
        y,
        r: 0.7 + rand() * 1.55,
        opacity: 0.2 + rand() * 0.3,
        d: Math.hypot(x - waveOriginX, y - waveOriginY),
        phase: rand() * 20,
      };
    });
  }, [width, height, waveOriginX, waveOriginY]);

  const lowerNodes = useMemo<NodePoint[]>(() => {
    const rand = mulberry32(Math.floor(width * 91 + height * 19));
    return Array.from({ length: 120 }, () => {
      const x = 4 + rand() * (width - 8);
      const y = height * 0.67 + rand() * 250;
      return {
        x,
        y,
        r: 0.6 + rand() * 1.4,
        opacity: 0.16 + rand() * 0.24,
        d: Math.hypot(x - waveOriginX, y - waveOriginY),
        phase: rand() * 20,
      };
    });
  }, [width, height, waveOriginX, waveOriginY]);

  const orbitDust = useMemo<NodePoint[]>(() => {
    const rand = mulberry32(Math.floor(width * 117 + height * 9));
    return Array.from({ length: 90 }, () => {
      const x = width * 0.62 + rand() * (width * 0.28);
      const y = 34 + rand() * 180;
      return {
        x,
        y,
        r: 0.4 + rand() * 0.95,
        opacity: 0.1 + rand() * 0.22,
        d: Math.hypot(x - waveOriginX, y - waveOriginY),
        phase: rand() * 20,
      };
    });
  }, [width, height, waveOriginX, waveOriginY]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!waveKey) {
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / duration);
      const eased = easeOutQuart(raw);
      setWaveProgress(eased);

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setWaveProgress(0);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [waveKey]);

  const waveRadius = waveProgress * maxRadius;
  const brightBand = 92;
  const trailBand = 190;

  const activeStars = useMemo(() => {
    if (waveProgress <= 0) {
      return [];
    }

    return stars
      .filter((item) => Math.abs(item.d - waveRadius) < brightBand || (item.d < waveRadius && item.d > waveRadius - trailBand))
      .map((item, index) => {
        const diff = Math.abs(item.d - waveRadius);
        const rainbowIndex = Math.floor((item.phase + waveProgress * 28) % RAINBOW.length);

        if (diff < brightBand) {
          const intensity = 1 - diff / brightBand;
          return {
            ...item,
            key: `s-${index}`,
            color: RAINBOW[rainbowIndex],
            opacity: Math.min(1, item.opacity + 0.95 * intensity),
            radius: item.r + 2.3 * intensity,
          };
        }

        const trailIntensity = 1 - (waveRadius - item.d) / trailBand;
        return {
          ...item,
          key: `s-${index}`,
          color: '#b3a9ff',
          opacity: Math.min(0.92, item.opacity + 0.28 * trailIntensity),
          radius: item.r + 0.45 * trailIntensity,
        };
      });
  }, [stars, waveProgress, waveRadius]);

  const activeDust = useMemo(() => {
    if (waveProgress <= 0) {
      return [];
    }

    return dust
      .filter((item) => Math.abs(item.d - waveRadius) < brightBand * 0.9)
      .map((item, index) => {
        const diff = Math.abs(item.d - waveRadius);
        const intensity = 1 - diff / (brightBand * 0.9);
        const rainbowIndex = Math.floor((item.phase + waveProgress * 34) % RAINBOW.length);

        return {
          ...item,
          key: `d-${index}`,
          color: RAINBOW[rainbowIndex],
          opacity: Math.min(0.9, item.opacity + 0.7 * intensity),
          radius: item.r + 1.3 * intensity,
        };
      });
  }, [dust, waveProgress, waveRadius]);

  const activeFilamentNodes = useMemo(() => {
    if (waveProgress <= 0) {
      return [];
    }

    return filamentNodes
      .filter((item) => Math.abs(item.d - waveRadius) < brightBand || (item.d < waveRadius && item.d > waveRadius - trailBand * 0.65))
      .map((item, index) => {
        const diff = Math.abs(item.d - waveRadius);
        const rainbowIndex = Math.floor((item.phase + waveProgress * 26) % RAINBOW.length);

        if (diff < brightBand) {
          const intensity = 1 - diff / brightBand;
          return {
            key: `f-${index}`,
            x: item.x,
            y: item.y,
            radius: item.r + 1.6 * intensity,
            color: RAINBOW[rainbowIndex],
            opacity: Math.min(1, item.opacity + 0.9 * intensity),
          };
        }

        const trailIntensity = 1 - (waveRadius - item.d) / (trailBand * 0.65);
        return {
          key: `f-${index}`,
          x: item.x,
          y: item.y,
          radius: item.r + 0.5 * trailIntensity,
          color: '#b9c7ff',
          opacity: Math.min(0.85, item.opacity + 0.2 * trailIntensity),
        };
      });
  }, [filamentNodes, waveProgress, waveRadius]);

  const activeLowerNodes = useMemo(() => {
    if (waveProgress <= 0) {
      return [];
    }

    return lowerNodes
      .filter((item) => Math.abs(item.d - waveRadius) < brightBand * 1.05 || (item.d < waveRadius && item.d > waveRadius - trailBand * 0.8))
      .map((item, index) => {
        const diff = Math.abs(item.d - waveRadius);
        const rainbowIndex = Math.floor((item.phase + waveProgress * 30) % RAINBOW.length);

        if (diff < brightBand * 1.05) {
          const intensity = 1 - diff / (brightBand * 1.05);
          return {
            key: `l-${index}`,
            x: item.x,
            y: item.y,
            radius: item.r + 1.8 * intensity,
            color: RAINBOW[rainbowIndex],
            opacity: Math.min(1, item.opacity + 0.9 * intensity),
          };
        }

        const trailIntensity = 1 - (waveRadius - item.d) / (trailBand * 0.8);
        return {
          key: `l-${index}`,
          x: item.x,
          y: item.y,
          radius: item.r + 0.6 * trailIntensity,
          color: '#8fb2ff',
          opacity: Math.min(0.86, item.opacity + 0.24 * trailIntensity),
        };
      });
  }, [lowerNodes, waveProgress, waveRadius]);

  const activeOrbitDust = useMemo(() => {
    if (waveProgress <= 0) {
      return [];
    }

    return orbitDust
      .filter((item) => Math.abs(item.d - waveRadius) < brightBand)
      .map((item, index) => {
        const diff = Math.abs(item.d - waveRadius);
        const intensity = 1 - diff / brightBand;
        const rainbowIndex = Math.floor((item.phase + waveProgress * 24) % RAINBOW.length);

        return {
          key: `o-${index}`,
          x: item.x,
          y: item.y,
          radius: item.r + 1.2 * intensity,
          color: RAINBOW[rainbowIndex],
          opacity: Math.min(0.95, item.opacity + 0.8 * intensity),
        };
      });
  }, [orbitDust, waveProgress, waveRadius]);

  const pulseOpacity = 0.92 * fadeCurve(waveProgress);
  const haloOpacity = 0.54 * fadeCurve(waveProgress);
  const pulseScale = 0.18 + waveProgress * 4.1;
  const haloScale = 0.28 + waveProgress * 4.9;
  const coreScale = 0.18 + waveProgress * 3.1;
  const rainbowSweepOpacity = 0.78 * fadeCurve(waveProgress);

  const lowerFilamentA = `M 0 ${height * 0.81} C ${width * 0.16} ${height * 0.7}, ${width * 0.42} ${height * 0.74}, ${width * 0.9} ${height * 0.9}`;
  const lowerFilamentB = `M ${width * 0.04} ${height * 0.86} C ${width * 0.26} ${height * 0.76}, ${width * 0.56} ${height * 0.8}, ${width} ${height * 0.74}`;
  const lowerFilamentC = `M ${width * 0.08} ${height * 0.94} C ${width * 0.34} ${height * 0.82}, ${width * 0.64} ${height * 0.88}, ${width} ${height * 0.8}`;

  return (
    <View pointerEvents="none" style={[styles.wrap, { width, height }]}>
      <StaticScene
        width={width}
        height={height}
        orbCx={orbCx}
        orbCy={orbCy}
        stars={stars}
        dust={dust}
        filamentNodes={filamentNodes}
        lowerNodes={lowerNodes}
        orbitDust={orbitDust}
      />

      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="rainbowRoadLive" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#ff43da" />
            <Stop offset="16%" stopColor="#ff6a2f" />
            <Stop offset="32%" stopColor="#ffcf2b" />
            <Stop offset="48%" stopColor="#f5ff5d" />
            <Stop offset="64%" stopColor="#5cff9a" />
            <Stop offset="80%" stopColor="#3ce0ff" />
            <Stop offset="90%" stopColor="#4f6fff" />
            <Stop offset="100%" stopColor="#a15bff" />
          </LinearGradient>
        </Defs>

        {waveProgress > 0 ? (
          <>
            <Path d={lowerFilamentA} stroke="url(#rainbowRoadLive)" strokeWidth={2.4} fill="none" opacity={rainbowSweepOpacity} />
            <Path d={lowerFilamentB} stroke="url(#rainbowRoadLive)" strokeWidth={2.1} fill="none" opacity={rainbowSweepOpacity * 0.86} />
            <Path d={lowerFilamentC} stroke="url(#rainbowRoadLive)" strokeWidth={1.8} fill="none" opacity={rainbowSweepOpacity * 0.72} />
          </>
        ) : null}

        <G>
          {activeDust.map((item) => (
            <Circle
              key={item.key}
              cx={item.x}
              cy={item.y}
              r={item.radius}
              fill={item.color}
              opacity={item.opacity}
            />
          ))}
        </G>

        <G>
          {activeStars.map((item) => (
            <Circle
              key={item.key}
              cx={item.x}
              cy={item.y}
              r={item.radius}
              fill={item.color}
              opacity={item.opacity}
            />
          ))}
        </G>

        <G>
          {activeFilamentNodes.map((item) => (
            <Circle
              key={item.key}
              cx={item.x}
              cy={item.y}
              r={item.radius}
              fill={item.color}
              opacity={item.opacity}
            />
          ))}
        </G>

        <G>
          {activeLowerNodes.map((item) => (
            <Circle
              key={item.key}
              cx={item.x}
              cy={item.y}
              r={item.radius}
              fill={item.color}
              opacity={item.opacity}
            />
          ))}
        </G>

        <G>
          {activeOrbitDust.map((item) => (
            <Circle
              key={item.key}
              cx={item.x}
              cy={item.y}
              r={item.radius}
              fill={item.color}
              opacity={item.opacity}
            />
          ))}
        </G>
      </Svg>

      <View
        style={[
          styles.wavePulse,
          {
            left: waveOriginX - 34,
            top: waveOriginY - 34,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />

      <View
        style={[
          styles.waveHalo,
          {
            left: waveOriginX - 28,
            top: waveOriginY - 28,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />

      <View
        style={[
          styles.waveCore,
          {
            left: waveOriginX - 18,
            top: waveOriginY - 18,
            opacity: pulseOpacity * 0.92,
            transform: [{ scale: coreScale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },

  wavePulse: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.8,
    borderColor: 'rgba(118, 103, 255, 0.88)',
    backgroundColor: 'rgba(124, 103, 255, 0.12)',
  },

  waveHalo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.2,
    borderColor: 'rgba(255, 179, 79, 0.74)',
    backgroundColor: 'rgba(255, 120, 76, 0.10)',
  },

  waveCore: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.8,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});