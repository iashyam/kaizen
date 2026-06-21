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
    <nav className="bg-surface-card border-t border-brd pb-[var(--safe-bottom)] transition-colors duration-300">
      <div className="flex justify-around max-w-lg mx-auto py-2 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                isActive
                  ? 'text-duo-green bg-duo-green/10'
                  : 'text-txt-muted active:scale-90'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
