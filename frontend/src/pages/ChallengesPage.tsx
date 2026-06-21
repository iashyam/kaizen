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
  if (streak >= 30) return { label: 'Legendary', color: 'text-duo-yellow', bg: 'from-duo-yellow/20 to-duo-orange/10', border: 'border-duo-yellow/30', icon: Crown };
  if (streak >= 14) return { label: 'On Fire', color: 'text-duo-orange', bg: 'from-duo-orange/20 to-duo-red/10', border: 'border-duo-orange/30', icon: Flame };
  if (streak >= 7) return { label: 'Rising', color: 'text-duo-purple', bg: 'from-duo-purple/20 to-duo-purple/10', border: 'border-duo-purple/30', icon: Zap };
  if (streak >= 3) return { label: 'Building', color: 'text-duo-blue', bg: 'from-duo-blue/20 to-duo-blue/10', border: 'border-duo-blue/30', icon: Target };
  return { label: 'Starting', color: 'text-txt-muted', bg: 'from-surface-input/50 to-surface-input/30', border: 'border-brd', icon: Shield };
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
          <div className="w-11 h-11 rounded-xl bg-duo-orange/15 border border-duo-orange/25 flex items-center justify-center">
            <Swords size={22} className="text-duo-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-txt-primary">
              Challenges
            </h1>
            <div className="text-[11px] text-txt-muted font-bold tracking-wide uppercase">
              Don't break the chain
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`p-2.5 rounded-xl transition-all active:scale-90 ${
            showCreate ? 'bg-duo-red/10 text-duo-red' : 'bg-duo-orange/10 text-duo-orange'
          }`}
        >
          {showCreate ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* Stats bar */}
      {challenges && challenges.length > 0 && (
        <div className="flex gap-2 mb-5 mt-4">
          <div className="flex-1 bg-surface-card rounded-xl px-3 py-2.5 border border-brd flex items-center gap-2">
            <Swords size={14} className="text-txt-muted" />
            <span className="text-sm font-black text-txt-primary">{challenges.length}</span>
            <span className="text-[11px] text-txt-muted">active</span>
          </div>
          <div className="flex-1 bg-surface-card rounded-xl px-3 py-2.5 border border-brd flex items-center gap-2">
            <Flame size={14} className="text-duo-orange" />
            <span className="text-sm font-black text-duo-orange">{activeCount}</span>
            <span className="text-[11px] text-txt-muted">on fire</span>
          </div>
          <div className="flex-1 bg-surface-card rounded-xl px-3 py-2.5 border border-brd flex items-center gap-2">
            <Zap size={14} className="text-duo-yellow" />
            <span className="text-sm font-black text-duo-yellow">{totalStreak}</span>
            <span className="text-[11px] text-txt-muted">total</span>
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
          <div className="w-10 h-10 border-3 border-duo-orange border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && !challenges?.length && !showCreate && (
        <div className="text-center py-20 animate-bounce-in">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-xl bg-duo-orange/10 border border-duo-orange/15 flex items-center justify-center mx-auto">
              <Swords size={40} className="text-duo-orange/60" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-duo-yellow/15 border border-duo-yellow/20 flex items-center justify-center">
              <Plus size={14} className="text-duo-yellow" />
            </div>
          </div>
          <div className="text-lg font-black text-txt-primary mb-1.5">No Challenges Yet</div>
          <div className="text-sm text-txt-secondary mb-6 max-w-[240px] mx-auto">
            Group habits together and build unstoppable streaks
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl bg-duo-orange text-white font-bold text-sm active:scale-95 transition-transform"
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
    <div className="overflow-hidden rounded-xl">
      <button onClick={onToggle} className="w-full text-left">
        <div className={`relative p-4 transition-all border ${
          isCompleted
            ? 'bg-surface-card border-duo-yellow/25'
            : allDone
              ? 'bg-surface-card border-duo-green/25'
              : `bg-surface-card ${tier.border}`
        } ${expanded ? 'rounded-t-xl' : 'rounded-xl'}`}>
          {/* Background glow for active streaks */}
          {challenge.current_streak >= 7 && (
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-bl from-duo-orange/[0.07] to-transparent rounded-full blur-xl" />
            </div>
          )}

          <div className="relative flex items-center gap-3.5">
            {/* Shield with streak */}
            <div className={`relative flex-shrink-0 ${isOnFire ? 'animate-shield-glow' : ''}`}>
              <div className={`w-[60px] h-[60px] rounded-xl flex items-center justify-center ${
                isCompleted
                  ? 'bg-duo-yellow/15 border border-duo-yellow/30'
                  : allDone
                    ? 'bg-duo-green/15 border border-duo-green/30'
                    : challenge.current_streak > 0
                      ? 'bg-duo-orange/15 border border-duo-orange/25'
                      : 'bg-surface-input border border-brd'
              }`}>
                <svg width="52" height="52" viewBox="0 0 52 52" className="absolute -rotate-90">
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--border-color)" strokeWidth="3" />
                  <circle cx="26" cy="26" r="22" fill="none"
                    stroke={isCompleted ? '#FFC800' : allDone ? '#58CC02' : challenge.current_streak > 0 ? '#FF9600' : 'var(--border-color)'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - todayProgress)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className={`text-lg font-black relative z-10 ${
                  isCompleted ? 'text-duo-yellow'
                    : allDone ? 'text-duo-green'
                      : challenge.current_streak > 0 ? 'text-duo-orange' : 'text-txt-muted'
                }`}>
                  {challenge.current_streak}
                </span>
              </div>
              {isOnFire && !isCompleted && (
                <div className="absolute -top-1.5 -right-1.5 animate-fire-dance">
                  <Flame size={16} className="text-duo-orange fill-duo-orange/40" />
                </div>
              )}
              {isCompleted && (
                <div className="absolute -top-1.5 -right-1.5">
                  <Crown size={16} className="text-duo-yellow fill-duo-yellow/20" />
                </div>
              )}
              {allDone && !isCompleted && (
                <div className="absolute -bottom-1 -right-1">
                  <CheckCircle2 size={16} className="text-duo-green fill-duo-green/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[15px] font-bold text-txt-primary truncate">{challenge.name}</div>
                {isCompleted && (
                  <span className="px-1.5 py-0.5 rounded-full bg-duo-yellow/15 text-duo-yellow text-[9px] font-black uppercase flex-shrink-0">
                    Complete
                  </span>
                )}
              </div>

              {/* Tier badge + target */}
              <div className="flex items-center gap-1.5 mt-1">
                {challenge.current_streak > 0 && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isCompleted ? 'bg-duo-yellow/15 text-duo-yellow'
                      : allDone ? 'bg-duo-green/15 text-duo-green'
                        : `bg-surface-input ${tier.color}`
                  }`}>
                    <TierIcon size={10} />
                    {isCompleted ? 'Champion' : allDone ? 'Completed' : tier.label}
                  </div>
                )}
                <span className="text-[11px] text-txt-muted">
                  Day {challenge.current_streak}/{challenge.target_days}
                </span>
              </div>

              {/* Target progress bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-surface-input rounded-full overflow-hidden relative">
                  {challenge.milestones?.map(m => (
                    <div
                      key={m.days}
                      className={`absolute top-0 h-full w-px ${m.reached ? 'bg-duo-yellow/60' : 'bg-txt-muted/30'}`}
                      style={{ left: `${(m.days / challenge.target_days) * 100}%` }}
                    />
                  ))}
                  <div
                    className={`h-full rounded-full transition-all duration-700 relative ${
                      isCompleted
                        ? 'bg-gradient-to-r from-duo-yellow to-duo-orange'
                        : allDone
                          ? 'bg-duo-green'
                          : 'bg-gradient-to-r from-duo-orange to-duo-yellow'
                    }`}
                    style={{ width: `${Math.min(targetProgress * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-txt-muted font-bold tabular-nums w-8 text-right">
                  {Math.round(targetProgress * 100)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-0.5 text-[11px] text-txt-muted">
                <Trophy size={10} />
                <span>{challenge.longest_streak}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-txt-muted transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
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
    <div className="bg-surface-card border border-t-0 border-brd rounded-b-xl p-4 space-y-4 animate-fade-in-up">
      {/* Completion banner */}
      {isCompleted && (
        <div className="bg-duo-yellow/10 border border-duo-yellow/20 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles size={18} className="text-duo-yellow" />
            <span className="text-base font-black text-duo-yellow">Challenge Complete!</span>
            <Sparkles size={18} className="text-duo-yellow" />
          </div>
          <div className="text-xs text-duo-yellow/60 mb-3">
            Completed on {new Date(challenge.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setShowCelebration(true)}
              className="px-4 py-2 rounded-xl bg-duo-orange text-white text-sm font-bold active:scale-95 transition-transform flex items-center gap-2"
            >
              <Share2 size={14} />
              Share Achievement
            </button>
            <button
              onClick={() => extendMutation.mutate(30)}
              disabled={extendMutation.isPending}
              className="px-4 py-2 rounded-xl bg-surface-input border border-duo-yellow/20 text-duo-yellow text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2"
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
            <Target size={13} className="text-txt-muted" />
            <span className="text-xs text-txt-muted font-bold uppercase tracking-wider">Today's Mission</span>
            {today.all_completed_today && (
              <span className="ml-auto text-[10px] text-duo-green font-black uppercase">All Clear</span>
            )}
          </div>
          <div className="space-y-0.5">
            {today.habits.map((h: any) => {
              const cat = CATEGORY_CONFIG[h.category] || CATEGORY_CONFIG.custom;
              return (
                <div
                  key={h.habit_id}
                  className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${
                    h.completed ? 'bg-duo-green/[0.06]' : 'bg-transparent'
                  }`}
                >
                  {h.completed ? (
                    <CheckCircle2 size={18} className="text-duo-green flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-txt-muted flex-shrink-0" />
                  )}
                  <span className="text-sm">{cat.icon}</span>
                  <span className={`text-sm flex-1 ${
                    h.completed ? 'text-txt-muted line-through' : 'text-txt-primary'
                  }`}>
                    {h.name}
                  </span>
                  {h.completed && (
                    <Star size={12} className="text-duo-yellow/50 flex-shrink-0" />
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
        <div className="bg-duo-orange/10 border border-duo-orange/15 rounded-xl p-3 text-center">
          <Flame size={16} className={`mx-auto mb-1 text-duo-orange ${challenge.current_streak >= 7 ? 'animate-fire-dance' : ''}`} />
          <div className="text-xl font-black text-duo-orange">{challenge.current_streak}</div>
          <div className="text-[10px] text-duo-orange/50 font-bold uppercase">Current</div>
        </div>
        <div className="bg-duo-yellow/10 border border-duo-yellow/15 rounded-xl p-3 text-center">
          <Trophy size={16} className="text-duo-yellow mx-auto mb-1" />
          <div className="text-xl font-black text-duo-yellow">{challenge.longest_streak}</div>
          <div className="text-[10px] text-duo-yellow/50 font-bold uppercase">Best</div>
        </div>
        <div className={`bg-gradient-to-br ${tier.bg} border ${tier.border} rounded-xl p-3 text-center`}>
          <Shield size={16} className={`${tier.color} mx-auto mb-1`} />
          <div className={`text-[13px] font-black ${tier.color}`}>{tier.label}</div>
          <div className="text-[10px] text-txt-muted font-bold uppercase">Rank</div>
        </div>
      </div>

      {/* Date info */}
      <div className="flex gap-2 text-[11px]">
        {challenge.started_at && (
          <div className="flex-1 bg-surface-input rounded-xl px-3 py-2 border border-brd">
            <div className="text-txt-muted uppercase font-bold text-[9px] mb-0.5">Started</div>
            <div className="text-txt-secondary font-medium">
              {new Date(challenge.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        )}
        <div className="flex-1 bg-surface-input rounded-xl px-3 py-2 border border-brd">
          <div className="text-txt-muted uppercase font-bold text-[9px] mb-0.5">Target</div>
          <div className="text-txt-secondary font-medium">{challenge.target_days} days</div>
        </div>
        <div className="flex-1 bg-surface-input rounded-xl px-3 py-2 border border-brd">
          <div className="text-txt-muted uppercase font-bold text-[9px] mb-0.5">Remaining</div>
          <div className={`font-medium ${isCompleted ? 'text-duo-yellow' : 'text-txt-secondary'}`}>
            {isCompleted ? 'Done!' : `${Math.max(challenge.target_days - challenge.current_streak, 0)}d`}
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <BattleLog completedDates={completedDates} endStr={endStr} />

      <button
        onClick={onDelete}
        className="flex items-center gap-2 text-duo-red/60 hover:text-duo-red text-xs px-3 py-2 rounded-xl hover:bg-duo-red/10 transition-all w-full justify-center border border-transparent hover:border-duo-red/10 active:scale-95"
      >
        <Trash2 size={13} />
        Delete Challenge
      </button>

      {!isCompleted && today?.all_completed_today && (
        <button
          onClick={() => setShowCelebration(true)}
          className="flex items-center gap-2 text-duo-green text-xs px-3 py-2 rounded-xl bg-duo-green/10 hover:bg-duo-green/15 transition-all w-full justify-center border border-duo-green/15 font-bold active:scale-95"
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
        <Flag size={13} className="text-txt-muted" />
        <span className="text-xs text-txt-muted font-bold uppercase tracking-wider">Journey</span>
      </div>

      <div className="relative">
        <div className="relative h-14 mx-2">
          <div className="absolute top-6 left-0 right-0 h-1 bg-surface-input rounded-full" />
          <div
            className={`absolute top-6 left-0 h-1 rounded-full transition-all duration-700 ${
              completedAt
                ? 'bg-gradient-to-r from-duo-yellow via-duo-orange to-duo-yellow'
                : 'bg-gradient-to-r from-duo-orange to-duo-yellow'
            }`}
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />

          {/* Start marker */}
          <div className="absolute left-0 top-3.5 flex flex-col items-center" style={{ transform: 'translateX(-4px)' }}>
            <div className="w-3 h-3 rounded-full bg-surface-input border-2 border-brd z-10" />
            <span className="text-[9px] text-txt-muted mt-1.5 font-medium">0</span>
          </div>

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
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-duo-yellow to-duo-orange border-2 border-duo-yellow/50 shadow-[0_0_8px_rgba(255,200,0,0.4)]" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-surface-input border-2 border-brd" />
                  )}
                </div>
                <span className={`text-[9px] mt-1.5 font-bold ${
                  m.reached ? 'text-duo-yellow' : 'text-txt-muted'
                }`}>
                  {m.days}d
                </span>
              </div>
            );
          })}

          <div className="absolute right-0 top-2.5 flex flex-col items-center" style={{ transform: 'translateX(4px)' }}>
            {completedAt ? (
              <Crown size={16} className="text-duo-yellow z-10" />
            ) : (
              <Flag size={14} className="text-txt-muted z-10" />
            )}
            <span className={`text-[9px] mt-1 font-bold ${completedAt ? 'text-duo-yellow' : 'text-txt-muted'}`}>
              {targetDays}d
            </span>
          </div>

          {currentStreak > 0 && !completedAt && (
            <div
              className="absolute top-1 flex flex-col items-center z-20"
              style={{ left: `${Math.min(progress * 100, 100)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="animate-pulse-ring">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-duo-orange to-duo-red border-2 border-duo-orange/50 flex items-center justify-center shadow-[0_0_12px_rgba(255,150,0,0.5)]">
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

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

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
        <Swords size={13} className="text-txt-muted" />
        <span className="text-xs text-txt-muted font-bold uppercase tracking-wider">Battle Log</span>
        <span className="ml-auto text-[10px] text-txt-muted">Last 5 weeks</span>
      </div>

      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1.5">
            {week.map(day => {
              const done = completedDates.has(day.date);
              const streak = streakAt.get(day.date) ?? 0;
              const intensity = done
                ? streak >= 7 ? 'bg-duo-green/40 ring-1 ring-duo-green/30 shadow-[0_0_6px_rgba(88,204,2,0.3)]'
                  : streak >= 3 ? 'bg-duo-green/25 ring-1 ring-duo-green/20'
                    : 'bg-duo-green/15'
                : day.isToday ? 'bg-duo-orange/15 ring-1 ring-duo-orange/30'
                  : 'bg-surface-input';

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                  {wi === 0 && (
                    <span className="text-[8px] text-txt-muted font-medium">{day.label}</span>
                  )}
                  <div
                    className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${intensity}`}
                  >
                    <span className={`text-[10px] font-bold ${
                      done
                        ? streak >= 7 ? 'text-duo-green' : 'text-duo-green'
                        : day.isToday ? 'text-duo-orange'
                          : 'text-txt-muted'
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

      <div className="flex items-center gap-3 mt-2.5 justify-end">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-surface-input" />
          <span className="text-[9px] text-txt-muted">Miss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-duo-green/15" />
          <span className="text-[9px] text-txt-muted">Done</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-duo-green/25 ring-1 ring-duo-green/20" />
          <span className="text-[9px] text-txt-muted">3+ streak</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-duo-green/40 shadow-[0_0_4px_rgba(88,204,2,0.3)]" />
          <span className="text-[9px] text-txt-muted">7+ fire</span>
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
    <form onSubmit={handleSubmit} className="bg-surface-card rounded-xl p-5 mb-5 border border-duo-orange/15 space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-1">
        <Swords size={16} className="text-duo-orange" />
        <span className="text-sm font-bold text-txt-primary">New Challenge</span>
      </div>

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Challenge name (e.g., 30 Day Fitness)"
        autoFocus
        className="w-full bg-surface-input border border-brd rounded-xl px-4 py-3 text-txt-primary placeholder-txt-muted focus:outline-none focus:border-duo-orange/40 focus:ring-2 focus:ring-duo-orange/20 text-[15px] transition-all"
      />

      {/* Target days selector */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Flag size={12} className="text-txt-muted" />
          <span className="text-xs text-txt-muted font-bold uppercase tracking-wider">Target Duration</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TARGET_PRESETS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setTargetDays(d)}
              className={`px-3 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
                targetDays === d
                  ? 'bg-duo-orange/15 text-duo-orange border border-duo-orange/30'
                  : 'bg-surface-input text-txt-muted border border-transparent'
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
              className={`w-20 px-3 py-2 rounded-full text-sm font-bold text-center transition-all bg-surface-input border placeholder-txt-muted focus:outline-none ${
                !TARGET_PRESETS.includes(targetDays)
                  ? 'text-duo-orange border-duo-orange/30 bg-duo-orange/10'
                  : 'text-txt-muted border-transparent'
              }`}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs text-txt-muted font-bold mb-2 uppercase tracking-wider">
          Select Habits
          {selectedHabits.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-duo-orange/15 text-duo-orange normal-case tracking-normal">
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
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left active:scale-[0.98] ${
                  selected
                    ? 'bg-duo-orange/10 border border-duo-orange/25'
                    : 'bg-surface-input border border-transparent'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected ? 'bg-duo-orange text-white' : 'border-2 border-brd'
                }`}>
                  {selected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{cat.icon}</span>
                <span className="text-sm text-txt-primary flex-1">{h.name}</span>
                <span className={`text-[10px] ${cat.text}`}>{cat.label}</span>
              </button>
            );
          })}
          {!habits?.length && (
            <div className="text-sm text-txt-muted text-center py-4">Create some habits first</div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending || !name.trim() || selectedHabits.length === 0}
        className="w-full bg-duo-orange text-white py-3 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Swords size={16} />
        Start {targetDays}-Day Challenge
      </button>
    </form>
  );
}
