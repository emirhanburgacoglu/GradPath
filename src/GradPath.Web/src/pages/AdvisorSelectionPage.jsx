import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

function AdvisorSelectionPage({
  currentView,
  error,
  initials,
  onLogout,
  onViewChange,
  profile,
}) {
  return (
    <div className="app-layout">
      <AppHeader
        currentView={currentView}
        initials={initials}
        onLogout={onLogout}
        onViewChange={onViewChange}
        profile={profile}
      />

      <main className="main-content">
        {error ? <div className="dashboard-alert">{error}</div> : null}

        <section className="card workflow-hero-card">
          <div className="workflow-hero-copy">
            <div className="hero-badge">Danismanlik</div>
            <h1>Bu alan hazirlaniyor.</h1>
            <p>
              Proje secimi, danisman belirleme ve talep takibi akislarini bu sayfada
              toplayacagiz.
            </p>
          </div>
        </section>
      </main>

      <AppFooter currentView={currentView} onViewChange={onViewChange} />
    </div>
  );
}

export default AdvisorSelectionPage;
