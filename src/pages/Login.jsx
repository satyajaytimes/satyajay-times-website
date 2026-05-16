import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function Login({ navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Supabase env variables missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    navigate('/admin');
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>सत्यजय टाइम्स</h1>
        <h2>Admin Login</h2>
        {error && <p className="form-error">{error}</p>}
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </main>
  );
}
