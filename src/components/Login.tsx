import React, { useState } from 'react';
import { supabase } from '../supabase';
import { ShieldCheck, Activity, Sparkles } from 'lucide-react';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const redirectUrl = window.location.origin;
      
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in" style={styles.container}>
      {/* Background blobs */}
      <div className="ambient-bg">
        <div className="ambient-blob-1"></div>
        <div className="ambient-blob-2"></div>
        <div className="ambient-blob-3"></div>
      </div>

      <div style={styles.contentWrapper}>
        {/* Left Side: App Pitch / Info Panel */}
        <div style={styles.infoPanel} className="animate-slide-up">
          <div style={styles.logoBadge}>
            <Activity size={18} color="#6366f1" />
            <span>LOAN MANAGER PRO</span>
          </div>

          <h2 style={styles.infoTitle}>
            Manage and track <span className="text-gradient-primary">loans</span> with total clarity.
          </h2>
          
          <p style={styles.infoDesc}>
            A secure and premium platform built to streamline loan applications, interest calculations, payments, and client profile management.
          </p>

          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <Sparkles size={16} color="#c084fc" />
              </div>
              <div>
                <h4 style={styles.featureTitle}>Real-time Analytics</h4>
                <p style={styles.featureText}>Interactive tracking of active principal and accrued interest.</p>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <ShieldCheck size={16} color="#60a5fa" />
              </div>
              <div>
                <h4 style={styles.featureTitle}>Supabase Secure Auth</h4>
                <p style={styles.featureText}>Enterprise-grade security using Google OAuth credentials.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="glass-panel glass-panel-glow animate-slide-up" style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.cardTitle}>Welcome back</h1>
            <p style={styles.cardSubtitle}>Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="alert alert-danger animate-fade-in" style={{ fontSize: '0.85rem' }}>
              <div>{error}</div>
            </div>
          )}

          <div style={styles.formContainer}>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-google"
              style={styles.googleBtn}
            >
              {loading ? (
                <div style={styles.loader}></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </div>

          <div style={styles.cardFooter}>
            <p style={styles.footerText}>
              By signing in, you agree to our terms of service and security policy.
            </p>
          </div>
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
  contentWrapper: {
    display: 'flex',
    width: '100%',
    maxWidth: '960px',
    gap: '3rem',
    alignItems: 'center',
    flexDirection: 'row',
  },
  infoPanel: {
    flex: '1.2',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  logoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 0.8rem',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#818cf8',
    letterSpacing: '0.05em',
    alignSelf: 'flex-start',
  },
  infoTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#fff',
    lineHeight: '1.2',
    letterSpacing: '-0.03em',
  },
  infoDesc: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginTop: '1rem',
  },
  featureItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  featureIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
    borderRadius: '10px',
    flexShrink: 0,
    marginTop: '2px',
  },
  featureTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '0.2rem',
  },
  featureText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  card: {
    flex: '1',
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem',
  },
  cardHeader: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.02em',
    marginBottom: '0.5rem',
  },
  cardSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  googleBtn: {
    height: '48px',
  },
  loader: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(0,0,0,0.1)',
    borderTop: '2px solid #4285F4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0.75rem 0',
  },
  dividerLine: {
    flex: '1',
    height: '1px',
    background: 'var(--border-light)',
  },
  dividerText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  devBtn: {
    justifyContent: 'center',
    fontSize: '0.9rem',
    height: '42px',
  },
  cardFooter: {
    marginTop: '2rem',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
};

// Add standard animation styles as global style blocks since CSS animation spin is standard
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @media (max-width: 768px) {
    .login-container > div {
      flex-direction: column !important;
      gap: 2rem !important;
    }
    .login-container h2 {
      font-size: 1.8rem !important;
    }
  }
`;
document.head.appendChild(styleElement);
