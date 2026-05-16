import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function ProtectedRoute({ children, navigate }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (!isSupabaseConfigured) {
        setAllowed(false);
        setLoading(false);
        navigate('/login');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setAllowed(true);
        setLoading(false);
      } else {
        setAllowed(false);
        setLoading(false);
        navigate('/login');
      }
    }

    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/login');
      setAllowed(Boolean(session));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) return <main className="route-loading">Checking admin access...</main>;
  return allowed ? children : null;
}
