const defaultFooterNavItems = [
  { id: 'dashboard', label: 'Anasayfa' },
  { id: 'advisor-selection', label: 'Danismanlik' },
  { id: 'profile', label: 'Profil' },
  { id: 'students', label: 'Ogrenciler' },
  { id: 'posts', label: 'Ilanlar' },
];

function AppFooter({
  currentView,
  onViewChange,
  navItems = defaultFooterNavItems,
  note = 'Ogrenci profilleri, proje ilanlari ve eslesme akislarini ayni panelde duzenli ve izlenebilir hale getirir.',
  metaText = 'Akademik proje yonetimi icin ortak calisma alani',
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-shell">
        <div className="app-footer-panel">
          <div className="app-footer-top">
            <div className="app-footer-brand">
              <div className="app-footer-brand-mark">GP</div>

              <div className="app-footer-brand-copy">
                <span>Project Intelligence Platform</span>
                <strong>GradPath</strong>
              </div>
            </div>

            <nav className="app-footer-nav" aria-label="Alt gezinme">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`app-footer-link ${currentView === item.id ? 'active' : ''}`}
                  onClick={() => onViewChange?.(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="app-footer-bottom">
            <p className="app-footer-note">
              {note}
            </p>

            <div className="app-footer-meta">
              <span>{metaText}</span>
              <small>© {year} GradPath. Tum haklari saklidir.</small>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
