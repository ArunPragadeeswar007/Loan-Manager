import React, { useState } from 'react';
import { Settings, Database, Key, CheckCircle, Info, Copy, Check, ShieldAlert } from 'lucide-react';

interface SetupAssistantProps {
  onConfigSaved: () => void;
}

export function SetupAssistant({ onConfigSaved }: SetupAssistantProps) {
  const [activeTab, setActiveTab] = useState<'keys' | 'sql' | 'google'>('keys');
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('LOAN_MANAGER_SUPABASE_URL') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('LOAN_MANAGER_SUPABASE_ANON_KEY') || '');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sqlCode = `-- Create profiles table in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger function to automatically create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('LOAN_MANAGER_SUPABASE_URL', supabaseUrl.trim());
      localStorage.setItem('LOAN_MANAGER_SUPABASE_ANON_KEY', supabaseKey.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onConfigSaved();
      }, 1500);
    }
  };

  const handleClearKeys = () => {
    localStorage.removeItem('LOAN_MANAGER_SUPABASE_URL');
    localStorage.removeItem('LOAN_MANAGER_SUPABASE_ANON_KEY');
    setSupabaseUrl('');
    setSupabaseKey('');
    window.location.reload();
  };

  return (
    <div className="setup-container animate-fade-in" style={styles.container}>
      <div className="ambient-bg">
        <div className="ambient-blob-1"></div>
        <div className="ambient-blob-2"></div>
        <div className="ambient-blob-3"></div>
      </div>

      <div className="glass-panel glass-panel-glow" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Settings size={32} color="#6366f1" />
          </div>
          <div>
            <h1 style={styles.title}>Loan Manager</h1>
            <p style={styles.subtitle}>Setup Assistant & Developer Guide</p>
          </div>
        </div>

        <div style={styles.alertWrapper}>
          <div className="alert alert-info">
            <Info size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Configuration Required:</strong> To use Google Auth and User Management, you need to connect this app to a Supabase project. You can save keys locally in the browser or configure a <code>.env</code> file.
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'keys' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('keys')}
          >
            <Key size={16} /> Credentials
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'sql' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('sql')}
          >
            <Database size={16} /> SQL Schema
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'google' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('google')}
          >
            <ShieldAlert size={16} /> Google Auth Setup
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.content}>
          {activeTab === 'keys' && (
            <form onSubmit={handleSaveKeys} style={styles.form} className="animate-slide-up">
              <h3 style={styles.tabTitle}>Connect to Supabase</h3>
              <p style={styles.tabDescription}>
                Enter your Supabase URL and Anonymous Public Key. You can find these in the Supabase Dashboard under <strong>Project Settings &gt; API</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">Supabase URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supabase Anon Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  required
                />
              </div>

              <div style={styles.buttonGroup}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {saveSuccess ? (
                    <>
                      <CheckCircle size={18} /> Credentials Verified!
                    </>
                  ) : (
                    'Save and Continue'
                  )}
                </button>
                {(localStorage.getItem('LOAN_MANAGER_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL) && (
                  <button type="button" className="btn-secondary" onClick={handleClearKeys}>
                    Reset Settings
                  </button>
                )}
              </div>

              <div style={styles.tipBox}>
                <p>
                  <strong>Tip:</strong> Alternatively, you can copy the <code>.env.example</code> file to <code>.env</code> in the project root folder and insert your keys there, then restart the development server.
                </p>
              </div>
            </form>
          )}

          {activeTab === 'sql' && (
            <div className="animate-slide-up" style={styles.sqlContainer}>
              <div style={styles.tabHeaderWithAction}>
                <div>
                  <h3 style={styles.tabTitle}>Setup Database Profiles</h3>
                  <p style={styles.tabDescription}>
                    Run this SQL script in the <strong>SQL Editor</strong> on your Supabase dashboard. It creates the <code>profiles</code> table and handles automatic profile synchronization on registration.
                  </p>
                </div>
                <button onClick={handleCopySql} className="btn-secondary" style={styles.copyBtn}>
                  {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>

              <pre style={styles.preCode}>
                <code>{sqlCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'google' && (
            <div className="animate-slide-up" style={styles.guideContainer}>
              <h3 style={styles.tabTitle}>Enable Google OAuth in Supabase</h3>
              <p style={styles.tabDescription}>
                Follow these quick steps to get Google Authentication working:
              </p>

              <ol style={styles.list}>
                <li>
                  Go to the <strong>Google Cloud Console</strong> and create a new project.
                </li>
                <li>
                  Navigate to <strong>APIs & Services &gt; OAuth consent screen</strong>, set it up for External, and fill out required details.
                </li>
                <li>
                  Go to <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>. Select Web Application.
                </li>
                <li>
                  In your Supabase Dashboard, go to <strong>Authentication &gt; Providers &gt; Google</strong>.
                </li>
                <li>
                  Copy the <strong>Redirect URI</strong> shown on the Supabase Google settings page, and add it to the <strong>Authorized redirect URIs</strong> in your Google Client ID configuration.
                </li>
                <li>
                  Copy the Google **Client ID** and **Client Secret**, paste them back into the Supabase Google Provider configuration settings, and click **Save**.
                </li>
              </ol>

              <div className="alert alert-warning" style={{ marginTop: '1.5rem' }}>
                <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Local Testing Notice:</strong> Make sure you whitelist <code>http://localhost:5173</code> (or your actual development port) as an authorized Site URL or Redirect URI in your Supabase Auth configuration under <strong>URL Configuration</strong>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '720px',
    padding: '2.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  alertWrapper: {
    marginBottom: '1.5rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '0.75rem',
    marginBottom: '1.5rem',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontWeight: '500',
    fontSize: '0.9rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  tabBtnActive: {
    background: 'rgba(99, 102, 241, 0.12)',
    color: 'var(--primary-light)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  content: {
    minHeight: '280px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  tabTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '0.5rem',
  },
  tabDescription: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '1rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  tipBox: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    border: '1px dashed var(--border-light)',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  tabHeaderWithAction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1rem',
  },
  copyBtn: {
    fontSize: '0.85rem',
    padding: '0.5rem 1rem',
    flexShrink: 0,
  },
  preCode: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-light)',
    borderRadius: '8px',
    padding: '1.25rem',
    maxHeight: '220px',
    overflowY: 'auto',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '0.85rem',
    color: '#a5b4fc',
    lineHeight: '1.5',
  },
  guideContainer: {
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '0.5rem',
  },
  list: {
    paddingLeft: '1.25rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: '1.7',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
};
