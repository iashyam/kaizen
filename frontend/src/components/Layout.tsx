import { useEffect, useRef, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

function useKeyboardHeight() {
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const kb = window.innerHeight - vv.height - vv.offsetTop;
      setKbHeight(Math.max(0, Math.round(kb)));
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  return kbHeight;
}

export default function Layout() {
  const kbHeight = useKeyboardHeight();
  const keyboardOpen = kbHeight > 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollStartY = useRef(0);

  // Dismiss keyboard on tap outside input
  const handleTap = useCallback((e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      (document.activeElement as HTMLElement)?.blur();
    }
  }, []);

  // Dismiss keyboard on scroll (iOS native behavior)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    scrollStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!keyboardOpen) return;
    const deltaY = e.touches[0].clientY - scrollStartY.current;
    // Scrolling down with keyboard open = dismiss
    if (deltaY > 10) {
      (document.activeElement as HTMLElement)?.blur();
    }
  }, [keyboardOpen]);

  // Auto-scroll focused input into view when keyboard opens
  useEffect(() => {
    if (!keyboardOpen || !scrollRef.current) return;
    const el = document.activeElement as HTMLElement;
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [keyboardOpen]);

  return (
    <div
      className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200 overflow-hidden"
      onClick={handleTap}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-y-contain"
        style={{
          paddingBottom: keyboardOpen ? kbHeight : undefined,
          transition: 'padding-bottom 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <Outlet />
        {/* Spacer for bottom nav when keyboard is closed */}
        {!keyboardOpen && (
          <div className="h-[calc(5rem+env(safe-area-inset-bottom))]" />
        )}
      </div>
      {!keyboardOpen && <BottomNav />}
    </div>
  );
}
