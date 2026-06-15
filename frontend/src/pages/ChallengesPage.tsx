import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChallenges, createChallenge, deleteChallenge, extendChallenge,
  getChallengeToday, getChallengeCalendar, getHabits,
} from '../api';
import type { Challenge, ChallengeMilestone } from '../api';
import { CATEGORY_CONFIG } from '../models/habit';
import {
  Plus, X, Trash2, Flame, Trophy, ChevronDown,
  Swords, CheckCircle2, Circle, Shield, Zap, Target,
  Crown, Star, Flag, ArrowRight, Sparkles, RotateCcw, Share2,
} from 'lucide-react';
import CelebrationModal, { type CelebrationData } from '../components/CelebrationModal';

function getStreakTier(streak: number) {
  if (streak >= 30) return { label: 'Legendary', color: 'text-amber-300', bg: 'from-amber-500/20 to-yellow-500/10', border: 'border-amber-500/30', icon: Crown };
  if (streak >= 14) return { label: 'On Fire', color: 'text-orange-400', bg: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/30', icon: Flame };
  if (streak >= 7) return { label: 'Rising', color: 'text-violet-400', bg: 'from-violet-500/20 to-purple-500/10', border: 'border-violet-500/30', icon: Zap };
  if (streak >= 3) return { label: 'Building', color: 'text-sky-400', bg: 'from-sky-500/20 to-blue-500/10', border: 'border-sky-500/30', icon: Target };
  return { label: 'Starting', color: 'text-slate-400', bg: 'from-slate-500/15 to-slate-600/10', border: 'border-slate-600/30', icon: Shield };
}

const TARGET_PRESETS = [7, 14, 21, 30, 60, 90];

export default function ChallengesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: getChallenges,
  });

  const delMutation = useMutation({
    mutationFn: deleteChallenge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });

  const totalStreak = challenges?.reduce((s, c) => s + c.current_streak, 0) ?? 0;
  const activeCount = challenges?.filter(c => c.current_streak > 0).length ?? 0;

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/15 border border-orange-500/20 flex items-center justify-center">
            <Swords size={22} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent">
              Challenges
            </h1>
            <div className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">
              Don't break the chain
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`p-2.5 rounded-xl transition-all active:scale-90 ${
            showCreate ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
          }`}
        >
          {showCreate ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* Stats bar */}
      {challenges && challenges.length > 0 && (
        <div className="flex gap-2 mb-5 mt-4">
          <div className="flex-1 bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/40 flex items-center gap-2">
            <Swords size={14} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-200">{challenges.length}</span>
            <span className="text-[11px] text-slate-500">active</span>
          </div>
          <div className="flex-1 bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/40 flex items-center gap-2">
            <Flame size={14} className="text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{activeCount}</span>
            <span className="text-[11px] text-slate-500">on fire</span>
          </div>
          <div className="flex-1 bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/40 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{totalStreak}</span>
            <span className="text-[11px] text-slate-500">total</span>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateChallengeForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['challenges'] });
            setShowCreate(false);
          }}
        />
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && !challenges?.length && !showCreate && (
        <div className="text-center py-20">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/15 to-red-500/10 border border-orange-500/15 flex items-center justify-center mx-auto">
              <Swords size={40} className="text-orange-400/60" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
              <Plus size={14} className="text-amber-400" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-200 mb-1.5">No Challenges Yet</div>
          <div className="text-sm text-slate-500 mb-6 max-w-[240px] mx-auto">
            Group habits together and build unstoppable streaks
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm active:scale-95 transition-transform"
          >
            Create First Challenge
          </button>
        </div>
      )}

      <div className="space-y-3">
        {challenges?.map((c, i) => (
          <div key={c.id} className="animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
            <ChallengeCard
              challenge={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onDelete={() => {
                if (confirm(`Delete "${c.name}"?`)) delMutation.mutate(c.id);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChallengeCard({
  challenge, expanded, onToggle, onDelete,
}: {
  challenge: Challenge;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { data: today } = useQuery({
    queryKey: ['challenge-today', challenge.id],
    queryFn: () => getChallengeToday(challenge.id),
  });

  const todayProgress = today ? today.completed_count / Math.max(today.total_count, 1) : 0;
  const targetProgress = challenge.current_streak / Math.max(challenge.target_days, 1);
  const tier = getStreakTier(challenge.current_streak);
  const TierIcon = tier.icon;
  const isOnFire = challenge.current_streak >= 7;
  const allDone = today?.all_completed_today;
  const isCompleted = !!challenge.completed_at;

  return (
    <div className="overflow-hidden rounded-2xl">
      <button onClick={onToggle} className="w-full text-left">
        <div className={`relative p-4 transition-all border ${
          isCompleted
            ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border-amber-500/25'
            : allDone
              ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-emerald-500/25'
              : `bg-gradient-to-r ${tier.bg} ${tier.border}`
        } ${expanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}>
          {/* Background glow for active streaks */}
          {challenge.current_streak >= 7 && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-bl from-orange-500/[0.07] to-transparent rounded-full blur-xl" />
            </div>
          )}

          <div className="relative flex items-center gap-3.5">
            {/* Shield with streak */}
            <div className={`relative flex-shrink-0 ${isOnFire ? 'animate-shield-glow' : ''}`}>
              <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center ${
                isCompleted
                  ? 'bg-amber-500/20 border border-amber-500/30'
                  : allDone
                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : challenge.current_streak > 0
                      ? 'bg-gradient-to-br from-orange-500/25 to-amber-500/15 border border-orange-500/25'
                      : 'bg-slate-700/40 border border-slate-600/30'
              }`}>
                <svg width="52" height="52" viewBox="0 0 52 52" className="absolute -rotate-90">
                  <circle cx="26" cy="26" r="22" fill="none" stroke="currentColor" strokeWidth="3"
                    className="text-slate-700/30" />
                  <circle cx="26" cy="26" r="22" fill="none"
                    stroke={isCompleted ? '#f59e0b' : allDone ? '#10b981' : challenge.current_streak > 0 ? '#f97316' : '#475569'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - todayProgress)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className={`text-lg font-black relative z-10 ${
                  isCompleted ? 'text-amber-400'
                    : allDone ? 'text-emerald-400'
                      : challenge.current_streak > 0 ? 'text-orange-400' : 'text-slate-400'
                }`}>
                  {challenge.current_streak}
                </span>
              </div>
              {isOnFire && !isCompleted && (
                <div className="absolute -top-1.5 -right-1.5 animate-fire-dance">
                  <Flame size={16} className="text-orange-400 fill-orange-400/40" />
                </div>
              )}
              {isCompleted && (
                <div className="absolute -top-1.5 -right-1.5">
                  <Crown size={16} className="text-amber-400 fill-amber-400/20" />
                </div>
              )}
              {allDone && !isCompleted && (
                <div className="absolute -bottom-1 -right-1">
                  <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-500/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[15px] font-bold text-slate-100 truncate">{challenge.name}</div>
                {isCompleted && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-bold uppercase flex-shrink-0">
                    Complete
                  </span>
                )}
              </div>

              {/* Tier badge + target */}
              <div className="flex items-center gap-1.5 mt-1">
                {challenge.current_streak > 0 && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isCompleted ? 'bg-amber-500/15 text-amber-400'
                      : allDone ? 'bg-emerald-500/15 text-emerald-400'
                        : `bg-slate-700/50 ${tier.color}`
                  }`}>
                    <TierIcon size={10} />
                    {isCompleted ? 'Champion' : allDone ? 'Completed' : tier.label}
                  </div>
                )}
                <span className="text-[11px] text-slate-500">
                  Day {challenge.current_streak}/{challenge.target_days}
                </span>
              </div>

              {/* Target progress bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden relative">
                  {/* Milestone markers */}
                  {challenge.milestones?.map(m => (
                    <div
                      key={m.days}
                      className={`absolute top-0 h-full w-px ${m.reached ? 'bg-amber-400/60' : 'bg-slate-500/30'}`}
                      style={{ left: `${(m.days / challenge.target_days) * 100}%` }}
                    />
                  ))}
                  <div
                    className={`h-full rounded-full transition-all duration-700 relative ${
                      isCompleted
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : allDone
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-orange-500 to-amber-400'
                    }`}
                    style={{ width: `${Math.min(targetProgress * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 font-medium tabular-nums w-8 text-right">
                  {Math.round(targetProgress * 100)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-0.5 text-[11px] text-slate-600">
                <Trophy size={10} />
                <span>{challenge.longest_streak}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <ExpandedChallenge challenge={challenge} today={today} onDelete={onDelete} />
      )}
    </div>
  );
}

function ExpandedChallenge({
  challenge, today, onDelete,
}: {
  challenge: Challenge;
  today: any;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [showCelebration, setShowCelebration] = useState(false);

  const extendMutation = useMutation({
    mutationFn: (extra: number) => extendChallenge(challenge.id, extra),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 34);
  const startStr = start.toISOString().split('T')[0];
  const endStr = now.toISOString().split('T')[0];

  const { data: calData } = useQuery({
    queryKey: ['challenge-calendar', challenge.id, startStr, endStr],
    queryFn: () => getChallengeCalendar(challenge.id, startStr, endStr),
  });

  const completedDates = new Set(calData?.map(d => d.date) ?? []);

  const tier = getStreakTier(challenge.current_streak);
  const isCompleted = !!challenge.completed_at;

  return (
    <div className="bg-slate-800/60 border border-t-0 border-slate-700/40 rounded-b-2xl p-4 space-y-4 animate-fade-in-up">
      {/* Completion banner */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/20 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles size={18} className="text-amber-400" />
            <span className="text-base font-bold text-amber-300">Challenge Complete!</span>
            <Sparkles size={18} className="text-amber-400" />
          </div>
          <div className="text-xs text-amber-400/60 mb-3">
            Completed on {new Date(challenge.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setShowCelebration(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold active:scale-95 transition-transform flex items-center gap-2"
            >
              <Share2 size={14} />
              Share Achievement
            </button>
            <button
              onClick={() => extendMutation.mutate(30)}
              disabled={extendMutation.isPending}
              className="px-4 py-2 rounded-lg bg-slate-700/60 border border-amber-500/20 text-amber-400 text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowRight size={14} />
              +30 Days
            </button>
          </div>
        </div>
      )}

      {/* Today's habits checklist */}
      {today?.habits && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Target size={13} className="text-slate-500" />
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Today's Mission</span>
            {today.all_completed_today && (
              <span className="ml-auto text-[10px] text-emerald-400 font-bold uppercase">All Clear</span>
            )}
          </div>
          <div className="space-y-0.5">
            {today.habits.map((h: any) => {
              const cat = CATEGORY_CONFIG[h.category] || CATEGORY_CONFIG.custom;
              return (
                <div
                  key={h.habit_id}
                  className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${
                    h.completed ? 'bg-emerald-500/[0.06]' : 'bg-transparent'
                  }`}
                >
                  {h.completed ? (
                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-slate-600 flex-shrink-0" />
                  )}
                  <span className="text-sm">{cat.icon}</span>
                  <span className={`text-sm flex-1 ${
                    h.completed ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-200'
                  }`}>
                    {h.name}
                  </span>
                  {h.completed && (
                    <Star size={12} className="text-amber-400/50 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestone Journey */}
      {challenge.milestones && challenge.milestones.length > 0 && (
        <MilestoneTimeline
          milestones={challenge.milestones}
          currentStreak={challenge.current_streak}
          targetDays={challenge.target_days}
          startedAt={challenge.started_at}
          completedAt={challenge.completed_at}
        />
      )}

      {/* Streak stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-orange-500/15 to-red-500/5 border border-orange-500/15 rounded-xl p-3 text-center">
          <Flame size={16} className={`mx-auto mb-1 text-orange-400 ${challenge.current_streak >= 7 ? 'animate-fire-dance' : ''}`} />
          <div className="text-xl font-black text-orange-400">{challenge.current_streak}</div>
          <div className="text-[10px] text-orange-400/50 font-semibold uppercase">Current</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/15 to-yellow-500/5 border border-amber-500/15 rounded-xl p-3 text-center">
          <Trophy size={16} className="text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-black text-amber-400">{challenge.longest_streak}</div>
          <div className="text-[10px] text-amber-400/50 font-semibold uppercase">Best</div>
        </div>
        <div className={`bg-gradient-to-br ${tier.bg} border ${tier.border} rounded-xl p-3 text-center`}>
          <Shield size={16} className={`${tier.color} mx-auto mb-1`} />
          <div className={`text-[13px] font-black ${tier.color}`}>{tier.label}</div>
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Rank</div>
        </div>
      </div>

      {/* Date info */}
      <div className="flex gap-2 text-[11px]">
        {challenge.started_at && (
          <div className="flex-1 bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-700/30">
            <div className="text-slate-600 uppercase font-semibold text-[9px] mb-0.5">Started</div>
            <div className="text-slate-400 font-medium">
              {new Date(challenge.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        )}
        <div className="flex-1 bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-700/30">
          <div className="text-slate-600 uppercase font-semibold text-[9px] mb-0.5">Target</div>
          <div className="text-slate-400 font-medium">{challenge.target_days} days</div>
        </div>
        <div className="flex-1 bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-700/30">
          <div className="text-slate-600 uppercase font-semibold text-[9px] mb-0.5">Remaining</div>
          <div className={`font-medium ${isCompleted ? 'text-amber-400' : 'text-slate-400'}`}>
            {isCompleted ? 'Done!' : `${Math.max(challenge.target_days - challenge.current_streak, 0)}d`}
          </div>
        </div>
      </div>

      {/* Battle Log - horizontal scrollable streak visualization */}
      <BattleLog completedDates={completedDates} endStr={endStr} />

      <button
        onClick={onDelete}
        className="flex items-center gap-2 text-red-400/60 hover:text-red-400 text-xs px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all w-full justify-center border border-transparent hover:border-red-500/10"
      >
        <Trash2 size={13} />
        Delete Challenge
      </button>

      {/* Also add share for non-completed but all-done-today */}
      {!isCompleted && today?.all_completed_today && (
        <button
          onClick={() => setShowCelebration(true)}
          className="flex items-center gap-2 text-emerald-400 text-xs px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 transition-all w-full justify-center border border-emerald-500/15 font-semibold"
        >
          <Share2 size={13} />
          Share Today's Progress
        </button>
      )}

      {showCelebration && (
        <CelebrationModal
          data={{
            type: 'challenge',
            challengeName: challenge.name,
            targetDays: challenge.target_days,
            currentStreak: challenge.current_streak,
            longestStreak: challenge.longest_streak,
            completedDate: challenge.completed_at
              ? challenge.completed_at.split('T')[0]
              : new Date().toISOString().split('T')[0],
          }}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}

function MilestoneTimeline({
  milestones, currentStreak, targetDays, startedAt, completedAt,
}: {
  milestones: ChallengeMilestone[];
  currentStreak: number;
  targetDays: number;
  startedAt?: string | null;
  completedAt?: string | null;
}) {
  const progress = currentStreak / Math.max(targetDays, 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Flag size={13} className="text-slate-500" />
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Journey</span>
      </div>

      <div className="relative">
        {/* The track */}
        <div className="relative h-14 mx-2">
          {/* Background track */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-slate-700/50 rounded-full" />
          {/* Filled track */}
          <div
            className={`absolute top-6 left-0 h-1 rounded-full transition-all duration-700 ${
              completedAt
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
                : 'bg-gradient-to-r from-orange-500 to-amber-400'
            }`}
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />

          {/* Start marker */}
          <div className="absolute left-0 top-3.5 flex flex-col items-center" style={{ transform: 'translateX(-4px)' }}>
            <div className="w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-500 z-10" />
            <span className="text-[9px] text-slate-600 mt-1.5 font-medium">0</span>
          </div>

          {/* Milestone markers */}
          {milestones.map((m) => {
            const pos = (m.days / targetDays) * 100;
            if (pos > 100) return null;
            return (
              <div
                key={m.days}
                className="absolute top-3.5 flex flex-col items-center"
                style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
              >
                <div className={`relative z-10 transition-all ${m.reached ? 'scale-110' : ''}`}>
                  {m.reached ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-300/50 shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-600" />
                  )}
                </div>
                <span className={`text-[9px] mt-1.5 font-bold ${
                  m.reached ? 'text-amber-400' : 'text-slate-600'
                }`}>
                  {m.days}d
                </span>
              </div>
            );
          })}

          {/* Target/finish marker */}
          <div className="absolute right-0 top-2.5 flex flex-col items-center" style={{ transform: 'translateX(4px)' }}>
            {completedAt ? (
              <Crown size={16} className="text-amber-400 z-10" />
            ) : (
              <Flag size={14} className="text-slate-500 z-10" />
            )}
            <span className={`text-[9px] mt-1 font-bold ${completedAt ? 'text-amber-400' : 'text-slate-500'}`}>
              {targetDays}d
            </span>
          </div>

          {/* Current position indicator */}
          {currentStreak > 0 && !completedAt && (
            <div
              className="absolute top-1 flex flex-col items-center z-20"
              style={{ left: `${Math.min(progress * 100, 100)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="animate-pulse-ring">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-red-500 border-2 border-orange-300/50 flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.5)]">
                  <Flame size={10} className="text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BattleLog({ completedDates, endStr }: { completedDates: Set<string>; endStr: string }) {
  // Build last 35 days
  const days: { date: string; label: string; dayNum: number; isToday: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.push({
      date: ds,
      label: dayNames[d.getDay()],
      dayNum: d.getDate(),
      isToday: ds === endStr,
    });
  }

  // Group into weeks (chunks of 7)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Count streaks for intensity
  let consecutiveDone = 0;
  const streakAt = new Map<string, number>();
  for (const day of days) {
    if (completedDates.has(day.date)) {
      consecutiveDone++;
    } else {
      consecutiveDone = 0;
    }
    streakAt.set(day.date, consecutiveDone);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Swords size={13} className="text-slate-500" />
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Battle Log</span>
        <span className="ml-auto text-[10px] text-slate-600">Last 5 weeks</span>
      </div>

      {/* Horizontal scrollable weeks */}
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1.5">
            {week.map(day => {
              const done = completedDates.has(day.date);
              const streak = streakAt.get(day.date) ?? 0;
              // Intensity based on streak length at that point
              const intensity = done
                ? streak >= 7 ? 'bg-emerald-400/50 ring-1 ring-emerald-400/30 shadow-[0_0_6px_rgba(52,211,153,0.3)]'
                  : streak >= 3 ? 'bg-emerald-500/35 ring-1 ring-emerald-500/20'
                    : 'bg-emerald-500/20'
                : day.isToday ? 'bg-orange-500/15 ring-1 ring-orange-500/30'
                  : 'bg-slate-800/30';

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                  {wi === 0 && (
                    <span className="text-[8px] text-slate-600 font-medium">{day.label}</span>
                  )}
                  <div
                    className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${intensity}`}
                  >
                    <span className={`text-[10px] font-semibold ${
                      done
                        ? streak >= 7 ? 'text-emerald-300' : 'text-emerald-400'
                        : day.isToday ? 'text-orange-400'
                          : 'text-slate-600'
                    }`}>
                      {day.dayNum}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2.5 justify-end">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-800/30" />
          <span className="text-[9px] text-slate-600">Miss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20" />
          <span className="text-[9px] text-slate-600">Done</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/35 ring-1 ring-emerald-500/20" />
          <span className="text-[9px] text-slate-600">3+ streak</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400/50 shadow-[0_0_4px_rgba(52,211,153,0.3)]" />
          <span className="text-[9px] text-slate-600">7+ fire</span>
        </div>
      </div>
    </div>
  );
}

function CreateChallengeForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [targetDays, setTargetDays] = useState(30);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: getHabits,
  });

  const mutation = useMutation({
    mutationFn: createChallenge,
    onSuccess: onCreated,
  });

  const toggleHabit = (id: string) => {
    setSelectedHabits(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedHabits.length === 0) return;
    mutation.mutate({ name: name.trim(), habit_ids: selectedHabits, target_days: targetDays });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/80 backdrop-blur rounded-2xl p-5 mb-5 border border-orange-500/15 space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-1">
        <Swords size={16} className="text-orange-400" />
        <span className="text-sm font-bold text-slate-200">New Challenge</span>
      </div>

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Challenge name (e.g., 30 Day Fitness)"
        autoFocus
        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 text-[15px]"
      />

      {/* Target days selector */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Flag size={12} className="text-slate-500" />
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Target Duration</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TARGET_PRESETS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setTargetDays(d)}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                targetDays === d
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-slate-700/40 text-slate-400 border border-transparent hover:bg-slate-700/60'
              }`}
            >
              {d}d
            </button>
          ))}
          <div className="relative">
            <input
              type="number"
              min={1}
              max={365}
              value={!TARGET_PRESETS.includes(targetDays) ? targetDays : ''}
              onChange={e => {
                const v = parseInt(e.target.value);
                if (v > 0 && v <= 365) setTargetDays(v);
              }}
              placeholder="Custom"
              className={`w-20 px-3 py-2 rounded-xl text-sm font-bold text-center transition-all bg-slate-700/40 border placeholder-slate-600 focus:outline-none ${
                !TARGET_PRESETS.includes(targetDays)
                  ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                  : 'text-slate-400 border-transparent'
              }`}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">
          Select Habits
          {selectedHabits.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 normal-case tracking-normal">
              {selectedHabits.length}
            </span>
          )}
        </div>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {habits?.map(h => {
            const cat = CATEGORY_CONFIG[h.category] || CATEGORY_CONFIG.custom;
            const selected = selectedHabits.includes(h.id);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHabit(h.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  selected
                    ? 'bg-orange-500/10 border border-orange-500/25'
                    : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected ? 'bg-orange-500 text-white' : 'border border-slate-600'
                }`}>
                  {selected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{cat.icon}</span>
                <span className="text-sm text-slate-200 flex-1">{h.name}</span>
                <span className={`text-[10px] ${cat.text} opacity-50`}>{cat.label}</span>
              </button>
            );
          })}
          {!habits?.length && (
            <div className="text-sm text-slate-500 text-center py-4">Create some habits first</div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending || !name.trim() || selectedHabits.length === 0}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Swords size={16} />
        Start {targetDays}-Day Challenge
      </button>
    </form>
  );
}
