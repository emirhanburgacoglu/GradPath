import { useEffect, useMemo, useState } from 'react';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';
import api from '../api';

const advisorNavItems = [
  { id: 'dashboard', label: 'Talepler' },
  { id: 'students', label: 'Öğrenciler' },
  { id: 'projects', label: 'Projeler' },
  { id: 'profile', label: 'Profil' },
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

function buildProfileForm(profile) {
  return {
    fullName: profile?.fullName || '',
    academicTitle: profile?.academicTitle || '',
    expertiseAreas: profile?.expertiseAreas || '',
    officeLocation: profile?.officeLocation || '',
    profilePhotoUrl: profile?.profilePhotoUrl || '',
    shortBio: profile?.shortBio || '',
    maxConcurrentStudents: profile?.maxConcurrentStudents ?? 5,
    isAcceptingRequests: profile?.isAcceptingRequests ?? true,
  };
}

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

function buildProfileInitials(fullName) {
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
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(profile));
  const [savingProfile, setSavingProfile] = useState(false);

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
      setMessage(result?.message || 'Talep güncellenemedi.');
      return;
    }

    setMessage(
      action === 'approve'
        ? 'Talep onaylandı.'
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
    Pending: 'Onay bekleyen öğrenciler',
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
    Approved: 'Henüz onaylanan talep yok.',
    Rejected: 'Henüz reddedilen talep yok.',
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
      setMessage('Proje havuzu bilgileri şu an yüklenemiyor.');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (currentView === 'projects') {
      loadAdvisorProjects();
    }
  }, [currentView]);

  useEffect(() => {
    setProfileForm(buildProfileForm(profile));
  }, [profile]);

  const updateProjectForm = (field, value) => {
    setProjectForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateProfileForm = (field, value) => {
    setProfileForm((current) => ({
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
      setMessage('Başlık, açıklama ve kategori alanları zorunludur.');
      return;
    }

    if (!projectForm.technologyIds.length) {
      setMessage('Projenin öğrencilere önerilebilmesi için en az bir teknoloji seçmelisin.');
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
      setMessage('Proje havuza eklendi. Öğrenciler eşleşme listesinde görebilir.');
      await loadAdvisorProjects();
    } catch (createError) {
      const payload = createError?.response?.data;
      setMessage(typeof payload === 'string' ? payload : payload?.message || 'Proje havuza eklenemedi.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!profileForm.fullName.trim()) {
      setMessage('Ad soyad alanı zorunludur.');
      return;
    }

    setSavingProfile(true);
    setMessage('');

    try {
      await api.put('/advisors/me', {
        fullName: profileForm.fullName.trim(),
        academicTitle: profileForm.academicTitle.trim(),
        expertiseAreas: profileForm.expertiseAreas.trim(),
        officeLocation: profileForm.officeLocation.trim() || null,
        profilePhotoUrl: profileForm.profilePhotoUrl.trim() || null,
        shortBio: profileForm.shortBio.trim() || null,
        maxConcurrentStudents: Number(profileForm.maxConcurrentStudents),
        isAcceptingRequests: Boolean(profileForm.isAcceptingRequests),
      });

      setMessage('Profil bilgileri güncellendi.');
      await onRefresh?.(true);
    } catch (profileError) {
      const payload = profileError?.response?.data;
      setMessage(typeof payload === 'string' ? payload : payload?.message || 'Profil güncellenemedi.');
    } finally {
      setSavingProfile(false);
    }
  };

  const heroContent = {
    dashboard: {
      badge: 'Talepler',
      title: profile?.fullName || 'Danışman paneli',
      description: 'Gelen danışmanlık taleplerini incele, öğrenci notunu oku ve kararını aynı ekran üzerinden ver.',
    },
    projects: {
      badge: 'Proje Havuzu',
      title: 'Kendi proje ilanlarını yönet.',
      description: 'Bitirme projesi havuzuna yeni proje ekle, öğrencilerin bu projeleri görüp sana talep göndermesini sağla.',
    },
    profile: {
      badge: 'Profil',
      title: 'Danışman profilini güncelle.',
      description: 'Unvan, uzmanlık alanları, kontenjan ve talep kabul durumunu bu ekrandan düzenle.',
    },
  }[currentView] || {
    badge: 'Danışman Paneli',
    title: profile?.fullName || 'Danışman paneli',
    description: 'Danışmanlık sürecini tek panel üzerinden yönet.',
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
            <div className="hero-badge">{heroContent.badge}</div>
            <h1>{heroContent.title}</h1>
            <p>{heroContent.description}</p>
          </div>

          {currentView === 'dashboard' ? (
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
          ) : currentView === 'projects' ? (
            <div className="advisor-admin-stats">
              <div className="advisor-admin-stat">
                <span>Havuzdaki proje</span>
                <strong>{advisorProjects.length}</strong>
              </div>
              <div className="advisor-admin-stat">
                <span>Seçili skill</span>
                <strong>{projectForm.technologyIds.length}</strong>
              </div>
              <div className="advisor-admin-stat">
                <span>Kategori</span>
                <strong>{selectedTechnologyCategory || '-'}</strong>
              </div>
              <div className="advisor-admin-stat">
                <span>Durum</span>
                <strong>Aktif</strong>
              </div>
            </div>
          ) : (
            <div className="advisor-admin-stats">
              <div className="advisor-admin-stat">
                <span>Kontenjan</span>
                <strong>{profile?.maxConcurrentStudents ?? '-'}</strong>
              </div>
              <div className="advisor-admin-stat">
                <span>Talep durumu</span>
                <strong>{profile?.isAcceptingRequests ? 'Açık' : 'Kapalı'}</strong>
              </div>
              <div className="advisor-admin-stat">
                <span>Bölüm</span>
                <strong>{profile?.departmentCode || '-'}</strong>
              </div>
              <div className="advisor-admin-stat">
                <span>Kaynak</span>
                <strong>{profile?.sourceUrl ? 'Avesis' : 'Manuel'}</strong>
              </div>
            </div>
          )}
        </section>

        {currentView === 'profile' ? (
          <section className="advisor-admin-main">
            <section className="card workflow-status-card">
              <div className="section-header">
                <div>
                  <div className="dashboard-date">Danışman profili</div>
                  <h2 className="section-title">Profil bilgilerini düzenle</h2>
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setProfileForm(buildProfileForm(profile))}
                  disabled={savingProfile}
                >
                  Sıfırla
                </button>
              </div>

              <form className="advisor-project-form" onSubmit={handleSaveProfile}>
                <div className="advisor-profile-preview">
                  {profileForm.profilePhotoUrl ? (
                    <img
                      className="advisor-profile-preview-photo"
                      src={profileForm.profilePhotoUrl}
                      alt={`${profileForm.fullName || 'Danışman'} profil fotoğrafı`}
                    />
                  ) : (
                    <div className="advisor-profile-preview-photo advisor-profile-preview-fallback">
                      {buildProfileInitials(profileForm.fullName)}
                    </div>
                  )}

                  <div className="advisor-profile-preview-copy">
                    <strong>
                      {profileForm.academicTitle ? `${profileForm.academicTitle} ` : ''}
                      {profileForm.fullName || 'Danışman profili'}
                    </strong>
                    <span>{profile?.departmentName || 'Bölüm bilgisi yok'}</span>
                    {profileForm.expertiseAreas ? <small>{profileForm.expertiseAreas}</small> : null}
                  </div>
                </div>

                <div className="advisor-project-form-grid">
                  <label className="advisor-admin-input-block">
                    <span>Ad soyad</span>
                    <input
                      className="form-input"
                      value={profileForm.fullName}
                      onChange={(event) => updateProfileForm('fullName', event.target.value)}
                    />
                  </label>

                  <label className="advisor-admin-input-block">
                    <span>Akademik unvan</span>
                    <input
                      className="form-input"
                      value={profileForm.academicTitle}
                      onChange={(event) => updateProfileForm('academicTitle', event.target.value)}
                      placeholder="Dr. Öğr. Üyesi, Doç. Dr..."
                    />
                  </label>

                  <label className="advisor-admin-input-block">
                    <span>Kontenjan</span>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="20"
                      value={profileForm.maxConcurrentStudents}
                      onChange={(event) => updateProfileForm('maxConcurrentStudents', event.target.value)}
                    />
                  </label>
                </div>

                <label className="advisor-admin-input-block">
                  <span>Uzmanlık alanları</span>
                  <input
                    className="form-input"
                    value={profileForm.expertiseAreas}
                    onChange={(event) => updateProfileForm('expertiseAreas', event.target.value)}
                    placeholder="Yapay zeka, görüntü işleme, veri madenciliği..."
                  />
                </label>

                <div className="advisor-project-form-grid">
                  <label className="advisor-admin-input-block">
                    <span>Ofis bilgisi</span>
                    <input
                      className="form-input"
                      value={profileForm.officeLocation}
                      onChange={(event) => updateProfileForm('officeLocation', event.target.value)}
                    />
                  </label>

                  <label className="advisor-admin-input-block">
                    <span>Profil fotoğrafı URL</span>
                    <input
                      className="form-input"
                      value={profileForm.profilePhotoUrl}
                      onChange={(event) => updateProfileForm('profilePhotoUrl', event.target.value)}
                    />
                  </label>

                  <label className="advisor-admin-input-block advisor-profile-switch">
                    <span>Talep kabul durumu</span>
                    <button
                      type="button"
                      className={`advisor-toggle-switch ${profileForm.isAcceptingRequests ? 'active' : ''}`}
                      aria-pressed={profileForm.isAcceptingRequests}
                      onClick={() =>
                        updateProfileForm('isAcceptingRequests', !profileForm.isAcceptingRequests)
                      }
                    >
                      <span className="advisor-toggle-switch-track">
                        <span className="advisor-toggle-switch-knob" />
                      </span>
                      <strong>
                        {profileForm.isAcceptingRequests ? 'Talep kabul ediyor' : 'Talep kabul etmiyor'}
                      </strong>
                    </button>
                  </label>
                </div>

                <label className="advisor-admin-input-block">
                  <span>Kısa biyografi</span>
                  <textarea
                    className="advisor-admin-textarea"
                    rows={5}
                    value={profileForm.shortBio}
                    onChange={(event) => updateProfileForm('shortBio', event.target.value)}
                    placeholder="Öğrencilerin seni ve çalışma alanlarını hızlıca tanıması için kısa bir metin yaz."
                  />
                </label>

                <div className="advisor-admin-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Kaydediliyor...' : 'Profili kaydet'}
                  </button>
                </div>
              </form>
            </section>
          </section>
        ) : currentView === 'projects' ? (
          <section className="advisor-admin-main">
            <section className="card workflow-status-card">
              <div className="section-header">
                <div>
                  <div className="dashboard-date">Proje havuzu</div>
                  <h2 className="section-title">Kendi proje ilanını aç</h2>
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={loadAdvisorProjects}
                  disabled={loadingProjects}
                >
                  {loadingProjects ? 'Yükleniyor...' : 'Yenile'}
                </button>
              </div>

              <form className="advisor-project-form" onSubmit={handleCreateProject}>
                <label className="advisor-admin-input-block">
                  <span>Proje başlığı</span>
                  <input
                    className="form-input"
                    value={projectForm.title}
                    onChange={(event) => updateProjectForm('title', event.target.value)}
                    placeholder="Örn. Yapay zeka destekli sera izleme sistemi"
                  />
                </label>

                <label className="advisor-admin-input-block">
                  <span>Proje açıklaması</span>
                  <textarea
                    className="advisor-admin-textarea"
                    rows={4}
                    value={projectForm.description}
                    onChange={(event) => updateProjectForm('description', event.target.value)}
                    placeholder="Öğrencinin projeyi anlayabilmesi için kısa ve net bir açıklama yaz."
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
                      <option value={3}>Zorlayıcı</option>
                    </select>
                  </label>

                  <label className="advisor-admin-input-block">
                    <span>Tahmini süre</span>
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
                    <strong>Bölümler</strong>
                    <span>Seçilmezse kendi bölümün kullanılır</span>
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
                    <span>En az bir tane seç</span>
                  </div>

                  <div className="advisor-project-select-grid">
                    <label className="advisor-admin-input-block">
                      <span>Kategori seç</span>
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
                      <span>Skill seç</span>
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
                        <option value="">Skill seçiniz</option>
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
                      <span>Henüz skill seçilmedi.</span>
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
                <div className="card loading-card">Projeler yükleniyor...</div>
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
                            <span>Süre</span>
                            <strong>{project.estimatedWeeks} hafta</strong>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state empty-state-rich">
                  <strong>Henüz proje eklemedin.</strong>
                  <p>İlk projeni eklediğinde öğrenci havuzunda eşleşmeye açılacak.</p>
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
                {loading ? 'Yükleniyor...' : 'Yenile'}
              </button>
            </div>

            {loading ? (
              <div className="card loading-card">Talepler yükleniyor...</div>
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
                      ? 'Onaylandı'
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
                            <span>Öğrenci</span>
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
                            aria-label={isExpanded ? 'Talep detayını kapat' : 'Talep detayını aç'}
                          >
                            {isExpanded ? '-' : '+'}
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="advisor-admin-request-details">
                          <div className="advisor-admin-meta">
                            <span>
                              <strong>Bölüm:</strong>{' '}
                              {request.studentDepartmentName || 'Bölüm bilgisi yok'}
                            </span>
                          </div>

                          <div className="advisor-admin-note-box">
                            <strong>Öğrenci açıklaması</strong>
                            <p>{request.studentNote || 'Öğrenci bu talep için not bırakmadı.'}</p>
                          </div>

                          {request.status === 'Pending' ? (
                            <>
                              <label className="advisor-admin-input-block">
                                <span>Danışman notu</span>
                                <textarea
                                  className="advisor-admin-textarea"
                                  rows={4}
                                  placeholder="Onay veya red kararın için kısa bir açıklama yazabilirsin."
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
                                  {activeAction === approveKey ? 'Onaylanıyor...' : 'Onayla'}
                                </button>
                              </div>
                            </>
                          ) : request.advisorNote ? (
                            <div className="advisor-admin-note-box">
                              <strong>Danışman notu</strong>
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
                    ? 'Yeni talepler geldiğinde burada alt alta listelenecek.'
                    : 'Bu durumdaki talepler oluştukça bu listede görülecek.'}
                </p>
              </div>
            )}
          </section>

        </section>
        )}
      </main>

      <AppFooter currentView={currentView} navItems={advisorNavItems} onViewChange={onViewChange} />
    </div>
  );
}

export default AdvisorDashboardPage;
