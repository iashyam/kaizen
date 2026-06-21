import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSettings, updateSettings,
  getVapidPublicKey, subscribePush, testNotification,
  withdrawSavings,
} from '../api';
import { Bell, BellRing, Send, Wallet, MessageCircle, Smartphone, PiggyBank, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const [allowance, setAllowance] = useState('500');
  const [chatId, setChatId] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setAllowance(settings.daily_allowance.toString());
      setChatId(settings.telegram_chat_id || '');
    }
  }, [settings]);

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const testMutation = useMutation({ mutationFn: testNotification });

  const withdrawMutation = useMutation({
    mutationFn: withdrawSavings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleSaveSettings = () => {
    settingsMutation.mutate({
      daily_allowance: parseInt(allowance) || 500,
      telegram_chat_id: chatId,
    });
  };

  const handleEnablePush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const { public_key } = await getVapidPublicKey();
      if (!public_key) {
        alert('VAPID keys not configured on server');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });

      await subscribePush(subscription.toJSON());
      setPushEnabled(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  };

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-black text-txt-primary mb-4">Settings</h1>

      {/* Appearance */}
      <Section icon={isDark ? <Moon size={18} /> : <Sun size={18} />} title="Appearance" color="text-duo-purple">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-txt-primary">{isDark ? 'Dark Mode' : 'Light Mode'}</div>
            <div className="text-xs text-txt-muted mt-0.5">Toggle between light and dark themes</div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
              isDark ? 'bg-duo-purple/30' : 'bg-duo-green/30'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center shadow-md ${
              isDark ? 'left-7 bg-duo-purple' : 'left-1 bg-duo-green'
            }`}>
              {isDark ? <Moon size={12} className="text-white" /> : <Sun size={12} className="text-white" />}
            </div>
          </button>
        </div>
      </Section>

      {/* Budget */}
      <Section icon={<Wallet size={18} />} title="Budget" color="text-duo-blue">
        <label className="text-xs text-txt-muted font-bold">Daily Allowance (INR)</label>
        <div className="flex gap-2 mt-1.5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted">&#8377;</span>
            <input
              type="number"
              value={allowance}
              onChange={e => setAllowance(e.target.value)}
              className="w-full bg-surface-input border border-brd rounded-xl pl-8 pr-4 py-2.5 text-txt-primary focus:outline-none focus:border-duo-green/50 focus:ring-2 focus:ring-duo-green/20 transition-all"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              saved
                ? 'bg-duo-green/15 text-duo-green'
                : 'bg-duo-green text-white'
            }`}
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </Section>

      {/* Withdraw Savings */}
      <Section icon={<PiggyBank size={18} />} title="Withdraw Savings" color="text-duo-green">
        <p className="text-xs text-txt-muted leading-relaxed">
          Reset your budget period to today. Use this after you transfer your accumulated savings.
        </p>
        <button
          onClick={() => {
            if (confirm('Withdraw savings and reset budget period to today?')) {
              withdrawMutation.mutate();
            }
          }}
          disabled={withdrawMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-duo-green/10 hover:bg-duo-green/15 border border-duo-green/20 text-duo-green px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
        >
          <PiggyBank size={16} />
          {withdrawMutation.isPending ? 'Resetting...' : withdrawMutation.isSuccess ? 'Done!' : 'Withdraw & Reset'}
        </button>
      </Section>

      {/* Push Notifications */}
      <Section icon={<Smartphone size={18} />} title="Push Notifications" color="text-duo-purple">
        <button
          onClick={handleEnablePush}
          disabled={pushEnabled}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            pushEnabled
              ? 'bg-duo-green/10 text-duo-green border border-duo-green/20'
              : 'bg-surface-input text-txt-primary border border-brd active:scale-[0.98]'
          }`}
        >
          {pushEnabled ? <BellRing size={18} /> : <Bell size={18} />}
          {pushEnabled ? 'Push Notifications Enabled' : 'Enable Push Notifications'}
        </button>
      </Section>

      {/* Telegram */}
      <Section icon={<MessageCircle size={18} />} title="Telegram" color="text-duo-blue">
        <label className="text-xs text-txt-muted font-bold">Chat ID</label>
        <input
          type="text"
          value={chatId}
          onChange={e => setChatId(e.target.value)}
          onBlur={handleSaveSettings}
          placeholder="Send /start to your bot to get this"
          className="w-full bg-surface-input border border-brd rounded-xl px-4 py-2.5 text-txt-primary placeholder-txt-muted mt-1.5 focus:outline-none focus:border-duo-green/50 focus:ring-2 focus:ring-duo-green/20 transition-all"
        />

        <button
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
          className="mt-3 flex items-center gap-2 bg-surface-input border border-brd text-txt-primary px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
        >
          <Send size={14} />
          {testMutation.isPending ? 'Sending...' : 'Send Test'}
        </button>
        {testMutation.data && (
          <pre className="text-xs text-txt-muted bg-surface-input rounded-xl p-3 overflow-auto mt-2 border border-brd">
            {JSON.stringify(testMutation.data, null, 2)}
          </pre>
        )}
      </Section>

      {/* Account */}
      <Section icon={<LogOut size={18} />} title="Account" color="text-duo-red">
        {user && (
          <p className="text-xs text-txt-muted">Signed in as <span className="text-txt-secondary">{user.email}</span></p>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-duo-red/10 hover:bg-duo-red/15 border border-duo-red/20 text-duo-red px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </Section>

    </div>
  );
}

function Section({ icon, title, color, children }: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-card rounded-xl p-5 border border-brd space-y-3">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-sm font-bold">{title}</span>
      </div>
      {children}
    </section>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
