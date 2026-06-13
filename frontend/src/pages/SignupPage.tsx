import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/', { replace: true });
    } catch {
      setError('Could not create account. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100">Life Tracker</h1>
          <p className="text-slate-500 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/30 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-slate-100 mt-1 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-slate-100 mt-1 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-slate-100 mt-1 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
