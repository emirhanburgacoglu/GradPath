import { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Anasayfa' },
  { id: 'profile', label: 'Profil' },
  { id: 'students', label: 'Ogrenciler' },
  { id: 'posts', label: 'Ilanlar' },
  { id: 'settings', label: 'Ayarlar', passive: true },
];

function AppHeader({ currentView, initials, onLogout, onViewChange, profile }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  const handleViewSelect = (viewId) => {
    setIsMobileMenuOpen(false);
    onViewChange(viewId);
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    onLogout();
  };

  const renderNavItems = () =>
    navItems.map((item) => {
      if (item.passive) {
        return (
          <span key={item.id} className="app-nav-pill passive" aria-hidden="true">
            {item.label}
          </span>
        );
      }

      return (
        <button
          key={item.id}
          type="button"
          className={`app-nav-pill ${currentView === item.id ? 'active' : ''}`}
          onClick={() => handleViewSelect(item.id)}
        >
          {item.label}
        </button>
      );
    });

  return (
    <header className="app-topbar">
      <div className="app-topbar-shell">
        <div className="app-topbar-main">
          <div className="app-topbar-brand">
            <div className="app-topbar-brand-mark">GP</div>
            <div className="app-topbar-brand-copy">
              <span>Project Intelligence Platform</span>
              <strong>GradPath</strong>
            </div>
          </div>

          <button
            type="button"
            className="icon-button app-topbar-menu-button"
            aria-label={isMobileMenuOpen ? 'Menuyu kapat' : 'Menuyu ac'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="app-topbar-mobile-panel"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="app-topbar-nav app-topbar-nav-desktop" aria-label="Ana gezinme">
          {renderNavItems()}
        </nav>

        <div className="app-topbar-actions app-topbar-actions-desktop">
          <div className="app-topbar-status">
            <span className="app-status-dot" />
            Aktif oturum
          </div>

          <div className="app-topbar-profile">
            <div className="app-topbar-avatar">{initials}</div>
            <div className="app-topbar-profile-copy">
              <strong>{profile?.fullName || 'GradPath kullanicisi'}</strong>
              <span>{profile?.email || 'Panel kullanicisi'}</span>
            </div>
          </div>

          <button type="button" className="ghost-button topbar-logout-button" onClick={handleLogoutClick}>
            <LogOut size={16} />
            Cikis
          </button>
        </div>

        <div
          id="app-topbar-mobile-panel"
          className={`app-topbar-mobile-panel ${isMobileMenuOpen ? 'open' : ''}`}
        >
          <nav className="app-topbar-nav app-topbar-nav-mobile" aria-label="Mobil gezinme">
            {renderNavItems()}
          </nav>

          <div className="app-topbar-actions app-topbar-actions-mobile">
            <div className="app-topbar-status">
              <span className="app-status-dot" />
              Aktif oturum
            </div>

            <div className="app-topbar-profile">
              <div className="app-topbar-avatar">{initials}</div>
              <div className="app-topbar-profile-copy">
                <strong>{profile?.fullName || 'GradPath kullanicisi'}</strong>
                <span>{profile?.email || 'Panel kullanicisi'}</span>
              </div>
            </div>

            <button
              type="button"
              className="ghost-button topbar-logout-button topbar-logout-button-mobile"
              onClick={handleLogoutClick}
            >
              <LogOut size={16} />
              Cikis
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
