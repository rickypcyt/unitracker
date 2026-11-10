import { ClipboardCopy, Download, Loader2, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'react-toastify';

import StreakCard, { STREAK_CARD_HEIGHT, STREAK_CARD_WIDTH } from '@/components/share/StreakCard';
import BaseModal from '@/modals/shared/BaseModal';
import { useLaps, useTasksOnly } from '@/store/appStore';
import { durationToSeconds, formatHours, getStreakStats } from '@/utils/streak';

interface ShareStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareStreakModal = ({ isOpen, onClose }: ShareStreakModalProps) => {
  const { laps } = useLaps();
  const tasks = useTasksOnly();
  const cardRef = useRef<HTMLDivElement>(null);
  const [png, setPng] = useState<{ url: string; file: File } | null>(null);
  const [generating, setGenerating] = useState(false);

  const stats = useMemo(() => {
    const activity = [
      ...laps.map(l => l.created_at),
      ...tasks.filter(t => t.completed).map(t => t.completed_at),
    ];
    const totalSeconds = laps.reduce((acc, lap) => acc + durationToSeconds(lap.duration), 0);
    const { current, best } = getStreakStats(activity);
    return {
      streak: current,
      best: Math.max(best, current),
      totalFocusLabel: formatHours(totalSeconds),
    };
  }, [laps, tasks]);

  const canShareFiles = useMemo(() => {
    try {
      return (
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })
      );
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPng(null);
      return;
    }
    let cancelled = false;
    const generate = async () => {
      setGenerating(true);
      try {
        await document.fonts.ready;
        // give the logo <img> a tick to be available for rasterization
        await new Promise(r => setTimeout(r, 100));
        const node = cardRef.current;
        if (!node || cancelled) return;
        const url = await toPng(node, {
          pixelRatio: 2,
          width: STREAK_CARD_WIDTH,
          height: STREAK_CARD_HEIGHT,
          cacheBust: false,
        });
        if (cancelled) return;
        const blob = await (await fetch(url)).blob();
        setPng({ url, file: new File([blob], 'unitracker-streak.png', { type: 'image/png' }) });
      } catch (err) {
        console.error('Failed to generate streak image', err);
        toast.error('Could not generate the image. Try again.');
      } finally {
        if (!cancelled) setGenerating(false);
      }
    };
    void generate();
    return () => {
      cancelled = true;
    };
  }, [isOpen, stats.streak, stats.best, stats.totalFocusLabel]);

  const copyImage = async () => {
    if (!png) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': png.file }),
      ]);
      toast.success('Image copied — paste it in Discord, WhatsApp, anywhere (Ctrl+V)');
    } catch {
      downloadImage();
      toast.info('Clipboard blocked — image downloaded instead. Drag it into your chat.');
    }
  };

  const shareImage = async () => {
    if (!png) return;
    try {
      await navigator.share({
        files: [png.file],
        title: 'My UniTracker study streak',
        text: `${stats.streak}-day study streak on UniTracker — track yours free at unitracker.me`,
      });
    } catch {
      // user dismissed the share sheet
    }
  };

  const downloadImage = () => {
    if (!png) return;
    const a = document.createElement('a');
    a.href = png.url;
    a.download = `unitracker-streak-${stats.streak}days.png`;
    a.click();
  };

  const buttonClass =
    'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Share your streak" maxWidth="max-w-lg">
      {/* offscreen render target — rasterized at native size */}
      <div style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none' }}>
        <div ref={cardRef}>
          <StreakCard
            streakDays={stats.streak}
            bestStreak={stats.best}
            totalFocusLabel={stats.totalFocusLabel}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden bg-black/30 flex items-center justify-center min-h-[140px]">
        {png ? (
          <img src={png.url} alt="Your study streak card" className="w-full h-auto block" />
        ) : (
          <div className="flex items-center gap-2 text-[var(--text-secondary)] py-16">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">{generating ? 'Generating image…' : 'Preparing…'}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
        <button
          type="button"
          onClick={copyImage}
          disabled={!png}
          className={`${buttonClass} bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:opacity-50`}
        >
          <ClipboardCopy size={16} />
          Copy image
        </button>
        {canShareFiles && (
          <button
            type="button"
            onClick={shareImage}
            disabled={!png}
            className={`${buttonClass} border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50`}
          >
            <Share2 size={16} />
            Share…
          </button>
        )}
        <button
          type="button"
          onClick={downloadImage}
          disabled={!png}
          className={`${buttonClass} border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50`}
        >
          <Download size={16} />
          Download
        </button>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mt-3 text-center">
        Tip: copy the image, then paste it straight into Discord or WhatsApp.
      </p>
    </BaseModal>
  );
};

export default ShareStreakModal;
