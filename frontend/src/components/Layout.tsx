import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200 pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}
