import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import Confetti from './Confetti';

interface DailyCompletionData {
  type: 'daily';
  date: string;
  totalTasks: number;
  habitsCount: number;
  todosCount: number;
}

interface ChallengeCompletionData {
  type: 'challenge';
  challengeName: string;
  targetDays: number;
  currentStreak: number;
  longestStreak: number;
  completedDate: string;
}

export type CelebrationData = DailyCompletionData | ChallengeCompletionData;

const CAPTIONS_DAILY = [
  'Crushed it today!',
  'All tasks demolished!',
  'Zero tasks left standing!',
  'Today was a W!',
  'Clean sweep!',
  'Nothing left undone!',
  'Full send today!',
];

const CAPTIONS_CHALLENGE = [
  'Challenge conquered!',
  'Mission accomplished!',
  'Beast mode: complete!',
  'Consistency pays off!',
  'Challenge? What challenge?',
  'Absolutely smashed it!',
];

function pickCaption(list: string[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDailyCard(ctx: CanvasRenderingContext2D, data: DailyCompletionData, caption: string) {
  const W = 600, H = 800;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(0.5, '#1e1b4b');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 32);
  ctx.fill();

  // Decorative circles
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(480, 120, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(120, 650, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Top sparkles
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2728', 150, 120);
  ctx.fillText('\u2728', 450, 100);
  ctx.fillText('\u{1F389}', 300, 140);

  // Big celebration emoji
  ctx.font = '96px serif';
  ctx.fillText('\u{1F3C6}', 300, 280);

  // Caption
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#f0fdf4';
  ctx.fillText(caption, 300, 350);

  // Date
  const dateObj = new Date(data.date + 'T12:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(dateStr, 300, 395);

  // Stats card
  const cardY = 440;
  const cardGrad = ctx.createLinearGradient(60, cardY, 540, cardY + 160);
  cardGrad.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
  cardGrad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');
  ctx.fillStyle = cardGrad;
  roundRect(ctx, 60, cardY, 480, 160, 20);
  ctx.fill();

  // Stats border
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
  ctx.lineWidth = 1;
  roundRect(ctx, 60, cardY, 480, 160, 20);
  ctx.stroke();

  // Stats content
  const statY = cardY + 50;
  ctx.textAlign = 'center';

  // Total
  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.fillText(`${data.totalTasks}`, 300, statY + 10);

  ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('tasks completed', 300, statY + 40);

  // Sub stats
  if (data.habitsCount > 0 && data.todosCount > 0) {
    ctx.font = '15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.fillText(`${data.habitsCount} habits`, 200, statY + 75);
    ctx.fillStyle = '#475569';
    ctx.fillText('\u00B7', 300, statY + 75);
    ctx.fillStyle = '#14b8a6';
    ctx.fillText(`${data.todosCount} tasks`, 400, statY + 75);
  }

  // Motivational text
  ctx.font = 'italic 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Every day counts. Keep going!', 300, 660);

  // Divider
  const divGrad = ctx.createLinearGradient(150, 695, 450, 695);
  divGrad.addColorStop(0, 'transparent');
  divGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.3)');
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, 695);
  ctx.lineTo(450, 695);
  ctx.stroke();

  // Branding
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('chal \u2022 daily progress', 300, 740);

  // Checkmark accent
  ctx.font = '20px serif';
  ctx.fillText('\u2705', 300, 770);
}

function drawChallengeCard(ctx: CanvasRenderingContext2D, data: ChallengeCompletionData, caption: string) {
  const W = 600, H = 800;

  // Background gradient - warmer for challenge
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(0.3, '#451a03');
  bg.addColorStop(0.7, '#1c1917');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 32);
  ctx.fill();

  // Decorative circles
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(480, 150, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(100, 600, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Sparkles
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2B50', 130, 110);
  ctx.fillText('\u2B50', 470, 130);
  ctx.fillText('\u{1F525}', 100, 200);
  ctx.fillText('\u{1F525}', 500, 180);

  // Crown/trophy
  ctx.font = '96px serif';
  ctx.fillText('\u{1F451}', 300, 270);

  // Caption
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#fef3c7';
  ctx.fillText(caption, 300, 345);

  // Challenge name
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#f59e0b';
  const name = data.challengeName.length > 25
    ? data.challengeName.slice(0, 22) + '...'
    : data.challengeName;
  ctx.fillText(`"${name}"`, 300, 395);

  // Stats cards
  const cardsY = 440;

  // Streak card
  const streakGrad = ctx.createLinearGradient(60, cardsY, 275, cardsY + 180);
  streakGrad.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
  streakGrad.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
  ctx.fillStyle = streakGrad;
  roundRect(ctx, 60, cardsY, 230, 180, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)';
  ctx.lineWidth = 1;
  roundRect(ctx, 60, cardsY, 230, 180, 20);
  ctx.stroke();

  // Target card
  const targetGrad = ctx.createLinearGradient(310, cardsY, 540, cardsY + 180);
  targetGrad.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
  targetGrad.addColorStop(1, 'rgba(234, 179, 8, 0.1)');
  ctx.fillStyle = targetGrad;
  roundRect(ctx, 310, cardsY, 230, 180, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.lineWidth = 1;
  roundRect(ctx, 310, cardsY, 230, 180, 20);
  ctx.stroke();

  // Streak content
  ctx.font = '32px serif';
  ctx.fillText('\u{1F525}', 175, cardsY + 50);

  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#f97316';
  ctx.fillText(`${data.currentStreak}`, 175, cardsY + 110);

  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#a16207';
  ctx.fillText('day streak', 175, cardsY + 140);

  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText(`best: ${data.longestStreak}`, 175, cardsY + 165);

  // Target content
  ctx.font = '32px serif';
  ctx.fillText('\u{1F3AF}', 425, cardsY + 50);

  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`${data.targetDays}`, 425, cardsY + 110);

  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#a16207';
  ctx.fillText('day target', 425, cardsY + 140);

  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#78716c';
  const compDate = new Date(data.completedDate + 'T12:00:00');
  ctx.fillText(compDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 425, cardsY + 165);

  // Motivational text
  ctx.font = 'italic 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText('Discipline is the bridge between goals and results.', 300, 680);

  // Divider
  const divGrad = ctx.createLinearGradient(150, 715, 450, 715);
  divGrad.addColorStop(0, 'transparent');
  divGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, 715);
  ctx.lineTo(450, 715);
  ctx.stroke();

  // Branding
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#57534e';
  ctx.fillText('chal \u2022 challenge complete', 300, 755);

  ctx.font = '20px serif';
  ctx.fillText('\u{1F3C5}', 300, 785);
}

export default function CelebrationModal({
  data,
  onClose,
}: {
  data: CelebrationData;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [caption] = useState(() =>
    data.type === 'daily' ? pickCaption(CAPTIONS_DAILY) : pickCaption(CAPTIONS_CHALLENGE)
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (data.type === 'daily') {
      drawDailyCard(ctx, data, caption);
    } else {
      drawChallengeCard(ctx, data, caption);
    }

    setImageUrl(canvas.toDataURL('image/png'));
  }, [data, caption]);

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) return;

      const file = new File([blob], 'celebration.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          text: caption,
          files: [file],
        });
      } else {
        // Fallback: download
        downloadImage();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        downloadImage();
      }
    }
  }, [caption]);

  const downloadImage = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `celebration-${new Date().toISOString().split('T')[0]}.png`;
    a.click();
  }, [imageUrl]);

  return (
    <>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up">
        <div className="relative w-full max-w-sm">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Card preview */}
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ display: imageUrl ? 'none' : 'block' }}
            />
            {imageUrl && (
              <img src={imageUrl} alt="Celebration card" className="w-full h-auto" />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleShare}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                data.type === 'daily'
                  ? 'bg-gradient-to-r from-indigo-500 to-emerald-500 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
              }`}
            >
              <Share2 size={16} />
              Share
            </button>
            <button
              onClick={downloadImage}
              className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors active:scale-95"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
