import { FC } from 'react';

// Animated dark/blue backdrop shared by the login page and the landing page:
// drifting colour orbs, a grid that only shows near the edges and light streaks.
const CSS = `
        @keyframes lg-drift-a { 0%,100% { transform: translate3d(-10%, -6%, 0) scale(1); } 33% { transform: translate3d(45%, 18%, 0) scale(1.25); } 66% { transform: translate3d(20%, 55%, 0) scale(0.9); } }
        @keyframes lg-drift-b { 0%,100% { transform: translate3d(10%, 8%, 0) scale(1.1); } 33% { transform: translate3d(-50%, -25%, 0) scale(0.9); } 66% { transform: translate3d(-20%, -60%, 0) scale(1.2); } }
        @keyframes lg-drift-c { 0%,100% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(-35%, 30%, 0) scale(1.3); } }
        @keyframes lg-hue { 0%,100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(40deg); } }
        @keyframes lg-grid { from { background-position: 0 0, 0 0; } to { background-position: 64px 64px, 64px 64px; } }
        @keyframes lg-streak-v { 0% { transform: translateY(-120%); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(1200%); opacity: 0; } }
        @keyframes lg-streak-h { 0% { transform: translateX(-120%); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateX(1200%); opacity: 0; } }
        @keyframes lg-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .lg-orb-a { animation: lg-drift-a 14s ease-in-out infinite; }
        .lg-orb-b { animation: lg-drift-b 17s ease-in-out infinite; }
        .lg-orb-c { animation: lg-drift-c 11s ease-in-out infinite; }
        .lg-colors { animation: lg-hue 12s ease-in-out infinite; }
        .lg-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 64px 64px;
          animation: lg-grid 8s linear infinite;
          -webkit-mask-image: radial-gradient(ellipse 45% 50% at 50% 50%, transparent 55%, #000 100%);
          mask-image: radial-gradient(ellipse 45% 50% at 50% 50%, transparent 55%, #000 100%);
        }
        .lg-streaks {
          -webkit-mask-image: radial-gradient(ellipse 45% 50% at 50% 50%, transparent 55%, #000 100%);
          mask-image: radial-gradient(ellipse 45% 50% at 50% 50%, transparent 55%, #000 100%);
        }
        .lg-streak-v { position: absolute; top: 0; width: 1px; height: 80px;
          background: linear-gradient(to bottom, transparent, var(--accent-primary), transparent);
          animation: lg-streak-v 6s linear infinite; }
        .lg-streak-h { position: absolute; left: 0; height: 1px; width: 80px;
          background: linear-gradient(to right, transparent, var(--accent-primary), transparent);
          animation: lg-streak-h 8s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lg-orb-a, .lg-orb-b, .lg-orb-c, .lg-colors, .lg-grid, .lg-streak-v, .lg-streak-h { animation: none !important; }
        }
`;

const AnimatedBackdrop: FC<{ fixed?: boolean }> = ({ fixed = false }) => (
  <>
    <style>{CSS}</style>
<div aria-hidden="true" className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0 -z-10 overflow-hidden`}>
        <div className="lg-colors absolute inset-0">
          <div
            className="lg-orb-a absolute -left-[10%] -top-[15%] h-[620px] w-[620px] rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 65%)' }}
          />
          <div
            className="lg-orb-b absolute -bottom-[20%] -right-[10%] h-[700px] w-[700px] rounded-full opacity-35 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent-deep, #187bcd) 0%, transparent 65%)' }}
          />
          <div
            className="lg-orb-c absolute right-[15%] top-[5%] h-[460px] w-[460px] rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #5E5CE6 0%, transparent 65%)' }}
          />
        </div>
        <div className="lg-grid absolute inset-0" />
        {/* Falling light streaks along the grid lines */}
        <div className="lg-streaks absolute inset-0">
          <span className="lg-streak-v" style={{ left: '10%', animationDelay: '0s' }} />
          <span className="lg-streak-v" style={{ left: '28%', animationDelay: '2.2s' }} />
          <span className="lg-streak-v" style={{ left: '66%', animationDelay: '1s' }} />
          <span className="lg-streak-v" style={{ left: '88%', animationDelay: '3.6s' }} />
          <span className="lg-streak-h" style={{ top: '22%', animationDelay: '0.8s' }} />
          <span className="lg-streak-h" style={{ top: '58%', animationDelay: '3s' }} />
          <span className="lg-streak-h" style={{ top: '84%', animationDelay: '5s' }} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />
      </div>
  </>
);

export default AnimatedBackdrop;
