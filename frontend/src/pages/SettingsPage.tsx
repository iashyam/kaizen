import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSettings, updateSettings,
  getVapidPublicKey, subscribePush, testNotification,
  withdrawSavings,
} from '../api';
import { Bell, BellRing, Send, Wallet, MessageCircle, Smartphone, PiggyBank, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
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
      <h1 className="text-2xl font-bold text-slate-100 mb-4">Settings</h1>

      {/* Budget */}
      <Section icon={<Wallet size={18} />} title="Budget" color="text-indigo-400">
        <label className="text-xs text-slate-500 font-medium">Daily Allowance (INR)</label>
        <div className="flex gap-2 mt-1.5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">&#8377;</span>
            <input
              type="number"
              value={allowance}
              onChange={e => setAllowance(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-8 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              saved
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </Section>

      {/* Withdraw Savings */}
      <Section icon={<PiggyBank size={18} />} title="Withdraw Savings" color="text-emerald-400">
        <p className="text-xs text-slate-500 leading-relaxed">
          Reset your budget period to today. Use this after you transfer your accumulated savings.
        </p>
        <button
          onClick={() => {
            if (confirm('Withdraw savings and reset budget period to today?')) {
              withdrawMutation.mutate();
            }
          }}
          disabled={withdrawMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
        >
          <PiggyBank size={16} />
          {withdrawMutation.isPending ? 'Resetting...' : withdrawMutation.isSuccess ? 'Done!' : 'Withdraw & Reset'}
        </button>
      </Section>

      {/* Push Notifications */}
      <Section icon={<Smartphone size={18} />} title="Push Notifications" color="text-violet-400">
        <button
          onClick={handleEnablePush}
          disabled={pushEnabled}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            pushEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700 active:scale-[0.98]'
          }`}
        >
          {pushEnabled ? <BellRing size={18} /> : <Bell size={18} />}
          {pushEnabled ? 'Push Notifications Enabled' : 'Enable Push Notifications'}
        </button>
      </Section>

      {/* Telegram */}
      <Section icon={<MessageCircle size={18} />} title="Telegram" color="text-blue-400">
        <label className="text-xs text-slate-500 font-medium">Chat ID</label>
        <input
          type="text"
          value={chatId}
          onChange={e => setChatId(e.target.value)}
          onBlur={handleSaveSettings}
          placeholder="Send /start to your bot to get this"
          className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 mt-1.5 focus:outline-none focus:border-indigo-500/50"
        />

        <button
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
          className="mt-3 flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
        >
          <Send size={14} />
          {testMutation.isPending ? 'Sending...' : 'Send Test'}
        </button>
        {testMutation.data && (
          <pre className="text-xs text-slate-500 bg-slate-900/50 rounded-lg p-3 overflow-auto mt-2 border border-slate-800">
            {JSON.stringify(testMutation.data, null, 2)}
          </pre>
        )}
      </Section>

      {/* Account */}
      <Section icon={<LogOut size={18} />} title="Account" color="text-red-400">
        {user && (
          <p className="text-xs text-slate-500">Signed in as <span className="text-slate-400">{user.email}</span></p>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
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
    <section className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/30 space-y-3">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-sm font-semibold">{title}</span>
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
