import { Flame } from 'lucide-react';
import type { CSSProperties } from 'react';

import { getStreakTier } from '@/utils/streak';

export const STREAK_CARD_WIDTH = 1200;
export const STREAK_CARD_HEIGHT = 630;

interface StreakCardProps {
  streakDays: number;
  bestStreak: number;
  totalFocusLabel: string;
}

/**
 * Fixed-size branded card rendered to PNG for sharing.
 * Inline styles only — it must look identical when rasterized.
 */
const StreakCard = ({ streakDays, bestStreak, totalFocusLabel }: StreakCardProps) => {
  const tier = getStreakTier(streakDays);

  const glow = (color: string, position: CSSProperties): CSSProperties => ({
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
    filter: 'blur(40px)',
    ...position,
  });

  return (
    <div
      style={{
        width: STREAK_CARD_WIDTH,
        height: STREAK_CARD_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0b1020 0%, #131a33 55%, #0d1226 100%)',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={glow(tier.from, { top: -220, right: -140 })} />
      <div style={glow(tier.to, { bottom: -260, left: -160 })} />

      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 64px 40px',
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src="/assets/android-chrome-192x192.png"
              alt=""
              width={56}
              height={56}
              style={{ borderRadius: 14, display: 'block' }}
            />
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.18em' }}>
              UNITRACKER
            </span>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '10px 22px',
              borderRadius: 999,
              color: '#0b1020',
              background: `linear-gradient(90deg, ${tier.from}, ${tier.to})`,
            }}
          >
            {tier.name}
          </div>
        </div>

        {/* main */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 48 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
              <span
                style={{
                  fontSize: 190,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: tier.from,
                }}
              >
                {streakDays}
              </span>
              <span style={{ fontSize: 44, fontWeight: 600, color: '#cbd5e1' }}>
                day{streakDays === 1 ? '' : 's'}
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 600, color: '#e2e8f0', marginTop: 4 }}>
              study streak
            </div>
            <div style={{ fontSize: 24, color: '#94a3b8', marginTop: 22 }}>
              {totalFocusLabel} focused · {bestStreak}-day best
            </div>
          </div>

          {/* flame badge */}
          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: '50%',
              padding: 10,
              background: `linear-gradient(135deg, ${tier.from}, ${tier.to})`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#0d1226',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={150} color={tier.from} fill={tier.to} strokeWidth={1.4} />
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            borderTop: '1px solid rgba(148, 163, 184, 0.25)',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 600, color: '#e2e8f0' }}>
            Track your study streak free
          </span>
          <span style={{ fontSize: 26, fontWeight: 800, color: tier.from }}>
            unitracker.me
          </span>
        </div>
      </div>
    </div>
  );
};

export default StreakCard;
