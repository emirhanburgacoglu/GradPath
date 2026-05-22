import { useEffect, useMemo, useState } from 'react';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';
import api from '../api';

function isActiveAdvisorRequest(request) {
  return request?.status === 'Pending' || request?.status === 'Approved';
}

const requestLabelMap = {
  Pending: 'Beklemede',
  Approved: 'Onaylandı',
  Rejected: 'Reddedildi',
  Cancelled: 'İptal edildi',
};

function formatDate(value) {
  if (!value) {
    return 'Henüz işlem yok';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function buildAdvisorInitials(fullName) {
  if (!fullName) {
    return 'DP';
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getStatusMeta(currentRequest) {
  if (!currentRequest) {
    return {
      label: 'Başlatılmadı',
      tone: 'idle',
      summary: 'Seçtiğiniz proje için önce danışman belirlemeniz gerekiyor.',
    };
  }

  if (currentRequest.status === 'Approved') {
    return {
      label: 'Onaylandı',
      tone: 'approved',
      summary: 'Danışman başvurunuz onaylandı. Süreç başarıyla tamamlandı.',
    };
  }

  if (currentRequest.status === 'Rejected') {
    return {
      label: 'Reddedildi',
      tone: 'rejected',
      summary: 'Danışman başvurunuz reddedildi. Aynı proje için yeni bir danışman seçebilirsiniz.',
    };
  }

  if (currentRequest.status === 'Cancelled') {
    return {
      label: 'İptal edildi',
      tone: 'cancelled',
      summary: 'Danışmanlık talebiniz sizin tarafınızdan iptal edildi. Aynı proje için yeni bir danışman seçebilirsiniz.',
    };
  }

  return {
    label: requestLabelMap[currentRequest.status] || currentRequest.status,
    tone: 'pending',
    summary: 'Danışman başvurunuz gönderildi. Öğretim üyesi değerlendirmesi bekleniyor.',
  };
}

function buildSteps(currentRequest) {
  const hasRequest = Boolean(currentRequest);
  const isApproved = currentRequest?.status === 'Approved';
  const isRejected = currentRequest?.status === 'Rejected';
  const isCancelled = currentRequest?.status === 'Cancelled';

  return [
    {
      title: 'Proje seçildi',
      detail: hasRequest ? 'Ana sayfada proje seçimi tamamlandı.' : 'Seçilen proje burada görünür.',
      state: hasRequest ? 'done' : 'idle',
    },
    {
      title: isCancelled ? 'Talep iptal edildi' : 'Talep gönderildi',
      detail: isCancelled
        ? 'Öğrenci bekleyen talebi iptal etti.'
        : hasRequest
          ? 'Danışman talebi oluşturuldu.'
          : 'Danışman seçildiğinde talep gönderilecek.',
      state: isCancelled ? 'cancelled' : hasRequest ? 'done' : 'idle',
    },
    {
      title: isApproved ? 'Onaylandı' : isRejected ? 'Reddedildi' : isCancelled ? 'Yeni seçim bekleniyor' : 'Değerlendirme sürüyor',
      detail: isApproved
        ? 'Danışman süreci onayladı.'
        : isRejected
          ? 'Danışman başvuruyu reddetti.'
          : isCancelled
            ? 'İsterseniz aynı proje için yeniden danışman seçebilirsiniz.'
            : hasRequest
              ? 'Danışman değerlendirmesi bekleniyor.'
              : 'Talep gönderildiğinde burada güncellenecek.',
      state: isApproved ? 'done' : isRejected ? 'rejected' : isCancelled ? 'idle' : hasRequest ? 'active' : 'idle',
    },
  ];
}

function AdvisorSelectionPage({
  advisorRequests,
  currentView,
  error,
  initials,
  onCancelAdvisorRequest,
  onCreateAdvisorRequest,
  onLogout,
  onRefresh,
  onSelectProject,
  onViewChange,
  profile,
  recommendations,
  refreshing,
  selectedProjectId,
}) {
  const [advisors, setAdvisors] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const selectedProjectNumericId = selectedProjectId ? Number(selectedProjectId) : null;

  const activeRequest = useMemo(() => {
    return advisorRequests.find(isActiveAdvisorRequest) || null;
  }, [advisorRequests]);

  const latestRequest = useMemo(() => {
    if (!advisorRequests.length) {
      return null;
    }

    return [...advisorRequests].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )[0];
  }, [advisorRequests]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectNumericId) {
      return null;
    }

    return recommendations.find((item) => item.projectId === selectedProjectNumericId) || null;
  }, [recommendations, selectedProjectNumericId]);

  const selectedProjectRequest = useMemo(() => {
    if (!selectedProjectNumericId) {
      return null;
    }

    const matchingRequests = advisorRequests.filter((item) => item.projectId === selectedProjectNumericId);
    if (!matchingRequests.length) {
      return null;
    }

    const activeRequestForProject = matchingRequests.find(isActiveAdvisorRequest);

    if (activeRequestForProject) {
      return activeRequestForProject;
    }

    return [...matchingRequests].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )[0];
  }, [advisorRequests, selectedProjectNumericId]);

  const currentRequest = activeRequest || selectedProjectRequest || latestRequest;
  const currentProject =
    (activeRequest
      ? recommendations.find((item) => item.projectId === activeRequest.projectId)
      : selectedProject) ||
    recommendations.find((item) => item.projectId === currentRequest?.projectId) ||
    null;

  const canChooseAdvisor =
    Boolean(selectedProject) &&
    !activeRequest &&
    (!selectedProjectRequest ||
      selectedProjectRequest.status === 'Rejected' ||
      selectedProjectRequest.status === 'Cancelled');

  useEffect(() => {
    if (!canChooseAdvisor || !selectedProject) {
      setAdvisors([]);
      setSelectedAdvisorId('');
      setStudentNote('');
      setMessage('');
      setLoadingAdvisors(false);
      return;
    }

    let ignore = false;

    const loadAdvisors = async () => {
      setLoadingAdvisors(true);
      setMessage('');

      try {
        const response = await api.get('/advisors/available', {
          params: { projectId: selectedProject.projectId },
        });

        if (ignore) {
          return;
        }

        const advisorItems = response.data || [];
        setAdvisors(advisorItems);
        setSelectedAdvisorId(advisorItems[0]?.userId || '');
      } catch {
        if (!ignore) {
          setMessage('Uygun danışmanlar şu an getirilemiyor.');
        }
      } finally {
        if (!ignore) {
          setLoadingAdvisors(false);
        }
      }
    };

    loadAdvisors();

    return () => {
      ignore = true;
    };
  }, [canChooseAdvisor, selectedProject]);

  const handleSubmit = async () => {
    if (!selectedProject) {
      setMessage('Önce ana sayfadan bir proje seçin.');
      return;
    }

    if (!selectedAdvisorId) {
      setMessage('Lütfen bir danışman seçin.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    const result = await onCreateAdvisorRequest({
      projectId: selectedProject.projectId,
      advisorUserId: selectedAdvisorId,
      studentNote,
    });

    setSubmitting(false);

    if (!result?.succeeded) {
      setMessage(result?.message || 'Danışmanlık talebi gönderilemedi.');
      return;
    }

    setStudentNote('');
    await onRefresh?.();
  };

  const handleCancelRequest = async () => {
    if (!currentRequest?.id) {
      return;
    }

    const confirmed = window.confirm('Bekleyen danışmanlık talebini iptal etmek istiyor musunuz?');
    if (!confirmed) {
      return;
    }

    setCancelling(true);
    setMessage('');

    const result = await onCancelAdvisorRequest(currentRequest.id);

    setCancelling(false);

    if (!result?.succeeded) {
      setMessage(result?.message || 'Danışmanlık talebi iptal edilemedi.');
      return;
    }

    setMessage('Danışmanlık talebi iptal edildi. Yeni proje veya danışman seçebilirsin.');
    await onRefresh?.();
    onViewChange?.('dashboard');
  };

  const statusMeta = getStatusMeta(currentRequest);
  const steps = buildSteps(currentRequest);
  const canCancelPendingRequest = currentRequest?.status === 'Pending';

  const summaryItems = currentRequest
    ? [
        {
          label: 'Proje',
          value: currentRequest.projectTitle,
          detail: currentProject?.category || currentRequest.projectCategory || 'Proje bilgisi',
        },
        {
          label: 'Danışman',
          value: `${currentRequest.advisorAcademicTitle ? `${currentRequest.advisorAcademicTitle} ` : ''}${currentRequest.advisorFullName}`,
          detail: currentRequest.advisorDepartmentName || 'Bölüm bilgisi yok',
        },
        {
          label: 'Son güncelleme',
          value: formatDate(currentRequest.respondedAt || currentRequest.createdAt),
          detail: statusMeta.label,
        },
        ...(currentRequest.studentNote
          ? [
              {
                label: 'Öğrenci notu',
                value: currentRequest.studentNote,
                detail: '',
              },
            ]
          : []),
        ...(currentRequest.advisorNote
          ? [
              {
                label: 'Danışman notu',
                value: currentRequest.advisorNote,
                detail: '',
              },
            ]
          : []),
      ]
    : [];

  const primarySummaryItems = summaryItems.slice(0, 3);
  const noteSummaryItems = summaryItems.slice(3);

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
        {message ? <div className="dashboard-alert">{message}</div> : null}

        <section className="card workflow-hero-card advisor-process-hero">
          <div className="workflow-hero-copy">
            <div className="hero-badge">Danışmanlık</div>
            <h1>Seçtiğin proje için danışmanlık sürecini yönet.</h1>
            <p>Önce projeni seç, ardından bu sayfada danışman belirleyip başvuru durumunu takip et.</p>
          </div>
        </section>

        {canChooseAdvisor ? (
          <section className="advisor-process-main">
            <section className="card workflow-status-card advisor-selection-stage-card">
              <div className="advisor-process-status-head">
                <div className="advisor-process-status-copy">
                  <div className="dashboard-date">Seçilen proje</div>
                  <h2 className="advisor-process-title">{selectedProject.projectTitle}</h2>
                  <p className="advisor-process-summary">
                    Bu proje için uygun danışmanı aşağıdan seçip başvurunu gönder.
                  </p>
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onViewChange?.('dashboard')}
                >
                  Projelere dön
                </button>
              </div>

              <div className="advisor-selected-project-strip">
                <span>{selectedProject.category || 'Genel kategori'}</span>
                {selectedProject.departmentNames?.length ? (
                  <span>{selectedProject.departmentNames.join(', ')}</span>
                ) : null}
              </div>
            </section>

            <section className="card workflow-status-card advisor-selection-stage-card">
              <div className="section-header">
                <div>
                  <div className="dashboard-date">Danışman seçimi</div>
                  <h2 className="advisor-process-title advisor-selection-title">Uygun danışmanlar</h2>
                </div>

                <div className="section-summary-pill">{advisors.length} kayıt</div>
              </div>

              {loadingAdvisors ? (
                <div className="card loading-card">Danışmanlar yükleniyor...</div>
              ) : advisors.length ? (
                <div className="selection-option-list advisor-option-list">
                  {advisors.map((advisor) => {
                    const isSelected = selectedAdvisorId === advisor.userId;

                    return (
                      <button
                        key={advisor.userId}
                        type="button"
                        className={`selection-option-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedAdvisorId(advisor.userId)}
                      >
                        <div className="selection-option-avatar-shell">
                          {advisor.profilePhotoUrl ? (
                            <img
                              className="selection-option-avatar"
                              src={advisor.profilePhotoUrl}
                              alt={`${advisor.fullName} profil fotoğrafı`}
                            />
                          ) : (
                            <div className="selection-option-avatar selection-option-avatar-fallback">
                              {buildAdvisorInitials(advisor.fullName)}
                            </div>
                          )}
                        </div>

                        <div className="selection-option-copy">
                          <strong>
                            {advisor.academicTitle ? `${advisor.academicTitle} ` : ''}
                            {advisor.fullName}
                          </strong>
                          <span>
                            {advisor.departmentName || 'Bölüm bilgisi yok'} · Kontenjan:{' '}
                            {advisor.approvedStudentCount}/{advisor.maxConcurrentStudents}
                          </span>
                          {advisor.expertiseAreas ? <span>{advisor.expertiseAreas}</span> : null}
                        </div>

                        <span className={`selection-option-check ${isSelected ? 'selected' : ''}`}>
                          {isSelected ? 'Seçildi' : 'Seç'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  Bu proje için şu anda listelenebilen uygun danışman bulunamadı.
                </div>
              )}

              <div className="advisor-selection-note-area">
                <div className="selection-modal-section-head">
                  <strong>Kısa not</strong>
                  <span>Opsiyonel</span>
                </div>

                <textarea
                  className="advisor-note-input"
                  placeholder="Projeye neden ilgi duyduğunu veya hocaya iletmek istediğin kısa notu yazabilirsin."
                  rows={4}
                  value={studentNote}
                  onChange={(event) => setStudentNote(event.target.value)}
                />

                <div className="advisor-selection-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onViewChange?.('dashboard')}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting || loadingAdvisors || !advisors.length}
                  >
                    {submitting ? 'Gönderiliyor...' : 'Danışmanlık talebini gönder'}
                  </button>
                </div>
              </div>
            </section>
          </section>
        ) : currentRequest ? (
          <section className="advisor-process-main">
            <section className={`card workflow-status-card advisor-process-status-card ${statusMeta.tone}`}>
              <div className="advisor-process-status-head">
                <div className="advisor-process-status-copy">
                  <div className="dashboard-date">Başvuru durumu</div>
                  <h2 className="advisor-process-title">{statusMeta.label}</h2>
                  <p className="advisor-process-summary">{statusMeta.summary}</p>
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onRefresh?.()}
                  disabled={refreshing}
                >
                  {refreshing ? 'Yenileniyor...' : 'Yenile'}
                </button>
              </div>

              <div className="advisor-process-summary-grid">
                {primarySummaryItems.map((item) => (
                  <div key={item.label} className="advisor-process-summary-card">
                    <span className="advisor-process-summary-label">{item.label}</span>
                    <div className="advisor-process-summary-body">
                      <strong>{item.value}</strong>
                      {item.detail ? <small>{item.detail}</small> : null}
                    </div>
                  </div>
                ))}
              </div>

              {noteSummaryItems.length ? (
                <ul className="advisor-process-summary-list advisor-process-summary-notes">
                  {noteSummaryItems.map((item) => (
                    <li key={item.label} className="advisor-process-summary-item">
                      <span className="advisor-process-summary-label">{item.label}</span>
                      <div className="advisor-process-summary-body">
                        <strong>{item.value}</strong>
                        {item.detail ? <small>{item.detail}</small> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {(canCancelPendingRequest || currentRequest.status === 'Rejected' || currentRequest.status === 'Cancelled') ? (
                <div className="advisor-selection-actions">
                  {canCancelPendingRequest ? (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={handleCancelRequest}
                      disabled={cancelling}
                    >
                      {cancelling ? 'İptal ediliyor...' : 'Talebi iptal et'}
                    </button>
                  ) : null}

                  {(currentRequest.status === 'Rejected' || currentRequest.status === 'Cancelled') && currentProject ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => onSelectProject?.(currentProject.projectId)}
                    >
                      Yeni danışman seç
                    </button>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="card workflow-status-card advisor-process-timeline-card">
              <div className="dashboard-date">Süreç adımları</div>

              <ol className="advisor-process-timeline-list">
                {steps.map((step, index) => (
                  <li key={step.title} className={`advisor-process-timeline-list-item ${step.state}`}>
                    <div className="advisor-process-timeline-list-index">{index + 1}</div>
                    <div className="advisor-process-timeline-list-copy">
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </section>
        ) : (
          <section className="card workflow-status-card">
            <div className="empty-state-rich advisor-process-empty">
              <strong>Henüz seçilmiş bir proje yok.</strong>
              <button
                type="button"
                className="btn-primary advisor-process-cta"
                onClick={() => {
                  onSelectProject?.('');
                  onViewChange?.('dashboard');
                }}
              >
                Ana sayfaya dön
              </button>
            </div>
          </section>
        )}
      </main>

      <AppFooter currentView={currentView} onViewChange={onViewChange} />
    </div>
  );
}

export default AdvisorSelectionPage;
