import React, { useState } from 'react';
import { updateProfile, type Profile } from '../supabase';
import { User, Mail, Phone, Save, CheckCircle, AlertTriangle, Image as ImageIcon, ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  user: any;
  profile: Profile | null;
  onProfileUpdated: (updatedProfile: Profile) => void;
  onBack: () => void;
}

export function ProfilePage({ user, profile, onProfileUpdated, onBack }: ProfilePageProps) {
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const userId = user.id;
      const updates = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };

      const updated = await updateProfile(userId, updates);
      if (updated) {
        onProfileUpdated(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn} className="btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h1 style={styles.title}>Manage Profile</h1>
        <p style={styles.subtitle}>View and update your personal identification details.</p>
      </div>

      <div style={styles.cardGrid}>
        {/* Left Card: Avatar Preview */}
        <div className="glass-panel" style={styles.avatarCard}>
          <div style={styles.avatarPreviewContainer}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar Preview" style={styles.largeAvatar} onError={() => setAvatarUrl('')} />
            ) : (
              <div style={styles.largeAvatarPlaceholder}>
                {(fullName[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
          
          <h3 style={styles.userNameText}>{fullName || 'User Profile'}</h3>
          <p style={styles.userRoleText}>Client Account / Admin</p>

          <div style={styles.metadataList}>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Account ID:</span>
              <span style={styles.metadataValue} title={user.id}>{user.id.slice(0, 12)}...</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Joined:</span>
              <span style={styles.metadataValue}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Today'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Profile Form */}
        <div className="glass-panel" style={styles.formCard}>
          <h3 style={styles.formTitle}>Edit Personal Details</h3>

          {error && (
            <div className="alert alert-danger animate-fade-in" style={{ fontSize: '0.85rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="alert alert-success animate-fade-in" style={{ fontSize: '0.85rem' }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <div>Profile changes saved successfully! Your account headers have been updated.</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label" style={styles.labelWithIcon}>
                <User size={14} color="#a855f7" /> Full Name
              </label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.labelWithIcon}>
                <Mail size={14} color="#6366f1" /> Email Address
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.labelWithIcon}>
                <Phone size={14} color="#10b981" /> Phone Number
              </label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.labelWithIcon}>
                <ImageIcon size={14} color="#f43f5e" /> Avatar Image URL
              </label>
              <input
                type="url"
                className="form-input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={styles.saveBtn}>
              {loading ? (
                <div style={styles.loader}></div>
              ) : (
                <Save size={18} />
              )}
              {loading ? 'Saving details...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '1.5rem 0',
  },
  header: {
    marginBottom: '2rem',
  },
  backBtn: {
    fontSize: '0.85rem',
    padding: '0.5rem 1rem',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.02em',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '2rem',
    alignItems: 'start',
  },
  avatarCard: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  avatarPreviewContainer: {
    marginBottom: '1.5rem',
  },
  largeAvatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '4px solid rgba(99, 102, 241, 0.4)',
    boxShadow: 'var(--shadow-glow)',
    objectFit: 'cover',
  },
  largeAvatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'var(--primary-gradient)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '3.5rem',
    boxShadow: 'var(--shadow-glow)',
  },
  userNameText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '0.25rem',
  },
  userRoleText: {
    fontSize: '0.85rem',
    color: 'var(--primary-light)',
    fontWeight: '600',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '1.5rem',
  },
  metadataList: {
    width: '100%',
    borderTop: '1px solid var(--border-light)',
    paddingTop: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  metadataItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  metadataLabel: {
    color: 'var(--text-muted)',
  },
  metadataValue: {
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  formCard: {
    padding: '2.5rem',
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  labelWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  saveBtn: {
    height: '46px',
    justifyContent: 'center',
    marginTop: '0.5rem',
  },
  loader: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Responsiveness adjustments for smaller devices
const mediaStyles = document.createElement('style');
mediaStyles.innerHTML = `
  @media (max-width: 768px) {
    .setup-container + div, .dashboard-container, .cardGrid {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(mediaStyles);
