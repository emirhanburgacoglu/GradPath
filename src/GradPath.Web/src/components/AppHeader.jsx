import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';

const defaultNavItems = [
  { id: 'dashboard', label: 'Anasayfa' },
  { id: 'advisor-selection', label: 'Danismanlik' },
  { id: 'students', label: 'Öğrenciler' },
  { id: 'posts', label: 'İlanlar' },
  { id: 'profile', label: 'Profil' },
];

function AppHeader({
  currentView,
  initials,
  onLogout,
  onViewChange,
  profile,
  isAuthenticated = true,
  authMode = 'login',
  onAuthModeChange,
  navItems = defaultNavItems,
  profileActionLabel = 'Profile git',
  profileActionViewId = 'profile',
}) {
  const isLoginAuthMode = authMode?.startsWith('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [currentView, authMode]);

  useEffect(() => {
    if (!isProfileMenuOpen || !isAuthenticated) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAuthenticated, isProfileMenuOpen]);

  const handleViewSelect = (viewId) => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    onViewChange?.(viewId);
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    onLogout?.();
  };

  const handleGuestAuthSelect = (mode) => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    onAuthModeChange?.(mode);
  };

  const renderNavItems = () =>
    navItems.map((item) => (
      <button
        key={item.id}
        type="button"
        className={`app-nav-pill ${currentView === item.id ? 'active' : ''}`}
        onClick={() => handleViewSelect(item.id)}
      >
        {item.label}
      </button>
    ));

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
            aria-label={isMobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
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
          {isAuthenticated ? (
            <>
              <div className="app-topbar-status">
                <span className="app-status-dot" />
                Aktif oturum
              </div>

              <div
                ref={profileMenuRef}
                className={`app-topbar-profile-menu ${isProfileMenuOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="app-topbar-profile app-topbar-profile-trigger"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                >
                  <div className="app-topbar-avatar">{initials}</div>
                  <div className="app-topbar-profile-copy">
                    <strong>{profile?.fullName || 'GradPath kullanıcısı'}</strong>
                    <span>{profile?.email || 'Panel kullanıcısı'}</span>
                  </div>
                  <ChevronDown size={16} className="app-topbar-profile-caret" />
                </button>

                <div className="app-topbar-profile-dropdown" role="menu" aria-label="Profil menüsü">
                  <button
                    type="button"
                    className="app-topbar-profile-action"
                    role="menuitem"
                    onClick={() => handleViewSelect(profileActionViewId)}
                  >
                    <User size={16} />
                    {profileActionLabel}
                  </button>

                  <button
                    type="button"
                    className="app-topbar-profile-action danger"
                    role="menuitem"
                    onClick={handleLogoutClick}
                  >
                    <LogOut size={16} />
                    Çıkış yap
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="app-topbar-guest-auth" role="tablist" aria-label="Kimlik doğrulama modu">
              <button
                type="button"
                className={`app-topbar-guest-auth-button ${isLoginAuthMode ? 'active' : ''}`}
                onClick={() => handleGuestAuthSelect('login')}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                className={`app-topbar-guest-auth-button ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => handleGuestAuthSelect('register')}
              >
                Kayıt Ol
              </button>
            </div>
          )}
        </div>

        <div
          id="app-topbar-mobile-panel"
          className={`app-topbar-mobile-panel ${isMobileMenuOpen ? 'open' : ''} ${!isAuthenticated ? 'app-topbar-mobile-panel-guest' : ''}`}
        >
          <nav className="app-topbar-nav app-topbar-nav-mobile" aria-label="Mobil gezinme">
            {renderNavItems()}
          </nav>

          <div className="app-topbar-actions app-topbar-actions-mobile">
            {isAuthenticated ? (
              <>
                <div className="app-topbar-status">
                  <span className="app-status-dot" />
                  Aktif oturum
                </div>

                <div className="app-topbar-profile">
                  <div className="app-topbar-avatar">{initials}</div>
                  <div className="app-topbar-profile-copy">
                    <strong>{profile?.fullName || 'GradPath kullanıcısı'}</strong>
                    <span>{profile?.email || 'Panel kullanıcısı'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="ghost-button topbar-logout-button topbar-profile-button-mobile"
                  onClick={() => handleViewSelect(profileActionViewId)}
                >
                  <User size={16} />
                  {profileActionLabel}
                </button>

                <button
                  type="button"
                  className="ghost-button topbar-logout-button topbar-logout-button-mobile"
                  onClick={handleLogoutClick}
                >
                  <LogOut size={16} />
                  Çıkış yap
                </button>
              </>
            ) : (
              <div className="app-topbar-guest-auth app-topbar-guest-auth-mobile" role="tablist" aria-label="Kimlik doğrulama modu">
                <button
                  type="button"
                  className={`app-topbar-guest-auth-button ${isLoginAuthMode ? 'active' : ''}`}
                  onClick={() => handleGuestAuthSelect('login')}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  className={`app-topbar-guest-auth-button ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => handleGuestAuthSelect('register')}
                >
                  Kayıt Ol
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
