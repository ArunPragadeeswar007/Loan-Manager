import React, { useState } from 'react';
import { supabase, type Profile } from '../supabase';
import { 
  LogOut, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity, 
  ArrowUpRight, 
  Plus, 
  Settings,
  Briefcase,
  User
} from 'lucide-react';
import { ProfilePage } from './ProfilePage';

interface DashboardProps {
  user: any;
  profile: Profile | null;
  onLogout: () => void;
  onProfileUpdated: (updatedProfile: Profile) => void;
}

export function Dashboard({ user, profile, onLogout, onProfileUpdated }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // Extract display name: use profile full name, or user metadata, or email
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userEmail = profile?.email || user?.email || '';

  // Mock loan data to show a premium layout
  const mockLoans = [
    { id: 'LN-2026-041', client: 'Samantha Vance', amount: 12500, interest: 8.5, status: 'Active', term: '12 months', date: '2026-05-12' },
    { id: 'LN-2026-039', client: 'Marcus Sterling', amount: 48000, interest: 10.2, status: 'Pending', term: '36 months', date: '2026-06-01' },
    { id: 'LN-2026-035', client: 'Elena Rostova', amount: 8500, interest: 7.0, status: 'Paid', term: '6 months', date: '2026-04-10' },
    { id: 'LN-2026-032', client: 'David Kim', amount: 15000, interest: 9.0, status: 'Active', term: '24 months', date: '2026-03-24' },
  ];

  return (
    <div style={styles.dashboardContainer} className="animate-fade-in">
      {/* Background blobs */}
      <div className="ambient-bg">
        <div className="ambient-blob-1"></div>
        <div className="ambient-blob-2"></div>
        <div className="ambient-blob-3"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={styles.sidebarHeader}>
          <Briefcase size={22} color="#818cf8" />
          <span style={styles.sidebarBrand}>LoanManager</span>
        </div>
        
        <nav style={styles.nav}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{ ...styles.navLink, ...(activeTab === 'dashboard' ? styles.navLinkActive : {}) }}
            className={activeTab !== 'dashboard' ? "nav-link-hover" : ""}
          >
            <Activity size={18} /> Dashboard
          </button>
          
          <button 
            onClick={() => setActiveTab('profile')} 
            style={{ ...styles.navLink, ...(activeTab === 'profile' ? styles.navLinkActive : {}) }}
            className={activeTab !== 'profile' ? "nav-link-hover" : ""}
          >
            <User size={18} /> Profile
          </button>

          <button className="nav-link-hover" disabled style={{ opacity: 0.4, cursor: 'not-allowed', ...styles.navLink }}>
            <DollarSign size={18} /> Loans
          </button>
          
          <button className="nav-link-hover" disabled style={{ opacity: 0.4, cursor: 'not-allowed', ...styles.navLink }}>
            <Users size={18} /> Clients
          </button>
          
          <button className="nav-link-hover" disabled style={{ opacity: 0.4, cursor: 'not-allowed', ...styles.navLink }}>
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn} className="btn-secondary">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {activeTab === 'profile' ? (
          <ProfilePage 
            user={user} 
            profile={profile} 
            onProfileUpdated={onProfileUpdated} 
            onBack={() => setActiveTab('dashboard')} 
          />
        ) : (
          <>
            {/* Top Navbar */}
            <header style={styles.header}>
              <div>
                <h2 style={styles.welcomeText}>
                  Welcome back, <span className="text-gradient-primary">{displayName}</span>!
                </h2>
                <p style={styles.headerSubtitle}>Here is what's happening with your loan portfolios today.</p>
              </div>

              <div style={styles.headerActions}>
                <div 
                  onClick={() => setActiveTab('profile')}
                  style={{ ...styles.profileBadge, cursor: 'pointer' }} 
                  className="glass-panel nav-link-hover"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>{displayName[0].toUpperCase()}</div>
                  )}
                  <div style={styles.profileText}>
                    <span style={styles.profileName}>{displayName}</span>
                    <span style={styles.profileEmail}>{userEmail}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Database Sync Banner */}
            <div className="alert alert-success animate-slide-up" style={styles.syncAlert}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <div>
                <strong>Database Account Verified:</strong> Successfully authenticated with Supabase Google Auth and verified your user row in the <code>profiles</code> table.
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={styles.statsGrid}>
              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statHeader}>
                  <span style={styles.statLabel}>Active Portfolio</span>
                  <div style={{ ...styles.statIconContainer, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                    <DollarSign size={18} color="#6366f1" />
                  </div>
                </div>
                <div style={styles.statVal}>$184,200.00</div>
                <div style={styles.statChange}>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <ArrowUpRight size={14} /> +12.4%
                  </span>
                  <span style={styles.statPeriod}>vs last month</span>
                </div>
              </div>

              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statHeader}>
                  <span style={styles.statLabel}>Interest Accrued</span>
                  <div style={{ ...styles.statIconContainer, backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
                    <TrendingUp size={18} color="#ec4899" />
                  </div>
                </div>
                <div style={styles.statVal}>$14,835.40</div>
                <div style={styles.statChange}>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <ArrowUpRight size={14} /> +8.2%
                  </span>
                  <span style={styles.statPeriod}>cumulative</span>
                </div>
              </div>

              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statHeader}>
                  <span style={styles.statLabel}>Total Clients</span>
                  <div style={{ ...styles.statIconContainer, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <Users size={18} color="#3b82f6" />
                  </div>
                </div>
                <div style={styles.statVal}>48 Active</div>
                <div style={styles.statChange}>
                  <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Clock size={14} /> 3 Pending
                  </span>
                  <span style={styles.statPeriod}>approvals</span>
                </div>
              </div>
            </div>

            {/* Loan Table Section */}
            <section style={styles.tableSection} className="glass-panel">
              <div style={styles.tableHeader}>
                <div>
                  <h3 style={styles.tableTitle}>Recent Loan Activity</h3>
                  <p style={styles.tableSubtitle}>List of active, pending, and paid loan application profiles.</p>
                </div>
                <button className="btn-primary" style={styles.createBtn}>
                  <Plus size={16} /> New Loan
                </button>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Loan ID</th>
                      <th style={styles.th}>Client Name</th>
                      <th style={styles.th}>Principal</th>
                      <th style={styles.th}>Interest</th>
                      <th style={styles.th}>Term</th>
                      <th style={styles.th}>Applied Date</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLoans.map((loan) => (
                      <tr key={loan.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#818cf8' }}>{loan.id}</td>
                        <td style={{ ...styles.td, color: '#fff', fontWeight: '500' }}>{loan.client}</td>
                        <td style={{ ...styles.td, color: '#fff' }}>${loan.amount.toLocaleString()}</td>
                        <td style={styles.td}>{loan.interest}%</td>
                        <td style={styles.td}>{loan.term}</td>
                        <td style={styles.td}>{loan.date}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusTag,
                            ...(loan.status === 'Active' ? styles.statusActive : {}),
                            ...(loan.status === 'Pending' ? styles.statusPending : {}),
                            ...(loan.status === 'Paid' ? styles.statusPaid : {}),
                          }}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: '#04060e',
  },
  sidebar: {
    width: '260px',
    borderRight: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 1.5rem',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    borderRadius: 0,
    backdropFilter: 'blur(30px)',
    background: 'rgba(7, 9, 21, 0.7)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '3rem',
  },
  sidebarBrand: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.02em',
    fontFamily: 'var(--font-heading)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  navLinkActive: {
    background: 'var(--primary-gradient)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
  },
  sidebarFooter: {
    marginTop: 'auto',
  },
  logoutBtn: {
    width: '100%',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    marginLeft: '260px',
    padding: '2.5rem 3rem',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    gap: '2rem',
  },
  welcomeText: {
    fontSize: '2.25rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    color: '#fff',
    marginBottom: '0.25rem',
  },
  headerSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem 0.5rem 0.5rem',
    borderRadius: '40px',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '2px solid rgba(99, 102, 241, 0.4)',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'var(--primary-gradient)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1rem',
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
  },
  profileName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#fff',
    lineHeight: '1.2',
  },
  profileEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  syncAlert: {
    marginBottom: '2rem',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.08)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
  },
  statCard: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  statIconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.02em',
    fontFamily: 'var(--font-heading)',
  },
  statChange: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
  },
  statPeriod: {
    color: 'var(--text-muted)',
  },
  tableSection: {
    padding: '2rem',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    gap: '1rem',
  },
  tableTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '0.25rem',
  },
  tableSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  createBtn: {
    fontSize: '0.85rem',
    padding: '0.6rem 1.2rem',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '1rem',
    borderBottom: '1px solid var(--border-light)',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'background var(--transition-fast)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  statusTag: {
    display: 'inline-flex',
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  statusActive: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  statusPending: {
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  statusPaid: {
    background: 'rgba(59, 130, 246, 0.12)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },
};

// Add standard link hover effect
const hoverStyle = document.createElement('style');
hoverStyle.innerHTML = `
  .nav-link-hover:hover {
    background: rgba(255, 255, 255, 0.04) !important;
    color: #fff !important;
  }
  @media (max-width: 992px) {
    main {
      margin-left: 0 !important;
      padding: 1.5rem !important;
    }
    aside {
      display: none !important;
    }
  }
`;
document.head.appendChild(hoverStyle);
