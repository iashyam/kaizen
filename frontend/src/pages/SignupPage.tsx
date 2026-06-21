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
    <div className="min-h-svh bg-surface-bg flex items-center justify-center px-4 transition-colors duration-300">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-txt-primary">Kaizen</h1>
          <p className="text-txt-secondary mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-card rounded-xl p-6 border border-brd space-y-4">
          {error && (
            <div className="bg-duo-red/10 border border-duo-red/20 text-duo-red text-sm rounded-xl px-4 py-2.5 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-txt-muted font-bold">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-surface-input border border-brd rounded-xl px-4 py-2.5 text-txt-primary mt-1 focus:outline-none focus:border-duo-green/50 focus:ring-2 focus:ring-duo-green/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-txt-muted font-bold">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-surface-input border border-brd rounded-xl px-4 py-2.5 text-txt-primary mt-1 focus:outline-none focus:border-duo-green/50 focus:ring-2 focus:ring-duo-green/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-txt-muted font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface-input border border-brd rounded-xl px-4 py-2.5 text-txt-primary mt-1 focus:outline-none focus:border-duo-green/50 focus:ring-2 focus:ring-duo-green/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-duo-green text-white font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-txt-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-duo-green font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
