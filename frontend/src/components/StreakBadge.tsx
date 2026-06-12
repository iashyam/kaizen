import { Flame, Trophy, Target } from 'lucide-react';

interface Props {
  current: number;
  longest: number;
}

export default function StreakBadge({ current, longest }: Props) {
  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="flex-1 flex items-center gap-3 bg-gradient-to-br from-orange-500/15 to-red-500/10 border border-orange-500/20 px-4 py-3 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Flame size={20} className="text-orange-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-400">{current}</div>
          <div className="text-[11px] text-orange-400/60 font-medium">Current Streak</div>
        </div>
      </div>
      <div className="flex-1 flex items-center gap-3 bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border border-yellow-500/20 px-4 py-3 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Trophy size={20} className="text-yellow-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-400">{longest}</div>
          <div className="text-[11px] text-yellow-400/60 font-medium">Best Streak</div>
        </div>
      </div>
    </div>
  );
}
