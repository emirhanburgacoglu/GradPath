import { useEffect, useMemo, useState } from 'react';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';
import api from '../api';

const advisorNavItems = [
  { id: 'dashboard', label: 'Talepler' },
  { id: 'projects', label: 'Projeler' },
];

const initialProjectForm = {
  title: '',
  description: '',
  category: '',
  difficultyLevel: 2,
  estimatedWeeks: 12,
  departmentIds: [],
  technologyIds: [],
};

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
  const [advisorProjects, setAdvisorProjects] = useState([]);
  const [projectOptions, setProjectOptions] = useState({ departments: [], technologies: [] });
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [selectedTechnologyCategory, setSelectedTechnologyCategory] = useState('');

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
  const technologyGroups = useMemo(() => {
    return projectOptions.technologies.reduce((groups, technology) => {
      const category = technology.category || 'Diger';

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(technology);
      return groups;
    }, {});
  }, [projectOptions.technologies]);
  const technologyCategoryOptions = useMemo(
    () => Object.keys(technologyGroups).sort((left, right) => left.localeCompare(right, 'tr')),
    [technologyGroups]
  );
  const visibleTechnologies = selectedTechnologyCategory
    ? technologyGroups[selectedTechnologyCategory] || []
    : [];
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

  const loadAdvisorProjects = async () => {
    setLoadingProjects(true);
    setMessage('');

    try {
      const [projectsResult, optionsResult] = await Promise.all([
        api.get('/advisor-projects/mine'),
        api.get('/student-project-posts/form-options'),
      ]);

      setAdvisorProjects(projectsResult.data || []);
      setProjectOptions({
        departments: optionsResult.data?.departments || [],
        technologies: optionsResult.data?.technologies || [],
      });
      const firstCategory = (optionsResult.data?.technologies || [])
        .map((technology) => technology.category || 'Diger')
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, 'tr'))[0] || '';
      setSelectedTechnologyCategory((current) => current || firstCategory);
    } catch {
      setMessage('Proje havuzu bilgileri su an yuklenemiyor.');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (currentView === 'projects') {
      loadAdvisorProjects();
    }
  }, [currentView]);

  const updateProjectForm = (field, value) => {
    setProjectForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleProjectFormListValue = (field, value) => {
    setProjectForm((current) => {
      const currentValues = current[field] || [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...current,
        [field]: nextValues,
      };
    });
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();

    if (!projectForm.title.trim() || !projectForm.description.trim() || !projectForm.category.trim()) {
      setMessage('Baslik, aciklama ve kategori alanlari zorunludur.');
      return;
    }

    if (!projectForm.technologyIds.length) {
      setMessage('Projenin ogrencilere onerilebilmesi icin en az bir teknoloji secmelisin.');
      return;
    }

    setCreatingProject(true);
    setMessage('');

    try {
      await api.post('/advisor-projects', {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        category: projectForm.category.trim(),
        difficultyLevel: Number(projectForm.difficultyLevel),
        estimatedWeeks: Number(projectForm.estimatedWeeks),
        departmentIds: projectForm.departmentIds,
        technologyIds: projectForm.technologyIds,
      });

      setProjectForm(initialProjectForm);
      setMessage('Proje havuza eklendi. Ogrenciler eslesme listesinde gorebilir.');
      await loadAdvisorProjects();
    } catch (createError) {
      const payload = createError?.response?.data;
      setMessage(typeof payload === 'string' ? payload : payload?.message || 'Proje havuza eklenemedi.');
    } finally {
      setCreatingProject(false);
    }
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

        {currentView === 'projects' ? (
          <section className="advisor-admin-main">
            <section className="card workflow-status-card">
              <div className="section-header">
                <div>
                  <div className="dashboard-date">Proje havuzu</div>
                  <h2 className="section-title">Kendi proje ilanini ac</h2>
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={loadAdvisorProjects}
                  disabled={loadingProjects}
                >
                  {loadingProjects ? 'Yukleniyor...' : 'Yenile'}
                </button>
              </div>

              <form className="advisor-project-form" onSubmit={handleCreateProject}>
                <label className="advisor-admin-input-block">
                  <span>Proje basligi</span>
                  <input
                    className="form-input"
                    value={projectForm.title}
                    onChange={(event) => updateProjectForm('title', event.target.value)}
                    placeholder="Orn. Yapay zeka destekli sera izleme sistemi"
                  />
                </label>

                <label className="advisor-admin-input-block">
                  <span>Proje aciklamasi</span>
                  <textarea
                    className="advisor-admin-textarea"
                    rows={4}
                    value={projectForm.description}
                    onChange={(event) => updateProjectForm('description', event.target.value)}
                    placeholder="Ogrencinin projeyi anlayabilmesi icin kisa ve net bir aciklama yaz."
                  />
                </label>

                <div className="advisor-project-form-grid">
                  <label className="advisor-admin-input-block">
                    <span>Kategori</span>
                    <input
                      className="form-input"
                      value={projectForm.category}
                      onChange={(event) => updateProjectForm('category', event.target.value)}
                      placeholder="AI, Web, Embedded..."
                    />
                  </label>

                  <label className="advisor-admin-input-block">
                    <span>Zorluk</span>
                    <select
                      className="form-input"
                      value={projectForm.difficultyLevel}
                      onChange={(event) => updateProjectForm('difficultyLevel', event.target.value)}
                    >
                      <option value={1}>Uygun</option>
                      <option value={2}>Orta</option>
                      <option value={3}>Zorlayici</option>
                    </select>
                  </label>

                  <label className="advisor-admin-input-block">
                    <span>Tahmini sure</span>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="52"
                      value={projectForm.estimatedWeeks}
                      onChange={(event) => updateProjectForm('estimatedWeeks', event.target.value)}
                    />
                  </label>
                </div>

                <div className="advisor-project-option-block">
                  <div className="selection-modal-section-head">
                    <strong>Bolumler</strong>
                    <span>Secilmezse kendi bolumun kullanilir</span>
                  </div>
                  <div className="advisor-project-chip-list">
                    {projectOptions.departments.map((department) => (
                      <button
                        key={department.id}
                        type="button"
                        className={`advisor-project-chip ${projectForm.departmentIds.includes(department.id) ? 'active' : ''}`}
                        onClick={() => toggleProjectFormListValue('departmentIds', department.id)}
                      >
                        {department.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="advisor-project-option-block">
                  <div className="selection-modal-section-head">
                    <strong>Teknolojiler</strong>
                    <span>En az bir tane sec</span>
                  </div>

                  <div className="advisor-project-select-grid">
                    <label className="advisor-admin-input-block">
                      <span>Kategori sec</span>
                      <select
                        className="form-input"
                        value={selectedTechnologyCategory}
                        onChange={(event) => setSelectedTechnologyCategory(event.target.value)}
                      >
                        {technologyCategoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category} ({technologyGroups[category]?.length || 0})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="advisor-admin-input-block">
                      <span>Skill sec</span>
                      <select
                        className="form-input"
                        value=""
                        onChange={(event) => {
                          const technologyId = Number(event.target.value);
                          if (technologyId) {
                            toggleProjectFormListValue('technologyIds', technologyId);
                          }
                        }}
                      >
                        <option value="">Skill seciniz</option>
                        {visibleTechnologies.map((technology) => (
                          <option key={technology.id} value={technology.id}>
                            {projectForm.technologyIds.includes(technology.id) ? '✓ ' : ''}
                            {technology.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="advisor-project-selected-skills">
                    {projectForm.technologyIds.length ? (
                      projectOptions.technologies
                        .filter((technology) => projectForm.technologyIds.includes(technology.id))
                        .map((technology) => (
                          <button
                            key={technology.id}
                            type="button"
                            className="advisor-project-chip active"
                            onClick={() => toggleProjectFormListValue('technologyIds', technology.id)}
                          >
                            {technology.name} x
                          </button>
                        ))
                    ) : (
                      <span>Henuz skill secilmedi.</span>
                    )}
                  </div>
                </div>

                <div className="advisor-admin-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creatingProject || loadingProjects}
                  >
                    {creatingProject ? 'Havuza ekleniyor...' : 'Projeyi havuza ekle'}
                  </button>
                </div>
              </form>
            </section>

            <section className="card workflow-status-card">
              <div className="section-header">
                <div>
                  <div className="dashboard-date">Benim projelerim</div>
                  <h2 className="section-title">Havuza eklenen projeler</h2>
                </div>
                <div className="section-summary-pill">{advisorProjects.length} proje</div>
              </div>

              {loadingProjects ? (
                <div className="card loading-card">Projeler yukleniyor...</div>
              ) : advisorProjects.length ? (
                <div className="advisor-admin-queue">
                  {advisorProjects.map((project) => (
                    <article key={project.id} className="advisor-admin-request">
                      <div className="advisor-admin-request-summary">
                        <div className="advisor-admin-request-summary-main">
                          <div className="advisor-admin-request-summary-cell">
                            <span>Proje</span>
                            <strong>{project.title}</strong>
                          </div>
                          <div className="advisor-admin-request-summary-cell">
                            <span>Kategori</span>
                            <strong>{project.category}</strong>
                          </div>
                          <div className="advisor-admin-request-summary-cell">
                            <span>Sure</span>
                            <strong>{project.estimatedWeeks} hafta</strong>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state empty-state-rich">
                  <strong>Henuz proje eklemedin.</strong>
                  <p>Ilk projeni eklediginde ogrenci havuzunda eslesmeye acilacak.</p>
                </div>
              )}
            </section>
          </section>
        ) : (
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
        )}
      </main>

      <AppFooter currentView={currentView} onViewChange={onViewChange} />
    </div>
  );
}

export default AdvisorDashboardPage;
