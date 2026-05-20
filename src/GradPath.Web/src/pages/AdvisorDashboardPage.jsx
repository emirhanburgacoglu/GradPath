import { useMemo, useState } from 'react';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';

const advisorNavItems = [
  { id: 'dashboard', label: 'Talepler' },
];

function formatDate(value) {
  if (!value) {
    return 'Tarih bilgisi yok';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

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
  const [noteByRequestId, setNoteByRequestId] = useState({});
  const [activeAction, setActiveAction] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [message, setMessage] = useState('');

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === 'Pending'),
    [requests]
  );
  const approvedRequests = useMemo(
    () => requests.filter((item) => item.status === 'Approved'),
    [requests]
  );
  const rejectedRequests = useMemo(
    () => requests.filter((item) => item.status === 'Rejected'),
    [requests]
  );
  const visibleRequests = useMemo(() => {
    if (activeTab === 'Approved') {
      return approvedRequests;
    }

    if (activeTab === 'Rejected') {
      return rejectedRequests;
    }

    return pendingRequests;
  }, [activeTab, approvedRequests, pendingRequests, rejectedRequests]);
  const handleNoteChange = (requestId, value) => {
    setNoteByRequestId((current) => ({
      ...current,
      [requestId]: value,
    }));
  };

  const resolveAdvisorNote = (request) => {
    if (Object.prototype.hasOwnProperty.call(noteByRequestId, request.id)) {
      return noteByRequestId[request.id];
    }

    return request.advisorNote || '';
  };

  const handleDecision = async (request, action) => {
    setActiveAction(`${request.id}:${action}`);
    setMessage('');

    const result = await onRequestDecision?.(
      request.id,
      action,
      resolveAdvisorNote(request)
    );

    setActiveAction('');

    if (!result?.succeeded) {
      setMessage(result?.message || 'Talep guncellenemedi.');
      return;
    }

    setMessage(
      action === 'approve'
        ? 'Talep onaylandi.'
        : 'Talep reddedildi.'
    );

    setNoteByRequestId((current) => {
      const next = { ...current };
      delete next[request.id];
      return next;
    });

    await onRefresh?.(true);
  };

  const toggleRequest = (requestId) => {
    setExpandedRequestId((current) => (current === requestId ? null : requestId));
  };

  const tabTitleMap = {
    Pending: 'Onay bekleyen ogrenciler',
    Approved: 'Onaylanan talepler',
    Rejected: 'Reddedilen talepler',
  };

  const tabDateLabelMap = {
    Pending: 'Talep tarihi',
    Approved: 'Onay tarihi',
    Rejected: 'Red tarihi',
  };

  const tabEmptyMessageMap = {
    Pending: 'Bekleyen talep yok.',
    Approved: 'Henuz onaylanan talep yok.',
    Rejected: 'Henuz reddedilen talep yok.',
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
        profileActionLabel="Talepler"
        profileActionViewId="dashboard"
      />

      <main className="main-content">
        {error ? <div className="dashboard-alert">{error}</div> : null}
        {message ? <div className="dashboard-alert">{message}</div> : null}

        <section className="card workflow-hero-card advisor-admin-hero">
          <div className="workflow-hero-copy">
            <div className="hero-badge">Danisman Paneli</div>
            <h1>{profile?.fullName || 'Danisman paneli'}</h1>
            <p>
              Gelen talepleri alt alta incele, ogrenci notunu oku ve kararini
              ayni ekran uzerinden ver.
            </p>
          </div>

          <div className="advisor-admin-stats">
            <button
              type="button"
              className={`advisor-admin-stat advisor-admin-stat-button ${activeTab === 'Pending' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Pending');
                setExpandedRequestId(null);
              }}
            >
              <span>Bekleyen</span>
              <strong>{pendingRequests.length}</strong>
            </button>
            <button
              type="button"
              className={`advisor-admin-stat advisor-admin-stat-button ${activeTab === 'Approved' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Approved');
                setExpandedRequestId(null);
              }}
            >
              <span>Onaylanan</span>
              <strong>{approvedRequests.length}</strong>
            </button>
            <button
              type="button"
              className={`advisor-admin-stat advisor-admin-stat-button ${activeTab === 'Rejected' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Rejected');
                setExpandedRequestId(null);
              }}
            >
              <span>Reddedilen</span>
              <strong>{rejectedRequests.length}</strong>
            </button>
            <div className="advisor-admin-stat">
              <span>Kontenjan</span>
              <strong>{profile?.maxConcurrentStudents ?? '-'}</strong>
            </div>
          </div>
        </section>

        <section className="advisor-admin-main">
          <section className="card workflow-status-card">
            <div className="section-header">
              <div>
                <div className="dashboard-date">
                  {activeTab === 'Pending'
                    ? 'Bekleyen talepler'
                    : activeTab === 'Approved'
                      ? 'Onaylanan talepler'
                      : 'Reddedilen talepler'}
                </div>
                <h2 className="section-title">{tabTitleMap[activeTab]}</h2>
              </div>

              <button
                type="button"
                className="ghost-button"
                onClick={() => onRefresh?.(true)}
                disabled={loading}
              >
                {loading ? 'Yukleniyor...' : 'Yenile'}
              </button>
            </div>

            {loading ? (
              <div className="card loading-card">Talepler yukleniyor...</div>
            ) : visibleRequests.length ? (
              <div className="advisor-admin-queue">
                {visibleRequests.map((request) => {
                  const approveKey = `${request.id}:approve`;
                  const rejectKey = `${request.id}:reject`;
                  const isExpanded = expandedRequestId === request.id;
                  const statusClass =
                    request.status === 'Approved'
                      ? 'approved'
                      : request.status === 'Rejected'
                        ? 'rejected'
                        : 'pending';
                  const statusLabel =
                    request.status === 'Approved'
                      ? 'Onaylandi'
                      : request.status === 'Rejected'
                        ? 'Reddedildi'
                        : 'Beklemede';
                  const actionDate =
                    request.status === 'Pending'
                      ? request.createdAt
                      : request.respondedAt || request.updatedAt || request.createdAt;

                  return (
                    <article key={request.id} className="advisor-admin-request">
                      <div className="advisor-admin-request-summary">
                        <div className="advisor-admin-request-summary-main">
                          <div className="advisor-admin-request-summary-cell">
                            <span>Ogrenci</span>
                            <strong>{request.studentFullName}</strong>
                          </div>
                          <div className="advisor-admin-request-summary-cell">
                            <span>Proje</span>
                            <strong>{request.projectTitle}</strong>
                          </div>
                          <div className="advisor-admin-request-summary-cell">
                            <span>{tabDateLabelMap[request.status] || 'Talep tarihi'}</span>
                            <strong>{formatDate(actionDate)}</strong>
                          </div>
                        </div>

                        <div className="advisor-admin-request-summary-side">
                          <span className={`advisor-admin-status ${statusClass}`}>{statusLabel}</span>
                          <button
                            type="button"
                            className={`advisor-admin-toggle ${isExpanded ? 'open' : ''}`}
                            onClick={() => toggleRequest(request.id)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Talep detayini kapat' : 'Talep detayini ac'}
                          >
                            {isExpanded ? '-' : '+'}
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="advisor-admin-request-details">
                          <div className="advisor-admin-meta">
                            <span>
                              <strong>Bolum:</strong>{' '}
                              {request.studentDepartmentName || 'Bolum bilgisi yok'}
                            </span>
                          </div>

                          <div className="advisor-admin-note-box">
                            <strong>Ogrenci aciklamasi</strong>
                            <p>{request.studentNote || 'Ogrenci bu talep icin not birakmadi.'}</p>
                          </div>

                          {request.status === 'Pending' ? (
                            <>
                              <label className="advisor-admin-input-block">
                                <span>Danisman notu</span>
                                <textarea
                                  className="advisor-admin-textarea"
                                  rows={4}
                                  placeholder="Onay veya red kararin icin kisa bir aciklama yazabilirsin."
                                  value={resolveAdvisorNote(request)}
                                  onChange={(event) =>
                                    handleNoteChange(request.id, event.target.value)
                                  }
                                />
                              </label>

                              <div className="advisor-admin-actions">
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() => handleDecision(request, 'reject')}
                                  disabled={activeAction === approveKey || activeAction === rejectKey}
                                >
                                  {activeAction === rejectKey ? 'Reddediliyor...' : 'Reddet'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => handleDecision(request, 'approve')}
                                  disabled={activeAction === approveKey || activeAction === rejectKey}
                                >
                                  {activeAction === approveKey ? 'Onaylaniyor...' : 'Onayla'}
                                </button>
                              </div>
                            </>
                          ) : request.advisorNote ? (
                            <div className="advisor-admin-note-box">
                              <strong>Danisman notu</strong>
                              <p>{request.advisorNote}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state empty-state-rich">
                <strong>{tabEmptyMessageMap[activeTab]}</strong>
                <p>
                  {activeTab === 'Pending'
                    ? 'Yeni talepler geldiginde burada alt alta listelenecek.'
                    : 'Bu durumdaki talepler olustukca bu listede gorulecek.'}
                </p>
              </div>
            )}
          </section>

        </section>
      </main>

      <AppFooter currentView={currentView} onViewChange={onViewChange} />
    </div>
  );
}

export default AdvisorDashboardPage;
