import { NavLink } from 'react-router-dom';
import { CalendarCheck, Flame, Wallet, Swords, Settings } from 'lucide-react';

const links = [
  { to: '/', icon: CalendarCheck, label: 'Today' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/budget', icon: Wallet, label: 'Budget' },
  { to: '/challenges', icon: Swords, label: 'Challenges' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 pb-[var(--safe-bottom)]">
      <div className="flex justify-around max-w-lg mx-auto py-2 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-slate-500 active:scale-95'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
