import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      const message = (err as { message?: string }).message ?? 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Admin Access</p>
          <h1>Vendor Management</h1>
          <p className="muted">
            Secure access for campus ops. Tokens are kept in memory only.
          </p>
        </div>

        <form onSubmit={onSubmit} className="stack">
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="admin"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>

          {error ? <p className="alert">{error}</p> : null}

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
