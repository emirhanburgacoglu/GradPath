import { useMemo, useState } from 'react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

const advisorNavItems = [{ id: 'dashboard', label: 'Panel' }];

function AdvisorDashboardPage({
  currentView,
  error,
  initials,
  loading,
  onLogout,
  onRefresh,
  onRequestDecision,
  onViewChange,
  profile,
  requests,
}) {
  const [decisionNotes, setDecisionNotes] = useState({});
  const [actionState, setActionState] = useState({});

  const requestStats = useMemo(() => {
    const pendingCount = requests.filter((request) => request.status === 'Pending').length;
    const approvedCount = requests.filter((request) => request.status === 'Approved').length;
    const rejectedCount = requests.filter((request) => request.status === 'Rejected').length;

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
    };
  }, [requests]);

  const handleDecision = async (requestId, action) => {
    setActionState((current) => ({
      ...current,
      [requestId]: action,
    }));

    const result = await onRequestDecision?.(requestId, action, decisionNotes[requestId] || '');

    setActionState((current) => ({
      ...current,
      [requestId]: '',
    }));

    if (result?.succeeded) {
      window.alert(result.message);
      return;
    }

    window.alert(result?.message || 'Islem tamamlanamadi.');
  };

  return (
    <div className="app-layout">
      <AppHeader
        currentView={currentView}
        initials={initials}
        navItems={advisorNavItems}
        onLogout={onLogout}
        onViewChange={onViewChange}
        profile={profile}
        profileActionLabel="Panele git"
        profileActionViewId="dashboard"
      />

      <main className="main-content">
        {error ? <div className="dashboard-alert">{error}</div> : null}

        <section className="card dashboard-hero dashboard-hero-projects">
          <div className="hero-badge">Danisman Paneli</div>
          <h2>{profile?.fullName || 'Danisman paneli'}</h2>
          <p>
            Gelen proje taleplerini, ogrenci eslesmelerini ve kontenjan durumunu bu panel
            uzerinden yonetebilirsin.
          </p>

          <div className="dashboard-hero-meta">
            <div className="dashboard-hero-meta-item">
              <span>Bekleyen</span>
              <strong>{requestStats.pendingCount}</strong>
            </div>
            <div className="dashboard-hero-meta-item">
              <span>Onaylanan</span>
              <strong>{requestStats.approvedCount}</strong>
            </div>
            <div className="dashboard-hero-meta-item">
              <span>Kontenjan</span>
              <strong>{profile?.maxConcurrentStudents ?? '-'}</strong>
            </div>
          </div>
        </section>

        <section className="hero-grid">
          <div className="card dashboard-filter-panel">
            <div className="dashboard-filter-panel-top">
              <div className="dashboard-filter-title">Profil ozeti</div>
              <button type="button" className="ghost-button" onClick={() => onRefresh?.(true)} disabled={loading}>
                {loading ? 'Yukleniyor' : 'Yenile'}
              </button>
            </div>

            <div className="project-meta-row">
              <span className="project-meta-chip">{profile?.email || 'E-posta bekleniyor'}</span>
              <span className="project-meta-chip subtle">{profile?.officeLocation || 'Ofis bilgisi bekleniyor'}</span>
            </div>

            <p className="dashboard-subtitle" style={{ marginTop: 12 }}>
              {profile?.shortBio?.trim()
                ? profile.shortBio
                : 'Danisman profil aciklamasi henuz bulunmuyor. Bu alan okul sitesi senkronizasyonuyla zenginlesecek.'}
            </p>
          </div>

          <div className="card dashboard-profile-hint">
            <div className="dashboard-profile-hint-copy">
              <span>Uzmanlik alanlari</span>
              <strong>{profile?.expertiseAreas || 'Uzmanlik bilgisi bekleniyor'}</strong>
            </div>
          </div>
        </section>

        <section className="projects-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Gelen danismanlik talepleri</h2>
            </div>

            <div className="section-summary-pill">{requests.length} toplam talep</div>
          </div>

          {requests.length ? (
            <div className="advisor-request-grid">
              {requests.map((request) => {
                const actionInProgress = actionState[request.id];
                const isPending = request.status === 'Pending';

                return (
                  <article key={request.id} className={`advisor-request-card ${request.status.toLowerCase()}`}>
                    <div className="advisor-request-card-top">
                      <div>
                        <div className="project-card-kicker">Proje talebi</div>
                        <h3>{request.projectTitle}</h3>
                        <p>
                          {request.studentFullName}
                          {request.studentDepartmentName ? ` · ${request.studentDepartmentName}` : ''}
                        </p>
                      </div>

                      <div className="project-meta-chip subtle">Durum: {request.status}</div>
                    </div>

                    <div className="project-meta-row">
                      <span className="project-meta-chip">{request.projectCategory || 'Genel kategori'}</span>
                      <span className="project-meta-chip subtle">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString('tr-TR') : 'Tarih yok'}
                      </span>
                    </div>

                    {request.studentNote ? (
                      <div className="advisor-request-note-box">
                        <strong>Ogrenci notu</strong>
                        <p>{request.studentNote}</p>
                      </div>
                    ) : null}

                    {request.advisorNote ? (
                      <div className="advisor-request-note-box subtle">
                        <strong>Danisman notu</strong>
                        <p>{request.advisorNote}</p>
                      </div>
                    ) : null}

                    {isPending ? (
                      <>
                        <textarea
                          className="advisor-note-input"
                          placeholder="Istersen ogrenciye kisa bir not ekleyebilirsin."
                          rows={3}
                          value={decisionNotes[request.id] || ''}
                          onChange={(event) =>
                            setDecisionNotes((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                        />

                        <div className="advisor-request-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => handleDecision(request.id, 'reject')}
                            disabled={actionInProgress === 'approve' || actionInProgress === 'reject'}
                          >
                            {actionInProgress === 'reject' ? 'Reddediliyor' : 'Reddet'}
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleDecision(request.id, 'approve')}
                            disabled={actionInProgress === 'approve' || actionInProgress === 'reject'}
                          >
                            {actionInProgress === 'approve' ? 'Onaylaniyor' : 'Onayla'}
                          </button>
                        </div>
                      </>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state empty-state-rich">
              <strong>Henuz gelen danismanlik talebi yok.</strong>
              <p>Ogrenciler proje secip sana talep gonderdiginde bu alanda listelenecek.</p>
            </div>
          )}
        </section>
      </main>

      <AppFooter
        currentView={currentView}
        navItems={advisorNavItems}
        note="Danisman hocalar icin proje taleplerini, ogrenci eslesmelerini ve kontenjan akislarini tek panelde takip etmeyi hedefler."
        metaText="Danismanlik sureci icin yonetim paneli"
        onViewChange={onViewChange}
      />
    </div>
  );
}

export default AdvisorDashboardPage;
