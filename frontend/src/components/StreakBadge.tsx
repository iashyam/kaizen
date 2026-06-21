import { Flame, Trophy } from 'lucide-react';

interface Props {
  current: number;
  longest: number;
}

export default function StreakBadge({ current, longest }: Props) {
  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="flex-1 flex items-center gap-3 bg-duo-orange/10 border border-duo-orange/20 px-4 py-3 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-duo-orange/20 flex items-center justify-center">
          <Flame size={20} className="text-duo-orange" />
        </div>
        <div>
          <div className="text-2xl font-black text-duo-orange">{current}</div>
          <div className="text-[11px] text-duo-orange/60 font-bold">Current Streak</div>
        </div>
      </div>
      <div className="flex-1 flex items-center gap-3 bg-duo-yellow/10 border border-duo-yellow/20 px-4 py-3 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-duo-yellow/20 flex items-center justify-center">
          <Trophy size={20} className="text-duo-yellow" />
        </div>
        <div>
          <div className="text-2xl font-black text-duo-yellow">{longest}</div>
          <div className="text-[11px] text-duo-yellow/60 font-bold">Best Streak</div>
        </div>
      </div>
    </div>
  );
}
