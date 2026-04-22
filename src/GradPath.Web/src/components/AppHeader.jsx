import { GraduationCap, LayoutDashboard, LogOut, Settings, User, Users } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Profilim', icon: User },
  { id: 'students', label: 'Ogrenci Dizini', icon: Users },
  { id: 'posts', label: 'Proje Ilanlari', icon: GraduationCap },
  { id: 'settings', label: 'Ayarlar', icon: Settings, passive: true },
];

function AppHeader({ currentView, initials, onLogout, onViewChange, profile }) {
  return (
    <header className="app-topbar">
      <div className="app-topbar-shell">
        <div className="app-topbar-brand">
          <div className="app-topbar-brand-mark">GP</div>
          <div className="app-topbar-brand-copy">
            <span>Project Intelligence Platform</span>
            <strong>GradPath</strong>
          </div>
        </div>

        <nav className="app-topbar-nav" aria-label="Ana gezinme">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.passive) {
              return (
                <span key={item.id} className="app-nav-pill passive" aria-hidden="true">
                  <Icon size={16} />
                  {item.label}
                </span>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                className={`app-nav-pill ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="app-topbar-actions">
          <div className="app-topbar-profile">
            <div className="app-topbar-avatar">{initials}</div>
            <div className="app-topbar-profile-copy">
              <strong>{profile?.fullName || 'GradPath kullanicisi'}</strong>
              <span>{profile?.email || 'Aktif oturum'}</span>
            </div>
          </div>

          <button type="button" className="ghost-button topbar-logout-button" onClick={onLogout}>
            <LogOut size={16} />
            Cikis Yap
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
