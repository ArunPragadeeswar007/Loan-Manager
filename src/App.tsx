import React, { useState, useEffect } from 'react';
import { supabase, isConfigured as initialConfigured, ensureUserProfile, type Profile } from './supabase';
import { SetupAssistant } from './components/SetupAssistant';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

function App() {
  const [configured, setConfigured] = useState(initialConfigured);
  const [showSetup, setShowSetup] = useState(!initialConfigured);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-check configuration status when notified
  const handleConfigSaved = () => {
    setConfigured(true);
    setShowSetup(false);
    // Reload the window to ensure Supabase client re-initializes with the correct settings
    window.location.reload();
  };

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        syncProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await syncProfile(currentSession.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  // Helper to fetch/create profile
  const syncProfile = async (user: any) => {
    try {
      setLoading(true);
      // Ensure the profile exists in the database
      const userProfile = await ensureUserProfile(user.id, user.user_metadata, user.email);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error syncing profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div className="ambient-bg">
          <div className="ambient-blob-1"></div>
          <div className="ambient-blob-2"></div>
        </div>
        <div style={styles.loaderContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Initializing secure authentication...</p>
        </div>
      </div>
    );
  }

  // 1. If showSetup is forced (keys missing or developer clicked config settings)
  if (showSetup) {
    return <SetupAssistant onConfigSaved={handleConfigSaved} />;
  }

  // 2. If authenticated, show dashboard
  if (session?.user) {
    return (
      <Dashboard 
        user={session.user} 
        profile={profile} 
        onLogout={handleLogout} 
        onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
      />
    );
  }

  // 3. Otherwise, show login screen
  return (
    <Login 
      onShowSetup={() => setShowSetup(true)} 
      isConfigured={configured} 
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#05060f',
    color: '#fff',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(99, 102, 241, 0.1)',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    fontFamily: 'var(--font-heading)',
    fontWeight: '500',
  },
};

export default App;
